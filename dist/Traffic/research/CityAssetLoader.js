// CityAssetLoader.js - Load free city assets from Poly Pizza and Kenney
// Version: 1.0.0
// Description: Pre-configured loader for Mumbai Traffic Hero free roam

class CityAssetLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new THREE.GLTFLoader();
    this.assets = {
      buildings: [],
      roads: [],
      vehicles: [],
      props: [],
      vegetation: [],
      characters: []
    };
    this.loaded = false;
    this.onProgress = null;
    this.onComplete = null;
  }
  
  // Load all city assets
  async loadAll(progressCallback, completeCallback) {
    this.onProgress = progressCallback;
    this.onComplete = completeCallback;
    
    const totalAssets = this.getAssetList().length;
    let loaded = 0;
    
    for (const asset of this.getAssetList()) {
      try {
        const model = await this.loadModel(asset.path);
        
        // Categorize
        if (model) {
          model.userData = { 
            name: asset.name,
            license: asset.license,
            creator: asset.creator
          };
          
          if (asset.category === 'building') this.assets.buildings.push(model);
          else if (asset.category === 'road') this.assets.roads.push(model);
          else if (asset.category === 'vehicle') this.assets.vehicles.push(model);
          else if (asset.category === 'prop') this.assets.props.push(model);
          else if (asset.category === 'vegetation') this.assets.vegetation.push(model);
          else if (asset.category === 'character') this.assets.characters.push(model);
        }
      } catch (e) {
        console.warn(`Failed to load ${asset.path}:`, e);
      }
      
      loaded++;
      if (this.onProgress) {
        this.onProgress(loaded / totalAssets, asset.name);
      }
    }
    
    this.loaded = true;
    if (this.onComplete) {
      this.onComplete(this.assets);
    }
    
    return this.assets;
  }
  
  // Load a single GLB/GLTF model
  loadModel(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  // Get the full asset list
  getAssetList() {
    return [
      // === KENNEY CITY KIT (CC0) ===
      { path: 'Models/kenney/city-kit/building-a.glb', name: 'Building A', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-b.glb', name: 'Building B', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-c.glb', name: 'Building C', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-d.glb', name: 'Building D', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-e.glb', name: 'Building E', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-f.glb', name: 'Building F', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-g.glb', name: 'Building G', category: 'building', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/building-h.glb', name: 'Building H', category: 'building', license: 'CC0', creator: 'Kenney' },
      
      // === KENNEY ROADS (CC0) ===
      { path: 'Models/kenney/city-kit/road-straight.glb', name: 'Road Straight', category: 'road', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/road-crossroads.glb', name: 'Road Crossroads', category: 'road', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/road-corner.glb', name: 'Road Corner', category: 'road', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/road-t.glb', name: 'Road T', category: 'road', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/city-kit/road-end.glb', name: 'Road End', category: 'road', license: 'CC0', creator: 'Kenney' },
      
      // === KENNEY VEHICLES (CC0) ===
      { path: 'Models/kenney/vehicles/car-sedan.glb', name: 'Sedan', category: 'vehicle', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/vehicles/car-hatchback.glb', name: 'Hatchback', category: 'vehicle', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/vehicles/car-police.glb', name: 'Police Car', category: 'vehicle', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/vehicles/truck.glb', name: 'Truck', category: 'vehicle', license: 'CC0', creator: 'Kenney' },
      { path: 'Models/kenney/vehicles/bus.glb', name: 'Bus', category: 'vehicle', license: 'CC0', creator: 'Kenney' },
      
      // === POLY PIZZA - J-TOASTIE (CC-BY) ===
      { path: 'Models/poly-pizza/building-green.glb', name: 'Green Building', category: 'building', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/building-red.glb', name: 'Red Building', category: 'building', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/building-brown.glb', name: 'Brown Building', category: 'building', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/pizza-corner.glb', name: 'Pizza Corner', category: 'building', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/greenhouse.glb', name: 'Greenhouse', category: 'building', license: 'CC-BY', creator: 'J-Toastie' },
      
      // === POLY PIZZA - VEHICLES (CC-BY) ===
      { path: 'Models/poly-pizza/bus-google.glb', name: 'Bus', category: 'vehicle', license: 'CC-BY', creator: 'Poly by Google' },
      { path: 'Models/poly-pizza/van-google.glb', name: 'Van', category: 'vehicle', license: 'CC-BY', creator: 'Poly by Google' },
      { path: 'Models/poly-pizza/motorcycle-google.glb', name: 'Motorcycle', category: 'vehicle', license: 'CC-BY', creator: 'Poly by Google' },
      { path: 'Models/poly-pizza/bicycle-google.glb', name: 'Bicycle', category: 'vehicle', license: 'CC-BY', creator: 'Poly by Google' },
      
      // === POLY PIZZA - PROPS (CC-BY) ===
      { path: 'Models/poly-pizza/cone.glb', name: 'Traffic Cone', category: 'prop', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/mailbox.glb', name: 'Mailbox', category: 'prop', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/atm.glb', name: 'ATM', category: 'prop', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/power-box.glb', name: 'Power Box', category: 'prop', license: 'CC-BY', creator: 'J-Toastie' },
      { path: 'Models/poly-pizza/bench.glb', name: 'Bench', category: 'prop', license: 'CC-BY', creator: 'Danni Bittman' },
      { path: 'Models/poly-pizza/fire-hydrant.glb', name: 'Fire Hydrant', category: 'prop', license: 'CC-BY', creator: 'Poly by Google' },
      { path: 'Models/poly-pizza/trash-can.glb', name: 'Trash Can', category: 'prop', license: 'CC-BY', creator: 'Zsky' },
      
      // === POLY PIZZA - VEGETATION (CC-BY) ===
      { path: 'Models/poly-pizza/tree-google.glb', name: 'Tree', category: 'vegetation', license: 'CC-BY', creator: 'Poly by Google' },
      { path: 'Models/poly-pizza/planter-bushes.glb', name: 'Planter & Bushes', category: 'vegetation', license: 'CC-BY', creator: 'J-Toastie' },
      
      // === POLY PIZZA - CHARACTERS (CC0) ===
      { path: 'Models/poly-pizza/man-quaternius.glb', name: 'Man', category: 'character', license: 'CC0', creator: 'Quaternius' },
      { path: 'Models/poly-pizza/woman-quaternius.glb', name: 'Woman', category: 'character', license: 'CC0', creator: 'Quaternius' },
    ];
  }
  
  // Get a random building
  getRandomBuilding() {
    if (this.assets.buildings.length === 0) return null;
    return this.assets.buildings[Math.floor(Math.random() * this.assets.buildings.length)].clone();
  }
  
  // Get a random vehicle
  getRandomVehicle() {
    if (this.assets.vehicles.length === 0) return null;
    return this.assets.vehicles[Math.floor(Math.random() * this.assets.vehicles.length)].clone();
  }
  
  // Get a random prop
  getRandomProp() {
    if (this.assets.props.length === 0) return null;
    return this.assets.props[Math.floor(Math.random() * this.assets.props.length)].clone();
  }
  
  // Get a random tree/vegetation
  getRandomTree() {
    if (this.assets.vegetation.length === 0) return null;
    return this.assets.vegetation[Math.floor(Math.random() * this.assets.vegetation.length)].clone();
  }
  
  // Get a random character
  getRandomCharacter() {
    if (this.assets.characters.length === 0) return null;
    return this.assets.characters[Math.floor(Math.random() * this.assets.characters.length)].clone();
  }
  
  // Get buildings by license
  getBuildingsByLicense(license) {
    return this.assets.buildings.filter(b => b.userData.license === license);
  }
  
  // Place a building at position
  placeBuilding(position, rotation = 0) {
    const building = this.getRandomBuilding();
    if (!building) return null;
    
    building.position.copy(position);
    building.rotation.y = rotation;
    this.scene.add(building);
    
    return building;
  }
  
  // Place a vehicle at position
  placeVehicle(position, rotation = 0) {
    const vehicle = this.getRandomVehicle();
    if (!vehicle) return null;
    
    vehicle.position.copy(position);
    vehicle.rotation.y = rotation;
    vehicle.userData.speed = 0;
    this.scene.add(vehicle);
    
    return vehicle;
  }
  
  // Place a prop at position
  placeProp(position, rotation = 0) {
    const prop = this.getRandomProp();
    if (!prop) return null;
    
    prop.position.copy(position);
    prop.rotation.y = rotation;
    this.scene.add(prop);
    
    return prop;
  }
  
  // Place a tree at position
  placeTree(position) {
    const tree = this.getRandomTree();
    if (!tree) return null;
    
    tree.position.copy(position);
    this.scene.add(tree);
    
    return tree;
  }
}

// Quick-start integration
class MumbaiCityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.assetLoader = new CityAssetLoader(scene);
    this.buildings = [];
    this.vehicles = [];
    this.props = [];
  }
  
  // Load all assets and build city
  async build(playerPosition = new THREE.Vector3()) {
    console.log('Loading city assets...');
    
    await this.assetLoader.loadAll(
      (progress, name) => {
        console.log(`Loading: ${name} (${Math.round(progress * 100)}%)`);
      },
      (assets) => {
        console.log('Assets loaded!', assets);
      }
    );
    
    // Build around player
    this.buildAroundPlayer(playerPosition);
  }
  
  // Build city around player position
  buildAroundPlayer(center) {
    const gridSize = 10; // 10x10 blocks
    const blockSize = 30; // meters per block
    
    for (let x = -gridSize/2; x < gridSize/2; x++) {
      for (let z = -gridSize/2; z < gridSize/2; z++) {
        const worldX = center.x + x * blockSize;
        const worldZ = center.z + z * blockSize;
        
        // Skip some blocks for variety
        if (Math.random() < 0.2) continue;
        
        // Place building
        const pos = new THREE.Vector3(worldX, 0, worldZ);
        this.assetLoader.placeBuilding(pos, Math.random() * Math.PI * 2);
        
        // Place tree every few blocks
        if (Math.random() < 0.3) {
          const treePos = pos.clone();
          treePos.x += (Math.random() - 0.5) * 20;
          treePos.z += (Math.random() - 0.5) * 20;
          this.assetLoader.placeTree(treePos);
        }
      }
    }
    
    // Place some vehicles on roads
    for (let i = 0; i < 20; i++) {
      const vPos = new THREE.Vector3(
        center.x + (Math.random() - 0.5) * 200,
        0,
        center.z + (Math.random() - 0.5) * 200
      );
      this.assetLoader.placeVehicle(vPos, Math.random() * Math.PI * 2);
    }
    
    console.log('City built!');
  }
}

// Export
if (typeof window !== 'undefined') {
  window.CityAssetLoader = CityAssetLoader;
  window.MumbaiCityBuilder = MumbaiCityBuilder;
}
