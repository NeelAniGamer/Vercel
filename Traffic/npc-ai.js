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
  ROAD_RAGE: 'ROAD_RAGE',
  BUS_STOP: 'BUS_STOP',
  YIELD: 'YIELD'
};

const NPC_PROFILES = {
  normal: {
    name: 'Normal Driver',
    weight: 55,
    aggression: 0.3,
    patience: 0.7,
    signalCompliance: 0.95,
    laneDiscipline: 0.95,
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
    laneDiscipline: 0.7,
    speedVariance: 0.35,
    overtakeThreshold: 0.3,
    sidewalkProbability: 0.0,
    parkingSkill: 0.5
  },
  reckless_bike: {
    name: 'Reckless Biker',
    weight: 10,
    aggression: 0.9,
    patience: 0.1,
    signalCompliance: 0.3,
    laneDiscipline: 0.6,
    speedVariance: 0.5,
    overtakeThreshold: 0.15,
    sidewalkProbability: 0.0,
    parkingSkill: 0.2
  },
  rulebreaker: {
    name: 'Rule Breaker',
    weight: 12,
    aggression: 0.6,
    patience: 0.4,
    signalCompliance: 0.25,
    laneDiscipline: 0.65,
    speedVariance: 0.4,
    overtakeThreshold: 0.25,
    sidewalkProbability: 0.0,
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
  },
  teen: {
    name: 'Teen Driver',
    weight: 6,
    aggression: 0.7,
    patience: 0.2,
    signalCompliance: 0.4,
    laneDiscipline: 0.7,
    speedVariance: 0.45,
    overtakeThreshold: 0.2,
    sidewalkProbability: 0.0,
    parkingSkill: 0.3
  },
  elderly: {
    name: 'Elderly Driver',
    weight: 5,
    aggression: 0.05,
    patience: 0.95,
    signalCompliance: 0.98,
    laneDiscipline: 0.92,
    speedVariance: 0.1,
    overtakeThreshold: 0.95,
    sidewalkProbability: 0.0,
    parkingSkill: 0.7
  },
  delivery: {
    name: 'Delivery Driver',
    weight: 6,
    aggression: 0.75,
    patience: 0.15,
    signalCompliance: 0.35,
    laneDiscipline: 0.7,
    speedVariance: 0.3,
    overtakeThreshold: 0.15,
    sidewalkProbability: 0.0,
    parkingSkill: 0.4
  },
  tourist: {
    name: 'Tourist Driver',
    weight: 4,
    aggression: 0.2,
    patience: 0.6,
    signalCompliance: 0.85,
    laneDiscipline: 0.8,
    speedVariance: 0.2,
    overtakeThreshold: 0.7,
    sidewalkProbability: 0.0,
    parkingSkill: 0.3
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
    this.profileKey = (vehicle.profileKey && NPC_PROFILES[vehicle.profileKey]) ? vehicle.profileKey : pickRandomProfile();
    this.profile = NPC_PROFILES[this.profileKey] || NPC_PROFILES.normal;
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
    const p = this.profile || NPC_PROFILES.normal;
    this.behaviorModifiers = {
      hornFrequency: p.aggression * 0.5,
      lightFlashFrequency: p.aggression * 0.3,
      tailgateDistance: (1 - p.patience) * 10 + 5
    };

    this.distractTimer = 0;
    this.distractChance = this.profileKey === 'normal' ? 0.0003 : this.profileKey === 'cautious' ? 0.0001 : this.profileKey === 'aggressive' ? 0.0008 : 0.0005;

    this.rageTimer = 0;
    this.rageLevel = 0;

    // Fixed speed variance per vehicle to eliminate per-frame speed jitter
    this._speedVarianceOffset = (Math.random() - 0.5) * 2 * (this.profile?.speedVariance || 0.15);

    // Stuck detection
    this._stuckCheckTimer = 0;
    this._stuckTimer = 0;
    this._stuckLastX = 0;
    this._stuckLastZ = 0;
  }

  init() {}

  setRoute(route) {
    this.route = route || [];
    this.routeIndex = 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this._pickNextTarget();
  }

  _pickNextTarget() {
    if (this.route && this.route.length > 0 && this.routeIndex < this.route.length) {
      this.targetNode = this.route[this.routeIndex];
      let edge = null;
      if (this.vehicle.currentNode && this.roadGraph) {
        edge = this.roadGraph.getEdgeTo(this.vehicle.currentNode, this.targetNode);
      }
      if (edge) {
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
        this.vehicle.routeProgress = 0;
        return;
      }
    }

    // Connect to adjacent node if available
    if (this.vehicle.currentNode && this.vehicle.currentNode.neighbors && this.vehicle.currentNode.neighbors.length > 0) {
      const neighbors = this.vehicle.currentNode.neighbors;
      const nb = neighbors[Math.floor(Math.random() * neighbors.length)];
      const edge = this.roadGraph ? this.roadGraph.getEdgeTo(this.vehicle.currentNode, nb) : null;
      if (edge) {
        this.targetNode = nb;
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
        this.vehicle.routeProgress = 0;
        this.state = NPC_STATE.FOLLOW_LANE;
        return;
      }
    }

    if (this.trafficManager && this.trafficManager._assignRoute) {
      if (this.trafficManager._assignRoute(this.vehicle)) {
        return;
      }
    }

    this.state = NPC_STATE.COMPLETE;
  }

  _advanceRoute() {
    this.routeIndex++;
    if (this.targetNode) {
      this.vehicle.currentNode = this.targetNode;
    }
    this._pickNextTarget();
  }

  _getVehicleAhead() {
    if (!this.trafficManager || !this.vehicle) return null;
    const myPos = this.vehicle.position;
    if (!myPos) return null;
    const myForward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const right = new THREE.Vector3(Math.cos(this.vehicle.rotation.y), 0, -Math.sin(this.vehicle.rotation.y));
    let closestVeh = null;
    let closestDist = Infinity;
    const maxCheckDist = 40;

    // Check other NPC vehicles
    const vehicles = this.trafficManager.vehicles || [];
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v || v === this.vehicle || !v.position) continue;
      const dx = v.position.x - myPos.x;
      const dz = v.position.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > maxCheckDist || dist >= closestDist) continue;

      const forwardDot = (dx * myForward.x + dz * myForward.z) / (dist || 1);
      if (forwardDot > 0.60) {
        const lateral = Math.abs(dx * right.x + dz * right.z);
        // Heading alignment check: are we driving in the same general direction?
        const vRot = v.rotation ? v.rotation.y : (v.mesh ? v.mesh.rotation.y : 0);
        const vForwardX = Math.sin(vRot), vForwardZ = Math.cos(vRot);
        const headingDot = myForward.x * vForwardX + myForward.z * vForwardZ;

        // Same-lane trailing vehicle: narrow lateral check to 1.4m so parallel lane cars never brake
        if (headingDot > 0.4 && lateral < 1.4) {
          closestDist = dist;
          closestVeh = v;
        } else if (dist < 3.2 && lateral < 1.5 && Math.abs(headingDot) < 0.4) {
          // Cross-traffic at intersection: only yield if other vehicle is already ahead or faster
          const mySpd = this.currentSpeed || 0;
          const otherSpd = v.npcAI?.currentSpeed || v.speed || 0;
          if (otherSpd >= mySpd || (this._stuckTimer || 0) < 1.5) {
            closestDist = dist;
            closestVeh = v;
          }
        }
      }
    }

    // Check player vehicle
    const p = this.trafficManager.game?.playerVehicle || this.trafficManager.game?.player;
    if (p && p.position && p !== this.vehicle) {
      const dx = p.position.x - myPos.x;
      const dz = p.position.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= maxCheckDist && dist < closestDist) {
        const forwardDot = (dx * myForward.x + dz * myForward.z) / (dist || 1);
        if (forwardDot > 0.60) {
          const lateral = Math.abs(dx * right.x + dz * right.z);
          // Check player only in our direct lane path
          if (lateral < 1.6) {
            closestDist = dist;
            closestVeh = p;
          }
        }
      }
    }

    return closestVeh;
  }

  _getSignalAhead(signals) {
    if (!signals || !signals.length || !this.vehicle || !this.vehicle.position) return null;
    const myPos = this.vehicle.position;
    const myForward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    let nearestSignal = null;
    let nearestDist = Infinity;

    for (let i = 0; i < signals.length; i++) {
      const sig = signals[i];
      const pos = sig.pos || sig.position || sig.mesh?.position;
      if (!pos) continue;
      const dx = pos.x - myPos.x;
      const dz = pos.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 35 || dist >= nearestDist) continue;
      const forwardDot = (dx * myForward.x + dz * myForward.z) / (dist || 1);
      if (forwardDot > 0.5) {
        nearestDist = dist;
        nearestSignal = sig;
      }
    }
    return nearestSignal;
  }

  _distanceToSignal(signal) {
    if (!signal || !this.vehicle || !this.vehicle.position) return Infinity;
    const pos = signal.pos || signal.position || signal.mesh?.position;
    if (!pos) return Infinity;
    const dx = pos.x - this.vehicle.position.x;
    const dz = pos.z - this.vehicle.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  _pickInitialLane(edge) {
    const lanes = edge.lanes || 1;
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
      case NPC_STATE.BUS_STOP:
        this._updateBusStop(dt);
        break;
      case NPC_STATE.YIELD:
        this._updateYield(dt, playerVehicle);
        break;
    }

    // Bus-type vehicles check for approaching bus stops
    if (this.state === NPC_STATE.FOLLOW_LANE && this.vehicle?.userData?.type === 'bus') {
      this._checkBusStop();
    }

    this._applyPhysics(dt);
    this._checkTransitions(playerVehicle, signals, dt);
    this._checkEmergencyAvoidance(playerVehicle);

    // ── High-Reliability Anti-Deadlock & Stuck Detection ──
    // Never allow an NPC to remain permanently frozen at intersections or signals
    const isExempt = (this.state === NPC_STATE.PARK || this.state === NPC_STATE.CRASH || this.state === NPC_STATE.COMPLETE);
    const isWaitingValidSignal = (this.state === NPC_STATE.WAIT_SIGNAL && this.waitTimer < 5.0);

    if (!isExempt && !isWaitingValidSignal && this.vehicle && this.vehicle.position) {
      this._stuckCheckTimer += dt;
      if (this._stuckCheckTimer >= 1.5) {
        this._stuckCheckTimer = 0;
        const vx = this.vehicle.position.x, vz = this.vehicle.position.z;
        const moved = Math.hypot(vx - (this._stuckLastX || vx), vz - (this._stuckLastZ || vz));
        if (moved < 0.8) {
          this._stuckTimer = (this._stuckTimer || 0) + 1.5;
        } else {
          this._stuckTimer = 0;
        }
        this._stuckLastX = vx;
        this._stuckLastZ = vz;

        const playerPos = this.trafficManager?.game?.player?.position;
        const distToPlayer = playerPos ? Math.hypot(vx - playerPos.x, vz - playerPos.z) : 100;

        // Phase 1: Smooth un-stuck recovery (at 3.5s) — nudge lane and resume driving
        if (this._stuckTimer >= 3.5 && this._stuckTimer < 8.0) {
          this.state = NPC_STATE.FOLLOW_LANE;
          this.waitTimer = 0;
          this.signalViolation = false;
          this._committedToIntersection = true;
          if (this.route && this.route.length > 0 && this.routeIndex < this.route.length - 1) {
            this.routeIndex++;
            this._pickNextTarget();
          }
          this.desiredSpeed = Math.max(5.0, this._getTargetSpeed ? this._getTargetSpeed() : 7.0);
          this.currentSpeed = Math.max(this.currentSpeed, 3.5);
        } else if (this._stuckTimer >= 8.0) {
          // Phase 2: If far away from player, quietly recycle. If near player, smoothly advance without teleporting.
          if (distToPlayer > 90) {
            this._stuckTimer = 0;
            this._respawn();
          } else {
            // Near player: force lane nudge and continue driving
            this._stuckTimer = 0;
            this.state = NPC_STATE.FOLLOW_LANE;
            this._committedToIntersection = true;
            this.desiredSpeed = 6.0;
            this.currentSpeed = 4.0;
          }
        }
      }
    }
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

    const aheadVehicle = (typeof this._getVehicleAhead === 'function') ? this._getVehicleAhead() : null;
    const signalAhead = (typeof this._getSignalAhead === 'function') ? this._getSignalAhead(signals) : null;

    // 1. Red Signal Detection & Braking (stop-line aware)
    if (signalAhead && signalAhead.state === 'red') {
      const distToSignal = this._distanceToSignal(signalAhead);
      // Stop line is 8m before the signal position.
      // If NPC is already past the stop line (dist < 8m) → committed, continue through.
      if (this._committedToIntersection) {
        // Already committed — keep going until well past signal
        if (distToSignal > 12) this._committedToIntersection = false;
        // fall through to normal driving below
      } else if (distToSignal < 8) {
        // Just crossed the stop line as it turned red → commit and continue
        this._committedToIntersection = true;
        // fall through — don't brake
      } else if (distToSignal < 24) {
        if (this.profile.signalCompliance < Math.random() && this.isRuleBreaker) {
          this.signalViolation = true;
          this.state = NPC_STATE.FOLLOW_LANE;
        } else {
          this.desiredSpeed = 0;
          if (distToSignal < 9) {
            this._committedToIntersection = false;
            this.state = NPC_STATE.WAIT_SIGNAL;
            this.waitTimer = 0;
            this.currentSpeed *= 0.75;
          }
          return;
        }
      }
    } else {
      // Signal is green or no signal — clear committed flag
      if (this._committedToIntersection) this._committedToIntersection = false;
    }


    // 2. Lead Vehicle Detection, Follow Distance & Safe Queueing
    if (aheadVehicle) {
      const dist = this.vehicle.position.distanceTo(aheadVehicle.position);
      const isHeavy = this.vehicle.userData?.type === 'bus' || this.vehicle.userData?.type === 'truck';
      const stopBuffer = isHeavy ? 4.2 : 3.0;
      const leadSpd = aheadVehicle.npcAI?.currentSpeed || aheadVehicle.speed || 0;

      if (dist < stopBuffer && leadSpd < 0.2) {
        // Complete stop behind the stationary vehicle ahead
        this.desiredSpeed = 0;
        this.currentSpeed *= 0.7;
      } else if (dist < this.followDistance) {
        // Match lead vehicle speed with smooth acceleration
        const targetFollowSpeed = leadSpd > 0.5 ? Math.max(2.5, leadSpd) : (dist > stopBuffer ? 2.0 : 0);
        const distRatio = Math.max(0.1, (dist - stopBuffer) / Math.max(1, this.followDistance - stopBuffer));
        this.desiredSpeed = Math.min(this._getTargetSpeed(), targetFollowSpeed * distRatio);

        // If stopped or crawling and road has multiple lanes, evaluate on-road overtake
        if (dist < this.followDistance * 0.65 && this.laneChangeCooldown <= 0 && this.profile.overtakeThreshold > 0.15) {
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
        this.laneChangeCooldown = 4 + Math.random() * 4;
      }
    }

    if (this.overtakeTimer > 10) {
      this._abortOvertake();
    }
  }

  _updateWaitSignal(dt, signals) {
    this.waitTimer += dt;
    this.desiredSpeed = 0;
    const signal = this._getSignalAhead(signals);
    // If no signal ahead, or signal is green, or red phase expired (max red is 4.0s in game_core)
    if (!signal || signal.state === 'green' || this.waitTimer > 4.5) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.waitTimer = 0;
      this.signalViolation = false;
    } else if (this.waitTimer > 3.0 && this.profile.patience < 0.4) {
      this.signalViolation = true;
      this.state = NPC_STATE.FOLLOW_LANE;
    }
  }

  _updateSidewalkDetour(dt) {
    // Sidewalk detours disabled - return to road lane immediately
    this.state = NPC_STATE.FOLLOW_LANE;
    this.sidewalkTimer = 0;
  }

  _updatePark(dt) {
    this.desiredSpeed = 0;
    this.currentSpeed *= 0.8;
  }

  _updateComplete(dt) {
    this.desiredSpeed = 0;
    this._respawn();
  }

  _updateCrash(dt) {
    this.desiredSpeed = 0;
    this.currentSpeed = 0;
    if (!this.crashTimer) this.crashTimer = 0;
    this.crashTimer += dt;
    if (this.crashTimer > 6) {
      this.crashTimer = 0;
      this._respawn();
    }
  }

  _updateYield(dt, playerVehicle) {
    this.desiredSpeed = 0;
    this.currentSpeed *= Math.pow(0.75, dt * 60);
    const p = playerVehicle || (this.trafficManager?.game?.playerVehicle || this.trafficManager?.game?.player);
    if (!p || !p.position || this.vehicle.position.distanceTo(p.position) > 16) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.desiredSpeed = this._getTargetSpeed ? this._getTargetSpeed() : 6;
    }
    this._steerTowardsTarget(dt);
    this._maintainLane(dt);
  }

  _checkTransitions(playerVehicle, signals, dt) {
    if (playerVehicle) {
      this._reactToPlayer(playerVehicle);
    }
    if (this.state === NPC_STATE.FOLLOW_LANE && this._isAmbulanceNearby()) {
      this.state = NPC_STATE.PULL_OVER;
    }
  }

  _steerTowardsTarget(dt) {
    if (!this.targetNode) return;
    const targetPos = this.targetNode.position.clone();
    targetPos.y = this.vehicle.position.y;
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
    toTarget.y = 0;
    const dist = toTarget.length();
    if (dist < 5.0) {
      this._advanceRoute();
      return;
    }

    // Look ahead along active lane spline for smooth arc turning
    let lookTarget = targetPos;
    if (this.currentEdge) {
      const progress = Math.min(1.0, (this.vehicle.routeProgress || 0) + 0.12);
      const lanePoint = this.currentEdge.getLaneCenter(this.currentLane, progress);
      if (lanePoint) lookTarget = lanePoint;
    }

    const toWaypoint = new THREE.Vector3().subVectors(lookTarget, this.vehicle.position);
    toWaypoint.y = 0;
    const desiredHeading = Math.atan2(toWaypoint.x, toWaypoint.z);
    let diff = desiredHeading - this.vehicle.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const maxTurn = (this.vehicle.stats?.turn || 0.05) * dt * 60 * 1.5;
    const clampedAngle = THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);
    this.vehicle.rotation.y += clampedAngle;
  }

  _maintainLane(dt) {
    if (!this.currentEdge) return;
    const progress = Math.max(0, Math.min(1, this.vehicle.routeProgress || 0));
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, progress);
    if (!laneCenter) return;

    // Smooth exponential convergence towards lane center (zero-jitter, framerate independent)
    const toCenter = new THREE.Vector3().subVectors(laneCenter, this.vehicle.position);
    toCenter.y = 0;
    const lateralOffset = toCenter.length();
    if (lateralOffset > 0.02) {
      const blend = 1 - Math.exp(-dt * 4.5);
      this.vehicle.position.x += toCenter.x * blend;
      this.vehicle.position.z += toCenter.z * blend;
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
      return toV.dot(forward) > -8 && toV.dot(forward) < 32;
    });
  }

  _initiateOvertake() {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
  }

  _executeOvertake(dt) {
    this.desiredSpeed = this._getTargetSpeed() * 1.25;
    this._maintainLane(dt);
  }

  _overtakeComplete() {
    if (!this.overtakeTarget) return true;
    const toTarget = new THREE.Vector3().subVectors(this.overtakeTarget.position, this.vehicle.position);
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    return toTarget.dot(forward) < -6;
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
    let angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    const maxTurn = (this.vehicle.stats?.turn || 0.05) * dt * 60 * 0.5;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
  }

  _alignForParking(dt) {
    if (!this.parkingSpot) return;
    const targetRot = this.parkingSpot.rotation;
    let diff = targetRot - this.vehicle.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = (this.vehicle.stats?.turn || 0.05) * dt * 60 * 0.3;
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


  _updatePullOver(dt) {
    this.pullOverTimer = (this.pullOverTimer || 0) + dt;

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
        let angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -this.vehicle.stats.turn * dt * 60 * 0.5, this.vehicle.stats.turn * dt * 60 * 0.5);
      }
    }
    this.desiredSpeed = 0;
    this.currentSpeed *= 0.92;

    if (this.pullOverTimer > 8 || !this._isAmbulanceNearby()) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.pullOverTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }


  _updateDistracted(dt) {
    this.distractTimer += dt;

    this.vehicle.rotation.y += (Math.random() - 0.5) * 0.003;

    this.desiredSpeed *= 0.5;
    this.currentSpeed *= 0.97;

    if (this.distractTimer > 2 + Math.random() * 3) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.distractTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }


  _updateRoadRage(dt) {
    this.rageTimer += dt;

    this.desiredSpeed = this._getTargetSpeed() * 1.2;

    if (this.rageTimer % 1.5 < dt) this._honk();

    if (this.rageTimer % 2 < dt) this._flashLights();

    this.followDistance = 5;

    if (this.rageTimer > 6) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.rageTimer = 0;
      this.rageLevel = 0;
      this.followDistance = 15 + Math.random() * 10;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  // ── BUS STOP LOGIC ──────────────────────────────────────────────────────────

  _checkBusStop() {
    if (!this.vehicle || !this.vehicle.position) return;
    const stops = this.trafficManager?.game?.busStops;
    if (!stops || !stops.length) return;
    if (this._busStopCooldowns == null) this._busStopCooldowns = {};

    const myPos = this.vehicle.position;
    const myFwd = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));

    for (let i = 0; i < stops.length; i++) {
      const bs = stops[i];
      if (this._busStopCooldowns[i]) continue; // already visited this stop recently
      const dx = bs.x - myPos.x, dz = bs.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 18) continue;
      const fwd = (dx * myFwd.x + dz * myFwd.z) / (dist || 1);
      if (fwd < 0.3) continue; // stop is behind us

      // Approaching bus stop — begin docking
      this._currentBusStopIdx = i;
      this._busStopTimer = 0;
      this._busStopDuration = 5 + Math.random() * 4; // 5-9 seconds
      this._busStopCooldowns[i] = true;
      setTimeout(() => { if (this._busStopCooldowns) this._busStopCooldowns[i] = false; }, 90000); // re-enable after 90s
      this.state = NPC_STATE.BUS_STOP;
      this._busPassengers = [];
      this._passengerSpawned = false;
      return;
    }
  }

  _updateBusStop(dt) {
    this._busStopTimer += dt;
    this.desiredSpeed = 0;
    this.currentSpeed = Math.max(0, this.currentSpeed - 4 * dt); // decelerate

    // Spawn passengers at 1.5s mark
    if (!this._passengerSpawned && this._busStopTimer >= 1.5) {
      this._passengerSpawned = true;
      this._spawnBusPassengers();
    }

    // Clear passengers at 75% of dwell time
    if (this._passengerSpawned && this._busStopTimer >= this._busStopDuration * 0.75) {
      this._despawnBusPassengers();
    }

    // Resume after full dwell time
    if (this._busStopTimer >= this._busStopDuration) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.desiredSpeed = this._getTargetSpeed ? this._getTargetSpeed() : 6;
    }
  }

  _spawnBusPassengers() {
    if (!this.vehicle || !this.vehicle.position) return;
    const scene = this.trafficManager?.game?.scene;
    if (!scene) return;

    const THREE_local = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
    if (!THREE_local) return;

    const boardCount   = 2 + Math.floor(Math.random() * 3); // 2–4 boarding
    const alightCount  = 1 + Math.floor(Math.random() * 3); // 1–3 alighting
    const skinColors   = [0xf5cba7, 0xe0a96d, 0xc68642, 0x8d5524, 0x603813];
    const clothColors  = [0x3498db, 0xe74c3c, 0x2ecc71, 0x9b59b6, 0xf39c12, 0x1abc9c, 0xe67e22];

    const toonGrad = window._toonGrad;

    const makePassenger = (x, z, standing) => {
      const g = new THREE_local.Group();
      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const cloth = clothColors[Math.floor(Math.random() * clothColors.length)];
      const clothMat = new THREE_local.MeshToonMaterial({ color: cloth, gradientMap: toonGrad });
      const skinMat  = new THREE_local.MeshToonMaterial({ color: skin,  gradientMap: toonGrad });

      // Torso
      const torso = new THREE_local.Mesh(new THREE_local.BoxGeometry(0.5, 0.65, 0.3), clothMat);
      torso.position.y = 0.9;
      g.add(torso);
      // Head
      const head = new THREE_local.Mesh(new THREE_local.SphereGeometry(0.22, 8, 6), skinMat);
      head.position.y = 1.45;
      g.add(head);
      // Legs
      [-0.13, 0.13].forEach(lx => {
        const leg = new THREE_local.Mesh(new THREE_local.BoxGeometry(0.2, 0.55, 0.25), clothMat);
        leg.position.set(lx, 0.35, 0);
        g.add(leg);
      });
      // Arms
      [-0.32, 0.32].forEach(ax => {
        const arm = new THREE_local.Mesh(new THREE_local.BoxGeometry(0.18, 0.52, 0.2), clothMat);
        arm.position.set(ax, 0.88, 0);
        g.add(arm);
      });

      g.position.set(x, 0, z);
      g.rotation.y = Math.random() * Math.PI * 2;
      g.userData = { isBusPassenger: true };
      scene.add(g);
      this._busPassengers.push(g);

      // Animate: walk toward/away from bus
      const busX = this.vehicle.position.x, busZ = this.vehicle.position.z;
      const targetX = standing ? busX + (Math.random()-0.5)*2 : x + (Math.random()-0.5)*4 + 4;
      const targetZ = standing ? busZ + (Math.random()-0.5)*2 : z + (Math.random()-0.5)*4 + 4;
      const walkDist = Math.hypot(targetX - x, targetZ - z);
      const walkDur  = 1.5 + walkDist / 3;
      const startTime = performance.now();

      const animate = () => {
        if (!g.parent) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / walkDur, 1);
        g.position.x = x + (targetX - x) * t;
        g.position.z = z + (targetZ - z) * t;
        // Bob
        g.position.y = Math.abs(Math.sin(elapsed * 4)) * 0.06;
        if (t < 1) requestAnimationFrame(animate);
        else if (standing) {
          // Boarding passenger disappears into bus
          if (g.parent) scene.remove(g);
        }
      };
      requestAnimationFrame(animate);
    };

    const vpos = this.vehicle.position;
    const side = 4; // passengers appear beside the bus
    // Alighting passengers come from bus door
    for (let i = 0; i < alightCount; i++) {
      makePassenger(vpos.x + (Math.random()-0.5)*2, vpos.z + side + i*1.2, false);
    }
    // Boarding passengers come from sidewalk
    for (let i = 0; i < boardCount; i++) {
      makePassenger(vpos.x + (Math.random()-0.5)*3, vpos.z + side + 3 + i*1.2, true);
    }
  }

  _despawnBusPassengers() {
    const scene = this.trafficManager?.game?.scene;
    if (!scene) return;
    (this._busPassengers || []).forEach(p => {
      if (p.parent) scene.remove(p);
    });
    this._busPassengers = [];
  }

  // ── END BUS STOP LOGIC ──────────────────────────────────────────────────────

  _isAmbulanceNearby() {
    if (!this.trafficManager || !this.trafficManager.vehicles) return false;
    const myPos = this.vehicle.position;
    for (const v of this.trafficManager.vehicles) {
      if (v === this.vehicle) continue;
      if (v.userData && v.userData.isAmb && v.position.distanceTo(myPos) < 80) {

        const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
        const toAmb = new THREE.Vector3().subVectors(v.position, myPos);
        if (toAmb.dot(forward) < 0) return true;
      }
    }
    return false;
  }


  _updateEmergencyBrake(dt) {
    this.emergencyBrakeTimer = (this.emergencyBrakeTimer || 0) + dt;
    this.currentSpeed *= 0.85;
    this.desiredSpeed = 0;
    if (this.vehicle.brakeLights) this.vehicle.brakeLights.intensity = 3;

    if (this.currentSpeed < 0.5 || this.emergencyBrakeTimer > 3) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.emergencyBrakeTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }


  _checkEmergencyAvoidance(playerVehicle) {
    if (this.state === NPC_STATE.CRASH || this.state === NPC_STATE.EMERGENCY_BRAKE) return;
    if (this.currentSpeed < 3) return;
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

    if (this.trafficManager && this.trafficManager.vehicles) {
      for (const v of this.trafficManager.vehicles) {
        if (v === this.vehicle) continue;
        const toV = new THREE.Vector3().subVectors(v.position, myPos);
        const dist = toV.length();
        if (dist > checkRadius) continue;
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


  _reactToPlayer(player) {
    const dist = this.vehicle.position.distanceTo(player.position);
    const aggression = this.profile.aggression;


    if (aggression > 0.5 && dist < 15 && Math.random() < 0.02) {
      this._honk();
    }


    if (dist < 20) {
      const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const proj = toPlayer.dot(forward);
      if (proj > 0 && proj < 16) {
        this.desiredSpeed = Math.min(this.desiredSpeed, Math.max(0, (proj - 4) * 0.7));
        if (proj < 7) {
          this.state = (window.NPC_STATE && window.NPC_STATE.YIELD) || 'YIELD';
          this.currentSpeed = Math.max(0, this.currentSpeed * 0.6);
        }
      }
    }


    if (aggression > 0.6 && dist < 20 && this.currentSpeed > 3) {
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const lateral = right.dot(toPlayer);
      if (Math.abs(lateral) < 3 && Math.random() < 0.005) {
        this.vehicle.rotation.y += (lateral > 0 ? -1 : 1) * 0.02;
      }
    }


    if (aggression < 0.2 && dist < 25 && Math.random() < 0.01) {
      this.desiredSpeed *= 0.8;
    }



    if (this.profileKey === 'teen' && this.state === NPC_STATE.FOLLOW_LANE) {
      if (Math.random() < this.distractChance * 2) {
        this.state = NPC_STATE.DISTRACTED;
        this.distractTimer = 0;
      }
    }

    if (this.profileKey === 'elderly' && this.reactionTimer <= 0) {
      this.reactionTimer = 0.3 + Math.random() * 0.6;
    }

    if (this.profileKey === 'delivery' && this.routeIndex >= this.route.length - 1) {
      if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < 0.005) {
        this.desiredSpeed = 0;
        this.currentSpeed *= 0.9;
        this._honk();
      }
    }

    if (this.profileKey === 'tourist' && this.state === NPC_STATE.FOLLOW_LANE) {
      if (Math.random() < 0.002) {
        this.vehicle.rotation.y += (Math.random() - 0.5) * 0.08;
      }
    }
  }


  _getTargetSpeed() {
    const baseSpeed = this.currentEdge ? this.currentEdge.speedLimit / 3.6 : 10;
    const offset = this._speedVarianceOffset !== undefined ? this._speedVarianceOffset : 0;
    let speed = Math.max(2, baseSpeed * (1 + offset));

    const tm = this.trafficManager;
    if (tm && tm.game) {
      const cfg = tm.game.mapCfg;
      if (cfg) {
        if (cfg.hasRain || cfg.hasPuddles) speed *= 0.75;
        if (cfg.isNight) speed *= 0.85;
      }
    }
    return speed;
  }

  _applyPhysics(dt) {
    const stats = this.vehicle.stats || (window.VEHICLE_STATS && (window.VEHICLE_STATS[this.vehicle.type] || window.VEHICLE_STATS.car)) || { accel: 0.045, fric: 0.945 };
    const accel = (stats.accel || 0.045) * dt * 60;
    const fric = Math.pow(stats.fric || 0.945, dt * 60);
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
    this.vehicle.velocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.state = NPC_STATE.IDLE;
    this.routeIndex = 0;
    this.crashTimer = 0;
    if (this.trafficManager && this.trafficManager._despawnVehicle) {
      this.trafficManager._despawnVehicle(this.vehicle);
    }
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


const PED_STATE = {
  WAITING: 'WAITING',
  CROSSING: 'CROSSING',
  WALKING: 'WALKING',
  JAYWALKING: 'JAYWALKING',
  FLEEING: 'FLEEING',
  FROZEN: 'FROZEN'
};

const PED_PROFILES = {
  normal: { speed: 2.5, jaywalkChance: 0.15, waitPatience: 0.8, groupBehavior: 0.3 },
  rusher: { speed: 4.0, jaywalkChance: 0.5, waitPatience: 0.2, groupBehavior: 0.1 },
  cautious: { speed: 1.8, jaywalkChance: 0.02, waitPatience: 0.95, groupBehavior: 0.5 },
  child: { speed: 2.0, jaywalkChance: 0.3, waitPatience: 0.4, groupBehavior: 0.7 },
  elderly_ped: { speed: 1.2, jaywalkChance: 0.05, waitPatience: 0.9, groupBehavior: 0.4 },
  phone_user: { speed: 1.5, jaywalkChance: 0.35, waitPatience: 0.3, groupBehavior: 0.1 }
};

const PED_PROFILE_KEYS = Object.keys(PED_PROFILES);

function pickRandomPedProfile() {
  return PED_PROFILE_KEYS[Math.floor(Math.random() * PED_PROFILE_KEYS.length)];
}

class PedestrianAI {
  constructor(pedMesh, trafficManager) {
    this.ped = pedMesh;
    this.tm = trafficManager;
    this.profileKey = pedMesh.profileKey || pickRandomPedProfile();
    this.profile = PED_PROFILES[this.profileKey];
    this.state = PED_STATE.WALKING;
    this.target = null;
    this.waitTimer = 0;
    this.crossingTimer = 0;
    this.fleeTimer = 0;
    this.stuckTimer = 0;
    this.facing = Math.random() * Math.PI * 2;
    this.lookTimer = 0;
    this.onCrosswalk = false;
  }

  update(dt, npcs, playerVehicle) {
    this.lookTimer += dt;

    switch (this.state) {
      case PED_STATE.WALKING:
        this._updateWalking(dt);
        break;
      case PED_STATE.WAITING:
        this._updateWaiting(dt, npcs);
        break;
      case PED_STATE.CROSSING:
        this._updateCrossing(dt, npcs, playerVehicle);
        break;
      case PED_STATE.JAYWALKING:
        this._updateJaywalking(dt, npcs, playerVehicle);
        break;
      case PED_STATE.FLEEING:
        this._updateFleeing(dt);
        break;
      case PED_STATE.FROZEN:
        break;
    }

    this._checkVehicleProximity(playerVehicle, npcs);
    this._keepOnGround();
  }

  _smoothFacing(dir, dt) {
    if (!dir || (dir.x === 0 && dir.z === 0)) return;
    const targetFacing = Math.atan2(dir.x, dir.z);
    let diff = targetFacing - (this.facing || 0);
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facing = (this.facing || 0) + diff * Math.min(1, dt * 10);
    this.ped.rotation.y = this.facing;
  }

  _updateWalking(dt) {
    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5) {
        this.state = PED_STATE.WAITING;
        this.waitTimer = 0;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * this.profile.speed * dt;
      this.ped.position.z += dir.z * this.profile.speed * dt;
      this._smoothFacing(dir, dt);
    } else {

      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 15;
      this.target = new THREE.Vector3(
        this.ped.position.x + Math.sin(angle) * dist,
        0,
        this.ped.position.z + Math.cos(angle) * dist
      );
    }
  }

  _updateWaiting(dt, npcs) {
    this.waitTimer += dt;

    if (this.lookTimer > 1.5) {
      this.lookTimer = 0;
      this.facing += (Math.random() - 0.5) * 1.5;
      this.ped.rotation.y = this.facing;
    }

    if (!this._waitThreshold) this._waitThreshold = 2 + Math.random() * 4;
    if (this.waitTimer > this._waitThreshold) {
      if (this.profile.jaywalkChance > Math.random()) {
        this.state = PED_STATE.JAYWALKING;
        this.crossingTimer = 0;
        this._waitThreshold = null;
        this._pickCrossingTarget();
      } else {

        if (this._isRoadClear(npcs)) {
          this.state = PED_STATE.CROSSING;
          this.crossingTimer = 0;
          this._waitThreshold = null;
          this._pickCrossingTarget();
        }
      }
    }
  }

  _updateCrossing(dt, npcs, playerVehicle) {
    this.crossingTimer += dt;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.crossingTimer > 10) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * this.profile.speed * dt;
      this.ped.position.z += dir.z * this.profile.speed * dt;
      this._smoothFacing(dir, dt);
    }
  }

  _updateJaywalking(dt, npcs, playerVehicle) {
    this.crossingTimer += dt;

    const jaywalkSpeed = this.profile.speed * 1.3;
    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.crossingTimer > 8) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * jaywalkSpeed * dt;
      this.ped.position.z += dir.z * jaywalkSpeed * dt;
      this._smoothFacing(dir, dt);
    }
  }

  _updateFleeing(dt) {
    this.fleeTimer += dt;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.fleeTimer > 3) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * 5 * dt;
      this.ped.position.z += dir.z * 5 * dt;
      this._smoothFacing(dir, dt);
    }
  }

  _checkVehicleProximity(playerVehicle, npcs) {
    if (this.state === PED_STATE.FLEEING || this.state === PED_STATE.FROZEN) return;
    const myPos = this.ped.position;

    if (playerVehicle) {
      const dist = myPos.distanceTo(playerVehicle.position);
      if (dist < 8) {
        this.state = PED_STATE.FLEEING;
        this.fleeTimer = 0;

        const away = new THREE.Vector3().subVectors(myPos, playerVehicle.position).normalize();
        away.y = 0;
        this.target = myPos.clone().addScaledVector(away, 10);
        return;
      }
    }

    if (npcs) {
      for (const npc of npcs) {
        if (!npc.position) continue;
        const dist = myPos.distanceTo(npc.position);
        if (dist < 6) {
          this.state = PED_STATE.FLEEING;
          this.fleeTimer = 0;
          const away = new THREE.Vector3().subVectors(myPos, npc.position).normalize();
          away.y = 0;
          this.target = myPos.clone().addScaledVector(away, 8);
          return;
        }
      }
    }
  }

  _isRoadClear(npcs) {

    if (!npcs) return true;
    const myPos = this.ped.position;
    for (const npc of npcs) {
      if (!npc.position) continue;
      const dist = myPos.distanceTo(npc.position);
      if (dist < 10) return false;
    }
    return true;
  }

  _pickCrossingTarget() {

    const crossAngle = this.facing + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const crossDist = 12 + Math.random() * 8;
    this.target = new THREE.Vector3(
      this.ped.position.x + Math.sin(crossAngle) * crossDist,
      0,
      this.ped.position.z + Math.cos(crossAngle) * crossDist
    );
  }

  _keepOnGround() {

    if (!this._groundY) this._groundY = this.ped.position.y > 0.1 ? 0.5 : 0;
    this.ped.position.y = this._groundY;
  }
}

window.NPC_STATE = NPC_STATE;
window.NPC_PROFILES = NPC_PROFILES;
window.NPCAI = NPCAI;
window.pickRandomProfile = pickRandomProfile;
window.PED_STATE = PED_STATE;
window.PED_PROFILES = PED_PROFILES;
window.PedestrianAI = PedestrianAI;
window.pickRandomPedProfile = pickRandomPedProfile;