// Calibration harness for compass-scoring.js.
//
// The scoring lives in compass-scoring.js at the repo root because Career.html
// loads it. This file holds the answer profiles and the assertions, and is not
// shipped: build.js excludes scripts/ from dist/.
//
// These checks are what stopped the first attempt at this scoring from being
// wrong in ways that looked fine. Asserting only that "it runs" would have passed
// a version whose top result for a medicine profile was an accountant.

'use strict';

const path = require('path');
const compass = require(path.join(__dirname, '..', 'compass-scoring.js'));
const CAREERS = require(path.join(__dirname, '..', 'careers-data.js')).CAREERS_ALL;

const { runCompass } = compass;

// --- calibration ------------------------------------------------------------
// The old engine's failure was a distribution with no spread and a badge that
// meant nothing. These are the properties that matter, and run() asserts all of
// them. Ties are explicitly NOT a failure: many careers genuinely suit the same
// person, and pretending otherwise would be its own lie. What is checked is
// that the *leaders are right* - a health profile must surface clinicians.
const PROFILES = [
  {
    name: 'PCB, medicine, caring, masters',
    a: { stream: 'pcb', degrees: ['health'], interests: ['health', 'people'], edu: 'master', field: 'Healthcare & Medicine' },
    expect: ['ooh-244-pharmacists', 'ooh-29-pharmacists', 'physiotherapy', 'ooh-249-physical-therapists', 'dentistry'],
    expectLoose: /pharmac|physio|dentist|nurs|therap|physician|surgeon|medical/i,
  },
  {
    name: 'PCM, engineering, tech, bachelors',
    a: { stream: 'pcm', degrees: ['engineering', 'computing'], interests: ['tech'], edu: 'bachelor', field: 'Engineering & Robotics' },
    expectLoose: /electr|mechanic|software|engineer|comput|civil|structural|developer/i,
  },
  {
    name: 'Commerce, business, numbers',
    a: { stream: 'commerce', degrees: ['commerce', 'management'], interests: ['business', 'numbers'], edu: 'bachelor', field: 'Business & Finance' },
    expectLoose: /account|financ|analyst|bank|market|consult|econom/i,
  },
  {
    name: 'Arts, design, visual',
    a: { stream: 'arts', degrees: ['arts', 'design'], interests: ['design'], edu: 'bachelor', field: 'Creative Arts & Design' },
    expectLoose: /design|artist|illustrat|animat|architect|film|photo|graphic/i,
  },
  {
    name: 'Vocational, hands-on, outdoors, diploma',
    a: { stream: 'voc', degrees: ['vocational'], interests: ['build', 'outdoors'], edu: 'diploma', field: 'Skilled Trades & Craft' },
    expectLoose: /electric|plumb|carpent|weld|mason|roof|glaz|paint|iron|install/i,
  },
  {
    name: 'No degree, driving and outdoors',
    a: { stream: 'voc', degrees: [], interests: ['outdoors', 'transport'], edu: 'nodegree', field: 'Skilled Trades & Craft' },
    expectLoose: /driver|delivery|taxi|laborer|mover|rider|draft|truck/i,
  },
  {
    name: 'Law and words',
    a: { stream: 'arts', degrees: ['law'], interests: ['words'], edu: 'bachelor', field: 'Law & Public Safety' },
    expectLoose: /law|legal|attorney|judge|paralegal|court|compliance|police/i,
  },
  {
    name: 'Environment and outdoors',
    a: { stream: 'pcm', degrees: ['science', 'engineering'], interests: ['eco', 'outdoors'], edu: 'bachelor', field: 'Sustainability & Energy' },
    expectLoose: /environment|sustainab|renewable|ecolog|conserv|forestry|climat|solar|wind/i,
  },
  {
    name: 'Teaching and words',
    a: { stream: 'arts', degrees: ['education', 'arts'], interests: ['teaching', 'people'], edu: 'bachelor', field: 'Education & Academia' },
    expectLoose: /teacher|educat|instructor|lecturer|tutor|professor|faculty/i,
  },
  {
    name: 'Broad, undecided (worst case for spread)',
    a: { stream: 'any', degrees: ['engineering', 'commerce', 'arts'], interests: ['tech', 'people', 'business'], edu: 'bachelor', field: '', diversify: true },
    expectLoose: null,
    // Deliberately broad answers, so a broad list is the correct output and
    // flatness is not a fault here. What must still hold is that the leaders
    // are not twenty variations of one career - a student who cannot choose
    // should at least be shown genuinely different options.
    diversity: true,
  },
];

function run() {
  let fail = 0;
  let warned = 0;
  const title = new Map(CAREERS.map(c => [c.id, c.title]));

  for (const p of PROFILES) {
    const r = runCompass(CAREERS, p.a);
    const fits = r.map(x => x.fit);
    const top = fits[0];
    const median = fits[Math.floor(fits.length / 2)];
    const p90 = fits[Math.floor(fits.length * 0.9)];
    const top20 = r.slice(0, 20).map(x => x.id);
    const topTitles = r.slice(0, 6).map(x => title.get(x.id));

    const problems = [];
    const warnings = [];
    if (top < 85) problems.push('best fit ' + top + '% - even the top option looks weak');
    const atTop = fits.filter(f => f >= top - 1).length;
    if (!p.diversity) {
      // Flatness is the real failure mode: if the median is close to the top,
      // the list gives the student nothing to choose between.
      if (median > 55) problems.push('median ' + median + '% against a top of ' + top + '% - the list is flat');
      if (top - p90 < 15) problems.push('only ' + (top - p90) + ' points separate the best from the top 10%');
      // Ties are a warning, not a failure. A vocational student who likes
      // building and the outdoors genuinely suits 20-odd trades, and those
      // careers carry near-identical degree and interest tags in the source
      // data, so there is nothing honest left to separate them with. Adding a
      // signal invented purely to break this tie would be worse than the tie.
      if (atTop > 14) warnings.push(atTop + ' careers within 1 point of the best - expected where many careers share the same tags');
    }
    if (p.diversity) {
      const cats = new Set(r.slice(0, 15).map(x => (CAREERS.find(c => c.id === x.id) || {}).catName));
      if (cats.size < 5) problems.push('only ' + cats.size + ' distinct fields in the top 15 for a deliberately broad profile');
    }

    // The real test: are the leaders plausible for this profile?
    let sanity = 'n/a (no expectation)';
    if (p.expectLoose) {
      const hits = top20.filter(id => p.expectLoose.test(title.get(id)));
      sanity = hits.length + '/20 leaders match the expected field';
      if (hits.length < 3) problems.push('only ' + hits.length + ' of the top 20 look right - leaders are implausible');
    }
    if (p.expect) {
      const missing = p.expect.filter(id => !top20.includes(id) && CAREERS.some(c => c.id === id));
      if (missing.length) sanity += ' | missing expected: ' + missing.join(', ');
    }
    if (!r[0].reasons.filter(x => x.pts > 0).length) problems.push('top result gives no positive reasons');

    console.log('\n' + p.name);
    console.log('  top ' + top + '%  p90 ' + p90 + '%  median ' + median + '%');
    console.log('  leaders: ' + topTitles.join(' | '));
    console.log('  ' + sanity);
    console.log('  why: ' + r[0].reasons.map(x => (x.pts > 0 ? '+' : '') + x.text).join('; '));
    if (problems.length) { fail++; problems.forEach(x => console.log('  PROBLEM: ' + x)); }
    else {
      if (warnings.length) { warned++; warnings.forEach(x => console.log('  note: ' + x)); }
      else console.log('  ok');
    }
  }
  return { fail, warned };
}



if (require.main === module) {
  const { fail, warned } = run();
  console.log('\n' + (fail
    ? fail + ' profile(s) failed calibration'
    : 'all profiles calibrated' + (warned ? ' (' + warned + ' with an expected tie)' : '')));
  process.exit(fail ? 1 : 0);
}
