import { describe, expect, it } from 'vitest';
import { Vec3 } from './Vec3';

describe('Vec3', () => {
  it('computes a right-handed cross product', () => {
    const x = new Vec3(1, 0, 0);
    const y = new Vec3(0, 1, 0);
    const z = Vec3.cross(x, y, new Vec3());
    expect(z.x).toBeCloseTo(0, 12);
    expect(z.y).toBeCloseTo(0, 12);
    expect(z.z).toBeCloseTo(1, 12);
  });

  it('keeps dot/cross identities consistent', () => {
    const a = new Vec3(1.7, -2.3, 0.9);
    const b = new Vec3(-0.4, 3.1, 2.2);
    const cross = Vec3.cross(a, b, new Vec3());
    // The cross product is orthogonal to both operands.
    expect(cross.dot(a)).toBeCloseTo(0, 12);
    expect(cross.dot(b)).toBeCloseTo(0, 12);
    // Lagrange's identity: |a x b|^2 = |a|^2|b|^2 - (a.b)^2
    const lhs = cross.lengthSq();
    const rhs = a.lengthSq() * b.lengthSq() - Math.pow(a.dot(b), 2);
    expect(lhs).toBeCloseTo(rhs, 10);
  });

  it('normalizes to unit length and collapses degenerate input', () => {
    const v = new Vec3(3, 4, 0);
    v.normalize();
    expect(v.length()).toBeCloseTo(1, 12);

    // A zero-length vector must not become NaN — that is how a physics
    // simulation dies silently.
    const zero = new Vec3(0, 0, 0);
    zero.normalize();
    expect(zero.toArray()).toEqual([0, 0, 0]);
    expect(zero.isFinite()).toBe(true);

    const tiny = new Vec3(1e-30, 0, 0);
    tiny.normalize();
    expect(tiny.isFinite()).toBe(true);
  });

  it('clamps length while preserving direction', () => {
    const v = new Vec3(0, 10, 0);
    const len = v.clampLength(3);
    expect(len).toBeCloseTo(3, 12);
    expect(v.length()).toBeCloseTo(3, 12);
    expect(v.y).toBeCloseTo(3, 12);
    expect(v.x).toBeCloseTo(0, 12);

    // Below the cap the vector is untouched.
    const small = new Vec3(0, 1, 0);
    expect(small.clampLength(3)).toBeCloseTo(1, 12);
    expect(small.y).toBeCloseTo(1, 12);
  });

  it('produces a unit vector orthogonal to any input', () => {
    const inputs = [
      new Vec3(1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(1, 1, 1),
      new Vec3(-3.2, 0.7, 4.4),
      new Vec3(1e-8, 1e-8, 1e-8),
    ];
    for (const v of inputs) {
      const p = Vec3.anyPerpendicular(v, new Vec3());
      expect(p.length(), `not unit for ${v.toArray()}`).toBeCloseTo(1, 10);
      expect(p.dot(v), `not orthogonal for ${v.toArray()}`).toBeCloseTo(0, 10);
      expect(p.isFinite()).toBe(true);
    }
  });

  it('aliases independent vectors when used as instance methods', () => {
    const a = new Vec3(1, 0, 0);
    const b = new Vec3(0, 1, 0);
    a.cross(b);
    // `a` is now also the output buffer; the result is still correct.
    expect(a.z).toBeCloseTo(1, 12);
  });

  it('interpolates between endpoints', () => {
    const a = new Vec3(0, 0, 0);
    const b = new Vec3(10, -20, 30);
    expect(Vec3.lerp(a, b, 0, new Vec3()).toArray()).toEqual([0, 0, 0]);
    expect(Vec3.lerp(a, b, 1, new Vec3()).toArray()).toEqual([10, -20, 30]);
    const mid = Vec3.lerp(a, b, 0.5, new Vec3());
    expect(mid.toArray()).toEqual([5, -10, 15]);
    // lerpVectors must not corrupt its inputs.
    expect(a.toArray()).toEqual([0, 0, 0]);
    expect(b.toArray()).toEqual([10, -20, 30]);
  });

  it('computes weighted barycentric combinations', () => {
    const a = new Vec3(1, 0, 0);
    const b = new Vec3(0, 1, 0);
    const c = new Vec3(0, 0, 1);
    const v = Vec3.weighted(a, 1, b, 2, c, 3, new Vec3());
    expect(v.toArray()).toEqual([1, 2, 3]);
  });

  it('detects and reports non-finite state', () => {
    const bad = new Vec3(NaN, 0, 0);
    expect(bad.isFinite()).toBe(false);
    expect(() => bad.assertFinite('test')).toThrow(/non-finite/);
    expect(() => new Vec3(1, Infinity, 3).assertFinite()).toThrow();
    expect(new Vec3(1, 2, 3).assertFinite()).toBe(true);
  });

  it('measures distance consistently with the squared form', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 6, 3);
    expect(a.distanceTo(b)).toBeCloseTo(Math.sqrt(a.distanceToSq(b)), 12);
    expect(a.distanceTo(b)).toBeCloseTo(5, 12);
    expect(a.distanceTo(a)).toBe(0);
  });
});