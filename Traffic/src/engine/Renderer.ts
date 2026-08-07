// @ts-nocheck
import * as THREE from 'three';
import { SkyDome } from '@materials/SkyDome';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  quality?: 'Low' | 'Medium' | 'High' | 'Ultra';
  antialias?: boolean;
}

export interface QualityPreset {
  resScale: number;
  shadowMapSize: number;
  shadowCascades: number;
  bloom: boolean;
  ssao: boolean;
  anisotropy: number;
  maxPixelRatio: number;
  particleLimit: number;
  targetFps: number;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  Low: {
    resScale: 0.5,
    shadowMapSize: 512,
    shadowCascades: 1,
    bloom: false,
    ssao: false,
    anisotropy: 1,
    maxPixelRatio: 1.0,
    particleLimit: 100,
    targetFps: 30
  },
  Medium: {
    resScale: 0.75,
    shadowMapSize: 1024,
    shadowCascades: 1,
    bloom: false,
    ssao: false,
    anisotropy: 4,
    maxPixelRatio: 1.5,
    particleLimit: 500,
    targetFps: 60
  },
  High: {
    resScale: 1.0,
    shadowMapSize: 2048,
    shadowCascades: 2,
    bloom: true,
    ssao: true,
    anisotropy: 8,
    maxPixelRatio: 2.0,
    particleLimit: 2000,
    targetFps: 60
  },
  Ultra: {
    resScale: 1.5,
    shadowMapSize: 4096,
    shadowCascades: 4,
    bloom: true,
    ssao: true,
    anisotropy: 16,
    maxPixelRatio: 2.5,
    particleLimit: 5000,
    targetFps: 144
  }
};

export class Renderer {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public skyDome: SkyDome;
  public quality: string;
  private canvas: HTMLCanvasElement;
  private presets = QUALITY_PRESETS;
  private currentPreset: QualityPreset;
  private frameCount = 0;
  private lastFpsCheck = 0;
  private currentFps = 60;
  private autoQualityEnabled = false;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.quality = options.quality ?? (localStorage.getItem('traffic_quality') as any) ?? 'High';
    this.currentPreset = this.presets[this.quality] ?? this.presets.High;

    // Create renderer with WebGL2
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: options.antialias ?? false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.currentPreset.maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1500);
    this.camera.position.set(0, 8, -15);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.4);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaf0, 1.5);
    this.sunLight.position.set(50, 80, -30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = this.currentPreset.shadowMapSize;
    this.sunLight.shadow.mapSize.height = this.currentPreset.shadowMapSize;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 300;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Sky dome
    this.skyDome = new SkyDome({
      sunPosition: new THREE.Vector3(50, 80, -30),
      sunIntensity: 1.2
    });
    this.scene.add(this.skyDome.mesh);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  setQuality(quality: string): void {
    if (!this.presets[quality]) return;
    this.quality = quality;
    this.currentPreset = this.presets[quality];
    localStorage.setItem('traffic_quality', quality);

    // Apply
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.currentPreset.maxPixelRatio));
    this.sunLight.shadow.mapSize.width = this.currentPreset.shadowMapSize;
    this.sunLight.shadow.mapSize.height = this.currentPreset.shadowMapSize;
    this.sunLight.shadow.map?.dispose();
  }

  getPreset(): QualityPreset {
    return this.currentPreset;
  }

  setAutoQuality(enabled: boolean): void {
    this.autoQualityEnabled = enabled;
  }

  setTimeOfDay(hour: number): void {
    // 0-24 hour cycle
    const t = hour / 24;
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle);

    this.sunLight.position.set(sunX * 100, Math.max(sunY * 100, -30), -50);
    this.skyDome.setSunPosition(sunX * 100, Math.max(sunY * 100, -30), -50);

    // Day/night intensity
    const dayFactor = THREE.MathUtils.clamp(sunY + 0.2, 0, 1);
    this.sunLight.intensity = 0.3 + dayFactor * 1.5;
    this.ambientLight.intensity = 0.2 + dayFactor * 0.4;
    this.skyDome.setSunIntensity(0.3 + dayFactor * 1.2);

    // Sky color
    const skyColor = new THREE.Color().lerpColors(
      new THREE.Color(0x0a0a1a), // night
      new THREE.Color(0x87ceeb), // day
      dayFactor
    );
    this.scene.background = skyColor;
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color = skyColor;
    }
  }

  update(deltaTime: number): void {
    this.skyDome.update(deltaTime);

    // FPS tracking for auto-quality
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsCheck > 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsCheck = now;

      if (this.autoQualityEnabled) {
        this.adjustQuality();
      }
    }
  }

  private adjustQuality(): void {
    const target = this.currentPreset.targetFps;
    if (this.currentFps < target * 0.7) {
      // Drop quality
      const order = ['Ultra', 'High', 'Medium', 'Low'];
      const idx = order.indexOf(this.quality);
      if (idx < order.length - 1) {
        this.setQuality(order[idx + 1]);
        console.log(`[Renderer] Auto-quality: dropped to ${this.quality} (${this.currentFps} FPS)`);
      }
    } else if (this.currentFps > target * 1.2) {
      // Raise quality
      const order = ['Low', 'Medium', 'High', 'Ultra'];
      const idx = order.indexOf(this.quality);
      if (idx < order.length - 1) {
        this.setQuality(order[idx + 1]);
        console.log(`[Renderer] Auto-quality: raised to ${this.quality} (${this.currentFps} FPS)`);
      }
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    this.skyDome.dispose();
  }
}
