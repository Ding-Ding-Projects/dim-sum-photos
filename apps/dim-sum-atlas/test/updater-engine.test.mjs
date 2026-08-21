import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { UpdaterEngine, compareVersions } = require('../src/updater/engine.js');

function feed(version, body, extra = {}) {
  return Buffer.from(JSON.stringify({
    version,
    channel: 'stable',
    package: {
      url: 'https://updates.example.test/Dim.Sum.Atlas.nupkg',
      filename: 'Dim.Sum.Atlas.nupkg',
      size: body.length,
      sha256: crypto.createHash('sha256').update(body).digest('hex')
    },
    ...extra
  }));
}

function transportFor(metadata, body, options = {}) {
  let calls = 0;
  return {
    get calls() { return calls; },
    async request(url) {
      calls += 1;
      if (options.failures && calls <= options.failures) throw new Error('temporary network failure');
      if (url.includes('/feed')) return { statusCode: 200, headers: {}, body: metadata };
      return { statusCode: 200, headers: {}, body };
    }
  };
}

test('version ordering rejects downgrades and accepts only newer patch versions', () => {
  assert.equal(compareVersions('1.2.0', '1.2.1') < 0, true);
  assert.equal(compareVersions('1.2.1', '1.2.1'), 0);
  assert.equal(compareVersions('1.3.0', '1.2.9') > 0, true);
});

test('unconfigured, non-HTTPS, and credential-bearing feeds fail closed', async () => {
  for (const feedUrl of ['', 'http://updates.example.test/feed', 'https://user:pass@updates.example.test/feed']) {
    const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl });
    assert.equal(engine.snapshot().state, 'disabled');
    await assert.rejects(() => engine.check(), /unavailable|HTTPS/);
  }
});

test('metadata validation rejects a same-version or malformed package', () => {
  const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed' });
  const body = Buffer.from('package');
  assert.equal(engine.parseMetadata({ statusCode: 200, body: feed('1.0.0', body) }), null);
  assert.throws(() => engine.parseMetadata({ statusCode: 200, body: Buffer.from(JSON.stringify({ version: '1.1.0', package: { url: 'http://bad', sha256: 'x', size: 1 } })) }), /invalid|HTTPS/);
});

test('check and download validate identity, hash, size, retry, and ready state', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-'));
  const body = Buffer.from('validated package bytes');
  const baseTransport = transportFor(feed('1.1.0', body), body);
  let packageAttempts = 0;
  const transport = { get calls() { return baseTransport.calls; }, async request(url) {
    if (!url.includes('/feed') && packageAttempts++ === 0) throw new Error('temporary network failure');
    return baseTransport.request(url);
  } };
  const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport, maxRetries: 2 });
  const checked = await engine.check({ trigger: 'manual' });
  assert.equal(checked.state, 'available');
  const ready = await engine.download();
  assert.equal(ready.state, 'ready');
  assert.equal(fs.readFileSync(ready.stagedPath).toString(), body.toString());
  assert.equal(fs.existsSync(path.join(root, 'last-valid-update.json')), true);
  assert.equal(transport.calls, 2);
  fs.rmSync(root, { recursive: true, force: true });
});

test('download rejects a mismatched package and preserves no staged file', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-bad-'));
  const declared = Buffer.from('declared package');
  const actual = Buffer.from('tampered package');
  const transport = transportFor(feed('1.1.0', declared), actual);
  const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport, maxRetries: 0 });
  await engine.check();
  await assert.rejects(() => engine.download(), /size|hash/);
  assert.equal(engine.snapshot().state, 'error');
  assert.deepEqual(fs.readdirSync(root), []);
  fs.rmSync(root, { recursive: true, force: true });
});

test('restart interlock never restarts over dirty or in-flight work', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-lock-'));
  const body = Buffer.from('package');
  const calls = [];
  const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport: transportFor(feed('1.1.0', body), body), runtime: { quitAndInstall: () => calls.push('restart') } });
  await engine.check(); await engine.download();
  engine.setWorkState({ dirty: true });
  assert.throws(() => engine.restart(), /unsaved/);
  engine.setWorkState({ inFlight: true });
  assert.throws(() => engine.restart(), /active/);
  engine.setWorkState({}); engine.restart();
  assert.deepEqual(calls, ['restart']);
  fs.rmSync(root, { recursive: true, force: true });
});
