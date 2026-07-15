# Fixes so far — 2026-07-13 through 07-15

Files changed: `Academy.html`, `Driving.html`, `TrafficDashboard.html`, `game_core.js`,
`ui.js`, `scenario2d.js`, and 50 of the 52 files in `levels/`. `fixes_all.patch` (parent
folder) is the same changes as one unified diff. Every JS file and every inline
`<script>`/`<style>` block in the HTML files passes a Node syntax check and a CSS
brace-balance check — but none of this has run in an actual browser, since I don't have one in
this environment. Please test before deploying, especially items flagged
"unverified"/"can't render to confirm" below.

## Batch 1 — core bugs
1. Level completion never worked, at all (dead `finalQuiz` code path) — fixed.
2. Camera-roll / console-flood debug spam — removed.
3. Duplicate mouse-look systems fighting each other — disabled the conflicting one.
4. 19 broken `.webp` image/texture references — repointed to the `.png`s that exist.
5. Sign-in state not updating across screens (duplicate `class` attributes) — fixed.
6. Light-mode loading-screen title was invisible — fixed.
7. Certificate sharing now sends the actual certificate image, not a dead link.
8. Level renumbering — syllabus shows position-within-category, not raw global id.
9. `S.score` was never set — certificate/stats always showed "Score: 0" — fixed.
10. Certificate sharing — unique per-user URL via a new `certificates` table. ⚠️ **Unverified,
    needs your testing** — no network access here to test against your live Supabase project.

## Batch 2 — mobile CSS audit (25 issues)
Upgraded one from "flag for review" to an actual fix: the mobile "level map" that was supposed
to replace the syllabus list at ≤768px was never populated — every phone was seeing empty
space where all 52 levels should be. Fixed, plus the other 24 (safe-area padding, touch
targets, overflow fixes, reduced-motion support, etc.) — see prior notes for detail if needed.

## Batch 3 — driving HUD collision + gyro calibration/rotate overlays
Fixed the `#task-tracker`/`#dn-clock` overlap (6 conflicting breakpoint rules). Built a real
gyro calibration overlay (averaged sampling instead of one instant snapshot), auto-
recalibration after 2.5s of straight driving, and a rotate-device overlay for portrait mode.
**Can't render the HUD offsets to confirm they're visually perfect — please check on a small
phone.**

## Batch 4 — gyro fully wins over the joystick, 2D-practice connected to the real 3D drive
Gyro now overrides the joystick's steering axis entirely. Investigated the "2D practice
before/after 3D level" question and found practice and the real level were two **entirely
disconnected** experiences — fixed by adding a "Start Driving Test" button to a won 2D practice
run, and relabeling the two competing start-buttons so the choice is explicit.

## Batch 5 — playable bike mode, across 50 of 52 levels

This was the very first thing asked for in this whole conversation — different rules/vehicles
for bike vs. car — so worth explaining in full:

- **Turns out the 3D vehicle-building code already fully supported a 'bike' type** —
  `_buildVehicle()` in `ui.js` already had bike model lookup, scaling, and even a fallback if
  the bike GLB isn't loaded. It was just never exposed as something you could actually pick,
  because no level's `modes` array ever included `'bike'`.
- **Enabled `'bike'` in 50 of 52 levels' `modes` arrays** (`levels/level*.js`) — left out
  Level 29 ("Auto-Rickshaw Dance") and Level 52 ("Driving Instructor") since those are
  thematically built around a specific non-bike vehicle/lesson, and shoehorning a bike into
  them didn't make narrative sense. Everything else — parking, red lights, ambulance
  yielding, puddles, festivals, toll plazas — a bike rider needs the same awareness, so those
  are all open to it now.
- **Wired up the "Preferred Vehicle" onboarding choice, which was stored but never used
  anywhere** (`ui.js`, `showBriefing()`). Picking "Motorcycle" at signup now actually defaults
  you into bike mode when starting a level that offers it, instead of silently doing nothing.
- **Added genuine bike-specific rules** rather than just letting a bike drive through
  car-authored content unchanged (`game_core.js`): a one-time helmet reminder toast the first
  time a bike picks up speed, and a stricter safe-speed expectation for two-wheelers in zones
  that don't post an explicit limit (capped so it never double-penalizes on top of an existing
  posted zone limit).
- **Known gap, flagged rather than faked:** the quiz system already supports per-mode question
  sets (`quiz: { car: [...], bike: [...] }`) if a level defines them — but since no level ever
  had bike enabled before, none of them have bike-specific quiz questions written yet, so bike
  mode currently falls back to the car quiz content. Writing genuinely differentiated bike quiz
  questions for 35+ levels is real content-authoring work, not a code fix — happy to start on
  a batch of those if you want, but didn't want to generate 35 sets of quiz questions
  unprompted without knowing if that's actually the next priority for you.

## Status across the whole plan

**Done:** Batches 1–5 above.

**Not started yet:**
- Bike-specific quiz question content (see gap above)
- Dark/light toggle visual redesign — overflow bug fixed in batch 2, redesign itself not done
- World density / minimap+compass / more Kenney assets / greenery
- Age-adaptive UI tiers (spec'd in the plan doc, not implemented)
- Performance (LOD, spatial partitioning)
- All of Phase 8 (living-city ambience, civic-score, landmark objectives, weather scenarios,
  co-op/ghost mode, parent/teacher dashboard)
- NPC driving AI quality pass

Real, tested-as-far-as-I-can-test progress each round — not a full pass over the bigger
feature work yet.
