// TrafficLight.js - Dynamic Traffic Light System for Mumbai Traffic Hero
// Version: 1.0.0
// Description: Realistic traffic light simulation with Indian timing patterns

class TrafficLight {
  constructor(position, rotation = 0, options = {}) {
    this.group = new THREE.Group();
    this.position = position.clone();
    this.rotation = rotation;
    
    // Light states: 'red', 'yellow', 'green'
    this.state = 'red';
    this.timer = 0;
    
    // Timing configuration (Indian traffic patterns)
    this.timings = {
      red: options.redTime || 30 + Math.random() * 20,
      yellow: options.yellowTime || 3,
      green: options.greenTime || 25 + Math.random() * 15
    };
    
    // Amber (yellow between green and red)
    this.useAmber = true;
    
    // For synchronized lights
    this.groupId = options.groupId || null;
    this.offset = options.offset || 0;
    
    // Violation tracking
    this.violations = [];
    
    this.createMesh();
    this.updateVisuals();
  }
  
  createMesh() {
    // Main pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Vertical pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
      poleMat
    );
    pole.position.y = 2.5;
    pole.castShadow = true;
    
    // Horizontal arm (for overhead lights)
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.08, 0.08),
      poleMat
    );
    arm.position.y = 5;
    arm.position.z = 1.25;
    
    // Light housing box
    const housingMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.8
    });
    
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.0, 0.3),
      housingMat
    );
    housing.position.y = 5;
    housing.position.z = 2.6;
    housing.castShadow = true;
    
    // Light emitters
    const lightMat = {
      red: new THREE.MeshStandardMaterial({ 
        color: 0x330000, 
        emissive: 0x000000,
        transparent: true,
        opacity: 0.9
      }),
      yellow: new THREE.MeshStandardMaterial({ 
        color: 0x333300, 
        emissive: 0x000000,
        transparent: true,
        opacity: 0.9
      }),
      green: new THREE.MeshStandardMaterial({ 
        color: 0x003300, 
        emissive: 0x000000,
        transparent: true,
        opacity: 0.9
      })
    };
    
    // Red light
    this.redLight = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 24),
      lightMat.red
    );
    this.redLight.position.set(0, 5.25, 2.76);
    
    // Yellow light
    this.yellowLight = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 24),
      lightMat.yellow
    );
    this.yellowLight.position.set(0, 5.0, 2.76);
    
    // Green light
    this.greenLight = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 24),
      lightMat.green
    );
    this.greenLight.position.set(0, 4.75, 2.76);
    
    // Add light glow sprites for bloom effect
    this.redGlow = this.createGlowSprite(0xff0000);
    this.yellowGlow = this.createGlowSprite(0xffff00);
    this.greenGlow = this.createGlowSprite(0x00ff00);
    
    this.redGlow.position.set(0, 5.25, 2.8);
    this.yellowGlow.position.set(0, 5.0, 2.8);
    this.greenGlow.position.set(0, 4.75, 2.8);
    
    this.redGlow.visible = false;
    this.yellowGlow.visible = false;
    this.greenGlow.visible = false;
    
    // Countdown timer display (optional)
    if (options.showTimer) {
      this.timerDisplay = this.createTimerDisplay();
      this.timerDisplay.position.set(0, 4.4, 2.76);
      this.group.add(this.timerDisplay);
    }
    
    // Add all to group
    this.group.add(pole, arm, housing);
    this.group.add(this.redLight, this.yellowLight, this.greenLight);
    this.group.add(this.redGlow, this.yellowGlow, this.greenGlow);
    
    // Position and rotate
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;
  }
  
  createGlowSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, '#' + color.toString(16).padStart(6, '0'));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Sprite(spriteMat);
  }
  
  createTimerDisplay() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), mat);
    
    display.userData = { canvas, texture, ctx: canvas.getContext('2d') };
    return display;
  }
  
  updateTimerDisplay() {
    if (!this.timerDisplay) return;
    
    const { canvas, texture, ctx } = this.timerDisplay.userData;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const remaining = Math.ceil(this.getRemainingTime());
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = this.state === 'red' ? '#ff0000' : 
                    this.state === 'yellow' ? '#ffff00' : '#00ff00';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(remaining.toString(), canvas.width / 2, canvas.height / 2);
    
    texture.needsUpdate = true;
  }
  
  update(dt) {
    this.timer += dt;
    
    const duration = this.timings[this.state];
    
    if (this.timer >= duration) {
      this.timer = 0;
      this.nextState();
    }
    
    // Update timer display
    if (this.timerDisplay) {
      this.updateTimerDisplay();
    }
  }
  
  nextState() {
    switch(this.state) {
      case 'red':
        this.state = 'green';
        break;
      case 'green':
        this.state = 'yellow';
        break;
      case 'yellow':
        this.state = 'red';
        break;
    }
    this.updateVisuals();
  }
  
  updateVisuals() {
    // Update light colors
    this.redLight.material.color.setHex(this.state === 'red' ? 0xff0000 : 0x330000);
    this.redLight.material.emissive.setHex(this.state === 'red' ? 0xff0000 : 0x000000);
    
    this.yellowLight.material.color.setHex(this.state === 'yellow' ? 0xffff00 : 0x333300);
    this.yellowLight.material.emissive.setHex(this.state === 'yellow' ? 0xffff00 : 0x000000);
    
    this.greenLight.material.color.setHex(this.state === 'green' ? 0x00ff00 : 0x003300);
    this.greenLight.material.emissive.setHex(this.state === 'green' ? 0x00ff00 : 0x000000);
    
    // Update glow sprites
    this.redGlow.visible = this.state === 'red';
    this.yellowGlow.visible = this.state === 'yellow';
    this.greenGlow.visible = this.state === 'green';
    
    // Scale glow based on state
    if (this.redGlow.visible) this.redGlow.scale.set(2, 2, 1);
    if (this.yellowGlow.visible) this.yellowGlow.scale.set(1.5, 1.5, 1);
    if (this.greenGlow.visible) this.greenGlow.scale.set(2, 2, 1);
  }
  
  getRemainingTime() {
    return Math.max(0, this.timings[this.state] - this.timer);
  }
  
  setState(newState) {
    this.state = newState;
    this.timer = 0;
    this.updateVisuals();
  }
  
  syncWith(otherLight, offset) {
    this.state = otherLight.state;
    this.timer = otherLight.timer + (offset || 0);
    this.updateVisuals();
  }
}

// Traffic light system manager
class TrafficLightSystem {
  constructor(scene, roadGraph) {
    this.scene = scene;
    this.roadGraph = roadGraph;
    this.lights = [];
    this.groups = new Map();
    
    // Timing offsets for realistic synchronization
    this.globalOffset = 0;
  }
  
  spawnAtIntersection(node, options = {}) {
    if (node.type !== 'junction' && node.edges.length < 3) return null;
    
    const light = new TrafficLight(
      new THREE.Vector3(node.position.x, 0, node.position.z),
      options.rotation || 0,
      options
    );
    
    this.lights.push(light);
    this.scene.add(light.group);
    
    return light;
  }
  
  spawnAtAllIntersections() {
    if (!this.roadGraph || !this.roadGraph.nodes) return;
    
    this.roadGraph.nodes.forEach((node, index) => {
      if (node.type === 'junction' || node.edges.length >= 3) {
        // Create 4-way traffic light
        const baseRotation = Math.random() * Math.PI * 2;
        const light = this.spawnAtIntersection(node, {
          rotation: baseRotation,
          redTime: 25 + Math.random() * 20,
          greenTime: 20 + Math.random() * 15,
          yellowTime: 3,
          showTimer: true
        });
        
        if (light) {
          light.lightId = index;
        }
      }
    });
    
    // Synchronize adjacent lights
    this.synchronizeLights();
  }
  
  synchronizeLights() {
    // Group nearby lights and offset their timing
    const syncDistance = 100;
    
    for (let i = 0; i < this.lights.length; i++) {
      const lightA = this.lights[i];
      
      for (let j = i + 1; j < this.lights.length; j++) {
        const lightB = this.lights[j];
        const dist = lightA.group.position.distanceTo(lightB.group.position);
        
        if (dist < syncDistance) {
          // Offset by half cycle so they alternate
          const offset = lightA.timings.red / 2;
          lightB.timer = offset;
        }
      }
    }
  }
  
  update(dt) {
    this.lights.forEach(light => light.update(dt));
  }
  
  getLightsNear(position, radius) {
    return this.lights.filter(light => {
      return light.group.position.distanceTo(position) < radius;
    });
  }
  
  getStateAt(position) {
    const nearby = this.getLightsNear(position, 30);
    if (nearby.length === 0) return null;
    
    // Return the closest light
    let closest = nearby[0];
    let minDist = position.distanceTo(closest.group.position);
    
    for (const light of nearby) {
      const dist = position.distanceTo(light.group.position);
      if (dist < minDist) {
        minDist = dist;
        closest = light;
      }
    }
    
    return {
      state: closest.state,
      distance: minDist,
      remainingTime: closest.getRemainingTime(),
      light: closest
    };
  }
  
  // Check if player ran a red light
  checkViolation(vehiclePosition, vehicleSpeed) {
    const state = this.getStateAt(vehiclePosition);
    if (!state) return null;
    
    if (state.state === 'red' && state.distance < 10 && vehicleSpeed > 5) {
      return {
        type: 'red_light',
        position: vehiclePosition.clone(),
        time: Date.now()
      };
    }
    
    return null;
  }
  
  // Set traffic density (affects timing)
  setDensity(density) {
    this.lights.forEach(light => {
      // Higher density = longer red times
      const factor = 0.5 + density * 1.0;
      light.timings.red = 20 + factor * 20;
      light.timings.green = 15 + factor * 15;
    });
  }
  
  // Rush hour mode
  setRushHour(enabled) {
    this.lights.forEach(light => {
      if (enabled) {
        light.timings.red = 45 + Math.random() * 15;
        light.timings.green = 20 + Math.random() * 10;
      } else {
        light.timings.red = 25 + Math.random() * 15;
        light.timings.green = 25 + Math.random() * 15;
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.TrafficLight = TrafficLight;
  window.TrafficLightSystem = TrafficLightSystem;
}
