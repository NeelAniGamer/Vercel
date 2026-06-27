const fs = require('fs');

// Patch game_core.js
let gc = fs.readFileSync('game_core.js', 'utf8');

// 1. Fix the tiny intersection tile (from RW / 10 to RW)
gc = gc.replace(/const tileScale = RW \/ 10;/g, 'const tileScale = RW;');
// Change road_cross to road_intersect for the intersection tile
gc = gc.replace(/window\.PRELOADED_MODELS\['road_cross'\]\.clone\(\);/g, "window.PRELOADED_MODELS['road_intersect'] ? window.PRELOADED_MODELS['road_intersect'].clone() : window.PRELOADED_MODELS['road_cross'].clone();");

// 2. Reduce rendering quality for performance (720p equivalent)
gc = gc.replace(/this\.renderer\.setPixelRatio\(isMobile \? 1 \: Math\.min\(window\.devicePixelRatio, 1\.25\)\);/g, 'this.renderer.setPixelRatio(isMobile ? 0.5 : 0.75);');

// 3. Zoom the camera in closer for pedestrian view so they aren't an ant
gc = gc.replace(/const camDist = 5;/g, 'const camDist = 2.5;');
gc = gc.replace(/const camHeight = 2\.5;/g, 'const camHeight = 1.2;');

// Also zoom in third person vehicle view slightly just in case
gc = gc.replace(/const camDist = 12;/g, 'const camDist = 8;');
gc = gc.replace(/const camHeight = 5;/g, 'const camHeight = 3;');

fs.writeFileSync('game_core.js', gc);
console.log('game_core.js patched');

// Patch ui.js to scale the character slightly larger
let uiCode = fs.readFileSync('ui.js', 'utf8');
uiCode = uiCode.replace(/const s = isPlayer \? 14 \: 13;/g, 'const s = isPlayer ? 24 : 22;');
fs.writeFileSync('ui.js', uiCode);
console.log('ui.js patched');
