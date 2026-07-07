let game = null

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cert-logo-1')) {
    document.getElementById('cert-logo-1').src = typeof CERT_LOGO_1 !== 'undefined' ? CERT_LOGO_1 : ''
  }
  if (document.getElementById('cert-logo-2')) {
    document.getElementById('cert-logo-2').src = typeof CERT_LOGO_2 !== 'undefined' ? CERT_LOGO_2 : ''
  }
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('is-touch')
  }
  // Do NOT call ui.init() or create Game() here yet. Wait for assets to load.
})

// Developer Mode: Ctrl+Shift+D to unlock everything
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault()
    ui.adminUnlock()
  }
})

window.PRELOADED_MODELS = {}
// ─── Per-Level Model Loading System ─────────────────────────────────────────
// Every GLB key mapped to its file path. Used by loadLevelAssets() to
// lazy-load only the models a level actually needs.
window.ASSET_MANIFEST = {}
;(function () {
  const carKit = 'Models/kenney_car-kit/Models/GLB format/'
  const roadKit = 'Models/kenney_city-kit-roads/Models/GLB format/'
  const charKit = 'Models/kenney_mini-characters/Models/GLB format/'
  const subKit = 'Models/kenney_city-kit-suburban_20/Models/GLB format/'
  const indKit = 'Models/kenney_city-kit-industrial_1.0/Models/GLB format/'
  const mbKit = 'Models/kenney_modular-buildings/Models/GLB format/'
  const bkKit = 'Models/kenney_building-kit/Models/GLB format/'
  const wcKit = 'Models/kenney_watercraft-pack/Models/GLB format/'
  const tkKit = 'Models/kenney_train-kit/Models/GLB format/'
  const M = window.ASSET_MANIFEST

  // Vehicles — core
  M.car = carKit + 'sedan.glb'; M.taxi = carKit + 'taxi.glb'; M.police = carKit + 'police.glb'
  M.bus = carKit + 'delivery.glb'; M.truck = carKit + 'truck.glb'; M.auto = carKit + 'van.glb'; M.bike = carKit + 'race.glb'

  // Vehicles — variants
  M.ambulance = carKit + 'ambulance.glb'
  ;['hatchback-sports','suv','suv-luxury','race-future','sedan-sports','kart-oobi','kart-oodi','kart-ooli','kart-oopi','kart-oozi','tractor','tractor-police','tractor-shovel'].forEach(c => { M['car_'+c] = carKit + c + '.glb' })
  ;['firetruck','garbage-truck','truck-flat'].forEach(t => { M['truck_'+t] = carKit + t + '.glb' })

  // Roads
  M.road_straight = roadKit + 'road-straight.glb'; M.road_intersect = roadKit + 'road-intersection.glb'
  M.road_cross = roadKit + 'road-crossroad.glb'; M.road_cross_path = roadKit + 'road-crossroad-path.glb'
  M.road_intersect_path = roadKit + 'road-intersection-path.glb'; M.road_bend = roadKit + 'road-bend-sidewalk.glb'
  M.road_crossing = roadKit + 'road-crossing.glb'; M.road_roundabout = roadKit + 'road-roundabout.glb'
  M.barrier = roadKit + 'construction-barrier.glb'; M.cone = roadKit + 'construction-cone.glb'; M.sign_highway = roadKit + 'sign-highway.glb'
  M.road_avenue = 'Models/road__avenue__street/scene.gltf'

  // Characters
  M.char_f_a = charKit + 'character-female-a.glb'; M.char_f_b = charKit + 'character-female-b.glb'; M.char_f_c = charKit + 'character-female-c.glb'
  M.char_m_a = charKit + 'character-male-a.glb'; M.char_m_b = charKit + 'character-male-b.glb'; M.char_m_c = charKit + 'character-male-c.glb'

  // Suburban buildings (a-u)
  'abcdefghijklmnopqrstu'.split('').forEach(l => { M['suburban_'+l] = subKit + 'building-type-' + l + '.glb' })

  // Industrial buildings (a-t)
  'abcdefghijklmnopqrst'.split('').forEach(l => { M['industrial_'+l] = indKit + 'building-' + l + '.glb' })

  // Modular buildings
  ;['sample-house-a','sample-house-b','sample-house-c'].forEach(h => { M['mbuilding_'+h] = mbKit + 'building-' + h + '.glb' })
  ;['sample-tower-a','sample-tower-b','sample-tower-c','sample-tower-d'].forEach(t => { M['mbuilding_'+t] = mbKit + 'building-' + t + '.glb' })

  // Building kit
  ;['wall','wall-doorway-square','column','column-wide'].forEach(w => { M['bkit_'+w] = bkKit + w + '.glb' })
  ;['barricade-doorway-a','barricade-doorway-b'].forEach(b => { M['bkit_'+b] = bkKit + b + '.glb' })

  // Watercraft
  M.ship_cargo = wcKit + 'ship-cargo-a.glb'; M.boat_speed = wcKit + 'boat-speed-a.glb'
  ;['boat-speed-b','boat-speed-c','boat-fishing-small','boat-tug-a','ship-cargo-b','ship-small'].forEach(w => { M['wc_'+w] = wcKit + w + '.glb' })

  // Trains
  M.train = tkKit + 'train-locomotive-a.glb'; M.metro = tkKit + 'train-electric-subway-a.glb'
  ;['train-diesel-a','train-electric-bullet-a','train-tram-modern','train-carriage-box'].forEach(t => { M['tk_'+t] = tkKit + t + '.glb' })

  // Trees & greenery
  M.tree_small = subKit + 'tree-small.glb'; M.tree_large = subKit + 'tree-large.glb'; M.planter = subKit + 'planter.glb'
})()

// Logical groups — level configs reference these in their assets[] array
window.ASSET_GROUPS = {
  suburban:  'abcdefghijklmnopqrstu'.split('').map(l => 'suburban_' + l),
  industrial:'abcdefghijklmnopqrst'.split('').map(l => 'industrial_' + l),
  cars:      ['car_hatchback-sports','car_suv','car_suv-luxury','car_race-future','car_sedan-sports','car_kart-oobi','car_kart-oodi','car_kart-ooli','car_kart-oopi','car_kart-oozi','car_tractor','car_tractor-police','car_tractor-shovel'],
  trucks:    ['truck_firetruck','truck_garbage-truck','truck_truck-flat'],
  modular:   ['mbuilding_sample-house-a','mbuilding_sample-house-b','mbuilding_sample-house-c','mbuilding_sample-tower-a','mbuilding_sample-tower-b','mbuilding_sample-tower-c','mbuilding_sample-tower-d'],
  bkit:      ['bkit_wall','bkit_wall-doorway-square','bkit_column','bkit_column-wide','bkit_barricade-doorway-a','bkit_barricade-doorway-b'],
  watercraft:['ship_cargo','boat_speed','wc_boat-speed-b','wc_boat-speed-c','wc_boat-fishing-small','wc_boat-tug-a','wc_ship-cargo-b','wc_ship-small'],
  trains:    ['train','metro','tk_train-diesel-a','tk_train-electric-bullet-a','tk_train-tram-modern','tk_train-carriage-box'],
  emergency: ['ambulance'],
  construction:['barrier','cone','sign_highway']
}

// Keys always loaded at startup (fast boot — 21 models instead of 109)
window.CORE_ASSETS = [
  'car','taxi','police','bus','truck','auto','bike',
  'road_straight','road_intersect','road_cross','road_cross_path','road_intersect_path','road_bend','road_crossing','road_roundabout','road_avenue',
  'char_f_a','char_f_b','char_f_c','char_m_a','char_m_b','char_m_c',
  'tree_small','tree_large'
]

// Expand an assets[] array: resolve group names to individual keys, deduplicate
window._expandAssets = function (assets) {
  if (!assets || !assets.length) return []
  const out = new Set()
  assets.forEach(a => {
    if (window.ASSET_GROUPS[a]) window.ASSET_GROUPS[a].forEach(k => out.add(k))
    else out.add(a)
  })
  return [...out]
}

// Load specific model keys into PRELOADED_MODELS (skips already-loaded ones)
// calls callback() when done. If no keys given, loads ALL keys (backward compat).
window.loadLevelAssets = function (keys, callback) {
  if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') { callback(); return }
  const loader = new THREE.GLTFLoader()
  const manifest = window.ASSET_MANIFEST

  // Determine which keys to load
  let toLoad
  if (keys === undefined || keys === null) {
    // Backward compat: no assets specified → load everything not yet loaded
    toLoad = Object.keys(manifest).filter(k => !window.PRELOADED_MODELS[k])
  } else {
    // Explicit assets array (even empty) → expand and load only those
    const expanded = window._expandAssets(keys)
    toLoad = expanded.filter(k => !window.PRELOADED_MODELS[k])
  }

  if (toLoad.length === 0) { callback(); return }

  let loaded = 0
  const total = toLoad.length
  const ld = document.getElementById('loading-screen')
  const pctEl = document.getElementById('loading-pct')
  const barEl = document.getElementById('loading-bar')
  const statusEl = document.getElementById('loading-status')

  const loadNext = (index) => {
    if (index >= toLoad.length) {
      if (ld && ld.parentNode) {
        ld.innerHTML = '<h1 style="color:#34D399;">World Ready!</h1><div style="font-size:1rem;color:#8891AA;">Entering level...</div>'
        setTimeout(() => { ld.style.opacity = '0'; ld.style.transform = 'scale(1.05)'; setTimeout(() => { if (ld.parentNode) ld.remove() }, 800) }, 600)
      }
      callback()
      return
    }
    const key = toLoad[index]
    const file = manifest[key]
    if (!file) { loaded++; setTimeout(() => loadNext(index + 1), 0); return }
    if (statusEl) statusEl.textContent = 'Loading: ' + key + '...'

    loader.load(file, (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = !key.includes('road')
          child.receiveShadow = true
          if (child.material) {
            if (child.material.map) { child.material.map.magFilter = THREE.NearestFilter; child.material.map.minFilter = THREE.NearestFilter; child.material.map.needsUpdate = true }
            child.material.roughness = 0.8; child.material.metalness = 0.1
          }
        }
      })
      gltf.scene.scale.set(4.5, 4.5, 4.5)
      window.PRELOADED_MODELS[key] = gltf.scene
      loaded++
      const pct = Math.round((loaded / total) * 100)
      if (pctEl) pctEl.textContent = pct + '%'
      if (barEl) barEl.style.width = pct + '%'
      setTimeout(() => loadNext(index + 1), 0)
    }, undefined, (err) => {
      console.error('Error loading asset:', key, file, err)
      loaded++
      setTimeout(() => loadNext(index + 1), 0)
    })
  }
  setTimeout(() => loadNext(0), 50)
}

// ─── Startup: load only core assets (fast boot) ────────────────────────────
function preloadModels(callback) {
  if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') { callback(); return }

  // Show loading screen
  const ld = document.getElementById('loading-screen')
  const pctEl = document.getElementById('loading-pct')
  const barEl = document.getElementById('loading-bar')
  const statusEl = document.getElementById('loading-status')

  // Load core assets only — 21 models instead of 109
  window.loadLevelAssets(window.CORE_ASSETS, () => {
    // Also load base64 models from window.MODELS into PRELOADED_MODELS
    if (window.MODELS) {
      const loader = new THREE.GLTFLoader()
      Object.keys(window.MODELS).forEach((key) => {
        if (window.MODELS[key] && !window.PRELOADED_MODELS[key]) {
          loader.load(window.MODELS[key], (gltf) => {
            gltf.scene.traverse((child) => {
              if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material) { child.material.roughness = 0.8; child.material.metalness = 0.1 } }
            })
            gltf.scene.scale.set(4.5, 4.5, 4.5)
            window.PRELOADED_MODELS[key] = gltf.scene
          }, undefined, (err) => console.warn('Failed to load base64 model:', key, err))
        }
      })
    }
    callback()
  })
}
// Confetti particle system
window.confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  running: false,
  init() {
    if (this.canvas) return
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = 'position:fixed;inset:0;z-index:20;pointer-events:none;'
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
  },
  burst(duration = 3000) {
    this.init()
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.particles = []
    const colors = ['#ff6b35', '#ffd54a', '#4caf50', '#2196f3', '#e91e63', '#9c27b0', '#00bcd4', '#ff9800']
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 18 - 4,
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        life: 1
      })
    }
    this.running = true
    const start = Date.now()
    const animate = () => {
      if (!this.running) return
      const elapsed = Date.now() - start
      if (elapsed > duration) {
        this.running = false
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        return
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.particles.forEach((p) => {
        p.x += p.vx
        p.vy += 0.35
        p.y += p.vy
        p.rot += p.vr
        p.life = Math.max(0, 1 - elapsed / duration)
        this.ctx.save()
        this.ctx.translate(p.x, p.y)
        this.ctx.rotate((p.rot * Math.PI) / 180)
        this.ctx.globalAlpha = p.life
        this.ctx.fillStyle = p.color
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        this.ctx.restore()
      })
      requestAnimationFrame(animate)
    }
    animate()
  }
}

// Quiz confirmation logic
ui._selectedAnswer = -1
ui.selectOption = function (idx, correctIdx) {
  this._selectedAnswer = idx
  this._correctIdx = correctIdx
  document.querySelectorAll('.qo').forEach((o, i) => {
    o.classList.remove('selected')
    if (i === idx) o.classList.add('selected')
  })
  const cb = document.getElementById('qconfirm')
  if (cb) cb.classList.add('show')
}
ui.confirmAnswer = function () {
  if (this._selectedAnswer < 0) return
  const cb = document.getElementById('qconfirm')
  if (cb) cb.classList.remove('show')
  // Call the original answer handler
  this._submitAnswer(this._selectedAnswer, this._correctIdx)
  this._selectedAnswer = -1
}

// Challan card stack
ui._challanCards = []
ui._addChallanCard = function (off, amt) {
  const stack = document.getElementById('challan-stack')
  if (!stack) return
  stack.classList.add('on')
  const card = document.createElement('div')
  card.className = 'challan-card'

  // Calculate stack depth for rotation and offset (like a hand of cards)
  const depth = stack.children.length
  // Rotate between -15deg and -5deg based on depth to fan them out
  const rot = -15 + depth * 3

  // Get exact clone of cvc-main HTML
  const cvcHtml = document.getElementById('cvc-main').innerHTML

  // Use zoom so it shrinks its physical layout size — like holding cards
  card.innerHTML = `<div style="width:400px; zoom: 0.18; transform: rotate(${rot}deg); box-shadow: -6px 6px 20px rgba(0,0,0,0.5); border-radius:16px; overflow:hidden; background:white; pointer-events:none;">${cvcHtml}</div>`
  stack.appendChild(card)
  this._challanCards.push(card)
  // Keep max 5 visible
  if (this._challanCards.length > 5) {
    const old = this._challanCards.shift()
    if (old.parentNode) old.parentNode.removeChild(old)
  }
}

window.ui = ui
window.sfx = sfx
preloadModels(() => {
  ui.init()
  game = new Game()
  window.game = game

  const urlParams = new URLSearchParams(window.location.search)
  let lvId = urlParams.get('lv') || localStorage.getItem('traffic_lv')
  let mode = urlParams.get('mode') || localStorage.getItem('traffic_mode')

  if (window.location.pathname.toLowerCase().includes('driving')) {
    if (lvId) {
      const levelObj = window.LVS.find((l) => l.id == lvId)
      if (levelObj) {
        ui.cur = levelObj
        ui.curMode = mode || 'car'
        ui.cur.vehMode = ui.curMode
        document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'))
        setTimeout(() => {
          game.startLevel()
        }, 300)
      } else {
        window.location.href = 'Academy.html?screen=levels'
      }
    } else {
      window.location.href = 'Academy.html?screen=levels'
    }
  } else {
    if (ui.showStart) ui.showStart()
  }
})

async function downloadSourceCode(e) {
  if (e) e.preventDefault()
  const btn = document.getElementById('dl-btn')
  if (!btn || typeof JSZip === 'undefined') {
    alert('Zip library loading, please wait.')
    return
  }

  const origText = btn.innerHTML
  btn.innerHTML = '&#9203; Zipping... (Make sure to run via local server for this to work!)'
  btn.style.pointerEvents = 'none'

  try {
    const zip = new JSZip()
    const files = ['Academy', 'vehicles.js', 'auto.js', 'bus.js']

    let fetched = 0

    for (let f of files) {
      let fetchUrl = f
      if (f === 'Academy') fetchUrl = window.location.href.split('?')[0].split('#')[0]

      try {
        const res = await fetch(fetchUrl)
        if (res.ok) {
          const blob = await res.blob()
          let fName = f
          if (f === 'Academy') fName = fetchUrl.split('/').pop() || 'Academy'
          zip.file(fName, blob)
          fetched++
        } else {
          console.warn('Could not fetch ' + f)
        }
      } catch (err) {
        console.warn('Fetch failed for ' + f + ' (Likely CORS issue on file:/// origin)', err)
      }
    }

    if (fetched === 0) {
      alert(
        'Failed to read local files! This usually happens if you opened the HTML file directly (file:///). Please host this folder using a local web server (e.g. VS Code Live Server) to enable dynamic zipping.'
      )
      btn.innerHTML = origText
      btn.style.pointerEvents = 'auto'
      return
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Traffic_Source_Code.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    btn.innerHTML = '&#9989; Downloaded!'
    setTimeout(() => {
      btn.innerHTML = origText
      btn.style.pointerEvents = 'auto'
    }, 3000)
  } catch (e) {
    console.error(e)
    btn.innerHTML = '&#10060; Error!'
    setTimeout(() => {
      btn.innerHTML = origText
      btn.style.pointerEvents = 'auto'
    }, 3000)
  }
}
