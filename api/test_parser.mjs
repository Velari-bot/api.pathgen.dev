import fs from 'fs';
import { parseReplay } from './core_parser.mjs';

const buf = fs.readFileSync('/Users/aidenbender/Desktop/replay engine/UnsavedReplay-2026.03.15-17.47.25.replay');
const result = await parseReplay(buf);
console.log(JSON.stringify(result, null, 2));
