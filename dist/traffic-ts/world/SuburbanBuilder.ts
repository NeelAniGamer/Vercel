import * as THREE from 'three';
import { RoadGraph, BuildingSlot } from './RoadGraph';
import { VehicleFactory } from '../entities/VehicleFactory';

export class SuburbanBuilder {
  static buildNeighborhood(scene: THREE.Scene, graph: RoadGraph): THREE.Group {
    const root = new THREE.Group();

    // Shared materials
    const lawnMat = new THREE.MeshToonMaterial({ color: 0x4ade80 });
    const driveMat = new THREE.MeshToonMaterial({ color: 0xe2e8f0 });
    const fenceMat = new THREE.MeshToonMaterial({ color: 0xa16207 });
    const hedgeMat = new THREE.MeshToonMaterial({ color: 0x15803d });
    const treeTrunkMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const treeFoliageMat = new THREE.MeshToonMaterial({ color: 0x16a34a });
    const flowerMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const flowerMat2 = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const ironMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const mailboxMat = new THREE.MeshToonMaterial({ color: 0x78350f });

    const houseRoofColors = [0xdc2626, 0xd97706, 0x15803d, 0x2563eb, 0x8b5cf6, 0xb45309];
    const houseWallColors = [0xf8fafc, 0xf1f5f9, 0xfef08a, 0xe2e8f0, 0xfbcfe8, 0xbae6fd];

    graph.buildingSlots.forEach((slot: BuildingSlot, idx: number) => {
      const propGroup = new THREE.Group();
      propGroup.position.copy(slot.position);
      propGroup.rotation.y = slot.rotation;

      // 1. Manicured Green Front Lawn
      const lawnW = 22, lawnD = 18;
      const lawn = new THREE.Mesh(new THREE.BoxGeometry(lawnW, 0.12, lawnD), lawnMat);
      lawn.position.set(0, 0.06, 0);
      lawn.receiveShadow = true;
      lawn.userData = { isGround: true, noLod: true };
      propGroup.add(lawn);

      // 2. Stone/Paved Driveway leading to Road
      const driveW = 4.2, driveD = 11.5;
      const driveX = (idx % 2 === 0 ? 5.5 : -5.5);
      const drive = new THREE.Mesh(new THREE.BoxGeometry(driveW, 0.14, driveD), driveMat);
      drive.position.set(driveX, 0.07, -lawnD / 2 + driveD / 2);
      drive.receiveShadow = true;
      propGroup.add(drive);

      // 3. Stepping Stone Walkway to Front Porch
      for (let st = 0; st < 5; st++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.9), driveMat);
        step.position.set(0, 0.08, -lawnD / 2 + 1.2 + st * 1.6);
        step.userData = { isSmallProp: true };
        propGroup.add(step);
      }

      // 4. Low Wooden Perimeter Fence & Hedgerows
      const fenceL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, lawnD - 2), fenceMat);
      fenceL.position.set(-lawnW / 2 + 0.2, 0.45, 0);
      const fenceR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, lawnD - 2), fenceMat);
      fenceR.position.set(lawnW / 2 - 0.2, 0.45, 0);
      propGroup.add(fenceL, fenceR);

      const hedge = new THREE.Mesh(new THREE.BoxGeometry(lawnW - 7, 0.9, 0.6), hedgeMat);
      hedge.position.set(-driveX * 0.4, 0.48, -lawnD / 2 + 1.2);
      hedge.castShadow = true;
      propGroup.add(hedge);

      // 5. Parked Low-Poly Car in Driveway
      if (Math.random() > 0.15) {
        const pCar = VehicleFactory.createParkedCar(idx);
        pCar.scale.set(0.85, 0.85, 0.85);
        pCar.position.set(driveX, 0.08, -lawnD / 2 + 4.5);
        pCar.userData = { isParkedCar: true };
        propGroup.add(pCar);
      }

      // 6. Low-Poly Faceted Tree & Flowerbeds
      const treeX = -driveX * 0.75;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.5, 6), treeTrunkMat);
      trunk.position.set(treeX, 1.25, -lawnD / 2 + 3.8);
      trunk.castShadow = true;
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), treeFoliageMat);
      foliage.position.set(treeX, 3.2, -lawnD / 2 + 3.8);
      foliage.castShadow = true;
      propGroup.add(trunk, foliage);

      for (let fl = 0; fl < 6; fl++) {
        const fMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 4), fl % 2 === 0 ? flowerMat1 : flowerMat2);
        fMesh.position.set(treeX + (fl % 3) * 0.5 - 0.5, 0.22, -lawnD / 2 + 2.4 + Math.floor(fl / 3) * 0.5);
        fMesh.userData = { isSmallProp: true };
        propGroup.add(fMesh);
      }

      // 7. Mailbox on Post at Curb
      const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), mailboxMat);
      mbPost.position.set(driveX > 0 ? driveX + 2.4 : driveX - 2.4, 0.55, -lawnD / 2 + 0.6);
      const mbBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.5), new THREE.MeshToonMaterial({ color: 0xe2e8f0 }));
      mbBox.position.set(driveX > 0 ? driveX + 2.4 : driveX - 2.4, 1.15, -lawnD / 2 + 0.6);
      mbPost.userData = { isSmallProp: true };
      mbBox.userData = { isSmallProp: true };
      propGroup.add(mbPost, mbBox);

      // 8. Charming Suburban House with Pitched Gabled Roof & Porch
      const houseW = 10, houseH = 5.2, houseD = 9;
      const wallMat = new THREE.MeshToonMaterial({ color: houseWallColors[idx % houseWallColors.length] });
      const houseBody = new THREE.Mesh(new THREE.BoxGeometry(houseW, houseH, houseD), wallMat);
      houseBody.position.set(0, houseH / 2, 3.5);
      houseBody.castShadow = true;
      houseBody.receiveShadow = true;
      houseBody.userData = { isMainHull: true };
      propGroup.add(houseBody);

      const roofMat = new THREE.MeshToonMaterial({ color: houseRoofColors[idx % houseRoofColors.length] });
      const roofApex = new THREE.Mesh(new THREE.ConeGeometry(houseW * 0.72, 3.2, 4), roofMat);
      roofApex.position.set(0, houseH + 1.6, 3.5);
      roofApex.rotation.y = Math.PI / 4;
      roofApex.castShadow = true;
      propGroup.add(roofApex);

      // Front Porch & Steps
      const porch = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 2.2), driveMat);
      porch.position.set(0, 0.2, -houseD / 2 + 3.5 - 1.1);
      propGroup.add(porch);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.5), new THREE.MeshToonMaterial({ color: 0xffffff }));
      bench.position.set(1.4, 0.6, -houseD / 2 + 3.5 - 0.8);
      bench.userData = { isSmallProp: true };
      propGroup.add(bench);

      // Bay Windows
      const winGlow = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
      ;[-2.8, 2.8].forEach(wx => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.4), winGlow);
        win.position.set(wx, 2.6, -houseD / 2 + 3.5);
        propGroup.add(win);
      });

      // 9. Road Manhole & Storm Drain Grate at Curb
      const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16), ironMat);
      manhole.position.set(-driveX * 0.5, 0.04, -lawnD / 2 - 3.5);
      manhole.userData = { isGround: true, noLod: true };
      propGroup.add(manhole);

      const grate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.42), ironMat);
      grate.position.set(driveX * 0.8, 0.04, -lawnD / 2 - 0.4);
      grate.userData = { isGround: true, noLod: true };
      propGroup.add(grate);

      root.add(propGroup);
    });

    // Build Roads & Sidewalks from Edges
    graph.edges.forEach(edge => {
      const roadGeo = new THREE.PlaneGeometry(edge.width, edge.length);
      const roadMat = new THREE.MeshToonMaterial({ color: 0x334155 });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;

      const midPoint = new THREE.Vector3().lerpVectors(edge.startNode.position, edge.endNode.position, 0.5);
      roadMesh.position.set(midPoint.x, 0.02, midPoint.z);
      roadMesh.rotation.z = -Math.atan2(edge.direction.x, edge.direction.z);
      roadMesh.receiveShadow = true;
      roadMesh.userData = { isGround: true, noLod: true };
      root.add(roadMesh);

      // Elevated Concrete Sidewalks on left and right
      const swW = 3.5;
      const swH = 0.22;
      const swGeo = new THREE.BoxGeometry(swW, swH, edge.length);
      const swMat = new THREE.MeshToonMaterial({ color: 0xcfd8dc });

      [-1, 1].forEach(side => {
        const sw = new THREE.Mesh(swGeo, swMat);
        const perp = new THREE.Vector3(-edge.direction.z, 0, edge.direction.x).multiplyScalar(side * (edge.width / 2 + swW / 2));
        sw.position.copy(midPoint).add(perp);
        sw.position.y = swH / 2;
        sw.rotation.y = Math.atan2(edge.direction.x, edge.direction.z);
        sw.receiveShadow = true;
        sw.userData = { isGround: true, noLod: true };
        root.add(sw);
      });
    });

    scene.add(root);
    return root;
  }
}
