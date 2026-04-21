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

const search = "blackgirlslikeme";
const utf16 = Buffer.from(search, 'utf16le');
const ascii = Buffer.from(search, 'utf8');

console.log("Searching for:", search);
let found = 0;
for (let i = 0; i < allRaw.length - 30; i++) {
    if (allRaw.slice(i, i + ascii.length).equals(ascii)) {
        console.log(`ASCII Match at ${i}`);
        found++;
    }
    if (allRaw.slice(i, i + utf16.length).equals(utf16)) {
        console.log(`UTF-16 Match at ${i}`);
        found++;
    }
}
if (found === 0) console.log("NO MATCHES FOUND IN ENTIRE BUFFER");
