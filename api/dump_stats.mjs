import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const buf = readFileSync('/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay');

let posKey = null;
for (let i = 400; i < 1500; i++) {
  if (buf.readUInt32LE(i) === 32) {
    const cand = buf.slice(i+4, i+36);
    if (buf.readUInt32LE(i+36) < 10 && buf.readUInt32LE(i + 40) > 0) { posKey = cand; break; }
  }
}

let off = 764;
const events = [];
let statsKey = null;
while (off < buf.length - 8) {
  const t = buf.readUInt32LE(off), s = buf.readUInt32LE(off+4);
  if (s > 0 && s < 30000000 && off + 8 + s <= buf.length) {
    const p = buf.slice(off + 8, off + 8 + s);
    if (t === 3) {
      events.push(p);
      if (!statsKey && p.toString('latin1').includes('PlayerStateEncryptionKey')) {
        const idx = p.indexOf(Buffer.from('PlayerStateEncryptionKey'));
        for (let i = idx + 24; i < p.length - 32; i++) {
          const cand = p.slice(i, i+32);
          if (cand.filter(b => b === 0).length < 8) { statsKey = cand; break; }
        }
      }
    }
    off += 8 + s;
  } else { off++; }
}
console.log('statsKey found?', !!statsKey);

const readStr = (p, ctx) => {
    const l = p.readInt32LE(ctx.o); ctx.o += 4; if (l === 0) return '';
    const a = Math.abs(l), s = (l < 0) ? p.slice(ctx.o, ctx.o + a * 2).toString('utf16le') : p.slice(ctx.o, ctx.o + a).toString('utf8');
    ctx.o += (l < 0 ? a * 2 : a); if (ctx.o < p.length && p[ctx.o] === 0) ctx.o++; return s.replace(/\0/g, '');
};

for (const p of events) {
    const ctx = { o: 0 };
    const id = readStr(p, ctx), gr = readStr(p, ctx);
    console.log('Event Group:', gr);
}
