/**
 * Curated figures for the "1 in 289" career-research video.
 *
 * Reads scripts/bls-facts.json (BLS Occupational Outlook Handbook 2025-2035)
 * and emits the exact numbers the composition puts on screen, so the video can
 * never disagree with the source data.
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

const all = facts.map((o) => ({
  title: o.title,
  growth: growthOf(o),
  openings: num(o.annualOpenings),
  jobs: num(o.numberOfJobs),
  change: num(o.employmentChange),
  pay: num(o.medianPay),
  education: o.entryEducation,
  soc: o.socCode
}))

const withGrowth = all.filter((r) => r.growth != null)
const totalOpenings = withGrowth.reduce((s, r) => s + (r.openings || 0), 0)

// The threshold used in the video: fast AND big.
const FAST = 20
const BIG = 50000
const winners = withGrowth.filter((r) => r.growth >= FAST && (r.openings || 0) >= BIG)

const finalists = [
  'Medical and Health Services Managers',
  'Nurse Anesthetists, Nurse Midwives, and Nurse Practitioners',
  'Data Scientists',
  'Information Security Analysts',
  'Physician Assistants'
]
  .map((t) => withGrowth.find((r) => r.title === t))
  .filter(Boolean)

const trap = [
  'Solar Photovoltaic Installers',
  'Wind Turbine Technicians',
  'Home Health and Personal Care Aides',
  'Food and Beverage Serving and Related Workers'
].map((t) => withGrowth.find((r) => r.title === t)).filter(Boolean)

const sorted = [...withGrowth].sort((a, b) => (b.openings || 0) - (a.openings || 0))
let acc = 0
let topN = 0
for (const r of sorted) {
  acc += r.openings || 0
  topN++
  if (acc / totalOpenings >= 0.5) break
}

const edu = {}
for (const r of withGrowth) {
  const e = (r.education || 'Unknown').replace(/\*$/, '')
  edu[e] = edu[e] || { n: 0, g: 0 }
  edu[e].n++
  edu[e].g += r.growth
}
const eduRows = Object.entries(edu)
  .map(([k, v]) => ({ label: k, n: v.n, avg: Number((v.g / v.n).toFixed(1)) }))
  .sort((a, b) => b.avg - a.avg)

const fmt = (n) => (n == null ? null : n)

const out = {
  source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook, 2025-2035 projections',
  generatedFrom: 'scripts/bls-facts.json',
  occupationsWithParsedOutlook: withGrowth.length,
  totalAnnualOpenings: fmt(totalOpenings),
  topCareersShareOfOpenings: Number(((acc / totalOpenings) * 100).toFixed(1)),
  topCareersCount: topN,
  thresholds: { fastGrowthPct: FAST, bigAudienceOpenings: BIG },
  careersPassingBoth: winners.map((r) => ({
    title: r.title,
    growth: r.growth,
    openings: fmt(r.openings),
    jobs: fmt(r.jobs),
    medianPay: fmt(r.pay),
    education: r.education
  })),
  finalists: finalists.map((r) => ({
    title: r.title,
    growth: r.growth,
    openings: fmt(r.openings),
    medianPay: fmt(r.pay)
  })),
  trap: trap.map((r) => ({
    title: r.title,
    growth: r.growth,
    openings: fmt(r.openings),
    medianPay: fmt(r.pay)
  })),
  educationGrowth: eduRows.slice(0, 5)
}

const dest = path.resolve(__dirname, '..', 'video', 'career-research', 'data', 'career-stats.json')
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log('wrote ' + dest)
console.log(JSON.stringify(out, null, 2))
