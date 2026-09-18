export interface PacejkaCoeffs {
  B: number; // Stiffness factor
  C: number; // Shape factor
  D: number; // Peak value
  E: number; // Curvature factor
}

export class PacejkaTireModel {
  // Default dry asphalt coefficients
  static readonly DRY_ASPHALT: PacejkaCoeffs = {
    B: 10.0,
    C: 1.65,
    D: 1.0,
    E: -0.5
  };

  // Wet monsoon asphalt coefficients
  static readonly WET_ASPHALT: PacejkaCoeffs = {
    B: 8.5,
    C: 1.45,
    D: 0.65,
    E: -0.3
  };

  /**
   * Calculates lateral tire force Fy given normal load Fz and slip angle alpha (radians)
   */
  static computeLateralForce(alpha: number, Fz: number, coeffs: PacejkaCoeffs = this.DRY_ASPHALT): number {
    const { B, C, D, E } = coeffs;
    const peak = D * Fz;
    const phi = B * alpha;
    const force = peak * Math.sin(C * Math.atan(phi - E * (phi - Math.atan(phi))));
    return isNaN(force) ? 0 : force;
  }
}
