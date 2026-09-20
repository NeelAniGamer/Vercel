/**
 * ============================================================================
 * 3D MODEL REGISTRY & ASSET LOADER (model-registry.js)
 * ============================================================================
 * Modular asset loader for GLTF/GLB and OBJ/MTL 3D models.
 * Automatically loads user-provided models from /models/ with fallback to
 * procedural high-detail geometry if any asset is missing.
 * ============================================================================
 */

(function(window) {
  'use strict';

  class ModelRegistry {
    constructor(scene) {
      this.scene = scene;
      this.cache = new Map();
      this.gltfLoader = null;
      this.objLoader = null;
      this.mtlLoader = null;
      this.textureLoader = new THREE.TextureLoader();

      this.initLoaders();
    }

    initLoaders() {
      if (typeof THREE.GLTFLoader !== 'undefined') {
        this.gltfLoader = new THREE.GLTFLoader();
      }
      if (typeof THREE.OBJLoader !== 'undefined') {
        this.objLoader = new THREE.OBJLoader();
      }
      if (typeof THREE.MTLLoader !== 'undefined') {
        this.mtlLoader = new THREE.MTLLoader();
      }
    }

    ensureLoaders() {
      if (!this.gltfLoader && typeof THREE.GLTFLoader !== 'undefined') {
        this.gltfLoader = new THREE.GLTFLoader();
      }
      if (!this.objLoader && typeof THREE.OBJLoader !== 'undefined') {
        this.objLoader = new THREE.OBJLoader();
      }
      if (!this.mtlLoader && typeof THREE.MTLLoader !== 'undefined') {
        this.mtlLoader = new THREE.MTLLoader();
      }
    }

    loadGLB(url, options = {}) {
      this.ensureLoaders();
      return new Promise((resolve, reject) => {
        if (!this.gltfLoader) {
          return reject(new Error('GLTFLoader not available'));
        }

        if (this.cache.has(url)) {
          const cached = this.cache.get(url).clone(true);
          this.applyOptions(cached, options);
          return resolve(cached);
        }

        this.gltfLoader.load(
          url,
          (gltf) => {
            const model = gltf.scene || gltf.scenes[0];
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = options.castShadow !== false;
                child.receiveShadow = options.receiveShadow !== false;
                if (child.material) {
                  child.material.side = THREE.DoubleSide;
                }
              }
            });

            this.cache.set(url, model.clone(true));
            this.applyOptions(model, options);
            resolve(model);
          },
          undefined,
          (err) => {
            console.warn('[ModelRegistry] Failed to load GLB: ' + url, err);
            reject(err);
          }
        );
      });
    }

    loadOBJ(objUrl, mtlUrl = null, options = {}) {
      this.ensureLoaders();
      return new Promise((resolve, reject) => {
        if (!this.objLoader) {
          return reject(new Error('OBJLoader not available'));
        }

        const proceedWithOBJ = (materials = null) => {
          const loader = new THREE.OBJLoader();
          if (materials) {
            materials.preload();
            loader.setMaterials(materials);
          }

          loader.load(
            objUrl,
            (object) => {
              object.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = options.castShadow !== false;
                  child.receiveShadow = options.receiveShadow !== false;
                  if (options.materialOverride) {
                    child.material = options.materialOverride;
                  }
                }
              });

              this.applyOptions(object, options);
              resolve(object);
            },
            undefined,
            (err) => {
              console.warn('[ModelRegistry] Failed to load OBJ: ' + objUrl, err);
              reject(err);
            }
          );
        };

        if (mtlUrl && this.mtlLoader) {
          const mtlLoader = new THREE.MTLLoader();
          const basePath = mtlUrl.substring(0, mtlUrl.lastIndexOf('/') + 1);
          mtlLoader.setPath(basePath);
          const mtlFileName = mtlUrl.substring(mtlUrl.lastIndexOf('/') + 1);
          mtlLoader.load(
            mtlFileName,
            (materials) => proceedWithOBJ(materials),
            undefined,
            () => {
              console.warn('[ModelRegistry] MTL failed for ' + mtlUrl + ', loading OBJ without MTL');
              proceedWithOBJ(null);
            }
          );
        } else {
          proceedWithOBJ(null);
        }
      });
    }

    applyOptions(object, options) {
      if (options.scale !== undefined) {
        if (typeof options.scale === 'number') {
          object.scale.set(options.scale, options.scale, options.scale);
        } else if (Array.isArray(options.scale)) {
          object.scale.set(options.scale[0], options.scale[1], options.scale[2]);
        }
      }
      if (options.position !== undefined) {
        if (Array.isArray(options.position)) {
          object.position.set(options.position[0], options.position[1], options.position[2]);
        } else if (typeof options.position === 'object') {
          object.position.copy(options.position);
        }
      }
      if (options.rotation !== undefined) {
        if (Array.isArray(options.rotation)) {
          object.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
        }
      }
    }

    enableDragAndDrop(onModelLoaded) {
      window.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      window.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
          if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const contents = event.target.result;
              this.ensureLoaders();
              if (this.gltfLoader) {
                this.gltfLoader.parse(contents, '', (gltf) => {
                  const model = gltf.scene;
                  if (typeof onModelLoaded === 'function') {
                    onModelLoaded(model, file.name);
                  }
                });
              }
            };
            reader.readAsArrayBuffer(file);
          }
        }
      });
    }
  }

  window.ModelRegistry = ModelRegistry;
})(window);