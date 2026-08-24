

class RoadNode {
  constructor(id, x, z) {
    this.id = id;
    this.position = new THREE.Vector3(x, 0, z);
    this.edges = [];
    this.type = 'junction';
    this.metadata = {};
    this._neighbors = null;
  }

  get neighbors() {
    if (!this._neighbors) {
      this._neighbors = this.edges.map(e => e.getOther(this));
    }
    return this._neighbors;
  }

  addEdge(edge) {
    this.edges.push(edge);
    this._neighbors = null;
  }

  getEdgeTo(otherNode) {
    return this.edges.find(e => e.getOther(this) === otherNode);
  }
}

class RoadEdge {
  constructor(id, nodeA, nodeB, options = {}) {
    this.id = id;
    this.nodes = [nodeA, nodeB];
    this.length = nodeA.position.distanceTo(nodeB.position);
    this.direction = new THREE.Vector3().subVectors(nodeB.position, nodeA.position).normalize();
    this.lanes = options.lanes || 1;
    this.width = options.width || 12;
    this.oneWay = options.oneWay || false;
    this.speedLimit = options.speedLimit || 50;
    this.type = options.type || 'arterial';
    this.segments = [];
    this._laneOffsets = null;

    nodeA.addEdge(this);
    nodeB.addEdge(this);
  }


  get startNode() { return this.nodes[0]; }
  get endNode() { return this.nodes[1]; }

  getOther(node) {
    return this.nodes[0] === node ? this.nodes[1] : this.nodes[0];
  }

  getForwardVector(fromNode) {
    return fromNode === this.nodes[0] ? this.direction.clone() : this.direction.clone().negate();
  }

  getLaneOffsets() {
    if (!this._laneOffsets) {
      const halfWidth = this.width / 2;
      const laneWidth = this.width / (this.lanes * 2);
      this._laneOffsets = [];
      for (let i = 0; i < this.lanes * 2; i++) {
        const offset = (i - this.lanes + 0.5) * laneWidth;
        this._laneOffsets.push(offset);
      }
    }
    return this._laneOffsets;
  }

  getPointAt(t) {
    const p = new THREE.Vector3().lerpVectors(this.nodes[0].position, this.nodes[1].position, t);
    p.y = 0;
    return p;
  }

  getLaneCenter(laneIndex, t, side = 0) {
    const p = this.getPointAt(t);
    const right = new THREE.Vector3().crossVectors(this.direction, new THREE.Vector3(0, 1, 0));
    const offsets = this.getLaneOffsets();
    const offset = offsets[laneIndex] || 0;
    return p.add(right.multiplyScalar(offset * (side === 0 ? 1 : -1)));
  }

  subdivide(segmentLength = 40) {
    const numSegs = Math.max(1, Math.ceil(this.length / segmentLength));
    this.segments = [];
    for (let i = 0; i < numSegs; i++) {
      this.segments.push(new RoadSegment(this, i / numSegs, (i + 1) / numSegs));
    }
    return this.segments;
  }
}

class RoadSegment {
  constructor(edge, startT, endT) {
    this.edge = edge;
    this.startT = startT;
    this.endT = endT;
    this.length = edge.length * (endT - startT);
    this.buildingSlots = { left: [], right: [] };
    this.geometry = null;
    this.intersection = null;
  }

  getPointAt(t) {
    return this.edge.getPointAt(this.startT + t * (this.endT - this.startT));
  }

  getDirection() {
    return this.edge.direction.clone();
  }

  addBuildingSlot(slot) {
    this.buildingSlots[slot.side].push(slot);
  }
}

class BuildingSlot {
  constructor(segment, side, offset, depth, zone) {
    this.segment = segment;
    this.side = side;
    this.offset = offset;
    this.depth = depth;
    this.zone = zone;
    this.occupied = false;
    this.building = null;
    segment.addBuildingSlot(this);
  }

  getWorldPosition() {
    const t = this.segment.startT + this.offset * (this.segment.endT - this.segment.startT);
    const p = this.segment.edge.getPointAt(t);
    const forward = this.segment.edge.direction.clone();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    const sideMult = this.side === 'left' ? 1 : -1;
    const roadHalfWidth = this.segment.edge.width / 2;
    return p.add(right.multiplyScalar(sideMult * (roadHalfWidth + this.depth / 2 + 2)));
  }

  getRotation() {
    const forward = this.segment.edge.direction.clone();
    const angle = Math.atan2(forward.x, forward.z);
    return this.side === 'left' ? angle : angle + Math.PI;
  }

  getZone() {
    return this.zone;
  }
}

class RoadGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.segments = [];
    this.buildingSlots = [];
    this.spatialIndex = null;
    this._nodeGrid = null;
    this._gridSize = 100;
  }

  static fromLevelConfig(cfg) {
    const graph = new RoadGraph();
    const nodeMap = new Map();
    const roads = cfg.roads || [];

    const getNode = (x, z) => {
      const k = `${Math.round(x)},${Math.round(z)}`;
      if (!nodeMap.has(k)) {
        const node = new RoadNode(`n_${graph.nodes.size}`, x, z);
        nodeMap.set(k, node);
        graph.nodes.set(node.id, node);
      }
      return nodeMap.get(k);
    };

    // Precompute all v×h crossing points so overlapping roads connect.
    const vRoads = roads.filter(r => r.type === 'v');
    const hRoads = roads.filter(r => r.type === 'h');
    const crossings = new Map(); // road -> array of crossing coords along its axis
    vRoads.forEach(v => crossings.set(v, []));
    hRoads.forEach(h => crossings.set(h, []));
    vRoads.forEach(v => {
      hRoads.forEach(h => {
        // Vertical road: constant x=v.x spanning z1..z2. Horizontal: constant z=h.z spanning x1..x2
        if (v.x >= Math.min(h.x1, h.x2) && v.x <= Math.max(h.x1, h.x2) &&
            h.z >= Math.min(v.z1, v.z2) && h.z <= Math.max(v.z1, v.z2)) {
          crossings.get(v).push(h.z);   // crossing at (v.x, h.z)
          crossings.get(h).push(v.x);   // crossing at (v.x, h.z)
        }
      });
    });

    // Build nodes + edge segments per road (endpoints + sorted crossings)
    roads.forEach(r => {
      const isV = r.type === 'v';
      const crs = (crossings.get(r) || []).slice().sort((a, b) => a - b);
      const lo = isV ? Math.min(r.z1, r.z2) : Math.min(r.x1, r.x2);
      const hi = isV ? Math.max(r.z1, r.z2) : Math.max(r.x1, r.x2);
      // Unique sorted station points along the road axis
      const stations = [lo, ...crs.filter(c => c > lo + 0.5 && c < hi - 0.5), hi]
        .filter((val, i, arr) => i === 0 || val !== arr[i - 1]);
      let prevNode = null;
      stations.forEach(s => {
        const px = isV ? r.x : s;
        const pz = isV ? s : r.z;
        const node = getNode(px, pz);
        if (prevNode && prevNode !== node) {
          const edge = new RoadEdge(`e_${prevNode.id}_${node.id}`, prevNode, node, {
            lanes: r.lanes || 1,
            width: r.width || 12,
            oneWay: r.oneWay || false,
            speedLimit: r.speedLimit || 50,
            type: r.roadType || 'arterial'
          });
          graph.edges.set(edge.id, edge);
        }
        prevNode = node;
      });
    });

    graph.edges.forEach(edge => {
      edge.subdivide(40);
      graph.segments.push(...edge.segments);
    });

    graph.buildBuildingSlots(cfg);
    graph.buildSpatialIndex();
    graph.classifyNodes();

    return graph;
  }

  buildBuildingSlots(cfg) {
    const buildSpacing = cfg.is50km ? 280 : 60;
    this.segments.forEach(seg => {
      const slotCount = Math.max(1, Math.floor(seg.length / buildSpacing));
      ['left', 'right'].forEach(side => {
        for (let s = 0; s < slotCount; s++) {
          const t = (s + 0.5) / slotCount;
          const pos = seg.getPointAt(t);
          const zone = this.getZoneAt(pos.x, pos.z);
          const depth = 15 + Math.random() * 20;
          const slot = new BuildingSlot(seg, side, t, depth, zone);
          this.buildingSlots.push(slot);
        }
      });
    });
  }

  getZoneAt(x, z) {
    if (!this._anchorNodes || !this._anchorNodes.length) return 'Residential';
    let best = this._anchorNodes[0];
    let minDist = Infinity;
    for (const n of this._anchorNodes) {
      const d = Math.hypot(x - n.x, z - n.z);
      if (d < minDist) { minDist = d; best = n; }
    }
    return best.zone;
  }

  setAnchorNodes(anchors) {
    this._anchorNodes = anchors;
  }

  buildSpatialIndex() {
    this._nodeGrid = new Map();
    this.nodes.forEach(node => {
      const gx = Math.floor(node.position.x / this._gridSize);
      const gz = Math.floor(node.position.z / this._gridSize);
      const key = `${gx},${gz}`;
      if (!this._nodeGrid.has(key)) this._nodeGrid.set(key, []);
      this._nodeGrid.get(key).push(node);
    });
  }

  classifyNodes() {
    this.nodes.forEach(node => {
      const degree = node.edges.length;
      if (degree >= 4) node.type = 'major_junction';
      else if (degree === 3) node.type = 't_junction';
      else if (degree === 2) node.type = 'corner';
      else node.type = 'dead_end';
    });
  }

  getNearestNode(x, z) {
    const gx = Math.floor(x / this._gridSize);
    const gz = Math.floor(z / this._gridSize);
    let best = null, bestDist = Infinity;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${gx + dx},${gz + dz}`;
        const cells = this._nodeGrid.get(key);
        if (cells) {
          cells.forEach(node => {
            const d = node.position.distanceTo(new THREE.Vector3(x, 0, z));
            if (d < bestDist) { bestDist = d; best = node; }
          });
        }
      }
    }
    return best;
  }

  getNearestEdge(x, z, maxDist = 50) {
    let best = null, bestDist = Infinity;
    this.edges.forEach(edge => {
      const p = edge.getPointAt(0.5);
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bestDist && d < maxDist) { bestDist = d; best = edge; }
    });
    return best;
  }


  getEdgeList() {
    if (!this._edgeList || this._edgeList.length !== this.edges.size) {
      this._edgeList = Array.from(this.edges.values());
    }
    return this._edgeList;
  }

  getRandomEdge() {
    const list = this.getEdgeList();
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }


  getEdgeTo(nodeA, nodeB) {
    if (!nodeA || !nodeB || !nodeA.edges) return null;
    return nodeA.getEdgeTo(nodeB) || null;
  }

  getEdgesAtIntersection(node) {
    return node.edges;
  }

  findPath(startNode, endNode) {
    const open = new Set([startNode]);
    const cameFrom = new Map();
    const gScore = new Map([[startNode, 0]]);
    const fScore = new Map([[startNode, this._heuristic(startNode, endNode)]]);

    while (open.size > 0) {
      let current = null, lowest = Infinity;
      open.forEach(n => {
        const f = fScore.has(n) ? fScore.get(n) : Infinity;
        if (f < lowest) { lowest = f; current = n; }
      });
      if (current === endNode) return this._reconstructPath(cameFrom, current);

      open.delete(current);
      current.neighbors.forEach(neighbor => {
        const edge = current.getEdgeTo(neighbor);
        if (!edge) return;

        if (edge.oneWay && edge.nodes[0] !== current) return;
        // NOTE: use has() — gScore of exactly 0 is valid (falsy-zero bug made every path fail)
        const tentative = (gScore.has(current) ? gScore.get(current) : Infinity) + edge.length;
        if (!gScore.has(neighbor) || tentative < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentative);
          fScore.set(neighbor, tentative + this._heuristic(neighbor, endNode));
          open.add(neighbor);
        }
      });
    }
    return null;
  }

  _heuristic(a, b) {
    return a.position.distanceTo(b.position);
  }

  _reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.unshift(current);
    }
    return path;
  }

  getBuildingSlotsInRadius(x, z, radius) {
    const results = [];
    this.buildingSlots.forEach(slot => {
      if (!slot.occupied) {
        const pos = slot.getWorldPosition();
        if (Math.hypot(pos.x - x, pos.z - z) < radius) {
          results.push(slot);
        }
      }
    });
    return results;
  }

  getIntersectionsInRadius(x, z, radius) {
    const results = [];
    this.nodes.forEach(node => {
      if (node.type !== 'dead_end') {
        const d = Math.hypot(node.position.x - x, node.position.z - z);
        if (d < radius) results.push(node);
      }
    });
    return results;
  }
}

window.RoadNode = RoadNode;
window.RoadEdge = RoadEdge;
window.RoadSegment = RoadSegment;
window.BuildingSlot = BuildingSlot;
window.RoadGraph = RoadGraph;