import { VertexAI } from '@google-cloud/vertexai';

const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'pathgen-dev', // Fallback for local dev
  location: 'us-central1'
});

const model = vertex.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,    // lower = more consistent analysis
    topP: 0.8
  }
});

/**
 * Single Match AI Coach
 */
export async function generateCoach(matchData) {
  const prompt = buildCoachPrompt(matchData);
  const result = await model.generateContent(prompt);
  const text = result.response.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

/**
 * Tournament Session AI Coach (Multi-match pattern recognition)
 */
export async function generateSessionCoach(matches) {
  const prompt = buildSessionPrompt(matches);
  const result = await model.generateContent(prompt);
  const text = result.response.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

/**
 * Weapon Mastery AI Analysis
 */
export async function generateWeaponCoach(matchData) {
    const w = matchData.weapon_deep_dive;
    const s = matchData.combat_summary;
    const prompt = `
You are an expert Fortnite weapon coach. 
Analyze this weapon performance data and identify inefficiencies.

OVERALL COMBAT:
- Kills: ${s.eliminations.players}
- Damage to Players: ${s.damage.to_players}
- Accuracy: ${s.accuracy.overall_percentage}

WEAPON BREAKDOWN:
${w.map(wp => `- ${wp.weapon} (${wp.rarity}): ${wp.elims} kills, ${wp.damage_to_players} dmg, ${wp.accuracy} accuracy`).join('\n')}

Identify if they are using the wrong weapon for their range, if their accuracy is specific to a weapon type, or if they are switching too early/late.

Respond in this exact JSON format:
{
  "summary": "1-2 sentence overall weapon usage summary",
  "ideal_loadout": ["weapon 1", "weapon 2", "weapon 3"],
  "weapon_critiques": [
    { "weapon": "Name", "status": "Great|Bad", "reason": "Specific reasoning with numbers" }
  ],
  "technical_improvement": "One mechanical tip for their specific accuracy profile"
}

Return only valid JSON.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

/**
 * Optimal Drop Recommendation
 */
export async function generateDropRecommendation(matchData) {
    const start = matchData.movement.bus_route;
    const drop = matchData.movement.drop_location;
    const survival = matchData.match_overview.performance_metrics.time_alive;
    
    // Future expansion: pass a history of last 10 drops
    const prompt = `
You are a Fortnite strategy coach.
Bus Route: ${JSON.stringify(start)}
Actual Drop: ${JSON.stringify(drop)}
Survival Time: ${survival}

Analyze this drop vs the survival time. Suggest a better alternative drop for this specific bus route.

Respond in this JSON format:
{
  "analysis": "1-2 sentence analysis of current drop",
  "recommendation": "POI name",
  "reasoning": "Strategy on why this was better",
  "landing_tip": "Specific landing advice for this POI (e.g. land roof of Big House)"
}

Return only valid JSON.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

/**
 * Player Scouting Report
 */
export async function generateOpponentScout(playerName, stats) {
    const prompt = `
You are a competitive Fortnite analyst. Provide a scouting report for player: ${playerName}

STATS:
${JSON.stringify(stats, null, 2)}

Identify their playstyle (Aggressive, Passive, IGL, Support).

Respond in this JSON format:
{
  "player": "${playerName}",
  "playstyle": "Aggressive|Passive|Balanced",
  "threat_level": "High|Medium|Low",
  "strengths": ["string"],
  "how_to_beat": "Specific advice based on their stats patterns"
}

Return only valid JSON.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

// Prompt builders
function buildCoachPrompt(data) {
  const s = data.combat_summary;
  const b = data.building_and_utility;
  const m = data.match_overview;
  const w = data.weapon_deep_dive;

  return `
You are an expert Fortnite Battle Royale coach.
Analyze this match and give specific, data-driven feedback.

MATCH RESULT: ${m.result} — ${m.placement}/${m.lobby.players}
MODE: ${m.mode}
TIME ALIVE: ${m.performance_metrics.time_alive}
DROP SCORE: ${m.performance_metrics.drop_score}

COMBAT:
  Kills: ${s.eliminations.players} player + ${s.eliminations.ai} AI
  Damage dealt: ${s.damage.to_players}
  Damage taken: ${s.damage.from_players}
  Damage ratio: ${s.damage.player_damage_ratio}
  Accuracy: ${s.accuracy.overall_percentage}
  Shots fired: ${s.accuracy.total_shots}
  Hits to players: ${s.accuracy.hits_to_players}
  Headshots: ${s.accuracy.headshots} (${s.accuracy.headshot_rate})

SURVIVAL:
  Health healed: ${s.survival.health_healed}
  Shield healed: ${s.survival.shield_healed}
  Health taken: ${s.survival.health_taken}
  Shield taken: ${s.survival.shield_taken}
  Time in storm: ${s.survival.time_in_storm_ms / 1000}s
  Distance on foot: ${(s.survival.distance_foot_cm / 100).toFixed(0)}m

BUILDING:
  Builds placed: ${b.mechanics.builds_placed}
  Builds edited: ${b.mechanics.builds_edited}
  Wood: ${b.materials_gathered.wood}
  Stone: ${b.materials_gathered.stone}
  Metal: ${b.materials_gathered.metal}

WEAPONS:
${w.map(wp => `  ${wp.weapon} (${wp.rarity}): ${wp.elims} kills, ${wp.damage_to_players} dmg, ${wp.accuracy} accuracy`).join('\n')}

Respond in this exact JSON format:
{
  "summary": "2-3 sentence overall summary",
  "performance_tier": "elite|strong|average|needs_work",
  "strengths": [
    { "title": "short title", "detail": "specific observation with numbers" },
    { "title": "short title", "detail": "specific observation with numbers" },
    { "title": "short title", "detail": "specific observation with numbers" }
  ],
  "weaknesses": [
    { "title": "short title", "detail": "specific observation with numbers" },
    { "title": "short title", "detail": "specific observation with numbers" },
    { "title": "short title", "detail": "specific observation with numbers" }
  ],
  "action_items": [
    "specific actionable tip 1",
    "specific actionable tip 2",
    "specific actionable tip 3"
  ],
  "focus_area": "one thing to focus on for the next 10 games"
}

Return only valid JSON. No markdown, no explanation outside the JSON.
`;
}

function buildSessionPrompt(matches) {
  const summary = matches.map((m, i) => ({
    game: i + 1,
    placement: m.match_overview.placement,
    kills: m.combat_summary.eliminations.players,
    damage: m.combat_summary.damage.to_players,
    accuracy: m.combat_summary.accuracy.overall_percentage,
    time_alive: m.match_overview.performance_metrics.time_alive,
    builds: m.building_and_utility.mechanics.builds_placed,
    materials_total: (
      m.building_and_utility.materials_gathered.wood +
      m.building_and_utility.materials_gathered.stone +
      m.building_and_utility.materials_gathered.metal
    )
  }));

  return `
You are an expert Fortnite tournament coach analyzing
a 6-game competitive session.

SESSION DATA:
${JSON.stringify(summary, null, 2)}

Analyze patterns across all 6 games. Look for:
- Consistency trends (improving, declining, volatile)
- Recurring problems that appear in multiple games
- Games where performance was significantly different and why
- Tournament-specific advice (placement points vs kill points)

Respond in this exact JSON format:
{
  "session_summary": "3-4 sentence overall session analysis",
  "total_points": number,
  "consistency_grade": "A|B|C|D|F",
  "best_game": number,
  "worst_game": number,
  "patterns": [
    "specific pattern observed across multiple games"
  ],
  "tournament_advice": "specific advice for competitive play",
  "next_session_focus": "one key area to improve"
}

Return only valid JSON.
`;
}
