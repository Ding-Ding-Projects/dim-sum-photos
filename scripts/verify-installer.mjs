import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'); const dist=path.join(root,'apps','dim-sum-atlas','dist','squirrel-windows');
const files=fs.existsSync(dist)?fs.readdirSync(dist):[]; const setup=files.find(f=>/^Dim-Sum-Atlas-.*\.exe$/i.test(f)); const releases=files.find(f=>f==='RELEASES'); const nupkg=files.find(f=>/\.nupkg$/i.test(f));
if(!setup||!releases||!nupkg) throw new Error(`Squirrel output incomplete: setup=${Boolean(setup)} RELEASES=${Boolean(releases)} nupkg=${Boolean(nupkg)}`);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,f))).digest('hex');
const result={dist,setup:{file:setup,sha256:hash(setup),bytes:fs.statSync(path.join(dist,setup)).size},RELEASES:{sha256:hash(releases)},nupkg:{file:nupkg,sha256:hash(nupkg)},unsigned:true,verifiedAt:new Date().toISOString()};
fs.writeFileSync(path.join(dist,'installer-manifest.json'),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result,null,2));
