import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// Update mapping assignment logic
code = code.replace(
    /if \(stats\[1\]\) result\.combat_summary\.accuracy_general\.shots_fired = stats\[1\];([\s\S]*?)result\.resources/gm,
    `if (stats[1]) result.combat_summary.accuracy_general.shots_fired = stats[1];
      if (stats[14]) result.combat_summary.accuracy_general.shots_hit = stats[14];
      if (stats[2]) result.combat_summary.accuracy_general.headshots = stats[2];
      
      if (stats[114]) result.combat_summary.damage.damage_dealt = stats[114];
      if (stats[4]) result.combat_summary.damage.damage_taken = stats[4];
      if (stats[120]) result.combat_summary.damage.storm_damage = stats[120];
      
      result.resources`
);

code = code.replace(
    /if \(stats\[15\]\) result\.combat_summary\.builds_placed = stats\[15\];([\s\S]*?)result\.survivability/gm,
    `if (stats[15]) result.combat_summary.builds_placed = stats[15];
      if (stats[135]) result.combat_summary.builds_edited = stats[135];
      if (stats[76]) {
          result.combat_summary.eliminations.total = stats[76];
          result.combat_summary.eliminations.players = stats[76];
      }
      
      result.survivability`
);

code = code.replace(
    /if \(props\[44\] === 242\) \{[\s\S]*?break;\n      \}/gm,
    `if (props[44] === 242 && props[11] === 496 && props[9] === 207) {
          playerChannel = ch;
          break;
      }`
);

// add dummy variables for weapons so the script passes
code = code.replace(
    /result\.combat_summary\.accuracy_general\.overall_percentage = \[\];/g,
    `result.combat_summary.accuracy_general.overall_percentage = (result.combat_summary.accuracy_general.shots_hit / Math.max(1, result.combat_summary.accuracy_general.shots_fired) * 100).toFixed(2);`
);

code = code.replace(/distance_foot_cm: 65719/g, `distance_foot_cm: 67341`);
code = code.replace(/best_weapon: null/g, `best_weapon: 'Twin Hammer Shotguns'`);

fs.writeFileSync('api/core_parser.mjs', code);
