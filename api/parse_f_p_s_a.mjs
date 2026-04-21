import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');

const strings = [];
for (let i = 0; i < 1000000; i++) {
  const len = raw.readInt32LE(i);
  if (len > 3 && len < 64) {
    let str = '';
    let ok = true;
    for (let j = 0; j < len - 1; j++) {
      const c = raw[i + 4 + j];
      if (c < 32 || c > 126) { ok = false; break; }
      str += String.fromCharCode(c);
    }
    if (ok && raw[i + 4 + len - 1] === 0) {
      if (/^[A-Za-z0-9_\/.]+$/.test(str)) {
        strings.push({ offset: i, str, end: i + 4 + len });
      }
    }
  }
}

// Check the exact byte offsets from FortPlayerStateAthena
const fpa = strings.find(s => s.str === '/Script/FortniteGame.FortPlayerStateAthena');
const idx = strings.indexOf(fpa);

console.log('FortPlayerStateAthena is at', fpa.offset);

class BitReader {
    constructor(buf, bitPos = 0) { this.buf = buf; this.pos = bitPos; this.end = buf.length * 8; }
    readBit() { const v = (this.buf[this.pos >> 3] >> (this.pos & 7)) & 1; this.pos++; return v; }
    readBits(n) { let v = 0; for (let i = 0; i < n; i++) v |= this.readBit() << i; return v; }
    readIntPacked() {
        let v = 0, shift = 0;
        for (let i = 0; i < 5; i++) {
            const b = this.readBits(8);
            v |= (b & 0x3F) << shift;
            shift += 6;
            if (!(b & 0x80)) break;
        }
        return v;
    }
}

for (let i = idx + 1; i < idx + 20; i++) {
    const cur = strings[i];
    const next = strings[i+1];
    
    // Gap ends at next.offset.
    const gapLen = next.offset - cur.end;
    if (gapLen >= 3 && gapLen <= 30) {
        // Look backwards from the end of the gap
        // Try reading IntPacked at the end of the gap
        const gapBytes = raw.slice(cur.end, next.offset);
        
        // UE handles are often serialized as IntPacked.
        // Let's decode it backwards or just read from the end
        // Wait, for PlayerNamePrivate, handle is 102 (expected).
        // If handle is 102 (0x66), in UE4 IntPacked it is:
        // 0x66 & 0x3F = 0x26. 0x66 >> 6 = 1.
        // Wait, 102 doesn't have 0x80 (more bit) in UE4! Wait, UE4 is 6 bits data.
        // 102 requires 7 bits. So it takes 2 bytes.
        // Byte 1: 0x26 | 0x80 = 0xA6.
        // Byte 2: 0x01.
        // Are bytes 0xA6 0x01 at the end of the gap for PlayerNamePrivate?
        if (cur.str === 'PlayerNamePrivate') {
            console.log('PlayerNamePrivate GAP:', gapBytes.toString('hex'));
        }
    }
}
