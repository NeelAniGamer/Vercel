// Career Compass: the questions, and the scoring behind the answers.
//
// This file is loaded by Career.html and required by scripts/compass_scoring.js,
// which is the calibration harness. One implementation, tested without a browser
// and shipped as-is - a second copy inside the page would drift from this one.
//
// Why this replaced the old engine: it started every career at 50 and added at
// most 40 points from two signals - a substring test against c.stream, which has
// 76 different string values across the dataset, and an equality test against
// c.cat. Almost everything landed between 50 and 75, so the fit badge on the
// cards was noise. One of its three questions, work style, was recorded and
// then never read.
//
// Every field this scores against is 100% populated on all careers: degrees (14
// values), interests (22), edu (6), catName (12). c.stream is free text with 76
// values and is never matched directly - each stream answer instead declares
// which degree families are realistic from that stream.
//
// Calibration lives in scripts/compass_scoring.js. It asserts, for ten answer
// profiles, that the leaders are plausible for that profile and that the list is
// not flat. Weight changes are only justified if those checks still pass.

'use strict';

(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (root) root.COMPASS = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
// --- question 1: stream -----------------------------------------------------
// c.stream is free text with 76 distinct values, so it is never matched
// directly. Instead each answer declares which degree families are realistic
// from that stream, and that feeds the same degree scoring as question 2.
const STREAMS = {
  pcm:      { label: 'Science (PCM / Maths)', degrees: ['engineering', 'science', 'computing'] },
  pcb:      { label: 'Science (PCB / Biology)', degrees: ['health', 'science', 'any'] },
  commerce: { label: 'Commerce & Maths', degrees: ['commerce', 'management', 'any'] },
  arts:     { label: 'Arts & Humanities', degrees: ['arts', 'design', 'law', 'any'] },
  voc:      { label: 'Vocational / Any Stream', degrees: ['vocational', 'any', 'design'] },
};

// --- question 2: degree direction -------------------------------------------
// Maps onto the 14 values of c.degrees, grouped so a student is not choosing
// from an internal vocabulary they have never seen.
//
// "bridge" values are adjacent but not the same thing. A health degree does
// reach microbiology, so a microbiologist must not be excluded - but treating
// science as a plain match for medicine meant a patent attorney, a craft brewer
// and a VFX artist all scored 74/100 for a student who had answered nothing but
// medicine. Bridges therefore earn partial credit, and a career that only
// matches on bridges never scores like one that matches directly.
const DEGREE_GROUPS = [
  { id: 'engineering', label: 'Engineering & Technology', desc: 'Machines, circuits, structures, how things work', degrees: ['engineering', 'vocational'], bridge: [] },
  { id: 'science',     label: 'Science & Research', desc: 'Biology, chemistry, physics, earth, space', degrees: ['science'], bridge: [] },
  { id: 'computing',   label: 'Computing & Data', desc: 'Code, algorithms, data, networks, security', degrees: ['computing'], bridge: ['engineering'] },
  { id: 'health',      label: 'Medicine & Allied Health', desc: 'Clinical care, therapy, pharmacy, public health', degrees: ['health'], bridge: ['science'] },
  { id: 'commerce',    label: 'Commerce, Finance & Law', desc: 'Accounts, markets, regulation, courts', degrees: ['commerce', 'economics', 'law', 'management'], bridge: [] },
  { id: 'arts',        label: 'Arts, Design & Education', desc: 'Design, media, writing, teaching, humanities', degrees: ['arts', 'design', 'education'], bridge: ['any'] },
  { id: 'vocational',  label: 'Skilled Trades & Craft', desc: 'Hands-on technical work, on site or in a workshop', degrees: ['vocational'], bridge: ['engineering'] },
  { id: 'management',  label: 'Business & Management', desc: 'Operations, product, marketing, supply chain', degrees: ['management', 'commerce'], bridge: ['any'] },
];

// --- question 3: interests --------------------------------------------------
// Maps onto the 22 values of c.interests. Several of those values have only one
// or two careers attached (sports: 1, creative: 1, art: 3, space: 2), so they
// are folded into the groups below rather than offered as their own options.
// Same direct/bridge split as above: science is adjacent to health and ecology
// but is not a substitute for either.
const INTEREST_GROUPS = [
  { id: 'tech',      label: 'Technology & Code', desc: 'Software, systems, networks, data', interests: ['tech', 'numbers'], bridge: ['machines'] },
  { id: 'build',     label: 'Making & Engineering', desc: 'Building, machines, fabrication, infrastructure', interests: ['build', 'machines'], bridge: ['design'] },
  { id: 'health',    label: 'Health & Biology', desc: 'Medicine, care, therapy, life sciences', interests: ['health'], bridge: ['science'] },
  { id: 'design',    label: 'Design & Art', desc: 'Visual work, craft, making things look right', interests: ['design', 'art', 'creative'], bridge: [] },
  { id: 'people',    label: 'People & Teaching', desc: 'Working with people, teaching, caring, leading', interests: ['people', 'teaching', 'social'], bridge: [] },
  { id: 'business',  label: 'Business & Money', desc: 'Markets, strategy, operations, growth', interests: ['business', 'numbers'], bridge: [] },
  { id: 'words',     label: 'Writing & Communication', desc: 'Language, media, law, persuasion', interests: ['words', 'law'], bridge: ['social'] },
  { id: 'outdoors',  label: 'Outdoors, Transport & Sport', desc: 'Fieldwork, driving, sport, land, air', interests: ['outdoors', 'transport', 'sport', 'sports'], bridge: ['space'] },
  { id: 'eco',       label: 'Ecology & Food', desc: 'Environment, agriculture, climate, food systems', interests: ['eco', 'food'], bridge: ['science'] },
];

// --- question 4: how much study ---------------------------------------------
// Maps onto c.edu. ordered low to high so "willing to go further than this"
// can be scored, which is the question students actually care about.
const EDU_LEVELS = [
  { id: 'nodegree',  label: 'Start working now', desc: 'No degree needed, or learn while you earn', rank: 1 },
  { id: 'diploma',   label: 'Diploma or ITI', desc: 'A focused 1-3 year qualification', rank: 2 },
  { id: 'bachelor',  label: "Bachelor's degree", desc: 'A standard 3 or 4 year degree', rank: 3 },
  { id: 'master',    label: 'Master\'s Degree', desc: 'A specialisation after your bachelor\'s', rank: 4 },
  { id: 'doctorate', label: 'Doctorate or research', desc: 'A PhD, or a professional doctorate', rank: 5 },
];

// --- question 5: field of work ----------------------------------------------
// Maps onto c.catName, which is one of exactly 12 strings across the dataset.
const FIELDS = [
  { id: 'Technology & AI', label: 'Technology & Computing', desc: 'Software, data, security, electronics' },
  { id: 'Engineering & Robotics', label: 'Engineering & Industry', desc: 'Machines, construction, manufacturing, energy' },
  { id: 'Healthcare & Medicine', label: 'Health & Medicine', desc: 'Clinical care, therapy, pharmacy, research' },
  { id: 'Business & Finance', label: 'Business & Finance', desc: 'Management, markets, consulting, commerce' },
  { id: 'Law & Public Safety', label: 'Law, Government & Safety', desc: 'Courts, policing, armed forces, regulation' },
  { id: 'Education & Academia', label: 'Education & Teaching', desc: 'Schools, universities, training, research' },
  { id: 'Skilled Trades & Craft', label: 'Skilled Trades & Craft', desc: 'Hands-on technical and craft work' },
  { id: 'Creative Arts & Design', label: 'Creative Arts & Media', desc: 'Design, media, writing, performance' },
  { id: 'Aviation & Aerospace', label: 'Aviation & Aerospace', desc: 'Flight, space, aviation services' },
  { id: 'Sustainability & Energy', label: 'Energy & Environment', desc: 'Renewables, climate, sustainability' },
  { id: 'Science & DeepTech', label: 'Science & Deep Tech', desc: 'Research, quantum, biotech, advanced materials' },
  { id: 'Human Care & Services', label: 'Care & Personal Services', desc: 'Hospitality, protection, personal service' },
];

// --- weights ----------------------------------------------------------------
// Absolute, not normalised. An earlier version scaled every profile against its
// own best career, which meant every single answer set topped out at 92% and
// the badge on the card told the student nothing. Now 100 means "matched
// everything you said", and a career outside the field you picked cannot reach
// it however well it matches elsewhere.
//
// Degree and interests are what a student is actually choosing between, so they
// carry the most. Field is treated as a filter rather than a bonus, because
// "I want to work in health" should keep a legal career out of the top ten
// even if its degree and interests line up.
const W = { degree: 30, interest: 26, edu: 16, stream: 10, field: 18, precision: 16 };

// A career tagged 'any' is a genuine match for any degree direction, but weaker
// than a career that names the degree. Without this, a single 'any' career
// outranks everything for every answer combination.
const ANY_DEGREE_CREDIT = 0.55;
// How much a bridge tag is worth against a direct one. Health reaches science
// and science reaches a lot, so without a discount a patent attorney matched a
// medicine degree as strongly as a physiotherapist did.
const BRIDGE_CREDIT = 0.35;
// Similar for interests: a career listing many interests is broader, so each
// additional shared interest counts slightly less. Without this, careers with
// 10 tags beat specialists on every profile.
const interestDecay = n => (n <= 1 ? 1 : n === 2 ? 0.85 : n === 3 ? 0.72 : 0.6);

function scoreCareer(c, a) {
  const reasons = [];
  let score = 0;

  // 1. degree direction
  const pickedDegrees = new Set();
  const bridgeDegrees = new Set();
  const pickedDegreeLabels = [];
  for (const gid of a.degrees || []) {
    const g = DEGREE_GROUPS.find(x => x.id === gid);
    if (!g) continue;
    g.degrees.forEach(d => pickedDegrees.add(d));
    (g.bridge || []).forEach(d => bridgeDegrees.add(d));
    pickedDegreeLabels.push(g);
  }
  const careerDegrees = new Set(c.degrees || []);
  const careerIsAny = careerDegrees.has('any');
  const directHits = [...pickedDegrees].filter(d => careerDegrees.has(d));
  // A value selected directly in one group and bridged from another still
  // counts as a direct hit, otherwise picking Science and Medicine together
  // would penalise a science degree for being in both lists.
  const bridgeHits = [...bridgeDegrees].filter(d => careerDegrees.has(d) && !pickedDegrees.has(d));

  let degreePts = 0;
  if (directHits.length) {
    degreePts = W.degree * Math.min(1, 0.45 + 0.35 * directHits.length + 0.10 * bridgeHits.length);
    const label = pickedDegreeLabels.find(g => g.degrees.some(d => careerDegrees.has(d)));
    reasons.push({ q: 'degree', pts: Math.round(degreePts), text: 'Matches your ' + (label ? label.label.toLowerCase() : 'degree direction') });
  } else if (bridgeHits.length) {
    degreePts = W.degree * (0.45 + 0.10 * bridgeHits.length);
    reasons.push({ q: 'degree', pts: Math.round(degreePts), text: 'Adjacent to your degree direction, not a direct route' });
  } else if (careerIsAny && pickedDegreeLabels.length) {
    degreePts = W.degree * ANY_DEGREE_CREDIT;
    reasons.push({ q: 'degree', pts: Math.round(degreePts), text: 'Open to any degree direction' });
  } else {
    reasons.push({ q: 'degree', pts: 0, text: 'Not a route from your degree direction' });
  }
  score += degreePts;

  // 2. interests, with diminishing returns per extra match and partial credit
  // for a bridge tag
  const pickedInterests = new Set();
  const bridgeInterests = new Set();
  for (const gid of a.interests || []) {
    const g = INTEREST_GROUPS.find(x => x.id === gid);
    if (!g) continue;
    g.interests.forEach(i => pickedInterests.add(i));
    (g.bridge || []).forEach(i => bridgeInterests.add(i));
  }
  const careerInterests = new Set(c.interests || []);
  const iDirect = [...pickedInterests].filter(i => careerInterests.has(i));
  const iBridge = [...bridgeInterests].filter(i => careerInterests.has(i) && !pickedInterests.has(i));
  const hits = iDirect.concat(iBridge);

  let interestPts = 0;
  if (hits.length) {
    // Each hit carries its own weight, and the weight decays as the list grows,
    // so a career with ten tags cannot beat a specialist on a single shared one.
    const units = hits.reduce((acc, i, n) => acc + (iDirect.includes(i) ? 1 : BRIDGE_CREDIT) * interestDecay(n), 0);
    interestPts = W.interest * Math.min(1, units * 0.62);
    const named = hits.slice(0, 3).join(', ');
    reasons.push({
      q: 'interest',
      pts: Math.round(interestPts),
      text: (iDirect.length ? 'Lines up with your interest in ' : 'Loosely related to your interest in ') + named,
    });
  } else {
    reasons.push({ q: 'interest', pts: 0, text: 'Outside what you said you enjoy' });
  }
  score += interestPts;

  // 3. entry level. Rank distance, because a student willing to do a PhD can
  // still do a bachelor's job, but not the other way round.
  const want = EDU_LEVELS.find(x => x.id === a.edu);
  const have = EDU_LEVELS.find(x => x.id === c.edu);
  let eduPts = 0;
  if (want && have) {
    const d = want.rank - have.rank;
    if (d === 0) eduPts = W.edu;
    else if (d < 0) eduPts = W.edu * (1 + d * 0.45);            // needs more study than they want
    else eduPts = W.edu * Math.max(0.18, 1 - (d - 1) * 0.42);  // they can start here sooner
    if (d === 0) reasons.push({ q: 'edu', pts: Math.round(eduPts), text: 'Entry level matches - ' + have.label.toLowerCase() });
    else if (d < 0) reasons.push({ q: 'edu', pts: Math.round(eduPts), text: 'Wants ' + have.label.toLowerCase() + ', so it needs more study than you planned' });
    else reasons.push({ q: 'edu', pts: Math.round(eduPts), text: 'You can reach this sooner than a full degree' });
  }
  score += eduPts;

  // 4. stream, as reachability from where the student already is
  const st = STREAMS[a.stream];
  let streamPts = 0;
  if (st) {
    const reachable = st.degrees.some(d => careerDegrees.has(d)) || careerIsAny;
    if (reachable) {
      streamPts = W.stream;
      reasons.push({ q: 'stream', pts: streamPts, text: 'A realistic path from ' + st.label });
    } else {
      reasons.push({ q: 'stream', pts: 0, text: 'Not usually reachable from ' + st.label });
    }
  }
  score += streamPts;

  // 5. field of work: signed, so a mismatch costs real points instead of merely
  // not earning any. This is what keeps unrelated careers out of the top ten.
  if (a.field) {
    if (c.catName === a.field) {
      score += W.field;
      reasons.push({ q: 'field', pts: W.field, text: 'In the field you picked' });
    } else {
      score -= W.field;
      reasons.push({ q: 'field', pts: -W.field, text: 'Outside the field you picked' });
    }
  }

  // 6. precision: how much of this career's own profile you actually hit.
  //
  // Without this, every career in the chosen field with the right entry level
  // tied on exactly 100, and 25 cards all read "99% Fit Match", which tells a
  // student nothing. A career that lists three degrees and interests and
  // matches two of them is a tighter fit than one that lists nine and matches
  // two. This is computed from data already on the career, not invented, and it
  // is deliberately small - it breaks ties, it does not decide the answer.
  const careerTags = (c.degrees || []).length + (c.interests || []).length;
  const myTags = directHits.length + bridgeHits.length * BRIDGE_CREDIT + hits.length;
  if (careerTags > 0 && myTags > 0) {
    const ratio = Math.min(1, myTags / careerTags);
    // Squared so a focused career that matches beats a broad career that
    // merely includes what the student picked. Weight matters: this is the only
    // continuous signal here, so it is what separates the 20 careers inside a
    // single field that all satisfy every other question equally.
    const precisionPts = W.precision * Math.pow(ratio, 1.6);
    score += precisionPts;
    reasons.push({
      q: 'precision',
      pts: Math.round(precisionPts),
      text: careerTags <= 4 ? 'A closely defined role that matches you specifically'
        : careerTags <= 7 ? 'A fairly focused role'
        : 'A broad role that could take you several directions',
    });
  }

  return { id: c.id, raw: score, reasons, catName: c.catName };
}

function runCompass(careers, answers) {
  const scored = careers.map(c => scoreCareer(c, answers));
  // Fit is reported relative to the best option this particular answer set
  // produced, because that is what "fit" means to someone choosing: not "how
  // good is this career in the abstract" but "how does it compare with the
  // other options that suit me". The earlier engine also normalised, and that
  // was not its problem - its problem was that the underlying scores barely
  // varied, so normalising just rescaled noise. These scores are sharp.
  //
  // The floor keeps a genuinely poor match reading as poor: without it, a
  // career that matched nothing at all would still be scaled up to whatever
  // fraction of the best it happened to reach.
  const max = Math.max(...scored.map(s => s.raw)) || 1;
  const ranked = scored
    .map(s => {
      const ratio = s.raw / max;
      const fit = Math.max(1, Math.min(99, Math.round(1 + ratio * 98)));
      return { ...s, raw: Math.round(s.raw), fit, catName: s.catName };
    })
    .sort((a, b) => b.fit - a.fit);

  if (!answers.diversify) return ranked;

  // A student who says "not sure yet" should not get fifteen variations of one
  // career. Ranking alone produces exactly that, because once degree and
  // interest are answered broadly the ordering is decided by specificity, and
  // the most narrowly defined careers cluster in whichever field happens to
  // have the most of them. So the best option from each field is pulled to the
  // front first, and the remaining slots are filled by score as normal. Every
  // entry is still a genuine match; the order just stops hiding half the map.
  //
  // The floor matters. Without it, a student who picked medicine and nothing
  // else was shown Law & Public Safety at "79% fit", purely because that was
  // the best thing available in a field they never asked about. That is not a
  // match, it is the least bad option in the wrong place, and dressing it up
  // with a percentage is exactly the kind of false precision this rebuild
  // exists to remove. Only fields that clear the floor earn a place at the
  // front; the rest stay in the ranked tail where they belong.
  const DIVERSIFY_FLOOR = 62;
  const byField = new Map();
  for (const r of ranked) {
    if (!byField.has(r.catName)) byField.set(r.catName, []);
    byField.get(r.catName).push(r);
  }
  const front = [];
  for (const list of byField.values()) {
    if (list[0].fit >= DIVERSIFY_FLOOR) front.push(list[0]);
  }
  front.sort((a, b) => b.fit - a.fit);
  const chosen = new Set(front.map(r => r.id));
  return front.concat(ranked.filter(r => !chosen.has(r.id)));
}


  return { STREAMS, DEGREE_GROUPS, INTEREST_GROUPS, EDU_LEVELS, FIELDS, W, scoreCareer, runCompass };
});
