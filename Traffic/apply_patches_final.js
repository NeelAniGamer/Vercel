const fs = require('fs');
let gc = fs.readFileSync('game_core.js', 'utf8');

// Sneh Asha Generation
if (!gc.includes('SNEH ASHA')) {
    const snehAshaStr = `
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
        
        // Special features per level`;
    gc = gc.replace(`// Special features per level`, snehAshaStr);
}

// NPC Logic
if (!gc.includes('Auto-rickshaw pull over')) {
    const oldNPC = `if (n.userData.npcType === 'ped') {`;
    const newNPC = `// Auto-rickshaw pull over
            if (n.userData.npcType === 'auto' && n.userData.state === 'CRUISE' && Math.random() < 0.002) {
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
            
            if (n.userData.npcType === 'ped') {`;
    gc = gc.replace(oldNPC, newNPC);
}

// Weather Update
if (!gc.includes('Very slippery')) {
    const oldWeather = `this.fric = this.mode === 'rain' ? 0.90 : 0.94;`;
    // We only want to replace the one in _input, which is near the end, let's just use string replace last occurrence
    const newWeather = `if (this.mode === 'rain') {
                 this.fric = 0.98; // Very slippery
                 if (this.keys['s'] || this.keys['arrowdown'] || this.keys[' ']) {
                     if (this.speed > 0.3) {
                         this.turn *= 0.8; // Loss of steering
                         if (Math.random() < 0.1) this.playerVehicle.rotation.y += (Math.random() - 0.5) * 0.1; // Skid
                     }
                 }
             } else {
                 this.fric = 0.94;
             }`;
             
    // Find the one in _input(dt)
    const blockStart = gc.indexOf('_input(dt) {');
    const weatherStr = `this.fric = this.mode === 'rain' ? 0.90 : 0.94;`;
    const weatherIdx = gc.indexOf(weatherStr, blockStart);
    if (weatherIdx !== -1) {
        gc = gc.substring(0, weatherIdx) + newWeather + gc.substring(weatherIdx + weatherStr.length);
    }
}

fs.writeFileSync('game_core.js', gc);
console.log('Final patches applied.');
