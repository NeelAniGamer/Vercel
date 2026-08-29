// WeatherSystem.js - Dynamic Weather for Mumbai Traffic Hero
// Version: 1.0.0
// Description: Rain, fog, and dynamic weather affecting gameplay

class WeatherSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Current weather state
    this.currentWeather = 'clear'; // clear, cloudy, rain, heavy_rain, fog, storm
    this.targetWeather = 'clear';
    this.transitionProgress = 1;
    this.transitionDuration = 10; // seconds
    
    // Weather parameters
    this.cloudCover = 0; // 0-1
    this.rainIntensity = 0; // 0-1
    this.fogDensity = 0; // 0-1
    this.windSpeed = 0; // m/s
    this.windDirection = new THREE.Vector3();
    
    // Lighting
    this.sunIntensity = 1.0;
    this.ambientIntensity = 0.4;
    
    // Visual elements
    this.rainParticles = null;
    this.lightning = null;
    this.cloudMeshes = [];
    
    // Gameplay effects
    this.roadFriction = 1.0; // 1.0 = dry, 0.4 = flooded
    this.visibility = 1.0; // 1.0 = clear, 0.1 = heavy fog
    
    // Time of day
    this.timeOfDay = 12; // 24-hour format
    this.dayNightCycle = true;
    this.timeSpeed = 1; // Multiplier (1 = real-time)
    
    // Mumbai-specific weather patterns
    this.monsoonMode = false; // June-September
    this.heatHaze = false; // Summer
    
    this.init();
  }
  
  init() {
    this.createRainSystem();
    this.createClouds();
    this.updateWeatherEffects();
  }
  
  createRainSystem() {
    // Rain particle system
    const rainCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    const velocities = new Float32Array(rainCount);
    
    for (let i = 0; i < rainCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i] = 15 + Math.random() * 10;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    
    const material = new THREE.PointsMaterial({
      color: 0xaaaaff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }
  
  createClouds() {
    // Volumetric cloud planes
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(60 + Math.random() * 40, 30 + Math.random() * 20),
        cloudMat.clone()
      );
      
      cloud.position.set(
        (Math.random() - 0.5) * 200,
        40 + Math.random() * 20,
        (Math.random() - 0.5) * 200
      );
      
      cloud.rotation.x = -Math.PI / 2;
      cloud.userData.speed = 0.5 + Math.random() * 1.5;
      cloud.userData.baseOpacity = 0.3 + Math.random() * 0.4;
      
      this.cloudMeshes.push(cloud);
      this.scene.add(cloud);
    }
  }
  
  setWeather(weather, instant = false) {
    this.targetWeather = weather;
    
    if (instant) {
      this.currentWeather = weather;
      this.transitionProgress = 1;
      this.updateWeatherEffects();
    } else {
      this.transitionProgress = 0;
    }
  }
  
  update(dt) {
    // Handle weather transition
    if (this.transitionProgress < 1) {
      this.transitionProgress += dt / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.currentWeather = this.targetWeather;
        this.transitionProgress = 1;
      }
      this.updateWeatherEffects();
    }
    
    // Update rain particles
    if (this.rainIntensity > 0 && this.rainParticles) {
      this.updateRain(dt);
    }
    
    // Update clouds
    this.updateClouds(dt);
    
    // Update time of day
    if (this.dayNightCycle) {
      this.updateTimeOfDay(dt);
    }
    
    // Random lightning during storms
    if (this.currentWeather === 'storm' && Math.random() < 0.001) {
      this.triggerLightning();
    }
  }
  
  updateWeatherEffects() {
    const t = this.transitionProgress;
    
    // Interpolate between current and target weather
    const weatherParams = this.getWeatherParams(this.currentWeather);
    const targetParams = this.getWeatherParams(this.targetWeather);
    
    this.cloudCover = weatherParams.cloudCover + (targetParams.cloudCover - weatherParams.cloudCover) * t;
    this.rainIntensity = weatherParams.rainIntensity + (targetParams.rainIntensity - weatherParams.rainIntensity) * t;
    this.fogDensity = weatherParams.fogDensity + (targetParams.fogDensity - weatherParams.fogDensity) * t;
    this.sunIntensity = weatherParams.sunIntensity + (targetParams.sunIntensity - weatherParams.sunIntensity) * t;
    
    // Update rain visibility
    if (this.rainParticles) {
      this.rainParticles.visible = this.rainIntensity > 0.1;
    }
    
    // Update scene fog
    this.scene.fog = new THREE.FogExp2(0xaaaaaa, this.fogDensity * 0.02);
    
    // Update gameplay effects
    this.roadFriction = 1.0 - this.rainIntensity * 0.6; // Wet roads
    this.visibility = 1.0 - this.fogDensity * 0.9; // Fog reduces visibility
    
    // Update scene background
    const bgColor = new THREE.Color().lerpColors(
      new THREE.Color(0x87ceeb), // Clear blue
      new THREE.Color(0x4a4a4a), // Storm grey
      this.cloudCover
    );
    this.scene.background = bgColor;
  }
  
  getWeatherParams(weather) {
    switch(weather) {
      case 'clear':
        return { cloudCover: 0, rainIntensity: 0, fogDensity: 0, sunIntensity: 1.0 };
      case 'cloudy':
        return { cloudCover: 0.6, rainIntensity: 0, fogDensity: 0, sunIntensity: 0.7 };
      case 'rain':
        return { cloudCover: 0.8, rainIntensity: 0.4, fogDensity: 0.1, sunIntensity: 0.4 };
      case 'heavy_rain':
        return { cloudCover: 0.9, rainIntensity: 0.8, fogDensity: 0.2, sunIntensity: 0.2 };
      case 'fog':
        return { cloudCover: 0.3, rainIntensity: 0, fogDensity: 0.7, sunIntensity: 0.5 };
      case 'storm':
        return { cloudCover: 1.0, rainIntensity: 0.9, fogDensity: 0.3, sunIntensity: 0.1 };
      default:
        return { cloudCover: 0, rainIntensity: 0, fogDensity: 0, sunIntensity: 1.0 };
    }
  }
  
  updateRain(dt) {
    const positions = this.rainParticles.geometry.attributes.position.array;
    const velocities = this.rainParticles.geometry.attributes.velocity.array;
    const count = positions.length / 3;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Fall down
      positions[i3 + 1] -= velocities[i] * dt * (0.5 + this.rainIntensity);
      
      // Wind effect
      positions[i3] += this.windSpeed * this.windDirection.x * dt * 0.1;
      positions[i3 + 2] += this.windSpeed * this.windDirection.z * dt * 0.1;
      
      // Reset when below ground
      if (positions[i3 + 1] < 0) {
        positions[i3] = this.camera.position.x + (Math.random() - 0.5) * 100;
        positions[i3 + 1] = 50;
        positions[i3 + 2] = this.camera.position.z + (Math.random() - 0.5) * 100;
      }
    }
    
    this.rainParticles.geometry.attributes.position.needsUpdate = true;
    this.rainParticles.material.opacity = this.rainIntensity * 0.6;
  }
  
  updateClouds(dt) {
    for (const cloud of this.cloudMeshes) {
      cloud.position.x += cloud.userData.speed * dt;
      
      // Wrap around
      if (cloud.position.x > 150) cloud.position.x = -150;
      
      // Adjust opacity based on cloud cover
      cloud.material.opacity = cloud.userData.baseOpacity * this.cloudCover;
    }
  }
  
  updateTimeOfDay(dt) {
    this.timeOfDay += dt * this.timeSpeed * 0.01; // Slow progression
    if (this.timeOfDay >= 24) this.timeOfDay = 0;
    
    // Update sun position
    const angle = (this.timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
    
    if (this.scene.sunLight) {
      this.scene.sunLight.position.set(
        Math.cos(angle) * 100,
        Math.sin(angle) * 100,
        50
      );
      
      // Adjust sun intensity based on time
      const dayFactor = Math.max(0, Math.sin(angle));
      this.scene.sunLight.intensity = dayFactor * this.sunIntensity;
      
      // Color temperature
      if (this.timeOfDay < 6 || this.timeOfDay > 18) {
        // Night - blue tint
        this.scene.sunLight.color.setHex(0x334466);
      } else if (this.timeOfDay < 8 || this.timeOfDay > 16) {
        // Golden hour
        this.scene.sunLight.color.setHex(0xffaa66);
      } else {
        // Day
        this.scene.sunLight.color.setHex(0xffffff);
      }
    }
    
    // Update ambient
    if (this.scene.ambientLight) {
      const nightFactor = Math.max(0.1, Math.sin(angle));
      this.scene.ambientLight.intensity = nightFactor * 0.4;
    }
  }
  
  triggerLightning() {
    // Flash effect
    const flash = new THREE.PointLight(0xffffff, 10, 500);
    flash.position.set(
      (Math.random() - 0.5) * 200,
      80,
      (Math.random() - 0.5) * 200
    );
    this.scene.add(flash);
    
    // Fade out
    const fade = () => {
      flash.intensity *= 0.9;
      if (flash.intensity > 0.1) {
        requestAnimationFrame(fade);
      } else {
        this.scene.remove(flash);
      }
    };
    fade();
    
    // TODO: Play thunder sound
  }
  
  // Mumbai monsoon mode (June-September)
  enableMonsoon() {
    this.monsoonMode = true;
    this.setWeather('heavy_rain');
    this.windSpeed = 15;
    
    // Increase rain frequency
    this.weatherChangeInterval = 30; // Change every 30 seconds
  }
  
  // Summer heat haze
  enableHeatHaze() {
    this.heatHaze = true;
    this.setWeather('clear');
    
    // Add heat shimmer effect (would need custom shader)
  }
  
  // Get current gameplay modifiers
  getGameplayModifiers() {
    return {
      roadFriction: this.roadFriction,
      visibility: this.visibility,
      windSpeed: this.windSpeed,
      windDirection: this.windDirection.clone(),
      isRaining: this.rainIntensity > 0.3,
      isFoggy: this.fogDensity > 0.3,
      isNight: this.timeOfDay < 6 || this.timeOfDay > 18,
      timeOfDay: this.timeOfDay
    };
  }
}

if (typeof window !== 'undefined') {
  window.WeatherSystem = WeatherSystem;
}
