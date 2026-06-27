const fs = require('fs');

// Patch ui.js
let uiCode = fs.readFileSync('ui.js', 'utf8');
uiCode = uiCode.replace(/type === 'bus' || type === 'truck'\) s = 1\.4 \* 6\.5;/g, "type === 'bus' || type === 'truck') s = 1.4 * 3.5;");
uiCode = uiCode.replace(/type === 'auto' || type === 'bike'\) s = 1\.0 \* 5\.0;/g, "type === 'auto' || type === 'bike') s = 1.0 * 2.5;");
uiCode = uiCode.replace(/else s = 1\.2 \* 6\.5;/g, "else s = 1.2 * 3.5;");
fs.writeFileSync('ui.js', uiCode);
console.log('ui.js patched for car sizes');

// Patch game_core.js
let gc = fs.readFileSync('game_core.js', 'utf8');

// Fix road_straight Y position so it is visible
gc = gc.replace(/tile\.position\.set\(([^,]+),\s*0\.02,\s*([^)]+)\);/g, "tile.position.set($1, 0.08, $2);");
fs.writeFileSync('game_core.js', gc);
console.log('game_core.js patched for road Y position');
