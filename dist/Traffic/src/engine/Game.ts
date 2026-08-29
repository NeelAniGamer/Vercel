// @ts-nocheck
import { Renderer } from './Renderer';
import { InputManager } from './Input';
import { RoadGraph, RoadConfig } from '@systems/RoadGraph';
import { ThreePools } from '@systems/Pools';
import { store, GameState } from '@state/store';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  platform: 'electron' | 'web';
  quality?: 'Low' | 'Medium' | 'High' | 'Ultra';
}

export class Game {
  public renderer: Renderer;
  public input: InputManager;
  public roadGraph: RoadGraph | null = null;
  public config: GameConfig;
  public platform: string;

  private running = false;
  private paused = false;
  private lastTime = 0;
  private animationFrameId = 0;
  private currentLevel: string | null = null;
  private currentMode: string = 'LEARN';

  constructor(config: GameConfig) {
    this.config = config;
    this.platform = config.platform;

    // Initialize pools
    ThreePools.init();

    // Create renderer
    this.renderer = new Renderer({
      canvas: config.canvas,
      quality: config.quality
    });

    // Create input manager
    this.input = new InputManager();

    console.log(`[Game] Initialized on platform: ${this.platform}`);
  }

  /**
   * Load and start a level
   */
  loadLevel(levelId: string, mode: string = 'LEARN'): void {
    this.currentLevel = levelId;
    this.currentMode = mode;
    console.log(`[Game] Loading level: ${levelId}, mode: ${mode}`);

    // TODO: Load level config from levels/ directory
    // TODO: Build scene from level config
    // TODO: Spawn NPCs, set up missions
  }

  /**
   * Build road graph from level config
   */
  buildRoadGraph(config: RoadConfig): void {
    this.roadGraph = RoadGraph.fromLevelConfig(config);
    console.log(`[Game] Road graph: ${this.roadGraph.nodes.size} nodes, ${this.roadGraph.edges.size} edges`);
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
    console.log('[Game] Started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
    console.log('[Game] Stopped');
  }

  /**
   * Pause/unpause
   */
  setPaused(paused: boolean): void {
    this.paused = paused;
    store.getState().setPaused(paused);
  }

  /**
   * Main game loop
   */
  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = now;

    if (!this.paused) {
      this.update(deltaTime);
    }

    this.renderer.update(deltaTime);
    this.renderer.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Update game logic
   */
  private update(deltaTime: number): void {
    // Input
    this.input.update();

    // Handle single-press actions
    if (this.input.consume('pause')) {
      this.setPaused(true);
    }
    if (this.input.consume('restart') && this.currentLevel) {
      this.loadLevel(this.currentLevel, this.currentMode);
    }
    if (this.input.consume('cameraToggle')) {
      // TODO: Toggle camera view
    }

    // TODO: Update vehicle physics
    // TODO: Update NPCs
    // TODO: Update missions
    // TODO: Check violations
    // TODO: Update HUD
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.input.dispose();
    this.renderer.dispose();
    ThreePools.releaseAll();
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).Game = Game;
}
