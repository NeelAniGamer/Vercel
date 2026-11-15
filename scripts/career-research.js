/**
 * Career research analysis.
 *
 * Ranks the occupations in scripts/bls-facts.json (BLS Occupational Outlook
 * Handbook, 2025-2035 projections) by the three things that decide whether a
 * career "channel" performs and attracts attention:
 *
 *   - jobOutlook      : projected employment growth, fastest first
 *   - annualOpenings  : total openings per year, the size of the audience
 *   - medianPay       : what it pays
 *
 * Prints the evidence used by the career-research video.
 */
const fs = require('fs')
const path = require('path')

const facts = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'bls-facts.json'), 'utf8'))

const num = (v) => {
  if (v == null) return null
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}

const growthOf = (o) => {
  const m = String(o.jobOutlook || '').match(/(-?\d+(?:\.\d+)?)%/)
  return m ? Number(m[1]) : null
}

const rows = facts
  .map((o) => ({
    id: o.id,
    title: o.title,
    growth: growthOf(o),
    openings: num(o.annualOpenings),
    jobs: num(o.numberOfJobs),
    change: num(o.employmentChange),
    pay: num(o.medianPay),
    p10: num(o.payP10),
    p90: num(o.payP90),
    soc: o.socCode,
    education: o.entryEducation,
    outlook: o.jobOutlook
  }))
  .filter((r) => r.growth != null)

console.log('occupations with a parsed outlook:', rows.length, 'of', facts.length)

const top = [...rows].sort((a, b) => b.growth - a.growth).slice(0, 18)
console.log('\n=== FASTEST GROWING (BLS outlook %) ===')
console.log('career'.padEnd(34) + 'growth   openings    jobs      median pay')
for (const r of top) {
  console.log(
    r.title.slice(0, 33).padEnd(34) +
      String(r.growth + '%').padEnd(9) +
      String(r.openings || '-').padEnd(11) +
      String(r.jobs || '-').padEnd(10) +
      '$' + (r.pay || '-').toLocaleString()
  )
}

const byOpenings = [...rows].sort((a, b) => (b.openings || 0) - (a.openings || 0)).slice(0, 12)
console.log('\n=== MOST ANNUAL OPENINGS (largest audience) ===')
for (const r of byOpenings) {
  console.log(r.title.slice(0, 33).padEnd(34) + String(r.growth + '%').padEnd(9) + String(r.openings).padEnd(11) + '$' + (r.pay || '-').toLocaleString())
}

const fastAndBig = [...rows]
  .filter((r) => r.growth >= 20 && (r.openings || 0) >= 50000)
  .sort((a, b) => b.growth - a.growth)
console.log('\n=== FAST + LARGE (growth >= 20% AND >= 50k openings) ===', fastAndBig.length, 'careers')
for (const r of fastAndBig.slice(0, 14)) {
  console.log(r.title.slice(0, 33).padEnd(34) + String(r.growth + '%').padEnd(9) + String(r.openings).padEnd(11) + '$' + (r.pay || '-').toLocaleString())
}

// Aggregate: how concentrated is the attention?
const sorted = [...rows].sort((a, b) => (b.openings || 0) - (a.openings || 0))
const total = sorted.reduce((s, r) => s + (r.openings || 0), 0)
let acc = 0
let n = 0
for (const r of sorted) {
  acc += r.openings || 0
  n++
  if (acc / total >= 0.5) break
}
console.log('\ntop ' + n + ' careers account for ' + ((acc / total) * 100).toFixed(1) + '% of all annual openings (' + total.toLocaleString() + ' total)')

const growthBuckets = {}
for (const r of rows) {
  const b = r.growth >= 30 ? '30%+' : r.growth >= 20 ? '20-29%' : r.growth >= 10 ? '10-19%' : r.growth >= 5 ? '5-9%' : '0-4%'
  growthBuckets[b] = growthBuckets[b] || { n: 0, openings: 0 }
  growthBuckets[b].n++
  growthBuckets[b].openings += r.openings || 0
}
console.log('\n=== GROWTH BUCKETS ===')
for (const b of Object.keys(growthBuckets).sort()) {
  console.log(b.padEnd(9) + String(growthBuckets[b].n).padStart(4) + ' careers   ' + growthBuckets[b].openings.toLocaleString().padStart(12) + ' openings')
}

const edu = {}
for (const r of rows) {
  const e = (r.education || 'Unknown').replace(/\*$/, '')
  edu[e] = edu[e] || { n: 0, growth: 0 }
  edu[e].n++
  edu[e].growth += r.growth
}
console.log('\n=== ENTRY EDUCATION (avg growth %) ===')
for (const [e, v] of Object.entries(edu).sort((a, b) => b[1].growth / b[1].n - a[1].growth / a[1].n)) {
  console.log(e.slice(0, 32).padEnd(34) + String(v.n).padStart(4) + ' careers   avg ' + (v.growth / v.n).toFixed(1) + '%')
}
