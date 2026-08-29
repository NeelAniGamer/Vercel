# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands
- `npm run build`: Runs `build.js`, which **deletes `dist/` and regenerates it as a full copy of the site** (every root file plus `Traffic/`, `cast/`, assets — excluding `node_modules`, `.git`, `react-src`, and the build tooling), then esbuild-bundles `react-src/GamePage.tsx` → `dist/Traffic/simulator-bundle.js`. `dist/` is committed, so a build produces a large diff.
- `npx prettier --write <file>`: Formatting per `.prettierrc` (no semicolons, single quotes, printWidth 200). Not enforced in CI; older files predate it — match the file you are editing.
- There is no lint, test, or type-check step in CI. Deployment is a commit to `main` → Vercel serves the static files.

## High-Level Architecture
The project uses a hybrid architecture combining a static HTML core with a bundled React application for the Traffic Simulator. See `AGENTS.md` (repo root) and `Traffic/CLAUDE.md` for the detailed per-area rules.

### Key Shared Modules
Core logic is split into specialized modules used across the site:
- `col-router.js`: Global Router & Banner System; handles basic page routing overrides and global notifications.
- `col-ui.js`: Common UI utilities and shared components.
- `col-auth.js`: Authentication logic and session management via Supabase.
- `col-3d.js`: Shared Procedural Three.js backgrounds and scene management.
- `col-achievements.js`: Shared achievements and milestone tracking.

### Script Loading and Dependencies
Every page loads the shared modules with `defer`, in this strict order — dependencies are plain `window` globals, so order is load-bearing:
`col-router.js` $\rightarrow$ `col-ui.css` $\rightarrow$ `col-ui.js` $\rightarrow$ `col-auth.js`

Never include a shared script twice on one page. `col-3d.js` loads separately at the end of `<body>` and skips touch devices. `Career.html` and `Database_Logic.html` are standalone and load only `col-3d.js`.

### Traffic/ Integration
`Traffic/` is a semi-independent static sub-app (no build step of its own). Its pages reach the shared modules with a `../` prefix (`../col-router.js`, `../col-ui.js`, `../col-auth.js`), and `Driving.html` / `Academy.html` patch `window.fetch` to rewrite `config.json` requests to `../config.json`. Auth flows through `window.supabaseClient` / `window.colUser` published by `col-auth.js`.

### Critical Files
The following files are critical for security, routing, and the build pipeline. Modifications to these files **must** be explicitly approved:
- `config.json`: Global page status, banner configuration, and Supabase credentials.
- `Traffic/config.json`: Separate credential/status config for the Traffic sub-app. Do not merge or sync with the root `config.json`.
- `col-auth.js`: Authentication and session security.
- `col-router.js`: Global routing and error page handling.
- `supabase.js`: Supabase client configuration (minified vendor SDK — replace only via a CDN update).
- `package.json` & `build.js`: Build pipeline and dependency definitions.

### Design System
The UI uses a custom CSS variable system for consistent theming, defined in `col-ui.css`:
- **Core Tones**: `--void` (Dark background), `--void2` (Darker variant), `--panel` (Surface color).
- **Accents**: `--signal` (Primary Yellow/Orange), `--ion` (Secondary Blue/Cyan), `--teal`, `--plasma`, `--em`.
- **Typography**: `--serif` (Instrument Serif), `--sans` (Inter), `--mono` (Space Mono).
- **Utilitites**: `--line`/`--lineb` (Borders), `--ink` (Main text), `--dim` (Muted text).
- **Motion**: `--ease` (Standard easing), `--spring` (Bouncy motion).

## Project Structure
- **Root**: Source of truth for the project. Contains the static HTML pages, core JS modules, `package.json`, and the React source.
- `Traffic/`: Source of truth for the vanilla Three.js driving simulator (`Driving.html`, `Academy.html`, `game_core.js`, …). Served as-is; copied verbatim into `dist/Traffic/` by the build. See `Traffic/CLAUDE.md`.
- `react-src/`: A separate React/TypeScript port of the simulator (`GamePage.tsx`), bundled by `build.js` to `dist/Traffic/simulator-bundle.js`. It is a secondary artifact — it does not generate the files in `Traffic/`.
- `cast/`: CastFlow PWA implementation.
- `dist/`: Committed build output (full site copy + React bundle).
- `AGENTS.md`: Detailed agent rules — file inventory, two auth systems, theme/config override layers, SEO and cleanup checklists.
