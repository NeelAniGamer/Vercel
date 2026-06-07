import re

with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix Spawn
spawn_pattern = r'(let startX = 0, startZ = -240, rY = 0;\s+if \(this\.mapCfg && this\.mapCfg\.route && this\.mapCfg\.route\.length >= 2\) \{.*?\n\s+\}\n\s+//  ON-ROAD START\n\s+this\.player\.position\.set\(5, 0, Math\.min\(Math\.max\(-860, this\.cur\.zs \|\| 0\), 0\)\);\n\s+this\.player\.rotation\.y = 0;)'

new_spawn = '''let startX = 5, startZ = 0, rY = 0;
          if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
            const p1 = this.mapCfg.route[0];
            const p2 = this.mapCfg.route[1];
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const nx = dx / dist;
            const nz = dz / dist;
            startX = p1.x - nz * 5;
            startZ = p1.z + nx * 5;
            rY = Math.atan2(nx, nz);
          }
          this.player.position.set(startX, 0, startZ);
          this.player.rotation.y = rY;'''

text = re.sub(spawn_pattern, new_spawn, text, flags=re.DOTALL)

# 2. Add Thunder/Lightning array to game state
text = text.replace('this.playing = false; this.pause = false;', 'this.playing = false; this.pause = false; this.lightningTimer = 0; this.thunderSfx = null;')

# 3. Add lightning logic in update(dt)
update_pattern = r'(if \(this\.mode === \'rain\'\) \{)(.*?\})'
def update_rain(m):
    return '''if (this.mode === 'rain') {
        if (!this.thunderSfx) {
            this.thunderSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-distant-thunder-explosion-1522.mp3');
            this.thunderSfx.volume = 0.5;
        }
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
            this.scene.background = new THREE.Color(0xffffff); // lightning flash
            if(Math.random() > 0.5) this.thunderSfx.play().catch(()=>console.log('Audio wait'));
            this.lightningTimer = 5 + Math.random() * 10;
        } else if (this.scene.background && this.scene.background.getHex && this.scene.background.getHex() === 0xffffff) {
            setTimeout(() => { if(this.scene) this.scene.background = new THREE.Color(this.mapCfg.sky); }, 100);
        }
''' + m.group(2)

text = re.sub(update_pattern, update_rain, text, flags=re.DOTALL)

# 4. Optimizations
text = text.replace('for (let i = 0; i < 300; i++) {', 'for (let i = 0; i < 80; i++) {')
text = text.replace('this.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mob() });', 'this.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mob(), powerPreference: "high-performance" });')
text = text.replace('this.renderer.setPixelRatio(Math.min(devicePixelRatio, mob() ? 1.5 : 2));', 'this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));')

with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Update complete')
