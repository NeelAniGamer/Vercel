const fs = require('fs');
let code = fs.readFileSync('game_core.js', 'utf8');

const lines = code.split('\n');

const correctBlock = `        if (!cfg.isPedestrian) {
          for (let i = 0; i < 6; i++) {
            const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
            const types = ['car', 'auto', 'bike'];
            const pcTpl = _getNpcTemplate(types[i % 3], Math.random() * 0xffffff);
            if (pcTpl) {
              const pc = pcTpl.clone();
              if (seg.type === 'v') pc.position.set(seg.x + (Math.random() > .5 ? 5.5 : -5.5), 0, seg.z1 + Math.random() * (seg.z2 - seg.z1));
              else pc.position.set(seg.x1 + Math.random() * (seg.x2 - seg.x1), 0, seg.z + (Math.random() > .5 ? 5.5 : -5.5));
              pc.userData = { isParked: true, halfW: 2.5, halfD: 1.5 };
              this.scene.add(pc); this.obstacles.push(pc);
            }
          }
        }
      
      // Initialize TrafficManager and NPCAI for Mumbai-style traffic
      if (!cfg.isPedestrian && window.TrafficManager && window.NPCAI) {
        if (!this.trafficManager) {
          this.trafficManager = new window.TrafficManager(this);
          this.npcAI = new window.NPCAI(this);
        }
        this.trafficManager.init(cfg.npcTypes || []);
        this.npcAI.init();
      }
       
      // ─── Graph-based road generation ───
      // Builds visual road geometry (tiles, sidewalks, crosswalks) from RoadGraph edges
      // Uses GLB road models when available, falls back to procedural geometry
      }

      _buildRoadsFromGraph(roadWidth) {`;

// Replace lines 3189 to 3204 (which is indices 3189 to 3203 inclusive) with correctBlock
// Find the exact line index of "_buildRoadsFromGraph(roadWidth) {"
let roadGraphLine = lines.findIndex(l => l.includes('_buildRoadsFromGraph(roadWidth) {'));
if (roadGraphLine > 0) {
    // find the "if (!cfg.isPedestrian) {" line above it (which should be around line 3189)
    let startLine = roadGraphLine;
    while(startLine > 0 && !lines[startLine].includes('if (!cfg.isPedestrian) {')) {
        startLine--;
    }
    
    if (startLine > 0) {
        // Splice out the broken lines and insert the correct block lines
        let correctLines = correctBlock.split('\n');
        lines.splice(startLine, roadGraphLine - startLine + 1, ...correctLines);
        fs.writeFileSync('game_core.js', lines.join('\n'));
        console.log('Fixed successfully.');
    } else {
        console.log('Could not find startLine');
    }
} else {
    console.log('Could not find roadGraphLine');
}
