// PedestrianAI.js - Pedestrian AI System for Mumbai Traffic Hero
// Version: 1.0.0
// Description: Realistic pedestrian behavior with Indian context

class Pedestrian {
  constructor(position, options = {}) {
    this.group = new THREE.Group();
    this.position = position.clone();
    
    // State machine
    this.state = 'waiting'; // waiting, crossing, walking, running
    this.stateTime = 0;
    this.waitTime = 0;
    
    // Movement
    this.speed = 1.2 + Math.random() * 0.8; // Walking speed m/s
    this.runSpeed = 3.0 + Math.random() * 1.0;
    this.direction = new THREE.Vector3();
    
    // Crossing
    this.crossingStart = null;
    this.crossingEnd = null;
    this.crossingProgress = 0;
    this.crossingDistance = 0;
    
    // Appearance
    this.gender = Math.random() > 0.5 ? 'male' : 'female';
    this.ageGroup = Math.random() > 0.7 ? 'elderly' : (Math.random() > 0.3 ? 'adult' : 'child');
    this.height = this.getHeightForAge();
    this.clothingColor = this.getRandomClothingColor();
    
    // Behavior traits
    this.carefulness = Math.random(); // 0-1 (higher = more likely to wait for green)
    this.phoneUse = Math.random() < 0.3; // 30% chance of being on phone
    
    this.createMesh();
    this.group.position.copy(this.position);
  }
  
  getHeightForAge() {
    switch(this.ageGroup) {
      case 'child': return 0.9 + Math.random() * 0.3;
      case 'elderly': return 1.5 + Math.random() * 0.1;
      default: return 1.6 + Math.random() * 0.2;
    }
  }
  
  getRandomClothingColor() {
    // Indian clothing colors
    const colors = [
      0xff6600, // Saffron
      0xffffff, // White
      0x006600, // Green
      0xcc0000, // Red
      0x0000cc, // Blue
      0xffcc00, // Yellow
      0xff00ff, // Magenta
      0x996633, // Brown
      0x333333, // Dark gray
      0xff9999, // Pink
      0x99ff99, // Light green
      0xccccff, // Light blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  createMesh() {
    const height = this.height;
    const scale = height / 1.7; // Normalize to average height
    
    // Body (kurta/shirt)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: this.clothingColor,
      roughness: 0.8
    });
    
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2 * scale, 0.6 * scale, 4, 8),
      bodyMat
    );
    body.position.y = 0.7 * scale;
    body.castShadow = true;
    
    // Pants/lungi
    const pantsMat = new THREE.MeshStandardMaterial({ 
      color: this.getPantsColor(),
      roughness: 0.9
    });
    
    const pants = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18 * scale, 0.4 * scale, 4, 8),
      pantsMat
    );
    pants.position.y = 0.25 * scale;
    pants.castShadow = true;
    
    // Head
    const skinTones = [0xffdbac, 0xe8b88a, 0xc68642, 0x8d5524, 0x6b3a1f];
    const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
    const headMat = new THREE.MeshStandardMaterial({ color: skinTone });
    
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 * scale, 8, 8),
      headMat
    );
    head.position.y = 1.2 * scale;
    head.castShadow = true;
    
    // Hair/head covering
    if (this.gender === 'female' || Math.random() > 0.5) {
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 * scale, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        hairMat
      );
      hair.position.y = 1.25 * scale;
      this.group.add(hair);
      
      // Dupatta/sari for some women
      if (this.gender === 'female' && Math.random() > 0.5) {
        const dupatta = new THREE.Mesh(
          new THREE.PlaneGeometry(0.4 * scale, 0.8 * scale),
          new THREE.MeshStandardMaterial({ 
            color: this.clothingColor,
            side: THREE.DoubleSide
          })
        );
        dupatta.position.set(0.1 * scale, 0.7 * scale, 0);
        dupatta.rotation.y = 0.3;
        this.group.add(dupatta);
      }
    }
    
    // Phone (for distracted pedestrians)
    if (this.phoneUse) {
      const phone = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.1, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      phone.position.set(0.15 * scale, 0.9 * scale, 0.1 * scale);
      this.group.add(phone);
    }
    
    this.group.add(body, pants, head);
    
    // Random rotation
    this.group.rotation.y = Math.random() * Math.PI * 2;
  }
  
  getPantsColor() {
    const pants = [0x333333, 0x3366cc, 0x663300, 0x000066, 0x336600, 0x999999];
    return pants[Math.floor(Math.random() * pants.length)];
  }
  
  update(dt, context) {
    this.stateTime += dt;
    
    switch(this.state) {
      case 'waiting':
        this.updateWaiting(dt, context);
        break;
      case 'crossing':
        this.updateCrossing(dt, context);
        break;
      case 'walking':
        this.updateWalking(dt, context);
        break;
    }
  }
  
  updateWaiting(dt, context) {
    this.waitTime += dt;
    
    // Check if pedestrian should start crossing
    if (this.shouldCross(context)) {
      this.startCrossing(context);
    }
    
    // Randomly walk away if waiting too long
    if (this.waitTime > 30 + Math.random() * 30) {
      this.state = 'walking';
      this.pickRandomDirection();
    }
  }
  
  updateCrossing(dt, context) {
    if (!this.crossingStart || !this.crossingEnd) {
      this.state = 'waiting';
      return;
    }
    
    // Move along crossing path
    const speed = this.phoneUse ? this.speed * 0.5 : this.speed;
    this.crossingProgress += (speed * dt) / this.crossingDistance;
    
    if (this.crossingProgress >= 1) {
      // Reached other side
      this.group.position.copy(this.crossingEnd);
      this.state = 'waiting';
      this.waitTime = 0;
      this.crossingStart = null;
      this.crossingEnd = null;
      this.crossingProgress = 0;
      
      // Pick new sidewalk position
      this.pickNewSidewalk();
    } else {
      // Interpolate position
      this.group.position.lerpVectors(
        this.crossingStart,
        this.crossingEnd,
        this.crossingProgress
      );
      
      // Face direction of travel
      const dir = new THREE.Vector3().subVectors(this.crossingEnd, this.crossingStart).normalize();
      this.group.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }
  
  updateWalking(dt, context) {
    // Walk along sidewalk
    this.group.position.add(this.direction.clone().multiplyScalar(this.speed * dt));
    
    // Change direction occasionally
    if (Math.random() < 0.01) {
      this.pickRandomDirection();
    }
    
    // Stop if too far from road
    if (this.group.position.length() > 200) {
      this.pickRandomDirection();
    }
  }
  
  shouldCross(context) {
    if (!context) return false;
    
    // Careful pedestrians wait for green light
    if (this.carefulness > 0.7 && context.trafficLights) {
      const nearestLight = this.findNearestTrafficLight(context.trafficLights);
      if (nearestLight && nearestLight.distance < 15) {
        if (nearestLight.light.state !== 'red') {
          return false; // Wait for red light (for vehicles)
        }
      }
    }
    
    // Phone users might cross without looking
    if (this.phoneUse && Math.random() < 0.3) {
      return true;
    }
    
    // Check for approaching vehicles
    if (context.vehicles) {
      for (const v of context.vehicles) {
        const dist = this.group.position.distanceTo(v.position);
        if (dist < 15) {
          const approaching = this.isVehicleApproaching(v, this.group.position);
          if (approaching && dist < 25) {
            return false; // Wait for vehicle to pass
          }
        }
      }
    }
    
    // Random chance to cross
    return Math.random() < 0.02;
  }
  
  startCrossing(context) {
    // Pick crossing direction (perpendicular to road)
    const roadDir = context.roadDirection || new THREE.Vector3(1, 0, 0);
    const crossDir = new THREE.Vector3(-roadDir.z, 0, roadDir.x);
    
    // Random direction (left or right side of road)
    if (Math.random() > 0.5) crossDir.negate();
    
    this.crossingStart = this.group.position.clone();
    this.crossingEnd = this.crossingStart.clone().add(crossDir.multiplyScalar(8 + Math.random() * 4));
    this.crossingDistance = this.crossingStart.distanceTo(this.crossingEnd);
    this.crossingProgress = 0;
    this.state = 'crossing';
  }
  
  pickRandomDirection() {
    const angle = Math.random() * Math.PI * 2;
    this.direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    this.group.rotation.y = angle;
  }
  
  pickNewSidewalk() {
    // Move to a new position near a road
    const offset = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 5);
    this.group.position.x += offset;
    this.group.position.z += (Math.random() - 0.5) * 10;
  }
  
  findNearestTrafficLight(lights) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const light of lights) {
      const dist = this.group.position.distanceTo(light.group.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = { light, distance: dist };
      }
    }
    
    return nearest;
  }
  
  isVehicleApproaching(vehicle, position) {
    const toP = new THREE.Vector3().subVectors(position, vehicle.position);
    const vel = vehicle.userData.velocity || new THREE.Vector3();
    return toP.dot(vel) > 0;
  }
}

// Pedestrian manager
class PedestrianManager {
  constructor(scene, roadGraph) {
    this.scene = scene;
    this.roadGraph = roadGraph;
    this.pedestrians = [];
    this.maxPedestrians = 30;
    this.spawnTimer = 0;
    this.spawnInterval = 2;
  }
  
  spawnPedestrian(position) {
    if (this.pedestrians.length >= this.maxPedestrians) return null;
    
    const pos = position || this.getRandomSidewalkPosition();
    const pedestrian = new Pedestrian(pos);
    
    this.pedestrians.push(pedestrian);
    this.scene.add(pedestrian.group);
    
    return pedestrian;
  }
  
  getRandomSidewalkPosition() {
    // Place near roads
    if (this.roadGraph && this.roadGraph.nodes.length > 0) {
      const node = this.roadGraph.nodes[Math.floor(Math.random() * this.roadGraph.nodes.length)];
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
      );
      return new THREE.Vector3(node.position.x, 0, node.position.z).add(offset);
    }
    return new THREE.Vector3((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100);
  }
  
  update(dt, context) {
    // Update all pedestrians
    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const p = this.pedestrians[i];
      p.update(dt, context);
      
      // Remove if too far from player
      const playerPos = context.player || new THREE.Vector3();
      if (p.group.position.distanceTo(playerPos) > 200) {
        this.scene.remove(p.group);
        this.pedestrians.splice(i, 1);
      }
    }
    
    // Spawn new pedestrians
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.pedestrians.length < this.maxPedestrians) {
      this.spawnTimer = 0;
      this.spawnPedestrian();
    }
  }
  
  // Spawn crowd at specific location (e.g., near market)
  spawnCrowd(position, count = 10) {
    for (let i = 0; i < count; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20
      );
      this.spawnPedestrian(position.clone().add(offset));
    }
  }
}

if (typeof window !== 'undefined') {
  window.Pedestrian = Pedestrian;
  window.PedestrianManager = PedestrianManager;
}
