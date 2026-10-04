import { INQUIRY_FIELDS, validateInquiry } from '../src/content/inquiry.mjs';

const RECIPIENT = 'omar@designedbyomar.com';
const MAX_BYTES = 32768;
const ACTION = 'ratecard_inquiry';
const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const configured = env => Boolean(env.RESEND_API_KEY && env.CONTACT_FROM_EMAIL && env.TURNSTILE_SECRET_KEY);
const clientKey = request => {
  const platform = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-real-ip'))?.split(',')[0].trim();
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map(value => value.trim()).filter(Boolean);
  const ip = platform || forwarded?.[forwarded.length - 1];
  return ip && /^[0-9a-f.:]{2,45}$/i.test(ip) ? ip.toLowerCase() : 'unknown';
};
const readBody = async request => {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new Error('large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('empty');
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); throw new Error('large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
};
const allowedHosts = (request, env) => {
  const hosts = new Set(['designedbyomar.com', 'www.designedbyomar.com']);
  // Exact deployment/branch aliases only; never allow every *.vercel.app host.
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.CONTACT_PREVIEW_HOST]) if (host) hosts.add(host);
  const hostname = new URL(request.url).hostname;
  return hosts.has(hostname) ? hosts : new Set();
};

export const createHandler = ({ fetchImpl = fetch, getEnv = () => process.env, now = Date.now, timeoutMs = 8000 } = {}) => {
  const hits = new Map();
  const postJson = async (url, body, headers = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: controller.signal });
      const json = await result.json();
      if (!result.ok) throw new Error('upstream');
      return json;
    } finally { clearTimeout(timeout); }
  };
  return async request => {
    const env = getEnv();
    if (request.method === 'GET') return response({ available: configured(env) });
    if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);
    if (!configured(env)) return response({ error: 'Please email Omar directly while the form is unavailable.' }, 503);
    const hosts = allowedHosts(request, env);
    let origin;
    try { origin = new URL(request.headers.get('origin')); } catch { return response({ error: 'Invalid origin.' }, 403); }
    if (!hosts.size || origin.origin !== new URL(request.url).origin) return response({ error: 'Invalid origin.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return response({ error: 'Expected JSON.' }, 415);
    const ip = clientKey(request);
    const current = now();
    for (const [key, value] of hits) if (current - value.start >= 600000) hits.delete(key);
    const bucket = hits.get(ip) || { start: current, count: 0 };
    if (!hits.has(ip) && hits.size >= 5000) return response({ error: 'Please try again later.' }, 429);
    bucket.count += 1; hits.set(ip, bucket);
    if (bucket.count > 5) return response({ error: 'Please wait before trying again.' }, 429);
    let body;
    try { body = await readBody(request); } catch { return response({ error: 'Invalid or oversized request.' }, 400); }
    if (!body || Array.isArray(body) || typeof body !== 'object' || body.websiteTrap) return response({ error: 'Unable to submit this inquiry.' }, 400);
    const { values, errors, valid } = validateInquiry(body);
    if (!valid) return response({ error: 'Please check the highlighted fields.', errors }, 400);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId || '') || typeof body.token !== 'string' || !body.token || body.token.length > 2048) return response({ error: 'Please refresh verification and try again.' }, 400);
    try {
      const verification = await postJson('https://challenges.cloudflare.com/turnstile/v0/siteverify', { secret: env.TURNSTILE_SECRET_KEY, response: body.token, ...(ip !== 'unknown' && { remoteip: ip }) });
      if (!verification.success || !hosts.has(verification.hostname) || verification.action !== ACTION) return response({ error: 'Verification expired or failed. Please verify again.', verificationFailed: true }, 400);
      const email = await postJson('https://api.resend.com/emails', {
        from: env.CONTACT_FROM_EMAIL, to: [RECIPIENT], reply_to: values.email,
        subject: 'Website inquiry — services & rates',
        text: INQUIRY_FIELDS.map(field => `${field.label}:\n${values[field.name] || 'Not provided'}`).join('\n\n'),
      }, { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Idempotency-Key': `ratecard/${body.submissionId}` });
      if (!email.id) throw new Error('missing-id');
      return response({ sent: true });
    } catch { return response({ error: 'We couldn’t confirm that your inquiry was sent. Try again or email Omar directly.' }, 502); }
  };
};
export const config = { runtime: 'edge' };
export default createHandler();
