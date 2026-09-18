import * as THREE from 'three';
import {
  VehicleType,
  GameMode,
  QualityPresetName,
  HUDState,
  RoadDef,
  CameraMode,
  VehicleCustomization,
  ChallanViolation
} from '../types';
import { RenderCore } from './RenderCore';
import { InputManager } from './InputManager';
import { CameraController } from './CameraController';
import { VehiclePhysics } from '../physics/VehiclePhysics';
import { VehicleFactory } from '../entities/VehicleFactory';
import { Environment } from '../world/Environment';
import { RoadGraph } from '../world/RoadGraph';
import { SuburbanBuilder } from '../world/SuburbanBuilder';
import { TrafficManager } from '../entities/TrafficManager';
import { PedestrianManager } from '../entities/PedestrianManager';
import { LODSystem } from './LODSystem';

export interface TrafficEngineOptions {
  canvas: HTMLCanvasElement;
  vehicle?: VehicleType;
  mode?: GameMode;
  quality?: QualityPresetName;
  renderDistance?: number;
  customization?: VehicleCustomization;
  onHUDUpdate?: (state: HUDState) => void;
  onViolation?: (violation: ChallanViolation) => void;
}

export class TrafficEngine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderCore: RenderCore;
  input: InputManager;
  cameraController: CameraController;
  physics: VehiclePhysics;
  environment: Environment;
  roadGraph: RoadGraph;
  trafficManager: TrafficManager;
  pedestrianManager: PedestrianManager;

  playerVehicle: THREE.Group;
  playerPos = new THREE.Vector3(2.4, 0, 0);
  playerHeading = 0;
  vehicleType: VehicleType = 'sports_gt';
  customization: VehicleCustomization;

  renderDistance = 500;
  speedLimit = 60; // km/h
  score = 100;
  totalFine = 0;
  recentViolation?: ChallanViolation;
  running = false;

  private lastTime = performance.now();
  private animFrameId: number | null = null;
  private hudFrameCount = 0;
  private overspeedTimer = 0;
  private onHUDUpdate?: (state: HUDState) => void;
  private onViolation?: (violation: ChallanViolation) => void;

  constructor(options: TrafficEngineOptions) {
    const {
      canvas,
      vehicle = 'sports_gt',
      quality = 'HIGH',
      renderDistance = 500,
      customization,
      onHUDUpdate,
      onViolation
    } = options;

    this.vehicleType = vehicle;
    this.renderDistance = renderDistance;
    this.onHUDUpdate = onHUDUpdate;
    this.onViolation = onViolation;

    this.customization = customization || {
      bodyColor: 0x2563eb,
      rimColor: 0xe2e8f0,
      caliperColor: 0xdc2626,
      hasSplitter: true,
      hasWing: true
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, Math.max(1400, renderDistance * 2.5));

    this.renderCore = new RenderCore(canvas, quality);
    this.input = new InputManager();
    this.input.attach(canvas);

    this.cameraController = new CameraController(this.camera, vehicle);
    this.physics = new VehiclePhysics(vehicle);
    this.environment = new Environment(this.scene, renderDistance);

    // Default Suburban Road Layout
    const defaultRoads: RoadDef[] = [
      { type: 'v', x: 0, z1: -800, z2: 800, width: 16, lanes: 2 },
      { type: 'h', z: 0, x1: -800, x2: 800, width: 16, lanes: 2 },
      { type: 'h', z: 320, x1: -800, x2: 800, width: 16, lanes: 2 },
      { type: 'h', z: -320, x1: -800, x2: 800, width: 16, lanes: 2 },
      { type: 'v', x: 360, z1: -800, z2: 800, width: 16, lanes: 2 },
      { type: 'v', x: -360, z1: -800, z2: 800, width: 16, lanes: 2 }
    ];

    this.roadGraph = RoadGraph.fromRoadDefs(defaultRoads);
    SuburbanBuilder.buildNeighborhood(this.scene, this.roadGraph);

    // Player vehicle
    this.playerVehicle = VehicleFactory.createVehicle(vehicle, this.customization);
    this.playerVehicle.userData = { isPlayer: true, noLod: true };
    this.playerVehicle.position.copy(this.playerPos);
    this.scene.add(this.playerVehicle);

    // NPC Traffic & Pedestrians
    this.trafficManager = new TrafficManager(this.scene);
    this.trafficManager.spawnInitialTraffic(this.roadGraph, this.renderCore.currentPreset.maxVehicles);

    this.pedestrianManager = new PedestrianManager(this.scene);
    this.pedestrianManager.spawnPedestrians(this.roadGraph, this.renderCore.currentPreset.maxPedestrians);

    window.addEventListener('resize', this.onResize);
  }

  setQuality(quality: QualityPresetName) {
    this.renderCore.setQuality(quality);
  }

  setCameraMode(mode: CameraMode) {
    this.cameraController.setCameraMode(mode);
  }

  cycleCameraMode(): CameraMode {
    return this.cameraController.cycleCameraMode();
  }

  setRenderDistance(dist: number) {
    this.renderDistance = dist;
    if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = dist * 0.75;
      this.scene.fog.far = dist * 1.6;
    }
  }

  setCustomization(custom: VehicleCustomization) {
    this.customization = { ...custom };
    this.scene.remove(this.playerVehicle);
    this.playerVehicle = VehicleFactory.createVehicle(this.vehicleType, this.customization);
    this.playerVehicle.userData = { isPlayer: true, noLod: true };
    this.playerVehicle.position.copy(this.playerPos);
    this.playerVehicle.rotation.y = this.playerHeading;
    this.scene.add(this.playerVehicle);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = () => {
    if (!this.running) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // 1. Input Update
    const inputState = this.input.update();

    // 2. Camera 360 Mouselook
    if (inputState.mouseDeltaX !== 0) {
      this.cameraController.handleMouseDelta(inputState.mouseDeltaX);
      this.input.resetMouseDeltas();
    }

    // 3. Vehicle Physics Simulation
    const displacement = this.physics.update(dt, inputState, this.playerHeading);
    this.playerHeading = displacement.heading;
    this.playerPos.x += displacement.x;
    this.playerPos.z += displacement.z;

    this.playerVehicle.position.copy(this.playerPos);
    this.playerVehicle.rotation.y = this.playerHeading;

    // 4. Camera Chase & Perspective Framing
    this.cameraController.update(
      dt,
      this.playerPos,
      this.playerHeading,
      this.physics.speed,
      inputState.gear === 'R'
    );

    // 5. World & NPCs Update
    this.trafficManager.update(dt, this.playerPos);
    this.pedestrianManager.update(dt);
    this.environment.updateSun(this.playerPos);

    // 6. Multi-Tier Distance LOD Fade
    LODSystem.update(this.scene, this.playerPos, this.renderDistance);

    // 7. Overspeeding & Violation Detection
    const speedKmh = Math.round(Math.abs(this.physics.speed) * 140);
    if (speedKmh > this.speedLimit + 10) {
      this.overspeedTimer += dt;
      if (this.overspeedTimer > 3.0) {
        this.overspeedTimer = 0;
        const fineAmt = 1000;
        this.score = Math.max(0, this.score - 10);
        this.totalFine += fineAmt;
        const v: ChallanViolation = {
          id: `v_${Date.now()}`,
          title: `Overspeeding (${speedKmh} km/h in ${this.speedLimit} zone)`,
          fine: fineAmt,
          timestamp: Date.now(),
          icon: '⚡'
        };
        this.recentViolation = v;
        if (this.onViolation) this.onViolation(v);
      }
    } else {
      this.overspeedTimer = 0;
    }

    // Auto-clear violation toast after 4s
    if (this.recentViolation && Date.now() - this.recentViolation.timestamp > 4000) {
      this.recentViolation = undefined;
    }

    // 8. Render Scene
    this.renderCore.render(this.scene, this.camera);

    // 9. Throttled HUD State Callback (~30Hz)
    this.hudFrameCount++;
    if (this.onHUDUpdate && this.hudFrameCount % 2 === 0) {
      const dots = this.trafficManager.npcs.map(n => ({
        x: n.mesh.position.x,
        z: n.mesh.position.z,
        heading: n.mesh.rotation.y
      }));

      this.onHUDUpdate({
        speedKmh,
        gear: inputState.gear,
        gearNumber: this.physics.gearNumber,
        rpm: this.physics.rpm,
        maxRpm: this.physics.maxRpm,
        lateralG: Number(this.physics.lateralG.toFixed(2)),
        slipAngle: Number(this.physics.steerAngle.toFixed(2)),
        speedLimit: this.speedLimit,
        cameraMode: this.cameraController.mode,
        headlightsOn: inputState.headlights,
        nitroRemaining: Math.round(this.physics.nitroRemaining),
        score: this.score,
        hp: 100,
        totalFine: this.totalFine,
        recentViolation: this.recentViolation,
        radarDots: dots,
        playerX: this.playerPos.x,
        playerZ: this.playerPos.z,
        playerHeading: this.playerHeading
      });
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderCore.resize(window.innerWidth, window.innerHeight);
  };

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.input.detach();
    this.trafficManager.dispose();
    this.pedestrianManager.dispose();
    this.renderCore.dispose();
  }
}
