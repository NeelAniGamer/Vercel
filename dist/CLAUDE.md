# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands
- `npm run build`: Bundles the React-based Traffic Simulator from `react-src/` into the static site distribution (`dist/Traffic/`) using `esbuild`.

## High-Level Architecture
The project uses a hybrid architecture combining a static HTML core with a bundled React application for the Traffic Simulator.

### Key Shared Modules
Core logic is split into specialized modules used across the site:
- `col-router.js`: Global Router & Banner System; handles basic page routing overrides and global notifications.
- `col-ui.js`: Common UI utilities and shared components.
- `col-auth.js`: Authentication logic and session management via Supabase.
- `col-3d.js`: Shared Procedural Three.js backgrounds and scene management.
- `col-achievements.js`: Shared achievements and milestone tracking.

### Script Loading and Dependencies
Scripts must be loaded in a strict order to ensure dependencies are available:
`col-router.js` $\rightarrow$ `col-ui.css` $\rightarrow$ `col-ui.js` $\rightarrow$ `col-auth.js`

### Critical Files
The following files are critical for security, routing, and the build pipeline. Modifications to these files **must** be explicitly approved:
- `config.json`: Global page status and banner configuration.
- `col-auth.js`: Authentication and session security.
- `col-router.js`: Global routing and error page handling.
- `supabase.js`: Supabase client configuration.
- `package.json` & `build.js`: Build pipeline and dependency definitions.

### Design System
The UI uses a custom CSS variable system for consistent theming, defined in `col-ui.css`:
- **Core Tones**: `--void` (Dark background), `--void2` (Darker variant), `--panel` (Surface color).
- **Accents**: `--signal` (Primary Yellow/Orange), `--ion` (Secondary Blue/Cyan), `--teal`, `--plasma`, `--em`.
- **Typography**: `--serif` (Instrument Serif), `--sans` (Inter), `--mono` (Space Mono).
- **Utilitites**: `--line`/`--lineb` (Borders), `--ink` (Main text), `--dim` (Muted text).
- **Motion**: `--ease` (Standard easing), `--spring` (Bouncy motion).

## Project Structure
- **Root**: Source of truth for the project. Contains core JS modules, `package.json`, and the React source.
- `react-src/`: Source code for the Traffic Simulator (TSX/TS), compiled via `build.js`.
- `Traffic/`: Distribution folder for the Traffic Simulator (mirrored to `dist/Traffic/` after build).
- `cast/`: CastFlow PWA implementation.
- `dist/`: Final build output directory for deployment.
