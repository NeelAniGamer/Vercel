// @ts-nocheck
import * as THREE from 'three';
import { Renderer } from './Renderer';
import { InputManager } from './Input';
import { PacejkaModel, VEHICLE_STATS, VehicleStats, WheelLoads, SlipAngles } from './Physics';
import { RoadGraph, RoadConfig, RoadNode, RoadEdge } from '@systems/RoadGraph';
import { TrafficManager } from '@systems/TrafficManager';
import { ThreePools } from '@systems/Pools';
import { store } from '@state/store';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  platform: 'electron' | 'web';
  quality?: 'Low' | 'Medium' | 'High' | 'Ultra';
  vehicleType?: string;
  soundEnabled?: boolean;
}

export type CameraMode = 'CHASE' | 'HOOD' | 'TOP_DOWN' | 'ORBIT';

export class GameEngine {
  public renderer: Renderer;
  public input: InputManager;
  public roadGraph: RoadGraph | null = null;
  public trafficManager: TrafficManager | null = null;
  public config: GameConfig;
  public platform: string;
  public playerVehicle: THREE.Group | null = null;

  // Vehicle class stats & type
  public vehicleType: string = 'car';
  public vehicleStats: VehicleStats;

  // High-fidelity dynamic physics state (SI units: m, m/s, rad, rad/s)
  public speed = 0;              // Forward speed in m/s (true physical velocity)
  public vx = 0;                 // Forward velocity (m/s)
  public vy = 0;                 // Lateral velocity (m/s)
  public yaw = 0;                // Heading angle (rad)
  public yawRate = 0;            // Angular yaw rate (rad/s)
  public steerAngle = 0;         // Current front wheel steering angle (rad)
  public gear: 'P' | 'R' | 'N' | 'D' = 'D';
  public rpm = 850;              // Engine RPM
  public throttle = 0;           // Throttle pedal (0..1)
  public brakeInput = 0;         // Brake pedal (0..1)
  public handbrake = false;      // E-brake engaged
  public lateralAccel = 0;       // m/s^2
  public longitudinalAccel = 0;  // m/s^2
  public pitchAngle = 0;         // Suspension pitch (dive/squat)
  public rollAngle = 0;          // Suspension roll (cornering lean)
  public wheelLoads: WheelLoads | null = null;
  public slipAngles: SlipAngles | null = null;
  public absActive = false;
  public tcsActive = false;

  // Camera system
  public cameraMode: CameraMode = 'CHASE';
  private cameraOffset = new THREE.Vector3(0, 5.0, -10.0);
  private cameraTarget = new THREE.Vector3();
  private cameraShake = 0;

  // Environment & world geometry
  public roadMeshes: THREE.Mesh[] = [];
  public roadGroup: THREE.Group = new THREE.Group();
  public signalsGroup: THREE.Group = new THREE.Group();
  public trafficSignals: any[] = [];
  public mapCfg: any = null;

  // Gameplay & scoring state
  public score = 1000;
  public violationsLog: string[] = [];
  public timer = 0;
  public currentLevel: string | null = null;
  public currentMode: string = 'LEARN';

  // Game loop controls
  private running = false;
  private paused = false;
  private lastTime = 0;
  private animationFrameId = 0;

  // Audio synthesis (Web Audio API)
  private audioCtx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private tireGain: GainNode | null = null;
  private soundEnabled = true;

  constructor(config: GameConfig) {
    this.config = config;
    this.platform = config.platform || 'web';
    this.soundEnabled = config.soundEnabled !== false;

    // Initialize object pooling
    ThreePools.init();

    // Create WebGL renderer
    this.renderer = new Renderer({
      canvas: config.canvas,
      quality: config.quality
    });

    // Create input manager
    this.input = new InputManager();

    // Set initial vehicle stats
    this.vehicleType = config.vehicleType || 'car';
    this.vehicleStats = VEHICLE_STATS[this.vehicleType] || VEHICLE_STATS.car;

    // Add scene groups
    this.renderer.scene.add(this.roadGroup);
    this.renderer.scene.add(this.signalsGroup);

    // Build player vehicle 3D representation
    this._initPlayerVehicle();

    // Initialize Traffic Manager
    this.trafficManager = new TrafficManager(this);

    // Initialize procedural sound synthesis
    if (this.soundEnabled && typeof window !== 'undefined') {
      this._initAudio();
    }

    console.log(`[GameEngine] Initialized (${this.platform}) with vehicle: ${this.vehicleType}`);
  }

  /**
   * Initialize procedural Web Audio synthesis for engine, tires, and horn
   */
  private _initAudio(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();

      // Engine oscillator (frequency modulated by RPM)
      this.engineOsc = this.audioCtx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.audioCtx.currentTime);

      this.engineGain = this.audioCtx.createGain();
      this.engineGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.audioCtx.destination);
      this.engineOsc.start();

      // Tire screech noise node
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const tireFilter = this.audioCtx.createBiquadFilter();
      tireFilter.type = 'bandpass';
      tireFilter.frequency.setValueAtTime(950, this.audioCtx.currentTime);
      tireFilter.Q.setValueAtTime(3.0, this.audioCtx.currentTime);

      this.tireGain = this.audioCtx.createGain();
      this.tireGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);

      whiteNoise.connect(tireFilter);
      tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.audioCtx.destination);
      whiteNoise.start();
    } catch {
      // Audio autoplay may require user interaction
    }
  }

  /**
   * Sound horn with authentic Indian vehicle dual-tone
   */
  public triggerHorn(): void {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const t = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(370, t);
    osc2.frequency.setValueAtTime(440, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.38);
    osc2.stop(t + 0.38);

    // Trigger NPC horn propagation
    if (this.trafficManager && typeof this.trafficManager.propagateHornReaction === 'function' && this.playerVehicle) {
      this.trafficManager.propagateHornReaction(this.playerVehicle.position, this.playerVehicle, 25.0);
    }
  }

  /**
   * Switch vehicle class profile
   */
  public setVehicleType(type: string): void {
    if (VEHICLE_STATS[type]) {
      this.vehicleType = type;
      this.vehicleStats = VEHICLE_STATS[type];
      this._initPlayerVehicle();
      console.log(`[GameEngine] Switched to vehicle: ${type}`);
    }
  }

  /**
   * Cycle or set camera mode
   */
  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
    switch (mode) {
      case 'CHASE':
        this.cameraOffset.set(0, 5.0, -10.0);
        break;
      case 'HOOD':
        this.cameraOffset.set(0, 1.3, 0.4);
        break;
      case 'TOP_DOWN':
        this.cameraOffset.set(0, 35.0, -0.1);
        break;
      case 'ORBIT':
        this.cameraOffset.set(7.0, 4.0, -7.0);
        break;
    }
  }

  private _initPlayerVehicle(): void {
    if (this.playerVehicle) {
      this.renderer.scene.remove(this.playerVehicle);
    }

    const group = new THREE.Group();
    const stats = this.vehicleStats;
    const wb = stats.wheelBase;
    const tw = stats.trackWidth;

    // Colors by vehicle type
    const colorMap: Record<string, number> = {
      car: 0x2563eb,
      auto: 0xf59e0b,
      bike: 0xef4444,
      bus: 0x10b981,
      truck: 0xd97706,
      lambo: 0xec4899
    };
    const bodyColor = colorMap[this.vehicleType] || 0x2563eb;

    // Main Chassis
    const length = wb * 1.6;
    const height = stats.cgHeight * 1.5;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.25,
      metalness: 0.85
    });
    const bodyGeo = new THREE.BoxGeometry(tw, height * 0.6, length);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = height * 0.45;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Cabin / Roof
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.95
    });
    const roofGeo = new THREE.BoxGeometry(tw * 0.85, height * 0.5, length * 0.5);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, height * 0.9, -length * 0.05);
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Headlights (Warm LED)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    [-tw * 0.38, tw * 0.38].forEach(x => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), headlightMat);
      hl.position.set(x, height * 0.45, length * 0.5);
      group.add(hl);
    });

    // Taillights (Red)
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    [-tw * 0.38, tw * 0.38].forEach(x => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.05), taillightMat);
      tl.position.set(x, height * 0.48, -length * 0.5);
      group.add(tl);
    });

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const wheelR = 0.36;
    const wheelW = 0.24;
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const halfWb = wb * 0.5;
    const halfTw = tw * 0.52;
    const wheelPositions = [
      [-halfTw, wheelR, halfWb],
      [halfTw, wheelR, halfWb],
      [-halfTw, wheelR, -halfWb],
      [halfTw, wheelR, -halfWb]
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wMesh.position.set(x, y, z);
      wMesh.castShadow = true;
      group.add(wMesh);
    });

    this.playerVehicle = group;
    this.renderer.scene.add(group);
  }

  /**
   * Build road graph and paved 3D asphalt road ribbons from config
   */
  public buildRoadGraph(config: RoadConfig): void {
    this.roadGraph = RoadGraph.fromLevelConfig(config);

    // Clean up previous road meshes
    while (this.roadGroup.children.length > 0) {
      const c = this.roadGroup.children[0];
      this.roadGroup.remove(c);
      if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
    }
    this.roadMeshes = [];

    // Asphalt road surface material
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.85,
      metalness: 0.1
    });

    // Marking material (crisp white stripes)
    const markingMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // Curb material
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.9
    });

    // Generate asphalt ribbon for each road edge
    this.roadGraph.edges.forEach(edge => {
      const p1 = edge.nodes[0].position;
      const p2 = edge.nodes[1].position;
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);
      const midX = (p1.x + p2.x) * 0.5;
      const midZ = (p1.z + p2.z) * 0.5;
      const rotY = Math.atan2(dx, dz);

      // Main roadway mesh
      const roadGeo = new THREE.PlaneGeometry(edge.width, len);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.position.set(midX, 0.02, midZ);
      roadMesh.rotation.y = rotY;
      roadMesh.receiveShadow = true;
      this.roadGroup.add(roadMesh);
      this.roadMeshes.push(roadMesh);

      // Dashed lane divider
      if (edge.lanes > 1) {
        const stripeGeo = new THREE.PlaneGeometry(0.2, len * 0.95);
        stripeGeo.rotateX(-Math.PI / 2);
        const stripeMesh = new THREE.Mesh(stripeGeo, markingMat);
        stripeMesh.position.set(midX, 0.025, midZ);
        stripeMesh.rotation.y = rotY;
        this.roadGroup.add(stripeMesh);
      }

      // Concrete curbs on borders
      [-edge.width * 0.5 - 0.15, edge.width * 0.5 + 0.15].forEach(sideX => {
        const curbGeo = new THREE.BoxGeometry(0.3, 0.18, len);
        const curbMesh = new THREE.Mesh(curbGeo, curbMat);
        curbMesh.position.set(0, 0.09, 0);

        const curbPivot = new THREE.Group();
        curbPivot.position.set(midX, 0, midZ);
        curbPivot.rotation.y = rotY;
        curbMesh.position.x = sideX;
        curbPivot.add(curbMesh);
        this.roadGroup.add(curbPivot);
      });
    });

    // Populate Traffic Manager
    if (this.trafficManager) {
      this.trafficManager.roadGraph = this.roadGraph;
      this.trafficManager.initFromLevelConfig(config);
    }

    console.log(`[GameEngine] Road network built: ${this.roadGraph.nodes.size} nodes, ${this.roadGraph.edges.size} edges, ${this.roadMeshes.length} paved roads`);
  }

  /**
   * Load level by ID or custom configuration
   */
  public loadLevel(levelIdOrConfig: string | RoadConfig, mode: string = 'LEARN'): void {
    if (typeof levelIdOrConfig === 'string') {
      this.currentLevel = levelIdOrConfig;
      this.currentMode = mode;
      store.getState().setCurrentLevel(levelIdOrConfig, mode);

      // Check global level registry (window.LVS) or fallback to standard Mumbai arterial grid
      const lvlData = typeof window !== 'undefined' && (window as any).LVS ? (window as any).LVS[levelIdOrConfig] : null;
      if (lvlData && lvlData.roads) {
        this.mapCfg = lvlData;
        this.buildRoadGraph(lvlData);
      } else {
        this.buildRoadGraph({
          roads: [
            { type: 'v', x: 0, z1: -600, z2: 600, lanes: 2, width: 24, speedLimit: 60, roadType: 'arterial' },
            { type: 'h', z: 0, x1: -600, x2: 600, lanes: 2, width: 24, speedLimit: 60, roadType: 'arterial' },
            { type: 'h', z: -250, x1: -400, x2: 400, lanes: 1, width: 14, speedLimit: 40, roadType: 'residential' },
            { type: 'h', z: 250, x1: -400, x2: 400, lanes: 1, width: 14, speedLimit: 40, roadType: 'commercial' }
          ],
          anchorNodes: [
            { x: 0, z: 0, zone: 'Junction Central' },
            { x: 0, z: -250, zone: 'North Cross' },
            { x: 0, z: 250, zone: 'South Cross' }
          ]
        });
      }
    } else {
      this.buildRoadGraph(levelIdOrConfig);
    }

    // Reset vehicle to origin / start line
    this.resetVehicle(0, 0, 0);
  }

  /**
   * Reset player vehicle position and physical velocity
   */
  public resetVehicle(x = 0, z = 0, heading = 0): void {
    this.speed = 0;
    this.vx = 0;
    this.vy = 0;
    this.yaw = heading;
    this.yawRate = 0;
    this.steerAngle = 0;
    this.gear = 'D';
    this.rpm = 850;
    this.throttle = 0;
    this.brakeInput = 0;
    this.lateralAccel = 0;
    this.longitudinalAccel = 0;
    this.pitchAngle = 0;
    this.rollAngle = 0;
    this.cameraShake = 0;

    if (this.playerVehicle) {
      this.playerVehicle.position.set(x, 0, z);
      this.playerVehicle.rotation.set(0, heading, 0);
    }

    // Snap camera to behind vehicle
    const rotatedOffset = this.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    this.renderer.camera.position.set(x + rotatedOffset.x, rotatedOffset.y, z + rotatedOffset.z);
    this.renderer.camera.lookAt(x, 1.2, z);
  }

  /**
   * Start engine loop
   */
  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
    console.log('[GameEngine] Running');
  }

  /**
   * Stop engine loop
   */
  public stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
    console.log('[GameEngine] Stopped');
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    store.getState().setPaused(paused);
  }

  /**
   * Main game animation loop
   */
  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1); // clamp to 100ms max to prevent spiral of death
    this.lastTime = now;
    this.timer += dt;

    if (!this.paused) {
      this.update(dt);
    }

    this.renderer.update(dt);
    this.renderer.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Core frame update
   */
  private update(dt: number): void {
    // 1. Process inputs
    this.input.update();

    if (this.input.consume('pause')) {
      this.setPaused(!this.paused);
      return;
    }
    if (this.input.consume('restart') && this.currentLevel) {
      this.loadLevel(this.currentLevel, this.currentMode);
      return;
    }
    if (this.input.consume('cameraToggle')) {
      const modes: CameraMode[] = ['CHASE', 'HOOD', 'TOP_DOWN', 'ORBIT'];
      const nextIndex = (modes.indexOf(this.cameraMode) + 1) % modes.length;
      this.setCameraMode(modes[nextIndex]);
    }
    if (this.input.state.horn) {
      this.triggerHorn();
      this.input.state.horn = false;
    }

    // 2. High-fidelity vehicle physics simulation
    this._updatePhysics(dt);

    // 3. Update Traffic Manager & NPC behaviors
    if (this.trafficManager) {
      this.trafficManager.update(dt);
    }

    // 4. Collision detection & physical resolution
    this._updateCollisions(dt);

    // 5. Update Camera
    this._updateCamera(dt);

    // 6. Update Audio synthesis
    this._updateAudio();

    // 7. Update Store Telemetry
    this._updateTelemetry();
  }

  /**
   * Full Pacejka Magic Formula 5.2 Dynamic Physics Pipeline
   */
  private _updatePhysics(dt: number): void {
    const stats = this.vehicleStats;
    const g = 9.81;

    // Read steering input
    let steerIn = 0;
    if (this.input.state.left) steerIn -= 1;
    if (this.input.state.right) steerIn += 1;
    if (this.input.touch.steering !== 0) steerIn = this.input.touch.steering;

    // Speed-dependent steering taper (prevents twitchy high-speed flips)
    const currentKmh = Math.abs(this.speed) * 3.6;
    const speedSteerFactor = Math.max(0.25, 1.0 - (currentKmh / 140.0) * 0.65);
    const targetSteer = steerIn * stats.maxSteerAngle * speedSteerFactor;

    // Smooth steering rack rate
    const steerRate = 3.5; // rad/s
    this.steerAngle += THREE.MathUtils.clamp(targetSteer - this.steerAngle, -steerRate * dt, steerRate * dt);

    // Read pedals
    const accelPressed = this.input.state.forward || this.input.touch.throttle;
    const brakePressed = this.input.state.brake || this.input.touch.brake;
    const reversePressed = this.input.state.backward;

    // Gear selection logic
    if (reversePressed && this.speed < 0.5) {
      this.gear = 'R';
    } else if (accelPressed && this.speed >= -0.2) {
      this.gear = 'D';
    }

    // Throttle & Brake demands
    this.throttle = (this.gear === 'D' && accelPressed) || (this.gear === 'R' && reversePressed) ? 1.0 : 0.0;
    this.brakeInput = brakePressed ? 1.0 : ((this.gear === 'D' && reversePressed) || (this.gear === 'R' && accelPressed) ? 0.8 : 0.0);

    // Dynamic 4-wheel weight transfer (loads conserved: frontTotal + rearTotal === totalWeight)
    this.wheelLoads = PacejkaModel.calculateWeightTransfer(
      stats.mass,
      this.longitudinalAccel,
      this.lateralAccel,
      stats.wheelBase,
      stats.trackWidth,
      stats.cgHeight,
      stats.frontWeightDist
    );

    // Dynamic slip angles
    this.slipAngles = PacejkaModel.calculateSlipAngles(
      this.speed,
      this.vy,
      this.yawRate,
      this.steerAngle,
      stats.wheelBase,
      stats.frontWeightDist
    );

    // Tire lateral forces (Pacejka MF 5.2)
    const frontFriction = PacejkaModel.calculateLateralForce(this.slipAngles.front, stats.tire, 'dry_asphalt', this.wheelLoads.frontTotal);
    const rearFriction = PacejkaModel.calculateLateralForce(this.slipAngles.rear, stats.tire, 'dry_asphalt', this.wheelLoads.rearTotal);

    // Longitudinal forces (drive, brake, aero, rolling resistance)
    let driveForce = 0;
    if (this.throttle > 0) {
      const maxDriveForce = (stats.maxPower / Math.max(2.5, Math.abs(this.speed)));
      driveForce = Math.min(stats.mass * 4.8, maxDriveForce * this.throttle);
      if (this.gear === 'R') driveForce = -driveForce * 0.45;

      // Apply TCS
      const tcsRes = PacejkaModel.applyTCS(driveForce, Math.abs(this.slipAngles.front));
      driveForce = tcsRes.driveForce;
      this.tcsActive = tcsRes.tcsActive;
    } else {
      this.tcsActive = false;
    }

    let brakeForce = 0;
    if (this.brakeInput > 0) {
      const reqBrake = stats.maxBrakeForce * this.brakeInput;
      const absRes = PacejkaModel.applyABS(reqBrake, Math.abs(this.slipAngles.front));
      brakeForce = absRes.brakeForce;
      this.absActive = absRes.absActive;
    } else {
      this.absActive = false;
    }

    // Aerodynamic Drag & Rolling Resistance
    const rho = 1.225; // air density (kg/m^3)
    const frontalArea = stats.trackWidth * stats.cgHeight * 1.8;
    const aeroDrag = 0.5 * rho * stats.dragCoeff * frontalArea * (this.speed * this.speed) * Math.sign(this.speed);
    const rollResistance = stats.rollResist * stats.mass * g * Math.sign(this.speed);

    // Net longitudinal force
    const brakeDir = Math.sign(this.speed) || 1;
    const netLongForce = driveForce - (brakeForce * brakeDir) - aeroDrag - rollResistance;
    this.longitudinalAccel = netLongForce / stats.mass;

    // Angular momentum balance: Mz = F_front * lf * cos(steer) - F_rear * lr
    const lr = stats.wheelBase * stats.frontWeightDist;
    const lf = stats.wheelBase - lr;
    const Mz = (frontFriction * lf * Math.cos(this.steerAngle)) - (rearFriction * lr);
    const Iz = stats.mass * Math.pow(stats.wheelBase * 0.5, 2) * 0.95; // vehicle moment of inertia

    const yawAccel = Mz / Iz;
    this.yawRate += yawAccel * dt;
    this.yawRate *= Math.pow(0.92, dt * 60); // tire damping
    this.yaw += this.yawRate * dt;

    // Forward speed integration
    this.speed += this.longitudinalAccel * dt;
    if (Math.abs(this.speed) < 0.02 && this.throttle === 0 && this.brakeInput > 0) {
      this.speed = 0;
    }

    // Lateral velocity integration (vy)
    const totalLatForce = (frontFriction * Math.cos(this.steerAngle)) + rearFriction;
    this.lateralAccel = totalLatForce / stats.mass;
    this.vy += (this.lateralAccel - this.yawRate * this.speed) * dt;
    this.vy *= Math.pow(0.85, dt * 60);

    // Position integration in world coordinates
    this.vx = Math.sin(this.yaw) * this.speed + Math.cos(this.yaw) * this.vy;
    const vz = Math.cos(this.yaw) * this.speed - Math.sin(this.yaw) * this.vy;

    if (this.playerVehicle) {
      this.playerVehicle.position.x += this.vx * dt;
      this.playerVehicle.position.z += vz * dt;

      // Suspension pitch & roll animations
      this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, -this.longitudinalAccel * 0.008, dt * 8);
      this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, -this.lateralAccel * 0.012, dt * 8);

      this.playerVehicle.rotation.y = this.yaw;
      this.playerVehicle.rotation.x = this.pitchAngle;
      this.playerVehicle.rotation.z = this.rollAngle;
    }

    // Engine RPM calculation
    this.rpm = PacejkaModel.calculateEngineRPM(this.speed, this.gear, 0.36, 850, 6800);
  }

  /**
   * Collision detection against NPC traffic, barriers, and obstacles with MTV resolution
   */
  private _updateCollisions(dt: number): void {
    if (!this.playerVehicle || !this.trafficManager) return;

    const pPos = this.playerVehicle.position;
    const pRot = this.playerVehicle.rotation.y;
    const pHalfW = (this.vehicleStats.trackWidth * 0.5) + 0.1;
    const pHalfD = (this.vehicleStats.wheelBase * 0.8) + 0.2;

    const npcs = this.trafficManager.vehicles || [];
    for (let i = 0; i < npcs.length; i++) {
      const v = npcs[i];
      if (!v || !v.active || !v.position) continue;

      const dx = pPos.x - v.position.x;
      const dz = pPos.z - v.position.z;
      const distSq = dx * dx + dz * dz;

      const vHalfW = v.mesh?.userData?.halfW || 1.15;
      const vHalfD = v.mesh?.userData?.halfD || 2.2;
      const maxR = Math.max(pHalfW, pHalfD) + Math.max(vHalfW, vHalfD);

      if (distSq < (maxR + 0.5) * (maxR + 0.5)) {
        // True inverse rotation into vehicle local frame (MATH-2-1)
        const vRot = v.rotation ? (typeof v.rotation.y === 'number' ? v.rotation.y : v.rotation) : 0;
        const cosV = Math.cos(vRot);
        const sinV = Math.sin(vRot);
        const vLocX = cosV * dx - sinV * dz;
        const vLocZ = sinV * dx + cosV * dz;

        // OBB projection
        const angleDiff = pRot - vRot;
        const cosDiff = Math.abs(Math.cos(angleDiff));
        const sinDiff = Math.abs(Math.sin(angleDiff));
        const pProjW = pHalfW * cosDiff + pHalfD * sinDiff;
        const pProjD = pHalfW * sinDiff + pHalfD * cosDiff;

        const overlapX = (vHalfW + pProjW) - Math.abs(vLocX);
        const overlapZ = (vHalfD + pProjD) - Math.abs(vLocZ);

        if (overlapX > 0 && overlapZ > 0 && !(v as any)._justHit) {
          (v as any)._justHit = true;
          (v as any)._justHitUntil = this.timer + 1.0;

          // Relative speed in physical m/s (MATH-2-3)
          const npcSpeed = Math.abs(v.npcAI?.currentSpeed || v.speed || 0);
          const relSpeed = Math.abs(npcSpeed - Math.abs(this.speed));
          const isGentleTouch = relSpeed < 3.5;

          // Minimum Translation Vector (MTV) separation along axis of least penetration (MATH-2-5)
          const pushSep = isGentleTouch ? 0.08 : 0.18;
          if (overlapX < overlapZ) {
            const pushLX = (vLocX > 0 ? overlapX + pushSep : -(overlapX + pushSep));
            this.playerVehicle.position.x += cosV * pushLX;
            this.playerVehicle.position.z -= sinV * pushLX;
          } else {
            const pushLZ = (vLocZ > 0 ? overlapZ + pushSep : -(overlapZ + pushSep));
            this.playerVehicle.position.x += sinV * pushLZ;
            this.playerVehicle.position.z += cosV * pushLZ;
          }

          if (isGentleTouch) {
            this.speed *= 0.85;
          } else {
            this.speed = 0;
            this.vx = 0;
            this.vy = 0;
            this.yawRate = 0;
            this.cameraShake = 0.5;
            this.violationsLog.push('TRAFFIC_COLLISION');
            this.score = Math.max(0, this.score - 50);
          }
        }
      }
    }
  }

  /**
   * Smooth dynamic camera tracking
   */
  private _updateCamera(dt: number): void {
    if (!this.playerVehicle) return;

    const pPos = this.playerVehicle.position;

    if (this.cameraMode === 'CHASE') {
      // Dynamic speed FOV kick
      const targetFov = 60 + Math.min(22, (Math.abs(this.speed) * 3.6) * 0.18);
      this.renderer.camera.fov = THREE.MathUtils.lerp(this.renderer.camera.fov, targetFov, dt * 4);
      this.renderer.camera.updateProjectionMatrix();

      // Smooth follow target behind vehicle
      const rotatedOffset = this.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const desiredPos = pPos.clone().add(rotatedOffset);

      if (this.cameraShake > 0) {
        desiredPos.x += (Math.random() - 0.5) * this.cameraShake;
        desiredPos.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = Math.max(0, this.cameraShake - dt * 2);
      }

      this.renderer.camera.position.lerp(desiredPos, Math.min(1.0, dt * 6.5));
      this.cameraTarget.lerp(new THREE.Vector3(pPos.x, pPos.y + 1.2, pPos.z), Math.min(1.0, dt * 10.0));
      this.renderer.camera.lookAt(this.cameraTarget);
    } else if (this.cameraMode === 'HOOD') {
      this.renderer.camera.fov = 72;
      this.renderer.camera.updateProjectionMatrix();
      const hoodOffset = this.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.renderer.camera.position.copy(pPos).add(hoodOffset);

      const lookTarget = pPos.clone().add(new THREE.Vector3(Math.sin(this.yaw) * 20, 1.3, Math.cos(this.yaw) * 20));
      this.renderer.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 'TOP_DOWN') {
      this.renderer.camera.position.set(pPos.x, 40, pPos.z - 0.1);
      this.renderer.camera.lookAt(pPos.x, 0, pPos.z);
    } else if (this.cameraMode === 'ORBIT') {
      const orbitOffset = this.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.timer * 0.4);
      this.renderer.camera.position.copy(pPos).add(orbitOffset);
      this.renderer.camera.lookAt(pPos.x, 1.2, pPos.z);
    }
  }

  /**
   * Modulate procedural audio by speed, RPM, and tire slip
   */
  private _updateAudio(): void {
    if (!this.audioCtx || !this.engineOsc || !this.engineGain || !this.tireGain) return;
    if (this.audioCtx.state === 'suspended' && (this.input.state.forward || this.input.state.brake)) {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;
    // Engine pitch follows RPM: 40Hz at 850 RPM -> 380Hz at 6500 RPM
    const targetFreq = 40 + ((this.rpm - 850) / (6500 - 850)) * 340;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);

    // Engine volume increases with throttle
    const targetGain = 0.03 + (this.throttle * 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);

    // Tire squeal gain when lateral accel > 5.5 m/s^2 or during hard braking
    const tireSlipAmount = Math.max(0, Math.abs(this.lateralAccel) - 5.5) / 5.0;
    const brakeSqueal = this.absActive ? 0.08 : 0.0;
    const targetTireGain = Math.min(0.12, tireSlipAmount * 0.1 + brakeSqueal);
    this.tireGain.gain.setTargetAtTime(targetTireGain, t, 0.04);
  }

  /**
   * Sync telemetry to Zustand store
   */
  private _updateTelemetry(): void {
    const kmh = Math.round(Math.abs(this.speed) * 3.6);
    store.getState().setTelemetry({
      speed: kmh,
      speedMs: this.speed,
      rpm: Math.round(this.rpm),
      gear: this.gear,
      absActive: this.absActive,
      tcsActive: this.tcsActive,
      score: this.score,
      violations: this.violationsLog
    });
  }

  /**
   * Clean up all GPU and audio resources
   */
  public dispose(): void {
    this.stop();
    this.input.dispose();
    this.renderer.dispose();
    ThreePools.releaseAll();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    console.log('[GameEngine] Disposed');
  }
}

// Global exposure for browser/scripts compatibility
if (typeof window !== 'undefined') {
  (window as any).GameEngine = GameEngine;
  (window as any).Game = GameEngine;
}
