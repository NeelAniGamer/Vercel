// col-3d/core/DisposalRegistry.js — Centralized Three.js resource disposal tracking
// Prevents memory leaks by ensuring all geometries, materials, textures are disposed

;(function () {
  'use strict'

  // ==================== REGISTRIES ====================
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  const renderTargets = new Set()
  const objects = new Set() // Object3D with custom dispose
  const callbacks = new Set() // Custom cleanup functions

  // ==================== TRACKING ====================
  function trackGeometry(geometry) {
    if (geometry && geometry.isBufferGeometry) {
      geometries.add(geometry)
    }
    return geometry
  }

  function trackMaterial(material) {
    if (material && material.isMaterial) {
      materials.add(material)
    }
    return material
  }

  function trackTexture(texture) {
    if (texture && texture.isTexture) {
      textures.add(texture)
    }
    return texture
  }

  function trackRenderTarget(rt) {
    if (rt && rt.isWebGLRenderTarget) {
      renderTargets.add(rt)
    }
    return rt
  }

  function trackObject(object, disposeFn) {
    if (object && object.isObject3D) {
      objects.add(object)
      if (disposeFn) {
        object.userData._customDispose = disposeFn
      }
    }
    return object
  }

  function trackCallback(fn) {
    if (typeof fn === 'function') {
      callbacks.add(fn)
    }
    return fn
  }

  // ==================== BATCH CREATION HELPERS ====================
  function createGeometry(factory) {
    const geo = factory()
    return trackGeometry(geo)
  }

  function createMaterial(factory) {
    const mat = factory()
    return trackMaterial(mat)
  }

  function createTexture(factory) {
    const tex = factory()
    return trackTexture(tex)
  }

  // ==================== DISPOSAL ====================
  function disposeGeometry(geo) {
    if (!geo || !geometries.has(geo)) return
    try {
      geo.dispose()
    } catch (e) {
      console.warn('[DisposalRegistry] Geometry dispose failed:', e)
    }
    geometries.delete(geo)
  }

  function disposeMaterial(mat) {
    if (!mat || !materials.has(mat)) return
    try {
      // Dispose textures in material
      if (mat.map) disposeTexture(mat.map)
      if (mat.normalMap) disposeTexture(mat.normalMap)
      if (mat.roughnessMap) disposeTexture(mat.roughnessMap)
      if (mat.metalnessMap) disposeTexture(mat.metalnessMap)
      if (mat.emissiveMap) disposeTexture(mat.emissiveMap)
      if (mat.alphaMap) disposeTexture(mat.alphaMap)
      if (mat.envMap) disposeTexture(mat.envMap)
      if (mat.lightMap) disposeTexture(mat.lightMap)
      if (mat.aoMap) disposeTexture(mat.aoMap)
      if (mat.displacementMap) disposeTexture(mat.displacementMap)
      if (mat.gradientMap) disposeTexture(mat.gradientMap)
      mat.dispose()
    } catch (e) {
      console.warn('[DisposalRegistry] Material dispose failed:', e)
    }
    materials.delete(mat)
  }

  function disposeTexture(tex) {
    if (!tex || !textures.has(tex)) return
    try {
      tex.dispose()
    } catch (e) {
      console.warn('[DisposalRegistry] Texture dispose failed:', e)
    }
    textures.delete(tex)
  }

  function disposeRenderTarget(rt) {
    if (!rt || !renderTargets.has(rt)) return
    try {
      rt.dispose()
    } catch (e) {
      console.warn('[DisposalRegistry] RenderTarget dispose failed:', e)
    }
    renderTargets.delete(rt)
  }

  function disposeObject(obj) {
    if (!obj || !objects.has(obj)) return
    try {
      if (obj.userData._customDispose) {
        obj.userData._customDispose(obj)
      }
      // Recurse children
      obj.traverse(child => {
        if (child.geometry) disposeGeometry(child.geometry)
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial)
          } else {
            disposeMaterial(child.material)
          }
        }
      })
    } catch (e) {
      console.warn('[DisposalRegistry] Object dispose failed:', e)
    }
    objects.delete(obj)
  }

  function disposeAll() {
    // Custom callbacks first
    callbacks.forEach(fn => {
      try { fn() } catch (e) { console.warn('[DisposalRegistry] Callback failed:', e) }
    })
    callbacks.clear()

    // Objects (which dispose their children)
    objects.forEach(disposeObject)
    objects.clear()

    // Remaining loose resources
    geometries.forEach(disposeGeometry)
    materials.forEach(disposeMaterial)
    textures.forEach(disposeTexture)
    renderTargets.forEach(disposeRenderTarget)

    console.log('[DisposalRegistry] All resources disposed')
  }

  function getStats() {
    return {
      geometries: geometries.size,
      materials: materials.size,
      textures: textures.size,
      renderTargets: renderTargets.size,
      objects: objects.size,
      callbacks: callbacks.size
    }
  }

  // ==================== PUBLIC API ====================
  window.DisposalRegistry = {
    track: {
      geometry: trackGeometry,
      material: trackMaterial,
      texture: trackTexture,
      renderTarget: trackRenderTarget,
      object: trackObject,
      callback: trackCallback
    },
    create: {
      geometry: createGeometry,
      material: createMaterial,
      texture: createTexture
    },
    dispose: {
      geometry: disposeGeometry,
      material: disposeMaterial,
      texture: disposeTexture,
      renderTarget: disposeRenderTarget,
      object: disposeObject,
      all: disposeAll
    },
    getStats,
    // Convenience: auto-dispose a group on removal
    autoDisposeGroup(group) {
      return trackObject(group, (g) => {
        g.traverse(child => {
          if (child.geometry) disposeGeometry(child.geometry)
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(disposeMaterial)
            else disposeMaterial(child.material)
          }
        })
      })
    }
  }

  // Global cleanup
  window.addEventListener('pagehide', disposeAll)
  window.addEventListener('beforeunload', disposeAll)
})()