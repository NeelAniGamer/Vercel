/**
 * Integration Guide: Wiring RoadGraph + RenderCore + SafeZoneUI + ThreePools into game_core.js
 * 
 * This file documents the minimal changes needed to integrate the new architecture.
 * Apply these changes to game_core.js incrementally.
 */

// ============================================================
// 1. LOAD ORDER (add to Driving.html / Academy.html <head>)
// ============================================================
/*
<script defer src="pools.js"></script>
<script defer src="road-graph.js"></script>
<script defer src="render_core.js"></script>
<script defer src="safezone-ui.js"></script>
<script defer src="game_core.js"></script>
*/

// ============================================================
// 2. GAME CLASS - CONSTRUCTOR CHANGES
// ============================================================
/*
  constructor() {
    // ... existing code ...
    
    // Initialize pools FIRST (before _initR)
    ThreePools.init(this);
    
    // ... rest of constructor ...
    this._initR(); 
    this._initIn(); 
    this._initG(); 
    this._initVirtualJoystick(); 
    this._loop();
  }
*/

// ============================================================
// 3. REPLACE _buildScene ROAD/BUILDING LOGIC
// ============================================================
/*
  _buildScene(mode) {
    // ... existing setup code ...
    
    // OLD: this._buildRoadZones(RW);
    // NEW: Build road graph from level config
    this.roadGraph = RoadGraph.fromLevelConfig(this.mapCfg);
    this.roadGraph.setAnchorNodes(this._anchorNodes);
    
    // Build visual road geometry using graph
    this._buildRoadsFromGraph(RW);
    
    // Build buildings using road-aware slots
    this._buildBuildingsFromGraph();
    
    // ... rest of _buildScene ...
  }

  _buildRoadsFromGraph(roadWidth) {
    const graph = this.roadGraph;
    const roadKey = window.PRELOADED_MODELS?.road_avenue ? 'road_avenue' : 'road_straight';
    const roadModel = window.PRELOADED_MODELS?.[roadKey];
    
    if (!roadModel) return; // fallback to old system
    
    graph.edges.forEach(edge => {
      const isV = Math.abs(edge.direction.x) < 0.1;
      const len = edge.length;
      const cx = isV ? edge.nodes[0].position.x : (edge.nodes[0].position.x + edge.nodes[1].position.x) / 2;
      const cz = isV ? (edge.nodes[0].position.z + edge.nodes[1].position.z) / 2 : edge.nodes[0].position.z;
      
      // Logical road bed (collision)
      const roadHb = new THREE.Mesh(
        new THREE.PlaneGeometry(roadWidth, len),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      roadHb.rotation.set(-Math.PI / 2, 0, isV ? 0 : -Math.PI / 2);
      roadHb.position.set(cx, 0.01, cz);
      this.scene.add(roadHb);
      this.world.push(roadHb);
      
      // Visual tiles
      if (roadModel) {
        const tileScale = roadWidth / 1000;
        const tileLenScale = 3;
        const tileSize = 1500 * tileScale * tileLenScale;
        const numTiles = Math.max(1, Math.floor(len / tileSize));
        const startX = isV ? cx : Math.min(edge.nodes[0].position.x, edge.nodes[1].position.x) + tileSize / 2 + (len - numTiles * tileSize) / 2;
        const startZ = isV ? Math.min(edge.nodes[0].position.z, edge.nodes[1].position.z) + tileSize / 2 + (len - numTiles * tileSize) / 2 : cz;
        
        for (let i = 0; i < numTiles; i++) {
          const tile = roadModel.clone();
          tile.scale.set(tileScale, tileScale, tileScale * tileLenScale);
          tile.frustumCulled = true;
          tile.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });
          
          if (isV) tile.position.set(cx, 0.08, startZ + i * tileSize);
          else { tile.rotation.y = Math.PI / 2; tile.position.set(startX + i * tileSize, 0.08, cz); }
          
          this.scene.add(tile);
        }
      }
      
      // Sidewalks
      [-1, 1].forEach(side => {
        const swW = this.mapCfg.isPedestrian ? 6 : 4;
        const pb = new THREE.Mesh(
          isV ? new THREE.BoxGeometry(swW, 0.15, len) : new THREE.BoxGeometry(len, 0.15, swW),
          this._materials.pave
        );
        pb.position.set(
          isV ? cx + side * (roadWidth / 2 + swW / 2) : cx,
          0.07,
          isV ? cz : cz + side * (roadWidth / 2 + swW / 2)
        );
        this.scene.add(pb);
        this.world.push(pb);
      });
    });
  }

  _buildBuildingsFromGraph() {
    const graph = this.roadGraph;
    const bMats = [
      new THREE.MeshToonMaterial({ color: 0xd9cfc4, gradientMap: window._toonGrad }),
      new THREE.MeshToonMaterial({ color: 0xc4b8a8, gradientMap: window._toonGrad }),
      new THREE.MeshToonMaterial({ color: 0xb0a898, gradientMap: window._toonGrad }),
      new THREE.MeshToonMaterial({ color: 0xd4c8b8, gradientMap: window._toonGrad })
    ];
    const winMat = new THREE.MeshBasicMaterial({ color: 0x304050 });
    
    const instancedData = {};
    
    graph.buildingSlots.forEach(slot => {
      if (slot.occupied) return;
      
      // Get building type from zone
      const zone = slot.zone;
      let type = 'normal';
      const rnd = Math.random();
      if (zone === 'Commercial') type = rnd > 0.7 ? 'skyscraper' : (rnd > 0.4 ? 'shop' : (rnd > 0.2 ? 'bank' : 'hospital'));
      else if (zone === 'Industrial') type = 'industrial';
      else if (zone === 'Residential') type = rnd > 0.6 ? 'normal' : 'chawl';
      else if (zone === 'Slums') type = rnd > 0.3 ? 'chawl' : 'normal';
      
      const pos = slot.getWorldPosition();
      const rot = slot.getRotation();
      
      // Try instanced mesh first
      if (window.PRELOADED_MODELS) {
        const modelKeys = Object.keys(window.PRELOADED_MODELS).filter(k => 
          k.startsWith('suburban_') || k.startsWith('industrial_') || k.startsWith('mbuilding_')
        );
        if (modelKeys.length > 0) {
          let key = modelKeys[Math.floor(Math.random() * modelKeys.length)];
          if (type === 'skyscraper' && modelKeys.some(k => k.includes('tower'))) key = modelKeys.find(k => k.includes('tower'));
          if (type === 'industrial' && modelKeys.some(k => k.includes('industrial'))) key = modelKeys.find(k => k.includes('industrial'));
          
          if (!instancedData[key]) instancedData[key] = [];
          instancedData[key].push({ x: pos.x, z: pos.z, r: rot, s: 10.5 });
          slot.occupied = true;
          return;
        }
      }
      
      // Fallback: procedural box building
      const g = new THREE.Group();
      const mat = bMats[Math.floor(Math.random() * bMats.length)];
      const bh = 16 + Math.random() * 16;
      const bw = 10 + Math.random() * 10;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 14), mat);
      bMesh.position.y = bh / 2;
      g.add(bMesh);
      
      if (this.mapCfg.isNight) {
        const lWinMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
        const rows = Math.floor(bh / 4);
        const cols = Math.floor(bw / 3.5);
        for (let wr = 0; wr < rows; wr++) {
          for (let wc = 0; wc < cols; wc++) {
            if (Math.random() > 0.55) continue;
            const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), lWinMat);
            wMesh.position.set(-bw/2 + 2 + wc*3.5, 3 + wr*4, 7.01);
            g.add(wMesh);
            const wMesh2 = wMesh.clone(); wMesh2.position.z = -7.01; wMesh2.rotation.y = Math.PI; g.add(wMesh2);
          }
        }
      }
      
      g.position.set(pos.x, 0, pos.z);
      g.rotation.y = rot;
      g.userData = { isBuilding: true, halfW: bw/2, halfD: 7 };
      this.scene.add(g);
      this.obstacles.push(g);
      slot.occupied = true;
    });
    
    // Build instanced meshes
    if (window.PRELOADED_MODELS) {
      Object.entries(instancedData).forEach(([key, instances]) => {
        const baseModel = window.PRELOADED_MODELS[key];
        baseModel.position.set(0,0,0);
        baseModel.rotation.set(0,0,0);
        baseModel.scale.set(1,1,1);
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
          
          this.scene.add(im);
        });
      });
    }
  }
*/

// ============================================================
// 4. NPC ROUTING USING ROAD GRAPH
// ============================================================
/*
  _spawnNPC(config) {
    // ... existing spawn logic ...
    
    // NEW: Use road graph for pathfinding
    if (this.roadGraph && config.route && config.route.length >= 2) {
      const startNode = this.roadGraph.getNearestNode(config.route[0].x, config.route[0].z);
      const endNode = this.roadGraph.getNearestNode(config.route[config.route.length - 1].x, config.route[config.route.length - 1].z);
      
      if (startNode && endNode) {
        const path = this.roadGraph.findPath(startNode, endNode);
        if (path) {
          npc.path = path.map(n => ({ x: n.position.x, z: n.position.z }));
          npc.currentPathIndex = 0;
        }
      }
    }
  }

  _updateNPC(npc, dt) {
    // ... existing movement ...
    
    // Follow graph path
    if (npc.path && npc.currentPathIndex < npc.path.length) {
      const target = npc.path[npc.currentPathIndex];
      const dx = target.x - npc.position.x;
      const dz = target.z - npc.position.z;
      const dist = Math.hypot(dx, dz);
      
      if (dist < 5) {
        npc.currentPathIndex++;
      } else {
        // Steer toward next waypoint
        const angle = Math.atan2(dx, dz);
        npc.rotation.y = THREE.MathUtils.lerp(npc.rotation.y, angle, 0.1);
      }
    }
  }
*/

// ============================================================
// 5. SAFE ZONE UI REGISTRATION
// ============================================================
/*
  _initHUD() {
    // ... existing HUD setup ...
    
    // Register all HUD elements with SafeZoneGrid
    if (window.SafeZoneGrid) {
      const SZ = window.SafeZoneGrid;
      
      // Top-left: Speed, Gear, Time
      SZ.register('speedometer', this.dom.gspd, 'TL', { order: 0, priority: 'high' });
      SZ.register('gear', this.dom.garc, 'TL', { order: 1, priority: 'high' });
      SZ.register('timer', this.dom.htmr, 'TL', { order: 2, priority: 'high' });
      SZ.register('fine', this.dom.hfin, 'TL', { order: 3, priority: 'medium' });
      
      // Top-right: Objective, Checkpoints
      SZ.register('objective', this.dom.objOver, 'TR', { order: 0, priority: 'high' });
      SZ.register('checkpoint', this.dom.cp, 'TR', { order: 1, priority: 'high' });
      
      // Bottom-left: Mini-map, Signals
      SZ.register('minimap', this.dom.mm, 'BL', { order: 0, priority: 'high' });
      SZ.register('signal', this.dom.sigInd, 'BL', { order: 1, priority: 'high' });
      
      // Bottom-right: Boost, Violations
      SZ.register('boost', this.dom.boostGauge, 'BR', { order: 0, priority: 'high' });
      SZ.register('violations', this.dom.vio, 'BR', { order: 1, priority: 'medium' });
      
      // Center: Day/Night clock
      SZ.register('clock', this.dom.dnClock, 'TC', { order: 0, priority: 'medium' });
      
      // Mobile controls
      if (this._isMobile) {
        SZ.register('steer', document.getElementById('steer-wheel-container'), 'BL', { order: 10, priority: 'high' });
        SZ.register('gas', document.getElementById('mc-gas'), 'BR', { order: 10, priority: 'high' });
        SZ.register('brake', document.getElementById('mc-brake'), 'BR', { order: 11, priority: 'high' });
      }
    }
  }
*/

// ============================================================
// 6. RENDER LOOP INTEGRATION
// ============================================================
/*
  _loop() {
    requestAnimationFrame(() => this._loop());
    
    const dt = this.clock.getDelta();
    const preset = this.renderCore.getPreset();
    
    // Frame budget check
    if (this.renderCore.checkFrameBudget) {
      this.renderCore.checkFrameBudget(dt * 1000);
    }
    
    if (!this.playing || this.pause) return;
    
    // ... existing update logic ...
    
    // Update LOD using road graph distance
    if (this.roadGraph && this.lodChunks.length) {
      const playerPos = this.player.position;
      this.lodChunks.forEach(chunk => {
        const nearestEdge = this.roadGraph.getNearestEdge(playerPos.x, playerPos.z);
        const dist = nearestEdge ? Math.hypot(chunk.x - nearestEdge.getPointAt(0.5).x, chunk.z - nearestEdge.getPointAt(0.5).z) 
                                : Math.hypot(chunk.x - playerPos.x, chunk.z - playerPos.z);
        chunk.update({ x: playerPos.x, z: playerPos.z, lodMultiplier: preset.lodMultiplier || 1 });
      });
    }
    
    // Render via RenderCore
    this.renderCore.render(this.scene, this.camera);
    
    // Pool stats (dev only)
    if (this.debug && performance.now() % 5000 < 16) {
      console.table(ThreePools.getStats());
    }
  }
*/

// ============================================================
// 7. CLEANUP ON STOP
// ============================================================
/*
  stopPlay() {
    // ... existing cleanup ...
    
    // Release all pooled objects
    ThreePools.releaseAll();
    
    // Clear road graph
    if (this.roadGraph) {
      this.roadGraph = null;
    }
    
    // SafeZoneGrid cleanup (optional - persists across levels)
    // if (window.SafeZoneGrid) window.SafeZoneGrid.destroy();
  }
*/

// ============================================================
// 8. SETTINGS MENU INTEGRATION
// ============================================================
/*
  // Add to settings UI
  _buildSettingsUI() {
    const qualitySelect = document.getElementById('quality-preset');
    if (qualitySelect && this.renderCore) {
      qualitySelect.value = this.renderCore.currentPreset;
      qualitySelect.addEventListener('change', (e) => {
        this.renderCore.setQuality(e.target.value);
        localStorage.setItem('traffic_quality', e.target.value);
      });
    }
    
    // Resolution scale slider
    const resScale = document.getElementById('res-scale');
    if (resScale && this.renderCore) {
      resScale.value = this.renderCore.getPreset().resScale * 100;
      resScale.addEventListener('input', (e) => {
        const preset = { ...this.renderCore.getPreset(), resScale: e.target.value / 100 };
        this.renderCore._applyQualitySettings(preset);
      });
    }
  }
*/

// ============================================================
// 9. LEVEL CONFIG EXTENSION (add to level definitions)
// ============================================================
/*
  // In level config (course.js or inline), add road metadata:
  roads: [
    { type:'v', x:0, z1:-480, z2:480, lanes: 2, width: 24, speedLimit: 60, roadType: 'arterial' },
    { type:'h', z:0, x1:-360, x2:360, lanes: 1, width: 12, speedLimit: 40, roadType: 'collector' }
  ],
  
  // Add anchor nodes for zoning
  anchorNodes: [
    { x: 0, z: 0, zone: 'Commercial' },
    { x: -400, z: -400, zone: 'Residential' },
    { x: 400, z: 400, zone: 'Industrial' }
  ]
*/

console.log('Integration guide loaded. Apply changes to game_core.js incrementally.');