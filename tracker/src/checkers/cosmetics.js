import { getState, setState, isFirstRun } from '../state.js'

export async function checkCosmetics() {
  const res   = await fetch('https://fortnite-api.com/v2/cosmetics/new')
  const data  = await res.json()
  
  // v2/cosmetics/new grouped by category. br items are under .br.
  const itemsBr = data.data?.items?.br ?? []
  const items = itemsBr
  const build = data.data?.build ?? ''

  if (isFirstRun('cosmetics')) {
    setState('cosmetics', { build, ids: items.map(i => i.id) })
    console.log(`[Cosmetics] Baseline: ${items.length} items`)
    return null
  }

  const last = getState('cosmetics')
  if (build === last.build) return null

  const lastIdSet = new Set(last.ids ?? [])
  const newIds    = items.map(i => i.id).filter(id => !lastIdSet.has(id))

  setState('cosmetics', { build, ids: items.map(i => i.id) })

  if (newIds.length === 0) return null

  const newItems = items.filter(i => newIds.includes(i.id))
  console.log(`[Cosmetics] ${newItems.length} new items`)
  
  return {
    type: 'cosmetics',
    items: newItems,
    image: newItems[0]?.images?.icon || newItems[0]?.images?.smallIcon
  }
}
