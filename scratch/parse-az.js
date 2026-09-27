// Parse the saved BLS OOH A-Z index HTML into canonical occupations + aliases.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/bls-az-raw.html', 'utf8');

// The index is a plain list of lines inside the content area. Grab the region
// between the A-Z heading and the footer.
const start = html.indexOf('A-Z Index');
const end = html.indexOf('Back to Top');
console.log('start', start, 'end', end, 'len', html.length);

// Extract text of the main list: BLS markup uses <div class="column">... let's
// inspect the raw markup around a known entry.
const probe = html.indexOf('Accountants and auditors');
console.log(JSON.stringify(html.slice(probe - 600, probe + 300)));
