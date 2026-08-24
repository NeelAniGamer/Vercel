---
title: Class Of Learners
emoji: 💻
colorFrom: blue
colorTo: purple
sdk: static
pinned: false
license: mit
---

# Class Of Learners

<p align="center">
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel" alt="Vercel">
  <img src="https://img.shields.io/badge/Static%20HTML-No%20Build%20Step-333333?style=for-the-badge" alt="Static HTML">
  <img src="https://img.shields.io/badge/Three.js-0.185-000000?style=for-the-badge&logo=three.js" alt="Three.js">
  <img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  <strong>Static HTML site on Vercel with a 3D driving simulator sub-app, multiple interactive demos, and a PWA/APK ecosystem.</strong>
</p>

---

## Overview

**Class Of Learners** is a multi-project static site hosting 20+ interactive pages and apps. The primary deployment is zero-build static HTML — commit to `main` and Vercel auto-deploys. A secondary React/TypeScript bundle (via esbuild) powers the Traffic Simulator's React UI layer.

| Aspect | Details |
|--------|---------|
| **Primary Deploy** | Static HTML → Vercel (no build step; commit to `main`) |
| **React Bundle** | `npm run build` → esbuild → `dist/Traffic/simulator-bundle.js` |
| **Auth** | Supabase Google OAuth + Email/Password (two systems) |
| **3D Engine** | Three.js 0.185 (procedural backgrounds + Traffic simulator) |
| **PWA** | `manifest.json` + `sw.js` (cache-first, `col-cache-v4`) |
| **APK** | `version.json` (v1.6, code 7) → `/COL.apk` |
| **CI/CD** | None enforced — no lint, no tests, no typecheck in CI |

---

## Project Structure

```
Vercel/
├── *.html                     # 20+ static pages (home, about, solar, ATI, etc.)
├── col-router.js              # Global router — fetches config.json, renders 503/404
├── col-ui.js                  # Shared UI (nav, theme toggle, APK updater)
├── col-ui.css                 # CSS variables + typography (CoL Design System)
├── col-auth.js                # Supabase Google OAuth + email/password
├── col-3d.js                  # Three.js procedural backgrounds (desktop only)
├── col-achievements.js        # Achievement engine helpers (verify.html, dashboard.html)
├── supabase.js                # Minified Supabase SDK v2.108.1
├── config.json                # Supabase creds + page status routing (200/503/404/500)
├── vercel.json                # cleanUrls, rewrites, redirects
├── build.js                   # esbuild bundler for react-src/
├── manifest.json              # PWA manifest ("Class Of Learners")
├── sw.js                      # Service worker (col-cache-v4, 6 core assets)
├── version.json               # COL APK version info (v1.6, code 7)
├── cast-version.json          # CastFlow APK version (v1.1, code 2)
├── package.json               # React 19, Three.js 0.185, esbuild 0.28, TS 6
├── .prettierrc                # No semicolons, single quotes, tab width 2
├── AGENTS.md / CLAUDE.md      # Agent rules + project brief
├── PROJECTS.md                # Project portfolio index
├── robots.txt / sitemap.xml   # SEO
├── style.css / visual.css     # Global styles
├── logic.js / lvs.js          # Legacy shared logic / Academy level data (scoped)
├── global-gesture.js          # Gesture handling
├── COL.apk                    # Android app binary served at /COL.apk
├── supabase/                  # Supabase migrations/functions
├── react-src/                 # React/TS source for simulator bundle
│   ├── GamePage.tsx           # Entrypoint → dist/Traffic/simulator-bundle.js
│   ├── DrivingSimulator.tsx   # Top-level simulator component
│   ├── types.ts               # Shared TypeScript types
│   ├── engine/ vehicles/ hud/ state/ hooks/ systems/
│   ├── assets/ audio/ data/   # Static assets
├── cast/                      # CastFlow PWA (separate mini-app)
├── Cyberpunk/                 # Asset archive (legacy Traffic.html + models)
├── dist/                      # Build output (committed — full site copy + bundle)
├── docs/                      # Specs & plans (superpowers)
├── my-video/ Terra3D/         # Side projects
├── node_modules/              # Dependencies
└── Traffic/                   # 3D Driving Simulator sub-app (see below)
```

---

## Traffic Simulator (`Traffic/`)

A 3D browser-based driving/pedestrian game with Mumbai-themed environments, 50+ levels, vehicle physics, pedestrian mode, traffic AI, and course certificates. **Two stacks coexist:**

### Stack 1 — Legacy Static Game (no build step)

Plain `<script>` tags, Three.js r128 from CDN. Details in [`Traffic/AGENTS.md`](Traffic/AGENTS.md).

| Page | Purpose |
|------|---------|
| `Driving.html` | Main game entry point |
| `Academy.html` | Tutorial/learning mode |
| `TrafficDashboard.html` | Stats, leaderboards |
| `TrafficSetup.html` | Vehicle/character selection |

Modular subsystems loaded in strict order (`pools` → `road-graph` → `render_core` → `safezone-ui` → `game_core`):

| Module | File | Purpose |
|--------|------|---------|
| **ThreePools** | `pools.js` | Object pooling (meshes, vectors, groups) for zero-GC gameplay |
| **RoadGraph** | `road-graph.js` | Road network nodes/edges, A* pathfinding, building slots |
| **RenderCore** | `render_core.js` | WebGL renderer, quality presets (Low/Med/High/Ultra), DRS, LOD, bloom |
| **SafeZoneUI** | `safezone-ui.js` | Responsive HUD layout with safe-area insets, mobile detection |

Other assets: `levels/` (level configs), `Models/` (GLB/FBX), `textures/`, plus generated asset bundles (`cert_assets.js` ~18MB, `env.js`, `auto.js`, `bus.js`, `lambo.js`, `vehicles.js`, `scenario2d.js`) — **do not hand-edit the bundles**.

### Stack 2 — Vite + TypeScript + Electron Port (`mumbai-traffic-hero`)

Source in `Traffic/src/` (entry `index.html` → `src/main.ts`). Commands run from `Traffic/`:

```bash
npm run dev              # Vite dev server on :5173
npm run build:web        # typecheck (tsc --noEmit) + build → dist-web/
npm run typecheck        # tsc --noEmit
npm run test:smoke       # Playwright smoke test (pw_test.js)
npm run electron:portable# Electron portable build → dist-electron/
```

Path aliases: `@engine`, `@systems`, `@game`, `@ui`, `@state`, `@shaders`, `@materials`. Uses Three.js 0.170 + Rapier physics + Zustand + Howler.

> ⚠️ Don't confuse `Traffic/dist/` (Electron build output) with root `dist/` (committed site copy).

---

## Main Site Pages

| Page | Description | 3D Background |
|------|-------------|---------------|
| `home.html` | Landing page | ✅ `col-3d.js` |
| `about.html` | Team & project showcase | ✅ `col-3d.js` |
| `school.html` | Education page | ✅ `col-3d.js` |
| `privacy.html` / `terms.html` | Legal | ✅ `col-3d.js` |
| `feedback.html` | User feedback form | ✅ `col-3d.js` |
| `download.html` | APK download page | ❌ |
| `sneh-asha.html` | Sneh Asha initiative | ❌ |
| `admin.html` | Admin panel (page status overrides) | ❌ |
| `Career.html` | Careers (standalone, own CSS vars) | ✅ `col-3d.js` only |
| `Database_Logic.html` | DB documentation (standalone) | ✅ `col-3d.js` only |
| `sitemap.html` | HTML sitemap | ❌ |
| `verify.html` | Email verification | ❌ |
| `solar.html` | Solar system interactive | ❌ |
| `ati.html` / `ati-demo.html` | AI Text Interpreter tool | ❌ |
| `gesture.html` | Hand gesture recognition | ❌ |
| `rpg.html` | RPG prototype | ❌ |
| `engine.html` | Engine simulator | ❌ |
| `qr.html` / `qr-editor.html` | QR code generator/editor (legacy inline auth) | ❌ |
| `dashboard.html` | User dashboard | ❌ |

---

## Shared Script Loading Order

**Standard pages** load in `<head>` (all `defer`):

```html
<script defer src="col-router.js"></script>
<link rel="stylesheet" href="col-ui.css" />
<script defer src="col-ui.js"></script>
<script defer src="col-auth.js"></script>
```

**Order matters:** `col-router.js` → `col-ui.css` → `col-ui.js` → `col-auth.js`

**`col-3d.js`** loads at end of `<body>` on pages needing Three.js backgrounds (`home`, `about`, `school`, `privacy`, `terms`, `feedback`, `Career`, `Database_Logic`). Skips touch devices.

**`col-achievements.js`** loads after `col-ui.js` on achievement pages (`dashboard.html`, `verify.html`).

**Standalone pages** (`Career.html`, `Database_Logic.html`) only load `col-3d.js`.

---

## Two Auth Systems

| System | Files | Used By |
|--------|-------|---------|
| **Supabase Auth** (`col-auth.js`) | `col-auth.js`, `supabase.js` | All standard pages |
| **QR Legacy Auth** | `qr.html` (inline `gSignIn()`) | `qr.html` only |

- `col-auth.js` injects `colAuthModal`/`loginMo` modals, exposes `openLogin()`, `closeMo()`, `openGlobalLogin()`
- Fires `col-auth-changed` CustomEvent on auth state change; state flows through `window.supabaseClient` / `window.colUser`
- Google OAuth Client ID: `500448449044-...` — hardcoded **only** in `col-auth.js` and `qr.html`. Changing it breaks Google sign-in site-wide.
- `config.json` and `Traffic/config.json` hold separate Supabase creds — never mix or sync them.

---

## Theme System

| Scope | Dark Mode | Light Mode | Storage |
|-------|-----------|------------|---------|
| **Main Site** | Default | `body.lm` | `localStorage('theme')` |
| **QR Pages** | `body.dark-mode` | `body.light` | Separate CSS vars (`--pri`, `--bg`) |

---

## CSS Variables (CoL Design System)

Defined in `col-ui.css`:

```css
--void: #070a14;        /* background */
--void2: #0c1224;       /* secondary bg */
--panel: #111827;       /* card bg */
--line: rgba(255,255,255,0.08);   /* borders */
--lineb: rgba(255,255,255,0.16);  /* strong borders */
--ink: #e8e3d8;         /* primary text */
--dim: #8891aa;         /* muted text */
--signal: #f2b84b;      /* accent gold */
--ion: #5ed4f5;         /* accent blue */
--teal: #00f0cc;        /* accent teal */
--plasma: #b89bff;      /* accent purple */
--em: #34d399;          /* accent green */
--serif: 'Instrument Serif';
--sans: 'Inter';
--mono: 'Space Mono';
```

Use these tokens — don't invent new colors/fonts.

---

## Dual Config Override System

Two layers control page status (200/503/404/500):

1. **`config.json`** — Fetched at runtime by `col-router.js` with cache-busting `?t=` timestamp. Global source of truth.
2. **Inline Admin Overrides** — HTML pages read `localStorage.col_admin_config` to override status locally (managed by `admin.html`).

---

## Build System

```bash
# Optional React bundle for Traffic simulator (root)
npm run build
# Runs build.js → wipes dist/ and regenerates it as a full site copy,
# then esbuild bundles react-src/GamePage.tsx → dist/Traffic/simulator-bundle.js
```

- **No lint, no tests, no typecheck** enforced at root
- TypeScript only matters in `react-src/` and `Traffic/src/` (no root `tsconfig.json`)
- `dist/` is committed to git (~3,900 files) — only rebuild when the bundle changed

---

## Vercel Configuration (`vercel.json`)

```json
{
  "cleanUrls": true,
  "rewrites": [{ "source": "/", "destination": "/home" }],
  "redirects": [
    { "source": "/index.html", "destination": "/home", "permanent": true },
    { "source": "/index", "destination": "/home", "permanent": true }
  ]
}
```

- Serves pages without `.html` extension
- Root `/` rewrites to `/home`
- Permanent redirects for legacy `/index.html` and `/index`

---

## PWA & APK System

| Component | File | Details |
|-----------|------|---------|
| **Manifest** | `manifest.json` | Name: "Class Of Learners" |
| **Service Worker** | `sw.js` | Cache `col-cache-v4`; pre-caches 6 assets (`/home.html`, `/col-ui.css`, `/col-ui.js`, `/col-router.js`, `/col-auth.js`, `/Icon.png`) |
| **COL APK Version** | `version.json` | v1.6 (code 7), `apkUrl: "/COL.apk"` — checked by `col-ui.js` for in-app update prompts |
| **COL APK Binary** | `COL.apk` (repo root) | Served at `/COL.apk` |
| **Cast App** | `cast/` + `CastFlow.html` | Separate PWA, versioned via `cast-version.json` (v1.1, code 2) |

Bump the SW cache name alongside its `SW_VERSION` date when changing cached assets.

---

## SEO Requirements (Every Page)

- `<title>` and `<meta name="description">` — **required**
- `<link rel="canonical">` — **recommended**
- Google Site Verification: `bWaer2b60VA1y3RMV48HYGPv8vlMUcvlFGxY3e6SAqU` — **required**
- `loading="lazy"` on non-hero images
- Semantic HTML

---

## File Cleanup Rules

Before deleting any file:

1. Search ALL HTML files for references
2. Check `config.json`, `vercel.json`, and JS files
3. Remember `build.js` copies nearly everything into `dist/` — check nothing references it there either

---

## Formatting (`.prettierrc`)

No semicolons · single quotes · tab width 2 · no trailing commas · print width 200.

Prettier ignores: `supabase.js`, both `config.json`s, `dist/`, binaries (`*.glb`, `*.webp`, `*.png`, `*.apk`). Not enforced on older files — match the style of the file you're editing.

---

## Page Structure Pattern

Every standard HTML page follows:

1. `<head>` — shared scripts (deferred, strict order), page-specific inline `<style>`
2. `<body>` — content
3. End of `<body>` — page-specific inline `<script>` block

---

## License

MIT — see [LICENSE](LICENSE)

---

## Links

- **Live Site:** `https://classoflearners.vercel.app` (or custom domain)
- **APK Download:** `/COL.apk` (self-hosted at repo root)
- **Vercel Dashboard:** `https://vercel.com/<team>/<project>`
