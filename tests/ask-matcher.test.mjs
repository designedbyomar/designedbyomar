/**
 * The matcher is the main risk in a static answer set: a wrong match is worse
 * than no match, because it answers confidently off-topic. These tests pin the
 * behaviour that matters — distinctive terms win, vague questions are refused.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, matchQuestion, nearestTopic, tokenize } from '../src/ask.mjs';

const doc = JSON.parse(readFileSync(new URL('../src/content/ask-answers.json', import.meta.url), 'utf8'));
const index = buildIndex(doc.answers);

test('stopwords and punctuation are stripped', () => {
  assert.deepEqual(tokenize('What is Omar’s PCI experience?'), ['pci', 'experience']);
});

test('an exact alias returns its answer outright', () => {
  const hit = matchQuestion('plastiq connect', index);
  assert.equal(hit?.answer.id, 'cs-connect-api');
  assert.equal(hit.exact, true);
});

test('distinctive terms route to the right answer', () => {
  const cases = [
    ['does he have design system experience', 'design-systems'],
    ['what fintech work has he done', 'fintech-depth'],
    ['tell me about the unified ad platform', 'cs-disney-uap'],
    ['has he designed for developers', 'api-developer-tools'],
    ['where has he worked', 'work-history'],
  ];
  for (const [query, expected] of cases) {
    const hit = matchQuestion(query, index);
    assert.equal(hit?.answer.id, expected, `"${query}" matched ${hit?.answer.id ?? 'nothing'}`);
  }
});

test('questions outside the answer set are refused rather than guessed', () => {
  for (const query of ['how do penguins pay for parking in antarctica', 'what is the weather in tokyo', 'zzzzz']) {
    assert.equal(matchQuestion(query, index), null, `"${query}" should not match`);
  }
});

test('a question naming something the corpus has never seen is refused', () => {
  // Regression. "does he know kubernetes" returned the measuring-success
  // answer: `kubernetes` was out of vocabulary, so the entire match rested on
  // `know`, which appears once in the set and therefore scored highly despite
  // carrying no topic. A confident wrong answer is the worst outcome here.
  for (const query of ['does he know kubernetes', 'has he used rust', 'does he know terraform']) {
    assert.equal(matchQuestion(query, index), null, `"${query}" should not match`);
  }
});

test('an empty or stopword-only query matches nothing', () => {
  assert.equal(matchQuestion('', index), null);
  assert.equal(matchQuestion('what is the', index), null);
});

test('a miss still yields a nearest topic with a citation to offer', () => {
  const near = nearestTopic('payments compliance', index);
  assert.ok(near, 'expected a nearest topic');
  assert.ok(near.sources.length > 0, 'nearest topic must carry a citation');
});
