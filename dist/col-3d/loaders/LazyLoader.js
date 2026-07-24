// col-3d/loaders/LazyLoader.js — IntersectionObserver-based lazy loading for 3D scenes
// Loads Three.js and scene modules only when canvas enters viewport

;(function () {
  'use strict'

  const LOADED = new Set()
  const LOADING = new Set()
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
  const CORE_MODULES = [
    'col-3d/core/ThemeSync.js',
    'col-3d/core/SceneManager.js',
    'col-3d/core/DisposalRegistry.js'
  ]

  let threeLoaded = false
  let coreLoaded = false

  // ==================== SCRIPT LOADER ====================
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = url
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async function loadThree() {
    if (threeLoaded || typeof THREE !== 'undefined') {
      threeLoaded = true
      return
    }
    await loadScript(THREE_URL)
    threeLoaded = true
  }

  async function loadCore() {
    if (coreLoaded) return
    await Promise.all(CORE_MODULES.map(m => loadScript(m)))
    coreLoaded = true
    // Wait for SceneManager.init()
    if (window.SceneManager) {
      await window.SceneManager.init()
    }
  }

  // ==================== SCENE REGISTRY ====================
  const SCENE_MODULES = {
    'orrery': 'col-3d/scenes/StudioOrrery.js',
    'constellation': 'col-3d/scenes/ConstellationMinds.js',
    'schoolBg': 'col-3d/scenes/KnowledgeArchitecture.js',
    'cosmos': 'col-3d/scenes/CosmicNavigator.js',
    'webgl-canvas': 'col-3d/scenes/ModularCore.js',
    'bgCanvas': 'col-3d/scenes/GenericScene.js', // Shared for privacy/terms/feedback
    'snehBg': 'col-3d/scenes/SnehAshaScene.js'
  }

  // ==================== LAZY LOADER ====================
  async function loadScene(canvasId) {
    if (LOADED.has(canvasId) || LOADING.has(canvasId)) return
    const modulePath = SCENE_MODULES[canvasId]
    if (!modulePath) {
      console.warn('[LazyLoader] No scene module for canvas:', canvasId)
      return
    }

    LOADING.add(canvasId)

    try {
      // Load dependencies
      await loadThree()
      await loadCore()

      // Load scene module
      await loadScript(modulePath)

      // Get canvas and register with SceneManager
      const canvas = document.getElementById(canvasId)
      if (!canvas) {
        console.warn('[LazyLoader] Canvas not found:', canvasId)
        return
      }

      // Scene builder map
      const builders = {
        'orrery': window.StudioOrrery,
        'constellation': window.ConstellationMinds,
        'schoolBg': window.KnowledgeArchitecture,
        'cosmos': window.CosmicNavigator,
        'webgl-canvas': window.ModularCore,
        'bgCanvas': window.GenericScene,
        'snehBg': window.SnehAshaScene
      }

      const builder = builders[canvasId]
      if (builder && window.SceneManager) {
        await window.SceneManager.register(canvas, builder)
      }

      LOADED.add(canvasId)
      console.log('[LazyLoader] Scene loaded:', canvasId)
    } catch (e) {
      console.error('[LazyLoader] Failed to load scene:', canvasId, e)
    } finally {
      LOADING.delete(canvasId)
    }
  }

  // ==================== INTERSECTION OBSERVER ====================
  function initObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all immediately
      Object.keys(SCENE_MODULES).forEach(loadScene)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const canvas = entry.target
          if (canvas.id) {
            loadScene(canvas.id)
            observer.unobserve(canvas)
          }
        }
      })
    }, {
      rootMargin: '200px', // Start loading 200px before entering viewport
      threshold: 0.01
    })

    // Observe all registered canvases
    Object.keys(SCENE_MODULES).forEach(id => {
      const canvas = document.getElementById(id)
      if (canvas) observer.observe(canvas)
    })
  }

  // ==================== PUBLIC API ====================
  window.LazyLoader = {
    loadScene,
    loadThree,
    loadCore,
    init: initObserver,
    isLoaded: (id) => LOADED.has(id),
    isLoading: (id) => LOADING.has(id)
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver)
  } else {
    initObserver()
  }
})()