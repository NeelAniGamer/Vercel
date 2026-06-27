const fs = require('fs');
let code = fs.readFileSync('game_core.js', 'utf8');

// 1. Add shadow bias
code = code.replace(/sun\.castShadow = true;/g, 'sun.castShadow = true;\n        sun.shadow.bias = -0.0005;');
code = code.replace(/moon\.castShadow = true;/g, 'moon.castShadow = true;\n          moon.shadow.bias = -0.0005;');

// 2. Fix pedestrian camera
code = code.replace(`      _ucam() {
        if (this.isPointerLocked) {
          // First Person Mode
          const headHeight = this.isPedestrian ? 1.6 : 1.2;
          // For vehicles, offset slightly forward so we don't clip into the driver seat mesh
          const forwardOffset = this.isPedestrian ? 0 : 0.5;
          const rotY = this.player.rotation.y;
          
          this.camera.position.set(
            this.player.position.x + Math.sin(rotY) * forwardOffset, 
            this.player.position.y + headHeight, 
            this.player.position.z + Math.cos(rotY) * forwardOffset
          );
          
          const pitch = this.camPitch || 0;
          const lx = Math.sin(rotY) * Math.cos(pitch);
          const ly = Math.sin(pitch);
          const lz = Math.cos(rotY) * Math.cos(pitch);
          
          this.camera.lookAt(
            this.camera.position.x + lx,
            this.camera.position.y + ly,
            this.camera.position.z + lz
          );
        } else {`, `      _ucam() {
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
            // First Person Mode for vehicles
            const headHeight = 1.2;
            const forwardOffset = 0.5;
            const rotY = this.player.rotation.y;
            
            this.camera.position.set(
              this.player.position.x + Math.sin(rotY) * forwardOffset, 
              this.player.position.y + headHeight, 
              this.player.position.z + Math.cos(rotY) * forwardOffset
            );
            
            const pitch = this.camPitch || 0;
            const lx = Math.sin(rotY) * Math.cos(pitch);
            const ly = Math.sin(pitch);
            const lz = Math.cos(rotY) * Math.cos(pitch);
            
            this.camera.lookAt(
              this.camera.position.x + lx,
              this.camera.position.y + ly,
              this.camera.position.z + lz
            );
          }
        } else {`);

fs.writeFileSync('game_core.js', code);
console.log('Successfully updated game_core.js!');
