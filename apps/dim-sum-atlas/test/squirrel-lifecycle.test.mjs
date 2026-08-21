import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SQUIRREL_LIFECYCLE_ARGS, handleSquirrelLifecycle } = require('../src/updater/squirrel-lifecycle.js');

test('all exact Squirrel lifecycle hooks are handled without normal startup', () => {
  for (const argument of SQUIRREL_LIFECYCLE_ARGS) {
    const calls = [];
    assert.equal(handleSquirrelLifecycle(['electron.exe', argument], { quit: (value) => calls.push(value) }), true);
    assert.deepEqual(calls, [argument]);
  }
});

test('ordinary launch arguments are not treated as lifecycle hooks', () => {
  const calls = [];
  assert.equal(handleSquirrelLifecycle(['electron.exe', '--no-sandbox'], { quit: (value) => calls.push(value) }), false);
  assert.deepEqual(calls, []);
  assert.equal(handleSquirrelLifecycle(['electron.exe', '--squirrel-install-extra'], { quit: (value) => calls.push(value) }), false);
});

test('main wires lifecycle handling before instance lock and normal readiness', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.ok(source.indexOf("handleSquirrelLifecycle(process.argv") < source.indexOf('requestSingleInstanceLock()'));
  assert.ok(source.indexOf('squirrelLifecycleHandled || !isPrimaryInstance') < source.indexOf('setupUpdater();'));
});
