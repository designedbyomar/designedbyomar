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
 * back out and ranks them. Every row is a gap by definition — `ask_no_match`
 * only fires when nothing written answered the question.
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
 * How to run (this site's GA4 property is 348007935; the key path is your own
 * local file, which must stay OUT of git):
 *
 *   GA4_PROPERTY_ID=348007935 \
 *   GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/your-service-account-key.json \
 *   npm run ask:rundown -- --days 30
 *
 *   Flags: --days <n> (default 30) · --min <n> minimum count to show (default 1)
 *          --out <file.md> write to a file instead of stdout
 *
 * Caveats worth knowing when reading the numbers:
 *   - GA4 truncates event-parameter values to 100 characters, so a very long
 *     question is reported clipped.
 *   - A custom dimension only populates from the moment it is registered. Events
 *     from before then report the value as "(not set)"; those rows are dropped
 *     here rather than counted as a phantom question.
 *   - Only visitors who accepted analytics send anything; declined visitors are
 *     invisible here, so this is a floor, not a census.
 *   - Edge rate-limit counts are best-effort (see api/ask.mjs).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (msg) => {
  console.error(`ask-rundown: ${msg}`);
  process.exit(1);
};

// --- pure helpers (exported for tests) ------------------------------------

export const NOT_SET = '(not set)';

// A value a visitor actually produced. GA4 reports "(not set)" for a parameter
// on events recorded before its custom dimension existed, and omits it when the
// client never sent one — neither is a question someone typed.
export const isRealValue = (value) => {
  const v = (value ?? '').trim();
  return v !== '' && v.toLowerCase() !== NOT_SET;
};

const norm = (s) => (s ?? '').trim().replace(/\s+/g, ' ');
const clean = (v) => (isRealValue(v) ? norm(v) : '');
const escapeCell = (s) => String(s).replace(/\|/g, '\\|');
const topOf = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

/**
 * `ask_no_match` rows → ranked gaps. `nearest_id` is the closest *published*
 * answer by relevance, not one that answered the question (nothing did, or the
 * event would not exist) — so it is surfaced only as a starting point to write
 * from, never as evidence the gap is covered.
 */
export const aggregateMisses = (rows, { minCount = 1 } = {}) => {
  const byQuestion = new Map();
  for (const row of rows ?? []) {
    const [question, reason, nearestId] = (row.dimensionValues ?? []).map((d) => d.value);
    if (!isRealValue(question)) continue;
    const key = norm(question).toLowerCase();
    const count = Number(row.metricValues?.[0]?.value) || 0;
    const entry = byQuestion.get(key) ?? { question: norm(question), count: 0, reasons: new Map(), nearest: new Set() };
    entry.count += count;
    if (clean(reason)) entry.reasons.set(clean(reason), (entry.reasons.get(clean(reason)) ?? 0) + count);
    if (clean(nearestId)) entry.nearest.add(clean(nearestId));
    byQuestion.set(key, entry);
  }
  return [...byQuestion.values()]
    .filter((e) => e.count >= minCount)
    .sort((a, b) => b.count - a.count || a.question.localeCompare(b.question));
};

/** `ask_contact_click` rows → ranked questions from visitors who wanted a reply. */
export const aggregateContacts = (rows, { minCount = 1 } = {}) => {
  const byQuestion = new Map();
  for (const row of rows ?? []) {
    const question = row.dimensionValues?.[0]?.value;
    if (!isRealValue(question)) continue;
    const key = norm(question).toLowerCase();
    const count = (byQuestion.get(key)?.count ?? 0) + (Number(row.metricValues?.[0]?.value) || 0);
    byQuestion.set(key, { question: norm(question), count });
  }
  return [...byQuestion.values()]
    .filter((e) => e.count >= minCount)
    .sort((a, b) => b.count - a.count || a.question.localeCompare(b.question));
};

export const render = (misses, contacts, { days, truncated = false } = {}) => {
  const lines = [];
  lines.push(`# Ask rundown — last ${days} days`);
  lines.push('');
  lines.push('_Questions visitors asked that had no written answer — every row is a gap by');
  lines.push('definition. Write reviewed answers for the recurring ones to cut model drafting.');
  lines.push('Counts consenting visitors only, and only questions asked since the custom');
  lines.push('dimensions were registered._');
  if (truncated) {
    lines.push('');
    lines.push('> ⚠️ Results hit the API row cap — the counts below are a partial view. Narrow --days.');
  }
  lines.push('');

  lines.push(`## Missed questions (${misses.length})`);
  lines.push('');
  if (!misses.length) {
    lines.push('None recorded in this window.');
  } else {
    lines.push('| Count | Question | Top reason | Nearest existing answer |');
    lines.push('| ----: | -------- | ---------- | ----------------------- |');
    for (const e of misses) {
      const nearest = [...e.nearest][0] ?? '—';
      lines.push(`| ${e.count} | ${escapeCell(e.question)} | ${escapeCell(topOf(e.reasons))} | ${escapeCell(nearest)} |`);
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
    for (const e of contacts) lines.push(`| ${e.count} | ${escapeCell(e.question)} |`);
  }
  lines.push('');
  return lines.join('\n');
};

// --- GA4 plumbing (runs only when invoked as a CLI) -----------------------

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

const PAGE_LIMIT = 10000;
// A stop far above any realistic portfolio volume, so a runaway loop cannot spin
// forever if the API keeps reporting more rows than it returns.
const MAX_ROWS = 200000;

const runReport = async (token, propertyId, body) => {
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
  return json;
};

// Follows pagination: GA4 returns one page plus a `rowCount` total, so keep
// fetching by offset until every matching row is in hand (or the safety cap is
// reached, which is reported so a partial view is never read as complete).
const fetchAllRows = async (token, propertyId, body) => {
  const rows = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && offset < MAX_ROWS) {
    const page = await runReport(token, propertyId, { ...body, limit: PAGE_LIMIT, offset });
    const pageRows = page.rows ?? [];
    rows.push(...pageRows);
    total = Number(page.rowCount ?? rows.length);
    if (pageRows.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }
  return { rows, truncated: rows.length < total };
};

const main = async () => {
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

  let key;
  try {
    key = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
  } catch (error) {
    fail(`could not read the service-account key at ${keyPath}: ${error.message}`);
  }
  if (!key.client_email || !key.private_key) fail('the key file is missing client_email or private_key');

  const token = await getAccessToken(key);
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
  const filterFor = (eventName) => ({
    filter: { fieldName: 'eventName', stringFilter: { value: eventName } },
  });

  const [miss, contact] = await Promise.all([
    fetchAllRows(token, propertyId, {
      dateRanges,
      dimensions: [
        { name: 'customEvent:question' },
        { name: 'customEvent:reason' },
        { name: 'customEvent:nearest_id' },
        { name: 'customEvent:answered_by' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: filterFor('ask_no_match'),
    }),
    fetchAllRows(token, propertyId, {
      dateRanges,
      dimensions: [{ name: 'customEvent:question' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: filterFor('ask_contact_click'),
    }),
  ]);

  const output = render(
    aggregateMisses(miss.rows, { minCount }),
    aggregateContacts(contact.rows, { minCount }),
    { days, truncated: miss.truncated || contact.truncated },
  );

  if (outPath) {
    writeFileSync(resolve(outPath), `${output}\n`);
    console.error(`ask-rundown: wrote ${outPath}`);
  } else {
    process.stdout.write(`${output}\n`);
  }
};

// Only run the CLI when invoked directly, so importing the pure helpers for
// tests does not touch argv, the environment, or the network.
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) await main();
