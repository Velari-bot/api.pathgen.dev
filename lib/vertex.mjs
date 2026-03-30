import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
dotenv.config();

const project = process.env.GOOGLE_CLOUD_PROJECT || 'pathgen-dev';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

const vertex_ai = new VertexAI({ project: project, location: location });

// Model configuration
const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    responseMimeType: 'application/json',
  },
});

/**
 * Base function to call Gemini and parse JSON safely
 */
async function callGemini(prompt) {
  try {
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const text = response.candidates[0].content.parts[0].text;
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('[Gemini JSON Error] Original:', text);
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
      time_alive: d.match_overview?.performance_metrics?.time_alive,
      kills: d.combat_summary?.eliminations?.players,
      ai_kills: d.combat_summary?.eliminations?.ai,
      damage_dealt: d.combat_summary?.damage?.to_players,
      damage_taken: d.combat_summary?.damage?.from_players,
      accuracy: d.combat_summary?.accuracy?.overall_percentage,
      headshot_rate: d.combat_summary?.accuracy?.headshot_rate,
      builds_placed: d.building_and_utility?.mechanics?.builds_placed,
      builds_edited: d.building_and_utility?.mechanics?.builds_edited,
      drop_score: d.match_overview?.performance_metrics?.drop_score,
      rotation_score: d.rotation_score?.rotation_score ?? null,
      weapons: (d.weapon_deep_dive || []).map(w => ({
        name: w.weapon,
        kills: w.elims,
        damage: w.damage_to_players,
        accuracy: w.accuracy
      }))
    };
  }

/**
 * AI Functions
 */
export async function analyzeMatch(matchData) {
  const summary = summarizeForGemini(matchData);
  return callGemini(`
You are an expert Fortnite coach. Analyze this match data and return JSON.
Structure: { 
  "summary": string, 
  "performance_tier": "elite"|"strong"|"average"|"needs_work",
  "score": number(0-100),
  "strengths": [{"title": string, "detail": string}],
  "weaknesses": [{"title": string, "detail": string}],
  "action_items": string[],
  "focus_area": string
}
Match: ${JSON.stringify(summary)}`);
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
Analyze these ${summaries.length} matches for patterns. Return JSON.
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
Analyze movement and drops to recommend a starting POI. Return JSON.
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
Explain this rotation score and how to improve. Return JSON.
Structure: {
  "explanation": string,
  "dead_zone_avoidance": string,
  "storm_surge_prep": string
}
Rotation: ${JSON.stringify(rotationData)}`);
}

export async function debriefClutchMoments(moments) {
    return callGemini(`
Analyze这些clutch moments for decision making. Return JSON.
Structure: {
  "clutch_rating": number(0-100),
  "best_moment_breakdown": string,
  "pressure_handling": string
}
Moments: ${JSON.stringify(moments)}`);
}
