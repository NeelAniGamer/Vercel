# Class Of Learners — Agent Rules

> Static HTML site on Vercel. Mostly no-build, but `react-src/` bundles via esbuild.
> Companion docs: `CLAUDE.md` (root), `Traffic/AGENTS.md` (simulator internals).

---

## Build & Verify

- **Deploy:** commit to `main` → Vercel auto-deploys static files. No CI lint/test/typecheck.
- **`npm run build`** runs `build.js`, which **deletes `dist/` and regenerates it** as a full copy of the site (everything except `node_modules`, `.git`, `react-src`, build tooling), then esbuild-bundles `react-src/GamePage.tsx` → `dist/Traffic/simulator-bundle.js`. `dist/` is committed (~3,900 tracked files), so a build produces a huge diff — only run it when the bundle changed.
- **Formatting:** `npx prettier --write <file>` per `.prettierrc`. Not enforced; older files predate it — match the file you are editing.
- No `tsconfig.json` at root. TypeScript only matters inside `react-src/` and `Traffic/src/`.

## Traffic/ Contains TWO Stacks

1. **Legacy static game** (`Driving.html`, `Academy.html`, `TrafficDashboard.html`, …): plain `<script>` tags, no build step, Three.js r128 from CDN. Details in `Traffic/AGENTS.md`.
2. **Vite + TypeScript + Electron port** ("mumbai-traffic-hero", `Traffic/package.json`): source in `Traffic/src/` (entry `index.html` → `src/main.ts`). Commands run from `Traffic/`:
   - `npm run dev` — Vite dev server on :5173
   - `npm run build:web` — typecheck (`tsc --noEmit`) + build → `dist-web/`
   - `npm run build:electron` / `electron:portable` — esbuild main/preload + vite → `dist/` + electron-builder
   - `npm run typecheck` — `tsc --noEmit`
   - `npm run test:smoke` — `node pw_test.js` (Playwright)
   - Path aliases: `@engine`, `@systems`, `@game`, `@ui`, `@state`, `@shaders`, `@materials`
- Do not confuse `Traffic/dist/` (Electron build output) with root `dist/` (committed site copy).

---

## File Structure

```
├── *.html              # Static pages (home, about, solar, qr, dashboard, ...)
├── col-router.js       # Global router (fetches config.json, renders 503/404)
├── col-ui.js           # Shared UI (nav, theme, APK updater)
├── col-ui.css          # CSS variables + typography (design system)
├── col-auth.js         # Supabase Google OAuth + email/password
├── col-3d.js           # Three.js procedural backgrounds (desktop only)
├── col-achievements.js # Achievements (loaded by dashboard.html, verify.html)
├── supabase.js         # Minified Supabase SDK v2.108.1
├── config.json         # Supabase creds + page status routing
├── vercel.json         # cleanUrls, rewrite / → /home, redirects
├── manifest.json       # PWA manifest ("Class Of Learners")
├── sw.js               # Service worker (cache-first)
├── version.json        # APK updater info (v1.6, code 7)
├── cast-version.json   # CastFlow APK info (v1.1, code 2)
├── Traffic/            # Simulator sub-app — see "Two Stacks" above
├── react-src/          # React/TS source → dist/Traffic/simulator-bundle.js
├── cast/               # CastFlow PWA mini-app
├── Cyberpunk/          # Asset archive (GLB models + JS bundles) — never modify
└── dist/               # Committed build output (full site copy + bundle)
```

---

## DO NOT TOUCH (Without Explicit Approval)

| File | Why |
|------|-----|
| `config.json` | Supabase auth credentials + page status routing. Changes break auth site-wide |
| `Traffic/config.json` | Separate Supabase creds for Traffic sub-app. Do NOT mix or sync with root config |
| `col-auth.js` | Global auth system (Google OAuth + email/password via Supabase) |
| `col-router.js` | Global router — fetches config.json, renders 503/404. Affects ALL pages |
| `supabase.js` | Minified vendor SDK. Replace only via CDN update |
| Google OAuth Client ID | Hardcoded in `col-auth.js` and `qr.html` only (`500448449044-...`). Changing breaks Google sign-in |

**Secrets:** `.env.local` (root) and `Traffic/.env` are gitignored local env files. Never print, echo, or commit them.

---

## Shared Script Loading Order

Every standard page loads these in `<head>` (all `defer`) — plain `window` globals, so order is load-bearing:

```html
<script defer src="col-router.js"></script>
<link rel="stylesheet" href="col-ui.css" />
<script defer src="col-ui.js"></script>
<script defer src="col-auth.js"></script>
```

- Never include a shared script twice on one page.
- `col-achievements.js` loads after `col-ui.js` on pages that use achievements (`dashboard.html`, `verify.html`).
- `col-3d.js` loads separately at end of `<body>` on pages needing Three.js backgrounds (`home`, `about`, `school`, `privacy`, `terms`, `feedback`, `Career`, `Database_Logic`). Skips touch devices.
- `Career.html` and `Database_Logic.html` are standalone — they load only `col-3d.js`.

---

## Two Auth Systems

1. **`col-auth.js`** — most pages. Supabase Google OAuth + email/password. Injects `colAuthModal`/`loginMo`. Exposes `openLogin()`, `closeMo()` globally. Fires `col-auth-changed` CustomEvent. Auth state flows through `window.supabaseClient` / `window.colUser`.
2. **QR inline auth** — `qr.html` only. Own legacy `gSignIn()` and inline Google OAuth (access token in URL hash).

Do NOT merge these systems without understanding both.

---

## Theme System

- **Main site:** dark default; light mode via `body.lm` class. Stored in `localStorage('theme')`.
- **QR pages:** separate system — `body.dark-mode` / `body.light` classes, different variables (`--pri`, `--bg`).

---

## Dual Config Override System

Page status (200/503/404/500) has two layers:

1. **`config.json`** — fetched at runtime by `col-router.js` with cache-busting `?t=`. Global source of truth.
2. **Inline admin overrides** — many pages have an early inline `<script>` reading `localStorage.col_admin_config` to override status locally (managed by `admin.html`).

---

## Design Tokens (defined in `col-ui.css`)

Backgrounds `--void` (#070a14) / `--void2` / `--panel`; text `--ink` / `--dim`; borders `--line` / `--lineb`; accents `--signal` (gold), `--ion` (blue), `--teal`, `--plasma`, `--em`; fonts `--serif` (Instrument Serif), `--sans` (Inter), `--mono` (Space Mono); motion `--ease`, `--spring`. Use these — don't invent new colors/fonts.

---

## Traffic/ Sub-App Gotchas

- Traffic HTML pages load shared modules with `../` prefix (`../col-router.js`, `../col-ui.js`, `../col-auth.js`).
- `Driving.html` / `Academy.html` **patch `window.fetch`** to redirect `config.json` requests to `../config.json`.
- Asset bundles (`cert_assets.js` ~18MB, `env.js`, `auto.js`, `bus.js`, `lambo.js`) are generated exports — do not hand-edit.
- `Traffic/Cyberpunk/` no longer exists; the asset archive moved to root `Cyberpunk/`.

---

## Vercel Routing (`vercel.json`)

- `cleanUrls: true` — pages served without `.html`
- Rewrite `/` → `/home`; permanent redirects `/index.html` and `/index` → `/home`

---

## PWA & APK

- **Service worker** (`sw.js`): cache name `col-cache-v4` (bump alongside `SW_VERSION` date when changing cached assets). Pre-caches 6 assets: `/home.html`, `/col-ui.css`, `/col-ui.js`, `/col-router.js`, `/col-auth.js`, `/Icon.png`.
- **APK updater:** `version.json` checked by `col-ui.js` for in-app prompts. Current: v1.6 (code 7), `apkUrl: "/COL.apk"` (file lives at repo root).
- **Cast app:** `cast/` + root `CastFlow.html`; versioned via `cast-version.json`.

---

## Formatting (`.prettierrc`)

No semicolons · single quotes · tab width 2 · no trailing commas · print width 200.
Prettier ignores: `supabase.js`, both `config.json`s, `dist/`, binaries (`*.glb`, `*.webp`, `*.png`, `*.apk`).

---

## Pages You CAN Touch Freely

| Category | Files |
|----------|-------|
| **Pages** | `home.html`, `about.html`, `school.html`, `privacy.html`, `terms.html`, `feedback.html`, `download.html`, `sneh-asha.html`, `admin.html`, `dashboard.html`, `verify.html`, `q.html`, `sitemap.html` |
| **Apps** | `solar.html`, `ati.html`, `ati-demo.html`, `gesture.html`, `rpg.html`, `engine.html` |
| **QR System** | `qr.html`, `qr-editor.html` |
| **Shared UI** | `col-ui.js`, `col-ui.css`, `col-3d.js`, `col-achievements.js`, `style.css` |
| **Assets** | Any `.webp`, `.png`, `.glb` files |
| **Config** | `vercel.json`, `robots.txt`, `sitemap.xml` |
| **Traffic/** | All files except `Traffic/config.json` and generated asset bundles |

---

## SEO Checklist (Every Page)

- `<title>` + `<meta name="description">` — required
- `<meta name="google-site-verification" content="bWaer2b60VA1y3RMV48HYGPv8vlMUcvlFGxY3e6SAqU">` — required
- `<link rel="canonical">` — recommended
- `loading="lazy"` on non-hero images; semantic HTML

---

## Before Deleting Any File

1. Search all HTML for references (include `config.json`, `vercel.json`, JS files)
2. Remember `build.js` copies nearly everything into `dist/` — check nothing references it there either

---

## Page Structure Pattern

1. `<head>`: shared scripts (deferred, strict order) + page-specific inline `<style>`
2. `<body>`: content
3. End of `<body>`: page-specific inline `<script>` block

---

_Last updated: August 21, 2026_
