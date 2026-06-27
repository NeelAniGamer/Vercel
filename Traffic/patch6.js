const fs = require('fs');

let gc = fs.readFileSync('game_core.js', 'utf8');

// Fix phone position for 3rd person view so it doesn't block the screen
gc = gc.replace(/this\.phoneMesh\.position\.set\(0\.5,\s*0\.5,\s*-0\.8\);/g, 'this.phoneMesh.position.set(1.8, -1.0, -2.5);');

fs.writeFileSync('game_core.js', gc);
console.log('game_core.js: moved phone mesh');
