import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');

class BitReader {
    constructor(buf, bitPos = 0) { this.buf = buf; this.pos = bitPos; this.end = buf.length * 8; }
    readBit() { const v = (this.buf[this.pos >> 3] >> (this.pos & 7)) & 1; this.pos++; return v; }
    readBits(n) { let v = 0; for (let i = 0; i < n; i++) v |= (this.readBit() << i); return v; }
    readIntPacked() {
        let v = 0, shift = 0;
        for (let i = 0; i < 5; i++) {
            const b = this.readBits(8);
            v |= (b & 0x7F) << shift; // 7-bit LEB128 for structure!
            shift += 7;
            if (!(b & 0x80)) break;
        }
        return v;
    }
    readUInt32() { return this.readBits(32); }
    readFString() {
        const len = this.readBits(32);
        const signedLen = len | 0;
        if (signedLen === 0) return '';
        const abs = Math.abs(signedLen);
        if (abs > 1024) return null;
        let isUtf16 = signedLen < 0;
        let s = '';
        for (let i = 0; i < abs; i++) {
            const code = isUtf16 ? this.readBits(16) : this.readBits(8);
            if (code === 0) break;
            s += String.fromCharCode(code & 0x7F);
        }
        return s;
    }
}

// Bit 279560 is where we saw the 32-bit length for "Script/FortniteGame.FortPlayerStateAthena"
let br = new BitReader(raw, 279560);
const groupName = br.readFString();
console.log('Group:', groupName);

const numExports = br.readIntPacked();
console.log('NumExports:', numExports);

const map = {};
for (let e = 0; e < numExports; e++) {
    const isExported = br.readBit() === 1;
    if (isExported) {
        const handle = br.readIntPacked();
        const checksum = br.readUInt32();
        const name = br.readFString();
        const type = br.readFString();
        console.log(`Handle ${handle.toString().padStart(3)}: Name=${name} Type=${type}`);
        map[name] = handle;
    } else {
        console.log('Got bIsExported = false!');
    }
}
