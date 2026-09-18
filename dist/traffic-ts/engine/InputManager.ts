import { InputState } from '../types';

export class InputManager {
  state: InputState = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    boost: false,
    reverse: false,
    gear: 'D',
    headlights: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    isPointerLocked: false
  };

  private keys: Record<string, boolean> = {};
  private domElement: HTMLElement | null = null;
  private isMobile = false;

  constructor() {
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }

  attach(element: HTMLElement) {
    this.domElement = element;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    // Prevent pinch-to-zoom on the canvas
    element.style.touchAction = 'none';
    element.addEventListener('click', () => {
      if (document.fullscreenElement && !document.pointerLockElement) {
        try { element.requestPointerLock(); } catch (_) {}
      }
    });
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === 'r') {
      this.state.gear = this.state.gear === 'R' ? 'D' : 'R';
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys[k] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const isFullscreen = !!document.fullscreenElement;
    if (this.state.isPointerLocked || isFullscreen) {
      this.state.mouseDeltaX = e.movementX || 0;
      this.state.mouseDeltaY = e.movementY || 0;
    }
  };

  private handlePointerLockChange = () => {
    this.state.isPointerLocked = !!document.pointerLockElement;
  };

  private handleFullscreenChange = () => {
    if (document.fullscreenElement && this.domElement) {
      try {
        this.domElement.requestPointerLock();
      } catch (_) {}
    }
  };

  update(): InputState {
    let forward = (this.keys['w'] || this.keys['arrowup']) ? 1 : 0;
    let backward = (this.keys['s'] || this.keys['arrowdown']) ? 1 : 0;
    let left = (this.keys['a'] || this.keys['arrowleft']) ? 1 : 0;
    let right = (this.keys['d'] || this.keys['arrowright']) ? 1 : 0;

    this.state.throttle = forward;
    this.state.brake = backward;
    this.state.steer = (left ? 1 : 0) - (right ? 1 : 0);
    this.state.handbrake = !!this.keys[' '];
    this.state.boost = !!this.keys['shift'];

    return this.state;
  }

  resetMouseDeltas() {
    this.state.mouseDeltaX = 0;
    this.state.mouseDeltaY = 0;
  }
}
