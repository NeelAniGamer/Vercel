// ── Per-vehicle handling profiles ──
const VEHICLE_STATS = {
  bike:      { maxSpd: 1.35, accel: 0.058, fric: 0.935, turn: 0.082, grip: 0.48 },
  car:       { maxSpd: 1.10, accel: 0.045, fric: 0.945, turn: 0.065, grip: 0.62 },
  bus:       { maxSpd: 0.80, accel: 0.028, fric: 0.965, turn: 0.036, grip: 0.44 },
  truck:     { maxSpd: 0.90, accel: 0.033, fric: 0.960, turn: 0.042, grip: 0.50 },
  auto:      { maxSpd: 1.00, accel: 0.048, fric: 0.942, turn: 0.072, grip: 0.40 },
};

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
      pky1: -22.0, pky2: 0.0, pky3: 0.0,
      pvy1: 0.0, pvy2: 0.0, pvy3: 0.0, pvy4: 0.0,
      phy1: 0.0, phy2: 0.0, phy3: 0.0,
    },
    // Wet asphalt
    wet_asphalt: {
      pcy1: 1.2, pcy2: 0, pdy1: 0.9, pdy2: 0, pdy3: 0,
      pey1: 0.8, pey2: 0.0, pey3: 0.0, pey4: 0.0, pey5: 0.0,
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
      pky1: -18.0, pky2: 0.0, pky3: 0.0,
      pvy1: 0.0, pvy2: 0.0, pvy3: 0.0, pvy4: 0.0,
      phy1: 0.0, phy2: 0.0, phy3: 0.0,
    },
    // Gravel/dirt
    gravel: {
      pcy1: 1.1, pcy2: 0, pdy1: 0.7, pdy2: 0, pdy3: 0,
      pey1: 0.7, pey2: 0.0, pey3: 0.0, pey4: 0.0, pey5: 0.0,
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
      pky1: -12.0, pky2: 0.0, pky3: 0.0,
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
    const C = c.pex1;
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
              { x:-360,z:0 },{ x:-360,z:240 },{ x:-360,z:480 }],
      npcs: [
        { type:'taxi', color:0xffcc00, route:[[0,-480],[0,0],[0,480]] },
        { type:'bus', color:0x0044aa, route:[[240,-480],[240,0],[240,480]] },
        { type:'truck', color:0x884400, route:[[-240,480],[-240,0],[-240,-480]] },
        { type:'auto', color:0xff6600, route:[[360,-480],[360,0],[360,480]] }
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
        this.playing = false; this.pause = false; this.lightningTimer = 0; this.thunderSfx = null; this.score = 0; this.hp = 100; this.fine = 0; this.vio = 0; this.timer = 0;
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.pedestrianAIs = []; this.routeIdx = 0; this.retries = 0; this.hits = 0;
        this.violationsLog = [];
        this.kidModeActive = false;
        this.lodChunks = [];
        this.gyroOn = false; this.gyroBaseGamma = 0; this._gyroHandler = null;
        this.camYaw = 0; this.camPitch = 0;
        this.targetCamYaw = 0; this.targetCamPitch = 0;
        this._isDraggingMobileLook = false; this._mobileLookTouchId = null;
        this._prevMobileLookX = 0; this._prevMobileLookY = 0;
        this.dom = {}; // Cached DOM elements
        // Day/Night cycle state
        this.timeOfDay = 0.5; // 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
        this.dayNightCycle = false;
        this._dayNightSpeed = 1 / 300; // full cycle in 5 minutes
        this._ambient = null; this._hemi = null; this._moon = null;
        this._streetLights = []; this._windowLights = [];
        this._anchorNodes = []; // Living City Generator: Zoning seeds
        this._dnSkyA = new THREE.Color(); this._dnSkyB = new THREE.Color();
        this._dnFogA = new THREE.Color(); this._dnFogB = new THREE.Color();
        this._dnDawnSky = new THREE.Color(0xffaa66); this._dnDuskSky = new THREE.Color(0xdd6633);
        this._dnDawnFog = new THREE.Color(0xaa8855); this._dnDuskFog = new THREE.Color(0x884433);
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

        // PERFORMANCE: Disable expensive bloom on mobile
        try {
          if (THREE.EffectComposer && !isMobile) {
            this.composer = new THREE.EffectComposer(this.renderCore.renderer);
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
        const ids = ['3c', 'gspd', 'garc', 'htmr', 'hfin', 'hfill', 'hcp', 'da', 'da-arrow', 'dal', 'da-dist', 'ow', 'sig-ind', 'sind-lamp', 'sind-state', 'sind-dist', 'sind-timer', 'mmc', 'boostgauge', 'boost-arc', 'boost-pct', 'boost-vignette', 'boost-ready', 'speed-lines', 'phone-gps', 'phone-gps-arrow', 'phone-gps-dist', 'phone-gps-dir', 'phone-gps-obj', 'phone-gps-btn', 'dn-clock', 'dn-time', 'dn-icon', 'hsc'];
        ids.forEach(id => { this.dom[id] = document.getElementById(id); });
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
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        // Pointer Lock & Mouse Look
        this._lastPointerUnlock = 0;
        if (this.renderCore.renderer && this.renderCore.renderer.domElement) {
          this.renderCore.renderer.domElement.addEventListener('click', () => {
            if (this.playing && !this.pause && Date.now() - this._lastPointerUnlock > 500) {
              try { 
                const p = document.body.requestPointerLock();
                if (p && p.catch) p.catch(() => {});
              } catch(e) {}
            }
          });
        }
        document.addEventListener('pointerlockchange', () => {
          const locked = document.pointerLockElement === this.renderCore.renderer.domElement;
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
              this.targetCamYaw -= e.movementX * 0.003;
            }
            this.targetCamPitch -= e.movementY * 0.003;
            this.targetCamPitch = Math.max(-1.5, Math.min(1.5, this.targetCamPitch));
          } else if (this._isDraggingCamera) {
            this.targetCamYaw -= e.movementX * 0.004;
            this.targetCamPitch -= e.movementY * 0.004;
            this.targetCamPitch = Math.max(-1.0, Math.min(1.0, this.targetCamPitch));
          }
        });
        // Left-click drag for third-person camera orbit (desktop only)
        if (this.renderCore.renderer && this.renderCore.renderer.domElement) {
          this.renderCore.renderer.domElement.addEventListener('mousedown', (e) => {
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
            if (e.gamma !== null) this._lastGyroGamma = e.gamma;
            if (e.gamma !== null && this._calibrating) this._gyroSamples.push(e.gamma);
            if (e.gamma !== null && this.gyroOn && this.playing && !this.isPedestrian && !this._calibrating) {
              const raw = Math.max(-30, Math.min(30, e.gamma));
              window.gyroSteering = (raw - this.gyroBaseGamma) / 30;
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
      _initG() { document.querySelectorAll('.gb').forEach(b => { b.addEventListener('click', () => this.setGear(b.dataset.g)); b.addEventListener('touchstart', e => { e.preventDefault(); this.setGear(b.dataset.g); }, { passive: false }); }); }

      // ── VIRTUAL JOYSTICK FOR MOBILE ──
      _initVirtualJoystick() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;

        const joystick = document.getElementById('virtual-joystick');
        const knob = document.getElementById('joystick-knob');
        if (!joystick || !knob) return;

        // Show joystick on mobile
        joystick.style.display = 'flex';

        let isDragging = false;
        let startX = 0, startY = 0;
        const maxDist = 40; // Max distance knob can move from center
        const joystickRadius = 65; // Half of joystick width

        const handleJoystickMove = (clientX, clientY) => {
          const rect = joystick.getBoundingClientRect();
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
          knob.style.transform = `translate(${dx}px, ${dy}px)`;

          // Set steering based on horizontal movement
          window.analogSteering = dx / maxDist;
          // Set throttle based on vertical movement (negative dy is up)
          window.analogThrottle = -dy / maxDist;
        };

        const resetJoystick = () => {
          isDragging = false;
          knob.style.transform = 'translate(0px, 0px)';
          window.analogSteering = 0;
          window.analogThrottle = 0;
        };

        // Touch events for joystick
        joystick.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        joystick.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          e.preventDefault();
          handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        joystick.addEventListener('touchend', resetJoystick);
        joystick.addEventListener('touchcancel', resetJoystick);

        // Also support mouse for testing
        joystick.addEventListener('mousedown', (e) => {
          isDragging = true;
          handleJoystickMove(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          handleJoystickMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', resetJoystick);

        // Hide default steering wheel when joystick is active
        const steerWheel = document.getElementById('steer-wheel-container');
        if (steerWheel) steerWheel.style.display = 'none';
      }

      // ── CAMERA JOYSTICK FOR MOBILE LOOK-AROUND ──
      _initCameraJoystick() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;

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
          const sensitivity = 0.04;
          this.targetCamYaw -= dx * sensitivity;
          this.targetCamPitch -= dy * sensitivity;
          this.targetCamPitch = Math.max(-1.2, Math.min(1.2, this.targetCamPitch));
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
          if (e.button === 0 && this.playing && !this.pause) {
            // Enable mouse steering when clicking on canvas in pedestrian mode or stationary
            if (this.isPedestrian || Math.abs(this.speed) < 0.1) {
              mouseActive = true;
            }
          }
        });

        window.addEventListener('mouseup', () => {
          mouseActive = false;
        });

        window.addEventListener('mousemove', (e) => {
          if (!mouseActive || !this.playing || this.pause) return;

          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;

          // Calculate angle from center of screen
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;

          // Only steer if mouse is away from center
          if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
            const targetAngle = Math.atan2(dx, -dy);

            let diff = targetAngle - this.player.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            this.player.rotation.y += diff * 0.08;
          }
        });
      }

      _decayCameraLook(dt) {
        if (this._isDraggingMobileLook) return;
        if (this._camJoyActive) return;
        if (this.isPointerLocked || this._isDraggingCamera) return;
        // After camera joystick use, use very slow decay so angle is preserved
        const decayRate = this._camJoyEverUsed ? 0.3 : 4;
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
      _horn() { 
          this._honkedThisFrame = true;
          if (this.mapCfg && this.mapCfg.isSilenceZone) {
              this.vio++;
              this.violationsLog.push('NO_HONKING');
              this.score -= 50;
              this.fine += 2000;
              ui.issueChallan('Honking in No-Honking Zone', 'Sec 190(2) MV Act', '₹2,000', 'Silence Zone Violation');
          } else {
              toast('📢 Beep Beep!', '#ffd54a'); 
              sfx.play('horn'); 
          } 
      }
      _brake() { this.speed *= .35; sfx.play('brake'); toast('🛑 Hard Deceleration Active', '#fff'); }
      startLevel() {
        const cd = document.getElementById('cdown');
        if (cd) cd.classList.add('on');
        const gc = document.getElementById('gc');
        // Fullscreen is only allowed on user gesture.

        setTimeout(() => {
          if (cd) cd.classList.remove('on');
          this._actualStart(ui.cur);
        }, 1500);
      }
      async _actualStart(lv) {
        this.mode = lv.mode; this.vehMode = lv.vehMode; this.lvId = lv.id; this.score = 0; this.hp = 100; this.fine = 0; this.vio = 0; this.timer = 0; this.speed = 0; this.routeIdx = 0; this.retries = 0; this.vx = 0; this.vz = 0;
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
        this._lastStepTime = 0;
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
        document.getElementById('hlv').textContent = lv.id; document.getElementById('hobj').textContent = lv.tg; this._uh(); sfx.play('ok');
        if (this._hudShowBrief) this._hudShowBrief();
        
        // Initialize tasks for this level
        this._initTasks(lv);

        // Register HUD elements with SafeZoneGrid for responsive layout
        if (window.safeZoneGridInstance) {
          // Register proper UI container elements to prevent layout breaking/overlap
          const SZ = window.safeZoneGridInstance;
          if (document.getElementById('hud')) SZ.register('hud', document.getElementById('hud'), 'TL', { order: 0, priority: 'high' });
          if (document.getElementById('hudbar')) SZ.register('hudbar', document.getElementById('hudbar'), 'TL', { order: 1, priority: 'high' });
          if (document.getElementById('hwrap')) SZ.register('hwrap', document.getElementById('hwrap'), 'TL', { order: 2, priority: 'medium' });
          if (document.getElementById('objective-overlay')) SZ.register('objective', document.getElementById('objective-overlay'), 'TR', { order: 0, priority: 'high' });
          if (this.dom.mmc) SZ.register('minimap', this.dom.mmc, 'TR', { order: 1, priority: 'high' });
          if (this.dom['sig-ind']) SZ.register('signal', this.dom['sig-ind'], 'BL', { order: 0, priority: 'high' });
          if (document.getElementById('spgauge')) SZ.register('speedometer', document.getElementById('spgauge'), 'BR', { order: 0, priority: 'high' });
          if (this.dom.boostgauge) SZ.register('boost', this.dom.boostgauge, 'BR', { order: 1, priority: 'high' });
          if (this.dom.ow) SZ.register('violations', this.dom.ow, 'BR', { order: 2, priority: 'medium' });
          if (this.dom['dn-clock']) SZ.register('clock', this.dom['dn-clock'], 'TC', { order: 0, priority: 'medium' });
          if (this.dom.da) SZ.register('direction', this.dom.da, 'BC', { order: 0, priority: 'high' });
          if (this._isMobile) {
            SZ.register('steer', document.getElementById('steer-wheel-container'), 'BL', { order: 10, priority: 'high' });
            SZ.register('gas', document.getElementById('mc-gas'), 'BR', { order: 10, priority: 'high' });
            SZ.register('brake', document.getElementById('mc-brake'), 'BR', { order: 11, priority: 'high' });
          }
        }
      }
      stopPlay() { this.playing = false; this.tasks = []; const tt = document.getElementById('task-tracker'); if (tt) tt.style.display = 'none'; ['gc', 'hud', 'hudbar', 'hwrap', 'spgauge', 'gp', 'tc', 'mobile-controls', 'objective-overlay'].forEach(i => { const el = document.getElementById(i); if (el) el.classList.remove('on'); }); const cc = document.getElementById('civic-controls'); if (cc) cc.style.display = 'none'; const bg = this.dom['boostgauge']; if (bg) bg.style.display = 'none'; const bv = this.dom['boost-vignette']; if (bv) { bv.style.display = 'none'; bv.style.opacity = '0'; }         const br = this.dom['boost-ready']; if (br) { br.style.display = 'none'; br.style.opacity = '0'; }         const sl = this.dom['speed-lines']; if (sl) { sl.style.display = 'none'; sl.style.opacity = '0'; } this._camShakeAmt = 0; this._camTilt = 0; this._camFovTarget = 60; if(this.dom['mmc']) this.dom['mmc'].classList.remove('on'); const cmp = document.getElementById('compass-strip'); if (cmp) cmp.style.display = 'none'; if(this.dom['da']) this.dom['da'].style.display = 'none'; if(this.dom['sig-ind']) this.dom['sig-ind'].style.display = 'none'; if(this.dom['ow']) this.dom['ow'].classList.remove('on'); if(this.dom['phone-gps']) this.dom['phone-gps'].classList.remove('on'); this.phoneGpsOn = false; if(this.dom['phone-gps-btn']) this.dom['phone-gps-btn'].style.display = 'none'; 
        
        // Release all pooled objects to prevent memory leaks
        if (window.ThreePools) ThreePools.releaseAll();
        
        // Clear road graph reference
        this.roadGraph = null;
      }
      toggleSeatbelt(btn) {
          this.seatbeltOn = !this.seatbeltOn;
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
                      ui.issueChallan('Using Mobile while Driving', 'Sec 184 MV Act', '₹5,000', 'Dangerous Driving');
                      this.vio++; this.violationsLog.push('MOBILE_USE'); this.score -= 50; this.fine += 5000;
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
        else this._confettiThree();
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
        setTimeout(() => { _mco.remove(); ui.showQuiz(ui.curMode || 'car', { violations: this.violationsLog }); }, 3000);
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
        cfg.startOutside = true;
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
          let profileStr = localStorage.getItem('traffic_profile');
          let profile = profileStr ? JSON.parse(profileStr) : {};
          let username = profile.username || (window.colUser && window.colUser.user_metadata && window.colUser.user_metadata.username) || 'Anonymous';
          
          let usernameSpriteVeh = createNametagSprite(username);
          usernameSpriteVeh.position.set(0, 3, 0);
          this.playerVehicle.add(usernameSpriteVeh);

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

      _buildScene(mode) {
        if (typeof initGTex === 'function') initGTex();
        while (this.scene && this.scene.children.length) this.scene.remove(this.scene.children[0]);
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.pedestrianAIs = []; this.speedBreakers = [];
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
        const lowPerf = this._isMobile || this._isLowGPU;
        const fogNear = lowPerf ? Math.min(fogDist * 0.35, 50) : fogDist * 0.35;
        const fogFar = lowPerf ? Math.min(fogDist * 1.2, 250) : fogDist * 1.2;
        if (cfg.mode === 'rain' || cfg.hasRain) {
            this.scene.fog = new THREE.Fog(sk, fogNear * 0.3, fogFar * 0.5);
        } else {
            this.scene.fog = new THREE.Fog(sk, fogNear, fogFar);
        }
        // Enhanced true color lighting with better contrast and shadows
        this._ambient = new THREE.AmbientLight(0xffffff, cfg.isNight ? 0.1 : 0.35);
        this.scene.add(this._ambient);
        this._hemi = new THREE.HemisphereLight(0x87ceeb, 0x8a7560, cfg.isNight ? 0.1 : 0.45);
        this.scene.add(this._hemi);

        this._sun = new THREE.DirectionalLight(0xfff5e0, cfg.isNight ? 0.4 : 1.2);
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
        this._moon = new THREE.DirectionalLight(0x88aacc, cfg.isNight ? 0.5 : 0);
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

        // Build Road Graph from level config (spatial topology for NPC routing, building placement)
        if (window.RoadGraph) {
            this.roadGraph = RoadGraph.fromLevelConfig(cfg);
            this.roadGraph.setAnchorNodes(this._anchorNodes);
        }

        const RW = cfg.isPedestrian ? 10 : 12;
        this.driveRoute = cfg.route;
        this._initBreadcrumbPath();
        
        // NEW: Graph-based road and building generation
        if (!window._toonGrad) {
          const gc = new Uint8Array([40, 130, 255]);
          window._toonGrad = new THREE.DataTexture(gc, 3, 1, THREE.RedFormat);
          window._toonGrad.minFilter = THREE.NearestFilter;
          window._toonGrad.magFilter = THREE.NearestFilter;
          window._toonGrad.needsUpdate = true;
        }        const tg = window._toonGrad;
        const gs = cfg.is50km ? 8000 : 2000;
        const groundColor = cfg.ground !== undefined ? cfg.ground : 0x4a4a4f;
        const groundMat = cfg.isBridge
          ? new THREE.MeshToonMaterial({ color: 0x1a5a8a, transparent: true, opacity: 0.7, gradientMap: tg })
          : (cfg.is50km ? new THREE.MeshToonMaterial({ color: 0x444444, gradientMap: tg }) : new THREE.MeshToonMaterial({ color: groundColor, gradientMap: tg }));
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(gs, gs), groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        if (this.roadGraph) {
            this._buildRoadsFromGraph(RW);
            this._buildBuildingsFromGraph();
        } else {
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
        });
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
            saBldg.position.set(-30, 20, 0);
            this.scene.add(saBldg);
            this.obstacles.push(saBldg);
            if (!this._landmarks) this._landmarks = [];
            this._landmarks.push({ name: 'Sneh Asha', x: -30, z: 0, discovered: false });
            
            new THREE.TextureLoader().load('sneh-logo.png', tex => {
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
        // Attach PedestrianAI for intelligent behavior
        if (typeof PedestrianAI !== 'undefined') {
          const pedAI = new PedestrianAI(ped, this.trafficManager);
          this.pedestrianAIs.push(pedAI);
          ped._pedAI = pedAI;
        }
    }
} else if (cfg.themeType === 'respectful_parking') {
            // Spawn haphazard parked cars
            for (let i = 0; i < 15; i++) {
                const carTpl = this._makeNPC('car', 0x999999);
                if (carTpl) {
                  const pc = carTpl.clone();
                  pc.position.set((Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 4), 0, (Math.random() - 0.5) * 150);
                  pc.rotation.y = (Math.random() - 0.5) * 0.5;
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
          // School children pedestrians with PedestrianAI (child profile)
          for (let i = 0; i < 6; i++) {
            const child = _buildHuman();
            child.position.set(-40 + (Math.random() - 0.5) * 20, 0, -60 + (Math.random() - 0.5) * 10);
            child.userData = { spd: 0, state: 'waiting', t: Math.random() * 5, isV: false, dir: 1, side: 1 };
            this.scene.add(child); this.peds.push(child);
            if (typeof PedestrianAI !== 'undefined') {
              const childAI = new PedestrianAI(child, this.trafficManager);
              childAI.profileKey = 'child'; childAI.profile = PED_PROFILES.child;
              this.pedestrianAIs.push(childAI); child._pedAI = childAI;
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

        // Construction Zone with Flagman (level 34)
        if (cfg.hasConstruction) {
          // Construction barriers
          for (let cb = 0; cb < 6; cb++) {
            const barrier = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.3), new THREE.MeshToonMaterial({ color: cb % 2 === 0 ? 0xff6600 : 0xffffff }));
            barrier.position.set(-10 + cb * 4, 0.5, 30 + Math.sin(cb) * 2);
            this.scene.add(barrier);
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

        // Bollards and barricades
        const bCount = cfg.isPedestrian ? 2 : 6;
        for (let i = 0; i < bCount; i++) {
          const seg = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
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
            const seg = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
            const types = ['car', 'auto', 'bike'];
            const pcTpl = this._makeNPC(types[i % 3], Math.random() * 0xffffff);
            if (pcTpl) {
              const pc = pcTpl.clone();
              if (seg.type === 'v') pc.position.set(seg.x + (Math.random() > .5 ? 5.5 : -5.5), 0, seg.z1 + Math.random() * (seg.z2 - seg.z1));
              else pc.position.set(seg.x1 + Math.random() * (seg.x2 - seg.x1), 0, seg.z + (Math.random() > .5 ? 5.5 : -5.5));
              pc.userData = { isParked: true, halfW: 2.5, halfD: 1.5 };
              this.scene.add(pc); this.obstacles.push(pc);
            }
          }
        }
      
      // Initialize TrafficManager and NPCAI for Mumbai-style traffic
      if (!cfg.isPedestrian && window.TrafficManager && window.NPCAI) {
        if (!this.trafficManager) {
          this.trafficManager = new window.TrafficManager(this);
          this.npcAI = new window.NPCAI(this, this.roadGraph, this.trafficManager);
        }
        this.trafficManager.init(cfg.npcTypes || []);
        this.npcAI.init();
      }
       
      // ─── Graph-based road generation ───
      // Builds visual road geometry (tiles, sidewalks, crosswalks) from RoadGraph edges
      // Uses GLB road models when available, falls back to procedural geometry

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
          return;
        }

        // Road material (visible)
        const roadMat = new THREE.MeshToonMaterial({ color: 0x3d3f45, gradientMap: window._toonGrad });
        const paveMat = new THREE.MeshToonMaterial({ color: 0xb0b0a0, gradientMap: window._toonGrad });
        const tactileMat = new THREE.MeshToonMaterial({ color: 0xd4a017, gradientMap: window._toonGrad });

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

          // Crosswalks at intersections (nodes with degree >= 3)
          const nodeA = edge.nodes[0];
          const nodeB = edge.nodes[1];
          [nodeA, nodeB].forEach(node => {
            if (node.edges.length >= 3) {
              // Zebra crossing on this edge near the intersection
              const t = node === nodeA ? 0 : 1;
              const crosswalkLen = 4;
              const crosswalkW = roadWidth;
              const crosswalkCount = 5;
              for (let c = 0; c < crosswalkCount; c++) {
                const offset = (c - (crosswalkCount - 1) / 2) * (crosswalkLen + 1);
                const czOffset = isV ? offset : 0;
                const cxOffset = isV ? 0 : offset;
                const cw = new THREE.Mesh(
                  isV ? new THREE.PlaneGeometry(crosswalkW, crosswalkLen) : new THREE.PlaneGeometry(crosswalkLen, crosswalkW),
                  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
                );
                cw.rotation.x = -Math.PI / 2;
                const nodePos = node.position;
                cw.position.set(
                  nodePos.x + cxOffset,
                  0.03,
                  nodePos.z + czOffset
                );
                this.scene.add(cw);
              }
              // Tactile paving
              [-1, 1].forEach(side => {
                const tp = new THREE.Mesh(
                  isV ? new THREE.BoxGeometry(2, 0.05, crosswalkW + 2) : new THREE.BoxGeometry(crosswalkW + 2, 0.05, 2),
                  tactileMat
                );
                tp.position.set(
                  isV ? nodePos.x + side * (roadWidth / 2 + 1) : nodePos.x,
                  0.04,
                  isV ? nodePos.z : nodePos.z + side * (roadWidth / 2 + 1)
                );
                this.scene.add(tp);
              });
            }
          });
        });
      }

      // ─── Graph-based building generation ───
      // Places buildings using RoadGraph's buildingSlots (road-aware, zoned)
      // Uses InstancedMesh for GLB models, falls back to procedural boxes
      _buildBuildingsFromGraph() {
        const graph = this.roadGraph;
        const cfg = this.mapCfg;
        if (!graph || !graph.buildingSlots?.length) return;

        const bMats = [
          new THREE.MeshToonMaterial({ color: 0xd9cfc4, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xc4b8a8, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xb0a898, gradientMap: window._toonGrad }),
          new THREE.MeshToonMaterial({ color: 0xd4c8b8, gradientMap: window._toonGrad })
        ];
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
          const rot = slot.getRotation();
          const distFromCenter = Math.hypot(pos.x, pos.z);
          const type = getBldgType(zone, distFromCenter);
          const prefixes = typeMap[type] || typeMap['house'];
          const key = pickModel(prefixes);

          if (key && modelKeys.length > 0) {
            if (!instancedData[key]) instancedData[key] = [];
            instancedData[key].push({ x: pos.x, z: pos.z, r: rot, s: 10.5 });
            slot.occupied = true;
            return;
          }

          // Fallback: procedural box building
          const g = new THREE.Group();
          const mat = bMats[Math.floor(Math.random() * bMats.length)];
          const bh = 16 + Math.random() * 16;
          const bw = 10 + Math.random() * 10;
          const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 14), mat);
          bMesh.position.y = bh / 2;
          g.add(bMesh);

          if (cfg.isNight && !cfg.is50km) {
            const lWinMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
            const winRows = Math.floor(bh / 4);
            const winCols = Math.floor(bw / 3.5);
            for (let wr = 0; wr < winRows; wr++) {
              for (let wc = 0; wc < winCols; wc++) {
                if (Math.random() > 0.55) continue;
                const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), lWinMat);
                wMesh.position.set(-bw / 2 + 2 + wc * 3.5, 3 + wr * 4, 7.01);
                g.add(wMesh);
                const wMesh2 = wMesh.clone();
                wMesh2.position.z = -7.01;
                wMesh2.rotation.y = Math.PI;
                g.add(wMesh2);
              }
            }
          }
          
          g.position.set(pos.x, 0, pos.z);
          g.rotation.y = rot;
          g.userData = { isBuilding: true, halfW: bw / 2, halfD: 7 };
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
              im.frustumCulled = true;
              
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

      // ── PATH ARROW INDICATORS ──
      // Directional chevron arrows placed on the road (vehicle mode) or
      // sidewalk (pedestrian mode) showing the player where to go.
      // Enhanced with glow effect and better visibility.
      _buildArrows() {
          if (!this.mapCfg || !this.mapCfg.route || this.mapCfg.route.length < 2) { this._arrows = []; return; }
          this._arrows = [];
          const route = this.mapCfg.route;
          const arrowColor = this.isPedestrian ? 0xffab40 : 0x00e676;
          // Enhanced arrow material with glow effect
          const arrowMat = new THREE.MeshBasicMaterial({
              color: arrowColor,
              transparent: true,
              opacity: 0.85,
              side: THREE.DoubleSide,
              depthWrite: false
          });
          // Add glow ring for each arrow cluster
          const glowMat = new THREE.MeshBasicMaterial({
              color: arrowColor,
              transparent: true,
              opacity: 0.25,
              side: THREE.DoubleSide
          });
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

      _updateLights(dt) {
        if (!this.playing || this.pause) return;
        const lights = [...(this._streetLights || []), ...(this._windowLights || [])];
        if (!lights.length) return;

        const pPos = this.player.position;
        const candidates = lights.map(l => ({
          l,
          distSq: pPos.distanceToSquared(l.position)
        }));

        candidates.sort((a, b) => a.distSq - b.distSq);

        for (let i = 0; i < candidates.length; i++) {
          candidates[i].l.visible = i < 8;
        }
      }

      _loop() {
        // PERFORMANCE: Frame rate capping to prevent excessive CPU/GPU usage
        const now = performance.now();
        const isLowEnd = this._isMobile && (navigator.deviceMemory || 8) < 6;
        const frameInterval = isLowEnd ? 1000 / 30 : 1000 / 60;
        const elapsed = now - (this._lastFrame || 0);
        if (elapsed < frameInterval) {
          requestAnimationFrame(() => this._loop());
          return;
        }
        this._lastFrame = now - (elapsed % frameInterval);

        requestAnimationFrame(() => this._loop()); if (!this.playing || this.pause) { if (this.renderCore && this.scene && this.camera) this.renderCore.render(this.scene, this.camera); return; }
        const dt = Math.min(this.clock.getDelta(), .033); this.timer += dt;
        this._honkedThisFrame = false;
        this._collidedThisFrame = false;
        
        // Use RenderCore quality settings for dynamic budgets
        const lodMult = this.renderCore ? this.renderCore.getLODMultiplier() : 1.0;
        const maxParticles = this.renderCore ? this.renderCore.getMaxParticles() : 2000;
        
        // ─── WORLD STREAMING + FLOATING ORIGIN ───
        // this._updateStreaming(); // Function undefined
        // this._checkFloatingOrigin(); // Function undefined
        
        this._tickEnterExit(dt); this._input(dt); this._usigs(dt); this._unpcs(dt); this._upeds(dt); this._ucps(dt); this._updateArrows(); this._ugps(); this._checkBrakeZones(dt); this._uobs(dt); this._umode(dt); this._updateLights(dt); this._decayCameraLook(dt); this._ucam(dt); this._usun(dt); this._updateDayNight(dt); this._uhud(); this._ummap(); this._utransit(); this._computeTaskFlags(); this._checkTasks(); this._updateRain(dt); this._updateRainAudio(this.mode === 'rain' || this.mapCfg?.hasRain); this._updateDynamicLOD(lodMult); this._updateBreadcrumbPath(dt);

        // Update player character FBX animation mixer
        if (this.playerCharacter && this.playerCharacter.userData && this.playerCharacter.userData.isFBXAnimated && this.playerCharacter.userData.mixer) {
          this.playerCharacter.userData.mixer.update(dt);
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
                ui.issueChallan((this.vehMode === 'bike' || this.vehMode === 'cycle') ? 'Riding without Helmet' : 'Driving without Seatbelt', 'Sec 194D MV Act', '₹1,000', 'Safety Violation');
                this.vio++; this.violationsLog.push('SAFETY_VIOLATION'); this.score -= 20; this.fine += 1000;
            }
        }

        if (this.keys['f'] && !this._fPressed && this._enterState === 'IDLE') {
          this._fPressed = true;
          if (this.playerVehicle && this.playerCharacter) {
            if (this.isPedestrian) {
              const dist = this.player.position.distanceTo(this.playerVehicle.position);
              if (dist < 3.0) {
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
        if (!this.keys['f']) this._fPressed = false;

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
            else if (this.gyroOn) tAmt = -window.gyroSteering;
            else if (window.analogSteering) tAmt = -window.analogSteering;
            if (tAmt !== 0) this.player.rotation.y += tAmt * effTurn * Math.sign(this.speed) * dt * 60;
            // Normalize yaw to [-PI, PI] to prevent extreme accumulation
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
              ui.issueChallan('Turning without Indicator', 'Sec 125 MV Act', '₹500', 'Signal Violation');
              this.vio++; this.violationsLog.push('NO_INDICATOR'); this.score -= 30; this.fine += 500;
              toast('⚠️ Use turn signals! ₹500 fine', '#ff9500');
              sfx.play('error');
            }
          } else {
            this._turnAccum = 0;
            this._turnAccumDir = 0;
          }

          const targetVx = Math.sin(this.player.rotation.y) * this.speed;
          const targetVz = Math.cos(this.player.rotation.y) * this.speed;
          // ── Pacejka Tire Model Integration ──
          // Compute tire forces using Pacejka MF 5.2
          if (!overrideMove && !this.isPedestrian) {
            const pacejkaConfig = VEHICLE_PACEJKA_CONFIG[this.vehMode] || VEHICLE_PACEJKA_CONFIG.car;
            const mass = pacejkaConfig.mass;
            const frontWeightDist = pacejkaConfig.front_weight_dist;
            const frontTrack = pacejkaConfig.front_track;
            const rearTrack = pacejkaConfig.rear_track;
            const wheelbase = pacejkaConfig.wheelbase;
            const cgHeight = pacejkaConfig.cg_height;
            
            // Weight distribution
            const Fz_front_total = mass * 9.81 * frontWeightDist;
            const Fz_rear_total = mass * 9.81 * (1 - frontWeightDist);
            const Fz_front_per_wheel = Fz_front_total / 2;
            const Fz_rear_per_wheel = Fz_rear_total / 2;
            
            // Weight transfer (longitudinal)
            const longAccel = (targetVx - this.vx) / (dt + 1e-6); // approximate
            const weightTransfer = mass * longAccel * cgHeight / wheelbase;
            const Fz_fl = Fz_front_per_wheel - weightTransfer / 2;
            const Fz_fr = Fz_front_per_wheel - weightTransfer / 2;
            const Fz_rl = Fz_rear_per_wheel + weightTransfer / 2;
            const Fz_rr = Fz_rear_per_wheel + weightTransfer / 2;
            
            // Lateral acceleration
            const latAccel = (targetVx - this.vx) / (dt + 1e-6);
            const latWeightTransfer = mass * latAccel * cgHeight / (frontTrack + rearTrack);
            const Fz_fl_lat = Fz_fl - latWeightTransfer / 2;
            const Fz_fr_lat = Fz_fr + latWeightTransfer / 2;
            const Fz_rl_lat = Fz_rl - latWeightTransfer / 2;
            const Fz_rr_lat = Fz_rr + latWeightTransfer / 2;
            
            // Slip angle (from velocity vector vs heading)
            const velocityAngle = Math.atan2(this.vx, this.vz);
            const headingAngle = this.player.rotation.y;
            const slipAngle = velocityAngle - headingAngle;
            
            // Slip ratio (simplified)
            const wheelSpeed = Math.abs(this.speed);
            const groundSpeed = Math.hypot(this.vx, this.vz);
            const slipRatio = groundSpeed > 0.01 ? (wheelSpeed - groundSpeed) / Math.max(groundSpeed, 0.01) : 0;
            
            // Surface type
            const surfaceType = (this.mode === 'rain' || (this.mapCfg && this.mapCfg.hasRain)) ? 'wet_asphalt' : 'dry_asphalt';
            
            // Compute combined forces for each wheel using Pacejka
            const frontLeft = PACEJKA.computeCombinedForce(slipAngle, slipRatio * 0.5, Fz_fl_lat, 0, 'dry_asphalt');
            const frontRight = PACEJKA.computeCombinedForce(slipAngle, slipRatio * 0.5, Fz_fr_lat, 0, 'dry_asphalt');
            const rearLeft = PACEJKA.computeCombinedForce(0, slipRatio, Fz_rl_lat, 0, 'dry_asphalt');
            const rearRight = PACEJKA.computeCombinedForce(0, slipRatio, Fz_rr_lat, 0, 'dry_asphalt');
            
            // Sum forces
            const totalFx = frontLeft.Fx + frontRight.Fx + rearLeft.Fx + rearRight.Fx;
            const totalFy = frontLeft.Fy + frontRight.Fy + rearLeft.Fy + rearRight.Fy;
            
            // Apply forces to velocity
            const Fx_local = totalFx * Math.cos(this.player.rotation.y) - totalFy * Math.sin(this.player.rotation.y);
            const Fy_local = totalFx * Math.sin(this.player.rotation.y) + totalFy * Math.cos(this.player.rotation.y);
            
            const ax = Fx_local / mass;
            const ay = Fy_local / mass;
            
            this.vx += ax * dt;
            this.vz += ay * dt;
            
            // Update speed from velocity
            this.speed = Math.hypot(this.vx, this.vz);
            
            // Yaw moment (simplified)
            const yawMoment = (frontLeft.Fy + frontRight.Fy) * wheelbase / 2 * frontWeightDist - 
                             (rearLeft.Fy + rearRight.Fy) * wheelbase / 2 * (1 - frontWeightDist);
            const yawAccel = yawMoment / pacejkaConfig.inertia_yaw;
            this.player.rotation.y += yawAccel * dt;
          } else {
        
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
                    window.ui.issueChallan('Overspeeding', 'Sec 112 MV Act', 'Rs. 1,000', 'Limit: ' + this.mapCfg.speedLimit + ' km/h');
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
                  window.ui.issueChallan('Two-Wheeler Overspeeding', 'Sec 112 MV Act', 'Rs. 1,000', 'Safe limit: ' + bikeSafeLimit + ' km/h');
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
                  ringEl.style.cssText = 'position:fixed;top:12%;left:50%;transform:translateX(-50%);background:#1a1a2e;border:3px solid #f2b84b;border-radius:16px;padding:20px 30px;z-index:10002;display:flex;flex-direction:column;align-items:center;gap:12px;animation:ring-pulse 1s ease-in-out infinite;box-shadow:0 0 30px rgba(242,184,75,.4);';
                  ringEl.innerHTML = '<div style="font-size:36px">📱</div><div style="color:#f2b84b;font-size:18px;font-weight:700">Incoming Call!</div><div style="color:#ccc;font-size:14px">Mom is calling...</div><div style="display:flex;gap:12px;margin-top:8px"><button id="phone-answer" style="background:#34d399;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:16px;cursor:pointer;font-weight:700">Answer</button><button id="phone-ignore" style="background:#ef4444;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:16px;cursor:pointer;font-weight:700">Ignore</button></div>';
                  document.body.appendChild(ringEl);
                } else { ringEl.style.display = 'flex'; ringEl.style.animation = 'ring-pulse 1s ease-in-out infinite'; }
                document.getElementById('phone-answer')?.addEventListener('click', () => {
                  ringEl.style.display = 'none'; ringEl.style.animation = 'none';
                  this._phoneRinging = false; this._phoneDismissed = true;
                  if (typeof sfx !== 'undefined' && sfx.play) sfx.play('error');
                  if (window.ui && window.ui.issueChallan) {
                    window.ui.issueChallan('Distracted Driving - Phone', 'Sec 184 MV Act', '₹1,000', 'Mobile Use');
                    this.score -= 25; this.fine += 1000; this.vio++; this.violationsLog.push('MOBILE_USE');
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
              const fwd = this.pools.vec3.get().set(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
              let oncoming = false;
              for (const nv of this.npcs) {
                if (!nv || !nv.position) continue;
                const toNpc = this.pools.vec3.get().subVectors(nv.position, pp);
                const dot = toNpc.dot(fwd);
                this.pools.vec3.release(toNpc);
                if (dot > 0 && dot < 20) {
                  const npcSpeed = nv.userData?.speed || 0;
                  if (npcSpeed < -0.05) { oncoming = true; break; }
                }
              }
              this.pools.vec3.release(fwd);
              if (oncoming) {
                toast('⚠️ Oncoming traffic detected! Check before overtaking.', '#ef4444');
                if (typeof sfx !== 'undefined' && sfx.play) sfx.play('error');
              }
            }
            if (this.turnSignal === 0 && this._overtakeCheckDone) this._overtakeCheckDone = false;
          }
        }

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
                  window.ui.issueChallan('Fleeing Police Checkpoint', 'Sec 186 MV Act', '₹2,000', 'Checkpoint Evasion');
                  this.score -= 50; this.fine += 2000; this.vio++; this.violationsLog.push('CHECKPOINT_EVASION');
                }
                toast('🚨 You fled the checkpoint! ₹2,000 fine!', '#ef4444');
              }
            }
          });
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
            this.vio++; this.violationsLog.push('RED_LIGHT_VIOLATION'); this.fine += 500;
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
      // Continuous building LOD, relative to the player's current position — replaces the
      // old one-time check that measured distance from world origin at level start (wrong
      // for any level where the player doesn't spawn near 0,0, and never re-evaluated as the
      // player actually drove around). Non-destructive (toggles .visible, doesn't
      // scene.remove()) so buildings correctly reappear if the player drives back toward
      // them, and only re-scans a slice of the scene every few frames rather than the whole
      // thing every frame.
      _updateDynamicLOD(lodMult = 1) {
        if (!this._isMobile || !this.player) return;
        this._lodFrame = (this._lodFrame || 0) + 1;
        if (this._lodFrame % 20 !== 0) return; // ~3x/sec at 60fps, not every frame
        const px = this.player.position.x, pz = this.player.position.z;
        if (!this._lodChildren) this._lodChildren = this.scene.children.filter(c => c.isMesh || c.isInstancedMesh);
        // Rebuild the candidate list occasionally too, in case new objects were added since
        // (e.g. NPCs, obstacles) — cheap relative to the distance pass itself.
        if (this._lodFrame % 300 === 0) this._lodChildren = this.scene.children.filter(c => c.isMesh || c.isInstancedMesh);
        const visDist = 400 * lodMult;
        const fogDist = 200 * lodMult;
        this._lodChildren.forEach(child => {
          if (!child.position || child.userData.noLod) return;
          const dx = child.position.x - px, dz = child.position.z - pz;
          const d = Math.sqrt(dx * dx + dz * dz);
          const shouldShow = d < visDist;
          if (child.visible !== shouldShow) child.visible = shouldShow;
          if (child.material && 'fog' in child.material) child.material.fog = d < fogDist;
        });
      }

      _initBreadcrumbPath() {
        if (!this.driveRoute || this.driveRoute.length < 2) return;
        const points = this.driveRoute.map(p => new THREE.Vector3(p.x, 0.1, p.z));
        this._breadcrumbCurve = new THREE.CatmullRomCurve3(points);
        const resolution = 1000;
        const curvePoints = this._breadcrumbCurve.getPoints(resolution);
        const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this._breadcrumbPath = new THREE.Line(geometry, material);
        this._breadcrumbPath.visible = false;
        this.scene.add(this._breadcrumbPath);
      }

      _updateBreadcrumbPath(dt) {
        if (!this._breadcrumbPath) return;
        if (!this.kidModeActive || this.isPedestrian) {
          this._breadcrumbPath.visible = false;
          return;
        }
        const nextCP = this.cps.find(c => !c.userData.hit);
        if (!nextCP) {
          this._breadcrumbPath.visible = false;
          return;
        }
        this._breadcrumbPath.visible = true;
        const playerPos = this.player.position;
        const cpPos = nextCP.position;
        let startT = 0, minDist = Infinity;
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const p = this._breadcrumbCurve.getPointAt(t);
          const d = p.distanceTo(playerPos);
          if (d < minDist) { minDist = d; startT = t; }
        }
        let endT = 1.0;
        minDist = Infinity;
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const p = this._breadcrumbCurve.getPointAt(t);
          const d = p.distanceTo(cpPos);
          if (d < minDist) { minDist = d; endT = t; }
        }
        const resolution = 1000;
        const startIndex = Math.floor(startT * resolution);
        const endIndex = Math.floor(endT * resolution);
        const count = Math.max(0, endIndex - startIndex);
        this._breadcrumbPath.geometry.setDrawRange(startIndex, count);
      }

      _unpcs(dt) {
        if (!this.player || !this.player.position) return;
        // Delegate to TrafficManager and NPCAI for Mumbai-style traffic simulation
        if (this.trafficManager && this.npcAI) {
          this.trafficManager.update(dt, this);
          this.npcAI.update(dt, this);
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
              const turnSpeed = Math.max(0.1, n.userData.spd * 0.5);
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
                  n.position.z += (n.userData.txZ - n.position.z) * 0.15;
                  
                  let yawT = (n.userData.dir === 1) ? Math.PI / 2 : -Math.PI / 2;
                  yawT -= (n.userData.txZ - n.position.z) * 0.1 * n.userData.dir;
                  let diff = yawT - n.rotation.y;
                  while (diff < -Math.PI) diff += Math.PI * 2;
                  while (diff > Math.PI) diff -= Math.PI * 2;
                  n.rotation.y += diff * 0.2;
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
                      n.userData.txX += push;
                    }
                  }
                });
                n.userData.txX = Math.max(-6, Math.min(6, n.userData.txX));
                n.position.x += (n.userData.txX - n.position.x) * 0.15;
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
          // Handle both vehicle mode and pedestrian mode (instant fail when hit as pedestrian)
          if (this.player.position.distanceTo(n.position) < 2.2) {
            if (this.isPedestrian) {
              // Pedestrian hit by vehicle - instant failure
              this.hp = 0;
              this._go('Hit by ' + (n.userData.npcType || 'Vehicle'));
              toast('🚨 HIT BY VEHICLE!', '#ff3b30');
            } else {
              // Vehicle collision
              this.hp -= this.seatbeltOn ? 9.6 : 12;
              if (this.hp <= 0) this._go('Collided with ' + (n.userData.npcType || 'Vehicle'));
              else this._uh();
              this.speed *= -.22;
              this._camShakeAmt = Math.max(this._camShakeAmt, 0.40);
              if(window.sfx) window.sfx.play('error');
              toast('💥 Collision!', '#ff3b30');

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
        const maxPeds = isFestCrowd ? (this._isMobile ? 30 : 120) : ((this.mapCfg && this.mapCfg.isPedestrian) ? 30 : 16);
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
          }
        }

        // ═══════════════════════════════════════════════════════════════
        // COMPREHENSIVE PEDESTRIAN AI SYSTEM
        // State Machine: IDLE → WALKING → WAITING → CROSSING → FLEEING → ENTERING
        // ═══════════════════════════════════════════════════════════════

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
          // Initialize pedestrian AI state if needed
          p.userData.aiState = p.userData.aiState || 'walking'; // walking, idle, waiting, crossing, fleeing, exiting, entering
          p.userData.t += dt * p.userData.spd;

          const isPoliceVolunteer = p.userData.isPoliceVolunteer;
          const ud = p.userData;

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

          // STATE: WALKING (default)
          ud.aiState = 'walking';
          const walkSpeed = ud.spd * 3.5;
          const moveAmt = walkSpeed * dt;

          if (ud.isV) {
            p.position.z += ud.dir * moveAmt;
            ud.distTraveled += moveAmt;
          } else {
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

          // ── PLAYER COLLISION CHECK (INSTANT FAILURE) ──
          if (!this.isPedestrian && this.player.position.distanceTo(p.position) < 2.2) {
            this.speed = 0;
            this.hp = 0;
            toast(' HIT PEDESTRIAN! INSTANT FAILURE!', '#ff3b30');
            this._uh();
            this._go("Structural Failure");
          }
        });
      }
      _uobs(dt) {
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
              ui.issueChallan('Honking at an animal on the road', 'Civic Sense', '₹1,000', 'Animals have the right of way — never honk at them');
            }
          }
        }

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

      _checkBrakeZones(dt) {
        if (!this.kidModeActive || this.isPedestrian) return;
        if (this.speed <= 0) return;

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
          if (this.player.position.distanceTo(cp.position) < 4.5) { cp.userData.hit = true; cp.visible = false; this.score += 100; hits++; toast('✅ Node Verified!', '#00c851'); sfx.play('ok'); }
        });
        this.hits = hits;
        if (this.dom['hcp']) this.dom['hcp'].textContent = hits + '/' + this.cps.length;

        // Realtime GPS Arrow Target Tracking
        const nextNode = this.cps.find(c => !c.userData.hit); const da = this.dom['da'];
        if (nextNode && this.playing) {
          if (da) { da.style.display = 'flex'; da.classList.add('on'); }
          const dx = nextNode.position.x - this.player.position.x, dz = nextNode.position.z - this.player.position.z;
          const dist = Math.round(Math.hypot(dx, dz));
          // FIX: use atan2(dx,dz) not atan2(dx,-dz) for correct forward direction
          let rel = Math.atan2(dx, dz) - this.player.rotation.y;
          while (rel < -Math.PI) rel += Math.PI * 2; while (rel > Math.PI) rel -= Math.PI * 2;
          const deg = rel * 180 / Math.PI;
          // Rotate the arrow using CSS transform (negative for correct direction)
          const arrowEl = this.dom['da-arrow'];
          if (arrowEl) arrowEl.style.transform = 'rotate(' + Math.round(-deg) + 'deg)';
          // Update direction text
          const dirText = Math.abs(deg) < 20 ? 'GO STRAIGHT' : deg > 0 ? 'TURN RIGHT' : 'TURN LEFT';
          if (this.dom['dal']) this.dom['dal'].textContent = dirText;
          // Update distance in the new da-dist element
          if (this.dom['da-dist']) this.dom['da-dist'].textContent = dist + 'm';
        } else if (da) { da.style.display = 'none'; da.classList.remove('on'); }

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
      // ── GTA-style enter/exit state machine ──
      _tickEnterExit(dt) {
        const s = this._enterState;
        if (s === 'IDLE') return;
        this._enterTimer += dt;
        const t = this._enterTimer;
        const char = this.playerCharacter;
        const veh = this.playerVehicle;
        if (!char || !veh) { this._enterState = 'IDLE'; return; }
        const doorPivot = this._enterDoorSide === 'L' ? veh.userData.doorPivotL : veh.userData.doorPivotR;

        if (this._enterDir === 1) {
          // ══════ ENTERING VEHICLE ══════
          if (s === 'WALKING_TO_DOOR') {
            const dur = 1.2;
            const p = Math.min(t / dur, 1);
            char.position.lerpVectors(this._enterWalkStart, this._enterWalkEnd, p);
            char.position.y = 0;
            const angle = Math.atan2(veh.position.x - char.position.x, veh.position.z - char.position.z);
            char.rotation.y = angle;
            this._animateCharacterWalk(char, 1.0, dt);
            if (t - this._lastStepTime > 0.3) { this._lastStepTime = t; sfx.play('step'); }
            const camPos = this.pools.vec3.get().set(
              char.position.x - Math.sin(angle) * 3, 2.5,
              char.position.z - Math.cos(angle) * 3
            );
            this.camera.position.lerp(camPos, dt * 4);
            this.pools.vec3.release(camPos);
            this.camera.lookAt(char.position.x, 1.0, char.position.z);
            if (p >= 1) { this._enterState = 'OPENING_DOOR'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'OPENING_DOOR') {
            const dur = 0.5;
            const p = Math.min(t / dur, 1);
            if (doorPivot) doorPivot.rotation.y = p * (Math.PI * 0.45);
            this._animateCharacterWalk(char, 0, dt);
            if (p >= 1) { this._enterState = 'SITTING_DOWN'; this._enterTimer = 0; }
          } else if (s === 'SITTING_DOWN') {
            const dur = 0.8;
            const p = Math.min(t / dur, 1);
            const ease = p * p * (3 - 2 * p);
            const seatPos = this.pools.vec3.get().set(0, 0.6, 0.2);
            char.position.lerpVectors(this._enterWalkEnd, seatPos, ease);
            this.pools.vec3.release(seatPos);
            char.scale.setScalar(1 - ease * 0.45);
            const cp = ease;
            this.camera.position.set(
              veh.position.x * (1 - cp) + this.camera.position.x * cp,
              2.5 * (1 - cp) + 1.3 * cp,
              veh.position.z * (1 - cp) + this.camera.position.z * cp
            );
            this.camera.lookAt(veh.position.x, 1.0, veh.position.z);
            if (p >= 1) { this._enterState = 'CLOSING_DOOR'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'CLOSING_DOOR') {
            const dur = 0.4;
            const p = Math.min(t / dur, 1);
            if (doorPivot) doorPivot.rotation.y = (1 - p) * (Math.PI * 0.45);
            if (p >= 1) {
              this.isPedestrian = false;
              char.position.set(0, 0.6, 0.2);
              char.scale.set(0.55, 0.55, 0.55);
              veh.add(char);
              this.player = veh;
              this._camSnapped = false;
              this._camOverride = false;
              this._enterState = 'IDLE';
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
            }
          }
        } else {
          // ══════ EXITING VEHICLE ══════
          if (s === 'OPENING_DOOR') {
            const dur = 0.5;
            const p = Math.min(t / dur, 1);
            if (doorPivot) doorPivot.rotation.y = p * (Math.PI * 0.45);
            if (p >= 1) { this._enterState = 'WALKING_OUT'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'WALKING_OUT') {
            const dur = 0.6;
            const p = Math.min(t / dur, 1);
            const ease = p * p * (3 - 2 * p);
            const standPos = this._enterWalkEnd.clone();
            standPos.y = 0;
            const seatPosC = this.pools.vec3.get().set(0, 0.6, 0.2);
            char.position.lerpVectors(seatPosC, standPos, ease);
            this.pools.vec3.release(seatPosC);
            char.position.y = ease * 0;
            char.scale.setScalar(0.55 + ease * 0.45);
            if (ease > 0.5 && t - this._lastStepTime > 0.3) { this._lastStepTime = t; sfx.play('step'); }
            this.camera.position.set(
              veh.position.x + (standPos.x - veh.position.x) * ease * 0.5,
              1.3 + ease * 1.2,
              veh.position.z + (standPos.z - veh.position.z) * ease * 0.5
            );
            this.camera.lookAt(char.position.x, 1.0, char.position.z);
            if (p >= 1) { this._enterState = 'CLOSING_DOOR'; this._enterTimer = 0; sfx.play('door'); }
          } else if (s === 'CLOSING_DOOR') {
            const dur = 0.4;
            const p = Math.min(t / dur, 1);
            if (doorPivot) doorPivot.rotation.y = (1 - p) * (Math.PI * 0.45);
            this._animateCharacterWalk(char, 0, dt);
            if (p >= 1) {
              this.isPedestrian = true;
              veh.remove(char);
              char.scale.set(1, 1, 1);
              char.position.copy(this._enterWalkEnd);
              char.position.y = 0;
              this.scene.add(char);
              this.player = char;
              this._camSnapped = false;
              this._camOverride = false;
              this._enterState = 'IDLE';
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
        // FBX animated characters: blend idle ↔ run weights
        if (ud.isFBXAnimated && ud.mixer) {
          const walkW = Math.min(Math.abs(speed) * 3, 1)
          if (ud.idleAction) ud.idleAction.setEffectiveWeight(1 - walkW)
          if (ud.runAction) ud.runAction.setEffectiveWeight(walkW)
          ud.mixer.update(dt)
          return
        }
        // GLB / procedural characters: swing legs + body bob
        const t = (ud.t || 0) + dt * 8
        ud.t = t
        const swing = Math.sin(t) * 0.4 * Math.min(Math.abs(speed) * 4, 1)
        if (ud.lLeg) ud.lLeg.rotation.x = swing
        if (ud.rLeg) ud.rLeg.rotation.x = -swing
        // Subtle body bob
        if (character.children[0]) {
          character.children[0].position.y = Math.abs(Math.sin(t)) * 0.04 * Math.min(Math.abs(speed) * 4, 1)
        }
      }
      _ucam(dt) {
        if (!this.player || !this.player.position) return;
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

          const tiltRoll = this._camTilt || 0;
          this.camera.up.set(0, 1, 0);
          const lookAheadDist = this.isPedestrian ? 3 : 7;
          this.camera.lookAt(
            this.player.position.x + Math.sin(rotY) * lookAheadDist + shakeX,
            1.5 - pitchOffset * 0.3 + shakeY,
            this.player.position.z + Math.cos(rotY) * lookAheadDist
          );
          // Camera tilt: subtle roll based on steering input
          if (tiltRoll !== 0) {
            const _rollQ = new THREE.Quaternion();
            _rollQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltRoll * 0.5);
            this.camera.quaternion.multiply(_rollQ);
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
        if (!this.dayNightCycle || !this.mapCfg) return;
        const CYCLE = 300;
        this.timeOfDay = (this.timeOfDay + dt / CYCLE) % 1;
        const t = this.timeOfDay;
        const cfg = this.mapCfg;

        // Sun elevation: sinusoidal arc, 0 at night, 1 at peak noon
        const sunAngle = t * Math.PI * 2 - Math.PI / 2;
        const sunElev = Math.max(0, Math.sin(sunAngle));

        // Dawn/dusk accent factors (peaks at 0.25 and 0.75)
        const dawnF = Math.max(0, 1 - Math.abs(t - 0.25) * 8);
        const duskF = Math.max(0, 1 - Math.abs(t - 0.75) * 8);

        // ── Sky color ──
        this._dnDaySky.setHex(cfg.sky || 0x87b6d8);
        this._dnSkyA.copy(this._dnSkyB).setHex(0x0a0a12).lerp(this._dnDaySky, sunElev);
        this._dnSkyB.copy(this._dnDawnSky).multiplyScalar(dawnF).add(this._dnTmp.copy(this._dnDuskSky).multiplyScalar(duskF));
        this.scene.background.copy(this._dnSkyA).add(this._dnSkyB);

        // ── Fog color ──
        this._dnFogA.copy(this._dnFogB).setHex(0x0a0a12).lerp(this._dnDaySky, sunElev);
        this._dnFogB.copy(this._dnDawnFog).multiplyScalar(dawnF).add(this._dnTmp.copy(this._dnDuskFog).multiplyScalar(duskF));
        if (this.scene.fog) this.scene.fog.color.copy(this._dnFogA).add(this._dnFogB);

        // ── Ambient light ──
        if (this._ambient) this._ambient.intensity = this._dnLerp(0.08, cfg.amb || 0.35, sunElev);

        // ── Hemisphere light ──
        if (this._hemi) this._hemi.intensity = this._dnLerp(0.08, 0.45, sunElev);

        // ── Sun intensity ──
        if (this._sun) this._sun.intensity = this._dnLerp(0.05, 1.2, sunElev);

        // ── Moon (opposite to sun) ──
        if (this._moon && this.player) {
          this._moon.intensity = this._dnLerp(0.4, 0, sunElev);
          const moonAngle = sunAngle + Math.PI;
          const mx = Math.cos(moonAngle) * 50;
          const my = Math.abs(Math.sin(moonAngle)) * 40 + 5;
          this._moon.position.set(this.player.position.x + mx, my, this.player.position.z - 30);
        }

        // ── Tone mapping exposure ──
        if (this.renderCore.renderer) this.renderCore.renderer.toneMappingExposure = this._dnLerp(0.6, 1.2, sunElev);

        // ── Street lights ──
        const slIntensity = sunElev < 0.3 ? this._dnLerp(0.8, 0, sunElev / 0.3) : 0;
        for (let i = 0; i < this._streetLights.length; i++) this._streetLights[i].intensity = slIntensity;

        // ── Building window glow ──
        const wlOn = sunElev < 0.4;
        const wlIntensity = wlOn ? this._dnLerp(0.6, 0, sunElev / 0.4) : 0;
        for (let i = 0; i < this._windowLights.length; i++) this._windowLights[i].intensity = wlIntensity;

        // ── Player headlights ──
        if (this.hL && this.hR) {
          const hlI = this._dnLerp(2.5, 0, sunElev);
          this.hL.intensity = hlI; this.hR.intensity = hlI;
        }
        if (this._headlightCones) {
          const coneA = this._dnLerp(0.08, 0, sunElev);
          for (let i = 0; i < this._headlightCones.length; i++) this._headlightCones[i].material.opacity = coneA;
        }

        // ── NPC headlights/taillights: toggle on day/night transition ──
        const nightOn = sunElev < 0.2;
        if (nightOn !== this._lastNpcLightState && this.npcs) {
          this._lastNpcLightState = nightOn;
          for (let ni = 0; ni < this.npcs.length; ni++) {
            const nv = this.npcs[ni];
            for (let ci = 0; ci < nv.children.length; ci++) {
              const c = nv.children[ci];
              if (c.isSpotLight) c.intensity = nightOn ? 1.2 : 0;
              if (c.isMesh && c.material && c.material.color && c.material.color.r > 0.8 && c.material.color.g < 0.2) {
                c.visible = nightOn;
              }
            }
          }
        }

        // ── Sync isNight for other systems (rain, NPC headlights) ──
        cfg.isNight = nightOn;
      }
      _dnLerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }
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
            this.warnEl.style.color = '#ff3b30';
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
                this.warnEl.textContent = '🚗 PRESS [F] TO ENTER CAR';
                this.warnEl.style.display = 'block';
                this.warnEl.style.color = '#f1c40f';
                if (!this.warnEl.classList.contains('flash')) { this.warnEl.classList.add('flash'); }
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
      }
      _ummap() {
        if (!this.player || !this.player.position) return;
        const mc = this.dom['mmc']; if (!mc || !this.playing) return; mc.classList.add('on');

        // Compass strip — heading plus distance/direction to the next checkpoint. The corner
        // minimap already has a small heading line, but this is the dedicated top-of-screen
        // indicator that was asked for early on and never built.
        const compassEl = document.getElementById('compass-strip');
        if (compassEl) {
          compassEl.style.display = 'flex';
          const headingSrc = this.isPedestrian ? this.player.rotation.y : (this.playerVehicle ? this.playerVehicle.rotation.y : this.player.rotation.y);
          let deg = (headingSrc * 180 / Math.PI) % 360;
          if (deg < 0) deg += 360;
          const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          const heading = dirs[Math.round(deg / 45) % 8];
          const hEl = document.getElementById('compass-heading');
          if (hEl) hEl.textContent = heading;
          const arrowEl = document.getElementById('compass-arrow');
          const distEl = document.getElementById('compass-dist');
          if (this.cps && this.cps.length > 0 && this.cps[0]) {
            const cp = this.cps[0];
            const ddx = cp.position.x - this.player.position.x, ddz = cp.position.z - this.player.position.z;
            const dist = Math.sqrt(ddx * ddx + ddz * ddz);
            const targetAngle = Math.atan2(ddx, ddz);
            const relAngle = targetAngle - headingSrc;
            if (arrowEl) arrowEl.style.transform = `rotate(${relAngle}rad)`;
            if (distEl) distEl.textContent = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
          } else if (distEl) {
            distEl.textContent = '';
          }
        }

        // Landmark discovery — a one-time "you've arrived somewhere real" moment for the
        // monuments that already exist in the scene but were purely decorative background
        // dressing until now.
        if (this._landmarks && this._landmarks.length) {
          this._landmarks.forEach((lm) => {
            if (lm.discovered) return;
            const ldx = lm.x - this.player.position.x, ldz = lm.z - this.player.position.z;
            if (ldx * ldx + ldz * ldz < 2500) { // within 50 units
              lm.discovered = true;
              toast(`🏛️ You've reached ${lm.name}`, '#d97706');
            }
          });
        }

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

        // GPS Route line to checkpoint (when phone GPS is on)
        if (this.phoneGpsOn && this.cps && this.cps.length > 0) {
            const nextCP = this.cps[0];
            if (nextCP) {
                ctx.strokeStyle = '#5dade2';
                ctx.lineWidth = 4;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.moveTo(this.player.position.x, this.player.position.z);
                ctx.lineTo(nextCP.position.x, nextCP.position.z);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Checkpoints
        this.cps.forEach((cp, i) => {
            ctx.fillStyle = i === 0 ? '#00c851' : 'rgba(0,200,81,0.4)';
            ctx.beginPath(); ctx.arc(cp.position.x, cp.position.z, 4, 0, Math.PI * 2); ctx.fill();
        });

        // Track dynamic real-time colors for oncoming signals
        this.sigs.forEach(s => {
          ctx.fillStyle = s.userData.st === 'red' ? '#ff3b30' : s.userData.st === 'green' ? '#00c851' : '#ffd54a';
          ctx.beginPath(); ctx.arc(s.position.x, s.position.z, 5, 0, Math.PI * 2); ctx.fill();
        });

        // Draw NPC Traffic Tracking Dots
        ctx.fillStyle = '#3498db';
        this.npcs.forEach(n => {
          ctx.fillRect(n.position.x - 2.5, n.position.z - 2.5, 5, 5);
        });

        // Draw Pedestrians
        if (this.peds) {
            ctx.fillStyle = '#e91e63';
            this.peds.forEach(p => {
                ctx.fillRect(p.position.x - 1.5, p.position.z - 1.5, 3, 3);
            });
        }

        // Landmark markers — small gold diamond, distinct from NPCs/checkpoints
        if (this._landmarks && this._landmarks.length) {
          ctx.fillStyle = '#d97706';
          this._landmarks.forEach((lm) => {
            ctx.save();
            ctx.translate(lm.x, lm.z);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
          });
        }

        // Draw Player
        ctx.fillStyle = '#ffd54a';
        ctx.beginPath(); ctx.arc(this.player.position.x, this.player.position.z, 5, 0, Math.PI * 2); ctx.fill();
        // Player direction indicator
        if (!this.isPedestrian && this.playerVehicle) {
            const angle = this.playerVehicle.rotation.y;
            ctx.strokeStyle = '#ffd54a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.player.position.x, this.player.position.z);
            ctx.lineTo(this.player.position.x + Math.sin(angle) * 12, this.player.position.z + Math.cos(angle) * 12);
            ctx.stroke();
        }
        ctx.restore();

        // Minimap Borders
        ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2); ctx.stroke();

        // GPS label
        if (this.phoneGpsOn) {
            ctx.fillStyle = '#5dade2';
            ctx.font = 'bold 9px Inter';
            ctx.fillText('GPS', 4, 106);
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
