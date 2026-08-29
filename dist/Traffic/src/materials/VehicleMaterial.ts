// @ts-nocheck
import * as THREE from 'three';
import vehicleVert from '@shaders/vehicle.vert.glsl?raw';
import vehicleFrag from '@shaders/vehicle.frag.glsl?raw';

export interface VehicleMaterialOptions {
  paintColor?: THREE.Color;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
}

export class VehicleMaterial {
  public material: THREE.ShaderMaterial;

  constructor(options: VehicleMaterialOptions = {}) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vehicleVert,
      fragmentShader: vehicleFrag,
      uniforms: {
        paintColor: { value: options.paintColor ?? new THREE.Color(0.8, 0.1, 0.1) },
        metalness: { value: options.metalness ?? 0.9 },
        roughness: { value: options.roughness ?? 0.2 },
        clearcoat: { value: options.clearcoat ?? 1.0 },
        cameraPosition: { value: new THREE.Vector3() },
        sunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
        sunColor: { value: new THREE.Color(1.0, 0.98, 0.95) }
      }
    });
  }

  setCameraPosition(pos: THREE.Vector3): void {
    (this.material.uniforms.cameraPosition.value as THREE.Vector3).copy(pos);
  }

  setSunDirection(dir: THREE.Vector3): void {
    (this.material.uniforms.sunDirection.value as THREE.Vector3).copy(dir).normalize();
  }

  dispose(): void {
    this.material.dispose();
  }
}
