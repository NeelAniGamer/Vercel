import * as THREE from 'three';
import { QualityPreset, QualityPresetName } from '../types';

export const QUALITY_PRESETS: Record<QualityPresetName, QualityPreset> = {
  LOW: {
    name: 'LOW',
    resScale: 0.75,
    shadows: false,
    shadowMapSize: 512,
    shadowCascades: 1,
    bloom: false,
    drs: true,
    targetFps: 30,
    maxVehicles: 25,
    maxPedestrians: 12
  },
  MED: {
    name: 'MED',
    resScale: 1.0,
    shadows: true,
    shadowMapSize: 1024,
    shadowCascades: 1,
    bloom: false,
    drs: true,
    targetFps: 60,
    maxVehicles: 50,
    maxPedestrians: 20
  },
  HIGH: {
    name: 'HIGH',
    resScale: 1.0,
    shadows: true,
    shadowMapSize: 2048,
    shadowCascades: 2,
    bloom: true,
    drs: true,
    targetFps: 60,
    maxVehicles: 90,
    maxPedestrians: 30
  },
  ULTRA: {
    name: 'ULTRA',
    resScale: 1.25,
    shadows: true,
    shadowMapSize: 4096,
    shadowCascades: 3,
    bloom: true,
    drs: false,
    targetFps: 120,
    maxVehicles: 140,
    maxPedestrians: 45
  }
};

export class RenderCore {
  renderer: THREE.WebGLRenderer;
  currentPreset: QualityPreset;
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;

  constructor(canvas: HTMLCanvasElement, preset: QualityPresetName = 'HIGH') {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const selectedPreset = isMobile ? 'MED' : preset;
    this.currentPreset = { ...QUALITY_PRESETS[selectedPreset] };

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      powerPreference: 'high-performance',
      alpha: false
    });

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = this.currentPreset.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.resize(window.innerWidth, window.innerHeight);
  }

  setQuality(name: QualityPresetName) {
    this.currentPreset = { ...QUALITY_PRESETS[name] };
    this.renderer.shadowMap.enabled = this.currentPreset.shadows;
    this.resize(window.innerWidth, window.innerHeight);
  }

  resize(width: number, height: number) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 2.0);
    const effectiveDpr = dpr * this.currentPreset.resScale;

    this.renderer.setPixelRatio(effectiveDpr);
    this.renderer.setSize(width, height, false);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    // Dynamic Resolution Scaling frame budget monitor
    if (this.currentPreset.drs) {
      this.frameCount++;
      if (this.frameCount % 60 === 0) {
        const now = performance.now();
        const delta = (now - this.lastTime) / 1000;
        this.fps = 60 / delta;
        this.lastTime = now;

        if (this.fps < 45 && this.currentPreset.resScale > 0.75) {
          this.currentPreset.resScale = Math.max(0.7, this.currentPreset.resScale - 0.05);
          this.resize(window.innerWidth, window.innerHeight);
        } else if (this.fps > 58 && this.currentPreset.resScale < 1.0) {
          this.currentPreset.resScale = Math.min(1.0, this.currentPreset.resScale + 0.05);
          this.resize(window.innerWidth, window.innerHeight);
        }
      }
    }

    this.renderer.render(scene, camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
