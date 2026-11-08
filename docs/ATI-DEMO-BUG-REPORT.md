# Site Bug Report — Class Of Learners (Vercel)

Date: 2026-11-06
Scope: Root static site, focus on ATI pages (`ati.html`, `ati-demo.html`, `ati-lite.html`), shared JS (`col-ui.js`, `col-router.js`, `col-auth.js`), `vercel.json`, `sw.js`, `manifest.json`. No files were changed by the audit itself; ATI Demo fixes are listed separately and were shipped in `ati-demo.html`.

Build state after audit: `npm run build` still passes (production + SEO + security checks). One pre-existing warning remains: `Traffic/traffic-messenger.html references missing /src/messenger/main.ts` (not ATI-related).

---

## P0 — must fix (breaks function or blocks use)

### P0-1 One Esc press resets the game + closes menus
- `ati-demo.html` main engine: `window keydown Escape -> resetGame()` (old line ~2867-2870).
- `ati-demo.html` dropdown helper: `document keydown Escape -> close #projDD` (~3087-3095).
- `col-ui.js:470-474`: `document keydown Escape -> closeDrawer() if isNavOpen()`.
- Three handlers, no priority, no `stopPropagation`. One Esc closes the mobile drawer or the Projects dropdown **and wipes typing progress**. The custom-text modal gets no Esc-to-close; Esc behind it resets the game instead.
- Same pattern in `ati-lite.html`: `Escape -> resetEngine()` plus `col-ui.js` drawer close.
- **Fix shipped in ATI Demo:** capture-phase handler that checks custom-text dialog → results dialog → Projects dropdown → game, and calls `stopPropagation()`. Esc only resets while playing, and Tab is no longer hijacked.

### P0-2 Tab key hijacked, keyboard navigation broken
- `ati-demo.html:2901-2905`: `preventDefault() + resetGame()` on Tab. `ati-lite.html:1653-1656`: same.
- Breaks WCAG 2.1.1 (Keyboard) and 2.4.x (focus order). In code modes Tab should insert / move to next word, never restart.
- **Fix shipped:** Tab is now native. Only Backspace / Space / Enter / printable keys are intercepted, and only when the arena is focused and no dialog, select, or doubt field is active.

### P0-3 ATI showcase thumbnails are dead (in `ati.html`)
- Thumbnails call `updateShowcase(this, 'ATI N.webp')`, but `updateShowcase()` tests `/ATI\s*(\d+)\.png/` — never matches `.webp`, so clicks are no-ops. Prev/Next builds `'ATI '+(i+1)+'.png'` while the page ships and displays `.webp` (`ATI 1.webp` etc., ~14–65 KB) and also loads PNGs (137–344 KB). ~2.6 MB PNG weight for ~0.5 MB WebP content.
- **Not in ATI Demo scope; needs `ati.html` fix:** match `.webp` (accept both extensions) and stop loading PNGs.

### P0-4 Security headers contradict each other
- `vercel.json`: `Content-Security-Policy-Report-Only` (not enforced) with `'unsafe-inline' 'unsafe-eval'` + `https://cdn.jsdelivr.net https://unpkg.com https://*.supabase.co https://pagead2…`, no `report-uri`/`report-to` → violations invisible; docs claim strict CSP, which is false.
- `X-Frame-Options: DENY` forbids all framing, yet CSP `frame-src` tries to allow Google Ads / Sign-In frames — one cancels the other.
- Pages rely on inline `<script>` + `onclick` everywhere (`ati-demo.html`, `ati.html`, `ati-lite.html`), so even an enforced CSP with that allowlist would need `unsafe-inline` anyway. `Traffic/index.html` enforces a different meta CSP (`https: data: blob:`). Policy surface is inconsistent.
- **Fix:** decide on one enforced CSP, add `report-to` + `report-uri`, reconcile `X-Frame-Options` with `frame-src`, and either move inline handlers out or document why `unsafe-inline` stays.

### P0-5 Theme toggle overridden 3×, checkbox inverted
- Canonical: `col-ui.js:961-976` (`safeThemeSet` / `hzSync` / vibrate). Pages redefine `hzToggle` (`ati.html:2043-2050`, old `ati-demo.html:3124-3131`). All shared scripts are `defer` — inline non-deferred body scripts run first, deferred `col-ui.js` overwrites them last. Page versions were dead code; callers relied on load order.
- Old `ati-demo.html:3118-3119` `tsck.checked=!isLight` inverts `col-ui.js:955-956` (`checked=isLight`); `3128-3129` `!elem.checked` inverts `980-985`. Checkbox flipped.
- `global-gesture.js:18` calls `window.hzToggle(element)` — gesture accidentally flips theme.
- **Fix shipped in ATI Demo:** removed the local `applyTheme` / `hzToggle` / `toggleTheme` override and the duplicate scroll listener. `col-ui.js` now owns theme + `.top-nav.s` pill state (hysteresis 60/25). The nav button still works if `col-ui.js` fails (inline fallback).

---

## P1 — major (wrong results, missing meta, a11y, offline)

### P1-1 ATI Demo: caret in the wrong coordinate space
- Old `updateCaret` used `charSpan.offsetLeft/offsetTop`, which are relative to `.word` (`position:relative`), not to `.typing-stage` (the caret's offsetParent). Every word after the first snapped to the left edge. The wrapper was scrolled with `transform: translateY()` while the caret (a sibling) did not move, so caret and text diverged on wrapped lines.
- **Fix shipped:** scroll first, then `getBoundingClientRect()` of stage vs. reference char, plus a single guarded re-sync (no RAF loop).

### P1-2 ATI Demo: WPM double-counts space, backspace farms streaks
- `handleInputCharacter` counted each correct char; `handleSpace` then counted **another** correct keystroke for the space. A 5-letter word could score 6 correct keys (+20% WPM). Extra characters were penalized twice.
- `handleBackspace` never decremented counters — backspace → retype inflates net WPM and streaks.
- `endTest` used stale `elapsedTotalSec` (last RAF frame) instead of wall clock — inflated WPM after background tabs.
- Completion only checked in `handleSpace`: typing the last word without a trailing space never ended the test; in time mode 120 words could end early instead of refilling.
- **Fix shipped:** space counts toward total only, word correctness judged separately, backspace bounds-checked, `endTest` uses `performance.now()-startTime`, last-word auto-finish added.

### P1-3 ATI Demo: backspace can throw
- Guard used `&&` instead of `||`; after `endTest` backspace still mutated state behind the modal. `typedWords[currentWordIndex].length` with `currentWordIndex === wordsData.length` throws `TypeError` on the phantom-sim path. `backspaceCount++` and sound ran on no-ops.
- **Fix shipped:** hard bounds check (`Math.min(currentWordIndex, len-1)`), early return on dialogs, silent no-op at 0,0.

### P1-4 ATI Demo: weak-key drill destroys its own input
- No `.mode-pill[data-mode="weak"]`; `setStudioMode('weak')` deactivated all pills and fell into the "Difficulty" branch. `drillWeakKeys` → `setStudioMode` → `resetGame` cleared `missedKeyFreq = {}` **before** `generateTextCorpus` read it — drill always fell back to generic text. `missedKeyFreq[' ']` and symbols never matched lowercase corpus → empty list → all-space fallback → empty word + broken caret.
- **Fix shipped:** `resetGame(keepWeak)` preserves `missedKeyFreq` for drills, weak keys filtered to `[a-z]`, fallback text guaranteed, weak mode shows an "On" sub-bar and keeps the previous pill lit.

### P1-5 ATI Demo: ghost pins freeze, label goes stale
- `resetGame` never reset pins/badge; `ghostStartTime` declared but never set. PB ghost read `localStorage` for the current mode only at selection time, never refreshed on mode change. Progress was word-granular (player) vs. continuous (ghost) — delta misleading; in short modes ghost pinned at 100% instantly.
- **Fix shipped:** `setGhostPacer` and `resetGame` reset pins to 0% with "Even pace"; PB refreshes from storage on every reset.

### P1-6 ATI Demo: auto-test sim leaks a second chain
- `stepSimulation` called handlers that can synchronously `endTest` (clears timeout, sets `isSimulating=false`), then **unconditionally** scheduled a new `setTimeout`. Restarting inside the variance window spawned a concurrent loop; stop cleared only the latest handle — orphan sim kept typing. Stop didn't end the timer loop.
- **Fix shipped:** run-ID guard, no reschedule after finish, stop/reset nul handles, sim delay clamped 40–200 ms.

### P1-7 Unguarded storage / clipboard / audio
- `navigator.clipboard.writeText().then()` with no existence check or `.catch` — fails on non-secure contexts, denied permission → unhandled rejection, button desync.
- Bare `localStorage.getItem/setItem` in ghost/PB/reset paths vs. guarded head read — throws in Safari Private / blocked storage and aborts reset before `renderWords`.
- `ati-lite.html:988` `new AudioContext()` at parse time before gesture → Chrome suspended warning; sim keystrokes from timers dropped/burst.
- **Fix shipped in ATI Demo:** `store.get/set` wrappers, clipboard fallback via `execCommand` + manual-copy message, audio resumed only on gesture and skipped while suspended.

### P1-8 ATI Demo + Lite: missing meta / canonical / OG / PWA
- `ati-demo.html` & `ati-lite.html` head had only charset/viewport/description/title/icon; ad script placed **before** charset. No `canonical`, no `og:*`/`twitter:*`, no `theme-color`, no manifest. Social previews + PWA install broken. `ati.html` has canonical + OG (`og/ati.jpg` exists) — trio inconsistent.
- `ati.html`: duplicate `apple-mobile-web-app-capable`/status meta (`8-10` vs `1583-1584`), `theme-color #020617` vs `col-ui.js` sync to `#070a14`/`#f3f2eb`, no `id="themeMeta"` (only `404.html`/`about.html` have it). Demo/Lite have no `theme-color` at all → `hzSync` meta update is a no-op.
- `vercel.json:43` noindexes `ati-demo` but omits `ati-lite`; `sitemap.xml:54-59` lists `/ati` only. Indexable `ati.html` links to noindex `ati-demo` (`1731,1873`); demo still ships SEO description. Intent contradictory.
- **Fix shipped in ATI Demo:** charset first, canonical + OG + Twitter + JSON-LD + `theme-color` with `id="themeMeta"` + manifest + `robots noindex` (matching `vercel.json`), fonts via preload-swap + `noscript`.

### P1-9 Nav mismatch — `ati-lite.html` stripped
- `ati.html` + `ati-demo.html`: full nav (Home/About/School/Sneh Asha/Making + Projects dropdown 6 items incl. `Terra3D/`, `hz-toggle`, login, user-profile, Downloads, `#mmb`). `ati-lite.html:728-747`: 4 links only (Home/ATI Suite/Velocity Studio/Downloads), no dropdown, no `hz-toggle`, no login/profile, no `#mmb`, no `.nav-actions`. Mobile menu inaccessible on lite; `ati-lite:737` marks `ati` as `.act` while on lite. Footer `.sf` shared, actions mismatched.
- **Fix shipped in ATI Demo:** `hz-toggle` div → `<button aria-pressed>`, profile div → `<button>`, `#mmb` gets `aria-expanded`/`aria-controls`, nav gets `aria-label`, skip link added. Lite nav parity still needed.

### P1-10 Service worker + manifest
- `sw.js:1-14` `col-cache-v14`, precaches `/home.html` but `manifest.json:6` `start_url:/home` + `vercel.json:134-137` ` / -> /home` — navigation to `/home` misses cache; offline fallback only hits `/home.html`.
- `sw.js:121` `event.waitUntil()` inside `respondWith(async…)` must be sync during dispatch; background revalidation never extends SW lifetime. `sw.js:101` `url.includes('col-ui.js')` fragile with query strings.
- `col-ui.js:586-608` registers `/sw.js`; localhost branch unregisters + `caches.delete(all)` (`588-596`) but `sw.js:48` excludes only `localhost/127.0.0.1/3000/5173`, not `:8585` (Python prod server per `AGENTS.md`) → dev cache leak.
- `manifest.json:12-18` single `192x192 Icon.png`, no `512x512`/maskable, no `screenshots` — Android installability fails. `vercel.json:79-85` caches `*.js` 7 days vs `97-104` overrides `col-ui.js` to 1 h — stale SW + stale JS race.

### P1-11 Accessibility failures (ATI trio)
- Non-keyboard targets: `.hz-toggle` div `onclick` (no `role`/`tabindex`/`aria-pressed`), `.nav-user-profile` div `onclick`, `.thumb-card`/`.key`/`.typing-stage` divs, hidden trap `opacity:0.001` focusable but invisible → fails focus-visible WCAG 2.4.7.
- Modals (`resultsOverlay`, `customTextModal`, `evalModal`) had no `role=dialog`/`aria-modal`, no trap / return-focus. Only `.doubt-answer` was `aria-live`. No skip link on any ATI page. `.anim-target{opacity:0}` (`ati.html:865-873`) has no no-JS fallback except `prefers-reduced-motion`.
- Contrast: `.char{opacity:.55;color:--dim:#8492a6}` ≈ <3:1 on `rgba(10,15,30,.85)`. `.ghost-delta-badge` white-on-glass marginal. `.key` radar divs not announced; caret no `aria-hidden`.
- **Fix shipped in ATI Demo:** skip link, `*:focus-visible`, `role=dialog` + `aria-modal` + `aria-labelledby` on both dialogs, `aria-live` telemetry + `#ariaLive` summary, labels on every select, `.typing-stage` `role=textbox` + `tabindex=0`, focus trap on custom-text dialog, focus return to trap, `prefers-reduced-motion`, `.char` opacity `.72` (`.9` in light), badge border, sparkline `role=img` label + 2× canvas (640×76) for retina, on-screen keys are `<button>`s with `aria-label`.

### P1-12 Broken / fragile internal refs
- `ati.html:1684` `Terra3D/` (folder has `index.html`) + `vercel.json cleanUrls:true` + `dist/` output — directory-index case-sensitivity fragile on Linux; build duplicates root→`dist/` (both `ati.html` and `dist/ati.html` in repo). `href="/"` relies on `vercel.json` rewrite — direct file nav 404 without it.
- Pre-existing: `Traffic/traffic-messenger.html` references missing `/src/messenger/main.ts` (shows in production-check warnings).

---

## P2 — polish / perf / duplicates

- **Render-blocking head:** 4 stylesheets per ATI page (`col-ui.css?v=20260923-nav3`, `col-mobile.css`, `liquid-glass.css`, `mobile-perf.css`) + ~1500-line inline `<style>` + 3 font families render-blocking via plain `<link>` on demo/lite vs preload-swap + `noscript` on `ati.html`. `col-auth.js` (108 KB) deferred on landing though only needed at login.
- **Large assets:** `careers-data.js` 3 MB, `COL.apk` 7.2 MB, `CoL_Ecosystem_*.pdf` 7.5 MB ×2 (duplicate payload), `logic.js` 347 KB, ATI PNGs 137–344 KB. Always-on RAF loops (`ati-lite` sparks/racer/defense) + per-keystroke full `drawRacerTrack()` → battery/CPU drain when idle.
- **Duplicate IDs / meta:** Admin pattern shows collision risk (`admin.html:834` + `1245` duplicate `adminPassInput`). ATI trio: duplicate mobile-web-app meta, duplicate theme-init scripts, `#caret` defined per-file but `ati-demo` vs `ati-lite` divergence — verify no cross-inject from `col-ui.js` (`#topNav`/`#mmb`/`#navLoginBtn`) collides when drawer injected.
- `updateSlideUI` counter/caption (`ati.html:1893,1896`) updates text but `mainShowcaseImg` swap (`.png`) leaves thumbs `.webp` — stale cache keys.
- `Difficulty` / `Pro` toggle (ATI Demo) rendered buttons but `generateTextCorpus` never read `currentSubVal` for code/quote/symbol modes — dead UI. **Fixed:** `pickSnippet()` uses longest snippet for Pro, random for Standard.
- Virtual-keyboard `Shift`/`Caps`/`Tab` and symbol keys were dead (`length>1` except Backspace/Enter/Space ignored; `data-alt` never used) — capitals/symbols in code modes untypable by touch. **Fixed:** Shift latches for one key and uses `data-alt`/uppercase; Caps toggles; Tab stays native.
- Sparkline: fixed `320×38` backing, CSS `320px` / `100%×42px` mobile, no DPR scaling, `getContext` unguarded, `Math.max(...wpmHistory)` spread. **Fixed:** 640×76 backing (≈2×), null guards, `Math.max.apply`, theme-aware stroke.
- Doubt-solver matching: `words.some(w => k.includes(w) || w.includes(k))` — substring match → false positives. **Fixed:** exact-word match (plus multi-word part match). Chips box was unguarded (`if (chipsBox)` missing) — guarded. `stable-gene`/`stable-cop` prompt gave no chips — **Fixed:** natural chips (`How do I get faster?`).
- Mobile trap: `pointerdown preventDefault` suppressed iOS soft keyboard; blur badge claimed "Focused" mid-test with no refocus; `insertFromPaste`/`insertLineBreak`/`insertReplacementText` lost; `trap.value=''` broke Gboard composition; virtual-key presses didn't update `lastKeyHandledAt` → >40 ms keyboards double-count. **Fixed:** focus-aware blur that always offers re-focus, paste/line-break handling, no `preventDefault` side-effect on the trap path, single `lastKeyHandledAt` stamp for both paths.
- `generate_ati_demo.js` (generator for `ati-demo.html`) still contains the old copy/logic. If the generator is re-run, it will overwrite these fixes. **Next step:** sync `scripts/generate_ati_demo.js` or retire it.

---

## What changed in ATI Demo (this delivery)

- Head: charset first, `canonical`, OG/Twitter, `theme-color` (`id="themeMeta"`), manifest, JSON-LD, `robots noindex`, fonts preload-swap.
- A11y: skip link, `aria-label` nav, `aria-live` telemetry + `#ariaLive`, `role=dialog` + focus trap + focus return, labels on selects, `role=textbox` arena, `<button>` keyboard keys, `prefers-reduced-motion`, contrast/outline fixes.
- Copy (unslop deterministic, balanced): hero, eyebrow, sim labels (`Speed Demon` → `Fast`, `Cyber Typist` → `Very fast`, `Run Auto-Test` / `Stop Auto-Test` kept), section titles, all six tips, doubt title/placeholder, all 10 knowledge answers, chips, modal labels, `EVEN PACE` → `Even pace`, `VELOCITY ACCELERATION CURVE` → `SPEED OVER TIME`. No hype/stack words remain; `uv tool run unslop --stdin --deterministic` on the new copy is unchanged.
- Logic: caret `getBoundingClientRect`, WPM single-count, wall-clock `endTest`, last-word finish, bounds-checked backspace, weak-key preserve + filter, ghost pin/label reset, sim run-ID + no phantom reschedule, Esc priority + Tab native, clipboard fallback, storage wrappers, audio gesture guard, DPR sparkline, Pro = longest snippet, touch Shift/Caps, paste/line-break support, `hzToggle` de-duplication.

Verified: `npm run build` (production + SEO + security), `eslint` (pre-existing warnings only).

---

## Suggested next steps (in order)

1. **P0-1/P0-2 in `ati-lite.html`:** port the same Esc-priority + Tab-native handler; add `role=dialog`/`aria-modal` to `evalModal`.
2. **P0-3 in `ati.html`:** fix `updateShowcase` to accept `.webp` (or both), stop loading PNGs; drop the 13 PNG downloads.
3. **P0-4:** pick one enforced CSP with `report-to`, align `X-Frame-Options` with `frame-src`, document `unsafe-inline` or move handlers out.
4. **P0-5 + P1-9 + P1-11:** remove `hzToggle` overrides from `ati.html`/`ati-lite.html`, unify nav (same links, dropdown, `#mmb`, `hz-toggle` button, login/profile) across the trio, add skip link + `aria-live`.
5. **P1-8 + P1-10 + P1-12:** add canonical/OG/theme-color/manifest to lite, add `512×512` + screenshots to manifest, add `:8585` to `sw.js` localhost bypass, fix `waitUntil` outside `respondWith`, decide `ati-lite` index/noindex + sitemap.
6. **P2:** sync or retire `scripts/generate_ati_demo.js` (it will overwrite ATI Demo fixes), split demo head CSS (render-blocking), lazy-load `col-auth.js`, idle-pause RAF loops, dedupe 7.5 MB PDFs.
