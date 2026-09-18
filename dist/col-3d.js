// col-3d.js — Interactive 3D Worlds for Class Of Learners
// Philosophy: The 3D scene IS the interface. Click, drag, explore.
// Not background decoration — navigable space.

;(function () {
  'use strict'

  // Guard: prefers-reduced-motion only. Mobile & touch are fully supported with optimized gestures & pixel ratio!
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function waitForThree(cb) {
    if (typeof THREE !== 'undefined') { cb(); return }
    if (!document.querySelector('script[src*="three"]')) {
      var s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      s.async = true
      s.onload = function () { cb() }
      document.head.appendChild(s)
      return
    }
    var n = 0, iv = setInterval(function () {
      if (++n > 60 || typeof THREE !== 'undefined') { clearInterval(iv); if (typeof THREE !== 'undefined') cb() }
    }, 100)
  }

  waitForThree(initEngine)

  function initEngine() {
    var canvas = document.getElementById('orrery') ||
                 document.getElementById('constellation') ||
                 document.getElementById('cosmos') ||
                 document.getElementById('bgCanvas') ||
                 document.getElementById('schoolBg') ||
                 document.getElementById('webgl-canvas')
    if (!canvas) return

    var path = (window.location.pathname.split('/').pop() || 'home').replace('.html', '').toLowerCase()
    if (path === '' || path === 'index') path = 'home'

    var isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches

    // ─── Renderer ───
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5))
    renderer.setClearColor(0x000000, 0)
    canvas.style.willChange = 'transform'

    var scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x070a14, 0.003)

    var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500)
    camera.position.set(0, 0, 60)

    // ─── Procedural Web Audio Synthesizer ───
    var audioCtx = null
    var soundEnabled = false
    try {
      soundEnabled = localStorage.getItem('col_3d_sound') === 'true'
    } catch (e) {}

    function getAudioCtx() {
      try {
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
          var AudioClass = window.AudioContext || window.webkitAudioContext
          audioCtx = new AudioClass()
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume()
        }
      } catch (err) {}
      return audioCtx
    }

    function playTone(freq, type, duration, vol) {
      if (!soundEnabled) return
      try {
        var ctx = getAudioCtx()
        if (!ctx) return
        var osc = ctx.createOscillator()
        var gain = ctx.createGain()
        osc.type = type || 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        gain.gain.setValueAtTime(vol || 0.05, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      } catch (e) {}
    }

    function playChord(freqs, duration, vol) {
      if (!soundEnabled) return
      freqs.forEach(function (f, i) {
        setTimeout(function () { playTone(f, 'sine', duration, vol) }, i * 32)
      })
    }

    // ─── Input State & Physics ───
    var mouseX = 0, mouseY = 0
    var _pmx = 0, _pmy = 0
    var mouseDown = false
    var dragStartX = 0, dragStartY = 0
    var dragVelX = 0, dragVelY = 0
    var dragDist = 0
    var raycaster = new THREE.Raycaster()
    var mouseVec = new THREE.Vector2()
    var currentHovered = null
    var cameraTarget = { x: 0, y: 0, z: 60, rotY: 0, rotX: 0 }
    var cameraCurrent = { x: 0, y: 0, z: 60, rotY: 0, rotX: 0 }
    var baseZoom = 50
    var autoOrbit = true
    var orbitSpeedMult = 1.0
    var stageMode = false
    var focusTargetNode = null

    // Mouse Drag & Movement
    document.addEventListener('mousemove', function (e) {
      _pmx = (e.clientX / window.innerWidth) * 2 - 1
      _pmy = -(e.clientY / window.innerHeight) * 2 + 1
      mouseVec.set(_pmx, _pmy)
      if (mouseDown) {
        var dx = e.clientX - dragStartX
        var dy = e.clientY - dragStartY
        dragDist += Math.abs(dx) + Math.abs(dy)
        dragVelX = dx * 0.004
        dragVelY = dy * 0.0025
        cameraTarget.rotY += dragVelX
        cameraTarget.rotX = Math.max(-0.6, Math.min(0.6, cameraTarget.rotX + dragVelY))
        dragStartX = e.clientX
        dragStartY = e.clientY
      }
    }, { passive: true })

    document.addEventListener('mousedown', function (e) {
      if (e.target.closest('a, button, input, .pc, .nav-link, .orrery-hud, .orrery-dock, .node-inspector')) return
      mouseDown = true
      dragDist = 0
      dragStartX = e.clientX
      dragStartY = e.clientY
      dragVelX = 0
      dragVelY = 0
      canvas.style.cursor = 'grabbing'
    })

    document.addEventListener('mouseup', function () {
      mouseDown = false
      canvas.style.cursor = 'grab'
    })

    // Mouse Wheel Zoom
    function handleWheel(e) {
      // Zoom if inside hero or over canvas
      var hero = document.getElementById('heroSection') || document.querySelector('.hero')
      if (e.target === canvas || (hero && hero.contains(e.target) && !e.target.closest('.node-inspector, .pc'))) {
        e.preventDefault()
        baseZoom = Math.max(20, Math.min(95, baseZoom + e.deltaY * 0.04))
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })

    // Touch Gestures (Drag Orbit & Pinch Zoom)
    var touchDistStart = 0
    var isTouching = false

    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        isTouching = true
        dragDist = 0
        dragStartX = e.touches[0].clientX
        dragStartY = e.touches[0].clientY
        dragVelX = 0
        dragVelY = 0
        _pmx = (dragStartX / window.innerWidth) * 2 - 1
        _pmy = -(dragStartY / window.innerHeight) * 2 + 1
        mouseVec.set(_pmx, _pmy)
      } else if (e.touches.length === 2) {
        isTouching = false
        touchDistStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }, { passive: true })

    canvas.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1 && isTouching) {
        var cx = e.touches[0].clientX
        var cy = e.touches[0].clientY
        var dx = cx - dragStartX
        var dy = cy - dragStartY
        dragDist += Math.abs(dx) + Math.abs(dy)
        dragVelX = dx * 0.005
        dragVelY = dy * 0.003
        cameraTarget.rotY += dragVelX
        cameraTarget.rotX = Math.max(-0.6, Math.min(0.6, cameraTarget.rotX + dragVelY))
        dragStartX = cx
        dragStartY = cy
        _pmx = (cx / window.innerWidth) * 2 - 1
        _pmy = -(cy / window.innerHeight) * 2 + 1
        mouseVec.set(_pmx, _pmy)
      } else if (e.touches.length === 2) {
        var dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        var diff = touchDistStart - dist
        baseZoom = Math.max(20, Math.min(95, baseZoom + diff * 0.1))
        touchDistStart = dist
      }
    }, { passive: true })

    canvas.addEventListener('touchend', function (e) {
      if (e.touches.length === 0) {
        isTouching = false
        if (dragDist < 8) {
          // Tap counted as raycast click
          triggerCanvasRaycast()
        }
      }
    }, { passive: true })

    canvas.style.cursor = 'grab'

    // ─── Tab visibility ───
    var visible = true
    document.addEventListener('visibilitychange', function () { visible = !document.hidden })

    // ─── Resize ───
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })

    // ─── Theme ───
    var PAL = {
      dark:  { signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa, void: 0x070a14 },
      light: { signal: 0xb8720a, ion: 0x0077b6, teal: 0x009b8d, plasma: 0x6f4fe0, em: 0x0a7c55, dim: 0x6b7399, void: 0xf3f2eb }
    }
    function pal() { return document.body.classList.contains('lm') ? PAL.light : PAL.dark }

    var _themeTargets = []
    function trackTheme(mat, key) { _themeTargets.push({ mat: mat, key: key }); return mat }
    function applyTheme() {
      var p = pal(), lm = document.body.classList.contains('lm')
      _themeTargets.forEach(function (t) { if (t.mat && t.mat.color) t.mat.color.setHex(p[t.key]) })
      if (scene.fog) scene.fog.color.setHex(lm ? PAL.light.void : PAL.dark.void)
      canvas.style.opacity = lm ? 0.6 : 1
    }

    // ─── Click handler ───
    var clickables = []
    var onClickCallback = null

    function triggerCanvasRaycast() {
      mouseVec.set(_pmx, _pmy)
      raycaster.setFromCamera(mouseVec, camera)
      var hits = raycaster.intersectObjects(clickables, true)
      if (hits.length > 0) {
        var obj = hits[0].object
        while (obj && !obj.userData.clickable && obj.parent) obj = obj.parent
        if (obj && obj.userData.clickable && onClickCallback) {
          onClickCallback(obj.userData.payload, hits[0].point)
        }
      } else {
        // Empty space tap/click
        if (onClickCallback) onClickCallback(null, null)
      }
    }

    canvas.addEventListener('click', function () {
      if (dragDist > 8) return
      triggerCanvasRaycast()
    })

    // ─── Hover handler ───
    var onHoverCallback = null

    function updateHover() {
      raycaster.setFromCamera(mouseVec, camera)
      var hits = raycaster.intersectObjects(clickables, true)
      var found = null
      if (hits.length > 0) {
        var obj = hits[0].object
        while (obj && !obj.userData.clickable && obj.parent) obj = obj.parent
        if (obj && obj.userData.clickable) found = obj
      }
      if (found !== currentHovered) {
        if (currentHovered && currentHovered.userData.onUnhover) currentHovered.userData.onUnhover()
        if (found && found.userData.onHover) {
          found.userData.onHover()
          playTone(659.25, 'sine', 0.12, 0.04)
        }
        currentHovered = found
        canvas.style.cursor = found ? 'pointer' : (mouseDown ? 'grabbing' : 'grab')
        if (onHoverCallback) onHoverCallback(found ? found.userData.payload : null)
      }
    }

    // ─── External API ───
    var _hoverTarget = 0, _hoverCurrent = 0
    window.__col3d = {
      get hover() { return _hoverCurrent },
      setHover: function (v) { _hoverTarget = v ? 1 : 0 },
      onClick: function (cb) { onClickCallback = cb },
      onHover: function (cb) { onHoverCallback = cb },
      registerClickable: function (obj, payload, onHoverFn, onUnhoverFn) {
        obj.traverse(function (child) {
          child.userData.clickable = true
          child.userData.payload = payload
          child.userData.onHover = onHoverFn
          child.userData.onUnhover = onUnhoverFn
          clickables.push(child)
        })
      },
      flyTo: function (x, y, z, rotY, rotX) {
        cameraTarget.x = x; cameraTarget.y = y; cameraTarget.z = z
        cameraTarget.rotY = rotY || 0; cameraTarget.rotX = rotX || 0
      },
      resetCamera: function () {
        focusTargetNode = null
        cameraTarget.x = 0; cameraTarget.y = 0; cameraTarget.z = 60
        cameraTarget.rotY = 0; cameraTarget.rotX = 0
        baseZoom = 50
      },
      zoom: function (delta) {
        baseZoom = Math.max(20, Math.min(95, baseZoom + delta))
        playTone(delta < 0 ? 587.33 : 440, 'triangle', 0.1, 0.03)
      },
      setSpeed: function (mult) {
        orbitSpeedMult = mult
      },
      getSpeed: function () {
        return orbitSpeedMult
      },
      toggleAutoOrbit: function (state) {
        autoOrbit = state !== undefined ? state : !autoOrbit
        return autoOrbit
      },
      isAutoOrbit: function () {
        return autoOrbit
      },
      setStageMode: function (enabled) {
        stageMode = enabled
      },
      isStageMode: function () {
        return stageMode
      },
      toggleSound: function (state) {
        soundEnabled = state !== undefined ? state : !soundEnabled
        try { localStorage.setItem('col_3d_sound', soundEnabled ? 'true' : 'false') } catch (e) {}
        if (soundEnabled) {
          getAudioCtx()
          playChord([523.25, 659.25, 783.99], 0.35, 0.06)
        }
        return soundEnabled
      },
      isSoundEnabled: function () {
        return soundEnabled
      },
      playChime: function (type) {
        if (type === 'chord') playChord([523.25, 659.25, 783.99, 1046.50], 0.45, 0.07)
        else if (type === 'ping') playTone(783.99, 'sine', 0.15, 0.05)
        else playTone(440, 'triangle', 0.2, 0.03)
      }
    }

    // ─── Helper: create glow texture ───
    function makeGlowTexture(color) {
      var c = document.createElement('canvas')
      c.width = c.height = 128
      var ctx = c.getContext('2d')
      var rd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      rd.addColorStop(0, color + ')')
      rd.addColorStop(0.5, color + ')')
      rd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = rd
      ctx.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(c)
    }

    // ─── Helper: create dust ───
    function createDust(colorKey, count, innerR, outerR) {
      var positions = new Float32Array(count * 3)
      for (var i = 0; i < count; i++) {
        var r = innerR + Math.random() * (outerR - innerR)
        var phi = Math.acos(-1 + (2 * i) / count)
        var theta = Math.sqrt(count * Math.PI) * phi
        positions[i*3]   = r * Math.cos(theta) * Math.sin(phi)
        positions[i*3+1] = r * Math.sin(theta) * Math.sin(phi)
        positions[i*3+2] = r * Math.cos(phi)
      }
      var geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      var mat = new THREE.PointsMaterial({ color: pal()[colorKey], size: 0.12, transparent: true, opacity: 0.3, sizeAttenuation: true })
      trackTheme(mat, colorKey)
      return new THREE.Points(geo, mat)
    }

    // ─── Scene builders ───
    var builders = {

      // ── HOME: Interactive 3D Orrery Laboratory ──
      // Dynamic planetary simulation with tactile click shockwaves, rich 3D node models,
      // flight focus, HUD controls, and in-place holographic inspection.
      home: function () {
        camera.position.set(0, 8, 50)
        cameraCurrent.z = 50
        cameraTarget.z = 50
        baseZoom = 50

        var root = new THREE.Group()
        scene.add(root)

        // ─── Central CoL Core ───
        var coreGroup = new THREE.Group()
        root.add(coreGroup)

        // Inner crystalline core
        var coreGeo = new THREE.IcosahedronGeometry(2.4, 2)
        var coreMat = new THREE.MeshBasicMaterial({ color: pal().signal })
        trackTheme(coreMat, 'signal')
        var core = new THREE.Mesh(coreGeo, coreMat)
        coreGroup.add(core)

        // Gyroscopic Gimbal Ring 1
        var gimbal1Geo = new THREE.TorusGeometry(3.6, 0.045, 8, 48)
        var gimbal1Mat = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.55 })
        trackTheme(gimbal1Mat, 'signal')
        var gimbal1 = new THREE.Mesh(gimbal1Geo, gimbal1Mat)
        gimbal1.rotation.x = Math.PI * 0.25
        coreGroup.add(gimbal1)

        // Gyroscopic Gimbal Ring 2
        var gimbal2Geo = new THREE.TorusGeometry(4.3, 0.04, 8, 48)
        var gimbal2Mat = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.35 })
        trackTheme(gimbal2Mat, 'signal')
        var gimbal2 = new THREE.Mesh(gimbal2Geo, gimbal2Mat)
        gimbal2.rotation.y = Math.PI * 0.35
        coreGroup.add(gimbal2)

        // Outer faceted wireframe core cage
        var cageGeo = new THREE.IcosahedronGeometry(5.2, 1)
        var cageMat = new THREE.MeshBasicMaterial({ color: pal().signal, wireframe: true, transparent: true, opacity: 0.22 })
        trackTheme(cageMat, 'signal')
        var cage = new THREE.Mesh(cageGeo, cageMat)
        coreGroup.add(cage)

        // Core glow sprite
        var glowCvs = document.createElement('canvas')
        glowCvs.width = glowCvs.height = 256
        var gctx = glowCvs.getContext('2d')
        var grd = gctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        grd.addColorStop(0, 'rgba(255,255,255,0.95)')
        grd.addColorStop(0.2, 'rgba(242,184,75,0.6)')
        grd.addColorStop(0.5, 'rgba(242,184,75,0.15)')
        grd.addColorStop(1, 'rgba(242,184,75,0)')
        gctx.fillStyle = grd
        gctx.fillRect(0, 0, 256, 256)
        var glowTex = new THREE.CanvasTexture(glowCvs)
        var glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.7 })
        var glow = new THREE.Sprite(glowMat)
        glow.scale.set(20, 20, 1)
        coreGroup.add(glow)

        // Register Core as clickable
        window.__col3d.registerClickable(core, 'core',
          function () {
            coreMat.color.setHex(0xffffff)
            glowMat.opacity = 0.95
          },
          function () {
            coreMat.color.setHex(pal().signal)
            glowMat.opacity = 0.7
          }
        )

        // Energy connecting beams
        var beamMat = new THREE.LineBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.15 })
        trackTheme(beamMat, 'signal')
        var beamPositions = new Float32Array(6 * 2 * 3)
        var beamGeo = new THREE.BufferGeometry()
        beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3))
        var beams = new THREE.LineSegments(beamGeo, beamMat)
        root.add(beams)

        // ─── Shockwaves & Particles Engine ───
        var activeShockwaves = []
        function spawnShockwave(x, y, z, colorHex) {
          var ringGeo = new THREE.RingGeometry(0.2, 0.45, 32)
          var ringMat = new THREE.MeshBasicMaterial({
            color: colorHex || pal().signal,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
          })
          var ringMesh = new THREE.Mesh(ringGeo, ringMat)
          ringMesh.position.set(x, y, z)
          ringMesh.rotation.x = Math.PI * 0.5
          root.add(ringMesh)

          var sparkCount = 14
          var sparkPositions = new Float32Array(sparkCount * 3)
          var sparkVelocities = []
          for (var sp = 0; sp < sparkCount; sp++) {
            sparkPositions[sp * 3] = x
            sparkPositions[sp * 3 + 1] = y
            sparkPositions[sp * 3 + 2] = z
            var angle = Math.random() * Math.PI * 2
            var spd = 0.12 + Math.random() * 0.22
            sparkVelocities.push({
              vx: Math.cos(angle) * spd,
              vy: (Math.random() - 0.5) * spd * 0.7,
              vz: Math.sin(angle) * spd
            })
          }
          var sparkGeo = new THREE.BufferGeometry()
          sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
          var sparkMat = new THREE.PointsMaterial({
            color: colorHex || pal().signal,
            size: 0.28,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
          })
          var sparkPoints = new THREE.Points(sparkGeo, sparkMat)
          root.add(sparkPoints)

          activeShockwaves.push({
            ring: ringMesh,
            ringMat: ringMat,
            sparks: sparkPoints,
            sparkMat: sparkMat,
            sparkGeo: sparkGeo,
            sparkVelocities: sparkVelocities,
            life: 1.0
          })
        }

        // ─── Six Project Nodes with Rich 3D Geometry ───
        var projectNodes = [
          { name: 'ATI',     key: 'ion',    radius: 14, speed: 0.15,  page: 'ati',             y: 0,    type: 'keyboard' },
          { name: 'Traffic', key: 'signal', radius: 20, speed: -0.1,  page: 'Traffic/Driving', y: 1.5,  type: 'traffic' },
          { name: 'Solar',   key: 'teal',   radius: 26, speed: 0.08,  page: 'solar',           y: -1,   type: 'solar' },
          { name: 'Gesture', key: 'plasma', radius: 17, speed: -0.12, page: 'gesture',         y: 2,    type: 'vision' },
          { name: 'RPG',     key: 'em',     radius: 23, speed: 0.09,  page: 'rpg',             y: -2,   type: 'crystal' },
          { name: 'QR',      key: 'dim',    radius: 30, speed: -0.07, page: 'qr',              y: 0.5,  type: 'matrix' }
        ]

        var nodeObjects = []
        var whiteHex = 0xffffff

        projectNodes.forEach(function (p, i) {
          var angle = (i / projectNodes.length) * Math.PI * 2
          var nodeGroup = new THREE.Group()
          nodeGroup.position.set(Math.cos(angle) * p.radius, p.y, Math.sin(angle) * p.radius)
          root.add(nodeGroup)

          // Orbit guide ring
          var orbitGeo = new THREE.TorusGeometry(p.radius, 0.025, 6, 120)
          var orbitMat = new THREE.MeshBasicMaterial({ color: pal()[p.key], transparent: true, opacity: 0.15 })
          trackTheme(orbitMat, p.key)
          var orbit = new THREE.Mesh(orbitGeo, orbitMat)
          orbit.rotation.x = Math.PI * 0.5
          orbit.position.y = p.y
          root.add(orbit)

          // Planet base body
          var planetSize = p.key === 'signal' ? 1.5 : (p.key === 'ion' ? 1.3 : 1.1)
          var planetGeo = new THREE.IcosahedronGeometry(planetSize, 2)
          var planetMat = new THREE.MeshBasicMaterial({ color: pal()[p.key] })
          trackTheme(planetMat, p.key)
          var planet = new THREE.Mesh(planetGeo, planetMat)
          nodeGroup.add(planet)

          // Secondary orbital halo ring
          var pRingGeo = new THREE.TorusGeometry(planetSize * 1.6, 0.02, 4, 32)
          var pRingMat = new THREE.MeshBasicMaterial({ color: pal()[p.key], transparent: true, opacity: 0.4 })
          trackTheme(pRingMat, p.key)
          var pRing = new THREE.Mesh(pRingGeo, pRingMat)
          pRing.rotation.x = Math.PI * 0.3
          planet.add(pRing)

          // Planet glow sprite
          var pGlowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.45 })
          var pGlow = new THREE.Sprite(pGlowMat)
          pGlow.scale.set(planetSize * 5.5, planetSize * 5.5, 1)
          nodeGroup.add(pGlow)

          // Custom distinctive 3D models per node
          var customExtras = {}

          if (p.type === 'traffic') {
            // Traffic Node: mini traffic signal mast + orbiting mini sports car
            var mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8)
            var mastMat = new THREE.MeshBasicMaterial({ color: 0x444855 })
            var mast = new THREE.Mesh(mastGeo, mastMat)
            mast.position.set(0, planetSize + 0.55, 0)
            nodeGroup.add(mast)

            var headGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2)
            var headMat = new THREE.MeshBasicMaterial({ color: 0x11131a })
            var head = new THREE.Mesh(headGeo, headMat)
            head.position.set(0, planetSize + 0.95, 0)
            nodeGroup.add(head)

            // Red, Amber, Green LEDs
            var ledRedGeo = new THREE.SphereGeometry(0.06, 8, 8)
            var ledRedMat = new THREE.MeshBasicMaterial({ color: 0xff3344 })
            var ledRed = new THREE.Mesh(ledRedGeo, ledRedMat)
            ledRed.position.set(0, planetSize + 1.12, 0.12)
            nodeGroup.add(ledRed)

            var ledAmbGeo = new THREE.SphereGeometry(0.06, 8, 8)
            var ledAmbMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            var ledAmb = new THREE.Mesh(ledAmbGeo, ledAmbMat)
            ledAmb.position.set(0, planetSize + 0.95, 0.12)
            nodeGroup.add(ledAmb)

            var ledGrnGeo = new THREE.SphereGeometry(0.06, 8, 8)
            var ledGrnMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 })
            var ledGrn = new THREE.Mesh(ledGrnGeo, ledGrnMat)
            ledGrn.position.set(0, planetSize + 0.78, 0.12)
            nodeGroup.add(ledGrn)

            // Mini sports vehicle orbiting the planet
            var carGroup = new THREE.Group()
            var carChassis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.8), new THREE.MeshBasicMaterial({ color: pal().signal }))
            trackTheme(carChassis.material, 'signal')
            var carCabin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.38), new THREE.MeshBasicMaterial({ color: 0x111827 }))
            carCabin.position.set(0, 0.12, -0.05)
            carGroup.add(carChassis)
            carGroup.add(carCabin)
            nodeGroup.add(carGroup)

            customExtras.car = carGroup
            customExtras.leds = [ledRedMat, ledAmbMat, ledGrnMat]
          } else if (p.type === 'solar') {
            // Solar Node: Coronal flare loops + orbiting moonlet
            var flare1Geo = new THREE.TorusGeometry(planetSize * 1.35, 0.035, 6, 32)
            var flare1Mat = new THREE.MeshBasicMaterial({ color: pal().teal, transparent: true, opacity: 0.65 })
            trackTheme(flare1Mat, 'teal')
            var flare1 = new THREE.Mesh(flare1Geo, flare1Mat)
            flare1.rotation.x = Math.PI * 0.4
            nodeGroup.add(flare1)

            var flare2Geo = new THREE.TorusGeometry(planetSize * 1.5, 0.03, 6, 32)
            var flare2Mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
            var flare2 = new THREE.Mesh(flare2Geo, flare2Mat)
            flare2.rotation.y = Math.PI * 0.4
            nodeGroup.add(flare2)

            var moonGeo = new THREE.IcosahedronGeometry(0.32, 1)
            var moonMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
            var moon = new THREE.Mesh(moonGeo, moonMat)
            nodeGroup.add(moon)

            customExtras.flare1 = flare1
            customExtras.flare2 = flare2
            customExtras.moon = moon
          } else if (p.type === 'keyboard') {
            // ATI Node: 4 floating mechanical keycaps that alternate typing
            var keyGroup = new THREE.Group()
            var keys = []
            for (var k = 0; k < 4; k++) {
              var keyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), new THREE.MeshBasicMaterial({ color: pal().ion }))
              trackTheme(keyMesh.material, 'ion')
              keyMesh.position.set((k % 2 - 0.5) * 0.55, planetSize + 0.4, (Math.floor(k / 2) - 0.5) * 0.55)
              keyGroup.add(keyMesh)
              keys.push(keyMesh)
            }
            nodeGroup.add(keyGroup)
            customExtras.keys = keys
          } else if (p.type === 'vision') {
            // Gesture Node: Radar scanner circle with sweeping crosshair
            var radarRing = new THREE.Mesh(new THREE.TorusGeometry(planetSize * 1.45, 0.02, 4, 32), new THREE.MeshBasicMaterial({ color: pal().plasma, transparent: true, opacity: 0.7 }))
            trackTheme(radarRing.material, 'plasma')
            radarRing.rotation.x = Math.PI * 0.5
            nodeGroup.add(radarRing)

            var sweepGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(planetSize * 1.45, 0, 0)])
            var sweepLine = new THREE.Line(sweepGeo, new THREE.LineBasicMaterial({ color: pal().plasma, transparent: true, opacity: 0.8 }))
            trackTheme(sweepLine.material, 'plasma')
            nodeGroup.add(sweepLine)

            customExtras.radar = radarRing
            customExtras.sweep = sweepLine
          } else if (p.type === 'crystal') {
            // RPG Node: Floating faceted mana diamond crystal + orbiting shards
            var crystalGeo = new THREE.OctahedronGeometry(1.2, 0)
            var crystalMat = new THREE.MeshBasicMaterial({ color: pal().em, wireframe: true })
            trackTheme(crystalMat, 'em')
            var crystal = new THREE.Mesh(crystalGeo, crystalMat)
            crystal.scale.set(0.8, 1.6, 0.8)
            nodeGroup.add(crystal)

            var shards = []
            for (var sh = 0; sh < 4; sh++) {
              var sMesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18, 0), new THREE.MeshBasicMaterial({ color: pal().em }))
              trackTheme(sMesh.material, 'em')
              nodeGroup.add(sMesh)
              shards.push(sMesh)
            }
            customExtras.crystal = crystal
            customExtras.shards = shards
          } else if (p.type === 'matrix') {
            // QR Node: 3D Voxel cluster with corner finder targets
            var voxelBox = new THREE.Mesh(new THREE.BoxGeometry(planetSize * 1.3, planetSize * 1.3, planetSize * 1.3), new THREE.MeshBasicMaterial({ color: pal().dim, wireframe: true, transparent: true, opacity: 0.5 }))
            trackTheme(voxelBox.material, 'dim')
            nodeGroup.add(voxelBox)
            customExtras.voxel = voxelBox
          }

          // Register node group as clickable
          window.__col3d.registerClickable(planet, p.name,
            function () {
              planetMat.color.setHex(whiteHex)
              pGlowMat.opacity = 0.95
              planet.scale.set(1.4, 1.4, 1.4)
              var tip = document.getElementById('ntip')
              if (tip) {
                var dot = document.getElementById('ntip-dot')
                var nme = document.getElementById('ntip-name')
                if (dot) dot.style.background = 'var(--' + p.key + ')'
                if (nme) nme.textContent = p.name
                tip.style.display = 'block'
                tip.style.opacity = '1'
              }
            },
            function () {
              planetMat.color.setHex(pal()[p.key])
              pGlowMat.opacity = 0.45
              planet.scale.set(1, 1, 1)
              var tip = document.getElementById('ntip')
              if (tip) { tip.style.opacity = '0' }
            }
          )

          nodeObjects.push({
            data: p,
            group: nodeGroup,
            planet: planet,
            glow: pGlow,
            glowMat: pGlowMat,
            orbit: orbit,
            angle: angle,
            mat: planetMat,
            ring: pRing,
            extras: customExtras
          })
        })

        // Starfield particles
        var dustCount = isMobile ? 180 : 380
        scene.add(createDust('dim', dustCount, 40, 180))
        scene.add(createDust('signal', isMobile ? 60 : 120, 25, 110))
        scene.add(createDust('ion', isMobile ? 50 : 100, 30, 130))

        // Node click & inspect handler
        window.__col3d.onClick(function (targetName, hitPoint) {
          if (!targetName) {
            // Clicked empty space
            if (focusTargetNode) {
              window.__col3d.resetView()
              if (window.closeNodeInspector) window.closeNodeInspector()
            }
            if (hitPoint) spawnShockwave(hitPoint.x, hitPoint.y, hitPoint.z, pal().signal)
            return
          }

          if (targetName === 'core') {
            spawnShockwave(0, 0, 0, pal().signal)
            window.__col3d.playChime('chord')
            focusTargetNode = { name: 'core', position: new THREE.Vector3(0, 0, 0), radius: 0, angle: 0 }
            cameraTarget.rotY = 0
            cameraTarget.rotX = 0.15
            baseZoom = 26
            if (window.openNodeInspector) window.openNodeInspector('core')
            return
          }

          var target = nodeObjects.find(function (n) { return n.data.name === targetName || n.data.page === targetName })
          if (target) {
            var pPos = target.group.position
            spawnShockwave(pPos.x, pPos.y, pPos.z, pal()[target.data.key])
            window.__col3d.playChime('chord')

            // Fly camera & focus node
            focusTargetNode = target
            cameraTarget.rotY = -target.angle + Math.PI * 0.5
            cameraTarget.rotX = -target.data.y * 0.04
            baseZoom = Math.max(22, target.data.radius * 0.82 + 8)

            // Open holographic inspector modal
            if (window.openNodeInspector) {
              window.openNodeInspector(target.data.name)
            }
          }
        })

        // Expose focus / reset methods for external HUD
        window.__col3d.flyToNode = function (nodeName) {
          if (nodeName === 'core') {
            spawnShockwave(0, 0, 0, pal().signal)
            window.__col3d.playChime('chord')
            focusTargetNode = { name: 'core', position: new THREE.Vector3(0, 0, 0), radius: 0, angle: 0 }
            cameraTarget.rotY = 0
            cameraTarget.rotX = 0.15
            baseZoom = 26
            return
          }
          var target = nodeObjects.find(function (n) { return n.data.name.toLowerCase() === nodeName.toLowerCase() })
          if (target) {
            var pPos = target.group.position
            spawnShockwave(pPos.x, pPos.y, pPos.z, pal()[target.data.key])
            window.__col3d.playChime('chord')
            focusTargetNode = target
            cameraTarget.rotY = -target.angle + Math.PI * 0.5
            cameraTarget.rotX = -target.data.y * 0.04
            baseZoom = Math.max(22, target.data.radius * 0.82 + 8)
          }
        }

        window.__col3d.resetView = function () {
          focusTargetNode = null
          cameraTarget.rotY = 0
          cameraTarget.rotX = 0
          baseZoom = 50
          window.__col3d.playChime('ping')
        }

        // Sync card hover
        document.querySelectorAll('.pc').forEach(function (card) {
          card.addEventListener('mouseenter', function () { _hoverTarget = 1 })
          card.addEventListener('mouseleave', function () { _hoverTarget = 0 })
        })

        // Tooltip positioning
        document.addEventListener('mousemove', function (e) {
          var tip = document.getElementById('ntip')
          if (tip && tip.style.opacity === '1') {
            tip.style.left = (e.clientX + 14) + 'px'
            tip.style.top = (e.clientY + 14) + 'px'
          }
        }, { passive: true })

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        // ─── Main Animation Loop for Home Scene ───
        return function (t) {
          // 1. Shockwaves & Sparks update
          for (var sw = activeShockwaves.length - 1; sw >= 0; sw--) {
            var s = activeShockwaves[sw]
            s.life -= 0.038
            if (s.life <= 0) {
              root.remove(s.ring); s.ring.geometry.dispose(); s.ringMat.dispose()
              root.remove(s.sparks); s.sparkGeo.dispose(); s.sparkMat.dispose()
              activeShockwaves.splice(sw, 1)
            } else {
              var sScale = (1 - s.life) * 11 + 1
              s.ring.scale.set(sScale, sScale, sScale)
              s.ringMat.opacity = s.life * 0.85
              s.sparkMat.opacity = s.life
              var sPos = s.sparkGeo.attributes.position.array
              for (var sp = 0; sp < s.sparkVelocities.length; sp++) {
                sPos[sp * 3] += s.sparkVelocities[sp].vx
                sPos[sp * 3 + 1] += s.sparkVelocities[sp].vy
                sPos[sp * 3 + 2] += s.sparkVelocities[sp].vz
              }
              s.sparkGeo.attributes.position.needsUpdate = true
            }
          }

          // 2. CoL Core breathing and gyroscopic rings
          var breathe = 1 + Math.sin(t * 0.8) * 0.05
          core.scale.set(breathe, breathe, breathe)
          core.rotation.y = t * 0.08
          core.rotation.x = t * 0.04
          gimbal1.rotation.z = t * 0.25
          gimbal2.rotation.x = -t * 0.22
          cage.scale.set(1 + Math.sin(t * 0.5) * 0.03, 1 + Math.sin(t * 0.5) * 0.03, 1 + Math.sin(t * 0.5) * 0.03)
          cage.rotation.y = -t * 0.07
          cage.rotation.x = t * 0.03
          glow.scale.set(20 + Math.sin(t * 0.8) * 2.5, 20 + Math.sin(t * 0.8) * 2.5, 1)

          // 3. Update project nodes & energy beams
          var bPos = beamGeo.attributes.position.array
          var speedFactor = autoOrbit ? orbitSpeedMult : 0

          nodeObjects.forEach(function (n, idx) {
            n.angle += n.data.speed * 0.01 * speedFactor
            n.group.position.x = Math.cos(n.angle) * n.data.radius
            n.group.position.z = Math.sin(n.angle) * n.data.radius
            n.group.position.y = n.data.y + Math.sin(t * 0.5 + n.data.radius) * 0.35

            n.planet.rotation.y = t * 0.22
            n.planet.rotation.x = t * 0.1
            n.ring.rotation.z = t * 0.35

            // Beams from core to planets
            var bIdx = idx * 6
            bPos[bIdx] = 0; bPos[bIdx+1] = 0; bPos[bIdx+2] = 0
            bPos[bIdx+3] = n.group.position.x; bPos[bIdx+4] = n.group.position.y; bPos[bIdx+5] = n.group.position.z

            // Custom node animations
            if (n.data.type === 'traffic' && n.extras.car) {
              var carAngle = t * 1.5
              n.extras.car.position.set(Math.cos(carAngle) * 2.4, 0, Math.sin(carAngle) * 2.4)
              n.extras.car.rotation.y = -carAngle + Math.PI * 0.5
              // Traffic light blinking cycle
              var lightPhase = Math.floor(t * 1.5) % 3
              if (n.extras.leds) {
                n.extras.leds[0].color.setHex(lightPhase === 0 ? 0xff2244 : 0x330508)
                n.extras.leds[1].color.setHex(lightPhase === 1 ? 0xffaa00 : 0x332200)
                n.extras.leds[2].color.setHex(lightPhase === 2 ? 0x00ff88 : 0x022914)
              }
            } else if (n.data.type === 'solar' && n.extras.flare1) {
              n.extras.flare1.rotation.z = t * 0.45
              n.extras.flare2.rotation.x = -t * 0.35
              if (n.extras.moon) {
                n.extras.moon.position.set(Math.cos(t * 0.8) * 2.6, Math.sin(t * 0.5) * 0.6, Math.sin(t * 0.8) * 2.6)
              }
            } else if (n.data.type === 'keyboard' && n.extras.keys) {
              n.extras.keys.forEach(function (kMesh, ki) {
                kMesh.position.y = 1.3 + 0.4 + Math.sin(t * 6 + ki * 1.6) * 0.08
              })
            } else if (n.data.type === 'vision' && n.extras.sweep) {
              n.extras.sweep.rotation.y = t * 1.8
            } else if (n.data.type === 'crystal' && n.extras.crystal) {
              n.extras.crystal.rotation.y = t * 0.5
              n.extras.crystal.rotation.z = Math.sin(t * 0.4) * 0.15
              if (n.extras.shards) {
                n.extras.shards.forEach(function (sMesh, si) {
                  var sa = t * 0.8 + (si / 4) * Math.PI * 2
                  sMesh.position.set(Math.cos(sa) * 1.8, Math.sin(t + si) * 0.4, Math.sin(sa) * 1.8)
                  sMesh.rotation.y = t * 1.2
                })
              }
            } else if (n.data.type === 'matrix' && n.extras.voxel) {
              n.extras.voxel.rotation.y = t * 0.18
              n.extras.voxel.rotation.x = t * 0.12
            }
          })
          beamGeo.attributes.position.needsUpdate = true

          // 4. Drag inertia & auto orbit
          if (!mouseDown && !focusTargetNode) {
            dragVelX *= 0.93
            dragVelY *= 0.93
            cameraTarget.rotY += dragVelX + (autoOrbit ? 0.0003 * orbitSpeedMult : 0)
            cameraTarget.rotX = Math.max(-0.6, Math.min(0.6, cameraTarget.rotX + dragVelY))
          }
          if (!focusTargetNode) {
            cameraTarget.rotX += (_pmy * 0.12 - cameraTarget.rotX) * 0.008
          }

          // 5. Card hover scaling
          var hover = window.__col3d.hover
          nodeObjects.forEach(function (n) {
            if (n.planet !== currentHovered) {
              var targetScale = 1 + hover * 0.18
              n.planet.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05)
            }
          })

          // 6. Camera zoom: respect baseZoom, scroll progression, and stage mode
          var maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1
          var scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll))
          var targetZoom = baseZoom + (stageMode ? 0 : scrollProgress * 20)
          cameraTarget.z = targetZoom

          // 7. Camera interpolation
          cameraCurrent.rotY += (cameraTarget.rotY - cameraCurrent.rotY) * 0.045
          cameraCurrent.rotX += (cameraTarget.rotX - cameraCurrent.rotX) * 0.045
          cameraCurrent.z += (cameraTarget.z - cameraCurrent.z) * 0.045
          root.rotation.y = cameraCurrent.rotY
          root.rotation.x = cameraCurrent.rotX

          // 8. Raycast hover sampling
          if (Math.floor(t * 30) % 3 === 0) updateHover()
        }
      },


      // ── ABOUT: Team Constellation ──
      // Click stars to fly camera to team members. Drag to rotate.
      about: function () {
        camera.position.set(0, 0, 50)
        cameraCurrent.z = 50
        cameraTarget.z = 50

        var root = new THREE.Group()
        scene.add(root)

        var members = [
          { name: 'Sanjana Kasbe',  role: 'Mentor',  key: 'signal', pos: new THREE.Vector3(0, 14, 0) },
          { name: 'Neel Badri',     role: 'Lead Dev', key: 'ion',   pos: new THREE.Vector3(-16, 7, 0) },
          { name: 'Ansh Patil',     role: 'Co-Dev',  key: 'teal',  pos: new THREE.Vector3(16, 7, 0) },
          { name: 'Aarush Vangari', role: 'UI/UX',   key: 'plasma', pos: new THREE.Vector3(-16, -8, 0) },
          { name: 'Yashraj Jadhav', role: 'QA/Design', key: 'em',  pos: new THREE.Vector3(16, -8, 0) },
          { name: 'Akshara Bangar', role: 'Research', key: 'dim',  pos: new THREE.Vector3(0, -16, 0) }
        ]

        var stars = []
        var whiteHex = 0xffffff

        members.forEach(function (m, i) {
          var grp = new THREE.Group()
          grp.position.copy(m.pos)

          var geo = new THREE.SphereGeometry(0.7, 16, 16)
          var mat = new THREE.MeshBasicMaterial({ color: pal()[m.key] })
          trackTheme(mat, m.key)
          var sphere = new THREE.Mesh(geo, mat)
          grp.add(sphere)

          // Glow
          var glowCvs2 = document.createElement('canvas')
          glowCvs2.width = glowCvs2.height = 128
          var gctx2 = glowCvs2.getContext('2d')
          var grd2 = gctx2.createRadialGradient(64, 64, 0, 64, 64, 64)
          grd2.addColorStop(0, 'rgba(255,255,255,0.4)')
          grd2.addColorStop(0.5, 'rgba(255,255,255,0.05)')
          grd2.addColorStop(1, 'rgba(255,255,255,0)')
          gctx2.fillStyle = grd2
          gctx2.fillRect(0, 0, 128, 128)
          var glowMat2 = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCvs2), transparent: true, blending: THREE.AdditiveBlending, opacity: 0.4 })
          var glow2 = new THREE.Sprite(glowMat2)
          glow2.scale.set(6, 6, 1)
          grp.add(glow2)

          root.add(grp)

          // Clickable
          window.__col3d.registerClickable(grp, i,
            function () {
              mat.color.setHex(whiteHex)
              grp.scale.set(1.3, 1.3, 1.3)
              var tip = document.getElementById('ntip')
              if (tip) {
                document.getElementById('ntip-dot').style.background = 'var(--' + m.key + ')'
                document.getElementById('ntip-name').textContent = m.name
                tip.style.display = 'block'; tip.style.opacity = '1'
              }
              window.__col3d.flyTo(m.pos.x * 0.5, m.pos.y * 0.5, 25)
            },
            function () {
              mat.color.setHex(pal()[m.key])
              grp.scale.set(1, 1, 1)
              var tip = document.getElementById('ntip')
              if (tip) { tip.style.opacity = '0' }
              window.__col3d.flyTo(0, 0, 50)
            }
          )

          stars.push({ data: m, group: grp, sphere: sphere, mat: mat })
        })

        // Connection lines
        var connMat = new THREE.LineBasicMaterial({ color: pal().dim, transparent: true, opacity: 0.1 })
        trackTheme(connMat, 'dim')
        var connPts = [
          members[0].pos, members[1].pos, members[0].pos, members[2].pos,
          members[0].pos, members[3].pos, members[0].pos, members[4].pos,
          members[0].pos, members[5].pos, members[1].pos, members[3].pos,
          members[2].pos, members[4].pos, members[3].pos, members[5].pos,
          members[4].pos, members[5].pos
        ]
        var connGeo = new THREE.BufferGeometry().setFromPoints(connPts)
        root.add(new THREE.LineSegments(connGeo, connMat))

        // Background dust
        scene.add(createDust('dim', 350, 60, 120))

        // Tooltip
        document.addEventListener('mousemove', function (e) {
          var tip = document.getElementById('ntip')
          if (tip && tip.style.opacity === '1') {
            tip.style.left = e.clientX + 'px'
            tip.style.top = e.clientY + 'px'
          }
        }, { passive: true })

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          stars.forEach(function (s, i) {
            s.group.position.y = s.data.pos.y + Math.sin(t * 0.6 + i * 1.2) * 0.4
            s.group.position.x = s.data.pos.x + Math.cos(t * 0.4 + i * 0.8) * 0.2
          })

          // Drag rotation
          if (!mouseDown) cameraTarget.rotY += 0.0002

          // Camera easing
          cameraCurrent.rotY += (cameraTarget.rotY - cameraCurrent.rotY) * 0.03
          cameraCurrent.rotX += (cameraTarget.rotX - cameraCurrent.rotX) * 0.03
          cameraCurrent.z += (cameraTarget.z - cameraCurrent.z) * 0.03
          root.rotation.y = cameraCurrent.rotY
          root.rotation.x = cameraCurrent.rotX

          if (Math.floor(t * 30) % 3 === 0) updateHover()
        }
      },


      // ── SCHOOL: Orbiting Knowledge Orbs ──
      // Drag to rotate. Hover orbs to highlight.
      school: function () {
        camera.position.set(0, 0, 50)
        cameraCurrent.z = 50
        cameraTarget.z = 50

        var root = new THREE.Group()
        scene.add(root)

        var orbCount = 8
        var orbs = []
        var orbKeys = ['ion', 'signal', 'teal', 'plasma', 'em', 'ion', 'signal', 'teal']

        for (var i = 0; i < orbCount; i++) {
          var geo = new THREE.IcosahedronGeometry(1 + Math.random() * 0.8, 1)
          var mat = new THREE.MeshBasicMaterial({ color: pal()[orbKeys[i]], wireframe: true, transparent: true, opacity: 0.3 })
          trackTheme(mat, orbKeys[i])
          var mesh = new THREE.Mesh(geo, mat)
          var angle = (i / orbCount) * Math.PI * 2
          var radius = 15 + Math.random() * 8
          mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 12, Math.sin(angle) * radius * 0.5)
          mesh.userData.angle = angle
          mesh.userData.radius = radius
          mesh.userData.speed = 0.1 + Math.random() * 0.15
          mesh.userData.floatOff = Math.random() * Math.PI * 2
          mesh.userData.baseColor = orbKeys[i]
          root.add(mesh)
          orbs.push(mesh)
        }

        scene.add(createDust('dim', 300, 60, 100))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          orbs.forEach(function (o) {
            o.userData.angle += o.userData.speed * 0.01
            o.position.x = Math.cos(o.userData.angle) * o.userData.radius
            o.position.z = Math.sin(o.userData.angle) * o.userData.radius * 0.5
            o.position.y = Math.sin(t * o.userData.speed + o.userData.floatOff) * 2
            o.rotation.x = t * 0.1
            o.rotation.y = t * 0.15
          })

          if (!mouseDown) cameraTarget.rotY += 0.0002

          cameraCurrent.rotY += (cameraTarget.rotY - cameraCurrent.rotY) * 0.03
          cameraCurrent.rotX += (cameraTarget.rotX - cameraCurrent.rotX) * 0.03
          root.rotation.y = cameraCurrent.rotY
          root.rotation.x = cameraCurrent.rotX
        }
      },


      // ── ATI: Typing Waveform ──
      // 28 bars pulse like a typing rhythm. Two accent keys press rhythmically.
      // Drag to shift the waveform angle. Hover intensifies the pattern.
      ati: function () {
        camera.position.set(0, 0, 40)
        cameraCurrent.z = 40
        cameraTarget.z = 40

        var root = new THREE.Group()
        scene.add(root)

        var barCount = 28
        var bars = []
        var barSpacing = 1.5

        for (var i = 0; i < barCount; i++) {
          var h = 1.5 + Math.random() * 5
          var geo = new THREE.BoxGeometry(0.5, h, 0.3)
          var mat = new THREE.MeshBasicMaterial({ color: pal().ion, transparent: true, opacity: 0.2 + Math.random() * 0.15 })
          trackTheme(mat, 'ion')
          var bar = new THREE.Mesh(geo, mat)
          bar.position.set((i - barCount / 2) * barSpacing, 0, 0)
          bar.userData.baseY = 0
          bar.userData.h = h
          bar.userData.speed = 1.2 + Math.random() * 1.8
          bar.userData.phase = (i / barCount) * Math.PI * 2
          root.add(bar)
          bars.push(bar)
        }

        // Two accent bars (signal gold) at center
        var accentMatL = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.35 })
        var accentMatR = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.35 })
        trackTheme(accentMatL, 'signal')
        trackTheme(accentMatR, 'signal')
        var accentL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4, 0.4), accentMatL)
        var accentR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4, 0.4), accentMatR)
        accentL.position.set(-barSpacing, 0, 0.5)
        accentR.position.set(barSpacing, 0, 0.5)
        root.add(accentL)
        root.add(accentR)

        scene.add(createDust('ion', 250, 50, 100))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          var hover = window.__col3d.hover

          bars.forEach(function (b, i) {
            var wave = Math.sin(t * b.userData.speed + b.userData.phase)
            var h = b.userData.h * (0.3 + (wave * 0.5 + 0.5) * 0.7 + hover * 0.3)
            b.scale.y = h / b.userData.h
            b.position.y = (h - b.userData.h) * 0.5
            b.material.opacity = 0.15 + (wave * 0.5 + 0.5) * 0.2 + hover * 0.1
          })

          // Accent keys press rhythmically
          var press = (Math.sin(t * 2.5) * 0.5 + 0.5) > 0.7 ? 1 : 0
          accentL.position.y = -press * 0.4
          accentR.position.y = -(1 - press) * 0.4
          accentL.material.opacity = 0.3 + press * 0.3 + hover * 0.15
          accentR.material.opacity = 0.3 + (1 - press) * 0.3 + hover * 0.15

          // Drag tilts the waveform
          if (!mouseDown) cameraTarget.rotY += 0.0003
          root.rotation.z = Math.sin(t * 0.3) * 0.01
          root.rotation.y += (mouseX * 0.04 - root.rotation.y) * 0.012
          root.rotation.x += (mouseY * 0.02 - root.rotation.x) * 0.012

          cameraCurrent.z += (cameraTarget.z - cameraCurrent.z) * 0.03
        }
      },


      // ── DRIVING: Perspective Road ──
      // Markers flow toward you = driving forward. Mouse steers the road.
      // Horizon glow where the road disappears.
      driving: function () {
        camera.position.set(0, 2, 30)
        cameraCurrent.z = 30
        cameraTarget.z = 30

        var root = new THREE.Group()
        scene.add(root)

        // Road surface
        var roadGeo = new THREE.PlaneGeometry(6, 120, 1, 1)
        var roadMat = new THREE.MeshBasicMaterial({ color: pal().ion, transparent: true, opacity: 0.06 })
        trackTheme(roadMat, 'ion')
        var road = new THREE.Mesh(roadGeo, roadMat)
        road.rotation.x = -Math.PI / 2.2
        road.position.set(0, -2, -50)
        root.add(road)

        // Lane markers
        var markerCount = 16
        var markers = []
        for (var i = 0; i < markerCount; i++) {
          var z = -i * 7 - 5
          var alpha = 1 - (i / markerCount)
          var geo = new THREE.PlaneGeometry(0.12, 2.5)
          var mat = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: alpha * 0.25 })
          trackTheme(mat, 'signal')
          var marker = new THREE.Mesh(geo, mat)
          marker.rotation.x = -Math.PI / 2.2
          marker.position.set(0, -1.95, z)
          marker.userData.baseZ = z
          root.add(marker)
          markers.push(marker)
        }

        // Side rails
        var railMat = new THREE.LineBasicMaterial({ color: pal().dim, transparent: true, opacity: 0.08 })
        trackTheme(railMat, 'dim')
        var railGeoL = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3, -1.9, 5), new THREE.Vector3(-3, -1.9, -70)])
        var railGeoR = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(3, -1.9, 5), new THREE.Vector3(3, -1.9, -70)])
        root.add(new THREE.Line(railGeoL, railMat))
        root.add(new THREE.Line(railGeoR, railMat))

        // Horizon glow
        var horizonCvs = document.createElement('canvas')
        horizonCvs.width = horizonCvs.height = 128
        var hctx = horizonCvs.getContext('2d')
        var hrd = hctx.createRadialGradient(64, 64, 0, 64, 64, 64)
        hrd.addColorStop(0, 'rgba(94,212,245,0.12)')
        hrd.addColorStop(0.6, 'rgba(94,212,245,0.03)')
        hrd.addColorStop(1, 'rgba(94,212,245,0)')
        hctx.fillStyle = hrd
        hctx.fillRect(0, 0, 128, 128)
        var horizon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(horizonCvs), transparent: true, opacity: 0.8 }))
        horizon.scale.set(12, 12, 1)
        horizon.position.set(0, -1.5, -68)
        root.add(horizon)

        scene.add(createDust('ion', 200, 40, 90))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          var hover = window.__col3d.hover

          // Markers flow toward camera
          markers.forEach(function (m) {
            m.position.z += 0.12 + hover * 0.08
            if (m.position.z > 8) m.position.z = -m.userData.baseZ - markerCount * 2
            var a = Math.max(0, 1 - Math.abs(m.position.z + 5) / 70)
            m.material.opacity = a * 0.25
          })

          roadMat.opacity = 0.05 + Math.sin(t * 0.5) * 0.015 + hover * 0.04
          horizon.material.opacity = 0.6 + Math.sin(t * 0.7) * 0.15 + hover * 0.2
          horizon.scale.set(12 + Math.sin(t * 0.7) * 1, 12 + Math.sin(t * 0.7) * 1, 1)

          // Steering
          root.rotation.y = mouseX * 0.04
          root.rotation.z = -mouseX * 0.008
          root.rotation.x = 0.02 + mouseY * 0.015
        }
      },


      // ── SOLAR: Simple sphere + glow ──
      solar: function () {
        camera.position.set(0, 0, 35)
        cameraCurrent.z = 35
        cameraTarget.z = 35

        var root = new THREE.Group()
        scene.add(root)

        var geo = new THREE.IcosahedronGeometry(3, 2)
        var mat = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.15 })
        trackTheme(mat, 'signal')
        var mesh = new THREE.Mesh(geo, mat)
        root.add(mesh)

        var coreMat = new THREE.MeshBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.6 })
        trackTheme(coreMat, 'signal')
        var core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 2), coreMat)
        root.add(core)

        scene.add(createDust('signal', 200, 40, 80))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          mesh.rotation.y = t * 0.08
          mesh.scale.set(1 + Math.sin(t * 0.5) * 0.03, 1 + Math.sin(t * 0.5) * 0.03, 1 + Math.sin(t * 0.5) * 0.03)
          core.rotation.y = -t * 0.1
          core.rotation.x = t * 0.05
          root.rotation.y += (mouseX * 0.06 - root.rotation.y) * 0.02
          root.rotation.x += (mouseY * 0.03 - root.rotation.x) * 0.02
        }
      },

      // ── GESTURE: Sine wave ribbon ──
      gesture: function () {
        camera.position.set(0, 0, 35)
        cameraCurrent.z = 35
        cameraTarget.z = 35

        var root = new THREE.Group()
        scene.add(root)

        var waveGeo = new THREE.PlaneGeometry(40, 6, 60, 8)
        waveGeo.rotateX(-Math.PI / 2)
        var wMat = new THREE.MeshBasicMaterial({ color: pal().plasma, transparent: true, opacity: 0.1, wireframe: true })
        trackTheme(wMat, 'plasma')
        var wave = new THREE.Mesh(waveGeo, wMat)
        wave.position.y = -3
        root.add(wave)

        var origY = []
        var posAtt = waveGeo.attributes.position
        for (var k = 0; k < posAtt.count; k++) origY.push(posAtt.getY(k))

        scene.add(createDust('plasma', 200, 40, 80))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          for (var i = 0; i < posAtt.count; i++) {
            var x = posAtt.getX(i), z = posAtt.getZ(i)
            posAtt.setY(i, origY[i] + Math.sin(t * 1.2 + x * 0.15) * 1.5 + Math.cos(t * 0.8 + z * 0.1) * 0.8)
          }
          posAtt.needsUpdate = true
          root.rotation.y += (mouseX * 0.05 - root.rotation.y) * 0.01
        }
      },

      // ── RPG: Crystal ──
      rpg: function () {
        camera.position.set(0, 0, 35)
        cameraCurrent.z = 35
        cameraTarget.z = 35

        var root = new THREE.Group()
        scene.add(root)

        var geo = new THREE.OctahedronGeometry(2.5, 0)
        var cMat = new THREE.MeshBasicMaterial({ color: pal().em, wireframe: true, transparent: true, opacity: 0.3 })
        trackTheme(cMat, 'em')
        var crystal = new THREE.Mesh(geo, cMat)
        root.add(crystal)

        var cCoreMat = new THREE.MeshBasicMaterial({ color: pal().em, transparent: true, opacity: 0.4 })
        trackTheme(cCoreMat, 'em')
        var cCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), cCoreMat)
        root.add(cCore)

        scene.add(createDust('em', 200, 40, 80))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          crystal.rotation.y = t * 0.06
          crystal.rotation.x = t * 0.03
          cCore.rotation.y = -t * 0.1
          root.rotation.y += (mouseX * 0.06 - root.rotation.y) * 0.02
          root.rotation.x += (mouseY * 0.03 - root.rotation.x) * 0.02
        }
      },

      // ── QR: Sparse grid ──
      qr: function () {
        camera.position.set(0, 0, 35)
        cameraCurrent.z = 35
        cameraTarget.z = 35

        var root = new THREE.Group()
        scene.add(root)

        var cells = []
        var gridMat = new THREE.MeshBasicMaterial({ color: pal().signal, wireframe: true, transparent: true, opacity: 0.08 })
        trackTheme(gridMat, 'signal')
        for (var gx = -3; gx <= 3; gx++) {
          for (var gz = -2; gz <= 2; gz++) {
            if (Math.random() < 0.4) continue
            var cell = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), gridMat)
            cell.position.set(gx * 2.5, -5, gz * 2.5)
            cell.userData.dist = Math.sqrt(gx * gx + gz * gz)
            root.add(cell)
            cells.push(cell)
          }
        }

        scene.add(createDust('signal', 200, 40, 80))

        applyTheme()
        new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

        return function (t) {
          cells.forEach(function (c) {
            c.rotation.z += 0.002
            c.material.opacity = 0.05 + Math.sin(t * 1.5 - c.userData.dist * 0.3) * 0.06
          })
          root.rotation.y += (mouseX * 0.04 - root.rotation.y) * 0.01
        }
      },


      // ── STATIC PAGES: Minimal atmospheric ──
      privacy: function () { return makeMinimal('teal') },
      terms:   function () { return makeMinimal('dim') },
      feedback:function () { return makeMinimal('signal') },
      career:  function () { return makeMinimal('plasma') },
      database_logic: function () { return makeMinimal('teal') },
      download: function () { return makeMinimal('signal') },
      sitemap: function () { return makeMinimal('dim') },
      admin:   function () { return makeMinimal('ion') },

      // ── SNEH-ASHA: handled by its own page ──
      'sneh-asha': null,
      sneh_asha: null
    }

    // ─── Helper: minimal atmospheric scene ───
    function makeMinimal(colorKey) {
      camera.position.set(0, 0, 40)
      cameraCurrent.z = 40
      cameraTarget.z = 40

      var root = new THREE.Group()
      scene.add(root)

      var geo = new THREE.SphereGeometry(4, 24, 24)
      var mat = new THREE.MeshBasicMaterial({ color: pal()[colorKey], wireframe: true, transparent: true, opacity: 0.06 })
      trackTheme(mat, colorKey)
      var sphere = new THREE.Mesh(geo, mat)
      root.add(sphere)

      scene.add(createDust(colorKey, 300, 50, 100))

      applyTheme()
      new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })

      return function (t) {
        sphere.rotation.y = t * 0.03
        sphere.rotation.x = t * 0.02
        root.rotation.y += (mouseX * 0.03 - root.rotation.y) * 0.01
      }
    }

    // ─── Resolve scene ───
    var builder = builders[path] || builders[path.replace('-', '_')] || builders[path.replace('_', '-')]
    if (!builder && path.indexOf('database') >= 0) builder = builders.database_logic
    if (!builder && path.indexOf('career') >= 0) builder = builders.career
    if (!builder) builder = builders.privacy
    if (builder === null) return

    applyTheme()
    var updateFn = builder()

    // ─── Fade in ───
    canvas.style.opacity = '0'
    canvas.style.transition = 'opacity 1.8s cubic-bezier(0.16,1,0.3,1)'
    setTimeout(function () { canvas.style.opacity = '1'; if (canvas.classList) canvas.classList.add('v') }, 120)

    // ─── Animation loop ───
    var clock = new THREE.Clock()
    var FRAME_MS = 1000 / 30
    var lastFrame = 0

    function animate(now) {
      requestAnimationFrame(animate)
      if (!visible) return
      var elapsed = now - lastFrame
      if (elapsed < FRAME_MS) return
      lastFrame = now - (elapsed % FRAME_MS)
      mouseX = _pmx
      mouseY = _pmy
      _hoverCurrent += (_hoverTarget - _hoverCurrent) * 0.05
      var t = clock.getElapsedTime()
      if (updateFn) updateFn(t)
      renderer.render(scene, camera)
    }
    animate(0)
  }
})()

