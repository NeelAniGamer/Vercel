/**
 * SeededRunDirector — Deterministic Multi-Run Simulation Director
 *
 * Inspired by:
 *  - WorldBox: Seeded PRNG + micro-traits + emergent weather/event cascades
 *  - Plague Inc.: Macro zone pressure graph propagating congestion waves
 *
 * Produces distinct, reproducible traffic, weather, and crowd dynamics per
 * `?seed=<int>` without breaking level syllabus objectives.
 */
(function (root) {
  'use strict';

  function mulberry32(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const RUN_MODIFIERS = {
    CLEAR_FLOW: {
      id: 'CLEAR_FLOW',
      label: 'Smooth Morning Flow',
      densityMult: 0.9,
      pedMult: 0.85,
      wetnessBoost: 0.0,
      aggressiveBias: 0.0
    },
    MARKET_SURGE: {
      id: 'MARKET_SURGE',
      label: 'Bazaar Delivery Surge',
      densityMult: 1.25,
      pedMult: 1.35,
      wetnessBoost: 0.0,
      aggressiveBias: 0.12
    },
    MONSOON_SQUALL: {
      id: 'MONSOON_SQUALL',
      label: 'Monsoon Wet Asphalt',
      densityMult: 1.05,
      pedMult: 0.75,
      wetnessBoost: 0.75,
      aggressiveBias: 0.05
    },
    SCHOOL_RUSH: {
      id: 'SCHOOL_RUSH',
      label: 'School Dismissal Wave',
      densityMult: 1.15,
      pedMult: 1.4,
      wetnessBoost: 0.0,
      aggressiveBias: -0.05
    },
    EVENING_PEAK: {
      id: 'EVENING_PEAK',
      label: 'Peak Hour Grid Pressure',
      densityMult: 1.35,
      pedMult: 1.15,
      wetnessBoost: 0.1,
      aggressiveBias: 0.18
    }
  };

  class ZonePressureGraph {
    constructor(rng) {
      this.rng = rng;
      this.zones = new Map();
      const defaults = ['commercial', 'residential', 'market', 'school', 'industrial', 'suburban'];
      defaults.forEach(name => {
        this.zones.set(name, {
          name,
          pressure: 0.25 + rng() * 0.45,
          targetPressure: 0.3 + rng() * 0.5,
          neighbors: []
        });
      });
      this._link('commercial', 'market');
      this._link('commercial', 'residential');
      this._link('residential', 'school');
      this._link('residential', 'suburban');
      this._link('market', 'industrial');
      this._link('industrial', 'commercial');
    }

    _link(a, b) {
      const za = this.zones.get(a);
      const zb = this.zones.get(b);
      if (za && zb) {
        za.neighbors.push(b);
        zb.neighbors.push(a);
      }
    }

    step(dt) {
      // Discrete SIR-style diffusion of congestion pressure between connected zones
      const deltas = new Map();
      for (const [name, z] of this.zones) {
        let flux = 0;
        for (const nName of z.neighbors) {
          const nb = this.zones.get(nName);
          if (nb) {
            flux += (nb.pressure - z.pressure) * 0.08;
          }
        }
        const drift = (z.targetPressure - z.pressure) * 0.05;
        const pulse = (this.rng() - 0.5) * 0.04;
        deltas.set(name, (flux + drift + pulse) * Math.min(dt, 2.0));
      }
      for (const [name, d] of deltas) {
        const z = this.zones.get(name);
        z.pressure = Math.max(0.1, Math.min(1.0, z.pressure + d));
      }
    }

    getPressure(zoneName) {
      const key = String(zoneName || 'commercial').toLowerCase();
      const z = this.zones.get(key);
      return z ? z.pressure : 0.45;
    }
  }

  class SeededRunDirector {
    constructor(game, cfg) {
      this.game = game;
      this.cfg = cfg || {};
      this.seed = this._resolveSeed(cfg);
      this.rng = mulberry32(this.seed);
      this.modifier = this._pickModifier(cfg);
      this.zoneGraph = new ZonePressureGraph(this.rng);
      this._tickAccum = 0;
      this.wetness = Math.max(cfg && (cfg.hasRain || cfg.hasPuddles) ? 0.85 : 0.0, this.modifier.wetnessBoost);
      if (game) {
        game.runSeed = this.seed;
        game.runModifier = this.modifier;
      }
    }

    _resolveSeed(cfg) {
      try {
        const params = new URLSearchParams(window.location.search || '');
        const q = parseInt(params.get('seed'), 10);
        if (Number.isFinite(q)) { return q; }
      } catch (e) {}
      if (cfg && Number.isFinite(cfg.seed)) { return cfg.seed | 0; }
      const lv = (cfg && cfg.id) ? String(cfg.id) : '1';
      let h = 2166136261;
      for (let i = 0; i < lv.length; i++) {
        h ^= lv.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h ^ (Date.now() & 0xffff)) | 0;
    }

    _pickModifier(cfg) {
      const keys = Object.keys(RUN_MODIFIERS);
      if (cfg && cfg.hasSchool) { return RUN_MODIFIERS.SCHOOL_RUSH; }
      if (cfg && cfg.hasRain) { return RUN_MODIFIERS.MONSOON_SQUALL; }
      const idx = Math.floor(this.rng() * keys.length);
      return RUN_MODIFIERS[keys[idx]] || RUN_MODIFIERS.CLEAR_FLOW;
    }

    update(dt) {
      this._tickAccum += dt;
      if (this._tickAccum < 2.0) { return; }
      const stepDt = this._tickAccum;
      this._tickAccum = 0;
      this.zoneGraph.step(stepDt);
    }

    getZoneDensityMultiplier(zoneName) {
      const p = this.zoneGraph.getPressure(zoneName);
      return this.modifier.densityMult * (0.75 + p * 0.5);
    }

    getSummary() {
      return {
        seed: this.seed,
        modifier: this.modifier.id,
        label: this.modifier.label,
        wetness: this.wetness
      };
    }
  }

  root.SeededRunDirector = SeededRunDirector;
  root.TrafficMulberry32 = mulberry32;
})(typeof window !== 'undefined' ? window : globalThis);
