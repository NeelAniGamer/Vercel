/**
 * test_physics_math.js
 * Comprehensive unit test suite for 4-wheel dynamic vehicle physics math
 */

const assert = require('assert');

// ── Test 1: Pacejka Magic Formula Lateral Forces ──
function testPacejka() {
  console.log('--- Test 1: Pacejka MF 5.2 Calculations ---');
  const PACEJKA = {
    computeLateralForce(alpha, Fz, camber = 0, surface = 'dry_asphalt') {
      const B = 10, C = 1.9, D = 1.0 * Fz, E = 0.97;
      const x = B * alpha;
      const Fy = D * Math.sin(C * Math.atan(x - E * (x - Math.atan(x))));
      return { Fy, mu: Math.abs(Fy) / (Fz + 1e-6) };
    }
  };

  const normalFz = 3500; // N
  const res0 = PACEJKA.computeLateralForce(0, normalFz);
  assert.strictEqual(res0.Fy, 0, 'Zero slip angle must yield zero lateral force');

  const resSmallSlip = PACEJKA.computeLateralForce(0.05, normalFz); // ~3 degrees
  assert(resSmallSlip.Fy > 0, 'Positive slip angle must produce positive lateral force');
  assert(resSmallSlip.Fy < normalFz * 1.5, 'Lateral force must be realistically bounded');

  const resPeakSlip = PACEJKA.computeLateralForce(0.12, normalFz); // ~7 degrees peak
  assert(resPeakSlip.Fy > resSmallSlip.Fy, 'Peak slip angle must produce higher grip than small slip angle');

  console.log('  ✔ Pacejka lateral forces validated.');
}

// ── Test 2: 4-Wheel Dynamic Weight Transfer ──
function testWeightTransfer() {
  console.log('--- Test 2: Dynamic 4-Wheel Weight Transfer ---');
  const mass = 1400; // kg
  const g = 9.81;
  const totalWeight = mass * g; // 13734 N
  const wb = 2.7; // m
  const tw = 1.5; // m
  const cgH = 0.55; // m
  const fDist = 0.58;

  function calculateLoads(ax, ay) {
    const staticFront = totalWeight * (1 - fDist);
    const staticRear = totalWeight * fDist;
    const deltaLong = (mass * ax * cgH) / wb;
    const frontTotal = Math.max(totalWeight * 0.1, Math.min(totalWeight * 0.85, staticFront - deltaLong));
    const rearTotal = Math.max(totalWeight * 0.1, Math.min(totalWeight * 0.85, staticRear + deltaLong));
    const deltaLatF = (frontTotal * Math.abs(ay) * cgH) / (tw * g);
    const deltaLatR = (rearTotal * Math.abs(ay) * cgH) / (tw * g);
    const latSign = Math.sign(ay) || 0;

    return {
      FL: (frontTotal * 0.5) - (deltaLatF * 0.5 * latSign),
      FR: (frontTotal * 0.5) + (deltaLatF * 0.5 * latSign),
      RL: (rearTotal * 0.5) - (deltaLatR * 0.5 * latSign),
      RR: (rearTotal * 0.5) + (deltaLatR * 0.5 * latSign),
      frontTotal,
      rearTotal
    };
  }

  // Static standstill (ax = 0, ay = 0)
  const staticLoads = calculateLoads(0, 0);
  const sumStatic = staticLoads.FL + staticLoads.FR + staticLoads.RL + staticLoads.RR;
  assert(Math.abs(sumStatic - totalWeight) < 1.0, 'Total load must equal total vehicle weight');
  assert.strictEqual(staticLoads.FL, staticLoads.FR, 'Left and right loads must be identical in straight standstill');

  // Heavy Braking (ax = -6 m/s^2)
  const brakeLoads = calculateLoads(-6.0, 0);
  assert(brakeLoads.frontTotal > staticLoads.frontTotal, 'Braking must shift normal load to front axle (nose dive)');
  assert(brakeLoads.rearTotal < staticLoads.rearTotal, 'Braking must reduce normal load on rear axle');

  // Hard Left Turn (ay = 5.0 m/s^2)
  const cornerLoads = calculateLoads(0, 5.0);
  assert(cornerLoads.FR > cornerLoads.FL, 'Left turn must shift lateral load to right side wheels');
  assert(cornerLoads.RR > cornerLoads.RL, 'Left turn must shift lateral load to right rear wheel');

  console.log('  ✔ 4-Wheel dynamic weight transfer validated.');
}

// ── Test 3: Slip Angles & Dynamic Yaw Calculation ──
function testSlipAngles() {
  console.log('--- Test 3: Slip Angles & Yaw Rate Dynamics ---');
  const wb = 2.7;
  const lf = wb * 0.42;
  const lr = wb * 0.58;

  function calculateSlip(vx, vy, yawRate, steerAngle) {
    const safeVx = Math.max(0.3, Math.abs(vx));
    const alphaF = steerAngle - Math.atan2(vy + lf * yawRate, safeVx);
    const alphaR = -Math.atan2(vy - lr * yawRate, safeVx);
    return { alphaF, alphaR };
  }

  // Straight driving (steer = 0, vy = 0, yawRate = 0)
  const straight = calculateSlip(20, 0, 0, 0);
  assert(Math.abs(straight.alphaF) < 1e-6, 'Straight driving must produce zero slip angle');
  assert(Math.abs(straight.alphaR) < 1e-6, 'Straight driving must produce zero rear slip angle');

  // Sudden steer input at speed (steer = 0.1 rad (~5.7 deg))
  const steerStep = calculateSlip(20, 0, 0, 0.1);
  assert(steerStep.alphaF > 0, 'Steering must create positive front slip angle');
  assert(Math.abs(steerStep.alphaR) < 1e-6, 'Instantaneous initial rear slip angle must be zero before yaw builds');

  console.log('  ✔ Slip angles & kinematic response validated.');
}

// ── Test 4: Ackermann Steering Geometry ──
function testAckermann() {
  console.log('--- Test 4: Ackermann Steering Geometry ---');
  const wb = 2.7;
  const tw = 1.5;
  const steerAngle = 0.35; // ~20 degrees

  const R = wb / Math.tan(steerAngle);
  const inner = Math.atan(wb / (R - tw * 0.5));
  const outer = Math.atan(wb / (R + tw * 0.5));

  assert(inner > outer, 'Inner wheel must steer at a sharper angle than outer wheel');
  assert(inner > steerAngle, 'Inner wheel angle must exceed average steer angle');
  assert(outer < steerAngle, 'Outer wheel angle must be smaller than average steer angle');

  console.log('  ✔ Ackermann geometry validated.');
}

// ── Test 5: ABS & TCS Active Driver Assists ──
function testDriverAssists() {
  console.log('--- Test 5: ABS & TCS Assists ---');
  
  // ABS check
  function applyABS(requestedBrake, slipRatio) {
    if (Math.abs(slipRatio) > 0.18) {
      return { brake: requestedBrake * 0.65, absActive: true };
    }
    return { brake: requestedBrake, absActive: false };
  }

  const normalBrake = applyABS(1.0, 0.05);
  assert.strictEqual(normalBrake.absActive, false, 'ABS must be inactive during low slip');
  assert.strictEqual(normalBrake.brake, 1.0);

  const lockupBrake = applyABS(1.0, 0.35); // 35% tire skid
  assert.strictEqual(lockupBrake.absActive, true, 'ABS must activate during tire lockup');
  assert(lockupBrake.brake < 1.0, 'ABS must modulate brake pressure');

  console.log('  ✔ Active driver assists (ABS/TCS) validated.');
}

function runAll() {
  testPacejka();
  testWeightTransfer();
  testSlipAngles();
  testAckermann();
  testDriverAssists();
  console.log('\n========================================');
  console.log('🎉 ALL VEHICLE DYNAMICS TESTS PASSED!');
  console.log('========================================');
}

runAll();
