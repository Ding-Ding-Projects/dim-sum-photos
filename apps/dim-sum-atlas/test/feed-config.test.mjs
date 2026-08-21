import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DEFAULT_UPDATE_FEED, selectUpdateFeed, updaterEligible } = require('../src/updater/feed-config.js');

test('packaged Windows primary launch is eligible and selects the committed HTTPS feed', () => {
  assert.equal(updaterEligible({ platform: 'win32', packaged: true, primary: true }), true);
  assert.equal(selectUpdateFeed({}), DEFAULT_UPDATE_FEED);
  assert.match(DEFAULT_UPDATE_FEED, /^https:\/\//);
});

test('valid credential-free HTTPS override is selected', () => {
  const override = 'https://updates.example.test/stable/update.json';
  assert.equal(selectUpdateFeed({ DIM_SUM_ATLAS_UPDATE_FEED: override }), override);
});

test('invalid override cannot route the updater away from the safe default', () => {
  for (const override of ['http://updates.example.test/update.json', 'https://user:pass@updates.example.test/update.json', 'not a URL']) {
    assert.equal(selectUpdateFeed({ DIM_SUM_ATLAS_UPDATE_FEED: override }), DEFAULT_UPDATE_FEED);
  }
  assert.equal(updaterEligible({ platform: 'win32', packaged: false, primary: true }), false);
  assert.equal(updaterEligible({ platform: 'linux', packaged: true, primary: true }), false);
  assert.equal(updaterEligible({ platform: 'win32', packaged: true, primary: false }), false);
});
