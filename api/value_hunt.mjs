import { readFileSync } from 'fs';
import { createDecipheriv } from 'crypto';

const raw = readFileSync('/Users/aidenbender/Desktop/replay engine/all_chunks_raw.bin');
const replayBuf = readFileSync('/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay');

console.log('Decompressed binary size:', raw.length, 'bytes');

// The statsKey: decrypt PSK event payload with posKey
// posKey at offset 582
const posKey = replayBuf.slice(582+4, 582+4+32);
console.log('posKey:', posKey.toString('hex'));

// Find PSK event — it's in the replay file as a Type 3 chunk
// We know from decrypt_events.mjs it's at the end of the file
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

// Known PSK data from decrypt_events output
const pskData = Buffer.from('40106e7c10abdb815a1f4b0e4a5f054a8ebe68fb8d7bc80034c22a326799fdd33a20504aea9f521e7ec2766dd739ed92', 'hex');
const decPSK = decryptECB(pskData, posKey);
console.log('Decrypted PSK:', decPSK.toString('hex'));
// Last 16 bytes should be PKCS7 padding (0x10)
const statsKey = decPSK.slice(0, 32);
console.log('statsKey:', statsKey.toString('hex'));

// ── Search for known Osirion ground truth values ─────────────────────────
const TARGETS = {
  placement: 7,
  kills: 2,
  time_alive_ms: 575762,
  damage_to_players: 379,
  damage_from_players: 358,
  wood: 985,
  stone: 652,
  metal: 629,
  builds_placed: 98,
  builds_edited: 10,
  shots_fired: 98,
  shots_hit: 10,
  headshots: 1,
  health_healed: 39,
  shield_healed: 227,
  storm_damage: 11,
  revives: 0,
};

console.log('\n=== SEARCHING DECOMPRESSED BINARY FOR TARGET VALUES ===\n');

Object.entries(TARGETS).forEach(([name, val]) => {
  if (val === 0 || val === 1) return; // too common

  const needle = Buffer.alloc(4);
  needle.writeUInt32LE(val);

  const positions = [];
  let pos = 0;
  while ((pos = raw.indexOf(needle, pos)) !== -1) {
    positions.push(pos);
    pos++;
  }

  if (positions.length === 0) {
    console.log(`${name}=${val}: NOT FOUND`);
  } else if (positions.length <= 8) {
    console.log(`\n${name}=${val}: found at ${positions.length} location(s)`);
    positions.forEach(p => {
      const ctx = raw.slice(Math.max(0, p-8), Math.min(raw.length, p+12));
      console.log(`  offset=${p} hex=${ctx.toString('hex')}`);
    });
  } else {
    console.log(`${name}=${val}: found ${positions.length} times (too common)`);
  }
});

// ── Check for wood/stone/metal cluster ───────────────────────────────────
console.log('\n=== LOOKING FOR MATERIALS CLUSTER (wood=985, stone=652, metal=629) ===');
const woodBuf = Buffer.alloc(4); woodBuf.writeUInt32LE(985);
const stoneBuf = Buffer.alloc(4); stoneBuf.writeUInt32LE(652);
const metalBuf = Buffer.alloc(4); metalBuf.writeUInt32LE(629);

let pos = 0;
let clusterCount = 0;
while ((pos = raw.indexOf(woodBuf, pos)) !== -1) {
  const stonePos = raw.indexOf(stoneBuf, Math.max(0, pos-64));
  const metalPos = raw.indexOf(metalBuf, Math.max(0, pos-64));

  if (stonePos >= 0 && metalPos >= 0) {
    const minPos = Math.min(pos, stonePos, metalPos);
    const maxPos = Math.max(pos, stonePos, metalPos);
    if (maxPos - minPos < 64) {
      clusterCount++;
      console.log(`CLUSTER at wood=${pos} stone=${stonePos} metal=${metalPos}`);
      const start = Math.max(0, minPos - 16);
      const end = Math.min(raw.length, maxPos + 20);
      console.log(`  hex: ${raw.slice(start, end).toString('hex')}`);
      // Print uint32 fields in this region
      for (let i = start; i < end - 3; i += 4) {
        const u = raw.readUInt32LE(i);
        if ([985, 652, 629, 379, 358, 98, 39, 227, 11, 2, 7, 575762].includes(u)) {
          console.log(`  field[${(i-start)/4}] @ offset ${i} = ${u} ← MATCH`);
        }
      }
    }
  }
  pos++;
}
if (clusterCount === 0) console.log('No cluster found');

// ── Search raw replay file (encrypted) ──────────────────────────────────
console.log('\n=== SEARCHING ENCRYPTED REPLAY FILE ===');
Object.entries(TARGETS).forEach(([name, val]) => {
  if (val < 10) return;
  const needle = Buffer.alloc(4);
  needle.writeUInt32LE(val);
  const positions = [];
  let p = 0;
  while ((p = replayBuf.indexOf(needle, p)) !== -1) {
    positions.push(p);
    p++;
  }
  if (positions.length > 0 && positions.length <= 5) {
    console.log(`${name}=${val}: found at ${positions.length} location(s) in encrypted file`);
    positions.forEach(offset => {
      const ctx = replayBuf.slice(Math.max(0, offset-8), Math.min(replayBuf.length, offset+12));
      console.log(`  offset=${offset} hex=${ctx.toString('hex')}`);
    });
  }
});

// ── Search for player name "blackgirlslikeme" ────────────────────────────
console.log('\n=== SEARCHING FOR PLAYER NAME ===');
const playerName = 'blackgirlslikeme';
const nameNeedle = Buffer.from(playerName, 'ascii');
let namePos = 0;
let nameCount = 0;
while ((namePos = raw.indexOf(nameNeedle, namePos)) !== -1) {
  nameCount++;
  if (nameCount <= 5) {
    console.log(`"${playerName}" at offset ${namePos}`);
    const ctx = raw.slice(Math.max(0, namePos-8), namePos + playerName.length + 20);
    console.log(`  hex: ${ctx.toString('hex')}`);
    console.log(`  ascii: ${ctx.toString('ascii').replace(/[^\x20-\x7e]/g,'.')}`);
    // Read nearby uint32 values
    for (let i = namePos + playerName.length; i < namePos + playerName.length + 64 && i + 3 < raw.length; i += 4) {
      const u = raw.readUInt32LE(i);
      if (u > 0 && u < 10000) console.log(`  nearby uint32 at +${i-(namePos+playerName.length)}: ${u}`);
    }
  }
  namePos++;
}
console.log(`Total occurrences: ${nameCount}`);

// ── Search for partner name "dallasfanangel67" ────────────────────────────
const partnerName = 'dallasfanangel67';
const partnerNeedle = Buffer.from(partnerName, 'ascii');
let partnerPos = 0;
let partnerCount = 0;
while ((partnerPos = raw.indexOf(partnerNeedle, partnerPos)) !== -1) {
  partnerCount++;
  if (partnerCount <= 3) {
    console.log(`"${partnerName}" at offset ${partnerPos}`);
  }
  partnerPos++;
}
console.log(`"${partnerName}" total: ${partnerCount}`);

// ── Also search compressed replay for player name in UE4 FString format ──
console.log('\n=== SEARCH IN COMPRESSED REPLAY FOR PLAYER NAME ===');
// FString: uint32 len + chars
const playerNameFStr = Buffer.from(playerName + '\0', 'utf8');
const fstrLen = Buffer.alloc(4);
fstrLen.writeUInt32LE(playerName.length + 1); // +1 for null terminator
const fstrSearch = Buffer.concat([fstrLen, playerNameFStr]);
let fstrPos = 0;
let fstrCount = 0;
while ((fstrPos = replayBuf.indexOf(fstrSearch, fstrPos)) !== -1) {
  fstrCount++;
  console.log(`FString "${playerName}" at replay offset ${fstrPos}`);
  fstrPos++;
}
console.log(`Total: ${fstrCount}`);
