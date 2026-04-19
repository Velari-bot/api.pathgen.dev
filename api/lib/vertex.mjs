import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

/**
 * PathGen Future-Proof AI Coaching Engine
 * Migrated to Google Generative AI SDK (v1.2.6)
 * Removes deprecation warnings and improves model response latency.
 */

// Use GOOGLE_AI_KEY from environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    responseMimeType: "application/json",
  },
});

/**
 * Base function to call Gemini and parse JSON safely
 */
async function callGemini(prompt) {
  try {
    if (!process.env.GOOGLE_AI_KEY) {
        console.error('[Gemini API Warning]: Missing GOOGLE_AI_KEY in environment variables.');
        return null;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
        console.error('[Gemini API] Empty response body');
        return null;
    }

    try {
        const cleaned = text.trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('[Gemini JSON Error] Failed to parse response:', e.message);
        console.error('[Gemini Raw Output]:', text.slice(0, 500));
        return null;
    }
  } catch (err) {
    console.error('[Gemini API Error]:', err.message);
    return null;
  }
}

/**
 * Summarize match data for token efficiency
 */
function summarizeForGemini(d) {
    if (!d) return {};
    return {
      result: d.match_overview?.result,
      placement: d.match_overview?.placement,
      total_players: d.match_overview?.lobby?.players,
      human_players: d.match_overview?.lobby?.human_players,
      difficulty: d.match_overview?.match_difficulty?.difficulty,
      time_alive: d.match_overview?.performance_metrics?.time_alive,
      kills: d.combat_summary?.eliminations?.total,
      player_kills: d.combat_summary?.eliminations?.players,
      damage_dealt: d.combat_summary?.damage?.to_players,
      damage_taken: d.combat_summary?.damage?.from_players,
      accuracy: d.combat_summary?.accuracy_general?.overall_percentage,
      headshot_rate: d.combat_summary?.metrics?.headshot_rate,
      damage_ratio: d.combat_summary?.metrics?.damage_ratio,
      builds_placed: d.building_and_utility?.mechanics?.builds_placed,
      builds_edited: d.building_and_utility?.mechanics?.builds_edited,
      edit_rate: d.building_and_utility?.metrics?.edit_rate,
      drop_score: d.match_overview?.performance_metrics?.drop_score,
      actual_drop_time: d.match_overview?.performance_metrics?.actual_drop_time,
      weapons: (d.weapon_deep_dive || []).map(w => ({
        name: w.weapon,
        damage: w.damage_to_players,
        hits: w.hits_to_players,
        accuracy: w.accuracy
      }))
    };
  }

/**
 * Unified Analytics Suite
 */

export async function analyzeMatch(matchData) {
  const summary = summarizeForGemini(matchData);
  const prompt = `
    SYSTEM: You are a professional Fortnite FNCS coach. 
    Analyze the provided match JSON and return a surgical, high-value coaching report in JSON format.
    
    Structure: { 
      "summary": "2-3 sentences explaining exactly how they died and why", 
      "performance_tier": "elite"|"strong"|"average"|"needs_work",
      "score": number(0-100),
      "strengths": [{"title": string, "detail": string}],
      "weaknesses": [{"title": string, "detail": string}],
      "action_items": ["3 specific actionable tips based on their stats"],
      "focus_area": "one word theme (e.g. Aim, Rotation, Building)"
    }

    Match Data: ${JSON.stringify(summary)}
  `;
  return callGemini(prompt);
}

export async function coachMatch(matchData) {
    const summary = summarizeForGemini(matchData);
    return callGemini(`
You are an elite tactical coach. Provide deep match coaching in JSON.
Structure: {
  "early_game": string,
  "mid_game": string,
  "late_game": string,
  "tactical_errors": string[],
  "mechanics_review": string
}
Match: ${JSON.stringify(summary)}`);
}

export async function coachSession(matches) {
    const summaries = matches.map(m => summarizeForGemini(m));
    return callGemini(`
Analyze these ${summaries.length} matches for professional patterns. Return JSON.
Structure: {
  "trend": "improving"|"declining"|"stable",
  "consistency_score": number(0-100),
  "repeated_mistakes": string[],
  "session_summary": string
}
Data: ${JSON.stringify(summaries)}`);
}

export async function coachWeapons(weaponData) {
    return callGemini(`
Analyze weapon performance and return JSON.
Structure: {
  "best_weapon": string,
  "worst_weapon": string,
  "accuracy_critique": string,
  "loadout_recommendation": string
}
Weapons: ${JSON.stringify(weaponData)}`);
}

export async function recommendDrop(movement, historicalDrops) {
    return callGemini(`
Analyze movement and drop history to recommend a starting POI. Return JSON.
Structure: {
  "poi": string,
  "reasoning": string,
  "risk_level": "low"|"medium"|"high"
}
History: ${JSON.stringify(historicalDrops)}`);
}

export async function scoutOpponent(opponentName, history) {
    return callGemini(`
Create a scouting report for ${opponentName}. Return JSON.
Structure: {
  "playstyle": string,
  "threat_level": "very_high"|"high"|"medium"|"low",
  "tendencies": string[],
  "counter_strategy": string
}
History: ${JSON.stringify(history)}`);
}

export async function reviewRotation(rotationData) {
    return callGemini(`
Analyze this high-precision rotation score (0-100). Return JSON.
Structure: {
  "explanation": string,
  "dead_zone_avoidance": string, // Explanation of how user avoided dead zones
  "storm_surge_prep": string // Tactical critique of storm surge preparation
}
Rotation: ${JSON.stringify(rotationData)}`);
}

export async function debriefClutchMoments(moments) {
    return callGemini(`
Analyze these high-pressure 'Clutch Moments' for decision making. Return JSON.
Structure: {
  "clutch_rating": number(0-100),
  "best_moment_breakdown": string,
  "pressure_handling": string
}
Moments: ${JSON.stringify(moments)}`);
}

/**
 * Weekly Review Engine
 */
export async function generateWeeklyCoach(matches) {
  const summary = {
    match_count: matches.length,
    avg_kills: avg(matches.map(m => m.kills || 0)),
    avg_damage: avg(matches.map(m => m.damage_to_players || 0)),
    avg_accuracy: avg(matches.map(m => parseFloat(m.accuracy || '0'))),
    avg_placement: avg(matches.map(m => m.placement || 100)),
    win_count: matches.filter(m => m.result === 'Victory Royale').length,
    total_builds: matches.reduce((s, m) => s + (m.builds_placed || 0), 0),
    total_kills: matches.reduce((s, m) => s + (m.kills || 0), 0)
  };

  return callGemini(`
You are a professional Fortnite coach reviewing a player's week. 
Summarize their performance based on these stats for ${summary.match_count} matches:

  Average kills:     ${summary.avg_kills.toFixed(1)}
  Average damage:    ${summary.avg_damage.toFixed(0)}
  Average accuracy:  ${summary.avg_accuracy.toFixed(1)}%
  Average placement: #${summary.avg_placement.toFixed(0)}
  Wins this week:    ${summary.win_count}
  Total kills:       ${summary.total_kills}
  Total builds:      ${summary.total_builds}

Return valid JSON only in this structure:
{
  "headline": "one sentence summary of their week",
  "trend": "improving"|"declining"|"consistent",
  "top_strength": "their best area this week",
  "focus_area": "one thing to work on next week",
  "weekly_tip": "one specific actionable tip"
}
  `);
}

function avg(arr) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}
