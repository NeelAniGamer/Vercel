/**
 * VehicleFactory — Builds vehicles and humans from preloaded GLB models.
 * Ported from Traffic/ui.js lines 2586–2925 (_buildVehicle, _buildHuman).
 */
import * as THREE from 'three';
import { loadAsset, isAssetCached } from '../engine/AssetLoader';

const VEHICLE_KEYS: Record<string, string> = {
  sedan: 'car', taxi: 'taxi', police: 'police',
  truck: 'truck', suv: 'car_suv', van: 'auto',
  bus: 'bus', bike: 'bike', ambulance: 'ambulance',
};

export interface VehicleStats {
  maxSpeed: number; accel: number; brakeForce: number;
  turnSpeed: number; friction: number; mass: number;
}

const STATS: Record<string, VehicleStats> = {
  car:    { maxSpeed: 60, accel: 18, brakeForce: 30, turnSpeed: 1.8, friction: 0.98, mass: 1200 },
  suv:    { maxSpeed: 55, accel: 16, brakeForce: 28, turnSpeed: 1.6, friction: 0.97, mass: 1800 },
  van:    { maxSpeed: 50, accel: 14, brakeForce: 25, turnSpeed: 1.4, friction: 0.97, mass: 2200 },
  bus:    { maxSpeed: 45, accel: 10, brakeForce: 22, turnSpeed: 1.0, friction: 0.96, mass: 5000 },
  truck:  { maxSpeed: 48, accel: 12, brakeForce: 24, turnSpeed: 1.2, friction: 0.96, mass: 4000 },
  bike:   { maxSpeed: 70, accel: 22, brakeForce: 35, turnSpeed: 2.5, friction: 0.99, mass: 200 },
  auto:   { maxSpeed: 40, accel: 12, brakeForce: 20, turnSpeed: 2.2, friction: 0.98, mass: 400 },
  taxi:   { maxSpeed: 60, accel: 18, brakeForce: 30, turnSpeed: 1.8, friction: 0.98, mass: 1200 },
  police: { maxSpeed: 75, accel: 24, brakeForce: 38, turnSpeed: 2.2, friction: 0.98, mass: 1400 },
  ambulance: { maxSpeed: 65, accel: 20, brakeForce: 32, turnSpeed: 1.8, friction: 0.98, mass: 1600 },
};

const HUMAN_HEAD_HEIGHT = 1.6;
const HUMAN_BODY_HEIGHT = 0.5;
const PLAYER_COLOR = 0x00ff00;
const NPC_COLOR = 0x0088ff;

/** Get stats for a vehicle type. */
export function getVehicleStats(type: string): VehicleStats {
  return STATS[type] || STATS.car;
}

/**
 * Build a vehicle from GLB. Adds headlights + taillights.
 * Returns { group, brakeLightLeft, brakeLightRight } for brake glow.
 */
export async function buildVehicle(
  type: string, color?: number
): Promise<{
  group: THREE.Group;
  brakeLightLeft: THREE.PointLight;
  brakeLightRight: THREE.PointLight;
  headlightLeft: THREE.SpotLight;
  headlightRight: THREE.SpotLight;
  stats: VehicleStats;
}> {
  const key = VEHICLE_KEYS[type] || 'car';
  const model = await loadAsset(key);

  const group = new THREE.Group();
  group.add(model);

  const bodyColor = color ?? (type === 'taxi' ? 0xf0c040 :
    type === 'police' ? 0x1a1aff :
    type === 'ambulance' ? 0xffffff : 0x4488cc);
  applyColor(model, bodyColor);

  // Headlights
  const hlL = new THREE.SpotLight(0xffeeff, 40, 30, 0.35, 0.5, 1);
  hlL.position.set(-1.2, 1.2, 5);
  hlL.target.position.set(-1.2, 0, 30);
  group.add(hlL, hlL.target);
  const hlR = hlL.clone();
  hlR.position.set(1.2, 1.2, 5);
  hlR.target.position.set(1.2, 0, 30);
  group.add(hlR, hlR.target);

  // Brake lights
  const blGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3);
  const blMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
  const blL = new THREE.Mesh(blGeo, blMat);
  blL.position.set(-1.8, 1, -4.5);
  group.add(blL);
  const blR = new THREE.Mesh(blGeo, blMat);
  blR.position.set(1.8, 1, -4.5);
  group.add(blR);

  const brakeLightL = new THREE.PointLight(0xff0000, 0, 8);
  brakeLightL.position.copy(blL.position);
  group.add(brakeLightL);
  const brakeLightR = new THREE.PointLight(0xff0000, 0, 8);
  brakeLightR.position.copy(blR.position);
  group.add(brakeLightR);

  const stats = getVehicleStats(type);

  return { group, brakeLightLeft: brakeLightL, brakeLightRight: brakeLightR,
           headlightLeft: hlL, headlightRight: hlR, stats };
}

/**
 * Build a human character from GLB.
 * Returns { group, colorEmissive, type } for trail/identification.
 */
export async function buildHuman(
  isPlayer: boolean
): Promise<{ group: THREE.Group; colorEmissive: THREE.Color; type: string }> {
  const keys = ['char_f_a','char_f_b','char_f_c','char_m_a','char_m_b','char_m_c'];
  const key = keys[Math.floor(Math.random() * keys.length)];
  const model = await loadAsset(key);

  const group = new THREE.Group();
  group.add(model);

  // Scale character to ~1.5
  model.scale.set(1.5, 1.5, 1.5);

  const accent = isPlayer ? PLAYER_COLOR : NPC_COLOR;
  setChildMaterials(model, (mat: THREE.Material) => {
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.emissive = new THREE.Color(accent);
      mat.emissiveIntensity = 0.6;
    }
  });

  return { group, colorEmissive: new THREE.Color(accent), type: 'human' };
}

/** Apply tint to model's MeshStandardMaterial children. */
function applyColor(obj: THREE.Object3D, color: number) {
  obj.traverse(c => {
    if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
      c.material.color.set(color);
    }
  });
}

/** Recursively apply a function to all MeshStandardMaterial in subtree. */
function setChildMaterials(obj: THREE.Object3D, fn: (m: THREE.Material) => void) {
  obj.traverse(c => {
    if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
      fn(c.material);
    }
  });
}
