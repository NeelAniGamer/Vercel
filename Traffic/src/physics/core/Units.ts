/**
 * The engine's unit system, and the only sanctioned bridge to legacy units.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 * Inside `src/physics` every quantity is SI: metres, kilograms, seconds,
 * radians, newtons, pascals. No module may introduce a conversion factor of
 * its own. If a value needs to cross into the legacy game runtime it goes
 * through this file, which makes the crossing auditable.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * MATH-AUDIT.md (2026-10-03) found the legacy runtime carrying at least five
 * mutually incompatible conversions of its internal speed unit:
 *
 *   x30    physics path        game_core.js   1 unit = 30 m/s = 108 km/h
 *   x100   HUD display         game_core.js   1 unit = 100 km/h
 *   /100   cruise + governor   game_core.js
 *   x20    NPC AI              npc-ai.js      1.5x the physics value
 *   0.033  lateral slip        game_core.js   a hardcoded 1/30 s, not dt
 *
 * Because `x100` and `x30` disagree by 7.4%, the speedometer reads low, the
 * governor labelled "50 km/h" actually enforces 54, and 0-100 km/h is
 * literally unreachable. The engine cannot inherit that. `LEGACY_MPS_PER_UNIT`
 * below is the one canonical mapping, chosen to match the physics path
 * because that is the path a real simulation must agree with. Every other
 * legacy factor is treated as a bug to be migrated, not a variant to support.
 */

/** Standard gravity, m/s^2. */
export const GRAVITY = 9.80665;

/** Vacuum density, kg/m^3 — used by the fluid solver. */
export const AIR_DENSITY = 1.225;

// ── Angle ────────────────────────────────────────────────────────────────────

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

// ── Speed ───────────────────────────────────────────────────────────────────

export const MS_TO_KMH = 3.6;
export const KMH_TO_MS = 1 / 3.6;

export function msToKmh(ms: number): number {
  return ms * MS_TO_KMH;
}

export function kmhToMs(kmh: number): number {
  return kmh * KMH_TO_MS;
}

// ── Legacy bridge ───────────────────────────────────────────────────────────

/**
 * Metres per second in one legacy internal speed unit.
 *
 * Matches the physics path (game_core.js `* 30`), which is the authoritative
 * legacy conversion. The HUD's `* 100` is 7.4% low against this and is a
 * display-layer concern, not a physics one.
 */
export const LEGACY_MPS_PER_UNIT = 30;

/** Equivalent km/h per legacy unit: 30 m/s * 3.6 = 108 km/h. */
export const LEGACY_KMH_PER_UNIT = LEGACY_MPS_PER_UNIT * MS_TO_KMH;

/**
 * Legacy speed units/frame <-> metres/second.
 *
 * A legacy speed is normalised as units *per frame* (see MATH-1-6), so any
 * conversion to a real quantity needs the true frame time. Pass the real dt —
 * never a hardcoded 1/30 or 1/60, which is precisely how the lateral-slip
 * path in game_core.js acquired its phantom 30 fps assumption.
 */
export function legacyUnitsPerFrameToMs(unitsPerFrame: number, dt: number): number {
  return unitsPerFrame * LEGACY_MPS_PER_UNIT * dt;
}

/** Inverse of the above. */
export function msToLegacyUnitsPerFrame(ms: number, dt: number): number {
  return ms / (LEGACY_MPS_PER_UNIT * dt);
}

/**
 * The HUD's historical display factor, retained solely so the legacy runtime
 * can be read without reinterpretation. Never use this to drive physics — it
 * is the 7.4% error described above.
 */
export const LEGACY_HUD_KMH_PER_UNIT = 100;

// ── Force / energy ──────────────────────────────────────────────────────────

export function newtonsToKilonewtons(n: number): number {
  return n / 1000;
}

export function joulesToKilowattHours(j: number): number {
  return j / 3.6e6;
}

// ── Time ────────────────────────────────────────────────────────────────────

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;