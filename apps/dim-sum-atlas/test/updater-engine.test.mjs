import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { UpdaterEngine, compareVersions, validPackageFilename, createHttpsTransport } = require('../src/updater/engine.js');
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

test('an installed 0.1.1 copy stays idle for equal 0.1.1 metadata', async () => {
  const body = Buffer.from('same-version package');
  const engine = new UpdaterEngine({ currentVersion: '0.1.1', feedUrl: 'https://updates.example.test/feed', transport: transportFor(feed('0.1.1', body), body) });
  const state = await engine.check();
  assert.equal(state.state, 'idle');
  assert.equal(state.availableVersion, null);
  assert.equal(state.error, null);
});

test('major updates are BETERED by default and require exact target-major authorization', () => {
  const body = Buffer.from('major package');
  const metadata = { statusCode: 200, body: feed('2.0.0', body) };
  const blocked = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed' });
  assert.throws(() => blocked.parseMetadata(metadata), /explicit entitlement/);
  const allowed = new UpdaterEngine({ currentVersion: '1.0.0', allowedMajor: 2, feedUrl: 'https://updates.example.test/feed' });
  assert.equal(allowed.parseMetadata(metadata).version, '2.0.0');
  const callbackAllowed = new UpdaterEngine({ currentVersion: '1.0.0', majorUpgradePolicy: (targetMajor) => targetMajor === 2, feedUrl: 'https://updates.example.test/feed' });
  assert.equal(callbackAllowed.parseMetadata(metadata).version, '2.0.0');
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
  const runtime = createSquirrelRuntime({ updateExe: 'C:\\Installed\\Update.exe', processStart: 'Dim Sum Atlas.exe', fsModule: { existsSync: () => true }, spawnProcess: (...args) => { calls.push(args); return child; }, quit: () => { exited = true; } });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-feed-'));
  const packagePath = path.join(root, 'Atlas-1.1.0-full.nupkg'); const releasesLine = 'a'.repeat(40) + ' Atlas-1.1.0-full.nupkg 7\n';
  fs.writeFileSync(packagePath, 'package'); fs.writeFileSync(path.join(root, 'RELEASES'), releasesLine);
  await runtime.installPackage(root, { packagePath, releasesLine });
  assert.deepEqual(calls[0][0], 'C:\\Installed\\Update.exe');
  assert.deepEqual(calls[0][1], ['--update', root, '--processStart', 'Dim Sum Atlas.exe']);
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

test('valid staged update recovers after engine reload', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-recover-'));
  const body = Buffer.from('recoverable package');
  const first = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport: transportFor(feed('1.1.0', body), body) });
  await first.check(); await first.download();
  const reloaded = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root });
  assert.equal(reloaded.snapshot().state, 'ready');
  assert.equal(reloaded.snapshot().availableVersion, '1.1.0');
  fs.rmSync(root, { recursive: true, force: true });
});

test('tampered or stale persisted update is purged and does not block the current install', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-recover-bad-'));
  const body = Buffer.from('tamperable package');
  const first = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport: transportFor(feed('1.1.0', body), body) });
  await first.check(); const ready = await first.download();
  fs.writeFileSync(ready.package.packagePath, 'tampered');
  const tampered = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root });
  assert.equal(tampered.snapshot().state, 'idle');
  assert.equal(fs.existsSync(path.join(root, 'last-valid-update.json')), false);
  const stale = new UpdaterEngine({ currentVersion: '1.1.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport: transportFor(feed('1.1.0', body), body) });
  await stale.check().catch(() => undefined);
  assert.equal(stale.snapshot().state, 'idle');
  fs.rmSync(root, { recursive: true, force: true });
});

test('streaming transport handles large body without a response Buffer', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-stream-'));
  const body = Buffer.alloc(2 * 1024 * 1024, 7);
  const metadata = feed('1.2.0', body);
  const transport = {
    streaming: true,
    async request(url, options = {}) {
      if (url.includes('/feed')) return { statusCode: 200, headers: {}, body: metadata };
      fs.writeFileSync(options.streamTo, Buffer.alloc(0), { flag: 'wx' });
      for (let offset = 0; offset < body.length; offset += 64 * 1024) {
        const chunk = body.subarray(offset, Math.min(body.length, offset + 64 * 1024));
        fs.appendFileSync(options.streamTo, chunk); options.onChunk(chunk);
      }
      return { statusCode: 200, headers: {} };
    }
  };
  const progress = [];
  const engine = new UpdaterEngine({ currentVersion: '1.1.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport, maxRetries: 0 });
  engine.onState((state) => { if (state.progress) progress.push(state.progress.received); });
  await engine.check(); const ready = await engine.download();
  assert.equal(fs.statSync(ready.package.packagePath).size, body.length);
  assert.equal(progress.some((value) => value > 0 && value < body.length), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test('recovery rejects a staged feed that escapes storage through a symlink', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-link-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-outside-'));
  const body = Buffer.from('link package');
  const first = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport: transportFor(feed('1.1.0', body), body) });
  await first.check(); const ready = await first.download();
  const feedDirectory = ready.stagedPath;
  fs.rmSync(feedDirectory, { recursive: true, force: true });
  try {
    fs.symlinkSync(outside, feedDirectory, process.platform === 'win32' ? 'junction' : 'dir');
    const recovered = new UpdaterEngine({ currentVersion: '1.0.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root });
    assert.equal(recovered.snapshot().state, 'idle');
    assert.equal(fs.existsSync(path.join(root, 'last-valid-update.json')), false);
  } catch (error) {
    if (!['EPERM', 'EEXIST', 'UNKNOWN'].includes(error.code)) throw error;
  } finally {
    try { fs.rmSync(feedDirectory, { recursive: true, force: true }); } catch (_) {}
    fs.rmSync(outside, { recursive: true, force: true }); fs.rmSync(root, { recursive: true, force: true });
  }
});

test('streaming redirects reach the final HTTPS package without temp-file collisions', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-redirect-'));
  const body = Buffer.from('redirected package');
  const metadata = feed('1.2.0', body);
  const calls = [];
  const transport = {
    streaming: true,
    async request(url, options = {}) {
      calls.push(url);
      if (url.includes('/feed')) return { statusCode: 200, headers: {}, body: metadata };
      if (url.endsWith('/A')) return { statusCode: 302, headers: { location: 'https://updates.example.test/B' } };
      fs.writeFileSync(options.streamTo, Buffer.alloc(0), { flag: 'wx' });
      for (let offset = 0; offset < body.length; offset += 4) { const chunk = body.subarray(offset, offset + 4); fs.appendFileSync(options.streamTo, chunk); options.onChunk(chunk); }
      return { statusCode: 200, headers: {} };
    }
  };
  const engine = new UpdaterEngine({ currentVersion: '1.1.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport, maxRetries: 0 });
  await engine.check();
  engine.state.package.url = 'https://updates.example.test/A';
  const ready = await engine.download();
  assert.equal(ready.state, 'ready');
  assert.equal(fs.statSync(ready.package.packagePath).size, body.length);
  assert.equal(calls.includes('https://updates.example.test/B'), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test('streaming redirect limit fails and cleans temporary state', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-updater-redirect-limit-'));
  const body = Buffer.from('redirect package');
  const metadata = feed('1.2.0', body);
  const transport = {
    streaming: true,
    async request(url) {
      if (url.includes('/feed')) return { statusCode: 200, headers: {}, body: metadata };
      return { statusCode: 302, headers: { location: url } };
    }
  };
  const engine = new UpdaterEngine({ currentVersion: '1.1.0', feedUrl: 'https://updates.example.test/feed', storageRoot: root, transport, maxRetries: 0 });
  await engine.check(); engine.state.package.url = 'https://updates.example.test/loop';
  await assert.rejects(() => engine.download(), /redirect limit/);
  assert.equal(fs.readdirSync(root).length, 0);
  fs.rmSync(root, { recursive: true, force: true });
});

test('transport discards huge redirect bodies without creating a temp or returning body data', async () => {
  let destroyed = false;
  const client = { get(_url, _options, callback) {
    const request = new EventEmitter(); request.setTimeout = () => {}; request.destroy = () => { destroyed = true; };
    const response = new EventEmitter(); response.statusCode = 302; response.headers = { location: 'https://updates.example.test/final' }; response.destroy = () => { destroyed = true; };
    setImmediate(() => { callback(response); response.emit('data', Buffer.alloc(2 * 1024 * 1024)); response.emit('end'); });
    return request;
  } };
  const transport = createHttpsTransport({ httpsClient: client });
  const result = await transport.request('https://updates.example.test/start', { streamTo: path.join(os.tmpdir(), `discard-${process.pid}.nupkg`) });
  assert.equal(result.body, undefined);
  assert.equal(result.statusCode, 302);
  assert.equal(destroyed, false);
});

test('transport rejects oversized metadata while receiving it', async () => {
  let destroyed = false;
  const client = { get(_url, _options, callback) {
    const request = new EventEmitter(); request.setTimeout = () => {}; request.destroy = () => { destroyed = true; };
    const response = new EventEmitter(); response.statusCode = 200; response.headers = {}; response.destroy = () => { destroyed = true; };
    setImmediate(() => { callback(response); response.emit('data', Buffer.alloc(300 * 1024)); });
    return request;
  } };
  const transport = createHttpsTransport({ httpsClient: client });
  await assert.rejects(() => transport.request('https://updates.example.test/feed'), /metadata exceeds/);
  assert.equal(destroyed, true);
});
