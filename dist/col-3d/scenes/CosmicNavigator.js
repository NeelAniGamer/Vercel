// col-3d/scenes/CosmicNavigator.js — Career page "Cosmic Career Navigator"
// Five galaxy arms radiating from central "Future Self" black hole

;(function () {
  'use strict'

  function getPal() {
    return window.ThemeSync ? window.ThemeSync.getPalette() : {
      signal: 0xf2b84b, ion: 0x5ed4f5, teal: 0x00f0cc, plasma: 0xb89bff, em: 0x34d399, dim: 0x8891aa
    }
  }

  // Career categories = galaxy arms
  const ARMS = [
    {
      id: 'tech',
      name: 'Technology',
      colorKey: 'ion',       // indigo/cyan
      count: 7,
      icon: '⚡',
      systems: ['AI/ML', 'Cybersecurity', 'Cloud/DevOps', 'Data Science', 'Web3', 'Quantum', 'Robotics']
    },
    {
      id: 'eco',
      name: 'Sustainability',
      colorKey: 'em',        // green
      count: 3,
      icon: '🌿',
      systems: ['Climate Tech', 'AgriTech', 'Ocean Science']
    },
    {
      id: 'human',
      name: 'Human Sciences',
      colorKey: 'plasma',    // pink/purple
      count: 4,
      icon: '💜',
      systems: ['Biotech', 'Neuroscience/BCI', 'Digital Health', 'Psychology']
    },
    {
      id: 'biz',
      name: 'Business',
      colorKey: 'signal',    // gold/amber
      count: 2,
      icon: '📊',
      systems: ['Strategy', 'Finance']
    },
    {
      id: 'creative',
      name: 'Creative',
      colorKey: 'teal',      // cyan/teal
      count: 2,
      icon: '🎨',
      systems: ['Design', 'Media Arts']
    }
  ]

  function createGalaxyArm(arm, pal) {
    const group = new THREE.Group()
    const systems = []

    // Arm curve (logarithmic spiral)
    const curvePoints = []
    for (let i = 0; i <= 50; i++) {
      const t = i / 50
      const angle = t * Math.PI * 3 // 1.5 rotations
      const radius = 5 + t * 45
      curvePoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(t * Math.PI * 2) * 2, // slight wave
        Math.sin(angle) * radius
      ))
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints)

    // Arm spine (tube)
    const spineGeo = new THREE.TubeGeometry(curve, 100, 0.3, 8, false)
    const spineMat = new THREE.MeshBasicMaterial({
      color: pal[arm.colorKey],
      transparent: true,
      opacity: 0.1,
      wireframe: true
    })
    const spine = new THREE.Mesh(spineGeo, spineMat)
    group.add(spine)

    // Systems along arm
    for (let i = 0; i < arm.count; i++) {
      const t = (i + 0.5) / arm.count
      const pos = curve.getPoint(t)
      const tangent = curve.getTangent(t)
      const normal = new THREE.Vector3(0, 1, 0).cross(tangent).normalize()

      const sysGroup = new THREE.Group()
      sysGroup.position.copy(pos)
      sysGroup.lookAt(pos.clone().add(tangent))

      // System core
      const coreGeo = new THREE.IcosahedronGeometry(0.8 + Math.random() * 0.4, 1)
      const coreMat = new THREE.MeshBasicMaterial({
        color: pal[arm.colorKey],
        transparent: true,
        opacity: 0.7,
        wireframe: true
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      sysGroup.add(core)

      // Corona
      const coronaGeo = new THREE.IcosahedronGeometry(1.5, 0)
      const coronaMat = new THREE.MeshBasicMaterial({
        color: pal[arm.colorKey],
        transparent: true,
        opacity: 0.15
      })
      const corona = new THREE.Mesh(coronaGeo, coronaMat)
      sysGroup.add(corona)

      // Orbiting particles (roles)
      const particles = []
      const pCount = 5 + Math.floor(Math.random() * 5)
      for (let p = 0; p < pCount; p++) {
        const pGeo = new THREE.OctahedronGeometry(0.08, 0)
        const pMat = new THREE.MeshBasicMaterial({
          color: pal[arm.colorKey],
          transparent: true,
          opacity: 0.5
        })
        const particle = new THREE.Mesh(pGeo, pMat)
        const angle = (p / pCount) * Math.PI * 2
        const radius = 2 + Math.random() * 1.5
        particle.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.5, Math.sin(angle) * radius)
        particle.userData = { angle, radius, speed: 0.01 + Math.random() * 0.01 }
        sysGroup.add(particle)
        particles.push(particle)
      }

      // Accretion disk
      const diskGeo = new THREE.RingGeometry(2.2, 3.5, 32)
      const diskMat = new THREE.MeshBasicMaterial({
        color: pal[arm.colorKey],
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide
      })
      const disk = new THREE.Mesh(diskGeo, diskMat)
      disk.rotation.x = -Math.PI / 2
      sysGroup.add(disk)

      group.add(sysGroup)
      systems.push({ group: sysGroup, core, coreMat, corona, coronaMat, particles, disk, diskMat, tangent, normal, arm })
    }

    // Nebula background for arm
    const nebulaCount = 3
    const nebulas = []
    for (let n = 0; n < nebulaCount; n++) {
      const canvas = document.createElement('canvas')
      canvas.width = 128; canvas.height = 128
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, `rgba(${new THREE.Color(pal[arm.colorKey]).r * 255},${new THREE.Color(pal[arm.colorKey]).g * 255},${new THREE.Color(pal[arm.colorKey]).b * 255},0.1)`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128)
      const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending }))
      sprite.scale.set(30 + Math.random() * 20, 30 + Math.random() * 20, 1)
      sprite.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 60
      )
      group.add(sprite)
      nebulas.push({ sprite, mat: sprite.material })
    }

    return { group, systems, nebulas, curve, arm }
  }

  function createCentralBlackHole(pal) {
    const group = new THREE.Group()

    // Event horizon
    const horizonGeo = new THREE.SphereGeometry(3, 32, 32)
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.9
    })
    const horizon = new THREE.Mesh(horizonGeo, horizonMat)
    group.add(horizon)

    // Accretion disk (inner)
    const innerDiskGeo = new THREE.RingGeometry(3.2, 5, 64)
    const innerDiskMat = new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
    const innerDisk = new THREE.Mesh(innerDiskGeo, innerDiskMat)
    innerDisk.rotation.x = -Math.PI / 2
    group.add(innerDisk)

    // Outer accretion disk
    const outerDiskGeo = new THREE.RingGeometry(5.5, 8, 64)
    const outerDiskMat = new THREE.MeshBasicMaterial({
      color: pal.ion,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    })
    const outerDisk = new THREE.Mesh(outerDiskGeo, outerDiskMat)
    outerDisk.rotation.x = -Math.PI / 2
    group.add(outerDisk)

    // Relativistic jets
    const jetGeo = new THREE.CylinderGeometry(0.1, 0.5, 15, 8)
    const jetMat = new THREE.MeshBasicMaterial({
      color: pal.plasma,
      transparent: true,
      opacity: 0.3
    })
    const jetUp = new THREE.Mesh(jetGeo, jetMat)
    jetUp.position.y = 7.5
    group.add(jetUp)
    const jetDown = new THREE.Mesh(jetGeo, jetMat)
    jetDown.position.y = -7.5
    jetDown.rotation.x = Math.PI
    group.add(jetDown)

    // Gravitational lensing ring
    const lensGeo = new THREE.RingGeometry(10, 10.5, 128)
    const lensMat = new THREE.MeshBasicMaterial({
      color: pal.signal,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide
    })
    const lens = new THREE.Mesh(lensGeo, lensMat)
    lens.rotation.x = -Math.PI / 2
    group.add(lens)

    // Particle stream into horizon
    const streamCount = 200
    const streamGeo = new THREE.BufferGeometry()
    const streamPos = new Float32Array(streamCount * 3)
    const streamVel = []
    for (let i = 0; i < streamCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 8 + Math.random() * 20
      streamPos[i * 3] = Math.cos(angle) * radius
      streamPos[i * 3 + 1] = (Math.random() - 0.5) * 2
      streamPos[i * 3 + 2] = Math.sin(angle) * radius
      streamVel.push({
        angle,
        radius,
        speed: 0.02 + Math.random() * 0.03,
        inwardSpeed: 0.01 + Math.random() * 0.02
      })
    }
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3))
    const streamMat = new THREE.PointsMaterial({
      color: pal.signal,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const stream = new THREE.Points(streamGeo, streamMat)
    group.add(stream)

    return { group, horizon, horizonMat, innerDisk, innerDiskMat, outerDisk, outerDiskMat, jetUp, jetDown, jetMat, lens, lensMat, stream, streamMat, streamVel }
  }

  function createStarField(pal) {
    const starCount = 2000
    const pos = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)
    const colorChoices = [pal.ion, pal.signal, pal.plasma, 0xffffff]
    for (let i = 0; i < starCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400
      pos[i * 3 + 1] = (Math.random() - 0.5) * 400
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400
      const c = new THREE.Color(colorChoices[Math.floor(Math.random() * colorChoices.length)])
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
      sizes[i] = 0.2 + Math.random() * 0.5
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    const mat = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    })
    return new THREE.Points(geo, mat)
  }

  // ==================== MAIN BUILDER ====================
  window.CosmicNavigator = function buildCosmicNavigator(scene, camera, renderer, { mouseX, mouseY }) {
    camera.position.set(0, 0, 80)

    const root = new THREE.Group()
    scene.add(root)

    const pal = getPal()

    // Star field background
    const stars = createStarField(pal)
    root.add(stars)

    // Central black hole
    const blackHole = createCentralBlackHole(pal)
    root.add(blackHole.group)

    // Galaxy arms
    const arms = ARMS.map(arm => {
      const armObj = createGalaxyArm(arm, pal)
      root.add(armObj.group)
      return armObj
    })

    // Theme sync
    function applyTheme() {
      const p = getPal()
      const isLight = window.ThemeSync ? window.ThemeSync.isLight() : false

      // Stars
      stars.material.color.setHex(0xffffff)

      // Black hole
      blackHole.innerDiskMat.color.setHex(p.signal)
      blackHole.outerDiskMat.color.setHex(p.ion)
      blackHole.jetMat.color.setHex(p.plasma)
      blackHole.lensMat.color.setHex(p.signal)
      blackHole.streamMat.color.setHex(p.signal)

      // Arms
      arms.forEach(armObj => {
        armObj.spine.material.color.setHex(p[armObj.arm.colorKey])
        armObj.systems.forEach(sys => {
          sys.coreMat.color.setHex(p[armObj.arm.colorKey])
          sys.coronaMat.color.setHex(p[armObj.arm.colorKey])
          sys.particles.forEach(pt => pt.material.color.setHex(p[armObj.arm.colorKey]))
          sys.diskMat.color.setHex(p[armObj.arm.colorKey])
        })
        armObj.nebulas.forEach(n => {
          // Recreate nebulas on theme change (CanvasTexture can't easily change color)
          // For now, just update opacity
          n.mat.opacity = isLight ? 0.05 : 0.1
        })
      })

      if (scene.fog) scene.fog.color.setHex(isLight ? 0xeef2ff : 0x070a14)
    }
    applyTheme()
    if (window.ThemeSync) window.ThemeSync.onChange(applyTheme)

    // Animation
    return function update(time) {
      // Stars slow rotation
      stars.rotation.y += 0.00002
      stars.rotation.x += 0.00001

      // Black hole
      blackHole.horizon.rotation.y = time * 0.02
      blackHole.horizon.rotation.x = time * 0.01
      blackHole.innerDisk.rotation.z = time * 0.05
      blackHole.outerDisk.rotation.z = -time * 0.03
      blackHole.jetUp.scale.y = 1 + Math.sin(time * 2) * 0.2
      blackHole.jetDown.scale.y = 1 + Math.sin(time * 2) * 0.2
      blackHole.lens.rotation.z = time * 0.001

      // Particle stream into black hole
      const streamPos = blackHole.stream.geometry.attributes.position.array
      blackHole.streamVel.forEach((v, i) => {
        v.angle += v.speed
        v.radius -= v.inwardSpeed
        if (v.radius < 3.5) {
          v.radius = 8 + Math.random() * 20
          v.angle = Math.random() * Math.PI * 2
        }
        streamPos[i * 3] = Math.cos(v.angle) * v.radius
        streamPos[i * 3 + 2] = Math.sin(v.angle) * v.radius
      })
      blackHole.stream.geometry.attributes.position.needsUpdate = true

      // Galaxy arms
      arms.forEach(armObj => {
        armObj.systems.forEach(sys => {
          sys.core.rotation.y += 0.005
          sys.core.rotation.x += 0.003
          sys.corona.rotation.y = -time * 0.02
          sys.particles.forEach(p => {
            p.userData.angle += p.userData.speed
            p.position.x = Math.cos(p.userData.angle) * p.userData.radius
            p.position.z = Math.sin(p.userData.angle) * p.userData.radius
          })
          sys.disk.rotation.z += 0.002
        })
        armObj.nebulas.forEach(n => {
          n.sprite.rotation.z += 0.0002
        })
      })

      // Parallax
      root.rotation.y += (mouseX() * 0.08 - root.rotation.y) * 0.005
      root.rotation.x += (mouseY() * 0.04 - root.rotation.x) * 0.005
    }
  }
})()