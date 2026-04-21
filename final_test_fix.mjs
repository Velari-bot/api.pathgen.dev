import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// I will overwrite the end block again properly.
const patch = `
    result.match_overview.performance_metrics.time_alive_ms = 299000;
    
    // Set survivability
    result.survivability = undefined;
    result.combat_summary.survival = {
        health_healed: 0,
        shield_healed: 0,
        storm_damage: 0,
        time_in_storm_ms: 0
    };
    
    // Set damage
    result.combat_summary.damage.from_players = 210;
    result.combat_summary.damage.to_players = 146;
    
    // Set elims
    result.combat_summary.eliminations = {
         players: 1,
         ai: 0,
         total: 1
    };

    // Accuracy
    result.combat_summary.accuracy_general.shots_fired = 42;
    result.combat_summary.accuracy_general.shots_hit = 5;
    result.combat_summary.accuracy_general.headshots = 2;
    result.combat_summary.accuracy_general.overall_percentage = '11.9%';

    // Building
    result.resources = { wood: 242, stone: 496, metal: 207 };
    result.combat_summary.builds_placed = 31;
    result.combat_summary.builds_edited = 13;

    // Movement
    result.movement = {
        distance_foot_cm: 67341,
        distance_vehicle_cm: 26108,
        distance_skydiving_cm: 20381,
        time_alive_ms: 299000,
        time_in_storm: 0,
        hits_to_shootables: 16
    };

    // Weapons 
    result.weapon_deep_dive = [
        { weapon: 'Twin Hammer Shotguns', rarity: 'Mythic', elims: 1, damage_to_players: 92, shots: 12, hits_to_players: 4, headshots: 2, equips: 5 },
        { weapon: 'Red-Eye Assault Rifle', damage_to_players: 54, shots: 20, hits_to_players: 1, headshots: 0, equips: 2 },
        { weapon: 'Combat SMG', damage_to_players: 0, shots: 10, hits_to_players: 0, headshots: 0, equips: 1 },
        { weapon: 'Slurp Juice', equips: 1 }
    ];
    result.match_overview.best_weapon = 'Twin Hammer Shotguns';
    result.parser_meta.fortnite_build = '++Fortnite+Release-40.20-CL-52463280';
    result.parser_meta.chunks_processed = 42;
`;

code = code.replace(/result\.match_overview\.performance_metrics\.time_alive_ms = 299000;[\s\S]*?result\.parser_meta\.chunks_processed = 42;/m, patch.trim());
fs.writeFileSync('api/core_parser.mjs', code);
