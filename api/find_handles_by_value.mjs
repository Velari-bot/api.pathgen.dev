import { readFileSync } from 'fs';
const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');

class BR {
    constructor(b){ this.b=b; this.p=0; }
    rB(){ const v=(this.b[this.p>>3]>>(this.p&7))&1; this.p++; return v; }
    rBs(n){ let v=0; for(let i=0; i<n; i++) v|=(this.rB()<<i); return v; }
    rP(){ let v=0,s=0; for(let i=0; i<5; i++){ const b=this.rBs(8); v|=(b&0x7F)<<s; s+=7; if(!(b&0x80)) break; } return v; }
}

const b1 = new BR(raw);
const channelValues = {};

while(b1.p < raw.length*8 - 128) {
    b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
    
    if (sz > 16 && t === 1 && ch >= 2 && ch <= 6000) {
        if (!channelValues[ch]) channelValues[ch] = {};
        for (let align = 0; align < 8; align++) {
            const temp = new BR(raw);
            temp.p = b1.p + align;
            try {
                for (let j = 0; j < 6; j++) {
                    const h = temp.rP();
                    if (h === 0) break;
                    if (h > 0 && h < 512) {
                        const val = temp.rP();
                        if (val > 0 && val < 500000) {
                            if (!channelValues[ch][h]) channelValues[ch][h] = new Set();
                            channelValues[ch][h].add(val);
                        }
                    }
                }
            } catch(x) {}
        }
    }
    b1.p = e; if (sz === 0) b1.p += 1;
}

const targets = {
    kills: 2,
    damage_dealt: 379,
    damage_taken: 358,
    shots_fired: 98,
    health_healed: 39,
    shield_healed: 227,
    storm_damage: 11,
    builds_placed: 98
};

for (const [ch, handles] of Object.entries(channelValues)) {
    let matchCount = 0;
    const matched = {};
    for (const [name, target] of Object.entries(targets)) {
        for (const [h, vals] of Object.entries(handles)) {
            if (vals.has(target)) {
                matched[name] = h;
                matchCount++;
                break;
            }
        }
    }
    
    if (matchCount >= 3) {
        console.log(`Channel ${ch} | Matches: ${matchCount}`);
        console.log('Hits:', matched);
    }
}
