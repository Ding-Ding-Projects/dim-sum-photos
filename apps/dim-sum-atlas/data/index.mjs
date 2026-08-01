import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(HERE, '../../../catalog/index.json');

const ORIGIN_PLACES = [
  'a tea-house kitchen near Sheung Wan',
  'a morning market stall in Kowloon City',
  'a family banquet room in Yau Ma Tei',
  'a ferry-side kitchen on Hong Kong Island',
  'a rainy-day dining room in Sai Ying Pun',
  'a bamboo-steamer workshop in Sham Shui Po'
];

const ORIGIN_MOMENTS = [
  'during the first kettle of the day',
  'after a playful argument about the ideal fold',
  'while a cook tested a new steamer rhythm',
  'on a night when the harbour fog arrived early',
  'between two rounds of tea service',
  'when a hungry apprentice refused to waste a good filling'
];

const FACTS = [
  'Its fictional serving rule is to arrive with the most confident piece facing the tea pot.',
  'Its fictional kitchen nickname is “the little table diplomat”.',
  'In this imaginary tradition, the first bite is reserved for checking the balance of texture.',
  'Its fictional steamer etiquette says that the lid should be lifted only after the aroma votes yes.',
  'A made-up tea-house ledger claims it pairs best with an unhurried conversation.',
  'Its invented signature is the tiny pause diners take before reaching for a second one.'
];

function hash(input) {
  let value = 2166136261;
  for (const character of input) {
    value ^= character.codePointAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function choose(values, seed, offset = 0) {
  return values[(seed + offset) % values.length];
}

function fictionalLore(dish) {
  const seed = hash(dish.id);
  const name = dish.name?.en ?? dish.id;
  const place = choose(ORIGIN_PLACES, seed);
  const moment = choose(ORIGIN_MOMENTS, seed, 1);
  const fact = choose(FACTS, seed, 2);

  return {
    fictional: true,
    label: 'Fictional catalog lore',
    origin: `This is an invented origin for ${name}: it is said to have begun in ${place} ${moment}.`,
    description: `Fictional description: ${name} turns the catalog ingredients into a small story of steam, timing, and shared tea-table curiosity. This wording is imaginative and is not a historical or culinary claim.`,
    facts: [
      `Fictional fact: ${fact}`,
      `Fictional ingredient note: the catalog lists ${dish.ingredients?.join(', ') || 'its listed ingredients'} for this entry.`,
      'Fictional provenance note: this lore is generated deterministically from the catalog record id.'
    ]
  };
}

export function prepareDish(dish) {
  if (!dish?.id || !dish?.name?.en) throw new Error('Each dish needs an id and English name');
  return {
    id: dish.id,
    slug: dish.slug,
    name: dish.name,
    jyutping: dish.jyutping,
    category: dish.category,
    subcategory: dish.subcategory,
    description: dish.description,
    ingredients: [...(dish.ingredients ?? [])],
    dietaryTags: [...(dish.dietaryTags ?? [])],
    allergens: [...(dish.allergens ?? [])],
    image: dish.image,
    fiction: fictionalLore(dish)
  };
}

export function prepareCatalog(catalog) {
  if (!Array.isArray(catalog?.dishes)) throw new Error('Catalog must contain a dishes array');
  return {
    schemaVersion: '1.0.0',
    sourceSchemaVersion: catalog.schemaVersion,
    sourceCatalogStatus: catalog.catalogStatus,
    sourceTotal: catalog.dishes.length,
    fictionNotice: 'Origin, description, and facts in fiction are invented catalog lore, not historical claims.',
    dishes: catalog.dishes.map(prepareDish)
  };
}

export async function loadPreparedCatalog(catalogPath = CATALOG_PATH) {
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
  const additionsFiles = (await fs.readdir(path.dirname(catalogPath))).filter((file) => /^additions-.*\.json$/i.test(file)).sort();
  const ids = new Set(catalog.dishes.map((dish) => dish.id));
  for (const file of additionsFiles) {
    const additions = JSON.parse(await fs.readFile(path.resolve(path.dirname(catalogPath), file), 'utf8'));
    for (const dish of additions.dishes || []) {
      if (!ids.has(dish.id)) { catalog.dishes.push(dish); ids.add(dish.id); }
    }
  }
  return prepareCatalog(catalog);
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}`) {
  const prepared = await loadPreparedCatalog();
  process.stdout.write(JSON.stringify(prepared, null, 2));
}
