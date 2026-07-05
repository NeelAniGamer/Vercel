// ── Per-vehicle handling profiles ──
const VEHICLE_STATS = {
  bike:      { maxSpd: 1.35, accel: 0.058, fric: 0.935, turn: 0.082, grip: 0.48 },
  car:       { maxSpd: 1.10, accel: 0.045, fric: 0.945, turn: 0.065, grip: 0.62 },
  bus:       { maxSpd: 0.80, accel: 0.028, fric: 0.965, turn: 0.036, grip: 0.44 },
  truck:     { maxSpd: 0.90, accel: 0.033, fric: 0.960, turn: 0.042, grip: 0.50 },
  auto:      { maxSpd: 1.00, accel: 0.048, fric: 0.942, turn: 0.072, grip: 0.40 },
};

// ── Phase 7: NPC/Vehicle Template Cache ──
// Pre-builds one mesh per (type, color) combo; clones on spawn instead of rebuild.
const _npcTplCache = new Map();
function _npcTplKey(type, col) { return type + '_' + (col | 0).toString(16); }
function _getNpcTemplate(type, col) {
  const k = _npcTplKey(type, col);
  if (_npcTplCache.has(k)) return _npcTplCache.get(k);
  const m = _buildVehicle(type, col);
  if (_npcTplCache.size < 120) _npcTplCache.set(k, m);
  return m;
}

// ── Theme-based road templates for levels 16-50 ──
// Generates road configs from themeType so we don't need 35 manual M entries.
function _getThemeRoads(themeType) {
  const t = themeType || 'urban_grid';
  const templates = {
    urban_grid: {
      name: 'Urban Grid', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','bike','auto','bus','truck','car','bike','taxi','car','auto','car','car','bike','bus','car'],
      roads: [
        { type:'v', x:-360, z1:-480, z2:480 }, { type:'v', x:-240, z1:-480, z2:480 },
        { type:'v', x:-120, z1:-480, z2:480 }, { type:'v', x:0,    z1:-480, z2:480 },
        { type:'v', x:120,  z1:-480, z2:480 }, { type:'v', x:240,  z1:-480, z2:480 },
        { type:'v', x:360,  z1:-480, z2:480 },
        { type:'h', z:-480, x1:-360, x2:360 }, { type:'h', z:-360, x1:-360, x2:360 },
        { type:'h', z:-240, x1:-360, x2:360 }, { type:'h', z:-120, x1:-360, x2:360 },
        { type:'h', z:0,    x1:-360, x2:360 }, { type:'h', z:120,  x1:-360, x2:360 },
        { type:'h', z:240,  x1:-360, x2:360 }, { type:'h', z:360,  x1:-360, x2:360 },
        { type:'h', z:480,  x1:-360, x2:360 }
      ],
      route: [{ x:0,z:-480 },{ x:0,z:-360 },{ x:0,z:-240 },{ x:0,z:-120 },{ x:0,z:0 },{ x:0,z:120 },{ x:0,z:240 },{ x:0,z:360 },{ x:0,z:480 },
              { x:120,z:480 },{ x:240,z:480 },{ x:360,z:480 },{ x:360,z:360 },{ x:360,z:240 },{ x:360,z:120 },{ x:360,z:0 },{ x:360,z:-120 },{ x:360,z:-240 },{ x:360,z:-360 },{ x:360,z:-480 }]
    },
    signal_jump: {
      name: 'Signal Junction', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','bike','auto','bus','truck','car','bike','taxi','car','auto','car','car','bike','bus','car'],
      roads: [
        { type:'v', x:0,    z1:-600, z2:600 }, { type:'v', x:-240, z1:-480, z2:480 }, { type:'v', x:240, z1:-480, z2:480 },
        { type:'h', z:0,    x1:-600, x2:600 }, { type:'h', z:-240, x1:-480, x2:480 }, { type:'h', z:240, x1:-480, x2:480 }
      ],
      route: [{ x:0,z:-480 },{ x:0,z:-240 },{ x:0,z:0 },{ x:0,z:240 },{ x:0,z:480 },
              { x:240,z:480 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 },{ x:240,z:-480 },
              { x:-240,z:-480 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:480 }]
    },
    road_rage: {
      name: 'Wide Arterial', sky: 0x9ec5d9, fog: 600, ground: 0x3a5a2e, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','truck','bus','car','car','auto','bike','car','truck','bus','car','car','car','auto','car'],
      roads: [
        { type:'h', z:0,    x1:-800, x2:800 }, { type:'h', z:120,  x1:-800, x2:800 },
        { type:'v', x:0,    z1:-600, z2:600 }, { type:'v', x:120,  z1:-600, z2:600 },
        { type:'h', z:-240, x1:-400, x2:400 }, { type:'h', z:360,  x1:-400, x2:400 },
        { type:'v', x:-240, z1:-400, z2:400 }, { type:'v', x:360,  z1:-400, z2:400 }
      ],
      route: [{ x:-600,z:60 },{ x:-240,z:60 },{ x:0,z:60 },{ x:240,z:60 },{ x:480,z:60 },
              { x:480,z:-240 },{ x:480,z:0 },{ x:480,z:240 },{ x:360,z:360 },{ x:240,z:360 },
              { x:0,z:360 },{ x:-240,z:360 },{ x:-400,z:360 },{ x:-400,z:240 },{ x:-400,z:0 },
              { x:-400,z:-240 },{ x:-400,z:-400 },{ x:-240,z:-400 },{ x:0,z:-400 },{ x:240,z:-400 }]
    },
    rain_driving: {
      name: 'Wet Streets', sky: 0x1a2a3a, fog: 400, ground: 0x2a3a2a, amb: 0.5, veh: 'car',
      npcTypes: ['car','auto','bike','car','auto','taxi','car','bike','car','auto','car','bike'],
      hasRain: true, hasPuddles: true,
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-240, z1:-360, z2:360 }, { type:'v', x:240,  z1:-360, z2:360 },
        { type:'h', z:-240, x1:-360, x2:360 }, { type:'h', z:240,  x1:-360, x2:360 }
      ],
      route: [{ x:0,z:0 },{ x:0,z:-240 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },
              { x:0,z:240 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 }]
    },
    ambulance_priority: {
      name: 'Hospital Arterial', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','bike','auto','ambulance','car','bus','truck','car','bike','car','auto'],
      roads: [
        { type:'v', x:0,    z1:-700, z2:700 }, { type:'v', x:-240, z1:-500, z2:500 },
        { type:'v', x:240,  z1:-500, z2:500 },
        { type:'h', z:-360, x1:-400, x2:400 }, { type:'h', z:0,    x1:-600, x2:600 },
        { type:'h', z:360,  x1:-400, x2:400 }
      ],
      route: [{ x:0,z:-600 },{ x:0,z:-360 },{ x:0,z:0 },{ x:0,z:360 },{ x:0,z:600 },
              { x:240,z:600 },{ x:240,z:360 },{ x:240,z:0 },{ x:240,z:-360 },{ x:240,z:-600 },
              { x:-240,z:-600 },{ x:-240,z:-360 },{ x:-240,z:0 },{ x:-240,z:360 },{ x:-240,z:600 }]
    },
    puddle_etiquette: {
      name: 'Rain Puddles', sky: 0x1a2a3a, fog: 400, ground: 0x2a3a2a, amb: 0.5, veh: 'car',
      npcTypes: ['car','auto','bike','car','auto','taxi','car','bike','car','auto','car','bike'],
      hasRain: true, hasPuddles: true,
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:0 },{ x:-200,z:0 },{ x:-200,z:-200 },{ x:0,z:-200 },{ x:200,z:-200 },
              { x:200,z:0 },{ x:200,z:200 },{ x:0,z:200 },{ x:-200,z:200 }]
    },
    pedestrian_courtesy: {
      name: 'Pedestrian Zone', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','bike','auto','car','car','car','bike','car','auto','car','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:200,z:400 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 },{ x:200,z:-400 },
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }]
    },
    narrow_street: {
      name: 'Narrow Lanes', sky: 0x87b6d8, fog: 500, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','auto','bike','car','auto','taxi','car','bike','car','auto','car','bike'],
      roads: [
        { type:'v', x:0,    z1:-500, z2:500 }, { type:'v', x:-160, z1:-300, z2:300 },
        { type:'v', x:160,  z1:-300, z2:300 },
        { type:'h', z:0,    x1:-400, x2:400 }, { type:'h', z:-200, x1:-200, x2:200 },
        { type:'h', z:200,  x1:-200, x2:200 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:160,z:400 },{ x:160,z:200 },{ x:160,z:0 },{ x:160,z:-200 },{ x:160,z:-400 },
              { x:-160,z:-400 },{ x:-160,z:-200 },{ x:-160,z:0 },{ x:-160,z:200 },{ x:-160,z:400 }]
    },
    parking_rules: {
      name: 'Parking Lot', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','car','car','car','car','auto','car','car','car','car','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:-300,z:0 },{ x:-200,z:0 },{ x:0,z:0 },{ x:200,z:0 },{ x:300,z:0 },
              { x:300,z:200 },{ x:200,z:200 },{ x:0,z:200 },{ x:-200,z:200 },{ x:-300,z:200 },
              { x:-300,z:-200 },{ x:-200,z:-200 },{ x:0,z:-200 },{ x:200,z:-200 },{ x:300,z:-200 }]
    },
    auto_dance: {
      name: 'Auto Zone', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'auto',
      npcTypes: ['auto','auto','auto','auto','auto','bike','auto','auto','auto','auto','auto','bike'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:0 },{ x:0,z:-200 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },
              { x:0,z:200 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 }]
    },
    toll: {
      name: 'Highway Toll', sky: 0x87b6d8, fog: 600, ground: 0x3a5a2e, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','truck','bus','car','car','truck','car','car','truck','bus','car'],
      roads: [
        { type:'h', z:0,    x1:-800, x2:800 }, { type:'h', z:120,  x1:-800, x2:800 },
        { type:'v', x:0,    z1:-300, z2:300 }
      ],
      route: [{ x:-700,z:60 },{ x:-500,z:60 },{ x:-300,z:60 },{ x:-100,z:60 },{ x:100,z:60 },
              { x:300,z:60 },{ x:500,z:60 },{ x:700,z:60 },{ x:700,z:-60 },{ x:500,z:-60 },
              { x:300,z:-60 },{ x:100,z:-60 },{ x:-100,z:-60 },{ x:-300,z:-60 },{ x:-500,z:-60 },{ x:-700,z:-60 }]
    },
    blind_corner: {
      name: 'Blind Corners', sky: 0x87b6d8, fog: 450, ground: 0x33691e, amb: 0.7, veh: 'car',
      npcTypes: ['car','car','truck','auto','car','bus','car','car','auto','car','car','truck'],
      roads: [
        { type:'v', x:0,    z1:-500, z2:500 }, { type:'v', x:-240, z1:-400, z2:400 },
        { type:'v', x:240,  z1:-400, z2:400 },
        { type:'h', z:-200, x1:-400, x2:400 }, { type:'h', z:200,  x1:-400, x2:400 },
        { type:'h', z:0,    x1:-240, x2:240 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:240,z:400 },{ x:240,z:200 },{ x:240,z:0 },{ x:240,z:-200 },{ x:240,z:-400 },
              { x:-240,z:-400 },{ x:-240,z:-200 },{ x:-240,z:0 },{ x:-240,z:200 },{ x:-240,z:400 }]
    },
    hill_driving: {
      name: 'Hill Roads', sky: 0x7ab8e0, fog: 400, ground: 0x2d5016, amb: 0.75, veh: 'car',
      npcTypes: ['car','car','truck','bus','car','car','car','truck','car','car','bus','car'],
      roads: [
        { type:'v', x:0,    z1:-500, z2:500 }, { type:'v', x:-300, z1:-300, z2:300 },
        { type:'v', x:300,  z1:-300, z2:300 },
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'h', z:-300, x1:-300, x2:300 },
        { type:'h', z:300,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:0 },{ x:0,z:400 },{ x:300,z:400 },{ x:300,z:0 },
              { x:300,z:-400 },{ x:-300,z:-400 },{ x:-300,z:0 },{ x:-300,z:400 }]
    },
    bus_stop: {
      name: 'Bus Corridor', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','bus','car','car','bus','car','auto','car','bus','car','car','bus'],
      roads: [
        { type:'v', x:0,    z1:-700, z2:700 }, { type:'v', x:-240, z1:-500, z2:500 },
        { type:'v', x:240,  z1:-500, z2:500 },
        { type:'h', z:-360, x1:-400, x2:400 }, { type:'h', z:0,    x1:-500, x2:500 },
        { type:'h', z:360,  x1:-400, x2:400 }
      ],
      route: [{ x:0,z:-600 },{ x:0,z:-360 },{ x:0,z:0 },{ x:0,z:360 },{ x:0,z:600 },
              { x:-240,z:600 },{ x:-240,z:360 },{ x:-240,z:0 },{ x:-240,z:-360 },{ x:-240,z:-600 }]
    },
    construction: {
      name: 'Construction Zone', sky: 0x9aa8b8, fog: 450, ground: 0x5a4a3a, amb: 0.7, veh: 'car',
      npcTypes: ['car','truck','car','truck','car','auto','car','truck','car','car','truck','car'],
      roads: [
        { type:'h', z:0,    x1:-600, x2:600 }, { type:'v', x:0,    z1:-600, z2:600 },
        { type:'v', x:-240, z1:-360, z2:360 }, { type:'v', x:240,  z1:-360, z2:360 },
        { type:'h', z:-240, x1:-360, x2:360 }, { type:'h', z:240,  x1:-360, x2:360 }
      ],
      route: [{ x:0,z:-500 },{ x:0,z:-240 },{ x:0,z:0 },{ x:0,z:240 },{ x:0,z:500 },
              { x:240,z:500 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 },{ x:240,z:-500 },
              { x:-240,z:-500 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:500 }]
    },
    one_way: {
      name: 'One-Way Streets', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','auto','car','car','taxi','car','auto','car','car','car','auto'],
      roads: [
        { type:'h', z:0,    x1:-600, x2:600 }, { type:'h', z:120,  x1:-600, x2:600 },
        { type:'v', x:0,    z1:-400, z2:400 }, { type:'v', x:120,  z1:-400, z2:400 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:320,  x1:-300, x2:300 }
      ],
      route: [{ x:-500,z:60 },{ x:-300,z:60 },{ x:-100,z:60 },{ x:100,z:60 },{ x:300,z:60 },{ x:500,z:60 },
              { x:500,z:-200 },{ x:300,z:-200 },{ x:100,z:-200 },{ x:-100,z:-200 },{ x:-300,z:-200 },{ x:-500,z:-200 }]
    },
    hospital_quiet: {
      name: 'Hospital Zone', sky: 0x87b6d8, fog: 500, ground: 0x33691e, amb: 0.7, veh: 'car',
      npcTypes: ['car','car','auto','car','car','car','bike','car','car','auto','car','car'],
      roads: [
        { type:'v', x:0,    z1:-500, z2:500 }, { type:'v', x:-200, z1:-300, z2:300 },
        { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:0,    x1:-400, x2:400 }, { type:'h', z:-200, x1:-200, x2:200 },
        { type:'h', z:200,  x1:-200, x2:200 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:200,z:400 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 },{ x:200,z:-400 },
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }]
    },
    festival: {
      name: 'Festival Route', sky: 0xf5a623, fog: 500, ground: 0x444444, amb: 0.9, veh: 'car',
      npcTypes: ['car','auto','bike','car','car','auto','bike','car','car','auto','bike','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-240, z1:-360, z2:360 }, { type:'v', x:240,  z1:-360, z2:360 },
        { type:'h', z:-240, x1:-360, x2:360 }, { type:'h', z:240,  x1:-360, x2:360 }
      ],
      route: [{ x:0,z:0 },{ x:0,z:-240 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },
              { x:0,z:240 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 },{ x:0,z:-240 }]
    },
    cyclist: {
      name: 'Cyclist Lanes', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'bike',
      npcTypes: ['bike','car','bike','auto','bike','car','bike','car','bike','auto','bike','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:200,z:400 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 },{ x:200,z:-400 }]
    },
    grand_test: {
      name: 'Grand Test', sky: 0x87b6d8, fog: 600, ground: 0x33691e, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','bike','auto','bus','truck','car','bike','taxi','car','auto','car','car','bike','bus','car','truck','car'],
      roads: [
        { type:'v', x:-360, z1:-480, z2:480 }, { type:'v', x:-240, z1:-480, z2:480 },
        { type:'v', x:-120, z1:-480, z2:480 }, { type:'v', x:0,    z1:-480, z2:480 },
        { type:'v', x:120,  z1:-480, z2:480 }, { type:'v', x:240,  z1:-480, z2:480 },
        { type:'v', x:360,  z1:-480, z2:480 },
        { type:'h', z:-480, x1:-360, x2:360 }, { type:'h', z:-240, x1:-360, x2:360 },
        { type:'h', z:0,    x1:-360, x2:360 }, { type:'h', z:240,  x1:-360, x2:360 },
        { type:'h', z:480,  x1:-360, x2:360 }
      ],
      route: [{ x:0,z:-480 },{ x:0,z:-240 },{ x:0,z:0 },{ x:0,z:240 },{ x:0,z:480 },
              { x:120,z:480 },{ x:240,z:480 },{ x:360,z:480 },{ x:360,z:240 },{ x:360,z:0 },
              { x:360,z:-240 },{ x:360,z:-480 },{ x:240,z:-480 },{ x:120,z:-480 },
              { x:-120,z:-480 },{ x:-240,z:-480 },{ x:-360,z:-480 },{ x:-360,z:-240 },
              { x:-360,z:0 },{ x:-360,z:240 },{ x:-360,z:480 }]
    },
    night_monsoon: {
      name: 'Night Monsoon', sky: 0x0a0a12, fog: 300, ground: 0x1a1a2a, amb: 0.3, veh: 'car',
      npcTypes: ['car','auto','bike','car','auto','car','bike','car','auto','car'],
      hasRain: true, hasPuddles: true, isNight: true,
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:0 },{ x:0,z:-200 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },
              { x:0,z:200 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 }]
    },
    wrong_side: {
      name: 'Wrong Side', sky: 0x9ec5d9, fog: 600, ground: 0x3a5a2e, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','truck','car','car','bus','car','car','truck','car','car','bus'],
      roads: [
        { type:'h', z:0,    x1:-800, x2:800 }, { type:'h', z:120,  x1:-800, x2:800 },
        { type:'v', x:0,    z1:-400, z2:400 }, { type:'v', x:120,  z1:-400, z2:400 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:320,  x1:-300, x2:300 }
      ],
      route: [{ x:-700,z:60 },{ x:-400,z:60 },{ x:-100,z:60 },{ x:200,z:60 },{ x:500,z:60 },
              { x:500,z:-200 },{ x:200,z:-200 },{ x:-100,z:-200 },{ x:-400,z:-200 },{ x:-700,z:-200 }]
    },
    highway_merge: {
      name: 'Highway Merge', sky: 0x87b6d8, fog: 700, ground: 0x3a5a2e, amb: 0.9, veh: 'car',
      npcTypes: ['car','car','truck','bus','car','car','truck','car','car','truck','bus','car'],
      roads: [
        { type:'h', z:0,    x1:-1000, x2:1000 }, { type:'h', z:120,  x1:-1000, x2:1000 },
        { type:'v', x:0,    z1:-300, z2:300 }, { type:'v', x:-300, z1:-200, z2:200 }
      ],
      route: [{ x:-900,z:60 },{ x:-600,z:60 },{ x:-300,z:60 },{ x:0,z:60 },{ x:300,z:60 },
              { x:600,z:60 },{ x:900,z:60 },{ x:900,z:-60 },{ x:600,z:-60 },{ x:300,z:-60 },
              { x:0,z:-60 },{ x:-300,z:-60 },{ x:-600,z:-60 },{ x:-900,z:-60 }]
    },
    zero_visibility: {
      name: 'Zero Visibility', sky: 0x0a0a0a, fog: 200, ground: 0x1a1a1a, amb: 0.2, veh: 'car',
      npcTypes: ['car','auto','car','car','auto','car','car','auto','car','car'],
      hasRain: true, isNight: true,
      roads: [
        { type:'h', z:0,    x1:-400, x2:400 }, { type:'v', x:0,    z1:-400, z2:400 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:0 },{ x:0,z:-200 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },
              { x:0,z:200 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 }]
    },
    mountain: {
      name: 'Mountain Pass', sky: 0x7ab8e0, fog: 400, ground: 0x2d5016, amb: 0.75, veh: 'car',
      npcTypes: ['car','car','truck','bus','car','car','car','truck','car','car','bus','car'],
      roads: [
        { type:'v', x:0,    z1:-600, z2:600 }, { type:'v', x:-300, z1:-400, z2:400 },
        { type:'v', x:300,  z1:-400, z2:400 },
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'h', z:-300, x1:-300, x2:300 },
        { type:'h', z:300,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-500 },{ x:0,z:-300 },{ x:0,z:0 },{ x:0,z:300 },{ x:0,z:500 },
              { x:300,z:500 },{ x:300,z:300 },{ x:300,z:0 },{ x:300,z:-300 },{ x:300,z:-500 },
              { x:-300,z:-500 },{ x:-300,z:-300 },{ x:-300,z:0 },{ x:-300,z:300 },{ x:-300,z:500 }]
    },
    rural: {
      name: 'Rural Roads', sky: 0xa8d4e8, fog: 700, ground: 0x5a7a3a, amb: 0.9, veh: 'car',
      npcTypes: ['car','car','truck','bike','car','auto','car','truck','car','bike','car','auto'],
      roads: [
        { type:'h', z:0,    x1:-600, x2:600 }, { type:'v', x:0,    z1:-600, z2:600 },
        { type:'v', x:-300, z1:-200, z2:200 }, { type:'v', x:300,  z1:-200, z2:200 }
      ],
      route: [{ x:-500,z:0 },{ x:-300,z:0 },{ x:0,z:0 },{ x:300,z:0 },{ x:500,z:0 },
              { x:500,z:-200 },{ x:300,z:-200 },{ x:0,z:-200 },{ x:-300,z:-200 },{ x:-500,z:-200 }]
    },
    multi_modal: {
      name: 'Multi-Modal Hub', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','bus','bike','auto','car','bus','car','bike','auto','car','bus','car','bike','auto','car','bus'],
      roads: [
        { type:'v', x:-360, z1:-480, z2:480 }, { type:'v', x:-240, z1:-480, z2:480 },
        { type:'v', x:0,    z1:-480, z2:480 }, { type:'v', x:240,  z1:-480, z2:480 },
        { type:'v', x:360,  z1:-480, z2:480 },
        { type:'h', z:-360, x1:-360, x2:360 }, { type:'h', z:0,    x1:-360, x2:360 },
        { type:'h', z:360,  x1:-360, x2:360 }
      ],
      route: [{ x:0,z:-480 },{ x:0,z:-360 },{ x:0,z:0 },{ x:0,z:360 },{ x:0,z:480 },
              { x:240,z:480 },{ x:240,z:360 },{ x:240,z:0 },{ x:240,z:-360 },{ x:240,z:-480 },
              { x:-240,z:-480 },{ x:-240,z:-360 },{ x:-240,z:0 },{ x:-240,z:360 },{ x:-240,z:480 }]
    },
    no_honking: {
      name: 'Silent Zone', sky: 0x87b6d8, fog: 500, ground: 0x33691e, amb: 0.7, veh: 'car',
      npcTypes: ['car','car','auto','car','bike','car','auto','car','car','bike','car','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:200,z:400 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 },{ x:200,z:-400 },
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }]
    },
    pedestrian_priority: {
      name: 'Pedestrian Priority', sky: 0x87b6d8, fog: 500, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','bike','auto','car','car','bike','car','auto','car','car','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-200, z1:-300, z2:300 }, { type:'v', x:200,  z1:-300, z2:300 },
        { type:'h', z:-200, x1:-300, x2:300 }, { type:'h', z:200,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:200,z:400 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 },{ x:200,z:-400 },
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }]
    },
    signs: {
      name: 'Signage Zone', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
      npcTypes: ['car','car','auto','bike','car','auto','car','car','bike','car','auto','car'],
      roads: [
        { type:'h', z:0,    x1:-600, x2:600 }, { type:'v', x:0,    z1:-600, z2:600 },
        { type:'v', x:-240, z1:-400, z2:400 }, { type:'v', x:240,  z1:-400, z2:400 },
        { type:'h', z:-240, x1:-400, x2:400 }, { type:'h', z:240,  x1:-400, x2:400 }
      ],
      route: [{ x:0,z:-500 },{ x:0,z:-240 },{ x:0,z:0 },{ x:0,z:240 },{ x:0,z:500 },
              { x:240,z:500 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 },{ x:240,z:-500 },
              { x:-240,z:-500 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:500 }]
    },
    animals: {
      name: 'Animal Crossing', sky: 0xa8d4e8, fog: 600, ground: 0x5a7a3a, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','truck','bike','car','auto','car','car','bike','car','auto','car'],
      roads: [
        { type:'h', z:0,    x1:-500, x2:500 }, { type:'v', x:0,    z1:-500, z2:500 },
        { type:'v', x:-240, z1:-300, z2:300 }, { type:'v', x:240,  z1:-300, z2:300 },
        { type:'h', z:-240, x1:-300, x2:300 }, { type:'h', z:240,  x1:-300, x2:300 }
      ],
      route: [{ x:0,z:-400 },{ x:0,z:-200 },{ x:0,z:0 },{ x:0,z:200 },{ x:0,z:400 },
              { x:240,z:400 },{ x:240,z:200 },{ x:240,z:0 },{ x:240,z:-200 },{ x:240,z:-400 },
              { x:-240,z:-400 },{ x:-240,z:-200 },{ x:-240,z:0 },{ x:-240,z:200 },{ x:-240,z:400 }]
    },
    lane_discipline: {
      name: 'Lane Discipline', sky: 0x87b6d8, fog: 600, ground: 0x3a5a2e, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','truck','bus','car','car','truck','car','car','truck','bus','car'],
      roads: [
        { type:'h', z:0,    x1:-1000, x2:1000 }, { type:'h', z:120,  x1:-1000, x2:1000 },
        { type:'h', z:-120, x1:-800, x2:800 },
        { type:'v', x:-300, z1:-400, z2:400 }, { type:'v', x:300,  z1:-400, z2:400 }
      ],
      route: [{ x:-800,z:60 },{ x:-500,z:60 },{ x:-200,z:60 },{ x:100,z:60 },{ x:400,z:60 },
              { x:700,z:60 },{ x:700,z:-60 },{ x:400,z:-60 },{ x:100,z:-60 },{ x:-200,z:-60 },
              { x:-500,z:-60 },{ x:-800,z:-60 }]
    },
    driving_school: {
      name: 'Driving School', sky: 0x87b6d8, fog: 600, ground: 0x33691e, amb: 0.85, veh: 'car',
      npcTypes: ['car','car','bike','auto','car','car','bike','auto','car','car'],
      roads: [
        { type:'v', x:0,    z1:-200, z2:200 },
        { type:'v', x:-120, z1:-200, z2:200 },
        { type:'h', z:0,    x1:-200, x2:200 },
        { type:'h', z:-120, x1:-200, x2:200 },
        { type:'h', z:120,  x1:-200, x2:200 }
      ],
      route: [{ x:0,z:-200 },{ x:0,z:-120 },{ x:0,z:0 },{ x:0,z:120 },{ x:0,z:200 },
              { x:-120,z:200 },{ x:-120,z:120 },{ x:-120,z:0 },{ x:-120,z:-120 },{ x:-120,z:-200 }]
    }
  };
  return templates[t] || templates.urban_grid;
}

class Game {
      constructor() {
        this.renderer = null; this.scene = null; this.camera = null; this.player = null;
        this.clock = new THREE.Clock(); this.keys = {}; this.speed = 0; this.maxSpd = 1.1; this.accel = .045; this.fric = .95; this.turn = .065; this.gear = 'N'; this.gcap = 0;
        this.boostFuel = 100; this.maxBoostFuel = 100; this.boosting = false; this._wasDepleted = false;
        this._camTarget = new THREE.Vector3(); this._grip = 0.62; this._camShakeAmt = 0; this._camTilt = 0; this._camFovTarget = 60;
        this.playing = false; this.pause = false; this.lightningTimer = 0; this.thunderSfx = null; this.score = 0; this.hp = 100; this.fine = 0; this.vio = 0; this.timer = 0;
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.routeIdx = 0; this.retries = 0; this.hits = 0;
        this.gyroOn = false; this.gyroBaseGamma = 0; this._gyroHandler = null;
        this.camYaw = 0; this.camPitch = 0;
        this._isDraggingMobileLook = false; this._mobileLookTouchId = null;
        this._prevMobileLookX = 0; this._prevMobileLookY = 0;
        this.dom = {}; // Cached DOM elements
        // Phase 7: Object pools (initialized in _buildScene)
        this.npcPool = null; this.pedPool = null; this._brakeDustCd = false;
        this._initR(); this._initIn(); this._initG(); this._loop();
        window.addEventListener('resize', () => this._rsz());
        document.addEventListener('fullscreenchange', () => this._rsz());
      }
      _initR() {
        const cv = document.getElementById('3c');
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this._isMobile = isMobile;

        // PERFORMANCE: Cap pixel ratio lower on mobile to reduce render cost
        let dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 2);
        const maxW = 1920, maxH = 1080;
        let w = innerWidth, h = innerHeight;
        if (w * dpr > maxW) dpr = maxW / w;
        if (h * dpr > maxH) dpr = maxH / h;
        this._dpr = dpr;

        this.renderer = new THREE.WebGLRenderer({
          canvas: cv,
          antialias: !isMobile,
          powerPreference: "high-performance"
        });
        // Auto-detect low-end GPU via WebGL debug info
        let isLowGPU = false;
        try {
          const ext = this.renderer.getContext().getExtension('WEBGL_debug_renderer_info');
          if (ext) {
            const gpu = this.renderer.getContext().getParameter(ext.UNMASKED_RENDERER_WEBGL).toLowerCase();
            isLowGPU = /intel|adreno 5|adreno 4|mali-4|mali-t6|swiftshader|llvmpipe/.test(gpu);
          }
        } catch(e) {}
        this._isLowGPU = isLowGPU;
        if (isLowGPU) { dpr = Math.min(dpr, 1.0); }
        this.renderer.setSize(w * dpr, h * dpr, false);
        this.renderer.domElement.style.width = w + 'px';
        this.renderer.domElement.style.height = h + 'px';
        this.renderer.setPixelRatio(1);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;

        // PERFORMANCE: Reduce shadow quality on mobile or low-end GPU
        if (isMobile || isLowGPU) {
          this.renderer.shadowMap.type = THREE.BasicShadowMap;
          if (this.renderer.shadowMap.mapSize) this.renderer.shadowMap.mapSize.set(512, 512);
        } else {
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          if (this.renderer.shadowMap.mapSize) this.renderer.shadowMap.mapSize.set(1024, 1024);
        }
        this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(65, w / h, .1, 350);

        // PERFORMANCE: Disable expensive bloom on mobile
        try {
          if (THREE.EffectComposer && !isMobile && !isLowGPU) {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
            const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.6, 0.85);
            bloomPass.threshold = 0.82;
            bloomPass.strength = 0.35;
            bloomPass.radius = 0.5;
            this.composer.addPass(bloomPass);
          } else {
            this.composer = null; // No post-processing on mobile
          }
        } catch(e) { console.warn("Post processing err:", e); }
        
        // Cache DOM elements to prevent query overhead per frame
        const ids = ['3c', 'gspd', 'garc', 'htmr', 'hfin', 'hfill', 'hcp', 'da', 'da-arrow', 'dal', 'ow', 'sig-ind', 'sind-lamp', 'sind-state', 'sind-dist', 'sind-timer', 'mmc', 'boostgauge', 'boost-arc', 'boost-pct', 'boost-vignette', 'boost-ready', 'speed-lines', 'phone-gps', 'phone-gps-arrow', 'phone-gps-dist', 'phone-gps-dir', 'phone-gps-obj', 'phone-gps-btn'];
        ids.forEach(id => { this.dom[id] = document.getElementById(id); });
      }
      _rsz() { if (!this.renderer) return; const maxW = 1920, maxH = 1080; const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); let w = innerWidth, h = innerHeight; let dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2); if (w * dpr > maxW) dpr = maxW / w; if (h * dpr > maxH) dpr = maxH / h; this._dpr = dpr; this.renderer.setSize(w * dpr, h * dpr, false); this.renderer.domElement.style.width = w + 'px'; this.renderer.domElement.style.height = h + 'px'; if (this.composer) { this.composer.setSize(w * dpr, h * dpr); } if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); } }
      _initIn() {
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            const gm = { p: 'P', r: 'R', n: 'N', d: 'D', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5' };
            if (gm[e.key.toLowerCase()]) this.setGear(gm[e.key.toLowerCase()]);
            if (e.key === ' ') this._horn();
            if (e.key.toLowerCase() === 'b') this._brake();
            if (e.key.toLowerCase() === 'h') this.toggleHighBeam();
            if (e.key.toLowerCase() === 'q') this.toggleTurnSignal(-1);
            if (e.key.toLowerCase() === 'e') this.toggleTurnSignal(1);
            if (e.key.toLowerCase() === 'm') this.togglePhoneGps();
            if (e.key === 'Escape') this.togglePause();
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        // Pointer Lock & Mouse Look
        this._lastPointerUnlock = 0;
        if (this.renderer && this.renderer.domElement) {
          this.renderer.domElement.addEventListener('click', () => {
            if (this.playing && !this.pause && Date.now() - this._lastPointerUnlock > 500) {
              try { 
                const p = document.body.requestPointerLock();
                if (p && p.catch) p.catch(() => {});
              } catch(e) {}
            }
          });
        }
        document.addEventListener('pointerlockchange', () => {
          const locked = document.pointerLockElement === this.renderer.domElement;
          if (!locked && this.isPointerLocked) this._lastPointerUnlock = Date.now();
          this.isPointerLocked = locked;
          // Phase 7.4: Trigger smooth camera transition on mode switch
          if (locked) this._camTransition = 0.4; // 1st→3rd: lerp over 0.4s
        });
        document.addEventListener('mousemove', (e) => {
          if (this.isPointerLocked) {
            if (this.isPedestrian) {
              this.player.rotation.y -= e.movementX * 0.003;
            } else {
              this.camYaw = (this.camYaw || 0) - e.movementX * 0.003;
            }
            this.camPitch = (this.camPitch || 0) - e.movementY * 0.003;
            this.camPitch = Math.max(-1.5, Math.min(1.5, this.camPitch));
          } else if (this._isDraggingCamera) {
            this.camYaw = (this.camYaw || 0) - e.movementX * 0.004;
            this.camPitch = (this.camPitch || 0) - e.movementY * 0.004;
            this.camPitch = Math.max(-1.0, Math.min(1.0, this.camPitch));
          }
        });
        // Left-click drag for third-person camera orbit (desktop only)
        if (this.renderer && this.renderer.domElement) {
          this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.playing && !this.pause && !this.isPointerLocked && (!e.pointerType || e.pointerType === 'mouse') && !('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
              this._isDraggingCamera = true;
            }
          });
          window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this._isDraggingCamera = false;
          });
        }

        // Mobile Controls Bindings
        const bindTouch = (id, key) => {
          const el = document.getElementById(id);
          if (el) {
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
          }
        };
        // Steering wheel logic
        window.analogSteering = 0;
        const wheel = document.getElementById('steer-wheel');
        const knob = document.getElementById('steer-knob');
        if (wheel && knob) {
          let isSteering = false;
          const cw = 140 / 2;

          const updateSteer = (cx, cy) => {
            const rect = wheel.getBoundingClientRect();
            const wx = rect.left + cw;
            const wy = rect.top + cw;
            let dx = cx - wx;
            let dy = cy - wy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > cw - 25) {
              dx = (dx / dist) * (cw - 25);
              dy = (dy / dist) * (cw - 25);
            }
            knob.style.transform = `translate(${dx}px, ${dy}px)`;
            window.analogSteering = dx / (cw - 25);
          };

          wheel.addEventListener('touchstart', (e) => {
            isSteering = true;
            updateSteer(e.touches[0].clientX, e.touches[0].clientY);
          });
          wheel.addEventListener('touchmove', (e) => {
            if (!isSteering) return;
            e.preventDefault();
            updateSteer(e.touches[0].clientX, e.touches[0].clientY);
          }, { passive: false });
          const resetSteer = () => {
            isSteering = false;
            knob.style.transform = `translate(0px, 0px)`;
            window.analogSteering = 0;
          };
          wheel.addEventListener('touchend', resetSteer);
          wheel.addEventListener('touchcancel', resetSteer);

          wheel.addEventListener('mousedown', (e) => {
            isSteering = true;
            updateSteer(e.clientX, e.clientY);
          });
          window.addEventListener('mousemove', (e) => {
            if (!isSteering) return;
            updateSteer(e.clientX, e.clientY);
          });
          window.addEventListener('mouseup', resetSteer);
        }
        const swC = document.getElementById('steer-wheel-container');
        const sw = document.getElementById('steer-wheel');
        if (swC && sw) {
          let isDragging = false;
          let startAngle = 0;
          let currentRot = 0;

          const getAngle = (e) => {
            const rect = swC.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const t = e.targetTouches && e.targetTouches.length > 0 ? e.targetTouches[0] : (e.touches && e.touches.length > 0 ? e.touches[0] : e);
            return Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI;
          };

          const down = (e) => {
            isDragging = true;
            startAngle = getAngle(e) - currentRot;
          };
          swC.addEventListener('touchstart', down, { passive: true });
          swC.addEventListener('mousedown', down);

          const move = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            let angle = getAngle(e) - startAngle;
            if (angle > 90) angle = 90;
            if (angle < -90) angle = -90;
            currentRot = angle;
            sw.style.transform = `rotate(${currentRot}deg)`;
            window.analogSteering = currentRot / 90;
          };
          swC.addEventListener('touchmove', move, { passive: false });
          window.addEventListener('mousemove', move);

          const up = () => {
            isDragging = false;
            currentRot = 0;
            sw.style.transform = `rotate(0deg)`;
            window.analogSteering = 0;
            const wheel = document.getElementById('steer-wheel');
            const knob = document.getElementById('steer-knob');
            if (wheel && knob) {
              let isSteering = false;
              const cw = 140 / 2;

              const updateSteer = (cx, cy) => {
                const rect = wheel.getBoundingClientRect();
                const wx = rect.left + cw;
                const wy = rect.top + cw;
                let dx = cx - wx;
                let dy = cy - wy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > cw - 25) {
                  dx = (dx / dist) * (cw - 25);
                  dy = (dy / dist) * (cw - 25);
                }
                knob.style.transform = `translate(${dx}px, ${dy}px)`;
                window.analogSteering = dx / (cw - 25);
              };

              wheel.addEventListener('touchstart', (e) => {
                isSteering = true;
                updateSteer(e.touches[0].clientX, e.touches[0].clientY);
              });
              wheel.addEventListener('touchmove', (e) => {
                if (!isSteering) return;
                e.preventDefault();
                updateSteer(e.touches[0].clientX, e.touches[0].clientY);
              }, { passive: false });
              const resetSteer = () => {
                isSteering = false;
                knob.style.transform = `translate(0px, 0px)`;
                window.analogSteering = 0;
              };
              wheel.addEventListener('touchend', resetSteer);
              wheel.addEventListener('touchcancel', resetSteer);
            }
          };
          swC.addEventListener('touchend', up);
          swC.addEventListener('touchcancel', up);
          window.addEventListener('mouseup', up);
        }

        bindTouch('mc-gas', 'arrowup');
        bindTouch('mc-brake', 'arrowdown');
        bindTouch('mc-boost', 'shift');

        // Phone GPS toggle button
        const gpsBtn = document.getElementById('phone-gps-btn');
        if (gpsBtn) {
          gpsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.togglePhoneGps(); }, { passive: false });
          gpsBtn.addEventListener('click', () => this.togglePhoneGps());
        }
        const gpsClose = document.getElementById('phone-gps-close');
        if (gpsClose) {
          gpsClose.addEventListener('click', () => this.togglePhoneGps());
          gpsClose.addEventListener('touchstart', (e) => { e.preventDefault(); this.togglePhoneGps(); }, { passive: false });
        }

        // Gyroscope steering — opt-in toggle (mobile)
        window.gyroSteering = 0;
        this._gyroSupported = !!window.DeviceOrientationEvent;
        this._gyroNeedsPermission = this._gyroSupported && typeof DeviceOrientationEvent.requestPermission === 'function';
        this._startGyro = () => {
          if (this._gyroHandler) return;
          this._gyroHandler = (e) => {
            if (e.gamma !== null) this._lastGyroGamma = e.gamma;
            if (e.gamma !== null && this.gyroOn && this.playing && !this.isPedestrian) {
              const raw = Math.max(-30, Math.min(30, e.gamma));
              window.gyroSteering = (raw - this.gyroBaseGamma) / 30;
            } else {
              window.gyroSteering = 0;
            }
          };
          window.addEventListener('deviceorientation', this._gyroHandler, true);
        };
        this._stopGyro = () => {
          if (this._gyroHandler) {
            window.removeEventListener('deviceorientation', this._gyroHandler, true);
            this._gyroHandler = null;
          }
          window.gyroSteering = 0;
        };
        this._autoGyro = () => {
          if (!this._gyroSupported || this.gyroOn) return;
          const doEnable = () => {
            this.gyroOn = true;
            this.gyroBaseGamma = 0;
            this._startGyro();
            setTimeout(() => {
              if (this.gyroOn && this._lastGyroGamma != null) this.gyroBaseGamma = this._lastGyroGamma;
            }, 200);
          };
          if (this._gyroNeedsPermission) {
            DeviceOrientationEvent.requestPermission().then(state => {
              if (state === 'granted') doEnable();
            }).catch(() => {});
          } else {
            doEnable();
          }
        };


        const sb = (id, k) => {
          const el = document.getElementById(id); if (!el) return;
          const dn = e => { e.preventDefault(); this.keys[k] = true }; const up = e => { e.preventDefault(); this.keys[k] = false };
          el.addEventListener('touchstart', dn, { passive: false }); el.addEventListener('touchend', up, { passive: false });
          el.addEventListener('mousedown', dn); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up);
        };
        sb('tl', 'arrowleft'); sb('tr', 'arrowright'); sb('tu', 'arrowup'); sb('abb', 'b'); sb('abh', ' ');


        this._initMobileCameraLook();
      }
      _initG() { document.querySelectorAll('.gb').forEach(b => { b.addEventListener('click', () => this.setGear(b.dataset.g)); b.addEventListener('touchstart', e => { e.preventDefault(); this.setGear(b.dataset.g); }, { passive: false }); }); }

      _initMobileCameraLook() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
        const isControl = (el) => {
          if (!el) return false;
          const ctrlIds = ['steer-wheel-container','steer-wheel','mc-brake','mc-gas','mc-boost','phone-gps-btn','phone-gps','tl','tr','tu','abb','abh','btn-seatbelt','btn-mobile'];
          for (const id of ctrlIds) {
            const c = document.getElementById(id);
            if (c && (el === c || c.contains(el))) return true;
          }
          if (el.closest && el.closest('#mobile-controls')) return true;
          if (el.closest && el.closest('#hud')) return true;
          if (el.closest && el.closest('#hudbar')) return true;
          if (el.closest && el.closest('#civic-controls')) return true;
          return false;
        };
        const lookThreshold = 10;
        let lookCandidateX = 0, lookCandidateY = 0;
        document.addEventListener('touchstart', (e) => {
          if (!this.playing || this.pause) return;
          const t = e.changedTouches[0];
          if (isControl(t.target)) return;
          lookCandidateX = t.clientX;
          lookCandidateY = t.clientY;
        }, { passive: true });
        document.addEventListener('touchmove', (e) => {
          if (!this.playing || this.pause) return;
          if (this._isDraggingMobileLook) {
            for (let i = 0; i < e.touches.length; i++) {
              if (e.touches[i].identifier === this._mobileLookTouchId) {
                const dx = e.touches[i].clientX - this._prevMobileLookX;
                const dy = e.touches[i].clientY - this._prevMobileLookY;
                this._prevMobileLookX = e.touches[i].clientX;
                this._prevMobileLookY = e.touches[i].clientY;
                this.camYaw -= dx * 0.005;
                this.camPitch -= dy * 0.005;
                this.camPitch = Math.max(-1.2, Math.min(1.2, this.camPitch));
                e.preventDefault();
                return;
              }
            }
          } else {
            for (let i = 0; i < e.touches.length; i++) {
              if (Math.abs(e.touches[i].clientX - lookCandidateX) > lookThreshold || Math.abs(e.touches[i].clientY - lookCandidateY) > lookThreshold) {
                if (!isControl(e.touches[i].target)) {
                  this._isDraggingMobileLook = true;
                  this._mobileLookTouchId = e.touches[i].identifier;
                  this._prevMobileLookX = e.touches[i].clientX;
                  this._prevMobileLookY = e.touches[i].clientY;
                  e.preventDefault();
                  return;
                }
              }
            }
          }
        }, { passive: false });
        document.addEventListener('touchend', (e) => {
          if (!this._isDraggingMobileLook) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this._mobileLookTouchId) {
              this._isDraggingMobileLook = false;
              this._mobileLookTouchId = null;
              return;
            }
          }
        }, { passive: true });
        document.addEventListener('touchcancel', () => {
          this._isDraggingMobileLook = false;
          this._mobileLookTouchId = null;
        }, { passive: true });
      }

      _decayCameraLook(dt) {
        if (this._isDraggingMobileLook) return;
        if (this.isPointerLocked || this._isDraggingCamera) return;
        const decayRate = 4;
        const threshold = 0.005;
        if (Math.abs(this.camYaw) > threshold || Math.abs(this.camPitch) > threshold) {
          const factor = Math.max(0, 1 - decayRate * dt);
          this.camYaw *= factor;
          this.camPitch *= factor;
          if (Math.abs(this.camYaw) < threshold) this.camYaw = 0;
          if (Math.abs(this.camPitch) < threshold) this.camPitch = 0;
        } else {
          this.camYaw = 0;
          this.camPitch = 0;
        }
      }

      _buildRoadZones(rw) {
        if (!this.mapCfg) return;
        const roads = this.mapCfg.roads;
        if (!roads) return;
        const m = 2;
        this._roadZones = roads.map(r => {
          const isV = r.type === 'v';
          const halfW = rw + m;
          if (isV) {
            return { x1: r.x - halfW, x2: r.x + halfW, z1: Math.min(r.z1, r.z2) - m, z2: Math.max(r.z1, r.z2) + m, isV: true };
          } else {
            const cz = r.z;
            return { x1: Math.min(r.x1, r.x2) - m, x2: Math.max(r.x1, r.x2) + m, z1: cz - halfW, z2: cz + halfW, isV: false };
          }
        });
      }

      _isOnRoad(x, z) {
        if (!this._roadZones) return false;
        for (const rz of this._roadZones) {
          if (x >= rz.x1 && x <= rz.x2 && z >= rz.z1 && z <= rz.z2) return true;
        }
        return false;
      }

      _isInBuildZone(x, z) {
        if (!this._roadZones) return true;
        const buildMargin = 40;
        for (const rz of this._roadZones) {
          const bx1 = rz.x1 - buildMargin;
          const bx2 = rz.x2 + buildMargin;
          const bz1 = rz.z1 - buildMargin;
          const bz2 = rz.z2 + buildMargin;
          if (x >= bx1 && x <= bx2 && z >= bz1 && z <= bz2) return true;
        }
        return false;
      }

      setGear(g) {
        const caps = { P: 0, R: .28, N: 0, D: .85 };
        const newCap = caps[g] ?? 0;
        this.gear = g;
        // Clamp speed immediately on gear change
        if (g === 'P' || g === 'N') { this.speed *= .1; }
        else if (this.speed > 0 && newCap < this.gcap && this.speed > newCap) { this.speed = newCap * 0.92; }
        this.gcap = newCap;
        document.getElementById('gread').textContent = 'GEAR: ' + g;
        document.querySelectorAll('.gb').forEach(b => b.classList.toggle('ag', b.dataset.g === g));
      }
      _horn() { 
          this._honkedThisFrame = true;
          if (this.mapCfg && this.mapCfg.isSilenceZone) { 
              this.vio++; 
              this.score -= 50; 
              this.fine += 2000; 
              ui.issueChallan('Honking in No-Honking Zone', 'Sec 190(2) MV Act', '₹2,000', 'Silence Zone Violation'); 
          } else { 
              toast('📢 Beep Beep!', '#ffd54a'); 
              sfx.play('horn'); 
          } 
      }
      _brake() { this.speed *= .35; sfx.play('brake'); toast('🛑 Hard Deceleration Active', '#fff'); }
      startLevel() { const cd = document.getElementById('cdown'); cd.classList.add('on'); const gc = document.getElementById('gc'); if (gc && !document.fullscreenElement && gc.requestFullscreen) { gc.requestFullscreen().catch(() => {}); } setTimeout(() => { cd.classList.remove('on'); this._actualStart(ui.cur); }, 1500); }
      async _actualStart(lv) {
        this.mode = lv.mode; this.vehMode = lv.vehMode; this.lvId = lv.id; this.score = 0; this.hp = 100; this.fine = 0; this.vio = 0; this.timer = 0; this.speed = 0; this.routeIdx = 0; this.retries = 0; this.vx = 0; this.vz = 0;
        this.ms = { inSz: false, passed: false, amb: null };
        this.challanFired = new Set();
        this.seatbeltOn = false;
        this.mobileOn = false;
        this.bucklingUp = false;
        this.boostFuel = 100; this.boosting = false; this._wasDepleted = false;
        this._grip = 0.62; this._camShakeAmt = 0; this._camTilt = 0; this._camFovTarget = 60;
        this.highBeamOn = false;
        this.turnSignal = 0;
        this.turnTimer = 0;
        this.phoneGpsOn = false;
        this._honkedThisFrame = false;
        this._nearbyPedCount = 0;
        this._collidedThisFrame = false;
        this._ambulanceNear = false;
        this._maintainedSpeed = true;
        this._nearHospital = false;
        this._movedAfterGreen = false;
        this._reachedParking = false;
        this._reachedMarket = false;
        this._reachedLeftSide = false;
        this._reachedLeftLane = false;
        this._reachedMainRoad = false;
        this._reachedGuard = false;
        this._reachedVolunteer = false;
        this._reachedGap = false;
        this._prevSpeed = 0;
        // Reset challan tracking for this run
        if (game.challanLog) game.challanLog = [];
        const cStack = document.getElementById('challan-stack');
        if (cStack) { cStack.innerHTML = ''; cStack.classList.remove('on'); }
        if (ui.cq) ui.cq = [];
        ui.cbusy = false;
        this.setGear('N');
        // Lazy-load level-specific models before building scene
        if (typeof window.loadLevelAssets === 'function') {
          await new Promise(resolve => window.loadLevelAssets(lv.assets, resolve));
        }
        this._buildScene(lv.mode); this.playing = true; this.pause = false; ui.show(null);         const baseTime = this.mapCfg ? this.mapCfg.timeLimit || 120 : 120;
        const ageTimeScale = (typeof ui !== 'undefined' && ui.getAgeScale) ? ui.getAgeScale() : 1.0;
        this.timeLimit = Math.round(baseTime / ageTimeScale);
        const cfg = this.mapCfg || {};
        ['gc', 'hud', 'hudbar', 'hwrap', 'mobile-controls', 'objective-overlay'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('on'); });
        if (this.dom['phone-gps-btn']) this.dom['phone-gps-btn'].style.display = 'flex';
        
        // Show objective
        const objDesc = document.getElementById('objective-desc');
        if(objDesc && lv.pract) { objDesc.innerHTML = lv.pract; }
        
        if (!cfg.isPedestrian) { 
            ['spgauge', 'gp', 'civic-controls'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'flex'; });
        } else {
            const el = document.getElementById('civic-controls'); if (el) el.style.display = 'none';
        }
        
        // Reset button styles
        const btnS = document.getElementById('btn-seatbelt');
        if (btnS) { btnS.style.background = '#333'; btnS.textContent = (this.vehMode === 'bike' || this.vehMode === 'cycle') ? '🪖 Helmet OFF' : '💺 Seatbelt OFF'; }
        const btnM = document.getElementById('btn-mobile');
        if (btnM) { btnM.style.background = '#333'; btnM.textContent = '📱 Use Mobile Phone'; }
        
        if (mob()) document.getElementById('tc').classList.add('on');
        if (mob()) this._autoGyro();
        document.getElementById('hlv').textContent = lv.id; document.getElementById('hobj').textContent = lv.tg; this._uh(); sfx.play('ok');
        
        // Initialize tasks for this level
        this._initTasks(lv);
      }
      stopPlay() { this.playing = false; this.tasks = []; const tt = document.getElementById('task-tracker'); if (tt) tt.style.display = 'none'; ['gc', 'hud', 'hudbar', 'hwrap', 'spgauge', 'gp', 'tc', 'mobile-controls', 'objective-overlay'].forEach(i => { const el = document.getElementById(i); if (el) el.classList.remove('on'); }); const cc = document.getElementById('civic-controls'); if (cc) cc.style.display = 'none'; const bg = this.dom['boostgauge']; if (bg) bg.style.display = 'none'; const bv = this.dom['boost-vignette']; if (bv) { bv.style.display = 'none'; bv.style.opacity = '0'; }         const br = this.dom['boost-ready']; if (br) { br.style.display = 'none'; br.style.opacity = '0'; }         const sl = this.dom['speed-lines']; if (sl) { sl.style.display = 'none'; sl.style.opacity = '0'; } this._camShakeAmt = 0; this._camTilt = 0; this._camFovTarget = 60; if(this.dom['mmc']) this.dom['mmc'].classList.remove('on'); if(this.dom['da']) this.dom['da'].style.display = 'none'; if(this.dom['sig-ind']) this.dom['sig-ind'].style.display = 'none'; if(this.dom['ow']) this.dom['ow'].classList.remove('on'); if(this.dom['phone-gps']) this.dom['phone-gps'].classList.remove('on'); this.phoneGpsOn = false; if(this.dom['phone-gps-btn']) this.dom['phone-gps-btn'].style.display = 'none'; }
      toggleSeatbelt(btn) {
          this.seatbeltOn = !this.seatbeltOn;
          const isBike = (this.vehMode === 'bike' || this.vehMode === 'cycle');
          if (this.seatbeltOn) {
              btn.style.background = '#27ae60';
              btn.textContent = isBike ? '🪖 Helmet ON' : '💺 Seatbelt ON';
              toast(isBike ? 'Helmet Secured! +10% Speed' : 'Seatbelt Fastened! +10% Speed', '#27ae60');
              if (!this.isPedestrian) {
                  const base = this.mapCfg && this.mapCfg.themeType === 'highway' ? 1.4 : 1.1;
                  this.maxSpd = base * 1.1;
              }
          } else {
              btn.style.background = '#333';
              btn.textContent = isBike ? '🪖 Helmet OFF' : '💺 Seatbelt OFF';
              toast(isBike ? 'Helmet Removed!' : 'Seatbelt Unfastened! -10% Speed', '#ff3b30');
              if (!this.isPedestrian) {
                  this.maxSpd = this.mapCfg && this.mapCfg.themeType === 'highway' ? 1.4 : 1.1;
              }
          }
      }
      toggleHighBeam() {
          if (!this.mapCfg || !this.mapCfg.isNight) return;
          this.highBeamOn = !this.highBeamOn;
          if (this.hL) this.hL.distance = this.highBeamOn ? 300 : 150;
          if (this.hR) this.hR.distance = this.highBeamOn ? 300 : 150;
          // Sync visible cone geometry scale
          if (this._headlightCones) {
            const s = this.highBeamOn ? 1.5 : 0.8;
            this._headlightCones.forEach(c => c.scale.set(1, 1, s));
          }
          toast(this.highBeamOn ? 'High Beam ON' : 'Low Beam ON', '#3498db');
      }
      togglePause() {
          if (!this.playing) return;
          this.pause = !this.pause;
          const overlay = document.getElementById('pause-overlay');
          if (overlay) {
            overlay.classList.toggle('on', this.pause);
            if (this.pause && !this._pauseWired) {
              this._pauseWired = true;
              document.getElementById('pause-resume')?.addEventListener('click', () => this.togglePause());
              document.getElementById('pause-restart')?.addEventListener('click', () => { this.pause = false; location.reload(); });
              document.getElementById('pause-quit')?.addEventListener('click', () => {
                this.pause = false;
                this.playing = false;
                const o = document.getElementById('pause-overlay');
                if (o) o.classList.remove('on');
                document.getElementById('game-over')?.classList.add('on');
              });
            }
          }
      }
      togglePhoneGps() {
          this.phoneGpsOn = !this.phoneGpsOn;
          const gps = this.dom['phone-gps'];
          const btn = this.dom['phone-gps-btn'];
          if (this.phoneGpsOn) {
              if (gps) gps.classList.add('on');
              if (btn) btn.style.background = 'rgba(94, 212, 245, 0.5)';
              const isParked = this.isPedestrian || Math.abs(this.speed) < 0.05;
              if (!isParked) {
                  toast('⚠️ Keep eyes on the road!', '#e74c3c');
              }
          } else {
              if (gps) gps.classList.remove('on');
              if (btn) btn.style.background = 'rgba(94, 212, 245, 0.25)';
          }
      }
      toggleTurnSignal(dir) {
          if (this.turnSignal === dir) {
              this.turnSignal = 0; // turn off if same
              toast('Turn Signal OFF', '#95a5a6');
          } else {
              this.turnSignal = dir;
              toast(dir === -1 ? 'Left Signal ON' : 'Right Signal ON', '#f39c12');
          }
      }
      toggleMobile(btn) {
          this.mobileOn = !this.mobileOn;
          const isParked = this.isPedestrian || Math.abs(this.speed) < 0.05;
          if (this.mobileOn) {
              if (isParked) {
                  btn.style.background = '#2196F3';
                  btn.textContent = '🗺️ GPS Maps';
                  toast('🗺️ Using GPS — Parked safely!', '#2196F3');
              } else {
                  btn.style.background = '#e74c3c';
                  btn.textContent = '📵 Using Mobile...';
                  toast('⚠️ Distracted Driving! ₹500 fine', '#e74c3c');
                  if (!this.challanFired.has('mobile_drive')) {
                      this.challanFired.add('mobile_drive');
                      ui.issueChallan('Using Mobile while Driving', 'Sec 184 MV Act', '₹5,000', 'Dangerous Driving');
                      this.vio++; this.score -= 50; this.fine += 5000;
                      this.hp -= 10; this._uh();
                  }
              }
          } else {
              btn.style.background = '#333';
              btn.textContent = '📱 Use Mobile Phone';
          }
      }
      _uh() { const p = Math.max(0, this.hp); const f = this.dom['hfill']; if (f) f.style.width = p + '%'; if (p <= 0) this._go("Structural Failure"); }
      
      _initTasks(lv) {
        this.tasks = lv.tasks ? JSON.parse(JSON.stringify(lv.tasks)) : [];
        this._renderTasks();
      }
      
      _renderTasks() {
        const list = document.getElementById('task-list');
        const tracker = document.getElementById('task-tracker');
        if (!list || !tracker) return;
        if (this.tasks.length === 0) { tracker.style.display = 'none'; return; }
        tracker.style.display = 'block';
        list.innerHTML = this.tasks.map(t => {
          const icon = t.done ? '✅' : '⬜';
          const style = t.done ? 'text-decoration:line-through;opacity:0.5;' : '';
          return `<div style="display:flex;align-items:center;gap:8px;${style}"><span>${icon}</span><span>${t.text}</span></div>`;
        }).join('');
      }
      
      _computeTaskFlags() {
        const px = this.player ? this.player.position.x : 0;
        const pz = this.player ? this.player.position.z : 0;
        const spd = Math.abs(this.speed || 0);

        // Positional flags (latched — once true, stay true)
        if (px < -2) this._reachedLeftSide = true;
        if (px < -1) this._reachedLeftLane = true;

        // Parking: off main road and slow/stopped
        const RW = 18;
        const onRoad = Math.abs(px) < RW / 2;
        const onSidewalk = Math.abs(px) > RW / 2 && Math.abs(px) < RW / 2 + 6;
        if (!onRoad && !onSidewalk && spd < 0.1) this._reachedParking = true;

        // Main road: on road surface and moving
        if (onRoad && spd > 0.01) this._reachedMainRoad = true;

        // Market zone: level theme is market OR deep in city (high checkpoint index)
        if (this.themeType === 'market' || this.themeType === 'busy_market') this._reachedMarket = true;

        // Hospital: level theme
        this._nearHospital = (this.themeType === 'hospital' || this.themeType === 'hospital_zone');

        // NPC proximity for guard/volunteer/gap
        this._reachedGuard = false;
        this._reachedVolunteer = false;
        this._reachedGap = false;
        if (this.npcs) {
          for (const n of this.npcs) {
            if (!n.position) continue;
            const d = this.player ? this.player.position.distanceTo(n.position) : 999;
            if (d < 6) {
              if (n.userData && n.userData.npcType === 'guard') this._reachedGuard = true;
              if (n.userData && n.userData.npcType === 'volunteer') this._reachedVolunteer = true;
            }
          }
          // Gap: find two NPCs close together with space between
          for (let i = 0; i < this.npcs.length; i++) {
            for (let j = i + 1; j < this.npcs.length; j++) {
              const a = this.npcs[i], b = this.npcs[j];
              if (!a.position || !b.position) continue;
              const dAB = a.position.distanceTo(b.position);
              const dPA = this.player ? this.player.position.distanceTo(a.position) : 999;
              const dPB = this.player ? this.player.position.distanceTo(b.position) : 999;
              if (dAB > 4 && dAB < 12 && dPA < 8 && dPB < 8) {
                this._reachedGap = true;
                break;
              }
            }
            if (this._reachedGap) break;
          }
        }

        // Moved after green: was at red light, now moving
        if (this.sigs) {
          for (const sg of this.sigs) {
            if (sg.userData && sg.userData.st === 'green' && spd > 0.05) {
              this._movedAfterGreen = true;
            }
          }
        }

        // Maintained speed: no sudden deceleration this frame
        this._maintainedSpeed = (this._prevSpeed !== undefined) ? (spd >= this._prevSpeed * 0.7 || spd > 0.3) : true;
        this._prevSpeed = spd;

        // Driving-instructor task flags (latched)
        // Lane change: player.x moved from positive (right) to negative (left)
        if (this._prevPx !== undefined && this._prevPx > 0 && px < 0) this._changedLaneLeft = true;
        // Merge back: player.x moved from negative (left) to positive (right)
        if (this._prevPx !== undefined && this._prevPx < 0 && px > 0) this._mergedBack = true;
        this._prevPx = px;

        // Overtake bus: player passed a bus NPC (was behind, now ahead)
        this._didOvertakeBus = false;
        if (this.npcs) {
          for (const n of this.npcs) {
            if (!n.position || !(n.userData && n.userData.npcType === 'bus')) continue;
            const d = this.player ? this.player.position.distanceTo(n.position) : 999;
            if (d < 20 && this._prevPx !== undefined) {
              // Bus is nearby; check if player is ahead (smaller z) and on right side
              if (px > n.position.x && d < 12) this._didOvertakeBus = true;
            }
          }
        }
      }

      _checkTasks() {
        if (!this.tasks || this.tasks.length === 0) return;
        let changed = false;
        for (const t of this.tasks) {
          if (t.done) continue;
          let complete = false;
          switch (t.type) {
            case 'stop':
              if (t.target === 'stationary' && Math.abs(this.speed) < 0.05) complete = true;
              else if (t.target === 'walking_speed' && Math.abs(this.speed) < 0.15) complete = true;
              else if (t.target === 'parking_zone' && Math.abs(this.speed) < 0.05) complete = true;
              else if (t.target === 'parking_spot' && Math.abs(this.speed) < 0.05) complete = true;
              else if (t.target === 'red_light' && Math.abs(this.speed) < 0.05) complete = true;
              break;
            case 'reach':
              if (t.target === 'destination' && this.cps && this.hits >= this.cps.length && this.cps.length > 0) complete = true;
              else if (t.target === 'green_light' && this._movedAfterGreen) complete = true;
              else if (t.target === 'parking_spot' && this._reachedParking) complete = true;
              else if (t.target === 'market_zone' && this._reachedMarket) complete = true;
              else if (t.target === 'left_side' && this._reachedLeftSide) complete = true;
              else if (t.target === 'left_lane' && this._reachedLeftLane) complete = true;
              else if (t.target === 'left_lane_changed' && this._changedLaneLeft) complete = true;
              else if (t.target === 'overtake_bus' && this._didOvertakeBus) complete = true;
              else if (t.target === 'merged_back' && this._mergedBack) complete = true;
              else if (t.target === 'forward_space' && Math.abs(this.speed) > 0.01) complete = true;
              else if (t.target === 'away_gate' && Math.abs(this.speed) > 0.01) complete = true;
              else if (t.target === 'visitor_parking' && this._reachedParking) complete = true;
              else if (t.target === 'main_road' && this._reachedMainRoad) complete = true;
              else if (t.target === 'guard_signal' && this._reachedGuard) complete = true;
              else if (t.target === 'volunteer_signal' && this._reachedVolunteer) complete = true;
              else if (t.target === 'gap_spot' && this._reachedGap) complete = true;
              break;
            case 'avoid':
              if (t.target === 'honk' && this._honkedThisFrame) { /* fail, not complete */ }
              else if (t.target === 'speed_zone' && Math.abs(this.speed) > 0.22) { /* fail */ }
              else if (t.target === 'speed_night' && Math.abs(this.speed) > 0.35) { /* fail */ }
              else if (t.target === 'speed_puddle' && Math.abs(this.speed) > 0.25) { /* fail */ }
              else if (t.target === 'speed_hospital' && Math.abs(this.speed) > 0.25) { /* fail */ }
              else if (t.target === 'speed_festival' && Math.abs(this.speed) > 0.15) { /* fail */ }
              else if (t.target === 'pedestrian' && this._nearbyPedCount === 0) complete = true;
              else if (t.target === 'collision' && !this._collidedThisFrame) complete = true;
              else if (t.target === 'ambulance' && !this._ambulanceNear) complete = true;
              else if (t.target === 'stop_sudden' && this._maintainedSpeed) complete = true;
              else if (t.target === 'hospital_zone' && !this._nearHospital) complete = true;
              break;
            case 'toggle':
              if (t.target === 'seatbelt' && this.seatbeltOn) complete = true;
              else if (t.target === 'hazards' && this.highBeamOn) complete = true;
              else if (t.target === 'indicator' && this.turnSignal !== 0) complete = true;
              else if (t.target === 'indicator_right' && this.turnSignal === 1) complete = true;
              else if (t.target === 'headlights' && this.highBeamOn) complete = true;
              break;
          }
          if (complete) {
            t.done = true;
            changed = true;
            toast('✅ ' + t.text, '#27ae60');
            sfx.play('ok');
          }
        }
        if (changed) this._renderTasks();
      }
      
      _go(reason) {
        this.stopPlay();
        toast('💥 ' + (reason || 'Structural Failure!'), '#ff3b30');
        setTimeout(() => {
          const cr = document.getElementById('crash-reason');
          const ci = document.getElementById('crash-info');
          let rLife = "Dangerous driving can lead to severe structural damage and potential injury.";

          const rLower = (reason || "").toLowerCase();
          if (rLower.includes('pedestrian')) {
            rLife = "Sec 304A IPC: Causing death by negligence can result in up to 2 years imprisonment. Always yield to pedestrians!";
          } else if (rLower.includes('off-road')) {
            rLife = "Off-roading in urban limits damages pavements, endangers pedestrian lives, and attracts strict penalties under local traffic regulations.";
          } else if (rLower.includes('barricade')) {
            rLife = "Damaging public property or barricades is a punishable offense under the Prevention of Damage to Public Property Act.";
          } else if (rLower.includes('vehicle') || rLower.includes('car') || rLower.includes('bus') || rLower.includes('auto')) {
            rLife = "Under Sec 279 IPC, rash driving leading to a crash can result in imprisonment up to 6 months, a heavy fine, or both.";
          } else if (rLower.includes('time')) {
            rLife = "Time Management is crucial for emergency vehicles. Failing to reach the destination in time can cost lives.";
          }

          if (cr) cr.textContent = reason || "Structural Failure";
          if (ci) ci.textContent = rLife;

          document.getElementById('crash-screen').style.display = 'flex';
        }, 500);
      }
      retryLevel() {
        document.getElementById('crash-screen').style.display = 'none';
        this.retries = (this.retries || 0) + 1;
        this._actualStart(ui._sylLv || ui.cur);
      }
      completeLevel() {
        if (!this.playing) return;
        let finalBase = this.score + 500;
        if (this.retries > 0) {
          if (this.vio > 0 || this.hp < 100) {
            finalBase = Math.round(finalBase * 0.5); // 50% penalty if retry and not perfect
          }
        }
        this.fs = Math.max(0, finalBase);
        if (window.confetti) { confetti.init(); confetti.burst(4000); }
        // ── LEVEL REWARD CALCULATION ──
        const _lvId = (ui.cur ? ui.cur.id : 1);
        const _rewards = [2000,2000,2500,2500,3000,3000,3000,3500,3500,4000,4000,4500,4500,5000,6000];
        const _baseRew = _rewards[Math.min(_lvId - 1, 14)];
        const _noViolBonus = this.vio === 0 ? 800 : this.vio <= 2 ? 300 : 0;
        const _reward = _baseRew + _noViolBonus;
        S.wallet += _reward;
        save();
        const _hw = document.getElementById('hwallet');
        if (_hw) _hw.textContent = '₹' + S.wallet.toLocaleString('en-IN');
        this.fst = { fin: this.fine ? '₹' + this.fine : '', vio: this.vio, reward: _reward };
        this.stopPlay();
        toast('🏁 Run Evaluated!', '#00c851');
        // Show Mission Complete overlay first
        const _mco = document.createElement('div');
        _mco.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:fadeIn 0.3s ease;';
        _mco.innerHTML = '<div style="text-align:center;animation:cdownPulse 0.5s ease;"><div style="font-size:4rem;margin-bottom:16px;">🏆</div><h1 style="color:#ffd54a;font-size:2.5rem;font-family:Bebas Neue,sans-serif;letter-spacing:0.05em;margin-bottom:8px;text-shadow:0 4px 20px rgba(255,213,74,0.4);">MISSION COMPLETE!</h1><div style="color:white;font-size:1.5rem;font-weight:700;margin-bottom:12px;">Score: ' + game.fs + '</div><div style="color:rgba(255,255,255,0.6);font-size:0.95rem;">Proceeding to quiz...</div></div>';
        document.body.appendChild(_mco);
        setTimeout(() => { _mco.remove(); ui.showQuiz(ui.curMode || 'car'); }, 3000);
      }

      // 🚦 MAP CONFIGURATIONS FOR ALL MUMBAI LEVELS 🚦
      _getMapConfig(lvId) {
        let lv = null;
        if (window.LVS) {
            lv = window.LVS.find(l => l.id === lvId);
        }
        
        const M = {
          1: { name: 'Andheri Junction', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car', npcTypes: ['car', 'car', 'bike', 'auto', 'bus', 'truck', 'car', 'bike', 'taxi', 'car', 'auto', 'car', 'car', 'bike', 'bus', 'car', 'auto', 'truck', 'car', 'car', 'car', 'bike', 'auto', 'car'], roads: [{ type: 'v', x: 0, z1: -140, z2: 1000 }, { type: 'h', z: -120, x1: -20, x2: 140 }, { type: 'h', z: -120, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -140, z2: 20 }, { type: 'v', x: 240, z1: -20, z2: 140 }, { type: 'v', x: 240, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: 100, x2: 260 }, { type: 'h', z: 240, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 100, z2: 260 }, { type: 'h', z: 120, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: -20, z2: 140 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -380, x2: -220 }, { type: 'h', z: -120, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -380, x2: -220 }, { type: 'h', z: -360, x1: -260, x2: 880 }, { type: 'h', z: 120, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -880, z2: 1120 }, { type: 'h', z: 240, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -760, z2: 1240 }, { type: 'h', z: 0, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -1000, z2: 1000 }, { type: 'h', z: 240, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -760, z2: 1240 }, { type: 'h', z: -240, x1: -1480, x2: 520 }, { type: 'v', x: -480, z1: -1240, z2: 760 }], route: [{ x: 0, z: 0 }, { x: 0, z: -120 }, { x: 120, z: -120 }, { x: 240, z: -120 }, { x: 240, z: 0 }, { x: 240, z: 120 }, { x: 240, z: 240 }, { x: 120, z: 240 }, { x: 0, z: 240 }, { x: 0, z: 120 }, { x: -120, z: 120 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -360, z: -120 }, { x: -480, z: -120 }, { x: -480, z: -240 }, { x: -360, z: -240 }, { x: -360, z: -360 }, { x: -240, z: -360 }, { x: -120, z: -360 }], ints: [[240, 0], [0, 240], [-120, -360], [0, 120], [-240, -120], [0, 0], [-360, -240], [120, 240], [240, -120], [-360, -360], [-360, -120], [-120, 0], [240, 240], [-120, 120], [0, -120], [-120, -120], [-480, -240], [120, -120], [-480, -120], [-240, -360], [240, 120]], bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: 218, z1: -120, z2: 0, s: 0.9 }, { x: 262, z1: -120, z2: 0, s: 0.9 }, { x: 218, z1: 0, z2: 120, s: 0.9 }, { x: 262, z1: 0, z2: 120, s: 0.9 }, { x: 218, z1: 120, z2: 240, s: 0.9 }, { x: 262, z1: 120, z2: 240, s: 0.9 }, { x: -22, z1: 120, z2: 240, s: 0.9 }, { x: 22, z1: 120, z2: 240, s: 0.9 }, { x: -142, z1: 0, z2: 120, s: 0.9 }, { x: -98, z1: 0, z2: 120, s: 0.9 }, { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -502, z1: -240, z2: -120, s: 0.9 }, { x: -458, z1: -240, z2: -120, s: 0.9 }, { x: -382, z1: -360, z2: -240, s: 0.9 }, { x: -338, z1: -360, z2: -240, s: 0.9 }], timeLimit: 600, hasGarage: true, assets: ['suburban', 'industrial'] },
          2: { name: 'Dadar Junction', sky: 0x9ec5d9, fog: 500, ground: 0x4a6741, amb: 0.85, isPedestrian: true, veh: 'pedestrian', npcTypes: ['car', 'bus', 'auto', 'car', 'bike', 'truck', 'car', 'auto', 'taxi', 'car', 'bus', 'auto', 'car', 'bike', 'car', 'auto', 'car', 'bus', 'truck', 'car', 'auto', 'car', 'car', 'bike'], sidewalkWidth: 5, roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -140, z2: 20 }, { type: 'v', x: -240, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: -380, x2: -220 }, { type: 'h', z: 120, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -20, z2: 140 }, { type: 'v', x: -600, z1: 100, z2: 260 }, { type: 'v', x: -600, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -860, x2: -700 }, { type: 'h', z: 480, x1: -980, x2: -820 }, { type: 'h', z: 480, x1: -1100, x2: -940 }, { type: 'v', x: -1080, z1: 340, z2: 500 }, { type: 'h', z: 360, x1: -1220, x2: -1060 }, { type: 'v', x: -1200, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -1340, x2: -1180 }, { type: 'h', z: 480, x1: -1460, x2: -1300 }, { type: 'v', x: -1440, z1: 460, z2: 620 }, { type: 'v', x: -1440, z1: 580, z2: 1720 }, { type: 'h', z: 360, x1: -1720, x2: 280 }, { type: 'v', x: -720, z1: -640, z2: 1360 }, { type: 'h', z: 120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -880, z2: 1120 }, { type: 'h', z: 480, x1: -1840, x2: 160 }, { type: 'v', x: -840, z1: -520, z2: 1480 }, { type: 'h', z: 120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -880, z2: 1120 }, { type: 'h', z: 120, x1: -1600, x2: 400 }, { type: 'v', x: -600, z1: -880, z2: 1120 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -240, z: 0 }, { x: -240, z: 120 }, { x: -360, z: 120 }, { x: -480, z: 120 }, { x: -480, z: 0 }, { x: -600, z: 0 }, { x: -600, z: 120 }, { x: -600, z: 240 }, { x: -600, z: 360 }, { x: -720, z: 360 }, { x: -720, z: 480 }, { x: -840, z: 480 }, { x: -960, z: 480 }, { x: -1080, z: 480 }, { x: -1080, z: 360 }, { x: -1200, z: 360 }, { x: -1200, z: 480 }, { x: -1320, z: 480 }, { x: -1440, z: 480 }, { x: -1440, z: 600 }, { x: -1440, z: 720 }], ints: [[-600, 240], [-600, 0], [-1440, 600], [-240, 120], [-240, -120], [-480, 120], [-480, 0], [0, 0], [-1200, 480], [-1080, 360], [-1080, 480], [-1440, 720], [-840, 480], [-1200, 360], [-1320, 480], [-360, 120], [-720, 480], [-120, 0], [-120, -120], [-240, 0], [-720, 360], [-600, 120], [-1440, 480], [-600, 360], [-960, 480]], bldg: [{ x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -262, z1: -120, z2: 0, s: 0.9 }, { x: -218, z1: -120, z2: 0, s: 0.9 }, { x: -262, z1: 0, z2: 120, s: 0.9 }, { x: -218, z1: 0, z2: 120, s: 0.9 }, { x: -502, z1: 0, z2: 120, s: 0.9 }, { x: -458, z1: 0, z2: 120, s: 0.9 }, { x: -622, z1: 0, z2: 120, s: 0.9 }, { x: -578, z1: 0, z2: 120, s: 0.9 }, { x: -622, z1: 120, z2: 240, s: 0.9 }, { x: -578, z1: 120, z2: 240, s: 0.9 }, { x: -622, z1: 240, z2: 360, s: 0.9 }, { x: -578, z1: 240, z2: 360, s: 0.9 }, { x: -742, z1: 360, z2: 480, s: 0.9 }, { x: -698, z1: 360, z2: 480, s: 0.9 }, { x: -1102, z1: 360, z2: 480, s: 0.9 }, { x: -1058, z1: 360, z2: 480, s: 0.9 }, { x: -1222, z1: 360, z2: 480, s: 0.9 }, { x: -1178, z1: 360, z2: 480, s: 0.9 }, { x: -1462, z1: 480, z2: 600, s: 0.9 }, { x: -1418, z1: 480, z2: 600, s: 0.9 }, { x: -1462, z1: 600, z2: 720, s: 0.9 }, { x: -1418, z1: 600, z2: 720, s: 0.9 }], timeLimit: 720, hasGarage: true, assets: ['suburban', 'industrial'] },
          3: { name: 'Bandra Backroads', sky: 0xa8c4d8, fog: 500, ground: 0x3a5a2e, amb: 0.75, veh: 'twowheeler', npcTypes: ['car', 'auto', 'bike', 'cycle', 'auto', 'car', 'taxi', 'bike', 'auto', 'car', 'bike', 'car', 'auto', 'cycle', 'car', 'bike', 'auto', 'car'], roads: [{ type: 'v', x: 0, z1: -140, z2: 1000 }, { type: 'h', z: -120, x1: -20, x2: 140 }, { type: 'v', x: 120, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -20, x2: 140 }, { type: 'h', z: -240, x1: -140, x2: 20 }, { type: 'h', z: -240, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -620, z2: -460 }, { type: 'v', x: -240, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: -380, x2: -220 }, { type: 'h', z: -720, x1: -500, x2: -340 }, { type: 'h', z: -720, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: -980, z2: -820 }, { type: 'v', x: -480, z1: -1100, z2: -940 }, { type: 'h', z: -1080, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: -1220, z2: -1060 }, { type: 'h', z: -1200, x1: -380, x2: -220 }, { type: 'v', x: -240, z1: -1220, z2: -1060 }, { type: 'h', z: -1080, x1: -260, x2: -100 }, { type: 'h', z: -1080, x1: -140, x2: 20 }, { type: 'h', z: -1080, x1: -20, x2: 140 }, { type: 'h', z: -1080, x1: 100, x2: 260 }, { type: 'h', z: -1080, x1: 220, x2: 1360 }, { type: 'h', z: -1080, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -2080, z2: -80 }, { type: 'h', z: -240, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -1240, z2: 760 }, { type: 'h', z: -1080, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -2080, z2: -80 }, { type: 'h', z: -360, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -1360, z2: 640 }, { type: 'h', z: -120, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1120, z2: 880 }], route: [{ x: 0, z: 0 }, { x: 0, z: -120 }, { x: 120, z: -120 }, { x: 120, z: -240 }, { x: 0, z: -240 }, { x: -120, z: -240 }, { x: -240, z: -240 }, { x: -240, z: -360 }, { x: -120, z: -360 }, { x: -120, z: -480 }, { x: -240, z: -480 }, { x: -240, z: -600 }, { x: -240, z: -720 }, { x: -360, z: -720 }, { x: -480, z: -720 }, { x: -600, z: -720 }, { x: -600, z: -840 }, { x: -480, z: -840 }, { x: -480, z: -960 }, { x: -480, z: -1080 }, { x: -360, z: -1080 }, { x: -360, z: -1200 }, { x: -240, z: -1200 }, { x: -240, z: -1080 }, { x: -120, z: -1080 }, { x: 0, z: -1080 }, { x: 120, z: -1080 }, { x: 240, z: -1080 }, { x: 360, z: -1080 }], ints: [[-240, -240], [-360, -720], [-120, -360], [-480, -960], [0, 0], [-120, -480], [-600, -720], [-240, -480], [120, -240], [120, -1080], [-480, -720], [0, -240], [-480, -1080], [-600, -840], [-240, -1080], [-120, -1080], [240, -1080], [-360, -1080], [-240, -720], [360, -1080], [-360, -1200], [0, -1080], [-240, -1200], [0, -120], [120, -120], [-480, -840], [-240, -360], [-240, -600], [-120, -240]], bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: 98, z1: -240, z2: -120, s: 0.9 }, { x: 142, z1: -240, z2: -120, s: 0.9 }, { x: -262, z1: -360, z2: -240, s: 0.9 }, { x: -218, z1: -360, z2: -240, s: 0.9 }, { x: -142, z1: -480, z2: -360, s: 0.9 }, { x: -98, z1: -480, z2: -360, s: 0.9 }, { x: -262, z1: -600, z2: -480, s: 0.9 }, { x: -218, z1: -600, z2: -480, s: 0.9 }, { x: -262, z1: -720, z2: -600, s: 0.9 }, { x: -218, z1: -720, z2: -600, s: 0.9 }, { x: -622, z1: -840, z2: -720, s: 0.9 }, { x: -578, z1: -840, z2: -720, s: 0.9 }, { x: -502, z1: -960, z2: -840, s: 0.9 }, { x: -458, z1: -960, z2: -840, s: 0.9 }, { x: -502, z1: -1080, z2: -960, s: 0.9 }, { x: -458, z1: -1080, z2: -960, s: 0.9 }, { x: -382, z1: -1200, z2: -1080, s: 0.9 }, { x: -338, z1: -1200, z2: -1080, s: 0.9 }, { x: -262, z1: -1200, z2: -1080, s: 0.9 }, { x: -218, z1: -1200, z2: -1080, s: 0.9 }], timeLimit: 830, hasGarage: true, assets: ['suburban', 'industrial'] },
          4: { name: 'Juhu Boulevard', sky: 0x6fb8e0, fog: 650, ground: 0x2e6b3a, amb: 0.9, veh: 'car', npcTypes: ['car', 'car', 'auto', 'bike', 'car', 'bus', 'taxi', 'car', 'auto', 'bike', 'car', 'car', 'bus', 'auto', 'car', 'bike', 'car', 'auto', 'car', 'taxi'], hasBeach: true, roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -380, x2: -220 }, { type: 'h', z: -120, x1: -500, x2: -340 }, { type: 'h', z: -120, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -620, x2: -460 }, { type: 'h', z: -360, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: -380, z2: -220 }, { type: 'h', z: -240, x1: -860, x2: -700 }, { type: 'v', x: -840, z1: -380, z2: -220 }, { type: 'v', x: -840, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -980, x2: -820 }, { type: 'v', x: -960, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: -1100, x2: -940 }, { type: 'v', x: -1080, z1: -500, z2: -340 }, { type: 'v', x: -1080, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -1220, x2: -1060 }, { type: 'v', x: -1200, z1: -620, z2: -460 }, { type: 'v', x: -1200, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: -1340, x2: -1180 }, { type: 'h', z: -360, x1: -1460, x2: -1300 }, { type: 'v', x: -1440, z1: -500, z2: -340 }, { type: 'v', x: -1440, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -1460, x2: -1300 }, { type: 'v', x: -1320, z1: -620, z2: 520 }, { type: 'h', z: -360, x1: -1960, x2: 40 }, { type: 'v', x: -960, z1: -1360, z2: 640 }, { type: 'h', z: -360, x1: -1960, x2: 40 }, { type: 'v', x: -960, z1: -1360, z2: 640 }, { type: 'h', z: -360, x1: -1840, x2: 160 }, { type: 'v', x: -840, z1: -1360, z2: 640 }, { type: 'h', z: -120, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1120, z2: 880 }, { type: 'h', z: -120, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -1120, z2: 880 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -360, z: -120 }, { x: -480, z: -120 }, { x: -600, z: -120 }, { x: -600, z: -240 }, { x: -480, z: -240 }, { x: -480, z: -360 }, { x: -600, z: -360 }, { x: -720, z: -360 }, { x: -720, z: -240 }, { x: -840, z: -240 }, { x: -840, z: -360 }, { x: -840, z: -480 }, { x: -960, z: -480 }, { x: -960, z: -360 }, { x: -1080, z: -360 }, { x: -1080, z: -480 }, { x: -1080, z: -600 }, { x: -1200, z: -600 }, { x: -1200, z: -480 }, { x: -1200, z: -360 }, { x: -1320, z: -360 }, { x: -1440, z: -360 }, { x: -1440, z: -480 }, { x: -1440, z: -600 }, { x: -1320, z: -600 }, { x: -1320, z: -480 }], ints: [[-840, -240], [-1440, -360], [-480, -360], [-960, -360], [-1440, -600], [-1320, -600], [-960, -480], [-240, -120], [-1080, -600], [0, 0], [-1440, -480], [-1200, -480], [-1200, -360], [-720, -360], [-1080, -480], [-600, -360], [-600, -120], [-1320, -360], [-360, -120], [-120, 0], [-840, -360], [-1320, -480], [-1200, -600], [-120, -120], [-480, -240], [-480, -120], [-1080, -360], [-720, -240], [-840, -480], [-600, -240]], bldg: [{ x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -622, z1: -240, z2: -120, s: 0.9 }, { x: -578, z1: -240, z2: -120, s: 0.9 }, { x: -502, z1: -360, z2: -240, s: 0.9 }, { x: -458, z1: -360, z2: -240, s: 0.9 }, { x: -742, z1: -360, z2: -240, s: 0.9 }, { x: -698, z1: -360, z2: -240, s: 0.9 }, { x: -862, z1: -360, z2: -240, s: 0.9 }, { x: -818, z1: -360, z2: -240, s: 0.9 }, { x: -862, z1: -480, z2: -360, s: 0.9 }, { x: -818, z1: -480, z2: -360, s: 0.9 }, { x: -982, z1: -480, z2: -360, s: 0.9 }, { x: -938, z1: -480, z2: -360, s: 0.9 }, { x: -1102, z1: -480, z2: -360, s: 0.9 }, { x: -1058, z1: -480, z2: -360, s: 0.9 }, { x: -1102, z1: -600, z2: -480, s: 0.9 }, { x: -1058, z1: -600, z2: -480, s: 0.9 }, { x: -1222, z1: -600, z2: -480, s: 0.9 }, { x: -1178, z1: -600, z2: -480, s: 0.9 }, { x: -1222, z1: -480, z2: -360, s: 0.9 }, { x: -1178, z1: -480, z2: -360, s: 0.9 }, { x: -1462, z1: -480, z2: -360, s: 0.9 }, { x: -1418, z1: -480, z2: -360, s: 0.9 }, { x: -1462, z1: -600, z2: -480, s: 0.9 }, { x: -1418, z1: -600, z2: -480, s: 0.9 }, { x: -1342, z1: -600, z2: -480, s: 0.9 }, { x: -1298, z1: -600, z2: -480, s: 0.9 }], timeLimit: 940, hasGarage: true, assets: ['suburban', 'industrial'] },
          5: { name: 'Parel School Zone', sky: 0x95c0d4, fog: 500, ground: 0x447a3e, amb: 0.8, veh: 'bus', npcTypes: ['car', 'auto', 'cycle', 'bike', 'auto', 'car', 'taxi', 'car', 'auto', 'bike', 'car', 'cycle', 'auto', 'car', 'bus', 'car', 'auto', 'car'], hasSchool: true, speedLimit: 30, isSilenceZone: true, roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: -260, z2: -100 }, { type: 'v', x: -360, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -500, x2: -340 }, { type: 'h', z: -360, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -500, z2: -340 }, { type: 'v', x: -600, z1: -620, z2: -460 }, { type: 'v', x: -600, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: -620, x2: -460 }, { type: 'h', z: -720, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: -860, z2: -700 }, { type: 'v', x: -360, z1: -980, z2: -820 }, { type: 'v', x: -360, z1: -1100, z2: -940 }, { type: 'h', z: -1080, x1: -380, x2: -220 }, { type: 'h', z: -1080, x1: -260, x2: -100 }, { type: 'h', z: -1080, x1: -140, x2: 20 }, { type: 'h', z: -1080, x1: -20, x2: 140 }, { type: 'h', z: -1080, x1: 100, x2: 260 }, { type: 'h', z: -1080, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -1100, z2: -940 }, { type: 'v', x: 360, z1: -980, z2: -820 }, { type: 'v', x: 360, z1: -860, z2: -700 }, { type: 'v', x: 360, z1: -740, z2: -580 }, { type: 'h', z: -600, x1: 340, x2: 500 }, { type: 'h', z: -600, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: -620, z2: -460 }, { type: 'h', z: -480, x1: 460, x2: 620 }, { type: 'v', x: 480, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: 340, x2: 500 }, { type: 'v', x: 360, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: 220, x2: 380 }, { type: 'v', x: 240, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -880, x2: 260 }, { type: 'h', z: -360, x1: -1600, x2: 400 }, { type: 'v', x: -600, z1: -1360, z2: 640 }, { type: 'h', z: -360, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -1360, z2: 640 }, { type: 'h', z: -1080, x1: -640, x2: 1360 }, { type: 'v', x: 360, z1: -2080, z2: -80 }, { type: 'h', z: -120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -1120, z2: 880 }, { type: 'h', z: -360, x1: -1480, x2: 520 }, { type: 'v', x: -480, z1: -1360, z2: 640 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -360, z: -120 }, { x: -360, z: -240 }, { x: -360, z: -360 }, { x: -480, z: -360 }, { x: -600, z: -360 }, { x: -600, z: -480 }, { x: -600, z: -600 }, { x: -600, z: -720 }, { x: -480, z: -720 }, { x: -360, z: -720 }, { x: -360, z: -840 }, { x: -360, z: -960 }, { x: -360, z: -1080 }, { x: -240, z: -1080 }, { x: -120, z: -1080 }, { x: 0, z: -1080 }, { x: 120, z: -1080 }, { x: 240, z: -1080 }, { x: 360, z: -1080 }, { x: 360, z: -960 }, { x: 360, z: -840 }, { x: 360, z: -720 }, { x: 360, z: -600 }, { x: 480, z: -600 }, { x: 600, z: -600 }, { x: 600, z: -480 }, { x: 480, z: -480 }, { x: 480, z: -360 }, { x: 360, z: -360 }, { x: 360, z: -480 }, { x: 240, z: -480 }, { x: 240, z: -600 }, { x: 120, z: -600 }], ints: [[360, -360], [600, -600], [-360, -840], [-480, -360], [-600, -600], [480, -600], [240, -480], [-360, -720], [120, -600], [-240, -120], [0, 0], [-600, -720], [-360, -240], [120, -1080], [-240, -1080], [-480, -720], [360, -840], [480, -480], [-120, -1080], [360, -480], [-600, -360], [240, -1080], [-360, -1080], [-360, -360], [360, -1080], [360, -720], [-360, -120], [-120, 0], [-360, -960], [600, -480], [480, -360], [0, -1080], [360, -600], [-120, -120], [240, -600], [360, -960], [-600, -480]], bldg: [{ x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -382, z1: -240, z2: -120, s: 0.9 }, { x: -338, z1: -240, z2: -120, s: 0.9 }, { x: -382, z1: -360, z2: -240, s: 0.9 }, { x: -338, z1: -360, z2: -240, s: 0.9 }, { x: -622, z1: -480, z2: -360, s: 0.9 }, { x: -578, z1: -480, z2: -360, s: 0.9 }, { x: -622, z1: -600, z2: -480, s: 0.9 }, { x: -578, z1: -600, z2: -480, s: 0.9 }, { x: -622, z1: -720, z2: -600, s: 0.9 }, { x: -578, z1: -720, z2: -600, s: 0.9 }, { x: -382, z1: -840, z2: -720, s: 0.9 }, { x: -338, z1: -840, z2: -720, s: 0.9 }, { x: -382, z1: -960, z2: -840, s: 0.9 }, { x: -338, z1: -960, z2: -840, s: 0.9 }, { x: -382, z1: -1080, z2: -960, s: 0.9 }, { x: -338, z1: -1080, z2: -960, s: 0.9 }, { x: 338, z1: -1080, z2: -960, s: 0.9 }, { x: 382, z1: -1080, z2: -960, s: 0.9 }, { x: 338, z1: -960, z2: -840, s: 0.9 }, { x: 382, z1: -960, z2: -840, s: 0.9 }, { x: 338, z1: -840, z2: -720, s: 0.9 }, { x: 382, z1: -840, z2: -720, s: 0.9 }, { x: 338, z1: -720, z2: -600, s: 0.9 }, { x: 382, z1: -720, z2: -600, s: 0.9 }, { x: 578, z1: -600, z2: -480, s: 0.9 }, { x: 622, z1: -600, z2: -480, s: 0.9 }, { x: 458, z1: -480, z2: -360, s: 0.9 }, { x: 502, z1: -480, z2: -360, s: 0.9 }, { x: 338, z1: -480, z2: -360, s: 0.9 }, { x: 382, z1: -480, z2: -360, s: 0.9 }, { x: 218, z1: -600, z2: -480, s: 0.9 }, { x: 262, z1: -600, z2: -480, s: 0.9 }], timeLimit: 1050, hasGarage: true, assets: ['suburban', 'industrial'] },
          6: { name: 'Matunga Rail Corridor', sky: 0x7fafc4, fog: 600, ground: 0x3a6130, amb: 0.7, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'car', 'auto', 'taxi', 'car', 'auto', 'bike', 'car', 'truck', 'auto', 'car', 'car', 'bike', 'car', 'auto'], hasRailway: true, railZ: [0], hasMetro: true, hasMountain: true, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'v', x: 120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: 100, x2: 260 }, { type: 'h', z: -120, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: 340, x2: 500 }, { type: 'v', x: 480, z1: -260, z2: -100 }, { type: 'v', x: 480, z1: -140, z2: 20 }, { type: 'v', x: 480, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: -20, z2: 140 }, { type: 'v', x: 720, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: 700, x2: 860 }, { type: 'h', z: 240, x1: 820, x2: 980 }, { type: 'h', z: 240, x1: 940, x2: 1100 }, { type: 'v', x: 1080, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: 940, x2: 1100 }, { type: 'v', x: 960, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: 940, x2: 1100 }, { type: 'h', z: 480, x1: 1060, x2: 1220 }, { type: 'v', x: 1200, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 1060, x2: 1220 }, { type: 'v', x: 1080, z1: 580, z2: 740 }, { type: 'v', x: 1080, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: 940, x2: 1100 }, { type: 'v', x: 960, z1: 700, z2: 860 }, { type: 'h', z: 720, x1: 820, x2: 980 }, { type: 'v', x: 840, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: 820, x2: 1960 }, { type: 'h', z: 0, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -1000, z2: 1000 }, { type: 'h', z: 120, x1: -400, x2: 1600 }, { type: 'v', x: 600, z1: -880, z2: 1120 }, { type: 'h', z: 120, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -880, z2: 1120 }, { type: 'h', z: 720, x1: -160, x2: 1840 }, { type: 'v', x: 840, z1: -280, z2: 1720 }, { type: 'h', z: 720, x1: 80, x2: 2080 }, { type: 'v', x: 1080, z1: -280, z2: 1720 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 120, z: -120 }, { x: 240, z: -120 }, { x: 360, z: -120 }, { x: 360, z: -240 }, { x: 480, z: -240 }, { x: 480, z: -120 }, { x: 480, z: 0 }, { x: 480, z: 120 }, { x: 600, z: 120 }, { x: 600, z: 0 }, { x: 720, z: 0 }, { x: 720, z: 120 }, { x: 720, z: 240 }, { x: 840, z: 240 }, { x: 960, z: 240 }, { x: 1080, z: 240 }, { x: 1080, z: 360 }, { x: 960, z: 360 }, { x: 960, z: 480 }, { x: 1080, z: 480 }, { x: 1200, z: 480 }, { x: 1200, z: 600 }, { x: 1080, z: 600 }, { x: 1080, z: 720 }, { x: 1080, z: 840 }, { x: 960, z: 840 }, { x: 960, z: 720 }, { x: 840, z: 720 }, { x: 840, z: 600 }, { x: 960, z: 600 }], ints: [[600, 0], [360, -120], [480, -120], [720, 120], [960, 720], [960, 480], [480, 120], [0, 0], [480, -240], [720, 0], [840, 720], [960, 840], [240, -120], [360, -240], [960, 360], [1080, 840], [120, 0], [840, 600], [600, 120], [1080, 720], [1080, 360], [1200, 480], [960, 240], [1080, 480], [120, -120], [1080, 240], [1080, 600], [480, 0], [720, 240], [960, 600], [1200, 600], [840, 240]], bldg: [{ x: 98, z1: -120, z2: 0, s: 0.9 }, { x: 142, z1: -120, z2: 0, s: 0.9 }, { x: 338, z1: -240, z2: -120, s: 0.9 }, { x: 382, z1: -240, z2: -120, s: 0.9 }, { x: 458, z1: -240, z2: -120, s: 0.9 }, { x: 502, z1: -240, z2: -120, s: 0.9 }, { x: 458, z1: -120, z2: 0, s: 0.9 }, { x: 502, z1: -120, z2: 0, s: 0.9 }, { x: 458, z1: 0, z2: 120, s: 0.9 }, { x: 502, z1: 0, z2: 120, s: 0.9 }, { x: 578, z1: 0, z2: 120, s: 0.9 }, { x: 622, z1: 0, z2: 120, s: 0.9 }, { x: 698, z1: 0, z2: 120, s: 0.9 }, { x: 742, z1: 0, z2: 120, s: 0.9 }, { x: 698, z1: 120, z2: 240, s: 0.9 }, { x: 742, z1: 120, z2: 240, s: 0.9 }, { x: 1058, z1: 240, z2: 360, s: 0.9 }, { x: 1102, z1: 240, z2: 360, s: 0.9 }, { x: 938, z1: 360, z2: 480, s: 0.9 }, { x: 982, z1: 360, z2: 480, s: 0.9 }, { x: 1178, z1: 480, z2: 600, s: 0.9 }, { x: 1222, z1: 480, z2: 600, s: 0.9 }, { x: 1058, z1: 600, z2: 720, s: 0.9 }, { x: 1102, z1: 600, z2: 720, s: 0.9 }, { x: 1058, z1: 720, z2: 840, s: 0.9 }, { x: 1102, z1: 720, z2: 840, s: 0.9 }, { x: 938, z1: 720, z2: 840, s: 0.9 }, { x: 982, z1: 720, z2: 840, s: 0.9 }, { x: 818, z1: 600, z2: 720, s: 0.9 }, { x: 862, z1: 600, z2: 720, s: 0.9 }], timeLimit: 1160, hasGarage: true, assets: ['suburban', 'industrial', 'trains'] },
          7: { name: 'Marine Drive', sky: 0x4a90d9, fog: 700, ground: 0x1a6b5a, amb: 0.9, veh: 'car', npcTypes: ['car', 'car', 'auto', 'bike', 'car', 'bus', 'taxi', 'car', 'auto', 'car', 'bike', 'car', 'car', 'bus', 'auto', 'taxi', 'car', 'bike', 'car', 'auto'], hasOcean: true, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'h', z: 0, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: 340, x2: 500 }, { type: 'h', z: 240, x1: 460, x2: 620 }, { type: 'h', z: 240, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: 100, z2: 260 }, { type: 'v', x: 720, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: 700, x2: 860 }, { type: 'v', x: 840, z1: -20, z2: 140 }, { type: 'v', x: 840, z1: 100, z2: 260 }, { type: 'v', x: 840, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: 700, x2: 860 }, { type: 'h', z: 360, x1: 580, x2: 740 }, { type: 'h', z: 360, x1: 460, x2: 620 }, { type: 'v', x: 480, z1: 340, z2: 500 }, { type: 'v', x: 480, z1: 460, z2: 620 }, { type: 'v', x: 480, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: 340, x2: 500 }, { type: 'v', x: 360, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: 220, x2: 380 }, { type: 'h', z: 600, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 460, z2: 620 }, { type: 'v', x: 120, z1: 340, z2: 500 }, { type: 'v', x: 120, z1: 220, z2: 380 }, { type: 'h', z: 240, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 220, z2: 380 }, { type: 'v', x: 0, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -140, x2: 20 }, { type: 'h', z: 480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: 460, z2: 620 }, { type: 'v', x: -240, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: -500, x2: -340 }, { type: 'h', z: 840, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 820, z2: 980 }, { type: 'v', x: -600, z1: 940, z2: 1100 }, { type: 'h', z: 1080, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: 940, z2: 1100 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 940, z2: 2080 }, { type: 'h', z: 600, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -400, z2: 1600 }, { type: 'h', z: 600, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -400, z2: 1600 }, { type: 'h', z: 480, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -520, z2: 1480 }, { type: 'h', z: 720, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -280, z2: 1720 }, { type: 'h', z: 1080, x1: -1600, x2: 400 }, { type: 'v', x: -600, z1: 80, z2: 2080 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 240, z: 0 }, { x: 240, z: 120 }, { x: 360, z: 120 }, { x: 360, z: 240 }, { x: 480, z: 240 }, { x: 600, z: 240 }, { x: 720, z: 240 }, { x: 720, z: 120 }, { x: 720, z: 0 }, { x: 840, z: 0 }, { x: 840, z: 120 }, { x: 840, z: 240 }, { x: 840, z: 360 }, { x: 720, z: 360 }, { x: 600, z: 360 }, { x: 480, z: 360 }, { x: 480, z: 480 }, { x: 480, z: 600 }, { x: 480, z: 720 }, { x: 360, z: 720 }, { x: 360, z: 600 }, { x: 240, z: 600 }, { x: 120, z: 600 }, { x: 120, z: 480 }, { x: 120, z: 360 }, { x: 120, z: 240 }, { x: 0, z: 240 }, { x: 0, z: 360 }, { x: 0, z: 480 }, { x: -120, z: 480 }, { x: -240, z: 480 }, { x: -240, z: 600 }, { x: -240, z: 720 }, { x: -360, z: 720 }, { x: -360, z: 840 }, { x: -480, z: 840 }, { x: -600, z: 840 }, { x: -600, z: 960 }, { x: -600, z: 1080 }, { x: -480, z: 1080 }, { x: -480, z: 960 }, { x: -360, z: 960 }, { x: -360, z: 1080 }], ints: [[240, 0], [840, 0], [0, 240], [360, 240], [-600, 960], [-240, 480], [720, 120], [120, 360], [360, 120], [-360, 960], [0, 0], [720, 0], [480, 720], [840, 360], [840, 120], [120, 240], [480, 240], [-600, 840], [-600, 1080], [360, 600], [-240, 720], [-240, 600], [120, 600], [120, 480], [-480, 1080], [-480, 960], [120, 0], [0, 360], [240, 600], [-360, 720], [600, 360], [480, 360], [360, 720], [480, 600], [600, 240], [-120, 480], [720, 240], [240, 120], [480, 480], [-360, 840], [720, 360], [0, 480], [-360, 1080], [-480, 840], [840, 240]], bldg: [{ x: 218, z1: 0, z2: 120, s: 0.9 }, { x: 262, z1: 0, z2: 120, s: 0.9 }, { x: 338, z1: 120, z2: 240, s: 0.9 }, { x: 382, z1: 120, z2: 240, s: 0.9 }, { x: 698, z1: 120, z2: 240, s: 0.9 }, { x: 742, z1: 120, z2: 240, s: 0.9 }, { x: 698, z1: 0, z2: 120, s: 0.9 }, { x: 742, z1: 0, z2: 120, s: 0.9 }, { x: 818, z1: 0, z2: 120, s: 0.9 }, { x: 862, z1: 0, z2: 120, s: 0.9 }, { x: 818, z1: 120, z2: 240, s: 0.9 }, { x: 862, z1: 120, z2: 240, s: 0.9 }, { x: 818, z1: 240, z2: 360, s: 0.9 }, { x: 862, z1: 240, z2: 360, s: 0.9 }, { x: 458, z1: 360, z2: 480, s: 0.9 }, { x: 502, z1: 360, z2: 480, s: 0.9 }, { x: 458, z1: 480, z2: 600, s: 0.9 }, { x: 502, z1: 480, z2: 600, s: 0.9 }, { x: 458, z1: 600, z2: 720, s: 0.9 }, { x: 502, z1: 600, z2: 720, s: 0.9 }, { x: 338, z1: 600, z2: 720, s: 0.9 }, { x: 382, z1: 600, z2: 720, s: 0.9 }, { x: 98, z1: 480, z2: 600, s: 0.9 }, { x: 142, z1: 480, z2: 600, s: 0.9 }, { x: 98, z1: 360, z2: 480, s: 0.9 }, { x: 142, z1: 360, z2: 480, s: 0.9 }, { x: 98, z1: 240, z2: 360, s: 0.9 }, { x: 142, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 240, z2: 360, s: 0.9 }, { x: 22, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 360, z2: 480, s: 0.9 }, { x: 22, z1: 360, z2: 480, s: 0.9 }, { x: -262, z1: 480, z2: 600, s: 0.9 }, { x: -218, z1: 480, z2: 600, s: 0.9 }, { x: -262, z1: 600, z2: 720, s: 0.9 }, { x: -218, z1: 600, z2: 720, s: 0.9 }, { x: -382, z1: 720, z2: 840, s: 0.9 }, { x: -338, z1: 720, z2: 840, s: 0.9 }, { x: -622, z1: 840, z2: 960, s: 0.9 }, { x: -578, z1: 840, z2: 960, s: 0.9 }, { x: -622, z1: 960, z2: 1080, s: 0.9 }, { x: -578, z1: 960, z2: 1080, s: 0.9 }, { x: -502, z1: 960, z2: 1080, s: 0.9 }, { x: -458, z1: 960, z2: 1080, s: 0.9 }, { x: -382, z1: 960, z2: 1080, s: 0.9 }, { x: -338, z1: 960, z2: 1080, s: 0.9 }], timeLimit: 1270, hasGarage: true, assets: ['suburban', 'industrial'] },
          8: { name: 'Byculla', sky: 0x7a9eb5, fog: 550, ground: 0x345a2a, amb: 0.7, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'auto', 'car', 'truck', 'car', 'taxi', 'auto', 'bike', 'car', 'car', 'bus', 'auto', 'car', 'car', 'bike', 'auto', 'car', 'taxi', 'car', 'car', 'auto'], hasEmergency: true, roads: [{ type: 'v', x: 0, z1: -1000, z2: 140 }, { type: 'h', z: 120, x1: -140, x2: 20 }, { type: 'h', z: 120, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: -140, z2: 20 }, { type: 'h', z: 0, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: -380, x2: -220 }, { type: 'v', x: -240, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -260, x2: -100 }, { type: 'h', z: 360, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -20, x2: 140 }, { type: 'v', x: 120, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 580, z2: 740 }, { type: 'v', x: 240, z1: 700, z2: 860 }, { type: 'v', x: 240, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 820, z2: 980 }, { type: 'h', z: 840, x1: -20, x2: 140 }, { type: 'h', z: 840, x1: -140, x2: 20 }, { type: 'h', z: 840, x1: -260, x2: -100 }, { type: 'h', z: 840, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'h', z: 960, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 820, z2: 980 }, { type: 'h', z: 840, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: 700, z2: 860 }, { type: 'v', x: -480, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: -620, x2: -460 }, { type: 'h', z: 480, x1: -500, x2: -340 }, { type: 'h', z: 480, x1: -380, x2: -220 }, { type: 'h', z: 480, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: -20, x2: 1120 }, { type: 'h', z: 120, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -880, z2: 1120 }, { type: 'h', z: 720, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -280, z2: 1720 }, { type: 'h', z: 840, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -160, z2: 1840 }, { type: 'h', z: 960, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -40, z2: 1960 }, { type: 'h', z: 600, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -400, z2: 1600 }], route: [{ x: 0, z: 0 }, { x: 0, z: 120 }, { x: -120, z: 120 }, { x: -240, z: 120 }, { x: -240, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -360, z: -120 }, { x: -360, z: 0 }, { x: -480, z: 0 }, { x: -480, z: 120 }, { x: -360, z: 120 }, { x: -360, z: 240 }, { x: -240, z: 240 }, { x: -240, z: 360 }, { x: -120, z: 360 }, { x: 0, z: 360 }, { x: 0, z: 480 }, { x: 120, z: 480 }, { x: 120, z: 600 }, { x: 240, z: 600 }, { x: 240, z: 720 }, { x: 240, z: 840 }, { x: 240, z: 960 }, { x: 120, z: 960 }, { x: 120, z: 840 }, { x: 0, z: 840 }, { x: -120, z: 840 }, { x: -240, z: 840 }, { x: -360, z: 840 }, { x: -360, z: 960 }, { x: -480, z: 960 }, { x: -600, z: 960 }, { x: -600, z: 840 }, { x: -480, z: 840 }, { x: -480, z: 720 }, { x: -480, z: 600 }, { x: -600, z: 600 }, { x: -600, z: 480 }, { x: -480, z: 480 }, { x: -360, z: 480 }, { x: -240, z: 480 }, { x: -120, z: 480 }, { x: -120, z: 600 }, { x: 0, z: 600 }, { x: 0, z: 720 }, { x: 120, z: 720 }], ints: [[-120, 360], [-360, 240], [240, 960], [120, 960], [-360, 0], [-600, 960], [-240, 120], [-600, 600], [-240, 480], [-480, 720], [0, 120], [-240, -120], [-480, 120], [-480, 0], [0, 0], [120, 840], [-360, 960], [-480, 480], [-480, 600], [0, 840], [-600, 840], [-360, 480], [-240, 840], [240, 720], [-360, 120], [-240, 360], [0, 600], [120, 600], [120, 480], [-240, 240], [-480, 960], [-360, -120], [-120, 0], [-120, 120], [0, 360], [-120, 600], [-120, -120], [240, 600], [-240, 0], [240, 840], [-120, 840], [0, 720], [-120, 480], [-600, 480], [-360, 840], [0, 480], [120, 720], [-480, 840]], bldg: [{ x: -22, z1: 0, z2: 120, s: 0.9 }, { x: 22, z1: 0, z2: 120, s: 0.9 }, { x: -262, z1: 0, z2: 120, s: 0.9 }, { x: -218, z1: 0, z2: 120, s: 0.9 }, { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -382, z1: -120, z2: 0, s: 0.9 }, { x: -338, z1: -120, z2: 0, s: 0.9 }, { x: -502, z1: 0, z2: 120, s: 0.9 }, { x: -458, z1: 0, z2: 120, s: 0.9 }, { x: -382, z1: 120, z2: 240, s: 0.9 }, { x: -338, z1: 120, z2: 240, s: 0.9 }, { x: -262, z1: 240, z2: 360, s: 0.9 }, { x: -218, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 360, z2: 480, s: 0.9 }, { x: 22, z1: 360, z2: 480, s: 0.9 }, { x: 98, z1: 480, z2: 600, s: 0.9 }, { x: 142, z1: 480, z2: 600, s: 0.9 }, { x: 218, z1: 600, z2: 720, s: 0.9 }, { x: 262, z1: 600, z2: 720, s: 0.9 }, { x: 218, z1: 720, z2: 840, s: 0.9 }, { x: 262, z1: 720, z2: 840, s: 0.9 }, { x: 218, z1: 840, z2: 960, s: 0.9 }, { x: 262, z1: 840, z2: 960, s: 0.9 }, { x: 98, z1: 840, z2: 960, s: 0.9 }, { x: 142, z1: 840, z2: 960, s: 0.9 }, { x: -382, z1: 840, z2: 960, s: 0.9 }, { x: -338, z1: 840, z2: 960, s: 0.9 }, { x: -622, z1: 840, z2: 960, s: 0.9 }, { x: -578, z1: 840, z2: 960, s: 0.9 }, { x: -502, z1: 720, z2: 840, s: 0.9 }, { x: -458, z1: 720, z2: 840, s: 0.9 }, { x: -502, z1: 600, z2: 720, s: 0.9 }, { x: -458, z1: 600, z2: 720, s: 0.9 }, { x: -622, z1: 480, z2: 600, s: 0.9 }, { x: -578, z1: 480, z2: 600, s: 0.9 }, { x: -142, z1: 480, z2: 600, s: 0.9 }, { x: -98, z1: 480, z2: 600, s: 0.9 }, { x: -22, z1: 600, z2: 720, s: 0.9 }, { x: 22, z1: 600, z2: 720, s: 0.9 }], timeLimit: 1380, hasGarage: true, assets: ['suburban', 'industrial', 'emergency'] },
          9: { name: 'Hindmata', sky: 0x152234, fog: 450, ground: 0x1a291d, amb: 0.4, veh: 'car', npcTypes: ['car', 'auto', 'bike', 'car', 'auto', 'taxi', 'car', 'auto', 'bike', 'car', 'auto', 'car', 'bus', 'auto', 'car', 'bike'], hasRain: true, hasPuddles: true, roads: [{ type: 'v', x: 0, z1: -1000, z2: 140 }, { type: 'v', x: 0, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: -20, x2: 140 }, { type: 'h', z: 240, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 220, z2: 380 }, { type: 'v', x: 240, z1: 340, z2: 500 }, { type: 'v', x: 240, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: 340, x2: 500 }, { type: 'v', x: 480, z1: 460, z2: 620 }, { type: 'v', x: 480, z1: 580, z2: 740 }, { type: 'v', x: 480, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: 340, x2: 500 }, { type: 'v', x: 360, z1: 700, z2: 860 }, { type: 'h', z: 720, x1: 220, x2: 380 }, { type: 'v', x: 240, z1: 700, z2: 860 }, { type: 'v', x: 240, z1: 820, z2: 980 }, { type: 'v', x: 240, z1: 940, z2: 1100 }, { type: 'v', x: 240, z1: 1060, z2: 1220 }, { type: 'h', z: 1200, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: 1180, z2: 1340 }, { type: 'v', x: 360, z1: 1300, z2: 1460 }, { type: 'h', z: 1440, x1: 340, x2: 500 }, { type: 'h', z: 1440, x1: 460, x2: 620 }, { type: 'h', z: 1440, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: 580, x2: 740 }, { type: 'h', z: 1560, x1: 460, x2: 620 }, { type: 'h', z: 1560, x1: 340, x2: 500 }, { type: 'h', z: 1560, x1: 220, x2: 380 }, { type: 'h', z: 1560, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 1420, z2: 1580 }, { type: 'v', x: 120, z1: 1300, z2: 1460 }, { type: 'v', x: 120, z1: 1180, z2: 1340 }, { type: 'v', x: 120, z1: 1060, z2: 1220 }, { type: 'h', z: 1080, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 1060, z2: 1220 }, { type: 'v', x: 0, z1: 1180, z2: 1340 }, { type: 'v', x: 0, z1: 1300, z2: 1460 }, { type: 'v', x: 0, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: -140, x2: 20 }, { type: 'h', z: 1560, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: 1540, z2: 1700 }, { type: 'h', z: 1680, x1: -380, x2: -220 }, { type: 'h', z: 1680, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 1540, z2: 1700 }, { type: 'h', z: 1560, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 1420, z2: 1580 }, { type: 'v', x: -600, z1: 1300, z2: 1460 }, { type: 'h', z: 1320, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: 200, z2: 1340 }, { type: 'h', z: 840, x1: -640, x2: 1360 }, { type: 'v', x: 360, z1: -160, z2: 1840 }, { type: 'h', z: 600, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -400, z2: 1600 }, { type: 'h', z: 600, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -400, z2: 1600 }, { type: 'h', z: 840, x1: -640, x2: 1360 }, { type: 'v', x: 360, z1: -160, z2: 1840 }, { type: 'h', z: 1440, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: 440, z2: 2440 }], route: [{ x: 0, z: 0 }, { x: 0, z: 120 }, { x: 0, z: 240 }, { x: 120, z: 240 }, { x: 240, z: 240 }, { x: 240, z: 360 }, { x: 240, z: 480 }, { x: 240, z: 600 }, { x: 360, z: 600 }, { x: 360, z: 480 }, { x: 480, z: 480 }, { x: 480, z: 600 }, { x: 480, z: 720 }, { x: 480, z: 840 }, { x: 360, z: 840 }, { x: 360, z: 720 }, { x: 240, z: 720 }, { x: 240, z: 840 }, { x: 240, z: 960 }, { x: 240, z: 1080 }, { x: 240, z: 1200 }, { x: 360, z: 1200 }, { x: 360, z: 1320 }, { x: 360, z: 1440 }, { x: 480, z: 1440 }, { x: 600, z: 1440 }, { x: 720, z: 1440 }, { x: 720, z: 1560 }, { x: 600, z: 1560 }, { x: 480, z: 1560 }, { x: 360, z: 1560 }, { x: 240, z: 1560 }, { x: 120, z: 1560 }, { x: 120, z: 1440 }, { x: 120, z: 1320 }, { x: 120, z: 1200 }, { x: 120, z: 1080 }, { x: 0, z: 1080 }, { x: 0, z: 1200 }, { x: 0, z: 1320 }, { x: 0, z: 1440 }, { x: 0, z: 1560 }, { x: -120, z: 1560 }, { x: -240, z: 1560 }, { x: -240, z: 1680 }, { x: -360, z: 1680 }, { x: -480, z: 1680 }, { x: -480, z: 1560 }, { x: -600, z: 1560 }, { x: -600, z: 1440 }, { x: -600, z: 1320 }, { x: -480, z: 1320 }, { x: -480, z: 1200 }], ints: [[0, 240], [240, 1200], [720, 1560], [480, 1560], [-480, 1320], [240, 960], [-480, 1680], [240, 1080], [480, 840], [360, 1320], [0, 120], [120, 1440], [600, 1560], [0, 0], [360, 1560], [120, 1200], [480, 720], [360, 1440], [-240, 1680], [-120, 1560], [0, 1320], [480, 1440], [360, 480], [120, 240], [120, 1560], [-360, 1680], [-600, 1440], [360, 600], [240, 720], [720, 1440], [240, 1560], [120, 1080], [360, 840], [0, 1080], [-600, 1560], [240, 240], [0, 1440], [-480, 1200], [-600, 1320], [240, 480], [240, 600], [360, 720], [240, 840], [0, 1200], [240, 360], [480, 600], [600, 1440], [120, 1320], [-240, 1560], [480, 480], [0, 1560], [360, 1200], [-480, 1560]], bldg: [{ x: -22, z1: 0, z2: 120, s: 0.9 }, { x: 22, z1: 0, z2: 120, s: 0.9 }, { x: -22, z1: 120, z2: 240, s: 0.9 }, { x: 22, z1: 120, z2: 240, s: 0.9 }, { x: 218, z1: 240, z2: 360, s: 0.9 }, { x: 262, z1: 240, z2: 360, s: 0.9 }, { x: 218, z1: 360, z2: 480, s: 0.9 }, { x: 262, z1: 360, z2: 480, s: 0.9 }, { x: 218, z1: 480, z2: 600, s: 0.9 }, { x: 262, z1: 480, z2: 600, s: 0.9 }, { x: 338, z1: 480, z2: 600, s: 0.9 }, { x: 382, z1: 480, z2: 600, s: 0.9 }, { x: 458, z1: 480, z2: 600, s: 0.9 }, { x: 502, z1: 480, z2: 600, s: 0.9 }, { x: 458, z1: 600, z2: 720, s: 0.9 }, { x: 502, z1: 600, z2: 720, s: 0.9 }, { x: 458, z1: 720, z2: 840, s: 0.9 }, { x: 502, z1: 720, z2: 840, s: 0.9 }, { x: 338, z1: 720, z2: 840, s: 0.9 }, { x: 382, z1: 720, z2: 840, s: 0.9 }, { x: 218, z1: 720, z2: 840, s: 0.9 }, { x: 262, z1: 720, z2: 840, s: 0.9 }, { x: 218, z1: 840, z2: 960, s: 0.9 }, { x: 262, z1: 840, z2: 960, s: 0.9 }, { x: 218, z1: 960, z2: 1080, s: 0.9 }, { x: 262, z1: 960, z2: 1080, s: 0.9 }, { x: 218, z1: 1080, z2: 1200, s: 0.9 }, { x: 262, z1: 1080, z2: 1200, s: 0.9 }, { x: 338, z1: 1200, z2: 1320, s: 0.9 }, { x: 382, z1: 1200, z2: 1320, s: 0.9 }, { x: 338, z1: 1320, z2: 1440, s: 0.9 }, { x: 382, z1: 1320, z2: 1440, s: 0.9 }, { x: 698, z1: 1440, z2: 1560, s: 0.9 }, { x: 742, z1: 1440, z2: 1560, s: 0.9 }, { x: 98, z1: 1440, z2: 1560, s: 0.9 }, { x: 142, z1: 1440, z2: 1560, s: 0.9 }, { x: 98, z1: 1320, z2: 1440, s: 0.9 }, { x: 142, z1: 1320, z2: 1440, s: 0.9 }, { x: 98, z1: 1200, z2: 1320, s: 0.9 }, { x: 142, z1: 1200, z2: 1320, s: 0.9 }, { x: 98, z1: 1080, z2: 1200, s: 0.9 }, { x: 142, z1: 1080, z2: 1200, s: 0.9 }, { x: -22, z1: 1080, z2: 1200, s: 0.9 }, { x: 22, z1: 1080, z2: 1200, s: 0.9 }, { x: -22, z1: 1200, z2: 1320, s: 0.9 }, { x: 22, z1: 1200, z2: 1320, s: 0.9 }, { x: -22, z1: 1320, z2: 1440, s: 0.9 }, { x: 22, z1: 1320, z2: 1440, s: 0.9 }, { x: -22, z1: 1440, z2: 1560, s: 0.9 }, { x: 22, z1: 1440, z2: 1560, s: 0.9 }, { x: -262, z1: 1560, z2: 1680, s: 0.9 }, { x: -218, z1: 1560, z2: 1680, s: 0.9 }, { x: -502, z1: 1560, z2: 1680, s: 0.9 }, { x: -458, z1: 1560, z2: 1680, s: 0.9 }, { x: -622, z1: 1440, z2: 1560, s: 0.9 }, { x: -578, z1: 1440, z2: 1560, s: 0.9 }, { x: -622, z1: 1320, z2: 1440, s: 0.9 }, { x: -578, z1: 1320, z2: 1440, s: 0.9 }, { x: -502, z1: 1200, z2: 1320, s: 0.9 }, { x: -458, z1: 1200, z2: 1320, s: 0.9 }], timeLimit: 1490, hasGarage: true, assets: ['suburban', 'industrial'] },
          10: { name: 'Eastern Express Hwy', sky: 0x8cbbd6, fog: 750, ground: 0x2a5e28, amb: 0.85, veh: 'auto', npcTypes: ['car', 'truck', 'bus', 'car', 'auto', 'bike', 'car', 'truck', 'bus', 'car', 'taxi', 'auto', 'car', 'bike', 'car', 'truck', 'bus', 'car', 'auto', 'bike', 'car', 'car', 'bus', 'auto'], hasMetro: true, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'h', z: 0, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -380, z2: -220 }, { type: 'v', x: 240, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -500, z2: -340 }, { type: 'v', x: 360, z1: -380, z2: -220 }, { type: 'h', z: -240, x1: 340, x2: 500 }, { type: 'h', z: -240, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: -380, z2: -220 }, { type: 'v', x: 600, z1: -500, z2: -340 }, { type: 'v', x: 600, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: 580, x2: 740 }, { type: 'h', z: -600, x1: 700, x2: 860 }, { type: 'v', x: 840, z1: -740, z2: -580 }, { type: 'v', x: 840, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: 820, x2: 980 }, { type: 'h', z: -840, x1: 940, x2: 1100 }, { type: 'h', z: -840, x1: 1060, x2: 1220 }, { type: 'h', z: -840, x1: 1180, x2: 1340 }, { type: 'v', x: 1320, z1: -860, z2: -700 }, { type: 'h', z: -720, x1: 1300, x2: 1460 }, { type: 'v', x: 1440, z1: -740, z2: -580 }, { type: 'h', z: -600, x1: 1420, x2: 1580 }, { type: 'v', x: 1560, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: 1540, x2: 1700 }, { type: 'v', x: 1680, z1: -740, z2: -580 }, { type: 'v', x: 1680, z1: -620, z2: -460 }, { type: 'v', x: 1680, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: 1660, x2: 1820 }, { type: 'h', z: -360, x1: 1780, x2: 1940 }, { type: 'v', x: 1920, z1: -380, z2: -220 }, { type: 'v', x: 1920, z1: -260, z2: -100 }, { type: 'h', z: -120, x1: 1780, x2: 1940 }, { type: 'v', x: 1800, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: 1660, x2: 1820 }, { type: 'v', x: 1680, z1: -260, z2: -100 }, { type: 'h', z: -120, x1: 1540, x2: 1700 }, { type: 'h', z: -120, x1: 1420, x2: 1580 }, { type: 'v', x: 1440, z1: -140, z2: 20 }, { type: 'v', x: 1440, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: 1300, x2: 1460 }, { type: 'h', z: 120, x1: 1180, x2: 1340 }, { type: 'h', z: 120, x1: 1060, x2: 1220 }, { type: 'v', x: 1080, z1: 100, z2: 260 }, { type: 'v', x: 1080, z1: 220, z2: 380 }, { type: 'v', x: 1080, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: 1060, x2: 1220 }, { type: 'v', x: 1200, z1: 460, z2: 620 }, { type: 'v', x: 1200, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: 1060, x2: 1220 }, { type: 'h', z: 720, x1: -40, x2: 1100 }, { type: 'h', z: -600, x1: -160, x2: 1840 }, { type: 'v', x: 840, z1: -1600, z2: 400 }, { type: 'h', z: 720, x1: 80, x2: 2080 }, { type: 'v', x: 1080, z1: -280, z2: 1720 }, { type: 'h', z: -120, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -1120, z2: 880 }, { type: 'h', z: 240, x1: 80, x2: 2080 }, { type: 'v', x: 1080, z1: -760, z2: 1240 }, { type: 'h', z: -120, x1: 680, x2: 2680 }, { type: 'v', x: 1680, z1: -1120, z2: 880 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 240, z: 0 }, { x: 240, z: -120 }, { x: 120, z: -120 }, { x: 120, z: -240 }, { x: 240, z: -240 }, { x: 240, z: -360 }, { x: 240, z: -480 }, { x: 360, z: -480 }, { x: 360, z: -360 }, { x: 360, z: -240 }, { x: 480, z: -240 }, { x: 600, z: -240 }, { x: 600, z: -360 }, { x: 600, z: -480 }, { x: 600, z: -600 }, { x: 720, z: -600 }, { x: 840, z: -600 }, { x: 840, z: -720 }, { x: 840, z: -840 }, { x: 960, z: -840 }, { x: 1080, z: -840 }, { x: 1200, z: -840 }, { x: 1320, z: -840 }, { x: 1320, z: -720 }, { x: 1440, z: -720 }, { x: 1440, z: -600 }, { x: 1560, z: -600 }, { x: 1560, z: -720 }, { x: 1680, z: -720 }, { x: 1680, z: -600 }, { x: 1680, z: -480 }, { x: 1680, z: -360 }, { x: 1800, z: -360 }, { x: 1920, z: -360 }, { x: 1920, z: -240 }, { x: 1920, z: -120 }, { x: 1800, z: -120 }, { x: 1800, z: -240 }, { x: 1680, z: -240 }, { x: 1680, z: -120 }, { x: 1560, z: -120 }, { x: 1440, z: -120 }, { x: 1440, z: 0 }, { x: 1440, z: 120 }, { x: 1320, z: 120 }, { x: 1200, z: 120 }, { x: 1080, z: 120 }, { x: 1080, z: 240 }, { x: 1080, z: 360 }, { x: 1080, z: 480 }, { x: 1200, z: 480 }, { x: 1200, z: 600 }, { x: 1200, z: 720 }, { x: 1080, z: 720 }, { x: 960, z: 720 }], ints: [[240, 0], [360, -360], [720, -600], [1680, -600], [600, -600], [1320, -720], [1440, 120], [1080, 120], [1440, -120], [600, -240], [1560, -600], [840, -600], [1560, -120], [240, -360], [240, -480], [1440, -720], [840, -840], [240, -240], [960, 720], [960, -840], [1680, -480], [0, 0], [480, -240], [1440, 0], [1200, 120], [1920, -360], [1440, -600], [1800, -240], [120, -240], [1680, -360], [1800, -360], [1680, -240], [240, -120], [360, -240], [1320, 120], [360, -480], [1200, -840], [1200, 720], [1320, -840], [1680, -120], [840, -720], [1080, -840], [120, 0], [1560, -720], [600, -480], [1080, 720], [1080, 360], [600, -360], [1680, -720], [1800, -120], [1920, -240], [1200, 480], [1080, 480], [120, -120], [1080, 240], [1920, -120], [1200, 600]], bldg: [{ x: 218, z1: -120, z2: 0, s: 0.9 }, { x: 262, z1: -120, z2: 0, s: 0.9 }, { x: 98, z1: -240, z2: -120, s: 0.9 }, { x: 142, z1: -240, z2: -120, s: 0.9 }, { x: 218, z1: -360, z2: -240, s: 0.9 }, { x: 262, z1: -360, z2: -240, s: 0.9 }, { x: 218, z1: -480, z2: -360, s: 0.9 }, { x: 262, z1: -480, z2: -360, s: 0.9 }, { x: 338, z1: -480, z2: -360, s: 0.9 }, { x: 382, z1: -480, z2: -360, s: 0.9 }, { x: 338, z1: -360, z2: -240, s: 0.9 }, { x: 382, z1: -360, z2: -240, s: 0.9 }, { x: 578, z1: -360, z2: -240, s: 0.9 }, { x: 622, z1: -360, z2: -240, s: 0.9 }, { x: 578, z1: -480, z2: -360, s: 0.9 }, { x: 622, z1: -480, z2: -360, s: 0.9 }, { x: 578, z1: -600, z2: -480, s: 0.9 }, { x: 622, z1: -600, z2: -480, s: 0.9 }, { x: 818, z1: -720, z2: -600, s: 0.9 }, { x: 862, z1: -720, z2: -600, s: 0.9 }, { x: 818, z1: -840, z2: -720, s: 0.9 }, { x: 862, z1: -840, z2: -720, s: 0.9 }, { x: 1298, z1: -840, z2: -720, s: 0.9 }, { x: 1342, z1: -840, z2: -720, s: 0.9 }, { x: 1418, z1: -720, z2: -600, s: 0.9 }, { x: 1462, z1: -720, z2: -600, s: 0.9 }, { x: 1538, z1: -720, z2: -600, s: 0.9 }, { x: 1582, z1: -720, z2: -600, s: 0.9 }, { x: 1658, z1: -720, z2: -600, s: 0.9 }, { x: 1702, z1: -720, z2: -600, s: 0.9 }, { x: 1658, z1: -600, z2: -480, s: 0.9 }, { x: 1702, z1: -600, z2: -480, s: 0.9 }, { x: 1658, z1: -480, z2: -360, s: 0.9 }, { x: 1702, z1: -480, z2: -360, s: 0.9 }, { x: 1898, z1: -360, z2: -240, s: 0.9 }, { x: 1942, z1: -360, z2: -240, s: 0.9 }, { x: 1898, z1: -240, z2: -120, s: 0.9 }, { x: 1942, z1: -240, z2: -120, s: 0.9 }, { x: 1778, z1: -240, z2: -120, s: 0.9 }, { x: 1822, z1: -240, z2: -120, s: 0.9 }, { x: 1658, z1: -240, z2: -120, s: 0.9 }, { x: 1702, z1: -240, z2: -120, s: 0.9 }, { x: 1418, z1: -120, z2: 0, s: 0.9 }, { x: 1462, z1: -120, z2: 0, s: 0.9 }, { x: 1418, z1: 0, z2: 120, s: 0.9 }, { x: 1462, z1: 0, z2: 120, s: 0.9 }, { x: 1058, z1: 120, z2: 240, s: 0.9 }, { x: 1102, z1: 120, z2: 240, s: 0.9 }, { x: 1058, z1: 240, z2: 360, s: 0.9 }, { x: 1102, z1: 240, z2: 360, s: 0.9 }, { x: 1058, z1: 360, z2: 480, s: 0.9 }, { x: 1102, z1: 360, z2: 480, s: 0.9 }, { x: 1178, z1: 480, z2: 600, s: 0.9 }, { x: 1222, z1: 480, z2: 600, s: 0.9 }, { x: 1178, z1: 600, z2: 720, s: 0.9 }, { x: 1222, z1: 600, z2: 720, s: 0.9 }], timeLimit: 1600, hasGarage: true, assets: ['suburban', 'industrial', 'trains'] },
          11: { name: 'Sion Hospital', sky: 0x0a0f1d, fog: 500, ground: 0x1a2a1d, amb: 0.35, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'taxi', 'car', 'auto', 'bike', 'car', 'auto', 'car', 'bike', 'auto', 'car', 'taxi', 'car'], isNight: true, hasSilentZone: true, silentZ1: 0, silentZ2: 250, roads: [{ type: 'v', x: 0, z1: -140, z2: 1000 }, { type: 'v', x: 0, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -20, x2: 140 }, { type: 'h', z: -240, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: 100, x2: 260 }, { type: 'h', z: -360, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -140, x2: 20 }, { type: 'h', z: -600, x1: -20, x2: 140 }, { type: 'h', z: -600, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -740, z2: -580 }, { type: 'v', x: 360, z1: -620, z2: -460 }, { type: 'h', z: -480, x1: 220, x2: 380 }, { type: 'h', z: -480, x1: -880, x2: 260 }, { type: 'h', z: -360, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -1360, z2: 640 }, { type: 'h', z: 0, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1000, z2: 1000 }, { type: 'h', z: -600, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -1600, z2: 400 }, { type: 'h', z: -600, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1600, z2: 400 }, { type: 'h', z: -240, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1240, z2: 760 }], route: [{ x: 0, z: 0 }, { x: 0, z: -120 }, { x: 0, z: -240 }, { x: 120, z: -240 }, { x: 240, z: -240 }, { x: 240, z: -360 }, { x: 120, z: -360 }, { x: 0, z: -360 }, { x: 0, z: -480 }, { x: -120, z: -480 }, { x: -120, z: -600 }, { x: 0, z: -600 }, { x: 120, z: -600 }, { x: 240, z: -600 }, { x: 240, z: -720 }, { x: 360, z: -720 }, { x: 360, z: -600 }, { x: 360, z: -480 }, { x: 240, z: -480 }, { x: 120, z: -480 }], ints: [[240, -360], [0, -600], [240, -480], [240, -240], [120, -600], [0, 0], [-120, -480], [120, -240], [-120, -600], [0, -240], [0, -480], [360, -480], [120, -360], [360, -720], [120, -480], [360, -600], [0, -120], [240, -600], [240, -720], [0, -360]], bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: -22, z1: -240, z2: -120, s: 0.9 }, { x: 22, z1: -240, z2: -120, s: 0.9 }, { x: 218, z1: -360, z2: -240, s: 0.9 }, { x: 262, z1: -360, z2: -240, s: 0.9 }, { x: -22, z1: -480, z2: -360, s: 0.9 }, { x: 22, z1: -480, z2: -360, s: 0.9 }, { x: -142, z1: -600, z2: -480, s: 0.9 }, { x: -98, z1: -600, z2: -480, s: 0.9 }, { x: 218, z1: -720, z2: -600, s: 0.9 }, { x: 262, z1: -720, z2: -600, s: 0.9 }, { x: 338, z1: -720, z2: -600, s: 0.9 }, { x: 382, z1: -720, z2: -600, s: 0.9 }, { x: 338, z1: -600, z2: -480, s: 0.9 }, { x: 382, z1: -600, z2: -480, s: 0.9 }], timeLimit: 1710, hasGarage: true, assets: ['suburban', 'industrial'] },
          12: { name: 'Dharavi', sky: 0x8aafca, fog: 450, ground: 0x3a5228, amb: 0.7, veh: 'twowheeler', npcTypes: ['auto', 'bike', 'cycle', 'auto', 'car', 'bike', 'cycle', 'taxi', 'auto', 'car', 'bike', 'auto', 'car', 'cycle', 'auto', 'bike'], roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'h', z: 0, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: -380, z2: -220 }, { type: 'v', x: -120, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: -140, x2: 20 }, { type: 'h', z: -840, x1: -260, x2: -100 }, { type: 'h', z: -840, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: -860, z2: -700 }, { type: 'h', z: -720, x1: -380, x2: 760 }, { type: 'h', z: -600, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1600, z2: 400 }, { type: 'h', z: -240, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1240, z2: 760 }, { type: 'h', z: -120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -1120, z2: 880 }, { type: 'h', z: -480, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1480, z2: 520 }, { type: 'h', z: -840, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -1840, z2: 160 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -240, z: 0 }, { x: -240, z: -120 }, { x: -120, z: -120 }, { x: 0, z: -120 }, { x: 0, z: -240 }, { x: -120, z: -240 }, { x: -120, z: -360 }, { x: -120, z: -480 }, { x: -240, z: -480 }, { x: -240, z: -600 }, { x: -120, z: -600 }, { x: -120, z: -720 }, { x: 0, z: -720 }, { x: 0, z: -840 }, { x: -120, z: -840 }, { x: -240, z: -840 }, { x: -360, z: -840 }, { x: -360, z: -720 }, { x: -240, z: -720 }], ints: [[-240, -840], [0, -840], [-360, -840], [-360, -720], [-120, -360], [-240, -120], [0, 0], [-120, -480], [-240, -480], [-120, -600], [-120, -720], [0, -240], [-240, -720], [-120, -840], [-120, 0], [0, -120], [-120, -120], [-240, 0], [0, -720], [-240, -600], [-120, -240]], bldg: [{ x: -262, z1: -120, z2: 0, s: 0.9 }, { x: -218, z1: -120, z2: 0, s: 0.9 }, { x: -22, z1: -240, z2: -120, s: 0.9 }, { x: 22, z1: -240, z2: -120, s: 0.9 }, { x: -142, z1: -360, z2: -240, s: 0.9 }, { x: -98, z1: -360, z2: -240, s: 0.9 }, { x: -142, z1: -480, z2: -360, s: 0.9 }, { x: -98, z1: -480, z2: -360, s: 0.9 }, { x: -262, z1: -600, z2: -480, s: 0.9 }, { x: -218, z1: -600, z2: -480, s: 0.9 }, { x: -142, z1: -720, z2: -600, s: 0.9 }, { x: -98, z1: -720, z2: -600, s: 0.9 }, { x: -22, z1: -840, z2: -720, s: 0.9 }, { x: 22, z1: -840, z2: -720, s: 0.9 }, { x: -382, z1: -840, z2: -720, s: 0.9 }, { x: -338, z1: -840, z2: -720, s: 0.9 }], timeLimit: 1820, hasGarage: true, assets: ['suburban', 'industrial'] },
          13: { name: 'Linking Road', sky: 0x7a9eb5, fog: 550, ground: 0x346a2e, amb: 0.75, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'car', 'taxi', 'auto', 'bike', 'car', 'auto', 'car', 'bike', 'car', 'auto', 'car', 'bike'], hasCheckpoint: true, checkpointZ: 0, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'v', x: 120, z1: -20, z2: 140 }, { type: 'v', x: 120, z1: 100, z2: 260 }, { type: 'v', x: 120, z1: 220, z2: 380 }, { type: 'v', x: 120, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 460, z2: 620 }, { type: 'v', x: 240, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: 100, x2: 260 }, { type: 'h', z: 720, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 580, z2: 740 }, { type: 'v', x: 0, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: -140, x2: 20 }, { type: 'h', z: 480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: 340, z2: 500 }, { type: 'v', x: -240, z1: 220, z2: 380 }, { type: 'h', z: 240, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 460, z2: 620 }, { type: 'v', x: -360, z1: 580, z2: 740 }, { type: 'v', x: -360, z1: 700, z2: 860 }, { type: 'v', x: -360, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 940, z2: 1100 }, { type: 'h', z: 1080, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 1060, z2: 1220 }, { type: 'h', z: 1200, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: 1180, z2: 1340 }, { type: 'v', x: -720, z1: 1300, z2: 1460 }, { type: 'h', z: 1440, x1: -740, x2: -580 }, { type: 'v', x: -600, z1: 1300, z2: 1460 }, { type: 'h', z: 1320, x1: -620, x2: -460 }, { type: 'h', z: 1320, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 1180, z2: 1340 }, { type: 'h', z: 1200, x1: -1480, x2: -340 }, { type: 'h', z: 480, x1: -1480, x2: 520 }, { type: 'v', x: -480, z1: -520, z2: 1480 }, { type: 'h', z: 720, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -280, z2: 1720 }, { type: 'h', z: 720, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -280, z2: 1720 }, { type: 'h', z: 720, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -280, z2: 1720 }, { type: 'h', z: 480, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -520, z2: 1480 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 120, z: 120 }, { x: 120, z: 240 }, { x: 120, z: 360 }, { x: 120, z: 480 }, { x: 240, z: 480 }, { x: 240, z: 600 }, { x: 240, z: 720 }, { x: 120, z: 720 }, { x: 0, z: 720 }, { x: 0, z: 600 }, { x: 0, z: 480 }, { x: -120, z: 480 }, { x: -240, z: 480 }, { x: -240, z: 360 }, { x: -240, z: 240 }, { x: -360, z: 240 }, { x: -360, z: 360 }, { x: -480, z: 360 }, { x: -480, z: 480 }, { x: -360, z: 480 }, { x: -360, z: 600 }, { x: -360, z: 720 }, { x: -360, z: 840 }, { x: -360, z: 960 }, { x: -480, z: 960 }, { x: -480, z: 1080 }, { x: -600, z: 1080 }, { x: -600, z: 1200 }, { x: -720, z: 1200 }, { x: -720, z: 1320 }, { x: -720, z: 1440 }, { x: -600, z: 1440 }, { x: -600, z: 1320 }, { x: -480, z: 1320 }, { x: -360, z: 1320 }, { x: -360, z: 1200 }, { x: -480, z: 1200 }], ints: [[-480, 1320], [-360, 240], [-240, 480], [-720, 1320], [120, 360], [-360, 1200], [-360, 960], [0, 0], [-480, 480], [-360, 1320], [-720, 1200], [-720, 1440], [120, 240], [-600, 1440], [-360, 480], [-480, 360], [-600, 1080], [240, 720], [0, 600], [-240, 360], [120, 480], [-240, 240], [-480, 960], [-480, 1080], [120, 0], [120, 120], [-600, 1200], [-480, 1200], [-600, 1320], [240, 480], [240, 600], [-360, 720], [0, 720], [-120, 480], [-360, 840], [0, 480], [120, 720], [-360, 360], [-360, 600]], bldg: [{ x: 98, z1: 0, z2: 120, s: 0.9 }, { x: 142, z1: 0, z2: 120, s: 0.9 }, { x: 98, z1: 120, z2: 240, s: 0.9 }, { x: 142, z1: 120, z2: 240, s: 0.9 }, { x: 98, z1: 240, z2: 360, s: 0.9 }, { x: 142, z1: 240, z2: 360, s: 0.9 }, { x: 98, z1: 360, z2: 480, s: 0.9 }, { x: 142, z1: 360, z2: 480, s: 0.9 }, { x: 218, z1: 480, z2: 600, s: 0.9 }, { x: 262, z1: 480, z2: 600, s: 0.9 }, { x: 218, z1: 600, z2: 720, s: 0.9 }, { x: 262, z1: 600, z2: 720, s: 0.9 }, { x: -22, z1: 600, z2: 720, s: 0.9 }, { x: 22, z1: 600, z2: 720, s: 0.9 }, { x: -22, z1: 480, z2: 600, s: 0.9 }, { x: 22, z1: 480, z2: 600, s: 0.9 }, { x: -262, z1: 360, z2: 480, s: 0.9 }, { x: -218, z1: 360, z2: 480, s: 0.9 }, { x: -262, z1: 240, z2: 360, s: 0.9 }, { x: -218, z1: 240, z2: 360, s: 0.9 }, { x: -382, z1: 240, z2: 360, s: 0.9 }, { x: -338, z1: 240, z2: 360, s: 0.9 }, { x: -502, z1: 360, z2: 480, s: 0.9 }, { x: -458, z1: 360, z2: 480, s: 0.9 }, { x: -382, z1: 480, z2: 600, s: 0.9 }, { x: -338, z1: 480, z2: 600, s: 0.9 }, { x: -382, z1: 600, z2: 720, s: 0.9 }, { x: -338, z1: 600, z2: 720, s: 0.9 }, { x: -382, z1: 720, z2: 840, s: 0.9 }, { x: -338, z1: 720, z2: 840, s: 0.9 }, { x: -382, z1: 840, z2: 960, s: 0.9 }, { x: -338, z1: 840, z2: 960, s: 0.9 }, { x: -502, z1: 960, z2: 1080, s: 0.9 }, { x: -458, z1: 960, z2: 1080, s: 0.9 }, { x: -622, z1: 1080, z2: 1200, s: 0.9 }, { x: -578, z1: 1080, z2: 1200, s: 0.9 }, { x: -742, z1: 1200, z2: 1320, s: 0.9 }, { x: -698, z1: 1200, z2: 1320, s: 0.9 }, { x: -742, z1: 1320, z2: 1440, s: 0.9 }, { x: -698, z1: 1320, z2: 1440, s: 0.9 }, { x: -622, z1: 1320, z2: 1440, s: 0.9 }, { x: -578, z1: 1320, z2: 1440, s: 0.9 }, { x: -382, z1: 1200, z2: 1320, s: 0.9 }, { x: -338, z1: 1200, z2: 1320, s: 0.9 }], timeLimit: 1930, hasGarage: true, assets: ['suburban', 'industrial', 'construction'] },
          14: { name: 'Bandra-Worli Sea Link', sky: 0x4a90d9, fog: 750, ground: 0x1a5a8a, amb: 0.9, veh: 'car_highway', npcTypes: ['car', 'car', 'car', 'truck', 'car', 'car', 'bus', 'car', 'car', 'car', 'car', 'car', 'car', 'car', 'taxi', 'car', 'car', 'car', 'car', 'bus', 'car', 'car', 'car', 'car', 'car', 'car', 'car', 'car'], isBridge: true, speedMin: 40, speedMax: 80, roads: [{ type: 'v', x: 0, z1: -140, z2: 1000 }, { type: 'h', z: -120, x1: -20, x2: 140 }, { type: 'v', x: 120, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -20, x2: 140 }, { type: 'h', z: -240, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: -260, z2: -100 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: 0, x1: -260, x2: -100 }, { type: 'h', z: 0, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: -140, z2: 20 }, { type: 'v', x: -360, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -500, x2: -340 }, { type: 'h', z: -240, x1: -620, x2: -460 }, { type: 'h', z: -240, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: -260, z2: -100 }, { type: 'h', z: -120, x1: -860, x2: -700 }, { type: 'v', x: -840, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -980, x2: -820 }, { type: 'v', x: -960, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -980, x2: -820 }, { type: 'v', x: -840, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -860, x2: -700 }, { type: 'h', z: -480, x1: -740, x2: -580 }, { type: 'v', x: -600, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: -620, x2: -460 }, { type: 'h', z: -360, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: -620, z2: -460 }, { type: 'v', x: -480, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: -500, x2: -340 }, { type: 'h', z: -840, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -980, z2: -820 }, { type: 'h', z: -960, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: -1100, z2: -940 }, { type: 'h', z: -1080, x1: -620, x2: -460 }, { type: 'h', z: -1080, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: -1100, z2: -940 }, { type: 'v', x: -720, z1: -980, z2: -820 }, { type: 'v', x: -720, z1: -860, z2: -700 }, { type: 'v', x: -720, z1: -740, z2: -580 }, { type: 'h', z: -600, x1: -740, x2: -580 }, { type: 'v', x: -600, z1: -1720, z2: -580 }, { type: 'h', z: -240, x1: -1840, x2: 160 }, { type: 'v', x: -840, z1: -1240, z2: 760 }, { type: 'h', z: 0, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1000, z2: 1000 }, { type: 'h', z: -840, x1: -1480, x2: 520 }, { type: 'v', x: -480, z1: -1840, z2: 160 }, { type: 'h', z: -480, x1: -1480, x2: 520 }, { type: 'v', x: -480, z1: -1480, z2: 520 }, { type: 'h', z: -360, x1: -1960, x2: 40 }, { type: 'v', x: -960, z1: -1360, z2: 640 }], route: [{ x: 0, z: 0 }, { x: 0, z: -120 }, { x: 120, z: -120 }, { x: 120, z: -240 }, { x: 0, z: -240 }, { x: -120, z: -240 }, { x: -120, z: -120 }, { x: -120, z: 0 }, { x: -240, z: 0 }, { x: -360, z: 0 }, { x: -360, z: -120 }, { x: -360, z: -240 }, { x: -480, z: -240 }, { x: -600, z: -240 }, { x: -720, z: -240 }, { x: -720, z: -120 }, { x: -840, z: -120 }, { x: -840, z: -240 }, { x: -960, z: -240 }, { x: -960, z: -360 }, { x: -840, z: -360 }, { x: -840, z: -480 }, { x: -720, z: -480 }, { x: -600, z: -480 }, { x: -600, z: -360 }, { x: -480, z: -360 }, { x: -360, z: -360 }, { x: -360, z: -480 }, { x: -480, z: -480 }, { x: -480, z: -600 }, { x: -480, z: -720 }, { x: -360, z: -720 }, { x: -360, z: -840 }, { x: -480, z: -840 }, { x: -600, z: -840 }, { x: -600, z: -960 }, { x: -480, z: -960 }, { x: -480, z: -1080 }, { x: -600, z: -1080 }, { x: -720, z: -1080 }, { x: -720, z: -960 }, { x: -720, z: -840 }, { x: -720, z: -720 }, { x: -720, z: -600 }, { x: -600, z: -600 }, { x: -600, z: -720 }], ints: [[-600, -1080], [-840, -240], [-360, 0], [-360, -840], [-480, -360], [-600, -600], [-960, -240], [-960, -360], [-360, -720], [-720, -120], [-480, -960], [0, 0], [-720, -480], [-720, -600], [-600, -720], [-480, -600], [-480, -480], [120, -240], [-720, -1080], [-360, -240], [-480, -720], [0, -240], [-480, -1080], [-360, -480], [-600, -840], [-720, -840], [-720, -960], [-600, -360], [-360, -360], [-360, -120], [-120, 0], [-840, -360], [-720, -720], [0, -120], [-120, -120], [-480, -240], [-240, 0], [120, -120], [-840, -120], [-600, -960], [-480, -840], [-720, -240], [-120, -240], [-600, -480], [-840, -480], [-600, -240]], bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: 98, z1: -240, z2: -120, s: 0.9 }, { x: 142, z1: -240, z2: -120, s: 0.9 }, { x: -142, z1: -240, z2: -120, s: 0.9 }, { x: -98, z1: -240, z2: -120, s: 0.9 }, { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -382, z1: -120, z2: 0, s: 0.9 }, { x: -338, z1: -120, z2: 0, s: 0.9 }, { x: -382, z1: -240, z2: -120, s: 0.9 }, { x: -338, z1: -240, z2: -120, s: 0.9 }, { x: -742, z1: -240, z2: -120, s: 0.9 }, { x: -698, z1: -240, z2: -120, s: 0.9 }, { x: -862, z1: -240, z2: -120, s: 0.9 }, { x: -818, z1: -240, z2: -120, s: 0.9 }, { x: -982, z1: -360, z2: -240, s: 0.9 }, { x: -938, z1: -360, z2: -240, s: 0.9 }, { x: -862, z1: -480, z2: -360, s: 0.9 }, { x: -818, z1: -480, z2: -360, s: 0.9 }, { x: -622, z1: -480, z2: -360, s: 0.9 }, { x: -578, z1: -480, z2: -360, s: 0.9 }, { x: -382, z1: -480, z2: -360, s: 0.9 }, { x: -338, z1: -480, z2: -360, s: 0.9 }, { x: -502, z1: -600, z2: -480, s: 0.9 }, { x: -458, z1: -600, z2: -480, s: 0.9 }, { x: -502, z1: -720, z2: -600, s: 0.9 }, { x: -458, z1: -720, z2: -600, s: 0.9 }, { x: -382, z1: -840, z2: -720, s: 0.9 }, { x: -338, z1: -840, z2: -720, s: 0.9 }, { x: -622, z1: -960, z2: -840, s: 0.9 }, { x: -578, z1: -960, z2: -840, s: 0.9 }, { x: -502, z1: -1080, z2: -960, s: 0.9 }, { x: -458, z1: -1080, z2: -960, s: 0.9 }, { x: -742, z1: -1080, z2: -960, s: 0.9 }, { x: -698, z1: -1080, z2: -960, s: 0.9 }, { x: -742, z1: -960, z2: -840, s: 0.9 }, { x: -698, z1: -960, z2: -840, s: 0.9 }, { x: -742, z1: -840, z2: -720, s: 0.9 }, { x: -698, z1: -840, z2: -720, s: 0.9 }, { x: -742, z1: -720, z2: -600, s: 0.9 }, { x: -698, z1: -720, z2: -600, s: 0.9 }, { x: -622, z1: -720, z2: -600, s: 0.9 }, { x: -578, z1: -720, z2: -600, s: 0.9 }], timeLimit: 2040, hasGarage: true, assets: ['suburban', 'industrial'] },
          15: { name: 'South Mumbai Circuit', sky: 0x7ab5d0, fog: 700, ground: 0x2e6b32, amb: 0.8, veh: 'car', npcTypes: ['car', 'bus', 'auto', 'bike', 'truck', 'car', 'cycle', 'auto', 'car', 'bus', 'bike', 'car', 'taxi', 'auto', 'car', 'bus', 'bike', 'car', 'auto', 'taxi', 'car', 'bus', 'auto', 'bike', 'car', 'truck', 'car', 'auto', 'car', 'bus'], roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'v', x: -120, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: -140, x2: 20 }, { type: 'h', z: 120, x1: -20, x2: 140 }, { type: 'h', z: 120, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 100, z2: 260 }, { type: 'v', x: 240, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 220, z2: 380 }, { type: 'h', z: 240, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: 340, z2: 500 }, { type: 'v', x: -120, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: -20, x2: 140 }, { type: 'h', z: 480, x1: 100, x2: 260 }, { type: 'h', z: 480, x1: 220, x2: 380 }, { type: 'h', z: 480, x1: 340, x2: 500 }, { type: 'h', z: 480, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: 580, z2: 740 }, { type: 'v', x: 720, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: 580, x2: 740 }, { type: 'h', z: 840, x1: 460, x2: 620 }, { type: 'v', x: 480, z1: 700, z2: 860 }, { type: 'v', x: 480, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: 340, x2: 500 }, { type: 'h', z: 600, x1: 220, x2: 380 }, { type: 'h', z: 600, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 580, z2: 740 }, { type: 'v', x: 120, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: 820, z2: 980 }, { type: 'h', z: 840, x1: -260, x2: -100 }, { type: 'h', z: 840, x1: -380, x2: -220 }, { type: 'h', z: 840, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 940, z2: 1100 }, { type: 'v', x: -360, z1: 1060, z2: 1220 }, { type: 'v', x: -360, z1: 1180, z2: 1340 }, { type: 'v', x: -360, z1: 1300, z2: 1460 }, { type: 'v', x: -360, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: -380, x2: -220 }, { type: 'h', z: 1560, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: 1420, z2: 1580 }, { type: 'h', z: 1440, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: -20, x2: 140 }, { type: 'h', z: 1560, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 1420, z2: 1580 }, { type: 'h', z: 1440, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 1300, z2: 1460 }, { type: 'v', x: 120, z1: 1180, z2: 1340 }, { type: 'h', z: 1200, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 1180, z2: 1340 }, { type: 'h', z: 1320, x1: 220, x2: 380 }, { type: 'h', z: 1320, x1: 340, x2: 500 }, { type: 'h', z: 1320, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: 1300, z2: 1460 }, { type: 'h', z: 1440, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: 580, x2: 740 }, { type: 'v', x: 600, z1: 1540, z2: 1700 }, { type: 'v', x: 600, z1: 1660, z2: 1820 }, { type: 'v', x: 600, z1: 1780, z2: 1940 }, { type: 'v', x: 600, z1: 1900, z2: 2060 }, { type: 'v', x: 600, z1: 2020, z2: 2180 }, { type: 'h', z: 2160, x1: 580, x2: 740 }, { type: 'h', z: 2160, x1: 700, x2: 860 }, { type: 'v', x: 840, z1: 2140, z2: 2300 }, { type: 'v', x: 840, z1: 2260, z2: 2420 }, { type: 'h', z: 2400, x1: 700, x2: 860 }, { type: 'v', x: 720, z1: 2380, z2: 2540 }, { type: 'v', x: 720, z1: 2500, z2: 3640 }, { type: 'h', z: 840, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -160, z2: 1840 }, { type: 'h', z: 1560, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: 560, z2: 2560 }, { type: 'h', z: 120, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -880, z2: 1120 }, { type: 'h', z: 720, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -280, z2: 1720 }, { type: 'h', z: 480, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -520, z2: 1480 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -120, z: 120 }, { x: 0, z: 120 }, { x: 120, z: 120 }, { x: 240, z: 120 }, { x: 240, z: 240 }, { x: 240, z: 360 }, { x: 120, z: 360 }, { x: 120, z: 240 }, { x: 0, z: 240 }, { x: 0, z: 360 }, { x: -120, z: 360 }, { x: -120, z: 480 }, { x: -120, z: 600 }, { x: 0, z: 600 }, { x: 0, z: 480 }, { x: 120, z: 480 }, { x: 240, z: 480 }, { x: 360, z: 480 }, { x: 480, z: 480 }, { x: 600, z: 480 }, { x: 600, z: 600 }, { x: 720, z: 600 }, { x: 720, z: 720 }, { x: 720, z: 840 }, { x: 600, z: 840 }, { x: 480, z: 840 }, { x: 480, z: 720 }, { x: 480, z: 600 }, { x: 360, z: 600 }, { x: 240, z: 600 }, { x: 120, z: 600 }, { x: 120, z: 720 }, { x: 120, z: 840 }, { x: 0, z: 840 }, { x: 0, z: 960 }, { x: -120, z: 960 }, { x: -120, z: 840 }, { x: -240, z: 840 }, { x: -360, z: 840 }, { x: -480, z: 840 }, { x: -480, z: 960 }, { x: -360, z: 960 }, { x: -360, z: 1080 }, { x: -360, z: 1200 }, { x: -360, z: 1320 }, { x: -360, z: 1440 }, { x: -360, z: 1560 }, { x: -240, z: 1560 }, { x: -120, z: 1560 }, { x: -120, z: 1440 }, { x: 0, z: 1440 }, { x: 0, z: 1560 }, { x: 120, z: 1560 }, { x: 240, z: 1560 }, { x: 240, z: 1440 }, { x: 120, z: 1440 }, { x: 120, z: 1320 }, { x: 120, z: 1200 }, { x: 240, z: 1200 }, { x: 240, z: 1320 }, { x: 360, z: 1320 }, { x: 480, z: 1320 }, { x: 600, z: 1320 }, { x: 600, z: 1440 }, { x: 720, z: 1440 }, { x: 720, z: 1560 }, { x: 600, z: 1560 }, { x: 600, z: 1680 }, { x: 600, z: 1800 }, { x: 600, z: 1920 }, { x: 600, z: 2040 }, { x: 600, z: 2160 }, { x: 720, z: 2160 }, { x: 840, z: 2160 }, { x: 840, z: 2280 }, { x: 840, z: 2400 }, { x: 720, z: 2400 }, { x: 720, z: 2520 }, { x: 720, z: 2640 }], ints: [[-120, 960], [480, 840], [-360, 960], [840, 2160], [120, 1200], [360, 600], [840, 2280], [120, 600], [600, 1320], [-360, 1080], [0, 1560], [0, 480], [600, 1920], [0, 240], [240, 1200], [720, 1560], [-120, 360], [720, 720], [120, 360], [120, 1440], [480, 720], [720, 2160], [120, 240], [360, 480], [120, 1560], [-240, 840], [240, 1560], [120, 480], [240, 1440], [600, 840], [-480, 960], [480, 1320], [240, 240], [720, 840], [0, 360], [0, 1440], [240, 480], [240, 600], [120, 1320], [600, 1440], [240, 120], [-360, 840], [-360, 1560], [600, 1800], [360, 1320], [600, 2160], [-360, 1200], [0, 120], [600, 1560], [-360, 1320], [720, 2640], [600, 2040], [720, 600], [-120, 120], [120, 120], [-120, 600], [-120, 840], [240, 1320], [240, 360], [-240, 1560], [480, 480], [600, 600], [120, 840], [0, 0], [0, 840], [-120, 1560], [600, 1680], [600, 480], [0, 960], [720, 2520], [720, 1440], [0, 600], [-120, 0], [720, 2400], [-120, 1440], [-360, 1440], [480, 600], [-120, 480], [120, 720], [-480, 840], [840, 2400]], bldg: [{ x: -142, z1: 0, z2: 120, s: 0.9 }, { x: -98, z1: 0, z2: 120, s: 0.9 }, { x: 218, z1: 120, z2: 240, s: 0.9 }, { x: 262, z1: 120, z2: 240, s: 0.9 }, { x: 218, z1: 240, z2: 360, s: 0.9 }, { x: 262, z1: 240, z2: 360, s: 0.9 }, { x: 98, z1: 240, z2: 360, s: 0.9 }, { x: 142, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 240, z2: 360, s: 0.9 }, { x: 22, z1: 240, z2: 360, s: 0.9 }, { x: -142, z1: 360, z2: 480, s: 0.9 }, { x: -98, z1: 360, z2: 480, s: 0.9 }, { x: -142, z1: 480, z2: 600, s: 0.9 }, { x: -98, z1: 480, z2: 600, s: 0.9 }, { x: -22, z1: 480, z2: 600, s: 0.9 }, { x: 22, z1: 480, z2: 600, s: 0.9 }, { x: 578, z1: 480, z2: 600, s: 0.9 }, { x: 622, z1: 480, z2: 600, s: 0.9 }, { x: 698, z1: 600, z2: 720, s: 0.9 }, { x: 742, z1: 600, z2: 720, s: 0.9 }, { x: 698, z1: 720, z2: 840, s: 0.9 }, { x: 742, z1: 720, z2: 840, s: 0.9 }, { x: 458, z1: 720, z2: 840, s: 0.9 }, { x: 502, z1: 720, z2: 840, s: 0.9 }, { x: 458, z1: 600, z2: 720, s: 0.9 }, { x: 502, z1: 600, z2: 720, s: 0.9 }, { x: 98, z1: 600, z2: 720, s: 0.9 }, { x: 142, z1: 600, z2: 720, s: 0.9 }, { x: 98, z1: 720, z2: 840, s: 0.9 }, { x: 142, z1: 720, z2: 840, s: 0.9 }, { x: -22, z1: 840, z2: 960, s: 0.9 }, { x: 22, z1: 840, z2: 960, s: 0.9 }, { x: -142, z1: 840, z2: 960, s: 0.9 }, { x: -98, z1: 840, z2: 960, s: 0.9 }, { x: -502, z1: 840, z2: 960, s: 0.9 }, { x: -458, z1: 840, z2: 960, s: 0.9 }, { x: -382, z1: 960, z2: 1080, s: 0.9 }, { x: -338, z1: 960, z2: 1080, s: 0.9 }, { x: -382, z1: 1080, z2: 1200, s: 0.9 }, { x: -338, z1: 1080, z2: 1200, s: 0.9 }, { x: -382, z1: 1200, z2: 1320, s: 0.9 }, { x: -338, z1: 1200, z2: 1320, s: 0.9 }, { x: -382, z1: 1320, z2: 1440, s: 0.9 }, { x: -338, z1: 1320, z2: 1440, s: 0.9 }, { x: -382, z1: 1440, z2: 1560, s: 0.9 }, { x: -338, z1: 1440, z2: 1560, s: 0.9 }, { x: -142, z1: 1440, z2: 1560, s: 0.9 }, { x: -98, z1: 1440, z2: 1560, s: 0.9 }, { x: -22, z1: 1440, z2: 1560, s: 0.9 }, { x: 22, z1: 1440, z2: 1560, s: 0.9 }, { x: 218, z1: 1440, z2: 1560, s: 0.9 }, { x: 262, z1: 1440, z2: 1560, s: 0.9 }, { x: 98, z1: 1320, z2: 1440, s: 0.9 }, { x: 142, z1: 1320, z2: 1440, s: 0.9 }, { x: 98, z1: 1200, z2: 1320, s: 0.9 }, { x: 142, z1: 1200, z2: 1320, s: 0.9 }, { x: 218, z1: 1200, z2: 1320, s: 0.9 }, { x: 262, z1: 1200, z2: 1320, s: 0.9 }, { x: 578, z1: 1320, z2: 1440, s: 0.9 }, { x: 622, z1: 1320, z2: 1440, s: 0.9 }, { x: 698, z1: 1440, z2: 1560, s: 0.9 }, { x: 742, z1: 1440, z2: 1560, s: 0.9 }, { x: 578, z1: 1560, z2: 1680, s: 0.9 }, { x: 622, z1: 1560, z2: 1680, s: 0.9 }, { x: 578, z1: 1680, z2: 1800, s: 0.9 }, { x: 622, z1: 1680, z2: 1800, s: 0.9 }, { x: 578, z1: 1800, z2: 1920, s: 0.9 }, { x: 622, z1: 1800, z2: 1920, s: 0.9 }, { x: 578, z1: 1920, z2: 2040, s: 0.9 }, { x: 622, z1: 1920, z2: 2040, s: 0.9 }, { x: 578, z1: 2040, z2: 2160, s: 0.9 }, { x: 622, z1: 2040, z2: 2160, s: 0.9 }, { x: 818, z1: 2160, z2: 2280, s: 0.9 }, { x: 862, z1: 2160, z2: 2280, s: 0.9 }, { x: 818, z1: 2280, z2: 2400, s: 0.9 }, { x: 862, z1: 2280, z2: 2400, s: 0.9 }, { x: 698, z1: 2400, z2: 2520, s: 0.9 }, { x: 742, z1: 2400, z2: 2520, s: 0.9 }, { x: 698, z1: 2520, z2: 2640, s: 0.9 }, { x: 742, z1: 2520, z2: 2640, s: 0.9 }], timeLimit: 2300, hasGarage: true, assets: ['suburban', 'industrial'] }
        };
        
        if (lvId === 15) {
          const rds = [];
          const ints = [];
          // 50km grid (-25000 to 25000)
          for(let i = -25000; i <= 25000; i+=1000) {
             rds.push({ type: 'h', z: i, x1: -25000, x2: 25000 });
             rds.push({ type: 'v', x: i, z1: -25000, z2: 25000 });
             for(let j = -25000; j <= 25000; j+=1000) {
                ints.push([i, j]);
             }
          }
          let cfg = { name: '50km Open World', sky: 0x6fb8e0, fog: 2000, ground: 0x444444, amb: 0.9, veh: 'car', npcTypes: ['car', 'bike', 'bus', 'truck'], roads: rds, ints: ints, bldg: [], route: [], timeLimit: 999999, is50km: true };
          cfg.startOutside = true;
          return cfg;
        }
        let base = M[lvId] || _getThemeRoads(lv ? lv.themeType : null);
        let cfg = Object.assign({}, base);
        if (lv) Object.assign(cfg, lv);
        cfg.startOutside = true;
        return cfg;

      }

      // 🚦 VEHICLE MESH BUILDERS 🚦
      _pmesh(mode, vehType) {
        this.isPedestrian = false;
        const vt = vehType || 'car';
        
        let pStartX = -40 + 7, pStartZ = -80, pRot = 0;
        let vStartX = 5, vStartZ = 0, vRotY = 0;

        if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
          const p1 = this.mapCfg.route[0];
          const p2 = this.mapCfg.route[1];
          const dx = p2.x - p1.x;
          const dz = p2.z - p1.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0) {
            const nx = dx / dist;
            const nz = dz / dist;
            vStartX = p1.x - nz * 5;
            vStartZ = p1.z + nx * 5;
            vRotY = Math.atan2(nx, nz);

            // Sidewalk offset is roughly perpendicular to direction
            pStartX = p1.x + nx * 5 - nz * 7;
            pStartZ = p1.z + nz * 5 + nx * 7;
            pRot = Math.atan2(nx, nz);
          }
        }

        if (vt === 'pedestrian') {
          this.isPedestrian = true;
          this.player = _buildHuman(true);
          this.player.position.set(pStartX, 0, pStartZ);
          this.player.rotation.y = pRot;
          this.scene.add(this.player);
          this.maxSpd = 0.12; this.accel = 0.06; this.turn = 0.05; this.fric = 0.88;
        } else {
          // Build the vehicle
          this.playerVehicle = _buildVehicle(vt, 0xffffff);
          this.playerVehicle.position.set(vStartX, 0, vStartZ);
          this.playerVehicle.rotation.y = vRotY;
          
          if (this.mapCfg && this.mapCfg.isNight) {
            this.hL = new THREE.SpotLight(0xffffee, 2.5, 150, Math.PI / 5, 0.5, 1);
            this.hL.position.set(1.5, 1.5, 3);
            this.hL.target.position.set(1.5, -0.5, 25);
            this.hR = new THREE.SpotLight(0xffffee, 2.5, 150, Math.PI / 5, 0.5, 1);
            this.hR.position.set(-1.5, 1.5, 3);
            this.hR.target.position.set(-1.5, -0.5, 25);
            this.playerVehicle.add(this.hL);
            this.playerVehicle.add(this.hL.target);
            this.playerVehicle.add(this.hR);
            this.playerVehicle.add(this.hR.target);
            // ── PLAYER TAILLIGHTS ──
            const tlGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
            const ptlL = new THREE.Mesh(tlGeo, tlMat); ptlL.position.set(1.2, 1, -2.8);
            const ptlR = new THREE.Mesh(tlGeo, tlMat); ptlR.position.set(-1.2, 1, -2.8);
            this.playerVehicle.add(ptlL); this.playerVehicle.add(ptlR);
            this._playerTaillights = [ptlL, ptlR]; // store ref for brake glow
            // Visible headlight cone meshes (semi-transparent yellow glow)
            const coneGeo = new THREE.ConeGeometry(3, 20, 12, 1, true);
            const coneMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
            const coneL = new THREE.Mesh(coneGeo, coneMat); coneL.position.set(1.5, 0.5, 13); coneL.rotation.x = Math.PI / 2;
            const coneR = new THREE.Mesh(coneGeo.clone(), coneMat.clone()); coneR.position.set(-1.5, 0.5, 13); coneR.rotation.x = Math.PI / 2;
            this.playerVehicle.add(coneL); this.playerVehicle.add(coneR);
            this._headlightCones = [coneL, coneR];
          }

          this.scene.add(this.playerVehicle);

          // Always start outside the vehicle as a human first
          this.isPedestrian = true;
          this.playerCharacter = _buildHuman(true);
          this.playerCharacter.position.set(pStartX, 0, pStartZ);
          this.playerCharacter.rotation.y = pRot;
          this.scene.add(this.playerCharacter);
          
          this.player = this.playerCharacter; // Start as pedestrian
          this.maxSpd = 0.12; this.accel = 0.06; this.turn = 0.05; this.fric = 0.88;
          setTimeout(() => {
              toast('🚶 Click to aim! WASD to walk, F to enter/exit your vehicle!', '#3498db', 8000);
          }, 500);
        }
      }

      _makeNPC(type, col) {
        return _buildVehicle(type, col);
      }

      // 🚦 INDIAN STREET ENVIRONMENT ARCHITECTURE 🚦
      _buildScene(mode) {
        if (typeof initGTex === 'function') initGTex();
        while (this.scene && this.scene.children.length) this.scene.remove(this.scene.children[0]);
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.speedBreakers = [];
        // Phase 7: Recycle existing NPC groups into free pool before clearing scene
        if (!this._npcFree) this._npcFree = [];
        if (!this._pedFree) this._pedFree = [];
        if (this.npcs) this.npcs.forEach(n => { n.visible = false; n.children.length = 0; this._npcFree.push(n); });
        if (this.peds) this.peds.forEach(p => { p.visible = false; this._pedFree.push(p); });
        if (this.scene) this.scene.children.filter(c => c.userData?.isNPC).forEach(c => { c.visible = false; c.children.length = 0; this._npcFree.push(c); });

        const lvId = ui.cur ? ui.cur.id : 1;
        const cfg = this._getMapConfig(lvId);
        this.mapCfg = cfg;
        this.timeLimit = cfg.timeLimit || 120; // default; overridden by age-adaptive logic in _actualStart
        this.isPedestrian = (this.vehMode === 'pedestrian') || (!this.vehMode && !!cfg.isPedestrian);

        const sk = cfg.sky;
        this.scene.background = new THREE.Color(sk);
        const fogDist = cfg.fog || 200;
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const lowPerf = isMobile || this._isLowGPU;
        const fogNear = lowPerf ? Math.min(fogDist * 0.35, 50) : fogDist * 0.35;
        const fogFar = lowPerf ? Math.min(fogDist * 1.2, 250) : fogDist * 1.2;
        if (cfg.mode === 'rain' || cfg.hasRain) {
            this.scene.fog = new THREE.Fog(sk, fogNear * 0.3, fogFar * 0.5);
        } else {
            this.scene.fog = new THREE.Fog(sk, fogNear, fogFar);
        }
        // Enhanced true color lighting with better contrast and shadows
        this.scene.add(new THREE.AmbientLight(0xffffff, cfg.isNight ? 0.1 : 0.35));
        const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8a7560, cfg.isNight ? 0.1 : 0.45);
        this.scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xfff5e0, cfg.isNight ? 0.4 : 1.2);
        sun.position.set(30, 60, 20); 
        sun.castShadow = true;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -60;
        sun.shadow.camera.right = 60;
        sun.shadow.camera.top = 60;
        sun.shadow.camera.bottom = -60;
        sun.shadow.bias = -0.0005;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);
        this._sun = sun; this._sunLastPos = null;
        
        if (cfg.isNight) {
          const moon = new THREE.DirectionalLight(0x88aacc, 0.5); 
          moon.position.set(-20, 40, -30); 
          moon.castShadow = true;
          this.scene.add(moon);
        }

        const RW = cfg.isPedestrian ? 10 : 12;
        this.roadSegments = cfg.roads;
        this.driveRoute = cfg.route;
        this._buildRoadZones(RW);

        // Toon gradient map (3-step cel shading)
        if (!window._toonGrad) {
          const gc = new Uint8Array([40, 130, 255]);
          window._toonGrad = new THREE.DataTexture(gc, 3, 1, THREE.RedFormat);
          window._toonGrad.minFilter = THREE.NearestFilter;
          window._toonGrad.magFilter = THREE.NearestFilter;
          window._toonGrad.needsUpdate = true;
        }
        const tg = window._toonGrad;

        const mats = {
          grass: new THREE.MeshToonMaterial({ color: cfg.ground || 0x8B7355, gradientMap: tg }),
          road: new THREE.MeshToonMaterial({ color: 0x3d3f45, gradientMap: tg }),
          pave: new THREE.MeshToonMaterial({ color: 0x8a8a8a, gradientMap: tg }),
          yellowLine: new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
          water: new THREE.MeshToonMaterial({ color: 0x1a5a8a, transparent: true, opacity: 0.7 }),
          urban: new THREE.MeshToonMaterial({ color: 0x4a4a4f, gradientMap: tg })
        };

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(cfg.is50km ? 100000 : 2000, cfg.is50km ? 100000 : 2000), cfg.isBridge ? mats.water : (cfg.is50km ? new THREE.MeshToonMaterial({ color: 0x444444 }) : mats.urban));
        ground.rotation.x = -Math.PI / 2; this.scene.add(ground);

        // Build roads using GLB tiles
        cfg.roads.forEach(r => {
          const isV = r.type === 'v';
          const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
          const cx = isV ? r.x : (r.x1 + r.x2) / 2;
          const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

          // Logical road bed (invisible, used for raycasting/interactions)
          const roadHb = new THREE.Mesh(new THREE.PlaneGeometry(RW, len), new THREE.MeshBasicMaterial({ visible: false }));
          roadHb.rotation.set(-Math.PI / 2, 0, isV ? 0 : -Math.PI / 2);
          roadHb.position.set(cx, .01, cz);
          this.scene.add(roadHb);
          this.world.push(roadHb);

          if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['road_straight']) {
              // The GLTF model is 1000x1500 units. We scale it to match RW (12).
              const tileScale = RW / 1000;
              const tileSize = 1500 * tileScale; // 18 units long
              const numTiles = Math.max(1, Math.floor(len / tileSize));
              const startX = isV ? cx : Math.min(r.x1, r.x2) + tileSize / 2 + (len - numTiles * tileSize) / 2;
              const startZ = isV ? Math.min(r.z1, r.z2) + tileSize / 2 + (len - numTiles * tileSize) / 2 : cz;

              for (let i = 0; i < numTiles; i++) {
                  const tile = window.PRELOADED_MODELS['road_straight'].clone();
                  tile.scale.set(tileScale, tileScale, tileScale);
                  if (isV) {
                      // Model natively points along Z
                      tile.position.set(cx, 0.08, startZ + i * tileSize);
                  } else {
                      // Rotate 90 degrees around Y so length spans X
                      tile.rotation.y = Math.PI / 2;
                      tile.position.set(startX + i * tileSize, 0.08, cz);
                  }
                  this.scene.add(tile);
              }
          }

             // Sidewalks
               [-1, 1].forEach(s => {
                const swW = cfg.isPedestrian ? 6 : 4; const pb = new THREE.Mesh(isV ? new THREE.BoxGeometry(swW, .15, len) : new THREE.BoxGeometry(len, .15, swW), mats.pave);
                pb.position.set(isV ? cx + s * (RW / 2 + swW / 2) : cx, .07, isV ? cz : cz + s * (RW / 2 + swW / 2)); this.scene.add(pb); this.world.push(pb);
              });
        });

        // Procedural Gateway of India (for Mumbai theme)
        if (cfg.name && (cfg.name.includes("Marine Drive") || cfg.name.includes("Colaba") || cfg.name.includes("Gateway") || cfg.name.includes("Exam") || Math.random() < 0.2)) {
            const gof = new THREE.Group();
            const matBase = new THREE.MeshToonMaterial({color: 0xd4c4a8});
            const matWall = new THREE.MeshToonMaterial({color: 0xc4b498});
            const matTop = new THREE.MeshToonMaterial({color: 0xb4a488});
            
            const base = new THREE.Mesh(new THREE.BoxGeometry(40, 4, 25), matBase);
            base.position.y = 2; gof.add(base);
            
            const archBaseL = new THREE.Mesh(new THREE.BoxGeometry(8, 25, 20), matWall);
            archBaseL.position.set(-10, 16.5, 0); gof.add(archBaseL);
            const archBaseR = new THREE.Mesh(new THREE.BoxGeometry(8, 25, 20), matWall);
            archBaseR.position.set(10, 16.5, 0); gof.add(archBaseR);
            const archTop = new THREE.Mesh(new THREE.BoxGeometry(28, 8, 20), matTop);
            archTop.position.set(0, 33, 0); gof.add(archTop);
            
            const dome = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 16, 0, Math.PI*2, 0, Math.PI/2), matTop);
            dome.position.set(0, 37, 0); gof.add(dome);
            
            for(let sx of [-16, 16]) {
                const minBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 36, 8), matWall);
                minBase.position.set(sx, 22, 0); gof.add(minBase);
                const minDome = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8, 0, Math.PI*2, 0, Math.PI/2), matTop);
                minDome.position.set(sx, 40, 0); gof.add(minDome);
            }
            
            gof.position.set(-50, 0, -60); // Place it in the background
            gof.rotation.y = Math.PI / 4;
            this.scene.add(gof);

            // Green park ground around monument
            const parkGround = new THREE.Mesh(new THREE.CircleGeometry(35, 32), new THREE.MeshToonMaterial({ color: 0x8B7355 }));
            parkGround.rotation.x = -Math.PI / 2;
            parkGround.position.set(-50, 0.02, -60);
            this.scene.add(parkGround);
        }

        // Advanced Procedural Cityscape
        const bMats = [
          new THREE.MeshToonMaterial({ color: 0xd9cfc4, gradientMap: tg }),
          new THREE.MeshToonMaterial({ color: 0xc4b8a8, gradientMap: tg }),
          new THREE.MeshToonMaterial({ color: 0xb0a898, gradientMap: tg }),
          new THREE.MeshToonMaterial({ color: 0xd4c8b8, gradientMap: tg })
        ];
        const winMat = new THREE.MeshBasicMaterial({ color: 0x304050 });
        const instancedBldgData = {};

        const drawBldg = (bx, bz, type, rot) => {
          let bldgKeys = [];
          if (window.PRELOADED_MODELS) {
              bldgKeys = Object.keys(window.PRELOADED_MODELS).filter(k => k.startsWith('suburban_') || k.startsWith('industrial_'));
          }

          if (bldgKeys.length > 0 && type !== 'school') {
             const key = bldgKeys[Math.floor(Math.random() * bldgKeys.length)];
             if (!instancedBldgData[key]) instancedBldgData[key] = [];
              instancedBldgData[key].push({ x: bx, z: bz, r: rot, s: 10.5 });
          } else {
             const g = new THREE.Group();
             const mat = bMats[Math.floor(Math.random() * bMats.length)];
             const bh = 16 + Math.random() * 16;
             const bw = 10 + Math.random() * 10;
             const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 14), mat);
             bMesh.position.y = bh / 2;
             g.add(bMesh);
             // ── BUILDING WINDOWS (night mode) ──
             if (cfg.isNight) {
               const winMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
               const winRows = Math.floor(bh / 4);
               const winCols = Math.floor(bw / 3.5);
               for (let wr = 0; wr < winRows; wr++) {
                 for (let wc = 0; wc < winCols; wc++) {
                   if (Math.random() > 0.55) continue; // ~45% windows lit
                   const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), winMat);
                   wMesh.position.set(-bw / 2 + 2 + wc * 3.5, 3 + wr * 4, 7.01);
                   g.add(wMesh);
                   // back side
                   const wMesh2 = wMesh.clone();
                   wMesh2.position.z = -7.01;
                   wMesh2.rotation.y = Math.PI;
                   g.add(wMesh2);
                 }
               }
             }
             g.position.set(bx, 0, bz); g.rotation.y = rot;
              g.userData = { isBuilding: true, halfW: bw / 2, halfD: 7 };
              this.scene.add(g); this.obstacles.push(g);
          }
        };

        // Spawn buildings on a grid — only in build zones near roads
        const bGrid = 30;
        const bGridExtent = 600;
        for (let gx = -bGridExtent; gx <= bGridExtent; gx += bGrid) {
          for (let gz = -bGridExtent; gz <= bGridExtent; gz += bGrid) {
            if (this._isOnRoad(gx, gz)) continue;
            if (!this._isInBuildZone(gx, gz)) continue;
            // skip if too close to any intersection
            let nearInt = false;
            (cfg.ints || []).forEach(([ix, iz]) => {
              if (Math.abs(gx - ix) < 20 && Math.abs(gz - iz) < 20) nearInt = true;
            });
            if (nearInt) continue;
            const rot = [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(Math.random() * 4)];
            const rnd = Math.random();
            let type = 'normal';
            if (rnd > 0.98) type = 'police';
            else if (rnd > 0.96) type = 'hospital';
            else if (rnd > 0.94) type = 'bank';
            else if (rnd > 0.92) type = 'temple';
            else if (rnd > 0.70) type = 'shop';
            else if (rnd > 0.55) type = 'chawl';
            else if (rnd > 0.45) type = 'skyscraper';
            drawBldg(gx, gz, type, rot);
          }
        }

        // Props along sidewalk edges (benches, trees, bus stops, stalls, lamps)
        cfg.roads.forEach(r => {
          const isV = r.type === 'v';
          const cx = isV ? r.x : (r.x1 + r.x2) / 2;
          const cz = isV ? (r.z1 + r.z2) / 2 : r.z;
          const start = isV ? Math.min(r.z1, r.z2) + 15 : Math.min(r.x1, r.x2) + 15;
          const end = isV ? Math.max(r.z1, r.z2) - 15 : Math.max(r.x1, r.x2) - 15;
          for (let pos = start; pos < end; pos += 60) {
            [-1, 1].forEach(side => {
              if (Math.random() > 0.5) return;
              const lDist = RW / 2 + 1;
              const lx = isV ? cx + side * lDist : pos;
              const lz = isV ? pos : cz + side * lDist;
              const prnd = Math.random();
              if (prnd > 0.85) {
                const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.6), new THREE.MeshToonMaterial({ color: 0x4a3728 }));
                bench.position.set(lx, 0.3, lz);
                if (!isV) bench.rotation.y = Math.PI / 2;
                this.scene.add(bench); this.obstacles.push(bench);
              } else if (prnd > 0.7) {
                const treeG = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3), new THREE.MeshToonMaterial({ color: 0x5c4033 }));
                trunk.position.y = 1.5; treeG.add(trunk);
                const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 7, 7), new THREE.MeshToonMaterial({ color: 0x2ecc71 }));
                leaves.position.y = 3.5; treeG.add(leaves);
                treeG.position.set(lx, 0, lz); this.scene.add(treeG); this.obstacles.push(treeG);
              } else if (prnd > 0.65) {
                const bStop = new THREE.Group();
                const r1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 2), new THREE.MeshToonMaterial({ color: 0x2980b9 }));
                r1.position.y = 2.5; bStop.add(r1);
                const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5), new THREE.MeshToonMaterial({ color: 0xcccccc }));
                p1.position.set(-1.2, 1.25, -0.8); bStop.add(p1);
                const p2 = p1.clone(); p2.position.set(1.2, 1.25, -0.8); bStop.add(p2);
                bStop.position.set(lx, 0, lz); if (!isV) bStop.rotation.y = Math.PI / 2;
                this.scene.add(bStop); this.obstacles.push(bStop);
              } else if (prnd > 0.5) {
                const stall = new THREE.Group();
                const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1), new THREE.MeshToonMaterial({ color: 0x8B4513 }));
                table.position.y = 0.4; stall.add(table);
                const umb = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), new THREE.MeshToonMaterial({ color: Math.random() > 0.5 ? 0x3498db : 0xe74c3c }));
                umb.position.y = 2.2; stall.add(umb);
                const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                stick.position.y = 1.1; stall.add(stick);
                stall.position.set(lx, 0, lz);
                this.scene.add(stall); this.obstacles.push(stall);
              } else {
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 7), new THREE.MeshToonMaterial({ color: 0x444444 }));
                pole.position.set(lx, 3.5, lz); this.scene.add(pole);
                const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.9), new THREE.MeshBasicMaterial({ color: 0xffffee }));
                lamp.position.set(lx + (isV ? -side * 0.4 : 0), 7, lz + (!isV ? -side * 0.4 : 0));
                this.scene.add(lamp);
                // ── STREETLIGHT PointLight (night mode) ──
                if (cfg.isNight) {
                  const sl = new THREE.PointLight(0xffffee, 0.8, 35);
                  sl.position.set(lamp.position.x, 6.8, lamp.position.z);
                  this.scene.add(sl);
                }
              }
            });
          }
        });

        // Build Instanced Meshes for buildings
        if (window.PRELOADED_MODELS) {
            Object.keys(instancedBldgData).forEach(key => {
                const instances = instancedBldgData[key];
                if (instances.length === 0) return;
                
                const baseModel = window.PRELOADED_MODELS[key];
                baseModel.position.set(0,0,0);
                baseModel.rotation.set(0,0,0);
                baseModel.scale.set(1,1,1);
                baseModel.updateMatrixWorld(true);
                
                const meshes = [];
                baseModel.traverse(c => {
                    if (c.isMesh) meshes.push(c);
                });
                
                meshes.forEach(mesh => {
                    const instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, instances.length);
                    instancedMesh.castShadow = true;
                    instancedMesh.receiveShadow = true;
                    instancedMesh.frustumCulled = false;
                    
                    const dummy = new THREE.Object3D();
                    
                    instances.forEach((inst, i) => {
                        dummy.position.set(inst.x, 0, inst.z);
                        dummy.rotation.y = inst.r;
                        dummy.scale.set(inst.s, inst.s, inst.s);
                        dummy.updateMatrix();
                        
                        const finalMatrix = new THREE.Matrix4().multiplyMatrices(dummy.matrix, mesh.matrixWorld);
                        instancedMesh.setMatrixAt(i, finalMatrix);
                    });
                    instancedMesh.instanceMatrix.needsUpdate = true;
                    
                    this.scene.add(instancedMesh);
                });
                
                instances.forEach(inst => {
                   const obs = new THREE.Object3D();
                   obs.position.set(inst.x, 0, inst.z);
                   obs.userData = { isBuilding: true, halfW: inst.s * 0.6, halfD: inst.s * 0.6 };
                   this.obstacles.push(obs);
                });
            });
        }

        // ── Trees along sidewalks ──
        if (window.PRELOADED_MODELS && (window.PRELOADED_MODELS.tree_small || window.PRELOADED_MODELS.tree_large)) {
          const treeKeys = [];
          if (window.PRELOADED_MODELS.tree_small) treeKeys.push('tree_small');
          if (window.PRELOADED_MODELS.tree_large) treeKeys.push('tree_large');
          cfg.roads.forEach(r => {
            const isV = r.type === 'v';
            const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
            const cx = isV ? r.x : (r.x1 + r.x2) / 2;
            const cz = isV ? (r.z1 + r.z2) / 2 : r.z;
            const swW = cfg.isPedestrian ? 6 : 4;
            const spacing = 18 + Math.random() * 6;
            const count = Math.max(1, Math.floor(len / spacing));
            [-1, 1].forEach(side => {
              const offset = RW / 2 + swW + 2;
              for (let i = 0; i < count; i++) {
                if (Math.random() > 0.65) continue;
                const t = (i + 0.3 + Math.random() * 0.4) / count;
                let tx, tz;
                if (isV) {
                  tx = cx + side * offset;
                  tz = (r.z1 < r.z2 ? r.z1 : r.z2) + t * len;
                } else {
                  tx = (r.x1 < r.x2 ? r.x1 : r.x2) + t * len;
                  tz = cz + side * offset;
                }
                const key = treeKeys[Math.floor(Math.random() * treeKeys.length)];
                const tree = window.PRELOADED_MODELS[key].clone();
                const s = key === 'tree_large' ? 6 + Math.random() * 3 : 3.5 + Math.random() * 2;
                tree.scale.set(s, s, s);
                tree.position.set(tx, 0, tz);
                tree.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(tree);
              }
            });
          });
        }

        // ── Mobile LOD: cull/simplify distant buildings ──
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
          this.scene.children.forEach(child => {
            if (child.isMesh || child.isInstancedMesh) {
              const d = child.position ? child.position.length() : 0;
              if (d > 400) { this.scene.remove(child); }
              else if (d > 200 && child.material) { child.material.fog = true; }
            }
          });
        }

        // Player vehicle

        // Dynamic pedestrians handled in _upeds
        this._pmesh(mode, this.vehMode || cfg.veh);
        // Build garage at start and end
        if (cfg.hasGarage && cfg.route && cfg.route.length >= 2) {
          const gs = cfg.route[0];
          const ge = cfg.route[cfg.route.length - 1];
          const buildGarage = (gx, gz, label) => {
            const gg = new THREE.Group();
            // Garage body
            const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 12), new THREE.MeshToonMaterial({ color: 0x555555 }));
            walls.position.y = 2.5; gg.add(walls);
            // Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 13), new THREE.MeshToonMaterial({ color: 0x333333 }));
            roof.position.y = 5; gg.add(roof);
            // Open front (remove front face with a dark plane)
            const front = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
            front.position.set(0, 2.5, 6.01); gg.add(front);
            // Floor
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), new THREE.MeshToonMaterial({ color: 0x444444 }));
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; gg.add(floor);
            // Sign
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ color: 0xffd54a }));
            sign.position.set(0, 5.3, 6); gg.add(sign);
            gg.position.set(gx + 15, 0, gz);
            this.scene.add(gg);
          };
          buildGarage(gs.x, gs.z, 'START');
          if (ge.x !== gs.x || ge.z !== gs.z) buildGarage(ge.x, ge.z, 'FINISH');
        }
        // Checkpoints — in pedestrian mode, offset rings to sidewalk
        const swW = cfg.isPedestrian ? 6 : 4;
        const swOffset = RW / 2 + swW / 2; // distance from road center to sidewalk center
        const route = cfg.route;
        for (let ri = 0; ri < route.length; ri++) {
            const pt = route[ri];
            if (this.isPedestrian && route.length >= 2) {
                // Determine road direction from neighbors
                const prev = route[Math.max(0, ri - 1)];
                const next = route[Math.min(route.length - 1, ri + 1)];
                const dx = next.x - prev.x, dz = next.z - prev.z;
                const len = Math.sqrt(dx * dx + dz * dz);
                if (len > 0.5) {
                    const nx = -dz / len, nz = dx / len; // perpendicular
                    const swx = pt.x + nx * swOffset, swz = pt.z + nz * swOffset;
                    const rdx = pt.x - nx * swOffset, rdz = pt.z - nz * swOffset;
                    const cp = this._cp(swx, swz);
                    cp.userData.pathPts = [[swx, swz], [rdx, rdz], [swx, swz]];
                } else {
                    const cp = this._cp(pt.x - swOffset, pt.z);
                    cp.userData.pathPts = [[pt.x - swOffset, pt.z], [pt.x, pt.z], [pt.x - swOffset, pt.z]];
                }
            } else {
                this._cp(pt.x, pt.z);
            }
        }
        // Directional path arrows on road/sidewalk
        this._buildArrows();

        // Intersections with signals and zebra crossings
        (cfg.ints || []).forEach(([ix, iz]) => {
          this._sig(ix + 4.2, iz);

          if (window.PRELOADED_MODELS && (window.PRELOADED_MODELS['road_cross_path'] || window.PRELOADED_MODELS['road_cross'])) {
             const intModel = window.PRELOADED_MODELS['road_cross_path'] || window.PRELOADED_MODELS['road_cross'];
             const intTile = intModel.clone();
             const tileScale = RW / 10;
             intTile.scale.set(tileScale, tileScale, tileScale);
             intTile.position.set(ix, 0.03, iz);
             intTile.traverse(c => { if(c.isMesh) { c.receiveShadow = true; }});
             this.scene.add(intTile);
          }

          // Add a Stop sign at some intersections
          if (Math.random() < 0.5) this._addTrafficSign(ix + 6, iz + 6, 'STOP', -Math.PI / 4);

          if (this.isPedestrian) {
            const drawZb = (px, pz, rot) => {
              for (let w = -5; w <= 5; w += 1.4) {
                const zb = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                zb.rotation.x = -Math.PI / 2; zb.position.set(ix + w, .04, iz + RW / 2 + 1); this.scene.add(zb);
              }
              [-1, 1].forEach(ys => { const yb = new THREE.Mesh(new THREE.PlaneGeometry(12, .3), new THREE.MeshBasicMaterial({ color: 0xffcc00 })); yb.rotation.x = -Math.PI / 2; yb.position.set(ix, .041, iz + RW / 2 + 1 + ys * 2.2); this.scene.add(yb); })
            };
            drawZb(ix, iz + 6.5, 0); drawZb(ix, iz - 6.5, 0);
            drawZb(ix + 6.5, iz, Math.PI / 2); drawZb(ix - 6.5, iz, Math.PI / 2);
          } else {
            for (let w = -4; w <= 4; w += 1.6) {
              const zb = new THREE.Mesh(new THREE.PlaneGeometry(1, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
              zb.rotation.x = -Math.PI / 2; zb.position.set(ix + w, .04, iz + RW / 2 + 1); this.scene.add(zb);
            }
          }
        });

        // Add Signs and Speed Breakers along Roads
        cfg.roads.forEach(r => {
            if (r.type === 'h') {
                for (let x = r.x1 + 30; x < r.x2 - 30; x += 100) {
                    if (Math.random() < 0.3) {
                        const type = cfg.isSilenceZone && Math.random() < 0.5 ? 'NO_HONK' : (cfg.speedLimit ? 'SPEED_40' : 'STOP');
                        this._addTrafficSign(x, r.z + RW / 2 + 1, type, 0);
                    }
                    if (Math.random() < 0.1) {
                        this._addSpeedBreaker(x + 20, r.z, 0);
                    }
                }
            } else {
                for (let z = r.z1 + 30; z < r.z2 - 30; z += 100) {
                    if (Math.random() < 0.3) {
                        const type = cfg.isSilenceZone && Math.random() < 0.5 ? 'NO_HONK' : (cfg.speedLimit ? 'SPEED_40' : 'STOP');
                        this._addTrafficSign(r.x + RW / 2 + 1, z, type, -Math.PI / 2);
                    }
                    if (Math.random() < 0.1) {
                        this._addSpeedBreaker(r.x, z + 20, Math.PI / 2);
                    }
                }
            }
        });

        // NPC Traffic - diverse vehicle types
        const npcTypes = cfg.npcTypes || (cfg.isPedestrian ? ['car', 'car', 'auto', 'bike', 'taxi', 'bus', 'car', 'auto', 'bike', 'car', 'taxi', 'bus'] : ['car', 'car', 'auto', 'bike']);
        
        // Spawn Boats if Bridge/Water
        if (cfg.isBridge && window.PRELOADED_MODELS) {
            const boatKeys = ['ship_cargo', 'boat_speed'].filter(k => window.PRELOADED_MODELS[k]);
            if (boatKeys.length > 0) {
                for (let i = 0; i < 4; i++) {
                    const type = boatKeys[Math.floor(Math.random() * boatKeys.length)];
                    const boat = window.PRELOADED_MODELS[type].clone();
                    boat.scale.set(10, 10, 10);
                    boat.position.set((Math.random() - 0.5) * 500, -2, (Math.random() - 0.5) * 500);
                    boat.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(boat);
                }
            }
        }
        const designColors = [0xff4444, 0x1e90ff, 0x3a3a3a, 0xffd54a, 0xffffff, 0x888888, 0x27ae60, 0xf39c12];
        const allRoads = cfg.roads;
        let multipliedNpcs = [];
        const npcDensityMap = { light: 2, moderate: 4, heavy: 6 };
        const ageScale = (typeof ui !== 'undefined' && ui.getAgeScale) ? ui.getAgeScale() : 1.0;
        const npcMult = Math.round((npcDensityMap[cfg.npcDensity] || 4) * ageScale);
        for (let m = 0; m < npcMult; m++) {
          multipliedNpcs.push(...npcTypes);
        }
        multipliedNpcs.forEach((nType, i) => {
          // Phase 7: Reuse freed group or create new one
          let nv;
          if (this._npcFree.length > 0) {
            nv = this._npcFree.pop();
            nv.children.length = 0; // clear old headlight/taillight children
          } else {
            nv = new THREE.Group();
          }
          // Clone from template cache (fast — skips full build)
          const tpl = _getNpcTemplate(nType, designColors[i % designColors.length]);
          tpl.children.forEach(c => nv.add(c.clone()));
          const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
          // ── BIDIRECTIONAL: 35% of NPCs go opposing direction ──
          const isOpp = i < Math.floor(multipliedNpcs.length * 0.35);
          const laneOffset = isOpp ? -2.5 : 2.5; // opposing use left lane
          if (seg.type === 'v') {
            nv.position.set(seg.x + laneOffset, 0, seg.z1 + Math.random() * Math.abs(seg.z2 - seg.z1));
            if (isOpp) nv.rotation.y = Math.PI; // face opposite direction
          } else {
            nv.position.set(seg.x1 + Math.random() * Math.abs(seg.x2 - seg.x1), 0, seg.z + laneOffset);
            nv.rotation.y = isOpp ? -Math.PI / 2 : Math.PI / 2;
          }
          const spdMult = nType === 'truck' ? 0.6 : nType === 'bus' ? 0.7 : nType === 'cycle' ? 0.4 : nType === 'bike' ? 0.9 : nType === 'auto' ? 0.75 : 0.8;
          const nightSpdMult = cfg.isNight ? 0.6 : 1.0; // NPCs drive slower at night
           nv.userData = {
             spd: (0.3 + Math.random() * 0.22) * spdMult * nightSpdMult,
             baseSpd: (0.3 + Math.random() * 0.22) * spdMult * nightSpdMult,
             isAmb: false,
             npcType: nType,
             moveAxis: seg.type,
             isOpp,
             baseCoord: seg.type === 'v' ? seg.x : seg.z,
             dir: isOpp ? -1 : 1,    // direction multiplier
             minPos: seg.type === 'v' ? Math.min(seg.z1, seg.z2) : Math.min(seg.x1, seg.x2),
             maxPos: seg.type === 'v' ? Math.max(seg.z1, seg.z2) : Math.max(seg.x1, seg.x2),
             txX: seg.type === 'v' ? seg.x + laneOffset : undefined,
             state: 'CRUISE',
             useRoute: !!(cfg.route && cfg.route.length >= 2),
             route: cfg.route ? (isOpp ? [...cfg.route].reverse() : [...cfg.route]) : null,
             routeIdx: cfg.route ? Math.floor(Math.random() * cfg.route.length) : 0,
             laneOffset: laneOffset
           };
          // ── NPC HEADLIGHTS (night mode) ──
          if (cfg.isNight && nType !== 'cycle') {
            const hlL = new THREE.SpotLight(0xffffee, 1.2, 60, Math.PI / 6, 0.6, 1);
            hlL.position.set(0.8, 1.2, 2);
            hlL.target.position.set(0.8, 0, 12);
            nv.add(hlL); nv.add(hlL.target);
            const hlR = new THREE.SpotLight(0xffffee, 1.2, 60, Math.PI / 6, 0.6, 1);
            hlR.position.set(-0.8, 1.2, 2);
            hlR.target.position.set(-0.8, 0, 12);
            nv.add(hlR); nv.add(hlR.target);
            // Red taillights
            const tlGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
            const tlL = new THREE.Mesh(tlGeo, tlMat); tlL.position.set(0.6, 1, -2.5);
            const tlR = new THREE.Mesh(tlGeo, tlMat); tlR.position.set(-0.6, 1, -2.5);
            nv.add(tlL); nv.add(tlR);
          }
          nv.frustumCulled = true;
          nv.userData.isNPC = true; // Phase 7: mark for recycling on level change
          this.npcs.push(nv); this.scene.add(nv);
        });

        // ── LEVEL-DEFINED NPCs (from level npcs array) ──
        if (cfg.npcs) {
          cfg.npcs.forEach((npcDef, i) => {
            const nv = new THREE.Group();
            const tpl = _getNpcTemplate(npcDef.type, npcDef.color || 0x888888);
            tpl.children.forEach(c => nv.add(c.clone()));
            const spd = npcDef.speed || 0.06;
            const routePts = (npcDef.route || []).map(p => ({ x: p[0], z: p[1] }));
            const startPt = routePts[0] || { x: 0, z: 0 };
            nv.position.set(startPt.x, 0, startPt.z);
            if (routePts.length >= 2) {
              const dx = routePts[1].x - routePts[0].x;
              const dz = routePts[1].z - routePts[0].z;
              if (Math.abs(dx) > Math.abs(dz)) nv.rotation.y = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
              else nv.rotation.y = dz > 0 ? 0 : Math.PI;
            }
            nv.userData = {
              spd, baseSpd: spd, isAmb: false, npcType: npcDef.type,
              moveAxis: null, isOpp: false, baseCoord: 0, dir: 1,
              minPos: 0, maxPos: 0, txX: undefined,
              state: 'CRUISE', useRoute: routePts.length >= 2,
              route: routePts, routeIdx: 0, laneOffset: 0,
              isNPC: true, isLevelDefined: true
            };
            if (cfg.isNight && npcDef.type !== 'cycle') {
              const hlL = new THREE.SpotLight(0xffffee, 1.2, 60, Math.PI / 6, 0.6, 1);
              hlL.position.set(0.8, 1.2, 2); hlL.target.position.set(0.8, 0, 12);
              nv.add(hlL); nv.add(hlL.target);
              const hlR = new THREE.SpotLight(0xffffee, 1.2, 60, Math.PI / 6, 0.6, 1);
              hlR.position.set(-0.8, 1.2, 2); hlR.target.position.set(-0.8, 0, 12);
              nv.add(hlR); nv.add(hlR.target);
              const tlGeo = new THREE.SphereGeometry(0.15, 6, 6);
              const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
              const tlL = new THREE.Mesh(tlGeo, tlMat); tlL.position.set(0.6, 1, -2.5);
              const tlR = new THREE.Mesh(tlGeo, tlMat); tlR.position.set(-0.6, 1, -2.5);
              nv.add(tlL); nv.add(tlR);
            }
            nv.frustumCulled = true;
            this.npcs.push(nv); this.scene.add(nv);
          });
        }

        // ── FESTIVAL CROWD BURST ── Spawn a visible crowd NEAR the player
        if (cfg.crowdFestival) {
          const crowdCount = 80 + Math.floor(Math.random() * 40);
          const pPos = this.player ? this.player.position : new THREE.Vector3(0, 0, 0);
          // Find road segments closest to the player (within 150 units)
          const nearbyRoads = allRoads.filter(seg => {
            const cx = seg.type === 'v' ? seg.x : (seg.x1 + seg.x2) / 2;
            const cz = seg.type === 'v' ? (seg.z1 + seg.z2) / 2 : seg.z;
            return Math.abs(cx - pPos.x) < 200 && Math.abs(cz - pPos.z) < 200;
          });
          const pool = nearbyRoads.length > 0 ? nearbyRoads : allRoads;
          for (let c = 0; c < crowdCount; c++) {
            const seg = pool[Math.floor(Math.random() * pool.length)];
            const isV = seg.type === 'v';
            const roadLen = isV ? Math.abs(seg.z2 - seg.z1) : Math.abs(seg.x2 - seg.x1);
            // Clamp t to keep peds near the player's Z/X position
            let t = Math.random();
            if (isV) {
              const tPlayer = (pPos.z - seg.z1) / roadLen;
              t = tPlayer + (Math.random() - 0.5) * 0.6;
              t = Math.max(0, Math.min(1, t));
            } else {
              const tPlayer = (pPos.x - seg.x1) / roadLen;
              t = tPlayer + (Math.random() - 0.5) * 0.6;
              t = Math.max(0, Math.min(1, t));
            }
            // Spawn on sidewalks
            const side = Math.random() > 0.5 ? 1 : -1;
            const lDist = 9 + 1.25;
            const exiting = Math.random() > 0.4;
            const spawnDist = exiting ? lDist + 6.0 : lDist;
            const px = isV ? seg.x + side * spawnDist : (seg.x1 + t * roadLen);
            const pz = isV ? (seg.z1 + t * roadLen) : seg.z + side * spawnDist;
            // Skip if too far from player (>200 units) — would be immediately despawned
            if (Math.abs(px - pPos.x) > 200 || Math.abs(pz - pPos.z) > 200) continue;
            let ped;
            if (this._pedFree && this._pedFree.length > 0) {
              ped = this._pedFree.pop();
              ped.visible = true;
            } else {
              ped = _buildHuman();
            }
            ped.position.set(px, 0, pz);
            ped.userData = {
              t: Math.random() * 10,
              spd: 0.3 + Math.random() * 0.7,
              isV: isV,
              dir: Math.random() > 0.5 ? 1 : -1,
              startZ: isV ? pz : px,
              roadC: isV ? seg.x : seg.z,
              lLeg: ped.children.find(c => c.name === 'lLeg') || new THREE.Group(),
              rLeg: ped.children.find(c => c.name === 'rLeg') || new THREE.Group(),
              state: exiting ? 'exiting' : 'sidewalk',
              side: side,
              targetDist: lDist,
              destDist: 10 + Math.random() * 20,
              distTraveled: 0
            };
            if (exiting) {
              if (isV) ped.rotation.y = side > 0 ? -Math.PI/2 : Math.PI/2;
              else ped.rotation.y = side > 0 ? Math.PI : 0;
            } else {
              ped.rotation.y = Math.random() * Math.PI * 2;
            }
            this.peds.push(ped);
            this.scene.add(ped);
          }
        }

        // ── FESTIVAL VEHICLE SURGE ── Extra NPC traffic for festival driving levels
        if (cfg.crowdFestival && !cfg.isPedestrian) {
          const surgeCount = 20 + Math.floor(Math.random() * 10);
          const surgeTypes = ['car', 'taxi', 'auto', 'bike', 'bus', 'truck'];
          const pPos = this.player ? this.player.position : new THREE.Vector3(0, 0, 0);
          const nearbyRoads = allRoads.filter(seg => {
            const cx = seg.type === 'v' ? seg.x : (seg.x1 + seg.x2) / 2;
            const cz = seg.type === 'v' ? (seg.z1 + seg.z2) / 2 : seg.z;
            return Math.abs(cx - pPos.x) < 200 && Math.abs(cz - pPos.z) < 200;
          });
          const pool = nearbyRoads.length > 0 ? nearbyRoads : allRoads;
          for (let s = 0; s < surgeCount; s++) {
            let nv;
            if (this._npcFree.length > 0) {
              nv = this._npcFree.pop();
              nv.children.length = 0;
            } else {
              nv = new THREE.Group();
            }
            const sType = surgeTypes[Math.floor(Math.random() * surgeTypes.length)];
            const tpl = _getNpcTemplate(sType, designColors[Math.floor(Math.random() * designColors.length)]);
            tpl.children.forEach(c => nv.add(c.clone()));
            const seg = pool[Math.floor(Math.random() * pool.length)];
            const isOpp = s < Math.floor(surgeCount * 0.35);
            const laneOffset = isOpp ? -2.5 : 2.5;
            if (seg.type === 'v') {
              const roadLen = Math.abs(seg.z2 - seg.z1);
              let t = Math.random();
              const tPlayer = (pPos.z - seg.z1) / roadLen;
              t = tPlayer + (Math.random() - 0.5) * 0.6;
              t = Math.max(0, Math.min(1, t));
              nv.position.set(seg.x + laneOffset, 0, seg.z1 + t * roadLen);
              if (isOpp) nv.rotation.y = Math.PI;
            } else {
              const roadLen = Math.abs(seg.x2 - seg.x1);
              let t = Math.random();
              const tPlayer = (pPos.x - seg.x1) / roadLen;
              t = tPlayer + (Math.random() - 0.5) * 0.6;
              t = Math.max(0, Math.min(1, t));
              nv.position.set(seg.x1 + t * roadLen, 0, seg.z + laneOffset);
              nv.rotation.y = isOpp ? -Math.PI / 2 : Math.PI / 2;
            }
            const spdMult = sType === 'truck' ? 0.6 : sType === 'bus' ? 0.7 : sType === 'cycle' ? 0.4 : sType === 'bike' ? 0.9 : sType === 'auto' ? 0.75 : 0.8;
            const nightSpdMult = cfg.isNight ? 0.6 : 1.0;
            nv.userData = {
              spd: (0.3 + Math.random() * 0.22) * spdMult * nightSpdMult,
              baseSpd: (0.3 + Math.random() * 0.22) * spdMult * nightSpdMult,
              isAmb: false, npcType: sType,
              moveAxis: seg.type, isOpp,
              baseCoord: seg.type === 'v' ? seg.x : seg.z,
              dir: isOpp ? -1 : 1,
              minPos: seg.type === 'v' ? Math.min(seg.z1, seg.z2) : Math.min(seg.x1, seg.x2),
              maxPos: seg.type === 'v' ? Math.max(seg.z1, seg.z2) : Math.max(seg.x1, seg.x2),
              txX: seg.type === 'v' ? seg.x + laneOffset : undefined,
              state: 'CRUISE',
              useRoute: !!(cfg.route && cfg.route.length >= 2),
              route: cfg.route ? (isOpp ? [...cfg.route].reverse() : [...cfg.route]) : null,
              routeIdx: cfg.route ? Math.floor(Math.random() * cfg.route.length) : 0,
              laneOffset: laneOffset
            };
            if (cfg.isNight && sType !== 'cycle') {
              const hlL = new THREE.SpotLight(0xffffee, 1.2, 60, Math.PI / 6, 0.6, 1);
              hlL.position.set(0.8, 1.2, 2); hlL.target.position.set(0.8, 0, 12);
              nv.add(hlL); nv.add(hlL.target);
              const hlR = new THREE.SpotLight(0xffffee, 1.2, 60, Math.PI / 6, 0.6, 1);
              hlR.position.set(-0.8, 1.2, 2); hlR.target.position.set(-0.8, 0, 12);
              nv.add(hlR); nv.add(hlR.target);
              const tlGeo = new THREE.SphereGeometry(0.15, 6, 6);
              const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
              const tlL = new THREE.Mesh(tlGeo, tlMat); tlL.position.set(0.6, 1, -2.5);
              const tlR = new THREE.Mesh(tlGeo, tlMat); tlR.position.set(-0.6, 1, -2.5);
              nv.add(tlL); nv.add(tlR);
            }
            nv.frustumCulled = true;
            nv.userData.isNPC = true;
            this.npcs.push(nv); this.scene.add(nv);
          }
        }

        // ── STATIC PARKED CARS ──
        for (let i = 0; i < allRoads.length * 3; i++) {
          const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
          const pType = ['car', 'taxi', 'truck'][Math.floor(Math.random() * 3)];
          const pc = _getNpcTemplate(pType, designColors[Math.floor(Math.random() * designColors.length)]).clone();
          const isLeft = Math.random() > 0.5;
          const parkOffset = isLeft ? -4.5 : 4.5;
          if (seg.type === 'v') {
            pc.position.set(seg.x + parkOffset, 0, seg.z1 + Math.random() * Math.abs(seg.z2 - seg.z1));
            pc.rotation.y = isLeft ? Math.PI : 0;
          } else {
            pc.position.set(seg.x1 + Math.random() * Math.abs(seg.x2 - seg.x1), 0, seg.z + parkOffset);
            pc.rotation.y = isLeft ? -Math.PI / 2 : Math.PI / 2;
          }
          this.scene.add(pc);
          // ── PARKED CAR TAILLIGHTS (night mode) ──
          if (cfg.isNight) {
            const tlGeo = new THREE.SphereGeometry(0.12, 6, 6);
            const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
            const tlL = new THREE.Mesh(tlGeo, tlMat); tlL.position.set(0.5, 0.8, -2);
            const tlR = new THREE.Mesh(tlGeo, tlMat); tlR.position.set(-0.5, 0.8, -2);
            pc.add(tlL); pc.add(tlR);
          }
          if (this.obstacles) this.obstacles.push(pc);
        }

        // Puddles array — shared by rain levels AND level 5
        this.puddles = [];

        // Special features per level
        if (cfg.hasRain) {
          this._create3DRain();
          // Spawn random puddles on the roads (must be pushed to this.puddles for collision)
          const puddleGeo = new THREE.PlaneGeometry(10, 8);
          const puddleMat = new THREE.MeshBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.6 });
          for (let i = 0; i < 30; i++) {
            const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
            const px = seg.type === 'v' ? seg.x : seg.x1 + Math.random() * (seg.x2 - seg.x1);
            const pz = seg.type === 'v' ? seg.z1 + Math.random() * (seg.z2 - seg.z1) : seg.z;
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.rotation.x = -Math.PI / 2;
            p.position.set(px, 0.05, pz);
            this.scene.add(p);
            this.puddles.push(p);
          }
          for (let i = 0; i < 15; i++) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(1.4 + Math.random(), 1.5 + Math.random(), .08, 12), new THREE.MeshToonMaterial({ color: 0x0c101a, transparent: true, opacity: 0.6 }));
            p.position.set((Math.random() - .5) * 120, 0.016, (Math.random() - .5) * 160); this.scene.add(p); this.spc.push(p); p.userData = { isPH: true };
          }
        }
        
        // Puddles for level 5 (Rain & Slippery Roads)
        if (cfg.id === 5) {
            for (let i = 0; i < 10; i++) {
                const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
                const isV = seg.type === 'v';
                const p = new THREE.Mesh(
                    new THREE.CylinderGeometry(2, 2, 0.05, 16), 
                    new THREE.MeshBasicMaterial({ color: 0x3498db, transparent: true, opacity: 0.6 })
                );
                const minP = isV ? Math.min(seg.z1, seg.z2) : Math.min(seg.x1, seg.x2);
                const maxP = isV ? Math.max(seg.z1, seg.z2) : Math.max(seg.x1, seg.x2);
                const pos = minP + Math.random() * (maxP - minP);
                const offset = (Math.random() - 0.5) * 6;
                p.position.set(isV ? seg.x + offset : pos, 0.03, isV ? pos : seg.z + offset);
                this.scene.add(p);
                this.puddles.push(p);
            }
        }
        
        if (cfg.hasEmergency || cfg.id === 8) {
          if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['ambulance']) {
              this.ms.amb = window.PRELOADED_MODELS['ambulance'].clone();
              this.ms.amb.scale.set(1.5, 1.5, 1.5);
              this.ms.amb.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
          } else {
              this.ms.amb = _getNpcTemplate('car', 0xffffff).clone();
          }
          this.ms.amb.position.set(0, 0.5, -230);
          this.ms.amb.userData = { spd: 1.2, isAmb: true, npcType: 'ambulance', moveAxis: 'v' };
          const flash = new THREE.PointLight(0xff0000, 2, 8); flash.position.y = 1.5; this.ms.amb.add(flash);
          const flash2 = new THREE.PointLight(0x0000ff, 2, 8); flash2.position.set(.5, 1.5, 0); this.ms.amb.add(flash2);
          this.npcs.push(this.ms.amb); this.scene.add(this.ms.amb);
        }
        
        // Train / Metro Logic
        this.trains = [];
        if (cfg.id === 12 && window.PRELOADED_MODELS && window.PRELOADED_MODELS['train']) {
            // Railway crossing level
            const train = window.PRELOADED_MODELS['train'].clone();
            train.scale.set(6, 6, 6);
            train.position.set(100, 0, 50); // crosses Z at 50
            train.rotation.y = -Math.PI / 2;
            this.scene.add(train);
            this.trains.push({ mesh: train, vx: -0.8 });
            
            // Add a barrier
            const barrier = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            barrier.position.set(0, 1, 40);
            this.scene.add(barrier);
            this.obstacles.push(barrier);
        }
        if (cfg.id === 9 && window.PRELOADED_MODELS && window.PRELOADED_MODELS['metro']) {
            // Metro station level
            const metro = window.PRELOADED_MODELS['metro'].clone();
            metro.scale.set(6, 6, 6);
            metro.position.set(100, 15, 0); // elevated
            metro.rotation.y = -Math.PI / 2;
            this.scene.add(metro);
            this.trains.push({ mesh: metro, vx: -0.6 });
        }
        
        // Bus Stop Logic
        if (cfg.id === 7) {
            const busStop = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            busStop.position.set(6, 1.5, 30);
            this.scene.add(busStop);
            this.obstacles.push(busStop);
            
            const bus = _getNpcTemplate('bus', 0xffffff).clone();
            bus.position.set(4, 0, 30);
            bus.userData = { spd: 0, npcType: 'bus', moveAxis: 'v', isStopped: true };
            this.npcs.push(bus);
            this.scene.add(bus);
            
            // Pedestrians waiting
            for (let i = 0; i < 3; i++) {
                const ped = _buildHuman();
                ped.position.set(7 + i, 0, 30 + Math.random()*2);
                ped.userData.vx = 0; ped.userData.vz = 0;
            }
        }
        
        // Custom Monuments and Sneh Asha
        if (cfg.id === 1) {
            // Sneh Asha Building
            const saGeo = new THREE.BoxGeometry(10, 40, 10);
            const saMat = new THREE.MeshToonMaterial({ color: 0xe0e0e0 });
            const saBldg = new THREE.Mesh(saGeo, saMat);
            saBldg.position.set(-30, 20, 0);
            this.scene.add(saBldg);
            this.obstacles.push(saBldg);
            
            new THREE.TextureLoader().load('sneh-logo.webp', tex => {
                const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
                logoMesh.position.set(-24.9, 30, 0);
                logoMesh.rotation.y = Math.PI / 2;
                this.scene.add(logoMesh);
            });
            
            // Gateway of India (Detailed representation for Mumbai)
            const gwGroup = new THREE.Group();
            const stoneMat = new THREE.MeshToonMaterial({ color: 0xdfd3c3 }); // Basalt color
            
            // Main Pillars
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 8), stoneMat); p1.position.set(-10, 9, 0); gwGroup.add(p1);
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 8), stoneMat); p2.position.set(10, 9, 0); gwGroup.add(p2);
            
            // Center Arch Block (top of the arch)
            const archTop = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), stoneMat); archTop.position.set(0, 15, 0); gwGroup.add(archTop);
            
            // Side sections (smaller arches placeholder)
            const sp1 = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), stoneMat); sp1.position.set(-17, 6, 0); gwGroup.add(sp1);
            const sp2 = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), stoneMat); sp2.position.set(17, 6, 0); gwGroup.add(sp2);
            
            // Top Dome / Turrets
            const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), stoneMat); t1.position.set(-10, 20, 0); gwGroup.add(t1);
            const t2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), stoneMat); t2.position.set(10, 20, 0); gwGroup.add(t2);
            const t3 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 8), stoneMat); t3.position.set(-17, 13.5, 0); gwGroup.add(t3);
            const t4 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 8), stoneMat); t4.position.set(17, 13.5, 0); gwGroup.add(t4);
            
            gwGroup.position.set(0, 0, -80);
            this.scene.add(gwGroup);
            this.obstacles.push(p1, p2, sp1, sp2);
        }
        
        // Gully / Narrow Road Elements
        if (cfg.id === 10) {
            for (let i=0; i<15; i++) {
                const cart = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 3), new THREE.MeshToonMaterial({ color: 0x8b4513 }));
                cart.position.set((Math.random() > 0.5 ? 1 : -1) * (2 + Math.random()*2), 0.75, (Math.random() - 0.5) * 150);
                this.scene.add(cart);
                this.obstacles.push(cart);
            }
        }
        
        // ── THEME-SPECIFIC ELEMENTS ──
        if (cfg.themeType === 'pedestrian_courtesy') {
            // Spawn extra pedestrians crossing
            for (let i = 0; i < 8; i++) {
                const ped = _buildHuman();
                ped.position.set((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20);
                const vx = (Math.random() > 0.5 ? 1 : -1) * 0.05;
                ped.userData = {
                    t: Math.random() * 10, spd: Math.abs(vx),
                    isV: true, dir: Math.sign(vx), startZ: ped.position.z, roadC: ped.position.x,
                    state: 'crossing', side: 1, targetDist: 20
                };
                this.scene.add(ped);
                this.peds.push(ped);
            }
        } else if (cfg.themeType === 'respectful_parking') {
            // Spawn haphazard parked cars
            for (let i = 0; i < 15; i++) {
                const pc = _getNpcTemplate('car', 0x999999).clone();
                pc.position.set((Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 4), 0, (Math.random() - 0.5) * 150);
                pc.rotation.y = (Math.random() - 0.5) * 0.5;
                pc.userData.spd = 0; pc.userData.isStopped = true; pc.userData.isParked = true;
                this.npcs.push(pc); this.scene.add(pc);
            }
        } else if (cfg.themeType === 'ambulance_priority') {
            if (!this.ms.amb) {
              this.ms.amb = _getNpcTemplate('car', 0xffffff).clone();
                this.ms.amb.userData = { spd: 1.2, isAmb: true, npcType: 'ambulance', moveAxis: 'v' };
                const flash = new THREE.PointLight(0xff0000, 2, 8); flash.position.y = 1.5; this.ms.amb.add(flash);
                const flash2 = new THREE.PointLight(0x0000ff, 2, 8); flash2.position.set(.5, 1.5, 0); this.ms.amb.add(flash2);
                this.npcs.push(this.ms.amb); this.scene.add(this.ms.amb);
            }
            this.ms.amb.position.set(2, 0.5, 30); // Right behind player
        } else if (cfg.themeType === 'puddle_etiquette') {
            const puddleGeo = new THREE.PlaneGeometry(6, 6);
            const puddleMat = new THREE.MeshBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.6 });
            for (let i = 0; i < 5; i++) {
                const p = new THREE.Mesh(puddleGeo, puddleMat);
                p.rotation.x = -Math.PI / 2;
                p.position.set((Math.random() > 0.5 ? 1 : -1) * 3, 0.05, -10 - i * 20);
                this.scene.add(p);
                this.puddles = this.puddles || []; this.puddles.push(p);
                
                const ped = _buildHuman();
                ped.position.set(p.position.x + (p.position.x > 0 ? 3 : -3), 0, p.position.z);
                ped.userData = {
                    t: Math.random() * 10, spd: 0,
                    isV: true, dir: 1, startZ: ped.position.z, roadC: ped.position.x,
                    state: 'idle', side: 1, targetDist: 0
                };
                this.scene.add(ped);
                this.peds.push(ped);
            }
        } else if (cfg.themeType === 'no_honking') {
            cfg.isSilenceZone = true;
            for (let i = 0; i < 6; i++) {
                const block = _getNpcTemplate('car', Math.random() * 0xffffff).clone();
                block.position.set(0, 0, -20 - i * 15);
                block.userData.spd = 0; block.userData.isStopped = true;
                this.npcs.push(block); this.scene.add(block);
            }
            // Hospital sign
            const hGeo = new THREE.BoxGeometry(10, 10, 10);
            const hMat = new THREE.MeshToonMaterial({ color: 0xffffff });
            const hospital = new THREE.Mesh(hGeo, hMat);
            hospital.position.set(-15, 5, -30);
            this.scene.add(hospital); this.obstacles.push(hospital);
        }
        
        // ── MOUNTAIN BACKDROP ──
        if (cfg.hasMountain) {
          const mM = new THREE.MeshToonMaterial({ color: 0x4a6040 });
          const rM = new THREE.MeshToonMaterial({ color: 0x7a6d5c });
          [
            { x: 200, z: -300, h: 80, w: 160 },
            { x: -180, z: -200, h: 95, w: 140 },
            { x: 160, z: -500, h: 70, w: 130 },
            { x: -200, z: -450, h: 85, w: 150 }
          ].forEach(({ x, z, h, w }) => {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(w / 2, h, 7), mM);
            cone.position.set(x, h / 2, z);
            this.scene.add(cone);
            const rock = new THREE.Mesh(new THREE.ConeGeometry(w / 4, h * 0.6, 5), rM);
            rock.position.set(x + 15, h * 0.3, z + 20);
            this.scene.add(rock);
          });
          // Guardrails along main road for ghat feel
          for (let rz = -350; rz <= 100; rz += 8) {
            const grL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 3), new THREE.MeshToonMaterial({ color: 0xcccccc }));
            grL.position.set(8, 0.35, rz); this.scene.add(grL);
            const grR = grL.clone(); grR.position.x = -8; this.scene.add(grR);
          }
          // Mist/fog enhancement for mountain feel
          this.scene.fog = new THREE.Fog(this.scene.background, 60, 380);
        }
        if (cfg.hasRailway) {
          (cfg.railZ || []).forEach(rz => {
            // Rail tracks
            for (let t = -25; t < 25; t += 2) {
              const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, .05, 1.5), new THREE.MeshToonMaterial({ color: 0x888888 }));
              rail.position.set(t, .04, rz); this.scene.add(rail);
            }
            // Crossbar ties
            for (let t = -25; t < 25; t += 4) {
              const tie = new THREE.Mesh(new THREE.BoxGeometry(3, .08, .3), new THREE.MeshToonMaterial({ color: 0x4a3728 }));
              tie.position.set(t, .03, rz); this.scene.add(tie);
            }
            // Gate poles
            [-8, 8].forEach(gx => {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3, 8), new THREE.MeshToonMaterial({ color: 0xcc0000 }));
              pole.position.set(gx, 1.5, rz + 7); this.scene.add(pole);
              const arm = new THREE.Mesh(new THREE.BoxGeometry(6, .12, .12), new THREE.MeshToonMaterial({ color: 0xcc0000 }));
              arm.position.set(gx, 3, rz + 7); this.scene.add(arm);
            });
          });
        }
        if (cfg.hasMetro) {
          cfg.roads.forEach(r => {
            const isV = r.type === 'v';
            const start = isV ? Math.min(r.z1, r.z2) : Math.min(r.x1, r.x2);
            const end = isV ? Math.max(r.z1, r.z2) : Math.max(r.x1, r.x2);
            const len = Math.abs(end - start);
            const cx = isV ? r.x : (r.x1 + r.x2) / 2;
            const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

            const track = new THREE.Mesh(new THREE.BoxGeometry(isV ? 6 : len, 1, isV ? len : 6), new THREE.MeshToonMaterial({ color: 0x555555 }));
            track.position.set(cx, 12, cz);
            this.scene.add(track);

            for (let p = start + 10; p < end; p += 40) {
              const px = isV ? cx : p;
              const pz = isV ? p : cz;
              const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 12, 12), new THREE.MeshToonMaterial({ color: 0x999999 }));
              pillar.position.set(px, 6, pz);
              this.scene.add(pillar); this.obstacles.push(pillar);
            }

            const train = new THREE.Mesh(new THREE.BoxGeometry(isV ? 4.5 : 30, 3, isV ? 30 : 4.5), new THREE.MeshToonMaterial({ color: 0xdddddd }));
            train.position.set(cx, 14, cz);
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(isV ? 4.6 : 30.1, 0.4, isV ? 30.1 : 4.6), new THREE.MeshToonMaterial({ color: 0x3498db }));
            stripe.position.set(cx, 14, cz);
            this.scene.add(train); this.scene.add(stripe);
          });
        }
        if (cfg.isBridge) {
          // ── TOLL BOOTH on the bridge ──
          const tollM = new THREE.MeshToonMaterial({ color: 0x888888 });
          const tollY = new THREE.MeshToonMaterial({ color: 0xffcc00 });
          // 3 toll pillars
          [-8, 0, 8].forEach(ox => {
            const tp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1), tollM);
            tp.position.set(ox, 2, -120); this.scene.add(tp);
            const tr = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2), tollY);
            tr.position.set(ox, 4.2, -120); this.scene.add(tr);
          });
          const beam = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 0.5), tollM);
          beam.position.set(0, 4, -120); this.scene.add(beam);
          const sign = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 0.2), new THREE.MeshToonMaterial({ color: 0x003399 }));
          sign.position.set(0, 5.5, -120); this.scene.add(sign);
          // Bridge railings
          [-7.5, 7.5].forEach(rx => {
            for (let z = -600; z < 100; z += 8) {
              const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.5, 6), new THREE.MeshToonMaterial({ color: 0xcccccc }));
              post.position.set(rx, .75, z); this.scene.add(post);
            }
            const cable = new THREE.Mesh(new THREE.BoxGeometry(.04, 700, .04), new THREE.MeshToonMaterial({ color: 0xdddddd }));
            cable.position.set(rx, 1.5, -250); cable.rotation.x = Math.PI / 2; this.scene.add(cable);
          });
          // Bridge pylons
          [-200, 0, -400].forEach(pz => {
            const pylon = new THREE.Mesh(new THREE.CylinderGeometry(.8, .6, 25, 8), new THREE.MeshToonMaterial({ color: 0xcccccc }));
            pylon.position.set(0, 12, pz); this.scene.add(pylon);
          });
        }

        // Mumbai Landmarks (Spawned randomly in non-pedestrian levels to add flavor)
        if (!cfg.isPedestrian && !cfg.isBridge) {
          const buildLandmark = (type, bx, bz) => {
            const lg = new THREE.Group();
            if (type === 'gateway') {
              const m1 = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 12), new THREE.MeshToonMaterial({ color: 0xd4a373 }));
              m1.position.y = 9; lg.add(m1);
              const m2 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 18, 16), new THREE.MeshBasicMaterial({ color: 0x111111 }));
              m2.position.set(0, 9, 1); m2.rotation.x = Math.PI / 2; lg.add(m2); // Arch hole
              const m3 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 8), new THREE.MeshToonMaterial({ color: 0xd4a373 }));
              m3.position.set(-8, 21, 0); lg.add(m3);
              const m4 = m3.clone(); m4.position.set(8, 21, 0); lg.add(m4);
            } else if (type === 'bse') {
              const m1 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 45, 16), new THREE.MeshToonMaterial({ color: 0xcccccc }));
              m1.position.y = 22.5; lg.add(m1);
              const m2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 5, 16), new THREE.MeshToonMaterial({ color: 0x444444 }));
              m2.position.y = 47.5; lg.add(m2);
            } else if (type === 'antilia') {
              for (let i = 0; i < 8; i++) {
                const w = 12 + Math.random() * 8;
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5, w), new THREE.MeshToonMaterial({ color: (i % 2 === 0) ? 0x88aa88 : 0xaaaaaa }));
                m.position.set(Math.random() * 4 - 2, 2.5 + i * 6, Math.random() * 4 - 2);
                lg.add(m);
              }
            }
            lg.position.set(bx, 0, bz);
            this.scene.add(lg);
          };
          // Pick 3 random roads and offset them heavily to place landmarks
          const types = ['gateway', 'bse', 'antilia'];
          for (let i = 0; i < 3; i++) {
            const r = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
            if (r.type === 'v') buildLandmark(types[i], r.x + 35, (r.z1 + r.z2) / 2);
            else buildLandmark(types[i], (r.x1 + r.x2) / 2, r.z + 35);
          }
        }

        if (cfg.hasSchool) {
          // School building
          const school = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 12), new THREE.MeshToonMaterial({ color: 0xd4ac0d }));
          school.position.set(-40, 4, -80); this.scene.add(school); this.obstacles.push(school);
          // School sign
          const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, .1), new THREE.MeshToonMaterial({ color: 0xffff00 }));
          sign.position.set(0, 2.5, -60); this.scene.add(sign);
        }
        if (cfg.hasOcean) {
          const ocean = new THREE.Mesh(new THREE.PlaneGeometry(600, 1200), mats.water);
          ocean.rotation.x = -Math.PI / 2; ocean.position.set(350, .01, -150); this.scene.add(ocean);
        }
        if (cfg.hasBeach) {
          const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 600), new THREE.MeshToonMaterial({ color: 0xc2b280 }));
          sand.rotation.x = -Math.PI / 2; sand.position.set(80, .005, -100); this.scene.add(sand);
          const ocean = new THREE.Mesh(new THREE.PlaneGeometry(400, 800), mats.water);
          ocean.rotation.x = -Math.PI / 2; ocean.position.set(250, .01, -100); this.scene.add(ocean);
        }
        if (cfg.hasSilentZone) {
          // Hospital building
          const hosp = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 15), new THREE.MeshToonMaterial({ color: 0xeeeeee }));
          hosp.position.set(25, 6, -20); hosp.userData = { isBuilding: true, halfW: 10, halfD: 7.5 };
          this.scene.add(hosp); this.obstacles.push(hosp);
          const cross = new THREE.Mesh(new THREE.BoxGeometry(2, 2, .1), new THREE.MeshToonMaterial({ color: 0xff0000 }));
          cross.position.set(25, 10, 7.6); this.scene.add(cross);
          // Silent zone markers
          [cfg.silentZ1 || 0, cfg.silentZ2 || 0].forEach(sz => {
            const marker = new THREE.Mesh(new THREE.BoxGeometry(1, 2, .1), new THREE.MeshToonMaterial({ color: 0xff6600 }));
            marker.position.set(-7, 1, sz); this.scene.add(marker);
            const m2 = marker.clone(); m2.position.x = 7; this.scene.add(m2);
          });
        }

        // Bollards and barricades
        const bCount = cfg.isPedestrian ? 2 : 6;
        for (let i = 0; i < bCount; i++) {
          const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
          const bx = seg.type === 'v' ? seg.x + (Math.random() > .5 ? 10 : -10) : seg.x1 + Math.random() * (seg.x2 - seg.x1);
          const bz = seg.type === 'v' ? seg.z1 + Math.random() * (seg.z2 - seg.z1) : seg.z + (Math.random() > .5 ? 10 : -10);
          // Big red-white striped barricade
          const barG = new THREE.Group();
          const bp1 = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.5, 8), new THREE.MeshToonMaterial({ color: 0xff3300 }));
          bp1.position.set(-0.5, 0.75, 0); barG.add(bp1);
          const bp2 = bp1.clone(); bp2.position.set(0.5, 0.75, 0); barG.add(bp2);
          const bBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.15), new THREE.MeshToonMaterial({ color: 0xffffff }));
          bBar.position.set(0, 1.3, 0); barG.add(bBar);
          const rSt = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.16), new THREE.MeshToonMaterial({ color: 0xff0000 }));
          rSt.position.set(0, 1.3, 0); barG.add(rSt);
          const bBar2 = bBar.clone(); bBar2.position.set(0, 0.9, 0); barG.add(bBar2);
          barG.position.set(bx, 0, bz);
          barG.userData = { halfW: 0.7, halfD: 0.15 };
          this.scene.add(barG); this.obstacles.push(barG);
        }
        // Remove barricades/parked vehicles within 15 units of player start (keep buildings)
        const pStart = cfg.route && cfg.route[0] ? cfg.route[0] : { x: 0, z: -200 };
        this.obstacles = this.obstacles.filter(ob => {
          const dx = ob.position.x - pStart.x;
          const dz = ob.position.z - (pStart.z - 20);
          if (Math.sqrt(dx * dx + dz * dz) < 15) {
            // Only remove non-building obstacles (barricades, parked vehicles)
            if (!ob.userData.isBuilding) { this.scene.remove(ob); return false; }
          }
          return true;
        });
        // Parked vehicles
        if (!cfg.isPedestrian) {
          for (let i = 0; i < 6; i++) {
            const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
            const types = ['car', 'auto', 'bike'];
            const pc = _getNpcTemplate(types[i % 3], Math.random() * 0xffffff).clone();
            if (seg.type === 'v') pc.position.set(seg.x + (Math.random() > .5 ? 5.5 : -5.5), 0, seg.z1 + Math.random() * (seg.z2 - seg.z1));
            else pc.position.set(seg.x1 + Math.random() * (seg.x2 - seg.x1), 0, seg.z + (Math.random() > .5 ? 5.5 : -5.5));
            pc.userData = { isParked: true, halfW: 2.5, halfD: 1.5 };
            this.scene.add(pc); this.obstacles.push(pc);
          }
        }
      }

      _makeTower(x, z, w = 10, d = 10) {
        if (!window.PRELOADED_MODELS) return;
        const bTypes = ['suburban_a', 'suburban_b', 'suburban_c', 'suburban_d', 'suburban_e', 'suburban_f', 'industrial_a', 'industrial_b', 'industrial_c', 'industrial_d', 'industrial_e', 'industrial_f'];
        const type = bTypes[Math.floor(Math.random() * bTypes.length)];
        const template = window.PRELOADED_MODELS[type];
        if (!template) return;
        
        const b = template.clone();
        
        // Scale the model to fit roughly in the block. Kenney buildings are usually 1x1 unit.
        // Assuming block width w=10, depth d=10, scale up:
        const s = (w / 1.5) * (0.8 + Math.random() * 0.4) * 2.0;
        b.scale.set(s, s + Math.random()*s, s);
        b.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
        
        // position x, 0, z since pivot is at bottom
        b.position.set(x, 0, z);
        this.scene.add(b);
        this.world.push(b);
      }
      _create3DRain() {
        const count = 1200; const geo = new THREE.BufferGeometry(); const pos = [];
        for (let i = 0; i < count; i++)pos.push((Math.random() - .5) * 300, Math.random() * 30, (Math.random() - .5) * 500);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9cc9ff, size: 0.06, transparent: true, opacity: 0.55 }));
        this.scene.add(this.rain);
      }
      _spawnSplash(x, y, z) {
        const count = 12;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];
        for (let i = 0; i < count; i++) {
          pos[i * 3] = x; pos[i * 3 + 1] = y + 0.2; pos[i * 3 + 2] = z;
          vel.push((Math.random() - 0.5) * 4, 3 + Math.random() * 4, (Math.random() - 0.5) * 4);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9cc9ff, size: 0.15, transparent: true, opacity: 0.8 }));
        this.scene.add(pts);
        let elapsed = 0;
        const animSplash = () => {
          elapsed += 0.016;
          if (elapsed > 0.6) { this.scene.remove(pts); geo.dispose(); return; }
          const p = pts.geometry.attributes.position.array;
          for (let i = 0; i < count; i++) {
            p[i * 3] += vel[i * 3] * 0.016;
            p[i * 3 + 1] += vel[i * 3 + 1] * 0.016;
            p[i * 3 + 2] += vel[i * 3 + 2] * 0.016;
            vel[i * 3 + 1] -= 12 * 0.016; // gravity
          }
          pts.geometry.attributes.position.needsUpdate = true;
          pts.material.opacity = 0.8 * (1 - elapsed / 0.6);
          requestAnimationFrame(animSplash);
        };
        animSplash();
      }
      _spawnDust(x, y, z) {
        const count = 8;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];
        for (let i = 0; i < count; i++) {
          pos[i * 3] = x + (Math.random() - 0.5) * 1.5; pos[i * 3 + 1] = y + 0.1; pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.5;
          vel.push((Math.random() - 0.5) * 1.5, 1 + Math.random() * 2, (Math.random() - 0.5) * 1.5);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const dustColor = 0xc2b280; // dust tan color
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: dustColor, size: 0.2, transparent: true, opacity: 0.7 }));
        this.scene.add(pts);
        let elapsed = 0;
        const animDust = () => {
          elapsed += 0.016;
          if (elapsed > 0.5) { this.scene.remove(pts); geo.dispose(); return; }
          const p = pts.geometry.attributes.position.array;
          for (let i = 0; i < count; i++) {
            p[i * 3] += vel[i * 3] * 0.016;
            p[i * 3 + 1] += vel[i * 3 + 1] * 0.016;
            p[i * 3 + 2] += vel[i * 3 + 2] * 0.016;
            vel[i * 3 + 1] -= 4 * 0.016; // gravity
          }
          pts.geometry.attributes.position.needsUpdate = true;
          pts.material.opacity = 0.7 * (1 - elapsed / 0.5);
          requestAnimationFrame(animDust);
        };
        animDust();
      }

      _cp(x, z, col = 0x00c851) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, .16, 10, 20), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, .8, z); ring.userData.pathT = 0; this.scene.add(ring); this.cps.push(ring); return ring;
      }
      _sig(x, z) {
        const g = new THREE.Group();
        // Main pole - taller Indian-style
        const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 4.5, 8), new THREE.MeshToonMaterial({ color: 0x666666 }));
        p.position.y = 2.25;
        // Vertical signal head (Indian 3-aspect)
        const bx = new THREE.Mesh(new THREE.BoxGeometry(.55, 1.5, .35), new THREE.MeshToonMaterial({ color: 0x1a1a1a }));
        bx.position.y = 4.3;
        // Visor hoods for each aspect
        const mkHood = (y) => {
          const hood = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .15, 8, 1, true), new THREE.MeshToonMaterial({ color: 0x222222, side: THREE.DoubleSide }));
          hood.position.set(0, y, .22); hood.rotation.x = Math.PI / 2;
          return hood;
        };
        const mk = (y, n) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.16), new THREE.MeshBasicMaterial({ color: 0x111111 })); s.position.set(0, y, .18); s.name = n; return s; };
        // Pedestrian signal pole
        const ps_pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.8, 8), new THREE.MeshToonMaterial({ color: 0x666666 }));
        ps_pole.position.set(0, 0.9, 2.2);
        const ps_box = new THREE.Mesh(new THREE.BoxGeometry(.3, .6, .2), new THREE.MeshToonMaterial({ color: 0x1a1a1a }));
        ps_box.position.set(0, 1.8, 2.2);
        const mks = (y, n) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.09), new THREE.MeshBasicMaterial({ color: 0x111111 })); s.position.set(0, y, 2.31); s.name = n; return s; };
        g.add(ps_pole, ps_box, mks(1.95, 'p_red'), mks(1.65, 'p_green'));
        g.add(p, bx, mkHood(4.6), mkHood(4.3), mkHood(4.0), mk(4.6, 'red'), mk(4.3, 'yellow'), mk(4.0, 'green'));
        g.position.set(x, 0, z); this.scene.add(g); this.sigs.push(g);
        g.userData = { st: 'red', t: Math.random() * 6, rd: 4, gd: 4, yd: 1.5 }; return g;
      }
      
      _addTrafficSign(x, z, type, rotY = 0) {
          const g = new THREE.Group();
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 8), new THREE.MeshToonMaterial({ color: 0x555555 }));
          pole.position.y = 1.5;
          const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 128, 128);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          
          if (type === 'STOP') {
              ctx.fillStyle = '#cc0000'; ctx.beginPath();
              for (let i = 0; i < 8; i++) {
                  ctx.lineTo(64 + 60 * Math.cos(i * Math.PI / 4 + Math.PI / 8), 64 + 60 * Math.sin(i * Math.PI / 4 + Math.PI / 8));
              }
              ctx.fill();
              ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('STOP', 64, 64);
          } else if (type === 'SPEED_40') {
              ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64, 64, 48, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#000000'; ctx.font = 'bold 50px sans-serif'; ctx.fillText('40', 64, 64);
          } else if (type === 'NO_HONK') {
              ctx.fillStyle = '#0066cc'; ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64, 64, 48, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#cc0000'; ctx.font = 'bold 40px sans-serif'; ctx.fillText('NO', 64, 48); ctx.fillText('HONK', 64, 80);
              ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(24, 104); ctx.lineTo(104, 24); ctx.stroke();
          }

          const tex = new THREE.CanvasTexture(canvas);
          const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
          board.position.set(0, 3.2, 0.08);
          const backBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0x999999 }));
          backBoard.rotation.y = Math.PI; backBoard.position.set(0, 3.2, -0.08);
          
          g.add(pole, board, backBoard);
          g.position.set(x, 0, z);
          g.rotation.y = rotY;
          this.scene.add(g);
      }

      _addSpeedBreaker(x, z, rotY = 0) {
          const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 12, 1, false, 0, Math.PI), new THREE.MeshToonMaterial({ color: 0xdddd00 }));
          bump.rotation.z = Math.PI / 2;
          bump.rotation.y = rotY;
          bump.position.set(x, 0, z);
          this.scene.add(bump);
          this.speedBreakers.push(bump);
      }

      // ── PATH ARROW INDICATORS (Idea #1) ──
      // Directional chevron arrows placed on the road (vehicle mode) or
      // sidewalk (pedestrian/position mode) showing the player where to go.
      _buildArrows() {
          if (!this.mapCfg || !this.mapCfg.route || this.mapCfg.route.length < 2) { this._arrows = []; return; }
          this._arrows = [];
          const route = this.mapCfg.route;
          const arrowMat = new THREE.MeshBasicMaterial({ color: this.isPedestrian ? 0xffab40 : 0x00e676, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
          // In pedestrian mode, arrows go on the sidewalk (offset left); in vehicle mode, left side of road
          const cfg = this.mapCfg;
          const RW = cfg.isPedestrian ? 10 : 12;
          const swW = cfg.isPedestrian ? 6 : 4;
          const sideOffset = this.isPedestrian ? -(RW / 2 + swW / 2) : -3.5;

          for (let i = 0; i < route.length - 1; i++) {
              const a = route[i], b = route[i + 1];
              const dx = b.x - a.x, dz = b.z - a.z;
              const len = Math.sqrt(dx * dx + dz * dz);
              if (len < 1) continue;
              const ang = Math.atan2(dx, dz);
              const nx = -dz / len, nz = dx / len;

              const count = Math.max(2, Math.floor(len / 18));
              for (let j = 0; j < count; j++) {
                  const t = (j + 0.5) / count;
                  const px = a.x + dx * t + nx * sideOffset;
                  const pz = a.z + dz * t + nz * sideOffset;
                  const g = new THREE.Group();
                  const wing1 = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
                      new THREE.Vector3(0, 0, -1.8), new THREE.Vector3(-1.1, 0, 0.6), new THREE.Vector3(0, 0, -0.2)
                  ]), arrowMat.clone());
                  const wing2 = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
                      new THREE.Vector3(0, 0, -1.8), new THREE.Vector3(1.1, 0, 0.6), new THREE.Vector3(0, 0, -0.2)
                  ]), arrowMat.clone());
                  g.add(wing1, wing2);
                  g.rotation.x = -Math.PI / 2;
                  g.rotation.z = -ang;
                  g.position.set(px, 0.12, pz);
                  g.userData = { seg: i, baseY: 0.12, ped: !!this.isPedestrian };
                  this.scene.add(g);
                  this._arrows.push(g);
              }
          }
      }

      // Called each frame to pulse arrows and hide segments past the next checkpoint
      _updateArrows() {
          if (!this._arrows || !this._arrows.length || !this.cps) return;
          const nextCP = this.cps.find(c => !c.userData.hit);
          const nextIdx = nextCP ? this.cps.indexOf(nextCP) : this.cps.length;
          const pulse = 0.55 + 0.25 * Math.sin(this.timer * 4);
          const onRoad = this.isPedestrian && this._isOnRoad(this.player.position.x, this.player.position.z);
          this._arrows.forEach(a => {
              const visible = a.userData.seg < nextIdx && !(onRoad && a.userData.ped);
              a.visible = visible;
              if (visible) {
                  a.position.y = a.userData.baseY + 0.08 * Math.sin(this.timer * 3 + a.userData.seg);
                  if (a.children[0] && a.children[0].material) a.children[0].material.opacity = pulse;
                  if (a.children[1] && a.children[1].material) a.children[1].material.opacity = pulse;
              }
          });
      }

      _loop() {
        // PERFORMANCE: Frame rate capping to prevent excessive CPU/GPU usage
        const now = performance.now();
        const isLowEnd = this._isMobile && (navigator.deviceMemory || 4) < 6;
        const frameInterval = isLowEnd ? 1000 / 30 : 1000 / 60;
        const elapsed = now - (this._lastFrame || 0);
        if (elapsed < frameInterval) {
          requestAnimationFrame(() => this._loop());
          return;
        }
        this._lastFrame = now - (elapsed % frameInterval);

        requestAnimationFrame(() => this._loop()); if (!this.playing || this.pause) { if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera); return; }
        const dt = Math.min(this.clock.getDelta(), .033); this.timer += dt;
        this._honkedThisFrame = false;
        this._collidedThisFrame = false;
        this._input(dt); this._usigs(dt); this._unpcs(dt); this._upeds(dt); this._ucps(dt); this._updateArrows(); this._ugps(); this._uobs(dt); this._umode(dt); this._decayCameraLook(dt); this._ucam(dt); this._usun(dt); this._uhud(); this._ummap(); this._utransit(); this._computeTaskFlags(); this._checkTasks();

        // Removed redundant WebGL minimap rendering pass.
        // The game relies on the highly stylized 2D canvas minimap via `_ummap()` which is much faster.
        if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);

      }
      _input(dt) {
        if (!this.isPedestrian && Math.abs(this.speed) > 0.05) {
            if (!this.seatbeltOn && !this.challanFired.has('seatbelt')) {
                this.challanFired.add('seatbelt');
                ui.issueChallan((this.vehMode === 'bike' || this.vehMode === 'cycle') ? 'Riding without Helmet' : 'Driving without Seatbelt', 'Sec 194D MV Act', '₹1,000', 'Safety Violation');
                this.vio++; this.score -= 20; this.fine += 1000;
            }
        }

        if (this.keys['f'] && !this._fPressed && !this.bucklingUp) {
          this._fPressed = true;
          if (this.playerVehicle && this.playerCharacter) {
            if (this.isPedestrian) {
              const dist = this.player.position.distanceTo(this.playerVehicle.position);
              if (dist < 18.0) {
                this.bucklingUp = true;
                toast('Buckling up...', '#f39c12');
                setTimeout(() => {
                    this.bucklingUp = false;
                    if (!this.playing) return;
                    this.isPedestrian = false;
                    this.playerCharacter.position.set(0, 0.6, 0.2);
                    this.playerCharacter.scale.set(0.55, 0.55, 0.55);
                    this.playerVehicle.add(this.playerCharacter);
                    this.player = this.playerVehicle;
                    this._camSnapped = false;
                    const vt = this.vehMode || 'car';
                    const rain = window.gameWeather === 'Rain' || (this.mapCfg && this.mapCfg.hasRain);
                    const hw = this.mapCfg && this.mapCfg.themeType === 'highway';
                    const vs = VEHICLE_STATS[vt] || VEHICLE_STATS.car;
                    this.maxSpd = (hw ? vs.maxSpd * 1.3 : vs.maxSpd) * (this.seatbeltOn ? 1.1 : 1.0);
                    this.accel = vs.accel;
                    this.turn = rain ? vs.turn * 0.65 : vs.turn;
                    this.fric = rain ? vs.fric + 0.025 : vs.fric;
                    this._grip = rain ? vs.grip * 0.3 : vs.grip;
                    toast(this.seatbeltOn ? '🚗 Entered +10% Speed Bonus!' : '🚗 Entered Vehicle!', this.seatbeltOn ? '#27ae60' : '#00c851');
                }, 1500);
              } else {
                toast('Too far from vehicle.', '#ff9500');
              }
            } else {
              this.isPedestrian = true;
              this.playerVehicle.remove(this.playerCharacter);
              this.playerCharacter.scale.set(1, 1, 1);
              this.playerCharacter.position.copy(this.playerVehicle.position);
              this.playerCharacter.position.x += 6;
              this.scene.add(this.playerCharacter);
              this.player = this.playerCharacter;
              this._camSnapped = false;
              this.player.visible = true;
              this.maxSpd = 0.12; this.accel = 0.06; this.turn = 0.05; this.fric = 0.88;
              this.setGear('N');
              toast('🚶 Exited Vehicle!', '#00c851');
            }
          }
        }
        if (!this.keys['f']) this._fPressed = false;

        const up = !this.bucklingUp && (this.keys['arrowup'] || this.keys['w']), dn = !this.bucklingUp && (this.keys['arrowdown'] || this.keys['s']), lt = !this.bucklingUp && (this.keys['arrowleft'] || this.keys['a']), rt = !this.bucklingUp && (this.keys['arrowright'] || this.keys['d']);
        // Per-gear acceleration multipliers 🔄 each gear feels clearly different
        const gAccel = { 'D': 1.30, 'R': .55, 'N': 0, 'P': 0 };
        const mult = gAccel[this.gear] ?? 0;
        const isRev = this.gear === 'R';
        const cap = this.gcap;
        let overrideMove = false;
        
        if (this.isPedestrian) {
          const shift = this.keys['shift'] ? 2.2 : 1.0;
          let dx = 0, dz = 0;
          
          if (this.isPointerLocked) {
            if (up) dz = 1; if (dn) dz = -1;
            if (lt) dx = 1; if (rt) dx = -1;
            if (dx !== 0 || dz !== 0) {
              const yaw = this.player.rotation.y;
              const moveX = Math.sin(yaw) * dz + Math.sin(yaw + Math.PI/2) * dx;
              const moveZ = Math.cos(yaw) * dz + Math.cos(yaw + Math.PI/2) * dx;
              const len = Math.hypot(moveX, moveZ);
              
              this.vx += ((moveX / len) * this.maxSpd * shift - this.vx) * 0.6;
              this.vz += ((moveZ / len) * this.maxSpd * shift - this.vz) * 0.6;
              this.speed = Math.hypot(this.vx, this.vz);
            } else {
              this.vx *= 0.6; this.vz *= 0.6;
              this.speed = 0;
            }
            overrideMove = true;
          } else {
            if (lt) this.player.rotation.y += 0.05;
            if (rt) this.player.rotation.y -= 0.05;
            if (up) this.speed = this.maxSpd * shift;
            else if (dn) this.speed = -this.maxSpd * shift * 0.5;
            else this.speed = 0;
          }
        } else {
          // ── Frame-rate independent acceleration ──
          if (up && this.gear !== 'P' && this.gear !== 'N') {
            this.speed += this.accel * mult * dt * 60 * (isRev ? -1 : 1);
          }
          if (dn) {
            if (this.speed > 0) this.speed -= this.accel * 1.4 * dt * 60;
            else if (isRev && this.speed < -0.02) this.speed += this.accel * 1.4 * dt * 60;
          }
          // Clamp to gear cap
          if (isRev) { this.speed = Math.max(this.speed, -cap); } else { this.speed = Math.min(this.speed, cap); }
          // Frame-rate independent friction: pow(fric, dt*60) makes 0.945 feel identical at 30fps and 120fps
          this.speed *= Math.pow(this.fric, dt * 60);

          // ── TAILLIGHT BRAKE GLOW (night mode) ──
          if (this._playerTaillights) {
            const braking = this.keys['arrowdown'] || this.keys['s'] || (this.speed < -0.01);
            const intensity = braking ? 1.0 : 0.3;
            this._playerTaillights.forEach(tl => {
              tl.material.color.setHex(braking ? 0xff4400 : 0xff2200);
              tl.scale.setScalar(braking ? 1.5 : 1.0);
            });
            // ── BRAKE DUST PARTICLES ──
            if (braking && Math.abs(this.speed) > 0.25 && !this._brakeDustCd) {
              this._brakeDustCd = true;
              const px = this.playerVehicle ? this.playerVehicle.position.x : (this.player ? this.player.position.x : 0);
              const py = this.playerVehicle ? this.playerVehicle.position.y : (this.player ? this.player.position.y : 0);
              const pz = this.playerVehicle ? this.playerVehicle.position.z : (this.player ? this.player.position.z : 0);
              this._spawnDust(px, py, pz);
              setTimeout(() => { this._brakeDustCd = false; }, 150);
            }
          }

          // Sprint / Boost — Shift key (frame-rate independent, requires seatbelt)
          if (this.keys['shift'] && this.boostFuel > 0 && up && this.gear === 'D' && this.seatbeltOn) {
            this.boosting = true;
            this.speed *= 1 + (0.35 * dt * 60);
            this.boostFuel = Math.max(0, this.boostFuel - 18 * dt);
          } else if (this.keys['shift'] && !this.seatbeltOn && this.gear === 'D') {
            if (!this._seatbeltWarnCd || Date.now() - this._seatbeltWarnCd > 3000) {
              toast('⚠️ Buckle up to boost!', '#f2b84b');
              this._seatbeltWarnCd = Date.now();
            }
            this.boosting = false;
            this.boostFuel = Math.min(this.maxBoostFuel, this.boostFuel + 9 * dt);
          } else {
            this.boosting = false;
            this.boostFuel = Math.min(this.maxBoostFuel, this.boostFuel + 9 * dt);
          }
        }

        if (!overrideMove) {
          let tAmt = 0;
          // Speed-proportional steering with per-vehicle turn rate
          if (Math.abs(this.speed) > .01 && !this.isPedestrian) {
            const sf = Math.max(0.40, 1 - Math.abs(this.speed) * 0.40);
            const effTurn = this.turn * sf;
            if (lt) tAmt = 1;
            else if (rt) tAmt = -1;
            else if (window.analogSteering) tAmt = -window.analogSteering;
            else if (window.gyroSteering) tAmt = -window.gyroSteering;
            if (tAmt !== 0) this.player.rotation.y += tAmt * effTurn * Math.sign(this.speed) * dt * 60;
            // Normalize yaw to [-PI, PI] to prevent extreme accumulation
            while (this.player.rotation.y > Math.PI) this.player.rotation.y -= Math.PI * 2;
            while (this.player.rotation.y < -Math.PI) this.player.rotation.y += Math.PI * 2;
          }
          // Camera tilt: smooth follow of lateral input, scaled by speed
          const tiltTarget = -tAmt * Math.min(Math.abs(this.speed) * 0.06, 0.04);
          this._camTilt += (tiltTarget - this._camTilt) * Math.min(1, dt * 8);

          const targetVx = Math.sin(this.player.rotation.y) * this.speed;
          const targetVz = Math.cos(this.player.rotation.y) * this.speed;
          // ── Lateral grip model ──
          // Per-vehicle base grip, reduced in rain, reduced at high speed for realistic drift feel
          let grip = this._grip || 0.62;
          if (this.mode === 'rain' || (this.mapCfg && this.mapCfg.hasRain)) grip *= 0.25;
          grip *= Math.max(0.50, 1 - Math.abs(this.speed) * 0.22);
          // Frame-rate independent grip lerp
          const gripLerp = 1 - Math.pow(1 - grip, dt * 60);
          this.vx += (targetVx - this.vx) * gripLerp;
          this.vz += (targetVz - this.vz) * gripLerp;
        }
        
        this.player.position.x += this.vx; this.player.position.z += this.vz;
        if (this.isPedestrian && Math.abs(this.speed) > 0.02) { const shift = this.keys['shift'] ? 18 : 10; this.player.position.y = Math.abs(Math.sin(this.timer * shift)) * (this.keys['shift'] ? 0.12 : 0.06); }
        else if (!this.isPedestrian && this.playerVehicle && !this._sbBounce) { this.playerVehicle.position.y = 0; }

        // DEBUG: Check if vehicle has unwanted X/Z rotation
        if (!this.isPedestrian && this.playerVehicle && (Math.abs(this.playerVehicle.rotation.x) > 0.01 || Math.abs(this.playerVehicle.rotation.z) > 0.01)) {
          console.warn('[FLIP-DBG] Vehicle has X/Z rotation!', {
            rx: this.playerVehicle.rotation.x.toFixed(4),
            ry: this.playerVehicle.rotation.y.toFixed(4),
            rz: this.playerVehicle.rotation.z.toFixed(4)
          });
        }

        // DEBUG: Check if camera has unwanted roll
        const camRx = this.camera.rotation.x;
        const camRz = this.camera.rotation.z;
        if (Math.abs(camRx) > 0.01 || Math.abs(camRz) > 0.01) {
          console.warn('[FLIP-DBG] Camera has X/Z rotation!', {
            rx: camRx.toFixed(4),
            rz: camRz.toFixed(4),
            playerRy: this.player?.rotation?.y?.toFixed(4),
            vehiclePos: {x: this.playerVehicle?.position?.x?.toFixed(2), z: this.playerVehicle?.position?.z?.toFixed(2)}
          });
        }

        // Hard world boundary clamp — prevents floating-point precision loss
        // Regular maps: roads extend to ~±1500, ground is 2000x2000 → clamp at ±1550
        // 50km maps: roads extend to ~±25000 → clamp at ±25500
        const _wBound = this.mapCfg && this.mapCfg.is50km ? 25500 : 1550;
        this.player.position.x = Math.max(-_wBound, Math.min(_wBound, this.player.position.x));
        this.player.position.z = Math.max(-_wBound, Math.min(_wBound, this.player.position.z));

        let validRoadBound = false;
        this.roadSegments.forEach(r => {
          if (r.type === 'v' && Math.abs(this.player.position.x - r.x) < 7.5) validRoadBound = true;
          if (r.type === 'h' && Math.abs(this.player.position.z - r.z) < 7.5) validRoadBound = true;
        });
        const owEl = this.dom['ow'];
        if (this.isPedestrian && owEl) owEl.textContent = "⚠️ JAYWALKING - Walk on the sidewalk/zebra crossing!";
        else if (owEl) owEl.textContent = "⚠️ OFF ROAD - Return to road!";
        // Find the road segment the player is currently on (used for wrong-side detection)
        let currentRoad = null;
        for (const r of this.roadSegments) {
          if (r.type === 'v' && Math.abs(this.player.position.x - r.x) < 7.5) { currentRoad = r; break; }
          if (r.type === 'h' && Math.abs(this.player.position.z - r.z) < 7.5) { currentRoad = r; break; }
        }
        if (this.mapCfg && this.mapCfg.hasPuddles && Math.random() < 0.3) { this.player.rotation.y += this.turn * (this.speed > 0 ? 1 : -1) * (Math.random() * 0.5 - 0.25); }
        // Re-normalize after puddle jitter
        if (!this.isPedestrian) {
          while (this.player.rotation.y > Math.PI) this.player.rotation.y -= Math.PI * 2;
          while (this.player.rotation.y < -Math.PI) this.player.rotation.y += Math.PI * 2;
        }
        if (this.isPedestrian) {
          let nearZebra = false;
          (this.mapCfg.ints || []).forEach(([ix, iz]) => { if (Math.abs(this.player.position.x - ix) < 10 && Math.abs(this.player.position.z - iz) < 10) nearZebra = true; });
          if (validRoadBound && !nearZebra) { if (owEl) owEl.classList.add('on'); this.speed *= .52; this.hp -= this.seatbeltOn ? .36 : .45; this._uh(); } else { if (owEl) owEl.classList.remove('on'); }
        } else {
          if (!validRoadBound) { 
            if (owEl) owEl.classList.add('on'); 
            this.speed *= .52;
            this.hp -= this.seatbeltOn ? .36 : .45;

            if (!this.player.userData.fpCooldown) this.player.userData.fpCooldown = 0;
            this.player.userData.fpCooldown -= dt;
            if (this.player.userData.fpCooldown <= 0 && window.ui && window.ui.issueChallan) {
                window.ui.issueChallan('Driving on Footpath', 'Sec 177 MV Act', '₹500', 'Reckless Driving');
                this.player.userData.fpCooldown = 3;
            }
            
            if (this.hp <= 0) this._go("Drove off-road"); else this._uh(); 
          } else { 
            if (owEl) owEl.classList.remove('on'); 
            
            // Turn signal blink effect
            if (this.turnSignal !== 0) {
                this.turnTimer += dt;
                if (this.turnTimer > 0.4) {
                    this.turnTimer = 0;
                    if (window.sfx && window.sfx.play) window.sfx.play('ok');
                }
            }
            
            // Check Wrong-side driving
            if (currentRoad && !this.isPedestrian && Math.abs(this.speed) > 0.15) {
                let wrongWay = false;
                let nearInt = false;
                (this.mapCfg.ints || []).forEach(([ix, iz]) => {
                    if (Math.abs(this.player.position.x - ix) < 25 && Math.abs(this.player.position.z - iz) < 25) nearInt = true;
                });
                if (!nearInt) {
                    if (currentRoad.type === 'v') {
                        if (Math.sign(this.player.position.x - currentRoad.x) !== Math.sign(this.vz) && Math.abs(this.vz) > 0.05) wrongWay = true;
                    } else {
                        if (Math.sign(this.player.position.z - currentRoad.z) === Math.sign(this.vx) && Math.abs(this.vx) > 0.05) wrongWay = true;
                    }
                }
                if (wrongWay) {
                    if (!this.player.userData.wwCooldown) this.player.userData.wwCooldown = 0;
                    this.player.userData.wwCooldown -= dt;
                    if (this.player.userData.wwCooldown <= 0 && window.ui && window.ui.issueChallan) {
                        window.ui.issueChallan('Wrong Side Driving', 'Sec 119 MV Act', '₹1,500', 'Lane Discipline');
                        this.player.userData.wwCooldown = 4;
                    }
                }
            }

            // Check Overspeeding
            if (this.mapCfg && this.mapCfg.speedLimit && !this.isPedestrian) {
              const currentSpeedKmH = Math.round(Math.abs(this.speed) * 100);
              if (currentSpeedKmH > this.mapCfg.speedLimit) {
                 if (!this.player.userData.spdCooldown) this.player.userData.spdCooldown = 0;
                 this.player.userData.spdCooldown -= dt;
                 if (this.player.userData.spdCooldown <= 0 && window.ui && window.ui.issueChallan) {
                    window.ui.issueChallan('Overspeeding', 'Sec 112 MV Act', '₹1,000', `Limit: ${this.mapCfg.speedLimit} km/h`);
                    this.player.userData.spdCooldown = 5;
                 }
              }
            }
          }
        }
      }
      _usigs(dt) {
        let nearestSig = null, nearestDist = 9999;
        this.sigs.forEach(sg => {
          const d = sg.userData; d.t += dt; const rem = d.t % 9.5;
          const prev = d.st;
          d.st = rem < 4 ? 'red' : rem < 5.5 ? 'yellow' : 'green';
          const r = sg.getObjectByName('red'), y = sg.getObjectByName('yellow'), g = sg.getObjectByName('green');
          if (r) r.material.color.setHex(d.st === 'red' ? 0xff3b30 : 0x220000);
          if (y) y.material.color.setHex(d.st === 'yellow' ? 0xffd54a : 0x222200);
          if (g) g.material.color.setHex(d.st === 'green' ? 0x00c851 : 0x002200);
          const pr = sg.getObjectByName('p_red'), pg = sg.getObjectByName('p_green');
          if (pr) pr.material.color.setHex(d.st === 'red' ? 0x220000 : 0xff3b30);
          if (pg) pg.material.color.setHex(d.st === 'red' ? 0x00c851 : 0x002200);
          // Reset challan flag when signal turns green
          if (d.st === 'green' && prev !== 'green') this.challanFired.delete(sg.uuid);
          // Challan ONCE per red phase per signal
          const dist = this.player.position.distanceTo(sg.position);
          if (d.st === 'red' && dist < 6.5 && Math.abs(this.speed) > .18 && !this.challanFired.has(sg.uuid)) {
            this.challanFired.add(sg.uuid);
            this.vio++; this.fine += 500;
            ui.issueChallan('Jumping red signal', 'Section 119, MV Act', '₹500', 'Junction Sensor');
          }
          // Track nearest signal for HUD
          if (dist < nearestDist) { nearestDist = dist; nearestSig = sg; }
        });
        // Update signal proximity indicator
        const si = this.dom['sig-ind'];
        if (si) {
          if (nearestSig && nearestDist < 60 && this.playing) {
            si.style.display = 'flex';
            const st = nearestSig.userData.st;
            const col = st === 'red' ? '#ff3b30' : st === 'yellow' ? '#ffd54a' : '#00c851';
            const lamp = this.dom['sind-lamp'];
            const stEl = this.dom['sind-state'];
            const distEl = this.dom['sind-dist'];
            if (lamp) { lamp.style.background = col; lamp.style.boxShadow = '0 0 14px ' + col; }
            if (stEl) { stEl.textContent = st.toUpperCase(); stEl.style.color = col; }
            if (distEl) distEl.textContent = Math.round(nearestDist) + 'm';
            const timerEl = this.dom['sind-timer'];
            if (timerEl && nearestSig) {
              const nd = nearestSig.userData; const rem2 = nd.t % 9.5;
              let remaining = 0;
              if (nd.st === 'red') remaining = Math.max(0, 4 - rem2);
              else if (nd.st === 'yellow') remaining = Math.max(0, 9.5 - rem2);
              else remaining = Math.max(0, 8 - rem2);
              timerEl.textContent = Math.ceil(remaining) + 's';
            }
          } else si.style.display = 'none';
        }
      }
      _unpcs(dt) {
        this.npcs.forEach(n => {
          if (n.userData.spd !== undefined) {
            if (n.userData.laneT === undefined) { 
              n.userData.laneT = Math.random() * 5 + 3; 
              n.userData.txX = n.position.x; 
              n.userData.baseSpd = n.userData.spd; 
              n.userData.state = 'CRUISE';
              n.userData._stuckTimer = 0;
              n.userData._lastPos = n.position.clone();
            }

            // Stuck detection — if NPC barely moves for 3s, teleport to safe position
            if (!n.userData._lastPos) n.userData._lastPos = n.position.clone();
            const movedDist = n.position.distanceTo(n.userData._lastPos);
            if (movedDist < 0.1 && n.userData.state !== 'STOPPED') {
              n.userData._stuckTimer = (n.userData._stuckTimer || 0) + dt;
            } else {
              n.userData._stuckTimer = 0;
            }
            n.userData._lastPos.copy(n.position);
            if (n.userData._stuckTimer > 3) {
              if (n.userData.isLevelDefined && n.userData.route && n.userData.route.length) {
                // Route-following NPC: teleport back to first route point
                const rp = n.userData.route[0];
                n.position.set(rp.x, 0, rp.z);
                n.userData.routeIdx = 0;
              } else if (n.userData.moveAxis === 'h') {
                n.position.x = n.userData.baseCoord || 0;
              } else if (n.userData.moveAxis) {
                n.position.z = n.userData.baseCoord || 0;
                n.position.x = n.userData.baseCoord || 0;
              }
              n.userData.spd = n.userData.baseSpd;
              n.userData.state = 'CRUISE';
              n.userData._stuckTimer = 0;
            }

            // Smooth route wrapping — lerp back to start over 1.2s instead of teleporting
            if (n.userData._wrapT > 0) {
              n.userData._wrapT -= dt;
              const p = Math.max(0, n.userData._wrapT / 1.2);
              if (n.userData.moveAxis === 'h') {
                n.position.x = n.userData._wrapFrom + (n.userData._wrapTo - n.userData._wrapFrom) * (1 - p);
              } else {
                n.position.z = n.userData._wrapFrom + (n.userData._wrapTo - n.userData._wrapFrom) * (1 - p);
                n.position.x += (n.userData.txX - n.position.x) * 0.08;
              }
              n.userData.spd = 0;
              if (n.userData._wrapT <= 0) {
                n.userData.spd = n.userData.baseSpd;
                n.userData.state = 'CRUISE';
              }
              return;
            }

            const distToPlayer = this.player ? this.player.position.distanceToSquared(n.position) : 0;
            if (distToPlayer > 62500) {
              n.visible = false;
              n.userData.spd = n.userData.baseSpd;
              return;
            }
            n.visible = true;
            n.userData.laneT -= dt;
            let myLane = n.userData.txX;

            if (distToPlayer < 200 && n.userData.moveAxis) {
              let fsm = {
                approachingObstacle: false,
                obstacleDist: 999,
                obstacleSpeed: 0,
                redLight: false,
                yellowLight: false
              };

                // 1. Check Traffic Lights (Red + Yellow) — tightened to 15m
                this.sigs.forEach(sg => {
                  const isRed = sg.userData.st === 'red';
                  const isYellow = sg.userData.st === 'yellow';
                  if (isRed || isYellow) {
                    if (n.userData.moveAxis === 'h') {
                      const dx = sg.position.x - n.position.x;
                      if (n.userData.dir === 1 && dx > 0 && dx < 15 && Math.abs(n.position.z - sg.position.z) < 5) {
                        fsm.approachingObstacle = true;
                      fsm.obstacleDist = Math.min(fsm.obstacleDist, dx);
                      fsm.redLight = isRed;
                      fsm.yellowLight = isYellow;
                    }
                    if (n.userData.dir === -1 && dx < 0 && dx > -15 && Math.abs(n.position.z - sg.position.z) < 5) {
                      fsm.approachingObstacle = true;
                      fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dx));
                      fsm.redLight = isRed;
                      fsm.yellowLight = isYellow;
                    }
                  } else {
                    const dz = sg.position.z - n.position.z;
                    if (n.userData.dir === 1 && dz > 0 && dz < 15 && Math.abs(n.position.x - sg.position.x) < 5) {
                      fsm.approachingObstacle = true;
                      fsm.obstacleDist = Math.min(fsm.obstacleDist, dz);
                      fsm.redLight = isRed;
                      fsm.yellowLight = isYellow;
                    }
                    if (n.userData.dir === -1 && dz < 0 && dz > -15 && Math.abs(n.position.x - sg.position.x) < 5) {
                      fsm.approachingObstacle = true;
                      fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dz));
                      fsm.redLight = isRed;
                      fsm.yellowLight = isYellow;
                    }
                  }
                }
              });

              // 1.5 Yield to pedestrians on Zebra Crossings
              if (this.peds) {
                this.peds.forEach(ped => {
                  const dz = ped.position.z - n.position.z;
                  const dx = Math.abs(ped.position.x - n.position.x);
                  if (dz * n.userData.dir > 0 && Math.abs(dz) < 25 && dx < 4) {
                    fsm.approachingObstacle = true;
                    fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dz));
                  }
                });
              }

              // 2. Check Vehicles Ahead
              if (n.userData.moveAxis === 'h') {
                // Horizontal NPCs: check along X-axis
                this.npcs.forEach(other => {
                  if (other !== n && other.userData.moveAxis === 'h') {
                    const dx = other.position.x - n.position.x;
                    const dz = Math.abs(other.position.z - n.position.z);
                    if (dx * n.userData.dir > 0 && Math.abs(dx) < 25 && dz < 2.5) {
                      fsm.approachingObstacle = true;
                      fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dx));
                      fsm.obstacleSpeed = (other.userData.dir === n.userData.dir) ? other.userData.spd : 0;
                    }
                  }
                });
                // Check player for horizontal NPCs
                if (this.player && this.player.position && !this.isPedestrian) {
                  const dx = this.player.position.x - n.position.x;
                  const dz = Math.abs(this.player.position.z - n.position.z);
                  if (dx * n.userData.dir > 0 && Math.abs(dx) < 30 && dz < 2.5) {
                    fsm.approachingObstacle = true;
                    fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dx));
                  }
                }
              } else {
              this.npcs.forEach(other => {
                  if (other !== n && other.userData.moveAxis !== 'h') {
                    const dz = other.position.z - n.position.z;
                    const dx = Math.abs(other.position.x - n.position.x);
                    if (dz * n.userData.dir > 0 && Math.abs(dz) < 25 && dx < 2.5) {
                      fsm.approachingObstacle = true;
                      fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dz));
                      fsm.obstacleSpeed = (other.userData.dir === n.userData.dir) ? other.userData.spd : 0;
                    }
                  }
                });

                // 3. Check Player (vertical)
                if (this.player && this.player.position && !this.isPedestrian) {
                  const dz = this.player.position.z - n.position.z;
                  const dx = Math.abs(this.player.position.x - n.position.x);
                  if (dz * n.userData.dir > 0 && Math.abs(dz) < 30 && dx < 2.5) {
                    fsm.approachingObstacle = true;
                    fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dz));
                    const pDir = Math.cos(this.player.rotation.y) < 0 ? 1 : -1;
                    fsm.obstacleSpeed = (pDir === n.userData.dir) ? (this.speed || 0) : 0;
                  }
                }
              } // end else (vertical NPC checks)

                // 4. Ambulance Priority Yielding
                let yieldingToAmbulance = false;
                if (this.ms && this.ms.amb && this.ms.amb !== n) {
                  const ambDist = this.player ? this.player.position.distanceTo(this.ms.amb.position) : 999;
                  this._ambulanceNear = ambDist < 20;
                  if (n.userData.dir === 1) {
                    const ambDz = this.ms.amb.position.z - n.position.z;
                    // If ambulance is approaching from behind within 60m
                    if (ambDz < 0 && ambDz > -60) {
                      yieldingToAmbulance = true;
                      n.userData.state = 'YIELD_AMBULANCE';
                      n.userData.txX = -4.8; // Move to leftmost lane
                    }
                  }
                }

                // State Transitions
                if (!yieldingToAmbulance) {
                  if (fsm.approachingObstacle && fsm.obstacleDist < 11.0) {
                    n.userData.state = 'STOPPED';
                  } else if (fsm.approachingObstacle && fsm.obstacleDist < 30 && fsm.yellowLight) {
                    n.userData.state = 'SLOW_DOWN';
                  } else if (fsm.approachingObstacle && fsm.obstacleDist < 30 && !fsm.redLight) {
                    n.userData.state = 'FOLLOW';
                    // Overtake Logic
                    if (n.userData.laneT <= 0) {
                      const lanes = n.userData.dir === 1 ? [-4.8, -2.4, 0, 2.4, 4.8] : [-4.8, -2.4, 0, 2.4, 4.8];
                      let safeLanes = lanes.filter(l => Math.abs(l - myLane) <= 3.0 && l !== myLane);
                      
                      safeLanes = safeLanes.filter(l => {
                        let blocked = false;
                        this.npcs.forEach(other => {
                          if (other !== n && Math.abs(other.position.x - l) < 2.5 && Math.abs(other.position.z - n.position.z) < 22 && (other.position.z - n.position.z)*n.userData.dir > -10) blocked = true;
                        });
                        if (this.player && this.player.position && !this.isPedestrian) {
                          if (Math.abs(this.player.position.x - l) < 2.5 && Math.abs(this.player.position.z - n.position.z) < 25 && (this.player.position.z - n.position.z)*n.userData.dir > -10) blocked = true;
                        }
                        return !blocked;
                      });

                      if (safeLanes.length > 0) {
                        n.userData.txX = safeLanes[Math.floor(Math.random() * safeLanes.length)];
                        n.userData.laneT = Math.random() * 3 + 2;
                        n.userData.state = 'OVERTAKE';
                      }
                    }
                  } else {
                    n.userData.state = 'CRUISE';
                  }
                }

                // Apply State Behavior — realistic braking & acceleration curves
                switch(n.userData.state) {
                  case 'CRUISE':
                    n.userData.spd += (n.userData.baseSpd - n.userData.spd) * 0.12;
                    break;
                  case 'FOLLOW':
                    let tgtSpd = Math.max(0, fsm.obstacleSpeed - 0.2);
                    n.userData.spd += (tgtSpd - n.userData.spd) * 0.15;
                    break;
                  case 'SLOW_DOWN':
                    n.userData.spd += (n.userData.baseSpd * 0.35 - n.userData.spd) * 0.18;
                    break;
                  case 'STOPPED':
                    n.userData.spd += (0 - n.userData.spd) * 0.2;
                    break;
                  case 'OVERTAKE':
                    n.userData.spd += (n.userData.baseSpd * 1.2 - n.userData.spd) * 0.05;
                    break;
                  case 'YIELD_AMBULANCE':
                    n.userData.spd += (n.userData.baseSpd * 0.5 - n.userData.spd) * 0.05;
                    break;
                }

                // ── BRAKE LIGHTS: brighten when decelerating ──
                if (n.children) {
                  const isBraking = n.userData.state === 'STOPPED' || n.userData.state === 'SLOW_DOWN' || n.userData.state === 'FOLLOW';
                  n.children.forEach(ch => {
                    if (ch.material && ch.material.color && ch.material.color.getHex() === 0xff2200) {
                      ch.material.emissive = ch.material.emissive || new THREE.Color(0);
                      ch.material.emissiveIntensity = isBraking ? 2.0 : 0.2;
                    }
                  });
                }

                // ── HORN HONK: random horn when stuck >3s ──
                if (n.userData.state === 'STOPPED') {
                  n.userData._stoppedTime = (n.userData._stoppedTime || 0) + dt;
                  if (n.userData._stoppedTime > 3 && Math.random() < 0.02 && window.sfx) {
                    window.sfx.play('horn');
                    n.userData._stoppedTime = 0;
                  }
                } else {
                  n.userData._stoppedTime = 0;
                }

                // ── SPEED BREAKER: NPCs slow down over speed breakers ──
                if (this.speedBreakers) {
                  this.speedBreakers.forEach(sb => {
                    const sbDist = n.position.distanceTo(sb.position);
                    if (sbDist < 5 && n.userData.state !== 'STOPPED') {
                      n.userData.spd *= 0.6;
                    }
                  });
                }
            } else if (distToPlayer < 200 && n.userData.useRoute) {
              // Route-following NPC obstacle detection (axis-aware via segment direction)
              let rfsm = { approachingObstacle: false, obstacleDist: 999, redLight: false, yellowLight: false };

              const rt = n.userData.route;
              const rIdx = n.userData.routeIdx || 0;
              const pCurr = rt[rIdx];
              const pNext = rt[(rIdx + 1) % rt.length];
              const segDx = pNext.x - pCurr.x;
              const segDz = pNext.z - pCurr.z;
              const isSegV = Math.abs(segDz) > Math.abs(segDx);
              const segDirX = segDx !== 0 ? Math.sign(segDx) : 0;
              const segDirZ = segDz !== 0 ? Math.sign(segDz) : 0;

              // Traffic lights
              this.sigs.forEach(sg => {
                const isRed = sg.userData.st === 'red';
                const isYellow = sg.userData.st === 'yellow';
                if (!isRed && !isYellow) return;
                if (isSegV) {
                  const dz = sg.position.z - n.position.z;
                  if (segDirZ !== 0 && dz * segDirZ > 0 && dz * segDirZ < 15 && Math.abs(n.position.x - sg.position.x) < 5) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(dz));
                    rfsm.redLight = isRed;
                    rfsm.yellowLight = isYellow;
                  }
                } else {
                  const dx = sg.position.x - n.position.x;
                  if (segDirX !== 0 && dx * segDirX > 0 && dx * segDirX < 15 && Math.abs(n.position.z - sg.position.z) < 5) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(dx));
                    rfsm.redLight = isRed;
                    rfsm.yellowLight = isYellow;
                  }
                }
              });

              // Vehicles ahead
              this.npcs.forEach(other => {
                if (other === n || other.userData.spd === undefined) return;
                const adx = other.position.x - n.position.x;
                const adz = other.position.z - n.position.z;
                if (isSegV) {
                  if (adz * segDirZ > 0 && Math.abs(adz) < 25 && Math.abs(adx) < 3) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(adz));
                  }
                } else {
                  if (adx * segDirX > 0 && Math.abs(adx) < 25 && Math.abs(adz) < 3) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(adx));
                  }
                }
              });

              // Player vehicle
              if (this.player && this.player.position && !this.isPedestrian) {
                const pdx = this.player.position.x - n.position.x;
                const pdz = this.player.position.z - n.position.z;
                if (isSegV) {
                  if (pdz * segDirZ > 0 && Math.abs(pdz) < 30 && Math.abs(pdx) < 3) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(pdz));
                  }
                } else {
                  if (pdx * segDirX > 0 && Math.abs(pdx) < 30 && Math.abs(pdz) < 3) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(pdx));
                  }
                }
              }

              // Pedestrians
              if (this.peds) {
                this.peds.forEach(ped => {
                  const pdx = Math.abs(ped.position.x - n.position.x);
                  const pdz = Math.abs(ped.position.z - n.position.z);
                  const withinLane = isSegV ? pdx < 4 : pdz < 4;
                  const withinRange = isSegV ? pdz < 25 : pdx < 25;
                  if (withinRange && withinLane) {
                    rfsm.approachingObstacle = true;
                    const d = isSegV ? pdz : pdx;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, d);
                  }
                });
              }

              // Route NPC state transitions
              if (rfsm.approachingObstacle && rfsm.obstacleDist < 11) {
                n.userData.state = 'STOPPED';
              } else if (rfsm.approachingObstacle && rfsm.obstacleDist < 30 && rfsm.yellowLight) {
                n.userData.state = 'SLOW_DOWN';
              } else if (rfsm.approachingObstacle && rfsm.obstacleDist < 30) {
                n.userData.state = 'FOLLOW';
              } else {
                n.userData.state = 'CRUISE';
              }

              // Route NPC state behavior
              switch (n.userData.state) {
                case 'CRUISE':
                  n.userData.spd += (n.userData.baseSpd - n.userData.spd) * 0.12;
                  break;
                case 'FOLLOW':
                  n.userData.spd += (n.userData.baseSpd * 0.3 - n.userData.spd) * 0.15;
                  break;
                case 'SLOW_DOWN':
                  n.userData.spd += (n.userData.baseSpd * 0.35 - n.userData.spd) * 0.18;
                  break;
                case 'STOPPED':
                  n.userData.spd += (0 - n.userData.spd) * 0.2;
                  break;
              }
            } else {
               // Far away, just cruise
               n.userData.spd += (n.userData.baseSpd - n.userData.spd) * 0.12;
            }

            // Movement Execution
            if (n.userData.useRoute) {
              const rt = n.userData.route;
              const idx = n.userData.routeIdx;
              const pCurr = rt[idx];
              const pNext = rt[(idx + 1) % rt.length];
              const isVertical = Math.abs(pNext.z - pCurr.z) > Math.abs(pNext.x - pCurr.x);
              const lOff = n.userData.laneOffset;
              const tX = isVertical ? pNext.x + lOff : pNext.x;
              const tZ = isVertical ? pNext.z : pNext.z + lOff;
              const moveDir = new THREE.Vector3(tX - n.position.x, 0, tZ - n.position.z).normalize();
              n.position.addScaledVector(moveDir, n.userData.spd * 35 * dt);
              let targetYaw = Math.atan2(moveDir.x, moveDir.z);
              let diff = targetYaw - n.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              n.rotation.y += diff * 0.2;
              if (n.position.distanceTo(new THREE.Vector3(tX, 0, tZ)) < 2) {
                n.userData.routeIdx = (idx + 1) % rt.length;
              }
            } else {
              if (n.userData.moveAxis === 'h') {
                n.position.x += n.userData.spd * 35 * dt * n.userData.dir; 
                if (n.position.x > n.userData.maxPos && n.userData.dir === 1) {
                  n.userData._wrapT = 1.2;
                  n.userData._wrapFrom = n.position.x;
                  n.userData._wrapTo = n.userData.minPos;
                  n.userData.state = 'CRUISE';
                }
                if (n.position.x < n.userData.minPos && n.userData.dir === -1) {
                  n.userData._wrapT = 1.2;
                  n.userData._wrapFrom = n.position.x;
                  n.userData._wrapTo = n.userData.maxPos;
                  n.userData.state = 'CRUISE';
                }
              } else {
                n.userData.txX = Math.max(-6, Math.min(6, n.userData.txX));
                n.position.x += (n.userData.txX - n.position.x) * 0.08;
                let yawT = Math.atan2(n.userData.txX - n.position.x, 8) * 0.5;
                if (n.userData.dir === -1) yawT += Math.PI;
                let diff = yawT - n.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                n.rotation.y += diff * 0.2;
                n.position.z += n.userData.spd * 35 * dt * n.userData.dir;
                if (n.position.z > n.userData.maxPos && n.userData.dir === 1) {
                  n.userData._wrapT = 1.2;
                  n.userData._wrapFrom = n.position.z;
                  n.userData._wrapTo = n.userData.minPos;
                  n.userData.txX = n.userData.baseCoord + 2.5;
                  n.userData.state = 'CRUISE';
                }
                if (n.position.z < n.userData.minPos && n.userData.dir === -1) {
                  n.userData._wrapT = 1.2;
                  n.userData._wrapFrom = n.position.z;
                  n.userData._wrapTo = n.userData.maxPos;
                  n.userData.txX = n.userData.baseCoord - 2.5;
                  n.userData.state = 'CRUISE';
                }
              }
            }
          }
          
          // Ambulance clearing logic
          if (n.userData.isAmb && this.ms) {
            const ambDz = n.position.z - this.player.position.z;
            
            // Check if player cleared the way
            if (ambDz > 0 && Math.abs(this.player.position.x) > 3.2 && !this.ms.passed) {
              this.ms.passed = true; this.score += 100; toast('✅ Ambulance Cleared!', '#00c851');
            }
            
            // Check if player is blocking the ambulance (Ambulance is right behind player)
            if (!this.isPedestrian && !this.ms.passed && ambDz < 0 && ambDz > -15 && Math.abs(this.player.position.x - n.position.x) < 2.5) {
               if (!n.userData.blockTimer) n.userData.blockTimer = 0;
               n.userData.blockTimer += dt;
               if (n.userData.blockTimer > 3) {
                 if (window.ui && window.ui.issueChallan) {
                   window.ui.issueChallan('Blocking Emergency Vehicle', 'Sec 194E MV Act', '₹10,000', 'Emergency Priority');
                 }
                 n.userData.blockTimer = -10; // Prevent spamming
               }
            } else {
               n.userData.blockTimer = 0;
            }
          }
          
          // Player Collision
          if (this.player.position.distanceTo(n.position) < 2.2) {
            this.hp -= this.seatbeltOn ? 9.6 : 12;
            if (this.hp <= 0) this._go('Collided with ' + (n.userData.npcType || 'Vehicle')); 
            else this._uh(); 
            this.speed *= -.22;
            this._camShakeAmt = Math.max(this._camShakeAmt, 0.40);
            if(window.sfx) window.sfx.play('error'); 
            toast('💥 Collision!', '#ff3b30'); 
          }
        });
      }
      _upeds(dt) {
        if (!this.peds) this.peds = [];
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
          this.peds.forEach(p => {
            if (p.position.distanceToSquared(this.player.position) > 62500) {
              p.visible = false;
              return;
            }
            p.visible = true;
          });
        }
        
        // Count nearby pedestrians for task tracking
        this._nearbyPedCount = 0;
        this.peds.forEach(p => {
          if (this.player.position.distanceTo(p.position) < 8) this._nearbyPedCount++;
        });
        
        // Despawn far pedestrians (Phase 7: hide instead of destroy, reuse later)
        if (!this._pedFree) this._pedFree = [];
        const isFest = this.mapCfg && (this.mapCfg.crowdFestival || this.mapCfg.themeType === 'festival');
        for (let i = this.peds.length - 1; i >= 0; i--) {
          const p = this.peds[i];
          const despawnDist = isFest ? 200 : 100;
          if (p.position.distanceTo(this.player.position) > despawnDist) {
            this.scene.remove(p);
            this.peds.splice(i, 1);
            p.visible = false;
            this._pedFree.push(p);
          }
        }

        // Spawn new pedestrians dynamically
        const isFestCrowd = this.mapCfg && (this.mapCfg.crowdFestival || this.mapCfg.themeType === 'festival');
        const maxPeds = isFestCrowd ? 120 : ((this.mapCfg && this.mapCfg.isPedestrian) ? 30 : 16);
        const pedSpawnRate = isFestCrowd ? 0.8 : 0.2;
        if (this.peds.length < maxPeds && Math.random() < pedSpawnRate && this.mapCfg && this.mapCfg.roads && this.mapCfg.roads.length > 0) {
          const r = this.mapCfg.roads[Math.floor(Math.random() * this.mapCfg.roads.length)];
          const isV = r.type === 'v';
          const rx = isV ? r.x : Math.min(r.x1, r.x2) + Math.random() * Math.abs(r.x2 - r.x1);
          const rz = isV ? Math.min(r.z1, r.z2) + Math.random() * Math.abs(r.z2 - r.z1) : r.z;
          
          const distToPlayer = Math.hypot(rx - this.player.position.x, rz - this.player.position.z);
          // Spawn just outside the view radius
          const spawnMin = isFestCrowd ? 20 : 30;
          const spawnMax = isFestCrowd ? 180 : 120;
          if (distToPlayer > spawnMin && distToPlayer < spawnMax) {
            // Phase 7: Reuse freed pedestrian or create new
            let ped;
            if (this._pedFree && this._pedFree.length > 0) {
              ped = this._pedFree.pop();
              ped.visible = true;
            } else {
              ped = _buildHuman();
            }
            const side = Math.random() > 0.5 ? 1 : -1;
            const lDist = 18 / 2 + 1.25; // Sidewalk distance
            const bDist = lDist + 6.0;   // Building distance
            
            const exiting = Math.random() > 0.5; // Randomly start exiting a building
            const px = isV ? rx + side * (exiting ? bDist : lDist) : rx;
            const pz = isV ? rz : rz + side * (exiting ? bDist : lDist);
            
            ped.position.set(px, 0, pz);
            ped.userData = {
              t: Math.random() * 10,
              spd: 0.3 + Math.random() * 0.4,
              isV: isV,
              dir: Math.random() > 0.5 ? 1 : -1,
              startZ: isV ? pz : px,
              roadC: isV ? rx : rz,
              lLeg: ped.children.find(c => c.name === 'lLeg') || new THREE.Group(),
              rLeg: ped.children.find(c => c.name === 'rLeg') || new THREE.Group(),
              state: exiting ? 'exiting' : 'sidewalk',
              side: side,
              targetDist: lDist,
              destDist: 15 + Math.random() * 25,
              distTraveled: 0
            };
            
            if (exiting) {
              if (isV) ped.rotation.y = side > 0 ? -Math.PI/2 : Math.PI/2;
              else ped.rotation.y = side > 0 ? Math.PI : 0;
            } else {
              ped.rotation.y = isV ? (ped.userData.dir > 0 ? 0 : Math.PI) : (ped.userData.dir > 0 ? Math.PI/2 : -Math.PI/2);
            }

            ped.frustumCulled = true;
            this.scene.add(ped);
            this.peds.push(ped);
          }
        }

        this.peds.forEach(p => {
          p.userData.t += dt * p.userData.spd;

          // ── IDLE STATES: pedestrians pause, look around, check phones ──
          if (!p.userData._idleState) {
            p.userData._idleTimer = Math.random() * 8;
            p.userData._idleState = false;
            p.userData._idleDur = 0;
          }
          if (p.userData.state !== 'exiting' && !p.userData._idleState) {
            p.userData._idleTimer -= dt;
            if (p.userData._idleTimer <= 0) {
              // Randomly enter idle: check phone, look around, wait
              const idleType = Math.random();
              if (idleType < 0.35) {
                p.userData._idleState = true;
                p.userData._idleDur = 2 + Math.random() * 5;
                p.userData._idleType = 'phone'; // looking at phone
              } else if (idleType < 0.55) {
                p.userData._idleState = true;
                p.userData._idleDur = 3 + Math.random() * 6;
                p.userData._idleType = 'wait'; // waiting / resting
              } else {
                p.userData._idleTimer = 6 + Math.random() * 12;
              }
            }
          }
          if (p.userData._idleState) {
            p.userData._idleDur -= dt;
            // Slight head tilt for phone lookers
            if (p.userData._idleType === 'phone') {
              p.rotation.y += Math.sin(p.userData.t * 2) * 0.002;
            }
            if (p.userData._idleDur <= 0) {
              p.userData._idleState = false;
              p.userData._idleTimer = 4 + Math.random() * 10;
            }
          }

          if (p.userData.state === 'exiting') {
            if (p.userData.isV) {
              p.position.x += -p.userData.side * dt * p.userData.spd;
              if (Math.abs(p.position.x - p.userData.roadC) <= p.userData.targetDist) {
                p.position.x = p.userData.roadC + p.userData.side * p.userData.targetDist;
                p.userData.state = 'sidewalk';
                p.rotation.y = p.userData.dir > 0 ? 0 : Math.PI;
                p.userData.startZ = p.position.z;
                p.userData.destDist = 10 + Math.random() * 20;
                p.userData.distTraveled = 0;
              }
            } else {
              p.position.z += -p.userData.side * dt * p.userData.spd;
              if (Math.abs(p.position.z - p.userData.roadC) <= p.userData.targetDist) {
                p.position.z = p.userData.roadC + p.userData.side * p.userData.targetDist;
                p.userData.state = 'sidewalk';
                p.rotation.y = p.userData.dir > 0 ? Math.PI/2 : -Math.PI/2;
                p.userData.startZ = p.position.x;
                p.userData.destDist = 10 + Math.random() * 20;
                p.userData.distTraveled = 0;
              }
            }
          } else if (!p.userData._idleState) {
            const moveAmt = p.userData.spd * 4 * dt;
            if (p.userData.isV) {
              p.position.z += p.userData.dir * moveAmt;
              p.userData.distTraveled += moveAmt;
            } else {
              p.position.x += p.userData.dir * moveAmt;
              p.userData.distTraveled += moveAmt;
            }

            if (p.userData.distTraveled >= p.userData.destDist) {
              p.userData.dir *= -1;
              if (p.userData.isV) {
                p.rotation.y = p.userData.dir > 0 ? 0 : Math.PI;
              } else {
                p.rotation.y = p.userData.dir > 0 ? Math.PI/2 : -Math.PI/2;
              }
              p.userData.distTraveled = 0;
              p.userData.destDist = 10 + Math.random() * 25;
            }
          }

          // ── VEHICLE FLEE: pedestrians jump/step back when vehicle approaches fast ──
          if (this.player && this.speed && Math.abs(this.speed) > 0.3 && !this.isPedestrian) {
            const dpv = this.player.position.distanceTo(p.position);
            if (dpv < 8 && dpv > 2.5) {
              const fleeDir = new THREE.Vector3().subVectors(p.position, this.player.position).normalize();
              p.position.x += fleeDir.x * dt * 2.5;
              p.position.z += fleeDir.z * dt * 2.5;
              // Face away from vehicle
              p.rotation.y = Math.atan2(-fleeDir.x, -fleeDir.z);
            }
          }

          // Inter-pedestrian avoidance: steer away from nearby peds
          this.peds.forEach(other => {
            if (other === p) return;
            const dx = p.position.x - other.position.x;
            const dz = p.position.z - other.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 1.8 && dist > 0.01) {
              const push = (1.8 - dist) * 0.5;
              if (p.userData.isV) {
                p.position.x += (dx / dist) * push * dt * 8;
              } else {
                p.position.z += (dz / dist) * push * dt * 8;
              }
            }
          });

          // Leg animation: slower when idle, full stride when walking
          const walkSpeed = p.userData._idleState ? 0.08 : 10;
          if (p.userData.lLeg) p.userData.lLeg.rotation.x = Math.sin(p.userData.t * walkSpeed) * (p.userData._idleState ? 0.05 : 0.6);
          if (p.userData.rLeg) p.userData.rLeg.rotation.x = Math.sin(p.userData.t * walkSpeed + Math.PI) * (p.userData._idleState ? 0.05 : 0.6);

          if (!this.isPedestrian && this.player.position.distanceTo(p.position) < 2.5) {
            this.speed = 0; this.hp = 0;
            toast(' HIT PEDESTRIAN! INSTANT FAILURE!', '#ff3b30');
            this._uh(); this._go("Structural Failure");
          }
        });
      }
      _uobs(dt) {
        const px = this.player.position.x, pz = this.player.position.z;
        const pR = 1.5; // player collision radius
        this.obstacles.forEach(o => {
          const dx = px - o.position.x, dz = pz - o.position.z;
          if (dx * dx + dz * dz > 400) return;
          const ud = o.userData || {};
          const hw = ud.halfW || 1.6, hd = ud.halfD || 1.6;
          const overlapX = pR + hw - Math.abs(dx);
          const overlapZ = pR + hd - Math.abs(dz);
          if (overlapX > 0 && overlapZ > 0) {
              this._collidedThisFrame = true;
              this.hp -= this.seatbeltOn ? 8 : 10;
              if (this.hp <= 0) this._go('Collided with Barricade');
              else this._uh();
              this.speed *= -.2;
              this._camShakeAmt = Math.max(this._camShakeAmt, 0.35);
              // Push player out along axis of least penetration
              if (overlapX < overlapZ) {
                this.player.position.x += (dx > 0 ? overlapX : -overlapX);
              } else {
                this.player.position.z += (dz > 0 ? overlapZ : -overlapZ);
              }
              toast('🚧 Collided with Barricade bounds!', '#ff9500');
          }
        });
        
        if (this.puddles) {
            this.puddles.forEach(p => {
                if (this.player.position.distanceTo(p.position) < 2.5 && Math.abs(this.speed) > 0.15 && !p.userData.splashed) {
                    p.userData.splashed = true;
                    this.score -= 50;
                    this.fine += 500;
                    ui.issueChallan('Splashed water on pedestrians', 'Sec 184 MV Act', '₹500', 'Reckless Driving');
                    toast('💦 Splashed Water! Too Fast!', '#ff3b30');
                    sfx.play('error');
                    // Splash particle burst
                    this._spawnSplash(p.position.x, p.position.y, p.position.z);
                    // Reset splashed flag after cooldown
                    setTimeout(() => { p.userData.splashed = false; }, 3000);
                }
            });
        }
        if (this.speedBreakers) {
            this.speedBreakers.forEach(sb => {
                if (!sb.userData) sb.userData = { cd: 0 };
                if (sb.userData.cd > 0) sb.userData.cd -= dt;
                
                if (!this.isPedestrian && sb.userData.cd <= 0 && this.player.position.distanceTo(sb.position) < 2.5) {
                    sb.userData.cd = 2.0;
                    if (Math.abs(this.speed) > 0.4) {
                        this.speed *= 0.6;
                        this.hp -= this.seatbeltOn ? 4 : 5;
                        this._uh();
                        this._camShakeAmt = Math.max(this._camShakeAmt, 0.15);
                        this.playerVehicle.position.y = 0.6;
                        this._sbBounce = true;
                        setTimeout(() => { if(this.playerVehicle) { this.playerVehicle.position.y = 0; this._sbBounce = false; } }, 150);
                        toast('⚠️ High Speed on Breaker! Damage taken!', '#ff9500');
                        sfx.play('error');
                    } else {
                        this.playerVehicle.position.y = 0.2;
                        this._sbBounce = true;
                        setTimeout(() => { if(this.playerVehicle) { this.playerVehicle.position.y = 0; this._sbBounce = false; } }, 150);
                    }
                }
            });
        }
      }
      _utransit() {
          if (!this.trains) return;
          this.trains.forEach(t => {
              t.mesh.position.x += t.vx;
              if (t.mesh.position.x < -100) t.mesh.position.x = 100;
          });
      }
      _ucps(dt) {
        let hits = 0;
        this.cps.forEach(cp => {
          if (cp.userData.hit) { hits++; return; }
          // Smart ring path animation: ring moves along pathPts (sidewalk → crossing → sidewalk)
          if (cp.userData.pathPts && cp.userData.pathPts.length >= 2) {
              cp.userData.pathT = (cp.userData.pathT + dt * 0.5) % 1.0;
              const pts = cp.userData.pathPts;
              const totalSegs = pts.length - 1;
              const seg = Math.min(Math.floor(cp.userData.pathT * totalSegs), totalSegs - 1);
              const segT = (cp.userData.pathT * totalSegs) - seg;
              cp.position.x = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * segT;
              cp.position.z = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * segT;
          }
          if (this.player.position.distanceTo(cp.position) < 3.2) { cp.userData.hit = true; cp.visible = false; this.score += 100; hits++; toast('✅ Node Verified!', '#00c851'); sfx.play('ok'); }
        });
        this.hits = hits;
        if (this.dom['hcp']) this.dom['hcp'].textContent = hits + '/' + this.cps.length;

        // Realtime GPS Arrow Target Tracking
        const nextNode = this.cps.find(c => !c.userData.hit); const da = this.dom['da'];
        if (nextNode && this.playing) {
          if (da) da.style.display = 'block';
          const dx = nextNode.position.x - this.player.position.x, dz = nextNode.position.z - this.player.position.z;
          const dist = Math.round(Math.hypot(dx, dz));
          // FIX: use atan2(dx,dz) not atan2(dx,-dz) for correct forward direction
          let rel = Math.atan2(dx, dz) - this.player.rotation.y;
          while (rel < -Math.PI) rel += Math.PI * 2; while (rel > Math.PI) rel -= Math.PI * 2;
          const deg = rel * 180 / Math.PI;
          // Rotate the arrow emoji using CSS transform
          const arrowEl = this.dom['da-arrow'];
          if (arrowEl) arrowEl.style.transform = 'rotate(' + Math.round(deg) + 'deg)';
          if (this.dom['dal']) this.dom['dal'].textContent = dist + 'm · ' + (Math.abs(deg) < 20 ? 'STRAIGHT' : deg > 0 ? 'RIGHT' : 'LEFT');
        } else if (da) da.style.display = 'none';

        if (hits >= this.cps.length && this.cps.length > 0) this.completeLevel();
      }
      _ugps() {
        if (!this.phoneGpsOn) return;
        const nextNode = this.cps.find(c => !c.userData.hit);
        if (!nextNode || !this.playing) return;
        const dx = nextNode.position.x - this.player.position.x, dz = nextNode.position.z - this.player.position.z;
        const dist = Math.round(Math.hypot(dx, dz));
        let rel = Math.atan2(dx, dz) - this.player.rotation.y;
        while (rel < -Math.PI) rel += Math.PI * 2; while (rel > Math.PI) rel -= Math.PI * 2;
        const deg = rel * 180 / Math.PI;
        const arrow = this.dom['phone-gps-arrow'];
        if (arrow) arrow.style.transform = 'rotate(' + Math.round(-deg) + 'deg)';
        if (this.dom['phone-gps-dist']) this.dom['phone-gps-dist'].textContent = dist + 'm';
        const dirText = Math.abs(deg) < 20 ? 'STRAIGHT' : deg > 0 ? 'TURN RIGHT' : 'TURN LEFT';
        if (this.dom['phone-gps-dir']) this.dom['phone-gps-dir'].textContent = dirText;
        const task = this.tasks && this.tasks.find(t => !t.done);
        if (this.dom['phone-gps-obj']) this.dom['phone-gps-obj'].textContent = task ? task.label : 'Next checkpoint';
      }
      _umode(dt) {
        this.score += dt; document.getElementById('hsc').textContent = Math.round(this.score);
        if ((this.mode === 'rain' || this.mapCfg?.hasRain) && this.rain) {
          const p = this.rain.geometry.attributes.position.array;
          for (let i = 1; i < p.length; i += 3) { p[i] -= 10 * dt; if (p[i] < 0) p[i] = 25; }
          this.rain.geometry.attributes.position.needsUpdate = true;
          // 20% speed reduction in rain
          if (this.speed > this.maxSpd * 0.8) this.speed = this.maxSpd * 0.8;
          // Lightning flash + thunder every 8-15s
          this.lightningTimer -= dt;
          if (this.lightningTimer <= 0) {
            this.lightningTimer = 8 + Math.random() * 7;
            // Screen flash
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.35);z-index:99999;pointer-events:none;transition:opacity 0.3s';
            document.body.appendChild(flash);
            setTimeout(() => { flash.style.opacity = '0'; }, 50);
            setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 400);
            // Thunder sound (delayed slightly for realism)
            setTimeout(() => { if (window.sfx && window.sfx.play) window.sfx.play('thunder'); }, 200 + Math.random() * 400);
          }
        }
        // Puddle shimmer animation
        if (this.puddles) {
          this.puddles.forEach((pu, i) => {
            if (pu.material) {
              pu.material.opacity = 0.45 + 0.15 * Math.sin(this.score * 2.5 + i * 0.7);
            }
          });
        }
        if (this.mode === 'silentzone' && this.ms) this.ms.inSz = this.player.position.z > -60 && this.player.position.z < 20;
      }
      _ucam(dt) {
        if (this.isPointerLocked) {
          // First Person Mode
          const headHeight = this.isPedestrian ? 1.6 : 1.2;
          // For vehicles, offset slightly forward so we don't clip into the driver seat mesh
          const forwardOffset = this.isPedestrian ? 0 : 0.5;
          const rotY = this.player.rotation.y;
          
          this.camera.position.set(
            this.player.position.x + Math.sin(rotY) * forwardOffset, 
            this.player.position.y + headHeight, 
            this.player.position.z + Math.cos(rotY) * forwardOffset
          );
          
          const pitch = this.camPitch || 0;
          const yaw = rotY + (this.camYaw || 0);
          const lx = Math.sin(yaw) * Math.cos(pitch);
          const ly = Math.sin(pitch);
          const lz = Math.cos(yaw) * Math.cos(pitch);
          
          this.camera.lookAt(
            this.camera.position.x + lx,
            this.camera.position.y + ly,
            this.camera.position.z + lz
          );
        } else {
          // ── Third Person Chase Cam — improved ──
          const camDist = this.isPedestrian ? 4 : 12;
          const camHeight = this.isPedestrian ? 2.5 : 4.5;
          const rotY = this.player.rotation.y + (this.camYaw || 0);
          // Speed-based look-ahead: camera leads in the direction of travel
          const lookAhead = this.isPedestrian ? 0 : Math.min(Math.abs(this.speed) * 5, 3.5);
          const pitchOffset = (this.camPitch || 0) * 2;
          this._camTarget.set(
              this.player.position.x - Math.sin(rotY) * camDist + Math.sin(rotY) * lookAhead,
              camHeight - pitchOffset,
              this.player.position.z - Math.cos(rotY) * camDist + Math.cos(rotY) * lookAhead
          );
          // Phase 7.4: Smooth camera transition on mode switch (0.4s lerp) or instant snap
          if (!this._camSnapped) {
            this._camSnapped = true;
            this.camera.position.copy(this._camTarget);
          }
          // Frame-rate independent camera lerp
          const transT = (this._camTransition && this._camTransition > 0) ? this._camTransition : 0;
          if (transT > 0) this._camTransition = Math.max(0, transT - dt);
          const baseLerp = Math.min(1, dt * 6);
          const camLerp = transT > 0 ? Math.min(1, dt * 3) : baseLerp; // slower during transition
          this.camera.position.lerp(this._camTarget, camLerp);

          // Camera shake: decays exponentially
          let shakeX = 0, shakeY = 0;
          if (this._camShakeAmt > 0.001) {
            shakeX = (Math.random() - 0.5) * this._camShakeAmt;
            shakeY = (Math.random() - 0.5) * this._camShakeAmt;
            this._camShakeAmt *= Math.pow(0.04, dt);
          }

          const tiltRoll = this._camTilt || 0;
          this.camera.lookAt(
            this.player.position.x + Math.sin(rotY) * 15 + shakeX,
            1.5 - pitchOffset * 0.3 + shakeY,
            this.player.position.z + Math.cos(rotY) * 15
          );
          // Camera tilt DISABLED for debugging — pure lookAt, no roll
          // if (tiltRoll !== 0) {
          //   const _rollQ = new THREE.Quaternion();
          //   _rollQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltRoll);
          //   this.camera.quaternion.multiply(_rollQ);
          // }

          // DEBUG: Log camera state if rotation looks unusual
          const _camEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
          if (Math.abs(_camEuler.x) > 0.15 || Math.abs(_camEuler.z) > 0.15) {
            console.warn('[FLIP-DBG] Camera Euler (YXZ):', {
              x: _camEuler.x.toFixed(3),
              y: _camEuler.y.toFixed(3),
              z: _camEuler.z.toFixed(3)
            }, 'pos:', {
              x: this.camera.position.x.toFixed(1),
              y: this.camera.position.y.toFixed(1),
              z: this.camera.position.z.toFixed(1)
            }, 'playerRot:', this.player.rotation.y.toFixed(3),
            'playerPos:', {
              x: this.player.position.x.toFixed(1),
              y: this.player.position.y.toFixed(1),
              z: this.player.position.z.toFixed(1)
            });
          }

          // ── Speed-based FOV ──
          if (!this.isPedestrian && this.camera.fov !== undefined) {
            const speedRatio = Math.min(Math.abs(this.speed) / (this.maxSpd || 1.1), 1);
            this._camFovTarget = 60 + speedRatio * 15 + (this.boosting ? 5 : 0);
            if (Math.abs(this.camera.fov - this._camFovTarget) > 0.15) {
              this.camera.fov += (this._camFovTarget - this.camera.fov) * Math.min(1, dt * 4);
              this.camera.updateProjectionMatrix();
            }
          }
        }
      }
      _usun(dt) {
        if (!this._sun || !this.player) return;
        // Dynamic shadow quality: monitor FPS, downscale shadow map if below threshold
        this._fpsFrameCount = (this._fpsFrameCount || 0) + 1;
        if (this._fpsFrameCount % 60 === 0) {
          const fps = 1 / Math.max(dt, 0.001);
          if (!this._shadowQuality) this._shadowQuality = 2048;
          if (fps < 25 && this._shadowQuality > 512) {
            this._shadowQuality = Math.max(512, this._shadowQuality / 2);
            this._sun.shadow.mapSize.set(this._shadowQuality, this._shadowQuality);
            if (this._sun.shadow.map) { this._sun.shadow.map.dispose(); this._sun.shadow.map = null; }
            this._sun.shadow.needsUpdate = true;
          } else if (fps > 50 && this._shadowQuality < 2048) {
            this._shadowQuality = Math.min(2048, this._shadowQuality * 2);
            this._sun.shadow.mapSize.set(this._shadowQuality, this._shadowQuality);
            if (this._sun.shadow.map) { this._sun.shadow.map.dispose(); this._sun.shadow.map = null; }
            this._sun.shadow.needsUpdate = true;
          }
        }
        const p = this.player.position;
        if (this._sunLastPos && Math.abs(p.x - this._sunLastPos.x) + Math.abs(p.z - this._sunLastPos.z) < 8) return;
        if (!this._sunLastPos) this._sunLastPos = new THREE.Vector3();
        this._sunLastPos.copy(p);
        this._sun.position.set(p.x + 30, 60, p.z + 20);
        const sc = this._sun.shadow.camera;
        sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60;
        sc.updateProjectionMatrix();
        this._sun.shadow.needsUpdate = true;
      }
      _uhud() {
        const k = Math.round(Math.abs(this.speed) * 100);
        
        if (!this.warnEl) {
            this.warnEl = document.createElement('div');
            this.warnEl.style.cssText = 'position:fixed; top:20%; left:50%; transform:translateX(-50%); font-family:"Bebas Neue",sans-serif; font-size:3rem; color:#ff3b30; text-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:9999; display:none; pointer-events:none; text-align:center; transition:opacity 0.2s;';
            document.body.appendChild(this.warnEl);
        }
        let warnMsg = '';
        if (k > 80) warnMsg = '⚠️ OVERSPEEDING';
        else if (k > 50 && Math.abs(this.player.rotation.y - (this.lastRotY || this.player.rotation.y)) > 0.06) warnMsg = '⚠️ SHARP CORNER';
        this.lastRotY = this.player.rotation.y;

        if (warnMsg) {
            this.warnEl.textContent = warnMsg;
            this.warnEl.style.display = 'block';
            if (!this.warnEl.classList.contains('flash')) { this.warnEl.classList.add('flash'); }
        } else {
            this.warnEl.style.display = 'none';
            this.warnEl.classList.remove('flash');
        }
        const gspdEl = this.dom['gspd'];
        if (gspdEl) {
          gspdEl.textContent = k;
          // Colour by speed zone
          const spCol = k > 70 ? '#ff3b30' : k > 45 ? '#ff9500' : k > 20 ? '#ffd54a' : '#00c851';
          gspdEl.style.fill = spCol;
        }
        const arc = this.dom['garc'];
        if (arc) {
          const sw = Math.min(k / 90, 1) * 240; const sa = -220 * Math.PI / 180; const ea = sa + sw * Math.PI / 180;
          arc.setAttribute('d', `M${44 + 32 * Math.cos(sa)},${44 + 32 * Math.sin(sa)} A32,32,0,${sw > 180 ? 1 : 0},1,${44 + 32 * Math.cos(ea)},${44 + 32 * Math.sin(ea)}`);
          const arcCol = k > 70 ? '#ff3b30' : k > 45 ? '#ff9500' : 'var(--yellow)';
          arc.setAttribute('stroke', arcCol);
        }
        // Boost fuel gauge
        const bgEl = this.dom['boostgauge'];
        if (bgEl) {
          if (this.isPedestrian) { bgEl.style.display = 'none'; }
          else {
            bgEl.style.display = 'block';
            const pct = Math.round(this.boostFuel);
            const boostPctEl = this.dom['boost-pct'];
            if (boostPctEl) { boostPctEl.textContent = pct; }
            const boostArcEl = this.dom['boost-arc'];
            if (boostArcEl) {
              const circ = 150.8;
              const offset = circ * (1 - this.boostFuel / this.maxBoostFuel);
              boostArcEl.setAttribute('stroke-dashoffset', offset);
              const col = this.boosting ? '#00f0cc' : '#5ed4f5';
              boostArcEl.setAttribute('stroke', col);
              if (boostPctEl) boostPctEl.style.fill = col;
            }
            bgEl.style.boxShadow = this.boosting
              ? '0 0 20px rgba(0, 240, 204, 0.6), 0 0 40px rgba(0, 240, 204, 0.3)'
              : '0 8px 20px rgba(0, 0, 0, 0.1)';
          }
          // Vignette overlay when boosting
          const vig = this.dom['boost-vignette'];
          if (vig) {
            if (this.boosting && !this.isPedestrian) { vig.style.display = 'block'; vig.style.opacity = '1'; }
            else { vig.style.opacity = '0'; setTimeout(() => { if (vig.style.opacity === '0') vig.style.display = 'none'; }, 300); }
          }
          // "Boost Ready" flash when fuel recharges to 100
          const br = this.dom['boost-ready'];
          if (br && !this.isPedestrian) {
            if (this.boostFuel >= this.maxBoostFuel && this._wasDepleted) {
              this._wasDepleted = false;
              br.style.display = 'block'; br.style.opacity = '1';
              setTimeout(() => { br.style.opacity = '0'; }, 1500);
              setTimeout(() => { br.style.display = 'none'; }, 1800);
            } else if (this.boostFuel < this.maxBoostFuel) {
              this._wasDepleted = true;
            }
          }
        }
        // Speed lines overlay: radial vignette opacity scales with speed
        const slEl = this.dom['speed-lines'];
        if (slEl) {
          if (!this.isPedestrian && Math.abs(this.speed) > 0.3) {
            const sRatio = Math.min(Math.abs(this.speed) / (this.maxSpd || 1.1), 1);
            const slOpacity = sRatio * 0.75 + (this.boosting ? 0.2 : 0);
            slEl.style.display = 'block';
            slEl.style.opacity = String(Math.min(slOpacity, 1));
          } else {
            slEl.style.opacity = '0';
          }
        }
        const tl = this.timeLimit || 120; const rem = Math.max(0, Math.ceil(tl - this.timer));
        const htmr = this.dom['htmr'];
        if (htmr) {
            htmr.textContent = Math.floor(rem / 60) + ':' + ((rem % 60) < 10 ? '0' : '') + (rem % 60);
            if (rem <= 15) { htmr.style.color = '#ff3b30'; } else { htmr.style.color = ''; }
        }
        if (rem <= 0 && this.playing) { this._go("Structural Failure"); toast('⏰ Time Up!', '#ff3b30'); return; }
        const hfin = this.dom['hfin']; if (hfin && this.fine > 0) hfin.textContent = '₹' + this.fine;
      }
      _ummap() {
        const mc = this.dom['mmc']; if (!mc || !this.playing) return; mc.classList.add('on');
        const ctx = mc.getContext('2d'); const W = 112, H = 112, cx = W / 2, cy = H / 2;

        ctx.fillStyle = '#090f16'; ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.translate(cx, cy);
        const scale = 0.6;
        ctx.scale(scale, scale);
        ctx.translate(-this.player.position.x, -this.player.position.z);

        // Plot absolute dynamic road configuration vectors
        ctx.fillStyle = '#1e222a';
        this.roadSegments.forEach(r => {
          if (r.type === 'v') ctx.fillRect(r.x - 6, -600, 12, 1200);
          else ctx.fillRect(-600, r.z - 6, 1200, 12);
        });

        // Track dynamic real-time colors for oncoming signals
        this.sigs.forEach(s => {
          ctx.fillStyle = s.userData.st === 'red' ? '#ff3b30' : s.userData.st === 'green' ? '#00c851' : '#ffd54a';
          ctx.beginPath(); ctx.arc(s.position.x, s.position.z, 6, 0, Math.PI * 2); ctx.fill();
        });

        // Draw NPC Traffic Tracking Dots
        ctx.fillStyle = '#3498db';
        this.npcs.forEach(n => {
          ctx.fillRect(n.position.x - 3, n.position.z - 3, 6, 6);
        });

        // Draw Player
        ctx.fillStyle = '#ffd54a';
        ctx.beginPath(); ctx.arc(this.player.position.x, this.player.position.z, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Minimap Borders
        ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2); ctx.stroke();
      }
    }

    async function downloadSourceCode(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("dl-btn");
      if(!btn || typeof JSZip === "undefined") { alert("Zip library loading, please wait."); return; }
      
      const origText = btn.innerHTML;
      btn.innerHTML = "&#9203; Zipping... (Make sure to run via local server for this to work!)";
      btn.style.pointerEvents = "none";
      
      try {
        const zip = new JSZip();
        const files = [
          "Academy",
          "vehicles.js",
          "auto.js",
          "bus.js"
        ];
        
        let fetched = 0;
        
        for (let f of files) {
          let fetchUrl = f;
          if (f === "Academy") fetchUrl = window.location.href.split("?")[0].split("#")[0];
          
          try {
            const res = await fetch(fetchUrl);
            if (res.ok) {
              const blob = await res.blob();
              let fName = f;
              if (f === "Academy") fName = fetchUrl.split("/").pop() || "Academy";
              zip.file(fName, blob);
              fetched++;
            } else {
              console.warn("Could not fetch " + f);
            }
          } catch(err) {
            console.warn("Fetch failed for " + f + " (Likely CORS issue on file:/// origin)", err);
          }
        }
        
        if (fetched === 0) {
          alert("Failed to read local files! This usually happens if you opened the HTML file directly (file:///). Please host this folder using a local web server (e.g. VS Code Live Server) to enable dynamic zipping.");
          btn.innerHTML = origText;
          btn.style.pointerEvents = "auto";
          return;
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Traffic_Source_Code.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        btn.innerHTML = "&#9989; Downloaded!";
        setTimeout(() => { btn.innerHTML = origText; btn.style.pointerEvents = "auto"; }, 3000);
      } catch(e) {
        console.error(e);
        btn.innerHTML = "&#10060; Error!";
        setTimeout(() => { btn.innerHTML = origText; btn.style.pointerEvents = "auto"; }, 3000);
      }
    };