const fs = require('fs');
let gc = fs.readFileSync('game_core.js', 'utf8');

gc = gc.replace(/if\s*\(\s*window\.PRELOADED_MODELS\s*&&\s*window\.PRELOADED_MODELS\['road_straight'\]\s*\)\s*\{/g, '');

fs.writeFileSync('game_core.js', gc);
console.log('Fixed syntax error via regex in game_core.js');
