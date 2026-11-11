import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateMisses, aggregateContacts, render } from '../scripts/ask-rundown.mjs';

const row = (dimensions, count) => ({
  dimensionValues: dimensions.map(value => ({ value })),
  metricValues: [{ value: String(count) }],
});

test('groups by topic, reason and outcome without merging outages into content gaps', () => {
  const result = aggregateMisses([
    row(['no-material', 'fintech-depth', 'fallback'], 2),
    row(['no-material', 'fintech-depth', 'fallback'], 3),
    row(['unavailable', 'fintech-depth', 'fallback'], 4),
    row(['router-sourced', 'fintech-depth', 'generated'], 1),
  ]);
  assert.equal(result.length, 3);
  assert.equal(result[0].count, 5);
  assert.equal(result[0].nearestId, 'fintech-depth');
  assert.equal(result[1].reason, 'unavailable');
  assert.equal(result[2].answeredBy, 'generated');
  assert.ok(result.every(entry => !('question' in entry)));
});

test('missing dimensions stay visible as unknown and min count applies after aggregation', () => {
  const result = aggregateMisses([
    row(['(not set)', '', '(not set)'], 2),
    row(['', '(not set)', ''], 3),
    row(['no-material', 'none', 'fallback'], 1),
  ], { minCount: 2 });
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 5);
  assert.equal(result[0].reason, 'unknown');
  assert.equal(result[0].nearestId, 'unknown');
});

test('contact report groups answer states and retains historical missing states as unknown', () => {
  const result = aggregateContacts([row(['drafted'], 2), row(['drafted'], 3), row(['unanswered'], 1), row(['(not set)'], 4)]);
  assert.deepEqual(result, [{ id: 'drafted', count: 5 }, { id: 'unknown', count: 4 }, { id: 'unanswered', count: 1 }]);
});

test('report labels inference and partial results instead of claiming every row is a content gap', () => {
  const result = render(aggregateMisses([row(['unavailable', 'fintech-depth', 'fallback'], 2)]), [], { days: 30, truncated: true });
  assert.match(result, /does not prove an answer is missing/);
  assert.match(result, /partial view/);
  assert.match(result, /Question text is not collected/);
  assert.match(result, /2 \| fintech-depth \| unavailable \| fallback/);
  assert.doesNotMatch(result, /every row is a gap/);
});

test('empty windows and Markdown metacharacters render safely', () => {
  assert.match(render([], [], { days: 7 }), /Topics and outcomes \(0\)/);
  const result = render(aggregateMisses([row(['a|b', '*topic*', 'fallback'], 1)]), [], { days: 7 });
  assert.ok(result.includes('a\\|b'));
  assert.ok(result.includes('\\*topic\\*'));
});
