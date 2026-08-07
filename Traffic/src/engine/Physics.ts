// @ts-nocheck
// Pacejka Magic Formula 5.2 Tire Model
// Migrated from game_core.js — DO NOT TUNE without test data

export interface TireParams {
  B: number;  // stiffness factor
  C: number;  // shape factor
  D: number;  // peak value
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
  dragCoeff: number;
  rollResist: number;
  tire: TireParams;
}

export const VEHICLE_STATS: Record<string, VehicleStats> = {
  bike: {
    mass: 200, maxPower: 30000, maxBrakeForce: 1500,
    maxSteerAngle: 0.6, wheelBase: 1.4, trackWidth: 0.3,
    dragCoeff: 0.7, rollResist: 0.015,
    tire: { B: 10, C: 1.9, D: 1.0, E: 0.97 }
  },
  car: {
    mass: 1200, maxPower: 100000, maxBrakeForce: 8000,
    maxSteerAngle: 0.5, wheelBase: 2.7, trackWidth: 1.5,
    dragCoeff: 0.3, rollResist: 0.012,
    tire: { B: 10, C: 1.9, D: 1.0, E: 0.97 }
  },
  bus: {
    mass: 8000, maxPower: 200000, maxBrakeForce: 25000,
    maxSteerAngle: 0.35, wheelBase: 5.5, trackWidth: 2.0,
    dragCoeff: 0.6, rollResist: 0.008,
    tire: { B: 8, C: 1.8, D: 0.85, E: 0.95 }
  },
  truck: {
    mass: 5000, maxPower: 150000, maxBrakeForce: 18000,
    maxSteerAngle: 0.4, wheelBase: 4.0, trackWidth: 1.8,
    dragCoeff: 0.5, rollResist: 0.01,
    tire: { B: 9, C: 1.85, D: 0.9, E: 0.96 }
  },
  auto: {
    mass: 600, maxPower: 25000, maxBrakeForce: 4000,
    maxSteerAngle: 0.55, wheelBase: 2.0, trackWidth: 1.2,
    dragCoeff: 0.4, rollResist: 0.013,
    tire: { B: 10, C: 1.9, D: 0.95, E: 0.97 }
  },
  lambo: {
    mass: 1500, maxPower: 350000, maxBrakeForce: 12000,
    maxSteerAngle: 0.45, wheelBase: 2.6, trackWidth: 1.6,
    dragCoeff: 0.32, rollResist: 0.01,
    tire: { B: 12, C: 2.0, D: 1.1, E: 0.98 }
  }
};

export const SURFACE_COEFFICIENTS: SurfaceCoefficients = {
  dry_asphalt: { B: 10, C: 1.9, D: 1.0, E: 0.97 },
  wet_asphalt: { B: 12, C: 2.3, D: 0.7, E: 1.0 },
  gravel: { B: 5, C: 2.0, D: 0.6, E: 0.95 }
};

export class PacejkaModel {
  /**
   * Calculate lateral tire force using Pacejka Magic Formula
   * @param slipAngle - tire slip angle in radians
   * @param params - tire coefficients (B, C, D, E)
   * @param surface - surface type multiplier
   * @returns lateral force in Newtons
   */
  static calculateLateralForce(
    slipAngle: number,
    params: TireParams,
    surface: keyof SurfaceCoefficients = 'dry_asphalt'
  ): number {
    const surfaceCoeff = SURFACE_COEFFICIENTS[surface];
    const B = params.B * (surfaceCoeff.B / 10);
    const C = params.C;
    const D = params.D * surfaceCoeff.D;
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
   * @returns longitudinal force in Newtons
   */
  static calculateLongitudinalForce(
    slipRatio: number,
    params: TireParams,
    surface: keyof SurfaceCoefficients = 'dry_asphalt'
  ): number {
    const surfaceCoeff = SURFACE_COEFFICIENTS[surface];
    const B = params.B * 0.8 * (surfaceCoeff.B / 10);
    const C = params.C * 1.1;
    const D = params.D * 1.2 * surfaceCoeff.D;
    const E = params.E;

    const x = B * slipRatio;
    const force = D * Math.sin(C * Math.atan(x - E * (x - Math.atan(x))));
    return force;
  }

  /**
   * Combined slip model (friction ellipse)
   */
  static calculateCombinedForce(
    slipAngle: number,
    slipRatio: number,
    params: TireParams,
    surface: keyof SurfaceCoefficients = 'dry_asphalt'
  ): { lateral: number; longitudinal: number } {
    const lat = this.calculateLateralForce(slipAngle, params, surface);
    const lon = this.calculateLongitudinalForce(slipRatio, params, surface);

    // Friction ellipse: limit combined force
    const maxForce = params.D * SURFACE_COEFFICIENTS[surface].D;
    const combined = Math.sqrt(lat * lat + lon * lon);
    if (combined > maxForce) {
      const scale = maxForce / combined;
      return { lateral: lat * scale, longitudinal: lon * scale };
    }
    return { lateral: lat, longitudinal: lon };
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).PacejkaModel = PacejkaModel;
  (window as any).VEHICLE_STATS = VEHICLE_STATS;
  (window as any).SURFACE_COEFFICIENTS = SURFACE_COEFFICIENTS;
}
