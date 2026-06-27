const fs = require('fs');

let gc = fs.readFileSync('game_core.js', 'utf8');

// 1. Weather Logic Updates in _updateWeather
const weatherUpdateOld = `_updateWeather(dt) {
        this.weatherTimer -= dt;
        if(this.weatherTimer <= 0) {
            this.weatherState = this.weatherState === 'clear' ? 'raining' : 'clear';
            this.weatherTimer = 60 + Math.random() * 60;
        }`;
const weatherUpdateNew = `_updateWeather(dt) {
        if (window.gameWeather === 'Rain') {
            this.weatherState = 'raining';
            this.weatherTimer = 9999;
        } else if (window.gameWeather === 'Clear') {
            this.weatherState = 'clear';
            this.weatherTimer = 9999;
        } else {
            this.weatherTimer -= dt;
            if(this.weatherTimer <= 0) {
                this.weatherState = this.weatherState === 'clear' ? 'raining' : 'clear';
                this.weatherTimer = 60 + Math.random() * 60;
            }
        }
        
        if (!this.isPedestrian && this.playerVehicle) {
             if (this.weatherState === 'raining' && window.gameDifficulty === 'Hard') {
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
        }`;
gc = gc.replace(weatherUpdateOld, weatherUpdateNew);


// 2. Sneh Asha Generation at end of _buildScene
// Find end of _buildScene: it's before _sig() usually
// Actually I'll just append it to the block where intersections are built.
const intBlockOld = `this.scene.add(intTile);
          }`;
const intBlockNew = `this.scene.add(intTile);
          }
          
          // Speed Trap Camera Generation at Intersections
          const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), new THREE.MeshLambertMaterial({color: 0x333333}));
          camPole.position.set(ix - 5, 4, iz - 5);
          const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), new THREE.MeshLambertMaterial({color: 0x111111}));
          camBox.position.set(0, 4, 0.4);
          camPole.add(camBox);
          this.scene.add(camPole);
          if(!this.speedTraps) this.speedTraps = [];
          this.speedTraps.push(new THREE.Vector3(ix, 0, iz));
          `;
gc = gc.replace(intBlockOld, intBlockNew);

const afterMakeCityBlockOld = `for (let [x, z] of cfg.bld || []) this._makeTower(x, z, 14, 14);`;
const afterMakeCityBlockNew = `for (let [x, z] of cfg.bld || []) this._makeTower(x, z, 14, 14);
        
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
        this.snehPos = new THREE.Vector3(15, 0, 15);
`;
gc = gc.replace(afterMakeCityBlockOld, afterMakeCityBlockNew);


// 3. Silent Zone in _horn
const hornOld = `if (this.mapCfg && this.mapCfg.isSilenceZone) {`;
const hornNew = `let nearSneh = false;
          if (this.snehPos && this.player && this.player.position.distanceTo(this.snehPos) < 50) {
              nearSneh = true;
          }
          if ((this.mapCfg && this.mapCfg.isSilenceZone) || nearSneh) {`;
gc = gc.replace(hornOld, hornNew);

// 4. Speed Trap Checking in _input or _updateVehicle. Let's do it in _loop or _input.
const inputSpeedCheckOld = `this.speed *= this.fric;
        }`;
const inputSpeedCheckNew = `this.speed *= this.fric;
        }
        
        // Speed Trap Check
        if (!this.isPedestrian && this.speedTraps && Math.abs(this.speed) > 0.55 && !this.challanFired.has('speeding')) {
            for (let st of this.speedTraps) {
                if (this.player.position.distanceTo(st) < 25) {
                    this.challanFired.add('speeding');
                    ui.issueChallan('Overspeeding at Intersection', 'Sec 112 MV Act', '₹2,000', 'Speed Violation');
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
        }`;
gc = gc.replace(inputSpeedCheckOld, inputSpeedCheckNew);

// 5. NPC Auto-rickshaw pull over & Tailgating
const npcLogicOld = `if (n.userData.type === 'ped') {`;
const npcLogicNew = `
            // Auto-rickshaw pull over
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
            
            if (n.userData.type === 'ped') {`;
gc = gc.replace(npcLogicOld, npcLogicNew);

fs.writeFileSync('game_core.js', gc);
console.log('game_core.js patched');

// HTML Patch
let html = fs.readFileSync('Academy.html', 'utf8');
const uiOld = `<button class="nav-login-btn cloud-login-btn"`;
const uiNew = `
<button class="nav-login-btn" onclick="window.gameDifficulty = window.gameDifficulty === 'Hard' ? 'Easy' : 'Hard'; this.innerHTML = window.gameDifficulty === 'Hard' ? '🔴 Hard Mode' : '🟢 Easy Mode';" style="background:#fff; border:1px solid var(--border); border-radius:30px; padding:8px 16px; font-weight:600; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 12px rgba(0,0,0,0.1);" id="btn-diff">🟢 Easy Mode</button>
<button class="nav-login-btn" onclick="window.gameWeather = window.gameWeather === 'Rain' ? 'Clear' : 'Rain'; this.innerHTML = window.gameWeather === 'Rain' ? '🌧️ Rain' : '☀️ Clear';" style="background:#fff; border:1px solid var(--border); border-radius:30px; padding:8px 16px; font-weight:600; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 12px rgba(0,0,0,0.1);" id="btn-weather">☀️ Clear</button>
<button class="nav-login-btn cloud-login-btn"`;
if (!html.includes('id="btn-diff"')) {
    html = html.replace(uiOld, uiNew);
    fs.writeFileSync('Academy.html', html);
    console.log('Academy.html patched');
} else {
    console.log('Academy.html already patched');
}
