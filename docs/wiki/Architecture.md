# System Architecture

## Overview

Class Of Learners is architected as a **high-performance static platform** served via Vercel's global edge network. The build pipeline compiles and validates source assets into a committed `dist/` directory, eliminating runtime server overhead and ensuring maximum security.

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel CDN Edge                       │
│                  (serves dist/)                          │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌──────────┐   ┌──────────────┐   ┌──────────┐
  │ Core Web │   │   Traffic/   │   │ Terra3D/ │
  │  Portal  │   │  3D Sim      │   │  Globe   │
  │ 28 pages │   │  56 levels   │   │  Atlas   │
  └─────┬────┘   └──────┬───────┘   └──────────┘
        │                │
        ▼                ▼
  ┌──────────────────────────────┐
  │   Shared Client Core         │
  │  col-auth.js (Supabase)      │
  │  col-ui.js   (Nav, Theme)    │
  │  col-router.js (Routing)     │
  │  col-ui.css  (Global CSS)    │
  └──────────────┬───────────────┘
                 │
                 ▼
  ┌──────────────────────────────┐
  │      Supabase Backend        │
  │  Auth, Database, Storage     │
  └──────────────────────────────┘
```

---

## Architectural Principles

### 1. Static Distribution via `dist/`
The site is entirely static HTML/JS with zero Node.js server dependencies in production. All browser requests are resolved from the committed `dist/` tree, providing instantaneous response times and resilience.

### 2. Deny-List Build Filtration
Instead of manually configuring allow-lists for new pages, `build.js` applies an automated deny-list:
- New public HTML pages and assets are included automatically.
- Development tooling, secrets (`.env*`), database artifacts (`*.sqlite`), agent configs, and unreferenced 3D models are excluded from `dist/`.

### 3. Single-Source Shared Core
Every page in the project shares the same identity and navigation system:
- **`col-auth.js`**: Controls session state, Google OAuth modal, cloud saves, and badge sync.
- **`col-ui.js`**: Injects unified navigation, mobile drawer, cyberpunk theme toggles, and performance monitoring.
- **`col-router.js`**: Evaluates remote configuration at boot time to enable dynamic maintenance modes or announcement banners.

### 4. Traffic Sub-Project Isolation
The `Traffic/` sub-application maintains its own `package.json` and lockfile. While it can be developed independently using Vite or packaged for desktop via Electron, in production it seamlessly integrates into the root site by referencing the shared client core via `../`.
