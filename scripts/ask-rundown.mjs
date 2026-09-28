#!/usr/bin/env node
/**
 * A rundown of the questions visitors asked that the Ask panel had no written
 * answer for — so the common ones can be written up as reviewed answers, which
 * then match without a model call.
 *
 * This is a LOCAL authoring aid, like scripts/build-ask-corpus.mjs. Nothing here
 * ships to production, and it adds no runtime dependency to the site: the data it
 * reads is already collected. The client fires an `ask_no_match` GA4 event on
 * every drafted-or-fell-back miss, carrying the question, the reason, the nearest
 * written answer and how it was answered (src/main.jsx). This pulls those events
 * back out and ranks them.
 *
 * Zero dependencies on purpose. It mints a Google OAuth access token from a
 * service-account key with Node's built-in crypto (a signed JWT bearer grant),
 * then calls the GA4 Data API over fetch. No SDK, no gRPC, nothing added to the
 * lockfile for a script run by hand a few times a month.
 *
 * Setup (one time, outside this repo):
 *   - In GA4 → Admin → Custom definitions, register event-scoped custom
 *     dimensions for the params: question, reason, nearest_id, answered_by.
 *     They only populate going forward, so a fresh setup has no history yet.
 *   - Create a Google Cloud service account, enable the Analytics Data API,
 *     grant it Viewer on the GA4 property, and download its JSON key.
 *   - Find the numeric Property ID in GA4 → Admin → Property Settings (this is
 *     not the G-XXXX measurement id).
 *
 * Usage:
 *   GA4_PROPERTY_ID=123456789 \
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *   npm run ask:rundown -- --days 30 [--min 1] [--out rundown.md]
 *
 * Caveats worth knowing when reading the numbers:
 *   - GA4 truncates event-parameter values to 100 characters, so a very long
 *     question is reported clipped.
 *   - Only visitors who accepted analytics send anything; declined visitors are
 *     invisible here, so this is a floor, not a census.
 *   - Edge rate-limit counts are best-effort (see api/ask.mjs).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const fail = (msg) => {
  console.error(`ask-rundown: ${msg}`);
  process.exit(1);
};

// --- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const days = Number(flag('days', '30'));
const minCount = Number(flag('min', '1'));
const outPath = flag('out', null);
if (!Number.isFinite(days) || days < 1) fail('--days must be a positive number');

const propertyId = process.env.GA4_PROPERTY_ID;
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!propertyId) fail('set GA4_PROPERTY_ID (the numeric property id, not the G-XXXX measurement id)');
if (!keyPath) fail('set GOOGLE_APPLICATION_CREDENTIALS to the service-account JSON key path');

// --- auth: sign a JWT and exchange it for an access token ------------------
const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const getAccessToken = async (key) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: key.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key);
  const jwt = `${header}.${claims}.${base64url(signature)}`;

  const response = await fetch(key.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!response.ok) fail(`token exchange failed (${response.status}): ${await response.text()}`);
  return (await response.json()).access_token;
};

// --- GA4 Data API ---------------------------------------------------------
const runReport = async (token, body) => {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const json = await response.json();
  if (!response.ok) {
    const reason = json?.error?.message || JSON.stringify(json);
    if (/custom.?dimension|not.*(found|registered)|customEvent/i.test(reason)) {
      fail(`GA4 rejected a custom dimension — register question, reason, nearest_id and answered_by\n            as event-scoped custom definitions first (see this file's header).\n            GA said: ${reason}`);
    }
    fail(`GA4 runReport failed (${response.status}): ${reason}`);
  }
  return json.rows ?? [];
};

const dateRange = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

const missReport = (token) => runReport(token, {
  dateRanges: dateRange,
  dimensions: [
    { name: 'customEvent:question' },
    { name: 'customEvent:reason' },
    { name: 'customEvent:nearest_id' },
    { name: 'customEvent:answered_by' },
  ],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: {
    filter: { fieldName: 'eventName', stringFilter: { value: 'ask_no_match' } },
  },
  limit: 10000,
});

const contactReport = (token) => runReport(token, {
  dateRanges: dateRange,
  dimensions: [{ name: 'customEvent:question' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: {
    filter: { fieldName: 'eventName', stringFilter: { value: 'ask_contact_click' } },
  },
  limit: 10000,
});

// --- coverage: which nearest_ids are real written answers -----------------
const answersDoc = JSON.parse(readFileSync(resolve(ROOT, 'src/content/ask-answers.json'), 'utf8'));
const answerIds = new Set(answersDoc.answers.map((a) => a.id));

// --- aggregate ------------------------------------------------------------
const norm = (s) => (s ?? '').trim().replace(/\s+/g, ' ');
const clean = (v) => (!v || v === '(not set)' ? '' : v);

const aggregateMisses = (rows) => {
  const byQuestion = new Map();
  for (const row of rows) {
    const [question, reason, nearestId, answeredBy] = row.dimensionValues.map((d) => d.value);
    const key = norm(question).toLowerCase();
    if (!key) continue;
    const count = Number(row.metricValues[0].value) || 0;
    const entry = byQuestion.get(key) ?? {
      question: norm(question), count: 0, reasons: new Map(), nearest: new Set(), answeredBy: new Map(),
    };
    entry.count += count;
    if (clean(reason)) entry.reasons.set(clean(reason), (entry.reasons.get(clean(reason)) ?? 0) + count);
    if (clean(nearestId)) entry.nearest.add(clean(nearestId));
    if (clean(answeredBy)) entry.answeredBy.set(clean(answeredBy), (entry.answeredBy.get(clean(answeredBy)) ?? 0) + count);
    byQuestion.set(key, entry);
  }
  return [...byQuestion.values()]
    .filter((e) => e.count >= minCount)
    .sort((a, b) => b.count - a.count);
};

const aggregateContacts = (rows) => {
  const byQuestion = new Map();
  for (const row of rows) {
    const question = norm(row.dimensionValues[0].value);
    const key = question.toLowerCase();
    if (!key) continue;
    byQuestion.set(key, { question, count: (byQuestion.get(key)?.count ?? 0) + (Number(row.metricValues[0].value) || 0) });
  }
  return [...byQuestion.values()].filter((e) => e.count >= minCount).sort((a, b) => b.count - a.count);
};

const topOf = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

// --- render ---------------------------------------------------------------
const render = (misses, contacts) => {
  const lines = [];
  lines.push(`# Ask rundown — last ${days} days`);
  lines.push('');
  lines.push('_Questions visitors asked that had no written answer. Write reviewed answers for the');
  lines.push('recurring ones to cut model drafting. Numbers count consenting visitors only._');
  lines.push('');

  lines.push(`## Missed questions (${misses.length})`);
  if (!misses.length) {
    lines.push('');
    lines.push('None recorded in this window.');
  } else {
    lines.push('');
    lines.push('| Count | Question | Top reason | Nearest answer | Covered? |');
    lines.push('| ----: | -------- | ---------- | -------------- | -------- |');
    for (const e of misses) {
      const nearest = [...e.nearest][0] ?? '—';
      const covered = e.nearest.size && [...e.nearest].some((id) => answerIds.has(id)) ? 'yes' : 'NO — write one';
      lines.push(`| ${e.count} | ${e.question.replace(/\|/g, '\\|')} | ${topOf(e.reasons)} | ${nearest} | ${covered} |`);
    }
  }
  lines.push('');

  lines.push(`## Clicked "Email Omar" (${contacts.length})`);
  lines.push('');
  if (!contacts.length) {
    lines.push('None recorded in this window.');
  } else {
    lines.push('High-intent: these visitors wanted a real answer.');
    lines.push('');
    lines.push('| Count | Question |');
    lines.push('| ----: | -------- |');
    for (const e of contacts) lines.push(`| ${e.count} | ${e.question.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  return lines.join('\n');
};

// --- run ------------------------------------------------------------------
let key;
try {
  key = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
} catch (error) {
  fail(`could not read the service-account key at ${keyPath}: ${error.message}`);
}
if (!key.client_email || !key.private_key) fail('the key file is missing client_email or private_key');

const token = await getAccessToken(key);
const [missRows, contactRows] = await Promise.all([missReport(token), contactReport(token)]);
const output = render(aggregateMisses(missRows), aggregateContacts(contactRows));

if (outPath) {
  writeFileSync(resolve(outPath), `${output}\n`);
  console.error(`ask-rundown: wrote ${outPath}`);
} else {
  process.stdout.write(`${output}\n`);
}
