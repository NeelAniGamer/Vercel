import * as THREE from 'three';
import { RoadDef } from '../types';

export class RoadNode {
  id: string;
  position: THREE.Vector3;
  edges: RoadEdge[] = [];

  constructor(id: string, x: number, z: number) {
    this.id = id;
    this.position = new THREE.Vector3(x, 0, z);
  }
}

export class RoadEdge {
  id: string;
  startNode: RoadNode;
  endNode: RoadNode;
  length: number;
  direction: THREE.Vector3;
  width: number;
  lanes: number;

  constructor(id: string, start: RoadNode, end: RoadNode, width = 16, lanes = 2) {
    this.id = id;
    this.startNode = start;
    this.endNode = end;
    this.width = width;
    this.lanes = lanes;
    this.length = start.position.distanceTo(end.position);
    this.direction = new THREE.Vector3()
      .subVectors(end.position, start.position)
      .normalize();
  }
}

export class BuildingSlot {
  edge: RoadEdge;
  side: 'left' | 'right';
  t: number;
  depth: number;
  position: THREE.Vector3;
  rotation: number;
  occupied = false;

  constructor(edge: RoadEdge, side: 'left' | 'right', t: number, depth: number) {
    this.edge = edge;
    this.side = side;
    this.t = t;
    this.depth = depth;

    // Calculate position along edge
    const p = new THREE.Vector3().lerpVectors(edge.startNode.position, edge.endNode.position, t);
    
    // Perpendicular vector for sidewalk setback
    const perp = new THREE.Vector3(-edge.direction.z, 0, edge.direction.x);
    if (side === 'left') perp.negate();

    p.addScaledVector(perp, depth);
    this.position = p;

    // Fixed orientation vector mathematics: Buildings face street normal
    const roadAngle = Math.atan2(edge.direction.x, edge.direction.z);
    this.rotation = side === 'left' ? roadAngle - Math.PI / 2 : roadAngle + Math.PI / 2;
  }
}

export class RoadGraph {
  nodes: Map<string, RoadNode> = new Map();
  edges: RoadEdge[] = [];
  buildingSlots: BuildingSlot[] = [];

  static fromRoadDefs(roads: RoadDef[]): RoadGraph {
    const graph = new RoadGraph();

    roads.forEach((r, idx) => {
      let x1 = 0, z1 = 0, x2 = 0, z2 = 0;
      if (r.type === 'v') {
        x1 = r.x || 0;
        x2 = r.x || 0;
        z1 = r.z1 ?? -600;
        z2 = r.z2 ?? 600;
      } else {
        z1 = r.z || 0;
        z2 = r.z || 0;
        x1 = r.x1 ?? -600;
        x2 = r.x2 ?? 600;
      }

      const n1 = graph.getOrCreateNode(`${r.type}_${idx}_1`, x1, z1);
      const n2 = graph.getOrCreateNode(`${r.type}_${idx}_2`, x2, z2);

      const edge = new RoadEdge(`edge_${idx}`, n1, n2, r.width || 16, r.lanes || 2);
      n1.edges.push(edge);
      graph.edges.push(edge);

      // Generate Building Slots with 18m corner clearance
      const slotSpacing = 26.0;
      const count = Math.max(1, Math.floor(edge.length / slotSpacing));
      const roadHalfW = (r.width || 16) / 2;
      const setback = roadHalfW + 11.5;

      ['left', 'right'].forEach(side => {
        for (let i = 0; i < count; i++) {
          const t = (i + 0.5) / count;
          const pos = new THREE.Vector3().lerpVectors(n1.position, n2.position, t);
          
          // Enforce intersection corner buffer
          if (pos.distanceTo(n1.position) < 18 || pos.distanceTo(n2.position) < 18) continue;

          graph.buildingSlots.push(new BuildingSlot(edge, side as 'left' | 'right', t, setback));
        }
      });
    });

    return graph;
  }

  private getOrCreateNode(id: string, x: number, z: number): RoadNode {
    const key = `${Math.round(x)},${Math.round(z)}`;
    if (!this.nodes.has(key)) {
      this.nodes.set(key, new RoadNode(id, x, z));
    }
    return this.nodes.get(key)!;
  }
}
