import 'dotenv/config'
import cron from 'node-cron'
import { checkAES }        from './checkers/aes.js'
import { checkWeapons }    from './checkers/weapons.js'
import { checkShop }       from './checkers/shop.js'
import { checkCosmetics }  from './checkers/cosmetics.js'
import { checkNews }       from './checkers/news.js'
import { checkPlaylists }  from './checkers/playlists.js'
import { checkEpicStatus } from './checkers/epicstatus.js'
import { getState, setState, isFirstRun } from './state.js'
import {
  postEmbed, patchEmbed, lootPoolEmbed,
  shopEmbed, cosmeticsEmbed, newsEmbed, playlistEmbed, epicStatusEmbed
} from './discord.js'

function updateWeekly(key, additions) {
  const all = getState('weekly_changes') || {
    week_start: new Date().toISOString().split('T')[0],
    vaulted: [], unvaulted: [], patches: [], new_cosmetics_count: 0
  }
  
  if (Array.isArray(additions)) {
    all[key] = [...new Set([...all[key], ...additions])]
  } else if (typeof additions === 'number') {
    all[key] += additions
  }
  
  setState('weekly_changes', all)
}

const CHECKERS = [
  {
    name: 'AES',
    fn: checkAES,
    post: async c => {
      await postEmbed('PATCH', patchEmbed(c.oldBuild, c.newBuild, c.image))
      updateWeekly('patches', [c.newBuild])
    }
  },
  {
    name: 'Weapons',
    fn: checkWeapons,
    post: async c => {
      await postEmbed('LOOT', lootPoolEmbed(c.vaulted, c.unvaulted, c.image))
      updateWeekly('vaulted', c.vaulted)
      updateWeekly('unvaulted', c.unvaulted)
    }
  },
  {
    name: 'Shop',
    fn: checkShop,
    post: c => postEmbed('SHOP', shopEmbed(c.newItems, c.removedCount, c.image))
  },
  {
    name: 'Cosmetics',
    fn: checkCosmetics,
    post: async c => {
      await postEmbed('COSMETICS', cosmeticsEmbed(c.items, c.image))
      updateWeekly('new_cosmetics_count', c.items.length)
    }
  },
  {
    name: 'News',
    fn: checkNews,
    post: c => postEmbed('NEWS', newsEmbed(c.item))
  },
  {
    name: 'Playlists',
    fn: checkPlaylists,
    post: c => postEmbed('PLAYLISTS', playlistEmbed(c.added, c.removed, c.image))
  },
  {
    name: 'Epic Status',
    fn: checkEpicStatus,
    post: c => postEmbed('NEWS', epicStatusEmbed(c))
  }
]

async function runChecks() {
  console.log(`\n[${new Date().toISOString()}] Running checks...`)

  for (const checker of CHECKERS) {
    try {
      const change = await checker.fn()

      if (change) {
        console.log(`[${checker.name}] Change detected — posting`)
        await checker.post(change)
      }
    } catch (err) {
      console.error(`[${checker.name}] Error: ${err.message}`)
    }

    // Stagger requests to fortnite-api.com
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('[Done]')
}

// Run immediately on startup
await runChecks()

// Then on schedule
const interval = parseInt(process.env.CHECK_INTERVAL_SECONDS || '60')
cron.schedule(`*/${interval} * * * * *`, runChecks)

// 2A — Weekly Meta Summary (Monday 9am UTC)
cron.schedule('0 9 * * 1', async () => {
  const weekly = getState('weekly_changes')
  if (!weekly) return

  await postEmbed('LOOT', {
    title: "📋 Weekly Fortnite Meta Summary",
    description: `Everything that changed since ${weekly.week_start}`,
    color: 0x4f8ef7,
    fields: [
      { name: "Patches",       value: weekly.patches.join(', ') || 'none' },
      { name: "Vaulted",       value: weekly.vaulted.join('\n').slice(0, 500) || 'none' },
      { name: "Unvaulted",     value: weekly.unvaulted.join('\n').slice(0, 500) || 'none' },
      { name: "New Cosmetics", value: `${weekly.new_cosmetics_count} items added` }
    ],
    footer: { text: "Pathgen Weekly Review" },
    timestamp: new Date().toISOString()
  })

  // Reset for next week
  setState('weekly_changes', {
    week_start: new Date().toISOString().split('T')[0],
    vaulted: [], unvaulted: [], patches: [], new_cosmetics_count: 0
  })
})

// 2B — Daily Shop Summary (9am UTC)
cron.schedule('0 9 * * *', async () => {
  const res  = await fetch('https://fortnite-api.com/v2/shop/br')
  const data = await res.json()

  const entries = [
    ...(data.data?.featured?.entries || []),
    ...(data.data?.daily?.entries || [])
  ]

  const items = entries
    .map(e => ({
      name:  e.items?.[0]?.name,
      price: e.finalPrice,
      rarity: e.items?.[0]?.rarity?.displayValue
    }))
    .filter(i => i.name)
    .slice(0, 20)

  await postEmbed('SHOP', {
    title: "🛒 Today's Item Shop",
    description: items
      .map(i => `• **${i.name}** — ${i.price} V-Bucks`)
      .join('\n'),
    color: 0x4f8ef7,
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker • Daily Shop Summary' }
  })
})

// Print startup summary
console.log(`\nPathgen Tracker started`)
console.log(`Interval: every ${interval}s`)
console.log(`Webhooks:`)
for (const cat of ['PATCH','LOOT','SHOP','COSMETICS','NEWS','PLAYLISTS']) {
  const url = process.env[`DISCORD_WEBHOOK_${cat}`]
           || process.env.DISCORD_WEBHOOK_ALL
  console.log(`  ${cat.padEnd(12)} ${url ? '✓ configured' : '✗ not set'}`)
}
