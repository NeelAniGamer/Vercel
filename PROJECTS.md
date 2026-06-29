# Class Of Learners — Projects

> All projects built by Class Of Learners Studio, hosted at `advancedlogiclabs.dpdns.org`.

---

## Projects Overview

| #   | Project                       | File                   | Description                                                                                                                                    |
| --- | ----------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Traffic Driving Simulator** | `Traffic/Driving.html` | 3D browser-based driving game with Indian city environments, 20+ levels, vehicle physics, pedestrian mode, traffic AI, and course certificates |
| 2   | **Solar System Explorer**     | `solar.html`           | Interactive 3D solar system visualization with planet data and orbital mechanics                                                               |
| 3   | **ATI (AI Text Interpreter)** | `ati.html`             | AI-powered text analysis and interpretation tool                                                                                               |
| 4   | **ATI Demo**                  | `ati-demo.html`        | Demo/showcase version of the ATI tool                                                                                                          |
| 5   | **Gesture Control**           | `gesture.html`         | Hand gesture recognition and control interface                                                                                                 |
| 6   | **RPG Game**                  | `rpg.html`             | Browser-based role-playing game                                                                                                                |
| 7   | **Engine Simulator**          | `engine.html`          | Engine/mechanical simulation                                                                                                                   |
| 8   | **QR Code Generator**         | `qr.html`              | QR code generation tool with styling options                                                                                                   |
| 9   | **QR Code Editor**            | `qr-editor.html`       | Advanced QR code editor with customization                                                                                                     |

---

## Pages

| Page             | File                  | Purpose                              |
| ---------------- | --------------------- | ------------------------------------ |
| Home             | `home.html`           | Main landing page with 3D background |
| About            | `about.html`          | Team info and project showcase       |
| School           | `school.html`         | School/education page                |
| Admin            | `admin.html`          | Admin panel for page management      |
| Privacy Policy   | `privacy.html`        | Privacy policy                       |
| Terms of Service | `terms.html`          | Terms and conditions                 |
| Feedback         | `feedback.html`       | User feedback form                   |
| Download         | `download.html`       | APK download page                    |
| Sneh Asha        | `sneh-asha.html`      | Sneh Asha initiative page            |
| Career           | `Career.html`         | Career opportunities                 |
| Sitemap          | `sitemap.html`        | Site navigation map                  |
| Database Logic   | `Database_Logic.html` | Database documentation               |

---

## Traffic Simulator — Deep Dive

The flagship project. A full 3D driving simulator with:

- **20+ levels** — from basic driving to open-world Mumbai exploration
- **Vehicle system** — cars, buses, auto-rickshaws, Lamborghini
- **Pedestrian mode** — walk through the city, enter/exit vehicles
- **Traffic AI** — NPC vehicles follow routes, obey traffic lights
- **Course system** — structured driving lessons with certificates
- **Kenney models** — 10 asset packs for buildings, roads, characters, vehicles
- **Mumbai theme** — Marine Drive, Colaba, Gateway of India landmarks

### Key Files

| File           | Lines    | Role                                |
| -------------- | -------- | ----------------------------------- |
| `game_core.js` | ~2400    | Core engine, physics, rendering, AI |
| `ui.js`        | ~1000    | HUD, menus, auth, traffic lights    |
| `start.js`     | ~380     | Asset loader, model preloading      |
| `levels/`      | 20 files | Level configurations                |

---

## Shared Infrastructure

### Design System (`col-*`)

- `col-router.js` — Global page router with status codes
- `col-ui.js` — Shared UI (nav, theme, APK updater)
- `col-ui.css` — CSS variables and typography
- `col-auth.js` — Supabase Google OAuth + email/password
- `col-3d.js` — Three.js procedural backgrounds (desktop only)

### Hosting

- **Platform:** Vercel (static site)
- **Domain:** `advancedlogiclabs.dpdns.org`
- **PWA:** `manifest.json` + `sw.js` for Android "Add to Home Screen"
- **APK:** In-app updater checks `version.json`

---

## Tech Stack Summary

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Frontend    | Static HTML/CSS/JS (no build system)               |
| 3D Graphics | Three.js r128 (CDN)                                |
| Auth        | Supabase (Google OAuth + email/password)           |
| Hosting     | Vercel                                             |
| Fonts       | Google Fonts (Instrument Serif, Inter, Space Mono) |
| QR Library  | qr-code-styling v1.6.0-rc.1                        |

---

_Last updated: June 28, 2026_
