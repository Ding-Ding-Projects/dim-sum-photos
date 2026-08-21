import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const counter = new URL('./count-lines.mjs', import.meta.url).pathname.replace(/^\/(.:)/, '$1');

function run(root) {
  return JSON.parse(execFileSync(process.execPath, [counter, '--json', `--root=${root}`], { encoding: 'utf8' }));
}

test('reports every required category, catch-all files, and reconciled arithmetic', () => {
  const root = mkdtempSync(join(tmpdir(), 'line-counter-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: root });
    execFileSync('git', ['config', 'user.name', 'Human Tester'], { cwd: root });
    execFileSync('git', ['config', 'user.email', 'human@example.invalid'], { cwd: root });
    mkdirSync(join(root, 'src')); mkdirSync(join(root, 'test')); mkdirSync(join(root, 'site')); mkdirSync(join(root, 'catalog')); mkdirSync(join(root, 'node_modules'));
    writeFileSync(join(root, 'src', 'main.js'), 'const value = 1;\n\nexport { value };\n');
    writeFileSync(join(root, 'test', 'main.test.mjs'), '/* test */\n');
    writeFileSync(join(root, 'site', 'index.html'), '<main>Hi</main>\n');
    writeFileSync(join(root, 'catalog', 'index.json'), '{\n  "generated": true\n}\n');
    writeFileSync(join(root, 'README.md'), '# Catch-all documentation\n');
    writeFileSync(join(root, 'package-lock.json'), '{\n  "lockfileVersion": 3\n}\n');
    writeFileSync(join(root, 'node_modules', 'dep.js'), 'ignored dependency line\n');
    execFileSync('git', ['add', '-A'], { cwd: root });
    execFileSync('git', ['commit', '-qm', 'Fixture commit'], { cwd: root });
    const result = run(root);
    assert.deepEqual(result.categories.map((row) => row.key), ['source', 'tests', 'stylesMarkup', 'generated', 'other', 'excluded']);
    const byKey = Object.fromEntries(result.categories.map((row) => [row.key, row]));
    assert.equal(byKey.other.files, 1, 'README must be caught by the explicit other category');
    assert.equal(byKey.excluded.files, 2, 'lockfile and tracked dependency file must remain visible as excluded');
    assert.equal(result.totals.project.total + byKey.excluded.total, result.totals.everythingCounted.total);
    assert.equal(result.attribution.agent + result.attribution.human + result.attribution.unavailable, result.totals.project.total);
    assert.equal(result.attribution.human, result.totals.project.total);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('uses the exact author or trailer rule for surviving-line attribution', () => {
  const root = mkdtempSync(join(tmpdir(), 'line-attribution-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: root });
    execFileSync('git', ['config', 'user.name', 'Claude Fable 5'], { cwd: root });
    execFileSync('git', ['config', 'user.email', 'noreply@anthropic.com'], { cwd: root });
    writeFileSync(join(root, 'one.js'), 'agent line\n');
    execFileSync('git', ['add', 'one.js'], { cwd: root });
    execFileSync('git', ['commit', '-qm', 'Agent fixture\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>'], { cwd: root });
    const result = run(root);
    assert.equal(result.attribution.agent, 1);
    assert.equal(result.attribution.human, 0);
    assert.equal(result.attribution.unavailable, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
