// Indian Vehicles Procedural Builder - ULTIMATE EDITION
window.IndianVehicles = {
  textures: {},
  init: function () {
    // Grille texture
    this.textures.grille = this.createCanvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, 64, 64)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 4
      for (let i = 0; i < 64; i += 8) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(64, i)
        ctx.stroke()
      }
    })

    // Headlight texture
    this.textures.headlight = this.createCanvasTex(32, 32, (ctx) => {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.5, '#ffffcc')
      grad.addColorStop(1, '#aaaaaa')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    })

    // Taillight texture
    this.textures.taillight = this.createCanvasTex(32, 32, (ctx) => {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, '#ff3333')
      grad.addColorStop(0.7, '#cc0000')
      grad.addColorStop(1, '#660000')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    })

    // Indicator texture
    this.textures.indicator = this.createCanvasTex(16, 16, (ctx) => {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
      grad.addColorStop(0, '#ffaa00')
      grad.addColorStop(1, '#cc7700')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 16, 16)
    })

    // Glass texture with reflection
    this.textures.glass = this.createCanvasTex(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 64, 64)
      grad.addColorStop(0, '#1a2a3a')
      grad.addColorStop(0.4, '#2a3a4a')
      grad.addColorStop(0.6, '#1a2a3a')
      grad.addColorStop(1, '#0a1a2a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 64, 64)
      ctx.strokeStyle = '#4a5a6a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 64)
      ctx.lineTo(64, 0)
      ctx.stroke()
    })

    // Wheel texture with rim detail
    this.textures.wheel = this.createCanvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(32, 32, 32, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#444'
      ctx.beginPath()
      ctx.arc(32, 32, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#666'
      ctx.beginPath()
      ctx.arc(32, 32, 18, 0, Math.PI * 2)
      ctx.fill()
      // Rim spokes
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 3
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(32, 32)
        ctx.lineTo(32 + Math.cos(angle) * 16, 32 + Math.sin(angle) * 16)
        ctx.stroke()
      }
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(32, 32, 8, 0, Math.PI * 2)
      ctx.fill()
    })

    // Number plate texture
    this.textures.plate = this.createCanvasTex(64, 32, (ctx) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 64, 32)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, 62, 30)
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('MH 01', 32, 10)
      ctx.font = 'bold 10px Arial'
      ctx.fillText('AB 1234', 32, 22)
    })

    // Windshield wiper texture
    this.textures.wiper = this.createCanvasTex(32, 8, (ctx) => {
      ctx.fillStyle = '#222'
      ctx.fillRect(0, 0, 32, 8)
      ctx.fillStyle = '#444'
      ctx.fillRect(0, 2, 32, 4)
    })
  },

  createCanvasTex: function (w, h, drawFn) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    drawFn(ctx)
    const tex = new THREE.CanvasTexture(c)
    return tex
  },

<<<<<<< Updated upstream
  buildWheel: function () {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), new THREE.MeshToonMaterial({ color: 0x111111, map: this.textures.wheel }))
    w.rotation.z = Math.PI / 2
    return w
=======
  buildWheel: function (scale = 1.0) {
    const g = new THREE.Group()
    const tire = new THREE.Mesh(
      new THREE.TorusGeometry(0.3 * scale, 0.12 * scale, 8, 16),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    )
    tire.rotation.y = Math.PI / 2
    g.add(tire)

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 0.15 * scale, 12),
      new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 100 })
    )
    rim.rotation.z = Math.PI / 2
    g.add(rim)

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.18 * scale, 8),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    )
    hub.rotation.z = Math.PI / 2
    g.add(hub)

    return g
  },

  buildHeadlight: function (x, y, z, side = 1) {
    const g = new THREE.Group()
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.2, 0.15),
      new THREE.MeshPhongMaterial({ color: 0x222222 })
    )
    g.add(housing)

    const lens = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.18),
      new THREE.MeshBasicMaterial({ map: this.textures.headlight })
    )
    lens.position.z = 0.08
    g.add(lens)

    g.position.set(x, y, z)
    return g
  },

  buildTaillight: function (x, y, z) {
    const g = new THREE.Group()
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x111111 })
    )
    g.add(housing)

    const lens = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.13),
      new THREE.MeshBasicMaterial({ map: this.textures.taillight })
    )
    lens.position.z = -0.06
    lens.rotation.y = Math.PI
    g.add(lens)

    g.position.set(x, y, z)
    return g
  },

  buildIndicator: function (x, y, z, facing = 'front') {
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ map: this.textures.indicator })
    )
    lens.position.set(x, y, z)
    return lens
  },

  addFourWheels: function (g, w, l, wheelScale = 1.0) {
    const hw = w / 2
    const hl = l / 2
    const y = 0.35 * wheelScale
    const positions = [
      [-hw - 0.05, y, -hl + 0.6],
      [hw + 0.05, y, -hl + 0.6],
      [-hw - 0.05, y, hl - 0.6],
      [hw + 0.05, y, hl - 0.6]
    ]
    positions.forEach((p) => {
      const wheel = this.buildWheel(wheelScale)
      wheel.position.set(p[0], p[1], p[2])
      g.add(wheel)
    })
  },

  addBumper: function (g, w, l, y, z, color = 0x222222) {
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.1, 0.15, 0.2),
      new THREE.MeshPhongMaterial({ color: color })
    )
    bumper.position.set(0, y, z)
    g.add(bumper)
  },

  addMirror: function (g, x, y, z) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.05, 0.2),
      new THREE.MeshPhongMaterial({ color: 0x222222 })
    )
    arm.position.set(x, y, z)
    g.add(arm)

    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.05),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    )
    mirror.position.set(x + (x > 0 ? 0.1 : -0.1), y, z)
    g.add(mirror)
  },

  addRoofRails: function (g, w, l, y) {
    const railMat = new THREE.MeshPhongMaterial({ color: 0x555555 })
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, l * 0.7), railMat)
    rail1.position.set(-w / 2 + 0.1, y, 0)
    g.add(rail1)
    const rail2 = rail1.clone()
    rail2.position.x = w / 2 - 0.1
    g.add(rail2)
>>>>>>> Stashed changes
  },

  buildVehicle: function (type, colorHex) {
    if (!this.textures.grille) this.init()

    const g = new THREE.Group()
<<<<<<< Updated upstream
    const bMat = new THREE.MeshToonMaterial({ color: colorHex })
    const gMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: this.textures.glass, transparent: true, opacity: 0.7 })
    const grMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: this.textures.grille })
=======
    const bMat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 80 })
    const gMat = new THREE.MeshPhongMaterial({ color: 0xffffff, map: this.textures.glass, shininess: 100, transparent: true, opacity: 0.7 })
    const grMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: this.textures.grille })
    const chromeMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 120 })
>>>>>>> Stashed changes

    let body, roof

    // --- TWO WHEELERS ---
    if (type === 'splendor' || type === 'bike' || type === 'twowheeler') {
      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 1.4), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      frame.position.y = 0.7
      frame.rotation.x = 0.1
      g.add(frame)

      // Tank
      body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.5), bMat)
      body.position.set(0, 0.85, -0.1)
      g.add(body)

      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.6), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.95, 0.2)
      g.add(seat)

      // Headlight
      const hl = this.buildHeadlight(0, 0.8, -0.75)
      g.add(hl)

      // Taillight
      const tl = this.buildTaillight(0, 0.7, 0.65)
      g.add(tl)

      // Handlebar
      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), chromeMat)
      handlebar.position.set(0, 1.0, -0.6)
      g.add(handlebar)

      // Exhaust
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 8), chromeMat)
      exhaust.rotation.z = Math.PI / 2
      exhaust.position.set(0.25, 0.4, 0.2)
      g.add(exhaust)

      // Wheels
      const w1 = this.buildWheel(0.9)
      w1.position.set(0, 0.35, -0.6)
      const w2 = this.buildWheel(0.9)
      w2.position.set(0, 0.35, 0.6)
      g.add(w1, w2)
    } else if (type === 'activa' || type === 'scooter') {
      // Body
      body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 1.4), bMat)
      body.position.y = 0.5
      g.add(body)

      // Front panel
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), bMat)
      front.position.set(0, 0.7, -0.6)
      g.add(front)

      // Floor board
      const floor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.5), new THREE.MeshPhongMaterial({ color: 0x333333 }))
      floor.position.set(0, 0.35, -0.15)
      g.add(floor)

      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.5), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.75, 0.15)
      g.add(seat)

      // Headlight
      const hl = this.buildHeadlight(0, 0.85, -0.72)
      g.add(hl)

      // Taillight
      const tl = this.buildTaillight(0, 0.55, 0.7)
      g.add(tl)

      // Wheels
      const w1 = this.buildWheel(0.8)
      w1.position.set(0, 0.3, -0.55)
      const w2 = this.buildWheel(0.8)
      w2.position.set(0, 0.3, 0.55)
      g.add(w1, w2)
    }
    // --- THREE WHEELERS ---
    else if (type === 'auto') {
<<<<<<< Updated upstream
      // Auto Rickshaw (Yellow/Black or Green/Yellow)
      const aMat = new THREE.MeshToonMaterial({ color: 0x2e8b57 }) // Green body
      const rMat = new THREE.MeshToonMaterial({ color: 0xffd700 }) // Yellow roof
      body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 2.4), aMat)
      body.position.y = 0.6
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 2.0), rMat)
      roof.position.set(0, 1.5, 0.2)
=======
      // Auto Rickshaw (Indian style)
      const aMat = new THREE.MeshPhongMaterial({ color: 0x2e8b57 }) // Green body
      const rMat = new THREE.MeshPhongMaterial({ color: 0xffd700 }) // Yellow roof
      const blackMat = new THREE.MeshPhongMaterial({ color: 0x111111 })
>>>>>>> Stashed changes

      // Main body
      body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 2.2), aMat)
      body.position.y = 0.55
      g.add(body)

      // Roof
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.15, 2.0), rMat)
      roof.position.set(0, 1.35, 0.1)
      g.add(roof)

      // Roof pillars
      const pillarMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
      ;[-0.55, 0.55].forEach(x => {
        ;[-0.7, 0.7].forEach(z => {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), pillarMat)
          pillar.position.set(x, 1.0, z)
          g.add(pillar)
        })
      })

      // Front hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.8), aMat)
      hood.position.set(0, 0.5, -1.3)
      g.add(hood)

      // Windshield
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.05), gMat)
      windshield.position.set(0, 0.9, -0.9)
      windshield.rotation.x = -0.2
      g.add(windshield)

      // Headlight
      const hl = this.buildHeadlight(0, 0.6, -1.7)
      g.add(hl)

      // Taillight
      const tl = this.buildTaillight(0, 0.5, 1.1)
      g.add(tl)

      // Indicator
      ;[-0.5, 0.5].forEach(x => {
        const ind = this.buildIndicator(x, 0.6, -1.7)
        g.add(ind)
      })

      // Number plate
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: this.textures.plate }))
      plate.position.set(0, 0.35, -1.72)
      g.add(plate)

      // Wheels
      const w1 = this.buildWheel(0.9)
      w1.position.set(0, 0.35, -1.2)
      const w2 = this.buildWheel(0.8)
      w2.position.set(-0.55, 0.35, 0.8)
      const w3 = this.buildWheel(0.8)
      w3.position.set(0.55, 0.35, 0.8)
      g.add(w1, w2, w3)
    }
    // --- PASSENGER CARS ---
    else if (type === 'wagonr' || type === 'car') {
      // Maruti Suzuki WagonR style
      body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.2), bMat)
      body.position.y = 0.55
      g.add(body)

      // Cabin
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.8, 2.0), gMat)
      roof.position.set(0, 1.3, -0.1)
      g.add(roof)

      // Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 0.8), bMat)
      hood.position.set(0, 0.95, -1.5)
      g.add(hood)

      // Bumpers
      this.addBumper(g, 1.4, 0.15, 0.3, -1.65)
      this.addBumper(g, 1.4, 0.15, 0.3, 1.65)

      // Headlights
      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.55, -1.62)
        g.add(hl)
      })

      // Taillights
      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.55, 1.62)
        g.add(tl)
      })

      // Indicators
      ;[-0.6, 0.6].forEach(x => {
        g.add(this.buildIndicator(x, 0.5, -1.62))
        g.add(this.buildIndicator(x, 0.5, 1.62))
      })

      // Side mirrors
      this.addMirror(g, -0.8, 1.0, -0.3)
      this.addMirror(g, 0.8, 1.0, -0.3)

      // Number plate
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: this.textures.plate }))
      plate.position.set(0, 0.35, -1.63)
      g.add(plate)

      this.addFourWheels(g, 1.5, 3.2)
    } else if (type === 'creta' || type === 'suv') {
      // Hyundai Creta style SUV
      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 3.8), bMat)
      body.position.y = 0.75
      g.add(body)

      // Cabin
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.85, 2.4), gMat)
      roof.position.set(0, 1.6, -0.1)
      g.add(roof)

      // Hood (sloped)
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.0), bMat)
      hood.position.set(0, 1.15, -1.6)
      hood.rotation.x = 0.1
      g.add(hood)

      // Roof rails
      this.addRoofRails(g, 1.65, 2.4, 2.05)

      // Bumpers
      this.addBumper(g, 1.6, 0.2, 0.4, -1.95, 0x333333)
      this.addBumper(g, 1.6, 0.2, 0.4, 1.95, 0x333333)

      // Headlights (angular)
      ;[-0.6, 0.6].forEach(x => {
        const hl = this.buildHeadlight(x, 0.8, -1.9)
        g.add(hl)
      })

      // Taillights
      ;[-0.6, 0.6].forEach(x => {
        const tl = this.buildTaillight(x, 0.8, 1.9)
        g.add(tl)
      })

      // Side mirrors
      this.addMirror(g, -0.9, 1.2, -0.4)
      this.addMirror(g, 0.9, 1.2, -0.4)

      // Side steps
      const stepMat = new THREE.MeshPhongMaterial({ color: 0x333333 })
      ;[-0.85, 0.85].forEach(x => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 2.0), stepMat)
        step.position.set(x, 0.35, 0)
        g.add(step)
      })

      this.addFourWheels(g, 1.7, 3.8, 1.1)
    } else if (type === 'city' || type === 'sedan') {
      // Maruti City / Honda City style
      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 4.2), bMat)
      body.position.y = 0.55
      g.add(body)

      // Cabin
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 2.2), gMat)
      roof.position.set(0, 1.25, 0)
      g.add(roof)

      // Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.2), bMat)
      hood.position.set(0, 0.9, -1.8)
      g.add(hood)

      // Trunk
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.8), bMat)
      trunk.position.set(0, 0.9, 1.7)
      g.add(trunk)

      // Bumpers
      this.addBumper(g, 1.5, 0.15, 0.3, -2.15)
      this.addBumper(g, 1.5, 0.15, 0.3, 2.15)

      // Headlights
      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.55, -2.1)
        g.add(hl)
      })

      // Taillights
      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.55, 2.1)
        g.add(tl)
      })

      // Side mirrors
      this.addMirror(g, -0.85, 1.0, -0.5)
      this.addMirror(g, 0.85, 1.0, -0.5)

      this.addFourWheels(g, 1.6, 4.2)
    } else if (type === 'innova' || type === 'mpv') {
      // Toyota Innova style MPV
      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 4.4), bMat)
      body.position.y = 0.7
      g.add(body)

      // Cabin (tall)
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.9, 3.0), gMat)
      roof.position.set(0, 1.55, 0.1)
      g.add(roof)

      // Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.0), bMat)
      hood.position.set(0, 1.1, -1.9)
      g.add(hood)

      // Roof rails
      this.addRoofRails(g, 1.65, 3.0, 2.0)

      // Bumpers
      this.addBumper(g, 1.6, 0.2, 0.4, -2.25)
      this.addBumper(g, 1.6, 0.2, 0.4, 2.25)

      // Headlights
      ;[-0.6, 0.6].forEach(x => {
        const hl = this.buildHeadlight(x, 0.7, -2.2)
        g.add(hl)
      })

      // Taillights
      ;[-0.6, 0.6].forEach(x => {
        const tl = this.buildTaillight(x, 0.7, 2.2)
        g.add(tl)
      })

      // Side mirrors
      this.addMirror(g, -0.9, 1.2, -0.6)
      this.addMirror(g, 0.9, 1.2, -0.6)

      this.addFourWheels(g, 1.7, 4.4, 1.05)
    } else if (type === 'cab' || type === 'taxi') {
<<<<<<< Updated upstream
      // Dzire cab
      const wMat = new THREE.MeshToonMaterial({ color: 0xffffff })
      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3.8), wMat)
      body.position.y = 0.6
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.8), gMat)
      roof.position.set(0, 1.3, 0)

      // Taxi sign
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshToonMaterial({ color: 0xffd700 }))
      sign.position.set(0, 1.75, 0)
=======
      // Uber/Ola style cab (white sedan)
      const wMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 90 })
      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 4.0), wMat)
      body.position.y = 0.55
      g.add(body)

      // Cabin
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 2.0), gMat)
      roof.position.set(0, 1.25, 0)
      g.add(roof)
>>>>>>> Stashed changes

      // Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.0), wMat)
      hood.position.set(0, 0.9, -1.7)
      g.add(hood)

      // Taxi sign (roof top)
      const signBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      signBase.position.set(0, 1.65, 0)
      g.add(signBase)
      const signLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.25), new THREE.MeshBasicMaterial({ color: 0xffd700 }))
      signLight.position.set(0, 1.75, 0)
      g.add(signLight)

      // Bumpers
      this.addBumper(g, 1.5, 0.15, 0.3, -2.05)
      this.addBumper(g, 1.5, 0.15, 0.3, 2.05)

      // Headlights
      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.55, -2.0)
        g.add(hl)
      })

      // Taillights
      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.55, 2.0)
        g.add(tl)
      })

      // Side mirrors
      this.addMirror(g, -0.85, 1.0, -0.4)
      this.addMirror(g, 0.85, 1.0, -0.4)

      this.addFourWheels(g, 1.6, 4.0)
    }
    // --- COMMERCIAL VEHICLES ---
    else if (type === 'ace' || type === 'scv') {
<<<<<<< Updated upstream
      // Tata Ace
      body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.5), bMat)
      body.position.y = 0.65
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.2), bMat)
      cab.position.set(0, 1.6, -1.15)
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.3), new THREE.MeshToonMaterial({ color: 0x888888 }))
      bed.position.set(0, 1.2, 0.6)
      g.add(body, cab, bed)
      this.addFourWheels(g, 1.5, 3.5)
    } else if (type === 'truck' || type === 'eicher') {
      body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 7.0), new THREE.MeshToonMaterial({ color: 0x222222 }))
      body.position.y = 0.8
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.8), bMat)
      cab.position.set(0, 2.3, -2.6)
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 5.0), new THREE.MeshToonMaterial({ color: 0xaa4422 }))
      cargo.position.set(0, 2.5, 1.0)
      g.add(body, cab, cargo)
      this.addFourWheels(g, 2.4, 7.0, 0.5)
    }
    // --- PUBLIC TRANSPORT ---
    else if (type === 'bus' || type === 'msrtc') {
      const msrtcMat = new THREE.MeshToonMaterial({ color: 0xcc2222 }) // Red MSRTC bus
      body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 10.0), msrtcMat)
      body.position.y = 2.0
      const windows = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.2, 9.8), gMat)
      windows.position.y = 2.4
      g.add(body, windows)
=======
      // Tata Ace style mini truck
      body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 3.2), bMat)
      body.position.y = 0.6
      g.add(body)

      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.2), bMat)
      cab.position.set(0, 1.4, -1.2)
      g.add(cab)

      // Cargo bed
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 2.0), new THREE.MeshLambertMaterial({ color: 0x888888 }))
      bed.position.set(0, 1.1, 0.6)
      g.add(bed)

      // Bed rails
      const railMat = new THREE.MeshPhongMaterial({ color: 0x666666 })
      ;[-0.75, 0.75].forEach(x => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 2.0), railMat)
        rail.position.set(x, 1.55, 0.6)
        g.add(rail)
      })

      // Headlights
      ;[-0.5, 0.5].forEach(x => {
        const hl = this.buildHeadlight(x, 0.6, -1.8)
        g.add(hl)
      })

      // Taillights
      ;[-0.5, 0.5].forEach(x => {
        const tl = this.buildTaillight(x, 0.6, 1.6)
        g.add(tl)
      })

      this.addFourWheels(g, 1.4, 3.2, 0.9)
    } else if (type === 'truck' || type === 'eicher') {
      // Eicher/Ashok Leyland style truck
      const cabMat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 60 })
      const cargoColor = [0xaa4422, 0x886644, 0x556677, 0x884422][Math.floor(Math.random() * 4)]

      // Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 6.5), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      chassis.position.y = 0.5
      g.add(chassis)

      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 2.0), cabMat)
      cab.position.set(0, 1.8, -2.5)
      g.add(cab)

      // Windshield
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.08), gMat)
      windshield.position.set(0, 2.2, -3.5)
      windshield.rotation.x = -0.15
      g.add(windshield)

      // Cargo container
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 4.5), new THREE.MeshLambertMaterial({ color: cargoColor }))
      cargo.position.set(0, 2.3, 1.0)
      g.add(cargo)

      // Headlights
      ;[-0.7, 0.7].forEach(x => {
        const hl = this.buildHeadlight(x, 1.2, -3.5)
        g.add(hl)
      })

      // Taillights
      ;[-0.7, 0.7].forEach(x => {
        const tl = this.buildTaillight(x, 1.0, 3.25)
        g.add(tl)
      })

      // Side mirrors
      this.addMirror(g, -1.2, 2.0, -2.0)
      this.addMirror(g, 1.2, 2.0, -2.0)

      this.addFourWheels(g, 2.2, 6.5, 0.6)
    }
    // --- PUBLIC TRANSPORT ---
    else if (type === 'bus' || type === 'msrtc') {
      // MSRTC style bus
      const msrtcMat = new THREE.MeshPhongMaterial({ color: 0xcc2222 }) // Red MSRTC bus
      body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 9.5), msrtcMat)
      body.position.y = 1.8
      g.add(body)
>>>>>>> Stashed changes

      // Windows
      const windows = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.0, 9.3), gMat)
      windows.position.y = 2.2
      g.add(windows)

      // Roof
      const roofBus = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 9.4), new THREE.MeshPhongMaterial({ color: 0xdddddd }))
      roofBus.position.y = 3.3
      g.add(roofBus)

      // Front windshield (large)
      const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 0.08), gMat)
      frontWindshield.position.set(0, 2.4, -4.75)
      g.add(frontWindshield)

      // Destination board
      const destBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.1), new THREE.MeshBasicMaterial({ color: 0x00aa00 }))
      destBoard.position.set(0, 3.1, -4.78)
      g.add(destBoard)

      // Headlights
      ;[-0.8, 0.8].forEach(x => {
        const hl = this.buildHeadlight(x, 1.2, -4.78)
        g.add(hl)
      })

      // Taillights
      ;[-0.8, 0.8].forEach(x => {
        const tl = this.buildTaillight(x, 1.2, 4.78)
        g.add(tl)
      })

      // 6 wheels for heavy bus
      const y = 0.45
      const hw = 1.2
      const hl = 3.8
      const positions = [
        [-hw, y, -hl],
        [hw, y, -hl],
        [-hw, y, hl],
        [hw, y, hl],
        [-hw, y, hl - 1.5],
        [hw, y, hl - 1.5]
      ]
      positions.forEach((p) => {
        const w = this.buildWheel(1.3)
        w.position.set(p[0], p[1], p[2])
        g.add(w)
      })
    }
    // --- POLICE CAR ---
    else if (type === 'police') {
      const policeMat = new THREE.MeshPhongMaterial({ color: 0x111111 })
      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4.2), policeMat)
      body.position.y = 0.6
      g.add(body)

      // White stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.2, 4.22), new THREE.MeshPhongMaterial({ color: 0xffffff }))
      stripe.position.y = 0.6
      g.add(stripe)

      // Cabin
      roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 2.2), gMat)
      roof.position.set(0, 1.3, 0)
      g.add(roof)

      // Light bar
      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.3), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      lightBar.position.set(0, 1.75, 0)
      g.add(lightBar)

      // Red light
      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      redLight.position.set(-0.25, 1.85, 0)
      g.add(redLight)

      // Blue light
      const blueLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0000ff }))
      blueLight.position.set(0.25, 1.85, 0)
      g.add(blueLight)

      // POLICE text
      const policeText = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      policeText.position.set(0, 0.8, -2.11)
      g.add(policeText)

      // Bumpers
      this.addBumper(g, 1.6, 0.15, 0.3, -2.15)
      this.addBumper(g, 1.6, 0.15, 0.3, 2.15)

      // Headlights
      ;[-0.55, 0.55].forEach(x => {
        const hl = this.buildHeadlight(x, 0.6, -2.1)
        g.add(hl)
      })

      // Taillights
      ;[-0.55, 0.55].forEach(x => {
        const tl = this.buildTaillight(x, 0.6, 2.1)
        g.add(tl)
      })

      this.addFourWheels(g, 1.7, 4.2)
    }
    // --- AMBULANCE ---
    else if (type === 'ambulance') {
      const ambMat = new THREE.MeshPhongMaterial({ color: 0xffffff })
      body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 5.5), ambMat)
      body.position.y = 1.5
      g.add(body)

      // Red cross
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      crossH.position.set(0, 2.2, -2.76)
      g.add(crossH)
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      crossV.position.set(0, 2.2, -2.76)
      g.add(crossV)

      // Light bar
      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.4), new THREE.MeshPhongMaterial({ color: 0x222222 }))
      lightBar.position.set(0, 2.7, 0)
      g.add(lightBar)

      // Red light
      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      redLight.position.set(-0.3, 2.85, 0)
      g.add(redLight)

      // Blue light
      const blueLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0000ff }))
      blueLight.position.set(0.3, 2.85, 0)
      g.add(blueLight)

      // Headlights
      ;[-0.65, 0.65].forEach(x => {
        const hl = this.buildHeadlight(x, 1.2, -2.78)
        g.add(hl)
      })

      // Taillights
      ;[-0.65, 0.65].forEach(x => {
        const tl = this.buildTaillight(x, 1.2, 2.78)
        g.add(tl)
      })

      this.addFourWheels(g, 2.0, 5.5, 1.1)
    }
    // --- MOTORCYCLE variants ---
    else if (type === 'ktm' || type === 'sportbike') {
      // KTM Duke style
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 1.5), new THREE.MeshPhongMaterial({ color: 0xff6600 }))
      frame.position.y = 0.75
      frame.rotation.x = 0.15
      g.add(frame)

      // Tank
      body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), bMat)
      body.position.set(0, 0.9, -0.15)
      g.add(body)

      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.55), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 1.0, 0.25)
      g.add(seat)

      // Headlight (aggressive)
      const hl = this.buildHeadlight(0, 0.85, -0.8)
      g.add(hl)

      // Exhaust
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 8), chromeMat)
      exhaust.rotation.z = Math.PI / 2
      exhaust.position.set(0.3, 0.4, 0.25)
      g.add(exhaust)

      // Handlebar
      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.04), chromeMat)
      handlebar.position.set(0, 1.05, -0.55)
      g.add(handlebar)

      const w1 = this.buildWheel(0.85)
      w1.position.set(0, 0.35, -0.65)
      const w2 = this.buildWheel(0.85)
      w2.position.set(0, 0.35, 0.65)
      g.add(w1, w2)
    }
    // --- CYCLE ---
    else if (type === 'cycle') {
      // Bicycle
      const frameMat = new THREE.MeshPhongMaterial({ color: 0x222222 })

      // Frame tubes
      const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), frameMat)
      tube1.position.set(0, 0.7, -0.2)
      tube1.rotation.x = 0.3
      g.add(tube1)

      const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), frameMat)
      tube2.position.set(0, 0.6, 0.2)
      tube2.rotation.x = -0.4
      g.add(tube2)

      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.3), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.95, 0.2)
      g.add(seat)

      // Handlebar
      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), chromeMat)
      handlebar.position.set(0, 0.95, -0.5)
      g.add(handlebar)

      // Wheels (thin)
      const w1 = this.buildWheel(0.7)
      w1.scale.set(1, 1, 0.3)
      w1.position.set(0, 0.35, -0.45)
      const w2 = this.buildWheel(0.7)
      w2.scale.set(1, 1, 0.3)
      w2.position.set(0, 0.35, 0.45)
      g.add(w1, w2)
    }
    // --- TRACTOR ---
    else if (type === 'tractor') {
      const tractorMat = new THREE.MeshPhongMaterial({ color: 0x228B22 })

      // Body
      body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 2.5), tractorMat)
      body.position.y = 0.9
      g.add(body)

      // Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.5), gMat)
      cabin.position.set(0, 2.0, -0.3)
      g.add(cabin)

      // Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), tractorMat)
      hood.position.set(0, 1.2, -1.5)
      g.add(hood)

      // Exhaust pipe
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), new THREE.MeshPhongMaterial({ color: 0x333333 }))
      exhaust.position.set(0.6, 1.8, -1.0)
      g.add(exhaust)

      // Rear wheels (large)
      const w1 = this.buildWheel(1.4)
      w1.position.set(-0.7, 0.5, 0.8)
      const w2 = this.buildWheel(1.4)
      w2.position.set(0.7, 0.5, 0.8)
      g.add(w1, w2)

      // Front wheels (small)
      const w3 = this.buildWheel(0.7)
      w3.position.set(-0.5, 0.35, -1.0)
      const w4 = this.buildWheel(0.7)
      w4.position.set(0.5, 0.35, -1.0)
      g.add(w3, w4)
    }
    // --- AUTO RICKSHAW variants ---
    else if (type === 'auto_yellow') {
      // Yellow-black auto
      const yMat = new THREE.MeshPhongMaterial({ color: 0xffd700 })
      const bMat2 = new THREE.MeshPhongMaterial({ color: 0x111111 })

      body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 2.2), bMat2)
      body.position.y = 0.55
      g.add(body)

      roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.15, 2.0), yMat)
      roof.position.set(0, 1.35, 0.1)
      g.add(roof)

      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.8), yMat)
      hood.position.set(0, 0.5, -1.3)
      g.add(hood)

      const hl = this.buildHeadlight(0, 0.6, -1.7)
      g.add(hl)
      const tl = this.buildTaillight(0, 0.5, 1.1)
      g.add(tl)

      const w1 = this.buildWheel(0.9)
      w1.position.set(0, 0.35, -1.2)
      const w2 = this.buildWheel(0.8)
      w2.position.set(-0.55, 0.35, 0.8)
      const w3 = this.buildWheel(0.8)
      w3.position.set(0.55, 0.35, 0.8)
      g.add(w1, w2, w3)
    }
    // ---Default blocky car ---
    else {
      body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.8), bMat)
      body.position.y = 0.6
      g.add(body)

      roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 2.0), gMat)
      roof.position.set(0, 1.35, -0.2)
      g.add(roof)

      this.addBumper(g, 1.5, 0.15, 0.3, -1.95)
      this.addBumper(g, 1.5, 0.15, 0.3, 1.95)

      ;[-0.55, 0.55].forEach(x => {
        g.add(this.buildHeadlight(x, 0.55, -1.9))
        g.add(this.buildTaillight(x, 0.55, 1.9))
      })

      this.addFourWheels(g, 1.6, 3.8)
    }

    g.type = type

    // ── PER-TYPE SCALE ADJUSTMENTS ──
    // Bikes 0.6×, Trucks 1.5×, Buses 1.7× (relative to car baseline)
    if (type === 'splendor' || type === 'bike' || type === 'twowheeler' ||
        type === 'activa' || type === 'scooter' || type === 'cycle') {
      g.scale.set(0.6, 0.6, 0.6)
    } else if (type === 'truck' || type === 'eicher') {
      g.scale.set(1.5, 1.5, 1.5)
    } else if (type === 'bus' || type === 'msrtc') {
      g.scale.set(1.7, 1.7, 1.7)
    }

    return g
  }
}
