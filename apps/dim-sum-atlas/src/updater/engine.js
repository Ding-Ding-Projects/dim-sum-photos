'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

const STATES = Object.freeze(['disabled', 'idle', 'checking', 'available', 'downloading', 'ready', 'error']);
const MAX_REDIRECTS = 3;
const MAX_METADATA_BYTES = 256 * 1024;
const MAX_PACKAGE_BYTES = 1024 * 1024 * 1024;

function compareVersions(left, right) {
  const parse = (value) => String(value).replace(/^v/i, '').split('-')[0].split('.').map((part) => {
    const match = String(part).match(/^\d+/);
    return Number(match ? match[0] : 0);
  });
  const a = parse(left); const b = parse(right);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  }
  return 0;
}

function majorVersion(value) { return Number(String(value).replace(/^v/i, '').split('.')[0]) || 0; }

function validHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch (_) { return false; }
}

function validPackageFilename(filename, version) {
  return typeof filename === 'string' && filename.length <= 180 && filename === path.basename(filename) && /^[A-Za-z0-9][A-Za-z0-9._-]*\.nupkg$/i.test(filename) && filename.includes(version);
}

function safeState(state) {
  return { ...state, package: state.package ? { ...state.package } : undefined };
}

function createHttpsTransport() {
  return {
    request(url, options = {}) {
      return new Promise((resolve, reject) => {
        const request = https.get(url, { headers: { 'User-Agent': 'Dim-Sum-Atlas-Updater/1', Accept: 'application/json', ...options.headers } }, (response) => {
          const chunks = []; let bytes = 0;
          response.on('data', (chunk) => { bytes += chunk.length; chunks.push(chunk); if (typeof options.onChunk === 'function') options.onChunk(chunk); });
          response.on('end', () => resolve({ statusCode: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
        });
        if (options.signal) options.signal.addEventListener('abort', () => request.destroy(Object.assign(new Error('Update download cancelled.'), { name: 'AbortError' })), { once: true });
        request.setTimeout(options.timeoutMs || 15000, () => request.destroy(new Error('Update request timed out.')));
        request.on('error', reject);
      });
    }
  };
}

class UpdaterEngine {
  constructor(options = {}) {
    this.currentVersion = options.currentVersion || '0.0.0';
    this.feedUrl = options.feedUrl || '';
    this.app = options.app || null;
    this.runtime = options.runtime || {};
    this.transport = options.transport || createHttpsTransport();
    this.fs = options.fs || fs;
    this.path = options.path || path;
    this.clock = options.clock || (() => Date.now());
    this.storageRoot = options.storageRoot || null;
    this.allowMajor = options.allowMajor !== false;
    this.checkIntervalMs = Math.max(60_000, Number(options.checkIntervalMs) || 6 * 60 * 60 * 1000);
    this.maxRetries = Math.min(3, Math.max(0, Number(options.maxRetries) || 2));
    this.workState = { dirty: false, inFlight: false };
    this.listeners = new Set();
    this.timer = null;
    this.checkPromise = null;
    this.downloadPromise = null;
    this.downloadAbort = null;
    this.generation = 0;
    this.state = {
      state: validHttpsUrl(this.feedUrl) ? 'idle' : 'disabled',
      currentVersion: this.currentVersion,
      availableVersion: null,
      progress: null,
      error: validHttpsUrl(this.feedUrl) ? null : 'Automatic updates are unavailable until a credential-free HTTPS feed is configured.',
      lastCheckedAt: null,
      stagedPath: null
    };
  }

  onState(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  snapshot() { return safeState(this.state); }
  setWorkState({ dirty = false, inFlight = false } = {}) {
    this.workState = { dirty: Boolean(dirty), inFlight: Boolean(inFlight) };
    return { ...this.workState };
  }
  emit(patch) {
    this.state = { ...this.state, ...patch };
    const state = this.snapshot();
    for (const listener of this.listeners) { try { listener(state); } catch (_) { /* listener isolation */ } }
    return state;
  }

  start() {
    if (this.state.state === 'disabled' || this.timer) return;
    this.timer = setInterval(() => { this.check({ trigger: 'schedule' }).catch(() => undefined); }, this.checkIntervalMs);
    if (this.timer.unref) this.timer.unref();
  }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }

  async check({ trigger = 'manual' } = {}) {
    if (this.state.state === 'disabled') throw new Error(this.state.error);
    if (this.checkPromise) return this.checkPromise;
    const generation = ++this.generation;
    this.checkPromise = this._check(generation, trigger).finally(() => { this.checkPromise = null; });
    return this.checkPromise;
  }

  async _requestFollowingRedirects(url, redirects = 0, options = {}) {
    if (!validHttpsUrl(url)) throw new Error('Update feed and package URLs must use credential-free HTTPS.');
    const response = await this.transport.request(url, { timeoutMs: 15000, ...options });
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers && response.headers.location) {
      if (redirects >= MAX_REDIRECTS) throw new Error('Update feed exceeded the redirect limit.');
      const next = new URL(response.headers.location, url).toString();
      return this._requestFollowingRedirects(next, redirects + 1, options);
    }
    return response;
  }

  parseMetadata(response) {
    if (!response || response.statusCode !== 200) throw new Error(`Update feed returned HTTP ${response && response.statusCode}.`);
    const body = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body || '');
    if (body.length > MAX_METADATA_BYTES) throw new Error('Update metadata exceeds the safety limit.');
    let metadata; try { metadata = JSON.parse(body.toString('utf8')); } catch (_) { throw new Error('Update metadata is not valid JSON.'); }
    const pkg = metadata && metadata.package;
    if (!metadata || typeof metadata.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(metadata.version) || !pkg || typeof pkg.url !== 'string' || typeof pkg.sha256 !== 'string') {
      throw new Error('Update metadata is missing a valid version or package identity.');
    }
    if (!validHttpsUrl(pkg.url) || !/^[a-f0-9]{64}$/i.test(pkg.sha256) || !Number.isSafeInteger(pkg.size) || pkg.size <= 0 || pkg.size > MAX_PACKAGE_BYTES || !validPackageFilename(pkg.filename || this.path.basename(new URL(pkg.url).pathname), metadata.version)) throw new Error('Update package metadata is invalid.');
    if (metadata.channel !== undefined && metadata.channel !== 'stable') throw new Error('Update metadata is for an unsupported channel.');
    if (!this.allowMajor && majorVersion(metadata.version) !== majorVersion(this.currentVersion)) throw new Error('Major-version updates are not enabled for this installation.');
    if (compareVersions(metadata.version, this.currentVersion) <= 0) return null;
    return { version: metadata.version, package: { url: pkg.url, sha256: pkg.sha256.toLowerCase(), size: pkg.size, filename: String(pkg.filename || this.path.basename(new URL(pkg.url).pathname)) }, releaseNotes: typeof metadata.releaseNotes === 'string' ? metadata.releaseNotes : '' };
  }

  async _check(generation, trigger) {
    this.emit({ state: 'checking', error: null, lastTrigger: trigger });
    try {
      const metadata = this.parseMetadata(await this._requestFollowingRedirects(this.feedUrl));
      if (generation !== this.generation) return this.snapshot();
      this.emit({ state: metadata ? 'available' : 'idle', availableVersion: metadata ? metadata.version : null, package: metadata ? metadata.package : null, releaseNotes: metadata ? metadata.releaseNotes : '', lastCheckedAt: new Date(this.clock()).toISOString() });
      return this.snapshot();
    } catch (error) {
      if (generation === this.generation) this.emit({ state: 'error', error: error.message, lastCheckedAt: new Date(this.clock()).toISOString() });
      throw error;
    }
  }

  async download() {
    if (this.downloadPromise) return this.downloadPromise;
    if (this.state.state !== 'available' || !this.state.package) throw new Error('No validated update is available to download.');
    const generation = this.generation; const pkg = this.state.package;
    this.downloadPromise = this._download(generation, pkg).finally(() => { this.downloadPromise = null; });
    return this.downloadPromise;
  }

  async _download(generation, pkg) {
    if (!this.storageRoot) throw new Error('Update storage is not configured.');
    this.fs.mkdirSync(this.storageRoot, { recursive: true });
    const free = typeof this.fs.statfsSync === 'function' ? this.fs.statfsSync(this.storageRoot).bavail * this.fs.statfsSync(this.storageRoot).bsize : Number.MAX_SAFE_INTEGER;
    if (free < pkg.size * 2) throw new Error('Insufficient storage for a safe staged update.');
    const temp = this.path.join(this.storageRoot, `.update-${generation}-${process.pid}.partial`);
    const packagePath = this.path.join(this.storageRoot, pkg.filename.replace(/[^\w.\-]/g, '_'));
    const feedDirectory = this.path.join(this.storageRoot, `feed-${this.state.availableVersion}`);
    let lastError;
    const controller = new AbortController();
    this.downloadAbort = controller;
    let received = 0;
    this.emit({ state: 'downloading', progress: { received: 0, total: pkg.size, fraction: 0 }, error: null });
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        received = 0;
        const response = await this._requestFollowingRedirects(pkg.url, 0, {
          signal: controller.signal,
          onChunk: (chunk) => {
            received += chunk.length;
            this.emit({ progress: { received, total: pkg.size, fraction: Math.min(1, received / pkg.size) } });
          }
        });
        if (response.statusCode !== 200) throw new Error(`Update package returned HTTP ${response.statusCode}.`);
        const body = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body || '');
        if (received === 0) {
          received = body.length;
          this.emit({ progress: { received, total: pkg.size, fraction: Math.min(1, received / pkg.size) } });
        }
        if (body.length !== pkg.size) throw new Error('Update package size does not match metadata.');
        const hash = crypto.createHash('sha256').update(body).digest('hex');
        if (hash !== pkg.sha256) throw new Error('Update package hash does not match metadata.');
        if (generation !== this.generation) throw new Error('Update download was superseded.');
        const sha1 = crypto.createHash('sha1').update(body).digest('hex');
        const releasesLine = `${sha1} ${pkg.filename} ${pkg.size}\n`;
        this.fs.mkdirSync(feedDirectory, { recursive: true });
        this.fs.writeFileSync(temp, body, { flag: 'wx' });
        this.fs.renameSync(temp, packagePath);
        const feedReleaseTemp = this.path.join(feedDirectory, `.RELEASES-${process.pid}.tmp`);
        this.fs.copyFileSync(packagePath, this.path.join(feedDirectory, pkg.filename));
        this.fs.writeFileSync(feedReleaseTemp, releasesLine, 'utf8');
        this.fs.renameSync(feedReleaseTemp, this.path.join(feedDirectory, 'RELEASES'));
        this._persist({ version: this.state.availableVersion, path: feedDirectory, packagePath: this.path.join(feedDirectory, pkg.filename), sha256: hash, sha1, size: pkg.size, releasesLine });
        this.downloadAbort = null;
        this.emit({ state: 'ready', stagedPath: feedDirectory, package: { ...pkg, sha256: hash, sha1, feedDirectory, packagePath: this.path.join(feedDirectory, pkg.filename), releasesLine }, progress: { received: pkg.size, total: pkg.size, fraction: 1 } });
        return this.snapshot();
      } catch (error) { lastError = error; if (this.fs.existsSync(temp)) this.fs.rmSync(temp, { force: true }); if (error.name === 'AbortError' || controller.signal.aborted) break; if (attempt < this.maxRetries) continue; }
    }
    this.downloadAbort = null;
    if (controller.signal.aborted) {
      this.emit({ state: 'available', progress: null, error: 'Update download cancelled.' });
      return this.snapshot();
    }
    this.emit({ state: 'error', error: lastError.message, progress: null });
    throw lastError;
  }

  cancel() {
    if (!this.downloadPromise) return false;
    this.generation += 1;
    if (this.downloadAbort) this.downloadAbort.abort();
    this.emit({ state: this.state.availableVersion ? 'available' : 'idle', progress: null, error: 'Update download cancelled.' });
    return true;
  }
  restart() {
    if (this.state.state !== 'ready' || !this.state.stagedPath) throw new Error('No staged update is ready to install.');
    if (this.workState.dirty || this.workState.inFlight) throw new Error('Restart is deferred while unsaved or active work is present.');
    if (typeof this.runtime.installPackage !== 'function') throw new Error('Installed updater package-install seam is unavailable.');
    return this.runtime.installPackage(this.state.stagedPath, { ...this.state.package, version: this.state.availableVersion });
  }
  _persist(record) {
    if (!this.storageRoot) return;
    const target = this.path.join(this.storageRoot, 'last-valid-update.json'); const temp = `${target}.${process.pid}.tmp`;
    try { this.fs.writeFileSync(temp, JSON.stringify(record), 'utf8'); this.fs.renameSync(temp, target); } finally { if (this.fs.existsSync(temp)) this.fs.rmSync(temp, { force: true }); }
  }
}

module.exports = { UpdaterEngine, STATES, compareVersions, validHttpsUrl, validPackageFilename, createHttpsTransport };
