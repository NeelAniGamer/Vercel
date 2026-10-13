import { EPSILON, EPSILON_SQ, clamp, safeInvSqrt } from './Scalar';

/**
 * Mutable 3-vector. Mutating methods take an explicit `target` and return it so
 * calls can be chained without allocating: `Vec3.addScaled(a, b, -2, out)`.
 *
 * The engine runs 60+ times a second over hundreds of bodies; allocating a
 * Vector3 per force or per contact per step is a measurable GC cost, so the hot
 * path reuses scratch vectors supplied by the caller.
 */
export class Vec3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  setZero(): this {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
  }

  copy(v: Vec3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  /** Copy from a `{x, y, z}`-shaped object, e.g. a Three.js Vector3. */
  setFrom(obj: { x: number; y: number; z: number }): this {
    this.x = obj.x;
    this.y = obj.y;
    this.z = obj.z;
    return this;
  }

  add(v: Vec3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addVectors(a: Vec3, b: Vec3): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  addScaled(v: Vec3, s: number): this {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }

  sub(v: Vec3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  subVectors(a: Vec3, b: Vec3): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * Set this vector to the cross product a x b.
   *
   * Written with explicit component arithmetic rather than an intermediate
   * temporary so the hot path stays allocation-free.
   */
  crossVectors(a: Vec3, b: Vec3): this {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }

  cross(v: Vec3): this {
    return this.crossVectors(this, v);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  distanceToSq(v: Vec3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  distanceTo(v: Vec3): number {
    return Math.sqrt(this.distanceToSq(v));
  }

  /** Rescale to unit length. A vector shorter than EPSILON becomes zero. */
  normalize(): this {
    const lenSq = this.lengthSq();
    if (lenSq <= EPSILON_SQ) return this.setZero();
    return this.scale(safeInvSqrt(lenSq));
  }

  setLength(len: number): this {
    this.normalize();
    return this.scale(len);
  }

  /**
   * Clamp the vector's magnitude to `max`, preserving direction.
   * Returns the resulting length so callers can detect that clamping occurred.
   */
  clampLength(max: number): number {
    const lenSq = this.lengthSq();
    if (lenSq <= max * max) return Math.sqrt(lenSq);
    this.normalize();
    this.scale(max);
    return max;
  }

  lerp(v: Vec3, t: number): this {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    this.z += (v.z - this.z) * t;
    return this;
  }

  /** this = a + (b - a) * t, without relying on `this` being either input. */
  lerpVectors(a: Vec3, b: Vec3, t: number): this {
    this.x = a.x + (b.x - a.x) * t;
    this.y = a.y + (b.y - a.y) * t;
    this.z = a.z + (b.z - a.z) * t;
    return this;
  }

  /** Component-wise absolute values. */
  abs(): this {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    this.z = Math.abs(this.z);
    return this;
  }

  /** Component-wise clamp. */
  clamp(min: number, max: number): this {
    this.x = clamp(this.x, min, max);
    this.y = clamp(this.y, min, max);
    this.z = clamp(this.z, min, max);
    return this;
  }

  equals(v: Vec3, eps = EPSILON): boolean {
    return (
      Math.abs(this.x - v.x) <= eps &&
      Math.abs(this.y - v.y) <= eps &&
      Math.abs(this.z - v.z) <= eps
    );
  }

  isFinite(): boolean {
    return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z);
  }

  /**
   * Guard against NaN/Infinity leaking into the solver.
   * Returns true when the vector is healthy.
   */
  assertFinite(where = 'Vec3'): boolean {
    if (this.isFinite()) return true;
    throw new Error(
      `${where}: non-finite vector (${this.x}, ${this.y}, ${this.z})`,
    );
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  // ── Static constructors ──────────────────────────────────────────────────

  static from(v: Vec3, target = new Vec3()): Vec3 {
    return target.copy(v);
  }

  static splat(s: number, target = new Vec3()): Vec3 {
    return target.set(s, s, s);
  }

  static add(a: Vec3, b: Vec3, target = new Vec3()): Vec3 {
    return target.addVectors(a, b);
  }

  static sub(a: Vec3, b: Vec3, target = new Vec3()): Vec3 {
    return target.subVectors(a, b);
  }

  static scale(v: Vec3, s: number, target = new Vec3()): Vec3 {
    return target.copy(v).scale(s);
  }

  static dot(a: Vec3, b: Vec3): number {
    return a.dot(b);
  }

  static cross(a: Vec3, b: Vec3, target = new Vec3()): Vec3 {
    return target.crossVectors(a, b);
  }

  /** Vector from `a` to `b` (i.e. b - a), i.e. the direction a body must travel. */
  static direction(a: Vec3, b: Vec3, target = new Vec3()): Vec3 {
    return target.subVectors(b, a);
  }

  /** Any unit vector perpendicular to `v`. */
  static anyPerpendicular(v: Vec3, target = new Vec3()): Vec3 {
    if (Math.abs(v.x) >= Math.abs(v.z)) {
      // Pick the axis least aligned with v to keep the cross product stable.
      target.set(-v.y, v.x, 0);
    } else {
      target.set(0, -v.z, v.y);
    }
    return target.normalize();
  }

  /** Barycentric combination: this = a*wa + b*wb + c*wc. */
  static weighted(a: Vec3, wa: number, b: Vec3, wb: number, c: Vec3, wc: number, target = new Vec3()): Vec3 {
    target.x = a.x * wa + b.x * wb + c.x * wc;
    target.y = a.y * wa + b.y * wb + c.y * wc;
    target.z = a.z * wa + b.z * wb + c.z * wc;
    return target;
  }

  /** Linear interpolation between two points, written without a `t` clamp. */
  static lerp(a: Vec3, b: Vec3, t: number, target = new Vec3()): Vec3 {
    return target.lerpVectors(a, b, t);
  }
}