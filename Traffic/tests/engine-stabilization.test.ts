import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('../units-bridge.js');
require('../run-director.js');

describe('TrafficUnits SI Bridge', () => {
  it('converts internal units consistently between m/s and km/h (1 unit = 30 m/s = 108 km/h)', () => {
    const TU = (globalThis as any).TrafficUnits;
    expect(TU).toBeDefined();
    expect(TU.playerSpeedToMs(1)).toBeCloseTo(30, 8);
    expect(TU.playerSpeedToKmh(1)).toBeCloseTo(108, 8);
    expect(TU.kmhToPlayerSpeed(108)).toBeCloseTo(1, 8);
    expect(TU.msToPlayerSpeed(30)).toBeCloseTo(1, 8);
  });
});

describe('SeededRunDirector (WorldBox + Plague Inc. Multi-Run Engine)', () => {
  it('produces identical modifier and zone pressures for the same seed', () => {
    const Director = (globalThis as any).SeededRunDirector;
    const d1 = new Director({}, { id: 99, seed: 424242 });
    const d2 = new Director({}, { id: 99, seed: 424242 });
    expect(d1.getSummary()).toEqual(d2.getSummary());
    expect(d1.getZoneDensityMultiplier('commercial')).toBeCloseTo(
      d2.getZoneDensityMultiplier('commercial'),
      10
    );
  });

  it('diverges across different seeds while keeping zone pressure bounded [0.1, 1.0]', () => {
    const Director = (globalThis as any).SeededRunDirector;
    const summaries = new Set<string>();
    for (let s = 1; s <= 15; s++) {
      const d = new Director({}, { id: 99, seed: s * 1013 });
      d.update(2.0);
      d.update(2.0);
      const p = d.zoneGraph.getPressure('market');
      expect(p).toBeGreaterThanOrEqual(0.1);
      expect(p).toBeLessThanOrEqual(1.0);
      summaries.add(d.getSummary().modifier);
    }
    expect(summaries.size).toBeGreaterThan(1);
  });
});
