import { adminDb } from './admin.mjs';

/**
 * PathGen Firestore Match Storage Engine
 * Saves processed match data for cross-session analytics and historical tracking.
 */

export async function saveMatchToFirestore(matchData, userEmail = "guest") {
  if (!adminDb) {
    console.warn('[Firestore Save Skip] Firebase Admin not initialized.');
    return null;
  }

  const sessionId = matchData.match_overview?.session_id || `match_${Date.now()}`;
  
  try {
    const matchRef = adminDb.collection('matches').doc(sessionId);
    
    // Prepare the document with indexing-friendly fields at top level
    const matchDoc = {
      ...matchData,
      _metadata: {
        uploader: userEmail,
        saved_at: new Date().toISOString(),
        parser_version: matchData.parser_meta?.file_version || 7,
        is_processed: true
      }
    };

    await matchRef.set(matchDoc, { merge: true });
    
    // Also update the player's match history list for fast lookup
    if (userEmail !== "guest") {
      const userRef = adminDb.collection('users').doc(userEmail);
      await userRef.collection('match_history').doc(sessionId).set({
        timestamp: matchData.match_overview?.timestamp || new Date().toISOString(),
        placement: matchData.match_overview?.placement || 0,
        kills: matchData.combat_summary?.eliminations?.total || 0,
        result: matchData.match_overview?.result || "Eliminated"
      });
    }

    console.log(`[Firestore] Saved match ${sessionId}`);
    return sessionId;
  } catch (err) {
    console.error(`[Firestore Error] Failed to save match ${sessionId}:`, err.message);
    return null;
  }
}
