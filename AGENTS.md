# Class Of Learners — Project Rules

> This file defines rules for AI agents and human contributors working on this project.
> Read this file before making any changes.

---

## Project Overview

**Class Of Learners (CoL)** is a student-built portfolio website hosted on Vercel at `advancedlogiclabs.dpdns.org`. It showcases 5 interactive projects built by three students from Mumbai — Neel Badri, Ansh Patil, and Aarush Vangari — under the mentorship of Sanjana Kasbe.

### Tech Stack
- **Frontend**: Static HTML pages with inline CSS/JS (no build system, no framework)
- **Hosting**: Vercel (static site)
- **Auth**: Supabase (Google OAuth + email/password)
- **3D Graphics**: Three.js (r128, loaded from CDN) via `col-3d.js`
- **QR Editor**: qr-code-styling library (v1.6.0-rc.1)
- **Fonts**: Google Fonts (Instrument Serif, Inter, Space Mono)
- **Domain**: `advancedlogiclabs.dpdns.org`

---

## ⛔ DO NOT TOUCH (Unless Explicitly Told)

These files are critical and should not be modified without explicit user approval:

| File | Reason |
|------|--------|
| `config.json` | Contains Supabase auth credentials and page routing config. Changes can break auth site-wide |
| `col-auth.js` | Global authentication system. Handles Google OAuth, session management, and modal injection. Breaking this locks users out |
| `supabase.js` | Minified Supabase SDK (v2.108.1). Do NOT edit — replace only via CDN update if needed |
| `col-router.js` | Global router that checks page status codes and renders error screens. Changes affect ALL pages |
| Google OAuth Client ID | Hardcoded in multiple HTML files (`500448449044-...`). Changing this breaks Google sign-in across the entire site |

---

## Files You CAN Touch Freely

| Category | Files |
|----------|-------|
| **Pages** | `home.html`, `about.html`, `school.html`, `privacy.html`, `terms.html`, `feedback.html`, `download.html`, `sneh-asha.html`, `admin.html` |
| **Apps** | `solar.html`, `ati.html`, `ati-demo.html`, `gesture.html`, `rpg.html`, `engine.html`, `Traffic/Academy.html`, `Traffic/Driving.html`, `Traffic/TrafficDashboard.html`, `Traffic/TrafficSetup.html` |
| **QR System** | `qr.html`, `qr-editor.html` |
| **Shared UI** | `col-ui.js`, `col-ui.css`, `col-3d.js`, `col-admin.js` |
| **Assets** | Any `.webp`, `.png`, `.glb` files |
| **Config** | `vercel.json`, `robots.txt`, `sitemap.xml` |
| **Traffic/** | All files under `Traffic/` except its own `config.json` (has Supabase creds) |

---

## Architecture Rules

### 1. Shared Components (col-router / col-ui / col-auth / col-3d)
Every HTML page loads these shared scripts in `<head>`:
```html
<script defer src="col-router.js"></script>
<link rel="stylesheet" href="col-ui.css">
<script defer src="col-ui.js"></script>
<script defer src="col-auth.js"></script>
```
- **DO NOT** include any shared script more than once per page
- Always include them in this order: `col-router.js` → `col-ui.css` → `col-ui.js` → `col-auth.js`
- `col-3d.js` is loaded separately by pages that need Three.js procedural backgrounds (home, about, school). It is desktop-only and skips on mobile/touch devices.

### 2. Inline Scripts Pattern
Each page has its own inline `<script>` block at the bottom of `<body>` for page-specific logic. The pattern is:
1. Shared scripts in `<head>` (deferred)
2. Page-specific inline CSS in `<style>` within `<head>`
3. HTML content in `<body>`
4. Page-specific inline `<script>` at end of `<body>`

### 3. Dual Config Override System
Two layers control page status (200/503/404/500):
1. **`config.json`** — fetched at runtime by `col-router.js` with cache-busting timestamp. Maps page slugs to status codes. This is the global source of truth.
2. **Inline admin overrides** — HTML pages have inline `<script>` blocks that read `localStorage.col_admin_config` and can override page status locally for the admin.

### 4. Auth System
- **col-auth.js** provides the global auth modal (`colAuthModal`) and handles Google OAuth via Supabase
- Pages like `qr.html` and `qr-editor.html` have their **own** legacy auth system (`loginMo` modal, `openLogin()`, `gSignIn()`)
- Do NOT merge these systems without understanding both
- The QR pages use Google OAuth directly (access token in URL hash), while col-auth.js uses Supabase auth

### 5. Theme System
- Dark mode is default. Light mode uses `body.lm` class
- Theme state is stored in `localStorage` under key `'theme'`
- Both `col-ui.js` and inline scripts handle theme initialization
- QR pages use a separate system with `body.light` class and `body.dark-mode` class

### 6. Navigation
All public-facing pages should include:
- **Top nav bar** with brand logo, nav links, dropdown for projects, theme toggle, and login button
- **Footer** with CoL branding, privacy/terms/feedback links, and copyright

---

## Design Rules

### CSS Variables (CoL Design System)
```css
--void: #070A14        (background)
--void2: #0C1224       (secondary bg)
--panel: #111827       (card bg)
--line: rgba(255,255,255,.08)   (borders)
--lineb: rgba(255,255,255,.16)  (strong borders)
--ink: #E8E3D8         (primary text)
--dim: #8891AA         (muted text)
--signal: #F2B84B      (accent gold)
--ion: #5ED4F5         (accent blue)
--teal: #00F0CC        (accent teal)
--plasma: #B89BFF      (accent purple)
--em: #34D399          (accent green)
--serif: 'Instrument Serif'
--sans: 'Inter'
--mono: 'Space Mono'
```

### Typography
- Hero headings: `Instrument Serif` (italic accent color for emphasis)
- Body text: `Inter`
- Monospace labels/tags: `Space Mono`
- Section labels: uppercase, letter-spaced, 0.7rem

### Animation
- Entrance: `opacity + translateY` with `cubic-bezier(.16,1,.3,1)` easing
- Hover: `translateY(-Xpx)` + `box-shadow` with colored glow
- Card reveals: `IntersectionObserver` with staggered delays
- 3D tilt on hover: `perspective(900px) rotateX/rotateY` (disabled on mobile)

---

## SEO Rules

- Every page MUST have a `<title>` tag
- Every page MUST have a `<meta name="description">` tag
- Every page SHOULD have a `<link rel="canonical">` tag
- Include `<meta name="google-site-verification">` with content `bWaer2b60VA1y3RMV48HYGPv8vlMUcvlFGxY3e6SAqU`
- Add `loading="lazy"` to all non-hero images
- Use semantic HTML where possible

---

## File Cleanup Rules

Before deleting any file:
1. Search ALL HTML files for references to it: `grep -r "filename" *.html`
2. Check if it's referenced in `config.json`, `vercel.json`, or any JS file
3. Check git history to understand its purpose
4. Never delete files in `Traffic - Major UI Change/` or `Traffic - Major Updates/` directories (historical archives)

---

## Known Issues & Gotchas

1. **`qr-editor.html` loads `col-router.js` twice** (line 16 and line 438). The `window._colRouterRunning` guard prevents double-execution, but loading it twice is wasteful. Should be fixed.

2. **Two auth systems**: The site has TWO separate auth implementations — `col-auth.js` (Supabase-based, used by most pages) and inline Google OAuth (used by QR pages). Don't confuse them.

3. **QR pages have their own design system**: `qr.html` and `qr-editor.html` use a different CSS variable system (`--pri`, `--bg`, etc.) and don't fully share the CoL design tokens.

4. **No build system**: All CSS and JS is inline or loaded as single files. No minification, bundling, or transpilation.

5. **config.json is fetched at runtime**: Both `col-router.js` and `col-auth.js` fetch `config.json` with a cache-busting timestamp. The Supabase keys are in this file — protect it.

6. **Traffic/ uses relative paths**: Traffic subdirectory pages reference shared scripts with `../` prefix (e.g., `../col-router.js`, `../col-ui.js`). The `Academy.html` page also patches `fetch()` to redirect `config.json` requests to `../config.json`.

7. **3D backgrounds are heavy**: Each page with Three.js (home, about, school) renders full WebGL scenes via `col-3d.js`. These are GPU-intensive and skip on mobile/touch devices.

8. **PWA support**: `manifest.json` enables "Add to Home Screen" on Android. Service worker is in `sw.js`.

9. **In-app APK updater**: `col-ui.js` checks `version.json` on load (currently v6 / 1.5). The `version.json` `updateEndpoint` should match the Vercel deployment URL for APK auto-updates.

---

## Contributing Workflow

1. **Read this file first** before making any changes
2. **Check which files you can touch** (see table above)
3. **Make minimal changes** — don't refactor unless asked
4. **Test on mobile** — the site must be responsive
5. **Preserve existing animations** — they were carefully crafted
6. **Don't add new dependencies** unless absolutely necessary (everything is CDN-loaded)
7. **Commit with clear messages** — follow the existing conventional commit style

---

*Last updated: June 28, 2026*
*Project maintained by: Class Of Learners Studio*
