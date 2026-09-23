# AGENTS.md — Class Of Learners (Vercel)

Static HTML + vanilla JS studio site on Vercel (`advancedlogiclabs.dpdns.org`).
Traffic driving game lives in `Traffic/` (vanilla `Driving.html` + `game_core.js`
plus a TS/Vite `src/` stack). Solar sim is `engine.html` + `logic.js`.

## House Rules (Always Apply)

- **Title Case For All User-Facing Text.** Buttons, headings, toasts, tasks,
  dialogue, leaderboard labels — every string the player reads.
- **UI Code Must Be Optimized And Mobile-Responsive.** Target 360px first.
  Prefer `transform`/`opacity` animations (compositor only), never animate
  `background-position` on full-viewport layers. Keep `backdrop-filter` radii
  small (≤20px) and off small screens where possible. Cap DPR (mobile 1.0,
  1080p ceiling). Lazy-load below-fold content.
- **Profile And Leaderboard Use The Google Account PFP.** Avatar image comes
  from the live session (`colUser.picture`, Google OAuth metadata) — never
  initials when a photo exists, never a stale cached URL.
- **Only The Logged-In Account Is Ever Shown.** Resolve identity from the live
  Supabase session only. Never render other/stale accounts from
  `localStorage` snapshots (`traffic_local_user`, old `mth4` copies). "You"
  highlighting must match the live session id and nothing else.
- **Playability First.** The game is currently not playable end-to-end; many
  systems are broken. Prefer fixes that make a level completable and readable
  over new features. Every change must keep all 54 levels loadable.

## Design Pillars (Score Every Feature Against These)
1. **Real Law By Doing** — every mechanic maps to an MV Act section.
2. **Mumbai First** — language, places, vehicles, characters read as Mumbai.
3. **Thirty-Second Fun** — playable and rewarding within 30 seconds of input.
4. **Respect The Player's Time** — fail fast, autosave everything, no
   unskippable replays. Anything failing all four gets cut or parked.

## Build / Verify

- Build: `node build.js` (also `npm run build`). It copies the tree to `dist/`,
  which is committed — rebuild after editing root files so `dist/` mirrors them.
- No test runner, linter, or CI exists. Verify JS with `node --check <file>`
  (use a `.mjs` copy for ES modules). Verify HTML script-tag edits with a
  tag census (deferred vs blocking) and confirm boot still works (see below).
- Shell is Windows PowerShell: use `;` separators (no `&&`), `Select-Object`
  (no `head`), `Get-ChildItem` (no `ls -la`), no `grep`/`wc`.

## Architecture Facts (Verified, Non-Obvious)

- `build.js` excludes `node_modules`, `dist*`, `.env`, `*.db`, `*.exe`.
  Never ship `Traffic/Models/` changes lightly (1GB, lazy-loaded at runtime).
- `Traffic/Driving.html` + `Academy.html`: nearly all scripts are `defer`red;
  only `three.min.js` (r128 CDN) stays blocking. Boot is event-driven
  (`start.js` polls for `Game`), so defer is safe for game scripts — but any
  new parse-time global consumer breaks this. `ui.js` exists only on Academy;
  on Driving `window.ui` is a stub (`{}`) — guard `ui.showQuiz` before calling.
- Level files (`Traffic/levels/*.js`) push to `window.LVS`; Academy renders
  cards/briefings straight from them, so syllabus text always matches.
  Level config merges into `mapCfg` via `Object.assign` — any new `cfg.*`
  field flows through automatically.
- Task targets that actually complete (`game_core.js` `_checkTasks`):
  `stop` (`stationary`, `red_light`, strict `red_signal`),
  `reach` (`destination`, `checkpoint_N`, `finish`, `green_light`, …),
  `avoid` (`honk`, `pedestrian`, `speed_zone`, …), `enter_vehicle`.
  Anything else never ticks — adding a target requires an engine branch.
- School geometry must come from level config (`schoolX/schoolZ/zebraZ/
  flasherZ`). Never hardcode coordinates: the legacy (-60,-32) school,
  origin (0,0) mission zone, and fixed Z=2050 flasher bugs all came from this.
- NPC behavior: `npc-ai.js` profiles + `npcMix`/`pedMix` + scripted `npcs[]`
  with `profileKey` (`traffic-manager.js`). Horns auto-suppress in silence
  zones; NPCs clamp speed near `schoolZ`.
- Save split (do not break): Driving `completeLevel` writes `S.comp`
  (score/stars/modes) only; quiz (Academy `ui.js`) adds `S.total`/civic/
  badges with an idempotency key (`S._counted`). Touching either side
  double-counts or loses progress. Run saves live in `traffic_run_<id>`
  (30-min freshness, T to resume); syllabus ticks in `S.sylViewed`.
- Leaderboard (`Traffic/TrafficDashboard.html`): dense tied ranks, escaped
  names, per-tab scoping must run on first paint (not just tab clicks),
  podium colors follow place not display index. Data: `certificates` →
  `user_profiles` fallback, `wallets`, `badges` via Supabase.
- Textures: keep hero images ≤2048px, logos/icons ≤256px (PIL batch noted
  in session history). `earth_clouds.jpg` is unreferenced dead weight.
