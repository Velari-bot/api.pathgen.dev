import { getState, setState, isFirstRun } from '../state.js'

export async function checkPlaylists() {
  const res   = await fetch('https://fortnite-api.com/v1/playlists')
  const data  = await res.json()
  const items = data.data ?? []

  const currentNames = new Set(items.map(p => p.name))

  if (isFirstRun('playlists')) {
    setState('playlists', [...currentNames])
    console.log(`[Playlists] Baseline: ${currentNames.size}`)
    return null
  }

  const lastNames = new Set(getState('playlists') ?? [])
  const added     = [...currentNames].filter(n => !lastNames.has(n))
  const removed   = [...lastNames].filter(n => !currentNames.has(n))

  if (added.length === 0 && removed.length === 0) return null

  setState('playlists', [...currentNames])
  console.log(`[Playlists] +${added.length} -${removed.length}`)
  return { type: 'playlists', added, removed }
}
