import { readFileSync } from 'fs';

const buf = readFileSync(
  '/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay'
);

let offset = 0;
const magic = buf.readUInt32LE(offset); offset += 4;
console.log('Magic:', magic.toString(16), magic === 0x1ca2e27f ? '✅' : '❌');

const fileVersion = buf.readUInt32LE(offset); offset += 4;
const lengthMs = buf.readUInt32LE(offset); offset += 4;
const networkVersion = buf.readUInt32LE(offset); offset += 4;
const changelist = buf.readUInt32LE(offset); offset += 4;

const bIsLive = buf[offset++];
const bCompressed = buf[offset++];
const bEncrypted = buf[offset++];
const encKey = buf.slice(offset, offset + 32); offset += 32;
console.log('bEncrypted:', bEncrypted, 'Key:', encKey.toString('hex').slice(0, 16) + '...');

console.log('\nScanning for events from offset', offset, '...');

const events = [];
let off = 764;
const typeCounts = {1:0, 2:0, 3:0, 4:0};
while(off < buf.length - 8) {
    const t = buf.readUInt32LE(off);
    const s = buf.readUInt32LE(off+4);
    if (s > 0 && s < 50000000 && off + 8 + s <= buf.length) {
        typeCounts[t]++;
        if (t === 3) {
            console.log(`Chunk type 3 at ${off}, size ${s}`);
            events.push(buf.slice(off+8, off+8+s));
        }
        off += 8 + s;
    } else {
        off++;
    }
}
console.log('Type counts:', typeCounts);

console.log(`Found ${events.length} event chunks.`);

const readStr = (p, ctx) => {
    const l = p.readInt32LE(ctx.o); ctx.o += 4; if (l === 0) return '';
    const a = Math.abs(l), s = (l < 0) ? p.slice(ctx.o, ctx.o + a * 2).toString('utf16le') : p.slice(ctx.o, ctx.o + a).toString('utf8');
    ctx.o += (l < 0 ? a * 2 : a); if (ctx.o < p.length && p[ctx.o] === 0) ctx.o++; return s.replace(/\0/g, '');
};

for (const p of events) {
    const ctx = {o: 0};
    try {
        console.log(`--- Event Chunk Header Hex (first 128 bytes) ---`);
        console.log(p.slice(0, 128).toString('hex'));
        
        const l1 = p.readInt32LE(0);
        const l1be = p.readInt32BE(0);
        console.log(`String 1 length LE: ${l1}, BE: ${l1be}`);

        const id = readStr(p, ctx);
        const gr = readStr(p, ctx);
        const meta = readStr(p, ctx);
        
        console.log(`id="${id}" gr="${gr}" meta="${meta}"`);
        
        const t1 = p.readUInt32LE(ctx.o); 
        const t1be = p.readUInt32BE(ctx.o);
        console.log(`t1 LE: ${t1}, BE: ${t1be}`);
        ctx.o += 4;
        
        const t2 = p.readUInt32LE(ctx.o);
        const t2be = p.readUInt32BE(ctx.o);
        console.log(`t2 LE: ${t2}, BE: ${t2be}`);
        ctx.o += 4;
        
        const paySz = p.readUInt32LE(ctx.o);
        const paySzbe = p.readUInt32BE(ctx.o);
        console.log(`paySz LE: ${paySz}, BE: ${paySzbe}`);
        ctx.o += 4;
    } catch(e) {
        console.log("Error", e.message);
    }
}
