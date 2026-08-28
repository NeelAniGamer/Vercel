// col-3d.js — Interactive 3D Worlds for Class Of Learners
// Philosophy: The 3D scene IS the interface. Click, drag, explore.
// Not background decoration — navigable space.

;(function () {
  'use strict'

  // Guard: mobile, touch, reduced-motion
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 960) return
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

    // ─── Renderer ───
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    canvas.style.willChange = 'transform'

    var scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x070a14, 0.003)

    var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500)
    camera.position.set(0, 0, 60)

    // ─── Input State & Physics ───
    var mouseX = 0, mouseY = 0
    var _pmx = 0, _pmy = 0
    var mouseDown = false
    var dragStartX = 0, dragStartY = 0
    var dragVelX = 0, dragVelY = 0
    var raycaster = new THREE.Raycaster()
    var mouseVec = new THREE.Vector2()
    var currentHovered = null
    var cameraTarget = { x: 0, y: 0, z: 60, rotY: 0, rotX: 0 }
    var cameraCurrent = { x: 0, y: 0, z: 60, rotY: 0, rotX: 0 }

    document.addEventListener('mousemove', function (e) {
      _pmx = (e.clientX / window.innerWidth) * 2 - 1
      _pmy = -(e.clientY / window.innerHeight) * 2 + 1
      mouseVec.set(_pmx, _pmy)
      if (mouseDown) {
        var dx = e.clientX - dragStartX
        var dy = e.clientY - dragStartY
        dragVelX = dx * 0.004
        dragVelY = dy * 0.0025
        cameraTarget.rotY += dragVelX
        cameraTarget.rotX = Math.max(-0.55, Math.min(0.55, cameraTarget.rotX + dragVelY))
        dragStartX = e.clientX
        dragStartY = e.clientY
      }
    }, { passive: true })

    document.addEventListener('mousedown', function (e) {
      if (e.target.closest('a, button, input, .pc, .nav-link')) return
      mouseDown = true
      dragStartX = e.clientX
      dragStartY = e.clientY
      dragVelX = 0; dragVelY = 0
      canvas.style.cursor = 'grabbing'
    })

    document.addEventListener('mouseup', function () {
      mouseDown = false
      canvas.style.cursor = 'grab'
    })

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
      dark:  { signal:0xf2b84b, ion:0x5ed4f5, teal:0x00f0cc, plasma:0xb89bff, em:0x34d399, dim:0x8891aa, void:0x070a14 },
      light: { signal:0xb8720a, ion:0x0077b6, teal:0x009b8d, plasma:0x6f4fe0, em:0x0a7c55, dim:0x6b7399, void:0xf3f2eb }
    }
    function pal() { return document.body.classList.contains('lm') ? PAL.light : PAL.dark }

    var _themeTargets = []
    function trackTheme(mat, key) { _themeTargets.push({ mat: mat, key: key }); return mat }
    function applyTheme() {
      var p = pal(), lm = document.body.classList.contains('lm')
      _themeTargets.forEach(function (t) { t.mat.color.setHex(p[t.key]) })
      scene.fog.color.setHex(lm ? PAL.light.void : PAL.dark.void)
      canvas.style.opacity = lm ? 0.6 : 1
    }

    // ─── Click handler ───
    var clickables = []
    var onClickCallback = null

    canvas.addEventListener('click', function (e) {
      if (mouseDown) return
      mouseVec.set(_pmx, _pmy)
      raycaster.setFromCamera(mouseVec, camera)
      var hits = raycaster.intersectObjects(clickables, true)
      if (hits.length > 0) {
        var obj = hits[0].object
        while (obj && !obj.userData.clickable && obj.parent) obj = obj.parent
        if (obj && obj.userData.clickable && onClickCallback) onClickCallback(obj.userData.payload)
      }
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
        if (found && found.userData.onHover) found.userData.onHover()
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
        cameraTarget.x = 0; cameraTarget.y = 0; cameraTarget.z = 60
        cameraTarget.rotY = 0; cameraTarget.rotX = 0
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

      // ── HOME: Interactive Orrery ──
      // Six orbiting project nodes. Drag to rotate. Click to navigate.
      home: function () {
        camera.position.set(0, 8, 50)
        cameraCurrent.z = 50
        cameraTarget.z = 50

        var root = new THREE.Group()
        scene.add(root)

        // Central core
        var coreGeo = new THREE.IcosahedronGeometry(2.2, 3)
        var coreMat = new THREE.MeshBasicMaterial({ color: pal().signal })
        trackTheme(coreMat, 'signal')
        var core = new THREE.Mesh(coreGeo, coreMat)
        root.add(core)

        // Outer faceted wireframe core cage
        var cageGeo = new THREE.IcosahedronGeometry(3.6, 1)
        var cageMat = new THREE.MeshBasicMaterial({ color: pal().signal, wireframe: true, transparent: true, opacity: 0.28 })
        trackTheme(cageMat, 'signal')
        var cage = new THREE.Mesh(cageGeo, cageMat)
        root.add(cage)

        // Core glow
        var glowCvs = document.createElement('canvas')
        glowCvs.width = glowCvs.height = 256
        var gctx = glowCvs.getContext('2d')
        var grd = gctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        grd.addColorStop(0, 'rgba(255,255,255,0.9)')
        grd.addColorStop(0.2, 'rgba(242,184,75,0.55)')
        grd.addColorStop(0.5, 'rgba(242,184,75,0.12)')
        grd.addColorStop(1, 'rgba(242,184,75,0)')
        gctx.fillStyle = grd
        gctx.fillRect(0, 0, 256, 256)
        var glowTex = new THREE.CanvasTexture(glowCvs)
        var glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.65 })
        var glow = new THREE.Sprite(glowMat)
        glow.scale.set(18, 18, 1)
        root.add(glow)

        // Energy connecting beams
        var beamMat = new THREE.LineBasicMaterial({ color: pal().signal, transparent: true, opacity: 0.12 })
        trackTheme(beamMat, 'signal')
        var beamPositions = new Float32Array(6 * 2 * 3)
        var beamGeo = new THREE.BufferGeometry()
        beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3))
        var beams = new THREE.LineSegments(beamGeo, beamMat)
        root.add(beams)

        // Six project nodes
        var projectNodes = [
          { name: 'ATI',     key: 'ion',    radius: 14, speed: 0.15,  page: 'ati',           y: 0 },
          { name: 'Traffic', key: 'signal', radius: 20, speed: -0.1,  page: 'Traffic/Driving', y: 1.5 },
          { name: 'Solar',   key: 'teal',   radius: 26, speed: 0.08,  page: 'solar',         y: -1 },
          { name: 'Gesture', key: 'plasma', radius: 17, speed: -0.12, page: 'gesture',       y: 2 },
          { name: 'RPG',     key: 'em',     radius: 23, speed: 0.09,  page: 'rpg',           y: -2 },
          { name: 'QR',      key: 'dim',    radius: 30, speed: -0.07, page: 'qr',            y: 0.5 }
        ]

        var nodeObjects = []
        var whiteHex = 0xffffff

        projectNodes.forEach(function (p, i) {
          var angle = (i / projectNodes.length) * Math.PI * 2

          // Orbit ring
          var orbitGeo = new THREE.TorusGeometry(p.radius, 0.025, 6, 120)
          var orbitMat = new THREE.MeshBasicMaterial({ color: pal()[p.key], transparent: true, opacity: 0.12 })
          trackTheme(orbitMat, p.key)
          var orbit = new THREE.Mesh(orbitGeo, orbitMat)
          orbit.rotation.x = Math.PI * 0.5
          orbit.position.y = p.y
          root.add(orbit)

          // Planet body
          var planetSize = 1.1
          if (p.key === 'signal') planetSize = 1.5
          if (p.key === 'ion') planetSize = 1.3
          var planetGeo = new THREE.IcosahedronGeometry(planetSize, 2)
          var planetMat = new THREE.MeshBasicMaterial({ color: pal()[p.key] })
          trackTheme(planetMat, p.key)
          var planet = new THREE.Mesh(planetGeo, planetMat)
          planet.position.set(Math.cos(angle) * p.radius, p.y, Math.sin(angle) * p.radius)
          root.add(planet)

          // Planet nested orbital ring
          var pRingGeo = new THREE.TorusGeometry(planetSize * 1.6, 0.02, 4, 32)
          var pRingMat = new THREE.MeshBasicMaterial({ color: pal()[p.key], transparent: true, opacity: 0.35 })
          trackTheme(pRingMat, p.key)
          var pRing = new THREE.Mesh(pRingGeo, pRingMat)
          pRing.rotation.x = Math.PI * 0.3
          planet.add(pRing)

          // Planet glow sprite
          var pGlowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.45 })
          var pGlow = new THREE.Sprite(pGlowMat)
          pGlow.scale.set(planetSize * 5.5, planetSize * 5.5, 1)
          pGlow.position.copy(planet.position)
          root.add(pGlow)

          // Clickable
          window.__col3d.registerClickable(planet, p.page,
            function () {
              planetMat.color.setHex(whiteHex)
              pGlowMat.opacity = 0.85
              planet.scale.set(1.4, 1.4, 1.4)
              var tip = document.getElementById('ntip')
              if (tip) {
                document.getElementById('ntip-dot').style.background = 'var(--' + p.key + ')'
                document.getElementById('ntip-name').textContent = p.name
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

          nodeObjects.push({ data: p, planet: planet, glow: pGlow, glowMat: pGlowMat, orbit: orbit, angle: angle, mat: planetMat, ring: pRing })
        })

        // Multi-layered starfield
        scene.add(createDust('dim', 400, 40, 180))
        scene.add(createDust('signal', 120, 25, 110))
        scene.add(createDust('ion', 100, 30, 130))

        // Click handler -> navigate
        window.__col3d.onClick(function (page) {
          var target = nodeObjects.find(function (n) { return n.data.page === page })
          if (target) {
            target.mat.color.setHex(whiteHex)
            target.planet.scale.set(2, 2, 2)
            setTimeout(function () { window.location.href = page }, 300)
          } else {
            window.location.href = page
          }
        })

        // Sync card hover
        document.querySelectorAll('.pc').forEach(function (card) {
          card.addEventListener('mouseenter', function () { _hoverTarget = 1 })
          card.addEventListener('mouseleave', function () { _hoverTarget = 0 })
        })

        // Tooltip positioning
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
          // Update energy beams & planets
          var bPos = beamGeo.attributes.position.array
          nodeObjects.forEach(function (n, idx) {
            n.angle += n.data.speed * 0.01
            n.planet.position.x = Math.cos(n.angle) * n.data.radius
            n.planet.position.z = Math.sin(n.angle) * n.data.radius
            n.planet.position.y = n.data.y + Math.sin(t * 0.5 + n.data.radius) * 0.35
            n.glow.position.copy(n.planet.position)
            n.planet.rotation.y = t * 0.2
            n.planet.rotation.x = t * 0.1
            n.ring.rotation.z = t * 0.4

            // Beam from core to planet
            var bIdx = idx * 6
            bPos[bIdx] = 0; bPos[bIdx+1] = 0; bPos[bIdx+2] = 0
            bPos[bIdx+3] = n.planet.position.x; bPos[bIdx+4] = n.planet.position.y; bPos[bIdx+5] = n.planet.position.z
          })
          beamGeo.attributes.position.needsUpdate = true

          // Core & cage breathing
          var breathe = 1 + Math.sin(t * 0.8) * 0.05
          core.scale.set(breathe, breathe, breathe)
          core.rotation.y = t * 0.06
          cage.scale.set(1 + Math.sin(t * 0.5) * 0.03, 1 + Math.sin(t * 0.5) * 0.03, 1 + Math.sin(t * 0.5) * 0.03)
          cage.rotation.y = -t * 0.08
          cage.rotation.x = t * 0.04
          glow.scale.set(18 + Math.sin(t * 0.8) * 2.5, 18 + Math.sin(t * 0.8) * 2.5, 1)

          // Drag inertia & auto orbit
          if (!mouseDown) {
            dragVelX *= 0.93
            dragVelY *= 0.93
            cameraTarget.rotY += dragVelX + 0.0003
            cameraTarget.rotX = Math.max(-0.55, Math.min(0.55, cameraTarget.rotX + dragVelY))
          }
          cameraTarget.rotX += (_pmy * 0.12 - cameraTarget.rotX) * 0.008

          // Hover from HTML cards
          var hover = window.__col3d.hover
          nodeObjects.forEach(function (n) {
            if (n.planet !== currentHovered) {
              var targetScale = 1 + hover * 0.18
              n.planet.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05)
            }
          })

          // Scroll: dolly out as user reads
          var maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1
          var scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll))
          cameraTarget.z = 50 + scrollProgress * 20

          // Camera easing
          cameraCurrent.rotY += (cameraTarget.rotY - cameraCurrent.rotY) * 0.04
          cameraCurrent.rotX += (cameraTarget.rotX - cameraCurrent.rotX) * 0.04
          cameraCurrent.z += (cameraTarget.z - cameraCurrent.z) * 0.04
          root.rotation.y = cameraCurrent.rotY
          root.rotation.x = cameraCurrent.rotX

          // Hover detection every few frames
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

