// CityBuilder.js - Procedural City Builder for Mumbai Traffic Hero
// Version: 1.0.0
// Description: Build explorable city from modular assets with chunk streaming

class CityBuilder {
  constructor(scene, roadGraph, assetManager) {
    this.scene = scene;
    this.roadGraph = roadGraph;
    this.assetManager = assetManager;
    
    // City configuration
    this.chunkSize = 200; // meters per chunk
    this.loadRadius = 3; // chunks to load around player
    this.unloadRadius = 5; // chunks to unload
    
    // Chunk management
    this.loadedChunks = new Map(); // key: "x,z" -> chunkData
    this.chunkPool = new Map(); // Object pool for chunks
    
    // City data
    this.buildings = [];
    this.props = [];
    this.vegetation = [];
    this.roadMeshes = [];
    
    // Placement rules
    this.minBuildingSpacing = 15;
    this.sidewalkWidth = 4;
    this.laneWidth = 3.5;
    
    // Mumbai-specific zones
    this.zones = {
      commercial: { density: 0.8, heightRange: [10, 40], color: 0x888888 },
      residential: { density: 0.6, heightRange: [5, 15], color: 0xaa8866 },
      industrial: { density: 0.4, heightRange: [8, 20], color: 0x666666 },
      market: { density: 0.9, heightRange: [3, 8], color: 0xcc8844 },
      slum: { density: 0.95, heightRange: [2, 5], color: 0x997755 }
    };
    
    // Streaming
    this.streamer = null;
  }
  
  async initialize() {
    // Load asset packs
    await this.loadAssetPacks();
    
    // Build initial city
    this.buildCityFromGraph();
    
    // Initialize streaming
    this.streamer = new WorldStreamer(this);
  }
  
  async loadAssetPacks() {
    const loader = new THREE.GLTFLoader();
    
    // Load Kenney City Kit assets (or similar)
    const assetUrls = [
      'Models/city_kit_buildings.glb',
      'Models/city_kit_roads.glb',
      'Models/city_kit_props.glb',
      'Models/indian_vehicles.glb',
      'Models/indian_props.glb'
    ];
    
    for (const url of assetUrls) {
      try {
        const gltf = await this.loadGLTF(loader, url);
        this.assetManager.addModels(url, gltf.scene);
      } catch (e) {
        console.warn(`Failed to load ${url}, using procedural fallback`);
      }
    }
  }
  
  loadGLTF(loader, url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }
  
  buildCityFromGraph() {
    if (!this.roadGraph) return;
    
    // Place buildings along roads
    this.roadGraph.edges.forEach(edge => {
      this.placeBuildingsAlongEdge(edge);
    });
    
    // Place intersections
    this.roadGraph.nodes.forEach(node => {
      if (node.type === 'junction') {
        this.placeIntersection(node);
      }
    });
    
    // Place vegetation
    this.placeVegetation();
    
    // Place street props
    this.placeStreetProps();
  }
  
  placeBuildingsAlongEdge(edge) {
    const length = edge.length;
    const buildingCount = Math.floor(length / this.minBuildingSpacing);
    
    // Determine zone from edge metadata
    const zone = edge.metadata?.zone || 'commercial';
    const zoneConfig = this.zones[zone] || this.zones.commercial;
    
    for (let i = 0; i < buildingCount; i++) {
      // Skip based on density
      if (Math.random() > zoneConfig.density) continue;
      
      const t = (i + 0.5) / buildingCount;
      const center = edge.getPointAt(t);
      
      // Alternate sides of road
      const side = i % 2 === 0 ? 1 : -1;
      const offset = edge.width / 2 + this.sidewalkWidth + 5;
      
      const perpendicular = new THREE.Vector3(
        -edge.direction.z, 0, edge.direction.x
      ).multiplyScalar(offset * side);
      
      const buildingPos = center.clone().add(perpendicular);
      
      // Create building
      this.createBuilding(buildingPos, edge, zoneConfig);
    }
  }
  
  createBuilding(position, edge, zoneConfig) {
    // Random height within zone range
    const height = zoneConfig.heightRange[0] + 
      Math.random() * (zoneConfig.heightRange[1] - zoneConfig.heightRange[0]);
    
    const width = 8 + Math.random() * 12;
    const depth = 8 + Math.random() * 12;
    
    // Building geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Material with zone color and slight variation
    const color = new THREE.Color(zoneConfig.color);
    color.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.1);
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.copy(position);
    building.position.y = height / 2;
    
    // Face the road
    building.rotation.y = Math.atan2(edge.direction.x, edge.direction.z);
    
    // Add windows (simple texture or geometry)
    this.addWindowsToBuilding(building, width, height, depth);
    
    // Add shadow
    building.castShadow = true;
    building.receiveShadow = true;
    
    this.scene.add(building);
    this.buildings.push(building);
    
    return building;
  }
  
  addWindowsToBuilding(building, width, height, depth) {
    // Simple window pattern using smaller boxes
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x222222,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const floorHeight = 3;
    const floors = Math.floor(height / floorHeight);
    const windowsPerFloor = Math.floor(width / 3);
    
    for (let floor = 0; floor < floors; floor++) {
      for (let w = 0; w < windowsPerFloor; w++) {
        if (Math.random() < 0.3) continue; // Some windows dark
        
        const window = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 1.8),
          windowMat
        );
        
        // Front face
        const x = (w - windowsPerFloor / 2) * 2.5;
        const y = floor * floorHeight + 2;
        
        window.position.set(x, y, depth / 2 + 0.01);
        building.add(window);
        
        // Back face
        const windowBack = window.clone();
        windowBack.position.z = -depth / 2 - 0.01;
        windowBack.rotation.y = Math.PI;
        building.add(windowBack);
      }
    }
  }
  
  placeIntersection(node) {
    // Add traffic lights at major intersections
    if (node.edges.length >= 3) {
      // Traffic light placement handled by TrafficLightSystem
    }
    
    // Add central decoration (roundabout, statue, etc.)
    if (Math.random() < 0.3) {
      this.createRoundabout(node);
    }
  }
  
  createRoundabout(node) {
    const center = new THREE.Vector3(node.position.x, 0, node.position.z);
    
    // Central island
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x44aa44 })
    );
    island.position.y = 0.15;
    island.position.copy(center);
    this.scene.add(island);
    
    // Fountain or statue
    if (Math.random() < 0.5) {
      const fountain = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, 1, 12),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      fountain.position.y = 0.8;
      fountain.position.copy(center);
      this.scene.add(fountain);
    }
  }
  
  placeVegetation() {
    // Place trees along sidewalks
    if (!this.roadGraph) return;
    
    this.roadGraph.edges.forEach(edge => {
      const treeCount = Math.floor(edge.length / 25);
      
      for (let i = 0; i < treeCount; i++) {
        const t = (i + 0.5) / treeCount;
        const pos = edge.getPointAt(t);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const offset = edge.width / 2 + this.sidewalkWidth - 1;
        
        const perpendicular = new THREE.Vector3(
          -edge.direction.z, 0, edge.direction.x
        ).multiplyScalar(offset * side);
        
        const treePos = pos.clone().add(perpendicular);
        this.createTree(treePos);
      }
    });
  }
  
  createTree(position) {
    const height = 4 + Math.random() * 4;
    
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, height * 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x664422 })
    );
    trunk.position.y = height * 0.2;
    trunk.castShadow = true;
    
    // Canopy
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(height * 0.35, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x228833 })
    );
    canopy.position.y = height * 0.6;
    canopy.castShadow = true;
    
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(canopy);
    tree.position.copy(position);
    
    this.scene.add(tree);
    this.vegetation.push(tree);
  }
  
  placeStreetProps() {
    // Place bus stops, street vendors, etc.
    if (!this.roadGraph) return;
    
    this.roadGraph.nodes.forEach(node => {
      if (Math.random() < 0.2) {
        this.createBusStop(node.position);
      }
      if (Math.random() < 0.1) {
        this.createStreetVendor(node.position);
      }
    });
  }
  
  createBusStop(position) {
    // Bus stop shelter
    const shelter = new THREE.Group();
    
    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.2, 2),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    roof.position.y = 2.5;
    
    // Back wall
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    wall.position.set(0, 1.25, -0.9);
    
    // Bench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    bench.position.set(0, 0.5, 0);
    
    // Sign
    const sign = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    sign.position.set(2.5, 1.5, 0);
    
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    signBoard.position.set(2.5, 2.8, 0);
    
    shelter.add(roof, wall, bench, sign, signBoard);
    shelter.position.copy(position);
    shelter.position.x += 6; // Offset from road
    
    this.scene.add(shelter);
    this.props.push(shelter);
  }
  
  createStreetVendor(position) {
    // Simple cart
    const cart = new THREE.Group();
    
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xcc6600 })
    );
    body.position.y = 0.8;
    
    const wheels = [];
    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(
        (i % 2 === 0 ? -0.6 : 0.6),
        0.2,
        (i < 2 ? -0.4 : 0.4)
      );
      wheels.push(wheel);
      cart.add(wheel);
    }
    
    // Umbrella
    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0xff3300 })
    );
    umbrella.position.y = 2;
    
    cart.add(body, umbrella);
    cart.position.copy(position);
    cart.position.x += 5;
    
    this.scene.add(cart);
    this.props.push(cart);
  }
  
  // Chunk-based streaming for large cities
  updateStreaming(playerPosition) {
    const cx = Math.floor(playerPosition.x / this.chunkSize);
    const cz = Math.floor(playerPosition.z / this.chunkSize);
    
    // Load nearby chunks
    for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
      for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        if (!this.loadedChunks.has(key)) {
          this.loadChunk(cx + dx, cz + dz);
        }
      }
    }
    
    // Unload far chunks
    const toUnload = [];
    this.loadedChunks.forEach((chunk, key) => {
      const [kcx, kcz] = key.split(',').map(Number);
      if (Math.abs(kcx - cx) > this.unloadRadius || Math.abs(kcz - cz) > this.unloadRadius) {
        toUnload.push(key);
      }
    });
    
    toUnload.forEach(key => this.unloadChunk(key));
  }
  
  loadChunk(cx, cz) {
    const key = `${cx},${cz}`;
    const chunkData = {
      buildings: [],
      props: [],
      vegetation: [],
      roads: []
    };
    
    // Generate chunk content
    const chunkWorldX = cx * this.chunkSize;
    const chunkWorldZ = cz * this.chunkSize;
    
    // Place buildings in chunk
    for (let i = 0; i < 20; i++) {
      const x = chunkWorldX + (Math.random() - 0.5) * this.chunkSize;
      const z = chunkWorldZ + (Math.random() - 0.5) * this.chunkSize;
      const pos = new THREE.Vector3(x, 0, z);
      
      // Check if near road
      const nearRoad = this.isNearRoad(pos, 20);
      if (nearRoad) {
        const building = this.createBuilding(pos, nearRoad.edge, this.zones.commercial);
        chunkData.buildings.push(building);
      }
    }
    
    this.loadedChunks.set(key, chunkData);
  }
  
  unloadChunk(key) {
    const chunk = this.loadedChunks.get(key);
    if (!chunk) return;
    
    // Remove from scene
    chunk.buildings.forEach(b => this.scene.remove(b));
    chunk.props.forEach(p => this.scene.remove(p));
    chunk.vegetation.forEach(v => this.scene.remove(v));
    chunk.roads.forEach(r => this.scene.remove(r));
    
    this.loadedChunks.delete(key);
  }
  
  isNearRoad(position, maxDist) {
    if (!this.roadGraph) return null;
    
    let nearest = null;
    let minDist = maxDist;
    
    for (const edge of this.roadGraph.edges) {
      const dist = this.distanceToEdge(position, edge);
      if (dist < minDist) {
        minDist = dist;
        nearest = edge;
      }
    }
    
    return nearest ? { edge: nearest, distance: minDist } : null;
  }
  
  distanceToEdge(point, edge) {
    const a = edge.nodes[0].position;
    const b = edge.nodes[1].position;
    
    const ab = new THREE.Vector3().subVectors(b, a);
    const ap = new THREE.Vector3().subVectors(point, a);
    
    const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.dot(ab)));
    const closest = a.clone().add(ab.multiplyScalar(t));
    
    return point.distanceTo(closest);
  }
}

// World streamer for seamless open world
class WorldStreamer {
  constructor(cityBuilder) {
    this.cityBuilder = cityBuilder;
    this.updateInterval = 0.5; // Update every 0.5 seconds
    this.timer = 0;
  }
  
  update(dt, playerPosition) {
    this.timer += dt;
    if (this.timer >= this.updateInterval) {
      this.cityBuilder.updateStreaming(playerPosition);
      this.timer = 0;
    }
  }
}

// Asset manager for loading and caching models
class AssetManager {
  constructor() {
    this.models = new Map();
    this.textures = new Map();
    this.materials = new Map();
  }
  
  addModels(key, scene) {
    this.models.set(key, scene);
  }
  
  getModel(key) {
    const model = this.models.get(key);
    return model ? model.clone() : null;
  }
  
  getCategory(category) {
    const results = [];
    this.models.forEach((model, key) => {
      if (key.includes(category)) {
        results.push(model.clone());
      }
    });
    return results;
  }
  
  // Create procedural building as fallback
  createProceduralBuilding(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color || 0x888888,
      roughness: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  // Create procedural tree as fallback
  createProceduralTree(height) {
    const tree = new THREE.Group();
    
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, height * 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x664422 })
    );
    trunk.position.y = height * 0.2;
    
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(height * 0.35, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x228833 })
    );
    canopy.position.y = height * 0.6;
    
    tree.add(trunk);
    tree.add(canopy);
    
    return tree;
  }
}

if (typeof window !== 'undefined') {
  window.CityBuilder = CityBuilder;
  window.WorldStreamer = WorldStreamer;
  window.AssetManager = AssetManager;
}
