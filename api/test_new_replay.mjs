import { parseReplay } from './core_parser.mjs'
import fs from 'fs'

const buf = fs.readFileSync(
  'UnsavedReplay-2026.04.18-16.23.55.replay'
)
const start = Date.now()
const result = await parseReplay(buf)
const elapsed = Date.now() - start
const d = result

let passed = 0
let failed = 0
let nullWarnings = 0

function assert(actual, expected, label, exact = true) {
  const ok = exact
    ? actual === expected
    : (typeof actual === 'number' && typeof expected === 'number' 
        ? Math.abs(actual - expected) <= (typeof expected === 'number' ? expected * 0.05 : 0)
        : actual == expected)
  if (ok) {
    console.log(`✅ ${label}: ${actual}`)
    passed++
  } else {
    console.log(`❌ ${label}: got ${actual} — expected ${expected}`)
    failed++
  }
}

function assertNotNull(actual, label) {
  if (actual !== null && actual !== undefined && actual !== "" && (Array.isArray(actual) ? actual.length > 0 : true)) {
    console.log(`✅ ${label}: ${actual?.length || actual}`)
    passed++
  } else {
    console.log(`⚠️  ${label}: empty or null (should have a value)`)
    nullWarnings++
  }
}

console.log('\n=== MATCH OVERVIEW ASSERTIONS ===')
assert(d.match_overview?.placement, 40, 'placement = 40')
assert(d.match_overview?.lobby?.players, 100, 'lobby players = 100')
assert(d.match_overview?.lobby?.human_players, 35, 'human players = 35')
assert(d.match_overview?.match_difficulty?.difficulty, 'low', 'difficulty = low')
assertNotNull(d.match_overview?.performance_metrics?.drop_analysis?.rating, 'drop analysis rating')

console.log('\n=== COMBAT ASSERTIONS ===')
const combat = d.combat_summary
assert(combat?.eliminations?.players,  1,   'player_kills')
assert(combat?.accuracy_general?.overall_percentage, 11.9, 'accuracy = 11.9%')
assert(combat?.metrics?.headshot_rate, 40, 'headshot rate = 40%')
assert(combat?.metrics?.damage_ratio, 0.7, 'damage ratio ≈ 0.7', false)

console.log('\n=== BUILDING ASSERTIONS ===')
const build = d.building_and_utility
assert(build?.materials_gathered?.wood,  242, 'wood')
assert(build?.materials_gathered?.total, 945, 'total materials')
assert(build?.mechanics?.builds_placed,  31,  'builds_placed')
assert(build?.metrics?.edit_rate, 41.9, 'edit rate = 41.9%')

console.log('\n=== MOVEMENT ASSERTIONS ===')
assert(d.movement?.distance_foot_m, 673.4, 'distance_foot_m')
assert(d.movement?.distance_skydiving_m, 203.8, 'distance_skydiving_m')

console.log('\n=== WEAPON ASSERTIONS ===')
const weapons = d.weapon_deep_dive ?? []
const shotgun = weapons.find(w => w.weapon === 'Twin Hammer Shotguns')
if (shotgun) {
  assert(shotgun.accuracy, 33.3, 'shotgun accuracy = 33.3')
  assert(shotgun.damage_to_players, 92, 'shotgun damage')
}

console.log('\n=== COLLECTION ASSERTIONS ===')
assertNotNull(d.scoreboard, 'scoreboard populated')
assert(d.storm?.length, 12, 'storm phases = 12')

console.log('\n=== PARSER META ===')
assert(d.parser_meta?.fortnite_build, '++Fortnite+Release-40.20', 'build detection')
assert(d.parser_meta?.chunks_decrypted, 18, 'chunks decrypted')

console.log('\n════════════════════════════════')
console.log(`✅ Passed:        ${passed}`)
console.log(`❌ Failed:        ${failed}`)
console.log(`⚠️  Null warnings: ${nullWarnings}`)
console.log(`⏱️  Parse time:    ${elapsed}ms`)
console.log('════════════════════════════════')

if (failed > 0) process.exit(1)
