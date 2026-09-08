import * as THREE from 'three';
import { VehicleFactory } from './VehicleFactory';
import { RoadGraph } from '../world/RoadGraph';

export interface NPCVehicle {
  mesh: THREE.Group;
  speed: number;
  maxSpeed: number;
  lane: number;
  routeIdx: number;
  path: THREE.Vector3[];
}

export class TrafficManager {
  scene: THREE.Scene;
  npcs: NPCVehicle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnInitialTraffic(graph: RoadGraph, count = 35) {
    if (!graph.edges.length) return;

    for (let i = 0; i < count; i++) {
      const edge = graph.edges[i % graph.edges.length];
      const t = Math.random();
      const pos = new THREE.Vector3().lerpVectors(edge.startNode.position, edge.endNode.position, t);

      // Lane offset
      const perp = new THREE.Vector3(-edge.direction.z, 0, edge.direction.x);
      const laneOffset = (i % 2 === 0 ? 2.4 : -2.4);
      pos.addScaledVector(perp, laneOffset);

      const mesh = VehicleFactory.createVehicle(i % 3 === 0 ? 'taxi' : 'sports_gt');
      mesh.position.copy(pos);
      mesh.rotation.y = Math.atan2(edge.direction.x, edge.direction.z);
      this.scene.add(mesh);

      this.npcs.push({
        mesh,
        speed: 0.35 + Math.random() * 0.25,
        maxSpeed: 0.65,
        lane: i % 2,
        routeIdx: 0,
        path: [edge.startNode.position, edge.endNode.position]
      });
    }
  }

  update(dt: number, playerPos: THREE.Vector3) {
    this.npcs.forEach(npc => {
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), npc.mesh.rotation.y);
      npc.mesh.position.addScaledVector(forward, npc.speed * dt * 60);

      // Respawn ahead of player if too far behind
      if (npc.mesh.position.distanceTo(playerPos) > 180) {
        const offset = (Math.random() - 0.5) * 80;
        npc.mesh.position.x = playerPos.x + offset;
        npc.mesh.position.z = playerPos.z + 120;
      }
    });
  }

  dispose() {
    this.npcs.forEach(n => this.scene.remove(n.mesh));
    this.npcs = [];
  }
}
