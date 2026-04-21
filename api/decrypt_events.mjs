import { readFileSync } from 'fs';
import { createDecipheriv } from 'crypto';

const buf = readFileSync('/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay');

// ── posKey extraction (same as core_parser.mjs) ──────────────────────────
let posKey = null;
for (let i = 400; i < 1500; i++) {
  if (buf.readUInt32LE(i) === 32) {
    const cand = buf.slice(i+4, i+36);
    if (buf.readUInt32LE(i+36) < 10 && buf.readUInt32LE(i + 40) > 0) {
      posKey = cand;
      console.log('posKey found at offset', i, ':', cand.toString('hex'));
      break;
    }
  }
}
if (!posKey) { console.log('❌ posKey NOT FOUND'); process.exit(1); }

// ── decrypt helper ──────────────────────────────────────────────────────
function decryptECB(data, key) {
  const padded = data.length % 16 === 0 ? data : Buffer.concat([data, Buffer.alloc(16 - data.length % 16)]);
  const out = Buffer.alloc(padded.length);
  for (let i = 0; i < padded.length; i += 16) {
    const d = createDecipheriv('aes-256-ecb', key, null);
    d.setAutoPadding(false);
    Buffer.concat([d.update(padded.slice(i, i+16)), d.final()]).copy(out, i);
  }
  return out.slice(0, data.length);
}

// ── read FString ──────────────────────────────────────────────────────────
function readFStr(buf, offset) {
  const len = buf.readInt32LE(offset);
  if (len === 0) return { str: '', nextOffset: offset + 4 };
  const abs = Math.abs(len);
  const str = len < 0
    ? buf.slice(offset+4, offset+4+abs*2).toString('utf16le').replace(/\0/g,'')
    : buf.slice(offset+4, offset+4+abs).toString('utf8').replace(/\0/g,'');
  return { str, nextOffset: offset + 4 + abs };
}

// ── find Type 3 chunks ────────────────────────────────────────────────────
const CHUNK_START = 764; // same as core_parser.mjs
const events = [];
let off = CHUNK_START;
while (off < buf.length - 8) {
  const t = buf.readUInt32LE(off);
  const s = buf.readUInt32LE(off + 4);
  if (s > 0 && s < 30_000_000 && off + 8 + s <= buf.length) {
    if (t === 3) {
      const payload = buf.slice(off+8, off+8+s);
      events.push({ fileOffset: off, chunkSize: s, payload });
    }
    off += 8 + s;
  } else { off++; }
}
console.log('\nFound', events.length, 'Type-3 event chunks\n');

// ── parse each event: 3-FString format ───────────────────────────────────
const parsedEvents = [];
for (const ev of events) {
  const p = ev.payload;
  try {
    let o = 0;
    const { str: id, nextOffset: o1 } = readFStr(p, o); o = o1;
    const { str: group, nextOffset: o2 } = readFStr(p, o); o = o2;
    const { str: meta, nextOffset: o3 } = readFStr(p, o); o = o3;  // THIRD FString
    const t1 = p.readUInt32LE(o); o += 4;
    const t2 = p.readUInt32LE(o); o += 4;
    const dataSize = p.readUInt32LE(o); o += 4;
    const data = p.slice(o, o + dataSize);
    parsedEvents.push({ id, group, meta, t1, t2, dataSize, data, headerEnd: o });
    console.log(`Event: id="${id}"`);
    console.log(`       group="${group}" meta="${meta}"`);
    console.log(`       t1=${t1}ms t2=${t2}ms dataSize=${dataSize}`);
    console.log(`       data hex: ${data.toString('hex')}`);
    console.log();
  } catch(e) {
    console.log('Parse error:', e.message);
  }
}

// ── Extract statsKey from PlayerStateEncryptionKey event ─────────────────
console.log('=== STATS KEY EXTRACTION ===\n');
const pskEvent = parsedEvents.find(e => e.group === 'PlayerStateEncryptionKey');
if (!pskEvent) {
  console.log('❌ No PlayerStateEncryptionKey event found');
} else {
  console.log('PSK event data (', pskEvent.dataSize, 'bytes):', pskEvent.data.toString('hex'));

  // The data (48 bytes) = 3 AES blocks. Try decrypting with posKey
  const decryptedPSK = decryptECB(pskEvent.data, posKey);
  console.log('Decrypted PSK blob:', decryptedPSK.toString('hex'));

  // statsKey options:
  const candidates = {
    'raw_first_32':  pskEvent.data.slice(0, 32),
    'raw_last_32':   pskEvent.data.slice(16, 48),
    'dec_first_32':  decryptedPSK.slice(0, 32),
    'dec_last_32':   decryptedPSK.slice(16, 48),
    'raw_all_48':    pskEvent.data,  // maybe 48 bytes with padding?
  };

  // ── Find AthenaMatchStats event (inside AdditionGFPEvent) ──────────────
  const gfpEvent = parsedEvents.find(e => e.group.includes('GFP') || e.id.includes('GFP'));
  if (!gfpEvent) {
    console.log('❌ No GFP event found');
  } else {
    console.log('\n=== TRYING TO DECRYPT AdditionGFPEvent ===\n');
    console.log('GFP data (', gfpEvent.dataSize, 'bytes):', gfpEvent.data.toString('hex'));

    // Try each candidate statsKey
    for (const [name, key] of Object.entries(candidates)) {
      if (key.length < 32) continue;
      const keyBuf = Buffer.isBuffer(key) ? key.slice(0, 32) : Buffer.from(key);
      try {
        const dec = decryptECB(gfpEvent.data, keyBuf);
        const decHex = dec.toString('hex');
        console.log(`\nWith key "${name}" (${keyBuf.toString('hex').slice(0,16)}...):`);
        console.log('  Decrypted:', decHex);
        // Check if it looks like structured data (not garbage)
        const zeros = dec.filter(b => b === 0).length;
        const printable = dec.filter(b => b >= 32 && b < 127).length;
        console.log(`  Zeros: ${zeros}/${dec.length}, Printable: ${printable}/${dec.length}`);

        // Search for Osirion target values
        const TARGETS = [7, 2, 575762, 379, 358, 985, 652, 629, 98, 10, 39, 227, 11, 1, 300, 240000];
        for (let i = 0; i <= dec.length - 4; i += 4) {
          const v = dec.readUInt32LE(i);
          if (TARGETS.includes(v)) {
            console.log(`  ✓ Found target value ${v} at field[${i/4}]`);
          }
          // Check float
          const f = dec.readFloatLE(i);
          if (f > 0.09 && f < 0.12) { // ~10.2% accuracy
            console.log(`  ✓ Float ~${(f*100).toFixed(1)}% at field[${i/4}]`);
          }
        }

        // Print all uint32 fields
        console.log('  All uint32 fields:');
        for (let i = 0; i <= dec.length - 4; i += 4) {
          const u = dec.readUInt32LE(i);
          const f = dec.readFloatLE(i);
          console.log(`    [${i/4}] uint32=${u} float=${f.toFixed(4)}`);
        }
      } catch(e) {
        console.log(`  Error: ${e.message}`);
      }
    }

    // Also try decrypting GFP event data with posKey directly
    console.log('\n--- Try GFP decrypt with posKey directly ---');
    const decGFP_posKey = decryptECB(gfpEvent.data, posKey);
    console.log('Decrypted:', decGFP_posKey.toString('hex'));
    console.log('All fields:');
    for (let i = 0; i <= decGFP_posKey.length - 4; i += 4) {
      const u = decGFP_posKey.readUInt32LE(i);
      const f = decGFP_posKey.readFloatLE(i);
      const TARGETS = [7, 2, 575762, 379, 358, 985, 652, 629, 98, 10, 39, 227, 11, 1, 300, 240000];
      const hit = TARGETS.includes(u) ? ' ← TARGET' : '';
      const fhit = (f > 0.09 && f < 0.12) ? ` ← float ~${(f*100).toFixed(1)}%` : '';
      console.log(`  [${i/4}] uint32=${u} float=${f.toFixed(4)}${hit}${fhit}`);
    }
  }
}

// ── Also check Timecode event ─────────────────────────────────────────────
console.log('\n=== TIMECODE EVENT ===');
const tcEvent = parsedEvents.find(e => e.group === 'Timecode');
if (tcEvent) {
  const dec = decryptECB(tcEvent.data, posKey);
  console.log('Timecode data raw:', tcEvent.data.toString('hex'));
  console.log('Timecode data dec:', dec.toString('hex'));
  for (let i = 0; i <= dec.length - 4; i += 4) {
    console.log(`  [${i/4}] uint32=${dec.readUInt32LE(i)} float=${dec.readFloatLE(i).toFixed(4)}`);
  }
}
