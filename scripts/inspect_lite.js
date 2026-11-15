const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'ati-lite.html'), 'utf8');
const lines = content.split('\n');

console.log('Total lines in ati-lite.html:', lines.length);

lines.forEach((l, idx) => {
  if (
    l.includes('<section') ||
    l.includes('<canvas') ||
    l.includes('mode-select') ||
    l.includes('defense') ||
    l.includes('racer') ||
    l.includes('keyboard') ||
    l.includes('restart') ||
    l.includes('tab') ||
    l.includes('soundProfile')
  ) {
    if (l.trim().length < 120) {
      console.log(`${idx + 1}: ${l.trim()}`);
    }
  }
});
