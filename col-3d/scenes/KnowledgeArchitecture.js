// col-3d/scenes/KnowledgeArchitecture.js — School page "Knowledge Architecture"
// Brutalist campus building rising from foundation, each floor = a pillar

;(function () {
  'use strict'

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  const FLOORS = [
    { name: 'Foundation', subtitle: 'CBSE Curriculum', colorKey: 'ion', height: 2, y: 0 },
    { name: 'Computer Lab', subtitle: 'Code Towers', colorKey: 'signal', height: 6, y: 2 },
    { name: 'Library', subtitle: 'Knowledge Graphs', colorKey: 'teal', height: 6, y: 8 },
    { name: 'Science Lab', subtitle: 'Molecular Structures', colorKey: 'plasma', height: 6, y: 14 },
    { name: 'Sports Ground', subtitle: 'Collaboration Field', colorKey: 'em', height: 4, y: 20 }
  ]

  function createBuilding() {
    const pal = getPal()
    const group = new THREE.Group()

    // Foundation bedrock
    const bedGeo = new THREE.BoxGeometry(30, 1, 30)
    const bedMat = new THREE.MeshBasicMaterial({ color: pal.void2, transparent: true, opacity: 0.5 })
    const bedrock = new THREE.Mesh(bedGeo, bedMat)
    bedrock.position.y = -0.5
    group.add(bedrock)

    // Code fossils embedded in foundation
    const fossils = []
    for (let i = 0; i < 20; i++) {
      const fossilGeo = new THREE.BoxGeometry(0.3, 0.1, 1)
      const fossilMat = new THREE.MeshBasicMaterial({ color: pal.ion, transparent: true, opacity: 0.3 })
      const fossil = new THREE.Mesh(fossilGeo, fossilMat)
      fossil.position.set(
        (Math.random() - 0.5) * 25,
        -0.2,
        (Math.random() - 0.5) * 25
      )
      fossil.rotation.y = Math.random() * Math.PI
      group.add(fossil)
      fossils.push(fossil)
    }

    const floors = []

    FLOORS.forEach((floor, fi) => {
      const floorGroup = new THREE.Group()
      floorGroup.position.y = floor.y + floor.height / 2
      group.add(floorGroup)

      // Floor slab
      const slabGeo = new THREE.BoxGeometry(28, floor.height * 0.9, 28)
      const slabMat = new THREE.MeshBasicMaterial({
        color: pal.panel,
        transparent: true,
        opacity: 0.15,
        wireframe: true
      })
      const slab = new THREE.Mesh(slabGeo, slabMat)
      floorGroup.add(slab)

      // Four corner pillars
      const pillars = []
      const px = 12, pz = 12
      const corners = [
        [-px, -pz], [px, -pz], [px, pz], [-px, pz]
      ]
      corners.forEach(([x, z]) => {
        const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, floor.height * 0.85, 8)
        const pillarMat = new THREE.MeshBasicMaterial({
          color: pal[floor.colorKey],
          transparent: true,
          opacity: 0.4,
          wireframe: fi > 0 // Foundation solid, others wireframe
        })
        const pillar = new THREE.Mesh(pillarGeo, pillarMat)
        pillar.position.set(x, 0, z)
        floorGroup.add(pillar)
        pillars.push(pillar)
      })

      // Floor content
      const content = createFloorContent(floor, floorGroup, pal)

      // Glowing accent line at floor edge
      const edgeGeo = new THREE.BoxGeometry(28.2, 0.05, 28.2)
      const edgeMat = new THREE.MeshBasicMaterial({
        color: pal[floor.colorKey],
        transparent: true,
        opacity: 0.3
      })
      const edge = new THREE.Mesh(edgeGeo, edgeMat)
      edge.position.y = floor.height / 2 - 0.025
      floorGroup.add(edge)

      floors.push({ group: floorGroup, slab, slabMat, pillars, content, edge, edgeMat, floor, baseY: floor.y + floor.height / 2 })
    })

    // Roof flag pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 8, 6)
    const poleMat = new THREE.MeshBasicMaterial({ color: pal.dim })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(0, FLOORS.reduce((a, f) => a + f.height, 0) + 4, 0)
    group.add(pole)

    // Flag
    const flagGeo = new THREE.PlaneGeometry(4, 2.5)
    const flagMat = new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
    const flag = new THREE.Mesh(flagGeo, flagMat)
    flag.position.set(2.5, FLOORS.reduce((a, f) => a + f.height, 0) + 7, 0)
    flag.rotation.y = -Math.PI / 4
    group.add(flag)

    return { group, bedrock, bedMat, floors, pole, poleMat, flag, flagMat, fossils }
  }

  function createFloorContent(floor, floorGroup, pal) {
    const content = new THREE.Group()
    floorGroup.add(content)

    switch (floor.name) {
      case 'Computer Lab': {
        // Terminal towers
        for (let i = 0; i < 8; i++) {
          const tGeo = new THREE.BoxGeometry(1.2, 2.5, 1.2)
          const tMat = new THREE.MeshBasicMaterial({
            color: pal.ion,
            transparent: true,
            opacity: 0.6,
            wireframe: true
          })
          const tower = new THREE.Mesh(tGeo, tMat)
          const angle = (i / 8) * Math.PI * 2
          const r = 6 + Math.random() * 3
          tower.position.set(Math.cos(angle) * r, 1.25, Math.sin(angle) * r)
          tower.userData = { baseY: 1.25, speed: 0.5 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2 }
          content.add(tower)
        }
        break
      }
      case 'Library': {
        // Floating book geometries
        for (let i = 0; i < 30; i++) {
          const bGeo = new THREE.BoxGeometry(0.8, 1.2, 0.15)
          const bMat = new THREE.MeshBasicMaterial({
            color: [pal.teal, pal.ion, pal.signal][i % 3],
            transparent: true,
            opacity: 0.4
          })
          const book = new THREE.Mesh(bGeo, bMat)
          book.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 4 + 2,
            (Math.random() - 0.5) * 20
          )
          book.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3)
          book.userData = { floatSpeed: 0.3 + Math.random() * 0.4, floatOff: Math.random() * Math.PI * 2 }
          content.add(book)
        }
        // Knowledge graph lines
        const lineGeo = new THREE.BufferGeometry()
        const linePos = []
        for (let i = 0; i < 50; i++) {
          const a = Math.random() * Math.PI * 2
          const r = Math.random() * 10
          linePos.push(Math.cos(a) * r, 2, Math.sin(a) * r)
          linePos.push((Math.random() - 0.5) * 20, 2 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 20)
        }
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
        const lineMat = new THREE.LineBasicMaterial({ color: pal.teal, transparent: true, opacity: 0.08 })
        content.add(new THREE.LineSegments(lineGeo, lineMat))
        break
      }
      case 'Science Lab': {
        // Molecular structures
        for (let i = 0; i < 12; i++) {
          const molGroup = new THREE.Group()
          const atoms = 4 + Math.floor(Math.random() * 4)
          for (let a = 0; a < atoms; a++) {
            const atomGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8)
            const atomMat = new THREE.MeshBasicMaterial({
              color: [pal.plasma, pal.ion, pal.em][a % 3],
              transparent: true,
              opacity: 0.7
            })
            const atom = new THREE.Mesh(atomGeo, atomMat)
            const angle = (a / atoms) * Math.PI * 2
            atom.position.set(Math.cos(angle) * 1.2, (Math.random() - 0.5) * 0.5, Math.sin(angle) * 1.2)
            molGroup.add(atom)
          }
          molGroup.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 4 + 2,
            (Math.random() - 0.5) * 20
          )
          molGroup.userData = { rotSpeed: 0.005 + Math.random() * 0.01 }
          content.add(molGroup)
        }
        break
      }
      case 'Sports Ground': {
        // Particle field with collaboration vectors
        const pCount = 100
        const pGeo = new THREE.BufferGeometry()
        const pPos = new Float32Array(pCount * 3)
        for (let i = 0; i < pCount; i++) {
          pPos[i * 3] = (Math.random() - 0.5) * 24
          pPos[i * 3 + 1] = 1.5
          pPos[i * 3 + 2] = (Math.random() - 0.5) * 24
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
        const pMat = new THREE.PointsMaterial({
          color: pal.em,
          size: 0.2,
          transparent: true,
          opacity: 0.5
        })
        const particles = new THREE.Points(pGeo, pMat)
        particles.userData = { positions: pPos }
        content.add(particles)
        break
      }
    }

    return content
  }

  // ==================== MAIN BUILDER ====================
  window.KnowledgeArchitecture = function buildKnowledgeArchitecture(scene, camera, renderer, { mouseX, mouseY }) {
    camera.position.set(0, 15, 45)
    camera.lookAt(0, 10, 0)

    const root = new THREE.Group()
    scene.add(root)

    const pal = getPal()
    const building = createBuilding()
    root.add(building.group)

    // Theme sync
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false

      building.bedMat.color.setHex(p.void2)
      building.floors.forEach(f => {
        f.slabMat.color.setHex(p.panel)
        f.pillars.forEach(pl => pl.material.color.setHex(p[f.floor.colorKey]))
        f.edgeMat.color.setHex(p[f.floor.colorKey])
        f.content.traverse(obj => {
          if (obj.material) {
            if (obj.material.color) {
              // Determine which palette key based on floor
              obj.material.color.setHex(p[f.floor.colorKey])
            }
          }
        })
      })
      building.poleMat.color.setHex(p.dim)
      building.flagMat.color.setHex(p.signal)
      building.fossils.forEach(f => f.material.color.setHex(p.ion))

      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
    }
    applyTheme()
    if (window.ThemeSync) window.ThemeSync.onChange(applyTheme)

    // Animation
    return function update(time) {
      // Subtle building sway
      root.rotation.y += (mouseX() * 0.1 - root.rotation.y) * 0.005
      root.rotation.x += (mouseY() * 0.05 - root.rotation.x) * 0.005

      // Floor content animations
      building.floors.forEach((f, fi) => {
        f.content.traverse(obj => {
          if (obj.userData.floatSpeed) {
            obj.position.y = obj.userData.baseY + Math.sin(time * obj.userData.floatSpeed + obj.userData.floatOff) * 0.15
          }
          if (obj.userData.rotSpeed) {
            obj.rotation.y += obj.userData.rotSpeed
          }
          if (obj.userData.speed) {
            // Terminal tower subtle pulse
            obj.scale.y = 1 + Math.sin(time * obj.userData.speed + obj.userData.offset) * 0.05
          }
        })
      })

      // Flag wave
      if (building.flag) {
        building.flag.rotation.z = Math.sin(time * 0.8) * 0.15
        building.flag.position.x = 2.5 + Math.sin(time * 0.5) * 0.3
      }
    }
  }
})()