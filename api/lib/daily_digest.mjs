import cron from 'node-cron'
import { adminDb as db } from './firebase/admin.mjs'
import { postOpsAlert } from './monitor.mjs'

export function startDailyDigest() {
  // Run at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    await runDigest()
  })
  console.log('[Digest] Midnight cron scheduled')
}

export async function runDigest() {
    console.log('[Digest] Starting daily digest generation...')

    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Query Firestore for yesterday's parses
      const parsesSnap = await db.collection('parsed_matches')
        .where('parsed_at', '>=', yesterday.toISOString())
        .get();
      
      const yesterdayParses = parsesSnap.docs
        .filter(d => d.data().parsed_at < today.toISOString());

      // Query new users
      const usersSnap = await db.collection('users')
        .where('created_at', '>=', yesterday.toISOString())
        .get();

      // Query credit transactions
      const txSnap = await db.collection('transactions')
        .where('created_at', '>=', yesterday.toISOString())
        .get();

      const totalParses = yesterdayParses.length;
      const newUsers    = usersSnap.size;
      const totalRevenue = txSnap.docs
        .filter(doc => doc.data().type === 'purchase')
        .reduce((sum, doc) => sum + (doc.data().amount_usd || 0), 0);

      const vrCount = yesterdayParses
        .filter(d => d.data().result === 'Victory Royale').length;

      // Store digest
      await db.collection('daily_stats').add({
        date: yesterday.toISOString().split('T')[0],
        total_parses: totalParses,
        new_users: newUsers,
        revenue_usd: totalRevenue,
        victory_royales: vrCount,
        created_at: new Date().toISOString()
      })

      // Post to ops Discord
      await postOpsAlert({
        title: '📊 Daily Digest',
        description: `Stats for ${yesterday.toISOString().split('T')[0]}`,
        color: 0x4f8ef7,
        fields: [
          { name: 'Parses',          value: String(totalParses), inline: true },
          { name: 'New Users',       value: String(newUsers), inline: true },
          { name: 'Revenue',         value: `$${totalRevenue.toFixed(2)}`, inline: true },
          { name: 'Victory Royales', value: String(vrCount), inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Pathgen Automated Digest' }
      })

      console.log(`[Digest] Daily stats posted for ${totalParses} parses`)
    } catch (err) {
      console.error('[Digest] Error during digest run:', err.message)
    }
}
