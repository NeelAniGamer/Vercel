/**
 * ASSET_MANIFEST — All GLB model paths, ported from start.js lines 29-85.
 */

const CAR_KIT = 'Models/kenney_car-kit/Models/GLB format/';
const ROAD_KIT = 'Models/kenney_city-kit-roads/Models/GLB format/';
const CHAR_KIT = 'Models/kenney_mini-characters/Models/GLB format/';
const SUB_KIT = 'Models/kenney_city-kit-suburban_20/Models/GLB format/';
const IND_KIT = 'Models/kenney_city-kit-industrial_1.0/Models/GLB format/';
const MB_KIT = 'Models/kenney_modular-buildings/Models/GLB format/';
const BK_KIT = 'Models/kenney_building-kit/Models/GLB format/';
const WC_KIT = 'Models/kenney_watercraft-pack/Models/GLB format/';
const TK_KIT = 'Models/kenney_train-kit/Models/GLB format/';

export const ASSET_MANIFEST: Record<string, string> = {};

// Vehicles — core
ASSET_MANIFEST.car = CAR_KIT + 'sedan.glb';
ASSET_MANIFEST.taxi = CAR_KIT + 'taxi.glb';
ASSET_MANIFEST.police = CAR_KIT + 'police.glb';
ASSET_MANIFEST.bus = CAR_KIT + 'delivery.glb';
ASSET_MANIFEST.truck = CAR_KIT + 'truck.glb';
ASSET_MANIFEST.auto = CAR_KIT + 'van.glb';
ASSET_MANIFEST.bike = CAR_KIT + 'race.glb';
ASSET_MANIFEST.ambulance = CAR_KIT + 'ambulance.glb';

// Vehicle variants
['hatchback-sports','suv','suv-luxury','race-future','sedan-sports',
 'kart-oobi','kart-oodi','kart-ooli','kart-oopi','kart-oozi',
 'tractor','tractor-police','tractor-shovel'].forEach(c => {
  ASSET_MANIFEST['car_' + c] = CAR_KIT + c + '.glb';
});

['firetruck','garbage-truck','truck-flat'].forEach(t => {
  ASSET_MANIFEST['truck_' + t] = CAR_KIT + t + '.glb';
});

// Roads
ASSET_MANIFEST.road_straight = ROAD_KIT + 'road-straight.glb';
ASSET_MANIFEST.road_intersect = ROAD_KIT + 'road-intersection.glb';
ASSET_MANIFEST.road_cross = ROAD_KIT + 'road-crossroad.glb';
ASSET_MANIFEST.road_cross_path = ROAD_KIT + 'road-crossroad-path.glb';
ASSET_MANIFEST.road_intersect_path = ROAD_KIT + 'road-intersection-path.glb';
ASSET_MANIFEST.road_bend = ROAD_KIT + 'road-bend-sidewalk.glb';
ASSET_MANIFEST.road_crossing = ROAD_KIT + 'road-crossing.glb';
ASSET_MANIFEST.road_roundabout = ROAD_KIT + 'road-roundabout.glb';
ASSET_MANIFEST.barrier = ROAD_KIT + 'construction-barrier.glb';
ASSET_MANIFEST.cone = ROAD_KIT + 'construction-cone.glb';
ASSET_MANIFEST.sign_highway = ROAD_KIT + 'sign-highway.glb';

// Characters
ASSET_MANIFEST.char_f_a = CHAR_KIT + 'character-female-a.glb';
ASSET_MANIFEST.char_f_b = CHAR_KIT + 'character-female-b.glb';
ASSET_MANIFEST.char_f_c = CHAR_KIT + 'character-female-c.glb';
ASSET_MANIFEST.char_m_a = CHAR_KIT + 'character-male-a.glb';
ASSET_MANIFEST.char_m_b = CHAR_KIT + 'character-male-b.glb';
ASSET_MANIFEST.char_m_c = CHAR_KIT + 'character-male-c.glb';

// Suburban buildings (a-u)
'abcdefghijklmnopqrstu'.split('').forEach(l => {
  ASSET_MANIFEST['suburban_' + l] = SUB_KIT + 'building-type-' + l + '.glb';
});

// Industrial buildings (a-t)
'abcdefghijklmnopqrst'.split('').forEach(l => {
  ASSET_MANIFEST['industrial_' + l] = IND_KIT + 'building-' + l + '.glb';
});

// Modular buildings
['sample-house-a','sample-house-b','sample-house-c'].forEach(h => {
  ASSET_MANIFEST['mbuilding_' + h] = MB_KIT + 'building-' + h + '.glb';
});
['sample-tower-a','sample-tower-b','sample-tower-c','sample-tower-d'].forEach(t => {
  ASSET_MANIFEST['mbuilding_' + t] = MB_KIT + 'building-' + t + '.glb';
});

// Building kit
['wall','wall-doorway-square','column','column-wide'].forEach(w => {
  ASSET_MANIFEST['bkit_' + w] = BK_KIT + w + '.glb';
});
['barricade-doorway-a','barricade-doorway-b'].forEach(b => {
  ASSET_MANIFEST['bkit_' + b] = BK_KIT + b + '.glb';
});

// Watercraft
ASSET_MANIFEST.ship_cargo = WC_KIT + 'ship-cargo-a.glb';
ASSET_MANIFEST.boat_speed = WC_KIT + 'boat-speed-a.glb';
['boat-speed-b','boat-speed-c','boat-fishing-small','boat-tug-a','ship-cargo-b','ship-small'].forEach(w => {
  ASSET_MANIFEST['wc_' + w] = WC_KIT + w + '.glb';
});

// Trains
ASSET_MANIFEST.train = TK_KIT + 'train-locomotive-a.glb';
ASSET_MANIFEST.metro = TK_KIT + 'train-electric-subway-a.glb';
['train-diesel-a','train-electric-bullet-a','train-tram-modern','train-carriage-box'].forEach(t => {
  ASSET_MANIFEST['tk_' + t] = TK_KIT + t + '.glb';
});

// Trees & greenery
ASSET_MANIFEST.tree_small = SUB_KIT + 'tree-small.glb';
ASSET_MANIFEST.tree_large = SUB_KIT + 'tree-large.glb';
ASSET_MANIFEST.planter = SUB_KIT + 'planter.glb';

// ─── Logical groups ───

export const ASSET_GROUPS: Record<string, string[]> = {
  suburban:    'abcdefghijklmnopqrstu'.split('').map(l => 'suburban_' + l),
  industrial:  'abcdefghijklmnopqrst'.split('').map(l => 'industrial_' + l),
  cars:        ['car_hatchback-sports','car_suv','car_suv-luxury','car_race-future','car_sedan-sports',
                'car_kart-oobi','car_kart-oodi','car_kart-ooli','car_kart-oopi','car_kart-oozi',
                'car_tractor','car_tractor-police','car_tractor-shovel'],
  trucks:      ['truck_firetruck','truck_garbage-truck','truck_truck-flat'],
  modular:     ['mbuilding_sample-house-a','mbuilding_sample-house-b','mbuilding_sample-house-c',
                'mbuilding_sample-tower-a','mbuilding_sample-tower-b','mbuilding_sample-tower-c','mbuilding_sample-tower-d'],
  bkit:        ['bkit_wall','bkit_wall-doorway-square','bkit_column','bkit_column-wide',
                'bkit_barricade-doorway-a','bkit_barricade-doorway-b'],
  watercraft:  ['ship_cargo','boat_speed','wc_boat-speed-b','wc_boat-speed-c',
                'wc_boat-fishing-small','wc_boat-tug-a','wc_ship-cargo-b','wc_ship-small'],
  trains:      ['train','metro','tk_train-diesel-a','tk_train-electric-bullet-a','tk_train-tram-modern','tk_train-carriage-box'],
  emergency:   ['ambulance'],
  construction:['barrier','cone','sign_highway'],
};

// ─── Core assets (fast boot — 21 models) ───

export const CORE_ASSETS: string[] = [
  'car','taxi','police','bus','truck','auto','bike',
  'road_straight','road_intersect','road_cross','road_cross_path',
  'road_intersect_path','road_bend','road_crossing','road_roundabout',
  'char_f_a','char_f_b','char_f_c','char_m_a','char_m_b','char_m_c',
  'tree_small','tree_large',
];

/** Expand group names to individual asset keys, deduplicated */
export function expandAssets(assets: string[]): string[] {
  const out = new Set<string>();
  for (const a of assets) {
    if (ASSET_GROUPS[a]) {
      ASSET_GROUPS[a].forEach(k => out.add(k));
    } else {
      out.add(a);
    }
  }
  return [...out];
}
