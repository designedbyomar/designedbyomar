/**
 * Inline case-study linking. The tokenizer is pure, so it is tested directly,
 * against the real `mentions` in the content file plus a couple of shaped cases.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tokenizeAnswer, hrefForStudy, mentionedStudyIds } from '../src/ask-links.mjs';

const studies = JSON.parse(
  readFileSync(new URL('../src/content/case-studies.json', import.meta.url), 'utf8'),
);

const links = (tokens) => tokens.filter((t) => t.type === 'link');
const rebuild = (tokens) => tokens.map((t) => t.value).join('');

test('the reported case: "Plastiq Connect" links to its study when cited', () => {
  const text = "Omar's most prominent fintech case study is Plastiq Connect. He led the design.";
  const tokens = tokenizeAnswer(text, studies, ['connect-api']);

  assert.equal(rebuild(tokens), text, 'no text is lost or duplicated');
  const linked = links(tokens);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].value, 'Plastiq Connect');
  assert.equal(linked[0].id, 'connect-api');
  assert.equal(linked[0].href, '/work/connect-api/');
});

test('a study that was not cited is never linked', () => {
  const text = 'He also built the Athena Design System at Plastiq.';
  const tokens = tokenizeAnswer(text, studies, ['connect-api']);
  assert.equal(links(tokens).length, 0, 'athena-ds was not cited, so it stays plain text');
});

test('the bare word "Plastiq" is not a mention of any study', () => {
  // Three studies are Plastiq, so "Plastiq" alone is deliberately ambiguous and
  // must not link — even with all three cited.
  const text = 'Omar spent two years at Plastiq.';
  const tokens = tokenizeAnswer(text, studies, ['connect-api', 'athena-ds', 'plastiq-mktg']);
  assert.equal(links(tokens).length, 0);
});

test('each study links at most once, at its first mention', () => {
  const text = 'Plastiq Connect launched fast. Later, Plastiq Connect scaled.';
  const tokens = tokenizeAnswer(text, studies, ['connect-api']);
  const linked = links(tokens);
  assert.equal(linked.length, 1, 'the second mention is left as plain text');
  assert.ok(rebuild(tokens).endsWith('Later, Plastiq Connect scaled.'));
});

test('the longest matching alias wins where several overlap', () => {
  const text = 'The Connect API Payments product shipped in month one.';
  const tokens = tokenizeAnswer(text, studies, ['connect-api']);
  const linked = links(tokens);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].value, 'Connect API Payments', 'not the shorter "Connect API"');
});

test('two different cited studies each get one link', () => {
  const text = 'Athena Design System 2.0 fed the brand, and Plastiq Connect carried compliance.';
  const tokens = tokenizeAnswer(text, studies, ['athena-ds', 'connect-api']);
  const linked = links(tokens);
  assert.equal(linked.length, 2);
  assert.deepEqual(new Set(linked.map((l) => l.id)), new Set(['athena-ds', 'connect-api']));
});

test('an alias inside a longer word does not match', () => {
  // "Athena" must not fire inside "Athenaeum".
  const tokens = tokenizeAnswer('The Athenaeum was unrelated.', studies, ['athena-ds']);
  assert.equal(links(tokens).length, 0);
});

test('empty or uncited input degrades to plain text', () => {
  assert.deepEqual(tokenizeAnswer('', studies, ['connect-api']), []);
  const plain = tokenizeAnswer('Nothing to link here.', studies, []);
  assert.deepEqual(plain, [{ type: 'text', value: 'Nothing to link here.' }]);
});

test('hrefForStudy points at the published route', () => {
  assert.equal(hrefForStudy('disney-uap'), '/work/disney-uap/');
});

test('draft citations include only named studies mentioned in the completed reply', () => {
  const cited = mentionedStudyIds(
    'Plastiq Connect handled embedded payments. The other material was not needed.',
    studies,
    ['connect-api', 'athena-ds'],
  );
  assert.deepEqual(cited, ['connect-api']);
  assert.deepEqual(mentionedStudyIds('There is no published evidence for that.', studies, ['connect-api']), []);
});

test('a grounded draft can cite a case study by its verified product name', () => {
  assert.deepEqual(
    mentionedStudyIds('AdVisor unified the ad-sales workflow.', studies, ['disney-uap']),
    ['disney-uap'],
  );
});
