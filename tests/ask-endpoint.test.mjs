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
import { buildIndex, matchQuestion, rankNearest } from '../src/ask.mjs';

const doc = JSON.parse(readFileSync(new URL('../src/content/ask-answers.json', import.meta.url), 'utf8'));

/**
 * A handler wired to stubs instead of the network. The answers are injected
 * the same way production fetches them, so these tests exercise the real
 * routing without a key, a provider or a published file.
 */
const loadHandler = ({
  generateThrows = false,
  generateStreamError = false,
  generateEmpty = false,
  hasApiKey = true,
  answersFail = false,
  // The router declines by default, so every existing test keeps taking the
  // path it was written for.
  routeReturns = 'NONE',
  routeThrows = false,
  generateStalls = false,
} = {}) => {
  const calls = [];
  const routeCalls = [];
  const handler = createHandler({
    hasApiKey: () => hasApiKey,
    loadAnswers: async () => {
      if (answersFail) throw new Error('answers unavailable');
      return { answers: doc.answers, index: buildIndex(doc.answers) };
    },
    route: async (options) => {
      routeCalls.push(options);
      if (routeThrows) throw new Error('router unavailable');
      return routeReturns;
    },
    generate: (options) => {
      calls.push(options);
      if (generateThrows) throw new Error('provider unavailable');
      if (generateStreamError) return new ReadableStream({ start(c) { c.error(new Error('provider unavailable')); } });
      if (generateEmpty) return new ReadableStream({ start(c) { c.close(); } });
      // Opens, then never yields and never closes — the case a provider-side
      // abort signal is supposed to catch, and which must be bounded here too.
      if (generateStalls) return new ReadableStream({ start() {}, cancel() {} });
      return new ReadableStream({ start(c) { c.enqueue('generated reply'); c.close(); } });
    },
  });
  return { handler, calls, routeCalls };
};

const answerFor = (id) => doc.answers.find(a => a.id === id);

// A question the written set does not answer but which still shares
// vocabulary with it — so there is something to ground a reply in. The
// penguin question shares nothing and now takes the empty-context path.
const MISS_WITH_CONTEXT = 'how did the design system governance model change after launch';

const post = (question) => new Request('https://designedbyomar.com/api/ask', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` },
  body: JSON.stringify({ question }),
});

test('an exact hit is answered without calling any model', async () => {
  // Verbatim alias. The one result token overlap cannot get wrong, so it costs
  // nothing — not even a routing call.
  const { handler, calls, routeCalls } = loadHandler();
  const response = await handler(post('fintech experience'));

  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(response.headers.get('X-Ask-Matched-By'), 'exact');
  assert.equal(routeCalls.length, 0, 'an exact hit must not be routed');
  assert.equal(calls.length, 0, 'an exact hit must not reach the drafting model');

  assert.equal(await response.text(), answerFor('fintech-depth').answer, 'returned verbatim');
});

test('the router decides a non-exact question, and its pick is returned verbatim', async () => {
  const { handler, calls, routeCalls } = loadHandler({ routeReturns: 'leadership-or-ic' });
  const response = await handler(post('is he a manager'));

  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(response.headers.get('X-Ask-Matched-By'), 'router');
  assert.equal(response.headers.get('X-Ask-Answer-Id'), 'leadership-or-ic');
  assert.equal(calls.length, 0, 'a routed hit must not reach the drafting model');
  assert.equal(await response.text(), answerFor('leadership-or-ic').answer);

  // The catalogue is what makes this possible: the right answer shares no
  // vocabulary with the question, so a shortlist by overlap would not contain it.
  assert.match(routeCalls[0].system, /leadership-or-ic: /);
  assert.equal(
    doc.answers.filter(a => routeCalls[0].system.includes(`${a.id}: `)).length,
    doc.answers.length,
    'the router must see every written question, not a shortlist',
  );
});

test('the reported bug: a hiring question no longer returns a refusal', async () => {
  // "is he a manager" scored 1.00 against refuse-employer-opinions — a
  // legitimate hiring question answered with "I will not discuss that".
  const local = matchQuestion('is he a manager', buildIndex(doc.answers));
  assert.equal(local.answer.topic, 'refusal', 'the local matcher still picks a refusal here');
  assert.equal(local.exact, false, 'and not as an exact hit, so it is routable');

  const { handler } = loadHandler({ routeReturns: 'leadership-or-ic' });
  const response = await handler(post('is he a manager'));

  assert.equal(response.headers.get('X-Ask-Answer-Id'), 'leadership-or-ic');
  assert.notEqual(answerFor(response.headers.get('X-Ask-Answer-Id')).topic, 'refusal');
});

test('an id the router invented is never served', async () => {
  const { handler } = loadHandler({ routeReturns: 'leadership-and-vision' });
  const response = await handler(post('is he a manager'));

  // It must not 500, and must not echo the invented id back.
  assert.equal(response.status, 200);
  assert.notEqual(response.headers.get('X-Ask-Answer-Id'), 'leadership-and-vision');
});

/**
 * An answer the router did not give is not the same as an answer it declined to
 * give, and only the second should outrank the local match.
 *
 * Treating them alike meant a truncated or empty response discarded an answer
 * the site already had, turning a question it could answer into an unreviewed
 * draft. Both halves are asserted, because fixing one direction by breaking the
 * other would pass a looser test.
 */
for (const [label, routeReturns] of [
  ['an empty response', ''],
  ['whitespace only', '   \n  '],
  ['a truncated id', 'leadership-or'],
  ['an id that does not exist', 'leadership-and-vision'],
  ['a refusal to answer', 'I cannot help with that'],
]) {
  test(`${label} from the router serves the local match, not a draft`, async () => {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'reviewed', `${label} must not reach drafting`);
    assert.equal(response.headers.get('X-Ask-Matched-By'), 'local');
    assert.equal(calls.length, 0);
  });
}

for (const [label, routeReturns] of [
  ['NONE', 'NONE'],
  ['lower-case none', 'none'],
  ['NONE with punctuation', 'NONE.'],
  ['a sentence declining', 'None of these answer that.'],
]) {
  test(`${label} is a decision, so it drafts rather than using the local match`, async () => {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'generated', `${label} must be read as a decline`);
    assert.equal(calls.length, 1);
  });
}

test('NONE means draft, even when token overlap thought it had a match', async () => {
  const { handler, calls } = loadHandler({ routeReturns: 'NONE' });
  const response = await handler(post('is he a manager'));

  // The router saw all 48 and declined. That beats an overlap score, so the
  // held local hit is deliberately not used.
  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  assert.equal(calls.length, 1);
});

test('a router failure falls back to the local match rather than nothing', async () => {
  const { handler, calls } = loadHandler({ routeThrows: true });
  const response = await handler(post('is he a manager'));

  // Nothing was decided, so the site must be no worse than it was before
  // routing existed — which is to say, it serves the local match.
  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(response.headers.get('X-Ask-Matched-By'), 'local');
  assert.equal(calls.length, 0);
});

test('with no key the local match is still served', async () => {
  const { handler, routeCalls } = loadHandler({ hasApiKey: false });
  const response = await handler(post('is he a manager'));

  assert.equal(routeCalls.length, 0, 'no key means no routing call is attempted');
  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(response.headers.get('X-Ask-Matched-By'), 'local');
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

// Bounded explicitly: `node --test` has no default timeout, so a regression
// here would hang CI indefinitely instead of reporting a failure.
test('a stream that never yields is abandoned rather than hung on', { timeout: 15000 }, async (t) => {
  // The failure this guards is a hang, so the assertion is as much about
  // finishing as about the result. The endpoint's own first-chunk timeout has
  // to fire; nothing in this test aborts for it.
  t.diagnostic('waiting on the endpoint first-chunk timeout');
  const started = Date.now();
  const { handler } = loadHandler({ generateStalls: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.ok(Date.now() - started < 15000, 'and it gives up long before an edge function would');
});
