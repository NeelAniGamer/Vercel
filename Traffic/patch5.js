const fs = require('fs');

// Patch ui.js
let uiCode = fs.readFileSync('ui.js', 'utf8');
uiCode = uiCode.replace(/c\.frustumCulled = true;/g, 'c.frustumCulled = false;');
fs.writeFileSync('ui.js', uiCode);
console.log('ui.js: reverted frustumCulled');

// Patch start.js
let startCode = fs.readFileSync('start.js', 'utf8');
startCode = startCode.replace(/child\.frustumCulled = true;/g, 'child.frustumCulled = false;');
fs.writeFileSync('start.js', startCode);
console.log('start.js: reverted frustumCulled');

// Patch game_core.js
let gc = fs.readFileSync('game_core.js', 'utf8');
gc = gc.replace(/instancedMesh\.frustumCulled = true;/g, 'instancedMesh.frustumCulled = false;');
fs.writeFileSync('game_core.js', gc);
console.log('game_core.js: reverted frustumCulled');

// Patch Academy.html (make #da text darker)
let ac = fs.readFileSync('Academy.html', 'utf8');
if (!ac.includes('#da { color: #111827 !important; }')) {
    ac = ac.replace(/#da \{/g, '#da { color: #111827 !important;');
}
fs.writeFileSync('Academy.html', ac);
console.log('Academy.html: fixed direction UI color');
