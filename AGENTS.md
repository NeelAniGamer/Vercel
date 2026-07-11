# Class Of Learners — Agent Rules

> Static HTML site on Vercel. Mostly no-build, but `react-src/` bundles via esbuild.
> Read this before editing any file in the repo.

---

## Build System

- **Primary deployment:** Static HTML — commit to repo → Vercel auto-deploys (no build step)
- **React bundle (optional):** `npm run build` runs `build.js` → esbuild bundles `react-src/GamePage.tsx` → `dist/Traffic/simulator-bundle.js`. This is a secondary output, not the primary site.
- **No lint, no tests, no type checker** enforced in CI
- `package.json` dependencies: React 19, Three.js 0.185, esbuild, TypeScript 6, Prettier (optional)
- No `tsconfig.json` at root — TypeScript is only used for the React bundle in `react-src/`

---

## File Structure

```
├── *.html              # Static pages (home, about, solar, etc.)
├── col-router.js       # Global router (fetches config.json, renders 503/404)
├── col-ui.js           # Shared UI (nav, theme, APK updater)
├── col-ui.css          # CSS variables + typography
├── col-auth.js         # Supabase Google OAuth + email/password
├── col-3d.js           # Three.js procedural backgrounds (desktop only)
├── supabase.js         # Minified Supabase SDK v2.108.1
├── config.json         # Supabase auth creds + page status routing
├── build.js            # esbuild bundler for react-src/
├── manifest.json       # PWA manifest ("Class Of Learners")
├── sw.js               # Service worker (cache-first for core assets)
├── version.json        # APK version info (v1.6, code 7)
├── cast-version.json   # Cast app version (v1.1, code 2)
├── Traffic/            # 3D driving simulator sub-app (see Traffic/AGENTS.md)
├── react-src/          # React/TypeScript source for simulator bundle
│   ├── GamePage.tsx    # Main entrypoint → bundled to dist/Traffic/
│   ├── DrivingSimulator.tsx  # Top-level simulator component
│   ├── types.ts        # Shared TypeScript types
│   ├── engine/         # Game engine modules
│   ├── vehicles/       # Vehicle system
│   ├── hud/            # HUD components
│   ├── state/          # State management
│   ├── hooks/          # React hooks
│   ├── systems/        # Game systems
│   ├── assets/         # Static assets (textures, models)
│   ├── audio/          # Audio files
│   └── data/           # Game data files
├── cast/               # CastFlow PWA (separate mini-app)
├── dist/               # Build output (committed to git — includes full site copy + Traffic bundle)
├── skills-lock.json    # Installed agent skills registry
├── .agents/skills/     # Agent skills (3d-game-builder, browser-use, etc.)
└── .claude/            # Claude Code settings + skills
```

---

## DO NOT TOUCH (Without Explicit Approval)

| File                   | Why                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `config.json`          | Supabase auth credentials + page status routing. Changes break auth site-wide                    |
| `Traffic/config.json`  | Separate Supabase creds for Traffic sub-app. Do NOT mix with root config                         |
| `col-auth.js`          | Global auth system (Google OAuth + email/password via Supabase). 497 lines.                      |
| `col-router.js`        | Global router — fetches config.json, renders 503/404 screens. Affects ALL pages                  |
| `supabase.js`          | Minified Supabase SDK v2.108.1. Replace only via CDN update                                      |
| Google OAuth Client ID | Hardcoded in multiple HTML files (`500448449044-...`). Changing breaks Google sign-in everywhere |

---

## Shared Script Loading Order

Every standard page loads these in `<head>` (all `defer`):

```html
<script defer src="col-router.js"></script>
<link rel="stylesheet" href="col-ui.css" />
<script defer src="col-ui.js"></script>
<script defer src="col-auth.js"></script>
```

- Order matters: `col-router.js` → `col-ui.css` → `col-ui.js` → `col-auth.js`
- Never include any shared script more than once per page
- `col-3d.js` is loaded separately (at end of `<body>`) by pages needing Three.js backgrounds: `home.html`, `about.html`, `school.html`, `privacy.html`, `terms.html`, `feedback.html`, `Career.html`, `Database_Logic.html`. It skips on mobile/touch devices

### Pages that DON'T load shared scripts

- `Career.html` — standalone page with its own CSS variables, only loads `col-3d.js`
- `Database_Logic.html` — same pattern, only loads `col-3d.js`

---

## Two Auth Systems

1. **`col-auth.js`** — Used by most pages. Supabase-based Google OAuth + email/password. Injects `colAuthModal` / `loginMo` modal. Exposes `openLogin()`, `closeMo()` globally. On auth state change, fires `col-auth-changed` CustomEvent.
2. **QR inline auth** — `qr.html` has its own legacy `gSignIn()` function and inline Google OAuth (access token in URL hash). Only `qr.html` defines `gSignIn()`.

Do NOT merge these systems without understanding both. Most pages' `openLogin()` calls are bridged by `col-auth.js`.

---

## Theme System

- **Main site**: dark mode default. Light mode via `body.lm` class. Theme stored in `localStorage('theme')`.
- **QR pages**: separate system — uses `body.dark-mode` and `body.light` classes. Different CSS variables (`--pri`, `--bg`).

---

## Dual Config Override System

Two layers control page status (200/503/404/500):

1. **`config.json`** — fetched at runtime by `col-router.js` with cache-busting `?t=` timestamp. Global source of truth.
2. **Inline admin overrides** — HTML pages have inline `<script>` blocks reading `localStorage.col_admin_config` to override status locally.

---

## CSS Variables (CoL Design System)

```css
--void: #070a14;      /* background */
--void2: #0c1224;     /* secondary bg */
--panel: #111827;     /* card bg */
--line: rgba(255, 255, 255, 0.08);   /* borders */
--lineb: rgba(255, 255, 255, 0.16);  /* strong borders */
--ink: #e8e3d8;       /* primary text */
--dim: #8891aa;       /* muted text */
--signal: #f2b84b;    /* accent gold */
--ion: #5ed4f5;       /* accent blue */
--teal: #00f0cc;      /* accent teal */
--plasma: #b89bff;    /* accent purple */
--em: #34d399;        /* accent green */
--serif: 'Instrument Serif';
--sans: 'Inter';
--mono: 'Space Mono';
```

---

## Traffic/ Sub-App

`Traffic/` is a semi-independent sub-app with its own auth and game engine. Key gotchas:

- Traffic HTML pages (`Driving.html`, `Academy.html`, `TrafficDashboard.html`, `TrafficSetup.html`) DO load shared `../col-router.js`, `../col-ui.js`, `../col-auth.js` with `../` prefix
- `Driving.html` and `Academy.html` **patch `fetch()`** to redirect `config.json` requests to `../config.json`
- `Cyberpunk/` inside Traffic/ is an archive — never modify
- For deep Traffic architecture, see `Traffic/AGENTS.md`

---

## PWA & APK System

- **PWA:** `manifest.json` + `sw.js` for "Add to Home Screen" on Android
- **Service worker:** caches core assets (`/`, `/home.html`, `/col-*.js`, `/col-ui.css`, `/icon.webp`)
- **APK updater:** `version.json` checked by `col-ui.js` for in-app update prompts
- **Cast app:** `cast/` directory has its own mini-app (`CastFlow.html`) with separate manifest, plus root `CastFlow.html`

---

## Installed Agent Skills

Skills in `.agents/skills/` are registered in `skills-lock.json`:
- `browser-use` — browser automation via CDP
- `valyu-best-practices` — Valyu API toolkit
- Plus 8 more in `.agents/skills/` (3d-game-builder, 3d-game-dev, humanizer, etc.)

---

## Pages You CAN Touch Freely

| Category      | Files                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pages**     | `home.html`, `about.html`, `school.html`, `privacy.html`, `terms.html`, `feedback.html`, `download.html`, `sneh-asha.html`, `admin.html`, `Career.html`, `Database_Logic.html`, `sitemap.html` |
| **Apps**      | `solar.html`, `ati.html`, `ati-demo.html`, `gesture.html`, `rpg.html`, `engine.html`                                                                                                           |
| **QR System** | `qr.html`, `qr-editor.html`                                                                                                                                                                    |
| **Shared UI** | `col-ui.js`, `col-ui.css`, `col-3d.js`, `style.css`                                                                                                                        |
| **Assets**    | Any `.webp`, `.png`, `.glb` files                                                                                                                                                              |
| **Config**    | `vercel.json`, `robots.txt`, `sitemap.xml`                                                                                                                                                     |
| **Traffic/**  | All files under `Traffic/` except `Traffic/config.json`                                                                                                                                        |

---

## SEO Checklist

- `<title>` and `<meta name="description">` required on every page
- `<link rel="canonical">` recommended
- `<meta name="google-site-verification" content="bWaer2b60VA1y3RMV48HYGPv8vlMUcvlFGxY3e6SAqU">` on every page
- `loading="lazy"` on non-hero images
- Use semantic HTML

---

## File Cleanup Rules

Before deleting any file:

1. Search ALL HTML files for references: `grep -r "filename" *.html`
2. Check `config.json`, `vercel.json`, and any JS file
3. Historical archives: `Traffic_Archives_Index.md` indexes old directories (`Traffic - Major UI Change/`, `Traffic - Major Updates/`)

---

## Page Structure Pattern

Each HTML page follows this structure:

1. `<head>`: shared scripts (deferred), page-specific inline `<style>`
2. `<body>`: HTML content
3. End of `<body>`: page-specific inline `<script>` block

---

_Last updated: July 8, 2026_
