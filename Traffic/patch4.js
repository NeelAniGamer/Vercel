const fs = require('fs');

// Restore from backup
fs.copyFileSync('ui.backup.js', 'ui.js');

let uiCode = fs.readFileSync('ui.js', 'utf8');

// Patch frustumCulled (from patch2.js)
uiCode = uiCode.replace(/c\.frustumCulled = false;/g, 'c.frustumCulled = true;');

// Patch car sizes (with safe regex)
uiCode = uiCode.replace(/(?:type === 'bus' || type === 'truck')\) s = 1\.4 \* 6\.5;/g, "type === 'bus' || type === 'truck') s = 1.4 * 3.5;");
uiCode = uiCode.replace(/(?:type === 'auto' || type === 'bike')\) s = 1\.0 \* 5\.0;/g, "type === 'auto' || type === 'bike') s = 1.0 * 2.5;");
uiCode = uiCode.replace(/else s = 1\.2 \* 6\.5;/g, "else s = 1.2 * 3.5;");

fs.writeFileSync('ui.js', uiCode);
console.log('ui.js restored and patched correctly!');
