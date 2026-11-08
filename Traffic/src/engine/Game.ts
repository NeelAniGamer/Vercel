// @ts-nocheck
/**
 * Game — Game Engine Entry Point
 * Inherits full Pacejka MF 5.2 physics, TrafficManager integration,
 * OBB collision detection, audio synthesis, and multi-camera perspectives.
 */

import { GameEngine, GameConfig, CameraMode } from './GameEngine';

export { GameEngine, type GameConfig, type CameraMode };

export class Game extends GameEngine {
  constructor(config: GameConfig) {
    super(config);
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).Game = Game;
  (window as any).GameEngine = GameEngine;
}
