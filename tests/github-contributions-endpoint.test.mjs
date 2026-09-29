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
  const handler = createHandler({ getToken: () => '' });
  const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'GitHub activity is temporarily unavailable.' });
});

test('returns a generic uncached error for upstream HTTP and GraphQL failures', async (t) => {
  await t.test('HTTP failure', async () => {
    const handler = createHandler({
      getToken: () => 'token',
      fetchImpl: async () => json({ message: 'secret upstream detail' }, { status: 500 }),
    });
    const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'GitHub activity is temporarily unavailable.' });
  });

  await t.test('GraphQL failure', async () => {
    const handler = createHandler({
      getToken: () => 'token',
      fetchImpl: async () => json(githubPayload({ errors: [{ message: 'private detail' }] })),
    });
    const response = await handler(new Request('https://www.designedbyomar.com/api/github-contributions'));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'GitHub activity is temporarily unavailable.' });
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
