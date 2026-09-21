/**
 * Content rules for the Ask assistant's pre-generated answers.
 *
 * These exist because the answers are static. A live model can be *asked* to
 * follow these rules; a static answer set can have them enforced. That is the
 * main argument for pre-generating on a hiring artifact, so the rules are
 * tested rather than trusted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc = JSON.parse(readFileSync(new URL('../src/content/ask-answers.json', import.meta.url), 'utf8'));
const caseStudies = JSON.parse(readFileSync(new URL('../src/content/case-studies.json', import.meta.url), 'utf8'));
const caseStudyIds = new Set(caseStudies.map(c => c.id));
const answers = doc.answers;

/** Phrases inherited from an older agency-voice register. Never quote these. */
const AGENCY_VOICE = ['meticulous design solution', 'labor of love', 'collaborative triumph', 'epicenter of'];

/**
 * Management Portal's headline numbers are targets the design was built for,
 * not measured results — every one carries qualifier:"Projected" in the source.
 * Matches the outcome claim, not the raw number: describing the problem state
 * ("200+ spreadsheets across 260 offices") is factual and must stay allowed.
 */
const PROJECTED_CLAIMS = /(retir\w+ 200\+|200\+ (?:excel|spreadsheet)\w* (?:to )?retir|260\s*(?:→|to)\s*900|900\+ offices|90%\+? weekly)/i;

test('every cited source is a real case study', () => {
  for (const a of answers) {
    for (const s of a.sources) {
      assert.ok(caseStudyIds.has(s), `${a.id}: cites "${s}", which is not a case-study id`);
    }
  }
});

test('every answer has at least three aliases', () => {
  for (const a of answers) {
    assert.ok(a.aliases.length >= 3, `${a.id}: only ${a.aliases.length} aliases — matching will be brittle`);
  }
});

test('aliases are unique across the whole set', () => {
  const seen = new Map();
  for (const a of answers) {
    for (const alias of a.aliases) {
      const key = alias.toLowerCase().trim();
      assert.ok(!seen.has(key), `alias "${alias}" is used by both ${seen.get(key)} and ${a.id} — the matcher cannot choose`);
      seen.set(key, a.id);
    }
  }
});

test('ids are unique', () => {
  const seen = new Set();
  for (const a of answers) {
    assert.ok(!seen.has(a.id), `duplicate id "${a.id}"`);
    seen.add(a.id);
  }
});

test('the assistant never speaks in first person', () => {
  // It answers *about* Omar, never as him. Quoted spans are exempt so a
  // stakeholder quote can survive intact.
  for (const a of answers) {
    const outsideQuotes = a.answer.replace(/"[^"]*"/g, '');
    const hits = outsideQuotes.match(/\b(I|I'm|I'd|I've|my|My)\b/g);
    assert.equal(hits, null, `${a.id}: uses first person ${JSON.stringify(hits)} — should be "Omar" / "he"`);
  }
});

test('projected metrics are never stated as achieved', () => {
  for (const a of answers) {
    if (!PROJECTED_CLAIMS.test(a.answer)) continue;
    assert.match(
      a.answer,
      /projected/i,
      `${a.id}: states a Management Portal target without calling it projected — this is the regression fixed in bfc915b`,
    );
  }
});

test('no answer reproduces agency-voice phrasing', () => {
  for (const a of answers) {
    for (const phrase of AGENCY_VOICE) {
      assert.ok(!a.answer.toLowerCase().includes(phrase), `${a.id}: reproduces "${phrase}" — paraphrase instead`);
    }
  }
});

test('interview counts always carry their scope', () => {
  // The site cites 500+ career-wide, 200+ at Wisdom and 40+ on Posting
  // Assistant. Unscoped, those read as contradicting each other.
  const SCOPES = ['career', 'wisdom', 'this product', 'that product', 'specifically', 'across', 'including'];
  for (const a of answers) {
    for (const m of a.answer.matchAll(/(\d[\d,]*\+?)\s+(?:user\s+)?interviews/gi)) {
      const window = a.answer.slice(Math.max(0, m.index - 100), m.index + m[0].length + 100).toLowerCase();
      assert.ok(
        SCOPES.some(s => window.includes(s)),
        `${a.id}: "${m[0]}" has no scope nearby — it will read as contradicting the other interview figures`,
      );
    }
  }
});

test('answers stay within a readable length', () => {
  for (const a of answers) {
    const words = a.answer.trim().split(/\s+/).length;
    assert.ok(words >= 40 && words <= 135, `${a.id}: ${words} words — target is roughly 60–120`);
  }
});

test('every answer carries a review status', () => {
  for (const a of answers) {
    assert.ok(['draft', 'approved'].includes(a.status), `${a.id}: status must be "draft" or "approved", got "${a.status}"`);
  }
});
