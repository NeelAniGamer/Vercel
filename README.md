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
  <strong>Engineering the interactive web — featuring 3D physics engines, live driving simulations, space telemetry, and native web tools. Built by student developers in Mumbai.</strong>
</p>

---

## 🌟 Overview

**Class Of Learners** is a multi-project digital engineering studio hosting 25+ interactive web applications, tools, and 3D simulations. The site is built with a zero-build static architecture for lightning-fast delivery on Vercel, paired with an esbuild TypeScript pipeline for advanced simulator modules and an installable Android APK / PWA ecosystem.

| Aspect | Details |
|---|---|
| **Live Production Domain** | [`https://advancedlogiclabs.dpdns.org/`](https://advancedlogiclabs.dpdns.org/) |
| **Vercel Mirror** | [`https://classoflearners.vercel.app/`](https://classoflearners.vercel.app/) |
| **Primary Architecture** | Static HTML5 + Vanilla JS (Zero-build runtime, auto-deployed on push) |
| **React / TS Bundle** | `npm run build` → esbuild → `dist/Traffic/simulator-bundle.js` |
| **Auth Engine** | Dual auth: Supabase OAuth & Email (`col-auth.js`) + Legacy QR auth |
| **3D Rendering** | Three.js r128 / 0.185 + WebGL procedural backgrounds (`col-3d.js`) |
| **Service Worker** | `sw.js` cache-first architecture (`col-cache-v6`) |
| **Mobile App (APK)** | Self-hosted Android APK v1.6 (Build 7) at `/COL.apk` |
| **Design System** | Dark obsidian design tokens & typography in `col-ui.css` |

---

## 👥 The Core Team

Six students in Mumbai architecting high-performance web software:

* **Neel Badri** — *Lead Developer & Logic Engine* (System Architecture, Python, C++, Algorithmic Efficiency)
* **Ansh Patil** — *Co-Developer & Quality Assurance* (Edge-case testing, User Flows, QA Engine)
* **Aarush Vangari** — *UI/UX Design & Physics Engine* (3D Telemetry, Mathematical Visualizations, Aesthetic Design)
* **Yashraj Jadhav** — *QA Tester, UI/UX Designer & Idea Developer* (Experience Refinement, Concept Stress-Testing)
* **Aarayaman Jadhav** — *3D Systems & Geospatial Data* (WebGL rendering, Terra3D Geospatial Pipeline)
* **Akshara Bangar** — *Content Research & Interface Polish* (Information Architecture, Curriculum Research, Copy)

---

## 🚀 Key Projects & Live Engines

| Project | URL Route | Description | Tech Stack |
|---|---|---|---|
| **Mumbai Traffic Hero 3D** | `/Traffic/Driving` | 3D driving simulator on Mumbai streets with vehicle HUD, collision physics & traffic AI | Three.js, WebGL, Web Audio |
| **Mumbai Traffic Academy** | `/Traffic/Academy` | Interactive road safety course modules with level telemetry & driving licenses | Vanilla JS, Canvas2D, Three.js |
| **Solar System 3D Engine** | `/solar` | Real-time orbital mechanics, planetary gravity physics & space telemetry | Three.js r128, WebGL |
| **Advanced Typing Instructor (ATI)** | `/ati` | Pro typing instructor with real-time velocity waves and keystroke telemetry | Vanilla JS, CSS Glassmorphism |
| **Gesture Control Vision** | `/gesture` | Webcam hand tracking and touchless browser navigation | MediaPipe / Computer Vision |
| **Terra3D Interactive Globe** | `/Terra3D/` | Geospatial 3D Earth visualization with country boundary layering | Three.js, GeoJSON Data Pipeline |
| **QR Matrix Studio** | `/qr` & `/qr-editor` | Custom QR matrix generator with color grading and visual styling | QRCode.js, Canvas2D |
| **RPG Game Engine** | `/rpg` | Tilemap renderer, procedural collision maps, and sprite animation engine | HTML5 Canvas, 2D Game Loop |
| **CBSE School Foundation** | `/school` | Institutional showcase for CBSE Bhavani Shankar School | HTML5, 3D Mesh Background |
| **Sneh Asha Initiative** | `/sneh-asha` | Student-led non-profit social initiative and community outreach | Responsive CSS Grid, Glass UI |
| **Downloads Hub** | `/download` | Unified APK distribution center and desktop companion installers | PWA Manifest, Android Package |

---

## 🌌 3D Procedural Background Engine (`col-3d.js`)

The studio includes a high-performance procedural Three.js background layer featuring:
1. **Dynamic Core Cage:** Glowing icosahedron core surrounded by an opposing-spin golden wireframe cage.
2. **Holographic Connecting Beams:** Real-time energy line segments connecting the core to all 6 planetary nodes.
3. **Multi-Layer Parallax Starfield:** 3-layer depth with background nebula dust, mid-range twinkling stars, and foreground energy particles.
4. **Kinetic Mouse Inertia:** Smooth momentum damping (`dragVelX *= 0.93`) on click-and-drag.
5. **Auto CDN Fallback:** Automatic Three.js injection and responsive mobile skip optimization.

---

## 📁 Project Architecture & File System

```
Vercel/
├── *.html                     # 25+ Production HTML5 pages (cleanUrls enabled)
│   ├── home.html              # Studio Landing Hub & 3D Orrery
│   ├── about.html             # Team Story & Constellation of Minds
│   ├── school.html            # CBSE Bhavani Shankar School Foundation
│   ├── sneh-asha.html         # Sneh Asha Non-Profit Initiative
│   ├── ati.html / ati-demo.html # Advanced Typing Instructor & Telemetry
│   ├── solar.html             # Solar System 3D Engine & Space Physics
│   ├── gesture.html           # Gesture Control Vision Engine
│   ├── rpg.html               # 2D RPG Engine & Tilemap World
│   ├── qr.html / qr-editor.html # QR Matrix Studio & Visual Customizer
│   ├── download.html          # Unified APK & App Distribution Hub
│   ├── CastFlow.html          # CastFlow Web Application
│   ├── Career.html            # Career Pathways Interactive Guide
│   ├── Database_Logic.html    # Database Architecture & Logic Specs
│   ├── engine.html            # CoL Modular Engine Explorer
│   ├── dashboard.html         # Student & Learner Analytics Hub
│   ├── verify.html            # Certificate & Badge Verification
│   ├── feedback.html          # User Feedback & Suggestions Portal
│   ├── admin.html             # Admin Route Status Controller
│   ├── privacy.html / terms.html # Legal & Terms of Service
│   └── sitemap.html           # Visual HTML Sitemap
├── col-*.js / col-*.css       # Core Class Of Learners Engine Layer
│   ├── col-router.js          # Global router (config.json fetch, 503/404 handling)
│   ├── col-ui.js              # Shared UI (navigation, theme switcher, APK updater)
│   ├── col-ui.css             # Design tokens, CSS variables & typography
│   ├── col-mobile.css         # Mobile responsive optimization tokens
│   ├── col-auth.js            # Supabase Google OAuth + Email authentication
│   ├── col-3d.js              # Three.js procedural backgrounds & drag physics
│   └── col-achievements.js    # Student achievement & badge telemetry
├── col-3d/                    # Modular 3D Scene Architecture
│   ├── core/                  # Engine loops, camera controllers & renderers
│   ├── loaders/               # Asset loaders & CDN fallbacks
│   ├── scenes/                # Scene implementations (StudioOrrery, Constellation, etc.)
│   └── shared/                # Shared shaders, lighting rigs & material palettes
├── Traffic/                   # Mumbai Traffic Hero 3D Driving Sub-App
│   ├── Driving.html           # Main 3D Driving Simulator gameplay
│   ├── Academy.html           # Interactive Road Safety & Learning Hub
│   ├── TrafficDashboard.html  # Leaderboards, analytics & player telemetry
│   ├── TrafficSetup.html      # Vehicle customizer & control mapping
│   ├── game_core.js           # 3D world physics loop, vehicle controller, traffic AI
│   ├── pools.js               # Zero-GC Three.js object pooling system
│   ├── road-graph.js          # A* road network topology & building slots
│   ├── render_core.js         # WebGL renderer, DRS, LOD & bloom post-processing
│   ├── safezone-ui.js         # Mobile safe-area HUD & touch controls
│   ├── levels/                # 50+ level configurations & scenario scripts
│   ├── Models/ & textures/    # 3D GLB assets, character skins & road textures
│   └── src/                   # Modern Vite + TypeScript + Rapier + Electron port
├── react-src/                 # React 19 / TypeScript Source Layer
│   ├── GamePage.tsx           # React bundle entrypoint → dist/Traffic/simulator-bundle.js
│   ├── DrivingSimulator.tsx   # Top-level simulator React component
│   └── engine/ hud/ state/    # Modular React components & state stores
├── Terra3D/                   # Interactive 3D Geospatial Earth Globe
├── cast/                      # CastFlow PWA Sub-Application
├── ads-screenshots/           # 26 High-Res 16:9, 9:16 & 1:1 Ad Creative Assets
├── ads-video/                 # Official 1080p 60fps MP4 Video Trailer
├── config.json                # Supabase credentials & page status routing
├── vercel.json                # cleanUrls, rewrites, and redirect rules
├── sitemap.xml                # SEO XML Sitemap with verified timestamps
├── robots.txt                 # Search engine crawler permissions
├── manifest.json              # PWA Manifest ("Class Of Learners")
├── sw.js                      # Service Worker (col-cache-v6 cache-first)
├── COL.apk                    # Official compiled Android APK (Build 7, v1.6)
├── version.json               # APK version telemetry for in-app updates
├── cast-version.json          # CastFlow version telemetry
├── build.js                   # esbuild bundler for react-src/
└── dist/                      # Committed distribution build (full site mirror)
```

---

## 🎨 Design Tokens (`col-ui.css`)

```css
:root {
  --void: #070a14;        /* Deep space background */
  --void2: #0c1224;       /* Secondary background */
  --panel: #111827;       /* Card background */
  --line: rgba(255,255,255,0.08);   /* Subtle border */
  --lineb: rgba(255,255,255,0.16);  /* Prominent border */
  --ink: #e8e3d8;         /* Primary text */
  --dim: #8891aa;         /* Secondary text */
  --signal: #f2b84b;      /* Accent Gold */
  --ion: #5ed4f5;         /* Accent Cyan */
  --teal: #00f0cc;        /* Accent Teal */
  --plasma: #b89bff;      /* Accent Violet */
  --em: #34d399;          /* Accent Emerald */
}
```

---

## ⚙️ Development & Build

### Running Locally
```bash
# Serve static site on any local server
npx serve .
# Or run with Node
node -e "const http=require('http'),fs=require('fs');http.createServer((q,s)=>fs.createReadStream('.'+q.url).pipe(s)).listen(3000);"
```

### Building React Simulator Bundle
```bash
# Rebuilds react-src/GamePage.tsx into dist/Traffic/simulator-bundle.js
npm run build
```

### Traffic Vite/TypeScript Port
```bash
cd Traffic
npm run dev              # Vite dev server on :5173
npm run build:web        # TypeScript check & production web build
npm run electron:portable# Electron portable build
```

---

## 📱 PWA & Android APK Installation

* **Web PWA:** Open [`https://advancedlogiclabs.dpdns.org/`](https://advancedlogiclabs.dpdns.org/) on Chrome/Safari and click **"Install App"**.
* **Direct Android APK:** Download directly from [`https://advancedlogiclabs.dpdns.org/COL.apk`](https://advancedlogiclabs.dpdns.org/COL.apk).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 **Class Of Learners** — Neel Badri, Ansh Patil, Aarush Vangari, Yashraj Jadhav, Aarayaman Jadhav & Akshara Bangar.
