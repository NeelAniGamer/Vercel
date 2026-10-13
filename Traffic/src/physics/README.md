# Physics Engine

A from-scratch physics engine for Mumbai Traffic Hero.

**Status:** foundation complete — `math/` and `core/Units` implemented, 47 tests
passing, strict typecheck clean. Vehicle layer not yet written.

## Why this exists

`MATH-AUDIT.md` (2026-10-03) numerically verified ~30 defects in the legacy
physics scattered across `game_core.js` (~13,000 lines). Two are severe enough to
be felt immediately in play:

| Finding | Defect |
|---|---|
| `MATH-2-1` | Collision rotation uses a **transposed** matrix — the player drives through 45°-yawed buses |
| `MATH-1-6` | Position integration has **no `dt`** — the car covers 0.33× the ground at 30 fps and 2.4× at 144 fps |

Underneath them sits one systemic cause: **five mutually incompatible
conversions of the internal speed unit** (×30 physics, ×100 HUD, ×20 NPC, ÷100
cruise, a hardcoded `0.033` for lateral slip). That is why the engine models
accelerates at 8.26 g, brakes at 11.56 g, and coasts down at 230× real rolling
resistance — and why 0-100 km/h is unreachable on the speedometer.

The engine cannot inherit that. It is built SI-only, with exactly one sanctioned
place to cross into legacy units.

## The one rule

Inside `src/physics` everything is SI: **metres, kilograms, seconds, radians,
newtons**. No module introduces its own conversion factor. Cross-boundary
translation goes through `core/Units.ts`, which makes it auditable.

`Units.test.ts` pins the legacy discrepancy deliberately. If that test ever
needs changing, the legacy runtime has been migrated and the bridge can be
deleted — which is the intent.

## Layout

```
src/physics/
  math/        Scalar · Vec3 · Quat · Mat3          allocation-free primitives
  core/        Units · RigidBody · Integrator · World
  collision/   shapes · AABB · broadphase · narrowphase · contacts
  solver/      contact impulses · friction pyramid · joints
  vehicle/     Pacejka MF5.2 · Suspension · Powertrain · VehicleBody
  softbody/    XPBD particles + distance/area/volume constraints
  fluid/       position-based fluids (SPH/PBF)
```

Each layer depends only on the ones above it. `math/` has no dependencies at all.

## Design rules

**No per-frame constants.** Anything normalised per frame must be converted
with the real `dt`, never a hardcoded `1/30` or `1/60`. `Scalar.dampFactor`
exists so exponential smoothing is frame-rate independent by construction, and
`Scalar.test.ts` asserts it stays identical from 10 fps to 144 fps. This is the
direct guard against `MATH-1-6` recurring.

**Exact where it is cheap.** Orientation integration uses the exact exponential
map (`q(t+dt) = exp(½ω·dt)·q(t)`) rather than the linearized form. A steady
yaw rate then integrates without drift regardless of step count — the linearized
version was measurably off by 4.4e-6 in heading after 250 steps, which compounds
into a car that slowly drifts off its line.

**Allocation-free hot paths.** Mutating vector methods take an explicit output
buffer. The engine runs 60+ times a second over hundreds of bodies.

**Fail loudly, never silently.** `Mat3.invert()` returns `false` on a singular
matrix rather than writing zeros — a zeroed inertia tensor propagates through
the whole solver and is nearly impossible to trace back.

**Physically correct primitives.** `Mat3.addPointMass(m, r)` implements
`m(|r|²I − r⊗r)`. Accumulating raw outer products instead puts inertia on the
*wrong axes*: a mass 1 m along X would carry inertia about X, when it should
carry none about that axis at all. Both behaviours are locked down by tests.

## Commands

```bash
npm test               # run the physics suite
npm run test:watch     # watch mode
npm run typecheck:physics   # strict typecheck of src/physics
```

The engine has its own `tsconfig.json` with `strict`, `noUnusedLocals`,
`noUnusedParameters` and `noImplicitReturns` enabled. The root `tsconfig.json`
sets `strict: false` — that permissive setting is part of why the original
defects survived, so the engine opts into strictness independently. `src/` is
still covered by the root config, so `npm run typecheck` passes unchanged.

## Relationship to `src/engine/Physics.ts`

That file predates this engine and is left untouched. It is `// @ts-nocheck`'d
and, despite its header claiming "Dual-Track Dynamic Physics Engine", contains
only static math methods — no state, no integrator, no bodies. Its Pacejka
model and slip-angle geometry are sound and can be used as a cross-check against
`vehicle/` when that layer lands.

Note that `src/` is currently unwired: per `AGENTS.md`, Vite enters at
`Traffic/index.html` (which iframes the vanilla pages) and Electron loads
`Driving.html`. The engine is not yet in the live game path — wiring it up is a
separate, deliberate step.

## Validation oracle

`@dimforge/rapier3d-compat@0.21.0` is already a dependency of this package but
unused — the hand-rolled legacy physics runs instead. It is available as an
independent reference implementation to cross-validate the collision and solver
layers against. Being a separate codebase, it is a genuine check rather than a
restatement of the same assumptions.

## Roadmap

Layers in build order. Each lands with tests before the next begins.

- [x] `math/` — Scalar, Vec3, Quat, Mat3
- [x] `core/Units.ts` — SI authority and legacy bridge
- [ ] `core/RigidBody.ts` — mass, inertia tensor, body/world inertia transforms
- [ ] `core/Integrator.ts` — substepping; closes `MATH-1-6`
- [ ] `collision/` — shapes, SAT/GJK narrowphase; closes `MATH-2-1`
- [ ] `solver/` — sequential impulses, friction pyramid, restitution
- [ ] `vehicle/` — Pacejka MF5.2, load transfer, powertrain; closes
      `MATH-1-1`, `MATH-1-2`, `MATH-1-3`, `MATH-1-10`
- [ ] `joints/` — revolute, prismatic, distance, ball-socket, fixed
- [ ] `broadphase/` — uniform grid and sweep-and-prune
- [ ] `softbody/` — XPBD
- [ ] `fluid/` — position-based fluids

Closing `MATH-1-6` and `MATH-2-1` is the first milestone that improves the
drivable game. Per `AGENTS.md`, each vehicle-affecting change must be
playtested — the current oversteer bias and the missing `dt` interact, so
fixing one alone will change handling.