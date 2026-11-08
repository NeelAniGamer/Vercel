import * as THREE from 'three';
import { PLANET_RADIUS, getTerrainHeight, slerpVectors } from './math';
import { soundManager } from './Audio';

export interface CourierControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
}

export class Courier {
  public group: THREE.Group = new THREE.Group();
  public position: THREE.Vector3 = new THREE.Vector3(0, PLANET_RADIUS + 2, 0);
  public normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  public forward: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  public velocity: THREE.Vector3 = new THREE.Vector3(); // tangential
  public radialVelocity: number = 0; // jump / gravity along normal

  public isGrounded: boolean = true;
  public isCarryingPackage: boolean = false;
  public isRidingBike: boolean = false;
  public speed: number = 0;

  // Character Mesh Components for procedural animation
  private bodyMesh!: THREE.Group;
  private headMesh!: THREE.Group;
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private satchelBag!: THREE.Mesh;
  private parcelMesh!: THREE.Group;
  private bicycleGroup!: THREE.Group;
  private frontWheel!: THREE.Mesh;
  private rearWheel!: THREE.Mesh;

  // Particles
  private dustParticles!: THREE.Points;
  private dustGeo!: THREE.BufferGeometry;
  private dustCount = 40;
  private dustLifetimes: Float32Array = new Float32Array(40);
  private dustVels: THREE.Vector3[] = [];

  // Footstep sound timers
  private footstepTimer = 0;
  private animTimer = 0;

  constructor(initialLat = 0, initialLon = 0) {
    this.createCourierMesh();
    this.createBicycleMesh();
    this.createParcelMesh();
    this.createDustParticles();
    this.setInitialPosition(initialLat, initialLon);
  }

  private setInitialPosition(lat: number, lon: number) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(PLANET_RADIUS * Math.sin(phi) * Math.cos(theta));
    const z = PLANET_RADIUS * Math.sin(phi) * Math.sin(theta);
    const y = PLANET_RADIUS * Math.cos(phi);

    this.normal.set(x, y, z).normalize();
    const h = getTerrainHeight(this.normal);
    this.position.copy(this.normal).multiplyScalar(PLANET_RADIUS + h);

    // Initial forward tangent
    this.forward.set(0, 0, 1).cross(this.normal);
    if (this.forward.lengthSq() < 0.001) this.forward.set(1, 0, 0).cross(this.normal);
    this.forward.normalize();

    this.updateMeshTransform();
  }

  /**
   * Stylized Low-Poly Courier Character Model
   */
  private createCourierMesh() {
    this.bodyMesh = new THREE.Group();

    // Torso / Navy Messenger Coat
    const coatGeom = new THREE.CylinderGeometry(0.38, 0.44, 0.9, 10);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }); // Navy blue
    const torso = new THREE.Mesh(coatGeom, coatMat);
    torso.position.y = 0.9;
    torso.castShadow = true;
    this.bodyMesh.add(torso);

    // Warm Yellow Scarf / Collar
    const scarfGeom = new THREE.TorusGeometry(0.34, 0.12, 8, 16);
    scarfGeom.rotateX(Math.PI / 2);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const scarf = new THREE.Mesh(scarfGeom, scarfMat);
    scarf.position.y = 1.38;
    this.bodyMesh.add(scarf);

    // Head
    this.headMesh = new THREE.Group();
    this.headMesh.position.y = 1.65;

    const headGeom = new THREE.SphereGeometry(0.32, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });
    const head = new THREE.Mesh(headGeom, skinMat);
    this.headMesh.add(head);

    // Courier Cap with Visor & Golden Wing Wings
    const capBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
    );
    capBase.position.y = 0.22;
    this.headMesh.add(capBase);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.05, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    visor.position.set(0, 0.16, -0.32);
    visor.rotation.x = 0.15;
    this.headMesh.add(visor);

    // Golden Wing Badge
    const badge = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 })
    );
    badge.position.set(0, 0.25, -0.36);
    badge.rotation.x = Math.PI / 2;
    this.headMesh.add(badge);

    this.bodyMesh.add(this.headMesh);

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.11, 0.1, 0.65, 8);
    armGeom.translate(0, -0.3, 0);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });

    this.leftArm = new THREE.Mesh(armGeom, armMat);
    this.leftArm.position.set(-0.46, 1.25, 0);
    this.bodyMesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, armMat);
    this.rightArm.position.set(0.46, 1.25, 0);
    this.bodyMesh.add(this.rightArm);

    // Legs & Boots
    const legGeom = new THREE.CylinderGeometry(0.12, 0.11, 0.7, 8);
    legGeom.translate(0, -0.35, 0);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

    this.leftLeg = new THREE.Mesh(legGeom, pantsMat);
    this.leftLeg.position.set(-0.2, 0.65, 0);
    this.leftLeg.castShadow = true;
    this.bodyMesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom, pantsMat);
    this.rightLeg.position.set(0.2, 0.65, 0);
    this.rightLeg.castShadow = true;
    this.bodyMesh.add(this.rightLeg);

    // Leather Courier Satchel Bag across shoulder
    this.satchelBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 })
    );
    this.satchelBag.position.set(0.38, 0.85, 0.18);
    this.satchelBag.rotation.z = -0.15;
    this.bodyMesh.add(this.satchelBag);

    this.group.add(this.bodyMesh);
  }

  /**
   * Stylized Courier Bicycle
   */
  private createBicycleMesh() {
    this.bicycleGroup = new THREE.Group();
    this.bicycleGroup.visible = false;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.4 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

    // Wheels
    const wheelGeom = new THREE.TorusGeometry(0.42, 0.08, 8, 20);
    this.frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
    this.frontWheel.position.set(0, 0.42, -0.9);
    this.bicycleGroup.add(this.frontWheel);

    this.rearWheel = new THREE.Mesh(wheelGeom, wheelMat);
    this.rearWheel.position.set(0, 0.42, 0.8);
    this.bicycleGroup.add(this.rearWheel);

    // Diamond Frame
    const barGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.3);
    const topBar = new THREE.Mesh(barGeom, frameMat);
    topBar.position.set(0, 0.78, 0);
    topBar.rotation.x = Math.PI / 2;
    this.bicycleGroup.add(topBar);

    // Handlebars & Front Basket
    const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), frameMat);
    handlebar.position.set(0, 1.15, -0.85);
    this.bicycleGroup.add(handlebar);

    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 })
    );
    basket.position.set(0, 0.95, -1.05);
    this.bicycleGroup.add(basket);

    this.group.add(this.bicycleGroup);
  }

  /**
   * 3D Delivery Parcel held in hands
   */
  private createParcelMesh() {
    this.parcelMesh = new THREE.Group();
    this.parcelMesh.position.set(0, 0.95, -0.5);
    this.parcelMesh.visible = false;

    // Cardboard box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), boxMat);
    this.parcelMesh.add(box);

    // Red Postal Stamp on Parcel
    const stamp = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    stamp.position.set(0.12, 0.201, 0.05);
    stamp.rotation.x = -Math.PI / 2;
    this.parcelMesh.add(stamp);

    // Twine String
    const twine = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.04, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
    );
    twine.position.y = 0.2;
    this.parcelMesh.add(twine);

    this.bodyMesh.add(this.parcelMesh);
  }

  /**
   * Footstep Dust Particle Emitter
   */
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

    const dustMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(this.dustGeo, dustMat);
    this.group.add(this.dustParticles);
  }

  private emitDust(worldPos: THREE.Vector3) {
    const posAttr = this.dustGeo.attributes.position;
    for (let i = 0; i < this.dustCount; i++) {
      if (this.dustLifetimes[i] >= 1.0) {
        this.dustLifetimes[i] = 0.0;
        // Convert to local coords relative to player
        const local = worldPos.clone().sub(this.position);
        posAttr.setXYZ(i, local.x, local.y + 0.1, local.z);
        this.dustVels[i].set(
          (Math.random() - 0.5) * 1.5,
          Math.random() * 1.0,
          (Math.random() - 0.5) * 1.5
        );
        posAttr.needsUpdate = true;
        break;
      }
    }
  }

  public setCarrying(carrying: boolean) {
    this.isCarryingPackage = carrying;
    if (this.parcelMesh) {
      this.parcelMesh.visible = carrying;
    }
  }

  public toggleBicycle(): boolean {
    this.isRidingBike = !this.isRidingBike;
    this.bicycleGroup.visible = this.isRidingBike;
    if (this.isRidingBike) {
      this.bodyMesh.position.y = 0.45; // elevated on bike
      soundManager.playBell();
    } else {
      this.bodyMesh.position.y = 0;
    }
    return this.isRidingBike;
  }

  /**
   * Main Physics & Kinematics Update
   */
  public update(delta: number, controls: CourierControls, camForward: THREE.Vector3) {
    this.normal.copy(this.position).normalize();

    // Calculate camera tangent basis on spherical surface
    const camFwdTangent = camForward.clone().sub(this.normal.clone().multiplyScalar(camForward.dot(this.normal))).normalize();
    const camRightTangent = new THREE.Vector3().crossVectors(this.normal, camFwdTangent).normalize();

    // Input direction vector along sphere surface
    const moveDir = new THREE.Vector3();
    if (controls.forward) moveDir.add(camFwdTangent);
    if (controls.backward) moveDir.sub(camFwdTangent);
    if (controls.right) moveDir.add(camRightTangent);
    if (controls.left) moveDir.sub(camRightTangent);

    const hasInput = moveDir.lengthSq() > 0.001;
    if (hasInput) moveDir.normalize();

    // Speed calculation
    const maxSpeed = this.isRidingBike ? 24.0 : controls.sprint ? 18.0 : 12.0;
    const accel = this.isRidingBike ? 35.0 : 45.0;
    const friction = 12.0;

    if (hasInput) {
      this.velocity.lerp(moveDir.clone().multiplyScalar(maxSpeed), delta * accel * 0.15);
      // Smoothly rotate forward heading to moveDir
      slerpVectors(this.forward, moveDir, delta * 12.0, this.forward);
    } else {
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), delta * friction);
    }

    this.speed = this.velocity.length();

    // Apply tangential displacement across the sphere surface
    if (this.speed > 0.01) {
      const travelDist = this.speed * delta;
      const angle = travelDist / PLANET_RADIUS;
      const moveAxis = new THREE.Vector3().crossVectors(this.normal, this.velocity).normalize();

      // Rotate position along great circle
      const rotQuat = new THREE.Quaternion().setFromAxisAngle(moveAxis, angle);
      this.position.applyQuaternion(rotQuat);
      this.forward.applyQuaternion(rotQuat);
      this.normal.copy(this.position).normalize();
    }

    // Radial Gravity & Jump
    const gravity = 32.0;
    const terrainHeight = getTerrainHeight(this.normal);
    const groundRadius = PLANET_RADIUS + terrainHeight;
    const currentRadius = this.position.length();

    if (!this.isGrounded) {
      this.radialVelocity -= gravity * delta;
    }

    // Update radial position
    const nextRadius = currentRadius + this.radialVelocity * delta;

    if (nextRadius <= groundRadius) {
      // Landed
      this.position.copy(this.normal).multiplyScalar(groundRadius);
      this.radialVelocity = 0;
      this.isGrounded = true;
    } else {
      this.position.copy(this.normal).multiplyScalar(nextRadius);
      this.isGrounded = false;
    }

    // Jump Input
    if (controls.jump && this.isGrounded) {
      this.radialVelocity = this.isRidingBike ? 12.0 : 15.0;
      this.isGrounded = false;
      soundManager.playJump();
    }

    // Footstep Sound & Dust Particles
    if (this.isGrounded && this.speed > 1.5) {
      this.footstepTimer += delta * (this.speed * 0.5);
      if (this.footstepTimer > 1.0) {
        this.footstepTimer = 0;
        const terrainMat = terrainHeight < 0.3 ? 'sand' : terrainHeight > 4.5 ? 'stone' : 'grass';
        if (!this.isRidingBike) soundManager.playFootstep(terrainMat);
        this.emitDust(this.position);
      }
    }

    // Procedural Character Animation
    this.updateProceduralAnimation(delta);

    // Update Dust Particles
    this.updateDustParticles(delta);

    // Final orientation to sphere
    this.updateMeshTransform();
  }

  private updateProceduralAnimation(delta: number) {
    this.animTimer += delta * (this.speed * 1.2);

    if (this.isRidingBike) {
      // Bicycle pedaling & wheel spin
      if (this.frontWheel && this.rearWheel) {
        this.frontWheel.rotation.x += this.speed * delta * 4.0;
        this.rearWheel.rotation.x += this.speed * delta * 4.0;
      }
      this.leftLeg.rotation.x = Math.sin(this.animTimer) * 0.6;
      this.rightLeg.rotation.x = -Math.sin(this.animTimer) * 0.6;
      this.leftArm.rotation.x = -0.6;
      this.rightArm.rotation.x = -0.6;
      this.bodyMesh.rotation.z = Math.sin(this.animTimer * 0.5) * 0.05;
      return;
    }

    if (!this.isGrounded) {
      // In-air jump pose
      this.leftLeg.rotation.x = -0.4;
      this.rightLeg.rotation.x = 0.5;
      this.leftArm.rotation.x = 0.8;
      this.rightArm.rotation.x = 0.8;
      return;
    }

    if (this.speed > 0.8) {
      // Run Cycle
      const runCycle = Math.sin(this.animTimer);
      this.leftLeg.rotation.x = runCycle * 0.85;
      this.rightLeg.rotation.x = -runCycle * 0.85;

      if (this.isCarryingPackage) {
        // Holding package with both arms in front
        this.leftArm.rotation.x = -0.8 + Math.sin(this.animTimer * 2) * 0.08;
        this.rightArm.rotation.x = -0.8 - Math.sin(this.animTimer * 2) * 0.08;
      } else {
        // Natural arm swing
        this.leftArm.rotation.x = -runCycle * 0.75;
        this.rightArm.rotation.x = runCycle * 0.75;
      }

      // Satchel bag bobbing
      this.satchelBag.position.y = 0.85 + Math.abs(runCycle) * 0.08;
      this.satchelBag.rotation.x = runCycle * 0.2;

      // Slight body bounce & tilt
      this.bodyMesh.position.y = Math.abs(Math.sin(this.animTimer)) * 0.12;
      this.headMesh.rotation.y = Math.sin(this.animTimer * 0.5) * 0.08;
    } else {
      // Idle breathing
      const breath = Math.sin(performance.now() * 0.003) * 0.03;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;

      if (this.isCarryingPackage) {
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
      } else {
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
      }

      this.bodyMesh.position.y = breath;
      this.headMesh.position.y = 1.65 + breath * 0.5;
    }
  }

  private updateDustParticles(delta: number) {
    const posAttr = this.dustGeo.attributes.position;
    let needsUpdate = false;

    for (let i = 0; i < this.dustCount; i++) {
      if (this.dustLifetimes[i] < 1.0) {
        this.dustLifetimes[i] += delta * 2.5;
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

  /**
   * Orient Character precisely to Sphere Normal & Forward Tangent
   */
  public updateMeshTransform() {
    this.group.position.copy(this.position);

    const normal = this.normal.clone().normalize();
    // Project forward onto normal tangent plane
    const forward = this.forward.clone().sub(normal.clone().multiplyScalar(this.forward.dot(normal))).normalize();
    const right = new THREE.Vector3().crossVectors(normal, forward).normalize();

    // Basis matrix: X = Right, Y = Normal (Up), Z = Backward (-Forward)
    const rotMatrix = new THREE.Matrix4().makeBasis(right, normal, forward.clone().negate());
    this.group.quaternion.setFromRotationMatrix(rotMatrix);
  }
}
