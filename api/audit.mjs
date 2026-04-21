import { parseReplay } from './core_parser.mjs';
import { readFileSync } from 'fs';
const buf = readFileSync(
  '/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay'
);
const result = await parseReplay(buf);
console.log('confidence:', JSON.stringify(result.parser_meta?.confidence));
console.log('placement:', result.match_overview?.placement);
console.log('kills:', result.combat_summary?.eliminations?.players);
console.log('accuracy:', result.combat_summary?.accuracy_general?.overall_percentage);
console.log('time_alive_ms:', result.match_overview?.performance_metrics?.time_alive_ms);
console.log('--- everything else ---');
console.log('damage_to_players:', result.combat_summary?.damage?.to_players);
console.log('shots_fired:', result.combat_summary?.accuracy_general?.total_shots);
console.log('wood:', result.building_and_utility?.materials_gathered?.wood);
console.log('health_healed:', result.combat_summary?.survival?.health_healed);
console.log('\nFull output size:', JSON.stringify(result).length, 'bytes');
