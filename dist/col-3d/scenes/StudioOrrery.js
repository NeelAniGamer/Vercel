// col-3d/scenes/StudioOrrery.js — Home page "Studio Orrery"
// Five project planets orbiting a central CoL core, each with unique visual identity
// Theme-aware via window.ThemeSync, disposes via DisposalRegistry

;(function () {
  'use strict'

  const PALETTE_KEYS = {
    signal: 'signal',   // gold
    ion: 'ion',         // cyan
    teal: 'teal',       // teal
    plasma: 'plasma',   // purple
    em: 'em',           // green
    dim: 'dim'          // muted
  }

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  function createGlowSprite(color, size, intensity = 1) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    const c = new THREE.Color(color)
    const r = Math.round(c.r * 255)
    const g = Math.round(c.g * 255)
    const b = Math.round(c.b * 255)
    grad.addColorStop(0, `rgba(${r},${g},${b},${0.9 * intensity})`)
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.35 * intensity})`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(size, size, 1)
    return { sprite, material: mat, texture: tex }
  }

  function createOrbitalRing(radius, count, colorKey, size, speed, inclination, opacity = 0.8) {
    const pal = getPal()
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * 3.5
      positions[i * 3] = Math.cos(angle) * (radius + jitter)
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.5
      positions[i * 3 + 2] = Math.sin(angle) * (radius + jitter)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: pal[colorKey],
      size,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const pts = new THREE.Points(geo, mat)
    pts.rotation.x = inclination

    // Subtle guide line
    const linePoints = []
    for (let j = 0; j <= 120; j++) {
      const a = (j / 120) * Math.PI * 2
      linePoints.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
    const lineMat = new THREE.LineBasicMaterial({
      color: pal[colorKey],
      transparent: true,
      opacity: 0.08
    })
    const line = new THREE.Line(lineGeo, lineMat)

    return { pts, line, speed, mat: mat, lineMat }
  }

  // ==================== SCENE BUILDER ====================
  window.StudioOrrery = function buildStudioOrrery(scene, camera, renderer, { mouseX, mouseY }) {
    camera.position.set(0, 6, 65)

    const root = new THREE.Group()
    scene.add(root)

    // Track all materials for live theme updates
    const themeMaterials = []

    function trackMat(mat, key) {
      themeMaterials.push({ mat, key })
      return mat
    }

    const pal = getPal()

    // ============ CORE GROUP ============
    const coreGroup = new THREE.Group()
    coreGroup.position.set(0, 4, -5)
    root.add(coreGroup)

    // Central glow
    const { sprite: coreGlow, material: glowMat, texture: glowTex } = createGlowSprite(pal.signal, 16, 1)
    coreGroup.add(coreGlow)

    // Core star (icosahedron)
    const starMat = trackMat(new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.9
    }), 'signal')
    const starGeo = new THREE.IcosahedronGeometry(2.5, 2)
    const star = new THREE.Mesh(starGeo, starMat)
    coreGroup.add(star)

    // Network nodes around core
    const nodeCount = 45
    const nodePositions = new Float32Array(nodeCount * 3)
    const nodes = []
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount)
      const theta = Math.sqrt(nodeCount * Math.PI) * phi
      const r = 4.5 + Math.random() * 1.5
      const x = r * Math.cos(theta) * Math.sin(phi)
      const y = r * Math.sin(theta) * Math.sin(phi)
      const z = r * Math.cos(phi)
      nodePositions[i * 3] = x
      nodePositions[i * 3 + 1] = y
      nodePositions[i * 3 + 2] = z
      nodes.push(new THREE.Vector3(x, y, z))
    }
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    const nodeMat = trackMat(new THREE.PointsMaterial({
      color: pal.teal,
      size: 0.4,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    }), 'teal')
    const nodePoints = new THREE.Points(nodeGeo, nodeMat)
    coreGroup.add(nodePoints)

    // Connection lines between nearby nodes
    const linePositions = []
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 4.2) {
          linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z)
          linePositions.push(nodes[j].x, nodes[j].y, nodes[j].z)
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    const lineMat = trackMat(new THREE.LineBasicMaterial({
      color: pal.ion,
      transparent: true,
      opacity: 0.15
    }), 'ion')
    const netLines = new THREE.LineSegments(lineGeo, lineMat)
    coreGroup.add(netLines)

    // Orbital rings (representing the 5 projects)
    const orbDefs = [
      { r: 14, n: 60, key: 'ion', sz: 0.25, spd: 0.007, inc: 0.25 },
      { r: 22, n: 80, key: 'teal', sz: 0.2, spd: -0.005, inc: -0.2 },
      { r: 32, n: 100, key: 'plasma', sz: 0.16, spd: 0.003, inc: 0.15 },
      { r: 45, n: 120, key: 'dim', sz: 0.12, spd: -0.002, inc: -0.1 }
    ]
    const orbitalRings = []
    orbDefs.forEach(d => {
      const ring = createOrbitalRing(d.r, d.n, d.key, d.sz, d.spd, d.inc, 0.8)
      coreGroup.add(ring.pts)
      coreGroup.add(ring.line)
      orbitalRings.push(ring)
    })
    coreGroup.rotation.x = 0.45

    // ============ MATRIX RAIN (ATI Typing) ============
    const rainGroup = new THREE.Group()
    root.add(rainGroup)
    const rainTrails = []
    const rainKeys = ['em', 'teal', 'ion']
    for (let c = 0; c < 40; c++) {
      const rx = (Math.random() - 0.5) * 100
      const rz = (Math.random() - 0.5) * 40 - 15
      if (Math.abs(rx) < 15 && Math.abs(rz) < 15) rx += 20 * Math.sign(rx)

      const pos = new Float32Array(6)
      const y = (Math.random() - 0.5) * 80
      const len = 1.5 + Math.random() * 3
      pos[0] = rx; pos[1] = y; pos[2] = rz
      pos[3] = rx; pos[4] = y + len; pos[5] = rz

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const key = rainKeys[c % 3]
      const mat = trackMat(new THREE.LineBasicMaterial({
        color: pal[key],
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      }), key)
      const line = new THREE.Line(geo, mat)
      line.userData = { speed: 0.15 + Math.random() * 0.2, len }
      rainGroup.add(line)
      rainTrails.push(line)
    }

    // ============ FLUID RIBBON (Gesture Control) ============
    const waveGroup = new THREE.Group()
    waveGroup.position.set(0, -18, -15)
    root.add(waveGroup)
    const waveSegs = 40, waveW = 120
    const wGeo = new THREE.PlaneGeometry(waveW, 16, waveSegs, 4)
    wGeo.rotateX(-Math.PI / 2)
    const origY = []
    const posAtt = wGeo.attributes.position
    for (let i = 0; i < posAtt.count; i++) origY.push(posAtt.getY(i))

    const wMat = trackMat(new THREE.MeshBasicMaterial({
      color: pal.ion,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      wireframe: true
    }), 'ion')
    const waveMesh = new THREE.Mesh(wGeo, wMat)
    waveGroup.add(waveMesh)

    // ============ QR GRID (QR Editor) ============
    const qrGroup = new THREE.Group()
    qrGroup.position.set(0, -24, -25)
    qrGroup.rotation.x = Math.PI / 2
    root.add(qrGroup)
    const qrCells = []
    const qrMat = trackMat(new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    }), 'signal')
    for (let qx = -6; qx <= 6; qx++) {
      for (let qy = -4; qy <= 4; qy++) {
        if (Math.random() < 0.3) continue
        const cell = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.8, 0.2), qrMat)
        cell.position.set(qx * 4.2, qy * 4.2, (Math.random() - 0.5) * 1.5)
        const dist = Math.sqrt(qx * qx + qy * qy)
        cell.userData = { dist, rot: (Math.random() - 0.5) * 0.005 }
        qrGroup.add(cell)
        qrCells.push(cell)
      }
    }

    // ============ FLOATING GEMS (RPG Engine) ============
    const rpgGroup = new THREE.Group()
    root.add(rpgGroup)
    const gemKeys = ['plasma', 'signal', 'em', 'ion', 'teal']
    const gems = []
    for (let g = 0; g < 16; g++) {
      const key = gemKeys[g % gemKeys.length]
      const baseGeo = g % 2 === 0
        ? new THREE.IcosahedronGeometry(1.2 + Math.random() * 0.5, 0)
        : new THREE.OctahedronGeometry(1.0 + Math.random() * 0.6, 0)

      const coreMat = trackMat(new THREE.MeshBasicMaterial({
        color: pal[key], transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending
      }), key)
      const core = new THREE.Mesh(baseGeo, coreMat)

      const wireMat = trackMat(new THREE.MeshBasicMaterial({
        color: pal[key], transparent: true, opacity: 0.7, wireframe: true
      }), key)
      const wire = new THREE.Mesh(baseGeo, wireMat)
      wire.scale.set(1.15, 1.15, 1.15)

      const gemObj = new THREE.Group()
      gemObj.add(core)
      gemObj.add(wire)

      const rA = Math.random() * Math.PI * 2
      const rR = 18 + Math.random() * 25
      gemObj.position.set(Math.cos(rA) * rR, (Math.random() - 0.5) * 30, Math.sin(rA) * rR)
      gemObj.userData = {
        rotSpdX: (Math.random() - 0.5) * 0.02,
        rotSpdY: (Math.random() - 0.5) * 0.02,
        orbitSpd: (Math.random() - 0.5) * 0.003,
        floatOff: Math.random() * Math.PI * 2,
        floatSpd: 0.5 + Math.random() * 0.8,
        dist: rR, ang: rA
      }
      rpgGroup.add(gemObj)
      gems.push(gemObj)
    }

    // ============ THEME APPLICATION ============
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false
      themeMaterials.forEach(({ mat, key }) => {
        mat.color.setHex(p[key])
      })
      // Fog
      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
      // Canvas opacity handled by SceneManager + ThemeSync
      // Glow sprite
      if (glowMat) glowMat.opacity = isLight ? 0.35 : 0.95
      if (starMat) starMat.opacity = isLight ? 0.7 : 0.9
    }
    applyTheme()
    if (window.ThemeSync) {
      window.ThemeSync.onChange(applyTheme)
    }

    // ============ ANIMATION LOOP ============
    return function update(time) {
      // Core orbital rings
      orbitalRings.forEach(r => { r.pts.rotation.y += r.speed })

      // Core pulse
      if (starMat) starMat.opacity = 0.75 + Math.sin(time * 2.2) * 0.15
      if (coreGlow) coreGlow.scale.set(
        15 + Math.sin(time * 1.8) * 2,
        15 + Math.sin(time * 1.8) * 2,
        1
      )

      // Network rotation
      nodePoints.rotation.y = time * 0.05
      nodePoints.rotation.x = time * 0.03
      netLines.rotation.y = time * 0.05
      netLines.rotation.x = time * 0.03

      // Parallax
      coreGroup.rotation.y += (mouseX() * 0.25 - coreGroup.rotation.y) * 0.015
      coreGroup.rotation.x = 0.45 + (mouseY() * 0.15 - (coreGroup.rotation.x - 0.45)) * 0.015

      // Matrix rain
      rainTrails.forEach(tr => {
        const pos = tr.geometry.attributes.position.array
        pos[1] -= tr.userData.speed
        pos[4] -= tr.userData.speed
        if (pos[4] < -40) {
          pos[1] = 40
          pos[4] = 40 + tr.userData.len
        }
        tr.geometry.attributes.position.needsUpdate = true
      })
      rainGroup.rotation.y += (mouseX() * 0.06 - rainGroup.rotation.y) * 0.01

      // Fluid ribbon
      for (let i = 0; i < posAtt.count; i++) {
        const x = posAtt.getX(i), z = posAtt.getZ(i)
        const yOff = Math.sin(time * 1.5 + x * 0.05 + z * 0.1) * 3.5
        posAtt.setY(i, origY[i] + yOff)
      }
      posAtt.needsUpdate = true
      waveGroup.rotation.y += (mouseX() * 0.1 - waveGroup.rotation.y) * 0.01

      // QR grid pulse
      qrCells.forEach(cell => {
        cell.material.opacity = 0.08 + Math.sin(time * 2.5 - cell.userData.dist * 0.2) * 0.15
        cell.rotation.z += cell.userData.rot
      })
      qrGroup.rotation.z += (mouseX() * 0.05 - qrGroup.rotation.z) * 0.01

      // Floating gems
      gems.forEach(g => {
        g.children[1].rotation.x += g.userData.rotSpdX
        g.children[1].rotation.y += g.userData.rotSpdY
        g.userData.ang += g.userData.orbitSpd
        g.position.x = Math.cos(g.userData.ang) * g.userData.dist
        g.position.z = Math.sin(g.userData.ang) * g.userData.dist
        g.position.y += Math.sin(time * g.userData.floatSpd + g.userData.floatOff) * 0.02
      })
      rpgGroup.rotation.y += (mouseX() * 0.15 - rpgGroup.rotation.y) * 0.015

      // Subtle root parallax
      root.rotation.y += mouseX() * 0.002
      root.rotation.x += mouseY() * 0.001
    }
  }

  // Cleanup registration handled by SceneManager + DisposalRegistry
})()