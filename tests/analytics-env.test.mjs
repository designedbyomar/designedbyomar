import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isGaEnabled, isProductionHost, PRODUCTION_HOSTS } from '../src/analytics-env.mjs';

test('GA is enabled only on a production build served from a production host', () => {
  assert.equal(isGaEnabled({ PROD: true }, 'designedbyomar.com'), true);
  assert.equal(isGaEnabled({ PROD: true }, 'www.designedbyomar.com'), true);
  assert.equal(isGaEnabled({ PROD: true }, 'WWW.DesignedByOmar.com'), true);
});

test('GA is disabled on Vercel preview hosts even in a production build', () => {
  // Previews run the same `npm run build`, so build mode is PROD, but the host differs.
  assert.equal(isGaEnabled({ PROD: true }, 'designedbyomar-git-branch.vercel.app'), false);
  assert.equal(isGaEnabled({ PROD: true }, 'some-preview.vercel.app'), false);
});

test('GA is disabled in development / localhost regardless of build or host', () => {
  assert.equal(isGaEnabled({ PROD: false, DEV: true }, 'designedbyomar.com'), false);
  assert.equal(isGaEnabled({ PROD: true }, 'localhost'), false);
  assert.equal(isGaEnabled({ PROD: true }, '127.0.0.1'), false);
});

test('GA is disabled when env or host is missing', () => {
  assert.equal(isGaEnabled({}, 'designedbyomar.com'), false);
  assert.equal(isGaEnabled(undefined, 'designedbyomar.com'), false);
  assert.equal(isGaEnabled({ PROD: true }, ''), false);
  assert.equal(isGaEnabled({ PROD: true }, undefined), false);
});

test('VITE_GA_ALLOWED_HOSTS overrides the allowlist (so the e2e suite can test the real path)', () => {
  const env = { PROD: true, VITE_GA_ALLOWED_HOSTS: '127.0.0.1,localhost' };
  assert.equal(isGaEnabled(env, '127.0.0.1'), true);
  assert.equal(isGaEnabled(env, 'localhost'), true);
  // An override replaces the default list, so the real production host is no longer allowed.
  assert.equal(isGaEnabled(env, 'designedbyomar.com'), false);
});

test('isProductionHost matches the canonical hosts and is case-insensitive', () => {
  assert.equal(isProductionHost('designedbyomar.com'), true);
  assert.equal(isProductionHost('example.com'), false);
  assert.ok(PRODUCTION_HOSTS.includes('www.designedbyomar.com'));
});
