#!/usr/bin/env node
/**
 * Local report of Ask coverage and reliability using categorical analytics only.
 * No question text is collected by the client or requested by this report.
 * A nearest reviewed topic is a clue for review, not proof of a content gap.
 *
 * Setup: register reason, nearest_id, answered_by and answer_id as event-scoped
 * GA4 custom dimensions; enable Analytics Data API and grant a service account
 * Viewer access to the property. Keep its JSON key outside this repository.
 * Historical question dimensions are no longer needed and are never queried.
 *
 * GA4_PROPERTY_ID=348007935 \
 * GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/your-service-account-key.json \
 * npm run ask:rundown -- --days 30
 *
 * Flags: --days <n> (30), --min <n> (1), --out <file.md> (otherwise stdout).
 * Counts include consenting visitors only. Custom dimensions populate from
 * registration onward; missing values are grouped as unknown. Edge rate limits
 * are best-effort. No runtime dependency is added to the site.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (msg) => {
  console.error(`ask-rundown: ${msg}`);
  process.exit(1);
};

export const NOT_SET = '(not set)';
export const isRealValue = (value) => Boolean(value?.trim()) && value.trim().toLowerCase() !== NOT_SET;
const category = value => isRealValue(value) ? value.trim() : 'unknown';
const escapeCell = value => String(value).replace(/[\\`*_[\]<>~|]/g, '\\$&');
const ranked = (map, minCount) => [...map.values()]
  .filter(entry => entry.count >= minCount)
  .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

export const aggregateMisses = (rows, { minCount = 1 } = {}) => {
  const groups = new Map();
  for (const row of rows ?? []) {
    const [reason, nearestId, answeredBy] = (row.dimensionValues ?? []).map(d => category(d.value));
    const id = JSON.stringify([reason, nearestId, answeredBy]);
    const entry = groups.get(id) ?? { id, reason, nearestId, answeredBy, count: 0 };
    entry.count += Number(row.metricValues?.[0]?.value) || 0;
    groups.set(id, entry);
  }
  return ranked(groups, minCount);
};

export const aggregateContacts = (rows, { minCount = 1 } = {}) => {
  const groups = new Map();
  for (const row of rows ?? []) {
    const id = category(row.dimensionValues?.[0]?.value);
    const entry = groups.get(id) ?? { id, count: 0 };
    entry.count += Number(row.metricValues?.[0]?.value) || 0;
    groups.set(id, entry);
  }
  return ranked(groups, minCount);
};

export const render = (misses, contacts, { days, truncated = false } = {}) => {
  const lines = [
    `# Ask rundown — last ${days} days`, '',
    '_Drafted and unanswered requests grouped by reviewed topic, reason, and outcome.',
    'A nearest topic suggests where to investigate; it does not prove an answer is missing.',
    'Check failure reasons before writing new content. Counts include consenting visitors',
    'only. Question text is not collected or included in this report._', '',
  ];
  if (truncated) lines.push('> Results hit the API row cap — these counts are a partial view. Narrow --days.', '');
  lines.push(`## Topics and outcomes (${misses.length})`, '');
  if (!misses.length) lines.push('None recorded in this window.');
  else {
    lines.push('| Count | Nearest reviewed topic | Reason | Outcome |', '| ----: | ---------------------- | ------ | ------- |');
    for (const e of misses) lines.push(`| ${e.count} | ${escapeCell(e.nearestId)} | ${escapeCell(e.reason)} | ${escapeCell(e.answeredBy)} |`);
  }
  lines.push('', `## Clicked "Email Omar" (${contacts.length})`, '');
  if (!contacts.length) lines.push('None recorded in this window.');
  else {
    lines.push('| Count | Answer state |', '| ----: | ------------ |');
    for (const e of contacts) lines.push(`| ${e.count} | ${escapeCell(e.id)} |`);
  }
  return [...lines, ''].join('\n');
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
      fail(`GA4 rejected a custom dimension — register reason, nearest_id, answered_by and answer_id\n            as event-scoped custom definitions first (see this file's header).\n            GA said: ${reason}`);
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
        { name: 'customEvent:reason' },
        { name: 'customEvent:nearest_id' },
        { name: 'customEvent:answered_by' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: filterFor('ask_no_match'),
    }),
    fetchAllRows(token, propertyId, {
      dateRanges,
      dimensions: [{ name: 'customEvent:answer_id' }],
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
