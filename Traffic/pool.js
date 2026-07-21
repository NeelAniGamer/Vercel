/**
 * Comprehensive Object Pools for Three.js / Traffic Game
 * Zero-GC gameplay loop - all objects borrowed from pools
 */

class Pool {
  constructor(factory, resetFn = null, maxSize = 500) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.pool = [];
    this.active = new Set();
    this.stats = { created: 0, reused: 0, released: 0 };
  }

  get() {
    const obj = this.pool.length > 0 ? this.pool.pop() : this.factory();
    this.active.add(obj);
    if (this.pool.length === 0) this.stats.created++;
    else this.stats.reused++;
    return obj;
  }

  release(obj) {
    if (!this.active.has(obj)) return false;
    this.active.delete(obj);
    if (this.resetFn) this.resetFn(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
      this.stats.released++;
    }
    return true;
  }

  releaseAll() {
    this.active.forEach(obj => {
      if (this.resetFn) this.resetFn(obj);
      if (this.pool.length < this.maxSize) this.pool.push(obj);
    });
    this.active.clear();
  }

  prewarm(count) {
    for (let i = 0; i < count; i++) this.pool.push(this.factory());
  }

  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      activeCount: this.active.size,
      hitRate: this.stats.created > 0 ? (this.stats.reused / (this.stats.created + this.stats.reused) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// Reset functions
const resetMesh = (m) => { m.visible = false; m.position.set(0,0,0); m.rotation.set(0,0,0); m.scale.set(1,1,1); if (m.material) m.material.opacity = 1; if (m.userData) m.userData = {}; };
const resetGroup = (g) => { g.visible = false; g.position.set(0,0,0); g.rotation.set(0,0,0); g.scale.set(1,1,1); g.children.forEach(c => { c.visible = false; if (c.material) c.material.opacity = 1; }); };
const resetVehicle = (v) => { v.visible = false; v.position.set(0,0,0); v.rotation.set(0,0,0); v.traverse(c => { if (c.isMesh) { c.visible = false; c.material = null; } }); };
const resetPed = (p) => { p.visible = false; p.position.set(0,0,0); p.rotation.set(0,0,0); };
const resetParticles = (ps) => { ps.visible = false; if (ps.geometry?.attributes?.position) ps.geometry.attributes.position.needsUpdate = true; };
const resetBox3 = (b) => b.makeEmpty();
const resetVec3 = (v) => v.set(0,0,0);
const resetVec2 = (v) => v.set(0,0);
const resetMat4 = (m) => m.identity();
const resetQuat = (q) => q.set(0,0,0,1);
const resetEuler = (e) => e.set(0,0,0);
const resetRaycaster = (r) => { r.near = 0; r.far = Infinity; r.linePrecision = 1; };

class ThreePools {
  static init() {
    // Math objects
    this.vec3 = new Pool(() => new THREE.Vector3(), resetVec3, 300);
    this.vec2 = new Pool(() => new THREE.Vector2(), resetVec2, 150);
    this.mat4 = new Pool(() => new THREE.Matrix4(), resetMat4, 80);
    this.quat = new Pool(() => new THREE.Quaternion(), resetQuat, 80);
    this.euler = new Pool(() => new THREE.Euler(), resetEuler, 80);
    this.box3 = new Pool(() => new THREE.Box3(), resetBox3, 100);
    this.raycaster = new Pool(() => new THREE.Raycaster(), resetRaycaster, 10);
    
    // Scene objects
    this.mesh = new Pool(() => new THREE.Mesh(), resetMesh, 200);
    this.group = new Pool(() => new THREE.Group(), resetGroup, 100);
    this.vehicle = new Pool(() => new THREE.Group(), resetVehicle, 50);
    this.pedestrian = new Pool(() => new THREE.Group(), resetPed, 80);
    this.particles = new Pool(() => new THREE.Points(), resetParticles, 30);
    this.instancedMesh = new Pool(() => new THREE.InstancedMesh(), m => { m.visible = false; m.count = 0; }, 20);
    
    // Pre-warm common pools
    this.vec3.prewarm(50);
    this.vec2.prewarm(30);
    this.mat4.prewarm(20);
    this.box3.prewarm(30);
  }

  static releaseAll() {
    Object.values(this).forEach(p => p && p.releaseAll && p.releaseAll());
  }

  static getStats() {
    const stats = {};
    Object.entries(this).forEach(([k, v]) => { if (v && v.getStats) stats[k] = v.getStats(); });
    return stats;
  }
}

// Export
window.Pool = Pool;
window.ThreePools = ThreePools;
window.resetMesh = resetMesh;
window.resetGroup = resetGroup;
window.resetVehicle = resetVehicle;
window.resetPed = resetPed;
window.resetParticles = resetParticles;
window.resetBox3 = resetBox3;
window.resetVec3 = resetVec3;
window.resetVec2 = resetVec2;
window.resetMat4 = resetMat4;
window.resetQuat = resetQuat;
window.resetEuler = resetEuler;
window.resetRaycaster = resetRaycaster;