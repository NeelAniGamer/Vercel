// Fact-check helper: counts the real data behind the claims used across the site.
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const careers = read('careers-data.js')
const ids = [...careers.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1])
console.log('career entries:', ids.length, '| unique ids:', new Set(ids).size)

const countries = read('Terra3D/countryData.js')
const body = countries.slice(countries.indexOf('{'))
const topKeys = [...body.matchAll(/^ {2}"([^"]+)": \{/gm)].map((m) => m[1])
console.log('Terra3D countries:', topKeys.length)

const registry = read('Traffic/level-catalog.js')
const levelIds = new Set([...registry.matchAll(/id:\s*["']([^"']+)["']/g)].map((m) => m[1]))
console.log('Traffic level-catalog ids:', levelIds.size)

const levelFiles = fs.readdirSync(path.join(root, 'Traffic', 'levels'))
console.log('Traffic level files:', levelFiles.length)

const civic = read('civiclogic.html')
const mva = new Set([...civic.matchAll(/MVA-\d+/gi)].map((m) => m[0]))
console.log('civiclogic distinct MVA refs:', mva.size)

const db = read('Database_Logic.html')
const dbMva = new Set([...db.matchAll(/MVA-\d+/gi)].map((m) => m[0]))
console.log('Database_Logic distinct MVA refs:', dbMva.size)
