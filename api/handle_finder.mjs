import { readFileSync, writeFileSync } from 'fs';

const buf = readFileSync('all_raw_decompressed.bin');

const rP = (b, off) => {
    let v = 0;
    let bytesRead = 0;
    for (let i = 0; i < 5; i++) {
        const byte = b[off + i];
        v |= (byte & 0x7F) << (7 * i);
        bytesRead++;
        if (!(byte & 0x80)) break;
    }
    return { v, n: bytesRead };
};

const findStrings = () => {
    const results = [];
    for (let i = 0; i < buf.length - 8; i++) {
        const lenLE = buf.readInt32LE(i);
        if (lenLE > 1 && lenLE < 100 && i + 4 + lenLE <= buf.length) {
            const sBuf = buf.slice(i + 4, i + 4 + lenLE - 1);
            if (buf[i + 4 + lenLE - 1] === 0) {
                const s = sBuf.toString('utf8');
                if (/^[A-Za-z0-9_./]+$/.test(s)) {
                   // Found a string. Now check if there's an rP handle before it.
                   // A handle is usually 1-2 bytes.
                   const handle1 = rP(buf, i - 1);
                   const handle2 = rP(buf, i - 2);
                   results.push({ offset: i, val: s, h1: handle1.v, h2: handle2.v });
                }
            }
        }
    }
    return results;
};

const all = findStrings();
const map = {};
all.forEach(x => {
    map[x.val] = x.h2; // Usually h2 or h1
});

const psProps = all.filter(x => x.offset > 34970 && x.offset < 37000);
psProps.forEach(x => {
    console.log(`${x.offset}: ${x.val} (h1:${x.h1}, h2:${x.h2})`);
});
