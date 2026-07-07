/**
 * AssetLoader — GLB/GLTF preloading with cache.
 * Ported from Traffic/start.js _preloadModels + loadLevelAssets.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_MANIFEST, CORE_ASSETS, expandAssets } from './ASSET_MANIFEST';

const SCALE = 4.5;

export type AssetCache = Map<string, THREE.Group>;

declare global {
  interface Window { PRELOADED_MODELS: AssetCache }
}

if (!window.PRELOADED_MODELS) window.PRELOADED_MODELS = new Map();

const loader = new GLTFLoader();
const inFlight = new Map<string, Promise<THREE.Group>>();

/** Load a single GLB by manifest key. Returns cached clone. */
export async function loadAsset(key: string): Promise<THREE.Group> {
  const cached = window.PRELOADED_MODELS.get(key);
  if (cached) return cached.clone();

  if (inFlight.has(key)) return (await inFlight.get(key)!).clone();

  const path = ASSET_MANIFEST[key];
  if (!path) {
    console.warn(`[AssetLoader] Unknown key: ${key}`);
    return buildFallbackGroup();
  }

  const p = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      path,
      gltf => {
        const model = gltf.scene;
        model.scale.setScalar(SCALE);
        window.PRELOADED_MODELS.set(key, model);
        resolve(model);
      },
      undefined,
      err => {
        console.warn(`[AssetLoader] Failed to load ${key}:`, err);
        resolve(buildFallbackGroup());
      }
    );
  });

  inFlight.set(key, p);
  try {
    return (await p).clone();
  } finally {
    inFlight.delete(key);
  }
}

/** Load a batch of keys in parallel. */
export async function loadAssets(keys: string[]): Promise<void> {
  await Promise.all(keys.map(k => loadAsset(k)));
}

/** Load core assets (21 models) for fast startup. */
export async function loadCoreAssets(): Promise<void> {
  await loadAssets(CORE_ASSETS);
}

/** Load level assets based on themeType. */
export async function loadLevelAssets(themeType: string): Promise<void> {
  const needed = getAssetsForTheme(themeType);
  const notLoaded = needed.filter(k => !window.PRELOADED_MODELS.has(k));
  if (notLoaded.length === 0) return;
  await loadAssets(notLoaded);
}

/** Return asset keys needed for a given themeType. */
function getAssetsForTheme(themeType: string): string[] {
  const base = ['car','taxi','police','bus','truck','auto','bike',
    'road_straight','road_intersect','road_cross','road_cross_path',
    'road_intersect_path','road_bend','road_crossing','road_roundabout',
    'char_f_a','char_f_b','char_f_c','char_m_a','char_m_b','char_m_c'];

  switch (themeType) {
    case 'suburban':       return [...base, ...expandAssets(['suburban','industrial'])];
    case 'industrial':     return [...base, ...expandAssets(['industrial'])];
    case 'highway':        return [...base, 'truck_firetruck','truck_garbage-truck','sign_highway'];
    case 'nightlife':      return [...base, ...expandAssets(['cars'])];
    case 'school':         return [...base, 'car_tractor'];
    case 'market':         return [...base, ...expandAssets(['cars'])];
    case 'construction':   return [...base, ...expandAssets(['construction'])];
    case 'mountain':       return [...base, 'car_tractor','car_suv'];
    case 'hospital':       return [...base, 'ambulance'];
    case 'rain':           return [...base];
    case 'rain_heavy':     return [...base];
    case 'fog':            return [...base];
    case 'night':          return [...base, ...expandAssets(['cars'])];
    case 'night_rain':     return [...base];
    case 'temple':         return [...base, ...expandAssets(['suburban'])];
    case 'bus_interior':   return [...base];
    case 'driving_school': return [...base];
    case 'festival':       return [...base, ...expandAssets(['cars'])];
    case 'signs':          return [...base, 'sign_highway'];
    case 'driving_academy': return [...base];
    case 'military':       return [...base, 'car_suv','truck_firetruck'];
    case 'zero_visibility': return [...base];
    case 'open_world':     return [...base, ...expandAssets(['cars','trucks'])];
    default:               return [...base, ...expandAssets(['suburban','industrial'])];
  }
}

/** Create a simple fallback box group. */
function buildFallbackGroup(): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(2, 1.5, 4);
  const mat = new THREE.MeshToonMaterial({ color: 0x444444 });
  g.add(new THREE.Mesh(geo, mat));
  g.scale.setScalar(SCALE);
  return g;
}

/** Check if an asset is cached. */
export function isAssetCached(key: string): boolean {
  return window.PRELOADED_MODELS.has(key);
}

/** Get cache size. */
export function getCacheSize(): number {
  return window.PRELOADED_MODELS.size;
}
