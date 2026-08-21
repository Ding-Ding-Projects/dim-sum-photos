import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function generateMetadata({ root, dist, args }) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'apps', 'dim-sum-atlas', 'package.json'), 'utf8'));
  const fullPackages = fs.readdirSync(dist).filter(file => /-full\.nupkg$/i.test(file));
  if (fullPackages.length !== 1) throw new Error(`Expected exactly one full nupkg, found ${fullPackages.length}.`);
  const nupkg = fullPackages[0];
  const candidate = args.candidate === 'true' || args.candidate === '1';
  let tag = 'UNPUBLISHED-CANDIDATE'; let commit = 'UNPUBLISHED-CANDIDATE'; let repo = 'owner/repository';
  if (!candidate) {
    tag = args.tag; commit = args.commit; repo = args.repo;
    if (!tag || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(tag) || tag.toLowerCase() === 'latest') throw new Error('Published metadata requires a bounded immutable tag, not latest or an empty value.');
    if (!commit || !/^[0-9a-f]{7,64}$/i.test(commit)) throw new Error('Published metadata requires a hexadecimal target commit.');
    if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Published metadata requires an owner/repository value.');
  }
  const bytes = fs.statSync(path.join(dist, nupkg)).size;
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(dist, nupkg))).digest('hex');
  const metadata = { schema: 'dim-sum-atlas.update.v1', channel: 'stable', appVersion: packageJson.version, package: { filename: nupkg, bytes, sha256 }, release: { published: !candidate, tag, targetCommit: commit, fullNupkgUrl: `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(nupkg)}`, releaseNotesUrl: `https://github.com/${repo}/releases/tag/${encodeURIComponent(tag)}` } };
  const output = path.join(dist, candidate ? 'update-metadata.candidate.json' : 'update.json');
  fs.writeFileSync(output, JSON.stringify(metadata, null, 2) + '\n');
  return { output, metadata };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const args = Object.fromEntries(process.argv.slice(2).map(arg => { const [key, ...rest] = arg.replace(/^--/, '').split('='); return [key, rest.join('=')]; }));
  const root = args.root ? path.resolve(args.root) : path.resolve(import.meta.dirname, '..');
  const dist = args.dist ? path.resolve(args.dist) : path.join(root, 'apps', 'dim-sum-atlas', 'dist', 'squirrel-windows');
  const result = generateMetadata({ root, dist, args });
  console.log(`Generated ${result.metadata.release.published ? 'stable' : 'unpublished candidate'} update metadata: ${result.output}`);
}
