import { parseReplay } from './api/core_parser.mjs'
import fs from 'fs'

const buf = fs.readFileSync('UnsavedReplay-2026.04.18-16.23.55.replay')

async function testHandles() {
    let best = null;
    let maxPass = 0;
    
    // We already know some:
    const known = {
        1: { field: 'shots_fired', encoding: 'IntPacked' },
        44: { field: 'wood', encoding: 'Bits11' },
        9: { field: 'metal', encoding: 'Bits11' },
        4: { field: 'damage_taken', encoding: 'IntPacked' },
        135: { field: 'builds_edited', encoding: 'IntPacked' },
        76: { field: 'kills', encoding: 'IntPacked' }
    };
    
    for (const [h, v] of Object.entries(known)) {
        process.env[`HANDLE_${v.field}`] = h;
        process.env[`ENC_${v.field}`] = v.encoding;
    }
    
    // Test others 
}
testHandles();
