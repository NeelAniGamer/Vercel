/**
 * Environment — Scene setup: sky color, fog, lights, ground plane, toon gradient.
 * Ported from game_core.js _getMapConfig() lines 1835-1914 and env.js.
 */

import * as THREE from 'three';

export interface EnvironmentConfig {
  sky: number;
  fog: number;
  ground: number;
  isNight: boolean;
  isRain?: boolean;
  hasRain?: boolean;
  isPedestrian?: boolean;
  is50km?: boolean;
  isBridge?: boolean;
}

export class Environment {
  ambient!: THREE.AmbientLight;
  hemi!: THREE.HemisphereLight;
  sun!: THREE.DirectionalLight;
  moon!: THREE.DirectionalLight;
  ground!: THREE.Mesh;
  toonGradient!: THREE.DataTexture;
  private _shadowQuality: number;

  constructor() {
    this._shadowQuality = 1024;
    this._initToonGradient();
  }

  /** Set up scene lights, fog, sky color, and ground. Call once per level load. */
  setup(scene: THREE.Scene, cfg: EnvironmentConfig, isMobile: boolean, isLowGPU: boolean): void {
    const sk = cfg.sky;
    scene.background = new THREE.Color(sk);

    // Fog
    const fogDist = cfg.fog || 200;
    const fogNear = isLowGPU ? Math.min(fogDist * 0.35, 50) : fogDist * 0.35;
    const fogFar = isLowGPU ? Math.min(fogDist * 1.2, 250) : fogDist * 1.2;
    if (cfg.isRain || cfg.hasRain) {
      scene.fog = new THREE.Fog(sk, fogNear * 0.3, fogFar * 0.5);
    } else {
      scene.fog = new THREE.Fog(sk, fogNear, fogFar);
    }

    // Remove old lights if re-entering
    if (this.ambient) scene.remove(this.ambient);
    if (this.hemi) scene.remove(this.hemi);
    if (this.sun) scene.remove(this.sun);
    if (this.moon) scene.remove(this.moon);
    if (this.ground) scene.remove(this.ground);

    // Lights
    this.ambient = new THREE.AmbientLight(0xffffff, cfg.isNight ? 0.1 : 0.35);
    scene.add(this.ambient);

    this.hemi = new THREE.HemisphereLight(0x87ceeb, 0x8a7560, cfg.isNight ? 0.1 : 0.45);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff5e0, cfg.isNight ? 0.4 : 1.2);
    this.sun.position.set(30, 60, 20);
    this.sun.castShadow = true;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.camera.left = -60;
    this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60;
    this.sun.shadow.camera.bottom = -60;
    this.sun.shadow.bias = -0.0005;
    const initShadowRes = (isMobile || isLowGPU) ? 512 : 1024;
    this.sun.shadow.mapSize.width = initShadowRes;
    this.sun.shadow.mapSize.height = initShadowRes;
    this._shadowQuality = initShadowRes;
    scene.add(this.sun);

    this.moon = new THREE.DirectionalLight(0x88aacc, cfg.isNight ? 0.5 : 0);
    this.moon.position.set(-20, 40, -30);
    scene.add(this.moon);

    // Ground
    const tg = this.toonGradient;
    const groundMat = cfg.isBridge
      ? new THREE.MeshToonMaterial({ color: 0x1a5a8a, gradientMap: tg, transparent: true, opacity: 0.7 })
      : cfg.is50km
        ? new THREE.MeshToonMaterial({ color: 0x444444, gradientMap: tg })
        : new THREE.MeshToonMaterial({ color: 0x4a4a4f, gradientMap: tg });

    const groundSize = cfg.is50km ? 100000 : 2000;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    scene.add(this.ground);
  }

  /** Update shadow quality based on FPS average. Call every 60 frames. */
  updateShadowQuality(scene: THREE.Scene, fpsAvg: number): void {
    if (!this.sun) return;
    if (fpsAvg < 25 && this._shadowQuality > 512) {
      this._shadowQuality = 512;
      this.sun.shadow.mapSize.width = 512;
      this.sun.shadow.mapSize.height = 512;
      this.sun.shadow.needsUpdate = true;
    } else if (fpsAvg > 50 && this._shadowQuality < 2048) {
      this._shadowQuality = 2048;
      this.sun.shadow.mapSize.width = 2048;
      this.sun.shadow.mapSize.height = 2048;
      this.sun.shadow.needsUpdate = true;
    }
  }

  /** Adjust fog for rain mode. */
  setRainFog(scene: THREE.Scene, skyColor: number, enabled: boolean): void {
    if (enabled) {
      scene.fog = new THREE.Fog(skyColor, 10, 80);
    } else {
      scene.fog = new THREE.Fog(skyColor, 70, 240);
    }
  }

  private _initToonGradient(): void {
    const gc = new Uint8Array([40, 130, 255]);
    this.toonGradient = new THREE.DataTexture(gc, 3, 1, THREE.RedFormat);
    this.toonGradient.minFilter = THREE.NearestFilter;
    this.toonGradient.magFilter = THREE.NearestFilter;
    this.toonGradient.needsUpdate = true;
  }
}
