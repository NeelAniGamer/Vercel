const fs = require('fs');
const backup = fs.readFileSync('game_core.backup.js', 'utf8');
const startStr = "if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['road_straight'])";
const startIdx = backup.indexOf(startStr);
const endIdx = backup.indexOf('// Advanced Procedural Cityscape', startIdx);
fs.writeFileSync('extracted_block2.js', backup.substring(startIdx, endIdx));
console.log('Extract 2 done.');
