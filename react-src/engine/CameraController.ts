/**
 * CameraController — First-person pointer lock + third-person chase cam.
 * Ported from game_core.js _ucam() (lines 5829-5928) and _initMobileCameraLook() (lines 870-939).
 */

import * as THREE from 'three';
import type { InputManager } from './InputManager';

export class CameraController {
  camera: THREE.PerspectiveCamera;
  private _isPedestrian = false;
  private _speed = 0;
  private _maxSpd = 1.1;
  private _boosting = false;
  private _camTransition = 0;
  private _camSnapped = false;
  private _camShakeAmt = 0;
  private _camTilt = 0;
  private _camTarget = new THREE.Vector3();
  private _e1 = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /** Set pedestrian mode flag. */
  setPedestrian(isPed: boolean): void {
    if (isPed !== this._isPedestrian) {
      this._camSnapped = false;
      this._camTransition = 0.4;
      this._isPedestrian = isPed;
    }
  }

  /** Update per-frame physics state from game engine. */
  setPhysicsState(speed: number, maxSpd: number, boosting: boolean): void {
    this._speed = speed;
    this._maxSpd = maxSpd;
    this._boosting = boosting;
  }

  /** Trigger camera shake (e.g., on collision). */
  shake(amount: number): void {
    this._camShakeAmt = amount;
  }

  /** Main camera update — call every frame. */
  update(dt: number, playerPosition: THREE.Vector3, playerRotationY: number, input: InputManager): void {
    const camYaw = input.state.camYaw;
    const camPitch = input.state.camPitch;

    if (input.state.isPointerLocked) {
      this._updateFirstPerson(playerPosition, playerRotationY, camYaw, camPitch);
    } else {
      this._updateThirdPerson(dt, playerPosition, playerRotationY, camYaw, camPitch);
    }
  }

  // ─── First-Person Mode (pointer locked) ───

  private _updateFirstPerson(
    pos: THREE.Vector3,
    rotY: number,
    camYaw: number,
    camPitch: number
  ): void {
    const headHeight = this._isPedestrian ? 1.6 : 1.2;
    const forwardOffset = this._isPedestrian ? 0 : 0.5;
    const yaw = rotY + camYaw;

    this.camera.position.set(
      pos.x + Math.sin(rotY) * forwardOffset,
      pos.y + headHeight,
      pos.z + Math.cos(rotY) * forwardOffset
    );

    const lx = Math.sin(yaw) * Math.cos(camPitch);
    const ly = Math.sin(camPitch);
    const lz = Math.cos(yaw) * Math.cos(camPitch);

    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(
      this.camera.position.x + lx,
      this.camera.position.y + ly,
      this.camera.position.z + lz
    );
  }

  // ─── Third-Person Chase Cam ───

  private _updateThirdPerson(
    dt: number,
    pos: THREE.Vector3,
    rotY: number,
    camYaw: number,
    camPitch: number
  ): void {
    const camDist = this._isPedestrian ? 4 : 12;
    const camHeight = this._isPedestrian ? 2.5 : 4.5;
    const yaw = rotY + camYaw;
    const lookAhead = this._isPedestrian ? 0 : Math.min(Math.abs(this._speed) * 5, 3.5);
    const pitchOffset = camPitch * 2;

    this._camTarget.set(
      pos.x - Math.sin(yaw) * camDist + Math.sin(yaw) * lookAhead,
      camHeight - pitchOffset,
      pos.z - Math.cos(yaw) * camDist + Math.cos(yaw) * lookAhead
    );

    if (!this._camSnapped) {
      this._camSnapped = true;
      this.camera.position.copy(this._camTarget);
    }

    const transT = this._camTransition;
    if (transT > 0) this._camTransition = Math.max(0, transT - dt);
    const baseLerp = Math.min(1, dt * 6);
    const camLerp = transT > 0 ? Math.min(1, dt * 3) : baseLerp;
    this.camera.position.lerp(this._camTarget, camLerp);

    // Camera shake
    let shakeX = 0;
    let shakeY = 0;
    if (this._camShakeAmt > 0.001) {
      shakeX = (Math.random() - 0.5) * this._camShakeAmt;
      shakeY = (Math.random() - 0.5) * this._camShakeAmt;
      this._camShakeAmt *= Math.pow(0.04, dt);
    }

    const lookAheadDist = this._isPedestrian ? 3 : 7;
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(
      pos.x + Math.sin(yaw) * lookAheadDist + shakeX,
      1.5 - pitchOffset * 0.3 + shakeY,
      pos.z + Math.cos(yaw) * lookAheadDist
    );

    // Debug flip detection
    this._e1.setFromQuaternion(this.camera.quaternion, 'YXZ');
    if (Math.abs(this._e1.z) > 0.15) {
      console.warn('[CAM-FLIP] Euler (YXZ):', {
        x: this._e1.x.toFixed(3),
        y: this._e1.y.toFixed(3),
        z: this._e1.z.toFixed(3),
      });
    }

    // Speed-based FOV
    if (!this._isPedestrian && this.camera.fov !== undefined) {
      const speedRatio = Math.min(Math.abs(this._speed) / (this._maxSpd || 1.1), 1);
      const targetFov = 60 + speedRatio * 15 + (this._boosting ? 5 : 0);
      if (Math.abs(this.camera.fov - targetFov) > 0.15) {
        this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
        this.camera.updateProjectionMatrix();
      }
    }
  }
}
