import * as THREE from 'three';
import { CameraProfile, VehicleType, CameraMode } from '../types';

export const CAMERA_PROFILES: Record<VehicleType, CameraProfile> = {
  sports_gt: { dist: 8.5, height: 3.8, lookAhead: 12.0, targetY: 1.2, speedPullback: 2.2, reverseLift: 1.2, fov: 66 },
  supercar: { dist: 8.8, height: 3.6, lookAhead: 14.0, targetY: 1.1, speedPullback: 2.5, reverseLift: 1.2, fov: 68 },
  car: { dist: 8.8, height: 4.0, lookAhead: 11.0, targetY: 1.2, speedPullback: 2.0, reverseLift: 1.2, fov: 66 },
  taxi: { dist: 8.8, height: 4.0, lookAhead: 11.0, targetY: 1.2, speedPullback: 2.0, reverseLift: 1.2, fov: 66 },
  suv: { dist: 9.5, height: 4.4, lookAhead: 12.0, targetY: 1.4, speedPullback: 2.2, reverseLift: 1.4, fov: 65 },
  sedan_sports: { dist: 8.8, height: 3.9, lookAhead: 12.0, targetY: 1.2, speedPullback: 2.2, reverseLift: 1.2, fov: 66 },
  auto: { dist: 7.5, height: 3.6, lookAhead: 9.0, targetY: 1.2, speedPullback: 1.5, reverseLift: 1.0, fov: 66 },
  bus: { dist: 15.0, height: 6.2, lookAhead: 16.0, targetY: 2.2, speedPullback: 2.8, reverseLift: 2.0, fov: 62 },
  truck: { dist: 14.5, height: 5.8, lookAhead: 15.0, targetY: 2.0, speedPullback: 2.5, reverseLift: 2.0, fov: 62 },
  bike: { dist: 6.8, height: 3.2, lookAhead: 10.0, targetY: 1.1, speedPullback: 1.8, reverseLift: 0.8, fov: 68 },
  pedestrian: { dist: 5.2, height: 2.4, lookAhead: 6.0, targetY: 1.4, speedPullback: 0.8, reverseLift: 0.6, fov: 70 }
};

export class CameraController {
  camera: THREE.PerspectiveCamera;
  profile: CameraProfile;
  mode: CameraMode = 'chase_close';
  camYaw = 0;
  targetYaw = 0;

  private currentPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, type: VehicleType = 'sports_gt') {
    this.camera = camera;
    this.profile = { ...(CAMERA_PROFILES[type] || CAMERA_PROFILES.sports_gt) };
    this.camera.fov = this.profile.fov;
    this.camera.updateProjectionMatrix();
  }

  setVehicleType(type: VehicleType) {
    this.profile = { ...(CAMERA_PROFILES[type] || CAMERA_PROFILES.sports_gt) };
  }

  setCameraMode(mode: CameraMode) {
    this.mode = mode;
  }

  cycleCameraMode(): CameraMode {
    const modes: CameraMode[] = ['chase_close', 'chase_far', 'hood', 'bumper'];
    const nextIdx = (modes.indexOf(this.mode) + 1) % modes.length;
    this.mode = modes[nextIdx];
    return this.mode;
  }

  handleMouseDelta(dx: number) {
    // Unlimited 360-degree horizontal rotation locked strictly to Y axis
    this.targetYaw -= dx * 0.0032;
  }

  update(dt: number, targetPos: THREE.Vector3, targetHeading: number, speed: number, isReverse: boolean) {
    // Smooth yaw lerp
    this.camYaw += (this.targetYaw - this.camYaw) * Math.min(1.0, dt * 12);

    const speedRatio = Math.min(1.0, Math.abs(speed) / 0.8);
    const effectiveYaw = targetHeading + this.camYaw;
    const revOffset = isReverse ? Math.PI : 0;
    const finalYaw = effectiveYaw + revOffset;

    let targetX = 0, targetY = 0, targetZ = 0;
    let lookX = 0, lookY = 0, lookZ = 0;
    let targetFov = this.profile.fov;

    switch (this.mode) {
      case 'chase_far': {
        const d = this.profile.dist * 1.5 + speedRatio * 3.0;
        targetX = targetPos.x - Math.sin(finalYaw) * d;
        targetZ = targetPos.z - Math.cos(finalYaw) * d;
        targetY = targetPos.y + this.profile.height * 1.6;
        lookX = targetPos.x + Math.sin(effectiveYaw) * 16;
        lookZ = targetPos.z + Math.cos(effectiveYaw) * 16;
        lookY = targetPos.y + 1.5;
        targetFov = this.profile.fov + 4;
        break;
      }

      case 'hood': {
        targetX = targetPos.x + Math.sin(targetHeading) * 1.1;
        targetZ = targetPos.z + Math.cos(targetHeading) * 1.1;
        targetY = targetPos.y + 1.25;
        lookX = targetPos.x + Math.sin(effectiveYaw) * 25;
        lookZ = targetPos.z + Math.cos(effectiveYaw) * 25;
        lookY = targetPos.y + 1.15;
        targetFov = 74;
        break;
      }

      case 'bumper': {
        targetX = targetPos.x + Math.sin(targetHeading) * 2.1;
        targetZ = targetPos.z + Math.cos(targetHeading) * 2.1;
        targetY = targetPos.y + 0.45;
        lookX = targetPos.x + Math.sin(effectiveYaw) * 30;
        lookZ = targetPos.z + Math.cos(effectiveYaw) * 30;
        lookY = targetPos.y + 0.50;
        targetFov = 80;
        break;
      }

      case 'chase_close':
      default: {
        const dynamicDist = this.profile.dist + speedRatio * this.profile.speedPullback;
        targetX = targetPos.x - Math.sin(finalYaw) * dynamicDist;
        targetZ = targetPos.z - Math.cos(finalYaw) * dynamicDist;
        targetY = Math.max(1.3, targetPos.y + this.profile.height + (isReverse ? this.profile.reverseLift : 0));
        lookX = targetPos.x + Math.sin(effectiveYaw) * this.profile.lookAhead;
        lookZ = targetPos.z + Math.cos(effectiveYaw) * this.profile.lookAhead;
        lookY = targetPos.y + this.profile.targetY;
        targetFov = this.profile.fov + speedRatio * 8.0;
        break;
      }
    }

    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 5);
      this.camera.updateProjectionMatrix();
    }

    // Smooth position interpolation
    this.currentPos.x += (targetX - this.currentPos.x) * Math.min(1.0, dt * 12);
    this.currentPos.y += (targetY - this.currentPos.y) * Math.min(1.0, dt * 12);
    this.currentPos.z += (targetZ - this.currentPos.z) * Math.min(1.0, dt * 12);
    this.camera.position.copy(this.currentPos);

    // Look-at interpolation
    this.currentLookAt.x += (lookX - this.currentLookAt.x) * Math.min(1.0, dt * 16);
    this.currentLookAt.y += (lookY - this.currentLookAt.y) * Math.min(1.0, dt * 16);
    this.currentLookAt.z += (lookZ - this.currentLookAt.z) * Math.min(1.0, dt * 16);
    this.camera.lookAt(this.currentLookAt);
  }
}
