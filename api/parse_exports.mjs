import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');

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
  readUInt32() { return this.readBits(32); }
  readFString() {
    const len = this.readBits(32);
    if (len === 0) return '';
    const abs = Math.abs(len);
    if (abs > 1024) return null;
    const isUtf16 = len < 0;
    let s = '';
    const charCount = abs;
    for (let i = 0; i < charCount; i++) {
        // Fortnite replay strings are 8-bit encoded, even if they aren't fully byte-aligned.
      const code = isUtf16 ? this.readBits(16) : this.readBits(8);
      if (code === 0) { if (!isUtf16) this.pos += (charCount - i - 1) * 8; break; }
      s += String.fromCharCode(code & 0x7F);
    }
    return s;
  }
}

// We know that at byte 34949 (bit 279592) the string length prefix is at 34945 (bit 279560).
// Let's decode from exactly 279560 using BitReader.
console.log('--- At 279560 ---');
let br = new BitReader(raw, 34945 * 8);

const groupString = br.readFString();
console.log('Group:', groupString); // /Script/FortniteGame.FortPlayerStateAthena

// Now we are at the end of the group string.
// Let's print the next 100 bits
let bits = '';
const savePos = br.pos;
for (let i =0; i < 100; i++) bits += br.readBit() + '';
console.log('Next 100 bits:', bits);
br.pos = savePos;

// What should follow is numExports?
// Let's read 32 bits
const maybeNumExports = br.readUInt32();
console.log('Maybe Num Exports:', maybeNumExports);

// Let's see if there is an FString for 'Owner'
// We know 'Owner' length (=6) starts at 35012 * 8 = 280096.
// Current pos is 279592 + 43*8 = 279936. (plus 32 bits = 279968).
// Diff between 279968 and 280096 is 128 bits = 16 bytes!
console.log('Pos before loop:', br.pos);
console.log('Bits to next string:', 280096 - br.pos);

