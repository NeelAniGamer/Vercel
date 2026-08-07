// @ts-nocheck
import * as THREE from 'three';
import roadVert from '@shaders/road.vert.glsl?raw';
import roadFrag from '@shaders/road.frag.glsl?raw';

export interface RoadMaterialOptions {
  roadTexture?: THREE.Texture;
  normalMap?: THREE.Texture;
  wetness?: number;
}

export class RoadMaterial {
  public material: THREE.ShaderMaterial;
  private time: number = 0;

  constructor(options: RoadMaterialOptions = {}) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: roadVert,
      fragmentShader: roadFrag,
      uniforms: {
        roadTexture: { value: options.roadTexture ?? this.createDefaultTexture() },
        normalMap: { value: options.normalMap ?? this.createDefaultNormalMap() },
        cameraPosition: { value: new THREE.Vector3() },
        wetness: { value: options.wetness ?? 0.0 },
        time: { value: 0 }
      }
    });
  }

  setWetness(wetness: number): void {
    this.material.uniforms.wetness.value = THREE.MathUtils.clamp(wetness, 0, 1);
  }

  setCameraPosition(pos: THREE.Vector3): void {
    (this.material.uniforms.cameraPosition.value as THREE.Vector3).copy(pos);
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.time.value = this.time;
  }

  private createDefaultTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#333335';
    ctx.fillRect(0, 0, 128, 128);
    // Road markings
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, 0, 8, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  private createDefaultNormalMap(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  dispose(): void {
    this.material.dispose();
  }
}
