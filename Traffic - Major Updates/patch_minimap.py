import re

with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Modify _getMapConfig for Level 15
level15_generator = '''
        if (lvId === 15) {
          const rds = [];
          const ints = [];
          // 50km grid (-25000 to 25000)
          for(let i = -25000; i <= 25000; i+=1000) {
             rds.push({ type: 'h', z: i, x1: -25000, x2: 25000 });
             rds.push({ type: 'v', x: i, z1: -25000, z2: 25000 });
             for(let j = -25000; j <= 25000; j+=1000) {
                ints.push([i, j]);
             }
          }
          return { name: '50km Open World', sky: 0x6fb8e0, fog: 2000, ground: 0x444444, amb: 0.9, veh: 'car', npcTypes: ['car', 'bike', 'bus', 'truck'], roads: rds, ints: ints, bldg: [], route: [], timeLimit: 999999, is50km: true };
        }
        return M[lvId] || M[1];
'''
text = re.sub(r'return M\[lvId\] \|\| M\[1\];', level15_generator, text)

# 2. Modify Ground geometry
ground_regex = r'const ground = new THREE\.Mesh\(new THREE\.PlaneGeometry\(2000,\s*2000\),\s*cfg\.isBridge \? mats\.water : mats\.grass\);'
ground_replacement = 'const ground = new THREE.Mesh(new THREE.PlaneGeometry(cfg.is50km ? 100000 : 2000, cfg.is50km ? 100000 : 2000), cfg.isBridge ? mats.water : (cfg.is50km ? new THREE.MeshLambertMaterial({ color: 0x444444 }) : mats.grass));'
if 'const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000)' in text:
    text = re.sub(ground_regex, ground_replacement, text)

# 3. Inject Minimap Rendering logic into the render loop
# Careful to only replace the EXACT standalone render call, not the return; one.
# Wait, there are two render calls:
# `if (!this.playing || this.pause) { if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera); return; }`
# `this.renderer.render(this.scene, this.camera);`
# I will just replace the specific one.
minimap_render_logic = '''
        if (!this.mmCam) {
            this.mmCam = new THREE.OrthographicCamera(-500, 500, 500, -500, 1, 2000);
            this.mmCam.position.set(0, 800, 0);
            this.mmCam.lookAt(0, 0, 0);
            this.mmCam.rotation.order = 'YXZ'; // Important for top down rotation
        }
        
        // Full screen main camera
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.setScissorTest(false);
        this.renderer.render(this.scene, this.camera);
        
        // Minimap
        const mS = Math.min(window.innerWidth, window.innerHeight) * 0.25;
        this.renderer.setViewport(window.innerWidth - mS - 20, 20, mS, mS);
        this.renderer.setScissor(window.innerWidth - mS - 20, 20, mS, mS);
        this.renderer.setScissorTest(true);
        
        if (this.player && this.player.position) {
            this.mmCam.position.set(this.player.position.x, 800, this.player.position.z);
            this.mmCam.rotation.z = this.player.rotation.y; 
        }
        
        this.renderer.render(this.scene, this.mmCam);
        this.renderer.setScissorTest(false);
'''
text = re.sub(r'this\.renderer\.render\(this\.scene,\s*this\.camera\);(?![\s\S]*this\.renderer\.render)', minimap_render_logic, text)

# 4. Offroad logic update
offroad_regex = r'let onRoad = false;'
offroad_replacement = 'let onRoad = (this.mapCfg && this.mapCfg.is50km) ? true : false;'
text = text.replace(offroad_regex, offroad_replacement)

with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Minimap and 50km generated successfully.')
