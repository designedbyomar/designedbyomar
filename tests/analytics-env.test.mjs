import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isGaEnabled } from '../src/analytics-env.mjs';

test('GA is enabled only for production builds', () => {
  assert.equal(isGaEnabled({ PROD: true }), true);
});

test('GA is disabled in development, so dev/test traffic never hits GA4', () => {
  assert.equal(isGaEnabled({ PROD: false, DEV: true }), false);
});

test('GA is disabled when the env flag is missing or empty', () => {
  assert.equal(isGaEnabled({}), false);
  assert.equal(isGaEnabled(undefined), false);
  assert.equal(isGaEnabled(null), false);
});

test('isGaEnabled returns a boolean, never a truthy/falsy env value', () => {
  assert.equal(isGaEnabled({ PROD: 1 }), true);
  assert.equal(isGaEnabled({ PROD: 0 }), false);
  assert.equal(isGaEnabled({ PROD: undefined }), false);
});
