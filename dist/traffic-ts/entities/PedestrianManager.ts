import * as THREE from 'three';
import { RoadGraph } from '../world/RoadGraph';

export interface Pedestrian {
  group: THREE.Group;
  speed: number;
  direction: number;
  walkTimer: number;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
}

export class PedestrianManager {
  scene: THREE.Scene;
  pedestrians: Pedestrian[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnPedestrians(graph: RoadGraph, count = 16) {
    if (!graph.edges.length) return;

    for (let i = 0; i < count; i++) {
      const edge = graph.edges[i % graph.edges.length];
      const t = Math.random();
      const pos = new THREE.Vector3().lerpVectors(edge.startNode.position, edge.endNode.position, t);

      // Sidewalk lateral offset
      const perp = new THREE.Vector3(-edge.direction.z, 0, edge.direction.x);
      const side = (i % 2 === 0 ? 1 : -1);
      pos.addScaledVector(perp, side * (edge.width / 2 + 1.8));

      const group = new THREE.Group();
      group.position.copy(pos);
      group.position.y = 0.22; // On top of sidewalk curb

      const bodyMat = new THREE.MeshToonMaterial({ color: i % 2 === 0 ? 0x2563eb : 0xd97706 });
      const skinMat = new THREE.MeshToonMaterial({ color: 0xfbcfe8 });
      const darkMat = new THREE.MeshToonMaterial({ color: 0x1e293b });

      // Torso & Head
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), bodyMat);
      torso.position.y = 0.9;
      torso.castShadow = true;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
      head.position.y = 1.35;
      group.add(head);

      // Animated Legs
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), darkMat);
      leftLeg.position.set(0.12, 0.35, 0);
      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), darkMat);
      rightLeg.position.set(-0.12, 0.35, 0);
      group.add(leftLeg, rightLeg);

      this.scene.add(group);

      this.pedestrians.push({
        group,
        speed: 0.08 + Math.random() * 0.04,
        direction: side,
        walkTimer: Math.random() * Math.PI * 2,
        leftLeg,
        rightLeg
      });
    }
  }

  update(dt: number) {
    this.pedestrians.forEach(ped => {
      ped.walkTimer += dt * 6.0;
      if (ped.leftLeg && ped.rightLeg) {
        ped.leftLeg.rotation.x = Math.sin(ped.walkTimer) * 0.45;
        ped.rightLeg.rotation.x = -Math.sin(ped.walkTimer) * 0.45;
      }
    });
  }

  dispose() {
    this.pedestrians.forEach(p => this.scene.remove(p.group));
    this.pedestrians = [];
  }
}
