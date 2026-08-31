let game = null
window.ui = window.ui || {}

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

})


document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault()
    ui.adminUnlock()
  }
})

window.PRELOADED_MODELS = {}


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



  function glb(p) { return { path: p, fmt: 'glb' } }
  function fbx(p) { return { path: p, fmt: 'fbx' } }
  function obj(p, m) { return { path: p, fmt: 'obj', mtl: m || null } }


  // ── Vehicles & Supercars ──────────────────────────────────────────────
  M.car = glb('Models/sample (1).glb'); // Supercar Default Sedan
  M.car_supercar_1 = glb('Models/sample (1).glb');
  M.car_supercar_2 = glb('Models/sample (2).glb');
  M.car_supercar_3 = glb('Models/sample (3).glb');
  M.car_sedan_kenney = glb(carKit + 'sedan.glb');
  M.taxi = glb(carKit + 'taxi.glb');
  M.police = glb(carKit + 'police.glb');
  M.ambulance = glb(carKit + 'ambulance.glb');
  M.van = glb(carKit + 'van.glb');
  M.delivery = glb(carKit + 'delivery.glb');
  M.delivery_flat = glb(carKit + 'delivery-flat.glb');
  M.truck = glb(carKit + 'truck.glb');
  M.truck_flat = glb(carKit + 'truck-flat.glb');
  M.firetruck = glb(carKit + 'firetruck.glb');
  M.garbage_truck = glb(carKit + 'garbage-truck.glb');
  M.suv = glb(carKit + 'suv.glb');
  M.suv_luxury = glb(carKit + 'suv-luxury.glb');
  M.sedan_sports = glb(carKit + 'sedan-sports.glb');
  M.hatchback_sports = glb(carKit + 'hatchback-sports.glb');
  M.race_future = glb(carKit + 'race-future.glb');
  M.race = glb(carKit + 'race.glb');
  M.tractor = glb(carKit + 'tractor.glb');
  ;['hatchback-sports','suv','suv-luxury','race-future','sedan-sports','kart-oobi','kart-oodi','kart-ooli','kart-oopi','kart-oozi','tractor','tractor-police','tractor-shovel'].forEach(c => { M['car_'+c] = glb(carKit + c + '.glb') });
  ;['firetruck','garbage-truck','truck-flat'].forEach(t => { M['truck_'+t] = glb(carKit + t + '.glb') });

  M.bmw_m4 = glb('Models/bmw_m4_widebody__www.vecarz.com.glb');
  M.nilu_27 = glb('Models/nilu_27_concept_2024__www.vecarz.com.glb');
  M.cyberpunk_bike = glb('Models/cyberpunk_bike.glb');
  M.lowpoly_cars = fbx('Models/uploads_files_3354643_LowPoly_Cars_01_fbx.FBX');

  M.road_straight = glb(roadKit + 'road-straight.glb'); M.road_intersect = glb(roadKit + 'road-intersection.glb')
  M.road_cross = glb(roadKit + 'road-crossroad.glb'); M.road_cross_path = glb(roadKit + 'road-crossroad-path.glb')
  M.road_intersect_path = glb(roadKit + 'road-intersection-path.glb'); M.road_bend = glb(roadKit + 'road-bend-sidewalk.glb')
  M.road_crossing = glb(roadKit + 'road-crossing.glb'); M.road_roundabout = glb(roadKit + 'road-roundabout.glb')
  M.barrier = glb(roadKit + 'construction-barrier.glb'); M.cone = glb(roadKit + 'construction-cone.glb'); M.sign_highway = glb(roadKit + 'sign-highway.glb')
  M.road_avenue = { path: 'Models/road__avenue__street/scene.gltf', fmt: 'gltf' }

  // ── Characters (Human / Pedestrians) ──────────────────────────────────
  M.char_f_a = glb(charKit + 'character-female-a.glb'); M.char_f_b = glb(charKit + 'character-female-b.glb'); M.char_f_c = glb(charKit + 'character-female-c.glb')
  M.char_f_d = glb(charKit + 'character-female-d.glb'); M.char_f_e = glb(charKit + 'character-female-e.glb'); M.char_f_f = glb(charKit + 'character-female-f.glb')
  M.char_m_a = glb(charKit + 'character-male-a.glb'); M.char_m_b = glb(charKit + 'character-male-b.glb'); M.char_m_c = glb(charKit + 'character-male-c.glb')
  M.char_m_d = glb(charKit + 'character-male-d.glb'); M.char_m_e = glb(charKit + 'character-male-e.glb'); M.char_m_f = glb(charKit + 'character-male-f.glb')
  M.player_sample = glb('Models/sample.glb') // Hero 3D Character



  const animPacks = ['survivors','retro','protagonists']
  animPacks.forEach(pack => {
    const baseDir = 'Models/kenney_animated-characters-' + pack + '/'
    M['anim_' + pack] = fbx(baseDir + 'Model/characterMedium.fbx')
    M['anim_' + pack + '_idle'] = fbx(baseDir + 'Animations/idle.fbx')
    M['anim_' + pack + '_run'] = fbx(baseDir + 'Animations/run.fbx')
    M['anim_' + pack + '_jump'] = fbx(baseDir + 'Animations/jump.fbx')
  })


  'abcdefghijklmnopqrstu'.split('').forEach(l => { M['suburban_'+l] = glb(subKit + 'building-type-' + l + '.glb') })


  'abcdefghijklmnopqrst'.split('').forEach(l => { M['industrial_'+l] = glb(indKit + 'building-' + l + '.glb') })


  ;['sample-house-a','sample-house-b','sample-house-c'].forEach(h => { M['mbuilding_'+h] = glb(mbKit + 'building-' + h + '.glb') })
  ;['sample-tower-a','sample-tower-b','sample-tower-c','sample-tower-d'].forEach(t => { M['mbuilding_'+t] = glb(mbKit + 'building-' + t + '.glb') })


  ;['wall','wall-doorway-square','wall-doorway-round','wall-doorway-wide-round','wall-doorway-wide-square',
    'wall-window-square','wall-window-round','wall-window-round-detailed','wall-window-wide-square','wall-window-wide-round',
    'wall-window-wide-round-detailed','wall-window-narrow','wall-window-tall','wall-window-wide',
    'column','column-wide','column-thin',
    'border','border-corner','border-corner-round','border-corner-diagonal','border-corner-small',
    'border-high','border-high-corner','border-high-corner-round','border-high-corner-diagonal','border-high-corner-small',
    'roof-flat','roof-flat-center','roof-flat-corner','roof-flat-corner-inner','roof-flat-corner-high',
    'roof-flat-side','roof-flat-patch','roof-flat-patch-large','roof-flat-square','roof-flat-top','roof-flat-border-side','roof-flat-border-straight','roof-flat-detail-a','roof-flat-detail-b','roof-flat-detail-c','roof-flat-detail-d',
    'roof-gable','roof-gable-end','roof-gable-corner',
    'roof-slanted','roof-slanted-corner-a','roof-slanted-corner-b','roof-slanted-corner-c','roof-slanted-corner-inner','roof-slanted-flat','roof-slanted-window','roof-slanted-detail',
    'floor','floor-half','floor-quarter','floor-corner','floor-corner-round','floor-corner-diagonal',
    'stairs-center','stairs-center-short','stairs-closed','stairs-closed-short','stairs-open','stairs-open-short','stairs-sides','stairs-sides-short',
    'gutter-vertical','gutter-vertical-top','gutter-vertical-bottom','gutter-vertical-short','gutter-vertical-wall',
    'plating','plating-wide','plating-detailed','plating-detailed-wide',
    'door-rotate-round-a','door-rotate-round-b','door-rotate-round-c','door-rotate-round-d',
    'door-rotate-square-a','door-rotate-square-b','door-rotate-square-c','door-rotate-square-d',
    'detail-pipe'
  ].forEach(w => { M['bkit_'+w] = glb(bkKit + w + '.glb') })
  ;['barricade-doorway-a','barricade-doorway-b','barricade-doorway-c','barricade-window-a','barricade-window-b','barricade-window-c'].forEach(b => { M['bkit_'+b] = glb(bkKit + b + '.glb') })


  M.ship_cargo = glb(wcKit + 'ship-cargo-a.glb'); M.boat_speed = glb(wcKit + 'boat-speed-a.glb')
  ;['boat-speed-b','boat-speed-c','boat-fishing-small','boat-tug-a','ship-cargo-b','ship-small'].forEach(w => { M['wc_'+w] = glb(wcKit + w + '.glb') })


  M.train = glb(tkKit + 'train-locomotive-a.glb'); M.metro = glb(tkKit + 'train-electric-subway-a.glb')
  ;['train-diesel-a','train-electric-bullet-a','train-tram-modern','train-carriage-box'].forEach(t => { M['tk_'+t] = glb(tkKit + t + '.glb') })


  M.tree_small = glb(subKit + 'tree-small.glb'); M.tree_large = glb(subKit + 'tree-large.glb'); M.planter = glb(subKit + 'planter.glb')



  const petsKit = 'Models/kenney_cube-pets_1.0/Models/GLB format/'
  M.animal_cow = glb(petsKit + 'animal-cow.glb'); M.animal_dog = glb(petsKit + 'animal-dog.glb')


  const lowPolyCityKit = 'Models/source/'

  const sepKit = lowPolyCityKit + 'Separate_assets_glb/Separate_assets_glb/'

  // Street lights and props (from city-kit-roads)
  M.streetlight_curved = glb(roadKit + 'light-curved.glb')
  M.streetlight_square = glb(roadKit + 'light-square.glb')
  M.construction_light = glb(roadKit + 'construction-light.glb')
  M.sign_highway = glb(roadKit + 'sign-highway.glb')
  M.sign_highway_detailed = glb(roadKit + 'sign-highway-detailed.glb')
  M.bollard = glb(roadKit + 'bollard.glb')

  M.lowpoly_billboard_2x1_03 = glb(sepKit + 'Billboard_2x1_03.glb')
  M.lowpoly_billboard_2x1_05 = glb(sepKit + 'Billboard_2x1_05.glb')
  M.lowpoly_billboard_4x1_03 = glb(sepKit + 'Billboard_4x1_03.glb')
  M.lowpoly_billboard_4x1_04 = glb(sepKit + 'Billboard_4x1_04.glb')
  M.lowpoly_bush_06 = glb(sepKit + 'Bush_06.glb')
  M.lowpoly_bush_07 = glb(sepKit + 'Bush_07.glb')
  M.lowpoly_bush_10 = glb(sepKit + 'Bush_10.glb')
  M.lowpoly_bus_stop_02 = glb(sepKit + 'Bus_Stop_02.glb')
  M.lowpoly_car_06 = glb(sepKit + 'Car_06.glb')
  M.lowpoly_car_13 = glb(sepKit + 'Car_13.glb')
  M.lowpoly_car_16 = glb(sepKit + 'Car_16.glb')
  M.lowpoly_car_19 = glb(sepKit + 'Car_19.glb')
  M.lowpoly_eco_building_grid = glb(sepKit + 'Eco_Building_Grid.glb')
  M.lowpoly_eco_building_slope = glb(sepKit + 'Eco_Building_Slope.glb')
  M.lowpoly_eco_building_terrace = glb(sepKit + 'Eco_Building_Terrace.glb')
  M.lowpoly_fountain_03 = glb(sepKit + 'Fountain_03.glb')
  M.lowpoly_futuristic_car_1 = glb(sepKit + 'Futuristic_Car_1.glb')

  M.lowpoly_graffiti_03 = glb(sepKit + 'Graffiti_03.glb')
  M.lowpoly_palm_03 = glb(sepKit + 'Palm_03.glb')
  M.lowpoly_regular_building_twistedtower_large = glb(sepKit + 'Regular_Building_TwistedTower_Large.glb')

  M.lowpoly_road_001 = glb(sepKit + 'road_001.glb')
  M.lowpoly_road_003 = glb(sepKit + 'road_003.glb')
  M.lowpoly_road_009 = glb(sepKit + 'road_009.glb')
  M.lowpoly_road_013 = glb(sepKit + 'road_013.glb')
  M.lowpoly_road_019 = glb(sepKit + 'road_019.glb')
  M.lowpoly_road_020 = glb(sepKit + 'road_020.glb')
  M.lowpoly_road_022 = glb(sepKit + 'road_022.glb')

  M.lowpoly_set_b_tiles_01 = glb(sepKit + 'Set_B_Tiles_01.glb')
  M.lowpoly_set_b_tiles_04 = glb(sepKit + 'Set_B_Tiles_04.glb')
  M.lowpoly_set_b_tiles_05 = glb(sepKit + 'Set_B_Tiles_05.glb')
  M.lowpoly_set_b_tiles_06 = glb(sepKit + 'Set_B_Tiles_06.glb')
  M.lowpoly_set_b_tiles_09 = glb(sepKit + 'Set_B_Tiles_09.glb')
  M.lowpoly_signboard_01 = glb(sepKit + 'Signboard_01.glb')
  M.lowpoly_spotlight_01 = glb(sepKit + 'Spotlight_01.glb')
  M.lowpoly_spotlight_02 = glb(sepKit + 'Spotlight_02.glb')

  M.lowpoly_traffic_light_001 = glb(sepKit + 'traffic_light_001.glb')
  M.lowpoly_traffic_light_002 = glb(sepKit + 'traffic_light_002.glb')
  M.lowpoly_traffic_light_003 = glb(sepKit + 'traffic_light_003.glb')
  M.lowpoly_trash_02 = glb(sepKit + 'Trash_02.glb')
  M.lowpoly_trash_03 = glb(sepKit + 'Trash_03.glb')
  M.lowpoly_trash_04 = glb(sepKit + 'Trash_04.glb')
  M.lowpoly_trash_05 = glb(sepKit + 'Trash_05.glb')
  M.lowpoly_trash_06 = glb(sepKit + 'Trash_06.glb')
  M.lowpoly_trash_can_04 = glb(sepKit + 'Trash_Can_04.glb')
  M.lowpoly_trash_can_05 = glb(sepKit + 'Trash_Can_05.glb')
  M.lowpoly_trash_can_06 = glb(sepKit + 'Trash_Can_06.glb')
  M.lowpoly_trash_can_07 = glb(sepKit + 'Trash_Can_07.glb')
  M.lowpoly_trash_can_08 = glb(sepKit + 'Trash_Can_08.glb')
  M.lowpoly_van = glb(sepKit + 'Van.glb')
})()


window.ASSET_GROUPS = {
  suburban:  'abcdefghijklmnopqrstu'.split('').map(l => 'suburban_' + l),
  industrial:'abcdefghijklmnopqrst'.split('').map(l => 'industrial_' + l),
  cars:      ['car_supercar_1','car_supercar_2','car_supercar_3','bmw_m4','nilu_27','cyberpunk_bike','car_hatchback-sports','car_suv','car_suv-luxury','car_race-future','car_sedan-sports','car_kart-oobi','car_kart-oodi','car_kart-ooli','car_kart-oopi','car_kart-oozi','car_tractor','car_tractor-police','car_tractor-shovel'],
  trucks:    ['truck_firetruck','truck_garbage-truck','truck_truck-flat'],
  modular:   ['mbuilding_sample-house-a','mbuilding_sample-house-b','mbuilding_sample-house-c','mbuilding_sample-tower-a','mbuilding_sample-tower-b','mbuilding_sample-tower-c','mbuilding_sample-tower-d'],
  bkit:      ['bkit_wall','bkit_wall-doorway-square','bkit_wall-doorway-round','bkit_wall-doorway-wide-round','bkit_wall-doorway-wide-square',
              'bkit_wall-window-square','bkit_wall-window-round','bkit_wall-window-round-detailed','bkit_wall-window-wide-square','bkit_wall-window-wide-round',
              'bkit_wall-window-wide-round-detailed','bkit_wall-window-narrow','bkit_wall-window-tall','bkit_wall-window-wide',
              'bkit_column','bkit_column-wide','bkit_column-thin',
              'bkit_border','bkit_border-corner','bkit_border-corner-round','bkit_border-corner-diagonal','bkit_border-corner-small',
              'bkit_border-high','bkit_border-high-corner','bkit_border-high-corner-round','bkit_border-high-corner-diagonal','bkit_border-high-corner-small',
              'bkit_roof-flat','bkit_roof-flat-center','bkit_roof-flat-corner','bkit_roof-flat-corner-inner','bkit_roof-flat-corner-high',
              'bkit_roof-flat-side','bkit_roof-flat-patch','bkit_roof-flat-patch-large','bkit_roof-flat-square','bkit_roof-flat-top',
              'bkit_roof-flat-border-side','bkit_roof-flat-border-straight',
              'bkit_roof-flat-detail-a','bkit_roof-flat-detail-b','bkit_roof-flat-detail-c','bkit_roof-flat-detail-d',
              'bkit_roof-gable','bkit_roof-gable-end','bkit_roof-gable-corner',
              'bkit_roof-slanted','bkit_roof-slanted-corner-a','bkit_roof-slanted-corner-b','bkit_roof-slanted-corner-c','bkit_roof-slanted-corner-inner','bkit_roof-slanted-flat','bkit_roof-slanted-window','bkit_roof-slanted-detail',
              'bkit_floor','bkit_floor-half','bkit_floor-quarter','bkit_floor-corner','bkit_floor-corner-round','bkit_floor-corner-diagonal',
              'bkit_stairs-center','bkit_stairs-center-short','bkit_stairs-closed','bkit_stairs-closed-short','bkit_stairs-open','bkit_stairs-open-short','bkit_stairs-sides','bkit_stairs-sides-short',
              'bkit_gutter-vertical','bkit_gutter-vertical-top','bkit_gutter-vertical-bottom','bkit_gutter-vertical-short','bkit_gutter-vertical-wall',
              'bkit_plating','bkit_plating-wide','bkit_plating-detailed','bkit_plating-detailed-wide',
              'bkit_door-rotate-round-a','bkit_door-rotate-round-b','bkit_door-rotate-round-c','bkit_door-rotate-round-d',
              'bkit_door-rotate-square-a','bkit_door-rotate-square-b','bkit_door-rotate-square-c','bkit_door-rotate-square-d',
              'bkit_detail-pipe',
              'bkit_barricade-doorway-a','bkit_barricade-doorway-b','bkit_barricade-doorway-c','bkit_barricade-window-a','bkit_barricade-window-b','bkit_barricade-window-c'],
  watercraft:['ship_cargo','boat_speed','wc_boat-speed-b','wc_boat-speed-c','wc_boat-fishing-small','wc_boat-tug-a','wc_ship-cargo-b','wc_ship-small'],
  trains:    ['train','metro','tk_train-diesel-a','tk_train-electric-bullet-a','tk_train-tram-modern','tk_train-carriage-box'],
  emergency: ['ambulance'],
  construction:['barrier','cone','sign_highway'],
  animals: ['animal_cow','animal_dog'],
  street_props: ['streetlight_curved','streetlight_square','construction_light','sign_highway','sign_highway_detailed','bollard'],
  lowpoly_city: ['lowpoly_billboard_2x1_03','lowpoly_billboard_2x1_05','lowpoly_billboard_4x1_03','lowpoly_billboard_4x1_04','lowpoly_bush_06','lowpoly_bush_07','lowpoly_bush_10','lowpoly_bus_stop_02','lowpoly_car_06','lowpoly_car_13','lowpoly_car_16','lowpoly_car_19','lowpoly_eco_building_grid','lowpoly_eco_building_slope','lowpoly_eco_building_terrace','lowpoly_fountain_03','lowpoly_futuristic_car_1','lowpoly_graffiti_03','lowpoly_palm_03','lowpoly_regular_building_twistedtower_large','lowpoly_road_001','lowpoly_road_003','lowpoly_road_009','lowpoly_road_013','lowpoly_road_019','lowpoly_road_020','lowpoly_road_022','lowpoly_set_b_tiles_01','lowpoly_set_b_tiles_04','lowpoly_set_b_tiles_05','lowpoly_set_b_tiles_06','lowpoly_set_b_tiles_09','lowpoly_signboard_01','lowpoly_spotlight_01','lowpoly_spotlight_02','lowpoly_traffic_light_001','lowpoly_traffic_light_002','lowpoly_traffic_light_003','lowpoly_trash_02','lowpoly_trash_03','lowpoly_trash_04','lowpoly_trash_05','lowpoly_trash_06','lowpoly_trash_can_04','lowpoly_trash_can_05','lowpoly_trash_can_06','lowpoly_trash_can_07','lowpoly_trash_can_08','lowpoly_van']
}


window.CORE_ASSETS = [
  'player_sample',
  'car','car_supercar_1','car_supercar_2','car_supercar_3','bmw_m4','nilu_27','cyberpunk_bike','taxi','police','ambulance','bus','truck','auto','bike','cars','trucks','emergency',
  'road_straight','road_intersect','road_cross','road_cross_path','road_intersect_path','road_bend','road_crossing','road_roundabout','road_avenue',
  'char_f_a','char_f_b','char_f_c','char_f_d','char_f_e','char_f_f',
  'char_m_a','char_m_b','char_m_c','char_m_d','char_m_e','char_m_f',
  'char_aid_cane',
  'tree_small','tree_large','animal_dog','animal_cow'
]


window._expandAssets = function (assets) {
  if (!assets || !assets.length) return [];
  const out = new Set();
  assets.forEach(a => {
    if (window.ASSET_GROUPS[a]) window.ASSET_GROUPS[a].forEach(k => out.add(k));
    else out.add(a);
  });
  // Auto-include street props and building kit for urban levels
  if (out.has('suburban') || out.has('industrial') || out.has('modular')) {
    if (window.ASSET_GROUPS.street_props) window.ASSET_GROUPS.street_props.forEach(k => out.add(k));
    if (window.ASSET_GROUPS.bkit) window.ASSET_GROUPS.bkit.forEach(k => out.add(k));
  }
  return [...out];
};



window.loadLevelAssets = function (keys, callback) {
  if (typeof THREE === 'undefined') { callback(); return }
  const manifest = window.ASSET_MANIFEST


  let toLoad
  if (keys === undefined || keys === null) {

    toLoad = Object.keys(manifest).filter(k => !window.PRELOADED_MODELS[k])
  } else {

    const expanded = window._expandAssets(keys)
    toLoad = expanded.filter(k => !window.PRELOADED_MODELS[k])
  }

  if (toLoad.length === 0) { setTimeout(callback, 0); return }

  let loaded = 0
  const total = toLoad.length
  const ld = document.getElementById('loading-screen')
  const pctEl = document.getElementById('loading-pct')
  const barEl = document.getElementById('loading-bar')
  const statusEl = document.getElementById('loading-status')


  function postProcess(root, key) {
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = !key.includes('road')
        child.receiveShadow = true
        if (child.material) {
          if (child.material.map) { child.material.map.magFilter = THREE.NearestFilter; child.material.map.minFilter = THREE.NearestFilter; child.material.map.needsUpdate = true }
          child.material.roughness = 0.8; child.material.metalness = 0.1
        }
      }
    })
  }


  function tick() {
    loaded++
    const pct = Math.round((loaded / total) * 100)
    if (pctEl) pctEl.textContent = pct + '%'
    if (barEl) barEl.style.width = pct + '%'
  }

  function done() {
    if (ld && ld.parentNode) {
      ld.innerHTML = '<h1 style="color:#34D399;">World Ready!</h1><div style="font-size:1rem;color:#8891AA;">Entering level...</div>'
      setTimeout(() => { ld.style.opacity = '0'; ld.style.transform = 'scale(1.05)'; setTimeout(() => { if (ld.parentNode) ld.remove() }, 400) }, 300)
    }
    callback()
  }

  const gltfLoader = (typeof THREE.GLTFLoader !== 'undefined') ? new THREE.GLTFLoader() : null
  const fbxLoader = (typeof THREE.FBXLoader !== 'undefined') ? new THREE.FBXLoader() : null
  const objLoader = (typeof THREE.OBJLoader !== 'undefined') ? new THREE.OBJLoader() : null

  function loadSingleAsset(key) {
    return new Promise((resolve) => {
      const entry = manifest[key]
      if (!entry) { tick(); resolve(); return }
      if (statusEl) statusEl.textContent = 'Loading: ' + key + '...'

      const fmt = (typeof entry === 'string') ? 'glb' : (entry.fmt || 'glb')
      const filePath = (typeof entry === 'string') ? entry : entry.path

      const onOk = (root) => {
        postProcess(root, key)
        const isFBXOBJ = (fmt === 'fbx' || fmt === 'obj')
        if (!isFBXOBJ) root.scale.set(4.5, 4.5, 4.5)
        window.PRELOADED_MODELS[key] = root
        tick()
        resolve()
      }
      const onErr = (err) => {
        console.warn('Error loading asset:', key, filePath, err)
        tick()
        resolve()
      }

      if (fmt === 'fbx' && fbxLoader) {
        fbxLoader.load(filePath, onOk, undefined, onErr)
      } else if (fmt === 'obj' && objLoader) {
        if (entry.mtl && typeof THREE.MTLLoader !== 'undefined') {
          new THREE.MTLLoader().load(entry.mtl, (mtl) => {
            mtl.preload()
            objLoader.setMaterials(mtl).load(filePath, onOk, undefined, onErr)
          }, undefined, onErr)
        } else {
          objLoader.load(filePath, onOk, undefined, onErr)
        }
      } else if ((fmt === 'glb' || fmt === 'gltf') && gltfLoader) {
        gltfLoader.load(filePath, (gltf) => { onOk(gltf.scene) }, undefined, onErr)
      } else {
        tick()
        resolve()
      }
    })
  }

  // Concurrent worker queue (concurrency = 8)
  const concurrency = 8
  let curIndex = 0
  async function worker() {
    while (curIndex < toLoad.length) {
      const idx = curIndex++
      await loadSingleAsset(toLoad[idx])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, toLoad.length) }, () => worker())
  Promise.all(workers).then(() => {
    done()
  })
}


function preloadModels(callback) {
  if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') { callback(); return }


  const ld = document.getElementById('loading-screen')
  const pctEl = document.getElementById('loading-pct')
  const barEl = document.getElementById('loading-bar')
  const statusEl = document.getElementById('loading-status')


  window.loadLevelAssets(window.CORE_ASSETS, () => {

    if (window.MODELS) {
      const loader = new THREE.GLTFLoader()
      Object.keys(window.MODELS).forEach((key) => {
        if (window.MODELS[key] && !window.PRELOADED_MODELS[key]) {
          try {
            loader.load(window.MODELS[key], (gltf) => {
              gltf.scene.traverse((child) => {
                if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material) { child.material.roughness = 0.8; child.material.metalness = 0.1 } }
              })
              gltf.scene.scale.set(4.5, 4.5, 4.5)
              window.PRELOADED_MODELS[key] = gltf.scene
            }, undefined, (err) => console.warn('Failed to load base64 model:', key, err))
          } catch(e) {
            console.error('SYNC Error parsing base64 for', key, e);
          }
        }
      })
    }
    callback()
  })
}

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

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.particles = []
    const colors = ['#ff6b35', '#ffd54a', '#4caf50', '#2196f3', '#e91e63', '#9c27b0', '#00bcd4', '#ff9800']
    const count = window.innerWidth < 600 ? 50 : 100
    for (let i = 0; i < count; i++) {
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

  this._submitAnswer(this._selectedAnswer, this._correctIdx)
  this._selectedAnswer = -1
}


ui._challanCards = []
ui._addChallanCard = function (off, amt) {
  try {
    const stack = document.getElementById('challan-stack')
    if (!stack) return
    stack.classList.add('on')
    const card = document.createElement('div')
    card.className = 'challan-card'

    const depth = stack.children.length
    const rot = -15 + depth * 3

    const cvcEl = document.getElementById('cvc-main')
    const cvcHtml = cvcEl ? cvcEl.innerHTML : '<div>Traffic Challan</div>'

    card.innerHTML = `<div style="width:400px; zoom: 0.18; transform: rotate(${rot}deg); box-shadow: -6px 6px 20px rgba(0,0,0,0.5); border-radius:16px; overflow:hidden; background:white; pointer-events:none;">${cvcHtml}</div>`
    stack.appendChild(card)
    this._challanCards.push(card)

    if (this._challanCards.length > 5) {
      const old = this._challanCards.shift()
      if (old.parentNode) old.parentNode.removeChild(old)
    }
  } catch (e) {
    console.warn('Add challan card error:', e)
  }
}

window.ui = window.ui || {}
window.sfx = window.sfx || { play: () => {} }
preloadModels(() => {

  const _isDriving = window.location.pathname.toLowerCase().includes('driving')
  if (_isDriving) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'))
  }

  // Init UI then create game (guard against ui.js/game_core.js not loaded yet)
  function _doBoot() {
    if (typeof ui.init === 'function') ui.init()
    if (typeof Game !== 'undefined') {
      game = new Game()
      window.game = game
    } else {
      // game_core.js hasn't loaded yet - report error
      console.error('Game class not found - game_core.js failed to load')
      document.body.innerHTML = '<div style="color:white;text-align:center;padding:50px;font-family:sans-serif"><h1>Loading Error</h1><p>Game engine failed to load. Please refresh.</p></div>'
    }
  }

  if (typeof Game !== 'undefined') {
    // Game class ready - boot now (ui.init can run later if needed)
    if (typeof ui.init === 'function') ui.init()
    game = new Game()
    window.game = game
  } else {
    // game_core.js hasn't loaded yet - poll for it
    var _bootWait = setInterval(function() {
      if (typeof Game !== 'undefined') {
        clearInterval(_bootWait)
        if (typeof ui.init === 'function') ui.init()
        game = new Game()
        window.game = game
      }
    }, 50)
    setTimeout(function() { clearInterval(_bootWait) }, 5000)
  }

  const urlParams = new URLSearchParams(window.location.search)
  let lvId = urlParams.get('lv') || localStorage.getItem('traffic_lv') || '1'
  let mode = urlParams.get('mode') || localStorage.getItem('traffic_mode') || 'car'
  let veh = urlParams.get('veh') || localStorage.getItem('traffic_veh') || (mode === 'pedestrian' ? 'pedestrian' : (S.vehicle?.toLowerCase() || 'car'))

  const isLevelsScreen = urlParams.get('screen') === 'levels'

  if (_isDriving) {
    if (!isLevelsScreen) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'))
    }

    if (lvId && !isLevelsScreen) {
      let levelObj = window.LVS ? window.LVS.find((l) => l.id == lvId) : null

      if (!levelObj && (lvId === 'custom' || lvId === 'freeroam')) {
        levelObj = {
          id: lvId,
          themeType: 'free_roam',
          name: 'Free Roam City',
          mode: mode || 'car',
          vehMode: veh || mode || 'car',
          assets: ['cars', 'suburban', 'industrial'],
          noTimer: true,
          noScore: true,
          noObjective: true
        }
      }
      if (!levelObj && window.LVS && window.LVS.length > 0) {
        levelObj = window.LVS[0]
      }
      if (levelObj) {
        ui.cur = levelObj
        ui.curMode = mode || 'car'
        ui.cur.vehMode = (mode === 'pedestrian' ? 'pedestrian' : (veh || ui.curMode))
        levelObj.mode = mode
        levelObj.vehMode = ui.cur.vehMode

        let _drivingRedirected = false
        function _redirectToAcademy() {
          if (_drivingRedirected) return
          _drivingRedirected = true
          console.warn('[Driving] Canvas timeout or level launch issue')
        }

        const _startTime = Date.now()
        const _drivingTimeout = setTimeout(function _checkCanvasTimeout() {
          const gc = document.getElementById('gc')
          const ls = document.getElementById('loading-screen')
          const isLoading = ls && ls.style.display !== 'none' && !ls.classList.contains('fade-out')
          if (!gc || !gc.classList.contains('on')) {
            if (isLoading || Date.now() - _startTime < 30000) {
              setTimeout(_checkCanvasTimeout, 500)
            } else {
              _redirectToAcademy()
            }
          }
        }, 3000)

        function _doStartLevel() {
          const overlay = document.getElementById('play-overlay')
          if (overlay) {
            overlay.style.display = 'none'
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
          }
          try {
            if (!window.game || typeof window.game.startLevel !== 'function') {
              console.warn('Game not ready yet, retrying...')
              setTimeout(_doStartLevel, 200)
              return
            }
            window.game.startLevel()

            const _startCheck = Date.now()
            ;(function _watchCanvas() {
              const gc = document.getElementById('gc')
              if (gc && gc.classList.contains('on')) {
                clearTimeout(_drivingTimeout)
                return
              }

              if (Date.now() - _startCheck < 18000) {
                setTimeout(_watchCanvas, 300)
              }
            })()
          } catch (err) {
            console.error('game.startLevel() failed:', err)
            clearTimeout(_drivingTimeout)
            _redirectToAcademy()
          }
        }

        const _isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768

        function _onPlayClick() {
          const overlay = document.getElementById('play-overlay')
          if (overlay) {
            overlay.style.display = 'none'
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
          }
          if (!_isMobile && document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
          }
          if (!window.game) {
            var _playWait = setInterval(function() {
              if (window.game) {
                clearInterval(_playWait)
                _doStartLevel()
              }
            }, 100)
            setTimeout(function() { clearInterval(_playWait) }, 5000)
          } else {
            _doStartLevel()
          }
        }

        // Start level directly without blocking overlay
        if (window.game) {
          _doStartLevel()
        } else {
          var _loadWait = setInterval(function() {
            if (window.game) {
              clearInterval(_loadWait)
              _doStartLevel()
            }
          }, 100)
          setTimeout(function() { clearInterval(_loadWait) }, 5000)
        }
      } else {
        console.warn('[Driving] Level not found');
      }
    } else {

      if (ui.showLevels) ui.showLevels()
    }
  } else {

    const alreadyActive = document.querySelector('.screen.active')
    if (!alreadyActive || alreadyActive.id === 'ss') {
      if (ui.showStart) ui.showStart()
    }
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
