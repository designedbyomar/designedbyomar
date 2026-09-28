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
import { buildSourceIndex, retrieveSections } from '../src/ask-sources.mjs';

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
} = {}) => {
  const calls = [];
  const routeCalls = [];
  const handler = createHandler({
    hasApiKey: () => hasApiKey,
    loadAnswers: async () => {
      if (answersFail) throw new Error('answers unavailable');
      return { answers: approvedAnswers, index: buildIndex(approvedAnswers), studies: STUDIES };
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
  },
  {
    id: 'connect-api#1',
    caseStudy: 'connect-api',
    title: 'Connect API Payments',
    heading: 'Approach',
    text: 'Benchmarking against Stripe Connect settled what the product competed on: letting a partner hand over PCI scope and risk operations rather than build and certify them.',
  },
  {
    id: 'athena-ds#0',
    caseStudy: 'athena-ds',
    title: 'Athena Design System 2.0',
    heading: 'Challenge',
    text: 'Nomenclature and patterns had diverged across every product, so an audit came before a single asset was produced.',
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
/**
 * Nothing decided this question, so nothing may be served loosely.
 *
 * This reverses an earlier call. Serving the local overlap match whenever the
 * model could not run was meant to keep the feature "no worse than before
 * routing existed" — but before routing existed was the broken state, and that
 * path is where it kept surfacing: "what is the strongest fintech case study he
 * has" scores 0.56 against the Wisdom Management Portal, which is healthcare.
 * An exact hit is still served; anything looser gets the written miss.
 */
for (const [label, routeReturns] of [
  ['an empty response', ''],
  ['whitespace only', '   \n  '],
  ['a truncated id', 'leadership-or'],
  ['an id that does not exist', 'leadership-and-vision'],
  ['a refusal to answer', 'I cannot help with that'],
]) {
  test(`${label} from the router serves no answer at all, loose or drafted`, async () => {
    const { handler, calls } = loadHandler({ routeReturns });
    const response = await handler(post('is he a manager'));

    assert.equal(response.headers.get('X-Ask-Source'), 'fallback', `${label} must not be acted on`);
    assert.equal(calls.length, 0, 'and must not reach drafting either');
  });
}

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

test('a router failure serves the written miss, not the loose local match', async () => {
  const { handler, calls } = loadHandler({ routeThrows: true });
  const response = await handler(post('is he a manager'));

  // The local match here is a refusal answer at 1.00 — the original bug. When
  // nothing has judged the question, it is not served.
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0, 'and drafting is not attempted blind either');
});

test('with no key nothing loose is served', async () => {
  const { handler, routeCalls, calls } = loadHandler({ hasApiKey: false });
  const response = await handler(post('is he a manager'));

  assert.equal(routeCalls.length, 0, 'no key means no routing call is attempted');
  assert.equal(response.headers.get('X-Ask-Source'), 'fallback');
  assert.equal(calls.length, 0);
});

test('a question with no written answer is grounded in reviewed answers only', async () => {
  const { handler, calls } = loadHandler();
  const response = await handler(post(MISS_WITH_CONTEXT));

  assert.equal(response.headers.get('X-Ask-Source'), 'generated');
  assert.equal(calls.length, 1, 'the model is called exactly once on a miss');

  const { system } = calls[0];
  assert.match(system, /ONLY the material provided/i);
  assert.match(system, /third person/i);
  // Everything in the prompt must be text Omar approved.
  const quoted = system.split('REVIEWED ANSWERS:')[1];
  const approvedText = approvedAnswers.map(a => a.answer).join('\n');
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
  // Comfortably past the per-visitor ceiling, so the test does not have to be
  // edited every time that number moves.
  for (let i = 0; i < 20; i += 1) sources.push((await handler(sameVisitor())).headers.get('X-Ask-Source'));

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
  const { handler } = loadHandler({ generateStalls: true });
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

test('a named study the site does not have is ignored rather than trusted', async () => {
  const { handler, calls } = loadHandler({ routeReturns: 'SOURCES: connect-api,not-a-real-study' });
  const response = await handler(post('What is the strongest fintech case study he has'));

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.ok(!/not-a-real-study/.test(calls[0].system), 'an invented id must not reach the prompt');
  assert.ok(!/not-a-real-study/.test(response.headers.get('X-Ask-Sources')));
});

test('the case studies are only fetched when a draft actually needs them', async () => {
  // They are the largest file the endpoint can pull. A question a written
  // answer covers must never pay for it.
  let fetched = 0;
  const { handler } = loadHandler({ routeReturns: 'fintech-depth' });
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
  const { handler, calls } = loadHandler({ routeReturns: 'SOURCES: connect-api', sourcesFail: true });
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
