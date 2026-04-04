import { getState, setState, isFirstRun } from '../state.js'

export async function checkWeapons() {
  // Fallback: /v2/weapons is 404, using v2/cosmetics/br?type=weapon for baseline items
  const res  = await fetch('https://fortnite-api.com/v2/cosmetics/br?type=weapon')
  const data = await res.json()

  const weapons    = data.data ?? []
  const currentMap = Object.fromEntries(weapons.map(w => [w.id, { name: w.name, image: w.images?.icon }]))
  const currentIds = new Set(Object.keys(currentMap))

  if (isFirstRun('weapons')) {
    setState('weapons', currentMap)
    console.log(`[Weapons] Baseline: ${currentIds.size} weapons`)
    return null
  }

  const lastMap = getState('weapons')
  const lastIds = new Set(Object.keys(lastMap))

  const addedIds   = [...currentIds].filter(id => !lastIds.has(id))
  const removedIds = [...lastIds].filter(id => !currentIds.has(id))

  if (addedIds.length === 0 && removedIds.length === 0) return null

  setState('weapons', currentMap)

  const unvaulted = addedIds.map(id => currentMap[id])
  const vaulted   = removedIds.map(id => lastMap[id])

  console.log(`[Weapons] Vaulted: ${vaulted.map(v => v.name).join(', ') || 'none'}`)
  console.log(`[Weapons] Unvaulted: ${unvaulted.map(u => u.name).join(', ') || 'none'}`)
  
  return {
    type: 'loot_pool',
    vaulted:   vaulted.map(v => v.name),
    unvaulted: unvaulted.map(u => u.name),
    image:     unvaulted[0]?.image || vaulted[0]?.image
  }
}
