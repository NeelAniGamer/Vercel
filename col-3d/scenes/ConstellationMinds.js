// col-3d/scenes/ConstellationMinds.js — About page "Constellation of Minds"
// Four team member star systems connected by mentor gravity well

;(function () {
  'use strict'

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  // Team member configurations
  const MEMBERS = [
    { id: 'neel', name: 'Neel', role: 'Lead Developer', colorKey: 'ion', size: 1.8, satellites: 8 },
    { id: 'ansh', name: 'Ansh', role: 'Co-Developer & QA', colorKey: 'signal', size: 1.6, satellites: 6 },
    { id: 'aarush', name: 'Aarush', role: 'UI/UX & Physics', colorKey: 'plasma', size: 1.7, satellites: 7 },
    { id: 'yashan', name: 'Yashan', role: 'QA & Idea Dev', colorKey: 'teal', size: 1.5, satellites: 5 }
  ]

  function createStarSystem(member, center) {
    const pal = getPal()
    const group = new THREE.Group()
    group.position.copy(center)

    // Core star
    const coreGeo = new THREE.IcosahedronGeometry(member.size, 2)
    const coreMat = new THREE.MeshBasicMaterial({
      color: pal[member.colorKey],
      transparent: true,
      opacity: 0.9
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    group.add(core)

    // Corona glow
    const { sprite: glow, material: glowMat } = (function() {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      const c = new THREE.Color(pal[member.colorKey])
      const r = Math.round(c.r * 255), g = Math.round(c.g * 255), b = Math.round(c.b * 255)
      grad.addColorStop(0, `rgba(${r},${g},${b},0.6)`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64)
      const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending })
      return { sprite: new THREE.Sprite(mat), material: mat }
    })()
    glow.scale.set(member.size * 2.5, member.size * 2.5, 1)
    group.add(glow)

    // Orbiting satellites (skill tags)
    const satellites = []
    for (let i = 0; i < member.satellites; i++) {
      const angle = (i / member.satellites) * Math.PI * 2
      const radius = member.size * 2 + Math.random() * 1.5
      const satGeo = new THREE.OctahedronGeometry(0.15 + Math.random() * 0.1, 0)
      const satMat = new THREE.MeshBasicMaterial({
        color: pal[member.colorKey],
        transparent: true,
        opacity: 0.6,
        wireframe: true
      })
      const sat = new THREE.Mesh(satGeo, satMat)
      sat.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1, Math.sin(angle) * radius)
      sat.userData = { angle, radius, speed: 0.002 + Math.random() * 0.003, tilt: Math.random() * Math.PI }
      group.add(sat)
      satellites.push(sat)
    }

    // Connection ring
    const ringGeo = new THREE.RingGeometry(member.size * 2.5, member.size * 2.6, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: pal[member.colorKey],
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    group.add(ring)

    return { group, core, glow, glowMat, coreMat, ring, ringMat, satellites, member }
  }

  function createMentor() {
    const pal = getPal()
    const group = new THREE.Group()

    // Supergiant core
    const coreGeo = new THREE.IcosahedronGeometry(4, 3)
    const coreMat = new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.8
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    group.add(core)

    // Intense glow
    const { sprite: glow, material: glowMat } = (function() {
      const canvas = document.createElement('canvas')
      canvas.width = 128; canvas.height = 128
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(242,184,75,0.9)')
      grad.addColorStop(0.3, 'rgba(242,184,75,0.3)')
      grad.addColorStop(1, 'rgba(242,184,75,0)')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128)
      const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending })
      return { sprite: new THREE.Sprite(mat), material: mat }
    })()
    glow.scale.set(18, 18, 1)
    group.add(glow)

    // Gravitational lensing rings
    const rings = []
    for (let i = 0; i < 3; i++) {
      const r = 8 + i * 3
      const geo = new THREE.RingGeometry(r, r + 0.5, 128)
      const mat = new THREE.MeshBasicMaterial({
        color: pal.signal,
        transparent: true,
        opacity: 0.05 - i * 0.01,
        side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(geo, mat)
      ring.rotation.x = -Math.PI / 2
      ring.userData = { baseR: r, speed: 0.001 * (i + 1) }
      group.add(ring)
      rings.push({ ring, mat })
    }

    return { group, core, coreMat, glow, glowMat, rings }
  }

  function createTimelineComet() {
    const pal = getPal()
    const points = []
    for (let i = 0; i < 50; i++) {
      const t = i / 49
      const angle = t * Math.PI * 4
      const radius = 20 + t * 30
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(t * Math.PI * 6) * 3,
        Math.sin(angle) * radius
      ))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.3
    })
    return new THREE.Line(geo, mat)
  }

  // ==================== MAIN BUILDER ====================
  window.ConstellationMinds = function buildConstellationMinds(scene, camera, renderer, { mouseX, mouseY }) {
    camera.position.set(0, 0, 80)

    const root = new THREE.Group()
    scene.add(root)

    const pal = getPal()
    const systems = []

    // Create 4 member star systems in a diamond formation
    const positions = [
      new THREE.Vector3(-25, 15, -10),   // Neel
      new THREE.Vector3(25, -10, -10),   // Ansh
      new THREE.Vector3(-15, -20, 15),   // Aarush
      new THREE.Vector3(20, 10, 20)      // Yashan
    ]

    MEMBERS.forEach((m, i) => {
      const sys = createStarSystem(m, positions[i])
      root.add(sys.group)
      systems.push(sys)
    })

    // Central mentor
    const mentor = createMentor()
    mentor.group.position.set(0, 0, 0)
    root.add(mentor.group)

    // Timeline comet
    const comet = createTimelineComet()
    root.add(comet)

    // Theme sync
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false

      systems.forEach(sys => {
        sys.coreMat.color.setHex(p[sys.member.colorKey])
        sys.glowMat.color.setHex(p[sys.member.colorKey])
        sys.ringMat.color.setHex(p[sys.member.colorKey])
        sys.satellites.forEach(s => s.material.color.setHex(p[sys.member.colorKey]))
      })

      mentor.coreMat.color.setHex(p.signal)
      mentor.glowMat.color.setHex(p.signal)
      mentor.rings.forEach(({ mat }) => mat.color.setHex(p.signal))
      comet.material.color.setHex(p.signal)

      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
    }
    applyTheme()
    if (window.ThemeSync) window.ThemeSync.onChange(applyTheme)

    // Animation
    return function update(time) {
      // Rotate systems slowly
      systems.forEach(sys => {
        sys.group.rotation.y += 0.0002
        sys.core.rotation.y = time * 0.05
        sys.core.rotation.x = time * 0.03
        sys.glow.scale.set(
          sys.member.size * 2.5 + Math.sin(time * 2) * 0.5,
          sys.member.size * 2.5 + Math.sin(time * 2) * 0.5,
          1
        )
        sys.satellites.forEach(sat => {
          sat.userData.angle += sat.userData.speed
          sat.position.x = Math.cos(sat.userData.angle) * sat.userData.radius
          sat.position.z = Math.sin(sat.userData.angle) * sat.userData.radius
          sat.rotation.y += 0.01
        })
        sys.ring.rotation.z += 0.0005
      })

      // Mentor animation
      mentor.core.rotation.y = time * 0.02
      mentor.core.rotation.x = time * 0.01
      mentor.glow.scale.set(18 + Math.sin(time * 1.5) * 2, 18 + Math.sin(time * 1.5) * 2, 1)
      mentor.rings.forEach(({ ring, mat }) => {
        ring.rotation.z += mat.userData?.speed || 0.001
      })

      // Comet
      comet.rotation.y = time * 0.005

      // Parallax
      root.rotation.y += (mouseX() * 0.15 - root.rotation.y) * 0.01
      root.rotation.x += (mouseY() * 0.08 - root.rotation.x) * 0.01
    }
  }
})()