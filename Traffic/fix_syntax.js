const fs = require('fs');
let gc = fs.readFileSync('game_core.js', 'utf8');

const target = `          if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['road_straight']) {
             // Sidewalks
             [-1, 1].forEach(s => {
               const swW = cfg.isPedestrian ? 5 : 2.5; const pb = new THREE.Mesh(isV ? new THREE.BoxGeometry(swW, .15, len) : new THREE.BoxGeometry(len, .15, swW), mats.pave);
               pb.position.set(isV ? cx + s * (RW / 2 + swW / 2) : cx, .07, isV ? cz : cz + s * (RW / 2 + swW / 2)); this.scene.add(pb); this.world.push(pb);
              });
        });`;

const replacement = `          // Sidewalks
          [-1, 1].forEach(s => {
            const swW = cfg.isPedestrian ? 5 : 2.5; const pb = new THREE.Mesh(isV ? new THREE.BoxGeometry(swW, .15, len) : new THREE.BoxGeometry(len, .15, swW), mats.pave);
            pb.position.set(isV ? cx + s * (RW / 2 + swW / 2) : cx, .07, isV ? cz : cz + s * (RW / 2 + swW / 2)); this.scene.add(pb); this.world.push(pb);
          });
        });`;

if (gc.includes(target)) {
    gc = gc.replace(target, replacement);
    fs.writeFileSync('game_core.js', gc);
    console.log('Fixed syntax error in game_core.js');
} else {
    console.log('Target not found. Let me check the exact string.');
}
