import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('catalog');
const files = fs.readdirSync(root).filter((file) => /^additions-.*\.json$/i.test(file)).sort();
const ids = new Set();
let total = 0;
for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  if (!Array.isArray(payload.dishes)) throw new Error(`${file}: dishes must be an array`);
  for (const dish of payload.dishes) {
    if (!dish.id || ids.has(dish.id)) throw new Error(`${file}: duplicate or missing id ${dish.id || '<missing>'}`);
    if (!dish.name?.en || !dish.name?.zhHant) throw new Error(`${file}: ${dish.id} is missing bilingual names`);
    if (!dish.description?.en || !dish.description?.yue) throw new Error(`${file}: ${dish.id} is missing descriptions`);
    if (!dish.image?.path || !dish.image?.alt?.en) throw new Error(`${file}: ${dish.id} is missing image metadata`);
    ids.add(dish.id);
    total += 1;
  }
}
console.log(`Validated ${total} addition records across ${files.length} files.`);
