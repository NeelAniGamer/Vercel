// col-3d/scenes/ModularCore.js — Database_Logic page "Modular Knowledge Core"
// Five-tier modular space station representing 50 traffic education modules

;(function () {
  'use strict'

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  const TIERS = [
    { name: 'Fundamentals', colorKey: 'ion', moduleCount: 10, radius: 15, height: 0 },
    { name: 'Infrastructure & Vehicles', colorKey: 'teal', moduleCount: 10, radius: 25, height: 12 },
    { name: 'Advanced Physics', colorKey: 'plasma', moduleCount: 10, radius: 35, height: 24 },
    { name: 'Smart Cities & Ecology', colorKey: 'em', moduleCount: 10, radius: 45, height: 36 },
    { name: 'Autonomous Future', colorKey: 'signal', moduleCount: 10, radius: 55, height: 48 }
  ]

  const MODULE_ICONS = {
    'Fundamentals': ['🚦', '🛑', '🚶', '🛣️', '🔄', '👁️', '🔊', '⏱️', '🌧️', '🌙'],
    'Infrastructure & Vehicles': ['🚛', '🚲', '🚌', '🏫', '🚂', '⚙️', '🛣️', '🚧', '🏝️', '⚖️'],
    'Advanced Physics': ['🧠', '🌊', '🌀', '💥', '💺', '💨', '📏', '📱', '☀️', '🎯'],
    'Smart Cities & Ecology': ['📡', '🗺️', '🔋', '💨', '🚥', '🛑', '🏙️', '🛴', '💰', '📶'],
    'Autonomous Future': ['🔦', '📻', '📸', '🤖', '⚖️', '🚚', '🛡️', '🚶‍♂️', '🔒', '✨']
  }

  function createTier(tier, tierIndex, pal) {
    const group = new THREE.Group()
    group.position.y = tier.height

    // Tier ring
    const ringGeo = new THREE.RingGeometry(tier.radius - 1, tier.radius + 1, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: pal[tier.colorKey],
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    group.add(ring)

    // Tier label ring
    const labelGeo = new THREE.RingGeometry(tier.radius + 2, tier.radius + 3, 32)
    const labelMat = new THREE.MeshBasicMaterial({
      color: pal[tier.colorKey],
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide
    })
    const labelRing = new THREE.Mesh(labelGeo, labelMat)
    labelRing.rotation.x = -Math.PI / 2
    group.add(labelRing)

    // Conduits to center (for tiers > 0)
    const conduits = []
    if (tierIndex > 0) {
      const conduitCount = 6
      for (let c = 0; c < conduitCount; c++) {
        const angle = (c / conduitCount) * Math.PI * 2
        const points = [
          new THREE.Vector3(Math.cos(angle) * (TIERS[tierIndex - 1].radius + 1), TIERS[tierIndex - 1].height, Math.sin(angle) * (TIERS[tierIndex - 1].radius + 1)),
          new THREE.Vector3(Math.cos(angle) * (tier.radius - 1), tier.height, Math.sin(angle) * (tier.radius - 1))
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(points)
        const mat = new THREE.LineBasicMaterial({
          color: pal[tier.colorKey],
          transparent: true,
          opacity: 0.15
        })
        const line = new THREE.Line(geo, mat)
        group.add(line)
        conduits.push({ line, mat })
      }
    }

    // Modules around tier
    const modules = []
    for (let m = 0; m < tier.moduleCount; m++) {
      const angle = (m / tier.moduleCount) * Math.PI * 2
      const r = tier.radius + (Math.random() - 0.5) * 1.5
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = (Math.random() - 0.5) * 2

      const modGroup = new THREE.Group()
      modGroup.position.set(x, y, z)
      group.add(modGroup)

      // Module core (varied geometry)
      const geoTypes = [
        () => new THREE.BoxGeometry(1, 1, 1),
        () => new THREE.OctahedronGeometry(0.7, 0),
        () => new THREE.TetrahedronGeometry(0.7, 0),
        () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
        () => new THREE.DodecahedronGeometry(0.6, 0)
      ]
      const coreGeo = geoTypes[m % geoTypes.length]()
      const coreMat = new THREE.MeshBasicMaterial({
        color: pal[tier.colorKey],
        transparent: true,
        opacity: 0.6,
        wireframe: true
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      modGroup.add(core)

      // Outer shell
      const shellGeo = coreGeo.clone()
      shellGeo.scale(1.3, 1.3, 1.3)
      const shellMat = new THREE.MeshBasicMaterial({
        color: pal[tier.colorKey],
        transparent: true,
        opacity: 0.15,
        wireframe: false
      })
      const shell = new THREE.Mesh(shellGeo, shellMat)
      modGroup.add(shell)

      // Data pulse ring
      const pulseGeo = new THREE.RingGeometry(1.5, 1.7, 16)
      const pulseMat = new THREE.MeshBasicMaterial({
        color: pal[tier.colorKey],
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      })
      const pulse = new THREE.Mesh(pulseGeo, pulseMat)
      pulse.rotation.x = -Math.PI / 2
      modGroup.add(pulse)

      modGroup.userData = {
        tierIndex,
        angle,
        radius: r,
        orbitSpeed: 0.0005 + Math.random() * 0.001,
        pulsePhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatOffset: Math.random() * Math.PI * 2,
        core, coreMat, shell, shellMat, pulse, pulseMat,
        icon: MODULE_ICONS[tier.name][m]
      }
      modules.push(modGroup)
    }

    return { group, ring, ringMat, modules, conduits }
  }

  function createCentralCore(pal) {
    const group = new THREE.Group()

    // Central data core
    const coreGeo = new THREE.IcosahedronGeometry(4, 2)
    const coreMat = new THREE.MeshBasicMaterial({
      color: pal.ion,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    group.add(core)

    // Pulsing glow
    const { sprite: glow, material: glowMat } = (function() {
      const canvas = document.createElement('canvas')
      canvas.width = 128; canvas.height = 128
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(94,212,245,0.8)')
      grad.addColorStop(0.5, 'rgba(94,212,245,0.3)')
      grad.addColorStop(1, 'rgba(94,212,245,0)')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128)
      const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending })
      return { sprite: new THREE.Sprite(mat), material: mat }
    })()
    glow.scale.set(12, 12, 1)
    group.add(glow)

    // Data streams emanating
    const streams = []
    for (let i = 0; i < 12; i++) {
      const points = []
      for (let j = 0; j <= 20; j++) {
        const t = j / 20
        const angle = (i / 12) * Math.PI * 2 + t * Math.PI * 2
        const radius = 4 + t * 30
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius
        ))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: pal.ion,
        transparent: true,
        opacity: 0.1
      })
      const line = new THREE.Line(geo, mat)
      line.userData = { basePoints: points, tier: i % 5 }
      group.add(line)
      streams.push({ line, mat, tier: i % 5 })
    }

    // Orbiting data nodes
    const nodes = []
    for (let i = 0; i < 20; i++) {
      const nodeGeo = new THREE.OctahedronGeometry(0.2 + Math.random() * 0.2, 0)
      const nodeMat = new THREE.MeshBasicMaterial({
        color: [pal.ion, pal.teal, pal.em, pal.plasma, pal.signal][i % 5],
        transparent: true,
        opacity: 0.7
      })
      const node = new THREE.Mesh(nodeGeo, nodeMat)
      const angle = (i / 20) * Math.PI * 2
      const radius = 8 + Math.random() * 4
      node.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 6, Math.sin(angle) * radius)
      node.userData = { angle, radius, speed: 0.002 + Math.random() * 0.003, tilt: Math.random() * Math.PI }
      group.add(node)
      nodes.push(node)
    }

    return { group, core, coreMat, glow, glowMat, streams, nodes }
  }

  // ==================== MAIN BUILDER ====================
  window.ModularCore = function buildModularCore(scene, camera, renderer, { mouseX, mouseY }) {
    camera.position.set(0, 15, 45)
    camera.lookAt(0, 0, 0)

    const root = new THREE.Group()
    scene.add(root)

    const pal = getPal()

    // Grid floor
    const gridHelper = new THREE.GridHelper(120, 60, pal.teal, 0x0a1420)
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0.1
    root.add(gridHelper)

    // Central core
    const central = createCentralCore(pal)
    root.add(central.group)

    // Tiers
    const tiers = TIERS.map((tier, i) => createTier(tier, i, pal))
    tiers.forEach(t => root.add(t.group))

    // Theme sync
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false

      // Grid
      gridHelper.material.color.setHex(p.teal)

      // Central
      central.coreMat.color.setHex(p.ion)
      central.glowMat.opacity = isLight ? 0.3 : 0.8
      central.streams.forEach(s => s.mat.color.setHex(p[s.tier === 0 ? 'ion' : TIERS[s.tier].colorKey]))
      central.nodes.forEach((n, i) => n.material.color.setHex([p.ion, p.teal, p.em, p.plasma, p.signal][i % 5]))

      // Tiers
      tiers.forEach((t, ti) => {
        t.ringMat.color.setHex(p[TIERS[ti].colorKey])
        t.labelRing.material.color.setHex(p[TIERS[ti].colorKey])
        t.conduits.forEach(c => c.mat.color.setHex(p[TIERS[ti].colorKey]))
        t.modules.forEach(m => {
          m.userData.coreMat.color.setHex(p[TIERS[ti].colorKey])
          m.userData.shellMat.color.setHex(p[TIERS[ti].colorKey])
          m.userData.pulseMat.color.setHex(p[TIERS[ti].colorKey])
        })
      })

      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
    }
    applyTheme()
    if (window.ThemeSync) window.ThemeSync.onChange(applyTheme)

    // Animation
    return function update(time) {
      // Central core rotation
      central.core.rotation.y = time * 0.02
      central.core.rotation.x = time * 0.01
      central.glow.scale.set(12 + Math.sin(time * 1.5) * 2, 12 + Math.sin(time * 1.5) * 2, 1)

      // Data streams
      central.streams.forEach((s, i) => {
        const pos = s.line.geometry.attributes.position.array
        const points = s.userData.basePoints
        for (let j = 0; j <= 20; j++) {
          const t = j / 20
          const angle = (i / 12) * Math.PI * 2 + t * Math.PI * 2 + time * 0.1
          const radius = 4 + t * 30
          pos[j * 3] = Math.cos(angle) * radius
          pos[j * 3 + 1] = Math.sin(time * 2 + j * 0.3) * 0.5
          pos[j * 3 + 2] = Math.sin(angle) * radius
        }
        s.line.geometry.attributes.position.needsUpdate = true
      })

      // Central nodes
      central.nodes.forEach(n => {
        n.userData.angle += n.userData.speed
        n.position.x = Math.cos(n.userData.angle) * n.userData.radius
        n.position.z = Math.sin(n.userData.angle) * n.userData.radius
        n.rotation.y += 0.01
      })

      // Tier modules
      tiers.forEach((t, ti) => {
        t.modules.forEach(m => {
          const d = m.userData
          d.angle += d.orbitSpeed
          m.position.x = Math.cos(d.angle) * d.radius
          m.position.z = Math.sin(d.angle) * d.radius
          m.position.y = Math.sin(time * d.floatSpeed + d.floatOffset) * 0.3

          d.core.rotation.y += 0.005
          d.core.rotation.x += 0.003

          // Pulse ring
          const pulse = Math.sin(time * 2 + d.pulsePhase)
          d.pulse.scale.set(1 + pulse * 0.2, 1 + pulse * 0.2, 1)
          d.pulseMat.opacity = 0.1 + pulse * 0.15
        })
      })

      // Parallax
      root.rotation.y += (mouseX() * 0.05 - root.rotation.y) * 0.01
      root.rotation.x += (mouseY() * 0.03 - root.rotation.x) * 0.01
    }
  }
})()