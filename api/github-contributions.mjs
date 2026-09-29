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

export const createHandler = ({
  fetchImpl = fetch,
  getToken = () => process.env.GITHUB_CONTRIBUTIONS_TOKEN,
  now = () => new Date(),
  reportFailure = logFailure,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) => async (request) => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { error: 'Method not allowed.' },
      405,
      { Allow: 'GET', 'Cache-Control': 'no-store' },
    );
  }

  const token = getToken();
  if (!token) {
    reportFailure('missing-token');
    return unavailable(503);
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
      return unavailable();
    }

    if (!response.ok) {
      reportFailure('upstream-http', response.status);
      return unavailable();
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      reportFailure('invalid-json');
      return unavailable();
    }

    try {
      const normalized = normalizeContributionData(payload, now());
      return jsonResponse(normalized, 200, CACHE_HEADERS);
    } catch {
      reportFailure('invalid-payload');
      return unavailable();
    }
  } finally {
    cancel();
  }
};

export const config = { runtime: 'edge' };

export default createHandler();
