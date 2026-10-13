import { Quat } from './Quat';
import { Vec3 } from './Vec3';

/**
 * Row-major 3x3 matrix, stored as nine numbers in row-major order.
 *
 * Used for two distinct jobs in the engine:
 *   - rotation matrices (body frame <-> world frame)
 *   - inertia tensors, which are symmetric 3x3 and cannot be reduced to a
 *     single scalar per axis for arbitrary bodies
 *
 * Element access is `m[row * 3 + col]`.
 */
export class Mat3 {
  // prettier-ignore
  private readonly e: number[] = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ];

  constructor() {}

  at(row: number, col: number): number {
    return this.e[row * 3 + col];
  }

  set(row: number, col: number, value: number): this {
    this.e[row * 3 + col] = value;
    return this;
  }

  /** Load from nine row-major values. */
  setValues(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number,
  ): this {
    this.e[0] = m00; this.e[1] = m01; this.e[2] = m02;
    this.e[3] = m10; this.e[4] = m11; this.e[5] = m12;
    this.e[6] = m20; this.e[7] = m21; this.e[8] = m22;
    return this;
  }

  setIdentity(): this {
    return this.setValues(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  setZero(): this {
    return this.setValues(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  copy(m: Mat3): this {
    for (let i = 0; i < 9; i++) this.e[i] = m.e[i];
    return this;
  }

  clone(): Mat3 {
    return new Mat3().copy(this);
  }

  setDiagonal(x: number, y: number, z: number): this {
    return this.setValues(x, 0, 0, 0, y, 0, 0, 0, z);
  }

  identity(): Mat3 {
    return new Mat3().setIdentity();
  }

  /** Extract the rotation basis from a quaternion. */
  setFromQuat(q: Quat): this {
    const { x, y, z, w } = q;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    return this.setValues(
      1 - (yy + zz), xy - wz, xz + wy,
      xy + wz, 1 - (xx + zz), yz - wx,
      xz - wy, yz + wx, 1 - (xx + yy),
    );
  }

  /** this = a * b. */
  multiplyMatrices(a: Mat3, b: Mat3): this {
    const ae = a.e, be = b.e;
    const a00 = ae[0], a01 = ae[1], a02 = ae[2];
    const a10 = ae[3], a11 = ae[4], a12 = ae[5];
    const a20 = ae[6], a21 = ae[7], a22 = ae[8];
    const b00 = be[0], b01 = be[1], b02 = be[2];
    const b10 = be[3], b11 = be[4], b12 = be[5];
    const b20 = be[6], b21 = be[7], b22 = be[8];

    return this.setValues(
      a00 * b00 + a01 * b10 + a02 * b20,
      a00 * b01 + a01 * b11 + a02 * b21,
      a00 * b02 + a01 * b12 + a02 * b22,

      a10 * b00 + a11 * b10 + a12 * b20,
      a10 * b01 + a11 * b11 + a12 * b21,
      a10 * b02 + a11 * b12 + a12 * b22,

      a20 * b00 + a21 * b10 + a22 * b20,
      a20 * b01 + a21 * b11 + a22 * b21,
      a20 * b02 + a21 * b12 + a22 * b22,
    );
  }

  multiply(m: Mat3): this {
    return this.multiplyMatrices(this, m);
  }

  transpose(): this {
    const { e } = this;
    const m01 = e[1], m02 = e[2], m12 = e[5];
    e[1] = e[3]; e[3] = m01;
    e[2] = e[6]; e[6] = m02;
    e[5] = e[7]; e[7] = m12;
    return this;
  }

  determinant(): number {
    const { e } = this;
    const a = e[0], b = e[1], c = e[2];
    const d = e[3], f = e[4], g = e[5];
    const h = e[6], i = e[7], j = e[8];
    return a * (f * j - g * i) - b * (d * j - g * h) + c * (d * i - f * h);
  }

  /**
   * In-place inverse. Returns false and leaves the matrix unchanged when it is
   * singular — a silently zeroed inertia tensor is far harder to diagnose than
   * an explicit failure.
   */
  invert(): boolean {
    const { e } = this;
    const a = e[0], b = e[1], c = e[2];
    const d = e[3], f = e[4], g = e[5];
    const h = e[6], i = e[7], j = e[8];

    const A = f * j - g * i;
    const B = g * h - d * j;
    const C = d * i - f * h;
    const det = a * A + b * B + c * C;

    if (!Number.isFinite(det) || Math.abs(det) < 1e-14) return false;

    const inv = 1 / det;
    this.setValues(
      A * inv, (c * i - b * j) * inv, (b * g - c * f) * inv,
      B * inv, (a * j - c * h) * inv, (c * d - a * g) * inv,
      C * inv, (b * h - a * i) * inv, (a * f - b * d) * inv,
    );
    return true;
  }

  /** Transform a direction (ignores translation; this matrix has none). */
  transformDirection(v: Vec3, target = new Vec3()): Vec3 {
    const { e } = this;
    const x = v.x, y = v.y, z = v.z;
    target.x = e[0] * x + e[1] * y + e[2] * z;
    target.y = e[3] * x + e[4] * y + e[5] * z;
    target.z = e[6] * x + e[7] * y + e[8] * z;
    return target;
  }

  /** Transform by the transpose — i.e. world -> local for a rotation matrix. */
  transformInverseDirection(v: Vec3, target = new Vec3()): Vec3 {
    const { e } = this;
    const x = v.x, y = v.y, z = v.z;
    target.x = e[0] * x + e[3] * y + e[6] * z;
    target.y = e[1] * x + e[4] * y + e[7] * z;
    target.z = e[2] * x + e[5] * y + e[8] * z;
    return target;
  }

  /** this += outer(a, b) — the rank-1 update used to build inertia tensors. */
  addOuter(a: Vec3, b: Vec3, scale = 1): this {
    const { e } = this;
    e[0] += a.x * b.x * scale;
    e[1] += a.x * b.y * scale;
    e[2] += a.x * b.z * scale;
    e[3] += a.y * b.x * scale;
    e[4] += a.y * b.y * scale;
    e[5] += a.y * b.z * scale;
    e[6] += a.z * b.x * scale;
    e[7] += a.z * b.y * scale;
    e[8] += a.z * b.z * scale;
    return this;
  }

  /**
   * Add the inertia contribution of a point mass sitting at `offset` from the
   * centre of mass: m * (|r|^2 * I - r (x) r).
   *
   * This is the correct primitive for assembling a rigid body's inertia tensor
   * from its constituent point masses. Accumulating `addOuter` alone gives
   * only the second term and silently produces a tensor whose trace is zero —
   * a non-physical result, since real inertia is positive-definite.
   */
  addPointMass(mass: number, offset: Vec3): this {
    const { x, y, z } = offset;
    const rSq = x * x + y * y + z * z;
    const m = mass;
    const { e } = this;

    e[0] += m * (rSq - x * x);
    e[1] += -m * x * y;
    e[2] += -m * x * z;
    e[3] += -m * y * x;
    e[4] += m * (rSq - y * y);
    e[5] += -m * y * z;
    e[6] += -m * z * x;
    e[7] += -m * z * y;
    e[8] += m * (rSq - z * z);
    return this;
  }

  scale(s: number): this {
    const { e } = this;
    for (let i = 0; i < 9; i++) e[i] *= s;
    return this;
  }

  isFinite(): boolean {
    for (let i = 0; i < 9; i++) {
      if (!Number.isFinite(this.e[i])) return false;
    }
    return true;
  }

  toArray(): number[] {
    return this.e.slice();
  }
}