// scripts/fetch_bls_facts.js
//
// Pulls the Quick Facts figures for every BLS Occupational Outlook Handbook
// occupation in careers-data.js and writes them to .bls-facts.json, which
// scripts/merge_bls_facts.js then folds into the dataset.
//
// This file exists as the record of how the `bls` block in careers-data.js was
// produced. Node's own https client is rejected by bls.gov with a 403, so the
// requests have to go through a browser-shaped fetcher; the parsing below is the
// part that actually matters and is reproduced verbatim.
//
// Fields pulled per occupation, all from the profile's own Quick Facts block:
//
//   medianPay        2025 median annual wage
//   medianPayHourly  the same figure expressed hourly
//   payP10/payP90    the 10th and 90th percentile annual wages
//   numberOfJobs     employment in the base year
//   jobOutlook       projected percent change plus BLS's own label
//   employmentChange projected numeric change over the decade
//   annualOpenings   average annual openings
//   socCode          Standard Occupational Classification code
//   entryEducation   BLS's wording for typical entry-level education
//   relatedExperience  prior experience employers ask for
//   onTheJobTraining training provided after hiring
//   workEnvironment  the Bureau's own paragraph on where the work happens
//
// Two parsing traps worth keeping in mind if this is ever extended:
//
// 1. The extracted text keeps the page's own whitespace runs, so
//    "2025     Median Pay" has five spaces in it. Collapse \s+ before matching
//    or nothing matches.
//
// 2. Do not use a comma as a lookahead terminator when reading a number. With
//    /Median Pay \$([\d,]+)(?= |,|\.)/ the engine happily backtracks and
//    matches "29" out of "$29,530". Anchor on the word that follows instead.
//
// Some occupations do not publish some of these. That is left null rather than
// filled in, and the UI omits the row. A few profiles render the literal text
// "See How to Become One" in a Quick Facts slot; that is a link label, not a
// value, and is treated as absent.
//
// Usage: fetch each page with tools.fetch.fetch_html_to_text (browser
// User-Agent), run parse() over the result, and merge.

'use strict';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const num = s => (s == null ? null : String(s).replace(/[,\s]+$/, ''));

function parse(raw) {
  const t = raw.replace(/\s+/g, ' ');
  const g = (re, src) => {
    const m = (src || t).match(re);
    return m ? m[1].trim() : null;
  };
  const gy = t.match(/from (\d{4}) to (\d{4})/);

  // The work-environment paragraph, taken from the first occurrence after the
  // Quick Facts block. Using the last occurrence picks up the glossary entry at
  // the foot of every page instead.
  const qf = t.indexOf('Employment Change,');
  const wi = t.indexOf('Work Environment ', qf > 0 ? qf : 0);
  let workEnvironment = null;
  if (wi > 0) {
    const seg = t.slice(wi + 17, wi + 900);
    workEnvironment = (seg.split(' How to Become')[0] || seg.split(' Pay ')[0] || '').trim() || null;
    if (workEnvironment && workEnvironment.length > 600) workEnvironment = workEnvironment.slice(0, 600);
  }

  return {
    medianPay: num(g(/Median Pay \$([\d,]+) per year/)),
    medianPayHourly: g(/Median Pay \$[\d,]+ per year \$([\d.]+) per hour/),
    entryEducation: g(/Typical Entry-Level Education (.+?) Work Experience in a Related Occupation/),
    relatedExperience: g(/Work Experience in a Related Occupation (.+?) On-the-job Training/),
    onTheJobTraining: g(/On-the-job Training (.+?) Number of Jobs/),
    numberOfJobs: num(g(/Number of Jobs, \d{4} ([\d,]+?)(?: Job Outlook| Employment Change)/)),
    jobsBaseYear: g(/Number of Jobs, (\d{4})/),
    jobOutlook: g(/Job Outlook, \d{4}\u2013\d{2} ([\d.]+% \([^)]+\))/),
    employmentChange: num(g(/Employment Change, \d{4}\u2013\d{2} ([\d,]+?)(?: About| )/)),
    annualOpenings: num(g(/About ([\d,]+) openings for .+? are projected each year/)),
    payP10: num(g(/lowest 10 percent earned less than \$([\d,]+),/)),
    payP90: num(g(/highest 10 percent earned more than \$([\d,]+)\./)),
    socCode: g(/(?:^| )(\d{2}-\d{4})(?: |$)/),
    growthYears: gy ? gy[1] + '\u2013' + gy[2] : null,
    workEnvironment,
  };
}

// The occupations to fetch are exactly the ones carrying a bls.gov url.
function targets(careers) {
  return careers.filter(c => c.url).map(c => ({ id: c.id, title: c.title, url: c.url }));
}

module.exports = { parse, targets, UA };

if (require.main === module) {
  const careers = require('../careers-data.js').CAREERS_ALL;
  const list = targets(careers);
  console.error(
    'This script documents the extraction; it does not fetch on its own.\n' +
    'bls.gov returns 403 to Node, so requests must go through a browser-shaped\n' +
    'fetcher. ' + list.length + ' occupations to fetch. First target: ' +
    (list[0] ? list[0].url : 'none')
  );
}
