import { describe, expect, it } from 'vitest';
import {
  clamp,
  clamp01,
  dampFactor,
  deadzone,
  inverseLerp,
  lerp,
  moveTowards,
  safeDiv,
  safeInvSqrt,
  smoothstep,
  wrapPi,
} from './Scalar';

describe('Scalar', () => {
  it('clamps to bounds including inverted ranges', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    // Inverted range must not throw or return nonsense.
    expect(clamp(5, 10, 0)).toBeGreaterThanOrEqual(0);
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(2)).toBe(1);
  });

  it('interpolates linearly and inverts consistently', () => {
    expect(lerp(0, 10, 0.25)).toBeCloseTo(2.5, 12);
    expect(inverseLerp(0, 10, 2.5)).toBeCloseTo(0.25, 12);
    // Degenerate range must not produce Infinity.
    expect(inverseLerp(5, 5, 5)).toBe(0);
  });

  it('deadzone is continuous through zero and saturates outside the edge', () => {
    const edge = 0.2;
    expect(deadzone(0, edge)).toBe(0);
    expect(deadzone(edge, edge)).toBeCloseTo(1, 12);
    expect(deadzone(-edge, edge)).toBeCloseTo(-1, 12);
    expect(deadzone(1, edge)).toBe(1);
    expect(deadzone(-1, edge)).toBe(-1);
    // Continuity is the point: no jump at the edge crossing.
    expect(deadzone(edge - 1e-9, edge)).toBeCloseTo(1, 6);
  });

  it('smoothstep is pinned at the edges and monotonic between', () => {
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 12);
    const mid = smoothstep(0, 1, 0.25);
    const high = smoothstep(0, 1, 0.75);
    expect(mid).toBeLessThan(high);
  });

  /**
   * This is the regression guard for the MATH-1-6 defect class: a per-frame
   * constant used as though it were per-second. Exponential damping must reach
   * the same state after a fixed wall-clock duration regardless of how many
   * steps were taken.
   */
  it('dampFactor is frame-rate independent', () => {
    const totalTime = 1.0;
    const rate = 0.5; // fraction of remaining gap left after 1 second
    const expected = Math.pow(rate, totalTime);

    for (const steps of [10, 30, 60, 120, 144]) {
      const dt = totalTime / steps;
      let v = 1;
      for (let i = 0; i < steps; i++) v *= dampFactor(rate, dt);
      expect(v, `failed at ${steps} fps`).toBeCloseTo(expected, 10);
    }
  });

  it('dampFactor does nothing over a zero timestep', () => {
    expect(dampFactor(0.95, 0)).toBe(1);
  });

  it('safeDiv returns the fallback instead of Infinity or NaN', () => {
    expect(safeDiv(10, 2)).toBe(5);
    expect(safeDiv(10, 0)).toBe(0);
    expect(safeDiv(10, 0, -1)).toBe(-1);
    expect(Number.isFinite(safeDiv(1, 0))).toBe(true);
    expect(safeInvSqrt(4)).toBe(0.5);
    expect(safeInvSqrt(0)).toBe(0);
    expect(safeInvSqrt(-1)).toBe(0);
  });

  it('wraps angles into [-PI, PI)', () => {
    expect(wrapPi(0)).toBeCloseTo(0, 12);
    // The range is half-open: +PI folds to -PI rather than surviving the wrap.
    expect(wrapPi(Math.PI)).toBeCloseTo(-Math.PI, 12);
    expect(wrapPi(-Math.PI)).toBeCloseTo(-Math.PI, 12);
    expect(wrapPi(3 * Math.PI)).toBeCloseTo(-Math.PI, 12);
    expect(wrapPi(-3 * Math.PI)).toBeCloseTo(-Math.PI, 12);

    // Every result must land inside the half-open interval.
    for (const a of [-100, -7, -1, 0, 0.5, 3, Math.PI, 42, 1000]) {
      const w = wrapPi(a);
      expect(w).toBeGreaterThanOrEqual(-Math.PI);
      expect(w).toBeLessThan(Math.PI);
    }

    // Wrapping must preserve the angle modulo 2*PI.
    for (const a of [-100, -7, -1, 0.5, 3, 42, 1000]) {
      expect(Math.sin(wrapPi(a))).toBeCloseTo(Math.sin(a), 10);
      expect(Math.cos(wrapPi(a))).toBeCloseTo(Math.cos(a), 10);
    }
  });

  it('moveTowards never overshoots', () => {
    expect(moveTowards(0, 10, 3)).toBe(3);
    expect(moveTowards(0, 2, 3)).toBe(2);
    expect(moveTowards(10, 0, 3)).toBe(7);
    expect(moveTowards(0, -2, 3)).toBe(-2);
  });
});