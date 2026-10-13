import { describe, expect, it } from 'vitest';
import {
  GRAVITY,
  KMH_TO_MS,
  LEGACY_HUD_KMH_PER_UNIT,
  LEGACY_KMH_PER_UNIT,
  LEGACY_MPS_PER_UNIT,
  kmhToMs,
  legacyUnitsPerFrameToMs,
  msToKmh,
  msToLegacyUnitsPerFrame,
} from './Units';

describe('Units', () => {
  it('uses the standard gravity constant', () => {
    expect(GRAVITY).toBeCloseTo(9.80665, 6);
  });

  it('round-trips km/h and m/s', () => {
    for (const kmh of [0, 1, 42, 80, 100, 250]) {
      expect(msToKmh(kmhToMs(kmh))).toBeCloseTo(kmh, 10);
    }
    expect(kmhToMs(36)).toBeCloseTo(10, 12);
    expect(KMH_TO_MS * 3.6).toBeCloseTo(1, 12);
  });

  /**
   * Pins the documented legacy discrepancy. If this test ever needs changing,
   * the legacy runtime has been migrated and this module can be deleted —
   * which is the intent.
   */
  it('records the 7.4% disagreement between the legacy physics and HUD factors', () => {
    // The physics path says 1 legacy unit = 30 m/s = 108 km/h.
    expect(LEGACY_MPS_PER_UNIT).toBe(30);
    expect(LEGACY_KMH_PER_UNIT).toBeCloseTo(108, 10);

    // The HUD factor implies 100 km/h, which is 8 km/h low — a 7.41% error.
    expect(LEGACY_HUD_KMH_PER_UNIT).toBe(100);
    const error = (LEGACY_KMH_PER_UNIT - LEGACY_HUD_KMH_PER_UNIT) / LEGACY_KMH_PER_UNIT;
    expect(error).toBeCloseTo(0.074074, 6);
  });

  it('converts legacy per-frame speed to a real quantity using the true dt', () => {
    // A speed of 0.5 legacy units/frame at 60 fps is 0.5 * 30 / 60 = 0.25 m/s.
    expect(legacyUnitsPerFrameToMs(0.5, 1 / 60)).toBeCloseTo(0.25, 12);
    // The same reading at 30 fps is twice the real speed — which is exactly
    // the MATH-1-6 bug if dt is hardcoded instead of passed in.
    expect(legacyUnitsPerFrameToMs(0.5, 1 / 30)).toBeCloseTo(0.5, 12);
  });

  it('round-trips legacy frame speeds at several frame rates', () => {
    for (const dt of [1 / 20, 1 / 30, 1 / 60, 1 / 144]) {
      const ms = legacyUnitsPerFrameToMs(0.77, dt);
      expect(msToLegacyUnitsPerFrame(ms, dt)).toBeCloseTo(0.77, 10);
    }
  });
});