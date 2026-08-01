import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogRoot = path.join(repositoryRoot, 'dim-sum');
const partsRoot = path.join(catalogRoot, 'catalog-parts');
const partPattern = /^part-(\d{4})-(\d{4})\.json$/;
const progress = process.argv.includes('--progress');
const trackedOnly = process.argv.includes('--tracked-only');

const filenames = (await readdir(partsRoot))
  .filter(filename => partPattern.test(filename))
  .sort((left, right) => left.localeCompare(right));

if ((!progress && filenames.length !== 16) || filenames.length === 0) {
  throw new Error(`${progress ? 'Progress mode needs at least one' : 'Expected exactly sixteen'} catalog parts; found ${filenames.length}.`);
}

let dishes = [];
for (const filename of filenames) {
  const match = partPattern.exec(filename);
  const expectedStart = Number(match[1]);
  const expectedEnd = Number(match[2]);
  const part = JSON.parse(await readFile(path.join(partsRoot, filename), 'utf8'));

  if (!Array.isArray(part) || part.length !== expectedEnd - expectedStart + 1) {
    throw new Error(`${filename} must contain exactly ${expectedEnd - expectedStart + 1} records.`);
  }

  for (let offset = 0; offset < part.length; offset += 1) {
    const expectedId = `hk-dish-${String(expectedStart + offset).padStart(4, '0')}`;
    if (part[offset]?.id !== expectedId) {
      throw new Error(`${filename}[${offset}] must use ID ${expectedId}.`);
    }
  }
  dishes.push(...part);
}

// Audit every authored record before progress mode filters down to the images in
// the current five-file checkpoint. This prevents unpictured cross-part name or
// slug collisions from hiding until the final 3,000-image build.
for (const [label, valueOf] of [
  ['ID', dish => dish.id],
  ['slug', dish => dish.slug],
  ['English name', dish => dish.name?.en?.toLocaleLowerCase('en')],
  ['Traditional Chinese name', dish => dish.name?.zhHant],
  ['image path', dish => dish.image?.path]
]) {
  const firstIdByValue = new Map();
  for (const dish of dishes) {
    const value = valueOf(dish);
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`${dish.id ?? 'Unknown record'} is missing ${label}.`);
    }
    if (firstIdByValue.has(value)) {
      throw new Error(`Duplicate authored ${label}: ${value} (${firstIdByValue.get(value)} and ${dish.id}).`);
    }
    firstIdByValue.set(value, dish.id);
  }
}

const untranslatedEnglishRun = /[A-Za-z]+(?:[-'][A-Za-z]+)?(?:\s+[A-Za-z]+(?:[-'][A-Za-z]+)?){3,}/u;
for (const dish of dishes) {
  if (untranslatedEnglishRun.test(dish.image?.alt?.yue ?? '')) {
    throw new Error(`${dish.id} Cantonese alt text contains a run of four or more untranslated English words.`);
  }
  if (Number(dish.id?.slice(-4)) >= 3001 && Number(dish.id?.slice(-4)) <= 4000) {
    const matchaText = JSON.stringify(dish).toLocaleLowerCase('en');
    if (!matchaText.includes('matcha') && !matchaText.includes('抹茶')) {
      throw new Error(`${dish.id} must explicitly include matcha in its authored record.`);
    }
  }
}

if (!progress && dishes.length !== 4000) {
  throw new Error(`Catalog must contain exactly 4,000 dishes; found ${dishes.length}.`);
}

if (progress) {
  let includedPaths;
  if (trackedOnly) {
    includedPaths = new Set(execFileSync('git', ['ls-files', '--cached', '--', 'dim-sum/images/*.png'], {
      cwd: repositoryRoot,
      encoding: 'utf8'
    }).split(/\r?\n/u).filter(Boolean).map(filename => filename.replace(/^dim-sum\//u, '')));
  } else {
    includedPaths = new Set();
    for (const dish of dishes) {
      try {
        await access(path.join(catalogRoot, dish.image.path));
        includedPaths.add(dish.image.path);
      } catch {
        // Missing files are deliberately excluded from an in-progress checkpoint.
      }
    }
  }
  dishes = dishes.filter(dish => includedPaths.has(dish.image.path));
  if (dishes.length === 0) {
    throw new Error('Progress catalog cannot be empty.');
  }
  dishes.sort((left, right) => left.id.localeCompare(right.id));
}

const indexes = {
  byId: {},
  bySlug: {},
  byCategory: {}
};

for (const [recordIndex, dish] of dishes.entries()) {
  indexes.byId[dish.id] = recordIndex;
  indexes.bySlug[dish.slug] = recordIndex;
  (indexes.byCategory[dish.category] ??= []).push(recordIndex);
}

const index = {
  schemaVersion: '1.0.0',
  catalogStatus: progress ? 'in-progress' : 'complete',
  title: 'Hong Kong dim sum and dish catalog',
  total: dishes.length,
  imageSpecification: {
    format: 'png',
    mediaType: 'image/png',
    quality: 'native-lossless-imagegen-output',
    minimumWidth: 1024,
    minimumHeight: 1024,
    generationMode: 'one-distinct-built-in-imagegen-call-per-dish'
  },
  dishes,
  indexes
};

await writeFile(path.join(catalogRoot, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Built ${progress ? 'in-progress' : 'complete'} dim-sum/index.json with ${dishes.length} dishes from ${filenames.length} parts.`);
