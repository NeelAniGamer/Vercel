// @ts-nocheck
import { Game } from './engine/Game';
import { store } from './state/store';
import { platform } from './platform';
import './engine/Physics'; // Register globals for migration compat
import './systems/Pools';  // Register globals for migration compat
import './systems/RoadGraph'; // Register globals for migration compat

async function main() {
  console.log('[TrafficApp] Starting...');

  // Get canvas
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('[TrafficApp] Canvas not found');
    return;
  }

  // Get quality from settings
  const state = store.getState();
  const quality = state.settings.quality;

  // Detect platform
  const isElectron = platform.name === 'electron';

  // Create game
  const game = new Game({
    canvas,
    platform: isElectron ? 'electron' : 'web',
    quality
  });

  // Set auto-quality if enabled
  if (state.settings.autoQuality) {
    game.renderer.setAutoQuality(true);
  }

  // Set time of day (default to daytime for now)
  game.renderer.setTimeOfDay(10); // 10 AM

  // Listen for menu actions (Electron)
  if (isElectron) {
    platform.onMenuAction((action) => {
      switch (action) {
        case 'new-game':
          // TODO: Show level select
          break;
        case 'restart':
          if (store.getState().currentLevel) {
            game.loadLevel(store.getState().currentLevel!, store.getState().currentMode!);
          }
          break;
        case 'about':
          // TODO: Show about dialog
          break;
        case 'report-bug':
          // TODO: Open bug report
          break;
      }
    });
  }

  // Start the game loop
  game.start();

  // Load first level if specified in URL
  const params = new URLSearchParams(window.location.search);
  const levelId = params.get('lv') || localStorage.getItem('traffic_lv');
  const mode = params.get('mode') || localStorage.getItem('traffic_mode') || 'LEARN';

  if (levelId) {
    game.loadLevel(levelId, mode);
  }

  // Expose for debugging
  (window as any).game = game;
  (window as any).store = store;
  (window as any).platform = platform;

  console.log(`[TrafficApp] Ready (${platform.name})`);
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
