import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) {
  console.warn('[Email] RESEND_API_KEY not set — emails will not be sent')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export async function sendLowCreditAlert(userEmail, creditsRemaining) {
  if (!RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: 'Pathgen <alerts@pathgen.dev>',
      to: userEmail,
      subject: 'Your Pathgen credits are running low',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2>You have ${creditsRemaining} credits remaining</h2>
          <p>Your Pathgen balance is running low. Top up to keep
             parsing replays without interruption.</p>
          <a href="https://platform.pathgen.dev/dashboard/credits"
             style="display:inline-block;background:#111;color:#fff;
                    padding:12px 24px;border-radius:8px;
                    text-decoration:none;font-weight:600">
            Buy Credits
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">
            Starter pack — 5,000 credits for $4.99
          </p>
        </div>
      `
    })
    console.log(`[Email] Low credit alert sent to ${userEmail}`)
  } catch (err) {
    console.error(`[Email] Failed to send low credit alert: ${err.message}`)
  }
}

export async function sendWelcomeEmail(userEmail, displayName) {
  if (!RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: 'Pathgen <hello@pathgen.dev>',
      to: userEmail,
      subject: 'Welcome to Pathgen — here is how to get started',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2>Welcome to Pathgen, ${displayName}</h2>
          <p>You have 100 free credits to get started. 🚀
             Here is everything you need:</p>
          <ul>
            <li>Get your API key at
                <a href="https://platform.pathgen.dev/dashboard/keys">
                platform.pathgen.dev/dashboard/keys</a></li>
            <li>Read the quickstart guide at
                <a href="https://platform.pathgen.dev/docs/quickstart">
                platform.pathgen.dev/docs/quickstart</a></li>
            <li>Parse your first replay for $0.02</li>
          </ul>
          <a href="https://platform.pathgen.dev/dashboard"
             style="display:inline-block;background:#111;color:#fff;
                    padding:12px 24px;border-radius:8px;
                    text-decoration:none;font-weight:600">
            Go to Dashboard
          </a>
        </div>
      `
    })
    console.log(`[Email] Welcome email sent to ${userEmail}`)
  } catch (err) {
    console.error(`[Email] Failed to send welcome email: ${err.message}`)
  }
}

export async function sendParseReceiptEmail(userEmail, matchSummary) {
  if (!RESEND_API_KEY) return
  const { result, placement, kills, damage, creditsRemaining } = matchSummary
  try {
    await resend.emails.send({
      from: 'Pathgen <noreply@pathgen.dev>',
      to: userEmail,
      subject: `Match parsed — ${result || 'Complete'}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2>${result || 'Match Parsed'}</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px;color:#888">Placement</td>
              <td style="padding:8px;font-weight:600">#${placement}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#888">Kills</td>
              <td style="padding:8px;font-weight:600">${kills}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#888">Damage</td>
              <td style="padding:8px;font-weight:600">${damage}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#888">Credits remaining</td>
              <td style="padding:8px;font-weight:600">${creditsRemaining}</td>
            </tr>
          </table>
          <a href="https://platform.pathgen.dev/dashboard"
             style="display:inline-block;background:#111;color:#fff;
                    padding:12px 24px;border-radius:8px;margin-top:16px;
                    text-decoration:none;font-weight:600">
            View Full Analysis
          </a>
        </div>
      `
    })
    console.log(`[Email] Parse receipt sent to ${userEmail}`)
  } catch (err) {
    console.error(`[Email] Failed to send parse receipt: ${err.message}`)
  }
}

export async function sendWeeklyCoachingEmail(
  email, name, { matchCount, coaching, weekStart }
) {
  if (!RESEND_API_KEY) return
  const trend = {
    improving:  '📈 You improved this week',
    declining:  '📉 Tough week — here is how to bounce back',
    consistent: '➡️ Consistent performance this week'
  }[coaching.trend] || '📊 Weekly Review'

  try {
    await resend.emails.send({
      from: 'Pathgen Coach <coach@pathgen.dev>',
      to: email,
      subject: `${trend} — ${matchCount} matches reviewed`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2>Weekly Report — ${weekStart}</h2>
          <p>${coaching.headline}</p>
          <div style="background:#f5f5f5;padding:16px;
                      border-radius:8px;margin:16px 0">
            <p><strong>Top Strength:</strong>
               ${coaching.top_strength}</p>
            <p><strong>Focus Area:</strong>
               ${coaching.focus_area}</p>
            <p><strong>This Week's Tip:</strong>
               ${coaching.weekly_tip}</p>
          </div>
          <p style="color:#888;font-size:13px">
            Based on ${matchCount} matches this week
          </p>
          <a href="https://platform.pathgen.dev/dashboard"
             style="display:inline-block;background:#111;
                    color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;
                    font-weight:600">
            View Full Stats
          </a>
        </div>
      `
    })
    console.log(`[Email] Coaching email sent to ${email}`)
  } catch (err) {
    console.error(`[Email] Failed to send coaching email: ${err.message}`)
  }
}
