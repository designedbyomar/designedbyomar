/**
 * The Ask endpoint.
 *
 * Reviewed answers do all the work they can. A model is only asked anything
 * when the written set has no answer at all — which is exactly where
 * `ask_no_match` fires today — and even then it may only speak from the
 * reviewed answers it is handed.
 *
 * Three outcomes, in order of preference:
 *
 *   reviewed  — the matcher found a written answer. Returned verbatim. No
 *               model call, no cost, no possibility of drift.
 *   generated — nothing matched. The nearest reviewed answers are passed to
 *               Groq to draft a reply grounded in them, and the client labels
 *               it as unreviewed.
 *   fallback  — anything went wrong: no key, rate limited, provider down,
 *               too slow. Returns what the site did before this endpoint
 *               existed, so the feature degrades instead of breaking.
 *
 * Metadata travels in headers so the body can stay a plain text stream the
 * client reads incrementally, with no SDK on the browser side.
 */
import { groq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import { buildIndex, matchQuestion, rankNearest } from '../src/ask.mjs';
import { buildSourceIndex, retrieveSections } from '../src/ask-sources.mjs';

export const config = { runtime: 'edge' };

/**
 * The only place the provider is touched. Injectable so the routing logic can
 * be tested without a key, a network, or module mocking — and so swapping
 * provider is a change to this function alone.
 */
const generateFromGroq = ({ system, prompt }) => streamText({
  model: groq(MODEL),
  system,
  prompt,
  temperature: 0.2,
  maxOutputTokens: 200,
  abortSignal: AbortSignal.timeout(TIMEOUT_MS),
}).textStream;

/**
 * Routing is a different job from writing, on a different model.
 *
 * It returns an id, so it wants determinism and speed, not prose — hence
 * temperature 0, a 20-token ceiling and a much shorter timeout. Groq meters
 * per model, so routing does not draw down the budget the drafting model
 * needs, and a routing outage cannot take drafting with it.
 */
const routeWithGroq = async ({ system, prompt }) => {
  const { text } = await generateText({
    model: groq(ROUTER_MODEL),
    system,
    prompt,
    temperature: 0,
    maxOutputTokens: 20,
    abortSignal: AbortSignal.timeout(ROUTER_TIMEOUT_MS),
  });
  return text;
};

const MODEL = 'llama-3.3-70b-versatile';
const ROUTER_MODEL = 'llama-3.1-8b-instant';
const CONTEXT_ANSWERS = 3;
// Four excerpts of at most 180 words each, so the material stays well inside
// one request's budget even when the router names two studies.
const SOURCE_SECTIONS = 4;
const MAX_QUESTION_CHARS = 400;
const TIMEOUT_MS = 8000;
// Routing sits in front of every typed question, so it gets a much tighter
// budget than drafting: past this the visitor is better served by the local
// match than by waiting.
const ROUTER_TIMEOUT_MS = 3000;
// How long to wait for a draft's first chunk before giving up on it. Inside
// TIMEOUT_MS, since a provider that has sent nothing by now is not going to
// finish in time either.
const FIRST_CHUNK_TIMEOUT_MS = 6000;

/** Per-visitor ceiling, so one person cannot drain the daily free quota. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

// Best-effort only: edge instances are ephemeral and regional, so this caps a
// single hot instance rather than enforcing a global budget. The real
// protection is that exhausting the quota returns `fallback`, not an error.
const hits = new Map();

const rateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
};

/**
 * The answers are fetched from the published file rather than imported.
 *
 * Two reasons. Vercel's function bundler rejects the `with { type: 'json' }`
 * attribute that Node requires for a JSON import, so importing the source is
 * not portable. And the published file is the one `postbuild.js` filters to
 * approved answers only — consuming it means a draft cannot reach this
 * endpoint even by mistake, which importing the source would not guarantee.
 *
 * Cached in module scope, so this costs one same-origin CDN fetch per cold
 * start and nothing thereafter.
 */
let cache = null;

const fetchAnswers = async (origin) => {
  if (cache) return cache;
  const response = await fetch(new URL('/ask-answers.json', origin));
  if (!response.ok) throw new Error(`ask-answers.json: ${response.status}`);
  const doc = await response.json();
  cache = {
    answers: doc.answers ?? [],
    index: buildIndex(doc.answers ?? []),
    studies: doc.studies ?? [],
  };
  return cache;
};

/**
 * The case studies, chunked for retrieval. Cached the same way and fetched
 * separately, because a question that a written answer covers never needs it —
 * only a draft does, and drafts are the uncommon path.
 *
 * A failure here is not fatal: drafting falls back to the reviewed answers
 * alone, which is what it had before this existed.
 */
let sourceCache = null;

const fetchSources = async (origin) => {
  if (sourceCache) return sourceCache;
  const response = await fetch(new URL('/ask-sources.json', origin));
  if (!response.ok) throw new Error(`ask-sources.json: ${response.status}`);
  const doc = await response.json();
  const sections = doc.sections ?? [];
  sourceCache = { sections, index: buildSourceIndex(sections) };
  return sourceCache;
};

// `matchedBy` records which mechanism chose a reviewed answer — exact, router
// or the local overlap fallback. Without it the three are indistinguishable at
// the client, and whether routing is actually an improvement is unanswerable.
const headers = (source, sources, answerId = '', matchedBy = '') => ({
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Ask-Source': source,
  'X-Ask-Sources': sources.join(','),
  'X-Ask-Answer-Id': answerId,
  'X-Ask-Matched-By': matchedBy,
});

const textResponse = (body, source, sources = [], answerId = '', matchedBy = '') =>
  new Response(body, { status: 200, headers: headers(source, sources, answerId, matchedBy) });

const hasText = (chunk) => typeof chunk === 'string'
  ? chunk.length > 0
  : chunk instanceof Uint8Array && chunk.byteLength > 0;

/**
 * Waiting for the first chunk is bounded here rather than relying on the
 * provider.
 *
 * `generateFromGroq` already passes an AbortSignal, so a stalled stream does
 * abort in production — but `generate` is injectable, and that guarantee also
 * assumes the SDK propagates the abort into the text stream rather than only
 * into the upstream fetch. This depends on neither. It bounds time-to-first-
 * chunk only: once text is flowing the timer is cleared, so a long reply is
 * never cut off mid-sentence.
 */
const readUntilText = async (stream) => {
  const reader = stream.getReader();
  const buffered = [];

  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    reader.cancel().catch(() => {});
  }, FIRST_CHUNK_TIMEOUT_MS);

  try {
    while (true) {
      const result = await reader.read();
      if (expired) return null;
      if (result.done) return null;
      buffered.push(result.value);
      if (hasText(result.value)) break;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }

  return new ReadableStream({
    start(controller) {
      for (const chunk of buffered) controller.enqueue(chunk);

      const pump = async () => {
        try {
          while (true) {
            const result = await reader.read();
            if (result.done) {
              controller.close();
              return;
            }
            controller.enqueue(result.value);
          }
        } catch (error) {
          controller.error(error);
        }
      };

      pump();
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
};

/**
 * The catalogue the router chooses from: every approved question, by id.
 *
 * Questions only, not aliases or answers. A model handles paraphrase natively,
 * so aliases add nothing and nearly triple the prompt; answer bodies would add
 * text the router might be tempted to quote, and it is not being asked to write.
 */
const buildRouterPrompt = (catalogue, studies) => `You route a visitor's question about Omar Tavarez's portfolio.

Reply with exactly one line, in one of these three forms and nothing else:

ANSWER: <id>            — one id from ANSWERS, when that answer genuinely answers the question
SOURCES: <id>,<id>      — one or two ids from CASE STUDIES, when no written answer fits but those studies contain the material
NONE                    — when neither applies

Prefer ANSWER only when the written answer actually answers what was asked. Match on meaning, not shared words: "is he a manager" asks about his level and leadership, not about opinions of employers. A confident wrong match is worse than no match, because the visitor is told something that does not answer them.

Otherwise prefer SOURCES. The case studies do not use the vocabulary visitors do — none of them contains the word "fintech", for example — so you are the one who knows which study covers a subject. A reply will be drafted from the studies you name, so naming the right ones matters more than naming several.

ANSWERS:
${catalogue}

CASE STUDIES:
${studies}`;

/**
 * Drafting.
 *
 * The model is given the nearest reviewed answers *and* excerpts from the case
 * studies the router named. Before, it saw only the answers — a few hundred
 * words of summary — so the best it could do was restate an answer that already
 * existed, which is not what someone asking something new wants. It can now
 * write something new, while every sentence still traces to published prose.
 */
const buildPrompt = (context) => `You answer questions about Omar Tavarez on his portfolio site, using ONLY the material provided below.

The material is of two kinds. REVIEWED ANSWERS are already written and approved. CASE STUDY EXCERPTS are from the published case studies — use them to write an answer to the question actually asked, rather than repeating an answer that addresses something else.

Rules, in order of importance:
1. Use only what the material states. Never add a number, a client name, a date, a job title or an outcome that does not appear in it.
2. Answer the question that was asked. If the material does not cover it, say so plainly in one sentence and suggest emailing omar@designedbyomar.com. Do not improvise, and do not answer a different question because it is the one you have material for.
3. Write in the third person: "Omar", "he". Never "I".
4. Be brief — 60 to 110 words, plain prose, no headings, no bullet lists, no marketing language.
5. Do not claim anything is projected, planned or measured unless the material says so.

${context}`;

export const createHandler = ({
  generate = generateFromGroq,
  route = routeWithGroq,
  hasApiKey = () => Boolean(process.env.GROQ_API_KEY),
  loadAnswers = fetchAnswers,
  loadSources = fetchSources,
} = {}) => async function handler(request) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try {
    body = await request.json();
  } catch {
    return textResponse('', 'fallback');
  }
  const question = String(body?.question ?? '').trim().slice(0, MAX_QUESTION_CHARS);
  if (!question) return textResponse('', 'fallback');

  let approved, index, studies;
  try {
    ({ answers: approved, index, studies = [] } = await loadAnswers(request.url));
  } catch {
    return textResponse('', 'fallback');
  }
  if (!approved.length) return textResponse('', 'fallback');

  const reviewed = (answer, matchedBy) =>
    textResponse(answer.answer, 'reviewed', answer.sources ?? [], answer.id, matchedBy);

  // 1. An exact hit — the typed string is a question or alias verbatim. The one
  // case token overlap cannot get wrong, so it is answered without a model.
  const hit = matchQuestion(question, index);
  if (hit?.exact) return reviewed(hit.answer, 'exact');

  // A non-exact hit is held, not returned. Token overlap is confidently wrong
  // often enough that it is the fallback for a routing failure, not the answer:
  // "is he a manager" scored 1.00 against a refusal answer.
  const local = hit ? () => reviewed(hit.answer, 'local') : null;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Counted once per request, before any model is touched, so a question that
  // routes and then drafts still costs the visitor one of their six.
  const unavailable = !hasApiKey() || rateLimited(ip);

  // 2. Ask the router what this question needs. It sees every written question,
  // because the right answer often shares no vocabulary with how the visitor
  // phrased it, and every case study, because the studies do not use a
  // visitor's vocabulary either — "fintech" appears in none of them.
  let declined = false;
  let named = [];
  if (!unavailable) {
    try {
      const raw = await route({
        system: buildRouterPrompt(
          approved.map(a => `${a.id}: ${a.question}`).join('\n'),
          studies.map(c => `${c.id}: ${c.title} [${(c.tags ?? []).join(', ')}] — ${c.summary}`).join('\n'),
        ),
        prompt: question,
      });
      // Validated against the sets rather than trusted: a model can return an
      // id that does not exist, and that must not become a 500 or an empty
      // answer.
      const text = String(raw ?? '').trim();

      const answerId = /^ANSWER:\s*(.+)$/im.exec(text)?.[1] ?? text;
      const picked = approved.find(a => a.id === answerId.trim().replace(/[^A-Za-z0-9-]/g, ''));
      if (picked) return reviewed(picked, 'router');

      const sourceList = /^SOURCES:\s*(.+)$/im.exec(text)?.[1];
      if (sourceList) {
        named = sourceList
          .split(',')
          .map(id => id.trim().replace(/[^A-Za-z0-9-]/g, ''))
          .filter(id => studies.some(c => c.id === id))
          .slice(0, 2);
      }

      // A decision was made when the router named sources or said NONE. Either
      // way it looked at everything and concluded no written answer fits, which
      // outranks token overlap — so drafting is next rather than the held local
      // match.
      //
      // Everything else — empty, truncated, a stray token — decided nothing,
      // and must not be read as a decision. Treating those as NONE threw away
      // an answer the site already had.
      if (named.length || /\bnone\b/i.test(text)) declined = true;
    } catch {
      // Timed out, rate limited upstream, provider down. Nothing was decided.
    }
  }

  // 3. Nothing judged this question — the router could not run, or answered
  // with something unreadable.
  //
  // Neither serve a loose overlap match nor draft. A loose match is exactly
  // what this endpoint exists to stop serving: "what is the strongest fintech
  // case study he has" scores 0.56 against the Wisdom Management Portal, which
  // is healthcare. And drafting without the router means drafting without
  // knowing which case studies are relevant, since the studies do not use a
  // visitor's vocabulary — so it would be guessing too, at more cost.
  //
  // An exact hit was already served at step 1 and never reaches here. The
  // written miss, with the nearest case study and an email route, is what is
  // left, and it is the honest answer.
  //
  // This reverses an earlier decision to always fall back to the local match.
  // That was meant to keep the feature no worse than before routing existed —
  // but before routing existed was the broken state, and this is the path where
  // it kept resurfacing.
  if (!declined && !named.length) {
    return textResponse('', 'fallback', local ? hit.answer.sources ?? [] : []);
  }

  // 4. Draft. Grounded in the reviewed answers nearest the question, plus
  // excerpts from the case studies the router named — without those the model
  // could only restate an answer that already exists, which is not what someone
  // asking something new is after.
  // When the router named studies it has already judged that no written answer
  // fits. Including the three nearest answers regardless puts the very prose it
  // rejected back in front of the model — which is how a fintech question got
  // an answer about dental offices. Only answers about the named studies stay.
  const nearest = rankNearest(question, index, CONTEXT_ANSWERS);
  const context = named.length
    ? nearest.filter(a => (a.sources ?? []).some(id => named.includes(id)))
    : nearest;
  let sections = [];
  if (named.length) {
    try {
      const { index: sourceIndex } = await loadSources(request.url);
      sections = retrieveSections(question, sourceIndex, { limit: SOURCE_SECTIONS, caseStudies: named });
    } catch {
      // The sources file is unreachable. Drafting still works from the reviewed
      // answers alone, which is what it did before retrieval existed.
    }
  }

  // Citations follow what the draft actually drew on.
  //
  // An answer is kept as context when it cites *any* named study, but 19 of the
  // 48 cite more than one — `work-history` cites three — so taking all of their
  // sources put links in front of the visitor to studies the router never chose
  // and retrieval never opened. Intersected with what was named, since that is
  // the material the draft actually saw.
  const answerSources = context.flatMap(a => a.sources ?? []);
  const sources = [...new Set([
    ...sections.map(section => section.caseStudy),
    ...(named.length ? answerSources.filter(id => named.includes(id)) : answerSources),
  ])];

  // Nothing shares any vocabulary with the question and the router named
  // nothing, so there is nothing to ground a reply in. Asking the model anyway
  // would mean asking it to speak from an empty context, which is the one thing
  // this design exists to prevent.
  if (!context.length && !sections.length) return textResponse('', 'fallback');
  if (unavailable) return textResponse('', 'fallback', sources);

  const material = [
    context.length
      ? `REVIEWED ANSWERS:\n${context.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}`
      : '',
    sections.length
      ? `CASE STUDY EXCERPTS:\n${sections.map(sec => `${sec.title} — ${sec.heading}\n${sec.text}`).join('\n\n')}`
      : '',
  ].filter(Boolean).join('\n\n');

  try {
    const stream = await generate({
      system: buildPrompt(material),
      prompt: question,
    });
    const responseStream = await readUntilText(stream);
    if (!responseStream) return textResponse('', 'fallback', sources);
    return new Response(responseStream, { status: 200, headers: headers('generated', sources) });
  } catch {
    return textResponse('', 'fallback', sources);
  }
};

export default createHandler();
