import { VehicleStats, VehicleType, InputState } from '../types';

export const VEHICLE_PRESETS: Record<VehicleType, VehicleStats> = {
  sports_gt: {
    maxSpd: 1.05,
    accel: 0.058,
    turn: 0.040,
    fric: 0.952,
    mass: 1420,
    wheelbase: 2.7,
    halfW: 0.96,
    halfD: 2.15,
    halfH: 0.62,
    cgHeight: 0.40
  },
  supercar: {
    maxSpd: 1.25,
    accel: 0.072,
    turn: 0.044,
    fric: 0.956,
    mass: 1310,
    wheelbase: 2.65,
    halfW: 1.0,
    halfD: 2.2,
    halfH: 0.58,
    cgHeight: 0.36
  },
  car: {
    maxSpd: 0.75,
    accel: 0.040,
    turn: 0.035,
    fric: 0.942,
    mass: 1380,
    wheelbase: 2.6,
    halfW: 0.86,
    halfD: 2.0,
    halfH: 0.72,
    cgHeight: 0.52
  },
  taxi: {
    maxSpd: 0.70,
    accel: 0.036,
    turn: 0.035,
    fric: 0.940,
    mass: 1300,
    wheelbase: 2.5,
    halfW: 0.82,
    halfD: 1.95,
    halfH: 0.72,
    cgHeight: 0.52
  },
  suv: {
    maxSpd: 0.78,
    accel: 0.038,
    turn: 0.032,
    fric: 0.938,
    mass: 1850,
    wheelbase: 2.85,
    halfW: 0.98,
    halfD: 2.3,
    halfH: 0.88,
    cgHeight: 0.68
  },
  sedan_sports: {
    maxSpd: 0.92,
    accel: 0.048,
    turn: 0.038,
    fric: 0.948,
    mass: 1520,
    wheelbase: 2.78,
    halfW: 0.92,
    halfD: 2.2,
    halfH: 0.70,
    cgHeight: 0.48
  },
  auto: {
    maxSpd: 0.50,
    accel: 0.028,
    turn: 0.046,
    fric: 0.920,
    mass: 420,
    wheelbase: 1.9,
    halfW: 0.70,
    halfD: 1.35,
    halfH: 0.85,
    cgHeight: 0.58
  },
  bus: {
    maxSpd: 0.54,
    accel: 0.022,
    turn: 0.020,
    fric: 0.910,
    mass: 9800,
    wheelbase: 5.8,
    halfW: 1.35,
    halfD: 4.8,
    halfH: 1.6,
    cgHeight: 1.1
  },
  truck: {
    maxSpd: 0.50,
    accel: 0.020,
    turn: 0.018,
    fric: 0.905,
    mass: 11500,
    wheelbase: 5.2,
    halfW: 1.30,
    halfD: 4.5,
    halfH: 1.5,
    cgHeight: 1.05
  },
  bike: {
    maxSpd: 0.75,
    accel: 0.060,
    turn: 0.050,
    fric: 0.938,
    mass: 160,
    wheelbase: 1.4,
    halfW: 0.40,
    halfD: 0.95,
    halfH: 0.65,
    cgHeight: 0.55
  },
  pedestrian: {
    maxSpd: 0.14,
    accel: 0.065,
    turn: 0.055,
    fric: 0.880,
    mass: 75,
    wheelbase: 0.5,
    halfW: 0.35,
    halfD: 0.35,
    halfH: 0.90,
    cgHeight: 0.90
  }
};

export class VehiclePhysics {
  stats: VehicleStats;
  speed = 0;
  steerAngle = 0;
  yawRate = 0;
  lateralG = 0;
  rpm = 1000;
  maxRpm = 8200;
  gearNumber = 1;
  nitroRemaining = 100;

  private gearRatios = [3.82, 2.36, 1.68, 1.31, 1.00, 0.79];

  constructor(type: VehicleType = 'sports_gt') {
    this.stats = { ...(VEHICLE_PRESETS[type] || VEHICLE_PRESETS.sports_gt) };
  }

  setVehicleType(type: VehicleType) {
    this.stats = { ...(VEHICLE_PRESETS[type] || VEHICLE_PRESETS.sports_gt) };
  }

  update(dt: number, input: InputState, heading: number): { x: number; z: number; heading: number } {
    const isRev = input.gear === 'R';
    let isBoosting = false;

    // Nitro boost logic with reservoir depletion
    if (input.boost && this.nitroRemaining > 0 && input.throttle > 0) {
      isBoosting = true;
      this.nitroRemaining = Math.max(0, this.nitroRemaining - dt * 25);
    } else if (this.nitroRemaining < 100) {
      this.nitroRemaining = Math.min(100, this.nitroRemaining + dt * 6);
    }

    const mult = isBoosting ? 1.65 : 1.0;

    // Acceleration & Braking
    if (input.throttle > 0 && input.gear !== 'P' && input.gear !== 'N') {
      this.speed += this.stats.accel * mult * input.throttle * dt * 60 * (isRev ? -0.5 : 1.0);
    }
    if (input.brake > 0) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.stats.accel * 2.0 * input.brake * dt * 60);
      } else if (isRev && this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.stats.accel * 2.0 * input.brake * dt * 60);
      }
    }
    if (input.handbrake) {
      this.speed *= Math.pow(0.82, dt * 60);
    }

    // Top speed clamp
    const topCap = this.stats.maxSpd * mult;
    this.speed = Math.max(-topCap * 0.45, Math.min(topCap, this.speed));

    // Rolling friction
    this.speed *= Math.pow(this.stats.fric, dt * 60);
    if (Math.abs(this.speed) < 0.001 && input.throttle === 0 && input.brake === 0) {
      this.speed = 0;
    }

    // Dynamic Gear Selection & RPM calculation
    const speedKmh = Math.abs(this.speed) * 140;
    if (isRev) {
      this.gearNumber = 1;
      this.rpm = 1000 + Math.min(6500, speedKmh * 80);
    } else if (input.gear === 'N' || input.gear === 'P') {
      this.gearNumber = 0;
      this.rpm = input.throttle > 0 ? Math.min(7500, this.rpm + dt * 9000) : Math.max(1000, this.rpm - dt * 5000);
    } else {
      if (speedKmh < 35) this.gearNumber = 1;
      else if (speedKmh < 65) this.gearNumber = 2;
      else if (speedKmh < 105) this.gearNumber = 3;
      else if (speedKmh < 145) this.gearNumber = 4;
      else if (speedKmh < 190) this.gearNumber = 5;
      else this.gearNumber = 6;

      const currentRatio = this.gearRatios[this.gearNumber - 1];
      const targetRpm = 1100 + (speedKmh * currentRatio * 18) + (input.throttle * 900);
      this.rpm += (Math.min(this.maxRpm, targetRpm) - this.rpm) * Math.min(1.0, dt * 14);
    }

    // Steering & Yaw Integration
    const targetSteer = input.steer * this.stats.turn;
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, dt * 12);
    
    const steerSens = Math.min(1.0, Math.abs(this.speed) * 4.2);
    this.yawRate = this.steerAngle * (this.speed >= 0 ? 1 : -1) * steerSens;
    const newHeading = heading + this.yawRate * dt * 60;

    // Lateral G-Force calculation
    this.lateralG = Math.abs(this.speed * this.yawRate * 9.8);

    // Position delta
    const dx = Math.sin(newHeading) * this.speed * dt * 60;
    const dz = Math.cos(newHeading) * this.speed * dt * 60;

    return { x: dx, z: dz, heading: newHeading };
  }
}
