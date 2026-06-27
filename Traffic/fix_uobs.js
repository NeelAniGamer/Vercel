const fs = require('fs');
let gc = fs.readFileSync('game_core.js', 'utf8');

// The missing _uobs function
const uobsStr = `
      _uobs() {
        const px = this.player.position.x, pz = this.player.position.z;
        if (!this.obstacles) return;
        this.obstacles.forEach(o => {
          const dx = px - o.position.x, dz = pz - o.position.z;
          if (dx * dx + dz * dz > 400) return;
          if (this.player.position.distanceToSquared(o.position) < 2.56) { 
              this.hp -= 10; 
              if (this.hp <= 0) this._go(o.userData && o.userData.isAnimal ? 'Animal Collision' : 'Collided with Barricade'); 
              else this._uh(); 
              this.speed = -this.speed * 0.5; 
          }
        });
      }
`;

// Find _ucps() and inject _uobs() before it
gc = gc.replace(/_ucps\(\) \{/, uobsStr + '      _ucps() {');

fs.writeFileSync('game_core.js', gc);
console.log('_uobs() restored in game_core.js');
