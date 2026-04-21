import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');

class BR {
    constructor(b, p=0){ this.b=b; this.p=p; }
    rB(){ const v=(this.b[this.p>>3]>>(this.p&7))&1; this.p++; return v; }
    rBs(n){ let v=0; for(let i=0; i<n; i++) v|=(this.rB()<<i); return v; }
    rP(){ let v=0,s=0; for(let i=0; i<5; i++){ const b=this.rBs(8); v|=(b&0x3F)<<s; s+=6; if(!(b&0x80)) break; } return v; }
    readFStringObs() {
        const len = this.rBs(32);
        if (len === 0 || Math.abs(len) > 256) return null;
        let isUtf16 = len < 0;
        let s = '';
        for (let i = 0; i < Math.abs(len); i++) {
            let code = isUtf16 ? this.rBs(16) : this.rBs(8);
            if (code === 0) break;
            const shift = (3 + i * 3) % 8;
            // wait, prompt says: result_char = obfuscated_char XOR shifted_char.
            // But what is shifted_char? (obfuscated_char >> shift) maybe? Or is it (shift)?
            // "result_char = obfuscated_char XOR shifted_char" -> Maybe it's not XOR shifted? 
            s += String.fromCharCode(code); // just to see
        }
        return s;
    }
}

const b1 = new BR(raw);
let targetChannel = -1;

while(b1.p < raw.length*8 - 128) {
    b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
    if (sz > 16 && t === 1 && ch >= 2 && ch <= 6000) {
        let text = raw.slice(b1.p >> 3, (e+7)>>3).toString('latin1');
        if (text.includes('black')) {
            console.log('Channel', ch, 'contains raw "black"!');
        }
    }
    b1.p = e; if (sz === 0) b1.p += 1;
}

