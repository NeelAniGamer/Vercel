const fs = require('fs');
const backup = fs.readFileSync('game_core.backup.js', 'utf8');

const startStr = "if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['road_straight'])";
const startIdx = backup.indexOf(startStr);
const endStr = "// Sidewalks";
const endIdx = backup.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const block = backup.substring(startIdx, endIdx);
    fs.writeFileSync('extracted_block.js', block);
    console.log('Block extracted successfully.');
} else {
    console.log('Could not find the block.');
}
