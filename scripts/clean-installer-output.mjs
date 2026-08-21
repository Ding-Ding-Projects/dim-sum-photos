import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'); const target=path.join(root,'apps','dim-sum-atlas','dist','squirrel-windows');
if (fs.existsSync(target)) fs.rmSync(target,{recursive:true,force:true});
fs.mkdirSync(target,{recursive:true}); console.log(`Cleaned exact generated output: ${target}`);
