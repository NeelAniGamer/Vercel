// @ts-nocheck
import * as THREE from 'three';
import { Renderer } from './Renderer';
import { InputManager } from './Input';
import { RoadGraph, RoadConfig } from '@systems/RoadGraph';
import { ThreePools } from '@systems/Pools';
import { store, GameState } from '@state/store';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  platform: 'electron' | 'web';
  quality?: 'Low' | 'Medium' | 'High' | 'Ultra';
}

export class Game {
  public renderer: Renderer;
  public input: InputManager;
  public roadGraph: RoadGraph | null = null;
  public config: GameConfig;
  public platform: string;
  public playerVehicle: THREE.Object3D | null = null;
  public speed = 0;
  public yaw = 0;

  private running = false;
  private paused = false;
  private lastTime = 0;
  private animationFrameId = 0;
  private currentLevel: string | null = null;
  private currentMode: string = 'LEARN';
  private cameraOffset = new THREE.Vector3(0, 6, -11);

  constructor(config: GameConfig) {
    this.config = config;
    this.platform = config.platform;

    // Initialize object pooling
    ThreePools.init();

    // Create WebGL renderer
    this.renderer = new Renderer({
      canvas: config.canvas,
      quality: config.quality
    });

    // Create input manager
    this.input = new InputManager();

    // Create default player vehicle representation
    this._initPlayerVehicle();

    console.log(`[Game] Initialized on platform: ${this.platform}`);
  }

  private _initPlayerVehicle(): void {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.8 });
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.9, 4.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Cabin roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.9 });
    const roofGeo = new THREE.BoxGeometry(1.6, 0.65, 2.2);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 1.15, -0.2);
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelPositions = [
      [-0.95, 0.38, 1.3],
      [0.95, 0.38, 1.3],
      [-0.95, 0.38, -1.3],
      [0.95, 0.38, -1.3]
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
   * Load and start a level
   */
  loadLevel(levelId: string, mode: string = 'LEARN'): void {
    this.currentLevel = levelId;
    this.currentMode = mode;
    store.getState().setCurrentLevel(levelId, mode);
    console.log(`[Game] Loading level: ${levelId}, mode: ${mode}`);

    // Build standard default city grid if no custom graph provided
    this.buildRoadGraph({
      roads: [
        { type: 'v', x: 0, z1: -500, z2: 500, lanes: 2, width: 24, speedLimit: 60, roadType: 'arterial' },
        { type: 'h', z: 0, x1: -500, x2: 500, lanes: 2, width: 24, speedLimit: 60, roadType: 'arterial' }
      ],
      anchorNodes: [
        { x: 0, z: 0, zone: 'Commercial' },
        { x: -300, z: -300, zone: 'Residential' },
        { x: 300, z: 300, zone: 'Industrial' }
      ]
    });

    // Reset vehicle position
    if (this.playerVehicle) {
      this.playerVehicle.position.set(0, 0, 0);
      this.playerVehicle.rotation.set(0, 0, 0);
    }
    this.speed = 0;
    this.yaw = 0;
  }

  /**
   * Build road graph from level config
   */
  buildRoadGraph(config: RoadConfig): void {
    this.roadGraph = RoadGraph.fromLevelConfig(config);
    console.log(`[Game] Road graph: ${this.roadGraph.nodes.size} nodes, ${this.roadGraph.edges.size} edges`);
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
    console.log('[Game] Started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
    console.log('[Game] Stopped');
  }

  /**
   * Pause/unpause
   */
  setPaused(paused: boolean): void {
    this.paused = paused;
    store.getState().setPaused(paused);
  }

  /**
   * Main game loop
   */
  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = now;

    if (!this.paused) {
      this.update(deltaTime);
    }

    this.renderer.update(deltaTime);
    this.renderer.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Update game logic
   */
  private update(deltaTime: number): void {
    // Input
    this.input.update();

    // Handle single-press actions
    if (this.input.consume('pause')) {
      this.setPaused(!this.paused);
    }
    if (this.input.consume('restart') && this.currentLevel) {
      this.loadLevel(this.currentLevel, this.currentMode);
    }
    if (this.input.consume('cameraToggle')) {
      this.cameraOffset.y = this.cameraOffset.y === 6 ? 12 : 6;
      this.cameraOffset.z = this.cameraOffset.z === -11 ? -22 : -11;
    }

    // Vehicle physics update
    const accel = 0.035;
    const maxSpeed = 1.2;
    const friction = 0.96;
    const turnRate = 1.8;

    if (this.input.state.forward) {
      this.speed = Math.min(maxSpeed, this.speed + accel * deltaTime * 60);
    } else if (this.input.state.backward) {
      this.speed = Math.max(-maxSpeed * 0.4, this.speed - accel * 1.2 * deltaTime * 60);
    } else {
      this.speed *= Math.pow(friction, deltaTime * 60);
      if (Math.abs(this.speed) < 0.001) this.speed = 0;
    }

    if (Math.abs(this.speed) > 0.005) {
      let steerInput = 0;
      if (this.input.state.left) steerInput -= 1;
      if (this.input.state.right) steerInput += 1;
      if (this.input.touch.steering !== 0) steerInput = this.input.touch.steering;

      this.yaw += steerInput * turnRate * Math.sign(this.speed) * deltaTime;
    }

    if (this.playerVehicle) {
      this.playerVehicle.rotation.y = this.yaw;
      this.playerVehicle.position.x += Math.sin(this.yaw) * this.speed;
      this.playerVehicle.position.z += Math.cos(this.yaw) * this.speed;

      // Camera follow
      const targetPos = this.playerVehicle.position.clone();
      const rotatedOffset = this.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const desiredCamPos = targetPos.clone().add(rotatedOffset);

      this.renderer.camera.position.lerp(desiredCamPos, Math.min(1, deltaTime * 6));
      this.renderer.camera.lookAt(targetPos.x, targetPos.y + 1.2, targetPos.z);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.input.dispose();
    this.renderer.dispose();
    ThreePools.releaseAll();
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).Game = Game;
}
