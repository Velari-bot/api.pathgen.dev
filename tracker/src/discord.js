function getWebhookUrl(category) {
  return process.env[`DISCORD_WEBHOOK_${category}`]
      || process.env.DISCORD_WEBHOOK_ALL
      || null
}

export async function postEmbed(category, embed) {
  const url = getWebhookUrl(category)

  if (!url) {
    console.log(`[Discord] No webhook for ${category} — skipping`)
    return
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username:   'Pathgen Updates',
        embeds: [embed]
      })
    })

    if (res.status === 429) {
      const data = await res.json()
      const wait = (data.retry_after ?? 5) * 1000
      console.warn(`[Discord] Rate limited. Waiting ${wait}ms`)
      await new Promise(r => setTimeout(r, wait))
      return postEmbed(category, embed)
    }

    if (!res.ok) {
      console.error(`[Discord] HTTP ${res.status}`)
    } else {
      console.log(`[Discord] ✓ Posted ${category}`)
    }
  } catch (err) {
    console.error(`[Discord] Error: ${err.message}`)
  }
}

// ─── Embed builders ───────────────────────────────

export function patchEmbed(oldBuild, newBuild, image) {
  return {
    title: '🔄 New Fortnite Update Detected',
    description: 'AES encryption key has rotated. A new patch is live.',
    color: 0xa78bfa,
    fields: [
      { name: 'Previous Build', value: `\`${oldBuild}\``, inline: true },
      { name: 'New Build',      value: `\`${newBuild}\``, inline: true }
    ],
    image: image ? { url: image } : { url: 'https://fortnite-api.com/images/map_en.png' },
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker' }
  }
}

export function lootPoolEmbed(vaulted, unvaulted, image) {
  const fields = []

  if (vaulted.length > 0) fields.push({
    name: `Vaulted (${vaulted.length})`,
    value: vaulted.map(w => `- ${w}`).join('\n'),
    inline: true
  })

  if (unvaulted.length > 0) fields.push({
    name: `Unvaulted (${unvaulted.length})`,
    value: unvaulted.map(w => `- ${w}`).join('\n'),
    inline: true
  })

  return {
    title: '🔫 BR Loot Pool Update',
    description: 'affects casual and comp',
    color: vaulted.length > 0 ? 0xf87171 : 0x4ade80,
    fields,
    image: image ? { url: image } : { url: 'https://fortnite-api.com/images/map_en.png' },
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker' }
  }
}

export function shopEmbed(newItems, removedCount, image) {
  const fields = []

  if (newItems.length > 0) fields.push({
    name: `New This Rotation (${newItems.length})`,
    value: newItems
      .slice(0, 10)
      .map(i => `• ${i.name}${i.price ? ` — ${i.price} V-Bucks` : ''}`)
      .join('\n') + (newItems.length > 10 ? `\n+${newItems.length - 10} more` : ''),
    inline: false
  })

  if (removedCount > 0) fields.push({
    name: 'Rotated Out',
    value: `${removedCount} item${removedCount !== 1 ? 's' : ''}`,
    inline: false
  })

  return {
    title: '🛒 Item Shop Updated',
    color: 0x4f8ef7,
    fields,
    image: image ? { url: image } : { url: 'https://fortnite-api.com/images/map_en.png' },
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker' }
  }
}

export function cosmeticsEmbed(items, image) {
  const grouped = {}
  for (const item of items) {
    const type = item.type?.displayValue ?? 'Other'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(item.name)
  }

  const fields = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([type, names]) => ({
      name: `${type} (${names.length})`,
      value: names.slice(0, 8).join('\n')
           + (names.length > 8 ? `\n+${names.length - 8} more` : ''),
      inline: true
    }))

  return {
    title: `✨ ${items.length} New Cosmetic${items.length !== 1 ? 's' : ''} Added`,
    color: 0xfbbf24,
    fields,
    image: image ? { url: image } : { url: 'https://fortnite-api.com/images/map_en.png' },
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker' }
  }
}

export function newsEmbed(item) {
  return {
    title: '📰 ' + (item.title || 'Fortnite News Update'),
    description: item.body || '',
    color: 0x4ade80,
    image: item.image ? { url: item.image } : { url: 'https://fortnite-api.com/images/map_en.png' },
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker' }
  }
}

export function epicStatusEmbed(change) {
  const isOutage = change.outage
  return {
    title: isOutage
      ? '🔴 Fortnite Servers Down'
      : '🟢 Fortnite Servers Restored',
    description: change.description,
    color: isOutage ? 0xf87171 : 0x4ade80,
    fields: [
      { name: 'Previous', value: change.previous, inline: true },
      { name: 'Current',  value: change.current,  inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker • Epic Status Monitor' }
  }
}

export function playlistEmbed(added, removed, image) {
  const fields = []

  if (added.length > 0) fields.push({
    name: `Added (${added.length})`,
    value: added.slice(0, 15).map(p => `+ ${p}`).join('\n')
         + (added.length > 15 ? `\n+ ${added.length - 15} more` : ''),
    inline: true
  })

  if (removed.length > 0) fields.push({
    name: `Removed (${removed.length})`,
    value: removed.slice(0, 15).map(p => `- ${p}`).join('\n')
         + (removed.length > 15 ? `\n- ${removed.length - 15} more` : ''),
    inline: true
  })

  return {
    title: '🎮 Playlist Update',
    color: 0x60a5fa,
    fields,
    image: image ? { url: image } : { url: 'https://fortnite-api.com/images/map_en.png' },
    timestamp: new Date().toISOString(),
    footer: { text: 'Pathgen Tracker' }
  }
}
