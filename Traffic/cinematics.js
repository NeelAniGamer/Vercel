/**
 * cinematics.js — Story set builder + city block filler.
 *
 * The generic cutscene player lives in cutscene.js; the shot scripts live in
 * story/campaign.js. This file owns the SETS those shots film: the places the
 * dialogue actually names. Without it a shot like "Mummy (Balcony)" has nothing
 * to push in on, because _buildPlotBuildings() only makes a solid box with a
 * cone roof.
 *
 * Two responsibilities:
 *
 *   1. buildHouse()  — detailed dwelling for a plot that declares `houseSet`:
 *                      verandah + steps, first-floor balcony (the balcony in
 *                      the dialogue is a real place now), compound wall + gate,
 *                      front garden with planting and a stone path, Mumbai
 *                      roof furniture (water tank, dish, drainpipe), and a
 *                      furnished interior.
 *
 *   2. fillBlocks()  — populate the empty blocks BETWEEN declared roads so the
 *                      player never sees bare ground while roaming. Levels that
 *                      declare `roads` bypass _buildBuildingsFromGraph()
 *                      (it needs roadGraph.buildingSlots), which is why they
 *                      used to render as open grass.
 *
 * COLLISION CONTRACT — read before changing anything here.
 *   The house body stays ONE solid obstacle, exactly as _buildPlotBuildings()
 *   created it. The interior is geometry INSIDE that shell: only a camera can
 *   see it, so a player can never walk in and get wedged. Do not convert the
 *   shell into wall segments to "make the interior enterable" — that turns a
 *   cosmetic asset into a softlock generator, and 1.5m-radius players have
 *   already proven they wedge in geometry this tight.
 *
 * DETERMINISM
 *   Every random-looking choice is hashed from integer cell coordinates, not
 *   Math.random(). The city must look identical on every load, or buildings
 *   shimmer between runs and the map stops being memorisable for a driving
 *   test where the whole point is spatial memory.
 */
(function () {
  'use strict';

  var GROUP_NAME = 'story-sets';

  // ── Deterministic hash ────────────────────────────────────────────────────
  function hash2(x, z, salt) {
    var h = (x * 73856093) ^ (z * 19349663) ^ ((salt || 0) * 83492791);
    h = h ^ (h >>> 13);
    h = Math.imul(h, 0x5bd1e995);
    h = h ^ (h >>> 15);
    return (h >>> 0) / 4294967296;
  }

  function pick(list, t) { return list[Math.min(list.length - 1, Math.floor(t * list.length))]; }

  // ── Shared geometry cache ─────────────────────────────────────────────────
  // The block filler emits thousands of boxes and window quads. Building a fresh
  // BufferGeometry per mesh crashed the tab with an OOM, because every mesh also
  // carries its own draw call. One unit geometry per shape, reused and scaled,
  // keeps both GPU memory and draw-call count bounded.
  var GEO = null;
  function geo() {
    if (GEO) { return GEO; }
    GEO = {
      box: new THREE.BoxGeometry(1, 1, 1),
      plane: new THREE.PlaneGeometry(1, 1),
      cone: new THREE.ConeGeometry(1, 1, 4),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      sphere: new THREE.SphereGeometry(1, 10, 8),
      octa: new THREE.DodecahedronGeometry(1, 0),
      dodecSmall: new THREE.DodecahedronGeometry(0.7, 0)
    };
    return GEO;
  }

  /** Canvas texture generator for striped fabric shop awnings */
  var _awningTexCache = {};
  function stripedAwningTex(colHex, colHex2) {
    var key = (colHex || 0xe74c3c) + '_' + (colHex2 || 0xffffff);
    if (_awningTexCache[key]) { return _awningTexCache[key]; }
    try {
      var cv = document.createElement('canvas');
      cv.width = 128; cv.height = 128;
      var ctx = cv.getContext('2d');
      var c1 = '#' + new THREE.Color(colHex || 0xe74c3c).getHexString();
      var c2 = '#' + new THREE.Color(colHex2 || 0xffffff).getHexString();
      var stripes = 8;
      var sw = 128 / stripes;
      for (var i = 0; i < stripes; i++) {
        ctx.fillStyle = (i % 2 === 0) ? c1 : c2;
        ctx.fillRect(i * sw, 0, sw, 128);
      }
      var tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 1);
      _awningTexCache[key] = tex;
      return tex;
    } catch (e) { return null; }
  }

  /** Canvas texture for rooftop helipads (Image 1 & 2) */
  var _helipadTexCache = null;
  function helipadTex() {
    if (_helipadTexCache) { return _helipadTexCache; }
    try {
      var cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#0f2937';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 240, 240);
      ctx.beginPath();
      ctx.arc(128, 128, 96, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 110px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', 128, 132);
      _helipadTexCache = new THREE.CanvasTexture(cv);
      return _helipadTexCache;
    } catch (e) { return null; }
  }

  /** Canvas texture for basketball court (Image 1) */
  var _courtTexCache = null;
  function courtTex() {
    if (_courtTexCache) { return _courtTexCache; }
    try {
      var cv = document.createElement('canvas');
      cv.width = 512; cv.height = 320;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#b9382d'; // Acrylic red hardcourt
      ctx.fillRect(0, 0, 512, 320);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, 480, 288);
      // Half court line
      ctx.beginPath();
      ctx.moveTo(256, 16); ctx.lineTo(256, 304);
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(256, 160, 48, 0, Math.PI * 2);
      ctx.stroke();
      // Keys / free throw lines
      [-1, 1].forEach(function(dir) {
        var kx = dir === -1 ? 16 : 416;
        ctx.fillStyle = '#1e3a8a'; // Blue key paint
        ctx.fillRect(kx, 110, 80, 100);
        ctx.strokeRect(kx, 110, 80, 100);
        ctx.beginPath();
        var cx = dir === -1 ? 96 : 416;
        ctx.arc(cx, 160, 48, -Math.PI / 2, Math.PI / 2, dir === 1);
        ctx.stroke();
      });
      _courtTexCache = new THREE.CanvasTexture(cv);
      return _courtTexCache;
    } catch (e) { return null; }
  }

  /** Shared-geometry box: unit cube scaled to w/h/d. */
  function sbox(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(geo().box, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    return m;
  }

  // ── Shared materials (created once per build) ─────────────────────────────
  function mats() {
    var m = {
      wallWarm: new THREE.MeshLambertMaterial({ color: 0xf5e6d3 }),
      wallTrim: new THREE.MeshLambertMaterial({ color: 0xffffff }),
      slab: new THREE.MeshLambertMaterial({ color: 0xd8d2c4 }),
      floorIn: new THREE.MeshLambertMaterial({ color: 0xc8b79a }),
      rail: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      pillar: new THREE.MeshLambertMaterial({ color: 0xefe7d8 }),
      roofRed: new THREE.MeshLambertMaterial({ color: 0x9b4a2f }),
      tank: new THREE.MeshLambertMaterial({ color: 0x1f4f8a }),
      tankLid: new THREE.MeshLambertMaterial({ color: 0x163a63 }),
      dish: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      pipe: new THREE.MeshLambertMaterial({ color: 0x9aa5b1 }),
      glassDark: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      glassLit: new THREE.MeshBasicMaterial({ color: 0xfde68a }),
      compound: new THREE.MeshLambertMaterial({ color: 0xd9cdb6 }),
      gate: new THREE.MeshLambertMaterial({ color: 0x166534 }),
      soil: new THREE.MeshLambertMaterial({ color: 0x4a3728 }),
      grass: new THREE.MeshLambertMaterial({ color: 0x3f7d3a }),
      leafA: new THREE.MeshLambertMaterial({ color: 0x2f6b34 }),
      leafB: new THREE.MeshLambertMaterial({ color: 0x3f8f45 }),
      leafFaceted1: new THREE.MeshLambertMaterial({ color: 0x2e7d32, flatShading: true }),
      leafFaceted2: new THREE.MeshLambertMaterial({ color: 0x43a047, flatShading: true }),
      leafFaceted3: new THREE.MeshLambertMaterial({ color: 0x1b5e20, flatShading: true }),
      trunk: new THREE.MeshLambertMaterial({ color: 0x6b4a2f }),
      brickPath: new THREE.MeshLambertMaterial({ color: 0xb08a6a }),
      sofa: new THREE.MeshLambertMaterial({ color: 0x7a4a52 }),
      sofaCush: new THREE.MeshLambertMaterial({ color: 0x94606a }),
      tv: new THREE.MeshLambertMaterial({ color: 0x111827 }),
      tvScreen: new THREE.MeshBasicMaterial({ color: 0x1b2a41 }),
      woodDark: new THREE.MeshLambertMaterial({ color: 0x5b3f29 }),
      woodLight: new THREE.MeshLambertMaterial({ color: 0xa67c52 }),
      counter: new THREE.MeshLambertMaterial({ color: 0xcbb79c }),
      fridge: new THREE.MeshLambertMaterial({ color: 0xdfe6ee }),
      steel: new THREE.MeshLambertMaterial({ color: 0xa8b3bf }),
      bed: new THREE.MeshLambertMaterial({ color: 0xe8eef5 }),
      blanket: new THREE.MeshLambertMaterial({ color: 0x4a6fa5 }),
      rug: new THREE.MeshLambertMaterial({ color: 0x9c6b5a }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xfff1c9 }),
      plantPot: new THREE.MeshLambertMaterial({ color: 0xb45309 }),
      flowerA: new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
      flowerB: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      flowerC: new THREE.MeshBasicMaterial({ color: 0x60a5fa }),
      // Low-poly city amenity materials
      asphaltDark: new THREE.MeshLambertMaterial({ color: 0x22262c }),
      curbConcrete: new THREE.MeshLambertMaterial({ color: 0xd4d8dc }),
      paintWhiteLine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      policeBlue: new THREE.MeshLambertMaterial({ color: 0x1e40af }),
      hospitalCyan: new THREE.MeshLambertMaterial({ color: 0x06b6d4 }),
      dinerRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      solarBlue: new THREE.MeshPhongMaterial({ color: 0x1e3a8a, specular: 0x60a5fa, shininess: 80 }),
      solarFrame: new THREE.MeshLambertMaterial({ color: 0xd1d5db }),
      hydrantRed: new THREE.MeshLambertMaterial({ color: 0xef4444 }),
      dumpsterGreen: new THREE.MeshLambertMaterial({ color: 0x2d5a27 }),
      waterTankWood: new THREE.MeshLambertMaterial({ color: 0x785135 }),
      fenceWire: new THREE.MeshBasicMaterial({ color: 0x94a3b8, wireframe: true }),
      awningRed: new THREE.MeshLambertMaterial({ map: stripedAwningTex(0xdc2626, 0xffffff) }),
      awningBlue: new THREE.MeshLambertMaterial({ map: stripedAwningTex(0x2563eb, 0xffffff) }),
      awningGreen: new THREE.MeshLambertMaterial({ map: stripedAwningTex(0x16a34a, 0xffffff) }),
      awningOrange: new THREE.MeshLambertMaterial({ map: stripedAwningTex(0xea580c, 0xffffff) }),
      helipadMat: new THREE.MeshLambertMaterial({ map: helipadTex() }),
      courtMat: new THREE.MeshLambertMaterial({ map: courtTex() })
    };
    return m;
  }

  function box(w, h, d, mat, x, y, z) {
    return sbox(w, h, d, mat, x, y, z);
  }

  function cyl(rt, rb, h, seg, mat, x, y, z) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    c.position.set(x, y, z);
    return c;
  }

  // ── House set ─────────────────────────────────────────────────────────────
  /**
   * Build the detailed dwelling for a plot that declares `houseSet`.
   *
   * Local frame: the house faces +x (same convention as _buildPlotBuildings,
   * which puts the door and windows on +z then rotates by rotY). Here the group
   * is rotated by rotY exactly once, and everything below is authored in local
   * space with +x as "front toward the road".
   *
   * @returns {THREE.Object3D} local-space anchor for camera targets, so shot
   *          scripts can say `lookAt` a balcony without hard-coding world maths.
   */
  function buildHouse(plot, opts) {
    opts = opts || {};
    var M = opts.mats || mats();
    var w = plot.w || 14, d = plot.d || 12;
    var g = new THREE.Group();
    g.name = 'house-set:' + (plot.id || 'home');

    var hMain = 6.4;      // ground + first floor
    var hUpper = 3.0;     // parapet / second band
    var verD = 2.6;       // verandah depth in +x
    var balconyD = 1.7;

    // ── Shell ──────────────────────────────────────────────────────────────
    // Slightly inset from the plot box so it never z-fights the collision box
    // the engine already built.
    var body = box(w, hMain + hUpper, d, M.wallWarm, 0, (hMain + hUpper) / 2, 0);
    g.add(body);

    // Parapet band + roof slab
    g.add(box(w + 0.5, 0.45, d + 0.5, M.slab, 0, hMain + hUpper + 0.22, 0));
    g.add(box(w * 0.55, hUpper * 0.55, d * 0.5, M.wallWarm, -w * 0.18, hMain + hUpper * 0.72, 0));

    // ── Front face: doorway, windows, balcony above ─────────────────────────
    var frontX = w / 2;
    var doorW = 1.7, doorH = 2.9;
    // Door recess (dark) — visual only; the shell stays solid for collision.
    g.add(box(0.14, doorH, doorW, M.glassDark, frontX - 0.02, doorH / 2, 0));
    g.add(box(0.1, 0.18, doorW + 0.5, M.wallTrim, frontX + 0.03, doorH + 0.09, 0));
    // Door frame uprights
    [-1, 1].forEach(function (s) {
      g.add(box(0.12, doorH + 0.2, 0.16, M.wallTrim, frontX + 0.04, (doorH + 0.2) / 2, s * (doorW / 2 + 0.08)));
    });
    // Step slab
    g.add(box(1.1, 0.16, doorW + 1.1, M.slab, frontX + 0.55, 0.08, 0));
    g.add(box(0.7, 0.16, doorW + 1.6, M.brickPath, frontX + 1.4, 0.08, 0));

    // Ground-floor windows, front face
    [-1, 1].forEach(function (s) {
      var wz = s * (w * 0.3);
      g.add(box(0.1, 1.5, 1.7, M.glassLit, frontX + 0.03, 1.9, wz));
      g.add(box(0.14, 0.14, 1.95, M.wallTrim, frontX + 0.06, 2.72, wz));
      g.add(box(0.16, 0.1, 2.05, M.wallTrim, frontX + 0.07, 1.12, wz));
      // Bars: very Mumbai, and they catch the light nicely.
      for (var b = 0; b < 4; b++) {
        g.add(box(0.06, 1.5, 0.06, M.pipe, frontX + 0.09, 1.9, wz - 0.6 + b * 0.4));
      }
    });

    // ── Verandah (ground floor, +x) ────────────────────────────────────────
    if (opts.verandah !== false) {
      var vFloor = box(verD, 0.2, d * 0.92, M.slab, frontX + verD / 2, 0.1, 0);
      g.add(vFloor);
      // Four pillars
      [-1, 1].forEach(function (sx) {
        [-1, 1].forEach(function (sz) {
          var px = frontX + verD - 0.35, pz = sz * (d * 0.4);
          var pil = cyl(0.19, 0.22, hMain - 0.2, 10, M.pillar, px, (hMain - 0.2) / 2, pz);
          g.add(pil);
          g.add(box(0.5, 0.16, 0.5, M.wallTrim, px, hMain - 0.28, pz));
          g.add(box(0.42, 0.14, 0.42, M.wallTrim, px, 0.2, pz));
        });
      });
      // Verandah roof slab + fascia
      g.add(box(verD + 0.5, 0.3, d * 0.98, M.slab, frontX + verD / 2 - 0.1, hMain + 0.15, 0));
      g.add(box(0.14, 0.42, d * 0.98, M.wallTrim, frontX + verD + 0.1, hMain - 0.05, 0));
      // Hanging bulb under the verandah — motivates the warm key light
      g.add(cyl(0.02, 0.02, 0.5, 5, M.pipe, frontX + verD * 0.5, hMain - 0.45, 0));
      var vb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), M.bulb);
      vb.position.set(frontX + verD * 0.5, hMain - 0.78, 0);
      g.add(vb);
    }

    // ── First-floor balcony — this is where Mummy stands ───────────────────
    var balcony = { x: frontX + balconyD / 2, y: hMain + 0.1, z: 0 };
    if (opts.balcony !== false) {
      var bFloor = box(balconyD, 0.22, d * 0.62, M.slab, balcony.x, balcony.y, 0);
      g.add(bFloor);
      // Railing: top rail, bottom rail, balusters
      var railZ = d * 0.31;
      g.add(box(balconyD, 0.1, railZ * 2, M.rail, balcony.x, balcony.y + 1.05, 0));
      g.add(box(balconyD, 0.08, railZ * 2, M.rail, balcony.x, balcony.y + 0.45, 0));
      var nBal = 11;
      for (var i = 0; i <= nBal; i++) {
        var bz = -railZ + (i / nBal) * railZ * 2;
        g.add(box(0.07, 1.05, 0.07, M.rail, balcony.x + balconyD / 2 - 0.05, balcony.y + 0.63, bz));
      }
      // Side rails
      [-1, 1].forEach(function (s) {
        g.add(box(balconyD, 0.08, 0.08, M.rail, balcony.x, balcony.y + 1.05, s * railZ));
      });
      // Balcony ceiling / soffit with a warm downlight
      g.add(box(balconyD + 0.3, 0.2, d * 0.64, M.slab, balcony.x - 0.1, balcony.y + 2.7, 0));
      var bl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), M.bulb);
      bl.position.set(balcony.x - 0.1, balcony.y + 2.5, 0);
      g.add(bl);
      // Balcony door (opening onto the balcony)
      g.add(box(0.12, 2.5, 1.3, M.glassLit, frontX + 0.02, balcony.y + 1.35, -railZ * 0.45));
      // Laundry line + a couple of cloths: lived-in detail
      g.add(cyl(0.02, 0.02, railZ * 1.7, 5, M.pipe, balcony.x - 0.2, balcony.y + 1.9, 0));
      [-0.7, 0.2, 0.9].forEach(function (o, k) {
        g.add(box(0.05, 0.7, 0.5, k === 1 ? M.flowerC : M.wallTrim,
          balcony.x - 0.2, balcony.y + 1.5, o));
      });
    }

    // ── Side + rear detailing so no face is a blank slab ───────────────────
    [-1, 1].forEach(function (s) {
      var sx = s * (w / 2);
      for (var f = 0; f < 2; f++) {
        var y = 1.9 + f * 3.4;
        g.add(box(1.5, 1.3, 0.1, (f === 1) ? M.glassLit : M.glassDark, sx + s * 0.03, y, -d * 0.22));
        g.add(box(1.7, 0.12, 0.14, M.wallTrim, sx + s * 0.05, y + 0.72, -d * 0.22));
      }
    });
    // Rear: window + a drainpipe + an AC box
    g.add(box(1.6, 1.3, 0.1, M.glassDark, -w * 0.2, 2.0, -d / 2 - 0.02));
    g.add(cyl(0.09, 0.09, hMain + hUpper - 0.4, 6, M.pipe, w / 2 - 0.35, (hMain + hUpper) / 2, -d / 2 + 0.3));
    g.add(box(0.9, 0.7, 0.5, M.steel, -w * 0.3, hMain - 0.6, -d / 2 - 0.28));

    // ── Roof: Mumbai water tank + dish + parapet pots ─────────────────────
    g.add(box(2.1, 0.25, 2.1, M.slab, -w * 0.2, hMain + hUpper + 0.55, d * 0.18));
    g.add(cyl(1.0, 1.0, 1.5, 14, M.tank, -w * 0.2, hMain + hUpper + 1.42, d * 0.18));
    g.add(cyl(1.02, 1.02, 0.14, 14, M.tankLid, -w * 0.2, hMain + hUpper + 2.22, d * 0.18));
    g.add(cyl(0.07, 0.07, 0.5, 6, M.pipe, -w * 0.2, hMain + hUpper + 2.5, d * 0.18));
    // Dish antenna on a stalk
    g.add(cyl(0.05, 0.05, 0.8, 6, M.pipe, w * 0.22, hMain + hUpper + 0.85, -d * 0.2));
    var dish = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), M.dish);
    dish.position.set(w * 0.22, hMain + hUpper + 1.3, -d * 0.2);
    dish.rotation.set(-0.9, 0, 0.4);
    g.add(dish);

    // ── Garden + compound wall (in front, +x) ──────────────────────────────
    if (opts.garden !== false) {
      var gx0 = frontX + 1.9;
      // Lawn
      var lawn = box(3.6, 0.12, d * 0.9, M.grass, gx0 + 1.6, 0.06, 0);
      g.add(lawn);
      // Stone path from the verandah steps to the gate
      for (var pI = 0; pI < 4; pI++) {
        g.add(box(1.2, 0.1, 1.0, M.brickPath, gx0 + 0.6 + pI * 1.1, 0.05, (pI % 2 ? 0.4 : -0.4)));
      }
      // Flower beds
      [-1, 1].forEach(function (s) {
        var bed = box(1.5, 0.16, 1.5, M.soil, gx0 + 1.5, 0.08, s * (d * 0.3));
        g.add(bed);
        for (var fI = 0; fI < 7; fI++) {
          var fx = gx0 + 1.5 + (hash2(fI, s, 3) - 0.5) * 1.2;
          var fz = s * (d * 0.3) + (hash2(fI, s, 4) - 0.5) * 1.2;
          var fh = 0.22 + hash2(fI, s, 5) * 0.2;
          g.add(cyl(0.03, 0.03, fh, 4, M.leafA, fx, 0.16 + fh / 2, fz));
          var fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5),
            pick([M.flowerA, M.flowerB, M.flowerC], hash2(fI, s, 6)));
          fl.position.set(fx, 0.18 + fh, fz);
          g.add(fl);
        }
      });
      // Potted plants flanking the steps
      [-1, 1].forEach(function (s) {
        g.add(cyl(0.24, 0.19, 0.42, 10, M.plantPot, frontX + 1.15, 0.21, s * (doorW / 2 + 0.7)));
        var bush = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 7),
          s > 0 ? M.leafA : M.leafB);
        bush.position.set(frontX + 1.15, 0.62, s * (doorW / 2 + 0.7));
        bush.scale.set(1, 0.8, 1);
        g.add(bush);
      });
      // A tree in the yard corner
      var tX = gx0 + 3.0, tZ = -d * 0.42;
      g.add(cyl(0.2, 0.3, 2.2, 8, M.trunk, tX, 1.1, tZ));
      var crown = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), M.leafA);
      crown.position.set(tX, 3.1, tZ);
      crown.scale.set(1, 0.85, 1);
      g.add(crown);
      var crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 7), M.leafB);
      crown2.position.set(tX + 0.7, 2.5, tZ + 0.5);
      g.add(crown2);
    }

    // ── Compound wall ───────────────────────────────────────────────────────
    // Built in WORLD space by the orchestrator (buildCompound) rather than here
    // in local space. A wall sized off the house front sliced through the middle
    // of the yard and left the garage OUTSIDE the compound, which is why the
    // homestead read as two unrelated buildings. A home plot has to enclose
    // house + yard + garage together, with one gate onto the street.

    // ── Interior ───────────────────────────────────────────────────────────
    // Camera-only. Inset 0.06 from the shell so surfaces never z-fight.
    if (opts.interior !== false) {
      var iw = w - 0.3, idp = d - 0.3;
      var iy0 = 0.22;
      g.add(box(iw, 0.1, idp, M.floorIn, 0, iy0, 0));
      // Interior wall linings
      g.add(box(iw, hMain - 0.3, 0.06, M.wallWarm, 0, iy0 + (hMain - 0.3) / 2, -idp / 2));
      g.add(box(iw, hMain - 0.3, 0.06, M.wallWarm, 0, iy0 + (hMain - 0.3) / 2, idp / 2));
      g.add(box(0.06, hMain - 0.3, idp, M.wallWarm, -iw / 2, iy0 + (hMain - 0.3) / 2, 0));
      g.add(box(0.06, hMain - 0.3, idp, M.wallWarm, iw / 2, iy0 + (hMain - 0.3) / 2, 0));
      // Ceiling + warm interior light
      g.add(box(iw, 0.08, idp, M.wallTrim, 0, hMain - 0.2, 0));
      var il = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), M.bulb);
      il.position.set(0, hMain - 0.5, 0);
      g.add(il);

      // Rug + seating
      g.add(box(3.4, 0.04, 2.4, M.rug, -w * 0.16, iy0 + 0.07, d * 0.14));
      g.add(box(2.4, 0.55, 0.9, M.sofa, -w * 0.16, iy0 + 0.32, d * 0.14 - 1.0));
      g.add(box(2.4, 0.75, 0.28, M.sofa, -w * 0.16, iy0 + 0.42, d * 0.14 - 1.35));
      [-1, 1].forEach(function (s) {
        g.add(box(0.28, 0.5, 0.9, M.sofa, -w * 0.16 + s * 1.1, iy0 + 0.3, d * 0.14 - 1.0));
        g.add(box(0.55, 0.14, 0.55, M.sofaCush, -w * 0.16 + s * 0.65, iy0 + 0.42, d * 0.14 - 1.15));
      });
      // TV unit on the far wall
      g.add(box(0.5, 0.55, 2.0, M.woodDark, -w * 0.16 + 2.2, iy0 + 0.33, d * 0.14));
      g.add(box(0.12, 0.95, 1.7, M.tv, -w * 0.16 + 2.35, iy0 + 0.95, d * 0.14));
      g.add(box(0.06, 0.8, 1.55, M.tvScreen, -w * 0.16 + 2.42, iy0 + 0.95, d * 0.14));

      // Dining table + chairs
      var tX2 = w * 0.2, tZ2 = -d * 0.16;
      g.add(box(1.9, 0.1, 1.1, M.woodLight, tX2, iy0 + 0.78, tZ2));
      [-1, 1].forEach(function (s) {
        [-1, 1].forEach(function (s2) {
          g.add(cyl(0.05, 0.05, 0.76, 6, M.woodDark,
            tX2 + s2 * 0.8, iy0 + 0.38, tZ2 + s * 0.45));
        });
        g.add(box(0.5, 0.08, 0.5, M.woodLight, tX2, iy0 + 0.46, tZ2 + s * 0.85));
        g.add(box(0.5, 0.6, 0.08, M.woodLight, tX2, iy0 + 0.74, tZ2 + s * 1.08));
        [-1, 1].forEach(function (s2) {
          [-1, 1].forEach(function (s3) {
            g.add(cyl(0.04, 0.04, 0.44, 5, M.woodDark,
              tX2 + s2 * 0.18, iy0 + 0.22, tZ2 + s * 0.85 + s3 * 0.18));
          });
        });
      });

      // Kitchen counter along the back wall + fridge + shelves
      g.add(box(0.7, 0.9, 3.4, M.counter, w * 0.3, iy0 + 0.45, -d * 0.05));
      g.add(box(0.78, 0.08, 3.5, M.steel, w * 0.3, iy0 + 0.92, -d * 0.05));
      g.add(box(0.62, 1.9, 0.85, M.fridge, w * 0.3 - 0.2, iy0 + 0.95, d * 0.28));
      g.add(box(0.66, 0.05, 0.9, M.steel, w * 0.3 - 0.2, iy0 + 1.25, d * 0.28));
      [1.5, 2.1].forEach(function (sy, si) {
        g.add(box(0.4, 0.06, 1.6, M.woodLight, w * 0.3 - 0.1, iy0 + 1.5 + si * 0.6, -d * 0.05));
        for (var sI = 0; sI < 4; sI++) {
          g.add(cyl(0.07, 0.06, 0.2, 7, sI % 2 ? M.plantPot : M.steel,
            w * 0.3 - 0.1, iy0 + 1.63 + si * 0.6, -d * 0.05 - 0.6 + sI * 0.4));
        }
      });

      // Staircase to the first floor (visual anchor for the balcony shot)
      var stX = -w * 0.34;
      for (var stI = 0; stI < 9; stI++) {
        g.add(box(1.1, 0.09, 0.32, M.woodLight, stX, iy0 + 0.2 + stI * 0.3, -d * 0.3 + stI * 0.3));
      }
      g.add(box(0.1, 1.0, 3.2, M.woodDark, stX + 0.6, iy0 + 1.5, -d * 0.3 + 1.2));

      // Curtains at the front window
      [-1, 1].forEach(function (s) {
        g.add(box(0.05, 1.6, 0.5, M.wallTrim, w / 2 - 0.1, 1.9, s * (w * 0.3) + s * 0.9));
      });
    }

    g.userData.balcony = balcony;
    g.userData.frontX = frontX;
    return g;
  }

  // ── Compound wall (world space) ───────────────────────────────────────────
  /**
   * Enclose a home plot — house, yard and garage together — behind a low
   * boundary wall with a single gate onto the street.
   *
   * Built in world space on purpose. Sizing it off the house's local front put
   * the wall across the middle of the yard and left the garage stranded OUTSIDE
   * it, so the homestead read as two unrelated buildings rather than one home.
   *
   * @param rect {x1,x2,z1,z2} plot bounds in world space
   * @param gateSide 'x1'|'x2'|'z1'|'z2' which edge carries the gate
   * @param gateAt   position along that edge
   */
  function buildCompound(rect, gateSide, gateAt, M) {
    M = M || mats();
    var g = new THREE.Group();
    g.name = 'compound';
    var H = 1.55, T = 0.22, gateW = 3.2;

    /**
     * Lay one straight run of wall.
     *
     * `dir` is the axis the wall RUNS along, and the segment spans that axis —
     * which is the opposite of how a box's dimensions read, so the two cases are
     * written out rather than derived. (An earlier version conflated the two
     * and produced a compound sitting ~45m away from its house, which is why
     * this is now spelled out.)
     *
     * @param dir   'x' → wall runs along X, sits at a fixed Z
     *              'z' → wall runs along Z, sits at a fixed X
     * @param fixed the constant coordinate
     * @param from,to span along the running axis
     */
    function run(dir, fixed, from, to) {
      var len = to - from;
      if (len <= 0.2) { return; }
      var mid = (from + to) / 2;
      g.add(dir === 'x'
        ? sbox(len, H, T, M.compound, mid, H / 2, fixed)
        : sbox(T, H, len, M.compound, fixed, H / 2, mid));
      // Coping course so the wall reads as masonry, not a slab.
      g.add(dir === 'x'
        ? sbox(len, 0.1, T + 0.12, M.slab, mid, H + 0.05, fixed)
        : sbox(T + 0.12, 0.1, len, M.slab, fixed, H + 0.05, mid));
    }

    /** A post at (along, across) for the given edge orientation. */
    function post(dir, along, across) {
      var pos = dir === 'x' ? [along, 1.25, across] : [across, 1.25, along];
      g.add(sbox(0.44, 2.5, 0.44, M.gate, pos[0], pos[1], pos[2]));
      var cap = dir === 'x' ? [along, 2.55, across] : [across, 2.55, along];
      g.add(sbox(0.58, 0.16, 0.58, M.slab, cap[0], cap[1], cap[2]));
    }

    var side = gateSide || 'x2';
    // Each edge: `dir` is what it runs along; for 'x' edges `gateAt` is a Z,
    // for 'z' edges it is an X.
    [
      { dir: 'x', fixed: rect.z1, from: rect.x1, to: rect.x2, id: 'z1' },
      { dir: 'x', fixed: rect.z2, from: rect.x1, to: rect.x2, id: 'z2' },
      { dir: 'z', fixed: rect.x1, from: rect.z1, to: rect.z2, id: 'x1' },
      { dir: 'z', fixed: rect.x2, from: rect.z1, to: rect.z2, id: 'x2' }
    ].forEach(function (e) {
      if (e.id !== side) { run(e.dir, e.fixed, e.from, e.to); return; }
      var gateA = gateAt - gateW / 2, gateB = gateAt + gateW / 2;
      run(e.dir, e.fixed, e.from, gateA);
      run(e.dir, e.fixed, gateB, e.to);

      post(e.dir, gateA, e.fixed);
      post(e.dir, gateB, e.fixed);

      // Two gate leaves, each with rails and balusters.
      [[gateA + 0.22, gateAt - 0.08], [gateAt + 0.08, gateB - 0.22]].forEach(function (leaf) {
        var a = leaf[0], b2 = leaf[1];
        var mid = (a + b2) / 2, wid = Math.abs(b2 - a);
        if (wid < 0.2) { return; }
        [0.35, 1.55].forEach(function (yy) {
          g.add(e.dir === 'x'
            ? sbox(wid, 0.09, 0.09, M.gate, mid, yy, e.fixed)
            : sbox(0.09, 0.09, wid, M.gate, e.fixed, yy, mid));
        });
        for (var bi = 0; bi < 4; bi++) {
          var p = a + (b2 - a) * ((bi + 0.5) / 4);
          g.add(e.dir === 'x'
            ? sbox(0.07, 1.5, 0.07, M.gate, p, 0.95, e.fixed)
            : sbox(0.07, 1.5, 0.07, M.gate, e.fixed, 0.95, p));
        }
      });
    });
    return g;
  }

  // ── Low-Poly Detailed City Elements (Images 1, 2, 3) ───────────────────────

  /** Faceted low-poly tree matching reference images (Image 1 & 2) */
  function buildFacetedTree(M, scale) {
    M = M || mats();
    var sc = scale || 1.0;
    var g = new THREE.Group();
    // Faceted brown trunk
    var trunk = new THREE.Mesh(geo().cyl, M.trunk);
    trunk.scale.set(0.24 * sc, 1.8 * sc, 0.24 * sc);
    trunk.position.y = 0.9 * sc;
    g.add(trunk);

    // Multilayer faceted canopies (dodecahedron geometry)
    var c1 = new THREE.Mesh(geo().octa, M.leafFaceted1);
    c1.scale.set(1.4 * sc, 1.5 * sc, 1.4 * sc);
    c1.position.y = 2.4 * sc;
    c1.rotation.set(0.3, 0.6, 0.2);
    g.add(c1);

    var c2 = new THREE.Mesh(geo().dodecSmall, M.leafFaceted2);
    c2.scale.set(1.1 * sc, 1.2 * sc, 1.1 * sc);
    c2.position.set(0.2 * sc, 3.2 * sc, -0.1 * sc);
    c2.rotation.set(-0.4, 0.2, 0.5);
    g.add(c2);

    return g;
  }

  /** Iconic rooftop timber/steel water tower with conical cap (Image 2) */
  function buildRooftopWaterTower(M, scale) {
    M = M || mats();
    var sc = scale || 1.0;
    var g = new THREE.Group();
    var H = 2.4 * sc;
    // 4 legs
    [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]].forEach(function(pos) {
      var leg = sbox(0.12 * sc, H, 0.12 * sc, M.woodDark, pos[0] * sc, H / 2, pos[1] * sc);
      leg.rotation.z = (pos[0] > 0 ? -0.06 : 0.06);
      g.add(leg);
    });
    // Platform slab
    g.add(sbox(1.5 * sc, 0.14 * sc, 1.5 * sc, M.slab, 0, H + 0.07 * sc, 0));
    // Water tank barrel
    var barrel = new THREE.Mesh(geo().cyl, M.waterTankWood);
    barrel.scale.set(0.65 * sc, 1.5 * sc, 0.65 * sc);
    barrel.position.y = H + 0.85 * sc;
    g.add(barrel);
    // Metal banding around barrel
    [-0.4, 0, 0.4].forEach(function(by) {
      var band = new THREE.Mesh(geo().cyl, M.steel);
      band.scale.set(0.67 * sc, 0.06 * sc, 0.67 * sc);
      band.position.y = H + 0.85 * sc + by * sc;
      g.add(band);
    });
    // Conical roof cap
    var cap = new THREE.Mesh(geo().cone, M.roofRed);
    cap.scale.set(0.72 * sc, 0.6 * sc, 0.72 * sc);
    cap.position.y = H + 1.85 * sc;
    g.add(cap);
    return g;
  }

  /** Rooftop Air Conditioner Condenser with cooling fan grill (Image 1, 2) */
  function buildRooftopAC(M) {
    M = M || mats();
    var g = new THREE.Group();
    g.add(sbox(1.1, 0.8, 0.7, M.steel, 0, 0.4, 0));
    // Fan circle plane
    var fan = new THREE.Mesh(geo().cyl, M.glassDark);
    fan.scale.set(0.32, 0.04, 0.32);
    fan.position.set(0, 0.42, 0.36);
    fan.rotation.x = Math.PI / 2;
    g.add(fan);
    // Support feet
    g.add(sbox(1.0, 0.1, 0.14, M.pipe, 0, 0.05, 0.25));
    g.add(sbox(1.0, 0.1, 0.14, M.pipe, 0, 0.05, -0.25));
    return g;
  }

  /** Rooftop Solar Panel Rack (Image 1 & 2) */
  function buildSolarRack(M, count) {
    M = M || mats();
    var g = new THREE.Group();
    var n = count || 4;
    for (var i = 0; i < n; i++) {
      var panel = new THREE.Mesh(geo().box, M.solarBlue);
      panel.scale.set(1.4, 0.08, 0.9);
      panel.position.set(i * 1.5 - (n * 1.5) / 2 + 0.75, 0.55, 0);
      panel.rotation.x = -0.45; // Tilted toward sun
      g.add(panel);
      // Legs
      g.add(sbox(0.08, 0.7, 0.08, M.solarFrame, i * 1.5 - (n * 1.5) / 2 + 0.2, 0.35, -0.3));
      g.add(sbox(0.08, 0.3, 0.08, M.solarFrame, i * 1.5 - (n * 1.5) / 2 + 0.2, 0.15, 0.3));
    }
    return g;
  }

  /** Rooftop Helipad with "H" (Image 1 & 3) */
  function buildHelipad(M, radius) {
    M = M || mats();
    var r = radius || 4.5;
    var g = new THREE.Group();
    var pad = new THREE.Mesh(geo().plane, M.helipadMat);
    pad.scale.set(r * 2, r * 2, 1);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.08;
    g.add(pad);
    // Perimeter safety beacon lights
    for (var a = 0; a < 8; a++) {
      var ang = (a / 8) * Math.PI * 2;
      var bx = Math.cos(ang) * (r + 0.2);
      var bz = Math.sin(ang) * (r + 0.2);
      var light = sbox(0.2, 0.25, 0.2, M.flowerB, bx, 0.15, bz);
      g.add(light);
    }
    return g;
  }

  /** Exterior Zigzag Fire Escape on building side wall (Image 2) */
  function buildFireEscape(M, floors, sideX, isFaceZ) {
    M = M || mats();
    var g = new THREE.Group();
    var fH = 3.4;
    for (var f = 1; f < floors; f++) {
      var y = 2.2 + (f - 1) * fH;
      // Landing platform
      var plat = sbox(1.8, 0.1, 1.2, M.steel, sideX, y, 0);
      g.add(plat);
      // Railings
      g.add(sbox(1.8, 0.8, 0.06, M.rail, sideX, y + 0.45, 0.58));
      g.add(sbox(1.8, 0.8, 0.06, M.rail, sideX, y + 0.45, -0.58));
      // Slanted stair stringer to floor below
      if (f > 1) {
        var stair = sbox(0.4, 0.08, 2.4, M.steel, sideX, y - fH / 2, (f % 2 === 0 ? 0.3 : -0.3));
        stair.rotation.x = (f % 2 === 0 ? 0.85 : -0.85);
        g.add(stair);
      }
    }
    return g;
  }

  /** Complete Basketball Sports Park (Image 1) */
  function buildBasketballCourt(M, w, d) {
    M = M || mats();
    var g = new THREE.Group();
    g.name = 'basketball-court-complex';
    var courtW = w || 28, courtD = d || 18;

    // Concrete perimeter apron
    var apron = sbox(courtW + 4, 0.25, courtD + 4, M.slab, 0, 0.1, 0);
    g.add(apron);

    // Hardcourt playing surface with white markings (from courtTex)
    var court = new THREE.Mesh(geo().plane, M.courtMat);
    court.scale.set(courtW, courtD, 1);
    court.rotation.x = -Math.PI / 2;
    court.position.y = 0.24;
    g.add(court);

    // Perimeter chainlink fence
    var fH = 3.6;
    [
      { w: courtW + 3.8, d: 0.1, x: 0, z: (courtD + 3.8) / 2 },
      { w: courtW + 3.8, d: 0.1, x: 0, z: -(courtD + 3.8) / 2 },
      { w: 0.1, d: courtD + 3.8, x: (courtW + 3.8) / 2, z: 0 },
      { w: 0.1, d: courtD + 3.8, x: -(courtW + 3.8) / 2, z: 0 }
    ].forEach(function(wall) {
      var wire = sbox(wall.w, fH, wall.d, M.fenceWire, wall.x, fH / 2 + 0.2, wall.z);
      g.add(wire);
      var topRail = sbox(wall.w, 0.08, wall.d, M.pipe, wall.x, fH + 0.2, wall.z);
      g.add(topRail);
    });

    // 2 Basketball Hoops at opposing ends
    [-1, 1].forEach(function(s) {
      var hx = s * (courtW / 2 - 1.2);
      // Gooseneck pole
      var pole = new THREE.Mesh(geo().cyl, M.pipe);
      pole.scale.set(0.12, 4.4, 0.12);
      pole.position.set(hx, 2.2, 0);
      g.add(pole);
      var arm = sbox(1.2, 0.1, 0.1, M.pipe, hx - s * 0.5, 4.2, 0);
      g.add(arm);
      // White backboard
      var board = sbox(0.08, 1.1, 1.6, M.wallTrim, hx - s * 1.0, 4.2, 0);
      g.add(board);
      // Orange rim
      var rim = sbox(0.48, 0.05, 0.48, M.plantPot, hx - s * 1.3, 3.8, 0);
      g.add(rim);
    });

    // 3-Tier Spectator Bleachers along North Sideline
    for (var b = 0; b < 3; b++) {
      var seat = sbox(12, 0.35, 0.65, M.woodDark, 0, 0.35 + b * 0.4, (courtD / 2) + 0.8 + b * 0.6);
      g.add(seat);
    }

    // Corner low-poly trees
    [[-courtW/2 - 1, -courtD/2 - 1], [courtW/2 + 1, -courtD/2 - 1], [-courtW/2 - 1, courtD/2 + 1], [courtW/2 + 1, courtD/2 + 1]].forEach(function(tp) {
      var t = buildFacetedTree(M, 1.1);
      t.position.set(tp[0], 0, tp[1]);
      g.add(t);
    });

    return g;
  }

  /** Organized Parking Lot with Painted Stalls and Low-Poly Cars (Image 1 & 2) */
  function buildParkingLot(M, w, d, numCars) {
    M = M || mats();
    var g = new THREE.Group();
    g.name = 'parking-lot-complex';
    var lotW = w || 26, lotD = d || 18;

    // Dark asphalt lot pad
    var pad = sbox(lotW, 0.18, lotD, M.asphaltDark, 0, 0.09, 0);
    g.add(pad);
    // Concrete curb border
    [
      { w: lotW + 0.4, d: 0.3, x: 0, z: lotD / 2 },
      { w: lotW + 0.4, d: 0.3, x: 0, z: -lotD / 2 },
      { w: 0.3, d: lotD, x: lotW / 2, z: 0 },
      { w: 0.3, d: lotD, x: -lotW / 2, z: 0 }
    ].forEach(function(curb) {
      g.add(sbox(curb.w, 0.28, curb.d, M.curbConcrete, curb.x, 0.14, curb.z));
    });

    // Painted parking stalls & parked vehicles
    var stallW = 3.0, stallD = 5.2;
    var slots = Math.min(10, Math.floor((lotW - 4) / stallW));
    var carCols = [0xffcc00, 0xef4444, 0x3b82f6, 0x10b981, 0xf97316, 0x64748b, 0x111827, 0xf8fafc];
    for (var i = 0; i < slots; i++) {
      var sx = -((slots - 1) * stallW) / 2 + i * stallW;
      // White divider lines
      g.add(sbox(0.12, 0.02, stallD, M.paintWhiteLine, sx + stallW / 2, 0.20, -lotD / 4));
      g.add(sbox(0.12, 0.02, stallD, M.paintWhiteLine, sx + stallW / 2, 0.20, lotD / 4));
      // Parked car in every other slot
      if (i % 2 === 0 || i === slots - 1) {
        var carCol = carCols[i % carCols.length];
        var carType = (i % 4 === 0) ? 'taxi' : (i % 3 === 0 ? 'suv' : 'car');
        var bv = (typeof window._buildVehicle === 'function') ? window._buildVehicle : null;
        var carMesh = bv ? bv(carType, carCol, { exact: true, tintAll: true }) : null;
        if (carMesh) {
          carMesh.position.set(sx, 0.12, (i % 2 === 0 ? -lotD / 4 : lotD / 4));
          carMesh.rotation.y = (i % 2 === 0 ? 0 : Math.PI);
          carMesh.userData.isCast = true;
          g.add(carMesh);
        }
      }
    }

    // Streetlamp in lot island
    var lamp = new THREE.Mesh(geo().cyl, M.pipe);
    lamp.scale.set(0.1, 5.0, 0.1);
    lamp.position.set(0, 2.5, 0);
    g.add(lamp);
    var head = sbox(0.6, 0.2, 0.6, M.bulb, 0, 5.0, 0);
    g.add(head);

    return g;
  }

  // ── Cutscene Character Actors ──────────────────────────────────────────────

  /**
   * Mount a high-detail Mumbai Traffic Police motorcycle patrol officer on Vikram's bike.
   * Features a tactical full-face wet-weather helmet with polarized reflective visor,
   * high-visibility fluorescent neon-lime rain vest with 3M retroreflective bands,
   * shoulder-mounted wireless transceiver with coiled cable, and tactical riding gloves.
   */
  function buildCutsceneRider(opts) {
    opts = opts || {};
    var bh = (typeof window._buildHuman === 'function') ? window._buildHuman : null;
    if (!bh) { return null; }
    var rider = bh(false, {
      variant: 'guard',
      outfit: 'police',
      shirt: 0xd7b987, // Khaki base uniform
      pants: 0xb59765,
      hairStyle: 'buzz',
      facialHair: 'mustache'
    });
    if (!rider) { return null; }

    rider.name = 'mounted-rider';
    rider.scale.setScalar(0.92);

    var ud = rider.userData || {};

    // 1. TACTICAL POLICE HELMET: Enclose headGroup in a sleek, polished motorcycle helmet
    if (ud.headGroup) {
      // Suppress stylized procedural cartoon face parts
      ud.headGroup.traverse(function (c) {
        if (c.isMesh) { c.visible = false; }
      });

      var helmet = new THREE.Group();
      helmet.name = 'police-tactical-helmet';

      // Aerodynamic outer shell (midnight black high-gloss finish)
      var shellMat = new THREE.MeshStandardMaterial({
        color: 0x090d16, roughness: 0.12, metalness: 0.38
      });
      var shell = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 20), shellMat);
      shell.scale.set(1.0, 1.14, 1.18);
      helmet.add(shell);

      // Polarized iridium-tinted curved visor (reflective deep cyan mirror)
      var visorMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, roughness: 0.04, metalness: 0.92,
        emissive: 0x011b2b, emissiveIntensity: 0.35
      });
      var visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.305, 0.305, 0.22, 22, 1, false, -Math.PI * 0.44, Math.PI * 0.88),
        visorMat
      );
      visor.rotation.y = Math.PI / 2;
      visor.position.set(0, 0.01, 0.04);
      helmet.add(visor);

      // Matte dark brow bezel / visor seal
      var browBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.50, 0.05, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
      );
      browBezel.position.set(0, 0.14, 0.24);
      helmet.add(browBezel);

      // Golden Mumbai Police Crest Badge on forehead
      var crest = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.10, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 })
      );
      crest.position.set(0, 0.22, 0.30);
      crest.rotation.x = -0.22;
      helmet.add(crest);

      // Retroreflective 3M silver safety chevrons along helmet temples
      var stripeMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc, roughness: 0.15, metalness: 0.4,
        emissive: 0x475569, emissiveIntensity: 0.4
      });
      [-1, 1].forEach(function (side) {
        var sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.36), stripeMat);
        sideStripe.position.set(side * 0.32, 0.08, -0.04);
        sideStripe.rotation.z = side * 0.15;
        helmet.add(sideStripe);

        // Circular visor pivot hinge caps
        var hinge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
        );
        hinge.rotation.z = Math.PI / 2;
        hinge.position.set(side * 0.33, 0.02, 0.06);
        helmet.add(hinge);
      });

      // Chin guard with ventilation intake slits
      var chin = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.15, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      chin.position.set(0, -0.16, 0.20);
      helmet.add(chin);

      // Wireless tactical headset clip on left ear
      var comClip = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 })
      );
      comClip.position.set(-0.33, -0.04, 0);
      helmet.add(comClip);
      var antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8),
        new THREE.MeshBasicMaterial({ color: 0x09090b })
      );
      antenna.position.set(-0.34, 0.07, -0.02);
      antenna.rotation.z = 0.15;
      helmet.add(antenna);

      ud.headGroup.add(helmet);
      ud.headGroup.rotation.set(0.06, 0.38, 0); // Vigilant gaze turned toward adjacent Fortuner
    }

    // 2. HIGH-VISIBILITY MUMBAI TRAFFIC POLICE RAIN VEST & TACTICAL HARNESS
    if (ud.torsoGroup) {
      ud.torsoGroup.rotation.x = 0.16; // Leaning into handlebars

      var vest = new THREE.Group();
      vest.name = 'police-highvis-vest';

      // Fluorescent Neon-Lime / Chartreuse Safety Vest
      var neonMat = new THREE.MeshStandardMaterial({
        color: 0x84cc16, roughness: 0.32, metalness: 0.08
      });
      var vestBody = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.70, 0.44), neonMat);
      vestBody.position.set(0, 0, 0);
      vest.add(vestBody);

      // Retroreflective 3M Silver Bands (Chest & Waist)
      var refMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc, roughness: 0.1, metalness: 0.55,
        emissive: 0x64748b, emissiveIntensity: 0.35
      });
      var chestBand = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.085, 0.46), refMat);
      chestBand.position.set(0, 0.08, 0);
      vest.add(chestBand);

      var waistBand = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.075, 0.46), refMat);
      waistBand.position.set(0, -0.18, 0);
      vest.add(waistBand);

      // Shoulder Suspender Reflective Bands
      [-0.18, 0.18].forEach(function (sx) {
        var susp = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.72, 0.46), refMat);
        susp.position.set(sx, 0.01, 0);
        vest.add(susp);
      });

      // Mumbai Police Shield Plate on Left Chest
      var badgePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.09, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.4, roughness: 0.4 })
      );
      badgePlate.position.set(-0.19, 0.15, 0.23);
      vest.add(badgePlate);

      var goldStar = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
      );
      goldStar.position.set(-0.19, 0.15, 0.25);
      vest.add(goldStar);

      // Shoulder-Mounted Police Wireless Microphone (Lapel Mic)
      var micUnit = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.10, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 })
      );
      micUnit.position.set(-0.25, 0.34, 0.12);
      vest.add(micUnit);

      // Coiled Cord to Duty Belt
      var cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8),
        new THREE.MeshBasicMaterial({ color: 0x18181b })
      );
      cord.position.set(-0.25, 0.12, 0.14);
      cord.rotation.z = -0.15;
      vest.add(cord);

      ud.torsoGroup.add(vest);
    }

    // 3. TACTICAL RIDING GLOVES & MOTORCYCLE SADDLE POSE
    if (ud.lLeg && ud.rLeg) {
      ud.lLeg.rotation.set(-0.46, 0, -0.32);
      ud.rLeg.rotation.set(-0.46, 0, 0.32);
    }
    if (ud.lArm && ud.rArm) {
      ud.lArm.rotation.set(-0.76, 0.24, 0);
      ud.rArm.rotation.set(-0.76, -0.24, 0);

      var gloveMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
      var lGlove = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), gloveMat);
      lGlove.position.set(0, -0.62, 0);
      ud.lArm.add(lGlove);

      var rGlove = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), gloveMat);
      rGlove.position.set(0, -0.62, 0);
      ud.rArm.add(rGlove);
    }

    return rider;
  }

  /**
   * High-detail VIP Fortuner SUV interior cockpit, illuminated instrument cluster,
   * steering wheel, and sinister driver silhouette with rolled-up window, gold luxury
   * watch, and forward projector LED headlights.
   */
  function buildCutsceneDriver(opts) {
    opts = opts || {};
    var g = new THREE.Group();
    g.name = 'fortuner-driver-bust';

    // ── 1. COCKPIT INTERIOR & ILLUMINATED INSTRUMENT CLUSTER ──────────────────
    var cockpit = new THREE.Group();
    cockpit.name = 'vip-cockpit';

    // Dashboard cowl
    var dashMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
    var dash = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.26, 0.60), dashMat);
    dash.position.set(-0.45, 0.98, 0.40);
    cockpit.add(dash);

    // Glowing Speedometer Instrument Cluster (Cyan / Electric Blue)
    var speedo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.10),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    speedo.position.set(-0.45, 1.05, 0.42);
    speedo.rotation.x = -0.24;
    cockpit.add(speedo);

    // Center Infotainment / Navigation Screen
    var navScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.20, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    navScreen.position.set(-0.06, 1.02, 0.38);
    navScreen.rotation.x = -0.20;
    navScreen.rotation.y = 0.15;
    cockpit.add(navScreen);

    // Cockpit Ambient Glow Light (illuminates driver silhouette and steering wheel)
    var dashGlow = new THREE.PointLight(0x0284c7, 0.85, 2.6, 1.4);
    dashGlow.position.set(-0.35, 1.06, 0.28);
    cockpit.add(dashGlow);

    // Three-Spoke Leather Steering Wheel
    var wheelTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.024, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
    );
    wheelTorus.rotation.x = -0.42;
    wheelTorus.position.set(-0.45, 1.04, 0.30);
    cockpit.add(wheelTorus);

    var wheelHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
    );
    wheelHub.rotation.x = Math.PI / 2 - 0.42;
    wheelHub.position.set(-0.45, 1.04, 0.30);
    cockpit.add(wheelHub);

    // ── 2. THE ANTAGONIST: VIP DRIVER SILHOUETTE ──────────────────────────────
    var driver = new THREE.Group();
    driver.name = 'vip-driver-figure';

    // Tailored Black Luxury Jacket / Torso
    var suitMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.62, 0.38), suitMat);
    torso.position.set(-0.45, 0.90, 0.05);
    driver.add(torso);

    // Driver Head (proportioned realistically inside cabin, well below roof line)
    var skinMat = new THREE.MeshStandardMaterial({
      color: 0xa87148, roughness: 0.65, metalness: 0.05
    });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 16), skinMat);
    head.scale.set(0.96, 1.16, 1.05);
    head.position.set(-0.45, 1.25, 0.05);
    head.rotation.y = -0.32; // Glancing slightly out the lowered window
    driver.add(head);

    // Styled slicked dark hair
    var hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.142, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 })
    );
    hair.scale.set(0.98, 1.10, 1.06);
    hair.position.set(-0.45, 1.28, 0.03);
    driver.add(hair);

    // Sleek designer dark wire-frame sunglasses
    var glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.1 })
    );
    glasses.position.set(-0.45, 1.27, 0.17);
    driver.add(glasses);

    // Right Arm (resting on steering wheel at 10 o'clock)
    var rArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.42), suitMat);
    rArm.position.set(-0.32, 1.05, 0.22);
    rArm.rotation.set(-0.35, -0.32, 0.2);
    driver.add(rArm);

    // Left Arm resting casually along the driver door window sill
    var lArmUpper = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), suitMat);
    lArmUpper.position.set(-0.68, 1.06, 0.08);
    lArmUpper.rotation.z = -0.25;
    driver.add(lArmUpper);

    // Forearm resting along window sill at x ≈ -0.92, y ≈ 0.96
    var forearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.52), skinMat);
    forearm.position.set(-0.90, 0.96, 0.18);
    forearm.rotation.x = 0.14;
    driver.add(forearm);

    // Rolled-up sleeve cuff
    var sleeveCuff = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), suitMat);
    sleeveCuff.position.set(-0.84, 0.98, 0.04);
    driver.add(sleeveCuff);

    // Luxury Gold Chronograph Watch on the resting wrist
    var watchMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, metalness: 0.95, roughness: 0.18
    });
    var watchCase = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.038, 16), watchMat);
    watchCase.rotation.z = Math.PI / 2;
    watchCase.position.set(-0.90, 0.98, 0.24);
    driver.add(watchCase);

    var watchDial = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 16),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.5 })
    );
    watchDial.rotation.y = -Math.PI / 2;
    watchDial.position.set(-0.922, 0.98, 0.24);
    driver.add(watchDial);

    // Gold signet ring on pinky finger
    var goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.006, 8, 16), watchMat);
    goldRing.position.set(-0.90, 0.94, 0.38);
    driver.add(goldRing);

    // Subtle cigarette with glowing amber ash tip
    var cig = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8),
      new THREE.MeshBasicMaterial({ color: 0xf1f5f9 })
    );
    cig.rotation.x = Math.PI / 2;
    cig.position.set(-0.89, 0.95, 0.44);
    driver.add(cig);

    var cigEmber = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3b00 })
    );
    cigEmber.position.set(-0.89, 0.95, 0.49);
    driver.add(cigEmber);

    g.add(cockpit);
    g.add(driver);

    // ── 3. FORTUNER EXTERIOR PROJECTOR LED HEADLIGHTS & ROAD ILLUMINATION ──────
    var headlights = new THREE.Group();
    headlights.name = 'fortuner-headlights';

    [-0.64, 0.64].forEach(function (hx) {
      // High-intensity white projector LED lens
      var lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(hx, 0.68, 1.68);
      headlights.add(lens);

      // Amber DRL Eyebrow Strip
      var drl = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.03, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      drl.position.set(hx, 0.77, 1.68);
      headlights.add(drl);

      // Forward Projector Spotlight casting light onto the wet road
      var spot = new THREE.SpotLight(0xf8fafc, 3.4, 48, Math.PI / 7, 0.35, 1.1);
      spot.position.set(hx, 0.70, 1.68);
      spot.target.position.set(hx, 0, 32);
      headlights.add(spot);
      headlights.add(spot.target);

      // Volumetric beam cone through the rain mist
      var cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 20, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x93c5fd, transparent: true, opacity: 0.10, depthWrite: false
        })
      );
      cone.rotation.x = -Math.PI / 2;
      cone.position.set(hx, 0.65, 11.6);
      headlights.add(cone);
    });

    // Rear crimson LED taillight strip
    [-0.64, 0.64].forEach(function (tx) {
      var tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.07, 0.03),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      tail.position.set(tx, 0.72, -1.68);
      headlights.add(tail);
    });

    g.add(headlights);
    return g;
  }

  /**
   * Vikram Sawant's fallen body on the asphalt across the white stop line (Shot 6 aftermath).
   * Features tactical helmet, high-vis rain vest, dropped leather route book, whistle,
   * numbered police evidence marker, and dark crimson pool on the white stop line.
   */
  function buildFallenOfficer(opts) {
    opts = opts || {};
    var g = new THREE.Group();
    g.name = 'fallen-officer-aftermath';
    var M = mats();

    // 1. Prone officer body sprawled on wet tarmac
    var body = new THREE.Group();
    body.name = 'officer-body';

    // Khaki uniform torso with high-vis vest
    var torsoMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 });
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.74), torsoMat);
    torso.position.set(0, 0.15, 0);
    body.add(torso);

    // Reflective 3M stripe on fallen vest
    var refStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.08, 0.76),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, emissive: 0x475569 })
    );
    refStripe.position.set(0, 0.20, 0);
    body.add(refStripe);

    // Tactical helmet on asphalt
    var helmetMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, roughness: 0.15, metalness: 0.4
    });
    var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 16), helmetMat);
    helmet.scale.set(1.0, 1.1, 1.15);
    helmet.position.set(0, 0.20, -0.62);
    helmet.rotation.x = 0.25;
    body.add(helmet);

    // Polarized visor reflecting sodium lamps
    var visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.16, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.05 })
    );
    visor.rotation.y = Math.PI / 2;
    visor.position.set(0, 0.20, -0.60);
    body.add(visor);

    // Sprawled legs in khaki duty trousers
    var legMat = new THREE.MeshStandardMaterial({ color: 0xb59765, roughness: 0.7 });
    var lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.85), legMat);
    lLeg.position.set(-0.22, 0.10, 0.72);
    lLeg.rotation.set(-0.1, 0.15, 0.1);
    body.add(lLeg);

    var rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.82), legMat);
    rLeg.position.set(0.24, 0.10, 0.68);
    rLeg.rotation.set(-0.1, -0.22, -0.15);
    body.add(rLeg);

    // Tactical riding boots
    var bootMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
    var lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.28), bootMat);
    lBoot.position.set(-0.25, 0.10, 1.18);
    body.add(lBoot);

    var rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.28), bootMat);
    rBoot.position.set(0.30, 0.10, 1.12);
    body.add(rBoot);

    // Arms sprawled on road
    var armMat = new THREE.MeshStandardMaterial({ color: 0xd7b987, roughness: 0.6 });
    var lArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.62), armMat);
    lArm.position.set(-0.48, 0.09, -0.18);
    lArm.rotation.set(0, 0.55, 0);
    body.add(lArm);

    var rArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.58), armMat);
    rArm.position.set(0.48, 0.09, -0.12);
    rArm.rotation.set(0, -0.45, 0);
    body.add(rArm);

    body.rotation.y = 0.35;
    g.add(body);

    // 2. Tragic dark crimson pool spreading across the white stop line
    var poolMat = new THREE.MeshStandardMaterial({
      color: 0x4a0404, roughness: 0.04, metalness: 0.12,
      transparent: true, opacity: 0.92
    });
    var pool = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0.15, 0.02, -0.10);
    g.add(pool);

    // 3. Dropped Police Route Notebook (open on the asphalt)
    var notebook = new THREE.Group();
    notebook.name = 'vikram-route-notebook';
    var coverMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 });
    var pageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    var leftPage = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.26), pageMat);
    leftPage.rotation.x = -Math.PI / 2;
    leftPage.position.set(-0.09, 0.03, 0);
    notebook.add(leftPage);

    var rightPage = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.26), pageMat);
    rightPage.rotation.x = -Math.PI / 2;
    rightPage.position.set(0.09, 0.03, 0);
    notebook.add(rightPage);

    var spine = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.28), coverMat);
    spine.position.set(0, 0.02, 0);
    notebook.add(spine);

    notebook.position.set(-0.85, 0, -0.35);
    notebook.rotation.y = 0.42;
    g.add(notebook);

    // 4. Dropped Chrome Police Whistle with lanyard
    var whistle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.07, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
    );
    whistle.rotation.z = Math.PI / 2;
    whistle.position.set(-0.65, 0.03, -0.62);
    g.add(whistle);

    return g;
  }

  /**
   * Inspector Arjun Kadam · Traffic Crime Branch.
   * Dressed in dark detective field jacket, police badge lanyard, and khaki trousers.
   */
  function buildCutsceneArjun(opts) {
    opts = opts || {};
    var bh = (typeof window._buildHuman === 'function') ? window._buildHuman : null;
    if (!bh) { return null; }
    var arjun = bh(false, {
      variant: 'normal',
      shirt: 0x1e293b, // Dark charcoal / navy detective field jacket
      pants: 0x92704a, // Police khaki trousers
      hair: 0x09090b,
      hairStyle: 'sidepart'
    });
    if (!arjun) { return null; }

    arjun.name = 'inspector-arjun-kadam';

    // Add Police ID card lanyard around neck
    var ud = arjun.userData || {};
    if (ud.torsoGroup) {
      var lanyardMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 });
      var lanyard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.38), lanyardMat);
      lanyard.position.set(0, 0.05, 0.02);
      lanyard.scale.set(0.9, 0.8, 1.05);

      var badgeHolder = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.14, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
      );
      badgeHolder.position.set(0, -0.14, 0.22);
      ud.torsoGroup.add(badgeHolder);
    }
    return arjun;
  }

  /**
   * Mrs. Iyer · Elderly South Indian witness.
   * Dressed in traditional deep maroon saree with golden border and spectacles.
   */
  function buildCutsceneIyer(opts) {
    opts = opts || {};
    var bh = (typeof window._buildHuman === 'function') ? window._buildHuman : null;
    if (!bh) { return null; }
    var iyer = bh(false, {
      variant: 'elderly',
      shirt: 0x881337, // Maroon silk saree drape
      pants: 0x881337,
      hair: 0xe2e8f0,  // Silver hair
      gender: 'female'
    });
    if (!iyer) { return null; }

    iyer.name = 'mrs-iyer-witness';

    // Add steel tiffin carrier (dabba) in hand
    var dabba = new THREE.Group();
    dabba.name = 'steel-dabba';
    var dabbaMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, metalness: 0.85, roughness: 0.2
    });
    for (var tier = 0; tier < 3; tier++) {
      var cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.08, 16), dabbaMat);
      cyl.position.y = tier * 0.09;
      dabba.add(cyl);
    }
    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.015, 8, 16), dabbaMat);
    handle.position.y = 0.30;
    dabba.add(handle);

    dabba.position.set(0.35, 0.40, 0.15);
    iyer.add(dabba);

    return iyer;
  }

  window._buildCutsceneRider = buildCutsceneRider;
  window._buildCutsceneDriver = buildCutsceneDriver;
  window._buildFallenOfficer = buildFallenOfficer;
  window._buildCutsceneArjun = buildCutsceneArjun;
  window._buildCutsceneIyer = buildCutsceneIyer;
  window._buildFacetedTree = buildFacetedTree;
  window._buildBasketballCourt = buildBasketballCourt;
  window._buildParkingLot = buildParkingLot;
  window._buildParkingLot = buildParkingLot;

  // ── Block filler ──────────────────────────────────────────────────────────
  function roadBounds(roads) {
    var b = { x1: -1e9, x2: 1e9, z1: -1e9, z2: 1e9 };
    (roads || []).forEach(function (r) {
      if (r.type === 'v') { b.x1 = Math.min(b.x1, r.x); b.x2 = Math.max(b.x2, r.x); }
      if (r.type === 'h') { b.z1 = Math.min(b.z1, r.z); b.z2 = Math.max(b.z2, r.z); }
    });
    return b;
  }

  function distToRoadXZ(x, z, roads) {
    var best = Infinity;
    (roads || []).forEach(function (r) {
      if (r.type === 'v') {
        var z1 = Math.min(r.z1, r.z2), z2 = Math.max(r.z1, r.z2);
        if (z < z1 || z > z2) { return; }
        best = Math.min(best, Math.abs(x - r.x));
      } else if (r.type === 'h') {
        var x1 = Math.min(r.x1, r.x2), x2 = Math.max(r.x1, r.x2);
        if (x < x1 || x > x2) { return; }
        best = Math.min(best, Math.abs(z - r.z));
      }
    });
    return best;
  }

  function plotBoxes(plots, extraMargin) {
    var out = [];
    // `extraMargin` inflates every authored plot as well as the filler slots.
    // Authored plots are the level's own set-dressing and are placed by hand; the
    // camera keep-out must still apply to them, because a shot that clears the
    // filler can still be aimed straight through the level's own building.
    var m = extraMargin || 0;
    (plots || []).forEach(function (p) {
      if (!p || typeof p.x !== 'number') { return; }
      var w = p.w || 12, d = p.d || 10;
      var q = Math.abs(((p.rotY || 0) % Math.PI));
      var swap = Math.abs(q - Math.PI / 2) < 0.1;
      out.push({
        x: p.x, z: p.z,
        hw: (swap ? d : w) / 2 + m, hd: (swap ? w : d) / 2 + m
      });
    });
    return out;
  }

  function inAnyBox(x, z, boxes, margin) {
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (Math.abs(x - b.x) < b.hw + margin && Math.abs(z - b.z) < b.hd + margin) { return true; }
    }
    return false;
  }

  /**
   * Fill the empty blocks between declared roads.
   *
   * Rejection rules, in order of importance:
   *   - must clear every road by (halfWidth + verge). Roads are the only thing
   *     the player drives on; a building on a lane is an instant fail.
   *   - must clear every authored plot.
   *   - must clear the spawns and the level route, so nothing blocks the run.
   *   - must stay inside the road bounding box, which is what keeps filler out
   *     of the empty void beyond the authored map.
   */
  function fillBlocks(cfg, opts) {
    opts = opts || {};
    var roads = cfg.roads || [];
    if (!roads.length) { return null; }
    var grp = new THREE.Group();
    grp.name = 'block-fill';

    var density = (cfg.fillDensity === undefined) ? 1 : cfg.fillDensity;
    if (density <= 0) { return grp; }

    var b = roadBounds(roads);
    var keepOut = plotBoxes(cfg.plots);
    // Never build on the route or the spawn pads.
    (cfg.route || []).forEach(function (p) {
      if (p && typeof p.x === 'number') { keepOut.push({ x: p.x, z: p.z, hw: 4.5, hd: 4.5 }); }
    });
    [cfg.garageSpawn, cfg.playerSpawn, cfg.playerStart].forEach(function (s) {
      if (s && typeof s.x === 'number') { keepOut.push({ x: s.x, z: s.z, hw: 6, hd: 6 }); }
    });
    (cfg.anchorNodes || []).forEach(function (n) {
      if (n && typeof n.x === 'number') { keepOut.push({ x: n.x, z: n.z, hw: 7, hd: 7 }); }
    });
    // Camera discs for the level's shot script, so no terrace lands in the lens.
    (opts.camKeepOut || []).forEach(function (c) { keepOut.push(c); });

    // Footpath. A 3m gap between kerb and wall reads as a car-park aisle, not a
    // street: there is nowhere for a pedestrian to walk and the buildings loom
    // over the carriageway. 6.5m gives a real footpath, opens the shots up, and
    // widens sight lines at the junction.
    var FOOT = 3.0;
    var verge = (opts.verge || 0) + FOOT;

    var M = opts.mats || mats();
    var palette = [0xf5e6d3, 0xe8d5b7, 0xd4b896, 0xe8b4a0, 0xd4907a, 0xc47c6a,
      0xb8c8d8, 0x9ab0c0, 0xa8c8a8, 0xf0d878, 0xc9a87a];
    var roofCols = [0x8B4513, 0x2d5016, 0x1a3a5c, 0x6b3a2a, 0xd97706, 0x059669];

    var wallMats = palette.map(function (c) { return new THREE.MeshLambertMaterial({ color: c }); });
    var roofMats = roofCols.map(function (c) { return new THREE.MeshLambertMaterial({ color: c }); });
    var fGlass = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    var fLit = new THREE.MeshBasicMaterial({ color: 0xfde68a });
    var fSlab = new THREE.MeshLambertMaterial({ color: 0x475569 });
    var fTank = new THREE.MeshLambertMaterial({ color: 0x1f4f8a });
    var fShop = new THREE.MeshLambertMaterial({ color: 0x9a3412 });
    var awningMats = [M.awningRed, M.awningBlue, M.awningGreen, M.awningOrange];

    var MAX_FILL = 450;
    var placed = 0;

    /** Emit one filler building. `face` is the outward direction (0=+Z,1=-Z,2=+X,3=-X). */
    function emit(cx, cz, w, d, hgt, face, salt) {
      if (placed >= MAX_FILL) { return false; }
      if (inAnyBox(cx, cz, keepOut, 0.5)) { return false; }
      var g = new THREE.Group();
      g.add(sbox(w, hgt, d, pick(wallMats, hash2(Math.round(cx), Math.round(cz), 17 + salt)), 0, hgt / 2, 0));

      // Ground-floor shopfront on the street face
      var fz = d / 2 + 0.06, fx = w / 2 + 0.06;
      var facadeWidth = (face < 2) ? w : d;
      var shop = new THREE.Mesh(geo().plane, fShop);
      shop.scale.set(Math.min(facadeWidth * 0.7, 7), 2.1, 1);
      if (face === 0) { shop.position.set(0, 1.5, fz); }
      else if (face === 1) { shop.position.set(0, 1.5, -fz); shop.rotation.y = Math.PI; }
      else if (face === 2) { shop.position.set(fx, 1.5, 0); shop.rotation.y = Math.PI / 2; }
      else { shop.position.set(-fx, 1.5, 0); shop.rotation.y = -Math.PI / 2; }
      g.add(shop);

      // Striped fabric awning over the shopfront (Image 1, 2)
      var awMat = pick(awningMats, hash2(Math.round(cx), Math.round(cz), 31 + salt));
      var aw = new THREE.Mesh(geo().box, awMat);
      aw.scale.set(face < 2 ? w * 0.85 : 1.6, 0.24, face < 2 ? 1.6 : d * 0.85);
      if (face === 0) { aw.position.set(0, 2.85, fz + 0.75); aw.rotation.x = 0.15; }
      else if (face === 1) { aw.position.set(0, 2.85, -fz - 0.75); aw.rotation.x = -0.15; }
      else if (face === 2) { aw.position.set(fx + 0.75, 2.85, 0); aw.rotation.z = -0.15; }
      else { aw.position.set(-fx - 0.75, 2.85, 0); aw.rotation.z = 0.15; }
      g.add(aw);

      if (hgt > 10) {
        // Window BANDS, one shared plane per floor
        var floors = Math.min(8, Math.max(2, Math.floor(hgt / 3.4)));
        for (var f = 1; f < floors; f++) {
          var wy = 2.2 + (f - 1) * 3.4;
          [0, 1, 2, 3].forEach(function (side) {
            var along = (side < 2) ? w : d;
            var fixed = (side === 0) ? d / 2 + 0.05 : (side === 1) ? -d / 2 - 0.05
              : (side === 2) ? w / 2 + 0.05 : -w / 2 - 0.05;
            var ry = (side === 0) ? 0 : (side === 1) ? Math.PI : (side === 2) ? Math.PI / 2 : -Math.PI / 2;
            var band = new THREE.Mesh(geo().plane, ((f % 3) === 0) ? fLit : fGlass);
            band.scale.set(along * 0.78, 1.5, 1);
            if (side < 2) { band.position.set(0, wy, fixed); } else { band.position.set(fixed, wy, 0); }
            band.rotation.y = ry;
            g.add(band);
          });
        }

        // Roof slab and parapet rim (Image 1 & 2)
        g.add(sbox(w + 0.4, 0.4, d + 0.4, fSlab, 0, hgt + 0.2, 0));
        g.add(sbox(w + 0.4, 0.5, 0.2, fSlab, 0, hgt + 0.55, d / 2 + 0.1));
        g.add(sbox(w + 0.4, 0.5, 0.2, fSlab, 0, hgt + 0.55, -d / 2 - 0.1));
        g.add(sbox(0.2, 0.5, d + 0.4, fSlab, w / 2 + 0.1, hgt + 0.55, 0));
        g.add(sbox(0.2, 0.5, d + 0.4, fSlab, -w / 2 - 0.1, hgt + 0.55, 0));

        // Stairwell bulkhead / elevator penthouse
        var phW = Math.min(w * 0.35, 4.2), phD = Math.min(d * 0.35, 4.2);
        var ph = sbox(phW, 2.2, phD, pick(wallMats, hash2(Math.round(cx), Math.round(cz), 28)), -w * 0.2, hgt + 1.2, -d * 0.2);
        g.add(ph);

        // Rich rooftop architectural dressing (Reference Images 1, 2)
        var rfHash = hash2(Math.round(cx), Math.round(cz), 47);
        if (rfHash > 0.45) {
          // Iconic timber/steel water tower with conical cap
          var wt = buildRooftopWaterTower(M, 0.95 + hash2(Math.round(cx), Math.round(cz), 41) * 0.25);
          wt.position.set(-w * 0.18, hgt + 0.4, d * 0.22);
          g.add(wt);
        } else {
          // Standard blue water tank
          var tk = new THREE.Mesh(geo().cyl, fTank);
          tk.scale.set(0.9, 1.4, 0.9);
          tk.position.set(-w * 0.2, hgt + 1.1, d * 0.2);
          g.add(tk);
        }

        // AC Condensers on rooftop
        if (hash2(Math.round(cx), Math.round(cz), 53) > 0.25) {
          var ac1 = buildRooftopAC(M);
          ac1.position.set(w * 0.22, hgt + 0.4, -d * 0.18);
          g.add(ac1);
          var ac2 = buildRooftopAC(M);
          ac2.position.set(w * 0.22, hgt + 0.4, 0.8);
          g.add(ac2);
        }

        // Solar panel rack
        if (hash2(Math.round(cx), Math.round(cz), 61) > 0.4) {
          var sr = buildSolarRack(M, Math.max(2, Math.floor(w / 4)));
          sr.position.set(w * 0.12, hgt + 0.4, d * 0.18);
          g.add(sr);
        }

        // Helipad on tallest skyscrapers (Image 1 & 3)
        if (hgt > 22 && w >= 11 && d >= 11 && hash2(Math.round(cx), Math.round(cz), 73) > 0.5) {
          var hp = buildHelipad(M, 4.2);
          hp.position.set(0, hgt + 0.42, 0);
          g.add(hp);
        }

        // Exterior Fire Escape on end buildings (Image 2)
        if (salt === 2 && hash2(Math.round(cx), Math.round(cz), 83) > 0.55) {
          var fe = buildFireEscape(M, floors, w / 2 + 0.9, false);
          g.add(fe);
        }

      } else {
        // Low-rise building: either conical roof or flat terrace with parapet and tank
        var lowRoofHash = hash2(Math.round(cx), Math.round(cz), 18);
        if (lowRoofHash > 0.5) {
          var roof = new THREE.Mesh(geo().cone, pick(roofMats, lowRoofHash));
          var rr = Math.hypot(w, d) / 2 * 0.72;
          roof.scale.set(rr, 2.4, rr);
          roof.position.y = hgt + 1.2;
          roof.rotation.y = Math.PI / 4;
          g.add(roof);
        } else {
          // Flat roof with parapet, small AC, and blue water tank
          g.add(sbox(w + 0.4, 0.35, d + 0.4, fSlab, 0, hgt + 0.18, 0));
          g.add(sbox(w + 0.4, 0.4, 0.18, fSlab, 0, hgt + 0.45, d / 2 + 0.09));
          g.add(sbox(w + 0.4, 0.4, 0.18, fSlab, 0, hgt + 0.45, -d / 2 - 0.09));
          var tkSmall = new THREE.Mesh(geo().cyl, fTank);
          tkSmall.scale.set(0.65, 1.0, 0.65);
          tkSmall.position.set(-w * 0.2, hgt + 0.7, d * 0.2);
          g.add(tkSmall);
          var acLow = buildRooftopAC(M);
          acLow.position.set(w * 0.2, hgt + 0.36, -d * 0.2);
          g.add(acLow);
        }
      }

      // Plant faceted low-poly trees along curbs (Image 1 & 2)
      if (hash2(Math.round(cx), Math.round(cz), 97) > 0.35) {
        var tree = buildFacetedTree(M, 0.95 + hash2(Math.round(cx), Math.round(cz), 63) * 0.35);
        var treeOffset = (hash2(Math.round(cx), Math.round(cz), 79) - 0.5) * (face < 2 ? w * 0.6 : d * 0.6);
        if (face === 0) { tree.position.set(treeOffset, 0, fz + 2.4); }
        else if (face === 1) { tree.position.set(treeOffset, 0, -fz - 2.4); }
        else if (face === 2) { tree.position.set(fx + 2.4, 0, treeOffset); }
        else { tree.position.set(-fx - 2.4, 0, treeOffset); }
        g.add(tree);
      }

      g.position.set(cx, 0, cz);
      grp.add(g);
      placed++;
      return true;
    }

    // ── Street-frontage terraces ────────────────────────────────────────────
    function roadAxis() {
      var vs = [], hs = [];
      roads.forEach(function (r) {
        if (r.type === 'v') { vs.push({ pos: r.x, w: r.width || 14, a: Math.min(r.z1, r.z2), b: Math.max(r.z1, r.z2) }); }
        else { hs.push({ pos: r.z, w: r.width || 14, a: Math.min(r.x1, r.x2), b: Math.max(r.x1, r.x2) }); }
      });
      vs.sort(function (p, q) { return p.pos - q.pos; });
      hs.sort(function (p, q) { return p.pos - q.pos; });
      return { vs: vs, hs: hs };
    }

    var ax = roadAxis();
    var unitW = opts.unit || 13;      // terrace building width
    var depth = opts.depth || 10;     // how deep the terrace is behind the kerb

    function terrace(axis, fixedPos, from, to, face, innerA, innerB) {
      var span = to - from;
      if (span < unitW) { return; }
      var n = Math.max(1, Math.round(span / unitW));
      var step = span / n;
      for (var i = 0; i < n && placed < MAX_FILL; i++) {
        var c = from + step * (i + 0.5);
        // Deterministic per-slot variation: height class + small width jitter.
        var hv = hash2(i, Math.round(fixedPos), 21);
        var tall = hv > 0.55;
        var hgt = tall ? (11 + hash2(i, Math.round(fixedPos), 22) * 20) : (4.4 + hash2(i, Math.round(fixedPos), 23) * 1.8);
        // Seamless zero gap between adjacent buildings (Image 2)
        var wid = step + 0.05;
        if (axis === 'x') {
          // Row runs along X at a fixed Z; buildings face +Z or -Z.
          emit(c, fixedPos, wid, depth, hgt, face, 1);
        } else {
          // Row runs along Z at a fixed X; buildings face +X or -X.
          emit(fixedPos, c, depth, wid, hgt, face, 2);
        }
      }
    }

    // Interior city blocks between consecutive vertical and horizontal roads.
    for (var vi = 0; vi < ax.vs.length - 1 && placed < MAX_FILL; vi++) {
      var v0 = ax.vs[vi], v1 = ax.vs[vi + 1];
      var bL = v0.pos + v0.w / 2 + verge;
      var bR = v1.pos - v1.w / 2 - verge;
      if (bR - bL < depth) { continue; }

      for (var hi = 0; hi < ax.hs.length - 1 && placed < MAX_FILL; hi++) {
        var h0 = ax.hs[hi], h1 = ax.hs[hi + 1];
        var bN = h0.pos + h0.w / 2 + verge;
        var bS = h1.pos - h1.w / 2 - verge;
        if (bS - bN < depth) { continue; }

        // West frontage of this block: facing road v0 to the west (-X)
        terrace('z', bL + depth / 2, bN, bS, 3);
        // East frontage of this block: facing road v1 to the east (+X)
        terrace('z', bR - depth / 2, bN, bS, 2);
        // North frontage of this block: facing road h0 to the north (-Z)
        terrace('x', bN + depth / 2, bL + depth, bR - depth, 1);
        // South frontage of this block: facing road h1 to the south (+Z)
        terrace('x', bS - depth / 2, bL + depth, bR - depth, 0);
      }
    }

    // Outer margins beyond the outer roads so the city skyline doesn't drop off into void.
    var firstV = ax.vs[0], lastV = ax.vs[ax.vs.length - 1];
    var firstH = ax.hs[0], lastH = ax.hs[ax.hs.length - 1];
    var minZ = firstH ? (firstH.pos - firstH.w / 2 - verge) : -150;
    var maxZ = lastH ? (lastH.pos + lastH.w / 2 + verge) : 150;
    var minX = firstV ? (firstV.pos - firstV.w / 2 - verge) : -150;
    var maxX = lastV ? (lastV.pos + lastV.w / 2 + verge) : 150;

    if (firstV) {
      // West outer margin facing east towards road firstV (+X)
      terrace('z', firstV.pos - firstV.w / 2 - verge - depth / 2, minZ, maxZ, 2);
    }
    if (lastV) {
      // East outer margin facing west towards road lastV (-X)
      terrace('z', lastV.pos + lastV.w / 2 + verge + depth / 2, minZ, maxZ, 3);
    }
    if (firstH) {
      // North outer margin facing south towards road firstH (+Z)
      terrace('x', firstH.pos - firstH.w / 2 - verge - depth / 2, minX, maxX, 0);
    }
    if (lastH) {
      // South outer margin facing north towards road lastH (-Z)
      terrace('x', lastH.pos + lastH.w / 2 + verge + depth / 2, minX, maxX, 1);
    }

    // ── Footpaths ──────────────────────────────────────────────────────────
    // Pavement strips along both kerbs of every road. Without these the widened
    // verge just exposes bare ground, which is what made the map read empty.
    var walk = new THREE.MeshLambertMaterial({ color: 0xb9b3a6 });
    var kerb = new THREE.MeshLambertMaterial({ color: 0xd9d4c8 });
    ax.vs.forEach(function (v) {
      var zA = v.a - 14, zB = v.b + 14;
      [-1, 1].forEach(function (s) {
        var x = v.pos + s * (v.w / 2 + FOOT / 2);
        var p = sbox(FOOT, 0.16, zB - zA, walk, x, 0.08, (zA + zB) / 2);
        grp.add(p);
        grp.add(sbox(0.18, 0.22, zB - zA, kerb, v.pos + s * (v.w / 2 + 0.09), 0.11, (zA + zB) / 2));
      });
    });
    ax.hs.forEach(function (h) {
      var xA = h.a - 14, xB = h.b + 14;
      [-1, 1].forEach(function (s) {
        var z = h.pos + s * (h.w / 2 + FOOT / 2);
        grp.add(sbox(xB - xA, 0.16, FOOT, walk, (xA + xB) / 2, 0.08, z));
        grp.add(sbox(xB - xA, 0.22, 0.18, kerb, (xA + xB) / 2, 0.11, h.pos + s * (h.w / 2 + 0.09)));
      });
    });

    grp.userData.count = placed;
    grp.userData.camKeepOut = (opts.camKeepOut || []).length;
    return grp;
  }

  // ── Stage dressing ────────────────────────────────────────────────────────
  //
  // A STAGE map (story/stage.js) is geometry only: roads, buildings, no route.
  // Everything a film needs that is NOT the map — a signal head painted red, wet
  // tarmac, sodium lamps, parked cars for scale, rain particles — lives here and
  // is built AFTER the map and torn down with it.
  //
  // NOTHING IN HERE REGISTERS COLLISION. The player never drives a stage map, so
  // any obstacle list these props produced would be pure cost. That is also why
  // they can be placed far more freely than gameplay props: a parked car can sit
  // half on a kerb without wedging anyone.
  var STAGE_GROUP = 'story-stage';

  function stageMats() {
    if (stageMats._m) { return stageMats._m; }
    stageMats._m = {
      paintWhite: new THREE.MeshBasicMaterial({ color: 0xf2f5f7 }),
      paintRed: new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
      paintAmber: new THREE.MeshBasicMaterial({ color: 0xffb020 }),
      paintGreen: new THREE.MeshBasicMaterial({ color: 0x2ecc71 }),
      poleDark: new THREE.MeshLambertMaterial({ color: 0x2a2e34 }),
      poleGrey: new THREE.MeshLambertMaterial({ color: 0x9aa3ad }),
      lampHead: new THREE.MeshBasicMaterial({ color: 0xffd98a }),
      // Wet tarmac: light specular sheen without blacking out road surface
      wet: new THREE.MeshPhongMaterial({
        color: 0x3d4b5c, shininess: 110, specular: 0x88aacc, transparent: true, opacity: 0.20
      }),
      puddle: new THREE.MeshPhongMaterial({
        color: 0x2d3e4e, shininess: 160, specular: 0xaaccff, transparent: true, opacity: 0.35
      }),
      glassDark: new THREE.MeshLambertMaterial({ color: 0x141a20 })
    };
    return stageMats._m;
  }

  /** A painted bar on the tarmac, lying flat. Used for stop lines and zebra. */
  function paintBar(grp, M, cx, cz, w, d) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.paintWhite);
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, 0.07, cz);
    grp.add(m);
    return m;
  }

  /**
   * The signal head a film's shots are pointed at.
   *
   * Built here rather than via cfg.signals because the engine's signal cycle
   * animates: a head that turns green 6 seconds into a shot about a red light
   * destroys the shot. This one is whatever colour the stage says it is, for as
   * long as the stage lives.
   */
  function buildSignalHead(M, spec) {
    var g = new THREE.Group();
    g.name = 'stage-signal';

    var H = 6.2;
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, H, 10), M.poleGrey);
    mast.position.set(0, H / 2, 0);
    g.add(mast);

    // Mast arm reaching over the approach lane.
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 5.2), M.poleGrey);
    arm.position.set(0, H - 0.35, -2.6);
    g.add(arm);
    // Gusset, so the arm does not read as floating.
    var gusset = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), M.poleGrey);
    gusset.position.set(0, H - 0.85, -0.5);
    gusset.rotation.x = Math.PI / 4;
    g.add(gusset);

    // The three aspects, in red/amber/green order. Only the active one is lit;
    // the others are dark glass, which is what makes the lit one read as bright
    // without needing an emissive or a real light.
    //
    // The lamp meshes are kept on `g.userData.aspectLamps` rather than found by
    // traversal, so changing state later cannot accidentally hit a hood or the
    // controller box.
    var ASPECTS = [
      { y: H - 0.95, lit: 0xff3b30 },
      { y: H - 1.75, lit: 0xffb020 },
      { y: H - 2.55, lit: 0x2ecc71 }
    ];
    var lamps = [];
    ASPECTS.forEach(function (a) {
      var hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.34), M.poleDark);
      hood.position.set(0, a.y, -4.6);
      g.add(hood);
      var lamp = new THREE.Mesh(new THREE.CircleGeometry(0.19, 12), M.glassDark);
      lamp.position.set(0, a.y, -4.79);
      lamp.rotation.y = Math.PI;
      lamp.userData.dimMat = lamp.material;
      g.add(lamp);
      lamps.push(lamp);
    });
    g.userData.aspectLamps = lamps;
    g.userData.litColors = ASPECTS.map(function (a) { return a.lit; });

    // Controller box at the base — the sort of hardware that is always bolted to
    // an Indian junction pole and never mentioned.
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.36), M.poleDark);
    box.position.set(0, 1.1, -0.28);
    g.add(box);

    setSignalState(g, (spec && spec.state) || 'red');
    g.position.set(spec.x || 0, 0, spec.z || 0);
    g.rotation.y = spec.rotY || 0;
    return g;
  }

  /**
   * Light exactly one aspect.
   *
   * One material is created per lit aspect rather than per state change, so
   * calling this every frame would leak — hence applyAct() guards on act name and
   * this is only called at build time and on explicit state changes.
   */
  function setSignalState(g, state) {
    if (!g) { return; }
    var order = ['red', 'amber', 'green'];
    var on = order.indexOf(String(state || 'red').toLowerCase());
    if (on < 0) { on = 0; }
    var lamps = g.userData.aspectLamps || [];
    var colors = g.userData.litColors || [];
    lamps.forEach(function (lamp, i) {
      if (i === on) {
        if (!lamp.userData.litMat) {
          lamp.userData.litMat = new THREE.MeshBasicMaterial({ color: colors[i] });
        }
        lamp.material = lamp.userData.litMat;
      } else {
        lamp.material = lamp.userData.dimMat;
      }
    });
  }

  /** Wet tarmac: one big plane plus scattered puddle ellipses. */
  function buildWetRoad(grp, M, cfgRoads) {
    var g = new THREE.Group();
    g.name = 'stage-wet';

    // Bounding the tarmac to the roads rather than the whole world keeps the
    // plane under the camera and off the horizon, where it would read as fog.
    var b = { x1: 1e9, x2: -1e9, z1: 1e9, z2: -1e9 };
    (cfgRoads || []).forEach(function (r) {
      var w = r.width || 14, half = w / 2 + 6;
      if (r.type === 'v') {
        b.x1 = Math.min(b.x1, r.x - half); b.x2 = Math.max(b.x2, r.x + half);
        b.z1 = Math.min(b.z1, Math.min(r.z1, r.z2)); b.z2 = Math.max(b.z2, Math.max(r.z1, r.z2));
      } else {
        b.z1 = Math.min(b.z1, r.z - half); b.z2 = Math.max(b.z2, r.z + half);
        b.x1 = Math.min(b.x1, Math.min(r.x1, r.x2)); b.x2 = Math.max(b.x2, Math.max(r.x1, r.x2));
      }
    });
    if (b.x1 > b.x2) { return null; }

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(b.x2 - b.x1, b.z2 - b.z1), M.wet);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set((b.x1 + b.x2) / 2, 0.035, (b.z1 + b.z2) / 2);
    g.add(plane);

    // Puddles: deterministic ellipses clustered near the kerbs, where water
    // actually collects. Scattering them uniformly reads as a texture, not water.
    for (var i = 0; i < 26; i++) {
      var t = hash2(i, 7, 31);
      var u = hash2(i, 11, 32);
      var v = hash2(i, 13, 33);
      var px = b.x1 + (b.x2 - b.x1) * t;
      var pz = b.z1 + (b.z2 - b.z1) * u;
      var rad = 1.4 + v * 3.4;
      var p = new THREE.Mesh(new THREE.CircleGeometry(rad, 14), M.puddle);
      p.rotation.x = -Math.PI / 2;
      p.scale.set(1, 1, 0.55 + v * 0.4);
      p.position.set(px, 0.055, pz);
      g.add(p);
    }
    grp.add(g);
    return g;
  }

  /** Sodium street lamp: column, outreach arm, and a warm emissive head. */
  function buildStreetLamp(M, spec) {
    var g = new THREE.Group();
    g.name = 'stage-lamp';
    var H = 8.2;
    var col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, H, 8), M.poleGrey);
    col.position.set(0, H / 2, 0);
    g.add(col);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.5, 8), M.poleDark);
    base.position.set(0, 0.25, 0);
    g.add(base);

    var dir = (spec.rotY || 0);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), M.poleGrey);
    arm.position.set(0, H - 0.1, -1.2);
    g.add(arm);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.0), M.poleDark);
    head.position.set(0, H - 0.24, -2.3);
    g.add(head);
    // The emissive lens is what actually makes it a lamp. A PointLight per lamp
    // would cost four real lights on a mobile budget for no extra information;
    // the bright lens plus the wet-road specular does the work.
    var lens = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.9), M.lampHead);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, H - 0.36, -2.3);
    g.add(lens);

    // Warm sodium amber street light casting real illumination onto the road
    var lampLight = new THREE.PointLight(0xffbe55, 1.6, 28, 1.2);
    lampLight.position.set(0, H - 0.5, -2.3);
    g.add(lampLight);

    g.position.set(spec.x || 0, 0, spec.z || 0);
    g.rotation.y = dir;
    return g;
  }

  /** A parked car used purely as scale reference and street dressing. */
  function buildParkedCar(game, M, spec, out) {
    try {
      var bv = (typeof window._buildVehicle === 'function') ? window._buildVehicle : null;
      if (!bv) { return null; }
      var car = bv(spec.type || 'car', spec.color == null ? 0x3a4048 : spec.color, { exact: true, tintAll: true });
      if (!car) { return null; }
      if (typeof spec.x === 'number') { car.position.set(spec.x, 0, spec.z); }
      if (typeof spec.rotY === 'number') { car.rotation.y = spec.rotY; }
      car.userData = car.userData || {};
      car.userData.isCast = true;   // excluded from collision + task queries
      out.add(car);
      return car;
    } catch (e) { return null; }
  }

  /**
   * Rain for the film. Denser and larger than gameplay rain because the camera
   * is long-lens and close: gameplay rain is sized for a chase camera 8m back.
   */
  function buildRain(M, spec) {
    var count = (spec && spec.count) || 1200;
    var size = (spec && spec.size) || 0.04;
    var span = 90, height = 46;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      // Deterministic so a replay of the film has identical rain — a film that
      // re-rolls its weather on every replay reads as a screensaver.
      pos[i * 3] = (hash2(i, 1, 41) - 0.5) * span;
      pos[i * 3 + 1] = hash2(i, 2, 42) * height;
      pos[i * 3 + 2] = (hash2(i, 3, 43) - 0.5) * span;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({
      color: 0xa0c4e8, size: size, transparent: true,
      opacity: (spec && spec.opacity) || 0.22, depthWrite: false
    });
    var pts = new THREE.Points(g, m);
    pts.name = 'stage-rain';
    pts.userData.isStageRain = true;
    return pts;
  }

  // ── Crime-scene set pieces ────────────────────────────────────────────────
  //
  // A shot only reads as a crime scene if the frame contains the apparatus of
  // one. A body on wet tarmac alone is a body; a body inside taped-off tarmac,
  // under numbered markers, behind an evidence sheet, with a patrol car's
  // strobes bouncing off the puddle, is an investigation — and the difference is
  // the whole point of the cold open's aftermath.
  //
  // Everything here is INERT: no collision, no task queries, no player
  // interaction. The player never drives this map.

  /**
   * Police barricade: an A-frame trestle with a caution band.
   *
   * Sits across the road to close it off. Placed north of the junction in the
   * stage's dressing so the aftermath shots have something between camera and
   * subject to break the frame up.
   */
  function buildBarricade(M, spec) {
    var g = new THREE.Group();
    g.name = 'stage-barricade';

    var W = (spec && spec.width) || 7.5;
    var barMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    var legMat = M.poleGrey;

    // Two horizontal boards with a caution stripe between them. Real barricades
    // read as a striped band from any distance; a plain plank reads as a fence.
    var top = new THREE.Mesh(new THREE.BoxGeometry(W, 0.42, 0.14), barMat);
    top.position.set(0, 1.28, 0);
    g.add(top);
    var mid = new THREE.Mesh(new THREE.BoxGeometry(W, 0.30, 0.12), barMat);
    mid.position.set(0, 0.86, 0);
    g.add(mid);
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.16, 0.16), M.paintRed);
    stripe.position.set(0, 1.28, 0.02);
    g.add(stripe);
    var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.11, 0.15), M.paintRed);
    stripe2.position.set(0, 0.86, 0.02);
    g.add(stripe2);

    // A-frame legs. Splayed, because a barricade with vertical legs looks like
    // a fence rail floating in mid-air.
    [-1, 1].forEach(function (side) {
      var lx = side * (W / 2 - 0.35);
      [-1, 1].forEach(function (z) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), legMat);
        leg.position.set(lx, 0.8, z * 0.26);
        leg.rotation.x = z * 0.16;
        g.add(leg);
      });
    });

    if (spec && typeof spec.x === 'number') { g.position.set(spec.x, 0, spec.z); }
    if (spec && typeof spec.rotY === 'number') { g.rotation.y = spec.rotY; }
    return g;
  }

  /**
   * Evidence marker: a small tent card with a number.
   *
   * The number is drawn on a canvas rather than modelled. It is legible in a
   * push-in and costs one 64x64 texture shared by every marker on the stage.
   */
  var _markerTexCache = null;
  function markerTex() {
    if (_markerTexCache) { return _markerTexCache; }
    try {
      var cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      var x = cv.getContext('2d');
      x.fillStyle = '#f8fafc';
      x.fillRect(0, 0, 96, 96);
      x.fillStyle = '#dc2626';
      x.fillRect(0, 0, 96, 26);
      x.fillStyle = '#ffffff';
      x.font = 'bold 20px Inter, system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('EVIDENCE', 48, 13);
      x.fillStyle = '#0f172a';
      x.font = 'bold 52px Inter, system-ui, sans-serif';
      x.fillText('2', 48, 62);
      _markerTexCache = new THREE.CanvasTexture(cv);
    } catch (e) { _markerTexCache = null; }
    return _markerTexCache;
  }

  function buildEvidenceMarkers(M, list) {
    var g = new THREE.Group();
    g.name = 'stage-markers';
    var tex = markerTex();
    var cardMat = tex
      ? new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })
      : M.paintWhite;

    (list || []).forEach(function (spec, i) {
      if (!spec) { return; }
      // A folded card: two planes meeting at a shallow ridge, so it stands up
      // without a frame.
      var mk = new THREE.Group();
      var front = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), cardMat);
      front.position.set(0, 0.12, 0.04);
      front.rotation.x = -0.22;
      mk.add(front);
      var back = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), cardMat);
      back.position.set(0, 0.12, -0.04);
      back.rotation.x = 0.22;
      mk.add(back);
      if (typeof spec.x === 'number') { mk.position.set(spec.x, 0, spec.z); }
      if (typeof spec.rotY === 'number') { mk.rotation.y = spec.rotY; }
      mk.userData = mk.userData || {};
      mk.userData.isCast = true;
      g.add(mk);
      // Deterministic yaw jitter so a row of markers does not look cloned.
      mk.rotation.y += (hash2(i, 3, 91) - 0.5) * 0.5;
    });
    return g;
  }

  /**
   * Evidence sheet over the body.
   *
   * A pale tarpaulin tented over the fallen officer. It is the single prop that
   * tells a viewer what the aftermath means before any subtitle does, and it
   * gives the final crane something to rise above.
   */
  function buildEvidenceSheet(M, spec) {
    var g = new THREE.Group();
    g.name = 'stage-sheet';

    var sheetMat = new THREE.MeshLambertMaterial({
      color: 0xdfe6ee, side: THREE.DoubleSide, transparent: true, opacity: 0.94
    });
    var W = (spec && spec.width) || 2.6;
    var D = (spec && spec.depth) || 3.4;
    var H = (spec && spec.height) || 0.85;

    // Four tapering skirts plus a lid: a tent, not a box. The peak is what makes
    // it read as fabric over a form.
    var lid = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, 0.07, D * 0.9), sheetMat);
    lid.position.set(0, H, 0);
    g.add(lid);

    var sides = [
      [0, -D / 2, 0, 0], [0, D / 2, 0, 0],
      [-W / 2, 0, 0, Math.PI / 2], [W / 2, 0, 0, Math.PI / 2]
    ];
    sides.forEach(function (s) {
      var panel = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.05), sheetMat);
      panel.position.set(s[0] * 0.5, H / 2, s[1] * 0.5);
      panel.rotation.y = s[3];
      // Lean each skirt outward from the peak.
      panel.rotation.x = s[1] < 0 ? 0.20 : (s[1] > 0 ? -0.20 : 0);
      panel.rotation.z = s[0] < 0 ? -0.20 : (s[0] > 0 ? 0.20 : 0);
      g.add(panel);
    });

    // Weighted hem, so the sheet is pinned to the road rather than hovering.
    var hem = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, 0.08, D * 1.02), M.poleDark);
    hem.position.set(0, 0.04, 0);
    g.add(hem);

    if (spec && typeof spec.x === 'number') { g.position.set(spec.x, 0, spec.z); }
    if (spec && typeof spec.rotY === 'number') { g.rotation.y = spec.rotY; }
    return g;
  }

  /**
   * Police light bar.
   *
   * Built as emissive caps plus a real PointLight. The emissive caps alone read
   * as decoration; what sells a strobing patrol car at night is the light it
   * throws onto the wet road, which is the one thing the wet-tarmac specular
   * material is waiting for.
   *
   * `tick(dt)` drives the alternating flash. Returns a stop handle so
   * clearStage() can detach it rather than leaking a timer per replay.
   */
  function buildPoliceLightBar(M, spec) {
    var g = new THREE.Group();
    g.name = 'stage-lightbar';

    var base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.10, 0.24), M.poleDark);
    base.position.set(0, 0.05, 0);
    g.add(base);

    var redMat = new THREE.MeshBasicMaterial({ color: 0xff2d2d });
    var blueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    var redCap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.22), redMat);
    redCap.position.set(-0.33, 0.14, 0);
    g.add(redCap);
    var blueCap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.22), blueMat);
    blueCap.position.set(0.33, 0.14, 0);
    g.add(blueCap);

    // The thrown light. Modest range: it should pool on the road around the car
    // and die off well before the next lamp, not flood the whole stage.
    var throwLight = new THREE.PointLight(0xff4444, 0, 16, 1.6);
    throwLight.position.set(0, 0.2, 0);
    g.add(throwLight);

    var timer = null;
    var phase = 0;
    var on = false;
    var tickFn = function (dt) {
      // Alternating double-flash, the pattern every Indian patrol vehicle uses.
      // A single steady flash reads as a hazard light; the double-pulse reads as
      // an actual siren.
      phase += (dt || 0.016);
      var t = phase % 1.6;
      var lit = (t < 0.10) || (t > 0.22 && t < 0.32);
      if (lit === on) { return; }
      on = lit;
      redMat.color.setHex(lit ? 0xff5555 : 0x3a1010);
      blueMat.color.setHex(lit ? 0x1a2036 : 0x4a86ff);
      throwLight.intensity = lit ? 2.6 : 0;
      throwLight.color.setHex(on ? 0xff5555 : 0x5588ff);
    };

    if (typeof window !== 'undefined' && window.setInterval) {
      timer = window.setInterval(function () { tickFn(0.05); }, 50);
    }

    g.userData = g.userData || {};
    g.userData.stageTick = tickFn;
    g.userData.stopTick = function () { if (timer) { try { clearInterval(timer); } catch (e) {} } };

    if (spec && typeof spec.x === 'number') { g.position.set(spec.x, 0, spec.z); }
    if (spec && typeof spec.y === 'number') { g.position.y = spec.y; }
    if (spec && typeof spec.rotY === 'number') { g.rotation.y = spec.rotY; }
    return g;
  }

  /**
   * Traffic cone with a reflective band.
   *
   * Cones are the most load-bearing piece of forensic staging there is: they
   * establish a boundary AND they give the ground plane something to catch the
   * patrol strobes. Three of them in a shallow arc is enough.
   */
  function buildCone(M, spec) {
    var g = new THREE.Group();
    g.name = 'stage-cone';
    var coneMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });
    var bandMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

    var body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.62, 10), coneMat);
    body.position.set(0, 0.34, 0);
    g.add(body);
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), coneMat);
    base.position.set(0, 0.025, 0);
    g.add(base);
    var band = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.175, 0.09, 10), bandMat);
    band.position.set(0, 0.36, 0);
    g.add(band);

    if (spec && typeof spec.x === 'number') { g.position.set(spec.x, 0, spec.z); }
    return g;
  }

  /**
   * Build all film-only dressing for a stage and park it on the game.
   *
   * @param game   the Driving game
   * @param stage  window.STAGE[levelId]
   * @param story  window.STORY[levelId] (for the cast keep-out discs)
   * @returns {THREE.Group} the stage group
   */
  function dressStage(game, stage, story) {
    if (!game || !game.scene) { return null; }
    clearStage(game);
    var d = (stage && stage.dressing) || null;
    if (!d) { return null; }

    var grp = new THREE.Group();
    grp.name = STAGE_GROUP;
    var M = stageMats();

    // ── Signal head + its stop line ──────────────────────────────────────
    if (d.signalHead) {
      try { grp.add(buildSignalHead(M, d.signalHead)); } catch (e) {
        console.warn('[Cinematics] stage signal head failed:', e);
      }
      if (d.signalHead.ground) {
        var gnd = d.signalHead.ground;
        try {
          paintBar(grp, M, gnd.x, gnd.z, (gnd.halfW || 5) * 2, (gnd.halfD || 0.25) * 2);
        } catch (e2) {}
      }
    }

    // ── Wet road ─────────────────────────────────────────────────────────
    if (d.wetRoad) {
      try { buildWetRoad(grp, M, (game.mapCfg && game.mapCfg.roads) || []); }
      catch (e) { console.warn('[Cinematics] wet road failed:', e); }
    }

    // ── Street lamps ─────────────────────────────────────────────────────
    (d.streetLamps || []).forEach(function (spec) {
      try { grp.add(buildStreetLamp(M, spec)); } catch (e) {}
    });

    // ── Parked cars: scale reference so 90m of kerb is not empty ──────────
    (d.parkedCars || []).forEach(function (spec) {
      buildParkedCar(game, M, spec, grp);
    });

    // ── Hero vehicles ────────────────────────────────────────────────────
    // Inert scenery: authored in the stage rather than as cast because they are
    // never addressed, never tagged, and must survive into the act change.
    var heroActors = {};
    (d.heroVehicles || []).forEach(function (spec) {
      try {
        var bv = (typeof window._buildVehicle === 'function') ? window._buildVehicle : null;
        var m = bv ? bv(spec.type || 'car', spec.color == null ? 0x111111 : spec.color, { exact: true, tintAll: true }) : null;
        if (!m) { return; }
        if (typeof spec.x === 'number') { m.position.set(spec.x, spec.y || 0, spec.z); }
        if (typeof spec.rotY === 'number') { m.rotation.y = spec.rotY; }
        m.userData = m.userData || {};
        m.userData.isCast = true;
        if (spec.id) { m.userData.castId = spec.id; heroActors[spec.id] = m; }
        grp.add(m);
      } catch (e) {}
    });

    // ── Rain ─────────────────────────────────────────────────────────────
    var rain = null;
    if (d.rain) {
      try {
        rain = buildRain(M, d.rain);
        // Centre the volume on the camera's home position for the film, or the
        // junction if nothing is known yet.
        var cx = 0, cz = -16;
        rain.position.set(cx, 0, cz);
        grp.add(rain);
      } catch (e) {}
    }

    // ── Crime-scene dressing ─────────────────────────────────────────────
    // Declared separately from the street dressing because it is REVEALED, not
    // built: these props appear only on shots that carry `aftermath`, so the
    // murder itself plays on a clean, empty junction and the apparatus arrives
    // afterwards. Building them up front would put a barricade in the opening
    // crane, forty seconds before anything has happened.
    var aftermathGrp = null;
    function aftermathOn() {
      if (!aftermathGrp || aftermathGrp.visible) { return; }
      aftermathGrp.visible = true;
    }
    function aftermathOff() {
      if (!aftermathGrp || !aftermathGrp.visible) { return; }
      aftermathGrp.visible = false;
    }

    var az = d.aftermath;
    if (az) {
      try {
        aftermathGrp = new THREE.Group();
        aftermathGrp.name = 'stage-aftermath';

        (az.barricades || []).forEach(function (spec) {
          try { aftermathGrp.add(buildBarricade(M, spec)); } catch (eB) {}
        });
        try { aftermathGrp.add(buildEvidenceMarkers(M, az.markers)); } catch (eM) {}
        if (az.sheet) {
          try { aftermathGrp.add(buildEvidenceSheet(M, az.sheet)); } catch (eS) {}
        }
        (az.cones || []).forEach(function (spec) {
          try { aftermathGrp.add(buildCone(M, spec)); } catch (eC) {}
        });
        // Patrol light bars are PARENTED to a vehicle rather than placed free,
        // so one spec lights both this car and any other patrol car on the stage.
        (az.lightBars || []).forEach(function (spec) {
          try { aftermathGrp.add(buildPoliceLightBar(M, spec)); } catch (eL) {}
        });

        aftermathGrp.visible = false;
        grp.add(aftermathGrp);
        game._stageAftermath = aftermathGrp;
      } catch (eA) {
        console.warn('[Cinematics] aftermath dressing failed:', eA);
        aftermathGrp = null;
      }
    }
    game._aftermathOn = aftermathOn;
    game._aftermathOff = aftermathOff;

    game.scene.add(grp);
    game._stageGroup = grp;
    game._stageRain = rain;
    game._stageHeroActors = heroActors;

    // Camera keep-out for stage dressing, so a filler terrace cannot land in the
    // lens. The stage's own shot list is the source.
    try {
      if (window.Shots && typeof window.Shots.keepOutFor === 'function' && story) {
        var shots = [];
        if (story.prologue) { shots = shots.concat(story.prologue); }
        (story.beats || []).forEach(function (b) { if (b && b.shots) { shots = shots.concat(b.shots); } });
        var discs = window.Shots.keepOutFor(shots, game._storyAnchors || null);
        game._stageKeepOut = discs;
      }
    } catch (e) {}

    applyAct(game, (story && story.prologue && story.prologue[0] && story.prologue[0].act) || null);
    return grp;
  }

  /** Remove all stage dressing. Called when the playable map is rebuilt. */
  function clearStage(game) {
    if (!game || !game.scene) { return; }
    // Stop every timer a stage prop owns BEFORE the geometry goes. A patrol light
    // bar left running on an interval calls into a disposed material and, worse,
    // survives a replay to stack a second interval on the same mesh.
    try {
      var prev = game.scene.getObjectByName(STAGE_GROUP);
      if (prev) {
        prev.traverse(function (o) {
          if (o && o.userData && typeof o.userData.stopTick === 'function') {
            try { o.userData.stopTick(); } catch (e0) {}
            o.userData.stopTick = null;
          }
        });
      }
    } catch (eStop) {}
    try {
      var prev2 = game.scene.getObjectByName(STAGE_GROUP);
      if (prev2 && prev2.parent) { prev2.parent.remove(prev2); }
    } catch (e) {}
    try { if (game._stageGroup) { game._stageGroup.traverse(disposeTree); } } catch (e2) {}
    game._stageGroup = null;
    game._stageRain = null;
    game._stageHeroActors = null;
    game._stageKeepOut = null;
    game._stageAct = null;
    game._stageAftermath = null;
    // Drop the reveal hooks, not just the flag. cutscene.js calls these on every
    // shot; leaving them bound to a torn-down group means the next film's
    // applyShot() toggles an object that is no longer in the scene.
    game._aftermathOn = null;
    game._aftermathOff = null;
  }

  function disposeTree(o) {
    try {
      if (o.geometry) { o.geometry.dispose(); }
      if (o.material) {
        var list = Array.isArray(o.material) ? o.material : [o.material];
        list.forEach(function (m) { try { m.dispose(); } catch (e) {} });
      }
    } catch (e) {}
  }

  /**
   * Apply an act's light + weather. Called by the cutscene on the first frame of
   * any shot that declares `act`, which is how one stage film crosses from 3am
   * rain to 6am dry light without building two maps.
   */
  function applyAct(game, actName) {
    if (!game || !actName) { return; }
    if (game._stageAct === actName) { return; }   // already applied
    var stage = null;
    try {
      var lv = (window.ui && window.ui.cur) ? window.ui.cur.id : (game.lvId != null ? game.lvId : null);
      var all = window.STAGE || {};
      stage = all[String(lv)];
    } catch (e) {}
    if (!stage || !stage.acts) { return; }
    var a = stage.acts[actName];
    if (!a) { return; }

    try {
      game._stageAct = actName;
      if (typeof a.sky === 'number') { game.scene.background = new THREE.Color(a.sky); }
      if (a.fogNear != null) { game.scene.fog = new THREE.Fog(a.sky != null ? a.sky : 0x000000, a.fogNear, a.fogFar); }
      if (game._ambient && a.ambient != null) { game._ambient.intensity = a.ambient; }
      if (game._hemi) {
        if (a.hemiSky != null) { game._hemi.color = new THREE.Color(a.hemiSky); }
        if (a.hemiGround != null) { game._hemi.groundColor = new THREE.Color(a.hemiGround); }
      }
      if (game._sun) {
        if (a.sun != null) { game._sun.intensity = a.sun; }
        if (a.sunPos) { game._sun.position.set(a.sunPos[0], a.sunPos[1], a.sunPos[2]); }
      }
    } catch (e) {}

    // Wet tarmac and rain follow the act, not the shot.
    try {
      if (game._stageGroup) {
        var wet = game._stageGroup.getObjectByName('stage-wet');
        if (wet) { wet.visible = a.wet !== false; }
      }
      // Record the act's rain intent separately from the mesh's visibility.
      // cutscene.js needs to answer "is it raining in this act?" without
      // stomping on the visibility a `noRain` shot may have set.
      game._stageActRain = a.rain !== false;
      if (game._stageRain) {
        game._stageRain.visible = game._stageActRain;
      }
    } catch (e2) {}

    // Store so the swap back to the playable map can restore what it changed.
    try { game._stageActPrev = game._stageActPrev || {}; game._stageActPrev[actName] = a; } catch (e3) {}
  }

  /**
   * Restore the playable map's own lighting after a stage film, then drop all
   * stage state. `_buildScene()` has already rebuilt the lights, so this only has
   * to clear the bookkeeping and the geometry.
   */
  function restoreAfterStage(game) {
    clearStage(game);
  }

  // ── Orchestrator ──────────────────────────────────────────────────────────
  /**
   * Build all story sets for a level. Idempotent: removes any previous group.
   * Called from game_core after the plot builders so the house detail visually
   * sits on top of the base shell.
   */
  function build(game, cfg) {
    if (!game || !game.scene) { return null; }
    var prev = game.scene.getObjectByName(GROUP_NAME);
    if (prev) { try { game.scene.remove(prev); } catch (e) {} }
    var grp = new THREE.Group();
    grp.name = GROUP_NAME;
    var M = mats();
    var anchors = {};
    var homesteads = [];

    (cfg.plots || []).forEach(function (p, i) {
      if (!p || p.kind !== 'house' || !p.houseSet) { return; }
      var setOpts = {};
      Object.keys(p.houseSet).forEach(function (k) { setOpts[k] = p.houseSet[k]; });
      setOpts.mats = M;
      var h = null;
      try { h = buildHouse(p, setOpts); } catch (e) {
        console.warn('[Cinematics] buildHouse failed for plot', i, e);
        return;
      }
      h.position.set(p.x, 0, p.z);
      // ORIENTATION: buildHouse() authors its front (verandah, balcony, garden,
      // gate) along local +X, but _buildPlotBuildings() puts a plot's front along
      // local +Z. Rotating by -PI/2 maps +X onto +Z so the two agree and the set
      // faces the road. Without this the house faces north and the balcony anchor
      // lands beside the building instead of on its road-facing side.
      var theta = (p.rotY || 0) - Math.PI / 2;
      h.rotation.y = theta;
      grp.add(h);
      // Expose world-space anchors so shot scripts never hard-code balcony maths.
      var bal = h.userData.balcony || { x: 0, y: 0, z: 0 };
      var ca = Math.cos(theta), sa = Math.sin(theta);
      var frontX = h.userData.frontX || 0;
      var A = {
        house: { x: p.x, y: 4, z: p.z },
        balcony: {
          x: p.x + bal.x * ca + bal.z * sa,
          y: bal.y,
          z: p.z - bal.x * sa + bal.z * ca
        },
        verandah: {
          x: p.x + (frontX + 1.3) * ca,
          y: 1.4,
          z: p.z - (frontX + 1.3) * sa
        },
        interior: { x: p.x, y: 1.7, z: p.z },
        gate: {
          x: p.x + (frontX + 5.4) * ca,
          y: 1.6,
          z: p.z - (frontX + 5.4) * sa
        }
      };
      // Flattened keys (`home.balcony`) because cutscene.js resolves a shot's
      // vectors against `anchors[shot.anchor]` in one lookup — a nested object
      // would need a second lookup step and silently fall back to absolute
      // coordinates if that ever changes.
      Object.keys(A).forEach(function (k) { anchors[p.id + '.' + k] = A[k]; });
      anchors[p.id] = A.house;
      homesteads.push({ plot: p, houseW: p.w || 14, houseD: p.d || 12 });
    });

    // ── Camera keep-out ────────────────────────────────────────────────────
    // Every coordinate the prologue's camera passes through becomes a no-build
    // disc. Without this, a terrace can drop a 20m wall a metre in front of the
    // lens and swallow the frame — which is exactly what shot 1 hit: a flat
    // grey slab across 60% of the opening frame with the actors squeezed into
    // the remaining strip.
    //
    // The prologue lives in story/campaign.js and cinematics.js deliberately
    // does not import it; reading `window.STORY` here keeps the dependency
    // one-way (set builder reads the shot list, never the reverse) and keeps
    // every level without a story completely unaffected.
    var camKeepOut = [];
    try {
      // `cfg.id` is merged in from ui.cur, but fall back to the live level id in
      // case the world is built before ui.cur is populated.
      var sid = (cfg.id !== undefined && cfg.id !== null) ? cfg.id
        : (game.lvId !== undefined && game.lvId !== null) ? game.lvId : null;
      var story = (sid !== null && window.STORY) ? window.STORY[String(sid)] : null;

      // The keep-out geometry itself is owned by story/shots.js — it has to be,
      // because the shot vectors live with the words in story/campaign.js and the
      // resolution rules (anchored offsets, sight-line sampling) live with the
      // camera maths. Reading them from two places is how they drift apart.
      if (window.Shots && typeof window.Shots.keepOutFor === 'function') {
        var allShots = [];
        if (story && story.prologue) { allShots = allShots.concat(story.prologue); }
        // Beats film on the PLAYABLE map, which is built before this function
        // runs, so their discs belong here too.
        if (story && story.beats) {
          story.beats.forEach(function (b) { if (b && b.shots) { allShots = allShots.concat(b.shots); } });
        }
        camKeepOut = camKeepOut.concat(window.Shots.keepOutFor(allShots, anchors));

        // Discs for every ACTOR. Read from the campaign's cast first (that is
        // where blocking lives), then the level's, so an actor can never be
        // framed inside a wall.
        var camCast = [];
        if (story && story.cast) { camCast = camCast.concat(story.cast); }
        if (cfg.cast) { camCast = camCast.concat(cfg.cast); }
        camCast.forEach(function (c) {
          if (c && typeof c.x === 'number' && typeof c.z === 'number') {
            camKeepOut.push({ x: c.x, z: c.z, hw: 5, hd: 5 });
          }
        });
      }
    } catch (e) { /* no story for this level — nothing to protect */ }

    // ── Compound walls: one plot per homestead ─────────────────────────────
    // The wall encloses house + yard, with a single gate onto the street.
    //
    // It deliberately does NOT swallow the garage. An earlier version unioned
    // the garage footprint in, which produced two bugs at once: the boundary
    // wall ran straight across the garage mouth (so the car could never leave),
    // and the gate posts landed inside the opening. A garage that fronts the
    // street directly is also how the plot actually reads — the wall belongs to
    // the house, the garage is a separate street-frontage structure.
    homesteads.forEach(function (hs) {
      var p = hs.plot;
      var rect = {
        x1: p.x - hs.houseD / 2, x2: p.x + hs.houseD / 2,
        z1: p.z - hs.houseW / 2, z2: p.z + hs.houseW / 2
      };
      // Small margin so the wall clears the buildings it encloses.
      rect.x1 -= 1.4; rect.x2 += 1.4; rect.z1 -= 1.4; rect.z2 += 1.4;

      // Stop the wall short of any garage on this plot line, leaving the garage
      // mouth open to the street. Without this the wall crossed the opening and
      // sealed the car in.
      var blockers = [];
      (cfg.plots || []).forEach(function (o) {
        if (!o || o.kind !== 'garage') { return; }
        if (Math.abs(o.z - p.z) > hs.houseW + 4) { return; }
        var gw = (o.w || 6.5), gd = (o.d || 8);
        var swap = Math.abs(Math.abs((o.rotY || 0) % Math.PI) - Math.PI / 2) < 0.1;
        var ghw = (swap ? gd : gw) / 2, ghd = (swap ? gw : gd) / 2;
        blockers.push({ x1: o.x - ghw - 1.2, x2: o.x + ghw + 1.2, z1: o.z - ghd, z2: o.z + ghd, mid: o.z });
      });
      // The gate is the way out of the yard, so it must sit clear of the garage
      // mouth on whichever edge faces the street.
      var gateZ = null;
      blockers.forEach(function (b) { if (gateZ === null) { gateZ = b.mid; } });

      // Clamp the plot against the paved area of every road it touches.
      // Without this the margin pushed the boundary wall ~1m INTO the carriageway
      // (the garage already sits flush with the kerb), which both looks wrong and
      // blocks the lane the player drives on.
      (cfg.roads || []).forEach(function (r) {
        if (r.type === 'v') {
          var west = r.x - (r.width || 14) / 2, east = r.x + (r.width || 14) / 2;
          var rz1 = Math.min(r.z1, r.z2) - 2, rz2 = Math.max(r.z1, r.z2) + 2;
          if (rect.z2 > rz1 && rect.z1 < rz2) {
            if (rect.x2 > west && rect.x1 < r.x) { rect.x2 = Math.min(rect.x2, west - 0.5); }
            if (rect.x1 < east && rect.x2 > r.x) { rect.x1 = Math.max(rect.x1, east + 0.5); }
          }
        } else {
          var north = r.z - (r.width || 14) / 2, south = r.z + (r.width || 14) / 2;
          var rx1 = Math.min(r.x1, r.x2) - 2, rx2 = Math.max(r.x1, r.x2) + 2;
          if (rect.x2 > rx1 && rect.x1 < rx2) {
            if (rect.z2 > north && rect.z1 < r.z) { rect.z2 = Math.min(rect.z2, north - 0.5); }
            if (rect.z1 < south && rect.z2 > r.z) { rect.z1 = Math.max(rect.z1, south + 0.5); }
          }
        }
      });

      // Gate goes on the edge nearest the road the house faces.
      var cxr = (rect.x1 + rect.x2) / 2, czr = (rect.z1 + rect.z2) / 2;
      var gateSide = 'x2', gateAt = czr, bestD = Infinity;
      (cfg.roads || []).forEach(function (r) {
        var side = null, d = Infinity;
        if (r.type === 'v') {
          var rz1 = Math.min(r.z1, r.z2), rz2 = Math.max(r.z1, r.z2);
          if (czr < rz1) { side = 'x1'; d = rz1 - rect.z1; }
          else if (czr > rz2) { side = 'x2'; d = rect.z1 - rz2; }
          else {
            side = (r.x > cxr) ? 'x2' : 'x1';
            d = Math.abs(r.x - (side === 'x2' ? rect.x2 : rect.x1));
          }
        } else {
          var rx1 = Math.min(r.x1, r.x2), rx2 = Math.max(r.x1, r.x2);
          if (cxr < rx1) { side = 'z1'; d = rx1 - rect.x1; }
          else if (cxr > rx2) { side = 'z2'; d = rect.x1 - rx2; }
          else {
            side = (r.z > czr) ? 'z2' : 'z1';
            d = Math.abs(r.z - (side === 'z2' ? rect.z2 : rect.z1));
          }
        }
        if (side && d < bestD) { bestD = d; gateSide = side; }
      });
      // Re-derive the gate's position along its FINAL edge, so a gate on a
      // z-edge gets an x coordinate and vice versa. On a z-running edge the
      // position is nudged to whichever end is further from the garage mouth.
      if (gateSide === 'x1' || gateSide === 'x2') {
        gateAt = (gateZ !== null && gateZ < czr) ? rect.z1 + 2.2 : rect.z2 - 2.2;
      } else {
        gateAt = (gateZ !== null && gateZ < cxr) ? rect.x1 + 2.2 : rect.x2 - 2.2;
      }

      // Do not let a garage mouth sit under the wall on the gate's own edge.
      // Trim the edge back past the blocker instead of drawing through it.
      if (blockers.length) {
        var b0 = blockers[0];
        if ((gateSide === 'x2' || gateSide === 'x1') && rect.x2 > b0.x1 && rect.x1 < b0.x2) {
          // Wall runs along a z-constant on an x-edge: pull it in front of the
          // garage so the mouth stays open.
          var limit = b0.x1 - 0.6;
          if (gateSide === 'x2') { rect.x2 = Math.min(rect.x2, limit); }
          else { rect.x1 = Math.max(rect.x1, b0.x2 + 0.6); }
        }
      }

      try {
        var comp = buildCompound(rect, gateSide, gateAt, M);
        grp.add(comp);
        // Anchor for the gate, on the street side of the wall.
        var gx = (gateSide === 'x1') ? rect.x1 : (gateSide === 'x2') ? rect.x2 : cxr;
        var gz = (gateSide === 'z1') ? rect.z1 : (gateSide === 'z2') ? rect.z2 : czr;
        anchors[p.id + '.gate'] = { x: gx, y: 1.6, z: gz };
        anchors[p.id + '.yard'] = { x: cxr, y: 1.2, z: czr };
      } catch (e) {
        console.warn('[Cinematics] buildCompound failed:', e);
      }
    });

    if (cfg.fillDensity !== 0) {
      try {
        var fill = fillBlocks(cfg, { mats: M, camKeepOut: camKeepOut });
        if (fill) { grp.add(fill); anchors.__filled = fill.userData.count; }
      } catch (e) {
        console.warn('[Cinematics] fillBlocks failed:', e);
      }
    }

    // ── Camera-in-solid audit ───────────────────────────────────────────────
    // A shot camera parked inside the house renders as a blank plaster wall
    // across most of the frame. Two shots did exactly that before this check
    // existed, and nothing caught it: no error, no warning, just a grey
    // rectangle. Cheaper to assert here than to eyeball seven shots every time
    // a dimension moves.
    try {
      var solids = [];
      (cfg.plots || []).forEach(function (p) {
        if (!p || p.kind !== 'house') { return; }
        var pd = p.d || 12;
        solids.push({ tag: 'house ' + (p.id || '?'), x1: p.x - pd / 2, x2: p.x + pd / 2, z1: p.z - (p.w || 14) / 2, z2: p.z + (p.w || 14) / 2 });
      });
      (cfg.plots || []).forEach(function (p) {
        if (!p) { return; }
        var pw = p.w || 10, pd = p.d || 10;
        solids.push({
          tag: (p.kind || 'plot') + " '" + (p.id || '?') + "'",
          x1: p.x - pd / 2, x2: p.x + pd / 2,
          z1: p.z - pw / 2, z2: p.z + pw / 2
        });
      });
      // Also flag a camera sitting almost against a wall. Not an error, but it is
      // how shot 3 ended up 4m from the garage's back panel with the whole
      // frame filled by it — technically outside the solid, useless as a shot.
      camKeepOut.forEach(function (c) {
        for (var si = 0; si < solids.length; si++) {
          var s = solids[si];
          if (c.x > s.x1 && c.x < s.x2 && c.z > s.z1 && c.z < s.z2) {
            console.warn('[Cinematics] shot camera inside ' + s.tag +
              ' at (' + c.x.toFixed(1) + ', ' + c.z.toFixed(1) +
              ') — that shot will render as a blank wall');
          } else if (c.x > s.x1 - 5 && c.x < s.x2 + 5 && c.z > s.z1 - 5 && c.z < s.z2 + 5) {
            console.warn('[Cinematics] shot camera is within 5m of ' + s.tag +
              ' at (' + c.x.toFixed(1) + ', ' + c.z.toFixed(1) +
              ') — check the shot is not pointed at a blank wall');
          }
        }
      });
    } catch (e) {}

    game.scene.add(grp);
    game._storySetGroup = grp;
    game._storyAnchors = anchors;
    return anchors;
  }

  window.Cinematics = {
    build: build,
    buildHouse: buildHouse,
    fillBlocks: fillBlocks,
    // Stage (film-map) dressing. See story/stage.js.
    dressStage: dressStage,
    clearStage: clearStage,
    applyAct: applyAct,
    restoreAfterStage: restoreAfterStage,
    setSignalState: setSignalState,
    GROUP_NAME: GROUP_NAME,
    STAGE_GROUP: STAGE_GROUP
  };
})();
