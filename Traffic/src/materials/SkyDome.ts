// @ts-nocheck
import * as THREE from 'three';
import skyVert from '@shaders/sky.vert.glsl?raw';
import skyFrag from '@shaders/sky.frag.glsl?raw';

export interface SkyDomeOptions {
  sunPosition?: THREE.Vector3;
  sunIntensity?: number;
  rayleighCoeff?: THREE.Vector3;
  mieCoeff?: number;
  mieDirectionalG?: number;
}

export class SkyDome {
  public mesh: THREE.Mesh;
  public material: THREE.ShaderMaterial;
  private time: number = 0;

  constructor(options: SkyDomeOptions = {}) {
    const geometry = new THREE.SphereGeometry(800, 32, 32);

    this.material = new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        sunPosition: { value: options.sunPosition ?? new THREE.Vector3(0, 50, -100) },
        sunIntensity: { value: options.sunIntensity ?? 1.0 },
        rayleighCoeff: { value: options.rayleighCoeff ?? new THREE.Vector3(5.5e-6, 13.0e-6, 28.4e-6) },
        mieCoeff: { value: options.mieCoeff ?? 21e-6 },
        mieDirectionalG: { value: options.mieDirectionalG ?? 0.758 },
        time: { value: 0 }
      }
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -1;
  }

  setSunPosition(x: number, y: number, z: number): void {
    (this.material.uniforms.sunPosition.value as THREE.Vector3).set(x, y, z);
  }

  setSunIntensity(intensity: number): void {
    this.material.uniforms.sunIntensity.value = intensity;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.time.value = this.time;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
