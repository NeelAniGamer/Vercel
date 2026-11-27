/**
 * TrafficUnits — Single canonical SI unit bridge for the classic Traffic runtime.
 * Mirrors `src/physics/core/Units.ts` (`LEGACY_MPS_PER_UNIT = 30`, `108 km/h`).
 * Eliminates the 5 incompatible speed conversions identified in MATH-AUDIT.md.
 */
(function (root) {
  'use strict';

  const GRAVITY = 9.80665;
  const MS_TO_KMH = 3.6;
  const KMH_TO_MS = 1 / 3.6;
  const LEGACY_MPS_PER_UNIT = 30;
  const LEGACY_KMH_PER_UNIT = LEGACY_MPS_PER_UNIT * MS_TO_KMH; // 108 km/h

  function msToKmh(ms) {
    return (Number(ms) || 0) * MS_TO_KMH;
  }

  function kmhToMs(kmh) {
    return (Number(kmh) || 0) * KMH_TO_MS;
  }

  function playerSpeedToMs(internalSpeed) {
    return (Number(internalSpeed) || 0) * LEGACY_MPS_PER_UNIT;
  }

  function msToPlayerSpeed(ms) {
    return (Number(ms) || 0) / LEGACY_MPS_PER_UNIT;
  }

  function playerSpeedToKmh(internalSpeed) {
    return (Number(internalSpeed) || 0) * LEGACY_KMH_PER_UNIT;
  }

  function kmhToPlayerSpeed(kmh) {
    return (Number(kmh) || 0) / LEGACY_KMH_PER_UNIT;
  }

  root.TrafficUnits = {
    GRAVITY,
    MS_TO_KMH,
    KMH_TO_MS,
    LEGACY_MPS_PER_UNIT,
    LEGACY_KMH_PER_UNIT,
    msToKmh,
    kmhToMs,
    playerSpeedToMs,
    msToPlayerSpeed,
    playerSpeedToKmh,
    kmhToPlayerSpeed
  };
})(typeof window !== 'undefined' ? window : globalThis);
