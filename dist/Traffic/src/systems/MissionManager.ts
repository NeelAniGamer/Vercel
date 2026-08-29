// @ts-nocheck
/**
 * MissionManager — migrated from mission-manager.js
 * Mission system: CHECKPOINT, COLLECT, TIME_TRIAL, DELIVERY, FOLLOW + special missions
 */

import * as THREE from 'three';

export const MISSION_TYPES: Record<string, any> = {
  CHECKPOINT: { id: 'checkpoint', icon: '🏁', label: 'Checkpoints', description: 'Drive through all checkpoints' },
  COLLECT: { id: 'collect', icon: '⭐', label: 'Collectibles', description: 'Collect all stars' },
  TIME_TRIAL: { id: 'time_trial', icon: '⏱️', label: 'Time Trial', description: 'Reach the destination before time runs out' },
  DELIVERY: { id: 'delivery', icon: '📦', label: 'Delivery', description: 'Pick up and deliver the package' },
  FOLLOW: { id: 'follow', icon: '🗺️', label: 'Follow Route', description: 'Follow the GPS route' },
  ESCORT: { id: 'escort', icon: '🚑', label: 'Escort Duty', description: 'Protect VIP/emergency vehicle through traffic' },
  CHASE: { id: 'chase', icon: '🚓', label: 'Pursuit', description: 'Chase and stop target vehicle' },
  PARKING: { id: 'parking', icon: '🅿️', label: 'Precision Parking', description: 'Park in marked spot without collisions' },
  CARGO: { id: 'cargo', icon: '📦', label: 'Fragile Cargo', description: 'Transport delicate load smoothly' },
  EVASION: { id: 'evasion', icon: '🏃', label: 'Evasion', description: 'Escape pursuers to safe zone' },
  CROSSING_GUARD: { id: 'crossing_guard', icon: '🚸', label: 'Crossing Guard', description: 'Guide pedestrians safely across intersections' },
  SIDEWALK_PATROL: { id: 'sidewalk_patrol', icon: '🚶', label: 'Sidewalk Patrol', description: 'Monitor sidewalk for violations' },
  EMERGENCY_CLEAR: { id: 'emergency_clear', icon: '🚑', label: 'Emergency Clear', description: 'Clear path for emergency vehicle' },
  SCHOOL_PATROL: { id: 'school_patrol', icon: '🏫', label: 'School Zone Patrol', description: 'Enforce school zone speed limits' }
};

export const COLLECTIBLE_TYPES: Record<string, any> = {
  COIN: { value: 100, color: 0xffd700, emissive: 0xffa500, geometry: 'cylinder', scale: 1.0 },
  STAR: { value: 500, color: 0xffeb3b, emissive: 0xffc107, geometry: 'octahedron', scale: 1.5 },
  GEM: { value: 1000, color: 0x00ffff, emissive: 0x00bcd4, geometry: 'octahedron', scale: 1.2 }
};

export class Collectible {
  type: string;
  position: { x: number; z: number };
  collected: boolean = false;
  config: any;
  mesh: THREE.Mesh;
  rotationSpeed: number;
  bobPhase: number;
  bobSpeed: number;
  baseY: number = 2.5;

  constructor(type: string, x: number, z: number, options: any = {}) {
    this.type = type;
    this.position = { x, z };
    this.config = COLLECTIBLE_TYPES[type] || COLLECTIBLE_TYPES.COIN;
    this.mesh = this._createMesh();
    this.mesh.position.set(x, 2.5, z);
    this.mesh.userData.isCollectible = true;
    this.mesh.userData.collectibleRef = this;
    this.rotationSpeed = 1.5 + Math.random();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 2 + Math.random();
  }

  _createMesh(): THREE.Mesh {
    const cfg = this.config;
    let geo: THREE.BufferGeometry;
    switch (cfg.geometry) {
      case 'octahedron':
        geo = new THREE.OctahedronGeometry(1.5 * cfg.scale, 0);
        break;
      case 'cylinder':
      default:
        geo = new THREE.CylinderGeometry(1.2 * cfg.scale, 1.2 * cfg.scale, 0.3 * cfg.scale, 16);
        break;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.emissive,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.4
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.frustumCulled = true;
    return mesh;
  }

  update(dt: number, time: number): void {
    if (this.collected) return;
    this.mesh.rotation.y += this.rotationSpeed * dt;
    this.mesh.position.y = this.baseY + Math.sin(time * this.bobSpeed + this.bobPhase) * 0.5;
  }

  collect(): number {
    if (this.collected) return 0;
    this.collected = true;
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    return this.config.value;
  }

  dispose(): void {
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export class Mission {
  type: string;
  config: any;
  status: string = 'active';
  progress: number = 0;
  target: number;
  data: any;
  reward: number;
  tokenReward: number;
  onComplete: ((m: Mission) => void) | null;
  onFail: ((m: Mission) => void) | null;

  constructor(type: string, config: any = {}) {
    this.type = type;
    this.config = { ...(MISSION_TYPES[type] || {}), ...config };
    this.status = 'active';
    this.progress = 0;
    this.target = config.target || 1;
    this.data = config.data || {};
    this.reward = config.reward || 1000;
    this.tokenReward = config.tokenReward || 0;
    this.onComplete = config.onComplete || null;
    this.onFail = config.onFail || null;
  }

  updateProgress(value: number): void {
    this.progress = Math.min(value, this.target);
    if (this.progress >= this.target) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  incrementProgress(): void {
    this.updateProgress(this.progress + 1);
  }

  fail(): void {
    this.status = 'failed';
    if (this.onFail) this.onFail(this);
  }

  getProgressPercent(): number {
    return (this.progress / this.target) * 100;
  }
}

export class EscortMission extends Mission {
  distanceViolationTime: number = 0;
  maxViolationTime: number = 5;

  constructor(config: any = {}) {
    super('ESCORT', {
      target: config.target || 1,
      reward: config.reward || 5000,
      data: {
        leadVehicle: null, minDistance: 10, maxDistance: 35,
        intersectionsCleared: 0,
        targetIntersections: config.data?.targetIntersections || 3,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, leadVehiclePos: any, dt: number, intersections: any[]): void {
    if (this.status !== 'active') return;
    if (!leadVehiclePos) return;

    const dx = leadVehiclePos.x - playerPos.x;
    const dz = leadVehiclePos.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    this.data.currentDistance = dist;

    if (dist < this.data.minDistance) {
      this.distanceViolationTime += dt;
      if (this.distanceViolationTime > this.maxViolationTime) {
        this.fail();
        if (typeof toast === 'function') toast('❌ Too close to VIP vehicle!', '#ef4444');
      }
    } else if (dist > this.data.maxDistance) {
      this.distanceViolationTime += dt;
      if (this.distanceViolationTime > this.maxViolationTime) {
        this.fail();
        if (typeof toast === 'function') toast('❌ Fell too far behind!', '#ef4444');
      }
    } else {
      this.distanceViolationTime = Math.max(0, this.distanceViolationTime - dt * 2);
    }

    if (intersections && intersections.length > 0) {
      const cleared = intersections.filter(i => i.cleared).length;
      if (cleared > this.data.intersectionsCleared) {
        this.data.intersectionsCleared = cleared;
        this.updateProgress(cleared);
        if (typeof toast === 'function') toast(`🛡️ Intersection cleared (${cleared}/${this.data.targetIntersections})`, '#34d399');
      }
    }

    if (this.data.intersectionsCleared >= this.data.targetIntersections) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  getProgressPercent(): number {
    return (this.data.intersectionsCleared / this.data.targetIntersections) * 100;
  }
}

export class ChaseMission extends Mission {
  constructor(config: any = {}) {
    super('CHASE', {
      target: config.target || 1,
      reward: config.reward || 6000,
      data: {
        targetVehicle: null, catchDistance: 8, pitDistance: 5,
        maxChaseTime: config.data?.maxChaseTime || 120, chaseTime: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, targetPos: any, dt: number): void {
    if (this.status !== 'active') return;
    if (!targetPos) return;

    this.data.chaseTime += dt;
    if (this.data.chaseTime > this.data.maxChaseTime) {
      this.fail();
      if (typeof toast === 'function') toast('⏱️ Target escaped!', '#ef4444');
      return;
    }

    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    this.data.currentDistance = dist;

    if (dist < this.data.catchDistance) {
      this.data.targetVehicle = 'stopped';
      this.status = 'completed';
      if (typeof toast === 'function') toast('🚓 Target apprehended!', '#34d399');
      if (this.onComplete) this.onComplete(this);
    } else if (dist < this.data.pitDistance) {
      if (typeof toast === 'function') toast('⚡ PIT maneuver available!', '#f2b84b');
    }
  }

  getProgressPercent(): number {
    return Math.max(0, 100 - (this.data.currentDistance / 100) * 100);
  }
}

export class ParkingMission extends Mission {
  constructor(config: any = {}) {
    super('PARKING', {
      target: config.target || 1,
      reward: config.reward || 3000,
      data: {
        spot: config.data?.spot || { x: 0, z: 0, rotation: 0, type: 'parallel' },
        maxDeviation: 2.0, maxAngleDeviation: 0.3,
        parked: false, parkStartTime: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, playerRot: number, dt: number, speed: number): void {
    if (this.status !== 'active') return;
    const spot = this.data.spot;
    const dx = playerPos.x - spot.x;
    const dz = playerPos.z - spot.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const angleDiff = Math.abs((playerRot - spot.rotation + Math.PI) % (2 * Math.PI) - Math.PI);

    this.data.currentDistance = dist;
    this.data.currentAngleDiff = angleDiff;

    if (speed < 0.02 && dist < this.data.maxDeviation && angleDiff < this.data.maxAngleDeviation) {
      if (!this.data.parked) {
        this.data.parked = true;
        this.data.parkStartTime = Date.now();
        if (typeof toast === 'function') toast('🅿️ Parked! Hold position...', '#34d399');
      } else if (Date.now() - this.data.parkStartTime > 3000) {
        this.status = 'completed';
        if (typeof toast === 'function') toast('✅ Perfect park!', '#34d399');
        if (this.onComplete) this.onComplete(this);
      }
    } else {
      this.data.parked = false;
    }
  }

  getProgressPercent(): number {
    if (this.data.parked) {
      const elapsed = Date.now() - this.data.parkStartTime;
      return Math.min(100, (elapsed / 3000) * 100);
    }
    const distScore = Math.max(0, 100 - (this.data.currentDistance / this.data.maxDeviation) * 50);
    const angleScore = Math.max(0, 100 - (this.data.currentAngleDiff / this.data.maxAngleDeviation) * 50);
    return (distScore + angleScore) / 2;
  }
}

export class CargoMission extends Mission {
  constructor(config: any = {}) {
    super('CARGO', {
      target: config.target || 100,
      reward: config.reward || 4000,
      data: {
        cargoIntegrity: 100, maxLateralG: 0.8, maxLongitudinalG: 1.0,
        potholeImpacts: 0, maxPotholes: 3,
        distanceTarget: config.data?.distanceTarget || 500, distanceTraveled: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, lateralG: number, longitudinalG: number, dt: number, hitPothole: boolean, lastPos: any): void {
    if (this.status !== 'active') return;

    if (lastPos) {
      const dx = playerPos.x - lastPos.x;
      const dz = playerPos.z - lastPos.z;
      this.data.distanceTraveled += Math.sqrt(dx * dx + dz * dz);
    }

    if (Math.abs(lateralG) > this.data.maxLateralG) {
      const excess = Math.abs(lateralG) - this.data.maxLateralG;
      this.data.cargoIntegrity -= excess * 30 * dt;
    }
    if (Math.abs(longitudinalG) > this.data.maxLongitudinalG) {
      const excess = Math.abs(longitudinalG) - this.data.maxLongitudinalG;
      this.data.cargoIntegrity -= excess * 20 * dt;
    }
    if (hitPothole) {
      this.data.potholeImpacts++;
      this.data.cargoIntegrity -= 15;
      if (typeof toast === 'function') toast(`📦 Cargo damaged! (${this.data.potholeImpacts}/${this.data.maxPotholes})`, '#ef4444');
    }

    this.data.cargoIntegrity = Math.max(0, this.data.cargoIntegrity);
    this.progress = this.data.cargoIntegrity;

    if (this.data.cargoIntegrity <= 0) {
      this.fail();
      if (typeof toast === 'function') toast('💥 Cargo destroyed!', '#ef4444');
    } else if (this.data.distanceTraveled >= this.data.distanceTarget) {
      this.status = 'completed';
      if (typeof toast === 'function') toast(`📦 Cargo delivered! Integrity: ${Math.round(this.data.cargoIntegrity)}%`, '#34d399');
      if (this.onComplete) this.onComplete(this);
    }
  }

  getProgressPercent(): number {
    const distPercent = Math.min(100, (this.data.distanceTraveled / this.data.distanceTarget) * 100);
    return (distPercent + this.data.cargoIntegrity) / 2;
  }
}

export class EvasionMission extends Mission {
  constructor(config: any = {}) {
    super('EVASION', {
      target: config.target || 1,
      reward: config.reward || 5000,
      data: {
        pursuers: [],
        safeZone: config.data?.safeZone || { x: 0, z: 0, radius: 50 },
        maxEvasionTime: config.data?.maxEvasionTime || 180, evasionTime: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, pursuerPositions: any[], dt: number): void {
    if (this.status !== 'active') return;

    this.data.evasionTime += dt;
    if (this.data.evasionTime > this.data.maxEvasionTime) {
      this.fail();
      if (typeof toast === 'function') toast('⏱️ Caught by pursuers!', '#ef4444');
      return;
    }

    for (const p of pursuerPositions) {
      const dx = p.x - playerPos.x;
      const dz = p.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        this.fail();
        if (typeof toast === 'function') toast('💥 Pursuer caught you!', '#ef4444');
        return;
      }
    }

    const dx = this.data.safeZone.x - playerPos.x;
    const dz = this.data.safeZone.z - playerPos.z;
    const distToSafe = Math.sqrt(dx * dx + dz * dz);

    if (distToSafe < this.data.safeZone.radius) {
      this.status = 'completed';
      if (typeof toast === 'function') toast('🏁 Reached safe zone!', '#34d399');
      if (this.onComplete) this.onComplete(this);
    }
  }

  getProgressPercent(): number {
    const dx = this.data.safeZone.x - (this.data.lastPlayerPos?.x || 0);
    const dz = this.data.safeZone.z - (this.data.lastPlayerPos?.z || 0);
    const dist = Math.sqrt(dx * dx + dz * dz);
    return Math.max(0, 100 - (dist / 500) * 100);
  }
}

export class CrossingGuardMission extends Mission {
  constructor(config: any = {}) {
    super('CROSSING_GUARD', {
      target: config.target || 5,
      reward: config.reward || 3000,
      data: {
        childrenCrossed: 0,
        targetChildren: config.data?.targetChildren || 5,
        currentGroup: null,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, childrenGroups: any[], dt: number): void {
    if (this.status !== 'active') return;

    for (const group of childrenGroups) {
      if (group.crossed) continue;
      const dx = group.x - playerPos.x;
      const dz = group.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8 && group.waiting) {
        group.waiting = false;
        group.crossing = true;
        this.data.currentGroup = group;
        if (typeof toast === 'function') toast('🚸 Guide children across!', '#34d399');
      }
      if (group.crossing && dist > 15) {
        group.crossed = true;
        group.crossing = false;
        this.data.childrenCrossed++;
        this.updateProgress(this.data.childrenCrossed);
        if (typeof toast === 'function') toast(`🚸 Group crossed (${this.data.childrenCrossed}/${this.data.targetChildren})`, '#34d399');
      }
    }

    if (this.data.childrenCrossed >= this.data.targetChildren) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  getProgressPercent(): number {
    return (this.data.childrenCrossed / this.data.targetChildren) * 100;
  }
}

export class SidewalkPatrolMission extends Mission {
  constructor(config: any = {}) {
    super('SIDEWALK_PATROL', {
      target: config.target || 3,
      reward: config.reward || 2500,
      data: {
        violationsReported: 0,
        targetViolations: config.data?.targetViolations || 3,
        patrolRoute: config.data?.patrolRoute || [], currentWaypoint: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, violations: any[], dt: number): void {
    if (this.status !== 'active') return;

    for (const v of violations) {
      if (v.reported) continue;
      const dx = v.x - playerPos.x;
      const dz = v.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 10) {
        v.reported = true;
        this.data.violationsReported++;
        this.updateProgress(this.data.violationsReported);
        if (typeof toast === 'function') toast(`🚶 Violation reported: ${v.type}`, '#34d399');
      }
    }

    if (this.data.violationsReported >= this.data.targetViolations) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  getProgressPercent(): number {
    return (this.data.violationsReported / this.data.targetViolations) * 100;
  }
}

export class EmergencyClearMission extends Mission {
  constructor(config: any = {}) {
    super('EMERGENCY_CLEAR', {
      target: config.target || 1,
      reward: config.reward || 4000,
      data: { ambulancePos: null, pathCleared: false, clearDistance: 25, ...config.data },
      ...config
    });
  }

  update(playerPos: any, ambulancePos: any, pedPositions: any[], dt: number): void {
    if (this.status !== 'active') return;
    if (!ambulancePos) return;

    this.data.ambulancePos = ambulancePos;
    const dx = ambulancePos.x - playerPos.x;
    const dz = ambulancePos.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < this.data.clearDistance && !this.data.pathCleared) {
      let blocking = 0;
      for (const ped of pedPositions) {
        const pdx = ped.x - ambulancePos.x;
        const pdz = ped.z - ambulancePos.z;
        if (Math.sqrt(pdx * pdx + pdz * pdz) < 8) blocking++;
      }
      if (blocking === 0) {
        this.data.pathCleared = true;
        this.status = 'completed';
        if (typeof toast === 'function') toast('🚑 Path cleared for ambulance!', '#34d399');
        if (this.onComplete) this.onComplete(this);
      } else if (typeof toast === 'function') {
        toast(`🚑 Clear ${blocking} pedestrians from path!`, '#f2b84b');
      }
    }
  }

  getProgressPercent(): number {
    return this.data.pathCleared ? 100 : 0;
  }
}

export class SchoolPatrolMission extends Mission {
  constructor(config: any = {}) {
    super('SCHOOL_PATROL', {
      target: config.target || 3,
      reward: config.reward || 3500,
      data: {
        speedersCaught: 0,
        targetSpeeders: config.data?.targetSpeeders || 3,
        schoolZone: config.data?.schoolZone || { x: 0, z: 0, radius: 50 },
        ...config.data
      },
      ...config
    });
  }

  update(playerPos: any, vehiclePositions: any[], dt: number): void {
    if (this.status !== 'active') return;

    for (const v of vehiclePositions) {
      if (v.caught) continue;
      const dx = v.x - this.data.schoolZone.x;
      const dz = v.z - this.data.schoolZone.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < this.data.schoolZone.radius && v.speed > 8) {
        v.caught = true;
        this.data.speedersCaught++;
        this.updateProgress(this.data.speedersCaught);
        if (typeof toast === 'function') toast(`🏫 Speeder caught in school zone! (${this.data.speedersCaught}/${this.data.targetSpeeders})`, '#ef4444');
      }
    }

    if (this.data.speedersCaught >= this.data.targetSpeeders) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  getProgressPercent(): number {
    return (this.data.speedersCaught / this.data.targetSpeeders) * 100;
  }
}

export class MissionManager {
  game: any;
  missions: Mission[] = [];
  collectibles: Collectible[] = [];
  totalCollected: number = 0;
  totalReward: number = 0;
  active: boolean = false;
  _collectibleGroup: THREE.Group;

  constructor(game: any) {
    this.game = game;
    this._collectibleGroup = new THREE.Group();
    this._collectibleGroup.name = 'collectibles';
  }

  init(): void {
    if (this.game.scene) this.game.scene.add(this._collectibleGroup);
  }

  generateMissions(levelConfig: any): Mission[] {
    this.clear();
    this.active = true;
    this.init();

    if (!levelConfig) return [];

    this.spawnCollectibles(levelConfig, 5 + Math.floor(Math.random() * 4));

    if (levelConfig.route && levelConfig.route.length >= 2) {
      const cpMission = this.createRouteCheckpointMission(levelConfig);
      if (cpMission) this.missions.push(cpMission);
    } else if (levelConfig.roads && levelConfig.roads.length > 0) {
      const cpMission = this.createCheckpointMission(levelConfig);
      if (cpMission) this.missions.push(cpMission);
    }

    const behaviorMission = this.createBehaviorMission(levelConfig);
    if (behaviorMission) this.missions.push(behaviorMission);

    const specialMissions: (Mission | null)[] = [];
    if (!levelConfig.isPedestrian) {
      specialMissions.push(
        this.createEscortMission(levelConfig),
        this.createChaseMission(levelConfig),
        this.createParkingMission(levelConfig),
        this.createCargoMission(levelConfig),
        this.createEvasionMission(levelConfig),
        this.createEmergencyClearMission(levelConfig),
        this.createSchoolPatrolMission(levelConfig)
      );
    } else {
      specialMissions.push(
        this.createCrossingGuardMission(levelConfig),
        this.createSidewalkPatrolMission(levelConfig),
        this.createEmergencyClearMission(levelConfig),
        this.createSchoolPatrolMission(levelConfig)
      );
    }

    const validSpecials = specialMissions.filter(m => m !== null);
    if (validSpecials.length > 0) {
      const selected = validSpecials[Math.floor(Math.random() * validSpecials.length)];
      this.missions.push(selected!);
    }

    if (levelConfig.useLowPolyCity || (levelConfig.roads && levelConfig.roads.length > 2)) {
      const exploreMission = this.createExplorationMission(levelConfig);
      if (exploreMission) this.missions.push(exploreMission);
    }

    return this.missions;
  }

  createRouteCheckpointMission(levelConfig: any): Mission | null {
    const route = levelConfig.route;
    const checkpoints: any[] = [];

    let totalDist = 0;
    for (let i = 1; i < route.length; i++) {
      totalDist += Math.hypot(route[i].x - route[i-1].x, route[i].z - route[i-1].z);
    }

    const minSpacing = 80;
    const numCheckpoints = Math.max(3, Math.min(6, Math.floor(totalDist / minSpacing)));

    for (let i = 1; i <= numCheckpoints; i++) {
      const targetDist = (totalDist * i) / (numCheckpoints + 1);
      let accumulated = 0;
      for (let j = 1; j < route.length; j++) {
        const segDist = Math.hypot(route[j].x - route[j-1].x, route[j].z - route[j-1].z);
        if (accumulated + segDist >= targetDist) {
          const t = segDist > 0 ? (targetDist - accumulated) / segDist : 0;
          checkpoints.push({
            x: route[j-1].x + (route[j].x - route[j-1].x) * t,
            z: route[j-1].z + (route[j].z - route[j-1].z) * t,
            reached: false
          });
          break;
        }
        accumulated += segDist;
      }
    }

    const filtered = [checkpoints[0]].filter(Boolean);
    for (let i = 1; i < checkpoints.length; i++) {
      const prev = filtered[filtered.length - 1];
      const dist = Math.hypot(checkpoints[i].x - prev.x, checkpoints[i].z - prev.z);
      if (dist >= minSpacing) filtered.push(checkpoints[i]);
    }

    const baseReward = levelConfig.isPedestrian ? 1500 : 3000;
    return new Mission('CHECKPOINT', {
      target: filtered.length,
      reward: baseReward + filtered.length * 750,
      tokenReward: Math.floor((baseReward + filtered.length * 750) / 100),
      data: { checkpoints: filtered }
    });
  }

  createCheckpointMission(levelConfig: any): Mission | null {
    const checkpoints: any[] = [];
    const roads = levelConfig.roads;
    const numCheckpoints = Math.min(4, Math.max(2, Math.floor(roads.length / 2)));

    const usedRoads = new Set();
    for (let i = 0; i < numCheckpoints; i++) {
      let road: any;
      let attempts = 0;
      do {
        road = roads[Math.floor(Math.random() * roads.length)];
        attempts++;
      } while (usedRoads.has(road) && attempts < 20);
      usedRoads.add(road);

      let x: number, z: number;
      const t = (i % 2 === 0) ? 0.33 : 0.67;
      if (road.type === 'v') {
        x = road.x;
        z = road.z1 + (road.z2 - road.z1) * t;
      } else {
        z = road.z;
        x = road.x1 + (road.x2 - road.x1) * t;
      }
      checkpoints.push({ x, z, reached: false });
    }

    return new Mission('CHECKPOINT', {
      target: numCheckpoints,
      reward: 2000 + numCheckpoints * 500,
      tokenReward: Math.floor((2000 + numCheckpoints * 500) / 100),
      data: { checkpoints }
    });
  }

  createBehaviorMission(levelConfig: any): Mission {
    const objectives: any[] = [];
    if (!levelConfig.isPedestrian) {
      objectives.push({ id: 'wear_safety', text: 'Wear seatbelt / Helmet', type: 'toggle', count: 1 });
      objectives.push({ id: 'use_indicator', text: 'Use turn signal once', type: 'toggle', count: 1 });
      objectives.push({ id: 'drive_straight', text: 'Drive 50m without violations', type: 'distance', count: 50 });
    } else {
      objectives.push({ id: 'walk_sidewalk', text: 'Walk 30m on sidewalk', type: 'distance', count: 30 });
      objectives.push({ id: 'look_both_ways', text: 'Stop at intersection', type: 'stop', count: 1 });
    }
    return new Mission('BEHAVIOR', {
      target: objectives.length,
      reward: levelConfig.isPedestrian ? 2000 : 4000,
      tokenReward: Math.floor((levelConfig.isPedestrian ? 2000 : 4000) / 100),
      data: { objectives }
    });
  }

  createFollowMission(levelConfig: any): Mission {
    return new Mission('FOLLOW', {
      target: 1, reward: 2000, tokenReward: 20,
      data: { routeLength: levelConfig.route.length }
    });
  }

  createExplorationMission(levelConfig: any): Mission {
    return new Mission('COLLECT', {
      target: 3, reward: 2500, tokenReward: 25,
      data: { type: 'exploration' }
    });
  }

  createEscortMission(levelConfig: any): Mission | null {
    if (!levelConfig.route || levelConfig.route.length < 3) return null;
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['emergency_access', 'bonus_vip_convoy', 'highway_discipline'].includes(theme)) return null;
    const baseReward = levelConfig.isPedestrian ? 4000 : 6000;
    return new EscortMission({
      target: 1, reward: baseReward, tokenReward: Math.floor(baseReward / 100),
      data: { targetIntersections: 3 + Math.floor(Math.random() * 3), route: levelConfig.route }
    });
  }

  createChaseMission(levelConfig: any): Mission | null {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['emergency_access', 'night_driving', 'bonus_vip_convoy', 'chaos'].includes(theme)) return null;
    const baseReward = levelConfig.isPedestrian ? 4500 : 7000;
    return new ChaseMission({
      target: 1, reward: baseReward, tokenReward: Math.floor(baseReward / 100),
      data: { maxChaseTime: levelConfig.isPedestrian ? 180 : 120, route: levelConfig.route }
    });
  }

  createParkingMission(levelConfig: any): Mission | null {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['speed_management', 'pedestrian_courtesy', 'silence_zone'].includes(theme)) return null;
    if (levelConfig.isPedestrian) return null;
    const spot = this._generateParkingSpot(levelConfig);
    if (!spot) return null;
    return new ParkingMission({ target: 1, reward: 4000, tokenReward: 40, data: { spot } });
  }

  createCargoMission(levelConfig: any): Mission | null {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['highway_discipline', 'monsoon_survival', 'bonus_night_monsoon', 'rail_safety'].includes(theme)) return null;
    if (levelConfig.isPedestrian) return null;
    return new CargoMission({
      target: 100, reward: 5000, tokenReward: 50,
      data: {
        distanceTarget: levelConfig.route ? this._calculateRouteDistance(levelConfig.route) : 800,
        maxLateralG: theme === 'monsoon_survival' ? 0.6 : 0.8,
        maxLongitudinalG: theme === 'highway_discipline' ? 1.2 : 1.0
      }
    });
  }

  createEvasionMission(levelConfig: any): Mission | null {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['night_driving', 'chaos', 'bonus_night_monsoon'].includes(theme)) return null;
    const baseReward = levelConfig.isPedestrian ? 3500 : 6000;
    const safeZone = this._generateSafeZone(levelConfig);
    return new EvasionMission({
      target: 1, reward: baseReward, tokenReward: Math.floor(baseReward / 100),
      data: { safeZone, maxEvasionTime: levelConfig.isPedestrian ? 240 : 180 }
    });
  }

  createCrossingGuardMission(levelConfig: any): Mission | null {
    if (!levelConfig.isPedestrian) return null;
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['pedestrian_courtesy', 'silence_zone', 'rail_safety'].includes(theme)) return null;
    return new CrossingGuardMission({
      target: 5, reward: 3500, tokenReward: 35,
      data: { targetChildren: 4 + Math.floor(Math.random() * 3) }
    });
  }

  createSidewalkPatrolMission(levelConfig: any): Mission | null {
    if (!levelConfig.isPedestrian) return null;
    return new SidewalkPatrolMission({
      target: 3, reward: 2500, tokenReward: 25,
      data: { targetViolations: 2 + Math.floor(Math.random() * 2), patrolRoute: levelConfig.route || [] }
    });
  }

  createEmergencyClearMission(levelConfig: any): Mission | null {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['emergency_access', 'silence_zone', 'rail_safety'].includes(theme)) return null;
    const baseReward = levelConfig.isPedestrian ? 3500 : 5000;
    return new EmergencyClearMission({
      target: 1, reward: baseReward, tokenReward: Math.floor(baseReward / 100),
      data: { clearDistance: 25 }
    });
  }

  createSchoolPatrolMission(levelConfig: any): Mission | null {
    if (!levelConfig.hasSchool && !levelConfig.isSilenceZone) return null;
    const baseReward = levelConfig.isPedestrian ? 3000 : 4500;
    return new SchoolPatrolMission({
      target: 3, reward: baseReward, tokenReward: Math.floor(baseReward / 100),
      data: { targetSpeeders: 2 + Math.floor(Math.random() * 2), schoolZone: { x: 0, z: 0, radius: 60 } }
    });
  }

  _generateParkingSpot(levelConfig: any): any {
    const roads = levelConfig.roads || [];
    if (roads.length === 0) return null;
    const road = roads[Math.floor(Math.random() * roads.length)];
    let x: number, z: number, rotation: number, type: string;
    if (road.type === 'v') {
      x = road.x - 3.5;
      z = road.z1 + (road.z2 - road.z1) * (0.3 + Math.random() * 0.4);
      rotation = 0; type = 'parallel';
    } else {
      x = road.x1 + (road.x2 - road.x1) * (0.3 + Math.random() * 0.4);
      z = road.z - 3.5;
      rotation = Math.PI / 2; type = 'parallel';
    }
    return { x, z, rotation, type };
  }

  _generateSafeZone(levelConfig: any): any {
    const roads = levelConfig.roads || [];
    if (roads.length === 0) return { x: 500, z: 500, radius: 50 };
    const road = roads[Math.floor(Math.random() * roads.length)];
    let x: number, z: number;
    if (road.type === 'v') {
      x = road.x + (Math.random() - 0.5) * 40;
      z = road.z1 + (road.z2 - road.z1) * 0.8;
    } else {
      x = road.x1 + (road.x2 - road.x1) * 0.8;
      z = road.z + (Math.random() - 0.5) * 40;
    }
    return { x, z, radius: 40 + Math.random() * 20 };
  }

  _calculateRouteDistance(route: any[]): number {
    let dist = 0;
    for (let i = 1; i < route.length; i++) {
      dist += Math.hypot(route[i].x - route[i-1].x, route[i].z - route[i-1].z);
    }
    return dist;
  }

  spawnCollectibles(levelConfig: any, count: number): void {
    const positions = this._generateCollectiblePositions(levelConfig, count);
    for (const pos of positions) {
      const type = Math.random() > 0.85 ? 'STAR' : (Math.random() > 0.95 ? 'GEM' : 'COIN');
      const collectible = new Collectible(type, pos.x, pos.z);
      this.collectibles.push(collectible);
      this._collectibleGroup.add(collectible.mesh);
    }
  }

  _generateCollectiblePositions(levelConfig: any, count: number): any[] {
    const positions: any[] = [];
    const roads = levelConfig.roads || [];

    if (roads.length > 0) {
      for (let i = 0; i < count; i++) {
        const road = roads[i % roads.length];
        let x: number, z: number;
        const t = ((i * 0.37) % 1.0);
        if (road.type === 'v') {
          x = road.x + (Math.random() - 0.5) * 8;
          z = road.z1 + (road.z2 - road.z1) * t;
        } else {
          z = road.z + (Math.random() - 0.5) * 8;
          x = road.x1 + (road.x2 - road.x1) * t;
        }
        positions.push({ x, z });
      }
    } else {
      const spread = levelConfig.useLowPolyCity ? 1000 : 500;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = spread * (0.3 + Math.random() * 0.7);
        positions.push({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius });
      }
    }
    return positions;
  }

  update(playerPos: any, dt: number, time: number, extra: any = {}): void {
    if (!this.active) return;

    const {
      playerRot = 0, speed = 0, lateralG = 0, longitudinalG = 0,
      hitPothole = false, lastPos = null, leadVehiclePos = null,
      targetVehiclePos = null, pursuerPositions = [], childrenGroups = [],
      violations = [], ambulancePos = null, pedPositions = [],
      vehiclePositions = [], intersections = []
    } = extra;

    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.update(dt, time);
      const dx = playerPos.x - c.position.x;
      const dz = playerPos.z - c.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        const value = c.collect();
        if (value > 0) {
          this.totalCollected++;
          this.totalReward += value;
          this._onCollectibleCollected(c, value);
        }
      }
    }

    for (const mission of this.missions) {
      if (mission.status !== 'active') continue;
      const wasActive = mission.status === 'active';

      if (mission.type === 'CHECKPOINT') {
        const checkpoints = mission.data.checkpoints;
        let reached = 0;
        for (const cp of checkpoints) {
          if (cp.reached) { reached++; continue; }
          const dx = playerPos.x - cp.x;
          const dz = playerPos.z - cp.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 20) {
            cp.reached = true;
            reached++;
            this._onCheckpointReached(cp);
          }
        }
        mission.updateProgress(reached);
      } else if (mission instanceof EscortMission) {
        mission.update(playerPos, leadVehiclePos, dt, intersections);
      } else if (mission instanceof ChaseMission) {
        mission.update(playerPos, targetVehiclePos, dt);
      } else if (mission instanceof ParkingMission) {
        mission.update(playerPos, playerRot, dt, speed);
      } else if (mission instanceof CargoMission) {
        mission.update(playerPos, lateralG, longitudinalG, dt, hitPothole, lastPos);
      } else if (mission instanceof EvasionMission) {
        mission.update(playerPos, pursuerPositions, dt);
      } else if (mission instanceof CrossingGuardMission) {
        mission.update(playerPos, childrenGroups, dt);
      } else if (mission instanceof SidewalkPatrolMission) {
        mission.update(playerPos, violations, dt);
      } else if (mission instanceof EmergencyClearMission) {
        mission.update(playerPos, ambulancePos, pedPositions, dt);
      } else if (mission instanceof SchoolPatrolMission) {
        mission.update(playerPos, vehiclePositions, dt);
      }

      if (wasActive && mission.status === 'completed' && !(mission as any)._tokensGranted) {
        this._grantMissionTokens(mission);
        (mission as any)._tokensGranted = true;
      }
    }
  }

  _onCollectibleCollected(collectible: Collectible, value: number): void {
    if (this.game.playerScore !== undefined) this.game.playerScore += value;
    if (this.game.rupees !== undefined) this.game.rupees += value;
    if (typeof toast === 'function') {
      toast(`+₹${value} ${collectible.type === 'STAR' ? '⭐' : collectible.type === 'GEM' ? '💎' : '🪙'}`, '#f2b84b');
    }
    if (typeof sfx !== 'undefined' && sfx.play) sfx.play('ok');
    for (const mission of this.missions) {
      if (mission.type === 'COLLECT' && mission.status === 'active') mission.incrementProgress();
    }
  }

  _onCheckpointReached(checkpoint: any): void {
    if (typeof toast === 'function') toast('🏁 Checkpoint!', '#34d399');
    if (typeof sfx !== 'undefined' && sfx.play) sfx.play('ok');
  }

  _grantMissionTokens(mission: Mission): void {
    const tokens = mission.tokenReward || 0;
    if (tokens <= 0) return;
    if (this.game && typeof this.game.missionTokens !== 'undefined') this.game.missionTokens += tokens;
    if ((window as any).S) {
      (window as any).S.missionTokens = ((window as any).S.missionTokens || 0) + tokens;
    }
    const tokenEl = document.getElementById('mission-tokens');
    if (tokenEl) tokenEl.textContent = (window as any).S?.missionTokens?.toLocaleString?.() || String(tokens);
    if (typeof toast === 'function') toast(`🎖️ +${tokens} Mission Tokens!`, '#b89bff');
    if (this.game && typeof this.game._syncWalletToSupabase === 'function') {
      this.game._syncWalletToSupabase(tokens, 'earn', 'mission_token');
    }
  }

  getMissions(): Mission[] { return this.missions; }

  getCollectibleCount(): { total: number; collected: number } {
    return { total: this.collectibles.length, collected: this.totalCollected };
  }

  clear(): void {
    for (const c of this.collectibles) c.dispose();
    this.collectibles = [];
    this.missions = [];
    this.totalCollected = 0;
    this.totalReward = 0;
    this.active = false;
    if (this._collectibleGroup.parent) {
      this._collectibleGroup.parent.remove(this._collectibleGroup);
    }
  }

  getStats(): any {
    return {
      missions: this.missions.length,
      missionsCompleted: this.missions.filter(m => m.status === 'completed').length,
      collectibles: this.collectibles.length,
      collectiblesCollected: this.totalCollected,
      totalReward: this.totalReward
    };
  }
}

export class CampaignManager {
  game: any;
  activeCampaign: any = null;
  activeMissionIndex: number = 0;
  campaignProgress: any;

  constructor(game: any) {
    this.game = game;
    this.campaignProgress = this._loadProgress();
  }

  _loadProgress(): any {
    try {
      const saved = localStorage.getItem('traffic_campaign_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  _saveProgress(): void {
    localStorage.setItem('traffic_campaign_progress', JSON.stringify(this.campaignProgress));
  }

  getAvailableCampaigns(): any[] {
    const CAMPAIGNS = (window as any).CAMPAIGNS;
    if (!CAMPAIGNS) return [];
    return CAMPAIGNS.filter(c => {
      if (!c.prerequisite) return true;
      const prereq = this.campaignProgress[c.prerequisite];
      return prereq?.completed === true;
    });
  }

  getCampaignProgress(campaignId: string): any {
    if (!(window as any).getCampaignProgress) return null;
    const userData = { campaignProgress: this.campaignProgress };
    return (window as any).getCampaignProgress(userData, campaignId);
  }

  startCampaign(campaignId: string): boolean {
    const campaign = (window as any).getCampaign?.(campaignId);
    if (!campaign) return false;
    const progress = this.getCampaignProgress(campaignId);
    if (!progress?.unlocked) return false;

    this.activeCampaign = campaign;
    this.activeMissionIndex = progress?.currentMission
      ? campaign.missions.findIndex(m => m.levelId === progress.currentMission.levelId)
      : 0;
    if (this.activeMissionIndex < 0) this.activeMissionIndex = 0;

    if (!this.campaignProgress[campaignId]) {
      this.campaignProgress[campaignId] = {
        completedMissions: [], currentMissionIndex: 0,
        startedAt: Date.now(), completed: false
      };
    }
    this._saveProgress();
    return true;
  }

  getCurrentMission(): any {
    if (!this.activeCampaign) return null;
    return this.activeCampaign.missions[this.activeMissionIndex] || null;
  }

  completeCurrentMission(success: boolean = true): boolean {
    if (!this.activeCampaign) return false;
    const mission = this.getCurrentMission();
    if (!mission) return false;

    const campaignId = this.activeCampaign.id;
    const progress = this.campaignProgress[campaignId];

    if (success) {
      progress.completedMissions.push(mission.levelId);
      progress.currentMissionIndex = this.activeMissionIndex + 1;
      if (progress.currentMissionIndex >= this.activeCampaign.missions.length) {
        progress.completed = true;
        progress.completedAt = Date.now();
        this._grantCampaignRewards();
        if (typeof toast === 'function') toast(`🏆 Campaign Complete: ${this.activeCampaign.name}!`, '#ffd54a');
      }
    }
    this._saveProgress();
    return true;
  }

  _grantCampaignRewards(): void {
    if (!this.activeCampaign?.rewards) return;
    const { wallet, xp, badge } = this.activeCampaign.rewards;
    const S = (window as any).S;

    if (S && wallet) {
      S.wallet = (S.wallet || 0) + wallet;
      const hw = document.getElementById('hwallet');
      if (hw) hw.textContent = '₹' + S.wallet.toLocaleString('en-IN');
    }
    if (S && xp) S.total = (S.total || 0) + xp;
    if (badge && (window as any).checkAndAwardBadges) {
      const userData = { badges: S?.badges || [], campaignProgress: this.campaignProgress };
      const newBadges = (window as any).checkAndAwardBadges(userData);
      if (newBadges.length > 0 && typeof toast === 'function') {
        newBadges.forEach(b => toast(`🏅 New Badge: ${b}`, '#ffd54a'));
      }
    }
    if ((window as any).WalletHistory && wallet) {
      (window as any).WalletHistory.earn('campaign_reward', wallet, { campaignId: this.activeCampaign.id });
    }
  }

  nextMission(): any {
    if (!this.activeCampaign) return null;
    this.activeMissionIndex++;
    if (this.activeMissionIndex >= this.activeCampaign.missions.length) {
      this.activeCampaign = null;
      return null;
    }
    const progress = this.campaignProgress[this.activeCampaign.id];
    if (progress) {
      progress.currentMissionIndex = this.activeMissionIndex;
      this._saveProgress();
    }
    return this.getCurrentMission();
  }

  getMissionChainUI(campaignId: string): any {
    const progress = this.getCampaignProgress(campaignId);
    if (!progress) return null;
    return {
      campaign: progress.campaign,
      missions: progress.campaign.missions.map((m: any, i: number) => ({
        ...m,
        status: i < progress.completedCount ? 'completed' :
                i === progress.currentMission ? 'current' :
                (progress.unlocked ? 'locked' : 'prereq_locked'),
        completed: i < progress.completedCount,
        isCurrent: i === progress.currentMission
      })),
      progressPercent: progress.progressPercent,
      unlocked: progress.unlocked
    };
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).MissionManager = MissionManager;
  (window as any).Collectible = Collectible;
  (window as any).MISSION_TYPES = MISSION_TYPES;
  (window as any).COLLECTIBLE_TYPES = COLLECTIBLE_TYPES;
  (window as any).EscortMission = EscortMission;
  (window as any).ChaseMission = ChaseMission;
  (window as any).ParkingMission = ParkingMission;
  (window as any).CargoMission = CargoMission;
  (window as any).EvasionMission = EvasionMission;
  (window as any).CrossingGuardMission = CrossingGuardMission;
  (window as any).SidewalkPatrolMission = SidewalkPatrolMission;
  (window as any).EmergencyClearMission = EmergencyClearMission;
  (window as any).SchoolPatrolMission = SchoolPatrolMission;
  (window as any).CampaignManager = CampaignManager;
}