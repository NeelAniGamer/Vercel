// col-3d/scenes/GenericScene.js — Shared ambient scene for privacy/terms/feedback
// Lightweight, theme-aware, configurable via data attributes

;(function () {
  'use strict'

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  // ==================== SCENE PRESETS ====================
  const PRESETS = {
    // Privacy: Shield hex grid
    privacy: {
      build(scene, camera, pal) {
        camera.position.set(0, 0, 50)
        const group = new THREE.Group()
        scene.add(group)

        const hexSize = 3
        const cols = 12, rows = 10
        const hexes = []

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            let x = col * hexSize * 1.75 - (cols * hexSize * 1.75) / 2
            let y = row * hexSize * 1.55 - (rows * hexSize * 1.55) / 2
            if (row % 2) x += hexSize * 0.875

            const shape = new THREE.Shape()
            for (let k = 0; k < 6; k++) {
              const angle = (Math.PI / 3) * k - Math.PI / 6
              const hx = Math.cos(angle) * hexSize * 0.85
              const hy = Math.sin(angle) * hexSize * 0.85
              if (k === 0) shape.moveTo(hx, hy)
              else shape.lineTo(hx, hy)
            }
            shape.closePath()

            const geo = new THREE.ShapeGeometry(shape)
            const mat = new THREE.MeshBasicMaterial({
              color: pal.teal,
              transparent: true,
              opacity: 0.03 + Math.random() * 0.04,
              side: THREE.DoubleSide
            })
            const hex = new THREE.Mesh(geo, mat)
            hex.position.set(x, y, 0)
            hex.userData = { pulseDelay: Math.random() * Math.PI * 2, baseOpacity: mat.opacity }
            group.add(hex)
            hexes.push(hex)

            // Edges
            const edgeGeo = new THREE.EdgesGeometry(geo)
            const edgeMat = new THREE.LineBasicMaterial({ color: pal.teal, transparent: true, opacity: 0.1 })
            const edges = new THREE.LineSegments(edgeGeo, edgeMat)
            edges.position.copy(hex.position)
            group.add(edges)
          }
        }

        // Shield icon
        const shieldPts = [
          new THREE.Vector3(0, 8, 0.1),
          new THREE.Vector3(-6, 3, 0.1),
          new THREE.Vector3(-5, -4, 0.1),
          new THREE.Vector3(0, -7, 0.1),
          new THREE.Vector3(5, -4, 0.1),
          new THREE.Vector3(6, 3, 0.1),
          new THREE.Vector3(0, 8, 0.1)
        ]
        const shieldGeo = new THREE.BufferGeometry().setFromPoints(shieldPts)
        const shieldLine = new THREE.Line(shieldGeo, new THREE.LineBasicMaterial({ color: pal.em, transparent: true, opacity: 0.3 }))
        group.add(shieldLine)

        return { group, hexes, shieldLine, update(time) {
          hexes.forEach(h => {
            const pulse = Math.sin(time * 0.8 + h.userData.pulseDelay)
            h.material.opacity = h.userData.baseOpacity + pulse * 0.03
          })
          shieldLine.material.opacity = 0.2 + Math.sin(time * 1.5) * 0.15
          group.rotation.y += (mouseX() * 0.08 - group.rotation.y) * 0.01
          group.rotation.x += (mouseY() * 0.04 - group.rotation.x) * 0.01
        }}
      }
    },

    // Terms: Matrix code rain
    terms: {
      build(scene, camera, pal) {
        camera.position.set(0, 0, 50)
        const group = new THREE.Group()
        scene.add(group)

        const columnCount = 25
        const particlesPerCol = 20
        const columns = []

        for (let c = 0; c < columnCount; c++) {
          const colX = (c - columnCount / 2) * 4
          const positions = new Float32Array(particlesPerCol * 3)
          for (let p = 0; p < particlesPerCol; p++) {
            positions[p * 3] = colX + (Math.random() - 0.5) * 0.5
            positions[p * 3 + 1] = (Math.random() - 0.5) * 80
            positions[p * 3 + 2] = (Math.random() - 0.5) * 20
          }
          const geo = new THREE.BufferGeometry()
          geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          const mat = new THREE.PointsMaterial({
            color: [pal.em, pal.teal, pal.ion][c % 3],
            size: 0.4,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
          })
          const points = new THREE.Points(geo, mat)
          points.userData = { speed: 0.1 + Math.random() * 0.15 }
          group.add(points)
          columns.push(points)
        }

        return { group, columns, update(time) {
          columns.forEach(col => {
            const pos = col.geometry.attributes.position.array
            for (let i = 0; i < pos.length; i += 3) {
              pos[i + 1] -= col.userData.speed
              if (pos[i + 1] < -40) pos[i + 1] = 40
            }
            col.geometry.attributes.position.needsUpdate = true
          })
          group.rotation.y += (mouseX() * 0.05 - group.rotation.y) * 0.01
        }}
      }
    },

    // Feedback: Signal waves
    feedback: {
      build(scene, camera, pal) {
        camera.position.set(0, 0, 60)
        const group = new THREE.Group()
        scene.add(group)

        // Concentric rings
        const ringCount = 8
        const rings = []
        for (let i = 0; i < ringCount; i++) {
          const radius = 5 + i * 5
          const geo = new THREE.RingGeometry(radius - 0.15, radius + 0.15, 64)
          const mat = new THREE.MeshBasicMaterial({
            color: [pal.signal, pal.ion][i % 2],
            transparent: true,
            opacity: 0.12 - i * 0.01,
            side: THREE.DoubleSide
          })
          const ring = new THREE.Mesh(geo, mat)
          ring.userData = { baseRadius: radius, phase: i * 0.5 }
          group.add(ring)
          rings.push(ring)
        }

        // Floating signal dots
        const dotCount = 80
        const dotPos = new Float32Array(dotCount * 3)
        for (let d = 0; d < dotCount; d++) {
          const angle = Math.random() * Math.PI * 2
          const dist = 5 + Math.random() * 40
          dotPos[d * 3] = Math.cos(angle) * dist
          dotPos[d * 3 + 1] = Math.sin(angle) * dist
          dotPos[d * 3 + 2] = (Math.random() - 0.5) * 10
        }
        const dotGeo = new THREE.BufferGeometry()
        dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3))
        group.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
          color: pal.signal, size: 0.4, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
        })))

        return { group, rings, update(time) {
          rings.forEach((r, i) => {
            const pulse = Math.sin(time * 1.2 + r.userData.phase)
            const scale = 1 + pulse * 0.08
            r.scale.set(scale, scale, 1)
            r.material.opacity = (0.12 - i * 0.01) * (0.6 + pulse * 0.4)
          })
          group.rotation.z += 0.001
          group.rotation.y += (mouseX() * 0.1 - group.rotation.y) * 0.01
          group.rotation.x += (mouseY() * 0.05 - group.rotation.x) * 0.01
        }}
      }
    }
  }

  // ==================== MAIN BUILDER ====================
  window.GenericScene = function buildGenericScene(scene, camera, renderer, { mouseX, mouseY }) {
    // Determine preset from canvas data attribute or page
    const canvas = renderer.domElement
    const presetName = canvas.dataset.scenePreset ||
      (window.location.pathname.includes('privacy') ? 'privacy' :
       window.location.pathname.includes('terms') ? 'terms' :
       window.location.pathname.includes('feedback') ? 'feedback' : 'privacy')

    const pal = getPal()
    const preset = PRESETS[presetName]
    if (!preset) return () => {}

    const { group, ...rest } = preset.build(scene, camera, pal)

    // Theme sync
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false
      group.traverse(obj => {
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => { if (m.color) m.color.setHex(p.teal) })
          } else if (obj.material.color) {
            obj.material.color.setHex(p.teal)
          }
        }
      })
      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
    }
    applyTheme()
    if (window.ThemeSync) window.ThemeSync.onChange(applyTheme)

    return function update(time) {
      if (rest.update) rest.update(time)
    }
  }
})()