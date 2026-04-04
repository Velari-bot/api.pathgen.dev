import cron from 'node-cron'
import { adminDb as db } from './firebase/admin.mjs'
import { sendWeeklyCoachingEmail } from './email.mjs'
import { generateWeeklyCoach } from './vertex.mjs'

export function startWeeklyCoaching() {
  // Run at 8am UTC every Monday
  cron.schedule('0 8 * * 1', async () => {
    await runWeeklyCoaching()
  })
  console.log('[WeeklyCoach] Monday 8am cron scheduled')
}

export async function runWeeklyCoaching() {
    console.log('[WeeklyCoach] Starting weekly coaching run...')

    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const parsesSnap = await db.collection('parsed_matches')
        .where('parsed_at', '>=', weekAgo.toISOString())
        .get();

      const byUser = {}
      for (const doc of parsesSnap.docs) {
        const data = doc.data()
        if (!data.user_id) continue
        if (!byUser[data.user_id]) byUser[data.user_id] = []
        byUser[data.user_id].push(data)
      }

      // Filter for users with 5+ parses
      const activeUserIds = Object.keys(byUser).filter(id => byUser[id].length >= 5)
      console.log(`[WeeklyCoach] ${activeUserIds.length} active users detected (5+ matches this week)`)

      for (const userId of activeUserIds) {
        const matches = byUser[userId]
        try {
          // Get user email
          const userDoc = await db.collection('users').doc(userId).get()
          const user    = userDoc.data()
          if (!user?.email || user.email_coaching === false) {
             console.log(`[WeeklyCoach] Skipping ${userId} (no email or opting out)`)
             continue
          }

          const coaching = await generateWeeklyCoach(matches)
          if (!coaching) {
             console.warn(`[WeeklyCoach] Gemini failed for ${user.email}`)
             continue
          }

          await sendWeeklyCoachingEmail(user.email, user.display_name, {
            matchCount: matches.length,
            coaching,
            weekStart: weekAgo.toISOString().split('T')[0]
          })

          console.log(`[WeeklyCoach] Sent coaching report to ${user.email}`)
          await new Promise(r => setTimeout(r, 1000)) // Rate limit protection
        } catch (err) {
          console.error(`[WeeklyCoach] Error for ${userId}:`, err.message)
        }
      }
      console.log(`[WeeklyCoach] Weekly coaching run completed`)
    } catch (err) {
      console.error('[WeeklyCoach] Fatal run error:', err.message)
    }
}
