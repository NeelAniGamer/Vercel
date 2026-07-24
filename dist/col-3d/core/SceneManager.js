// col-3d/core/SceneManager.js — Centralized Three.js scene lifecycle management
// Handles renderer, camera, loop, resize, visibility, and disposal

;(function () {
  'use strict'

  // ==================== STATE ====================
  const scenes = new Map() // canvas -> { scene, camera, renderer, updateFn, clock, canvas, config }
  const globalConfig = {
    targetFPS: 30,
    maxPixelRatio: 1.5,
    enablePostProcessing: false,
    respectReducedMotion: true,
    mobileBreakpoint: 960
  }
  let globalClock = null
  let rafId = null
  let isInitialized = false

  // ==================== UTILITIES ====================
  function waitForThree(callback) {
    if (typeof THREE !== 'undefined') {
      callback()
      return
    }
    let checks = 0
    const interval = setInterval(() => {
      checks++
      if (typeof THREE !== 'undefined') {
        clearInterval(interval)
        callback()
      }
      if (checks > 50) clearInterval(interval) // 5s timeout
    }, 100)
  }

  function shouldSkipDevice() {
    if (globalConfig.respectReducedMotion &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    if (window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth < globalConfig.mobileBreakpoint) {
      return true
    }
    return false
  }

  // ==================== RENDERER FACTORY ====================
  function createRenderer(canvas, config = {}) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: config.antialias !== undefined ? config.antialias : false,
      alpha: config.alpha !== undefined ? config.alpha : true,
      powerPreference: config.powerPreference || 'high-performance',
      preserveDrawingBuffer: false,
      stencil: false,
      depth: true
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, globalConfig.maxPixelRatio))
    renderer.setClearColor(0x000000, 0)
    renderer.autoClear = true
    // Hint for compositor
    canvas.style.willChange = 'transform'
    return renderer
  }

  function createCamera(config = {}) {
    const camera = new THREE.PerspectiveCamera(
      config.fov || 60,
      window.innerWidth / window.innerHeight,
      config.near || 0.1,
      config.far || 2000
    )
    camera.position.set(
      config.position?.x ?? 0,
      config.position?.y ?? 0,
      config.position?.z ?? 50
    )
    if (config.lookAt) {
      camera.lookAt(config.lookAt.x, config.lookAt.y, config.lookAt.z)
    }
    return camera
  }

  // ==================== VISIBILITY HANDLING ====================
  let isVisible = true
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden
  })

  // ==================== MOUSE TRACKING (THROTTLED) ====================
  let mouseX = 0, mouseY = 0
  let _pendingMX = 0, _pendingMY = 0
  document.addEventListener('mousemove', (e) => {
    _pendingMX = (e.clientX / window.innerWidth) * 2 - 1
    _pendingMY = -(e.clientY / window.innerHeight) * 2 + 1
  }, { passive: true })

  // ==================== RESIZE HANDLER ====================
  function handleResize() {
    scenes.forEach(({ renderer, camera, canvas }) => {
      // Skip if canvas is on mobile (should have been cleaned up)
      if (window.innerWidth < globalConfig.mobileBreakpoint) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }
  window.addEventListener('resize', handleResize)

  // ==================== ANIMATION LOOP ====================
  const _TARGET_FPS = globalConfig.targetFPS
  const _FRAME_MS = 1000 / _TARGET_FPS
  let _lastFrameTime = 0

  function animate(now) {
    rafId = requestAnimationFrame(animate)

    if (!isVisible) return

    const elapsed = now - _lastFrameTime
    if (elapsed < _FRAME_MS) return
    _lastFrameTime = now - (elapsed % _FRAME_MS) // drift correction

    // Consume pending mouse coords once per frame
    mouseX = _pendingMX
    mouseY = _pendingMY

    const delta = globalClock ? globalClock.getDelta() : 1/60
    const elapsedTime = globalClock ? globalClock.getElapsedTime() : now * 0.001

    scenes.forEach(({ updateFn, renderer, scene, camera, canvas, config }) => {
      if (!canvas.isConnected) return // Cleaned up
      if (updateFn) {
        try {
          updateFn(elapsedTime, delta, { mouseX, mouseY })
        } catch (e) {
          console.warn('[SceneManager] Update error:', e)
        }
      }
      try {
        renderer.render(scene, camera)
      } catch (e) {
        console.warn('[SceneManager] Render error:', e)
      }
    })
  }

  // ==================== PUBLIC API ====================
  window.SceneManager = {
    config: globalConfig,

    init() {
      if (isInitialized) return Promise.resolve()
      return new Promise((resolve) => {
        waitForThree(() => {
          globalClock = new THREE.Clock()
          isInitialized = true
          animate(0)
          resolve()
        })
      })
    },

    /**
     * Register a canvas with a scene builder function
     * @param {HTMLCanvasElement} canvas
     * @param {Function} sceneBuilder - Returns { scene, camera, updateFn, config? }
     * @param {Object} options
     */
    async register(canvas, sceneBuilder, options = {}) {
      await this.init()

      if (shouldSkipDevice()) {
        canvas.style.display = 'none'
        return { skipped: true }
      }

      if (!canvas.isConnected) {
        console.warn('[SceneManager] Canvas not in DOM')
        return { error: 'Canvas not in DOM' }
      }

      // Create renderer & camera
      const renderer = createRenderer(canvas, options.renderer)
      renderer.setSize(window.innerWidth, window.innerHeight)

      const camera = createCamera(options.camera)
      const scene = new THREE.Scene()

      // Fog (theme-aware)
      if (window.ThemeSync) {
        scene.fog = new THREE.FogExp2(window.ThemeSync.getColor('fog'), 0.0055)
      }

      // Run scene builder
      let updateFn = null
      try {
        const result = sceneBuilder(scene, camera, renderer, { mouseX: () => mouseX, mouseY: () => mouseY })
        if (result && typeof result === 'object') {
          if (result.updateFn) updateFn = result.updateFn
          if (result.scene) Object.assign(scene, result.scene)
        } else if (typeof result === 'function') {
          updateFn = result
        }
      } catch (e) {
        console.error('[SceneManager] Scene builder failed:', e)
        this.dispose(canvas)
        return { error: e.message }
      }

      // Fade-in
      canvas.style.opacity = '0'
      canvas.style.transition = 'opacity 1.5s ease'
      requestAnimationFrame(() => {
        canvas.style.opacity = window.ThemeSync?.isLight() ? '0.65' : '1'
        canvas.classList.add('v')
      })

      // Register
      const entry = { scene, camera, renderer, updateFn, clock: globalClock, canvas, config: options }
      scenes.set(canvas, entry)

      // Theme sync for canvas
      if (window.ThemeSync) {
        window.ThemeSync.registerCanvas(canvas)
      }

      return { success: true, scene, camera, renderer }
    },

    unregister(canvas) {
      this.dispose(canvas)
    },

    dispose(canvas) {
      const entry = scenes.get(canvas)
      if (!entry) return

      // Stop rendering this scene
      scenes.delete(canvas)

      // Dispose Three.js resources
      const { scene, renderer, camera } = entry

      // Geometries
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      // Renderer
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement) {
        renderer.domElement.width = 1
        renderer.domElement.height = 1
      }

      // Theme sync
      if (window.ThemeSync) {
        window.ThemeSync.unregisterCanvas(canvas)
      }

      // Canvas cleanup
      canvas.style.opacity = '0'
      canvas.classList.remove('v')
    },

    disposeAll() {
      scenes.forEach((_, canvas) => this.dispose(canvas))
      scenes.clear()

      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },

    getScene(canvas) {
      return scenes.get(canvas)
    },

    // For debugging
    getStats() {
      let triangles = 0, drawCalls = 0, materials = 0, geometries = 0
      scenes.forEach(({ scene, renderer }) => {
        scene.traverse(obj => {
          if (obj.geometry) {
            geometries++
            const attr = obj.geometry.attributes.position
            if (attr) triangles += attr.count / 3
          }
          if (obj.material) materials++
        })
        if (renderer.info) {
          drawCalls += renderer.info.render.calls || 0
        }
      })
      return { scenes: scenes.size, triangles: Math.round(triangles), drawCalls, materials, geometries }
    }
  }

  // Global cleanup on page unload
  window.addEventListener('pagehide', () => {
    window.SceneManager.disposeAll()
  })
  window.addEventListener('beforeunload', () => {
    window.SceneManager.disposeAll()
  })
})()