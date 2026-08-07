// @ts-nocheck
import * as THREE from 'three';
import buildingVert from '@shaders/building.vert.glsl?raw';
import buildingFrag from '@shaders/building.frag.glsl?raw';

export interface BuildingMaterialOptions {
  color?: THREE.Color;
  windowColor?: THREE.Color;
  windowDensity?: number;
  nightFactor?: number;
}

export class BuildingMaterial {
  public material: THREE.ShaderMaterial;
  private time: number = 0;

  constructor(options: BuildingMaterialOptions = {}) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: buildingVert,
      fragmentShader: buildingFrag,
      uniforms: {
        buildingColor: { value: options.color ?? new THREE.Color(0.6, 0.55, 0.5) },
        windowColor: { value: options.windowColor ?? new THREE.Color(1.0, 0.95, 0.7) },
        windowDensity: { value: options.windowDensity ?? 1.0 },
        time: { value: 0 },
        nightFactor: { value: options.nightFactor ?? 0.0 }
      }
    });
  }

  setNightFactor(factor: number): void {
    this.material.uniforms.nightFactor.value = THREE.MathUtils.clamp(factor, 0, 1);
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.time.value = this.time;
  }

  dispose(): void {
    this.material.dispose();
  }
}
