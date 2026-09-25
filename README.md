---
title: Class Of Learners
emoji: 💻
colorFrom: blue
colorTo: purple
sdk: static
pinned: false
license: mit
---

<div align="center">

# Class Of Learners

**Interactive engineering projects built by students from Mumbai.**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://advancedlogiclabs.dpdns.org/)
[![Static Build](https://img.shields.io/badge/Static%20HTML%20%2B%20Reproducible%20Build-333333?style=for-the-badge)](#getting-started)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?style=for-the-badge&logo=three.js)](#technology)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Data-3ECF8E?style=for-the-badge&logo=supabase)](#technology)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa)](#pwa-and-android-apk)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

[Open the production studio](https://advancedlogiclabs.dpdns.org/) · [Vercel mirror](https://classoflearners.vercel.app/)

</div>

---

## Contents

- [Overview](#overview)
- [Projects](#projects)
- [Technology](#technology)
- [Design System](#design-system)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Commands](#commands)
- [Build and Deployment](#build-and-deployment)
- [Quality and Verification](#quality-and-verification)
- [Security](#security)
- [Contributing](#contributing)
- [PWA and Android APK](#pwa-and-android-apk)
- [Team](#team)
- [License](#license)

## Overview

Class Of Learners is a student-built digital engineering studio and a multi-project web platform. The repository contains interactive 3D simulations, learning experiences, browser tools, and a PWA/APK distribution layer.

The public runtime is a collection of static HTML, CSS, and JavaScript applications. A reproducible root build filters the deployable tree, validates the maintained Traffic level set, bundles the React/TypeScript simulator entry with esbuild, and produces the committed `dist/` artifact consumed by Vercel.

> **Documentation note:** This README follows the current executable configuration. Older planning documents such as `PROJECTS.md` and `Traffic/CODEBASE.md` may describe superseded counts, entrypoints, or build assumptions.

### At a Glance

| Area                    | Details                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| **Production**          | [advancedlogiclabs.dpdns.org](https://advancedlogiclabs.dpdns.org/)       |
| **Hosting**             | Vercel; `vercel.json` selects `dist/` as the output directory             |
| **Runtime**             | Static HTML5, CSS, vanilla JavaScript, WebGL, and browser APIs            |
| **React bundle**        | `react-src/GamePage.tsx` → `dist/Traffic/simulator-bundle.js` via esbuild |
| **Authentication**      | Supabase Google/email authentication with live-session identity           |
| **Offline layer**       | Service worker, installable PWA, and self-hosted `COL.apk`                |
| **Primary sub-app**     | `Traffic/` — Mumbai Traffic Hero driving and road-safety experiences      |
| **Deployment artifact** | Approximately 620 MB because runtime 3D model packs are retained          |

## Projects

### Flagship Experiences

| Experience                 | Route                                                                                                           | What it includes                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Mumbai Traffic Hero**    | [`/Traffic/Driving`](https://advancedlogiclabs.dpdns.org/Traffic/Driving)                                       | 3D driving, vehicle handling, collisions, traffic AI, missions, and mobile controls |
| **Mumbai Traffic Academy** | [`/Traffic/Academy`](https://advancedlogiclabs.dpdns.org/Traffic/Academy)                                       | Road-safety lessons, level briefings, quizzes, syllabus progress, and certificates  |
| **Traffic Dashboard**      | [`/Traffic/TrafficDashboard`](https://advancedlogiclabs.dpdns.org/Traffic/TrafficDashboard)                     | Leaderboards, learner telemetry, badges, wallet data, and certificates              |
| **Solar System 3D**        | [`/solar`](https://advancedlogiclabs.dpdns.org/solar)                                                           | Interactive planetary visualization and orbital telemetry                           |
| **Terra3D**                | [`/Terra3D/`](https://advancedlogiclabs.dpdns.org/Terra3D/)                                                     | Geospatial globe and country knowledge experience                                   |
| **Gesture Control**        | [`/gesture`](https://advancedlogiclabs.dpdns.org/gesture)                                                       | Webcam hand tracking and touchless browser interaction                              |
| **ATI**                    | [`/ati`](https://advancedlogiclabs.dpdns.org/ati)                                                               | Typing instruction, velocity telemetry, and keyboard exercises                      |
| **QR Matrix Studio**       | [`/qr`](https://advancedlogiclabs.dpdns.org/qr) · [`/qr-editor`](https://advancedlogiclabs.dpdns.org/qr-editor) | QR generation, styling, and visual customization                                    |
| **RPG Engine**             | [`/rpg`](https://advancedlogiclabs.dpdns.org/rpg)                                                               | Canvas-based tilemap exploration and sprite animation                               |
| **Studio Pages**           | `/school` · `/sneh-asha` · `/download`                                                                          | Foundation, outreach, and distribution experiences                                  |

The root application also includes the studio landing page, team and career pages, feedback and verification tools, legal pages, visual sitemap, and supporting engineering notes. Vercel clean URLs map routes such as `/home`, `/Traffic/Driving`, and `/Terra3D/` to their HTML entrypoints.

## Technology

| Layer                    | Technology                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Web runtime**          | HTML5, CSS, vanilla JavaScript, Canvas, WebGL                                                            |
| **3D**                   | Three.js r128 in legacy pages; package-local Three.js versions for the React, Traffic, and Terra3D tools |
| **React layer**          | React 19, TypeScript, esbuild                                                                            |
| **Traffic tooling**      | Vite, TypeScript, Electron, electron-builder, Rapier dependency in the separate TypeScript port          |
| **Data and identity**    | Supabase Auth, Postgres-backed data, RLS-protected queries, and RPC functions                            |
| **Hosting**              | Vercel static deployment with security headers and clean URLs                                            |
| **Offline/distribution** | Service worker, web app manifest, Android APK, and version metadata                                      |
| **Quality/security**     | Prettier, GitHub code scanning, DevSkim, Defender for DevOps, Dependabot, and `scripts/security-check.js`   |
| **Assets**               | Procedural scenes, GLB/model packs, textures, skins, and compressed public media                         |

## Design System

The shared visual language is defined in `col-ui.css` and reused across the studio pages.

| Token      | Value     | Role                             |
| ---------- | --------- | -------------------------------- |
| `--void`   | `#070a14` | Deep space background            |
| `--panel`  | `#111827` | Elevated panel surface           |
| `--ink`    | `#e8e3d8` | Primary text                     |
| `--signal` | `#f2b84b` | Gold accent and primary action   |
| `--ion`    | `#5ed4f5` | Cyan data and interaction accent |
| `--em`     | `#34d399` | Success and safety state         |

UI changes should remain mobile-first at 360px, use title case for player-facing text, prefer `transform`/`opacity` animation, cap device pixel ratio, avoid full-viewport `background-position` animation, and lazy-load below-fold content. Keep the palette high-contrast without sacrificing the dark obsidian identity.

## Architecture

### Repository Map

| Path                                                           | Responsibility                                                                       | Status                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| `*.html`                                                       | Root production pages and clean-URL entrypoints                                      | Source                              |
| `col-*.js`, `col-*.css`                                        | Shared routing, UI, authentication, motion, and design tokens                        | Source                              |
| `config.json`                                                  | Publishable runtime configuration and page-status routing                            | Source; do not add secrets          |
| `manifest.json`, `sw.js`                                       | PWA metadata and offline/cache behavior                                              | Source                              |
| `react-src/`                                                   | React/TypeScript simulator components bundled by the root build                      | Source                              |
| `Traffic/`                                                     | Main browser Traffic application and its own package                                 | Source plus separate tooling        |
| `Traffic/src/`                                                 | TypeScript port included by the Traffic typecheck but not the active Vite page entry | Experimental/unwired runtime        |
| `Traffic/dist-web/`, `Traffic/dist/`, `Traffic/dist-electron/` | Vite and Electron output directories                                                 | Generated; excluded from root build |
| `Terra3D/`                                                     | Standalone Vite/Three.js globe package                                               | Separate package                    |
| `traffic-ts/`                                                  | TypeScript reference library without a package manifest or owning build              | Reference only                      |
| `dist/`                                                        | Filtered, committed production output served by Vercel                               | Generated artifact                  |
| `build.js`                                                     | Root static-copy, validation, and esbuild pipeline                                   | Build source of truth               |
| `scripts/`                                                     | Production and security verification                                                 | Development-only                    |
| `.github/`                                                     | Code-scanning config, DevSkim and Defender workflows, and Dependabot configuration   | CI/configuration                    |

### Root Build Flow

```text
Vercel
  │
  ├─ npm ci
  ├─ npm run build
  │    ├─ validate maintained Traffic levels
  │    ├─ remove and recreate dist/
  │    ├─ copy the filtered runtime tree
  │    ├─ copy Traffic/public assets
  │    └─ bundle react-src/GamePage.tsx with esbuild
  │
  └─ postbuild
       ├─ production artifact check
       └─ security regression check
```

`build.js` is deny-list based. It excludes environment files, databases, local agent state, dependency trees, source-only directories, selected archives, and selected large model paths. Review newly added files before building; the production checker is not a replacement for source review.

### Traffic Runtime Flow

- `Traffic/Driving.html` loads the level registry, `game_core.js`, the full `ui.js`, and `start.js`. The boot path waits for the `Game` class and starts the simulation.
- `Traffic/Academy.html` loads the level/course/UI stack and initializes the Academy interface; it does not load the driving `Game` or `start.js` boot path.
- Level files register entries in `window.LVS`; the current registry contains 57 objects: 54 numbered levels, two custom entries, and one free-roam entry. The selected entry is merged into the runtime map configuration before scene construction.
- Task completion is implemented in `game_core.js`; the validator is intended to mirror its task types and target vocabulary, but the full report currently exposes legacy mismatches. Review both when changing objectives.
- The intended identity boundary is the live Supabase session. Local profiles support offline setup but must not be presented as a signed-in account.
- Progress, quiz, civic, badge, and completion updates are split across `game_core.js`, `ui.js`, task/mission modules, and the Supabase synchronization layer. Preserve those idempotency and ownership boundaries when changing scoring.
- Dashboard XP/modules rows come from `certificates` and fall back to `user_profiles` when certificates are absent; profile metadata may use `user_profiles` then `profiles`, civic data uses `wallets`, and badge rankings use `badges`.

### Shared Services

- `col-router.js` handles shared page routing and runtime configuration.
- `col-ui.js` and `col-ui.css` provide navigation, theme, typography, and shared interface primitives.
- `col-auth.js` owns Google/email authentication and live-session state.
- `col-3d.js` and `col-3d/` provide the procedural background and modular scene layers.
- `sw.js` caches static resources while excluding private/dynamic paths such as `config.json`, API routes, and authentication endpoints.

## Getting Started

### Prerequisites

- Node.js 20 or newer for the installed Playwright toolchain.
- npm.
- A modern browser with WebGL for the 3D experiences.
- Optional: a Supabase project/account when testing authenticated data flows.

This repository is not an npm workspace. Install dependencies in the package directory that owns the command.

### Install Root Dependencies

```bash
npm ci
```

### Serve the Source Tree Locally

The repository includes a small clean-URL-aware server:

```bash
node serve.js
```

Open:

- Studio: [http://localhost:3000/home](http://localhost:3000/home)
- Traffic Driving: [http://localhost:3000/Traffic/Driving.html](http://localhost:3000/Traffic/Driving.html)
- Traffic Academy: [http://localhost:3000/Traffic/Academy.html](http://localhost:3000/Traffic/Academy.html)

`serve.js` is a local development server and is intentionally excluded from the production artifact.

### Build and Preview the Production Tree

```bash
npm run build
npx serve dist
```

The build deletes and recreates the committed root `dist/` directory. Do not hand-edit generated files. The current artifact is intentionally large because browser runtime model packs are retained; review asset changes before increasing deployment limits.

### Run the Traffic Vite Page

```bash
cd Traffic
npm ci
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/). The current Vite entry is `Traffic/index.html`, which presents the vanilla Traffic pages; it does not start the separate `Traffic/src/` TypeScript game runtime.

### Run Terra3D

```bash
cd Terra3D
npm install
npm run dev
```

Terra3D has no committed lockfile. Its Vite build writes to `Terra3D/dist`, which currently contains desktop/PyInstaller output; do not run that build casually.

## Commands

### Root Commands

| Command                                                                    | Purpose                                                         | Notes                                                       |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm ci`                                                                   | Install the root lockfile                                       | Vercel uses the same install command                        |
| `npm run build`                                                            | Run the complete filtered production build                      | Runs `postbuild` checks automatically                       |
| `npm run verify:production`                                                | Check an existing `dist/` and run the security regression check | Does not rebuild the artifact                               |
| `npm run security:check`                                                   | Run the standalone source/configuration security check          | Not a complete security test                                |
| `npm run security:audit`                                                   | Run npm's dependency audit                                      | Review findings rather than treating it as a release gate   |
| `node Traffic/tools/validate-levels.js --scope=level1,level5,level_custom` | Run the maintained level check used by the build                | Scoped errors determine the exit code                       |
| `node Traffic/tools/validate-levels.js`                                    | Print the complete level report                                 | Expected to expose the current legacy backlog               |
| `node --check <file>`                                                      | Parse-check a JavaScript file                                   | Use a temporary `.mjs` copy for module syntax when required |

The root `lint`, `typecheck`, `test`, and `test:smoke` scripts do not currently have a maintained root ESLint configuration, `tsconfig.json`, Playwright configuration, or test directory. The smoke script also requests an undefined `chromium` project. Do not present those commands as passing release gates until their inputs are restored.

### Traffic Commands

Run these from `Traffic/`:

| Command                     | Purpose                                | Notes                                |
| --------------------------- | -------------------------------------- | ------------------------------------ |
| `npm ci`                    | Install the nested Traffic lockfile    | Separate from the root install       |
| `npm run dev`               | Start Vite on port 5173                | Presents the current vanilla pages   |
| `npm run typecheck`         | Run the nested TypeScript check        | `strict: false` and `checkJs: false` |
| `npm run build:web`         | Typecheck and build `dist-web/`        | Web output                           |
| `npm run build:electron`    | Typecheck, build, and package Electron | Preferred checked desktop build      |
| `npm run electron:portable` | Build a portable Electron package      | Skips the TypeScript check           |
| `npm run preview`           | Preview the Vite output                | Use after a web build                |

From `Traffic/`, `npm run test:smoke` currently points to a missing `pw_test.js`; it is not a working test command.

## Build and Deployment

### Vercel Configuration

`vercel.json` is the deployment contract:

- Install: `npm ci`
- Build: `npm run build`
- Output: `dist/`
- Clean URLs: enabled
- Rewrites: `/` → `/home` and `/perceptus` → `/gesture`
- Security headers: HSTS, clickjacking protection, MIME sniffing protection, referrer policy, permissions policy, and report-only CSP
- Cache policy: long-lived static assets, revalidated HTML, and no-cache service/configuration files

Vercel serves the filtered output, not the repository root. GitHub provides code scanning plus DevSkim and Defender for DevOps scans; they are not a general build-and-test pipeline.

### Deployment Checklist

1. Run `npm ci` from the repository root.
2. Run `npm run build` and review the generated `dist/` diff.
3. Run `npm run verify:production` when checking an existing artifact.
4. Run `npm run security:audit` and review high/critical dependency findings.
5. Manually smoke-test `/home`, `/Traffic/Driving`, `/Traffic/Academy`, and `/Traffic/TrafficDashboard`.
6. Confirm no `.env*`, database, credential, local-agent, or desktop-only files entered `dist/`.
7. Review the 620 MB artifact and model-pack changes before deployment.

`.vercelignore` controls source upload while `build.js` controls the generated output. Keep both exclusion lists aligned when adding a new sensitive or non-runtime path.

## Quality and Verification

### Automated Checks

| Check                         | Scope                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Root build validation         | Maintained `level1`, `level5`, and `level_custom` scope                                    |
| `scripts/production-check.js` | Required output files, forbidden paths, local references, and size warning                 |
| `scripts/security-check.js`   | Live-session identity rules, QR verifier storage, Electron flags, and scanning configuration |
| CodeQL                        | Maintained JavaScript/TypeScript and Python source                                         |
| DevSkim                       | Security-pattern scanning                                                                  |
| Dependabot                    | Root npm, Traffic npm, and GitHub Actions updates                                          |

Generated `dist/`, model packs, local agent directories, vendored libraries, and desktop output are excluded from source scanning. Fix maintained source rather than suppressing generated copies.

CodeQL is configured through the repository's code-scanning settings and reads
`.github/codeql/codeql-config.yml` for those exclusions. Do not add a second
CodeQL workflow file: the repository already has a default analysis, and two
analyses uploading the same language category for one ref make the analyze step
fail. Disable the unused Go, Java/Kotlin, and C/C++ languages in the code-scanning
settings, since the application has no source in those languages.

### Manual Verification

There is no maintained root browser-test gate. For HTML or script-load changes:

1. Compare blocking and `defer` tags in the affected page.
2. Run `node --check` on changed scripts.
3. Use `node serve.js` and open both `Traffic/Driving.html` and `Traffic/Academy.html`.
4. Run the scoped level validator.
5. Use the unscoped validator to inspect the broader backlog; it is expected to report legacy target failures outside the maintained build scope.

### Maintainer Notes

- Keep the 54 numbered Traffic levels and the custom/free-roam entries loadable.
- `Traffic/src/` is not the active browser entrypoint; do not infer runtime wiring from its presence.
- Traffic task types and validator target tables must be reviewed together when adding objectives.
- School/crossing fields (`schoolX`, `schoolZ`, `zebraZ`, `flasherZ`) are authoritative for current task consumers, but legacy and specialized renderers still contain fallback geometry.
- Run saves are level-scoped (`traffic_run_<levelId>`) and expire after 30 minutes; shared browser profiles should not be treated as isolated run identities.
- Completion currently saves wallet state before writing `S.comp`; verify persistence order when changing the completion flow so exiting through the reward screen cannot lose the completion record.
- Dense leaderboard rows and podium placement are separate code paths; test tied scores explicitly before treating podium colors as rank-correct.
- The full level report, `npm run lint`, root `npm run typecheck`, and root Playwright scripts currently describe known repository gaps rather than green release checks.

## Security

Read the full [Security Policy](SECURITY.md) before reporting a vulnerability. Use GitHub Private Vulnerability Reporting; do not publish credentials, tokens, database rows, personal data, or exploit details.

The production security boundary is built around these controls:

- Filtered Vercel output with environment files, databases, local state, and selected binaries excluded.
- Vercel security headers and cache rules from `vercel.json`.
- The intended identity boundary is the live Supabase session for signed-in users; local profiles support offline setup only. Treat any local-profile fallback in signed-in UI or leaderboard code as a bug.
- Salted PBKDF2 verifiers for QR passcodes; plaintext passwords must not be stored.
- Electron `contextIsolation`, disabled Node integration, sandboxing, web security, and disabled insecure-content execution.
- Supabase RLS and security-definer function review for privileged data paths.
- GitHub code scanning, DevSkim, Defender for DevOps, dependency audits, and the repository security regression check.

Never commit Supabase service-role keys, access tokens, passwords, private database exports, or local environment files.

## Contributing

1. Read [`AGENTS.md`](AGENTS.md) before changing runtime code.
2. Make the smallest change that solves the problem; preserve existing project boundaries.
3. Keep user-facing text title-cased and mobile layouts usable at 360px.
4. Prefer `transform`/`opacity` motion, cap device pixel ratio, and lazy-load below-fold assets.
5. Preserve live-session identity and Google-account profile photos; never substitute a stale local account.
6. Keep Mumbai context, law-based learning, autosave, and a useful 30-second play loop intact.
7. Run the focused verification commands relevant to the change.
8. Rebuild root `dist/` when changing files that feed the Vercel artifact; never edit generated output by hand.
9. Do not add secrets, local databases, dependency trees, or large unreviewed model packs.

## PWA and Android APK

- **Web PWA:** Open the [production studio](https://advancedlogiclabs.dpdns.org/) in a supported browser and choose **Install App**.
- **Android APK:** [Download `COL.apk`](https://advancedlogiclabs.dpdns.org/COL.apk).
- PWA metadata lives in `manifest.json`; offline behavior lives in `sw.js`; APK update metadata lives in `version.json`.

## Team

Class Of Learners is built by students in Mumbai:

- **Neel Badri** — Lead developer and logic engine
- **Ansh Patil** — Co-developer and quality assurance
- **Aarush Vangari** — UI/UX design and physics engine
- **Yashraj Jadhav** — QA, UI/UX, and product ideation
- **Aarayaman Jadhav** — 3D systems and geospatial data
- **Akshara Bangar** — Content research and interface polish

## License

This project is licensed under the [MIT License](LICENSE).

© 2026 **Class Of Learners**.
