# Site Bug Hunt — Class Of Learners

Date: 2026-11-06
Scope: Root site (41 HTML via dist, 645 files, 326 MB) — home, ATI suite, Solar/Engine, Gesture/Perceptus, RPG, QR, Career, CastFlow, Cereal, Database Logic, Download, Dashboard, School, About, Sneh Asha, Traffic game, Terra3D, shared `col-*` + `build.js`/`vercel.json`/`sw.js`/`manifest.json`.

Checks:
- `node scripts/production-check.js` → passed (1 warning: `Traffic/traffic-messenger.html` → `/src/messenger/main.ts`)
- `node scripts/seo-check.js` → passed
- `node scripts/security-check.js --allow-missing-sources` → passed (9 sources)
- `git diff --check` → leftover conflict markers in `home.html` + `dist/home.html` (now fixed, see F1)
- `git status` → `UU home.html` (merge conflict), 25 modified `Traffic/` files, 3 deleted `dist-web` bundles, 11 untracked messenger/src/test files — Vercel builds HEAD, not this working tree.

Fixed in this hunt (safe, minimal):
- F1 `home.html:122-128` merge conflict — took upstream (identical output, less code). `git diff --check` clean after rebuild.
- F2 `ati.html:1992,2019` showcase — `'.png'` → `'.webp'`, regex `\.png` → `\.(?:png|webp)`. Thumbnail clicks (×13) were no-ops; Prev/Next loaded 404 PNGs instead of shipped WebPs.
- F3 `ati-lite.html:4-10` + `rpg.html:4-7` + `download.html:4-6` + `dashboard.html:4-6` + `school.html:4-6` — `<script async …ads…>` before `<meta charset>` → moved charset+viewport first, ad script after description. `ati-lite` also got `canonical`, `robots noindex`, plain description (was hype copy).
- F4 `build.js:43-58` — added `/\.docx$/i` (only). `COL.apk` (7.2 MB) intentionally ships as the Android download (`/COL.apk` referenced by home/download/version.json); `AdvancedTypingInstructor.apk` stays excluded via `excludedFiles`. The `.docx` (65 KB office report) no longer ships. Note: an earlier draft excluded all `.apk` — reverted after `production-check` flagged the broken download link.
- F5 `logic.js:4711,4733,4741` — `EL_FPS`/`EL_DATE`/`EL_CAM` were dereferenced every 10th/20th frame with no null-check. Missing `sb-*` IDs on any page without the status bar threw inside `animate()` before `renderer.render()`. Now guarded (`if (EL_FPS) …`).

Remaining bugs (prioritized, not yet fixed):

## P0 — must fix (deploy blockers or broken features)

**P0-1 `home.html` merge conflict — RESOLVED (F1) but needs `git add`.** Was `UU home.html` (1535 insertions). Blocks commit/push/Vercel auto-deploy. Next: `git add home.html` after review.

**P0-2 Traffic messenger is untracked + broken under subpath.** `Traffic/traffic-messenger.html:529` loads `/src/messenger/main.ts` (absolute, raw TS, untracked `?? Traffic/src/messenger/`). `Traffic/dist-web/traffic-messenger.html` is untracked, references `/assets/messenger-*.js` absolute. `Traffic/dist-web/index.html` has no bundle script (iframe shell only) — `main-IGclrUL5.js` + `main-BoidwBDL.css` + `Icon-nY8OFMj5.png` are deleted in tree. HEAD has neither the HTML nor the assets → 404 + dead buttons (guards silently no-op). Dist `sw.js:13-15` precaches `'/'` + `'/index.html'` absolute → breaks under `/Traffic/` subpath.

**P0-3 `Traffic/dist-web/` iframes point at missing files.** `Traffic/index.html:153,156,159,162` `data-src="Driving.html"`, `TrafficDashboard.html`, `Academy.html`, `TrafficSetup.html` — none exist in `dist-web/` (only `index.html`, `traffic-messenger.html`, `sw.js`, icons). `switchView()` attaches `src` on demand → first click 404s. `pw_test.js` only counts iframes (`===4`), never clicks.

**P0-4 `Traffic/` 404 assets + phantom bundle.** `Traffic/index.html:8-9` `icon-192.png` + `manifest.webmanifest` missing under `Traffic/` (exist only under `Traffic/public/` + `dist-web/`). `Traffic/GamePage.html:18-29` claims bundle in `dist/Traffic/simulator-bundle.js` “built by node build.js” — no such `build.js`/script; runtime `fetch HEAD` 404s and `catch(()=>{})` silences it, leaving static fallback. Also loads Tailwind CDN (`cdn.tailwindcss.com`) — violates `pw_test.js` “ZERO functional CDN” gate (no exception).

**P0-5 `Traffic/` load-order landmine.** `TrafficSetup.html:16` loads `three-bundle.js` `defer`; `render_core.js:3-72` reads `THREE.LinearFilter` at parse time. Works only because Driving loads the bundle blocking (line 139) before deferred `render_core.js` (8861). Any ordering change → `ReferenceError: THREE`.

**P0-6 `logic.js` bare `three` import.** `logic.js:33-35` `import * as THREE from 'three'` + `three/addons/...` with no fallback. If `engine.html`/`solar.html` lack a matching import-map, whole module fails and canvas stays blank. (F5 fixed the status-bar crash; import-map dependency remains — verify import-map exists before deploy.)

**P0-7 `build.js` shipped `.docx`. PARTIALLY FIXED (F4) — now `.docx` only.** Added `/\.docx$/i`. `COL.apk` (7.2 MB) intentionally ships as the Android download; `AdvancedTypingInstructor.apk` stays excluded via `excludedFiles`. `dist/` still contains the old `.docx` until the next rebuild; add it to `assertSafeOutput` if you want build-time enforcement.

**P0-8 `config.json` world-readable Supabase anon key + cert fingerprint.** `config.json:31-35` + `vercel.json:114-122` (`max-age=0`) intentionally public → key + `apkCertFingerprint` downloadable (verifier at `col-auth.js:2195` attacker-accessible). Acceptable for anon key, but blast radius extends with P0-9.

**P0-9 `col-auth.js` plaintext PIN RPC.** `col-auth.js:1956-1959` `rpc('authenticate_account',{p_identifier,p_pin:pass})` + `2037-2044` `rpc('register_account',…)` — local path uses PBKDF2 (`94-114`), cloud path sends raw secret. TLS protects transit, not server logs. Move hashing server-side or use Supabase Auth.

## P1 — real bugs / perf / security hardening

**P1-1 `sw.js` precache never hits.** `sw.js:62` `cache.put('/col-ui.js',…)` (string, relative) vs `sw.js:98` `cache.match(request)` (Request, absolute URL) → miss. Offline core never hits. Also `'/home.html'` vs `vercel.json:7` `cleanUrls` `/home` — two canonicals. `sw.js:121` `waitUntil()` inside `respondWith(async…)` must be sync → revalidation never extends SW life. `sw.js:48` excludes `3000/5173` but not `:8585` (Python prod server per AGENTS.md) → dev cache leak. `col-ui.js:586-608` localhost branch deletes all caches but misses `::1`/LAN IP/`file://`.

**P1-2 CSP is Report-Only + contradicts itself.** `vercel.json:38` `Content-Security-Policy-Report-Only` with `'unsafe-inline' 'unsafe-eval'` + `jsdelivr/unpkg/supabase/vercel/ads` — enforces nothing, needs `unsafe-inline` anyway (hundreds of `onclick`). No `report-uri`. `X-Frame-Options: DENY` forbids framing yet `frame-src` allows `accounts.google.com`/`googleads` — one cancels the other. `script-src` omits `cdnjs.cloudflare.com` (`col-3d.js:18` loads three r128) → flipping to enforcing breaks 3D.

**P1-3 Cache-Control duplicates.** `vercel.json:79-85` (assets `604800`=7d) vs `97-103` (`col-ui.js|css|col-auth.js|…` `3600`=1h) → `col-ui.js` matches both → duplicate headers, cache-dependent TTL. Clean-URL pages (`/home`) match neither rule → inherit default.

**P1-4 Theme ownership split (~15 redefinitions).** Canonical `col-ui.js:930-976` (toggles html+body, `safeTheme*`, `hzSync`). Pages redefine body-only (`about.html:1995`, `home.html:5868`, `ati.html:2043`, etc.) with hardcoded meta `#f4f3ee` vs `#f3f2eb`. `global-gesture.js:17-25` calls `hzToggle(element)` — canonical ignores argument, blind-flips. `global-gesture.js:28-37` toggles only `body.lm` (+ stale `dark-mode`) while `col-ui.js:965` reads only `documentElement.lm` → desync. `qr-editor.html:3055` `(window.Storage||Storage).set` — `Storage` is constructor, `.set` not a function. Fixed only in `ati-demo.html` (removed override); 14 other pages still divergent.

**P1-5 `download.html` locked buttons not keyboard-focusable.** `download.html:1938` `btn-ati-setup`, `1939` `btn-ati-portable`, `1967` `btn-solar-exe`, … all `<a>` without `href`/`tabindex`/`role` + `onclick="handleLockedClick(event,…)"` + `preventDefault()` — mouse works, Tab/Enter never reaches them (WCAG 2.1.1). Checkbox wrappers at `1932,1961…` correctly use `tabindex=0 role=checkbox onkeydown` — buttons should match.

**P1-6 Non-keyboard click targets everywhere.** `home.html:4741` `.hz-toggle` div `onclick="hzToggle()"`, `4748` `.nav-user-profile` div, `ati.html:1696,1703,1902-1938` (×13 `.thumb-card`), `ati-lite.html:869` `.typing-viewport`, `solar.html:1909,1920,2112` `.engine-overlay`, `gesture.html:2079,2090,2148`, `rpg.html:1071,1082`, `dashboard.html:651,662`, `school.html:1109,1116`. Fixed only in `ati-demo.html` (hz → `<button aria-pressed>`, profile → `<button>`, stage → `tabindex=0 role=textbox`). Others still divs.

**P1-7 Unguarded storage / JSON / crypto.** `Traffic/game_core.js:4377`, `ui.js:946,6975`, `game_core.js:5985,6067` bare `JSON.parse(localStorage.getItem(…))` — corrupt write or Safari-private `getItem` throw aborts boot mid-function. `qr-dynamic.js:474` top-level `!localStorage.getItem(...)` outside try; `394-405` bare `crypto.subtle` (no `globalThis.crypto?.` guard as at line 27) → `ReferenceError` on non-secure contexts. `qr-dynamic.js:369` `fetch(u)` in `getSb()` has no `AbortSignal.timeout` (vs `col-router.js:13`/`col-auth.js:371` 8s). `render_core.js:149`, `start.js:521`, `col-ui.js:500,514,629…` same unguarded pattern.

**P1-8 Traffic RAF/listener leaks (no lifecycle).** `Traffic/game_core.js:12661` `_loop(){requestAnimationFrame(()=>this._loop())}` — ID never stored, never cancelled, no `visibilitychange` teardown. Re-enter via `reloadCurrentView()` (`index.html:512-525`) or `start.js:702` double-boot → orphan loops. Same at `game-optimization-integration.js:32` (dead code — no HTML loads it, would double-drive loop if wired), `npc-ai.js:2069`, `src/messenger/main.ts:97,320`, `Driving.html:8830` `setInterval(500)` never cleared. `col-3d.js` 10 listeners + 10 `MutationObserver(applyTheme)` never `disconnect()`ed; `logic.js:4698` unconditional RAF, `resize`/`keydown` never removed.

**P1-9 AudioContext suspended paths.** `Traffic/ui.js:33-38` creates `new AudioContext()` but `play()` never `resume()` when suspended — only `scenario2d.js:875` resumes (ambient only), `traffic-audio.js:144` does it right. `col-3d.js:85-100` `toggleSound` creates ctx outside `userActivation`; `playChord` `setTimeout` chimes fire after sound off. `global-gesture.js:318` blocking `alert()` in loop if camera fails.

**P1-10 Duplicate `col-ui.js` drift.** `Traffic/col-ui.js` (47,533 B) vs `../col-ui.js` (46,967 B) — 25 differing lines. All pages load `../col-ui.js` (`Driving.html:137` etc.); in-folder copy is dead weight that looks authoritative. Editing local copy sees zero effect with zero failure. Electron check (`pw_test.js:366`) likely packages the wrong one.

**P1-11 Supabase dual-write + un-debounced saves.** `Traffic/col-auth.js:1698` upsert `user_profiles` + `1708` `profiles` with independent errors → split-brain, no rollback. `Traffic/ui.js:21-23` fires `updateUser` on every `save()` with no debounce, swallows errors — whole-blob writes, silent loss offline. `col-auth.js:387` injects Supabase from jsdelivr at runtime — offline/Electron auth never initializes, later null-paths silently no-op.

**P1-12 SEO/robots/sitemap nits.** `robots.txt:34` `Host:` deprecated; `Host` says `dpdns.org` but deploys to `*.vercel.app` (vs `config.json allowedOrigin` `col-auth.js:1896`). `robots.txt:1-30` `Allow: /` for AI bots, no `Disallow: /admin|/dashboard|/Traffic/…` (relies on `vercel.json:43-77` `X-Robots-Tag` headers only). `sitemap.xml` lists `/` not `/home` (rewrite target), all `lastmod: 2026-09-25` identical (synthetic), lists `Traffic/Driving|Academy` but omits `Traffic/TrafficDashboard|Setup|GamePage`, no images for `ATI*.png`/`solar*.webp`. `manifest.json:12-18` single `192×192` icon, no `512×512`/maskable/screenshots → Android install fails; `background/theme_color` `#070A14` but `start_url:/home` vs `id/scope:/` mixed. `ati-lite.html` had no canonical (now added, noindex). `rpg.html:940` canonical placed after ~900-line `<style>` (valid, misplaced).

**P1-13 Missing `width/height` (CLS) + button aria.** `ati.html:1903-1939` ×13 `<img ATI N.webp loading=lazy>` no dimensions; `solar.html:2012` `solar 2.webp`; `dashboard.html:824,1061` dynamic avatar imgs. Buttons: `ati-lite.html:780,784,788` `engine-tab` no `aria-selected/role=tab` (vs `ati-demo.html` fixed), `dashboard.html:694,695` tab buttons, `gesture.html:2233,2236,2262,2283` `title`-only icon buttons, `home.html:4655,5110,5113` dropdown/ni buttons missing `aria-expanded/label`.

## P2 — robustness / test-harness

- **`pw_test.js` swallows its own signal.** `EXPECTED_NOISE` (line 79) includes `404`, `supabase`, `Failed to load resource` → first-party 404s filtered before `realErrors()`. Only `response.status()===404` in `watch()` counts, only for visited pages (`index/Academy/Driving`). `traffic-messenger/GamePage/TrafficSetup/TrafficDashboard` can 404 all day, gate stays green. `count()===4` never `switchView()`s → `data-src` 404s pass.
- **Gate thresholds disagree.** `check-startup-stubs.js:30` caps stubs 8,192 B + single-quote regex; `pw_test.js:400` allows 64 KB + different base64 regex. Double-quoted `"Models/…"` passes one, fails the other.
- **Untracked tests.** `Traffic/tests/test_messenger.js` + `test_dist_messenger.js` are `??`, not in `package.json` (`test: vitest`, `test:smoke: node pw_test.js`), `test_messenger.js` hits same `/src/messenger/main.ts` absolute-404.
- **Vite covers 2 routes, app has 7 entries.** `Traffic/vite.config.mts:7-42` inputs `main`+`messenger` only; `GamePage/Driving/Academy/TrafficDashboard/TrafficSetup` ship raw legacy HTML with ~70 `<script defer>` each. `dist/` vs `dist-web/` vs `dist/Traffic/*` triplication already visible in `git status`.
- **`col-router.js:45` hard-wipes the document** on any `config.pages[page]!=='200'` — a `config.json` typo blanks the whole app. `/dashboard` absent from `config.json:2-26` only safe because no non-200 entry exists.
- **CSV export truncation.** `qr-dynamic.js:329-340` formula-prefix `'` handles `=+-@` but no length cap before spreadsheet argument.
- **`mobile-perf.css` contradicts its header.** Header says “kill GPU effects”, §2-4 *add* `will-change` + `translateZ(0)` forced composites on `.pc/.top-nav/.col-bottom-bar`; only `backdrop-filter:none` under `prefers-reduced-transparency` actually reduces cost (opt-in, not mobile-default).
- **`col-auth.js` leftovers.** `let supabaseClient` (line 5) coexists with `window.supabaseClient` (463) — two sources of truth. Escape listener per-modal (1223) never removed. `usernameCheckDebounce` (688) shared across profile/settings flows. `preview.innerHTML` with `dataUrl` (1540) safe but `_setAvatarValue` accepts arbitrary URL strings (1574) via `innerHTML` without `getSafeImageUrl()` (only render paths 1265/1371 use it). Inline `onclick="window._pickUsernameSuggestion('${s}')"` (751) breaks on quotes, needs CSP `unsafe-inline`.
- **`logic.js` still unconditional RAF** (4698, no visibility gate, no `cancelAnimationFrame`) + `resize`/`keydown` never removed. `col-3d.js:1686` same. `col-ui.js` `visibilitychange/resize/BMC drag` no teardown; `pull-refresh.js:142,149,167` three touch listeners per load.
- **CSS `!important` wars.** `col-ui.css:23-50` vs `1033-1058` two `body.lm` blocks; `.top-nav` sticky (130) vs desktop fixed pill (1786-1808) vs mobile fixed (1523-1535) vs `liquid-glass.css` iPhone pill — order-dependent. `col-ui.css:69-80` global `capitalize !important` rewrites user content (mitigated in `ati-demo.html` only). `mobile-perf.css:117-127` forces system font ≤768px, killing serif/mono brand type on mobile.

## Deploy risk

1. **Merge conflict was a hard stop — now resolved (F1).** `git add home.html` still required; Vercel builds HEAD, not this tree. Working tree has 25 modified `Traffic/` files (incl. `game_core.js` +269, `Game.ts` −241, `MissionManager.ts` +338), 3 deleted `dist-web` bundles, 11 untracked messenger files, and mirrored `dist/Traffic/*` — deploying today ships old HEAD without messenger fix while `dist-web/` in HEAD references iframes that never existed in dist.
2. **Absolute paths everywhere post-build.** `/src/messenger/main.ts`, `/assets/messenger-*.js`, `/`, `/index.html` (sw), `/Traffic/Driving` canonicals all assume root; documented host is subpath `advancedlogiclabs.dpdns.org/Traffic/…` — breaks without rewrites (none in `Traffic/vercel.json`).
3. **CDN-dependent auth.** `col-auth.js:387` Supabase + AdSense + Tailwind + Google Fonts required for full function. `pw_test.js` “ZERO functional CDN” holds only because it excludes those hosts. Offline/Electron boots as guest, silently.
4. **Storage corruption → boot crash.** `mth4` blob is single source of truth, written from many call sites, read back with multiple unguarded `JSON.parse`s (P1-7). One truncated write (private-mode quota, OS kill) → next load throws inside unguarded parse on boot path.

## Minimal pre-deploy sequence

1. `git add home.html` (F1) — verify `git diff --check` clean.
2. `git add` messenger `src/` + `traffic-messenger.html` + rebuilt `dist-web/` **together** (never HTML without hashed assets).
3. Verify subpath serving for `/Traffic/` (relative imports, `manifest.webmanifest`, `../col-ui.js`).
4. Run `node Traffic/pw_test.js` **and** click all four iframe tabs + messenger tab (test doesn’t).
5. `npm run build` must reproduce current `dist-web/` hashes; `npm audit --audit-level=high` clean.

## What was NOT fixed (deferred)

- `col-auth.js` PIN RPC re-architecture (P0-9), `config.json` exposure decision (P0-8), CSP enforcement flip (P1-2), theme dedup across 14 pages (P1-4), download buttons keyboard support (P1-5), shared `col-ui.js`/`col-auth.js` listener cleanups (P1-8), Traffic bundle/iframe/absolute-path rework (P0-2–P0-5), `sw.js` key normalization (P1-1), manifest 512×512 (P1-12). Each needs product/security review before touching.

## Follow-up — 2026-11-07 (fixes landed after this hunt)

- F6 `Traffic/index.html` + `Traffic/dist-web/index.html` — Browser rename reverted per owner instruction. `Desktop Edition` branding kept; no `Browser Edition`/`browser-app` strings remain (grep clean). `dist/` rebuilt to match source.
- F7 `download.html` P1-5 closed for the last 3 cards: `btn-col`/`btn-cast`/`btn-terra` `<a>` → `<button type="button">` (keyboard-focusable, matching ATI/Solar/Perceptus). Also fixed a latent unlock bug: `unlockAppUI` set `btn.href`, which is a no-op on `<button>` — unlocked buttons would have been dead after accepting terms. `BUTTON` elements now get an `onclick` that navigates to the release URL; anchors keep `href`. Verified in `dist/download.html`.
- F8 P1-7 / P1-9 partial hardening (safe, minimal): `Traffic/game_core.js:4377` and `Traffic/ui.js:946` bare `JSON.parse(localStorage…)` → safe parse with `{}` fallback; `Traffic/ui.js` `sfx.play()` now calls `resume()` when `state==='suspended'`; `qr-dynamic.js:474` template-seed block wrapped in `try/catch`. `mission-manager.js:1458` and `ui.js:6975` were already try/caught — left alone. `crypto.subtle` (`qr-dynamic.js:394-405`) left as-is: guarding alone does not change the failure mode; needs caller-side handling.
- F9 `ati.html:2043` local `window.hzToggle` override removed. It was dead code (`col-ui.js` is `defer`, loads after the inline script and wins) and diverged from canonical (no `hzSync`, no `safeThemeSet`, hardcoded `localStorage 'theme'` key). The toggle at `ati.html:1696` now uses the canonical implementation.
- Unslop: `uv tool run unslop --stdin --deterministic --diff` on these docs shows only sentence-case capitalisation deltas (`passed` → `Passed`, `home` → `Home`); no AI-pattern vocabulary found. User-facing `download.html` strings (toast/button labels) pass unchanged (empty diff). ATI Demo copy was already verified unchanged. No prose edits applied — casing-only churn not worth it.
- Compliance mapping: secret keys — only `config.json:33` `role:anon` key found (public by design for the anon client; verify no `service_role` anywhere before deploy, see P0-8). Bot checks / rate limits / quotas — N/A: the site is static on Vercel (`outputDirectory: dist`, no server surface). Maintainability / scale / governance — for a static site these reduce to the deferred items above (P1-4 theme dedup, P1-8 listener cleanup, P1-10 duplicate `col-ui.js`, P1-12 SEO/manifest), pending product review.
