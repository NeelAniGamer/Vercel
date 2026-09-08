

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
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
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


const resetMesh = (mesh) => {
  mesh.visible = false;
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
  if (mesh.material) mesh.material.opacity = 1;
  if (mesh.userData) mesh.userData = {};
};

const resetGroup = (group) => {
  group.visible = false;
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  group.children.forEach(c => {
    c.visible = false;
    if (c.material) c.material.opacity = 1;
  });
};

const resetVehicle = (vehicle) => {
  vehicle.visible = false;
  vehicle.position.set(0, 0, 0);
  vehicle.rotation.set(0, 0, 0);
  vehicle.traverse(c => {
    if (c.isMesh) {
      c.visible = false;
      c.material = null;
    }
  });
};

const resetPedestrian = (ped) => {
  ped.visible = false;
  ped.position.set(0, 0, 0);
  ped.rotation.set(0, 0, 0);
};

const resetParticleSystem = (ps) => {
  ps.visible = false;
  if (ps.geometry && ps.geometry.attributes.position) {
    const pos = ps.geometry.attributes.position;
    pos.needsUpdate = true;
  }
};

const resetBox3 = (box) => {
  box.makeEmpty();
};

const resetVector3 = (v) => {
  v.set(0, 0, 0);
};

const resetMatrix4 = (m) => {
  m.identity();
};

const resetRaycaster = (r) => {
  r.near = 0;
  r.far = Infinity;
  r.linePrecision = 1;
};

class ThreePools {
  static init(game) {

    this.vec3 = new Pool(() => new THREE.Vector3(), resetVector3, 200);
    this.vec2 = new Pool(() => new THREE.Vector2(), v => v.set(0, 0), 100);
    this.mat4 = new Pool(() => new THREE.Matrix4(), resetMatrix4, 50);
    this.quat = new Pool(() => new THREE.Quaternion(), q => q.set(0, 0, 0, 1), 50);
    this.euler = new Pool(() => new THREE.Euler(), e => e.set(0, 0, 0), 50);
    this.box3 = new Pool(() => new THREE.Box3(), resetBox3, 100);
    this.sphere = new Pool(() => new THREE.Sphere(), s => s.set(0, 0, 0, 0), 50);
    this.raycaster = new Pool(() => new THREE.Raycaster(), resetRaycaster, 10);


    this.mesh = new Pool(() => new THREE.Mesh(), resetMesh, 300);
    this.group = new Pool(() => new THREE.Group(), resetGroup, 100);
    this.vehicle = new Pool(() => new THREE.Group(), resetVehicle, 80);
    this.pedestrian = new Pool(() => new THREE.Group(), resetPedestrian, 100);
    this.particleSystem = new Pool(() => new THREE.Points(), resetParticleSystem, 30);


    this.brakeDust = new Pool(() => new THREE.Points(), resetParticleSystem, 20);
    this.tireMark = new Pool(() => new THREE.Mesh(), resetMesh, 50);
    this.decal = new Pool(() => new THREE.Mesh(), resetMesh, 100);
    this.light = new Pool(() => new THREE.PointLight(0xffffee, 1, 50), l => { l.visible = false; l.intensity = 0; }, 30);
    this.spotLight = new Pool(() => new THREE.SpotLight(0xffffee, 1, 100, Math.PI / 4), l => { l.visible = false; l.intensity = 0; }, 10);


    this.audioSource = new Pool(() => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createBufferSource();
      return src;
    }, src => { src.disconnect(); }, 20);


    this.vec3.prewarm(100);
    this.box3.prewarm(50);
    this.mat4.prewarm(20);
    this.group.prewarm(30);
    this.mesh.prewarm(50);
    this.vehicle.prewarm(20);
    this.pedestrian.prewarm(30);
    this.raycaster.prewarm(5);

    console.log('ThreePools: Initialized all pools');
  }

  static getStats() {
    const stats = {};
    Object.entries(this).forEach(([key, pool]) => {
      if (pool instanceof Pool) stats[key] = pool.getStats();
    });
    return stats;
  }

  static releaseAll() {
    Object.values(this).forEach(pool => {
      if (pool instanceof Pool) pool.releaseAll();
    });
  }


  static getVec3() { return this.vec3.get(); }
  static releaseVec3(v) { return this.vec3.release(v); }
  static getMat4() { return this.mat4.get(); }
  static releaseMat4(m) { return this.mat4.release(m); }
  static getBox3() { return this.box3.get(); }
  static releaseBox3(b) { return this.box3.release(b); }
  static getRaycaster() { return this.raycaster.get(); }
  static releaseRaycaster(r) { return this.raycaster.release(r); }
  static getMesh() { return this.mesh.get(); }
  static releaseMesh(m) { return this.mesh.release(m); }
  static getGroup() { return this.group.get(); }
  static releaseGroup(g) { return this.group.release(g); }
  static getVehicle() { return this.vehicle.get(); }
  static releaseVehicle(v) { return this.vehicle.release(v); }
  static getPedestrian() { return this.pedestrian.get(); }
  static releasePedestrian(p) { return this.pedestrian.release(p); }
  static getParticleSystem() { return this.particleSystem.get(); }
  static releaseParticleSystem(ps) { return this.particleSystem.release(ps); }
  static getBrakeDust() { return this.brakeDust.get(); }
  static releaseBrakeDust(bd) { return this.brakeDust.release(bd); }
  static getLight() { return this.light.get(); }
  static releaseLight(l) { return this.light.release(l); }
}

window.ThreePools = ThreePools;
window.Pool = Pool;