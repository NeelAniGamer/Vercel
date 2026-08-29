// @ts-nocheck
/**
 * Asset loading system
 * Handles GLTF models, textures, and level data
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  item: string;
}

export class AssetManager {
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private models = new Map<string, THREE.Group>();
  private textures = new Map<string, THREE.Texture>();
  private loadingManager: THREE.LoadingManager;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();

    // GLTF loader with Draco compression support
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.gltfLoader.setDRACOLoader(dracoLoader);

    // KTX2 compressed texture support
    const ktx2Loader = new KTX2Loader(this.loadingManager);
    ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/');
    this.gltfLoader.setKTX2Loader(ktx2Loader);

    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
  }

  /**
   * Load a GLTF model
   */
  async loadModel(url: string, key?: string): Promise<THREE.Group> {
    const cacheKey = key ?? url;
    if (this.models.has(cacheKey)) {
      return this.models.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          this.models.set(cacheKey, model);
          resolve(model);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Load a texture
   */
  async loadTexture(url: string, key?: string): Promise<THREE.Texture> {
    const cacheKey = key ?? url;
    if (this.textures.has(cacheKey)) {
      return this.textures.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          this.textures.set(cacheKey, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Get a cached model
   */
  getModel(key: string): THREE.Group | undefined {
    return this.models.get(key);
  }

  /**
   * Get a cached texture
   */
  getTexture(key: string): THREE.Texture | undefined {
    return this.textures.get(key);
  }

  /**
   * Clear all cached assets
   */
  dispose(): void {
    this.models.forEach((model) => {
      model.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
    });
    this.textures.forEach((tex) => tex.dispose());
    this.models.clear();
    this.textures.clear();
  }
}

// Singleton
export const assetManager = new AssetManager();
