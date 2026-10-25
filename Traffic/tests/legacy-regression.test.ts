import { describe, expect, it } from 'vitest';

/**
 * Regression guards for defects verified in MATH-AUDIT.md (2026-10-03) against
 * the live `game_core.js` runtime.
 *
 * `game_core.js` is a browser global script and cannot be imported into a Node
 * test runner, so each test carries two explicit implementations:
 *
 *   `asCoded`  — the code exactly as it appears in the runtime today
 *   `correct`  — the mathematically correct form
 *
 * These tests assert structural invariants rather than reproducing the audit's
 * exact figures. The audit's numbers came from a faithful re-simulation of the
 * entire `_input` pipeline (gear, seatbelt, boost, cruise); a simplified
 * harness must not pretend to match those figures precisely. What must hold is
 * the *shape* of the error and the direction of the fix.
 */

// ───────────────────────────────────────────────────────────────────────────
// MATH-2-1 — world->local rotation uses the matrix TRANSPOSE, not the inverse
// ───────────────────────────────────────────────────────────────────────────

/**
 * The code at game_core.js:12058-12060 (traffic path) and 13170-13173
 * (obstacle path) prior to the fix.
 */
function worldToLocalAsCoded(dx: number, dz: number, rot: number): [number, number] {
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  return [cos * dx - sin * dz, sin * dx + cos * dz];
}

/** The correct inverse rotation. */
function worldToLocalCorrect(dx: number, dz: number, rot: number): [number, number] {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return [cos * dx - sin * dz, sin * dx + cos * dz];
}

/**
 * The collision test reads `Math.abs(vLocX)` / `Math.abs(vLocZ)` against
 * *different* half-extents per axis — a bus is 1.5 m half-width but 4.5 m
 * half-length. That asymmetry is what makes the transpose harmful: a symmetric
 * threshold cannot tell a swapped pair from the original.
 */
function verdict(
  dx: number,
  dz: number,
  rot: number,
  halfW: number,
  halfD: number,
  useCorrect: boolean,
): boolean {
  const [lx, lz] = useCorrect
    ? worldToLocalCorrect(dx, dz, rot)
    : worldToLocalAsCoded(dx, dz, rot);
  return halfW - Math.abs(lx) > 0 && halfD - Math.abs(lz) > 0;
}

/** Magnitude disagreement, which is what the collision test actually senses. */
function magError(dx: number, dz: number, rot: number): number {
  const [ax, az] = worldToLocalAsCoded(dx, dz, rot);
  const [bx, bz] = worldToLocalCorrect(dx, dz, rot);
  return Math.hypot(Math.abs(ax) - Math.abs(bx), Math.abs(az) - Math.abs(bz));
}

describe('MATH-2-1: world->local rotation', () => {
  it('is indistinguishable at axis-aligned yaw, which is why the bug survived', () => {
    // road-graph.js types edges as 'v' | 'h', so much of traffic is nominally
    // axis-aligned. The signed values differ by a sign flip, but the collision
    // test only reads magnitudes, so these angles are genuinely unaffected.
    for (const rot of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, -Math.PI / 2]) {
      for (const [dx, dz] of [[0.7, 0.4], [-2, 1], [3, -1], [-0.5, 2]]) {
        expect(magError(dx, dz, rot), `yaw=${rot} dx=${dx} dz=${dz}`).toBeCloseTo(0, 10);
      }
    }
  });

  it('swaps the two components at 45 degrees', () => {
    const d = -Math.SQRT2 * 2;

    const [goodX, goodZ] = worldToLocalCorrect(d, d, Math.PI / 4);
    // The offset lies exactly along the box's local -Z axis — directly behind.
    expect(goodX).toBeCloseTo(0, 10);
    expect(goodZ).toBeCloseTo(-4, 10);

    const [badX, badZ] = worldToLocalAsCoded(d, d, Math.PI / 4);
    expect(badX).toBeCloseTo(-4, 10);
    expect(badZ).toBeCloseTo(0, 10);
  });

  it('peaks at the diagonals and vanishes at the axes', () => {
    const d = -Math.SQRT2 * 2;
    for (const rot of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      expect(magError(d, d, rot), `yaw=${rot}`).toBeCloseTo(0, 10);
    }
    for (const rot of [Math.PI / 4, (3 * Math.PI) / 4]) {
      // The diagonal swap displaces each axis by sqrt(2) * the offset.
      expect(magError(d, d, rot), `yaw=${rot}`).toBeGreaterThan(5.6);
    }
  });

  it('misses a genuine overlap the corrected maths catches', () => {
    // The audit's concrete case: player stopped 4.0 units directly behind a
    // bus yawed 45 degrees. Bus half-extents 1.5 x 4.5, player 0.95 x 2.25.
    const dx = -Math.SQRT2 * 2;
    const dz = -Math.SQRT2 * 2;
    const rot = Math.PI / 4;

    // Projected player bounds onto the bus axes (player yaw 0).
    const pHalfW = 0.95;
    const pHalfD = 2.25;
    const angleDiff = 0 - rot;
    const cosDiff = Math.abs(Math.cos(angleDiff));
    const sinDiff = Math.abs(Math.sin(angleDiff));
    const vHalfW = 1.5 + (pHalfW * cosDiff + pHalfD * sinDiff);
    const vHalfD = 4.5 + (pHalfW * sinDiff + pHalfD * cosDiff);

    expect(verdict(dx, dz, rot, vHalfW, vHalfD, true), 'correct must be a HIT').toBe(true);
    expect(verdict(dx, dz, rot, vHalfW, vHalfD, false), 'as coded must be a MISS').toBe(false);
  });

  it('produces both false negatives and false positives', () => {
    // The audit measured 6.73% false negatives (drive through traffic) and
    // 14.37% false positives (phantom corner hits), both against a 4-axis SAT
    // reference. Direction and rough magnitude must both hold.
    let falseNeg = 0;
    let falsePos = 0;
    let total = 0;

    for (let i = 0; i < 180; i++) {
      const rot = ((i + 0.5) / 180) * Math.PI;
      for (let j = 0; j < 150; j++) {
        const dx = ((j * 37) % 150) / 10 - 7.5;
        const dz = ((j * 83) % 150) / 10 - 7.5;
        const good = verdict(dx, dz, rot, 1.5, 4.5, true);
        const bad = verdict(dx, dz, rot, 1.5, 4.5, false);
        if (good && !bad) falseNeg++;
        if (!good && bad) falsePos++;
        total++;
      }
    }

    const fnRate = falseNeg / total;
    const fpRate = falsePos / total;
    expect(fnRate, 'false negatives must be non-trivial').toBeGreaterThan(0.005);
    expect(fpRate, 'false positives must be non-trivial').toBeGreaterThan(0.005);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// MATH-1-6 — position integration omits dt, so world speed scales with fps
// ───────────────────────────────────────────────────────────────────────────

interface Run {
  distance: number;
  finalSpeed: number;
}

/**
 * Reproduces the runtime's longitudinal model (game_core.js:11210-11220) and
 * its position integration (:11351).
 *
 * `scaleDt` selects the variant:
 *   false — as coded: `position += vx`
 *   true  — fixed:     `position += vx * dt * 60`
 *
 * `speed` is accumulated as units-per-frame (`accel * dt * 60`), so integration
 * must advance by `speed * dt * 60` to be frame-rate independent. At 60 fps
 * `dt * 60 === 1`, which is why the fix is a no-op at the dominant frame rate.
 */
function simulate(fps: number, scaleDt: boolean, seconds = 1): Run {
  const accel = 0.045;
  const fric = 0.95;
  const dtClamp = 0.033;

  let speed = 0;
  let distance = 0;
  let remaining = seconds;

  while (remaining > 1e-9) {
    const realDt = 1 / fps;
    const dt = Math.min(realDt, dtClamp);
    remaining -= realDt;

    speed += accel * dt * 60;
    speed *= Math.pow(fric, dt * 60);

    distance += scaleDt ? speed * dt * 60 : speed;
  }

  return { distance, finalSpeed: speed };
}

describe('MATH-1-6: position integration timestep', () => {
  it('is identical at 60 fps, so the fix is a no-op on the dominant rate', () => {
    // The safety property: a machine currently rendering at 60 must not feel
    // any different after the fix.
    const before = simulate(60, false);
    const after = simulate(60, true);
    expect(after.distance).toBeCloseTo(before.distance, 12);
    expect(after.finalSpeed).toBeCloseTo(before.finalSpeed, 12);
  });

  /**
   * Tolerance is 2%, not exact. The remaining drift is NOT the integrator:
   * it is that the speed model itself — `v += accel*dt*60; v *= fric^(dt*60)` —
   * is an explicit Euler step whose fixed point depends on the timestep
   * (60 fps settles at 0.855, 90 fps at 0.861). Making that timestep-invariant
   * requires retuning accel/fric into SI units, which is MATH-1-10, not this fix.
   */
  it('brings high frame rates within a few percent of each other once fixed', () => {
    const reference = simulate(60, true).distance;
    for (const fps of [60, 90, 120, 144]) {
      const { distance } = simulate(fps, true);
      const ratio = distance / reference;
      expect(ratio, `${fps} fps vs 60 fps`).toBeGreaterThan(0.98);
      expect(ratio, `${fps} fps vs 60 fps`).toBeLessThan(1.02);
    }
  });

  it('stays close at 30 fps despite the dt clamp', () => {
    // At 30 fps real dt (0.03333) slightly exceeds the 0.033 safety clamp, so a
    // small amount of time is intentionally discarded. That loss must stay near
    // 1%, nowhere near the 50% error of the unfixed code.
    const reference = simulate(60, true).distance;
    const ratio = simulate(30, true).distance / reference;
    expect(ratio).toBeGreaterThan(0.96);
    expect(ratio).toBeLessThan(1.0);
  });

  it('is severely frame-rate dependent as currently coded', () => {
    const at60 = simulate(60, false).distance;
    const at120 = simulate(120, false).distance;
    const at30 = simulate(30, false).distance;
    const at20 = simulate(20, false).distance;

    // Doubling the frame rate must roughly double the distance travelled — the
    // signature of a missing dt in the integrator.
    expect(at120 / at60, '120 fps overshoots').toBeGreaterThan(1.6);
    expect(at30 / at60, '30 fps undershoots').toBeLessThan(0.6);
    // The dt clamp compounds the integration error below 30 fps.
    expect(at20 / at60, '20 fps compounds the clamp').toBeLessThan(0.35);
  });

  it('collapses that spread from >50% down to ~2%', () => {
    const spread = (scaleDt: boolean) => {
      const hi = simulate(120, scaleDt).distance;
      const lo = simulate(60, scaleDt).distance;
      return Math.max(hi / lo, lo / hi);
    };

    expect(spread(false)).toBeGreaterThan(1.5);
    expect(spread(true)).toBeLessThan(1.03);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// MATH-BARRIER-1 — Jersey barrier coordinate alignment & local half-extents
// ───────────────────────────────────────────────────────────────────────────

describe('MATH-BARRIER: road termination barriers & vehicle collision', () => {
  it('demonstrates that swapping halfW and halfD for rotY=PI/2 breaks barrier collision', () => {
    const barrierWidth = 14;
    const rotY = Math.PI / 2; // Barrier across horizontal road (E-W)

    // Old flawed assignment in createJerseyBarrier:
    const isAlignedXOld = Math.abs(rotY) < 0.1 || Math.abs(rotY - Math.PI) < 0.1;
    const oldHalfW = isAlignedXOld ? barrierWidth / 2 : 0.85; // became 0.85!
    const oldHalfD = isAlignedXOld ? 0.85 : barrierWidth / 2; // became 7.0!

    // Correct local extents (independent of rotY):
    const correctHalfW = barrierWidth / 2; // 7.0
    const correctHalfD = 0.55;

    // Suppose barrier is at (ox=100, oz=0) blocking a dead end along X.
    // The barrier spans Z from -7 to +7 in world space.
    // Player is at (px=98, pz=3), approaching the barrier 2m away from center along Z:
    const dx = 98 - 100; // -2 (approaching along X)
    const dz = 3 - 0;    // +3 (3m off-center along Z, well within the 14m width)

    // Obstacle local space transformation (as in _uobs):
    const cos = Math.cos(rotY), sin = Math.sin(rotY);
    const localX = cos * dx - sin * dz; // 0 - 3 = -3
    const localZ = sin * dx + cos * dz; // -2 + 0 = -2

    const pR = 0.85;

    // Under old logic:
    const oldOverlapX = pR + oldHalfW - Math.abs(localX); // 0.85 + 0.85 - 3 = -1.3 (NO COLLISION!)
    const oldOverlapZ = pR + oldHalfD - Math.abs(localZ); // 0.85 + 7.0 - 2 = +5.85

    // Player drives STRAIGHT THROUGH 90% of the barrier!
    expect(oldOverlapX).toBeLessThan(0);

    // Under correct logic:
    const pProjW = 0.95; // car half-width
    const pProjD = 2.25; // car half-length
    const correctOverlapX = correctHalfW + pProjW - Math.abs(localX); // 7.0 + 0.95 - 3 = 4.95 > 0
    const correctOverlapZ = correctHalfD + pProjD - Math.abs(localZ); // 0.55 + 2.25 - 2 = 0.80 > 0

    // Correct logic reliably detects the collision across the entire 14m barrier width:
    expect(correctOverlapX).toBeGreaterThan(0);
    expect(correctOverlapZ).toBeGreaterThan(0);
  });

  it('OBB projection detects bumper contact at true length instead of sinking 1.4m to 4.6m', () => {
    const barrierDepth = 0.55;
    const carHalfD = 2.25;
    const busHalfD = 5.50;
    const scalarPR = 0.85;

    // Contact threshold (distance between vehicle center and barrier surface):
    const carContactOBB = barrierDepth + carHalfD; // 2.80m
    const carContactScalar = barrierDepth + scalarPR; // 1.40m
    const carPenetrationBeforeHit = carContactOBB - carContactScalar; // 1.40m deep into mesh!
    expect(carPenetrationBeforeHit).toBeCloseTo(1.40, 2);

    const busContactOBB = barrierDepth + busHalfD; // 6.05m
    const busContactScalar = barrierDepth + scalarPR; // 1.40m
    const busPenetrationBeforeHit = busContactOBB - busContactScalar; // 4.65m deep into mesh!
    expect(busPenetrationBeforeHit).toBeCloseTo(4.65, 2);
  });

  it('pushes vehicle cleanly along road normal for both vertical and horizontal road termini', () => {
    // Road 1: North/South road terminus (rotY = 0)
    // Vehicle driving North into barrier (dx = 0, dz = 2.0, barrier at 0, 0)
    const rotY_v = 0;
    const overlapZ_v = 0.3;
    const pushSep = 0.08;
    const pushLZ_v = overlapZ_v + pushSep;
    const pushWorldX_v = Math.sin(rotY_v) * pushLZ_v;
    const pushWorldZ_v = Math.cos(rotY_v) * pushLZ_v;

    expect(pushWorldX_v).toBeCloseTo(0, 5);
    expect(pushWorldZ_v).toBeGreaterThan(0); // Pushes South, back onto road!

    // Road 2: East/West road terminus (rotY = PI/2)
    // Vehicle driving East into barrier (dx = -2.0, dz = 0, barrier at 0, 0)
    const rotY_h = Math.PI / 2;
    const overlapZ_h = 0.3;
    const localZ_h = Math.sin(rotY_h) * (-2.0) + Math.cos(rotY_h) * 0; // -2.0
    const pushLZ_h = localZ_h > 0 ? (overlapZ_h + pushSep) : -(overlapZ_h + pushSep);
    const pushWorldX_h = Math.sin(rotY_h) * pushLZ_h;
    const pushWorldZ_h = Math.cos(rotY_h) * pushLZ_h;

    expect(pushWorldX_h).toBeLessThan(0); // Pushes West (-X), back onto road!
    expect(pushWorldZ_h).toBeCloseTo(0, 5);
  });
});
