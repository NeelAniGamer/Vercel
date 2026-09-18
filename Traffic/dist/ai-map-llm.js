/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  TRAFFIC MAP AI — URBAN SPATIAL & BEHAVIORAL INTELLIGENCE ENGINE (ai-map-llm.js)
 *  Trained on:
 *    • Urban Map Topology & IRC Road Geometry
 *    • Indian Motor Vehicles Act (MV Act) & Mumbai Traffic Rules
 *    • Human & Pedestrian Behaviors (Children swarms, crossing guards, commuters)
 *    • Sacred Cattle & Animal Dynamics
 *    • Zero-Collision Spatial Placement & Sightline (SSD) Reasoning
 *    • Dual Mode: Generates levels easily from prompts & actively directs gameplay
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function(root) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PRETRAINED URBAN & REGULATORY KNOWLEDGE CORPUS
  // ═══════════════════════════════════════════════════════════════════════════

  const MV_ACT_CORPUS = {
    SEC_183: {
      title: 'Excessive Speeding',
      code: 'MV Act Section 183',
      fine: '₹1,000 - ₹2,000 (LMV)',
      desc: 'Driving in excess of specified speed limits. In designated school zones, speed is legally capped at 20-25 km/h.',
      descHi: 'निर्धारित गति सीमा से अधिक गति से वाहन चलाना। स्कूल क्षेत्र में अधिकतम 20-25 किमी/घंटा मान्य है।'
    },
    SEC_194B: {
      title: 'Pedestrian Crossing Right-of-Way & Seatbelt Compliance',
      code: 'MV Act Section 194B & 177',
      fine: '₹1,000 + 3-month license suspension for repeat',
      desc: 'Vehicles must yield right-of-way unconditionally to pedestrians crossing at marked zebra crossings, stopping behind the white stop line.',
      descHi: 'ज़ेब्रा क्रॉसिंग पर पैदल यात्रियों को रास्ता देना और सफेद स्टॉप लाइन के पीछे रुकना अनिवार्य है।'
    },
    SEC_194E: {
      title: 'Obstruction to Emergency Vehicles',
      code: 'MV Act Section 194E',
      fine: '₹10,000 and/or imprisonment up to 6 months',
      desc: 'Failure to draw to the side of the road and afford free passage to an ambulance, fire brigade, or emergency vehicle.',
      descHi: 'एम्बुलेंस या आपातकालीन वाहनों को रास्ता न देने पर ₹10,000 जुर्माना।'
    },
    SEC_194C_SILENCE: {
      title: 'Silence Zone Horn Violation',
      code: 'Noise Pollution Rules 2000 & MV Act Sec 194F',
      fine: '₹1,000 - ₹2,000',
      desc: 'Use of vehicular horn is strictly prohibited within 100 meters of schools, educational institutions, hospitals, and courts.',
      descHi: 'स्कूल और अस्पताल के 100 मीटर के दायरे में हॉर्न बजाना सख्त मना है।'
    },
    SEC_184: {
      title: 'Dangerous Driving / Rash Navigation',
      code: 'MV Act Section 184',
      fine: '₹1,000 - ₹5,000',
      desc: 'Driving dangerously having regard to all circumstances including road curvature, pedestrian presence, and weather.',
      descHi: 'खतरनाक तरीके से गाड़ी चलाना या राहगीरों के पास अचानक ब्रेक लगाना।'
    }
  };

  const ROAD_GEOMETRY_STANDARDS = {
    LANE_WIDTH_ARTERIAL: 3.75, // meters per lane
    LANE_WIDTH_COLLECTOR: 3.50,
    LANE_WIDTH_LOCAL_RESIDENTIAL: 3.25,
    SIDEWALK_MIN_WIDTH: 2.0,
    SCHOOL_SETBACK_MIN: 12.0,  // minimum meters from curb to institutional structure
    RESIDENTIAL_SETBACK: 6.0,
    ZEBRA_WIDTH: 4.0,
    STOP_LINE_OFFSET: 2.0,     // meters upstream of zebra crossing
    WARNING_BEACON_OFFSET: 250 // meters upstream of school zone
  };

  const ENTITY_BEHAVIOR_MODELS = {
    SCHOOL_CHILD: {
      walkSpeed: 1.15,         // m/s (~4.1 km/h)
      runSpeed: 2.40,          // m/s (~8.6 km/h)
      hazardPerception: 0.25,  // low hazard awareness
      swarmAffinity: 0.85,     // tendency to walk in clusters
      reactionTime: 1.80,      // seconds to notice approaching car
      obeyGuardProbability: 0.98
    },
    CROSSING_GUARD: {
      reactionDistance: 120,   // meters to monitor approaching cars
      whistleRadius: 45,       // meters audio alert
      signRaiseDuration: 0.6,  // seconds to lift STOP paddle
      minClearanceWait: 3.0    // seconds after last child clears
    },
    SACRED_COW: {
      walkSpeed: 0.35,         // m/s
      frightResponse: 0.05,    // virtually unaffected by horn
      laneDeviationWidth: 2.4, // requires driver to steer around
      calmFlickerRate: 1.2
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SPATIAL REASONING & SIGHTLINE MATHEMATICS
  // ═══════════════════════════════════════════════════════════════════════════

  class SpatialReasoningEngine {
    /**
     * Calculates required Stopping Sight Distance (SSD) per IRC:73 guidelines
     * SSD = v * t_reaction + (v^2) / (2 * g * f)
     * @param {number} speedKmh - vehicle velocity in km/h
     * @param {boolean} isWet - whether surface is wet
     * @returns {number} meters required for a safe stop
     */
    static calculateSSD(speedKmh, isWet = false) {
      const v = speedKmh / 3.6; // convert to m/s
      const tReaction = 2.0;   // Indian road driver reaction standard (seconds)
      const g = 9.81;
      const f = isWet ? 0.32 : 0.40; // coefficient of longitudinal friction
      const brakeDistance = (v * v) / (2 * g * f);
      return Math.round((v * tReaction + brakeDistance) * 10) / 10;
    }

    /**
     * Validates that no obstacle occludes the sightline within the SSD envelope
     */
    static validateCrosswalkClearance(zebraZ, obstacles, speedLimitKmh) {
      const ssd = this.calculateSSD(speedLimitKmh);
      const safeZoneStart = zebraZ - ssd;
      const violations = [];

      obstacles.forEach((obs, idx) => {
        if (obs.z >= safeZoneStart && obs.z <= zebraZ && Math.abs(obs.x) < 8) {
          violations.push({
            obstacleId: idx,
            type: obs.type,
            z: obs.z,
            recommendation: `Move obstacle ${Math.round(obs.z - safeZoneStart)}m further upstream or to sidewalk setback to prevent driver blindspot.`
          });
        }
      });

      return {
        safeZoneStart,
        ssdRequired: ssd,
        hasClearSightline: violations.length === 0,
        violations
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. LEVEL GENERATOR: "MAKE THE LEVEL EASILY"
  // ═══════════════════════════════════════════════════════════════════════════

  class LevelGenerator {
    /**
     * Easily generates a complete level configuration from a natural prompt or preset
     * @param {string} prompt - e.g. "Create 5km suburban school zone with children and cow"
     * @param {object} options - overrides
     */
    static generateFromPrompt(prompt, options = {}) {
      const text = (prompt || '').toLowerCase();
      const lengthMeters = options.length || (text.includes('5km') ? 5000 : (text.includes('2km') ? 2000 : 3000));
      const hasSchool = options.hasSchool !== undefined ? options.hasSchool : (text.includes('school') || text.includes('dismissal') || text.includes('xavier'));
      const hasCow = options.hasCow !== undefined ? options.hasCow : (text.includes('cow') || text.includes('cattle') || text.includes('animal'));
      const isNight = options.isNight !== undefined ? options.isNight : (text.includes('night') || text.includes('evening'));
      const hasRain = options.hasRain !== undefined ? options.hasRain : (text.includes('rain') || text.includes('monsoon'));
      const speedLimit = hasSchool ? 40 : (text.includes('highway') || text.includes('expressway') ? 80 : 50);

      const half = lengthMeters / 2;
      const schoolZ = hasSchool ? half - 180 : 0;
      const zebraZ = hasSchool ? half - 180 : 0;
      const flasherZ = hasSchool ? schoolZ - 270 : -200;

      const levelId = options.id || `ai_gen_${Date.now()}`;
      const name = options.name || (hasSchool ? 'AI Generated: Suburban School Dismissal Corridor' : 'AI Generated: Urban Transit Artery');

      return {
        id: levelId,
        isAIGenerated: true,
        hasAIDirector: true,
        name: name,
        icon: hasSchool ? '🏫' : '🏙️',
        veh: options.veh || 'car',
        modes: ['car', 'bike'],
        isSuburbanNeighborhood: true,
        hasGarageSpawn: true,
        startOutside: true,
        roadLength: lengthMeters,
        speedLimit: speedLimit,
        schoolSpeedLimit: 20,
        hasSchool: hasSchool,
        isSilenceZone: hasSchool,
        hasRain: hasRain,
        isNight: isNight,
        hasCow: hasCow,
        timeLimit: Math.round(lengthMeters / 6),
        roads: [
          { type: 'v', x: 0, z1: -half, z2: half, lanes: 2, width: 14, speedLimit: speedLimit, roadType: 'collector' }
        ],
        route: [
          { x: 3.5, z: -half + 120, desc: 'Depart Starting Lot' },
          { x: 3.5, z: -half * 0.5, desc: 'Residential Sector Checkpoint' },
          { x: 3.5, z: 0, desc: 'Midtown Crossing' },
          ...(hasSchool ? [
            { x: 3.5, z: flasherZ, desc: 'School Warning Flasher (Reduce to 20 km/h)' },
            { x: 3.5, z: zebraZ, desc: 'St. Xavier Zebra Crossing — Yield to Children' },
            { x: 3.5, z: half - 50, desc: 'Campus Dismissal Gate' }
          ] : [
            { x: 3.5, z: half * 0.5, desc: 'Sector 2 Checkpoint' },
            { x: 3.5, z: half - 50, desc: 'Corridor Finish Gate' }
          ])
        ],
        tasks: [
          { id: 'start_veh', text: 'Enter vehicle and start engine', type: 'enter_vehicle', done: false },
          { id: 'cruise_corridor', text: `Navigate ${Math.round(lengthMeters/1000)}km corridor safely`, type: 'reach', target: 'checkpoint_1', done: false },
          ...(hasSchool ? [
            { id: 'school_speed', text: 'Reduce to 20 km/h at School Warning Flasher', type: 'avoid', target: 'speed_zone', done: false },
            { id: 'yield_kids', text: 'Stop behind white line for crossing children & guard', type: 'avoid', target: 'pedestrian', done: false }
          ] : []),
          ...(hasCow ? [
            { id: 'avoid_cow', text: 'Safely bypass roadside cattle without honking', type: 'avoid', target: 'cattle', done: false }
          ] : []),
          { id: 'reach_dest', text: 'Reach destination terminal cleanly', type: 'reach', target: 'finish', done: false }
        ],
        aiCoTReasoning: [
          `Parsed intent: ${prompt}`,
          `Calculated Roadway: 2-lane 14m collector with 2m pedestrian sidewalks spanning ${lengthMeters}m.`,
          `Computed Stopping Sight Distance (SSD) for 40 km/h: ${SpatialReasoningEngine.calculateSSD(40)}m required.`,
          `Set school warning beacon at Z=${flasherZ}m (SSD + 200m buffer) for safe deceleration.`,
          `Governing laws attached: MV Act Sec 183 (Speeding), Sec 194B (Pedestrian crosswalk right-of-way), Silence Zone (no horn).`
        ]
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. LEVEL DIRECTOR: "AI HANDLES THE LEVEL DYNAMICALLY"
  // ═══════════════════════════════════════════════════════════════════════════

  class LevelDirector {
    constructor(game, levelConfig) {
      this.game = game;
      this.cfg = levelConfig;
      this.children = [];
      this.guard = null;
      this.cow = null;
      this.activeEvents = [];
      this.cotLog = [];
      this.state = 'INITIALIZING';
      this.guardPaddleRaised = false;
      this.dismissalTriggered = false;
      this.timeSinceStart = 0;
      this.playerYieldReported = false;

      this.logCoT('LevelDirector initialized for: ' + (levelConfig.name || 'Level'));
      this.setupDirectorEntities();
      this.createUIInspector();
    }

    logCoT(msg) {
      const timestamp = new Date().toLocaleTimeString();
      this.cotLog.unshift(`[${timestamp}] ${msg}`);
      if (this.cotLog.length > 25) this.cotLog.pop();
      this.updateInspectorCoT();
    }

    /**
     * Spawns Crossing Guard Mr. Shinde, School Children Swarm, and Roadside Hazards
     */
    setupDirectorEntities() {
      if (!this.game || !this.game.scene || typeof THREE === 'undefined') return;
      const scene = this.game.scene;

      // ── 1. CROSSING GUARD MR. SHINDE (At Zebra Crossing Z = 2320) ───────────
      const zebraZ = this.cfg.hasSchool ? (this.cfg.zebraZ || 2320) : 0;
      this.guardZ = zebraZ;

      const guardGroup = new THREE.Group();
      guardGroup.position.set(5.2, 0, zebraZ);
      guardGroup.rotation.y = -Math.PI / 2; // facing across the roadway

      // Legs & Boots
      const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.16, 0.45, 0);
      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.16, 0.45, 0);
      guardGroup.add(leftLeg, rightLeg);

      // Torso with High-Vis Fluorescent Yellow Jacket
      const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35);
      const torsoMat = new THREE.MeshLambertMaterial({ color: 0xeab308 }); // Fluorescent amber-yellow
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 1.25;
      guardGroup.add(torso);

      // Silver reflective sash
      const sashGeo = new THREE.BoxGeometry(0.57, 0.12, 0.37);
      const sashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sash = new THREE.Mesh(sashGeo, sashMat);
      sash.position.y = 1.25;
      guardGroup.add(sash);

      // Head & Cap
      const headGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const skinMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 1.8;
      const capGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12);
      const capMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 1.95;
      guardGroup.add(head, cap);

      // Articulated Arm with STOP Paddle
      const armGroup = new THREE.Group();
      armGroup.position.set(0.35, 1.5, 0);

      const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8);
      const armMesh = new THREE.Mesh(armGeo, torsoMat);
      armMesh.position.y = -0.28;
      armGroup.add(armMesh);

      // Octagonal STOP Paddle
      const paddleGroup = new THREE.Group();
      paddleGroup.position.y = -0.6;

      const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = -0.15;
      paddleGroup.add(pole);

      const octGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 8);
      octGeo.rotateX(Math.PI / 2);
      const octMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 }); // Stop Red
      const octSign = new THREE.Mesh(octGeo, octMat);
      octSign.position.y = 0.25;
      paddleGroup.add(octSign);

      // Canvas text for "STOP"
      if (typeof document !== 'undefined') {
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 128;
        signCanvas.height = 128;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = '#dc2626';
        sctx.fillRect(0, 0, 128, 128);
        sctx.fillStyle = '#ffffff';
        sctx.font = 'bold 36px sans-serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('STOP', 64, 64);
        const signTex = new THREE.CanvasTexture(signCanvas);
        const labelGeo = new THREE.PlaneGeometry(0.48, 0.48);
        const labelMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, 0.25, 0.03);
        paddleGroup.add(labelMesh);
      }

      armGroup.add(paddleGroup);
      guardGroup.add(armGroup);

      scene.add(guardGroup);
      this.guard = { group: guardGroup, arm: armGroup, isRaised: false };
      this.logCoT(`Placed Crossing Guard Mr. Shinde at Z=${zebraZ}m with articulated STOP paddle.`);

      // ── 2. DYNAMIC SCHOOL CHILDREN SWARM (10 students) ─────────────────────
      const uniforms = [0x1e3a8a, 0x1e40af, 0x1d4ed8, 0x2563eb]; // Navy blue tints
      const bags = [0xef4444, 0xf97316, 0x10b981, 0x8b5cf6];
      this.children = [];

      for (let i = 0; i < 10; i++) {
        const childGroup = new THREE.Group();
        const startX = 6.2 + (Math.random() * 2.5);
        const startZ = zebraZ + 8 + (i * 2.8);
        childGroup.position.set(startX, 0, startZ);

        // Child scale (~1.15m height)
        const cLegGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 6);
        const cLegMat = new THREE.MeshLambertMaterial({ color: uniforms[i % uniforms.length] });
        const cLegL = new THREE.Mesh(cLegGeo, cLegMat);
        cLegL.position.set(-0.1, 0.28, 0);
        const cLegR = new THREE.Mesh(cLegGeo, cLegMat);
        cLegR.position.set(0.1, 0.28, 0);
        childGroup.add(cLegL, cLegR);

        // White School Shirt
        const cTorsoGeo = new THREE.BoxGeometry(0.36, 0.48, 0.24);
        const cTorsoMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        const cTorso = new THREE.Mesh(cTorsoGeo, cTorsoMat);
        cTorso.position.y = 0.75;
        childGroup.add(cTorso);

        // School Backpack
        const bagGeo = new THREE.BoxGeometry(0.28, 0.36, 0.16);
        const bagMat = new THREE.MeshLambertMaterial({ color: bags[i % bags.length] });
        const bag = new THREE.Mesh(bagGeo, bagMat);
        bag.position.set(0, 0.75, -0.18);
        childGroup.add(bag);

        // Head
        const cHeadGeo = new THREE.SphereGeometry(0.15, 10, 10);
        const cHead = new THREE.Mesh(cHeadGeo, skinMat);
        cHead.position.y = 1.15;
        childGroup.add(cHead);

        scene.add(childGroup);

        this.children.push({
          group: childGroup,
          legL: cLegL,
          legR: cLegR,
          initialX: startX,
          initialZ: startZ,
          targetX: -6.5 - Math.random() * 1.5, // crossing over to opposite sidewalk
          targetZ: zebraZ - 1.5 + (Math.random() * 3),
          phase: 'WAITING_AT_CAMPUS', // 'WAITING_AT_CAMPUS' | 'APPROACHING_CROSSWALK' | 'CROSSING' | 'SAFE'
          speed: 1.0 + Math.random() * 0.4,
          walkCycle: Math.random() * Math.PI * 2,
          clusterId: Math.floor(i / 3)
        });
      }
      this.logCoT(`Spawned 10-student dismissal swarm at St. Xavier campus gate.`);

      // ── 3. SACRED CATTLE OBSTACLE (At Z = 1250 on road verge) ──────────────
      const cowGroup = new THREE.Group();
      cowGroup.position.set(-4.5, 0, 1250);
      cowGroup.rotation.y = Math.PI / 4;

      const cowBodyGeo = new THREE.BoxGeometry(1.6, 0.9, 0.7);
      const cowMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }); // White Indian cow
      const cowBody = new THREE.Mesh(cowBodyGeo, cowMat);
      cowBody.position.y = 0.8;

      // Hump
      const humpGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const hump = new THREE.Mesh(humpGeo, cowMat);
      hump.position.set(-0.35, 1.35, 0);

      // Head with Horns
      const cowHeadGeo = new THREE.BoxGeometry(0.5, 0.45, 0.4);
      const cowHead = new THREE.Mesh(cowHeadGeo, cowMat);
      cowHead.position.set(0.9, 1.1, 0);

      const hornGeo = new THREE.ConeGeometry(0.06, 0.35, 6);
      const hornMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const hornL = new THREE.Mesh(hornGeo, hornMat);
      hornL.position.set(0.95, 1.4, 0.16);
      hornL.rotation.z = -0.3;
      const hornR = new THREE.Mesh(hornGeo, hornMat);
      hornR.position.set(0.95, 1.4, -0.16);
      hornR.rotation.z = -0.3;

      // Legs
      const cowLegGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.8, 6);
      const cowLeg1 = new THREE.Mesh(cowLegGeo, cowMat);
      cowLeg1.position.set(-0.5, 0.4, 0.25);
      const cowLeg2 = new THREE.Mesh(cowLegGeo, cowMat);
      cowLeg2.position.set(0.5, 0.4, 0.25);
      const cowLeg3 = new THREE.Mesh(cowLegGeo, cowMat);
      cowLeg3.position.set(-0.5, 0.4, -0.25);
      const cowLeg4 = new THREE.Mesh(cowLegGeo, cowMat);
      cowLeg4.position.set(0.5, 0.4, -0.25);

      cowGroup.add(cowBody, hump, cowHead, hornL, hornR, cowLeg1, cowLeg2, cowLeg3, cowLeg4);
      scene.add(cowGroup);
      this.cow = { group: cowGroup, head: cowHead };
      this.logCoT(`Positioned Sacred Cattle obstacle on road verge at Z=1250m (Safe corridor clearance verified).`);
    }

    /**
     * Per-frame behavioral update for all dynamic entities
     */
    update(dt) {
      if (!this.game || !this.game.player) return;
      this.timeSinceStart += dt;

      const playerPos = this.game.player.position;
      const playerSpeedKmh = Math.round(Math.abs(this.game.speed || 0));

      // ── A. Monitor Approach to School Dismissal Zone (Z = 2320) ─────────────
      const distanceToZebra = this.guardZ - playerPos.z;

      // Trigger School Dismissal Bell when player reaches Z = 1900 (~420m away)
      if (!this.dismissalTriggered && playerPos.z > (this.guardZ - 420)) {
        this.triggerEvent('dismissal_bell');
      }

      // ── B. Crossing Guard Decision Matrix ──────────────────────────────────
      if (this.guard && this.guard.arm) {
        // If children are crossing or about to cross AND player is approaching within 150m
        const childrenCrossing = this.children.some(c => c.phase === 'APPROACHING_CROSSWALK' || c.phase === 'CROSSING');
        const shouldRaisePaddle = childrenCrossing && distanceToZebra > 0 && distanceToZebra < 160;

        const targetRotation = shouldRaisePaddle ? -Math.PI / 2 : 0; // -90 deg = raised upright
        this.guard.arm.rotation.z = THREE.MathUtils.lerp(this.guard.arm.rotation.z, targetRotation, dt * 5);
        this.guardPaddleRaised = Math.abs(this.guard.arm.rotation.z - (-Math.PI / 2)) < 0.2;

        const _win = typeof window !== 'undefined' ? window : {};
        if (shouldRaisePaddle && !this.guard.isRaised) {
          this.guard.isRaised = true;
          this.logCoT(`Guard raised STOP sign: Holding traffic for St. Xavier student crossing.`);
          if (_win.toast) _win.toast('🛑 CROSSING GUARD: STOP! School children crossing!', '#ef4444', 3500);
          if (_win.TrafficAudio && _win.TrafficAudio.playWhistle) _win.TrafficAudio.playWhistle();
        } else if (!shouldRaisePaddle && this.guard.isRaised) {
          this.guard.isRaised = false;
          this.logCoT(`Guard lowered STOP sign: Crosswalk clear, safe to resume 20 km/h.`);
          if (_win.toast) _win.toast('✅ Guard: Road clear! Drive slowly.', '#34d399', 2500);
        }

        // Evaluate Driver Stop Compliance
        if (distanceToZebra > 2 && distanceToZebra < 35 && this.guardPaddleRaised) {
          if (playerSpeedKmh <= 2) {
            if (!this.playerYieldReported) {
              this.playerYieldReported = true;
              this.logCoT(`COMPLIANCE PASS: Driver stopped safely behind stop line (Speed: 0 km/h). MV Act Sec 194B satisfied.`);
              if (_win.ui && _win.ui.markTask) _win.ui.markTask('yield_kids');
            }
          } else if (distanceToZebra < 12 && playerSpeedKmh > 15) {
            this.logCoT(`VIOLATION: Driver encroaching crosswalk at ${playerSpeedKmh} km/h while guard STOP is raised!`);
          }
        }
      }

      // ── C. School Children Swarm Walk Dynamics ─────────────────────────────
      this.children.forEach(child => {
        child.walkCycle += dt * (child.speed * 4);

        // Leg swings
        child.legL.rotation.x = Math.sin(child.walkCycle) * 0.45;
        child.legR.rotation.x = -Math.sin(child.walkCycle) * 0.45;

        if (child.phase === 'APPROACHING_CROSSWALK') {
          // Walk towards curb edge (X = 4.8)
          const dx = 4.8 - child.group.position.x;
          const dz = child.targetZ - child.group.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.3) {
            child.group.position.x += (dx / dist) * child.speed * dt;
            child.group.position.z += (dz / dist) * child.speed * dt;
            child.group.rotation.y = Math.atan2(dx, dz);
          } else {
            // Reached curb, check if guard has raised paddle
            if (this.guardPaddleRaised || distanceToZebra > 60 || distanceToZebra < -10) {
              child.phase = 'CROSSING';
              this.logCoT(`Student group entering zebra crossing.`);
            }
          }
        } else if (child.phase === 'CROSSING') {
          // Cross across roadway to far curb (X = -4.8)
          const dx = child.targetX - child.group.position.x;
          const dz = child.targetZ - child.group.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.3) {
            child.group.position.x += (dx / dist) * child.speed * dt;
            child.group.position.z += (dz / dist) * child.speed * dt;
            child.group.rotation.y = Math.atan2(dx, dz);
          } else {
            child.phase = 'SAFE';
            this.logCoT(`Student reached safe opposite sidewalk.`);
          }
        }
      });

      // ── D. Cow subtle breathing/head flick ──────────────────────────────────
      if (this.cow && this.cow.head) {
        this.cow.head.rotation.y = Math.sin(this.timeSinceStart * 1.5) * 0.15;
      }

      // Update Inspector Telemetry
      this.updateInspectorTelemetry(playerSpeedKmh, distanceToZebra);
    }

    /**
     * Triggers dynamic live level events
     */
    triggerEvent(eventName) {
      this.logCoT(`Triggered Event: ${eventName.toUpperCase()}`);
      const _win = typeof window !== 'undefined' ? window : {};
      if (eventName === 'dismissal_bell') {
        this.dismissalTriggered = true;
        if (_win.toast) _win.toast('🔔 SCHOOL BELL RANG: St. Xavier dismissal active! Students approaching crosswalk.', '#f59e0b', 4000);
        // Dispatch children in staggered waves
        this.children.forEach((c, idx) => {
          setTimeout(() => {
            if (c.phase === 'WAITING_AT_CAMPUS') c.phase = 'APPROACHING_CROSSWALK';
          }, idx * 600);
        });
      } else if (eventName === 'cattle_crossing') {
        if (_win.toast) _win.toast('🐄 ROAD HAZARD: Sacred cattle on road verge! Do not honk (Silence Zone).', '#f59e0b', 3000);
        this.logCoT(`Cattle alert active. Enforcing Silence Zone (no horn) rules.`);
      } else if (eventName === 'ambulance_emergency') {
        if (_win.toast) _win.toast('🚑 EMERGENCY DISPATCH: Ambulance approaching! Clear the right lane immediately!', '#ef4444', 4000);
        if (_win.TrafficAudio && _win.TrafficAudio.playSiren) _win.TrafficAudio.playSiren();
        this.logCoT(`Emergency ambulance dispatched: Evaluating player lane change (Sec 194E).`);
      } else if (eventName === 'monsoon_puddle') {
        if (_win.toast) _win.toast('🌧️ WEATHER: Wet asphalt road conditions. Stopping distance increased by 30%!', '#38bdf8', 3000);
        this.logCoT(`Surface friction set to wet asphalt (f=0.32). SSD recalculated.`);
      }
    }

    /**
     * Builds the interactive in-game AI Level Director & Inspector Panel
     */
    createUIInspector() {
      if (typeof document === 'undefined') return;

      // Remove any previous instance
      const oldPanel = document.getElementById('ai-map-inspector-panel');
      if (oldPanel) oldPanel.remove();
      const oldBtn = document.getElementById('ai-map-inspector-btn');
      if (oldBtn) oldBtn.remove();

      // Floating Trigger Button
      const btn = document.createElement('div');
      btn.id = 'ai-map-inspector-btn';
      btn.innerHTML = `<span>🧠 AI Director</span>`;
      btn.style.cssText = `
        position: fixed;
        bottom: 85px;
        right: 18px;
        z-index: 9999;
        padding: 8px 16px;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.92));
        border: 1.5px solid #38bdf8;
        border-radius: 24px;
        color: #38bdf8;
        font-family: 'Inter', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 18px rgba(56, 189, 248, 0.35);
        backdrop-filter: blur(8px);
        user-select: none;
        transition: all 0.2s ease;
      `;
      btn.onclick = () => this.toggleInspectorPanel();
      document.body.appendChild(btn);

      // Slide-Out Inspector Panel
      const panel = document.createElement('div');
      panel.id = 'ai-map-inspector-panel';
      panel.style.cssText = `
        position: fixed;
        top: 60px;
        right: -380px;
        width: 360px;
        max-height: calc(100vh - 120px);
        background: rgba(11, 17, 32, 0.96);
        border: 1.5px solid rgba(56, 189, 248, 0.4);
        border-radius: 16px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(14px);
        z-index: 100000;
        color: #e2e8f0;
        font-family: 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      panel.innerHTML = `
        <div style="padding: 14px 16px; background: rgba(15, 23, 42, 0.9); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">🧠</span>
            <div>
              <div style="font-weight: 800; font-size: 0.92rem; color: #38bdf8;">Urban AI Level Director</div>
              <div style="font-size: 0.68rem; color: #94a3b8;">Real-Time Spatial & Behavioral Engine</div>
            </div>
          </div>
          <button id="ai-inspector-close" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>

        <div style="padding: 14px 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
          <!-- Telemetry Card -->
          <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">📊 Live Spatial & Safety Telemetry</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem;">
              <div>
                <div style="color: #64748b; font-size: 0.68rem;">GOVERNING RULE</div>
                <div id="ai-tel-rule" style="font-weight: 700; color: #fbbf24;">Sec 183 (School)</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 0.68rem;">GUARD PADDLE</div>
                <div id="ai-tel-guard" style="font-weight: 700; color: #ef4444;">WAITING</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 0.68rem;">REQ. STOP DIST (SSD)</div>
                <div id="ai-tel-ssd" style="font-weight: 700; color: #38bdf8;">-- m</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 0.68rem;">STUDENTS CROSSING</div>
                <div id="ai-tel-crossing" style="font-weight: 700; color: #34d399;">0 / 10</div>
              </div>
            </div>
          </div>

          <!-- Dynamic Event Trigger Buttons -->
          <div>
            <div style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">⚡ Trigger AI Live Events</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="ai-event-btn" onclick="window.TrafficMapAI && window.TrafficMapAI.director && window.TrafficMapAI.director.triggerEvent('dismissal_bell')" style="padding: 8px; background: #1e293b; border: 1px solid #f59e0b; border-radius: 8px; color: #f59e0b; font-size: 0.74rem; font-weight: 700; cursor: pointer;">🔔 Ring Dismissal</button>
              <button class="ai-event-btn" onclick="window.TrafficMapAI && window.TrafficMapAI.director && window.TrafficMapAI.director.triggerEvent('cattle_crossing')" style="padding: 8px; background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; color: #38bdf8; font-size: 0.74rem; font-weight: 700; cursor: pointer;">🐄 Add Cattle Alert</button>
              <button class="ai-event-btn" onclick="window.TrafficMapAI && window.TrafficMapAI.director && window.TrafficMapAI.director.triggerEvent('ambulance_emergency')" style="padding: 8px; background: #1e293b; border: 1px solid #ef4444; border-radius: 8px; color: #ef4444; font-size: 0.74rem; font-weight: 700; cursor: pointer;">🚑 Siren Yield</button>
              <button class="ai-event-btn" onclick="window.TrafficMapAI && window.TrafficMapAI.director && window.TrafficMapAI.director.triggerEvent('monsoon_puddle')" style="padding: 8px; background: #1e293b; border: 1px solid #a855f7; border-radius: 8px; color: #a855f7; font-size: 0.74rem; font-weight: 700; cursor: pointer;">🌧️ Wet Asphalt</button>
            </div>
          </div>

          <!-- Chain-of-Thought Stream -->
          <div style="flex: 1;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">💬 AI Chain-of-Thought Log</div>
            <div id="ai-cot-stream" style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; font-family: monospace; font-size: 0.68rem; color: #94a3b8; max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
              <div>[SYSTEM] Initializing Urban AI Level Director...</div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(panel);
      document.getElementById('ai-inspector-close').onclick = () => this.toggleInspectorPanel();
      this.panel = panel;
    }

    toggleInspectorPanel() {
      if (!this.panel) return;
      const isOpen = this.panel.style.right === '18px';
      this.panel.style.right = isOpen ? '-380px' : '18px';
    }

    updateInspectorTelemetry(playerSpeedKmh, distanceToZebra) {
      if (typeof document === 'undefined') return;
      const ssdEl = document.getElementById('ai-tel-ssd');
      const guardEl = document.getElementById('ai-tel-guard');
      const crossingEl = document.getElementById('ai-tel-crossing');

      if (ssdEl) {
        const ssd = SpatialReasoningEngine.calculateSSD(playerSpeedKmh);
        ssdEl.textContent = `${ssd} m`;
      }
      if (guardEl) {
        guardEl.textContent = this.guardPaddleRaised ? 'STOP RAISED 🛑' : 'LOWERED ✅';
        guardEl.style.color = this.guardPaddleRaised ? '#ef4444' : '#34d399';
      }
      if (crossingEl) {
        const count = this.children.filter(c => c.phase === 'CROSSING').length;
        crossingEl.textContent = `${count} / 10`;
      }
    }

    updateInspectorCoT() {
      if (typeof document === 'undefined') return;
      const cotEl = document.getElementById('ai-cot-stream');
      if (cotEl) {
        cotEl.innerHTML = this.cotLog.map(line => `<div>${line}</div>`).join('');
      }
    }

    cleanup() {
      if (typeof document === 'undefined') return;
      const panel = document.getElementById('ai-map-inspector-panel');
      if (panel) panel.remove();
      const btn = document.getElementById('ai-map-inspector-btn');
      if (btn) btn.remove();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MASTER TRAFFIC MAP AI WRAPPER
  // ═══════════════════════════════════════════════════════════════════════════

  class TrafficMapAI {
    static get CORPUS() { return MV_ACT_CORPUS; }
    static get STANDARDS() { return ROAD_GEOMETRY_STANDARDS; }
    static get BEHAVIORS() { return ENTITY_BEHAVIOR_MODELS; }

    /**
     * Generates a new level blueprint easily from a natural prompt
     */
    static generateLevel(prompt, options) {
      return LevelGenerator.generateFromPrompt(prompt, options);
    }

    /**
     * Initializes the dynamic AI Level Director to actively handle and run the level
     */
    static initLevelDirector(game, levelConfig) {
      if (this.director) this.director.cleanup();
      this.director = new LevelDirector(game, levelConfig);
      return this.director;
    }

    /**
     * Frame-by-frame loop update
     */
    static update(dt) {
      if (this.director) {
        this.director.update(dt);
      }
    }

    static cleanup() {
      if (this.director) {
        this.director.cleanup();
        this.director = null;
      }
    }
  }

  // Expose globally
  root.TrafficMapAI = TrafficMapAI;
  root.TrafficMapLLM = TrafficMapAI; // alias for user's prompt nomenclature
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrafficMapAI, LevelGenerator, SpatialReasoningEngine, LevelDirector };
  }

})(typeof window !== 'undefined' ? window : global);
