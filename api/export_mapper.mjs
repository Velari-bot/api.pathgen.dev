import { readFileSync, writeFileSync } from 'fs';

const buf = readFileSync('all_raw_decompressed.bin');

class BitReader {
    constructor(buffer, byteOffset) {
        this.buf = buffer;
        this.p = byteOffset * 8;
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
        const len = this.rI32();
        if (len === 0) return '';
        const count = Math.abs(len);
        let s = '';
        for (let i = 0; i < count; i++) {
            const char = this.rBs(len < 0 ? 16 : 8);
            if (char !== 0) s += String.fromCharCode(char);
        }
        return s;
    }
    rI32() {
        const b = [this.rBs(8), this.rBs(8), this.rBs(8), this.rBs(8)];
        return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >> 0;
    }
}

const findGroups = () => {
    const exports = {};
    // Search for signatures
    const sig = Buffer.from('2b0000002f5363726970742f466f72746e69746547616d652e466f7274506c617965725374617465417468656e6100', 'hex');
    const pos = buf.indexOf(sig);
    if (pos > -1) {
        console.log(`Found signature at offset ${pos}`);
        // Back up to find group count or group info
        for (let base = pos - 10; base < pos; base++) {
           try {
               const br = new BitReader(buf, base);
               const name = br.rS();
               if (name === sig.slice(4, -1).toString()) {
                   console.log(`Successfully aligned at byte ${base}`);
                   const numProps = br.rP();
                   const props = {};
                   for (let i = 0; i < numProps && i < 500; i++) {
                        const h = br.rP();
                        const pn = br.rS();
                        props[pn] = h;
                   }
                   exports[name] = props;
               }
           } catch(e) {}
        }
    }
    return exports;
};

const map = findGroups();
console.log('Result:', JSON.stringify(map, null, 2));
writeFileSync('exports_mapped.json', JSON.stringify(map, null, 2));
