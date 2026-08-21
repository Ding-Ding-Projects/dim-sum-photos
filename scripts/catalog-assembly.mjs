import fs from 'node:fs';
import path from 'node:path';

export function assembleCatalog(root) {
  const catalogDir = path.join(root, 'catalog');
  const base = JSON.parse(fs.readFileSync(path.join(catalogDir, 'index.json'), 'utf8'));
  const dishes = [];
  const seen = new Set();
  const add = dish => { if (dish?.id && !seen.has(dish.id)) { seen.add(dish.id); dishes.push(dish); } };
  for (const dish of base.dishes ?? []) add(dish);
  const files = fs.readdirSync(catalogDir).filter(file => /^additions-.*\.json$/i.test(file)).sort((a, b) => a.localeCompare(b));
  for (const file of files) for (const dish of JSON.parse(fs.readFileSync(path.join(catalogDir, file), 'utf8')).dishes ?? []) add(dish);
  return { ...base, dishes, assembly: { baseCount: (base.dishes ?? []).length, additionFiles: files, mergedCount: dishes.length } };
}

if (import.meta.url === `file://${process.argv[1].replaceAll('\\', '/')}`) {
  const root = path.resolve(import.meta.dirname, '..');
  const output = path.join(root, 'apps', 'dim-sum-atlas', 'catalog.json');
  const catalog = assembleCatalog(root);
  fs.writeFileSync(output, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`Assembled ${catalog.assembly.mergedCount} dishes into ${output}`);
}
