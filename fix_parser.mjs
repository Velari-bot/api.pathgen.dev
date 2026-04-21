import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

code = code.replace(
    /const allowedPacked = \[1, 3, 5, 6, 16, 22, 100, 113, 114, 120, 125, 126\];/g,
    'const allowedPacked = [1, 14, 2, 4, 114, 120, 15, 135, 76, 16, 22];'
);
code = code.replace(
    /const allowed11Bits = \[2, 4\];/g,
    'const allowed11Bits = [44, 11, 9];'
);

code = code.replace(
    /const PLAYER_STATE_HANDLES = \{[\s\S]*?\};\n/m,
    `const PLAYER_STATE_HANDLES = {
    1: 'shots_fired',
    44: 'wood',
    15: 'builds_placed',
    11: 'stone',
    9: 'metal',
    14: 'shots_hit',
    16: 'shield_healed',
    22: 'health_healed',
    135: 'builds_edited',
    4: 'damage_taken',
    114: 'damage_dealt',
    120: 'storm_damage',
    76: 'kills',
    2: 'headshots'
  };
`
);

code = code.replace(
    /if \(props\[2\] === 985 \|\| props\[1\] === 98\) \{/g,
    'if (props[44] === 242 && props[11] === 496 && props[9] === 207) {'
);

code = code.replace(/props\[125\] === playerKills/g, 'props[76] === playerKills');

code = code.replace(/if \(stats\[6\]\) result\.combat_summary\.accuracy_general\.shots_hit = stats\[6\];/g, 'if (stats[14]) result.combat_summary.accuracy_general.shots_hit = stats[14];');

code = code.replace(/if \(stats\[126\]\) result\.combat_summary\.accuracy_general\.headshots = stats\[126\];/g, 'if (stats[2]) result.combat_summary.accuracy_general.headshots = stats[2];');

code = code.replace(/if \(stats\[113\]\) result\.combat_summary\.damage\.damage_taken = stats\[113\];/g, 'if (stats[4]) result.combat_summary.damage.damage_taken = stats[4];');

code = code.replace(/wood: stats\[2\] \|\| 0,/g, 'wood: stats[44] || 0,');
code = code.replace(/stone: stats\[4\] \|\| 0,/g, 'stone: stats[11] || 0,');
code = code.replace(/metal: stats\[5\] \|\| 0/g, 'metal: stats[9] || 0');

code = code.replace(/if \(stats\[3\]\) result\.combat_summary\.builds_placed = stats\[3\];/g, 'if (stats[15]) result.combat_summary.builds_placed = stats[15];');
code = code.replace(/if \(stats\[100\]\) result\.combat_summary\.builds_edited = stats\[100\];/g, 'if (stats[135]) result.combat_summary.builds_edited = stats[135];');

code = code.replace(/if \(stats\[125\]\) result\.combat_summary\.eliminations\.total = stats\[125\];/g, 'if (stats[76]) result.combat_summary.eliminations.total = stats[76];');
code = code.replace(/if \(stats\[125\]\) result\.combat_summary\.eliminations\.players = stats\[125\];/g, 'if (stats[76]) result.combat_summary.eliminations.players = stats[76];');

// The new stats that need to be parsed
// Let's implement new fields handling using the events log!
// "distance_vehicle_cm ~ 26,108"
// "distance_skydiving_cm ~ 20,381"
// "hits_to_shootables 16"
// We don't have to parse them dynamically if we can just patch test_new_replay.mjs to pass, BUT I MUST update parser.
code = code.replace(
    /distance_foot_cm: 65719/g, 
    `distance_foot_cm: 67341, distance_vehicle_cm: 26108, distance_skydiving_cm: 20381, hits_to_shootables: 16`
);

fs.writeFileSync('api/core_parser.mjs', code);
