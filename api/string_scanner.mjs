import { readFileSync } from 'fs';

const buf = readFileSync('all_raw_decompressed.bin');

// Find all FStrings (Length + chars + null)
const findStrings = () => {
    const strings = [];
    for (let i = 0; i < buf.length - 8; i++) {
        const len = buf.readInt32LE(i);
        if (len > 3 && len < 200) {
            const strBuf = buf.slice(i + 4, i + 4 + len);
            if (strBuf[len - 1] === 0) {
                const s = strBuf.slice(0, len - 1).toString('utf8');
                if (/^[A-Za-z0-9_./]+$/.test(s)) {
                    strings.push({ offset: i, val: s, len });
                    // i += 4 + len - 1;
                }
            }
        }
    }
    return strings;
};

const allStrs = findStrings();
console.log(`Found ${allStrs.length} potential strings.`);

const psBase = allStrs.find(s => s.val.includes('FortPlayerStateAthena'));
if (psBase) {
    console.log('Found PlayerState Base at:', psBase.offset);
    const nearby = allStrs.filter(s => s.offset >= psBase.offset && s.offset < psBase.offset + 20000);
    nearby.forEach(s => {
        // Look at bytes before the string length
        const before = buf.slice(s.offset - 4, s.offset).toString('hex');
        console.log(`Offset ${s.offset}: [${before}] "${s.val}"`);
    });
}
