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

const map = {};

for (let i = 0; i < strings.length - 1; i++) {
    const cur = strings[i];
    const next = strings[i+1];
    const gapLen = next.offset - cur.end;
    if (gapLen >= 5 && gapLen <= 30) {
        // usually padded with 00 00 00 00 type length (meaning no type label)
        // then 3 bytes group prefix, then LEB128 handle
        const gapBytes = raw.slice(cur.end, next.offset);
        
        // Find handle: it's the byte right after XX 00 01, or just assume the byte at gapLen - 6 is handle
        // We know for PlayerNamePrivate the gap ends with `36 34 c6 36 f0 00` -> 36 = 54
        // Checksum is 4 bytes `34 c6 36 f0`
        // 00 is trailing?
        // Let's read the Handle directly: 6 bytes from the end of the gap
        // Wait, for PlayerNamePrivate: `36` is at gapLen - 6.
        if (gapLen >= 6) {
            const handleByte = gapBytes[gapLen - 6];
            let handle = handleByte;
            // What if handle is 2 bytes LEB128?
            if (handleByte >= 0x80) {
                handle = (handleByte & 0x7F) | (gapBytes[gapLen - 5] << 7);
            }
            if (handle > 0 && handle < 2000) {
                map[cur.str] = handle;
            }
        }
    }
}

const interesting = ['kill', 'damage', 'health', 'shield', 'wood', 'stone', 'metal', 'build', 'edit', 'storm', 'shots', 'hit', 'headshot', 'distance', 'playernam', 'team'];

console.log('--- FOUND HANDLES ---');
const entries = Object.entries(map).sort((a,b) => a[1] - b[1]);
for (const [k, v] of entries) {
    if (interesting.some(t => k.toLowerCase().includes(t))) {
        console.log(`Handle ${String(v).padStart(4)} -> ${k}`);
    }
}

// Write mapping to JSON
writeFileSync('/Users/aidenbender/Desktop/pathgen.dev/api.pathgen.dev/api/real_handles.json', JSON.stringify(map, null, 2));
