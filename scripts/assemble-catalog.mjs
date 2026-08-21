import fs from 'node:fs';
import path from 'node:path';
import { assembleCatalog } from './catalog-assembly.mjs';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'apps', 'dim-sum-atlas', 'catalog.json');
const catalog = assembleCatalog(root);
fs.writeFileSync(output, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(`Assembled ${catalog.assembly.mergedCount} dishes into ${output}`);
