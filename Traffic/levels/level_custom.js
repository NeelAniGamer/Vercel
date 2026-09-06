window.LVS = window.LVS || []

// Remove existing custom level if already present to prevent duplicates
window.LVS = window.LVS.filter(l => l.id !== 'custom')

window.LVS.push({
  id: 'custom',
  icon: '🏙️',
  name: 'Dense Downtown & Residential Hub',
  modes: ['car', 'bike', 'auto', 'bus', 'truck'],
  col: '#00f0cc',
  ds: 'Navigate through a dense urban grid featuring high-rise commercial skyscrapers, signalized 4-way intersections with zebra crossings, and tree-lined residential avenues with houses.',
  hps: [
    'Obey the 50 km/h arterial speed limit and slow down to 30 km/h in residential lanes.',
    'Halt behind the solid white stop line when traffic signals are red.',
    'Yield to pedestrians crossing at zebra crossings.',
    'Watch for turning buses, delivery trucks, and auto-rickshaws at commercial junctions.',
    'Press M to toggle overhead map view; press C to cycle camera perspectives.'
  ],
  law: {
    sec: 'MV Act Sec 119 & 138',
    fine: '₹1,000 - ₹5,000',
    off: 'Signal Jumping & Zebra Crossing Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 119 और 138',
    fineHi: '₹1,000 - ₹5,000',
    offHi: 'सिग्नल जंप और ज़ेब्रा क्रॉसिंग उल्लंघन'
  },
  theory:
    '<h2>Dense Downtown Commercial & Residential Navigation</h2>' +
    '<p>In modern urban centers, major multi-lane arterial boulevards intersect with collector avenues and quiet residential streets. ' +
    'Heavy commercial zones feature towering skyscrapers, multi-phase traffic signals, and dense traffic flows.</p>' +
    '<p>Key safety principles for this district:</p>' +
    '<ul>' +
    '<li><strong>Zebra Crossings:</strong> Pedestrians have absolute right of way on marked crosswalks. Never stop inside the zebra marking.</li>' +
    '<li><strong>Signal Discipline:</strong> Approach multi-lane intersections prepared to stop. Amber signals mean stop unless you are already past the line.</li>' +
    '<li><strong>Zone Transition:</strong> When entering residential streets, watch for parked cars, opening doors, and pedestrians emerging between houses.</li>' +
    '</ul>',
  pract: 'Drive from the residential house district through the downtown commercial junction. Obey all signals and park safely at the Financial Tower gate.',
  mode: 'practical',
  themeType: 'intersection_mastery',
  speedLimit: 50,
  timeLimit: 360,
  startOutside: false,

  // ── Atmospheric & Environment Settings ──
  sky: 0x82b4db,
  fog: 650,
  ground: 0x2b333e,
  amb: 0.88,
  hasGarage: true,

  // ── 4-Lane Arterials & 2-Lane Residential Road Network ──
  roads: [
    // Major East-West Arterial Boulevard (4 lanes, width 22m)
    { type: 'h', z: 0, x1: -400, x2: 400, lanes: 4, width: 22, speedLimit: 50, roadType: 'arterial', name: 'SV Grand Boulevard' },
    
    // Major North-South Central Expressway (4 lanes, width 22m)
    { type: 'v', x: 0, z1: -400, z2: 400, lanes: 4, width: 22, speedLimit: 50, roadType: 'arterial', name: 'Downtown Central Way' },

    // North Residential Avenue (2 lanes, width 14m, houses & suburban plots)
    { type: 'h', z: 120, x1: -400, x2: 400, lanes: 2, width: 14, speedLimit: 35, roadType: 'local', name: 'North Residential Lane' },

    // South Residential Avenue (2 lanes, width 14m, houses & apartments)
    { type: 'h', z: -120, x1: -400, x2: 400, lanes: 2, width: 14, speedLimit: 35, roadType: 'local', name: 'South Residential Lane' },

    // East Commercial Collector Street (2 lanes, width 14m, retail & mid-rise)
    { type: 'v', x: 180, z1: -400, z2: 400, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'East Commerce Street' },

    // West Commercial Collector Street (2 lanes, width 14m, mid-rise & market)
    { type: 'v', x: -180, z1: -400, z2: 400, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'West Commerce Street' }
  ],

  // ── Multi-Zone Anchor Nodes (Drives Building Generation) ──
  anchorNodes: [
    // Central Commercial Core: High-Rise Skyscrapers, Corporate Towers, Banks
    { x: 0, z: 0, zone: 'Commercial' },
    { x: 60, z: 60, zone: 'Commercial' },
    { x: -60, z: 60, zone: 'Commercial' },
    { x: 60, z: -60, zone: 'Commercial' },
    { x: -60, z: -60, zone: 'Commercial' },
    { x: 100, z: 0, zone: 'Commercial' },
    { x: -100, z: 0, zone: 'Commercial' },

    // Residential Neighborhoods: Detailed Houses, Villas, Chawls & Apartments
    { x: 0, z: 120, zone: 'Residential' },
    { x: -180, z: 120, zone: 'Residential' },
    { x: 180, z: 120, zone: 'Residential' },
    { x: -260, z: 120, zone: 'Residential' },
    { x: 260, z: 120, zone: 'Residential' },
    { x: 0, z: -120, zone: 'Residential' },
    { x: -180, z: -120, zone: 'Residential' },
    { x: 180, z: -120, zone: 'Residential' },
    { x: -260, z: -120, zone: 'Residential' },
    { x: 260, z: -120, zone: 'Residential' },

    // Market & Mixed Civic District
    { x: 180, z: 0, zone: 'Commercial' },
    { x: -180, z: 0, zone: 'Civic' }
  ],

  // ── Intersections (Active 4-way & T-junction Traffic Signals) ──
  ints: [
    [0, 0],         // Central 4-way Grand Junction
    [180, 0],       // East Boulevard Junction
    [-180, 0],      // West Boulevard Junction
    [0, 120],       // North Avenue Cross
    [180, 120],     // North-East Neighborhood Corner
    [-180, 120],    // North-West Neighborhood Corner
    [0, -120],      // South Avenue Cross
    [180, -120],    // South-East Neighborhood Corner
    [-180, -120]    // South-West Neighborhood Corner
  ],

  // ── Navigation Route & Checkpoints ──
  route: [
    { x: -180, z: 120, desc: 'Residential House Sector (Start)' },
    { x: 0, z: 120, desc: 'North Residential Crossway' },
    { x: 0, z: 0, desc: 'Central Downtown Junction (Traffic Signal)' },
    { x: 180, z: 0, desc: 'East Commercial Boulevard' },
    { x: 180, z: -120, desc: 'Financial Tower Destination Gate' }
  ],

  // ── Player Spawn Position ──
  playerStart: { x: -180, z: 120, heading: 0 },

  // ── Traffic AI Vehicles & Density ──
  trafficDensity: 0.85,
  pedestrianDensity: 0.6,
  npcTypes: [
    'car', 'taxi', 'auto', 'bus', 'car', 'bike', 'truck', 'taxi',
    'car', 'auto', 'bus', 'bike', 'car', 'taxi', 'car', 'ambulance'
  ],

  // ── Mission Objectives ──
  tasks: [
    { id: 't_speed', text: 'Maintain speed under 50 km/h limit', type: 'speed_limit', target: 50, done: false },
    { id: 't_signals', text: 'Comply with red lights at Central Junction', type: 'stop', target: 'red_light', done: false },
    { id: 't_pedestrians', text: 'Yield to crossing pedestrians at zebra marks', type: 'avoid', target: 'pedestrian', done: false },
    { id: 't_finish', text: 'Reach the Financial Tower Gate', type: 'reach', target: 'finish', done: false }
  ],

  // ── Asset Bundles Loaded for City, Props, Houses & Vehicles ──
  assets: [
    'lowpoly_city',
    'suburban',
    'industrial',
    'street_props',
    'cars',
    'trucks',
    'emergency'
  ]
})
