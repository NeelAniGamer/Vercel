window.LVS = window.LVS || []
window.LVS.push({
  id: 99,
  icon: '🌆',
  name: 'Free Roam - Mumbai City',
  modes: ['car', 'bike', 'auto', 'bus', 'truck'],
  col: '#34d399',
  ds: 'Explore the freely roads of Mumbai. Drive safely, follow traffic rules, and discover the city!',
  hps: [
    'Explore the city freely — no objectives, just drive!',
    'Follow traffic signals and speed limits.',
    'Watch for pedestrians crossing the road.',
    'Try different vehicles: car, bike, auto, bus, truck.',
    'Press M to toggle map view.'
  ],
  law: {
    sec: 'MV Act Section 119-184',
    fine: '₹500 - ₹10,000',
    off: 'Traffic Violations',
    secHi: 'मोटर वाहन अधिनियम धारा 119-184',
    fineHi: '₹500 - ₹10,000',
    offHi: 'ट्रैफिक उल्लंघन'
  },
  theory:
    '<h2>Mumbai Free Roam</h2><p>Welcome to Mumbai Traffic Hero Free Roam mode! Explore a large open city with realistic traffic, pedestrians, and dynamic weather.</p><p>Key features:</p><ul><li>Large open-world city to explore</li><li>Dynamic traffic AI with realistic behavior</li><li>Pedestrians crossing roads</li><li>Traffic lights at intersections</li><li>Weather effects: rain, fog, day/night cycle</li><li>Multiple vehicle types to drive</li></ul><p>Drive safely and enjoy the ride!</p>',
  pract: 'Drive freely through the city. Obey traffic rules, watch for pedestrians, and explore all areas.',
  mode: 'free_roam',
  themeType: 'free_roam',
  startOutside: false,
  tasks: [],
  assets: ['city_pack', 'kenney_city_kit', 'kenney_roads', 'kenney_vehicles'],
  
  // Free roam configuration
  freeRoam: true,
  citySize: 800, // 800x800 meters
  chunkSize: 100,
  trafficDensity: 0.6,
  pedestrianDensity: 0.4,
  weatherCycle: true,
  dayNightCycle: true,
  
  // Road grid for free roam
  roads: [
    // Main arterial roads (3 lanes each way)
    { type:'v', x:0, z1:-400, z2:400, lanes:3, width:21, speedLimit:60, roadType:'arterial' },
    { type:'v', x:200, z1:-400, z2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'v', x:-200, z1:-400, z2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'v', x:400, z1:-400, z2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'v', x:-400, z1:-400, z2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    
    // Local roads (2 lanes)
    { type:'v', x:100, z1:-400, z2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'v', x:-100, z1:-400, z2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'v', x:300, z1:-400, z2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'v', x:-300, z1:-400, z2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    
    // Horizontal arterial roads
    { type:'h', z:0, x1:-400, x2:400, lanes:3, width:21, speedLimit:60, roadType:'arterial' },
    { type:'h', z:200, x1:-400, x2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'h', z:-200, x1:-400, x2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'h', z:400, x1:-400, x2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    { type:'h', z:-400, x1:-400, x2:400, lanes:2, width:14, speedLimit:50, roadType:'collector' },
    
    // Horizontal local roads
    { type:'h', z:100, x1:-400, x2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'h', z:-100, x1:-400, x2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'h', z:300, x1:-400, x2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
    { type:'h', z:-300, x1:-400, x2:400, lanes:2, width:14, speedLimit:40, roadType:'local' },
  ],
  
  // Zone definitions for building placement
  anchorNodes: [
    // Commercial district (center)
    { x:0, z:0, zone:'commercial' },
    { x:50, z:50, zone:'commercial' },
    { x:-50, z:-50, zone:'commercial' },
    { x:50, z:-50, zone:'commercial' },
    { x:-50, z:50, zone:'commercial' },
    
    // Residential areas
    { x:250, z:150, zone:'residential' },
    { x:-250, z:-150, zone:'residential' },
    { x:250, z:-150, zone:'residential' },
    { x:-250, z:150, zone:'residential' },
    
    // Market area
    { x:100, z:-250, zone:'market' },
    { x:-100, z:250, zone:'market' },
    
    // Industrial zone
    { x:350, z:-350, zone:'industrial' },
    { x:-350, z:350, zone:'industrial' },
    
    // Suburban fringes
    { x:0, z:350, zone:'suburban' },
    { x:0, z:-350, zone:'suburban' },
    { x:350, z:0, zone:'suburban' },
    { x:-350, z:0, zone:'suburban' },
  ],
  
  // Traffic density per zone
  zoneTrafficDensity: {
    commercial: 0.8,
    residential: 0.4,
    market: 0.9,
    industrial: 0.5,
    suburban: 0.3
  },
  
  // Pedestrian density per zone
  zonePedestrianDensity: {
    commercial: 0.7,
    residential: 0.5,
    market: 0.9,
    industrial: 0.2,
    suburban: 0.3
  },
  
  // Initial NPC spawns
  npcTypes: ['car','car','bike','auto','bus','truck','car','bike','taxi','car','auto','car','car','bike','bus','car','ambulance','taxi','auto','bike'],
  npcs: [],
  
  // Player start position
  playerStart: { x: 0, z: 0, heading: 0 }
})
