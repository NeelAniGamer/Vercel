// col-3d.js — Shared Procedural Three.js Backgrounds for Class Of Learners
// Desktop only. No external models. Each page gets a unique scene.

;(function () {
  'use strict'

  // Skip on mobile/touch devices for performance, and respect reduced-motion preference
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 960) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Wait for Three.js to load
  function waitForThree(cb) {
    if (typeof THREE !== 'undefined') {
      cb()
      return
    }
    var checks = 0
    var interval = setInterval(function () {
      checks++
      if (typeof THREE !== 'undefined') {
        clearInterval(interval)
        cb()
      }
      if (checks > 50) clearInterval(interval) // give up after 5s
    }, 100)
  }

  waitForThree(function () {
    // Find the canvas
    var canvas =
      document.getElementById('orrery') ||
      document.getElementById('constellation') ||
      document.getElementById('cosmos') ||
      document.getElementById('bgCanvas') ||
      document.getElementById('schoolBg') ||
      document.getElementById('webgl-canvas')

    if (!canvas) return

    // Determine which page we're on
    var path = window.location.pathname.split('/').pop() || 'home'
    path = path.replace('.html', '').toLowerCase()
    // Map index to home
    if (path === '' || path === 'index' || path === 'home') path = 'home'

    // Setup renderer — antialias off for perf (barely visible on canvas-over-scene)
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    // Cap pixel ratio at 1.5 — above that provides diminishing returns at high GPU cost
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    // Hint the browser that this canvas composites independently
    canvas.style.willChange = 'transform'

    var scene = new THREE.Scene()
    // Fog gives distant particles/shapes a sense of depth instead of all rendering at full brightness
    scene.fog = new THREE.FogExp2(0x070a14, 0.0055)
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.z = 50

    // Pause rendering while the tab isn't visible to save battery/GPU
    var isVisible = true
    document.addEventListener('visibilitychange', function () {
      isVisible = !document.hidden
    })

    // Mouse tracking for parallax — throttled to 1 update per rAF to avoid
    // queueing heavy work on every pixel of mouse movement
    var mouseX = 0,
      mouseY = 0,
      _pendingMX = 0,
      _pendingMY = 0
    document.addEventListener('mousemove', function (e) {
      _pendingMX = (e.clientX / window.innerWidth) * 2 - 1
      _pendingMY = -(e.clientY / window.innerHeight) * 2 + 1
    }, { passive: true })

    // Resize handler
    window.addEventListener('resize', function () {
      if (window.innerWidth < 960) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })

    // Color palette from CoL design system
    var COL = {
      signal: 0xf2b84b,
      ion: 0x5ed4f5,
      teal: 0x00f0cc,
      plasma: 0xb89bff,
      em: 0x34d399,
      dim: 0x8891aa,
      void2: 0x0c1224
    }

    // ==================== SCENE BUILDERS ====================

    var scenes = {
      // HOME — Orbital Orrery (rings of particles orbiting a glowing center)
      home: function () {
        camera.position.set(0, 5, 60)
        var group = new THREE.Group()

        // Central glow
        var centerGeo = new THREE.SphereGeometry(1.2, 32, 32)
        var centerMat = new THREE.MeshBasicMaterial({ color: COL.signal, transparent: true, opacity: 0.9 })
        var center = new THREE.Mesh(centerGeo, centerMat)
        group.add(center)

        // Glow sprite
        var glowCanvas = document.createElement('canvas')
        glowCanvas.width = 128
        glowCanvas.height = 128
        var gCtx = glowCanvas.getContext('2d')
        var grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
        grad.addColorStop(0, 'rgba(242, 184, 75, 0.6)')
        grad.addColorStop(0.4, 'rgba(242, 184, 75, 0.15)')
        grad.addColorStop(1, 'rgba(242, 184, 75, 0)')
        gCtx.fillStyle = grad
        gCtx.fillRect(0, 0, 128, 128)
        var glowSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(glowCanvas),
            transparent: true,
            blending: THREE.AdditiveBlending
          })
        )
        glowSprite.scale.set(12, 12, 1)
        group.add(glowSprite)

        // Orbital rings of particles
        var rings = [
          { radius: 12, count: 60, color: COL.ion, size: 0.3, speed: 0.008 },
          { radius: 20, count: 80, color: COL.teal, size: 0.25, speed: -0.005 },
          { radius: 30, count: 100, color: COL.plasma, size: 0.2, speed: 0.003 },
          { radius: 42, count: 120, color: COL.dim, size: 0.15, speed: -0.002 }
        ]

        var ringGroups = []
        rings.forEach(function (r) {
          var positions = new Float32Array(r.count * 3)
          for (var i = 0; i < r.count; i++) {
            var angle = (i / r.count) * Math.PI * 2
            var jitter = (Math.random() - 0.5) * 2
            positions[i * 3] = Math.cos(angle) * (r.radius + jitter)
            positions[i * 3 + 1] = (Math.random() - 0.5) * 3
            positions[i * 3 + 2] = Math.sin(angle) * (r.radius + jitter)
          }
          var geo = new THREE.BufferGeometry()
          geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          var mat = new THREE.PointsMaterial({ color: r.color, size: r.size, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
          var points = new THREE.Points(geo, mat)
          group.add(points)
          ringGroups.push({ points: points, speed: r.speed })
        })

        // Thin orbit lines
        rings.forEach(function (r) {
          var linePoints = []
          for (var i = 0; i <= 128; i++) {
            var angle = (i / 128) * Math.PI * 2
            linePoints.push(new THREE.Vector3(Math.cos(angle) * r.radius, 0, Math.sin(angle) * r.radius))
          }
          var lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
          var lineMat = new THREE.LineBasicMaterial({ color: r.color, transparent: true, opacity: 0.08 })
          group.add(new THREE.Line(lineGeo, lineMat))
        })

        group.rotation.x = 0.5
        scene.add(group)

        return function (time) {
          ringGroups.forEach(function (rg) {
            rg.points.rotation.y += rg.speed
          })
          center.material.opacity = 0.7 + Math.sin(time * 2) * 0.2
          group.rotation.y += (mouseX * 0.3 - group.rotation.y) * 0.02
          group.rotation.x = 0.5 + (mouseY * 0.15 - (group.rotation.x - 0.5)) * 0.02
        }
      },

      // ABOUT — Constellation Network (nodes connected by lines)
      about: function () {
        camera.position.set(0, 0, 80)
        var group = new THREE.Group()
        var nodeCount = 60
        var nodes = []

        for (var i = 0; i < nodeCount; i++) {
          var geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 8)
          var colors = [COL.signal, COL.ion, COL.teal, COL.plasma, COL.em]
          var color = colors[Math.floor(Math.random() * colors.length)]
          var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 })
          var mesh = new THREE.Mesh(geo, mat)
          mesh.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40)
          mesh.userData = {
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.01),
            baseColor: color
          }
          group.add(mesh)
          nodes.push(mesh)
        }

        // Connection lines
        var lineMat = new THREE.LineBasicMaterial({ color: COL.ion, transparent: true, opacity: 0.06 })
        var lineGroup = new THREE.Group()
        group.add(lineGroup)

        scene.add(group)

        // Pre-allocate a pool of line geometries to avoid per-frame GC allocation.
        // We create the max possible connections (n*(n-1)/2) and hide unused ones.
        var maxLines = (nodeCount * (nodeCount - 1)) / 2
        var linePool = []
        for (var li = 0; li < maxLines; li++) {
          var lposArr = new Float32Array(6) // 2 points * 3 components
          var lgeo = new THREE.BufferGeometry()
          lgeo.setAttribute('position', new THREE.BufferAttribute(lposArr, 3))
          var lmesh = new THREE.Line(lgeo, lineMat)
          lmesh.visible = false
          lineGroup.add(lmesh)
          linePool.push({ mesh: lmesh, pos: lposArr })
        }

        var _lineTick = 0
        return function (time) {
          // Move nodes
          nodes.forEach(function (n) {
            n.position.add(n.userData.vel)
            if (Math.abs(n.position.x) > 55) n.userData.vel.x *= -1
            if (Math.abs(n.position.y) > 35) n.userData.vel.y *= -1
            if (Math.abs(n.position.z) > 25) n.userData.vel.z *= -1
          })

          // Update connections every 45 frames using pre-allocated pool (no GC)
          _lineTick++
          if (_lineTick % 45 === 0) {
            var idx = 0
            for (var i = 0; i < nodes.length; i++) {
              for (var j = i + 1; j < nodes.length; j++) {
                var dist = nodes[i].position.distanceTo(nodes[j].position)
                if (dist < 20 && idx < linePool.length) {
                  var entry = linePool[idx++]
                  var pa = nodes[i].position, pb = nodes[j].position
                  entry.pos[0] = pa.x; entry.pos[1] = pa.y; entry.pos[2] = pa.z
                  entry.pos[3] = pb.x; entry.pos[4] = pb.y; entry.pos[5] = pb.z
                  entry.mesh.geometry.attributes.position.needsUpdate = true
                  entry.mesh.visible = true
                }
              }
            }
            // Hide unused pool entries
            for (; idx < linePool.length; idx++) linePool[idx].mesh.visible = false
          }

          group.rotation.y += (mouseX * 0.15 - group.rotation.y) * 0.01
          group.rotation.x += (mouseY * 0.08 - group.rotation.x) * 0.01
        }
      },

      // SCHOOL — Floating Geometric Knowledge
      school: function () {
        camera.position.set(0, 0, 60)
        var group = new THREE.Group()
        var shapes = []
        var geometries = [
          new THREE.IcosahedronGeometry(2, 0),
          new THREE.OctahedronGeometry(2, 0),
          new THREE.TetrahedronGeometry(2, 0),
          new THREE.DodecahedronGeometry(1.5, 0),
          new THREE.TorusGeometry(1.5, 0.4, 8, 12)
        ]
        var colors = [COL.ion, COL.signal, COL.teal, COL.plasma, COL.em]

        for (var i = 0; i < 25; i++) {
          var geoIdx = i % geometries.length
          var wireMat = new THREE.MeshBasicMaterial({ color: colors[geoIdx], wireframe: true, transparent: true, opacity: 0.35 })
          var mesh = new THREE.Mesh(geometries[geoIdx].clone(), wireMat)
          mesh.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30 - 10)
          mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
          var s = 0.5 + Math.random() * 1.5
          mesh.scale.set(s, s, s)
          mesh.userData = {
            rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.005),
            floatSpeed: 0.3 + Math.random() * 0.5,
            floatOffset: Math.random() * Math.PI * 2
          }
          group.add(mesh)
          shapes.push(mesh)
        }

        scene.add(group)

        return function (time) {
          shapes.forEach(function (s) {
            s.rotation.x += s.userData.rotSpeed.x
            s.rotation.y += s.userData.rotSpeed.y
            s.position.y += Math.sin(time * s.userData.floatSpeed + s.userData.floatOffset) * 0.02
          })
          group.rotation.y += (mouseX * 0.2 - group.rotation.y) * 0.015
          group.rotation.x += (mouseY * 0.1 - group.rotation.x) * 0.015
        }
      },

      // CAREER — Deep Space / Cosmos
      career: function () {
        camera.position.set(0, 0, 50)
        var group = new THREE.Group()

        // Star field
        var starCount = 2000
        var starPos = new Float32Array(starCount * 3)
        var starColors = new Float32Array(starCount * 3)
        for (var i = 0; i < starCount; i++) {
          starPos[i * 3] = (Math.random() - 0.5) * 200
          starPos[i * 3 + 1] = (Math.random() - 0.5) * 200
          starPos[i * 3 + 2] = (Math.random() - 0.5) * 200
          var c = new THREE.Color([COL.ion, COL.signal, COL.plasma, 0xffffff][Math.floor(Math.random() * 4)])
          starColors[i * 3] = c.r
          starColors[i * 3 + 1] = c.g
          starColors[i * 3 + 2] = c.b
        }
        var starGeo = new THREE.BufferGeometry()
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
        group.add(
          new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({
              size: 0.3,
              vertexColors: true,
              transparent: true,
              opacity: 0.8,
              blending: THREE.AdditiveBlending
            })
          )
        )

        // Nebula sprites
        for (var j = 0; j < 5; j++) {
          var nc = document.createElement('canvas')
          nc.width = 128
          nc.height = 128
          var nctx = nc.getContext('2d')
          var nebulaColors = ['rgba(184,155,255,', 'rgba(94,212,245,', 'rgba(242,184,75,', 'rgba(0,240,204,', 'rgba(52,211,153,']
          var ng = nctx.createRadialGradient(64, 64, 0, 64, 64, 64)
          ng.addColorStop(0, nebulaColors[j] + '0.15)')
          ng.addColorStop(0.5, nebulaColors[j] + '0.05)')
          ng.addColorStop(1, nebulaColors[j] + '0)')
          nctx.fillStyle = ng
          nctx.fillRect(0, 0, 128, 128)
          var sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: new THREE.CanvasTexture(nc),
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false
            })
          )
          sprite.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, -30 - Math.random() * 30)
          sprite.scale.set(40 + Math.random() * 30, 40 + Math.random() * 30, 1)
          group.add(sprite)
        }

        scene.add(group)

        return function (time) {
          group.rotation.y += 0.0003
          group.rotation.x += (mouseY * 0.08 - group.rotation.x) * 0.01
          group.rotation.y += mouseX * 0.08 * 0.005
        }
      },

      // DATABASE_LOGIC — Data Grid / Network Topology
      database_logic: function () {
        camera.position.set(0, 15, 45)
        camera.lookAt(0, 0, 0)
        var group = new THREE.Group()

        // Grid
        var gridHelper = new THREE.GridHelper(80, 40, COL.teal, 0x0a1420)
        gridHelper.material.transparent = true
        gridHelper.material.opacity = 0.15
        group.add(gridHelper)

        // Data nodes (cylinders)
        var dataNodes = []
        for (var i = 0; i < 30; i++) {
          var h = 1 + Math.random() * 6
          var geo = new THREE.CylinderGeometry(0.4, 0.4, h, 8)
          var mat = new THREE.MeshBasicMaterial({
            color: [COL.teal, COL.ion, COL.em][Math.floor(Math.random() * 3)],
            transparent: true,
            opacity: 0.5,
            wireframe: Math.random() > 0.5
          })
          var cyl = new THREE.Mesh(geo, mat)
          cyl.position.set((Math.random() - 0.5) * 60, h / 2, (Math.random() - 0.5) * 60)
          cyl.userData = { targetH: h, baseY: 0, pulseSpeed: 0.5 + Math.random() * 2, pulseOffset: Math.random() * Math.PI * 2 }
          group.add(cyl)
          dataNodes.push(cyl)
        }

        // Connection lines between nearby nodes
        var connMat = new THREE.LineBasicMaterial({ color: COL.ion, transparent: true, opacity: 0.08 })
        for (var a = 0; a < dataNodes.length; a++) {
          for (var b = a + 1; b < dataNodes.length; b++) {
            if (dataNodes[a].position.distanceTo(dataNodes[b].position) < 18) {
              var pts = [dataNodes[a].position.clone(), dataNodes[b].position.clone()]
              pts[0].y = 0
              pts[1].y = 0
              group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), connMat))
            }
          }
        }

        scene.add(group)

        return function (time) {
          dataNodes.forEach(function (n) {
            var pulse = Math.sin(time * n.userData.pulseSpeed + n.userData.pulseOffset)
            var newH = n.userData.targetH * (0.5 + pulse * 0.5)
            n.scale.y = Math.max(0.1, newH / n.userData.targetH)
            n.material.opacity = 0.3 + pulse * 0.3
          })
          group.rotation.y += (mouseX * 0.2 - group.rotation.y) * 0.01
        }
      },

      // PRIVACY — Shield Hex Grid
      privacy: function () {
        camera.position.set(0, 0, 50)
        var group = new THREE.Group()

        // Hexagonal grid
        var hexSize = 3
        var cols = 12,
          rows = 10
        var hexes = []
        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            var x = col * hexSize * 1.75 - (cols * hexSize * 1.75) / 2
            var y = row * hexSize * 1.55 - (rows * hexSize * 1.55) / 2
            if (row % 2) x += hexSize * 0.875

            var shape = new THREE.Shape()
            for (var k = 0; k < 6; k++) {
              var angle = (Math.PI / 3) * k - Math.PI / 6
              var hx = Math.cos(angle) * hexSize * 0.85
              var hy = Math.sin(angle) * hexSize * 0.85
              if (k === 0) shape.moveTo(hx, hy)
              else shape.lineTo(hx, hy)
            }
            shape.closePath()

            var geo = new THREE.ShapeGeometry(shape)
            var mat = new THREE.MeshBasicMaterial({
              color: COL.teal,
              transparent: true,
              opacity: 0.03 + Math.random() * 0.04,
              side: THREE.DoubleSide
            })
            var hex = new THREE.Mesh(geo, mat)
            hex.position.set(x, y, 0)
            hex.userData = { pulseDelay: Math.random() * Math.PI * 2, baseOpacity: mat.opacity }
            group.add(hex)
            hexes.push(hex)

            // Edge lines
            var edgeGeo = new THREE.EdgesGeometry(geo)
            var edgeMat = new THREE.LineBasicMaterial({ color: COL.teal, transparent: true, opacity: 0.1 })
            var edges = new THREE.LineSegments(edgeGeo, edgeMat)
            edges.position.copy(hex.position)
            group.add(edges)
          }
        }

        // Shield icon (simple triangle outline)
        var shieldPts = [
          new THREE.Vector3(0, 8, 0.1),
          new THREE.Vector3(-6, 3, 0.1),
          new THREE.Vector3(-5, -4, 0.1),
          new THREE.Vector3(0, -7, 0.1),
          new THREE.Vector3(5, -4, 0.1),
          new THREE.Vector3(6, 3, 0.1),
          new THREE.Vector3(0, 8, 0.1)
        ]
        var shieldGeo = new THREE.BufferGeometry().setFromPoints(shieldPts)
        var shieldLine = new THREE.Line(shieldGeo, new THREE.LineBasicMaterial({ color: COL.em, transparent: true, opacity: 0.3 }))
        group.add(shieldLine)

        scene.add(group)

        return function (time) {
          hexes.forEach(function (h) {
            var pulse = Math.sin(time * 0.8 + h.userData.pulseDelay)
            h.material.opacity = h.userData.baseOpacity + pulse * 0.03
          })
          shieldLine.material.opacity = 0.2 + Math.sin(time * 1.5) * 0.15
          group.rotation.y += (mouseX * 0.08 - group.rotation.y) * 0.01
          group.rotation.x += (mouseY * 0.04 - group.rotation.x) * 0.01
        }
      },

      // TERMS — Matrix / Code Rain
      terms: function () {
        camera.position.set(0, 0, 50)
        var group = new THREE.Group()

        // Falling particle columns
        var columnCount = 25
        var particlesPerCol = 20
        var columns = []

        for (var c = 0; c < columnCount; c++) {
          var colX = (c - columnCount / 2) * 4
          var positions = new Float32Array(particlesPerCol * 3)
          var opacities = new Float32Array(particlesPerCol)
          for (var p = 0; p < particlesPerCol; p++) {
            positions[p * 3] = colX + (Math.random() - 0.5) * 0.5
            positions[p * 3 + 1] = (Math.random() - 0.5) * 80
            positions[p * 3 + 2] = (Math.random() - 0.5) * 20
            opacities[p] = Math.random()
          }
          var geo = new THREE.BufferGeometry()
          geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          var mat = new THREE.PointsMaterial({
            color: [COL.em, COL.teal, COL.ion][c % 3],
            size: 0.4,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
          })
          var points = new THREE.Points(geo, mat)
          points.userData = { speed: 0.1 + Math.random() * 0.15 }
          group.add(points)
          columns.push(points)
        }

        scene.add(group)

        return function (time) {
          columns.forEach(function (col) {
            var pos = col.geometry.attributes.position.array
            for (var i = 0; i < pos.length; i += 3) {
              pos[i + 1] -= col.userData.speed
              if (pos[i + 1] < -40) pos[i + 1] = 40
            }
            col.geometry.attributes.position.needsUpdate = true
          })
          group.rotation.y += (mouseX * 0.05 - group.rotation.y) * 0.01
        }
      },

      // FEEDBACK — Signal Waves / Communication Ripples
      feedback: function () {
        camera.position.set(0, 0, 60)
        var group = new THREE.Group()

        // Concentric rings
        var ringCount = 8
        var rings = []
        for (var i = 0; i < ringCount; i++) {
          var radius = 5 + i * 5
          var ringGeo = new THREE.RingGeometry(radius - 0.15, radius + 0.15, 64)
          var ringMat = new THREE.MeshBasicMaterial({
            color: [COL.signal, COL.ion][i % 2],
            transparent: true,
            opacity: 0.12 - i * 0.01,
            side: THREE.DoubleSide
          })
          var ring = new THREE.Mesh(ringGeo, ringMat)
          ring.userData = { baseRadius: radius, phase: i * 0.5 }
          group.add(ring)
          rings.push(ring)
        }

        // Floating signal dots
        var dotCount = 80
        var dotPositions = new Float32Array(dotCount * 3)
        for (var d = 0; d < dotCount; d++) {
          var angle = Math.random() * Math.PI * 2
          var dist = 5 + Math.random() * 40
          dotPositions[d * 3] = Math.cos(angle) * dist
          dotPositions[d * 3 + 1] = Math.sin(angle) * dist
          dotPositions[d * 3 + 2] = (Math.random() - 0.5) * 10
        }
        var dotGeo = new THREE.BufferGeometry()
        dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3))
        group.add(
          new THREE.Points(
            dotGeo,
            new THREE.PointsMaterial({
              color: COL.signal,
              size: 0.4,
              transparent: true,
              opacity: 0.5,
              blending: THREE.AdditiveBlending
            })
          )
        )

        scene.add(group)

        return function (time) {
          rings.forEach(function (r) {
            var pulse = Math.sin(time * 1.2 + r.userData.phase)
            var scale = 1 + pulse * 0.08
            r.scale.set(scale, scale, 1)
            r.material.opacity = (0.12 - rings.indexOf(r) * 0.01) * (0.6 + pulse * 0.4)
          })
          group.rotation.z += 0.001
          group.rotation.y += (mouseX * 0.1 - group.rotation.y) * 0.01
          group.rotation.x += (mouseY * 0.05 - group.rotation.x) * 0.01
        }
      },

      // SNEH-ASHA — skip (already has its own procedural 3D)
      'sneh-asha': null,
      sneh_asha: null
    }

    // Find the right scene
    var sceneBuilder = scenes[path] || scenes[path.replace('-', '_')] || scenes[path.replace('_', '-')]

    // For Database_Logic.html (path becomes "database_logic")
    if (!sceneBuilder && path.indexOf('database') >= 0) sceneBuilder = scenes.database_logic
    // For Career.html
    if (!sceneBuilder && path.indexOf('career') >= 0) sceneBuilder = scenes.career

    if (!sceneBuilder) {
      // Fallback: generic starfield for any unknown page
      sceneBuilder = scenes.career // reuse cosmos
    }

    if (sceneBuilder === null) return // explicitly null = page handles its own 3D

    var updateFn = sceneBuilder()

    // Fade in canvas
    var hasFadedIn = false
    canvas.style.opacity = '0'
    canvas.style.transition = 'opacity 1.5s ease'
    setTimeout(function () {
      hasFadedIn = true
      syncThemeOpacity()
    }, 100)
    if (canvas.classList) canvas.classList.add('v')

    // These scenes are tuned for the dark theme's neon palette — fade them down in light mode
    // instead of letting them render at full brightness against a light background.
    function syncThemeOpacity() {
      if (!hasFadedIn) return
      var isLight = document.body.classList.contains('lm')
      canvas.style.opacity = isLight ? '0.12' : '1'
    }
    new MutationObserver(syncThemeOpacity).observe(document.body, { attributes: true, attributeFilter: ['class'] })

    // Animation loop — capped at 30fps to keep the main thread free for user input.
    // 30fps is imperceptible for background ambient scenes; interaction latency
    // (INP) is far more noticeable than frame rate for decorative canvases.
    var clock = new THREE.Clock()
    var _TARGET_FPS = 30
    var _FRAME_MS = 1000 / _TARGET_FPS
    var _lastFrameTime = 0
    function animate(now) {
      requestAnimationFrame(animate)
      if (!isVisible) return
      var elapsed = now - _lastFrameTime
      if (elapsed < _FRAME_MS) return // skip — too soon
      _lastFrameTime = now - (elapsed % _FRAME_MS) // drift-correct
      // Consume pending mouse coords once per frame (not per-event)
      mouseX = _pendingMX
      mouseY = _pendingMY
      var t = clock.getElapsedTime()
      if (updateFn) updateFn(t)
      renderer.render(scene, camera)
    }
    animate(0)
  })
})()
