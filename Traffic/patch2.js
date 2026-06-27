const fs = require('fs');

// Patch ui.js
let uiCode = fs.readFileSync('ui.js', 'utf8');
uiCode = uiCode.replace(/c\.frustumCulled = false;/g, 'c.frustumCulled = true;'); // Task 1
fs.writeFileSync('ui.js', uiCode);
console.log('ui.js patched');

// Patch start.js
let startCode = fs.readFileSync('start.js', 'utf8');
startCode = startCode.replace(/child\.frustumCulled = false;/g, 'child.frustumCulled = true;'); // Task 1
fs.writeFileSync('start.js', startCode);
console.log('start.js patched');

// Patch game_core.js
let gc = fs.readFileSync('game_core.js', 'utf8');

// Task 1: frustumCulled
gc = gc.replace(/instancedMesh\.frustumCulled = false;/g, 'instancedMesh.frustumCulled = true;');

// Task 2: distanceTo -> distanceToSquared
gc = gc.replace(/\.distanceTo\(([^)]+)\)\s*<\s*([0-9.]+)/g, (match, pos, dist) => {
    let num = parseFloat(dist);
    return `.distanceToSquared(${pos}) < ${num * num}`;
});
gc = gc.replace(/\.distanceTo\(([^)]+)\)\s*>\s*([0-9.]+)/g, (match, pos, dist) => {
    let num = parseFloat(dist);
    return `.distanceToSquared(${pos}) > ${num * num}`;
});

// Task 3: Disable EffectComposer
gc = gc.replace(/typeof THREE\.EffectComposer !== 'undefined' && !isMobile/g, 'false');

// Task 4: Downgrade Materials
gc = gc.replace(/MeshPhongMaterial/g, 'MeshLambertMaterial');
gc = gc.replace(/MeshStandardMaterial/g, 'MeshLambertMaterial');

// Task 5: Lower shadow map resolution
gc = gc.replace(/2048/g, '512');

// Task 6: Third-person vehicle driving
// First, find the _ucam logic and replace the vehicle part
let newCam = `      _ucam() {
        if (this.isPointerLocked) {
          if (this.isPedestrian) {
            // GTA-style Third Person for pedestrian when pointer is locked
            const camDist = 5;
            const camHeight = 2.5;
            const rotY = this.player.rotation.y;
            const pitch = this.camPitch || 0;
            
            this._camTarget.set(
              this.player.position.x - Math.sin(rotY) * camDist * Math.cos(pitch),
              this.player.position.y + camHeight + Math.sin(pitch) * camDist,
              this.player.position.z - Math.cos(rotY) * camDist * Math.cos(pitch)
            );
            this.camera.position.lerp(this._camTarget, 0.5);
            
            const lx = Math.sin(rotY) * Math.cos(pitch);
            const ly = Math.sin(pitch);
            const lz = Math.cos(rotY) * Math.cos(pitch);
            
            this.camera.lookAt(
              this.camera.position.x + lx,
              this.camera.position.y + ly,
              this.camera.position.z + lz
            );
          } else {
            // Third Person Mode for vehicles
            const camDist = 12;
            const camHeight = 5;
            const rotY = this.player.rotation.y;
            const pitch = this.camPitch || 0;
            
            this._camTarget.set(
              this.player.position.x - Math.sin(rotY) * camDist * Math.cos(pitch),
              this.player.position.y + camHeight + Math.sin(pitch) * camDist,
              this.player.position.z - Math.cos(rotY) * camDist * Math.cos(pitch)
            );
            this.camera.position.lerp(this._camTarget, 0.5);
            
            const lx = Math.sin(rotY) * Math.cos(pitch);
            const ly = Math.sin(pitch);
            const lz = Math.cos(rotY) * Math.cos(pitch);
            
            this.camera.lookAt(
              this.camera.position.x + lx,
              this.camera.position.y + ly,
              this.camera.position.z + lz
            );
          }
        } else {`;
gc = gc.replace(/      _ucam\(\) \{\n        if \(this\.isPointerLocked\) \{\n          if \(this\.isPedestrian\) \{[\s\S]*?\} else \{[\s\S]*?\}\n        \} else \{/m, newCam);

// Task 7: Fix road Z-fighting
gc = gc.replace(/intTile\.position\.set\(ix, 0\.03, iz\);/g, 'intTile.position.set(ix, 0.08, iz);');
gc = gc.replace(/pavement\.position\.set\(0, 0\.05, 0\);/g, 'pavement.position.set(0, 0.1, 0);');
gc = gc.replace(/crossPave\.position\.set\(0, 0\.06, 0\);/g, 'crossPave.position.set(0, 0.11, 0);');

// Task 8: Fix house overlapping
// Search for Math.random() in _makeTower and add constraints. 
// _makeTower sets bx, bz
// We need to offset them so they are away from roads.
gc = gc.replace(/const bx = \(\(Math\.random\(\) - 0\.5\) \* 2000\);/g, 'let bx = ((Math.random() - 0.5) * 2000); if (Math.abs(bx) < 15) bx = bx < 0 ? -15 : 15;');
gc = gc.replace(/const bz = \(\(Math\.random\(\) - 0\.5\) \* 2000\);/g, 'let bz = ((Math.random() - 0.5) * 2000); if (Math.abs(bz) < 15) bz = bz < 0 ? -15 : 15;');


// Task 9 & 10: Seatbelt Auto-Equip and UI Visibility
// Entered Vehicle:
gc = gc.replace(/toast\('🏎️ Entered Vehicle!', '#00c851'\);/g, `toast('🏎️ Entered Vehicle!', '#00c851');
                if (!this.seatbeltOn) { this.seatbeltOn = true; const btnS = document.getElementById('btn-seatbelt'); if(btnS) { btnS.textContent = (this.vehMode === 'bike' || this.vehMode === 'cycle') ? '🪖 Helmet ON' : '💺 Seatbelt ON'; } }
                const bs = document.getElementById('btn-seatbelt'); if(bs) bs.style.display = 'inline-block';
                const bm = document.getElementById('btn-phone'); if(bm) bm.style.display = 'inline-block';
`);

// Exited Vehicle:
gc = gc.replace(/toast\('🚶 Exited Vehicle!', '#00c851'\);/g, `toast('🚶 Exited Vehicle!', '#00c851');
              const bs = document.getElementById('btn-seatbelt'); if(bs) bs.style.display = 'none';
              const bm = document.getElementById('btn-phone'); if(bm) bm.style.display = 'none';
`);


fs.writeFileSync('game_core.js', gc);
console.log('game_core.js patched');

// Academy.html (Task 10 default UI state, Task 11 theme)
let ac = fs.readFileSync('Academy.html', 'utf8');

// Theme default: body class="lm"
ac = ac.replace(/<body([^>]*)>/, '<body$1 class="lm">');
ac = ac.replace(/const bs = document\.getElementById\('btn-seatbelt'\);/g, `const bs = document.getElementById('btn-seatbelt'); if(bs) bs.style.display = 'none';`);

// Find the "Enter Academy" button and make it visible for light theme (e.g. background:#111827 for contrast)
// Wait, the button has background:var(--signal) and color:#111827. Signal is #F2B84B. This is actually visible in light mode. Let's make sure font colors on the welcome screen are dark.
ac = ac.replace(/<p style="color:#ccc; font-size:1.1rem; margin-bottom:40px;">/g, '<p style="color:var(--dim); font-size:1.1rem; margin-bottom:40px;">');
ac = ac.replace(/color:#fff;/g, 'color:var(--ink);');
// Wait, the Academy button has color: #111827 which is dark.

fs.writeFileSync('Academy.html', ac);
console.log('Academy.html patched');

