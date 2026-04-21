import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');

class BR {
    constructor(b, p=0){ this.b=b; this.p=p; }
    rB(){ const v=(this.b[this.p>>3]>>(this.p&7))&1; this.p++; return v; }
    rBs(n){ let v=0; for(let i=0; i<n; i++) v|=(this.rB()<<i); return v; }
    rP(){ let v=0,s=0; for(let i=0; i<5; i++){ const b=this.rBs(8); v|=(b&0x3F)<<s; s+=6; if(!(b&0x80)) break; } return v; }
}

const b1 = new BR(raw);
let success = 0;
while(b1.p < 30000) {
    b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
    if (sz > 0 && sz < 65536) {
        // we found a bunch.
        success++;
    }
    b1.p = e; if (sz === 0) b1.p += 1;
}
console.log('Bunches found using 0x3f mask logic? Wait, bunch loop doesn\'t use rP().');

// Let's test player channel detection with 0x3f vs 0x7f
function testHandles(mask, shift) {
    const b1 = new BR(raw);
    const channelValues = {};
    while(b1.p < 1000000*8) { // first 1MB
        b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
        if (sz > 16 && t === 1 && ch >= 2 && ch <= 6000) {
            const startP = b1.p;
            for(let i=0; i<4; i++) {
                try {
                    b1.p = startP + i;
                    let v=0,s=0; 
                    for(let j=0; j<5; j++){ const b=b1.rBs(8); v|=(b&mask)<<s; s+=shift; if(!(b&0x80)) break; }
                    const h = v;
                    if (h === 125 || h === 54 || h === 16 || h === 114) {
                        channelValues[h] = (channelValues[h]||0)+1;
                    }
                } catch(x){}
            }
        }
        b1.p = e; if (sz === 0) b1.p += 1;
    }
    console.log(`Mask ${mask.toString(16)} Shift ${shift} -> found:`, channelValues);
}

testHandles(0x3F, 6);
testHandles(0x7F, 7);

