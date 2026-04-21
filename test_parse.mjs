import fs from 'fs';
import { parseReplay } from './api/core_parser.mjs';

const buf = fs.readFileSync('UnsavedReplay-2026.04.18-16.23.55.replay');
parseReplay(buf).then(res => {
    console.log(JSON.stringify(res.combat_summary));
    console.log(JSON.stringify(res.resources));
    console.log(res.parser_meta.confidence.bitstream);
});
