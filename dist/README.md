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
| **Primary Deploy** | Static HTML → Vercel (no build step) |
| **React Bundle** | `npm run build` → esbuild → `dist/Traffic/simulator-bundle.js` |
| **Auth** | Supabase Google OAuth + Email/Password (two systems) |
| **3D Engine** | Three.js 0.185 (procedural backgrounds + Traffic simulator) |
| **PWA** | `manifest.json` + `sw.js` (cache-first, `col-cache-v2`) |
| **APK** | `version.json` (v1.6, code 7) → `advancedlogiclabs.dpdns.org/COL.apk` |
| **CI/CD** | None enforced — no lint, no tests, no typecheck in CI |

---

## Project Structure

```
Vercel/
├── *.html                     # 20+ static pages (home, about, solar, ATI, etc.)
├── col-router.js              # Global router — fetches config.json, renders 503/404
├── col-ui.js                  # Shared UI (nav, theme toggle, APK updater)
├── col-ui.css                 # CSS variables + typography (CoL Design System)
├── col-auth.js                # Supabase Google OAuth + email/password (497 lines)
├── col-3d.js                  # Three.js procedural backgrounds (desktop only)
├── col-achievements.js        # Achievement system
├── supabase.js                # Minified Supabase SDK v2.108.1
├── config.json                # Supabase creds + page status routing (200/503/404/500)
├── vercel.json                # cleanUrls, rewrites, redirects
├── build.js                   # esbuild bundler for react-src/
├── manifest.json              # PWA manifest ("Class Of Learners")
├── sw.js                      # Service worker (cache-first, 7 core assets)
├── version.json               # APK version info (v1.6, code 7)
├── cast-version.json          # Cast app version (v1.1, code 2)
├── package.json               # React 19, Three.js 0.185, esbuild 0.28, TS 6
├── .prettierrc                # No semicolons, single quotes, tab width 2
├── AGENTS.md                  # Agent rules for this repo
├── CLAUDE.md                  # Project brief for Claude Code
├── PROJECTS.md                # Project portfolio index
├── Traffic_Archives_Index.md  # Historical archive index
├── robots.txt / sitemap.xml   # SEO
├── style.css                  # Global styles
├── global-gesture.js          # Gesture handling
├── logic.js                   # Shared logic utilities
├── lvs.js                     # LVS system
├── supabase/                  # Supabase migrations/functions
├── react-src/                 # React/TS source for simulator bundle
│   ├── GamePage.tsx           # Entrypoint → dist/Traffic/simulator-bundle.js
│   ├── DrivingSimulator.tsx   # Top-level simulator component
│   ├── types.ts               # Shared TypeScript types
│   ├── engine/                # Game engine modules
│   ├── vehicles/              # Vehicle system
│   ├── hud/                   # HUD components
│   ├── state/                 # State management
│   ├── hooks/                 # React hooks
│   ├── systems/               # Game systems
│   ├── assets/                # Static assets (textures, models)
│   ├── audio/                 # Audio files
│   └── data/                  # Game data files
├── cast/                      # CastFlow PWA (separate mini-app)
│   ├── CastFlow.html
│   ├── manifest.json
│   └── sw.js
├── dist/                      # Build output (committed — full site copy + Traffic bundle)
├── .agents/skills/            # 100+ agent skills (3d-game-builder, browser-use, etc.)
├── .claude/                   # Claude Code settings + skills
├── .superpowers/              # Superpowers config
├── .vercel/                   # Vercel CLI cache
├── node_modules/              # Dependencies
├── Cyberpunk/                 # Archived Cyberpunk project
├── docs/                      # Documentation
└── Traffic/                   # 3D Driving Simulator sub-app (see below)
```

---

## Traffic Simulator (`Traffic/`)

A 3D browser-based driving/pedestrian game with Indian city environments, 20+ levels, vehicle physics, pedestrian mode, traffic AI, and course certificates.

### Modular Architecture (4 Systems)

| Module | File | Lines | Purpose |
|--------|------|-------|---------|
| **RoadGraph** | `road-graph.js` | ~400 | A* pathfinding, road segments, zones, crosswalks |
| **RenderCore** | `render_core.js` | 474 | WebGL2 renderer, quality presets (Low/Med/High/Ultra), DRS, LOD |
| **SafeZoneUI** | `safezone-ui.js` | ~300 | Responsive HUD, mobile detection, safe-area insets |
| **ThreePools** | `pool.js` | ~350 | Object pooling for vehicles, pedestrians, debris (GC reduction) |

### Integration Points in `game_core.js`

```javascript
// Constructor (line ~652)
ThreePools.init(this);

// RenderCore init (line ~719)
this.renderCore = new RenderCore();

// Level load (line ~2430)
this.roadGraph = RoadGraph.fromLevelConfig(levelConfig);

// Cleanup (line ~1723)
ThreePools.releaseAll();
```

### Traffic Pages

| Page | Purpose |
|------|---------|
| `Driving.html` | Main game entry point |
| `Academy.html` | Tutorial/learning mode |
| `TrafficDashboard.html` | Stats, leaderboards |
| `TrafficSetup.html` | Vehicle/character selection |

### Traffic Assets

- `levels/` — 20+ level JSON configs
- `Models/` — GLB models (vehicles, buildings, props)
- `textures/` — Texture assets
- `vehicles.js`, `bus.js`, `lambo.js`, `scenario2d.js` — Game logic modules

### Integration Guide

See [`Traffic/INTEGRATION.md`](Traffic/INTEGRATION.md) for full wiring instructions.

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

**`col-3d.js`** loads at end of `<body>` on pages needing Three.js backgrounds.

**Standalone pages** (`Career.html`, `Database_Logic.html`) only load `col-3d.js`.

---

## Two Auth Systems

| System | Files | Used By |
|--------|-------|---------|
| **Supabase Auth** (`col-auth.js`) | `col-auth.js`, `supabase.js` | All standard pages |
| **QR Legacy Auth** | `qr.html` (inline `gSignIn()`) | `qr.html` only |

- `col-auth.js` injects `colAuthModal`/`loginMo` modals, exposes `openLogin()`, `closeMo()`
- Fires `col-auth-changed` CustomEvent on auth state change
- Google OAuth Client ID: `500448449044-...` (hardcoded in multiple HTML files)

---

## Theme System

| Scope | Dark Mode | Light Mode | Storage |
|-------|-----------|------------|---------|
| **Main Site** | Default | `body.lm` | `localStorage('theme')` |
| **QR Pages** | `body.dark-mode` | `body.light` | Separate CSS vars (`--pri`, `--bg`) |

---

## CSS Variables (CoL Design System)

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

---

## Dual Config Override System

Two layers control page status (200/503/404/500):

1. **`config.json`** — Fetched at runtime by `col-router.js` with cache-busting `?t=` timestamp. Global source of truth.
2. **Inline Admin Overrides** — HTML pages read `localStorage.col_admin_config` to override status locally.

---

## Build System

```bash
# Optional React bundle for Traffic simulator
npm run build
# Runs build.js → esbuild bundles react-src/GamePage.tsx → dist/Traffic/simulator-bundle.js
```

- **No lint, no tests, no typecheck** in CI
- TypeScript only used in `react-src/` (no root `tsconfig.json`)
- `dist/` is committed to git (full site copy + Traffic bundle)

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
| **Service Worker** | `sw.js` | Cache: `col-cache-v2`, pre-caches 7 core assets |
| **APK Version** | `version.json` | v1.6 (code 7), checked by `col-ui.js` |
| **APK URL** | — | `advancedlogiclabs.dpdns.org/COL.apk` |
| **Cast App** | `cast/` | Separate PWA with `CastFlow.html` |

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

1. Search ALL HTML files: `grep -r "filename" *.html`
2. Check `config.json`, `vercel.json`, and any JS file
3. Historical archives: `Traffic_Archives_Index.md` indexes old dirs (`Traffic - Major UI Change/`, `Traffic - Major Updates/`)

---

## Page Structure Pattern

Every HTML page follows:

1. `<head>` — shared scripts (deferred), page-specific inline `<style>`
2. `<body>` — HTML content
3. End of `<body>` — page-specific inline `<script>` block

---

## Installed Agent Skills (`.agents/skills/`)

Registered in `skills-lock.json`:
- `browser-use` — CDP browser automation
- `valyu-best-practices` — Valyu API toolkit
- 100+ skills: `3d-game-builder`, `3d-game-dev`, `humanizer`, `skill-creator`, etc.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Links

- **Live Site:** `https://classoflearners.vercel.app` (or custom domain)
- **APK Download:** `advancedlogiclabs.dpdns.org/COL.apk`
- **GitHub:** `https://github.com/<org>/<repo>`
- **Vercel Dashboard:** `https://vercel.com/<team>/<project>`