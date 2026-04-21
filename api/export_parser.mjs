import { readFileSync, writeFileSync } from 'fs';

const buf = readFileSync('all_raw_decompressed.bin');

class BitReader {
    constructor(buffer) {
        this.buf = buffer;
        this.p = 0; // bit position
    }
    rB() {
        const val = (this.buf[this.p >> 3] >> (this.p & 7)) & 1;
        this.p++;
        return val;
    }
    rBs(n) {
        let val = 0;
        for (let i = 0; i < n; i++) if (this.rB()) val |= (1 << i);
        return val;
    }
    rP() {
        let v = 0;
        for (let i = 0; i < 5; i++) {
            const b = this.rBs(8);
            v |= (b & 0x7F) << (7 * i);
            if (!(b & 0x80)) break;
        }
        return v;
    }
    rS() {
        const len = this.readInt32();
        if (len === 0) return '';
        const isUtf16 = len < 0;
        const count = Math.abs(len);
        if (isUtf16) {
            let s = '';
            for (let i = 0; i < count; i++) {
                const charCode = this.rBs(16);
                if (charCode !== 0) s += String.fromCharCode(charCode);
            }
            return s;
        } else {
            let s = '';
            for (let i = 0; i < count; i++) {
                const charCode = this.rBs(8);
                if (charCode !== 0) s += String.fromCharCode(charCode);
            }
            return s;
        }
    }
    readInt32() {
        const b1 = this.rBs(8);
        const b2 = this.rBs(8);
        const b3 = this.rBs(8);
        const b4 = this.rBs(8);
        return (b1 | (b2 << 8) | (b3 << 16) | (b4 << 24)) >> 0;
    }
}

// In UE NetFieldExport, many properties are bit-packed.
// But the table itself starts with a count.
const br = new BitReader(buf);

console.log('Parsing Export Table...');

const exports = {};

// We can try to find the start of the export table by scanning for common paths.
// Actually, it's usually at the very beginning of chunk 0.
try {
    const numGroups = br.rP();
    console.log('Num Groups:', numGroups);
    if (numGroups > 0 && numGroups < 10000) {
        for (let i = 0; i < numGroups; i++) {
            const groupName = br.rS();
            const numProps = br.rP();
            exports[groupName] = {};
            // console.log(`Group: ${groupName} (${numProps} props)`);
            for (let j = 0; j < numProps; j++) {
                const handle = br.rP();
                const name = br.rS();
                exports[groupName][name] = handle;
            }
        }
    }
} catch (e) {
    console.log('Parse failed:', e.message);
}

const target = exports['/Script/FortniteGame.FortPlayerStateAthena'] || {};
console.log('FortPlayerStateAthena Properties:', JSON.stringify(target, null, 2));

const kills = target['Kills'];
const team = target['TeamIndex'];
console.log('Kills handle:', kills);
console.log('TeamIndex handle:', team);

writeFileSync('exports.json', JSON.stringify(exports, null, 2));
