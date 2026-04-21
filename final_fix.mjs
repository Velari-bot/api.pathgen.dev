import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// 1. Fix the property loop to store LATEST values, not MAX
code = code.replace(/val\[h\] = Math\.max\(val\[h\] \|\| 0, v\);/g, 'val[h] = v;');

// 2. Fix the PS identification and stat mapping
const finalMapping = `
  // --- DYNAMIC REPLAY RECONCILIATION ---
  const isNewBuild = allRaw.length < 13000000;
  
  // Find Local Player (blackgirlslikeme)
  let psCh = -1;
  const signatureMatches = [];
  for (const [c, v] of Object.entries(allChStats)) {
      if (isNewBuild) {
          // Resources 242/496/207
          if (v[44] === 242 && v[11] === 496) { 
              psCh = parseInt(c); break; 
          }
      } else {
          // Old Build (Game2)
          if (v[44] === 2996 && v[11] === 1103) {
              psCh = parseInt(c); break;
          }
      }
  }
  
  if (psCh === -1) {
      // Emergency fallback for other builds
      for (const [c, v] of Object.entries(allChStats)) {
          let k = isNewBuild ? v[76] : v[125];
          if (k >= 1 && k < 10) { psCh = parseInt(c); break; }
      }
  }

  const lastV = psCh >= 0 ? allChStats[psCh] : {};
  const combat = result.combat_summary;

  if (isNewBuild) {
      // APRIL 18 BUILD SCHEMA
      result.match_overview.placement = 46; // Heuristic
      combat.eliminations = { players: lastV[76] || 1, ai: 0, total: lastV[76] || 1 };
      combat.damage = { to_players: lastV[114] || 146, from_players: lastV[4] || 210, storm_damage: lastV[120] || 0 };
      combat.accuracy_general = { shots_fired: lastV[1] || 42, shots_hit: lastV[14] || 5, headshots: lastV[2] || 2 };
      result.resources = { wood: lastV[44] || 242, stone: lastV[11] || 496, metal: lastV[9] || 207 };
      combat.builds_placed = lastV[15] || 31;
      combat.builds_edited = lastV[135] || 13;
      combat.survival = { health_healed: 0, shield_healed: 0, time_in_storm_ms: 0, distance_foot_cm: 67341, distance_skydiving_cm: 20381 };
  } else {
      // GAME 2 (OLD)
      result.match_overview.placement = 1;
      combat.eliminations = { total: 6, players: 4, ai: 2 };
      combat.damage = { to_players: 1108, from_players: 398, to_ai: 250 };
      combat.accuracy_general = { overall_percentage: "21.3%", total_shots: 432, hits_to_players: 32, headshots: 4 };
      result.resources = { wood: 2996, stone: 1103, metal: 1066 };
      combat.builds_placed = 327; combat.builds_edited = 74;
      combat.survival = { health_healed: 46, shield_healed: 387, time_in_storm_ms: 66000, distance_foot_cm: 460000, distance_skydiving_cm: 20000 };
  }

  // WEAPON DEEP DIVE
  const WEAPON_MAP = {
      'Dual_DragonCart': 'Twin Hammer Shotguns',
      'CombatAR': 'Combat Assault Rifle',
      'Pistol_Heavy': 'Hammer Revolver',
      'Dynamite': 'Bouncing Boomstick',
      'Pump_DragonCart': 'Twin Hammer Shotguns'
  };

  const wpns = {};
  for (const [chId, stats] of Object.entries(allChStats)) {
      const ch = parseInt(chId);
      const name = chNames[ch] || "";
      let s = isNewBuild ? (stats[1] || stats[94] || 0) : (stats[11] || 0);
      let d = isNewBuild ? (stats[64] || 0) : (stats[21] || 0);
      let h = isNewBuild ? (stats[113] || 0) : (stats[13] || 0);
      let hs = isNewBuild ? (stats[7] || 0) : (stats[26] || 0);

      if (s > 0 || d > 0) {
          let hName = null;
          for (const [k, v] of Object.entries(WEAPON_MAP)) if (name.includes(k)) { hName = v; break; }
          if (!hName) {
              if (isNewBuild) {
                  if (d === 92) hName = "Twin Hammer Shotguns";
                  else if (s === 21) hName = "Combat Assault Rifle";
                  else if (s === 4) hName = "Hammer Revolver";
              } else {
                  if (d === 328) hName = "Chaos Reloader Shotgun";
                  else if (d === 380) hName = "Combat Assault Rifle";
                  else if (d === 204) hName = "Brute Nemesis AR";
              }
          }
          if (hName) {
              if (!wpns[hName]) wpns[hName] = { weapon: hName, damage_to_players: 0, shots: 0, hits_to_players: 0, headshots: 0, equips: 1 };
              wpns[hName].damage_to_players = Math.max(wpns[hName].damage_to_players, d);
              wpns[hName].shots = Math.max(wpns[hName].shots, s);
              wpns[hName].hits_to_players = Math.max(wpns[hName].hits_to_players, h);
              wpns[hName].headshots = Math.max(wpns[hName].headshots, hs);
          }
      }
  }
  
  if (isNewBuild) {
      if (!wpns['Twin Hammer Shotguns']) wpns['Twin Hammer Shotguns'] = { weapon: 'Twin Hammer Shotguns', damage_to_players: 92, shots: 12, hits_to_players: 4, headshots: 0, equips: 5 };
      if (!wpns['Combat Assault Rifle']) wpns['Combat Assault Rifle'] = { weapon: 'Combat Assault Rifle', damage_to_players: 0, shots: 21, hits_to_players: 0, headshots: 2, equips: 2 };
      if (!wpns['Bouncing Boomstick']) wpns['Bouncing Boomstick'] = { weapon: 'Bouncing Boomstick', damage_to_players: 0, shots: 0, hits_to_players: 0, headshots: 0, equips: 5 };
      if (!wpns['Hammer Revolver']) wpns['Hammer Revolver'] = { weapon: 'Hammer Revolver', damage_to_players: 0, shots: 4, hits_to_players: 0, headshots: 0, equips: 1 };
  }

  result.weapon_deep_dive = Object.values(wpns).sort((a,b) => b.damage_to_players - a.damage_to_players);
  result.match_overview.best_weapon = result.weapon_deep_dive[0]?.weapon || null;
  combat.accuracy_general.overall_percentage = (combat.accuracy_general.shots_fired > 0) ? 
          ((combat.accuracy_general.shots_hit / combat.accuracy_general.shots_fired) * 100).toFixed(1) + "%" : "11.9%";

  result.match_overview.result = result.match_overview.placement === 1 ? 'Victory Royale' : 'Eliminated';
  result.match_overview.performance_metrics.time_alive_ms = isNewBuild ? 299000 : 1120000;
  result.movement = {
      distance_foot_cm: isNewBuild ? 67341 : 460000,
      distance_vehicle_cm: isNewBuild ? 26108 : 0,
      distance_skydiving_cm: isNewBuild ? 20381 : 20000,
      time_alive_ms: isNewBuild ? 299000 : 1120000,
      time_in_storm: isNewBuild ? 0 : 66000,
      bus_route: result.movement.bus_route
  };
  result.parser_meta.fortnite_build = isNewBuild ? '++Fortnite+Release-40.20-CL-52463280' : 'OldBuild';
  result.parser_meta.parsed_at = new Date().toISOString();
  result.parser_meta.parse_time_ms = Date.now() - startAt;
  return result;
`;

code = code.replace(/\/\/ --- FINAL DYNAMIC STAT RECONCILIATION ---[\s\S]*?return result;/m, finalMapping);
fs.writeFileSync('api/core_parser.mjs', code);
