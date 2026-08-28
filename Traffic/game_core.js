// ── Per-vehicle handling profiles ──
const VEHICLE_STATS = {
  bike:        { maxSpd: 1.35, accel: 0.058, fric: 0.935, turn: 0.088, grip: 0.48 },
  car:         { maxSpd: 1.10, accel: 0.045, fric: 0.945, turn: 0.080, grip: 0.62 },
  car_highway: { maxSpd: 1.25, accel: 0.052, fric: 0.948, turn: 0.080, grip: 0.65 },
  bus:         { maxSpd: 0.80, accel: 0.028, fric: 0.965, turn: 0.045, grip: 0.44 },
  truck:       { maxSpd: 0.90, accel: 0.033, fric: 0.960, turn: 0.050, grip: 0.50 },
  auto:        { maxSpd: 1.00, accel: 0.048, fric: 0.942, turn: 0.082, grip: 0.40 },
};
window.VEHICLE_STATS = VEHICLE_STATS;

// ── Per-vehicle chase camera profiles ──
// dist:     distance behind the vehicle
// height:   camera height above ground
// lookAhead:how far ahead the camera looks (speed-proportional cap)
// lookDist: fixed look-at distance ahead of vehicle
// baseFov:  base field of view (expands with speed)
// fovRange: max additional FOV from speed
// lerpSmoothing: camera lerp factor (higher = snappier)
const VEHICLE_CAM = {
  bike:  { dist: 7.2,  height: 3.8, lookAhead: 2.5, lookDist: 5.0, baseFov: 66, fovRange: 18, lerpSmoothing: 7 },
  car:   { dist: 9.5,  height: 4.8, lookAhead: 3.5, lookDist: 6.5, baseFov: 62, fovRange: 15, lerpSmoothing: 6 },
  bus:   { dist: 16.5, height: 7.5, lookAhead: 5.0, lookDist: 9.0, baseFov: 56, fovRange: 10, lerpSmoothing: 5 },
  truck: { dist: 15.0, height: 7.0, lookAhead: 4.5, lookDist: 8.5, baseFov: 58, fovRange: 12, lerpSmoothing: 5 },
  auto:  { dist: 8.2,  height: 4.2, lookAhead: 3.0, lookDist: 5.2, baseFov: 65, fovRange: 16, lerpSmoothing: 7 },
};
const VEHICLE_CAM_DEFAULT = VEHICLE_CAM.car;

// ════════════════════════════════════════════════════════════════════════════════
// PACEJKA MF 5.2 TIRE MODEL — Full implementation for realistic vehicle physics
// Based on the Pacejka "Magic Formula" tire model (MF 5.2 / MF 6.1 concepts)
// ═════════════════════════════════════════════════════════════════════════════════
const PACEJKA = {
  // ─── Tire coefficient sets per surface type ───
  coefficients: {
    // Dry asphalt (standard road)
    dry_asphalt: {
      // Pure lateral (Fy0)
      pcy1: 1.3, pcy2: 0, pdy1: 1.1, pdy2: 0, pdy3: 0,
      pey1: 0.9, pey2: 0.0, pey3: 0.0, pey4: 0.0, pey5: 0.0,
      // Pure longitudinal (Fx0)
      pcx1: 1.55, pdx1: 1.10, pdx2: 0.0, pdx3: 0.0,
      pex1: 0.2, pex2: 0.0, pex3: 0.0, pex4: 0.0,
      pkx1: 22.0, pkx2: 0.0, pkx3: 0.0,
      phx1: 0.0, phx2: 0.0,
      pvx1: 0.0, pvx2: 0.0,
      // Combined slip
      rbx1: 0.0, rbx2: 0.0, rbx3: 0.0,
      rcx1: 0.0,
      rex1: 0.0, rex2: 0.0,
      rby1: 0.0, rby2: 0.0, rby3: 0.0,
      rcy1: 0.0,
      rey1: 0.0, rey2: 0.0,
      // Load dependency
      pky1: 22.0, pky2: 0.0, pky3: 0.0,
      pvy1: 0.0, pvy2: 0.0, pvy3: 0.0, pvy4: 0.0,
      phy1: 0.0, phy2: 0.0, phy3: 0.0,
    },
    // Wet asphalt
    wet_asphalt: {
      pcy1: 1.2, pcy2: 0, pdy1: 0.9, pdy2: 0, pdy3: 0,
      pey1: 0.8, pey2: 0.0, pey3: 0.0, pey4: 0.0, pey5: 0.0,
      pcx1: 1.45, pdx1: 0.90, pdx2: 0.0, pdx3: 0.0,
      pex1: 0.15, pex2: 0.0, pex3: 0.0, pex4: 0.0,
      pkx1: 18.0, pkx2: 0.0, pkx3: 0.0,
      phx1: 0.0, phx2: 0.0,
      pvx1: 0.0, pvx2: 0.0,
      rbx1: 0.0, rbx2: 0.0, rbx3: 0.0,
      rcx1: 0.0,
      rex1: 0.0, rex2: 0.0,
      rby1: 0.0, rby2: 0.0, rby3: 0.0,
      rcy1: 0.0,
      rey1: 0.0, rey2: 0.0,
      pky1: 18.0, pky2: 0.0, pky3: 0.0,
      pvy1: 0.0, pvy2: 0.0, pvy3: 0.0, pvy4: 0.0,
      phy1: 0.0, phy2: 0.0, phy3: 0.0,
    },
    // Gravel/dirt
    gravel: {
      pcy1: 1.1, pcy2: 0, pdy1: 0.7, pdy2: 0, pdy3: 0,
      pey1: 0.7, pey2: 0.0, pey3: 0.0, pey4: 0.0, pey5: 0.0,
      pcx1: 1.35, pdx1: 0.70, pdx2: 0.0, pdx3: 0.0,
      pex1: 0.1, pex2: 0.0, pex3: 0.0, pex4: 0.0,
      pkx1: 12.0, pkx2: 0.0, pkx3: 0.0,
      phx1: 0.0, phx2: 0.0,
      pvx1: 0.0, pvx2: 0.0,
      rbx1: 0.0, rbx2: 0.0, rbx3: 0.0,
      rcx1: 0.0,
      rex1: 0.0, rex2: 0.0,
      rby1: 0.0, rby2: 0.0, rby3: 0.0,
      rcy1: 0.0,
      rey1: 0.0, rey2: 0.0,
      pky1: 12.0, pky2: 0.0, pky3: 0.0,
      pvy1: 0.0, pvy2: 0.0, pvy3: 0.0, pvy4: 0.0,
      phy1: 0.0, phy2: 0.0, phy3: 0.0,
    }
  },

  // ─── Core Pacejka Magic Formula (MF 5.2) ───
  // Fy = D * sin(C * arctan(B * alpha - E * (B * alpha - arctan(B * alpha)))) + Sv
  // Fx = D * sin(C * arctan(B * kappa - E * (B * kappa - arctan(B * kappa)))) + Sv
  computeLateralForce(alpha, Fz, camber, surfaceType = 'dry_asphalt') {
    const c = this.coefficients[surfaceType] || this.coefficients.dry_asphalt;
    const Fz0 = 3000; // Nominal load (N)

    // Normalized load
    const dfz = (Fz - Fz0) / Fz0;

    // Shape factor
    const C = c.pcy1;

    // Peak factor D
    const D = (c.pdy1 + c.pdy2 * dfz) * (1 - c.pdy3 * camber * camber) * Fz;

    // Stiffness factor B
    const BCD = c.pky1 * Fz0 * (1 + c.pky2 * dfz) * (1 + c.pky3 * camber);
    const B = BCD / (C * D + 1e-6);

    // Curvature factor E
    const E = c.pey1 + c.pey2 * dfz + c.pey3 * camber + c.pey4 * camber * camber + c.pey5 * dfz * camber;

    // Horizontal shift (camber effect)
    const Sh = c.phy1 + c.phy2 * dfz + c.phy3 * camber;

    // Vertical shift (camber force)
    const Sv = (c.pvy1 + c.pvy2 * dfz + c.pvy3 * camber) * Fz;

    const alpha_adj = alpha + Sh;
    const t = B * alpha_adj;

    const Fy = D * Math.sin(C * Math.atan(t - E * (t - Math.atan(t)))) + Sv;

    return { Fy, mu: Math.abs(Fy) / (Fz + 1e-6) };
  },

  computeLongitudinalForce(kappa, Fz, camber, surfaceType = 'dry_asphalt') {
    const c = this.coefficients[surfaceType] || this.coefficients.dry_asphalt;
    const Fz0 = 3000;

    const dfz = (Fz - Fz0) / Fz0;

    // Pure longitudinal
    const C = c.pcx1;
    const D = (c.pdx1 + c.pdx2 * dfz) * (1 - c.pdx3 * camber * camber) * Fz;
    const BCD = c.pkx1 * Fz0 * (1 + c.pkx2 * dfz) * (1 - c.pkx3 * camber * camber);
    const B = BCD / (C * D + 1e-6);
    const E = c.pex1 + c.pex2 * dfz + c.pex3 * camber + c.pex4 * camber * camber;

    const Sh = c.phx1 + c.phx2 * dfz;
    const Sv = (c.pvx1 + c.pvx2 * dfz) * Fz;

    const kappa_adj = kappa + Sh;
    const t = B * kappa_adj;

    const Fx = D * Math.sin(C * Math.atan(t - E * (t - Math.atan(t)))) + Sv;

    return { Fx, mu: Math.abs(Fx) / (Fz + 1e-6) };
  },

  // Combined slip (Fx, Fy) using friction ellipse approximation
  computeCombinedForce(alpha, kappa, Fz, camber, surfaceType = 'dry_asphalt') {
    const lat = this.computeLateralForce(alpha, Fz, camber, surfaceType);
    const lon = this.computeLongitudinalForce(kappa, Fz, camber, surfaceType);

    // Friction ellipse: (Fx/Fx0)^2 + (Fy/Fy0)^2 <= 1
    const Fy0 = lat.Fy;
    const Fx0 = lon.Fx;
    const Fy_max = lat.mu * Fz;
    const Fx_max = lon.mu * Fz;

    // Simple ellipse scaling
    const ellipse = (Fx0 * Fx0) / (Fx_max * Fx_max) + (Fy0 * Fy0) / (Fy_max * Fy_max);
    let scale = 1.0;
    if (ellipse > 1.0) {
      scale = 1.0 / Math.sqrt(ellipse);
    }

    return {
      Fx: Fx0 * scale,
      Fy: Fy0 * scale,
      mu_x: lon.mu * scale,
      mu_y: lat.mu * scale,
      slip_ratio: kappa,
      slip_angle: alpha
    };
  },

  // Get surface type from material/zone
  getSurfaceType(zone, isWet, hasPuddles) {
    if (hasPuddles) return 'wet_asphalt';
    if (isWet) return 'wet_asphalt';
    if (zone === 'gravel' || zone === 'rural') return 'gravel';
    return 'dry_asphalt';
  }
};

// ─── Vehicle-specific Pacejka configs ───
const VEHICLE_PACEJKA_CONFIG = {
  car: {
    mass: 1400,
    wheelbase: 2.7,
    track_width: 1.5,
    cg_height: 0.55,
    front_weight_dist: 0.60,
    front_cornering_stiffness: 55000,
    rear_cornering_stiffness: 55000,
    front_longitudinal_stiffness: 60000,
    rear_longitudinal_stiffness: 60000,
    max_brake_force: 8000,
    max_drive_force: 4000,
    front_brake_bias: 0.7,
    inertia_yaw: 2800,
    front_track: 1.5,
    rear_track: 1.5,
  },
  bike: {
    mass: 200,
    wheelbase: 1.4,
    track_width: 0.3,
    cg_height: 0.6,
    front_weight_dist: 0.50,
    front_cornering_stiffness: 15000,
    rear_cornering_stiffness: 15000,
    front_longitudinal_stiffness: 20000,
    rear_longitudinal_stiffness: 20000,
    max_brake_force: 3000,
    max_drive_force: 2000,
    front_brake_bias: 0.8,
    inertia_yaw: 50,
    front_track: 0.3,
    rear_track: 0.3,
  },
  bus: {
    mass: 12000,
    wheelbase: 6.0,
    track_width: 2.0,
    cg_height: 1.8,
    front_weight_dist: 0.55,
    front_cornering_stiffness: 200000,
    rear_cornering_stiffness: 200000,
    front_longitudinal_stiffness: 150000,
    rear_longitudinal_stiffness: 150000,
    max_brake_force: 40000,
    max_drive_force: 20000,
    front_brake_bias: 0.65,
    inertia_yaw: 80000,
    front_track: 2.0,
    rear_track: 2.0,
  },
  truck: {
    mass: 18000,
    wheelbase: 4.5,
    track_width: 2.0,
    cg_height: 2.0,
    front_weight_dist: 0.50,
    front_cornering_stiffness: 180000,
    rear_cornering_stiffness: 220000,
    front_longitudinal_stiffness: 200000,
    rear_longitudinal_stiffness: 200000,
    max_brake_force: 60000,
    max_drive_force: 30000,
    front_brake_bias: 0.60,
    inertia_yaw: 120000,
    front_track: 2.0,
    rear_track: 2.0,
  },
  auto: {
    mass: 400,
    wheelbase: 2.0,
    track_width: 1.2,
    cg_height: 0.7,
    front_weight_dist: 0.65,
    front_cornering_stiffness: 12000,
    rear_cornering_stiffness: 12000,
    front_longitudinal_stiffness: 15000,
    rear_longitudinal_stiffness: 15000,
    max_brake_force: 2000,
    max_drive_force: 1500,
    front_brake_bias: 0.75,
    inertia_yaw: 200,
    front_track: 1.2,
    rear_track: 1.2,
  }
};

const PACEJKA_GLOBAL = PACEJKA;

// ── Theme-based road templates for levels 16-50 ──
// Generates road configs from themeType so we don't need 35 manual M entries.
function _getThemeRoads(themeType) {
  const t = themeType || 'urban_grid';
  const templates = {
     free_roam: {
       name: 'Free Roam City', sky: 0x87b6d8, fog: 1200, ground: 0x4a7c59, amb: 0.6, veh: 'car',
       npcTypes: ['car','car','bike','auto','bus','truck','car','bike','taxi','car','auto','car','car','bike','bus','car'],
       timeLimit: 0,
       noTimer: true,
       noScore: true,
       noObjective: true,
       tasks: [],
       useLowPolyCity: true,
       // No roads — WorldStreamer handles procedural city generation
       roads: [],
       route: [],
       npcs: []
     },
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
              { x:120,z:480 },{ x:240,z:480 },{ x:360,z:480 },{ x:360,z:360 },{ x:360,z:240 },{ x:360,z:120 },{ x:360,z:0 },{ x:360,z:-120 },{ x:360,z:-240 },{ x:360,z:-360 },{ x:360,z:-480 }],
      npcs: [
        { type:'taxi', color:0xffcc00, route:[[-360,-480],[-360,-240],[-360,0],[-360,240],[-360,480],[-240,480],[-120,480],[0,480]] },
        { type:'auto', color:0xff8800, route:[[0,480],[0,360],[0,240],[0,120],[0,0],[0,-120],[0,-240],[0,-360],[0,-480]] },
        { type:'car', color:0x2288ff, route:[[360,-480],[360,-240],[360,0],[360,240],[360,480]] }
      ]
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
              { x:-240,z:-480 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:480 }],
      npcs: [
        { type:'taxi', color:0xffcc00, route:[[240,-480],[240,-240],[240,0],[240,240],[240,480]] },
        { type:'car', color:0xff3333, route:[[0,480],[0,240],[0,0],[0,-240],[0,-480]] }
      ]
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
              { x:-400,z:-240 },{ x:-400,z:-400 },{ x:-240,z:-400 },{ x:0,z:-400 },{ x:240,z:-400 }],
      npcs: [
        { type:'truck', color:0x884400, route:[[-600,60],[-240,60],[0,60],[240,60],[480,60]] },
        { type:'bus', color:0x0044aa, route:[[480,-240],[480,0],[480,240],[360,360],[240,360]] }
      ]
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
              { x:0,z:240 },              { x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 }],
      npcs: [
        { type:'taxi', color:0xffcc00, route:[[0,0],[0,-240],[-240,-240],[-240,0]] },
        { type:'car', color:0x2288ff, route:[[240,240],[240,0],[240,-240],[0,-240]] }
      ]
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
              { x:-240,z:-600 },{ x:-240,z:-360 },{ x:-240,z:0 },{ x:-240,z:360 },{ x:-240,z:600 }],
      npcs: [
        { type:'ambulance', color:0xffffff, route:[[0,-600],[0,-360],[0,0],[0,360],[0,600]] },
        { type:'car', color:0x444444, route:[[-240,-600],[-240,-360],[-240,0],[-240,360]] },
        { type:'bus', color:0x0044aa, route:[[240,600],[240,360],[240,0],[240,-360],[240,-600]] }
      ]
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
              { x:200,z:0 },{ x:200,z:200 },{ x:0,z:200 },{ x:-200,z:200 }],
      npcs: [
        { type:'car', color:0x3366cc, route:[[-200,0],[-200,-200],[0,-200],[200,-200],[200,0]] },
        { type:'auto', color:0xff6600, route:[[0,0],[0,200],[-200,200],[-200,0]] }
      ]
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
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }],
      npcs: [
        { type:'car', color:0x555555, route:[[0,-400],[0,-200],[0,0],[0,200],[0,400]] },
        { type:'bike', color:0x00cc66, route:[[-200,400],[-200,200],[-200,0],[-200,-200],[-200,-400]] }
      ]
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
              { x:-160,z:-400 },{ x:-160,z:-200 },{ x:-160,z:0 },{ x:-160,z:200 },{ x:-160,z:400 }],
      npcs: [
        { type:'auto', color:0xff8800, route:[[0,-400],[0,-200],[0,0],[0,200],[0,400]] },
        { type:'bike', color:0x00cc44, route:[[160,-400],[160,-200],[160,0],[160,200],[160,400]] }
      ]
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
              { x:-300,z:-200 },{ x:-200,z:-200 },{ x:0,z:-200 },{ x:200,z:-200 },{ x:300,z:-200 }],
      npcs: [
        { type:'car', color:0x2266cc, route:[[-300,0],[-200,0],[0,0],[200,0],[300,0],[300,200],[200,200]] },
        { type:'car', color:0xcc3333, route:[[300,-200],[200,-200],[0,-200],[-200,-200],[-300,-200]] }
      ]
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
              { x:0,z:200 },              { x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 }],
      npcs: [
        { type:'auto', color:0xff6600, route:[[0,-200],[-200,-200],[-200,0],[-200,200],[0,200]] },
        { type:'auto', color:0xff8800, route:[[200,-200],[200,0],[200,200],[0,200],[-200,200]] },
        { type:'auto', color:0xffaa00, route:[[-200,0],[0,0],[200,0],[200,-200],[0,-200]] }
      ]
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
              { x:300,z:-60 },{ x:100,z:-60 },{ x:-100,z:-60 },{ x:-300,z:-60 },{ x:-500,z:-60 },{ x:-700,z:-60 }],
      npcs: [
        { type:'truck', color:0x884400, route:[[-700,60],[-500,60],[-300,60],[-100,60],[100,60],[300,60],[500,60],[700,60]] },
        { type:'bus', color:0x0044aa, route:[[700,-60],[500,-60],[300,-60],[100,-60],[-100,-60],[-300,-60],[-500,-60],[-700,-60]] }
      ]
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
              { x:-240,z:-400 },{ x:-240,z:-200 },{ x:-240,z:0 },{ x:-240,z:200 },{ x:-240,z:400 }],
      npcs: [
        { type:'truck', color:0x664422, route:[[0,-400],[0,-200],[0,0],[0,200],[0,400]] },
        { type:'car', color:0x336699, route:[[-240,400],[-240,200],[-240,0],[-240,-200],[-240,-400]] }
      ]
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
              { x:300,z:-400 },              { x:-300,z:-400 },{ x:-300,z:0 },{ x:-300,z:400 }],
      npcs: [
        { type:'truck', color:0x556633, route:[[0,-400],[0,0],[0,400]] },
        { type:'bus', color:0x0044aa, route:[[300,400],[300,0],[300,-400]] }
      ]
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
              { x:-240,z:600 },{ x:-240,z:360 },{ x:-240,z:0 },{ x:-240,z:-360 },{ x:-240,z:-600 }],
      npcs: [
        { type:'bus', color:0x0066cc, route:[[0,-600],[0,-360],[0,0],[0,360],[0,600]] },
        { type:'bus', color:0x004499, route:[[0,600],[0,360],[0,0],[0,-360],[0,-600]] },
        { type:'car', color:0x888888, route:[[-240,-600],[-240,-360],[-240,0],[-240,360],[-240,600]] }
      ]
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
              { x:-240,z:-500 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:500 }],
      npcs: [
        { type:'truck', color:0x885533, route:[[0,-500],[0,-240],[0,0],[0,240],[0,500]] },
        { type:'car', color:0x4477aa, route:[[240,-500],[240,-240],[240,0],[240,240],[240,500]] }
      ]
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
              { x:500,z:-200 },{ x:300,z:-200 },{ x:100,z:-200 },{ x:-100,z:-200 },{ x:-300,z:-200 },{ x:-500,z:-200 }],
      npcs: [
        { type:'taxi', color:0xffcc00, route:[[-500,60],[-300,60],[-100,60],[100,60],[300,60],[500,60]] },
        { type:'car', color:0x445566, route:[[500,-200],[300,-200],[100,-200],[-100,-200],[-300,-200],[-500,-200]] }
      ]
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
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }],
      npcs: [
        { type:'car', color:0x445566, route:[[0,-400],[0,-200],[0,0],[0,200],[0,400]] },
        { type:'bike', color:0x00aa66, route:[[200,-400],[200,-200],[200,0],[200,200],[200,400]] }
      ]
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
              { x:0,z:240 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 },{ x:0,z:-240 }],
      npcs: [
        { type:'auto', color:0xff6600, route:[[-240,-240],[0,-240],[240,-240],[240,0],[240,240],[0,240]] },
        { type:'car', color:0xcc2222, route:[[0,0],[0,240],[-240,240],[-240,0],[-240,-240],[0,-240]] },
        { type:'bike', color:0x00cc44, route:[[240,-240],[0,-240],[-240,-240],[-240,0],[-240,240]] }
      ]
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
              { x:200,z:400 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 },{ x:200,z:-400 }],
      npcs: [
        { type:'bike', color:0x00cc66, route:[[-200,-300],[-200,0],[-200,300]] },
        { type:'bike', color:0x00aa44, route:[[200,-300],[200,0],[200,300]] },
        { type:'car', color:0x667788, route:[[0,-500],[0,0],[0,500]] }
      ]
    },
    grand_test: {
      name: 'Grand Test — Final Exam', sky: 0x1a2a3a, fog: 350, ground: 0x2a3a2a, amb: 0.45, veh: 'car',
      npcTypes: ['car','car','truck','bus','bike','auto','taxi','car','truck','bike','car','auto','bus','truck','car','bike','car','auto','car','truck','taxi','bus','bike','car'],
      hasRain: true, hasPuddles: true, isNight: true, speedLimit: 40,
      roads: [
        { type:'v', x:-480, z1:-600, z2:600 }, { type:'v', x:-360, z1:-600, z2:600 },
        { type:'v', x:-240, z1:-600, z2:600 }, { type:'v', x:-120, z1:-600, z2:600 },
        { type:'v', x:0,    z1:-600, z2:600 }, { type:'v', x:120,  z1:-600, z2:600 },
        { type:'v', x:240,  z1:-600, z2:600 }, { type:'v', x:360,  z1:-600, z2:600 },
        { type:'v', x:480,  z1:-600, z2:600 },
        { type:'h', z:-600, x1:-480, x2:480 }, { type:'h', z:-480, x1:-480, x2:480 },
        { type:'h', z:-360, x1:-480, x2:480 }, { type:'h', z:-240, x1:-480, x2:480 },
        { type:'h', z:-120, x1:-480, x2:480 }, { type:'h', z:0,    x1:-480, x2:480 },
        { type:'h', z:120,  x1:-480, x2:480 }, { type:'h', z:240,  x1:-480, x2:480 },
        { type:'h', z:360,  x1:-480, x2:480 }, { type:'h', z:480,  x1:-480, x2:480 },
        { type:'h', z:600,  x1:-480, x2:480 }
      ],
      route: [
        { x:0,z:-600 },{ x:0,z:-360 },{ x:0,z:-120 },{ x:0,z:120 },{ x:0,z:360 },{ x:0,z:600 },
        { x:240,z:600 },{ x:240,z:360 },{ x:240,z:120 },{ x:240,z:-120 },{ x:240,z:-360 },{ x:240,z:-600 },
        { x:-240,z:-600 },{ x:-240,z:-360 },{ x:-240,z:-120 },{ x:-240,z:120 },{ x:-240,z:360 },{ x:-240,z:600 },
        { x:480,z:600 },{ x:480,z:240 },{ x:480,z:-120 },{ x:480,z:-480 },
        { x:240,z:-480 },{ x:0,z:-480 },{ x:-240,z:-480 },{ x:-480,z:-480 },
        { x:-480,z:-120 },{ x:-480,z:240 },{ x:-480,z:600 }
      ],
      npcs: [
        { type:'taxi', color:0xffcc00, route:[[0,-600],[0,0],[0,600],[240,600],[240,0],[240,-600]] },
        { type:'bus', color:0x0044aa, route:[[240,600],[240,0],[240,-600],[0,-600],[0,0],[0,600]] },
        { type:'truck', color:0x884400, route:[[-240,-600],[-240,0],[-240,600],[-480,600],[-480,0],[-480,-600]] },
        { type:'car', color:0xff3333, route:[[480,-480],[480,240],[240,240],[0,240],[-240,240],[-480,240]] },
        { type:'bike', color:0x00cc66, route:[[360,-600],[360,-120],[120,-120],[-120,-120],[-360,-120]] },
        { type:'auto', color:0xff6600, route:[[-360,600],[-360,120],[-120,120],[120,120],[360,120],[360,600]] },
        { type:'truck', color:0x664422, route:[[480,600],[480,-120],[240,-120],[0,-120],[-240,-120],[-480,-120]] },
        { type:'car', color:0x445566, route:[[0,-600],[-240,-600],[-480,-600],[-480,-360],[-240,-360],[0,-360]] },
        { type:'taxi', color:0xddcc00, route:[[-480,600],[-480,0],[-480,-480],[-240,-480],[0,-480],[240,-480]] },
        { type:'bus', color:0x0066cc, route:[[480,600],[240,600],[0,600],[-240,600],[-480,600],[-480,360]] },
        { type:'bike', color:0xff8800, route:[[-120,-600],[-120,-360],[120,-360],[120,-120],[-120,-120],[-120,120]] },
        { type:'car', color:0x2233aa, route:[[360,600],[360,360],[120,360],[-120,360],[-360,360],[-360,600]] }
      ]
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
              { x:0,z:200 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 }],
      npcs: [
        { type:'car', color:0x223355, route:[[-200,-200],[-200,0],[-200,200],[0,200],[200,200]] },
        { type:'auto', color:0xdd6600, route:[[200,-200],[0,-200],[-200,-200],[-200,0]] }
      ]
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
              { x:500,z:-200 },{ x:200,z:-200 },{ x:-100,z:-200 },{ x:-400,z:-200 },{ x:-700,z:-200 }],
      npcs: [
        { type:'car', color:0x334455, route:[[-700,60],[-400,60],[200,60],[500,60]] },
        { type:'bus', color:0x0044aa, route:[[500,-200],[200,-200],[-100,-200],[-400,-200],[-700,-200]] }
      ]
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
              { x:0,z:-60 },{ x:-300,z:-60 },{ x:-600,z:-60 },{ x:-900,z:-60 }],
      npcs: [
        { type:'car', color:0x445566, route:[[-900,60],[-300,60],[300,60],[900,60]] },
        { type:'truck', color:0x884400, route:[[900,-60],[300,-60],[-300,-60],[-900,-60]] },
        { type:'car', color:0x336699, route:[[-600,-60],[-300,-60],[0,-60],[300,-60],[600,-60]] }
      ]
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
              { x:0,z:200 },{ x:200,z:200 },{ x:200,z:0 },{ x:200,z:-200 }],
      npcs: [
        { type:'car', color:0x223355, route:[[-200,-200],[-200,0],[-200,200],[0,200],[200,200]] },
        { type:'car', color:0x334466, route:[[200,-200],[0,-200],[-200,-200],[-200,0]] }
      ]
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
              { x:-300,z:-500 },{ x:-300,z:-300 },{ x:-300,z:0 },{ x:-300,z:300 },{ x:-300,z:500 }],
      npcs: [
        { type:'truck', color:0x556633, route:[[0,-500],[0,0],[0,500]] },
        { type:'bus', color:0x0044aa, route:[[-300,500],[-300,0],[-300,-500]] },
        { type:'car', color:0x4477aa, route:[[300,-500],[300,0],[300,500]] }
      ]
    },
    rural: {
      name: 'Rural Roads', sky: 0xa8d4e8, fog: 700, ground: 0x5a7a3a, amb: 0.9, veh: 'car',
      npcTypes: ['car','car','truck','bike','car','auto','car','truck','car','bike','car','auto'],
      roads: [
        { type:'h', z:0,    x1:-600, x2:600 }, { type:'v', x:0,    z1:-600, z2:600 },
        { type:'v', x:-300, z1:-200, z2:200 }, { type:'v', x:300,  z1:-200, z2:200 }
      ],
      route: [{ x:-500,z:0 },{ x:-300,z:0 },{ x:0,z:0 },{ x:300,z:0 },{ x:500,z:0 },
              { x:500,z:-200 },{ x:300,z:-200 },{ x:0,z:-200 },{ x:-300,z:-200 },{ x:-500,z:-200 }],
      npcs: [
        { type:'car', color:0x336699, route:[[-500,0],[0,0],[500,0]] },
        { type:'truck', color:0x884400, route:[[500,-200],[0,-200],[-500,-200]] },
        { type:'bike', color:0x00cc44, route:[[-300,-200],[0,-200],[300,-200]] }
      ]
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
              { x:-240,z:-480 },{ x:-240,z:-360 },{ x:-240,z:0 },{ x:-240,z:360 },{ x:-240,z:480 }],
      npcs: [
        { type:'bus', color:0x0044aa, route:[[0,-480],[0,0],[0,480]] },
        { type:'car', color:0x445566, route:[[240,-480],[240,0],[240,480]] },
        { type:'bike', color:0x00cc66, route:[[-240,-480],[-240,0],[-240,480]] },
        { type:'auto', color:0xff6600, route:[[360,-480],[360,0],[360,480]] }
      ]
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
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }],
      npcs: [
        { type:'car', color:0x445566, route:[[0,-400],[0,0],[0,400]] },
        { type:'auto', color:0xff6600, route:[[200,-400],[200,0],[200,400]] },
        { type:'bike', color:0x00cc66, route:[[-200,400],[-200,0],[-200,-400]] }
      ]
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
              { x:-200,z:-400 },{ x:-200,z:-200 },{ x:-200,z:0 },{ x:-200,z:200 },{ x:-200,z:400 }],
      npcs: [
        { type:'car', color:0x556677, route:[[0,-400],[0,0],[0,400]] },
        { type:'bike', color:0x00cc44, route:[[200,-400],[200,0],[200,400]] }
      ]
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
              { x:-240,z:-500 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:500 }],
      npcs: [
        { type:'car', color:0x445566, route:[[0,-500],[0,0],[0,500]] },
        { type:'car', color:0x336699, route:[[240,500],[240,0],[240,-500]] },
        { type:'auto', color:0xff6600, route:[[-240,-500],[-240,0],[-240,500]] }
      ]
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
              { x:-240,z:-400 },{ x:-240,z:-200 },{ x:-240,z:0 },{ x:-240,z:200 },{ x:-240,z:400 }],
      npcs: [
        { type:'car', color:0x445566, route:[[0,-400],[0,0],[0,400]] },
        { type:'car', color:0x336699, route:[[240,400],[240,0],[240,-400]] },
        { type:'truck', color:0x884400, route:[[-240,-400],[-240,0],[-240,400]] }
      ]
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
              { x:-500,z:-60 },{ x:-800,z:-60 }],
      npcs: [
        { type:'car', color:0x445566, route:[[-800,60],[-200,60],[400,60],[700,60]] },
        { type:'bus', color:0x0044aa, route:[[700,-60],[400,-60],[-200,-60],[-800,-60]] }
      ]
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
              { x:-120,z:200 },{ x:-120,z:120 },{ x:-120,z:0 },{ x:-120,z:-120 },{ x:-120,z:-200 }],
      npcs: [
        { type:'car', color:0x557744, route:[[0,-200],[0,0],[0,200]] },
        { type:'bike', color:0x00cc44, route:[[-120,200],[-120,0],[-120,-200]] }
      ]
    }
  };
  return templates[t] || templates.urban_grid;
}

class LODChunk {
  constructor(x, z, size, scene) {
    this.x = x; this.z = z; this.size = size; this.scene = scene;
    this.activeBuildings = [];
    this.bufferBuildings = [];
    this.distantMesh = null;
    this.state = 'distant'; // 'active', 'buffer', 'distant'
  }

  addBuilding(bldg, detailedMesh, simpleMesh) {
    this.activeBuildings.push(detailedMesh);
    this.bufferBuildings.push(simpleMesh);
  }

  update(playerPos) {
    const d = Math.hypot(this.x - playerPos.x, this.z - playerPos.z);
    const newState = d < 200 ? 'active' : (d < 1000 ? 'buffer' : 'distant');
    if (newState !== this.state) {
      this.state = newState;
      this._applyState();
    }
  }

  _applyState() {
    this.activeBuildings.forEach(m => m.visible = (this.state === 'active'));
    this.bufferBuildings.forEach(m => m.visible = (this.state === 'buffer'));
    if (this.distantMesh) this.distantMesh.visible = (this.state === 'distant');
  }
}

class Game {
      constructor() {
        this.renderCore = null; this.scene = null; this.camera = null; this.player = null;
        this.clock = new THREE.Clock(); this.keys = {}; this.speed = 0; this.maxSpd = 1.1; this.accel = .045; this.fric = .95; this.turn = .065; this.gear = 'N'; this.gcap = 0;
        this.boostFuel = 100; this.maxBoostFuel = 100; this.boosting = false; this._wasDepleted = false;
        this._camTarget = new THREE.Vector3(); this._grip = 0.62; this._camShakeAmt = 0; this._camTilt = 0; this._camFovTarget = 60;
        this.missionManager = new MissionManager(this);
        this.campaignManager = new CampaignManager(this);
        this.playerScore = 0;
        this.rupees = 0;
        this.missionTokens = 0;
        // ── Camera collision raycaster ──
        this._camRay = new THREE.Raycaster();
        this._camRayVec = new THREE.Vector3();
        this._camRayOrigin = new THREE.Vector3();
        // ── Enhanced Physics State ──
        this._bodyRoll = 0; this._bodyPitch = 0; this._suspensionY = 0;
        this._brakeHeat = 0; this._tireWear = 0; this._aeroDrag = 0;
        this._collisionImpulse = new THREE.Vector3(); this._lastCollisionTime = 0;
        this._skidMarks = []; this._sparks = []; this._debris = [];
        this._hitstopTimer = 0; this._damageOverlayOpacity = 0;
        this._crackOverlay = null; this._speedLinesIntensity = 0;
        this._wheelSpin = 0; this._exhaustSmoke = [];
        this._lateralAccel = 0; this._downforceCoeff = 0; this._brakeFadeFactor = 1.0;
        this.playing = false; this.pause = false; this.lightningTimer = 0; this.thunderSfx = null; this.score = 0; this.hp = 100; this.fine = 0; this.vio = 0; this.timer = 0;
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.pedestrianAIs = []; this.routeIdx = 0; this.retries = 0; this.hits = 0;
        this._initViolationsLog();
        this.kidModeActive = false;
        this.lodChunks = [];
        this.gyroOn = false; this.gyroBaseGamma = 0; this._gyroHandler = null;
        this.camYaw = 0; this.camPitch = 0;
        this.targetCamYaw = 0; this.targetCamPitch = 0;
        this._isDraggingMobileLook = false; this._mobileLookTouchId = null;
        this._isDraggingLeft = false; this._isDraggingRight = false;
        this._prevMobileLookX = 0; this._prevMobileLookY = 0;
        this.dom = {}; // Cached DOM elements
        // Mission tracking data
        this._leadVehiclePos = null;
        this._targetVehiclePos = null;
        this._pursuerPositions = [];
        this._childrenGroups = [];
        this._sidewalkViolations = [];
        this._ambulancePos = null;
        this._intersections = [];
        this._lastPlayerPos = null;
        this._hitPotholeThisFrame = false;
        this._prevSpeedForCargo = null;
        this._longitudinalAccel = 0;
        // Day/Night cycle state
        this.timeOfDay = 0.5; // 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
        this.dayNightCycle = false;
        this._dayNightSpeed = 1 / 300; // full cycle in 5 minutes
        this._ambient = null; this._hemi = null; this._moon = null;
        this._streetLights = []; this._windowLights = [];
        this._anchorNodes = []; // Living City Generator: Zoning seeds
        this._dnSkyA = new THREE.Color(); this._dnSkyB = new THREE.Color();
        this._dnFogA = new THREE.Color(); this._dnFogB = new THREE.Color();
        this._dnDawnSky = new THREE.Color(0xf0be88); this._dnDuskSky = new THREE.Color(0x706884);
        this._dnDawnFog = new THREE.Color(0xd0b080); this._dnDuskFog = new THREE.Color(0x5a546a);
        this._dnDaySky = new THREE.Color();
        this._dnTmp = new THREE.Color(); // reusable temp for dusk multiply
        // Pre-allocated reusable vectors (avoid per-frame GC pressure)
        this._v1 = new THREE.Vector3(); this._v2 = new THREE.Vector3();
        this._v3 = new THREE.Vector3(); this._e1 = new THREE.Euler();
        this._clockEl = null;
        
        // Initialize global Three.js object pools (zero-GC gameplay)
        if (window.ThreePools) ThreePools.init(this);
        
        // ─── WORLD STREAMING + FLOATING ORIGIN ───
        this._streaming = {
          chunkSize: 512,
          loadRadius: 2,
          unloadRadius: 4,
          chunks: new Map(),
          loadQueue: [],
          maxLoadsPerFrame: 2,
          anchor: new THREE.Vector3(),
          lastAnchor: new THREE.Vector3(),
          rebaseThreshold: 5000
        };
        
        // Initialize global Three.js object pools (zero-GC gameplay)
        if (window.ThreePools) ThreePools.init(this);
        
        this._initR(); this._initIn(); this._initG(); this._initVirtualJoystick(); this._loop();
        window.addEventListener('resize', () => this._rsz());
        document.addEventListener('fullscreenchange', () => this._rsz());
      }

      _initViolationsLog() {
        this.violationsLog = [];
        const self = this;
        const origPush = this.violationsLog.push.bind(this.violationsLog);
        this.violationsLog.push = function(...items) {
          const res = origPush(...items);
          items.forEach(v => {
            if (self.taskManager && typeof v === 'string' && !v.includes('WARNING') && !v.includes('LOG')) {
              self.taskManager.showViolationCard(v);
            }
          });
          return res;
        };
      }
  
  // ─── CUMULATIVE RULES ENGINE ───
  // Tracks all rules learned across completed levels and enforces them
  static LEARNED_RULES = new Map(); // levelId -> Set of rule IDs
  
  static RULE_DEFINITIONS = {
    // Level 1: Signal Basics
    1: [
      'red_light_stop', 'green_light_go', 'yellow_light_prepare_stop',
      'yield_pedestrians', 'yield_emergency_vehicles', 'stop_line_compliance'
    ],
    // Level 2: Protected Left Turn
    2: [
      'protected_left_turn', 'yield_oncoming_traffic', 'left_turn_signal'
    ],
    // Level 3: Pedestrian Phase
    3: [
      'pedestrian_crosswalk_yield', 'elderly_priority', 'children_priority'
    ],
    // Level 4: Ambulance Priority
    4: [
      'emergency_vehicle_pull_over', 'clear_intersection_for_emergency'
    ],
    // Level 5: Rush Hour
    5: [
      'lane_discipline_rush', 'no_blocking_intersection', 'patience_in_traffic'
    ],
    // Level 6: Zebra Yield
    6: [
      'zebra_crossing_stop', 'pedestrian_right_of_way'
    ],
    // Level 7: School Children
    7: [
      'school_zone_30kmh', 'stop_for_school_children', 'school_crossing_guard'
    ],
    // Level 8: Senior Citizen Cross
    8: [
      'senior_citizen_patience', 'extended_crossing_time'
    ],
    // Level 9: Hawker Zone
    9: [
      'sidewalk_vendor_awareness', 'no_parking_on_sidewalk'
    ],
    // Level 10: Monsoon Puddles
    10: [
      'puddle_slow_down', 'no_splashing_pedestrians', 'increased_following_distance'
    ],
    // Level 11: Single Lane Flow
    11: [
      'single_lane_discipline', 'no_overtaking_single_lane'
    ],
    // Level 12: Overtaking Rules
    12: [
      'safe_overtaking', 'overtaking_signal', 'return_to_lane'
    ],
    // Level 13: Bus Lane Respect
    13: [
      'bus_lane_compliance', 'no_driving_in_bus_lane'
    ],
    // Level 14: Cycle Track
    14: [
      'cycle_lane_respect', 'no_parking_cycle_track', 'cyclist_safety_margin'
    ],
    // Level 15: Gully Navigation
    15: [
      'narrow_road_caution', 'yield_oncoming_in_gully', 'reverse_if_needed'
    ],
    // Level 16: Coastal 40 km/h
    16: [
      'coastal_speed_40', 'speed_limit_adherence', 'ghost_car_following'
    ],
    // Level 17: Beach Parking
    17: [
      'parallel_parking', 'parking_within_lines', 'no_parking_signs'
    ],
    // Level 18: Sunset Cruise
    18: [
      'scenic_driving_caution', 'speed_control_on_curves'
    ],
    // Level 19: Jogger Avoidance
    19: [
      'jogger_path_awareness', 'share_road_with_joggers'
    ],
    // Level 20: High Wind Gusts
    20: [
      'crosswind_compensation', 'bridge_driving_caution', 'truck_sway_awareness'
    ],
    // Level 21: No Honking
    21: [
      'silence_zone_no_horn', 'hospital_silence', 'library_silence'
    ],
    // Level 22: Assembly Dismissal
    22: [
      'school_rush_patience', 'children_road_safety'
    ],
    // Level 23: Ambulance Silencer
    23: [
      'ambulance_approach_silence', 'clear_path_silently'
    ],
    // Level 24: Library Zone
    24: [
      'library_zone_quiet', 'minimal_noise_driving'
    ],
    // Level 25: Exam Season
    25: [
      'exam_area_caution', 'student_pedestrian_awareness'
    ],
    // Level 26: Level Crossing
    26: [
      'railway_crossing_stop', 'gate_timing_patience', 'train_horn_reaction'
    ],
    // Level 27: Gate Timing
    27: [
      'rail_gate_compliance', 'no_crossing_closed_gate'
    ],
    // Level 28: Metro Pillar Nav
    28: [
      'metro_pillar_navigation', 'construction_zone_caution'
    ],
    // Level 29: Train Horn Reaction
    29: [
      'train_horn_awareness', 'sudden_noise_composure'
    ],
    // Level 30: Peak Hour Commute
    30: [
      'commuter_rush_discipline', 'platform_crowd_awareness'
    ],
    // Level 31: High Beam Etiquette
    31: [
      'high_beam_dip', 'night_visibility_courtesy', 'oncoming_traffic_consideration'
    ],
    // Level 32: Drunk Driver Spot
    32: [
      'impaired_driver_recognition', 'safe_distance_erratic', 'report_drunk_driver'
    ],
    // Level 33: Sea Mist Visibility
    33: [
      'fog_driving_caution', 'reduced_visibility_speed', 'fog_lights_usage'
    ],
    // Level 34: Couple Seats
    34: [
      'parked_car_awareness', 'door_zone_caution', 'pedestrian_near_parked'
    ],
    // Level 35: Racer Deterrence
    35: [
      'street_racing_avoidance', 'speed_limit_night', 'peer_pressure_resistance'
    ],
    // Level 36: Narrow Lane Ambulance
    36: [
      'emergency_access_narrow', 'ambulance_priority_alley'
    ],
    // Level 37: Fire Engine Clear
    37: [
      'fire_engine_priority', 'hydrant_access_clear'
    ],
    // Level 38: Police Chase Assist
    38: [
      'police_pursuit_assistance', 'pull_over_for_police'
    ],
    // Level 39: 108 Bike Paramedic
    39: [
      'bike_paramedic_awareness', 'narrow_emergency_access'
    ],
    // Level 40: Disaster Evacuation
    40: [
      'evacuation_route_following', 'calm_under_pressure', 'emergency_lane_discipline'
    ],
    // Level 41: Waterlogged Roads
    41: [
      'flooded_road_assessment', 'hydroplaning_prevention', 'engine_protection_water'
    ],
    // Level 42: Pothole Slalom
    42: [
      'pothole_avoidance', 'suspension_care', 'sudden_swerve_avoidance'
    ],
    // Level 43: Open Manhole
    43: [
      'manhole_hazard_awareness', 'road_damage_reporting'
    ],
    // Level 44: Zero Visibility
    44: [
      'blind_rain_navigation', 'pull_over_zero_vis', 'hazard_lights_heavy_rain'
    ],
    // Level 45: Stranded Vehicle
    45: [
      'stranded_motorist_assistance', 'breakdown_safety_procedure', 'warning_triangle_usage'
    ],
    // Level 46: Lane Discipline 80
    46: [
      'highway_lane_discipline', 'overtaking_lane_only', 'cruise_control_usage'
    ],
    // Level 47: Exit Merge
    47: [
      'highway_merge_signal', 'match_speed_merge', 'exit_lane_early'
    ],
    // Level 48: Toll Plaza Flow
    48: [
      'toll_plaza_preparation', 'exact_change_ready', 'lane_selection_early'
    ],
    // Level 49: Breakdown Shoulder
    49: [
      'shoulder_usage_emergency', 'breakdown_procedure_highway', 'reflective_vest'
    ],
    // Level 50: Convoy Escort
    50: [
      'vip_convoy_protocol', 'convoy_formation_maintenance', 'communication_discipline'
    ],
    // Level 51: Monsoon Nightmare
    51: [
      'extreme_weather_navigation', 'combined_hazard_management'
    ],
    // Level 52: Protocol Drive
    52: [
      'vip_protocol_compliance', 'ceremonial_driving_precision'
    ]
  };
  
  // Get all rules learned up to and including a level
  static getLearnedRulesUpTo(levelId) {
    const rules = new Set();
    for (let i = 1; i <= levelId; i++) {
      const levelRules = this.RULE_DEFINITIONS[i] || [];
      levelRules.forEach(r => rules.add(r));
    }
    return rules;
  }
  
  // Check if a rule is already learned (should be strictly enforced)
  static isRuleLearned(ruleId, currentLevelId) {
    const learned = this.getLearnedRulesUpTo(currentLevelId - 1);
    return learned.has(ruleId);
  }
  
  // Register rules for a completed level
  registerLevelRules(levelId) {
    const G = window.Game || Game;
    if (G.LEARNED_RULES && !G.LEARNED_RULES.has(levelId)) {
      const rules = (G.RULE_DEFINITIONS && G.RULE_DEFINITIONS[levelId]) || [];
      G.LEARNED_RULES.set(levelId, new Set(rules));
      console.log(`[Rules Engine] Registered ${rules.length} rules for Level ${levelId}`);
    }
  }
  
  // Check violation against cumulative rules
  checkCumulativeViolation(ruleId, currentLevelId) {
    const G = window.Game || Game;
    if (G && typeof G.isRuleLearned === 'function' && G.isRuleLearned(ruleId, currentLevelId)) {
      // Rule was learned in a previous level - strict enforcement
      return { enforce: true, severity: 'challan', message: `Repeated violation: ${ruleId} (learned in earlier level)` };
    }
    // First time encountering this rule - warning only
    return { enforce: false, severity: 'warning', message: `First reminder: ${ruleId}` };
  }

      // ── Supabase Cloud Sync ──
      async _syncWalletToSupabase(amount, type, source) {
        try {
          if (!window.supabaseClient || !window.colUser) return;
          const userId = window.colUser.id;
          if (!userId) return;
          await window.supabaseClient.rpc('upsert_wallet_balance', {
            p_user_id: userId,
            p_amount: Math.abs(amount),
            p_type: type,
            p_source: source,
            p_level_id: this.lvId || null
          });
        } catch (e) {
          console.warn('Wallet sync failed:', e);
        }
      }

      async _syncCivicToSupabase() {
        try {
          if (!window.supabaseClient || !window.colUser) return;
          const userId = window.colUser.id;
          if (!userId) return;
          await window.supabaseClient.from('civic_scores').upsert({
            user_id: userId,
            score: window.S?.civicScore || 0,
            level_id: this.lvId || null,
            violations: this.vio || 0,
            recorded_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        } catch (e) {
          console.warn('Civic sync failed:', e);
        }
      }

      async _syncSessionToSupabase(completed) {
        try {
          if (!window.supabaseClient || !window.colUser) return;
          const userId = window.colUser.id;
          if (!userId) return;
          await window.supabaseClient.from('game_sessions').insert({
            user_id: userId,
            level_id: this.lvId || 0,
            wallet_balance: window.S?.wallet || 50000,
            civic_score: window.S?.civicScore || 0,
            total_score: this.score || 0,
            play_time_seconds: Math.floor(this.timer || 0),
            completed: completed,
            ended_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Session sync failed:', e);
        }
      }

      _initGyro() {
        if (!('DeviceOrientationEvent' in window)) return;
        window.addEventListener('deviceorientation', (e) => {
          if (!this.gyroOn || !this._gyroSensing) return;
          // beta: -180 to 180 (tilt front/back), gamma: -90 to 90 (tilt left/right)
          const b = e.beta;
          const g = e.gamma;
          if (b === null || g === null) return;

          // Calibrate: use a small deadzone and offset
          const deltaYaw = (g - this._gyroOffset.gamma) * 0.005;
          const deltaPitch = (b - this._gyroOffset.beta) * 0.005;

          this.targetCamYaw -= deltaYaw;
          this.targetCamPitch -= deltaPitch;
          this.targetCamPitch = Math.max(-1.2, Math.min(1.2, this.targetCamPitch));
        });
      }

      async requestGyroPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
              this.gyroOn = true;
              this._gyroSensing = true;
              // Calibration: assume current orientation is center
              window.addEventListener('deviceorientation', (e) => {
                this._gyroOffset.beta = e.beta;
                this._gyroOffset.gamma = e.gamma;
              }, { once: true });
              toast('Gyroscope Active! 🧭', '#34d399');
            } else {
              toast('Gyroscope permission denied.', '#ef4444');
            }
          } catch (e) {
            console.error("Gyro permission error:", e);
            toast('Error requesting Gyro access.', '#ef4444');
          }
        } else {
          // Non-iOS or older browser
          this.gyroOn = true;
          this._gyroSensing = true;
          toast('Gyroscope Enabled!', '#34d399');
        }
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

        this.rendererDom = cv;
        this.renderCore = new RenderCore();
        this.renderCore.init(this.rendererDom);
        // Setup post-processing (bloom, etc.) based on quality preset
        this.renderCore.setupPostProcessing(innerWidth, innerHeight, isMobile);
        this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(65, w / h, .1, 350);

        // Post-processing (bloom) handled entirely by RenderCore.
        // No separate EffectComposer needed here.
        this.composer = null;
        
        // Cache DOM elements to prevent query overhead per frame
        const ids = ['3c', 'gspd', 'garc', 'htmr', 'hfin', 'hfill', 'hcp', 'da', 'da-arrow', 'dal', 'da-dist', 'ow', 'sig-ind', 'sind-lamp', 'sind-state', 'sind-dist', 'sind-timer', 'mmc', 'boostgauge', 'boost-arc', 'boost-pct', 'boost-vignette', 'boost-ready', 'speed-lines', 'phone-gps', 'phone-gps-arrow', 'phone-gps-dist', 'phone-gps-dir', 'phone-gps-obj', 'phone-gps-btn', 'dn-clock', 'dn-time', 'dn-icon', 'hsc', 'hwallet', 'mission-tokens', 'player-hud-card', 'hlv'];
        ids.forEach(id => { this.dom[id] = document.getElementById(id); });
        // ── Immediately size the canvas to the viewport ──
        // Without this initial call the renderer defaults to 300×150 and only
        // resizes on the first window resize event, causing a corner render.
        this._rsz();
      }
      _rsz() { if (!this.renderCore.renderer) return; const maxW = 1920, maxH = 1080; const isMobile = this._isMobile; let w = innerWidth, h = innerHeight; let dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 2); if (w * dpr > maxW) dpr = maxW / w; if (h * dpr > maxH) dpr = maxH / h; this._dpr = dpr; this.renderCore.renderer.setSize(w * dpr, h * dpr, false); if (this.renderCore.renderer.domElement && this.renderCore.renderer.domElement.style) { this.renderCore.renderer.domElement.style.width = w + 'px'; this.renderCore.renderer.domElement.style.height = h + 'px'; } if (this.composer) { this.composer.setSize(w * dpr, h * dpr); } this.renderCore.resizePostProcessing(w, h); if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); } this._checkOrientation(); }

      _checkOrientation() {
        if (!this._isMobile) return;
        const isPortrait = window.innerHeight > window.innerWidth;
        const overlay = document.getElementById('rotate-device-overlay');
        if (isPortrait) {
          if (overlay) overlay.classList.add('on');
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary').catch(() => {});
          }
        } else {
          if (overlay) overlay.classList.remove('on');
        }
      }
      _initIn() {
        // ── GYRO CONTROLS ──
        this._gyroSensing = false;
        this._gyroOffset = { beta: 0, gamma: 0 };
        this._initGyro();

        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            this._lastInputTime = this.timer;
            if (this._idleHintShown) { this._idleHintShown = false; const h = document.getElementById('idle-hint'); if (h) h.style.display = 'none'; }
            const gm = { p: 'P', r: 'R', n: 'N', d: 'D', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5' };
            if (gm[e.key.toLowerCase()]) this.setGear(gm[e.key.toLowerCase()]);
            if (e.key === ' ') this._horn();
            if (e.key.toLowerCase() === 'b') this._brake();
            if (e.key.toLowerCase() === 'h') this.toggleHighBeam();
            if (e.key.toLowerCase() === 'q') this.toggleTurnSignal(-1);
            if (e.key.toLowerCase() === 'e') this.toggleTurnSignal(1);
            if (e.key.toLowerCase() === 'm') this.togglePhoneGps();
             if (e.key === 'Escape') this.togglePause();
             // ── SPEED CONTROLS ──
             if (e.key.toLowerCase() === 'c') this.toggleCruiseControl && this.toggleCruiseControl();
             if (e.key.toLowerCase() === 'l') this.toggleSpeedLimiter && this.toggleSpeedLimiter();
             if (e.key.toLowerCase() === 'z') { const modes = ['ECO','CITY','SPORT']; const i = modes.indexOf(this.driveMode || 'CITY'); this.setDriveMode && this.setDriveMode(modes[(i - 1 + modes.length) % modes.length]); }
             if (e.key.toLowerCase() === 'x') { const modes = ['ECO','CITY','SPORT']; const i = modes.indexOf(this.driveMode || 'CITY'); this.setDriveMode && this.setDriveMode(modes[(i + 1) % modes.length]); }
             if (e.key === '+' || e.key === '=') this.adjustCruiseSpeed && this.adjustCruiseSpeed(5);
             if (e.key === '-') this.adjustCruiseSpeed && this.adjustCruiseSpeed(-5);
         });

         window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

          // Show mobile pause button on touch devices
          if (this._useTouchControls()) {
            const pauseBtn = document.getElementById('mobile-pause-btn');
            if (pauseBtn) {
              pauseBtn.style.display = 'flex';
              pauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
              });
              pauseBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
              });
            }
          }

        // Camera always stays in third-person chase mode.
        // Left/right look is handled by click-drag orbit handlers below.
        this._lastPointerUnlock = 0;
        this.isPointerLocked = false;
         document.addEventListener('mousemove', (e) => {
           if (this.isPointerLocked) {
             if (this.isPedestrian) {
               if (this.player) this.player.rotation.y -= e.movementX * 0.003;
             } else {
               this.targetCamYaw -= e.movementX * 0.003;
               this.targetCamYaw = Math.max(-2.5, Math.min(2.5, this.targetCamYaw));
             }
             this.targetCamPitch = Math.max(-1.5, Math.min(1.5, this.targetCamPitch));
           } else if (this._isDraggingCamera) {
             this.targetCamYaw -= e.movementX * 0.005;
             this.targetCamYaw = Math.max(-2.5, Math.min(2.5, this.targetCamYaw));
             this.targetCamPitch -= e.movementY * 0.005;
             this.targetCamPitch = Math.max(-1.5, Math.min(1.5, this.targetCamPitch));
           }
         });
        // Left-click drag for third-person camera orbit (desktop only)
        if (this.renderCore.renderer && this.renderCore.renderer.domElement) {
          this.renderCore.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.playing && !this.pause && !this.isPointerLocked && (!e.pointerType || e.pointerType === 'mouse') && !('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
              this._isDraggingLeft = true;
              this._isDraggingCamera = true;
            }
            // Right-click also enables camera drag (more intuitive for desktop users)
            if (e.button === 2 && this.playing && !this.pause && !this.isPointerLocked) {
              this._isDraggingRight = true;
              this._isDraggingCamera = true;
            }
          });
          window.addEventListener('mouseup', (e) => {
            if (e.button === 0 || e.button === 2) {
              if (e.button === 0) this._isDraggingLeft = false;
              if (e.button === 2) this._isDraggingRight = false;
              if (!this._isDraggingLeft && !this._isDraggingRight) this._isDraggingCamera = false;
            }
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
            while (angle > 180) angle -= 360;
            while (angle < -180) angle += 360;
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
          };
          swC.addEventListener('touchend', up);
          swC.addEventListener('touchcancel', up);
          window.addEventListener('mouseup', up);
        }

        bindTouch('mc-gas', 'arrowup');
        bindTouch('mc-brake', 'arrowdown');
        bindTouch('mc-boost', 'shift');
        bindTouch('mc-enter', 'f');

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
        this._gyroSamples = [];
        this._straightSince = null;
        this._startGyro = () => {
          if (this._gyroHandler) return;
          this._gyroHandler = (e) => {
            let steerValue = 0;
            let ori = window.orientation || 0;
            if (ori === 90) steerValue = e.beta;
            else if (ori === -90 || ori === 270) steerValue = -e.beta;
            else steerValue = e.gamma;
            
            if (steerValue !== null && steerValue !== undefined) this._lastGyroGamma = steerValue;
            if (steerValue !== null && steerValue !== undefined && this._calibrating) this._gyroSamples.push(steerValue);
            if (steerValue !== null && steerValue !== undefined && this.gyroOn && this.playing && !this.isPedestrian && !this._calibrating) {
              // Increased sensitivity: full lock at 25 degrees tilt
              const raw = Math.max(-25, Math.min(25, steerValue));
              let normalizedSteer = (raw - (this.gyroBaseGamma || 0)) / 25;
              window.gyroSteering = Math.max(-1, Math.min(1, normalizedSteer));
            } else if (!this._calibrating) {
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
        // Calibration used to grab a single instant reading 200ms after enabling gyro, with
        // no feedback to the player — if they were still settling into their grip, or shift
        // it at all later in the level, steering never truly centers on zero. Now: samples
        // gamma continuously over a visible ~2.2s window (averaged, not a single snapshot),
        // shown via #gyro-calibrate-overlay in Driving.html, and re-runs automatically
        // whenever the car has been going dead straight for a couple of seconds — covering
        // grip drift over a long session without needing a manual recalibrate control.
        this._runCalibration = (onDone) => {
          this._calibrating = true;
          this._gyroSamples = [];
          const overlay = document.getElementById('gyro-calibrate-overlay');
          if (overlay) overlay.classList.add('on');
          setTimeout(() => {
            if (this._gyroSamples.length) {
              const sum = this._gyroSamples.reduce((a, b) => a + b, 0);
              this.gyroBaseGamma = sum / this._gyroSamples.length;
            } else if (this._lastGyroGamma != null) {
              this.gyroBaseGamma = this._lastGyroGamma;
            }
            this._calibrating = false;
            this._gyroSamples = [];
            if (overlay) overlay.classList.remove('on');
            if (onDone) onDone();
          }, 2200);
        };
        this._autoGyro = () => {
          if (!this._gyroSupported || this.gyroOn) return;
          const doEnable = () => {
            this.gyroOn = true;
            this.gyroBaseGamma = 0;
            this._startGyro();
            this._runCalibration(() => {
              const swC = document.getElementById('steer-wheel-container');
              if (swC) swC.style.display = 'none';
            });
          };
          if (this._gyroNeedsPermission) {
            DeviceOrientationEvent.requestPermission().then(state => {
              if (state === 'granted') doEnable();
            }).catch(() => {});
          } else {
            doEnable();
          }
        };
        // Auto-recalibration: if gyro is on and the car has gone dead straight (no turn
        // input at all) for 2.5s, silently re-center the baseline on the current reading —
        // covers the player's grip drifting over a long session without any manual control.
        this._checkGyroAutoRecal = (turnInput) => {
          if (!this.gyroOn || this._calibrating) return;
          const now = Date.now();
          if (Math.abs(turnInput || 0) > 0.03) {
            this._straightSince = null;
            return;
          }
          if (this._straightSince == null) {
            this._straightSince = now;
          } else if (now - this._straightSince > 2500 && this._lastGyroGamma != null) {
            this.gyroBaseGamma = this._lastGyroGamma;
            this._straightSince = now;
          }
        };

        // Rotate-device overlay: driving needs landscape; block play and show a prompt
        // otherwise, clearing automatically the moment the device is turned.
        this._checkOrientation = () => {
          const overlay = document.getElementById('rotate-device-overlay');
          if (!overlay) return;
          const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          const isPortrait = window.innerHeight > window.innerWidth;
          if (isTouch && isPortrait && this.playing) {
            overlay.classList.add('on');
          } else {
            overlay.classList.remove('on');
          }
        };
        window.addEventListener('resize', () => this._checkOrientation());
        window.addEventListener('orientationchange', () => this._checkOrientation());



        const sb = (id, k) => {
          const el = document.getElementById(id); if (!el) return;
          const dn = e => { e.preventDefault(); this.keys[k] = true }; const up = e => { e.preventDefault(); this.keys[k] = false };
          el.addEventListener('touchstart', dn, { passive: false }); el.addEventListener('touchend', up, { passive: false });
          el.addEventListener('mousedown', dn); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up);
        };
        sb('tl', 'arrowleft'); sb('tr', 'arrowright'); sb('tu', 'arrowup'); sb('abb', 'b'); sb('abh', ' ');


        this._initMobileCameraLook();
        this._initCameraJoystick();
        this._initSwipeTurn();
        // _initMouseSteer() disabled: it bound its own mousedown/mousemove on the same
        // canvas as the camera-drag-orbit handler above, fighting it for every click —
        // one system orbited the camera (relative drag), the other directly rotated the
        // player using absolute cursor position. Same click, two systems, is why mouse
        // look/steer felt broken. Re-enable only if you specifically want click-to-face
        // steering for stationary/pedestrian mode, and give it its own input mode first.
        // this._initMouseSteer();
        this._initMobileHudAutohide();
      }
      _initG() {
        document.querySelectorAll('.gb').forEach(b => { b.addEventListener('click', () => this.setGear(b.dataset.g)); b.addEventListener('touchstart', e => { e.preventDefault(); this.setGear(b.dataset.g); }, { passive: false }); });
        // ── SPEED CONTROLS INIT ──
        this.cruiseControl = false;
        this.cruiseSpeed = 50; // km/h target
        this.speedLimiter = false;
        this.speedLimitCap = 50; // km/h hard cap
        this.driveMode = 'CITY'; // 'ECO' | 'CITY' | 'SPORT'
        this._driveModeCapMap = { ECO: 45, CITY: 65, SPORT: 999 };
        // Wire up speed control HUD buttons
        const _sc = id => document.getElementById(id);
        if (_sc('sc-cruise')) _sc('sc-cruise').addEventListener('click', () => this.toggleCruiseControl());
        if (_sc('sc-limit')) _sc('sc-limit').addEventListener('click', () => this.toggleSpeedLimiter());
        if (_sc('sc-eco')) _sc('sc-eco').addEventListener('click', () => this.setDriveMode('ECO'));
        if (_sc('sc-city')) _sc('sc-city').addEventListener('click', () => this.setDriveMode('CITY'));
        if (_sc('sc-sport')) _sc('sc-sport').addEventListener('click', () => this.setDriveMode('SPORT'));
        if (_sc('sc-plus')) _sc('sc-plus').addEventListener('click', () => this.adjustCruiseSpeed(5));
        if (_sc('sc-minus')) _sc('sc-minus').addEventListener('click', () => this.adjustCruiseSpeed(-5));
      }


      // Touch-capable is not the same as touch-driven: a Windows laptop with a
      // touchscreen reports maxTouchPoints > 0 while still being a mouse+keyboard
      // machine, which used to paste both on-screen joysticks over the desktop HUD.
      // Require a coarse primary pointer with no hover (or a phone/tablet UA).
      _useTouchControls() {
        if (this._isMobile) return true;
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return false;
        if (window.matchMedia) {
          return window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(hover: none)').matches;
        }
        return false;
      }

      // ── VIRTUAL JOYSTICK FOR MOBILE ──
      _initVirtualJoystick() {
        if (!this._useTouchControls()) return;

        const joystickZone = document.getElementById('joystick-zone');
        const knob = document.getElementById('joystick-knob');
        if (!joystickZone || !knob) return;

        // Show joystick on mobile
        joystickZone.style.display = 'block';

        let isDragging = false;
        let touchId = null;
        const maxDist = 38; // Max distance knob can move from center

        const handleJoystickMove = (clientX, clientY) => {
          const rect = joystickZone.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          let dx = clientX - centerX;
          let dy = clientY - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Clamp to max distance
          if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
          }

          // Move knob
          knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

          // Set steering/throttle (-1 to 1 range)
          window.analogSteering = dx / maxDist;
          window.analogThrottle = -dy / maxDist;
        };

        const resetJoystick = () => {
          isDragging = false;
          touchId = null;
          knob.style.transform = 'translate(-50%, -50%)';
          window.analogSteering = 0;
          window.analogThrottle = 0;
        };

        // Touch events for joystick
        joystickZone.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          touchId = e.touches[0].identifier;
          handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          e.preventDefault();
          // Find our touch
          for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
              handleJoystickMove(e.touches[i].clientX, e.touches[i].clientY);
              break;
            }
          }
        }, { passive: false });

        joystickZone.addEventListener('touchend', (e) => {
          // Check if our touch ended
          let found = false;
          for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) { found = true; break; }
          }
          if (!found) resetJoystick();
        });

        joystickZone.addEventListener('touchcancel', resetJoystick);

        // Also support mouse for testing
        joystickZone.addEventListener('mousedown', (e) => {
          isDragging = true;
          touchId = 'mouse';
          handleJoystickMove(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging || touchId !== 'mouse') return;
          handleJoystickMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
          if (touchId === 'mouse') resetJoystick();
        });

        // Hide old steering wheel
        const steerWheel = document.getElementById('steer-wheel-container');
        if (steerWheel) steerWheel.style.display = 'none';
      }

      // ── CAMERA JOYSTICK FOR MOBILE LOOK-AROUND ──
      _initCameraJoystick() {
        if (!this._useTouchControls()) return;

        const camJoy = document.getElementById('camera-joystick');
        const camKnob = document.getElementById('camera-joystick-knob');
        if (!camJoy || !camKnob) return;

        camJoy.style.display = 'flex';

        let isDragging = false;
        const maxDist = 35;
        this._camJoyActive = false;

        const handleCamMove = (clientX, clientY) => {
          const rect = camJoy.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          let dx = clientX - centerX;
          let dy = clientY - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
          }
          camKnob.style.transform = `translate(${dx}px, ${dy}px)`;
           // Map joystick displacement to camYaw/camPitch changes
           const sensitivity = 0.12; // Increased sensitivity significantly
           this.targetCamYaw -= dx * sensitivity;
           this.targetCamYaw = Math.max(-2.5, Math.min(2.5, this.targetCamYaw));
           this.targetCamPitch -= dy * sensitivity;
           this.targetCamPitch = Math.max(-1.5, Math.min(1.5, this.targetCamPitch));
        };

        const resetCamJoy = () => {
          isDragging = false;
          this._camJoyActive = false;
          camKnob.style.transform = 'translate(0px, 0px)';
        };

        camJoy.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          this._camJoyActive = true;
          this._camJoyEverUsed = true;
          handleCamMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        camJoy.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          e.preventDefault();
          handleCamMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        camJoy.addEventListener('touchend', resetCamJoy);
        camJoy.addEventListener('touchcancel', resetCamJoy);

        // Mouse fallback for testing
        camJoy.addEventListener('mousedown', (e) => {
          isDragging = true;
          this._camJoyActive = true;
          handleCamMove(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          handleCamMove(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', resetCamJoy);
      }

      // ── HUD AUTO-HIDE ON MOBILE ──
      _initMobileHudAutohide() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
        const hud = document.getElementById('hud');
        const hudbar = document.getElementById('hudbar');
        const hwrap = document.getElementById('hwrap');
        const obj = document.getElementById('objective-overlay');
        const panels = [hud, hudbar, hwrap, obj].filter(Boolean);
        if (!panels.length) return;

        let fadeTimer = null;
        const FADE_DELAY = 3000;
        const FADE_OPACITY = '0.25';
        const NORMAL_OPACITY = '1';

        const doFade = () => {
          panels.forEach(p => {
            p.style.transition = 'opacity 0.6s ease';
            p.style.opacity = FADE_OPACITY;
          });
        };
        const doShow = () => {
          panels.forEach(p => {
            p.style.transition = 'opacity 0.3s ease';
            p.style.opacity = NORMAL_OPACITY;
          });
        };
        const restartTimer = () => {
          doShow();
          clearTimeout(fadeTimer);
          fadeTimer = setTimeout(doFade, FADE_DELAY);
        };

        // Start fade after level loads
        fadeTimer = setTimeout(doFade, FADE_DELAY);

        // Tap anywhere on canvas (not on controls) to reveal
        document.addEventListener('touchstart', (e) => {
          const t = e.target;
          if (t.closest('#mobile-controls') || t.closest('#hud') || t.closest('#hudbar') ||
              t.closest('#hwrap') || t.closest('#civic-controls') || t.closest('#camera-joystick') ||
              t.closest('#virtual-joystick') || t.closest('#gp') || t.closest('#phone-gps')) return;
          restartTimer();
        }, { passive: true });

        // Also reveal briefly on score/objective change
        this._hudShowBrief = () => restartTimer();
      }

      _initMobileCameraLook() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
        const isControl = (el) => {
          if (!el) return false;
          const ctrlIds = ['steer-wheel-container','steer-wheel','mc-brake','mc-gas','mc-boost','mc-enter','phone-gps-btn','phone-gps','tl','tr','tu','abb','abh','btn-seatbelt','btn-mobile', 'virtual-joystick', 'joystick-knob', 'camera-joystick', 'camera-joystick-knob'];
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
                 this.targetCamYaw -= dx * 0.005;
                 this.targetCamYaw = Math.max(-2.5, Math.min(2.5, this.targetCamYaw));
                 this.targetCamPitch -= dy * 0.005;
                 this.targetCamPitch = Math.max(-1.2, Math.min(1.2, this.targetCamPitch));
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

      // ── SWIPE TO TURN: Touch swipe turns player character toward swipe direction ──
      _initSwipeTurn() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;

        const isControl = (el) => {
          if (!el) return false;
          const ctrlIds = ['steer-wheel-container','steer-wheel','mc-brake','mc-gas','mc-boost','mc-enter','phone-gps-btn','phone-gps','tl','tr','tu','abb','abh','btn-seatbelt','btn-mobile', 'virtual-joystick', 'joystick-knob', 'camera-joystick', 'camera-joystick-knob'];
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

        const SWIPE_THRESHOLD = 20;
        let touchStartX = 0, touchStartY = 0;
        let swipeTouchId = null;

        document.addEventListener('touchstart', (e) => {
          if (!this.playing || this.pause) return;
          // Only enable swipe turn in pedestrian mode OR when stationary
          if (!this.isPedestrian && Math.abs(this.speed) > 0.1) return;

          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (isControl(t.target)) continue;
            if (swipeTouchId !== null) continue; // Already tracking

            touchStartX = t.clientX;
            touchStartY = t.clientY;
            swipeTouchId = t.identifier;
            break;
          }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
          if (swipeTouchId === null) return;
          if (!this.playing || this.pause) return;

          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier !== swipeTouchId) continue;

            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;

            if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
              // Calculate angle from swipe direction
              // Swipe UP = turn forward (0), SWIPE DOWN = turn backward (PI)
              // Swipe LEFT = turn left, SWIPE RIGHT = turn right
              const angle = Math.atan2(dx, -dy); // Negate dy because screen Y is inverted

              // Smoothly rotate player toward swipe direction
              const targetRot = angle;
              if (!this.player) return
              const currentRot = this.player.rotation.y;

              // Shortest rotation path
              let diff = targetRot - currentRot;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;

              // Apply rotation (smooth interpolation)
              this.player.rotation.y += diff * 0.15;

              // Reset start for continuous tracking
              touchStartX = t.clientX;
              touchStartY = t.clientY;
            }
            break;
          }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === swipeTouchId) {
              swipeTouchId = null;
              break;
            }
          }
        }, { passive: true });

        document.addEventListener('touchcancel', () => {
          swipeTouchId = null;
        }, { passive: true });
      }

      // ── MOUSE STEER: Mouse position controls direction when not in pointer lock ──
      _initMouseSteer() {
        const canvas = document.getElementById('gc');
        if (!canvas) return;

        let mouseActive = false;

        canvas.addEventListener('mousedown', (e) => {
          if (e.button === 0 && this.playing && !this.pause && this.player) {
            // Enable mouse steering when clicking on canvas in pedestrian mode or stationary
            if (this.isPedestrian || Math.abs(this.speed) < 0.1) {
              mouseActive = true;
            }
          }
        });
        // Prevent context menu on canvas so right-click drag works for camera
        canvas.addEventListener('contextmenu', (e) => { if (this.playing) e.preventDefault(); });

        window.addEventListener('mouseup', () => {
          mouseActive = false;
        });

        window.addEventListener('mousemove', (e) => {
          this._mouseX = e.clientX;
          this._mouseY = e.clientY;
          if (!mouseActive || !this.playing || this.pause) return;

          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;

          // Calculate angle from center of screen
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;

          // Only steer if mouse is away from center
          if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
            if (!this.player) return
            const targetAngle = Math.atan2(dx, -dy);

            let diff = targetAngle - this.player.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            this.player.rotation.y += diff * 0.15; // Increased steering response
          }
        });
      }

      _decayCameraLook(dt) {
        if (this._isDraggingMobileLook) return;
        if (this._camJoyActive) return;
        if (this.isPointerLocked || this._isDraggingCamera) return;
        // After camera joystick use, use very slow decay so angle is preserved
        // Reduced from 4 to 0.8 so camera angles persist longer before resetting
        const decayRate = this._camJoyEverUsed ? 0.15 : 0.8;
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
          const rWidth = r.width || rw || 14;
          const halfW = (rWidth / 2) + m;
          if (isV) {
            return { x1: r.x - halfW, x2: r.x + halfW, z1: Math.min(r.z1, r.z2) - m, z2: Math.max(r.z1, r.z2) + m, isV: true, width: rWidth, road: r };
          } else {
            const cz = r.z;
            return { x1: Math.min(r.x1, r.x2) - m, x2: Math.max(r.x1, r.x2) + m, z1: cz - halfW, z2: cz + halfW, isV: false, width: rWidth, road: r };
          }
        });
      }

      _getRoadAndSidewalkStatus(x, z) {
        const allRoads = (this.roadSegments && this.roadSegments.length > 0) ? this.roadSegments : (this.mapCfg && this.mapCfg.roads ? this.mapCfg.roads : []);
        if (!allRoads || allRoads.length === 0) {
          return { onRoad: true, onSidewalk: false, offRoad: false, nearZebra: true, currentRoad: null };
        }

        // ── Garage & Driveway Zone: 100% Permitted Zone (No sidewalk/offroad penalties) ──
        if (this._garageX !== undefined && this._garageZ !== undefined) {
          const dGarage = Math.hypot(x - this._garageX, z - this._garageZ);
          if (dGarage <= 40) {
            return { onRoad: true, onSidewalk: false, offRoad: false, nearZebra: true, inGarageDriveway: true, currentRoad: allRoads[0] };
          }
        }

        // ── Intersection & Zebra Crossings: 100% Permitted Road / Safe Crossing Zone ──
        const ints = (this.mapCfg?.ints || []);
        for (let i = 0; i < ints.length; i++) {
          const [ix, iz] = ints[i];
          if (Math.hypot(x - ix, z - iz) <= 24) {
            return { onRoad: true, onSidewalk: false, offRoad: false, nearZebra: true, currentRoad: allRoads[0] };
          }
        }

        let onRoad = false;
        let onSidewalk = false;
        let matchedRoad = null;
        const sidewalkWidth = 4.0;

        for (let i = 0; i < allRoads.length; i++) {
          const r = allRoads[i];
          const roadHalfW = (r.width || 14) / 2;
          const minExt = -25;
          const maxExt = 25;

          if (r.type === 'v') {
            const zMin = Math.min(r.z1 !== undefined ? r.z1 : -9999, r.z2 !== undefined ? r.z2 : 9999) + minExt;
            const zMax = Math.max(r.z1 !== undefined ? r.z1 : -9999, r.z2 !== undefined ? r.z2 : 9999) + maxExt;
            if (z >= zMin && z <= zMax) {
              const dx = Math.abs(x - r.x);
              if (dx <= roadHalfW + 0.5) {
                onRoad = true;
                onSidewalk = false;
                matchedRoad = r;
                break;
              } else if (!onRoad && dx <= roadHalfW + sidewalkWidth + 0.8) {
                onSidewalk = true;
                matchedRoad = r;
              }
            }
          } else {
            const xMin = Math.min(r.x1 !== undefined ? r.x1 : -9999, r.x2 !== undefined ? r.x2 : 9999) + minExt;
            const xMax = Math.max(r.x1 !== undefined ? r.x1 : -9999, r.x2 !== undefined ? r.x2 : 9999) + maxExt;
            if (x >= xMin && x <= xMax) {
              const dz = Math.abs(z - r.z);
              if (dz <= roadHalfW + 0.5) {
                onRoad = true;
                onSidewalk = false;
                matchedRoad = r;
                break;
              } else if (!onRoad && dz <= roadHalfW + sidewalkWidth + 0.8) {
                onSidewalk = true;
                matchedRoad = r;
              }
            }
          }
        }

        const offRoad = !onRoad && !onSidewalk;
        return { onRoad, onSidewalk, offRoad, nearZebra: false, currentRoad: matchedRoad };
      }

      _isOnRoad(x, z) {
        return this._getRoadAndSidewalkStatus(x, z).onRoad;
      }

      _isOnSidewalk(x, z) {
        return this._getRoadAndSidewalkStatus(x, z).onSidewalk;
      }

      _getLaneCenter(x, z) {
        if (!this._roadZones) return null;
        for (const rz of this._roadZones) {
          if (x >= rz.x1 && x <= rz.x2 && z >= rz.z1 && z <= rz.z2) {
            return rz.isV ? { x: (rz.x1 + rz.x2) / 2, z: null } : { x: null, z: (rz.z1 + rz.z2) / 2 };
          }
        }
        return null;
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

      // ── SPEED CONTROL METHODS ──
      toggleCruiseControl() {
        if (this.isPedestrian) return;
        this.cruiseControl = !this.cruiseControl;
        if (this.cruiseControl) {
          // Snap cruise target to current speed (min 20 km/h)
          this.cruiseSpeed = Math.max(20, Math.round(Math.abs(this.speed) * 100));
          toast('🚢 Cruise ON — ' + this.cruiseSpeed + ' km/h', '#4fc3f7');
        } else {
          toast('🚢 Cruise OFF', '#90a4ae');
        }
        this._updateSpeedCtrlHUD();
      }

      toggleSpeedLimiter(forceState) {
        if (this.isPedestrian) return;
        this.speedLimiter = typeof forceState === 'boolean' ? forceState : !this.speedLimiter;
        if (this.speedLimiter) {
          const maxInternal = (this.speedLimitCap || 50) / 100;
          if (Math.abs(this.speed) > maxInternal) {
            this.speed = Math.sign(this.speed) * maxInternal;
          }
        }
        toast(this.speedLimiter ? ('🔒 Speed Governor ON — Capped at ' + this.speedLimitCap + ' km/h') : '🔓 Speed Governor OFF — Unlimited', this.speedLimiter ? '#00e676' : '#90a4ae');
        this._updateSpeedCtrlHUD();
      }

      setDriveMode(mode) {
        if (this.isPedestrian) return;
        this.driveMode = mode;
        const icons = { ECO: '🌿', CITY: '🏙️', SPORT: '🏎️' };
        const colors = { ECO: '#66bb6a', CITY: '#4fc3f7', SPORT: '#ef5350' };
        toast(icons[mode] + ' ' + mode + ' mode — cap ' + (this._driveModeCapMap[mode] < 999 ? this._driveModeCapMap[mode] + ' km/h' : 'unlimited'), colors[mode]);
        this._updateSpeedCtrlHUD();
      }

      adjustCruiseSpeed(delta) {
        if (this.isPedestrian) return;
        this.cruiseSpeed = Math.max(10, Math.min(180, this.cruiseSpeed + delta));
        if (this.cruiseControl) toast('🚢 Cruise → ' + this.cruiseSpeed + ' km/h', '#4fc3f7');
        this._updateSpeedCtrlHUD();
      }

      _updateSpeedCtrlHUD() {
        const el = id => document.getElementById(id);
        if (el('sc-cruise')) el('sc-cruise').classList.toggle('sc-on', this.cruiseControl);
        if (el('sc-limit')) el('sc-limit').classList.toggle('sc-on', this.speedLimiter);
        ['ECO','CITY','SPORT'].forEach(m => { if (el('sc-' + m.toLowerCase())) el('sc-' + m.toLowerCase()).classList.toggle('sc-active', this.driveMode === m); });
        if (el('sc-badge-cruise')) { el('sc-badge-cruise').textContent = this.cruiseSpeed + ''; el('sc-badge-cruise').style.display = this.cruiseControl ? 'inline' : 'none'; }
        if (el('sc-badge-limit')) { el('sc-badge-limit').textContent = this.speedLimitCap + ''; el('sc-badge-limit').style.display = this.speedLimiter ? 'inline' : 'none'; }
        
        // Update speed limit road sign badge if present
        const slBadge = el('speed-limit-badge');
        if (slBadge) {
          slBadge.style.display = this.isPedestrian ? 'none' : 'flex';
          const slVal = el('sl-val');
          if (slVal) slVal.textContent = this.speedLimitCap || 50;
          const slGov = el('sl-gov-tag');
          if (slGov) {
            if (this.speedLimiter) {
              slGov.textContent = '🔒 ON';
              slGov.style.background = '#00e676';
              slGov.style.color = '#000';
              slBadge.style.borderColor = '#00e676';
              slBadge.style.boxShadow = '0 0 16px rgba(0,230,118,0.8), 0 4px 16px rgba(0,0,0,0.6)';
            } else {
              slGov.textContent = 'GOV [L]';
              slGov.style.background = '#333';
              slGov.style.color = '#fff';
              slBadge.style.borderColor = '#cc0000';
              slBadge.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
            }
          }
        }
      }


      _horn() {
          this._honkedThisFrame = true;
          if (this.mapCfg && this.mapCfg.isSilenceZone) {
            

            // Check cumulative rules for no honking
            const _lvId = (ui.cur ? ui.cur.id : 1);
            const cumCheck = this.checkCumulativeViolation('silence_zone_no_horn', _lvId);
            if (cumCheck.enforce) {
              this.vio++;
              this.violationsLog.push('NO_HONKING');
              this.score -= 50;
              this.fine += 2000;
              if (window.GameplayRecorder) GameplayRecorder.record('NO_HONKING', { speed: Math.round(Math.abs(this.speed) * 100), score: this.score, fine: this.fine });
              this._triggerPoliceStrobe(); ui.issueChallan('Honking in No-Honking Zone (repeat offense)', 'Sec 190(2) MV Act', '₹2,000', 'Silence Zone Violation');
            } else {
              this.violationsLog.push('NO_HONKING_WARNING');
              toast('⚠️ Honking in silence zone — first warning', '#f2b84b');
            }
          } else {
              toast('📢 Beep Beep!', '#ffd54a'); 
              sfx.play('horn'); 
          } 
      }
      _brake() {
        // Apply brake fade factor — reduced braking when brakes are overheated
        const fadeFactor = this._brakeFadeFactor || 1.0;
        const brakePower = 0.35 * fadeFactor;
        this.speed *= brakePower;
        sfx.play('brake');
        if (fadeFactor < 0.8) {
          toast('⚠️ Brake fade! Brakes overheating — reduced stopping power', '#ff9500');
        } else {
          toast('🛑 Hard Deceleration Active', '#fff');
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // ENHANCED PHYSICS: Aerodynamics, Suspension, Brake Heat, Skid Marks
      // ══════════════════════════════════════════════════════════════════════
      _computeDynamicWeightTransfer(ax, ay) {
        const cfg = (typeof VEHICLE_PACEJKA_CONFIG !== 'undefined' && VEHICLE_PACEJKA_CONFIG[this.vehMode]) || VEHICLE_PACEJKA_CONFIG.car || { mass: 1400, wheelbase: 2.7, track_width: 1.5, cg_height: 0.55, front_weight_dist: 0.58 };
        const g = 9.81;
        const totalWeight = (cfg.mass || 1400) * g;
        const wb = cfg.wheelbase || 2.7;
        const tw = cfg.track_width || 1.5;
        const cgH = cfg.cg_height || 0.55;
        const fDist = cfg.front_weight_dist || 0.58;

        const staticFront = totalWeight * (1 - fDist);
        const staticRear = totalWeight * fDist;

        // Longitudinal weight transfer (brake dive shifts weight forward; accel shifts rearward)
        const deltaLong = ((cfg.mass || 1400) * ax * cgH) / wb;
        const frontTotal = Math.max(totalWeight * 0.1, Math.min(totalWeight * 0.85, staticFront - deltaLong));
        const rearTotal = Math.max(totalWeight * 0.1, Math.min(totalWeight * 0.85, staticRear + deltaLong));

        // Lateral weight transfer (roll load shift)
        const deltaLatF = (frontTotal * Math.abs(ay) * cgH) / (tw * g);
        const deltaLatR = (rearTotal * Math.abs(ay) * cgH) / (tw * g);
        const latSign = Math.sign(ay) || 0;

        this._wheelLoads = {
          FL: Math.max(50, (frontTotal * 0.5) - (deltaLatF * 0.5 * latSign)),
          FR: Math.max(50, (frontTotal * 0.5) + (deltaLatF * 0.5 * latSign)),
          RL: Math.max(50, (rearTotal * 0.5) - (deltaLatR * 0.5 * latSign)),
          RR: Math.max(50, (rearTotal * 0.5) + (deltaLatR * 0.5 * latSign)),
          frontTotal,
          rearTotal
        };
        return this._wheelLoads;
      }

      _computeVehicleDynamics(dt, tAmt, isBraking, isThrottling, isRev) {
        const cfg = (typeof VEHICLE_PACEJKA_CONFIG !== 'undefined' && VEHICLE_PACEJKA_CONFIG[this.vehMode]) || VEHICLE_PACEJKA_CONFIG.car || { mass: 1400, wheelbase: 2.7, track_width: 1.5, cg_height: 0.55, front_weight_dist: 0.58, inertia_yaw: 2800 };
        const speedMs = this.speed * 30; // internal speed unit to m/s
        const absSpd = Math.abs(this.speed);

        // Clean standstill state (zero jitter/shaking when car is stopped)
        if (absSpd <= 0.005) {
          this._yawRate = 0;
          this._localVy = 0;
          this._lateralAccel = 0;
          this._longitudinalAccel = 0;
          this._bodyRoll = 0;
          this._bodyPitch = 0;
          this._steerAngle = 0;
          this._alphaF = 0;
          this._alphaR = 0;
          this._absActive = false;
          this._tcsActive = false;
          this._engineRPM = 850;
          if (this.playerVehicle) {
            this.playerVehicle.rotation.z = 0;
            this.playerVehicle.rotation.x = 0;
          }
          return { effBrake: isBraking ? 1.0 : 0.0 };
        }

        const safeVx = Math.max(0.3, Math.abs(speedMs));
        
        // Steering angle in radians
        const maxSteer = (this.turn || 0.08) * 4.5;
        const steerAngle = tAmt * maxSteer * (isRev ? -1 : 1);
        this._steerAngle = steerAngle;

        // Current lateral velocity in vehicle frame and yaw rate
        const vy = this._localVy || 0;
        const yawRate = this._yawRate || 0;
        const wb = cfg.wheelbase || 2.7;
        const lf = wb * (1 - (cfg.front_weight_dist || 0.58));
        const lr = wb * (cfg.front_weight_dist || 0.58);

        // 1. Slip Angles (alpha)
        const frontLatV = vy + (lf * yawRate);
        const rearLatV = vy - (lr * yawRate);
        const alphaF = steerAngle - Math.atan2(frontLatV, safeVx);
        const alphaR = -Math.atan2(rearLatV, safeVx);
        this._alphaF = alphaF;
        this._alphaR = alphaR;

        // 2. Surface condition
        let surfaceType = 'dry_asphalt';
        if (this.mode === 'rain' || (this.mapCfg && this.mapCfg.hasRain)) surfaceType = 'wet_asphalt';
        if (this.mapCfg && this.mapCfg.isGravel) surfaceType = 'gravel';

        // 3. Dynamic Normal Loads (Fz)
        const loads = this._computeDynamicWeightTransfer(this._longitudinalAccel || 0, this._lateralAccel || 0);

        // 4. Pacejka Lateral Forces (Fy)
        const Fy_F = PACEJKA ? (PACEJKA.computeLateralForce(alphaF, loads.frontTotal, 0, surfaceType).Fy) : (Math.sin(alphaF) * loads.frontTotal * 0.9);
        const Fy_R = PACEJKA ? (PACEJKA.computeLateralForce(alphaR, loads.rearTotal, 0, surfaceType).Fy) : (Math.sin(alphaR) * loads.rearTotal * 0.9);

        // 5. Active Driver Assists: ABS & TCS
        let effBrake = isBraking ? 1.0 : 0.0;
        this._absActive = false;
        if (isBraking && Math.abs(alphaF) > 0.15 && Math.abs(this.speed) > 0.4) {
          this._absActive = true;
          effBrake *= 0.75; // ABS pulse retains front lateral turning force
        }

        this._tcsActive = false;
        if (isThrottling && (surfaceType === 'wet_asphalt' || surfaceType === 'gravel') && Math.abs(this.speed) < 0.3) {
          this._tcsActive = true;
        }

        // 6. Dynamic Yaw Acceleration & Moment of Inertia
        const Iz = cfg.inertia_yaw || 2800;
        const yawTorque = (Fy_F * lf * Math.cos(steerAngle)) - (Fy_R * lr);
        const yawAccel = yawTorque / Iz;

        if (Math.abs(this.speed) > 0.005) {
          this._yawRate = (yawRate + yawAccel * dt) * Math.pow(0.92, dt * 60);
          // Apply yaw rate to player rotation
          const yawDelta = (this._yawRate * dt) + (tAmt * (this.turn || 0.08) * Math.max(0.4, 1 - Math.abs(this.speed)*0.2) * Math.sign(this.speed) * dt * 30);
          this.player.rotation.y += yawDelta;
          while (this.player.rotation.y > Math.PI) this.player.rotation.y -= Math.PI * 2;
          while (this.player.rotation.y < -Math.PI) this.player.rotation.y += Math.PI * 2;
        } else {
          this._yawRate = 0;
          this._localVy = 0;
        }

        // 7. Update lateral chassis velocity vy
        const totalLatForce = (Fy_F * Math.cos(steerAngle)) + Fy_R;
        const latAccel = (totalLatForce / (cfg.mass || 1400)) - (speedMs * (this._yawRate || 0));
        this._localVy = (vy + latAccel * dt) * Math.pow(0.85, dt * 60);
        this._lateralAccel = latAccel;

        // 8. Engine RPM
        this._engineRPM = Math.min(6500, Math.max(850, 850 + Math.abs(speedMs) * 110));

        return { effBrake };
      }

      _computeAeroForces(dt) {
        const speed = Math.abs(this.speed);
        const speedMs = speed * 30; // game-units to approx m/s
        const cfg = VEHICLE_PACEJKA_CONFIG[this.vehMode] || VEHICLE_PACEJKA_CONFIG.car;
        const frontalArea = (cfg.track_width || 1.5) * 1.2; // approx m^2
        const Cd = 0.35; // drag coefficient
        const Cl = 0.15; // lift coefficient (positive = lift, negative = downforce)
        const airDensity = 1.225; // kg/m^3
        // Aerodynamic drag force (opposes motion)
        const dragForce = 0.5 * airDensity * Cd * frontalArea * speedMs * speedMs;
        this._aeroDrag = dragForce * 0.0001; // scale to game units
        // Downforce (presses car down, increases grip at speed)
        const downforce = 0.5 * airDensity * Cl * frontalArea * speedMs * speedMs;
        this._downforceCoeff = Math.min(downforce / (cfg.mass * 9.81), 0.3); // max 30% extra grip
      }

      _updateSuspension(dt) {
        const cfg = (typeof VEHICLE_PACEJKA_CONFIG !== 'undefined' && VEHICLE_PACEJKA_CONFIG[this.vehMode]) || { cg_height: 0.55, maxSpeed: 1.2 };
        const speed = (typeof this.speed === 'number' && isFinite(this.speed)) ? Math.abs(this.speed) : 0;
        if (speed < 0.01) {
          this._bodyRoll = 0;
          this._bodyPitch = 0;
          this._suspensionY = 0;
          if (this.playerVehicle) {
            this.playerVehicle.rotation.z = 0;
            this.playerVehicle.rotation.x = 0;
            this.playerVehicle.position.y = (this._enterState === 'IDLE' && this.isPedestrian ? 0 : 0.2);
          }
          return;
        }
        const lateralAccel = isFinite(this._lateralAccel) ? this._lateralAccel : 0;
        const targetRoll = -lateralAccel * 0.03 * (cfg.cg_height || 0.55);
        this._bodyRoll = (isFinite(this._bodyRoll) ? this._bodyRoll : 0) + (targetRoll - (isFinite(this._bodyRoll) ? this._bodyRoll : 0)) * Math.min(1, dt * 8);
        this._bodyRoll = Math.max(-0.12, Math.min(0.12, this._bodyRoll));
        const accel = this.keys['w'] || this.keys['arrowup'];
        const brake = this.keys['s'] || this.keys['arrowdown'];
        let targetPitch = 0;
        if (brake && speed > 0.1) targetPitch = 0.06; // nose dive
        else if (accel && speed < (cfg.maxSpeed || 1.2)) targetPitch = -0.03; // nose lift
        this._bodyPitch = (isFinite(this._bodyPitch) ? this._bodyPitch : 0) + (targetPitch - (isFinite(this._bodyPitch) ? this._bodyPitch : 0)) * Math.min(1, dt * 6);
        this._bodyPitch = Math.max(-0.08, Math.min(0.08, this._bodyPitch));
        if (this.playerVehicle) {
          this.playerVehicle.rotation.z = this._bodyRoll;
          this.playerVehicle.rotation.x = this._bodyPitch;
          const bounceFreq = 2.5 + speed * 3;
          const bounceAmp = 0.008 * Math.min(speed, 1);
          const t = isFinite(this.timer) ? this.timer : 0;
          this._suspensionY = Math.sin(t * bounceFreq) * bounceAmp;
          this.playerVehicle.position.y = (isFinite(this._suspensionY) ? this._suspensionY : 0) + (this._enterState === 'IDLE' && this.isPedestrian ? 0 : 0.2);
        }
      }

      _updateBrakeHeat(dt) {
        if (!this._brakeHeat) this._brakeHeat = 0;
        const braking = this.keys['s'] || this.keys['arrowdown'];
        const speed = Math.abs(this.speed);
        if (braking && speed > 0.3) {
          this._brakeHeat = Math.min(100, this._brakeHeat + dt * 15 * (speed / 1.1));
        } else {
          this._brakeHeat = Math.max(0, this._brakeHeat - dt * 8);
        }
        // Brake fade: at high heat, braking efficiency drops
        if (this._brakeHeat > 70) {
          const fadeFactor = 1 - (this._brakeHeat - 70) * 0.015;
          this._brakeFadeFactor = Math.max(0.5, fadeFactor);
        } else {
          this._brakeFadeFactor = 1.0;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // CRASH IMPACT SYSTEM: Sparks, Debris, Skid Marks, Hitstop, Damage FX
      // ══════════════════════════════════════════════════════════════════════
      _spawnSparks(x, z, intensity) {
        const count = Math.min(Math.floor(intensity * 20), 30);
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          positions[i*3] = x + (Math.random()-0.5)*0.5;
          positions[i*3+1] = 0.3 + Math.random()*0.5;
          positions[i*3+2] = z + (Math.random()-0.5)*0.5;
          const angle = Math.random()*Math.PI*2;
          const speed = 2 + Math.random()*5 * intensity;
          velocities.push({ vx: Math.cos(angle)*speed, vy: 3+Math.random()*4, vz: Math.sin(angle)*speed, life: 0.3+Math.random()*0.4 });
          // Spark colors: yellow → orange → white
          const t = Math.random();
          colors[i*3] = 1; colors[i*3+1] = 0.7+t*0.3; colors[i*3+2] = t*0.3;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: 0.15, transparent: true, opacity: 1, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const pts = new THREE.Points(geo, mat);
        this.scene.add(pts);
        this._sparks.push({ points: pts, velocities, life: 0.6, age: 0 });
      }

      _spawnDebris(x, z, intensity, color) {
        const count = Math.min(Math.floor(intensity * 8), 12);
        const group = new THREE.Group();
        const pieces = [];
        const baseColor = color || 0x888888;
        for (let i = 0; i < count; i++) {
          const size = 0.05 + Math.random()*0.15;
          const geo = new THREE.BoxGeometry(size, size, size);
          const mat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 1 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x + (Math.random()-0.5)*1, 0.5+Math.random()*0.5, z + (Math.random()-0.5)*1);
          const angle = Math.random()*Math.PI*2;
          const spd = 1+Math.random()*4*intensity;
          mesh.userData.vel = { x: Math.cos(angle)*spd, y: 3+Math.random()*5, z: Math.sin(angle)*spd };
          mesh.userData.rotVel = { x: (Math.random()-0.5)*10, y: (Math.random()-0.5)*10, z: (Math.random()-0.5)*10 };
          group.add(mesh);
          pieces.push(mesh);
        }
        this.scene.add(group);
        this._debris.push({ group, pieces, life: 1.2, age: 0 });
      }

      _spawnSkidMark(x, z, rotY, length) {
        if (this._skidMarks.length > 100) return; // cap
        const geo = new THREE.PlaneGeometry(0.4, length || 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
        const mark = new THREE.Mesh(geo, mat);
        mark.rotation.set(-Math.PI/2, 0, rotY);
        mark.position.set(x, 0.02, z);
        this.scene.add(mark);
        this._skidMarks.push({ mesh: mark, age: 0, maxAge: 15 });
      }


      // ══════════════════════════════════════════════════════════════════════
      // COMPREHENSIVE SPECIAL EFFECTS & POLISH ENGINE (VFX & SFX)
      // ══════════════════════════════════════════════════════════════════════
      _initVFX() {
        if (this._vfxInitialized) return;
        this._vfxInitialized = true;

        this._exhaustParticles = [];
        this._tireSmokeParticles = [];
        this._puddleParticles = [];
        this._checkpointFXList = [];
        this._blinkerTimer = 0;
        this._blinkerState = false;

        // Speedlines Overlay Canvas
        if (!document.getElementById('speedlines-canvas')) {
          const slCanvas = document.createElement('canvas');
          slCanvas.id = 'speedlines-canvas';
          slCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;opacity:0;transition:opacity 0.2s;';
          document.body.appendChild(slCanvas);
          this._slCanvas = slCanvas;
          this._slCtx = slCanvas.getContext('2d');
          const resizeSL = () => {
            if (this._slCanvas) {
              this._slCanvas.width = window.innerWidth;
              this._slCanvas.height = window.innerHeight;
            }
          };
          window.addEventListener('resize', resizeSL);
          resizeSL();
        }

        // Police Violation Emergency Strobe Overlay
        if (!document.getElementById('police-strobe-overlay')) {
          const strobe = document.createElement('div');
          strobe.id = 'police-strobe-overlay';
          strobe.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:85;opacity:0;transition:opacity 0.15s;box-shadow:inset 0 0 80px rgba(255,0,0,0.6);';
          document.body.appendChild(strobe);
          this._policeStrobeEl = strobe;
        }

        // Exhaust & Smoke Geometry & Materials
        this._smokeGeo = new THREE.SphereGeometry(0.2, 6, 6);
        this._smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5, depthWrite: false });
        this._flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
        this._flameOrangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
        this._tireSmokeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.6, depthWrite: false });
        this._waterMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7, depthWrite: false });
      }

      _updateVFX(dt) {
        if (!this.playing || this.pause) return;
        this._initVFX();

        const isCar = !this.isPedestrian && this.playerVehicle;
        const absSpd = Math.abs(this.speed || 0);
        const speedKmh = absSpd * 100;
        const isThrottle = !!(this.keys && (this.keys['w'] || this.keys['ArrowUp'] || this._touchThrottle));
        const isBraking = !!(this.keys && (this.keys['s'] || this.keys['ArrowDown'] || this._touchBrake));
        const isSteeringLeft = !!(this.keys && (this.keys['a'] || this.keys['ArrowLeft']));
        const isSteeringRight = !!(this.keys && (this.keys['d'] || this.keys['ArrowRight']));

        // 1. Audio Engine Update
        if (window.TrafficAudio) {
          if (isCar) {
            if (!window.TrafficAudio.isEngineRunning) window.TrafficAudio.startEngine();
            window.TrafficAudio.updateEngine(this.speed, isThrottle, this.boosting);
          } else {
            if (window.TrafficAudio.isEngineRunning) window.TrafficAudio.stopEngine();
          }
        }

        // 2. Exhaust Smoke & Nitrous Boost Flame Jets
        if (isCar) {
          const pRotY = this.playerVehicle.rotation.y;
          const cosR = Math.cos(pRotY);
          const sinR = Math.sin(pRotY);
          const pPos = this.playerVehicle.position;

          // Exhaust Ports (Rear bumper left & right)
          const rearDist = -1.8;
          [-0.45, 0.45].forEach(latOffset => {
            const exX = pPos.x + rearDist * -sinR + latOffset * cosR;
            const exY = pPos.y + 0.28;
            const exZ = pPos.z + rearDist * -cosR + latOffset * sinR;

            // Nitrous Boost Flame Jet
            if (this.boosting && Math.random() < 0.8) {
              const flame = new THREE.Mesh(this._smokeGeo, Math.random() > 0.4 ? this._flameMat : this._flameOrangeMat);
              flame.scale.set(0.6, 0.6, 1.2);
              flame.position.set(exX + (Math.random()-0.5)*0.1, exY, exZ + (Math.random()-0.5)*0.1);
              this.scene.add(flame);
              const flameSpd = 12 + Math.random() * 8;
              this._exhaustParticles.push({
                mesh: flame,
                vx: -sinR * -flameSpd + (Math.random()-0.5)*1.5,
                vy: (Math.random() - 0.2) * 2,
                vz: -cosR * -flameSpd + (Math.random()-0.5)*1.5,
                life: 0.15 + Math.random() * 0.1,
                age: 0,
                isFlame: true
              });
            } else if ((isThrottle || absSpd > 0.05) && Math.random() < 0.35) {
              // Normal Exhaust Smoke Puff
              const smoke = new THREE.Mesh(this._smokeGeo, this._smokeMat);
              smoke.scale.set(0.3, 0.3, 0.3);
              smoke.position.set(exX, exY, exZ);
              this.scene.add(smoke);
              this._exhaustParticles.push({
                mesh: smoke,
                vx: (Math.random() - 0.5) * 0.4 - sinR * -1.5,
                vy: 0.8 + Math.random() * 0.8,
                vz: (Math.random() - 0.5) * 0.4 - cosR * -1.5,
                life: 0.6 + Math.random() * 0.4,
                age: 0,
                isFlame: false
              });
            }
          });

          // 3. Tire Smoke & Drift Skid Marks
          const lateralSlip = Math.abs(this._lateralAccel || 0);
          const isDrifting = lateralSlip > 0.35 && absSpd > 0.2;
          const isHardBraking = isBraking && absSpd > 0.3;

          if (isDrifting || isHardBraking) {
            [-0.7, 0.7].forEach(tOffset => {
              const tireX = pPos.x + (-1.4) * -sinR + tOffset * cosR;
              const tireY = pPos.y + 0.08;
              const tireZ = pPos.z + (-1.4) * -cosR + tOffset * sinR;

              if (Math.random() < 0.5) {
                const tSmoke = new THREE.Mesh(this._smokeGeo, this._tireSmokeMat);
                tSmoke.scale.set(0.5, 0.5, 0.5);
                tSmoke.position.set(tireX + (Math.random()-0.5)*0.2, tireY, tireZ + (Math.random()-0.5)*0.2);
                this.scene.add(tSmoke);
                this._tireSmokeParticles.push({
                  mesh: tSmoke,
                  vx: (Math.random() - 0.5) * 1.2,
                  vy: 0.5 + Math.random() * 1.0,
                  vz: (Math.random() - 0.5) * 1.2,
                  life: 0.5 + Math.random() * 0.3,
                  age: 0
                });
              }

              // Drop rubber skid mark quad
              if (this._spawnSkidMark && Math.random() < 0.4) {
                this._spawnSkidMark(tireX, tireZ, pRotY, 1.2);
              }
            });

            if (window.TrafficAudio && Math.random() < 0.2) {
              window.TrafficAudio.playScreech(Math.min(1.0, lateralSlip * 1.5));
            }
          }

          // 4. Dynamic Taillight & Turn Signal Lighting
          this._blinkerTimer += dt;
          if (this._blinkerTimer > 0.35) {
            this._blinkerTimer = 0;
            this._blinkerState = !this._blinkerState;
          }

          if (this._playerTaillights) {
            const brakeColor = isBraking ? 0xff1100 : (this.mapCfg?.isNight ? 0x660a00 : 0x220500);
            this._playerTaillights.forEach(tl => {
              if (tl && tl.material) {
                tl.material.color.setHex(brakeColor);
                tl.scale.setScalar(isBraking ? 1.4 : 1.0);
              }
            });
          }

          // 5. Dynamic Speedlines
          if (this._slCtx && this._slCanvas) {
            const shouldSpeedlines = speedKmh > 55 || this.boosting;
            const targetOpacity = this.boosting ? 0.85 : Math.min(0.75, (speedKmh - 55) / 50);
            this._slCanvas.style.opacity = shouldSpeedlines ? targetOpacity : 0;

            if (shouldSpeedlines) {
              const w = this._slCanvas.width;
              const h = this._slCanvas.height;
              const ctx = this._slCtx;
              ctx.clearRect(0, 0, w, h);
              ctx.strokeStyle = this.boosting ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.4)';
              ctx.lineWidth = this.boosting ? 2.5 : 1.5;

              const cx = w / 2;
              const cy = h / 2;
              const numLines = this.boosting ? 35 : Math.floor(15 + (speedKmh - 55) * 0.4);

              for (let i = 0; i < numLines; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r1 = Math.min(w, h) * (0.35 + Math.random() * 0.15);
                const r2 = Math.min(w, h) * (0.55 + Math.random() * 0.4);
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
                ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
                ctx.stroke();
              }
            }
          }
        }

        // 6. Update Exhaust & Smoke Particles
        for (let i = this._exhaustParticles.length - 1; i >= 0; i--) {
          const p = this._exhaustParticles[i];
          p.age += dt;
          if (p.age >= p.life) {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            this._exhaustParticles.splice(i, 1);
            continue;
          }
          const progress = p.age / p.life;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          const grow = p.isFlame ? (1.0 + progress * 1.5) : (1.0 + progress * 3.5);
          p.mesh.scale.setScalar(grow * 0.3);
          if (p.mesh.material) p.mesh.material.opacity = (1 - progress) * (p.isFlame ? 0.9 : 0.5);
        }

        // 7. Update Tire Smoke Particles
        for (let i = this._tireSmokeParticles.length - 1; i >= 0; i--) {
          const p = this._tireSmokeParticles[i];
          p.age += dt;
          if (p.age >= p.life) {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            this._tireSmokeParticles.splice(i, 1);
            continue;
          }
          const progress = p.age / p.life;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.mesh.scale.setScalar((1.0 + progress * 4.0) * 0.4);
          if (p.mesh.material) p.mesh.material.opacity = (1 - progress) * 0.6;
        }

        // 8. Update Checkpoint Collect Bursts
        for (let i = this._checkpointFXList.length - 1; i >= 0; i--) {
          const fx = this._checkpointFXList[i];
          fx.age += dt;
          if (fx.age >= fx.life) {
            this.scene.remove(fx.group);
            this._checkpointFXList.splice(i, 1);
            continue;
          }
          const prog = fx.age / fx.life;
          // Expand shockwave ring
          if (fx.ring) {
            fx.ring.scale.setScalar(1.0 + prog * 6.0);
            fx.ring.material.opacity = (1 - prog) * 0.8;
          }
          // Disperse gold star particles
          if (fx.particles) {
            const pos = fx.particles.geometry.attributes.position.array;
            for (let j = 0; j < fx.velocities.length; j++) {
              const v = fx.velocities[j];
              v.vy -= 9.8 * dt;
              pos[j*3] += v.vx * dt;
              pos[j*3+1] += v.vy * dt;
              pos[j*3+2] += v.vz * dt;
            }
            fx.particles.geometry.attributes.position.needsUpdate = true;
            fx.particles.material.opacity = (1 - prog);
          }
        }
      }

      // ── Trigger Golden Checkpoint Particle Explosion ──
      _triggerCheckpointBurst(x, y, z) {
        this._initVFX();
        const grp = new THREE.Group();
        grp.position.set(x, y || 1.0, z);

        // Shockwave ring
        const ringGeo = new THREE.RingGeometry(0.5, 0.9, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        grp.add(ring);

        // 30 Golden spark particles
        const count = 30;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
          positions[i*3] = 0; positions[i*3+1] = 0; positions[i*3+2] = 0;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const spd = 4 + Math.random() * 7;
          velocities.push({
            vx: Math.sin(phi) * Math.cos(theta) * spd,
            vy: Math.abs(Math.cos(phi)) * spd + 2,
            vz: Math.sin(phi) * Math.sin(theta) * spd
          });
        }
        const ptsGeo = new THREE.BufferGeometry();
        ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const ptsMat = new THREE.PointsMaterial({ color: 0xffea00, size: 0.35, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false });
        const pts = new THREE.Points(ptsGeo, ptsMat);
        grp.add(pts);

        this.scene.add(grp);
        this._checkpointFXList.push({ group: grp, ring, particles: pts, velocities, life: 0.9, age: 0 });

        if (window.TrafficAudio) window.TrafficAudio.playCheckpoint();
      }

      // ── Trigger Police Violation Emergency Strobe ──
      _triggerPoliceStrobe() {
        this._initVFX();
        if (!this._policeStrobeEl) return;
        let count = 0;
        const interval = setInterval(() => {
          count++;
          const isRed = count % 2 === 1;
          this._policeStrobeEl.style.boxShadow = isRed
            ? 'inset 0 0 100px rgba(239, 68, 68, 0.7)'
            : 'inset 0 0 100px rgba(59, 130, 246, 0.7)';
          this._policeStrobeEl.style.opacity = '1';
          if (count >= 8) {
            clearInterval(interval);
            this._policeStrobeEl.style.opacity = '0';
          }
        }, 120);

        if (window.TrafficAudio) window.TrafficAudio.playSiren();
      }

      _updateCrashFX(dt) {
        // Update sparks
        for (let i = this._sparks.length - 1; i >= 0; i--) {
          const s = this._sparks[i];
          s.age += dt;
          if (s.age >= s.life) {
            this.scene.remove(s.points);
            s.points.geometry.dispose();
            s.points.material.dispose();
            this._sparks.splice(i, 1);
            continue;
          }
          const pos = s.points.geometry.attributes.position.array;
          for (let j = 0; j < s.velocities.length; j++) {
            const v = s.velocities[j];
            v.vy -= 12 * dt; // gravity
            pos[j*3] += v.vx * dt;
            pos[j*3+1] += v.vy * dt;
            pos[j*3+2] += v.vz * dt;
            if (pos[j*3+1] < 0) pos[j*3+1] = 0;
          }
          s.points.geometry.attributes.position.needsUpdate = true;
          s.points.material.opacity = 1 - (s.age / s.life);
        }
        // Update debris
        for (let i = this._debris.length - 1; i >= 0; i--) {
          const d = this._debris[i];
          d.age += dt;
          if (d.age >= d.life) {
            this.scene.remove(d.group);
            d.pieces.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
            this._debris.splice(i, 1);
            continue;
          }
          d.pieces.forEach(p => {
            const v = p.userData.vel;
            v.y -= 10 * dt;
            p.position.x += v.x * dt;
            p.position.y += v.y * dt;
            p.position.z += v.z * dt;
            if (p.position.y < 0.05) { p.position.y = 0.05; v.y *= -0.3; v.x *= 0.8; v.z *= 0.8; }
            const rv = p.userData.rotVel;
            p.rotation.x += rv.x * dt;
            p.rotation.y += rv.y * dt;
            p.rotation.z += rv.z * dt;
            p.material.opacity = 1 - (d.age / d.life);
          });
        }
        // Update skid marks (fade over time)
        for (let i = this._skidMarks.length - 1; i >= 0; i--) {
          const m = this._skidMarks[i];
          m.age += dt;
          if (m.age >= m.maxAge) {
            this.scene.remove(m.mesh);
            m.mesh.geometry.dispose();
            m.mesh.material.dispose();
            this._skidMarks.splice(i, 1);
            continue;
          }
          m.mesh.material.opacity = 0.6 * (1 - m.age / m.maxAge);
        }
        // Hitstop (time slowdown on hard impact)
        if (this._hitstopTimer > 0) {
          this._hitstopTimer -= dt;
        }
        // Damage overlay fade
        if (this._damageOverlayOpacity > 0) {
          this._damageOverlayOpacity = Math.max(0, this._damageOverlayOpacity - dt * 1.5);
          const overlay = document.getElementById('damage-overlay');
          if (overlay) overlay.style.opacity = this._damageOverlayOpacity;
        }
      }

      _applyCrashImpact(npcPos, impactSpeed) {
        const now = this.timer;
        if (now - this._lastCollisionTime < 0.3) return; // debounce
        this._lastCollisionTime = now;

        const intensity = Math.min(Math.abs(impactSpeed) / 1.0, 1.0); // 0-1 scale

        // ── Directional bounce (reflect velocity off collision normal) ──
        if (!this.player) return
        const dx = this.player.position.x - npcPos.x;
        const dz = this.player.position.z - npcPos.z;
        const dist = Math.hypot(dx, dz) || 1;
        const nx = dx / dist, nz = dz / dist;
        // Reflect and dampen
        const dot = this.vx * nx + this.vz * nz;
        this.vx -= 2 * dot * nx * 0.6;
        this.vz -= 2 * dot * nz * 0.6;
        // Additional speed reversal
        this.speed = Math.max(-0.5, Math.min(0.5, this.speed * -(0.15 + 0.15 * intensity)));

        // ── Camera shake scaled by speed ──
        this._camShakeAmt = Math.max(this._camShakeAmt, 0.2 + intensity * 0.6);

        // ── Hitstop (freeze frame) for hard impacts ──
        if (intensity > 0.5) {
          this._hitstopTimer = 0.05 + intensity * 0.12;
        }

        // ── Screen flash ──
        if (intensity > 0.3) {
          const flash = document.getElementById('speed-flash');
          if (flash) {
            flash.style.background = 'rgba(255, 60, 40, ' + (intensity * 0.35) + ')';
            flash.style.display = 'block';
            setTimeout(() => flash.style.display = 'none', 100 + intensity * 100);
          }
        }

        // ── Damage overlay ──
        this._damageOverlayOpacity = Math.min(0.6, intensity * 0.6);
        let dmgOverlay = document.getElementById('damage-overlay');
        if (!dmgOverlay) {
          dmgOverlay = document.createElement('div');
          dmgOverlay.id = 'damage-overlay';
          dmgOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:80;background:radial-gradient(ellipse at center, transparent 40%, rgba(180,20,20,0.5) 100%);opacity:0;transition:opacity 0.3s;';
          document.body.appendChild(dmgOverlay);
        }
        dmgOverlay.style.opacity = this._damageOverlayOpacity;

        // ── Windshield crack overlay for high-speed impacts ──
        if (intensity > 0.7) {
          let crack = document.getElementById('crack-overlay');
          if (!crack) {
            crack = document.createElement('div');
            crack.id = 'crack-overlay';
            crack.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:81;opacity:0;transition:opacity 0.2s;';
            // Draw crack lines on canvas
            const c = document.createElement('canvas');
            c.width = window.innerWidth; c.height = window.innerHeight;
            crack.appendChild(c);
            const ctx = c.getContext('2d');
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1.5;
            const cx = c.width/2, cy = c.height/3;
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI*2/8)*i + (Math.random()-0.5)*0.5;
              const len = 40 + Math.random()*80;
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(cx + Math.cos(angle)*len, cy + Math.sin(angle)*len);
              ctx.stroke();
              // Branch
              if (Math.random() > 0.4) {
                const bx = cx + Math.cos(angle)*len*0.6;
                const by = cy + Math.sin(angle)*len*0.6;
                const ba = angle + (Math.random()-0.5)*1.2;
                const bl = 15 + Math.random()*30;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(ba)*bl, by + Math.sin(ba)*bl);
                ctx.stroke();
              }
            }
            document.body.appendChild(crack);
          }
          crack.style.opacity = Math.min(0.8, intensity * 0.9);
          setTimeout(() => { if(crack) crack.style.opacity = '0'; }, 2000);
        }

        // ── Spawn VFX at collision point ──              if (this.player) this._spawnSparks(this.player.position.x, this.player.position.z, intensity);
        if (intensity > 0.3 && this.player) {
          this._spawnDebris(this.player.position.x, this.player.position.z, intensity, 0x666666);
        }

        // ── Skid marks if sliding ──
        if (intensity > 0.2 && this.player && Math.abs(this.speed) > 0.1) {
          this._spawnSkidMark(this.player.position.x, this.player.position.z, this.player.rotation.y, 1 + intensity * 2);
        }

        // ── Vehicle mesh damage: tilt panels ──
        if (this.playerVehicle && intensity > 0.4) {
          const dmg = Math.min(intensity, 1);
          // Hood tilt forward
          const hood = this.playerVehicle.getObjectByName('hood');
          if (hood) hood.rotation.x = -dmg * 0.15;
          // Random panel offset
          this.playerVehicle.children.forEach(child => {
            if (child.userData && child.userData.isPanel) {
              child.position.y += (Math.random()-0.5) * dmg * 0.05;
              child.rotation.z += (Math.random()-0.5) * dmg * 0.05;
            }
          });
        }

        // ── FOV punch ──
        this._camFovTarget = 60 + intensity * 12;

        // ── Speed lines intensity ──
        this._speedLinesIntensity = Math.min(1, intensity * 1.5);
      }
      startLevel() {
        // Clean up any dangling 2D scenario canvas/overlays
        if (window.Scenario2D && typeof window.Scenario2D.destroy === 'function') {
          try { window.Scenario2D.destroy(); } catch (e) {}
        }
        document.querySelectorAll('canvas[style*="z-index: 10000"], canvas[style*="z-index:10000"]').forEach(c => c.remove());

        const cd = document.getElementById('cdown');
        if (cd) cd.classList.add('on');
        setTimeout(() => {
          if (cd) cd.classList.remove('on');
          try {
            Promise.resolve(this._actualStart(ui.cur)).catch(err => this._onActualStartFailed(err));
          } catch (e) {
            console.error('[Driving] startLevel sync error:', e);
            this._onActualStartFailed(e);
          }
        }, 1200);
      }
      // _actualStart() is async and was previously called without being awaited or caught —
      // any error thrown inside it (bad map config, a failed asset load, etc.) became a
      // silent unhandled promise rejection. The loading screen just hung forever with no
      // player-visible error, until start.js's generic 15–18s "canvas never turned on"
      // safety net eventually fired and redirected to Academy.html?screen=levels. That
      // redirect was never related to the quiz — this surfaces the real error immediately
      // instead of waiting out that timer.
      _onActualStartFailed(err) {
        console.error('[Driving] _actualStart() failed for level', ui.cur && ui.cur.id, err);
        this._hideLoading();
        toast('⚠️ Level failed to load', '#ff3b30');
      }
      async _actualStart(lv) {
        // Show loading screen with level name
        this._showLoading(lv.name || 'Level ' + lv.id);
        this._updateLoading(5, 'Resetting game state...');
        this.mode = lv.mode || ui.curMode || 'car';
        this.vehMode = lv.vehMode || (ui.curMode === 'pedestrian' ? 'pedestrian' : (ui.curMode || 'car'));
        this.isPedestrian = (this.vehMode === 'pedestrian' || this.mode === 'pedestrian');
        this.lvId = lv.id; this.score = 0; this.hp = 100; this.fine = 0; this.vio = 0; this.timer = 0; this.speed = 0; this.routeIdx = 0; this.retries = 0; this.vx = 0; this.vz = 0;
        // Start gameplay recording
        if (window.GameplayRecorder) GameplayRecorder.start(lv.id, lv.name || '');
        this.ms = { inSz: false, passed: false, amb: null };
        this.challanFired = new Set();
        this.seatbeltOn = false;
        this.mobileOn = false;
        this.bucklingUp = false;
        // GTA-style enter/exit state machine
        this._enterState = 'IDLE';
        this._enterTimer = 0;
        this._enterDir = 1;
        this._enterDoorSide = 'L';
        this._enterWalkStart = null;
        this._enterWalkEnd = null;
        this._camOverride = false;
        this._camSnapped = false;
        this._lastStepTime = 0;
        this.camYaw = 0; this.camPitch = 0;
        this.targetCamYaw = 0; this.targetCamPitch = 0;
        this.boostFuel = 100; this.boosting = false; this._wasDepleted = false;
        this._grip = 0.62; this._camShakeAmt = 0; this._camTilt = 0;
        const _initFov = this.isPedestrian ? 65 : ((VEHICLE_CAM[this.vehMode] || VEHICLE_CAM_DEFAULT).baseFov);
        this._camFovTarget = _initFov;
        if (this.camera) { this.camera.fov = _initFov; this.camera.updateProjectionMatrix(); }
        // ── Reset Enhanced Physics ──
        this._bodyRoll = 0; this._bodyPitch = 0; this._suspensionY = 0;
        this._brakeHeat = 0; this._tireWear = 0;
        this._collisionImpulse.set(0,0,0); this._lastCollisionTime = 0;
        this._hitstopTimer = 0; this._damageOverlayOpacity = 0;
        this._wheelSpin = 0;
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
        // Ethical driving state flags (new mechanics)
        this._turnAccum = 0;          // sustained turning time without indicator
        this._turnAccumDir = 0;       // which direction accumulator is tracking
        this._lastInputTime = 0;      // timestamp of last keyboard/touch input
        this._idleHintShown = false;  // whether idle hint is currently showing
        this._phoneRingTimer = 15;    // seconds until next phone ring temptation
        this._phoneRinging = false;   // whether phone ring overlay is active
        this._zebraYieldShown = false; // whether zebra yield prompt is showing
        this._zebraYieldCD = 0;       // cooldown for zebra yield prompt
        this._roadSignCD = 0;         // cooldown for road-sign interaction
        this._animalCrossCount = 0;   // animals successfully stopped for
        this._litterHits = 0;         // litter items hit
        this._overtakeCheckDone = false; // whether overtake safety was checked
        this._roadRageCD = 0;         // cooldown for road-rage effects
        this._policeStopActive = false;  // police checkpoint stop in progress
        this._policeStopTimer = 0;    // time player has been stopped at checkpoint
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
        this.setGear('D');
        this._updateLoading(20, 'Loading vehicle models...');
        // Lazy-load level-specific models before building scene
        if (typeof window.loadLevelAssets === 'function') {
          await new Promise(resolve => window.loadLevelAssets(lv.assets, resolve));
        }
        this._updateLoading(50, 'Building city environment...');
        await new Promise(r => requestAnimationFrame(r));
        this._buildScene(lv.mode);
        this._buildRouteCheckpoints(this.mapCfg || lv);
        this._updateLoading(80, 'Spawning traffic & pedestrians...');
        await new Promise(r => requestAnimationFrame(r));
        this._updateLoading(100, 'Ready!');
        await new Promise(r => setTimeout(r, 300)); // brief pause so player sees 100%
        this._hideLoading();
        this.playing = true; this.pause = false; ui.show(null);
        this._initViolationsLog();
        if (window.TaskManager) {
          this.taskManager = new window.TaskManager(this);
          this.taskManager.init(this.mapCfg || lv);
        }
        const baseTime = this.mapCfg ? this.mapCfg.timeLimit || 120 : 120;
        const ageTimeScale = (typeof ui !== 'undefined' && ui.getAgeScale) ? ui.getAgeScale() : 1.0;
        this.timeLimit = Math.round(baseTime / ageTimeScale);
        const cfg = this.mapCfg || {};
        ['gc', 'player-hud-card', 'hud', 'hudbar', 'hwrap', 'mobile-controls', 'objective-overlay'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('on'); });
        // ── HUD Entrance Animations ──
        if (typeof IntersectionObserver === 'undefined' || true) {
          const hudAnims = [
            { id: 'hwrap', cls: 'hud-enter-left' },
            { id: 'hcp', cls: 'hud-enter-top' },
            { id: 'htmr', cls: 'hud-enter-top' },
            { id: 'mmc', cls: 'hud-enter-right' },
            { id: 'gspd', cls: 'hud-enter-right' },
            { id: 'da', cls: 'hud-enter-bottom' },
            { id: 'objective-overlay', cls: 'hud-enter-right' },
            { id: 'sig-ind', cls: 'hud-enter-bottom' }
          ];
          hudAnims.forEach((a, i) => {
            const el = document.getElementById(a.id);
            if (el) {
              el.style.animation = 'none';
              el.offsetHeight; // force reflow
              el.style.animation = `${a.cls.includes('scale') ? 'hudScaleIn' : a.cls.includes('left') ? 'hudSlideInLeft' : a.cls.includes('right') ? 'hudSlideInRight' : a.cls.includes('bottom') ? 'hudSlideInBottom' : 'hudSlideInTop'} 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both`;
            }
          });
        }
        if (this.dom['phone-gps-btn']) this.dom['phone-gps-btn'].style.display = 'flex';
        
        // Show objective & GTA Mission Introduction
        const objDesc = document.getElementById('objective-desc');
        if(objDesc && lv.pract) { objDesc.innerHTML = lv.pract; }
        if (window.showGtaMissionIntro) {
          window.showGtaMissionIntro(lv.id || 1);
        }
        
        if (!cfg.isPedestrian) { 
            ['spgauge', 'gp', 'civic-controls'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'flex'; });
        } else {
            const el = document.getElementById('civic-controls'); if (el) el.style.display = 'none';
        }
        
        // Reset button styles
        const btnS = document.getElementById('btn-seatbelt');
        if (btnS) {
            const wrap = document.getElementById('sb-icon-wrap');
            const label = document.getElementById('sb-label');
            if (wrap) { wrap.classList.remove('on'); wrap.classList.add('off'); }
            if (label) { label.textContent = (this.vehMode === 'bike' || this.vehMode === 'cycle') ? 'Helmet OFF' : 'Belt OFF'; label.classList.remove('on'); label.classList.add('off'); }
        }
        const btnM = document.getElementById('btn-mobile');
        if (btnM) {
            btnM.style.borderColor = '#555';
            const ml = btnM.querySelector('.civic-label');
            if (ml) { ml.textContent = 'Phone'; ml.style.color = ''; }
        }
        this._syncIndicatorUI();
        
        if (mob()) document.getElementById('tc').classList.add('on');
        if (mob()) this._autoGyro();
        if (this._checkOrientation) this._checkOrientation();
        const _hlvEl = document.getElementById('hlv'); if (_hlvEl) _hlvEl.textContent = lv.id; const _hobjEl = document.getElementById('hobj'); if (_hobjEl) _hobjEl.textContent = lv.tg || ''; this._uh(); if (window.sfx && sfx.play) sfx.play('ok');
        if (this._hudShowBrief) this._hudShowBrief();
        
        // Initialize tasks for this level
        this._initTasks(lv);

        // Register HUD elements with SafeZoneGrid for responsive layout
        if (window.safeZoneGridInstance) {
          const SZ = window.safeZoneGridInstance;
          if (document.getElementById('player-hud-card')) SZ.register('player-hud', document.getElementById('player-hud-card'), 'TL', { order: 0, priority: 'high' });
          if (document.getElementById('objective-overlay')) SZ.register('objective', document.getElementById('objective-overlay'), 'TR', { order: 0, priority: 'high' });
          if (document.getElementById('task-tracker')) SZ.register('tasks', document.getElementById('task-tracker'), 'TR', { order: 1, priority: 'medium' });
          if (document.getElementById('civic-controls')) SZ.register('civic', document.getElementById('civic-controls'), 'BR', { order: 2, priority: 'low' });
          if (this.dom.mmc) {
            SZ.register('minimap', this.dom.mmc, 'BL', { order: 0, priority: 'high' });
            // Tap/click minimap → open fullscreen map
            this.dom.mmc.addEventListener('click', () => {
              const ov = document.getElementById('fs-map-overlay');
              if (ov) { ov.classList.add('active'); this._fsMapOpen = true; this._drawFullscreenMap(); }
            });
          }
          // Fullscreen map close button + Escape key
          const fsClose = document.getElementById('fs-map-close');
          if (fsClose) fsClose.addEventListener('click', () => {
            const ov = document.getElementById('fs-map-overlay');
            if (ov) { ov.classList.remove('active'); this._fsMapOpen = false; }
          });
          document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this._fsMapOpen) {
              const ov = document.getElementById('fs-map-overlay');
              if (ov) { ov.classList.remove('active'); this._fsMapOpen = false; }
            }
          });
          if (this.dom['sig-ind']) SZ.register('signal', this.dom['sig-ind'], 'TC', { order: 0, priority: 'high' });
          if (this.dom['dn-clock']) SZ.register('clock', this.dom['dn-clock'], 'TC', { order: 1, priority: 'medium' });
          if (document.getElementById('spgauge')) SZ.register('speedometer', document.getElementById('spgauge'), 'BR', { order: 0, priority: 'high' });
          if (this.dom.boostgauge) SZ.register('boost', this.dom.boostgauge, 'BR', { order: 1, priority: 'high' });
          if (this.dom.ow) SZ.register('violations', this.dom.ow, 'TC', { order: 2, priority: 'high' });
          if (this.dom.da) SZ.register('direction', this.dom.da, 'BC', { order: 0, priority: 'high' });
          if (this._isMobile) {
            SZ.register('steer', document.getElementById('steer-wheel-container'), 'BL', { order: 10, priority: 'high' });
            SZ.register('gas', document.getElementById('mc-gas'), 'BR', { order: 10, priority: 'high' });
            SZ.register('brake', document.getElementById('mc-brake'), 'BR', { order: 11, priority: 'high' });
          }
        }
      }
      stopPlay() { this.playing = false; this.tasks = []; const tt = document.getElementById('task-tracker'); if (tt) tt.style.display = 'none'; const slb = document.getElementById('speed-limit-badge'); if (slb) slb.style.display = 'none'; ['gc', 'player-hud-card', 'hud', 'hudbar', 'hwrap', 'spgauge', 'gp', 'tc', 'mobile-controls', 'objective-overlay'].forEach(i => { const el = document.getElementById(i); if (el) el.classList.remove('on'); }); const cc = document.getElementById('civic-controls'); if (cc) cc.style.display = 'none'; const bg = this.dom['boostgauge']; if (bg) bg.style.display = 'none'; const bv = this.dom['boost-vignette']; if (bv) { bv.style.display = 'none'; bv.style.opacity = '0'; }         const br = this.dom['boost-ready']; if (br) { br.style.display = 'none'; br.style.opacity = '0'; }         const sl = this.dom['speed-lines']; if (sl) { sl.style.display = 'none'; sl.style.opacity = '0'; } this._camShakeAmt = 0; this._camTilt = 0; this._camFovTarget = 60; if(this.dom['mmc']) this.dom['mmc'].classList.remove('on'); const cmp = document.getElementById('compass-strip'); if (cmp) cmp.style.display = 'none'; if(this.dom['da']) this.dom['da'].style.display = 'none'; if(this.dom['sig-ind']) this.dom['sig-ind'].style.display = 'none'; if(this.dom['ow']) this.dom['ow'].classList.remove('on'); if(this.dom['phone-gps']) this.dom['phone-gps'].classList.remove('on'); this.phoneGpsOn = false; if(this.dom['phone-gps-btn']) this.dom['phone-gps-btn'].style.display = 'none'; 
        
        // Release all pooled objects to prevent memory leaks
        if (window.ThreePools) ThreePools.releaseAll();
        // Reset enter/exit and camera state to prevent stale overrides on replay
        this._camOverride = false;
        this._enterState = 'IDLE';
        this._camSnapped = false;
        this.camYaw = 0; this.camPitch = 0;
        this.targetCamYaw = 0; this.targetCamPitch = 0;
        if (this.camera) { this.camera.fov = 65; this.camera.updateProjectionMatrix(); }
        // Cleanup crash VFX (Not implemented yet)
        
        // Clean up GPS navigation elements
        if (this._gpsFlowChevrons) {
          this._gpsFlowChevrons.forEach(c => { this.scene.remove(c); c.children.forEach(ch => { ch.geometry?.dispose(); ch.material?.dispose(); }); });
          this._gpsFlowChevrons = [];
        }
        if (this._gpsTurnLabels) {
          this._gpsTurnLabels.forEach(l => { this.scene.remove(l); l.material?.map?.dispose(); l.material?.dispose(); });
          this._gpsTurnLabels = [];
        }
        if (this._gpsTurnSprites) {
          Object.values(this._gpsTurnSprites).forEach(s => { this.scene.remove(s); s.material?.map?.dispose(); s.material?.dispose(); });
          this._gpsTurnSprites = {};
        }
        if (this._breadcrumbPath) { this.scene.remove(this._breadcrumbPath); this._breadcrumbPath = null; }

        // Clear road graph reference
        this.roadGraph = null;

        // Clean up world streamer
        if (this.worldStreamer) {
          this.worldStreamer.reset();
          this.worldStreamer = null;
        }

        // Clean up mission manager
        if (this.missionManager) {
          this.missionManager.clear();
        }
      }
      toggleSeatbelt(btn) {
          this.seatbeltOn = !this.seatbeltOn;
          if (window.TrafficAudio) window.TrafficAudio.playSeatbelt(this.seatbeltOn);
          const isBike = (this.vehMode === 'bike' || this.vehMode === 'cycle');
          const wrap = document.getElementById('sb-icon-wrap');
          const label = document.getElementById('sb-label');
          if (this.seatbeltOn) {
              if (wrap) { wrap.classList.remove('off'); wrap.classList.add('on'); }
              if (label) { label.textContent = isBike ? 'Helmet ON' : 'Belt ON'; label.classList.remove('off'); label.classList.add('on'); }
              toast(isBike ? 'Helmet Secured! +15% Speed' : 'Seatbelt Fastened! +10% Speed, 50% Less Damage', '#27ae60');
              if (!this.isPedestrian) {
                  const base = this.mapCfg && this.mapCfg.themeType === 'highway' ? 1.4 : 1.1;
                  this.maxSpd = base * (isBike ? 1.15 : 1.1);
                  this._seatbeltDamageReduction = true;
              }
          } else {
              if (wrap) { wrap.classList.remove('on'); wrap.classList.add('off'); }
              if (label) { label.textContent = isBike ? 'Helmet OFF' : 'Belt OFF'; label.classList.remove('on'); label.classList.add('off'); }
              toast(isBike ? 'Helmet Removed! -15% Speed' : 'Seatbelt Unfastened! Full Collision Damage', '#ff3b30');
              if (!this.isPedestrian) {
                  this.maxSpd = this.mapCfg && this.mapCfg.themeType === 'highway' ? 1.4 : 1.1;
                  this._seatbeltDamageReduction = false;
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
      // ── Loading Screen Helpers ──
      _showLoading(levelName) {
        const ls = document.getElementById('loading-screen');
        if (!ls) return;
        const nameEl = document.getElementById('loading-level-name');
        if (nameEl) nameEl.textContent = levelName || 'Loading...';
        const bar = document.getElementById('loading-bar');
        if (bar) bar.style.width = '0%';
        const pct = document.getElementById('loading-pct');
        if (pct) pct.textContent = '0%';
        const status = document.getElementById('loading-status');
        if (status) status.textContent = 'Initializing assets...';
        // Level badge
        const badge = document.getElementById('loading-level-badge');
        const lvId = this.lvId || 1;
        const isPed = this.isPedestrian;
        if (badge) {
          badge.textContent = isPed ? '🚶 Pedestrian Level' : '🏁 Driving Level';
        }
        // Rotate through driving tips
        const tips = [
          '💡 Always wear your seatbelt — it saves lives!',
          '💡 Use turn signals before every lane change.',
          '💡 Maintain at least 2 seconds of following distance.',
          '💡 Reduce speed in school zones and residential areas.',
          '💡 Never use your phone while driving.',
          '💡 Yield to pedestrians at crosswalks.',
          '💡 Check mirrors before braking or turning.',
          '💡 Headlights are required in rain and fog.',
          '💡 Honking in silence zones carries a ₹2,000 fine.',
          '💡 Parallel parking requires patience and practice.',
        ];
        const tipsEl = document.getElementById('loading-tips');
        if (tipsEl) tipsEl.innerHTML = '<span>Pro tip:</span> ' + tips[Math.floor(Math.random() * tips.length)];
        // Reset dots
        const dots = ls.querySelectorAll('.ls-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === 0));
        ls.classList.remove('fade-out');
        ls.style.display = 'flex';
        // Force reflow for entry animation
        ls.offsetHeight;
        ls.style.opacity = '1';
      }
      _updateLoading(pctVal, statusText) {
        const bar = document.getElementById('loading-bar');
        if (bar) bar.style.width = pctVal + '%';
        const pctEl = document.getElementById('loading-pct');
        if (pctEl) pctEl.textContent = pctVal + '%';
        const statusEl = document.getElementById('loading-status');
        if (statusEl && statusText) statusEl.textContent = statusText;
        // Animate progress dots
        const ls = document.getElementById('loading-screen');
        if (ls) {
          const dots = ls.querySelectorAll('.ls-dot');
          const activeDot = Math.min(Math.floor(pctVal / 22), dots.length - 1);
          dots.forEach((d, i) => d.classList.toggle('active', i <= activeDot));
        }
      }
      _hideLoading() {
        const ls = document.getElementById('loading-screen');
        if (!ls) return;
        if (this._hideLoadingTimer) clearTimeout(this._hideLoadingTimer);
        ls.classList.add('fade-out');
        this._hideLoadingTimer = setTimeout(() => { ls.style.display = 'none'; ls.classList.remove('fade-out'); ls.style.opacity = ''; this._hideLoadingTimer = null; }, 800);
      }

      // ── Level Preview Modal ──
      _showLevelPreview(lv) {
        return new Promise((resolve) => {
          const overlay = document.getElementById('level-preview-overlay');
          if (!overlay) { resolve(true); return; }
          // Populate preview data
          const numEl = document.getElementById('lp-level-num');
          if (numEl) numEl.textContent = 'Level ' + (lv.id || 1);
          const nameEl = document.getElementById('lp-name');
          if (nameEl) nameEl.textContent = lv.name || 'Level ' + lv.id;
          const descEl = document.getElementById('lp-desc');
          if (descEl) descEl.textContent = lv.ds || 'Complete the driving mission to earn rewards and unlock the next level.';
          const iconEl = document.getElementById('lp-icon');
          if (iconEl) iconEl.textContent = lv.icon || '🚗';
          const timeEl = document.getElementById('lp-time');
          if (timeEl) { const t = lv.timeLimit || 120; const m = Math.floor(t/60); const s = t%60; timeEl.textContent = m + ':' + String(s).padStart(2,'0'); }
          const bestEl = document.getElementById('lp-best');
          if (bestEl) {
            const saved = JSON.parse(localStorage.getItem('mth4') || '{}');
            const completed = saved.completed || {};
            const lvData = completed[String(lv.id)];
            bestEl.textContent = (lvData && lvData.score > 0) ? lvData.score.toLocaleString() : '—';
          }
          const rewEl = document.getElementById('lp-reward');
          if (rewEl) { const rewards = [2000,2000,2500,2500,3000,3000,3000,3500,3500,4000,4000,4500,4500,5000,6000]; rewEl.textContent = '₹' + (rewards[Math.min((lv.id||1)-1, 14)]/1000).toFixed(1) + 'K'; }
          // Difficulty dots (1-5 based on level)
          const diffEl = document.getElementById('lp-diff-dots');
          if (diffEl) {
            const diff = Math.min(5, Math.max(1, Math.ceil((lv.id || 1) / 11)));
            diffEl.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
              const dot = document.createElement('div');
              dot.className = 'lp-diff-dot' + (i <= diff ? ' filled' : '');
              diffEl.appendChild(dot);
            }
          }
          // Show overlay
          overlay.style.display = 'flex';
          requestAnimationFrame(() => overlay.classList.add('show'));
          // Wire buttons
          const startBtn = document.getElementById('lp-start');
          const backBtn = document.getElementById('lp-back');
          const cleanup = () => {
            overlay.classList.remove('show');
            setTimeout(() => { overlay.style.display = 'none'; }, 400);
            if (startBtn) startBtn.onclick = null;
            if (backBtn) backBtn.onclick = null;
          };
          if (startBtn) startBtn.onclick = () => { cleanup(); resolve(true); };
          if (backBtn) backBtn.onclick = () => { cleanup(); resolve(false); };
        });
      }
      togglePause() {
          if (!this.playing) return;
          this.pause = !this.pause;
          const overlay = document.getElementById('pause-overlay');
          if (overlay) {
            overlay.classList.toggle('on', this.pause);
            // ── Smooth pause menu animation ──
            if (this.pause) {
              if (this._pauseAnimating) return; // guard against rapid toggle
              this._pauseAnimating = true;
              overlay.style.animation = 'pauseOverlayIn 0.25s ease-out';
              const panel = overlay.querySelector('[style*="font-family"]');
              if (panel) {
                panel.style.animation = 'pausePanelIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both';
              }
              // Stagger-animate pause buttons
              const btns = overlay.querySelectorAll('button, .pause-tab');
              btns.forEach((b, i) => {
                b.style.opacity = '0';
                b.style.transform = 'translateY(10px)';
                b.style.transition = `opacity 0.3s ${i * 0.04}s, transform 0.3s ${i * 0.04}s cubic-bezier(0.16, 1, 0.3, 1)`;
                requestAnimationFrame(() => { b.style.opacity = '1'; b.style.transform = 'translateY(0)'; });
              });
              setTimeout(() => { this._pauseAnimating = false; }, 350);
              // Reset to main tab when pausing
              if (typeof pauseTab === 'function') pauseTab('main');
              if (!this._pauseWired) {
                this._pauseWired = true;
                document.getElementById('pause-resume')?.addEventListener('click', () => this.togglePause());
                document.getElementById('pause-restart')?.addEventListener('click', () => { this.pause = false; location.reload(); });
                document.getElementById('pause-quit')?.addEventListener('click', () => {
                  this.pause = false;
                  this.playing = false;
                  const o = document.getElementById('pause-overlay');
                  if (o) {
                    o.style.animation = 'pausePanelOut 0.2s ease-in both';
                    setTimeout(() => { o.classList.remove('on'); o.style.animation = ''; }, 200);
                  }
                  document.getElementById('game-over')?.classList.add('on');
                });
              }
            } else {
              // Smooth close
              if (this._pauseAnimating) return;
              this._pauseAnimating = true;
              overlay.style.animation = 'pausePanelOut 0.2s ease-in both';
              setTimeout(() => { overlay.style.animation = ''; this._pauseAnimating = false; }, 250);
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
              this.turnSignal = 0;
              toast('Turn Signal OFF', '#95a5a6');
          } else {
              this.turnSignal = dir;
              toast(dir === -1 ? 'Left Signal ON' : 'Right Signal ON', '#f39c12');
          }
          this._syncIndicatorUI();
      }
      _syncIndicatorUI() {
          const l = document.getElementById('btn-ind-left');
          const r = document.getElementById('btn-ind-right');
          if (l) l.classList.toggle('active', this.turnSignal === -1);
          if (r) r.classList.toggle('active', this.turnSignal === 1);
      }
      // ── Road-sign recognition quiz (C) ──
      _showRoadSignQuiz(sign) {
        const signTypes = [
          { q: 'What does this sign mean?', icon: '🚸', correct: 'School Zone', opts: ['School Zone', 'No Parking', 'Speed Breaker', 'Toll Ahead'] },
          { q: 'Identify this sign:', icon: '🛑', correct: 'Stop', opts: ['Stop', 'Give Way', 'No Entry', 'One Way'] },
          { q: 'What does this sign indicate?', icon: '⚠️', correct: 'Speed Breaker Ahead', opts: ['Speed Breaker Ahead', 'Narrow Road', 'Slippery Road', 'Falling Rocks'] },
          { q: 'Read this road sign:', icon: '🚫', correct: 'No Entry', opts: ['No Entry', 'No Parking', 'No Horn', 'No Overtaking'] },
          { q: 'What does this sign mean?', icon: '🛣️', correct: 'Speed Limit', opts: ['Speed Limit', 'End of Restricted Zone', 'Highway Start', 'Toll Ahead'] },
          { q: 'Identify this sign:', icon: '🚧', correct: 'Road Work Ahead', opts: ['Road Work Ahead', 'Detour', 'Closed Road', 'Accident Zone'] },
          { q: 'What does this sign indicate?', icon: '🏭', correct: 'Industrial Area', opts: ['Industrial Area', 'Hospital Zone', 'School Zone', 'Residential Zone'] },
          { q: 'Read this road sign:', icon: '⛪', correct: 'Hospital Zone', opts: ['Hospital Zone', 'School Zone', 'Religious Place', 'Community Center'] },
        ];
        const pick = signTypes[Math.floor(Math.random() * signTypes.length)];
        const shuffled = pick.opts.sort(() => Math.random() - 0.5);
        let quiz = document.getElementById('road-sign-quiz');
        if (!quiz) {
          quiz = document.createElement('div');
          quiz.id = 'road-sign-quiz';
          quiz.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a2e;border:3px solid #5ed4f5;border-radius:16px;padding:24px;z-index:10010;width:min(400px,85vw);box-shadow:0 8px 40px rgba(0,0,0,.7);';
          document.body.appendChild(quiz);
        }
        quiz.innerHTML = `<div style="text-align:center;margin-bottom:16px"><div style="font-size:48px">${pick.icon}</div><div style="color:#e8e3d8;font-size:18px;margin-top:8px;font-weight:600">${pick.q}</div></div><div style="display:flex;flex-direction:column;gap:8px" id="rsq-opts"></div>`;
        quiz.style.display = 'block';
        const optContainer = quiz.querySelector('#rsq-opts');
        shuffled.forEach(opt => {
          const btn = document.createElement('button');
          btn.textContent = opt;
          btn.style.cssText = 'padding:12px;border:2px solid #333;border-radius:10px;background:#111;color:#e8e3d8;font-size:16px;cursor:pointer;transition:all .2s;font-weight:600;';
          btn.addEventListener('mouseenter', () => { btn.style.borderColor = '#5ed4f5'; btn.style.background = '#1a2a3e'; });
          btn.addEventListener('mouseleave', () => { btn.style.borderColor = '#333'; btn.style.background = '#111'; });
          btn.addEventListener('click', () => {
            quiz.style.display = 'none';
            if (opt === pick.correct) {
              toast('✅ Correct! +50 bonus points', '#34d399');
              this.score += 50;
              sfx.play('correct');
            } else {
              toast(`❌ Wrong! It means: ${pick.correct}`, '#ef4444');
              this.score -= 20;
              sfx.play('error');
            }
            if (sign) sign._answered = true;
          });
          optContainer.appendChild(btn);
        });
      }
      toggleMobile(btn) {
          this.mobileOn = !this.mobileOn;
          const isParked = this.isPedestrian || Math.abs(this.speed) < 0.05;
          const label = btn ? btn.querySelector('.civic-label') : null;
          if (this.mobileOn) {
              this._mobileMode = (this._mobileMode || 0) + 1;
              if (this._mobileMode > 2) this._mobileMode = 0;

              if (this._mobileMode === 1 && isParked) {
                  if (btn) btn.style.borderColor = '#2196F3';
                  if (label) { label.textContent = 'GPS'; label.style.color = '#2196F3'; }
                  toast('🗺️ GPS Navigation — Shows route to checkpoint!', '#2196F3');
                  this.phoneGpsOn = true;
                  if (this.dom['phone-gps']) this.dom['phone-gps'].classList.add('on');
                  if (this.dom['phone-gps-btn']) this.dom['phone-gps-btn'].style.display = 'block';
              } else if (this._mobileMode === 2 && isParked) {
                  if (btn) btn.style.borderColor = '#9b59b6';
                  if (label) { label.textContent = 'Music'; label.style.color = '#9b59b6'; }
                  toast('🎵 Background Music Enabled', '#9b59b6');
              } else if (this._mobileMode === 0) {
                  if (btn) btn.style.borderColor = '#e74c3c';
                  if (label) { label.textContent = 'Distracted!'; label.style.color = '#e74c3c'; }
                  toast('⚠️ Distracted Driving! ₹500 fine', '#e74c3c');
                  if (!this.challanFired.has('mobile_drive')) {
                      this.challanFired.add('mobile_drive');
                      
                      // Check cumulative rules for mobile use
                      const _lvId = (ui.cur ? ui.cur.id : 1);
                      const cumCheck = this.checkCumulativeViolation('mobile_use', _lvId);
                      if (cumCheck.enforce) {
                        this._triggerPoliceStrobe(); ui.issueChallan('Using Mobile while Driving', 'Sec 184 MV Act', '₹5,000', 'Dangerous Driving');
                        this.vio++; this.violationsLog.push('MOBILE_USE'); this.score -= 50; this.fine += 5000;
                      } else {
                        this.violationsLog.push('MOBILE_USE_WARNING');
                        toast('⚠️ Mobile use while driving — first warning', '#f2b84b');
                      }
                      if (window.GameplayRecorder) GameplayRecorder.record('MOBILE_USE', { speed: Math.round(Math.abs(this.speed) * 100), score: this.score, fine: this.fine });
                      this.hp -= 10; this._uh();
                  }
              } else {
                  if (btn) btn.style.borderColor = '#e74c3c';
                  if (label) { label.textContent = 'Unsafe!'; label.style.color = '#e74c3c'; }
                  toast('📵 Cannot use phone while driving!', '#e74c3c');
                  this._mobileMode = 0;
                  this.mobileOn = false;
              }
          } else {
              if (btn) btn.style.borderColor = '#555';
              if (label) { label.textContent = 'Phone'; label.style.color = ''; }
              this.phoneGpsOn = false;
              if (this.dom['phone-gps']) this.dom['phone-gps'].classList.remove('on');
              this._mobileMode = 0;
              toast('Phone Put Away', '#666');
          }
      }

      toggleGyro(btn) {
        if (this.gyroOn) {
          this.gyroOn = false;
          if (btn) btn.style.borderColor = '#555';
          toast('Gyroscope OFF', '#666');
        } else {
          this.requestGyroPermission();
          if (btn) btn.style.borderColor = '#34d399';
        }
      }

      toggleKidMode(btn) {
        this.kidModeActive = !this.kidModeActive;
        if (btn) {
          btn.style.borderColor = this.kidModeActive ? '#f2b84b' : '#555';
        }
        toast(this.kidModeActive ? '👶 Kid Mode Enabled: Assistance Active!' : '🧑 Pro Mode: Assistance Disabled', this.kidModeActive ? '#f2b84b' : '#666');

        // If we have a path, update its visibility immediately
        if (this._breadcrumbLine) {
          this._breadcrumbLine.visible = this.kidModeActive;
        }
      }
      _uh() { const p = Math.max(0, this.hp); const f = this.dom['hfill']; if (f) f.style.width = p + '%'; if (p <= 0) this._go("Structural Failure"); }
      
      _showIRLDeathPopup(cause) {
        this.pause = true; // Pause game immediately
        
        // Hide kid HUD elements so they don't overlap with the popup
        const kidHearts = document.getElementById('kid-hearts');
        if (kidHearts) kidHearts.style.display = 'none';
        const kidLevel = document.getElementById('kid-level-name');
        if (kidLevel) kidLevel.style.display = 'none';
        const kidTask = document.getElementById('kid-task-bar');
        if (kidTask) kidTask.style.display = 'none';
        const kidSteer = document.getElementById('kid-steer');
        if (kidSteer) kidSteer.style.display = 'none';

        let popup = document.getElementById('irl-death-popup');
        if (!popup) {
          popup = document.createElement('div');
          popup.id = 'irl-death-popup';
          // Ensure z-index is extremely high to be above the HP hearts (999999)
          popup.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(20,20,25,0.95); padding:30px; border-radius:12px; border:1px solid rgba(255,59,48,0.5); z-index:999999; display:flex; flex-direction:column; align-items:center; box-shadow:0 10px 40px rgba(0,0,0,0.8); text-align:center; min-width:320px; max-width:90vw; pointer-events:auto; font-family:var(--sans, sans-serif); color:#e8e3d8;';
          
          const icon = document.createElement('div');
          icon.style.cssText = 'font-size:3.5rem; margin-bottom:15px;';
          icon.textContent = '💀';
          
          const title = document.createElement('h2');
          title.style.cssText = 'color:#ff3b30; margin:0 0 15px 0; font-size:2rem; letter-spacing:1px;';
          title.textContent = 'FATAL ACCIDENT';
          
          const msg = document.createElement('p');
          msg.id = 'irl-death-msg';
          msg.style.cssText = 'font-size:1.1rem; line-height:1.6; margin-bottom:25px; color:#8891aa;';
          
          const btn = document.createElement('button');
          btn.textContent = 'CONTINUE TO REPORT';
          btn.style.cssText = 'background:#ff3b30; color:white; border:none; padding:14px 28px; border-radius:6px; font-size:1.1rem; font-weight:bold; cursor:pointer; font-family:var(--sans, sans-serif); text-transform:uppercase; transition:background 0.2s;';
          btn.addEventListener('mouseover', () => btn.style.background = '#d32f2f');
          btn.addEventListener('mouseout', () => btn.style.background = '#ff3b30');
          btn.addEventListener('click', () => {
            popup.style.display = 'none';
            this.pause = false;
            this._go('Hit by ' + (popup.dataset.cause || 'Vehicle'));
          });
          
          popup.appendChild(icon);
          popup.appendChild(title);
          popup.appendChild(msg);
          popup.appendChild(btn);
          document.body.appendChild(popup);
        }
        
        popup.dataset.cause = cause;
        document.getElementById('irl-death-msg').innerHTML = `You were struck by a ${cause}.<br><br><span style="color:#e8e3d8;">In the real world, being hit by a vehicle causes catastrophic physical trauma, permanent disability, or instant death.</span><br><br>Always look both ways, use designated crossings, and never play in traffic.`;
        popup.style.display = 'flex';
      }

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
        if (this.mapCfg && (this.mapCfg.themeType === 'market' || this.mapCfg.themeType === 'busy_market')) this._reachedMarket = true;

        // Hospital: level theme
        this._nearHospital = !!(this.mapCfg && (this.mapCfg.themeType === 'hospital' || this.mapCfg.themeType === 'hospital_zone'));

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
              else if (t.target === 'cow' && this._animalObstacle && this._animalObstacle.everWaitedNear) complete = true;
              else if (t.target === 'cow_moved' && this._animalObstacle && this._animalObstacle.moved) complete = true;
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
              if (t.target === 'honk' && !this._honkedThisFrame) complete = true;
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

      _collectMissionData(dt) {
        if (!this.player || !this.player.position) return;

        // Track lead vehicle for ESCORT missions
        if (this.npcs && this.npcs.length > 0) {
          // Find the lead vehicle (first NPC on route for escort missions)
          const escortNPCs = this.npcs.filter(n => n.userData?.missionRole === 'escort_lead');
          if (escortNPCs.length > 0) {
            this._leadVehiclePos = escortNPCs[0].position.clone();
          } else if (!this._leadVehiclePos && this.npcs[0]) {
            // Default to first NPC if no specific lead vehicle
            this._leadVehiclePos = this.npcs[0].position.clone();
          }

          // Track target vehicle for CHASE missions
          const chaseTargets = this.npcs.filter(n => n.userData?.missionRole === 'chase_target');
          if (chaseTargets.length > 0) {
            this._targetVehiclePos = chaseTargets[0].position.clone();
          }

          // Track pursuers for EVASION missions
          const pursuers = this.npcs.filter(n => n.userData?.missionRole === 'pursuer');
          if (pursuers.length > 0) {
            this._pursuerPositions = pursuers.map(p => p.position.clone());
          }

          // Track ambulance for EMERGENCY_CLEAR missions
          const ambulances = this.npcs.filter(n => n.userData?.npcType === 'ambulance' || n.userData?.missionRole === 'ambulance');
          if (ambulances.length > 0) {
            this._ambulancePos = ambulances[0].position.clone();
          }
        }

        // Track children groups for CROSSING_GUARD missions (pedestrian mode)
        if (this.peds && this.peds.length > 0) {
          this._childrenGroups = this.peds
            .filter(p => p.userData?.isChildGroup)
            .map(p => ({
              x: p.position.x,
              z: p.position.z,
              waiting: p.userData?.waiting ?? true,
              crossing: p.userData?.crossing ?? false,
              crossed: p.userData?.crossed ?? false
            }));
        }

        // Track sidewalk violations for SIDEWALK_PATROL missions
        if (this.npcs) {
          this._sidewalkViolations = this.npcs
            .filter(n => n.userData?.onSidewalk && n.userData?.npcType === 'bike')
            .map(n => ({
              x: n.position.x,
              z: n.position.z,
              type: 'bike_on_sidewalk',
              reported: n.userData?.violationReported ?? false
            }));
        }

        // Track intersections for ESCORT missions
        if (this.sigs) {
          this._intersections = this.sigs
            .filter(sg => sg.userData?.st === 'green')
            .map(sg => ({
              x: sg.position.x,
              z: sg.position.z,
              cleared: sg.userData?.escortCleared ?? false
            }));
        }

        // Calculate longitudinal acceleration for CARGO missions
        if (!this.isPedestrian) {
          const currentSpeed = Math.abs(this.speed);
          if (this._prevSpeedForCargo !== undefined) {
            this._longitudinalAccel = (currentSpeed - this._prevSpeedForCargo) / dt;
          }
          this._prevSpeedForCargo = currentSpeed;
        }
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
        
        // ── REGISTER LEARNED RULES FOR CUMULATIVE ENFORCEMENT ──
        const _lvId = (ui.cur ? ui.cur.id : 1);
        this.registerLevelRules(_lvId);
        
        if (window.TrafficAudio) window.TrafficAudio.playVictory();
        if (window.confetti) { confetti.init(); confetti.burst(4000); }
        else this._confettiThree();
        // ── LEVEL REWARD CALCULATION ──
        const _rewards = [2000,2000,2500,2500,3000,3000,3000,3500,3500,4000,4000,4500,4500,5000,6000];
        const _baseRew = _rewards[Math.min(_lvId - 1, 14)];
        const _noViolBonus = this.vio === 0 ? 800 : this.vio <= 2 ? 300 : 0;
        const _reward = _baseRew + _noViolBonus;
        S.wallet += _reward;
        if (window.WalletHistory) WalletHistory.earn('level_reward', _reward, { levelId: _lvId, levelName: (ui.cur ? ui.cur.name : ''), violations: this.vio });
        this._syncWalletToSupabase(_reward, 'earn', 'level_reward');
        // Deduct fines from wallet
        if (this.fine > 0) {
          S.wallet = Math.max(0, S.wallet - this.fine);
          if (window.WalletHistory) WalletHistory.deduct('fine', this.fine, { levelId: _lvId, levelName: (ui.cur ? ui.cur.name : ''), violations: this.vio });
          this._syncWalletToSupabase(this.fine, 'deduct', 'fine');
        }
        this._syncCivicToSupabase();
        this._syncSessionToSupabase(true);
        save();
        const _hw = document.getElementById('hwallet');
        if (_hw) _hw.textContent = '₹' + S.wallet.toLocaleString('en-IN');
        this.fst = { fin: this.fine ? '₹' + this.fine : '', vio: this.vio, reward: _reward };
        this.stopPlay();
        toast('🏁 Run Evaluated!', '#00c851');
        // Show Mission Complete overlay first
        const _mco = document.createElement('div');
        _mco.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:missionCompleteBg 0.4s ease-out;';
        _mco.innerHTML = '<div style="text-align:center;animation:missionCompleteCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;"><div style="font-size:4rem;margin-bottom:16px;animation:missionCompleteStar 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;">🏆</div><h1 style="color:#ffd54a;font-size:2.5rem;font-family:Bebas Neue,sans-serif;letter-spacing:0.05em;margin-bottom:8px;text-shadow:0 4px 20px rgba(255,213,74,0.4);animation:scoreCountUp 0.4s ease-out 0.4s both;">MISSION COMPLETE!</h1><div style="color:white;font-size:1.5rem;font-weight:700;margin-bottom:12px;animation:scoreCountUp 0.4s ease-out 0.5s both;">Score: ' + game.fs + '</div><div style="color:rgba(255,255,255,0.6);font-size:0.95rem;animation:scoreCountUp 0.4s ease-out 0.6s both;">Proceeding to quiz...</div></div>';
        document.body.appendChild(_mco);

        // ── Rank Notification After Level Complete ──
        try {
          // Score hasn't been added to S.total yet (that happens in ui.js after quiz)
          const _prevTotal = S.total || 0;
          const _newTotal = _prevTotal + this.fs;
          // Rank thresholds: Bronze (5000), Silver (15000), Gold (30000), Platinum (50000)
          const _rankTiers = [
            { min: 0, name: 'Rookie', icon: '🔰', color: '#94a3b8' },
            { min: 5000, name: 'Bronze', icon: '🥉', color: '#cd7f32' },
            { min: 15000, name: 'Silver', icon: '🥈', color: '#c0c0c0' },
            { min: 30000, name: 'Gold', icon: '🥇', color: '#ffd54a' },
            { min: 50000, name: 'Platinum', icon: '💎', color: '#b89bff' },
            { min: 100000, name: 'Hero', icon: '🏆', color: '#34d399' }
          ];
          const _getRank = (score) => {
            let rank = _rankTiers[0];
            for (const r of _rankTiers) { if (score >= r.min) rank = r; }
            return rank;
          };
          const _prevRank = _getRank(_prevTotal);
          const _newRank = _getRank(_newTotal);
          if (_newRank.name !== _prevRank.name) {
            // Rank changed! Show celebration toast (not full-screen to avoid occluding mission complete)
            setTimeout(() => {
              const _rn = document.createElement('div');
              _rn.style.cssText = 'position:fixed;top:8%;left:50%;transform:translateX(-50%) translateY(-20px);background:rgba(17,24,39,0.95);border:2px solid ' + _newRank.color + ';border-radius:20px;padding:20px 32px;z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;animation:rankToastIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;backdrop-filter:blur(12px);box-shadow:0 12px 40px rgba(0,0,0,0.5), 0 0 20px ' + _newRank.color + '33;max-width:90vw;text-align:center;';
              _rn.innerHTML = `
                <div style="font-size:clamp(2.5rem, 8vw, 5rem);animation:missionCompleteStar 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;">${_newRank.icon}</div>
                <div style="color:rgba(255,255,255,0.5);font-size:clamp(0.6rem, 2vw, 0.85rem);font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Rank Up!</div>
                <div style="color:${_newRank.color};font-size:clamp(1.5rem, 5vw, 2.5rem);font-family:'Bebas Neue',sans-serif;letter-spacing:0.05em;text-shadow:0 4px 16px ${_newRank.color}44;">${_newRank.name}</div>
                <div style="color:rgba(255,255,255,0.6);font-size:clamp(0.65rem, 2vw, 0.85rem);">Total Score: ${_prevTotal.toLocaleString()}</div>
              `;
              document.body.appendChild(_rn);
              // Fade out before removal
              setTimeout(() => {
                if (!_rn.parentNode) return;
                _rn.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                _rn.style.opacity = '0';
                _rn.style.transform = 'translateX(-50%) translateY(-10px)';
                setTimeout(() => { if (_rn.parentNode) _rn.remove(); }, 450);
              }, 2000);
            }, 1800);
          } else {
            // Same rank — show a subtle rank progress bar
            const _nextRank = _rankTiers.find(r => r.min > _newTotal);
            if (_nextRank) {
              const _progress = Math.min(100, Math.max(0, Math.round(((_prevTotal - _newRank.min) / (_nextRank.min - _newRank.min)) * 100)));
              setTimeout(() => {
                const _rp = document.createElement('div');
                _rp.style.cssText = 'position:fixed;bottom:15%;left:50%;transform:translateX(-50%);background:rgba(17,24,39,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px 24px;z-index:9999;display:flex;align-items:center;gap:14px;animation:rankToastIn 0.4s ease-out both;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);max-width:90vw;';
                _rp.innerHTML = `
                  <span style="font-size:1.5rem;">${_newRank.icon}</span>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">${_newRank.name}</div>
                    <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:2px;">${(_nextRank.min - _newTotal).toLocaleString()} pts to ${_nextRank.name}</div>
                    <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px;margin-top:6px;overflow:hidden;">
                      <div class="rank-bar-fill" style="height:100%;width:0%;background:${_newRank.color};border-radius:2px;"></div>
                    </div>
                  </div>
                `;
                document.body.appendChild(_rp);
                // Animate the bar fill after a frame so transition triggers
                requestAnimationFrame(() => {
                  const bar = _rp.querySelector('.rank-bar-fill');
                  if (bar) {
                    bar.style.transition = 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
                    bar.style.width = _progress + '%';
                  }
                });
                setTimeout(() => _rp.remove(), 2500);
              }, 1800);
            }
          }
        } catch(e) { console.warn('Rank notification error:', e); }

        setTimeout(() => {
          if (_mco && _mco.parentNode) _mco.remove();
          // Ensure ui.cur is defined
          if (typeof ui !== 'undefined') {
            if (!ui.cur) {
              const curLvId = this._lv || 1;
              ui.cur = (window.LVS && window.LVS.find(l => l.id == curLvId)) || window.LVS?.[0] || {
                id: curLvId,
                name: 'Lesson ' + curLvId,
                themeType: 'traffic_safety',
                law: { sec: 'Motor Vehicles Act', off: 'Traffic Violation', fine: '₹500 - ₹2000' }
              };
            }
            ui.curMode = this.vehMode || ui.curMode || 'car';
          }
          // Show driving review before quiz
          try {
            if (window.GameplayRecorder && typeof window.GameplayRecorder.showReview === 'function') {
              GameplayRecorder.showReview(() => {
                try {
                  if (typeof ui !== 'undefined' && ui.showQuiz) {
                    ui.showQuiz(this.vehMode || ui.curMode || 'car', { violations: this.violationsLog || [] });
                  }
                } catch(qe) {
                  console.error('[CompleteLevel] Error in ui.showQuiz:', qe);
                }
              });
            } else if (typeof ui !== 'undefined' && ui.showQuiz) {
              ui.showQuiz(this.vehMode || ui.curMode || 'car', { violations: this.violationsLog || [] });
            }
          } catch(err) {
            console.error('[CompleteLevel] Error showing review/quiz:', err);
            if (typeof ui !== 'undefined' && ui.showQuiz) {
              ui.showQuiz(this.vehMode || ui.curMode || 'car', { violations: this.violationsLog || [] });
            }
          }
        }, 3500);
      }

      // 🚦 MAP CONFIGURATIONS FOR ALL MUMBAI LEVELS 🚦
      _getMapConfig(lvId) {
        let lv = null;
        if (window.LVS) {
            lv = window.LVS.find(l => l.id === lvId);
        }
        
        const M = {
          1: {
            name: 'Andheri Grand Junction',
            sky: 0x87b6d8, fog: 650, ground: 0x33691e, amb: 0.85, veh: 'car',
            npcTypes: ['car','auto','bike','car','bus','truck','taxi','car','auto','bike','car','auto','bus','car','taxi','car','bike','auto','truck','car','car','bike','auto','car'],
            roads: [
              // Major North-South Avenues
              { type: 'v', x: 0, z1: -800, z2: 800, lanes: 4, width: 22, name: 'SV Road Arterial' },
              { type: 'v', x: 240, z1: -800, z2: 800, lanes: 4, width: 20, name: 'Link Road' },
              { type: 'v', x: -240, z1: -800, z2: 800, lanes: 4, width: 20, name: 'Western Express' },
              { type: 'v', x: -480, z1: -800, z2: 800, lanes: 4, width: 20, name: 'Marine Coastal Way' },
              { type: 'v', x: 480, z1: -800, z2: 800, lanes: 2, width: 14, name: 'East Ring Road' },
              // Major East-West Cross Streets
              { type: 'h', z: 0, x1: -800, x2: 800, lanes: 4, width: 20, name: 'Central Boulevard' },
              { type: 'h', z: -200, x1: -800, x2: 800, lanes: 4, width: 20, name: 'North Grand Avenue' },
              { type: 'h', z: -400, x1: -800, x2: 800, lanes: 2, width: 14, name: 'Airport Approach' },
              { type: 'h', z: 200, x1: -800, x2: 800, lanes: 4, width: 20, name: 'South Commercial Expressway' },
              { type: 'h', z: 400, x1: -800, x2: 800, lanes: 2, width: 14, name: 'Harbor Way' }
            ],
            route: [
              { x: 0, z: 0, desc: 'Start Position' },
              { x: 0, z: -80, desc: 'Signal Stop Line' },
              { x: 0, z: -200, desc: 'SV Road Crossing' },
              { x: 120, z: -200, desc: 'North Link Corridor' },
              { x: 240, z: -200, desc: 'Destination Finish Gate' }
            ],
            ints: [
              [0, 0], [240, 0], [-240, 0], [-480, 0], [480, 0],
              [0, -200], [240, -200], [-240, -200], [-480, -200], [480, -200],
              [0, 200], [240, 200], [-240, 200], [-480, 200], [480, 200],
              [0, -400], [240, -400], [-240, -400],
              [0, 400], [240, 400], [-240, 400]
            ],
            bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: 218, z1: -120, z2: 0, s: 0.9 }, { x: 262, z1: -120, z2: 0, s: 0.9 }, { x: 218, z1: 0, z2: 120, s: 0.9 }, { x: 262, z1: 0, z2: 120, s: 0.9 }, { x: 218, z1: 120, z2: 240, s: 0.9 }, { x: 262, z1: 120, z2: 240, s: 0.9 }, { x: -22, z1: 120, z2: 240, s: 0.9 }, { x: 22, z1: 120, z2: 240, s: 0.9 }, { x: -142, z1: 0, z2: 120, s: 0.9 }, { x: -98, z1: 0, z2: 120, s: 0.9 }, { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -502, z1: -240, z2: -120, s: 0.9 }, { x: -458, z1: -240, z2: -120, s: 0.9 }, { x: -382, z1: -360, z2: -240, s: 0.9 }, { x: -338, z1: -360, z2: -240, s: 0.9 }], timeLimit: 600, hasGarage: true, assets: ['suburban', 'industrial'] },
          2: { name: 'Dadar Junction', sky: 0x9ec5d9, fog: 500, ground: 0x4a6741, amb: 0.85, isPedestrian: true, veh: 'pedestrian', npcTypes: ['car', 'bus', 'auto', 'car', 'bike', 'truck', 'car', 'auto', 'taxi', 'car', 'bus', 'auto', 'car', 'bike', 'car', 'auto', 'car', 'bus', 'truck', 'car', 'auto', 'car', 'car', 'bike'], sidewalkWidth: 5, roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -140, z2: 20 }, { type: 'v', x: -240, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: -380, x2: -220 }, { type: 'h', z: 120, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -20, z2: 140 }, { type: 'v', x: -600, z1: 100, z2: 260 }, { type: 'v', x: -600, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -860, x2: -700 }, { type: 'h', z: 480, x1: -980, x2: -820 }, { type: 'h', z: 480, x1: -1100, x2: -940 }, { type: 'v', x: -1080, z1: 340, z2: 500 }, { type: 'h', z: 360, x1: -1220, x2: -1060 }, { type: 'v', x: -1200, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -1340, x2: -1180 }, { type: 'h', z: 480, x1: -1460, x2: -1300 }, { type: 'v', x: -1440, z1: 460, z2: 620 }, { type: 'v', x: -1440, z1: 580, z2: 1720 }, { type: 'h', z: 360, x1: -1720, x2: 280 }, { type: 'v', x: -720, z1: -640, z2: 1360 }, { type: 'h', z: 120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -880, z2: 1120 }, { type: 'h', z: 480, x1: -1840, x2: 160 }, { type: 'v', x: -840, z1: -520, z2: 1480 }, { type: 'h', z: 120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -880, z2: 1120 }, { type: 'h', z: 120, x1: -1600, x2: 400 }, { type: 'v', x: -600, z1: -880, z2: 1120 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -240, z: 0 }, { x: -240, z: 120 }, { x: -360, z: 120 }, { x: -480, z: 120 }, { x: -480, z: 0 }, { x: -600, z: 0 }, { x: -600, z: 120 }, { x: -600, z: 240 }, { x: -600, z: 360 }, { x: -720, z: 360 }, { x: -720, z: 480 }, { x: -840, z: 480 }, { x: -960, z: 480 }, { x: -1080, z: 480 }, { x: -1080, z: 360 }, { x: -1200, z: 360 }, { x: -1200, z: 480 }, { x: -1320, z: 480 }, { x: -1440, z: 480 }, { x: -1440, z: 600 }, { x: -1440, z: 720 }], ints: [[-600, 240], [-600, 0], [-1440, 600], [-240, 120], [-240, -120], [-480, 120], [-480, 0], [0, 0], [-1200, 480], [-1080, 360], [-1080, 480], [-1440, 720], [-840, 480], [-1200, 360], [-1320, 480], [-360, 120], [-720, 480], [-120, 0], [-120, -120], [-240, 0], [-720, 360], [-600, 120], [-1440, 480], [-600, 360], [-960, 480]], bldg: [{ x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -262, z1: -120, z2: 0, s: 0.9 }, { x: -218, z1: -120, z2: 0, s: 0.9 }, { x: -262, z1: 0, z2: 120, s: 0.9 }, { x: -218, z1: 0, z2: 120, s: 0.9 }, { x: -502, z1: 0, z2: 120, s: 0.9 }, { x: -458, z1: 0, z2: 120, s: 0.9 }, { x: -622, z1: 0, z2: 120, s: 0.9 }, { x: -578, z1: 0, z2: 120, s: 0.9 }, { x: -622, z1: 120, z2: 240, s: 0.9 }, { x: -578, z1: 120, z2: 240, s: 0.9 }, { x: -622, z1: 240, z2: 360, s: 0.9 }, { x: -578, z1: 240, z2: 360, s: 0.9 }, { x: -742, z1: 360, z2: 480, s: 0.9 }, { x: -698, z1: 360, z2: 480, s: 0.9 }, { x: -1102, z1: 360, z2: 480, s: 0.9 }, { x: -1058, z1: 360, z2: 480, s: 0.9 }, { x: -1222, z1: 360, z2: 480, s: 0.9 }, { x: -1178, z1: 360, z2: 480, s: 0.9 }, { x: -1462, z1: 480, z2: 600, s: 0.9 }, { x: -1418, z1: 480, z2: 600, s: 0.9 }, { x: -1462, z1: 600, z2: 720, s: 0.9 }, { x: -1418, z1: 600, z2: 720, s: 0.9 }], timeLimit: 720, hasGarage: true, assets: ['suburban', 'industrial'] },
          3: { name: 'Bandra Backroads', sky: 0xa8c4d8, fog: 500, ground: 0x3a5a2e, amb: 0.75, veh: 'twowheeler', npcTypes: ['car', 'auto', 'bike', 'cycle', 'auto', 'car', 'taxi', 'bike', 'auto', 'car', 'bike', 'car', 'auto', 'cycle', 'car', 'bike', 'auto', 'car'], roads: [{ type: 'v', x: 0, z1: -140, z2: 1000 }, { type: 'h', z: -120, x1: -20, x2: 140 }, { type: 'v', x: 120, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -20, x2: 140 }, { type: 'h', z: -240, x1: -140, x2: 20 }, { type: 'h', z: -240, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -620, z2: -460 }, { type: 'v', x: -240, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: -380, x2: -220 }, { type: 'h', z: -720, x1: -500, x2: -340 }, { type: 'h', z: -720, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: -980, z2: -820 }, { type: 'v', x: -480, z1: -1100, z2: -940 }, { type: 'h', z: -1080, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: -1220, z2: -1060 }, { type: 'h', z: -1200, x1: -380, x2: -220 }, { type: 'v', x: -240, z1: -1220, z2: -1060 }, { type: 'h', z: -1080, x1: -260, x2: -100 }, { type: 'h', z: -1080, x1: -140, x2: 20 }, { type: 'h', z: -1080, x1: -20, x2: 140 }, { type: 'h', z: -1080, x1: 100, x2: 260 }, { type: 'h', z: -1080, x1: 220, x2: 1360 }, { type: 'h', z: -1080, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -2080, z2: -80 }, { type: 'h', z: -240, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -1240, z2: 760 }, { type: 'h', z: -1080, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -2080, z2: -80 }, { type: 'h', z: -360, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -1360, z2: 640 }, { type: 'h', z: -120, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1120, z2: 880 }], route: [{ x: 0, z: 0 }, { x: 0, z: -120 }, { x: 120, z: -120 }, { x: 120, z: -240 }, { x: 0, z: -240 }, { x: -120, z: -240 }, { x: -240, z: -240 }, { x: -240, z: -360 }, { x: -120, z: -360 }, { x: -120, z: -480 }, { x: -240, z: -480 }, { x: -240, z: -600 }, { x: -240, z: -720 }, { x: -360, z: -720 }, { x: -480, z: -720 }, { x: -600, z: -720 }, { x: -600, z: -840 }, { x: -480, z: -840 }, { x: -480, z: -960 }, { x: -480, z: -1080 }, { x: -360, z: -1080 }, { x: -360, z: -1200 }, { x: -240, z: -1200 }, { x: -240, z: -1080 }, { x: -120, z: -1080 }, { x: 0, z: -1080 }, { x: 120, z: -1080 }, { x: 240, z: -1080 }, { x: 360, z: -1080 }], ints: [[-240, -240], [-360, -720], [-120, -360], [-480, -960], [0, 0], [-120, -480], [-600, -720], [-240, -480], [120, -240], [120, -1080], [-480, -720], [0, -240], [-480, -1080], [-600, -840], [-240, -1080], [-120, -1080], [240, -1080], [-360, -1080], [-240, -720], [360, -1080], [-360, -1200], [0, -1080], [-240, -1200], [0, -120], [120, -120], [-480, -840], [-240, -360], [-240, -600], [-120, -240]], bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: 98, z1: -240, z2: -120, s: 0.9 }, { x: 142, z1: -240, z2: -120, s: 0.9 }, { x: -262, z1: -360, z2: -240, s: 0.9 }, { x: -218, z1: -360, z2: -240, s: 0.9 }, { x: -142, z1: -480, z2: -360, s: 0.9 }, { x: -98, z1: -480, z2: -360, s: 0.9 }, { x: -262, z1: -600, z2: -480, s: 0.9 }, { x: -218, z1: -600, z2: -480, s: 0.9 }, { x: -262, z1: -720, z2: -600, s: 0.9 }, { x: -218, z1: -720, z2: -600, s: 0.9 }, { x: -622, z1: -840, z2: -720, s: 0.9 }, { x: -578, z1: -840, z2: -720, s: 0.9 }, { x: -502, z1: -960, z2: -840, s: 0.9 }, { x: -458, z1: -960, z2: -840, s: 0.9 }, { x: -502, z1: -1080, z2: -960, s: 0.9 }, { x: -458, z1: -1080, z2: -960, s: 0.9 }, { x: -382, z1: -1200, z2: -1080, s: 0.9 }, { x: -338, z1: -1200, z2: -1080, s: 0.9 }, { x: -262, z1: -1200, z2: -1080, s: 0.9 }, { x: -218, z1: -1200, z2: -1080, s: 0.9 }], timeLimit: 830, hasGarage: true, assets: ['suburban', 'industrial'] },
          4: { name: 'Juhu Boulevard', sky: 0x6fb8e0, fog: 650, ground: 0x2e6b3a, amb: 0.9, veh: 'car', npcTypes: ['car', 'car', 'auto', 'bike', 'car', 'bus', 'taxi', 'car', 'auto', 'bike', 'car', 'car', 'bus', 'auto', 'car', 'bike', 'car', 'auto', 'car', 'taxi'], hasBeach: true, roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -380, x2: -220 }, { type: 'h', z: -120, x1: -500, x2: -340 }, { type: 'h', z: -120, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: -620, x2: -460 }, { type: 'h', z: -360, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: -380, z2: -220 }, { type: 'h', z: -240, x1: -860, x2: -700 }, { type: 'v', x: -840, z1: -380, z2: -220 }, { type: 'v', x: -840, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -980, x2: -820 }, { type: 'v', x: -960, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: -1100, x2: -940 }, { type: 'v', x: -1080, z1: -500, z2: -340 }, { type: 'v', x: -1080, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -1220, x2: -1060 }, { type: 'v', x: -1200, z1: -620, z2: -460 }, { type: 'v', x: -1200, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: -1340, x2: -1180 }, { type: 'h', z: -360, x1: -1460, x2: -1300 }, { type: 'v', x: -1440, z1: -500, z2: -340 }, { type: 'v', x: -1440, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -1460, x2: -1300 }, { type: 'v', x: -1320, z1: -620, z2: 520 }, { type: 'h', z: -360, x1: -1960, x2: 40 }, { type: 'v', x: -960, z1: -1360, z2: 640 }, { type: 'h', z: -360, x1: -1960, x2: 40 }, { type: 'v', x: -960, z1: -1360, z2: 640 }, { type: 'h', z: -360, x1: -1840, x2: 160 }, { type: 'v', x: -840, z1: -1360, z2: 640 }, { type: 'h', z: -120, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1120, z2: 880 }, { type: 'h', z: -120, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -1120, z2: 880 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -360, z: -120 }, { x: -480, z: -120 }, { x: -600, z: -120 }, { x: -600, z: -240 }, { x: -480, z: -240 }, { x: -480, z: -360 }, { x: -600, z: -360 }, { x: -720, z: -360 }, { x: -720, z: -240 }, { x: -840, z: -240 }, { x: -840, z: -360 }, { x: -840, z: -480 }, { x: -960, z: -480 }, { x: -960, z: -360 }, { x: -1080, z: -360 }, { x: -1080, z: -480 }, { x: -1080, z: -600 }, { x: -1200, z: -600 }, { x: -1200, z: -480 }, { x: -1200, z: -360 }, { x: -1320, z: -360 }, { x: -1440, z: -360 }, { x: -1440, z: -480 }, { x: -1440, z: -600 }, { x: -1320, z: -600 }, { x: -1320, z: -480 }], ints: [[-840, -240], [-1440, -360], [-480, -360], [-960, -360], [-1440, -600], [-1320, -600], [-960, -480], [-240, -120], [-1080, -600], [0, 0], [-1440, -480], [-1200, -480], [-1200, -360], [-720, -360], [-1080, -480], [-600, -360], [-600, -120], [-1320, -360], [-360, -120], [-120, 0], [-840, -360], [-1320, -480], [-1200, -600], [-120, -120], [-480, -240], [-480, -120], [-1080, -360], [-720, -240], [-840, -480], [-600, -240]], bldg: [{ x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -622, z1: -240, z2: -120, s: 0.9 }, { x: -578, z1: -240, z2: -120, s: 0.9 }, { x: -502, z1: -360, z2: -240, s: 0.9 }, { x: -458, z1: -360, z2: -240, s: 0.9 }, { x: -742, z1: -360, z2: -240, s: 0.9 }, { x: -698, z1: -360, z2: -240, s: 0.9 }, { x: -862, z1: -360, z2: -240, s: 0.9 }, { x: -818, z1: -360, z2: -240, s: 0.9 }, { x: -862, z1: -480, z2: -360, s: 0.9 }, { x: -818, z1: -480, z2: -360, s: 0.9 }, { x: -982, z1: -480, z2: -360, s: 0.9 }, { x: -938, z1: -480, z2: -360, s: 0.9 }, { x: -1102, z1: -480, z2: -360, s: 0.9 }, { x: -1058, z1: -480, z2: -360, s: 0.9 }, { x: -1102, z1: -600, z2: -480, s: 0.9 }, { x: -1058, z1: -600, z2: -480, s: 0.9 }, { x: -1222, z1: -600, z2: -480, s: 0.9 }, { x: -1178, z1: -600, z2: -480, s: 0.9 }, { x: -1222, z1: -480, z2: -360, s: 0.9 }, { x: -1178, z1: -480, z2: -360, s: 0.9 }, { x: -1462, z1: -480, z2: -360, s: 0.9 }, { x: -1418, z1: -480, z2: -360, s: 0.9 }, { x: -1462, z1: -600, z2: -480, s: 0.9 }, { x: -1418, z1: -600, z2: -480, s: 0.9 }, { x: -1342, z1: -600, z2: -480, s: 0.9 }, { x: -1298, z1: -600, z2: -480, s: 0.9 }], timeLimit: 940, hasGarage: true, assets: ['suburban', 'industrial'] },
          5: {
            name: 'Parel School Zone',
            sky: 0x95c0d4,
            fog: 600,
            ground: 0x447a3e,
            amb: 0.85,
            veh: 'car',
            npcTypes: ['car', 'auto', 'cycle', 'bike', 'auto', 'car', 'taxi', 'car', 'auto', 'bike', 'car', 'cycle', 'auto', 'car', 'bus', 'car', 'auto', 'car', 'truck', 'bus'],
            hasSchool: true,
            speedLimit: 25,
            isSilenceZone: true,
            roads: [
              // Major Long Continuous East-West Avenues (Generous Multi-lane Corridors)
              { type: 'h', z: 0, x1: -1200, x2: 1200, lanes: 4, width: 28, name: 'St. Xavier School Boulevard' },
              { type: 'h', z: -120, x1: -1200, x2: 1200, lanes: 4, width: 28, name: 'Parel Commercial Crossway' },
              { type: 'h', z: -240, x1: -1200, x2: 1200, lanes: 2, width: 18, name: 'Market Central Lane' },
              { type: 'h', z: -360, x1: -1200, x2: 1200, lanes: 4, width: 28, name: 'Dr. Ambedkar Arterial Marg' },
              { type: 'h', z: -480, x1: -1200, x2: 1200, lanes: 2, width: 18, name: 'Lalbaug Commercial Lane' },
              { type: 'h', z: -600, x1: -1200, x2: 1200, lanes: 4, width: 28, name: 'Cotton Green Boulevard' },
              { type: 'h', z: -720, x1: -1200, x2: 1200, lanes: 4, width: 28, name: 'Sewri Ring Road' },
              { type: 'h', z: -1080, x1: -1200, x2: 1200, lanes: 4, width: 30, name: 'North Marine Grand Avenue' },
              // Major Long Continuous North-South Avenues
              { type: 'v', x: -120, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Parel West Avenue' },
              { type: 'v', x: -360, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Hospital North Corridor' },
              { type: 'v', x: -600, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Currey Road Link' },
              { type: 'v', x: 0, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Central Tram Avenue' },
              { type: 'v', x: 240, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Lower Parel Link' },
              { type: 'v', x: 360, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'East Commercial Avenue' },
              { type: 'v', x: 480, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Harbor Connection' },
              { type: 'v', x: 600, z1: -1200, z2: 300, lanes: 4, width: 28, name: 'Grand Trunk Expressway' }
            ],
            route: [
              { x: -35, z: 0 },
              { x: -65, z: 0 },
              { x: -120, z: 0 },
              { x: -120, z: -120 },
              { x: -240, z: -120 },
              { x: -360, z: -120 },
              { x: -360, z: -240 },
              { x: -360, z: -360 },
              { x: -480, z: -360 },
              { x: -600, z: -360 },
              { x: -600, z: -480 },
              { x: -600, z: -600 },
              { x: -600, z: -720 },
              { x: -480, z: -720 },
              { x: -360, z: -720 },
              { x: -360, z: -840 },
              { x: -360, z: -960 },
              { x: -360, z: -1080 },
              { x: -240, z: -1080 },
              { x: -120, z: -1080 },
              { x: 0, z: -1080 },
              { x: 120, z: -1080 },
              { x: 240, z: -1080 },
              { x: 360, z: -1080 },
              { x: 360, z: -960 },
              { x: 360, z: -840 },
              { x: 360, z: -720 },
              { x: 360, z: -600 },
              { x: 480, z: -600 },
              { x: 600, z: -600 },
              { x: 600, z: -480 },
              { x: 480, z: -480 },
              { x: 480, z: -360 },
              { x: 360, z: -360 },
              { x: 360, z: -480 },
              { x: 240, z: -480 },
              { x: 240, z: -600 },
              { x: 120, z: -600 }
            ],
            ints: [
              [-120, 0], [-360, 0], [-600, 0], [0, 0], [240, 0], [360, 0], [480, 0], [600, 0],
              [-120, -120], [-360, -120], [-600, -120], [0, -120], [240, -120], [360, -120], [480, -120], [600, -120],
              [-120, -240], [-360, -240], [-600, -240], [0, -240], [240, -240], [360, -240], [480, -240], [600, -240],
              [-120, -360], [-360, -360], [-600, -360], [0, -360], [240, -360], [360, -360], [480, -360], [600, -360],
              [-120, -480], [-360, -480], [-600, -480], [0, -480], [240, -480], [360, -480], [480, -480], [600, -480],
              [-120, -600], [-360, -600], [-600, -600], [0, -600], [240, -600], [360, -600], [480, -600], [600, -600],
              [-120, -720], [-360, -720], [-600, -720], [0, -720], [240, -720], [360, -720], [480, -720], [600, -720],
              [-120, -1080], [-360, -1080], [-600, -1080], [0, -1080], [240, -1080], [360, -1080], [480, -1080], [600, -1080]
            ],
            bldg: [
              // Flanking St. Xavier School Boulevard (Z = 0)
              { x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 },
              { x: -22, z1: 0, z2: 120, s: 0.9 }, { x: 22, z1: 0, z2: 120, s: 0.9 },
              { x: -142, z1: 0, z2: 120, s: 0.9 }, { x: -98, z1: 0, z2: 120, s: 0.9 },
              { x: 218, z1: 0, z2: 120, s: 0.9 }, { x: 262, z1: 0, z2: 120, s: 0.9 },
              { x: 338, z1: 0, z2: 120, s: 0.9 }, { x: 382, z1: 0, z2: 120, s: 0.9 },
              { x: 458, z1: 0, z2: 120, s: 0.9 }, { x: 502, z1: 0, z2: 120, s: 0.9 },
              { x: 578, z1: 0, z2: 120, s: 0.9 }, { x: 622, z1: 0, z2: 120, s: 0.9 },
              // Flanking Parel West Avenue (X = -120)
              { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 },
              { x: -142, z1: -240, z2: -120, s: 0.9 }, { x: -98, z1: -240, z2: -120, s: 0.9 },
              { x: -142, z1: -360, z2: -240, s: 0.9 }, { x: -98, z1: -360, z2: -240, s: 0.9 },
              // Flanking Parel Commercial Crossway (Z = -120)
              { x: -262, z1: -120, z2: 0, s: 0.9 }, { x: -218, z1: -120, z2: 0, s: 0.9 },
              { x: -382, z1: -120, z2: 0, s: 0.9 }, { x: -338, z1: -120, z2: 0, s: 0.9 },
              { x: -502, z1: -120, z2: 0, s: 0.9 }, { x: -458, z1: -120, z2: 0, s: 0.9 },
              // Flanking Dr. Ambedkar Marg (X = -360)
              { x: -382, z1: -240, z2: -120, s: 0.9 }, { x: -338, z1: -240, z2: -120, s: 0.9 },
              { x: -382, z1: -360, z2: -240, s: 0.9 }, { x: -338, z1: -360, z2: -240, s: 0.9 },
              { x: -382, z1: -480, z2: -360, s: 0.9 }, { x: -338, z1: -480, z2: -360, s: 0.9 },
              // Flanking Lalbaug Arterial (Z = -360)
              { x: -502, z1: -360, z2: -240, s: 0.9 }, { x: -458, z1: -360, z2: -240, s: 0.9 },
              { x: -622, z1: -360, z2: -240, s: 0.9 }, { x: -578, z1: -360, z2: -240, s: 0.9 },
              // Flanking Currey Road Corridor (X = -600)
              { x: -622, z1: -480, z2: -360, s: 0.9 }, { x: -578, z1: -480, z2: -360, s: 0.9 },
              { x: -622, z1: -600, z2: -480, s: 0.9 }, { x: -578, z1: -600, z2: -480, s: 0.9 },
              { x: -622, z1: -720, z2: -600, s: 0.9 }, { x: -578, z1: -720, z2: -600, s: 0.9 },
              // Flanking Sewri Ring Road & North Loop (Z = -720 to -1080)
              { x: -502, z1: -720, z2: -600, s: 0.9 }, { x: -458, z1: -720, z2: -600, s: 0.9 },
              { x: -382, z1: -840, z2: -720, s: 0.9 }, { x: -338, z1: -840, z2: -720, s: 0.9 },
              { x: -382, z1: -960, z2: -840, s: 0.9 }, { x: -338, z1: -960, z2: -840, s: 0.9 },
              { x: -382, z1: -1080, z2: -960, s: 0.9 }, { x: -338, z1: -1080, z2: -960, s: 0.9 },
              { x: -262, z1: -1080, z2: -960, s: 0.9 }, { x: -218, z1: -1080, z2: -960, s: 0.9 },
              { x: -142, z1: -1080, z2: -960, s: 0.9 }, { x: -98, z1: -1080, z2: -960, s: 0.9 },
              { x: -22, z1: -1080, z2: -960, s: 0.9 }, { x: 22, z1: -1080, z2: -960, s: 0.9 },
              { x: 98, z1: -1080, z2: -960, s: 0.9 }, { x: 142, z1: -1080, z2: -960, s: 0.9 },
              { x: 218, z1: -1080, z2: -960, s: 0.9 }, { x: 262, z1: -1080, z2: -960, s: 0.9 },
              { x: 338, z1: -1080, z2: -960, s: 0.9 }, { x: 382, z1: -1080, z2: -960, s: 0.9 },
              // East Side Avenues (X = 360, 480, 600)
              { x: 338, z1: -960, z2: -840, s: 0.9 }, { x: 382, z1: -960, z2: -840, s: 0.9 },
              { x: 338, z1: -840, z2: -720, s: 0.9 }, { x: 382, z1: -840, z2: -720, s: 0.9 },
              { x: 338, z1: -720, z2: -600, s: 0.9 }, { x: 382, z1: -720, z2: -600, s: 0.9 },
              { x: 578, z1: -600, z2: -480, s: 0.9 }, { x: 622, z1: -600, z2: -480, s: 0.9 },
              { x: 458, z1: -480, z2: -360, s: 0.9 }, { x: 502, z1: -480, z2: -360, s: 0.9 },
              { x: 338, z1: -480, z2: -360, s: 0.9 }, { x: 382, z1: -480, z2: -360, s: 0.9 },
              { x: 218, z1: -600, z2: -480, s: 0.9 }, { x: 262, z1: -600, z2: -480, s: 0.9 }
            ],
            timeLimit: 1200,
            hasGarage: true,
            assets: ['suburban', 'industrial']
          },
          6: { name: 'Matunga Rail Corridor', sky: 0x7fafc4, fog: 600, ground: 0x3a6130, amb: 0.7, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'car', 'auto', 'taxi', 'car', 'auto', 'bike', 'car', 'truck', 'auto', 'car', 'car', 'bike', 'car', 'auto'], hasRailway: true, railZ: [0], hasMetro: true, hasMountain: true, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'v', x: 120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: 100, x2: 260 }, { type: 'h', z: -120, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: 340, x2: 500 }, { type: 'v', x: 480, z1: -260, z2: -100 }, { type: 'v', x: 480, z1: -140, z2: 20 }, { type: 'v', x: 480, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: -20, z2: 140 }, { type: 'v', x: 720, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: 700, x2: 860 }, { type: 'h', z: 240, x1: 820, x2: 980 }, { type: 'h', z: 240, x1: 940, x2: 1100 }, { type: 'v', x: 1080, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: 940, x2: 1100 }, { type: 'v', x: 960, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: 940, x2: 1100 }, { type: 'h', z: 480, x1: 1060, x2: 1220 }, { type: 'v', x: 1200, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 1060, x2: 1220 }, { type: 'v', x: 1080, z1: 580, z2: 740 }, { type: 'v', x: 1080, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: 940, x2: 1100 }, { type: 'v', x: 960, z1: 700, z2: 860 }, { type: 'h', z: 720, x1: 820, x2: 980 }, { type: 'v', x: 840, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: 820, x2: 1960 }, { type: 'h', z: 0, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -1000, z2: 1000 }, { type: 'h', z: 120, x1: -400, x2: 1600 }, { type: 'v', x: 600, z1: -880, z2: 1120 }, { type: 'h', z: 120, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -880, z2: 1120 }, { type: 'h', z: 720, x1: -160, x2: 1840 }, { type: 'v', x: 840, z1: -280, z2: 1720 }, { type: 'h', z: 720, x1: 80, x2: 2080 }, { type: 'v', x: 1080, z1: -280, z2: 1720 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 120, z: -120 }, { x: 240, z: -120 }, { x: 360, z: -120 }, { x: 360, z: -240 }, { x: 480, z: -240 }, { x: 480, z: -120 }, { x: 480, z: 0 }, { x: 480, z: 120 }, { x: 600, z: 120 }, { x: 600, z: 0 }, { x: 720, z: 0 }, { x: 720, z: 120 }, { x: 720, z: 240 }, { x: 840, z: 240 }, { x: 960, z: 240 }, { x: 1080, z: 240 }, { x: 1080, z: 360 }, { x: 960, z: 360 }, { x: 960, z: 480 }, { x: 1080, z: 480 }, { x: 1200, z: 480 }, { x: 1200, z: 600 }, { x: 1080, z: 600 }, { x: 1080, z: 720 }, { x: 1080, z: 840 }, { x: 960, z: 840 }, { x: 960, z: 720 }, { x: 840, z: 720 }, { x: 840, z: 600 }, { x: 960, z: 600 }], ints: [[600, 0], [360, -120], [480, -120], [720, 120], [960, 720], [960, 480], [480, 120], [0, 0], [480, -240], [720, 0], [840, 720], [960, 840], [240, -120], [360, -240], [960, 360], [1080, 840], [120, 0], [840, 600], [600, 120], [1080, 720], [1080, 360], [1200, 480], [960, 240], [1080, 480], [120, -120], [1080, 240], [1080, 600], [480, 0], [720, 240], [960, 600], [1200, 600], [840, 240]], bldg: [{ x: 98, z1: -120, z2: 0, s: 0.9 }, { x: 142, z1: -120, z2: 0, s: 0.9 }, { x: 338, z1: -240, z2: -120, s: 0.9 }, { x: 382, z1: -240, z2: -120, s: 0.9 }, { x: 458, z1: -240, z2: -120, s: 0.9 }, { x: 502, z1: -240, z2: -120, s: 0.9 }, { x: 458, z1: -120, z2: 0, s: 0.9 }, { x: 502, z1: -120, z2: 0, s: 0.9 }, { x: 458, z1: 0, z2: 120, s: 0.9 }, { x: 502, z1: 0, z2: 120, s: 0.9 }, { x: 578, z1: 0, z2: 120, s: 0.9 }, { x: 622, z1: 0, z2: 120, s: 0.9 }, { x: 698, z1: 0, z2: 120, s: 0.9 }, { x: 742, z1: 0, z2: 120, s: 0.9 }, { x: 698, z1: 120, z2: 240, s: 0.9 }, { x: 742, z1: 120, z2: 240, s: 0.9 }, { x: 1058, z1: 240, z2: 360, s: 0.9 }, { x: 1102, z1: 240, z2: 360, s: 0.9 }, { x: 938, z1: 360, z2: 480, s: 0.9 }, { x: 982, z1: 360, z2: 480, s: 0.9 }, { x: 1178, z1: 480, z2: 600, s: 0.9 }, { x: 1222, z1: 480, z2: 600, s: 0.9 }, { x: 1058, z1: 600, z2: 720, s: 0.9 }, { x: 1102, z1: 600, z2: 720, s: 0.9 }, { x: 1058, z1: 720, z2: 840, s: 0.9 }, { x: 1102, z1: 720, z2: 840, s: 0.9 }, { x: 938, z1: 720, z2: 840, s: 0.9 }, { x: 982, z1: 720, z2: 840, s: 0.9 }, { x: 818, z1: 600, z2: 720, s: 0.9 }, { x: 862, z1: 600, z2: 720, s: 0.9 }], timeLimit: 1160, hasGarage: true, assets: ['suburban', 'industrial', 'trains'] },
          7: { name: 'Marine Drive', sky: 0x4a90d9, fog: 700, ground: 0x1a6b5a, amb: 0.9, veh: 'car', npcTypes: ['car', 'car', 'auto', 'bike', 'car', 'bus', 'taxi', 'car', 'auto', 'car', 'bike', 'car', 'car', 'bus', 'auto', 'taxi', 'car', 'bike', 'car', 'auto'], hasOcean: true, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'h', z: 0, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: 340, x2: 500 }, { type: 'h', z: 240, x1: 460, x2: 620 }, { type: 'h', z: 240, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: 100, z2: 260 }, { type: 'v', x: 720, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: 700, x2: 860 }, { type: 'v', x: 840, z1: -20, z2: 140 }, { type: 'v', x: 840, z1: 100, z2: 260 }, { type: 'v', x: 840, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: 700, x2: 860 }, { type: 'h', z: 360, x1: 580, x2: 740 }, { type: 'h', z: 360, x1: 460, x2: 620 }, { type: 'v', x: 480, z1: 340, z2: 500 }, { type: 'v', x: 480, z1: 460, z2: 620 }, { type: 'v', x: 480, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: 340, x2: 500 }, { type: 'v', x: 360, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: 220, x2: 380 }, { type: 'h', z: 600, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 460, z2: 620 }, { type: 'v', x: 120, z1: 340, z2: 500 }, { type: 'v', x: 120, z1: 220, z2: 380 }, { type: 'h', z: 240, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 220, z2: 380 }, { type: 'v', x: 0, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -140, x2: 20 }, { type: 'h', z: 480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: 460, z2: 620 }, { type: 'v', x: -240, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: -500, x2: -340 }, { type: 'h', z: 840, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 820, z2: 980 }, { type: 'v', x: -600, z1: 940, z2: 1100 }, { type: 'h', z: 1080, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: 940, z2: 1100 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 940, z2: 2080 }, { type: 'h', z: 600, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -400, z2: 1600 }, { type: 'h', z: 600, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -400, z2: 1600 }, { type: 'h', z: 480, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -520, z2: 1480 }, { type: 'h', z: 720, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -280, z2: 1720 }, { type: 'h', z: 1080, x1: -1600, x2: 400 }, { type: 'v', x: -600, z1: 80, z2: 2080 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 240, z: 0 }, { x: 240, z: 120 }, { x: 360, z: 120 }, { x: 360, z: 240 }, { x: 480, z: 240 }, { x: 600, z: 240 }, { x: 720, z: 240 }, { x: 720, z: 120 }, { x: 720, z: 0 }, { x: 840, z: 0 }, { x: 840, z: 120 }, { x: 840, z: 240 }, { x: 840, z: 360 }, { x: 720, z: 360 }, { x: 600, z: 360 }, { x: 480, z: 360 }, { x: 480, z: 480 }, { x: 480, z: 600 }, { x: 480, z: 720 }, { x: 360, z: 720 }, { x: 360, z: 600 }, { x: 240, z: 600 }, { x: 120, z: 600 }, { x: 120, z: 480 }, { x: 120, z: 360 }, { x: 120, z: 240 }, { x: 0, z: 240 }, { x: 0, z: 360 }, { x: 0, z: 480 }, { x: -120, z: 480 }, { x: -240, z: 480 }, { x: -240, z: 600 }, { x: -240, z: 720 }, { x: -360, z: 720 }, { x: -360, z: 840 }, { x: -480, z: 840 }, { x: -600, z: 840 }, { x: -600, z: 960 }, { x: -600, z: 1080 }, { x: -480, z: 1080 }, { x: -480, z: 960 }, { x: -360, z: 960 }, { x: -360, z: 1080 }], ints: [[240, 0], [840, 0], [0, 240], [360, 240], [-600, 960], [-240, 480], [720, 120], [120, 360], [360, 120], [-360, 960], [0, 0], [720, 0], [480, 720], [840, 360], [840, 120], [120, 240], [480, 240], [-600, 840], [-600, 1080], [360, 600], [-240, 720], [-240, 600], [120, 600], [120, 480], [-480, 1080], [-480, 960], [120, 0], [0, 360], [240, 600], [-360, 720], [600, 360], [480, 360], [360, 720], [480, 600], [600, 240], [-120, 480], [720, 240], [240, 120], [480, 480], [-360, 840], [720, 360], [0, 480], [-360, 1080], [-480, 840], [840, 240]], bldg: [{ x: 218, z1: 0, z2: 120, s: 0.9 }, { x: 262, z1: 0, z2: 120, s: 0.9 }, { x: 338, z1: 120, z2: 240, s: 0.9 }, { x: 382, z1: 120, z2: 240, s: 0.9 }, { x: 698, z1: 120, z2: 240, s: 0.9 }, { x: 742, z1: 120, z2: 240, s: 0.9 }, { x: 698, z1: 0, z2: 120, s: 0.9 }, { x: 742, z1: 0, z2: 120, s: 0.9 }, { x: 818, z1: 0, z2: 120, s: 0.9 }, { x: 862, z1: 0, z2: 120, s: 0.9 }, { x: 818, z1: 120, z2: 240, s: 0.9 }, { x: 862, z1: 120, z2: 240, s: 0.9 }, { x: 818, z1: 240, z2: 360, s: 0.9 }, { x: 862, z1: 240, z2: 360, s: 0.9 }, { x: 458, z1: 360, z2: 480, s: 0.9 }, { x: 502, z1: 360, z2: 480, s: 0.9 }, { x: 458, z1: 480, z2: 600, s: 0.9 }, { x: 502, z1: 480, z2: 600, s: 0.9 }, { x: 458, z1: 600, z2: 720, s: 0.9 }, { x: 502, z1: 600, z2: 720, s: 0.9 }, { x: 338, z1: 600, z2: 720, s: 0.9 }, { x: 382, z1: 600, z2: 720, s: 0.9 }, { x: 98, z1: 480, z2: 600, s: 0.9 }, { x: 142, z1: 480, z2: 600, s: 0.9 }, { x: 98, z1: 360, z2: 480, s: 0.9 }, { x: 142, z1: 360, z2: 480, s: 0.9 }, { x: 98, z1: 240, z2: 360, s: 0.9 }, { x: 142, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 240, z2: 360, s: 0.9 }, { x: 22, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 360, z2: 480, s: 0.9 }, { x: 22, z1: 360, z2: 480, s: 0.9 }, { x: -262, z1: 480, z2: 600, s: 0.9 }, { x: -218, z1: 480, z2: 600, s: 0.9 }, { x: -262, z1: 600, z2: 720, s: 0.9 }, { x: -218, z1: 600, z2: 720, s: 0.9 }, { x: -382, z1: 720, z2: 840, s: 0.9 }, { x: -338, z1: 720, z2: 840, s: 0.9 }, { x: -622, z1: 840, z2: 960, s: 0.9 }, { x: -578, z1: 840, z2: 960, s: 0.9 }, { x: -622, z1: 960, z2: 1080, s: 0.9 }, { x: -578, z1: 960, z2: 1080, s: 0.9 }, { x: -502, z1: 960, z2: 1080, s: 0.9 }, { x: -458, z1: 960, z2: 1080, s: 0.9 }, { x: -382, z1: 960, z2: 1080, s: 0.9 }, { x: -338, z1: 960, z2: 1080, s: 0.9 }], timeLimit: 1270, hasGarage: true, assets: ['suburban', 'industrial'] },
          8: { name: 'Byculla', sky: 0x7a9eb5, fog: 550, ground: 0x345a2a, amb: 0.7, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'auto', 'car', 'truck', 'car', 'taxi', 'auto', 'bike', 'car', 'car', 'bus', 'auto', 'car', 'car', 'bike', 'auto', 'car', 'taxi', 'car', 'car', 'auto'], hasEmergency: true, roads: [{ type: 'v', x: 0, z1: -1000, z2: 140 }, { type: 'h', z: 120, x1: -140, x2: 20 }, { type: 'h', z: 120, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -20, z2: 140 }, { type: 'h', z: 0, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: -140, z2: 20 }, { type: 'h', z: 0, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: -380, x2: -220 }, { type: 'v', x: -240, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -260, x2: -100 }, { type: 'h', z: 360, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -20, x2: 140 }, { type: 'v', x: 120, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 580, z2: 740 }, { type: 'v', x: 240, z1: 700, z2: 860 }, { type: 'v', x: 240, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 820, z2: 980 }, { type: 'h', z: 840, x1: -20, x2: 140 }, { type: 'h', z: 840, x1: -140, x2: 20 }, { type: 'h', z: 840, x1: -260, x2: -100 }, { type: 'h', z: 840, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'h', z: 960, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 820, z2: 980 }, { type: 'h', z: 840, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: 700, z2: 860 }, { type: 'v', x: -480, z1: 580, z2: 740 }, { type: 'h', z: 600, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: -620, x2: -460 }, { type: 'h', z: 480, x1: -500, x2: -340 }, { type: 'h', z: 480, x1: -380, x2: -220 }, { type: 'h', z: 480, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: -20, x2: 1120 }, { type: 'h', z: 120, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -880, z2: 1120 }, { type: 'h', z: 720, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -280, z2: 1720 }, { type: 'h', z: 840, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -160, z2: 1840 }, { type: 'h', z: 960, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -40, z2: 1960 }, { type: 'h', z: 600, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -400, z2: 1600 }], route: [{ x: 0, z: 0 }, { x: 0, z: 120 }, { x: -120, z: 120 }, { x: -240, z: 120 }, { x: -240, z: 0 }, { x: -120, z: 0 }, { x: -120, z: -120 }, { x: -240, z: -120 }, { x: -360, z: -120 }, { x: -360, z: 0 }, { x: -480, z: 0 }, { x: -480, z: 120 }, { x: -360, z: 120 }, { x: -360, z: 240 }, { x: -240, z: 240 }, { x: -240, z: 360 }, { x: -120, z: 360 }, { x: 0, z: 360 }, { x: 0, z: 480 }, { x: 120, z: 480 }, { x: 120, z: 600 }, { x: 240, z: 600 }, { x: 240, z: 720 }, { x: 240, z: 840 }, { x: 240, z: 960 }, { x: 120, z: 960 }, { x: 120, z: 840 }, { x: 0, z: 840 }, { x: -120, z: 840 }, { x: -240, z: 840 }, { x: -360, z: 840 }, { x: -360, z: 960 }, { x: -480, z: 960 }, { x: -600, z: 960 }, { x: -600, z: 840 }, { x: -480, z: 840 }, { x: -480, z: 720 }, { x: -480, z: 600 }, { x: -600, z: 600 }, { x: -600, z: 480 }, { x: -480, z: 480 }, { x: -360, z: 480 }, { x: -240, z: 480 }, { x: -120, z: 480 }, { x: -120, z: 600 }, { x: 0, z: 600 }, { x: 0, z: 720 }, { x: 120, z: 720 }], ints: [[-120, 360], [-360, 240], [240, 960], [120, 960], [-360, 0], [-600, 960], [-240, 120], [-600, 600], [-240, 480], [-480, 720], [0, 120], [-240, -120], [-480, 120], [-480, 0], [0, 0], [120, 840], [-360, 960], [-480, 480], [-480, 600], [0, 840], [-600, 840], [-360, 480], [-240, 840], [240, 720], [-360, 120], [-240, 360], [0, 600], [120, 600], [120, 480], [-240, 240], [-480, 960], [-360, -120], [-120, 0], [-120, 120], [0, 360], [-120, 600], [-120, -120], [240, 600], [-240, 0], [240, 840], [-120, 840], [0, 720], [-120, 480], [-600, 480], [-360, 840], [0, 480], [120, 720], [-480, 840]], bldg: [{ x: -22, z1: 0, z2: 120, s: 0.9 }, { x: 22, z1: 0, z2: 120, s: 0.9 }, { x: -262, z1: 0, z2: 120, s: 0.9 }, { x: -218, z1: 0, z2: 120, s: 0.9 }, { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 }, { x: -382, z1: -120, z2: 0, s: 0.9 }, { x: -338, z1: -120, z2: 0, s: 0.9 }, { x: -502, z1: 0, z2: 120, s: 0.9 }, { x: -458, z1: 0, z2: 120, s: 0.9 }, { x: -382, z1: 120, z2: 240, s: 0.9 }, { x: -338, z1: 120, z2: 240, s: 0.9 }, { x: -262, z1: 240, z2: 360, s: 0.9 }, { x: -218, z1: 240, z2: 360, s: 0.9 }, { x: -22, z1: 360, z2: 480, s: 0.9 }, { x: 22, z1: 360, z2: 480, s: 0.9 }, { x: 98, z1: 480, z2: 600, s: 0.9 }, { x: 142, z1: 480, z2: 600, s: 0.9 }, { x: 218, z1: 600, z2: 720, s: 0.9 }, { x: 262, z1: 600, z2: 720, s: 0.9 }, { x: 218, z1: 720, z2: 840, s: 0.9 }, { x: 262, z1: 720, z2: 840, s: 0.9 }, { x: 218, z1: 840, z2: 960, s: 0.9 }, { x: 262, z1: 840, z2: 960, s: 0.9 }, { x: 98, z1: 840, z2: 960, s: 0.9 }, { x: 142, z1: 840, z2: 960, s: 0.9 }, { x: -382, z1: 840, z2: 960, s: 0.9 }, { x: -338, z1: 840, z2: 960, s: 0.9 }, { x: -622, z1: 840, z2: 960, s: 0.9 }, { x: -578, z1: 840, z2: 960, s: 0.9 }, { x: -502, z1: 720, z2: 840, s: 0.9 }, { x: -458, z1: 720, z2: 840, s: 0.9 }, { x: -502, z1: 600, z2: 720, s: 0.9 }, { x: -458, z1: 600, z2: 720, s: 0.9 }, { x: -622, z1: 480, z2: 600, s: 0.9 }, { x: -578, z1: 480, z2: 600, s: 0.9 }, { x: -142, z1: 480, z2: 600, s: 0.9 }, { x: -98, z1: 480, z2: 600, s: 0.9 }, { x: -22, z1: 600, z2: 720, s: 0.9 }, { x: 22, z1: 600, z2: 720, s: 0.9 }], timeLimit: 1380, hasGarage: true, assets: ['suburban', 'industrial', 'emergency'] },
          9: { name: 'Hindmata', sky: 0x152234, fog: 450, ground: 0x1a291d, amb: 0.4, veh: 'car', npcTypes: ['car', 'auto', 'bike', 'car', 'auto', 'taxi', 'car', 'auto', 'bike', 'car', 'auto', 'car', 'bus', 'auto', 'car', 'bike'], hasRain: true, hasPuddles: true, roads: [{ type: 'v', x: 0, z1: -1000, z2: 140 }, { type: 'v', x: 0, z1: 100, z2: 260 }, { type: 'h', z: 240, x1: -20, x2: 140 }, { type: 'h', z: 240, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 220, z2: 380 }, { type: 'v', x: 240, z1: 340, z2: 500 }, { type: 'v', x: 240, z1: 460, z2: 620 }, { type: 'h', z: 600, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: 340, x2: 500 }, { type: 'v', x: 480, z1: 460, z2: 620 }, { type: 'v', x: 480, z1: 580, z2: 740 }, { type: 'v', x: 480, z1: 700, z2: 860 }, { type: 'h', z: 840, x1: 340, x2: 500 }, { type: 'v', x: 360, z1: 700, z2: 860 }, { type: 'h', z: 720, x1: 220, x2: 380 }, { type: 'v', x: 240, z1: 700, z2: 860 }, { type: 'v', x: 240, z1: 820, z2: 980 }, { type: 'v', x: 240, z1: 940, z2: 1100 }, { type: 'v', x: 240, z1: 1060, z2: 1220 }, { type: 'h', z: 1200, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: 1180, z2: 1340 }, { type: 'v', x: 360, z1: 1300, z2: 1460 }, { type: 'h', z: 1440, x1: 340, x2: 500 }, { type: 'h', z: 1440, x1: 460, x2: 620 }, { type: 'h', z: 1440, x1: 580, x2: 740 }, { type: 'v', x: 720, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: 580, x2: 740 }, { type: 'h', z: 1560, x1: 460, x2: 620 }, { type: 'h', z: 1560, x1: 340, x2: 500 }, { type: 'h', z: 1560, x1: 220, x2: 380 }, { type: 'h', z: 1560, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: 1420, z2: 1580 }, { type: 'v', x: 120, z1: 1300, z2: 1460 }, { type: 'v', x: 120, z1: 1180, z2: 1340 }, { type: 'v', x: 120, z1: 1060, z2: 1220 }, { type: 'h', z: 1080, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 1060, z2: 1220 }, { type: 'v', x: 0, z1: 1180, z2: 1340 }, { type: 'v', x: 0, z1: 1300, z2: 1460 }, { type: 'v', x: 0, z1: 1420, z2: 1580 }, { type: 'h', z: 1560, x1: -140, x2: 20 }, { type: 'h', z: 1560, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: 1540, z2: 1700 }, { type: 'h', z: 1680, x1: -380, x2: -220 }, { type: 'h', z: 1680, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 1540, z2: 1700 }, { type: 'h', z: 1560, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 1420, z2: 1580 }, { type: 'v', x: -600, z1: 1300, z2: 1460 }, { type: 'h', z: 1320, x1: -620, x2: -460 }, { type: 'v', x: -480, z1: 200, z2: 1340 }, { type: 'h', z: 840, x1: -640, x2: 1360 }, { type: 'v', x: 360, z1: -160, z2: 1840 }, { type: 'h', z: 600, x1: -520, x2: 1480 }, { type: 'v', x: 480, z1: -400, z2: 1600 }, { type: 'h', z: 600, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -400, z2: 1600 }, { type: 'h', z: 840, x1: -640, x2: 1360 }, { type: 'v', x: 360, z1: -160, z2: 1840 }, { type: 'h', z: 1440, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: 440, z2: 2440 }], route: [{ x: 0, z: 0 }, { x: 0, z: 120 }, { x: 0, z: 240 }, { x: 120, z: 240 }, { x: 240, z: 240 }, { x: 240, z: 360 }, { x: 240, z: 480 }, { x: 240, z: 600 }, { x: 360, z: 600 }, { x: 360, z: 480 }, { x: 480, z: 480 }, { x: 480, z: 600 }, { x: 480, z: 720 }, { x: 480, z: 840 }, { x: 360, z: 840 }, { x: 360, z: 720 }, { x: 240, z: 720 }, { x: 240, z: 840 }, { x: 240, z: 960 }, { x: 240, z: 1080 }, { x: 240, z: 1200 }, { x: 360, z: 1200 }, { x: 360, z: 1320 }, { x: 360, z: 1440 }, { x: 480, z: 1440 }, { x: 600, z: 1440 }, { x: 720, z: 1440 }, { x: 720, z: 1560 }, { x: 600, z: 1560 }, { x: 480, z: 1560 }, { x: 360, z: 1560 }, { x: 240, z: 1560 }, { x: 120, z: 1560 }, { x: 120, z: 1440 }, { x: 120, z: 1320 }, { x: 120, z: 1200 }, { x: 120, z: 1080 }, { x: 0, z: 1080 }, { x: 0, z: 1200 }, { x: 0, z: 1320 }, { x: 0, z: 1440 }, { x: 0, z: 1560 }, { x: -120, z: 1560 }, { x: -240, z: 1560 }, { x: -240, z: 1680 }, { x: -360, z: 1680 }, { x: -480, z: 1680 }, { x: -480, z: 1560 }, { x: -600, z: 1560 }, { x: -600, z: 1440 }, { x: -600, z: 1320 }, { x: -480, z: 1320 }, { x: -480, z: 1200 }], ints: [[0, 240], [240, 1200], [720, 1560], [480, 1560], [-480, 1320], [240, 960], [-480, 1680], [240, 1080], [480, 840], [360, 1320], [0, 120], [120, 1440], [600, 1560], [0, 0], [360, 1560], [120, 1200], [480, 720], [360, 1440], [-240, 1680], [-120, 1560], [0, 1320], [480, 1440], [360, 480], [120, 240], [120, 1560], [-360, 1680], [-600, 1440], [360, 600], [240, 720], [720, 1440], [240, 1560], [120, 1080], [360, 840], [0, 1080], [-600, 1560], [240, 240], [0, 1440], [-480, 1200], [-600, 1320], [240, 480], [240, 600], [360, 720], [240, 840], [0, 1200], [240, 360], [480, 600], [600, 1440], [120, 1320], [-240, 1560], [480, 480], [0, 1560], [360, 1200], [-480, 1560]], bldg: [{ x: -22, z1: 0, z2: 120, s: 0.9 }, { x: 22, z1: 0, z2: 120, s: 0.9 }, { x: -22, z1: 120, z2: 240, s: 0.9 }, { x: 22, z1: 120, z2: 240, s: 0.9 }, { x: 218, z1: 240, z2: 360, s: 0.9 }, { x: 262, z1: 240, z2: 360, s: 0.9 }, { x: 218, z1: 360, z2: 480, s: 0.9 }, { x: 262, z1: 360, z2: 480, s: 0.9 }, { x: 218, z1: 480, z2: 600, s: 0.9 }, { x: 262, z1: 480, z2: 600, s: 0.9 }, { x: 338, z1: 480, z2: 600, s: 0.9 }, { x: 382, z1: 480, z2: 600, s: 0.9 }, { x: 458, z1: 480, z2: 600, s: 0.9 }, { x: 502, z1: 480, z2: 600, s: 0.9 }, { x: 458, z1: 600, z2: 720, s: 0.9 }, { x: 502, z1: 600, z2: 720, s: 0.9 }, { x: 458, z1: 720, z2: 840, s: 0.9 }, { x: 502, z1: 720, z2: 840, s: 0.9 }, { x: 338, z1: 720, z2: 840, s: 0.9 }, { x: 382, z1: 720, z2: 840, s: 0.9 }, { x: 218, z1: 720, z2: 840, s: 0.9 }, { x: 262, z1: 720, z2: 840, s: 0.9 }, { x: 218, z1: 840, z2: 960, s: 0.9 }, { x: 262, z1: 840, z2: 960, s: 0.9 }, { x: 218, z1: 960, z2: 1080, s: 0.9 }, { x: 262, z1: 960, z2: 1080, s: 0.9 }, { x: 218, z1: 1080, z2: 1200, s: 0.9 }, { x: 262, z1: 1080, z2: 1200, s: 0.9 }, { x: 338, z1: 1200, z2: 1320, s: 0.9 }, { x: 382, z1: 1200, z2: 1320, s: 0.9 }, { x: 338, z1: 1320, z2: 1440, s: 0.9 }, { x: 382, z1: 1320, z2: 1440, s: 0.9 }, { x: 698, z1: 1440, z2: 1560, s: 0.9 }, { x: 742, z1: 1440, z2: 1560, s: 0.9 }, { x: 98, z1: 1440, z2: 1560, s: 0.9 }, { x: 142, z1: 1440, z2: 1560, s: 0.9 }, { x: 98, z1: 1320, z2: 1440, s: 0.9 }, { x: 142, z1: 1320, z2: 1440, s: 0.9 }, { x: 98, z1: 1200, z2: 1320, s: 0.9 }, { x: 142, z1: 1200, z2: 1320, s: 0.9 }, { x: 98, z1: 1080, z2: 1200, s: 0.9 }, { x: 142, z1: 1080, z2: 1200, s: 0.9 }, { x: -22, z1: 1080, z2: 1200, s: 0.9 }, { x: 22, z1: 1080, z2: 1200, s: 0.9 }, { x: -22, z1: 1200, z2: 1320, s: 0.9 }, { x: 22, z1: 1200, z2: 1320, s: 0.9 }, { x: -22, z1: 1320, z2: 1440, s: 0.9 }, { x: 22, z1: 1320, z2: 1440, s: 0.9 }, { x: -22, z1: 1440, z2: 1560, s: 0.9 }, { x: 22, z1: 1440, z2: 1560, s: 0.9 }, { x: -262, z1: 1560, z2: 1680, s: 0.9 }, { x: -218, z1: 1560, z2: 1680, s: 0.9 }, { x: -502, z1: 1560, z2: 1680, s: 0.9 }, { x: -458, z1: 1560, z2: 1680, s: 0.9 }, { x: -622, z1: 1440, z2: 1560, s: 0.9 }, { x: -578, z1: 1440, z2: 1560, s: 0.9 }, { x: -622, z1: 1320, z2: 1440, s: 0.9 }, { x: -578, z1: 1320, z2: 1440, s: 0.9 }, { x: -502, z1: 1200, z2: 1320, s: 0.9 }, { x: -458, z1: 1200, z2: 1320, s: 0.9 }], timeLimit: 1490, hasGarage: true, assets: ['suburban', 'industrial'] },
          10: { name: 'Eastern Express Hwy', sky: 0x8cbbd6, fog: 750, ground: 0x2a5e28, amb: 0.85, veh: 'auto', npcTypes: ['car', 'truck', 'bus', 'car', 'auto', 'bike', 'car', 'truck', 'bus', 'car', 'taxi', 'auto', 'car', 'bike', 'car', 'truck', 'bus', 'car', 'auto', 'bike', 'car', 'car', 'bus', 'auto'], hasMetro: true, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'h', z: 0, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: 100, x2: 260 }, { type: 'v', x: 120, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -380, z2: -220 }, { type: 'v', x: 240, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -500, z2: -340 }, { type: 'v', x: 360, z1: -380, z2: -220 }, { type: 'h', z: -240, x1: 340, x2: 500 }, { type: 'h', z: -240, x1: 460, x2: 620 }, { type: 'v', x: 600, z1: -380, z2: -220 }, { type: 'v', x: 600, z1: -500, z2: -340 }, { type: 'v', x: 600, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: 580, x2: 740 }, { type: 'h', z: -600, x1: 700, x2: 860 }, { type: 'v', x: 840, z1: -740, z2: -580 }, { type: 'v', x: 840, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: 820, x2: 980 }, { type: 'h', z: -840, x1: 940, x2: 1100 }, { type: 'h', z: -840, x1: 1060, x2: 1220 }, { type: 'h', z: -840, x1: 1180, x2: 1340 }, { type: 'v', x: 1320, z1: -860, z2: -700 }, { type: 'h', z: -720, x1: 1300, x2: 1460 }, { type: 'v', x: 1440, z1: -740, z2: -580 }, { type: 'h', z: -600, x1: 1420, x2: 1580 }, { type: 'v', x: 1560, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: 1540, x2: 1700 }, { type: 'v', x: 1680, z1: -740, z2: -580 }, { type: 'v', x: 1680, z1: -620, z2: -460 }, { type: 'v', x: 1680, z1: -500, z2: -340 }, { type: 'h', z: -360, x1: 1660, x2: 1820 }, { type: 'h', z: -360, x1: 1780, x2: 1940 }, { type: 'v', x: 1920, z1: -380, z2: -220 }, { type: 'v', x: 1920, z1: -260, z2: -100 }, { type: 'h', z: -120, x1: 1780, x2: 1940 }, { type: 'v', x: 1800, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: 1660, x2: 1820 }, { type: 'v', x: 1680, z1: -260, z2: -100 }, { type: 'h', z: -120, x1: 1540, x2: 1700 }, { type: 'h', z: -120, x1: 1420, x2: 1580 }, { type: 'v', x: 1440, z1: -140, z2: 20 }, { type: 'v', x: 1440, z1: -20, z2: 140 }, { type: 'h', z: 120, x1: 1300, x2: 1460 }, { type: 'h', z: 120, x1: 1180, x2: 1340 }, { type: 'h', z: 120, x1: 1060, x2: 1220 }, { type: 'v', x: 1080, z1: 100, z2: 260 }, { type: 'v', x: 1080, z1: 220, z2: 380 }, { type: 'v', x: 1080, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: 1060, x2: 1220 }, { type: 'v', x: 1200, z1: 460, z2: 620 }, { type: 'v', x: 1200, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: 1060, x2: 1220 }, { type: 'h', z: 720, x1: -40, x2: 1100 }, { type: 'h', z: -600, x1: -160, x2: 1840 }, { type: 'v', x: 840, z1: -1600, z2: 400 }, { type: 'h', z: 720, x1: 80, x2: 2080 }, { type: 'v', x: 1080, z1: -280, z2: 1720 }, { type: 'h', z: -120, x1: -880, x2: 1120 }, { type: 'v', x: 120, z1: -1120, z2: 880 }, { type: 'h', z: 240, x1: 80, x2: 2080 }, { type: 'v', x: 1080, z1: -760, z2: 1240 }, { type: 'h', z: -120, x1: 680, x2: 2680 }, { type: 'v', x: 1680, z1: -1120, z2: 880 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 240, z: 0 }, { x: 240, z: -120 }, { x: 120, z: -120 }, { x: 120, z: -240 }, { x: 240, z: -240 }, { x: 240, z: -360 }, { x: 240, z: -480 }, { x: 360, z: -480 }, { x: 360, z: -360 }, { x: 360, z: -240 }, { x: 480, z: -240 }, { x: 600, z: -240 }, { x: 600, z: -360 }, { x: 600, z: -480 }, { x: 600, z: -600 }, { x: 720, z: -600 }, { x: 840, z: -600 }, { x: 840, z: -720 }, { x: 840, z: -840 }, { x: 960, z: -840 }, { x: 1080, z: -840 }, { x: 1200, z: -840 }, { x: 1320, z: -840 }, { x: 1320, z: -720 }, { x: 1440, z: -720 }, { x: 1440, z: -600 }, { x: 1560, z: -600 }, { x: 1560, z: -720 }, { x: 1680, z: -720 }, { x: 1680, z: -600 }, { x: 1680, z: -480 }, { x: 1680, z: -360 }, { x: 1800, z: -360 }, { x: 1920, z: -360 }, { x: 1920, z: -240 }, { x: 1920, z: -120 }, { x: 1800, z: -120 }, { x: 1800, z: -240 }, { x: 1680, z: -240 }, { x: 1680, z: -120 }, { x: 1560, z: -120 }, { x: 1440, z: -120 }, { x: 1440, z: 0 }, { x: 1440, z: 120 }, { x: 1320, z: 120 }, { x: 1200, z: 120 }, { x: 1080, z: 120 }, { x: 1080, z: 240 }, { x: 1080, z: 360 }, { x: 1080, z: 480 }, { x: 1200, z: 480 }, { x: 1200, z: 600 }, { x: 1200, z: 720 }, { x: 1080, z: 720 }, { x: 960, z: 720 }], ints: [[240, 0], [360, -360], [720, -600], [1680, -600], [600, -600], [1320, -720], [1440, 120], [1080, 120], [1440, -120], [600, -240], [1560, -600], [840, -600], [1560, -120], [240, -360], [240, -480], [1440, -720], [840, -840], [240, -240], [960, 720], [960, -840], [1680, -480], [0, 0], [480, -240], [1440, 0], [1200, 120], [1920, -360], [1440, -600], [1800, -240], [120, -240], [1680, -360], [1800, -360], [1680, -240], [240, -120], [360, -240], [1320, 120], [360, -480], [1200, -840], [1200, 720], [1320, -840], [1680, -120], [840, -720], [1080, -840], [120, 0], [1560, -720], [600, -480], [1080, 720], [1080, 360], [600, -360], [1680, -720], [1800, -120], [1920, -240], [1200, 480], [1080, 480], [120, -120], [1080, 240], [1920, -120], [1200, 600]], bldg: [{ x: 218, z1: -120, z2: 0, s: 0.9 }, { x: 262, z1: -120, z2: 0, s: 0.9 }, { x: 98, z1: -240, z2: -120, s: 0.9 }, { x: 142, z1: -240, z2: -120, s: 0.9 }, { x: 218, z1: -360, z2: -240, s: 0.9 }, { x: 262, z1: -360, z2: -240, s: 0.9 }, { x: 218, z1: -480, z2: -360, s: 0.9 }, { x: 262, z1: -480, z2: -360, s: 0.9 }, { x: 338, z1: -480, z2: -360, s: 0.9 }, { x: 382, z1: -480, z2: -360, s: 0.9 }, { x: 338, z1: -360, z2: -240, s: 0.9 }, { x: 382, z1: -360, z2: -240, s: 0.9 }, { x: 578, z1: -360, z2: -240, s: 0.9 }, { x: 622, z1: -360, z2: -240, s: 0.9 }, { x: 578, z1: -480, z2: -360, s: 0.9 }, { x: 622, z1: -480, z2: -360, s: 0.9 }, { x: 578, z1: -600, z2: -480, s: 0.9 }, { x: 622, z1: -600, z2: -480, s: 0.9 }, { x: 818, z1: -720, z2: -600, s: 0.9 }, { x: 862, z1: -720, z2: -600, s: 0.9 }, { x: 818, z1: -840, z2: -720, s: 0.9 }, { x: 862, z1: -840, z2: -720, s: 0.9 }, { x: 1298, z1: -840, z2: -720, s: 0.9 }, { x: 1342, z1: -840, z2: -720, s: 0.9 }, { x: 1418, z1: -720, z2: -600, s: 0.9 }, { x: 1462, z1: -720, z2: -600, s: 0.9 }, { x: 1538, z1: -720, z2: -600, s: 0.9 }, { x: 1582, z1: -720, z2: -600, s: 0.9 }, { x: 1658, z1: -720, z2: -600, s: 0.9 }, { x: 1702, z1: -720, z2: -600, s: 0.9 }, { x: 1658, z1: -600, z2: -480, s: 0.9 }, { x: 1702, z1: -600, z2: -480, s: 0.9 }, { x: 1658, z1: -480, z2: -360, s: 0.9 }, { x: 1702, z1: -480, z2: -360, s: 0.9 }, { x: 1898, z1: -360, z2: -240, s: 0.9 }, { x: 1942, z1: -360, z2: -240, s: 0.9 }, { x: 1898, z1: -240, z2: -120, s: 0.9 }, { x: 1942, z1: -240, z2: -120, s: 0.9 }, { x: 1778, z1: -240, z2: -120, s: 0.9 }, { x: 1822, z1: -240, z2: -120, s: 0.9 }, { x: 1658, z1: -240, z2: -120, s: 0.9 }, { x: 1702, z1: -240, z2: -120, s: 0.9 }, { x: 1418, z1: -120, z2: 0, s: 0.9 }, { x: 1462, z1: -120, z2: 0, s: 0.9 }, { x: 1418, z1: 0, z2: 120, s: 0.9 }, { x: 1462, z1: 0, z2: 120, s: 0.9 }, { x: 1058, z1: 120, z2: 240, s: 0.9 }, { x: 1102, z1: 120, z2: 240, s: 0.9 }, { x: 1058, z1: 240, z2: 360, s: 0.9 }, { x: 1102, z1: 240, z2: 360, s: 0.9 }, { x: 1058, z1: 360, z2: 480, s: 0.9 }, { x: 1102, z1: 360, z2: 480, s: 0.9 }, { x: 1178, z1: 480, z2: 600, s: 0.9 }, { x: 1222, z1: 480, z2: 600, s: 0.9 }, { x: 1178, z1: 600, z2: 720, s: 0.9 }, { x: 1222, z1: 600, z2: 720, s: 0.9 }], timeLimit: 1600, hasGarage: true, assets: ['suburban', 'industrial', 'trains'] },
          11: { name: 'Sion Hospital', sky: 0x0a0f1d, fog: 500, ground: 0x1a2a1d, amb: 0.35, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'taxi', 'car', 'auto', 'bike', 'car', 'auto', 'car', 'bike', 'auto', 'car', 'taxi', 'car'], isNight: true, hasSilentZone: true, silentZ1: 0, silentZ2: 250, roads: [{ type: 'v', x: 0, z1: -140, z2: 1000 }, { type: 'v', x: 0, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -20, x2: 140 }, { type: 'h', z: -240, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -380, z2: -220 }, { type: 'h', z: -360, x1: 100, x2: 260 }, { type: 'h', z: -360, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -140, x2: 20 }, { type: 'h', z: -600, x1: -20, x2: 140 }, { type: 'h', z: -600, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: 220, x2: 380 }, { type: 'v', x: 360, z1: -740, z2: -580 }, { type: 'v', x: 360, z1: -620, z2: -460 }, { type: 'h', z: -480, x1: 220, x2: 380 }, { type: 'h', z: -480, x1: -880, x2: 260 }, { type: 'h', z: -360, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -1360, z2: 640 }, { type: 'h', z: 0, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1000, z2: 1000 }, { type: 'h', z: -600, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -1600, z2: 400 }, { type: 'h', z: -600, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1600, z2: 400 }, { type: 'h', z: -240, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -1240, z2: 760 }], route: [{ x: 0, z: 0 }, { x: 0, z: -120 }, { x: 0, z: -240 }, { x: 120, z: -240 }, { x: 240, z: -240 }, { x: 240, z: -360 }, { x: 120, z: -360 }, { x: 0, z: -360 }, { x: 0, z: -480 }, { x: -120, z: -480 }, { x: -120, z: -600 }, { x: 0, z: -600 }, { x: 120, z: -600 }, { x: 240, z: -600 }, { x: 240, z: -720 }, { x: 360, z: -720 }, { x: 360, z: -600 }, { x: 360, z: -480 }, { x: 240, z: -480 }, { x: 120, z: -480 }], ints: [[240, -360], [0, -600], [240, -480], [240, -240], [120, -600], [0, 0], [-120, -480], [120, -240], [-120, -600], [0, -240], [0, -480], [360, -480], [120, -360], [360, -720], [120, -480], [360, -600], [0, -120], [240, -600], [240, -720], [0, -360]], bldg: [{ x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 }, { x: -22, z1: -240, z2: -120, s: 0.9 }, { x: 22, z1: -240, z2: -120, s: 0.9 }, { x: 218, z1: -360, z2: -240, s: 0.9 }, { x: 262, z1: -360, z2: -240, s: 0.9 }, { x: -22, z1: -480, z2: -360, s: 0.9 }, { x: 22, z1: -480, z2: -360, s: 0.9 }, { x: -142, z1: -600, z2: -480, s: 0.9 }, { x: -98, z1: -600, z2: -480, s: 0.9 }, { x: 218, z1: -720, z2: -600, s: 0.9 }, { x: 262, z1: -720, z2: -600, s: 0.9 }, { x: 338, z1: -720, z2: -600, s: 0.9 }, { x: 382, z1: -720, z2: -600, s: 0.9 }, { x: 338, z1: -600, z2: -480, s: 0.9 }, { x: 382, z1: -600, z2: -480, s: 0.9 }], timeLimit: 1710, hasGarage: true, assets: ['suburban', 'industrial'] },
          12: { name: 'Dharavi', sky: 0x8aafca, fog: 450, ground: 0x3a5228, amb: 0.7, veh: 'twowheeler', npcTypes: ['auto', 'bike', 'cycle', 'auto', 'car', 'bike', 'cycle', 'taxi', 'auto', 'car', 'bike', 'auto', 'car', 'cycle', 'auto', 'bike'], roads: [{ type: 'h', z: 0, x1: -140, x2: 1000 }, { type: 'h', z: 0, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -140, z2: 20 }, { type: 'h', z: -120, x1: -260, x2: -100 }, { type: 'h', z: -120, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: -260, z2: -100 }, { type: 'h', z: -240, x1: -140, x2: 20 }, { type: 'v', x: -120, z1: -380, z2: -220 }, { type: 'v', x: -120, z1: -500, z2: -340 }, { type: 'h', z: -480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: -620, z2: -460 }, { type: 'h', z: -600, x1: -260, x2: -100 }, { type: 'v', x: -120, z1: -740, z2: -580 }, { type: 'h', z: -720, x1: -140, x2: 20 }, { type: 'v', x: 0, z1: -860, z2: -700 }, { type: 'h', z: -840, x1: -140, x2: 20 }, { type: 'h', z: -840, x1: -260, x2: -100 }, { type: 'h', z: -840, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: -860, z2: -700 }, { type: 'h', z: -720, x1: -380, x2: 760 }, { type: 'h', z: -600, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1600, z2: 400 }, { type: 'h', z: -240, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1240, z2: 760 }, { type: 'h', z: -120, x1: -1240, x2: 760 }, { type: 'v', x: -240, z1: -1120, z2: 880 }, { type: 'h', z: -480, x1: -1120, x2: 880 }, { type: 'v', x: -120, z1: -1480, z2: 520 }, { type: 'h', z: -840, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -1840, z2: 160 }], route: [{ x: 0, z: 0 }, { x: -120, z: 0 }, { x: -240, z: 0 }, { x: -240, z: -120 }, { x: -120, z: -120 }, { x: 0, z: -120 }, { x: 0, z: -240 }, { x: -120, z: -240 }, { x: -120, z: -360 }, { x: -120, z: -480 }, { x: -240, z: -480 }, { x: -240, z: -600 }, { x: -120, z: -600 }, { x: -120, z: -720 }, { x: 0, z: -720 }, { x: 0, z: -840 }, { x: -120, z: -840 }, { x: -240, z: -840 }, { x: -360, z: -840 }, { x: -360, z: -720 }, { x: -240, z: -720 }], ints: [[-240, -840], [0, -840], [-360, -840], [-360, -720], [-120, -360], [-240, -120], [0, 0], [-120, -480], [-240, -480], [-120, -600], [-120, -720], [0, -240], [-240, -720], [-120, -840], [-120, 0], [0, -120], [-120, -120], [-240, 0], [0, -720], [-240, -600], [-120, -240]], bldg: [{ x: -262, z1: -120, z2: 0, s: 0.9 }, { x: -218, z1: -120, z2: 0, s: 0.9 }, { x: -22, z1: -240, z2: -120, s: 0.9 }, { x: 22, z1: -240, z2: -120, s: 0.9 }, { x: -142, z1: -360, z2: -240, s: 0.9 }, { x: -98, z1: -360, z2: -240, s: 0.9 }, { x: -142, z1: -480, z2: -360, s: 0.9 }, { x: -98, z1: -480, z2: -360, s: 0.9 }, { x: -262, z1: -600, z2: -480, s: 0.9 }, { x: -218, z1: -600, z2: -480, s: 0.9 }, { x: -142, z1: -720, z2: -600, s: 0.9 }, { x: -98, z1: -720, z2: -600, s: 0.9 }, { x: -22, z1: -840, z2: -720, s: 0.9 }, { x: 22, z1: -840, z2: -720, s: 0.9 }, { x: -382, z1: -840, z2: -720, s: 0.9 }, { x: -338, z1: -840, z2: -720, s: 0.9 }], timeLimit: 1820, hasGarage: true, assets: ['suburban', 'industrial'] },
          13: { name: 'Linking Road', sky: 0x7a9eb5, fog: 550, ground: 0x346a2e, amb: 0.75, veh: 'car', npcTypes: ['car', 'auto', 'car', 'bike', 'car', 'taxi', 'auto', 'bike', 'car', 'auto', 'car', 'bike', 'car', 'auto', 'car', 'bike'], hasCheckpoint: true, checkpointZ: 0, roads: [{ type: 'h', z: 0, x1: -1000, x2: 140 }, { type: 'v', x: 120, z1: -20, z2: 140 }, { type: 'v', x: 120, z1: 100, z2: 260 }, { type: 'v', x: 120, z1: 220, z2: 380 }, { type: 'v', x: 120, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: 100, x2: 260 }, { type: 'v', x: 240, z1: 460, z2: 620 }, { type: 'v', x: 240, z1: 580, z2: 740 }, { type: 'h', z: 720, x1: 100, x2: 260 }, { type: 'h', z: 720, x1: -20, x2: 140 }, { type: 'v', x: 0, z1: 580, z2: 740 }, { type: 'v', x: 0, z1: 460, z2: 620 }, { type: 'h', z: 480, x1: -140, x2: 20 }, { type: 'h', z: 480, x1: -260, x2: -100 }, { type: 'v', x: -240, z1: 340, z2: 500 }, { type: 'v', x: -240, z1: 220, z2: 380 }, { type: 'h', z: 240, x1: -380, x2: -220 }, { type: 'v', x: -360, z1: 220, z2: 380 }, { type: 'h', z: 360, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 340, z2: 500 }, { type: 'h', z: 480, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 460, z2: 620 }, { type: 'v', x: -360, z1: 580, z2: 740 }, { type: 'v', x: -360, z1: 700, z2: 860 }, { type: 'v', x: -360, z1: 820, z2: 980 }, { type: 'h', z: 960, x1: -500, x2: -340 }, { type: 'v', x: -480, z1: 940, z2: 1100 }, { type: 'h', z: 1080, x1: -620, x2: -460 }, { type: 'v', x: -600, z1: 1060, z2: 1220 }, { type: 'h', z: 1200, x1: -740, x2: -580 }, { type: 'v', x: -720, z1: 1180, z2: 1340 }, { type: 'v', x: -720, z1: 1300, z2: 1460 }, { type: 'h', z: 1440, x1: -740, x2: -580 }, { type: 'v', x: -600, z1: 1300, z2: 1460 }, { type: 'h', z: 1320, x1: -620, x2: -460 }, { type: 'h', z: 1320, x1: -500, x2: -340 }, { type: 'v', x: -360, z1: 1180, z2: 1340 }, { type: 'h', z: 1200, x1: -1480, x2: -340 }, { type: 'h', z: 480, x1: -1480, x2: 520 }, { type: 'v', x: -480, z1: -520, z2: 1480 }, { type: 'h', z: 720, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -280, z2: 1720 }, { type: 'h', z: 720, x1: -1000, x2: 1000 }, { type: 'v', x: 0, z1: -280, z2: 1720 }, { type: 'h', z: 720, x1: -760, x2: 1240 }, { type: 'v', x: 240, z1: -280, z2: 1720 }, { type: 'h', z: 480, x1: -1360, x2: 640 }, { type: 'v', x: -360, z1: -520, z2: 1480 }], route: [{ x: 0, z: 0 }, { x: 120, z: 0 }, { x: 120, z: 120 }, { x: 120, z: 240 }, { x: 120, z: 360 }, { x: 120, z: 480 }, { x: 240, z: 480 }, { x: 240, z: 600 }, { x: 240, z: 720 }, { x: 120, z: 720 }, { x: 0, z: 720 }, { x: 0, z: 600 }, { x: 0, z: 480 }, { x: -120, z: 480 }, { x: -240, z: 480 }, { x: -240, z: 360 }, { x: -240, z: 240 }, { x: -360, z: 240 }, { x: -360, z: 360 }, { x: -480, z: 360 }, { x: -480, z: 480 }, { x: -360, z: 480 }, { x: -360, z: 600 }, { x: -360, z: 720 }, { x: -360, z: 840 }, { x: -360, z: 960 }, { x: -480, z: 960 }, { x: -480, z: 1080 }, { x: -600, z: 1080 }, { x: -600, z: 1200 }, { x: -720, z: 1200 }, { x: -720, z: 1320 }, { x: -720, z: 1440 }, { x: -600, z: 1440 }, { x: -600, z: 1320 }, { x: -480, z: 1320 }, { x: -360, z: 1320 }, { x: -360, z: 1200 }, { x: -480, z: 1200 }], ints: [[-480, 1320], [-360, 240], [-240, 480], [-720, 1320], [120, 360], [-360, 1200], [-360, 960], [0, 0], [-480, 480], [-360, 1320], [-720, 1200], [-720, 1440], [120, 240], [-600, 1440], [-360, 480], [-480, 360], [-600, 1080], [240, 720], [0, 600], [-240, 360], [120, 480], [-240, 240], [-480, 960], [-480, 1080], [120, 0], [120, 120], [-600, 1200], [-480, 1200], [-600, 1320], [240, 480], [240, 600], [-360, 720], [0, 720], [-120, 480], [-360, 840], [0, 480], [120, 720], [-360, 360], [-360, 600]], bldg: [{ x: 98, z1: 0, z2: 120, s: 0.9 }, { x: 142, z1: 0, z2: 120, s: 0.9 }, { x: 98, z1: 120, z2: 240, s: 0.9 }, { x: 142, z1: 120, z2: 240, s: 0.9 }, { x: 98, z1: 240, z2: 360, s: 0.9 }, { x: 142, z1: 240, z2: 360, s: 0.9 }, { x: 98, z1: 360, z2: 480, s: 0.9 }, { x: 142, z1: 360, z2: 480, s: 0.9 }, { x: 218, z1: 480, z2: 600, s: 0.9 }, { x: 262, z1: 480, z2: 600, s: 0.9 }, { x: 218, z1: 600, z2: 720, s: 0.9 }, { x: 262, z1: 600, z2: 720, s: 0.9 }, { x: -22, z1: 600, z2: 720, s: 0.9 }, { x: 22, z1: 600, z2: 720, s: 0.9 }, { x: -22, z1: 480, z2: 600, s: 0.9 }, { x: 22, z1: 480, z2: 600, s: 0.9 }, { x: -262, z1: 360, z2: 480, s: 0.9 }, { x: -218, z1: 360, z2: 480, s: 0.9 }, { x: -262, z1: 240, z2: 360, s: 0.9 }, { x: -218, z1: 240, z2: 360, s: 0.9 }, { x: -382, z1: 240, z2: 360, s: 0.9 }, { x: -338, z1: 240, z2: 360, s: 0.9 }, { x: -502, z1: 360, z2: 480, s: 0.9 }, { x: -458, z1: 360, z2: 480, s: 0.9 }, { x: -382, z1: 480, z2: 600, s: 0.9 }, { x: -338, z1: 480, z2: 600, s: 0.9 }, { x: -382, z1: 600, z2: 720, s: 0.9 }, { x: -338, z1: 600, z2: 720, s: 0.9 }, { x: -382, z1: 720, z2: 840, s: 0.9 }, { x: -338, z1: 720, z2: 840, s: 0.9 }, { x: -382, z1: 840, z2: 960, s: 0.9 }, { x: -338, z1: 840, z2: 960, s: 0.9 }, { x: -502, z1: 960, z2: 1080, s: 0.9 }, { x: -458, z1: 960, z2: 1080, s: 0.9 }, { x: -622, z1: 1080, z2: 1200, s: 0.9 }, { x: -578, z1: 1080, z2: 1200, s: 0.9 }, { x: -742, z1: 1200, z2: 1320, s: 0.9 }, { x: -698, z1: 1200, z2: 1320, s: 0.9 }, { x: -742, z1: 1320, z2: 1440, s: 0.9 }, { x: -698, z1: 1320, z2: 1440, s: 0.9 }, { x: -622, z1: 1320, z2: 1440, s: 0.9 }, { x: -578, z1: 1320, z2: 1440, s: 0.9 }, { x: -382, z1: 1200, z2: 1320, s: 0.9 }, { x: -338, z1: 1200, z2: 1320, s: 0.9 }], timeLimit: 1930, hasGarage: true, assets: ['suburban', 'industrial', 'construction'] },
          14: {
            name: 'Lesson 14 - Night Crossing',
            sky: 0x060814,
            fog: 400,
            ground: 0x142014,
            amb: 0.15,
            veh: 'car',
            isNight: true,
            hasNightCrossing: true,
            hasElderlyCrossing: true,
            hasCrosswalks: true,
            elderlyCrossX: 0,
            elderlyCrossZ: -50,
            npcTypes: ['car', 'taxi', 'auto', 'car', 'bike', 'bus', 'car', 'auto', 'car', 'bike', 'taxi', 'car'],
            roads: [
              { type: 'v', x: 0, z1: -800, z2: 800, lanes: 4, width: 26, name: 'SV Road Arterial (Night)' },
              { type: 'v', x: 240, z1: -800, z2: 800, lanes: 4, width: 24, name: 'Link Road North' },
              { type: 'v', x: -240, z1: -800, z2: 800, lanes: 4, width: 24, name: 'Western Express' },
              { type: 'h', z: 0, x1: -800, x2: 800, lanes: 4, width: 24, name: 'Carter Promenade Crossway' },
              { type: 'h', z: -120, x1: -800, x2: 800, lanes: 4, width: 24, name: 'Station Road Night Market' },
              { type: 'h', z: -240, x1: -800, x2: 800, lanes: 4, width: 24, name: 'Hospital Approach Corridor' },
              { type: 'h', z: 120, x1: -800, x2: 800, lanes: 2, width: 16, name: 'South Promenade Way' }
            ],
            route: [
              { x: 0, z: 0, desc: 'Start at Night' },
              { x: 0, z: -50, desc: 'Unmarked Elderly Crossing' },
              { x: 0, z: -120, desc: 'Station Road Junction' },
              { x: 120, z: -120, desc: 'Night Market Pedestrian Crossing' },
              { x: 240, z: -120, desc: 'Link Road Turn' },
              { x: 240, z: -240, desc: 'Illuminated Zebra Crossing' },
              { x: 120, z: -240, desc: 'Hospital Road Corridor' },
              { x: 0, z: -240, desc: 'Final Destination Gate' }
            ],
            ints: [
              [0, 0], [240, 0], [-240, 0],
              [0, -120], [240, -120], [-240, -120],
              [0, -240], [240, -240], [-240, -240],
              [0, 120], [240, 120], [-240, 120]
            ],
            bldg: [
              { x: -22, z1: -120, z2: 0, s: 0.9 }, { x: 22, z1: -120, z2: 0, s: 0.9 },
              { x: 218, z1: -120, z2: 0, s: 0.9 }, { x: 262, z1: -120, z2: 0, s: 0.9 },
              { x: -142, z1: -120, z2: 0, s: 0.9 }, { x: -98, z1: -120, z2: 0, s: 0.9 },
              { x: -22, z1: -240, z2: -120, s: 0.9 }, { x: 22, z1: -240, z2: -120, s: 0.9 },
              { x: 218, z1: -240, z2: -120, s: 0.9 }, { x: 262, z1: -240, z2: -120, s: 0.9 }
            ],
            timeLimit: 300,
            hasGarage: true,
            assets: ['suburban', 'industrial']
          },
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
          let cfg = { name: '50km Open World', sky: 0x6fb8e0, fog: 2000, ground: 0x444444, amb: 0.9, veh: 'car', npcTypes: ['car', 'bike', 'bus', 'truck'], roads: rds, ints: ints, bldg: [], route: [], timeLimit: 999999, is50km: true,
            npcRoutes: [
              // Route 1: East-west along z=0, loop back via z=5000
              [{x:-24000,z:0},{x:0,z:0},{x:24000,z:0},{x:24000,z:5000},{x:0,z:5000},{x:-24000,z:5000},{x:-24000,z:0}],
              // Route 2: North-south along x=0, loop back via x=8000
              [{x:0,z:-24000},{x:0,z:0},{x:0,z:24000},{x:8000,z:24000},{x:8000,z:0},{x:8000,z:-24000},{x:0,z:-24000}],
              // Route 3: Perimeter clockwise
              [{x:-24000,z:-24000},{x:24000,z:-24000},{x:24000,z:24000},{x:-24000,z:24000},{x:-24000,z:-24000}],
              // Route 4: Diagonal zigzag through center
              [{x:-20000,z:-15000},{x:-10000,z:-5000},{x:0,z:5000},{x:10000,z:15000},{x:20000,z:24000}],
              // Route 5: Inner loop
              [{x:-10000,z:-10000},{x:10000,z:-10000},{x:10000,z:10000},{x:-10000,z:10000},{x:-10000,z:-10000}]
            ]
          };
          cfg.startOutside = true;
          return cfg;
        }
        let base = M[lvId] || _getThemeRoads(lv ? lv.themeType : null);
        let cfg = Object.assign({}, base);
        if (lv) Object.assign(cfg, lv);
        // Free roam and pedestrian levels start inside the vehicle; others start outside
        cfg.startOutside = lv && (lv.themeType === 'free_roam' || lv.isPedestrian) ? false : true;
        // Auto-generate intersection points from road data if not defined
        if (!cfg.ints && cfg.roads) {
          const vRoads = cfg.roads.filter(r => r.type === 'v');
          const hRoads = cfg.roads.filter(r => r.type === 'h');
          const ints = [];
          for (const vr of vRoads) {
            for (const hr of hRoads) {
              if (vr.x >= hr.x1 && vr.x <= hr.x2 && hr.z >= vr.z1 && hr.z <= vr.z2) {
                ints.push([vr.x, hr.z]);
              }
            }
          }
          cfg.ints = ints;
        }
        return cfg;

      }

      // 🚦 VEHICLE MESH BUILDERS 🚦
      _pmesh(mode, vehType) {
        this.isPedestrian = false;
        const vt = vehType || 'car';
        this.vehType = vt;

        let pStartX = 0, pStartZ = 0, pRot = 0;
        let vStartX = 0, vStartZ = 0, vRotY = 0;

        // ── Roadside Garage Starting Spawn Position ──
        const firstRoad = (this.mapCfg && this.mapCfg.roads && this.mapCfg.roads[0]) || { type: 'v', x: 0, z1: -800, z2: 800, width: 14 };
        const roadW = firstRoad.width || 14;
        const swW = (this.mapCfg && this.mapCfg.sidewalkWidth) || (this.mapCfg?.isPedestrian ? 5.5 : 4.0);
        const roadsideOffset = roadW / 2 + swW + 7.5;

        // Position garage along the first road segment away from the intersection center
        let garageX = 0, garageZ = 0, garageRotY = 0;
        if (firstRoad.type === 'v') {
          garageX = firstRoad.x + roadsideOffset;
          const zMin = Math.min(firstRoad.z1, firstRoad.z2);
          const zMax = Math.max(firstRoad.z1, firstRoad.z2);
          garageZ = Math.max(zMin + 45, Math.min(zMax - 45, -35));
          garageRotY = -Math.PI / 2; // Facing west towards the road
        } else {
          const xMin = Math.min(firstRoad.x1, firstRoad.x2);
          const xMax = Math.max(firstRoad.x1, firstRoad.x2);
          garageX = Math.max(xMin + 45, Math.min(xMax - 45, -35));
          garageZ = firstRoad.z + roadsideOffset;
          garageRotY = Math.PI; // Facing north towards the road
        }

        this._garageX = garageX;
        this._garageZ = garageZ;
        this._garageRotY = garageRotY;
        this._garageActive = !this.mapCfg?.is50km && !this.mapCfg?.useLowPolyCity;

        // Build 3D roadside garage and workshop
        if (!this.mapCfg?.is50km && !this.mapCfg?.useLowPolyCity) {
          this._buildGarage(garageX, garageZ, garageRotY, roadW, swW);
          vStartX = garageX;
          vStartZ = garageZ;
          vRotY = garageRotY;
        } else if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
          const p1 = this.mapCfg.route[0];
          const p2 = this.mapCfg.route[1];
          const dx = p2.x - p1.x;
          const dz = p2.z - p1.z;
          const dist = Math.hypot(dx, dz);
          const nx = dist > 0 ? dx / dist : 0;
          const nz = dist > 0 ? dz / dist : 1;
          vStartX = p1.x - nz * 2.5;
          vStartZ = p1.z + nx * 2.5;
          vRotY = Math.atan2(nx, nz);
        } else {
          vStartX = 0;
          vStartZ = -35;
          vRotY = 0;
        }

        // Always position human right beside the vehicle door inside the garage bay
        pStartX = vStartX - Math.cos(vRotY) * 2.2;
        pStartZ = vStartZ + Math.sin(vRotY) * 2.2;
        pRot = vRotY;

        if (vt === 'pedestrian') {
          this.isPedestrian = true;
          this.playerCharacter = _buildHuman(true);
          this.playerCharacter.position.set(pStartX, 0, pStartZ);
          this.playerCharacter.rotation.y = pRot;
          this.scene.add(this.playerCharacter);
          this.player = this.playerCharacter;
          this.playerVehicle = null;
          this.maxSpd = 0.12; this.accel = 0.06; this.turn = 0.05; this.fric = 0.88;

          setTimeout(() => {
              toast('🚶 Pedestrian Mode Active: Use WASD / Arrow Keys to walk safely!', '#34d399', 6000);
          }, 500);
        } else {
          // Build the vehicle
          this.playerVehicle = _buildVehicle(vt, 0xffffff);
          this._spawnPos = { x: vStartX, z: vStartZ };
          this.playerVehicle.position.set(vStartX, 0, vStartZ);
          this.playerVehicle.rotation.y = vRotY;
          
          // ── PLAYER HEADLIGHTS & TAILLIGHTS ──
          const isNight = this.mapCfg && this.mapCfg.isNight;
          this.hL = new THREE.SpotLight(0xfffaed, isNight ? 3.2 : 0, 180, Math.PI / 4.5, 0.5, 1.2);
          this.hL.position.set(0.65, 0.8, 2.2);
          this.hL.target.position.set(0.65, -0.2, 35);
          this.hR = new THREE.SpotLight(0xfffaed, isNight ? 3.2 : 0, 180, Math.PI / 4.5, 0.5, 1.2);
          this.hR.position.set(-0.65, 0.8, 2.2);
          this.hR.target.position.set(-0.65, -0.2, 35);
          this.playerVehicle.add(this.hL);
          this.playerVehicle.add(this.hL.target);
          this.playerVehicle.add(this.hR);
          this.playerVehicle.add(this.hR.target);
          // ── PLAYER TAILLIGHTS ──
          const tlGeo = new THREE.SphereGeometry(0.12, 6, 6);
          const tlMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
          const ptlL = new THREE.Mesh(tlGeo, tlMat); ptlL.position.set(0.65, 0.8, -2.2);
          const ptlR = new THREE.Mesh(tlGeo, tlMat); ptlR.position.set(-0.65, 0.8, -2.2);
          this.playerVehicle.add(ptlL); this.playerVehicle.add(ptlR);
          this._playerTaillights = [ptlL, ptlR];
          // Visible headlight cone meshes (semi-transparent warm glow)
          const coneGeo = new THREE.ConeGeometry(2.5, 25, 12, 1, true);
          const coneMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: isNight ? 0.10 : 0.0, side: THREE.DoubleSide, depthWrite: false });
          const coneL = new THREE.Mesh(coneGeo, coneMat); coneL.position.set(0.65, 0.5, 14.5); coneL.rotation.x = Math.PI / 2;
          const coneR = new THREE.Mesh(coneGeo.clone(), coneMat.clone()); coneR.position.set(-0.65, 0.5, 14.5); coneR.rotation.x = Math.PI / 2;
          this.playerVehicle.add(coneL); this.playerVehicle.add(coneR);
          this._headlightCones = [coneL, coneR];
          let profileStr = localStorage.getItem('traffic_profile');
          let profile = profileStr ? JSON.parse(profileStr) : {};
          let username = profile.username || (window.colUser && window.colUser.user_metadata && window.colUser.user_metadata.username) || 'Anonymous';
          
          // Nametag removed because createNametagSprite is undefined

          this.scene.add(this.playerVehicle);

          // Always start outside the vehicle as a human first
          this.isPedestrian = true;
          this.playerCharacter = _buildHuman(true);
          this.playerCharacter.position.set(pStartX, 0, pStartZ);
          this.playerCharacter.rotation.y = pRot;
          this.scene.add(this.playerCharacter);
          
          this.player = this.playerCharacter; // Start as pedestrian
          this.maxSpd = 0.12; this.accel = 0.06; this.turn = 0.05; this.fric = 0.88;

          // ── VEHICLE BEACON — floating arrow pillar above the car ──
          this._createVehicleBeacon();

          setTimeout(() => {
              toast('🚶 WASD to walk, F to enter your vehicle!', '#3498db', 6000);
          }, 500);
        }
      }

      _makeNPC(type, col) {
        const v = _buildVehicle(type, col);
        if (v) v.stats = VEHICLE_STATS[type] || VEHICLE_STATS.car;
        return v;
      }

      // ── VEHICLE BEACON (DISABLED PER USER REQUEST) ──
      _createVehicleBeacon() {
        this._destroyVehicleBeacon();
      }

      _destroyVehicleBeacon() {
        if (this._vehicleBeacon) {
          this._vehicleBeacon.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          if (this._vehicleBeacon.parent) this._vehicleBeacon.parent.remove(this._vehicleBeacon);
          this._vehicleBeacon = null;
        }
      }

      _updateVehicleBeacon(dt) {}

      // 🚦 INDIAN STREET ENVIRONMENT ARCHITECTURE 🚦
      _getZoneAt(x, z) {
        if (!this._anchorNodes.length) return 'Residential';
        let best = this._anchorNodes[0];
        let minDist = Infinity;
        for (let n of this._anchorNodes) {
          const d = Math.hypot(x - n.x, z - n.z);
          if (d < minDist) { minDist = d; best = n; }
        }
        return best.zone;
      }

      _generateAnchorNodes(cfg) {
        this._anchorNodes = [];
        const zones = ['Commercial', 'Industrial', 'Residential', 'Slums'];
        const count = cfg.is50km ? 100 : 15;
        const range = cfg.is50km ? 5000 : 800;
        for (let i = 0; i < count; i++) {
          this._anchorNodes.push({
            x: (Math.random() - 0.5) * range * 2,
            z: (Math.random() - 0.5) * range * 2,
            zone: zones[Math.floor(Math.random() * zones.length)]
          });
        }
      }


      _buildRouteCheckpoints(cfg) {
        this.cps = [];
        const route = (cfg && cfg.route && cfg.route.length > 1) ? cfg.route : [
          { x: 0, z: 0, desc: 'Start Position' },
          { x: 0, z: -80, desc: 'Signal Stop Line' },
          { x: 0, z: -200, desc: 'SV Road Crossing' },
          { x: 120, z: -200, desc: 'North Link Corridor' },
          { x: 240, z: -200, desc: 'Destination Finish Gate' }
        ];

        const numPts = route.length;
        const indices = [];
        if (numPts <= 4) {
          for (let i = 1; i < numPts; i++) indices.push(i);
        } else {
          indices.push(1);
          const step = Math.max(1, Math.floor((numPts - 2) / 3));
          for (let i = 1 + step; i < numPts - 1; i += step) {
            if (!indices.includes(i)) indices.push(i);
          }
          if (!indices.includes(numPts - 1)) indices.push(numPts - 1);
        }

        indices.forEach((idx, cpSeq) => {
          const pt = route[idx];
          const isFinish = (idx === numPts - 1);
          const col = isFinish ? 0xffd700 : 0x00f0cc;
          const cpGroup = this._cp(pt.x, pt.z, col);
          cpGroup.userData.isFinish = isFinish;
          cpGroup.userData.cpIndex = cpSeq;
          cpGroup.userData.desc = pt.desc || (isFinish ? 'Destination Finish Gate' : ('Checkpoint ' + (cpSeq + 1)));

          if (isFinish) {
            const archGrp = new THREE.Group();
            const goldMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5 });

            [-6, 6].forEach(pOff => {
              const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 14, 12), goldMat);
              pillar.position.set(pOff, 7, 0);
              archGrp.add(pillar);
              const cap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), goldMat);
              cap.position.set(pOff, 14.5, 0);
              archGrp.add(cap);
            });

            const bar = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.4, 1.4), goldMat);
            bar.position.set(0, 13, 0);
            archGrp.add(bar);

            const bCanvas = document.createElement('canvas');
            bCanvas.width = 512; bCanvas.height = 128;
            const bCtx = bCanvas.getContext('2d');
            bCtx.fillStyle = '#0f172a';
            bCtx.fillRect(0, 0, 512, 128);
            bCtx.strokeStyle = '#ffd700';
            bCtx.lineWidth = 8;
            bCtx.strokeRect(4, 4, 504, 120);
            bCtx.fillStyle = '#ffd700';
            bCtx.font = 'bold 44px sans-serif';
            bCtx.textAlign = 'center';
            bCtx.fillText('🏁 FINISH DESTINATION', 256, 78);

            const bTex = new THREE.CanvasTexture(bCanvas);
            const bMat = new THREE.MeshBasicMaterial({ map: bTex, side: THREE.DoubleSide });
            const bMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), bMat);
            bMesh.position.set(0, 15.5, 0);
            archGrp.add(bMesh);

            const skyBeam = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 2.0, 100, 16),
              new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.4, depthWrite: false })
            );
            skyBeam.position.set(0, 50, 0);
            archGrp.add(skyBeam);

            archGrp.position.set(pt.x, 0, pt.z);
            this.scene.add(archGrp);
            cpGroup.userData.archGrp = archGrp;
          }
        });
      }

      _buildScene(mode) {
        if (typeof initGTex === 'function') initGTex();
        while (this.scene && this.scene.children.length) this.scene.remove(this.scene.children[0]);
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.pedestrianAIs = []; this.speedBreakers = [];
        // Phase 7: Recycle existing NPC groups into free pool before clearing scene
        if (!this._npcFree) this._npcFree = [];
        if (!this._pedFree) this._pedFree = [];
        if (this.npcs) this.npcs.forEach(n => { n.visible = false; n.children.length = 0; this._npcFree.push(n); });
        if (this.peds) this.peds.forEach(p => { p.visible = false; p.children.length = 0; this._pedFree.push(p); });
        if (this.scene) this.scene.children.filter(c => c.userData?.isNPC).forEach(c => { c.visible = false; c.children.length = 0; this._npcFree.push(c); });

        const lvId = ui.cur ? ui.cur.id : 1;
        const baseMapCfg = this._getMapConfig(lvId) || {};
        const cfg = Object.assign({}, baseMapCfg, ui.cur || {});
        this.mapCfg = cfg;
        this.roadSegments = (cfg && cfg.roads) ? cfg.roads.slice() : [];
        this.timeLimit = cfg.timeLimit || 120; // default; overridden by age-adaptive logic in _actualStart
        this.isPedestrian = (this.vehMode === 'pedestrian') || (!this.vehMode && !!cfg.isPedestrian);

        // ── SYNC SPEED LIMITER CAP WITH LEVEL RULES ──
        const levelSpeedLimit = cfg.speedLimit || (cfg.hasSchool ? 25 : (cfg.isRural ? 25 : (cfg.hasHospital ? 30 : (cfg.isHighway ? 80 : 50))));
        this.mapCfg.speedLimit = levelSpeedLimit;
        this.speedLimitCap = levelSpeedLimit;
        this.cruiseSpeed = Math.min(this.cruiseSpeed || 40, levelSpeedLimit);
        // Automatically activate Speed Limiter if in a speed-restricted level
        if (cfg.hasSchool || cfg.hasHospital || cfg.isRural || cfg.speedLimit) {
          this.speedLimiter = true;
          if (window.toast) toast('🔒 Speed Governor Active — Capped at ' + levelSpeedLimit + ' km/h (Press L to toggle)', '#00e676', 4000);
        } else {
          this.speedLimiter = false;
        }

        const sk = cfg.sky;
        this.scene.background = new THREE.Color(sk);
        // Fog pushed far out so the green ground plane is visible across the full map.
        // Previous values (fogNear=30-70, fogFar=120-250) blended the ground into sky blue.
        const lowPerf = this._isMobile || this._isLowGPU;
        const baseFogNear = lowPerf ? 300 : 500;
        const baseFogFar  = lowPerf ? 900 : 1500;
        if (cfg.mode === 'rain' || cfg.hasRain) {
          // Rain: deliberately shorter visibility
          this.scene.fog = new THREE.Fog(sk, lowPerf ? 60 : 90, lowPerf ? 280 : 420);
        } else if (cfg.isNight) {
          this.scene.fog = new THREE.Fog(sk, lowPerf ? 80 : 120, lowPerf ? 350 : 550);
        } else {
          this.scene.fog = new THREE.Fog(sk, baseFogNear, baseFogFar);
        }
        // Enhanced true color lighting with balanced contrast and shadows
        this._ambient = new THREE.AmbientLight(0xffffff, cfg.isNight ? 0.15 : 0.30);
        this.scene.add(this._ambient);
        this._hemi = new THREE.HemisphereLight(
          0x90b8d8, // sky tint (blue)
          0x4a6a3a, // ground tint — warm green, prevents blue bleed onto ground plane
          cfg.isNight ? 0.10 : 0.25
        );
        this._hemi.position.set(0, 1000, 0);
        this.scene.add(this._hemi);

        this._sun = new THREE.DirectionalLight(0xffffff, cfg.isNight ? 0.4 : 0.85);
        this._sun.position.set(30, 60, 20);
        this._sun.castShadow = true;
        this._sun.shadow.camera.near = 0.5;
        this._sun.shadow.camera.far = 200;
        this._sun.shadow.camera.left = -60;
        this._sun.shadow.camera.right = 60;
        this._sun.shadow.camera.top = 60;
        this._sun.shadow.camera.bottom = -60;
        this._sun.shadow.bias = -0.0005;
        const initShadowRes = (this._isMobile || this._isLowGPU) ? 512 : 1024;
        this._sun.shadow.mapSize.width = initShadowRes;
        this._sun.shadow.mapSize.height = initShadowRes;
        this._shadowQuality = initShadowRes;
        this.scene.add(this._sun);
        this._sunLastPos = null;

        // Moon light (always created, toggled by day/night cycle)
        this._moon = new THREE.DirectionalLight(0x88aacc, cfg.isNight ? 0.6 : 0);
        this._moon.position.set(-20, 40, -30);
        this.scene.add(this._moon);

        // Initialize day/night cycle
        this._streetLights = [];
        this._windowLights = [];
        if (cfg.isNight) {
          this.dayNightCycle = false;
          this.timeOfDay = 0.85;
        } else {
          this.dayNightCycle = true;
          this.timeOfDay = 0.4;
        }

        this._generateAnchorNodes(cfg);
        this._buildRouteCheckpoints(cfg);

        // Build Road Graph from level config (spatial topology for NPC routing, building placement)
        if (window.RoadGraph) {
            try {
                this.roadGraph = RoadGraph.fromLevelConfig(cfg);
                this.roadGraph.setAnchorNodes(this._anchorNodes);
            } catch (e) {
                console.warn('[RoadGraph] Failed to build graph:', e);
                this.roadGraph = null;
            }
        }

        const RW = cfg.isPedestrian ? 10 : 12;
        this.driveRoute = cfg.route;
        this._initBreadcrumbPath();

        // ── Spawn Route Checkpoints & Grand Finish Destination Gate ──
        if (cfg && cfg.route && cfg.route.length > 1) {
          cfg.route.forEach((pt, idx) => {
            if (idx === 0) return; // skip start spawn point
            const isFinish = (idx === cfg.route.length - 1);
            const cpGroup = this._cp(pt.x, pt.z, isFinish ? 0xffd700 : 0x00f0cc);
            cpGroup.userData.isFinish = isFinish;
            cpGroup.userData.cpIndex = idx;
            cpGroup.userData.desc = pt.desc || ('Checkpoint ' + idx);

            // Grand 3D Finish Gate decorations
            if (isFinish) {
              const archGrp = new THREE.Group();
              const goldMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.4 });
              const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

              // Left & Right Tower Pillars
              [-6, 6].forEach(pOff => {
                const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 12, 12), goldMat);
                pillar.position.set(pOff, 6, 0);
                archGrp.add(pillar);

                const cap = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), goldMat);
                cap.position.set(pOff, 12.5, 0);
                archGrp.add(cap);
              });

              // Arch Crossbar
              const bar = new THREE.Mesh(new THREE.BoxGeometry(13, 1.2, 1.2), goldMat);
              bar.position.set(0, 11, 0);
              archGrp.add(bar);

              // 3D Canvas Billboard: "🏁 FINISH DESTINATION"
              const bCanvas = document.createElement('canvas');
              bCanvas.width = 512; bCanvas.height = 128;
              const bCtx = bCanvas.getContext('2d');
              bCtx.fillStyle = 'rgba(15, 23, 42, 0.95)';
              bCtx.fillRect(0, 0, 512, 128);
              bCtx.strokeStyle = '#ffd700';
              bCtx.lineWidth = 8;
              bCtx.strokeRect(4, 4, 504, 120);
              bCtx.fillStyle = '#ffd700';
              bCtx.font = 'bold 44px sans-serif';
              bCtx.textAlign = 'center';
              bCtx.fillText('🏁 FINISH DESTINATION', 256, 78);

              const bTex = new THREE.CanvasTexture(bCanvas);
              const bMat = new THREE.MeshBasicMaterial({ map: bTex, side: THREE.DoubleSide });
              const bMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), bMat);
              bMesh.position.set(0, 13.5, 0);
              archGrp.add(bMesh);

              // Towering Sky Light Pillar
              const skyBeam = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 1.8, 80, 16),
                new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.35, depthWrite: false })
              );
              skyBeam.position.set(0, 40, 0);
              archGrp.add(skyBeam);

              archGrp.position.set(pt.x, 0, pt.z);
              this.scene.add(archGrp);
              cpGroup.userData.archGrp = archGrp;
            }
          });
        }

        
        // NEW: Graph-based road and building generation
        if (!window._toonGrad) {
          const gc = new Uint8Array([40, 130, 255]);
          window._toonGrad = new THREE.DataTexture(gc, 3, 1, THREE.RedFormat);
          window._toonGrad.minFilter = THREE.NearestFilter;
          window._toonGrad.magFilter = THREE.NearestFilter;
          window._toonGrad.needsUpdate = true;
        }        const gs = 16000;
        const groundColor = (cfg.ground !== undefined && !cfg.isBridge) ? cfg.ground : (cfg.isBridge ? 0x1a5a8a : 0x33691e);
        const groundMat = cfg.isBridge
          ? new THREE.MeshLambertMaterial({ color: 0x1a5a8a, transparent: true, opacity: 0.7 })
          : new THREE.MeshLambertMaterial({ color: groundColor });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(gs, gs), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.05, 0);
        ground.receiveShadow = true;
        ground.userData = { noLod: true, isGround: true };
        this.scene.add(ground);

        // Load low-poly city models for free_roam level
        if (cfg.useLowPolyCity) {
          if (!window.PRELOADED_MODELS || Object.keys(window.PRELOADED_MODELS).length === 0) {
            console.warn('[FreeRoam] PRELOADED_MODELS is empty — streamer will have no assets');
          }
          this.worldStreamer = new WorldStreamer(this, {
            chunkSize: 40,
            renderDistance: 8,
            bufferDistance: 12
          });
          // Initial load around spawn — defer to next frame when player exists
          if (this.player && this.player.position) {
            this.worldStreamer.update(this.player.position, 1.0);
            this._needsInitialStream = false;
          } else {
            this._needsInitialStream = true;
          }
          console.log(`[FreeRoam] WorldStreamer created, waiting for player. PRELOADED_MODELS keys: ${Object.keys(window.PRELOADED_MODELS || {}).length}`);
        }

        // Initialize missions and collectibles for this level
        if (this.missionManager) {
          this.playerScore = 0;
          this.rupees = (S.wallet || 50000);
          this.missionTokens = (S.missionTokens || 0);
          this.missionManager.generateMissions(cfg);
        }

        if (this.roadGraph) {
            this._buildRoadsFromGraph(RW);
            this._buildBarriers(cfg, RW);
            this._buildTrafficSignals(cfg, RW);
            this._buildBuildingsFromGraph();
            this._buildParksAndTrees();
            this._buildBusStops();
        } else {
            // ── Kenney GLB Road Tiles + Sidewalks + Props + Buildings ──
            const _roadKey = window.PRELOADED_MODELS?.road_avenue ? 'road_avenue' : 'road_straight';
            const _roadModel = window.PRELOADED_MODELS?.[_roadKey];
            const _intModel = window.PRELOADED_MODELS?.road_intersect;
            const _isPed = cfg.isPedestrian;
            const _swW = _isPed ? 6 : 4;
            const _roadTex = (() => { try { const t = new THREE.TextureLoader().load('textures/road.png'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 8); return t; } catch(e) { return null; } })();
            const _roadMat = _roadTex ? new THREE.MeshLambertMaterial({ map: _roadTex }) : new THREE.MeshLambertMaterial({ color: 0x25282e });
            const _paveMat = new THREE.MeshLambertMaterial({ color: 0x767c85 });


            (cfg.roads || []).forEach(r => {
              const isV = r.type === 'v';
              const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
              const cx = isV ? r.x : (r.x1 + r.x2) / 2;
              const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

              // Logical road bed (collision)
              const roadHb = new THREE.Mesh(
                new THREE.PlaneGeometry(RW, len),
                new THREE.MeshBasicMaterial({ visible: false })
              );
              roadHb.rotation.set(-Math.PI / 2, 0, isV ? 0 : -Math.PI / 2);
              roadHb.position.set(cx, 0.01, cz);
              this.scene.add(roadHb);
              this.world.push(roadHb);

              // Visual road tiles using Kenney GLB
              if (_roadModel) {
                const tileScale = RW / 1000;
                const tileLenScale = 3;
                const tileSize = 1500 * tileScale * tileLenScale;
                const numTiles = Math.max(1, Math.floor(len / tileSize));
                const totalTileLen = numTiles * tileSize;
                const startOffset = (len - totalTileLen) / 2;
                const startX = isV ? cx : Math.min(r.x1, r.x2) + tileSize / 2 + startOffset;
                const startZ = isV ? Math.min(r.z1, r.z2) + tileSize / 2 + startOffset : cz;

                for (let i = 0; i < numTiles; i++) {
                  const tile = _roadModel.clone();
                  tile.scale.set(tileScale, tileScale, tileScale * tileLenScale);
                  tile.frustumCulled = true;
                  tile.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; c.material = _roadMat; } });
                  if (isV) {
                    tile.position.set(cx, 0.08, startZ + i * tileSize);
                  } else {
                    tile.rotation.y = Math.PI / 2;
                    tile.position.set(startX + i * tileSize, 0.08, cz);
                  }
                  this.scene.add(tile);
                }
              }

              // Sidewalks along road edges
              [-1, 1].forEach(side => {
                const pb = new THREE.Mesh(
                  isV ? new THREE.BoxGeometry(_swW, 0.15, len) : new THREE.BoxGeometry(len, 0.15, _swW),
                  _paveMat
                );
                pb.position.set(
                  isV ? cx + side * (RW / 2 + _swW / 2) : cx,
                  0.07,
                  isV ? cz : cz + side * (RW / 2 + _swW / 2)
                );
                pb.receiveShadow = true;
                this.scene.add(pb);
                this.world.push(pb);
              });

              // ── Road Lane Markings (White dashed center line & solid edge lines) ──
              const dashLen = 3.5;
              const gapLen = 3.5;
              const stride = dashLen + gapLen;
              const numDashes = Math.max(1, Math.floor(len / stride));
              const startMark = (len - numDashes * stride) / 2;
              const markStart = isV ? Math.min(r.z1, r.z2) + startMark : Math.min(r.x1, r.x2) + startMark;
              const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
              const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffb703, transparent: true, opacity: 0.92 });

              // Center divider (Dashed white for 2-lane, double yellow for 4+ lanes)
              const lanes = r.lanes || (RW >= 18 ? 4 : 2);
              if (lanes >= 4) {
                // Double solid yellow lines
                [-0.25, 0.25].forEach(yOff => {
                  const dLine = new THREE.Mesh(
                    isV ? new THREE.PlaneGeometry(0.16, len) : new THREE.PlaneGeometry(len, 0.16),
                    yellowLineMat
                  );
                  dLine.rotation.x = -Math.PI / 2;
                  dLine.position.set(isV ? cx + yOff : cx, 0.088, isV ? cz : cz + yOff);
                  this.scene.add(dLine);
                });
              } else {
                // Dashed white center line
                for (let d = 0; d < numDashes; d++) {
                  const dashCenter = markStart + d * stride + dashLen / 2;
                  const dashMesh = new THREE.Mesh(
                    isV ? new THREE.PlaneGeometry(0.24, dashLen) : new THREE.PlaneGeometry(dashLen, 0.24),
                    whiteLineMat
                  );
                  dashMesh.rotation.x = -Math.PI / 2;
                  dashMesh.position.set(isV ? cx : dashCenter, 0.088, isV ? dashCenter : cz);
                  this.scene.add(dashMesh);
                }
              }

              // Solid white edge lines (both sides)
              [-1, 1].forEach(edgeSide => {
                const edgeX = isV ? cx + edgeSide * (RW / 2 - 0.4) : cx;
                const edgeZ = isV ? cz : cz + edgeSide * (RW / 2 - 0.4);
                const edgeLine = new THREE.Mesh(
                  isV ? new THREE.PlaneGeometry(0.18, len) : new THREE.PlaneGeometry(len, 0.18),
                  whiteLineMat
                );
                edgeLine.rotation.x = -Math.PI / 2;
                edgeLine.position.set(edgeX, 0.088, edgeZ);
                this.scene.add(edgeLine);
              });

              // Streetlights along the road (sparse for performance)
              const _lightSpacing = 80;
              const _rStart = Math.min(isV ? r.z1 : r.x1, isV ? r.z2 : r.x2);
              const _rEnd = Math.max(isV ? r.z1 : r.x1, isV ? r.z2 : r.x2);
              for (let p = _rStart + _lightSpacing; p < _rEnd; p += _lightSpacing) {
                if (Math.random() > 0.5) continue;
                const side = Math.random() > 0.5 ? 1 : -1;
                const lx = isV ? cx + side * (RW / 2 + 1.5) : p;
                const lz = isV ? p : cz + side * (RW / 2 + 1.5);
                const pole = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.08, 0.08, 5, 6),
                  new THREE.MeshToonMaterial({ color: 0x666666, gradientMap: window._toonGrad || null })
                );
                pole.position.set(lx, 2.5, lz); pole.castShadow = false; pole.receiveShadow = false;
                this.scene.add(pole);
                const fixture = new THREE.Mesh(
                  new THREE.BoxGeometry(0.6, 0.15, 0.3),
                  new THREE.MeshBasicMaterial({ color: cfg.isNight ? 0xffdd66 : 0xffee88 })
                );
                fixture.position.set(lx, 5.1, lz); this.scene.add(fixture);

                // Night-mode: add point light glow under each active streetlight (capped at 40 for perf)
                if (cfg.isNight) {
                  if (!this._nightLightCount) this._nightLightCount = 0;
                  if (this._nightLightCount >= 40) { /* skip extra lights for GPU perf */ } else {
                  this._nightLightCount++;
                  const glow = new THREE.PointLight(0xffdd66, 1.0, 35, 2);
                  glow.position.set(lx, 4.8, lz);
                  glow.castShadow = false;
                  this.scene.add(glow);
                  // Larger translucent glow disc for volumetric effect
                  const glowDisc = new THREE.Mesh(
                    new THREE.SphereGeometry(1.2, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.15 })
                  );
                  glowDisc.position.set(lx, 5.0, lz);
                  this.scene.add(glowDisc);
                  } // end nightLightCount cap
                }
              }
            });
            if (cfg.isNight) this._nightLightCount = 0; // reset for next level

            // ── Intersection tiles ──
            // Skipped for the 50km open-world grid: at 1km spacing that's 2,601 intersections,
            // and cloning a model + building 6 crosswalk meshes for every single one (~18k+
            // objects, built synchronously with no yielding) was freezing the tab on load and
            // is what caused the redirect-to-Academy bug on the free-roam level specifically.
            // Crosswalk decoration at every km of an open highway grid isn't meaningful content
            // anyway - regular city levels (which have a few dozen intersections, not thousands)
            // are unaffected by this and still get full intersection/crosswalk detail below.
            if (_intModel && cfg.ints && !cfg.is50km) {
              const _intScale = RW / 1000;
              cfg.ints.forEach(([ix, iz]) => {
                const intTile = _intModel.clone();
                intTile.scale.set(_intScale, _intScale, _intScale);
                intTile.frustumCulled = true;
                intTile.traverse(c => {
                  if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; c.material = _roadMat; }
                });
                intTile.position.set(ix, 0.08, iz);
                this.scene.add(intTile);

                // Crosswalk markings: white striped plates across the intersection
                const _cwLen = RW * 0.4;
                const _cwMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
                // Clean road-surface stripes across intersection
                [-1, 0, 1].forEach(off => {
                  // Horizontal stripe
                  const cwH = new THREE.Mesh(
                    new THREE.PlaneGeometry(_cwLen, 1.2),
                    _cwMat
                  );
                  cwH.rotation.x = -Math.PI / 2;
                  cwH.position.set(ix + off * 3, 0.089, iz);
                  this.scene.add(cwH);
                  // Vertical stripe
                  const cwV = new THREE.Mesh(
                    new THREE.PlaneGeometry(1.2, _cwLen),
                    _cwMat
                  );
                  cwV.rotation.x = -Math.PI / 2;
                  cwV.position.set(ix, 0.089, iz + off * 3);
                  this.scene.add(cwV);
                });
              });
            }

            // ── Buildings along roads ──
            const _bldgModels = [];
            if (window.PRELOADED_MODELS) {
              Object.keys(window.PRELOADED_MODELS).forEach(k => {
                if (k.startsWith('industrial_') || k.startsWith('suburban_') || k.startsWith('mbuilding_')) _bldgModels.push(window.PRELOADED_MODELS[k]);
              });
            }
            const _bMats = [
              new THREE.MeshToonMaterial({ color: 0xd9cfc4, gradientMap: window._toonGrad || null }),
              new THREE.MeshToonMaterial({ color: 0xc4b8a8, gradientMap: window._toonGrad || null }),
              new THREE.MeshToonMaterial({ color: 0xb0a898, gradientMap: window._toonGrad || null }),
              new THREE.MeshToonMaterial({ color: 0xd4c8b8, gradientMap: window._toonGrad || null })
            ];
            // Building model list (re-scanned each load for freshness)
            const _useBldgModels = _bldgModels;

            const _drawBldg = (bx, bz, type, rot) => {
              let g;
              if (_useBldgModels.length > 0) {
                const model = _useBldgModels[Math.floor(Math.random() * _useBldgModels.length)];
                g = model.clone();
                g.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = true; c.frustumCulled = true; } });
              } else {
                g = new THREE.Group();
                const mat = _bMats[Math.floor(Math.random() * _bMats.length)];
                const bh = 8 + Math.random() * 8;
                const bw = 5 + Math.random() * 5;
                const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 7), mat);
                bMesh.position.y = bh / 2;
                g.add(bMesh);
              }
              g.position.set(bx, 0, bz); g.rotation.y = rot;
              this.scene.add(g); this.obstacles.push(g);
            };

            // Fallback visible road surface (when no GLB models loaded)
            if (!_roadModel) {
              cfg.roads.forEach(r => {
                const isV = r.type === 'v';
                const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
                const cx = isV ? r.x : (r.x1 + r.x2) / 2;
                const cz = isV ? (r.z1 + r.z2) / 2 : r.z;
                const visRoad = new THREE.Mesh(
                  new THREE.PlaneGeometry(RW, len),
                  new THREE.MeshToonMaterial({ color: 0x3d3f45, gradientMap: window._toonGrad || null })
                );
                visRoad.rotation.set(-Math.PI / 2, 0, isV ? 0 : -Math.PI / 2);
                visRoad.position.set(cx, 0.02, cz);
                this.scene.add(visRoad);
              });
            }

            // ── Dense Urban Building Frontage along all roads ──
            (cfg.roads || []).forEach(r => {
              const isV = r.type === 'v';
              const rWidth = r.width || RW || 20;
              const bSetback = (rWidth / 2) + _swW + 12.0; // safe distance outside sidewalk
              const rStart = Math.min(isV ? r.z1 : r.x1, isV ? r.z2 : r.x2) + 24;
              const rEnd = Math.max(isV ? r.z1 : r.x1, isV ? r.z2 : r.x2) - 24;
              const bSpacing = 28; // safe building spacing

              for (let coord = rStart; coord < rEnd; coord += bSpacing) {
                [-1, 1].forEach(side => {
                  const bx = isV ? r.x + side * bSetback : coord;
                  const bz = isV ? coord : r.z + side * bSetback;
                  const rot = isV ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : (side > 0 ? Math.PI : 0);

                  // Ensure building does not collide with ANY road or intersection
                  const hitsRoad = (cfg.roads || []).some(other => {
                    const oIsV = other.type === 'v';
                    const oW = (other.width || RW || 20) / 2 + 6.0;
                    if (oIsV) {
                      return Math.abs(bx - other.x) < oW && bz >= Math.min(other.z1, other.z2) - 8 && bz <= Math.max(other.z1, other.z2) + 8;
                    } else {
                      return Math.abs(bz - other.z) < oW && bx >= Math.min(other.x1, other.x2) - 8 && bx <= Math.max(other.x1, other.x2) + 8;
                    }
                  });
                  const nearInt = (cfg.ints || []).some(([ix, iz]) => Math.abs(bx - ix) < 22 && Math.abs(bz - iz) < 22);
                  const nearGarage = this._garageX !== undefined && Math.hypot(bx - this._garageX, bz - this._garageZ) < 20;

                  if (!hitsRoad && !nearInt && !nearGarage) {
                    _drawBldg(bx, bz, 'normal', rot);
                  }
                });
              }
            });

            if (cfg.bldg && cfg.bldg.length) {
              cfg.bldg.forEach(b => {
                const bz = (b.z1 + b.z2) / 2;
                const bRot = b.x > 0 ? Math.PI / 2 : -Math.PI / 2;
                _drawBldg(b.x, bz, 'normal', bRot);
              });
            }
          }

      if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['metro']) {
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
            
            const busTpl = this._makeNPC('bus', 0xffffff);
            if (busTpl) {
              const bus = busTpl.clone();
              bus.position.set(4, 0, 30);
              bus.userData = { spd: 0, npcType: 'bus', moveAxis: 'v', isStopped: true };
              this.npcs.push(bus);
              this.scene.add(bus);
            }
            
            // Pedestrians waiting
            for (let i = 0; i < 3; i++) {
                const ped = _buildHuman();
                ped.position.set(7 + i, 0, 30 + Math.random()*2);
    ped.userData.vx = 0; ped.userData.vz = 0;
    this.scene.add(ped); this.peds.push(ped);
    if (typeof PedestrianAI !== 'undefined') {
      const pedAI = new PedestrianAI(ped, this.trafficManager);
      this.pedestrianAIs.push(pedAI); ped._pedAI = pedAI;
    }
}
        }
        
        // Custom Monuments and Sneh Asha
        if (cfg.id === 1) {
            // Sneh Asha Building
            const saGeo = new THREE.BoxGeometry(10, 40, 10);
            const saMat = new THREE.MeshToonMaterial({ color: 0xe0e0e0 });
            const saBldg = new THREE.Mesh(saGeo, saMat);
            saBldg.position.set(-45, 20, 35);
            this.scene.add(saBldg);
            this.obstacles.push(saBldg);
            if (!this._landmarks) this._landmarks = [];
            this._landmarks.push({ name: 'Sneh Asha', x: -45, z: 35, discovered: false });
            
            new THREE.TextureLoader().load('sneh-logo.png', tex => {
                const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
                logoMesh.position.set(-39.9, 30, 35);
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
            if (!this._landmarks) this._landmarks = [];
            this._landmarks.push({ name: 'Gateway of India', x: 0, z: -80, discovered: false });
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
            // Spawn extra pedestrians along sidewalks safely
            for (let i = 0; i < 6; i++) {
                const ped = _buildHuman();
                const side = i % 2 === 0 ? 1 : -1;
                const offsetZ = -80 - i * 40;
                ped.position.set(side * 8, 0, offsetZ);
                ped.userData = {
                    t: Math.random() * 10, spd: 0.02,
                    isV: true, dir: -side, startZ: offsetZ, roadC: 0,
                    state: 'waiting', side: side, targetDist: 16
                };
                // In night levels, give pedestrians bright reflective clothing
                if (cfg.isNight) {
                    ped.traverse(ch => {
                        if (ch.material) {
                            ch.material.color = new THREE.Color(0xfef08a);
                        }
                    });
                }
                this.scene.add(ped);
                this.peds.push(ped);
                // Attach PedestrianAI for intelligent behavior
                if (typeof PedestrianAI !== 'undefined') {
                  const pedAI = new PedestrianAI(ped, this.trafficManager);
                  this.pedestrianAIs.push(pedAI);
                  ped._pedAI = pedAI;
                }
            }
        } else if (cfg.themeType === 'respectful_parking') {
            // Spawn parked cars on SIDES of road (sidewalk/parking strip), not on road
            for (let i = 0; i < 15; i++) {
                const carTpl = this._makeNPC('car', 0x999999);
                if (carTpl) {
                  const pc = carTpl.clone();
                  const side = Math.random() > 0.5 ? 1 : -1;
                  const parkOffset = 8 + Math.random() * 4; // 8-12 units from center (clear of 6-unit road)
                  pc.position.set(side * parkOffset, 0, (Math.random() - 0.5) * 150);
                  pc.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
                  pc.userData.spd = 0; pc.userData.isStopped = true; pc.userData.isParked = true;
                  this.npcs.push(pc); this.scene.add(pc);
                }
            }
        } else if (cfg.themeType === 'ambulance_priority') {
            const ambTpl = this._makeNPC('car', 0xffffff);
            if (ambTpl) {
                this.ms.amb = ambTpl.clone();
                this.ms.amb.userData = { spd: 1.2, isAmb: true, npcType: 'ambulance', moveAxis: 'v' };
                const flash = new THREE.PointLight(0xff0000, 2, 8); flash.position.y = 1.5; this.ms.amb.add(flash);
                const flash2 = new THREE.PointLight(0x0000ff, 2, 8); flash2.position.set(.5, 1.5, 0); this.ms.amb.add(flash2);
                this.npcs.push(this.ms.amb); this.scene.add(this.ms.amb);
                this.ms.amb.position.set(2, 0.5, 30); // Right behind player
            }
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
        // Attach PedestrianAI for intelligent behavior
        if (typeof PedestrianAI !== 'undefined') {
          const pedAI = new PedestrianAI(ped, this.trafficManager);
          this.pedestrianAIs.push(pedAI);
          ped._pedAI = pedAI;
        }
    }
} else if (cfg.themeType === 'no_honking') {
            cfg.isSilenceZone = true;
            for (let i = 0; i < 6; i++) {
                const blockTpl = this._makeNPC('car', Math.random() * 0xffffff);
                if (blockTpl) {
                  const block = blockTpl.clone();
                block.position.set(0, 0, -20 - i * 15);
                block.userData.spd = 0; block.userData.isStopped = true;
                this.npcs.push(block); this.scene.add(block);
            }
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
          if (cfg.roads && cfg.roads.length > 0) {
            const types = ['gateway', 'bse', 'antilia'];
            for (let i = 0; i < 3; i++) {
              const r = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
              if (!r) continue;
              if (r.type === 'v') buildLandmark(types[i], r.x + 35, (r.z1 + r.z2) / 2);
              else buildLandmark(types[i], (r.x1 + r.x2) / 2, r.z + 35);
            }
          }
        }

        if (cfg.hasSchool) {
          const sGrp = new THREE.Group();
          const schoolX = -65, schoolZ = -30;

          // 1. Main School Building (2-Story Colonial Brick & Cream Architecture)
          const bldgMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c }); // Crimson brick
          const trimMat = new THREE.MeshLambertMaterial({ color: 0xfef08a }); // Cream trim
          const roofMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Slate roof
          const steelMat = new THREE.MeshLambertMaterial({ color: 0x334155 }); // Steel pole
          const winMat = new THREE.MeshToonMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });

          // Central Wing & Clock Tower
          const mainWing = new THREE.Mesh(new THREE.BoxGeometry(28, 13, 16), bldgMat);
          mainWing.position.set(0, 6.5, 0); sGrp.add(mainWing);
          const tower = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), trimMat);
          tower.position.set(0, 16.5, 0); sGrp.add(tower);
          const clockDome = new THREE.Mesh(new THREE.ConeGeometry(5.5, 6, 8), roofMat);
          clockDome.position.set(0, 23.5, 0); sGrp.add(clockDome);

          // Left and Right Classroom Wings
          [-19, 19].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(14, 11, 14), bldgMat);
            wing.position.set(wx, 5.5, 0); sGrp.add(wing);
            const wRoof = new THREE.Mesh(new THREE.BoxGeometry(15, 1.6, 15), roofMat);
            wRoof.position.set(wx, 11.8, 0); sGrp.add(wRoof);
          });

          // School Windows
          for (let f = 0; f < 2; f++) {
            for (let w = -5; w <= 5; w++) {
              if (w === 0 && f === 0) continue; // Entrance archway
              const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.2), winMat);
              win.position.set(w * 3.4, 3.8 + f * 4.8, 8.05);
              sGrp.add(win);
            }
          }

          // 2. High-DPI School Name Signboard Banner
          const sCanvas = document.createElement('canvas');
          sCanvas.width = 512; sCanvas.height = 128;
          const sCtx = sCanvas.getContext('2d');
          sCtx.fillStyle = '#facc15'; sCtx.fillRect(0, 0, 512, 128);
          sCtx.lineWidth = 8; sCtx.strokeStyle = '#dc2626'; sCtx.strokeRect(4, 4, 504, 120);
          sCtx.fillStyle = '#1e293b'; sCtx.font = 'bold 36px sans-serif'; sCtx.textAlign = 'center';
          sCtx.fillText('🏫 ST. XAVIER HIGH SCHOOL', 256, 48);
          sCtx.fillStyle = '#dc2626'; sCtx.font = 'bold 26px sans-serif';
          sCtx.fillText('⚠️ CAUTION: SCHOOL ZONE (MAX 20 KM/H)', 256, 92);
          const schoolSignTex = new THREE.CanvasTexture(sCanvas);
          const schoolSign = new THREE.Mesh(new THREE.BoxGeometry(18, 4.2, 0.4), new THREE.MeshLambertMaterial({ map: schoolSignTex }));
          schoolSign.position.set(0, 11.5, 8.3); sGrp.add(schoolSign);

          // Boundary wall and school gate facing road (Z = 0)
          const wallMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
          [-18, 18].forEach(wx => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(15, 2.4, 0.5), wallMat);
            wall.position.set(wx, 1.2, 12.5); sGrp.add(wall);
          });
          // Gate pillars
          [-8, 8].forEach(px => {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.8, 1.4), trimMat);
            pillar.position.set(px, 1.9, 12.5); sGrp.add(pillar);
          });

          // School flag pole
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 12, 8), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
          pole.position.set(-6, 6, 10); sGrp.add(pole);
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
          flag.position.set(-5.0, 11, 10); sGrp.add(flag);

          sGrp.position.set(schoolX, 0, schoolZ);
          sGrp.rotation.y = 0; // Facing south towards road at Z = 0
          this.scene.add(sGrp);
          this.world.push(sGrp);

          // School building collision obstacle
          const schoolCol = new THREE.Group();
          schoolCol.position.set(schoolX, 0, schoolZ);
          schoolCol.userData = { halfW: 24, halfD: 16, isObstacle: true, isBuilding: true };
          this.obstacles.push(schoolCol);

          // 3. Parked Yellow School Bus outside the school gate along curbside
          const schoolBus = typeof window.IndianVehicles !== 'undefined' ? window.IndianVehicles.buildVehicle('bus', 0xfacc15) : _buildVehicle('bus', 0xfacc15);
          if (schoolBus) {
            schoolBus.position.set(schoolX + 18, 0, -6.8);
            schoolBus.rotation.y = Math.PI / 2; // Parked parallel to road along Z = -6.8
            schoolBus.userData = { halfW: 4.5, halfD: 1.5, isObstacle: true, isVehicle: true };
            this.scene.add(schoolBus);
            this.obstacles.push(schoolBus);
          }

          // 4. Zebra Crossing Markings across the road right in front of School Gate (X = -65)
          const zMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          for (let s = -5; s <= 5; s++) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 11.0), zMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(schoolX + (s * 1.6), 0.03, 0);
            this.scene.add(stripe);
          }

          // 5. School Crossing Guard with Stop Sign on the North Sidewalk
          const guard = _buildHuman(false, { skin: 0xc68642, shirt: 0xf97316, pants: 0x1e293b, hair: 0x111111 });
          guard.position.set(schoolX - 2, 0, -6.5);
          guard.rotation.y = Math.PI; // Facing incoming traffic from east
          // Add Stop Sign in hand
          const stopSign = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
          stopSign.rotation.x = Math.PI / 2;
          stopSign.position.set(0.7, 1.5, 0.4);
          guard.add(stopSign);
          const stopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), new THREE.MeshLambertMaterial({ color: 0x64748b }));
          stopPole.position.set(0.7, 1.0, 0.4);
          guard.add(stopPole);
          guard.userData = { isGuard: true, isObstacle: true, halfW: 0.6, halfD: 0.6 };
          this.scene.add(guard);
          this.peds.push(guard);

          // 6. Roadside School Zone Warning Blinkers & Signs (Both directions)
          [-30, -100].forEach((signX, sIdx) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.0, 8), steelMat);
            post.position.set(signX, 2.0, -7.5);
            this.scene.add(post);

            const sCanv = document.createElement('canvas');
            sCanv.width = 256; sCanv.height = 256;
            const cCtx = sCanv.getContext('2d');
            cCtx.fillStyle = '#facc15'; cCtx.fillRect(0, 0, 256, 256);
            cCtx.lineWidth = 10; cCtx.strokeStyle = '#dc2626'; cCtx.strokeRect(6, 6, 244, 244);
            cCtx.fillStyle = '#dc2626'; cCtx.font = 'bold 70px sans-serif'; cCtx.textAlign = 'center';
            cCtx.fillText('20', 128, 100);
            cCtx.fillStyle = '#1e293b'; cCtx.font = 'bold 30px sans-serif';
            cCtx.fillText('KM/H', 128, 145);
            cCtx.fillText('SCHOOL', 128, 190);
            cCtx.fillText('ZONE', 128, 230);
            const signPlate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sCanv) }));
            signPlate.position.set(signX, 3.2, -7.5);
            signPlate.rotation.y = sIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
            this.scene.add(signPlate);

            // Flashing amber caution beacon
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
            beacon.position.set(signX, 4.2, -7.5);
            this.scene.add(beacon);
          });

          // 7. Stationary & Snack Stall ("Vidyarthi Book Depot & Chai Stall")
          const stallGrp = new THREE.Group();
          const stallBody = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.8, 3.0), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
          stallBody.position.set(0, 1.4, 0); stallGrp.add(stallBody);
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.2, 3.6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
          canopy.position.set(0, 2.9, 0.2); stallGrp.add(canopy);
          stallGrp.position.set(schoolX - 22, 0, -11.5);
          this.scene.add(stallGrp);
          this.world.push(stallGrp);

          // 8. 14+ School Children in Uniforms with Backpacks
          const uniformShirts = [0xf8fafc, 0xe0f2fe]; // White / sky-blue shirts
          const uniformPants = [0x1e3a8a, 0x1e293b];  // Navy blue shorts / skirts
          for (let i = 0; i < 14; i++) {
            const uApp = {
              skin: [0xd4a574, 0xc68642, 0x8d5524, 0xf1c27d][i % 4],
              shirt: uniformShirts[i % uniformShirts.length],
              pants: uniformPants[i % uniformPants.length],
              hair: 0x1a1a1a
            };
            const child = _buildHuman(false, uApp);
            child.scale.set(0.72, 0.72, 0.72);
            // Colorful backpack
            const bagMat = new THREE.MeshToonMaterial({ color: [0xef4444, 0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xec4899][i % 6] });
            const bag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.24), bagMat);
            bag.position.set(0, 1.15, -0.22);
            child.add(bag);

            let startX, startZ, targetX, targetZ;
            if (i < 8) {
              // Active zebra crossing students (crossing North <-> South across Z = 0)
              startX = schoolX - 4.5 + (i * 1.3);
              startZ = (i % 2 === 0) ? -7.0 : 7.0;
              targetX = startX;
              targetZ = (i % 2 === 0) ? 7.5 : -7.5;
              child.position.set(startX, 0, startZ);
              child.rotation.y = (i % 2 === 0) ? 0 : Math.PI;
              child.userData = {
                spd: 0.024 + Math.random() * 0.016,
                state: 'crossing',
                startX, startZ, targetX, targetZ,
                crossingZ: startZ,
                isChild: true,
                isObstacle: true,
                halfW: 0.35, halfD: 0.35
              };
            } else if (i < 11) {
              // Students walking along the sidewalk towards the school bus
              startX = schoolX + 5 + (i - 8) * 3.5;
              startZ = -7.2;
              child.position.set(startX, 0, startZ);
              child.rotation.y = Math.PI / 2;
              child.userData = { spd: 0.02, state: 'sidewalk', isChild: true, halfW: 0.35, halfD: 0.35 };
            } else {
              // Students standing by school gate chatting
              startX = schoolX - 3.5 + (i - 11) * 2.5;
              startZ = -14.0;
              child.position.set(startX, 0, startZ);
              child.rotation.y = (i % 2 === 0) ? Math.PI / 4 : -Math.PI / 4;
              child.userData = { spd: 0, state: 'idle', isChild: true, halfW: 0.35, halfD: 0.35 };
            }

            this.scene.add(child);
            this.peds.push(child);

            if (typeof PedestrianAI !== 'undefined') {
              const childAI = new PedestrianAI(child, this.trafficManager);
              childAI.profileKey = 'child';
              childAI.profile = PED_PROFILES.child || { maxSpeed: 1.0, lookDistance: 12, complianceRate: 0.6 };
              this.pedestrianAIs.push(childAI);
              child._pedAI = childAI;
            }
          }
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

        // Temple (level 20)
        if (cfg.hasTemple) {
          const temple = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 14), new THREE.MeshToonMaterial({ color: 0xd4a574 }));
          temple.position.set(-35, 5, -70); this.scene.add(temple); this.obstacles.push(temple);
          // Temple dome
          const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshToonMaterial({ color: 0xffd700 }));
          dome.position.set(-35, 10, -70); this.scene.add(dome);
          // Aarti lamp glow
          const lamp = new THREE.PointLight(0xffaa00, 1.5, 20);
          lamp.position.set(-35, 8, -65); this.scene.add(lamp);
        }

        // Bus Stop (level 33)
        if (cfg.hasBusStop) {
          const shelter = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), new THREE.MeshToonMaterial({ color: 0x3366cc }));
          shelter.position.set(5, 1.5, 20); this.scene.add(shelter);
          const roof = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 2.5), new THREE.MeshToonMaterial({ color: 0x2255aa }));
          roof.position.set(5, 3.1, 20); this.scene.add(roof);
        }

        // Fire Hydrant (level 28)
        if (cfg.hasFireHydrant) {
          const hydrant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8), new THREE.MeshToonMaterial({ color: 0xff0000 }));
          hydrant.position.set(12, 0.6, 15); this.scene.add(hydrant);
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8), new THREE.MeshToonMaterial({ color: 0xcc0000 }));
          cap.position.set(12, 1.35, 15); this.scene.add(cap);
        }

        // Toll Booth (level 30)
        if (cfg.hasTollBooth) {
          const booth = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 3), new THREE.MeshToonMaterial({ color: 0x888888 }));
          booth.position.set(0, 2, 50); this.scene.add(booth);
          const roof2 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 4), new THREE.MeshToonMaterial({ color: 0x666666 }));
          roof2.position.set(0, 4.15, 50); this.scene.add(roof2);
          // Toll sign
          const tSign = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), new THREE.MeshToonMaterial({ color: 0xffd700 }));
          tSign.position.set(0, 5.5, 50); this.scene.add(tSign);
        }

        // Construction Zone with Flagman (level 34, 44)
        if (cfg.hasConstruction || cfg.themeType === 'construction') {
          // Create high-detail hazard stripe texture for construction barricades
          const cCanvas = document.createElement('canvas');
          cCanvas.width = 256; cCanvas.height = 128;
          const cCtx = cCanvas.getContext('2d');
          cCtx.fillStyle = '#f59e0b';
          cCtx.fillRect(0, 0, 256, 128);
          cCtx.fillStyle = '#0f172a';
          for (let x = -128; x < 384; x += 36) {
            cCtx.beginPath();
            cCtx.moveTo(x, 0);
            cCtx.lineTo(x + 28, 128);
            cCtx.lineTo(x + 48, 128);
            cCtx.lineTo(x + 20, 0);
            cCtx.fill();
          }
          const cHazardTex = new THREE.CanvasTexture(cCanvas);
          cHazardTex.wrapS = cHazardTex.wrapT = THREE.RepeatWrapping;
          cHazardTex.repeat.set(2, 1);
          const cBarMat = new THREE.MeshLambertMaterial({ map: cHazardTex });
          const cPostMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
          const cConeMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
          const cWhiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

          // Construction barriers blocking one lane with detour gap
          for (let cb = 0; cb < 5; cb++) {
            const bGrp = new THREE.Group();
            [-0.9, 0.9].forEach(px => {
              const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), cPostMat);
              post.position.set(px, 0.55, 0);
              bGrp.add(post);
              const ft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.6), cPostMat);
              ft.position.set(px, 0.05, 0);
              bGrp.add(ft);
            });
            const board1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.06), cBarMat);
            board1.position.set(0, 0.85, 0);
            bGrp.add(board1);
            const board2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.06), cBarMat);
            board2.position.set(0, 0.4, 0);
            bGrp.add(board2);

            bGrp.position.set(-6 + cb * 2.8, 0, 25 + Math.sin(cb * 0.8) * 3);
            bGrp.userData = { halfW: 1.1, halfD: 0.4, isBarrier: true, isObstacle: true };
            this.scene.add(bGrp);
            this.obstacles.push(bGrp);
            this.world.push(bGrp);

            const cone = new THREE.Group();
            const cBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), cConeMat);
            cBase.position.y = 0.03; cone.add(cBase);
            const cBody = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 12), cConeMat);
            cBody.position.y = 0.38; cone.add(cBody);
            const cStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 12), cWhiteMat);
            cStripe.position.y = 0.38; cone.add(cStripe);
            cone.position.set(-6 + cb * 2.8, 0, 23.5 + Math.sin(cb * 0.8) * 3);
            cone.userData = { halfW: 0.3, halfD: 0.3, isObstacle: true };
            this.scene.add(cone);
            this.obstacles.push(cone);
          }
          // Flagman
          if (cfg.hasFlagman) {
            let flagman;
            if (this._pedFree && this._pedFree.length > 0) {
              flagman = this._pedFree.pop();
              flagman.visible = true;
            } else {
              flagman = _buildHuman();
            }
            flagman.position.set(0, 0, 35);
            flagman.userData = { spd: 0, state: 'flagman' };
            // Add orange vest
            const vest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), new THREE.MeshToonMaterial({ color: 0xff6600 }));
            vest.position.set(0, 1.2, 0); flagman.add(vest);
            // Add flag
            const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2, 8), new THREE.MeshToonMaterial({ color: 0x8B4513 }));
            flagPole.position.set(0.4, 2, 0); flagman.add(flagPole);
            const flag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), new THREE.MeshToonMaterial({ color: 0xff0000 }));
            flag.position.set(0.7, 2.8, 0); flagman.add(flag);
            this.scene.add(flagman);
            this.peds.push(flagman);
            if (typeof PedestrianAI !== 'undefined') {
              const flagAI = new PedestrianAI(flagman, this.trafficManager);
              this.pedestrianAIs.push(flagAI); flagman._pedAI = flagAI;
            }
          }
        }

        // Cyclist (level 39)
        if (cfg.hasCyclist) {
          const cycle = new THREE.Group();
          const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.5), new THREE.MeshToonMaterial({ color: 0x333333 }));
          frame.position.y = 0.5; cycle.add(frame);
          const wheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16), new THREE.MeshToonMaterial({ color: 0x111111 }));
          wheel1.position.set(0, 0.35, 0.6); wheel1.rotation.y = Math.PI/2; cycle.add(wheel1);
          const wheel2 = wheel1.clone(); wheel2.position.z = -0.6; cycle.add(wheel2);
          cycle.position.set(-3, 0, 25);
          cycle.userData = { spd: 0.4, dir: -1 };
          this.scene.add(cycle);
          this.npcs.push(cycle);
        }

        // ── 16 Dedicated Scenario Builders ──
        if (cfg.hasElderlyCrossing) this._buildElderlyCrossing(cfg);
        if (cfg.hasNightCrossing || (cfg.isNight && cfg.id === 14)) this._buildNightCrossings(cfg);
        if (cfg.isParkingChallenge) this._buildParkingScenario(cfg);
        if (cfg.hasAmbulanceBehind) this._buildAmbulanceScenario(cfg);
        if (cfg.isNarrowStreet) this._buildNarrowGully(cfg);
        if (cfg.hasBlindCorner) this._buildBlindCorner(cfg);
        if (cfg.hasHillPhysics) this._buildHillTerrain(cfg);
        if (cfg.isRural) this._buildRuralRoad(cfg);
        if (cfg.isOneWay) this._buildOneWayStreet(cfg);
        if (cfg.hasSignQuiz || cfg.themeType === 'signs') this._buildSignRecognition(cfg);
        if (cfg.hasConstruction) this._buildConstructionMaze(cfg);
        if (cfg.hasCow || cfg.hasDog) this._buildCattleObstacle(cfg);
        if (cfg.hasHospital && !this._hospitalBuilt) { this._buildHospitalZone(cfg); this._hospitalBuilt = true; }
        if (cfg.crowdFestival) this._buildFestivalScene(cfg);
        if (cfg.isHighway) this._buildHighwaySystem(cfg);
        if (cfg.hasLibrary) this._buildLibrary(cfg);
        if (cfg.hasTollBooth && !cfg.isBridge) this._buildTollPlaza(cfg);

        // Bollards and barricades — only spawn on construction / pedestrian training levels
        if (cfg.hasConstruction || cfg.isPedestrian) {
          const bCount = cfg.isPedestrian ? 2 : 4;
          const routePoints = (cfg.route && cfg.route.length > 0) ? cfg.route : [{ x: 0, z: 0 }];
          for (let i = 0; i < bCount; i++) {
            if (!cfg.roads || cfg.roads.length === 0) break;
            const seg = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
            const rWidth = seg.width || 20;
            // Place strictly on sidewalk shoulder / curb edge, never in middle of driving lane
            const sideOffset = (rWidth / 2) + 1.2;
            const bx = seg.type === 'v' ? seg.x + (i % 2 === 0 ? sideOffset : -sideOffset) : seg.x1 + 10 + Math.random() * Math.max(10, (seg.x2 - seg.x1) - 20);
            const bz = seg.type === 'v' ? seg.z1 + 10 + Math.random() * Math.max(10, (seg.z2 - seg.z1) - 20) : seg.z + (i % 2 === 0 ? sideOffset : -sideOffset);
            
            // Do not place within 18m of ANY route waypoint or finish gate
            const nearRoute = routePoints.some(rp => Math.hypot(bx - rp.x, bz - rp.z) < 18);
            if (nearRoute) continue;

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
        }

        // Remove any non-building obstacles within 18 units of ANY route waypoint or finish gate
        const allRoutePts = (cfg.route && cfg.route.length > 0) ? cfg.route : [{ x: 0, z: 0 }];
        this.obstacles = this.obstacles.filter(ob => {
          if (ob.userData && ob.userData.isBuilding) return true; // keep buildings
          const obX = ob.position.x, obZ = ob.position.z;
          const isBlockingRoute = allRoutePts.some(rp => Math.hypot(obX - rp.x, obZ - rp.z) < 18);
          if (isBlockingRoute) {
            this.scene.remove(ob);
            return false;
          }
          return true;
        });
        // Parked vehicles — placed legally parallel along road curb shoulders
        if (!cfg.isPedestrian && cfg.roads && cfg.roads.length > 0) {
          for (let i = 0; i < 10; i++) {
            const seg = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
            const types = ['car', 'auto', 'bike', 'taxi'];
            const pcTpl = this._makeNPC(types[i % types.length], Math.random() * 0xffffff);
            if (pcTpl) {
              const pc = pcTpl.clone();
              const side = Math.random() > 0.5 ? 1 : -1;
              const rWidth = seg.width || 20;
              const shoulderOffset = (rWidth / 2) - 1.4; // parked parallel right against the curb
              if (seg.type === 'v') {
                const zMin = Math.min(seg.z1, seg.z2) + 40;
                const zMax = Math.max(seg.z1, seg.z2) - 40;
                pc.position.set(seg.x + side * shoulderOffset, 0, zMin + Math.random() * (zMax - zMin));
                pc.rotation.y = side > 0 ? 0 : Math.PI; // parallel to road
              } else {
                const xMin = Math.min(seg.x1, seg.x2) + 40;
                const xMax = Math.max(seg.x1, seg.x2) - 40;
                pc.position.set(xMin + Math.random() * (xMax - xMin), 0, seg.z + side * shoulderOffset);
                pc.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; // parallel to road
              }
              pc.userData = { isParked: true, isVehicle: true, halfW: 1.4, halfD: 2.2, isBuilding: false };
              this.scene.add(pc);
              this.obstacles.push(pc);
            }
          }
        }
      
      // ── Build Level Route Checkpoints & Finish Gate ──
      this._buildRouteCheckpoints(cfg);

      // Initialize player vehicle/pedestrian first so traffic spawns around player
      this._pmesh(mode, this.vehMode || cfg.veh);

      // Initialize TrafficManager for lively Mumbai-style traffic
      if (!cfg.isPedestrian && window.TrafficManager) {
        if (!this.trafficManager) {
          this.trafficManager = new window.TrafficManager(this);
        }
        if (this.roadGraph) {
          const initCount = window.isMobile && window.isMobile() ? 40 : 75;
          this.trafficManager.spawnInitialTraffic(this.roadGraph, cfg.route, initCount, cfg);
        }
      }
      }
      _buildRoadsFromGraph(roadWidth) {
        const graph = this.roadGraph;
        const cfg = this.mapCfg;
        const roadKey = window.PRELOADED_MODELS?.road_avenue ? 'road_avenue' : 'road_straight';
        const roadModel = window.PRELOADED_MODELS?.[roadKey];
        const isNight = cfg?.isNight;
        const isPedestrian = cfg?.isPedestrian;

        if (!roadModel) {
          console.warn('[RoadGraph] No road model available, falling back to legacy _buildRoadZones');
          this._buildRoadZones(roadWidth);
          this._buildBarriers(cfg, roadWidth);
          return;
        }

        // Road material (visible) — use real asphalt texture if available
        const _rTex = (() => { try { const t = new THREE.TextureLoader().load('textures/road.png'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 8); return t; } catch(e) { return null; } })();
        const roadMat = _rTex ? new THREE.MeshLambertMaterial({ map: _rTex }) : new THREE.MeshLambertMaterial({ color: 0x25282e });
        const paveMat = new THREE.MeshLambertMaterial({ color: 0x767c85 });
        const tactileMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });



        graph.edges.forEach(edge => {
          const isV = Math.abs(edge.direction.x) < 0.1;
          const len = edge.length;
          const n0 = edge.nodes[0];
          const n1 = edge.nodes[1];
          const cx = isV ? n0.position.x : (n0.position.x + n1.position.x) / 2;
          const cz = isV ? (n0.position.z + n1.position.z) / 2 : n0.position.z;

          // Logical road bed (collision)
          const roadHb = new THREE.Mesh(
            new THREE.PlaneGeometry(roadWidth, len),
            new THREE.MeshBasicMaterial({ visible: false })
          );
          roadHb.rotation.set(-Math.PI / 2, 0, isV ? 0 : -Math.PI / 2);
          roadHb.position.set(cx, 0.01, cz);
          this.scene.add(roadHb);
          this.world.push(roadHb);

          // Visual road tiles using GLB model
          const tileScale = roadWidth / 1000;
          const tileLenScale = 3; // stretch 3x to reduce draw calls
          const tileSize = 1500 * tileScale * tileLenScale;
          const numTiles = Math.max(1, Math.floor(len / tileSize));
          
          // Center the tiles with even spacing at ends
          const totalTileLen = numTiles * tileSize;
          const extraSpace = len - totalTileLen;
          const startOffset = extraSpace / 2;
          
          const startX = isV ? cx : Math.min(n0.position.x, n1.position.x) + tileSize / 2 + startOffset;
          const startZ = isV ? Math.min(n0.position.z, n1.position.z) + tileSize / 2 + startOffset : cz;

          for (let i = 0; i < numTiles; i++) {
            const tile = roadModel.clone();
            tile.scale.set(tileScale, tileScale, tileScale * tileLenScale);
            tile.frustumCulled = true;
            tile.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; c.material = roadMat; } });
            
            if (isV) {
              tile.position.set(cx, 0.08, startZ + i * tileSize);
            } else {
              tile.rotation.y = Math.PI / 2;
              tile.position.set(startX + i * tileSize, 0.08, cz);
            }
            this.scene.add(tile);
          }

          // Sidewalks
          const swW = isPedestrian ? 6 : 4;
          [-1, 1].forEach(side => {
            const pb = new THREE.Mesh(
              isV ? new THREE.BoxGeometry(swW, 0.15, len) : new THREE.BoxGeometry(len, 0.15, swW),
              paveMat
            );
            pb.position.set(
              isV ? cx + side * (roadWidth / 2 + swW / 2) : cx,
              0.07,
              isV ? cz : cz + side * (roadWidth / 2 + swW / 2)
            );
            this.scene.add(pb);
            this.world.push(pb);
          });

          // ── Road Lane Markings (White dashed center line & solid edge lines) ──
          const dashLen = 3.5;
          const gapLen = 3.5;
          const stride = dashLen + gapLen;
          const numDashes = Math.max(1, Math.floor(len / stride));
          const startMark = (len - numDashes * stride) / 2;
          const markStart = isV ? Math.min(n0.position.z, n1.position.z) + startMark : Math.min(n0.position.x, n1.position.x) + startMark;
          const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
          const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffb703, transparent: true, opacity: 0.92 });

          const lanes = edge.lanes || (roadWidth >= 18 ? 4 : 2);
          if (lanes >= 4) {
            [-0.25, 0.25].forEach(yOff => {
              const dLine = new THREE.Mesh(
                isV ? new THREE.PlaneGeometry(0.16, len) : new THREE.PlaneGeometry(len, 0.16),
                yellowLineMat
              );
              dLine.rotation.x = -Math.PI / 2;
              dLine.position.set(isV ? cx + yOff : cx, 0.088, isV ? cz : cz + yOff);
              this.scene.add(dLine);
            });
          } else {
            for (let d = 0; d < numDashes; d++) {
              const dashCenter = markStart + d * stride + dashLen / 2;
              const dashMesh = new THREE.Mesh(
                isV ? new THREE.PlaneGeometry(0.24, dashLen) : new THREE.PlaneGeometry(dashLen, 0.24),
                whiteLineMat
              );
              dashMesh.rotation.x = -Math.PI / 2;
              dashMesh.position.set(isV ? cx : dashCenter, 0.088, isV ? dashCenter : cz);
              this.scene.add(dashMesh);
            }
          }

          [-1, 1].forEach(edgeSide => {
            const edgeX = isV ? cx + edgeSide * (roadWidth / 2 - 0.4) : cx;
            const edgeZ = isV ? cz : cz + edgeSide * (roadWidth / 2 - 0.4);
            const edgeLine = new THREE.Mesh(
              isV ? new THREE.PlaneGeometry(0.18, len) : new THREE.PlaneGeometry(len, 0.18),
              whiteLineMat
            );
            edgeLine.rotation.x = -Math.PI / 2;
            edgeLine.position.set(edgeX, 0.088, edgeZ);
            this.scene.add(edgeLine);
          });

          // Realistic Zebra Crossings at intersections (placed before intersection node at stop line)
          const nodeA = edge.nodes[0];
          const nodeB = edge.nodes[1];
          const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
          const stopLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });

          [nodeA, nodeB].forEach(node => {
            if (node.edges.length >= 3) {
              const nodePos = node.position;
              const stopDist = roadWidth / 2 + 3.0; // Distance from node center to stop line
              
              if (isV) {
                // Vertical Road: Zebra stripes run along Z, arrayed across X
                const crossZ = nodePos.z + (nodePos.z > cz ? -stopDist : stopDist);
                const stripeW = 0.5;
                const stripeL = 3.0;
                const numStripes = Math.floor((roadWidth - 2) / 1.0);
                const startX = cx - ((numStripes - 1) * 1.0) / 2;
                
                // Individual zebra stripes
                for (let s = 0; s < numStripes; s++) {
                  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, stripeL), zebraMat);
                  stripe.rotation.x = -Math.PI / 2;
                  stripe.position.set(startX + s * 1.0, 0.089, crossZ);
                  this.scene.add(stripe);
                }
                // Solid stop line bar before zebra crossing
                const stopLineZ = crossZ + (nodePos.z > cz ? -2.0 : 2.0);
                const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth - 1, 0.35), stopLineMat);
                stopLine.rotation.x = -Math.PI / 2;
                stopLine.position.set(cx, 0.089, stopLineZ);
                this.scene.add(stopLine);
                
                // Tactile paving at sidewalk ends
                [-1, 1].forEach(side => {
                  const tp = new THREE.Mesh(new THREE.BoxGeometry(swW, 0.05, 3.0), tactileMat);
                  tp.position.set(cx + side * (roadWidth / 2 + swW / 2), 0.08, crossZ);
                  this.scene.add(tp);
                });
              } else {
                // Horizontal Road: Zebra stripes run along X, arrayed across Z
                const crossX = nodePos.x + (nodePos.x > cx ? -stopDist : stopDist);
                const stripeW = 0.5;
                const stripeL = 3.0;
                const numStripes = Math.floor((roadWidth - 2) / 1.0);
                const startZ = cz - ((numStripes - 1) * 1.0) / 2;
                
                // Individual zebra stripes
                for (let s = 0; s < numStripes; s++) {
                  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeL, stripeW), zebraMat);
                  stripe.rotation.x = -Math.PI / 2;
                  stripe.position.set(crossX, 0.089, startZ + s * 1.0);
                  this.scene.add(stripe);
                }
                // Solid stop line bar before zebra crossing
                const stopLineX = crossX + (nodePos.x > cx ? -2.0 : 2.0);
                const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(0.35, roadWidth - 1), stopLineMat);
                stopLine.rotation.x = -Math.PI / 2;
                stopLine.position.set(stopLineX, 0.089, cz);
                this.scene.add(stopLine);
                
                // Tactile paving at sidewalk ends
                [-1, 1].forEach(side => {
                  const tp = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, swW), tactileMat);
                  tp.position.set(crossX, 0.08, cz + side * (roadWidth / 2 + swW / 2));
                  this.scene.add(tp);
                });
              }
            }
          });
        });
      }

      separateRoadAndBuilding(pos, graph) {
        if (!pos) return false;
        if (this._spawnPos && Math.hypot(pos.x - this._spawnPos.x, pos.z - this._spawnPos.z) < 24) {
          return true;
        }
        if (!graph || !graph.edges) return false;
        const edges = typeof graph.edges.values === 'function' ? Array.from(graph.edges.values()) : graph.edges;
        for (const edge of edges) {
          const a = edge.nodes[0].position, b = edge.nodes[1].position;
          const abx = b.x - a.x, abz = b.z - a.z;
          const len2 = abx * abx + abz * abz;
          let t = len2 ? ((pos.x - a.x) * abx + (pos.z - a.z) * abz) / len2 : 0;
          t = Math.max(0, Math.min(1, t));
          const dist = Math.hypot(a.x + abx * t - pos.x, a.z + abz * t - pos.z);
          const width = edge.width || 12;
          // Must stay outside road half-width + full sidewalk (6m) + building half-width (11m) + buffer (1m)
          if (dist < width / 2 + 18.0) {
            return true;
          }
        }
        return false;
      }

      // ─── Graph-based building generation ───
      // Places buildings using RoadGraph's buildingSlots (road-aware, zoned)
      // Uses InstancedMesh for GLB models, falls back to procedural boxes

      // ─── Clean Modern Roadside Parking Bay (Level 14 Style) ───
      _buildElderlyCrossing(cfg) {
        const root = this.scene;
        const baseX = cfg.elderlyCrossX || 0;
        const baseZ = cfg.elderlyCrossZ || 20;
        
        // Zebra crossing stripes on road
        for (let i = -3; i <= 3; i++) {
          const stripeG = new THREE.PlaneGeometry(0.8, 6);
          const stripeM = new THREE.MeshLambertMaterial({ color: 0xffffff });
          const stripe = new THREE.Mesh(stripeG, stripeM);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(baseX + i * 1.2, 0.02, baseZ);
          root.add(stripe);
        }
        
        // Warning signs on both sides
        const signColors = [0xffd700, 0xff8c00];
        [-8, 8].forEach((side, idx) => {
          const poleG = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6);
          const poleM = new THREE.MeshLambertMaterial({ color: 0x888888 });
          const pole = new THREE.Mesh(poleG, poleM);
          pole.position.set(baseX + side, 1.25, baseZ);
          root.add(pole);
          
          const signG = new THREE.PlaneGeometry(1.0, 1.0);
          const canvas = document.createElement('canvas');
          canvas.width = 128; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath(); ctx.moveTo(64,4); ctx.lineTo(124,124); ctx.lineTo(4,124); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 6; ctx.stroke();
          ctx.font = 'bold 36px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'center';
          ctx.fillText('🚶', 64, 80);
          const signM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
          const sign = new THREE.Mesh(signG, signM);
          sign.position.set(baseX + side, 2.7, baseZ);
          root.add(sign);
        });
        
        // Elderly pedestrian group
        const elderGroup = new THREE.Group();
        elderGroup.position.set(baseX - 6, 0, baseZ);
        
        // Body
        const bodyG = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 8);
        const bodyM = new THREE.MeshLambertMaterial({ color: 0xf5f0e1 }); // cream kurta
        const body = new THREE.Mesh(bodyG, bodyM);
        body.position.y = 0.75;
        elderGroup.add(body);
        
        // Head
        const headG = new THREE.SphereGeometry(0.22, 12, 8);
        const headM = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
        const head = new THREE.Mesh(headG, headM);
        head.position.y = 1.65;
        elderGroup.add(head);
        
        // Silver hair
        const hairG = new THREE.SphereGeometry(0.24, 10, 6);
        const hairM = new THREE.MeshLambertMaterial({ color: 0xd4d4d4 });
        const hair = new THREE.Mesh(hairG, hairM);
        hair.position.set(0, 0.08, 0);
        hair.scale.set(1, 0.6, 1);
        head.add(hair);
        
        // Spectacles
        const specM = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        [-0.1, 0.1].forEach(sx => {
          const frameG = new THREE.TorusGeometry(0.06, 0.008, 6, 12);
          const frame = new THREE.Mesh(frameG, specM);
          frame.position.set(sx, 0, 0.22);
          frame.rotation.y = Math.PI / 2;
          head.add(frame);
        });
        
        // Walking stick
        const stickG = new THREE.CylinderGeometry(0.02, 0.025, 1.1, 6);
        const stickM = new THREE.MeshLambertMaterial({ color: 0x5C3317 });
        const stick = new THREE.Mesh(stickG, stickM);
        stick.position.set(0.35, 0.3, 0);
        stick.rotation.z = 0.15;
        elderGroup.add(stick);
        
        // Curved handle
        const handleG = new THREE.TorusGeometry(0.05, 0.02, 6, 8, Math.PI);
        const handle = new THREE.Mesh(handleG, stickM);
        handle.position.set(0.38, 0.88, 0);
        handle.rotation.z = Math.PI / 2;
        elderGroup.add(handle);
        
        root.add(elderGroup);
        
        // Store reference for animation
        this._elderlyPed = {
          group: elderGroup,
          startX: baseX - 8,
          endX: baseX + 8,
          speed: 0.6, // very slow, m/s
          direction: 1,
          stick: stick
        };
      }

      _buildNightCrossings(cfg) {
        const root = this.scene;
        const crossings = [
          { x: 0, z: -50, axis: 'h', label: 'Unmarked Elderly Crossing', width: 26, hasElderly: true },
          { x: 60, z: -120, axis: 'v', label: 'Night Market Crossing', width: 24, pedCount: 3 },
          { x: 120, z: -180, axis: 'h', label: 'Mid-Block Crossing', width: 24, pedCount: 3 },
          { x: 180, z: -240, axis: 'v', label: 'Hospital Approach Zebra Crossing', width: 24, pedCount: 4 },
          { x: -120, z: -60, axis: 'h', label: 'West Link Crossing', width: 22, pedCount: 2 }
        ];

        this._nightCrossingZones = [];

        crossings.forEach(cr => {
          const isV = cr.axis === 'v';
          const halfW = cr.width / 2;

          // 1. Zebra crossing stripes with reflective emissive white tint
          const stripeMat = new THREE.MeshToonMaterial({
            color: 0xffffff,
            emissive: 0x444444,
            gradientMap: window._toonGrad
          });
          for (let i = -4; i <= 4; i++) {
            const stripeG = new THREE.PlaneGeometry(isV ? 5 : 0.9, isV ? 0.9 : 5);
            const stripe = new THREE.Mesh(stripeG, stripeMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(
              isV ? cr.x : cr.x + i * 1.5,
              0.025,
              isV ? cr.z + i * 1.5 : cr.z
            );
            root.add(stripe);
          }

          // 2. Streetlight directly over the zebra crossing illuminating pedestrians
          const poleMat = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: window._toonGrad });
          const lightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6.5, 8), poleMat);
          const poleSide = isV ? cr.x + (halfW + 1.5) : cr.x + (halfW + 1.5);
          lightPole.position.set(isV ? cr.x : poleSide, 3.25, isV ? cr.z + (halfW + 1.5) : cr.z);
          root.add(lightPole);

          const spot = new THREE.SpotLight(0xfffaed, 3.5, 40, Math.PI / 4, 0.6, 1.2);
          spot.position.set(isV ? cr.x : poleSide, 6.5, isV ? cr.z + (halfW + 1.5) : cr.z);
          spot.target.position.set(cr.x, 0, cr.z);
          root.add(spot);
          root.add(spot.target);
          if (this._streetLights) this._streetLights.push(spot);

          // 3. Warning Crossing Signs on sidewalks
          [-halfW - 2, halfW + 2].forEach(sideOffset => {
            const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), poleMat);
            signPole.position.set(isV ? cr.x : cr.x + sideOffset, 1.4, isV ? cr.z + sideOffset : cr.z);
            root.add(signPole);

            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath(); ctx.moveTo(64, 8); ctx.lineTo(120, 120); ctx.lineTo(8, 120); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 6; ctx.stroke();
            ctx.font = 'bold 42px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'center';
            ctx.fillText('🚶', 64, 85);

            const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
            signMesh.position.set(isV ? cr.x : cr.x + sideOffset, 2.7, isV ? cr.z + sideOffset : cr.z);
            if (isV) signMesh.rotation.y = Math.PI / 2;
            root.add(signMesh);
          });

          // 4. Spawn active animated crossing pedestrians
          const pedCount = cr.pedCount || (cr.hasElderly ? 2 : 3);
          for (let pIdx = 0; pIdx < pedCount; pIdx++) {
            const ped = _buildHuman();
            const startSide = pIdx % 2 === 0 ? 1 : -1;
            const pX = isV ? cr.x + (Math.random() - 0.5) * 3 : cr.x + startSide * (halfW + 1.0);
            const pZ = isV ? cr.z + startSide * (halfW + 1.0) : cr.z + (Math.random() - 0.5) * 3;
            ped.position.set(pX, 0, pZ);

            // Give evening pedestrians distinctive nighttime clothes
            const isReflective = pIdx === 0;
            const pedCol = isReflective ? 0xfef08a : (pIdx === 1 ? 0xe2e8f0 : 0x38bdf8);
            ped.traverse(ch => {
              if (ch.isMesh && ch.material) {
                ch.material = ch.material.clone();
                ch.material.color = new THREE.Color(pedCol);
                if (isReflective) ch.material.emissive = new THREE.Color(0x333311);
              }
            });

            // Crossing state
            const targetX = isV ? pX : cr.x - startSide * (halfW + 1.5);
            const targetZ = isV ? cr.z - startSide * (halfW + 1.5) : pZ;
            ped.userData = {
              aiState: 'crossing',
              state: 'crossing',
              t: Math.random() * 10,
              spd: 0.28 + Math.random() * 0.15,
              isV: !isV,
              dir: -startSide,
              crossTarget: { x: targetX, z: targetZ },
              crossRoadCenter: isV ? cr.z : cr.x,
              crossTargetDist: halfW + 1.5,
              side: startSide,
              destDist: 20,
              distTraveled: 0
            };

            root.add(ped);
            this.peds.push(ped);
            if (typeof PedestrianAI !== 'undefined') {
              const pedAI = new PedestrianAI(ped, this.trafficManager);
              pedAI.state = PED_STATE.CROSSING;
              pedAI.target = new THREE.Vector3(targetX, 0, targetZ);
              this.pedestrianAIs.push(pedAI);
              ped._pedAI = pedAI;
            }
          }
        });
      }

      _buildTollPlaza(cfg) {
        const root = this.scene;
        const tx = cfg.tollX || 0;
        const tz = cfg.tollZ || 60;
        
        // Canopy
        const canopyG = new THREE.BoxGeometry(28, 0.4, 8);
        const canopyM = new THREE.MeshLambertMaterial({ color: 0x3a7cb8 });
        const canopy = new THREE.Mesh(canopyG, canopyM);
        canopy.position.set(tx, 6.2, tz);
        root.add(canopy);
        
        // Canopy pillars
        [-12, -4, 4, 12].forEach(px => {
          const pillarG = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
          const pillarM = new THREE.MeshLambertMaterial({ color: 0x888888 });
          const pillar = new THREE.Mesh(pillarG, pillarM);
          pillar.position.set(tx + px, 3, tz);
          root.add(pillar);
        });
        
        // Toll booths (3 lanes)
        [-8, 0, 8].forEach((laneX, idx) => {
          const boothG = new THREE.BoxGeometry(3.5, 3.5, 4);
          const boothM = new THREE.MeshLambertMaterial({ color: idx === 0 ? 0x22aa44 : 0xddbb22 });
          const booth = new THREE.Mesh(boothG, boothM);
          booth.position.set(tx + laneX, 1.75, tz + 1);
          root.add(booth);
          this.obstacles.push({ mesh: booth, box: new THREE.Box3().setFromObject(booth) });
          
          // Lane sign
          const canvas = document.createElement('canvas');
          canvas.width = 256; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = idx === 0 ? '#22aa44' : '#ddbb22';
          ctx.fillRect(0, 0, 256, 128);
          ctx.font = 'bold 40px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText(idx === 0 ? '🏷️ FASTAG' : (idx === 1 ? '💵 CASH' : '💵 CASH'), 128, 80);
          const signG = new THREE.PlaneGeometry(3, 1.5);
          const signM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) });
          const sign = new THREE.Mesh(signG, signM);
          sign.position.set(tx + laneX, 5.8, tz - 1);
          root.add(sign);
          
          // Boom barrier (horizontal bar)
          const barrierG = new THREE.BoxGeometry(4.5, 0.15, 0.15);
          const barrierM = new THREE.MeshLambertMaterial({ color: 0xff2222 });
          const barrier = new THREE.Mesh(barrierG, barrierM);
          barrier.position.set(tx + laneX + 2.25, 2.5, tz - 2);
          root.add(barrier);
          if (!this._tollBarriers) this._tollBarriers = [];
          this._tollBarriers.push({ bar: barrier, pivotX: tx + laneX, open: false, angle: 0 });
        });
      }

      _buildBlindCorner(cfg) {
        const root = this.scene;
        const cx = cfg.cornerX || 30;
        const cz = cfg.cornerZ || 30;
        
        // Convex mirror on pole
        const poleG = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const poleM = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleG, poleM);
        pole.position.set(cx + 5, 1.5, cz);
        root.add(pole);
        
        // Mirror dome (slightly flattened sphere for convex mirror)
        const mirrorG = new THREE.SphereGeometry(0.7, 16, 12);
        const mirrorM = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, emissive: 0x222222 });
        const mirror = new THREE.Mesh(mirrorG, mirrorM);
        mirror.scale.set(1, 0.25, 1);
        mirror.position.set(cx + 5, 3.3, cz);
        mirror.rotation.x = -0.3;
        root.add(mirror);
        
        // Mirror frame ring
        const frameG = new THREE.TorusGeometry(0.72, 0.06, 8, 24);
        const frameM = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const frame = new THREE.Mesh(frameG, frameM);
        frame.position.copy(mirror.position);
        frame.rotation.x = mirror.rotation.x;
        root.add(frame);
        
        // Warning sign
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(64,4); ctx.lineTo(124,124); ctx.lineTo(4,124); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 6; ctx.stroke();
        ctx.font = 'bold 24px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'center';
        ctx.fillText('BLIND', 64, 60);
        ctx.fillText('CORNER', 64, 85);
        ctx.fillText('📯 HONK', 64, 110);
        const wSignG = new THREE.PlaneGeometry(1.2, 1.2);
        const wSignM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
        const wSign = new THREE.Mesh(wSignG, wSignM);
        wSign.position.set(cx + 6.5, 2.8, cz);
        root.add(wSign);
        
        // Guardrail along corner edge
        for (let i = 0; i < 6; i++) {
          const railG = new THREE.BoxGeometry(0.1, 1.2, 2);
          const railM = new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0xcc0000 : 0xffffff });
          const rail = new THREE.Mesh(railG, railM);
          rail.position.set(cx + 6 + i * 2, 0.6, cz - 2 - i * 1.5);
          root.add(rail);
        }
      }

      _buildCattleObstacle(cfg) {
        const root = this.scene;
        const cx = cfg.cattleX || 0;
        const cz = cfg.cattleZ || 30;
        
        // Try to use preloaded cow GLB
        if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['animal_cow']) {
          const cow = window.PRELOADED_MODELS['animal_cow'].scene.clone();
          cow.scale.setScalar(1.2);
          cow.position.set(cx + 2, 0, cz);
          cow.rotation.y = Math.PI * 0.3;
          root.add(cow);
          // Collision proxy
          const cowBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.4, 2.5),
            new THREE.MeshLambertMaterial({ visible: false })
          );
          cowBox.position.copy(cow.position);
          cowBox.position.y = 0.7;
          this.obstacles.push({ mesh: cowBox, box: new THREE.Box3().setFromObject(cowBox), isCow: true });
          
          // Cow wander AI
          if (!this._cattle) this._cattle = [];
          this._cattle.push({ mesh: cow, waitTimer: 20 + Math.random() * 15, moved: false, startZ: cz, targetZ: cz + 8 });
        } else {
          // Procedural fallback cow
          const cowGroup = new THREE.Group();
          cowGroup.position.set(cx + 2, 0, cz);
          const bodyG = new THREE.BoxGeometry(1.4, 0.9, 2.2);
          const bodyM = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
          const body = new THREE.Mesh(bodyG, bodyM); body.position.y = 0.9; cowGroup.add(body);
          const headG = new THREE.BoxGeometry(0.6, 0.6, 0.8);
          const head = new THREE.Mesh(headG, bodyM); head.position.set(0, 1.4, 1.2); cowGroup.add(head);
          // Legs
          [[-0.45,-0.8],[-0.45,0.6],[0.45,-0.8],[0.45,0.6]].forEach(([lx,lz]) => {
            const legG = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
            const leg = new THREE.Mesh(legG, bodyM); leg.position.set(lx, 0.4, lz); cowGroup.add(leg);
          });
          root.add(cowGroup);
          if (!this._cattle) this._cattle = [];
          this._cattle.push({ mesh: cowGroup, waitTimer: 20 + Math.random() * 15, moved: false, startZ: cz, targetZ: cz + 8 });
        }
        
        // Dog (if flag set)
        if (cfg.hasDog && window.PRELOADED_MODELS && window.PRELOADED_MODELS['animal_dog']) {
          const dog = window.PRELOADED_MODELS['animal_dog'].scene.clone();
          dog.scale.setScalar(0.8);
          dog.position.set(cx - 4, 0, cz + 5);
          dog.rotation.y = Math.PI * 0.7;
          root.add(dog);
        }
        
        // No-honk sign nearby
        const nh = this._addTrafficSign ? this._addTrafficSign(cx + 6, cz, 'NO_HONK', 0) : null;
      }

      _buildHospitalZone(cfg) {
        const root = this.scene;
        const hx = cfg.hospitalX || -20;
        const hz = cfg.hospitalZ || 0;
        
        // Main hospital building
        const buildG = new THREE.BoxGeometry(18, 12, 10);
        const buildM = new THREE.MeshLambertMaterial({ color: 0xfafafa });
        const build = new THREE.Mesh(buildG, buildM);
        build.position.set(hx, 6, hz);
        root.add(build);
        this.obstacles.push({ mesh: build, box: new THREE.Box3().setFromObject(build), isBuilding: true });
        
        // Red cross on facade
        const crossM = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 0.3), crossM);
        crossH.position.set(hx, 9, hz - 5.2);
        root.add(crossH);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 0.3), crossM);
        crossV.position.set(hx, 9, hz - 5.2);
        root.add(crossV);
        
        // Hospital signboard
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#003366';
        ctx.fillRect(0, 0, 512, 128);
        ctx.font = 'bold 36px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.fillText('🏥 CITY HOSPITAL', 256, 50);
        ctx.font = '24px Arial'; ctx.fillStyle = '#ffdd00';
        ctx.fillText('🔇 SILENCE ZONE — NO HONKING', 256, 95);
        const signG = new THREE.PlaneGeometry(8, 2);
        const signM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) });
        const sign = new THREE.Mesh(signG, signM);
        sign.position.set(hx, 11.5, hz - 5.2);
        root.add(sign);
        
        // Ambulance parked at entrance (use GLB if available)
        if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['ambulance']) {
          const amb = window.PRELOADED_MODELS['ambulance'].scene.clone();
          amb.scale.setScalar(1.0);
          amb.position.set(hx + 8, 0, hz - 2);
          amb.rotation.y = Math.PI / 2;
          root.add(amb);
        }
        
        // Silence zone road markings
        for (let i = -2; i <= 2; i++) {
          const canvas2 = document.createElement('canvas');
          canvas2.width = 256; canvas2.height = 256;
          const ctx2 = canvas2.getContext('2d');
          ctx2.fillStyle = 'rgba(255,255,255,0.9)';
          ctx2.beginPath(); ctx2.arc(128, 128, 120, 0, Math.PI * 2); ctx2.fill();
          ctx2.strokeStyle = '#cc0000'; ctx2.lineWidth = 12; ctx2.stroke();
          ctx2.font = 'bold 28px Arial'; ctx2.fillStyle = '#cc0000'; ctx2.textAlign = 'center';
          ctx2.fillText('NO', 128, 100);
          ctx2.fillText('HONKING', 128, 135);
          // Red slash through circle
          ctx2.strokeStyle = '#cc0000'; ctx2.lineWidth = 16;
          ctx2.beginPath(); ctx2.moveTo(20, 20); ctx2.lineTo(236, 236); ctx2.stroke();
          const markG = new THREE.PlaneGeometry(3, 3);
          const markM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas2), transparent: true });
          const mark = new THREE.Mesh(markG, markM);
          mark.rotation.x = -Math.PI / 2;
          mark.position.set(hx + i * 6, 0.03, hz - 8);
          root.add(mark);
        }
      }

      _buildFestivalScene(cfg) {
        const root = this.scene;
        const fx = cfg.festX || 0;
        const fz = cfg.festZ || 40;
        const isNight = cfg.isNight || false;
        
        // Grand entrance archway (toran)
        const archM = new THREE.MeshLambertMaterial({ color: 0xd4850a });
        // Left pillar
        const lPillarG = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        const lPillar = new THREE.Mesh(lPillarG, archM);
        lPillar.position.set(fx - 8, 4, fz);
        root.add(lPillar);
        // Right pillar
        const rPillar = lPillar.clone();
        rPillar.position.set(fx + 8, 4, fz);
        root.add(rPillar);
        // Arch beam
        const beamG = new THREE.BoxGeometry(18, 1.5, 1);
        const beam = new THREE.Mesh(beamG, archM);
        beam.position.set(fx, 8, fz);
        root.add(beam);
        
        // Marigold garland decorations
        const garlandM = new THREE.MeshLambertMaterial({ color: 0xff8c00, emissive: isNight ? 0x441100 : 0x000000 });
        for (let i = -7; i <= 7; i += 2) {
          const flowerG = new THREE.SphereGeometry(0.2, 6, 4);
          const flower = new THREE.Mesh(flowerG, garlandM);
          const t = (i + 7) / 14;
          flower.position.set(fx + i, 7.5 - Math.sin(t * Math.PI) * 1.5, fz);
          root.add(flower);
        }
        
        // Festival light strings
        if (cfg.hasFestivalLights) {
          const lightM = new THREE.MeshLambertMaterial({
            color: 0xffff44,
            emissive: 0xffaa00,
            emissiveIntensity: isNight ? 2.5 : 0.8
          });
          for (let i = -10; i <= 10; i += 4) {
            const bulbG = new THREE.SphereGeometry(0.15, 6, 4);
            const bulb = new THREE.Mesh(bulbG, lightM.clone());
            bulb.material.color.setHSL(i / 20 + 0.5, 1, 0.5);
            bulb.position.set(fx + i, 5, fz + 2);
            root.add(bulb);
            if (isNight) {
              const pLight = new THREE.PointLight(0xffaa00, 0.4, 8);
              pLight.position.copy(bulb.position);
              root.add(pLight);
            }
          }
        }
        
        // Music vehicle (decorated truck)
        if (cfg.hasMusicVehicle && window.PRELOADED_MODELS && window.PRELOADED_MODELS['truck']) {
          const truck = window.PRELOADED_MODELS['truck'].scene.clone();
          truck.scale.setScalar(0.9);
          truck.position.set(fx - 15, 0, fz + 5);
          truck.rotation.y = Math.PI / 2;
          // Paint it festive
          truck.traverse(c => { if (c.isMesh && c.material) { c.material = c.material.clone(); c.material.color.set(0xff4400); } });
          root.add(truck);
        }
        
        // Police volunteer
        if (cfg.hasPoliceVolunteer) {
          const volGroup = new THREE.Group();
          volGroup.position.set(fx, 0, fz - 8);
          const volBodyG = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 8);
          const volBodyM = new THREE.MeshLambertMaterial({ color: 0xaaff00 }); // fluorescent vest
          volGroup.add(new THREE.Mesh(volBodyG, volBodyM)).position.y = 0.75;
          const volHeadG = new THREE.SphereGeometry(0.2, 10, 8);
          const volHead = new THREE.Mesh(volHeadG, new THREE.MeshLambertMaterial({ color: 0xdeb887 }));
          volHead.position.y = 1.6;
          volGroup.add(volHead);
          // White cap
          const capG = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10);
          const cap = new THREE.Mesh(capG, new THREE.MeshLambertMaterial({ color: 0xffffff }));
          cap.position.y = 0.12;
          volHead.add(cap);
          root.add(volGroup);
          this._festivalVolunteer = volGroup;
        }
      }

      _buildHighwaySystem(cfg) {
        const root = this.scene;
        const hx = cfg.highwayX || 0;
        const hzStart = cfg.highwayZStart || 100;
        const hzEnd = cfg.highwayZEnd || 400;
        const lanes = 3;
        const laneWidth = 4;
        const totalWidth = lanes * laneWidth * 2; // bidirectional
        
        // On-ramp (acceleration lane)
        const rampG = new THREE.PlaneGeometry(6, 60);
        const rampM = new THREE.MeshLambertMaterial({ color: 0x333340 });
        const ramp = new THREE.Mesh(rampG, rampM);
        ramp.rotation.x = -Math.PI / 2;
        ramp.position.set(hx + totalWidth / 2 + 3, 0.01, hzStart + 30);
        root.add(ramp);
        
        // Main highway surface
        const hwG = new THREE.PlaneGeometry(totalWidth, hzEnd - hzStart);
        const hwM = new THREE.MeshLambertMaterial({ color: 0x2a2a35 });
        const hw = new THREE.Mesh(hwG, hwM);
        hw.rotation.x = -Math.PI / 2;
        hw.position.set(hx, 0.01, (hzStart + hzEnd) / 2);
        root.add(hw);
        
        // Lane markings
        for (let lane = -lanes + 1; lane < lanes; lane++) {
          for (let z = hzStart; z < hzEnd; z += 12) {
            const dashG = new THREE.PlaneGeometry(0.2, 6);
            const dashM = new THREE.MeshLambertMaterial({ color: lane === 0 ? 0xffff00 : 0xffffff });
            const dash = new THREE.Mesh(dashG, dashM);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(hx + lane * laneWidth, 0.02, z + 3);
            root.add(dash);
          }
        }
        
        // Overhead highway signs
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#004400';
        ctx.fillRect(0, 0, 512, 128);
        ctx.font = 'bold 40px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.fillText('← MUMBAI — PUNE →', 256, 75);
        const hwSignG = new THREE.PlaneGeometry(10, 2.5);
        const hwSignM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) });
        const hwSign = new THREE.Mesh(hwSignG, hwSignM);
        hwSign.position.set(hx, 7, hzStart + 20);
        root.add(hwSign);
        
        // Central median barrier
        const medianG = new THREE.BoxGeometry(0.6, 1.0, hzEnd - hzStart);
        const medianM = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const median = new THREE.Mesh(medianG, medianM);
        median.position.set(hx, 0.5, (hzStart + hzEnd) / 2);
        root.add(median);
        
        // Off-ramp
        const offrampG = new THREE.PlaneGeometry(6, 60);
        const offramp = new THREE.Mesh(offrampG, rampM);
        offramp.rotation.x = -Math.PI / 2;
        offramp.position.set(hx - totalWidth / 2 - 3, 0.01, hzEnd - 30);
        root.add(offramp);
        
        // Speed sign
        if (this._addTrafficSign) this._addTrafficSign(hx + totalWidth / 2 + 8, hzStart, 'SPEED_80', 0);
      }

      _buildParkingScenario(cfg) {
        const root = this.scene;
        const type = cfg.parkingType || 'street';
        const px = cfg.parkX || 15;
        const pz = cfg.parkZ || 0;
        
        const drawParkingBay = (x, z, rotY, legal, label) => {
          // Bay surface
          const bayG = new THREE.PlaneGeometry(3.2, 5.5);
          const bayM = new THREE.MeshLambertMaterial({ color: legal ? 0x1a3a6a : 0x4a0000 });
          const bay = new THREE.Mesh(bayG, bayM);
          bay.rotation.x = -Math.PI / 2;
          bay.rotation.z = rotY;
          bay.position.set(x, 0.02, z);
          root.add(bay);
          
          // Bay lines
          [-1.6, 1.6].forEach(side => {
            const lineG = new THREE.PlaneGeometry(0.1, 5.5);
            const lineM = new THREE.MeshLambertMaterial({ color: legal ? 0xffffff : 0xff2222 });
            const line = new THREE.Mesh(lineG, lineM);
            line.rotation.x = -Math.PI / 2;
            line.rotation.z = rotY;
            line.position.set(x + side * Math.cos(rotY), 0.03, z + side * Math.sin(rotY));
            root.add(line);
          });
          
          // P sign or No Parking sign
          const canvas = document.createElement('canvas');
          canvas.width = 128; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = legal ? '#1a3a6a' : '#cc0000';
          ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
          ctx.font = 'bold 72px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText(legal ? 'P' : '🚫', 64, 85);
          if (label) { ctx.font = 'bold 18px Arial'; ctx.fillText(label, 64, 118); }
          const signG = new THREE.PlaneGeometry(0.8, 0.8);
          const signM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
          const pSign = new THREE.Mesh(signG, signM);
          
          const poleG = new THREE.CylinderGeometry(0.03, 0.03, 2, 6);
          const poleM = new THREE.MeshLambertMaterial({ color: 0x888888 });
          const ppole = new THREE.Mesh(poleG, poleM);
          ppole.position.set(x + 1.8, 1, z - 2);
          root.add(ppole);
          pSign.position.set(0, 1.3, 0);
          ppole.add(pSign);
          
          if (legal) {
            // Register as parking zone
            if (!this._parkingZones) this._parkingZones = [];
            this._parkingZones.push({ x, z, width: 3.2, depth: 5.5, occupied: false });
          }
        };
        
        if (type === 'street') {
          // 2 legal spots, 3 illegal spots
          drawParkingBay(px, pz, 0, true, 'LEGAL');
          drawParkingBay(px, pz + 7, 0, true, 'LEGAL');
          drawParkingBay(px - 20, pz, 0, false, 'NO PARK');
          
        } else if (type === 'hospital') {
          // Legal spots far from hospital
          drawParkingBay(px + 25, pz, 0, true, 'VISITOR');
          drawParkingBay(px + 25, pz + 7, 0, true, 'VISITOR');
          // No-parking zone near hospital
          const canvas3 = document.createElement('canvas');
          canvas3.width = 512; canvas3.height = 128;
          const ctx3 = canvas3.getContext('2d');
          ctx3.fillStyle = '#cc0000';
          ctx3.fillRect(0, 0, 512, 128);
          ctx3.font = 'bold 32px Arial'; ctx3.fillStyle = '#fff'; ctx3.textAlign = 'center';
          ctx3.fillText('🚫 NO PARKING WITHIN 100m OF HOSPITAL', 256, 75);
          const noG = new THREE.PlaneGeometry(8, 2);
          const noM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas3) });
          const noSign = new THREE.Mesh(noG, noM);
          noSign.position.set(px, 3, pz - 5);
          root.add(noSign);
          
        } else if (type === 'residential') {
          // Residential gate
          const gateM = new THREE.MeshLambertMaterial({ color: 0x444444 });
          [-4, 4].forEach(side => {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), gateM);
            pillar.position.set(px + side, 2, pz - 8);
            root.add(pillar);
            this.obstacles.push({ mesh: pillar, box: new THREE.Box3().setFromObject(pillar) });
          });
          const gateBar = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 0.2), new THREE.MeshLambertMaterial({ color: 0xdd8800 }));
          gateBar.position.set(px, 3.5, pz - 8);
          root.add(gateBar);
          // Visitor parking inside
          drawParkingBay(px, pz + 5, 0, true, 'VISITOR');
          // Security cabin
          const cabinG = new THREE.BoxGeometry(2, 2.5, 2);
          const cabinM = new THREE.MeshLambertMaterial({ color: 0x8B8B6B });
          const cabin = new THREE.Mesh(cabinG, cabinM);
          cabin.position.set(px + 6, 1.25, pz - 8);
          root.add(cabin);
          
        } else if (type === 'commercial') {
          // Shopping area with fire hydrant no-park zone + legal spots
          drawParkingBay(px + 10, pz, 0, true, 'SHOPPING');
          drawParkingBay(px + 10, pz + 7, 0, true, 'SHOPPING');
          // Red curb zone (already has fire hydrant from _buildScene hasFire Hydrant)
          const redCurbG = new THREE.PlaneGeometry(12, 0.5);
          const redCurbM = new THREE.MeshLambertMaterial({ color: 0xff0000 });
          const redCurb = new THREE.Mesh(redCurbG, redCurbM);
          redCurb.rotation.x = -Math.PI / 2;
          redCurb.position.set(px - 5, 0.03, pz + 2);
          root.add(redCurb);
        }
      }

      _buildNarrowGully(cfg) {
        const root = this.scene;
        const gx = cfg.gullyX || 0;
        const gz = cfg.gullyZ || 20;
        const length = cfg.gullyLength || 80;
        
        // Parked vehicles on both sides blocking the lane
        const parkedTypes = ['car', 'auto'];
        const parkPositions = [-5, 15, 35, 55];
        parkPositions.forEach((zOff, i) => {
          const side = i % 2 === 0 ? -4 : 4;
          const vType = parkedTypes[i % 2];
          if (window.PRELOADED_MODELS && window.PRELOADED_MODELS[vType]) {
            const v = window.PRELOADED_MODELS[vType].scene.clone();
            v.scale.setScalar(0.85);
            v.position.set(gx + side, 0, gz + zOff);
            v.rotation.y = side > 0 ? Math.PI : 0;
            root.add(v);
          } else {
            // Fallback box
            const vG = new THREE.BoxGeometry(1.6, 1.4, 3.8);
            const vM = new THREE.MeshLambertMaterial({ color: [0x2244aa, 0xcc2222, 0x228844][i % 3] });
            const vMesh = new THREE.Mesh(vG, vM);
            vMesh.position.set(gx + side, 0.7, gz + zOff);
            root.add(vMesh);
          }
        });
        
        // Pull-over bays (widened cutouts)
        [20, 55].forEach(zOff => {
          const bayG = new THREE.PlaneGeometry(3, 8);
          const bayM = new THREE.MeshLambertMaterial({ color: 0x555566 });
          const bay = new THREE.Mesh(bayG, bayM);
          bay.rotation.x = -Math.PI / 2;
          bay.position.set(gx - 5, 0.015, gz + zOff);
          root.add(bay);
          // Pull-over sign
          const poleG = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6);
          const ppole = new THREE.Mesh(poleG, new THREE.MeshLambertMaterial({ color: 0x888888 }));
          ppole.position.set(gx - 7, 1.25, gz + zOff);
          root.add(ppole);
          const canvas = document.createElement('canvas');
          canvas.width = 128; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#00aaff'; ctx.fillRect(0, 0, 128, 128);
          ctx.font = 'bold 20px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText('PULL', 64, 55); ctx.fillText('OVER', 64, 80); ctx.fillText('BAY', 64, 105);
          const sG = new THREE.PlaneGeometry(0.8, 0.8);
          const sM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) });
          const s = new THREE.Mesh(sG, sM);
          s.position.set(0, 1.5, 0); ppole.add(s);
        });
      }

      _buildLibrary(cfg) {
        const root = this.scene;
        const lx = cfg.libraryX || -18;
        const lz = cfg.libraryZ || 0;
        
        // Library building
        const libG = new THREE.BoxGeometry(14, 8, 8);
        const libM = new THREE.MeshLambertMaterial({ color: 0xc8b8a2 }); // stone color
        const lib = new THREE.Mesh(libG, libM);
        lib.position.set(lx, 4, lz);
        root.add(lib);
        this.obstacles.push({ mesh: lib, box: new THREE.Box3().setFromObject(lib), isBuilding: true });
        
        // Arched entrance
        const archG = new THREE.TorusGeometry(1.5, 0.4, 8, 16, Math.PI);
        const archM = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const arch = new THREE.Mesh(archG, archM);
        arch.position.set(lx, 3, lz - 4.2);
        root.add(arch);
        
        // Library signboard
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(0, 0, 512, 128);
        ctx.font = 'bold 40px Arial'; ctx.fillStyle = '#f5d485'; ctx.textAlign = 'center';
        ctx.fillText('📚 PUBLIC LIBRARY', 256, 55);
        ctx.font = '24px Arial'; ctx.fillStyle = '#ff8888';
        ctx.fillText('🔇 SILENCE ZONE — NO HONKING', 256, 95);
        const sG = new THREE.PlaneGeometry(6, 1.5);
        const sM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) });
        const s = new THREE.Mesh(sG, sM);
        s.position.set(lx, 7.5, lz - 4.2);
        root.add(s);
      }

      _buildAmbulanceScenario(cfg) {
        const root = this.scene;
        const ambX = cfg.ambX || 0;
        const ambZ = cfg.ambZ || -40;
        
        const ambGroup = new THREE.Group();
        ambGroup.position.set(ambX, 0, ambZ);
        
        let ambMesh;
        if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['ambulance']) {
          ambMesh = window.PRELOADED_MODELS['ambulance'].scene.clone();
          ambMesh.scale.setScalar(1.0);
          ambGroup.add(ambMesh);
        } else if (window.IndianVehicles && window.IndianVehicles.ambulance) {
          ambMesh = window.IndianVehicles.ambulance();
          ambGroup.add(ambMesh);
        } else {
          const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 4.8), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }));
          body.position.y = 1.1;
          ambGroup.add(body);
        }
        
        const strobeG = new THREE.BoxGeometry(1.2, 0.2, 0.4);
        const strobeM = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 });
        const strobe = new THREE.Mesh(strobeG, strobeM);
        strobe.position.set(0, 2.3, 0.4);
        ambGroup.add(strobe);
        
        const redLight = new THREE.PointLight(0xff0000, 2.0, 15);
        redLight.position.set(-0.5, 2.5, 0.4);
        ambGroup.add(redLight);
        const blueLight = new THREE.PointLight(0x0044ff, 2.0, 15);
        blueLight.position.set(0.5, 2.5, 0.4);
        ambGroup.add(blueLight);
        
        root.add(ambGroup);
        
        this._activeAmbulance = {
          group: ambGroup,
          strobeMesh: strobe,
          redLight: redLight,
          blueLight: blueLight,
          speed: cfg.isHighway ? 25.0 : (cfg.isNarrowStreet ? 6.0 : 12.0),
          delay: cfg.ambulanceDelay || 5,
          active: true,
          strobeTimer: 0
        };
      }

      _buildHillTerrain(cfg) {
        const root = this.scene;
        const hx = cfg.hillX || 0;
        const hz = cfg.hillZ || 0;
        
        const mtnMat = new THREE.MeshLambertMaterial({ color: 0x4a5d3f });
        for (let i = -4; i <= 4; i++) {
          const coneG = new THREE.ConeGeometry(40 + Math.abs(i) * 10, 60 + Math.random() * 30, 8);
          const cone = new THREE.Mesh(coneG, mtnMat);
          cone.position.set(hx + i * 55, 20, hz - 120 + Math.sin(i) * 30);
          root.add(cone);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(64,4); ctx.lineTo(124,124); ctx.lineTo(4,124); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 8; ctx.stroke();
        ctx.font = 'bold 20px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'center';
        ctx.fillText('STEEP', 64, 60);
        ctx.fillText('HILL', 64, 82);
        ctx.fillText('LOW GEAR', 64, 105);
        const signG = new THREE.PlaneGeometry(1.4, 1.4);
        const signM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
        const sign = new THREE.Mesh(signG, signM);
        sign.position.set(hx + 8, 2.5, hz - 15);
        root.add(sign);
        
        for (let z = -60; z <= 60; z += 6) {
          const rail = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.9, 5.5),
            new THREE.MeshLambertMaterial({ color: 0xeeeeee })
          );
          rail.position.set(hx + 7.5, 0.45, hz + z);
          root.add(rail);
        }
      }

      _buildRuralRoad(cfg) {
        const root = this.scene;
        const rx = cfg.ruralX || 0;
        const rz = cfg.ruralZ || 0;
        
        const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const dirtRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 200), dirtMat);
        dirtRoad.rotation.x = -Math.PI / 2;
        dirtRoad.position.set(rx, 0.015, rz);
        root.add(dirtRoad);
        
        for (let i = -6; i <= 6; i++) {
          const potG = new THREE.CircleGeometry(0.8 + Math.random() * 0.6, 8);
          const potM = new THREE.MeshLambertMaterial({ color: 0x5a4a35 });
          const pothole = new THREE.Mesh(potG, potM);
          pothole.rotation.x = -Math.PI / 2;
          pothole.position.set(rx + (Math.random() - 0.5) * 6, 0.02, rz + i * 15 + (Math.random() - 0.5) * 5);
          root.add(pothole);
        }
        
        [-14, 14].forEach((side) => {
          for (let z = -40; z <= 40; z += 35) {
            const hutG = new THREE.Group();
            hutG.position.set(rx + side, 0, rz + z);
            const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), new THREE.MeshLambertMaterial({ color: 0xc89d6c }));
            wall.position.y = 1.5; hutG.add(wall);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), new THREE.MeshLambertMaterial({ color: 0x9b763a }));
            roof.position.y = 4.2; roof.rotation.y = Math.PI / 4; hutG.add(roof);
            root.add(hutG);
            this.obstacles.push({ mesh: wall, box: new THREE.Box3().setFromObject(wall), isBuilding: true });
          }
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffaa00'; ctx.fillRect(0, 0, 256, 128);
        ctx.font = 'bold 30px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'center';
        ctx.fillText('🌾 VILLAGE ROAD', 128, 55);
        ctx.font = '22px Arial';
        ctx.fillText('MAX 25 KM/H', 128, 95);
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(3, 1.5),
          new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) })
        );
        sign.position.set(rx + 8, 2.5, rz - 30);
        root.add(sign);
      }

      _buildOneWayStreet(cfg) {
        const root = this.scene;
        const ox = cfg.oneWayX || 0;
        const oz = cfg.oneWayZ || 0;
        
        for (let z = -50; z <= 50; z += 25) {
          const arrowCanvas = document.createElement('canvas');
          arrowCanvas.width = 128; arrowCanvas.height = 256;
          const ctx = arrowCanvas.getContext('2d');
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath();
          ctx.moveTo(64, 20); ctx.lineTo(110, 100); ctx.lineTo(80, 100);
          ctx.lineTo(80, 230); ctx.lineTo(48, 230); ctx.lineTo(48, 100);
          ctx.lineTo(18, 100); ctx.closePath(); ctx.fill();
          const arrowM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(arrowCanvas), transparent: true });
          const arrow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.0), arrowM);
          arrow.rotation.x = -Math.PI / 2;
          arrow.position.set(ox, 0.025, oz + z);
          root.add(arrow);
        }
        
        [-8, 8].forEach(side => {
          const canvas = document.createElement('canvas');
          canvas.width = 256; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0044aa'; ctx.fillRect(0, 0, 256, 128);
          ctx.font = 'bold 36px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
          ctx.fillText('ONE WAY ➔', 128, 75);
          const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(2.5, 1.25),
            new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) })
          );
          sign.position.set(ox + side, 2.5, oz - 40);
          root.add(sign);
        });
      }

      _buildSignRecognition(cfg) {
        const root = this.scene;
        const sx = cfg.signX || 0;
        const sz = cfg.signZ || 10;
        
        const manCanvas = document.createElement('canvas');
        manCanvas.width = 128; manCanvas.height = 128;
        const ctx1 = manCanvas.getContext('2d');
        ctx1.fillStyle = '#0055cc'; ctx1.beginPath(); ctx1.arc(64, 64, 60, 0, Math.PI*2); ctx1.fill();
        ctx1.strokeStyle = '#ffffff'; ctx1.lineWidth = 6; ctx1.stroke();
        ctx1.fillStyle = '#ffffff'; ctx1.font = 'bold 44px Arial'; ctx1.textAlign = 'center';
        ctx1.fillText('⬅', 64, 80);
        const manSign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(manCanvas), transparent: true }));
        manSign.position.set(sx - 8, 2.5, sz - 20); root.add(manSign);
        
        const cauCanvas = document.createElement('canvas');
        cauCanvas.width = 128; cauCanvas.height = 128;
        const ctx2 = cauCanvas.getContext('2d');
        ctx2.fillStyle = '#ffffff'; ctx2.beginPath(); ctx2.moveTo(64,4); ctx2.lineTo(124,124); ctx2.lineTo(4,124); ctx2.closePath(); ctx2.fill();
        ctx2.strokeStyle = '#cc0000'; ctx2.lineWidth = 8; ctx2.stroke();
        ctx2.fillStyle = '#000'; ctx2.font = 'bold 36px Arial'; ctx2.textAlign = 'center';
        ctx2.fillText('⚠', 64, 90);
        const cauSign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cauCanvas), transparent: true }));
        cauSign.position.set(sx + 8, 2.5, sz); root.add(cauSign);
        
        const infoCanvas = document.createElement('canvas');
        infoCanvas.width = 256; infoCanvas.height = 128;
        const ctx3 = infoCanvas.getContext('2d');
        ctx3.fillStyle = '#008844'; ctx3.fillRect(0, 0, 256, 128);
        ctx3.strokeStyle = '#ffffff'; ctx3.lineWidth = 6; ctx3.strokeRect(4,4,248,120);
        ctx3.fillStyle = '#ffffff'; ctx3.font = 'bold 28px Arial'; ctx3.textAlign = 'center';
        ctx3.fillText('CITY CENTER', 128, 55);
        ctx3.font = '20px Arial'; ctx3.fillText('2.5 KM ➔', 128, 90);
        const infoSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(infoCanvas) }));
        infoSign.position.set(sx - 8, 2.5, sz + 20); root.add(infoSign);
      }

      _buildConstructionMaze(cfg) {
        const root = this.scene;
        const cx = cfg.constX || 0;
        const cz = cfg.constZ || 30;
        
        const barMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        const offsets = [
          { x: -3, z: 0, rot: 0.2 },
          { x: 3, z: 15, rot: -0.2 },
          { x: -2, z: 30, rot: 0.15 },
          { x: 2, z: 45, rot: -0.15 }
        ];
        
        offsets.forEach((o, idx) => {
          const barG = new THREE.Group();
          barG.position.set(cx + o.x, 0, cz + o.z);
          barG.rotation.y = o.rot;
          
          const body = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.2, 0.6), idx % 2 === 0 ? barMat : whiteMat);
          body.position.y = 0.6; barG.add(body);
          
          const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 1.5 }));
          beacon.position.set(0, 1.35, 0); barG.add(beacon);
          
          root.add(barG);
          this.obstacles.push({ mesh: body, box: new THREE.Box3().setFromObject(body) });
        });
        
        if (cfg.hasFlagman) {
          const flagman = new THREE.Group();
          flagman.position.set(cx + 6, 0, cz - 10);
          
          const fBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.9, 8), new THREE.MeshLambertMaterial({ color: 0xff8800 }));
          fBody.position.y = 0.75; flagman.add(fBody);
          const fHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xdeb887 }));
          fHead.position.y = 1.6; flagman.add(fHead);
          const hat = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffdd00 }));
          hat.position.y = 1.7; hat.scale.set(1, 0.5, 1); flagman.add(hat);
          
          const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
          stick.position.set(-0.3, 1.2, 0.4); stick.rotation.z = 0.4; flagman.add(stick);
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshLambertMaterial({ color: 0xcc0000, side: THREE.DoubleSide }));
          flag.position.set(-0.55, 1.55, 0.4); flagman.add(flag);
          
          root.add(flagman);
          this._flagman = { group: flagman, stick: stick, flag: flag };
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff6600'; ctx.fillRect(0, 0, 256, 128);
        ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.fillText('🚧 ROAD WORK', 128, 50);
        ctx.fillText('DETOUR AHEAD', 128, 90);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.5), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sign.position.set(cx - 7, 2.5, cz - 15);
        root.add(sign);
      }

      _buildGarage(gx, gz, rotY, roadWidth, sidewalkWidth) {
        if (!this.scene) return;
        const gGrp = new THREE.Group();

        const floorMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Polished dark industrial concrete
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xb45309 }); // Warm industrial brick
        const steelMat = new THREE.MeshLambertMaterial({ color: 0x334155 }); // Industrial steel
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x475569 }); // Corrugated steel roof
        const liftMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Hydraulic blue
        const accentMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 }); // Safety yellow
        const redToolMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 }); // Tool chest red
        const drumGreenMat = new THREE.MeshLambertMaterial({ color: 0x15803d }); // Castrol green
        const drumOrangeMat = new THREE.MeshLambertMaterial({ color: 0xea580c }); // Gulf orange

        const gW = 12.0; // Wide 2-bay workshop width
        const gD = 14.0; // Depth
        const gH = 5.5;  // Height

        // 1. Concrete Workshop Floor & Driveway Apron
        const floor = new THREE.Mesh(new THREE.BoxGeometry(gW, 0.12, gD), floorMat);
        floor.position.set(0, 0.06, 0);
        gGrp.add(floor);

        // Driveway ramp connecting garage bay across sidewalk to road asphalt
        const rampL = (sidewalkWidth || 4.0) + 2.5;
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(gW - 0.4, 0.08, rampL), floorMat);
        ramp.position.set(0, 0.04, gD / 2 + rampL / 2);
        gGrp.add(ramp);

        // Yellow safety hazard stripes at bay entrance
        const entranceStripe = new THREE.Mesh(new THREE.BoxGeometry(gW, 0.14, 0.4), accentMat);
        entranceStripe.position.set(0, 0.07, gD / 2);
        gGrp.add(entranceStripe);

        // 2. Structural Steel I-Beam Columns (4 corners & center)
        const colPositions = [
          [-gW / 2 + 0.3, -gD / 2 + 0.3],
          [gW / 2 - 0.3, -gD / 2 + 0.3],
          [-gW / 2 + 0.3, gD / 2 - 0.3],
          [gW / 2 - 0.3, gD / 2 - 0.3]
        ];
        colPositions.forEach(([cx, cz]) => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, gH, 0.5), steelMat);
          col.position.set(cx, gH / 2, cz);
          gGrp.add(col);
        });

        // 3. Walls: Solid Back Brick Wall & Half-Glass Side Walls
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(gW, gH, 0.4), wallMat);
        backWall.position.set(0, gH / 2, -gD / 2 + 0.2);
        gGrp.add(backWall);

        [-gW / 2 + 0.2, gW / 2 - 0.2].forEach(wx => {
          // Brick base side wall
          const sideWallBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, gD), wallMat);
          sideWallBase.position.set(wx, 1.1, 0);
          gGrp.add(sideWallBase);
          // Industrial glass windows upper section
          const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, gH - 2.4, gD - 1.2), new THREE.MeshToonMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 }));
          sideGlass.position.set(wx, 2.2 + (gH - 2.4) / 2, 0);
          gGrp.add(sideGlass);
        });

        // 4. Sloped Industrial Workshop Roof & Steel Trusses
        const roof = new THREE.Mesh(new THREE.BoxGeometry(gW + 1.2, 0.35, gD + 1.6), roofMat);
        roof.position.set(0, gH + 0.2, 0.4);
        roof.rotation.x = -0.04;
        gGrp.add(roof);

        // Front Fascia Overhang
        const fascia = new THREE.Mesh(new THREE.BoxGeometry(gW + 1.4, 1.4, 0.5), steelMat);
        fascia.position.set(0, gH + 0.3, gD / 2 + 0.4);
        gGrp.add(fascia);

        // 5. High-DPI Glowing Neon / LED Signboard
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 512; sCanvas.height = 128;
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#0f172a'; sCtx.fillRect(0, 0, 512, 128);
        sCtx.lineWidth = 6; sCtx.strokeStyle = '#facc15'; sCtx.strokeRect(4, 4, 504, 120);
        sCtx.fillStyle = '#facc15'; sCtx.font = 'bold 34px sans-serif'; sCtx.textAlign = 'center';
        sCtx.fillText('⚡ MUMBAI SPEED MOTORS ⚡', 256, 48);
        sCtx.fillStyle = '#38bdf8'; sCtx.font = 'bold 22px sans-serif';
        sCtx.fillText('🔧 24x7 AUTO WORKSHOP & SERVICE 🚗', 256, 92);
        const signTex = new THREE.CanvasTexture(sCanvas);
        const signMesh = new THREE.Mesh(new THREE.BoxGeometry(gW - 1.5, 1.2, 0.1), new THREE.MeshBasicMaterial({ map: signTex }));
        signMesh.position.set(0, gH + 0.3, gD / 2 + 0.68);
        gGrp.add(signMesh);

        // 6. Hydraulic 2-Post Vehicle Lift (Left Service Bay)
        const liftX = -3.2, liftZ = -1.5;
        [-1.7, 1.7].forEach(lx => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 0.4), liftMat);
          post.position.set(liftX + lx, 1.9, liftZ);
          gGrp.add(post);
          const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), accentMat);
          basePlate.position.set(liftX + lx, 0.05, liftZ);
          gGrp.add(basePlate);
        });
        const liftArmL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 2.6), accentMat);
        liftArmL.position.set(liftX - 1.4, 0.8, liftZ);
        gGrp.add(liftArmL);
        const liftArmR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 2.6), accentMat);
        liftArmR.position.set(liftX + 1.4, 0.8, liftZ);
        gGrp.add(liftArmR);

        // 7. Professional Red Mechanic Tool Cabinet & Workbench (Back Wall)
        const toolChest = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.9), redToolMat);
        toolChest.position.set(2.8, 0.8, -gD / 2 + 1.0);
        gGrp.add(toolChest);
        // Chrome handles
        for (let dr = 0; dr < 4; dr++) {
          const handle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
          handle.position.set(2.8, 0.35 + dr * 0.35, -gD / 2 + 1.48);
          gGrp.add(handle);
        }

        // Heavy Wooden / Steel Workbench
        const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 1.0), new THREE.MeshLambertMaterial({ color: 0x78350f }));
        bench.position.set(-1.5, 0.55, -gD / 2 + 1.0);
        gGrp.add(bench);
        // Bench Vise
        const vise = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), steelMat);
        vise.position.set(-2.6, 1.25, -gD / 2 + 1.0);
        gGrp.add(vise);
        // Diagnostic Monitor
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        mon.position.set(-1.2, 1.4, -gD / 2 + 0.8);
        gGrp.add(mon);

        // 8. Stacks of 55-Gallon Oil Drums & Lubricant Barrels
        const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12);
        const drum1 = new THREE.Mesh(drumGeo, drumGreenMat);
        drum1.position.set(4.8, 0.55, -gD / 2 + 1.2);
        gGrp.add(drum1);
        const drum2 = new THREE.Mesh(drumGeo, drumOrangeMat);
        drum2.position.set(4.8, 0.55, -gD / 2 + 2.3);
        gGrp.add(drum2);
        const drum3 = new THREE.Mesh(drumGeo, drumGreenMat);
        drum3.position.set(4.8, 1.65, -gD / 2 + 1.7);
        gGrp.add(drum3);

        // 9. Steel Tire Rack with Spare Tires
        const rackX = 4.8, rackZ = 1.0;
        const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 3.2), steelMat);
        rackFrame.position.set(rackX, 1.4, rackZ);
        gGrp.add(rackFrame);
        for (let tr = 0; tr < 3; tr++) {
          const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12), new THREE.MeshLambertMaterial({ color: 0x111827 }));
          tire.rotation.x = Math.PI / 2;
          tire.position.set(rackX, 0.6 + tr * 0.9, rackZ - 0.8 + tr * 0.8);
          gGrp.add(tire);
        }

        // 10. Overhead Warm Workshop Lighting Fixtures
        [-2.5, 2.5].forEach(lx => {
          const lightBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.3), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
          lightBar.position.set(lx, gH - 0.3, 0);
          gGrp.add(lightBar);
        });

        // 11. Obstacles for walls and equipment so player doesn't drive through back walls
        const obsBack = new THREE.Group();
        obsBack.position.set(0, 0, -gD / 2);
        obsBack.userData = { halfW: gW / 2, halfD: 1.2, isObstacle: true, isBuilding: true };
        gGrp.add(obsBack);
        this.obstacles.push(obsBack);

        [-gW / 2, gW / 2].forEach(sx => {
          const obsSide = new THREE.Group();
          obsSide.position.set(sx, 0, 0);
          obsSide.userData = { halfW: 0.6, halfD: gD / 2, isObstacle: true, isBuilding: true };
          gGrp.add(obsSide);
          this.obstacles.push(obsSide);
        });

        gGrp.position.set(gx, 0, gz);
        gGrp.rotation.y = rotY;

        this.scene.add(gGrp);
        this.world.push(gGrp);
      }

      // ─── 3D Visual Barriers for Road Terminations & Restricted Boundaries ───
      _buildBarriers(cfg, roadWidth) {
        if (!this.scene) return;
        const allRoads = (cfg && cfg.roads) || [];
        if (allRoads.length === 0) return;

        // Create procedural crisp high-contrast hazard chevron canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fbbf24'; // Bright caution yellow
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#ffffff'; // White reflective border stripes
        ctx.fillRect(0, 0, 256, 12);
        ctx.fillRect(0, 116, 256, 12);
        ctx.fillStyle = '#0f172a'; // Deep carbon slate hazard stripes
        for (let x = -128; x < 384; x += 36) {
          ctx.beginPath();
          ctx.moveTo(x, 12);
          ctx.lineTo(x + 28, 116);
          ctx.lineTo(x + 48, 116);
          ctx.lineTo(x + 20, 12);
          ctx.fill();
        }
        const hazardTex = new THREE.CanvasTexture(canvas);
        hazardTex.wrapS = hazardTex.wrapT = THREE.RepeatWrapping;
        hazardTex.repeat.set(4, 1);

        // Signboard texture ("ROAD CLOSED / ⛔ DO NOT ENTER")
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 256; sCanvas.height = 128;
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#dc2626';
        sCtx.fillRect(0, 0, 256, 128);
        sCtx.lineWidth = 8;
        sCtx.strokeStyle = '#ffffff';
        sCtx.strokeRect(6, 6, 244, 116);
        sCtx.fillStyle = '#ffffff';
        sCtx.font = 'bold 32px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText('ROAD CLOSED', 128, 45);
        sCtx.font = 'bold 22px sans-serif';
        sCtx.fillText('⛔ DO NOT ENTER', 128, 88);
        const signTex = new THREE.CanvasTexture(sCanvas);

        const barrierMat = new THREE.MeshLambertMaterial({ map: hazardTex });
        const concreteBaseMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const postMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const signMat = new THREE.MeshLambertMaterial({ map: signTex });

        // Helper to spawn a high-visibility physical 3D Jersey barrier + sign unit
        const createJerseyBarrier = (x, z, rotY, width) => {
          const bg = new THREE.Group();
          
          // Heavy concrete footing base
          const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.9), concreteBaseMat);
          base.position.y = 0.22;
          bg.add(base);

          // Sloped striped barricade body
          const body = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.75, 0.55), barrierMat);
          body.position.y = 0.75;
          bg.add(body);

          // Reflective "ROAD CLOSED" signboard mounted in center
          const signP1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), postMat);
          signP1.position.set(-0.8, 1.3, 0); bg.add(signP1);
          const signP2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), postMat);
          signP2.position.set(0.8, 1.3, 0); bg.add(signP2);
          const signPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.08), signMat);
          signPlate.position.set(0, 1.6, 0.05); bg.add(signPlate);

          // Top flashing hazard beacons
          const numBeacons = Math.max(2, Math.floor(width / 4));
          for (let b = 0; b < numBeacons; b++) {
            const bx = -width / 2 + (b + 0.5) * (width / numBeacons);
            const beaconHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), postMat);
            beaconHousing.position.set(bx, 1.2, 0); bg.add(beaconHousing);
            const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), beaconMat);
            beacon.position.set(bx, 1.35, 0); bg.add(beacon);
          }

          bg.position.set(x, 0, z);
          bg.rotation.y = rotY;

          // Set accurate physical collision bounding box
          const isAlignedX = Math.abs(rotY) < 0.1 || Math.abs(rotY - Math.PI) < 0.1;
          bg.userData = {
            halfW: isAlignedX ? width / 2 : 0.85,
            halfD: isAlignedX ? 0.85 : width / 2,
            isBarrier: true,
            isObstacle: true
          };

          this.scene.add(bg);
          this.obstacles.push(bg);
          this.world.push(bg);
        };

        // Helper to check if a point on road intersects another perpendicular road
        const isIntersectionConnected = (road, pCoord, isStart) => {
          const isV = road.type === 'v';
          const px = isV ? road.x : pCoord;
          const pz = isV ? pCoord : road.z;

          return allRoads.some(other => {
            if (other === road) return false;
            if (isV && other.type === 'h') {
              const xMin = Math.min(other.x1, other.x2) - 8;
              const xMax = Math.max(other.x1, other.x2) + 8;
              return Math.abs(other.z - pz) <= 14 && px >= xMin && px <= xMax;
            } else if (!isV && other.type === 'v') {
              const zMin = Math.min(other.z1, other.z2) - 8;
              const zMax = Math.max(other.z1, other.z2) + 8;
              return Math.abs(other.x - px) <= 14 && pz >= zMin && pz <= zMax;
            }
            return false;
          });
        };

        // Place physical textured barriers at every dead end, road terminus, and outer map boundary
        allRoads.forEach(r => {
          const isV = r.type === 'v';
          const rWidth = r.width || roadWidth || 14;
          const barrierW = rWidth + 4;

          if (isV) {
            const zMin = Math.min(r.z1, r.z2);
            const zMax = Math.max(r.z1, r.z2);

            // Min-Z terminus (North boundary / dead-end)
            if (!isIntersectionConnected(r, zMin, true)) {
              createJerseyBarrier(r.x, zMin + 2.5, 0, barrierW);
            }
            // Max-Z terminus (South boundary / dead-end)
            if (!isIntersectionConnected(r, zMax, false)) {
              createJerseyBarrier(r.x, zMax - 2.5, 0, barrierW);
            }
          } else {
            const xMin = Math.min(r.x1, r.x2);
            const xMax = Math.max(r.x1, r.x2);

            // Min-X terminus (West boundary / dead-end)
            if (!isIntersectionConnected(r, xMin, true)) {
              createJerseyBarrier(xMin + 2.5, r.z, Math.PI / 2, barrierW);
            }
            // Max-X terminus (East boundary / dead-end)
            if (!isIntersectionConnected(r, xMax, false)) {
              createJerseyBarrier(xMax - 2.5, r.z, Math.PI / 2, barrierW);
            }
          }
        });
      }

      _buildBuildingsFromGraph() {
        const graph = this.roadGraph;
        const cfg = this.mapCfg;
        if (!graph || !graph.buildingSlots?.length) return;

        const bMats = [
          // Warm creams and tans
          new THREE.MeshToonMaterial({ color: 0xf5e6d3, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xe8d5b7, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xd4b896, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xc9a87a, gradientMap: window._toonGrad }),
          // Warm pinks and reds (Mumbai chawl colours)
          new THREE.MeshToonMaterial({ color: 0xe8b4a0, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xd4907a, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xc47c6a, gradientMap: window._toonGrad }),
          // Muted blues and greens (government buildings)
          new THREE.MeshToonMaterial({ color: 0xb8c8d8, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0x9ab0c0, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xa8c8a8, gradientMap: window._toonGrad }),
          // Yellows and ochres (South Mumbai heritage)
          new THREE.MeshToonMaterial({ color: 0xf0d878, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xe8c850, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xd8b840, gradientMap: window._toonGrad }),
          // Dark urban concrete
          new THREE.MeshToonMaterial({ color: 0x9a9a8a, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0x8a8878, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0x7a7868, gradientMap: window._toonGrad })
        ];
        const roofColors = [0x8B4513, 0x2d5016, 0x1a3a5c, 0x6b3a2a, 0x4a4a4a, 0xb8860b, 0x3a6b3a, 0x8b1a1a];
        const winMat = new THREE.MeshBasicMaterial({ color: 0x304050 });


        const instancedData = {};
        const modelKeys = window.PRELOADED_MODELS 
          ? Object.keys(window.PRELOADED_MODELS).filter(k => 
              k.startsWith('suburban_') || k.startsWith('industrial_') || k.startsWith('mbuilding_')
            )
          : [];

        // Building type selection based on zone
        const getBldgType = (zone, distFromCenter) => {
          const rnd = Math.random();
          if (zone === 'Commercial') {
            if (distFromCenter < 200 && rnd > 0.8) return 'skyscraper';
            if (distFromCenter < 400 && rnd > 0.6) return 'tower';
            if (rnd > 0.7) return 'skyscraper';
            if (rnd > 0.45) return 'shop';
            if (rnd > 0.25) return 'bank';
            return 'hospital';
          } else if (zone === 'Industrial') {
            if (rnd > 0.8) return 'warehouse';
            if (rnd > 0.5) return 'factory';
            return 'industrial';
          } else if (zone === 'Residential') {
            if (distFromCenter < 300 && rnd > 0.7) return 'apartment';
            if (rnd > 0.7) return 'apartment';
            if (rnd > 0.5) return 'house';
            return 'chawl';
          } else if (zone === 'Slums') {
            return rnd > 0.2 ? 'chawl' : 'shack';
          } else if (zone === 'Civic') {
            if (rnd > 0.7) return 'school';
            if (rnd > 0.4) return 'hospital';
            return 'police';
          }
          return 'house';
        };

        const typeMap = {
          'skyscraper': ['mbuilding_sample-tower', 'industrial_q', 'industrial_r', 'industrial_t'],
          'tower': ['mbuilding_sample-tower', 'industrial_l', 'industrial_m', 'industrial_n'],
          'apartment': ['mbuilding_sample-house', 'suburban_l', 'suburban_m', 'suburban_n', 'suburban_o', 'suburban_p'],
          'shop': ['suburban_d', 'suburban_e', 'suburban_f', 'suburban_g', 'suburban_h'],
          'bank': ['mbuilding_sample-house-a', 'mbuilding_sample-house-b', 'suburban_i', 'suburban_j'],
          'hospital': ['mbuilding_sample-house-c', 'suburban_k', 'suburban_l'],
          'school': ['mbuilding_sample-house-a', 'suburban_m', 'suburban_n'],
          'police': ['suburban_p', 'suburban_q', 'suburban_r'],
          'warehouse': ['industrial_a', 'industrial_b', 'industrial_c', 'industrial_d', 'industrial_l'],
          'factory': ['industrial_e', 'industrial_f', 'industrial_g', 'industrial_h', 'industrial_i', 'industrial_j'],
          'industrial': ['industrial_a', 'industrial_b', 'industrial_c', 'industrial_d', 'industrial_e'],
          'house': ['suburban_a', 'suburban_b', 'suburban_c', 'suburban_d', 'suburban_e'],
          'chawl': ['suburban_f', 'suburban_g', 'suburban_h', 'suburban_i', 'suburban_j'],
          'shack': ['suburban_a', 'suburban_b']
        };

        const pickModel = (prefixes) => {
          if (!modelKeys.length) return null;
          const candidates = modelKeys.filter(k => prefixes.some(p => k.startsWith(p)));
          return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
        };

        graph.buildingSlots.forEach(slot => {
          if (slot.occupied) return;
          
          const zone = slot.getZone();
          const pos = slot.getWorldPosition();
          
          if (this.separateRoadAndBuilding(pos, graph)) {
            slot.occupied = true;
            return;
          }

          const rot = slot.getRotation();
          const distFromCenter = Math.hypot(pos.x, pos.z);
          const type = getBldgType(zone, distFromCenter);
          const prefixes = typeMap[type] || typeMap['house'];
          const key = pickModel(prefixes);

          if (key && modelKeys.length > 0) {
            if (!instancedData[key]) instancedData[key] = [];
            const bScale = (type === 'house' || type === 'shop') ? 3.8 : ((type === 'tower' || type === 'skyscraper') ? 6.0 : 4.5);
            instancedData[key].push({ x: pos.x, z: pos.z, r: rot, s: bScale });
            slot.occupied = true;
            return;
          }

          // Fallback: procedural box building with variety
          const g = new THREE.Group();
          const mat = bMats[Math.floor(Math.random() * bMats.length)];
          const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

          // Varied heights: low households (5-8m), medium flats/chawls (10-16m), commercial (18-28m)
          const heightClass = Math.random();
          const bh = heightClass < 0.4 ? 5 + Math.random() * 4
                   : heightClass < 0.8 ? 10 + Math.random() * 6
                   : 18 + Math.random() * 12;
          const bw = 7 + Math.random() * 4;
          const bd = 8 + Math.random() * 4;

          const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
          bMesh.position.y = bh / 2;
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          g.add(bMesh);

          // Flat roof slab with colour variation
          const roofMat = new THREE.MeshToonMaterial({ color: roofColor, gradientMap: window._toonGrad });
          const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.3, 0.5, bd + 0.3), roofMat);
          roofMesh.position.y = bh + 0.25;
          g.add(roofMesh);

          // Daytime window grid (small dark panels)
          if (!cfg.is50km) {
            const winDayMat = new THREE.MeshBasicMaterial({ color: cfg.isNight ? 0xffdd88 : 0x3a5a78 });
            const winRows = Math.max(1, Math.floor(bh / 4));
            const winCols = Math.max(1, Math.floor(bw / 3.5));
            for (let wr = 0; wr < winRows; wr++) {
              for (let wc = 0; wc < winCols; wc++) {
                if (cfg.isNight ? Math.random() > 0.55 : Math.random() > 0.25) continue;
                const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), winDayMat);
                wMesh.position.set(-bw / 2 + 2 + wc * 3.5, 3 + wr * 4, bd / 2 + 0.02);
                g.add(wMesh);
                const wMesh2 = wMesh.clone();
                wMesh2.position.z = -(bd / 2 + 0.02);
                wMesh2.rotation.y = Math.PI;
                g.add(wMesh2);
              }
            }
          }

          // Commercial awning for short buildings
          if (type === 'shop' || (heightClass < 0.4 && Math.random() > 0.4)) {
            const awningColors = [0xcc2222, 0x1a6633, 0x224488, 0xcc8800, 0x662266];
            const awMat = new THREE.MeshToonMaterial({ color: awningColors[Math.floor(Math.random() * awningColors.length)], gradientMap: window._toonGrad });
            const awMesh = new THREE.Mesh(new THREE.BoxGeometry(bw + 1, 0.3, 2.5), awMat);
            awMesh.position.set(0, Math.min(bh * 0.35, 4), bd / 2 + 1.2);
            awMesh.rotation.x = -0.12;
            g.add(awMesh);
          }

          g.position.set(pos.x, 0, pos.z);
          g.rotation.y = rot;
          g.userData = { isBuilding: true, halfW: bw / 2, halfD: bd / 2 };
          this.scene.add(g);
          this.obstacles.push(g);
          slot.occupied = true;
        });

        // Build InstancedMeshes for GLB models
        if (window.PRELOADED_MODELS) {
          Object.entries(instancedData).forEach(([key, instances]) => {
            if (instances.length === 0) return;
            
            const baseModel = window.PRELOADED_MODELS[key];
            if (!baseModel) return;
            
            baseModel.position.set(0, 0, 0);
            baseModel.rotation.set(0, 0, 0);
            baseModel.scale.set(1, 1, 1);
            baseModel.updateMatrixWorld(true);
            
            const meshes = [];
            baseModel.traverse(c => { if (c.isMesh) meshes.push(c); });
            
            meshes.forEach(mesh => {
              const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, instances.length);
              im.castShadow = false;
              im.receiveShadow = true;
              im.frustumCulled = false;
              im.userData = { noLod: true };
              
              const dummy = new THREE.Object3D();
              const finalMatrix = new THREE.Matrix4();
              
              instances.forEach((inst, i) => {
                dummy.position.set(inst.x, 0, inst.z);
                dummy.rotation.y = inst.r;
                dummy.scale.set(inst.s, inst.s, inst.s);
                dummy.updateMatrix();
                finalMatrix.multiplyMatrices(dummy.matrix, mesh.matrixWorld);
                im.setMatrixAt(i, finalMatrix);
              });
              
              im.instanceMatrix.needsUpdate = true;
              this.scene.add(im);
            });
            
            // Add obstacle proxies for collision
            instances.forEach(inst => {
              const obs = new THREE.Object3D();
              obs.position.set(inst.x, 0, inst.z);
              obs.userData = { isBuilding: true, halfW: inst.s * 0.6, halfD: inst.s * 0.6 };
              this.obstacles.push(obs);
            });
          });
        }
      }

      _buildParksAndTrees() {
        const graph = this.roadGraph;
        if (!graph) return;
        const cfg = this.mapCfg || {};

        const grassMat  = new THREE.MeshToonMaterial({ color: 0x4caf50, gradientMap: window._toonGrad });
        const benchMat  = new THREE.MeshToonMaterial({ color: 0x6d4c41, gradientMap: window._toonGrad });
        const pathMat   = new THREE.MeshToonMaterial({ color: 0xd7ccc8, gradientMap: window._toonGrad });

        const trunkMat  = new THREE.MeshToonMaterial({ color: 0x5d4037, gradientMap: window._toonGrad });
        const folMat1   = new THREE.MeshToonMaterial({ color: 0x2e7d32, gradientMap: window._toonGrad });
        const folMat2   = new THREE.MeshToonMaterial({ color: 0x43a047, gradientMap: window._toonGrad });

        const treeInstances = [];

        // ── 1. Parks at unoccupied building slots ──
        const slots = graph.buildingSlots ? graph.buildingSlots.filter(s => !s.occupied) : [];
        const parkCount = Math.min(5, Math.max(2, Math.floor(slots.length * 0.08)));
        const step = Math.max(1, Math.floor(slots.length / (parkCount + 1)));

        for (let pi = 0; pi < parkCount; pi++) {
          const slot = slots[step * (pi + 1)];
          if (!slot) continue;
          slot.occupied = true;
          slot._isPark = true;
          const pos = slot.getWorldPosition();
          const rot = slot.getRotation();
          const pw = 18 + Math.random() * 10;
          const pd = 16 + Math.random() * 8;

          // Grass base
          const base = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.15, pd), grassMat);
          base.position.set(pos.x, 0.08, pos.z);
          base.rotation.y = rot;
          base.receiveShadow = true;
          base.userData = { noLod: true };
          this.scene.add(base);

          // Walking path
          const path = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, pd - 2), pathMat);
          path.position.set(pos.x, 0.12, pos.z);
          path.rotation.y = rot;
          path.userData = { noLod: true };
          this.scene.add(path);

          // Park benches
          const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.6), benchMat);
          seat.position.set(pos.x + 3, 0.7, pos.z + 2);
          this.scene.add(seat);

          // Trees inside park
          const numTrees = 3 + Math.floor(Math.random() * 3);
          for (let t = 0; t < numTrees; t++) {
            const tx = pos.x + (Math.random() - 0.5) * (pw - 4);
            const tz = pos.z + (Math.random() - 0.5) * (pd - 4);
            treeInstances.push({
              x: tx, z: tz,
              scale: 0.9 + Math.random() * 0.4,
              rot: Math.random() * Math.PI * 2
            });
          }
        }

        // ── 2. Roadside trees along road edges ──
        const edgeList = typeof graph.getEdgeList === 'function'
          ? graph.getEdgeList()
          : (graph.edges ? Array.from(graph.edges.values ? graph.edges.values() : []) : []);

        edgeList.forEach(edge => {
          if (!edge.nodes || edge.nodes.length < 2) return;
          const a = edge.nodes[0].position;
          const b = edge.nodes[1].position;
          const len = Math.hypot(b.x - a.x, b.z - a.z);
          if (len < 24) return;
          const rhw = ((edge.width || 14) / 2) + 5.5;
          const nx = (b.z - a.z) / len;
          const nz = -(b.x - a.x) / len;
          const spacing = 28 + Math.random() * 10;
          const n = Math.floor(len / spacing);
          for (let t = 0; t < n; t++) {
            const tt = (t + 0.5) / n;
            const cx = a.x + (b.x - a.x) * tt;
            const cz = a.z + (b.z - a.z) * tt;
            const off = rhw + 1.2 + Math.random() * 1.5;
            if (Math.random() > 0.25) {
              treeInstances.push({
                x: cx + nx * off + (Math.random() - 0.5) * 1.2,
                z: cz + nz * off + (Math.random() - 0.5) * 1.2,
                scale: 0.85 + Math.random() * 0.4,
                rot: Math.random() * Math.PI * 2
              });
            }
            if (Math.random() > 0.25) {
              treeInstances.push({
                x: cx - nx * off + (Math.random() - 0.5) * 1.2,
                z: cz - nz * off + (Math.random() - 0.5) * 1.2,
                scale: 0.85 + Math.random() * 0.4,
                rot: Math.random() * Math.PI * 2
              });
            }
          }
        });

        // ── 3. Batch render ALL trees in 3 GPU InstancedMesh draw calls ──
        const count = treeInstances.length;
        if (count === 0) return;

        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.8, 6);
        const cone1Geo = new THREE.ConeGeometry(1.6, 2.6, 7);
        const cone2Geo = new THREE.ConeGeometry(1.1, 2.0, 7);

        const instTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
        const instCone1 = new THREE.InstancedMesh(cone1Geo, folMat1, count);
        const instCone2 = new THREE.InstancedMesh(cone2Geo, folMat2, count);

        instTrunk.castShadow = false;
        instTrunk.receiveShadow = false;
        instTrunk.userData = { noLod: true };

        instCone1.castShadow = false;
        instCone1.receiveShadow = false;
        instCone1.userData = { noLod: true };

        instCone2.castShadow = false;
        instCone2.receiveShadow = false;
        instCone2.userData = { noLod: true };

        const dummy = new THREE.Object3D();

        treeInstances.forEach((inst, i) => {
          const s = inst.scale;
          // Trunk matrix
          dummy.position.set(inst.x, 0.9 * s, inst.z);
          dummy.rotation.set(0, inst.rot, 0);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          instTrunk.setMatrixAt(i, dummy.matrix);

          // Lower foliage cone
          dummy.position.set(inst.x, 2.2 * s, inst.z);
          dummy.updateMatrix();
          instCone1.setMatrixAt(i, dummy.matrix);

          // Upper foliage cone
          dummy.position.set(inst.x, 3.4 * s, inst.z);
          dummy.updateMatrix();
          instCone2.setMatrixAt(i, dummy.matrix);
        });

        instTrunk.instanceMatrix.needsUpdate = true;
        instCone1.instanceMatrix.needsUpdate = true;
        instCone2.instanceMatrix.needsUpdate = true;

        this.scene.add(instTrunk);
        this.scene.add(instCone1);
        this.scene.add(instCone2);

        console.log(`[Performance] Batched ${count} trees into 3 InstancedMeshes (3 draw calls)`);
      }


      _buildBusStops() {
        const graph = this.roadGraph;
        if (!graph) return;
        this.busStops = [];

        const shelterMat  = new THREE.MeshToonMaterial({ color: 0x1565c0, gradientMap: window._toonGrad }); // BEST bus blue
        const roofMat     = new THREE.MeshToonMaterial({ color: 0x0d47a1, gradientMap: window._toonGrad });
        const poleMat     = new THREE.MeshToonMaterial({ color: 0x78909c, gradientMap: window._toonGrad });
        const benchMat    = new THREE.MeshToonMaterial({ color: 0x4e342e, gradientMap: window._toonGrad });
        const markingMat  = new THREE.MeshBasicMaterial({ color: 0xf9a825 }); // yellow road marking

        // Collect arterial edges (lanes >= 2) and pick 3-5 spots
        const edgeList = typeof graph.getEdgeList === 'function'
          ? graph.getEdgeList()
          : (graph.edges ? Array.from(graph.edges.values ? graph.edges.values() : []) : []);

        const arterials = edgeList.filter(e => (e.lanes || 1) >= 2 && e.nodes && e.nodes.length >= 2);
        const stopCount = Math.min(5, Math.max(3, Math.floor(arterials.length * 0.18)));
        const step = Math.max(1, Math.floor(arterials.length / (stopCount + 1)));

        for (let si = 0; si < stopCount; si++) {
          const edge = arterials[step * (si + 1)];
          if (!edge) continue;
          const a = edge.nodes[0].position;
          const b = edge.nodes[1].position;
          const len = Math.hypot(b.x - a.x, b.z - a.z);
          if (len < 30) continue;

          // Place stop at 35% along the edge, offset to the left curb
          const t   = 0.35 + Math.random() * 0.3;
          const cx  = a.x + (b.x - a.x) * t;
          const cz  = a.z + (b.z - a.z) * t;
          const nx  = (b.z - a.z) / len;  // perpendicular
          const nz  = -(b.x - a.x) / len;
          const curb = ((edge.width || 14) / 2) + 2.5;
          const sx  = cx + nx * curb;
          const sz  = cz + nz * curb;
          const rot = Math.atan2(b.x - a.x, b.z - a.z);

          const g = new THREE.Group();
          g.position.set(sx, 0, sz);
          g.rotation.y = rot;

          // Back panel
          const back = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.12), shelterMat);
          back.position.set(0, 1.25, -0.06);
          g.add(back);

          // Roof
          const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 1.5), roofMat);
          roof.position.set(0, 2.6, 0.7);
          g.add(roof);

          // Left + right side panels
          [-1.95, 1.95].forEach(px => {
            const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 1.3), shelterMat);
            side.position.set(px, 1.25, 0.6);
            g.add(side);
          });

          // Two support poles
          [-1.6, 1.6].forEach(px => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), poleMat);
            pole.position.set(px, 1.3, 1.35);
            g.add(pole);
          });

          // Bench inside shelter
          const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.45), benchMat);
          seat.position.set(0, 0.52, 0.2);
          g.add(seat);
          const legs = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 0.1), benchMat);
          legs.position.set(0, 0.2, 0.2);
          g.add(legs);

          // Road marking strip (yellow)
          const marking = new THREE.Mesh(new THREE.BoxGeometry(4, 0.06, 10), markingMat);
          marking.position.set(0, 0.04, -7);
          g.add(marking);

          this.scene.add(g);
          this.busStops.push({ x: sx, z: sz, rot });
        }

        console.log(`[BusStops] Built ${this.busStops.length} bus stops`);
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
        const count = this._isMobile ? 800 : 2000; const geo = new THREE.BufferGeometry(); const pos = [];
        for (let i = 0; i < count; i++)pos.push((Math.random() - .5) * 400, Math.random() * 40, (Math.random() - .5) * 600);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9cc9ff, size: 0.08, transparent: true, opacity: 0.6 }));
        this.scene.add(this.rain);
        this._rainCenter = { x: 0, z: 0 };
        // Wind drift for slanted rain
        this._rainWindX = 0;
        this._rainWindZ = 0;
        this._rainWindTargetX = 0;
        this._rainWindTargetZ = 0;
        this._rainWindTimer = 0;
        // Add lightning for night rain levels
        if (this.mapCfg && this.mapCfg.isNight) {
            this._lightningTimer = 0;
            this._lightningFlash = null;
        }
        // Rain ambient audio — filtered white noise loop
        this._rainAudio = null;
        this._rainGain = null;
        this._startRainAudio();
      }
      _startRainAudio() {
        try {
          const actx = window.sfx && window.sfx._c;
          if (!actx) return;
          // Create white noise buffer (2 seconds, looping)
          const sr = actx.sampleRate;
          const len = sr * 2;
          const buf = actx.createBuffer(1, len, sr);
          const data = buf.getChannelData(0);
          for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
          const src = actx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          // Low-pass filter for rain-like sound
          const lp = actx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 800;
          lp.Q.value = 0.5;
          // Gain node for volume control
          const gain = actx.createGain();
          gain.gain.value = 0;
          src.connect(lp);
          lp.connect(gain);
          gain.connect(actx.destination);
          src.start();
          this._rainAudio = src;
          this._rainGain = gain;
          this._rainFilter = lp;
        } catch (e) {}
      }
      _updateRainAudio(active) {
        const g = this._rainGain;
        if (!g) return;
        try {
          const actx = window.sfx && window.sfx._c;
          const catVol = (window.sfx && window.sfx.vol && window.sfx.vol.env) || 1;
          const target = active ? 0.04 * catVol : 0;
          const now = actx ? actx.currentTime : 0;
          g.gain.linearRampToValueAtTime(target, now + 1.5);
        } catch (e) {}
      }
      _updateRain(dt) {
        if (!this.rain) return;
        // Keep rain centered around player for larger coverage
        if (this.player) {
            const px = this.player.position.x;
            const pz = this.player.position.z;
            // Smooth center transition
            this._rainCenter.x += (px - this._rainCenter.x) * 0.05;
            this._rainCenter.z += (pz - this._rainCenter.z) * 0.05;
        }
        // Wind drift — slowly vary direction for realism
        this._rainWindTimer += dt;
        if (this._rainWindTimer > 3 + Math.random() * 4) {
            this._rainWindTimer = 0;
            this._rainWindTargetX = (Math.random() - 0.5) * 12;
            this._rainWindTargetZ = (Math.random() - 0.5) * 8;
        }
        this._rainWindX += (this._rainWindTargetX - this._rainWindX) * dt * 0.3;
        this._rainWindZ += (this._rainWindTargetZ - this._rainWindZ) * dt * 0.3;
        const pos = this.rain.geometry.attributes.position.array;
        const count = pos.length / 3;
        const fallSpeed = 25;
        for (let i = 0; i < count; i++) {
            pos[i * 3] += this._rainWindX * dt; // horizontal wind drift
            pos[i * 3 + 1] -= fallSpeed * dt; // fall speed
            pos[i * 3 + 2] += this._rainWindZ * dt;
            if (pos[i * 3 + 1] < 0) {
                pos[i * 3 + 1] = 35 + Math.random() * 5;
                pos[i * 3] = this._rainCenter.x + (Math.random() - .5) * 400;
                pos[i * 3 + 2] = this._rainCenter.z + (Math.random() - .5) * 600;
            }
        }
        this.rain.geometry.attributes.position.needsUpdate = true;
        // Lightning effect for night rain
        if (this._lightningTimer !== undefined) {
            this._lightningTimer += dt;
            if (this._lightningTimer > 4 + Math.random() * 6) {
                this._lightningTimer = 0;
                // Flash effect
                this.scene.fog.color.setHex(0x4488aa);
                this._ambient && (this._ambient.intensity = 2);
                setTimeout(() => {
                    if (this.scene.fog) this.scene.fog.color.setHex(this.mapCfg.isNight ? 0x0a0a12 : 0x1a2a3a);
                    if (this._ambient) this._ambient.intensity = this.mapCfg.isNight ? 0.1 : 0.35;
                }, 80);
            }
        }
      }
      _spawnSplash(x, y, z) {
        const count = 20;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];
        const colors = new Float32Array(count * 3);
        const palette = [
          [0.612, 0.788, 1.0],  // bright blue
          [0.500, 0.700, 0.950], // medium blue
          [0.750, 0.880, 1.0],  // light blue
          [0.400, 0.600, 0.900], // deeper blue
          [0.850, 0.950, 1.0],  // near-white splash highlight
        ];
        for (let i = 0; i < count; i++) {
          const spread = i < count * 0.6 ? 0.3 : 1.2; // 60% tight core, 40% wide ring
          pos[i * 3] = x + (Math.random() - 0.5) * spread;
          pos[i * 3 + 1] = y + 0.2 + Math.random() * 0.3;
          pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
          const speed = i < count * 0.6 ? (3 + Math.random() * 3) : (1.5 + Math.random() * 2);
          const angle = Math.random() * Math.PI * 2;
          vel.push(Math.cos(angle) * speed, 2.5 + Math.random() * 4, Math.sin(angle) * speed);
          const c = palette[i % palette.length];
          colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.18, transparent: true, opacity: 0.85, vertexColors: true }));
        this.scene.add(pts);
        let elapsed = 0;
        const dur = 0.8;
        const animSplash = () => {
          elapsed += 0.016;
          if (elapsed > dur) { this.scene.remove(pts); geo.dispose(); return; }
          const p = pts.geometry.attributes.position.array;
          for (let i = 0; i < count; i++) {
            p[i * 3] += vel[i * 3] * 0.016;
            p[i * 3 + 1] += vel[i * 3 + 1] * 0.016;
            p[i * 3 + 2] += vel[i * 3 + 2] * 0.016;
            vel[i * 3 + 1] -= 14 * 0.016; // gravity
          }
          pts.geometry.attributes.position.needsUpdate = true;
          pts.material.opacity = 0.85 * (1 - elapsed / dur);
          pts.material.size = 0.18 + 0.06 * (elapsed / dur); // grow slightly as they spread
          requestAnimationFrame(animSplash);
        };
        animSplash();
      }
      _spawnDust(x, y, z) {
        const count = 14;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];
        const colors = new Float32Array(count * 3);
        const palette = [
          [0.760, 0.698, 0.502], // tan
          [0.680, 0.620, 0.450], // darker brown
          [0.820, 0.760, 0.560], // light sandy
          [0.600, 0.550, 0.400], // deep dust
        ];
        for (let i = 0; i < count; i++) {
          pos[i * 3] = x + (Math.random() - 0.5) * 1.8;
          pos[i * 3 + 1] = y + 0.1 + Math.random() * 0.15;
          pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.8;
          vel.push((Math.random() - 0.5) * 2.0, 0.8 + Math.random() * 2.5, (Math.random() - 0.5) * 2.0);
          const c = palette[i % palette.length];
          colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.22, transparent: true, opacity: 0.7, vertexColors: true }));
        this.scene.add(pts);
        let elapsed = 0;
        const dur = 0.65;
        const animDust = () => {
          elapsed += 0.016;
          if (elapsed > dur) { this.scene.remove(pts); geo.dispose(); return; }
          const p = pts.geometry.attributes.position.array;
          for (let i = 0; i < count; i++) {
            p[i * 3] += vel[i * 3] * 0.016;
            p[i * 3 + 1] += vel[i * 3 + 1] * 0.016;
            p[i * 3 + 2] += vel[i * 3 + 2] * 0.016;
            vel[i * 3 + 1] -= 4 * 0.016; // gentle gravity for dust
            vel[i * 3] *= 0.98; // drag horizontal
            vel[i * 3 + 2] *= 0.98;
          }
          pts.geometry.attributes.position.needsUpdate = true;
          pts.material.opacity = 0.7 * (1 - elapsed / dur);
          pts.material.size = 0.22 + 0.12 * (elapsed / dur); // dust grows as it dissipates
          requestAnimationFrame(animDust);
        };
        animDust();
      }
      _confettiThree() {
        const count = 80;
        const colors = [0xff5252, 0xffd740, 0x69f0ae, 0x40c4ff, 0xb388ff, 0xff6e40];
        const group = new THREE.Group();
        const pieces = [];
        for (let i = 0; i < count; i++) {
          const col = colors[Math.floor(Math.random() * colors.length)];
          const geo = new THREE.PlaneGeometry(0.15 + Math.random() * 0.15, 0.1 + Math.random() * 0.1);
          const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 1 });
          const m = new THREE.Mesh(geo, mat);
          m.position.set((Math.random() - 0.5) * 12, 6 + Math.random() * 4, (Math.random() - 0.5) * 12);
          m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          m.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 3, -1 - Math.random() * 3, (Math.random() - 0.5) * 3);
          m.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
          group.add(m);
          pieces.push(m);
        }
        this.scene.add(group);
        let elapsed = 0;
        const dur = 3.5;
        const animConf = () => {
          elapsed += 0.016;
          if (elapsed > dur) { this.scene.remove(group); pieces.forEach(p => { p.geometry.dispose(); p.material.dispose(); }); return; }
          const fade = Math.max(0, 1 - (elapsed - dur * 0.6) / (dur * 0.4));
          pieces.forEach(p => {
            p.position.x += p.userData.vel.x * 0.016;
            p.position.y += p.userData.vel.y * 0.016;
            p.position.z += p.userData.vel.z * 0.016;
            p.userData.vel.y -= 4 * 0.016;
            p.rotation.x += p.userData.spin.x * 0.016;
            p.rotation.y += p.userData.spin.y * 0.016;
            p.rotation.z += p.userData.spin.z * 0.016;
            p.material.opacity = fade;
          });
          requestAnimationFrame(animConf);
        };
        animConf();
      }

      _cp(x, z, col = 0x00c851) {
        const group = new THREE.Group();
        // Outer ring with glow
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, .18, 12, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 }));
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);
        // Inner glow ring
        const glow = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.02;
        group.add(glow);
        // Center marker
        const center = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 }));
        center.position.y = 0.04;
        group.add(center);
        // Vertical beam effect
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 8, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.15 }));
        beam.position.y = 4;
        group.add(beam);
        group.position.set(x, 0.8, z);
        group.userData = { pathT: 0, ring, glow, center, beam, baseY: 0.8 };
        this.scene.add(group);
        this.cps.push(group);
        return group;
      }

      _buildTrafficSignals(cfg, RW) {
        if (!this.sigs) this.sigs = [];
        const rwHalf = (RW || 12) / 2;
        const spawnedAt = new Set();

        const addSigAt = (ix, iz) => {
          const key = Math.round(ix / 10) + ',' + Math.round(iz / 10);
          if (spawnedAt.has(key)) return;
          spawnedAt.add(key);

          // Signal 1: Mast arm extending over incoming vertical lane (Phase 0: North-South)
          const sig1 = this._sig(ix + rwHalf + 1.2, iz + rwHalf + 1.2);
          sig1.rotation.y = -Math.PI / 2;
          sig1.userData = { axis: 'v', phaseOffset: 0, st: 'green', t: 0, rd: 7.5, gd: 6.0, yd: 1.5 };
          sig1.state = 'green';

          // Signal 2: Mast arm extending over opposing horizontal lane (Phase 1: East-West, shifted by 7.5s)
          const sig2 = this._sig(ix - rwHalf - 1.2, iz - rwHalf - 1.2);
          sig2.rotation.y = Math.PI / 2;
          sig2.userData = { axis: 'h', phaseOffset: 7.5, st: 'red', t: 0, rd: 7.5, gd: 6.0, yd: 1.5 };
          sig2.state = 'red';
        };

        // 1. Explicit signals from level config
        if (cfg && cfg.signals && Array.isArray(cfg.signals)) {
          cfg.signals.forEach(s => {
            const sig = this._sig(s.x, s.z);
            if (s.rotY !== undefined) sig.rotation.y = s.rotY;
          });
        }

        // 2. Intersections in cfg.ints
        if (cfg && cfg.ints && Array.isArray(cfg.ints) && !cfg.is50km) {
          cfg.ints.forEach(([ix, iz]) => {
            addSigAt(ix, iz);
          });
        }

        // 3. Auto-detected road crossings
        if (cfg && cfg.roads && Array.isArray(cfg.roads)) {
          const vRoads = cfg.roads.filter(r => r.type === 'v');
          const hRoads = cfg.roads.filter(r => r.type === 'h');
          for (const vr of vRoads) {
            for (const hr of hRoads) {
              const hxMin = Math.min(hr.x1, hr.x2);
              const hxMax = Math.max(hr.x1, hr.x2);
              const vzMin = Math.min(vr.z1, vr.z2);
              const vzMax = Math.max(vr.z1, vr.z2);
              if (vr.x >= hxMin - 10 && vr.x <= hxMax + 10 && hr.z >= vzMin - 10 && hr.z <= vzMax + 10) {
                addSigAt(vr.x, hr.z);
              }
            }
          }
        }

        // 4. RoadGraph junction nodes
        if (this.roadGraph && this.roadGraph.nodes) {
          const nodes = typeof this.roadGraph.nodes.values === 'function' ? Array.from(this.roadGraph.nodes.values()) : this.roadGraph.nodes;
          nodes.forEach(n => {
            if (n.edges && n.edges.length >= 3) {
              addSigAt(n.position.x, n.position.z);
            }
          });
        }
      }

      _sig(x, z) {
        const g = new THREE.Group();
        // Base plate
        const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.40, 0.25, 12), new THREE.MeshLambertMaterial({ color: 0x33373d }));
        basePlate.position.y = 0.125;
        g.add(basePlate);

        // Main vertical pole - tall Indian gantry style (6.2m)
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.2, 12), new THREE.MeshLambertMaterial({ color: 0x50565e }));
        p.position.y = 3.1;
        g.add(p);

        // Cantilevered overhead mast arm extending over roadway
        const mastArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8), new THREE.MeshLambertMaterial({ color: 0x50565e }));
        mastArm.rotation.z = Math.PI / 2;
        mastArm.position.set(1.9, 5.8, 0);
        g.add(mastArm);

        // Mast arm support strut
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), new THREE.MeshLambertMaterial({ color: 0x50565e }));
        strut.rotation.z = Math.PI / 4;
        strut.position.set(0.8, 5.0, 0);
        g.add(strut);

        // Primary Overhead Signal Housing (Large 3-aspect head)
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.3, 0.5), new THREE.MeshLambertMaterial({ color: 0x141619 }));
        bx.position.set(2.8, 5.4, 0.1);
        g.add(bx);

        // Visor hoods
        const mkHood = (xOff, yOff, zOff) => {
          const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.36, 0.25, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0x141619, side: THREE.DoubleSide }));
          hood.position.set(xOff, yOff, zOff);
          hood.rotation.x = Math.PI / 2;
          return hood;
        };

        // Large Lenses with emissive glow
        const mk = (xOff, yOff, zOff, n) => {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0x000000 }));
          s.position.set(xOff, yOff, zOff);
          s.name = n;
          return s;
        };

        g.add(
          mkHood(2.8, 6.15, 0.35),
          mkHood(2.8, 5.40, 0.35),
          mkHood(2.8, 4.65, 0.35),
          mk(2.8, 6.15, 0.30, 'red'),
          mk(2.8, 5.40, 0.30, 'yellow'),
          mk(2.8, 4.65, 0.30, 'green')
        );

        // Pedestrian signal pole & box (mounted at eye-level on sidewalk side)
        const ps_pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), new THREE.MeshLambertMaterial({ color: 0x50565e }));
        ps_pole.position.set(-0.6, 1.1, 0);
        const ps_box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.3), new THREE.MeshLambertMaterial({ color: 0x141619 }));
        ps_box.position.set(-0.6, 2.1, 0);
        const mks = (xOff, yOff, zOff, n) => {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshLambertMaterial({ color: 0x111111 }));
          s.position.set(xOff, yOff, zOff);
          s.name = n;
          return s;
        };
        g.add(ps_pole, ps_box, mks(-0.6, 2.3, 0.16, 'p_red'), mks(-0.6, 1.9, 0.16, 'p_green'));

        g.position.set(x, 0, z);
        this.scene.add(g);
        this.sigs.push(g);
        g.userData = { st: 'red', t: Math.random() * 6, rd: 4, gd: 4, yd: 1.5 };
        g.state = g.userData.st; // NPCAI reads signal.state; kept in sync by _usigs
        return g;
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

      // ── PATH ARROW INDICATORS (DISABLED PER USER REQUEST) ──
      _buildArrows() {
          // Clean up old arrows
          if (this._arrows && this._arrows.length) {
              this._arrows.forEach(a => {
                  this.scene.remove(a);
                  a.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
              });
          }
          this._arrows = [];
      }

      // Called each frame to pulse arrows and hide completed segments
      _updateArrows() {
          if (this._arrows && this._arrows.length) {
              this._arrows.forEach(a => { a.visible = false; });
          }
      }

      _updateLights(dt) {
        if (!this.playing || this.pause) return;
        this._lightFrame = (this._lightFrame || 0) + 1;
        if (this._lightFrame % 15 !== 0) return; // Update light culling ~4 times a second, not 60 fps
        const streetL = this._streetLights;
        const winL = this._windowLights;
        if ((!streetL || !streetL.length) && (!winL || !winL.length)) return;

        const pPos = this.player ? this.player.position : null;
        if (!pPos) return;
        const px = pPos.x, pz = pPos.z;

        if (streetL) {
          for (let i = 0; i < streetL.length; i++) {
            const l = streetL[i];
            const dx = l.position.x - px, dz = l.position.z - pz;
            l.visible = (dx * dx + dz * dz) < 6400; // 80m radius
          }
        }
        if (winL) {
          for (let i = 0; i < winL.length; i++) {
            const l = winL[i];
            const dx = l.position.x - px, dz = l.position.z - pz;
            l.visible = (dx * dx + dz * dz) < 6400; // 80m radius
          }
        }
      }

      _loop() {
        requestAnimationFrame(() => this._loop());
        if (!this.playing || this.pause) {
          if (this.renderCore && this.scene && this.camera) this.renderCore.render(this.scene, this.camera);
          return;
        }
        const dt = Math.min(this.clock.getDelta(), .033);
        this.timer += dt;
        if (this._spawnInvulnerable > 0) this._spawnInvulnerable -= dt;
        this._honkedThisFrame = false;
        // ── Hitstop: freeze physics on hard impact ──
        if (this._hitstopTimer > 0) {
          this._hitstopTimer -= dt;
          if (this.renderCore && this.scene && this.camera) this.renderCore.render(this.scene, this.camera);
          return;
        }
        this._collidedThisFrame = false;
        
        // Use RenderCore quality settings for dynamic budgets
        const lodMult = this.renderCore ? this.renderCore.getLODMultiplier() : 1.0;
        const maxParticles = this.renderCore ? this.renderCore.getMaxParticles() : 2000;
        
        // ─── WORLD STREAMING + FLOATING ORIGIN ───
        // this._updateStreaming(); // Function undefined
        // this._checkFloatingOrigin(); // Function undefined
        
        // ── Enhanced Physics Systems (computed BEFORE input for frame-accurate values) ──
        if (!this.isPedestrian) {
          this._computeAeroForces(dt);
          this._updateBrakeHeat(dt);
        }
        try { this._tickEnterExit(dt); } catch (err) {
          // _tickEnterExit runs the enter/exit-vehicle cinematic (camera orbit, door/seat
          // animation). It sets this._camOverride = true for its duration and only clears it
          // once the whole sequence finishes normally. If anything inside threw (a missing
          // bone/pivot on a particular vehicle model, etc.), _camOverride stayed stuck true
          // forever — which makes _ucam() bail out early every frame, freezing the camera
          // wherever it happened to be (this is almost certainly the "camera stuck" bug).
          // It also aborted every other call later in this same chain, since one throw here
          // stopped the whole unguarded call chain for that frame. Recover instead of freezing.
          console.error('[Driving] _tickEnterExit() failed, resetting camera/enter-state:', err);
          this._camOverride = false;
          this._enterState = 'IDLE'; if (window.TrafficAudio) window.TrafficAudio.playDoorClose();
        }
        this._input(dt); this._usigs(dt); this._unpcs(dt); this._upeds(dt); this._ucps(dt); this._updateArrows(); this._updateVehicleBeacon(dt); this._ugps(); this._checkBrakeZones(dt); this._uobs(dt); this._umode(dt); this._updateLights(dt); this._decayCameraLook(dt); this._ucam(dt); this._usun(dt); this._updateDayNight(dt); this._uhud(); this._ummap(); this._utransit(); this._computeTaskFlags(); this._checkTasks(); if (this.taskManager) this.taskManager.update(dt); this._updateRain(dt); this._updateRainAudio(this.mode === 'rain' || this.mapCfg?.hasRain); this._updateDynamicLOD(lodMult); this._updateBreadcrumbPath(dt);
        if (this._cattle) {
          this._cattle.forEach(c => {
            c.waitTimer -= dt;
            if (c.waitTimer <= 0 && !c.moved) {
              c.moved = true;
            }
            if (c.moved && c.mesh.position.z < c.targetZ) {
              c.mesh.position.z += 0.5 * dt;
            }
          });
        }
        if (this._elderlyPed) {
          const ep = this._elderlyPed;
          ep.group.position.x += ep.speed * ep.direction * dt;
          ep.group.rotation.y = ep.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (ep.group.position.x >= ep.endX) ep.direction = -1;
          if (ep.group.position.x <= ep.startX) ep.direction = 1;
          // Walking stick bob
          if (ep.stick) ep.stick.rotation.z = (ep.direction > 0 ? 0.15 : -0.15) + Math.sin(Date.now() * 0.003) * 0.08;
        }
        if (this._activeAmbulance) {
          const a = this._activeAmbulance;
          a.strobeTimer = (a.strobeTimer || 0) + dt * 8;
          const isRed = Math.sin(a.strobeTimer) > 0;
          if (a.redLight) a.redLight.intensity = isRed ? 2.5 : 0.2;
          if (a.blueLight) a.blueLight.intensity = isRed ? 0.2 : 2.5;
          if (a.active && a.group) {
            a.group.position.z += a.speed * dt;
          }
        }
        if (this._flagman && this._flagman.stick) {
          this._flagman.stick.rotation.z = 0.4 + Math.sin(Date.now() * 0.005) * 0.3;
        }
        if (this._tollBarriers) {
          this._tollBarriers.forEach(tb => {
            if (this.player && Math.hypot(this.player.position.x - tb.pivotX, this.player.position.z - tb.bar.position.z) < 15) {
              tb.open = true;
            }
            if (tb.open && tb.angle < Math.PI / 2) {
              tb.angle = Math.min(Math.PI / 2, tb.angle + dt * 2);
              tb.bar.rotation.z = tb.angle;
            }
          });
        }
        // World streaming update — handle deferred initial load
        if (this._needsInitialStream && this.player && this.player.position) {
          this.worldStreamer.update(this.player.position, 1.0);
          this._needsInitialStream = false;
        } else if (this.worldStreamer && this.player) {
          this.worldStreamer.update(this.player.position, dt);
        }

        // Collect mission data before updating missions
        this._collectMissionData(dt);

        // Mission and collectible update
        if (this.missionManager && this.player && this.missionManager.active) {
          if (!this._missionExtra) this._missionExtra = {};
          const ex = this._missionExtra;
          ex.playerRot = this.player.rotation.y;
          ex.speed = Math.abs(this.speed);
          ex.lateralG = this._lateralAccel || 0;
          ex.longitudinalG = this._longitudinalAccel || 0;
          ex.hitPothole = this._hitPotholeThisFrame || false;
          ex.lastPos = this._lastPlayerPos || null;
          ex.leadVehiclePos = this._leadVehiclePos || null;
          ex.targetVehiclePos = this._targetVehiclePos || null;
          ex.pursuerPositions = this._pursuerPositions || [];
          ex.childrenGroups = this._childrenGroups || [];
          ex.violations = this._sidewalkViolations || [];
          ex.ambulancePos = this._ambulancePos || null;
          ex.pedPositions = this.peds;
          ex.vehiclePositions = this.npcs;
          ex.intersections = this._intersections || [];
          this.missionManager.update(this.player.position, dt, this.timer, ex);
          if (!this._lastPlayerPos) this._lastPlayerPos = new THREE.Vector3();
          this._lastPlayerPos.copy(this.player.position);
          this._hitPotholeThisFrame = false;
        }
        // ── Suspension (after input, needs steering data) ──
        if (!this.isPedestrian) {
          this._updateSuspension(dt);
        }
        if (window.TrafficAudio && this._collidedThisFrame) window.TrafficAudio.playCrash(0.8);
        this._updateCrashFX(dt);
        this._updateVFX(dt);

        // ── Player character animation ──
        const playerChar = this.playerCharacter || (this.isPedestrian ? this.player : null)
        if (playerChar && playerChar.userData) {
          if (playerChar.userData.isFBXAnimated && playerChar.userData.mixer) {
            // FBX animated character
            const walkW = Math.min(Math.abs(this.speed) * 3, 1)
            if (playerChar.userData.idleAction) playerChar.userData.idleAction.setEffectiveWeight(1 - walkW)
            if (playerChar.userData.runAction) playerChar.userData.runAction.setEffectiveWeight(walkW)
            playerChar.userData.mixer.update(dt)
          } else if (this.isPedestrian) {
            // Procedural or GLB character: swing limbs
            this._animateCharacterWalk(playerChar, Math.abs(this.speed), dt);
        
        // Footstep audio when walking on foot
        if (this.isPedestrian && Math.abs(this.speed) > 0.02 && window.TrafficAudio) {
          window.TrafficAudio.playFootstep();
        }

          }
        }

        // Removed redundant WebGL minimap rendering pass.
        // The game relies on the highly stylized 2D canvas minimap via `_ummap()` which is much faster.
        this.renderCore.render(this.scene, this.camera);

        // Frame budget monitoring in RenderCore
        if (this.renderCore && this.renderCore.checkFrameBudget) {
          const frameTime = performance.now() - now;
          this.renderCore.checkFrameBudget(frameTime);
        }

      }
      _input(dt) {
        if (!this.player) return;
        if (!this.isPedestrian && Math.abs(this.speed) > 0.05) {
            if (!this.seatbeltOn && !this.challanFired.has('seatbelt')) {
                this.challanFired.add('seatbelt');
                
                // Check cumulative rules for seatbelt/helmet
                const _lvId = (ui.cur ? ui.cur.id : 1);
                const cumCheck = this.checkCumulativeViolation('wear_safety', _lvId);
                if (cumCheck.enforce) {
                  this._triggerPoliceStrobe(); ui.issueChallan((this.vehMode === 'bike' || this.vehMode === 'cycle') ? 'Riding without Helmet' : 'Driving without Seatbelt', 'Sec 194D MV Act', '₹1,000', 'Safety Violation');
                  this.vio++; this.violationsLog.push('SAFETY_VIOLATION'); this.score -= 20; this.fine += 1000;
                } else {
                  this.violationsLog.push('SAFETY_WARNING');
                  toast('⚠️ Safety gear required — first reminder', '#f2b84b');
                }
                if (window.GameplayRecorder) GameplayRecorder.record('SAFETY_VIOLATION', { speed: Math.round(Math.abs(this.speed) * 100), score: this.score, fine: this.fine });
            }
        }

        if (this.keys['f']) {
          if (!this._fPressed && this._enterState === 'IDLE') {
            if (this.playerVehicle && this.playerCharacter) {
              if (this.isPedestrian) {
                const dist = this.player.position.distanceTo(this.playerVehicle.position);
                if (dist < 6.0) { if (window.TrafficAudio) window.TrafficAudio.playDoorOpen();
                  this._enterDir = 1;
                  this._enterTimer = 0;
                  this._enterState = 'WALKING_TO_DOOR';
                  this._camOverride = true;
                  this._enterDoorSide = 'L';
                  const vehPos = this.playerVehicle.position;
                  const vehRot = this.playerVehicle.rotation.y;
                  const doorLocal = new THREE.Vector3(1.2, 0, 0.4);
                  doorLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehRot);
                this._enterWalkStart = this.player.position.clone();
                this._enterWalkEnd = vehPos.clone().add(doorLocal);
                  this._enterWalkEnd.y = 0;
                  toast('Walking to vehicle...', '#f39c12');
                } else {
                  toast('Too far from vehicle.', '#ff9500');
                }
              } else {
                this._enterDir = -1;
                this._enterTimer = 0;
                this._enterState = 'OPENING_DOOR';
                this._camOverride = true;
                this._enterDoorSide = 'L';
                const vehPos = this.playerVehicle.position;
                const vehRot = this.playerVehicle.rotation.y;
                const outLocal = new THREE.Vector3(3.0, 0, 0.4);
                outLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehRot);
                this._enterWalkEnd = vehPos.clone().add(outLocal);
                this._enterWalkEnd.y = 0;
                toast('Exiting vehicle...', '#f39c12');
              }
            }
          }
          this._fPressed = true;
        } else {
          this._fPressed = false;
        }

        const inTransition = this._enterState !== 'IDLE';
        let at = window.analogThrottle || 0;
        const up = !inTransition && (this.keys['arrowup'] || this.keys['w'] || at > 0.1);
        const dn = !inTransition && (this.keys['arrowdown'] || this.keys['s'] || at < -0.1);
        const lt = !inTransition && (this.keys['arrowleft'] || this.keys['a']);
        const rt = !inTransition && (this.keys['arrowright'] || this.keys['d']);
        
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
            // Mouse steering for pedestrian without clicking
            if (!this.isPointerLocked && this._mouseX !== undefined) {
              const dx = this._mouseX - window.innerWidth / 2;
              if (dx < -60) this.player.rotation.y += 0.035;
              if (dx > 60) this.player.rotation.y -= 0.035;
            }
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
            const _bf = this._brakeFadeFactor || 1.0;
            if (this.speed > 0) this.speed -= this.accel * 1.4 * _bf * dt * 60;
            else if (isRev && this.speed < -0.02) this.speed += this.accel * 1.4 * _bf * dt * 60;
          }
          // Clamp to gear cap
          if (isRev) { this.speed = Math.max(this.speed, -cap); } else { this.speed = Math.min(this.speed, cap); }
          // Frame-rate independent friction: pow(fric, dt*60) makes 0.945 feel identical at 30fps and 120fps
          this.speed *= Math.pow(this.fric, dt * 60);
          if (Math.abs(this.speed) < 0.001 && !up && !dn) this.speed = 0;

          // ── AERODYNAMIC DRAG (computed by _computeAeroForces) ──
          // _aeroDrag already includes speed², so we only apply it as a deceleration force
          if (this._aeroDrag > 0 && Math.abs(this.speed) > 0.1) {
            const dragDecel = this._aeroDrag * dt * 60; // _aeroDrag has speed² baked in
            if (this.speed > 0) this.speed = Math.max(0, this.speed - dragDecel);
            else this.speed = Math.min(0, this.speed + dragDecel);
          }

          // ── CRUISE CONTROL: auto-throttle to hold cruiseSpeed ──
          if (this.cruiseControl && !dn && this.gear === 'D') {
            const target = this.cruiseSpeed / 100; // convert km/h → internal units
            const err = target - this.speed;
            if (Math.abs(err) > 0.005) this.speed += Math.sign(err) * Math.min(Math.abs(err), this.accel * 0.5 * dt * 60);
          }
          if (this.cruiseControl && dn) this.cruiseControl = false; // braking disengages cruise

          // ── SPEED LIMITER / GOVERNOR: hard cap ──
          if (this.speedLimiter && this.speed !== 0) {
            const limCap = (this.speedLimitCap || 50) / 100;
            if (this.speed > limCap) this.speed = limCap;
            else if (this.speed < -limCap * 0.5) this.speed = -limCap * 0.5;
          }

          // ── DRIVE MODE CAP ──
          if (this._driveModeCapMap && this.driveMode && this.speed > 0) {
            const modeCap = (this._driveModeCapMap[this.driveMode] || 999) / 100;
            if (this.speed > modeCap) this.speed = modeCap;
          }

          // ── DOWNFORCE GRIP BONUS (computed by _computeAeroForces) ──
          // At high speed, downforce increases effective grip by up to 30%
          if (this._downforceCoeff > 0.01) {
            const gripMult = 1.0 + this._downforceCoeff; // multiplicative, not replacement
            const rainPenalty = (this.mode === 'rain' || (this.mapCfg && this.mapCfg.hasRain)) ? 0.3 : 1.0;
            this._grip = Math.min(0.95, (VEHICLE_STATS[this.vehMode] || VEHICLE_STATS.car).grip * rainPenalty * gripMult);
          }

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
          if (lt) tAmt = 1;
          else if (rt) tAmt = -1;
          else if (this.gyroOn) tAmt = -window.gyroSteering;
          else if (window.analogSteering) tAmt = -window.analogSteering;

          // ── Dual-Track Dynamic Physics & Pacejka Yaw Calculations ──
          if (!this.isPedestrian) {
            this._computeVehicleDynamics(dt, tAmt, dn, up, isRev);
          } else if (Math.abs(this.speed) > .005) {
            // Pedestrian rotational turning
            const effTurn = (this.turn || 0.08);
            if (tAmt !== 0) this.player.rotation.y += tAmt * effTurn * dt * 60;
            while (this.player.rotation.y > Math.PI) this.player.rotation.y -= Math.PI * 2;
            while (this.player.rotation.y < -Math.PI) this.player.rotation.y += Math.PI * 2;
          }

          if (this.gyroOn) this._checkGyroAutoRecal(tAmt);
          // Camera tilt: smooth follow of lateral input, scaled by speed
          const tiltTarget = -tAmt * Math.min(Math.abs(this.speed) * 0.06, 0.04);
          this._camTilt += (tiltTarget - this._camTilt) * Math.min(1, dt * 8);

          // ── Indicator non-use fine (F) ──
          // Track sustained turning; fine if turning > 1.5s without indicator
          if (!this.isPedestrian && tAmt !== 0 && Math.abs(this.speed) > 0.05) {
            const turnDir = tAmt > 0 ? -1 : 1; // left=1, right=-1 (maps to turnSignal convention)
            if (this._turnAccumDir === turnDir) {
              this._turnAccum += dt;
            } else {
              this._turnAccum = dt;
              this._turnAccumDir = turnDir;
            }
            if (this._turnAccum > 1.5 && this.turnSignal === 0 && !this.challanFired.has('no_indicator')) {
              this.challanFired.add('no_indicator');
              if (window.GameplayRecorder) GameplayRecorder.record('NO_INDICATOR', { speed: Math.round(Math.abs(this.speed) * 100), score: this.score });
              this._triggerPoliceStrobe(); ui.issueChallan('Turning without Indicator', 'Sec 125 MV Act', '₹500', 'Signal Violation');
            toast('💡 TIP: Always use indicators 30 meters before turning. It prevents 40% of lane-change accidents.', '#ffd54a');
              this.vio++; this.violationsLog.push('NO_INDICATOR'); this.score -= 30; this.fine += 500;
              toast('⚠️ Use turn signals! ₹500 fine', '#ff9500');
              sfx.play('error');
            }
          } else {
            this._turnAccum = 0;
            this._turnAccumDir = 0;
          }

          // Chassis motion vector with lateral slip velocity support
          const yaw = this.player.rotation.y;
          const vy = (this._localVy && !this.isPedestrian) ? this._localVy * 0.033 : 0;
          const targetVx = Math.sin(yaw) * this.speed + Math.cos(yaw) * vy;
          const targetVz = Math.cos(yaw) * this.speed - Math.sin(yaw) * vy;
          this.vx = targetVx;
          this.vz = targetVz;
          this.player.position.x += this.vx; this.player.position.z += this.vz;

        // ── KID-FIRST: MAGNETIC LANE ASSIST ──
        if (!this.isPedestrian && this.kidModeActive) {
          const center = this._getLaneCenter(this.player.position.x, this.player.position.z);
          if (center) {
            const assistS = 0.02;
            if (center.x !== null) this.player.position.x += (center.x - this.player.position.x) * assistS;
            if (center.z !== null) this.player.position.z += (center.z - this.player.position.z) * assistS;
          }
        }

        if (this.isPedestrian && Math.abs(this.speed) > 0.02) { const shift = this.keys['shift'] ? 18 : 10; this.player.position.y = Math.abs(Math.sin(this.timer * shift)) * (this.keys['shift'] ? 0.12 : 0.06); }
        else if (!this.isPedestrian && this.playerVehicle && !this._sbBounce) { this.playerVehicle.position.y = 0; }

        // Hard world boundary clamp — prevents floating-point precision loss
        let _wBound = 1550;
        if (this.mapCfg && this.mapCfg.is50km) _wBound = 25500;
        else if (this.mapCfg && this.mapCfg.useLowPolyCity) _wBound = 5000;
        this.player.position.x = Math.max(-_wBound, Math.min(_wBound, this.player.position.x));
        this.player.position.z = Math.max(-_wBound, Math.min(_wBound, this.player.position.z));

        const surfaceStatus = this._getRoadAndSidewalkStatus(this.player.position.x, this.player.position.z);
        const owEl = this.dom['ow'];
        const currentRoad = surfaceStatus.currentRoad;

        if (this.mapCfg && this.mapCfg.hasPuddles && Math.random() < 0.3) { this.player.rotation.y += this.turn * (this.speed > 0 ? 1 : -1) * (Math.random() * 0.5 - 0.25); }
        // Re-normalize after puddle jitter
        if (!this.isPedestrian) {
          while (this.player.rotation.y > Math.PI) this.player.rotation.y -= Math.PI * 2;
          while (this.player.rotation.y < -Math.PI) this.player.rotation.y += Math.PI * 2;
        }
        if (this.isPedestrian) {
          // Pedestrian: safe on sidewalk or zebra crossing; warn only when jaywalking on active asphalt
          if (surfaceStatus.onRoad && !surfaceStatus.nearZebra) {
            if (owEl) {
              owEl.textContent = "⚠️ JAYWALKING — Walk on the sidewalk or zebra crossing!";
              owEl.classList.add('on');
            }
            this.speed *= 0.85;
            this.hp = Math.max(0, this.hp - 0.15);
            this._uh();
          } else {
            if (owEl) owEl.classList.remove('on');
          }
        } else {
          // Vehicle: safe on asphalt road; penalty on sidewalk or off-road
          if (surfaceStatus.onSidewalk) {
            if (owEl) {
              owEl.textContent = "⚠️ DRIVING ON SIDEWALK — Keep vehicle on road! Fine ₹500";
              owEl.classList.add('on');
            }
            this.speed *= 0.7;
            this.hp = Math.max(0, this.hp - (this.seatbeltOn ? 0.25 : 0.4));

            if (!this.player.userData.fpCooldown) this.player.userData.fpCooldown = 0;
            this.player.userData.fpCooldown -= dt;
            if (this.player.userData.fpCooldown <= 0 && window.ui && window.ui.issueChallan) {
              if (this._triggerPoliceStrobe) this._triggerPoliceStrobe();
              ui.issueChallan('Driving on Footpath', 'Sec 177 MV Act', '₹500', 'Reckless Driving');
              this.player.userData.fpCooldown = 3.5;
            }

            if (this.hp <= 0) this._go("Wrecked on sidewalk"); else this._uh();
          } else if (surfaceStatus.offRoad && !(this.mapCfg && (this.mapCfg.useLowPolyCity || this.mapCfg.is50km || this.mapCfg.themeType === 'free_roam'))) {
            if (owEl) {
              owEl.textContent = "⚠️ OFF ROAD — Return vehicle to road!";
              owEl.classList.add('on');
            }
            this.speed *= 0.52;
            this.hp = Math.max(0, this.hp - (this.seatbeltOn ? 0.36 : 0.45));
            if (this.hp <= 0) this._go("Drove off-road"); else this._uh();
            if (window.GameplayRecorder) GameplayRecorder.record('OFF_ROAD', { hp: Math.round(this.hp), score: this.score });
          } else {
            if (owEl) owEl.classList.remove('on');
          }
        }
            
            // Turn signal blink effect
            if (this.turnSignal !== 0) {
                this.turnTimer += dt;
                if (this.turnTimer > 0.4) {
                    this.turnTimer = 0;
                    if (window.sfx && window.sfx.play) window.sfx.play('ok');
                }
            }
            
            // Check Wrong-side driving
            if (currentRoad && !this.isPedestrian && Math.abs(this.speed) > 0.15 && (!this._spawnInvulnerable || this._spawnInvulnerable <= 0)) {
                let wrongWay = false;
                let nearInt = false;
                (this.mapCfg.ints || []).forEach(([ix, iz]) => {
                    if (Math.abs(this.player.position.x - ix) < 30 && Math.abs(this.player.position.z - iz) < 30) nearInt = true;
                });
                const nearGarage = this._garageX !== undefined && Math.hypot(this.player.position.x - this._garageX, this.player.position.z - this._garageZ) < 40;
                if (!nearInt && !nearGarage) {
                    if (currentRoad.type === 'v') {
                        if (Math.sign(this.player.position.x - currentRoad.x) === Math.sign(this.vz) && Math.abs(this.vz) > 0.05) wrongWay = true;
                    } else {
                        if (Math.sign(this.player.position.z - currentRoad.z) === Math.sign(this.vx) && Math.abs(this.vx) > 0.05) wrongWay = true;
                    }
                }
                if (wrongWay) {
                    this.player.userData.wwTimer = (this.player.userData.wwTimer || 0) + dt;
                    if (!this.player.userData.wwCooldown) this.player.userData.wwCooldown = 5;
                    this.player.userData.wwCooldown -= dt;
                    if (this.player.userData.wwCooldown <= 0 && this.player.userData.wwTimer >= 2.5 && window.ui && window.ui.issueChallan) {
                        if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Wrong Side Driving', 'Sec 119 MV Act', '₹1,500', 'Lane Discipline');
                        this.player.userData.wwCooldown = 5;
                        this.player.userData.wwTimer = 0;
                    }
                } else {
                    this.player.userData.wwTimer = 0;
                }
            }

// Check Overspeeding
            if (this.mapCfg && this.mapCfg.speedLimit && !this.isPedestrian) {
              const currentSpeedKmH = Math.round(Math.abs(this.speed) * 100);
              if (currentSpeedKmH > this.mapCfg.speedLimit) {
                 if (!this.player.userData.spdCooldown) this.player.userData.spdCooldown = 0;
                 this.player.userData.spdCooldown -= dt;                  if (this.player.userData.spdCooldown <= 0 && window.ui && window.ui.issueChallan) {
                    
                    // Check cumulative rules for speed limit adherence
                    const _lvId = (ui.cur ? ui.cur.id : 1);
                    const cumCheck = this.checkCumulativeViolation('speed_limit_adherence', _lvId);
                    if (cumCheck.enforce) {
                      if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Overspeeding (repeat offense)', 'Sec 112 MV Act', 'Rs. 1,000', 'Limit: ' + this.mapCfg.speedLimit + ' km/h');
                      this.vio++; this.violationsLog.push('SPEED_VIOLATION'); this.fine += 1000;
                    } else {
                      if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Overspeeding', 'Sec 112 MV Act', 'Rs. 1,000', 'Limit: ' + this.mapCfg.speedLimit + ' km/h');
                      this.violationsLog.push('SPEED_WARNING');
                    }
                    
                    toast('💡 TIP: Over-speeding is the #1 cause of road accidents in India. Stay within limits!', '#ff9500');
                      if (window.GameplayRecorder) GameplayRecorder.record('SPEED_VIOLATION', { speed: Math.round(currentSpeedKmH), limit: this.mapCfg.speedLimit, score: this.score, fine: this.fine });
                      this.player.userData.spdCooldown = 5;
                    }
                  }
                }

            // Two-wheeler-specific rule: bikes carry a lower safe-speed expectation than cars
            // even where a zone doesn't post an explicit limit, and a one-time helmet reminder —
            // genuine bike-specific content rather than just letting a bike drive through a
            // car-authored scenario with identical rules.
            if (this.vehType === 'bike' && !this.isPedestrian) {
              if (!this._helmetReminderShown) {
                this._helmetReminderShown = true;
                if (Math.abs(this.speed) > 0.02 && typeof toast === 'function') {
                  toast('Remember: helmet always on for two-wheelers', '#f59e0b');
                }
              }
              const bikeSafeLimit = this.mapCfg && this.mapCfg.speedLimit ? Math.min(this.mapCfg.speedLimit, 50) : 50;
              const currentBikeSpeedKmH = Math.round(Math.abs(this.speed) * 100);
              const zoneAlreadyEnforced = this.mapCfg && this.mapCfg.speedLimit && currentBikeSpeedKmH > this.mapCfg.speedLimit;
              if (!zoneAlreadyEnforced && currentBikeSpeedKmH > bikeSafeLimit) {
                if (!this.player.userData.bikeSpdCooldown) this.player.userData.bikeSpdCooldown = 0;
                this.player.userData.bikeSpdCooldown -= dt;
                if (this.player.userData.bikeSpdCooldown <= 0 && window.ui && window.ui.issueChallan) {
                  if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Two-Wheeler Overspeeding', 'Sec 112 MV Act', 'Rs. 1,000', 'Safe limit: ' + bikeSafeLimit + ' km/h');
                  this.player.userData.bikeSpdCooldown = 5;
                }
              }
            }

            // ── Idle-time reminder tooltips (D) ──
            if (!this.isPedestrian && Math.abs(this.speed) < 0.02 && (this.timer - this._lastInputTime) > 10 && !this._idleHintShown) {
              this._idleHintShown = true;
              let hint = document.getElementById('idle-hint');
              if (!hint) {
                hint = document.createElement('div');
                hint.id = 'idle-hint';
                hint.style.cssText = 'position:fixed;bottom:22%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:12px 22px;border-radius:12px;font-size:18px;z-index:10001;pointer-events:none;text-align:center;transition:opacity .4s;white-space:nowrap;';
                document.body.appendChild(hint);
              }
              const hints = ['⬆️ Press W or ↑ to drive', '🔄 Q/E to use turn signals', '🅿️ Press P to park', '💡 H for high beam', '📱 M for GPS'];
              hint.textContent = hints[Math.floor(Math.random() * hints.length)];
              hint.style.opacity = '1';
            }
            if (this._idleHintShown && (this.timer - this._lastInputTime) < 10) {
              this._idleHintShown = false;
              const h = document.getElementById('idle-hint');
              if (h) h.style.opacity = '0';
            }

            // ── Phone ringing temptation overlay (G) ──
            if (!this.isPedestrian && this.mode !== 'pedestrian') {
              this._phoneRingTimer -= dt;
              if (this._phoneRingTimer <= 0 && !this._phoneRinging && !this._phoneDismissed) {
                this._phoneRinging = true;
                this._phoneRingTimer = 25 + Math.random() * 15;
                this._phoneRingingStart = this.timer;
                // Play ring SFX
                if (typeof sfx !== 'undefined' && sfx.play) sfx.play('horn');
                let ringEl = document.getElementById('phone-ring-overlay');
                if (!ringEl) {
                  ringEl = document.createElement('div');
                  ringEl.id = 'phone-ring-overlay';
                  ringEl.innerHTML = `
                    <div class="phone-call-header">
                      <div class="phone-call-avatar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      </div>
                      <div class="phone-call-info">
                        <div class="phone-call-title">Incoming Call</div>
                        <div class="phone-call-caller">Mom Calling...</div>
                      </div>
                    </div>
                    <div class="phone-call-actions">
                      <button id="phone-answer" class="phone-btn-ans">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Answer
                      </button>
                      <button id="phone-ignore" class="phone-btn-ign">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Ignore
                      </button>
                    </div>
                  `;
                  document.body.appendChild(ringEl);
                }
                ringEl.style.display = 'flex';
                document.getElementById('phone-answer')?.addEventListener('click', () => {
                  ringEl.style.display = 'none'; ringEl.style.animation = 'none';
                  this._phoneRinging = false; this._phoneDismissed = true;
                  if (typeof sfx !== 'undefined' && sfx.play) sfx.play('error');
                  if (window.ui && window.ui.issueChallan) {
                    
                    // Check cumulative rules for mobile use
                    const _lvId = (ui.cur ? ui.cur.id : 1);
                    const cumCheck = this.checkCumulativeViolation('mobile_use', _lvId);
                    if (cumCheck.enforce) {
                      if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Distracted Driving - Phone', 'Sec 184 MV Act', '₹1,000', 'Mobile Use');
                      this.score -= 25; this.fine += 1000; this.vio++; this.violationsLog.push('MOBILE_USE');
                    } else {
                      this.violationsLog.push('MOBILE_USE_WARNING');
                      toast('⚠️ Phone use while driving — first warning', '#f2b84b');
                    }
                    if (window.GameplayRecorder) GameplayRecorder.record('MOBILE_USE', { speed: Math.round(Math.abs(this.speed) * 100), score: this.score, fine: this.fine });
                  }
                  toast('📱 Phone use while driving! ₹1,000 fine', '#ef4444');
                });
                document.getElementById('phone-ignore')?.addEventListener('click', () => {
                  ringEl.style.display = 'none'; ringEl.style.animation = 'none';
                  this._phoneRinging = false; this._phoneDismissed = true;
                  toast('Good choice — ignore the phone! ✓', '#34d399');
                });
              }
            }
            if (this._phoneDismissed && this._phoneRingTimer < -5) { this._phoneDismissed = false; }

            // ── Zebra crossing yield prompt (H) ──
            if (!this.isPedestrian && Math.abs(this.speed) > 0.05 && this._zebraYieldCD <= 0) {
              const ints = this.mapCfg?.ints || [];
              const pp = this.player.position;
              for (const [ix, iz] of ints) {
                const dx = Math.abs(pp.x - ix), dz = Math.abs(pp.z - iz);
                if (dx < 8 && dz < 8) {
                  // Check if any pedestrian is near this crossing
                  const nearPed = this.peds?.some(p => p && Math.abs(p.position.x - ix) < 5 && Math.abs(p.position.z - iz) < 5);
                  if (nearPed) {
                    this._zebraYieldShown = true;
                    this._zebraYieldCD = 12;
                    let zp = document.getElementById('zebra-yield-prompt');
                    if (!zp) {
                      zp = document.createElement('div');
                      zp.id = 'zebra-yield-prompt';
                      zp.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);background:rgba(239,68,68,.92);color:#fff;padding:16px 28px;border-radius:14px;font-size:22px;z-index:10003;pointer-events:none;text-align:center;animation:zebra-flash .6s ease-in-out 3;box-shadow:0 0 25px rgba(239,68,68,.5);';
                      zp.innerHTML = '🚶 Zebra Crossing — Yield to Pedestrians! 🚶';
                      document.body.appendChild(zp);
                    } else { zp.style.display = 'block'; zp.style.animation = 'zebra-flash .6s ease-in-out 3'; }
                    setTimeout(() => { if (zp) zp.style.display = 'none'; }, 2500);
                    break;
                  }
                }
              }
            }
            if (this._zebraYieldCD > 0) this._zebraYieldCD -= dt;
            if (this._zebraYieldShown && this._zebraYieldCD <= 0) this._zebraYieldShown = false;

            // ── Road-sign recognition mini-tasks (C) ──
            if (!this.isPedestrian && Math.abs(this.speed) > 0.3 && this._roadSignCD <= 0) {
              const signs = this.mapCfg?.signs || [];
              const pp = this.player.position;
              for (const sign of signs) {
                const dx = Math.abs(pp.x - sign.x), dz = Math.abs(pp.z - sign.z);
                if (dx < 6 && dz < 6 && !sign._answered) {
                  this._roadSignCD = 15;
                  this._showRoadSignQuiz(sign);
                  break;
                }
              }
            }
            if (this._roadSignCD > 0) this._roadSignCD -= dt;

            // ── Overtaking safety check (I) ──
            if (!this.isPedestrian && this.turnSignal !== 0 && Math.abs(this.speed) > 0.3 && !this._overtakeCheckDone) {
              this._overtakeCheckDone = true;
              const pp = this.player.position;
              const fwd = this._v1.set(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
              let oncoming = false;
              for (const nv of this.npcs) {
                if (!nv || !nv.position) continue;
                const toNpc = this._v2.subVectors(nv.position, pp);
                const dot = toNpc.dot(fwd);
                if (dot > 0 && dot < 20) {
                  const npcSpeed = nv.userData?.speed || 0;
                  if (npcSpeed < -0.05) { oncoming = true; break; }
                }
              }
              if (oncoming) {
                toast('⚠️ Oncoming traffic detected! Check before overtaking.', '#ef4444');
                if (typeof sfx !== 'undefined' && sfx.play) sfx.play('error');
              }
            }
            if (this.turnSignal === 0 && this._overtakeCheckDone) this._overtakeCheckDone = false;

        // ── Animal crossing zones (A) ──
        if (!this.isPedestrian && this.mapCfg?.animalCrossings) {
          if (!this._animals) {
            this._animals = [];
            this._animalCrossCount = 0;
            this.mapCfg.animalCrossings.forEach(([ax, az]) => {
              const animalColors = [0x8B4513, 0xD2691E, 0xA0522D, 0x6B3A2A];
              const isCow = Math.random() > 0.4;
              const body = new THREE.Mesh(
                new THREE.BoxGeometry(isCow ? 1.2 : 0.8, isCow ? 0.9 : 0.6, isCow ? 2.0 : 1.4),
                new THREE.MeshPhongMaterial({ color: animalColors[Math.floor(Math.random() * animalColors.length)] })
              );
              body.position.set(ax + (Math.random() - 0.5) * 3, isCow ? 0.5 : 0.3, az + (Math.random() - 0.5) * 3);
              body.castShadow = true;
              body.userData = { crossing: true, ax, az, dir: Math.random() > 0.5 ? 1 : -1, crossed: false, speed: 0.3 + Math.random() * 0.2 };
              this.scene.add(body);
              this._animals.push(body);
            });
          }
          const pp = this.player.position;
          this._animals.forEach(a => {
            const adx = pp.x - a.position.x, adz = pp.z - a.position.z;
            const aDist = Math.sqrt(adx * adx + adz * adz);
            // Animate crossing when player is within 20 units
            if (aDist < 20 && !a.userData.crossed) {
              a.position.x += a.userData.dir * a.userData.speed * dt;
              if (Math.abs(a.position.x - a.userData.ax) > 6) { a.userData.crossed = true; }
            }
            // Stop + fine if player hits animal
            if (aDist < 2.5 && !a.userData.hit) {
              a.userData.hit = true;
              this.speed *= 0.1;
              if (typeof sfx !== 'undefined' && sfx.play) sfx.play('brake');
              toast('🐄 Animal crossing! Slow down and yield!', '#ff9500');
            }
            // Successful yield: player stops near animal
            if (aDist < 5 && aDist > 2.5 && Math.abs(this.speed) < 0.05 && !a.userData.counted) {
              a.userData.counted = true;
              this._animalCrossCount++;
              toast(`🐾 Animals yielded: ${this._animalCrossCount}/3`, '#34d399');
            }
          });
        }

        // ── Littering penalty system (B) ──
        if (!this.isPedestrian && !this._litterSpawned && this.playing) {
          this._litterSpawned = true;
          this._litters = [];
          // Spawn 5-8 random litter items along roads
          const litterCount = 5 + Math.floor(Math.random() * 4);
          for (let i = 0; i < litterCount; i++) {
            const roads = this.mapCfg?.roads || [];
            if (roads.length === 0) break;
            const r = roads[Math.floor(Math.random() * roads.length)];
            const lx = r.type === 'v' ? r.x + (Math.random() - 0.5) * 4 : (r.x1 || -50) + Math.random() * ((r.x2 || 50) - (r.x1 || -50));
            const lz = r.type === 'h' ? r.z + (Math.random() - 0.5) * 4 : (r.z1 || -50) + Math.random() * ((r.z2 || 50) - (r.z1 || -50));
            const litterTypes = [0.4, 0.3, 0.2]; // boxW, boxH, boxD
            const boxW = 0.4 + Math.random() * 0.3;
            const litter = new THREE.Mesh(
              new THREE.BoxGeometry(boxW, 0.15 + Math.random() * 0.2, boxW),
              new THREE.MeshPhongMaterial({ color: [0xffffff, 0x4488ff, 0xff6600, 0x88cc44][Math.floor(Math.random() * 4)] })
            );
            litter.position.set(lx, 0.1, lz);
            litter.rotation.y = Math.random() * Math.PI;
            litter.userData = { isLitter: true };
            this.scene.add(litter);
            this._litters.push(litter);
          }
        }
        // Check litter collision
        if (this._litters) {
          const pp = this.player.position;
          this._litters.forEach(l => {
            if (l.userData.hit) return;
            const dx = pp.x - l.position.x, dz = pp.z - l.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < 1.8 && Math.abs(this.speed) > 0.1) {
              l.userData.hit = true;
              this._litterHits++;
              this.vio++; this.violationsLog.push('LITTER_HIT'); this.score -= 15;
              toast(`🗑️ Litter hit! -15 pts (${this._litterHits} total)`, '#ff9500');
              if (typeof sfx !== 'undefined' && sfx.play) sfx.play('error');
              if (window.GameplayRecorder) GameplayRecorder.record('LITTER_HIT', { score: this.score });
            }
          });
        }

        // ── Police checkpoint stop-and-check (K) ──
        if (!this.isPedestrian && this.mapCfg?.policeCheckpoints) {
          if (!this._policeCheckpoints) {
            this._policeCheckpoints = [];
            this.mapCfg.policeCheckpoints.forEach(([cx, cz]) => {
              // Build a police officer NPC
              const cop = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8),
                new THREE.MeshPhongMaterial({ color: 0x000066 })
              );
              cop.position.set(cx, 0.9, cz);
              cop.castShadow = true;
              // Stop sign above cop
              const sign = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.8, 0.1),
                new THREE.MeshPhongMaterial({ color: 0xff0000 })
              );
              sign.position.set(cx, 2.2, cz);
              this.scene.add(cop, sign);
              this._policeCheckpoints.push({ cop, sign, cx, cz, triggered: false, cleared: false });
            });
          }
          const pp = this.player.position;
          this._policeCheckpoints.forEach(cp => {
            const dx = pp.x - cp.cx, dz = pp.z - cp.cz;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 12 && dist > 4 && !cp.triggered && !cp.cleared) {
              cp.triggered = true;
              toast('👮 Police checkpoint — Stop your vehicle!', '#3b82f6');
              if (typeof sfx !== 'undefined' && sfx.play) sfx.play('horn');
              this._policeStopActive = true;
              this._policeStopTimer = 0;
            }
            if (cp.triggered && !cp.cleared) {
              if (Math.abs(this.speed) < 0.02) {
                this._policeStopTimer += dt;
                if (this._policeStopTimer > 3) {
                  cp.cleared = true;
                  this._policeStopActive = false;
                  this._policeStopTimer = 0;
                  toast('✅ Checkpoint cleared! Drive safe.', '#34d399');
                  this.score += 20;
                }
              } else if (dist < 15 && this._policeStopTimer > 0.5 && Math.abs(this.speed) > 0.3) {
                // Tried to speed through
                cp.cleared = true;
                this._policeStopActive = false;
                this._policeStopTimer = 0;
                if (window.ui && window.ui.issueChallan) {
                  if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Fleeing Police Checkpoint', 'Sec 186 MV Act', '₹2,000', 'Checkpoint Evasion');
                  this.score -= 50; this.fine += 2000; this.vio++; this.violationsLog.push('CHECKPOINT_EVASION');
                }
                toast('🚨 You fled the checkpoint! ₹2,000 fine!', '#ef4444');
                if (window.GameplayRecorder) GameplayRecorder.record('CHECKPOINT_EVASION', { speed: Math.round(Math.abs(this.speed) * 100), score: this.score, fine: this.fine });
              }
            }
          });
        }
      }
    }

      _usigs(dt) {
        let nearestSig = null, nearestDist = 9999;
        this.sigs.forEach(sg => {
          const d = sg.userData;
          d.t = (d.t || 0) + dt;
          const cycle = 15.0; // 15s synchronized cycle: 6s Green, 1.5s Yellow, 7.5s Red
          const localTime = (d.t + (d.phaseOffset || 0)) % cycle;
          const prev = d.st;
          if (localTime < 6.0) d.st = 'green';
          else if (localTime < 7.5) d.st = 'yellow';
          else d.st = 'red';
          sg.state = d.st; // mirrored for NPCAI._getSignalAhead
          const r = sg.getObjectByName('red'), y = sg.getObjectByName('yellow'), g = sg.getObjectByName('green');
          if (r) {
            r.material.color.setHex(d.st === 'red' ? 0xff3b30 : 0x1a0505);
            if (r.material.emissive) r.material.emissive.setHex(d.st === 'red' ? 0xff2222 : 0x000000);
          }
          if (y) {
            y.material.color.setHex(d.st === 'yellow' ? 0xffd54a : 0x1a1605);
            if (y.material.emissive) y.material.emissive.setHex(d.st === 'yellow' ? 0xffaa00 : 0x000000);
          }
          if (g) {
            g.material.color.setHex(d.st === 'green' ? 0x00e676 : 0x051a08);
            if (g.material.emissive) g.material.emissive.setHex(d.st === 'green' ? 0x00c851 : 0x000000);
          }
          const pr = sg.getObjectByName('p_red'), pg = sg.getObjectByName('p_green');
          if (pr) pr.material.color.setHex(d.st === 'red' ? 0x1a0505 : 0xff3b30);
          if (pg) pg.material.color.setHex(d.st === 'red' ? 0x00e676 : 0x051a08);
          // Reset challan flag when signal turns green
          if (d.st === 'green' && prev !== 'green') this.challanFired.delete(sg.uuid);
          // Challan ONCE per red phase per signal
          const dist = this.player.position.distanceTo(sg.position);
          if (d.st === 'red' && dist < 6.5 && Math.abs(this.speed) > .18 && !this.challanFired.has(sg.uuid)) {
            this.challanFired.add(sg.uuid);
            
            // Check cumulative rules engine
            const _lvId = (ui.cur ? ui.cur.id : 1);
            const cumCheck = this.checkCumulativeViolation('red_light_stop', _lvId);
            if (cumCheck.enforce) {
              this.vio++; this.violationsLog.push('RED_LIGHT_VIOLATION'); this.fine += 500;
              this._triggerPoliceStrobe(); ui.issueChallan('Jumping red signal (repeat offense)', 'Section 119, MV Act', '₹500', 'Junction Sensor');
            } else {
              // First offense - warning
              this.violationsLog.push('RED_LIGHT_WARNING');
              toast('⚠️ Red light violation — first warning', '#f2b84b');
            }
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
      // Continuous building LOD, relative to the player's current position — replaces the
      // old one-time check that measured distance from world origin at level start (wrong
      // for any level where the player doesn't spawn near 0,0, and never re-evaluated as the
      // player actually drove around). Non-destructive (toggles .visible, doesn't
      // scene.remove()) so buildings correctly reappear if the player drives back toward
      // them, and only re-scans a slice of the scene every few frames rather than the whole
      // thing every frame.
      _updateDynamicLOD(lodMult = 1) {
        if (!this.player) return;
        this._lodFrame = (this._lodFrame || 0) + 1;
        if (this._lodFrame % 30 !== 0) return; // ~2x/sec at 60fps
        const px = this.player.position.x, pz = this.player.position.z;
        if (!this._lodChildren || this._lodFrame % 300 === 0) {
          this._lodChildren = this.scene.children.filter(c => c.isMesh || c.isInstancedMesh);
        }
        const baseDist = this._isMobile ? 350 : 500;
        const visDistSq = (baseDist * lodMult) * (baseDist * lodMult);
        const len = this._lodChildren.length;
        for (let i = 0; i < len; i++) {
          const child = this._lodChildren[i];
          if (!child || !child.position || child.userData?.noLod || child.userData?.isGround) continue;
          const dx = child.position.x - px, dz = child.position.z - pz;
          const dSq = dx * dx + dz * dz;
          const shouldShow = dSq < visDistSq;
          if (child.visible !== shouldShow) child.visible = shouldShow;
        }
      }

      // ── Google Maps-style animated GPS navigation path ──
      // Dashed animated line on the ground with flowing chevrons
      // ── GTA / Forza-style animated 3D GPS navigation road path ──
      // Prominent glowing chevrons and road ribbons flowing along the target lane
      _initBreadcrumbPath() {
        if (this._breadcrumbPath) {
          this.scene.remove(this._breadcrumbPath);
          this._breadcrumbPath = null;
        }
        if (this._gpsFlowChevrons) {
          this._gpsFlowChevrons.forEach(c => { this.scene.remove(c); c.traverse(ch => { ch.geometry?.dispose(); ch.material?.dispose(); }); });
        }
        if (this._gpsTurnLabels) {
          this._gpsTurnLabels.forEach(l => { this.scene.remove(l); l.material?.map?.dispose(); l.material?.dispose(); });
        }
        this._gpsFlowChevrons = [];
        this._gpsTurnLabels = [];
        this._gpsTurnSprites = {};
      }

      _updateBreadcrumbPath(dt) {
        if (this._breadcrumbPath) this._breadcrumbPath.visible = false;
        if (this._gpsFlowChevrons) this._gpsFlowChevrons.forEach(c => c.visible = false);
        if (this._gpsTurnLabels) this._gpsTurnLabels.forEach(l => { l.visible = false; });
      }


      _unpcs(dt) {
        if (!this.player || !this.player.position) return;
        // Delegate to TrafficManager for Mumbai-style traffic simulation
        if (this.trafficManager) {
          this.trafficManager.update(dt, this.player, this.sigs || []);
          // ── Real-time Traffic NPC to Player Physical Collision Pass ──
          if (this.player && this.trafficManager.vehicles) {
            const px = this.player.position.x, pz = this.player.position.z;
            const pR = 1.6;
            this.trafficManager.vehicles.forEach(v => {
              if (!v.active || !v.mesh) return;
              if (this._spawnInvulnerable > 0) return;
              const vx = v.position.x, vz = v.position.z;
              const dx = px - vx, dz = pz - vz;
              if (dx * dx + dz * dz < 18) {
                const overlapX = pR + 1.2 - Math.abs(dx);
                const overlapZ = pR + 2.0 - Math.abs(dz);
                if (overlapX > 0 && overlapZ > 0 && !v._justHit) {
                  v._justHit = true;
                  setTimeout(() => { v._justHit = false; }, 1200);
                  const dmg = this.seatbeltOn ? 10 : 20;
                  this.hp = Math.max(0, this.hp - dmg);
                  if (this.hp <= 0) this._go('Vehicle Crash');
                  else this._uh();
                  this.speed *= -0.3;
                  this._camShakeAmt = Math.max(this._camShakeAmt, 0.5);
                  if (overlapX < overlapZ) {
                    this.player.position.x += (dx > 0 ? overlapX + 0.2 : -(overlapX + 0.2));
                  } else {
                    this.player.position.z += (dz > 0 ? overlapZ + 0.2 : -(overlapZ + 0.2));
                  }
                  if (window.TrafficAudio) window.TrafficAudio.playCrash(1.4);
                  toast('💥 CRASH! Hit Traffic Vehicle! HP -' + dmg, '#ef4444', 3000);
                  this.violationsLog.push('TRAFFIC_COLLISION');
                  if (window.GameplayRecorder) GameplayRecorder.record('TRAFFIC_HIT', { hp: Math.round(this.hp) });
                }
              }
            });
          }
          return;
        }
        
        // Legacy NPC logic (fallback for pedestrian levels or if new system not loaded)
        // Spatial hash grid, rebuilt once per frame — every one of the proximity/obstacle
        // checks below only ever looks within 25 units, so bucketing NPCs into 25-unit cells
        // and searching the surrounding 3x3 neighborhood finds the exact same candidates as
        // scanning the full NPC list, just without checking every NPC against every other one.
        const _gridCell = 25;
        const _npcGrid = new Map();
        const _cellKey = (x, z) => Math.floor(x / _gridCell) + ',' + Math.floor(z / _gridCell);
        this.npcs.forEach(o => {
          const k = _cellKey(o.position.x, o.position.z);
          let bucket = _npcGrid.get(k);
          if (!bucket) { bucket = []; _npcGrid.set(k, bucket); }
          bucket.push(o);
        });
        const nearbyNpcs = (pos) => {
          const cx = Math.floor(pos.x / _gridCell), cz = Math.floor(pos.z / _gridCell);
          const out = [];
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              const bucket = _npcGrid.get((cx + dx) + ',' + (cz + dz));
              if (bucket) out.push(...bucket);
            }
          }
          return out;
        };

        this.npcs.forEach(n => {
          if (n.userData.spd !== undefined) {
            if (n.userData.laneT === undefined) { 
              n.userData.laneT = Math.random() * 5 + 3; 
              n.userData.txX = n.position.x; 
              n.userData.baseSpd = n.userData.spd; 
              n.userData.state = 'CRUISE';
              n.userData._stuckTimer = 0;
              n.userData._lastPos = n.position.clone();
              // Personality/aggression — GTA's driving AI varies per-driver rather than every
              // car reacting identically (Rockstar's own patent material describes a
              // "personality_aggressiveness" weight feeding the decision model; GTA6 trailer
              // footage specifically shows bikers overtaking trucks more assertively than
              // cars do). 0.7 = cautious/patient, 1.3 = assertive/impatient.
              n.userData.aggression = (n.userData.npcType === 'bike' || n.userData.npcType === 'cycle') ? (1.05 + Math.random() * 0.35)
                : 0.7 + Math.random() * 0.6;
            }

            // Stuck detection — wait and honk instead of teleporting
            if (!n.userData._lastPos) n.userData._lastPos = n.position.clone();
            const movedDist = n.position.distanceTo(n.userData._lastPos);
            if (movedDist < 0.1 && n.userData.state !== 'STOPPED') {
              n.userData._stuckTimer = (n.userData._stuckTimer || 0) + dt;
            } else {
              n.userData._stuckTimer = 0;
            }
            n.userData._lastPos.copy(n.position);
            if (n.userData._stuckTimer > 5) {
              // Instead of teleporting magically, just honk horn and wait
              if (Math.random() < 0.05 && window.sfx && window.sfx.play) {
                window.sfx.play('horn');
              }
              // Genuinely stuck (not just briefly waiting at a light) for 7+ seconds —
              // attempt one emergency lane nudge to route around whatever's blocking, rather
              // than sitting there honking forever. Early GTA-era traffic AI had exactly this
              // failure mode when blocked from the side; later entries gave stuck vehicles a
              // way to reroute instead of freezing permanently.
              if (n.userData._stuckTimer > 7) {
                if (n.userData.moveAxis && !n.userData.useRoute) {
                  const base = n.userData.baseCoord || 0;
                  const laneOffsets = [-4.8, -2.4, 0, 2.4, 4.8];
                  const curLane = n.userData.moveAxis === 'h' ? n.userData.txZ : n.userData.txX;
                  const curOffset = curLane != null ? curLane - base : 0;
                  const altOffset = laneOffsets.find(o => Math.abs(o - curOffset) > 0.5) ?? 0;
                  const alt = base + altOffset;
                  if (n.userData.moveAxis === 'h') n.userData.txZ = alt; else n.userData.txX = alt;
                  n.userData.laneT = Math.random() * 2 + 1;
                }
                n.userData._stuckTimer = 0;
              }
            }

            // Smooth route wrapping — lerp back to start over 1.2s instead of teleporting
            if (n.userData._wrapT > 0) {
              n.userData._wrapT -= dt;
              const p = Math.max(0, n.userData._wrapT / 1.2);
              if (n.userData.moveAxis === 'h') {
                n.position.x = n.userData._wrapFrom + (n.userData._wrapTo - n.userData._wrapFrom) * (1 - p);
                if (n.userData.txZ != null) n.position.z += (n.userData.txZ - n.position.z) * 0.08;
              } else {
                n.position.z = n.userData._wrapFrom + (n.userData._wrapTo - n.userData._wrapFrom) * (1 - p);
                if (n.userData.txX != null) n.position.x += (n.userData.txX - n.position.x) * 0.08;
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
            let myLane = n.userData.moveAxis === 'h' ? n.userData.txZ : n.userData.txX;

            if (distToPlayer < 200 && n.userData.moveAxis) {
              let fsm = {
                approachingObstacle: false,
                obstacleDist: 999,
                obstacleSpeed: 0,
                redLight: false,
                yellowLight: false,
                nearPedestrian: false  // Track if pedestrian is nearby for extra caution
              };

                // 1. Check Traffic Lights (Red + Yellow) — tightened to 15m
                // Works for both horizontal AND vertical NPCs
                this.sigs.forEach(sg => {
                  const isRed = sg.userData.st === 'red';
                  const isYellow = sg.userData.st === 'yellow';
                  if (isRed || isYellow) {
                    if (n.userData.moveAxis === 'h') {
                      // Horizontal NPC checking traffic light
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
                      // Vertical NPC checking traffic light (NEW)
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

              // 1.5 Yield to pedestrians on Zebra Crossings AND police volunteers
              // Enhanced: NPCs now detect pedestrians from further away and slow down more
              if (this.peds) {
                this.peds.forEach(ped => {
                  const dx = ped.position.x - n.position.x;
                  const dz = Math.abs(ped.position.z - n.position.z);
                  // For horizontal NPCs (move along X): check dx for ahead, dz for lateral
                  // For vertical NPCs (move along Z): check dz for ahead, dx for lateral
                  let isAhead, longDist, latDist;
                  if (n.userData.moveAxis === 'h') {
                    isAhead = dx * n.userData.dir > 0;
                    longDist = Math.abs(dx);
                    latDist = dz;
                  } else {
                    isAhead = (ped.position.z - n.position.z) * n.userData.dir > 0;
                    longDist = Math.abs(ped.position.z - n.position.z);
                    latDist = Math.abs(dx);
                  }
                  // Police volunteers have larger stop zone (40m) since they direct traffic
                  const isVolunteer = ped.userData && ped.userData.isPoliceVolunteer;
                  const maxDist = isVolunteer ? 40 : 30;
                  const maxLat = isVolunteer ? 8 : 5;
                  if (isAhead && longDist < maxDist && latDist < maxLat) {
                    fsm.approachingObstacle = true;
                    fsm.nearPedestrian = true;  // Mark pedestrian nearby
                    // For pedestrians, be more aggressive about stopping (yield zone is larger)
                    fsm.obstacleDist = Math.min(fsm.obstacleDist, longDist);
                  }
                });
              }

              // 2. Check Vehicles Ahead
              if (n.userData.moveAxis === 'h') {
                // Horizontal NPCs: check along X-axis
                nearbyNpcs(n.position).forEach(other => {
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
                // Check player for horizontal NPCs (works for both vehicle and pedestrian mode)
                if (this.player && this.player.position) {
                  const dx = this.player.position.x - n.position.x;
                  const dz = Math.abs(this.player.position.z - n.position.z);
                  // If player is pedestrian, be more lenient with lateral distance (they can be on sidewalks)
                  const lateralTol = this.isPedestrian ? 6 : 2.5;
                  if (dx * n.userData.dir > 0 && Math.abs(dx) < 30 && dz < lateralTol) {
                    fsm.approachingObstacle = true;
                    if (this.isPedestrian) fsm.nearPedestrian = true;  // Mark player-pedestrian
                    fsm.obstacleDist = Math.min(fsm.obstacleDist, Math.abs(dx));
                  }
                }
              } else {
              nearbyNpcs(n.position).forEach(other => {
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

                // Pedestrian detection for vertical NPCs is now handled in the general section above
                // 3. Check Player (vertical) — works for both vehicle and pedestrian mode
                if (this.player && this.player.position) {
                  const dz = this.player.position.z - n.position.z;
                  const dx = Math.abs(this.player.position.x - n.position.x);
                  // If player is pedestrian, be more lenient with lateral distance
                  const lateralTol = this.isPedestrian ? 6 : 2.5;
                  if (dz * n.userData.dir > 0 && Math.abs(dz) < 30 && dx < lateralTol) {
                    fsm.approachingObstacle = true;
                    if (this.isPedestrian) fsm.nearPedestrian = true;  // Mark player-pedestrian
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
                      n.userData.txX = (n.userData.baseCoord || 0) - 4.8; // Move to leftmost lane, relative to this NPC's own road
                    }
                  }
                }

                // State Transitions
                // Distances scale with the NPC's own speed (a driver going faster needs to
                // start reacting sooner — GTA5's vanilla AI was widely criticized, including
                // in community fixes, for using fixed react distances that caused sudden
                // last-second braking) and with personality (cautious drivers keep more
                // space; assertive ones tailgate closer and commit to overtakes sooner).
                const agg = n.userData.aggression || 1.0;
                const speedFactor = Math.abs(n.userData.spd) * 40; // extra lookahead at speed
                const stopDist = (fsm.nearPedestrian ? 15.0 : 11.0) / agg + speedFactor;
                const followDist = (fsm.nearPedestrian ? 35.0 : 30.0) / Math.sqrt(agg) + speedFactor;
                if (!yieldingToAmbulance) {
                  if (fsm.approachingObstacle && fsm.obstacleDist < stopDist) {
                    n.userData.state = 'STOPPED';
                  } else if (fsm.approachingObstacle && fsm.obstacleDist < followDist && fsm.yellowLight) {
                    n.userData.state = 'SLOW_DOWN';
                  } else if (fsm.approachingObstacle && fsm.obstacleDist < followDist && !fsm.redLight) {
                    n.userData.state = 'FOLLOW';
                    // Overtake Logic — assertive drivers (higher aggression) commit to an
                    // overtake attempt sooner instead of waiting the full patience window;
                    // this is also what lets bikes specifically pull out and pass slower
                    // traffic more readily, echoing the GTA6 trailer detail of bikers
                    // overtaking trucks by pulling into the oncoming lane rather than
                    // queueing behind them "on train tracks."
                    if (n.userData.laneT <= 0 || (agg > 1.1 && n.userData.laneT < 1.5 && Math.random() < 0.15)) {
                      const laneOffsets = [-4.8, -2.4, 0, 2.4, 4.8];
                      const base = n.userData.baseCoord || 0;
                      const lanes = laneOffsets.map(o => base + o);
                      let safeLanes = lanes.filter(l => Math.abs(l - myLane) <= 3.0 && l !== myLane);
                      
                      safeLanes = safeLanes.filter(l => {
                        let blocked = false;
                        nearbyNpcs(n.position).forEach(other => {
                          if (other !== n && Math.abs(other.position.x - l) < 2.5 && Math.abs(other.position.z - n.position.z) < 22 && (other.position.z - n.position.z)*n.userData.dir > -10) blocked = true;
                        });
                        // Check player blocking for lane changes - works in both vehicle and pedestrian mode
                        if (this.player && this.player.position) {
                          // Pedestrians are on sidewalks, less likely to block road lanes
                          const lateralTol = this.isPedestrian ? 3 : 2.5;
                          if (Math.abs(this.player.position.x - l) < lateralTol && Math.abs(this.player.position.z - n.position.z) < 25 && (this.player.position.z - n.position.z)*n.userData.dir > -10) blocked = true;
                        }
                        return !blocked;
                      });

                      if (safeLanes.length > 0) {
                        const newLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
                        if (n.userData.moveAxis === 'h') n.userData.txZ = newLane;
                        else n.userData.txX = newLane;
                        n.userData.laneT = Math.random() * 3 + 2;
                        n.userData.state = 'OVERTAKE';
                      }
                    }
                  } else {
                    n.userData.state = 'CRUISE';
                  }
                }

                // ── GREEN LIGHT BOOST: accelerate faster when just cleared a red light ──
                const wasStopped = n.userData._prevState === 'STOPPED';
                const greenBoost = wasStopped && n.userData.state === 'CRUISE';

                // Apply State Behavior — realistic braking & acceleration curves,
                // individually paced by each driver's aggression (0.7-1.4x reaction speed)
                switch(n.userData.state) {
                  case 'CRUISE':
                    // Boost acceleration if just cleared a red light
                    n.userData.spd += (n.userData.baseSpd - n.userData.spd) * (greenBoost ? 0.25 : 0.12) * agg;
                    break;
                  case 'FOLLOW':
                    let tgtSpd = Math.max(0, fsm.obstacleSpeed - 0.2);
                    n.userData.spd += (tgtSpd - n.userData.spd) * 0.15 * agg;
                    break;
                  case 'SLOW_DOWN':
                    n.userData.spd += (n.userData.baseSpd * 0.35 - n.userData.spd) * 0.18 * agg;
                    break;
                  case 'STOPPED':
                    n.userData.spd += (0 - n.userData.spd) * Math.min(0.4, 0.2 * agg);
                    break;
                  case 'OVERTAKE':
                    n.userData.spd += (n.userData.baseSpd * 1.2 - n.userData.spd) * 0.05 * agg;
                    break;
                  case 'YIELD_AMBULANCE':
                    n.userData.spd += (n.userData.baseSpd * 0.5 - n.userData.spd) * 0.05;
                    break;
                }

                // Store previous state for green light boost detection
                n.userData._prevState = n.userData.state;

                // ── RAIN SPEED REDUCTION: NPCs slow down in wet conditions ──
                const isRain = this.mapCfg && (this.mapCfg.hasRain || this.mapCfg.themeType === 'rain_driving' || this.mapCfg.themeType === 'puddle_etiquette' || this.mapCfg.themeType === 'night_monsoon' || this.mapCfg.themeType === 'zero_visibility');
                if (isRain && n.userData.state === 'CRUISE') {
                  // NPCs reduce speed by 20% in rain (matching player)
                  n.userData.spd = Math.min(n.userData.spd, n.userData.baseSpd * 0.8);
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

                // ── HORN HONK: random horn when stuck >3s OR when player blocks ──
                // Works for both vehicle and pedestrian mode - NPCs honk at pedestrians in their path too
                const isBlockedByPlayer = this.player && this.player.position &&
                  ((n.userData.moveAxis === 'h' && Math.abs(this.player.position.x - n.position.x) < 8 &&
                    Math.abs(this.player.position.z - n.position.z) < 15 && (this.player.position.x - n.position.x) * n.userData.dir > 0) ||
                   (n.userData.moveAxis !== 'h' && Math.abs(this.player.position.z - n.position.z) < 8 &&
                    Math.abs(this.player.position.x - n.position.x) < 15 && (this.player.position.z - n.position.z) * n.userData.dir > 0));

                if (n.userData.state === 'STOPPED' || isBlockedByPlayer) {
                  n.userData._stoppedTime = (n.userData._stoppedTime || 0) + dt;
                  // Honk more aggressively when player blocks (every 2s vs 3s)
                  const honkThreshold = isBlockedByPlayer ? 2 : 3;
                  if (n.userData._stoppedTime > honkThreshold && Math.random() < (isBlockedByPlayer ? 0.03 : 0.02) && window.sfx) {
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
              nearbyNpcs(n.position).forEach(other => {
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

              // Player (vehicle or pedestrian) - NPCs should detect both
              if (this.player && this.player.position) {
                const pdx = this.player.position.x - n.position.x;
                const pdz = this.player.position.z - n.position.z;
                // More lenient lateral distance for pedestrians (on sidewalks)
                const lateralTol = this.isPedestrian ? 6 : 3;
                if (isSegV) {
                  if (pdz * segDirZ > 0 && Math.abs(pdz) < 30 && Math.abs(pdx) < lateralTol) {
                    rfsm.approachingObstacle = true;
                    rfsm.obstacleDist = Math.min(rfsm.obstacleDist, Math.abs(pdz));
                  }
                } else {
                  if (pdx * segDirX > 0 && Math.abs(pdx) < 30 && Math.abs(pdz) < lateralTol) {
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
              this._v1.set(tX - n.position.x, 0, tZ - n.position.z).normalize();
              
              // Smooth rotation - turn faster if moving faster
              let targetYaw = Math.atan2(this._v1.x, this._v1.z);
              let diff = targetYaw - n.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              const turnSpeed = Math.min(1.0, dt * 60 * Math.max(0.1, n.userData.spd * 0.5));
              n.rotation.y += diff * turnSpeed;
              
              // Move forward in the direction the car is ACTUALLY facing to prevent crab-walking
              const moveDist = n.userData.spd * 35 * dt;
              n.position.x += Math.sin(n.rotation.y) * moveDist;
              n.position.z += Math.cos(n.rotation.y) * moveDist;
              
              this._v2.set(tX, 0, tZ);
              // Larger hit radius to prevent orbiting the waypoint endlessly
              if (n.position.distanceTo(this._v2) < 6.5) {
                n.userData.routeIdx = (idx + 1) % rt.length;
              }
            } else {
              if (n.userData.moveAxis === 'h') {
                // Lateral repulsion for horizontal NPCs (push apart on z-axis)
                nearbyNpcs(n.position).forEach(other => {
                  if (other !== n) {
                    const dLateral = Math.abs(other.position.z - n.position.z);
                    const dForward = Math.abs(other.position.x - n.position.x);
                    if (dLateral < 2.2 && dForward < 5) {
                      const push = (other.position.z - n.position.z) > 0 ? -0.12 : 0.12;
                      if (n.userData.txZ !== undefined) n.userData.txZ += push;
                    }
                  }
                });
                
                if (n.userData.txZ !== undefined) {
                  n.userData.txZ = Math.max(-6, Math.min(6, n.userData.txZ));
                  const latBlend = 1 - Math.exp(-dt * 9.0);
                  n.position.z += (n.userData.txZ - n.position.z) * latBlend;
                  
                  let yawT = (n.userData.dir === 1) ? Math.PI / 2 : -Math.PI / 2;
                  yawT -= (n.userData.txZ - n.position.z) * 0.1 * n.userData.dir;
                  let diff = yawT - n.rotation.y;
                  while (diff < -Math.PI) diff += Math.PI * 2;
                  while (diff > Math.PI) diff -= Math.PI * 2;
                  const yawBlend = 1 - Math.exp(-dt * 12.0);
                  n.rotation.y += diff * yawBlend;
                }

                n.position.x += n.userData.spd * 35 * dt * n.userData.dir; 
                if (n.position.x > n.userData.maxPos && n.userData.dir === 1) {
                  n.userData._wrapT = 1.2;
                  n.userData._wrapFrom = n.position.x;
                  n.userData._wrapTo = n.userData.minPos;
                  if (n.userData.baseCoord !== undefined && n.userData.laneOffset !== undefined) n.userData.txZ = n.userData.baseCoord + n.userData.laneOffset;
                  n.userData.state = 'CRUISE';
                }
                if (n.position.x < n.userData.minPos && n.userData.dir === -1) {
                  n.userData._wrapT = 1.2;
                  n.userData._wrapFrom = n.position.x;
                  n.userData._wrapTo = n.userData.maxPos;
                  if (n.userData.baseCoord !== undefined && n.userData.laneOffset !== undefined) n.userData.txZ = n.userData.baseCoord + n.userData.laneOffset;
                  n.userData.state = 'CRUISE';
                }
              } else {
                // Lateral repulsion — push NPCs apart if too close on cross-axis
                nearbyNpcs(n.position).forEach(other => {
                  if (other !== n) {
                    const dLateral = Math.abs(other.position.x - n.position.x);
                    const dForward = Math.abs(other.position.z - n.position.z);
                    if (dLateral < 2.2 && dForward < 5) {
                      const push = (other.position.x - n.position.x) > 0 ? -0.12 : 0.12;
                      if (n.userData.txX !== undefined) n.userData.txX += push;
                    }
                  }
                });
                n.userData.txX = Math.max(-6, Math.min(6, n.userData.txX));
                const latBlend = 1 - Math.exp(-dt * 9.0);
                n.position.x += (n.userData.txX - n.position.x) * latBlend;
                let yawT = Math.atan2(n.userData.txX - n.position.x, 8) * 0.5;
                if (n.userData.dir === -1) yawT += Math.PI;
                let diff = yawT - n.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const yawBlend = 1 - Math.exp(-dt * 12.0);
                n.rotation.y += diff * yawBlend;
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
                   if (this._triggerPoliceStrobe) this._triggerPoliceStrobe(); ui.issueChallan('Blocking Emergency Vehicle', 'Sec 194E MV Act', '₹10,000', 'Emergency Priority');
                 }
                 n.userData.blockTimer = -10; // Prevent spamming
               }
            } else {
               n.userData.blockTimer = 0;
            }
          }
          
          // Player Collision
          // Handle both vehicle mode and pedestrian mode (instant fail when hit as pedestrian)
          if (this.player.position.distanceTo(n.position) < 2.2) {
            if (this.isPedestrian) {
              // Pedestrian hit by vehicle - instant failure
              this.hp = 0;
              this._showIRLDeathPopup(n.userData.npcType || 'Vehicle');
              toast('🚨 HIT BY VEHICLE!', '#ff3b30');
            } else {
              // Vehicle collision — enhanced crash impact system
              const impactSpeed = Math.abs(this.speed);
              const seatbeltReduction = this.seatbeltOn ? 0.6 : 1.0;
              const speedDamage = Math.min(impactSpeed * 30, 25) * seatbeltReduction;
              this.hp -= 5 + speedDamage;
              if (this.hp <= 0) this._go('Collided with ' + (n.userData.npcType || 'Vehicle'));
              else this._uh();
              // Directional bounce + sparks + debris + hitstop
              this._applyCrashImpact(n.position, impactSpeed);
              if(window.sfx) window.sfx.play('error');
              if (this.player) this._spawnSkidMark(this.player.position.x, this.player.position.z, this.player.rotation.y, impactSpeed * 3);
              toast('💥 Collision! ' + (impactSpeed > 0.6 ? 'SEVERE' : 'Minor') + ' Impact', '#ff3b30');
              this._collidedThisFrame = true;
              if (window.GameplayRecorder) GameplayRecorder.record('COLLISION', { speed: Math.round(impactSpeed * 100), npcType: n.userData.npcType, score: this.score, hp: Math.round(this.hp), impactIntensity: Math.round(impactSpeed * 100) });

              // ── J. Road-rage NPC reaction ──
              if (!this._roadRageCD || this._roadRageCD <= 0) {
                this._roadRageCD = 8;
                // Screen flash red
                let flash = document.getElementById('rage-flash');
                if (!flash) { flash = document.createElement('div'); flash.id = 'rage-flash'; flash.style.cssText = 'position:fixed;inset:0;background:red;z-index:9999;pointer-events:none;opacity:0;transition:opacity .3s'; document.body.appendChild(flash); }
                flash.style.opacity = '0.35';
                setTimeout(() => { flash.style.opacity = '0'; }, 300);
                // Aggressive honk SFX
                if (typeof sfx !== 'undefined' && sfx.play) sfx.play('horn');
                // NPC flashes (tint red briefly)
                const origColor = n.material?.color?.getHex();
                if (n.material) { n.material.emissive?.setHex(0xff0000); setTimeout(() => { n.material.emissive?.setHex(0x000000); }, 1500); }
                toast('😠 Road rage! NPC is angry!', '#ef4444');
                this.score -= 10;
              }
            }
          }

          // ── NPC-to-PEDESTRIAN COLLISION ──
          // NPCs can hit pedestrians - push pedestrian and slow down NPC
          if (this.peds) {
            this.peds.forEach(ped => {
              if (!ped.userData) return;
              const npcPedDist = n.position.distanceTo(ped.position);
              const npcRadius = n.userData?.halfD || 2;
              const pedRadius = 0.8;
              if (npcPedDist < npcRadius + pedRadius) {
                // Push pedestrian away from NPC
                const pushDir = this._v3.subVectors(ped.position, n.position).normalize();
                ped.position.x += pushDir.x * 1.5;
                ped.position.z += pushDir.z * 1.5;
                // Set pedestrian to fleeing state
                ped.userData.aiState = 'fleeing';
                ped.userData.fleeTimer = 0;
                // Slow down NPC slightly
                n.userData.spd *= 0.7;
                // Visual feedback
                if (Math.random() < 0.1) {
                  toast('⚠️ Pedestrian nearly hit!', '#ff9500');
                }
              }
            });
          }
        });
      }
      _upeds(dt) {
        if (!this.player || !this.player.position) return;
        if (!this.peds) this.peds = [];
        if (!this.pedestrianAIs) this.pedestrianAIs = [];
        if (this._isMobile) {
          this.peds.forEach(p => {
            if (!p || !p.position) return;
            if (p.position.distanceToSquared(this.player.position) > 62500) {
              p.visible = false;
              return;
            }
            p.visible = true;
          });
        }
        // Update PedestrianAI instances for intelligent behavior
        if (typeof PedestrianAI !== 'undefined') {
          for (let i = 0; i < this.peds.length; i++) {
            const p = this.peds[i];
            if (p && !p._pedAI) {
              const ai = new PedestrianAI(p, this.trafficManager);
              this.pedestrianAIs.push(ai);
              p._pedAI = ai;
            }
          }
          for (let i = this.pedestrianAIs.length - 1; i >= 0; i--) {
            const ai = this.pedestrianAIs[i];
            if (!ai || !ai.ped || !ai.ped.visible) continue;
            ai.update(dt, this.npcs, this.playerVehicle || this.player);
          }
        }
        
        // Count nearby pedestrians for task tracking
        this._nearbyPedCount = 0;
        this.peds.forEach(p => {
          if (!p || !p.position) return;
          if (this.player.position.distanceTo(p.position) < 8) this._nearbyPedCount++;
        });
        
        // Despawn far pedestrians (Phase 7: hide instead of destroy, reuse later)
        if (!this._pedFree) this._pedFree = [];
        const isFest = this.mapCfg && (this.mapCfg.crowdFestival || this.mapCfg.themeType === 'festival');
        for (let i = this.peds.length - 1; i >= 0; i--) {
          const p = this.peds[i];
          if (!p || !p.position) {
            this.peds[i] = this.peds[this.peds.length - 1]; this.peds.pop();
            continue;
          }
          if (p.userData?.isChild || p.userData?.isGuard || p.userData?.noDespawn) continue;
          const despawnDist = isFest ? 200 : 100;
          if (p.position.distanceTo(this.player.position) > despawnDist) {
            this.scene.remove(p);
            this.peds[i] = this.peds[this.peds.length - 1]; this.peds.pop();
            p.visible = false;
            // Clean up PedestrianAI instance if attached
            if (p._pedAI) {
              const aiIdx = this.pedestrianAIs.indexOf(p._pedAI);
              if (aiIdx !== -1) this.pedestrianAIs.splice(aiIdx, 1);
              p._pedAI = null;
            }
            this._pedFree.push(p);
          }
        }

        // Spawn new pedestrians dynamically
        const isFestCrowd = this.mapCfg && (this.mapCfg.crowdFestival || this.mapCfg.themeType === 'festival');
        const maxPeds = isFestCrowd ? (this._isMobile ? 40 : 140) : ((this.mapCfg && this.mapCfg.isPedestrian) ? 45 : (this._isMobile ? 24 : 48));
        const pedSpawnRate = isFestCrowd ? 0.9 : 0.6;
        if (this.peds.length < maxPeds && Math.random() < pedSpawnRate && this.mapCfg && this.mapCfg.roads && this.mapCfg.roads.length > 0) {
          const r = this.mapCfg.roads[Math.floor(Math.random() * this.mapCfg.roads.length)];
          const isV = r.type === 'v';
          const rx = isV ? r.x : Math.min(r.x1, r.x2) + Math.random() * Math.abs(r.x2 - r.x1);
          const rz = isV ? Math.min(r.z1, r.z2) + Math.random() * Math.abs(r.z2 - r.z1) : r.z;
          
          const distToPlayer = Math.hypot(rx - this.player.position.x, rz - this.player.position.z);
          // Spawn in a lively activity radius around the player
          const spawnMin = isFestCrowd ? 15 : 20;
          const spawnMax = isFestCrowd ? 160 : 95;
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
            // Preserve FBX animation properties from _buildHuman()
            const savedMixer = ped.userData.mixer;
            const savedIdle = ped.userData.idleAction;
            const savedRun = ped.userData.runAction;
            const savedFBXAnim = ped.userData.isFBXAnimated;
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
            // Restore FBX animation properties
            if (savedFBXAnim) {
              ped.userData.mixer = savedMixer;
              ped.userData.idleAction = savedIdle;
              ped.userData.runAction = savedRun;
              ped.userData.isFBXAnimated = true;
            }
            
            if (exiting) {
              if (isV) ped.rotation.y = side > 0 ? -Math.PI/2 : Math.PI/2;
              else ped.rotation.y = side > 0 ? Math.PI : 0;
            } else {
              ped.rotation.y = isV ? (ped.userData.dir > 0 ? 0 : Math.PI) : (ped.userData.dir > 0 ? Math.PI/2 : -Math.PI/2);
            }

            ped.frustumCulled = true;
            this.scene.add(ped);
            this.peds.push(ped);
            // Attach PedestrianAI for all dynamically spawned pedestrians
            if (typeof PedestrianAI !== 'undefined' && !ped._pedAI) {
              const pedAI = new PedestrianAI(ped, this.trafficManager);
              // Use appropriate profile based on theme
              if (isFestCrowd) { pedAI.profileKey = 'rusher'; pedAI.profile = PED_PROFILES.rusher; }
              else if (this.mapCfg && this.mapCfg.hasRain) { pedAI.profileKey = 'cautious'; pedAI.profile = PED_PROFILES.cautious; }
              else if (this.mapCfg && this.mapCfg.hasSchool) { pedAI.profileKey = 'child'; pedAI.profile = PED_PROFILES.child; }
              this.pedestrianAIs.push(pedAI); ped._pedAI = pedAI;
            }
          }
        }

        // ═══════════════════════════════════════════════════════════════
        // COMPREHENSIVE PEDESTRIAN AI SYSTEM
        // State Machine: IDLE → WALKING → WAITING → CROSSING → FLEEING → ENTERING
        // ═══════════════════════════════════════════════════════════════

        // ── DYNAMIC MUMBAI JAYWALKER HAZARD IN PLAYER'S TRAVEL DIRECTION ──
        if (!this._jaywalkerCooldown) this._jaywalkerCooldown = 8;
        this._jaywalkerCooldown -= dt;
        if (this._jaywalkerCooldown <= 0 && this.player && !this.isPedestrian && Math.abs(this.speed || 0) > 2) {
          const pFwdX = -Math.sin(this.player.rotation.y);
          const pFwdZ = -Math.cos(this.player.rotation.y);
          
          // Find an eligible pedestrian ahead of player (20m - 45m in forward driving direction)
          const eligible = this.peds.filter(p => {
            if (!p || !p.userData || p.userData.aiState === 'crossing' || p.userData.aiState === 'fleeing') return false;
            const dx = p.position.x - this.player.position.x;
            const dz = p.position.z - this.player.position.z;
            const fwdDist = dx * pFwdX + dz * pFwdZ;
            const latDist = Math.abs(-dx * pFwdZ + dz * pFwdX);
            return fwdDist > 20 && fwdDist < 45 && latDist < 18;
          });

          if (eligible.length > 0) {
            const jay = eligible[Math.floor(Math.random() * eligible.length)];
            const jud = jay.userData;
            const otherSide = -jud.side;
            const crossOffset = otherSide * (jud.targetDist || (18 / 2 + 1.25));
            jud.aiState = 'crossing';
            jud.state = 'crossing';
            jud.spd = 0.55; // Brisk walk across traffic
            jud.crossTarget = {
              x: jud.isV ? jud.roadC + crossOffset : jay.position.x,
              z: jud.isV ? jay.position.z : jud.roadC + crossOffset
            };
            jud.crossRoadCenter = jud.roadC;
            jud.crossTargetDist = Math.abs(crossOffset);
            this._jaywalkerCooldown = 18 + Math.random() * 12; // 18-30s between jaywalkers
          }
        }

        // Helper: Check traffic light state for crossing pedestrians
        const _checkTrafficLight = (pedPos, game) => {
          if (!game.sigs || game.sigs.length === 0) return { shouldWait: false, signalState: 'none' };

          for (const sig of game.sigs) {
            const sigDist = pedPos.distanceTo(sig.position);
            // Check if signal is nearby (within crossing distance)
            if (sigDist < 15) {
              const sigState = sig.userData?.st || 'green';
              // Pedestrians can cross on green, but should wait on red
              if (sigState === 'red') {
                return { shouldWait: true, signalState: 'red' };
              }
            }
          }
          return { shouldWait: false, signalState: 'green' };
        };

        // Helper: Find nearest intersection to a position (for crosswalk crossing)
        const _nearestIntersection = (px, pz, ints) => {
          if (!ints || ints.length === 0) return null;
          let best = null, bestD = Infinity;
          for (const [ix, iz] of ints) {
            const d = Math.hypot(px - ix, pz - iz);
            if (d < bestD) { bestD = d; best = [ix, iz]; }
          }
          return bestD < 30 ? best : null; // Only if within 30 units
        };

        // Helper: Check for approaching vehicles (player + NPCs)
        const _checkVehicleApproaching = (ped, game) => {
          let approaching = false;
          let threatDir = null;
          let minDist = Infinity;

          // Check player vehicle
          if (game.player && !game.isPedestrian && game.speed && Math.abs(game.speed) > 0.1) {
            const pvDist = game.player.position.distanceTo(ped.position);
            if (pvDist < 30 && pvDist < minDist) {
              const isV = ped.userData.isV;
              const pedDir = ped.userData.dir;
              const approachingDir = isV
                ? (game.player.position.z - ped.position.z) * pedDir
                : (game.player.position.x - ped.position.x) * pedDir;
              if (approachingDir > 0 && pvDist < 25) {
                approaching = true;
                threatDir = game.player.position.clone();
                minDist = pvDist;
              }
            }
          }

          // Check NPC vehicles
          if (!approaching && game.npcs) {
            for (const n of game.npcs) {
              if (!n.userData || !n.userData.spd || Math.abs(n.userData.spd) < 0.05) continue;
              const npcDist = n.position.distanceTo(ped.position);
              if (npcDist < 30 && npcDist < minDist) {
                const isV = ped.userData.isV;
                const pedDir = ped.userData.dir;
                const approachingDir = isV
                  ? (n.position.z - ped.position.z) * pedDir
                  : (n.position.x - ped.position.x) * pedDir;
                if (approachingDir > 0 && npcDist < 20) {
                  approaching = true;
                  threatDir = n.position.clone();
                  minDist = npcDist;
                  break;
                }
              }
            }
          }

          return { approaching, threatDir, dist: minDist };
        };

        // Helper: Get safe escape direction from vehicle
        const _getFleeVector = (pedPos, threatPos, sidewalkSide) => {
          const fleeDir = this._v1.subVectors(pedPos, threatPos).normalize();
          // Push toward sidewalk (away from road)
          fleeDir.y = 0;
          if (sidewalkSide) {
            // Add lateral push toward sidewalk
            const lateral = this._v3.set(-fleeDir.z, 0, fleeDir.x).multiplyScalar(sidewalkSide * 0.5);
            fleeDir.add(lateral).normalize();
          }
          return fleeDir;
        };

        // ═══════════════════════════════════════════════════════════════
        // MAIN PEDESTRIAN UPDATE LOOP
        // ═══════════════════════════════════════════════════════════════
        this.peds.forEach(p => {
          const ud = p.userData;
          if (!ud) return;
          if (p._pedAI) {
            // Cleanly delegated to PedestrianAI instance - avoid conflicting position overwrites
            return;
          }

          if (ud.isChild) {
            ud.t = (ud.t || 0) + dt * (ud.spd || 0.03);
            const targetX = ud.targetX || 7.5;
            const dirX = targetX > p.position.x ? 1 : -1;
            p.position.x += dirX * (ud.spd || 0.03) * 60 * dt;
            p.rotation.y = dirX > 0 ? Math.PI / 2 : -Math.PI / 2;
            if (Math.abs(p.position.x - targetX) < 0.4) {
              ud.targetX = targetX > 0 ? -7.5 : 7.5;
            }
            const lLeg = p.children && p.children.find(c => c.name === 'lLeg');
            const rLeg = p.children && p.children.find(c => c.name === 'rLeg');
            if (lLeg && rLeg) {
              lLeg.rotation.x = Math.sin(ud.t * 8) * 0.45;
              rLeg.rotation.x = -Math.sin(ud.t * 8) * 0.45;
            }
            return;
          }

          // Initialize pedestrian AI state if needed
          p.userData.aiState = p.userData.aiState || 'walking'; // walking, idle, waiting, crossing, fleeing, exiting, entering
          p.userData.t += dt * p.userData.spd;

          const isPoliceVolunteer = p.userData.isPoliceVolunteer;

          // ── BOUNDARY ENFORCEMENT: Keep pedestrians on sidewalks AND within world ──
          // Enforce lateral bounds (sidewalk width)
          const sidewalkMin = ud.roadC - ud.targetDist - 2; // Inner edge
          const sidewalkMax = ud.roadC + ud.targetDist + 2;  // Outer edge

          // World boundary limits (keep pedestrians within playable area)
          const WORLD_BOUND = 150;

          if (ud.isV) {
            // Vertical road - enforce X bounds
            if (p.position.x < sidewalkMin) p.position.x = sidewalkMin;
            if (p.position.x > sidewalkMax) p.position.x = sidewalkMax;
            // Enforce world bounds
            if (p.position.z < -WORLD_BOUND) p.position.z = -WORLD_BOUND;
            if (p.position.z > WORLD_BOUND) p.position.z = WORLD_BOUND;
          } else {
            // Horizontal road - enforce Z bounds
            if (p.position.z < sidewalkMin) p.position.z = sidewalkMin;
            if (p.position.z > sidewalkMax) p.position.z = sidewalkMax;
            // Enforce world bounds
            if (p.position.x < -WORLD_BOUND) p.position.x = -WORLD_BOUND;
            if (p.position.x > WORLD_BOUND) p.position.x = WORLD_BOUND;
          }

          // ── VEHICLE THREAT DETECTION: Check for nearby vehicles ──
          const vehicleCheck = _checkVehicleApproaching(p, this);
          const threatDist = vehicleCheck.dist;
          const isThreatClose = threatDist < 12;

          // ── STATE MACHINE ──

          // STATE: FLEEING (highest priority) - Vehicle very close
          if (isThreatClose && ud.aiState !== 'fleeing' && ud.aiState !== 'exiting' && ud.aiState !== 'entering') {
            ud.aiState = 'fleeing';
            ud.fleeTimer = 0;
          }

          if (ud.aiState === 'fleeing') {
            ud.fleeTimer += dt;
            if (vehicleCheck.approaching && threatDist < 10) {
              // Active flee - run away from threat
              const fleeVec = _getFleeVector(p.position, vehicleCheck.threatDir, ud.side);
              const fleeSpeed = 4.5; // Faster than walking when fleeing
              p.position.x += fleeVec.x * dt * fleeSpeed;
              p.position.z += fleeVec.z * dt * fleeSpeed;
              // Face away from threat
              p.rotation.y = Math.atan2(-fleeVec.x, -fleeVec.z);
            } else if (ud.fleeTimer > 1.5) {
              // Threat passed, return to walking after brief pause
              ud.aiState = 'walking';
              ud.fleeTimer = 0;
            }
            // Skip other states while fleeing
            return;
          }

          // STATE: EXITING BUILDING
          if (ud.state === 'exiting') {
            ud.aiState = 'exiting';
            const moveSpeed = ud.spd * 3.5;
            if (ud.isV) {
              p.position.x += -ud.side * dt * moveSpeed;
              if (Math.abs(p.position.x - ud.roadC) <= ud.targetDist) {
                p.position.x = ud.roadC + ud.side * ud.targetDist;
                ud.state = 'sidewalk';
                ud.aiState = 'walking';
                p.rotation.y = ud.dir > 0 ? 0 : Math.PI;
                ud.startZ = p.position.z;
                ud.destDist = 10 + Math.random() * 20;
                ud.distTraveled = 0;
              }
            } else {
              p.position.z += -ud.side * dt * moveSpeed;
              if (Math.abs(p.position.z - ud.roadC) <= ud.targetDist) {
                p.position.z = ud.roadC + ud.side * ud.targetDist;
                ud.state = 'sidewalk';
                ud.aiState = 'walking';
                p.rotation.y = ud.dir > 0 ? Math.PI/2 : -Math.PI/2;
                ud.startZ = p.position.x;
                ud.destDist = 10 + Math.random() * 20;
                ud.distTraveled = 0;
              }
            }
            return;
          }

          // STATE: WAITING (at crosswalk, checking for vehicles AND traffic lights)
          // Check traffic light state first
          const trafficLightCheck = _checkTrafficLight(p.position, this);
          const shouldWaitForLight = trafficLightCheck.shouldWait && ud.aiState !== 'fleeing';

          if (ud.aiState !== 'crossing' && (shouldWaitForLight || (vehicleCheck.approaching && ud.aiState !== 'idle' && ud.aiState !== 'entering'))) {
            ud.aiState = 'waiting';
            ud.waitTimer = (ud.waitTimer || 0) + dt;
            // Look toward approaching vehicle
            if (vehicleCheck.threatDir) {
              p.rotation.y = Math.atan2(
                vehicleCheck.threatDir.x - p.position.x,
                vehicleCheck.threatDir.z - p.position.z
              );
            }
            // Stop movement while waiting
            return;
          }
          // Was waiting for crossing and light is now green — proceed to cross
          if (ud._crossPending && ud.aiState === 'waiting') {
            ud._crossPending = false;
            ud.aiState = 'crossing';
            ud.state = 'crossing';
            return;
          }

          // STATE: CROSSING (crossing the road perpendicular to traffic)
          if (ud.aiState === 'crossing') {
            const cx = ud.crossTarget.x - p.position.x;
            const cz = ud.crossTarget.z - p.position.z;
            const crossDist = Math.sqrt(cx * cx + cz * cz);
            if (crossDist < 1.0) {
              // Reached the other side — resume walking on new sidewalk
              ud.aiState = 'walking';
              ud.state = 'sidewalk';
              ud.side = -ud.side; // Now on opposite side
              ud.roadC = ud.crossRoadCenter;
              ud.targetDist = ud.crossTargetDist;
              ud.dir = Math.random() > 0.5 ? 1 : -1;
              ud.distTraveled = 0;
              ud.destDist = 15 + Math.random() * 25;
              p.rotation.y = ud.isV
                ? (ud.dir > 0 ? 0 : Math.PI)
                : (ud.dir > 0 ? Math.PI/2 : -Math.PI/2);
            } else {
              // Move toward crossing target
              const crossSpeed = ud.spd * 2.5; // Slower than walking when crossing
              p.position.x += (cx / crossDist) * crossSpeed * dt;
              p.position.z += (cz / crossDist) * crossSpeed * dt;
              // Face crossing direction
              p.rotation.y = Math.atan2(cx, cz);
              // Check for approaching vehicles mid-crossing — freeze if danger
              const midCheck = _checkVehicleApproaching(p, this);
              if (midCheck.approaching && midCheck.dist < 15) {
                ud.aiState = 'waiting';
                ud.waitTimer = 0;
                ud._crossPending = true; // Remember to resume crossing after
              }
            }
            return;
          }

          // STATE: IDLE (phone, look around, rest)
          // Skip idle for police volunteer
          if (!ud._idleState && !isPoliceVolunteer && ud.aiState === 'walking') {
            ud._idleTimer = (ud._idleTimer !== undefined ? ud._idleTimer : Math.random() * 8);
            ud._idleTimer -= dt;
            if (ud._idleTimer <= 0) {
              const idleRoll = Math.random();
              if (idleRoll < 0.30) {
                ud._idleState = true;
                ud._idleDur = 2 + Math.random() * 4;
                ud._idleType = 'phone';
              } else if (idleRoll < 0.50) {
                ud._idleState = true;
                ud._idleDur = 2 + Math.random() * 5;
                ud._idleType = 'look';
              } else {
                ud._idleTimer = 6 + Math.random() * 12;
              }
            }
          }

          if (ud._idleState) {
            ud.aiState = 'idle';
            ud._idleDur -= dt;
            // Animate based on idle type
            if (ud._idleType === 'phone') {
              p.rotation.y += Math.sin(ud.t * 2.5) * 0.003;
            } else if (ud._idleType === 'look') {
              // Look left-right periodically
              p.rotation.y += Math.sin(ud.t * 0.8) * 0.004;
            }
            if (ud._idleDur <= 0) {
              ud._idleState = false;
              ud._idleTimer = 4 + Math.random() * 10;
              ud.aiState = 'walking';
            }
            // Skip walking while idle
            return;
          }

          // STATE: WALKING (default: strictly locked to sidewalk centerline)
          ud.aiState = 'walking';
          const walkSpeed = ud.spd * 3.5;
          const moveAmt = walkSpeed * dt;

          // Lock lateral position strictly to sidewalk centerline
          const targetSidewalk = ud.roadC + (ud.side > 0 ? ud.targetDist : -ud.targetDist);
          if (ud.isV) {
            p.position.x += (targetSidewalk - p.position.x) * 0.15;
            p.position.z += ud.dir * moveAmt;
            ud.distTraveled += moveAmt;
          } else {
            p.position.z += (targetSidewalk - p.position.z) * 0.15;
            p.position.x += ud.dir * moveAmt;
            ud.distTraveled += moveAmt;
          }

          // Reverse direction at destination — or cross the road
          if (ud.distTraveled >= ud.destDist) {
            // ~25% chance to cross the road (more likely at intersections)
            const ints = this.mapCfg && this.mapCfg.ints;
            const nearInt = _nearestIntersection(p.position.x, p.position.z, ints);
            const crossChance = nearInt ? 0.45 : 0.2;
            if (Math.random() < crossChance) {
              // Calculate crossing target on the other side of the road
              const isV = ud.isV;
              const roadC = isV ? ud.roadC : ud.roadC;
              const otherSide = -ud.side;
              const crossOffset = otherSide * (18 / 2 + 1.25); // Sidewalk center distance
              let targetX, targetZ;
              if (isV) {
                targetX = roadC + crossOffset;
                targetZ = p.position.z; // Move perpendicular (X-axis) while keeping Z
              } else {
                targetX = p.position.x; // Move perpendicular (Z-axis) while keeping X
                targetZ = roadC + crossOffset;
              }

              // If near an intersection, prefer to cross there — adjust target toward it
              if (nearInt) {
                if (isV) {
                  targetZ = nearInt[1] + (Math.random() - 0.5) * 4; // Slight Z offset near crosswalk
                } else {
                  targetX = nearInt[0] + (Math.random() - 0.5) * 4;
                }
              }

              ud.aiState = 'crossing';
              ud.state = 'crossing';
              ud.crossTarget = { x: targetX, z: targetZ };
              ud.crossRoadCenter = ud.roadC;
              ud.crossTargetDist = Math.abs(crossOffset);
              // Freeze until traffic light allows
              const tlCheck = _checkTrafficLight(p.position, this);
              if (tlCheck.shouldWait) {
                ud.aiState = 'waiting';
                ud.waitTimer = 0;
                ud._crossPending = true; // Remember we want to cross after waiting
              }
            } else {
              ud.dir *= -1;
              p.rotation.y = ud.isV ? (ud.dir > 0 ? 0 : Math.PI) : (ud.dir > 0 ? Math.PI/2 : -Math.PI/2);
              ud.distTraveled = 0;
              ud.destDist = 10 + Math.random() * 25;
            }
          }

          // ── INTER-PEDESTRIAN AVOIDANCE ──
          this.peds.forEach(other => {
            if (other === p || !other.userData) return;
            const dx = p.position.x - other.position.x;
            const dz = p.position.z - other.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            // Maintain safe distance (1.5 units)
            if (dist < 1.5 && dist > 0.01) {
              const push = (1.5 - dist) * 0.6;
              const nx = dx / dist;
              const nz = dz / dist;
              p.position.x += nx * push * dt * 6;
              p.position.z += nz * push * dt * 6;
            }
          });

          // ── OBSTACLE AVOIDANCE (buildings, poles, etc) ──
          if (this.obstacles) {
            this.obstacles.forEach(obs => {
              const dx = p.position.x - obs.position.x;
              const dz = p.position.z - obs.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              const obsRadius = (obs.userData?.halfW || 1.5) + 0.8; // Obstacle size + pedestrian radius
              if (dist < obsRadius && dist > 0.01) {
                const push = (obsRadius - dist) * 0.8;
                p.position.x += (dx / dist) * push;
                p.position.z += (dz / dist) * push;
              }
            });
          }

          // ── LEG ANIMATION ──
          const legAnimSpeed = ud.aiState === 'idle' ? 0.08 : 12;
          const legAnimAmp = ud.aiState === 'idle' ? 0.05 : 0.55;
          if (ud.lLeg) ud.lLeg.rotation.x = Math.sin(ud.t * legAnimSpeed) * legAnimAmp;
          if (ud.rLeg) ud.rLeg.rotation.x = Math.sin(ud.t * legAnimSpeed + Math.PI) * legAnimAmp;

          // ── FBX ANIMATED CHARACTER BLEND ──
          if (ud.isFBXAnimated && ud.mixer) {
            const moving = ud.aiState === 'walk' || ud.aiState === 'chase'
            if (ud.idleAction && ud.runAction) {
              const targetIdle = moving ? 0 : 1
              const targetRun = moving ? 1 : 0
              ud.idleAction.setEffectiveWeight(ud.idleAction.getEffectiveWeight() + (targetIdle - ud.idleAction.getEffectiveWeight()) * 0.1)
              ud.runAction.setEffectiveWeight(ud.runAction.getEffectiveWeight() + (targetRun - ud.runAction.getEffectiveWeight()) * 0.1)
            }
            ud.mixer.update(dt)
          }

          // ── POLICE VOLUNTEER SPECIAL BEHAVIOR ──
          if (isPoliceVolunteer) {
            ud.t += dt * 3;
            const armWave = Math.sin(ud.t) * 0.8;
            p.children.forEach(ch => {
              if (ch.name && ch.name.includes('Arm')) {
                ch.rotation.z = armWave;
              }
            });
            p.rotation.y = Math.sin(ud.t * 0.5) * 0.3 + (ud.isV ? Math.PI/2 : 0);
          }

          // ── PLAYER COLLISION CHECK (INSTANT FAILURE ON HIT) ──
          if (!this.isPedestrian && Math.abs(this.speed) > 0.1 && (!this._spawnInvulnerable || this._spawnInvulnerable <= 0) && this.player.position.distanceTo(p.position) < 2.0) {
            this.speed = 0;
            this.hp = 0;
            toast('💥 HIT PEDESTRIAN! INSTANT FAILURE!', '#ff3b30');
            this._uh();
            this._go("Hit Pedestrian");
          }
        });
      }
      _uobs(dt) {
        if (!this.player) return;
        const px = this.player.position.x, pz = this.player.position.z;
        const pR = 1.5; // player collision radius

        // Animal obstacle: stop nearby → wait → it wanders off; honking at it while present
        // is a real, logged violation instead of a no-op "Beep Beep!" toast.
        if (this._animalObstacle && !this._animalObstacle.moved) {
          const ao = this._animalObstacle;
          const adx = px - ao.x, adz = pz - ao.z;
          const distSq = adx * adx + adz * adz;
          this._nearAnimal = distSq < 400; // within ~20 units
          if (this._nearAnimal && Math.abs(this.speed) < 0.03) {
            this._nearAnimalStoppedSince = this._nearAnimalStoppedSince || Date.now();
            if (!ao.everWaitedNear && Date.now() - this._nearAnimalStoppedSince > 600) ao.everWaitedNear = true;
            if (Date.now() - this._nearAnimalStoppedSince > 3000) {
              ao.moved = true;
              ao.movedAt = Date.now();
              // Animate it ambling off to the roadside rather than just vanishing
              const targetX = ao.x + (ao.x >= 0 ? 6 : -6);
              const startPos = ao.mesh.position.clone();
              const animMove = () => {
                if (!ao.mesh) return;
                ao.mesh.position.x += (targetX - ao.mesh.position.x) * 0.04;
                ao.mesh.rotation.y = ao.x >= 0 ? -Math.PI / 2 : Math.PI / 2;
                if (Math.abs(ao.mesh.position.x - targetX) > 0.1) requestAnimationFrame(animMove);
              };
              animMove();
              toast('🐄 The cow has moved along', '#8bc34a');
            }
          } else {
            this._nearAnimalStoppedSince = null;
          }
          if (this._nearAnimal && this._honkedThisFrame) {
            ao.everHonkedNear = true;
            if (!this._animalHonkPenalized) {
              this._animalHonkPenalized = true;
              this.vio++;
              this.violationsLog.push('HONKED_AT_ANIMAL');
              this.score -= 40;
              this.fine += 1000;
              this._triggerPoliceStrobe(); ui.issueChallan('Honking at an animal on the road', 'Civic Sense', '₹1,000', 'Animals have the right of way — never honk at them');
            }
          }
        }

        this.obstacles.forEach(o => {
          const dx = px - o.position.x, dz = pz - o.position.z;
          if (dx * dx + dz * dz > 400) return;
          const ud = o.userData || {};
          const hw = ud.halfW || 1.6, hd = ud.halfD || 1.6;

          let overlapX = 0, overlapZ = 0;
          let localX = dx, localZ = dz;
          const rotY = o.rotation ? o.rotation.y : 0;
          if (Math.abs(rotY) > 0.01) {
            const cos = Math.cos(-rotY);
            const sin = Math.sin(-rotY);
            localX = cos * dx - sin * dz;
            localZ = sin * dx + cos * dz;
            overlapX = pR + hw - Math.abs(localX);
            overlapZ = pR + hd - Math.abs(localZ);
          } else {
            overlapX = pR + hw - Math.abs(dx);
            overlapZ = pR + hd - Math.abs(dz);
          }

          if (overlapX > 0 && overlapZ > 0) {
              this._collidedThisFrame = true;
              const dmg = this.seatbeltOn ? 10 : 18;
              this.hp = Math.max(0, this.hp - dmg);
              if (this.hp <= 0) {
                this._go(ud.isVehicle ? 'Vehicle Collision' : 'Collided with Structure');
              } else {
                this._uh();
              }
              // Elastic bounce response
              this.speed *= -0.35;
              this._camShakeAmt = Math.max(this._camShakeAmt, 0.45);

              // Push player out along axis of least penetration in world space
              if (Math.abs(rotY) > 0.01) {
                const cosW = Math.cos(rotY);
                const sinW = Math.sin(rotY);
                if (overlapX < overlapZ) {
                  const pushLX = (localX > 0 ? overlapX + 0.15 : -(overlapX + 0.15));
                  this.player.position.x += cosW * pushLX;
                  this.player.position.z -= sinW * pushLX;
                } else {
                  const pushLZ = (localZ > 0 ? overlapZ + 0.15 : -(overlapZ + 0.15));
                  this.player.position.x += sinW * pushLZ;
                  this.player.position.z += cosW * pushLZ;
                }
              } else {
                if (overlapX < overlapZ) {
                  this.player.position.x += (dx > 0 ? overlapX + 0.15 : -(overlapX + 0.15));
                } else {
                  this.player.position.z += (dz > 0 ? overlapZ + 0.15 : -(overlapZ + 0.15));
                }
              }

              if (window.TrafficAudio) window.TrafficAudio.playCrash(1.2);
              if (ud.isVehicle) {
                toast('💥 CRASH! Vehicle Collision! HP -' + dmg, '#ef4444', 3000);
              } else {
                toast('🚧 CRASH! Structure Collision! HP -' + dmg, '#ef4444', 3000);
              }
              if (window.GameplayRecorder) GameplayRecorder.record('COLLISION_HIT', { hp: Math.round(this.hp), score: this.score });
          }
        });

        if (this.puddles) {
            this.puddles.forEach(p => {
                if (this.player.position.distanceTo(p.position) < 2.5 && Math.abs(this.speed) > 0.15 && !p.userData.splashed) {
                    p.userData.splashed = true;
                    this.score -= 50;
                    this.fine += 500;
                    this._triggerPoliceStrobe(); ui.issueChallan('Splashed water on pedestrians', 'Sec 184 MV Act', '₹500', 'Reckless Driving');
            toast('💦 Splashed Water! Too Fast!', '#ff3b30');
            sfx.play('error');
            if (window.GameplayRecorder) GameplayRecorder.record('SPLASH', { score: this.score, fine: this.fine });
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

      _checkBrakeZones(dt) {
        if (!this.kidModeActive || this.isPedestrian) return;
        if (this.speed <= 0) return;
        if (!this.player) return;

        const px = this.player.position.x, pz = this.player.position.z;
        const yaw = this.player.rotation.y;
        const forwardX = Math.sin(yaw), forwardZ = Math.cos(yaw);

        let minDist = Infinity;

        const checkObj = (o) => {
          const dx = o.position.x - px, dz = o.position.z - pz;
          const dist = Math.hypot(dx, dz);
          if (dist === 0) return;
          const dot = (dx / dist) * forwardX + (dz / dist) * forwardZ;
          if (dot > 0.8) {
            const forwardDist = dist * dot;
            if (forwardDist < minDist) minDist = forwardDist;
          }
        };

        this.obstacles.forEach(checkObj);
        this.npcs.forEach(checkObj);

        if (minDist < 10) {
          if (minDist < 3) {
            this._brake();
          } else {
            const brakeStrength = (10 - minDist) / 7;
            this.speed -= brakeStrength * this.accel * 2 * dt * 60;
            if (this.speed < 0) this.speed = 0;
          }
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
          // Pulse animation for checkpoint groups
          if (cp.userData.ring && !cp.userData.hit) {
              const pulse = 0.8 + 0.2 * Math.sin(this.timer * 3);
              cp.userData.ring.material.opacity = pulse;
              if (cp.userData.glow) cp.userData.glow.material.opacity = 0.3 + 0.2 * Math.sin(this.timer * 3 + 1);
              if (cp.userData.center) cp.userData.center.material.opacity = 0.5 + 0.3 * Math.sin(this.timer * 4);
              if (cp.userData.beam) {
                  cp.userData.beam.material.opacity = 0.1 + 0.08 * Math.sin(this.timer * 2);
                  cp.userData.beam.scale.y = 0.9 + 0.2 * Math.sin(this.timer * 3);
              }
          }
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
          const hitThreshold = (cp.userData && cp.userData.isFinish) ? 14.0 : 10.0;
          if (this.player.position.distanceTo(cp.position) < hitThreshold) {
            cp.userData.hit = true;
            cp.visible = false;
            this.score += 100;
            hits++;
            const toastMsg = (cp.userData && cp.userData.isFinish) ? '🏁 DESTINATION REACHED!' : `✅ ${cp.userData.desc || 'Checkpoint Passed!'}`;
            toast(toastMsg, '#00e676');
            if (window.TrafficAudio && window.TrafficAudio.playCheckpoint) {
              window.TrafficAudio.playCheckpoint();
            } else if (typeof sfx !== 'undefined' && sfx.play) {
              sfx.play('ok');
            }
            if (this._triggerCheckpointBurst) this._triggerCheckpointBurst(cp.position.x, cp.position.y, cp.position.z);
          }
        });
        this.hits = hits;
        if (this.dom['hcp']) this.dom['hcp'].textContent = hits + '/' + this.cps.length;

        const da = this.dom['da'];
        if (da) { da.style.display = 'none'; da.classList.remove('on'); }

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
        if (arrow) arrow.style.transform = 'rotate(' + Math.round(deg) + 'deg)';
        if (this.dom['phone-gps-dist']) this.dom['phone-gps-dist'].textContent = dist + 'm';
        const dirText = Math.abs(deg) < 20 ? 'STRAIGHT' : deg > 0 ? 'TURN RIGHT' : 'TURN LEFT';
        if (this.dom['phone-gps-dir']) this.dom['phone-gps-dir'].textContent = dirText;
        const task = this.tasks && this.tasks.find(t => !t.done);
        if (this.dom['phone-gps-obj']) this.dom['phone-gps-obj'].textContent = task ? task.label : 'Next checkpoint';
      }
      _umode(dt) {
        this.score += dt; const hscEl = this.dom['hsc']; if (hscEl) hscEl.textContent = Math.round(this.score);
        if ((this.mode === 'rain' || this.mapCfg?.hasRain) && this.rain) {
          const p = this.rain.geometry.attributes.position.array;
          const wdx = this._rainWindX || 0;
          const wdz = this._rainWindZ || 0;
          for (let i = 0; i < p.length; i += 3) { p[i] += wdx * dt; p[i + 1] -= 10 * dt; p[i + 2] += wdz * dt; if (p[i + 1] < 0) p[i + 1] = 25; }
          this.rain.geometry.attributes.position.needsUpdate = true;
          // 20% speed reduction in rain
          if (this.speed > this.maxSpd * 0.8) this.speed = this.maxSpd * 0.8;
          // Lightning flash + thunder every 8-15s
          this.lightningTimer -= dt;
          if (this.lightningTimer <= 0) {
            this.lightningTimer = 8 + Math.random() * 7;
            // Screen flash
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.35);z-index:9999;pointer-events:none;transition:opacity 0.3s';
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
        if (this.mode === 'silentzone' && this.ms && this.player) this.ms.inSz = this.player.position.z > -60 && this.player.position.z < 20;
      }
      // ── GTA-style enter/exit state machine ──
      _tickEnterExit(dt) {
        const s = this._enterState;
        if (s === 'IDLE') return;
        this._enterTimer += dt;
        const t = this._enterTimer;
        const char = this.playerCharacter;
        const veh = this.playerVehicle;
        if (!char || !veh) { this._enterState = 'IDLE'; this._camOverride = false; return; }
        const doorPivot = this._enterDoorSide === 'L' ? veh.userData.doorPivotL : veh.userData.doorPivotR;

        // ── Helper: animate character body pose during enter/exit ──
        const _animPose = (char, ud, type, p) => {
          if (!ud) return
          const ease = p * p * (3 - 2 * p)
          const sk = ud._sk || 1
          if (type === 'reach_handle') {
            // Reaching for door handle — right arm extends forward
            if (ud.rArm) ud.rArm.rotation.x = -ease * 0.8
            if (ud.lArm) ud.lArm.rotation.x = ease * 0.15
            if (ud.torsoGroup) ud.torsoGroup.rotation.x = ease * 0.08
            if (ud.headGroup) ud.headGroup.rotation.x = ease * 0.12
          } else if (type === 'sit_lean') {
            // Leaning forward and down into seat
            if (ud.torsoGroup) ud.torsoGroup.rotation.x = ease * 0.35
            if (ud.headGroup) ud.headGroup.rotation.x = ease * 0.2
            if (ud.rArm) ud.rArm.rotation.x = -0.8 + ease * 0.5
            if (ud.lArm) ud.lArm.rotation.x = 0.15 - ease * 0.15
            if (ud.lLeg) ud.lLeg.rotation.x = ease * 0.4
            if (ud.rLeg) ud.rLeg.rotation.x = ease * 0.3
          } else if (type === 'sit_settle') {
            // Settling into seat — lean back, relax
            if (ud.torsoGroup) ud.torsoGroup.rotation.x = 0.35 - ease * 0.25
            if (ud.headGroup) ud.headGroup.rotation.x = 0.2 - ease * 0.15
            if (ud.rArm) ud.rArm.rotation.x = -0.3 + ease * 0.2
            if (ud.lArm) ud.lArm.rotation.x = 0 + ease * 0.1
            if (ud.lLeg) ud.lLeg.rotation.x = 0.4 - ease * 0.1
            if (ud.rLeg) ud.rLeg.rotation.x = 0.3 - ease * 0.05
          } else if (type === 'stand_up') {
            // Rising from seat — push up with legs
            if (ud.torsoGroup) ud.torsoGroup.rotation.x = 0.1 * (1 - ease)
            if (ud.headGroup) ud.headGroup.rotation.x = 0.05 * (1 - ease)
            if (ud.rArm) ud.rArm.rotation.x = 0.2 * (1 - ease)
            if (ud.lArm) ud.lArm.rotation.x = 0.1 * (1 - ease)
            if (ud.lLeg) ud.lLeg.rotation.x = 0.3 * (1 - ease)
            if (ud.rLeg) ud.rLeg.rotation.x = 0.25 * (1 - ease)
          } else if (type === 'reset') {
            // Reset all pose to idle
            if (ud.torsoGroup) ud.torsoGroup.rotation.x = 0
            if (ud.headGroup) { ud.headGroup.rotation.x = 0; ud.headGroup.rotation.y = 0 }
            if (ud.rArm) ud.rArm.rotation.x = 0
            if (ud.lArm) ud.lArm.rotation.x = 0
            if (ud.lLeg) ud.lLeg.rotation.x = 0
            if (ud.rLeg) ud.rLeg.rotation.x = 0
          }
        }
        // ── Helper: vehicle suspension bounce (compress one side) ──
        const _vehBounce = (veh, side, amt) => {
          if (!veh) return
          // Subtle vertical displacement based on which side the character is on
          veh.position.y = (this._suspensionY || 0) + amt * 0.03
        }
        // ── Helper: cinematic camera orbit ──
        const _camOrbit = (center, radius, height, angle, lookY) => {
          this.camera.position.set(
            center.x + Math.sin(angle) * radius,
            height,
            center.z + Math.cos(angle) * radius
          )
          this.camera.lookAt(center.x, lookY || 1.0, center.z)
        }

        if (this._enterDir === 1) {
          // ══════ ENTERING VEHICLE ══════
          const walkStart = (this._enterWalkStart && isFinite(this._enterWalkStart.x)) ? this._enterWalkStart : char.position.clone();
          const walkEnd = (this._enterWalkEnd && isFinite(this._enterWalkEnd.x)) ? this._enterWalkEnd : veh.position.clone();

          if (s === 'WALKING_TO_DOOR') {
            const dur = 0.8;
            const p = Math.min(t / dur, 1);
            const approachEase = p * p * (3 - 2 * p);
            char.position.lerpVectors(walkStart, walkEnd, approachEase);
            char.position.y = 0;
            const dx = veh.position.x - char.position.x;
            const dz = veh.position.z - char.position.z;
            const angle = (dx !== 0 || dz !== 0) ? Math.atan2(dx, dz) : veh.rotation.y;
            char.rotation.y = angle;
            this._animateCharacterWalk(char, p < 0.85 ? 1.0 : 0.3, dt);
            if (t - this._lastStepTime > 0.3) { this._lastStepTime = t; sfx.play('step'); }
            const camAngle = angle + Math.PI + Math.sin(p * Math.PI) * 0.15;
            _camOrbit(char.position, 3.5, 2.5 + Math.sin(p * Math.PI) * 0.2, camAngle, 1.0);
            if (p >= 1) { this._enterState = 'OPENING_DOOR'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'OPENING_DOOR') {
            const dur = 0.4;
            const p = Math.min(t / dur, 1);
            const doorEase = p * p * (3 - 2 * p);
            if (doorPivot) doorPivot.rotation.y = doorEase * (Math.PI * 0.45);
            _animPose(char, char.userData, 'reach_handle', doorEase);
            _vehBounce(veh, this._enterDoorSide, doorEase * 0.5);
            const dx = veh.position.x - char.position.x;
            const dz = veh.position.z - char.position.z;
            const angle = (dx !== 0 || dz !== 0) ? Math.atan2(dx, dz) : veh.rotation.y;
            _camOrbit(char.position, 3.0, 2.2, angle + Math.PI, 1.2);
            if (p >= 1) { this._enterState = 'SITTING_DOWN'; this._enterTimer = 0; }
          } else if (s === 'SITTING_DOWN') {
            const dur = 0.6;
            const p = Math.min(t / dur, 1);
            const ease = p * p * (3 - 2 * p);
            const seatWorld = new THREE.Vector3(0, 0.6, 0.2).applyMatrix4(veh.matrixWorld);
            char.position.lerpVectors(walkEnd, seatWorld, ease);
            char.scale.setScalar(1 - ease * 0.45);
            if (p < 0.5) {
              _animPose(char, char.userData, 'sit_lean', p * 2);
            } else {
              _animPose(char, char.userData, 'sit_settle', (p - 0.5) * 2);
            }
            _vehBounce(veh, this._enterDoorSide, ease * 1.0);
            const camAngle = veh.rotation.y + Math.PI;
            const _vcamSit = VEHICLE_CAM[this.vehMode] || VEHICLE_CAM_DEFAULT;
            const orbDist = 3.5 + ease * (_vcamSit.dist - 3.5);
            const orbHeight = 2.5 + ease * (_vcamSit.height - 2.5);
            this.camera.position.set(
              veh.position.x + Math.sin(camAngle) * orbDist,
              veh.position.y + orbHeight,
              veh.position.z + Math.cos(camAngle) * orbDist
            );
            this.camera.lookAt(veh.position.x, veh.position.y + 1.0, veh.position.z);
            if (p >= 1) { this._enterState = 'CLOSING_DOOR'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'CLOSING_DOOR') {
            const dur = 0.3;
            const p = Math.min(t / dur, 1);
            const doorEase = p * p * (3 - 2 * p);
            if (doorPivot) doorPivot.rotation.y = (1 - doorEase) * (Math.PI * 0.45);
            _vehBounce(veh, this._enterDoorSide, (1 - p) * 1.0);
            if (p >= 1) {
              this.isPedestrian = false;
              char.position.set(0, 0.6, 0.2);
              char.scale.set(0.55, 0.55, 0.55);
              _animPose(char, char.userData, 'reset', 1);
              if (char.parent !== veh) veh.add(char);
              if (char.userData) {
                if (char.userData.nametag) char.userData.nametag.visible = false;
                if (char.userData.nametagGlow) char.userData.nametagGlow.visible = false;
                if (char.userData.nametagGlowOuter) char.userData.nametagGlowOuter.visible = false;
              }
              this.player = veh;
              this._camSnapped = true;
              this._camOverride = false;
              this._enterState = 'IDLE';
              this._spawnInvulnerable = 6.0; // 6s Departure grace period
              if (this.player.userData) {
                this.player.userData.wwCooldown = 5.0;
                this.player.userData.wwTimer = 0;
              }
              this.camYaw = 0; this.camPitch = 0;
              this.targetCamYaw = 0; this.targetCamPitch = 0;
              const _vcamEnter = VEHICLE_CAM[this.vehMode] || VEHICLE_CAM_DEFAULT;
              this.camera.fov = _vcamEnter.baseFov;
              this.camera.updateProjectionMatrix();
              // Snap camera immediately behind the vehicle looking forward
              const rotY = veh.rotation.y;
              const camDist = _vcamEnter.dist;
              const camHeight = _vcamEnter.height;
              this.camera.position.set(
                veh.position.x - Math.sin(rotY) * camDist,
                veh.position.y + camHeight,
                veh.position.z - Math.cos(rotY) * camDist
              );
              this.camera.lookAt(
                veh.position.x + Math.sin(rotY) * (_vcamEnter.lookDist || 8),
                veh.position.y + 1.0,
                veh.position.z + Math.cos(rotY) * (_vcamEnter.lookDist || 8)
              );
              const vt = this.vehMode || 'car';
              const rain = window.gameWeather === 'Rain' || (this.mapCfg && this.mapCfg.hasRain);
              const hw = this.mapCfg && this.mapCfg.themeType === 'highway';
              const vs = VEHICLE_STATS[vt] || VEHICLE_STATS.car;
              this.maxSpd = (hw ? vs.maxSpd * 1.3 : vs.maxSpd) * (this.seatbeltOn ? 1.1 : 1.0);
              this.accel = vs.accel;
              this.turn = rain ? vs.turn * 0.65 : vs.turn;
              this.fric = rain ? vs.fric + 0.025 : vs.fric;
              this._grip = rain ? vs.grip * 0.3 : vs.grip;
              this.setGear('D');
              this.speed = 0;
              toast(this.seatbeltOn ? '🚗 Entered +10% Speed Bonus!' : '🚗 Entered Vehicle! (Gear: Drive)', this.seatbeltOn ? '#27ae60' : '#00c851');
            }
          }
        } else {
          // ══════ EXITING VEHICLE ══════
          if (s === 'OPENING_DOOR') {
            const dur = 0.5;
            const p = Math.min(t / dur, 1);
            const doorEase = p * p * (3 - 2 * p)
            if (doorPivot) doorPivot.rotation.y = doorEase * (Math.PI * 0.45)
            // Vehicle tilts as door opens
            _vehBounce(veh, this._enterDoorSide, doorEase * 0.8)
            // Camera shifts to see the door
            const camAngle = veh.rotation.y + Math.PI * 0.8
            _camOrbit(veh.position, 4.0, 2.0, camAngle, 1.5)
            if (p >= 1) { this._enterState = 'WALKING_OUT'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'WALKING_OUT') {
            const dur = 0.6;
            const p = Math.min(t / dur, 1);
            const ease = p * p * (3 - 2 * p)
            const standPos = this._enterWalkEnd.clone()
            standPos.y = 0
            const seatPosC = this._v1.set(0, 0.6, 0.2)
            char.position.lerpVectors(seatPosC, standPos, ease)
            
            char.position.y = ease * 0
            char.scale.setScalar(0.55 + ease * 0.45)
            // Body pose: stand up animation
            _animPose(char, char.userData, 'stand_up', ease)
            // Vehicle suspension lifts as weight leaves
            _vehBounce(veh, this._enterDoorSide, (1 - ease) * 1.2)
            if (ease > 0.5 && t - this._lastStepTime > 0.3) { this._lastStepTime = t; sfx.play('step'); }
            // Camera follows character rising
            const camAngle = Math.atan2(standPos.x - veh.position.x, standPos.z - veh.position.z) + Math.PI
            this.camera.position.set(
              veh.position.x + (standPos.x - veh.position.x) * ease * 0.5 + Math.sin(camAngle) * 3.5 * (1 - ease * 0.3),
              1.3 + ease * 1.2,
              veh.position.z + (standPos.z - veh.position.z) * ease * 0.5 + Math.cos(camAngle) * 3.5 * (1 - ease * 0.3)
            )
            this.camera.lookAt(char.position.x, 1.0, char.position.z)
            if (p >= 1) { this._enterState = 'CLOSING_DOOR'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'CLOSING_DOOR') {
            const dur = 0.4;
            const p = Math.min(t / dur, 1);
            const doorEase = p * p * (3 - 2 * p)
            if (doorPivot) doorPivot.rotation.y = (1 - doorEase) * (Math.PI * 0.45)
            // Vehicle settles back
            _vehBounce(veh, this._enterDoorSide, (1 - p) * 1.2)
            _animPose(char, char.userData, 'reset', doorEase)
            this._animateCharacterWalk(char, 0, dt)
            if (p >= 1) {
              this.isPedestrian = true;
              veh.remove(char);
              char.scale.set(1, 1, 1);
              char.position.copy(this._enterWalkEnd);
              char.position.y = 0;
              _animPose(char, char.userData, 'reset', 1)
              this.scene.add(char);
              this.player = char;
              this._camSnapped = false;
              this._camOverride = false;
              this._enterState = 'IDLE';
              // Reset camera angles for clean pedestrian view
              this.camYaw = 0; this.camPitch = 0;
              this.targetCamYaw = 0; this.targetCamPitch = 0;
              // Reset FOV from vehicle speed/boost FOV back to default
              this.camera.fov = 65;
              this.camera.updateProjectionMatrix();
              this.maxSpd = 0.12; this.accel = 0.06; this.turn = 0.05; this.fric = 0.88;
              this.setGear('N');
              toast('Exited Vehicle!', '#00c851');
            }
          }
        }
      }

      // ── Character walk animation (FBX mixer blend + GLB/procedural leg swing) ──
      _animateCharacterWalk(character, speed, dt) {
        if (!character) return
        const ud = character.userData
        if (ud && ud.isMinecraft && typeof ud.update === 'function') {
          ud.update(dt, speed);
          return;
        }
        // FBX / GLB animated characters: blend idle ↔ run weights
        if ((ud.isFBXAnimated || ud.isGLB) && (ud.mixer || ud._mixer)) {
          const m = ud.mixer || ud._mixer
          const walkW = Math.min(Math.abs(speed) * 3, 1)
          const idleA = ud.idleAction || ud._idleAction
          const walkA = ud.runAction || ud._walkAction
          if (idleA) idleA.setEffectiveWeight(1 - walkW)
          if (walkA) walkA.setEffectiveWeight(walkW)
          m.update(dt)
          return
        }
        // GLB / procedural characters: swing legs + arms + body bob
        const t = (ud.t || 0) + dt * 8
        ud.t = t
        const walkW = Math.min(Math.abs(speed) * 4, 1)
        const isIdle = walkW < 0.05
        const swing = Math.sin(t) * 0.45 * walkW
        // ── IDLE ANIMATIONS (NPCs standing still) ──
        if (isIdle && !ud.isPlayer) {
          const ip = ud.idlePhase || 0
          // Breathing: slow torso rise/fall
          if (ud.torsoGroup) {
            const breathe = Math.sin(t * 0.4 + ip) * 0.006
            ud.torsoGroup.position.y = 1.23 * (ud._sk || 1) + breathe
            // Subtle shoulder sway
            ud.torsoGroup.rotation.z = Math.sin(t * 0.3 + ip) * 0.008
          }
          // Head turning: slow look-around + occasional glance at player
          if (ud.headGroup) {
            const lookCycle = Math.sin(t * 0.25 + ip * 2) * 0.06
            const lookCycleY = Math.cos(t * 0.18 + ip * 3) * 0.08
            // Every ~4 seconds, glance toward player direction
            const glancePhase = (t * 0.25 + ip) % (Math.PI * 2)
            const glance = glancePhase < 0.4 ? Math.sin(glancePhase / 0.4 * Math.PI) * 0.1 : 0
            ud.headGroup.rotation.x = lookCycle
            ud.headGroup.rotation.y = lookCycleY + glance * (ud.dir || 1)
          }
          // Weight shift: alternating subtle leg pressure
          if (ud.lLeg) ud.lLeg.rotation.x = Math.sin(t * 0.3 + ip) * 0.015
          if (ud.rLeg) ud.rLeg.rotation.x = Math.sin(t * 0.3 + ip + Math.PI) * 0.015
          // Arms: subtle sway or cross-body rest
          if (ud.lArm) ud.lArm.rotation.x = Math.sin(t * 0.2 + ip) * 0.02
          if (ud.rArm) ud.rArm.rotation.x = Math.sin(t * 0.2 + ip + Math.PI * 0.7) * 0.02
          // Occasional fidget: every ~6-8 seconds, brief arm/shoulder twitch
          const fidgetCycle = (t * 0.15 + ip * 5) % (Math.PI * 2)
          if (fidgetCycle < 0.3) {
            const fidgetAmt = Math.sin(fidgetCycle / 0.3 * Math.PI) * 0.06
            if (ud.lArm) ud.lArm.rotation.x += fidgetAmt
          }
          // ── BLINKING ──
          // Countdown timer; each blink is a quick close-open cycle (~0.15s)
          if (ud.eyeLids && ud.eyeLids.length > 0) {
            if (ud.blinkTimer === undefined) ud.blinkTimer = Math.random() * 4
            ud.blinkTimer -= dt
            if (ud.blinkTimer <= 0) {
              // Start a new blink — schedule next blink in 2-6 seconds
              ud.blinkTimer = 2 + Math.random() * 4
              ud._blinkPhase = 0.15 // blink duration in seconds
            }
            if (ud._blinkPhase > 0) {
              ud._blinkPhase -= dt
              // Smooth close-open using a cosine bell: 0→1→0 over _blinkPhase
              const blinkProg = 1 - (ud._blinkPhase / 0.15)
              const blinkAmt = Math.sin(blinkProg * Math.PI) // peaks at 1.0 halfway
              ud.eyeLids.forEach(lid => {
                // Default open position y=0.065, closed would be ~0.03 (covering eye)
                lid.position.y = (0.065 - blinkAmt * 0.035) * (ud._sk || 1)
                lid.scale.y = 0.7 + blinkAmt * 0.6 // scale up when closing
              })
            } else {
              // Eyes open — reset lids to default
              ud.eyeLids.forEach(lid => {
                lid.position.y = 0.065 * (ud._sk || 1)
                lid.scale.y = 0.7
              })
            }
          }
          // Shadow blob: breathing pulse
          if (ud.shadowBlob) {
            const bs = 1 + Math.sin(t * 0.4 + ip) * 0.03
            ud.shadowBlob.scale.set(bs, 1, bs)
            ud.shadowBlob.material.opacity = 0.15
          }
        } else {
          // ── WALK ANIMATIONS ──
          // Leg swing with natural knee bend
          if (ud.lLeg) ud.lLeg.rotation.x = swing
          if (ud.rLeg) ud.rLeg.rotation.x = -swing
          // Arm swing (opposite to legs, natural walking motion)
          if (ud.lArm) ud.lArm.rotation.x = -swing * 0.5
          if (ud.rArm) ud.rArm.rotation.x = swing * 0.5
          // Head bob (subtle nod forward/back)
          if (ud.headGroup) {
            ud.headGroup.rotation.x = Math.sin(t * 2) * 0.02 * walkW
            ud.headGroup.rotation.y = 0
          }
          // Reset torso sway when walking
          if (ud.torsoGroup) {
            ud.torsoGroup.rotation.z = 0
          }
          // Full body bob via torsoGroup (natural up-down)
          if (ud.torsoGroup) {
            ud.torsoGroup.position.y = 1.23 * (ud._sk || 1) + Math.abs(Math.sin(t * 2)) * 0.03 * walkW
          } else if (character.children[0]) {
            // Fallback for models without torsoGroup
            character.children[0].position.y = Math.abs(Math.sin(t)) * 0.04 * walkW
          }
          // Shadow blob pulse (breathe effect)
          if (ud.shadowBlob) {
            const s = 1 + Math.sin(t * 2) * 0.05 * walkW
            ud.shadowBlob.scale.set(s, 1, s)
            ud.shadowBlob.material.opacity = 0.15 + walkW * 0.08
          }
        }
        // ── PLAYER EFFECTS (always active) ──
        // Player glow ring pulse
        if (ud.ring && ud.isPlayer) {
          ud.ring.material.opacity = 0.2 + Math.sin(t * 0.5) * 0.15
        }
        // Nametag glow ring pulse (rank-colored breathing)
        if (ud.nametagGlow && ud.isPlayer) {
          ud.nametagGlow.material.opacity = 0.25 + Math.sin(t * 1.2) * 0.15
          const gs = 1 + Math.sin(t * 1.2) * 0.08
          ud.nametagGlow.scale.set(gs, gs, 1)
        }
        if (ud.nametagGlowOuter && ud.isPlayer) {
          ud.nametagGlowOuter.material.opacity = 0.1 + Math.sin(t * 1.2 + 0.5) * 0.08
          const gso = 1 + Math.sin(t * 1.2 + 0.5) * 0.06
          ud.nametagGlowOuter.scale.set(gso, gso, 1)
        }
      }
      _ucam(dt) {
        if (!this.player || !this.player.position) return;
        // Cinematic enter/exit has exclusive camera control — skip normal update
        if (this._camOverride) return;
        // ── SLING-LOOK SMOOTHING ──
        const slingSmooth = 12; // Higher = snappier, Lower = more floaty
        this.camYaw += (this.targetCamYaw - this.camYaw) * Math.min(1, dt * slingSmooth);
        this.camPitch += (this.targetCamPitch - this.camPitch) * Math.min(1, dt * slingSmooth);

        // ── Camera shake — shared by both modes ──
        let shakeX = 0, shakeY = 0;
        if (this._camShakeAmt > 0.001) {
          shakeX = (Math.random() - 0.5) * this._camShakeAmt;
          shakeY = (Math.random() - 0.5) * this._camShakeAmt;
          this._camShakeAmt *= Math.pow(0.04, dt);
        }

        if (this.isPointerLocked) {
          // First Person Mode
          const headHeight = this.isPedestrian ? 1.6 : 1.2;
          // For vehicles, offset slightly forward so we don't clip into the driver seat mesh
          const forwardOffset = this.isPedestrian ? 0 : 0.5;
          const rotY = this.player.rotation.y;
          
          this.camera.position.set(
            this.player.position.x + Math.sin(rotY) * forwardOffset + shakeX * 0.4, 
            this.player.position.y + headHeight + shakeY * 0.3, 
            this.player.position.z + Math.cos(rotY) * forwardOffset
          );
          
          const pitch = this.camPitch || 0;
          const yaw = rotY + (this.camYaw || 0);
          const lx = Math.sin(yaw) * Math.cos(pitch);
          const ly = Math.sin(pitch);
          const lz = Math.cos(yaw) * Math.cos(pitch);
          
          this.camera.up.set(0, 1, 0);
          this.camera.lookAt(
            this.camera.position.x + lx,
            this.camera.position.y + ly,
            this.camera.position.z + lz
          );
        } else {
          // ── Third Person Chase Cam — per-vehicle profiles ──
          const _vcam = (this.isPedestrian ? null : VEHICLE_CAM[this.vehMode]) || VEHICLE_CAM_DEFAULT;
          const camDist = this.isPedestrian ? 4 : _vcam.dist;
          const camHeight = this.isPedestrian ? 2.5 : _vcam.height;
          const rotY = this.player.rotation.y + (this.camYaw || 0);
          // Speed-based look-ahead: camera leads in the direction of travel
          const lookAhead = this.isPedestrian ? 0 : Math.min(Math.abs(this.speed) * 5, _vcam.lookAhead);
          const pitchOffset = (this.camPitch || 0) * 2;
          this._camTarget.set(
              this.player.position.x - Math.sin(rotY) * camDist + Math.sin(rotY) * lookAhead,
              this.player.position.y + camHeight - pitchOffset,
              this.player.position.z - Math.cos(rotY) * camDist + Math.cos(rotY) * lookAhead
          );
          // ── Camera collision: raycast from player to target ──
          if (this.obstacles && this.obstacles.length > 0) {
            const _pp = this.player.position;
            this._camRayOrigin.set(_pp.x, _pp.y + (this.isPedestrian ? 1.6 : 1.2), _pp.z);
            this._camRayVec.subVectors(this._camTarget, this._camRayOrigin);
            const rayLen = this._camRayVec.length();
            if (rayLen > 1.0) {
              this._camRay.set(this._camRayOrigin, this._camRayVec.normalize());
              this._camRay.far = rayLen;
              this._camRay.near = 1.5; // Avoid intersecting player vehicle chassis
              const _nearObs = [];
              const margin = 5;
              for (let i = 0; i < this.obstacles.length; i++) {
                const ob = this.obstacles[i];
                if (!ob || !ob.position || ob === this.playerVehicle || ob === this.playerCharacter || ob === this.player) continue;
                const odx = ob.position.x - _pp.x, odz = ob.position.z - _pp.z;
                if (odx * odx + odz * odz < (rayLen + margin) * (rayLen + margin)) _nearObs.push(ob);
              }
              if (_nearObs.length > 0) {
                const hits = this._camRay.intersectObjects(_nearObs, true);
                // Filter out any hit on player hierarchy
                const validHits = hits.filter(h => {
                  let p = h.object;
                  while (p) {
                    if (p === this.playerVehicle || p === this.playerCharacter || p === this.player) return false;
                    p = p.parent;
                  }
                  return true;
                });
                if (validHits.length > 0 && validHits[0].distance < rayLen) {
                  const pullBack = 0.5;
                  const dx = this._camTarget.x - _pp.x;
                  const dz = this._camTarget.z - _pp.z;
                  const d = Math.sqrt(dx * dx + dz * dz) || 1;
                  const safeDist = Math.max(3.0, validHits[0].distance - pullBack);
                  this._camTarget.set(
                    _pp.x + (dx / d) * safeDist,
                    this._camTarget.y,  // preserve intended height
                    _pp.z + (dz / d) * safeDist
                  );
                }
              }
            }
          }
          // Phase 7.4: Smooth camera transition on mode switch (0.4s lerp) or instant snap
          if (!this._camSnapped) {
            this._camSnapped = true;
            this.camera.position.copy(this._camTarget);
          }
          // Frame-rate independent camera lerp — snappier for bikes/autos, slower for buses/trucks
          const transT = (this._camTransition && this._camTransition > 0) ? this._camTransition : 0;
          if (transT > 0) this._camTransition = Math.max(0, transT - dt);
          const baseLerp = Math.min(1, dt * _vcam.lerpSmoothing);
          const camLerp = transT > 0 ? Math.min(1, dt * 3) : baseLerp; // slower during transition
          this.camera.position.lerp(this._camTarget, camLerp);
          // Hard floor clamp: whatever produced this._camTarget, never let the rendered
          // camera end up at/below ground level (the "camera stuck under the city" bug —
          // it can't recover on its own once below the ground plane, since everything it
          // would see from there is the underside of road/building meshes).
          if (this.camera.position.y < 0.6) this.camera.position.y = 0.6;

          const tiltRoll = this._camTilt || 0;
          this.camera.up.set(0, 1, 0);
          const lookAheadDist = this.isPedestrian ? 3 : _vcam.lookDist;
          const targetLookY = this.player.position.y + (this.isPedestrian ? 1.4 : 0.8);
          this.camera.lookAt(
            this.player.position.x + Math.sin(rotY) * lookAheadDist + shakeX,
            targetLookY - pitchOffset * 0.3 + shakeY,
            this.player.position.z + Math.cos(rotY) * lookAheadDist
          );
          // Camera tilt: subtle roll based on steering input
          if (tiltRoll !== 0) {
            if (!this._rollQ) this._rollQ = new THREE.Quaternion();
            if (!this._rollAxis) this._rollAxis = new THREE.Vector3(0, 0, 1);
            this._rollQ.setFromAxisAngle(this._rollAxis, tiltRoll * 0.5);
            this.camera.quaternion.multiply(this._rollQ);
          }

          // ── Dynamic FOV (Speed-based for vehicles, standard 65 for pedestrians) ──
          if (this.camera.fov !== undefined) {
            if (!this.isPedestrian) {
              const speedRatio = Math.min(Math.abs(this.speed) / (this.maxSpd || 1.1), 1);
              this._camFovTarget = _vcam.baseFov + speedRatio * _vcam.fovRange + (this.boosting ? 5 : 0);
            } else {
              this._camFovTarget = 65;
            }
            if (Math.abs(this.camera.fov - this._camFovTarget) > 0.15) {
              this.camera.fov += (this._camFovTarget - this.camera.fov) * Math.min(1, dt * 4);
              this.camera.updateProjectionMatrix();
            }
          }
        }
      }
      _usun(dt) {
        if (!this.player || !this.player.position) return;
        if (!this._sun || !this.player) return;
        // Dynamic shadow quality: rolling-average FPS → adjust shadow map
        if (!this._fpsBuf) { this._fpsBuf = []; this._fpsIdx = 0; this._fpsSum = 0; }
        const curFps = 1 / Math.max(dt, 0.001);
        this._fpsSum -= (this._fpsBuf[this._fpsIdx] || 0);
        this._fpsBuf[this._fpsIdx] = curFps;
        this._fpsSum += curFps;
        this._fpsIdx = (this._fpsIdx + 1) % 60;
        if (this._fpsBuf.length >= 60) {
          const avgFps = this._fpsSum / this._fpsBuf.length;
          if (avgFps < 25 && this._shadowQuality > 512) {
            this._shadowQuality = Math.max(512, this._shadowQuality / 2);
            this._sun.shadow.mapSize.set(this._shadowQuality, this._shadowQuality);
            if (this._sun.shadow.map) { this._sun.shadow.map.dispose(); this._sun.shadow.map = null; }
            this._sun.shadow.needsUpdate = true;
          } else if (avgFps > 50 && this._shadowQuality < (this._isMobile ? 1024 : 2048)) {
            this._shadowQuality = Math.min(this._isMobile ? 1024 : 2048, this._shadowQuality * 2);
            this._sun.shadow.mapSize.set(this._shadowQuality, this._shadowQuality);
            if (this._sun.shadow.map) { this._sun.shadow.map.dispose(); this._sun.shadow.map = null; }
            this._sun.shadow.needsUpdate = true;
          }
        }
        const p = this.player.position;
        // Sun position follows day/night cycle arc when enabled
        if (this.dayNightCycle) {
          const sunAngle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
          const sx = Math.cos(sunAngle) * 60;
          const sy = Math.sin(sunAngle) * 60 + 10;
          this._sun.position.set(p.x + sx, Math.max(5, sy), p.z + 20);
        } else {
          if (this._sunLastPos && Math.abs(p.x - this._sunLastPos.x) + Math.abs(p.z - this._sunLastPos.z) < 8) return;
          if (!this._sunLastPos) this._sunLastPos = new THREE.Vector3();
          this._sunLastPos.copy(p);
          this._sun.position.set(p.x + 30, 60, p.z + 20);
        }
        this._sun.shadow.needsUpdate = true;
      }
      _updateDayNight(dt) {
        if (!this.player || !this.player.position) return;
        if (!this.mapCfg) return;
        const cfg = this.mapCfg;

        let t, sunElev, dawnF, duskF, sunAngle;
        if (cfg.isNight) {
          t = 0.85;
          sunAngle = t * Math.PI * 2 - Math.PI / 2;
          sunElev = 0;
          dawnF = 0;
          duskF = 0;
        } else if (this.dayNightCycle) {
          const CYCLE = 300;
          this.timeOfDay = (this.timeOfDay + dt / CYCLE) % 1;
          t = this.timeOfDay;
          sunAngle = t * Math.PI * 2 - Math.PI / 2;
          sunElev = Math.max(0, Math.sin(sunAngle));
          dawnF = Math.max(0, 1 - Math.abs(t - 0.25) * 8);
          duskF = Math.max(0, 1 - Math.abs(t - 0.75) * 8);
        } else {
          t = this.timeOfDay || 0.4;
          sunAngle = t * Math.PI * 2 - Math.PI / 2;
          sunElev = Math.max(0, Math.sin(sunAngle));
          dawnF = Math.max(0, 1 - Math.abs(t - 0.25) * 8);
          duskF = Math.max(0, 1 - Math.abs(t - 0.75) * 8);
        }

        // ── Sky color ──
        const nightSkyHex = cfg.isNight ? (cfg.sky || 0x060814) : 0x0a0a12;
        this._dnDaySky.setHex(cfg.isNight ? (cfg.sky || 0x060814) : (cfg.sky || 0x87b6d8));
        this._dnSkyA.copy(this._dnSkyB).setHex(nightSkyHex).lerp(this._dnDaySky, sunElev);
        this._dnSkyB.copy(this._dnDawnSky).multiplyScalar(dawnF).add(this._dnTmp.copy(this._dnDuskSky).multiplyScalar(duskF));
        this.scene.background.copy(this._dnSkyA).add(this._dnSkyB);

        // ── Fog color ──
        this._dnFogA.copy(this._dnFogB).setHex(nightSkyHex).lerp(this._dnDaySky, sunElev);
        this._dnFogB.copy(this._dnDawnFog).multiplyScalar(dawnF).add(this._dnTmp.copy(this._dnDuskFog).multiplyScalar(duskF));
        if (this.scene.fog) {
          this.scene.fog.color.copy(this._dnFogA).add(this._dnFogB);
          if (cfg.isNight) {
            this.scene.fog.near = 80;
            this.scene.fog.far = 420;
          }
        }

        // ── Ambient light ──
        if (this._ambient) this._ambient.intensity = cfg.isNight ? (cfg.amb || 0.15) : this._dnLerp(0.08, cfg.amb || 0.35, sunElev);

        // ── Hemisphere light ──
        if (this._hemi) this._hemi.intensity = cfg.isNight ? 0.10 : this._dnLerp(0.08, 0.45, sunElev);

        // ── Sun intensity ──
        if (this._sun) this._sun.intensity = cfg.isNight ? 0.05 : this._dnLerp(0.05, 1.2, sunElev);

        // ── Moon (opposite to sun) ──
        if (this._moon && this.player) {
          this._moon.intensity = cfg.isNight ? 0.6 : this._dnLerp(0.4, 0, sunElev);
          const moonAngle = sunAngle + Math.PI;
          const mx = Math.cos(moonAngle) * 50;
          const my = Math.abs(Math.sin(moonAngle)) * 40 + 5;
          this._moon.position.set(this.player.position.x + mx, my, this.player.position.z - 30);
        }

        // ── Tone mapping exposure ──
        if (this.renderCore && this.renderCore.renderer) {
          this.renderCore.renderer.toneMappingExposure = cfg.isNight ? 0.55 : this._dnLerp(0.42, 0.62, sunElev);
        }

        // ── Street lights ──
        const slIntensity = cfg.isNight ? 1.0 : (sunElev < 0.3 ? this._dnLerp(0.8, 0, sunElev / 0.3) : 0);
        for (let i = 0; i < this._streetLights.length; i++) this._streetLights[i].intensity = slIntensity;

        // ── Building window glow ──
        const wlIntensity = cfg.isNight ? 0.8 : (sunElev < 0.4 ? this._dnLerp(0.6, 0, sunElev / 0.4) : 0);
        for (let i = 0; i < this._windowLights.length; i++) this._windowLights[i].intensity = wlIntensity;

        // ── Player headlights ──
        if (this.hL && this.hR) {
          const hlI = cfg.isNight ? (this.highBeamOn ? 4.5 : 3.2) : this._dnLerp(2.5, 0, sunElev);
          this.hL.intensity = hlI; this.hR.intensity = hlI;
          this.hL.distance = cfg.isNight ? (this.highBeamOn ? 320 : 180) : (this.highBeamOn ? 300 : 150);
          this.hR.distance = cfg.isNight ? (this.highBeamOn ? 320 : 180) : (this.highBeamOn ? 300 : 150);
        }
        if (this._headlightCones) {
          const coneA = cfg.isNight ? (this.highBeamOn ? 0.16 : 0.10) : this._dnLerp(0.08, 0, sunElev);
          for (let i = 0; i < this._headlightCones.length; i++) this._headlightCones[i].material.opacity = coneA;
        }

        // ── NPC headlights/taillights ──
        const nightOn = cfg.isNight || sunElev < 0.2;
        if (nightOn !== this._lastNpcLightState && this.npcs) {
          this._lastNpcLightState = nightOn;
          for (let ni = 0; ni < this.npcs.length; ni++) {
            const nv = this.npcs[ni];
            for (let ci = 0; ci < nv.children.length; ci++) {
              const c = nv.children[ci];
              if (c.isSpotLight) c.intensity = nightOn ? 1.8 : 0;
              if (c.isMesh && c.material && c.material.color && c.material.color.r > 0.8 && c.material.color.g < 0.2) {
                c.visible = nightOn;
              }
            }
          }
        }
      }
      _dnLerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }

      _updateObjectiveHUD() {
        const objCard = document.getElementById('objective-overlay');
        if (!objCard) return;

        const isCar = !this.isPedestrian;
        const curSig = this.sigs && this.sigs[0];
        const isGreen = curSig ? (curSig.userData?.st === 'green') : true;
        const activeCp = this.cps ? this.cps.find(c => !c.userData?.hit) : null;
        const distToGoal = (activeCp && this.player) ? Math.round(this.player.position.distanceTo(activeCp.position)) : 0;
        const hits = this.hits || 0;
        const totalCps = (this.cps && this.cps.length) ? this.cps.length : 1;

        let step1Html = isCar ? '<span style="color:#00e676;">✔ Step 1: In Vehicle [F]</span>' : '<span style="color:#facc15;font-weight:700;">➔ Step 1: Press [F] to enter Car</span>';
        let step2Html = (isCar && !isGreen) ? '<span style="color:#facc15;font-weight:700;">➔ Step 2: Stop at Red Signal & Wait</span>' : (isGreen ? '<span style="color:#00e676;">✔ Step 2: Signal Green</span>' : '<span style="color:#64748b;">Step 2: Red Signal</span>');
        let step3Html = (isCar && isGreen)
          ? `<span style="color:#38bdf8;font-weight:700;">➔ Step 3: Drive to Destination (${distToGoal}m) [${hits}/${totalCps}]</span>`
          : `<span style="color:#64748b;">Step 3: Reach Destination</span>`;

        objCard.innerHTML = `
          <div style="font-size:0.75rem;font-weight:800;letter-spacing:1px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;">CURRENT MISSION OBJECTIVES</div>
          <div style="font-size:0.85rem;line-height:1.4;display:flex;flex-direction:column;gap:4px;">
            <div>${step1Html}</div>
            <div>${step2Html}</div>
            <div>${step3Html}</div>
          </div>
        `;
      }

      _uhud() {
        this._updateObjectiveHUD();
        if (!this.player) return;
        const k = Math.round(Math.abs(this.speed) * 100);
        
        if (!this.warnEl) {
            this.warnEl = document.createElement('div');
            this.warnEl.style.cssText = 'position:fixed; bottom:22%; left:50%; transform:translateX(-50%); font-family:"Inter", -apple-system, BlinkMacSystemFont, sans-serif; z-index:9999; display:none; pointer-events:none; text-align:center; transition:opacity 0.2s, transform 0.2s;';
            document.body.appendChild(this.warnEl);
        }
        const speedLimitKmh = this.mapCfg && this.mapCfg.speedLimit ? this.mapCfg.speedLimit : (this.speedLimitCap || 50);

        let warnMsg = '';
        if (k > speedLimitKmh) {
          warnMsg = `
            <div style="background:rgba(220, 38, 38, 0.95); border:2px solid #fca5a5; border-radius:30px; padding:10px 22px; color:#ffffff; font-weight:800; font-size:0.95rem; letter-spacing:0.5px; box-shadow:0 10px 30px rgba(220, 38, 38, 0.6); display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.2rem;">⚠️</span>
              <span>OVERSPEEDING (${k}/${speedLimitKmh} KM/H) — PRESS <kbd style="background:#fff; color:#b91c1c; padding:2px 8px; border-radius:5px; font-weight:900; box-shadow:0 2px 0 #991b1b; font-family:'Space Mono', monospace; font-size:0.9rem;">L</kbd> TO LIMIT</span>
            </div>
          `;
        } else if (k > 50 && Math.abs(this.player.rotation.y - (this.lastRotY || this.player.rotation.y)) > 0.06) {
          warnMsg = `
            <div style="background:rgba(245, 158, 11, 0.95); border:2px solid #fde68a; border-radius:30px; padding:8px 20px; color:#0f172a; font-weight:800; font-size:0.92rem; letter-spacing:0.5px; box-shadow:0 8px 24px rgba(245, 158, 11, 0.5); display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.2rem;">⚠️</span>
              <span>SHARP CORNER — SLOW DOWN</span>
            </div>
          `;
        }
        this.lastRotY = this.player.rotation.y;

        if (warnMsg) {
            this.warnEl.innerHTML = warnMsg;
            this.warnEl.style.display = 'block';
            if (!this.warnEl.classList.contains('flash')) { this.warnEl.classList.add('flash'); }
        } else {
            // ── Interaction Hint ──
            if (this._enterState !== 'IDLE') {
              this.warnEl.style.display = 'none';
              const mcEnter = document.getElementById('mc-enter');
              if (mcEnter) mcEnter.style.display = 'none';
            } else if (this.isPedestrian && this.playerVehicle) {
              const dist = this.player.position.distanceTo(this.playerVehicle.position);
              const mcEnter = document.getElementById('mc-enter');
              if (dist < 5) {
                this.warnEl.innerHTML = `
                  <div style="background:linear-gradient(135deg, rgba(13, 19, 31, 0.95), rgba(21, 29, 45, 0.95)); border:2px solid #f59e0b; border-radius:30px; padding:10px 22px; color:#ffffff; font-weight:800; font-size:0.98rem; letter-spacing:0.4px; box-shadow:0 12px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.35); display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.3rem;">🚗</span>
                    <span>PRESS <kbd style="background:linear-gradient(180deg, #f59e0b, #d97706); color:#070a14; padding:3px 10px; border-radius:6px; font-weight:900; box-shadow:0 3px 0 #92400e; margin:0 4px; font-family:'Space Mono', monospace; font-size:0.95rem;">F</kbd> TO ENTER CAR</span>
                  </div>
                `;
                this.warnEl.style.display = 'block';
                if (mcEnter) mcEnter.style.display = 'flex';
              } else {
                this.warnEl.style.display = 'none';
                if (mcEnter) mcEnter.style.display = 'none';
              }
            } else {
              this.warnEl.style.display = 'none';
              const mcEnterHide = document.getElementById('mc-enter');
              if (mcEnterHide) mcEnterHide.style.display = 'none';
            }
            this.warnEl.classList.remove('flash');
         }
          // Contextual: show speed gauge only when driving
          const speedGauge = document.getElementById('spgauge');
          if (speedGauge) speedGauge.style.display = this.isPedestrian ? 'none' : 'block';
          // Contextual: show gear only when driving
          const gearPanel = document.getElementById('gp');
          if (gearPanel) gearPanel.style.display = this.isPedestrian ? 'none' : 'flex';
          const speedCtrlPanel = document.getElementById('speed-ctrl');
          if (speedCtrlPanel) speedCtrlPanel.style.display = this.isPedestrian ? 'none' : 'flex';
          
          // Dynamic Speed Limit Road Sign Governor Badge
          let slBadge = document.getElementById('speed-limit-badge');
          if (!slBadge && !this.isPedestrian) {
            slBadge = document.createElement('div');
            slBadge.id = 'speed-limit-badge';
            slBadge.title = 'Speed Governor (Click or press [L] to toggle)';
            slBadge.style.cssText = 'position:fixed; bottom:calc(env(safe-area-inset-bottom, 0px) + 160px); right:calc(env(safe-area-inset-right, 0px) + 16px); width:48px; height:48px; border-radius:50%; background:#ffffff; border:4px solid #cc0000; box-shadow:0 6px 20px rgba(0,0,0,0.7); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; user-select:none; z-index:50; transition:transform 0.15s, box-shadow 0.2s; font-family:"Bebas Neue", var(--sans, sans-serif);';
            slBadge.innerHTML = `<span id="sl-val" style="font-size:20px; font-weight:bold; color:#111; line-height:1;">${speedLimitKmh}</span><span style="font-size:7px; font-weight:800; color:#cc0000; line-height:1; letter-spacing:0.5px;">KM/H</span><div id="sl-gov-tag" style="position:absolute; top:-12px; background:#555; color:#fff; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.4); text-transform:uppercase; letter-spacing:0.5px;">GOV [L]</div>`;
            slBadge.onclick = () => {
              if (this.toggleSpeedLimiter) this.toggleSpeedLimiter();
            };
            document.body.appendChild(slBadge);
          }
          if (slBadge) {
            slBadge.style.display = this.isPedestrian ? 'none' : 'flex';
            const slVal = document.getElementById('sl-val');
            if (slVal) slVal.textContent = speedLimitKmh;
            const slGov = document.getElementById('sl-gov-tag');
            if (slGov) {
              if (this.speedLimiter) {
                slGov.textContent = '🔒 ON';
                slGov.style.background = '#00e676';
                slGov.style.color = '#000';
                slBadge.style.borderColor = '#00e676';
                slBadge.style.boxShadow = '0 0 16px rgba(0,230,118,0.8), 0 4px 16px rgba(0,0,0,0.6)';
              } else {
                slGov.textContent = 'GOV [L]';
                slGov.style.background = '#333';
                slGov.style.color = '#fff';
                slBadge.style.borderColor = '#cc0000';
                slBadge.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
              }
            }
          }

          // Update speed control HUD badges
          if (!this.isPedestrian && this._updateSpeedCtrlHUD) this._updateSpeedCtrlHUD();

          const gspdEl = this.dom['gspd'];
          if (gspdEl) {
            gspdEl.textContent = k;
            let spCol = '#00c851';
            if (k > speedLimitKmh * 1.15) spCol = '#ff3b30'; // Red: 15%+ over limit
            else if (k > speedLimitKmh) spCol = '#ff9500';   // Orange: over limit
            else if (k > speedLimitKmh * 0.85) spCol = '#ffd54a'; // Yellow: approaching limit
            if (k > speedLimitKmh && Math.floor(Date.now() / 400) % 2 === 0) spCol = '#ff3b30';
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
        // ── Day/Night clock HUD ──
        if (this.dayNightCycle || this.mapCfg.isNight) {
          const dnClock = this.dom['dn-clock'];
          if (dnClock) {
            dnClock.style.display = 'flex';
            const tod = this.timeOfDay;
            const hours = Math.floor(tod * 24) % 24;
            const mins = Math.floor((tod * 24 - hours) * 60);
            const h12 = hours % 12 || 12;
            const ampm = hours < 12 ? 'AM' : 'PM';
            const timeStr = h12 + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;
            const dnTimeEl = this.dom['dn-time'];
            const dnIconEl = this.dom['dn-icon'];
            if (dnTimeEl) dnTimeEl.textContent = timeStr;
            const sunElev = Math.max(0, Math.sin(tod * Math.PI * 2 - Math.PI / 2));
            if (dnIconEl) dnIconEl.textContent = sunElev > 0.3 ? '☀️' : sunElev > 0.05 ? (tod < 0.5 ? '🌅' : '🌇') : '🌙';
            if (sunElev > 0.05 && sunElev < 0.3) {
              dnClock.style.background = tod < 0.5 ? 'rgba(255,170,100,0.92)' : 'rgba(220,100,50,0.92)';
            } else {
              dnClock.style.background = sunElev >= 0.3 ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,40,0.92)';
              dnClock.style.color = sunElev < 0.3 ? '#ccc' : 'var(--text)';
            }
          }
        }

        // ── Mission & Collectible HUD ──
        if (this.missionManager && this.missionManager.active) {
          const mm = this.missionManager;
          const stats = mm.getStats();

          // Update score display
          const hsc = this.dom['hsc'];
          if (hsc) hsc.textContent = this.playerScore || 0;

          // Update checkpoint progress
          const hcp = this.dom['hcp'];
          if (hcp) {
            const totalCp = mm.missions.filter(m => m.type === 'CHECKPOINT').reduce((sum, m) => sum + m.target, 0);
            const doneCp = mm.missions.filter(m => m.type === 'CHECKPOINT').reduce((sum, m) => sum + m.progress, 0);
            if (totalCp > 0) {
              hcp.textContent = `${doneCp}/${totalCp}`;
            } else {
              hcp.textContent = `${stats.collectiblesCollected}/${stats.collectibles}`;
            }
          }
        }
      }
      _drawFullscreenMap() {
        const fc = document.getElementById('fs-map-canvas');
        if (!fc) return;
        const ctx = fc.getContext('2d');
        if (!ctx) return;

        const W = fc.width, H = fc.height;
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#0a0f1a';
        ctx.fillRect(0, 0, W, H);

        const player = this.player;
        const graph  = this.roadGraph;
        const cfg    = this.mapCfg;
        if (!player || !graph) return;

        // Compute map world bounds
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        if (graph.nodes) {
          const nodes = Array.from(graph.nodes.values ? graph.nodes.values() : []);
          nodes.forEach(n => {
            if (n.position.x < minX) minX = n.position.x;
            if (n.position.x > maxX) maxX = n.position.x;
            if (n.position.z < minZ) minZ = n.position.z;
            if (n.position.z > maxZ) maxZ = n.position.z;
          });
        }
        if (minX === Infinity) { minX = -500; maxX = 500; minZ = -500; maxZ = 500; }
        const pad = 60;
        const worldW = maxX - minX || 1;
        const worldH = maxZ - minZ || 1;
        const scaleX = (W - pad * 2) / worldW;
        const scaleZ = (H - pad * 2) / worldH;
        const scale  = Math.min(scaleX, scaleZ);
        const offX   = (W - worldW * scale) / 2 - minX * scale;
        const offZ   = (H - worldH * scale) / 2 - minZ * scale;

        const wx = x => x * scale + offX;
        const wz = z => z * scale + offZ;

        // ── Roads ──
        const edges = typeof graph.getEdgeList === 'function'
          ? graph.getEdgeList()
          : (graph.edges ? Array.from(graph.edges.values ? graph.edges.values() : []) : []);

        edges.forEach(edge => {
          if (!edge.nodes || edge.nodes.length < 2) return;
          const a = edge.nodes[0].position, b = edge.nodes[1].position;
          const lw = Math.max(2, (edge.width || 14) * scale * 0.7);
          ctx.strokeStyle = '#1e2a3a';
          ctx.lineWidth = lw + 2;
          ctx.beginPath(); ctx.moveTo(wx(a.x), wz(a.z)); ctx.lineTo(wx(b.x), wz(b.z)); ctx.stroke();
          ctx.strokeStyle = '#2d4060';
          ctx.lineWidth = lw;
          ctx.beginPath(); ctx.moveTo(wx(a.x), wz(a.z)); ctx.lineTo(wx(b.x), wz(b.z)); ctx.stroke();
          // Centre dashed lane divider
          ctx.strokeStyle = 'rgba(255,220,80,0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 8]);
          ctx.beginPath(); ctx.moveTo(wx(a.x), wz(a.z)); ctx.lineTo(wx(b.x), wz(b.z)); ctx.stroke();
          ctx.setLineDash([]);
        });

        // ── Parks ──
        if (graph.buildingSlots) {
          graph.buildingSlots.forEach(slot => {
            if (!slot._isPark) return;
            const p = slot.getWorldPosition();
            ctx.fillStyle = 'rgba(76, 175, 80, 0.35)';
            ctx.fillRect(wx(p.x) - 6, wz(p.z) - 5, 12, 10);
          });
        }

        // ── Traffic Signals ──
        (this.sigs || []).forEach(sig => {
          const sp = sig.pos || sig.position || sig.mesh?.position;
          if (!sp) return;
          const col = sig.state === 'red' ? '#ff3b30' : sig.state === 'green' ? '#00e676' : '#ffd54a';
          ctx.beginPath();
          ctx.arc(wx(sp.x), wz(sp.z), 5, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // ── Bus Stops ──
        (this.busStops || []).forEach(bs => {
          ctx.fillStyle = '#1565c0';
          ctx.fillRect(wx(bs.x) - 5, wz(bs.z) - 5, 10, 10);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('B', wx(bs.x), wz(bs.z) + 3);
        });

        // ── Route line: player → checkpoint → destination ──
        const checkpts = this._checkpoints || (cfg && cfg.checkpoints) || [];
        const dest = checkpts.find(c => !c.reached) || checkpts[checkpts.length - 1];
        if (dest) {
          ctx.strokeStyle = '#00f0cc';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 6]);
          ctx.shadowColor = '#00f0cc';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(wx(player.position.x), wz(player.position.z));
          ctx.lineTo(wx(dest.x), wz(dest.z));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Destination pin
          ctx.fillStyle = '#00f0cc';
          ctx.beginPath();
          ctx.arc(wx(dest.x), wz(dest.z), 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('✦', wx(dest.x), wz(dest.z) + 3);
        }

        // ── NPC vehicles ──
        const npcColors = { bus: '#fb923c', truck: '#fb923c', bike: '#a855f7', activa: '#a855f7', splendor: '#a855f7', auto: '#facc15', police: '#ef4444', ambulance: '#f43f5e' };
        (this.trafficManager?.vehicles || []).forEach(v => {
          if (!v.active) return;
          const col = npcColors[v.type] || '#38bdf8';
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(wx(v.position.x), wz(v.position.z), 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // ── Player arrow ──
        const px = wx(player.position.x), pz = wz(player.position.z);
        const angle = player.rotation ? -(player.rotation.y) : 0;
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(angle);
        ctx.fillStyle = '#ffd54a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-6, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Pulsing halo
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ffd54a';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // ── Compass ──
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('N', W / 2, 20);
        ctx.fillText('S', W / 2, H - 8);
        ctx.fillText('W', 14, H / 2 + 4);
        ctx.fillText('E', W - 14, H / 2 + 4);
      }

      _ummap() {
        if (!this.player || !this.player.position) return;
        const mc = this.dom['mmc']; if (!mc || !this.playing) return; mc.classList.add('on');
        const W = mc.width || 180, H = mc.height || 180, cx = W / 2, cy = H / 2;
        const ctx = mc.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, W, H);
        // Radar circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.clip();

        // Dark slate radar background
        ctx.fillStyle = '#0a0f18';
        ctx.fillRect(0, 0, W, H);

        // Radar grid concentric range rings
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        [0.35, 0.70].forEach(rRatio => {
          ctx.beginPath();
          ctx.arc(cx, cy, (cx - 2) * rRatio, 0, Math.PI * 2);
          ctx.stroke();
        });

        // World translation centered on player
        ctx.save();
        ctx.translate(cx, cy);
        const scale = 0.55;
        ctx.scale(scale, scale);
        const px = this.player.position.x, pz = this.player.position.z;
        ctx.translate(-px, -pz);

        // 1. Draw Roads (from RoadGraph if available, fallback to roadSegments/mapCfg)
        if (this.roadGraph && this.roadGraph.edges && this.roadGraph.edges.length > 0) {
          ctx.strokeStyle = '#222836';
          ctx.lineCap = 'round';
          this.roadGraph.edges.forEach(e => {
            const n0 = e.nodes[0], n1 = e.nodes[1];
            if (!n0 || !n1) return;
            const w = (e.lanes || 2) * 6;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(n0.position.x, n0.position.z);
            ctx.lineTo(n1.position.x, n1.position.z);
            ctx.stroke();
          });
        } else if (this.roadSegments && this.roadSegments.length > 0) {
          ctx.fillStyle = '#222836';
          this.roadSegments.forEach(r => {
            if (r.type === 'v') ctx.fillRect(r.x - 7, -800, 14, 1600);
            else ctx.fillRect(-800, r.z - 7, 1600, 14);
          });
        } else if (this.mapCfg && this.mapCfg.roads) {
          ctx.fillStyle = '#222836';
          this.mapCfg.roads.forEach(r => {
            const w = r.width || 12;
            if (r.type === 'v') ctx.fillRect(r.x - w/2, Math.min(r.z1, r.z2), w, Math.abs(r.z2 - r.z1));
            else ctx.fillRect(Math.min(r.x1, r.x2), r.z - w/2, Math.abs(r.x2 - r.x1), w);
          });
        }

        // 2. Active GTA-Style GPS Road Route Outline
        const activeCP = this.cps && this.cps.length ? this.cps.find(c => !c.userData?.hit && !c.cleared) : null;
        if (activeCP) {
          const route = (this.mapCfg && this.mapCfg.route) || (this.driveRoute) || [];
          let waypoints = [];
          if (route && route.length >= 2) {
            waypoints = [{ x: px, z: pz }];
            let started = false;
            for (let r = 0; r < route.length; r++) {
              const pt = route[r];
              const distToPt = Math.hypot(pt.x - activeCP.position.x, pt.z - activeCP.position.z);
              const distFromPlayer = Math.hypot(pt.x - px, pt.z - pz);
              if (!started && distFromPlayer > 15) {
                waypoints.push(pt);
                started = true;
              } else if (started) {
                waypoints.push(pt);
                if (distToPt < 18) break;
              }
            }
            waypoints.push({ x: activeCP.position.x, z: activeCP.position.z });
          } else {
            waypoints = [{ x: px, z: pz }, { x: activeCP.position.x, z: activeCP.position.z }];
          }

          if (waypoints.length >= 2) {
            // 2A. Outer Road Outline Glow (Purple/Magenta border like GTA / Google Maps)
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(waypoints[0].x, waypoints[0].z);
            for (let w = 1; w < waypoints.length; w++) {
              ctx.lineTo(waypoints[w].x, waypoints[w].z);
            }
            ctx.stroke();

            // 2B. Inner Vibrant Cyan GPS Core
            ctx.strokeStyle = '#00f0cc';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(waypoints[0].x, waypoints[0].z);
            for (let w = 1; w < waypoints.length; w++) {
              ctx.lineTo(waypoints[w].x, waypoints[w].z);
            }
            ctx.stroke();

            // 2C. Animated dashed center pulse
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -((this.timer || 0) * 24);
            ctx.beginPath();
            ctx.moveTo(waypoints[0].x, waypoints[0].z);
            for (let w = 1; w < waypoints.length; w++) {
              ctx.lineTo(waypoints[w].x, waypoints[w].z);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }


        // 3. Traffic Signals (Red/Yellow/Green status dots)
        this.sigs.forEach(s => {
          const st = s.userData?.st || 'red';
          ctx.fillStyle = st === 'red' ? '#ff3b30' : st === 'green' ? '#00e676' : '#ffd54a';
          ctx.beginPath();
          ctx.arc(s.position.x, s.position.z, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // 4. Checkpoints / Objectives (Pulsing Target Ring)
        const pulse = (Math.sin((this.timer || 0) * 4) + 1) / 2;
        this.cps.forEach((cp, i) => {
          const isNext = (cp === activeCP) || (!activeCP && i === 0);
          if (isNext) {
            ctx.fillStyle = 'rgba(0, 240, 204, ' + (0.25 + 0.25 * pulse) + ')';
            ctx.beginPath();
            ctx.arc(cp.position.x, cp.position.z, 8 + pulse * 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00f0cc';
            ctx.beginPath();
            ctx.arc(cp.position.x, cp.position.z, 5, 0, Math.PI * 2);
            ctx.fill();
          } else if (!cp.cleared && !cp.userData?.hit) {
            ctx.fillStyle = 'rgba(255, 213, 74, 0.7)';
            ctx.beginPath();
            ctx.arc(cp.position.x, cp.position.z, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 5. NPC Vehicles (Color-coded dots)
        this.npcs.forEach(n => {
          const type = n.userData?.npcType || 'car';
          if (type === 'auto' || type === 'auto_yellow') ctx.fillStyle = '#facc15';
          else if (type === 'bike' || type === 'splendor' || type === 'activa' || type === 'ktm' || type === 'cycle') ctx.fillStyle = '#a855f7';
          else if (type === 'bus' || type === 'truck') ctx.fillStyle = '#fb923c';
          else if (type === 'police' || n.userData?.isRuleBreaker) ctx.fillStyle = '#ef4444';
          else if (type === 'ambulance') ctx.fillStyle = '#f43f5e';
          else ctx.fillStyle = '#38bdf8';

          const rot = n.rotation?.y || 0;
          ctx.save();
          ctx.translate(n.position.x, n.position.z);
          ctx.rotate(rot);
          ctx.fillRect(-2.5, -4, 5, 8);
          ctx.restore();
        });

        // 6. Pedestrians (Tiny pink dots)
        if (this.peds) {
          ctx.fillStyle = '#ec4899';
          this.peds.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.z, 2, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // 7. Player Indicator (Bright Directional Arrow)
        const pRot = this.isPedestrian ? (this.player.rotation?.y || 0) : (this.playerVehicle ? this.playerVehicle.rotation.y : this.player.rotation.y);
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(pRot);

        ctx.fillStyle = '#ffd54a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(6, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore(); // Restore world transform
        ctx.restore(); // Restore clip

        // Glassmorphic Bezel & Cardinal North (N) Indicator
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', cx, 14);
      }

      _buildLowPolyCity() {
        // Legacy static city builder — kept for compatibility.
        // The WorldStreamer now handles dynamic chunk loading in _buildScene().
        // This method is called as a fallback if WorldStreamer is not available.
        if (this.worldStreamer) return; // Streamer handles everything
        if (!window.PRELOADED_MODELS) return;

        const buildings = [
          'lowpoly_eco_building_grid', 'lowpoly_eco_building_slope', 'lowpoly_eco_building_terrace',
          'lowpoly_regular_building_twistedtower_large'
        ];
        const cars = [
          'lowpoly_car_06', 'lowpoly_car_13', 'lowpoly_car_16', 'lowpoly_car_19',
          'lowpoly_futuristic_car_1', 'lowpoly_van'
        ];
        const foliage = ['lowpoly_bush_06', 'lowpoly_bush_07', 'lowpoly_bush_10', 'lowpoly_palm_03'];
        const props = [
          'lowpoly_bus_stop_02', 'lowpoly_fountain_03', 'lowpoly_billboard_2x1_03', 'lowpoly_billboard_2x1_05',
          'lowpoly_billboard_4x1_03', 'lowpoly_billboard_4x1_04', 'lowpoly_signboard_01',
          'lowpoly_spotlight_01', 'lowpoly_spotlight_02', 'lowpoly_traffic_light_001',
          'lowpoly_traffic_light_002', 'lowpoly_traffic_light_003',
          'lowpoly_trash_02', 'lowpoly_trash_03', 'lowpoly_trash_04', 'lowpoly_trash_05', 'lowpoly_trash_06',
          'lowpoly_trash_can_04', 'lowpoly_trash_can_05', 'lowpoly_trash_can_06', 'lowpoly_trash_can_07', 'lowpoly_trash_can_08',
          'lowpoly_graffiti_03'
        ];

        const tiles = ['lowpoly_set_b_tiles_01', 'lowpoly_set_b_tiles_04', 'lowpoly_set_b_tiles_05', 'lowpoly_set_b_tiles_06', 'lowpoly_set_b_tiles_09'];

        const setupAsset = (key, x, z, ry, isGround = false) => {
          if (!window.PRELOADED_MODELS[key]) return;
          const asset = window.PRELOADED_MODELS[key].clone();
          asset.position.set(x, 0, z);
          asset.rotation.y = ry;
          const scale = isGround ? 1 : 1.2;
          asset.scale.set(scale, scale, scale);

          asset.traverse(c => {
            if (c.isMesh) {
              c.castShadow = !isGround;
              c.receiveShadow = true;
              c.frustumCulled = true;
              if (c.material) {
                c.material.metalness = 0.1;
                c.material.roughness = 0.8;
                c.material.needsUpdate = true;
              }
            }
          });

          this.scene.add(asset);

          if (!isGround && (key.includes('building') || key.includes('fountain') || key.includes('trash') || key.includes('traffic') || key.includes('bus_stop'))) {
            this.obstacles.push(asset);
          }
        };

        const gridSize = 40;
        const halfExtents = 8;

        for (let ix = -halfExtents; ix <= halfExtents; ix++) {
          for (let iz = -halfExtents; iz <= halfExtents; iz++) {
            const cx = ix * gridSize;
            const cz = iz * gridSize;

            if (Math.random() > 0.7) {
              const tile = tiles[Math.floor(Math.random() * tiles.length)];
              setupAsset(tile, cx, cz, Math.floor(Math.random() * 4) * (Math.PI / 2), true);
            }

            if (Math.abs(ix) <= 1 && Math.abs(iz) <= 1) continue;

            if (Math.random() > 0.6) {
              const bldg = buildings[Math.floor(Math.random() * buildings.length)];
              const ry = Math.floor(Math.random() * 4) * (Math.PI / 2);
              setupAsset(bldg, cx, cz, ry);

              if (Math.random() > 0.5) {
                const prop = props[Math.floor(Math.random() * props.length)];
                setupAsset(prop, cx + 15, cz + 15, Math.random() * Math.PI);
              }
              if (Math.random() > 0.5) {
                const fol = foliage[Math.floor(Math.random() * foliage.length)];
                setupAsset(fol, cx - 15, cz - 15, 0);
              }
            } else if (Math.random() > 0.7) {
              const car = cars[Math.floor(Math.random() * cars.length)];
              setupAsset(car, cx, cz, Math.floor(Math.random() * 4) * (Math.PI / 2));
            } else if (Math.random() > 0.8) {
              const prop = props[Math.floor(Math.random() * props.length)];
              setupAsset(prop, cx, cz, Math.random() * Math.PI);
            }
          }
        }
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

    window.Game = Game;
