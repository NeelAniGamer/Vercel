// @ts-nocheck
import * as THREE from 'three';

export interface PoolStats {
  created: number;
  reused: number;
  released: number;
  poolSize: number;
  activeCount: number;
  hitRate: string;
}

export class Pool<T> {
  private factory: () => T;
  private resetFn: ((obj: T) => void) | null;
  private maxSize: number;
  private pool: T[] = [];
  private active = new Set<T>();
  private stats = { created: 0, reused: 0, released: 0 };

  constructor(factory: () => T, resetFn: ((obj: T) => void) | null = null, maxSize = 500) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  get(): T {
    const obj = this.pool.length > 0 ? this.pool.pop()! : this.factory();
    this.active.add(obj);
    if (this.pool.length === 0) this.stats.created++;
    else this.stats.reused++;
    return obj;
  }

  release(obj: T): boolean {
    if (!this.active.has(obj)) return false;
    this.active.delete(obj);
    if (this.resetFn) this.resetFn(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
      this.stats.released++;
    }
    return true;
  }

  releaseAll(): void {
    this.active.forEach(obj => {
      if (this.resetFn) this.resetFn(obj);
      if (this.pool.length < this.maxSize) this.pool.push(obj);
    });
    this.active.clear();
  }

  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  getStats(): PoolStats {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      activeCount: this.active.size,
      hitRate: this.stats.created > 0
        ? (this.stats.reused / (this.stats.created + this.stats.reused) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

// Reset functions
const resetMesh = (mesh: THREE.Mesh): void => {
  mesh.visible = false;
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
  if (mesh.material) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.opacity !== undefined) mat.opacity = 1;
  }
  mesh.userData = {};
};

const resetGroup = (group: THREE.Group): void => {
  group.visible = false;
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  group.children.forEach(c => {
    c.visible = false;
    if ((c as THREE.Mesh).material) {
      const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.opacity !== undefined) mat.opacity = 1;
    }
  });
};

const resetVector3 = (v: THREE.Vector3): void => v.set(0, 0, 0);
const resetVector2 = (v: THREE.Vector2): void => v.set(0, 0);
const resetMatrix4 = (m: THREE.Matrix4): void => m.identity();
const resetEuler = (e: THREE.Euler): void => e.set(0, 0, 0);
const resetQuaternion = (q: THREE.Quaternion): void => q.set(0, 0, 0, 1);
const resetBox3 = (box: THREE.Box3): void => box.makeEmpty();
const resetSphere = (s: THREE.Sphere): void => s.set(0, 0, 0, 0);

const resetVehicle = (vehicle: THREE.Group): void => {
  vehicle.visible = false;
  vehicle.position.set(0, 0, 0);
  vehicle.rotation.set(0, 0, 0);
  vehicle.traverse(c => {
    if ((c as THREE.Mesh).isMesh) {
      c.visible = false;
      (c as THREE.Mesh).material = null;
    }
  });
};

const resetPedestrian = (ped: THREE.Group): void => {
  ped.visible = false;
  ped.position.set(0, 0, 0);
  ped.rotation.set(0, 0, 0);
};

const resetParticleSystem = (ps: THREE.Points): void => {
  ps.visible = false;
  if (ps.geometry && ps.geometry.attributes.position) {
    const pos = ps.geometry.attributes.position;
    pos.needsUpdate = true;
  }
};

const resetRaycaster = (r: THREE.Raycaster): void => {
  r.near = 0;
  r.far = Infinity;
  (r as any).linePrecision = 1;
};

const resetLight = (l: THREE.PointLight): void => { l.visible = false; l.intensity = 0; };
const resetSpotLight = (l: THREE.SpotLight): void => { l.visible = false; l.intensity = 0; };

export class ThreePools {
  static vec3: Pool<THREE.Vector3>;
  static vec2: Pool<THREE.Vector2>;
  static mat4: Pool<THREE.Matrix4>;
  static quat: Pool<THREE.Quaternion>;
  static euler: Pool<THREE.Euler>;
  static box3: Pool<THREE.Box3>;
  static sphere: Pool<THREE.Sphere>;
  static raycaster: Pool<THREE.Raycaster>;
  static mesh: Pool<THREE.Mesh>;
  static group: Pool<THREE.Group>;
  static vehicle: Pool<THREE.Group>;
  static pedestrian: Pool<THREE.Group>;
  static particleSystem: Pool<THREE.Points>;
  static brakeDust: Pool<THREE.Points>;
  static tireMark: Pool<THREE.Mesh>;
  static decal: Pool<THREE.Mesh>;
  static light: Pool<THREE.PointLight>;
  static spotLight: Pool<THREE.SpotLight>;

  static init(): void {
    this.vec3 = new Pool(() => new THREE.Vector3(), resetVector3, 200);
    this.vec2 = new Pool(() => new THREE.Vector2(), resetVector2, 100);
    this.mat4 = new Pool(() => new THREE.Matrix4(), resetMatrix4, 50);
    this.quat = new Pool(() => new THREE.Quaternion(), resetQuaternion, 50);
    this.euler = new Pool(() => new THREE.Euler(), resetEuler, 50);
    this.box3 = new Pool(() => new THREE.Box3(), resetBox3, 100);
    this.sphere = new Pool(() => new THREE.Sphere(), resetSphere, 50);
    this.raycaster = new Pool(() => new THREE.Raycaster(), resetRaycaster, 10);

    this.mesh = new Pool(() => new THREE.Mesh(), resetMesh, 300);
    this.group = new Pool(() => new THREE.Group(), resetGroup, 100);
    this.vehicle = new Pool(() => new THREE.Group(), resetVehicle, 80);
    this.pedestrian = new Pool(() => new THREE.Group(), resetPedestrian, 100);
    this.particleSystem = new Pool(() => new THREE.Points(), resetParticleSystem, 30);

    this.brakeDust = new Pool(() => new THREE.Points(), resetParticleSystem, 20);
    this.tireMark = new Pool(() => new THREE.Mesh(), resetMesh, 50);
    this.decal = new Pool(() => new THREE.Mesh(), resetMesh, 100);
    this.light = new Pool(() => new THREE.PointLight(0xffffee, 1, 50), resetLight, 30);
    this.spotLight = new Pool(() => new THREE.SpotLight(0xffffee, 1, 100, Math.PI / 4), resetSpotLight, 10);

    // Prewarm frequently used pools
    this.vec3.prewarm(100);
    this.box3.prewarm(50);
    this.mat4.prewarm(20);
    this.group.prewarm(30);
    this.mesh.prewarm(50);
    this.vehicle.prewarm(20);
    this.pedestrian.prewarm(30);
    this.raycaster.prewarm(5);

    console.log('[ThreePools] Initialized all pools');
  }

  static getStats(): Record<string, PoolStats> {
    const stats: Record<string, PoolStats> = {};
    Object.entries(this).forEach(([key, pool]) => {
      if (pool instanceof Pool) {
        stats[key] = pool.getStats();
      }
    });
    return stats;
  }

  static releaseAll(): void {
    Object.values(this).forEach(pool => {
      if (pool instanceof Pool) pool.releaseAll();
    });
  }

  // Convenience accessors
  static getVec3(): THREE.Vector3 { return this.vec3.get(); }
  static releaseVec3(v: THREE.Vector3): boolean { return this.vec3.release(v); }
  static getMat4(): THREE.Matrix4 { return this.mat4.get(); }
  static releaseMat4(m: THREE.Matrix4): boolean { return this.mat4.release(m); }
  static getBox3(): THREE.Box3 { return this.box3.get(); }
  static releaseBox3(b: THREE.Box3): boolean { return this.box3.release(b); }
  static getRaycaster(): THREE.Raycaster { return this.raycaster.get(); }
  static releaseRaycaster(r: THREE.Raycaster): boolean { return this.raycaster.release(r); }
  static getMesh(): THREE.Mesh { return this.mesh.get(); }
  static releaseMesh(m: THREE.Mesh): boolean { return this.mesh.release(m); }
  static getGroup(): THREE.Group { return this.group.get(); }
  static releaseGroup(g: THREE.Group): boolean { return this.group.release(g); }
  static getVehicle(): THREE.Group { return this.vehicle.get(); }
  static releaseVehicle(v: THREE.Group): boolean { return this.vehicle.release(v); }
  static getPedestrian(): THREE.Group { return this.pedestrian.get(); }
  static releasePedestrian(p: THREE.Group): boolean { return this.pedestrian.release(p); }
  static getParticleSystem(): THREE.Points { return this.particleSystem.get(); }
  static releaseParticleSystem(ps: THREE.Points): boolean { return this.particleSystem.release(ps); }
  static getBrakeDust(): THREE.Points { return this.brakeDust.get(); }
  static releaseBrakeDust(bd: THREE.Points): boolean { return this.brakeDust.release(bd); }
  static getLight(): THREE.PointLight { return this.light.get(); }
  static releaseLight(l: THREE.PointLight): boolean { return this.light.release(l); }
}

// Legacy global access (during migration)
if (typeof window !== 'undefined') {
  (window as any).ThreePools = ThreePools;
  (window as any).Pool = Pool;
}
