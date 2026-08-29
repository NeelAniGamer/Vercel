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
  // Test path used by NPC spawn scenario
  const edgeList = Array.from(g.edges.values());
  const e0 = edgeList[Math.floor(Math.random()*edgeList.length)];
  const p2 = g.findPath(e0.nodes[0], e0.nodes[1]);
  console.log('Path across one edge:', p2 ? p2.length : null);
} catch (e) {
  console.error('THREW:', e.message);
  console.error(e.stack.split('\n').slice(0,5).join('\n'));
}
