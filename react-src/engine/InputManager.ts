/**
 * InputManager — Keyboard, mouse, and mobile touch input.
 * Ported from game_core.js lines 560-1089.
 */

export interface InputState {
  keys: Record<string, boolean>;
  camYaw: number;
  camPitch: number;
  isPointerLocked: boolean;
  isDraggingCamera: boolean;
  analogSteering: number;
  _isDraggingMobileLook: boolean;
  _mobileLookTouchId: number | null;
  _prevMobileLookX: number;
  _prevMobileLookY: number;
}

const CONTROL_IDS = [
  'steer-wheel-container', 'steer-wheel', 'mc-brake', 'mc-gas', 'mc-boost',
  'phone-gps-btn', 'phone-gps', 'tl', 'tr', 'tu', 'abb', 'abh',
  'btn-seatbelt', 'btn-mobile', 'virtual-joystick', 'joystick-knob',
];

function isControlElement(el: HTMLElement | null): boolean {
  if (!el) return false;
  for (const id of CONTROL_IDS) {
    const c = document.getElementById(id);
    if (c && (el === c || c.contains(el))) return true;
  }
  if (el.closest?.('#mobile-controls')) return true;
  if (el.closest?.('#hud')) return true;
  if (el.closest?.('#hudbar')) return true;
  if (el.closest?.('#civic-controls')) return true;
  return false;
}

export class InputManager {
  state: InputState;
  private _lastPointerUnlock = 0;
  private _isMobile: boolean;

  constructor() {
    this._isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.state = {
      keys: {},
      camYaw: 0,
      camPitch: 0,
      isPointerLocked: false,
      isDraggingCamera: false,
      analogSteering: 0,
      _isDraggingMobileLook: false,
      _mobileLookTouchId: null,
      _prevMobileLookX: 0,
      _prevMobileLookY: 0,
    };
  }

  /** Bind all event listeners. Call once at init. */
  bind(canvas: HTMLCanvasElement): void {
    this._bindKeyboard();
    this._bindPointerLock(canvas);
    this._bindMouseMove();
    this._bindLeftClickDrag(canvas);
    if (this._isMobile) {
      this._bindMobileCameraLook();
      this._bindSwipeTurn();
    }
  }

  /** Update per-frame (decay camera look when idle). */
  update(dt: number): void {
    this._decayCameraLook(dt);
  }

  /** Cleanup. */
  dispose(): void {
    // Listeners are bound to document/window — they'll be GC'd on page unload.
  }

  // ─── Keyboard ───

  private _bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.state.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.state.keys[e.key.toLowerCase()] = false;
    });
  }

  // ─── Pointer Lock (first-person toggle on canvas click) ───

  private _bindPointerLock(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('click', () => {
      // Guard: only lock if playing, not paused, and debounce 500ms
      if (this.state.isPointerLocked) return;
      if (Date.now() - this._lastPointerUnlock > 500) {
        try {
          const p = canvas.requestPointerLock();
          if (p && typeof (p as any).catch === 'function') (p as any).catch(() => {});
        } catch (_) { /* browser may not support pointer lock */ }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      if (!locked && this.state.isPointerLocked) {
        this._lastPointerUnlock = Date.now();
      }
      this.state.isPointerLocked = locked;
    });
  }

  // ─── Mouse Move (pointer-lock look + left-click drag orbit) ───

  private _bindMouseMove(): void {
    document.addEventListener('mousemove', (e) => {
      if (this.state.isPointerLocked) {
        this.state.camYaw -= e.movementX * 0.003;
        this.state.camPitch -= e.movementY * 0.003;
        this.state.camPitch = Math.max(-1.5, Math.min(1.5, this.state.camPitch));
      } else if (this.state.isDraggingCamera) {
        this.state.camYaw -= e.movementX * 0.004;
        this.state.camPitch -= e.movementY * 0.004;
        this.state.camPitch = Math.max(-1.0, Math.min(1.0, this.state.camPitch));
      }
    });
  }

  // ─── Left-click Drag for Third-Person Orbit (desktop only) ───

  private _bindLeftClickDrag(canvas: HTMLCanvasElement): void {
    if (this._isMobile) return;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.state.isDraggingCamera = true;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.state.isDraggingCamera = false;
    });
  }

  // ─── Mobile Camera Look (single-finger drag in non-control area) ───

  private _bindMobileCameraLook(): void {
    const LOOK_THRESHOLD = 10;
    let lookCandidateX = 0;
    let lookCandidateY = 0;

    document.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      if (isControlElement(t.target as HTMLElement)) return;
      lookCandidateX = t.clientX;
      lookCandidateY = t.clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (this.state._isDraggingMobileLook) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.state._mobileLookTouchId) {
            const dx = e.touches[i].clientX - this.state._prevMobileLookX;
            const dy = e.touches[i].clientY - this.state._prevMobileLookY;
            this.state._prevMobileLookX = e.touches[i].clientX;
            this.state._prevMobileLookY = e.touches[i].clientY;
            this.state.camYaw -= dx * 0.005;
            this.state.camPitch -= dy * 0.005;
            this.state.camPitch = Math.max(-1.2, Math.min(1.2, this.state.camPitch));
            e.preventDefault();
            return;
          }
        }
      } else {
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i];
          if (Math.abs(t.clientX - lookCandidateX) > LOOK_THRESHOLD ||
              Math.abs(t.clientY - lookCandidateY) > LOOK_THRESHOLD) {
            if (!isControlElement(t.target as HTMLElement)) {
              this.state._isDraggingMobileLook = true;
              this.state._mobileLookTouchId = t.identifier;
              this.state._prevMobileLookX = t.clientX;
              this.state._prevMobileLookY = t.clientY;
              e.preventDefault();
              return;
            }
          }
        }
      }
    }, { passive: false });

    const endLook = (e: TouchEvent) => {
      if (!this.state._isDraggingMobileLook) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.state._mobileLookTouchId) {
          this.state._isDraggingMobileLook = false;
          this.state._mobileLookTouchId = null;
          return;
        }
      }
    };
    document.addEventListener('touchend', endLook, { passive: true });
    document.addEventListener('touchcancel', () => {
      this.state._isDraggingMobileLook = false;
      this.state._mobileLookTouchId = null;
    }, { passive: true });
  }

  // ─── Swipe to Turn (pedestrian / stationary) ───

  private _bindSwipeTurn(): void {
    const SWIPE_THRESHOLD = 20;
    let touchStartX = 0;
    let touchStartY = 0;
    let swipeTouchId: number | null = null;

    document.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (isControlElement(t.target as HTMLElement)) continue;
        if (swipeTouchId !== null) continue;
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        swipeTouchId = t.identifier;
        break;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (swipeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== swipeTouchId) continue;
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
          // Emit a synthetic rotation event — the caller can read state.camYaw
          const angle = Math.atan2(dx, -dy);
          // Store the swipe direction so the movement system can use it
          (this.state as any)._swipeRotation = angle;
          touchStartX = t.clientX;
          touchStartY = t.clientY;
        }
        break;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === swipeTouchId) {
          swipeTouchId = null;
          (this.state as any)._swipeRotation = null;
          break;
        }
      }
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
      swipeTouchId = null;
      (this.state as any)._swipeRotation = null;
    }, { passive: true });
  }

  // ─── Camera Look Decay ───

  private _decayCameraLook(dt: number): void {
    if (this.state._isDraggingMobileLook) return;
    if (this.state.isPointerLocked || this.state.isDraggingCamera) return;
    const decayRate = 4;
    const threshold = 0.005;
    if (Math.abs(this.state.camYaw) > threshold || Math.abs(this.state.camPitch) > threshold) {
      const factor = Math.max(0, 1 - decayRate * dt);
      this.state.camYaw *= factor;
      this.state.camPitch *= factor;
      if (Math.abs(this.state.camYaw) < threshold) this.state.camYaw = 0;
      if (Math.abs(this.state.camPitch) < threshold) this.state.camPitch = 0;
    } else {
      this.state.camYaw = 0;
      this.state.camPitch = 0;
    }
  }
}
