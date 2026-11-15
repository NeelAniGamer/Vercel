const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'ati-demo.html'), 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((l, idx) => {
  if (
    l.includes('<section') ||
    l.includes('mode-deck') ||
    l.includes('sub-options') ||
    l.includes('telemetry-grid') ||
    l.includes('typing-stage') ||
    l.includes('keyboard-wrap') ||
    l.includes('resultsOverlay') ||
    l.includes('results-modal') ||
    l.includes('rank-badge') ||
    l.includes('sandbox-stage')
  ) {
    console.log(`${idx + 1}: ${l.trim().substring(0, 100)}`);
  }
});
