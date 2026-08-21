import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const updater = require('../src/updater-ui.js');

test('normalizes update state and clamps byte progress', () => {
  const state = updater.normalizeState({
    status: 'downloading',
    currentVersion: '0.1.0',
    availableVersion: '0.2.0',
    downloadedBytes: 150,
    totalBytes: 100,
    unsigned: true
  });
  assert.equal(state.status, 'downloading');
  assert.equal(state.percent, 100);
  assert.equal(state.currentVersion, '0.1.0');
  assert.equal(state.availableVersion, '0.2.0');
  assert.equal(updater.progressPercent(5, 0), 0);
  assert.equal(updater.progressPercent(5, 10), 50);
});

test('keeps every canonical updater state distinct and preserves reasonable aliases', () => {
  const expected = ['idle', 'checking', 'up-to-date', 'available', 'downloading', 'ready', 'installing', 'postponed', 'cancelled', 'offline', 'malformed-feed', 'invalid-hash', 'corrupt-asset', 'insufficient-storage', 'rollback', 'failed', 'unavailable'];
  assert.deepEqual(updater.CANONICAL_STATES, expected);
  for (const status of expected) assert.equal(updater.normalizeState({ status }).status, status);
  for (const status of expected) assert.ok(updater.copy[status], `missing copy for ${status}`);
  assert.equal(updater.normalizeState({ status: 'current' }).status, 'idle');
  assert.equal(updater.normalizeState({ status: 'no update' }).status, 'up-to-date');
  assert.equal(updater.normalizeState({ status: 'ready-to-restart' }).status, 'ready');
  assert.equal(updater.normalizeState({ status: 'restarting' }).status, 'installing');
  assert.equal(updater.normalizeState({ status: 'later' }).status, 'postponed');
  assert.equal(updater.normalizeState({ status: 'invalid hash' }).status, 'invalid-hash');
  assert.equal(updater.normalizeState({ status: 'disk full' }).status, 'insufficient-storage');
  assert.equal(updater.normalizeState({ status: 'malformed feed' }).status, 'malformed-feed');
  assert.notEqual(updater.normalizeState({ status: 'later' }).status, 'failed');
});

test('preserves exact release facts while localizing surrounding copy', () => {
  const ready = updater.normalizeState({ status: 'ready', availableVersion: '0.2.0', totalBytes: 2 * 1024 * 1024, downloadedBytes: 2 * 1024 * 1024 });
  assert.equal(ready.availableVersion, '0.2.0');
  assert.match(updater.formatBytes(ready.totalBytes), /MiB$/);
  const serious = updater.localizeUpdater('ready', { language: 'en', funnyEn: 1, funnyYue: 1 });
  const playful = updater.localizeUpdater('ready', { language: 'en', funnyEn: 5, funnyYue: 5 });
  assert.notEqual(serious, playful);
  assert.equal(updater.localizeUpdater('ready', { language: 'yue', funnyEn: 1, funnyYue: 1 }), '更新已準備好安裝。');
  assert.match(updater.localizeUpdater('ready', { language: 'bilingual', funnyEn: 1, funnyYue: 1 }), / · /);
  assert.notEqual(updater.localizeUpdater('progressUnavailable', { language: 'en', funnyEn: 1, funnyYue: 1 }), updater.localizeUpdater('progressUnavailable', { language: 'yue', funnyEn: 1, funnyYue: 1 }));
  assert.match(updater.localizeUpdater('bytesOf', { language: 'bilingual', funnyEn: 5, funnyYue: 5 }), / · /);
});

test('restart is blocked when the core reports unsaved work or an active operation', () => {
  const state = updater.normalizeState({ status: 'ready', hasUnsavedWork: true, operationInProgress: true, restartBlockedReason: 'Save the open export first.' });
  assert.equal(state.canRestart, false);
  assert.equal(state.restartBlockedReason, 'Save the open export first.');
});

test('flat preload contract is the production adapter, while Later stays local', async () => {
  const calls = [];
  let state = { status: 'ready', availableVersion: '0.2.0', canRestart: true };
  let subscribed;
  const flatAtlas = {
    get updaterState() { return state; },
    checkForUpdates: async () => { calls.push('checkForUpdates'); return state; },
    downloadUpdate: async () => { calls.push('downloadUpdate'); return state; },
    cancelUpdate: async () => { calls.push('cancelUpdate'); return { ...state, status: 'cancelled' }; },
    setUpdaterWorkState: work => { calls.push(['setUpdaterWorkState', work]); },
    restartToInstallUpdate: async () => { calls.push('restartToInstallUpdate'); return { ...state, status: 'installing' }; },
    onUpdaterState: listener => { calls.push('onUpdaterState'); subscribed = listener; return () => {}; }
  };
  assert.equal(updater.createFlatUpdaterAdapter({ updater: { getState: () => state } }), null);
  const adapter = updater.createFlatUpdaterAdapter(flatAtlas);
  assert.ok(adapter);
  assert.deepEqual(await adapter.getState(), state);
  await adapter.checkForUpdates();
  await adapter.downloadUpdate();
  await adapter.cancelUpdate();
  adapter.onStateChanged(next => { state = next; });
  subscribed({ status: 'available', availableVersion: '0.2.0' });
  await adapter.setUpdaterWorkState({ hasUnsavedWork: false, operationInProgress: false });
  await adapter.restartToInstall();
  assert.deepEqual(calls, ['checkForUpdates', 'downloadUpdate', 'cancelUpdate', 'onUpdaterState', ['setUpdaterWorkState', { hasUnsavedWork: false, operationInProgress: false }], 'restartToInstallUpdate']);
  const coreReady = { status: 'ready', availableVersion: '0.2.0', canRestart: true };
  const postponed = updater.postponeLocalState(coreReady);
  assert.equal(postponed.status, 'postponed');
  assert.equal(coreReady.status, 'ready');
});

test('renderer work markers override false core flags before restart', () => {
  const documentRef = {
    querySelector: selector => selector === '[data-unsaved-work="true"]' ? {} : null,
    getElementById: () => ({ dataset: {} })
  };
  assert.deepEqual(updater.readRendererWorkState(documentRef, { hasUnsavedWork: false, operationInProgress: false }), { hasUnsavedWork: true, operationInProgress: false });
  const operationDocument = {
    querySelector: selector => selector === '[data-operation-in-progress="true"]' ? {} : null,
    getElementById: () => ({ dataset: {} })
  };
  assert.deepEqual(updater.readRendererWorkState(operationDocument, { hasUnsavedWork: false, operationInProgress: false }), { hasUnsavedWork: false, operationInProgress: true });
});

test('disabled service stays unavailable with its exact reason and no retry or failure history', () => {
  const disabled = updater.normalizeState({ status: 'disabled', reason: 'Updates are disabled by policy.' });
  assert.equal(disabled.status, 'unavailable');
  assert.equal(disabled.serviceDisabled, true);
  assert.equal(disabled.error, 'Updates are disabled by policy.');
  assert.equal(updater.shouldRecordFailure(disabled), false);
  assert.equal(updater.shouldShowRetry(disabled), false);
  assert.equal(updater.isCheckDisabled(disabled, true), true);
  assert.deepEqual(updater.actionsForState(disabled), ['check']);
  const failedActions = updater.actionsForState(updater.normalizeState({ status: 'failed', error: 'Network failed.' }));
  assert.equal(failedActions.filter(action => action === 'retry').length, 1);
  assert.equal(updater.shouldRecordFailure(updater.normalizeState({ status: 'failed', error: 'Network failed.' })), true);
});

test('history parsing fails closed and release-note URLs require HTTPS', () => {
  const storage = { getItem: () => '{not-json}' };
  assert.deepEqual(updater.readHistory(storage), []);
  assert.deepEqual(updater.readHistory({ getItem: () => JSON.stringify([{ kind: 'failure' }, null, 'bad']) }), [{ kind: 'failure' }]);
  assert.equal(updater.safeUrl('https://example.test/release'), 'https://example.test/release');
  assert.equal(updater.safeUrl('http://example.test/release'), '');
});

test('new failure history is immediately reviewable and the localized heading owns the region label', async () => {
  const events = [];
  const storage = { getItem: () => JSON.stringify(events), setItem: (_key, value) => { events.splice(0, events.length, ...JSON.parse(value)); } };
  const state = updater.normalizeState({ status: 'invalid-hash', availableVersion: '0.2.0', error: 'Hash mismatch.' });
  const rows = updater.recordHistoryEntry(storage, 'failure', state, state.error);
  assert.equal(rows[0].kind, 'failure');
  assert.equal(updater.readHistory(storage)[0].status, 'invalid-hash');
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(new URL('../src/updater-ui.js', import.meta.url), 'utf8');
  assert.match(html, /aria-labelledby="updater-title"[\s\S]*<h2 id="updater-title" data-updater-copy="heading">/);
  assert.doesNotMatch(html, /<p class="eyebrow" id="updater-title">/);
});

test('narrow updater layout removes the desktop minimum width and keeps actions responsive', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*979px\)[\s\S]*body\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)[\s\S]*\.updater-actions \.filter-button\s*\{[^}]*flex:\s*1 1 100%/);
  assert.match(css, /\.updater-surface\s*\{[^}]*width:\s*100%/);
});
