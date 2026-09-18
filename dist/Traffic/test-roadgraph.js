// Headless test for RoadGraph.fromLevelConfig
const fs = require('fs');
const path = require('path');

// Minimal THREE stub
global.window = global;
class V3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  clone(){return new V3(this.x,this.y,this.z);}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  add(v){return new V3(this.x+v.x,this.y+v.y,this.z+v.z);}
  sub(v){return new V3(this.x-v.x,this.y-v.y,this.z-v.z);}
  subVectors(a,b){return new V3(a.x-b.x,a.y-b.y,a.z-b.z);}
  crossVectors(a,b){return new V3(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x);}
  multiplyScalar(s){return new V3(this.x*s,this.y*s,this.z*s);}
  normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;return new V3(this.x/l,this.y/l,this.z/l);}
  length(){return Math.hypot(this.x,this.y,this.z);}
  addScaledVector(v,s){return new V3(this.x+v.x*s,this.y+v.y*s,this.z+v.z*s);}
  lerpVectors(a,b,t){const x=a.x+(b.x-a.x)*t, y=a.y+(b.y-a.y)*t, z=a.z+(b.z-a.z)*t; return new V3(x,y,z);}
}
global.THREE = { Vector3: V3 };

const src = fs.readFileSync(path.join(__dirname, 'road-graph.js'), 'utf8');
eval(src);

// Level 1 roads from live game data
const cfg = {
  roads: [
    { type:'v', x:0, z1:-140, z2:1000 },
    { type:'h', z:-120, x1:-20, x2:140 },
    { type:'h', z:-120, x1:100, x2:260 },
    { type:'v', x:240, z1:-140, z2:20 },
    { type:'v', x:240, z1:-20, z2:140 },
    { type:'v', x:240, z1:100, z2:260 },
    { type:'h', z:240, x1:100, x2:260 },
    { type:'h', z:240, x1:-20, x2:140 },
    { type:'v', x:0, z1:100, z2:260 },
    { type:'h', z:120, x1:-140, x2:20 },
    { type:'v', x:-120, z1:-20, z2:140 },
    { type:'v', x:-120, z1:-140, z2:20 },
    { type:'h', z:-120, x1:-260, x2:-100 },
    { type:'h', z:-120, x1:-380, x2:-220 },
    { type:'h', z:-120, x1:-500, x2:-340 },
    { type:'v', x:-480, z1:-260, z2:-100 },
    { type:'h', z:-240, x1:-500, x2:-340 },
    { type:'v', x:-360, z1:-380, z2:-220 },
    { type:'h', z:-360, x1:-380, x2:-220 },
    { type:'h', z:-360, x1:-260, x2:880 },
    { type:'h', z:120, x1:-1000, x2:1000 },
    { type:'v', x:0, z1:-880, z2:1120 },
    { type:'h', z:240, x1:-760, x2:1240 },
    { type:'v', x:240, z1:-760, z2:1240 },
    { type:'h', z:0, x1:-760, x2:1240 },
    { type:'v', x:240, z1:-1000, z2:1000 },
    { type:'h', z:240, x1:-1000, x2:1000 },
    { type:'v', x:0, z1:-760, z2:1240 },
    { type:'h', z:-240, x1:-1480, x2:520 },
    { type:'v', x:-480, z1:-1240, z2:760 }
  ]
};

try {
  const g = RoadGraph.fromLevelConfig(cfg);
  console.log('OK nodes:', g.nodes.size, 'edges:', g.edges.size);
  // Connectivity check: BFS from first node
  const nodes = Array.from(g.nodes.values());
  const start = nodes[0];
  const visited = new Set([start.id]);
  const queue = [start];
  while (queue.length) {
    const n = queue.pop();
    n.neighbors.forEach(nb => { if (!visited.has(nb.id)) { visited.add(nb.id); queue.push(nb); } });
  }
  console.log('Connected:', visited.size, '/', nodes.length);
  // Test path between two distant nodes
  const far = nodes[nodes.length - 1];
  const p = g.findPath(start, far);
  console.log('Path start->far:', p ? p.length : null);
  // Test building slot generation, spacing, and rotation
  console.log('\n--- Building Slot Verification ---');
  console.log('Total building slots:', g.buildingSlots.length);
  
  let overlapCount = 0;
  let minPairDist = Infinity;
  const positions = g.buildingSlots.map(s => s.getWorldPosition());
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const d = Math.hypot(positions[i].x - positions[j].x, positions[i].z - positions[j].z);
      if (d < minPairDist) minPairDist = d;
      if (d < 14.0) {
        overlapCount++;
        if (overlapCount <= 5) {
          const s1 = g.buildingSlots[i];
          const s2 = g.buildingSlots[j];
          console.log(`Overlap #${overlapCount}: dist=${d.toFixed(2)}m`);
          console.log(`  Slot 1: pos=(${positions[i].x.toFixed(1)}, ${positions[i].z.toFixed(1)}) edge=${s1.segment.edge.id} side=${s1.side} zone=${s1.zone} depth=${s1.depth}`);
          console.log(`  Slot 2: pos=(${positions[j].x.toFixed(1)}, ${positions[j].z.toFixed(1)}) edge=${s2.segment.edge.id} side=${s2.side} zone=${s2.zone} depth=${s2.depth}`);
        }
      }
    }
  }
  
  console.log('Minimum distance between building slots:', minPairDist.toFixed(2), 'm');
  console.log('Overlapping slot pairs (< 14m):', overlapCount);
  
  // Rotation verification: Ensure building faces towards the road
  let rotationErrors = 0;
  g.buildingSlots.forEach(slot => {
    const pos = slot.getWorldPosition();
    const segT = slot.segment.startT + slot.offset * (slot.segment.endT - slot.segment.startT);
    const roadPoint = slot.segment.edge.getPointAt(segT);
    const toRoad = { x: roadPoint.x - pos.x, z: roadPoint.z - pos.z };
    const expectedAngle = Math.atan2(toRoad.x, toRoad.z);
    const actualAngle = slot.getRotation();
    const diff = Math.abs(Math.atan2(Math.sin(expectedAngle - actualAngle), Math.cos(expectedAngle - actualAngle)));
    if (diff > 0.001) rotationErrors++;
  });
  console.log('Rotation alignment errors (must be 0):', rotationErrors);
  
  if (overlapCount === 0 && rotationErrors === 0 && minPairDist >= 14.0) {
    console.log('✅ Standard Level 1 placement verification PASSED!');
  } else {
    console.error('❌ VERIFICATION FAILED: Overlaps or rotation mismatches found.');
    process.exitCode = 1;
  }

  // Now test level_custom.js
  console.log('\n========================================');
  console.log('Testing level_custom.js ("Dense Downtown & Residential Hub")');
  console.log('========================================');
  const customSrc = fs.readFileSync(path.join(__dirname, 'levels', 'level_custom.js'), 'utf8');
  eval(customSrc);
  const customLevel = window.LVS.find(l => l.id === 'custom');
  const gCustom = RoadGraph.fromLevelConfig(customLevel);
  console.log('Custom Level: nodes =', gCustom.nodes.size, 'edges =', gCustom.edges.size);
  console.log('Custom Level: total building slots =', gCustom.buildingSlots.length);
  
  let customOverlapCount = 0;
  let customMinPairDist = Infinity;
  const customPos = gCustom.buildingSlots.map(s => s.getWorldPosition());
  for (let i = 0; i < customPos.length; i++) {
    for (let j = i + 1; j < customPos.length; j++) {
      const d = Math.hypot(customPos[i].x - customPos[j].x, customPos[i].z - customPos[j].z);
      if (d < customMinPairDist) customMinPairDist = d;
      if (d < 14.0) customOverlapCount++;
    }
  }
  console.log('Custom Level: Min distance between building slots =', customMinPairDist.toFixed(2), 'm');
  console.log('Custom Level: Overlapping slots (< 14m) =', customOverlapCount);

  let customRotErrors = 0;
  gCustom.buildingSlots.forEach(slot => {
    const pos = slot.getWorldPosition();
    const segT = slot.segment.startT + slot.offset * (slot.segment.endT - slot.segment.startT);
    const roadPoint = slot.segment.edge.getPointAt(segT);
    const toRoad = { x: roadPoint.x - pos.x, z: roadPoint.z - pos.z };
    const expectedAngle = Math.atan2(toRoad.x, toRoad.z);
    const actualAngle = slot.getRotation();
    const diff = Math.abs(Math.atan2(Math.sin(expectedAngle - actualAngle), Math.cos(expectedAngle - actualAngle)));
    if (diff > 0.001) customRotErrors++;
  });
  console.log('Custom Level: Rotation alignment errors =', customRotErrors);

  // Check residential house slots count and distribution
  const resSlots = gCustom.buildingSlots.filter(s => s.zone === 'Residential');
  const commSlots = gCustom.buildingSlots.filter(s => s.zone === 'Commercial');
  console.log('Custom Level: Residential slots =', resSlots.length, 'Commercial slots =', commSlots.length);

  if (customOverlapCount === 0 && customRotErrors === 0 && customMinPairDist >= 14.0 && resSlots.length > 50) {
    console.log('✅ Custom Level placement verification PASSED!');
  } else {
    console.error('❌ Custom Level verification FAILED.');
    process.exitCode = 1;
  }
} catch (e) {
  console.error('THREW:', e.message);
  console.error(e.stack.split('\n').slice(0,5).join('\n'));
  process.exitCode = 1;
}
