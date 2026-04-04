import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, '../state.json')

function loadAll() {
  try {
    if (!fs.existsSync(STATE_FILE)) return {}
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveAll(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

export function getState(key) {
  return loadAll()[key] ?? null
}

export function setState(key, value) {
  const all = loadAll()
  all[key] = value
  saveAll(all)
}

export function isFirstRun(key) {
  return getState(key) === null
}
