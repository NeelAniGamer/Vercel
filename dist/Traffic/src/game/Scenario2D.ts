// @ts-nocheck
/**
 * Scenario2D — bridge module over legacy scenario2d.js
 *
 * The legacy implementation (~867 lines of canvas 2D cartoon rendering)
 * is stable, self-contained, and zero-dependency. Rather than rewriting
 * proven drawing code, this module imports it and exposes a typed API.
 *
 * Full conversion target: src/ui/scenario/ (deferred — see MIGRATION_PLAN.md Phase 4b)
 */

import '../../scenario2d.js';

export interface ScenarioConfig {
  duration?: number;
  headline?: string;
  subline?: string;
  objectives?: string[];
  sky?: any;
  night?: boolean;
  buildings?: any;
  road?: any;
  crosswalk?: boolean;
  puddles?: any[];
  parkedCars?: any[];
  trafficLight?: any;
  vehicles?: any[];
  pedestrians?: {
    count: number;
    walkSpeed: number;
    colors: string[];
  };
  streetLights?: boolean;
  rain?: boolean;
  particles?: 'confetti' | 'dust';
  sound?: string;
  wind?: number;
  focus?: { x: number; y: number; zoom: number };
}

export interface LawInfo {
  off: string;
  fine: string;
}

export interface LevelVisuals {
  id: number;
  icon?: string;
  themeType?: string;
  law?: LawInfo;
}

export interface Scenario2DAPI {
  play(levelId: number | string, onComplete: () => void): void;
  skip(): void;
  destroy(): void;
}

/**
 * Get the singleton Scenario2D instance (created by legacy script).
 */
export function getScenario2D(): Scenario2DAPI {
  return (window as any).Scenario2D as Scenario2DAPI;
}

/**
 * Play the intro scenario for a level.
 */
export function playScenario(levelId: number | string, onComplete: () => void): void {
  getScenario2D().play(levelId, onComplete);
}

/**
 * All scenario theme configurations keyed by themeType.
 */
export function getScenarioData(): Record<string, ScenarioConfig> {
  return (window as any).Scenario2DData || {};
}

// Legacy global access (for old code paths)
if (typeof window !== 'undefined') {
  // window.Scenario2D / window.Scenario2DData are set by the legacy script itself
}