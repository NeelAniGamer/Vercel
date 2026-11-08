import * as THREE from 'three';
import { PLANET_RADIUS, getTerrainHeight, slerpVectors } from './math';
import { soundManager } from './Audio';

export type VehicleMode = 'bicycle' | 'auto' | 'foot';

export interface VehicleControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  horn: boolean;
}

export class MumbaiHeroVehicle {
  public group: THREE.Group = new THREE.Group();
  public position: THREE.Vector3 = new THREE.Vector3(0, PLANET_RADIUS + 2, 0);
  public normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  public forward: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public radialVelocity: number = 0;

  public currentMode: VehicleMode = 'bicycle';
  public isGrounded: boolean = true;
  public speed: number = 0;
  public steeringAngle: number = 0;

  // Vehicle Sub-Groups
  private bicycleGroup!: THREE.Group;
  private autoGroup!: THREE.Group;
  private footCourierGroup!: THREE.Group;

  // Bicycle Parts
  private bikeFrontWheel!: THREE.Mesh;
  private bikeRearWheel!: THREE.Mesh;
  private bikePedals!: THREE.Mesh;
  private dabbaStackGroup!: THREE.Group;

  // Auto-Rickshaw Parts
  private autoFrontWheel!: THREE.Mesh;
  private autoRearLeftWheel!: THREE.Mesh;
  private autoRearRightWheel!: THREE.Mesh;
  private autoSteeringFork!: THREE.Group;
  private autoHeadlights: THREE.SpotLight[] = [];

  // Foot Courier Limbs & Animations
  private courierLegLeft!: THREE.Mesh;
  private courierLegRight!: THREE.Mesh;
  private courierArmLeft!: THREE.Mesh;
  private courierArmRight!: THREE.Mesh;
  private courierHead!: THREE.Group;
  private courierBody!: THREE.Mesh;

  // Dust Particles
  private dustGeo!: THREE.BufferGeometry;
  private dustPoints!: THREE.Points;
  private dustCount = 45;
  private dustLifetimes: Float32Array = new Float32Array(45);
  private dustVels: THREE.Vector3[] = [];

  private animTimer = 0;
  private hornCooldown = 0;

  constructor(initialLat = 0, initialLon = 0) {
    this.createFootCourierMesh();
    this.createDabbawalaBicycleMesh();
    this.createAutoRickshawMesh();
    this.createDustParticles();
    this.setInitialCoordinates(initialLat, initialLon);
    this.setMode('bicycle');
  }

  private setInitialCoordinates(lat: number, lon: number) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(PLANET_RADIUS * Math.sin(phi) * Math.cos(theta));
    const z = PLANET_RADIUS * Math.sin(phi) * Math.sin(theta);
    const y = PLANET_RADIUS * Math.cos(phi);

    this.normal.set(x, y, z).normalize();
    const h = getTerrainHeight(this.normal);
    this.position.copy(this.normal).multiplyScalar(PLANET_RADIUS + h);

    this.forward.set(0, 0, 1).cross(this.normal);
    if (this.forward.lengthSq() < 0.001) this.forward.set(1, 0, 0).cross(this.normal);
    this.forward.normalize();

    this.updateMeshTransform();
  }

  /**
   * Mode 1: Authentic Mumbai Dabbawala Delivery Bicycle
   */
  private createDabbawalaBicycleMesh() {
    this.bicycleGroup = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

    // Wheels
    const wheelGeom = new THREE.TorusGeometry(0.48, 0.07, 8, 22);
    this.bikeFrontWheel = new THREE.Mesh(wheelGeom, rubberMat);
    this.bikeFrontWheel.position.set(0, 0.48, -1.05);
    this.bikeFrontWheel.castShadow = true;
    this.bicycleGroup.add(this.bikeFrontWheel);

    this.bikeRearWheel = new THREE.Mesh(wheelGeom, rubberMat);
    this.bikeRearWheel.position.set(0, 0.48, 0.95);
    this.bikeRearWheel.castShadow = true;
    this.bicycleGroup.add(this.bikeRearWheel);

    // Classic Diamond Frame Bars
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4), frameMat);
    bar.position.set(0, 0.88, 0);
    bar.rotation.x = Math.PI / 2;
    this.bicycleGroup.add(bar);

    const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85), frameMat);
    seatTube.position.set(0, 0.78, 0.35);
    seatTube.rotation.x = -0.3;
    this.bicycleGroup.add(seatTube);

    // Leather Saddle
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.35), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    saddle.position.set(0, 1.15, 0.45);
    this.bicycleGroup.add(saddle);

    // Handlebars with Ringing Bell
    const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.05), chromeMat);
    handlebar.position.set(0, 1.25, -0.98);
    this.bicycleGroup.add(handlebar);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), chromeMat);
    bell.position.set(0.25, 1.32, -0.98);
    this.bicycleGroup.add(bell);

    // Pedals
    this.bikePedals = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.08), chromeMat);
    this.bikePedals.position.set(0, 0.48, 0);
    this.bicycleGroup.add(this.bikePedals);

    // Iconic Wooden Rear Carrier with Stacked Aluminum Dabbas (Tiffins)
    const carrier = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.9), new THREE.MeshStandardMaterial({ color: 0x854d0e }));
    carrier.position.set(0, 1.05, 1.0);
    this.bicycleGroup.add(carrier);

    this.dabbaStackGroup = new THREE.Group();
    this.dabbaStackGroup.position.set(0, 1.15, 1.0);

    const tiffinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const markColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b]; // Mumbai sorting code colors

    for (let d = 0; d < 6; d++) {
      const dabba = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 10), tiffinMat);
      const row = Math.floor(d / 2);
      const col = d % 2;
      dabba.position.set(-0.14 + col * 0.28, 0.21, -0.28 + row * 0.28);

      // Colored identification tag ribbon
      const tag = new THREE.Mesh(
        new THREE.RingGeometry(0.141, 0.143, 10),
        new THREE.MeshBasicMaterial({ color: markColors[d % markColors.length], side: THREE.DoubleSide })
      );
      tag.position.y = 0.1;
      tag.rotation.x = Math.PI / 2;
      dabba.add(tag);

      this.dabbaStackGroup.add(dabba);
    }
    this.bicycleGroup.add(this.dabbaStackGroup);

    // Rider in White Gandhi Topi sitting on bike
    const rider = this.createRiderMesh();
    rider.position.set(0, 0.85, 0.15);
    this.bicycleGroup.add(rider);

    this.group.add(this.bicycleGroup);
  }

  /**
   * Mode 2: Iconic Kaali-Peeli Auto-Rickshaw (3-Wheeler)
   */
  private createAutoRickshawMesh() {
    this.autoGroup = new THREE.Group();
    this.autoGroup.visible = false;

    const yellowCanopyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 }); // Yellow hood
    const blackBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });    // Black lower chassis
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85 });

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.5), blackBodyMat);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    this.autoGroup.add(chassis);

    // Yellow Canopy Top
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.95, 2.0), yellowCanopyMat);
    canopy.position.set(0, 1.45, 0.2);
    canopy.castShadow = true;
    this.autoGroup.add(canopy);

    // Windshield & Sloped Front Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.9, 4), blackBodyMat);
    nose.position.set(0, 0.75, -1.35);
    nose.rotation.y = Math.PI / 4;
    this.autoGroup.add(nose);

    // Front Turning Steering Fork & Single Front Wheel
    this.autoSteeringFork = new THREE.Group();
    this.autoSteeringFork.position.set(0, 0.38, -1.25);

    const forkStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.75), chromeMat);
    forkStem.position.y = 0.35;
    this.autoSteeringFork.add(forkStem);

    const fWheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.16, 16);
    fWheelGeom.rotateZ(Math.PI / 2);
    this.autoFrontWheel = new THREE.Mesh(fWheelGeom, rubberMat);
    this.autoSteeringFork.add(this.autoFrontWheel);

    // Round Chrome Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), chromeMat);
    headlight.position.set(0, 0.65, -0.2);
    this.autoSteeringFork.add(headlight);

    // Spotlight beam for headlight
    const light = new THREE.SpotLight(0xfef08a, 1.8, 25, Math.PI / 6, 0.4);
    light.position.set(0, 0.65, -0.3);
    light.target.position.set(0, 0, -10.0);
    this.autoSteeringFork.add(light);
    this.autoSteeringFork.add(light.target);
    this.autoHeadlights.push(light);

    this.autoGroup.add(this.autoSteeringFork);

    // Two Rear Wheels
    const rWheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.18, 16);
    rWheelGeom.rotateZ(Math.PI / 2);

    this.autoRearLeftWheel = new THREE.Mesh(rWheelGeom, rubberMat);
    this.autoRearLeftWheel.position.set(-0.85, 0.38, 0.75);
    this.autoGroup.add(this.autoRearLeftWheel);

    this.autoRearRightWheel = new THREE.Mesh(rWheelGeom, rubberMat);
    this.autoRearRightWheel.position.set(0.85, 0.38, 0.75);
    this.autoGroup.add(this.autoRearRightWheel);

    // "Horn OK Please" Rear Bumper Sign
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.22, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xd97706 }) // Amber warning banner
    );
    bumper.position.set(0, 0.6, 1.28);
    this.autoGroup.add(bumper);

    // Auto Driver sitting inside
    const driver = this.createRiderMesh(0x0f766e); // Green uniform shirt
    driver.position.set(0, 0.6, -0.3);
    this.autoGroup.add(driver);

    this.group.add(this.autoGroup);
  }

  /**
   * Mode 3: On-Foot Dabbawala Courier Hero
   */
  private createFootCourierMesh() {
    this.footCourierGroup = new THREE.Group();
    this.footCourierGroup.visible = false;

    // White Cotton Kurta Body
    const kurtaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    this.courierBody = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.95, 10), kurtaMat);
    this.courierBody.position.y = 0.95;
    this.courierBody.castShadow = true;
    this.footCourierGroup.add(this.courierBody);

    // Head with Iconic White Gandhi Topi (Cap)
    this.courierHead = new THREE.Group();
    this.courierHead.position.y = 1.7;

    const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });
    const head = new THREE.Mesh(headGeom, skinMat);
    this.courierHead.add(head);

    // Boat-shaped White Gandhi Topi
    const topi = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.24, 4),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    topi.position.y = 0.26;
    topi.scale.set(1.4, 1.0, 0.8);
    this.courierHead.add(topi);

    this.footCourierGroup.add(this.courierHead);

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8);
    armGeom.translate(0, -0.3, 0);

    this.courierArmLeft = new THREE.Mesh(armGeom, kurtaMat);
    this.courierArmLeft.position.set(-0.45, 1.3, 0);
    this.footCourierGroup.add(this.courierArmLeft);

    this.courierArmRight = new THREE.Mesh(armGeom, kurtaMat);
    this.courierArmRight.position.set(0.45, 1.3, 0);
    this.footCourierGroup.add(this.courierArmRight);

    // Legs
    const legGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.72, 8);
    legGeom.translate(0, -0.36, 0);
    const pyjamaMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9 });

    this.courierLegLeft = new THREE.Mesh(legGeom, pyjamaMat);
    this.courierLegLeft.position.set(-0.18, 0.72, 0);
    this.footCourierGroup.add(this.courierLegLeft);

    this.courierLegRight = new THREE.Mesh(legGeom, pyjamaMat);
    this.courierLegRight.position.set(0.18, 0.72, 0);
    this.footCourierGroup.add(this.courierLegRight);

    // Shoulder Satchel Bag
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.45, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    bag.position.set(0.38, 0.85, 0.18);
    bag.rotation.z = -0.15;
    this.footCourierGroup.add(bag);

    this.group.add(this.footCourierGroup);
  }

  private createRiderMesh(shirtColor = 0xffffff): THREE.Group {
    const rider = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.7, 8), shirtMat);
    torso.position.y = 0.55;
    rider.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
    head.position.y = 1.1;
    rider.add(head);

    // Gandhi Topi
    const topi = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.22, 4),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    topi.position.y = 1.32;
    topi.scale.set(1.4, 1.0, 0.75);
    rider.add(topi);

    return rider;
  }

  private createDustParticles() {
    this.dustGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.dustCount * 3);

    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      this.dustLifetimes[i] = 1.0;
      this.dustVels.push(new THREE.Vector3());
    }

    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.4,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    this.dustPoints = new THREE.Points(this.dustGeo, mat);
    this.group.add(this.dustPoints);
  }

  private emitDust() {
    const posAttr = this.dustGeo.attributes.position;
    for (let i = 0; i < this.dustCount; i++) {
      if (this.dustLifetimes[i] >= 1.0) {
        this.dustLifetimes[i] = 0.0;
        posAttr.setXYZ(i, (Math.random() - 0.5) * 0.4, 0.1, 0.8 + Math.random() * 0.4);
        this.dustVels[i].set((Math.random() - 0.5) * 1.5, Math.random() * 1.0, 1.5 + Math.random() * 1.5);
        posAttr.needsUpdate = true;
        break;
      }
    }
  }

  public setMode(mode: VehicleMode) {
    this.currentMode = mode;
    this.bicycleGroup.visible = mode === 'bicycle';
    this.autoGroup.visible = mode === 'auto';
    this.footCourierGroup.visible = mode === 'foot';

    if (mode === 'bicycle') soundManager.playBicycleBell();
    if (mode === 'auto') soundManager.playAutoHorn();
  }

  public triggerHorn() {
    if (this.currentMode === 'auto') {
      soundManager.playAutoHorn();
    } else if (this.currentMode === 'bicycle') {
      soundManager.playBicycleBell();
    } else {
      soundManager.playEmotePop();
    }
  }

  /**
   * Physics & Movement on the Sphere
   */
  public update(delta: number, controls: VehicleControls, camForward: THREE.Vector3) {
    this.normal.copy(this.position).normalize();

    // Tangent plane projection of camera forward
    const camFwdTangent = camForward.clone().sub(this.normal.clone().multiplyScalar(camForward.dot(this.normal))).normalize();
    const camRightTangent = new THREE.Vector3().crossVectors(this.normal, camFwdTangent).normalize();

    const moveDir = new THREE.Vector3();
    if (controls.forward) moveDir.add(camFwdTangent);
    if (controls.backward) moveDir.sub(camFwdTangent);
    if (controls.right) moveDir.add(camRightTangent);
    if (controls.left) moveDir.sub(camRightTangent);

    const hasInput = moveDir.lengthSq() > 0.001;
    if (hasInput) moveDir.normalize();

    // Top speeds by mode: Auto (28 m/s), Bicycle (19 m/s), Foot (12 m/s)
    const maxSpeed = this.currentMode === 'auto' ? 28.0 : this.currentMode === 'bicycle' ? 19.0 : controls.sprint ? 16.0 : 11.0;
    const accel = this.currentMode === 'auto' ? 42.0 : 48.0;
    const friction = 14.0;

    if (hasInput) {
      this.velocity.lerp(moveDir.clone().multiplyScalar(maxSpeed), delta * accel * 0.15);
      slerpVectors(this.forward, moveDir, delta * 12.0, this.forward);
    } else {
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), delta * friction);
    }

    this.speed = this.velocity.length();

    // Move across the sphere
    if (this.speed > 0.01) {
      const travelDist = this.speed * delta;
      const angle = travelDist / PLANET_RADIUS;
      const moveAxis = new THREE.Vector3().crossVectors(this.normal, this.velocity).normalize();

      const rotQuat = new THREE.Quaternion().setFromAxisAngle(moveAxis, angle);
      this.position.applyQuaternion(rotQuat);
      this.forward.applyQuaternion(rotQuat);
      this.normal.copy(this.position).normalize();
    }

    // Radial Gravity
    const gravity = 32.0;
    const terrainHeight = getTerrainHeight(this.normal);
    const groundRadius = PLANET_RADIUS + terrainHeight;
    const currentRadius = this.position.length();

    if (!this.isGrounded) {
      this.radialVelocity -= gravity * delta;
    }

    const nextRadius = currentRadius + this.radialVelocity * delta;

    if (nextRadius <= groundRadius) {
      this.position.copy(this.normal).multiplyScalar(groundRadius);
      this.radialVelocity = 0;
      this.isGrounded = true;
    } else {
      this.position.copy(this.normal).multiplyScalar(nextRadius);
      this.isGrounded = false;
    }

    // Jump
    if (controls.jump && this.isGrounded) {
      this.radialVelocity = this.currentMode === 'foot' ? 14.5 : 10.5;
      this.isGrounded = false;
      soundManager.playJump();
    }

    // Horn input
    if (controls.horn && this.hornCooldown <= 0) {
      this.triggerHorn();
      this.hornCooldown = 0.6;
    }
    if (this.hornCooldown > 0) this.hornCooldown -= delta;

    // Dust particles when speeding
    if (this.isGrounded && this.speed > 2.0) {
      this.emitDust();
    }

    // Update animations
    this.updateAnimations(delta);
    this.updateDust(delta);
    this.updateMeshTransform();
  }

  private updateAnimations(delta: number) {
    this.animTimer += delta * (this.speed * 1.5);

    if (this.currentMode === 'bicycle') {
      if (this.bikeFrontWheel && this.bikeRearWheel) {
        this.bikeFrontWheel.rotation.x += this.speed * delta * 4.0;
        this.bikeRearWheel.rotation.x += this.speed * delta * 4.0;
      }
      if (this.dabbaStackGroup) {
        // Tiffins clink and wobble gently with road vibration
        this.dabbaStackGroup.rotation.z = Math.sin(this.animTimer * 2) * 0.04;
      }
    } else if (this.currentMode === 'auto') {
      if (this.autoFrontWheel) this.autoFrontWheel.rotation.x += this.speed * delta * 4.5;
      if (this.autoRearLeftWheel) this.autoRearLeftWheel.rotation.x += this.speed * delta * 4.5;
      if (this.autoRearRightWheel) this.autoRearRightWheel.rotation.x += this.speed * delta * 4.5;
      // Slight rickshaw body tilt on steering
      this.autoGroup.rotation.z = THREE.MathUtils.lerp(this.autoGroup.rotation.z, -this.steeringAngle * 0.1, delta * 6.0);
    } else if (this.currentMode === 'foot') {
      if (this.speed > 0.8) {
        const run = Math.sin(this.animTimer);
        this.courierLegLeft.rotation.x = run * 0.85;
        this.courierLegRight.rotation.x = -run * 0.85;
        this.courierArmLeft.rotation.x = -run * 0.75;
        this.courierArmRight.rotation.x = run * 0.75;
        this.courierBody.position.y = 0.95 + Math.abs(run) * 0.1;
      } else {
        this.courierLegLeft.rotation.x = 0;
        this.courierLegRight.rotation.x = 0;
        this.courierArmLeft.rotation.x = 0;
        this.courierArmRight.rotation.x = 0;
        this.courierBody.position.y = 0.95;
      }
    }
  }

  private updateDust(delta: number) {
    const posAttr = this.dustGeo.attributes.position;
    let needsUpdate = false;

    for (let i = 0; i < this.dustCount; i++) {
      if (this.dustLifetimes[i] < 1.0) {
        this.dustLifetimes[i] += delta * 2.2;
        const vel = this.dustVels[i];
        let px = posAttr.getX(i) + vel.x * delta;
        let py = posAttr.getY(i) + vel.y * delta;
        let pz = posAttr.getZ(i) + vel.z * delta;
        posAttr.setXYZ(i, px, py, pz);
        needsUpdate = true;
      }
    }
    if (needsUpdate) posAttr.needsUpdate = true;
  }

  public updateMeshTransform() {
    this.group.position.copy(this.position);

    const normal = this.normal.clone().normalize();
    const forward = this.forward.clone().sub(normal.clone().multiplyScalar(this.forward.dot(normal))).normalize();
    const right = new THREE.Vector3().crossVectors(normal, forward).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(right, normal, forward.clone().negate());
    this.group.quaternion.setFromRotationMatrix(rotMatrix);
  }
}
