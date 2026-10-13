import { EPSILON } from './Scalar';
import { Vec3 } from './Vec3';

/**
 * Unit quaternion (x, y, z, w), always stored normalized after any mutation
 * that can perturb length.
 *
 * Rotations are represented by quaternions rather than Euler triples because
 * Euler angles gimbal-lock at pitch = +/-90 degrees and interpolate badly.
 * For vehicle work the body frame is still accessed via a Mat3 (see Mat3.ts),
 * since the solver needs world-space inertia, not a rotation type.
 */
export class Quat {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1,
  ) {}

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copy(q: Quat): this {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  clone(): Quat {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  identity(): this {
    return this.set(0, 0, 0, 1);
  }

  setFromAxisAngle(axis: Vec3, angle: number): this {
    const half = angle * 0.5;
    const s = Math.sin(half);
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(half);
    return this;
  }

  /**
   * Compose from intrinsic Y (yaw) -> X (pitch) -> Z (roll), applied in that
   * order. This is the conventional vehicle orientation: heading, then pitch,
   * then body roll.
   *
   * The order is named explicitly because an unnamed `setFromEuler` is a
   * reliable source of "works in isolation, wrong when integrated" bugs.
   */
  setFromEulerYXZ(pitch: number, yaw: number, roll: number): this {
    const c1 = Math.cos(pitch * 0.5);
    const c2 = Math.cos(yaw * 0.5);
    const c3 = Math.cos(roll * 0.5);
    const s1 = Math.sin(pitch * 0.5);
    const s2 = Math.sin(yaw * 0.5);
    const s3 = Math.sin(roll * 0.5);

    // Y * X * Z
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
    return this;
  }

  /**
   * Shortest-arc rotation taking unit vector `from` to unit vector `to`.
   * Returns identity when the vectors are parallel or antiparallel.
   */
  setFromUnitVectors(from: Vec3, to: Vec3): this {
    const dot = from.dot(to);
    if (dot >= 1 - EPSILON) return this.identity();
    if (dot <= -1 + EPSILON) {
      // Antiparallel: any perpendicular axis gives a valid 180-degree turn.
      const axis = Vec3.anyPerpendicular(from, new Vec3());
      return this.setFromAxisAngle(axis, Math.PI);
    }
    const c = Vec3.cross(from, to, new Vec3());
    this.x = c.x;
    this.y = c.y;
    this.z = c.z;
    this.w = 1 + dot;
    return this.normalize();
  }

  /** this = a * b (apply b first, then a). */
  multiplyQuats(a: Quat, b: Quat): this {
    const ax = a.x, ay = a.y, az = a.z, aw = a.w;
    const bx = b.x, by = b.y, bz = b.z, bw = b.w;
    this.x = aw * bx + ax * bw + ay * bz - az * by;
    this.y = aw * by - ax * bz + ay * bw + az * bx;
    this.z = aw * bz + ax * by - ay * bx + az * bw;
    this.w = aw * bw - ax * bx - ay * by - az * bz;
    return this;
  }

  multiply(q: Quat): this {
    return this.multiplyQuats(this, q);
  }

  premultiply(q: Quat): this {
    return this.multiplyQuats(q, this);
  }

  conjugate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  /** Inverse of a unit quaternion is its conjugate; renormalizes defensively. */
  invert(): this {
    const lenSq = this.lengthSq();
    if (lenSq <= EPSILON) return this.identity();
    const inv = 1 / lenSq;
    this.x = -this.x * inv;
    this.y = -this.y * inv;
    this.z = -this.z * inv;
    this.w = this.w * inv;
    return this;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  normalize(): this {
    const lenSq = this.lengthSq();
    if (lenSq <= EPSILON) return this.identity();
    const inv = 1 / Math.sqrt(lenSq);
    this.x *= inv;
    this.y *= inv;
    this.z *= inv;
    this.w *= inv;
    return this;
  }

  dot(q: Quat): number {
    return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
  }

  /** Rotate a vector by this quaternion (v' = q v q*), writing to `target`. */
  rotateVector(v: Vec3, target = new Vec3()): Vec3 {
    const { x, y, z, w } = this;
    const vx = v.x, vy = v.y, vz = v.z;

    // t = 2 * (q.xyz x v)
    const tx = 2 * (y * vz - z * vy);
    const ty = 2 * (z * vx - x * vz);
    const tz = 2 * (x * vy - y * vx);

    // v' = v + w * t + q.xyz x t
    target.x = vx + w * tx + (y * tz - z * ty);
    target.y = vy + w * ty + (z * tx - x * tz);
    target.z = vz + w * tz + (x * ty - y * tx);
    return target;
  }

  /** Inverse rotation — the only correct way to move a world vector to local. */
  inverseRotateVector(v: Vec3, target = new Vec3()): Vec3 {
    _tmpQuat.copy(this).conjugate();
    return _tmpQuat.rotateVector(v, target);
  }

  /**
   * Advance the orientation by an angular velocity over `dt` using the exact
   * exponential map: q(t+dt) = exp(0.5 * omega * dt) * q(t).
   *
   * The obvious linearized form (q += 0.5 * omega * q * dt, then normalize) is
   * only first-order accurate and accumulates a visible heading error over a
   * few hundred steps — enough to matter for anything driven by yaw rate. The
   * exponential map is exact for constant omega, so a steady turn integrates
   * without drift regardless of step count.
   */
  integrate(angularVelocity: Vec3, dt: number): this {
    const omegaSq = angularVelocity.lengthSq();
    if (omegaSq <= EPSILON) return this;

    const halfAngle = 0.5 * Math.sqrt(omegaSq) * dt;
    const s = Math.sin(halfAngle) / Math.sqrt(omegaSq);

    _deltaQuat.set(
      angularVelocity.x * s,
      angularVelocity.y * s,
      angularVelocity.z * s,
      Math.cos(halfAngle),
    );

    // World-space angular velocity composes on the left.
    this.premultiply(_deltaQuat);
    return this.normalize();
  }

  slerp(q: Quat, t: number): this {
    let cosHalf = this.dot(q);
    let bx = q.x, by = q.y, bz = q.z, bw = q.w;

    // Take the shorter arc.
    if (cosHalf < 0) {
      cosHalf = -cosHalf;
      bx = -bx; by = -by; bz = -bz; bw = -bw;
    }

    if (cosHalf > 1 - 1e-6) {
      // Nearly parallel: linear interpolation is numerically safer.
      this.x += (bx - this.x) * t;
      this.y += (by - this.y) * t;
      this.z += (bz - this.z) * t;
      this.w += (bw - this.w) * t;
      return this.normalize();
    }

    const halfAngle = Math.acos(cosHalf);
    const sinHalf = Math.sin(halfAngle);
    const ratioA = Math.sin((1 - t) * halfAngle) / sinHalf;
    const ratioB = Math.sin(t * halfAngle) / sinHalf;

    this.x = this.x * ratioA + bx * ratioB;
    this.y = this.y * ratioA + by * ratioB;
    this.z = this.z * ratioA + bz * ratioB;
    this.w = this.w * ratioA + bw * ratioB;
    return this.normalize();
  }

  isFinite(): boolean {
    return (
      Number.isFinite(this.x) &&
      Number.isFinite(this.y) &&
      Number.isFinite(this.z) &&
      Number.isFinite(this.w)
    );
  }

  equals(q: Quat, eps = 1e-6): boolean {
    // q and -q represent the same rotation.
    const d = Math.abs(this.dot(q));
    return d >= 1 - eps;
  }
}

/** Scratch quaternions for internal use; not reentrant across calls. */
const _tmpQuat = new Quat();
const _deltaQuat = new Quat();