// Derive a single level catalogue from levels/*.js and course.js.
//
// TrafficDashboard.html does not load the level files (it is a read-only
// analytics view), so it used to carry a hand-written _LEVEL_NAMES array that
// had drifted completely out of date — level 1 was listed as "Free Roam" when
// levels/level1.js is "Red Light Patience". This produces the real thing so the
// dashboard's level search can never invent a lesson that does not exist.
//
// The output is loaded by the dashboard as a plain script and is also the
// authority for the total level count, replacing the hardcoded "/52" strings.
//
// Regenerate with:  node tools/gen-level-catalog.js
const fs = require('fs')
const path = require('path')

const trafficRoot = path.join(__dirname, '..')
const levelsDir = path.join(trafficRoot, 'levels')

// level files assign `id`, `icon` and `name` at the top of a window.LVS.push({…}).
// Read them textually rather than executing: the level files reference THREE
// and window globals that do not exist in Node.
function readLevels() {
  const out = []
  const files = fs.readdirSync(levelsDir).filter((f) => f.endsWith('.js'))
  for (const file of files.sort()) {
    const src = fs.readFileSync(path.join(levelsDir, file), 'utf8')
    // A single file can register more than one level — levels/level_custom.js
    // pushes both `custom` and `custom_downtown` — so split on the push calls
    // and read each object literal independently.
    const chunks = src.split(/window\.LVS\.push\(\{/).slice(1)
    if (chunks.length === 0) {
      console.warn(`skipping ${file}: no window.LVS.push({ found`)
      continue
    }
    for (const chunk of chunks) {
      // ids are numeric for lessons but string for the free-roam entries.
      const idNum = chunk.match(/^\s*id:\s*(\d+)\s*,/m)
      const idStr = chunk.match(/^\s*id:\s*'([^']+)'\s*,/m)
      const icon = chunk.match(/^\s*icon:\s*'([^']*)'\s*,/m)
      const name = chunk.match(/^\s*name:\s*'([^']*)'\s*,/m)
      const theme = chunk.match(/^\s*themeType:\s*'([^']*)'\s*,/m)
      if ((!idNum && !idStr) || !name) {
        console.warn(`skipping a level in ${file}: could not read id/name`)
        continue
      }
      out.push({
        id: idNum ? Number(idNum[1]) : idStr[1],
        numericId: !!idNum,
        name: name[1],
        icon: icon ? icon[1] : '🚦',
        theme: theme ? theme[1] : '',
        file
      })
    }
  }
  return out
}

// A one-line description for the dashboard's result cards. The level files carry
// long `briefing`/`ds` prose that is wrong to show in a search result, so derive
// a short line from the level's own themeType.
const THEME_DESCRIPTIONS = {
  ambulance_priority: 'Yielding to ambulances and emergency vehicles',
  animals: 'Animal and livestock awareness on the road',
  auto_dance: 'Auto-rickshaw lane discipline',
  blind_corner: 'Approaching blind corners and occluded views',
  bus_stop: 'Bus stop priority and passenger right-of-way',
  construction: 'Construction zones and temporary signage',
  cyclist: 'Cyclist awareness and lane sharing',
  driving_school: 'Learner-driver and instructor rules',
  festival: 'Crowd and festival traffic management',
  free_roam: 'Open-ended practice, no time limit',
  grand_test: 'Combined final assessment across all skills',
  highway_merge: 'Highway merge, lane change and signage',
  hill_driving: 'Gradient, hairpins and mountain roads',
  hospital_quiet: 'Hospital zone silence and patient priority',
  intersection_mastery: 'Signal, junction and right-of-way rules',
  lane_discipline: 'Lane discipline, overtaking and patience',
  market_street: 'Market street congestion and loading zones',
  mountain: 'Hill and mountain road handling',
  multi_modal: 'Mixed transport modes sharing the road',
  narrow_street: 'Narrow streets and tight manoeuvres',
  night_monsoon: 'Night visibility, glare and rain',
  no_honking: 'Silence zones and horn restraint',
  one_way: 'One-way streets and correct entry',
  parking_rules: 'Parking legality and kerb behaviour',
  pedestrian_courtesy: 'Crossing, yielding and footpath discipline',
  pedestrian_priority: 'Pedestrian priority at crossings',
  puddle_etiquette: 'Puddle avoidance and splash etiquette',
  rain_driving: 'Wet-grip driving in the monsoon',
  respectful_parking: 'Considerate parking near junctions',
  road_rage: 'Managing anger and road rage',
  rural: 'Rural road and unmarked junction hazards',
  signal_jump: 'Red light patience and temptation to jump',
  signs: 'Traffic sign recognition and response',
  silent_zone: 'Silent zones near schools and hospitals',
  street_parking: 'Street parking legality and etiquette',
  suburban_neighborhood: 'Residential speed and crossing discipline',
  toll: 'Toll lane merging and payment',
  urban_grid: 'Dense city grid navigation',
  wrong_side: 'Wrong-side driving consequences',
  zero_visibility: 'Driving in near-zero visibility'
}

function shortDescription(level) {
  return THEME_DESCRIPTIONS[level.theme] || 'Traffic scenario'
}

const levels = readLevels()

// course.js MODULES is the other place that claims to know which lessons exist.
// Read it first so "numbered lesson" means "registered in MODULES" rather than
// a hardcoded ceiling that drifts the moment a lesson is added.
const courseSrc = fs.readFileSync(path.join(trafficRoot, 'course.js'), 'utf8')
const modulesBlock = courseSrc.slice(
  courseSrc.indexOf('const MODULES'),
  courseSrc.indexOf('const CAMPAIGNS')
)
const courseIds = new Set()
for (const m of modulesBlock.matchAll(/id:\s*(\d+)\s*,\s*name:/g)) courseIds.add(Number(m[1]))

const numbered = levels.filter((l) => l.numericId && courseIds.has(l.id)).sort((a, b) => a.id - b.id)
const bonus = levels.filter((l) => !numbered.includes(l))

const out = `// GENERATED by Traffic/tools/gen-level-catalog.js. Do not edit by hand.
// The single source of truth for level identity and the total level count,
// loaded by TrafficDashboard.html which does not pull in the level files.
window.LEVEL_CATALOG = {
  // ${numbered.length} numbered lessons plus ${bonus.length} free-roam/bonus entries.
  total: ${levels.length},
  numberedTotal: ${numbered.length},
  bonusTotal: ${bonus.length},
  levels: [
${numbered
  .map(
    (l) =>
      `    { id: ${l.id}, name: ${JSON.stringify(l.name)}, icon: ${JSON.stringify(
        l.icon
      )}, desc: ${JSON.stringify(shortDescription(l))} },`
  )
  .join('\n')}
  ],
  bonus: [
${bonus
  .map(
    (l) =>
      `    { id: ${JSON.stringify(l.id)}, name: ${JSON.stringify(l.name)}, icon: ${JSON.stringify(
        l.icon
      )}, desc: 'Open-ended scenario, no time limit' },`
  )
  .join('\n')}
  ]
};
`
fs.writeFileSync(path.join(trafficRoot, 'level-catalog.js'), out)

console.log(`numbered lessons: ${numbered.length} (registered in course.js MODULES)`)
console.log(`bonus entries:   ${bonus.length}`)
console.log(`total:           ${levels.length}`)
console.log('wrote Traffic/level-catalog.js')

// Surface drift rather than silently publishing it. ids >= 99 are the free-roam
// sentinels (level_freeram.js registers id 99 alongside the string-id entries)
// and are intentionally outside the graded MODULES curriculum.
const orphans = levels
  .filter((l) => l.numericId && !courseIds.has(l.id) && l.id < 99)
  .map((l) => `${l.id} (${l.file})`)
if (orphans.length) {
  console.log('')
  console.log(`WARNING: ${orphans.length} numeric level(s) are not registered in course.js MODULES:`)
  console.log('  ' + orphans.join(', '))
  console.log('  getLevel()/getModeConfig() return null for these. Add them to MODULES in course.js.')
}