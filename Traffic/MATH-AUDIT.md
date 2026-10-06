# Math Audit — Mumbai Traffic Hero

**Date:** 2026-10-03
**Scope:** Read-only mathematical correctness audit. No source files were modified.
**Repo:** `Traffic/` — vanilla JS runtime (`game_core.js`, `npc-ai.js`, `ui.js`, …) plus an unwired TypeScript port (`src/`).

## Method

Findings were produced by reading the math, then **numerically verifying every claim** against a throwaway harness at `%TEMP%/opencode/math-audit/` (`extract.mjs`, `verify*.mjs`). The Pacejka model and `VEHICLE_PACEJKA_CONFIG` were extracted verbatim from `game_core.js:46-297` and executed; vehicle dynamics were re-implemented from the source and run; collision code was checked against independent dot-product and 4-axis SAT references.

Every suspicion was either **confirmed with numbers** or **retracted**. Retractions are recorded below because a wrong finding costs a fixer as much as a missing one.

**Severity:** `correctness` (wrong result) · `gameplay` (changes how the game plays) · `tuning` (calibration/scale) · `dead-code` (inert) · `divergence` (JS vs TS drift)
**Confidence:** `verified` (numerically proven) · `by-inspection`

## Executive Summary

The audit surfaced **two bugs severe enough to be felt immediately in play**, and a systemic unit problem underneath them.

**The two that matter most:**

1. **Traffic collision detection uses a transposed rotation matrix** (`MATH-2-1`). `game_core.js:11597-11599` computes `cos(-vRot)/sin(-vRot)` where the inverse requires `cos(vRot)/sin(vRot)`. At 45°/135° yaw the X and Z components come back **fully swapped**. Reproduced: a player stopped 4 units directly behind a 45°-yawed bus resolves to `HIT` under correct math and `MISS` under the code as written. Measured against a 4-axis SAT reference: **6.73% false negatives, 14.37% false positives.** The same defect is duplicated in the obstacle path at `:12709-12712`. The bug is invisible on axis-aligned roads (which is why it survived), but `npc-ai.js` jitters yaw every frame — after 600 frames only **2.0%** of NPC orientations are still within 0.01 rad of an axis.

2. **Position integration has no `dt`** (`MATH-1-26`). `game_core.js:10919` does `position.x += vx` where `vx = sin(yaw) * speed`. Speed is normalised as units-per-frame everywhere else (`speed += accel * dt * 60`), so world distance per second becomes `speed × fps`. The car covers **half** the ground at 30 fps that it does at 60 fps, and **2.4×** the ground at 144 fps. Below 30 fps the `dt` clamp at `:10453` compounds it — at 20 fps the car is **4.5× slower** than at 60 fps.

**The systemic issue:** the codebase carries **at least five mutually incompatible conversions** of the internal speed unit (`×30` for physics, `×100` for the HUD, `÷100` for cruise and limiter, `×20` in `npc-ai.js`, and a hardcoded `0.033` for lateral slip). Because of this, accelerations come out at **8.26 g for the engine, 11.56 g for the brake, and 9.41 g of coast-down** — 230× a real car's rolling resistance. Every speed cap, governor, and cruise setpoint is therefore arbitrary rather than designed, and **0-100 km/h is literally unreachable** on the speedometer.

**Also notable:** 77.7% of the player's steering never touches the tyre model (`MATH-1-3`), and the front/rear weight distribution is inverted, flipping the understeer gradient negative on three of five vehicle types (`MATH-1-1`).

**Coverage:** Phases 0–5. ~30,000 lines across the math-dense files, ~2,900 `Math.*` call sites. Substantial portions were verified **correct** and are listed so the coverage is auditable.

| Phase | Domain | Findings | Of which retracted/correct |
|---|---|---|---|
| 0/1 | Vehicle dynamics, Pacejka, longitudinal model | 27 | 3 retractions, 4 verified-correct |
| 2 | Collision, spatial hash, road geometry | 12 | 3 verified-correct, 1 refuted |
| 3 | NPC AI & traffic (JS + TS) | *pending* | |
| 4 | Scoring, economy, ranks, stats | 16 | 3 retractions, 11 verified-correct |
| 5 | Missions, tasks, scenarios | *pending* | |

---

# Phase 0 / 1 — Vehicle Dynamics

`game_core.js:40-300` (Pacejka + configs), `:2553-2760` (weight transfer, bicycle model, aero, suspension), `:10740-10920` (longitudinal integration).

---

### MATH-1-1 — Front and rear static axle loads are inverted relative to the moment arms
- **Location:** `game_core.js:2562-2563` (`_computeDynamicWeightTransfer`) vs `:2624-2625`
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
const staticFront = totalWeight * (1 - fDist);
const staticRear  = totalWeight * fDist;
```
```js
const lf = wb * (1 - (cfg.front_weight_dist || 0.58));   // CG → front axle
const lr = wb * (cfg.front_weight_dist || 0.58);        // CG → rear axle
```

**Correct.** With the CG at distance `lf` from the front axle and `lr` from the rear, taking moments about the front axle gives `Wr·L = W·lf`, so **front load fraction = `lr/L`** and **rear load fraction = `lf/L`**. The moment arms are computed with the standard convention (for `car`, `fDist = 0.60` ⇒ `lf = 1.08 m`, `lr = 1.62 m` ⇒ CG nearer the front ⇒ front carries 60%). The static loads use the opposite convention and give the front 40%.

**Evidence**
```
car    fDist=0.60 lf=1.080 lr=1.620 | written front=0.400W rear=0.600W | geometry front=0.600W rear=0.400W  MISMATCH
bus    fDist=0.55 lf=2.700 lr=3.300 | written front=0.450W rear=0.550W | geometry front=0.550W rear=0.450W  MISMATCH
auto   fDist=0.65 lf=0.700 lr=1.300 | written front=0.350W rear=0.650W | geometry front=0.650W rear=0.350W  MISMATCH
bike   fDist=0.50                          written = geometry (symmetric, unaffected)
truck  fDist=0.50                          written = geometry (symmetric, unaffected)
```

Consequence — understeer gradient `K = Wf/Cf − Wr/Cr` (positive = understeer, negative = **oversteer**):
```
car    K_correct=+0.04994 (understeer)   K_asWritten=-0.04994 (OVERSTEER)
bus    K_correct=+0.05886 (understeer)   K_asWritten=-0.05886 (OVERSTEER)
auto   K_correct=+0.09810 (understeer)   K_asWritten=-0.09810 (OVERSTEER)
```
And the peak yaw moment `Mz = Fy_F·lf·cos δ − Fy_R·lr`, where Pacejka peak `Fy = pdy1·Fz`:
```
car    Mz_correct=0.0 N·m   Mz_asWritten=-8158.0 N·m   yawAccel=-2.91 rad/s²
bus    Mz_correct=0.0 N·m   Mz_asWritten=-77695.2 N·m  yawAccel=-0.97 rad/s²
auto   Mz_correct=0.0 N·m   Mz_asWritten=-2589.8 N·m   yawAccel=-12.95 rad/s²
```

**Notes.** A correctly-configured car has **zero** net yaw moment at the Pacejka peak — that is the definition of a balanced vehicle. The code produces a large constant rearward moment on three of five vehicle types, i.e. a permanent oversteer/spin bias. `bike` and `truck` are unaffected because their `front_weight_dist` is 0.50. Fixing this changes handling on every car/bus/auto level, so it must be paired with playtesting per AGENTS.md's "readable, completable level over new features" rule.

---

### MATH-1-2 — Longitudinal weight transfer is ~30× too weak (unit mismatch)
- **Location:** `game_core.js:2566` consuming `:4470`
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
const deltaLong = ((cfg.mass || 1400) * ax * cgH) / wb;    // :2566
```
```js
this._longitudinalAccel = (currentSpeed - this._prevSpeedForCargo) / dt;   // :4470
```

**Correct.** `deltaLong` requires `ax` in m/s². `:4470` produces a finite difference of `currentSpeed`, which is in **internal units/second**. The physics conversion is `× 30` (`:2588`), so `ax` is understated by exactly 30×.

**Evidence**
```
ax as written  = 1.0 internal-unit/s^2  ->  30 m/s^2
deltaLong using ax as written =    285.19 N
deltaLong with ax in m/s^2    =   8555.56 N
ratio = 30.00x
```

**Notes.** Brake dive and acceleration squat are effectively invisible; `_wheelLoads` moves by ~5% of static instead of ~50%. **Fixing the units alone is not sufficient** — at a correct 1 g the transfer is 75% of static front load, which slams into the `totalWeight * 0.1` clamp at `:2567`. Units and clamp range must be fixed together. `_longitudinalAccel` is also derived from a different variable (`currentSpeed`) than the one the dynamics use (`this.speed`), so the sign convention needs confirming during the fix.

---

### MATH-1-3 — 77.7% of steering bypasses the tyre model
- **Location:** `game_core.js:2668`
- **Severity:** gameplay · **Confidence:** verified

**Current**
```js
const yawDelta = (this._yawRate * dt)
  + (tAmt * (this.turn || 0.08) * Math.max(0.4, 1 - Math.abs(this.speed)*0.2)
     * Math.sign(this.speed) * dt * 30);
```

**Correct.** `steerAngle` at `:2617` already feeds the Pacejka model, so `_yawRate` (`:2666`) already contains the modelled response to steering. The second term adds a raw kinematic injection on top, with a different and unrelated speed falloff.

**Evidence** — faithful re-run of `_computeVehicleDynamics`, steady steer `tAmt = 1` over 1.5 s at speed 0.9:
```
  t(s)   as-written yaw(deg)   with raw term removed
  0.02   1.91                 0.07
  0.52   64.43               12.65
  1.02   128.66              27.87
  1.27   160.79              35.49

  total as-written = 190.8 deg  (127.2 deg/s)
  tyre-model share =  42.6 deg  ( 28.4 deg/s)
  raw injection     = 148.2 deg  ( 98.8 deg/s)   -> 77.7%
```
Steady-state `_yawRate` is **identical** with and without the term (12.73 deg/s both) because the injection never feeds back into the model — it accumulates on top while the modelled component is attenuated by `pow(0.92, dt*60)`.

Two further defects in the same term:
- **`Math.sign(this.speed)` flips discontinuously through zero**: `speed = -0.001 → -0.039992`, `speed = 0 → 0`, `speed = +0.001 → +0.039992`.
- The speed falloff `max(0.4, 1 - |v|·0.2)` never drops below 0.76 across the entire reachable speed range (max 1.2), so it is not a meaningful speed sensitivity.

**Notes.** Fixing `MATH-1-1` alone will barely change handling while this term dominates. These two must be fixed together or the Pacejka model remains decorative.

---

### MATH-1-4 — Friction ellipse is algebraically degenerate *(dead code)*
- **Location:** `game_core.js:185-188` (`PACEJKA.computeCombinedForce`)
- **Severity:** dead-code · **Confidence:** verified

**Current**
```js
const Fy_max = lat.mu * Fz;                    // lat.mu = |Fy|/(Fz + 1e-6)   :146
const ellipse = (Fx0*Fx0)/(Fx_max*Fx_max) + (Fy0*Fy0)/(Fy_max*Fy_max);
let scale = 1.0;
if (ellipse > 1.0) { scale = 1.0 / Math.sqrt(ellipse); }
```

**Correct.** `Fy_max = |Fy|·Fz/(Fz+1e-6) ≈ |Fy0|`, therefore `(Fy0/Fy_max)² ≡ 1` **for any slip angle**, and likewise for `Fx`. The ellipse sum is identically `2.0` and `scale` identically `0.707107`. A real friction ellipse needs a *peak* reference (`D·sin(C)` or a friction coefficient), not the achieved force.

**Evidence** — swept across three loads × six slip angles:
```
Fz      alpha     Fy0         mu      ellipse   scale
3000    0.001     65.99       0.022   2.000000  0.707107
3000    0.050     2284.77     0.762   2.000000  0.707107
5488    0.150     5008.44     0.913   2.000000  0.707107
8232    0.600     8658.33     1.052   2.000000  0.707107
```

**Notes.** Not a live defect: `computeCombinedForce` is **never called** anywhere in the repo. It is a landmine — anyone wiring it up gets a flat 0.707× force cut with no physical meaning. Either fix it against a proper peak reference or delete it.

---

### MATH-1-5 — Longitudinal weight transfer / brake fade: `'B'` key is a fade-immune brake
- **Location:** `game_core.js:10711` vs `:2743` and `:2724`; `_brake()` at `:2537-2548`
- **Severity:** gameplay · **Confidence:** verified

**Current**
```js
const dn = !inTransition && (this.keys['arrowdown'] || this.keys['s'] || this.keys['b'] || at < -0.1);  // :10711
const braking = this.keys['s'] || this.keys['arrowdown'];   // :2743  (brake heat)
const brake   = this.keys['s'] || this.keys['arrowdown'];   // :2724  (nose dive)
```
`_brake()` is invoked from the `keydown` handler at `:1501` and applies `this.speed *= 0.35 * fadeFactor` **once per keydown**, *in addition to* the dt-scaled continuous brake at `:10774` which runs every frame the key is held.

**Correct.** The three sites must agree on what counts as braking.

**Evidence**
```
:10711  dn includes 'b'          -> full braking applied
:2743   brake heat excludes 'b' -> no heat, therefore no fade
:2724   nose dive excludes 'b'  -> no dive

single-frame tap of B: v 1.10 -> 0.3850 -> 0.3059   (68% of speed removed in one frame)
```

**Notes.** Three distinct problems compound: (a) `'B'` generates no brake heat, so the brake-fade mechanic is bypassable by construction; (b) the per-keydown `0.35×` impulse is redundant with the continuous brake at any realistic key-repeat rate — verified that the continuous brake alone drives speed to zero within 1 s at **every** repeat rate from 0 to 50 Hz — so the impulse's only real effect is on sub-frame taps; (c) it makes total braking dependent on OS keyboard auto-repeat settings. The brake-fade feature is currently unobservable in normal driving.

---

### MATH-1-6 — Position integration has no `dt`: the car's world speed scales with frame rate
- **Location:** `game_core.js:10919` (integration), `:10770`/`:10774`/`:10780` (speed), `:10453` (`dt` clamp)
- **Severity:** gameplay · **Confidence:** verified

**Current**
```js
const targetVx = Math.sin(yaw) * this.speed + Math.cos(yaw) * vy;   // :10915
this.player.position.x += this.vx; this.player.position.z += this.vz;   // :10919  <-- no dt
```
Speed is normalised as units-per-frame everywhere else: `speed += accel * mult * dt * 60`, `speed *= pow(fric, dt*60)`, `speed -= accel*1.4*bf*dt*60`.

**Correct.** If `speed` is units-per-frame, position must advance by `speed * dt * 60` (or `speed` must be redefined as units-per-second and integrated with `dt`).

**Evidence** — distance travelled in 1.0 s at terminal speed:
```
  fps   frames/s   distance in 1.0 s   relative to 60 fps
  20    20          17.54              0.333x
  30    30          26.31              0.500x
  60    60          52.62              1.000x
  120   120         105.24             2.000x
  144   144         126.29             2.400x
```
Below 30 fps the `dt` clamp at `:10453` (`Math.min(this.clock.getDelta(), .033)`) compounds the error:
```
  fps   real dt   clamped dt   speed-integration error   distance error
  30    0.0333    0.0330       1.0%                      -50.0%
  20    0.0500    0.0330       34.0%                     -66.7%
  10    0.1000    0.0330       67.0%                     -83.3%
```
At 20 fps the two errors compound: equilibrium speed is 0.66× the 60 fps value **and** only 0.333× as many integration steps run ⇒ effective world speed **0.22×**, i.e. **4.5× slower** than at 60 fps.

**Notes.** This is the single most impactful gameplay defect found. It means level `timeLimit` values, route completion, collision frequency, and the entire difficulty curve are all frame-rate dependent. It also interacts with `MATH-2-3`, which compares NPC speed in units/second against player speed in units/frame.

---

### MATH-1-7 — `calcPurePursuit` `tan(atan(x))` singularity — **RETRACTED**
- **Location:** `npc-ai.js:97-100`
- **Severity:** none · **Confidence:** verified (not a bug)

Originally suspected: `yawRate = speed * tan(atan(κ·L)) / L` blows up as `κ·L → ∞`. **This is incorrect.** `tan(atan(x)) ≡ x` in exact arithmetic, so the expression simplifies exactly to `yawRate = speed·κ` with no singularity.

IEEE-754 verification across the full reachable input space (`Ld ∈ [0.1, 1000]`, `alpha ∈ [−π, π]`):
```
max absolute error : 3.340e-13
max RELATIVE error : 6.193e-15   at Ld=0.1, alpha=-1.518, x=-53.93
max reachable |kappa*L| = 54.00   (Ld=0.1, alpha=pi/2)
```
`tan` only saturates for `|x| > ~1.6e16`, unreachable by nine orders of magnitude. **Withdrawn — no code change needed.**

---

### MATH-1-8 — Five mutually incompatible speed-unit conversions
- **Location:** `game_core.js:2588`, `:2668`, `:2691`, `:2877`, `:10793`, `:10801`, `:2454`, `:2442`; `npc-ai.js:2368`
- **Severity:** correctness · **Confidence:** verified

**Current / Correct.** The physics path declares 1 internal unit = 30 m/s = **108 km/h** (`:2588`, `:2691`, `:2668`). The HUD, cruise, and governor declare 1 unit = **100 km/h** (`:2877` `absSpd * 100`; `:10793` `cruiseSpeed / 100`; `:10801` `speedLimitCap / 100`; `:2454`). `npc-ai.js:2368` uses a third factor: `spd * 20`.

**Evidence**
```
physics factor 108.0 km/h per unit ; nominal factor 100 km/h per unit
discrepancy 8.0 km/h per unit = 7.41%

Speed limiter (speedLimitCap km/h -> cap/100):
  set km/h   internal   physics truth   HUD shows
  30        0.300      32.4            30.0
  50        0.500      54.0            50.0
  80        0.800      86.4            80.0

npc-ai.js:2368 `spd * 20` vs physics `*30`  ->  1.50x  (72 vs 108 km/h at v=1)
```

**Notes.** The `/100` and `*100` pair is at least internally consistent with itself; the physics `*30` is the outlier. Consequences: the speedometer reads **7.4% low**, the governor labelled "50 km/h" actually enforces 54 km/h, and any cross-module speed comparison (notably `MATH-2-3`) inherits the error. A single exported constant should replace all five.

---

### MATH-1-9 — Speed caps are inert; terminal speed is set by the friction coefficient
- **Location:** `game_core.js:2727` (`cfg.maxSpeed`), `:928` (`maxSpd`), `:10780` (`fric`)
- **Severity:** tuning · **Confidence:** verified

**Current**
```js
else if (accel && speed < (cfg.maxSpeed || 1.2)) {targetPitch = -0.03;}   // :2727
```
`VEHICLE_PACEJKA_CONFIG` (`:211-297`) has **no `maxSpeed` key**:
```
maxSpeed present in VEHICLE_PACEJKA_CONFIG?  [false, false, false, false, false]
```
so the `|| 1.2` fallback always applies.

**Evidence** — terminal speed is governed by the `accel`/`fric` ratio, not by `maxSpd`:
```
accel=0.045/frame -> 2.700 unit/s^2 ; fric=0.95 -> decay 3.0776 /s
terminal from fric alone      = 0.8773 unit
declared maxSpd               = 1.1
simulated terminal (friction) = 0.8550 unit = 92.3 km/h
simulated terminal (+aero)    = 0.5968 unit = 64.5 km/h   (aero removes 30.2%)
declared maxSpd               = 1.1     = 118.8 km/h  <- never reached
```

**Notes.** `maxSpd` is unreachable; the `cfg.maxSpeed` check at `:2727` is a no-op; and aerodynamic drag — not the declared cap — is what actually limits the car, at roughly **half** the intended top speed.

---

### MATH-1-10 — Longitudinal model operates in non-physical units
- **Location:** `game_core.js:928` (`accel = .045`, `fric = .95`), `:10770`, `:10774`, `:10780`
- **Severity:** tuning · **Confidence:** verified

**Evidence** — with 1 unit = 30 m/s:
```
engine    accel*dt*60 = 2.700 unit/s^2 =  81.00 m/s^2 =  8.26 g
brake     accel*1.4   = 3.780 unit/s^2 = 113.40 m/s^2 = 11.56 g
friction  pow(fric,60)=             =  92.33 m/s^2 =  9.41 g

real-world references: engine ~2.5 m/s^2, hard brake ~9.8 m/s^2, coast ~0.4 m/s^2
  engine   is  32.4x a real car's acceleration
  brake    is  11.6x a real hard brake
  friction is 230.8x a real coast-down
```

**Consequence.** The HUD's own 0-100 km/h range is unreachable: 100 km/h is 1.0 internal, terminal is 0.877.
```
0-100 km/h (HUD units) as modeled: Infinity s
terminal = 0.8773 unit = 94.7 km/h (physics truth) / 87.7 km/h (HUD)
```

**Notes.** This is the root cause of `MATH-1-9`, the 7.4% speedometer error, and the unreachable top speed. The `fric = 0.95` per-frame coefficient is doing the work of a rolling-resistance model that is ~230× too strong. Whether to rescale to real units or retune the three coefficients is a design decision, but the current state means **no speed-related constant in the codebase means what its name says**.

---

### MATH-1-11 — Body roll saturates its clamp in ordinary cornering
- **Location:** `game_core.js:2720-2722`
- **Severity:** tuning · **Confidence:** verified

**Current** `targetRoll = -lateralAccel * 0.03 * cg_height`, clamped to ±0.12 rad.

**Evidence** (`cg_height = 0.55` ⇒ `targetRoll = -lateralAccel × 0.0165`)
```
lateral accel (m/s^2)   g        targetRoll (rad)   clamped?
  4.00                 0.41     -0.0660            no
  6.00                 0.61     -0.0990            no
  7.27                 0.74     -0.1200            boundary
  8.00                 0.82     -0.1320            YES - pinned
 10.00                 1.02     -0.1650            YES - pinned
```
Saturation threshold **0.74 g**. Dry-asphalt Pacejka peak is µ ≈ 1.10, so any corner above ~0.67 g pins the roll animation and it stops responding for the rest of the corner.

---

### MATH-1-12 — Aerodynamic drag is mis-scaled by roughly 9×
- **Location:** `game_core.js:2698-2699`, applied at `:10785-10788`
- **Severity:** tuning · **Confidence:** verified

**Current** `this._aeroDrag = dragForce * 0.0001;` — an unexplained scale factor converting newtons to "game units".

**Evidence**
```
real aero drag force @120 km/h = 429 N   (14.3 kW)
code's 0.0001-scaled equivalent = 0.043 "units" per frame
engine accel term per frame      = 0.045 units per frame
=> drag is 0.95x the engine force
```
Real-world reference: 429 N of drag against `max_drive_force = 4000 N` is **10.7%** of tractive effort. The code makes it **95%**. Combined with `MATH-1-9` this is what drops top speed from an intended ~119 km/h to 64.5 km/h. The same block also uses `track_width * 1.2` as a stand-in for frontal area (`:2693`) and a hardcoded `Cd = 0.35` / `Cl = 0.15` for all vehicle classes.

---

### MATH-1-13 — Per-frame exponential damping is far too aggressive
- **Location:** `game_core.js:2666`, `:2680`
- **Severity:** tuning · **Confidence:** verified

**Evidence**
```
factor     retain/frame  half-life(frames)  time-constant(s)
_yawRate   0.92          8.31              0.200
_localVy   0.85          4.27              0.103
speed fric 0.95          13.51             0.325
```
`_localVy` (lateral chassis velocity) decays with a **0.103 s** time constant. A real tyre relaxation length of ~0.5 m at 26 m/s corresponds to ~0.019 s — the model is ~5× slower to build slip velocity, so the car effectively cannot slide. Combined with `MATH-1-3` (the modelled yaw is only 22% of actual turning), the vehicle has no recoverable slide behaviour: it rotates kinematically and the tyre model never saturates.

---

### MATH-1-14 — Seven pieces of "enhanced physics" state are written but never read
- **Location:** `game_core.js:2575`, `:942`, `:2649`, `:2655`, `:2632`, `:2633`, `:2684`
- **Severity:** dead-code · **Confidence:** verified

```
_wheelLoads   :2575   per-wheel normal loads FL/FR/RL/RR  — never consumed
_tireWear     :942    initialised and reset at :3425, never modified or read
_absActive    :2649   ABS engagement flag — set every frame, never read
_tcsActive    :2655   traction-control flag — set every frame, never read
_alphaF       :2632   front slip angle — stored, never read
_alphaR       :2633   rear slip angle — stored, never read
_engineRPM    :2684   engine RPM — stored, never read
```
Live: `_downforceCoeff` (`:2702` → `:10822`), `_lateralAccel` (`:2681` → `:2719`), `_aeroDrag` (`:2699` → `:10786`), `_brakeFadeFactor` (`:2753` → `:2539`, `:10773`).

**Notes.** The `ENHANCED PHYSICS` block at `:2550-2552` advertises Pacejka tyres, ABS, TCS, suspension load telemetry, tyre wear and engine RPM. In practice **only the Pacejka lateral force and the downforce term reach the simulation.** ABS and TCS compute a flag every frame that nothing consumes — so the ABS branch at `:2650-2653` scales `effBrake` but `effBrake` is itself only returned and never applied to `this.speed`.

---

### MATH-1-15 — Brake fade floor is unreachable
- **Location:** `game_core.js:2752-2753`
- **Severity:** tuning · **Confidence:** verified

`_brakeHeat` is capped at 100 (`:2746`). `fadeFactor = 1 - (heat - 70) * 0.015` ⇒ at heat 100, `fadeFactor = 0.550`. The `Math.max(0.5, fadeFactor)` floor can therefore never bind; the minimum achievable fade is 0.55. Additionally the heat rate at `:2746` normalises by the unreachable `1.1` (see `MATH-1-9`).

---

### MATH-1-16 — Hardcoded `0.033` in the lateral-slip velocity path
- **Location:** `game_core.js:10914`
- **Severity:** correctness · **Confidence:** verified

**Current** `const vy = (this._localVy && !this.isPedestrian) ? this._localVy * 0.033 : 0;`

`0.033` is 1/30 s, not the frame `dt`. The scaled `vy` is then added to `vx`/`vz`, which per `MATH-1-6` are themselves not dt-scaled. The slip contribution therefore carries a hardcoded 30 fps assumption independent of the actual frame rate — the third distinct time-base assumption in the motion path (alongside the missing `dt` at `:10919` and the clamp at `:10453`).

---

### MATH-1-17 — Pacejka core verified correct *(no defect)*
- **Location:** `game_core.js:115-147`
- **Severity:** none · **Confidence:** verified

Checked and sound:
- **`B = BCD/(C·D)`** (`:130`) is the correct rearrangement of the standard MF identity `BCD = B·C·D`. Dimensionally `B` is 1/rad. `pky1·Fz0 = 66000 N/rad` is the right order of magnitude against the declared `front_cornering_stiffness: 55000`.
- **`D = (pdy1 + pdy2·dfz)·(1 − pdy3·camber²)·Fz`** (`:126`) correctly scales peak force linearly with vertical load.
- **`Fy = D·sin(C·atan(Bα − E(Bα − atan Bα))) + Sv`** (`:144`) is a faithful MF 5.2 lateral form. `mu = |Fy|/Fz` is correct.
- Peak friction per surface: dry **1.097**, wet **0.899**, gravel **0.695**. Dry is marginally above the physical limit of 1.0 but within the range of performance tyres on dry asphalt.
- The `1e-6` guards at `:130`, `:146`, `:157` correctly prevent division by zero at `Fz = 0`.

**One simplification, not an error:** all load-dependency coefficients are zero (`pdy2 = pky2 = pvy2 = 0`), so the model has **no load sensitivity** — µ is constant at `pdy1` regardless of `Fz`. Real tyres show µ falling slightly with load. This is a deliberate simplification, not a bug, but it should be documented if the model is ever used for load-sensitive behaviour.

---

## Phase 1 Retractions

| Suspected | Verdict |
|---|---|
| Pure-pursuit `tan(atan(x))` singularity (`npc-ai.js:97`) | **Withdrawn** — simplifies exactly to `speed·κ`; max relative error 6.2e-15 |
| Pacejka `B` stiffness derivation (`:130`) | **Correct** — standard `BCD = B·C·D` rearrangement |
| Pacejka `mu` decreasing with load | **Withdrawn** — variation is a finite-α search artifact; µ is load-independent by construction (a simplification, not an error) |

---

# Phase 2 — Collision, Spatial & Road Geometry

`game_core.js:11575-11700` (OBB collision), `:12708-12742` (obstacle path), `:11656+` (legacy spatial hash), `road-graph.js`, `proc_road.js`, `world-streamer.js`.

---

### MATH-2-1 — World→local rotation is the matrix **transpose**, not the inverse ⚠️ HIGHEST IMPACT
- **Location:** `game_core.js:11596-11599` (traffic path), duplicated at `:12709-12712` (obstacle path)
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
const cosV = Math.cos(-vRot), sinV = Math.sin(-vRot);
const vLocX = cosV * dx - sinV * dz;
const vLocZ = sinV * dx + cosV * dz;
```

**Correct.** The codebase convention is `yaw = atan2(x, z)`, so local `+Z` (forward) maps to world `(sin r, cos r)` and local `+X` (right) maps to world `(cos r, −sin r)`. Writing `d = lx·X̂ + lz·Ẑ`:
```
[dx]   [ cos r   sin r ] [lx]
[dz] = [−sin r   cos r ] [lz]
```
`det = cos²r + sin²r = 1`, so the inverse is `[[cos r, −sin r], [sin r, cos r]]`, giving
```
lx = cos(r)·dx − sin(r)·dz
lz = sin(r)·dx + cos(r)·dz
```
The code substitutes `cos(−r) = cos r` and `sin(−r) = −sin r`, which yields `lx = cos(r)·dx + sin(r)·dz`, `lz = −sin(r)·dx + cos(r)·dz` — the **transpose**. The correct and incorrect forms agree only when `cos r · sin r · dx · dz = 0`.

**Evidence — component swap at 45°**
```
 yaw    dx      dz   |  correct(lx,lz)    |  asCoded(lx,lz)   | match
0.000  0.7     0.4  |  (0.7000, 0.4000)  |  (0.7000, 0.4000) | yes
0.524 -2       1    | (-2.2321, -0.1340) | (-1.2321, 1.8660)| NO
0.785 -2.8284 -2.8284| (-0.0000, -3.9994) | (-3.9994, -0.0000)| NO  <- full X/Z swap
1.571  3      -1    |  (1.0000, 3.0000)  | (-1.0000, -3.0000)| NO
3.142 -0.5     2    |  (0.5000, -2.0000) |  (0.5000, -2.0000)| yes
```
Error vs yaw (offset `dx = dz = −2.828`): **0.0000** at 0°/90°/180°/270°; **3.9994** at 45°; 2.828 at 30°/60°.

**Concrete false negative — reproduced:** player stopped 4.0 units directly behind a bus yawed 45°, bus half-extents `1.5 × 4.5`, player `0.95 × 2.25`:
```
dx = dz = -2.8284   distSq = 16.00   broadphase gate^2 = 52.56  -> PASSES
  correct local = (0.0000, -4.0000)   overlapX= 2.4500 overlapZ= 2.7500  => HIT
  asCoded local = (-4.0000, -0.0000)  overlapX=-1.5500 overlapZ= 6.7500  => MISS
```
The player **drives through the bus**.

**Aggregate accuracy** vs. an independent 4-axis SAT reference with effective half-extents, over 874,829 broadphase-passing samples:
```
false negatives  6.73%
false positives 14.37%
agreement       78.91%
```

**Why it survived.** The error is invisible whenever NPC yaw is axis-aligned. Road-graph edges are `type: 'v' | 'h'` (`road-graph.js:194-195`), so much of traffic is nominally axis-aligned — but `npc-ai.js` jitters yaw continuously: `:1861` `rotation.y += (rand−0.5)*0.003` every CRUISE frame, `:2169` `±0.02`, `:2201` `(rand−0.5)*0.08`, plus pure-pursuit `:1601`. Simulating that random walk: after 600 frames only **35.8%** of frames remain within 0.01 rad of an axis; with the `0.08` term, **2.0%**. The worst case (45°/135°, full component swap) is precisely the long-thin bus/truck box (`halfW 1.5 × halfD 4.5`) where an asymmetric swap does the most damage.

**Internal inconsistency proves `game_core.js` is the outlier.** `npc-ai.js:1562-1565` performs the *same* transform **correctly**:
```js
const cosR = Math.cos(this.vehicle.rotation.y);
const sinR = Math.sin(this.vehicle.rotation.y);
const localX = dx * cosR - dz * sinR;
const localZ = dx * sinR + dz * cosR;
```

**Notes.** Fix is one-line at each site: `Math.cos(-vRot)` → `Math.cos(vRot)`, `Math.sin(-vRot)` → `Math.sin(vRot)`. **Do not fix only the obstacle path's detection** (`:12709-12712`) — its *resolution* at `:12731-12742` already uses the correct sign convention (`cosW = cos(rotY)`), so correcting detection there alone would invert the push direction. Both halves of that site were verified consistent in the correct direction; only the detection frame is wrong.

---

### MATH-2-2 — NPC half-extents silently override the type table; `auto` NPCs get car-sized boxes
- **Location:** `game_core.js:11590-11591` (read order) vs `traffic-manager.js:676-677` (writer)
- **Severity:** gameplay · **Confidence:** verified

**Current** `game_core.js` reads `v.mesh?.userData?.halfW || v.userData?.halfW || (inline type table)`. But `traffic-manager.js:676-677` **unconditionally overwrites** whatever `vehicles.js:930-931` or `ui.js:4618-4652` set:
```js
mesh.userData.halfW = isHeavy ? 1.5 : (isTwoWheeler ? 0.6 : 1.15);
mesh.userData.halfD = isHeavy ? 4.5 : (isTwoWheeler ? 1.1 : 2.2);
// isTwoWheeler = ['bike','activa','splendor','ktm','cycle']   — 'auto'/'rickshaw' NOT listed
```

**Effective values actually used**
```
car/taxi/police/ambulance/auto -> 1.15 / 2.20
bike/splendor/ktm/cycle/activa -> 0.60 / 1.10
bus/truck                      -> 1.50 / 4.50
```
The `auto` fallback of `0.70 / 1.35` is dead — the real box is **2.68× larger in area**. Buses are **wider** (1.50 vs 1.35) and **shorter** (4.50 vs 4.80) than the `game_core.js` table implies, which matters directly for `MATH-2-1` since the 45° swap is only harmful when `halfW ≠ halfD`.

**Notes.** Two consequences: the inline table at `:11590-11591` is **dead code** for every `TrafficManager` vehicle, so anyone reading it to understand collision sizing gets wrong numbers; and half-extents are written in three places with three different tables, last-writer-wins. Consolidating to one table would also let the `+0.5` in `MATH-2-4` be re-validated against a single source of truth.

---

### MATH-2-3 — `relSpeed` compares NPC units/second against player units/frame
- **Location:** `game_core.js:11614-11616`
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
const relSpeed = Math.abs((v.npcAI?.currentSpeed || 0) - (this.speed || 0));
const isGentleTouch = relSpeed < 2.5 && !isPed;
```

**Correct.** The operands are in different dimensions. `this.speed` is consumed frame-rate-free at `:10919` (`position += vx` where `vx = sin(yaw)·speed`) ⇒ **units/frame**. `npcAI.currentSpeed` is consumed at `npc-ai.js:2245` (`position.addScaledVector(velocity, dt)`) ⇒ **units/second**. At 60 fps the expression understates the player's contribution by **60×**.

**Evidence.** NPC target speed from `npc-ai.js:2208` `baseSpeed = currentEdge.speedLimit/3.6`, floor `Math.max(2, …)`; `road-graph.js:39` defaults `speedLimit = 50`:
```
speedLimit 30->8.333  40->11.111  50->13.889  60->16.667  80->22.222   (units/second)

gentle requires player ∈ (npc−2.5, npc+2.5):
  npc=11.11 -> player ∈ (8.61, 13.61);  player max ~1.92  => IMPOSSIBLE
  npc=13.89 -> player ∈ (11.39, 16.39); player max ~1.92  => IMPOSSIBLE
  npc=16.67 -> player ∈ (14.17, 19.17); player max ~1.92  => IMPOSSIBLE
```
The branch fires **only** for `npc ≲ 1.65` units/s — crawling or stopped traffic.

**Notes.** The tuning intent (comment at `:11615`, "low speed bumper contact gently pushes") is **inverted** relative to behaviour: *stopped* traffic is treated gently (`relSpeed ≈ |0 − 0.85| = 0.85`), *moving* traffic brutally (`relSpeed ≈ 10.3` → hard crash, `speed *= -0.25`, camera shake, `TRAFFIC_COLLISION` violation). A fixer must also retune the `2.5` constant in whichever unit system is chosen — a genuine 5 km/h bumper tap becomes `relSpeed ≈ 0.85` under a `dt`-corrected formula, which is probably the intended feel.

---

### MATH-2-4 — Broadphase is conservative only because of an ad-hoc `+0.5`
- **Location:** `game_core.js:11592-11594`
- **Severity:** tuning · **Confidence:** verified (currently correct)

**Current** `maxRad = Math.max(pHalfD, pHalfW) + Math.max(vHalfD, vHalfW)`, gated at `distSq < (maxRad + 0.5)²`.

**Correct.** The tight conservative bound for two OBBs is the sum of circumradii: `hypot(pHalfW, pHalfD) + hypot(vHalfW, vHalfD)`. The max-of-extents form is *smaller* than that; it is conservative only thanks to the `+0.5` fudge.

**Evidence** — all 72 player × NPC-type combinations using effective half-extents:
```
combos=72  failures=0  minMargin=0.0252 units  (worst: car vs car, need 4.9248 vs gate 4.9500)
```
Without the pad, **36/36** sampled combinations would drop collisions. Worst deficit is `bus vs bus`: need `9.9725`, no-pad gate `9.6000` — **0.37 units short**, so a real bus-vs-bus overlap at 9.7 units centre distance would be culled.

**Notes.** The `+0.5` is doing load-bearing correctness work disguised as a tuning nudge, clearing the requirement by 0.025 units on car-vs-car. Any future vehicle-box widening can silently start culling real collisions with no test failing. Replacing it with the circumradius sum makes it conservative by construction for one extra `Math.hypot` per candidate.

---

### MATH-2-5 — Penetration push under-resolves 43% of the time
- **Location:** `game_core.js:11631-11633`, `:11639-11642` (with `dx`/`dz` defined at `:11587`)
- **Severity:** gameplay · **Confidence:** verified

**Current**
```js
const pushAngle = Math.atan2(dx, dz);   // dx = px - vx, dz = pz - vz  (player minus vehicle)
this.player.position.x += Math.sin(pushAngle) * (Math.min(overlapX, overlapZ) + 0.15);
```

**Correct — direction is right.** With the same `sin`/`cos` ordering used for `yaw = atan2(x,z)`, `sin = dx/|d|` and `cos = dz/|d|`, so the push unit vector is exactly `(dx,dz)/|d|` — centre-to-centre from vehicle to player. Multiplying by a positive magnitude **increases** separation. Verified: `dot(pushUnit, (dx,dz)/|d|) = 1.000000`.

**The magnitude is computed in the wrong frame.** `min(overlapX, overlapZ)` is a *transverse-axis* penetration depth applied along the *centre-line*. A proper resolution uses the minimum-translation vector along whichever OBB axis has least overlap — which the obstacle path at `:12731-12742` does correctly.

**Evidence** (rotation corrected so the axis choice is the only variable, effective half-extents, 200,000 random overlapping configurations):
```
after ONE push, still overlapping: 67488/156066 = 43.24%
```

**Notes.** Because the direction is guaranteed separating and applied along a ray from the vehicle centre, residual overlap shrinks geometrically on subsequent resolutions — provided the code is allowed to re-run. It is not, reliably: `v._justHit` suppresses re-entry for 1000 ms (see `MATH-2-6`), so up to ~1 s of visible interpenetration. Also, `dx`/`dz` are computed once at `:11587` against `px`/`pz` captured at `:11577` **before** the `forEach`, so on a multi-vehicle pile-up every push in the same frame uses stale coordinates and the pushes partially cancel rather than composing.

---

### MATH-2-6 — `_justHit` is a wall-clock latch that shortens with FPS and survives pool reuse
- **Location:** `game_core.js:11610-11612`, interacting with `traffic-manager.js:688-701`, `:703-718`, `:720-735`
- **Severity:** correctness (pool reuse) / tuning (FPS) · **Confidence:** verified

**Current**
```js
if (overlapX > 0 && overlapZ > 0 && !v._justHit) {
  v._justHit = true;
  setTimeout(() => { v._justHit = false; }, 1000);
```

**Correct.** A physics latch should be driven by the same clock as the physics. The sim clock is `rawDt = Math.min(this.clock.getDelta(), .033)` (`:10453`); `setTimeout` is unclamped wall-clock. Separately, `_resetVehicle` (`traffic-manager.js:688-701`) clears `active`, `speed`, `velocity`, `profileKey`, `health`, `npcAI` — **but not `_justHit`** — and `_returnToPool` (`:703-718`) pushes the object straight back into `vehiclePools`.

**Evidence — latch length in *sim* time** given the `.033` clamp:
```
at 120 fps: 1000 ms wall = 1000 ms sim
at  60 fps: 1000 ms
at  30 fps:  990 ms
at  20 fps:  660 ms
at  10 fps:  330 ms
at   5 fps:  165 ms
```
Pool reuse verified by reading `traffic-manager.js:688-701` in full — no reference to `_justHit`. `_despawnVehicle` (`:720-735`) calls `_returnToPool` unconditionally, and `_respawn` (`npc-ai.js:2249-2258`) routes through it for stuck NPCs (`:1199`).

**Notes.** Two consequences. (a) On a slow device the latch shortens to ~165 ms of sim time, so a slow scrape re-triggers `TRAFFIC_COLLISION` violations repeatedly; on a fast device it is the full second — **physics behaviour differs by device performance**. (b) A vehicle despawned within 1 s of a hit is recycled still latched, so its next spawn — possibly at a different road position — is collision-inert for the rest of the window and the player can drive through it. `setTimeout` also retains a strong reference to the vehicle after scene removal (minor GC cost across ~110 pooled vehicles).

---

### MATH-2-7 — Obstacle path duplicates the rotation bug; only its detection half is wrong
- **Location:** `game_core.js:12708-12718` (detection) vs `:12731-12742` (resolution)
- **Severity:** correctness · **Confidence:** verified

Same transpose defect as `MATH-2-1` in detection:
```js
const cos = Math.cos(-rotY);  const sin = Math.sin(-rotY);
localX = cos*dx - sin*dz;    localZ = sin*dx + cos*dz;
```
while resolution uses the **correct** world mapping (`cosW = Math.cos(rotY)`, local `+X` → world `(cos r, −sin r)`). The result is that `sign(localX)` is read from the wrong frame and applied to the correct frame's basis vector, so the push can move the player along an axis that resolves nothing.

**Evidence** (300,000 random overlapping configurations vs. a correctly-rotated reference):
```
cases that really overlapped: 299816
resolved (no longer overlapping): 108041 = 36.04%
still overlapping after push:       191632 = 63.92%
```
Worse than the traffic path's 43.24% under identical methodology, consistent with the extra sign inconsistency.

**Notes.** This path has **no `_justHit` latch**, so residual overlap is re-evaluated and re-pushed every frame and does converge — the visible symptom is 1–3 frames of jitter along the obstacle. `:12708` short-circuits to the axis-aligned branch when `|rotY| ≤ 0.01`, which is correct, but road-graph building slots and parked cars *are* rotated.

---

### MATH-2-8 — Legacy spatial hash is complete for four gates but not the junction cross-traffic gate
- **Location:** `game_core.js:11661-11680` (grid), consumers at `:11849-11859`, `:11873-11883`, `:11933-11942`, `:12002-12012`
- **Severity:** correctness · **Confidence:** verified

**Correct.** A 3×3 neighbourhood of cells of size `C` is provably complete for any predicate with acceptance radius `≤ C`. Verified with 200,000 random trials at radius exactly 25: **zero** escapes. The four axis-aligned consumers respect the bound:
```
:11853 vehicle ahead (h)   thresholds (25, 2.5)   -> per-axis bound 25 <= 25  OK
:11877 vehicle ahead (v)   thresholds (25, 2.5)   -> per-axis bound 25 <= 25  OK
:12003 overtake lane block thresholds (2.5, 22)   -> per-axis bound 22 <= 25  OK
:12009 player lane block   thresholds (2.5, 25)   -> per-axis bound 25 <= 25  OK
```
So the comment at `:11657-11660` ("every one of the proximity/obstacle checks below only ever looks within 25 units") is **accurate for those four**.

**The junction gate violates it.** `:11933-11942` is queried via `nearbyNpcs(n.position)` but its threshold is measured **from the intersection**, not from `n.position`:
```js
if (myDistToInt < 24 && !isCommitted) {                       // :11931  measured from intersection
  nearbyNpcs(n.position).forEach(other => {
    if (... otherDistToInt < 16 && (...))                   // :11936
```
Worst case `|other − n| ≤ 24 + 16 = 40 > 25`. Concrete construction:
```
I=[60,0.1]  n=[36.1,0.1] cell=[1,0]   (myDistToInt = 23.9 < 24)
other=[75.9,0.1] cell=[3,0]           (otherDistToInt = 15.9 < 16)
|other-n| = 39.80 ; 3x3 covers x-cells 0..2 ; other is in cell 3  -> MISSED
```

**Notes.** The missed pair satisfies every acceptance condition, so an NPC can fail to yield to cross traffic ~40 units away — exactly the anti-gridlock situation the feature exists to prevent. Severity is bounded: this is the legacy fallback, reachable only when `this.trafficManager` is falsy (`_unpcs` returns early at `:11553`), and `TrafficManager` is constructed at `:7650`, so **in normal play this code is dead**. But the stated invariant is false, which is a trap. Either widen to 5×5 (covers `|Δ| ≤ 50 > 40`) or delete the legacy path.

---

### MATH-2-9 — OBB test uses 2 of 4 SAT axes: sound but incomplete
- **Location:** `game_core.js:11607-11610`
- **Severity:** tuning · **Confidence:** verified

**Current** tests only the vehicle's two axes. This is **sound** — if two OBBs are truly disjoint, some face normal of one of them separates them, and the vehicle's own two face normals are candidates, so a disjoint pair always yields `overlapX ≤ 0` or `overlapZ ≤ 0`. It is **not complete**: two boxes can overlap while being separated along a *player* face normal, producing phantom corner hits.

**Evidence** (rotation corrected to isolate the variable, 600,000 samples per type-pair sweep):
```
2-axis vs 4-axis SAT:  falseNeg = 0 (0.000%)   falsePos = 27955 (3.106%)
```
The 3.1% concentrates at near-corner configurations where `min(overlapX, overlapZ)` is tiny, so the visible effect is a spurious honk rather than a teleport. For axis-aligned yaw the test degenerates to an exact 2D AABB test.

**Notes.** The false-negative-free result holds only because the rotation is corrected here; with the rotation as coded, the same sweep reports 0 false negatives *because the sign error dominates* — that agreement is accidental and must not be read as soundness.

---

### MATH-2-10 — Tunneling: **REFUTED**
- **Location:** `game_core.js:10919` (integration), gates at `:11594`, `:12370`, `:12632`, `:12701`
- **Severity:** none · **Confidence:** verified (safe)

A discrete endpoint test misses an overlap only when the per-frame step exceeds `2 ×` the combined half-extent. Faithful re-simulation of the `_input` pipeline in source order (`VEHICLE_STATS` × highway × seatbelt × boost × cruise ∈ {0,180} × fps ∈ {20,30,60,120}, 900 frames each, `dt = min(1/fps, 0.033)`):
```
supercar_white + belt + boost + cruise=180 @ 20 fps -> 1.4511 units/frame  (worst case)
GLOBAL MAX = 1.4511 units/frame
```
Notably `gcap['D'] = 0.85` (`:2425`) and the clamp at `:10786` happens **before** cruise control at `:10799`, which then adds up to `cruiseSpeed/100 = 1.80` with nothing re-clamping — so the real ceiling is ~1.45, not the 1.925 that `maxSpd` alone suggests.

```
ped gate (12632) r=2.0          2x =  4.00  SAFE
checkpoint (195)   r=8          2x = 16.00  SAFE
collectible (233)  r=5          2x = 10.00  SAFE
obstacle pR=1.5 + min cone 0.3  2x =  3.60  SAFE
traffic OBB lateral min 0.95    2x =  1.90  SAFE  <- narrowest (ped vs bike)
traffic OBB along   min 1.45    2x =  2.90  SAFE
```
**Only 0.45 units of headroom** on the pedestrian-vs-bike pair. Two changes would erase it: raising the `maxSpd` ceiling, or disabling cruise control's reliance on the gear cap. Worth recording as a comment: *max per-frame step must stay below `2 × min(pedHalfW + bikeHalfW) = 1.90`.* (This bound is itself invalidated by `MATH-1-6`, which shows per-frame step should scale with `dt`.)

---

### MATH-2-11 — Verified correct *(no defect)*

- **`pProjW` / `pProjD` support extents** (`:11602-11605`) — **0 mismatches in 400,000 samples** against an independent dot-product derivation. The `Math.abs` wrapping makes these invariant to the `MATH-2-1` sign error, which is why the extents survive while the centre offsets do not.
- **Push direction** (`:11631-11633`, `:11639-11642`) — `dot = 1.000000`, always separating.
- **Obstacle-path local→world push basis** (`:12731-12742`) — correct; it is the detection frame that is wrong.
- **`road-graph.js`** — `getLaneOffsets()` (`:65-76`) is symmetric, so the misnamed `_right` (`:87`, which is actually cross(dir, up) = `(−dz, 0, dx)` = **left** at yaw 0) has no observable effect; flipping it would invert lane ordering for no benefit. `BuildingSlot.getRotation()` (`:154-161`) correctly uses `atan2(toRoad.x, toRoad.z)`. `getPointAt`/`subdivide` (`:78-82`, `:97`) are exact.
- **`world-streamer.js`** — load uses a Euclidean disc of `renderDistance`, unload uses Chebyshev `> bufferDistance`; the wider unload criterion is correct hysteresis ordering and cannot unload a needed chunk (verified `needed ⊆ Chebyshev ≤ 8 ⊂ Chebyshev ≤ 12`).
- **Checkpoint (`dist < 8`) and collectible (`dist < 5`) radii** — plain Euclidean gates, correct and not tunnelled at any reachable speed.
- **`proc_road.js`** — tangent normalised with a `|| 1` divide guard, perpendicular `(−dz, dx)` unit-consistent with the yaw convention. Sound.

## Phase 2 Not Reached
`proc_terrain.js` heightfield generation · NPC-vs-NPC collision *resolution* in `npc-ai.js` (MOBIL/IDM layer `:649-664`, `:962-979` — read for half-extent sourcing only) · `mission-manager.js` checkpoint spacing filter `:929-935` · no browser/runtime verification (read-only audit).

---

# Phase 4 — Scoring, Economy, Ranks & Statistics

`ui.js` (rank ladder, results, results flow), `game_core.js` (`completeLevel`, wallet), `TrafficDashboard.html` (leaderboards), `traffic-charts.js`, `wallet-history.js`.

> **Root cause threading this phase:** `MATH-4-1`. `fs` (final score) is an unbounded XP-like total, not a 0–100 percentage, and is printed with a `/100` suffix. Four downstream findings (`-12`, `-2`, and parts of `-13`) are consequences of that single scale conflation.

---

### MATH-4-1 — Certificate prints a raw XP total with a `/100` suffix ⚠️ ROOT CAUSE
- **Location:** `ui.js:4314` (`score: Math.round(score)`) → `:4369`, `:4420`
- **Severity:** correctness · **Confidence:** verified

**Current** `score === window.game.fs`, rendered as `` `${cert.score}/100` ``.

**Correct.** Either `score` must be a bounded 0–100 percentage, or the label must be an XP label with no `/100`.

**Evidence.** `game_core.js:4594` sets `this.fs = Math.max(0, Math.round(this.score + 500))`. `this.score` accrues from `_umode` (`score += dt`, `:12936`), near-miss awards `Math.round((20 + spd*60)/5)*5` every ~0.4 s, and drift `Math.round(_driftScore)`. Simulating the verbatim constants:
```
30 s at spd 12  ->  score = 18530   fs = 19030
120 s at spd 12 ->                   fs = 74620
certificate then prints "74620/100"
```
`ui.js:4123` itself concedes the scale: `score > 200 ? '🌟' : '⭐'`.

**Notes.** Two scales are conflated — `S.total` is displayed as XP with `toLocaleString()` (`ui.js:2128`, `game_core.js:4751`), while `fs` feeds the cert `/100`. **No code path normalizes `fs` to a percentage.** A fixer must decide which is canonical; simply clamping is wrong.

---

### MATH-4-2 — `avgScore` is permanently 0 because `S.scores` is never written
- **Location:** `ui.js:1066-1083`
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
if (S.scores) { for (const k in S.scores) { totalScore += S.scores[k]; count++ } }
const avgScore = count > 0 ? totalScore / count : 0;     // -> `${Math.round(avgScore)}%`
```

**Correct.** Either `S.scores` must be written on completion, or the average derived from `S.comp[lid].score`.

**Evidence — independently reconfirmed.** Repo-wide grep for `S.scores` returns exactly three hits, **all reads**:
```
ui.js:1068:  if (S.scores) {
ui.js:1069:  for (const k in S.scores) {
ui.js:1070:  totalScore += S.scores[k]
```
No assignment site exists in any `.js`/`.html` outside `dist/`. Therefore `count === 0` always, `avgScore === 0`, and the certificate renders **`0%`** and `COMPLETED WITH 0% PROFICIENCY` for a *perfect full playthrough*.

**Notes.** The divisor is arithmetically correct (the `count > 0` guard prevents div-by-zero) — the defect is the missing producer. If a fixer repoints this at `S.comp`, note the result is unbounded (`{100000, 60}` → `50030%`), so a clamp alone would still be wrong.

---

### MATH-4-3 — Rank progress bar computes from the pre-completion total
- **Location:** `game_core.js:4767`
- **Severity:** correctness · **Confidence:** verified

**Current** `Math.min(100, Math.max(0, Math.round(((_prevTotal - _newRank.min) / (_nextRank.min - _newRank.min)) * 100)))`

**Correct.** The numerator must be `_newTotal`, matching the denominator whose `_newRank`/`_nextRank` are both derived from `_newTotal`.

**Evidence.** The block computes `_newRank = _getRank(_newTotal)` and `_nextRank = tiers.find(r => r.min > _newTotal)`, then substitutes `_prevTotal` into the numerator:
```
prev=0     add=2500  -> bar shows   0   intended  50
prev=4000  add=2500  -> bar shows   0   intended  15
prev=20000 add=5200  -> bar shows  33   intended  68
prev=48000 add=5100  -> bar shows   0   intended   6
```
The bar shows the rank's fill *before* the level was played, so every non-promoting completion renders a stale or empty bar.

**Notes.** Display-only. The promotion toast (`_newRank.name !== _prevRank.name`) uses the correct values and is unaffected. Unlike `ui.js:1108`, the `Math.max(0, …)` here already clamps negatives.

---

### MATH-4-4 — `S.civicScore` accrues outside the idempotency guard; replays farm the full badge ladder
- **Location:** `ui.js:4007` (inside `_fq`, outside the `_counted` block spanning `:3991-3994`)
- **Severity:** correctness · **Confidence:** verified

**Current** `S.civicScore = (S.civicScore || 0) + civicGain` sits *outside* `if (S._counted !== _countKey)`, whereas the mirrored write at `:4060` sits *inside* it.

**Evidence.** Replaying level 3 with an identical `fs` of 4000 three times:
```
total = 4000 (frozen by the guard)    civicScore = 75   (+25 per replay)
```
Twenty such replays give `civicScore = 500`, satisfying the `at: 500` tier at `:4014` and awarding **`civic_platinum`, `civic_gold`, `civic_silver`, `civic_bronze` from a single completed level.**

**Notes.** The asymmetry is invisible on the happy path: the first play adds civic in `_fq` (`:4007`) and the immediately-following `showResults` skips both (guard matches), so the net is correct exactly once. The bug surfaces only on re-entry. `S._counted` is persisted by `save()`, so the frozen-total half survives reloads while the civic half keeps climbing.

---

### MATH-4-5 — `_counted` is a single scalar, so any replay with a *different* score double-adds to `S.total`
- **Location:** `ui.js:3990-3994`, `:4054-4061`
- **Severity:** gameplay · **Confidence:** verified

**Current**
```js
const _countKey = lv.id + ':' + finalScore;
if (S._counted !== _countKey) { S._counted = _countKey; S.total = (S.total||0) + finalScore }
```
One remembered key, overwritten each time.

**Correct.** Guard on `levelId` alone for the total accrual, or recompute `S.total` as `sum(Object.values(S.comp).map(c => c.score))`.

**Evidence**
```
L1@1000 then L1@9000        -> S.total = 10000 for ONE level
                                (S.comp[1].score correctly stays max(1000,9000) = 9000 via :4049)
L1@1000, L2@1200, L1@1000    -> S.total = 3200
```
`S.total` diverges from `S.comp` by 1.5× in the two-replay case. The `Math.max` used for `S.comp` is the correct pattern.

**Notes.** Because `fs` is time-driven (`MATH-4-1`), every replay produces a slightly different score, so the identical-score suppression the guard *does* provide is nearly unreachable in practice.

---

### MATH-4-6 — Three of six `S.total` write sites have no idempotency guard
- **Location:** `task-manager.js:285`, `mission-manager.js:1631`, `ui.js:6148`
- **Severity:** gameplay · **Confidence:** verified

**Current** `S.total += (task.xp || 25)` / `window.S.total += xp` / `S.total += reward.amount`

**Correct.** Non-level XP grants need their own once-only key, or a separate accumulator summed at read time.

**Evidence** — all six write sites enumerated:
```
ui.js:205                dev unlock, unguarded by design
ui.js:3993               guarded by _counted
ui.js:4057               guarded by _counted
ui.js:6148               grantMysteryReward, NO guard (2 of 5 rewards are xp: 500/1000)
task-manager.js:285      _completeTask guards on task.completed, which is per-instance
                         and resets when the task list is regenerated
mission-manager.js:1631  _grantCampaignRewards, no completion guard at the call site
```
These mix non-level XP into the same accumulator that `getDriverRank` and the `_rankTiers` ladder read, so rank progression is inflated by sources unrelated to driving skill.

---

### MATH-4-7 — `getDriverRank` progress goes negative for negative totals
- **Location:** `ui.js:1108`
- **Severity:** tuning · **Confidence:** verified

**Current** `Math.min(100, Math.round(((totalScore - current.min) / (next.min - current.min)) * 100))`

**Correct.** Clamp both ends: `Math.min(100, Math.max(0, …))`.

**Evidence** `score = -1000 → progress = -200`; `score = -1 → progress = 0`. The upper clamp is present, the lower is not. Band selection is sound for negatives — no `RANKS[i].min` is ≤ −1, so `current` stays `RANKS[0]` and `next` stays `RANKS[1]`, yielding the −200.

**Notes.** Two adjacent suspicions **retracted**: the `RANKS` table *is* strictly monotonic (`0, 500, 2000, 5000, 10000, 20000`) with no zero-width band, so `next.min - current.min` is never 0 — no divide-by-zero. And the `max` fields are exactly contiguous with the next tier's `min` (`499/500, 1999/2000, 4999/5000, 9999/10000, 19999/20000`), so the dual representation is self-consistent. Whether negative totals are reachable depends on whether `showResults` can receive a negative `score`; `fs` is `Math.max(0, …)` so the driving path cannot produce one.

---

### MATH-4-8 — `getDriverRank` returns `NaN` progress for a `NaN` score
- **Location:** `ui.js:1108`
- **Severity:** correctness · **Confidence:** verified

`getDriverRank(NaN)` → `{current: 'learner', progress: NaN}` (verified: JSON-serializes to `null`). Rendered into a progress-bar `width`, `NaN%` is an invalid CSS length and the bar collapses. Note `S.total || 0` already coerces `NaN → 0` on the default path (since `NaN` is falsy); the exposure is the explicit-argument path. `getDriverRank("3000")` works correctly (comparison operators coerce), so this is a narrow edge case, not a general string-input hazard.

---

### MATH-4-9 — Collectible rupees are itemized on the reward screen but never credited to the wallet
- **Location:** `game_core.js:4604-4614` vs. reward rows at `:4676-4677`
- **Severity:** correctness · **Confidence:** verified

**Current** `S.wallet += _reward` where `_reward = _baseRew + _noViolBonus` (`:4607`). `_collV = (_mm && _mm.totalReward) || 0` (`:4612`) is used **only for display** at `:4676`.

**Correct.** `S.wallet += _reward + _collV` (and `_tokEarn`), or mark those rows informational.

**Evidence.** `_onCollectibleCollected` (`mission-manager.js:1390-1397`) credits `this.game.rupees` and `this.game.playerScore` — **not** `S.wallet`. `this.game.rupees` is initialized *from* `S.wallet` at `game_core.js:6375` and never read back into it. Computed with `baseRew=2000, bonus=800, collectibles=3000, fines=0`:
```
reward screen itemises  +5800
actual wallet delta      +2800     -> 3000 unaccounted
```
`WalletHistory.earn` is likewise called only for `_reward` (`:4608`), so the ledger matches the wallet but contradicts the on-screen breakdown the player is shown. `_tokEarn` has the same problem.

---

### MATH-4-10 — Wallet is poisoned to `NaN` when `_lvId` is non-positive or non-numeric
- **Location:** `game_core.js:4605`
- **Severity:** correctness · **Confidence:** verified

**Current** `const _baseRew = _rewards[Math.min(_lvId - 1, 14)];`

**Correct.** Clamp both ends: `_rewards[Math.min(Math.max(_lvId - 1, 0), _rewards.length - 1)]`, and `Number.isFinite` the result.

**Evidence**
```
_lvId = 0     -> idx = -1  -> _rewards[-1] === undefined -> _reward = NaN -> S.wallet = NaN
_lvId = -1    -> same
_lvId = NaN   -> same
_lvId = 1.5   -> idx = 0.5 -> fractional index -> undefined -> NaN
```
Once `S.wallet` is `NaN`, every subsequent `+=` and `Math.max(0, …)` stays `NaN` (`Math.max(0, NaN)` returns `NaN`), so the floor at `:4611` offers no protection, and `toLocaleString('en-IN')` renders `"NaN"`.

**Notes.** **Latent, not live** — verified that all 54 numbered levels declare `id: 1..54` plus `level_freeram.js` at `id: 99`. The upper clamp is already correct and caps ids 15+ to ₹6000. The realistic trigger is a level object with a missing or string `id`, since `_lvId` derives from `ui.cur ? ui.cur.id : 1` (`:4589`).

---

### MATH-4-11 — Level-count thresholds drift from the catalogue (52 vs 54)
- **Location:** `ui.js:1064`, `:1171`, `:4002-4003`, `:4099-4100`, `:4134`
- **Severity:** correctness · **Confidence:** verified

**Current** `const totalLevels = 52`; `completedCount >= 52` → `level_52` and `traffic_hero`; `${lv.id} / 52`.

**Correct.** All progression gates should read `LEVEL_CATALOG.numberedTotal`, as `TrafficDashboard.html:1793` already does.

**Evidence — independently reconfirmed**
```
level-catalog.js:7            numberedTotal: 54   (total: 57 with 3 bonus entries)
TrafficDashboard.html:1793-5  LEVEL_TOTAL = LEVEL_CATALOG.numberedTotal  = 54  (fallback 53)
Academy.html:7293             const totalLevels = rawLvs.length || 54
ui.js:1064                    const totalLevels = 52            <-- outlier
ui.js:1171                    const totalLevels = LVS.length || 55   <-- a THIRD value
ui.js:4002, 4003, 4099        completedCount >= 52
```
Net effect: `level_52` and `traffic_hero` fire **two levels early**, and `ui.js:1077` unlocks the in-app certificate at 52/54 while the dashboard withholds it at 54/54. `estimateMilestoneBadges` (`TrafficDashboard.html:3231`) uses `LEVEL_TOTAL`, so it yields 4 badges at both 52 and 53 but **6 at 54** — a discontinuity exactly where the constants disagree.

**Notes.** A fixer changing 52 → 54 must also reconcile `ui.js:1171`'s `LVS.length || 55` and the separate `lv.id / 52` result-card literal at `:4134`.

---

### MATH-4-12 — Platinum/Gold mastery tiers: the `score >= 90` term is unreachable
- **Location:** `ui.js:1184-1187`
- **Severity:** tuning · **Confidence:** verified

**Current** `if (vio === 0 && score >= 90) platinum; else if (vio === 0) gold; else if (vio <= 1) silver; else bronze`

**Correct.** Express the threshold in the units `score` actually carries, or drop the score term.

**Evidence.** `fs = Math.max(0, Math.round(this.score + 500))`, so any completed level has `fs >= 500`, which always satisfies `score >= 90`:
```
{95, 0}    -> platinum
{60, 0}    -> gold        <- unreachable in practice
{100000,0} -> platinum
{100000,1} -> silver
{100000,3} -> bronze
```
The effective rule collapses to `vio === 0 ? platinum : vio <= 1 ? silver : bronze` — **Gold is unreachable**, and a level with one violation and `fs=100000` ranks *below* one with a trivial `fs` and none.

**Notes.** Directly downstream of `MATH-4-1`. The same `vio`-only ladder is independently reimplemented in `showResults` via the `_stars` ternary at `game_core.js:4601`, so the two mastery displays cannot be reconciled without picking one scale.

---

### MATH-4-13 — Retry penalty is non-monotonic: retry spam raises the score
- **Location:** `game_core.js:4589-4594`
- **Severity:** gameplay · **Confidence:** verified

**Current**
```js
let finalBase = this.score + 500;
if (this.retries > 0) { if (this.vio > 0) { finalBase = Math.round(finalBase * 0.5); } }
this.fs = Math.max(0, finalBase)
```

**Correct.** The penalty should reduce the reward for the attempt, not be dilutable by re-accumulating score.

**Evidence.** `this.score` is reset to 0 on each `retryLevel` (`_actualStart`, `:3391`) but refills from `score += dt` plus near-miss/drift awards, so longer total playtime raises the pre-penalty base. Computed with `vio = 1`:
```
retries=0            -> fs = 500
retries=1, 30 s      -> fs = 265    (penalty bites)
retries=50           -> fs = 1000   (penalty fully offset)
retries=500          -> fs = 7750
```
With `vio = 0` the penalty **never applies at all** — `retries ∈ {0,1,5,50,500}` all yield `fs = 500`.

**Notes.** The 50% halving itself has no rounding bias — `Math.round(x*0.5) === x/2` for all non-negative integers (verified on 1, 3, 5, 7, 9, 501, 999, 1001, 56789, 123457). The `_completing` re-entrancy guard at `:4549` was also checked and is **sound**: `retryLevel` → `_actualStart` resets `this._completing = false` at `:3394`, so the 450 ms re-entry at `:4558` is not blocked. *Retracting that suspicion.*

---

### MATH-4-14 — `createSparkline` produces `NaN` x-coordinates for single-point series
- **Location:** `traffic-charts.js:421`
- **Severity:** correctness · **Confidence:** verified

**Current** `const x = padding + (i / (data.length - 1)) * (width - padding * 2)`

**Correct.** Guard the degenerate case: `const denom = Math.max(1, data.length - 1)`.

**Evidence** `data.length === 1` → `i / 0 = 0/0 = NaN` → `ctx.moveTo(NaN, y)`, silently dropped, sparkline renders nothing.
```
n=0 -> []      (correctly short-circuited by the !data.length return at :411)
n=1 -> [NaN]
n=2 -> [4, 296]
n=5 -> [4, 77, 150, 223, 296]
```
The neighbouring `const range = max - min || 1` guard (`:415`) already handles the analogous flat-series division, so the omission is inconsistent rather than deliberate. Trigger: a one-element array in a `data-chart-data` attribute (parsed at `:458`).

**Also found here:** `createRadialProgress` (`:380`) over-rotates for `progress > 100` (`progress=150 → endAngle = 7.854 rad`, a full turn plus 90°) and prints a `150%` label, so callers must clamp. `createProgressRing` (`:271`) self-corrects via `Math.max(0, 100 - value)`.

---

### MATH-4-15 — Percentile label conflates dense rank with player position
- **Location:** `TrafficDashboard.html:2985`, displayed at `:2993`
- **Severity:** gameplay · **Confidence:** verified

**Current** `const percentile = totalPlayers > 1 ? Math.round(((totalPlayers - yourRank) / (totalPlayers - 1)) * 100) : 100` → `Top ${100 - percentile}%`

**Correct.** Derive the percentile from the player's row index, or state the tie semantics explicitly.

**Evidence.** With 5 players where 4 tie for 1st, the last player has `yourRank = 2`, `percentile = round(3/4*100) = 75`, and the card reads **`Top 25%`** — for someone genuinely in the bottom 20% of the field. Endpoints are correct for tie-free data (`#1 → Top 0%`, `#10 of 10 → Top 100%`), so the defect appears only once ties exist.

**Notes.** Two suspicions **retracted**. (a) The rank ladder at `:2935` is *not* competition ranking — verified genuinely **dense**: `[500,500,500,100] → [1,1,1,2]`, `[500,400,400,300,300,300] → [1,2,2,3,3,3]`, `[0,0,50] → [1,1,2]`, and order-independent (feeding `[100,300,200]` unsorted still yields `[1,2,3]`). The `_lk === null` sentinel misfires only if the first key is literally `null`, but all four `keyOf` wrappers coerce with `|| 0`, so it is unreachable. (b) Name escaping is sound — `escLb` (`:1785`) is applied at `:2955`, `:2986`, `:3048`; podium colouring by place is correct (`places = [[users[1],2],[users[0],1],[users[2],3]]` keyed on place, so a lone `#1` gets gold). Two raw interpolations remain at low risk: `metric(u)` at `:3076` (numeric only) and `data-user-id="${u.user_id}"` at `:3071` (a uuid).

---

### MATH-4-16 — `WalletHistory.balance` records the post-mutation balance
- **Location:** `game_core.js:4608`/`:4612` → `wallet-history.js:38`
- **Severity:** tuning · **Confidence:** verified

`S.wallet += _reward` executes, *then* `WalletHistory.earn(...)` whose `log()` reads `balance: (window.S && window.S.wallet) || 50000`. Every recorded `balance` is therefore the new balance, so the first-ever earn logs the *post-reward* figure with no prior transaction to diff against.

**Notes.** The float-drift hypothesis in this area is **retracted**: every wallet addend is a literal integer — `_rewards` = `[2000…6000]`, `_noViolBonus ∈ {800, 300, 0}`, `fine ∈ {5000, 1000, 2000, 500}`, collectible `value ∈ {100, 500, 1000}`, campaign `{15000…60000}`, mystery `{5000}`. Verified all-integer, so `S.wallet` cannot accumulate IEEE-754 error and **no rupee amount is ever derived from a float score**. Separately, `getSummary().net` (`wallet-history.js:85`) intentionally excludes the ₹50000 starting balance, so `net !== S.wallet` — arithmetically correct, but worth confirming no caller assumes equality.

---

## Phase 4 Verified Correct

`getDriverRank` RANKS monotonicity and band continuity (`max+1 == next.min` at all 5 boundaries ⇒ no div-by-zero) · dashboard dense-rank ladder (`:2935`) · dashboard podium place→colour mapping · `escLb` name escaping at all three leaderboard sites · dashboard percentile endpoints for tie-free data · `Math.round(x*0.5) == x/2` (no banker's-rounding bias) · wallet integer-exactness · `_completing` re-entrancy guard · `_rewards` upper clamp · `createProgressRing` self-clamping · `getModuleProgress` percent guard (`course.js:1066`) · `getCampaignProgress` prerequisite logic (`course.js:960`).

## Phase 4 Not Reached
Supabase `public_profile_directory` RPC definition and its `ORDER BY` (not in repo — cannot confirm the RPC returns rows in a deterministic order, which the dense rank depends on for *display* order though not for rank *values*) · `checkpoint-system.js` and `collectible-system.js` exist only under `Traffic/dist/` with no source counterpart, so their math is generated output · multi-line `_rateLimiter` / Supabase retry math outside scoring scope · `react-src/GamePage.tsx` bundled simulator path.

---

# Phase 5 — Missions, Tasks & Scenarios

`task-evaluators.js`, `task-manager.js`, `mission-manager.js`, `scenario2d.js`, `src/systems/MissionManager.ts`, `collectible-system.js`, `checkpoint-system.js`, `levels/*.js`, `game_core.js:4237-4400` (`_checkTasks`).

## Contract check: `validate-levels.js` ↔ `_checkTasks` — **IN SYNC**

AGENTS.md requires these to stay in sync. Verified three independent ways:
1. All 19 `INLINE_TASK_TARGETS` entries exist verbatim in the `_checkTasks` switch (`game_core.js:4241-4350`).
2. The linter's `EVALUATOR_TARGETS` regex extracts **44** keys and misses **0** of the 44 in the `evaluators` object literal (confirmed by independent literal scan). The keys are *read from* `task-evaluators.js`, not duplicated — structurally robust.
3. Enumerating all 57 level definitions yields **0** task keys with no inline branch and no evaluator, **0** unknown task types, and `unhandled-task-targets.js` lists **0** entries.

No legacy-backlog entries are implicated in this contract — AGENTS.md's "legacy backlog" refers to the linter's *other* checks (spawn clearance, route-on-road, cast roster), not the target tables.

**What the linter structurally cannot catch, and this audit found:** branch *reachability* (`MATH-5-2`, `MATH-5-5`, `MATH-5-24`), the `...config` clobber upstream of every mission (`MATH-5-4`), and `themeType` vocabulary drift in three non-linted consumers (`MATH-5-6`, `MATH-5-17`, `MATH-5-22`).

---

### MATH-5-4 — Every `Mission` subclass clobbers its own `data` defaults ⚠️ HIGHEST IMPACT
- **Location:** `mission-manager.js:222-810` (all nine subclasses); e.g. `EscortMission` `:222-239`
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
super('ESCORT', { target: …, reward: …,
  data: { leadVehicle:null, minDistance:10, maxDistance:35, intersectionsCleared:0,
          targetIntersections: …, ...config.data },   // <- defaults first...
  ...config })                                          // <- ...then clobbered
```

**Correct.** `...config` must come **before** the `data:` key, or `data` must be re-merged after. Every factory in this file passes `data`, so `...config.data` unconditionally replaces the whole defaults object.

**Evidence** — factory calls reproduced verbatim in Node:
```
ESCORT          -> ['targetIntersections','route']; minDistance/maxDistance/intersectionsCleared = undefined
                  => 5 < undefined false, 500 > undefined false, 4 > undefined false
                  => fail branches DEAD, completion UNREACHABLE
CHASE           -> catchDistance undefined => 0 < undefined false (never catches)
                  chaseTime undefined => undefined + 0.016 = NaN => NaN > maxChaseTime false
                  => never times out either. Permanently uncompletable AND failure-immune.
PARKING         -> maxDeviation/maxAngleDeviation/parked undefined => 0 < undefined false => never completes
CARGO           -> undefined - 15 = NaN; Math.max(0, NaN) = NaN; this.progress = NaN
                  => NaN <= 0 false (never fails), NaN >= distanceTarget false (never completes)
                  => NaN progress leak
CROSSING_GUARD -> childrenCrossed undefined => undefined++ = NaN => Math.min(NaN,5) = NaN
                  => NaN >= targetChildren false => never completes; toast renders (NaN/4)
SIDEWALK_PATROL -> violationsReported undefined => NaN => never completes
SCHOOL_PATROL   -> speedersCaught undefined => NaN => never completes
PASSENGER_PICKUP-> stage undefined => all three if (stage === …) false => update() is a no-op forever
EVASION         -> survives by luck (completes via safe-zone test)
EMERGENCY_CLEAR -> survives because !undefined === true
```

**Notes.** The `Mission` base class is fine; only the subclasses' constructor argument ordering is broken. Because `MissionManager.update()` skips `status !== 'active'`, a NaN-progressed mission can never recover. Combined with `MATH-5-6`, the themed-mission layer is entirely non-functional.

---

### MATH-5-6 — Six of nine themed mission types are permanently uncreatable
- **Location:** `mission-manager.js:1028`, `1044`, `1060`, `1076`, `1093`, `1111`, `1139`
- **Severity:** gameplay · **Confidence:** verified

**Current** `if (!['emergency_access', 'bonus_vip_convoy', 'highway_discipline'].includes(theme)) {return null;}` (and six similar gates).

**Correct.** Gate names must be drawn from the actual `themeType` vocabulary. The **40** real values are: `ambulance_priority, animals, auto_dance, blind_corner, bus_stop, construction, cyclist, driving_school, festival, free_roam, grand_test, highway_merge, hill_driving, hospital_quiet, intersection_mastery, lane_discipline, market_street, mountain, multi_modal, narrow_street, night_monsoon, no_honking, one_way, parking_rules, pedestrian_courtesy, pedestrian_priority, puddle_etiquette, rain_driving, respectful_parking, road_rage, rural, signal_jump, signs, silent_zone, street_parking, suburban_neighborhood, toll, urban_grid, wrong_side, zero_visibility`.

**Evidence** — gate-name intersection with real themes:
```
ESCORT 0 · CHASE 0 · CARGO 0 · EVASION 0 · EMERGENCY_CLEAR 0
PARKING: 2 matches (L5, L14 — both pedestrian_courtesy) but both nulled by
         `if (levelConfig.isPedestrian) return null` at :1061 (neither sets isPedestrian)
CROSSING_GUARD: 2 matches, both nulled by `if (!levelConfig.isPedestrian) return null` at :1109
=> 6 of 9 themed mission types can NEVER be constructed
```
Only `SCHOOL_PATROL` (matches L5/18/40/50), `SIDEWALK_PATROL` (needs `isPedestrian` — **no level declares it**), `PASSENGER_PICKUP` (matches L1/5/54/custom/99) and `EMERGENCY_CLEAR` survive to construction — and of those only `EMERGENCY_CLEAR` works.

**Notes.** The gates appear to predate a theme rename applied to level files only. Same failure mode as `MATH-5-17` and `MATH-5-20`: three independent `themeType` consumers, three different key vocabularies, one source of truth.

---

### MATH-5-2 — `avoid/speed` is unfailable on levels 40 and 48
- **Location:** `task-evaluators.js:149-164` vs `game_core.js:6170-6176`, `:10800-10804`
- **Severity:** gameplay · **Confidence:** verified

**Current** fail branch `if (Math.abs(game.speed) > cap)` with `cap = speedCapFor(...) = 0.28`. But `game_core.js:6170` derives `speedLimit = cfg.speedLimit || (cfg.hasSchool ? 25 : …)` and `:6175` auto-enables `speedLimiter` on `hasSchool || hasHospital || isRural || speedLimit`, then `:10801` clamps `speed = (speedLimitCap || 50) / 100`.

**Correct.** A fail-cap objective needs `cap > min(limiterCap, maxSpd)`, or a per-level `taskSpeedCap` — the escape hatch at `task-evaluators.js:791` that **zero** levels use.

**Evidence**
```
L40 (hasSchool + hasHospital) -> speedLimit 25 -> limCap 0.25 ; objective cap 0.28 -> FAILS NEVER
L48 (isRural)                 -> speedLimit 25 -> limCap 0.25 <  0.28 -> FAILS NEVER
L37 (hasHospital)             -> speedLimit 30 -> limCap 0.30 >  0.28 -> failable by only 0.02
all other 9 avoid/speed levels: limiter off, ceiling 1.10
```
Sign handling is safe (`Math.abs`, reverse-safe). Note the code's own comment at `:781-783` reasons about this interaction for `mapCfg.speedLimit` but misses `speedLimiter`, which is the harder clamp.

---

### MATH-5-1 — `speedCapFor` converts km/h with the wrong divisor (27.8×) *(latent)*
- **Location:** `task-evaluators.js:790-798`
- **Severity:** correctness · **Confidence:** verified — **latent, not live**

**Current** `return Math.max(0.1, cfg.speedLimit / 3.6);`

**Correct.** `/ 100`. The engine's own convention is `×100`, corroborated at four independent sites: `game_core.js:10793` `cruiseSpeed / 100; // convert km/h → internal units`, `:10801` `speedLimitCap / 100`, `:11035` `Math.round(Math.abs(this.speed) * 100)` labelled km/h, `:2442` same. So `100/3.6 = 27.78×` overshoot.

**Evidence** `speedLimit: 40` → cap `11.11` internal units, versus a correct `0.40`. Highest `maxSpd` in `VEHICLE_STATS` is `1.75`. **Latent:** all 12 levels declaring `avoid/speed` (23, 25, 27, 30, 31, 34, 36, 37, 40, 44, 45, 48) and none of the 15 inlined maps declare `speedLimit`, so `speedCapFor` always returns the `0.28` default. The moment any level pairs them, the objective becomes unfailable — the live instance of this defect class is `MATH-5-2`.

---

### MATH-5-3 — `reach/safe_distance` inverts the "ahead" axis vs `avoid/safe_distance`
- **Location:** `task-evaluators.js:576-594` vs `:400-416`
- **Severity:** correctness · **Confidence:** verified

**Current** `reach/safe_distance`: `const ahead = pp.z - pos.z; if (ahead <= 0 || ahead > 30) return;`
**Current** `avoid/safe_distance`: `const dz = pp.z - pos.z;  // positive => the vehicle is behind us` / `const ahead = -dz;`

**Correct.** Engine forward is **+z** — `game_core.js:10916` `targetVz = Math.cos(yaw) * this.speed − …` with `speed > 0` forward, and `:10919` integrates it, so `position.z` **increases** going forward. Therefore *in front* ⇔ `pos.z > pp.z`. `avoid/safe_distance` is correct; `reach/safe_distance` is the exact negation.

**Evidence** Vehicle 10 units in front (`pos.z = pp.z + 10`): `avoid/safe_distance` sees `ahead = +10` (considers it); `reach/safe_distance` sees `ahead = -10` → `ahead <= 0` → **skipped**. Vehicle 10 units *behind*: `reach/safe_distance` sees `+10` → treated as in front. So level 22 ("Give an aggressive driver space") can only be completed by a vehicle **behind** the player.

**Notes.** `avoid/overtake` was suspected and is **correct** on this axis (`wasAhead = prev > pp.z`, `nowBehind = pos.z < pp.z`). `game_core.js:4201` carries a stale comment ("player is ahead (smaller z)") contradicting the engine, but that test is lateral (`px > n.position.x`), so it's a comment defect, not a sign bug. `avoid/overtake` does store `_ov_<key>` per-vehicle state with no eviction, so `game.npcs` positional keys churn unboundedly.

---

### MATH-5-5 — `updateProgress()` and the explicit check both fire `onComplete` in the same frame
- **Location:** `mission-manager.js:543-551` / `:586-594` / `:676-684`
- **Severity:** correctness · **Confidence:** verified

**Current** `this.data.childrenCrossed++; this.updateProgress(this.data.childrenCrossed); … if (this.data.childrenCrossed >= this.data.targetChildren) { this.status = 'completed'; if (this.onComplete) this.onComplete(this); }`

**Correct.** `updateProgress` (`:200-206`) *already* sets `status='completed'` and calls `onComplete`. Call it from one place only.

**Evidence** `createCrossingGuardMission` sets `target: 5` but `targetChildren: 4 + floor(rand*3)` ∈ {4,5,6}. When `targetChildren = 5`, the 5th group completes via `updateProgress` (**#1**) then again via `>= 5` (**#2**) in the same frame. Node-verified: `tc=4→1 call, tc=5→2 calls`. Same for `SIDEWALK_PATROL` (`target: 3`, `targetViolations ∈ {2,3}`) and `SCHOOL_PATROL` (`target: 3`, `targetSpeeders ∈ {2,3}`). For `targetChildren = 6` the mission completes at **5/6** and locks out, so 6/6 is unreachable.

**Notes.** `_grantMissionTokens` is guarded by `mission._tokensGranted`, so tokens are safe — that guard is the only thing between this and a double payout. `onComplete` is currently `null` for every factory, so live blast radius is a double toast.

---

### MATH-5-11 — All task dwell/threshold timers are frame counts, not dt-scaled
- **Location:** `task-evaluators.js:86-90` (`dwell`) and every call site; `task-manager.js:105-106`, `218-220`, `236-241`; `game_core.js:4302-4308`, `:10590-10592`
- **Severity:** gameplay · **Confidence:** verified

**Current** `function dwell(task, key, dtFrames, required) { task[k] = (task[k]||0) + (dtFrames || 1); return task[k] >= (required || 30); }` — and **every** call site passes the literal `1` (`dwell(task,'speed',1,20)`, `dwell(task,'gap',1,90)`, `dwell(task,'weather',1,150)`). `game_core.js:10509` calls `this._checkTasks()` with **no `dt` argument at all**.

**Correct.** Accumulate `dt * 60` against a seconds-valued threshold. The rest of the engine gets this right — `:10770`, `:10780` (`Math.pow(this.fric, dt*60)` with the comment *"makes 0.945 feel identical at 30fps and 120fps"*), `:10786`. `_checkTasks` and `TaskManager` are the outliers.

**Evidence**
```
dwell(...,1,150)  ->  2.50 s @60fps   5.00 s @30fps   1.04 s @144fps
task-manager.js:220  (>90 frames)  ->  1.50 s @60fps   3.00 s @30fps
game_core.js:10591  ("~5s / 300 frames")  ->  5.0 s @60fps  10.0 s @30fps
```
So `avoid/weather_fail` (150 frames) is a **1.04 s** objective on a 144 Hz laptop and a **5.00 s** objective on a 30 fps phone. Also `avoid/speed` and `avoid/violation` accumulate `_dist_speed` by `Math.abs(game.speed)` per **frame**, so the "25 units of ground covered" gate is itself frame-rate dependent — it fires after 158 frames (1.1 s) at 144 fps and 759 frames (25.3 s) at 30 fps.

**Notes.** Double-counting within a frame is **not** possible — `t.done` (`game_core.js:4388`) and `task.completed` (`task-manager.js:279-281`) both latch immediately. The `avoid` family correctly latches failure permanently, which is the right polarity.

---

### MATH-5-7 — TS port diverges on `SchoolPatrolMission.schoolZone`
- **Location:** `src/systems/MissionManager.ts:866-873` vs `mission-manager.js:1150-1168`
- **Severity:** correctness / divergence · **Confidence:** verified

**Current (TS)** `data: { targetSpeeders: 2 + floor(rand*2), schoolZone: { x: 0, z: 0, radius: 60 } }`
**Correct (JS)** `const zx = levelConfig.schoolX ?? (last ? last.x : 0); const zz = levelConfig.schoolZ ?? (last ? last.z : 0); … schoolZone: { x: zx, z: zz, radius: 60 }`

**Evidence** L5 declares `schoolX: 436, schoolZ: 600`. JS resolves to `(436, 600)`; **TS resolves to `(0, 0)` — a 636-unit displacement.** L18/40/50 declare `(-60, -32)`, so TS is off by 60/32. `SchoolPatrolMission.update` tests `dist < 60` around `schoolZone`, so the TS port checks the map origin instead of the school.

**Notes.** The seven `includes(theme)` gate lists are **byte-identical** between JS and TS — this is the only semantic divergence found. The TS file carries the same `...config` clobber (`MATH-5-4`) at `:154-166`. `src/game/Scenario2D.ts` is a **1.9 KB stub** with no `SCENARIOS`, no camera, no particles — not a port of the 1,031-line `scenario2d.js`. `p95` telemetry does not exist anywhere under `src/`.

---

### MATH-5-15 — `TaskManager` speed task is `> 5 && <= 55 km/h`, described as "under 50 km/h"
- **Location:** `task-manager.js:230-243` (also `:178`)
- **Severity:** tuning · **Confidence:** verified

**Current** `desc: 'Keep vehicle speed under 50 km/h…'` … `const spdKmh = g.speed * 3.6; if (spdKmh > 5 && spdKmh <= 55) { … return this.speedComplianceFrames > 90; }`

Two independent defects. **(a) Scale:** the `×3.6` is the same wrong divisor as `MATH-5-1` — the engine's scale is `×100`. `g.speed = 0.28` renders as `1.0 km/h` here, not the 28 km/h the HUD shows, so `spdKmh > 5` requires `g.speed > 1.39`, which is **above every `maxSpd` in `VEHICLE_STATS` (max 1.75) for the car (1.10)**, and above the bike (1.35). L1's `speedLimit: 40` → cap `0.40` → `spdKmh = 1.44`; bike `1.35 × 3.6 = 4.86 < 5`. **`speed_control` can never complete on any vehicle.** **(b) Bound:** 55 ≠ the declared 50. Also `laneComplianceFrames > 90` (`:220`) gates on `spd > 2` internal units, exceeding every `maxSpd` — so the `lane_discipline` fallback task is also unreachable.

---

### MATH-5-16 — `timeLimit` is 16–70× the flat-out minimum on 14 of 15 mapped levels
- **Location:** `game_core.js:4882-5005` (inlined maps 1–15); `levels/level1.js`, `level5.js`, `level54.js`, `level_custom.js`
- **Severity:** tuning · **Confidence:** verified

**Evidence** (`minTime = routeLength / (vmax × 60)`; car `maxSpd = 1.10` u/frame ⇒ 66 u/s; pedestrian `0.12` ⇒ 7.2 u/s)
```
L1  len  284.7 ->   4.31 s vs 300 s   (70x)
L5  len 1284.9 ->  19.47 s vs 360 s   (18x)
L54 len  177.0 ->   2.68 s vs 150 s   (56x)
custom_downtown 600.0 -> 9.09 s vs 360 s   (40x)
Maps 2-15: L2 2880u -> 400.0 s walking vs 720 s (1.8x; 4.0x walking+shift — the ONLY
          genuinely binding one, and correctly so for a pedestrian level)
          L3 16x  L4 18x  L6 21x  L7-L10 16x  L11-L12 50x  L13-L14 28x  L15 16x
```
Levels 16–54 plus `custom`/`99` declare **no** `timeLimit`, so `:6166` applies `cfg.timeLimit || 120`. `timeLimit: 999999` on the free-roam config is intentional.

**Notes.** Only **5** of 57 levels declare `route` and only **6** declare `roads`; the 15 inlined maps supply `route`/`roads`/`timeLimit` for ids 1–15. The `roadLength` (700/1400/320) vs route-length "mismatch" was flagged and **retracted** — different quantities, and every declared route fits inside its road extent.

---

### MATH-5-17 — `Scenario2D` silently falls back to the wrong intro for 15 of 40 `themeType`s
- **Location:** `scenario2d.js:46-469` (`SCENARIOS`), `:812-813` (`play`)
- **Severity:** gameplay · **Confidence:** verified

**Current** `const scenario = SCENARIOS[themeType] || SCENARIOS.default` with `SCENARIOS.default = SCENARIOS.signal_jump`.

**Evidence** `SCENARIOS` has **27** keys; `themeType` has **40** values. Unmapped → silently renders the **red-light-patience** intro:
```
driving_school(L52) hospital_quiet(L37) intersection_mastery(custom_downtown)
lane_discipline(L51) market_street(L10) mountain(L47) multi_modal(L49)
night_monsoon(L41) no_honking(L11,16,20) parking_rules(L28)
pedestrian_priority(L24) rural(L48) suburban_neighborhood(L54,custom)
urban_grid(L53) wrong_side(L42)
```
**15 of 40 themeTypes, covering 18 of 57 level definitions (32%).** L11/L16/L20 — three "do not honk" lessons — get a red-light intro; L41 (`night_monsoon`) gets a daylight one. Conversely `SCENARIOS.night_driving` is **never selected** — the one orphaned entry.

---

### MATH-5-14 — Time-limit expiry reports the wrong crash reason
- **Location:** `game_core.js:13915` → `:4484-4503` (`_go`)
- **Severity:** gameplay · **Confidence:** verified

**Current** `this._go("Structural Failure")`, while `_go(reason)` selects legal copy by substring: `if (rLower.includes('time')) { rLife = "Time Management is crucial…"; }`

**Evidence** `"structural failure".includes('time')` → `false`. The time-expiry path always renders the generic `Sec279 IPC / rash driving` or structural-damage copy, so the time-up legal text is **dead**. The toast string also carries a mojibake character, consistent with an encoding defect in the same edit.

**Notes.** `rem = Math.max(0, Math.ceil(tl - this.timer))` is correctly clamped and zero-based; `this.timer += dt` accumulates the victory-slow-scaled but **pre-hitstop** `dt`, which is the right choice for a wall-clock timer. The claim "`timeLimit` is never enforced" is **retracted** — `:13915` does fail the run.

---

### MATH-5-8 — `ParkingMission` treats any negative speed as "stopped" *(latent)*
- **Location:** `mission-manager.js:365`
- **Severity:** correctness · **Confidence:** verified — **latent, not live**

**Current** `if (speed < 0.02 && dist < … )`  **Correct** `if (Math.abs(speed) < 0.02 && …)`

Speed is signed by design (`game_core.js:10770` `… * (isRev ? -1 : 1)`), and every other stop predicate in both files uses `Math.abs`. `speed = -0.5` passes the test; full reverse counts as stationary.

**Retracted as live:** the sole caller (`game_core.js:10584`) passes `ex.speed = Math.abs(this.speed)`, masking the defect. Flagged because the surrounding style implies `abs` was intended and one refactor of the caller silently breaks it. (Compounded by `MATH-5-4`, where `maxDeviation` is itself `undefined`.)

---

### MATH-5-9 — `ParkingMission.getProgressPercent()` returns `NaN` before first `update()`
- **Location:** `mission-manager.js:380-388`
- **Severity:** correctness · **Confidence:** verified

`Math.max(0, 100 - (undefined / this.data.maxDeviation) * 50)` → **`Math.max(0, NaN) === NaN`** in JS, so the `Math.max` guard does **not** sanitise `NaN`. `(NaN + NaN)/2 = NaN`. Fix by initialising `currentDistance`/`currentAngleDiff` to `0` in the constructor, or `?? 0` at the read. `EscasionMission.getProgressPercent` (`:500-506`) has the same shape but is safe via `lastPlayerPos?.x || 0`.

---

### MATH-5-24 — `enter_vehicle` is vacuous on all three levels that declare it
- **Location:** `game_core.js:4237-4240`; `levels/level1.js`, `level5.js`, `level54.js`
- **Severity:** gameplay · **Confidence:** verified

**Current** `if (this._everEnteredVehicle || !this.isPedestrian) {complete = true;}` with the comment *"Lessons 1/5/54 start on foot."*

**Evidence** None of L1, L5, L54 sets `isPedestrian`; all declare `modes: ["car","bike","pedestrian"]`. Runtime `:6167`: `this.isPedestrian = (this.vehMode === 'pedestrian') || (!this.vehMode && !!cfg.isPedestrian)`. On the default `car` selection `isPedestrian = false` → `!false = true` → **completes on frame 1.**

**Notes.** Arguably "already seated in a vehicle" satisfies the objective, so this may be intentional-but-misdocumented. `validate-levels.js:25` models `enter_vehicle` as `null` (any target) because the engine's predicate is state-based, not target-based — correct modelling. The linter cannot catch this: it has no branch table to check state against.

---

### MATH-5-12 — `avoid/speed_zone` box is 260 units long via `flasherZ = schoolZ − 220`
- **Location:** `game_core.js:4288-4295`
- **Severity:** tuning · **Confidence:** verified

**Current** `const fz = (this.mapCfg.flasherZ !== undefined) ? this.mapCfg.flasherZ : (sz - 220);`

**Evidence** L5 (`schoolZ:600, flasherZ:380`) → `z ∈ [360, 620]`, length 260 — by design. L18/L40/L50 (`schoolZ:-32`, no `flasherZ`) → `fz = -252` → `z ∈ [-272, -12]`, also 260 long but displaced **220 units behind** the school's own coordinate, and unverifiably on-map for these procedurally-built levels (no `roads`/`route`). Completion additionally requires `_schoolSlowDwell > 150` frames under `|speed| ≤ 0.22` **anywhere** in that 260-unit box (dwell resets on exit, `:4308`). `avoid/pedestrian` (`:4323-4329`) is better behaved — a 120×120 box.

---

### MATH-5-13 — No level or map triggers the legacy no-`schoolZ` fallback *(verified clean)*
- **Location:** `game_core.js:4288-4295`, `:4323-4329`, `:7117`
- **Severity:** dead-code · **Confidence:** verified

Runtime config is `Object.assign({}, baseMapCfg, ui.cur)` (`:6163`) — **level file wins**. Only 4 levels declare `hasSchool` (5, 18, 40, 50) and **all 4 declare `schoolZ`**. Only inlined map 5 declares `hasSchool` without `schoolZ`, but `level5.js` supplies `schoolX:436, schoolZ:600, zebraZ:540, flasherZ:380`, overwriting it. The legacy branch is therefore **unreachable**, and the legacy boxes are self-consistent with inlined map 5. One caveat: the legacy yield box has **no `z` bound**, so if it ever activated it would latch `complete` at any `z`.

---

### MATH-5-10 — Telemetry `p95` covers only the last 2 s and can never exceed 33 ms
- **Location:** `game_core.js:10452-10457` (ring) → `:4574-4578` (persisted) → `:5797-5799` (overlay)
- **Severity:** tuning · **Confidence:** verified

**Current** ring `_fd.push(rawDt * 1000); if (_fd.length > 120) _fd.shift();` with `rawDt = Math.min(this.clock.getDelta(), .033)`; consumer `const _p95 = _fd[Math.min(_fd.length - 1, Math.floor(_fd.length * 0.95))]`.

**(a) Window:** 120 samples ÷ 60 fps = **2.0 seconds**. The `p95ms` written to `localStorage['traffic_telemetry_<lv>']` on `complete` is the p95 of the final 2 s, not of the run.
**(b) Ceiling:** the `.033` clamp means a 250 ms GC hitch records as **33.0 ms** — `p95ms` is structurally incapable of reporting a frame-rate problem, which is the only reason to collect it. The clamp is *correct for physics* and destroys the *measurement*; performance stats need the unclamped delta.
**(c) Index:** `floor(120 × 0.95) = 114`; nearest-rank p95 is `ceil(0.95·120) − 1 = 113`. One high — a defensible convention, minor.

**Notes.** AGENTS.md attributes p95 to `gameplay-recorder.js` — that file has **no** frame-time math. Its `getSummary` (`:88-129`) computes `duration` as `events[last].time` (the last *recorded event's* timestamp, not run duration — under-reports if the run tail is clean). Its `record()` (`:75-81`) builds `data: { speed: data.speed || null, …, ...data }` — the trailing spread **overwrites** every preceding `|| null` normalisation, so those guards are dead code.

---

### MATH-5-18 — `scenario2d.js` hardcodes `dt = 1/60`; the entire particle system is unreachable
- **Location:** `scenario2d.js:888`, `:962`, `:846-848`, `:491-497`
- **Severity:** dead-code · **Confidence:** verified

**Current** `const dt = 1 / 60;` feeding `this.particles.update(dt, scenario.wind || 0)`, with construction guarded by `if (scenario.rain)` / `scenario.particles === 'confetti'` / `'dust'`.

**Evidence** `ParticleSystem.update` multiplies motion by `dt * 60`, so with `dt ≡ 1/60` the multiplier is exactly 1 unit/frame — **no time scaling**. Particle travel in one real second: 30 units @30fps, 60 @60fps, 144 @144fps. **But the branch is unreachable:** no key in `SCENARIOS` sets `rain:`, `particles:`, or `wind:` (verified zero matches). `this.particles` is always `null`, `:962` never executes, `dt` is a dead constant, and the 33-line `ParticleSystem` class is entirely dead. The same dead-flag problem kills `drawStars`/`drawMoon` (`:907`) — no scenario sets `night:`, so `night_driving`'s starfield and moon can never be exercised. **Three feature blocks unreachable behind flags no scenario sets.**

---

### MATH-5-19 — `Scenario2D` camera smoothing uses a fixed `0.02`/frame; `camProgress` computed and discarded
- **Location:** `scenario2d.js:893-896`
- **Severity:** tuning · **Confidence:** verified

**Current** `const camProgress = Ease.easeInOutCubic(clamp(elapsed/2500, 0, 1)); this.camX = lerp(this.camX, this.targetCamX, 0.02); …`

**Correct** `const k = 1 - Math.pow(1 - 0.02, dt * 60);` and either drive the interpolation with `camProgress` or delete it.

**Evidence** Time to close 99% of the initial gap is **228 frames** regardless of rate: **7.60 s @30fps, 3.80 s @60fps, 1.58 s @144fps**. The intro `duration` is 4000–6000 ms, so on a 144 Hz display the camera finishes its move in a quarter of the intended time — and the ease curve, the only thing that would make the move feel authored, is computed then never read (`camProgress` appears exactly once in the file). The touch-drag pan (`:836`) uses per-event deltas and *is* rate-independent; the inconsistency is only in auto-smoothing.

---

### MATH-5-20 — `Scenario2D` vehicle/pedestrian wrap-back branches are unreachable
- **Location:** `scenario2d.js:946`, `:955-956`
- **Severity:** dead-code · **Confidence:** verified

**Current** `vv.x = (v.x + (v.dir||1) * v.speed * t * 0.03) % 1.2; if (vv.x < -0.1) {vv.x = 1.1}` etc.

**Evidence** Over the longest scenario (`duration: 6000` → `t = 6`): vehicles with `dir:-1`, max `speed 1.0` (the `siren` ambulance at `x: 0.7`) → `0.7 − 1.0·6·0.03 = 0.52`; smallest `x` for any `dir:-1` vehicle is `0.15` (speed 0) → never negative. Pedestrians: max `0.5 × 1.3 = 0.65`, min `x 0.15` → `0.072`; max forward `0.85 + 0.078 = 0.928 < 1.05`. **All three wrap-back conditions are false for every shipped scenario within its declared duration.** Separately, `% 1.2` yields `[0, 1.2)` — positions in `[1.0, 1.2)` draw **off the right edge** of a `w`-wide canvas with no wrap, so vehicles visibly exit and pop back at the origin.

---

### MATH-5-21 — `drawHazardIndicator` has a nonsense operand and never fills its backdrop
- **Location:** `scenario2d.js:784-788`
- **Severity:** dead-code · **Confidence:** verified

**Current** `ctx.fillStyle = 'rgba(0,0,0,3)'; roundRect(ctx - ctx.measureText ? 0 : 0, -25, 80, 50, 12) // fallback`

**Evidence** Precedence: `ctx - ctx.measureText` evaluates first → `object − function` = **NaN** → falsy → the ternary yields `0`, so the coordinate accidentally lands on the intended `0` (Node-verified). Separately: `'rgba(0,0,0,3)'` has alpha `3` (clamped to 1 = fully opaque) not `0.3`; `ctx` is **missing** from the `roundRect` call (an undefined identifier at that site); and the path is built but **never filled**, so the hazard icon has no backdrop at all.

**Notes.** Unlike `MATH-5-18` this **is** live — `hazard` is populated on 25 of 27 scenarios. The throw would not be swallowed (no `try/catch` in `_animate`), so if `ctx.measureText` were ever shadowed the whole intro loop would die. The stale `// fallback` comment suggests the author knew the line was wrong.

---

### MATH-5-22 — `CollectibleSystem` is never instantiated; its theme table matches 5 of 40 themes
- **Location:** `dist/collectible-system.js:29-45`, `:337-351` (file absent from source tree — see `MATH-5-25`)
- **Severity:** dead-code · **Confidence:** verified

**Evidence** (a) `new CollectibleSystem` / `new CheckpointSystem` appear **zero** times anywhere outside `dist/` — grep across all `.js`/`.ts`/`.html` excluding `node_modules` and `dist*` returns nothing. **Both classes are dead.** (b) The density table `{free_roam, urban_grid, suburb, residential, commercial, downtown, festival, highway_merge, rural, default}` matches **5 of 40** themeTypes; the other **35** silently take `default: 0.5`. (c) `placeForLevel` returns immediately when `cfg.roads` is absent — true for **51 of 57** levels — so even if instantiated it would place nothing.

**Notes.** The intra-file math is otherwise sound: coin spacing `t = (i + 0.5) / numCoins` correctly centres `numCoins` coins on `[0,1]`; the star intersection test is the correct segment-crossing predicate; `dist < 5` radius and `score += value` accumulation are clamp-free but monotone. `_spawnCollectEffect` `:312` `life += 0.016` is frame-rate dependent — moot while dead.

---

### MATH-5-23 — `CheckpointSystem.createFromRoute` stacks checkpoints and places #1 on the spawn
- **Location:** `dist/checkpoint-system.js:28-48`, `:195`
- **Severity:** dead-code · **Confidence:** verified

**Current** `const step = Math.max(1, Math.floor(route.length / count)); const routeIndex = Math.min(i * step, route.length - 1);`

**Correct** `Math.round(i * (route.length - 1) / (count - 1))` — samples the full index range with no duplicates — and start at index 1 so #1 is not inside the spawn's 8-unit capture radius.

**Evidence** (Node-verified against real routes)
```
L1   9 pts -> step 1 -> [0,1,2,3,4]        5 unique
L5  17 pts -> step 3 -> [0,3,6,9,12]       5 unique
L54  4 pts -> step 1 -> [0,1,2,3,3]       only 4/5 unique - #4 and #5 coincide
custom 3pts -> step 1 -> [0,1,2,2,2]      only 3/5 unique - #3,#4,#5 all stack
```
And `routeIndex = 0` means **every** level's checkpoint 1 sits at `route[0]` — which `validate-levels.js:114-130` treats as the spawn — so `dist < 8` fires on frame 1: **checkpoint 1 is free on all routes.** The 8-unit radius cannot be tunnelled (car step 1.10 < 8). `getProgress()` is correctly clamped to `[0,1]` and `_reachCheckpoint` is correctly idempotent; `expandAnim` decrements `0.02`/frame (frame-rate dependent, self-terminating).

---

### MATH-5-25 — `collectible-system.js` and `checkpoint-system.js` are deleted from the working tree while `Driving.html` still loads them
- **Location:** `Traffic/collectible-system.js`, `Traffic/checkpoint-system.js` (absent); `Driving.html:8775-8776`
- **Severity:** correctness · **Confidence:** verified

**Current** `<script defer src="collectible-system.js?v=20260831_v9"></script>` and the same for `checkpoint-system.js`.

**Evidence** `Test-Path` → `False` for both at the repo root, `True` under `dist/`. `git status --short` reports ` D checkpoint-system.js` and ` D collectible-system.js` (deleted in the working tree, **not staged**), while `git ls-files` still lists both at root, and the two `dist/` copies are **modified** (12 and 10 lines).

**Notes.** Per AGENTS.md, `build.js` clears and recreates `dist/` from the source tree — so **the next `npm run build` will delete these from `dist/` too and the two `<script>` tags will 404.** Findings `MATH-5-22`/`-23` were audited against the `dist/` copies. This also explains why neither class is instantiated anywhere: the deletion and the `dist/` edits look like one unfinished change. Flagging as a working-tree hazard, not a design defect.

---

## Phase 5 Verified Correct

`dist2D` XZ proximity · `nearestOfType` argmin · `dwell`/`resetDwell` mechanism (scaling is `MATH-5-11`) · `passedCleanly` arm/disarm latch · `vehicleKey` position rounding · `avoid/speed` sign handling (`Math.abs`, reverse-safe) · `speedCapFor` pedestrian branch — `0.18` sits correctly between walk `0.12` and walk+shift `0.264`, so "crawl at walking pace" is failable but not impossible, exactly as documented · `heldSpeedLimit` · `avoid/overtake` z-axis sign (suspected, **retracted**) · `avoid/safe_distance` z-axis · `avoidClassCollision` · `avoidedWrongSide` · `clearedDetour` · `reachedSign` · `clearedBlindCorner` · the whole `stop/*` radius-and-dwell family · `toggle/gear` band `[0.05, 0.40]` · all 19 inline `_checkTasks` thresholds · `avoid/violation` accumulation · the single-eval-per-frame invariant · `Mission.updateProgress` upper clamp · `_grantMissionTokens` double-grant guard · `createRouteCheckpointMission` `numCheckpoints = clamp(⌊totalDist/80⌋, 3, 6)` · `createSafeZone` / `_generateParkingSpot` · `_calculateRouteDistance` · `EscortMission` distance-decay asymmetry · `ChaseMission.getProgressPercent` = `max(0, 100 − d)` · per-object `reported`/`caught` guards · `MissionManager.update` completion+token guard · the p95 index convention and sort-clone · `GameplayRecorder.getSummary` grade ladder · `validate-levels.js` `distToRoad` · `parking/plot` half-extent swap under `rotY` · `checkLevel` spawn tolerance · internal-unit establishment (`1 unit = 100 km/h`, corroborated by four independent sites) · **all 57 level configs free of non-finite coordinates, degenerate route segments, and zero-length roads.**

## Phase 5 Retractions
1. *"`avoid/speed` can never fail because `speedCapFor` divides by 3.6"* — wrong divisor is real but **latent**; the live instance is a different mechanism (`MATH-5-2`).
2. *"`ParkingMission` lets you park at full reverse"* — real defect, masked by the sole caller passing `Math.abs`.
3. *"`roadLength` contradicts `route` length"* — **false**; different quantities, all routes fit.
4. *"`26 * (canvas.width/800)` double-counts `devicePixelRatio`"* — **false**; DPR cancels exactly (verified 41.5 vs 41.6 CSS px at 1280@2). Real but unrelated: the headline renders ~11.7 CSS px on a 360 px phone.
5. *"`avoid/overtake` has an inverted z-axis sign"* — **false**, verified correct.
6. *"`timeLimit` is never enforced"* — **false**, `:13915` does fail the run (with the wrong reason string).

## Phase 5 Not Reached
`npc-ai.js` / `traffic-manager.js` (Phase 3) · `ui.js` challan/quiz/badge arithmetic (Phase 4) · `rule-breaker-profiles.js` / `src/game/RuleBreakerProfiles.ts` (11.1 KB, not opened) · `course.js` / `src/game/Course.ts` (17.7 KB, not opened) · the `_lateralAccel` derivation feeding `CargoMission.maxLateralG` (so the 0.8/1.0 g tuning is unchecked) · the procedural map builder's z-extent for levels 18/40/50 (so whether the `flasherZ = schoolZ − 220` box is on-map is arithmetic-only) · any live browser/Three.js verification.

---

# Phase 3 — NPC AI & Traffic (both runtimes audited independently)

`npc-ai.js` (2610 lines), `traffic-manager.js`, `road-graph.js`, `traffic-ai-copilot.js`, `vehicles.js`, `rule-breaker-profiles.js` · `src/systems/NPCAI.ts` (2153 lines), `TrafficManager.ts`, `RoadGraph.ts`, `WorldStreamer.ts`, `engine/Physics.ts`

---

### MATH-3-3 — The internal speed unit is metres-per-frame; *both* conversions are wrong, and they disagree with each other ⚠️ ROOT CAUSE
- **Runtime:** both · **Location:** `game_core.js:2588`, `:2691`, `:13726`, `:10919`; `npc-ai.js:2208`, `:2231-2247`
- **Severity:** correctness · **Confidence:** verified

**Current**
```js
const speedMs = this.speed * 30;                       // game_core.js:2588, :2691
const k = Math.round(Math.abs(this.speed) * 100);      // game_core.js:13726 -> KM/H speedometer
this.player.position.x += this.vx;                     // game_core.js:10919   <-- no dt
```
**Current (NPC side)** `npc-ai.js:2208` `baseSpeed = currentEdge.speedLimit / 3.6` (true m/s) and `_applyPhysics` integrates `position += velocity * dt`.

**Correct.** The world is in **metres** — road widths 12/24, lane width 3.5, vehicle half-depths from `vehicles.js:930-931`, IDM `s0`/`T`/`wheelbase` all metric. Because `position += speed` runs with **no `dt`**, `this.speed` is **metres per frame**, so the only self-consistent m/s conversion is `speed * 60` at 60 fps (and km/h would be `speed * 216`).

**Evidence** at `speed = 1.0` (car `maxSpd = 1.10`):
```
ground truth            = 60.0 m/s (216 km/h)
game_core *30 (physics) = 30.0 m/s (108 km/h)   ratio 0.500
game_core *100 (HUD)    =            100  km/h  ratio 0.463
*30 vs *100 differ by exactly 10/3 = 3.333x
```
So Pacejka slip forces, aero drag and engine RPM are all computed at **half** the ground-truth speed while the HUD shows **46%** of it. The speed-limit governor and the co-pilot's overspeed logic (`speedLimit + 5`) are evaluated against a number **~2.2× below** actual velocity.

**Notes.** This **supersedes and corrects** `MATH-1-8`, which reported the physics `×30` as the outlier against a nominal `×100`. The truth is worse: `this.speed` is m/frame, so `×30` should be `×60` and `×100` should be `×216`. **Both are wrong**, and the HUD under-reports real ground speed by 2.16×. `npc-ai.js` meanwhile runs in genuine m/s — **the NPC runtime and the player runtime are in different units.** A single exported constant must replace all of them.

---

### MATH-3-4 — `npc-ai.js:1297` mixes units: player lead speed in m/frame, NPC lead speed in m/s
- **Runtime:** Vanilla JS · **Location:** `npc-ai.js:1292-1297` (`_updateFollowLane`); also `:978`, `:2111`, `traffic-manager.js:935`, `:1005`
- **Severity:** correctness · **Confidence:** verified

**Current** `vLead = aheadVehicle.npcAI?.currentSpeed || aheadVehicle.speed || 0;` then `const dv = v - vLead;` inside `calcIDMAcceleration`. `_getVehicleAhead` can return the **player** object (`:998`), for which `.npcAI` is undefined and `.speed` is m/frame.

**Correct.** `dv = v_ego − v_lead` requires both in m/s.

**Evidence** ego `v = 12 m/s`, lead gap 20 m, player `.speed = 0.6`:
```
as written : dv = 11.40  -> desired gap s* = 57.8 m -> a = -8.000 m/s^2  (SATURATED emergency braking)
correct    : dv = -24.0  -> desired gap s* =  3.6 m -> a = +0.821 m/s^2  (normal following)
```
The IDM dynamic term `(v·dv)/(2√(aMax·b))` amplifies the error by **≈2.9×** on top of the 60× unit error.

**Notes.** **Every NPC that gets behind the player brakes at full `-bMax` and holds a ~58 m stand-off instead of ~4 m.** Same defect at `:978` (cross-traffic gate `vSpeed > 0.8`, which can *never* fire for the player since `speed ≤ 1.1`) and `:2111` (`_checkEmergencyAvoidance`, which consequently never emergency-brakes for a slow player).

---

### MATH-3-7 + MATH-3-8 + MATH-3-9 — Lane placement is wrong three times over
- **Runtime:** Vanilla JS · **Location:** `road-graph.js:65-76`, `:84-94`; `traffic-manager.js:352`, `:769-780`; `npc-ai.js:425`, `:1076-1085`
- **Severity:** correctness · **Confidence:** verified

**Three compounding defects:**

**(a) `MATH-3-7` — lane indices 0…lanes−1 land in the *oncoming* carriageway.** `road-graph.js:87` sets `_right = crossVectors(direction, up)`, which is **true right relative to the edge direction**, not relative to the traveller. For a width-12, 2-lanes-each-way edge along +X, `offsets = [−4.5, −1.5, +1.5, +4.5]`:
```
travelling +direction : lane 0 = -4.50 -> LEFT (oncoming)   lane 1 = -1.50 -> LEFT (oncoming)
travelling -direction : lane 0 = +4.50 -> RIGHT (correct)    lane 1 = +1.50 -> RIGHT (correct)
```

**(b) `MATH-3-8` — `currentLane` is forced to 0 for 100% of the fleet.** `traffic-manager.js:352` sets `vehicle.currentLane = spawnPoint.lane` (a real random lane), then `new NPCAI(vehicle, …)` runs `this.currentLane = 0;` (`npc-ai.js:425`), overwriting it. `_pickInitialLane` then returns 0 on **all four** paths. So lane index > 0 is only ever reached transiently during a MOBIL lane change — **the multi-lane behaviour the whole MOBIL subsystem is built around is effectively single-lane**, and lane 0 is the *wrong-side* outer lane for half the graph.

**(c) `MATH-3-9` — half of all spawns teleport one lane width sideways.** `_maintainLane` calls `getLaneCenter(this.currentLane, …)` with `currentLane === 0`, which resolves `offsets[0]` — the first half of the array *regardless of travel direction* — while the spawner offset by `dirBase`:
```
from startNode, lane 0: spawn z = -4.50 -> laneCenter(0) = -4.50   jump  0.00 m
from startNode, lane 1: spawn z = -1.50 -> laneCenter(1) = -1.50   jump  0.00 m
from endNode,   lane 0: spawn z = -1.50 -> laneCenter(0) = -4.50   jump +3.00 m
from endNode,   lane 1: spawn z = -4.50 -> laneCenter(1) = -1.50   jump -3.00 m
```
`startNode` is a coin flip (`traffic-manager.js:761`), so **~50% of every spawn batch is displaced by exactly one lane width.** `_maintainLane` corrects it with `1 − exp(−dt·4.5)` (≈7%/frame), making it a visible 0.4 s slide at up to 16 m/s, during which vehicles straddle lane lines.

**Downstream of (a):** `_initiateOvertake` (`npc-ai.js:1703`) prefers `currentLane + 1`, and MOBIL's `isRightLaneChange = targetLane > myLane` (`:763`) applies a keep-right bias **inverted for half the fleet**.

---

### MATH-3-12 / MATH-3-26 — `arbitrateDeadlock` score is dominated by `Date.now()`, inverting priority
- **Runtime:** both (byte-identical) · **Location:** `npc-ai.js:197-209`; `src/systems/NPCAI.ts:341-365`
- **Severity:** correctness · **Confidence:** verified

**Current** `const score = (v.arrivalTimeMs || 0) * 0.001 + typeWeight + aggressionBias;` with `typeWeight ∈ {15,20,25,30}`, `aggressionBias ∈ [0,10]`, sorted **descending**. The caller supplies `arrivalTimeMs: v._stallStartTime || Date.now()` — a raw epoch-millisecond timestamp.

**Correct.** Normalise relative to the group and **subtract**, so the *earliest* arrival wins.

**Evidence** with `now = 1 770 000 000 000`:
```
bus   stalled 0 s ago   -> score 1 770 000 035.0
bike  stalled 0.02 s ago -> score 1 770 000 024.0
car   stalled 5 s ago   -> score 1 770 000 020.0
truck stalled 10 s ago  -> score 1 770 000 015.5
```
The maximum advantage `typeWeight + aggressionBias` can confer is **19.5 points**, while **1 second** of stall-time difference is **1000 points**. The designed priority terms are numerically irrelevant unless two timestamps fall within **0.0195 s**. The effective rule is **"largest `arrivalTimeMs` wins" = LIFO** — the opposite of the first-come-first-served a deadlock arbiter needs.

**Notes.** Reachable: `handleDeadlockResolution` fires at `_stuckTimer >= 0.8`, so phase 1 is always taken. The TS port is *additionally* broken: it has no `_stallStartTime` bookkeeping at all, so `|| 0` collapses every timestamp to 0 and the score becomes purely `typeWeight + aggressionBias` — i.e. **TS grants bus > truck > car priority while vanilla effectively does the opposite.** TS also raises the watchdog threshold to 3.5 s vs vanilla's 0.8 s.

---

### MATH-3-10 — `desiredSpeed` is never clamped to the class maximum; reachable peak is 4.00× the vehicle's own top speed
- **Runtime:** Vanilla JS · **Location:** `npc-ai.js:2207-2229` (`_getTargetSpeed`), `:469`, `:1227`
- **Severity:** correctness · **Confidence:** verified

**Current** `speed = Math.max(2, (edge.speedLimit/3.6) * (1 + offset))`, `offset ∈ [−speedVariance, +speedVariance]`. `calculateIDMAcceleration` sets `const v0 = Math.max(0.5, targetV0)` where `targetV0 = this.desiredSpeed` — so the IDM free term *targets* it and **nothing caps it at `VehicleClassProfiles[type].v0`**. `_applyPhysics` (`:2231-2247`) has no cap either.

**Evidence** exhaustively enumerated over every profile × class × `speedLimit ∈ {20,25,40,50,60,80}`:
```
speedLimit 60 (src/Game/Game.ts default) -> 16.67 m/s > car v0 13.89   ALREADY EXCEEDS
worst case: reckless_bike (variance 0.5) driving a truck (v0 8.33) on an 80 km/h road
             -> desiredSpeed = (80/3.6)*1.5 = 33.33 m/s = 120 km/h = 4.00x v0
bike class worst case: 33.33 / 15.0 = 2.22x v0
```
The ×1.25 overtake and ×1.2 road-rage multipliers are **not** the cause — both are inert (`MATH-3-11`); the variance term alone does it.

---

### MATH-3-11 — Four FSM states are unreachable, making the overtake and platoon speed controls inert
- **Runtime:** Vanilla JS · **Location:** `npc-ai.js:1101-1144` (dispatch), `:1363-1394` (`_updateOvertake`), `traffic-manager.js:106-130`
- **Severity:** dead-code · **Confidence:** verified

A regex scan of all 14 assignments to `this.state` shows `SIDEWALK_DETOUR`, `PARK`, `CRASH`, **`ROAD_RAGE`** are **never assigned**. Consequences, all verified:

- `_updateOvertake` sets `desiredSpeed = _getTargetSpeed() * 1.25` (`:1372`, `:1709`) but **never calls `calculateIDMAcceleration`** — it only calls `_maintainLane(dt)`. `currentAcceleration` keeps its last FOLLOW_LANE value, so **the ×1.25 has zero effect on motion.**
- `_updateRoadRage` (×1.2, `followDistance = 5`) is unreachable ⇒ that multiplier never fires.
- `Platoon.update` writes `follower.npcAI.desiredSpeed` (`traffic-manager.js:1087-1091`) but `_updatePlatoons` runs at `:114` while `vehicle.npcAI.update()` runs later at `:130`, and `_updateFollowLane` then **unconditionally overwrites** `this.desiredSpeed` at `:1227`. The platoon write is discarded every frame.
- `PARK` unreachable ⇒ `_findParkingSpot`, `_steerTowardsSpot`, `_alignForParking`, `_laneReturnComplete` are dead; `_isLaneClear`, `_executeOvertake`, `_returnToLane` are defined and **never called anywhere in the repo**.

**Net:** the only reachable `desiredSpeed` reaching `calcIDMAcceleration` is `_getTargetSpeed()` or `_getTargetSpeed()*0.5` (DISTRACTED), so the reachable peak is `MATH-3-10`'s 33.33 m/s, not the 41.67 m/s a naive read of the multipliers suggests.

---

### MATH-3-18 / MATH-3-19 — The TS port calls a method that does not exist, and has no junctions at all
- **Runtime:** TypeScript · **Location:** `src/systems/NPCAI.ts:839`, `:849`, `:1282`; `src/systems/RoadGraph.ts`
- **Severity:** correctness · **Confidence:** verified

**`MATH-3-18` — `getEdgeTo` missing.** `NPCAI` calls `this.roadGraph.getEdgeTo(a, b)`. The TS `RoadGraph` class (`RoadGraph.ts:211-496`) defines `fromLevelConfig`, `buildBuildingSlots`, `getZoneAt`, `setAnchorNodes`, `buildSpatialIndex`, `classifyNodes`, `getNearestNode`, `getNearestEdge`, `getEdgeList`, `getRandomEdge`, `findPath`, `_heuristic`, `_reconstructPath`, `getBuildingSlotsInRadius`, `getIntersectionsInRadius` — **no `getEdgeTo`**. The only one in the file is the **1-argument** `RoadNode.getEdgeTo(otherNode)` at `:56`. So this is `undefined` → `TypeError` at `:839`/`:849` (every target re-pick) and `:1282` (every look-ahead edge crossing). **The file carries `// @ts-nocheck` on line 1, so `npm run typecheck` cannot catch it.**

**`MATH-3-19` — no intersection splitting.** `RoadGraph.fromLevelConfig` (`:221-278`) makes exactly **two nodes and one edge per road**. The vanilla builder (`road-graph.js:194-253`) precomputes every v×h crossing inside both spans, sorts stations, and emits a node per station plus an edge per consecutive pair — a 2-road grid yields **5 nodes / 4 edges**, not 2 / 2. Consequently `classifyNodes` can only see `degree ≤ 2`, so `type` is always `'corner'` or `'dead_end'` — **`major_junction` and `t_junction` are unreachable**, `getIntersectionsInRadius` degenerates to "return road endpoints", `findPath` can only route along whole roads (**no turn at all**), and `computePurePursuitSteering`'s next-edge branch can never fire. Every junction-dependent behaviour — `_getSignalAhead`, `_distanceToSignal`, `_committedToIntersection`, `_clearingIntersection`, `_advanceRoute`, the 8 m/4.5 m corner-advance thresholds — operates on a topology that does not exist.

---

### MATH-3-17 — Three TS heading-difference sites are missing the ±π normalisation the vanilla runtime has
- **Runtime:** TypeScript · **Location:** `src/systems/NPCAI.ts:1503-1505`, `:1511-1513`, `:1569-1570`
- **Severity:** correctness · **Confidence:** verified

**Current** `const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, desiredDir.z); this.vehicle.rotation.y += clamp(angle, -maxTurn, maxTurn);`

**Correct.** Insert the two-clamp normalisation exactly as vanilla does at `npc-ai.js:1756-1757`, `:1766-1767`, `:1842-1843`.

**Evidence** a full scan of `Math.atan2` in `src/` returns 10 hits; **only one** (`_smoothFacing`, `:2099-2101`) has the normalisation. Each of these three subtracts two `atan2` results, so both operands lie in (−π, π] and the difference lies in (−2π, 2π). A raw difference of −5.9 rad (desired −2.95, current +2.95) is mathematically **+0.38 rad**, but the code steers the **wrong way** — and `rotation.y`, not re-wrapped at these sites, is pushed out of [−π, π].

**Notes.** `_steerTowardsSpot`/`_alignForParking` sit behind the unreachable `PARK` state, so latent. **`_updatePullOver` (`:1569`) is live** — `PULL_OVER` is entered whenever an ambulance is within 80 m behind, and it is the only steering path in that state. It also loses vanilla's defensive `?.turn || 0.05` fallback (`this.vehicle.stats.turn` is read twice with no guard), so `stats.turn === undefined` yields `NaN` and **permanently corrupts `rotation.y`**.

---

### MATH-3-21 — TS `_respawn()` teleports the vehicle to the world origin instead of despawning it
- **Runtime:** TypeScript · **Location:** `src/systems/NPCAI.ts:1748-1756`, called from `:1102`, `:1112`
- **Severity:** correctness · **Confidence:** verified

**Current** `_respawn() { …; this.vehicle.position.set(0, 0.5, 0); … }` — **Correct:** delegate to `this.trafficManager._despawnVehicle(this.vehicle)`, as vanilla does (`npc-ai.js:2255-2257`).

**Evidence** two live call sites inside the anti-stuck watchdog (`:1102` when `_stuckTimer >= 5.0` and `distToPlayer > 60`; `:1112` the `_updateComplete` fallback). In vanilla both despawn, so the next `_spawnSingleVehicle` places a fresh vehicle near the player. In TS the stalled vehicle is **instantly relocated to the origin**, stays in `this.vehicles` and `game.scene`, keeps `active = true`, and begins steering from the origin — 200–500 m behind the player. Because `_manageVehicleLifecycle` despawns at 400 m it is not culled promptly; each stall injects a **ghost vehicle into the origin district**, where they accumulate (the road graph centres there).

---

### MATH-3-22 / MATH-3-23 — TS lead-vehicle and signal geometry both measure to the wrong thing
- **Runtime:** TypeScript · **Location:** `NPCAI.ts:1189-1201`, `:1211-1213`, `:1235-1240`
- **Severity:** gameplay / correctness · **Confidence:** verified

**`MATH-3-22` — `_getVehicleAhead` uses the *edge* heading and has no lateral filter.** `const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode)` — the edge tangent, not the vehicle's yaw. While `_maintainLane` is still converging yaw (a ≤4.5 s exponential), the two disagree and `proj` is not a longitudinal distance at all. Worse, **there is no lateral filter, no heading check and no cross-traffic gate**: every active vehicle on the same edge with `proj > 0` qualifies as a lead — adjacent-lane vehicles, oncoming traffic on the other carriageway, vehicles across an intersection, vehicles travelling in reverse. Vanilla uses `forwardDot > 0.30 && headingDot > 0.35 && lateral < 1.9` plus a separate cross-traffic branch gated on `lateral < 1.1 && !this._clearingIntersection`. Net effect: **phantom queues at every intersection.**

**`MATH-3-23` — `_distanceToSignal` measures to the signal head, not the junction centre.** Signals are authored with an explicit junction override *precisely because the mesh is not at the junction*: `game_core.js:10217-10219` places `sig1` at `(ix + roadWidth/2 + 1.2, iz + roadWidth/2 + 1.2)` — the **corner** — while setting `userData.junctionX = ix, junctionZ = iz`. For `roadWidth = 12` that is a **7.2 m** corner offset (up to `7.2/√2 ≈ 5.09 m` of pure error), and it is **not directionally consistent** — it varies with approach angle. Vanilla reads the override (`npc-ai.js:1065-1074`); TS does not. Every downstream stop-line computation inherits it, and TS additionally gates `WAIT_SIGNAL` on `distToSignal < 7.0` against vanilla's `< 3.0` **on the stop-line distance** with a different speed threshold (`< 1.2` vs `< 0.4`).

---

### MATH-3-5 — `userData.spd * 20` understates true ground speed by 43%
- **Runtime:** Vanilla JS · **Location:** `npc-ai.js:2370`, `:2779`
- **Severity:** correctness · **Confidence:** verified

**Current** `vSpeed = Math.abs(v.speed !== undefined ? v.speed : (v.userData?.spd ? v.userData.spd * 20 : 0))`

**Correct.** `userData.spd` is a world-units-per-second scale: the vehicles carrying it are advanced by `n.position.x += n.userData.spd * 35 * dt * n.userData.dir` (`game_core.js:12296`, `:12333`). The conversion is **`spd * 35`**.

**Evidence** for every `spd` in the codebase (0.02, 0.024, 0.15, 0.28–0.65, 1.2, 1.5–3.0) the ratio `spd*20 / (spd*35)` is exactly **0.5714** — a uniform **−42.9% error**. An NPC at `spd = 0.3` moves 10.50 m/s but the TTC code believes 6.00 m/s, so `ttc` is inflated **1.75×** and pedestrians judge oncoming traffic *less* urgent, crossing late. Only the fallback branch (legacy NPC/ped meshes), not NPCAI-driven vehicles.

---

### MATH-3-20 — TS re-randomizes the rain multiplier every call and drops the school-zone law
- **Runtime:** TypeScript · **Location:** `src/systems/NPCAI.ts:1719-1732`
- **Severity:** correctness · **Confidence:** verified

**Current** `if (cfg.hasRain || cfg.hasPuddles) speed *= (0.65 + Math.random() * 0.15);`

**Correct.** A deterministic `speed *= 0.75`, as in `npc-ai.js:2216`, plus the school-zone clamp at `:2220-2225`.

**Evidence** `_getTargetSpeed()` is called 2–3× per frame per NPC (from `_updateFollowLane`, `calcIDMAcceleration`, `evaluateMOBIL`, `_reactToPlayer`). Each call draws a **fresh** `Math.random()`, so `desiredSpeed` jitters **±7.5% frame-to-frame** (verified spread 0.65–0.80 = 23% between consecutive frames). With `delta = 4` the induced acceleration ripple is ≈`4·aMax·(Δv0/v0)` ≈ 0.15 m/s² RMS — **directly audible as engine and speed jitter across 40–110 NPCs.** Separately, the entire school-zone block (`cfg.schoolSpeedLimit`, `profile.schoolCareful`, the 130 m × 1.6 m caution radius) is **absent**, so NPCs violate the 20 km/h school limit at all times.

**Notes.** Vanilla explicitly fixed an identical class of bug for `_speedVarianceOffset` with the comment *"Fixed speed variance per vehicle to eliminate per-frame speed jitter"* (`npc-ai.js:468`) — **the port reintroduced it in a different form.**

---

### MATH-3-27 to MATH-3-32 — JS/TS divergence summary

| ID | Divergence | Evidence |
|---|---|---|
| **`MATH-3-27`** | **TS spawn lane base inverted + lane discarded.** `traffic-manager.js:777` `dirBase = start ? 0 : laneCount`; `TrafficManager.ts:434` `dirBase = start ? laneCount : 0`. TS also returns `lane: 0` unconditionally (`:439`). | Width-12 edge along +X: JS from `startNode` lane 0 → z **−4.50**; TS from `startNode` lane 0 → z **+1.50**. **Every TS spawn lands in the opposite carriageway.** A coin flip per spawn, not a systematic mirror. |
| **`MATH-3-28`** | **TS spawn gates relaxed on every axis.** JS `t = clamp(0.18, 0.82)` with the comment *"Strictly mid-block: guarantees spawning well clear of intersection boxes"*; TS `clamp(0.02, 0.98)` — a **1.5× wider** window. JS rejects `isOccupied (<16 m)`, `isNearPlayer (<22 m)`, `dGarage < 40`; TS does **none**. | TS can spawn a 4.8 m bus **on top of the player**, and `_spawnBatch` bursts the whole count in one frame (vanilla staggers via `_spawnQueue` at 4/frame). |
| **`MATH-3-29`** | `_steerTowardsTarget` differs: advance radius **4.5 m** vs **4.0 m**, and JS **falls through** to re-steer against the new target while TS `return`s. | Up to `0.030 rad (1.7°)` of missing yaw correction per node advance. Neither is "more correct" — they simply differ. |
| **`MATH-3-30`** | **Vehicle-class and driver-profile tables are entirely different.** | `car`: `T` 1.8→1.4, `s0` 3.6→2.5, `bSafe` 3.5→4.0. `bike`: `v0` 15.0→**16.67**, `bSafe` 4.5→**5.5**. TS `NPC_PROFILES` has **9** keys vs vanilla's **12** — `impatient_taxi`, `school_parent`, `school_bus`, `robot_delivery`, `robot_crosser` missing; `sidewalkProbability` non-zero where vanilla has 0.0; `laneDiscipline` 0.2–0.9 vs 0.6–0.98. `_initIDMParameters` personality branches also missing in TS. |
| **`MATH-3-31`** | Density/lifecycle constants differ. | JS `min(base*(1+d*1.5), 110)`; TS `min(base*(1+d*2), 110)`. At `d = 0.5`: JS **93.75**, TS **112.5 → capped 110** — TS saturates almost immediately, **disabling the gradual traffic build-up ramp**. `despawnDist` 320 → 400 keeps ~20–25% more off-screen vehicles. |
| **`MATH-3-32`** | **`dist/` is a stale build artifact.** | `dist/traffic-manager.js` still has `vehicle._stoppedSeconds += 0.05` where source has `+= dt`. Per the source's own comment, with the hard-coded 0.05 the 3 s/12 s thresholds fire after 60 frames at 20 fps but 240/1200 at 60/120 fps — **recycling runs 3× too aggressively at 20 fps and 6× too slowly at 120 fps.** Also `rule-breaker-profiles.js` exists **only** in `dist/` (374 lines the source tree cannot rebuild), and `dist/Driving.html:8787` loads it while source `Driving.html` does not. |

---

### MATH-3-24 — Weight transfer does not conserve total vertical load (shared by both runtimes)
- **Runtime:** both · **Location:** `src/engine/Physics.ts:213-215` and `game_core.js:2570-2581`
- **Severity:** tuning · **Confidence:** verified

**Current** `frontTotal = clamp(staticFront − deltaLong, 0.1W, 0.85W); rearTotal = clamp(staticRear + deltaLong, 0.1W, 0.85W);`

**Correct.** Clamp the *transfer* so neither axle can exceed the limit, or renormalise the pair so `frontTotal + rearTotal === totalWeight` exactly. The sum is conserved only while both clamps are inactive.

**Evidence** for the `car` profile (m = 1400 kg, L = 2.7, h = 0.55, W = 13 734 N):
```
ax =   0  ->  Sum/W = 1.0000  OK
ax = -10  ->  Sum/W = 1.0000  OK
ax = +10  ->  Sum/W = 1.0000  OK
ax = -20  ->  Sum/W = 0.9500  687 N (5%) of vehicle weight EVAPORATES
ax = -20, ay = 18 -> Sum/W = 0.9500
```
Only bites above ~20 m/s² (ABS-limit braking), where it slightly **understates rear grip**. All four per-wheel loads are floored at **50 N**, but a lifted inside wheel should bottom out at 0.

**Notes.** **This is shared code, not a port divergence.** `Math.min(totalWeight*0.85, …)` also caps a front axle at 85% of total weight — below the ~60–65% static figure — so the clamp itself is loose.

---

### MATH-3-13 — `right` is computed as `up × forward` = **LEFT** at six sites
- **Runtime:** Vanilla JS · **Location:** `npc-ai.js:600`, `821`, `885`, `948`, `1023`, `1617`, `1831`, `2162`, `2091`/`2109`
- **Severity:** tuning · **Confidence:** verified

**Current** `crossVectors(new THREE.Vector3(0,1,0), forward)` and `(cos(rot), 0, -sin(rot))`.

**Correct.** In three.js (right-handed, Y-up) the right vector is **`forward × up`**. Verified twice: for the default camera `forward = (0,0,−1)` gives `forward × up = (1,0,0)` = camera right; and algebraically `R_y(θ)·(0,0,1) = (sinθ,0,cosθ)` so `forward × up = (−cosθ, 0, sinθ)`.

**Evidence** for an edge along +X: `direction × up` = **(0,0,+1)** (TRUE right, `road-graph.js:87`); `up × direction` = **(0,0,−1)** — the exact negation. Every `npc-ai.js` `right` is the vehicle's **left**.

**Notes.** Harmless at the eight sites feeding `Math.abs(...)` (the last two use `|toV.x*forward.z − toV.z*forward.x|`, the correct 2-D cross-product magnitude, verified sign-invariant). **Two sites are direction-sensitive:** `:600` (`getVehicleLane`'s lateral projection vs. `getLaneOffsets()`, which are along TRUE right — but unreachable in practice since `currentLane` is always a number) and `:2162-2169` (`_reactToPlayer`'s 5% swerve, which **steers toward** the player instead of away). The `_maintainLane` feedback is self-consistent and unaffected.

---

### MATH-3-6 — Pure-pursuit denominator uses arc-length `Ld`, but the closed form needs Euclidean distance
- **Runtime:** Vanilla JS · **Location:** `npc-ai.js:97-100` with `:1515`, `:1556`, `:1568`
- **Severity:** tuning · **Confidence:** verified

**Current** `kappa = 2*sin(alpha)/max(0.1, Ld)` where `Ld` is the **arc-length** look-ahead.
**Correct** `kappa = 2·sin(α)/d` with `d = hypot(localX, localZ)` — already computed at `:1556`, then discarded. Since `alpha = atan2(localX, localZ)` is built from **Euclidean** offsets, the denominator must match.

**Evidence** `getPointAt` is a straight lerp within an edge, so the two differ only by the lane offset: `Ld = 20 m`, lateral offset 4.5 m → `distToLook = 20.50` ⇒ true κ = 0.01466 vs. as-written 0.01480 (**0.95% low**); 3 m off-centre → 1.5% low. **Larger errors on the two fallback branches** — `:1544` (`lookPoint = targetNode.position`, the junction centre) and `:1540-1542` (progress clamped to `min(1.0, …)`) — where `distToLook` can be far below `Ld` while `Ld` stays 20, causing **severe understeer exactly where the turn is sharpest.** No NaN/Inf path (`distToLook < 0.05` early-returns zero yaw).

---

### MATH-3-15 / MATH-3-16 — Latent shared-table mutation; unused local
- **Runtime:** Vanilla JS · **Location:** `rule-breaker-profiles.js:195-200`; `road-graph.js:67`
- **Severity:** dead-code · **Confidence:** verified

**`MATH-3-15`** `applyToNPC(npcAI) { Object.assign(npcAI.profile, this.behaviors); }` where `this.profile = NPC_PROFILES[key]` is a **reference, not a copy**. `applyToNPC(` has **zero call sites**, so it never executes today — but the moment rule-breaker profiles are wired up, applying one profile would permanently rewrite `laneDiscipline`, `aggression`, `speedVariance`, `patience` and `signalCompliance` for **every NPC sharing that key, for the rest of the session.** Latent global-state corruption.

**`MATH-3-16`** `road-graph.js:67` `const halfWidth = this.width / 2;` is never read. The offsets it *would* bound are correct (max |offset| = `halfWidth − laneWidth/2 < halfWidth`), but the dead local invites the false reading that offsets span the full carriageway. Duplicated verbatim at `RoadGraph.ts:101`.

---

## Phase 3 Retractions

| Suspected | Verdict |
|---|---|
| `calcPurePursuit` `tan(atan(x))` singularity | **Withdrawn** — `tan(atan(x)) ≡ x`; 20 M samples, max error **8.9e-15 rad/s** (≈4 ULP). `Ld ≥ 3.5` is provable (`computePurePursuitSteering` is only called with no 2nd arg), so `κ·L ≤ 4.2857`; the `Math.max(0.1, Ld)` guard branch is **unreachable**. Result is then clamped to ±maxOmega ∈ [1.2, 2.2], ~9 orders of magnitude above the error. |
| `calcPedestrianTTC` quadratic/discriminant handling | **Withdrawn** — it never solves a quadratic. `effectiveSpeed = max(0.5, vehSpeed) ≥ 0.5 > 0` and the `dLong <= 0` gate precedes the division. 2 M-sample fuzz with 10% reversed speeds: **0 NaN, 0 negative, 0 non-finite.** |
| Angle wrapping missing in the vanilla runtime | **Withdrawn** — all nine vanilla heading-difference sites normalise to [−π, π], and `rotation.y` is re-wrapped after every integration. (The **TS** port is not — `MATH-3-17`.) |
| `WorldStreamer` TS/JS divergence | **Withdrawn** — a faithful port. Every constant and formula identical (`chunkHash`, `mulberry32` operator precedence verified, `renderDistance 8`, `bufferDistance 12`, `maxChunksPerFrame 2`, `updateInterval 0.5`, the `distFromCenter > maxDist*0.8` / `< maxDist*0.3` thresholds). The mixed Euclidean/Chebyshev metrics are intentional hysteresis. |
| `src/engine/Physics.ts` Pacejka / weight transfer / slip angles / Ackermann / RPM | **All verified correct** (`MATH-3-25`) — see corroboration below. |

### ⭐ Cross-phase corroboration: `MATH-1-1` and `MATH-1-4` independently confirmed from the TypeScript side

`src/engine/Physics.ts:206-210` computes the axle assignment **correctly**:
```
lr = L * frontWeightDist = 0.58L   (CG-to-rear distance for a 58%-front vehicle)
staticFront = W * lr / L = 0.58W    CORRECT
lf = 0.42L -> staticRear = 0.42W   CORRECT
deltaLong = m*ax*h/L, subtracted from the front when ax > 0   CORRECT (load moves rearward)
lateral: latSign = sign(ay) -> ay > 0 (left turn) loads FR/RR, unloads FL/RL   CORRECT
```
`game_core.js:2562-2563` uses `(1 − fDist)` for the front. **The TS port has the right formula and the vanilla runtime does not** — independent confirmation that `MATH-1-1` is a transcription error, not a design choice. `Physics.ts` also verifies the Pacejka MF form, the bicycle-model slip-angle signs (with `safeVx = max(0.2, |v_x|) > 0` keeping `atan2` inside (−π/2, π/2)), Ackermann (`inner > |δ| > outer` at every test angle), and engine RPM dimensional consistency.

---

# Consolidated Remediation Order

Findings cluster into **five independent root causes**. Fixing a root cause closes several findings at once; the list below is ordered so each step makes the next one verifiable.

### Step 1 — Establish one speed unit (`MATH-3-3`, `MATH-1-8`, `MATH-3-4`, `MATH-3-5`, `MATH-1-9`, `MATH-1-10`, `MATH-1-12`)
`this.speed` is **metres per frame**. `×30` (physics) and `×100` (HUD/cruise/limiter) are *both* wrong; ground truth is `×60` to m/s and `×216` to km/h. Export one constant and replace all five sites. This alone changes top speed, the speedometer, the governor, the cruise setpoint, every cross-subsystem speed comparison, and the IDM lead-vehicle term. **Do this first — it invalidates any speed-based tuning done before it.**

### Step 2 — Frame-rate independence (`MATH-1-6`, `MATH-1-16`, `MATH-2-6`, `MATH-5-11`, `MATH-5-19`, `MATH-3-20`)
`position += vx` has no `dt`; `dwell()` takes a literal `1`; `_justHit` uses `setTimeout`; `Scenario2D` lerps at a fixed `0.02`/frame. All four make behaviour a function of the player's hardware rather than the game. This is why `timeLimit`, dwell objectives and collision penalties are untrustworthy across devices.

### Step 3 — Collision transform (`MATH-2-1`, `MATH-2-7`, `MATH-2-3`, `MATH-2-4`)
One-line sign fix at `:11597-11599` and `:12709-12712` (transposed rotation matrix). Then retune `relSpeed` once units are consistent, and replace the `+0.5` broadphase fudge with the circumradius sum. **Highest severity per line changed** — 6.73% false negatives mean the player drives through buses.

### Step 4 — Restore the physics model to actually matter (`MATH-1-1`, `MATH-1-2`, `MATH-1-3`, `MATH-1-13`, `MATH-1-14`, `MATH-3-24`)
Copy the axle assignment from `Physics.ts:206-210`; fix the `ax` unit at the source (`:4470`) and widen the clamps together; delete the raw steering injection at `:2668`; relax the `0.85`/`0.15` damping so the car can actually slide; decide whether ABS/TCS/tire-wear/engine-RPM are features or should be deleted. **Fix `MATH-1-1` and `MATH-1-3` together or neither** — with the raw term dominating, the Pacejka correction will be unobservable.

### Step 5 — Close the broken subsystems (`MATH-5-4`, `MATH-5-6`, `MATH-3-7/8/9`, `MATH-3-11`, `MATH-4-1/4/5`, `MATH-4-2`, `MATH-4-11`)
The mission layer, the lane system, several FSM states, and the score idempotency guards are all structurally non-functional. These are independent of Steps 1–4 and can be done in parallel by different people.

### Also required before the next build (`MATH-5-25`, `MATH-3-32`)
`checkpoint-system.js` and `collectible-system.js` are **deleted from the working tree** while `Driving.html` still loads them, and `dist/` holds stale copies of `traffic-manager.js` and a 374-line `rule-breaker-profiles.js` the source cannot rebuild. Per AGENTS.md the next `npm run build` will delete the first two from `dist/` and the `<script>` tags will 404. **Resolve this before building**, or the deployment breaks.

### Cross-cutting: three `themeType` vocabularies, one source of truth
`MATH-5-6`, `MATH-5-17`, `MATH-5-22` are the same defect in three consumers. `level-catalog.js` already exists as a generated source of truth for level identity — extend it to emit the theme vocabulary, the `SCENARIOS` key set, the mission-gate list and the collectible-density keys, and make all three consumers read it.

---

# Audit Metadata

| | |
|---|---|
| **Findings documented** | **86** across 5 phases (113 raw findings raised during the audit; several verified-correct results and duplicate-signature items were consolidated into the "Verified correct" / "Retractions" tables rather than given their own heading) |
| **By severity** | correctness 40 · gameplay 13 · tuning 20 · dead-code 24 · divergence 6 |
| **Retracted after verification** | **14** (24 retraction markers across the document) |
| **Independently corroborated** | `MATH-1-1` and `MATH-1-4` confirmed from `src/engine/Physics.ts`; `MATH-2-1` confirmed by internal inconsistency with `npc-ai.js:1562-1565`; `MATH-4-2` and `MATH-4-11` re-grepped directly |
| **Coverage** | ~30,000 lines across the math-dense files; ~2,900 `Math.*` call sites |
| **Verification harness** | `%TEMP%/opencode/math-audit/` — `extract.mjs` (verbatim extraction of `game_core.js:46-297`), `verify1-4.mjs`. Nothing in the repo was modified. |
| **Not covered** | `proc_terrain.js` heightfields · NPC-vs-NPC collision *resolution* (MOBIL/IDM at `npc-ai.js:649-664`, `:962-979`) · pedestrian FSM movement multipliers (need a design ruling on whether the world is metric) · `course.js` campaign XP/prerequisite math · `rule-breaker-profiles.ts` · `room-architect.js` · the Supabase `public_profile_directory` RPC and its `ORDER BY` · shader/render math · bundled `libs/` · no browser or runtime execution |

