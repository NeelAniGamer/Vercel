const fs = require('fs');
let ac = fs.readFileSync('Academy.html', 'utf8');

// The loading screen blocks the entire page because start.js is no longer there to hide it.
const loadingScreenBlock = `  <!-- Dedicated Pre-Loader Screen -->
  <div id="loading-screen">
    <h1>Traffic Academy</h1>
    <div style="font-size: 1.2rem; margin-bottom: 10px;">Loading 3D Open World...</div>
    <div id="loading-bar-container">
      <div id="loading-bar"></div>
    </div>
    <div id="loading-pct">0%</div>
    <div id="loading-status">Initializing assets...</div>
  </div>`;

ac = ac.replace(loadingScreenBlock, '');

// I also noticed <div id="gc"><canvas id="3c"></canvas></div> is still there in Academy.html!
// It should have been removed, but my split_arch script regex was `<div id="gc"><\/div>`. Let's remove it.
ac = ac.replace(/<div id="gc"><canvas id="3c"><\/canvas><\/div>/, '');

fs.writeFileSync('Academy.html', ac);
console.log('Academy.html loading screen removed');
