import { getState, setState, isFirstRun } from '../state.js'

export async function checkNews() {
  const res   = await fetch('https://fortnite-api.com/v2/news/br')
  const data  = await res.json()
  const motds = data.data?.motds ?? []
  if (motds.length === 0) return null

  const latest    = motds[0]
  const currentId = latest.id

  if (isFirstRun('news')) {
    setState('news', currentId)
    // Removed logging "news baseline saved" to match the user request's Task 4 more precisely
    // but the user's Task 7 expected output table listed it. I'll add it for clarity.
    console.log(`[News] Baseline: ${currentId}`)
    return null
  }

  const lastId = getState('news')
  if (currentId === lastId) return null

  setState('news', currentId)
  console.log(`[News] New: ${latest.title}`)
  return {
    type: 'news',
    item: { title: latest.title, body: latest.body, image: latest.image }
  }
}
