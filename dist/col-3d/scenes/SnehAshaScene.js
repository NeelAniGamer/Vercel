// col-3d/scenes/SnehAshaScene.js — Sneh Asha page custom scene
// Unique procedural 3D scene for Sneh Asha (already has its own 3D in col-3d.js)
// This provides an alternative enhanced version

;(function () {
  'use strict'

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  window.SnehAshaScene = function buildSnehAshaScene(scene, camera, renderer, { mouseX, mouseY }) {
    camera.position.set(0, 0, 60)

    const root = new THREE.Group()
    scene.add(root)

    const pal = getPal()

    // ===== HEART GEOMETRY =====
    const heartGroup = new THREE.Group()
    heartGroup.position.set(0, 0, -10)
    root.add(heartGroup)

    // Procedural heart shape using parametric surface
    const heartDetail = 32
    const heartGeo = new THREE.ParametricGeometry((u, v, target) => {
      u = u * Math.PI * 2
      v = v * Math.PI
      const x = 16 * Math.pow(Math.sin(u), 3)
      const y = 13 * Math.cos(v) - 5 * Math.cos(2 * v) - 2 * Math.cos(3 * v) - Math.cos(4 * v)
      const z = 0
      target.set(x * 0.5, y * 0.5, z)
    }, heartDetail, heartDetail)

    // Rotate to face camera
    heartGeo.rotateY(Math.PI / 2)

    const heartMat = new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
      side: THREE.DoubleSide
    })
    const heart = new THREE.Mesh(heartGeo, heartMat)
    heartGroup.add(heart)

    // Inner solid heart
    const innerHeartGeo = new THREE.ParametricGeometry((u, v, target) => {
      u = u * Math.PI * 2
      v = v * Math.PI
      const x = 16 * Math.pow(Math.sin(u), 3)
      const y = 13 * Math.cos(v) - 5 * Math.cos(2 * v) - 2 * Math.cos(3 * v) - Math.cos(4 * v)
      target.set(x * 0.35, y * 0.35, 0)
    }, 24, 24)
    innerHeartGeo.rotateY(Math.PI / 2)

    const innerHeartMat = new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const innerHeart = new THREE.Mesh(innerHeartGeo, innerHeartMat)
    heartGroup.add(innerHeart)

    // ===== PARTICLE FIELD (HOPE/ASPIRATION) =====
    const particleCount = 800
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = []

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 20 + Math.random() * 40

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      const colorChoice = [pal.signal, pal.em, pal.ion, pal.plasma, pal.teal][Math.floor(Math.random() * 5)]
      const c = new THREE.Color(colorChoice)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      sizes[i] = 0.5 + Math.random() * 1.5

      velocities.push({
        theta: (Math.random() - 0.5) * 0.0005,
        phi: (Math.random() - 0.5) * 0.0005,
        radiusSpeed: (Math.random() - 0.5) * 0.01
      })
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particleMat = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    root.add(particles)

    // ===== CONNECTING LINES (COMMUNITY) =====
    const lineGeo = new THREE.BufferGeometry()
    const linePositions = []
    const connectionDistance = 15

    for (let i = 0; i < particleCount; i += 10) { // Sample every 10th for performance
      for (let j = i + 10; j < particleCount; j += 10) {
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < connectionDistance) {
          linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
          linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2])
        }
      }
    }

    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    const lineMat = new THREE.LineBasicMaterial({
      color: pal.em,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending
    })
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    root.add(lines)

    // ===== RISING LIGHT BEAMS =====
    const beams = []
    for (let i = 0; i < 8; i++) {
      const beamGeo = new THREE.CylinderGeometry(0.1, 1.5, 60, 6, 1, true)
      const beamMat = new THREE.MeshBasicMaterial({
        color: [pal.signal, pal.em, pal.ion][i % 3],
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
      const beam = new THREE.Mesh(beamGeo, beamMat)
      const angle = (i / 8) * Math.PI * 2
      beam.position.set(Math.cos(angle) * 8, -10, Math.sin(angle) * 8)
      beam.rotation.x = -Math.PI / 2
      root.add(beam)
      beams.push({ mesh: beam, angle, phase: Math.random() * Math.PI * 2 })
    }

    // ===== THEME SYNC =====
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false

      heartMat.color.setHex(p.signal)
      innerHeartMat.color.setHex(p.signal)
      lineMat.color.setHex(p.em)

      beams.forEach((b, i) => {
        b.mesh.material.color.setHex([p.signal, p.em, p.ion][i % 3])
      })

      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
    }
    applyTheme()
    if (window.ThemeSync) window.ThemeSync.onChange(applyTheme)

    // ===== ANIMATION =====
    return function update(time) {
      // Heart beat
      const beat = 1 + Math.sin(time * 3) * 0.08
      heartGroup.scale.setScalar(beat)
      innerHeart.scale.setScalar(beat * 0.9)

      heartGroup.rotation.y = time * 0.02
      heartGroup.rotation.x = Math.sin(time * 0.5) * 0.1

      // Particles drift
      const pos = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        const v = velocities[i]
        // Spherical coordinate drift
        const x = pos[i * 3]
        const y = pos[i * 3 + 1]
        const z = pos[i * 3 + 2]
        const r = Math.sqrt(x * x + y * y + z * z)
        const theta = Math.atan2(z, x) + v.theta
        const phi = Math.acos(y / r) + v.phi
        const newR = r + v.radiusSpeed

        pos[i * 3] = newR * Math.sin(phi) * Math.cos(theta)
        pos[i * 3 + 1] = newR * Math.cos(phi)
        pos[i * 3 + 2] = newR * Math.sin(phi) * Math.sin(theta)

        // Bounce at boundaries
        if (newR > 70 || newR < 15) v.radiusSpeed *= -1
      }
      particles.geometry.attributes.position.needsUpdate = true

      // Rising beams
      beams.forEach(b => {
        b.mesh.rotation.z += 0.001
        b.mesh.material.opacity = 0.05 + Math.sin(time * 2 + b.phase) * 0.05
        b.mesh.scale.y = 1 + Math.sin(time * 1.5 + b.phase) * 0.1
      })

      // Camera parallax
      root.rotation.y += (mouseX() * 0.08 - root.rotation.y) * 0.01
      root.rotation.x += (mouseY() * 0.04 - root.rotation.x) * 0.01
    }
  }
})()