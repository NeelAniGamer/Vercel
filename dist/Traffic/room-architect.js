/**
 * ============================================================================
 * 3D INTERIOR ARCHITECTURE & MULTI-ROOM HUB ENGINE (room-architect.js)
 * ============================================================================
 * Inspired by next-generation procedural room generation in 3D AI simulations.
 * 
 * Features:
 * - 4 Connected Architectural Rooms:
 *    1. Central Reception Lobby (Slate/Marble, Reception, Lounge, Trophy Showcase)
 *    2. Driving Academy Briefing Classroom (Parquet Wood, Desks, Projector, Safety Boards)
 *    3. Mechanic Workshop & 3D Tuning Garage (Checkered Epoxy, Hydraulic Lift, Turntable, Tool Racks)
 *    4. Mumbai Police CCTV Control Room (Tech Slate, Multi-Screen Wall, Server Racks, Consoles)
 * - Seamless Connected Doorways with Molded Trim & Transition Strips (No loading screens)
 * - Compound Procedural Prop Dressing (Desks, Chairs, Tool Cabinets, Lifts, Server Stacks, CCTV screens)
 * - Layered Atmospheric Interior Lighting (Warm downlights, cool fluorescent fixtures, neon accents)
 * - Spatial Collision Engine (AABB Box3 sliding collision against all walls and furniture)
 * - First-Person Walk & Third-Person Orbit Controllers with Decoupled Interactive Kiosks
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. TEXTURE GENERATORS (Canvas Procedural Textures for Realistic Surfaces)
  // ──────────────────────────────────────────────────────────────────────────

  class InteriorTextures {
    /**
     * Polished Classroom Parquet Hardwood Floor
     */
    static createWoodParquet() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 512;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#6b4724';
      ctx.fillRect(0, 0, 512, 512);

      // Wood planks pattern
      const plankH = 32;
      const plankW = 128;
      for (let y = 0; y < 512; y += plankH) {
        const rowOffset = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
        for (let x = -plankW; x < 512 + plankW; x += plankW) {
          const px = x + rowOffset;
          const tone = 20 + Math.floor(Math.sin(x * 0.05 + y * 0.1) * 12);
          ctx.fillStyle = `rgb(${100 + tone}, ${65 + Math.floor(tone * 0.7)}, ${35 + Math.floor(tone * 0.4)})`;
          ctx.fillRect(px + 1, y + 1, plankW - 2, plankH - 2);

          // Wood grain lines
          ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
          for (let g = 0; g < 4; g++) {
            const gy = y + 4 + g * 7;
            ctx.fillRect(px + 2, gy, plankW - 4, 1.5);
          }
        }
      }

      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      return tex;
    }

    /**
     * Garage Checkered Industrial Floor
     */
    static createGarageFloor() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 512;
      const ctx = cv.getContext('2d');
      const tileSize = 64;
      for (let y = 0; y < 512; y += tileSize) {
        for (let x = 0; x < 512; x += tileSize) {
          const isDark = (x / tileSize + y / tileSize) % 2 === 0;
          ctx.fillStyle = isDark ? '#181b22' : '#d2d8e0';
          ctx.fillRect(x, y, tileSize, tileSize);

          // Tile bevel / grout
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
      // Subtle grease/grunge overlay
      ctx.fillStyle = 'rgba(20, 20, 25, 0.15)';
      ctx.beginPath();
      ctx.arc(256, 256, 120, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(5, 5);
      return tex;
    }

    /**
     * Procedural Woven Carbon Fiber Composite Texture
     */
    static createCarbonFiberTexture() {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#141518';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#262930';
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 8) {
          const ox = (y % 8 === 0) ? 0 : 4;
          ctx.fillRect(x + ox, y, 4, 2);
          ctx.fillRect(x + ox + 2, y + 2, 4, 2);
        }
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);
      return tex;
    }

    /**
     * Cross-drilled ceramic brake rotor texture
     */
    static createBrakeRotorTexture() {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 256, 256);

      // Circular brushed machining lines
      for (let r = 32; r < 124; r += 2) {
        ctx.strokeStyle = (r % 4 === 0) ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(128, 128, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Spiral cross-drilled cooling holes
      ctx.fillStyle = '#0f172a';
      for (let arm = 0; arm < 12; arm++) {
        const baseA = (arm * Math.PI * 2) / 12;
        for (let step = 0; step < 5; step++) {
          const rad = 46 + step * 15;
          const a = baseA + step * 0.12;
          const hx = 128 + Math.cos(a) * rad;
          const hy = 128 + Math.sin(a) * rad;
          ctx.beginPath();
          ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Inner mounting hub ring
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(128, 128, 38, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(cv);
    }

    /**
     * Hypercar digital cockpit instrument cluster
     */
    static createDigitalDashTexture() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, 512, 256);

      // Outer bezel border
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 500, 244);

      // Arc tachometer (RPM gauge 0 to 10k)
      ctx.lineWidth = 16;
      ctx.strokeStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(256, 210, 160, Math.PI * 1.05, Math.PI * 1.7);
      ctx.stroke();

      // Yellow / Redline segment
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(256, 210, 160, Math.PI * 1.7, Math.PI * 1.82);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(256, 210, 160, Math.PI * 1.82, Math.PI * 1.95);
      ctx.stroke();

      // Current Gear
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 72px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('7', 256, 155);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('GEAR', 256, 182);

      // Digital Speed
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px monospace';
      ctx.fillText('248', 256, 85);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px monospace';
      ctx.fillText('KM / H', 256, 105);

      // Telemetry widgets
      ctx.fillStyle = '#10b981';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('BOOST: +1.8 BAR', 24, 60);
      ctx.fillText('OIL: 98°C', 24, 90);
      ctx.fillText('TYRE: 32 PSI', 24, 120);

      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'right';
      ctx.fillText('LAP: 1:24.38', 488, 60);
      ctx.fillText('DIFF: RACE', 488, 90);
      ctx.fillText('TC: LEVEL 2', 488, 120);

      return new THREE.CanvasTexture(cv);
    }

    /**
     * Engine dyno graph and telemetry monitor screen
     */
    static createDynoScreenTexture() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#060911';
      ctx.fillRect(0, 0, 512, 256);

      // Header
      ctx.fillStyle = '#0ea5e9';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('APEX DYNO PERFORMANCE LAB — MUMBAI', 20, 30);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 40; x < 490; x += 45) {
        ctx.beginPath(); ctx.moveTo(x, 45); ctx.lineTo(x, 210); ctx.stroke();
      }
      for (let y = 50; y < 210; y += 35) {
        ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(490, y); ctx.stroke();
      }

      // Red Horsepower Curve
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 200);
      ctx.bezierCurveTo(150, 185, 300, 105, 480, 60);
      ctx.stroke();

      // Blue Torque Curve
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 175);
      ctx.bezierCurveTo(120, 90, 260, 85, 480, 110);
      ctx.stroke();

      // Stats
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('POWER: 852 BHP @ 8400 RPM', 40, 235);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('TORQUE: 780 NM @ 5200 RPM', 270, 235);

      return new THREE.CanvasTexture(cv);
    }

    /**
     * Sleek Lobby Tile with Fine Grout
     */
    static createLobbyTile() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 512;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 512, 512);

      const size = 128;
      for (let y = 0; y < 512; y += size) {
        for (let x = 0; x < 512; x += size) {
          const shade = 64 + Math.floor(Math.sin(x * 0.1 + y * 0.05) * 14);
          ctx.fillStyle = `rgb(${shade}, ${shade + 8}, ${shade + 20})`;
          ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, size, size);
        }
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    }

    /**
     * Classroom Whiteboard Diagram
     */
    static createWhiteboardTexture() {
      const cv = document.createElement('canvas');
      cv.width = 1024; cv.height = 512;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1024, 512);

      // Header
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('MUMBAI TRAFFIC ACADEMY — THEORY SYLLABUS', 40, 55);

      // Divider
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 75); ctx.lineTo(984, 75);
      ctx.stroke();

      // Road Junction Diagram
      ctx.fillStyle = '#334155';
      ctx.fillRect(80, 110, 280, 280);
      // Road lanes
      ctx.fillStyle = '#475569';
      ctx.fillRect(190, 110, 60, 280);
      ctx.fillRect(80, 220, 280, 60);
      // Yellow lane dividers
      ctx.strokeStyle = '#facc15';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(220, 110); ctx.lineTo(220, 390);
      ctx.moveTo(80, 250); ctx.lineTo(360, 250);
      ctx.stroke();
      ctx.setLineDash([]);

      // Zebra crossing markings
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(195 + i * 10, 195, 6, 20);
        ctx.fillRect(195 + i * 10, 285, 6, 20);
      }

      // Notes & Rules in Marker Pen
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('1. PEDESTRIAN PRIORITY:', 400, 130);
      ctx.fillStyle = '#1e293b';
      ctx.font = '20px sans-serif';
      ctx.fillText('• Always yield to school zones (25 km/h limit).', 420, 165);
      ctx.fillText('• Stop BEFORE the white stop line at zebra crossings.', 420, 200);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('2. RIGHT-OF-WAY RULES:', 400, 250);
      ctx.fillStyle = '#1e293b';
      ctx.font = '20px sans-serif';
      ctx.fillText('• Vehicles entering roundabouts yield to circulating traffic.', 420, 285);
      ctx.fillText('• Emergency vehicles (Ambulance, Police) have 100% priority.', 420, 320);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('3. MONSOON BRAKING DISTANCE:', 400, 370);
      ctx.fillStyle = '#1e293b';
      ctx.font = '20px sans-serif';
      ctx.fillText('• Wet asphalt increases braking distance by 2.2×.', 420, 405);
      ctx.fillText('• Maintain 4-second following distance in rain.', 420, 440);

      const tex = new THREE.CanvasTexture(cv);
      return tex;
    }

    /**
     * CCTV Control Room Multi-Screen Surveillance Wall Texture
     */
    static createCCTVWallTexture() {
      const cv = document.createElement('canvas');
      cv.width = 1024; cv.height = 512;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, 1024, 512);

      // Grid of 8 surveillance feeds
      const cols = 4;
      const rows = 2;
      const w = 1024 / cols;
      const h = 512 / rows;
      const labels = [
        'CAM 01: MARINE DRIVE PROMENADE',
        'CAM 02: WORLI SEA LINK TOLL PLAZA',
        'CAM 03: BANDRA HIGH SCHOOL JUNCTION',
        'CAM 04: DOWNTOWN FINANCIAL DIST.',
        'CAM 05: BEST BUS TERMINAL SOUTH',
        'CAM 06: BAZAAR CHAWL CORRIDOR',
        'CAM 07: SNEH-ASHA PEDESTRIAN CROSSING',
        'CAM 08: HIGHWAY EXPRESSWAY MILE 4'
      ];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = c * w;
          const y = r * h;

          // Monitor bezel
          ctx.fillStyle = '#0b101d';
          ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

          // Simulated camera view with night/day tint
          const camTone = (idx % 2 === 0) ? '#101a2e' : '#14222e';
          ctx.fillStyle = camTone;
          ctx.fillRect(x + 10, y + 10, w - 20, h - 20);

          // Road horizon line and vanishing perspective in feeds
          ctx.strokeStyle = '#1e3852';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 20, y + h - 20);
          ctx.lineTo(x + w / 2, y + h / 2 + 10);
          ctx.lineTo(x + w - 20, y + h - 20);
          ctx.stroke();

          // Green REC indicator
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(x + 26, y + 26, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#5eead4';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('LIVE', x + 38, y + 30);

          // Timestamp
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px monospace';
          ctx.fillText('2026-09-18 14:45:00', x + w - 160, y + 30);

          // Label
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(labels[idx], x + 16, y + h - 22);

          // Fine scanlines
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          for (let sl = y + 10; sl < y + h - 10; sl += 4) {
            ctx.fillRect(x + 10, sl, w - 20, 1);
          }
        }
      }

      const tex = new THREE.CanvasTexture(cv);
      return tex;
    }

    /**
     * Asphalt Road Texture with Yellow Double Divider and White Edge Lines
     */
    static createRoadTexture() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 512;
      const ctx = cv.getContext('2d');
      // Dark asphalt
      ctx.fillStyle = '#262930';
      ctx.fillRect(0, 0, 512, 512);

      // Noise grain
      for (let i = 0; i < 3000; i++) {
        const gx = Math.random() * 512;
        const gy = Math.random() * 512;
        const shade = Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.15)`;
        ctx.fillRect(gx, gy, 2, 2);
      }

      // Yellow double center line
      ctx.fillStyle = '#facc15';
      ctx.fillRect(250, 0, 4, 512);
      ctx.fillRect(258, 0, 4, 512);

      // White outer solid shoulder lines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, 0, 6, 512);
      ctx.fillRect(482, 0, 6, 512);

      // White dashed lane dividers
      ctx.setLineDash([28, 20]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(136, 0); ctx.lineTo(136, 512);
      ctx.moveTo(376, 0); ctx.lineTo(376, 512);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 4);
      return tex;
    }

    /**
     * Streetlight Soft Ground Glow Pool (Radial Gradient Light Decal)
     */
    static createLightPoolTexture() {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const ctx = cv.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255, 235, 130, 0.85)');
      grad.addColorStop(0.35, 'rgba(254, 215, 102, 0.5)');
      grad.addColorStop(0.7, 'rgba(251, 191, 36, 0.18)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      return new THREE.CanvasTexture(cv);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ROOM ARCHITECT CORE CLASS
  // ──────────────────────────────────────────────────────────────────────────

  class RoomArchitect {
    constructor(scene, options = {}) {
      this.scene = scene;
      this.colliders = []; // AABB Box3 array
      this.interactiveProps = []; // { name, object, triggerDist, onInteract }
      this.pointLights = [];
      this.rootGroup = new THREE.Group();
      this.rootGroup.name = 'InteriorMultiRoomHub';
      this.materials = this._initMaterialPalette();

      // Player / Camera Controller State
      this.playerPos = new THREE.Vector3(0, 1.6, 0); // Eye height 1.6m
      this.playerVel = new THREE.Vector3();
      this.playerRotY = 0;
      this.keys = {};
      this.cameraMode = options.cameraMode || 'first_person'; // 'first_person' or 'orbit'
      this._activeRoom = 'lobby';

      // Attach to scene
      if (this.scene) {
        this.scene.add(this.rootGroup);
      }
    }

    _initMaterialPalette() {
      return {
        wallPlaster: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7, side: THREE.DoubleSide }),
        wallAccentClassroom: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6, side: THREE.DoubleSide }),
        wallAccentGarage: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, side: THREE.DoubleSide }),
        wallAccentControl: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, side: THREE.DoubleSide }),
        wallAccentLobby: new THREE.MeshStandardMaterial({ color: 0x3b4758, roughness: 0.6, side: THREE.DoubleSide }),
        trimDark: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, side: THREE.DoubleSide }),
        ceilingMat: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, side: THREE.DoubleSide }),
        woodParquet: new THREE.MeshStandardMaterial({ map: InteriorTextures.createWoodParquet(), roughness: 0.4, side: THREE.DoubleSide }),
        garageCheckered: new THREE.MeshStandardMaterial({ map: InteriorTextures.createGarageFloor(), roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide }),
        lobbyTile: new THREE.MeshStandardMaterial({ map: InteriorTextures.createLobbyTile(), roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide }),
        controlTile: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, side: THREE.DoubleSide }),
        doorFrameMat: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5, side: THREE.DoubleSide }),
        metalPillar: new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 }),
        hydraulicBlue: new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.3 }),
        toolRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.35 }),
        rubberTire: new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.9 }),
        goldTrim: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 }),
        screenCCTV: new THREE.MeshBasicMaterial({ map: InteriorTextures.createCCTVWallTexture() }),
        screenBoard: new THREE.MeshBasicMaterial({ map: InteriorTextures.createWhiteboardTexture() }),
        neonCyan: new THREE.MeshBasicMaterial({ color: 0x06b6d4 }),
        neonAmber: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
        asphaltRoad: new THREE.MeshStandardMaterial({ map: InteriorTextures.createRoadTexture(), roughness: 0.8, side: THREE.DoubleSide }),
        sidewalkMat: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7, side: THREE.DoubleSide }),
        curbMat: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, side: THREE.DoubleSide }),
        lampBulbMat: new THREE.MeshBasicMaterial({ color: 0xfff385 }),
        lampPoolMat: new THREE.MeshBasicMaterial({ map: InteriorTextures.createLightPoolTexture(), transparent: true, opacity: 0.85, depthWrite: false }),
        zebraMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, side: THREE.DoubleSide }),
        headlightYellow: new THREE.MeshBasicMaterial({ color: 0xfffd88 })
      };
    }

    /**
     * Build all 4 connected architectural rooms on a cohesive spatial coordinate layout
     * 
     * SPATIAL MAP (Top-Down):
     * 
     *       ┌────────────────────────────────────────────────────┐
     *       │   OUTDOOR TRAFFIC PLACE & ROADWAY WITH STREETLIGHTS│
     *       │        (Z: -42 to -24, X: -32 to +24)              │
     *       └────────────────────────┬───────────────────────────┘
     *                                │ Exit Walkway
     *       ┌────────────────────────┴┐  ┌────────────────────────┐
     *       │   ROOM B: CLASSROOM    │  │   ROOM D: CCTV CONTROL │
     *       │     (16m x 14m)        │  │       (14m x 14m)      │
     *       │   Z: [-24 to -10]      │  │     Z: [-24 to -10]    │
     *       │   X: [-16 to 0]        │  │     X: [0 to +14]      │
     *       └──────────┬─────────────┘  └───────────┬────────────┘
     *                  │ Doorway                    │ Doorway
     *       ┌──────────┴─────────────┐  ┌───────────┴────────────┐
     *       │    ROOM A: LOBBY       ├──┤   ROOM C: 3D GARAGE    │
     *       │   (Entrance Hub)       │  │ (Vehicle Customizer)   │
     *       │     (16m x 14m)        │  │      (20m x 18m)       │
     *       │    Z: [-10 to +4]      │  │     Z: [-10 to +8]     │
     *       │    X: [-16 to 0]       │  │     X: [0 to +20]      │
     *       └────────────────────────┘  └────────────────────────┘
     */
    buildAllRooms() {
      this.clear();

      console.log('[RoomArchitect] Initializing 4-Room 3D Interior Architecture + Outdoor Traffic Zone...');

      // 1. Build Room A: Central Reception Lobby
      this.buildLobby({
        xMin: -16, xMax: 0,
        zMin: -10, zMax: 4,
        height: 4.5
      });

      // 2. Build Room B: Driving Academy Briefing Classroom
      this.buildClassroom({
        xMin: -16, xMax: 0,
        zMin: -24, zMax: -10,
        height: 4.5
      });

      // 3. Build Room C: Mechanic Workshop & 3D Tuning Garage (Double height for car lift)
      this.buildGarageWorkshop({
        xMin: 0, xMax: 20,
        zMin: -10, zMax: 8,
        height: 6.0
      });

      // 4. Build Room D: Mumbai Police CCTV Control Center
      this.buildControlRoom({
        xMin: 0, xMax: 14,
        zMin: -24, zMax: -10,
        height: 4.5
      });

      // 5. Connect Doorway Portals with transition sills
      this._buildDoorwayOpenings();

      // 6. Build Outside Traffic Place & Road Network with Working Streetlights!
      this.buildOutsideTrafficPlace();

      console.log(`[RoomArchitect] Generated 4 rooms + Outdoor Traffic Place with ${this.colliders.length} AABB colliders and ${this.pointLights.length} active lights.`);
      return this.rootGroup;
    }

    /**
     * Clear existing interior assets and colliders
     */
    clear() {
      while (this.rootGroup.children.length > 0) {
        const c = this.rootGroup.children[0];
        this.rootGroup.remove(c);
      }
      this.colliders = [];
      this.interactiveProps = [];
      this.pointLights = [];
    }

    // ────────────────────────────────────────────────────────────────────────
    // ROOM A: CENTRAL RECEPTION LOBBY
    // ────────────────────────────────────────────────────────────────────────
    buildLobby(b) {
      const w = b.xMax - b.xMin;
      const d = b.zMax - b.zMin;
      const cx = (b.xMin + b.xMax) / 2;
      const cz = (b.zMin + b.zMax) / 2;
      const group = new THREE.Group();
      group.name = 'Room_Lobby';

      // Floor
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.lobbyTile);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      floor.receiveShadow = true;
      group.add(floor);

      // Ceiling
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(cx, b.height, cz);
      group.add(ceiling);

      // Exterior Walls (West & South are exterior)
      this._addSolidWall(group, b.xMin, cz, 0.3, b.height, d, this.materials.wallAccentLobby); // West
      this._addSolidWall(group, cx, b.zMax, w, b.height, 0.3, this.materials.wallAccentLobby); // South (Entrance)

      // Lighting: Warm Luxury Chandelier (High-Lumen Golden Brilliance)
      const centerLight = new THREE.PointLight(0xfffae8, 3.2, 34, 1.2);
      centerLight.position.set(cx, b.height - 0.8, cz);
      centerLight.castShadow = true;
      group.add(centerLight);
      this.pointLights.push(centerLight);

      // Chandelier fixture geometry with warm glowing core
      const chandelier = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.4, 0.5, 8), this.materials.goldTrim);
      chandelier.position.set(cx, b.height - 0.4, cz);
      const chBulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), this.materials.lampBulbMat);
      chBulb.position.set(cx, b.height - 0.7, cz);
      group.add(chandelier, chBulb);

      // Props: Reception Counter
      const desk = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 1.4), this.materials.wallPlaster);
      desk.position.set(cx - 3, 0.55, cz - 1);
      desk.castShadow = true;
      group.add(desk);
      this._addCollider(desk);

      // Reception Computer
      const pc = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.08), this.materials.toolRed);
      pc.position.set(cx - 3, 1.35, cz - 1.2);
      group.add(pc);

      // Waiting Area: Modern Leather Sofa
      const sofa = this._createSofa(0x1e293b);
      sofa.position.set(cx + 3, 0, cz + 1);
      sofa.rotation.y = -Math.PI / 2;
      group.add(sofa);
      this._addCollider(sofa);

      // Indoor Palm / Planter
      const planter = this._createPottedPlant();
      planter.position.set(b.xMin + 1.2, 0, b.zMax - 1.2);
      group.add(planter);

      // Academy Trophy Showcase
      const trophyCase = this._createTrophyCase();
      trophyCase.position.set(cx - 5, 0, b.zMax - 0.6);
      group.add(trophyCase);
      this._addCollider(trophyCase);

      // Directional Wall Signs
      const signClassroom = this._createWallSign('⬅ THEORY CLASSROOM', 0x2563eb);
      signClassroom.position.set(cx - 2, 2.5, b.zMin + 0.16);
      group.add(signClassroom);

      const signGarage = this._createWallSign('3D TUNING GARAGE ➡', 0xf59e0b);
      signGarage.position.set(b.xMax - 0.16, 2.5, cz);
      signGarage.rotation.y = -Math.PI / 2;
      group.add(signGarage);

      this.rootGroup.add(group);
    }

    // ────────────────────────────────────────────────────────────────────────
    // ROOM B: DRIVING ACADEMY CLASSROOM & BRIEFING ROOM
    // ────────────────────────────────────────────────────────────────────────
    buildClassroom(b) {
      const w = b.xMax - b.xMin;
      const d = b.zMax - b.zMin;
      const cx = (b.xMin + b.xMax) / 2;
      const cz = (b.zMin + b.zMax) / 2;
      const group = new THREE.Group();
      group.name = 'Room_Classroom';

      // Floor (Warm parquet wood)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.woodParquet);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      floor.receiveShadow = true;
      group.add(floor);

      // Ceiling
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(cx, b.height, cz);
      group.add(ceiling);

      // West Wall
      this._addSolidWall(group, b.xMin, cz, 0.3, b.height, d, this.materials.wallAccentClassroom);

      // North Wall with Exit Doorway opening at x = -13.5 leading to the outdoor street!
      this._buildPartitionWithDoorway(group, b.xMin, b.xMax, b.zMin, 'horizontal', -13.5, 2.8, b.height, this.materials.wallAccentClassroom);

      // Lighting: 1 High-Efficiency Classroom Point Light & 4 Glowing Troffer Fixtures
      const classLight = new THREE.PointLight(0xffffff, 3.2, 32, 1.2);
      classLight.position.set(cx, b.height - 0.6, cz);
      classLight.castShadow = true;
      group.add(classLight);
      this.pointLights.push(classLight);

      for (const lx of [cx - 3.5, cx + 3.5]) {
        for (const lz of [cz - 3.5, cz + 3.5]) {
          const fixture = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.9), this.materials.trimDark);
          fixture.position.set(lx, b.height - 0.05, lz);
          const bulb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.7), this.materials.lampBulbMat);
          bulb.position.set(lx, b.height - 0.08, lz);
          group.add(fixture, bulb);
        }
      }

      // Front Big Whiteboard with Traffic Diagram (Shifted to x = -4.5 so doorway is unobstructed)
      const board = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.2, 0.1), this.materials.screenBoard);
      board.position.set(cx + 2.5, 2.3, b.zMin + 0.18);
      group.add(board);

      // Instructor Podium / Desk
      const podium = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.1), this.materials.trimDark);
      podium.position.set(cx + 4.5, 0.5, b.zMin + 2.4);
      group.add(podium);
      this._addCollider(podium);

      // Student Desks Grid (2 rows of 3 desks)
      for (let r = 0; r < 2; r++) {
        const rowZ = cz + (r * 3.5) - 1.0;
        for (let c = 0; c < 3; c++) {
          const colX = b.xMin + 3 + (c * 4.2);
          const deskGroup = this._createStudentDesk();
          deskGroup.position.set(colX, 0, rowZ);
          group.add(deskGroup);
          this._addCollider(deskGroup);
        }
      }

      // Exit Sign over the Outdoor Doorway
      const exitSign = this._createWallSign('🚗 OUTDOOR TEST TRACK', 0x16a34a);
      exitSign.position.set(-13.5, 3.5, b.zMin + 0.22);
      group.add(exitSign);

      // Interactive Portal Trigger
      const exitDoor = this._createExitPortal('🚗 EXIT TO TEST TRACK');
      exitDoor.position.set(-13.5, 0, b.zMin + 0.2);
      group.add(exitDoor);
      this._registerInteractive('exit_track', exitDoor, 3.0, () => {
        if (typeof window.startDrivingLesson === 'function') {
          window.startDrivingLesson();
        } else if (window.game && typeof window.game.startMode === 'function') {
          window.game.startMode('practice');
        } else {
          window.location.href = 'Driving.html';
        }
      });

      this.rootGroup.add(group);
    }

    // ────────────────────────────────────────────────────────────────────────
    // ROOM C: MECHANIC WORKSHOP & 3D TUNING GARAGE
    // ────────────────────────────────────────────────────────────────────────
    buildGarageWorkshop(b) {
      const w = b.xMax - b.xMin;
      const d = b.zMax - b.zMin;
      const cx = (b.xMin + b.xMax) / 2;
      const cz = (b.zMin + b.zMax) / 2;
      const group = new THREE.Group();
      group.name = 'Room_Garage';

      // Floor (Industrial checkered tiles with grease stains)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.garageCheckered);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      floor.receiveShadow = true;
      group.add(floor);

      // Double-height Industrial Ceiling
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(cx, b.height, cz);
      group.add(ceiling);

      // Exterior Walls (East & South)
      this._addSolidWall(group, b.xMax, cz, 0.3, b.height, d, this.materials.wallAccentGarage); // East Wall
      this._addSolidWall(group, cx, b.zMax, w, b.height, 0.3, this.materials.wallAccentGarage); // South Garage Roll-up Door

      // West exterior wall extending past the lobby (from Z = 4 to Z = 8 at X = 0)
      this._addSolidWall(group, b.xMin, 6.0, 0.3, b.height, 4.0, this.materials.wallAccentGarage);

      // North exterior wall extending past the control room (from X = 14 to X = 20 at Z = -10)
      this._addSolidWall(group, 17.0, b.zMin, 6.0, b.height, 0.3, this.materials.wallAccentGarage);

      // Upper clerestory walls above partitions (height 4.5m to 6.0m)
      const clerestoryWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 14.0), this.materials.wallAccentGarage);
      clerestoryWest.position.set(0, 5.25, -3.0);
      group.add(clerestoryWest);

      const clerestoryNorth = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.5, 0.3), this.materials.wallAccentGarage);
      clerestoryNorth.position.set(7.0, 5.25, -10.0);
      group.add(clerestoryNorth);

      // Roll-up garage door graphic
      const rollDoor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 4.5, 0.2), this.materials.metalPillar);
      rollDoor.position.set(cx, 2.25, b.zMax - 0.15);
      group.add(rollDoor);

      // Track Deployment Overhead Arch Sign
      const gateSign = this._createWallSign('🏁 TEST TRACK DEPLOYMENT GATE', 0x16a34a);
      gateSign.position.set(cx, 4.8, b.zMax - 0.22);
      gateSign.scale.set(1.4, 1.2, 1);
      group.add(gateSign);

      // Chequered Departure Threshold Decal on Floor
      const thresholdStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.68, 0.8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      thresholdStrip.rotation.x = -Math.PI / 2;
      thresholdStrip.position.set(cx, 0.02, b.zMax - 0.6);
      group.add(thresholdStrip);

      // Interactive Roll-up Door & Departure Kiosk
      this._registerInteractive('garage_rollup_door', rollDoor, 4.5, () => {
        if (typeof window.deployToTestTrack === 'function') {
          window.deployToTestTrack();
        } else {
          window.location.href = 'Driving.html';
        }
      });

      const deployKiosk = this._createInteractiveKiosk('🏁 DEPLOY TO TEST TRACK');
      deployKiosk.position.set(cx + 6.0, 0, b.zMax - 1.2);
      group.add(deployKiosk);
      this._registerInteractive('garage_deploy_kiosk', deployKiosk, 3.5, () => {
        if (typeof window.deployToTestTrack === 'function') {
          window.deployToTestTrack();
        } else {
          window.location.href = 'Driving.html';
        }
      });

      // 4 Industrial High-Bay Fluorescent Fixtures (Glowing Daylight 5000K)
      for (const lx of [cx - 4.5, cx + 4.5]) {
        for (const lz of [cz - 4, cz + 4]) {
          const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 12), this.materials.metalPillar);
          fixture.position.set(lx, b.height - 0.35, lz);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), this.materials.lampBulbMat);
          bulb.position.set(lx, b.height - 0.6, lz);
          group.add(fixture, bulb);
        }
      }

      // 1. Modern Hex-Grid Studio Detailing Lighting (Suspended above turntable)
      const hexGridGroup = new THREE.Group();
      const hexLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const gridSpanX = [-2.8, 0, 2.8];
      const gridSpanZ = [-3.2, 0, 3.2];
      gridSpanX.forEach(gx => {
        const barZ = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 6.4), hexLightMat);
        barZ.position.set(cx + 4.5 + gx, b.height - 0.25, cz);
        hexGridGroup.add(barZ);
      });
      gridSpanZ.forEach(gz => {
        const barX = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.08, 0.08), hexLightMat);
        barX.position.set(cx + 4.5, b.height - 0.25, cz + gz);
        hexGridGroup.add(barX);
      });
      group.add(hexGridGroup);

      // 2. High-Efficiency Showroom Key Spotlight (Directly over turntable car)
      const carSpot = new THREE.SpotLight(0xffffff, 4.5, 32, Math.PI / 3.5, 0.25, 1.2);
      carSpot.position.set(cx + 4.5, b.height - 0.4, cz);
      carSpot.target = this.turntable || group;
      carSpot.castShadow = true;
      group.add(carSpot);
      this.pointLights.push(carSpot);

      // Neon Tuning Sign with accent glow
      const neonSign = this._createNeonSign('⚡ APEX TUNING WORKSHOP', 0x06b6d4);
      neonSign.position.set(cx, b.height - 1.5, b.zMin + 0.2);
      group.add(neonSign);

      // High-Impact Illuminated Studio Sign on the East Feature Wall (Directly behind turntable car)
      const wallSign = this._createNeonSign('⚡ APEX MOTORSPORTS // MUMBAI SPEC', 0x38bdf8);
      wallSign.position.set(b.xMax - 0.2, 3.8, cz);
      wallSign.rotation.y = -Math.PI / 2;
      group.add(wallSign);

      // Central Hydraulic 2-Post Car Lift
      const lift = this._createCarLift();
      lift.position.set(cx - 5.5, 0, cz);
      group.add(lift);
      this._addCollider(lift);

      // Central Vehicle Display Turntable (Rotates car during customization)
      const turntableGeo = new THREE.CylinderGeometry(3.5, 3.6, 0.15, 32);
      const turntableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
      this.turntable = new THREE.Mesh(turntableGeo, turntableMat);
      this.turntable.position.set(cx + 4.5, 0.08, cz);
      group.add(this.turntable);

      // Neon Underglow Ring on Turntable
      const underglowGeo = new THREE.RingGeometry(3.2, 3.4, 32);
      this.underglowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
      const underglow = new THREE.Mesh(underglowGeo, this.underglowMat);
      underglow.rotation.x = -Math.PI / 2;
      underglow.position.y = 0.09;
      this.turntable.add(underglow);

      // Spawn 3D Vehicle on Turntable
      this._spawnTurntableCar(0xdc2626);

      // Diagnostic Dyno Telemetry Cart
      const dynoStation = this._createDynoStation();
      dynoStation.position.set(cx + 1.4, 0, cz + 3.2);
      dynoStation.rotation.y = -Math.PI / 3;
      group.add(dynoStation);
      this._addCollider(dynoStation);

      // Dual Nitrous Oxide (NOS) Performance Bottles
      for (const nIdx of [-0.25, 0.25]) {
        const nosBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 }));
        nosBottle.position.set(b.xMax - 1.2, 0.38, cz + 0.8 + nIdx);
        const nosValve = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), this.materials.chrome || this.materials.goldTrim);
        nosValve.position.set(b.xMax - 1.2, 0.82, cz + 0.8 + nIdx);
        group.add(nosBottle, nosValve);
      }

      // Rolling Red Tool Chests
      const toolChest = this._createToolChest();
      toolChest.position.set(b.xMax - 1.2, 0, cz - 4);
      toolChest.rotation.y = -Math.PI / 2;
      group.add(toolChest);
      this._addCollider(toolChest);

      // Heavy Mechanic Workbench with Vise
      const workbench = this._createWorkbench();
      workbench.position.set(b.xMax - 1.4, 0, cz + 2);
      workbench.rotation.y = -Math.PI / 2;
      group.add(workbench);
      this._addCollider(workbench);

      // Tire Racks (Stacked racing tires)
      const tireRack = this._createTireRack();
      tireRack.position.set(cx - 7, 0, b.zMax - 1.2);
      group.add(tireRack);
      this._addCollider(tireRack);

      // Oil Barrels
      for (let bIdx = 0; bIdx < 3; bIdx++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16), this.materials.toolRed);
        barrel.position.set(b.xMin + 1.2 + (bIdx * 0.8), 0.5, b.zMax - 1.2);
        group.add(barrel);
        this._addCollider(barrel);
      }

      // Interactive Vehicle Customizer Kiosk
      const customKiosk = this._createInteractiveKiosk('🎨 VEHICLE CUSTOMIZER');
      customKiosk.position.set(cx + 4.5, 0, cz - 4.5);
      group.add(customKiosk);
      this._registerInteractive('customizer', customKiosk, 3.0, () => {
        if (typeof window.openCustomizerStudio === 'function') {
          window.openCustomizerStudio();
        } else if (typeof window.openCarCustomizer === 'function') {
          window.openCarCustomizer();
        } else {
          console.log('[RoomArchitect] Interactive Customizer Triggered!');
        }
      });

      this.rootGroup.add(group);
    }

    // ────────────────────────────────────────────────────────────────────────
    // ROOM D: MUMBAI POLICE CCTV CONTROL ROOM
    // ────────────────────────────────────────────────────────────────────────
    buildControlRoom(b) {
      const w = b.xMax - b.xMin;
      const d = b.zMax - b.zMin;
      const cx = (b.xMin + b.xMax) / 2;
      const cz = (b.zMin + b.zMax) / 2;
      const group = new THREE.Group();
      group.name = 'Room_Control';

      // Floor (Tech dark slate)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.controlTile);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      floor.receiveShadow = true;
      group.add(floor);

      // Ceiling
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.materials.ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(cx, b.height, cz);
      group.add(ceiling);

      // Exterior North & East Walls
      this._addSolidWall(group, cx, b.zMin, w, b.height, 0.3, this.materials.wallAccentControl); // North Wall
      this._addSolidWall(group, b.xMax, cz, 0.3, b.height, d, this.materials.wallAccentControl); // East Wall

      // Lighting: High-Efficiency Cool Tech Command Center Light
      const controlLight = new THREE.PointLight(0x38bdf8, 3.2, 30, 1.2);
      controlLight.position.set(cx, b.height - 0.7, cz);
      controlLight.castShadow = true;
      group.add(controlLight);
      this.pointLights.push(controlLight);

      // Massive Multi-Screen CCTV Surveillance Wall
      const cctvWall = new THREE.Mesh(new THREE.BoxGeometry(9.0, 3.6, 0.15), this.materials.screenCCTV);
      cctvWall.position.set(cx, 2.4, b.zMin + 0.2);
      group.add(cctvWall);

      // Operator Command Desk (Semi-circular curved console)
      const desk = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 0.9, 16, 1, false, 0, Math.PI), this.materials.trimDark);
      desk.rotation.y = Math.PI / 2;
      desk.position.set(cx, 0.45, cz - 1);
      group.add(desk);
      this._addCollider(desk);

      // 4 Operator Monitors on Console
      for (let i = -2; i <= 2; i += 1.3) {
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), this.materials.neonCyan);
        mon.position.set(cx + i, 1.2, cz - 2.8 + Math.abs(i) * 0.3);
        mon.rotation.y = -i * 0.15;
        group.add(mon);
      }

      // Blinking Server Stacks on West Wall
      for (let s = 0; s < 3; s++) {
        const rack = this._createServerRack();
        rack.position.set(b.xMin + 0.8, 0, cz + (s * 2.2) - 1.5);
        rack.rotation.y = Math.PI / 2;
        group.add(rack);
        this._addCollider(rack);
      }

      this.rootGroup.add(group);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. SEAMLESS DOORWAYS & INTERIOR PARTITIONS
    // ────────────────────────────────────────────────────────────────────────
    _buildDoorwayOpenings() {
      const group = new THREE.Group();
      group.name = 'DoorwayPortals';

      // 1. Partition between Lobby and Classroom (Along Z = -10, from X = -16 to 0)
      // Doorway Opening at X = -8 (Width: 3.5m, Height: 3.2m)
      this._buildPartitionWithDoorway(group, -16, 0, -10, 'horizontal', -8, 3.5, 4.5, this.materials.wallPlaster);

      // 2. Partition between Lobby and Garage (Along X = 0, from Z = -10 to +4)
      // Large Double-Door Garage Portal at Z = -3 (Width: 4.0m, Height: 3.6m)
      this._buildPartitionWithDoorway(group, -10, 4, 0, 'vertical', -3, 4.0, 4.5, this.materials.wallAccentGarage);

      // 3. Partition between Classroom and Control Room (Along X = 0, from Z = -24 to -10)
      // Secure Keycard Doorway at Z = -17 (Width: 2.5m, Height: 3.0m)
      this._buildPartitionWithDoorway(group, -24, -10, 0, 'vertical', -17, 2.5, 4.5, this.materials.wallAccentControl);

      // 4. Partition between Control Room and Garage (Along Z = -10, from X = 0 to 14)
      // Service Doorway at X = 7 (Width: 2.5m, Height: 3.0m)
      this._buildPartitionWithDoorway(group, 0, 14, -10, 'horizontal', 7, 2.5, 4.5, this.materials.wallAccentGarage);

      this.rootGroup.add(group);
    }

    /**
     * Builds a wall with a clean open doorway cutout, lintel, and baseboard trim
     */
    _buildPartitionWithDoorway(parent, start, end, axisCoord, orientation, doorCenter, doorW, wallH, mat) {
      const isH = orientation === 'horizontal';
      const wallLen = Math.abs(end - start);
      const leftLen = (doorCenter - doorW / 2) - start;
      const rightLen = end - (doorCenter + doorW / 2);
      const doorH = 3.2;

      // Left Segment
      if (leftLen > 0.1) {
        const leftMesh = new THREE.Mesh(
          isH ? new THREE.BoxGeometry(leftLen, wallH, 0.3) : new THREE.BoxGeometry(0.3, wallH, leftLen),
          mat
        );
        const lPos = start + leftLen / 2;
        leftMesh.position.set(isH ? lPos : axisCoord, wallH / 2, isH ? axisCoord : lPos);
        parent.add(leftMesh);
        this._addCollider(leftMesh);
      }

      // Right Segment
      if (rightLen > 0.1) {
        const rightMesh = new THREE.Mesh(
          isH ? new THREE.BoxGeometry(rightLen, wallH, 0.3) : new THREE.BoxGeometry(0.3, wallH, rightLen),
          mat
        );
        const rPos = end - rightLen / 2;
        rightMesh.position.set(isH ? rPos : axisCoord, wallH / 2, isH ? axisCoord : rPos);
        parent.add(rightMesh);
        this._addCollider(rightMesh);
      }

      // Lintel Over Doorway
      const lintelH = wallH - doorH;
      if (lintelH > 0.1) {
        const lintel = new THREE.Mesh(
          isH ? new THREE.BoxGeometry(doorW, lintelH, 0.3) : new THREE.BoxGeometry(0.3, lintelH, doorW),
          mat
        );
        lintel.position.set(isH ? doorCenter : axisCoord, doorH + lintelH / 2, isH ? axisCoord : doorCenter);
        parent.add(lintel);
      }

      // Molded Wooden Doorframe Trim
      const frameMat = this.materials.doorFrameMat;
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, doorH, 0.35), frameMat);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, doorH, 0.35), frameMat);
      if (isH) {
        f1.position.set(doorCenter - doorW / 2, doorH / 2, axisCoord);
        f2.position.set(doorCenter + doorW / 2, doorH / 2, axisCoord);
      } else {
        f1.rotation.y = Math.PI / 2;
        f2.rotation.y = Math.PI / 2;
        f1.position.set(axisCoord, doorH / 2, doorCenter - doorW / 2);
        f2.position.set(axisCoord, doorH / 2, doorCenter + doorW / 2);
      }
      parent.add(f1, f2);

      // Floor threshold transition strip
      const threshold = new THREE.Mesh(
        isH ? new THREE.BoxGeometry(doorW, 0.05, 0.4) : new THREE.BoxGeometry(0.4, 0.05, doorW),
        this.materials.goldTrim
      );
      threshold.position.set(isH ? doorCenter : axisCoord, 0.025, isH ? axisCoord : doorCenter);
      parent.add(threshold);
    }

    _addSolidWall(parent, x, z, w, h, d, mat) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      wall.position.set(x, h / 2, z);
      wall.receiveShadow = true;
      parent.add(wall);
      this._addCollider(wall);

      // Baseboard trim
      const trimW = (w > d) ? w : 0.35;
      const trimD = (w > d) ? 0.35 : d;
      const baseboard = new THREE.Mesh(new THREE.BoxGeometry(trimW, 0.2, trimD), this.materials.trimDark);
      baseboard.position.set(x, 0.1, z);
      parent.add(baseboard);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3.5. OUTSIDE TRAFFIC PLACE WITH WORKING STREETLIGHTS & ROAD
    // ────────────────────────────────────────────────────────────────────────
    buildOutsideTrafficPlace() {
      const group = new THREE.Group();
      group.name = 'Zone_OutsideTraffic';

      const xMin = -36;
      const xMax = 24;
      const roadW = xMax - xMin; // 60m long road segment

      // 1. Sidewalk Near Academy Entrance (Z: -27 to -24)
      const nearSidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(roadW, 0.2, 3.0),
        this.materials.sidewalkMat
      );
      nearSidewalk.position.set((xMin + xMax) / 2, 0.1, -25.5);
      nearSidewalk.receiveShadow = true;
      group.add(nearSidewalk);

      // Near Curb (Stone border along road edge Z = -27)
      const nearCurb = new THREE.Mesh(
        new THREE.BoxGeometry(roadW, 0.25, 0.3),
        this.materials.curbMat
      );
      nearCurb.position.set((xMin + xMax) / 2, 0.12, -27.0);
      group.add(nearCurb);

      // 2. Asphalt Road Surface (Z: -41 to -27, width 14m)
      const roadPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(roadW, 14.0),
        this.materials.asphaltRoad
      );
      roadPlane.rotation.x = -Math.PI / 2;
      roadPlane.position.set((xMin + xMax) / 2, 0.01, -34.0);
      roadPlane.receiveShadow = true;
      group.add(roadPlane);

      // 3. Far Sidewalk (Z: -44 to -41)
      const farSidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(roadW, 0.2, 3.0),
        this.materials.sidewalkMat
      );
      farSidewalk.position.set((xMin + xMax) / 2, 0.1, -42.5);
      farSidewalk.receiveShadow = true;
      group.add(farSidewalk);

      // Far Curb (Z = -41.0)
      const farCurb = new THREE.Mesh(
        new THREE.BoxGeometry(roadW, 0.25, 0.3),
        this.materials.curbMat
      );
      farCurb.position.set((xMin + xMax) / 2, 0.12, -41.0);
      group.add(farCurb);

      // 4. Realistic Zebra Crossing Marking (aligned with road lanes outside classroom exit doorway)
      for (let sx = -15.5; sx <= -11.5; sx += 0.9) {
        for (const sz of [-30.5, -34.0, -37.5]) {
          const stripe = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 2.4),
            this.materials.zebraMat
          );
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(sx, 0.02, sz);
          group.add(stripe);
        }
      }

      // 5. City Skyline Facades along Far Side of Street (North backdrop behind sidewalk)
      const bColors = [0x1e293b, 0x182234, 0x0f172a, 0x1e2230, 0x242a38];
      const bWidths = [12, 10, 14, 11, 13];
      let bStartX = xMin;
      for (let bi = 0; bi < 5; bi++) {
        const bW = bWidths[bi];
        const bH = 18 + bi * 3;
        const bD = 8;
        const bCenter = bStartX + bW / 2;
        const bMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bW, bH, bD),
          new THREE.MeshLambertMaterial({ color: bColors[bi] })
        );
        bMesh.position.set(bCenter, bH / 2, -48.5);
        group.add(bMesh);
        this._addCollider(bMesh);

        // Lit architectural window rows
        for (let wy = 3; wy < bH - 2; wy += 3.5) {
          const winBand = new THREE.Mesh(
            new THREE.BoxGeometry(bW * 0.85, 1.2, 0.2),
            new THREE.MeshBasicMaterial({ color: (bi % 2 === 0) ? 0xfef08a : 0x38bdf8 })
          );
          winBand.position.set(bCenter, wy, -44.4);
          group.add(winBand);
        }
        bStartX += bW + 0.2;
      }

      // Perimeter Boundary Walls on East & West edges
      const wallMat = this.materials.wallPlaster;
      this._addSolidWall(group, xMin - 0.2, -34.0, 0.4, 4.0, 20.0, wallMat); // West edge wall
      this._addSolidWall(group, xMax + 0.2, -34.0, 0.4, 4.0, 20.0, wallMat); // East edge wall

      // 6. Active Roadway Illumination & Working Streetlights
      const roadLight = new THREE.PointLight(0xffea75, 3.5, 50, 1.2);
      roadLight.position.set(0, 8.0, -34.0);
      roadLight.castShadow = true;
      group.add(roadLight);
      this.pointLights.push(roadLight);

      // Near side (Z = -26.3, arm facing -Z road)
      const nearLightX = [-30, -18, -6, 6, 18];
      nearLightX.forEach(lx => {
        const lamp = this._createWorkingStreetLight(0); // facing -Z into road
        lamp.position.set(lx, 0, -26.3);
        group.add(lamp);
        this._addCollider(lamp.children[0]); // Base pole collider
      });

      // Far side (Z = -41.7, arm facing +Z road)
      const farLightX = [-24, -12, 0, 12];
      farLightX.forEach(lx => {
        const lamp = this._createWorkingStreetLight(Math.PI); // facing +Z into road
        lamp.position.set(lx, 0, -41.7);
        group.add(lamp);
        this._addCollider(lamp.children[0]);
      });

      // 7. Outdoor Showcase Vehicle (Parked roadside with active headlights)
      const outdoorCar = this._createOutdoorCar();
      outdoorCar.position.set(0, 0, -30.5);
      outdoorCar.rotation.y = Math.PI / 2; // facing East
      group.add(outdoorCar);
      this._addCollider(outdoorCar);

      // 8. Overhead Academy Exterior Sign above classroom exit doorway
      const exteriorSign = this._createWallSign('🏛️ MUMBAI TRAFFIC ACADEMY — THEORY DIVISION', 0x1e3a8a);
      exteriorSign.position.set(-13.5, 3.5, -24.18);
      exteriorSign.scale.set(1.4, 1.1, 1);
      group.add(exteriorSign);

      this.rootGroup.add(group);
    }

    _createWorkingStreetLight(rotY = 0) {
      const g = new THREE.Group();
      g.rotation.y = rotY;

      // Vertical Pole (dark industrial metal)
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 5.2, 12),
        this.materials.metalPillar
      );
      pole.position.y = 2.6;
      pole.castShadow = true;
      g.add(pole);

      // Curved / Angled Outreach Arm extending over road (offset in -Z)
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 1.8),
        this.materials.metalPillar
      );
      arm.position.set(0, 5.15, -0.85);
      arm.rotation.x = -0.15;
      g.add(arm);

      // Lamp Head Fixture Housing
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.15, 0.7),
        this.materials.trimDark
      );
      head.position.set(0, 5.0, -1.65);
      g.add(head);

      // Emissive Glowing Lamp Bulb Lens (Bright Golden Warmth)
      const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.05, 0.55),
        this.materials.lampBulbMat
      );
      bulb.position.set(0, 4.92, -1.65);
      g.add(bulb);

      // SOFT GROUND LIGHT POOL DECAL (Horizontal plane right on road at y = 0.03)
      const groundPool = new THREE.Mesh(
        new THREE.PlaneGeometry(6.8, 6.8),
        this.materials.lampPoolMat
      );
      groundPool.rotation.x = -Math.PI / 2;
      groundPool.position.set(0, 0.03, -1.65);
      g.add(groundPool);

      return g;
    }

    _createOutdoorCar() {
      const carGroup = new THREE.Group();
      const paintMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Sky Blue Mumbai Sedan
        roughness: 0.25,
        metalness: 0.8
      });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85
      });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

      // Lower Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.2), paintMat);
      body.position.y = 0.55;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.48, 2.2), glassMat);
      cabin.position.set(0, 1.02, -0.2);
      carGroup.add(cabin);

      // Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 2.0), paintMat);
      roof.position.set(0, 1.28, -0.2);
      carGroup.add(roof);

      // Wheels
      for (const wx of [-1.0, 1.0]) {
        for (const wz of [-1.3, 1.3]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), blackMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.36, wz);
          carGroup.add(wheel);
        }
      }

      // Glowing Headlights
      for (const hx of [-0.7, 0.7]) {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.08), this.materials.headlightYellow);
        hl.position.set(hx, 0.6, -2.12);
        carGroup.add(hl);
      }

      // Ground light pool in front of headlights
      const beamPool = new THREE.Mesh(
        new THREE.PlaneGeometry(4.0, 8.0),
        this.materials.lampPoolMat
      );
      beamPool.rotation.x = -Math.PI / 2;
      beamPool.position.set(0, 0.03, -6.0);
      carGroup.add(beamPool);

      return carGroup;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. COMPOUND PROP FACTORIES
    // ────────────────────────────────────────────────────────────────────────

    _createStudentDesk() {
      const g = new THREE.Group();
      // Wooden desk top
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.8), this.materials.woodParquet);
      top.position.y = 0.75;
      top.castShadow = true;
      g.add(top);

      // Metal tubular legs
      for (const dx of [-0.6, 0.6]) {
        for (const dz of [-0.3, 0.3]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75), this.materials.metalPillar);
          leg.position.set(dx, 0.375, dz);
          leg.castShadow = true;
          g.add(leg);
        }
      }

      // Chair
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), this.materials.trimDark);
      seat.position.set(0, 0.45, 0.55);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), this.materials.trimDark);
      back.position.set(0, 0.75, 0.78);
      g.add(seat, back);

      // Notebook on desk
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.35), this.materials.neonCyan);
      book.position.set(-0.3, 0.8, -0.1);
      g.add(book);

      return g;
    }

    _createCarLift() {
      const g = new THREE.Group();
      // Two blue heavy steel posts
      for (const x of [-2.2, 2.2]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.0, 0.5), this.materials.hydraulicBlue);
        post.position.set(x, 2.5, 0);
        post.castShadow = true;
        g.add(post);

        // Lifting carriage
        const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), this.materials.goldTrim);
        carriage.position.set(x, 1.8, 0);
        g.add(carriage);

        // Swing arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.15), this.materials.goldTrim);
        arm.position.set(x > 0 ? x - 0.9 : x + 0.9, 1.8, 0);
        g.add(arm);
      }

      // Top overhead crossbeam
      const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.3, 0.4), this.materials.hydraulicBlue);
      crossbeam.position.set(0, 4.85, 0);
      g.add(crossbeam);

      return g;
    }

    _createToolChest() {
      const g = new THREE.Group();
      // Main red rolling cabinet
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.7), this.materials.toolRed);
      body.position.y = 0.65;
      body.castShadow = true;
      g.add(body);

      // Black drawer accents
      for (let i = 0; i < 4; i++) {
        const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.05), this.materials.trimDark);
        drawer.position.set(0, 0.3 + (i * 0.22), 0.36);
        g.add(drawer);
      }

      // Castor wheels
      for (const wx of [-0.65, 0.65]) {
        for (const wz of [-0.25, 0.25]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08), this.materials.rubberTire);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.08, wz);
          g.add(wheel);
        }
      }

      return g;
    }

    _createWorkbench() {
      const g = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.9), this.materials.woodParquet);
      top.position.y = 0.9;
      top.castShadow = true;
      g.add(top);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.82, 0.8), this.materials.metalPillar);
      frame.position.y = 0.41;
      g.add(frame);

      // Machinist Vise on corner
      const vise = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.25), this.materials.trimDark);
      vise.position.set(-0.9, 1.05, 0.25);
      g.add(vise);

      return g;
    }

    _createTireRack() {
      const g = new THREE.Group();
      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.7), this.materials.trimDark);
      frame.position.y = 0.9;
      g.add(frame);

      // Stack of 4 tires
      for (let t = 0; t < 4; t++) {
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.14, 12, 24), this.materials.rubberTire);
        tire.position.set(-0.9 + (t * 0.6), 0.5, 0);
        g.add(tire);
      }
      return g;
    }

    _createDynoStation() {
      const g = new THREE.Group();
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.6), this.materials.metalPillar);
      stand.position.y = 0.5;
      stand.castShadow = true;
      g.add(stand);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), this.materials.metalPillar);
      pole.position.set(0, 1.4, -0.1);
      g.add(pole);

      const dynoTex = InteriorTextures.createDynoScreenTexture();
      const dynoMat = new THREE.MeshBasicMaterial({ map: dynoTex });
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.06), this.materials.trimDark);
      monitor.position.set(0, 1.8, -0.1);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.70), dynoMat);
      screen.position.set(0, 1.8, -0.06);
      g.add(monitor, screen);

      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.25), this.materials.trimDark);
      kb.position.set(0, 1.02, 0.1);
      g.add(kb);

      return g;
    }

    _createServerRack() {
      const g = new THREE.Group();
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.9), this.materials.wallAccentControl);
      rack.position.y = 1.2;
      rack.castShadow = true;
      g.add(rack);

      // Blinking green/amber status LEDs
      for (let l = 0; l < 8; l++) {
        const led = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.08, 0.05),
          (l % 3 === 0) ? this.materials.neonAmber : this.materials.neonCyan
        );
        led.position.set(0, 0.4 + (l * 0.22), 0.46);
        g.add(led);
      }
      return g;
    }

    _createSofa(colorHex) {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: colorHex });
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.9), mat);
      base.position.y = 0.25;
      base.castShadow = true;
      g.add(base);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.3), mat);
      back.position.set(0, 0.65, 0.35);
      g.add(back);

      // Armrests
      for (const ax of [-1.1, 1.1]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.9), mat);
        arm.position.set(ax, 0.5, 0);
        g.add(arm);
      }
      return g;
    }

    _createPottedPlant() {
      const g = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.6, 12), this.materials.toolRed);
      pot.position.y = 0.3;
      g.add(pot);

      // Leaves
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 6), leafMat);
        const angle = (i / 5) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.15, 0.8, Math.sin(angle) * 0.15);
        leaf.rotation.z = Math.cos(angle) * 0.3;
        leaf.rotation.x = Math.sin(angle) * 0.3;
        g.add(leaf);
      }
      return g;
    }

    _createTrophyCase() {
      const g = new THREE.Group();
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.5), this.materials.trimDark);
      shelf.position.y = 1.1;
      g.add(shelf);

      // Golden Trophy
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.35, 8), this.materials.goldTrim);
      cup.position.set(0, 1.5, 0.1);
      g.add(cup);

      return g;
    }

    _createWallSign(text, bgColor) {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 128;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#' + bgColor.toString(16).padStart(6, '0');
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 75);

      const tex = new THREE.CanvasTexture(cv);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      return new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.05), mat);
    }

    _createNeonSign(text, neonColor) {
      const cv = document.createElement('canvas');
      cv.width = 1024; cv.height = 160;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, 1024, 160);
      ctx.strokeStyle = '#' + neonColor.toString(16).padStart(6, '0');
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 1008, 144);
      ctx.fillStyle = '#' + neonColor.toString(16).padStart(6, '0');
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 512, 100);

      const tex = new THREE.CanvasTexture(cv);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      return new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.2, 0.08), mat);
    }

    _createInteractiveKiosk(title) {
      const g = new THREE.Group();
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), this.materials.trimDark);
      stand.position.y = 0.6;
      g.add(stand);

      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), this.materials.neonCyan);
      screen.position.set(0, 1.35, 0.1);
      screen.rotation.x = -0.3;
      g.add(screen);

      return g;
    }

    _createExitPortal(label) {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.2), this.materials.hydraulicBlue);
      frame.position.y = 1.6;
      g.add(frame);

      const doorSurface = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.9, 0.1), this.materials.neonCyan);
      doorSurface.position.set(0, 1.55, 0);
      g.add(doorSurface);

      return g;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. SPATIAL COLLISION & PLAYER CONTROLLER
    // ────────────────────────────────────────────────────────────────────────
    _addCollider(obj) {
      const box = new THREE.Box3().setFromObject(obj);
      this.colliders.push(box);
    }

    _registerInteractive(name, obj, triggerDist, onInteract) {
      this.interactiveProps.push({
        name,
        object: obj,
        triggerDist: triggerDist || 2.5,
        onInteract
      });
    }

    /**
     * Check if candidate position collides with any room walls or props
     * Returns resolved position with sliding collision
     */
    resolveCollision(candidateX, candidateZ, radius = 0.4) {
      const playerBox = new THREE.Box3(
        new THREE.Vector3(candidateX - radius, 0.2, candidateZ - radius),
        new THREE.Vector3(candidateX + radius, 2.0, candidateZ + radius)
      );

      for (let i = 0; i < this.colliders.length; i++) {
        if (playerBox.intersectsBox(this.colliders[i])) {
          return null; // Collision detected
        }
      }
      return true;
    }

    /**
     * Update loop called per animation frame
     */
    update(delta = 0.016, camera) {
      // 1. Rotate Turntable if vehicle present
      if (this.turntable) {
        this.turntable.rotation.y += delta * 0.4;
      }

      // 2. Process First-Person Movement
      if (this.cameraMode === 'first_person' && camera) {
        const moveSpeed = 4.5 * delta;
        const moveDir = new THREE.Vector3();

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {moveDir.z -= 1;}
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {moveDir.z += 1;}
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {moveDir.x -= 1;}
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {moveDir.x += 1;}

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          // Transform by camera horizontal heading
          const camYaw = camera.rotation.y;
          const rotatedX = moveDir.x * Math.cos(camYaw) + moveDir.z * Math.sin(camYaw);
          const rotatedZ = -moveDir.x * Math.sin(camYaw) + moveDir.z * Math.cos(camYaw);

          // Test sliding collision X
          const nextX = this.playerPos.x + rotatedX * moveSpeed;
          if (this.resolveCollision(nextX, this.playerPos.z)) {
            this.playerPos.x = nextX;
          }

          // Test sliding collision Z
          const nextZ = this.playerPos.z + rotatedZ * moveSpeed;
          if (this.resolveCollision(this.playerPos.x, nextZ)) {
            this.playerPos.z = nextZ;
          }

          camera.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
        }

        // Check Proximity Triggers
        this._checkInteractiveTriggers(this.playerPos);
      }
    }

    _checkInteractiveTriggers(pos) {
      for (let i = 0; i < this.interactiveProps.length; i++) {
        const prop = this.interactiveProps[i];
        const worldPos = new THREE.Vector3();
        prop.object.getWorldPosition(worldPos);
        const dist = Math.hypot(pos.x - worldPos.x, pos.z - worldPos.z);
        if (dist < prop.triggerDist) {
          if (!prop._promptActive) {
            prop._promptActive = true;
            if (window.toast) {
              window.toast(`⚡ Press [E] to interact with ${prop.name.toUpperCase()}`, '#38bdf8', 2500);
            }
          }
          if (this.keys['KeyE']) {
            this.keys['KeyE'] = false;
            prop.onInteract();
          }
        } else {
          prop._promptActive = false;
        }
      }
    }

    /**
     * Teleport player to a specific room center
     */
    teleportToRoom(roomKey, camera) {
      const spawns = {
        lobby: { x: -8, z: 0, yaw: 0 },
        classroom: { x: -8, z: -14, yaw: 0 },
        garage: { x: 8, z: -1, yaw: -Math.PI / 2 },
        control: { x: 7, z: -13, yaw: 0 },
        outside: { x: -13.5, z: -25.5, yaw: 0.95 }
      };

      const spawn = spawns[roomKey] || spawns.lobby;
      this.playerPos.set(spawn.x, 1.6, spawn.z);
      this._activeRoom = roomKey;

      if (camera) {
        camera.position.set(spawn.x, 1.6, spawn.z);
        camera.rotation.set(0, spawn.yaw, 0);
      }
      console.log(`[RoomArchitect] Teleported to ${roomKey.toUpperCase()} room.`);
    }

    _spawnTurntableCar(colorHex = 0xdc2626) {
      if (!this.turntable) {return;}
      if (this.turntableCar) {
        this.turntable.remove(this.turntableCar);
      }

      const carGroup = new THREE.Group();
      carGroup.name = 'Showroom_Supercar';

      // ────────────────────────────────────────────────────────────────────────
      // 1. HIGH-END AUTOMOTIVE SHOWROOM MATERIALS
      // ────────────────────────────────────────────────────────────────────────
      this.carPaintMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        roughness: 0.10,
        metalness: 0.90,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        reflectivity: 1.0
      });

      const carbonTex = InteriorTextures.createCarbonFiberTexture();
      const carbonMat = new THREE.MeshStandardMaterial({
        map: carbonTex,
        color: 0x181a1f,
        roughness: 0.30,
        metalness: 0.65
      });

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x050a12,
        roughness: 0.04,
        metalness: 0.92,
        transparent: true,
        opacity: 0.52 // Glass allows seeing interior & mid-engine bay
      });

      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.98,
        roughness: 0.06
      });

      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.92,
        roughness: 0.18
      });

      const titaniumMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Heat-treated titanium iridescent blue
        metalness: 0.96,
        roughness: 0.12
      });

      const engineRedMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626, // Ferrari/Lamborghini crinkle-red valve covers
        roughness: 0.35,
        metalness: 0.45
      });

      const rotorTex = InteriorTextures.createBrakeRotorTexture();
      const rotorMat = new THREE.MeshStandardMaterial({
        map: rotorTex,
        metalness: 0.90,
        roughness: 0.22
      });

      const caliperMat = new THREE.MeshStandardMaterial({
        color: 0xef4444, // Gloss Brembo racing red
        roughness: 0.18,
        metalness: 0.65
      });

      const rubberMat = new THREE.MeshLambertMaterial({ color: 0x111317 });
      const blackTrimMat = new THREE.MeshLambertMaterial({ color: 0x080a10 });
      const dashTex = InteriorTextures.createDigitalDashTexture();
      const dashMat = new THREE.MeshBasicMaterial({ map: dashTex });

      const ledWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const drlCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const tailRed = new THREE.MeshBasicMaterial({ color: 0xff1818 });

      // ────────────────────────────────────────────────────────────────────────
      // 2. CHASSIS UNDERBODY & VENTURI DIFFUSER
      // ────────────────────────────────────────────────────────────────────────
      const underFloor = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.05, 4.45), carbonMat);
      underFloor.position.y = 0.14;
      carGroup.add(underFloor);

      // Low-slung monocoque chassis core
      const chassisTub = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.36, 4.25), this.carPaintMat);
      chassisTub.position.y = 0.38;
      chassisTub.castShadow = true;
      chassisTub.receiveShadow = true;
      carGroup.add(chassisTub);

      // ────────────────────────────────────────────────────────────────────────
      // 3. FRONT AERO: SHARK NOSE, S-DUCT HOOD, SPLITTER & CANARDS
      // ────────────────────────────────────────────────────────────────────────
      // Slanted Aerodynamic Wedge Nose
      const noseWedge = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.24, 0.65), this.carPaintMat);
      noseWedge.position.set(0, 0.34, -2.15);
      carGroup.add(noseWedge);

      // Front Honeycomb Radiator Grilles
      for (const gx of [-0.55, 0.55]) {
        const radGrille = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.06), blackTrimMat);
        radGrille.position.set(gx, 0.28, -2.42);
        carGroup.add(radGrille);
      }

      // Carbon Fiber Front Splitter (Extends forward with aero blades)
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.05, 0.72), carbonMat);
      splitter.position.set(0, 0.14, -2.32);
      carGroup.add(splitter);

      // Dual Stepped Corner Dive-Planes (Canards)
      for (const cx of [-1.06, 1.06]) {
        for (let tier = 0; tier < 2; tier++) {
          const canard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.32), carbonMat);
          canard.position.set(cx, 0.22 + (tier * 0.14), -2.36 + (tier * 0.08));
          canard.rotation.z = (cx > 0) ? -0.15 : 0.15;
          carGroup.add(canard);
        }
      }

      // Sloped Aerodynamic Front Hood (Frunk)
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.14, 1.55), this.carPaintMat);
      hood.position.set(0, 0.54, -1.35);
      hood.rotation.x = 0.12;
      carGroup.add(hood);

      // Central S-Duct Aero Channel (depressed carbon air-channel)
      const sDuct = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.75), carbonMat);
      sDuct.position.set(0, 0.62, -1.55);
      sDuct.rotation.x = 0.12;
      carGroup.add(sDuct);

      // Dual Carbon Fiber Hood Heat Extractor Louvers (Stepped slats)
      for (const hx of [-0.52, 0.52]) {
        for (let slat = 0; slat < 3; slat++) {
          const louver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.12), carbonMat);
          louver.position.set(hx, 0.65 + (slat * 0.02), -1.25 + (slat * 0.18));
          louver.rotation.x = 0.35;
          carGroup.add(louver);
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 4. FRONT FENDERS & PRESSURE-RELIEF WHEEL ARCH LOUVERS
      // ────────────────────────────────────────────────────────────────────────
      for (const fx of [-0.96, 0.96]) {
        const fArch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 1.25), this.carPaintMat);
        fArch.position.set(fx, 0.46, -1.35);
        carGroup.add(fArch);

        // Top Fender Pressure-Relief Louvers (GT3 RS style)
        for (let fl = 0; fl < 3; fl++) {
          const gill = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.08), carbonMat);
          gill.position.set(fx, 0.70, -1.5 + (fl * 0.14));
          gill.rotation.x = 0.3;
          carGroup.add(gill);
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 5. MATRIX LED HEADLIGHTS & ARROW DRL LIGHTBARS
      // ────────────────────────────────────────────────────────────────────────
      for (const hx of [-0.70, 0.70]) {
        const hHousing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.14), blackTrimMat);
        hHousing.position.set(hx, 0.52, -2.22);
        hHousing.rotation.y = (hx > 0) ? -0.14 : 0.14;
        carGroup.add(hHousing);

        // Dual Projector Jewel Lenses
        for (const pOff of [-0.07, 0.07]) {
          const lens = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), ledWhite);
          lens.position.set(hx + pOff, 0.52, -2.28);
          carGroup.add(lens);
        }

        // Arrow-shaped Cyan DRL Strip
        const drl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.022, 0.03), drlCyan);
        drl.position.set(hx, 0.58, -2.26);
        drl.rotation.y = (hx > 0) ? -0.14 : 0.14;
        carGroup.add(drl);
      }

      // ────────────────────────────────────────────────────────────────────────
      // 6. COCKPIT GREENHOUSE, DOUBLE-BUBBLE ROOF & RAM-AIR ROOF SCOOP
      // ────────────────────────────────────────────────────────────────────────
      // Raked Panoramic Windshield
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.46, 1.15), glassMat);
      windshield.position.set(0, 0.84, -0.62);
      windshield.rotation.x = -0.48;
      carGroup.add(windshield);

      // Double-Bubble Aerodynamic Roof Panel
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.05, 1.25), this.carPaintMat);
      roof.position.set(0, 1.08, 0.06);
      carGroup.add(roof);

      // Central Roof Ram-Air Engine Scoop (feeder for mid-engine)
      const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.75), carbonMat);
      roofScoop.position.set(0, 1.18, 0.12);
      roofScoop.rotation.x = -0.12;
      const scoopInlet = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.04), blackTrimMat);
      scoopInlet.position.set(0, 1.21, -0.24);
      carGroup.add(roofScoop, scoopInlet);

      // Fastback Rear Engine Glass (Reveals mid-mounted V10 engine below)
      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.44, 1.25), glassMat);
      rearGlass.position.set(0, 0.86, 0.82);
      rearGlass.rotation.x = 0.38;
      carGroup.add(rearGlass);

      // Carbon Fiber Pillars (A, B, C pillars)
      for (const px of [-0.72, 0.72]) {
        const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.05), carbonMat);
        aPillar.position.set(px, 0.84, -0.62);
        aPillar.rotation.x = -0.48;

        const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.50, 0.05), carbonMat);
        cPillar.position.set(px, 0.86, 0.82);
        cPillar.rotation.x = 0.38;

        carGroup.add(aPillar, cPillar);
      }

      // Aerodynamic Carbon Fiber Side Mirrors
      for (const mx of [-0.92, 0.92]) {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), carbonMat);
        stalk.position.set(mx, 0.82, -0.60);
        stalk.rotation.z = (mx > 0) ? -0.45 : 0.45;

        const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.13), carbonMat);
        mirrorHead.position.set(mx + (mx > 0 ? 0.11 : -0.11), 0.88, -0.60);

        const mirrorFace = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.08), chromeMat);
        mirrorFace.position.set(mx + (mx > 0 ? 0.11 : -0.11), 0.88, -0.53);

        carGroup.add(stalk, mirrorHead, mirrorFace);
      }

      // ────────────────────────────────────────────────────────────────────────
      // 7. DETAILED COCKPIT INTERIOR
      // ────────────────────────────────────────────────────────────────────────
      // Sport Dashboard
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.26, 0.52), blackTrimMat);
      dash.position.set(0, 0.75, -0.72);
      carGroup.add(dash);

      // High-Resolution Digital TFT Gauge Cluster
      const clusterBox = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.16, 0.02), dashMat);
      clusterBox.position.set(-0.35, 0.82, -0.68);
      clusterBox.rotation.x = -0.25;
      carGroup.add(clusterBox);

      // Flat-Bottom GT Racing Steering Wheel with Red Stripe & Carbon Paddles
      const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.024, 8, 20), blackTrimMat);
      wheelRim.position.set(-0.35, 0.80, -0.54);
      wheelRim.rotation.x = 0.32;
      const wheelStripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.04), engineRedMat);
      wheelStripe.position.set(-0.35, 0.93, -0.58);
      const hubCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.02, 12), chromeMat);
      hubCenter.position.set(-0.35, 0.80, -0.54);
      hubCenter.rotation.x = Math.PI / 2;

      // Dual Shift Paddles behind wheel
      for (const padX of [-0.11, 0.11]) {
        const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, 0.015), carbonMat);
        paddle.position.set(-0.35 + padX, 0.81, -0.56);
        paddle.rotation.x = 0.32;
        carGroup.add(paddle);
      }
      carGroup.add(wheelRim, wheelStripe, hubCenter);

      // Twin High-Bolster Racing Bucket Seats with Harnesses
      for (const seatX of [-0.36, 0.36]) {
        // Carbon shell
        const seatShell = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.48), carbonMat);
        seatShell.position.set(seatX, 0.58, 0.05);

        // Red Alcantara cushion inserts
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.44), engineRedMat);
        cushion.position.set(seatX, 0.44, 0.02);

        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.10), engineRedMat);
        seatBack.position.set(seatX, 0.72, 0.22);
        seatBack.rotation.x = 0.12;

        const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.09), blackTrimMat);
        headrest.position.set(seatX, 0.98, 0.26);

        // 4-Point Racing Harness Straps & Silver Cam-lock Buckle
        const harnessL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.015), blackTrimMat);
        harnessL.position.set(seatX - 0.08, 0.72, 0.16);
        harnessL.rotation.x = 0.12;
        const harnessR = harnessL.clone();
        harnessR.position.x = seatX + 0.08;
        const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.01, 8), chromeMat);
        buckle.rotation.x = Math.PI / 2;
        buckle.position.set(seatX, 0.55, 0.18);

        carGroup.add(seatShell, cushion, seatBack, headrest, harnessL, harnessR, buckle);
      }

      // Center Console with Aluminum Shifter & Engine Start Button
      const consoleTunnel = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.24, 0.88), blackTrimMat);
      consoleTunnel.position.set(0, 0.50, -0.15);
      const startBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), engineRedMat);
      startBtn.position.set(0, 0.63, -0.38);
      const gearToggles = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), chromeMat);
      gearToggles.position.set(0, 0.63, -0.18);
      carGroup.add(consoleTunnel, startBtn, gearToggles);

      // Cabin Cross-Bracing Roll-Cage (Visible through glass)
      const rollHoop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.34, 8), chromeMat);
      rollHoop.rotation.z = Math.PI / 2;
      rollHoop.position.set(0, 0.95, 0.35);
      const rollDiag1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 8), chromeMat);
      rollDiag1.position.set(0, 0.72, 0.35);
      rollDiag1.rotation.z = 0.55;
      const rollDiag2 = rollDiag1.clone();
      rollDiag2.rotation.z = -0.55;
      carGroup.add(rollHoop, rollDiag1, rollDiag2);

      // ────────────────────────────────────────────────────────────────────────
      // 8. MID-MOUNTED V10 TWIN-TURBO ENGINE BAY (Under Rear Glass)
      // ────────────────────────────────────────────────────────────────────────
      // Twin Crinkle-Red Cylinder Valve Covers
      for (const cx of [-0.22, 0.22]) {
        const valveCover = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.85), engineRedMat);
        valveCover.position.set(cx, 0.62, 0.82);
        valveCover.rotation.z = (cx > 0) ? -0.15 : 0.15;
        carGroup.add(valveCover);

        // Chrome spark plug rail & oil filler cap
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.78), chromeMat);
        rail.position.set(cx, 0.70, 0.82);
        carGroup.add(rail);
      }

      // Polished Billet Aluminum Intake Plenum & Runners
      const intakePlenum = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.10, 0.72), chromeMat);
      intakePlenum.position.set(0, 0.72, 0.82);
      carGroup.add(intakePlenum);

      // Dual Carbon Conical Air Intake Filters (connected to roof scoop)
      for (const ax of [-0.28, 0.28]) {
        const airFilter = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.22, 12), carbonMat);
        airFilter.rotation.x = Math.PI / 2;
        airFilter.position.set(ax, 0.66, 0.38);
        carGroup.add(airFilter);
      }

      // Polished Twin-Turbo Exhaust Manifolds & Heat Shield
      const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), goldMat);
      heatShield.position.set(0, 0.50, 0.82);
      carGroup.add(heatShield);

      // Titanium Rear Suspension Tower X-Brace
      const xBrace1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.45, 8), titaniumMat);
      xBrace1.position.set(0, 0.78, 0.82);
      xBrace1.rotation.z = 0.65;
      const xBrace2 = xBrace1.clone();
      xBrace2.rotation.z = -0.65;
      carGroup.add(xBrace1, xBrace2);

      // ────────────────────────────────────────────────────────────────────────
      // 9. MUSCULAR REAR HAUNCHES, SIDE RADIATOR SCOOPS & SKIRTS
      // ────────────────────────────────────────────────────────────────────────
      for (const rx of [-1.02, 1.02]) {
        // Muscular flared rear fenders
        const rArch = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.48, 1.42), this.carPaintMat);
        rArch.position.set(rx, 0.50, 1.25);
        carGroup.add(rArch);

        // Massive Side Radiator Intake Pod with Carbon Splitter Blade
        const intakePod = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.55), this.carPaintMat);
        intakePod.position.set(rx, 0.46, 0.38);

        const intakeMouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.05), blackTrimMat);
        intakeMouth.position.set(rx, 0.46, 0.10);

        const splitterBlade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.42), carbonMat);
        splitterBlade.position.set(rx, 0.46, 0.38);

        carGroup.add(intakePod, intakeMouth, splitterBlade);
      }

      // Carbon Fiber Aero Side Skirts with Rear Flick-Up Winglets
      for (const sx of [-1.04, 1.04]) {
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 2.25), carbonMat);
        skirt.position.set(sx, 0.14, -0.05);

        const skirtWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.20, 0.28), carbonMat);
        skirtWinglet.position.set(sx, 0.22, 0.85);
        skirtWinglet.rotation.z = (sx > 0) ? -0.15 : 0.15;

        carGroup.add(skirt, skirtWinglet);
      }

      // ────────────────────────────────────────────────────────────────────────
      // 10. REAR FASCIA, GT SWAN-NECK WING, OLED LIGHTBAR & DIFFUSER
      // ────────────────────────────────────────────────────────────────────────
      // Continuous 3D OLED Tail-Light Bar across rear width
      const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.06, 0.04), tailRed);
      lightbar.position.set(0, 0.65, 2.15);
      carGroup.add(lightbar);

      // Rear Honeycomb Heat Extraction Mesh
      const rearMesh = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.24, 0.04), blackTrimMat);
      rearMesh.position.set(0, 0.48, 2.14);
      carGroup.add(rearMesh);

      // Aggressive Rear Venturi Diffuser with 6 Vertical Fins
      const diffuserBase = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 0.55), carbonMat);
      diffuserBase.position.set(0, 0.22, 2.18);
      diffuserBase.rotation.x = 0.16;
      carGroup.add(diffuserBase);

      const finOffsets = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
      finOffsets.forEach(fo => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.48), carbonMat);
        fin.position.set(fo, 0.20, 2.20);
        fin.rotation.x = 0.16;
        carGroup.add(fin);
      });

      // Central F1 Race Rain Light (Glowing red LED box)
      const f1RainLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), tailRed);
      f1RainLight.position.set(0, 0.20, 2.42);
      carGroup.add(f1RainLight);

      // Quad Burnt-Titanium Exhaust Pipes with Hollow Black Bores
      const exPipes = [-0.48, -0.34, 0.34, 0.48];
      exPipes.forEach(ep => {
        const pipeOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.18, 16), titaniumMat);
        pipeOuter.rotation.x = Math.PI / 2;
        pipeOuter.position.set(ep, 0.38, 2.30);

        const innerBore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.19, 12), blackTrimMat);
        innerBore.rotation.x = Math.PI / 2;
        innerBore.position.set(ep, 0.38, 2.30);

        carGroup.add(pipeOuter, innerBore);
      });

      // High-Downforce GT Swan-Neck Carbon Race Wing
      // Curved Swan-Neck Pylons arching from above
      for (const px of [-0.55, 0.55]) {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.42, 0.25), carbonMat);
        pylon.position.set(px, 1.08, 1.96);
        pylon.rotation.x = -0.22;
        carGroup.add(pylon);
      }

      // Main Carbon Aerodynamic Airfoil
      const mainWing = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.045, 0.42), carbonMat);
      mainWing.position.set(0, 1.25, 2.06);
      mainWing.rotation.x = -0.08;

      // Trailing Edge Gurney Flap
      const gurney = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.03, 0.02), carbonMat);
      gurney.position.set(0, 1.28, 2.25);

      // Aerodynamic Wing Endplates with Winglets
      for (const ex of [-1.03, 1.03]) {
        const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.46), carbonMat);
        endplate.position.set(ex, 1.25, 2.06);
        carGroup.add(endplate);
      }
      carGroup.add(mainWing, gurney);

      // ────────────────────────────────────────────────────────────────────────
      // 11. CONCAVE FORGED 10-SPOKE ALLOY WHEELS & BREMBO CERAMIC BRAKES
      // ────────────────────────────────────────────────────────────────────────
      const wheelConfigs = [
        { x: -1.02, y: 0.38, z: -1.35, r: 0.38, w: 0.28 }, // Front Left
        { x:  1.02, y: 0.38, z: -1.35, r: 0.38, w: 0.28 }, // Front Right
        { x: -1.06, y: 0.41, z:  1.35, r: 0.42, w: 0.36 }, // Rear Left (Deep-dish wide footprint)
        { x:  1.06, y: 0.41, z:  1.35, r: 0.42, w: 0.36 }  // Rear Right (Deep-dish wide footprint)
      ];

      wheelConfigs.forEach(cfg => {
        const isLeft = cfg.x < 0;
        const outerX = cfg.x + (isLeft ? -cfg.w / 2 : cfg.w / 2);
        const innerX = cfg.x + (isLeft ? cfg.w / 2 : -cfg.w / 2);

        // Low-Profile Racing Slick Tire
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(cfg.r, cfg.r, cfg.w, 28), rubberMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(cfg.x, cfg.y, cfg.z);
        tire.castShadow = true;
        carGroup.add(tire);

        // Open-Ended Hollow Rim Barrel (openEnded = true allows seeing rotor/caliper inside!)
        const rimBarrel = new THREE.Mesh(
          new THREE.CylinderGeometry(cfg.r * 0.74, cfg.r * 0.74, cfg.w - 0.02, 24, 1, true),
          chromeMat
        );
        rimBarrel.rotation.z = Math.PI / 2;
        rimBarrel.position.set(cfg.x, cfg.y, cfg.z);
        carGroup.add(rimBarrel);

        // Deep-Dish Rounded Chrome Outer Rim Lip Ring
        const rimLip = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.r * 0.74, 0.022, 8, 24),
          chromeMat
        );
        rimLip.position.set(outerX, cfg.y, cfg.z);
        rimLip.rotation.y = Math.PI / 2;
        carGroup.add(rimLip);

        // Recessed Centerlock Racing Wheel Hub Nut
        const centerNut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.065, 0.05, 12),
          isLeft ? caliperMat : titaniumMat // Anodized Red left, Blue right
        );
        centerNut.rotation.z = Math.PI / 2;
        centerNut.position.set(outerX - (isLeft ? -0.04 : 0.04), cfg.y, cfg.z);
        carGroup.add(centerNut);

        // Concave Forged 10-Spoke Split-Y Alloy Face
        for (let s = 0; s < 5; s++) {
          const spokeAngle = (s * Math.PI * 2) / 5;
          for (const split of [-0.10, 0.10]) {
            const spokeA = spokeAngle + split;
            const spokeY = Math.cos(spokeA) * (cfg.r * 0.36);
            const spokeZ = Math.sin(spokeA) * (cfg.r * 0.36);

            const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, cfg.r * 0.64, 0.028), chromeMat);
            spoke.position.set(
              outerX - (isLeft ? -0.02 : 0.02),
              cfg.y + spokeY,
              cfg.z + spokeZ
            );
            spoke.rotation.x = -spokeA;
            carGroup.add(spoke);
          }
        }

        // Cross-Drilled Ceramic Brake Rotor (Machined texture + cooling holes)
        const rotor = new THREE.Mesh(
          new THREE.CylinderGeometry(cfg.r * 0.70, cfg.r * 0.70, 0.035, 24),
          rotorMat
        );
        rotor.rotation.z = Math.PI / 2;
        rotor.position.set(cfg.x + (isLeft ? 0.03 : -0.03), cfg.y, cfg.z);
        carGroup.add(rotor);

        // Massive 6-Piston Brembo Brake Caliper (Visible between spokes!)
        const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.28), caliperMat);
        caliper.position.set(
          cfg.x + (isLeft ? 0.03 : -0.03),
          cfg.y + 0.15,
          cfg.z - 0.09
        );
        caliper.rotation.x = -0.38;

        // White Brembo Brand Script Plate on Caliper
        const calScript = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.18), ledWhite);
        calScript.position.set(
          cfg.x + (isLeft ? -0.02 : 0.08),
          cfg.y + 0.15,
          cfg.z - 0.09
        );
        calScript.rotation.y = isLeft ? -Math.PI / 2 : Math.PI / 2;
        calScript.rotation.x = -0.38;

        carGroup.add(caliper, calScript);
      });

      // ────────────────────────────────────────────────────────────────────────
      // 12. DYNAMIC NEON UNDERGLOW & TURNTABLE GLOW POOL
      // ────────────────────────────────────────────────────────────────────────
      const underglowTubeL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.5, 8), this.underglowMat);
      underglowTubeL.rotation.x = Math.PI / 2;
      underglowTubeL.position.set(-0.85, 0.11, 0);
      const underglowTubeR = underglowTubeL.clone();
      underglowTubeR.position.x = 0.85;
      carGroup.add(underglowTubeL, underglowTubeR);

      // Soft Projected Floor Glow Pool onto Turntable
      const underglowPool = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 5.0),
        new THREE.MeshBasicMaterial({
          map: InteriorTextures.createLightPoolTexture(),
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.82,
          depthWrite: false
        })
      );
      underglowPool.rotation.x = -Math.PI / 2;
      underglowPool.position.set(0, 0.02, 0);
      this.underglowPool = underglowPool;
      carGroup.add(underglowPool);

      // Active Real Dynamic Point Light under chassis
      this.underglowPointLight = new THREE.PointLight(0x06b6d4, 3.4, 5.5, 1.4);
      this.underglowPointLight.position.set(0, 0.14, 0);
      carGroup.add(this.underglowPointLight);

      this.turntableCar = carGroup;
      this.turntable.add(carGroup);
    }

    setCarPaint(colorHex, underglowHex) {
      if (this.carPaintMat && colorHex) {
        this.carPaintMat.color.setHex(colorHex);
      }
      if (this.underglowMat && underglowHex) {
        this.underglowMat.color.setHex(underglowHex);
      }
      if (this.underglowPool && underglowHex) {
        this.underglowPool.material.color.setHex(underglowHex);
      }
      if (this.underglowPointLight && underglowHex) {
        this.underglowPointLight.color.setHex(underglowHex);
      }
    }

    /**
     * Bind browser keyboard controls for walk and interaction
     */
    bindControls() {
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });
    }
  }

  // Export globally
  window.RoomArchitect = RoomArchitect;

})(window);
