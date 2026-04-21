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
for (let i = idx + 1; i < idx + 200; i++) {
    const cur = strings[i];
    
    // Stop if we hit another class definition like /Script/
    if (cur.str.startsWith('/Script/') && i > idx) break;
    
    console.log(cur.str);
}
