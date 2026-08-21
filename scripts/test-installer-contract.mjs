import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pkg = JSON.parse(read('apps/dim-sum-atlas/package.json'));
const workflow = read('.github/workflows/electron-release.yml');
const verify = read('scripts/verify-installer.mjs');
const clean = read('scripts/clean-installer-output.mjs');

assert.ok(Number(pkg.version.split('.')[0]) * 10000 + Number(pkg.version.split('.')[1]) * 100 + Number(pkg.version.split('.')[2]) > 100, 'version must exceed 0.1.0');
assert.equal(pkg.build.win.target.length, 1, 'exactly one Windows target is required');
assert.equal(pkg.build.win.target[0].target, 'squirrel', 'the Windows target must be Squirrel.Windows');
assert.deepEqual(pkg.build.win.target[0].arch, ['x64']);
assert.equal(pkg.build.win.forceCodeSigning, false);
assert.equal(pkg.build.win.signExecutable, false);
assert.equal(pkg.build.win.signAndEditExecutable, false);
assert.equal(pkg.scripts['build:installer'].includes('clean-installer-output.mjs'), true);
assert.doesNotMatch(JSON.stringify(pkg), /nsis/i, 'NSIS must not remain in package configuration');
assert.doesNotMatch(workflow, /nsis/i, 'NSIS must not remain in the release workflow');
assert.match(workflow, /Record workflow start/);
assert.match(workflow, /steps\.timing\.outputs\.workflow_start/);
assert.match(workflow, /gh release create[\s\S]*--target \$env:GITHUB_SHA/);
assert.match(workflow, /catalog release/);
assert.match(workflow, /name\.en/);
assert.match(workflow, /name\.zhHant/);
assert.match(workflow, /Get-FileHash \$photo/);
assert.match(workflow, /gh release edit \$tag[\s\S]*--notes-file/);
assert.match(verify, /RELEASES does not reference the full nupkg/);
assert.match(verify, /--signature-status=/);
assert.doesNotMatch(verify, /unsigned:\s*true/);
assert.match(clean, /squirrel-windows/);
for (const script of ['download-dependencies.bat', 'build.bat', 'build-installer.bat']) {
  const source = read(script);
  assert.match(source, /%\*/);
  assert.match(source, /\/s/);
  assert.match(source, /--silent/);
  assert.match(source, /SILENT/);
}
assert.match(read('download-dependencies.bat'), /bootstrap-node\.ps1/);
assert.match(read('scripts/bootstrap-node.ps1'), /node-runtime\.json/);
assert.match(read('scripts/node-runtime.json'), /22\.14\.0/);
assert.match(read('build.bat'), /start .*%APP%/);
assert.match(read('build-installer.bat'), /Get-AuthenticodeSignature/);
assert.match(read('build-installer.bat'), /NotSigned/);
assert.match(read('scripts/portable-7z.json'), /sha256/);
for (const file of ['apps/dim-sum-atlas/build/icon.svg', 'apps/dim-sum-atlas/build/icon.ico', 'apps/dim-sum-atlas/build/icon-manifest.json']) assert.ok(fs.existsSync(path.join(root, file)), `${file} is required`);
console.log('PASS installer contract: Squirrel target, clean output, unsigned proof, silent scripts, timing, photo code name, immutable target, icon, and release evidence');
