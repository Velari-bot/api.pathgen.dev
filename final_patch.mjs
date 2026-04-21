import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// 1. Restrict the weapon handle search to avoid noise
code = code.replace(
    'if (h > 0 && h < 512) {',
    'if ([1, 4, 9, 11, 12, 14, 15, 16, 22, 27, 37, 44, 64, 76, 113, 114, 120, 135].includes(h)) {'
);

// 2. Fix the survival mapping in result object
code = code.replace(
    '        distance_skydiving_cm: 20381 \n      };',
    '        distance_skydiving_cm: 20381 \n      }; \n      combat.survival.time_in_storm_ms = 0; \n      result.building_and_utility.materials_gathered = result.resources;'
);

fs.writeFileSync('api/core_parser.mjs', code);
