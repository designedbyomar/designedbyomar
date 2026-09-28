/**
 * The rundown's report logic — parsing, aggregation, and the coverage/labelling
 * decisions — tested against mocked GA4 rows so no credentials are needed. The
 * pure helpers are importable because the script only runs its CLI when invoked
 * directly; importing it must not touch argv, env, or the network, and that this
 * test file loads at all proves it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateMisses, aggregateContacts, render, isRealValue } from '../scripts/ask-rundown.mjs';

// GA4 runReport row shape: dimensionValues[] + metricValues[].
const missRow = (question, reason, nearestId, answeredBy, count) => ({
  dimensionValues: [{ value: question }, { value: reason }, { value: nearestId }, { value: answeredBy }],
  metricValues: [{ value: String(count) }],
});
const contactRow = (question, count) => ({
  dimensionValues: [{ value: question }],
  metricValues: [{ value: String(count) }],
});

test('isRealValue rejects (not set), empty and whitespace', () => {
  assert.equal(isRealValue('how does he price work'), true);
  assert.equal(isRealValue('(not set)'), false);
  assert.equal(isRealValue('(NOT SET)'), false);
  assert.equal(isRealValue('   '), false);
  assert.equal(isRealValue(undefined), false);
});

test('(not set) rows are dropped, not counted as a question', () => {
  // The exact bug: a pre-registration event would otherwise rank a phantom
  // "(not set)" question above real gaps.
  const misses = aggregateMisses([
    missRow('(not set)', 'no-material', 'fintech-depth', 'fallback', 9),
    missRow('does he do mobile design', 'router-declined', 'work-history', 'draft', 2),
  ]);
  assert.equal(misses.length, 1);
  assert.equal(misses[0].question, 'does he do mobile design');
});

test('the same question is summed, case- and whitespace-insensitively', () => {
  const misses = aggregateMisses([
    missRow('Does he do mobile design', 'router-declined', 'work-history', 'draft', 2),
    missRow('does he do   mobile design', 'no-material', 'work-history', 'fallback', 3),
  ]);
  assert.equal(misses.length, 1);
  assert.equal(misses[0].count, 5);
});

test('misses are ranked by count, highest first', () => {
  const misses = aggregateMisses([
    missRow('rare question', 'no-material', 'x', 'fallback', 1),
    missRow('common question', 'router-declined', 'y', 'draft', 8),
  ]);
  assert.deepEqual(misses.map((m) => m.question), ['common question', 'rare question']);
});

test('the top reason is the most frequent one for a question', () => {
  const misses = aggregateMisses([
    missRow('why', 'router-declined', 'a', 'draft', 1),
    missRow('why', 'no-material', 'a', 'fallback', 5),
  ]);
  assert.equal(misses[0].reasons.get('no-material'), 5);
});

test('--min filters out low-count questions', () => {
  const misses = aggregateMisses([
    missRow('once', 'no-material', 'a', 'fallback', 1),
    missRow('twice', 'no-material', 'b', 'fallback', 2),
  ], { minCount: 2 });
  assert.deepEqual(misses.map((m) => m.question), ['twice']);
});

test('contacts drop (not set) and aggregate the rest', () => {
  const contacts = aggregateContacts([
    contactRow('(not set)', 4),
    contactRow('can we hop on a call', 1),
    contactRow('can we hop on a call', 2),
  ]);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].count, 3);
});

test('render surfaces the nearest answer but never labels a gap covered', () => {
  const misses = aggregateMisses([missRow('does he do mobile design', 'router-declined', 'work-history', 'draft', 3)]);
  const out = render(misses, [], { days: 30 });
  assert.match(out, /Nearest existing answer/);
  assert.match(out, /work-history/);
  // The misleading column is gone: a gap must not be reported as covered.
  assert.doesNotMatch(out, /Covered\?/i);
  assert.doesNotMatch(out, /\byes\b/i);
});

test('render notes a truncated report so a partial view is not read as complete', () => {
  const out = render([], [], { days: 7, truncated: true });
  assert.match(out, /partial view/i);
});

test('an empty window renders cleanly', () => {
  const out = render([], [], { days: 30 });
  assert.match(out, /## Missed questions \(0\)/);
  assert.match(out, /None recorded in this window\./);
});
