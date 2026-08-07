// @ts-nocheck
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  horn: boolean;
  cameraToggle: boolean;
  pause: boolean;
  restart: boolean;
}

export interface TouchState {
  joystickX: number;
  joystickY: number;
  steering: number;
  throttle: boolean;
  brake: boolean;
}

export class InputManager {
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    horn: false,
    cameraToggle: false,
    pause: false,
    restart: false
  };

  public touch: TouchState = {
    joystickX: 0,
    joystickY: 0,
    steering: 0,
    throttle: false,
    brake: false
  };

  private keys = new Set<string>();
  private gamepadIndex: number | null = null;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundGamepadConnected: (e: GamepadEvent) => void;
  private boundGamepadDisconnected: (e: GamepadEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundGamepadConnected = this.onGamepadConnected.bind(this);
    this.boundGamepadDisconnected = this.onGamepadDisconnected.bind(this);

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('gamepadconnected', this.boundGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.boundGamepadDisconnected);
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
    this.updateState();

    if (e.code === 'KeyH') this.state.horn = true;
    if (e.code === 'KeyC') this.state.cameraToggle = true;
    if (e.code === 'Escape') this.state.pause = true;
    if (e.code === 'KeyR') this.state.restart = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
    this.updateState();

    if (e.code === 'KeyH') this.state.horn = false;
    if (e.code === 'KeyC') this.state.cameraToggle = false;
    if (e.code === 'Escape') this.state.pause = false;
    if (e.code === 'KeyR') this.state.restart = false;
  }

  private onGamepadConnected(e: GamepadEvent): void {
    this.gamepadIndex = e.gamepad.index;
    console.log(`[Input] Gamepad connected: ${e.gamepad.id}`);
  }

  private onGamepadDisconnected(e: GamepadEvent): void {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
    }
  }

  private updateState(): void {
    this.state.forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    this.state.backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    this.state.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    this.state.right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    this.state.brake = this.keys.has('Space');
  }

  update(): void {
    // Gamepad polling
    if (this.gamepadIndex !== null) {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[this.gamepadIndex];
      if (gp) {
        // Left stick for steering
        this.touch.steering = Math.abs(gp.axes[0]) > 0.1 ? gp.axes[0] : 0;
        // Triggers for throttle/brake
        this.touch.throttle = gp.buttons[7]?.pressed ?? false; // RT
        this.touch.brake = gp.buttons[6]?.pressed ?? false; // LT
        // D-pad / buttons
        if (gp.buttons[0]?.pressed) this.state.forward = true; // A
        if (gp.buttons[1]?.pressed) this.state.brake = true; // B
        if (gp.buttons[3]?.pressed) this.state.horn = true; // Y
      }
    }
  }

  isPressed(action: keyof InputState): boolean {
    return this.state[action];
  }

  consume(action: keyof InputState): boolean {
    if (this.state[action]) {
      this.state[action] = false;
      return true;
    }
    return false;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('gamepadconnected', this.boundGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.boundGamepadDisconnected);
  }
}
