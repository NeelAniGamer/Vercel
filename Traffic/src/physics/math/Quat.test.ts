import { describe, expect, it } from 'vitest';
import { Quat } from './Quat';
import { Vec3 } from './Vec3';

describe('Quat', () => {
  it('rotates vectors according to right-handed Y-up convention', () => {
    const q = new Quat().setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 2);

    // +Z (forward) -> +X (right) under a +90 degree yaw.
    const forward = q.rotateVector(new Vec3(0, 0, 1), new Vec3());
    expect(forward.x).toBeCloseTo(1, 12);
    expect(forward.y).toBeCloseTo(0, 12);
    expect(forward.z).toBeCloseTo(0, 12);

    // +X (right) -> -Z (backward).
    const right = q.rotateVector(new Vec3(1, 0, 0), new Vec3());
    expect(right.x).toBeCloseTo(0, 12);
    expect(right.z).toBeCloseTo(-1, 12);
  });

  it('preserves vector length under rotation', () => {
    const q = new Quat().setFromEulerYXZ(0.3, 1.1, -0.2);
    const v = new Vec3(3, -4, 12);
    const r = q.rotateVector(v, new Vec3());
    expect(r.length()).toBeCloseTo(v.length(), 12);
  });

  it('inverse rotation exactly undoes forward rotation', () => {
    const q = new Quat().setFromEulerYXZ(0.4, -0.9, 0.25);
    const v = new Vec3(1.5, -2.5, 3.5);
    const there = q.rotateVector(v, new Vec3());
    const back = q.inverseRotateVector(there, new Vec3());
    expect(back.x).toBeCloseTo(v.x, 12);
    expect(back.y).toBeCloseTo(v.y, 12);
    expect(back.z).toBeCloseTo(v.z, 12);
  });

  it('builds a shortest-arc rotation between two unit vectors', () => {
    const cases: Array<[Vec3, Vec3]> = [
      [new Vec3(1, 0, 0), new Vec3(0, 0, 1)],
      [new Vec3(0, 1, 0), new Vec3(0, -1, 0)],
      [new Vec3(-1, 0, 0), new Vec3(0, 0, -1)],
    ];
    for (const [from, to] of cases) {
      const q = new Quat().setFromUnitVectors(from, to);
      const result = q.rotateVector(from.clone(), new Vec3());
      expect(result.x).toBeCloseTo(to.x, 12);
      expect(result.y).toBeCloseTo(to.y, 12);
      expect(result.z).toBeCloseTo(to.z, 12);
    }
  });

  it('handles parallel and antiparallel unit-vector pairs', () => {
    const a = new Vec3(0, 0, 1);

    // Already aligned -> identity.
    const same = new Quat().setFromUnitVectors(a, a.clone());
    const r1 = same.rotateVector(a.clone(), new Vec3());
    expect(r1.z).toBeCloseTo(1, 12);

    // Exactly opposite -> a valid 180 degree turn, no NaN.
    const opposite = new Quat().setFromUnitVectors(a, new Vec3(0, 0, -1));
    expect(opposite.isFinite()).toBe(true);
    const r2 = opposite.rotateVector(a.clone(), new Vec3());
    expect(r2.z).toBeCloseTo(-1, 12);
  });

  it('stays normalized over thousands of integration steps', () => {
    const q = new Quat();
    const omega = new Vec3(0.3, 1.7, -0.9);
    for (let i = 0; i < 10_000; i++) {
      q.integrate(omega, 1 / 60);
    }
    expect(q.length()).toBeCloseTo(1, 10);
    expect(q.isFinite()).toBe(true);
  });

  it('integrates a yaw rate into the expected heading', () => {
    // Constant yaw rate r for time T must rotate by exactly r*T.
    const yawRate = 0.8;
    const duration = 2.5;
    const q = new Quat();
    const steps = 250;
    for (let i = 0; i < steps; i++) {
      q.integrate(new Vec3(0, yawRate, 0), duration / steps);
    }
    const forward = q.rotateVector(new Vec3(0, 0, 1), new Vec3());
    const expected = new Quat()
      .setFromAxisAngle(new Vec3(0, 1, 0), yawRate * duration)
      .rotateVector(new Vec3(0, 0, 1), new Vec3());
    expect(forward.x).toBeCloseTo(expected.x, 10);
    expect(forward.z).toBeCloseTo(expected.z, 10);
  });

  it('composes rotations in the documented order', () => {
    const a = new Quat().setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 2);
    const b = new Quat().setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / 2);

    // multiplyQuats(a, b) applies b first, then a.
    const combined = new Quat().multiplyQuats(a, b);
    const v = new Vec3(0, 0, 1);
    const viaComposition = combined.rotateVector(v, new Vec3());
    const viaApplication = a.rotateVector(b.rotateVector(v, new Vec3()), new Vec3());
    expect(viaComposition.x).toBeCloseTo(viaApplication.x, 12);
    expect(viaComposition.y).toBeCloseTo(viaApplication.y, 12);
    expect(viaComposition.z).toBeCloseTo(viaApplication.z, 12);
  });

  it('inverts via conjugation', () => {
    const q = new Quat().setFromEulerYXZ(0.5, 1.2, -0.7);
    const inv = q.clone().invert();
    const product = new Quat().multiplyQuats(q, inv);
    expect(product.x).toBeCloseTo(0, 12);
    expect(product.y).toBeCloseTo(0, 12);
    expect(product.z).toBeCloseTo(0, 12);
    expect(product.w).toBeCloseTo(1, 12);
  });

  it('interpolates between orientations, hitting both endpoints', () => {
    const a = new Quat();
    const b = new Quat().setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 3);

    expect(a.clone().slerp(b, 0).equals(a)).toBe(true);
    expect(a.clone().slerp(b, 1).equals(b)).toBe(true);

    // Halfway should be half the angle.
    const mid = a.clone().slerp(b, 0.5);
    const midAngle = 2 * Math.acos(Math.min(1, Math.abs(mid.w)));
    expect(midAngle).toBeCloseTo(Math.PI / 6, 10);
  });

  it('recognises q and -q as the same rotation', () => {
    const q = new Quat().setFromAxisAngle(new Vec3(1, 1, 0), 0.8);
    const negated = new Quat(-q.x, -q.y, -q.z, -q.w);
    expect(q.equals(negated)).toBe(true);
    expect(q.equals(new Quat())).toBe(false);
  });
});