import { readFileSync } from 'fs';
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

const fpa = strings.find(s => s.str === '/Script/FortniteGame.FortPlayerStateAthena');
const idx = strings.indexOf(fpa);

console.log('--- FortPlayerStateAthena Properties ---');
for (let i = idx + 1; i < idx + 100; i++) {
    const cur = strings[i];
    const next = strings[i+1];
    const gapLen = next.offset - cur.end;
    if (gapLen >= 3 && gapLen <= 30) {
        let handle = 0;
        if (gapLen >= 6) {
            const gapBytes = raw.slice(cur.end, next.offset);
            const hb = gapBytes[gapLen - 6];
            handle = hb;
            if (hb >= 0x80) { handle = (hb & 0x7F) | (gapBytes[gapLen - 5] << 7); }
        }
        console.log(`Handle ${handle.toString().padStart(3)}: ${cur.str}`);
    } else {
        // Exceeded group!
        console.log('STOPPING AT:', cur.str);
        break;
    }
}
