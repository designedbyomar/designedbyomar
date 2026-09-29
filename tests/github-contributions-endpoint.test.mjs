import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CACHE_HEADERS,
  CONTRIBUTION_QUERY,
  createHandler,
  normalizeContributionData,
} from '../api/github-contributions.mjs';

const githubPayload = ({ errors } = {}) => errors ? { errors } : ({
  data: {
    user: {
      contributionsCollection: {
        startedAt: '2025-09-28T00:00:00Z',
        endedAt: '2026-09-28T23:59:59Z',
        contributionCalendar: {
          totalContributions: 321,
          months: [
            { name: 'September', firstDay: '2025-09-28', totalWeeks: 1 },
            { name: 'October', firstDay: '2025-10-01', totalWeeks: 1 },
          ],
          weeks: [
            {
              firstDay: '2025-09-28',
              contributionDays: [
                { date: '2025-09-28', weekday: 0, contributionCount: 0, contributionLevel: 'NONE' },
                { date: '2025-09-29', weekday: 1, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
              ],
            },
            {
              firstDay: '2025-10-05',
              contributionDays: [
                { date: '2025-10-05', weekday: 0, contributionCount: 7, contributionLevel: 'FOURTH_QUARTILE' },
              ],
            },
          ],
        },
      },
    },
  },
});

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  ...init,
});

test('normalizes the public contribution calendar without repository details', () => {
  const result = normalizeContributionData(githubPayload(), new Date('2026-09-28T12:00:00Z'));

  assert.deepEqual(result, {
    login: 'designedbyomar',
    profileUrl: 'https://github.com/designedbyomar',
    totalContributions: 321,
    range: { from: '2025-09-28', to: '2026-09-28' },
    months: [
      { name: 'Sep', firstDay: '2025-09-28', totalWeeks: 1 },
      { name: 'Oct', firstDay: '2025-10-01', totalWeeks: 1 },
    ],
    weeks: [
      {
        firstDay: '2025-09-28',
        days: [
          { date: '2025-09-28', weekday: 0, count: 0, level: 0 },
          { date: '2025-09-29', weekday: 1, count: 1, level: 1 },
        ],
      },
      {
        firstDay: '2025-10-05',
        days: [
          { date: '2025-10-05', weekday: 0, count: 7, level: 4 },
        ],
      },
    ],
    updatedAt: '2026-09-28T12:00:00.000Z',
  });
  assert.equal(JSON.stringify(result).includes('repository'), false);
});

test('GET queries GitHub with the server token and returns CDN-cacheable JSON', async () => {
  const calls = [];
  const handler = createHandler({
    getToken: () => 'server-only-token',
    now: () => new Date('2026-09-28T12:00:00Z'),
    fetchImpl: async (...args) => {
      calls.push(args);
      return json(githubPayload());
    },
  });

  const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), CACHE_HEADERS['Cache-Control']);
  assert.equal(response.headers.get('CDN-Cache-Control'), CACHE_HEADERS['CDN-Cache-Control']);
  assert.equal(response.headers.get('Vercel-CDN-Cache-Control'), CACHE_HEADERS['Vercel-CDN-Cache-Control']);
  assert.equal(body.totalContributions, 321);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://api.github.com/graphql');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer server-only-token');

  const requestBody = JSON.parse(calls[0][1].body);
  assert.equal(requestBody.query, CONTRIBUTION_QUERY);
  assert.deepEqual(requestBody.variables, { login: 'designedbyomar' });
});

test('rejects non-GET requests without contacting GitHub', async () => {
  let called = false;
  const handler = createHandler({
    getToken: () => 'token',
    fetchImpl: async () => {
      called = true;
      return json(githubPayload());
    },
  });

  const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions', { method: 'POST' }));

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(called, false);
});

test('returns an uncached 503 when the server token is missing', async () => {
  const failures = [];
  const handler = createHandler({
    getToken: () => '',
    reportFailure: (...failure) => failures.push(failure),
  });
  const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'GitHub activity is temporarily unavailable.' });
  assert.deepEqual(failures, [['missing-token']]);
});

test('returns a generic uncached error for upstream HTTP and GraphQL failures', async (t) => {
  await t.test('HTTP failure', async () => {
    const failures = [];
    const handler = createHandler({
      getToken: () => 'token',
      fetchImpl: async () => json({ message: 'secret upstream detail' }, { status: 500 }),
      reportFailure: (...failure) => failures.push(failure),
    });
    const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'GitHub activity is temporarily unavailable.' });
    assert.deepEqual(failures, [['upstream-http', 500]]);
  });

  await t.test('GraphQL failure', async () => {
    const failures = [];
    const handler = createHandler({
      getToken: () => 'token',
      fetchImpl: async () => json(githubPayload({ errors: [{ message: 'private detail' }] })),
      reportFailure: (...failure) => failures.push(failure),
    });
    const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'GitHub activity is temporarily unavailable.' });
    assert.deepEqual(failures, [['invalid-payload']]);
  });
});

test('rejects malformed calendars instead of publishing partial data', () => {
  const payload = githubPayload();
  payload.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionLevel = 'UNKNOWN';

  assert.throws(
    () => normalizeContributionData(payload),
    /invalid day data/i,
  );
});

test('still reaches GitHub when the runtime lacks AbortSignal.timeout', async (t) => {
  const original = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');
  t.after(() => {
    if (original) Object.defineProperty(AbortSignal, 'timeout', original);
  });

  await t.test('missing entirely', async () => {
    delete AbortSignal.timeout;

    const calls = [];
    const handler = createHandler({
      getToken: () => 'token',
      now: () => new Date('2026-09-28T12:00:00Z'),
      fetchImpl: async (...args) => {
        calls.push(args);
        return json(githubPayload());
      },
    });

    const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.ok(calls[0][1].signal instanceof AbortSignal);
    assert.equal(calls[0][1].signal.aborted, false);
  });

  await t.test('present but throwing', async () => {
    Object.defineProperty(AbortSignal, 'timeout', {
      configurable: true,
      writable: true,
      value: () => { throw new TypeError('not implemented'); },
    });

    const calls = [];
    const handler = createHandler({
      getToken: () => 'token',
      now: () => new Date('2026-09-28T12:00:00Z'),
      fetchImpl: async (...args) => {
        calls.push(args);
        return json(githubPayload());
      },
    });

    const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));

    assert.equal(response.status, 200);
    assert.ok(calls[0][1].signal instanceof AbortSignal);
  });
});

test('the fallback timeout still aborts a GitHub request that runs long', async (t) => {
  const original = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');
  t.after(() => {
    if (original) Object.defineProperty(AbortSignal, 'timeout', original);
  });
  delete AbortSignal.timeout;

  const failures = [];
  const handler = createHandler({
    getToken: () => 'token',
    timeoutMs: 20,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason ?? new Error('aborted')));
    }),
    reportFailure: (...failure) => failures.push(failure),
  });

  const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));

  assert.equal(response.status, 502);
  assert.deepEqual(failures, [['request-failed']]);
});

const ENDPOINT = 'https://www.designedbyomar.com/api/github-contributions';

test('serves a warm snapshot without calling GitHub again, even when the URL varies', async () => {
  // The abuse vector: without a snapshot the endpoint hit GitHub on every request,
  // so cache-busting could burn the PAT quota. The snapshot ignores the URL.
  const calls = [];
  const handler = createHandler({
    getToken: () => 'token',
    now: () => new Date('2026-09-28T12:00:00Z'),
    fetchImpl: async (...args) => { calls.push(args); return json(githubPayload()); },
  });

  const first = await handler(new Request(ENDPOINT));
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('X-Contributions-Cache'), 'miss');
  assert.equal(calls.length, 1);

  const second = await handler(new Request(`${ENDPOINT}?bust=${Date.now()}`));
  assert.equal(second.status, 200);
  assert.equal(second.headers.get('X-Contributions-Cache'), 'hit');
  assert.equal((await second.json()).totalContributions, 321);
  assert.equal(calls.length, 1, 'a cache-busting query string must not force another GitHub call');
});

test('rate-limits the refresh path per IP when there is no snapshot to serve', async () => {
  const calls = [];
  const failures = [];
  const handler = createHandler({
    getToken: () => 'token',
    rateLimit: 2,
    // Every refresh fails, so the cache stays empty and every request stays on the
    // refresh path — isolating the limiter from the snapshot.
    fetchImpl: async (...args) => { calls.push(args); return json({ message: 'down' }, { status: 500 }); },
    reportFailure: (...failure) => failures.push(failure),
  });
  const req = () => new Request(ENDPOINT, { headers: { 'x-vercel-forwarded-for': '203.0.113.7' } });

  assert.equal((await handler(req())).status, 502);
  assert.equal((await handler(req())).status, 502);
  const limited = await handler(req());

  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Cache-Control'), 'no-store');
  assert.ok(Number(limited.headers.get('Retry-After')) > 0);
  assert.equal(calls.length, 2, 'the over-limit request never reaches GitHub');
  assert.ok(failures.some(([category]) => category === 'rate-limited'));
});

test('serves the last good snapshot when a later refresh fails', async () => {
  let clock = Date.parse('2026-09-28T12:00:00Z');
  let fetchCount = 0;
  const handler = createHandler({
    getToken: () => 'token',
    now: () => new Date(clock),
    cacheTtlMs: 1000,
    staleMaxMs: 60 * 60 * 1000,
    fetchImpl: async () => {
      fetchCount += 1;
      return fetchCount === 1 ? json(githubPayload()) : json({ message: 'down' }, { status: 500 });
    },
    reportFailure: () => {},
  });

  const fresh = await handler(new Request(ENDPOINT));
  assert.equal(fresh.headers.get('X-Contributions-Cache'), 'miss');

  clock += 5000; // past the 1s fresh window, inside the 1h stale window
  const stale = await handler(new Request(ENDPOINT));
  assert.equal(stale.status, 200, 'GitHub is down, but the snapshot is still served');
  assert.equal(stale.headers.get('X-Contributions-Cache'), 'stale');
  assert.equal((await stale.json()).totalContributions, 321);
  assert.equal(fetchCount, 2, 'it attempted a refresh before falling back to the snapshot');
});

test('a rate-limited refresh serves the snapshot instead of calling GitHub', async () => {
  let clock = Date.parse('2026-09-28T12:00:00Z');
  let fetchCount = 0;
  const handler = createHandler({
    getToken: () => 'token',
    now: () => new Date(clock),
    cacheTtlMs: 1000,
    staleMaxMs: 60 * 60 * 1000,
    rateLimit: 1,
    fetchImpl: async () => { fetchCount += 1; return json(githubPayload()); },
  });
  const req = () => new Request(ENDPOINT, { headers: { 'x-vercel-forwarded-for': '203.0.113.9' } });

  await handler(req()); // stores the snapshot (counts one refresh)
  clock += 5000; // now stale, so the next request would refresh — but it is over the limit
  const limited = await handler(req());

  assert.equal(limited.status, 200);
  assert.equal(limited.headers.get('X-Contributions-Cache'), 'stale');
  assert.equal(fetchCount, 1, 'the over-limit refresh is answered from the snapshot, not GitHub');
});
