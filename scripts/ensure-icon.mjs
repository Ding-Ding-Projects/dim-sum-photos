import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'apps', 'dim-sum-atlas', 'build');
fs.mkdirSync(out, { recursive: true });
const crcTable = Array.from({length:256}, (_,n) => { let c=n; for(let k=0;k<8;k++) c=(c&1)?0xedb88320^(c>>>1):c>>>1; return c>>>0; });
const crc = b => { let c=0xffffffff; for(const x of b)c=crcTable[(c^x)&255]^(c>>>8); return (c^0xffffffff)>>>0; };
const chunk = (type, data) => { const t=Buffer.from(type); const h=Buffer.alloc(4); h.writeUInt32BE(data.length); const c=Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t,data]))); return Buffer.concat([h,t,data,c]); };
function png(size){ const rows=[]; for(let y=0;y<size;y++){const row=Buffer.alloc(1+size*4); for(let x=0;x<size;x++){const i=1+x*4; const bg=(x<8||y<8||x>size-9||y>size-9); row[i]=bg?15:254; row[i+1]=bg?118:243; row[i+2]=bg?110:199; row[i+3]=255;} rows.push(row);} const raw=Buffer.concat(rows); return Buffer.concat([Buffer.from('\x89PNG\r\n\x1a\n','binary'),chunk('IHDR',Buffer.from([0,0,0,size,0,0,0,size,8,6,0,0,0])),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]); }
const sizes=[16,24,32,48,64,128,256]; const images=sizes.map(size=>png(size)); const header=Buffer.alloc(6); header.writeUInt16LE(0); header.writeUInt16LE(1,2); header.writeUInt16LE(images.length,4); let offset=6+16*images.length; const entries=[]; for(let i=0;i<sizes.length;i++){const e=Buffer.alloc(16);e[0]=sizes[i]===256?0:sizes[i];e[1]=e[0];e[2]=0;e[3]=0;e.writeUInt16LE(1,4);e.writeUInt16LE(32,6);e.writeUInt32LE(images[i].length,8);e.writeUInt32LE(offset,12);entries.push(e);offset+=images[i].length;} fs.writeFileSync(path.join(out,'icon.ico'),Buffer.concat([header,...entries,...images])); fs.writeFileSync(path.join(out,'icon-manifest.json'),JSON.stringify({source:'icon.svg',sizes},null,2)+'\n'); console.log(`Generated ${sizes.length}-resolution icon.ico`);
