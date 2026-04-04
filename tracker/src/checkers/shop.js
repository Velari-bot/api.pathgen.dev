import { getState, setState, isFirstRun } from '../state.js'

export async function checkShop() {
  const res  = await fetch('https://fortnite-api.com/v2/shop')
  const data = await res.json()

  const hash    = data.data?.hash
  const entries = data.data?.entries ?? []

  const currentItems = entries
    .map(e => ({
      id:    e.brItems?.[0]?.id || e.tracks?.[0]?.id || e.instruments?.[0]?.id || e.cars?.[0]?.id,
      name:  e.brItems?.[0]?.name || e.tracks?.[0]?.devName || e.devName,
      price: e.finalPrice,
      image: e.brItems?.[0]?.images?.featured || e.brItems?.[0]?.images?.icon || e.newDisplayAssetPath
    }))
    .filter(i => i.id)

  const currentIds = currentItems.map(i => i.id)

  if (isFirstRun('shop')) {
    setState('shop', { hash, ids: currentIds })
    console.log(`[Shop] Baseline: hash ${hash}`)
    return null
  }

  const last = getState('shop')
  if (hash === last.hash) return null

  const lastIdSet    = new Set(last.ids ?? [])
  const currentIdSet = new Set(currentIds)
  const addedIds     = currentIds.filter(id => !lastIdSet.has(id))
  const removedIds   = (last.ids ?? []).filter(id => !currentIdSet.has(id))

  setState('shop', { hash, ids: currentIds })

  const newItems = currentItems.filter(i => addedIds.includes(i.id))

  console.log(`[Shop] Rotation: +${newItems.length} -${removedIds.length}`)
  return {
    type: 'shop',
    newItems,
    removedCount: removedIds.length,
    image: newItems[0]?.image
  }
}
