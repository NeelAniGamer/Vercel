# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands
- `npm run build`: Bundles the React-based Traffic Simulator from `react-src/` into the static site distribution using `esbuild`.

## High-Level Architecture
The project uses a hybrid architecture combining a static HTML core with a bundled React application for the Traffic Simulator.

### Key Shared Modules
Core logic is split into specialized modules used across the site:
- `col-router.js`: Handles client-side routing and navigation.
- `col-ui.js`: Common UI utilities and shared components.
- `col-auth.js`: Authentication logic and session management via Supabase.
- `col-3d.js`: 3D rendering and scene management utilities using Three.js.

### Script Loading and Dependencies
Scripts must be loaded in a strict order to ensure dependencies are available:
`col-router.js` $\rightarrow$ `col-ui.css` $\rightarrow$ `col-ui.js` $\rightarrow$ `col-auth.js`

### Critical Files
The following files are critical for security and routing. Modifications to these files **must** be explicitly approved:
- `config.json`
- `col-auth.js`
- `col-router.js`
- `supabase.js`

### Design System
The UI uses a custom CSS variable system for consistent theming:
- `--void`: Primary dark/background tone.
- `--signal`: Primary accent/action color.
- `--ion`: Secondary accent/highlight color.

## Project Structure
- **Static HTML Core**: Root and top-level directories contain primary HTML pages and core JS modules.
- `react-src/`: Source code for the Traffic Simulator, which is compiled into the main site distribution.
- `Traffic/`: Distribution files for the Traffic Simulator.
- `cast/`: CastFlow PWA implementation.
