# Traffic — Build & Verification Notes

Working notes for the Electron/static build. Trust this over `README.md`,
`PROJECTS.md` and `CODEBASE.md`, which carry stale architecture and size claims.

## Entry points

| Target | Entry |
|---|---|
| Electron app | `Academy.html` — the static start page, not a direct level load |
| Electron dev | `http://localhost:5173/Academy.html` |
| Browser | `index.html` (desktop shell, 4 iframe views) or `Academy.html` directly |

`Driving.html` is reachable via the Modes menu (F2) or `index.html`. It is
deliberately **not** the app entry: it is the heaviest page in the project.

## Engine: three.js r186 via a global shim

The game is ~3.8 MB of classic scripts with roughly **4,700 `new THREE.*` call
sites**. three.js removed the UMD/global build after r148 and removed
`examples/js/` entirely, so r186 is ESM-only. Rather than convert 40+ files to
modules, `three-shim.js` re-exports r186 and its addons onto `window.THREE` in
the shape r128 provided, and `build-three-bundle.js` esbuilds it to one classic
script:

```
node build-three-bundle.js     # -> libs/three-bundle.js  (~909 KB)
```

That bundle is *smaller* than the r128 `three.js` (1.13 MB) plus the 16 addon
files it replaced, which have been deleted.

**Two traps, both hit during this work — read before editing `three-shim.js`:**

1. **Never `Object.assign(THREE, ...)`.** An ES module namespace object is
   frozen, so the assignment throws and `window.THREE` is never set. Build a
   plain object copy instead. The smoke test asserts the source contains no
   `Object.assign(THREE,`.

2. **`import.meta.url` must be defined at build time.** r186's `DRACOLoader`
   evaluates `new URL('../libs/draco/draco_decoder.wasm', import.meta.url)` at
   *module scope*. In an IIFE bundle esbuild substitutes an empty `import.meta`,
   so that constructor throws `Invalid URL` and kills the entire bundle before
   anything is assigned. `build-three-bundle.js` therefore sets
   `define: { 'import.meta.url': '__threeBundleSelfUrl' }` plus a banner deriving
   it from `document.currentScript.src`. The smoke test asserts the bundle still
   contains that identifier.

`start.js` also calls `dl.setDecoderPath('libs/draco/')`, which overrides the
loader's default — but the module-level `new URL` still has to survive to reach
it. The vendored decoder in `libs/draco/` is the r186-matched copy from
`node_modules/three/examples/jsm/libs/draco/`.

### Breaking API migrations applied

| Old (r128) | New (r186) | Sites |
|---|---|---|
| `renderer.outputEncoding = THREE.sRGBEncoding` | `outputColorSpace = THREE.SRGBColorSpace` | `render_core.js` |
| `WebGLRenderTarget({ encoding })` | `{ colorSpace }` | `render_core.js` |
| `texture.encoding = THREE.sRGBEncoding` | `texture.colorSpace = THREE.SRGBColorSpace` | `ui.js` (was `character_model_patch.js`) |

The last two were guarded by `if (... && THREE.sRGBEncoding)`. On r186 that
constant is `undefined`, so leaving the guard alone would have made the fix
silently never apply. Guards were changed to `THREE.SRGBColorSpace`.

Verified absent from the codebase: `LinearEncoding`, `GammaEncoding`,
`physicallyCorrectLights`, `useLegacyLights`, `THREE.Math`, `addAttribute`,
`WebGLMultisampleRenderTarget`.

### GPU acceleration

`electron/main.ts` sets ANGLE switches before app-ready so Chromium uses the
native backend instead of falling back to SwiftShader:

| Platform | Switch |
|---|---|
| Windows | `--use-angle=d3d11` |
| Linux | `--use-angle=vulkan` + `--enable-features=Vulkan` |
| all | `--ignore-gpu-blocklist`, `--enable-gpu-rasterization`, `--disable-gpu-driver-bug-workarounds` |

## Startup payload: no base64 in JS

Five files used to inline base64 and were parsed before the first frame. They are
now tiny stubs pointing at real binaries in `Models/embedded/` and
`cert-assets/`.

| File | Was | Now |
|---|---|---|
| `lambo.js` | 14.45 MB | 685 B stub -> `Models/embedded/lambo.glb` |
| `env.js` | 4.57 MB | 680 B stub |
| `bus.js` | 2.72 MB | 677 B stub |
| `auto.js` | 1.05 MB | 677 B stub |
| `cert_assets.js` | 17.60 MB | ~1.8 KB stub -> real PNG paths |

This works because `start.js` does `loader.load(window.MODELS[key], ...)` and
GLTFLoader accepts a URL exactly as it accepted a `data:` URI — the contract is
unchanged, so **no consumer needed editing**.

`cert_assets.js` held only **two unique images**, each repeated three times
(`CERT_LOGO_1 = _3 = _6`, `CERT_LOGO_2 = _4 = _5`) — 11.74 MB of pure
duplication. All six names are preserved; 3-6 alias 1-2.

### Do not recreate Traffic/lambo.glb

There used to be a `lambo.glb` at the **top level** of `Traffic/`, byte-identical
in size (11,099.7 KB) to `Models/embedded/lambo.glb` but a *different build* —
its SHA-256 did not match the hash recorded in `lambo.js`. Nothing referenced it
by path, it was not in `dead-model-files.json`, and `build.js` is a deny-list,
so it was silently shipping ~11 MB on every deploy.

It has been deleted. The only live copy is `Models/embedded/lambo.glb`. If you
ever see a stray `Traffic/lambo.glb`, it is a stale artifact, not a fallback.

### Certificate logos

`cert-assets/cert_logo_1.png` was 4.33 MB at 2282x1856 — about one byte per
pixel — and was rendered **only** by `#cert-logo-1`, which is `height: 24px`
(the challan footer in `Driving.html`). The page already referenced
`mumbai-police-logo.png` for the same logo on the certificate itself
(`#cert-logo-5`, 75px) at 512x416.

The two files are the same image. Verified rather than assumed:

```
LANCZOS downscale 2282x1856 -> 512x416 vs mumbai-police-logo.png
mean absolute pixel difference: 0.46 / 255
```

So `CERT_LOGO_1` now points at `mumbai-police-logo.png` and the 4.33 MB file is
gone. Side benefit: the challan footer and the certificate now render the *same*
file instead of two encodings of one logo.

`CERT_LOGO_2` is **not** interchangeable — `cert_logo_2.png` and `sneh-logo.png`
are genuinely different images (mean abs pixel difference 17.85/255, aspect
1.39 vs 1.97). It keeps its own file, downscaled 2321x1668 -> 512x368 for a 24px
render (73 KB -> 35 KB).

To re-derive the render sizes rather than trusting the CSS, run:

```
node tools/measure-cert-logos.js
```

It boots both pages in Chromium and reports each element's real rendered box
against its source pixel size.

## Offline operation

The game code is fully local. Verified by `npm run test:smoke`, which fails the
build if any engine or asset code is fetched from a CDN.

Vendored under `libs/`:

- `libs/three-bundle.js` — three.js **r186** core + 12 addons, one classic script
- `libs/draco/` — decoder `.js` + `.wasm`, wired via `start.js` `setDecoderPath`
- `libs/chart.umd.min.js`, `libs/jszip.min.js`, `libs/html2pdf.bundle.min.js`

Deliberately still remote, because each is remote **by nature** and degrades
without breaking the game:

| Service | Why it stays remote |
|---|---|
| AdSense | Revenue, not game code |
| Google Fonts | CSS already declares `system-ui` fallback |
| Supabase + Google Identity | Sign-in cannot work offline regardless of bundling |
| Vercel Speed Insights | Injected by the Vercel platform, not shipped in the app |

If you add a new runtime dependency, add it to `libs/` and update
`FORBIDDEN_HOSTS` / `GAME_CODE_PATTERN` in `pw_test.js`.

## Packaged layout

```
app.asar/
  package.json
  col-router.js  col-ui.js  col-auth.js  col-ui.css  config.json   <- asar ROOT
  dist/
    Academy.html  Driving.html  TrafficDashboard.html  TrafficSetup.html
    libs/  levels/  Models/  textures/  skins/
```

Pages reference shared modules as `../col-*.js`, which resolves to the **asar
root**. That is why those files are listed in `build.files` and are not only
inside `dist/`. Getting this wrong 404s auth/router/UI in the packaged app while
still working in `electron:dev`.

`extraResources` was removed. `Models/` used to ship twice — once inside the
asar and again at `resources/Models` (~800 MB wasted). Pages load `'Models/...'`
relative to the HTML, so they resolve inside the asar.

## Verification

```
npm run test:smoke      # from Traffic/ or repo root - 57 checks, Playwright + throwaway static server
npm run test:stubs      # startup stubs small, base64-free, targets exist (no deps needed)
npm test                # both of the above, from the repo root
npm run typecheck       # permissive: strict is false
node --check <file>     # syntax for individual scripts
```

Run `build.js` **from the repo root**, not from `Traffic/` — it spawns
`Traffic/tools/validate-levels.js` with a root-relative path and fails with
`MODULE_NOT_FOUND` otherwise.

`npm run test:smoke` starts a throwaway static server rooted at the **parent**
of `Traffic/` (because of the `../col-*` references), loads every entry page in
Chromium, and asserts:

- zero console errors on each page
- zero CDN requests for engine/asset code
- `THREE` + every loader resolve locally
- canvas exists and `window.LVS` is populated
- robot GLBs and the Draco decoder are served
- certificate logos resolve to decodable images at the paths `cert_assets.js`
  actually assigns (not hardcoded filenames, so repointing a logo cannot make
  this check lie)
- packaging invariants in `package.json` / `electron/main.js`

### Expected console noise

The gate is only useful if it is green, so a few third-party messages are
filtered in `EXPECTED_NOISE` / `AUTH_NOISE` / `CSP_NOISE`. `CSP_NOISE` is
deliberately narrow: it requires *all* of "report-only", `frame-ancestors`, and
a Google host. Chromium logs the Google Sign-In/AdSense iframe being framed as
a report-only `frame-ancestors 'self'` violation and states "no further action
has been taken". An **enforced** CSP violation stays fatal.

Do not widen these filters to make a failure go away. If the gate goes red for
a reason you believe is noise, fix the filter narrowly and say why in a comment.

### CI

`.github/workflows/traffic-smoke.yml` runs both gates on every push/PR that
touches `Traffic/`. This gate used to run by hand only, so a change could break
boot and still merge.

Playwright is declared in the **root** `package.json` on purpose. Adding it to
`Traffic/package.json` as well would duplicate the dependency and force a second
~150 MB browser download; `require('playwright')` resolves upward from
`Traffic/` to the root `node_modules`.

### Proving a gate still works

A gate that cannot fail is decoration. After changing `pw_test.js` or
`check-startup-stubs.js`, confirm it still goes red — e.g. point `CERT_LOGO_1`
at a file that does not exist and check the run exits non-zero.

## Security / integrity pass (2026-10-03)

### Developer access is now console-only

There is no longer any UI path, keybind, or persisted flag that unlocks content
or disables damage. Previously all of these shipped:

- a 3-tap version-badge cheat that granted invulnerability
- a hardcoded name list on `Driving.html` and `Academy.html` calling
  `ui.adminUnlock()` (all levels, all badges, +7500 XP)
- `Ctrl+Shift+D` bound to `adminUnlock` in `start.js`

Replaced by `window.colDev` in `ui.js`, which is only reachable from the console:

```
colDev.godMode(true)      collisions cannot kill you
colDev.telemetry(true)    fps / p95 frame ms / draw calls / NPC count
colDev.unlockAll()        every level + every badge (local only)
```

State lives only in `window._trafficGodMode` / `window._trafficTelemetry` and
dies on reload, so a student cannot inherit it from a shared machine.

### `window.colUser` is a session-only channel

`col-auth.js` reserves it for a verified Supabase session. `TrafficSetup.html`
was fabricating one (`isLocal: true`) and dispatching `col-auth-changed`, which
`Academy.html` then treated as signed-in. Offline profiles now publish on
`window.colLocalUser` only, and `col-auth-changed` carries
`{ user: null, localUser }` for that path.

Offline PINs are verified through `col-auth.js`'s PBKDF2-SHA256 verifier
(`colVerifyLocalCredential`, now exported). The old local-account branch tested
`if (!expectedPin || expectedPin === pass)`, so **any** password logged in to any
account that had no `pin` field.

`p_role` is no longer client-supplied — `Academy.html` routed on it to send
"parents" and "teachers" to the dashboard.

### Progress integrity

`ui._selSyl()` used to write `S.comp[lv.id] = { score: 100, finalQuiz: true }`
as soon as every syllabus topic was opened (or `practical`/`exam` alone). Reading
the briefing therefore completed the lesson at a perfect score, which fed
`Object.keys(S.comp).length`, the dashboard counters and certificate eligibility.
Syllabus reading now records `S.sylViewed` only. Completion is written solely by
`ui._fq()`, `ui.showResults()` and `game_core.completeLevel()`.

### Level count has one source of truth

`tools/gen-level-catalog.js` reads `levels/*.js` and emits `level-catalog.js`
(id, real name, icon, description, totals). `TrafficDashboard.html` uses it in
place of a hand-written `_LEVEL_NAMES` array that had drifted completely — it
listed lesson 1 as "Free Roam" when `levels/level1.js` is "Red Light Patience",
and stopped at 20. It also replaces the hardcoded `/52` literals via
`LEVEL_TOTAL`.

```
node tools/gen-level-catalog.js
```

The generator also reports any level missing from `course.js` `MODULES`.
`level54.js` was one; it is now registered.

### Three.js: do not dispose clones

`Object3D.clone()` shares geometry and material with its source. `CityChunk.dispose()`
and `AISpatialPlacementEngine.reset()` disposed both, so the first chunk unload
destroyed the shared GPU buffers and corrupted every other instance of that model
for the rest of the session. They now detach only.

## Known non-issues

`Cyberpunk/` is copied by `build-electron.js` but does not exist; `copyDirSafe`
skips it silently. Harmless, but it means the copy list is not a reliable
inventory of what ships.

## OneDrive file locks (build can fail for this reason)

This repo sits inside OneDrive, which memory-maps files it syncs. `esbuild`
cannot overwrite a mapped file, and the build fails with:

```
Failed to write to output file: open ...\electron\main.js:
The requested operation cannot be performed on a file with a user-mapped section open.
```

Fix: delete the output first so esbuild creates a fresh file rather than
overwriting in place.

```powershell
Remove-Item .\electron\main.js, .\electron\preload.js -Force
```

The same cause produces `Warning copying ...\Icon.png` from `copyFileSafe`.
It is not a code fault and does not affect the build.

## Robot NPCs

See `Models/robots/CREDITS.md`. Behaviour profiles are `robot_delivery` and
`robot_crosser` in `npc-ai.js`, both with `weight: 0` so `pickRandomProfile()`
never picks them — a robot appears only when a level sets `profileKey`
explicitly. Model paths, per-model scale and animation clips live in
`ROBOT_MODELS` in `robot-npcs.js`.

**The models are centimetre-scale and need a large per-model multiplier.** They
differ by ~13x, so there is no safe global scale. `ROBOT_MODELS[k].scale` is
derived from bind-pose bounds against `anim_walker_biped.glb` (1.700 m).