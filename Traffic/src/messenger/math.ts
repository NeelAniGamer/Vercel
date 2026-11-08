import * as THREE from 'three';

export const PLANET_RADIUS = 80;
export const SEA_LEVEL = 80;

/**
 * Convert Latitude and Longitude (in degrees) to 3D Cartesian coordinates on the sphere.
 */
export function latLonToVector3(latDeg: number, lonDeg: number, radius = PLANET_RADIUS): THREE.Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lonDeg + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert 3D position on or near the sphere to Latitude and Longitude (degrees).
 */
export function vector3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const normalized = v.clone().normalize();
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, normalized.y))) * (180 / Math.PI);
  let lon = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

/**
 * Slerp (Spherical Linear Interpolation) between two unit vectors.
 */
export function slerpVectors(v1: THREE.Vector3, v2: THREE.Vector3, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const u1 = v1.clone().normalize();
  const u2 = v2.clone().normalize();

  let dot = u1.dot(u2);
  dot = Math.max(-1, Math.min(1, dot));

  if (dot > 0.99995) {
    out.copy(u1).lerp(u2, t).normalize();
    return out;
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);

  const a = Math.sin((1 - t) * theta) / sinTheta;
  const b = Math.sin(t * theta) / sinTheta;

  out.copy(u1).multiplyScalar(a).addScaledVector(u2, b).normalize();
  return out;
}

/**
 * Great Circle Distance in meters/units along the sphere.
 */
export function greatCircleDistance(v1: THREE.Vector3, v2: THREE.Vector3, radius = PLANET_RADIUS): number {
  const u1 = v1.clone().normalize();
  const u2 = v2.clone().normalize();
  const dot = Math.max(-1, Math.min(1, u1.dot(u2)));
  return Math.acos(dot) * radius;
}

/**
 * Orient an Object3D tangent to the sphere surface at position.
 */
export function orientToSphere(object: THREE.Object3D, position: THREE.Vector3, forwardDir?: THREE.Vector3) {
  const normal = position.clone().normalize();
  object.position.copy(position);

  if (forwardDir && forwardDir.lengthSq() > 0.0001) {
    const forward = forwardDir.clone().sub(normal.clone().multiplyScalar(forwardDir.dot(normal))).normalize();
    const right = new THREE.Vector3().crossVectors(normal, forward).normalize();
    const rotMatrix = new THREE.Matrix4().makeBasis(right, normal, forward.negate());
    object.quaternion.setFromRotationMatrix(rotMatrix);
  } else {
    const defaultUp = new THREE.Vector3(0, 1, 0);
    object.quaternion.setFromUnitVectors(defaultUp, normal);
  }
}

/**
 * 3D Simplex-style Noise for Procedural Terrain on a Sphere
 */
class SimplexNoise3D {
  private p: Uint8Array = new Uint8Array(512);

  constructor(seed = 1947) {
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;

    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      this.p[i] = perm[i & 255];
    }
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number, z: number): number {
    const F3 = 1.0 / 3.0;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;

    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    let i1, j1, k1;
    let i2, j2, k2;

    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;

    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;

    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      t0 *= t0;
      const gi0 = this.p[ii + this.p[jj + this.p[kk]]];
      n0 = t0 * t0 * this.grad(gi0, x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      t1 *= t1;
      const gi1 = this.p[ii + i1 + this.p[jj + j1 + this.p[kk + k1]]];
      n1 = t1 * t1 * this.grad(gi1, x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      t2 *= t2;
      const gi2 = this.p[ii + i2 + this.p[jj + j2 + this.p[kk + k2]]];
      n2 = t2 * t2 * this.grad(gi2, x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      t3 *= t3;
      const gi3 = this.p[ii + 1 + this.p[jj + 1 + this.p[kk + 1]]];
      n3 = t3 * t3 * this.grad(gi3, x3, y3, z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

export const terrainNoise = new SimplexNoise3D(2026);
export const detailNoise = new SimplexNoise3D(777);

/**
 * Analytical Terrain Height for Mini Mumbai Spherical Planet.
 * Features:
 * - South Mumbai Peninsula (Gateway of India, Colaba, Marine Drive promenade)
 * - Malabar Hill ridge & hanging gardens
 * - Bandra & Worli coastlines with Arabian Sea bay
 * - Chowpatty sandy beach
 * - Flat central traffic avenues
 */
export function getTerrainHeight(normal: THREE.Vector3): number {
  const nx = normal.x;
  const ny = normal.y;
  const nz = normal.z;

  // Base urban landform & hills
  const continent = terrainNoise.noise(nx * 1.6, ny * 1.6, nz * 1.6);
  const hills = terrainNoise.noise(nx * 3.8, ny * 3.8, nz * 3.8) * 0.35;
  const details = detailNoise.noise(nx * 8.0, ny * 8.0, nz * 8.0) * 0.12;

  let elevation = (continent + hills + details) * 4.2;

  // 1. Gateway of India Pier & Colaba (Smooth sea-level stone plaza)
  const distToGateway = normal.distanceTo(latLonToVector3(0, 0, 1));
  if (distToGateway < 0.35) {
    const blend = 1.0 - distToGateway / 0.35;
    elevation = THREE.MathUtils.lerp(elevation, 1.2, blend * 0.9);
  }

  // 2. CSMT Railway Station & Dabbawala Depot Plaza
  const distToCSMT = normal.distanceTo(latLonToVector3(18, 25, 1));
  if (distToCSMT < 0.35) {
    const blend = 1.0 - distToCSMT / 0.35;
    elevation = THREE.MathUtils.lerp(elevation, 1.4, blend * 0.85);
  }

  // 3. Malabar Hill / Stargazer High Altitude Ridge
  const distToHill = normal.distanceTo(latLonToVector3(38, -35, 1));
  if (distToHill < 0.4) {
    const blend = Math.max(0, 1.0 - distToHill / 0.4);
    elevation += Math.sin(blend * Math.PI * 0.5) * 6.5;
  }

  // 4. Girgaon Chowpatty Sandy Beach (Gentle coastal incline into Arabian Sea)
  const distToChowpatty = normal.distanceTo(latLonToVector3(12, -28, 1));
  if (distToChowpatty < 0.32) {
    const blend = Math.max(0, 1.0 - distToChowpatty / 0.32);
    elevation = THREE.MathUtils.lerp(elevation, -0.25, blend * 0.92);
  }

  // 5. Marine Drive Promenade (Curved scenic sea wall elevation)
  const distToMarine = normal.distanceTo(latLonToVector3(8, -12, 1));
  if (distToMarine < 0.3) {
    const blend = Math.max(0, 1.0 - distToMarine / 0.3);
    elevation = THREE.MathUtils.lerp(elevation, 1.0, blend * 0.85);
  }

  // 6. Bandra-Worli Sea Bay (Sea channel spanned by Sea Link bridge)
  const distToBay = normal.distanceTo(latLonToVector3(42, 15, 1));
  if (distToBay < 0.28) {
    const blend = Math.max(0, 1.0 - distToBay / 0.28);
    elevation = THREE.MathUtils.lerp(elevation, -1.8, blend * 0.88);
  }

  return Math.max(-2.5, elevation);
}

/**
 * Returns surface point at a given normal.
 */
export function getPlanetSurfacePoint(normal: THREE.Vector3): THREE.Vector3 {
  const norm = normal.clone().normalize();
  const height = getTerrainHeight(norm);
  return norm.multiplyScalar(PLANET_RADIUS + height);
}
