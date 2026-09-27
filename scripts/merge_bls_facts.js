// scripts/merge_bls_facts.js
//
// Folds the scraped BLS figures (see scripts/fetch_bls_facts.js) into
// careers-data.js.
//
// It does two things:
//
// 1. Adds a nested `bls` object per occupation holding the sourced figures:
//    median pay and its 10th/90th percentiles, number of jobs, projected growth
//    and annual openings, SOC code, the Bureau's own entry-education and
//    training wording, and its work-environment paragraph.
//
// 2. Corrects the pre-existing flat fields (medianPay, openings, growth,
//    growthYears, demand) to the sourced values, so the card and the detail
//    view can no longer disagree about the same occupation.
//
// The 93 careers with no bls.gov url are modern roles the Occupational Outlook
// Handbook does not cover. They are left untouched; the UI hides the sourced
// block for them rather than showing an empty one.
//
// Usage: node scripts/merge_bls_facts.js

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const factsPath = process.argv[2] || path.join(ROOT, 'scripts', 'bls-facts.json');

if (!fs.existsSync(factsPath)) {
  console.error('No facts file at ' + factsPath);
  console.error('Fetch the BLS profiles first, then re-run. See scripts/fetch_bls_facts.js.');
  process.exit(1);
}

const facts = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
const byId = new Map(facts.map(f => [f.id, f]));
const dataPath = path.join(ROOT, 'careers-data.js');
delete require.cache[require.resolve(dataPath)];
const A = require(dataPath).CAREERS_ALL;

// BLS pages sometimes render the literal text "See How to Become One" in a
// Quick Facts slot instead of a value. That is a link label, not data.
const PLACEHOLDER = /see how to become one/i;
const clean = v => (v == null || PLACEHOLDER.test(String(v)) ? null : String(v).trim());
const cleanNum = v => {
  const s = clean(v);
  if (s == null) return null;
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

let enriched = 0, corrected = 0, untouched = 0;

for (const c of A) {
  const f = byId.get(c.id);
  if (!f) { untouched++; continue; }

  const outlookMatch = clean(f.jobOutlook) ? /^([\d.]+)% \((.+)\)$/.exec(clean(f.jobOutlook)) : null;

  c.bls = {
    source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook',
    socCode: clean(f.socCode),
    baseYear: clean(f.jobsBaseYear),
    medianPay: cleanNum(f.medianPay),
    medianPayHourly: f.medianPayHourly ? parseFloat(f.medianPayHourly) : null,
    payP10: cleanNum(f.payP10),
    payP90: cleanNum(f.payP90),
    numberOfJobs: cleanNum(f.numberOfJobs),
    growthPct: outlookMatch ? parseFloat(outlookMatch[1]) : null,
    growthLabel: outlookMatch ? outlookMatch[2] : null,
    growthYears: clean(f.growthYears),
    employmentChange: cleanNum(f.employmentChange),
    annualOpenings: cleanNum(f.annualOpenings),
    entryEducation: clean(f.entryEducation),
    relatedExperience: clean(f.relatedExperience),
    onTheJobTraining: clean(f.onTheJobTraining),
    workEnvironment: clean(f.workEnvironment),
  };

  if (c.bls.medianPay != null && c.medianPay !== c.bls.medianPay) { c.medianPay = c.bls.medianPay; corrected++; }
  if (c.bls.annualOpenings != null) c.openings = c.bls.annualOpenings.toLocaleString('en-US');
  if (c.bls.growthPct != null && c.bls.growthLabel) {
    const want = c.bls.growthPct + '% (' + c.bls.growthLabel + ')';
    if (c.growth !== want) { c.growth = want; corrected++; }
  }
  if (c.bls.growthYears && c.growthYears !== c.bls.growthYears) { c.growthYears = c.bls.growthYears; corrected++; }
  // The Bureau's growth figure is the authority on demand; derive from it so
  // the label and the number can never drift apart.
  if (c.bls.growthPct != null) {
    const p = c.bls.growthPct;
    c.demand = p >= 20 ? 'Very High' : p >= 10 ? 'High' : p >= 4 ? 'Moderate' : p > 0 ? 'Steady' : 'Declining';
  }
  enriched++;
}

const header =
  "if (typeof window === 'undefined') { var window = global; }\n" +
  'window.CAREERS_ALL = ';
const footer =
  '\n' +
  "if (typeof module !== 'undefined' && module.exports) { module.exports = { CAREERS_ALL: window.CAREERS_ALL }; }\n";
fs.writeFileSync(dataPath, header + JSON.stringify(A, null, 2) + footer, 'utf8');

console.log('enriched: ' + enriched + ' | untouched (no BLS url): ' + untouched);
console.log('flat fields corrected: ' + corrected);
for (const k of ['medianPay', 'payP10', 'payP90', 'numberOfJobs', 'annualOpenings', 'employmentChange', 'growthPct', 'socCode', 'entryEducation', 'workEnvironment']) {
  const n = A.filter(c => c.bls && c.bls[k] != null).length;
  console.log('  bls.' + k.padEnd(18) + n + '/' + enriched);
}

