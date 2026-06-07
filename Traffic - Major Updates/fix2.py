with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# We will just search for the specific lines to replace
old_block = """          let startX = 0, startZ = -240, rY = 0;
          if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
            const p1 = this.mapCfg.route[0];
            const p2 = this.mapCfg.route[1];
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const nx = dx / dist;
            const nz = dz / dist;
          }
          //  ON-ROAD START
          this.player.position.set(5, 0, Math.min(Math.max(-860, this.cur.zs || 0), 0));
          this.player.rotation.y = 0;"""

new_block = """          let startX = 5, startZ = 0, rY = 0;
          if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
            const p1 = this.mapCfg.route[0];
            const p2 = this.mapCfg.route[1];
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0) {
              const nx = dx / dist;
              const nz = dz / dist;
              startX = p1.x - nz * 5;
              startZ = p1.z + nx * 5;
              rY = Math.atan2(nx, nz);
            }
          }
          this.player.position.set(startX, 0, startZ);
          this.player.rotation.y = rY;"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully replaced.")
else:
    print("Old block not found. Checking for exact match issues...")
    # fallback regex
    pattern = re.compile(r'let startX = 0, startZ = -240, rY = 0;[\s\S]*?this\.player\.rotation\.y = 0;')
    text, count = pattern.subn(new_block, text)
    if count > 0:
        with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Successfully replaced using regex.")
    else:
        print("Regex failed too.")

