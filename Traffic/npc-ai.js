const NPC_STATE = {
  IDLE: 'IDLE',
  FOLLOW_LANE: 'FOLLOW_LANE',
  OVERTAKE: 'OVERTAKE',
  WAIT_SIGNAL: 'WAIT_SIGNAL',
  SIDEWALK_DETOUR: 'SIDEWALK_DETOUR',
  PARK: 'PARK',
  COMPLETE: 'COMPLETE',
  CRASH: 'CRASH',
  PULL_OVER: 'PULL_OVER',
  EMERGENCY_BRAKE: 'EMERGENCY_BRAKE',
  DISTRACTED: 'DISTRACTED',
  ROAD_RAGE: 'ROAD_RAGE'
};

const NPC_PROFILES = {
  normal: {
    name: 'Normal Driver',
    weight: 55,
    aggression: 0.3,
    patience: 0.7,
    signalCompliance: 0.95,
    laneDiscipline: 0.9,
    speedVariance: 0.15,
    overtakeThreshold: 0.6,
    sidewalkProbability: 0.0,
    parkingSkill: 0.8
  },
  aggressive: {
    name: 'Aggressive Driver',
    weight: 15,
    aggression: 0.8,
    patience: 0.3,
    signalCompliance: 0.6,
    laneDiscipline: 0.5,
    speedVariance: 0.35,
    overtakeThreshold: 0.3,
    sidewalkProbability: 0.1,
    parkingSkill: 0.5
  },
  reckless_bike: {
    name: 'Reckless Biker',
    weight: 10,
    aggression: 0.9,
    patience: 0.1,
    signalCompliance: 0.3,
    laneDiscipline: 0.2,
    speedVariance: 0.5,
    overtakeThreshold: 0.15,
    sidewalkProbability: 0.35,
    parkingSkill: 0.2
  },
  rulebreaker: {
    name: 'Rule Breaker',
    weight: 12,
    aggression: 0.6,
    patience: 0.4,
    signalCompliance: 0.25,
    laneDiscipline: 0.3,
    speedVariance: 0.4,
    overtakeThreshold: 0.25,
    sidewalkProbability: 0.25,
    parkingSkill: 0.35
  },
  cautious: {
    name: 'Cautious Driver',
    weight: 8,
    aggression: 0.1,
    patience: 0.9,
    signalCompliance: 0.99,
    laneDiscipline: 0.98,
    speedVariance: 0.08,
    overtakeThreshold: 0.85,
    sidewalkProbability: 0.0,
    parkingSkill: 0.95
  }
};

const PROFILE_KEYS = Object.keys(NPC_PROFILES);
const PROFILE_WEIGHTS = PROFILE_KEYS.map(k => NPC_PROFILES[k].weight);
const TOTAL_WEIGHT = PROFILE_WEIGHTS.reduce((a, b) => a + b, 0);

function pickRandomProfile() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < PROFILE_KEYS.length; i++) {
    r -= PROFILE_WEIGHTS[i];
    if (r <= 0) return PROFILE_KEYS[i];
  }
  return 'normal';
}

class NPCAI {
  constructor(vehicle, roadGraph, trafficManager) {
    this.vehicle = vehicle;
    this.roadGraph = roadGraph;
    this.trafficManager = trafficManager;
    this.profileKey = vehicle.profileKey || pickRandomProfile();
    this.profile = NPC_PROFILES[this.profileKey];
    this.state = NPC_STATE.IDLE;
    this.targetNode = null;
    this.currentEdge = null;
    this.currentLane = 0;
    this.route = [];
    this.routeIndex = 0;
    this.waitTimer = 0;
    this.overtakeTimer = 0;
    this.overtakeTarget = null;
    this.overtakePhase = 0;
    this.sidewalkTimer = 0;
    this.parkingSpot = null;
    this.parkingPhase = 0;
    this.crashTimer = 0;
    this.lastSignalCheck = 0;
    this.signalViolation = false;
    this.laneChangeCooldown = 0;
    this.desiredSpeed = 0;
    this.currentSpeed = 0;
    this.followDistance = 15 + Math.random() * 10;
    this.reactionDelay = 0.1 + Math.random() * 0.3;
    this.reactionTimer = 0;
    this.isRuleBreaker = ['reckless_bike', 'rulebreaker', 'aggressive'].includes(this.profileKey);
    this.behaviorModifiers = {
      hornFrequency: this.profile.aggression * 0.5,
      lightFlashFrequency: this.profile.aggression * 0.3,
      tailgateDistance: (1 - this.profile.patience) * 10 + 5
    };
    // Distracted driving: some NPCs check phones periodically (~1-5% chance per second at 60fps)
    this.distractTimer = 0;
    this.distractChance = this.profileKey === 'normal' ? 0.0003 : this.profileKey === 'cautious' ? 0.0001 : this.profileKey === 'aggressive' ? 0.0008 : 0.0005;
    // Road rage: aggressive NPCs get angry when blocked
    this.rageTimer = 0;
    this.rageLevel = 0; // 0-100, triggers ROAD_RAGE at 100
  }

  setRoute(route) {
    this.route = route || [];
    this.routeIndex = 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this._pickNextTarget();
  }

  _pickNextTarget() {
    if (this.routeIndex < this.route.length) {
      this.targetNode = this.route[this.routeIndex];
      const edge = this.roadGraph.getEdgeTo(this.vehicle.currentNode, this.targetNode);
      if (edge) {
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
      }
    } else {
      this.state = NPC_STATE.COMPLETE;
    }
  }

  _pickInitialLane(edge) {
    const lanes = edge.lanes;
    if (lanes <= 1) return 0;
    if (this.profile.laneDiscipline > 0.8) return 0;
    return Math.floor(Math.random() * lanes);
  }

  update(dt, playerVehicle, signals) {
    this.reactionTimer -= dt;
    this.laneChangeCooldown = Math.max(0, this.laneChangeCooldown - dt);

    switch (this.state) {
      case NPC_STATE.IDLE:
        this._updateIdle(dt);
        break;
      case NPC_STATE.FOLLOW_LANE:
        this._updateFollowLane(dt, playerVehicle, signals);
        break;
      case NPC_STATE.OVERTAKE:
        this._updateOvertake(dt, playerVehicle);
        break;
      case NPC_STATE.WAIT_SIGNAL:
        this._updateWaitSignal(dt, signals);
        break;
      case NPC_STATE.SIDEWALK_DETOUR:
        this._updateSidewalkDetour(dt);
        break;
      case NPC_STATE.PARK:
        this._updatePark(dt);
        break;
      case NPC_STATE.COMPLETE:
        this._updateComplete(dt);
        break;
      case NPC_STATE.CRASH:
        this._updateCrash(dt);
        break;
      case NPC_STATE.PULL_OVER:
        this._updatePullOver(dt);
        break;
      case NPC_STATE.EMERGENCY_BRAKE:
        this._updateEmergencyBrake(dt);
        break;
      case NPC_STATE.DISTRACTED:
        this._updateDistracted(dt);
        break;
      case NPC_STATE.ROAD_RAGE:
        this._updateRoadRage(dt);
        break;
    }

    this._applyPhysics(dt);
    this._checkTransitions(playerVehicle, signals);
    this._checkEmergencyAvoidance(playerVehicle);
  }

  _updateIdle(dt) {
    if (this.route.length > 0) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this._pickNextTarget();
    }
  }

  _updateFollowLane(dt, playerVehicle, signals) {
    if (!this.currentEdge || !this.targetNode) {
      this._advanceRoute();
      return;
    }

    const aheadVehicle = this._getVehicleAhead();
    const signalAhead = this._getSignalAhead(signals);

    if (signalAhead && signalAhead.state === 'red') {
      const distToSignal = this._distanceToSignal(signalAhead);
      if (distToSignal < 25) {
        if (this.profile.signalCompliance < Math.random()) {
          this.signalViolation = true;
          this.state = NPC_STATE.FOLLOW_LANE;
        } else {
          this.state = NPC_STATE.WAIT_SIGNAL;
          this.waitTimer = 0;
        }
        return;
      }
    }

    if (aheadVehicle) {
      const dist = this.vehicle.position.distanceTo(aheadVehicle.position);
      if (dist < this.followDistance) {
        this.desiredSpeed = Math.min(this.desiredSpeed, aheadVehicle.speed * 0.9);
        if (dist < this.followDistance * 0.5 && this.profile.overtakeThreshold > Math.random() && this.laneChangeCooldown <= 0) {
          this._attemptOvertake(aheadVehicle);
          return;
        }
      } else {
        this.desiredSpeed = this._getTargetSpeed();
      }
    } else {
      this.desiredSpeed = this._getTargetSpeed();
    }

    this._steerTowardsTarget(dt);
    this._maintainLane(dt);
  }

  _updateOvertake(dt, playerVehicle) {
    this.overtakeTimer += dt;

    if (this.overtakePhase === 0) {
      this._initiateOvertake();
      this.overtakePhase = 1;
    } else if (this.overtakePhase === 1) {
      this._executeOvertake(dt);
      if (this._overtakeComplete()) {
        this.overtakePhase = 2;
      }
    } else if (this.overtakePhase === 2) {
      this._returnToLane(dt);
      if (this._laneReturnComplete()) {
        this.state = NPC_STATE.FOLLOW_LANE;
        this.overtakeTimer = 0;
        this.overtakeTarget = null;
        this.overtakePhase = 0;
        this.laneChangeCooldown = 3 + Math.random() * 5;
      }
    }

    if (this.overtakeTimer > 10) {
      this._abortOvertake();
    }
  }

  _updateWaitSignal(dt, signals) {
    this.waitTimer += dt;
    const signal = this._getSignalAhead(signals);
    if (signal && signal.state === 'green') {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.waitTimer = 0;
      this.signalViolation = false;
    } else if (this.waitTimer > 30 && this.profile.patience < 0.3) {
      if (Math.random() < 0.02 * dt) {
        this.signalViolation = true;
        this.state = NPC_STATE.FOLLOW_LANE;
      }
    }
  }

  _updateSidewalkDetour(dt) {
    this.sidewalkTimer += dt;
    this.desiredSpeed = this._getTargetSpeed() * 0.4;
    this._steerTowardsTarget(dt);

    if (this.sidewalkTimer > 5 + Math.random() * 10) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.sidewalkTimer = 0;
    }
  }

  _updatePark(dt) {
    if (!this.parkingSpot) {
      this._findParkingSpot();
      return;
    }

    const dist = this.vehicle.position.distanceTo(this.parkingSpot.position);

    switch (this.parkingPhase) {
      case 0:
        this.desiredSpeed = this._getTargetSpeed() * 0.5;
        this._steerTowardsSpot(dt);
        if (dist < 8) this.parkingPhase = 1;
        break;
      case 1:
        this.desiredSpeed = this._getTargetSpeed() * 0.2;
        this._alignForParking(dt);
        if (dist < 3) this.parkingPhase = 2;
        break;
      case 2:
        this.desiredSpeed = 0;
        this.vehicle.velocity.set(0, 0, 0);
        this.parkingPhase = 3;
        break;
      case 3:
        this.state = NPC_STATE.COMPLETE;
        break;
    }
  }

  _updateComplete(dt) {
    this.desiredSpeed = 0;
    this.vehicle.velocity.lerp(new THREE.Vector3(0, 0, 0), 0.1);
  }

  _updateCrash(dt) {
    this.crashTimer += dt;
    this.vehicle.velocity.multiplyScalar(0.95);
    if (this.crashTimer > 5) {
      this._respawn();
    }
  }

  _checkTransitions(playerVehicle, signals) {
    if (this.state === NPC_STATE.CRASH || this.state === NPC_STATE.COMPLETE) return;

    if (this.vehicle.health <= 0) {
      this.state = NPC_STATE.CRASH;
      this.crashTimer = 0;
      return;
    }

    if (this.routeIndex >= this.route.length) {
      if (this.profile.parkingSkill > 0.7 && Math.random() < 0.1) {
        this.state = NPC_STATE.PARK;
        this.parkingPhase = 0;
      } else {
        this.state = NPC_STATE.COMPLETE;
      }
      return;
    }

    const signal = this._getSignalAhead(signals);
    if (signal && signal.state === 'red') {
      const dist = this._distanceToSignal(signal);
      if (dist < 30 && this.state !== NPC_STATE.WAIT_SIGNAL) {
        if (this.profile.signalCompliance >= Math.random()) {
          this.state = NPC_STATE.WAIT_SIGNAL;
        }
      }
    }

    if (this.isRuleBreaker && this.profile.sidewalkProbability > Math.random()) {
      if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < 0.001 * dt) {
        this.state = NPC_STATE.SIDEWALK_DETOUR;
        this.sidewalkTimer = 0;
      }
    }

    // Emergency vehicle response: pull over for ambulances (throttled to every 0.5s)
    this._ambCheckTimer = (this._ambCheckTimer || 0) + dt;
    if (this.state === NPC_STATE.FOLLOW_LANE && this._ambCheckTimer > 0.5) {
      this._ambCheckTimer = 0;
      if (this._isAmbulanceNearby()) {
        this.state = NPC_STATE.PULL_OVER;
        this.pullOverTimer = 0;
        return;
      }
    }

    if (playerVehicle && this._isNearPlayer(playerVehicle)) {
      this._reactToPlayer(playerVehicle);
    }

    // Distracted driving: some NPCs check phones, drift, slow suddenly
    if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < this.distractChance) {
      this.state = NPC_STATE.DISTRACTED;
      this.distractTimer = 0;
    }

    // Road rage: aggressive NPCs get angry when blocked behind slow vehicles
    if (this.state === NPC_STATE.FOLLOW_LANE && this.profile.aggression > 0.5) {
      const ahead = this._getVehicleAhead();
      if (ahead) {
        const dist = this.vehicle.position.distanceTo(ahead.position);
        if (dist < this.followDistance * 0.6 && this.currentSpeed < this.desiredSpeed * 0.5) {
          this.rageLevel = Math.min(100, this.rageLevel + dt * 35);
          if (this.rageLevel >= 100) {
            this.state = NPC_STATE.ROAD_RAGE;
            this.rageTimer = 0;
          }
        } else {
          this.rageLevel = Math.max(0, this.rageLevel - dt * 10);
        }
      }
    }
  }

  _advanceRoute() {
    this.routeIndex++;
    this._pickNextTarget();
  }

  _getVehicleAhead() {
    if (!this.currentEdge) return null;
    const vehicles = this.trafficManager.getVehiclesOnEdge(this.currentEdge.id);
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    let closest = null, minDist = Infinity;
    vehicles.forEach(v => {
      if (v === this.vehicle) return;
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      const proj = toV.dot(forward);
      if (proj > 0 && proj < minDist) {
        minDist = proj;
        closest = v;
      }
    });
    return closest;
  }

  _getSignalAhead(signals) {
    if (!this.currentEdge) return null;
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    let closest = null, minDist = Infinity;
    signals.forEach(s => {
      const toS = new THREE.Vector3().subVectors(s.position, this.vehicle.position);
      const proj = toS.dot(forward);
      if (proj > 0 && proj < 100 && proj < minDist) {
        minDist = proj;
        closest = s;
      }
    });
    return closest;
  }

  _distanceToSignal(signal) {
    return this.vehicle.position.distanceTo(signal.position);
  }



  _steerTowardsTarget(dt) {
    if (!this.targetNode) return;
    const targetPos = this.targetNode.position.clone();
    targetPos.y = this.vehicle.position.y;
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
    const dist = toTarget.length();
    if (dist < 5) {
      this._advanceRoute();
      return;
    }
    const desiredDir = toTarget.normalize();
    const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    const maxTurn = this.vehicle.stats.turn * dt * 60;
    const clampedAngle = THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
    this.vehicle.rotation.y += clampedAngle;
  }

  _maintainLane(dt) {
    if (!this.currentEdge) return;
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, this.vehicle.routeProgress);
    const toCenter = new THREE.Vector3().subVectors(laneCenter, this.vehicle.position);
    toCenter.y = 0;
    const offset = toCenter.length();
    if (offset > 1.5) {
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const correction = right.dot(toCenter.normalize()) * dt * 2;
      this.vehicle.rotation.y += correction;
    }
  }

  _attemptOvertake(vehicle) {
    if (!this.currentEdge || this.currentEdge.lanes < 2) return;
    const currentLane = this.currentLane;
    const targetLane = currentLane === 0 ? 1 : 0;
    if (this._isLaneClear(targetLane, vehicle)) {
      this.state = NPC_STATE.OVERTAKE;
      this.overtakeTarget = vehicle;
      this.overtakeTimer = 0;
      this.overtakePhase = 0;
    }
  }

  _isLaneClear(lane, ignoreVehicle) {
    if (!this.currentEdge) return false;
    const vehicles = this.trafficManager.getVehiclesOnEdge(this.currentEdge.id);
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    return !vehicles.some(v => {
      if (v === this.vehicle || v === ignoreVehicle) return false;
      if (v.currentLane !== lane) return false;
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      return toV.dot(forward) > -5 && toV.dot(forward) < 30;
    });
  }

  _initiateOvertake() {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
  }

  _executeOvertake(dt) {
    this.desiredSpeed = this._getTargetSpeed() * 1.3;
    this._maintainLane(dt);
  }

  _overtakeComplete() {
    if (!this.overtakeTarget) return true;
    const toTarget = new THREE.Vector3().subVectors(this.overtakeTarget.position, this.vehicle.position);
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    return toTarget.dot(forward) < -5;
  }

  _returnToLane(dt) {
    this.desiredSpeed = this._getTargetSpeed();
    this._maintainLane(dt);
  }

  _laneReturnComplete() {
    if (!this.currentEdge) return true;
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, this.vehicle.routeProgress);
    return this.vehicle.position.distanceTo(laneCenter) < 1;
  }

  _abortOvertake() {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this.overtakeTimer = 0;
    this.overtakeTarget = null;
    this.overtakePhase = 0;
    this.laneChangeCooldown = 5;
  }

  _findParkingSpot() {
    const spots = this.trafficManager.getAvailableParkingSpots(this.vehicle.position, 50);
    if (spots.length > 0) {
      this.parkingSpot = spots[0];
    } else {
      this.state = NPC_STATE.COMPLETE;
    }
  }

  _steerTowardsSpot(dt) {
    if (!this.parkingSpot) return;
    const toSpot = new THREE.Vector3().subVectors(this.parkingSpot.position, this.vehicle.position);
    toSpot.y = 0;
    const desiredDir = toSpot.normalize();
    const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    const maxTurn = this.vehicle.stats.turn * dt * 60 * 0.5;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
  }

  _alignForParking(dt) {
    if (!this.parkingSpot) return;
    const targetRot = this.parkingSpot.rotation;
    const diff = targetRot - this.vehicle.rotation.y;
    const maxTurn = this.vehicle.stats.turn * dt * 60 * 0.3;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);
  }

  _isNearPlayer(player) {
    return this.vehicle.position.distanceTo(player.position) < 30;
  }

  _honk() {
    if (this.trafficManager.audio && this.vehicle.hornSound) {
      this.trafficManager.audio.playHorn(this.vehicle.hornSound, this.vehicle.position);
    }
  }

  _flashLights() {
    this.vehicle.flashHighBeams = true;
    setTimeout(() => { this.vehicle.flashHighBeams = false; }, 200);
  }

  // ── Emergency Vehicle Response: Pull Over for ambulances ──
  _updatePullOver(dt) {
    this.pullOverTimer = (this.pullOverTimer || 0) + dt;
    // Steer toward the curb (right side of the road)
    if (this.currentEdge) {
      const curbPos = this.currentEdge.getLaneCenter(0, this.vehicle.routeProgress);
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const targetPos = curbPos.clone().addScaledVector(right, -3);
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
      toTarget.y = 0;
      if (toTarget.length() > 0.5) {
        const desiredDir = toTarget.normalize();
        const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
        const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
        this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -this.vehicle.stats.turn * dt * 60 * 0.5, this.vehicle.stats.turn * dt * 60 * 0.5);
      }
    }
    this.desiredSpeed = 0;
    this.currentSpeed *= 0.92;
    // Resume after ambulance passes or 8 seconds
    if (this.pullOverTimer > 8 || !this._isAmbulanceNearby()) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.pullOverTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  // ── Distracted Driving: Some NPCs check phones, drift, slow suddenly ──
  _updateDistracted(dt) {
    this.distractTimer += dt;
    // Drift slightly while distracted
    this.vehicle.rotation.y += (Math.random() - 0.5) * 0.003;
    // Slow down significantly
    this.desiredSpeed *= 0.5;
    this.currentSpeed *= 0.97;
    // Resume after 2-5 seconds
    if (this.distractTimer > 2 + Math.random() * 3) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.distractTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  // ── Road Rage: Aggressive NPCs tailgate, honk, flash lights ──
  _updateRoadRage(dt) {
    this.rageTimer += dt;
    // Aggressive acceleration toward target
    this.desiredSpeed = this._getTargetSpeed() * 1.2;
    // Honk frequently
    if (this.rageTimer % 1.5 < dt) this._honk();
    // Flash lights
    if (this.rageTimer % 2 < dt) this._flashLights();
    // Tailgate closely
    this.followDistance = 5;
    // Calm down after 6 seconds
    if (this.rageTimer > 6) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.rageTimer = 0;
      this.rageLevel = 0;
      this.followDistance = 15 + Math.random() * 10;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  _isAmbulanceNearby() {
    if (!this.trafficManager || !this.trafficManager.vehicles) return false;
    const myPos = this.vehicle.position;
    for (const v of this.trafficManager.vehicles) {
      if (v === this.vehicle) continue;
      if (v.userData && v.userData.isAmb && v.position.distanceTo(myPos) < 80) {
        // Check if ambulance is behind us (coming toward us)
        const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
        const toAmb = new THREE.Vector3().subVectors(v.position, myPos);
        if (toAmb.dot(forward) < 0) return true; // Ambulance is behind us
      }
    }
    return false;
  }

  // ── Emergency Brake: React to sudden obstacles ──
  _updateEmergencyBrake(dt) {
    this.emergencyBrakeTimer = (this.emergencyBrakeTimer || 0) + dt;
    this.currentSpeed *= 0.85; // Hard deceleration
    this.desiredSpeed = 0;
    if (this.vehicle.brakeLights) this.vehicle.brakeLights.intensity = 3;
    // Resume after stopping or 3 seconds
    if (this.currentSpeed < 0.5 || this.emergencyBrakeTimer > 3) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.emergencyBrakeTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  // ── Emergency Avoidance: Check for imminent collisions ──
  _checkEmergencyAvoidance(playerVehicle) {
    if (this.state === NPC_STATE.CRASH || this.state === NPC_STATE.EMERGENCY_BRAKE) return;
    if (this.currentSpeed < 3) return; // Only check at meaningful speed
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const myPos = this.vehicle.position;
    const checkRadius = 12;
    if (playerVehicle) {
      const toPlayer = new THREE.Vector3().subVectors(playerVehicle.position, myPos);
      const dist = toPlayer.length();
      if (dist < checkRadius) {
        const proj = toPlayer.dot(forward);
        const lateralOffset = Math.abs(toPlayer.x * forward.z - toPlayer.z * forward.x);
        if (proj > 0 && proj < 10 && dist < 8 && lateralOffset < 2.5) {
          this.state = NPC_STATE.EMERGENCY_BRAKE;
          this.emergencyBrakeTimer = 0;
          return;
        }
      }
    }
    // Check NPC vehicles — only iterate if any are within checkRadius
    if (this.trafficManager && this.trafficManager.vehicles) {
      for (const v of this.trafficManager.vehicles) {
        if (v === this.vehicle) continue;
        const toV = new THREE.Vector3().subVectors(v.position, myPos);
        const dist = toV.length();
        if (dist > checkRadius) continue; // Early exit for distant vehicles
        const proj = toV.dot(forward);
        if (proj > 0 && proj < 8 && dist < 6 && Math.abs(toV.x * forward.z - toV.z * forward.x) < 2) {
          this.state = NPC_STATE.EMERGENCY_BRAKE;
          this.emergencyBrakeTimer = 0;
          this._honk();
          return;
        }
      }
    }
  }

  // ── Enhanced Player Interaction: Swerve, honk, brake ──
  _reactToPlayer(player) {
    const dist = this.vehicle.position.distanceTo(player.position);
    const aggression = this.profile.aggression;

    // Aggressive NPCs honk when player is too close
    if (aggression > 0.5 && dist < 15 && Math.random() < 0.02) {
      this._honk();
    }

    // All NPCs brake when player cuts them off
    if (dist < 12 && this.currentSpeed > 2) {
      const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const proj = toPlayer.dot(forward);
      if (proj > 0 && proj < 10) {
        // Player is ahead and close — slow down
        this.desiredSpeed = Math.min(this.desiredSpeed, this.currentSpeed * 0.5);
      }
    }

    // Aggressive NPCs swerve around slow players
    if (aggression > 0.6 && dist < 20 && this.currentSpeed > 3) {
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const lateral = right.dot(toPlayer);
      if (Math.abs(lateral) < 3 && Math.random() < 0.005) {
        // Nudge away from player
        this.vehicle.rotation.y += (lateral > 0 ? -1 : 1) * 0.02;
      }
    }

    // Cautious NPCs brake early when player approaches
    if (aggression < 0.2 && dist < 25 && Math.random() < 0.01) {
      this.desiredSpeed *= 0.8;
    }
  }

  // ── Weather-Affected Driving: Slow down in rain ──
  _getTargetSpeed() {
    const baseSpeed = this.currentEdge ? this.currentEdge.speedLimit / 3.6 : 10;
    const variance = (Math.random() - 0.5) * 2 * this.profile.speedVariance * baseSpeed;
    let speed = Math.max(2, baseSpeed + variance);
    // Rain/night penalties via trafficManager reference (avoids fragile gameRef chain)
    const tm = this.trafficManager;
    if (tm && tm.game) {
      const cfg = tm.game.mapCfg;
      if (cfg) {
        if (cfg.hasRain || cfg.hasPuddles) speed *= (0.65 + Math.random() * 0.15);
        if (cfg.isNight) speed *= 0.85;
      }
    }
    return speed;
  }

  _applyPhysics(dt) {
    const accel = this.vehicle.stats.accel * dt * 60;
    const fric = this.vehicle.stats.fric;
    const maxSpd = this.desiredSpeed;

    if (this.currentSpeed < maxSpd) {
      this.currentSpeed = Math.min(maxSpd, this.currentSpeed + accel);
    } else {
      this.currentSpeed = Math.max(maxSpd, this.currentSpeed * fric);
    }

    const forward = new THREE.Vector3(
      Math.sin(this.vehicle.rotation.y),
      0,
      Math.cos(this.vehicle.rotation.y)
    );
    this.vehicle.velocity.copy(forward).multiplyScalar(this.currentSpeed);
    this.vehicle.position.addScaledVector(this.vehicle.velocity, dt);
    this.vehicle.routeProgress += this.currentSpeed * dt / (this.currentEdge?.length || 100);
  }

  _respawn() {
    this.vehicle.health = 100;
    this.vehicle.position.set(0, 0.5, 0);
    this.vehicle.velocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.state = NPC_STATE.IDLE;
    this.routeIndex = 0;
    this.crashTimer = 0;
  }

  getDebugInfo() {
    return {
      state: this.state,
      profile: this.profileKey,
      speed: this.currentSpeed.toFixed(1),
      targetSpeed: this.desiredSpeed.toFixed(1),
      lane: this.currentLane,
      routeProgress: this.routeIndex + '/' + this.route.length,
      violations: this.signalViolation ? 'Signal Jump' : 'None'
    };
  }
}

window.NPC_STATE = NPC_STATE;
window.NPC_PROFILES = NPC_PROFILES;
window.NPCAI = NPCAI;
window.pickRandomProfile = pickRandomProfile;