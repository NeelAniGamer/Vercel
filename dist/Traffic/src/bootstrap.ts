// @ts-nocheck
/**
 * Bootstrap — migrated from start.js
 * Asset manifest, groups, loading, confetti, boot flow
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

// ===== Asset Manifest =====

export interface AssetEntry {
  path: string;
  fmt: 'glb' | 'gltf' | 'fbx' | 'obj';
  mtl?: string | null;
}

export const ASSET_MANIFEST: Record<string, AssetEntry> = {};
export const PRELOADED_MODELS: Record<string, THREE.Object3D> = {};

(function buildManifest() {
  const carKit = 'Models/kenney_car-kit/Models/GLB format/';
  const roadKit = 'Models/kenney_city-kit-roads/Models/GLB format/';
  const charKit = 'Models/kenney_mini-characters/Models/GLB format/';
  const subKit = 'Models/kenney_city-kit-suburban_20/Models/GLB format/';
  const indKit = 'Models/kenney_city-kit-industrial_1.0/Models/GLB format/';
  const mbKit = 'Models/kenney_modular-buildings/Models/GLB format/';
  const bkKit = 'Models/kenney_building-kit/Models/GLB format/';
  const wcKit = 'Models/kenney_watercraft-pack/Models/GLB format/';
  const tkKit = 'Models/kenney_train-kit/Models/GLB format/';
  const M = ASSET_MANIFEST;

  function glb(p: string): AssetEntry { return { path: p, fmt: 'glb' }; }
  function fbx(p: string): AssetEntry { return { path: p, fmt: 'fbx' }; }
  function obj(p: string, m?: string): AssetEntry { return { path: p, fmt: 'obj', mtl: m || null }; }

  // Vehicles
  M.car = glb(carKit + 'sedan.glb'); M.taxi = glb(carKit + 'taxi.glb'); M.police = glb(carKit + 'police.glb');
  M.bus = glb(carKit + 'delivery.glb'); M.truck = glb(carKit + 'truck.glb'); M.auto = glb(carKit + 'van.glb'); M.bike = glb(carKit + 'race.glb');
  M.ambulance = glb(carKit + 'ambulance.glb');
  ['hatchback-sports','suv','suv-luxury','race-future','sedan-sports','kart-oobi','kart-oodi','kart-ooli','kart-oopi','kart-oozi','tractor','tractor-police','tractor-shovel'].forEach(c => { M['car_'+c] = glb(carKit + c + '.glb'); });
  ['firetruck','garbage-truck','truck-flat'].forEach(t => { M['truck_'+t] = glb(carKit + t + '.glb'); });
  M.lowpoly_cars = fbx('Models/uploads_files_3354643_LowPoly_Cars_01_fbx.FBX');

  // Roads
  M.road_straight = glb(roadKit + 'road-straight.glb'); M.road_intersect = glb(roadKit + 'road-intersection.glb');
  M.road_cross = glb(roadKit + 'road-crossroad.glb'); M.road_cross_path = glb(roadKit + 'road-crossroad-path.glb');
  M.road_intersect_path = glb(roadKit + 'road-intersection-path.glb'); M.road_bend = glb(roadKit + 'road-bend-sidewalk.glb');
  M.road_crossing = glb(roadKit + 'road-crossing.glb'); M.road_roundabout = glb(roadKit + 'road-roundabout.glb');
  M.barrier = glb(roadKit + 'construction-barrier.glb'); M.cone = glb(roadKit + 'construction-cone.glb'); M.sign_highway = glb(roadKit + 'sign-highway.glb');
  M.road_avenue = { path: 'Models/road__avenue__street/scene.gltf', fmt: 'gltf' };

  // Characters
  M.char_f_a = glb(charKit + 'character-female-a.glb'); M.char_f_b = glb(charKit + 'character-female-b.glb'); M.char_f_c = glb(charKit + 'character-female-c.glb');
  M.char_m_a = glb(charKit + 'character-male-a.glb'); M.char_m_b = glb(charKit + 'character-male-b.glb'); M.char_m_c = glb(charKit + 'character-male-c.glb');

  // Animated characters
  ['survivors','retro','protagonists'].forEach(pack => {
    M['anim_' + pack] = fbx('Models/kenney_animated-characters-' + pack + '/Model/characterMedium.fbx');
  });

  // Buildings
  'abcdefghijklmnopqrstu'.split('').forEach(l => { M['suburban_'+l] = glb(subKit + 'building-type-' + l + '.glb'); });
  'abcdefghijklmnopqrst'.split('').forEach(l => { M['industrial_'+l] = glb(indKit + 'building-' + l + '.glb'); });
  ['sample-house-a','sample-house-b','sample-house-c'].forEach(h => { M['mbuilding_'+h] = glb(mbKit + 'building-' + h + '.glb'); });
  ['sample-tower-a','sample-tower-b','sample-tower-c','sample-tower-d'].forEach(t => { M['mbuilding_'+t] = glb(mbKit + 'building-' + t + '.glb'); });

  // Building kit
  ['wall','wall-doorway-square','wall-doorway-round','wall-doorway-wide-round','wall-doorway-wide-square',
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
  ].forEach(w => { M['bkit_'+w] = glb(bkKit + w + '.glb'); });
  ['barricade-doorway-a','barricade-doorway-b','barricade-doorway-c','barricade-window-a','barricade-window-b','barricade-window-c'].forEach(b => { M['bkit_'+b] = glb(bkKit + b + '.glb'); });

  // Watercraft & trains
  M.ship_cargo = glb(wcKit + 'ship-cargo-a.glb'); M.boat_speed = glb(wcKit + 'boat-speed-a.glb');
  ['boat-speed-b','boat-speed-c','boat-fishing-small','boat-tug-a','ship-cargo-b','ship-small'].forEach(w => { M['wc_'+w] = glb(wcKit + w + '.glb'); });
  M.train = glb(tkKit + 'train-locomotive-a.glb'); M.metro = glb(tkKit + 'train-electric-subway-a.glb');
  ['train-diesel-a','train-electric-bullet-a','train-tram-modern','train-carriage-box'].forEach(t => { M['tk_'+t] = glb(tkKit + t + '.glb'); });

  // Trees & animals
  M.tree_small = glb(subKit + 'tree-small.glb'); M.tree_large = glb(subKit + 'tree-large.glb'); M.planter = glb(subKit + 'planter.glb');
  const petsKit = 'Models/kenney_cube-pets_1.0/Models/GLB format/';
  M.animal_cow = glb(petsKit + 'animal-cow.glb'); M.animal_dog = glb(petsKit + 'animal-dog.glb');

  // Low-poly city kit
  const sepKit = 'Models/source/Separate_assets_glb/Separate_assets_glb/';
  M.streetlight_curved = glb(roadKit + 'light-curved.glb');
  M.streetlight_square = glb(roadKit + 'light-square.glb');
  M.construction_light = glb(roadKit + 'construction-light.glb');
  M.sign_highway_detailed = glb(roadKit + 'sign-highway-detailed.glb');
  M.bollard = glb(roadKit + 'bollard.glb');

  M.lowpoly_billboard_2x1_03 = glb(sepKit + 'Billboard_2x1_03.glb');
  M.lowpoly_billboard_2x1_05 = glb(sepKit + 'Billboard_2x1_05.glb');
  M.lowpoly_billboard_4x1_03 = glb(sepKit + 'Billboard_4x1_03.glb');
  M.lowpoly_billboard_4x1_04 = glb(sepKit + 'Billboard_4x1_04.glb');
  M.lowpoly_bush_06 = glb(sepKit + 'Bush_06.glb');
  M.lowpoly_bush_07 = glb(sepKit + 'Bush_07.glb');
  M.lowpoly_bush_10 = glb(sepKit + 'Bush_10.glb');
  M.lowpoly_bus_stop_02 = glb(sepKit + 'Bus_Stop_02.glb');
  M.lowpoly_car_06 = glb(sepKit + 'Car_06.glb');
  M.lowpoly_car_13 = glb(sepKit + 'Car_13.glb');
  M.lowpoly_car_16 = glb(sepKit + 'Car_16.glb');
  M.lowpoly_car_19 = glb(sepKit + 'Car_19.glb');
  M.lowpoly_eco_building_grid = glb(sepKit + 'Eco_Building_Grid.glb');
  M.lowpoly_eco_building_slope = glb(sepKit + 'Eco_Building_Slope.glb');
  M.lowpoly_eco_building_terrace = glb(sepKit + 'Eco_Building_Terrace.glb');
  M.lowpoly_fountain_03 = glb(sepKit + 'Fountain_03.glb');
  M.lowpoly_futuristic_car_1 = glb(sepKit + 'Futuristic_Car_1.glb');
  M.lowpoly_graffiti_03 = glb(sepKit + 'Graffiti_03.glb');
  M.lowpoly_palm_03 = glb(sepKit + 'Palm_03.glb');
  M.lowpoly_regular_building_twistedtower_large = glb(sepKit + 'Regular_Building_TwistedTower_Large.glb');
  M.lowpoly_road_001 = glb(sepKit + 'road_001.glb');
  M.lowpoly_road_003 = glb(sepKit + 'road_003.glb');
  M.lowpoly_road_009 = glb(sepKit + 'road_009.glb');
  M.lowpoly_road_013 = glb(sepKit + 'road_013.glb');
  M.lowpoly_road_019 = glb(sepKit + 'road_019.glb');
  M.lowpoly_road_020 = glb(sepKit + 'road_020.glb');
  M.lowpoly_road_022 = glb(sepKit + 'road_022.glb');
  M.lowpoly_set_b_tiles_01 = glb(sepKit + 'Set_B_Tiles_01.glb');
  M.lowpoly_set_b_tiles_04 = glb(sepKit + 'Set_B_Tiles_04.glb');
  M.lowpoly_set_b_tiles_05 = glb(sepKit + 'Set_B_Tiles_05.glb');
  M.lowpoly_set_b_tiles_06 = glb(sepKit + 'Set_B_Tiles_06.glb');
  M.lowpoly_set_b_tiles_09 = glb(sepKit + 'Set_B_Tiles_09.glb');
  M.lowpoly_signboard_01 = glb(sepKit + 'Signboard_01.glb');
  M.lowpoly_spotlight_01 = glb(sepKit + 'Spotlight_01.glb');
  M.lowpoly_spotlight_02 = glb(sepKit + 'Spotlight_02.glb');
  M.lowpoly_traffic_light_001 = glb(sepKit + 'traffic_light_001.glb');
  M.lowpoly_traffic_light_002 = glb(sepKit + 'traffic_light_002.glb');
  M.lowpoly_traffic_light_003 = glb(sepKit + 'traffic_light_003.glb');
  M.lowpoly_trash_02 = glb(sepKit + 'Trash_02.glb');
  M.lowpoly_trash_03 = glb(sepKit + 'Trash_03.glb');
  M.lowpoly_trash_04 = glb(sepKit + 'Trash_04.glb');
  M.lowpoly_trash_05 = glb(sepKit + 'Trash_05.glb');
  M.lowpoly_trash_06 = glb(sepKit + 'Trash_06.glb');
  M.lowpoly_trash_can_04 = glb(sepKit + 'Trash_Can_04.glb');
  M.lowpoly_trash_can_05 = glb(sepKit + 'Trash_Can_05.glb');
  M.lowpoly_trash_can_06 = glb(sepKit + 'Trash_Can_06.glb');
  M.lowpoly_trash_can_07 = glb(sepKit + 'Trash_Can_07.glb');
  M.lowpoly_trash_can_08 = glb(sepKit + 'Trash_Can_08.glb');
  M.lowpoly_van = glb(sepKit + 'Van.glb');
})();

// ===== Asset Groups =====

export const ASSET_GROUPS: Record<string, string[]> = {
  suburban: 'abcdefghijklmnopqrstu'.split('').map(l => 'suburban_' + l),
  industrial: 'abcdefghijklmnopqrst'.split('').map(l => 'industrial_' + l),
  cars: ['car_hatchback-sports','car_suv','car_suv-luxury','car_race-future','car_sedan-sports','car_kart-oobi','car_kart-oodi','car_kart-ooli','car_kart-oopi','car_kart-oozi','car_tractor','car_tractor-police','car_tractor-shovel'],
  trucks: ['truck_firetruck','truck_garbage-truck','truck_truck-flat'],
  modular: ['mbuilding_sample-house-a','mbuilding_sample-house-b','mbuilding_sample-house-c','mbuilding_sample-tower-a','mbuilding_sample-tower-b','mbuilding_sample-tower-c','mbuilding_sample-tower-d'],
  bkit: [
    'bkit_wall','bkit_wall-doorway-square','bkit_wall-doorway-round','bkit_wall-doorway-wide-round','bkit_wall-doorway-wide-square',
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
    'bkit_barricade-doorway-a','bkit_barricade-doorway-b','bkit_barricade-doorway-c','bkit_barricade-window-a','bkit_barricade-window-b','bkit_barricade-window-c'
  ],
  watercraft: ['ship_cargo','boat_speed','wc_boat-speed-b','wc_boat-speed-c','wc_boat-fishing-small','wc_boat-tug-a','wc_ship-cargo-b','wc_ship-small'],
  trains: ['train','metro','tk_train-diesel-a','tk_train-electric-bullet-a','tk_train-tram-modern','tk_train-carriage-box'],
  emergency: ['ambulance'],
  construction: ['barrier','cone','sign_highway'],
  animals: ['animal_cow','animal_dog'],
  street_props: ['streetlight_curved','streetlight_square','construction_light','sign_highway','sign_highway_detailed','bollard'],
  lowpoly_city: ['lowpoly_billboard_2x1_03','lowpoly_billboard_2x1_05','lowpoly_billboard_4x1_03','lowpoly_billboard_4x1_04','lowpoly_bush_06','lowpoly_bush_07','lowpoly_bush_10','lowpoly_bus_stop_02','lowpoly_car_06','lowpoly_car_13','lowpoly_car_16','lowpoly_car_19','lowpoly_eco_building_grid','lowpoly_eco_building_slope','lowpoly_eco_building_terrace','lowpoly_fountain_03','lowpoly_futuristic_car_1','lowpoly_graffiti_03','lowpoly_palm_03','lowpoly_regular_building_twistedtower_large','lowpoly_road_001','lowpoly_road_003','lowpoly_road_009','lowpoly_road_013','lowpoly_road_019','lowpoly_road_020','lowpoly_road_022','lowpoly_set_b_tiles_01','lowpoly_set_b_tiles_04','lowpoly_set_b_tiles_05','lowpoly_set_b_tiles_06','lowpoly_set_b_tiles_09','lowpoly_signboard_01','lowpoly_spotlight_01','lowpoly_spotlight_02','lowpoly_traffic_light_001','lowpoly_traffic_light_002','lowpoly_traffic_light_003','lowpoly_trash_02','lowpoly_trash_03','lowpoly_trash_04','lowpoly_trash_05','lowpoly_trash_06','lowpoly_trash_can_04','lowpoly_trash_can_05','lowpoly_trash_can_06','lowpoly_trash_can_07','lowpoly_trash_can_08','lowpoly_van']
};

export const CORE_ASSETS = [
  'car','taxi','police','bus','truck','auto','bike',
  'road_straight','road_intersect','road_cross','road_cross_path','road_intersect_path','road_bend','road_crossing','road_roundabout','road_avenue',
  'char_f_a','char_f_b','char_f_c','char_m_a','char_m_b','char_m_c',
  'tree_small','tree_large','animal_dog'
];

// ===== Asset Expansion & Loading =====

export function expandAssets(assets: string[]): string[] {
  if (!assets || !assets.length) return [];
  const out = new Set<string>();
  assets.forEach(a => {
    if (ASSET_GROUPS[a]) ASSET_GROUPS[a].forEach(k => out.add(k));
    else out.add(a);
  });
  if (out.has('suburban') || out.has('industrial') || out.has('modular')) {
    if (ASSET_GROUPS.street_props) ASSET_GROUPS.street_props.forEach(k => out.add(k));
    if (ASSET_GROUPS.bkit) ASSET_GROUPS.bkit.forEach(k => out.add(k));
  }
  return [...out];
}

function postProcess(root: THREE.Object3D, key: string): void {
  root.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = !key.includes('road');
      child.receiveShadow = true;
      if (child.material) {
        if (child.material.map) {
          child.material.map.magFilter = THREE.NearestFilter;
          child.material.map.minFilter = THREE.NearestFilter;
          child.material.map.needsUpdate = true;
        }
        child.material.roughness = 0.8;
        child.material.metalness = 0.1;
      }
    }
  });
}

export function loadLevelAssets(keys: string[] | null, callback: () => void): void {
  const manifest = ASSET_MANIFEST;

  let toLoad: string[];
  if (keys === undefined || keys === null) {
    toLoad = Object.keys(manifest).filter(k => !PRELOADED_MODELS[k]);
  } else {
    const expanded = expandAssets(keys);
    toLoad = expanded.filter(k => !PRELOADED_MODELS[k]);
  }

  if (toLoad.length === 0) { setTimeout(callback, 0); return; }

  let loaded = 0;
  const total = toLoad.length;
  const ld = document.getElementById('loading-screen');
  const pctEl = document.getElementById('loading-pct');
  const barEl = document.getElementById('loading-bar') as HTMLElement | null;
  const statusEl = document.getElementById('loading-status');

  function tick(): void {
    loaded++;
    const pct = Math.round((loaded / total) * 100);
    if (pctEl) pctEl.textContent = pct + '%';
    if (barEl) barEl.style.width = pct + '%';
  }

  function done(): void {
    if (ld && ld.parentNode) {
      ld.innerHTML = '<h1 style="color:#34D399;">World Ready!</h1><div style="font-size:1rem;color:#8891AA;">Entering level...</div>';
      setTimeout(() => {
        ld.style.opacity = '0';
        ld.style.transform = 'scale(1.05)';
        setTimeout(() => { if (ld.parentNode) ld.remove(); }, 800);
      }, 600);
    }
    callback();
  }

  const gltfLoader = new GLTFLoader();
  const fbxLoader = new FBXLoader();
  const objLoader = new OBJLoader();

  const loadNext = (index: number): void => {
    if (index >= toLoad.length) { done(); return; }
    const key = toLoad[index];
    const entry = manifest[key];
    if (!entry) { tick(); setTimeout(() => loadNext(index + 1), 0); return; }
    if (statusEl) statusEl.textContent = 'Loading: ' + key + '...';

    const fmt = entry.fmt || 'glb';
    const filePath = entry.path;

    const onOk = (root: THREE.Object3D) => {
      postProcess(root, key);
      const isFBXOBJ = (fmt === 'fbx' || fmt === 'obj');
      if (!isFBXOBJ) root.scale.set(4.5, 4.5, 4.5);
      PRELOADED_MODELS[key] = root;
      tick();
      setTimeout(() => loadNext(index + 1), 0);
    };
    const onErr = (err: any) => {
      console.error('Error loading asset:', key, filePath, err);
      tick();
      setTimeout(() => loadNext(index + 1), 0);
    };

    try {
      if (fmt === 'fbx') {
        fbxLoader.load(filePath, (fbxObj) => onOk(fbxObj), undefined, onErr);
      } else if (fmt === 'obj') {
        if (entry.mtl) {
          new MTLLoader().load(entry.mtl, (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl).load(filePath, (objRes) => onOk(objRes), undefined, onErr);
          }, undefined, onErr);
        } else {
          objLoader.load(filePath, (objRes) => onOk(objRes), undefined, onErr);
        }
      } else {
        gltfLoader.load(filePath, (gltf) => onOk(gltf.scene), undefined, onErr);
      }
    } catch (e) {
      console.warn('Unknown format or missing loader for:', key, fmt);
      tick();
      setTimeout(() => loadNext(index + 1), 0);
    }
  };
  setTimeout(() => loadNext(0), 50);
}

export function preloadModels(callback: () => void): void {
  loadLevelAssets(CORE_ASSETS, () => {
    if ((window as any).MODELS) {
      const loader = new GLTFLoader();
      Object.keys((window as any).MODELS).forEach((key) => {
        const url = (window as any).MODELS[key];
        if (url && !PRELOADED_MODELS[key]) {
          try {
            loader.load(url, (gltf) => {
              gltf.scene.traverse((child: any) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                  if (child.material) { child.material.roughness = 0.8; child.material.metalness = 0.1; }
                }
              });
              gltf.scene.scale.set(4.5, 4.5, 4.5);
              PRELOADED_MODELS[key] = gltf.scene;
            }, undefined, (err) => console.warn('Failed to load base64 model:', key, err));
          } catch (e) {
            console.error('SYNC Error parsing base64 for', key, e);
          }
        }
      });
    }
    callback();
  });
}

// ===== Confetti =====

export const confetti = {
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  particles: [] as any[],
  running: false,

  init() {
    if (this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;inset:0;z-index:20;pointer-events:none;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  },

  burst(duration = 3000) {
    this.init();
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.canvas!.width = window.innerWidth;
    this.canvas!.height = window.innerHeight;
    this.particles = [];
    const colors = ['#ff6b35', '#ffd54a', '#4caf50', '#2196f3', '#e91e63', '#9c27b0', '#00bcd4', '#ff9800'];
    const count = window.innerWidth < 600 ? 50 : 100;
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
      });
    }
    this.running = true;
    const start = Date.now();
    const animate = () => {
      if (!this.running) return;
      const elapsed = Date.now() - start;
      if (elapsed > duration) {
        this.running = false;
        this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        return;
      }
      this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.particles.forEach((p) => {
        p.x += p.vx;
        p.vy += 0.35;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / duration);
        this.ctx!.save();
        this.ctx!.translate(p.x, p.y);
        this.ctx!.rotate((p.rot * Math.PI) / 180);
        this.ctx!.globalAlpha = p.life;
        this.ctx!.fillStyle = p.color;
        this.ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx!.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
  }
};

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).PRELOADED_MODELS = PRELOADED_MODELS;
  (window as any).ASSET_MANIFEST = ASSET_MANIFEST;
  (window as any).ASSET_GROUPS = ASSET_GROUPS;
  (window as any).CORE_ASSETS = CORE_ASSETS;
  (window as any)._expandAssets = expandAssets;
  (window as any).loadLevelAssets = loadLevelAssets;
  (window as any).confetti = confetti;
}