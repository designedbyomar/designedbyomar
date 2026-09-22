/**
 * Pins an approved Ask answer to the state of the case studies it cites.
 *
 * The existing content tests check that every `sources` id *resolves* to a real
 * case study. They cannot tell whether the answer still describes it. That gap
 * is not theoretical: `cs-disney-uap` shipped for a while asserting "four
 * brands consolidated into one system" after the case study had been corrected
 * to seven brands joining the platform ESPN already ran.
 *
 * So each answer stores a fingerprint of the text it was written against. A
 * mismatch on an `approved` answer fails the content tests, and because only
 * approved answers reach the build, a case-study edit makes the affected
 * answer's approval lapse rather than leaving it live and wrong.
 *
 * Drafts are exempt — a draft is expected to lag.
 *
 * Run `node scripts/ask-fingerprint.mjs --write` after re-reviewing an answer
 * against its sources.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/**
 * The claim-bearing subset of `PUBLIC_FIELDS` in `src/case-studies.js`. Fields
 * an answer could draw a factual claim from — not cover art or route metadata,
 * which change without changing what is true.
 */
const CLAIM_FIELDS = ['subtitle', 'year', 'role', 'metrics', 'challenge', 'approach', 'outcome', 'body'];

/** Flatten a case study's claim-bearing fields to a stable text blob. */
const claimText = (caseStudy) => {
  const parts = [];
  const walk = (value) => {
    if (value == null) return;
    if (typeof value === 'string') { parts.push(value); return; }
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (typeof value === 'object') { Object.keys(value).sort().forEach(k => walk(value[k])); return; }
    parts.push(String(value));
  };
  for (const field of CLAIM_FIELDS) walk(caseStudy[field]);
  return parts.join('\u0000');
};

/** Short, stable hash of the claim text of every case study an answer cites. */
export const fingerprintSources = (caseStudies, sourceIds) => {
  const byId = new Map(caseStudies.map(c => [c.id, c]));
  const blob = [...sourceIds].sort()
    .map(id => `${id}:${claimText(byId.get(id) ?? {})}`)
    .join('\u0001');
  return createHash('sha256').update(blob).digest('hex').slice(0, 12);
};

if (process.argv.includes('--write')) {
  const answersUrl = new URL('../src/content/ask-answers.json', import.meta.url);
  const caseStudies = JSON.parse(readFileSync(new URL('../src/content/case-studies.json', import.meta.url), 'utf8'));
  const doc = JSON.parse(readFileSync(answersUrl, 'utf8'));

  let changed = 0;
  for (const answer of doc.answers) {
    const next = fingerprintSources(caseStudies, answer.sources ?? []);
    if (answer.sourcesFingerprint !== next) {
      if (answer.status === 'approved') {
        console.warn(`  ${answer.id}: approved answer re-stamped — confirm it still matches its sources`);
      }
      answer.sourcesFingerprint = next;
      changed += 1;
    }
  }
  writeFileSync(answersUrl, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`stamped ${changed} of ${doc.answers.length} answers`);
}
