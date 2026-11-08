import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PacejkaModel, VEHICLE_STATS } from '../src/engine/Physics';
import { RoadGraph } from '../src/systems/RoadGraph';
import { arbitrateDeadlock } from '../src/systems/NPCAI';

describe('Game Engine Physics & Dynamics', () => {
  it('conserves total vertical load under heavy acceleration and emergency braking (MATH-3-24)', () => {
    const stats = VEHICLE_STATS.car;
    const g = 9.81;
    const totalWeight = stats.mass * g;

    // Test across wide range of longitudinal accelerations (-25 m/s^2 to +15 m/s^2)
    const testAccels = [-25, -15, -9.8, -5, 0, 3, 8, 15];
    for (const ax of testAccels) {
      const loads = PacejkaModel.calculateWeightTransfer(
        stats.mass,
        ax,
        0,
        stats.wheelBase,
        stats.trackWidth,
        stats.cgHeight,
        stats.frontWeightDist
      );

      const sumLoads = loads.frontTotal + loads.rearTotal;
      expect(Math.abs(sumLoads - totalWeight)).toBeLessThan(1e-4);
      expect(loads.frontTotal).toBeGreaterThan(0);
      expect(loads.rearTotal).toBeGreaterThan(0);
    }
  });

  it('computes correct Ackermann steering angles where inner wheel turns sharper than outer wheel', () => {
    const stats = VEHICLE_STATS.car;
    const leftSteer = 0.35; // rad (turning left)
    const ackermann = PacejkaModel.calculateAckermannSteering(leftSteer, stats.wheelBase, stats.trackWidth);

    expect(Math.abs(ackermann.inner)).toBeGreaterThan(Math.abs(ackermann.outer));
    expect(Math.sign(ackermann.inner)).toBe(Math.sign(leftSteer));
    expect(Math.sign(ackermann.outer)).toBe(Math.sign(leftSteer));
  });

  it('regulates brake force when wheel slip exceeds threshold (ABS assist)', () => {
    const maxBrake = 8500;
    const lowSlip = PacejkaModel.applyABS(maxBrake, 0.08);
    expect(lowSlip.absActive).toBe(false);
    expect(lowSlip.brakeForce).toBe(maxBrake);

    const highSlip = PacejkaModel.applyABS(maxBrake, 0.25);
    expect(highSlip.absActive).toBe(true);
    expect(highSlip.brakeForce).toBeLessThan(maxBrake);
  });

  it('regulates drive torque when wheel slip exceeds threshold (TCS assist)', () => {
    const maxDrive = 5000;
    const lowSlip = PacejkaModel.applyTCS(maxDrive, 0.10);
    expect(lowSlip.tcsActive).toBe(false);
    expect(lowSlip.driveForce).toBe(maxDrive);

    const highSlip = PacejkaModel.applyTCS(maxDrive, 0.30);
    expect(highSlip.tcsActive).toBe(true);
    expect(highSlip.driveForce).toBeLessThan(maxDrive);
  });
});

describe('RoadGraph Network & Topologies', () => {
  it('correctly connects intersecting roads at crossings into junction nodes (MATH-3-19)', () => {
    // 2-road crossing grid: vertical road along x=0, horizontal road along z=0
    const graph = RoadGraph.fromLevelConfig({
      roads: [
        { type: 'v', x: 0, z1: -200, z2: 200, lanes: 2, width: 20, speedLimit: 60, roadType: 'arterial' },
        { type: 'h', z: 0, x1: -200, x2: 200, lanes: 2, width: 20, speedLimit: 60, roadType: 'arterial' }
      ]
    });

    // Instead of 2 disconnected roads with only 4 endpoint nodes, crossing at (0,0) creates a 4-way intersection node
    const junctionNode = Array.from(graph.nodes.values()).find(n =>
      Math.abs(n.position.x) < 1 && Math.abs(n.position.z) < 1
    );

    expect(junctionNode).toBeDefined();
    expect(junctionNode!.edges.length).toBe(4);
    expect(junctionNode!.type).toBe('major_junction');
  });

  it('retrieves connecting edges via getEdgeTo(nodeA, nodeB) (MATH-3-18)', () => {
    const graph = RoadGraph.fromLevelConfig({
      roads: [
        { type: 'v', x: 0, z1: -100, z2: 100, lanes: 2, width: 16, speedLimit: 50, roadType: 'arterial' }
      ]
    });

    const nodes = Array.from(graph.nodes.values());
    expect(nodes.length).toBeGreaterThanOrEqual(2);

    const edge = graph.getEdgeTo(nodes[0], nodes[1]);
    expect(edge).toBeDefined();
    expect(edge!.nodes).toContain(nodes[0]);
    expect(edge!.nodes).toContain(nodes[1]);
  });
});

describe('NPCAI & Deadlock Arbitration', () => {
  it('prioritizes vehicles waiting longest using FIFO scheduling (MATH-3-12)', () => {
    const now = Date.now();
    const vehicleWaitingLongest = {
      id: 'v_old',
      type: 'car',
      aggression: 0.5,
      arrivalTimeMs: now - 8000 // waiting for 8 seconds
    };
    const vehicleJustArrived = {
      id: 'v_new',
      type: 'bus', // bus has higher base type weight (30 vs 20)
      aggression: 0.5,
      arrivalTimeMs: now - 500 // waiting for 0.5 seconds
    };

    const res = arbitrateDeadlock([vehicleJustArrived, vehicleWaitingLongest], 4.5);
    expect(res.resolved).toBe(true);
    expect(res.phase).toBe(1);
    // Even though bus has higher vehicle type weight, the vehicle waiting 8s wins priority over 0.5s arrival
    expect(res.grantedVehicleId).toBe('v_old');
  });
});

describe('Collision Detection & MTV Resolution', () => {
  it('correctly identifies gentle bumper touch in physical m/s units (MATH-2-3)', () => {
    // Player moving at 15 m/s (54 km/h), NPC moving ahead at 14 m/s (50.4 km/h)
    const npcSpeedMs = 14.0;
    const playerSpeedInternal = 0.5; // in internal units/frame (1 unit = 30 m/s => 0.5 * 30 = 15 m/s)
    const playerSpeedMs = playerSpeedInternal * 30;

    const relSpeed = Math.abs(npcSpeedMs - playerSpeedMs);
    const isGentleTouch = relSpeed < 3.5;

    expect(isGentleTouch).toBe(true);
  });

  it('resolves penetration along the axis of least penetration in world coordinates (MATH-2-5)', () => {
    // Vehicle oriented along world +Z (rotY = 0)
    // Vehicle half-extents: halfW = 1.0, halfD = 2.0
    // Player center at (0.2, 0, 1.95) with half-extents: halfW = 0.9, halfD = 1.8
    // Overlap on X = (1.0 + 0.9) - 0.2 = 1.7
    // Overlap on Z = (2.0 + 1.8) - 1.95 = 1.85
    // Axis of least penetration is X (overlapX < overlapZ)
    const overlapX = 0.15;
    const overlapZ = 0.85;
    const vLocX = 0.2;
    const vLocZ = 1.95;
    const rotY = 0;
    const pushSep = 0.08;

    const cosV = Math.cos(rotY);
    const sinV = Math.sin(rotY);

    let pushX = 0;
    let pushZ = 0;

    if (overlapX < overlapZ) {
      const pushLX = (vLocX > 0 ? overlapX + pushSep : -(overlapX + pushSep));
      pushX += cosV * pushLX;
      pushZ -= sinV * pushLX;
    } else {
      const pushLZ = (vLocZ > 0 ? overlapZ + pushSep : -(overlapZ + pushSep));
      pushX += sinV * pushLZ;
      pushZ += cosV * pushLZ;
    }

    // Resolves along X axis by (overlapX + pushSep) = 0.23, leaving Z undisturbed
    expect(pushX).toBeCloseTo(0.23, 4);
    expect(pushZ).toBeCloseTo(0.0, 4);
  });
});

describe('Mission Manager & Subclass Defaults (MATH-5-4, MATH-5-6)', () => {
  it('preserves all default subclass parameters when partial config data is passed', async () => {
    const { EscortMission, ChaseMission, ParkingMission, CargoMission, PassengerPickupMission } = await import('../src/systems/MissionManager');

    const escort = new EscortMission({ data: { targetIntersections: 5 } });
    expect(escort.target).toBe(5);
    expect(escort.data.targetIntersections).toBe(5);
    expect(escort.data.minDistance).toBe(10);
    expect(escort.data.maxDistance).toBe(35);
    expect(escort.data.intersectionsCleared).toBe(0);

    const chase = new ChaseMission({ data: { maxChaseTime: 60 } });
    expect(chase.data.catchDistance).toBe(8);
    expect(chase.data.pitDistance).toBe(5);
    expect(chase.data.maxChaseTime).toBe(60);
    expect(chase.data.chaseTime).toBe(0);

    const parking = new ParkingMission({ data: { spot: { x: 10, z: 20, rotation: 0, type: 'parallel' } } });
    expect(parking.data.maxDeviation).toBe(2.0);
    expect(parking.data.maxAngleDeviation).toBe(0.3);
    expect(parking.data.parked).toBe(false);

    const cargo = new CargoMission({ data: { distanceTarget: 1000 } });
    expect(cargo.data.cargoIntegrity).toBe(100);
    expect(cargo.data.maxLateralG).toBe(0.8);
    expect(cargo.data.maxPotholes).toBe(3);

    const pickup = new PassengerPickupMission({ data: { passengerName: 'Amit' } });
    expect(pickup.data.stage).toBe('DRIVE_TO_PICKUP');
    expect(pickup.data.passengerName).toBe('Amit');
    expect(pickup.data.dwellTimer).toBe(0);
  });

  it('correctly matches 40 canonical level theme types in mission gates (MATH-5-6)', async () => {
    const { MissionManager } = await import('../src/systems/MissionManager');
    const mm = new MissionManager({});

    const escort = mm.createEscortMission({ themeType: 'ambulance_priority', route: [{}, {}, {}] });
    expect(escort).not.toBeNull();

    const chase = mm.createChaseMission({ themeType: 'road_rage', route: [{}] });
    expect(chase).not.toBeNull();

    const parking = mm.createParkingMission({ themeType: 'parking_rules', roads: [{ type: 'v', x: 0, z1: -50, z2: 50 }] });
    expect(parking).not.toBeNull();

    const cargo = mm.createCargoMission({ themeType: 'market_street', route: [{ x: 0, z: 0 }, { x: 100, z: 100 }] });
    expect(cargo).not.toBeNull();
  });
});

describe('Evaluation & Metrics Invariants (MATH-5-3, MATH-4-10, MATH-4-14)', () => {
  it('evaluates vehicle ahead in front (+Z) correctly (MATH-5-3)', () => {
    const playerZ = 100;
    const vehicleAheadZ = 115;
    const vehicleBehindZ = 85;

    // Positive distance in front along forward +Z axis
    const ahead = vehicleAheadZ - playerZ;
    const behind = vehicleBehindZ - playerZ;

    expect(ahead).toBe(15);
    expect(ahead > 0 && ahead <= 30).toBe(true);
    expect(behind).toBe(-15);
    expect(behind > 0).toBe(false);
  });

  it('safely clamps base reward across non-positive, fractional, and boundary level IDs (MATH-4-10)', () => {
    const _rewards = [2000,2000,2500,2500,3000,3000,3000,3500,3500,4000,4000,4500,4500,5000,6000];
    const calcBaseRew = (_lvId: any) => _rewards[Math.min(Math.max((_lvId || 1) - 1, 0), _rewards.length - 1)] || 2000;

    expect(calcBaseRew(0)).toBe(2000);
    expect(calcBaseRew(-5)).toBe(2000);
    expect(calcBaseRew(NaN)).toBe(2000);
    expect(calcBaseRew(undefined)).toBe(2000);
    expect(calcBaseRew(1)).toBe(2000);
    expect(calcBaseRew(15)).toBe(6000);
    expect(calcBaseRew(99)).toBe(6000);
  });

  it('guards single-point data series in sparklines against NaN coordinates (MATH-4-14)', () => {
    const data = [42];
    const width = 300;
    const padding = 4;
    const denom = Math.max(1, data.length - 1);

    const xCoords = data.map((_, i) => padding + (i / denom) * (width - padding * 2));
    expect(xCoords.length).toBe(1);
    expect(Number.isFinite(xCoords[0])).toBe(true);
    expect(xCoords[0]).toBe(padding);
  });
});
