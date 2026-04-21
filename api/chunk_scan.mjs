import { readFileSync, writeFileSync } from 'fs';
import { createDecipheriv } from 'crypto';
import * as ooz from 'ooz-wasm';

const buf = readFileSync('/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay');
const posKey = buf.slice(582+4, 582+4+32);
console.log('posKey:', posKey.toString('hex'));

function decryptECB(data, key) {
  if (!key || data.length < 16) return data;
  const padded = data.length % 16 === 0 ? data : Buffer.concat([data, Buffer.alloc(16 - data.length % 16)]);
  const out = Buffer.alloc(padded.length);
  for (let i = 0; i < padded.length; i += 16) {
    const d = createDecipheriv('aes-256-ecb', key, null);
    d.setAutoPadding(false);
    Buffer.concat([d.update(padded.slice(i, i+16)), d.final()]).copy(out, i);
  }
  return out.slice(0, data.length);
}

function readFStr(buf, off) {
  const len = buf.readInt32LE(off);
  if (len === 0) return { str: '', end: off + 4 };
  const abs = Math.abs(len);
  const str = len < 0
    ? buf.slice(off+4, off+4+abs*2).toString('utf16le').replace(/\0/g,'')
    : buf.slice(off+4, off+4+abs).toString('utf8').replace(/\0/g,'');
  return { str, end: off + 4 + abs };
}

// ── Scan all chunks ──────────────────────────────────────────────────────
const TARGETS = [7, 2, 575762, 379, 358, 985, 652, 629, 98, 10, 39, 227, 11, 1, 300, 240000];
const chunks = { 1: 0, 2: 0, 3: 0, 4: 0, other: 0 };

let off = 764;
let statsKey = null;
const type1chunks = [];
const type3events = [];
const type2checkpoints = [];

while (off < buf.length - 8) {
  const t = buf.readUInt32LE(off);
  const s = buf.readUInt32LE(off + 4);

  if (s > 0 && s < 30_000_000 && off + 8 + s <= buf.length) {
    if (t === 1) {
      type1chunks.push({ off, s, sM: buf.readUInt32LE(off+8), eM: buf.readUInt32LE(off+12) });
      chunks[1]++;
    } else if (t === 2) {
      type2checkpoints.push({ off, s });
      chunks[2]++;
    } else if (t === 3) {
      type3events.push({ off, s });
      chunks[3]++;
    } else if (t === 4) {
      chunks[4]++;
    } else {
      chunks.other++;
    }
    off += 8 + s;
  } else { off++; }
}

console.log('\nChunk type counts:', chunks);
console.log(`Type 1 (ReplayData): ${type1chunks.length} chunks`);
console.log(`Type 2 (Checkpoint): ${type2checkpoints.length} chunks`);
console.log(`Type 3 (Event):      ${type3events.length} chunks`);
if (type1chunks.length > 0) {
  console.log(`  First chunk: off=${type1chunks[0].off} s=${type1chunks[0].s} sM=${type1chunks[0].sM}ms eM=${type1chunks[0].eM}ms`);
  console.log(`  Last chunk:  off=${type1chunks[type1chunks.length-1].off} s=${type1chunks[type1chunks.length-1].s} sM=${type1chunks[type1chunks.length-1].sM}ms eM=${type1chunks[type1chunks.length-1].eM}ms`);
}

// ── Parse Type 3 events with correct 3-FString format ───────────────────
console.log('\n=== TYPE 3 EVENTS (3-FString format) ===');
for (const ev of type3events) {
  try {
    const p = buf.slice(ev.off + 8, ev.off + 8 + ev.s);
    let o = 0;
    const { str: id, end: o1 } = readFStr(p, o); o = o1;
    const { str: group, end: o2 } = readFStr(p, o); o = o2;
    const { str: meta, end: o3 } = readFStr(p, o); o = o3;
    const t1 = p.readUInt32LE(o); o += 4;
    const t2 = p.readUInt32LE(o); o += 4;
    const dataSize = p.readUInt32LE(o); o += 4;
    const data = p.slice(o, o + dataSize);
    console.log(`\nEvent: group="${group}" meta="${meta}" t1=${t1}ms dataSize=${dataSize}`);

    if (group === 'PlayerStateEncryptionKey') {
      const decData = decryptECB(data, posKey);
      statsKey = decData.slice(0, 32);
      console.log(`  statsKey: ${statsKey.toString('hex')}`);
      console.log(`  PKCS7 padding (last 16 bytes): ${decData.slice(16).toString('hex')}`);
    }
  } catch(e) { console.log('  Parse error:', e.message); }
}

// ── Decrypt and inspect Type 2 checkpoints ──────────────────────────────
if (type2checkpoints.length > 0) {
  console.log('\n=== TYPE 2 CHECKPOINTS ===');
  for (const cp of type2checkpoints) {
    try {
      const p = buf.slice(cp.off + 8, cp.off + 8 + cp.s);
      const decrypted = decryptECB(p, posKey);
      console.log(`Checkpoint at off=${cp.off} size=${cp.s}`);
      console.log('First 64 bytes dec:', decrypted.slice(0, 64).toString('hex'));
      // Search for player names and target values
      for (let i = 0; i <= decrypted.length - 4; i += 4) {
        const v = decrypted.readUInt32LE(i);
        if (TARGETS.includes(v) && v > 5) {
          console.log(`  Target ${v} at field[${i/4}]`);
        }
      }
    } catch(e) {}
  }
}

// ── Decrypt ReplayData chunks and look for stat events ───────────────────
console.log('\n=== DECOMPRESSING AND SCANNING REPLAYDATA CHUNKS ===');
console.log('Looking for embedded stats in compressed data...');

// Find statsKey first from PSK event (it was extracted above, or use known value)
if (!statsKey) {
  // Fallback: known value from decrypt_events.mjs analysis
  statsKey = Buffer.from('5ccb4c3f9137833eab1cfc3ec158a23c7f4f0d3fd6ad393f46197a3f1565c63e', 'hex');
  console.log('Using fallback statsKey');
}

// Search decompressed data for player names
const rawBin = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');
console.log('\nDecompressed binary size:', rawBin.length, 'bytes');

// Search for various name formats
const names = ['blackgirlslikeme', 'dallasfanangel67', 'blackgirls', 'dallas'];
for (const name of names) {
  // Plain ASCII
  let pos = 0, count = 0;
  while ((pos = rawBin.indexOf(Buffer.from(name, 'ascii'), pos)) !== -1) {
    count++;
    if (count <= 3) console.log(`ASCII "${name}" at ${pos}`);
    pos++;
  }
  if (count > 0) console.log(`  Total: ${count}`);

  // UTF16-LE
  pos = 0; count = 0;
  const utf16 = Buffer.from(name, 'utf16le');
  while ((pos = rawBin.indexOf(utf16, pos)) !== -1) {
    count++;
    if (count <= 3) console.log(`UTF16 "${name}" at ${pos}`);
    pos++;
  }
  if (count > 0) console.log(`  UTF16 total: ${count}`);
}

// Search for AthenaMatchStats string
const statsStr = 'AthenaMatchStats';
let pos = 0, count = 0;
while ((pos = rawBin.indexOf(Buffer.from(statsStr), pos)) !== -1) {
  console.log(`"${statsStr}" found in decompressed binary at offset ${pos}`);
  const ctx = rawBin.slice(Math.max(0, pos-20), pos+statsStr.length+40);
  console.log('  Context:', ctx.toString('ascii').replace(/[^\x20-\x7e]/g,'.'));
  count++;
  pos++;
}
if (count === 0) console.log(`"${statsStr}" NOT FOUND in decompressed binary`);

// Search for string "kills" or "Kills" in decompressed
['kills', 'Kills', 'damage', 'Damage', 'shotsFired', 'Accuracy', 'ResourceCount', 'WoodCount', 'StoneCount', 'MetalCount', 'EliminationStats'].forEach(s => {
  const needle = Buffer.from(s, 'ascii');
  let p = 0, c = 0;
  while ((p = rawBin.indexOf(needle, p)) !== -1) { c++; p++; }
  if (c > 0) console.log(`"${s}": ${c} occurrence(s) in decompressed binary`);
  else console.log(`"${s}": NOT FOUND`);
});

// ── Try decrypting AdditionGFPEvent with statsKey ────────────────────────
console.log('\n=== TRY ALL KEY COMBOS ON ADDITIONGFPEVENT ===');
const gfpData = Buffer.from('8b7fa7f72491898a4fae1e9f86e901cad70b7c9e1ff860876d4c413c8f130e380cc2326947775497696509c800a99f5076f7a45bd565cb0eb534dc7d9fc07d6d403b5f074a29bc611ad86f6c8801d90c0a1b8d4d6dfb0ef6f56ab62dab0034bbe68170cfdbeda58ead2b8bab48592ceb95f8601c377dad8d51e8b77d85e5cffb420baa84f32405bd4ac0c7c0c9a149b7f6a06dec06e1ba50f847f27b5bd79d19', 'hex');

const keysToTry = {
  'posKey': posKey,
  'statsKey': statsKey,
  'pskRawFirst32': Buffer.from('40106e7c10abdb815a1f4b0e4a5f054a8ebe68fb8d7bc80034c22a326799fdd3', 'hex'),
  'pskRawLast32': Buffer.from('8ebe68fb8d7bc80034c22a326799fdd33a20504aea9f521e7ec2766dd739ed92', 'hex'),
};

for (const [name, key] of Object.entries(keysToTry)) {
  if (key.length < 32) continue;
  const dec = decryptECB(gfpData, key.slice(0, 32));
  // Check if it looks like ASCII text or structured data
  const printable = dec.filter(b => b >= 0x20 && b < 0x7f).length;
  const hasStrings = dec.toString('ascii').includes('/Fortnite') || dec.toString('ascii').includes('Athena') || dec.toString('ascii').includes('Match');
  const hasTargets = TARGETS.some(v => {
    if (v < 5) return false;
    const nb = Buffer.alloc(4); nb.writeUInt32LE(v);
    return dec.includes(nb);
  });
  console.log(`\nKey "${name}": printable=${printable}/160 hasStrings=${hasStrings} hasTargets=${hasTargets}`);
  if (hasStrings || hasTargets) {
    console.log('  INTERESTING! Hex:', dec.toString('hex'));
    for (let i = 0; i <= dec.length - 4; i += 4) {
      const u = dec.readUInt32LE(i);
      const hit = TARGETS.includes(u) ? ` ← TARGET` : '';
      if (hit || (dec[i] >= 0x20 && dec[i] < 0x7f)) {
        console.log(`  [${i/4}] ${u}${hit}`);
      }
    }
  }
}

// ── Check offset of known stats values in decompressed binary and their timestamps
console.log('\n=== MATERIAL VALUES WITH TIMESTAMPS ===');
const bnds = [];
{
  let accO = 0;
  for (const c of type1chunks) {
    try {
      const dec = decryptECB(c.p || buf.slice(c.off+8, c.off+8+c.s).slice(16), posKey);
      // We can't decompress here without ooz, but we can use pre-computed bnds
    } catch(e) {}
    // Use pre-computed chunk sizes from all_chunks_raw.bin
    // Actually let's just compute bnds from the chunk boundaries in the replay
  }
}

// Use the rawBin and known chunk boundary data
// Chunk 0: bytes 0-2572796, 0-20120ms
// All chunks from type1chunks (sM/eM are recorded in the chunk header)
const chunkBnds = type1chunks.map((c, i) => ({
  s: i === 0 ? 0 : -1, // we'd need cumulative decompressed sizes
  sM: c.sM,
  eM: c.eM
}));
console.log(`Last chunk: sM=${type1chunks[type1chunks.length-1].sM}ms eM=${type1chunks[type1chunks.length-1].eM}ms`);
console.log(`time_alive_ms = last chunk eM = ${type1chunks[type1chunks.length-1].eM}ms`);

// Values and their approximate positions
const valueOffsets = [
  { name: 'wood', value: 985, offset: 8814056 },
  { name: 'stone', value: 652, offset: 11469801 },
  { name: 'metal', value: 629, offset: 10316892 },
];

// All chunks raw bin - we know from prior session that decompressed total is 11660858
// chunk boundaries in decompressed space
const decomp_bnds = [
  { s: 0, e: 2572796, sM: 0, eM: 20120 },
  { s: 2572796, e: 2883723, sM: 20120, eM: 40124 },
  { s: 2883723, e: 3226699, sM: 40124, eM: 60131 },
  { s: 3226699, e: 3587162, sM: 60131, eM: 80129 },
  { s: 3587162, e: 4006448, sM: 80129, eM: 100123 },
  { s: 4006448, e: 4387170, sM: 100123, eM: 120122 },
  { s: 4387170, e: 4721854, sM: 120122, eM: 139502 },
  { s: 4721854, e: 4923344, sM: 139502, eM: 155496 },
  { s: 4923344, e: 5120094, sM: 155496, eM: 171490 },
  { s: 5120094, e: 5223931, sM: 171490, eM: 180005 },
  { s: 5223931, e: 5538935, sM: 180005, eM: 196359 },
  { s: 5538935, e: 5737310, sM: 196359, eM: 212357 },
  { s: 5737310, e: 5967502, sM: 212357, eM: 233985 },
  { s: 5967502, e: 6022638, sM: 233985, eM: 240009 },
  { s: 6022638, e: 6310734, sM: 240009, eM: 264639 },
  { s: 6310734, e: 6526141, sM: 264639, eM: 288682 },
  { s: 6526141, e: 6650633, sM: 288682, eM: 300014 },
  { s: 6650633, e: 6945079, sM: 300014, eM: 320207 },
  { s: 6945079, e: 7154642, sM: 320207, eM: 340224 },
  { s: 7154642, e: 7373895, sM: 340224, eM: 360240 },
  { s: 7373895, e: 8075257, sM: 360240, eM: 380259 },
  { s: 8075257, e: 8645264, sM: 380259, eM: 400272 },
  { s: 8645264, e: 8929376, sM: 400272, eM: 420285 },
  { s: 8929376, e: 9309756, sM: 420285, eM: 440293 },
  { s: 9309756, e: 9630576, sM: 440293, eM: 460305 },
  { s: 9630576, e: 9948275, sM: 460305, eM: 480318 },
  { s: 9948275, e: 10414155, sM: 480318, eM: 500332 },
  { s: 10414155, e: 10690486, sM: 500332, eM: 520349 },
  { s: 10690486, e: 10994220, sM: 520349, eM: 540370 },
  { s: 10994220, e: 11413902, sM: 540370, eM: 560388 },
  { s: 11413902, e: 11660858, sM: 560388, eM: 575762 },
];

valueOffsets.forEach(({ name, value, offset }) => {
  const bnd = decomp_bnds.find(b => offset >= b.s && offset < b.e) || decomp_bnds[decomp_bnds.length-1];
  const t = bnd.sM + (offset - bnd.s) / (bnd.e - bnd.s) * (bnd.eM - bnd.sM);
  console.log(`${name}=${value}: offset=${offset} → ~${Math.round(t)}ms (${(t/1000/60).toFixed(1)}min)`);
});

// Find ALL occurrences of wood (985), stone (652), metal (629) with timestamps
console.log('\n=== ALL MATERIAL VALUE OCCURRENCES WITH TIMESTAMPS ===');
[{n:'wood', v:985}, {n:'stone', v:652}, {n:'metal', v:629}].forEach(({n, v}) => {
  const needle = Buffer.alloc(4); needle.writeUInt32LE(v);
  const occs = [];
  let p = 0;
  while ((p = rawBin.indexOf(needle, p)) !== -1) { occs.push(p); p++; }
  console.log(`\n${n}=${v}: ${occs.length} occurrences`);
  occs.forEach(offset => {
    const bnd = decomp_bnds.find(b => offset >= b.s && offset < b.e) || decomp_bnds[decomp_bnds.length-1];
    const t = bnd.sM + (offset - bnd.s) / (bnd.e - bnd.s) * (bnd.eM - bnd.sM);
    const ctx = rawBin.slice(Math.max(0, offset-8), Math.min(rawBin.length, offset+12));
    console.log(`  offset=${offset} t=~${Math.round(t)}ms hex=${ctx.toString('hex')}`);
  });
});
