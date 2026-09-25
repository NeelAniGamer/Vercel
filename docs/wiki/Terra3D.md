# Terra3D &mdash; Interactive 3D World Atlas

> A standalone 3D globe visualization and geospatial knowledge engine embedded with country data, boundaries, and demographics.

---

## Overview

Terra3D allows users to interact with a realistic 3D Earth model in real-time. Selecting any nation displays comprehensive geographic, economic, and demographic profiles.

---

## Technology Stack

- **3D Engine**: Three.js (^0.170.0)
- **Bundler**: Vite (^6.0.0)
- **Desktop Packaging**: Python + PyInstaller (`Terra3D.exe`)
- **Geodata**: Custom embedded GeoJSON dataset (`countryData.js`, 426 KB)

---

## Key Files

| File | Purpose |
|---|---|
| `Terra3D/main.js` | Three.js globe rendering, atmosphere shader, mouse raycasting |
| `Terra3D/countryData.js` | Country boundaries, capital cities, populations, GDP, and flags |
| `Terra3D/index.html` | Web application shell and HUD UI |
| `Terra3D/style.css` | Information card styles, animations, and responsive layouts |
| `Terra3D/app.py` | Python desktop launcher script |
| `Terra3D/Terra3D.exe` | Precompiled standalone executable for Windows |

---

## Development Notes

- Terra3D is standalone and intentionally uncoupled from the root lockfile. Always use `npm install` rather than `npm ci` when working within `Terra3D/`.
- Its Vite build writes to `Terra3D/dist` (desktop build target). Root Vercel deployments do not build Terra3D; they serve the pre-built web assets.
