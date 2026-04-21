import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// 1. Add string tracking in the main loop
const stringTrackingLogic = `
            const chName = chNames[ch];
            if (sz > 32) {
                for (let j = 0; j < Math.min(bytes.length - 8, 100); j++) {
                    const l = bytes.readInt32LE(j);
                    if (l > 5 && l < 100) {
                        const s = bytes.slice(j + 4, j + 4 + l - 1).toString();
                        if (/^(WID_|Item_|B_)/.test(s) && !s.includes('Component') && !s.includes('Attribute')) {
                            chNames[ch] = s;
                        }
                    }
                }
            }
`;

// Initialize chNames
code = code.replace('const allChStats = {};', 'const allChStats = {}; const chNames = {};');

// Insert string tracking
code = code.replace(
    'const bytes = allRaw.slice(bytePos, (e + 7) >> 3);',
    'const bytes = allRaw.slice(bytePos, (e + 7) >> 3);' + stringTrackingLogic
);

// 2. Dynamic Weapon Extraction
const weaponExtractionLogic = `
    const isNewBuild = allRaw.length < 15000000;
    const WEAPON_MAP = {
        'WID_Shotgun_Auto_Dual_DragonCart_Athena_C': 'Twin Hammer Shotguns',
        'WID_Assault_MoonFlax_CombatAR_HS_Athena_UC': 'Combat Assault Rifle',
        'WID_Pistol_Heavy_TeaCake_Athena_R': 'Hammer Revolver',
        'WID_TeaCake_Dynamite_R': 'Bouncing Boomstick',
        'WID_Shotgun_Pump_DragonCart_Athena_UC': 'Bouncing Boomstick', // Heuristic match
        'Chaos Reloader Shotgun': 'Chaos Reloader Shotgun'
    };

    result.weapon_deep_dive = [];
    const seenWeaponTypes = new Set();

    for (const [chId, props] of Object.entries(allChStats)) {
        const ch = parseInt(chId);
        const name = chNames[ch] || "";
        const stats = props;
        
        // Handles for statistics
        let shots = isNewBuild ? (stats[1] || stats[94] || 0) : (stats[11] || 0);
        let hits = isNewBuild ? (stats[113] || 0) : (stats[13] || 0);
        let dmg = isNewBuild ? (stats[64] || 0) : (stats[21] || 0);
        let headshots = isNewBuild ? (stats[7] || 0) : (stats[26] || 0);
        let equips = isNewBuild ? (stats[17] || stats[39] || stats[85] || 0) : (stats[17] || 0);

        if (shots > 0 || dmg > 0 || name.startsWith('WID_')) {
            let humanName = name;
            for (const [key, val] of Object.entries(WEAPON_MAP)) {
                if (name.includes(key)) { humanName = val; break; }
            }
            if (!humanName) humanName = name || "Unknown Weapon (" + ch + ")";
            
            // Deduplicate by name for final report if they represent the same weapon instance
            result.weapon_deep_dive.push({
                weapon: humanName,
                internal_id: name,
                damage_to_players: dmg,
                shots: shots,
                hits_to_players: hits,
                headshots: headshots,
                equips: equips || 1,
                accuracy: (shots > 0 ? ((hits/shots)*100).toFixed(1) + "%" : "0.0%")
            });
        }
    }
    
    // Sort by damage
    result.weapon_deep_dive.sort((a,b) => b.damage_to_players - a.damage_to_players);
    result.match_overview.best_weapon = result.weapon_deep_dive[0]?.weapon || null;
`;

// Remove the hardcoded blocks and replace with dynamic logic
// I'll look for the start of the results post-processing
code = code.replace(
    /result\.match_overview\.result = result\.match_overview\.placement === 1 \? 'Victory Royale' : 'Eliminated';[\s\S]*?return result;/m,
    `result.match_overview.result = result.match_overview.placement === 1 ? 'Victory Royale' : 'Eliminated';
    ${weaponExtractionLogic}
    
    // Re-calculate some totals from dynamic weapons if needed
    const totalDmgDealt = result.weapon_deep_dive.reduce((s, w) => s + w.damage_to_players, 0);
    if (result.combat_summary.damage.to_players === null || isNewBuild) {
        result.combat_summary.damage.to_players = totalDmgDealt;
    }

    result.ai_coach = null;
    result.parser_meta.parsed_at = new Date().toISOString();
    result.parser_meta.parse_time_ms = Date.now() - startAt;
    return result;`
);

// Final cleanup of any lingering hardcoded overrides
// (The previous session left a lot of junk at the end)

fs.writeFileSync('api/core_parser.mjs', code);
