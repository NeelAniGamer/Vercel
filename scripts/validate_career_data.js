// scripts/validate_career_data.js
// Validates careers-data.js structure, enums, uniqueness, and count consistency.

const path = require('path');
const fs = require('fs');

function loadCareers() {
  const file = path.join(__dirname, '..', 'careers-data.js');
  const src = fs.readFileSync(file, 'utf8');
  // careers-data.js sets window.CAREERS_ALL; emulate browser/global
  const sandbox = { window: {}, global: {} };
  const fn = new Function('window', 'global', src + '\n; return window.CAREERS_ALL || global.CAREERS_ALL;');
  return fn(sandbox.window, sandbox.global);
}

const ALLOWED_CATS = new Set(['tech','health','eng','space','biz','law','creative','science','eco','trades','edu','service','safety','hosp','marine','agri']);
const ALLOWED_EDU = new Set(['nodegree','diploma','bachelor','master','doctorate','professional','phd','md','', undefined, null]);
const ALLOWED_DEGREES = new Set(['engineering','computing','health','science','commerce','arts','law','education','design','management','vocational','any','economics','aviation']);
const ALLOWED_INTERESTS = new Set(['tech','health','numbers','business','machines','build','outdoors','science','design','words','law','people','teaching','transport','food','sport','sports','eco','art','creative','social','space']);

function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }
function isArr(v) { return Array.isArray(v); }

function validate(careers) {
  const errors = [];
  const warnings = [];
  const ids = new Set();

  careers.forEach((c, idx) => {
    const where = `#${idx} ${c && c.id ? c.id : '(no id)'} "${c && c.title ? c.title : ''}"`;
    if (!c || typeof c !== 'object') { errors.push(`${where}: not an object`); return; }
    if (!isStr(c.id)) errors.push(`${where}: missing id`);
    else if (ids.has(c.id)) errors.push(`${where}: duplicate id ${c.id}`);
    else ids.add(c.id);
    if (!isStr(c.title)) errors.push(`${where}: missing title`);
    if (!isStr(c.cat)) errors.push(`${where}: missing cat`);
    else if (!ALLOWED_CATS.has(c.cat)) warnings.push(`${where}: unknown cat "${c.cat}"`);
    if (!isStr(c.desc) || !isStr(c.overview)) warnings.push(`${where}: missing desc/overview`);
    if (c.edu && !ALLOWED_EDU.has(c.edu)) warnings.push(`${where}: unknown edu "${c.edu}"`);
    if (isArr(c.degrees)) c.degrees.forEach(d => { if (!ALLOWED_DEGREES.has(d)) warnings.push(`${where}: unknown degree tag "${d}"`); });
    if (isArr(c.interests)) c.interests.forEach(i => { if (!ALLOWED_INTERESTS.has(i)) warnings.push(`${where}: unknown interest tag "${i}"`); });

    // Existing known gaps (flag as warnings, not hard errors, to avoid breaking current data)
    if (!c.education) warnings.push(`${where}: missing education object`);
    if (!c.roadmap) warnings.push(`${where}: missing roadmap`);
    if (!c.skills) warnings.push(`${where}: missing skills`);
    if (!c.decisionFit) warnings.push(`${where}: missing decisionFit`);
  });

  // Count consistency checks against Career.html static claims (best-effort)
  const careerHtml = path.join(__dirname, '..', 'Career.html');
  if (fs.existsSync(careerHtml)) {
    const html = fs.readFileSync(careerHtml, 'utf8');
    const m = html.match(/(\d+)\s+career pathways/i) || html.match(/(\d+)\s+Detailed Roadmaps/i) || html.match(/"numberOfItems"\s*:\s*(\d+)/i);
    if (m) {
      const claimed = parseInt(m[1], 10);
      if (claimed !== careers.length) warnings.push(`Career.html appears to claim ${claimed} pathways but careers-data.js has ${careers.length}. Update counts/metadata.`);
    }
  }

  return { errors, warnings, count: careers.length, ids: ids.size };
}

try {
  const careers = loadCareers();
  if (!Array.isArray(careers)) throw new Error('CAREERS_ALL is not an array');
  const { errors, warnings, count, ids } = validate(careers);
  console.log(`Career data: ${count} entries, ${ids} unique IDs`);
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    warnings.slice(0, 80).forEach(w => console.log('  - ' + w));
    if (warnings.length > 80) console.log(`  ... and ${warnings.length - 80} more`);
  }
  if (errors.length) {
    console.error(`Errors (${errors.length}):`);
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
  console.log('Career data validation passed (no critical errors).');
} catch (e) {
  console.error('Career data validation failed:', e.message);
  process.exit(1);
}
