import { readFileSync } from 'fs';

const raw = readFileSync(
  '/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin'
);

// BitReader — UE5 little-endian bit stream
class BitReader {
  constructor(buf) { this.buf = buf; this.pos = 0; }
  readBit() {
    const b = (this.buf[this.pos >> 3] >> (this.pos & 7)) & 1;
    this.pos++;
    return b;
  }
  readBits(n) {
    let v = 0;
    for (let i = 0; i < n; i++) v |= this.readBit() << i;
    return v;
  }
  readIntPacked() {
    let v = 0, shift = 0;
    for (;;) {
      const b = this.readBits(8);
      v |= (b & 0x3F) << shift;
      shift += 6;
      if (!(b & 0x80)) break;
    }
    return v;
  }
  readUInt32() { return this.readBits(32); }
  readFString() {
    const len = this.readBits(32);
    if (len === 0 || Math.abs(len) > 512) return '';
    const isUtf16 = len < 0;
    const byteLen = isUtf16 ? -len * 2 : len;
    let s = '';
    for (let i = 0; i < (isUtf16 ? -len : len); i++) {
      const code = isUtf16 ? this.readBits(16) : this.readBits(8);
      if (code === 0) { if (!isUtf16) this.pos += (len - i - 2) * 8; break; }
      s += String.fromCharCode(code);
    }
    return s;
  }
  get bitsLeft() { return this.buf.length * 8 - this.pos; }
}

const br = new BitReader(raw);
const exportMap = {};
let found = 0;

// Scan for NetFieldExport groups at the start of chunk 0
// The export table is the first thing written — each group has:
// NumExports (uint32) then NumExports entries of:
//   group (FString) + name (FString) + type (FString) + handle (uint32)

// Try reading the export table directly from byte 0
try {
  const numGroups = br.readUInt32();
  console.log('numGroups:', numGroups);

  if (numGroups > 0 && numGroups < 10000) {
    for (let g = 0; g < numGroups; g++) {
      const groupName = br.readFString();
      const numExports = br.readUInt32();

      for (let e = 0; e < numExports && e < 500; e++) {
        const propName = br.readFString();
        const handle   = br.readUInt32();
        if (propName && handle < 65536) {
          exportMap[handle] = { group: groupName, name: propName };
          found++;
        }
      }
    }
  }
} catch(e) {
  console.log('Direct parse failed:', e.message, '— trying offset scan');
}

console.log(`\nFound ${found} handle mappings`);

// Print all handles — sorted by handle number
const sorted = Object.entries(exportMap)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

console.log('\nFull handle map:');
sorted.forEach(([h, e]) => {
  console.log(`  Handle ${String(h).padStart(4)} → ${e.group}.${e.name}`);
});

// Search for specific properties we care about
const targets = [
  'Kill','Damage','Shot','Hit','Head','Wood','Stone','Metal',
  'Build','Edit','Health','Shield','Storm','Fall','Revive',
  'Distance','Travel','Time','Team','Partner','Weapon','Accuracy'
];

console.log('\nTarget property search:');
sorted.forEach(([h, e]) => {
  if (targets.some(t =>
    e.name?.toLowerCase().includes(t.toLowerCase()) ||
    e.group?.toLowerCase().includes(t.toLowerCase())
  )) {
    console.log(`  ✓ Handle ${String(h).padStart(4)} → ${e.group}.${e.name}`);
  }
});
