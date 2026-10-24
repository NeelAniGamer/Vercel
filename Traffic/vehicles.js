
window.IndianVehicles = {
  textures: {},
  // Shared, cached materials. Previously every vehicle allocated its own
  // MeshPhongMaterial/ToonMaterial per part; with ~110 NPCs that is thousands
  // of draw-state changes per frame. These are created once and reused; only
  // the paint colour is per-vehicle (via `paintMat`).
  mats: {},
  _VD: (typeof window !== 'undefined' && window.VehicleDims) ? window.VehicleDims : null,

  /** Canonical dimensions for a type, with a safe fallback if vehicle-dims.js failed to load. */
  dims: function (type) {
    if (this._VD && this._VD.resolve) return this._VD.resolve(type);
    var FB = {
      bike:    { W: 0.72, L: 2.05, H: 1.12, wb: 1.38, tr: 0.62, wr: 0.31, ww: 0.09 },
      bicycle: { W: 0.58, L: 1.78, H: 1.06, wb: 1.05, tr: 0.50, wr: 0.34, ww: 0.04 },
      auto:    { W: 1.40, L: 2.70, H: 1.78, wb: 1.60, tr: 1.18, wr: 0.26, ww: 0.12 },
      car:     { W: 1.75, L: 4.15, H: 1.48, wb: 2.45, tr: 1.45, wr: 0.31, ww: 0.20 },
      taxi:    { W: 1.70, L: 3.90, H: 1.45, wb: 2.25, tr: 1.42, wr: 0.30, ww: 0.19 },
      suv:     { W: 1.80, L: 4.55, H: 1.72, wb: 2.75, tr: 1.52, wr: 0.34, ww: 0.23 },
      supercar:{ W: 1.94, L: 4.55, H: 1.22, wb: 2.65, tr: 1.66, wr: 0.34, ww: 0.28 },
      sports:  { W: 1.90, L: 4.45, H: 1.28, wb: 2.60, tr: 1.62, wr: 0.33, ww: 0.26 },
      bus:     { W: 2.55, L: 11.0, H: 3.20, wb: 5.60, tr: 2.10, wr: 0.50, ww: 0.28 },
      truck:   { W: 2.50, L: 8.50, H: 3.30, wb: 4.60, tr: 2.04, wr: 0.50, ww: 0.26 }
    };
    var t = String(type || 'car').toLowerCase();
    if (/cycle|bicycle/.test(t)) return FB.bicycle;
    if (/splendor|activa|scooter|bike|twowheeler|ktm/.test(t)) return FB.bike;
    if (/auto|rickshaw|bajaj/.test(t)) return FB.auto;
    if (/taxi|padmini/.test(t)) return FB.taxi;
    if (/innova|creta|suv|mpv|fortuner|7seater/.test(t)) return FB.suv;
    if (/sports|cyan/.test(t)) return FB.sports;
    if (/supercar|lambo|cyberpunk/.test(t)) return FB.supercar;
    if (/bus|msrtc/.test(t)) return FB.bus;
    if (/truck|eicher|lorry/.test(t)) return FB.truck;
    return FB.car;
  },

  /** Lazily-built shared material cache. */
  mat: function (name, make) {
    if (!this.mats[name]) this.mats[name] = make();
    return this.mats[name];
  },
  chromeMat: function () {
    var self = this;
    return this.mat('chrome', function () {
      return new THREE.MeshPhongMaterial({ color: 0xdcdde1, specular: 0xffffff, shininess: 90 });
    });
  },
  darkChromeMat: function () {
    return this.mat('chromeDark', function () {
      return new THREE.MeshPhongMaterial({ color: 0x6b7280, specular: 0xcccccc, shininess: 60 });
    });
  },
  rubberMat: function () {
    return this.mat('rubber', function () {
      return new THREE.MeshPhongMaterial({ color: 0x14161a, specular: 0x222222, shininess: 12 });
    });
  },
  rimMat: function () {
    return this.mat('rim', function () {
      return new THREE.MeshPhongMaterial({ color: 0xb8bec7, specular: 0xffffff, shininess: 110 });
    });
  },
  interiorMat: function () {
    return this.mat('interior', function () {
      return new THREE.MeshPhongMaterial({ color: 0x1a1f2b, specular: 0x000000, shininess: 4 });
    });
  },
  seatMat: function () {
    return this.mat('seat', function () {
      return new THREE.MeshPhongMaterial({ color: 0x2b3345, specular: 0x000000, shininess: 6 });
    });
  },
  /** Per-vehicle paint — the only material that is not shared. */
  paintMat: function (hex) {
    return new THREE.MeshPhongMaterial({ color: hex, specular: 0x666666, shininess: 70 });
  },
  glassMat: function () {
    var self = this;
    if (!this.textures.glass) this.init();
    return this.mat('glass', function () {
      return new THREE.MeshPhongMaterial({
        color: 0x1e293b, map: self.textures.glass,
        transparent: true, opacity: 0.55, shininess: 120, specular: 0xffffff
      });
    });
  },

  init: function () {

    this.textures.grille = this.createCanvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, 64, 64)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 4
      for (let i = 0; i < 64; i += 8) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(64, i)
        ctx.stroke()
      }
    })


    this.textures.headlight = this.createCanvasTex(32, 32, (ctx) => {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.5, '#ffffcc')
      grad.addColorStop(1, '#aaaaaa')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    })


    this.textures.taillight = this.createCanvasTex(32, 32, (ctx) => {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, '#ff3333')
      grad.addColorStop(0.7, '#cc0000')
      grad.addColorStop(1, '#660000')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    })


    this.textures.indicator = this.createCanvasTex(16, 16, (ctx) => {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
      grad.addColorStop(0, '#ffaa00')
      grad.addColorStop(1, '#cc7700')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 16, 16)
    })


    this.textures.glass = this.createCanvasTex(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 64, 64)
      grad.addColorStop(0, '#1a2a3a')
      grad.addColorStop(0.4, '#2a3a4a')
      grad.addColorStop(0.6, '#1a2a3a')
      grad.addColorStop(1, '#0a1a2a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 64, 64)
      ctx.strokeStyle = '#4a5a6a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 64)
      ctx.lineTo(64, 0)
      ctx.stroke()
    })


    this.textures.wheel = this.createCanvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(32, 32, 32, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#444'
      ctx.beginPath()
      ctx.arc(32, 32, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#666'
      ctx.beginPath()
      ctx.arc(32, 32, 18, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#888'
      ctx.lineWidth = 3
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(32, 32)
        ctx.lineTo(32 + Math.cos(angle) * 16, 32 + Math.sin(angle) * 16)
        ctx.stroke()
      }
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(32, 32, 8, 0, Math.PI * 2)
      ctx.fill()
    })


    this.textures.plate = this.createCanvasTex(64, 32, (ctx) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 64, 32)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, 62, 30)
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('MH 01', 32, 10)
      ctx.font = 'bold 10px Arial'
      ctx.fillText('AB 1234', 32, 22)
    })


    this.textures.wiper = this.createCanvasTex(32, 8, (ctx) => {
      ctx.fillStyle = '#222'
      ctx.fillRect(0, 0, 32, 8)
      ctx.fillStyle = '#444'
      ctx.fillRect(0, 2, 32, 4)
    })
  },

  createCanvasTex: function (w, h, drawFn) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    drawFn(ctx)
    const tex = new THREE.CanvasTexture(c)
    return tex
  },

  /**
   * A wheel with a dished rim, five spokes and a brake disc, so it does not
   * read as a flat black cylinder at close camera range.
   * `rOverride` lets the caller use the canonical tyre radius for its class.
   */
  _wheelGeoCache: {},
  buildWheel: function (scale = 1.0, rOverride) {
    if (!this.textures.wheel) { this.init(); }
    const d = this.dims(this._currentType);
    const r = +(rOverride || (d.wr || 0.35) * scale).toFixed(3);
    const w = +((d.ww || 0.20) * scale).toFixed(3);
    const key = r + '_' + w;

    if (!this._wheelGeoCache) { this._wheelGeoCache = {}; }
    if (!this._wheelGeoCache[key]) {
      const geo = new THREE.CylinderGeometry(r, r, w, 12);
      geo.rotateZ(Math.PI / 2); // Bake rotation into geometry once
      this._wheelGeoCache[key] = geo;
    }
    const self = this;
    const wheelCapsMat = this.mat('wheelCapTex', function () {
      return new THREE.MeshPhongMaterial({
        map: self.textures.wheel, shininess: 50
      });
    });
    const wheelMats = this.mat('wheelMatArr', function () {
      return [self.rubberMat(), wheelCapsMat, wheelCapsMat];
    });
    const mesh = new THREE.Mesh(this._wheelGeoCache[key], wheelMats);
    mesh.userData.isWheel = true;
    return mesh;
  },

  buildHeadlight: function (x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.05), this.headlightMat())
    m.position.set(x, y, z)
    return this._tagLight(m, 'head', null)
  },

  buildTaillight: function (x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.05), this.brakeMat())
    m.position.set(x, y, z)
    return this._tagLight(m, 'tail', null)
  },

  buildIndicator: function (x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.indicatorMat())
    m.position.set(x, y, z)
    return this._tagLight(m, 'ind', null)
  },

  addBumper: function (g, w, h, d, z) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshToonMaterial({ color: 0x222222 }))
    b.position.set(0, h / 2 + 0.2, z)
    g.add(b)
  },

  /**
   * Four road wheels, inset into the arches.
   *
   * Previously: `halfW = w / 2` put the wheel centre exactly ON the body edge,
   * so the tyre (0.20 m wide) protruded past the bodywork and the visible car
   * was wider than its own collider. And `halfL = l / 3` gave a wheelbase of
   * 66% of body length; the real figure is ~59% for a car, 51% for a bus.
   *
   * The canonical wheelbase/track RATIOS from vehicle-dims.js are applied to
   * whatever body box this branch happens to build. The ratios are
   * dimensionless so they survive the uniform rescale that `normalise()` does,
   * and the finished vehicle keeps canonical proportions whatever its source
   * dimensions were.
   */
  addFourWheels: function (g, w, l, s = 1.0, type) {
    const d = this.dims(type || this._currentType)
    const ARCH = 0.11 * s
    const trackRatio = d.W > 0 ? (d.tr / d.W) : 0.84
    const wbRatio = d.L > 0 ? (d.wb / d.L) : 0.59
    const halfTrack = Math.max(0.18 * s, (w * trackRatio) / 2 - ARCH)
    const halfWB = (l * wbRatio) / 2

    const self = this
    const r = (d.wr || 0.31) * s
    const corners = [
      { x: halfTrack, z: -halfWB, isFront: true, side: 'right' },
      { x: -halfTrack, z: -halfWB, isFront: true, side: 'left' },
      { x: halfTrack, z: halfWB, isFront: false, side: 'right' },
      { x: -halfTrack, z: halfWB, isFront: false, side: 'left' }
    ]
    g.userData = g.userData || {}
    g.userData.wheels = g.userData.wheels || []
    corners.forEach(function (c) {
      const wh = self.buildWheel(s, r)
      wh.position.set(c.x, r, c.z)
      wh.userData.isWheel = true
      wh.userData.isFront = c.isFront
      wh.userData.side = c.side
      wh.userData.wheelRadius = r
      g.add(wh)
      g.userData.wheels.push(wh)
    })
  },

  /** Number plate, sized to the Indian 520 x 110 mm aspect. */
  addPlate: function (g, y, z, front) {
    if (!this.textures.plate) this.init()
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.105),
      new THREE.MeshBasicMaterial({ map: this.textures.plate })
    )
    m.position.set(0, y, z)
    if (front) m.rotation.y = Math.PI
    g.add(m)
    return m
  },

  /** Door shut-lines: thin dark strips that break up a flat slab side. */
  addDoorSeams: function (g, w, y0, y1, zs) {
    const self = this
    const seam = this.mat('seam', function () {
      return new THREE.MeshBasicMaterial({ color: 0x0b0e14 })
    })
    const x = w / 2 + 0.004
    zs.forEach(function (z) {
      [-1, 1].forEach(function (sgn) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.008, y1 - y0, 0.022), seam)
        bar.position.set(sgn * x, (y0 + y1) / 2, z)
        g.add(bar)
      })
    })
  },

  /** Slatted grille between the headlights. */
  addGrille: function (g, w, y, z, h) {
    var self = this
    if (!this.textures.grille) this.init()
    const m = this.mat('grille', function () {
      return new THREE.MeshPhongMaterial({
        color: 0xffffff, map: self.textures.grille, specular: 0x333333, shininess: 40
      })
    })
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(w, h || 0.15), m)
    grille.position.set(0, y, z)
    if (z < 0) grille.rotation.y = Math.PI
    g.add(grille)
    return grille
  },

  /** Side sill / rocker panel between the wheel arches. */
  addSideSill: function (g, w, l, y, thick) {
    const mat = this.darkChromeMat();
    [-1, 1].forEach((sgn) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(thick || 0.06, 0.10, l * 0.44), mat)
      s.position.set(sgn * (w / 2 + 0.012), y, 0)
      g.add(s)
    })
  },

  /** Exhaust tip on the rear valance. */
  addExhaust: function (g, x, y, z, r) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(r || 0.035, r || 0.035, 0.14, 8), this.chromeMat()
    )
    pipe.rotation.x = Math.PI / 2
    pipe.position.set(x, y, z)
    g.add(pipe)
    return pipe
  },

  /** Cabin: dash, front seats, rear bench, steering wheel. Visible through glass. */
  addInterior: function (g, w, seatY, zFront, zRear, cabinLen) {
    const inside = this.interiorMat()
    const seat = this.seatMat()

    const dash = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.12, 0.28), inside)
    dash.position.set(0, seatY + 0.34, zFront)
    g.add(dash)

    const mk = function (x, z) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.10, 0.42), seat)
      base.position.set(x, seatY + 0.16, z)
      g.add(base)
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.10), seat)
      back.position.set(x, seatY + 0.40, z + 0.20)
      back.rotation.x = -0.14
      g.add(back)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.10), seat)
      head.position.set(x, seatY + 0.68, z + 0.24)
      g.add(head)
    }
    mk(-w * 0.22, zFront + 0.30)
    mk(w * 0.22, zFront + 0.30)

    if (cabinLen > 2.0 && zRear !== null && zRear !== undefined) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.34, 0.12), seat)
      bench.position.set(0, seatY + 0.34, zRear + 0.18)
      g.add(bench)
    }

    const sw = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 6, 12), inside)
    sw.position.set(-w * 0.22, seatY + 0.40, zFront + 0.10)
    sw.rotation.x = 0.42
    g.add(sw)
  },

  /**
   * Uniformly rescale a finished vehicle to its canonical length and set the
   * collider from the MEASURED result.
   *
   * Every branch converges here, so this fixes all of them at once instead of
   * each hardcoded body box having to be corrected by hand. It also re-grounds
   * the model, because rescaling about the origin lifts the tyres off the road.
   */
  normalise: function (g, type) {
    if (!g) return g
    const d = this.dims(type)
    g.updateMatrixWorld(true)
    let box = new THREE.Box3().setFromObject(g)
    const size = new THREE.Vector3()
    box.getSize(size)

    // ── Fit to the canonical envelope ────────────────────────────────────────
    // Each horizontal axis is fitted independently, because the procedural
    // branches do not all share the canonical W:L ratio: the bus branch is
    // 2.55 x 9.15 (0.279) where a real bus is 0.232, and the truck branch is
    // 0.357 where a rigid truck is 0.294. A purely uniform fit would have to
    // shrink them 17% in length to fix the width, leaving visibly stubby buses.
    //
    // The anisotropic correction is clamped so no axis deviates more than 22%
    // from the geometric mean, which keeps wheels from becoming obvious
    // ellipses while still correcting a badly wrong aspect.
    const longIsX = size.x > size.z
    const rawL = longIsX ? size.x : size.z
    const rawW = longIsX ? size.z : size.x
    const sL = d.L / Math.max(rawL, 0.05)
    const sW = d.W / Math.max(rawW, 0.05)

    const CLAMP = 1.6, FLOOR = 0.6;
    let fL = Math.min(CLAMP, Math.max(FLOOR, sL))
    let fW = Math.min(CLAMP, Math.max(FLOOR, sW))

    // Rebalance if one axis is being asked to move far more than the other.
    const ratio = fL / fW;
    if (ratio > 1.22 || ratio < 1 / 1.22) {
      const gm = Math.sqrt(fL * fW)
      fL = Math.min(CLAMP, Math.max(FLOOR, gm * (ratio > 1 ? 1.11 : 0.9)))
      fW = Math.min(CLAMP, Math.max(FLOOR, gm * (ratio > 1 ? 0.9 : 1.11)))
    }

    // Tighter threshold than the old 12%: a 6% oversize is already felt as a
    // graze that should not have registered.
    if (Math.abs(fL - 1) > 0.06 || Math.abs(fW - 1) > 0.06) {
      g.scale.set(longIsX ? fL : fW, 1, longIsX ? fW : fL)
      g.updateMatrixWorld(true)
      box = new THREE.Box3().setFromObject(g)
      box.getSize(size)
    }

    // Re-ground: tyres back on y = 0 after the rescale.
    g.position.y -= box.min.y

    // Collider from the measurement, clamped to the canonical envelope so a
    // mis-authored mesh cannot inject a nonsense hitbox into the traffic.
    if (this._VD && this._VD.colliderFromBox) {
      const c = this._VD.colliderFromBox(box, type)
      g.userData = g.userData || {}
      g.userData.halfW = c.halfW
      g.userData.halfD = c.halfD
      g.userData.measuredW = c.measured.W
      g.userData.measuredL = c.measured.L
    }

    // Register the brake/indicator lenses so updateLights() can drive them.
    this.registerLights(g);
    return g;
  },

  addRoofRails: function (g, w, l, y) {
    const railMat = new THREE.MeshToonMaterial({ color: 0x333333 })
    ;[-w / 2 + 0.15, w / 2 - 0.15].forEach(x => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, l * 0.6), railMat)
      r.position.set(x, y, 0)
      g.add(r)
    })
  },

  addMirror: function (g, x, y, z) {
    const mirMat = new THREE.MeshToonMaterial({ color: 0x222222 })
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), mirMat)
    m.position.set(x, y, z)
    g.add(m)
  },

  addWipers: function (g, y, z) {
    const wpMat = new THREE.MeshBasicMaterial({ map: this.textures.wiper, transparent: true })
    const wp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), wpMat)
    wp.position.set(0, y, z)
    wp.rotation.x = Math.PI / 4
    g.add(wp)
  },

  // ── Lighting & indicator system ───────────────────────────────────────────
  // Headlights use ONE shared material (always on, never animated) so they cost
  // nothing per frame. Brake lights and indicators need per-vehicle emissive
  // control, so each vehicle gets its own two materials -- still only ~2 extra
  // materials per NPC rather than one per part.
  //
  // The registry is walked on a throttle (default 20 Hz) and skips vehicles that
  // are far from the camera, which keeps the ~110-NPC budget intact.

  _lights: [],
  _lightTick: 0,
  LIGHT_HZ: 20,

  /** Shared always-on headlight lens. */
  headlightMat: function () {
    var self = this;
    return this.mat('headlight', function () {
      return new THREE.MeshStandardMaterial({
        color: 0xfff6d8, emissive: 0xffe9a8, emissiveIntensity: 0.85,
        roughness: 0.15, metalness: 0.0
      });
    });
  },

  /** Per-vehicle brake-light lens (emissive driven by braking state). */
  brakeMat: function () {
    // Per VEHICLE, not per lamp: both tail lights must share one material so a
    // single emissive write lights the whole pair.
    const vm = this._vehicleMats || (this._vehicleMats = {});
    if (!vm.brake) {
      vm.brake = new THREE.MeshStandardMaterial({
        color: 0x8b0d0d, emissive: 0xff2b2b, emissiveIntensity: 0.25,
        roughness: 0.3, metalness: 0.0
      });
    }
    return vm.brake;
  },

  /** Per-vehicle indicator lens (emissive driven by blink phase). */
  indicatorMat: function () {
    const vm = this._vehicleMats || (this._vehicleMats = {});
    if (!vm.ind) {
      vm.ind = new THREE.MeshStandardMaterial({
        color: 0x7a4a00, emissive: 0xffa500, emissiveIntensity: 0.15,
        roughness: 0.3, metalness: 0.0
      });
    }
    return vm.ind;
  },

  /**
   * Tag a light mesh and register its vehicle so `updateLights` can find it.
   * Called from buildHeadlight / buildTaillight / buildIndicator, which every
   * branch of buildVehicle already routes through.
   */
  _tagLight: function (mesh, kind, group) {
    mesh.userData = mesh.userData || {};
    mesh.userData.light = kind;
    if (kind === 'ind') mesh.userData.lightSide = (mesh.position.x < 0) ? 'L' : 'R';
    mesh.userData.lightMats = mesh.userData.lightMats || [];
    if (mesh.material) mesh.userData.lightMats.push(mesh.material);
    if (group) mesh.userData.lightOwner = group;
    return mesh;
  },

  /** Register a finished vehicle for light updates. Called by `normalise`. */
  registerLights: function (g) {
    if (!g) return g;
    let brake = null, ind = null;
    g.traverse(function (c) {
      if (!c.userData || !c.userData.light) return;
      if (c.userData.light === 'tail' && !brake) brake = c.material;
      if (c.userData.light === 'ind' && !ind) ind = c.material;
    });
    if (!brake && !ind) return g;
    if (this._lights.indexOf(g) === -1) this._lights.push(g);
    g.userData.brakeMat = brake || null;
    g.userData.indMat = ind || null;
    g.userData.indMeshes = [];
    g.traverse(function (c) {
      if (c.userData && c.userData.light === 'ind') {
        g.userData.indMeshes.push({ mesh: c, side: c.userData.lightSide, on: false });
      }
    });
    return g;
  },

  unregisterLights: function (g) {
    const i = this._lights.indexOf(g);
    if (i !== -1) this._lights.splice(i, 1);
  },

  /**
   * Drive brake lights and indicators.
   * @param {number} nowMs
   * @param {number} camDist optional camera distance; vehicles beyond it are skipped
   */
  updateLights: function (nowMs, cameraPos) {
    const period = 1000 / this.LIGHT_HZ;
    if (nowMs - this._lightTick < period) return;
    this._lightTick = nowMs;

    // 1.1 s period, matching the real Indian indicator cadence (~55 blinks/min)
    const on = ((nowMs % 1100) < 550);

    for (let i = this._lights.length - 1; i >= 0; i--) {
      const g = this._lights[i];
      // Drop only genuinely dead entries. A vehicle that is built but not yet
      // added to the scene has no parent -- that must NOT evict it, or the
      // brake/indicator state is silently lost. Pooled vehicles are removed by
      // traffic-manager calling unregisterLights() on despawn.
      if (!g) { this._lights.splice(i, 1); continue; }
      if (!g.parent) continue;

      if (cameraPos && g.position) {
        const dx = g.position.x - cameraPos.x, dz = g.position.z - cameraPos.z;
        // Beyond 120 m the emissive change is invisible; skip the work.
        if (dx * dx + dz * dz > 14400) continue;
      }

      const ud = g.userData;
      if (ud.brakeMat) {
        // Brake lights read from the owner vehicle's state.
        const braking = !!(g.userData._braking || (g.userData.speedRef && g.userData.speedRef() < -0.02));
        ud.brakeMat.emissiveIntensity = braking ? 2.4 : 0.25;
      }
      if (ud.indMat && ud.indMeshes && ud.indMeshes.length) {
        const want = !!g.userData._indicating;
        if (want || ud._indWasOn) {
          ud.indMat.emissiveIntensity = (want && on) ? 2.8 : 0.15;
          ud.indMeshes.forEach(function (e) {
            const lit = want && on && e.side === g.userData._indicatorSide;
            if (lit !== e.on) {
              e.on = lit;
              e.mesh.visible = true;               // keep geometry, drive emissive
            }
          });
        }
        ud._indWasOn = want;
      }
    }
  },

  /** Convenience: set a vehicle's brake state (call from the traffic loop). */
  setBraking: function (g, braking) {
    if (g && g.userData) g.userData._braking = !!braking;
  },

  /** Convenience: set indicator state. side is 'L', 'R', or null to cancel. */
  setIndicator: function (g, side) {
    if (!g || !g.userData) return;
    g.userData._indicating = !!side;
    g.userData._indicatorSide = side || null;
  },

  /** True if this vehicle has any animated light attached. */
  hasLights: function (g) {
    return !!(g && g.userData && (g.userData.brakeMat || g.userData.indMat));
  },

  buildVehicle: function (type, colorHex) {
    if (!this.textures.grille) {this.init()}

    // Remember the class for helpers called without an explicit type
    // (buildWheel, addFourWheels), so every branch inherits the right tyre
    // radius and wheelbase ratio without needing its own argument.
    this._currentType = type
    // Fresh brake/indicator materials for THIS vehicle only.
    this._vehicleMats = {}

    const g = new THREE.Group()
    const bMat = this.paintMat(colorHex)
    // Glass / grille / chrome now come from the shared cache instead of a fresh
    // MeshToonMaterial per vehicle per part.
    const gMat = this.glassMat()
    const grMat = this.mat('grille', () => new THREE.MeshPhongMaterial({
      color: 0xffffff, map: this.textures.grille, specular: 0x333333, shininess: 40
    }))
    const chromeMat = this.chromeMat()

    let body, roof


    if (type === 'splendor' || type === 'bike' || type === 'twowheeler') {

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 1.4), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      frame.position.y = 0.7
      frame.rotation.x = 0.1
      g.add(frame)


      body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.5), bMat)
      body.position.set(0, 0.85, -0.1)
      g.add(body)


      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.6), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.95, 0.2)
      g.add(seat)


      const hl = this.buildHeadlight(0, 0.8, -0.75)
      g.add(hl)


      const tl = this.buildTaillight(0, 0.7, 0.65)
      g.add(tl)


      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), chromeMat)
      handlebar.position.set(0, 1.0, -0.6)
      g.add(handlebar)


      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 8), chromeMat)
      exhaust.rotation.z = Math.PI / 2
      exhaust.position.set(0.25, 0.4, 0.2)
      g.add(exhaust)


      const w1 = this.buildWheel(0.9)
      w1.position.set(0, 0.35, -0.6)
      w1.userData.isWheel = true; w1.userData.isFront = true; w1.userData.wheelRadius = 0.35
      const w2 = this.buildWheel(0.9)
      w2.position.set(0, 0.35, 0.6)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.35
      g.add(w1, w2)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2]
    } else if (type === 'activa' || type === 'scooter') {

      body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 1.4), bMat)
      body.position.y = 0.5
      g.add(body)


      const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), bMat)
      front.position.set(0, 0.7, -0.6)
      g.add(front)


      const floor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.5), new THREE.MeshPhongMaterial({ color: 0x333333 }))
      floor.position.set(0, 0.35, -0.15)
      g.add(floor)


      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.5), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.75, 0.15)
      g.add(seat)


      const hl = this.buildHeadlight(0, 0.85, -0.72)
      g.add(hl)


      const tl = this.buildTaillight(0, 0.55, 0.7)
      g.add(tl)


      const w1 = this.buildWheel(0.8)
      w1.position.set(0, 0.3, -0.55)
      w1.userData.isWheel = true; w1.userData.isFront = true; w1.userData.wheelRadius = 0.30
      const w2 = this.buildWheel(0.8)
      w2.position.set(0, 0.3, 0.55)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.30
      g.add(w1, w2)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2]
    }

    else if (type === 'auto') {

      const aMat = new THREE.MeshToonMaterial({ color: 0x2e8b57 })
      const rMat = new THREE.MeshToonMaterial({ color: 0xffd700 })
      body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 2.4), aMat)
      body.position.y = 0.6
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 2.0), rMat)
      roof.position.set(0, 1.5, 0.2)


      body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 2.2), aMat)
      body.position.y = 0.55
      g.add(body)


      roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.15, 2.0), rMat)
      roof.position.set(0, 1.35, 0.1)
      g.add(roof)


      const pillarMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
      ;[-0.55, 0.55].forEach(x => {
        ;[-0.7, 0.7].forEach(z => {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), pillarMat)
          pillar.position.set(x, 1.0, z)
          g.add(pillar)
        })
      })


      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.8), aMat)
      hood.position.set(0, 0.5, -1.3)
      g.add(hood)


      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.05), gMat)
      windshield.position.set(0, 0.9, -0.9)
      windshield.rotation.x = -0.2
      g.add(windshield)


      const hl = this.buildHeadlight(0, 0.6, -1.7)
      g.add(hl)


      const tl = this.buildTaillight(0, 0.5, 1.1)
      g.add(tl)


      ;[-0.5, 0.5].forEach(x => {
        const ind = this.buildIndicator(x, 0.6, -1.7)
        g.add(ind)
      })


      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: this.textures.plate }))
      plate.position.set(0, 0.35, -1.72)
      g.add(plate)


      const w1 = this.buildWheel(0.9)
      w1.position.set(0, 0.35, -1.2)
      w1.userData.isWheel = true; w1.userData.isFront = true; w1.userData.wheelRadius = 0.35
      const w2 = this.buildWheel(0.8)
      w2.position.set(-0.55, 0.35, 0.8)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.32
      const w3 = this.buildWheel(0.8)
      w3.position.set(0.55, 0.35, 0.8)
      w3.userData.isWheel = true; w3.userData.isFront = false; w3.userData.wheelRadius = 0.32
      g.add(w1, w2, w3)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2, w3]
    }

    else if (type === 'wagonr' || type === 'car') {

      body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.2), bMat)
      body.position.y = 0.55
      g.add(body)


      roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.8, 2.0), gMat)
      roof.position.set(0, 1.3, -0.1)
      g.add(roof)


      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 0.8), bMat)
      hood.position.set(0, 0.95, -1.5)
      g.add(hood)


      this.addBumper(g, 1.4, 0.15, 0.3, -1.65)
      this.addBumper(g, 1.4, 0.15, 0.3, 1.65)


      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.55, -1.62)
        g.add(hl)
      })


      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.55, 1.62)
        g.add(tl)
      })


      ;[-0.6, 0.6].forEach(x => {
        g.add(this.buildIndicator(x, 0.5, -1.62))
        g.add(this.buildIndicator(x, 0.5, 1.62))
      })


      this.addMirror(g, -0.8, 1.0, -0.3)
      this.addMirror(g, 0.8, 1.0, -0.3)


      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: this.textures.plate }))
      plate.position.set(0, 0.35, -1.63)
      g.add(plate)

      this.addFourWheels(g, 1.5, 3.2)
    } else if (type === 'creta' || type === 'suv') {

      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 3.8), bMat)
      body.position.y = 0.75
      g.add(body)


      roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.85, 2.4), gMat)
      roof.position.set(0, 1.6, -0.1)
      g.add(roof)


      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.0), bMat)
      hood.position.set(0, 1.15, -1.6)
      hood.rotation.x = 0.1
      g.add(hood)


      this.addRoofRails(g, 1.65, 2.4, 2.05)


      this.addBumper(g, 1.6, 0.2, 0.4, -1.95, 0x333333)
      this.addBumper(g, 1.6, 0.2, 0.4, 1.95, 0x333333)


      ;[-0.6, 0.6].forEach(x => {
        const hl = this.buildHeadlight(x, 0.8, -1.9)
        g.add(hl)
      })


      ;[-0.6, 0.6].forEach(x => {
        const tl = this.buildTaillight(x, 0.8, 1.9)
        g.add(tl)
      })


      this.addMirror(g, -0.9, 1.2, -0.4)
      this.addMirror(g, 0.9, 1.2, -0.4)


      const stepMat = new THREE.MeshPhongMaterial({ color: 0x333333 })
      ;[-0.85, 0.85].forEach(x => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 2.0), stepMat)
        step.position.set(x, 0.35, 0)
        g.add(step)
      })

      this.addFourWheels(g, 1.7, 3.8, 1.1)
    } else if (type === 'city' || type === 'sedan') {

      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 4.2), bMat)
      body.position.y = 0.55
      g.add(body)


      roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 2.2), gMat)
      roof.position.set(0, 1.25, 0)
      g.add(roof)


      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.2), bMat)
      hood.position.set(0, 0.9, -1.8)
      g.add(hood)


      const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.8), bMat)
      trunk.position.set(0, 0.9, 1.7)
      g.add(trunk)


      this.addBumper(g, 1.5, 0.15, 0.3, -2.15)
      this.addBumper(g, 1.5, 0.15, 0.3, 2.15)


      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.55, -2.1)
        g.add(hl)
      })


      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.55, 2.1)
        g.add(tl)
      })


      this.addMirror(g, -0.85, 1.0, -0.5)
      this.addMirror(g, 0.85, 1.0, -0.5)

      this.addFourWheels(g, 1.6, 4.2)
    } else if (type === 'innova' || type === 'mpv') {

      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 4.4), bMat)
      body.position.y = 0.7
      g.add(body)


      roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.9, 3.0), gMat)
      roof.position.set(0, 1.55, 0.1)
      g.add(roof)


      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.0), bMat)
      hood.position.set(0, 1.1, -1.9)
      g.add(hood)


      this.addRoofRails(g, 1.65, 3.0, 2.0)


      this.addBumper(g, 1.6, 0.2, 0.4, -2.25)
      this.addBumper(g, 1.6, 0.2, 0.4, 2.25)


      ;[-0.6, 0.6].forEach(x => {
        const hl = this.buildHeadlight(x, 0.7, -2.2)
        g.add(hl)
      })


      ;[-0.6, 0.6].forEach(x => {
        const tl = this.buildTaillight(x, 0.7, 2.2)
        g.add(tl)
      })


      this.addMirror(g, -0.9, 1.2, -0.6)
      this.addMirror(g, 0.9, 1.2, -0.6)

      this.addFourWheels(g, 1.7, 4.4, 1.05)
    } else if (type === 'cab' || type === 'taxi') {

      const wMat = new THREE.MeshToonMaterial({ color: 0xffffff })
      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3.8), wMat)
      body.position.y = 0.6
      g.add(body)

      roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.8), gMat)
      roof.position.set(0, 1.3, 0)
      g.add(roof)

      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshToonMaterial({ color: 0xffd700 }))
      sign.position.set(0, 1.75, 0)
      g.add(sign)


      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.0), wMat)
      hood.position.set(0, 0.9, -1.7)
      g.add(hood)


      const signBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      signBase.position.set(0, 1.65, 0)
      g.add(signBase)
      const signLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.25), new THREE.MeshBasicMaterial({ color: 0xffd700 }))
      signLight.position.set(0, 1.75, 0)
      g.add(signLight)


      this.addBumper(g, 1.5, 0.15, 0.3, -2.05)
      this.addBumper(g, 1.5, 0.15, 0.3, 2.05)


      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.55, -2.0)
        g.add(hl)
      })


      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.55, 2.0)
        g.add(tl)
      })


      this.addMirror(g, -0.85, 1.0, -0.4)
      this.addMirror(g, 0.85, 1.0, -0.4)

      this.addFourWheels(g, 1.6, 4.0)
    }

    else if (type === 'ace' || type === 'scv') {

      body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.5), bMat)
      body.position.y = 0.65
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.2), bMat)
      cab.position.set(0, 1.6, -1.15)
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.3), new THREE.MeshToonMaterial({ color: 0x888888 }))
      bed.position.set(0, 1.2, 0.6)
      g.add(body, cab, bed)
      this.addFourWheels(g, 1.5, 3.5)
    } else if (type === 'truck' || type === 'eicher') {
      body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 7.0), new THREE.MeshToonMaterial({ color: 0x222222 }))
      body.position.y = 0.8
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.8), bMat)
      cab.position.set(0, 2.3, -2.6)
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 5.0), new THREE.MeshToonMaterial({ color: 0xaa4422 }))
      cargo.position.set(0, 2.5, 1.0)
      g.add(body, cab, cargo)
      this.addFourWheels(g, 2.4, 7.0, 0.5)
    }

    else if (type === 'bus' || type === 'msrtc') {
      const msrtcMat = new THREE.MeshToonMaterial({ color: 0xcc2222 })
      body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 10.0), msrtcMat)
      body.position.y = 2.0
      const windows = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.2, 9.8), gMat)
      windows.position.y = 2.4
      g.add(body, windows)


      const windowsSide = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.0, 9.3), gMat)
      windowsSide.position.y = 2.2
      g.add(windowsSide)


      const roofBus = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 9.4), new THREE.MeshPhongMaterial({ color: 0xdddddd }))
      roofBus.position.y = 3.3
      g.add(roofBus)


      const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 0.08), gMat)
      frontWindshield.position.set(0, 2.4, -4.75)
      g.add(frontWindshield)


      const destBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.1), new THREE.MeshBasicMaterial({ color: 0x00aa00 }))
      destBoard.position.set(0, 3.1, -4.78)
      g.add(destBoard)


      ;[-0.8, 0.8].forEach(x => {
        const hl = this.buildHeadlight(x, 1.2, -4.78)
        g.add(hl)
      })


      ;[-0.8, 0.8].forEach(x => {
        const tl = this.buildTaillight(x, 1.2, 4.78)
        g.add(tl)
      })


      const y = 0.45
      const hw = 1.2
      const hl = 3.8
      const positions = [
        [-hw, y, -hl],
        [hw, y, -hl],
        [-hw, y, hl],
        [hw, y, hl],
        [-hw, y, hl - 1.5],
        [hw, y, hl - 1.5]
      ]
      positions.forEach((p) => {
        const w = this.buildWheel(1.3)
        w.position.set(p[0], p[1], p[2])
        g.add(w)
      })
    }

    else if (type === 'police') {
      const policeMat = new THREE.MeshPhongMaterial({ color: 0x111111 })
      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4.2), policeMat)
      body.position.y = 0.6
      g.add(body)


      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.2, 4.22), new THREE.MeshPhongMaterial({ color: 0xffffff }))
      stripe.position.y = 0.6
      g.add(stripe)


      roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 2.2), gMat)
      roof.position.set(0, 1.3, 0)
      g.add(roof)


      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.3), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      lightBar.position.set(0, 1.75, 0)
      g.add(lightBar)


      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      redLight.position.set(-0.25, 1.85, 0)
      g.add(redLight)


      const blueLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0000ff }))
      blueLight.position.set(0.25, 1.85, 0)
      g.add(blueLight)


      const policeText = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      policeText.position.set(0, 0.8, -2.11)
      g.add(policeText)


      this.addBumper(g, 1.6, 0.15, 0.3, -2.15)
      this.addBumper(g, 1.6, 0.15, 0.3, 2.15)


      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.6, -2.1)
        g.add(hl)
      })


      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.6, 2.1)
        g.add(tl)
      })

      this.addFourWheels(g, 1.7, 4.2)
    }

    else if (type === 'ambulance') {
      const ambMat = new THREE.MeshPhongMaterial({ color: 0xffffff })
      body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 5.5), ambMat)
      body.position.y = 1.5
      g.add(body)


      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      crossH.position.set(0, 2.2, -2.76)
      g.add(crossH)
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      crossV.position.set(0, 2.2, -2.76)
      g.add(crossV)


      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.4), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      lightBar.position.set(0, 2.7, 0)
      g.add(lightBar)


      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      redLight.position.set(-0.3, 2.85, 0)
      g.add(redLight)


      const blueLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0000ff }))
      blueLight.position.set(0.3, 2.85, 0)
      g.add(blueLight)


      ;[-0.65, 0.65].forEach(x => {
        const hl = this.buildHeadlight(x, 1.2, -2.78)
        g.add(hl)
      })


      ;[-0.65, 0.65].forEach(x => {
        const tl = this.buildTaillight(x, 1.2, 2.78)
        g.add(tl)
      })

      this.addFourWheels(g, 2.0, 5.5, 1.1)
    }

    else if (type === 'ktm' || type === 'sportbike') {

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 1.5), new THREE.MeshPhongMaterial({ color: 0xff6600 }))
      frame.position.y = 0.75
      frame.rotation.x = 0.15
      g.add(frame)


      body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), bMat)
      body.position.set(0, 0.9, -0.15)
      g.add(body)


      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.55), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 1.0, 0.25)
      g.add(seat)


      const hl = this.buildHeadlight(0, 0.85, -0.8)
      g.add(hl)


      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 8), chromeMat)
      exhaust.rotation.z = Math.PI / 2
      exhaust.position.set(0.3, 0.4, 0.25)
      g.add(exhaust)


      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.04), chromeMat)
      handlebar.position.set(0, 1.05, -0.55)
      g.add(handlebar)

      const w1 = this.buildWheel(0.85)
      w1.position.set(0, 0.35, -0.65)
      w1.userData.isWheel = true; w1.userData.isFront = true; w1.userData.wheelRadius = 0.35
      const w2 = this.buildWheel(0.85)
      w2.position.set(0, 0.35, 0.65)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.35
      g.add(w1, w2)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2]
    }

    else if (type === 'cycle') {

      const frameMat = new THREE.MeshPhongMaterial({ color: 0x222222 })


      const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), frameMat)
      tube1.position.set(0, 0.7, -0.2)
      tube1.rotation.x = 0.3
      g.add(tube1)

      const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), frameMat)
      tube2.position.set(0, 0.6, 0.2)
      tube2.rotation.x = -0.4
      g.add(tube2)


      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.3), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.95, 0.2)
      g.add(seat)


      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), chromeMat)
      handlebar.position.set(0, 0.95, -0.5)
      g.add(handlebar)


      const w1 = this.buildWheel(0.7)
      w1.scale.set(1, 1, 0.3)
      w1.position.set(0, 0.35, -0.45)
      w1.userData.isWheel = true; w1.userData.isFront = true; w1.userData.wheelRadius = 0.35
      const w2 = this.buildWheel(0.7)
      w2.scale.set(1, 1, 0.3)
      w2.position.set(0, 0.35, 0.45)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.35
      g.add(w1, w2)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2]
    }

    else if (type === 'tractor') {
      const tractorMat = new THREE.MeshToonMaterial({ color: 0x228B22 })

      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3.2), tractorMat)
      body.position.y = 0.75
      g.add(body)

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), gMat)
      cabin.position.set(0, 1.6, 0.4)
      g.add(cabin)

      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 1.5), tractorMat)
      hood.position.set(0, 0.95, -0.9)
      g.add(hood)

      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), new THREE.MeshPhongMaterial({ color: 0x333333 }))
      exhaust.position.set(0.55, 1.5, -0.6)
      g.add(exhaust)

      const w1 = this.buildWheel(1.1)
      w1.position.set(-0.85, 0.5, 0.8)
      w1.userData.isWheel = true; w1.userData.isFront = false; w1.userData.wheelRadius = 0.5
      const w2 = this.buildWheel(1.1)
      w2.position.set(0.85, 0.5, 0.8)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.5
      g.add(w1, w2)

      const w3 = this.buildWheel(0.75)
      w3.position.set(-0.75, 0.35, -1.0)
      w3.userData.isWheel = true; w3.userData.isFront = true; w3.userData.wheelRadius = 0.35
      const w4 = this.buildWheel(0.75)
      w4.position.set(0.75, 0.35, -1.0)
      w4.userData.isWheel = true; w4.userData.isFront = true; w4.userData.wheelRadius = 0.35
      g.add(w3, w4)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2, w3, w4]
    }

    else if (type === 'auto_yellow') {

      const yMat = new THREE.MeshPhongMaterial({ color: 0xffd700 })
      const bMat2 = new THREE.MeshPhongMaterial({ color: 0x111111 })

      body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 2.2), bMat2)
      body.position.y = 0.55
      g.add(body)

      roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.15, 2.0), yMat)
      roof.position.set(0, 1.35, 0.1)
      g.add(roof)

      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.8), yMat)
      hood.position.set(0, 0.5, -1.3)
      g.add(hood)

      const hl = this.buildHeadlight(0, 0.6, -1.7)
      g.add(hl)
      const tl = this.buildTaillight(0, 0.5, 1.1)
      g.add(tl)

      const w1 = this.buildWheel(0.9)
      w1.position.set(0, 0.35, -1.2)
      w1.userData.isWheel = true; w1.userData.isFront = true; w1.userData.wheelRadius = 0.35
      const w2 = this.buildWheel(0.8)
      w2.position.set(-0.55, 0.35, 0.8)
      w2.userData.isWheel = true; w2.userData.isFront = false; w2.userData.wheelRadius = 0.32
      const w3 = this.buildWheel(0.8)
      w3.position.set(0.55, 0.35, 0.8)
      w3.userData.isWheel = true; w3.userData.isFront = false; w3.userData.wheelRadius = 0.32
      g.add(w1, w2, w3)
      g.userData = g.userData || {}; g.userData.wheels = [w1, w2, w3]
    }

    else {
      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.8), bMat)
      body.position.y = 0.6
      g.add(body)

      roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 2.0), gMat)
      roof.position.set(0, 1.35, -0.2)
      g.add(roof)

      this.addBumper(g, 1.5, 0.15, 0.3, -1.95)
      this.addBumper(g, 1.5, 0.15, 0.3, 1.95)

      ;[-0.55, 0.55].forEach(x => {
        g.add(this.buildHeadlight(x, 0.55, -1.9))
        g.add(this.buildTaillight(x, 0.55, 1.9))
      })

      this.addFourWheels(g, 1.6, 3.8)
    }

    const isHeavy = ['truck', 'eicher', 'bus', 'msrtc', 'school_bus'].includes(type)
    const isTwoWheeler = ['bike', 'splendor', 'activa', 'scooter', 'cycle', 'bicycle', 'twowheeler'].includes(type)
    const isAuto = ['auto', 'rickshaw'].includes(type)
    g.userData = g.userData || {}
    g.type = type

    // ── Normalise to the canonical envelope ──────────────────────────────────
    // Every branch above builds its body box from hardcoded numbers that drifted
    // apart (wagonr 3.2 m, city 4.2 m, sedan 4.0 m, bus 7.0 m). Rather than
    // hand-editing each one, rescale the finished group uniformly to the
    // canonical length and derive the collider from the MEASURED box.
    //
    // This also re-grounds the model: rescaling about the origin lifts the
    // tyres off the road, so the y offset is corrected afterwards.
    this.normalise(g, type)

    // Fallback collider only if normalise() could not measure (e.g. THREE.Box3
    // unavailable). Prefer the canonical table over the old inline guesses.
    if (!g.userData.halfW || !g.userData.halfD) {
      const d = this.dims(type)
      g.userData.halfW = d.W / 2 + 0.04
      g.userData.halfD = d.L / 2 + 0.04
    }
    g.userData.isVehicle = true
    if (this._VD) g.userData.dimKey = this._VD.key(type)

    return g
  }
}
