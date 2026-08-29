// TrafficAI.js - Intelligent Traffic AI System for Mumbai Traffic Hero
// Version: 1.0.0
// Description: Rule-based traffic AI with realistic behavior patterns

class TrafficAI {
  constructor(vehicle, roadGraph, options = {}) {
    this.vehicle = vehicle;
    this.roadGraph = roadGraph;
    
    // AI personality traits (randomized per vehicle)
    this.aggression = options.aggression ?? Math.random(); // 0-1 (higher = more rule-breaking)
    this.skill = options.skill ?? 0.5 + Math.random() * 0.5; // 0-1 (higher = better driving)
    this.patience = options.patience ?? Math.random(); // 0-1 (higher = more patient)
    this.reactionTime = 0.3 + (1 - this.skill) * 1.2; // seconds
    
    // State machine
    this.state = 'cruising';
    this.stateTime = 0;
    
    // Speed preferences
    this.preferredSpeed = 30 + Math.random() * 30; // 30-60 km/h
    this.currentSpeed = 0;
    this.targetSpeed = this.preferredSpeed;
    
    // Path following
    this.path = [];
    this.pathIndex = 0;
    this.currentEdge = null;
    this.laneOffset = (Math.random() > 0.5 ? 1 : -1) * 2;
    
    // Decision making
    this.lastDecision = 0;
    this.decisionInterval = 1.5 + Math.random() * 2;
    
    // Sensors
    this.viewDistance = 60 + this.skill * 40;
    this.sideDistance = 15;
    
    // Violations tracking
    this.violations = {
      redLight: 0,
      speeding: 0,
      wrongLane: 0
    };
    
    this.init();
  }
  
  init() {
    // Assign random starting path
    if (this.roadGraph && this.roadGraph.nodes.length > 0) {
      this.generateRandomPath();
    }
  }
  
  generateRandomPath() {
    const nodes = this.roadGraph.nodes;
    if (nodes.length < 2) return;
    
    const start = nodes[Math.floor(Math.random() * nodes.length)];
    const end = nodes[Math.floor(Math.random() * nodes.length)];
    
    if (start === end) return;
    
    const path = this.roadGraph.findPath(start, end);
    if (path && path.length > 1) {
      this.path = path.map(n => ({
        x: n.position.x,
        z: n.position.z
      }));
      this.pathIndex = 0;
    }
  }
  
  update(dt, context) {
    this.stateTime += dt;
    this.lastDecision += dt;
    
    // Update sensors
    this.context = context;
    
    // Make decisions periodically
    if (this.lastDecision >= this.decisionInterval) {
      this.makeDecision();
      this.lastDecision = 0;
    }
    
    // Execute current state
    this.execute(dt);
    
    // Update speed
    this.updateSpeed(dt);
  }
  
  makeDecision() {
    const ctx = this.context;
    if (!ctx) return;
    
    // Priority 1: Traffic lights
    const nearestLight = this.findNearestTrafficLight(ctx.trafficLights);
    if (nearestLight && nearestLight.distance < this.viewDistance * 0.5) {
      if (nearestLight.light.state === 'red' && nearestLight.distance > 8) {
        // Aggressive drivers might run the red light
        if (this.aggression > 0.85 && nearestLight.distance < 15 && Math.random() < 0.3) {
          // Run red light (violation)
          this.violations.redLight++;
          this.state = 'cruising';
        } else {
          this.state = 'stopping';
          this.targetSpeed = 0;
        }
        return;
      } else if (nearestLight.light.state === 'yellow') {
        // Stop if possible, otherwise continue
        if (nearestLight.distance > 20 || this.patience > 0.7) {
          this.state = 'stopping';
          this.targetSpeed = 0;
        }
        return;
      }
    }
    
    // Priority 2: Vehicles ahead
    const vehicleAhead = this.findVehicleAhead(ctx.vehicles);
    if (vehicleAhead && vehicleAhead.distance < this.viewDistance * 0.4) {
      if (vehicleAhead.relativeSpeed < -10) { // Much slower
        if (this.aggression > 0.4 && this.canOvertake(ctx)) {
          this.state = 'overtaking';
          this.overtakeDirection = this.getOvertakeDirection(ctx);
        } else {
          this.state = 'following';
          this.targetSpeed = vehicleAhead.speed;
        }
        return;
      } else if (vehicleAhead.distance < 15) {
        this.state = 'following';
        this.targetSpeed = Math.min(this.targetSpeed, vehicleAhead.speed);
        return;
      }
    }
    
    // Priority 3: Pedestrians
    const pedestrian = this.findPedestrianAhead(ctx.pedestrians);
    if (pedestrian && pedestrian.distance < 25) {
      this.state = 'yielding';
      this.targetSpeed = 0;
      return;
    }
    
    // Priority 4: Speed limits
    const speedLimit = this.getCurrentSpeedLimit();
    if (this.currentSpeed > speedLimit) {
      if (this.aggression > 0.6 && Math.random() < 0.2) {
        // Speeding (violation)
        this.violations.speeding++;
      } else {
        this.targetSpeed = speedLimit;
      }
    }
    
    // Default: cruise
    if (this.state !== 'overtaking') {
      this.state = 'cruising';
      this.targetSpeed = this.preferredSpeed;
    }
  }
  
  execute(dt) {
    const v = this.vehicle;
    
    // Follow path
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      this.generateRandomPath();
      return;
    }
    
    const target = this.path[this.pathIndex];
    const dx = target.x - v.position.x;
    const dz = target.z - v.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Reached waypoint
    if (distance < 5) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.generateRandomPath();
      }
      return;
    }
    
    // Calculate steering
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - v.rotation.y;
    
    // Normalize angle to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Apply steering with skill-based error
    const steerError = (1 - this.skill) * 0.3 * (Math.random() - 0.5);
    const steerAmount = Math.max(-1, Math.min(1, angleDiff * 2 + steerError));
    
    // Apply to vehicle
    v.userData.steer = steerAmount;
    v.userData.throttle = this.getThrottleForState();
    v.userData.brake = this.getBrakeForState();
    
    // Update rotation
    v.rotation.y += steerAmount * v.userData.speed * 0.01 * dt;
  }
  
  updateSpeed(dt) {
    const v = this.vehicle;
    const currentSpeed = v.userData.speed || 0;
    const diff = this.targetSpeed - currentSpeed;
    
    if (diff > 0) {
      // Accelerate
      currentSpeed += diff * 0.5 * dt;
    } else {
      // Decelerate
      currentSpeed += diff * 0.8 * dt;
    }
    
    v.userData.speed = Math.max(0, Math.min(80, currentSpeed));
  }
  
  getThrottleForState() {
    switch(this.state) {
      case 'cruising': return 0.4 + this.aggression * 0.3;
      case 'following': return 0.2;
      case 'overtaking': return 0.7;
      case 'stopping': return 0;
      case 'yielding': return 0;
      default: return 0.3;
    }
  }
  
  getBrakeForState() {
    switch(this.state) {
      case 'cruising': return 0;
      case 'following': return 0.2;
      case 'overtaking': return 0;
      case 'stopping': return 0.6 + (1 - this.skill) * 0.3;
      case 'yielding': return 0.8;
      default: return 0;
    }
  }
  
  findNearestTrafficLight(lights) {
    if (!lights || lights.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;
    
    for (const light of lights) {
      const dist = this.vehicle.position.distanceTo(light.group.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = { light, distance: dist };
      }
    }
    
    return nearest;
  }
  
  findVehicleAhead(vehicles) {
    if (!vehicles || vehicles.length === 0) return null;
    
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.vehicle.quaternion);
    let nearest = null;
    let minDist = Infinity;
    
    for (const v of vehicles) {
      if (v === this.vehicle) continue;
      
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      const dist = toV.length();
      
      if (dist > this.viewDistance * 0.4) continue;
      
      // Check if ahead (dot product)
      const dot = toV.normalize().dot(forward);
      if (dot < 0.7) continue; // Not in front arc
      
      if (dist < minDist) {
        minDist = dist;
        nearest = {
          vehicle: v,
          distance: dist,
          speed: v.userData.speed || 0,
          relativeSpeed: (v.userData.speed || 0) - this.currentSpeed
        };
      }
    }
    
    return nearest;
  }
  
  findPedestrianAhead(pedestrians) {
    if (!pedestrians || pedestrians.length === 0) return null;
    
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.vehicle.quaternion);
    let nearest = null;
    let minDist = Infinity;
    
    for (const p of pedestrians) {
      const toP = new THREE.Vector3().subVectors(p.group.position, this.vehicle.position);
      const dist = toP.length();
      
      if (dist > 25) continue;
      
      const dot = toP.normalize().dot(forward);
      if (dot < 0.5) continue;
      
      if (dist < minDist) {
        minDist = dist;
        nearest = { pedestrian: p, distance: dist };
      }
    }
    
    return nearest;
  }
  
  canOvertake(ctx) {
    if (!ctx) return false;
    
    // Check if lane change is safe
    const sideCheck = this.getOvertakeDirection(ctx);
    return sideCheck !== null;
  }
  
  getOvertakeDirection(ctx) {
    // Check left side
    const leftClear = this.isSideClear('left', ctx.vehicles);
    const rightClear = this.isSideClear('right', ctx.vehicles);
    
    if (leftClear) return 'left';
    if (rightClear) return 'right';
    return null;
  }
  
  isSideClear(side, vehicles) {
    const offset = side === 'left' ? -1 : 1;
    const sidePos = this.vehicle.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.vehicle.quaternion);
    sidePos.add(right.multiplyScalar(offset * 4));
    
    for (const v of vehicles) {
      if (v === this.vehicle) continue;
      if (sidePos.distanceTo(v.position) < 10) return false;
    }
    
    return true;
  }
  
  getCurrentSpeedLimit() {
    // Default Mumbai speed limits
    if (this.currentEdge && this.currentEdge.speedLimit) {
      return this.currentEdge.speedLimit;
    }
    return 50; // Default city limit
  }
}

// Static traffic manager
class TrafficManager {
  constructor(scene, roadGraph) {
    this.scene = scene;
    this.roadGraph = roadGraph;
    this.vehicles = [];
    this.maxVehicles = 20;
    this.spawnTimer = 0;
    this.spawnInterval = 3;
  }
  
  spawnVehicle(vehicleMesh) {
    if (this.vehicles.length >= this.maxVehicles) return null;
    
    const vehicle = vehicleMesh.clone();
    vehicle.userData.speed = 0;
    vehicle.userData.throttle = 0;
    vehicle.userData.brake = 0;
    vehicle.userData.steer = 0;
    
    // Random position on road graph
    const node = this.roadGraph.nodes[Math.floor(Math.random() * this.roadGraph.nodes.length)];
    vehicle.position.set(node.position.x, 0, node.position.z);
    
    // Create AI
    const ai = new TrafficAI(vehicle, this.roadGraph, {
      aggression: Math.random(),
      skill: 0.4 + Math.random() * 0.6,
      patience: Math.random()
    });
    
    vehicle.userData.ai = ai;
    this.vehicles.push(vehicle);
    this.scene.add(vehicle);
    
    return vehicle;
  }
  
  update(dt, playerPosition, trafficLights) {
    const context = {
      vehicles: this.vehicles,
      trafficLights: trafficLights || [],
      pedestrians: [], // TODO: Add pedestrians
      player: playerPosition
    };
    
    // Update all vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      const ai = v.userData.ai;
      
      if (ai) {
        ai.update(dt, context);
      }
      
      // Remove if too far from player
      const distToPlayer = v.position.distanceTo(playerPosition);
      if (distToPlayer > 300) {
        this.scene.remove(v);
        this.vehicles.splice(i, 1);
      }
    }
    
    // Spawn new vehicles
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.vehicles.length < this.maxVehicles) {
      this.spawnTimer = 0;
      // Spawn at edge of view
      // TODO: Use vehicle templates
    }
  }
}

if (typeof window !== 'undefined') {
  window.TrafficAI = TrafficAI;
  window.TrafficManager = TrafficManager;
}
