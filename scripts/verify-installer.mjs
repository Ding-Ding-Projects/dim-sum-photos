import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'); const dist=path.join(root,'apps','dim-sum-atlas','dist','squirrel-windows');
const files=fs.existsSync(dist)?fs.readdirSync(dist):[]; const setup=files.find(f=>/^Dim-Sum-Atlas-.*\.exe$/i.test(f)); const releases=files.find(f=>f==='RELEASES'); const nupkg=files.find(f=>/\.nupkg$/i.test(f));
if(!setup||!releases||!nupkg) throw new Error(`Squirrel output incomplete: setup=${Boolean(setup)} RELEASES=${Boolean(releases)} nupkg=${Boolean(nupkg)}`);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,f))).digest('hex');
const releaseText=fs.readFileSync(path.join(dist,releases),'utf8'); if(!releaseText.includes(nupkg)) throw new Error('RELEASES does not reference the full nupkg.');
const signatureArg=process.argv.find(a=>a.startsWith('--signature-status=')); const signature=signatureArg?.split('=')[1] ?? (process.argv.includes('--signature-status') ? process.argv[process.argv.indexOf('--signature-status')+1] : undefined); if(!signature) throw new Error('Independent Authenticode status is required.'); if(signature!=='NotSigned') throw new Error(`Unexpected signature status: ${signature}`);
const result={dist,setup:{file:setup,sha256:hash(setup),bytes:fs.statSync(path.join(dist,setup)).size},RELEASES:{file:releases,sha256:hash(releases),references:nupkg},nupkg:{file:nupkg,sha256:hash(nupkg)},signatureStatus:signature,verifiedAt:new Date().toISOString()};
fs.writeFileSync(path.join(dist,'installer-manifest.json'),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result,null,2));
