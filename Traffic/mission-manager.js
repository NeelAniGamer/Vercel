

const MISSION_TYPES = {
  CHECKPOINT: {
    id: 'checkpoint',
    icon: '🏁',
    label: 'Checkpoints',
    description: 'Drive through all checkpoints',
  },
  COLLECT: {
    id: 'collect',
    icon: '⭐',
    label: 'Collectibles',
    description: 'Collect all stars',
  },
  TIME_TRIAL: {
    id: 'time_trial',
    icon: '⏱️',
    label: 'Time Trial',
    description: 'Reach the destination before time runs out',
  },
  DELIVERY: {
    id: 'delivery',
    icon: '📦',
    label: 'Delivery',
    description: 'Pick up and deliver the package',
  },
  FOLLOW: {
    id: 'follow',
    icon: '🗺️',
    label: 'Follow Route',
    description: 'Follow the GPS route',
  },
  ESCORT: {
    id: 'escort',
    icon: '🚑',
    label: 'Escort Duty',
    description: 'Protect VIP/emergency vehicle through traffic',
  },
  CHASE: {
    id: 'chase',
    icon: '🚓',
    label: 'Pursuit',
    description: 'Chase and stop target vehicle',
  },
  PARKING: {
    id: 'parking',
    icon: '🅿️',
    label: 'Precision Parking',
    description: 'Park in marked spot without collisions',
  },
  CARGO: {
    id: 'cargo',
    icon: '📦',
    label: 'Fragile Cargo',
    description: 'Transport delicate load smoothly',
  },
  EVASION: {
    id: 'evasion',
    icon: '🏃',
    label: 'Evasion',
    description: 'Escape pursuers to safe zone',
  },
  CROSSING_GUARD: {
    id: 'crossing_guard',
    icon: '🚸',
    label: 'Crossing Guard',
    description: 'Guide pedestrians safely across intersections',
  },
  SIDEWALK_PATROL: {
    id: 'sidewalk_patrol',
    icon: '🚶',
    label: 'Sidewalk Patrol',
    description: 'Monitor sidewalk for violations',
  },
  EMERGENCY_CLEAR: {
    id: 'emergency_clear',
    icon: '🚑',
    label: 'Emergency Clear',
    description: 'Clear path for emergency vehicle',
  },
  SCHOOL_PATROL: {
    id: 'school_patrol',
    icon: '🏫',
    label: 'School Zone Patrol',
    description: 'Enforce school zone speed limits',
  },
  PASSENGER_PICKUP: {
    id: 'passenger_pickup',
    icon: '🚖',
    label: 'Passenger Transit',
    description: 'Pick up and drop off passengers across Mumbai',
  },
};

const COLLECTIBLE_TYPES = {
  COIN: {
    value: 100,
    color: 0xffd700,
    emissive: 0xffa500,
    geometry: 'cylinder',
    scale: 1.0,
  },
  STAR: {
    value: 500,
    color: 0xffeb3b,
    emissive: 0xffc107,
    geometry: 'octahedron',
    scale: 1.5,
  },
  GEM: {
    value: 1000,
    color: 0x00ffff,
    emissive: 0x00bcd4,
    geometry: 'octahedron',
    scale: 1.2,
  },
};

class Collectible {
  constructor(type, x, z, options = {}) {
    this.type = type;
    this.position = { x, z };
    this.collected = false;
    this.config = COLLECTIBLE_TYPES[type] || COLLECTIBLE_TYPES.COIN;
    this.mesh = this._createMesh();
    this.mesh.position.set(x, 2.5, z);
    this.mesh.userData.isCollectible = true;
    this.mesh.userData.collectibleRef = this;
    this.rotationSpeed = 1.5 + Math.random();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 2 + Math.random();
    this.baseY = 2.5;
  }

  _createMesh() {
    const cfg = this.config;
    let geo;
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
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.frustumCulled = true;
    return mesh;
  }

  update(dt, time) {
    if (this.collected) return;

    this.mesh.rotation.y += this.rotationSpeed * dt;

    this.mesh.position.y = this.baseY + Math.sin(time * this.bobSpeed + this.bobPhase) * 0.5;
  }

  collect() {
    if (this.collected) return 0;
    this.collected = true;
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);

    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    return this.config.value;
  }

  dispose() {
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

class Mission {
  constructor(type, config = {}) {
    this.type = type;
    this.config = { ...MISSION_TYPES[type], ...config };
    this.status = 'active';
    this.progress = 0;
    this.target = config.target || 1;
    this.data = config.data || {};
    this.reward = config.reward || 1000;
    this.tokenReward = config.tokenReward || 0;
    this.onComplete = config.onComplete || null;
    this.onFail = config.onFail || null;
  }

  updateProgress(value) {
    this.progress = Math.min(value, this.target);
    if (this.progress >= this.target) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  incrementProgress() {
    this.updateProgress(this.progress + 1);
  }

  fail() {
    this.status = 'failed';
    if (this.onFail) this.onFail(this);
  }

  getProgressPercent() {
    return (this.progress / this.target) * 100;
  }
}

class EscortMission extends Mission {
  constructor(config = {}) {
    super('ESCORT', {
      target: config.target || 1,
      reward: config.reward || 5000,
      data: {
        leadVehicle: null,
        minDistance: 10,
        maxDistance: 35,
        intersectionsCleared: 0,
        targetIntersections: config.data?.targetIntersections || 3,
        ...config.data
      },
      ...config
    });
    this.distanceViolationTime = 0;
    this.maxViolationTime = 5; // seconds before fail
  }

  update(playerPos, leadVehiclePos, dt, intersections) {
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

  getProgressPercent() {
    return (this.data.intersectionsCleared / this.data.targetIntersections) * 100;
  }
}

class ChaseMission extends Mission {
  constructor(config = {}) {
    super('CHASE', {
      target: config.target || 1,
      reward: config.reward || 6000,
      data: {
        targetVehicle: null,
        catchDistance: 8,
        pitDistance: 5,
        maxChaseTime: config.data?.maxChaseTime || 120,
        chaseTime: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, targetPos, dt) {
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

  getProgressPercent() {
    return Math.max(0, 100 - (this.data.currentDistance / 100) * 100);
  }
}

class ParkingMission extends Mission {
  constructor(config = {}) {
    super('PARKING', {
      target: config.target || 1,
      reward: config.reward || 3000,
      data: {
        spot: config.data?.spot || { x: 0, z: 0, rotation: 0, type: 'parallel' },
        maxDeviation: 2.0,
        maxAngleDeviation: 0.3,
        parked: false,
        parkStartTime: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, playerRot, dt, speed) {
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

  getProgressPercent() {
    if (this.data.parked) {
      const elapsed = Date.now() - this.data.parkStartTime;
      return Math.min(100, (elapsed / 3000) * 100);
    }
    const distScore = Math.max(0, 100 - (this.data.currentDistance / this.data.maxDeviation) * 50);
    const angleScore = Math.max(0, 100 - (this.data.currentAngleDiff / this.data.maxAngleDeviation) * 50);
    return (distScore + angleScore) / 2;
  }
}

class CargoMission extends Mission {
  constructor(config = {}) {
    super('CARGO', {
      target: config.target || 100,
      reward: config.reward || 4000,
      data: {
        cargoIntegrity: 100,
        maxLateralG: 0.8,
        maxLongitudinalG: 1.0,
        potholeImpacts: 0,
        maxPotholes: 3,
        distanceTarget: config.data?.distanceTarget || 500,
        distanceTraveled: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, lateralG, longitudinalG, dt, hitPothole, lastPos) {
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

  getProgressPercent() {
    const distPercent = Math.min(100, (this.data.distanceTraveled / this.data.distanceTarget) * 100);
    return (distPercent + this.data.cargoIntegrity) / 2;
  }
}

class EvasionMission extends Mission {
  constructor(config = {}) {
    super('EVASION', {
      target: config.target || 1,
      reward: config.reward || 5000,
      data: {
        pursuers: [],
        safeZone: config.data?.safeZone || { x: 0, z: 0, radius: 50 },
        maxEvasionTime: config.data?.maxEvasionTime || 180,
        evasionTime: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, pursuerPositions, dt) {
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

  getProgressPercent() {
    const dx = this.data.safeZone.x - (this.data.lastPlayerPos?.x || 0);
    const dz = this.data.safeZone.z - (this.data.lastPlayerPos?.z || 0);
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxDist = 500;
    return Math.max(0, 100 - (dist / maxDist) * 100);
  }
}

// Pedestrian Mission Classes
class CrossingGuardMission extends Mission {
  constructor(config = {}) {
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

  update(playerPos, childrenGroups, dt) {
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

  getProgressPercent() {
    return (this.data.childrenCrossed / this.data.targetChildren) * 100;
  }
}

class SidewalkPatrolMission extends Mission {
  constructor(config = {}) {
    super('SIDEWALK_PATROL', {
      target: config.target || 3,
      reward: config.reward || 2500,
      data: {
        violationsReported: 0,
        targetViolations: config.data?.targetViolations || 3,
        patrolRoute: config.data?.patrolRoute || [],
        currentWaypoint: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, violations, dt) {
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

  getProgressPercent() {
    return (this.data.violationsReported / this.data.targetViolations) * 100;
  }
}

class EmergencyClearMission extends Mission {
  constructor(config = {}) {
    super('EMERGENCY_CLEAR', {
      target: config.target || 1,
      reward: config.reward || 4000,
      data: {
        ambulancePos: null,
        pathCleared: false,
        clearDistance: 25,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, ambulancePos, pedPositions, dt) {
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

  getProgressPercent() {
    return this.data.pathCleared ? 100 : 0;
  }
}

class SchoolPatrolMission extends Mission {
  constructor(config = {}) {
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

  update(playerPos, vehiclePositions, dt) {
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

  getProgressPercent() {
    return (this.data.speedersCaught / this.data.targetSpeeders) * 100;
  }
}

class PassengerPickupMission extends Mission {
  constructor(config = {}) {
    super('PASSENGER_PICKUP', {
      target: 1,
      reward: config.reward || 6500,
      tokenReward: config.tokenReward || 65,
      data: {
        stage: 'DRIVE_TO_PICKUP',
        pickupSpot: config.data?.pickupSpot || { x: 0, z: -80, name: 'Bus Shelter #1' },
        dropoffSpot: config.data?.dropoffSpot || { x: 0, z: 180, name: 'Metro Central' },
        passengerMesh: null,
        passengerName: config.data?.passengerName || 'Priya (Commuter)',
        dialogue: config.data?.dialogue || 'Thanks for stopping! Please drop me at the Central Station.',
        dwellTimer: 0,
        ...config.data
      },
      ...config
    });
  }

  update(playerPos, playerRot, dt, speed, game) {
    if (this.status !== 'active') return;
    const stage = this.data.stage;
    const g = game || (window.game);

    // Spawn 3D Waiting Passenger Mesh if not yet spawned
    if (!this.data.passengerMesh && g && g.scene) {
      this._spawnWaitingPassenger(g);
    }

    if (stage === 'DRIVE_TO_PICKUP') {
      const pSpot = this.data.pickupSpot;
      const dist = Math.hypot(playerPos.x - pSpot.x, playerPos.z - pSpot.z);
      this.data.currentDistance = dist;

      if (dist < 8.0 && Math.abs(speed || 0) < 0.25) {
        // Player stopped at pickup spot!
        this.data.stage = 'BOARDING';
        this.data.dwellTimer = 0;
        if (typeof toast === 'function') {
          toast(`🙋 ${this.data.passengerName}: "${this.data.dialogue}"`, '#00f0cc', 4500);
        }
        if (window.sfx && window.sfx.play) window.sfx.play('ok');
      }
    } else if (stage === 'BOARDING') {
      this.data.dwellTimer += dt;
      // Animate passenger walking towards car
      if (this.data.passengerMesh) {
        const pm = this.data.passengerMesh;
        const dx = playerPos.x - pm.position.x;
        const dz = playerPos.z - pm.position.z;
        pm.position.x += dx * dt * 1.8;
        pm.position.z += dz * dt * 1.8;
        pm.position.y = 0.05 + Math.abs(Math.sin(this.data.dwellTimer * 8)) * 0.1;
      }

      if (this.data.dwellTimer >= 2.2) {
        // Passenger entered vehicle
        if (this.data.passengerMesh && this.data.passengerMesh.parent && g && g.scene) {
          g.scene.remove(this.data.passengerMesh);
          this.data.passengerMesh = null;
        }
        this.data.stage = 'DRIVE_TO_DROPOFF';
        if (typeof toast === 'function') {
          toast(`🚘 Passenger on board! Destination: ${this.data.dropoffSpot.name}`, '#fbbf24', 4500);
        }
      }
    } else if (stage === 'DRIVE_TO_DROPOFF') {
      const dSpot = this.data.dropoffSpot;
      const dist = Math.hypot(playerPos.x - dSpot.x, playerPos.z - dSpot.z);
      this.data.currentDistance = dist;

      if (dist < 8.5 && Math.abs(speed || 0) < 0.25) {
        // Safe Drop-off complete!
        this.data.stage = 'COMPLETED';
        this.status = 'completed';
        if (typeof toast === 'function') {
          toast(`🎉 Dropped off ${this.data.passengerName}! +₹${this.reward} Bonus`, '#34d399', 5000);
        }
        if (window.sfx && window.sfx.play) window.sfx.play('win');
        if (this.onComplete) this.onComplete(this);
      }
    }
  }

  _spawnWaitingPassenger(g) {
    const pSpot = this.data.pickupSpot;
    const group = new THREE.Group();
    const mat = new THREE.MeshToonMaterial({ color: 0x3b82f6 });
    const skinMat = new THREE.MeshToonMaterial({ color: 0xf5cba7 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), mat);
    body.position.y = 0.85;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), skinMat);
    head.position.y = 1.45;
    group.add(head);

    // Glowing halo on the ground
    const ringGeo = new THREE.RingGeometry(1.5, 2.2, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0cc, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    group.position.set(pSpot.x, 0, pSpot.z);
    g.scene.add(group);
    this.data.passengerMesh = group;
  }

  getProgressPercent() {
    if (this.data.stage === 'DRIVE_TO_PICKUP') return 25;
    if (this.data.stage === 'BOARDING') return 50;
    if (this.data.stage === 'DRIVE_TO_DROPOFF') return 75;
    if (this.data.stage === 'COMPLETED') return 100;
    return 0;
  }
}

class MissionManager {
  constructor(game) {
    this.game = game;
    this.missions = [];
    this.collectibles = [];
    this.totalCollected = 0;
    this.totalReward = 0;
    this.active = false;
    this._collectibleGroup = new THREE.Group();
    this._collectibleGroup.name = 'collectibles';
  }

  init() {
    if (this.game.scene) {
      this.game.scene.add(this._collectibleGroup);
    }
  }


  generateMissions(levelConfig) {
    this.clear();
    this.active = true;
    this.init();

    if (!levelConfig) return [];

    // Fewer collectibles but more valuable, placed along the route
    this.spawnCollectibles(levelConfig, 5 + Math.floor(Math.random() * 4));

    // Primary mission: distance-based checkpoints along the route
    if (levelConfig.route && levelConfig.route.length >= 2) {
      const cpMission = this.createRouteCheckpointMission(levelConfig);
      if (cpMission) this.missions.push(cpMission);
    } else if (levelConfig.roads && levelConfig.roads.length > 0) {
      const cpMission = this.createCheckpointMission(levelConfig);
      if (cpMission) this.missions.push(cpMission);
    }

    // Secondary mission: driving behavior objectives
    const behaviorMission = this.createBehaviorMission(levelConfig);
    if (behaviorMission) this.missions.push(behaviorMission);

    // Theme-based special missions (only one special mission per level for variety)
    const specialMissions = [];
    
    // Driving missions
    if (!levelConfig.isPedestrian) {
      specialMissions.push(
        this.createPassengerPickupMission(levelConfig),
        this.createEscortMission(levelConfig),
        this.createChaseMission(levelConfig),
        this.createParkingMission(levelConfig),
        this.createCargoMission(levelConfig),
        this.createEvasionMission(levelConfig),
        this.createEmergencyClearMission(levelConfig),
        this.createSchoolPatrolMission(levelConfig)
      );
    } else {
      // Pedestrian missions
      specialMissions.push(
        this.createCrossingGuardMission(levelConfig),
        this.createSidewalkPatrolMission(levelConfig),
        this.createEmergencyClearMission(levelConfig),
        this.createSchoolPatrolMission(levelConfig)
      );
    }

    // Add one random special mission (or first available)
    const validSpecials = specialMissions.filter(m => m !== null);
    if (validSpecials.length > 0) {
      const selected = validSpecials[Math.floor(Math.random() * validSpecials.length)];
      this.missions.push(selected);
    }

    // Tertiary mission: exploration/collection
    if (levelConfig.useLowPolyCity || (levelConfig.roads && levelConfig.roads.length > 2)) {
      const exploreMission = this.createExplorationMission(levelConfig);
      if (exploreMission) this.missions.push(exploreMission);
    }

    return this.missions;
  }

  createRouteCheckpointMission(levelConfig) {
    const route = levelConfig.route;
    const checkpoints = [];

    // Calculate total route distance
    let totalDist = 0;
    for (let i = 1; i < route.length; i++) {
      totalDist += Math.hypot(route[i].x - route[i-1].x, route[i].z - route[i-1].z);
    }

    // Place checkpoints at equal distance intervals (min 80 units apart)
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

    // Filter out checkpoints that are too close to each other
    const filtered = [checkpoints[0]].filter(Boolean);
    for (let i = 1; i < checkpoints.length; i++) {
      const prev = filtered[filtered.length - 1];
      const dist = Math.hypot(checkpoints[i].x - prev.x, checkpoints[i].z - prev.z);
      if (dist >= minSpacing) {
        filtered.push(checkpoints[i]);
      }
    }

    const baseReward = levelConfig.isPedestrian ? 1500 : 3000;

    return new Mission('CHECKPOINT', {
      target: filtered.length,
      reward: baseReward + filtered.length * 750,
      tokenReward: Math.floor((baseReward + filtered.length * 750) / 100),
      data: { checkpoints: filtered },
    });
  }

  createCheckpointMission(levelConfig) {
    const checkpoints = [];
    const roads = levelConfig.roads;
    const numCheckpoints = Math.min(4, Math.max(2, Math.floor(roads.length / 2)));

    // Place checkpoints on DIFFERENT roads for variety
    const usedRoads = new Set();
    for (let i = 0; i < numCheckpoints; i++) {
      let road;
      let attempts = 0;
      do {
        road = roads[Math.floor(Math.random() * roads.length)];
        attempts++;
      } while (usedRoads.has(road) && attempts < 20);
      usedRoads.add(road);

      let x, z;
      // Place at 1/3 or 2/3 along the road (not at intersection)
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
      data: { checkpoints },
    });
  }

  createBehaviorMission(levelConfig) {
    // Multi-step driving behavior mission
    const objectives = [];

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
      data: { objectives },
    });
  }

  createFollowMission(levelConfig) {
    return new Mission('FOLLOW', {
      target: 1,
      reward: 2000,
      tokenReward: 20,
      data: { routeLength: levelConfig.route.length },
    });
  }

  createExplorationMission(levelConfig) {
    return new Mission('COLLECT', {
      target: 3,
      reward: 2500,
      tokenReward: 25,
      data: { type: 'exploration' },
    });
  }

  createEscortMission(levelConfig) {
    if (!levelConfig.route || levelConfig.route.length < 3) return null;
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['emergency_access', 'bonus_vip_convoy', 'highway_discipline'].includes(theme)) return null;

    const baseReward = levelConfig.isPedestrian ? 4000 : 6000;
    return new EscortMission({
      target: 1,
      reward: baseReward,
      tokenReward: Math.floor(baseReward / 100),
      data: {
        targetIntersections: 3 + Math.floor(Math.random() * 3),
        route: levelConfig.route
      }
    });
  }

  createChaseMission(levelConfig) {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['emergency_access', 'night_driving', 'bonus_vip_convoy', 'chaos'].includes(theme)) return null;

    const baseReward = levelConfig.isPedestrian ? 4500 : 7000;
    return new ChaseMission({
      target: 1,
      reward: baseReward,
      tokenReward: Math.floor(baseReward / 100),
      data: {
        maxChaseTime: levelConfig.isPedestrian ? 180 : 120,
        route: levelConfig.route
      }
    });
  }

  createParkingMission(levelConfig) {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['speed_management', 'pedestrian_courtesy', 'silence_zone'].includes(theme)) return null;
    if (levelConfig.isPedestrian) return null;

    const spot = this._generateParkingSpot(levelConfig);
    if (!spot) return null;

    return new ParkingMission({
      target: 1,
      reward: 4000,
      tokenReward: 40,
      data: { spot }
    });
  }

  createCargoMission(levelConfig) {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['highway_discipline', 'monsoon_survival', 'bonus_night_monsoon', 'rail_safety'].includes(theme)) return null;
    if (levelConfig.isPedestrian) return null;

    return new CargoMission({
      target: 100,
      reward: 5000,
      tokenReward: 50,
      data: {
        distanceTarget: levelConfig.route ? this._calculateRouteDistance(levelConfig.route) : 800,
        maxLateralG: theme === 'monsoon_survival' ? 0.6 : 0.8,
        maxLongitudinalG: theme === 'highway_discipline' ? 1.2 : 1.0
      }
    });
  }

  createEvasionMission(levelConfig) {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['night_driving', 'chaos', 'bonus_night_monsoon'].includes(theme)) return null;

    const baseReward = levelConfig.isPedestrian ? 3500 : 6000;
    const safeZone = this._generateSafeZone(levelConfig);
    return new EvasionMission({
      target: 1,
      reward: baseReward,
      tokenReward: Math.floor(baseReward / 100),
      data: {
        safeZone,
        maxEvasionTime: levelConfig.isPedestrian ? 240 : 180
      }
    });
  }

  createCrossingGuardMission(levelConfig) {
    if (!levelConfig.isPedestrian) return null;
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['pedestrian_courtesy', 'silence_zone', 'rail_safety'].includes(theme)) return null;

    return new CrossingGuardMission({
      target: 5,
      reward: 3500,
      tokenReward: 35,
      data: {
        targetChildren: 4 + Math.floor(Math.random() * 3)
      }
    });
  }

  createSidewalkPatrolMission(levelConfig) {
    if (!levelConfig.isPedestrian) return null;

    return new SidewalkPatrolMission({
      target: 3,
      reward: 2500,
      tokenReward: 25,
      data: {
        targetViolations: 2 + Math.floor(Math.random() * 2),
        patrolRoute: levelConfig.route || []
      }
    });
  }

  createEmergencyClearMission(levelConfig) {
    const theme = levelConfig.themeType || levelConfig.theme || '';
    if (!['emergency_access', 'silence_zone', 'rail_safety'].includes(theme)) return null;

    const baseReward = levelConfig.isPedestrian ? 3500 : 5000;
    return new EmergencyClearMission({
      target: 1,
      reward: baseReward,
      tokenReward: Math.floor(baseReward / 100),
      data: { clearDistance: 25 }
    });
  }

  createSchoolPatrolMission(levelConfig) {
    if (!levelConfig.hasSchool && !levelConfig.isSilenceZone) return null;

    const baseReward = levelConfig.isPedestrian ? 3000 : 4500;
    return new SchoolPatrolMission({
      target: 3,
      reward: baseReward,
      tokenReward: Math.floor(baseReward / 100),
      data: {
        targetSpeeders: 2 + Math.floor(Math.random() * 2),
        schoolZone: { x: 0, z: 0, radius: 60 }
      }
    });
  }

  createPassengerPickupMission(levelConfig) {
    if (levelConfig.isPedestrian) return null;
    const roads = levelConfig.roads || [];
    if (roads.length === 0) return null;

    const r1 = roads[0];
    const r2 = roads[roads.length - 1] || r1;
    const isV1 = r1.type === 'v';
    const isV2 = r2.type === 'v';

    const pX = isV1 ? r1.x - 4 : (r1.x1 + r1.x2) / 2;
    const pZ = isV1 ? (r1.z1 + r1.z2) / 2 : r1.z - 4;
    const dX = isV2 ? r2.x + 4 : Math.min(r2.x1, r2.x2) + 25;
    const dZ = isV2 ? Math.max(r2.z1, r2.z2) - 25 : r2.z + 4;

    const stories = [
      { name: 'Rohan (Student)', pickup: 'Bus Stop #1', dropoff: 'Metro Station West', text: 'Hey, I am getting late for college! Can you drop me at the station?' },
      { name: 'Dr. Priya (Doctor)', pickup: 'South Community Clinic', dropoff: 'City Trauma Center', text: 'Urgent hospital duty! Please drive safely to the medical center.' },
      { name: 'Ananya (Tourist)', pickup: 'Gateway Heritage Spot', dropoff: 'Marine Drive Viewpoint', text: 'Hello! I would love to visit the sea-facing promenade.' }
    ];
    const item = stories[Math.floor(Math.random() * stories.length)];

    return new PassengerPickupMission({
      target: 1,
      reward: 6500,
      tokenReward: 65,
      data: {
        pickupSpot: { x: pX, z: pZ, name: item.pickup },
        dropoffSpot: { x: dX, z: dZ, name: item.dropoff },
        passengerName: item.name,
        dialogue: item.text
      }
    });
  }


  _generateParkingSpot(levelConfig) {
    const roads = levelConfig.roads || [];
    if (roads.length === 0) return null;

    const road = roads[Math.floor(Math.random() * roads.length)];
    let x, z, rotation, type;

    if (road.type === 'v') {
      x = road.x - 3.5;
      z = road.z1 + (road.z2 - road.z1) * (0.3 + Math.random() * 0.4);
      rotation = 0;
      type = 'parallel';
    } else {
      x = road.x1 + (road.x2 - road.x1) * (0.3 + Math.random() * 0.4);
      z = road.z - 3.5;
      rotation = Math.PI / 2;
      type = 'parallel';
    }

    return { x, z, rotation, type };
  }

  _generateSafeZone(levelConfig) {
    const roads = levelConfig.roads || [];
    if (roads.length === 0) return { x: 500, z: 500, radius: 50 };

    const road = roads[Math.floor(Math.random() * roads.length)];
    let x, z;
    if (road.type === 'v') {
      x = road.x + (Math.random() - 0.5) * 40;
      z = road.z1 + (road.z2 - road.z1) * 0.8;
    } else {
      x = road.x1 + (road.x2 - road.x1) * 0.8;
      z = road.z + (Math.random() - 0.5) * 40;
    }
    return { x, z, radius: 40 + Math.random() * 20 };
  }

  _calculateRouteDistance(route) {
    let dist = 0;
    for (let i = 1; i < route.length; i++) {
      dist += Math.hypot(route[i].x - route[i-1].x, route[i].z - route[i-1].z);
    }
    return dist;
  }

  spawnCollectibles(levelConfig, count) {
    const positions = this._generateCollectiblePositions(levelConfig, count);
    for (const pos of positions) {
      const type = Math.random() > 0.85 ? 'STAR' : (Math.random() > 0.95 ? 'GEM' : 'COIN');
      const collectible = new Collectible(type, pos.x, pos.z);
      this.collectibles.push(collectible);
      this._collectibleGroup.add(collectible.mesh);
    }
  }

  _generateCollectiblePositions(levelConfig, count) {
    const positions = [];
    const roads = levelConfig.roads || [];

    if (roads.length > 0) {
      // Spread collectibles along different road segments
      for (let i = 0; i < count; i++) {
        const road = roads[i % roads.length];
        let x, z;
        // Place at different positions along each road
        const t = ((i * 0.37) % 1.0); // Pseudo-random spread
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
        positions.push({
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
        });
      }
    }

    return positions;
  }

  update(playerPos, dt, time, extra = {}) {
    if (!this.active) return;

    const {
      playerRot = 0,
      speed = 0,
      lateralG = 0,
      longitudinalG = 0,
      hitPothole = false,
      lastPos = null,
      leadVehiclePos = null,
      targetVehiclePos = null,
      pursuerPositions = [],
      childrenGroups = [],
      violations = [],
      ambulancePos = null,
      pedPositions = [],
      vehiclePositions = [],
      intersections = []
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
          if (cp.reached) {
            reached++;
            continue;
          }
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
      } else if (mission.type === 'ESCORT' && mission.update) {
        mission.update(playerPos, leadVehiclePos, dt, intersections);
      } else if (mission.type === 'CHASE' && mission.update) {
        mission.update(playerPos, targetVehiclePos, dt);
      } else if (mission.type === 'PARKING' && mission.update) {
        mission.update(playerPos, playerRot, dt, speed);
      } else if (mission.type === 'CARGO' && mission.update) {
        mission.update(playerPos, lateralG, longitudinalG, dt, hitPothole, lastPos);
      } else if (mission.type === 'EVASION' && mission.update) {
        mission.update(playerPos, pursuerPositions, dt);
      } else if (mission.type === 'CROSSING_GUARD' && mission.update) {
        mission.update(playerPos, childrenGroups, dt);
      } else if (mission.type === 'SIDEWALK_PATROL' && mission.update) {
        mission.update(playerPos, violations, dt);
      } else if (mission.type === 'EMERGENCY_CLEAR' && mission.update) {
        mission.update(playerPos, ambulancePos, pedPositions, dt);
      } else if (mission.type === 'SCHOOL_PATROL' && mission.update) {
        mission.update(playerPos, vehiclePositions, dt);
      } else if (mission.type === 'PASSENGER_PICKUP' && mission.update) {
        mission.update(playerPos, playerRot, dt, speed, this.game);
      }

      // Grant tokens when mission completes
      if (wasActive && mission.status === 'completed' && !mission._tokensGranted) {
        this._grantMissionTokens(mission);
        mission._tokensGranted = true;
      }
    }
  }

  _onCollectibleCollected(collectible, value) {

    if (this.game.playerScore !== undefined) {
      this.game.playerScore += value;
    }
    if (this.game.rupees !== undefined) {
      this.game.rupees += value;
    }

    if (typeof toast === 'function') {
      toast(`+₹${value} ${collectible.type === 'STAR' ? '⭐' : collectible.type === 'GEM' ? '💎' : '🪙'}`, '#f2b84b');
    }

    if (typeof sfx !== 'undefined' && sfx.play) {
      sfx.play('ok');
    }


    for (const mission of this.missions) {
      if (mission.type === 'COLLECT' && mission.status === 'active') {
        mission.incrementProgress();
      }
    }
  }

  _onCheckpointReached(checkpoint) {
    if (typeof toast === 'function') {
      toast('🏁 Checkpoint!', '#34d399');
    }
    if (typeof sfx !== 'undefined' && sfx.play) {
      sfx.play('ok');
    }
  }

  _grantMissionTokens(mission) {
    const tokens = mission.tokenReward || 0;
    if (tokens <= 0) return;

    // Add to game's mission tokens
    if (this.game && typeof this.game.missionTokens !== 'undefined') {
      this.game.missionTokens += tokens;
    }

    // Add to user data
    if (window.S) {
      window.S.missionTokens = (window.S.missionTokens || 0) + tokens;
    }

    // Update UI
    const tokenEl = document.getElementById('mission-tokens');
    if (tokenEl) {
      tokenEl.textContent = window.S?.missionTokens?.toLocaleString?.() || tokens;
    }

    // Show toast
    if (typeof toast === 'function') {
      toast(`🎖️ +${tokens} Mission Tokens!`, '#b89bff');
    }

    // Sync to Supabase
    if (this.game && typeof this.game._syncWalletToSupabase === 'function') {
      this.game._syncWalletToSupabase(tokens, 'earn', 'mission_token');
    }
  }

  getMissions() {
    return this.missions;
  }

  getCollectibleCount() {
    return {
      total: this.collectibles.length,
      collected: this.totalCollected,
    };
  }

  clear() {

    for (const c of this.collectibles) {
      c.dispose();
    }
    this.collectibles = [];
    this.missions = [];
    this.totalCollected = 0;
    this.totalReward = 0;
    this.active = false;


    if (this._collectibleGroup.parent) {
      this._collectibleGroup.parent.remove(this._collectibleGroup);
    }
  }

  getStats() {
    return {
      missions: this.missions.length,
      missionsCompleted: this.missions.filter(m => m.status === 'completed').length,
      collectibles: this.collectibles.length,
      collectiblesCollected: this.totalCollected,
      totalReward: this.totalReward,
    };
  }
}


window.MissionManager = MissionManager;
window.Collectible = Collectible;
window.MISSION_TYPES = MISSION_TYPES;
window.COLLECTIBLE_TYPES = COLLECTIBLE_TYPES;
window.EscortMission = EscortMission;
window.ChaseMission = ChaseMission;
window.ParkingMission = ParkingMission;
window.CargoMission = CargoMission;
window.EvasionMission = EvasionMission;
window.CrossingGuardMission = CrossingGuardMission;
window.SidewalkPatrolMission = SidewalkPatrolMission;
window.EmergencyClearMission = EmergencyClearMission;
window.SchoolPatrolMission = SchoolPatrolMission;

// ─── Campaign Manager ───
class CampaignManager {
  constructor(game) {
    this.game = game;
    this.activeCampaign = null;
    this.activeMissionIndex = 0;
    this.campaignProgress = this._loadProgress();
  }

  _loadProgress() {
    try {
      const saved = localStorage.getItem('traffic_campaign_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  _saveProgress() {
    localStorage.setItem('traffic_campaign_progress', JSON.stringify(this.campaignProgress));
  }

  getAvailableCampaigns() {
    if (!window.CAMPAIGNS) return [];
    return window.CAMPAIGNS.filter(c => {
      if (!c.prerequisite) return true;
      const prereq = this.campaignProgress[c.prerequisite];
      return prereq?.completed === true;
    });
  }

  getCampaignProgress(campaignId) {
    if (!window.getCampaignProgress) return null;
    const userData = { campaignProgress: this.campaignProgress };
    return window.getCampaignProgress(userData, campaignId);
  }

  startCampaign(campaignId) {
    const campaign = window.getCampaign?.(campaignId);
    if (!campaign) return false;

    const progress = this.getCampaignProgress(campaignId);
    if (!progress?.unlocked) return false;

    this.activeCampaign = campaign;
    this.activeMissionIndex = progress?.currentMission ? campaign.missions.findIndex(m => m.levelId === progress.currentMission.levelId) : 0;
    
    if (this.activeMissionIndex < 0) this.activeMissionIndex = 0;
    
    // Initialize campaign progress if not exists
    if (!this.campaignProgress[campaignId]) {
      this.campaignProgress[campaignId] = {
        completedMissions: [],
        currentMissionIndex: 0,
        startedAt: Date.now(),
        completed: false
      };
    }
    
    this._saveProgress();
    return true;
  }

  getCurrentMission() {
    if (!this.activeCampaign) return null;
    return this.activeCampaign.missions[this.activeMissionIndex] || null;
  }

  completeCurrentMission(success = true) {
    if (!this.activeCampaign) return false;

    const mission = this.getCurrentMission();
    if (!mission) return false;

    const campaignId = this.activeCampaign.id;
    const progress = this.campaignProgress[campaignId];
    
    if (success) {
      progress.completedMissions.push(mission.levelId);
      progress.currentMissionIndex = this.activeMissionIndex + 1;
      
      // Check if campaign completed
      if (progress.currentMissionIndex >= this.activeCampaign.missions.length) {
        progress.completed = true;
        progress.completedAt = Date.now();
        this._grantCampaignRewards();
        
        if (typeof toast === 'function') {
          toast(`🏆 Campaign Complete: ${this.activeCampaign.name}!`, '#ffd54a');
        }
      }
    }
    
    this._saveProgress();
    return true;
  }

  _grantCampaignRewards() {
    if (!this.activeCampaign?.rewards) return;
    
    const { wallet, xp, badge } = this.activeCampaign.rewards;
    
    if (window.S && wallet) {
      window.S.wallet = (window.S.wallet || 0) + wallet;
      const hw = document.getElementById('hwallet');
      if (hw) hw.textContent = '₹' + window.S.wallet.toLocaleString('en-IN');
    }
    
    if (window.S && xp) {
      window.S.total = (window.S.total || 0) + xp;
    }
    
    if (badge && window.checkAndAwardBadges) {
      const userData = { badges: window.S?.badges || [], campaignProgress: this.campaignProgress };
      const newBadges = window.checkAndAwardBadges(userData);
      if (newBadges.length > 0 && typeof toast === 'function') {
        newBadges.forEach(b => toast(`🏅 New Badge: ${b}`, '#ffd54a'));
      }
    }
    
    if (window.WalletHistory && wallet) {
      window.WalletHistory.earn('campaign_reward', wallet, { campaignId: this.activeCampaign.id });
    }
  }

  nextMission() {
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

  getMissionChainUI(campaignId) {
    const progress = this.getCampaignProgress(campaignId);
    if (!progress) return null;

    return {
      campaign: progress.campaign,
      missions: progress.campaign.missions.map((m, i) => ({
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

window.CampaignManager = CampaignManager;
