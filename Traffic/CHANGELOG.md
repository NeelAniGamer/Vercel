# Fixes so far — 2026-07-13 through 07-17

## Still needs your verification (carried forward)
Batch 7 regression fix (vehicles veering off-road) and batch 8 performance changes (spatial
grid, continuous LOD) both touch NPC/scene code and aren't confirmed working in a real browser
yet. Everything since has been routed around that code deliberately, but those two are still
the most important to check.

Files changed overall: `Academy.html`, `Driving.html`, `TrafficDashboard.html`, `game_core.js`,
`ui.js`, `scenario2d.js`, `start.js`, and 50 of the 52 files in `levels/`. `fixes_all.patch`
(parent folder) is the same changes as one unified diff. Everything passes a Node syntax check
and CSS brace-balance check — none of it has run in an actual browser.

## Batches 1–6 (condensed)
Core bugs (dead completion path, console spam, duplicate handlers, broken image refs, sign-in
sync, light-mode contrast, certificate sharing, level renumbering, score display bug, unique
cert URL ⚠️unverified). Mobile CSS audit (25 issues) + the mobile level-map that was never
populated. Driving HUD collision fix + gyro calibration/rotate overlays. Gyro overrides
joystick; connected 2D-practice to the real 3D drive. Playable bike mode (50/52 levels) +
preferred-vehicle onboarding honored + bike-specific rules. Unused cube-pets → real cow
obstacle for Level 26 (was completely uncompletable) + fixed 10 levels' "don't honk" tasks.
Dark/light toggle clouds.

## Batch 7 — NPC AI vs GTA 5/6 research (caused the regression above, since fixed)
## Batch 8 — Performance: spatial grid + continuous LOD (touches same code, also unverified)
## Batch 9 — Phase 8: civic-score system + parent/teacher dashboard view
## Batch 10 — World density: ambient stray dogs + the compass strip from early in this project

## Batch 11 — Phase 8: landmark objectives

Found something good while looking into this: **Gateway of India already exists as a detailed
procedural monument** — appears on Level 1 specifically, plus randomly (20% chance) or by name
match ("Marine Drive"/"Colaba"/"Gateway"/"Exam") on other levels. Sneh Asha's building is also
already there on Level 1. Both were purely decorative background scenery — nothing in the game
ever acknowledged you'd actually passed one.

Gave them real presence instead of building new landmarks from scratch:
- Registered both as discoverable landmarks with world position.
- One-time discovery toast ("🏛️ You've reached Gateway of India") the first time you get within
  50 units of one.
- Gold diamond markers on the minimap, distinct from NPCs/checkpoints, so they read as
  points of interest rather than just background geometry.

Note: I looked for Marine Drive / Bandra-Worli Sea Link as dedicated levels first — turns out
those aren't actually built as levels (I'd assumed they were, several rounds back, without
checking — this correction is that check). The 20%-random Gateway trigger means it can already
appear on a wider set of levels than just Level 1, which is why this was worth doing generally
rather than only for Level 1.

## Status across the whole plan

**Done:** Batches 1–11 above.

**Not started yet:**
- Phase 8 remaining: weather scenarios, co-op/ghost mode
- Bike-specific quiz content, age-adaptive UI tiers

Please test what you can, especially the still-outstanding batch 7/8 NPC changes.
