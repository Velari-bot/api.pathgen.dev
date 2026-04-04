import { getState, setState, isFirstRun } from '../state.js'

export async function checkAES() {
  const res  = await fetch('https://fortnite-api.com/v2/aes')
  const data = await res.json()

  const current = {
    mainKey: data.data.mainKey,
    build:   data.data.build
  }

  if (isFirstRun('aes')) {
    setState('aes', current)
    console.log(`[AES] Baseline: ${current.build}`)
    return null
  }

  const last = getState('aes')
  if (current.build === last.build) return null

  setState('aes', current)
  console.log(`[AES] Patch: ${last.build} → ${current.build}`)
  
  return {
    type: 'patch',
    oldBuild: last.build,
    newBuild: current.build,
    image: 'https://fortnite-api.com/images/map_en.png'
  }
}
