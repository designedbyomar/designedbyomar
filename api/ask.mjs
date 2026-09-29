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
 *   generated — nothing matched, but the router named relevant case studies.
 *               Their published material is passed to Groq and the client
 *               labels the reply as unreviewed.
 *   fallback  — anything went wrong: no key, rate limited, provider down,
 *               too slow. Returns an honest no-answer state with no citations,
 *               so a dependency failure cannot turn into an unsupported claim.
 *
 * Metadata travels in headers so the body can stay a plain text stream the
 * client reads incrementally, with no SDK on the browser side.
 */
import { groq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import { buildIndex, matchQuestion, rankNearest } from '../src/ask.mjs';
import { buildSourceIndex, retrieveSections } from '../src/ask-sources.mjs';

export const config = { runtime: 'edge' };

/*
  Reasoning is hidden from the text, and kept to the shortest the model allows.

  Both models reason before answering and the previous ones did not, so those
  tokens come out of the same allowance as the answer — which is why the
  ceilings below are far above what the output alone costs.

  `hidden` keeps the thinking out of `text`, so neither the parser nor the
  reader sees it. The cost is that nothing is emitted until the thinking
  finishes: time-to-first-token becomes the whole reasoning phase, which is why
  the first-chunk budget is as large as it is.

  `low` is the floor here, not a preference. GPT-OSS accepts only low, medium
  and high — `none` and `default` are Qwen-only, and sending `none` is rejected
  outright. The provider's own type union lists all five because it spans every
  Groq model; reading that union instead of the model's constraints is what
  suggested otherwise, the same mistake as reading the published model list and
  assuming this account could reach everything on it.
*/
export const REASONING = { groq: { reasoningFormat: 'hidden', reasoningEffort: 'low' } };

// What each model family actually accepts, as distinct from what the provider's
// type union will let you write.
export const SUPPORTED_EFFORT = {
  'openai/gpt-oss': ['low', 'medium', 'high'],
  qwen: ['none', 'default', 'low', 'medium', 'high'],
};

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
  // 60–110 words of prose is about 150 tokens, so 200 left almost no headroom
  // even before reasoning had to fit alongside it.
  maxOutputTokens: DRAFT_TOKENS,
  providerOptions: REASONING,
  // One retry, not the SDK's default of two. Each retry costs another full
  // timeout, and production logged eight in a single request.
  maxRetries: 1,
  abortSignal: AbortSignal.timeout(TIMEOUT_MS),
}).textStream;

/**
 * Routing is a different job from writing, on a different model.
 *
 * It returns one line, so it wants determinism and speed, not prose — hence
 * temperature 0 and a shorter timeout. Groq meters per model, so routing does
 * not draw down the budget drafting needs, and a routing outage cannot take
 * drafting with it.
 *
 * The ceiling is far above what one line costs. Nothing is charged for tokens
 * that are not generated, and the alternative failure — truncating before the
 * answer — is invisible.
 */
const routeWithGroq = async ({ system, prompt }) => {
  const { text } = await generateText({
    model: groq(ROUTER_MODEL),
    system,
    prompt,
    temperature: 0,
    maxOutputTokens: ROUTE_TOKENS,
    providerOptions: REASONING,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(ROUTER_TIMEOUT_MS),
  });
  return text;
};

/*
  Both previous models returned 404 from Groq in production —
  "does not exist or you do not have access to it" — which is a permanent,
  silent failure: the request never errors, it just degrades, so the feature
  switched itself off and looked like a quiet day. The runtime logs named it
  once the logging landed.

  `llama-3.1-8b-instant` was announced for deprecation in June and shut down on
  16 August 2026, with `openai/gpt-oss-20b` given as its replacement.
  `llama-3.3-70b-versatile` is not listed as deprecated, but returns the same
  404 for this account, so it is not something this can depend on either.

  Overridable by environment variable, because this is the second time a model
  id has expired underneath the site and a retirement should not need a code
  change and a deploy to survive. Defaults are the current production models.
*/
export const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
export const ROUTER_MODEL = process.env.GROQ_ROUTER_MODEL || 'openai/gpt-oss-20b';

// Output ceilings, exported so a test can check them rather than read the file.
export const DRAFT_TOKENS = 700;
export const ROUTE_TOKENS = 256;

/*
  Model ids known not to work here — which is not the same as "retired", and the
  difference is worth keeping straight for whoever reads this next.

  Most of these Groq has decommissioned outright. `llama-3.3-70b-versatile` has
  not been: it is still listed as current, still in the provider's own model
  union, and still returns 404 for this account. Someone going looking for its
  deprecation notice will not find one.

  Either way it must not come back. The list existed without it, which meant
  restoring the id that actually caused the outage would have passed the guard
  built to prevent it.
*/
export const UNUSABLE_MODELS = new Set([
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'llama-3.3-70b-versatile',
  'llama-3.3-70b-specdec',
  'mixtral-8x7b-32768',
  'gemma-7b-it',
]);
const CONTEXT_ANSWERS = 3;
// Four excerpts of at most 180 words each, so the material stays well inside
// one request's budget even when the router names two studies.
const SOURCE_SECTIONS = 4;
const MAX_QUESTION_CHARS = 400;
const TIMEOUT_MS = 15000;
// Routing sits in front of every typed question, so it stays tighter than
// drafting. Four seconds leaves room for a cold edge instance while ensuring a
// failed decision returns a controlled fallback before the platform can turn it
// into a gateway timeout.
//
// Each stage has its own timer, not a shared deadline: routing and drafting run
// serially, and drafting's clock only starts once routing has returned. The
// worst case is therefore additive, before the answer and source fetches:
// response headers wait at most ROUTER_TIMEOUT_MS + FIRST_CHUNK_TIMEOUT_MS
// (15s), and the stream ends by ROUTER_TIMEOUT_MS + TIMEOUT_MS (19s). Both sit
// inside the 25 seconds Vercel's edge runtime allows before a response must
// begin. Raising any of these three means re-checking that sum.
//
// Each signal bounds its whole call, retries included, so one retry does not
// double the wait.
export const ROUTER_TIMEOUT_MS = 4000;
// How long to wait for a draft's first chunk before giving up on it. Inside
// TIMEOUT_MS, since a provider that has sent nothing by now is not going to
// finish in time either.
const FIRST_CHUNK_TIMEOUT_MS = 11000;

/**
 * Per-visitor ceiling, so one person cannot drain the daily free quota.
 *
 * Generous enough that reading the page and trying a handful of questions does
 * not hit it. Exhausting it is now reported as `rate-limited` rather than
 * looking identical to the feature being broken, which is how ten went unnoticed
 * as being too few.
 */
const RATE_LIMIT = 25;
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

// Loose on purpose: it only has to reject junk, not prove an address routable.
const IP_SHAPE = /^[0-9a-f.:]{2,45}$/i;

/*
  The key the rate limit counts against. The leftmost `x-forwarded-for` entry is
  whatever the client typed, so reading it let one visitor rotate through
  unlimited buckets. Vercel's edge sets `x-vercel-forwarded-for` and `x-real-ip`
  itself, so those win. Failing both, the rightmost forwarded entry is the one
  the nearest proxy appended, which the client cannot choose. Anything that is
  not shaped like an address shares one bucket rather than minting a new one.
*/
const clientKey = (request) => {
  const { headers } = request;
  const platform = (headers.get('x-vercel-forwarded-for') ?? headers.get('x-real-ip'))
    ?.split(',')[0]?.trim();
  const forwarded = headers.get('x-forwarded-for')
    ?.split(',').map(part => part.trim()).filter(Boolean).at(-1);
  const ip = platform || forwarded;
  return ip && IP_SHAPE.test(ip) ? ip.toLowerCase() : 'unknown';
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
 * A failure here is not fatal only when an already-reviewed answer is entirely
 * grounded in the studies the router named. The source boundary is never
 * widened merely because retrieval failed.
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

/**
 * Not every reason belongs in a reply to an anonymous caller.
 *
 * Three of these describe the visitor's own situation rather than this
 * endpoint's internals, and are worth keeping precise everywhere: what they
 * asked for was malformed, they have spent their allowance, or the site
 * genuinely has nothing written on the subject. `router-sourced` says where
 * the material for a successfully drafted reply came from.
 */
const PUBLIC_REASONS = new Set([
  '',
  'bad-request',
  'rate-limited',
  'no-material',
  'router-sourced',
]);

/**
 * The rest — `no-key`, `answers-unavailable`, `router-error`, `provider-error`
 * — say which dependency this endpoint has and whether it is currently up. The
 * code is public, so the architecture is not the secret; the live health of it
 * is, and a header anyone can poll for it is a free availability monitor, one
 * that `no-store` does not stop an intermediary from reading.
 *
 * So production ships a bucket instead: `unavailable` when the request fell
 * back and `degraded` for any future generated response whose detailed reason
 * is not explicitly public. Neither names a dependency.
 *
 * The detail is not dropped, only moved to where whoever is debugging already
 * looks. It is logged here rather than at each return, so no path can report a
 * cause to the browser that the runtime logs do not have — several of these
 * reasons are not exceptions and had nothing logged at all.
 *
 * Detail is opt-in, so the default is the safe one wherever this runs: set
 * `ASK_DETAILED_REASONS=1`, which a preview deploy or a local `vercel dev` can
 * carry and production does not. A reason added later is coarse in production
 * until someone puts it in the set above, which is the right way round.
 */
const detailedReasons = () => process.env.ASK_DETAILED_REASONS === '1';

const publicReason = (source, reason) => {
  if (PUBLIC_REASONS.has(reason) || detailedReasons()) return reason;
  const bucket = source === 'generated' ? 'degraded' : 'unavailable';
  console.error(`ask: reported ${bucket} —`, reason);
  return bucket;
};

// `matchedBy` records which mechanism chose a reviewed answer — exact, guarded
// intent, or router. Without it those paths are indistinguishable at
// the client, and whether routing is actually an improvement is unanswerable.
/**
 * `reason` says why a fallback was a fallback.
 *
 * Every failure used to return byte-identical bytes: a routing timeout, a
 * missing key, a spent rate limit and "the model looked and found nothing" were
 * indistinguishable from outside, and the catch blocks threw the exception
 * away. Diagnosing a live problem meant guessing. It is reported on the client's
 * analytics event too, so the shape of the failure is visible without needing
 * to reproduce it.
 *
 * What the browser is told is coarser than what is logged — see
 * `publicReason`, which is the only place the header's value is decided.
 */
const headers = (source, sources, answerId = '', matchedBy = '', reason = '') => ({
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Ask-Source': source,
  'X-Ask-Sources': sources.join(','),
  'X-Ask-Answer-Id': answerId,
  'X-Ask-Matched-By': matchedBy,
  'X-Ask-Reason': publicReason(source, reason),
});

const textResponse = (body, source, sources = [], answerId = '', matchedBy = '', reason = '') =>
  new Response(body, { status: 200, headers: headers(source, sources, answerId, matchedBy, reason) });

/**
 * The endpoint degrades rather than erroring, which means a broken dependency
 * looks exactly like a quiet day unless it is written down. These land in the
 * Vercel runtime logs.
 *
 * Only the error's class and its machine-readable fields are written, never
 * its message. Provider messages carry request IDs and account details, and
 * some SDKs quote the prompt back — which here is a visitor's question. The
 * class and status say which dependency broke and how, which is what the log
 * is for. `detail` is for facts this file composes itself, never for text that
 * came from a visitor or a model.
 */
const SAFE_CODE = /^[A-Za-z0-9_.-]{1,64}$/;

const describe = (error) => {
  if (!(error instanceof Error)) return `non-error thrown (${typeof error})`;
  const parts = [SAFE_CODE.test(error.name) ? error.name : 'Error'];
  const status = error.statusCode ?? error.status;
  if (Number.isInteger(status)) parts.push(`status ${status}`);
  const code = error.code ?? error.cause?.code;
  if (typeof code === 'string' && SAFE_CODE.test(code)) parts.push(`code ${code}`);
  return parts.join(', ');
};

const note = (stage, error, detail = '') => {
  console.error(`ask: ${stage} failed —`, detail || describe(error));
};

/*
  `textStream` yields strings; a Response body in the edge runtime must yield
  Uint8Array. Passing the strings straight through was rejected with "This
  ReadableStream did not return bytes" *after* the generated headers had been
  committed — so the response arrived claiming a draft, with nothing in it, and
  the panel rendered an empty "Drafted, not reviewed" card.

  It went unseen because drafting never got this far: the models had been
  404ing, so no draft ever reached the encoder.

  The client pipes through TextDecoderStream, which needs bytes too.
*/
const encoder = new TextEncoder();
const toBytes = (chunk) => (typeof chunk === 'string' ? encoder.encode(chunk) : chunk);

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
      for (const chunk of buffered) controller.enqueue(toBytes(chunk));

      const pump = async () => {
        try {
          while (true) {
            const result = await reader.read();
            if (result.done) {
              controller.close();
              return;
            }
            controller.enqueue(toBytes(result.value));
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
6. If you use a case study, name it by its published title or a specific product name from the material so the reader can see what supports the reply.

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
    return textResponse('', 'fallback', [], '', '', 'bad-request');
  }
  const question = String(body?.question ?? '').trim().slice(0, MAX_QUESTION_CHARS);
  if (!question) return textResponse('', 'fallback', [], '', '', 'bad-request');

  let approved, index, studies;
  try {
    ({ answers: approved, index, studies = [] } = await loadAnswers(request.url));
  } catch (error) {
    note('loading the answers', error);
    return textResponse('', 'fallback', [], '', '', 'answers-unavailable');
  }
  if (!approved.length) return textResponse('', 'fallback', [], '', '', 'answers-unavailable');

  const reviewed = (answer, matchedBy) =>
    textResponse(answer.answer, 'reviewed', answer.sources ?? [], answer.id, matchedBy);

  // 1. An exact phrase or a guarded factual intent is answered without a model.
  // Formal-management questions are guarded because a number in the question
  // must never inflate the one verified direct report or erase that experience.
  const hit = matchQuestion(question, index);
  if (hit?.exact) return reviewed(hit.answer, 'exact');
  if (hit?.guarded) return reviewed(hit.answer, 'guardrail');

  // A non-exact hit is deliberately not held for later either. Token overlap is
  // confidently wrong often enough that there is no path on which serving it is
  // right: "is he a manager" scored 1.00 against a refusal answer. It would
  // arrive labelled as reviewed, which a draft never does.

  const ip = clientKey(request);
  // Counted once per request, before any model is touched, so a question that
  // routes and then drafts still costs the visitor one of their six. Which
  // check failed is kept, not re-derived later: reading the key a second time
  // could name the wrong cause. Without a key the visitor is not counted.
  const missingKey = !hasApiKey();
  const limited = !missingKey && rateLimited(ip);
  if (missingKey || limited) {
    return textResponse('', 'fallback', [], '', '', missingKey ? 'no-key' : 'rate-limited');
  }

  // 2. Ask the router what this question needs. It sees every written question,
  // because the right answer often shares no vocabulary with how the visitor
  // phrased it, and every case study, because the studies do not use a
  // visitor's vocabulary either — "fintech" appears in none of them.
  let named = [];
  try {
    const raw = await route({
      system: buildRouterPrompt(
        approved.map(a => `${a.id}: ${a.question}`).join('\n'),
        studies.map(c => `${c.id}: ${c.title} [${(c.tags ?? []).join(', ')}] — ${c.summary}`).join('\n'),
      ),
      prompt: question,
    });
    // Validated against the published sets rather than trusted: a model can
    // invent an id, and an invented id must never become a reviewed answer or
    // permission to search unrelated material.
    const text = String(raw ?? '').trim();
    const answerLine = /^ANSWER:\s*([A-Za-z0-9-]+)\s*$/i.exec(text)?.[1];
    if (answerLine) {
      const picked = approved.find(a => a.id === answerLine);
      if (picked) return reviewed(picked, 'router');

      note('routing', null, `picked an id that does not exist (${answerLine.slice(0, 120).length} chars)`);
      return textResponse('', 'fallback', [], '', '', 'router-picked-invalid');
    }

    const sourceList = /^SOURCES:\s*([A-Za-z0-9-]+(?:\s*,\s*[A-Za-z0-9-]+)*)\s*$/i.exec(text)?.[1];
    if (sourceList) {
      named = sourceList.split(',').map(id => id.trim());
      const allNamedStudiesExist = named.length <= 2 && named.every(id => studies.some(c => c.id === id));
      if (!allNamedStudiesExist) {
        note('routing', null, 'named an invalid case-study set');
        return textResponse('', 'fallback', [], '', '', 'router-picked-invalid');
      }
    } else if (/^NONE\s*$/i.test(text)) {
      // NONE means neither a written answer nor a case study applies. Searching
      // the corpus after that decision is what produced confident denials with
      // unrelated citation chips.
      return textResponse('', 'fallback', [], '', '', 'no-material');
    } else {
      note('routing', null, `unreadable response (${text ? `${text.length} chars` : 'empty'})`);
      return textResponse('', 'fallback', [], '', '', 'router-unreadable');
    }
  } catch (error) {
    // Without a routing decision there is no safe source boundary. Fail closed
    // instead of drafting from whichever published text shares a few words.
    note('routing', error);
    return textResponse('', 'fallback', [], '', '', 'router-error');
  }

  // 3. Draft only inside the source boundary the router named. A reviewed
  // answer is safe context only when every study it cites is inside that same
  // boundary; otherwise its prose can introduce a project the response cannot
  // honestly cite.
  const context = rankNearest(question, index, CONTEXT_ANSWERS)
    .filter(a => (a.sources ?? []).length > 0 && a.sources.every(id => named.includes(id)));
  let sections = [];
  try {
    const { index: sourceIndex } = await loadSources(request.url);
    sections = retrieveSections(question, sourceIndex, {
      limit: SOURCE_SECTIONS,
      caseStudies: named,
    });
  } catch (error) {
    // A fully in-bound reviewed answer can still ground a draft when the
    // sections file is unavailable; otherwise the request declines below.
    note('loading the case studies', error);
  }

  // Citations follow what the draft actually drew on.
  //
  const answerSources = context.flatMap(a => a.sources ?? []);
  const sources = [...new Set([
    ...sections.map(section => section.caseStudy),
    ...answerSources,
  ])];

  // Now it means what it says: we looked, and nothing shares any vocabulary
  // with the question. Asking the model anyway would mean asking it to speak
  // from an empty context, which is the one thing this design exists to
  // prevent.
  if (!context.length && !sections.length) {
    return textResponse('', 'fallback', [], '', '', 'no-material');
  }

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
    if (!responseStream) return textResponse('', 'fallback', [], '', '', 'empty-draft');
    return new Response(responseStream, {
      status: 200,
      headers: headers('generated', sources, '', '', 'router-sourced'),
    });
  } catch (error) {
    note('drafting', error);
    return textResponse('', 'fallback', [], '', '', 'provider-error');
  }
};

export default createHandler();
