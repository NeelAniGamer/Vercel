import * as THREE from 'three';
import { PLANET_RADIUS, getTerrainHeight, orientToSphere, latLonToVector3 } from './math';

export interface NPCTrafficVehicle {
  group: THREE.Group;
  type: 'bus' | 'taxi' | 'auto';
  waypoints: THREE.Vector3[];
  currentWaypointIndex: number;
  speed: number;
  position: THREE.Vector3;
  wheels: THREE.Mesh[];
}

export class TrafficNPCs {
  public group: THREE.Group = new THREE.Group();
  public vehicles: NPCTrafficVehicle[] = [];

  constructor() {
    this.createBESTBus();
    this.createKaaliPeeliTaxis();
    this.createFellowAutos();
  }

  /**
   * Iconic Red BEST Double-Decker Bus cruising Marine Drive
   */
  private createBESTBus() {
    const busGroup = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }); // BEST red
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

    // Lower Deck
    const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 6.5), redMat);
    lowerDeck.position.y = 1.3;
    lowerDeck.castShadow = true;
    busGroup.add(lowerDeck);

    // Upper Deck
    const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.6, 6.2), redMat);
    upperDeck.position.y = 2.9;
    upperDeck.castShadow = true;
    busGroup.add(upperDeck);

    // White Route Board ("C-10 Express: CSMT to Nariman Point")
    const routeBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), whiteMat);
    routeBoard.position.set(0, 3.4, -3.12);
    busGroup.add(routeBoard);

    // 6 Wheels
    const wheels: THREE.Mesh[] = [];
    const wGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.28, 16);
    wGeom.rotateZ(Math.PI / 2);

    for (let side of [-1.2, 1.2]) {
      for (let z of [-2.0, 1.2, 2.0]) {
        const wheel = new THREE.Mesh(wGeom, rubberMat);
        wheel.position.set(side, 0.48, z);
        busGroup.add(wheel);
        wheels.push(wheel);
      }
    }

    // Waypoint Loop on Marine Drive
    const waypoints = [
      latLonToVector3(5, -15, 1),
      latLonToVector3(12, -22, 1),
      latLonToVector3(22, -18, 1),
      latLonToVector3(15, -8, 1)
    ].map((norm) => norm.clone().normalize().multiplyScalar(PLANET_RADIUS + getTerrainHeight(norm.clone().normalize())));

    orientToSphere(busGroup, waypoints[0]);
    this.group.add(busGroup);

    this.vehicles.push({
      group: busGroup,
      type: 'bus',
      waypoints,
      currentWaypointIndex: 0,
      speed: 10.0,
      position: waypoints[0].clone(),
      wheels
    });
  }

  /**
   * 2 Kaali-Peeli Padmini Taxis
   */
  private createKaaliPeeliTaxis() {
    for (let t = 0; t < 2; t++) {
      const taxiGroup = new THREE.Group();
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

      // Body (Black bottom, yellow roof)
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 3.4), blackMat);
      body.position.y = 0.6;
      taxiGroup.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 2.0), yellowMat);
      roof.position.set(0, 1.2, 0.1);
      taxiGroup.add(roof);

      // Taxi Roof Light
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.2), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6 }));
      light.position.set(0, 1.58, 0.1);
      taxiGroup.add(light);

      // 4 Wheels
      const wheels: THREE.Mesh[] = [];
      const wGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 16);
      wGeom.rotateZ(Math.PI / 2);

      for (let side of [-0.85, 0.85]) {
        for (let z of [-1.1, 1.1]) {
          const wheel = new THREE.Mesh(wGeom, rubberMat);
          wheel.position.set(side, 0.35, z);
          taxiGroup.add(wheel);
          wheels.push(wheel);
        }
      }

      // Waypoints
      const baseLat = 15 + t * 14;
      const waypoints = [
        latLonToVector3(baseLat, 5, 1),
        latLonToVector3(baseLat + 8, 18, 1),
        latLonToVector3(baseLat + 12, 5, 1),
        latLonToVector3(baseLat + 4, -8, 1)
      ].map((norm) => norm.clone().normalize().multiplyScalar(PLANET_RADIUS + getTerrainHeight(norm.clone().normalize())));

      orientToSphere(taxiGroup, waypoints[0]);
      this.group.add(taxiGroup);

      this.vehicles.push({
        group: taxiGroup,
        type: 'taxi',
        waypoints,
        currentWaypointIndex: 0,
        speed: 14.0,
        position: waypoints[0].clone(),
        wheels
      });
    }
  }

  /**
   * 2 Fellow Auto-Rickshaws
   */
  private createFellowAutos() {
    for (let a = 0; a < 2; a++) {
      const autoGroup = new THREE.Group();
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 2.2), blackMat);
      chassis.position.y = 0.55;
      autoGroup.add(chassis);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.85, 1.8), yellowMat);
      canopy.position.set(0, 1.35, 0.15);
      autoGroup.add(canopy);

      const wheels: THREE.Mesh[] = [];
      const wGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 12);
      wGeom.rotateZ(Math.PI / 2);

      const fWheel = new THREE.Mesh(wGeom, rubberMat);
      fWheel.position.set(0, 0.32, -1.0);
      autoGroup.add(fWheel);
      wheels.push(fWheel);

      for (let side of [-0.75, 0.75]) {
        const rWheel = new THREE.Mesh(wGeom, rubberMat);
        rWheel.position.set(side, 0.32, 0.7);
        autoGroup.add(rWheel);
        wheels.push(rWheel);
      }

      const waypoints = [
        latLonToVector3(26 + a * 6, -10, 1),
        latLonToVector3(32 + a * 6, 2, 1),
        latLonToVector3(28 + a * 6, 12, 1),
        latLonToVector3(22 + a * 6, -2, 1)
      ].map((norm) => norm.clone().normalize().multiplyScalar(PLANET_RADIUS + getTerrainHeight(norm.clone().normalize())));

      orientToSphere(autoGroup, waypoints[0]);
      this.group.add(autoGroup);

      this.vehicles.push({
        group: autoGroup,
        type: 'auto',
        waypoints,
        currentWaypointIndex: 0,
        speed: 15.0,
        position: waypoints[0].clone(),
        wheels
      });
    }
  }

  /**
   * Update AI Traffic Movement on the Sphere
   */
  public update(delta: number) {
    for (const v of this.vehicles) {
      const targetWp = v.waypoints[v.currentWaypointIndex];
      const dir = targetWp.clone().sub(v.position);
      const dist = dir.length();

      if (dist < 1.8) {
        v.currentWaypointIndex = (v.currentWaypointIndex + 1) % v.waypoints.length;
      } else {
        dir.normalize();
        v.position.addScaledVector(dir, v.speed * delta);

        // Snap precisely to spherical terrain surface
        const norm = v.position.clone().normalize();
        const h = getTerrainHeight(norm);
        v.position.copy(norm).multiplyScalar(PLANET_RADIUS + h);

        orientToSphere(v.group, v.position, dir);

        // Rotate wheels
        v.wheels.forEach((w) => {
          w.rotation.x += v.speed * delta * 4.0;
        });
      }
    }
  }
}
