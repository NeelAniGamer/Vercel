const fs = require('fs');

const col3d = fs.readFileSync('col-3d.js', 'utf8');

const startTag = 'var scenes = {';
const endTag = '    // Find the right scene';

const startIdx = col3d.indexOf(startTag);
const endIdx = col3d.indexOf(endTag);

if (startIdx === -1 || endIdx === -1) {
    console.error('Tags not found');
    process.exit(1);
}

const before = col3d.substring(0, startIdx + startTag.length);
const after = col3d.substring(endIdx);

const newScenes = `
      // HOME — Combines the literal shapes of all apps
      home: function () {
        camera.position.set(0, 6, 65)
        var allMats = []
        var root = new THREE.Group()
        scene.add(root)

        // Center Sun (Solar)
        var sunGeo = new THREE.IcosahedronGeometry(4, 2)
        var sunMat = new THREE.MeshBasicMaterial({ color: P().signal, transparent:true, opacity:0.9 })
        allMats.push({mat:sunMat, key:'signal'})
        var sun = new THREE.Mesh(sunGeo, sunMat)
        root.add(sun)

        // RPG Sword
        var swordGroup = new THREE.Group()
        var blade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, 6, 4), new THREE.MeshBasicMaterial({color: P().ion, wireframe:true}))
        var hilt = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.4), new THREE.MeshBasicMaterial({color: P().plasma}))
        var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 8), new THREE.MeshBasicMaterial({color: P().teal}))
        blade.position.y = 3
        handle.position.y = -1
        swordGroup.add(blade); swordGroup.add(hilt); swordGroup.add(handle)
        allMats.push({mat:blade.material, key:'ion'}, {mat:hilt.material, key:'plasma'}, {mat:handle.material, key:'teal'})
        swordGroup.position.set(-15, 0, -10)
        root.add(swordGroup)

        // QR Scanner Grid
        var qrGroup = new THREE.Group()
        var grid = new THREE.GridHelper(8, 8, P().em, P().em)
        grid.material.transparent = true; grid.material.opacity = 0.5
        allMats.push({mat:grid.material, key:'em'})
        var beam = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), new THREE.MeshBasicMaterial({color: P().em, transparent:true, opacity:0.8, side: THREE.DoubleSide}))
        beam.rotation.x = Math.PI/2
        qrGroup.add(grid); qrGroup.add(beam)
        qrGroup.position.set(15, 0, -5)
        qrGroup.rotation.x = 0.5
        allMats.push({mat:beam.material, key:'em'})
        root.add(qrGroup)

        // ATI Letters
        var atiGroup = new THREE.Group()
        var textShapes = []
        var letters = ['A','T','I','C','O','L']
        for(let i=0; i<6; i++) {
           let letterBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.2), new THREE.MeshBasicMaterial({color: P().teal, wireframe:true}))
           letterBox.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10)
           textShapes.push(letterBox)
           atiGroup.add(letterBox)
           allMats.push({mat:letterBox.material, key:'teal'})
        }
        atiGroup.position.set(-8, 10, -15)
        root.add(atiGroup)

        // Traffic Light
        var trafficGroup = new THREE.Group()
        var housing = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2), new THREE.MeshBasicMaterial({color: P().dim, wireframe:true}))
        var rL = new THREE.Mesh(new THREE.SphereGeometry(0.7,8,8), new THREE.MeshBasicMaterial({color: P().signal}))
        var yL = new THREE.Mesh(new THREE.SphereGeometry(0.7,8,8), new THREE.MeshBasicMaterial({color: P().signal}))
        var gL = new THREE.Mesh(new THREE.SphereGeometry(0.7,8,8), new THREE.MeshBasicMaterial({color: P().em}))
        rL.position.set(0, 2, 0); yL.position.set(0, 0, 0); gL.position.set(0, -2, 0)
        trafficGroup.add(housing); trafficGroup.add(rL); trafficGroup.add(yL); trafficGroup.add(gL)
        trafficGroup.position.set(10, 8, -20)
        allMats.push({mat:housing.material, key:'dim'}, {mat:rL.material, key:'signal'}, {mat:yL.material, key:'signal'}, {mat:gL.material, key:'em'})
        root.add(trafficGroup)
        
        // Gesture Hand
        var handGroup = new THREE.Group()
        var palm = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.5), new THREE.MeshBasicMaterial({color: P().ion, wireframe:true}))
        handGroup.add(palm)
        allMats.push({mat:palm.material, key:'ion'})
        for(let i=0; i<5; i++) {
            let finger = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), new THREE.MeshBasicMaterial({color: P().plasma, wireframe:true}))
            finger.position.set(-0.8 + i*0.4, 1.5 + (i===2?0.5:0) - (i===0||i===4?0.3:0), 0)
            handGroup.add(finger)
            allMats.push({mat:finger.material, key:'plasma'})
        }
        handGroup.position.set(0, -8, -10)
        root.add(handGroup)

        function applyTheme() {
          var pal = P(), lm = document.body.classList.contains('lm')
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
          scene.fog.color.setHex(lm ? 0xeef2ff : 0x070a14)
          canvas.style.opacity = lm ? '0.65' : '1'
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:['class'] })

        return function (time) {
          sun.rotation.y += 0.01
          swordGroup.rotation.y += 0.02
          swordGroup.position.y = Math.sin(time*2)*2
          beam.position.z = Math.sin(time*3)*4
          qrGroup.rotation.z += 0.01
          textShapes.forEach((s, i) => { s.rotation.x += 0.02; s.rotation.y += 0.03; s.position.y += Math.sin(time+i)*0.02 })
          atiGroup.rotation.y -= 0.01
          trafficGroup.rotation.y = time * 0.5
          handGroup.rotation.y = Math.sin(time)*0.5
          handGroup.rotation.x = Math.cos(time)*0.2
          root.rotation.y += (mouseX*0.2 - root.rotation.y)*0.02
          root.rotation.x += (mouseY*0.1 - root.rotation.x)*0.02
        }
      },

      ati: function () {
        camera.position.set(0, 0, 40)
        var allMats = []
        var group = new THREE.Group()
        scene.add(group)
        
        // Terminal Box
        var termGeo = new THREE.BoxGeometry(20, 15, 10)
        var termMat = new THREE.MeshBasicMaterial({ color: P().teal, wireframe: true, transparent:true, opacity:0.3 })
        allMats.push({mat:termMat, key:'teal'})
        var term = new THREE.Mesh(termGeo, termMat)
        group.add(term)
        
        // Floating letters
        var letters = []
        for(let i=0; i<30; i++) {
           let letterBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.2), new THREE.MeshBasicMaterial({color: P().signal, wireframe:true, transparent:true, opacity:0.8}))
           letterBox.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*30, (Math.random()-0.5)*20)
           letters.push(letterBox)
           group.add(letterBox)
           allMats.push({mat:letterBox.material, key:'signal'})
        }

        function applyTheme() {
          var pal = P()
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:["class"] })

        return function(time) {
          term.rotation.y = Math.sin(time*0.5)*0.2 + mouseX*0.1
          term.rotation.x = Math.cos(time*0.3)*0.1 + mouseY*0.1
          letters.forEach((l, i) => {
            l.rotation.x += 0.01; l.rotation.y += 0.02
            l.position.y += Math.sin(time*2 + i)*0.05
          })
          group.rotation.y += (mouseX*0.2 - group.rotation.y)*0.05
        }
      },

      solar: function () {
        camera.position.set(0, 10, 60)
        var allMats = []
        var group = new THREE.Group()
        scene.add(group)
        
        // Sun
        var sun = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 2), new THREE.MeshBasicMaterial({color: P().signal, wireframe:false}))
        allMats.push({mat:sun.material, key:'signal'})
        group.add(sun)
        
        // Planets
        var planets = []
        var pData = [ {r:15, s:1, c:'ion', spd:0.02}, {r:25, s:2, c:'teal', spd:0.01}, {r:35, s:1.5, c:'plasma', spd:0.007} ]
        pData.forEach(d => {
           var p = new THREE.Mesh(new THREE.SphereGeometry(d.s, 8, 8), new THREE.MeshBasicMaterial({color: P()[d.c], wireframe:true}))
           allMats.push({mat:p.material, key:d.c})
           var orbit = new THREE.Group()
           orbit.add(p)
           p.position.x = d.r
           orbit.userData = {spd: d.spd}
           group.add(orbit)
           planets.push(orbit)
           
           // Orbit ring
           var ring = new THREE.Mesh(new THREE.RingGeometry(d.r-0.1, d.r+0.1, 64), new THREE.MeshBasicMaterial({color: P().dim, side:THREE.DoubleSide, transparent:true, opacity:0.3}))
           ring.rotation.x = Math.PI/2
           group.add(ring)
           allMats.push({mat:ring.material, key:'dim'})
        })

        function applyTheme() {
          var pal = P()
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:["class"] })

        return function(time) {
          sun.rotation.y += 0.005
          planets.forEach(p => p.rotation.y += p.userData.spd)
          group.rotation.x = 0.2 + mouseY*0.1
          group.rotation.y = mouseX*0.2
        }
      },

      qr: function () {
        camera.position.set(0, 15, 40)
        var allMats = []
        var group = new THREE.Group()
        scene.add(group)
        
        // Grid
        var grid = new THREE.GridHelper(40, 20, P().em, P().em)
        grid.material.transparent = true; grid.material.opacity = 0.3
        allMats.push({mat:grid.material, key:'em'})
        group.add(grid)
        
        // Floating Data Blocks
        var blocks = []
        for(let i=0; i<40; i++) {
           let b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshBasicMaterial({color: P().teal, wireframe:true, transparent:true, opacity:0.5}))
           b.position.set((Math.random()-0.5)*35, Math.random()*5, (Math.random()-0.5)*35)
           blocks.push(b)
           group.add(b)
           allMats.push({mat:b.material, key:'teal'})
        }

        // Scanner Beam
        var beam = new THREE.Mesh(new THREE.PlaneGeometry(40, 2), new THREE.MeshBasicMaterial({color: P().em, transparent:true, opacity:0.8, side: THREE.DoubleSide}))
        beam.rotation.x = Math.PI/2
        allMats.push({mat:beam.material, key:'em'})
        group.add(beam)

        function applyTheme() {
          var pal = P()
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:["class"] })

        return function(time) {
          beam.position.z = Math.sin(time*2) * 18
          blocks.forEach((b, i) => { b.rotation.y += 0.01; b.position.y = 1 + Math.sin(time*2 + i)*0.5 })
          group.rotation.y = mouseX*0.1
          group.rotation.x = 0.2 + mouseY*0.1
        }
      },

      rpg: function () {
        camera.position.set(0, 0, 40)
        var allMats = []
        var group = new THREE.Group()
        scene.add(group)
        
        // Sword
        var sword = new THREE.Group()
        var blade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.5, 15, 4), new THREE.MeshBasicMaterial({color: P().ion, wireframe:true}))
        var hilt = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 1), new THREE.MeshBasicMaterial({color: P().plasma}))
        var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), new THREE.MeshBasicMaterial({color: P().teal}))
        blade.position.y = 8
        handle.position.y = -2
        sword.add(blade); sword.add(hilt); sword.add(handle)
        allMats.push({mat:blade.material, key:'ion'}, {mat:hilt.material, key:'plasma'}, {mat:handle.material, key:'teal'})
        group.add(sword)

        // Floating gems
        var gems = []
        for(let i=0; i<15; i++) {
           let g = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({color: P().signal, wireframe:true}))
           g.position.set((Math.random()-0.5)*30, (Math.random()-0.5)*30, (Math.random()-0.5)*20)
           gems.push(g)
           group.add(g)
           allMats.push({mat:g.material, key:'signal'})
        }

        function applyTheme() {
          var pal = P()
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:["class"] })

        return function(time) {
          sword.rotation.y = time*0.5
          sword.position.y = Math.sin(time*2)*2
          sword.rotation.z = Math.sin(time)*0.2
          gems.forEach((g, i) => { g.rotation.x += 0.02; g.rotation.y += 0.02; g.position.y += Math.sin(time*3 + i)*0.05 })
          group.rotation.x = mouseY*0.1
          group.rotation.y += (mouseX*0.2 - group.rotation.y)*0.05
        }
      },

      gesture: function () {
        camera.position.set(0, 0, 40)
        var allMats = []
        var group = new THREE.Group()
        scene.add(group)
        
        // Camera / Lens or Hand
        var hand = new THREE.Group()
        var palm = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 1), new THREE.MeshBasicMaterial({color: P().ion, wireframe:true}))
        hand.add(palm)
        allMats.push({mat:palm.material, key:'ion'})
        for(let i=0; i<5; i++) {
            let finger = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), new THREE.MeshBasicMaterial({color: P().plasma, wireframe:true}))
            finger.position.set(-2 + i*1, 4 + (i===2?1:0) - (i===0||i===4?0.5:0), 0)
            hand.add(finger)
            allMats.push({mat:finger.material, key:'plasma'})
        }
        group.add(hand)

        function applyTheme() {
          var pal = P()
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:["class"] })

        return function(time) {
          hand.rotation.y = Math.sin(time)*0.3 + mouseX*0.2
          hand.rotation.x = Math.cos(time*0.8)*0.2 + mouseY*0.2
        }
      },

      driving: function () {
        camera.position.set(0, 5, 50)
        var allMats = []
        var group = new THREE.Group()
        scene.add(group)
        
        // Traffic Light
        var traffic = new THREE.Group()
        var housing = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), new THREE.MeshBasicMaterial({color: P().dim, wireframe:true}))
        var rL = new THREE.Mesh(new THREE.SphereGeometry(1.5,8,8), new THREE.MeshBasicMaterial({color: P().signal}))
        var yL = new THREE.Mesh(new THREE.SphereGeometry(1.5,8,8), new THREE.MeshBasicMaterial({color: P().signal}))
        var gL = new THREE.Mesh(new THREE.SphereGeometry(1.5,8,8), new THREE.MeshBasicMaterial({color: P().em}))
        rL.position.set(0, 4, 0); yL.position.set(0, 0, 0); gL.position.set(0, -4, 0)
        traffic.add(housing); traffic.add(rL); traffic.add(yL); traffic.add(gL)
        traffic.position.set(-15, 0, -10)
        allMats.push({mat:housing.material, key:'dim'}, {mat:rL.material, key:'signal'}, {mat:yL.material, key:'signal'}, {mat:gL.material, key:'em'})
        group.add(traffic)

        // Cars
        var cars = []
        for(let i=0; i<8; i++) {
           let car = new THREE.Group()
           let body = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 3), new THREE.MeshBasicMaterial({color: P().ion, wireframe:true}))
           let top = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 2.5), new THREE.MeshBasicMaterial({color: P().teal, wireframe:true}))
           top.position.y = 1.75
           car.add(body); car.add(top)
           car.position.set(20 + Math.random()*20, (Math.random()-0.5)*15, (Math.random()-0.5)*30)
           car.userData = {spd: 0.2 + Math.random()*0.3}
           cars.push(car)
           group.add(car)
           allMats.push({mat:body.material, key:'ion'}, {mat:top.material, key:'teal'})
        }

        function applyTheme() {
          var pal = P()
          allMats.forEach(function(e){ e.mat.color.setHex(pal[e.key]) })
        }
        applyTheme()
        new MutationObserver(applyTheme).observe(document.body,{ attributes:true, attributeFilter:["class"] })

        return function(time) {
          traffic.rotation.y = time*0.5
          rL.material.opacity = Math.sin(time*2) > 0.5 ? 1 : 0.2; rL.material.transparent = true
          yL.material.opacity = Math.sin(time*2 + 2) > 0.5 ? 1 : 0.2; yL.material.transparent = true
          gL.material.opacity = Math.sin(time*2 + 4) > 0.5 ? 1 : 0.2; gL.material.transparent = true
          
          cars.forEach(c => {
             c.position.x -= c.userData.spd
             if(c.position.x < -40) c.position.x = 40 + Math.random()*20
          })
          group.rotation.y = mouseX*0.1
          group.rotation.x = mouseY*0.1
        }
      },

      about: function () {
`;

const newContent = before + newScenes + after.substring(after.indexOf('about: function () {') + 20);
fs.writeFileSync('col-3d.js', newContent);
console.log('Successfully updated col-3d.js!');
