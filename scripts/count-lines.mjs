#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const rootArg = process.argv.find((arg) => arg.startsWith('--root='));
const root = resolve(rootArg ? rootArg.slice('--root='.length) : process.cwd());
const jsonOnly = args.has('--json');

const CATEGORY_ORDER = ['source', 'tests', 'stylesMarkup', 'generated', 'other', 'excluded'];
const CATEGORY_LABELS = {
  source: 'Project source',
  tests: 'Tests',
  stylesMarkup: 'Styles / markup',
  generated: 'Generated project data',
  other: 'Other project files',
  excluded: 'Excluded / third-party / build data',
};

function git(args, options = {}) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.quietStderr ? 'ignore' : 'pipe'],
  }).trimEnd();
}

function trackedFiles() {
  return git(['ls-files', '-z']).split('\0').filter(Boolean).sort();
}

function isBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  return sample.includes(0);
}

function countText(buffer) {
  if (buffer.length === 0) return { total: 0, nonblank: 0 };
  const text = buffer.toString('utf8');
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.at(-1) === '') lines.pop();
  return { total: lines.length, nonblank: lines.filter((line) => line.trim() !== '').length };
}

function classify(path) {
  const normalized = path.replaceAll('\\', '/').toLowerCase();
  const base = normalized.split('/').at(-1);
  if (
    /(^|\/)(node_modules|vendor|third_party|dist|build-output|coverage|out|release)(\/|$)/.test(normalized)
    || /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(normalized)
    || /(^|\/)catalog\/(images?|photos?|volumes?|archives?)(\/|$)/.test(normalized)
    || /\.(png|jpe?g|gif|webp|ico|zip|7z|nupkg|exe|dll|pdf|woff2?|ttf|otf)$/.test(normalized)
  ) return 'excluded';
  if (/^catalog\/(index|additions-[^/]+)\.json$/.test(normalized) || /(^|\/)icon-manifest\.json$/.test(normalized)) return 'generated';
  if (/(^|\/)(test|tests|__tests__)(\/|$)/.test(normalized) || /\.(test|spec)\.[cm]?[jt]s$/.test(normalized) || /^scripts\/test-/.test(normalized)) return 'tests';
  if (/\.(css|scss|sass|less|html?|svg|xml)$/.test(normalized)) return 'stylesMarkup';
  if (/\.(mjs|cjs|js|ts|tsx|jsx|ps1|bat|cmd|py|go|rs|java|cs|cpp|c|h|hpp|ya?ml|toml)$/.test(normalized)) return 'source';
  if (base === '.gitignore' || base === '.gitattributes') return 'other';
  return 'other';
}

function commitIsAgent(commit, cache) {
  if (cache.has(commit)) return cache.get(commit);
  const record = git(['show', '-s', '--format=%an%x00%ae%x00%B', commit], { quietStderr: true });
  const [authorName, authorEmail, ...bodyParts] = record.split('\0');
  const body = bodyParts.join('\0');
  const identity = `${authorName} <${authorEmail}>`;
  const byAuthor = identity === 'Claude Fable 5 <noreply@anthropic.com>';
  const byTrailer = /^Co-Authored-By:\s*Claude Fable 5 <noreply@anthropic\.com>\s*$/im.test(body);
  const result = byAuthor || byTrailer;
  cache.set(commit, result);
  return result;
}

function blameFile(path, lineCount, cache) {
  if (lineCount === 0) return { agent: 0, human: 0, unavailable: 0 };
  try {
    const output = git(['blame', '--root', '--incremental', '--', path], { quietStderr: true });
    const groups = output.split(/\r?\n/).map((line) => /^([0-9a-f]{40})\s+\d+\s+\d+\s+(\d+)$/.exec(line)).filter(Boolean);
    const attributed = groups.reduce((sum, match) => sum + Number(match[2]), 0);
    if (attributed !== lineCount) return { agent: 0, human: 0, unavailable: lineCount };
    let agent = 0;
    for (const match of groups) if (commitIsAgent(match[1], cache)) agent += Number(match[2]);
    return { agent, human: lineCount - agent, unavailable: 0 };
  } catch {
    return { agent: 0, human: 0, unavailable: lineCount };
  }
}

let gitAvailable = true;
let files;
try {
  files = trackedFiles();
} catch {
  gitAvailable = false;
  throw new Error('A Git checkout is required to enumerate the committed project files.');
}

const rows = Object.fromEntries(CATEGORY_ORDER.map((key) => [key, { key, label: CATEGORY_LABELS[key], files: 0, total: 0, nonblank: 0 }]));
const fileRecords = [];
for (const path of files) {
  const buffer = readFileSync(resolve(root, path));
  const category = classify(path);
  if (isBinary(buffer)) {
    rows.excluded.files += 1;
    fileRecords.push({ path, category: 'excluded', binary: true, total: 0, nonblank: 0 });
    continue;
  }
  const counts = countText(buffer);
  rows[category].files += 1;
  rows[category].total += counts.total;
  rows[category].nonblank += counts.nonblank;
  fileRecords.push({ path, category, binary: false, ...counts });
}

const includedKeys = CATEGORY_ORDER.filter((key) => key !== 'excluded');
const project = includedKeys.reduce((sum, key) => ({ total: sum.total + rows[key].total, nonblank: sum.nonblank + rows[key].nonblank }), { total: 0, nonblank: 0 });
const everything = CATEGORY_ORDER.reduce((sum, key) => ({ total: sum.total + rows[key].total, nonblank: sum.nonblank + rows[key].nonblank }), { total: 0, nonblank: 0 });
if (project.total + rows.excluded.total !== everything.total || project.nonblank + rows.excluded.nonblank !== everything.nonblank) {
  throw new Error('Line-count arithmetic does not reconcile.');
}

const attribution = { agent: 0, human: 0, unavailable: 0, rule: 'A surviving line is agent-authored when git blame identifies a commit whose author is exactly Claude Fable 5 <noreply@anthropic.com> or whose message contains that exact Co-Authored-By trailer.' };
const commitCache = new Map();
if (gitAvailable) {
  for (const file of fileRecords.filter((entry) => entry.category !== 'excluded' && !entry.binary)) {
    const result = blameFile(file.path, file.total, commitCache);
    attribution.agent += result.agent;
    attribution.human += result.human;
    attribution.unavailable += result.unavailable;
  }
}
if (attribution.agent + attribution.human + attribution.unavailable !== project.total) {
  throw new Error('Attribution arithmetic does not reconcile with the project total.');
}

const result = {
  schemaVersion: 1,
  commit: git(['rev-parse', 'HEAD']),
  categories: CATEGORY_ORDER.map((key) => rows[key]),
  totals: { project, everythingCounted: everything },
  attribution,
  exclusions: [
    'Dependency directories, vendored and third-party trees, build output, coverage, and release staging.',
    'Lockfiles and binary artifacts, including installers, archives, fonts, icons, and images.',
    'Bulk catalog image, photo, volume, and archive trees; catalog metadata remains visible as generated project data.',
  ],
};

if (jsonOnly) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  const lines = [
    '| Category | Files | Total lines | Non-blank lines |',
    '| --- | ---: | ---: | ---: |',
    ...result.categories.map((row) => `| ${row.label} | ${row.files} | ${row.total} | ${row.nonblank} |`),
    `| **Project total** |  | **${project.total}** | **${project.nonblank}** |`,
    `| **Everything counted** |  | **${everything.total}** | **${everything.nonblank}** |`,
    '',
    '| Surviving-line attribution | Lines |',
    '| --- | ---: |',
    `| Agent-authored | ${attribution.agent} |`,
    `| Human-authored | ${attribution.human} |`,
    `| Attribution unavailable | ${attribution.unavailable} |`,
    '',
    `Attribution rule: ${attribution.rule}`,
    '',
    `Measured at commit \`${result.commit}\` with \`node scripts/count-lines.mjs\`.`,
    '',
    'Excluded from the project total:',
    ...result.exclusions.map((item) => `- ${item}`),
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

export { CATEGORY_ORDER, classify, countText };
