import fs from 'fs';
import crypto from 'crypto';
import * as ooz from 'ooz-wasm';

async function getStats(path) {
    const buf = fs.readFileSync(path);
    let posKey = null;
    for (let i = 400; i < 1500; i++) {
        if (buf.readUInt32LE(i) === 32 && buf.readUInt32LE(i+36) < 10) {
            posKey = buf.slice(i+4, i+36); break;
        }
    }
    const chunks = [];
    let off = 764;
    while (off < buf.length - 8) {
        const t = buf.readUInt32LE(off), s = buf.readUInt32LE(off+4);
        if (s > 0 && off + 8 + s <= buf.length) {
            if (t === 1) chunks.push({ p: buf.slice(off + 8, off + 8 + s) });
            off += 8 + s;
        } else { off++; }
    }
    const decomp = [];
    for (const c of chunks) {
        const d = Buffer.alloc(c.p.length - 16);
        for(let i=0; i<c.p.length-16; i+=16) {
            const block = c.p.slice(i+16, i+32);
            if(block.length < 16) { block.copy(d, i); break; }
            try{
                const decipher = crypto.createDecipheriv('aes-256-ecb', posKey, null);
                decipher.setAutoPadding(false);
                Buffer.concat([decipher.update(block), decipher.final()]).copy(d, i);
            }catch(e){ block.copy(d, i); }
        }
        const iD = d.readUInt32LE(0), iC = d.readUInt32LE(4);
        try{
            const r = ooz.decompressUnsafe(d.slice(8, 8 + iC), iD);
            if(r) decomp.push(Buffer.from(r));
        }catch(e){}
    }
    const allRaw = Buffer.concat(decomp);
    class BR {
        constructor(b){ this.b=b; this.p=0; }
        rB(){ const v=(this.b[this.p>>3]>>(this.p&7))&1; this.p++; return v; }
        rBs(n){ let v=0; for(let i=0; i<n; i++) if(this.rB()) v|=(1<<i); return v; }
        rP(){ let v=0,s=0; for(let i=0; i<5; i++){ const b=this.rBs(8); v|=(b&0x7F)<<s; s+=7; if(!(b&0x80)) break; } return v; }
    }
    const allChStats = {};
    const weaponNames = {};
    const b1 = new BR(allRaw);
    while(b1.p < allRaw.length*8 - 128) {
        b1.rBs(5); const ch=b1.rBs(15), t=b1.rBs(4), sz=b1.rBs(14), e=b1.p+sz;
        const bytePos = b1.p >> 3;
        if (sz > 16 && t === 1 && ch >= 2 && ch <= 60000) {
            if (!allChStats[ch]) allChStats[ch] = {};
            const bytes = allRaw.slice(bytePos, (e + 7) >> 3);
            for (let j = 0; j < bytes.length - 12; j++) {
                const l = bytes.readInt32LE(j);
                if (l > 5 && l < 100) {
                    const s = bytes.slice(j+4, j+4+l-1).toString();
                    if (s.startsWith('WID_') || s.startsWith('Item_') || s.startsWith('B_')) weaponNames[ch] = s;
                }
            }
            for(let i=0; i<Math.min(sz-32, 400); i++) {
                try {
                    const s = new BR(bytes); s.p = (b1.p & 7) + i;
                    const h = s.rP();
                    if (h > 0 && h < 400) {
                        const v = s.rP();
                        if (v >= 0 && v <= 1000000) allChStats[ch][h] = Math.max(allChStats[ch][h]||0, v);
                    }
                } catch(x){}
            }
        }
        b1.p = e; if (sz === 0) b1.p += 1;
    }
    return { allChStats, weaponNames };
}

(async () => {
    const newPath = 'UnsavedReplay-2026.04.18-16.23.55.replay';
    const oldPath = '/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay';

    console.log("=== NEW REPLAY ===");
    const n = await getStats(newPath);
    for (const ch in n.allChStats) {
        const p = n.allChStats[ch];
        if (p[1] === 12 && p[64] === 92 && p[113] === 4) {
            console.log(`SHOTGUN MATCH: CH ${ch} [${n.weaponNames[ch]}]`);
        }
        if (p[94] === 21 && p[7] === 2) {
             console.log(`AR MATCH: CH ${ch} [${n.weaponNames[ch]}]`);
        }
    }

    console.log("\n=== OLD REPLAY ===");
    const o = await getStats(oldPath);
    for (const ch in o.allChStats) {
        const p = o.allChStats[ch];
        // Chaos Shotgun: 18 shots, 8 hits, 328 damage
        if (p[11] === 18 && p[13] === 8 && p[21] === 328) {
             console.log(`OLD SHOTGUN MATCH: CH ${ch} [${o.weaponNames[ch]}]`);
        }
        // Combat AR: 209 shots, 17 hits, 380 damage
        if (p[11] === 209 && p[13] === 17 && p[21] === 380) {
             console.log(`OLD AR MATCH: CH ${ch} [${o.weaponNames[ch]}]`);
        }
    }
})();
