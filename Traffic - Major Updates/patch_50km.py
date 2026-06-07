import re

with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update UI LEVELS array
level_16_ui = """,
      {
        id: 16, icon: '🌍', name: '50km Open World', v: ' Any Vehicle', col: '#9b59b6', gr: 'linear-gradient(135deg,#8e44ad,#9b59b6)', tg: 'Endless Free Roam', ds: 'Drive in any direction without limits across a massive 50km asphalt sandbox.',
        hps: ['Off-road restrictions are completely disabled.', 'Procedural mapping is active.'],
        law: { sec: 'Free Roam Area', fine: '0', off: 'None' },
        theory: 'A 50km sandbox allows testing of maximum vehicle speed and handling without infrastructure limits.',
        pract: 'Drive anywhere. No restrictions, no off-road damage.',
        quiz: [{ q: 'What happens if you drive off-road in the 50km sandbox?', o: ['You get fined', 'Your vehicle takes damage', 'Nothing, there is no off-road penalty'], a: 2 }],
        mode: 'freeroam'
      }"""
text = re.sub(r'(mode:\s*\'final\'\s*\n\s*\})', r'\1' + level_16_ui, text)

# 2. Update _getMapConfig M object
level_16_config = """,
          16: { name: '50km Open World', sky: 0x6fb8e0, fog: 55000, ground: 0x444444, amb: 0.9, veh: 'car', npcTypes: ['car', 'bike', 'bus', 'truck'], roads: [], ints: [], bldg: [], timeLimit: 999999, is50km: true }"""
text = re.sub(r'(15:\s*\{\s*name:\s*\'South Mumbai Circuit\'[^}]+?\})', r'\1' + level_16_config, text)

# 3. Update ground mesh
ground_regex = r'const ground = new THREE\.Mesh\(new THREE\.PlaneGeometry\(2000,\s*2000\),\s*cfg\.isBridge \? mats\.water : mats\.grass\);'
ground_replacement = 'const ground = new THREE.Mesh(new THREE.PlaneGeometry(cfg.is50km ? 100000 : 2000, cfg.is50km ? 100000 : 2000), cfg.isBridge ? mats.water : (cfg.is50km ? new THREE.MeshLambertMaterial({ color: 0x444444 }) : mats.grass));'
if 'const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000)' in text:
    text = re.sub(ground_regex, ground_replacement, text)

# 4. Update off-road logic
offroad_regex = r'let onRoad = false;'
offroad_replacement = 'let onRoad = (this.mapCfg && this.mapCfg.is50km) ? true : false;'
text = text.replace(offroad_regex, offroad_replacement)

with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched successfully")
