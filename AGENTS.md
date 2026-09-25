# AGENTS.md — Class Of Learners

## Repository Map

- Vercel serves committed root `dist/`; `vercel.json` runs `npm run build`. The site is static HTML/vanilla JS plus esbuild entry `react-src/GamePage.tsx` → `dist/Traffic/simulator-bundle.js`.
- `Traffic/` is a separate npm app with its own lockfile. `Traffic/src` is an unwired TypeScript port: Vite enters at `Traffic/index.html` (which iframes the vanilla pages), while Electron loads `Driving.html`; generated outputs are `dist-web`, `dist`, and `dist-electron`, all excluded from the root build.
- `Terra3D/` is standalone but has no lockfile; use `npm install` there, not `npm ci`. Its Vite build writes `Terra3D/dist`, which currently contains desktop output, so do not run it casually; root Vercel installs only root dependencies.
- `traffic-ts/` is an unowned reference library with no manifest or build script; root build copies it raw, so do not treat it as the active runtime.
- `build.js` is the source of truth for deployment: it clears/recreates root `dist/`, copies the deny-listed runtime tree and `Traffic/public/`, then bundles React. It excludes local agent state, secrets, source-only directories, selected large model paths, and the Traffic-local `col-auth.js`/`col-ui.css`; the pages resolve the root shared copies. Because this is a deny-list, review new files before building.
- `build.js` and `.vercelignore` have separate filters; `.vercelignore` currently lacks `*.exe`, so review Vercel source-upload exclusions even though public `dist/` filters binaries.
- `README.md`, `PROJECTS.md`, and `Traffic/CODEBASE.md` contain stale architecture/count/build claims; trust `build.js`, package scripts, and runtime files.

## Commands

- Use npm; Playwright tooling requires Node 20+. Root install: `npm ci`. Full production pipeline: `npm run build` (its `postbuild` runs production and security checks; direct `node build.js` skips them). `npm run verify:production` checks an existing `dist/` only and is not a browser smoke test; `npm run security:check` guards live-session identity, QR verifier storage, Electron sandbox flags, and CodeQL configuration.
- `npm run build` validates only `level1,level5,level_custom` before copying. Use `node Traffic/tools/validate-levels.js` for the full report (it currently exposes a legacy backlog); keep the 54 numbered levels plus the custom/free-roam entries loadable.
- JavaScript syntax check: `node --check <file>`; use a temporary `.mjs` copy for ES-module files when needed. For HTML/script-load changes, compare blocking vs `defer` tags and smoke-test both `Traffic/Driving.html` and `Academy.html`; no automated browser gate exists.
- From `Traffic/`: `npm ci`, `npm run dev` (Vite on port 5173; serves the current vanilla pages), `npm run typecheck`, and `npm run build:web`; typecheck is permissive (`strict: false`). `build:electron` typechecks, while `electron:build`/`electron:portable` skip it. `npm run test:smoke` points to missing `pw_test.js`.
- Root `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:smoke` have no checked-in root configs/tests (the smoke script requests an undefined `chromium` project); do not treat them as passing gates. `dist/` is committed. The build deletes/recreates it, so rebuild after source edits and never hand-edit generated output. `.github/workflows/` has CodeQL/DevSkim security scans, not a general build/test gate; Dependabot omits Terra3D.

## Non-Negotiable Product Rules

- Title Case every user-facing string. Target 360px first; optimize mobile UI, use compositor-friendly `transform`/`opacity`, avoid full-viewport `background-position` animation, cap DPR, and lazy-load below-fold content.
- `window.colUser` is live-session-only. LocalStorage profiles may support offline setup, but never present them as the signed-in user or use them for leaderboard identity; prefer `colUser.picture`, with initials only when no photo exists.
- `TrafficDashboard.html`'s `col_user` fallback is a regression to remove, not a supported identity source.
- Prioritize a readable, completable level over new features. Preserve Mumbai context, law-by-doing, a useful 30-second loop, autosave, and no forced replay.
- Treat `Traffic/Models/` as large runtime-sensitive assets; review changes for deployment size and runtime impact.

## Traffic Runtime Contracts

- `Driving.html` and `Academy.html` load `ui.js` and most runtime scripts deferred; `start.js` polls for `Game`, so new parse-time global consumers can break boot. Keep optional `ui` calls such as `showQuiz` and challan handlers guarded because UI availability varies.
- Level files register in `window.LVS`; Academy renders from that registry, and `game_core.js` merges the selected `ui.cur` config into `mapCfg` with `Object.assign`.
- `_checkTasks` supports `enter_vehicle`, `stop`, `reach`, `avoid`, and `toggle`; keep `Traffic/tools/validate-levels.js` target tables in sync when adding a type or target.
- Level-specific school/crossing positions come from `schoolX`, `schoolZ`, `zebraZ`, and `flasherZ`; the legacy no-`schoolZ` fallback remains in `game_core.js`, so do not copy its fixed coordinates into new levels.
- `game_core.completeLevel` records `S.comp` and wallet rewards; the quiz/results flow in `ui.js` owns `S.total`, `civicScore`, and badges with `_counted` idempotency. Run saves use `traffic_run_<id>` with 30-minute freshness; syllabus ticks live in `S.sylViewed`.
- NPC behavior comes from `npc-ai.js` profiles, `npcMix`/`pedMix`, and scripted `profileKey`; silence zones suppress horns and NPCs slow near `schoolZ`.
- Dashboard ranks must use dense ties, escape names, scope tabs on first paint, and color podiums by place; data order is `certificates` → `user_profiles` (then `profiles`), with `wallets` and `badges`.

## Commit Attribution

AI commits must include:

```text
Co-Authored-By: <agent model> <noreply@opencode.ai>
```
