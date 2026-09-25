/**
 * The endpoint's contract is which of three paths a question takes, so that is
 * what is tested. The model is never called here — the point of these tests is
 * that it is called as rarely as possible, and that nothing breaks when it
 * cannot be called at all.
 *
 * The handler is imported with the provider stubbed, so no key and no network
 * are needed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHandler } from '../api/ask.mjs';
import { buildIndex, rankNearest } from '../src/ask.mjs';

const doc = JSON.parse(readFileSync(new URL('../src/content/ask-answers.json', import.meta.url), 'utf8'));

/**
 * A handler wired to stubs instead of the network. The answers are injected
 * the same way production fetches them, so these tests exercise the real
 * routing without a key, a provider or a published file.
 */
const loadHandler = ({ generateThrows = false, generateStreamError = false, generateEmpty = false, hasApiKey = true, answersFail = false } = {}) => {
  const calls = [];
  const handler = createHandler({
    hasApiKey: () => hasApiKey,
    loadAnswers: async () => {
      if (answersFail) throw new Error('answers unavailable');
      return { answers: doc.answers, index: buildIndex(doc.answers) };
    },
    generate: (options) => {
      calls.push(options);
      if (generateThrows) throw new Error('provider unavailable');
      if (generateStreamError) return new ReadableStream({ start(c) { c.error(new Error('provider unavailable')); } });
      if (generateEmpty) return new ReadableStream({ start(c) { c.close(); } });
      return new ReadableStream({ start(c) { c.enqueue('generated reply'); c.close(); } });
    },
  });
  return { handler, calls };
};

// A question the written set does not answer but which still shares
// vocabulary with it — so there is something to ground a reply in. The
// penguin question shares nothing and now takes the empty-context path.
const MISS_WITH_CONTEXT = 'how did the design system governance model change after launch';

const post = (question) => new Request('https://designedbyomar.com/api/ask', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` },
  body: JSON.stringify({ question }),
});

test('a question the written set covers is answered without calling a model', async () => {
  const { handler, calls } = loadHandler();
  const response = await handler(post('what fintech work has he done'));

  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(calls.length, 0, 'the model must not be called when a written answer exists');

  const expected = doc.answers.find(a => a.id === 'fintech-depth').answer;
  assert.equal(await response.text(), expected, 'the reviewed answer must be returned verbatim');
});

test('a question with no written answer is grounded in reviewed answers only', async () => {
  const { handler, calls } = loadHandler();
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  assert.equal(calls.length, 1, 'the model is called exactly once on a miss');

  const { system } = calls[0];
  assert.match(system, /ONLY the reviewed answers/i);
  assert.match(system, /third person/i);
  // Everything in the prompt must be text Omar approved.
  const quoted = system.split('REVIEWED ANSWERS:')[1];
  const approvedText = doc.answers.map(a => a.answer).join('\n');
  for (const line of quoted.split('\nA: ').slice(1)) {
    const snippet = line.split('\n')[0].slice(0, 60);
    assert.ok(approvedText.includes(snippet), `prompt contains text not from an approved answer: ${snippet}`);
  }
});

test('with no API key configured it degrades instead of failing', async () => {
  const { handler, calls } = loadHandler({ hasApiKey: false });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200, 'a missing key must not surface as an error');
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0);
});

test('a provider failure degrades to the fallback the site already shipped', async () => {
  const { handler } = loadHandler({ generateThrows: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
});

test('a provider stream error before its first chunk degrades to the fallback', async () => {
  const { handler } = loadHandler({ generateStreamError: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
});

test('an empty provider stream degrades to the fallback', async () => {
  const { handler } = loadHandler({ generateEmpty: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
});

test('one visitor cannot drain the daily quota', async () => {
  const { handler } = loadHandler();
  const sameVisitor = () => new Request('https://designedbyomar.com/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify({ question: MISS_WITH_CONTEXT }),
  });

  const sources = [];
  for (let i = 0; i < 9; i += 1) sources.push((await handler(sameVisitor())).headers.get('X-Ask-Source'));

  assert.ok(sources.includes('generated'), 'early requests are answered');
  assert.equal(sources.at(-1), 'fallback', 'later requests from the same visitor are capped');
});

test('a malformed or empty request never errors', async () => {
  const { handler } = loadHandler();
  for (const body of ['not json', JSON.stringify({}), JSON.stringify({ question: '   ' })]) {
    const response = await handler(new Request('https://designedbyomar.com/api/ask', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body,
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  }
});

test('an unreachable answer file degrades instead of erroring', async () => {
  const { handler, calls } = loadHandler({ answersFail: true });
  const response = await handler(post('what fintech work has he done'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0);
});

test('grounding context is ranked, not padded from the top of the array', () => {
  // Regression. Only the nearest answer was chosen by relevance; the rest came
  // from the start of the approved array, so a payments question was grounded
  // in design-systems and ai-llm-work.
  const index = buildIndex(doc.answers);
  const ranked = rankNearest('what compliance work has he done on payments', index, 3);

  assert.ok(ranked.length > 1, 'expected several grounding answers');
  assert.equal(ranked[0].id, 'fintech-depth');

  const ids = ranked.map(a => a.id);
  const arrayOrder = doc.answers.filter(a => a.sources?.length).slice(0, 3).map(a => a.id);
  assert.notDeepEqual(ids, arrayOrder, 'context must not be the first entries of the array');
});

test('a question sharing no vocabulary is never sent to the model', async () => {
  const { handler, calls } = loadHandler();
  // Nothing in the answer set shares a token with this, so there is nothing to
  // ground a reply in — asking anyway would mean an empty context block.
  const response = await handler(post('zxqw flibbertigibbet wombat'));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0, 'the model must not be asked to speak from an empty context');
});
