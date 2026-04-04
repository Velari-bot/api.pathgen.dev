import { getState, setState, isFirstRun } from '../state.js'

const STATUS_URL = 'https://status.epicgames.com/api/v2/status.json'

export async function checkEpicStatus() {
  const res = await fetch(STATUS_URL)
  const data = await res.json()

  const indicator = data.status?.indicator // none/minor/major/critical
  const description = data.status?.description

  if (isFirstRun('epic_status')) {
    setState('epic_status', { indicator, description })
    return null
  }

  const last = getState('epic_status')
  if (indicator === last.indicator) return null

  setState('epic_status', { indicator, description })

  const wasDown = ['major', 'critical'].includes(last.indicator)
  const isDown  = ['major', 'critical'].includes(indicator)

  return {
    type: 'epic_status',
    previous: last.indicator,
    current: indicator,
    description,
    recovered: wasDown && !isDown,
    outage: !wasDown && isDown
  }
}
