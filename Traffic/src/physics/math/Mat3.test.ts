import { describe, expect, it } from 'vitest';
import { Mat3 } from './Mat3';
import { Quat } from './Quat';
import { Vec3 } from './Vec3';

function identity(): Mat3 {
  return new Mat3();
}

/** Multiply a 3x3 rotation into a vector, reusing the class transform. */
function mul(m: Mat3, v: Vec3): Vec3 {
  return m.clone().transformDirection(v, new Vec3());
}

describe('Mat3', () => {
  it('inverts a general matrix back to the identity', () => {
    const m = new Mat3().setValues(
      2, -1, 0.5,
      0.25, 3, 1,
      -1, 0.5, 4,
    );
    const inverse = m.clone();
    expect(inverse.invert()).toBe(true);

    const product = new Mat3().multiplyMatrices(m, inverse);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product.at(i, j), `mismatch at ${i},${j}`).toBeCloseTo(
          i === j ? 1 : 0,
          12,
        );
      }
    }
  });

  it('refuses to invert a singular matrix instead of producing garbage', () => {
    const singular = new Mat3().setValues(
      1, 2, 3,
      2, 4, 6,
      1, 1, 1,
    );
    const m = singular.clone();
    expect(m.invert()).toBe(false);
    // The matrix must be left untouched on failure.
    expect(m.at(0, 1)).toBe(2);
    expect(m.at(1, 1)).toBe(4);

    expect(new Mat3().setZero().invert()).toBe(false);
  });

  it('inverts a symmetric inertia-shaped matrix correctly', () => {
    // Diagonal dominance is what a real inertia tensor has.
    const inertia = new Mat3().setValues(
      500, 10, 5,
      10, 480, 8,
      5, 8, 600,
    );
    const inverse = inertia.clone();
    expect(inverse.invert()).toBe(true);

    // I * I^-1 = identity
    const product = new Mat3().multiplyMatrices(inertia, inverse);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product.at(i, j), `mismatch at ${i},${j}`).toBeCloseTo(
          i === j ? 1 : 0,
          10,
        );
      }
    }
  });

  it('matches the quaternion rotation it was built from', () => {
    const q = new Quat().setFromEulerYXZ(0.3, 0.8, -0.5);
    const m = new Mat3().setFromQuat(q);
    const v = new Vec3(2, -3, 4);
    const viaQuat = q.rotateVector(v, new Vec3());
    const viaMat = mul(m, v);
    expect(viaMat.x).toBeCloseTo(viaQuat.x, 12);
    expect(viaMat.y).toBeCloseTo(viaQuat.y, 12);
    expect(viaMat.z).toBeCloseTo(viaQuat.z, 12);
  });

  it('inverse-transform is the true inverse for a rotation matrix', () => {
    const m = new Mat3().setFromQuat(new Quat().setFromEulerYXZ(0.2, 1.5, 0.4));
    const v = new Vec3(5, 1, -2);
    const world = mul(m, v);
    const local = m.clone().transformInverseDirection(world, new Vec3());
    expect(local.x).toBeCloseTo(v.x, 12);
    expect(local.y).toBeCloseTo(v.y, 12);
    expect(local.z).toBeCloseTo(v.z, 12);
  });

  it('preserves lengths and angles under a rotation basis', () => {
    const m = new Mat3().setFromQuat(new Quat().setFromEulerYXZ(0.1, 0.6, -0.2));
    const v = new Vec3(3, 4, 5);
    expect(mul(m, v).length()).toBeCloseTo(v.length(), 12);
  });

  it('computes determinant correctly', () => {
    expect(identity().determinant()).toBeCloseTo(1, 12);
    expect(new Mat3().setDiagonal(2, 3, 4).determinant()).toBeCloseTo(24, 12);
    expect(new Mat3().setZero().determinant()).toBe(0);
  });

  it('transposes correctly', () => {
    const m = new Mat3().setValues(
      1, 2, 3,
      4, 5, 6,
      7, 8, 9,
    ).transpose();
    // Transposed:
    //   1 4 7
    //   2 5 8
    //   3 6 9
    expect(m.at(0, 0)).toBe(1);
    expect(m.at(0, 1)).toBe(4);
    expect(m.at(0, 2)).toBe(7);
    expect(m.at(1, 0)).toBe(2);
    expect(m.at(2, 0)).toBe(3);
    expect(m.at(2, 2)).toBe(9);
  });

  it('assembles a point-mass inertia tensor correctly', () => {
    // Two unit masses 2 m apart along X: Ixx = 0, Iyy = Izz = 2.
    const m = new Mat3().setZero();
    m.addPointMass(1, new Vec3(1, 0, 0));
    m.addPointMass(1, new Vec3(-1, 0, 0));

    expect(m.at(0, 0)).toBeCloseTo(0, 12);
    expect(m.at(1, 1)).toBeCloseTo(2, 12);
    expect(m.at(2, 2)).toBeCloseTo(2, 12);
    // Off-diagonals vanish by symmetry.
    expect(m.at(0, 1)).toBeCloseTo(0, 12);
  });

  it('puts point-mass inertia on the perpendicular axes, not the offset axis', () => {
    // A unit mass 1 m along X has NO inertia about X (it lies on that axis) and
    // full inertia about Y and Z. Accumulating the raw outer product instead
    // puts the inertia exactly backwards: onto X and nowhere else.
    const outerOnly = new Mat3().setZero();
    outerOnly.addOuter(new Vec3(1, 0, 0), new Vec3(1, 0, 0), 1);
    expect(outerOnly.at(0, 0)).toBeCloseTo(1, 12);
    expect(outerOnly.at(1, 1)).toBeCloseTo(0, 12);

    const pointMass = new Mat3().setZero();
    pointMass.addPointMass(1, new Vec3(1, 0, 0));
    expect(pointMass.at(0, 0)).toBeCloseTo(0, 12);
    expect(pointMass.at(1, 1)).toBeCloseTo(1, 12);
    expect(pointMass.at(2, 2)).toBeCloseTo(1, 12);

    // trace = 2 * m * |r|^2, the standard parallel-axis result.
    const trace = pointMass.at(0, 0) + pointMass.at(1, 1) + pointMass.at(2, 2);
    expect(trace).toBeCloseTo(2, 12);
  });

  it('gives a mass at the centre of mass no rotational inertia', () => {
    const m = new Mat3().setZero();
    m.addPointMass(3, new Vec3(0, 0, 0));
    expect(m.toArray().every((v) => v === 0)).toBe(true);
  });

  it('reports non-finite state', () => {
    const m = new Mat3().setValues(1, 0, 0, 0, NaN, 0, 0, 0, 1);
    expect(m.isFinite()).toBe(false);
    expect(new Mat3().setIdentity().isFinite()).toBe(true);
  });
});