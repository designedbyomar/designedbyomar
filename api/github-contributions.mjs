const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_LOGIN = 'designedbyomar';
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_LOGIN}`;

export const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300',
  'CDN-Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
};

export const CONTRIBUTION_QUERY = `
  query PortfolioContributions($login: String!) {
    user(login: $login) {
      contributionsCollection {
        startedAt
        endedAt
        contributionCalendar {
          totalContributions
          months {
            name
            firstDay
            totalWeeks
          }
          weeks {
            firstDay
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const jsonResponse = (body, status, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  },
});

const unavailable = (status = 502) => jsonResponse(
  { error: 'GitHub activity is temporarily unavailable.' },
  status,
  { 'Cache-Control': 'no-store' },
);

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
const validInteger = value => Number.isInteger(value) && value >= 0;

const logFailure = (category, status) => {
  const suffix = Number.isInteger(status) ? ` status=${status}` : '';
  console.error(`[github-contributions] ${category}${suffix}`);
};

export const normalizeContributionData = (payload, updatedAt = new Date()) => {
  if (payload?.errors?.length) throw new Error('GitHub returned GraphQL errors.');

  const collection = payload?.data?.user?.contributionsCollection;
  const calendar = collection?.contributionCalendar;
  if (!collection || !calendar || !validDate(collection.startedAt) || !validDate(collection.endedAt)) {
    throw new Error('GitHub returned an invalid contribution collection.');
  }
  if (!validInteger(calendar.totalContributions) || !Array.isArray(calendar.months) || !Array.isArray(calendar.weeks)) {
    throw new Error('GitHub returned an invalid contribution calendar.');
  }

  const months = calendar.months.map((month) => {
    if (typeof month?.name !== 'string' || !validDate(month.firstDay) || !validInteger(month.totalWeeks)) {
      throw new Error('GitHub returned invalid month data.');
    }
    return {
      name: month.name.slice(0, 3),
      firstDay: month.firstDay.slice(0, 10),
      totalWeeks: month.totalWeeks,
    };
  });

  const weeks = calendar.weeks.map((week) => {
    if (!validDate(week?.firstDay) || !Array.isArray(week.contributionDays)) {
      throw new Error('GitHub returned invalid week data.');
    }

    const days = week.contributionDays.map((day) => {
      const level = LEVELS[day?.contributionLevel];
      if (!validDate(day?.date) || !validInteger(day.weekday) || day.weekday > 6 || !validInteger(day.contributionCount) || level === undefined) {
        throw new Error('GitHub returned invalid day data.');
      }
      return {
        date: day.date.slice(0, 10),
        weekday: day.weekday,
        count: day.contributionCount,
        level,
      };
    });

    return {
      firstDay: week.firstDay.slice(0, 10),
      days,
    };
  });

  const timestamp = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  if (Number.isNaN(timestamp.getTime())) throw new Error('Invalid update timestamp.');

  return {
    login: GITHUB_LOGIN,
    profileUrl: GITHUB_PROFILE_URL,
    totalContributions: calendar.totalContributions,
    range: {
      from: collection.startedAt.slice(0, 10),
      to: collection.endedAt.slice(0, 10),
    },
    months,
    weeks,
    updatedAt: timestamp.toISOString(),
  };
};

const REQUEST_TIMEOUT_MS = 8_000;

// `AbortSignal.timeout` is not guaranteed in every Edge runtime build. Feature-detect
// it and fall back to a controller + timer so an unsupported runtime cannot throw
// before `fetch` and turn the endpoint into a permanent 502.
const createRequestTimeout = (ms) => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    try {
      return { signal: AbortSignal.timeout(ms), cancel: () => {} };
    } catch {
      // Fall through to the manual controller below.
    }
  }

  if (typeof AbortController !== 'function') {
    return { signal: undefined, cancel: () => {} };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
};

/*
  Abuse controls.

  The endpoint is public and used to call GitHub on every invocation, so an
  attacker could cache-bust (vary the query string or headers) to force endless
  upstream calls and burn the PAT's hourly quota — leaving the widget degraded.

  Two controls, in order of importance:

  1. A single module-scope snapshot of the last good calendar, served for its TTL.
     This decouples request volume from GitHub calls: however many requests reach
     a warm instance, at most one refresh per TTL fires, and it ignores the URL and
     headers, so cache-busting cannot force a miss. When GitHub is down the snapshot
     is served stale rather than failing, which also removes the pressure to retry.
  2. A per-IP ceiling on the refresh path only (serving the snapshot is free and is
     never counted). Best-effort — edge instances are ephemeral and regional, so it
     caps one hot instance rather than enforcing a global budget; the snapshot is
     the real protection. Mirrors the limiter in api/ask.mjs.
*/
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // fresh window; matches the CDN s-maxage
const STALE_MAX_MS = 24 * 60 * 60 * 1000;  // still served if GitHub is down; matches the SWR window
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

const IP_SHAPE = /^[0-9a-f.:]{2,45}$/i;

// The leftmost x-forwarded-for entry is client-controlled, so reading it lets one
// visitor rotate through unlimited buckets. Vercel sets x-vercel-forwarded-for /
// x-real-ip itself, so those win; failing both, the rightmost forwarded entry is
// the one the nearest proxy appended, which the client cannot choose.
const clientKey = (request) => {
  const { headers } = request;
  const platform = (headers.get('x-vercel-forwarded-for') ?? headers.get('x-real-ip'))
    ?.split(',')[0]?.trim();
  const forwarded = headers.get('x-forwarded-for')
    ?.split(',').map(part => part.trim()).filter(Boolean).at(-1);
  const ip = platform || forwarded;
  return ip && IP_SHAPE.test(ip) ? ip.toLowerCase() : 'unknown';
};

const overLimit = (hits, ip, limit, windowMs, nowMs) => {
  const recent = (hits.get(ip) ?? []).filter(t => nowMs - t < windowMs);
  recent.push(nowMs);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
};

export const createHandler = ({
  fetchImpl = fetch,
  getToken = () => process.env.GITHUB_CONTRIBUTIONS_TOKEN,
  now = () => new Date(),
  reportFailure = logFailure,
  timeoutMs = REQUEST_TIMEOUT_MS,
  // Per-handler so tests stay isolated; the production singleton (the default
  // export) creates one of each, shared across every request its instance sees.
  store = { data: null, at: 0 },
  rateState = new Map(),
  cacheTtlMs = CACHE_TTL_MS,
  staleMaxMs = STALE_MAX_MS,
  rateLimit = RATE_LIMIT,
  rateWindowMs = RATE_WINDOW_MS,
} = {}) => async (request) => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { error: 'Method not allowed.' },
      405,
      { Allow: 'GET', 'Cache-Control': 'no-store' },
    );
  }

  const nowMs = now().getTime();
  const age = store.data ? nowMs - store.at : Infinity;
  const cached = (status) => jsonResponse(store.data, 200, { ...CACHE_HEADERS, 'X-Contributions-Cache': status });

  // 1. Fresh snapshot: serve it without a token, a fetch, or touching the limit.
  if (store.data && age < cacheTtlMs) return cached('hit');

  // The stale snapshot is the fallback whenever a refresh cannot or should not run.
  const stale = store.data && age < staleMaxMs ? () => cached('stale') : null;

  const token = getToken();
  if (!token) {
    if (stale) return stale();
    reportFailure('missing-token');
    return unavailable(503);
  }

  // 2. Gate the upstream refresh per IP. Serving cache above never reaches here,
  // so a flood against a warm instance is already free of GitHub calls; this only
  // bounds the cold/stale path where a refresh would otherwise fire every request.
  if (overLimit(rateState, clientKey(request), rateLimit, rateWindowMs, nowMs)) {
    if (stale) return stale();
    reportFailure('rate-limited');
    return jsonResponse(
      { error: 'GitHub activity is temporarily unavailable.' },
      429,
      { 'Cache-Control': 'no-store', 'Retry-After': String(Math.ceil(rateWindowMs / 1000)) },
    );
  }

  const { signal, cancel } = createRequestTimeout(timeoutMs);

  try {
    let response;
    try {
      response = await fetchImpl(GITHUB_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'designedbyomar.com',
        },
        body: JSON.stringify({
          query: CONTRIBUTION_QUERY,
          variables: { login: GITHUB_LOGIN },
        }),
        signal,
      });
    } catch {
      reportFailure('request-failed');
      return stale ? stale() : unavailable();
    }

    if (!response.ok) {
      reportFailure('upstream-http', response.status);
      return stale ? stale() : unavailable();
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      reportFailure('invalid-json');
      return stale ? stale() : unavailable();
    }

    try {
      const normalized = normalizeContributionData(payload, now());
      store.data = normalized;
      store.at = nowMs;
      return jsonResponse(normalized, 200, { ...CACHE_HEADERS, 'X-Contributions-Cache': 'miss' });
    } catch {
      reportFailure('invalid-payload');
      return stale ? stale() : unavailable();
    }
  } finally {
    cancel();
  }
};

export const config = { runtime: 'edge' };

export default createHandler();
