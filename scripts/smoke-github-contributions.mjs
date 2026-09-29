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

const response = await fetch(endpointUrl, {
  headers: { Accept: 'application/json' },
  redirect: 'manual',
  signal: AbortSignal.timeout(15_000),
});

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
  console.log(`GitHub contributions endpoint verified: ${body.totalContributions} contributions from ${body.range.from} to ${body.range.to}.`);
}
