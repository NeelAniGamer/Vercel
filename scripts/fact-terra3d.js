/**
 * Canonical country count for Terra3D.
 *
 * countryData.js stores 196 top-level keys: 194 country records plus two lunar
 * easter eggs. Sixteen of those records are aliases of the same nation under a
 * different name ("Swaziland" / "Eswatini", "Ivoire" / "Ivory Coast", ...).
 *
 * This script resolves the aliases so the number published on the site is
 * reproducible rather than hand-maintained.
 */
const fs = require('fs')
const path = require('path')

const src = fs.readFileSync(path.resolve(__dirname, '..', 'Terra3D', 'countryData.js'), 'utf8')
const keys = [...src.matchAll(/^ {2}"([^"]+)": \{/gm)].map((m) => m[1])

// alias -> canonical name already present in the dataset
const ALIASES = {
  'Trinidad & Tobago': 'Trinidad and Tobago',
  'Solomon Is.': 'Solomon Islands',
  'Marshall Is.': 'Marshall Islands',
  'Federated States of Micronesia': 'Micronesia',
  'Dem. Rep. Congo': 'Democratic Republic of the Congo',
  'Central African Rep.': 'Central African Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  Swaziland: 'Eswatini',
  Ivoire: 'Ivory Coast',
  'S. Sudan': 'South Sudan',
  'Czech Rep.': 'Czechia',
  'Czech Republic': 'Czechia',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Dem. Rep. Korea': 'North Korea',
  'Dominican Rep.': 'Dominican Republic',
  'N. Caledonia': 'New Caledonia'
}

const easterEggs = keys.filter((k) => /moon/i.test(k))
const records = keys.filter((k) => !/moon/i.test(k))
const countries = new Set(records.map((k) => ALIASES[k] || k))
const aliasCount = records.filter((k) => ALIASES[k]).length

console.log('dataset keys        :', keys.length)
console.log('easter eggs         :', easterEggs.join(', '))
console.log('country records     :', records.length)
console.log('alias records       :', aliasCount)
console.log('unique countries    :', countries.size)
console.log('')
console.log('Publish this number:', countries.size)
