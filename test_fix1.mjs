import { parseReplay } from './core_parser.mjs';
import fs from 'fs';

async function test() {
    if (!fs.existsSync('Game2.replay')) {
        console.log('Game2.replay not found');
        return;
    }
    const buf = fs.readFileSync('Game2.replay');
    const result = await parseReplay(buf);

    const track = result.movement.player_track || [];
    const stormPhases = result.storm || [];

    const perPhase = [];
    let totalScore = 0;
    for (const phase of stormPhases) {
        // Find closest track point to phase.timestamp_ms
        const pt = track.reduce((prev, curr) => 
            Math.abs(curr.timestamp_ms - phase.timestamp_ms) < Math.abs(prev.timestamp_ms - phase.timestamp_ms) ? curr : prev
        );

        const dx = pt.x - phase.center_x;
        const dy = pt.y - phase.center_y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const inside = dist < phase.radius_cm;
        const centerPct = Math.max(0, 1 - (dist / phase.radius_cm));

        let phaseScore = 0;
        let timing = "outside";

        if (inside) {
            if (centerPct > 0.5) { phaseScore = 100; timing = "deep_zone"; }
            else if (centerPct > 0.25) { phaseScore = 80; timing = "safe"; }
            else { phaseScore = 60; timing = "edge"; }
        } else {
            if (dist < phase.radius_cm * 1.1) { phaseScore = 30; timing = "late"; }
            else { phaseScore = 0; timing = "outside"; }
        }

        totalScore += phaseScore;
        perPhase.push({
            phase: phase.phase,
            score: phaseScore,
            dist: Math.round(dist),
            inside,
            timing
        });
    }

    const avgScore = Math.round(totalScore / stormPhases.length);
    console.log('Rotation Score:', avgScore);
    let grade = "D";
    if (avgScore >= 90) grade = "S";
    else if (avgScore >= 75) grade = "A";
    else if (avgScore >= 60) grade = "B";
    else if (avgScore >= 45) grade = "C";
    console.log('Grade:', grade);
    console.log('Per Phase:', JSON.stringify(perPhase, null, 2));
}

test();
