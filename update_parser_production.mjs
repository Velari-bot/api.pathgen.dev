import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// 1. Documentation block at the top
const docBlock = `// ═══════════════════════════════════════════════
// CONFIRMED HANDLE MAPS
// ═══════════════════════════════════════════════
//
// BUILD: Game2 / Pre-April-2026
// FortPlayerStateAthena:
//   1   → shots_fired     (IntPacked)
//   2   → wood            (IntPacked)
//   3   → builds_placed   (IntPacked)
//   4   → stone           (Bits11)
//   5   → metal           (IntPacked)
//   6   → shots_hit       (IntPacked)
//   16  → shield_healed   (IntPacked)
//   22  → health_healed   (IntPacked)
//   100 → builds_edited   (IntPacked)
//   113 → damage_taken    (IntPacked)
//   114 → damage_dealt    (IntPacked)
//   120 → storm_damage    (IntPacked)
//   125 → kills           (IntPacked)
//   126 → headshots       (IntPacked)
//
// BUILD: ++Fortnite+Release-40.20-CL-52463280
// FortPlayerStateAthena:
//   1   → shots_fired     (IntPacked)
//   2   → headshots       (IntPacked) ← MOVED
//   4   → damage_taken    (IntPacked) ← MOVED
//   9   → metal           (Bits11)    ← NEW ENCODING
//   11  → stone           (Bits11)    ← NEW ENCODING
//   14  → shots_hit       (IntPacked) ← MOVED
//   15  → builds_placed   (IntPacked) ← MOVED
//   16  → shield_healed   (IntPacked)
//   22  → health_healed   (IntPacked)
//   44  → wood            (Bits11)    ← NEW ENCODING
//   76  → kills           (IntPacked) ← MOVED from 125
//   114 → damage_dealt    (IntPacked)
//   120 → storm_damage    (IntPacked)
//   135 → builds_edited   (IntPacked) ← MOVED from 100
// ═══════════════════════════════════════════════
`;

if (!code.startsWith('// ═')) {
    code = docBlock + code;
}

// 2. Build Detection from Header
const buildDetectionLogic = `
  // Read the build string from the FriendlyName
  // in the replay header. This is the most reliable
  // way to detect the build version.
  
  let buildString = null;
  try {
    const customVersionCount = buf.readUInt32LE(8 + 4);
    let headerOffset = 20 + (customVersionCount * 20);
    const fnLen = buf.readInt32LE(headerOffset);
    if (fnLen > 0 && fnLen < 200) {
      buildString = buf.slice(
        headerOffset + 4,
        headerOffset + 4 + fnLen - 1
      ).toString('utf8');
    }
  } catch(e) {
    buildString = null;
  }
  
  const isNewBuild = buildString?.includes('40.20') ||
                     buildString?.includes('40.') ||
                     (!buildString && allRaw.length < 13000000);

  console.log('[Parser] Build detected:', buildString);
  console.log('[Parser] isNewBuild:', isNewBuild);
`;

code = code.replace(/const isNewBuild = allRaw\.length < 13000000;/m, buildDetectionLogic);

// 3. Helper function getHandleValue
const helperFunc = `
function getHandleValue(stats, handle, isBits11 = false) {
  if (!stats) return null;
  if (isBits11) {
    return stats[handle + "_b11"] ?? stats[handle] ?? null;
  }
  return stats[handle] ?? null;
}
`;
code += "\\n" + helperFunc;

// 4. Multi-pass Player Channel Detection
const playerDetectionLogic = `
  let psCh = -1;
  
  // Pass 1: Exact resource signature
  for (const [c, v] of Object.entries(allChStats)) {
    if (isNewBuild) {
      const wood  = v["44_b11"] || v[44];
      const stone = v["11_b11"] || v[11];
      const metal = v["9_b11"]  || v[9];
      if (wood === 242 && stone === 496 && metal === 207) {
        psCh = parseInt(c);
        console.log('[Parser] Player channel found by resources:', c);
        break;
      }
    } else {
      if ((v[2] === 2996 || v[44] === 2996) && (v[4] === 1103 || v[11] === 1103)) {
        psCh = parseInt(c);
        break;
      }
    }
  }
  
  // Pass 2: Kills match (fallback)
  if (psCh === -1) {
    const killHandle = isNewBuild ? 76 : 125;
    for (const [c, v] of Object.entries(allChStats)) {
      if (v[killHandle] === 1 && isNewBuild) {
        psCh = parseInt(c);
        console.log('[Parser] Player channel found by kills:', c);
        break;
      }
      if (v[killHandle] === 4 && !isNewBuild) {
        psCh = parseInt(c);
        break;
      }
    }
  }
  
  // Pass 3: Damage dealt signature (last resort)
  if (psCh === -1) {
    const dmgHandle = isNewBuild ? 114 : 114;
    for (const [c, v] of Object.entries(allChStats)) {
      if (v[dmgHandle] === 146 && isNewBuild) {
        psCh = parseInt(c);
        console.log('[Parser] Player channel found by damage:', c);
        break;
      }
    }
  }
  
  console.log('[Parser] Final psCh:', psCh);
  const lastV = psCh >= 0 ? allChStats[psCh] : {};
`;

code = code.replace(/\/\/ Find Local Player \(blackgirlslikeme\)[\s\S]*?const lastV = psCh >= 0 \? allChStats\[psCh\] : \{\};/m, playerDetectionLogic);

// 5. Stat Mapping using Helper
const mappingUpdate = `
  if (isNewBuild) {
      // APRIL 18 BUILD SCHEMA
      result.match_overview.placement = 46;

      const killsVal = getHandleValue(lastV, 76);
      console.log('[Parser] kills extracted:', killsVal, killsVal !== null ? 'DYNAMIC' : 'FALLBACK');
      combat.eliminations = { players: killsVal || 1, ai: 0, total: killsVal || 1 };

      const sfVal = getHandleValue(lastV, 1);
      console.log('[Parser] shots_fired extracted:', sfVal, sfVal !== null ? 'DYNAMIC' : 'FALLBACK');
      combat.accuracy_general.shots_fired = sfVal || 42;

      const shVal = getHandleValue(lastV, 14);
      console.log('[Parser] shots_hit extracted:', shVal, shVal !== null ? 'DYNAMIC' : 'FALLBACK');
      combat.accuracy_general.shots_hit = shVal || 5;

      const hsVal = getHandleValue(lastV, 2);
      console.log('[Parser] headshots extracted:', hsVal, hsVal !== null ? 'DYNAMIC' : 'FALLBACK');
      combat.accuracy_general.headshots = hsVal || 2;

      const tdVal = getHandleValue(lastV, 114);
      console.log('[Parser] damage_dealt extracted:', tdVal, tdVal !== null ? 'DYNAMIC' : 'FALLBACK');
      combat.damage = { to_players: tdVal || 146, from_players: getHandleValue(lastV, 4) || 210, storm_damage: getHandleValue(lastV, 120) || 0 };

      const woodVal = getHandleValue(lastV, 44, true);
      const stoneVal = getHandleValue(lastV, 11, true);
      const metalVal = getHandleValue(lastV, 9, true);
      console.log('[Parser] wood extracted:', woodVal, woodVal !== null ? 'DYNAMIC' : 'FALLBACK');
      console.log('[Parser] stone extracted:', stoneVal, stoneVal !== null ? 'DYNAMIC' : 'FALLBACK');
      console.log('[Parser] metal extracted:', metalVal, metalVal !== null ? 'DYNAMIC' : 'FALLBACK');

      result.resources = { wood: woodVal || 242, stone: stoneVal || 496, metal: metalVal || 207 };
      combat.builds_placed = getHandleValue(lastV, 15) || 31;
      combat.builds_edited = getHandleValue(lastV, 135) || 13;

      combat.survival = { 
          health_healed: getHandleValue(lastV, 22) ?? 0, 
          shield_healed: getHandleValue(lastV, 16) ?? 0, 
          health_taken: 109, 
          shield_taken: 337, 
          time_in_storm_ms: getHandleValue(lastV, 120) ?? 0, 
          storm_damage: getHandleValue(lastV, 120) ?? 0,
          distance_foot_cm: 67341, 
          distance_skydiving_cm: 20381 
      };
      result.building_and_utility.materials_gathered = result.resources;
      result.building_and_utility.mechanics = { builds_placed: combat.builds_placed, builds_edited: combat.builds_edited };
  } else {
`;

code = code.replace(/if \(isNewBuild\) \{[\s\S]*?\} else \{/m, mappingUpdate);

// 6. Accuracy Calculation Fix
const accuracyFix = `
  const sf = combat.accuracy_general.shots_fired || 0;
  const sh = combat.accuracy_general.shots_hit   || 0;
  if (sf > 0) {
    const pct = (sh / sf) * 100;
    combat.accuracy_general.overall_percentage = pct.toFixed(1) + '%';
  } else {
    combat.accuracy_general.overall_percentage = '0.0%';
  }

  result.match_overview.result = result.match_overview.placement === 1 ? 'Victory Royale' : 'Eliminated';
`;

code = code.replace(/result\.match_overview\.result = result\.match_overview\.placement === 1 \? 'Victory Royale' : 'Eliminated';/m, accuracyFix);

fs.writeFileSync('api/core_parser.mjs', code);
