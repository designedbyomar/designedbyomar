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
import { createHandler, MODEL, ROUTER_MODEL, UNUSABLE_MODELS, DRAFT_TOKENS, ROUTE_TOKENS, REASONING, ROUTER_TIMEOUT_MS, SUPPORTED_EFFORT } from '../api/ask.mjs';
import { buildIndex, matchQuestion, rankNearest } from '../src/ask.mjs';
import { buildSourceIndex, retrieveSections } from '../src/ask-sources.mjs';

/**
 * The detailed reason header is opt-in, because production ships buckets rather
 * than naming which dependency is down. These tests assert the detailed
 * contract — what a preview deploy or a local run sees — so the file turns it
 * on, and the production default gets its own test that turns it back off.
 */
process.env.ASK_DETAILED_REASONS = '1';

const SUMMARY = new Set(['Challenge', 'Approach', 'Outcome']);

// The real published sections, so retrieval is exercised against the corpus the
// build actually produces rather than a fixture shaped to pass.
const realSources = async () => {
  const { sections } = JSON.parse(
    readFileSync(new URL('../dist/ask-sources.json', import.meta.url), 'utf8'),
  );
  return { sections, index: buildSourceIndex(sections) };
};

const doc = JSON.parse(readFileSync(new URL('../src/content/ask-answers.json', import.meta.url), 'utf8'));
// Production publishes approved answers only. Keep the injected catalogue on
// that same boundary so adding a draft cannot make the endpoint appear to use
// content the build deliberately withholds.
const approvedAnswers = doc.answers.filter(answer => answer.status === 'approved');

/**
 * A handler wired to stubs instead of the network. The answers are injected
 * the same way production fetches them, so these tests exercise the real
 * routing without a key, a provider or a published file.
 */
const loadHandler = ({
  answers = approvedAnswers,
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
  sourcesFail = false,
  streamText = null,
  streamChunks = null,
} = {}) => {
  const calls = [];
  const routeCalls = [];
  const handler = createHandler({
    hasApiKey: typeof hasApiKey === 'function' ? hasApiKey : () => hasApiKey,
    loadAnswers: async () => {
      if (answersFail) throw new Error('answers unavailable');
      return { answers, index: buildIndex(answers), studies: STUDIES };
    },
    loadSources: async () => {
      if (sourcesFail) throw new Error('sources unavailable');
      return { sections: SECTIONS, index: buildSourceIndex(SECTIONS) };
    },
    route: async (options) => {
      routeCalls.push(options);
      if (routeThrows) throw new Error('router unavailable');
      return routeReturns;
    },
    generate: (options) => {
      calls.push(options);
      if (generateThrows) throw generateThrows instanceof Error ? generateThrows : new Error('provider unavailable');
      if (generateStreamError) return new ReadableStream({ start(c) { c.error(new Error('provider unavailable')); } });
      if (generateEmpty) return new ReadableStream({ start(c) { c.close(); } });
      // Opens, then never yields and never closes — the case a provider-side
      // abort signal is supposed to catch, and which must be bounded here too.
      if (generateStalls) return new ReadableStream({ start() {}, cancel() {} });
      const parts = streamChunks ?? [streamText ?? 'generated reply'];
      return new ReadableStream({ start(c) { for (const part of parts) c.enqueue(part); c.close(); } });
    },
  });
  return { handler, calls, routeCalls };
};

const answerFor = (id) => approvedAnswers.find(a => a.id === id);

// A couple of real sections, so the drafting prompt is asserted against the
// shape the build actually produces.
const STUDIES = [
  {
    id: 'connect-api',
    title: 'Connect API Payments',
    tags: ['Fintech', 'API', 'Developer Experience', 'B2B'],
    summary: 'Embedded payments a partner ships under their own brand.',
  },
  {
    id: 'athena-ds',
    title: 'Athena Design System 2.0',
    tags: ['Design System', 'Enterprise'],
    summary: 'Enterprise design system behind an IPO-era brand.',
  },
];

const SECTIONS = [
  {
    id: 'connect-api#0',
    caseStudy: 'connect-api',
    title: 'Connect API Payments',
    heading: 'Challenge',
    text: 'Plastiq Connect let a partner put card and bank payments inside its own product, under its own brand, with Plastiq carrying the compliance and the disbursement.',
    // The build puts the tags on every section. Without them here the fixture
    // would not exercise the path that makes an unscoped search work at all.
    labels: 'Fintech API Developer Experience B2B Plastiq Lead Product Designer',
  },
  {
    id: 'connect-api#1',
    caseStudy: 'connect-api',
    title: 'Connect API Payments',
    heading: 'Approach',
    text: 'Benchmarking against Stripe Connect settled what the product competed on: letting a partner hand over PCI scope and risk operations rather than build and certify them.',
    labels: 'Fintech API Developer Experience B2B Plastiq Lead Product Designer',
  },
  {
    id: 'athena-ds#0',
    caseStudy: 'athena-ds',
    title: 'Athena Design System 2.0',
    heading: 'Challenge',
    text: 'Nomenclature and patterns had diverged across every product, so an audit came before a single asset was produced.',
    labels: 'Design System Enterprise Cross-functional Plastiq',
  },
];

// A question the written set does not answer but which still shares
// vocabulary with it — so there is something to ground a reply in. The
// penguin question shares nothing and now takes the empty-context path.
const MISS_WITH_CONTEXT = 'how did the design system governance model change after launch';

const post = (question) => new Request('https://designedbyomar.com/api/ask', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` },
  body: JSON.stringify({ question }),
});

test('the endpoint accepts only POST', async () => {
  const { handler, calls, routeCalls } = loadHandler();
  const response = await handler(new Request('https://designedbyomar.com/api/ask', { method: 'GET' }));
  assert.equal(response.status, 405);
  assert.equal(calls.length, 0);
  assert.equal(routeCalls.length, 0);
});

test('the router and Vercel budgets keep a controlled first response inside 25 seconds', () => {
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(ROUTER_TIMEOUT_MS, 4000);
  assert.equal(vercel.functions?.['api/ask.mjs']?.maxDuration, 25);
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

test('punctuation and casing variants of ship-fast stay local', async () => {
  for (const question of ['Can Omar ship fast?', 'CAN OMAR SHIP FAST?!', '  can   omar ship fast  ']) {
    const { handler, calls, routeCalls } = loadHandler();
    const response = await handler(post(question));
    assert.equal(response.headers.get('X-Ask-Answer-Id'), 'prioritization-under-constraints', question);
    assert.equal(response.headers.get('X-Ask-Matched-By'), 'exact', question);
    assert.equal(routeCalls.length, 0, question);
    assert.equal(calls.length, 0, question);
  }
});

test('formal-management questions use the verified one-report answer without a model', async () => {
  const { handler, calls, routeCalls } = loadHandler();
  const response = await handler(post('Has Omar formally managed 20 direct reports?'));
  const text = await response.text();

  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(response.headers.get('X-Ask-Answer-Id'), 'formal-people-management');
  assert.equal(response.headers.get('X-Ask-Matched-By'), 'guardrail');
  assert.equal(routeCalls.length, 0);
  assert.equal(calls.length, 0);
  assert.match(text, /directly managed one designer/i);
  assert.match(text, /not 20/i);
});

test('the router decides a non-exact question, and its pick is returned verbatim', async () => {
  const { handler, calls, routeCalls } = loadHandler({ routeReturns: 'ANSWER: leadership-or-ic' });
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
    approvedAnswers.filter(a => routeCalls[0].system.includes(`${a.id}: `)).length,
    approvedAnswers.length,
    'the router must see every written question, not a shortlist',
  );
});

test('the reported bug: a hiring question no longer returns a refusal', async () => {
  // "is he a manager" scored 1.00 against refuse-employer-opinions — a
  // legitimate hiring question answered with "I will not discuss that".
  const local = matchQuestion('is he a manager', buildIndex(approvedAnswers));
  assert.equal(local.answer.topic, 'refusal', 'the local matcher still picks a refusal here');
  assert.equal(local.exact, false, 'and not as an exact hit, so it is routable');

  const { handler } = loadHandler({ routeReturns: 'ANSWER: leadership-or-ic' });
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

/** A missing source boundary must stop drafting, not broaden it. */
for (const [label, routeReturns] of [
  ['an empty response', ''],
  ['whitespace only', '   \n  '],
  ['a truncated id', 'leadership-or'],
  ['an id that does not exist', 'leadership-and-vision'],
  ['a refusal to answer', 'I cannot help with that'],
]) {
  test(`${label} from the router fails closed`, async () => {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'fallback', `${label} must not draft`);
    assert.equal(calls.length, 0);
    assert.equal(response.headers.get('X-Ask-Sources'), '');
    assert.equal(response.headers.get('X-Ask-Reason'), 'router-unreadable');
  });
}

test('a router that throws fails closed, and says why', async () => {
  const { handler, calls } = loadHandler({ routeThrows: true });
  const response = await handler(post('is he a manager'));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(response.headers.get('X-Ask-Reason'), 'router-error');
  assert.equal(response.headers.get('X-Ask-Sources'), '');
  assert.equal(calls.length, 0, 'drafting requires router-named studies');
});

test('an exact hit is still served when the router cannot run', async () => {
  // The carve-out: a verbatim question is the one result overlap cannot get
  // wrong, so it does not need a model to vouch for it.
  const { handler, routeCalls } = loadHandler({ hasApiKey: false });
  const response = await handler(post('fintech experience'));

  assert.equal(routeCalls.length, 0);
  assert.equal(response.headers.get('X-Ask-Source'), 'reviewed');
  assert.equal(response.headers.get('X-Ask-Matched-By'), 'exact');
});

for (const [label, routeReturns] of [
  ['NONE', 'NONE'],
  ['lower-case none', 'none'],
]) {
  test(`${label} is a no-material decision and never drafts`, async () => {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'fallback', `${label} must be read as a decline`);
    assert.equal(response.headers.get('X-Ask-Reason'), 'no-material');
    assert.equal(response.headers.get('X-Ask-Sources'), '');
    assert.equal(calls.length, 0);
  });
}

for (const routeReturns of ['NONE.', 'None of these answer that.']) {
  test(`${routeReturns} is invalid router output and fails closed`, async () => {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
    assert.equal(response.headers.get('X-Ask-Reason'), 'router-unreadable');
    assert.equal(response.headers.get('X-Ask-Sources'), '');
    assert.equal(calls.length, 0);
  });
}

test('a loose overlap match is never served, on any path', async () => {
  // "is he a manager" scores 1.00 against a refusal answer. Whatever else
  // happens, that must not come back looking like a reviewed answer.
  for (const options of [{ routeThrows: true }, { routeReturns: 'NONE' }, { routeReturns: '' }]) {
    const { handler } = loadHandler(options);
    const response = await handler(post('is he a manager'));
    assert.notEqual(response.headers.get('X-Ask-Matched-By'), 'local', JSON.stringify(options));
    assert.notEqual(response.headers.get('X-Ask-Answer-Id'), 'refuse-employer-opinions');
  }
});

test('with no key nothing loose is served', async () => {
  const { handler, routeCalls, calls } = loadHandler({ hasApiKey: false });
  const response = await handler(post('is he a manager'));

  assert.equal(routeCalls.length, 0, 'no key means no routing call is attempted');
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0);
});

test('a sourced draft receives only material inside the router-named studies', async () => {
  const { handler, calls } = loadHandler({ routeReturns: 'SOURCES: athena-ds' });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  assert.equal(calls.length, 1, 'the model is called exactly once on a miss');

  const { system } = calls[0];
  assert.match(system, /ONLY the material provided/i);
  assert.match(system, /third person/i);
  assert.match(system, /Athena Design System 2\.0/);
  assert.doesNotMatch(system, /Connect API Payments|card and bank payments/i);
  assert.equal(response.headers.get('X-Ask-Sources'), 'athena-ds');
});

test('with no API key configured it degrades instead of failing', async () => {
  const { handler, calls } = loadHandler({ hasApiKey: false });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200, 'a missing key must not surface as an error');
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0);
});

test('a provider failure degrades to the fallback the site already shipped', async () => {
  const { handler } = loadHandler({ routeReturns: 'SOURCES: athena-ds', generateThrows: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
});

test('a provider stream error before its first chunk degrades to the fallback', async () => {
  const { handler } = loadHandler({ routeReturns: 'SOURCES: athena-ds', generateStreamError: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
});

test('an empty provider stream degrades to the fallback', async () => {
  const { handler } = loadHandler({ routeReturns: 'SOURCES: athena-ds', generateEmpty: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
});

test('one visitor cannot drain the daily quota', async () => {
  const { handler } = loadHandler({ routeReturns: 'SOURCES: athena-ds' });
  const sameVisitor = () => new Request('https://designedbyomar.com/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify({ question: MISS_WITH_CONTEXT }),
  });

  const sources = [];
  // Comfortably past the per-visitor ceiling, so the test does not have to be
  // edited every time that number moves.
  // Past the ceiling whatever it is set to, so moving that number does not
  // silently turn this test into one that never reaches the limit.
  const attempts = [];
  for (let i = 0; i < 40; i += 1) {
    const response = await handler(sameVisitor());
    sources.push(response.headers.get('X-Ask-Source'));
    attempts.push(response.headers.get('X-Ask-Reason'));
  }

  assert.ok(sources.includes('generated'), 'early requests are answered');
  assert.equal(sources.at(-1), 'fallback', 'later requests from the same visitor are capped');
  assert.equal(attempts.at(-1), 'rate-limited', 'and say so, rather than looking broken');
});

test('a spoofed forwarding header cannot mint a fresh rate-limit bucket', async () => {
  // The leftmost x-forwarded-for entry is client-controlled. Rotating it on
  // every request must not reset the count, or the ceiling means nothing.
  const { handler } = loadHandler();
  const reasons = [];
  for (let i = 0; i < 40; i += 1) {
    const response = await handler(new Request('https://designedbyomar.com/api/ask', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `192.0.2.${i}, 198.51.100.200`,
      },
      body: JSON.stringify({ question: MISS_WITH_CONTEXT }),
    }));
    reasons.push(response.headers.get('X-Ask-Reason'));
  }
  assert.equal(reasons.at(-1), 'rate-limited');
});

test('the platform client-IP header outranks x-forwarded-for', async () => {
  const { handler } = loadHandler();
  const reasons = [];
  for (let i = 0; i < 40; i += 1) {
    const response = await handler(new Request('https://designedbyomar.com/api/ask', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vercel-forwarded-for': '198.51.100.201',
        'x-forwarded-for': `192.0.2.${i}`,
      },
      body: JSON.stringify({ question: MISS_WITH_CONTEXT }),
    }));
    reasons.push(response.headers.get('X-Ask-Reason'));
  }
  assert.equal(reasons.at(-1), 'rate-limited');
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
  const index = buildIndex(approvedAnswers);
  const ranked = rankNearest('what compliance work has he done on payments', index, 3);

  assert.ok(ranked.length > 1, 'expected several grounding answers');
  assert.equal(ranked[0].id, 'fintech-depth');

  const ids = ranked.map(a => a.id);
  const arrayOrder = approvedAnswers.filter(a => a.sources?.length).slice(0, 3).map(a => a.id);
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
  const { handler } = loadHandler({ routeReturns: 'SOURCES: athena-ds', generateStalls: true });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.ok(Date.now() - started < 15000, 'and it gives up long before an edge function would');
});

/**
 * The reported problem: a question the written answers do not cover was being
 * routed to whichever one shared the most words, and the reply read as a
 * non-sequitur. "What is the strongest fintech case study he has" returned the
 * Wisdom Management Portal, which is healthcare.
 *
 * The fix is not a better match — no written answer makes that judgement — it
 * is drafting one from the case study itself.
 */
test('the router can name case studies, and the draft is written from them', async () => {
  const { handler, calls } = loadHandler({ routeReturns: 'SOURCES: connect-api' });
  const response = await handler(post('What is the strongest fintech case study he has'));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  assert.equal(calls.length, 1);

  const { system } = calls[0];
  assert.match(system, /CASE STUDY EXCERPTS:/, 'the draft is given case-study prose');
  assert.match(system, /Connect API Payments — Challenge/, 'labelled by study and section');
  assert.match(system, /card and bank payments inside its own product/, 'and carries the actual text');

  // Citations follow what it drew on, so the chips point at the right study.
  assert.match(response.headers.get('X-Ask-Sources'), /connect-api/);
  assert.ok(!/athena-ds/.test(response.headers.get('X-Ask-Sources')), 'and not at a study it never saw');
});

test('a named study the site does not have makes the routing output invalid', async () => {
  const { handler, calls } = loadHandler({ routeReturns: 'SOURCES: connect-api,not-a-real-study' });
  const response = await handler(post('What is the strongest fintech case study he has'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(response.headers.get('X-Ask-Reason'), 'router-picked-invalid');
  assert.equal(response.headers.get('X-Ask-Sources'), '');
  assert.equal(calls.length, 0, 'an invented id must stop drafting');
});

test('the case studies are only fetched when a draft actually needs them', async () => {
  // They are the largest file the endpoint can pull. A question a written
  // answer covers must never pay for it.
  let fetched = 0;
  const { handler } = loadHandler({ routeReturns: 'ANSWER: fintech-depth' });
  const wrapped = createHandler({
    hasApiKey: () => true,
    loadAnswers: async () => ({ answers: approvedAnswers, index: buildIndex(approvedAnswers), studies: STUDIES }),
    loadSources: async () => { fetched += 1; return { sections: SECTIONS, index: buildSourceIndex(SECTIONS) }; },
    route: async () => 'ANSWER: fintech-depth',
    generate: () => new ReadableStream({ start(c) { c.enqueue('x'); c.close(); } }),
  });

  await wrapped(post('has he worked in fintech'));
  assert.equal(fetched, 0, 'a routed answer must not fetch the case studies');
  assert.ok(handler);
});

test('an unreachable sources file still drafts, from the answers about that study', async () => {
  const { handler, calls } = loadHandler({ routeReturns: 'SOURCES: connect-api', sourcesFail: true });
  const response = await handler(post('has he worked on compliance'));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  assert.match(calls[0].system, /REVIEWED ANSWERS:/);
  assert.ok(!/CASE STUDY EXCERPTS:/.test(calls[0].system));
});

test('with the sources gone and no answer about the named study, it declines', async () => {
  // The alternative would be drafting from whichever answers happened to rank
  // near the question — the prose the router had just rejected. Better to say
  // there is no answer than to write one from the wrong material.
  const answersWithoutConnect = approvedAnswers.filter(answer => !answer.sources?.includes('connect-api'));
  const { handler, calls } = loadHandler({
    answers: answersWithoutConnect,
    routeReturns: 'SOURCES: connect-api',
    sourcesFail: true,
  });
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0);
});

test('the router is shown the case studies, not just the questions', async () => {
  const { handler, routeCalls } = loadHandler({ routeReturns: 'NONE' });
  await handler(post('What is the strongest fintech case study he has'));

  const { system } = routeCalls[0];
  assert.match(system, /CASE STUDIES:/);
  assert.match(system, /connect-api: /, 'by id, so what it returns can be validated');
  assert.match(system, /SOURCES: /, 'and told it may name them');

  // The tags are how the site labels a study — they render as badges on the
  // page — and they carry vocabulary the prose does not. Connect API is tagged
  // Fintech and the word appears nowhere in its writing, so without them the
  // router had to infer the category from a title and one line of summary.
  assert.match(system, /Connect API Payments \[Fintech, API, Developer Experience, B2B\]/);
});

test('the published study list carries the tags the page shows', async () => {
  // Guards the build, not the endpoint: the tags were dropped silently the
  // first time, and nothing noticed because retrieval still returned sections.
  const { studies } = JSON.parse(
    readFileSync(new URL('../dist/ask-answers.json', import.meta.url), 'utf8'),
  );
  const connect = studies.find(c => c.id === 'connect-api');
  assert.ok(connect, 'connect-api is published to the router');
  assert.ok(connect.tags?.includes('Fintech'), 'and carries the Fintech tag shown on its page');
  for (const study of studies) {
    assert.ok(Array.isArray(study.tags), `${study.id} has tags`);
    assert.ok(study.summary, `${study.id} has a summary`);
  }
});

test('a study tag is findable in the sections it labels', async () => {
  // "fintech" matched no section at all until the labels were indexed, which I
  // reported as a fact about the writing rather than a gap in the chunker.
  const { index } = await realSources();
  const tagged = index.docs.filter(d => d.tokens.has('fintech'));
  assert.ok(tagged.length > 0, 'the Fintech tag reaches the sections it labels');
  for (const doc of tagged) {
    assert.equal(doc.section.caseStudy, 'connect-api', 'and only the study it belongs to');
  }
});

/**
 * Retrieval has to serve two kinds of question at once, and an earlier fix for
 * one broke the other.
 *
 * Ranking every summary above every detail was added because relevance inside a
 * single study is largely noise — "strongest fintech case study" matched a
 * section on API key rotation, on the word "study", from "deserve its own
 * study". Written as an absolute it meant a question *about* key rotation got
 * four overviews and not the section holding its answer.
 *
 * Both directions are asserted, because satisfying either one alone is easy.
 */
test('a question about a detail reaches the section holding it', async () => {
  const { sections, index } = await realSources();
  const picked = retrieveSections(
    'how did he handle manual API key rotation in the partner portal',
    index,
    { caseStudies: ['connect-api', 'athena-ds'] },
  );

  assert.ok(
    picked.some(s => /key rotation/i.test(s.text)),
    'the section that discusses key rotation must be in the material',
  );
  for (const study of ['connect-api', 'athena-ds']) {
    assert.ok(
      picked.some(s => s.caseStudy === study && SUMMARY.has(s.heading)),
      `${study} must still contribute its framing`,
    );
  }
  assert.ok(sections.length > picked.length);
});

test('a question about a study as a whole still leads with its framing', async () => {
  const { index } = await realSources();
  const picked = retrieveSections('What is the strongest fintech case study he has', index, {
    caseStudies: ['connect-api'],
  });

  assert.ok(SUMMARY.has(picked[0].heading), `led with "${picked[0].heading}" instead of the summary`);
  const summaries = picked.filter(s => SUMMARY.has(s.heading)).length;
  assert.ok(summaries >= 2, 'a vague question should be mostly framing, not detail');
});

test('citations name only the studies the draft was given', async () => {
  // An answer is kept when it cites any named study, but 19 of the 48 cite more
  // than one — `work-history` cites three. Taking all of their sources linked
  // the visitor to projects the router never chose.
  const threeStudies = answerFor('work-history');
  assert.equal(threeStudies.sources.length, 3, 'fixture still cites three studies');

  const { handler } = loadHandler({ routeReturns: 'SOURCES: connect-api' });
  const response = await handler(post('what has he worked on over his career'));

  const cited = (response.headers.get('X-Ask-Sources') ?? '').split(',').filter(Boolean);
  assert.ok(cited.includes('connect-api'));
  for (const id of threeStudies.sources.filter(s => s !== 'connect-api')) {
    assert.ok(!cited.includes(id), `cited ${id}, which was never named or retrieved`);
  }
});

/**
 * Every failure used to return byte-identical bytes.
 *
 * A routing timeout, a missing key, a spent rate limit and "the model looked
 * and found nothing" were indistinguishable from outside, and the catches threw
 * the exception away — so diagnosing a live problem meant guessing at it from a
 * screenshot. Each cause now names itself.
 */
test('a missing key says so', async () => {
  const { handler } = loadHandler({ hasApiKey: false });
  const response = await handler(post('what fintech work has he done'));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(response.headers.get('X-Ask-Reason'), 'no-key');
});

test('a question nothing covers at all says so', async () => {
  const { handler, calls } = loadHandler();
  const response = await handler(post('how do penguins pay for parking in antarctica'));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(response.headers.get('X-Ask-Reason'), 'no-material');
  assert.equal(calls.length, 0, 'and the model is not asked to speak from nothing');
});

test('a provider failure while drafting says so', async () => {
  const { handler } = loadHandler({ routeReturns: 'SOURCES: connect-api', generateThrows: true });
  const response = await handler(post('what fintech work has he done'));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(response.headers.get('X-Ask-Reason'), 'provider-error');
});

test('an unreadable request says so', async () => {
  const { handler } = loadHandler();
  const response = await handler(new Request('https://designedbyomar.com/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.7' },
    body: 'not json',
  }));

  assert.equal(response.headers.get('X-Ask-Reason'), 'bad-request');
});

test('only a successful SOURCES decision produces a draft', async () => {
  const sourced = await (loadHandler({ routeReturns: 'SOURCES: connect-api' })).handler(post('what fintech work has he done'));
  assert.equal(sourced.headers.get('X-Ask-Source'), 'generated');
  assert.equal(sourced.headers.get('X-Ask-Reason'), 'router-sourced');

  const declined = await (loadHandler({ routeReturns: 'NONE' })).handler(post('what fintech work has he done'));
  assert.equal(declined.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(declined.headers.get('X-Ask-Reason'), 'no-material');
  assert.equal(declined.headers.get('X-Ask-Sources'), '');

  const failed = await (loadHandler({ routeThrows: true })).handler(post('what fintech work has he done'));
  assert.equal(failed.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(failed.headers.get('X-Ask-Reason'), 'router-error');
  assert.equal(failed.headers.get('X-Ask-Sources'), '');
});

test('an ANSWER naming an id that does not exist fails closed, and says so', async () => {
  for (const routeReturns of ['ANSWER: leadership-and-vision', 'ANSWER: made-up-answer']) {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'fallback', `${routeReturns} must not draft`);
    assert.equal(calls.length, 0);
    assert.equal(response.headers.get('X-Ask-Sources'), '');
    assert.equal(response.headers.get('X-Ask-Reason'), 'router-picked-invalid', `${routeReturns} is not a decline`);
  }

  // ANSWER: NONE is invalid because the router used the wrong form.
  const declined = await (loadHandler({ routeReturns: 'ANSWER: NONE' })).handler(post('is he a manager'));
  assert.equal(declined.headers.get('X-Ask-Reason'), 'router-picked-invalid');
});

test('every generated draft names a routing outcome', async () => {
  for (const routeReturns of ['', 'NONE', 'SOURCES: connect-api', 'ANSWER: made-up', 'leadership-or', 'SOURCES: not-a-real-study']) {
    const response = await (loadHandler({ routeReturns })).handler(post('what fintech work has he done'));
    if (response.headers.get('X-Ask-Source') !== 'generated') continue;
    assert.ok(response.headers.get('X-Ask-Reason'), `${JSON.stringify(routeReturns)} drafted with no reason`);
  }
});

test('every fallback names a cause', async () => {
  // A reason of '' would put this back where it started.
  for (const [label, options, question] of [
    ['no key', { hasApiKey: false }, 'what fintech work has he done'],
    ['nothing relevant', {}, 'how do penguins pay for parking in antarctica'],
    ['provider down', { routeReturns: 'SOURCES: connect-api', generateThrows: true }, 'what fintech work has he done'],
  ]) {
    const { handler } = loadHandler(options);
    const response = await handler(post(question));
    if (response.headers.get('X-Ask-Source') !== 'fallback') continue;
    assert.ok(response.headers.get('X-Ask-Reason'), `${label} returned a fallback with no reason`);
  }
});

/**
 * A reason that names the wrong cause is worse than no reason, because it sends
 * whoever is debugging somewhere else. These two cases both misreported.
 */
test('an unanswerable question with no key blames the key, not the material', async () => {
  // Retrieval is skipped when the key is missing, so `sections` is empty for a
  // reason that has nothing to do with the corpus. If nothing is near the
  // question either, the no-material guard fired first and reported that the
  // site had nothing to say — when the truth is that it never looked.
  const { handler } = loadHandler({ hasApiKey: false });
  const response = await handler(post('how do penguins pay for parking in antarctica'));

  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(response.headers.get('X-Ask-Reason'), 'no-key');
});

test('an unanswerable question from a rate-limited visitor blames the limit', async () => {
  const { handler } = loadHandler();
  const drain = () => new Request('https://designedbyomar.com/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.44' },
    body: JSON.stringify({ question: 'how do penguins pay for parking in antarctica' }),
  });

  let reason = null;
  for (let i = 0; i < 40; i += 1) reason = (await handler(drain())).headers.get('X-Ask-Reason');
  assert.equal(reason, 'rate-limited');
});

test('the reason names the check that actually failed, not a second read of the key', async () => {
  // The reason used to re-read the key after the fact and infer which side of
  // `!key || limited` had fired. A key that reads differently the second time
  // turned a spent rate limit into `no-key`. Each request here sees the key on
  // its first read and loses it afterwards.
  let reads = 0;
  const { handler } = loadHandler({ hasApiKey: () => (reads++ % 2 === 0) });
  const drain = () => new Request('https://designedbyomar.com/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.45' },
    body: JSON.stringify({ question: 'how do penguins pay for parking in antarctica' }),
  });

  let reason = null;
  for (let i = 0; i < 40; i += 1) { reads = 0; reason = (await handler(drain())).headers.get('X-Ask-Reason'); }
  assert.equal(reason, 'rate-limited');
});

test('router failures never cascade into a drafting call', async () => {
  for (const options of [
    { routeReturns: 'I cannot help with that', generateThrows: true },
    { routeThrows: true, generateEmpty: true },
  ]) {
    const { handler, calls } = loadHandler(options);
    const response = await handler(post('what fintech work has he done'));
    assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
    assert.equal(response.headers.get('X-Ask-Sources'), '');
    assert.equal(calls.length, 0);
  }
});

test('failure logs name the error without repeating what it said', async () => {
  // Provider messages carry request IDs and can quote the prompt back, and
  // router output can echo the question. The log needs the class and status,
  // not the text, so neither may reach it.
  const question = 'what fintech work has he done for acme-private-client';
  const upstream = Object.assign(
    new Error(`req_abc123: invalid request for prompt "${question}"`),
    { name: 'AI_APICallError', statusCode: 429 },
  );

  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.map(String).join(' '));
  try {
    await (loadHandler({ routeReturns: `Sure — ${question}` })).handler(post(question));
    await (loadHandler({ routeReturns: 'SOURCES: connect-api', generateThrows: upstream }))
      .handler(post('what fintech work has he done'));
  } finally {
    console.error = original;
  }

  const output = logged.join('\n');
  assert.match(output, /routing failed — unreadable response \(\d+ chars\)/);
  assert.match(output, /drafting failed — AI_APICallError, status 429/);
  assert.doesNotMatch(output, /acme-private-client|req_abc123/);
});

/**
 * A reason is for whoever is debugging, and an anonymous caller is not that.
 *
 * `provider-error` and `answers-unavailable` name which dependency this
 * endpoint has and whether it is currently up, which anyone could poll for.
 * Production reports a bucket, and the detail goes to the runtime logs.
 */
test('production reports a bucket rather than naming the failure', async () => {
  delete process.env.ASK_DETAILED_REASONS;
  try {
    const down = await (loadHandler({ routeReturns: 'SOURCES: connect-api', generateThrows: true }))
      .handler(post('what fintech work has he done'));
    assert.equal(down.headers.get('X-Ask-Source'), 'fallback');
    assert.equal(down.headers.get('X-Ask-Reason'), 'unavailable');

    const noKey = await (loadHandler({ hasApiKey: false })).handler(post('what fintech work has he done'));
    assert.equal(noKey.headers.get('X-Ask-Reason'), 'unavailable', 'a missing key is our problem, not the caller\'s to know');

    const answersDown = await (loadHandler({ answersFail: true })).handler(post('what fintech work has he done'));
    assert.equal(answersDown.headers.get('X-Ask-Reason'), 'unavailable');

    const routerDown = await (loadHandler({ routeThrows: true })).handler(post('what fintech work has he done'));
    assert.equal(routerDown.headers.get('X-Ask-Source'), 'fallback');
    assert.equal(routerDown.headers.get('X-Ask-Reason'), 'unavailable');

    const unreadable = await (loadHandler({ routeReturns: 'I cannot help with that' }))
      .handler(post('what fintech work has he done'));
    assert.equal(unreadable.headers.get('X-Ask-Reason'), 'unavailable');
  } finally {
    process.env.ASK_DETAILED_REASONS = '1';
  }
});

test('the reasons a visitor can act on survive production', async () => {
  // These describe the caller's own situation — a malformed request, a spent
  // allowance, a subject nothing is written about — or where a drafted reply
  // got its material. None of them says whether a dependency is up, and
  // coarsening them would cost the only signal that says which answers to
  // write next without protecting anything.
  delete process.env.ASK_DETAILED_REASONS;
  try {
    const bad = await (loadHandler()).handler(new Request('https://designedbyomar.com/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.9' },
      body: 'not json',
    }));
    assert.equal(bad.headers.get('X-Ask-Reason'), 'bad-request');

    const { handler } = loadHandler();
    const nothing = await handler(post('how do penguins pay for parking in antarctica'));
    assert.equal(nothing.headers.get('X-Ask-Reason'), 'no-material');

    const sourced = await (loadHandler({ routeReturns: 'SOURCES: connect-api' }))
      .handler(post('what fintech work has he done'));
    assert.equal(sourced.headers.get('X-Ask-Reason'), 'router-sourced');

    const declined = await (loadHandler()).handler(post('what fintech work has he done'));
    assert.equal(declined.headers.get('X-Ask-Reason'), 'no-material');

    const limited = loadHandler().handler;
    const drain = () => new Request('https://designedbyomar.com/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.77' },
      body: JSON.stringify({ question: 'how do penguins pay for parking in antarctica' }),
    });
    let reason = null;
    for (let i = 0; i < 40; i += 1) reason = (await limited(drain())).headers.get('X-Ask-Reason');
    assert.equal(reason, 'rate-limited');

    // And a reviewed answer still carries no reason at all.
    const exact = await (loadHandler()).handler(post(answerFor('work-history').question));
    assert.equal(exact.headers.get('X-Ask-Source'), 'reviewed');
    assert.equal(exact.headers.get('X-Ask-Reason'), '');
  } finally {
    process.env.ASK_DETAILED_REASONS = '1';
  }
});

/**
 * A model id that Groq has retired fails permanently and silently: the request
 * does not error, it degrades, so the feature switches itself off and looks
 * like a quiet day. It took logging in production to see it, twice.
 */
test('neither model is one that does not work here', () => {
  for (const [role, id] of [['drafting', MODEL], ['routing', ROUTER_MODEL]]) {
    assert.ok(
      !UNUSABLE_MODELS.has(id),
      `the ${role} model is "${id}", which 404s for this account — and a 404 degrades silently`,
    );
    assert.ok(id && typeof id === 'string', `${role} model is set`);
  }
  // The id that actually caused the outage has to be in the list, or restoring
  // it would pass the guard built to stop exactly that.
  assert.ok(UNUSABLE_MODELS.has('llama-3.3-70b-versatile'));
  assert.ok(UNUSABLE_MODELS.has('llama-3.1-8b-instant'));
});

test('the models can be changed without a deploy', async () => {
  /*
    This replaces a test that searched the source for `process.env.GROQ_MODEL`
    and asserted nothing about what it selected — it would have passed if both
    variables were read into constants nobody used. Second time this session I
    wrote an assertion about the shape of the code instead of its behaviour.

    Node caches ES modules by URL, so a query string gives a fresh instance and
    the module-level constants are evaluated again against the environment.
  */
  const before = [process.env.GROQ_MODEL, process.env.GROQ_ROUTER_MODEL];
  try {
    process.env.GROQ_MODEL = 'vendor/drafting-override';
    process.env.GROQ_ROUTER_MODEL = 'vendor/routing-override';
    const overridden = await import('../api/ask.mjs?models=override');
    assert.equal(overridden.MODEL, 'vendor/drafting-override');
    assert.equal(overridden.ROUTER_MODEL, 'vendor/routing-override');

    // And the other half of the `||`: without them, the defaults stand.
    delete process.env.GROQ_MODEL;
    delete process.env.GROQ_ROUTER_MODEL;
    const defaults = await import('../api/ask.mjs?models=default');
    assert.match(defaults.MODEL, /^openai\/gpt-oss-/);
    assert.match(defaults.ROUTER_MODEL, /^openai\/gpt-oss-/);
    assert.ok(!UNUSABLE_MODELS.has(defaults.MODEL));
    assert.ok(!UNUSABLE_MODELS.has(defaults.ROUTER_MODEL));
  } finally {
    const [model, router] = before;
    if (model === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = model;
    if (router === undefined) delete process.env.GROQ_ROUTER_MODEL; else process.env.GROQ_ROUTER_MODEL = router;
  }
});

/**
 * Both models reason before answering and the previous ones did not, so every
 * ceiling in the file was sized for output that arrives alone. Carrying them
 * over would have spent the allowance on thinking: the router's line never
 * written, the draft truncated or empty. The same silent degradation that took
 * production logging to find.
 *
 * This pins the configuration, not a live call. The test seam replaces
 * `generate` and `route` wholesale, so the real provider functions — the ones
 * carrying these options — are never reached from here. Said plainly because
 * the test this replaces claimed more than it checked.
 */
test('the reasoning effort is one the chosen model actually accepts', () => {
  /*
    `none` was set here, on the strength of the provider's type union listing
    it. That union spans every Groq model; GPT-OSS accepts only low, medium and
    high, and `none` is rejected — so every draft request would have failed, in
    the change meant to make drafting work again.

    This asserts against the model in use rather than against the union, which
    is the distinction that was missed.
  */
  const family = Object.keys(SUPPORTED_EFFORT).find(prefix => MODEL.startsWith(prefix));
  assert.ok(family, `no supported-effort list for "${MODEL}" — add one before changing the model`);
  assert.ok(
    SUPPORTED_EFFORT[family].includes(REASONING.groq.reasoningEffort),
    `"${REASONING.groq.reasoningEffort}" is not accepted by ${MODEL}; it takes ${SUPPORTED_EFFORT[family].join(', ')}`,
  );

  // And the thinking must not reach the parser or the reader either way.
  assert.equal(REASONING.groq.reasoningFormat, 'hidden');
});

test('gpt-oss does not accept the efforts that are Qwen-only', () => {
  // Pins the constraint itself, so the list cannot quietly grow to include the
  // value that would break drafting.
  for (const qwenOnly of ['none', 'default']) {
    assert.ok(!SUPPORTED_EFFORT['openai/gpt-oss'].includes(qwenOnly));
    assert.ok(SUPPORTED_EFFORT.qwen.includes(qwenOnly));
  }
});

test('the output ceilings leave room for reasoning and the answer', () => {
  // The old values, sized for models that emitted only the answer.
  assert.ok(ROUTE_TOKENS > 20, `routing ceiling is ${ROUTE_TOKENS}; 20 could not fit reasoning and a line`);
  assert.ok(DRAFT_TOKENS > 200, `drafting ceiling is ${DRAFT_TOKENS}; 200 barely fit the prose alone`);
  // A 60–110 word answer is roughly 150 tokens before any reasoning.
  assert.ok(DRAFT_TOKENS >= 400, 'drafting needs room for reasoning and the prose after it');
});

/**
 * `textStream` yields strings; an edge Response body must yield Uint8Array.
 *
 * Passing the strings straight through was rejected — "This ReadableStream did
 * not return bytes" — *after* the generated headers had been committed, so the
 * response arrived announcing a draft with nothing in it and the panel rendered
 * an empty "Drafted, not reviewed" card. The client decodes with
 * TextDecoderStream, which needs bytes as well.
 *
 * It survived every test here because the stubs enqueue strings and nothing
 * asserted what came back out. It survived production because the models were
 * 404ing, so no draft ever reached the encoder.
 */
test('a drafted reply is streamed as bytes, and arrives intact', async () => {
  const { handler } = loadHandler({ routeReturns: 'SOURCES: connect-api' });
  const response = await handler(post('what fintech work has he done'));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');

  const reader = response.body.getReader();
  const chunks = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    assert.ok(
      value instanceof Uint8Array,
      `streamed a ${typeof value}; an edge Response body must yield Uint8Array`,
    );
    chunks.push(value);
  }

  assert.ok(chunks.length > 0, 'the body is not empty');
  const text = new TextDecoder().decode(
    chunks.reduce((all, chunk) => {
      const merged = new Uint8Array(all.length + chunk.length);
      merged.set(all);
      merged.set(chunk, all.length);
      return merged;
    }, new Uint8Array()),
  );
  assert.equal(text, 'generated reply', 'and decodes back to what the provider sent');
});

/** Reads a response body the way the browser does. */
const readBody = async (response, { requireBytes = false } = {}) => {
  const reader = response.body.getReader();
  const chunks = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (requireBytes) {
      assert.ok(value instanceof Uint8Array, `streamed a ${typeof value}; an edge body must yield Uint8Array`);
    }
    chunks.push(value);
  }
  const merged = chunks.reduce((all, chunk) => {
    const next = new Uint8Array(all.length + chunk.length);
    next.set(all);
    next.set(chunk, all.length);
    return next;
  }, new Uint8Array());
  return { text: new TextDecoder().decode(merged), count: chunks.length };
};

test('every chunk is encoded, not just the first', async () => {
  /*
    `readUntilText` buffers until the first chunk with text, then replays the
    buffer and pumps the rest — two separate places that enqueue, and the stub
    emitted one chunk and closed, so only the replay was ever exercised. A
    regression in the pump would have passed and reproduced the empty draft in
    production, which is the bug this whole change is about.
  */
  const parts = ['Omar ', '— “embedded ', 'payments” — ', 'Plastiq Connect.'];
  const { handler } = loadHandler({ routeReturns: 'SOURCES: connect-api', streamChunks: parts });
  const response = await handler(post('what fintech work has he done'));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  const { text, count } = await readBody(response, { requireBytes: true });
  assert.ok(count > 1, `only ${count} chunk reached the client; the pump path went untested`);
  assert.equal(text, parts.join(''));
});

test('a leading empty chunk does not lose the text that follows', async () => {
  // The buffer exists because providers open with empty chunks. Those are held
  // and replayed, so they must be encoded too.
  const { handler } = loadHandler({ routeReturns: 'SOURCES: connect-api', streamChunks: ['', '', 'Plastiq — “Connect”.'] });
  const response = await handler(post('what fintech work has he done'));

  const { text } = await readBody(response, { requireBytes: true });
  assert.equal(text, 'Plastiq — “Connect”.');
});

test('a multi-byte character survives the encoding', async () => {
  // Naive chunking splits a character across two chunks and corrupts it. The
  // answers use em dashes and curly quotes throughout.
  const { handler } = loadHandler({ routeReturns: 'SOURCES: connect-api', streamText: 'Omar — “embedded payments” — Plastiq' });
  const response = await handler(post('what fintech work has he done'));

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += value;
  }
  assert.equal(text, 'Omar — “embedded payments” — Plastiq');
});
