// Build BLS OOH A-Z canonical occupations + aliases, then diff with careers-data.js
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/bls-az-raw.html', 'utf8');

const liRe = /<li><a href="([^"]+)">([^<]+)<\/a>(?:, see: <a href="[^"]+">([^<]+)<\/a>)?<\/li>/g;
const canonical = new Map(); // title -> url
const aliases = new Map();   // canonical title -> [aliases]
let m;
let skipped = 0;
while ((m = liRe.exec(html))) {
  const url = m[1];
  const label = decode(m[2]);
  const seeTarget = m[3] ? decode(m[3]) : null;
  if (!/^\/ooh\//.test(url)) { skipped++; continue; }
  if (seeTarget) {
    if (!aliases.has(seeTarget)) aliases.set(seeTarget, []);
    if (!aliases.get(seeTarget).includes(label)) aliases.get(seeTarget).push(label);
  } else {
    if (!canonical.has(label)) canonical.set(label, url);
  }
}

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Single-pass decode: a chain of .replace() calls turns "&amp;lt;" into "<", which is a
// double-unescape. One pass yields "&lt;" and leaves it alone.
function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, function (match, body) {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return match;
      return String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? match : named;
  });
}

console.log('canonical occupations:', canonical.size);
console.log('aliases:', [...aliases.values()].reduce((a, b) => a + b.length, 0));
console.log('alias targets not canonical:', [...aliases.keys()].filter(k => !canonical.has(k)).slice(0, 20));

// Load existing dataset
global.window = {};
require('../careers-data.js');
const w = global.window;
const all = w.CAREERS_ALL;
const norm = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();

const byNorm = new Map();
all.forEach(c => byNorm.set(norm(c.title), c));

const missing = [...canonical.keys()].filter(t => !byNorm.has(norm(t)));
const present = [...canonical.keys()].filter(t => byNorm.has(norm(t)));
console.log('canonical present in data:', present.length, 'missing:', missing.length);
console.log('--- MISSING ---');
missing.forEach(t => console.log(' *', t, '|', canonical.get(t)));

// Alias coverage: how many alias targets map into dataset?
let aliasHit = 0, aliasMiss = 0;
const missTargets = [];
for (const [target, list] of aliases) {
  if (byNorm.has(norm(target))) aliasHit += list.length;
  else { aliasMiss += list.length; missTargets.push(target); }
}
console.log('alias titles hitting dataset:', aliasHit, 'hanging:', aliasMiss);
console.log('hanging targets:', missTargets.slice(0, 40));

fs.writeFileSync(__dirname + '/az-canonical.json', JSON.stringify([...canonical.entries()], null, 0));
fs.writeFileSync(__dirname + '/az-aliases.json', JSON.stringify([...aliases.entries()], null, 0));
