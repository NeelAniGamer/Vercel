/**
 * Character Studio & High-Fidelity Human Model Implementation for UI.js
 */

const SAMPLE_MODELS = [
  { id: 'player_sample', file: 'Models/sample.glb', name: 'Hero Protagonist', tag: 'Hero', icon: '🏃', desc: 'Default stylized protagonist avatar' }
]
window.SAMPLE_MODELS = SAMPLE_MODELS

const _buildSampleGLBPlayer = (isPlayer = true, app = {}) => {
  const g = new THREE.Group()
  const PM = window.PRELOADED_MODELS || {}
  
  const sampleDef = SAMPLE_MODELS[0]
  const baseModel = PM['player_sample'] || window['_sampleGLBModel_player_sample']

  const container = new THREE.Group()
  g.add(container)

  function setupScene(scene) {
    scene.traverse(function(c) {
      if (c.isMesh) {
        c.castShadow = true
        c.receiveShadow = true
        if (c.material) {
          c.material.roughness = 0.75
          c.material.metalness = 0.10
          if (c.material.map && window.THREE && THREE.sRGBEncoding) {
            c.material.map.encoding = THREE.sRGBEncoding
          }
        }
      }
    })

    // Universal Bounding-Box Height & Axis Normalizer
    scene.updateMatrixWorld(true)
    let box = new THREE.Box3().setFromObject(scene)
    let size = new THREE.Vector3()
    box.getSize(size)

    if (size.z > size.y && size.z > size.x) {
      scene.rotation.x = -Math.PI / 2
    } else if (size.x > size.y && size.x > size.z) {
      scene.rotation.z = Math.PI / 2
    }

    scene.updateMatrixWorld(true)
    box.setFromObject(scene)
    box.getSize(size)

    const targetHeight = isPlayer ? 1.75 : 1.55
    const currentHeight = Math.max(0.1, size.y)
    const scale = targetHeight / currentHeight
    scene.scale.multiplyScalar(scale)

    scene.updateMatrixWorld(true)
    box.setFromObject(scene)
    const center = new THREE.Vector3()
    box.getCenter(center)
    scene.position.x -= center.x
    scene.position.y -= box.min.y
    scene.position.z -= center.z

    scene.rotation.y = 0

    container.add(scene)
  }

  if (baseModel) {
    const clone = baseModel.clone ? baseModel.clone(true) : baseModel
    setupScene(clone)
  } else if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
    new THREE.GLTFLoader().load('Models/sample.glb', function(gltf) {
      window['_sampleGLBModel_player_sample'] = gltf.scene
      setupScene(gltf.scene)
    }, undefined, function(err) {
      console.warn('[Player] Models/sample.glb load error:', err)
    })
  }

  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), new THREE.MeshBasicMaterial({ visible: false }))
  hb.position.y = 0.9
  g.add(hb)

  const shadowBlob = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  )
  shadowBlob.rotation.x = -Math.PI / 2
  shadowBlob.position.y = 0.01
  g.add(shadowBlob)

  g.userData = {
    isGLB: true,
    isPlayer: isPlayer,
    isSampleGLB: true,
    shadowBlob: shadowBlob,
    container: container,
    t: 0,
    update: function(dt, speed) {
      const t = (this.t || 0) + dt * 9
      this.t = t
      const walkW = Math.min(Math.abs(speed || 0) * 3.5, 1)
      if (walkW > 0.05) {
        container.position.y = Math.abs(Math.sin(t * 2)) * 0.04 * walkW
        container.rotation.z = Math.sin(t) * 0.025 * walkW
        container.rotation.x = Math.sin(t * 2) * 0.015 * walkW
      } else {
        container.position.y = Math.sin(t * 0.5) * 0.004
        container.rotation.z = 0
        container.rotation.x = 0
      }
    }
  }

  return g
}
window._buildSampleGLBPlayer = _buildSampleGLBPlayer

const _buildHuman = (isPlayer = false, appearance) => {
  const g = new THREE.Group()
  const app = (isPlayer && (() => { try { return JSON.parse(localStorage.getItem('traffic_appearance')) } catch(e){} return null })()) || appearance || {}
  const variant = app.variant || 'normal'
  const sk = isPlayer ? 0.80 : (variant === 'child' ? 0.58 : 0.74)

  // ── Minecraft Engine Support ─────────────────────────────────────────────
  if (app.charType === 'minecraft' && typeof window._buildMinecraftHuman === 'function') {
    return window._buildMinecraftHuman(isPlayer, app)
  }

  // ── Default GLB Player Character Support (sample.glb) ───────────────────
  if (isPlayer && (app.charType === 'sample' || !app.charType || app.charType === 'default' || app.charType === 'stylized')) {
    return _buildSampleGLBPlayer(isPlayer, app)
  }

  // ── NPC Pedestrians using 3D Hero/Citizen mesh ─────────────────────────
  if (!isPlayer && Math.random() < 0.35) {
    const npcSample = _buildSampleGLBPlayer(false, { variant })
    if (npcSample) return npcSample
  }

  const PM = window.PRELOADED_MODELS || {}

  // ── FBX-First Animated Character Model (NPCs only) ────────────────────────
  if (!isPlayer) {
    const fbxKey = app.animPack ? 'anim_' + app.animPack : 'anim_protagonists';
    const fbxChar = PM[fbxKey] || PM['anim_retro'] || PM['anim_survivors'];
    if (fbxChar && typeof THREE.AnimationMixer !== 'undefined' && variant === 'normal') {
      try {
        const fbxScene = fbxChar.clone ? fbxChar.clone(true) : fbxChar;
        fbxScene.scale.setScalar(sk * 0.0098);
        fbxScene.rotation.y = Math.PI;
        g.add(fbxScene);

        const mixer = new THREE.AnimationMixer(fbxScene);
        const idleFBX = PM[fbxKey + '_idle'] || PM['anim_protagonists_idle'];
        const runFBX = PM[fbxKey + '_run'] || PM['anim_protagonists_run'];
        let idleAction = null;
        let runAction = null;

        if (idleFBX && idleFBX.animations && idleFBX.animations.length > 0) {
          idleAction = mixer.clipAction(idleFBX.animations[0]);
          idleAction.play();
        } else if (fbxChar.animations && fbxChar.animations.length > 0) {
          idleAction = mixer.clipAction(fbxChar.animations[0]);
          idleAction.play();
        }
        if (runFBX && runFBX.animations && runFBX.animations.length > 0) {
          runAction = mixer.clipAction(runFBX.animations[0]);
          runAction.play();
        }

        const hb = new THREE.Mesh(new THREE.BoxGeometry(0.5*sk, 1.8*sk, 0.5*sk), new THREE.MeshBasicMaterial({ visible: false }));
        hb.position.y = 0.9 * sk;
        g.add(hb);

        const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.3*sk, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }));
        shadowBlob.rotation.x = -Math.PI/2; shadowBlob.position.y = 0.01;
        g.add(shadowBlob);

        g.userData = {
          isFBXAnimated: true,
          variant,
          isPlayer,
          _sk: sk,
          shadowBlob,
          mixer: mixer,
          idleAction: idleAction,
          runAction: runAction,
          t: Math.random() * 10,
          spd: 1.5,
          dir: 1
        };
        return g;
      } catch (e) {
        console.warn('FBX character instantiation fallback:', e);
      }
    }

    // ── GLB-First Character Model (NPCs) ──────────────────────────────────
    const maleKeys = ['char_m_a','char_m_b','char_m_c','char_m_d','char_m_e','char_m_f']
    const femaleKeys = ['char_f_a','char_f_b','char_f_c','char_f_d','char_f_e','char_f_f']
    const isFemale = app.gender === 'female' || Math.random() < 0.45
    const charKeys = isFemale ? femaleKeys : maleKeys
    const preferredKey = charKeys[Math.floor(Math.random() * charKeys.length)]
    const charGLB = PM[preferredKey]

    if (charGLB && charGLB.scene) {
      const charScene = charGLB.scene.clone(true)
      charScene.scale.setScalar(sk * 0.90)
      charScene.rotation.y = Math.PI

      const variantColors = {
        normal:    { shirt: app.shirt || [0x3498db,0x2ecc71,0x9b59b6,0xe67e22,0xe74c3c][Math.floor(Math.random()*5)] },
        elderly:   { shirt: 0xf5f0e1, pants: 0xe8dcc8 },
        child:     { shirt: 0xffffff, pants: 0x1a237e },
        guard:     { shirt: 0xff8c00, pants: 0x1a1a1a },
        volunteer: { shirt: 0xaaff00, pants: 0x1a1a1a },
        worker:    { shirt: 0xff8c00, pants: 0x333333 },
        commuter:  { shirt: 0x34495e, pants: 0x2c3e50 },
      }
      const vc = variantColors[variant] || variantColors.normal
      charScene.traverse(c => {
        if (!c.isMesh) return
        const nm = c.name.toLowerCase()
        if (nm.includes('shirt') || nm.includes('top') || nm.includes('torso') || nm.includes('body')) {
          c.material = c.material.clone()
          c.material.color.setHex(vc.shirt || 0x3498db)
        }
        if (vc.pants && (nm.includes('pant') || nm.includes('leg') || nm.includes('bottom'))) {
          c.material = c.material.clone()
          c.material.color.setHex(vc.pants)
        }
        c.castShadow = true
        c.receiveShadow = true
      })

      g.add(charScene)

      if (charGLB.animations && charGLB.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(charScene)
        const walkClip = charGLB.animations.find(a => /walk/i.test(a.name)) || charGLB.animations[0]
        const idleClip = charGLB.animations.find(a => /idle/i.test(a.name))
        const walkAction = mixer.clipAction(walkClip)
        const idleAction = idleClip ? mixer.clipAction(idleClip) : null
        walkAction.play()
        g.userData._mixer = mixer
        g.userData._walkAction = walkAction
        g.userData._idleAction = idleAction
        if (variant === 'elderly') walkAction.timeScale = 0.4
        if (variant === 'child') walkAction.timeScale = 1.3
      }

      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.6*sk, 1.8*sk, 0.6*sk), new THREE.MeshBasicMaterial({ visible: false }))
      hb.position.y = 0.9 * sk
      g.add(hb)

      const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.3*sk, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }))
      shadowBlob.rotation.x = -Math.PI/2; shadowBlob.position.y = 0.01
      g.add(shadowBlob)

      g.userData = {
        isGLB: true,
        variant,
        isPlayer: false,
        _sk: sk,
        shadowBlob,
        t: Math.random() * 10,
        spd: variant==='elderly' ? 0.7 : (variant==='child' ? 2.2 : 1.5 + Math.random()*1.5),
        dir: Math.random() > 0.5 ? 1 : -1,
        startZ: 0,
        idlePhase: Math.random() * Math.PI * 2,
        blinkTimer: Math.random() * 4 + 2,
        _mixer: g.userData._mixer || null
      }
      return g
    }
  }

  // ── HIGH-FIDELITY AAA STYLIZED 3D CHARACTER MODEL ─────────────────────────
  const npcSkins = [0xd4a574, 0xc68642, 0x8d5524, 0xf1c27d, 0xffdbac, 0xe0ac69]
  const npcShirts = [0x3498db, 0x2ecc71, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xe74c3c, 0x34495e]
  const npcPants = [0x555555, 0x2c3e50, 0x444444, 0x3d3d3d, 0x2d2d2d]
  const npcHairs = [0x1a1a1a, 0x3d2b1f, 0x654321, 0x8B4513, 0x2c1810, 0xb5651d]

  const skinColor = isPlayer ? (app.skin || 0xd4a574) : npcSkins[Math.floor(Math.random() * npcSkins.length)]
  const skinColorDk = new THREE.Color(skinColor).multiplyScalar(0.88).getHex()
  const hairColor = isPlayer ? (app.hair || 0x1a1a1a) : npcHairs[Math.floor(Math.random() * npcHairs.length)]
  const hairHighlight = isPlayer ? (app.hairHighlight || 0x3498db) : hairColor
  const shirtColor = isPlayer ? (app.shirt || 0xe74c3c) : npcShirts[Math.floor(Math.random() * npcShirts.length)]
  const shirtAccent = isPlayer ? (app.shirtAccent || 0xffffff) : 0xffffff
  const shirtDk = new THREE.Color(shirtColor).multiplyScalar(0.75).getHex()
  const pantsColor = isPlayer ? (app.pants || 0x2c3e50) : npcPants[Math.floor(Math.random() * npcPants.length)]
  const pantsDk = new THREE.Color(pantsColor).multiplyScalar(0.78).getHex()
  const shoeColor = isPlayer ? (app.shoes || 0x1a1a1a) : 0x222222
  const eyeColor = isPlayer ? (app.eyeColor || 0x4a90d9) : 0x3d2b1f

  const tGrad = window._toonGrad || null
  const SKIN = new THREE.MeshToonMaterial({ color: skinColor, gradientMap: tGrad })
  const SKIN2 = new THREE.MeshToonMaterial({ color: skinColorDk, gradientMap: tGrad })
  const HAIR = new THREE.MeshToonMaterial({ color: hairColor, gradientMap: tGrad })
  const HAIR_HI = new THREE.MeshToonMaterial({ color: hairHighlight, gradientMap: tGrad })
  const SHIRT = new THREE.MeshToonMaterial({ color: shirtColor, gradientMap: tGrad })
  const SHIRT_ACC = new THREE.MeshToonMaterial({ color: shirtAccent, gradientMap: tGrad })
  const SHIRT_DK = new THREE.MeshToonMaterial({ color: shirtDk, gradientMap: tGrad })
  const PANTS = new THREE.MeshToonMaterial({ color: pantsColor, gradientMap: tGrad })
  const PANTS_DK = new THREE.MeshToonMaterial({ color: pantsDk, gradientMap: tGrad })
  const SHOES = new THREE.MeshToonMaterial({ color: shoeColor, gradientMap: tGrad })
  const SHOE_SOLE = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: tGrad })
  const EYE_W = new THREE.MeshToonMaterial({ color: 0xffffff })
  const EYE_P = new THREE.MeshToonMaterial({ color: 0x111111 })
  const EYE_IRIS = new THREE.MeshToonMaterial({ color: eyeColor })
  const MOUTH = new THREE.MeshToonMaterial({ color: 0x8b4513 })
  const LIP_M = new THREE.MeshToonMaterial({ color: new THREE.Color(skinColor).multiplyScalar(0.92).getHex() })
  const NOSE_M = new THREE.MeshToonMaterial({ color: new THREE.Color(skinColor).multiplyScalar(0.95).getHex() })
  const EAR_INNER = new THREE.MeshToonMaterial({ color: new THREE.Color(skinColor).multiplyScalar(0.82).getHex() })
  const BELT = new THREE.MeshToonMaterial({ color: 0x222222 })
  const METALLIC = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.25 })
  const SILVER = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.9, roughness: 0.2 })
  const OLED = new THREE.MeshBasicMaterial({ color: 0x00f0cc })
  const REFLECTIVE = new THREE.MeshBasicMaterial({ color: 0xe8e8e8 })

  function limb(rT, rB, h, mat, segs = 12) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs, 1), mat)
  }
  function jointSphere(r, mat, segs = 12) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat)
  }

  // ─── 1. HEAD & FACE ──────────────────────────────────────────────
  const headGroup = new THREE.Group()
  headGroup.position.y = 1.72 * sk

  // Sculpted skull & jaw
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sk, 20, 16), SKIN)
  skull.scale.set(1, 1.05, 0.96)
  headGroup.add(skull)

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.21 * sk, 16, 12), SKIN2)
  jaw.position.set(0, -0.17 * sk, 0.10 * sk)
  jaw.scale.set(0.86, 0.58, 0.78)
  headGroup.add(jaw)

  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.045 * sk, 10, 8), SKIN)
  chin.position.set(0, -0.24 * sk, 0.17 * sk)
  headGroup.add(chin)

  // Ears
  ;[-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045 * sk, 10, 8), SKIN2)
    ear.position.set(s * 0.28 * sk, 0.02 * sk, 0.0)
    ear.scale.set(0.5, 0.8, 0.4)
    headGroup.add(ear)

    const earIn = new THREE.Mesh(new THREE.SphereGeometry(0.022 * sk, 8, 6), EAR_INNER)
    earIn.position.set(s * 0.285 * sk, 0.02 * sk, 0.006 * sk)
    earIn.scale.set(0.4, 0.7, 0.3)
    headGroup.add(earIn)
  })

  // Eyes & Eyelids
  const _eyeLids = []
  ;[-1, 1].forEach(s => {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 12, 10), EYE_W)
    ew.position.set(s * 0.105 * sk, 0.04 * sk, 0.235 * sk)
    ew.scale.set(1, 0.88, 0.6)
    headGroup.add(ew)

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.030 * sk, 10, 8), EYE_IRIS)
    iris.position.set(s * 0.105 * sk, 0.038 * sk, 0.260 * sk)
    headGroup.add(iris)

    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.016 * sk, 8, 6), EYE_P)
    ep.position.set(s * 0.105 * sk, 0.038 * sk, 0.272 * sk)
    headGroup.add(ep)

    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.007 * sk, 6, 4), EYE_W)
    hl.position.set(s * 0.095 * sk, 0.048 * sk, 0.276 * sk)
    headGroup.add(hl)

    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.054 * sk, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.45), SKIN)
    lid.position.set(s * 0.105 * sk, 0.068 * sk, 0.238 * sk)
    lid.scale.set(1, 0.7, 0.7)
    lid.rotation.x = -0.18
    headGroup.add(lid)
    _eyeLids.push(lid)

    // Eyebrow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.11 * sk, 0.020 * sk, 0.028 * sk), HAIR)
    brow.position.set(s * 0.105 * sk, 0.115 * sk, 0.238 * sk)
    brow.rotation.z = s * 0.12
    headGroup.add(brow)
  })

  // Nose
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.020 * sk, 0.028 * sk, 0.085 * sk, 10), NOSE_M)
  nose.position.set(0, -0.03 * sk, 0.265 * sk)
  nose.rotation.x = Math.PI / 2 + 0.15
  headGroup.add(nose)

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.024 * sk, 10, 8), NOSE_M)
  noseTip.position.set(0, -0.065 * sk, 0.282 * sk)
  headGroup.add(noseTip)

  // Lips
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.075 * sk, 0.014 * sk, 0.020 * sk), MOUTH)
  mouth.position.set(0, -0.115 * sk, 0.255 * sk)
  headGroup.add(mouth)

  const lip = new THREE.Mesh(new THREE.SphereGeometry(0.028 * sk, 10, 6), LIP_M)
  lip.position.set(0, -0.13 * sk, 0.25 * sk)
  lip.scale.set(1.2, 0.45, 0.5)
  headGroup.add(lip)

  // Facial Hair
  const facialHair = isPlayer ? (app.facialHair || 'none') : 'none'
  if (facialHair === 'stubble') {
    const stubble = new THREE.Mesh(new THREE.SphereGeometry(0.22 * sk, 14, 10), HAIR)
    stubble.position.set(0, -0.18 * sk, 0.10 * sk)
    stubble.scale.set(0.88, 0.60, 0.80)
    headGroup.add(stubble)
  } else if (facialHair === 'beard') {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.23 * sk, 16, 12), HAIR)
    beard.position.set(0, -0.19 * sk, 0.11 * sk)
    beard.scale.set(0.92, 0.68, 0.86)
    headGroup.add(beard)
  } else if (facialHair === 'mustache') {
    const stache = new THREE.Mesh(new THREE.TorusGeometry(0.06 * sk, 0.022 * sk, 8, 12, Math.PI * 0.8), HAIR)
    stache.position.set(0, -0.09 * sk, 0.26 * sk)
    stache.rotation.z = Math.PI * 0.1
    headGroup.add(stache)
  }

  // ─── 2. HAIRSTYLES (11 STYLES) ────────────────────────────────────
  const hairStyle = isPlayer ? (app.hairStyle || 'quiff') : 'quiff'
  if (hairStyle !== 'bald') {
    if (hairStyle === 'buzz' || hairStyle === 'short') {
      const buzz = new THREE.Mesh(new THREE.SphereGeometry(0.29 * sk, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), HAIR)
      buzz.position.set(0, 0.09 * sk, -0.01 * sk)
      buzz.scale.set(1.02, 0.6, 1.02)
      headGroup.add(buzz)
    } else if (hairStyle === 'long_waves' || hairStyle === 'long') {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.30 * sk, 16, 12), HAIR)
      crown.position.set(0, 0.10 * sk, -0.02 * sk)
      crown.scale.set(1.02, 0.65, 1.0)
      headGroup.add(crown)
      ;[-1, 1].forEach(s => {
        const flow = limb(0.08 * sk, 0.045 * sk, 0.38 * sk, HAIR, 10)
        flow.position.set(s * 0.21 * sk, -0.20 * sk, -0.05 * sk)
        flow.rotation.z = s * 0.08
        headGroup.add(flow)
      })
      const backFlow = limb(0.18 * sk, 0.12 * sk, 0.36 * sk, HAIR, 12)
      backFlow.position.set(0, -0.16 * sk, -0.16 * sk)
      headGroup.add(backFlow)
    } else if (hairStyle === 'ponytail') {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.29 * sk, 16, 12), HAIR)
      crown.position.set(0, 0.10 * sk, -0.01 * sk)
      crown.scale.set(1.0, 0.58, 1.0)
      headGroup.add(crown)
      const tail = limb(0.06 * sk, 0.035 * sk, 0.32 * sk, HAIR, 10)
      tail.position.set(0, -0.10 * sk, -0.28 * sk)
      tail.rotation.x = 0.6
      headGroup.add(tail)
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.05 * sk, 0.014 * sk, 8, 12), SHIRT_ACC)
      tie.position.set(0, 0.04 * sk, -0.22 * sk)
      headGroup.add(tie)
    } else if (hairStyle === 'textured_fade') {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.29 * sk, 16, 12), HAIR)
      crown.position.set(0, 0.12 * sk, -0.01 * sk)
      crown.scale.set(0.95, 0.5, 0.95)
      headGroup.add(crown)
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04 * sk, 0.10 * sk, 6), HAIR_HI)
        spike.position.set(i * 0.05 * sk, 0.24 * sk, 0.02 * sk)
        spike.rotation.x = 0.2
        headGroup.add(spike)
      }
    } else if (hairStyle === 'anime_spikes') {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sk, 14, 10), HAIR)
      crown.position.set(0, 0.10 * sk, -0.01 * sk)
      headGroup.add(crown)
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.055 * sk, 0.16 * sk, 5), HAIR)
        sp.position.set(Math.cos(ang) * 0.18 * sk, 0.20 * sk, Math.sin(ang) * 0.18 * sk)
        sp.rotation.set(Math.sin(ang) * 0.4, 0, -Math.cos(ang) * 0.4)
        headGroup.add(sp)
      }
    } else if (hairStyle === 'turban') {
      const turbanMain = new THREE.Mesh(new THREE.SphereGeometry(0.34 * sk, 16, 12), SHIRT_ACC)
      turbanMain.position.set(0, 0.14 * sk, 0)
      turbanMain.scale.set(1.08, 0.85, 1.15)
      headGroup.add(turbanMain)
      const crest = new THREE.Mesh(new THREE.SphereGeometry(0.035 * sk, 8, 8), METALLIC)
      crest.position.set(0, 0.22 * sk, 0.32 * sk)
      headGroup.add(crest)
    } else if (hairStyle === 'hijab') {
      const hijabWrap = new THREE.Mesh(new THREE.SphereGeometry(0.33 * sk, 18, 14), SHIRT_ACC)
      hijabWrap.position.set(0, 0.08 * sk, -0.02 * sk)
      hijabWrap.scale.set(1.05, 1.1, 1.05)
      headGroup.add(hijabWrap)
    } else {
      // Quiff / Classic modern pomp
      const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.30 * sk, 16, 12), HAIR)
      hairBack.position.set(0, 0.06 * sk, -0.04 * sk)
      hairBack.scale.set(1.0, 0.58, 1.0)
      headGroup.add(hairBack)

      const quiff = new THREE.Mesh(new THREE.SphereGeometry(0.27 * sk, 14, 10), HAIR)
      quiff.position.set(0, 0.18 * sk, 0.06 * sk)
      quiff.scale.set(0.85, 0.42, 1.1)
      quiff.rotation.x = -0.25
      headGroup.add(quiff)
    }
  }

  // ─── 3. ACCESSORIES (HEADWEAR & EYEWEAR) ─────────────────────────
  if (isPlayer && app.accessories) {
    const acc = app.accessories
    // Cap
    if (acc.cap || acc.capBackwards) {
      const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.30 * sk, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), SHIRT)
      capTop.position.set(0, 0.12 * sk, -0.01 * sk)
      capTop.scale.set(1.04, 0.52, 1.04)
      headGroup.add(capTop)

      const brimDir = acc.capBackwards ? -0.16 : 0.16
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sk, 0.31 * sk, 0.02 * sk, 14), SHIRT_DK)
      brim.position.set(0, 0.10 * sk, brimDir * sk)
      brim.scale.set(1, 1, 0.65)
      headGroup.add(brim)
    }

    // Beanie
    if (acc.beanie) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32 * sk, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), SHIRT)
      dome.position.set(0, 0.11 * sk, -0.02 * sk)
      headGroup.add(dome)
      const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.06 * sk, 10, 8), SHIRT_ACC)
      pompom.position.set(0, 0.28 * sk, -0.02 * sk)
      headGroup.add(pompom)
    }

    // Racing Helmet
    if (acc.helmet) {
      const hDome = new THREE.Mesh(new THREE.SphereGeometry(0.34 * sk, 18, 14), SHIRT)
      hDome.position.set(0, 0.08 * sk, -0.02 * sk)
      headGroup.add(hDome)
      const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sk, 12, 8, 0, Math.PI * 1.2, 0, Math.PI * 0.4), new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.9, roughness: 0.1 }))
      visor.position.set(0, 0.06 * sk, 0.08 * sk)
      visor.scale.set(1.1, 0.55, 0.95)
      headGroup.add(visor)
    }

    // Glasses / Sunglasses / Cyber Visor
    if (acc.glasses || acc.sunglasses || acc.cyberVisor) {
      if (acc.cyberVisor) {
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36 * sk, 0.06 * sk, 0.12 * sk), OLED)
        visor.position.set(0, 0.04 * sk, 0.24 * sk)
        headGroup.add(visor)
      } else {
        const lensMat = acc.sunglasses ? new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 }) : new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 })
        ;[-1, 1].forEach(s => {
          const lens = new THREE.Mesh(new THREE.SphereGeometry(0.075 * sk, 12, 10), lensMat)
          lens.position.set(s * 0.13 * sk, 0.02 * sk, 0.24 * sk)
          lens.scale.set(1, 0.75, 0.25)
          headGroup.add(lens)
          const frame = new THREE.Mesh(new THREE.TorusGeometry(0.072 * sk, 0.014 * sk, 8, 16), SILVER)
          frame.position.set(s * 0.13 * sk, 0.02 * sk, 0.24 * sk)
          headGroup.add(frame)
        })
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.018 * sk, 0.018 * sk), SILVER)
        bridge.position.set(0, 0.02 * sk, 0.24 * sk)
        headGroup.add(bridge)
      }
    }

    // Headphones around neck
    if (acc.headphones) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.24 * sk, 0.025 * sk, 8, 18, Math.PI * 1.1), SILVER)
      band.position.set(0, -0.16 * sk, 0.02 * sk)
      band.rotation.x = Math.PI / 2 + 0.3
      headGroup.add(band)
      ;[-1, 1].forEach(s => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * sk, 0.07 * sk, 0.04 * sk, 12), SHIRT)
        cup.position.set(s * 0.24 * sk, -0.16 * sk, 0.04 * sk)
        cup.rotation.z = Math.PI / 2
        headGroup.add(cup)
      })
    }
  }

  // Neck
  const neck = limb(0.085 * sk, 0.105 * sk, 0.15 * sk, SKIN, 12)
  const neckGroup = new THREE.Group()
  neckGroup.position.y = 1.56 * sk
  neckGroup.add(neck)
  g.add(neckGroup)
  g.add(headGroup)

  // ─── 4. TORSO & LAYERED OUTFITS ──────────────────────────────────
  const tH = 0.66 * sk
  const torsoGroup = new THREE.Group()
  torsoGroup.position.y = 1.23 * sk

  const chest = limb(0.34 * sk, 0.30 * sk, tH * 0.54, SHIRT, 14)
  chest.position.y = tH * 0.15
  torsoGroup.add(chest)

  const outfit = isPlayer ? (app.outfit || 'streetwear') : 'streetwear'
  if (outfit === 'kaali_peeli') {
    // Kaali-Peeli Taxi Hero Yellow Chest Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.36 * sk, 0.09 * sk, 0.28 * sk), new THREE.MeshToonMaterial({ color: 0xf5b81e, gradientMap: tGrad }))
    stripe.position.set(0, tH * 0.16, 0.01 * sk)
    torsoGroup.add(stripe)
  } else if (outfit === 'safety_vest') {
    // High-Vis Neon Vest
    const vest = limb(0.36 * sk, 0.32 * sk, tH * 0.52, new THREE.MeshToonMaterial({ color: 0xccff00 }), 14)
    vest.position.y = tH * 0.15
    torsoGroup.add(vest)
    const refStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38 * sk, 0.04 * sk, 0.30 * sk), REFLECTIVE)
    refStripe.position.set(0, tH * 0.16, 0.01 * sk)
    torsoGroup.add(refStripe)
  } else if (outfit === 'police') {
    // Police Badges & Pocket
    const badge = new THREE.Mesh(new THREE.SphereGeometry(0.025 * sk, 8, 8), METALLIC)
    badge.position.set(-0.12 * sk, tH * 0.22, 0.28 * sk)
    torsoGroup.add(badge)
    ;[-1, 1].forEach(s => {
      const epaulette = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.12 * sk), SHIRT_DK)
      epaulette.position.set(s * 0.28 * sk, tH * 0.38, 0)
      torsoGroup.add(epaulette)
    })
  } else {
    // Streetwear Kangaroo Pocket & Drawstrings
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.24 * sk, 0.12 * sk, 0.06 * sk), SHIRT_DK)
    pocket.position.set(0, tH * 0.06, 0.25 * sk)
    torsoGroup.add(pocket)
    ;[-0.05, 0.05].forEach(x => {
      const string = limb(0.008 * sk, 0.008 * sk, 0.16 * sk, SHIRT_ACC, 6)
      string.position.set(x * sk, tH * 0.24, 0.28 * sk)
      torsoGroup.add(string)
    })
  }

  const waist = limb(0.30 * sk, 0.26 * sk, tH * 0.48, SHIRT_DK, 12)
  waist.position.y = -tH * 0.18
  torsoGroup.add(waist)

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.28 * sk, 0.025 * sk, 8, 18), BELT)
  belt.position.y = -tH * 0.40
  belt.rotation.x = Math.PI / 2
  torsoGroup.add(belt)

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.04 * sk, 0.02 * sk), SILVER)
  buckle.position.set(0, -tH * 0.40, 0.28 * sk)
  torsoGroup.add(buckle)

  g.add(torsoGroup)

  // ─── 5. ARMS & HANDS ─────────────────────────────────────────────
  const lArmP = new THREE.Group()
  lArmP.position.set(-0.38 * sk, 1.38 * sk, 0)
  const lUA = limb(0.085 * sk, 0.075 * sk, 0.32 * sk, SHIRT, 12)
  lUA.position.y = -0.16 * sk
  lArmP.add(lUA)
  const lElbow = jointSphere(0.055 * sk, SHIRT_DK)
  lElbow.position.set(0, -0.33 * sk, 0)
  lArmP.add(lElbow)
  const lFore = limb(0.070 * sk, 0.058 * sk, 0.28 * sk, SKIN, 12)
  lFore.position.set(0, -0.48 * sk, 0)
  lArmP.add(lFore)
  const lWrist = jointSphere(0.038 * sk, SKIN2)
  lWrist.position.set(0, -0.63 * sk, 0)
  lArmP.add(lWrist)

  // Smartwatch on left wrist
  if (isPlayer && (app.accessories?.smartwatch !== false)) {
    const watchBand = new THREE.Mesh(new THREE.TorusGeometry(0.052 * sk, 0.015 * sk, 8, 14), BELT)
    watchBand.position.set(0, -0.62 * sk, 0)
    watchBand.rotation.x = Math.PI / 2
    lArmP.add(watchBand)
    const watchScreen = new THREE.Mesh(new THREE.BoxGeometry(0.035 * sk, 0.045 * sk, 0.012 * sk), OLED)
    watchScreen.position.set(0, -0.62 * sk, 0.055 * sk)
    lArmP.add(watchScreen)
  }

  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 10, 8), SKIN2)
  lHand.position.set(0, -0.68 * sk, 0)
  lHand.scale.set(0.9, 1, 0.7)
  lArmP.add(lHand)
  g.add(lArmP)

  const rArmP = new THREE.Group()
  rArmP.position.set(0.38 * sk, 1.38 * sk, 0)
  const rUA = limb(0.085 * sk, 0.075 * sk, 0.32 * sk, SHIRT, 12)
  rUA.position.y = -0.16 * sk
  rArmP.add(rUA)
  const rElbow = jointSphere(0.055 * sk, SHIRT_DK)
  rElbow.position.set(0, -0.33 * sk, 0)
  rArmP.add(rElbow)
  const rFore = limb(0.070 * sk, 0.058 * sk, 0.28 * sk, SKIN, 12)
  rFore.position.set(0, -0.48 * sk, 0)
  rArmP.add(rFore)
  const rWrist = jointSphere(0.038 * sk, SKIN2)
  rWrist.position.set(0, -0.63 * sk, 0)
  rArmP.add(rWrist)
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 10, 8), SKIN2)
  rHand.position.set(0, -0.68 * sk, 0)
  rHand.scale.set(0.9, 1, 0.7)
  rArmP.add(rHand)
  g.add(rArmP)

  // ─── 6. LEGS & DETAILED FOOTWEAR ─────────────────────────────────
  const lLegP = new THREE.Group()
  lLegP.position.set(-0.14 * sk, 0.82 * sk, 0)
  const lUL = limb(0.11 * sk, 0.095 * sk, 0.42 * sk, PANTS, 12)
  lUL.position.y = -0.21 * sk
  lLegP.add(lUL)
  const lKnee = jointSphere(0.065 * sk, PANTS_DK)
  lKnee.position.set(0, -0.43 * sk, 0)
  lLegP.add(lKnee)
  const lLL = limb(0.09 * sk, 0.075 * sk, 0.38 * sk, PANTS_DK, 12)
  lLL.position.y = -0.62 * sk
  lLegP.add(lLL)
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12 * sk, 0.08 * sk, 0.22 * sk), SHOES)
  lShoe.position.set(0.01 * sk, -0.86 * sk, 0.04 * sk)
  lLegP.add(lShoe)
  const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.125 * sk, 0.025 * sk, 0.23 * sk), SHOE_SOLE)
  lSole.position.set(0.01 * sk, -0.90 * sk, 0.04 * sk)
  lLegP.add(lSole)
  g.add(lLegP)

  const rLegP = new THREE.Group()
  rLegP.position.set(0.14 * sk, 0.82 * sk, 0)
  const rUL = limb(0.11 * sk, 0.095 * sk, 0.42 * sk, PANTS, 12)
  rUL.position.y = -0.21 * sk
  rLegP.add(rUL)
  const rKnee = jointSphere(0.065 * sk, PANTS_DK)
  rKnee.position.set(0, -0.43 * sk, 0)
  rLegP.add(rKnee)
  const rLL = limb(0.09 * sk, 0.075 * sk, 0.38 * sk, PANTS_DK, 12)
  rLL.position.y = -0.62 * sk
  rLegP.add(rLL)
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12 * sk, 0.08 * sk, 0.22 * sk), SHOES)
  rShoe.position.set(-0.01 * sk, -0.86 * sk, 0.04 * sk)
  rLegP.add(rShoe)
  const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.125 * sk, 0.025 * sk, 0.23 * sk), SHOE_SOLE)
  rSole.position.set(-0.01 * sk, -0.90 * sk, 0.04 * sk)
  rLegP.add(rSole)
  g.add(rLegP)

  // ─── 7. BACKPACK & SCARVES ───────────────────────────────────────
  if (isPlayer && app.accessories?.backpack) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.32 * sk, 0.42 * sk, 0.18 * sk), SHIRT_DK)
    bag.position.set(0, 1.28 * sk, -0.24 * sk)
    g.add(bag)
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.24 * sk, 0.16 * sk, 0.06 * sk), SHIRT)
    pocket.position.set(0, 1.20 * sk, -0.34 * sk)
    g.add(pocket)
  }

  // ─── 8. CONTACT SHADOW & HITBOX ──────────────────────────────────
  const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.35 * sk, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }))
  shadowBlob.rotation.x = -Math.PI / 2
  shadowBlob.position.y = 0.01
  g.add(shadowBlob)

  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.6 * sk, 1.8 * sk, 0.6 * sk), new THREE.MeshBasicMaterial({ visible: false }))
  hb.position.y = 0.9 * sk
  g.add(hb)

  // UserData Kinematics & Emote controller
  g.userData = {
    isStylizedHero: true,
    isPlayer,
    _sk: sk,
    headGroup,
    torsoGroup,
    lArm: lArmP,
    rArm: rArmP,
    lLeg: lLegP,
    rLeg: rLegP,
    eyeLids: _eyeLids,
    shadowBlob,
    pose: 'idle',
    animTime: 0,
    walkPhase: 0,
    blinkTimer: 3.0,
    update(dt, speed = 0) {
      this.animTime += dt
      const t = this.animTime

      // Blinking
      this.blinkTimer -= dt
      if (this.blinkTimer <= 0) {
        this.blinkTimer = 2.5 + Math.random() * 3.5
      }
      const isBlinking = this.blinkTimer < 0.15
      if (this.eyeLids) {
        this.eyeLids.forEach(lid => { lid.scale.y = isBlinking ? 0.1 : 0.7 })
      }

      if (this.pose === 'walk' || speed > 0.05) {
        const strideSpeed = Math.max(8, speed * 22)
        this.walkPhase += dt * strideSpeed
        const swing = Math.sin(this.walkPhase) * 0.65

        this.rArm.rotation.x = swing
        this.lArm.rotation.x = -swing
        this.rLeg.rotation.x = -swing
        this.lLeg.rotation.x = swing

        this.headGroup.position.y = (1.72 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.04) * this._sk
        this.torsoGroup.position.y = (1.23 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.03) * this._sk
      } else if (this.pose === 'wave') {
        this.rArm.rotation.x = 0
        this.rArm.rotation.z = 2.4 + Math.sin(t * 8) * 0.35
        this.lArm.rotation.set(0, 0, 0)
        this.rLeg.rotation.set(0, 0, 0)
        this.lLeg.rotation.set(0, 0, 0)
        this.headGroup.rotation.y = 0.2
      } else if (this.pose === 'thumbs_up') {
        this.rArm.rotation.x = -1.4
        this.rArm.rotation.z = -0.3
        this.lArm.rotation.set(0, 0, 0)
        this.rLeg.rotation.set(0, 0, 0)
        this.lLeg.rotation.set(0, 0, 0)
        this.headGroup.rotation.set(0.1, -0.2, 0)
      } else if (this.pose === 'victory') {
        this.rArm.rotation.set(0, 0, 2.6 + Math.sin(t * 4) * 0.15)
        this.lArm.rotation.set(0, 0, -2.6 - Math.sin(t * 4) * 0.15)
        this.rLeg.rotation.x = -0.15
        this.lLeg.rotation.x = 0.15
      } else {
        // Idle breathing
        const breathe = Math.sin(t * 2.5) * 0.005
        this.torsoGroup.position.y = (1.23 + breathe) * this._sk
        this.headGroup.position.y = (1.72 + breathe * 0.6) * this._sk
        this.rArm.rotation.x = Math.sin(t * 2.5) * 0.04
        this.lArm.rotation.x = -Math.sin(t * 2.5) * 0.04
        this.rLeg.rotation.set(0, 0, 0)
        this.lLeg.rotation.set(0, 0, 0)
      }
    }
  }

  return g
};

// Expose to window
window._buildHuman = _buildHuman;
