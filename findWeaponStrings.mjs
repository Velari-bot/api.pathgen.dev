import fs from 'fs';
import crypto from 'crypto';
import * as ooz from 'ooz-wasm';

const buf = fs.readFileSync('UnsavedReplay-2026.04.18-16.23.55.replay');

let posKey = null;
for (let i = 400; i < 1500; i++) {
  if (buf.readUInt32LE(i) === 32 && buf.readUInt32LE(i+36) < 10) {
    posKey = buf.slice(i+4, i+36); break;
  }
}

const chunks = [];
let off = 764;
while (off < buf.length - 8) {
  const t = buf.readUInt32LE(off), s = buf.readUInt32LE(off+4);
  if (s > 0 && off + 8 + s <= buf.length) {
    if (t === 1) chunks.push({ p: buf.slice(off + 8, off + 8 + s) });
    off += 8 + s;
  } else { off++; }
}

const decomp = [];
for (const c of chunks) {
  if (!posKey || c.p.length < 16) continue;
  const d = Buffer.alloc(c.p.length - 16);
  for(let i=0; i<c.p.length-16; i+=16) {
      const block = c.p.slice(i+16, i+32);
      if(block.length < 16) { block.copy(d, i); break; }
      try{
          const decipher = crypto.createDecipheriv('aes-256-ecb', posKey, null);
          decipher.setAutoPadding(false);
          Buffer.concat([decipher.update(block), decipher.final()]).copy(d, i);
      }catch(e){ block.copy(d, i); }
  }
  const iD = d.readUInt32LE(0), iC = d.readUInt32LE(4);
  try{
      const r = ooz.decompressUnsafe(d.slice(8, 8 + iC), iD);
      if(r) decomp.push(Buffer.from(r));
  }catch(e){}
}
const allRaw = Buffer.concat(decomp);

class BR {
    constructor(b){ this.b=b; this.p=0; }
    rB(){ const v=(this.b[this.p>>3]>>(this.p&7))&1; this.p++; return v; }
    rBs(n){ let v=0; for(let i=0; i<n; i++) if(this.rB()) v|=(1<<i); return v; }
    rP(){ let v=0,s=0; for(let i=0; i<5; i++){ const b=this.rBs(8); v|=(b&0x7F)<<s; s+=7; if(!(b&0x80)) break; } return v; }
}

const allChStats = {};
const strings = {};

const b1 = new BR(allRaw);
while(b1.p < allRaw.length*8 - 128) {
    b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
    const bytePos = b1.p >> 3;
    
    if (sz > 16 && t === 1 && ch >= 2 && ch <= 60000) {
        if (!allChStats[ch]) allChStats[ch] = {};
        const bytes = allRaw.slice(bytePos, (e + 7) >> 3);
        
        // Search for strings!
        // Format of string in payload: length (Int32), followed by characters
        for (let j = 0; j < bytes.length - 8; j++) {
            const len = bytes.readInt32LE(j);
            if (len > 4 && len < 200) {
                const str = bytes.slice(j+4, j+4+len-1).toString('utf8');
                if (/^[A-Za-z0-9_]+$/.test(str) && (str.includes('Weapon') || str.includes('Assault') || str.includes('Shotgun') || str.includes('Item'))) {
                    if (!strings[ch]) strings[ch] = new Set();
                    strings[ch].add(str);
                }
            }
        }
        
        for(let i=0; i<Math.min(sz-32, 400); i++) {
            try {
                const s = new BR(bytes); s.p = (b1.p & 7) + i;
                const h = s.rP();
                if (h > 0 && h < 200) {
                    const v = s.rP();
                    if (v >= 0 && v <= 20000) allChStats[ch][h] = Math.max(allChStats[ch][h]||0, v);
                }
            } catch(x){}
        }
    }
    b1.p = e; if (sz === 0) b1.p += 1;
}

for (const [ch, props] of Object.entries(allChStats)) {
    const sList = strings[ch] ? Array.from(strings[ch]).join(", ") : "";
    if (sList.length > 0) {
        const pObj = JSON.stringify(props);
        console.log(`CH ${ch} [${sList}]: ${pObj.substring(0, 150)}`);
    }
}
