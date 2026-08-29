// @ts-nocheck
// Pacejka Magic Formula 5.2 Tire Model & Dual-Track Dynamic Physics Engine
// Migrated & Enhanced for high-fidelity vehicle dynamics

export interface TireParams {
  B: number;  // stiffness factor
  C: number;  // shape factor
  D: number;  // peak value (friction coefficient)
  E: number;  // curvature factor
}

export interface SurfaceCoefficients {
  dry_asphalt: TireParams;
  wet_asphalt: TireParams;
  gravel: TireParams;
}

export interface VehicleStats {
  mass: number;           // kg
  maxPower: number;       // watts
  maxBrakeForce: number;  // N
  maxSteerAngle: number;  // radians
  wheelBase: number;      // m
  trackWidth: number;     // m
  cgHeight: number;       // m
  frontWeightDist: number;// 0 to 1 (fraction on front axle)
  dragCoeff: number;
  rollResist: number;
  tire: TireParams;
}

export const VEHICLE_STATS: Record<string, VehicleStats> = {
  bike: {
    mass: 200, maxPower: 30000, maxBrakeForce: 1500,
    maxSteerAngle: 0.6, wheelBase: 1.4, trackWidth: 0.3,
    cgHeight: 0.6, frontWeightDist: 0.50,
    dragCoeff: 0.7, rollResist: 0.015,
    tire: { B: 10, C: 1.9, D: 1.0, E: 0.97 }
  },
  car: {
    mass: 1400, maxPower: 110000, maxBrakeForce: 8500,
    maxSteerAngle: 0.5, wheelBase: 2.7, trackWidth: 1.5,
    cgHeight: 0.55, frontWeightDist: 0.58,
    dragCoeff: 0.32, rollResist: 0.012,
    tire: { B: 10, C: 1.9, D: 1.0, E: 0.97 }
  },
  bus: {
    mass: 10000, maxPower: 220000, maxBrakeForce: 30000,
    maxSteerAngle: 0.35, wheelBase: 5.5, trackWidth: 2.0,
    cgHeight: 1.6, frontWeightDist: 0.52,
    dragCoeff: 0.6, rollResist: 0.008,
    tire: { B: 8, C: 1.8, D: 0.85, E: 0.95 }
  },
  truck: {
    mass: 12000, maxPower: 260000, maxBrakeForce: 35000,
    maxSteerAngle: 0.4, wheelBase: 4.5, trackWidth: 2.0,
    cgHeight: 1.8, frontWeightDist: 0.50,
    dragCoeff: 0.55, rollResist: 0.01,
    tire: { B: 9, C: 1.85, D: 0.9, E: 0.96 }
  },
  auto: {
    mass: 450, maxPower: 22000, maxBrakeForce: 3500,
    maxSteerAngle: 0.55, wheelBase: 2.0, trackWidth: 1.2,
    cgHeight: 0.65, frontWeightDist: 0.62,
    dragCoeff: 0.42, rollResist: 0.013,
    tire: { B: 10, C: 1.9, D: 0.95, E: 0.97 }
  },
  lambo: {
    mass: 1550, maxPower: 450000, maxBrakeForce: 14000,
    maxSteerAngle: 0.45, wheelBase: 2.6, trackWidth: 1.65,
    cgHeight: 0.42, frontWeightDist: 0.43,
    dragCoeff: 0.30, rollResist: 0.01,
    tire: { B: 12, C: 2.0, D: 1.15, E: 0.98 }
  }
};

export const SURFACE_COEFFICIENTS: SurfaceCoefficients = {
  dry_asphalt: { B: 10, C: 1.9, D: 1.0, E: 0.97 },
  wet_asphalt: { B: 12, C: 2.3, D: 0.7, E: 1.0 },
  gravel: { B: 5, C: 2.0, D: 0.6, E: 0.95 }
};

export interface WheelLoads {
  FL: number;
  FR: number;
  RL: number;
  RR: number;
  frontTotal: number;
  rearTotal: number;
}

export interface SlipAngles {
  front: number;
  rear: number;
  alphaFL: number;
  alphaFR: number;
}

export interface AckermannAngles {
  inner: number;
  outer: number;
  average: number;
}

export class PacejkaModel {
  /**
   * Calculate lateral tire force using Pacejka Magic Formula
   * @param slipAngle - tire slip angle in radians
   * @param params - tire coefficients (B, C, D, E)
   * @param surface - surface type multiplier
   * @param normalForce - dynamic normal load on tire (N)
   * @returns lateral force in Newtons
   */
  static calculateLateralForce(
    slipAngle: number,
    params: TireParams,
    surface: keyof SurfaceCoefficients = 'dry_asphalt',
    normalForce: number = 3500
  ): number {
    const surfaceCoeff = SURFACE_COEFFICIENTS[surface] || SURFACE_COEFFICIENTS.dry_asphalt;
    const B = params.B * (surfaceCoeff.B / 10);
    const C = params.C;
    const mu = params.D * surfaceCoeff.D;
    const D = mu * normalForce;
    const E = params.E;

    // Magic Formula: F = D * sin(C * arctan(B * slip - E * (B * slip - arctan(B * slip))))
    const x = B * slipAngle;
    const force = D * Math.sin(C * Math.atan(x - E * (x - Math.atan(x))));
    return force;
  }

  /**
   * Calculate longitudinal tire force (drive/brake)
   * @param slipRatio - longitudinal slip ratio (-1 to 1)
   * @param params - tire coefficients
   * @param surface - surface type
   * @param normalForce - dynamic normal load on tire (N)
   * @returns longitudinal force in Newtons
   */
  static calculateLongitudinalForce(
    slipRatio: number,
    params: TireParams,
    surface: keyof SurfaceCoefficients = 'dry_asphalt',
    normalForce: number = 3500
  ): number {
    const surfaceCoeff = SURFACE_COEFFICIENTS[surface] || SURFACE_COEFFICIENTS.dry_asphalt;
    const B = params.B * 0.8 * (surfaceCoeff.B / 10);
    const C = params.C * 1.1;
    const mu = params.D * 1.15 * surfaceCoeff.D;
    const D = mu * normalForce;
    const E = params.E;

    const x = B * slipRatio;
    const force = D * Math.sin(C * Math.atan(x - E * (x - Math.atan(x))));
    return force;
  }

  /**
   * Combined slip model using friction ellipse approximation
   */
  static calculateCombinedForce(
    slipAngle: number,
    slipRatio: number,
    params: TireParams,
    surface: keyof SurfaceCoefficients = 'dry_asphalt',
    normalForce: number = 3500
  ): { lateral: number; longitudinal: number } {
    const lat = this.calculateLateralForce(slipAngle, params, surface, normalForce);
    const lon = this.calculateLongitudinalForce(slipRatio, params, surface, normalForce);

    const surfaceCoeff = SURFACE_COEFFICIENTS[surface] || SURFACE_COEFFICIENTS.dry_asphalt;
    const maxForce = params.D * surfaceCoeff.D * normalForce;
    const combined = Math.sqrt(lat * lat + lon * lon);
    if (combined > maxForce && combined > 1e-4) {
      const scale = maxForce / combined;
      return { lateral: lat * scale, longitudinal: lon * scale };
    }
    return { lateral: lat, longitudinal: lon };
  }

  /**
   * 4-Wheel Dynamic Weight Transfer Calculator
   */
  static calculateWeightTransfer(
    mass: number,
    ax: number, // longitudinal accel (m/s^2, positive = accelerating)
    ay: number, // lateral accel (m/s^2, positive = turning left)
    wheelbase: number = 2.7,
    trackWidth: number = 1.5,
    cgHeight: number = 0.55,
    frontWeightDist: number = 0.58
  ): WheelLoads {
    const g = 9.81;
    const totalWeight = mass * g;
    const lr = wheelbase * frontWeightDist;
    const lf = wheelbase - lr;

    const staticFront = totalWeight * (lr / wheelbase);
    const staticRear = totalWeight * (lf / wheelbase);

    // Longitudinal weight transfer (brake dive shifts load forward; acceleration shifts load rearward)
    const deltaLong = (mass * ax * cgHeight) / wheelbase;
    const frontTotal = Math.max(totalWeight * 0.1, Math.min(totalWeight * 0.85, staticFront - deltaLong));
    const rearTotal = Math.max(totalWeight * 0.1, Math.min(totalWeight * 0.85, staticRear + deltaLong));

    // Lateral weight transfer (roll load shift)
    const deltaLatFront = (frontTotal * Math.abs(ay) * cgHeight) / (trackWidth * g);
    const deltaLatRear = (rearTotal * Math.abs(ay) * cgHeight) / (trackWidth * g);
    const latSign = Math.sign(ay) || 0;

    const FL = Math.max(50, (frontTotal * 0.5) - (deltaLatFront * 0.5 * latSign));
    const FR = Math.max(50, (frontTotal * 0.5) + (deltaLatFront * 0.5 * latSign));
    const RL = Math.max(50, (rearTotal * 0.5) - (deltaLatRear * 0.5 * latSign));
    const RR = Math.max(50, (rearTotal * 0.5) + (deltaLatRear * 0.5 * latSign));

    return { FL, FR, RL, RR, frontTotal, rearTotal };
  }

  /**
   * Dynamic Slip Angle Calculation for front and rear axles
   */
  static calculateSlipAngles(
    vx: number,          // forward velocity (m/s)
    vy: number,          // lateral velocity (m/s)
    yawRate: number,     // dPsi/dt (rad/s)
    steerAngle: number,  // radians
    wheelbase: number = 2.7,
    frontWeightDist: number = 0.58
  ): SlipAngles {
    const lr = wheelbase * frontWeightDist;
    const lf = wheelbase - lr;
    const safeVx = Math.max(0.2, Math.abs(vx));

    // alpha_f = steer - arctan((vy + lf * yawRate) / vx)
    const frontLatVelocity = vy + (lf * yawRate);
    const rearLatVelocity = vy - (lr * yawRate);

    const alphaFront = steerAngle - Math.atan2(frontLatVelocity, safeVx);
    const alphaRear = -Math.atan2(rearLatVelocity, safeVx);

    return {
      front: alphaFront,
      rear: alphaRear,
      alphaFL: alphaFront,
      alphaFR: alphaFront
    };
  }

  /**
   * Ackermann Steering Geometry for inner & outer wheel turning
   */
  static calculateAckermannSteering(
    steerAngle: number,
    wheelbase: number = 2.7,
    trackWidth: number = 1.5
  ): AckermannAngles {
    if (Math.abs(steerAngle) < 0.001) {
      return { inner: steerAngle, outer: steerAngle, average: steerAngle };
    }
    const R = wheelbase / Math.tan(Math.abs(steerAngle));
    const inner = Math.atan(wheelbase / Math.max(0.5, R - trackWidth * 0.5)) * Math.sign(steerAngle);
    const outer = Math.atan(wheelbase / (R + trackWidth * 0.5)) * Math.sign(steerAngle);
    return {
      inner,
      outer,
      average: steerAngle
    };
  }

  /**
   * Anti-lock Braking System (ABS) Assist
   */
  static applyABS(
    requestedBrakeForce: number,
    slipRatio: number
  ): { brakeForce: number; absActive: boolean } {
    if (Math.abs(slipRatio) > 0.18) {
      // Modulate brake force to maintain peak grip near 15% slip
      return {
        brakeForce: requestedBrakeForce * 0.65,
        absActive: true
      };
    }
    return {
      brakeForce: requestedBrakeForce,
      absActive: false
    };
  }

  /**
   * Traction Control System (TCS) Assist
   */
  static applyTCS(
    requestedDriveForce: number,
    slipRatio: number
  ): { driveForce: number; tcsActive: boolean } {
    if (slipRatio > 0.22) {
      return {
        driveForce: requestedDriveForce * 0.55,
        tcsActive: true
      };
    }
    return {
      driveForce: requestedDriveForce,
      tcsActive: false
    };
  }

  /**
   * Powertrain RPM & Engine Torque Curve
   */
  static calculateEngineRPM(
    speedMs: number,
    gear: string = 'D',
    wheelRadius: number = 0.35,
    idleRPM: number = 850,
    maxRPM: number = 6500
  ): number {
    if (gear === 'P' || gear === 'N') return idleRPM;
    const gearRatios: Record<string, number> = { 'R': 3.2, '1': 3.5, '2': 2.1, '3': 1.4, '4': 1.0, '5': 0.8, 'D': 1.6 };
    const ratio = gearRatios[gear] || 1.5;
    const finalDrive = 3.8;
    const wheelRotRps = Math.abs(speedMs) / (2 * Math.PI * wheelRadius);
    const engineRPM = wheelRotRps * ratio * finalDrive * 60;
    return Math.min(maxRPM, Math.max(idleRPM, engineRPM));
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).PacejkaModel = PacejkaModel;
  (window as any).VEHICLE_STATS = VEHICLE_STATS;
  (window as any).SURFACE_COEFFICIENTS = SURFACE_COEFFICIENTS;
}
