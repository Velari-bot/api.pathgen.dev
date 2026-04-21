import fs from 'fs';
import crypto from 'crypto';
import * as ooz from 'ooz-wasm';

const buf = fs.readFileSync('UnsavedReplay-2026.04.18-16.23.55.replay');
const magic = buf.readUInt32LE(0);
let cur = 12 + buf.readInt32LE(8) * 20 + 4 + 8;
let posKey = null;
for (let i = 400; i < 1500; i++) {
  if (buf.readUInt32LE(i) === 32) {
    const cand = buf.slice(i+4, i+36);
    if (buf.readUInt32LE(i+36) < 10 && buf.readUInt32LE(i + 40) > 0) { posKey = cand; break; }
  }
}

let off = 764;
const chunkData = [];
while (off < buf.length - 8) {
  const t = buf.readUInt32LE(off), s = buf.readUInt32LE(off+4);
  if (s > 0 && s < 30000000 && off + 8 + s <= buf.length) {
    const p = buf.slice(off + 8, off + 8 + s);
    if (t === 1) chunkData.push({ p });
    off += 8 + s;
  } else { off++; }
}

const decrypt = (data, key) => {
  if (!key || data.length < 16) return data;
  const output = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 16) {
    const block = data.slice(i, i + 16);
    if (block.length < 16) { block.copy(output, i); break; }
    try {
      const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
      decipher.setAutoPadding(false);
      Buffer.concat([decipher.update(block), decipher.final()]).copy(output, i);
    } catch (x) { block.copy(output, i); }
  }
  return output;
};

const decomp = [];
for (const c of chunkData) {
  try {
    const d = decrypt(c.p.slice(16), posKey);
    const iD = d.readUInt32LE(0), iC = d.readUInt32LE(4);
    const r = ooz.decompressUnsafe(d.slice(8, 8 + iC), iD);
    if (r) decomp.push(Buffer.from(r));
  } catch(x) {}
}
const allRaw = Buffer.concat(decomp);

class BR {
    constructor(b){ this.b=b; this.p=0; }
    rB(){ const v=(this.b[this.p>>3]>>(this.p&7))&1; this.p++; return v; }
    rBs(n){ let v=0; for(let i=0; i<n; i++) if(this.rB()) v|=(1<<i); return v; }
    rP(){ let v=0,s=0; for(let i=0; i<5; i++){ const b=this.rBs(8); v|=(b&0x3F)<<s; s+=6; if(!(b&0x80)) break; } return v; }
}

const allChStats = {};
const b1 = new BR(allRaw);
while(b1.p < allRaw.length*8 - 128) {
   b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
   const bytePos = b1.p >> 3;
   
   if (sz > 16 && t === 1 && ch >= 2 && ch <= 6000) {
       if (!allChStats[ch]) allChStats[ch] = { p: {}, b11: {} };
       const bytes = allRaw.slice(bytePos, (e + 7) >> 3);
       
       for(let i=0; i<Math.min(sz-32, 200); i++) {
           try {
               const s = new BR(bytes); s.p = (b1.p & 7) + i;
               const h = s.rP();
               if (h > 0 && h < 200) {
                   const pBak = s.p;
                   const vP = s.rP();
                   if (vP >= 0 && vP < 100000) allChStats[ch].p[h] = Math.max(allChStats[ch].p[h]||0, vP);
                   
                   s.p = pBak; const v11 = s.rBs(11);
                   if (v11 >= 0 && v11 <= 2047) allChStats[ch].b11[h] = Math.max(allChStats[ch].b11[h]||0, v11);
               }
           } catch(x){}
       }
   }
   b1.p = e; if (sz === 0) b1.p += 1;
}

const targetValues = [242, 496, 207, 146, 210, 42, 31, 5, 13];
for (const [ch, d] of Object.entries(allChStats)) {
    const matched = [];
    for (const [h, v] of Object.entries(d.p)) if (targetValues.includes(v)) matched.push(`[packed  h:${h} = ${v}]`);
    for (const [h, v] of Object.entries(d.b11)) if (targetValues.includes(v)) matched.push(`[bits11  h:${h} = ${v}]`);
    
    if (matched.length > 0) {
        console.log(`CH ${ch} matched (${matched.length}): ${matched.join(', ')}`);
    }
}
