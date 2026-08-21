import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { UpdaterEngine, compareVersions, validPackageFilename } = require('../src/updater/engine.js');
const { createSquirrelRuntime } = require('../src/updater/squirrel-runtime.js');

function feed(version, body, extra = {}) {
  return Buffer.from(JSON.stringify({
    version,
    channel: 'stable',
    package: {
      url: 'https://updates.example.test/Dim.Sum.Atlas.nupkg',
      filename: `Dim.Sum.Atlas-${version}-full.nupkg`,
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
    async request(url, options = {}) {
      calls += 1;
      if (options.failures && calls <= options.failures) throw new Error('temporary network failure');
      if (url.includes('/feed')) return { statusCode: 200, headers: {}, body: metadata };
      if (typeof options.onChunk === 'function') { options.onChunk(body.subarray(0, Math.ceil(body.length / 2))); options.onChunk(body.subarray(Math.ceil(body.length / 2))); }
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
  assert.equal(validPackageFilename('Dim.Sum.Atlas-1.1.0-full.nupkg', '1.1.0'), true);
  assert.equal(validPackageFilename('../x.nupkg', '1.1.0'), false);
  assert.equal(validPackageFilename('Dim.Sum.Atlas-full.nupkg', '1.1.0'), false);
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
  assert.equal(fs.readFileSync(ready.package.packagePath).toString(), body.toString());
  assert.equal(fs.readFileSync(path.join(ready.stagedPath, 'RELEASES')).toString(), ready.package.releasesLine);
  const [releaseSha1, releaseFilename, releaseSize] = ready.package.releasesLine.trim().split(/\s+/);
  assert.equal(releaseSha1, ready.package.sha1);
  assert.equal(releaseFilename, ready.package.filename);
  assert.equal(Number(releaseSize), ready.package.size);
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
  const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport: transportFor(feed('1.1.0', body), body), runtime: { installPackage: (file, identity) => calls.push({ file, identity }) } });
  await engine.check(); await engine.download();
  engine.setWorkState({ dirty: true });
  assert.throws(() => engine.restart(), /unsaved/);
  engine.setWorkState({ inFlight: true });
  assert.throws(() => engine.restart(), /active/);
  engine.setWorkState({}); engine.restart();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, engine.snapshot().stagedPath);
  assert.equal(calls[0].identity.sha256, engine.snapshot().package.sha256);
  fs.rmSync(root, { recursive: true, force: true });
});

test('production Squirrel seam invokes Update.exe with the validated feed directory', async () => {
  const calls = []; let exited = false;
  const child = { once(event, listener) { if (event === 'spawn') setImmediate(listener); return this; }, unref() { exited = true; } };
  const runtime = createSquirrelRuntime({ updateExe: 'C:\\Installed\\Update.exe', fsModule: { existsSync: () => true }, spawnProcess: (...args) => { calls.push(args); return child; }, quit: () => { exited = true; } });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-feed-'));
  const packagePath = path.join(root, 'Atlas-1.1.0-full.nupkg'); const releasesLine = 'a'.repeat(40) + ' Atlas-1.1.0-full.nupkg 7\n';
  fs.writeFileSync(packagePath, 'package'); fs.writeFileSync(path.join(root, 'RELEASES'), releasesLine);
  await runtime.installPackage(root, { packagePath, releasesLine });
  assert.deepEqual(calls[0][0], 'C:\\Installed\\Update.exe');
  assert.deepEqual(calls[0][1], ['--update', root]);
  assert.equal(calls[0][2].shell, false);
  assert.equal(exited, true);
  fs.rmSync(root, { recursive: true, force: true });
});

test('cancel aborts a pending download and progress reports intermediate bytes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-cancel-'));
  const body = Buffer.from('slow package bytes');
  let resolveRequest;
  const transport = {
    async request(url, options = {}) {
      if (url.includes('/feed')) return { statusCode: 200, headers: {}, body: feed('1.1.0', body) };
      return new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => { const error = Object.assign(new Error('cancelled'), { name: 'AbortError' }); reject(error); }, { once: true });
        options.onChunk?.(body.subarray(0, 3));
        resolveRequest = () => resolve({ statusCode: 200, headers: {}, body });
      });
    }
  };
  const engine = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport, maxRetries: 0 });
  const progress = []; engine.onState((state) => { if (state.progress) progress.push(state.progress.received); });
  await engine.check();
  const pending = engine.download();
  assert.equal(typeof resolveRequest, 'function');
  assert.equal(progress.some((value) => value > 0 && value < body.length), true);
  assert.equal(engine.cancel(), true);
  await pending;
  assert.equal(engine.snapshot().state, 'available');
  fs.rmSync(root, { recursive: true, force: true });
});
