const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const ERROR_THRESHOLD = 0.05     // 5%
const OPS_WEBHOOK = process.env.DISCORD_WEBHOOK_OPS

let recentParses = [] // { timestamp, success }

export function recordParse(success) {
  const now = Date.now()
  recentParses.push({ timestamp: now, success })
  
  // Keep only last 10 minutes
  recentParses = recentParses.filter(p =>
    now - p.timestamp < WINDOW_MS
  )
  
  checkErrorRate()
}

let lastAlertAt = 0
const ALERT_COOLDOWN_MS = 15 * 60 * 1000 // 15 min cooldown

async function checkErrorRate() {
  if (recentParses.length < 10) return // Need min sample size

  const errors = recentParses.filter(p => !p.success).length
  const total = recentParses.length
  const rate = errors / total

  console.log(`[Monitor] Pulse: ${total} parses, ${errors} errors (${(rate*100).toFixed(1)}%)`)

  if (rate >= ERROR_THRESHOLD && Date.now() - lastAlertAt > ALERT_COOLDOWN_MS) {
    lastAlertAt = Date.now()
    console.warn(`[Monitor] !!! ELEVATED ERROR RATE DETECTED: ${(rate*100).toFixed(1)}% !!!`)
    
    await postOpsAlert({
      title: '⚠️ Elevated Parse Error Rate',
      description: `${(rate * 100).toFixed(1)}% error rate in last 10 minutes`,
      color: 0xf87171,
      fields: [
        { name: 'Total Parses', value: String(total), inline: true },
        { name: 'Errors',        value: String(errors), inline: true },
        { name: 'Error Rate',    value: `${(rate * 100).toFixed(1)}%`, inline: true }
      ],
      timestamp: new Date().toISOString()
    })
  }
}

export async function postOpsAlert(embed) {
  if (!OPS_WEBHOOK) {
    console.warn('[Monitor] DISCORD_WEBHOOK_OPS not set — skipping ops alert')
    return
  }

  try {
    const res = await fetch(OPS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'Pathgen Ops', 
        embeds: [embed] 
      })
    })
    
    if (!res.ok) {
        console.error(`[Monitor] Discord API error: ${res.status}`)
    } else {
        console.log(`[Monitor] ✓ Ops alert posted to Discord`)
    }
  } catch (err) {
    console.error(`[Monitor] Failed to post ops alert: ${err.message}`)
  }
}
