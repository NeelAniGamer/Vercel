// @ts-nocheck
/**
 * RenderCore — migrated from render_core.js
 * WebGL renderer wrapper with quality presets, DRS, bloom
 */

import * as THREE from 'three';

export interface QualityPreset {
  resScale: number;
  shadowRes: number;
  shadowCascades: number;
  shadowBias: number;
  shadowNormalBias: number;
  bloom: boolean;
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  fps: number;
  textureFilter: number;
  maxAnisotropy: number;
  lodMultiplier: number;
  maxParticles: number;
  description: string;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  LOW: {
    resScale: 0.5, shadowRes: 512, shadowCascades: 1,
    shadowBias: -0.0005, shadowNormalBias: 0.02,
    bloom: false, bloomThreshold: 1.0, bloomStrength: 0, bloomRadius: 0,
    fps: 30, textureFilter: THREE.LinearFilter, maxAnisotropy: 1,
    lodMultiplier: 0.5, maxParticles: 500, description: 'Performance mode'
  },
  MED: {
    resScale: 0.75, shadowRes: 1024, shadowCascades: 2,
    shadowBias: -0.0003, shadowNormalBias: 0.015,
    bloom: true, bloomThreshold: 0.85, bloomStrength: 0.4, bloomRadius: 0.6,
    fps: 60, textureFilter: THREE.LinearMipmapLinearFilter, maxAnisotropy: 4,
    lodMultiplier: 0.75, maxParticles: 2000, description: 'Balanced'
  },
  HIGH: {
    resScale: 1.0, shadowRes: 2048, shadowCascades: 3,
    shadowBias: -0.0001, shadowNormalBias: 0.01,
    bloom: true, bloomThreshold: 0.75, bloomStrength: 0.7, bloomRadius: 0.8,
    fps: 60, textureFilter: THREE.LinearMipmapLinearFilter, maxAnisotropy: 8,
    lodMultiplier: 1.0, maxParticles: 5000, description: 'High Quality'
  },
  ULTRA: {
    resScale: 1.5, shadowRes: 4096, shadowCascades: 4,
    shadowBias: -0.00005, shadowNormalBias: 0.005,
    bloom: true, bloomThreshold: 0.65, bloomStrength: 1.0, bloomRadius: 1.0,
    fps: 144, textureFilter: THREE.LinearMipmapLinearFilter, maxAnisotropy: 16,
    lodMultiplier: 1.5, maxParticles: 10000, description: 'Ultra Cinematic'
  }
};

export class RenderCore {
  renderer: THREE.WebGLRenderer | null = null;
  canvas: HTMLCanvasElement | null = null;
  currentPreset: string = 'MED';
  scene: THREE.Scene | null = null;
  camera: THREE.Camera | null = null;
  renderTarget: THREE.WebGLRenderTarget | null = null;
  blitScene: THREE.Scene | null = null;
  blitCamera: THREE.OrthographicCamera | null = null;
  blitMesh: THREE.Mesh | null = null;
  composer: any = null;
  bloomPass: any = null;

  private _frameTimeHistory: number[] = [];
  private _frameBudgetFrames: number = 0;
  private _autoQualityEnabled: boolean = true;
  private _lastQualityCheck: number = 0;
  private _lastFrameTime: number = 0;
  private _defaultShadowRes: number = 1024;
  private _defaultShadowBias: number = -0.0003;
  private _defaultShadowNormalBias: number = 0.015;
  private _defaultTextureFilter: number = THREE.LinearMipmapLinearFilter;
  private _defaultAnisotropy: number = 4;
  private _lodMultiplier: number = 1.0;
  private _maxParticles: number = 2000;

  init(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false
    });

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.55;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.shadowMap.needsUpdate = true;

    this.autoDetectQuality();
    return this.renderer;
  }

  setQuality(presetKey: string): void {
    if (!QUALITY_PRESETS[presetKey]) {
      console.error(`RenderCore: Invalid quality preset: ${presetKey}`);
      return;
    }
    this.currentPreset = presetKey;
    this._applyQualitySettings(QUALITY_PRESETS[presetKey]);
    console.log(`RenderCore: Quality set to ${presetKey}`);
  }

  setAutoQuality(enabled: boolean): void {
    this._autoQualityEnabled = enabled;
  }

  autoDetectQuality(): void {
    console.log("RenderCore: Auto-detecting hardware capabilities...");
    const savedQuality = localStorage.getItem('traffic_quality');
    if (savedQuality && QUALITY_PRESETS[savedQuality]) {
      console.log(`RenderCore: Using saved quality preset: ${savedQuality}`);
      this.setQuality(savedQuality);
      this.setAutoQuality(false);
      return;
    }

    let score = 2;
    const gl = this.renderer!.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      console.log(`RenderCore: Detected GPU: ${renderer}`);
      const highEnd = /NVIDIA|RTX|Radeon|AMD|GeForce GTX 1[6-9]|GeForce RTX|RX [56]?[0-9]{3}/i;
      const lowEnd = /Adreno|Mali|Intel.*HD|Intel.*UHD|Apple GPU|PowerVR|VideoCore/i;
      if (highEnd.test(renderer)) {
        score += 1;
        if (/RTX|GTX 30|GTX 40|RX 6[0-9]{3}|RX 7[0-9]{3}/i.test(renderer)) score += 1;
      } else if (lowEnd.test(renderer)) {
        score -= 1;
      }
    }

    if (navigator.hardwareConcurrency) {
      console.log(`RenderCore: CPU Cores: ${navigator.hardwareConcurrency}`);
      if (navigator.hardwareConcurrency <= 2) score -= 1;
      else if (navigator.hardwareConcurrency >= 8) score += 1;
    }

    if (navigator.deviceMemory) {
      console.log(`RenderCore: Device Memory: ${navigator.deviceMemory}GB`);
      if (navigator.deviceMemory < 4) score -= 1;
      else if (navigator.deviceMemory >= 16) score += 1;
    }

    const msPerFrame = this._perfTest();
    console.log(`RenderCore: Burn-in test: ${msPerFrame.toFixed(2)}ms/frame`);
    if (msPerFrame > 16.67) score -= 2;
    else if (msPerFrame > 10) score -= 1;

    let finalPreset = 'MED';
    if (score <= 0) finalPreset = 'LOW';
    else if (score === 1) finalPreset = 'LOW';
    else if (score === 2) finalPreset = 'MED';
    else if (score === 3) finalPreset = 'HIGH';
    else if (score >= 4) finalPreset = 'ULTRA';
    if (msPerFrame > 33) finalPreset = 'LOW';

    console.log(`RenderCore: Auto-detected quality: ${finalPreset} (score: ${score})`);
    this.setQuality(finalPreset);
  }

  private _perfTest(): number {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const start = performance.now();
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      this.renderer!.render(scene, camera);
    }
    return (performance.now() - start) / iterations;
  }

  private _setupRenderBypass(): void {
    if (!this.renderer || !this.canvas) return;
    const preset = this.getPreset();
    const scale = preset.resScale;
    const width = Math.floor(this.canvas.width * scale);
    const height = Math.floor(this.canvas.height * scale);

    if (this.renderTarget) this.renderTarget.dispose();
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding,
      depthBuffer: true,
      stencilBuffer: false
    });

    if (!this.blitScene) {
      this.blitScene = new THREE.Scene();
      this.blitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2);
      this.blitMesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ transparent: true })
      );
      this.blitScene.add(this.blitMesh);
    }

    this.blitMesh!.material.map = this.renderTarget.texture;
    this.blitMesh!.material.needsUpdate = true;
  }

  private _applyQualitySettings(preset: QualityPreset): void {
    if (!this.renderer) return;
    console.log(`RenderCore: Applying quality settings - ${preset.description}`);

    if (preset.resScale !== 1.0) {
      this._setupRenderBypass();
    } else {
      if (this.renderTarget) {
        this.renderTarget.dispose();
        this.renderTarget = null;
      }
    }

    if (this.renderer.shadowMap) {
      this._defaultShadowRes = preset.shadowRes;
      this._defaultShadowBias = preset.shadowBias;
      this._defaultShadowNormalBias = preset.shadowNormalBias;
    }

    this._defaultTextureFilter = preset.textureFilter;
    this._defaultAnisotropy = preset.maxAnisotropy;
    this._lodMultiplier = preset.lodMultiplier;
    this._maxParticles = preset.maxParticles;

    if (this.composer && this.bloomPass) {
      this.bloomPass.enabled = preset.bloom;
      if (preset.bloom) {
        this.bloomPass.threshold = preset.bloomThreshold;
        this.bloomPass.strength = preset.bloomStrength;
        this.bloomPass.radius = preset.bloomRadius;
      }
    }
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.renderer) return;
    const preset = this.getPreset();
    const scale = preset.resScale;

    if (scale === 1.0) {
      this.renderer.render(scene, camera);
    } else {
      if (!this.renderTarget) this._setupRenderBypass();
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(scene, camera);
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.blitScene, this.blitCamera);
    }

    if (this._autoQualityEnabled) this._checkFrameBudget();
  }

  private _checkFrameBudget(): void {
    const now = performance.now();
    if (!this._lastFrameTime) this._lastFrameTime = now;
    const dt = now - this._lastFrameTime;
    this._lastFrameTime = now;
    this._frameTimeHistory.push(dt);
    if (this._frameTimeHistory.length > 120) this._frameTimeHistory.shift();
    this._frameBudgetFrames++;

    if (this._frameBudgetFrames >= 60) {
      this._frameBudgetFrames = 0;
      const avg = this._frameTimeHistory.reduce((a, b) => a + b, 0) / this._frameTimeHistory.length;
      const preset = this.getPreset();
      const budget = 1000 / preset.fps;
      if (avg > budget * 1.3 && this.currentPreset !== 'LOW') {
        this._downgradePreset();
      } else if (avg < budget * 0.6 && this.currentPreset !== 'ULTRA') {
        this._upgradePreset();
      }
    }
  }

  private _downgradePreset(): void {
    const order = ['LOW', 'MED', 'HIGH', 'ULTRA'];
    const idx = order.indexOf(this.currentPreset);
    if (idx > 0) {
      this.setQuality(order[idx - 1]);
      console.log(`RenderCore: Auto-downgraded to ${this.currentPreset}`);
    }
  }

  private _upgradePreset(): void {
    const order = ['LOW', 'MED', 'HIGH', 'ULTRA'];
    const idx = order.indexOf(this.currentPreset);
    if (idx < order.length - 1) {
      this.setQuality(order[idx + 1]);
      console.log(`RenderCore: Auto-upgraded to ${this.currentPreset}`);
    }
  }

  setupPostProcessing(width: number, height: number, isMobile: boolean): void {
    if (!THREE.EffectComposer || isMobile) {
      this.composer = null;
      return;
    }
    try {
      this.composer = new THREE.EffectComposer(this.renderer);
      this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
      const preset = this.getPreset();
      this.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(width, height),
        preset.bloomStrength,
        preset.bloomRadius,
        preset.bloomThreshold
      );
      this.bloomPass.enabled = preset.bloom;
      this.composer.addPass(this.bloomPass);
      this.composer.setSize(width, height);
    } catch (e) {
      console.warn("Post processing setup failed:", e);
      this.composer = null;
    }
  }

  resizePostProcessing(width: number, height: number): void {
    if (this.composer) this.composer.setSize(width, height);
    if (this.renderTarget) this._setupRenderBypass();
  }

  getPreset(): QualityPreset {
    return QUALITY_PRESETS[this.currentPreset];
  }

  getLODMultiplier(): number { return this._lodMultiplier || 1.0; }
  getMaxParticles(): number { return this._maxParticles || 2000; }
  getDefaultShadowRes(): number { return this._defaultShadowRes || 1024; }
  getDefaultShadowBias(): number { return this._defaultShadowBias || -0.0003; }
  getDefaultShadowNormalBias(): number { return this._defaultShadowNormalBias || 0.015; }
  getDefaultTextureFilter(): number { return this._defaultTextureFilter || THREE.LinearMipmapLinearFilter; }
  getDefaultAnisotropy(): number { return this._defaultAnisotropy || 4; }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).RenderCore = RenderCore;
  (window as any).QUALITY_PRESETS = QUALITY_PRESETS;
}
