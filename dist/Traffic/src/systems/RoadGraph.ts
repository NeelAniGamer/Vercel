// @ts-nocheck
import * as THREE from 'three';

export interface RoadConfig {
  roads: Array<{
    type: 'v' | 'h';
    x?: number;
    z?: number;
    x1?: number;
    x2?: number;
    z1?: number;
    z2?: number;
    lanes?: number;
    width?: number;
    speedLimit?: number;
    oneWay?: boolean;
    roadType?: string;
  }>;
  anchorNodes?: Array<{ x: number; z: number; zone: string }>;
  is50km?: boolean;
}

export interface EdgeOptions {
  lanes?: number;
  width?: number;
  oneWay?: boolean;
  speedLimit?: number;
  type?: string;
}

export class RoadNode {
  id: string;
  position: THREE.Vector3;
  edges: RoadEdge[] = [];
  type: string = 'junction';
  metadata: Record<string, any> = {};
  private _neighbors: RoadNode[] | null = null;

  constructor(id: string, x: number, z: number) {
    this.id = id;
    this.position = new THREE.Vector3(x, 0, z);
  }

  get neighbors(): RoadNode[] {
    if (!this._neighbors) {
      this._neighbors = this.edges.map(e => e.getOther(this));
    }
    return this._neighbors;
  }

  addEdge(edge: RoadEdge): void {
    this.edges.push(edge);
    this._neighbors = null;
  }

  getEdgeTo(otherNode: RoadNode): RoadEdge | undefined {
    return this.edges.find(e => e.getOther(this) === otherNode);
  }
}

export class RoadEdge {
  id: string;
  nodes: [RoadNode, RoadNode];
  length: number;
  direction: THREE.Vector3;
  lanes: number;
  width: number;
  oneWay: boolean;
  speedLimit: number;
  type: string;
  segments: RoadSegment[] = [];
  private _laneOffsets: number[] | null = null;

  constructor(id: string, nodeA: RoadNode, nodeB: RoadNode, options: EdgeOptions = {}) {
    this.id = id;
    this.nodes = [nodeA, nodeB];
    this.length = nodeA.position.distanceTo(nodeB.position);
    this.direction = new THREE.Vector3().subVectors(nodeB.position, nodeA.position).normalize();
    this.lanes = options.lanes ?? 1;
    this.width = options.width ?? 12;
    this.oneWay = options.oneWay ?? false;
    this.speedLimit = options.speedLimit ?? 50;
    this.type = options.type ?? 'arterial';

    nodeA.addEdge(this);
    nodeB.addEdge(this);
  }

  get startNode(): RoadNode { return this.nodes[0]; }
  get endNode(): RoadNode { return this.nodes[1]; }

  getOther(node: RoadNode): RoadNode {
    return this.nodes[0] === node ? this.nodes[1] : this.nodes[0];
  }

  getForwardVector(fromNode: RoadNode): THREE.Vector3 {
    return fromNode === this.nodes[0] ? this.direction.clone() : this.direction.clone().negate();
  }

  getLaneOffsets(): number[] {
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

  getPointAt(t: number): THREE.Vector3 {
    const p = new THREE.Vector3().lerpVectors(this.nodes[0].position, this.nodes[1].position, t);
    p.y = 0;
    return p;
  }

  getLaneCenter(laneIndex: number, t: number, side: number = 0): THREE.Vector3 {
    const p = this.getPointAt(t);
    const right = new THREE.Vector3().crossVectors(this.direction, new THREE.Vector3(0, 1, 0));
    const offsets = this.getLaneOffsets();
    const offset = offsets[laneIndex] || 0;
    return p.add(right.multiplyScalar(offset * (side === 0 ? 1 : -1)));
  }

  subdivide(segmentLength = 40): RoadSegment[] {
    const numSegs = Math.max(1, Math.ceil(this.length / segmentLength));
    this.segments = [];
    for (let i = 0; i < numSegs; i++) {
      this.segments.push(new RoadSegment(this, i / numSegs, (i + 1) / numSegs));
    }
    return this.segments;
  }
}

export class RoadSegment {
  edge: RoadEdge;
  startT: number;
  endT: number;
  length: number;
  buildingSlots: { left: BuildingSlot[]; right: BuildingSlot[] };
  geometry: THREE.BufferGeometry | null = null;
  intersection: any = null;

  constructor(edge: RoadEdge, startT: number, endT: number) {
    this.edge = edge;
    this.startT = startT;
    this.endT = endT;
    this.length = edge.length * (endT - startT);
    this.buildingSlots = { left: [], right: [] };
  }

  getPointAt(t: number): THREE.Vector3 {
    return this.edge.getPointAt(this.startT + t * (this.endT - this.startT));
  }

  getDirection(): THREE.Vector3 {
    return this.edge.direction.clone();
  }

  addBuildingSlot(slot: BuildingSlot): void {
    this.buildingSlots[slot.side].push(slot);
  }
}

export class BuildingSlot {
  segment: RoadSegment;
  side: 'left' | 'right';
  offset: number;
  depth: number;
  zone: string;
  occupied: boolean = false;
  building: THREE.Object3D | null = null;

  constructor(segment: RoadSegment, side: 'left' | 'right', offset: number, depth: number, zone: string) {
    this.segment = segment;
    this.side = side;
    this.offset = offset;
    this.depth = depth;
    this.zone = zone;
    segment.addBuildingSlot(this);
  }

  getWorldPosition(): THREE.Vector3 {
    const t = this.segment.startT + this.offset * (this.segment.endT - this.segment.startT);
    const p = this.segment.edge.getPointAt(t);
    const forward = this.segment.edge.direction.clone();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    const sideMult = this.side === 'left' ? 1 : -1;
    const roadHalfWidth = this.segment.edge.width / 2;
    return p.add(right.multiplyScalar(sideMult * (roadHalfWidth + this.depth / 2 + 2)));
  }

  getRotation(): number {
    const forward = this.segment.edge.direction.clone();
    const angle = Math.atan2(forward.x, forward.z);
    return this.side === 'left' ? angle : angle + Math.PI;
  }

  getZone(): string {
    return this.zone;
  }
}

export class RoadGraph {
  nodes = new Map<string, RoadNode>();
  edges = new Map<string, RoadEdge>();
  segments: RoadSegment[] = [];
  buildingSlots: BuildingSlot[] = [];
  private _nodeGrid: Map<string, RoadNode[]> | null = null;
  private _gridSize = 100;
  private _anchorNodes: Array<{ x: number; z: number; zone: string }> | null = null;
  private _edgeList: RoadEdge[] | null = null;

  static fromLevelConfig(cfg: RoadConfig): RoadGraph {
    const graph = new RoadGraph();
    const nodeMap = new Map<string, RoadNode>();

    // Create nodes from road endpoints
    cfg.roads.forEach(r => {
      const isV = r.type === 'v';
      const pts = isV
        ? [{ x: r.x!, z: r.z1! }, { x: r.x!, z: r.z2! }]
        : [{ x: r.x1!, z: r.z! }, { x: r.x2!, z: r.z! }];
      pts.forEach(p => {
        const k = `${Math.round(p.x)},${Math.round(p.z)}`;
        if (!nodeMap.has(k)) {
          const node = new RoadNode(`n_${graph.nodes.size}`, p.x, p.z);
          nodeMap.set(k, node);
          graph.nodes.set(node.id, node);
        }
      });
    });

    // Create edges from roads
    cfg.roads.forEach(r => {
      const isV = r.type === 'v';
      const pts = isV
        ? [{ x: r.x!, z: r.z1! }, { x: r.x!, z: r.z2! }]
        : [{ x: r.x1!, z: r.z! }, { x: r.x2!, z: r.z! }];
      const kA = `${Math.round(pts[0].x)},${Math.round(pts[0].z)}`;
      const kB = `${Math.round(pts[1].x)},${Math.round(pts[1].z)}`;
      const nA = nodeMap.get(kA);
      const nB = nodeMap.get(kB);
      if (nA && nB) {
        const edge = new RoadEdge(`e_${nA.id}_${nB.id}`, nA, nB, {
          lanes: r.lanes || 1,
          width: r.width || 12,
          oneWay: r.oneWay || false,
          speedLimit: r.speedLimit || 50,
          type: r.roadType || 'arterial'
        });
        graph.edges.set(edge.id, edge);
      }
    });

    // Subdivide edges, build slots, index
    graph.edges.forEach(edge => {
      edge.subdivide(40);
      graph.segments.push(...edge.segments);
    });

    graph.buildBuildingSlots(cfg);
    graph.buildSpatialIndex();
    graph.classifyNodes();

    if (cfg.anchorNodes) {
      graph.setAnchorNodes(cfg.anchorNodes);
    }

    return graph;
  }

  buildBuildingSlots(cfg: RoadConfig): void {
    const buildSpacing = cfg.is50km ? 280 : 60;
    this.segments.forEach(seg => {
      const slotCount = Math.max(1, Math.floor(seg.length / buildSpacing));
      (['left', 'right'] as const).forEach(side => {
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

  getZoneAt(x: number, z: number): string {
    if (!this._anchorNodes || !this._anchorNodes.length) return 'Residential';
    let best = this._anchorNodes[0];
    let minDist = Infinity;
    for (const n of this._anchorNodes) {
      const d = Math.hypot(x - n.x, z - n.z);
      if (d < minDist) { minDist = d; best = n; }
    }
    return best.zone;
  }

  setAnchorNodes(anchors: Array<{ x: number; z: number; zone: string }>): void {
    this._anchorNodes = anchors;
  }

  buildSpatialIndex(): void {
    this._nodeGrid = new Map();
    this.nodes.forEach(node => {
      const gx = Math.floor(node.position.x / this._gridSize);
      const gz = Math.floor(node.position.z / this._gridSize);
      const key = `${gx},${gz}`;
      if (!this._nodeGrid.has(key)) this._nodeGrid.set(key, []);
      this._nodeGrid.get(key)!.push(node);
    });
  }

  classifyNodes(): void {
    this.nodes.forEach(node => {
      const degree = node.edges.length;
      if (degree >= 4) node.type = 'major_junction';
      else if (degree === 3) node.type = 't_junction';
      else if (degree === 2) node.type = 'corner';
      else node.type = 'dead_end';
    });
  }

  getNearestNode(x: number, z: number): RoadNode | null {
    const gx = Math.floor(x / this._gridSize);
    const gz = Math.floor(z / this._gridSize);
    let best: RoadNode | null = null;
    let bestDist = Infinity;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${gx + dx},${gz + dz}`;
        const cells = this._nodeGrid?.get(key);
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

  getNearestEdge(x: number, z: number, maxDist = 50): RoadEdge | null {
    let best: RoadEdge | null = null;
    let bestDist = Infinity;
    this.edges.forEach(edge => {
      const p = edge.getPointAt(0.5);
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bestDist && d < maxDist) { bestDist = d; best = edge; }
    });
    return best;
  }

  getEdgeList(): RoadEdge[] {
    if (!this._edgeList || this._edgeList.length !== this.edges.size) {
      this._edgeList = Array.from(this.edges.values());
    }
    return this._edgeList;
  }

  getRandomEdge(): RoadEdge | null {
    const list = this.getEdgeList();
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }

  findPath(startNode: RoadNode, endNode: RoadNode): RoadNode[] | null {
    const open = new Set<RoadNode>([startNode]);
    const cameFrom = new Map<RoadNode, RoadNode>();
    const gScore = new Map<RoadNode, number>([[startNode, 0]]);
    const fScore = new Map<RoadNode, number>([[startNode, this._heuristic(startNode, endNode)]]);

    while (open.size > 0) {
      let current: RoadNode | null = null;
      let lowest = Infinity;
      open.forEach(n => {
        const f = fScore.get(n) ?? Infinity;
        if (f < lowest) { lowest = f; current = n; }
      });
      if (current === endNode) return this._reconstructPath(cameFrom, current!);

      open.delete(current!);
      current!.neighbors.forEach(neighbor => {
        const edge = current!.getEdgeTo(neighbor);
        if (!edge) return;
        if (edge.oneWay && edge.nodes[0] !== current) return;
        const tentative = (gScore.get(current!) ?? Infinity) + edge.length;
        if (tentative < (gScore.get(neighbor) ?? Infinity)) {
          cameFrom.set(neighbor, current!);
          gScore.set(neighbor, tentative);
          fScore.set(neighbor, tentative + this._heuristic(neighbor, endNode));
          open.add(neighbor);
        }
      });
    }
    return null;
  }

  private _heuristic(a: RoadNode, b: RoadNode): number {
    return a.position.distanceTo(b.position);
  }

  private _reconstructPath(cameFrom: Map<RoadNode, RoadNode>, current: RoadNode): RoadNode[] {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }
    return path;
  }

  getBuildingSlotsInRadius(x: number, z: number, radius: number): BuildingSlot[] {
    return this.buildingSlots.filter(slot => {
      if (slot.occupied) return false;
      const pos = slot.getWorldPosition();
      return Math.hypot(pos.x - x, pos.z - z) < radius;
    });
  }

  getIntersectionsInRadius(x: number, z: number, radius: number): RoadNode[] {
    const results: RoadNode[] = [];
    this.nodes.forEach(node => {
      if (node.type !== 'dead_end') {
        const d = Math.hypot(node.position.x - x, node.position.z - z);
        if (d < radius) results.push(node);
      }
    });
    return results;
  }
}

// Legacy global access (during migration)
if (typeof window !== 'undefined') {
  (window as any).RoadNode = RoadNode;
  (window as any).RoadEdge = RoadEdge;
  (window as any).RoadSegment = RoadSegment;
  (window as any).BuildingSlot = BuildingSlot;
  (window as any).RoadGraph = RoadGraph;
}
