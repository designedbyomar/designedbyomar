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
import { streamText } from 'ai';
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

const MODEL = 'llama-3.3-70b-versatile';
const CONTEXT_ANSWERS = 3;
const MAX_QUESTION_CHARS = 400;
const TIMEOUT_MS = 8000;

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

const headers = (source, sources, answerId = '') => ({
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Ask-Source': source,
  'X-Ask-Sources': sources.join(','),
  'X-Ask-Answer-Id': answerId,
});

const textResponse = (body, source, sources = [], answerId = '') =>
  new Response(body, { status: 200, headers: headers(source, sources, answerId) });

const hasText = (chunk) => typeof chunk === 'string'
  ? chunk.length > 0
  : chunk instanceof Uint8Array && chunk.byteLength > 0;

const readUntilText = async (stream) => {
  const reader = stream.getReader();
  const buffered = [];

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) return null;
      buffered.push(result.value);
      if (hasText(result.value)) break;
    }
  } catch {
    return null;
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

  // 1. A written answer, whenever one exists. This is the common path.
  const hit = matchQuestion(question, index);
  if (hit) return textResponse(hit.answer.answer, 'reviewed', hit.answer.sources ?? [], hit.answer.id);

  // 2. Nothing matched. Gather the nearest reviewed answers as grounding.
  // Every entry here is text the model may draw from, so all of them are
  // ranked by relevance. Taking the nearest one and padding from the top of
  // the array sent two unrelated answers on every miss.
  const context = rankNearest(question, index, CONTEXT_ANSWERS);
  const sources = [...new Set(context.flatMap(a => a.sources ?? []))];

  // No reviewed answer shares any vocabulary with the question, so there is
  // nothing to ground a reply in. Asking the model anyway would mean asking it
  // to speak from an empty context, which is the one thing this design exists
  // to prevent.
  if (!context.length) return textResponse('', 'fallback');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!hasApiKey() || rateLimited(ip)) return textResponse('', 'fallback', sources);

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
