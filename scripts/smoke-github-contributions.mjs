const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const endpointUrl = urlIndex === -1 ? '' : args[urlIndex + 1];
const expectFallback = args.includes('--expect-fallback');

const fail = (message) => {
  throw new Error(`GitHub contributions smoke check failed: ${message}`);
};

if (!endpointUrl) {
  fail('pass the deployed endpoint with --url https://example.com/api/github-contributions');
}

// Mirror the endpoint's timeout: `AbortSignal.timeout` is not guaranteed in every
// runtime, so feature-detect it and fall back to an AbortController + timer rather
// than throwing before the request is even made.
const createTimeout = (ms) => {
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

const { signal, cancel } = createTimeout(15_000);
let response;
try {
  response = await fetch(endpointUrl, {
    headers: { Accept: 'application/json' },
    redirect: 'manual',
    signal,
  });
} finally {
  cancel();
}

if (response.status >= 300 && response.status < 400) {
  fail(`received redirect ${response.status}; authenticate to the preview or use an unprotected deployment`);
}

let body;
try {
  body = await response.json();
} catch {
  fail(`received non-JSON response with status ${response.status}`);
}

if (expectFallback) {
  if (response.status !== 503 || body?.error !== 'GitHub activity is temporarily unavailable.') {
    fail(`expected the 503 fallback, received ${response.status}`);
  }
  console.log('GitHub contributions fallback verified.');
} else {
  if (!response.ok) fail(`received status ${response.status}`);
  if (!Number.isInteger(body?.totalContributions) || !Array.isArray(body?.weeks) || !body?.range?.from || !body?.range?.to) {
    fail('response does not match the public calendar contract');
  }
  if (body.profileUrl !== 'https://github.com/designedbyomar') {
    fail('response points at an unexpected GitHub profile');
  }
  const cacheControl = response.headers.get('cache-control') || '';
  if (!cacheControl.includes('max-age=300')) {
    fail('browser cache header is missing max-age=300');
  }
  const cdnCacheControl = response.headers.get('cdn-cache-control') || '';
  if (!cdnCacheControl.includes('s-maxage=21600') || !cdnCacheControl.includes('stale-while-revalidate=86400')) {
    fail('CDN cache header is missing the six-hour TTL or 24-hour stale window');
  }
  console.log(`GitHub contributions endpoint verified: ${body.totalContributions} contributions from ${body.range.from} to ${body.range.to}.`);
}
