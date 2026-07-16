# Fixes so far — 2026-07-13 through 07-16

## ⚠️ Batch 7 regression — fixed, please verify

Right after batch 7 (NPC AI research pass), vehicles stopped following the road. Root cause:
the overtake and emergency-unstuck logic assigned lane targets as raw absolute world
coordinates instead of positions relative to each NPC's own road (`baseCoord`). Fixed in all
three places this appeared (overtake, unstuck, and a third pre-existing instance in the
ambulance-yield code with the identical bug). **This still needs your visual confirmation** —
batch 8 (below) touches the same NPC code again, so please check the batch-7 fix is solid
before assuming batch 8 is too.

Files changed overall: `Academy.html`, `Driving.html`, `TrafficDashboard.html`, `game_core.js`,
`ui.js`, `scenario2d.js`, `start.js`, and 50 of the 52 files in `levels/`. `fixes_all.patch`
(parent folder) is the same changes as one unified diff. Every JS file and every inline
`<script>`/`<style>` block passes a Node syntax check and CSS brace-balance check — none of it
has run in an actual browser, since I don't have one in this environment.

## Batches 1–6 (condensed)
Core bugs: dead level-completion path, console-flood debug spam, duplicate mouse-look handlers,
19 broken `.webp` refs, sign-in state sync, light-mode title contrast, certificate
image-sharing, level renumbering, `S.score` bug, unique certificate URL via new `certificates`
table (⚠️ unverified — no network access here to test against Supabase). Mobile CSS audit, 25
issues, plus the mobile "level map" that was never populated (every phone saw empty space
instead of levels) — fixed. Driving HUD `#task-tracker`/`#dn-clock` collision fixed (can't
render to confirm visually — please check on a small phone); real gyro calibration + auto-
recalibration + rotate-device overlay. Gyro fully overrides joystick steering; connected the
previously-disconnected 2D-practice and 3D-drive flows. Playable bike mode across 50/52 levels,
"Preferred Vehicle" onboarding now honored, real bike-specific rules — known gap: no
bike-specific quiz content yet. Unused `cube-pets` models given a real purpose: Level 26
("Cows on the Road") had zero actual cow or working task logic — built a real cow obstacle,
fixed a bonus bug affecting 10 levels' "don't honk" tasks, fixed a dead `this.themeType`
reference. Dark/light toggle got a clouds layer to match your reference image.

## Batch 7 — NPC AI researched against GTA 5/6 (see regression note above)
Added per-NPC personality/aggression (0.7–1.4x, bikes skew highest — matching the specific
GTA6 trailer detail of bikers overtaking trucks), reaction distances that scale with the NPC's
own speed (the documented community fix for GTA5's "sudden brake slam" complaint), and an
emergency unstuck maneuver for vehicles genuinely stuck 7+ seconds.

## Batch 8 — Performance: the two items you asked for

**Spatial hash grid replaces O(n²) NPC proximity scans.** Found 6 separate places in the NPC
update loop where each NPC scanned *every other NPC* to check obstacles ahead, lane-change
safety, and collision spacing — with, say, 40 active NPCs, that's up to ~9,600 distance checks
every single frame. All 6 checks only ever look within 25 units, so I built a simple spatial
hash grid (bucket NPCs into 25-unit cells, rebuilt once per frame) and had all 6 checks query
only the surrounding 3x3 neighborhood of cells instead of the full NPC list — same candidates
found, far less work to find them. This is a mechanical, behavior-preserving swap (verified the
neighborhood search radius covers every distance threshold the original checks used) — but
given it touches the exact same NPC code as the batch-7 regression, **please treat this as
needing the same verification** before assuming it's solid.

**Building LOD is now continuous and player-relative, not one-time and origin-relative.** The
existing "Mobile LOD" only ran once at level start, measured distance from world origin
(0,0,0) rather than the player's actual position, and permanently deleted distant buildings
(`scene.remove()`) rather than just hiding them — so a level where the player doesn't spawn
near the origin would cull the wrong things, and once removed, a building could never
reappear even if the player drove back toward it. Replaced with a system that re-evaluates a
few times a second based on the player's current position and toggles visibility
(non-destructive), so buildings correctly show/hide as the player actually moves around,
instead of a single incorrect snapshot taken at level start.

## Status across the whole plan

**Done:** Batches 1–8 above.

**Not started yet, per your requested order:**
1. All of Phase 8 (living-city ambience, civic-score, landmark objectives, weather scenarios,
   co-op/ghost mode, parent/teacher dashboard) — next
2. World density / minimap+compass / more Kenney assets / greenery
3. Bike-specific quiz content, age-adaptive UI tiers — queued at my discretion after the above

Please flag anything that doesn't actually work once you can run it — that feedback loop
caught the batch-7 regression fast, and batch 8 is exactly the kind of change (behavior-
preserving refactor, can't visually verify) where the same kind of check matters most.
