import * as THREE from 'three';

export class ObjectPool {
  private static v3Pool: THREE.Vector3[] = [];
  private static quatPool: THREE.Quaternion[] = [];
  private static mat4Pool: THREE.Matrix4[] = [];

  static getVector3(x = 0, y = 0, z = 0): THREE.Vector3 {
    const v = this.v3Pool.pop() || new THREE.Vector3();
    v.set(x, y, z);
    return v;
  }

  static releaseVector3(v: THREE.Vector3): void {
    if (this.v3Pool.length < 500) {
      this.v3Pool.push(v);
    }
  }

  static getQuaternion(): THREE.Quaternion {
    const q = this.quatPool.pop() || new THREE.Quaternion();
    q.identity();
    return q;
  }

  static releaseQuaternion(q: THREE.Quaternion): void {
    if (this.quatPool.length < 200) {
      this.quatPool.push(q);
    }
  }

  static getMatrix4(): THREE.Matrix4 {
    const m = this.mat4Pool.pop() || new THREE.Matrix4();
    m.identity();
    return m;
  }

  static releaseMatrix4(m: THREE.Matrix4): void {
    if (this.mat4Pool.length < 100) {
      this.mat4Pool.push(m);
    }
  }
}
