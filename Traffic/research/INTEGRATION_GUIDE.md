# 🎮 Mumbai Traffic Hero - Feature Integration Guide
## How to Add New Features to game_core.js

---

## Quick Start: Adding New Systems

### Step 1: Add Script Tags to Driving.html

Add these scripts BEFORE `game_core.js` in your `Driving.html`:

```html
<!-- New AI & Systems (add before game_core.js) -->
<script defer src="research/TrafficAI.js"></script>
<script defer src="research/TrafficLight.js"></script>
<script defer src="research/PedestrianAI.js"></script>
<script defer src="research/WeatherSystem.js"></script>
<script defer src="research/CityBuilder.js"></script>
```

### Step 2: Initialize Systems in game_core.js

Add to the `_initG()` function (around line where game state is initialized):

```javascript
// Initialize new systems
this.initTrafficSystems = function() {
  // Asset manager
  this.assetManager = new AssetManager();
  
  // Traffic Light System
  this.trafficLightSystem = new TrafficLightSystem(this.scene, this.roadGraph);
  this.trafficLightSystem.spawnAtAllIntersections();
  
  // Traffic AI Manager
  this.trafficManager = new TrafficManager(this.scene, this.roadGraph);
  
  // Pedestrian Manager
  this.pedestrianManager = new PedestrianManager(this.scene, this.roadGraph);
  
  // Weather System
  this.weatherSystem = new WeatherSystem(this.scene, this.camera);
  
  // City Builder (for free roam mode)
  this.cityBuilder = new CityBuilder(this.scene, this.roadGraph, this.assetManager);
  
  console.log('Traffic systems initialized');
};
```

### Step 3: Update Game Loop

Add to the `_loop()` function:

```javascript
// Update traffic systems
if (this.trafficLightSystem) {
  this.trafficLightSystem.update(dt);
}

if (this.trafficManager) {
  this.trafficManager.update(dt, this.camera.position, this.trafficLightSystem.lights);
}

if (this.pedestrianManager) {
  const context = {
    player: this.camera.position,
    vehicles: this.trafficManager.vehicles,
    trafficLights: this.trafficLightSystem.lights,
    roadDirection: new THREE.Vector3(1, 0, 0)
  };
  this.pedestrianManager.update(dt, context);
}

if (this.weatherSystem) {
  this.weatherSystem.update(dt);
}

if (this.cityBuilder && this.freeRoamMode) {
  this.cityBuilder.streamer.update(dt, this.camera.position);
}
```

### Step 4: Apply Weather Effects to Vehicle

In your vehicle physics update:

```javascript
// Apply weather modifiers
if (this.weatherSystem) {
  const mods = this.weatherSystem.getGameplayModifiers();
  
  // Reduce grip in rain
  this.tireGrip *= mods.roadFriction;
  
  // Reduce visibility in fog
  this.camera.far = 500 * mods.visibility;
  
  // Headlights required at night
  if (mods.isNight && !this.headlightsOn) {
    this.showHint('Turn on headlights! (Press L)');
  }
}
```

---

## Free Roam Mode Implementation

### Adding Free Roam to Game Modes

```javascript
// In course.js, add:
const MODES = {
  // ... existing modes
  FREE_ROAM: { 
    id: 'free_roam', 
    label: 'FREE ROAM', 
    icon: '🌆', 
    color: '--em', 
    desc: 'Explore the city freely' 
  }
};

// Free roam level config
const FREE_ROAM_LEVEL = {
  id: 'mumbai_free_roam',
  name: 'Mumbai Free Roam',
  type: 'free_roam',
  roads: [
    // Major roads
    { type:'v', x:0, z1:-1000, z2:1000, lanes:3, width:21, speedLimit:60, roadType:'arterial' },
    { type:'v', x:200, z1:-1000, z2:1000, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'v', x:-200, z1:-1000, z2:1000, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'v', x:400, z1:-1000, z2:1000, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'v', x:-400, z1:-1000, z2:1000, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'h', z:0, x1:-600, x2:600, lanes:3, width:21, speedLimit:60, roadType:'arterial' },
    { type:'h', z:300, x1:-600, x2:600, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'h', z:-300, x1:-600, x2:600, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'h', z:600, x1:-600, x2:600, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'h', z:-600, x1:-600, x2:600, lanes:2, width:14, speedLimit:40, roadType:'local' },
  ],
  anchorNodes: [
    // Commercial district
    { x:0, z:0, zone:'commercial' },
    { x:50, z:50, zone:'commercial' },
    { x:-50, z:-50, zone:'commercial' },
    // Residential areas
    { x:300, z:150, zone:'residential' },
    { x:-300, z:-150, zone:'residential' },
    // Market area
    { x:100, z:-200, zone:'market' },
    { x:-100, z:200, zone:'market' },
    // Industrial
    { x:400, z:-400, zone:'industrial' },
    { x:-400, z:400, zone:'industrial' },
  ],
  trafficDensity: 0.7,
  pedestrianDensity: 0.5,
  weather: 'clear',
  timeOfDay: 14
};
```

---

## Free Asset Download Script

Run this in browser console on Sketchfab to find CC0 models, or use the direct links below.

### Direct Download Links (CC0 - No Attribution Required):

```javascript
// Kenney City Kit - BEST OPTION
// Download from: https://kenney.nl/assets/city-kit
// Includes: 100+ buildings, roads, props
// License: CC0 (public domain)
// Format: GLB, FBX, OBJ

// Kenney City Kit Suburban
// Download from: https://kenney.nl/assets/city-kit-suburban
// Includes: 40+ houses and residential buildings
// License: CC0

// Kenney City Kit Roads
// Download from: https://kenney.nl/assets/city-kit-roads
// Includes: 72 road pieces (straight, curves, intersections)
// License: CC0

// Kenney Vehicle Pack
// Download from: https://kenney.nl/assets/vehicle-pack
// Includes: 20+ vehicles (cars, trucks, buses)
// License: CC0

// Kenney Characters
// Download from: https://kenney.nl/assets/characters
// Includes: Character models
// License: CC0
```

### How to Import GLB Models into Three.js:

```javascript
// In game_core.js or a new asset loader:
const loader = new THREE.GLTFLoader();

function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      resolve(gltf.scene);
    }, undefined, reject);
  });
}

// Usage:
async function loadCityAssets() {
  const building = await loadModel('Models/city_kit_buildings.glb');
  const roads = await loadModel('Models/city_kit_roads.glb');
  const props = await loadModel('Models/city_kit_props.glb');
  
  // Store for later use
  this.cityAssets = { building, roads, props };
}
```

---

## Feature Priority Checklist

### Phase 1: Traffic AI (Week 1)
- [ ] Copy `TrafficAI.js` to project
- [ ] Add script tag to Driving.html
- [ ] Initialize TrafficManager in `_initG()`
- [ ] Call `trafficManager.update()` in game loop
- [ ] Create vehicle templates for spawning
- [ ] Test with 10-20 AI vehicles

### Phase 2: Traffic Lights (Week 2)
- [ ] Copy `TrafficLight.js` to project
- [ ] Add script tag
- [ ] Initialize TrafficLightSystem
- [ ] Spawn lights at all intersections
- [ ] Make AI obey traffic lights
- [ ] Add red-light violation detection

### Phase 3: Pedestrians (Week 3)
- [ ] Copy `PedestrianAI.js` to project
- [ ] Add script tag
- [ ] Initialize PedestrianManager
- [ ] Spawn pedestrians near roads
- [ ] Add pedestrian crossing logic
- [ ] Test pedestrian-vehicle interaction

### Phase 4: Weather (Week 4)
- [ ] Copy `WeatherSystem.js` to project
- [ ] Add script tag
- [ ] Initialize WeatherSystem
- [ ] Add weather UI controls
- [ ] Connect weather to vehicle physics
- [ ] Test rain, fog, and storms

### Phase 5: Free Roam City (Week 5-6)
- [ ] Copy `CityBuilder.js` to project
- [ ] Download Kenney City Kit assets
- [ ] Add assets to Models/ folder
- [ ] Initialize CityBuilder
- [ ] Create free roam level config
- [ ] Test chunk streaming

### Phase 6: Polish (Week 7-8)
- [ ] Add sound effects (rain, engines, horns)
- [ ] Improve AI behaviors
- [ ] Add more vehicle types
- [ ] Optimize performance
- [ ] Mobile testing

---

## Performance Tips

1. **Use InstancedMesh** for repeated objects (buildings, trees)
2. **Frustum culling** - Three.js does this automatically
3. **LOD (Level of Detail)** - Use simpler models for distant objects
4. **Object pooling** - Already implemented in pools.js
5. **Chunk streaming** - Only load nearby city sections
6. **Limit AI count** - Max 20 vehicles, 30 pedestrians
7. **Web Workers** - Move AI calculations to separate thread

---

## Testing Checklist

- [ ] Traffic AI follows roads
- [ ] Traffic AI stops at red lights
- [ ] Traffic AI changes lanes
- [ ] Pedestrians cross roads
- [ ] Pedestrians wait for green light
- [ ] Weather affects vehicle grip
- [ ] Rain particles visible
- [ ] Fog reduces visibility
- [ ] Day/night cycle works
- [ ] City chunks load/unload
- [ ] No memory leaks
- [ ] 60 FPS on mid-range device
- [ ] Mobile touch controls work

---

*Integration guide for Mumbai Traffic Hero development*
