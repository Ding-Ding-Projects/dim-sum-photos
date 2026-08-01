import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogRoot = path.join(repositoryRoot, 'dim-sum');
const indexPath = path.join(catalogRoot, 'index.json');
const writeManifest = process.argv.includes('--write-manifest');
const progress = process.argv.includes('--progress');
const index = JSON.parse(await readFile(indexPath, 'utf8'));

function dimensionsOfPng(buffer, relativePath) {
  assert.ok(buffer.length >= 33, `${relativePath} is too small to be a PNG.`);
  assert.deepEqual(
    [...buffer.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    `${relativePath} is missing PNG magic.`
  );
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', `${relativePath} is missing its IHDR chunk.`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

assert.equal(index.schemaVersion, '1.0.0');
assert.equal(index.catalogStatus, progress ? 'in-progress' : 'complete');
assert.equal(index.total, index.dishes.length);
if (progress) {
  assert.ok(index.total >= 1, `Expected at least one staged dish, found ${index.total}.`);
} else {
  assert.equal(index.total, 4000, `Expected exactly 4,000 dishes, found ${index.total}.`);
}
assert.deepEqual(index.imageSpecification, {
  format: 'png',
  mediaType: 'image/png',
  quality: 'native-lossless-imagegen-output',
  minimumWidth: 1024,
  minimumHeight: 1024,
  generationMode: 'one-distinct-built-in-imagegen-call-per-dish'
});

const uniqueFields = new Map([
  ['ID', new Set()],
  ['slug', new Set()],
  ['English name', new Set()],
  ['Traditional Chinese name', new Set()],
  ['image path', new Set()],
  ['image SHA-256', new Set()]
]);
const manifestImages = [];
const cjkPattern = /[\u3400-\u9fff]/u;
const untranslatedEnglishRun = /[A-Za-z]+(?:[-'][A-Za-z]+)?(?:\s+[A-Za-z]+(?:[-'][A-Za-z]+)?){3,}/u;

for (const [recordIndex, dish] of index.dishes.entries()) {
  const ordinal = recordIndex + 1;
  assert.match(dish.id, /^hk-dish-[0-9]{4}$/);
  const numericId = Number(dish.id.slice(-4));
  if (!progress) {
    const expectedId = `hk-dish-${String(ordinal).padStart(4, '0')}`;
    assert.equal(dish.id, expectedId, `Record ${ordinal} is not sequential.`);
  } else if (recordIndex > 0) {
    assert.ok(dish.id > index.dishes[recordIndex - 1].id, `Progress records are not ordered at ${dish.id}.`);
  }
  assert.match(dish.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(dish.name?.en?.length >= 2, `${dish.id} is missing an English name.`);
  assert.match(dish.name?.zhHant ?? '', cjkPattern, `${dish.id} is missing a Traditional Chinese name.`);
  assert.ok(typeof dish.jyutping === 'string' && dish.jyutping.length >= 2, `${dish.id} is missing Jyutping.`);
  assert.ok(typeof dish.category === 'string' && dish.category.length >= 2, `${dish.id} is missing a category.`);
  assert.ok(typeof dish.subcategory === 'string' && dish.subcategory.length >= 2, `${dish.id} is missing a subcategory.`);
  assert.ok(dish.description?.en?.length >= 8 && dish.description?.yue?.length >= 4, `${dish.id} has incomplete descriptions.`);
  assert.ok(Array.isArray(dish.ingredients) && dish.ingredients.length > 0, `${dish.id} needs ingredients.`);
  assert.ok(Array.isArray(dish.dietaryTags), `${dish.id} dietaryTags must be an array.`);
  assert.ok(Array.isArray(dish.allergens), `${dish.id} allergens must be an array.`);
  assert.match(dish.image?.path ?? '', new RegExp(`^images/${dish.id}-[a-z0-9]+(?:-[a-z0-9]+)*\\.png$`));
  assert.ok(dish.image.alt.en.includes(dish.name.en), `${dish.id} English alt text must name the dish.`);
  assert.ok(dish.image.alt.yue.includes(dish.name.zhHant), `${dish.id} Cantonese alt text must name the dish.`);
  assert.ok(
    !untranslatedEnglishRun.test(dish.image.alt.yue),
    `${dish.id} Cantonese alt text contains a run of four or more untranslated English words.`
  );
  assert.ok(dish.imagePrompt?.length >= 100, `${dish.id} image prompt is too short.`);
  assert.match(dish.imagePrompt, /no (?:people|person)/i, `${dish.id} prompt must exclude people.`);
  assert.match(dish.imagePrompt, /no (?:text|lettering)/i, `${dish.id} prompt must exclude text.`);
  assert.match(dish.imagePrompt, /no watermark/i, `${dish.id} prompt must exclude watermarks.`);

  const shouldBeChocolateFilled = numericId % 20 === 0;
  assert.equal(dish.chocolateFilled === true, shouldBeChocolateFilled, `${dish.id} violates the every-twentieth chocolate-filled invariant.`);
  if (shouldBeChocolateFilled) {
    assert.match(dish.name.en, /chocolate/i, `${dish.id} chocolate dish needs chocolate in its English name.`);
    assert.match(
      dish.name.zhHant,
      /巧克力|朱古力/u,
      `${dish.id} chocolate dish needs 巧克力 or Hong Kong 朱古力 in its Traditional Chinese name.`
    );
    assert.ok(dish.ingredients.some(ingredient => /chocolate|cocoa|cacao/i.test(ingredient)), `${dish.id} chocolate dish needs a chocolate ingredient.`);
    assert.match(dish.imagePrompt, /chocolate/i, `${dish.id} chocolate dish prompt must show its filling.`);
  }

  for (const [label, value] of [
    ['ID', dish.id],
    ['slug', dish.slug],
    ['English name', dish.name.en.toLocaleLowerCase('en')],
    ['Traditional Chinese name', dish.name.zhHant],
    ['image path', dish.image.path]
  ]) {
    const seen = uniqueFields.get(label);
    assert.ok(!seen.has(value), `Duplicate ${label}: ${value}`);
    seen.add(value);
  }

  assert.equal(index.indexes.byId[dish.id], recordIndex, `${dish.id} has an invalid byId index.`);
  assert.equal(index.indexes.bySlug[dish.slug], recordIndex, `${dish.id} has an invalid bySlug index.`);
  assert.ok(index.indexes.byCategory[dish.category]?.includes(recordIndex), `${dish.id} is absent from byCategory.`);

  const absoluteImagePath = path.join(catalogRoot, dish.image.path);
  const imageBuffer = await readFile(absoluteImagePath);
  assert.ok(imageBuffer.length >= 100000, `${dish.image.path} is too small to be a native raw-quality generated asset.`);
  const dimensions = dimensionsOfPng(imageBuffer, dish.image.path);
  assert.equal(dimensions.width, dimensions.height, `${dish.image.path} must be square.`);
  assert.ok(dimensions.width >= 1024 && dimensions.height >= 1024, `${dish.image.path} must preserve native resolution of at least 1024x1024.`);
  const sha256 = createHash('sha256').update(imageBuffer).digest('hex');
  const hashes = uniqueFields.get('image SHA-256');
  assert.ok(!hashes.has(sha256), `${dish.image.path} duplicates another image byte-for-byte.`);
  hashes.add(sha256);
  manifestImages.push({
    id: dish.id,
    path: dish.image.path,
    mediaType: 'image/png',
    width: dimensions.width,
    height: dimensions.height,
    bytes: imageBuffer.length,
    sha256
  });
}

assert.equal(Object.keys(index.indexes.byId).length, index.total);
assert.equal(Object.keys(index.indexes.bySlug).length, index.total);
assert.equal(Object.values(index.indexes.byCategory).flat().length, index.total);

const indexedImageFilenames = manifestImages
  .map(image => path.basename(image.path))
  .sort((left, right) => left.localeCompare(right));
const bundledImageFilenames = (
  progress
    ? execFileSync(
        'git',
        ['ls-files', '--cached', '-z', '--', 'dim-sum/images/*.png'],
        { cwd: repositoryRoot }
      )
        .toString('utf8')
        .split('\0')
        .filter(Boolean)
        .map(filename => path.basename(filename))
    : (await readdir(path.join(catalogRoot, 'images'))).filter(filename => filename.endsWith('.png'))
).sort((left, right) => left.localeCompare(right));
assert.deepEqual(
  bundledImageFilenames,
  indexedImageFilenames,
  progress
    ? 'The staged dim-sum PNG set must contain exactly one indexed image per progress record.'
    : 'dim-sum/images must contain exactly one indexed PNG per catalog record, with no missing or unreferenced PNG files.'
);

const manifest = {
  schemaVersion: '1.0.0',
  algorithm: 'sha256',
  total: manifestImages.length,
  images: manifestImages
};
const manifestPath = path.join(catalogRoot, 'image-manifest.json');
if (writeManifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} else {
  const checkedInManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepEqual(
    checkedInManifest,
    manifest,
    'dim-sum/image-manifest.json is stale; rerun the verifier with --write-manifest.'
  );
}

console.log(`${index.total}/${index.total} ${progress ? 'in-progress' : 'complete'} catalog records and distinct native PNG images verified${writeManifest ? '; manifest written' : ''}.`);
