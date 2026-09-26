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
const RATE_LIMIT = 6;
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
  cache = { answers: doc.answers ?? [], index: buildIndex(doc.answers ?? []) };
  return cache;
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
const buildRouterPrompt = (catalogue) => `You match a visitor's question to one of Omar Tavarez's pre-written answers.

Reply with exactly one id from the list below, or the single word NONE. No punctuation, no explanation, no other text.

Match on what the visitor is actually asking, not on shared words. "is he a manager" is asking about his level and leadership, not about opinions of employers. Choose NONE unless one of these answers genuinely addresses the question — a confident wrong match is worse than NONE, because the visitor is told something that does not answer them.

ANSWERS:
${catalogue}`;

/** Everything the model is allowed to know, and the rules it answers under. */
const buildPrompt = (context) => `You answer questions about Omar Tavarez on his portfolio site, using ONLY the reviewed answers provided below.

Rules, in order of importance:
1. Use only what the reviewed answers state. Never add a number, a client name, a date, a job title or an outcome that does not appear in them.
2. If the reviewed answers do not cover the question, say so plainly in one sentence and suggest emailing omar@designedbyomar.com. Do not improvise an answer.
3. Write in the third person: "Omar", "he". Never "I".
4. Be brief — 60 to 110 words, plain prose, no headings, no bullet lists, no marketing language.
5. Do not claim anything is projected, planned or measured unless the reviewed answers say so.

REVIEWED ANSWERS:
${context}`;

export const createHandler = ({
  generate = generateFromGroq,
  route = routeWithGroq,
  hasApiKey = () => Boolean(process.env.GROQ_API_KEY),
  loadAnswers = fetchAnswers,
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

  let approved, index;
  try {
    ({ answers: approved, index } = await loadAnswers(request.url));
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

  // 2. Ask the router which written answer this is, if any. It sees every
  // question in the set, because the right answer often shares no vocabulary
  // with how the visitor phrased it — for "is he a manager" the correct answer
  // is not even among the nearest three by overlap.
  let declined = false;
  if (!unavailable) {
    try {
      const raw = await route({
        system: buildRouterPrompt(approved.map(a => `${a.id}: ${a.question}`).join('\n')),
        prompt: question,
      });
      // Validated against the set rather than trusted: a model can return an id
      // that does not exist, and that must not become a 500 or an empty answer.
      const text = String(raw ?? '').trim();
      const picked = approved.find(a => a.id === text.replace(/[^A-Za-z0-9-]/g, ''));
      if (picked) return reviewed(picked, 'router');

      // Only an explicit NONE is a decision. The router saw all of them and
      // judged, which outranks token overlap, so drafting is next.
      //
      // Everything else — empty, truncated, a stray token — decided nothing,
      // and must not be read as a decision. Treating those as NONE threw away
      // an answer the site already had, turning a question it could answer into
      // an unreviewed draft on a malformed response.
      if (/\bnone\b/i.test(text)) declined = true;
    } catch {
      // Timed out, rate limited upstream, provider down. Nothing was decided,
      // so the local hit is still the best available answer.
    }
  }

  // 3. Routing could not run. Serve the local match if there was one, so the
  // feature is never worse than it was before routing existed.
  if (!declined && local) return local();

  // 4. Nothing written covers it. Gather the nearest reviewed answers as
  // grounding. Every entry is text the model may draw from, so all of them are
  // ranked by relevance.
  const context = rankNearest(question, index, CONTEXT_ANSWERS);
  const sources = [...new Set(context.flatMap(a => a.sources ?? []))];

  // No reviewed answer shares any vocabulary with the question, so there is
  // nothing to ground a reply in. Asking the model anyway would mean asking it
  // to speak from an empty context, which is the one thing this design exists
  // to prevent.
  if (!context.length) return textResponse('', 'fallback');
  if (unavailable) return textResponse('', 'fallback', sources);

  try {
    const stream = await generate({
      system: buildPrompt(context.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')),
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
