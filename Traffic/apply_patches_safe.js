const fs = require('fs');
let gc = fs.readFileSync('game_core.js', 'utf8');

function applyRegexPatch(desc, regex, replace) {
    if (regex.test(gc)) {
        gc = gc.replace(regex, replace);
        console.log(`[OK] ${desc}`);
    } else {
        console.log(`[FAIL] ${desc} - Not Found`);
    }
}

// 1. Weather Update
applyRegexPatch(
    'Weather update (Slippery)', 
    /this\.fric\s*=\s*\(this\.weatherState\s*===\s*'raining'\)\s*\?\s*0\.90\s*:\s*0\.94;\s*\}/,
    `this.fric = (this.weatherState === 'raining') ? 0.90 : 0.94;
             if (this.weatherState === 'raining') {
                 this.fric = 0.98; // Very slippery
                 if (this.keys['s'] || this.keys['arrowdown'] || this.keys[' ']) {
                     if (this.speed > 0.3) {
                         this.turn *= 0.8; // Loss of steering
                         if (Math.random() < 0.1) this.playerVehicle.rotation.y += (Math.random() - 0.5) * 0.1; // Skid
                     }
                 }
             } else {
                 this.fric = (this.weatherState === 'raining') ? 0.90 : 0.94;
             }
        }`
);

// 2. Speed Trap Cameras at Intersections
applyRegexPatch(
    'Speed Trap Cameras',
    /this\.scene\.add\(intTile\);\s*\}/,
    `this.scene.add(intTile);
          }
          
          // Speed Trap Camera Generation at Intersections
          const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), new THREE.MeshLambertMaterial({color: 0x333333}));
          camPole.position.set(ix - 5, 4, iz - 5);
          const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), new THREE.MeshLambertMaterial({color: 0x111111}));
          camBox.position.set(0, 4, 0.4);
          camPole.add(camBox);
          this.scene.add(camPole);
          if(!this.speedTraps) this.speedTraps = [];
          this.speedTraps.push(new THREE.Vector3(ix, 0, iz));`
);

// 3. Sneh Asha Generation
applyRegexPatch(
    'Sneh Asha Generation',
    /for\s*\(\s*let\s*\[x,\s*z\]\s*of\s*cfg\.bld\s*\|\|\s*\[\]\s*\)\s*this\._makeTower\(x,\s*z,\s*14,\s*14\);/,
    `for (let [x, z] of cfg.bld || []) this._makeTower(x, z, 14, 14);
        
        // Sneh Asha Landmark
        const snehGrp = new THREE.Group();
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 20), new THREE.MeshLambertMaterial({color: 0xdddddd}));
        snehGrp.add(plinth);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 10, 32), new THREE.MeshLambertMaterial({color: 0xffffff}));
        body.position.y = 5.5;
        snehGrp.add(body);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 16, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshLambertMaterial({color: 0x34D399}));
        dome.position.y = 10.5;
        snehGrp.add(dome);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111827'; ctx.fillRect(0,0,512,128);
        ctx.fillStyle = '#34D399'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.fillText('SNEH ASHA', 256, 80);
        const tex = new THREE.CanvasTexture(canvas);
        const signText = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 2.8), new THREE.MeshBasicMaterial({map: tex}));
        signText.position.set(0, 14, 8.51);
        const signBack = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 1), new THREE.MeshLambertMaterial({color: 0x111827}));
        signBack.position.set(0, 14, 8);
        snehGrp.add(signBack);
        snehGrp.add(signText);
        
        snehGrp.position.set(15, 0, 15);
        this.scene.add(snehGrp);
        this.snehPos = new THREE.Vector3(15, 0, 15);`
);

// 4. NPC Logic Update
applyRegexPatch(
    'NPC Logic Update',
    /if\s*\(n\.userData\.type\s*===\s*'ped'\)\s*\{/,
    `// Auto-rickshaw pull over
            if (n.userData.type === 'auto' && n.userData.state === 'CRUISE' && Math.random() < 0.002) {
                n.userData.state = 'PULL_OVER';
                n.userData.pullOverTimer = 200;
            }
            if (n.userData.state === 'PULL_OVER') {
                n.userData.spd *= 0.95; // brake
                n.userData.txX += (n.userData.txX > 0 ? 0.05 : -0.05); // move to side
                n.userData.pullOverTimer--;
                if (n.userData.pullOverTimer <= 0) n.userData.state = 'CRUISE';
            }
            
            // Aggressive tailgating
            if (n.userData.state === 'CRUISE' && distToPlayer < 20 && !this.isPedestrian && Math.abs(this.speed) < 0.3) {
                // If player is in front of NPC
                const toPlayer = this.player.position.clone().sub(n.position);
                const forward = new THREE.Vector3(0,0,1).applyQuaternion(n.quaternion);
                if (toPlayer.dot(forward) > 0) {
                     if (Math.random() < 0.02) sfx.play('horn'); // Honk aggressively
                     n.userData.txX += (Math.random() < 0.5 ? 3 : -3); // Attempt overtake
                }
            }
            
            if (n.userData.type === 'ped') {`
);

// 5. Distracted Driving & BRTS & Speed Trap
// The old block ended with: this.speed *= this.fric; } 
// But wait, it might be easier to target "this.speed *= this.fric;" specifically inside _input(dt).
applyRegexPatch(
    'Distracted & BRTS & Speed Trap',
    /this\.speed\s*\*\=\s*this\.fric;\s*\}/,
    `this.speed *= this.fric;
        }
        
        // Speed Trap Check
        if (!this.isPedestrian && this.speedTraps && Math.abs(this.speed) > 0.55 && !this.challanFired.has('speeding')) {
            for (let st of this.speedTraps) {
                if (this.player.position.distanceTo(st) < 25) {
                    this.challanFired.add('speeding');
                    ui.issueChallan('Overspeeding at Intersection', 'Sec 112 MV Act', ',12,000', 'Speed Violation');
                    this.vio++; this.score -= 40; this.fine += 2000;
                    
                    // Flash effect
                    const flash = document.createElement('div');
                    flash.style.position = 'fixed'; flash.style.top = '0'; flash.style.left = '0';
                    flash.style.width = '100vw'; flash.style.height = '100vh'; flash.style.background = 'white';
                    flash.style.zIndex = '9999'; flash.style.transition = 'opacity 0.5s';
                    document.body.appendChild(flash);
                    setTimeout(() => { flash.style.opacity = '0'; }, 50);
                    setTimeout(() => { flash.remove(); }, 550);
                    break;
                }
            }
        }
        
        // Distracted Driving (Mobile Phone Lag & Drift)
        if (this.mobileOn && !this.isPedestrian) {
            this.turn *= 0.5; // sluggish steering
            if (this.speed > 0.1) {
                this.playerVehicle.rotation.y += (Math.random() - 0.5) * 0.02; // random drift
            }
        }
        
        // BRTS Lane Check
        let inBRTS = false;
        this.roadSegments.forEach(r => {
            if (r.hasBRTS && r.type === 'v') {
                if (Math.abs(this.player.position.z - r.z) < r.len / 2) {
                    if (this.player.position.x > r.x + 2 && this.player.position.x < r.x + 6) {
                        inBRTS = true;
                    }
                }
            }
        });
        if (inBRTS && !this.isPedestrian && this.speed > 0.1) {
            if (!this.brtsPenaltyCooldown || this.brtsPenaltyCooldown <= 0) {
                this.vio++; this.score -= 20; this.fine += 500;
                ui.issueChallan('Driving in BRTS Corridor', 'Sec 177 MV Act', ',1500', 'Lane Violation');
                this.brtsPenaltyCooldown = 2.0;
            }
        }
        if (this.brtsPenaltyCooldown > 0) this.brtsPenaltyCooldown -= dt;`
);

fs.writeFileSync('game_core.js', gc);
console.log('Done replacing.');
