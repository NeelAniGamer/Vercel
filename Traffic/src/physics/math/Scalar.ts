/**
 * Scalar helpers and physical constants.
 *
 * Everything in this engine is SI: metres, kilograms, seconds, radians,
 * newtons. No module may invent its own conversion factor — see core/Units.ts
 * for the legacy bridge, which exists solely to translate at the boundary.
 */

export const EPSILON = 1e-9;

/** Squared-length tolerance below which a vector is treated as zero. */
export const EPSILON_SQ = EPSILON * EPSILON;

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, v: number): number {
  return a === b ? 0 : (v - a) / (b - a);
}

export function sign(v: number): -1 | 0 | 1 {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

/** Sign-preserving map of v from [edge0, edge1] onto [-1, 1]. */
export function deadzone(v: number, edge: number): number {
  if (v >= edge) return 1;
  if (v <= -edge) return -1;
  // Scale the live region so output is continuous: 0 at v=0, 1 at v=edge.
  return v / edge;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * (3 - 2 * t);
}

/**
 * Division that returns `fallback` instead of Infinity or NaN when the
 * denominator is degenerate. Use this in physics hot paths; a silent NaN
 * propagates through the whole solver and is extremely hard to trace.
 */
export function safeDiv(a: number, b: number, fallback = 0): number {
  return b === 0 || !Number.isFinite(b) ? fallback : a / b;
}

export function safeInvSqrt(x: number): number {
  return x <= EPSILON_SQ ? 0 : 1 / Math.sqrt(x);
}

/**
 * Wrap an angle into [-PI, PI).
 *
 * Note the half-open range: +PI maps to -PI, not back to itself. Callers that
 * need the sign of a heading must test the original value rather than assuming
 * PI survives the wrap.
 */
export function wrapPi(angle: number): number {
  const twoPi = Math.PI * 2;
  let a = (angle + Math.PI) % twoPi;
  if (a < 0) a += twoPi;
  return a - Math.PI;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function isFiniteVector(...values: number[]): boolean {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) return false;
  }
  return true;
}

/** Move `current` toward `target` by at most `maxDelta`. */
export function moveTowards(
  current: number,
  target: number,
  maxDelta: number,
): number {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}

/**
 * Frame-rate independent exponential smoothing.
 *
 * `rate` is the fraction of the remaining gap closed per second. Using
 * `pow(factor, dt * 60)` reproduces the classic per-frame form while staying
 * correct at any timestep — the mistake that produced MATH-1-6 in game_core.js
 * was scaling by a hardcoded 30 or 60 rather than the real dt.
 */
export function dampFactor(ratePerSecond: number, dt: number): number {
  return Math.pow(ratePerSecond, dt);
}