/**
 * ============================================================================
 * POPPY PLAYTIME PLAYCARE-STYLE CENTRAL HUB & ADVENTURE ARCHITECT
 * (Traffic/adventure-architect.js)
 * ============================================================================
 * Multi-Zone Connected Architecture:
 * - Starting Zone: Detailed House Interior (Safehouse)
 * - Sequential Top-Mounted Objectives (One by One)
 * - Front Door Key Pickup & Door Unlock Mechanism
 * - Big Central Hub Plaza with Roads, Monument, Streetlamps, and Buildings
 * - Power Substation Generator with Breaker Interaction
 * - Apex 3D Tuning Garage Workshop with Configurable Supercar
 * - Main Security Blast Gate with Track Deployment Integration
 * - 3D Waypoint Compass with Distance Markers
 * - Web Audio API Procedural Sound Synthesizer
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
  // ──────────────────────────────────────────────────────────────────────────
  class SoundSynth {
    constructor() {
      this.ctx = null;
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playKeyChime() {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.08);
          osc.stop(this.ctx.currentTime + idx * 0.08 + 0.45);
        });
      } catch (e) {}
    }

    playDoorCreak() {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.65);
      } catch (e) {}
    }

    playPowerHum() {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
      } catch (e) {}
    }

    playObjectiveSuccess() {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      } catch (e) {}
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SEQUENTIAL OBJECTIVE STATE MACHINE (One by One)
  // ──────────────────────────────────────────────────────────────────────────
  class ObjectiveManager {
    constructor(soundSynth) {
      this.sound = soundSynth;
      this.stages = [
        {
          id: 1,
          title: 'Find the Front Door Key inside the House',
          hint: 'Search the study desk in the living room [Press E near Key]',
          icon: '🗝️',
          targetPos: new THREE.Vector3(-47, 1, -2.5),
          targetName: 'Study Desk Key',
          zone: 'safehouse'
        },
        {
          id: 2,
          title: 'Unlock the Front Door and step out into the Hub',
          hint: 'Approach the locked front door and press [E] to unlock',
          icon: '🚪',
          targetPos: new THREE.Vector3(-40, 1.2, -0.9),
          targetName: 'Front Door',
          zone: 'safehouse'
        },
        {
          id: 3,
          title: 'Locate the Substation & Restore Town Generator Power',
          hint: 'Head North into the Central Plaza toward the power plant [E to pull lever]',
          icon: '⚡',
          targetPos: new THREE.Vector3(0, 1.35, -42.8),
          targetName: 'Power Substation',
          zone: 'substation'
        },
        {
          id: 4,
          title: 'Enter the Apex Garage Workshop to Tune your Supercar',
          hint: 'Walk East into the illuminated tuning bay to customize vehicle paint & glow',
          icon: '🔧',
          targetPos: new THREE.Vector3(45, 1.2, 0),
          targetName: 'Apex Garage',
          zone: 'garage'
        },
        {
          id: 5,
          title: 'Proceed through the Main Security Gate to Deploy to Track',
          hint: 'Walk South to the heavy blast gate and launch directly to the Mumbai circuit',
          icon: '🏁',
          targetPos: new THREE.Vector3(0, 1.5, 43),
          targetName: 'Main Blast Gate',
          zone: 'gate'
        }
      ];

      this.currentStage = 1;
      this.hasKey = false;
      this.isDoorUnlocked = false;
      this.isPowerRestored = false;
      this.isCarTuned = false;
    }

    getCurrent() {
      return this.stages[this.currentStage - 1] || this.stages[this.stages.length - 1];
    }

    advance(newStage) {
      if (newStage > this.currentStage && newStage <= this.stages.length) {
        this.currentStage = newStage;
        this.sound.playObjectiveSuccess();
        this.updateHUD();

        const stage = this.getCurrent();
        if (window.toast) {
          window.toast(`🎯 OBJECTIVE UPDATED: ${stage.title}`, '#34d399', 4000);
        }
      }
    }

    updateHUD() {
      const stage = this.getCurrent();
      const badge = document.getElementById('objective-stage-badge');
      const title = document.getElementById('objective-title');
      const hint = document.getElementById('objective-hint');
      const icon = document.getElementById('objective-icon');

      if (badge) badge.innerText = `OBJECTIVE ${stage.id} OF 5`;
      if (title) title.innerText = stage.title;
      if (hint) hint.innerText = stage.hint;
      if (icon) icon.innerText = stage.icon;

      const card = document.getElementById('top-objective-hud');
      if (card) {
        card.classList.remove('objective-pulse');
        void card.offsetWidth;
        card.classList.add('objective-pulse');
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ADVENTURE ARCHITECT MAIN CLASS
  // ──────────────────────────────────────────────────────────────────────────
  class AdventureArchitect {
    constructor(scene) {
      this.scene = scene;
      this.sound = new SoundSynth();
      this.objectives = new ObjectiveManager(this.sound);
      this.modelRegistry = new window.ModelRegistry(scene);

      // Player physical collision state
      this.playerPos = new THREE.Vector3(-45, 1.65, 2); // Spawns inside House Interior
      this.playerVelocity = new THREE.Vector3();
      this.colliders = []; // Array of THREE.Box3

      // Interactive components
      this.keyMesh = null;
      this.doorGroup = null;
      this.powerLever = null;
      this.blastGateGroup = null;
      this.carMesh = null;
      this.carTurntable = null;
      this.streetlights = [];
      this.interactiveRange = 2.4;

      // Key movement inputs
      this.keys = { w: false, a: false, s: false, d: false, Shift: false, e: false };

      // In-world waypoint visual
      this.waypointGroup = null;
      this.buildWaypointMarker();
    }

    /**
     * 3D Floating Diamond Waypoint Indicator
     */
    buildWaypointMarker() {
      const group = new THREE.Group();
      const diamondGeo = new THREE.OctahedronGeometry(0.5, 0);
      const diamondMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      group.add(diamond);

      const coreGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Light beacon beam
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 4, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = -2;
      group.add(beam);

      this.scene.add(group);
      this.waypointGroup = group;
    }

    /**
     * Build the entire adventure world:
     * 1. House Interior (Safehouse Start)
     * 2. Big Central Hub (Courtyard, Roads, Town buildings)
     * 3. Substation Facility
     * 4. Apex 3D Garage Bay
     * 5. Main Track Blast Gate
     */
    buildWorld() {
      console.log('[AdventureArchitect] Constructing Poppy Playtime Playcare-style Big Central Hub...');

      this.buildHouseInterior();
      this.buildCentralHubPlaza();
      this.buildSubstation();
      this.buildApexGarage();
      this.buildMainTrackGate();
      this.loadExternalModels();

      this.objectives.updateHUD();
    }

    /**
     * ZONE 1: House Interior (Player Starting Safehouse at X: -45, Z: 0)
     */
    buildHouseInterior() {
      const houseGroup = new THREE.Group();
      houseGroup.position.set(-45, 0, 0);

      // Room dimensions: 10m wide x 3.6m high x 10m deep
      const w = 10, h = 3.6, d = 10;

      // 1. Polished Wood Floor
      const floorTex = this.createFloorTexture();
      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.4,
        metalness: 0.1
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      houseGroup.add(floor);

      // 2. Ceiling with acoustic tiles & warm fixture
      const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
      ceiling.position.y = h;
      ceiling.rotation.x = Math.PI / 2;
      houseGroup.add(ceiling);

      // 3. Walls (Cozy interior wallpaper tone)
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });

      // Back wall (-Z)
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), wallMat);
      backWall.position.set(0, h / 2, -d / 2);
      houseGroup.add(backWall);
      this.addCollider(new THREE.Box3().setFromObject(backWall).translate(houseGroup.position));

      // Left wall (-X)
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, d), wallMat);
      leftWall.position.set(-w / 2, h / 2, 0);
      houseGroup.add(leftWall);
      this.addCollider(new THREE.Box3().setFromObject(leftWall).translate(houseGroup.position));

      // South wall (+Z)
      const southWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), wallMat);
      southWall.position.set(0, h / 2, d / 2);
      houseGroup.add(southWall);
      this.addCollider(new THREE.Box3().setFromObject(southWall).translate(houseGroup.position));

      // Front wall facing the Hub (+X direction): includes doorway opening in center
      const wallSegZ = (d - 1.8) / 2;
      const frontWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, wallSegZ), wallMat);
      frontWall1.position.set(w / 2, h / 2, -d / 2 + wallSegZ / 2);
      houseGroup.add(frontWall1);
      this.addCollider(new THREE.Box3().setFromObject(frontWall1).translate(houseGroup.position));

      const frontWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, wallSegZ), wallMat);
      frontWall2.position.set(w / 2, h / 2, d / 2 - wallSegZ / 2);
      houseGroup.add(frontWall2);
      this.addCollider(new THREE.Box3().setFromObject(frontWall2).translate(houseGroup.position));

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.3, h - 2.4, 1.8), wallMat);
      lintel.position.set(w / 2, 2.4 + (h - 2.4) / 2, 0);
      houseGroup.add(lintel);

      // 4. Interactive Front Door
      const doorGroup = new THREE.Group();
      doorGroup.position.set(w / 2, 0, -0.9); // Hinge pivot at frame edge

      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 2.35, 1.76),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5, metalness: 0.2 })
      );
      doorPanel.position.set(0, 1.175, 0.88);
      doorPanel.castShadow = true;
      doorGroup.add(doorPanel);

      // Brass Handle & Deadbolt
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0.06, 1.05, 1.55);
      doorGroup.add(handle);

      // Lock indicator status LED
      const lockLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      lockLed.position.set(0.06, 1.25, 1.55);
      doorGroup.add(lockLed);
      doorGroup.userData = { led: lockLed, isOpen: false, isLocked: true };

      houseGroup.add(doorGroup);
      this.doorGroup = doorGroup;

      // 5. Interior Living Room Props: Desk, Chair, Books, Lamp
      this.buildHouseFurniture(houseGroup);

      // 6. Cozy Interior Warm Downlight
      const warmLight = new THREE.PointLight(0xfef3c7, 0.85, 14);
      warmLight.position.set(0, 3.2, 0);
      warmLight.castShadow = true;
      houseGroup.add(warmLight);

      this.scene.add(houseGroup);
    }

    createFloorTexture() {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#92400e';
      for (let y = 0; y < 256; y += 32) {
        ctx.fillRect(0, y, 256, 30);
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      return tex;
    }

    buildHouseFurniture(houseGroup) {
      // Study Desk at (-2, 0, -2.5) relative to house center
      const deskTop = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 })
      );
      deskTop.position.set(-2, 0.85, -2.5);
      deskTop.castShadow = true;
      houseGroup.add(deskTop);

      // Desk legs
      const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.1);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
      [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([ox, oz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(-2 + ox, 0.425, -2.5 + oz);
        houseGroup.add(leg);
      });

      // Desk Lamp with subtle glow
      const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 0.05, 12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
      );
      lampBase.position.set(-2.8, 0.92, -2.8);
      houseGroup.add(lampBase);

      const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.22, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      lampShade.position.set(-2.8, 1.3, -2.8);
      houseGroup.add(lampShade);

      const deskLight = new THREE.PointLight(0xfef08a, 0.7, 4);
      deskLight.position.set(-2.8, 1.25, -2.8);
      houseGroup.add(deskLight);

      // Sofa in living room area
      const sofaBase = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.5, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 })
      );
      sofaBase.position.set(-2, 0.25, 2.5);
      houseGroup.add(sofaBase);

      const sofaBack = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.7, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 })
      );
      sofaBack.position.set(-2, 0.85, 3.0);
      houseGroup.add(sofaBack);

      // Wall Painting
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.2, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      frame.position.set(0, 2.2, -4.85);
      houseGroup.add(frame);

      // Golden Key Item placed on the Desk!
      this.buildGoldenKey(houseGroup);
    }

    buildGoldenKey(houseGroup) {
      const keyGroup = new THREE.Group();
      keyGroup.position.set(-2, 0.98, -2.5); // On top of desk

      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.35
      });

      // Key ring / head
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), goldMat);
      ring.rotation.x = Math.PI / 2;
      keyGroup.add(ring);

      // Key shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), goldMat);
      shaft.rotation.z = Math.PI / 2;
      shaft.position.x = 0.16;
      keyGroup.add(shaft);

      // Key teeth
      const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), goldMat);
      tooth1.position.set(0.24, -0.03, 0);
      keyGroup.add(tooth1);
      const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), goldMat);
      tooth2.position.set(0.20, -0.02, 0);
      keyGroup.add(tooth2);

      // Glowing beacon particle halo
      const haloGeo = new THREE.RingGeometry(0.2, 0.28, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.05;
      keyGroup.add(halo);

      houseGroup.add(keyGroup);
      this.keyMesh = keyGroup;
    }

    /**
     * ZONE 2: Big Central Hub Plaza (Center at 0, 0, 0)
     */
    buildCentralHubPlaza() {
      const hubGroup = new THREE.Group();

      // Vast Grass Ground & Courtyard (140m x 140m)
      const groundGeo = new THREE.PlaneGeometry(140, 140);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x14281d, // Deep park green
        roughness: 0.9,
        metalness: 0.05
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      hubGroup.add(ground);

      // Central Cobblestone Plaza Ring (Radius 22m)
      const plazaGeo = new THREE.RingGeometry(0, 22, 32);
      const plazaMat = new THREE.MeshStandardMaterial({
        color: 0x334155, // Slate plaza stones
        roughness: 0.7
      });
      const plaza = new THREE.Mesh(plazaGeo, plazaMat);
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.y = 0.02;
      plaza.receiveShadow = true;
      hubGroup.add(plaza);

      // Perimeter Roadways connecting the 4 Cardinals (North, South, East, West)
      this.buildRoadNetwork(hubGroup);

      // Central Monument / Spire (Playcare style centerpiece)
      this.buildCentralMonument(hubGroup);

      // Streetlamp Network
      this.buildStreetlampNetwork(hubGroup);

      // Exterior Facade of House A (Safehouse)
      this.buildHouseAExterior(hubGroup);

      // Boundary Mountains / High Walls
      this.buildPerimeterWalls(hubGroup);

      this.scene.add(hubGroup);
    }

    buildRoadNetwork(hubGroup) {
      const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.8 });
      const roadW = 8;

      // North-South Arterial Highway (from Substation Z: -55 to Gate Z: +55)
      const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(roadW, 110), asphaltMat);
      nsRoad.rotation.x = -Math.PI / 2;
      nsRoad.position.set(0, 0.03, 0);
      hubGroup.add(nsRoad);

      // East-West Arterial Highway (from House A X: -55 to Garage X: +55)
      const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(110, roadW), asphaltMat);
      ewRoad.rotation.x = -Math.PI / 2;
      ewRoad.position.set(0, 0.03, 0);
      hubGroup.add(ewRoad);

      // Yellow Road Centerlines
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const nsLine = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 100), lineMat);
      nsLine.rotation.x = -Math.PI / 2;
      nsLine.position.set(0, 0.04, 0);
      hubGroup.add(nsLine);

      const ewLine = new THREE.Mesh(new THREE.PlaneGeometry(100, 0.25), lineMat);
      ewLine.rotation.x = -Math.PI / 2;
      ewLine.position.set(0, 0.04, 0);
      hubGroup.add(ewLine);
    }

    buildCentralMonument(hubGroup) {
      const monGroup = new THREE.Group();
      monGroup.position.set(0, 0, 0);

      // Multi-tier stone dais
      const base1 = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 7.5, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
      );
      base1.position.y = 0.3;
      monGroup.add(base1);

      const base2 = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 5, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      base2.position.y = 0.9;
      monGroup.add(base2);

      // Bronze Obelisk / Traffic Academy Trophy
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 9, 8),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.25
        })
      );
      spire.position.y = 5.5;
      spire.castShadow = true;
      monGroup.add(spire);

      // Surrounding Decorative Benches & Foliage
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const bx = Math.cos(angle) * 12;
        const bz = Math.sin(angle) * 12;
        this.buildBench(monGroup, bx, bz, angle + Math.PI / 2);
      }

      hubGroup.add(monGroup);
    }

    buildBench(group, x, z, rotY) {
      const bench = new THREE.Group();
      bench.position.set(x, 0, z);
      bench.rotation.y = rotY;

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 })
      );
      seat.position.y = 0.45;
      bench.add(seat);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 })
      );
      back.position.set(0, 0.8, -0.25);
      bench.add(back);

      group.add(bench);
    }

    buildStreetlampNetwork(hubGroup) {
      const lampPositions = [
        [-15, -15], [15, -15], [-15, 15], [15, 15],
        [-6, -32], [6, -32],
        [-6, 32], [6, 32],
        [32, -6], [32, 6],
        [-32, -6], [-32, 6]
      ];

      lampPositions.forEach(([lx, lz]) => {
        const post = new THREE.Group();
        post.position.set(lx, 0, lz);

        // Metal Pole (5m tall)
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.14, 5, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
        );
        pole.position.y = 2.5;
        pole.castShadow = true;
        post.add(pole);

        // Lamp head lantern
        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.4, 0.6),
          new THREE.MeshStandardMaterial({
            color: 0x111827,
            metalness: 0.9,
            roughness: 0.1
          })
        );
        lantern.position.y = 5.1;
        post.add(lantern);

        // Glowing bulb mesh
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x475569 })
        );
        bulb.position.y = 4.9;
        post.add(bulb);

        // Streetlamp light source
        const light = new THREE.PointLight(0xfef08a, 0, 22);
        light.position.set(0, 4.8, 0);
        post.add(light);

        this.streetlights.push({ bulb, light });
        hubGroup.add(post);
      });
    }

    buildHouseAExterior(hubGroup) {
      const houseExt = new THREE.Group();
      houseExt.position.set(-45, 0, 0);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(8.2, 3.5, 4),
        new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.6 })
      );
      roof.position.set(0, 5.3, 0);
      roof.rotation.y = Math.PI / 4;
      houseExt.add(roof);

      const porch = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.2, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
      );
      porch.position.set(6.2, 0.1, 0);
      houseExt.add(porch);

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, emissive: 0x06b6d4, emissiveIntensity: 0.3 })
      );
      sign.position.set(5.15, 2.7, 0);
      houseExt.add(sign);

      hubGroup.add(houseExt);
    }

    buildPerimeterWalls(hubGroup) {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const size = 135;
      const h = 8;

      const walls = [
        { x: 0, z: -size / 2, w: size, d: 2 },
        { x: 0, z: size / 2, w: size, d: 2 },
        { x: -size / 2, z: 0, w: 2, d: size },
        { x: size / 2, z: 0, w: 2, d: size }
      ];

      walls.forEach((wDef) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(wDef.w, h, wDef.d), wallMat);
        wall.position.set(wDef.x, h / 2, wDef.z);
        hubGroup.add(wall);
        this.addCollider(new THREE.Box3().setFromObject(wall));
      });
    }

    /**
     * ZONE 3: Substation Generator Facility (North at X: 0, Z: -45)
     */
    buildSubstation() {
      const subGroup = new THREE.Group();
      subGroup.position.set(0, 0, -45);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.4, 14),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
      );
      base.position.y = 0.2;
      subGroup.add(base);

      const coilMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
      [-4, 4].forEach((cx) => {
        const transformer = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.5, 3.2), coilMat);
        transformer.position.set(cx, 2.45, -2);
        transformer.castShadow = true;
        subGroup.add(transformer);
        this.addCollider(new THREE.Box3().setFromObject(transformer).translate(subGroup.position));

        for (let b = 0; b < 3; b++) {
          const bushing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.25, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2 })
          );
          bushing.position.set(cx - 0.8 + b * 0.8, 5.2, -2);
          subGroup.add(bushing);
        }
      });

      const consoleBase = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      );
      consoleBase.position.set(0, 0.8, 2);
      subGroup.add(consoleBase);

      const hazardSign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.2 })
      );
      hazardSign.position.set(0, 1.2, 2.61);
      subGroup.add(hazardSign);

      const leverPivot = new THREE.Group();
      leverPivot.position.set(0, 1.35, 2.2);

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 })
      );
      handle.position.y = 0.3;
      leverPivot.add(handle);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      knob.position.y = 0.6;
      leverPivot.add(knob);

      leverPivot.rotation.x = -Math.PI / 4;
      subGroup.add(leverPivot);
      this.powerLever = leverPivot;

      const strobe = new THREE.PointLight(0xef4444, 0.8, 16);
      strobe.position.set(0, 3.8, 2);
      subGroup.add(strobe);
      subGroup.userData = { strobe, active: false };

      this.scene.add(subGroup);
    }

    /**
     * ZONE 4: Apex 3D Tuning Garage Workshop (East at X: 45, Z: 0)
     */
    buildApexGarage() {
      const garageGroup = new THREE.Group();
      garageGroup.position.set(45, 0, 0);

      const floorMat = new THREE.MeshStandardMaterial({ color: 0x181b22, roughness: 0.25, metalness: 0.1 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.04;
      floor.receiveShadow = true;
      garageGroup.add(floor);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(21, 0.8, 21),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      roof.position.y = 7;
      garageGroup.add(roof);

      const neonTrim = new THREE.Mesh(
        new THREE.BoxGeometry(19, 0.1, 19),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      );
      neonTrim.position.y = 6.55;
      garageGroup.add(neonTrim);

      const turntableGroup = new THREE.Group();
      turntableGroup.position.set(0, 0.1, 0);

      const tableDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(4.8, 5.0, 0.15, 32),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
      );
      turntableGroup.add(tableDisc);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(4.4, 4.6, 32),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      turntableGroup.add(ring);

      this.buildSupercar(turntableGroup);

      garageGroup.add(turntableGroup);
      this.carTurntable = turntableGroup;

      const carSpot = new THREE.SpotLight(0xffffff, 1.6, 25, Math.PI / 5, 0.4);
      carSpot.position.set(0, 6.4, 0);
      carSpot.target = turntableGroup;
      garageGroup.add(carSpot);

      this.scene.add(garageGroup);
    }

    buildSupercar(parent) {
      const carGroup = new THREE.Group();
      carGroup.position.set(0, 0.2, 0);

      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0xdc2626,
        metalness: 0.85,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08
      });

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 4.6), bodyMat);
      body.position.y = 0.5;
      body.castShadow = true;
      carGroup.add(body);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.48, 2.2),
        new THREE.MeshPhysicalMaterial({
          color: 0x030712,
          roughness: 0.05,
          transmission: 0.8,
          thickness: 0.5
        })
      );
      cabin.position.set(0, 0.95, -0.2);
      carGroup.add(cabin);

      const wingMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.4), wingMat);
      wing.position.set(0, 1.25, 2.1);
      carGroup.add(wing);

      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 18);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
      [[-1.05, -1.4], [1.05, -1.4], [-1.05, 1.4], [1.05, 1.4]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.38, wz);
        carGroup.add(wheel);
      });

      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), glowMat);
      underglow.rotation.x = -Math.PI / 2;
      underglow.position.y = 0.05;
      carGroup.add(underglow);

      carGroup.userData = { bodyMat, glowMat };
      parent.add(carGroup);
      this.carMesh = carGroup;
    }

    /**
     * ZONE 5: Main Track Blast Gate (South at X: 0, Z: 45)
     */
    buildMainTrackGate() {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(0, 0, 45);

      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      [-7, 7].forEach((tx) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 9, 3.5), towerMat);
        tower.position.set(tx, 4.5, 0);
        tower.castShadow = true;
        gateGroup.add(tower);
        this.addCollider(new THREE.Box3().setFromObject(tower).translate(gateGroup.position));
      });

      const arch = new THREE.Mesh(
        new THREE.BoxGeometry(17.5, 1.8, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      arch.position.set(0, 8.5, 0);
      gateGroup.add(arch);

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(11, 1.0, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.6
        })
      );
      sign.position.set(0, 8.5, -1.65);
      gateGroup.add(sign);

      const doorL = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 7.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
      );
      doorL.position.set(-2.6, 3.75, 0);
      gateGroup.add(doorL);

      const doorR = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 7.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
      );
      doorR.position.set(2.6, 3.75, 0);
      gateGroup.add(doorR);

      const gateBeacon = new THREE.PointLight(0xef4444, 0.8, 14);
      gateBeacon.position.set(0, 9.8, 0);
      gateGroup.add(gateBeacon);

      gateGroup.userData = { doorL, doorR, beacon: gateBeacon, isOpen: false };
      this.blastGateGroup = gateGroup;

      this.scene.add(gateGroup);
    }

    /**
     * Load Extracted User Models from /models/ directory:
     * - School / Academy: models/musik_school.glb
     * - House B: models/building_04/building_04.obj
     * - Town props: models/city_pack/
     */
    loadExternalModels() {
      // 0. Safehouse Detailed Interior Furniture (User Downloaded Model from ivkwwche5p1c-001.rar)
      this.modelRegistry.loadOBJ('models/house_interior/house interior.obj', 'models/house_interior/house interior.mtl', {
        position: [-45, 0, 0],
        scale: 0.022,
        rotation: [0, 0, 0]
      }).then((model) => {
        this.scene.add(model);
        console.log('[AdventureArchitect] Successfully loaded House Interior OBJ model');
      }).catch((err) => {
        console.warn('[AdventureArchitect] House interior model fallback active:', err);
      });

      // 1. Academy / School Building (models/musik_school.glb)
      this.modelRegistry.loadGLB('models/musik_school.glb', {
        position: [32, 0, -32],
        scale: 1.2,
        rotation: [0, -Math.PI / 4, 0]
      }).then((model) => {
        this.scene.add(model);
        console.log('[AdventureArchitect] Successfully loaded Musik School Academy model');
      }).catch(() => {
        this.buildProceduralAcademy(32, -32);
      });

      // 2. House B (models/building_04/building_04.obj)
      this.modelRegistry.loadOBJ('models/building_04/building_04.obj', 'models/building_04/building_04.mtl', {
        position: [-28, 0, -28],
        scale: 1.5,
        rotation: [0, Math.PI / 4, 0]
      }).then((model) => {
        this.scene.add(model);
        console.log('[AdventureArchitect] Successfully loaded Building 04 model');
      }).catch(() => {
        this.buildProceduralHouseB(-28, -28);
      });

      // 3. City Pack Buildings & Props
      this.modelRegistry.loadGLB('models/city_pack/Big Building.glb', {
        position: [-35, 0, 32],
        scale: 1.4,
        rotation: [0, Math.PI / 2, 0]
      }).then((m) => this.scene.add(m)).catch(() => {});

      this.modelRegistry.loadGLB('models/city_pack/Building Red.glb', {
        position: [-35, 0, -45],
        scale: 1.2,
        rotation: [0, 0, 0]
      }).then((m) => this.scene.add(m)).catch(() => {});

      this.modelRegistry.loadGLB('models/city_pack/Building Green.glb', {
        position: [28, 0, -45],
        scale: 1.2,
        rotation: [0, 0, 0]
      }).then((m) => this.scene.add(m)).catch(() => {});

      this.modelRegistry.loadGLB('models/city_pack/Bus Stop.glb', {
        position: [-8, 0, 18],
        scale: 1.0,
        rotation: [0, Math.PI, 0]
      }).then((m) => this.scene.add(m)).catch(() => {});

      this.modelRegistry.loadGLB('models/city_pack/Bench.glb', {
        position: [0, 0, 14],
        scale: 1.2,
        rotation: [0, Math.PI, 0]
      }).then((m) => this.scene.add(m)).catch(() => {});

      this.modelRegistry.loadGLB('models/city_pack/Dumpster.glb', {
        position: [10, 0, -44],
        scale: 1.1,
        rotation: [0, 0, 0]
      }).then((m) => this.scene.add(m)).catch(() => {});
    }

    buildProceduralAcademy(x, z) {
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(18, 12, 14),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
      );
      bldg.position.set(x, 6, z);
      this.scene.add(bldg);
      this.addCollider(new THREE.Box3().setFromObject(bldg));
    }

    buildProceduralHouseB(x, z) {
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 10),
        new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.8 })
      );
      house.position.set(x, 4, z);
      this.scene.add(house);
      this.addCollider(new THREE.Box3().setFromObject(house));
    }

    addCollider(box3) {
      this.colliders.push(box3);
    }

    setCarPaint(paintHex, glowHex) {
      if (!this.carMesh) return;
      if (paintHex !== null && this.carMesh.userData.bodyMat) {
        this.carMesh.userData.bodyMat.color.setHex(paintHex);
      }
      if (glowHex !== null && this.carMesh.userData.glowMat) {
        this.carMesh.userData.glowMat.color.setHex(glowHex);
      }
    }

    interact(camera) {
      const p = this.playerPos;

      // 1. Stage 1: Desk Golden Key interaction
      if (this.objectives.currentStage === 1 && this.keyMesh) {
        const keyWorldPos = new THREE.Vector3();
        this.keyMesh.getWorldPosition(keyWorldPos);
        if (p.distanceTo(keyWorldPos) < this.interactiveRange) {
          this.sound.playKeyChime();
          this.objectives.hasKey = true;
          this.scene.remove(this.keyMesh);
          if (this.keyMesh.parent) this.keyMesh.parent.remove(this.keyMesh);
          this.keyMesh = null;
          this.objectives.advance(2);
          if (window.toast) {
            window.toast('🗝️ FRONT DOOR KEY COLLECTED! Go to the front door.', '#fbbf24', 4000);
          }
          return;
        }
      }

      // 2. Stage 2: Front Door interaction
      if (this.doorGroup) {
        const doorWorldPos = new THREE.Vector3();
        this.doorGroup.getWorldPosition(doorWorldPos);
        if (p.distanceTo(doorWorldPos) < this.interactiveRange + 0.8) {
          if (!this.objectives.hasKey) {
            if (window.toast) window.toast('🔒 The front door is locked! Search the house for the key first.', '#ef4444', 3000);
            return;
          }

          if (!this.doorGroup.userData.isOpen) {
            this.sound.playDoorCreak();
            this.doorGroup.userData.isOpen = true;
            this.doorGroup.userData.isLocked = false;
            if (this.doorGroup.userData.led) {
              this.doorGroup.userData.led.material.color.setHex(0x10b981);
            }
            this.doorGroup.rotation.y = -Math.PI / 2;
            this.objectives.isDoorUnlocked = true;
            this.objectives.advance(3);
            if (window.toast) {
              window.toast('🚪 Front door unlocked! Step out into the Big Central Hub.', '#10b981', 4000);
            }
            return;
          }
        }
      }

      // 3. Stage 3: Substation Generator Lever
      if (this.powerLever) {
        const leverWorldPos = new THREE.Vector3();
        this.powerLever.getWorldPosition(leverWorldPos);
        if (p.distanceTo(leverWorldPos) < this.interactiveRange + 1.2) {
          if (this.objectives.currentStage <= 2) {
            if (window.toast) window.toast('⚠️ Leave the safehouse first before restoring town power.', '#f59e0b', 3000);
            return;
          }

          if (!this.objectives.isPowerRestored) {
            this.sound.playPowerHum();
            this.powerLever.rotation.x = Math.PI / 4;
            this.objectives.isPowerRestored = true;

            this.streetlights.forEach(({ bulb, light }) => {
              bulb.material.color.setHex(0xfef08a);
              light.intensity = 1.4;
            });

            this.objectives.advance(4);
            if (window.toast) {
              window.toast('⚡ TOWN POWER RESTORED! Streetlights and Garage are online.', '#06b6d4', 5000);
            }
            return;
          }
        }
      }

      // 4. Stage 4 / 5: Apex Garage / Supercar interaction
      if (this.carMesh) {
        const carWorldPos = new THREE.Vector3();
        this.carMesh.getWorldPosition(carWorldPos);
        if (p.distanceTo(carWorldPos) < this.interactiveRange + 2.5) {
          if (this.objectives.currentStage === 4) {
            this.objectives.advance(5);
            if (window.toast) {
              window.toast('🔧 Vehicle tuned and ready! Proceed south to the Main Blast Gate.', '#a855f7', 4000);
            }
          }
        }
      }

      // 5. Stage 5: Main Track Blast Gate
      if (this.blastGateGroup) {
        const gateWorldPos = new THREE.Vector3();
        this.blastGateGroup.getWorldPosition(gateWorldPos);
        if (p.distanceTo(gateWorldPos) < this.interactiveRange + 3.0) {
          if (this.objectives.currentStage === 5) {
            if (window.deployToTestTrack) {
              window.deployToTestTrack();
            }
          } else {
            if (window.toast) {
              window.toast('🔒 Track Gate is sealed! Complete current objectives first.', '#ef4444', 3000);
            }
          }
        }
      }
    }

    bindControls() {
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') this.keys.w = true;
        if (k === 'a') this.keys.a = true;
        if (k === 's') this.keys.s = true;
        if (k === 'd') this.keys.d = true;
        if (e.shiftKey) this.keys.Shift = true;
        if (k === 'e') {
          this.interact();
        }
      });

      window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') this.keys.w = false;
        if (k === 'a') this.keys.a = false;
        if (k === 's') this.keys.s = false;
        if (k === 'd') this.keys.d = false;
        if (!e.shiftKey) this.keys.Shift = false;
      });
    }

    update(delta, camera) {
      if (this.carTurntable) {
        this.carTurntable.rotation.y += delta * 0.4;
      }

      if (this.keyMesh) {
        this.keyMesh.rotation.y += delta * 1.5;
        this.keyMesh.position.y = 0.98 + Math.sin(Date.now() * 0.004) * 0.06;
      }

      const curObjective = this.objectives.getCurrent();
      if (curObjective && this.waypointGroup) {
        this.waypointGroup.position.copy(curObjective.targetPos);
        this.waypointGroup.rotation.y += delta * 2.0;

        const dist = Math.round(this.playerPos.distanceTo(curObjective.targetPos));
        const distEl = document.getElementById('objective-distance');
        if (distEl) {
          distEl.innerText = `${dist}m to ${curObjective.targetName}`;
        }
      }

      const moveSpeed = this.keys.Shift ? 9.0 : 4.8;
      const moveVector = new THREE.Vector3();

      if (this.keys.w) moveVector.z -= 1;
      if (this.keys.s) moveVector.z += 1;
      if (this.keys.a) moveVector.x -= 1;
      if (this.keys.d) moveVector.x += 1;

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();
        const yaw = camera.rotation.y;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const worldX = moveVector.x * cos + moveVector.z * sin;
        const worldZ = -moveVector.x * sin + moveVector.z * cos;

        this.playerPos.x += worldX * moveSpeed * delta;
        this.playerPos.z += worldZ * moveSpeed * delta;

        this.playerPos.x = Math.max(-65, Math.min(65, this.playerPos.x));
        this.playerPos.z = Math.max(-65, Math.min(65, this.playerPos.z));
      }

      camera.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    }
  }

  window.AdventureArchitect = AdventureArchitect;
})(window);
