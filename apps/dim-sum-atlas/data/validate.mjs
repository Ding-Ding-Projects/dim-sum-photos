import { loadPreparedCatalog } from './index.mjs';

const prepared = await loadPreparedCatalog();
const errors = [];
const ids = new Set();

for (const dish of prepared.dishes) {
  if (ids.has(dish.id)) errors.push(`duplicate id: ${dish.id}`);
  ids.add(dish.id);
  if (!dish.fiction?.fictional) errors.push(`${dish.id}: fiction marker missing`);
  if (!dish.fiction?.origin?.startsWith('This is an invented origin')) errors.push(`${dish.id}: origin is not marked`);
  if (!dish.fiction?.description?.startsWith('Fictional description:')) errors.push(`${dish.id}: description is not marked`);
  if (dish.fiction?.facts?.length !== 3 || dish.fiction.facts.some((fact) => !fact.startsWith('Fictional'))) {
    errors.push(`${dish.id}: facts are missing fictional markers`);
  }
}

if (prepared.sourceTotal !== prepared.dishes.length) errors.push('sourceTotal does not match prepared dish count');
const repeat = await loadPreparedCatalog();
if (JSON.stringify(prepared) !== JSON.stringify(repeat)) errors.push('preparation is not deterministic');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${prepared.dishes.length} dishes with deterministic fictional lore.`);
}
