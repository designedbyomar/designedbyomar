import assert from 'node:assert/strict';
import test from 'node:test';
import { createHandler } from '../api/contact.mjs';
import { emptyInquiry, validateInquiry } from '../src/content/inquiry.mjs';

const env = { RESEND_API_KEY: 'test-resend', CONTACT_FROM_EMAIL: 'Website inquiries <inquiries@designedbyomar.com>', TURNSTILE_SECRET_KEY: 'test-secret' };
const valid = { ...emptyInquiry(), name: 'Example Client', email: 'client@example.com', goals: 'Review our checkout flow.', timing: 'Not sure yet', budget: 'Not sure yet', budgetBasis: 'Not sure yet', token: 'verified-token', submissionId: '00000000-0000-4000-8000-000000000001', websiteTrap: '' };
const request = (body = valid, init = {}) => new Request('https://www.designedbyomar.com/api/contact', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://www.designedbyomar.com', 'x-real-ip': '1.2.3.4', ...init.headers }, body: JSON.stringify(body), ...Object.fromEntries(Object.entries(init).filter(([key]) => key !== 'headers')),
});
const json = data => new Response(JSON.stringify(data));
const verify = { success: true, hostname: 'www.designedbyomar.com', action: 'ratecard_inquiry' };

test('configuration discovery exposes no secrets and disables unconfigured sending', async () => {
  const handler = createHandler({ getEnv: () => ({}) });
  assert.deepEqual(await (await handler(new Request('https://www.designedbyomar.com/api/contact'))).json(), { available: false });
  assert.equal((await handler(request())).status, 503);
});
test('a valid inquiry verifies first, sends once to the fixed inbox, and uses client reply-to', async () => {
  const calls = [];
  const handler = createHandler({ getEnv: () => env, fetchImpl: async (url, init) => { calls.push([url, init]); return json(url.includes('siteverify') ? verify : { id: 'email-id' }); } });
  assert.deepEqual(await (await handler(request({ ...valid, to: 'attacker@example.com', from: 'attacker@example.com' }))).json(), { sent: true });
  assert.equal(calls.length, 2);
  const email = JSON.parse(calls[1][1].body);
  assert.deepEqual(email.to, ['omar@designedbyomar.com']);
  assert.equal(email.from, env.CONTACT_FROM_EMAIL);
  assert.equal(email.reply_to, valid.email);
  assert.ok(email.text.includes(valid.goals));
  assert.equal(email.html, undefined);
  assert.equal(calls[1][1].headers['Idempotency-Key'], `ratecard/${valid.submissionId}`);
  await handler(request());
  assert.equal(calls[3][1].headers['Idempotency-Key'], calls[1][1].headers['Idempotency-Key']);
  assert.equal(calls[3][1].body, calls[1][1].body);
});
test('email errors, incomplete acknowledgments, and network timeouts never return success', async () => {
  for (const failure of ['error', 'missing', 'timeout']) {
    const handler = createHandler({ getEnv: () => env, fetchImpl: async url => {
      if (url.includes('siteverify')) return json(verify);
      if (failure === 'timeout') throw new DOMException('timeout', 'AbortError');
      if (failure === 'error') return new Response('{}', { status: 429 });
      return json({});
    } });
    const result = await handler(request());
    assert.equal(result.status, 502);
    assert.equal((await result.json()).sent, undefined);
  }
});
test('invalid, expired, wrong-action, and wrong-host tokens never send email', async () => {
  for (const response of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { ...verify, hostname: 'attacker.example' }, { ...verify, action: 'other' }]) {
    let calls = 0;
    const handler = createHandler({ getEnv: () => env, fetchImpl: async () => { calls++; return json(response); } });
    const result = await handler(request());
    assert.equal(result.status, 400); assert.equal(calls, 1);
    assert.equal((await result.json()).verificationFailed, true);
  }
});
test('invalid origin, method, payload, honeypot and field values stop before provider calls', async () => {
  const handler = createHandler({ getEnv: () => env, fetchImpl: () => { throw new Error('must not call'); } });
  assert.equal((await handler(request(valid, { headers: { Origin: 'https://attacker.example' } }))).status, 403);
  assert.equal((await handler(new Request('https://www.designedbyomar.com/api/contact', { method: 'DELETE' }))).status, 405);
  assert.equal((await handler(request(valid, { headers: { 'Content-Type': 'text/plain' } }))).status, 415);
  for (const [index, body] of [{ ...valid, websiteTrap: 'bot' }, { ...valid, goals: '' }, { ...valid, budget: 'invented' }, { ...valid, email: 'client\nBcc:attacker@example.com' }, { ...valid, submissionId: 'invalid' }, { ...valid, goals: 'x'.repeat(40000) }].entries()) {
    assert.equal((await handler(request(body, { headers: { 'x-real-ip': `${index + 10}::1` } }))).status, 400);
  }
});
test('rate limiter uses trusted IP, bounds retries, and expires its buckets', async () => {
  let time = 1000;
  const handler = createHandler({ getEnv: () => env, now: () => time, fetchImpl: async url => json(url.includes('siteverify') ? verify : { id: 'sent' }) });
  for (let i = 0; i < 5; i++) assert.equal((await handler(request(valid, { headers: { 'x-forwarded-for': `spoof-${i}`, 'x-real-ip': '1.2.3.4' } }))).status, 200);
  assert.equal((await handler(request())).status, 429);
  time += 600001;
  assert.equal((await handler(request())).status, 200);
});
test('only exact configured preview hosts are accepted', async () => {
  const previewEnv = { ...env, VERCEL_URL: 'portfolio-preview.vercel.app' };
  const handler = createHandler({ getEnv: () => previewEnv, fetchImpl: async url => json(url.includes('siteverify') ? { ...verify, hostname: previewEnv.VERCEL_URL } : { id: 'sent' }) });
  const body = { method: 'POST', headers: { Origin: `https://${previewEnv.VERCEL_URL}`, 'Content-Type': 'application/json' }, body: JSON.stringify(valid) };
  assert.equal((await handler(new Request(`https://${previewEnv.VERCEL_URL}/api/contact`, body))).status, 200);
  assert.equal((await handler(new Request('https://attacker.vercel.app/api/contact', { ...body, headers: { ...body.headers, Origin: 'https://attacker.vercel.app' } }))).status, 403);
});
test('shared validation covers lengths, optional URLs, and flexible required choices', () => {
  assert.equal(validateInquiry(valid).valid, true);
  assert.equal(validateInquiry({ ...valid, name: 'x'.repeat(121) }).valid, false);
  for (const website of ['javascript:alert(1)', 'https://user:pass@example.com', 'example.com']) assert.equal(validateInquiry({ ...valid, website }).valid, false);
  assert.equal(validateInquiry({ ...valid, website: 'https://example.com' }).valid, true);
  assert.equal(validateInquiry({ ...valid, timing: [], company: {} }).valid, false);
});

test('the upstream deadline aborts a stalled email request', async () => {
  let aborted = false;
  const handler = createHandler({ getEnv: () => env, timeoutMs: 10, fetchImpl: async (url, init) => {
    if (url.includes('siteverify')) return json(verify);
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('timeout', 'AbortError')); }));
  } });
  assert.equal((await handler(request())).status, 502);
  assert.equal(aborted, true);
});
