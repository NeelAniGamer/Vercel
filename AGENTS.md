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
- **3D Graphics**: Three.js (r128, loaded from CDN)
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
| Google Authenticator (`col-auth.js` / Supabase auth integration) | **DO NOT TOUCH UNTIL EXPLICITLY TOLD.** Any AI modifications to the global authentication system without human approval could cause site-wide lockouts or security vulnerabilities. |

---

## Files You CAN Touch Freely

| Category | Files |
|----------|-------|
| **Pages** | `home.html`, `about.html`, `school.html`, `privacy.html`, `terms.html`, `feedback.html`, `download.html`, `sneh-asha.html`, `Career.html`, `Database_Logic.html` |
| **Apps** | `solar.html`, `ati.html`, `ati-demo.html`, `gesture.html`, `rpg.html`, `Traffic/Academy.html` |
| **QR System** | `qr.html`, `qr-editor.html` |
| **Shared UI** | `col-ui.js`, `col-ui.css` |
| **Assets** | Any `.webp`, `.png`, `.glb` files |
| **Config** | `vercel.json`, `robots.txt`, `sitemap.xml` |

---

## Architecture Rules

### 1. Shared Components (col-ui / col-auth / col-router)
Every HTML page loads these three shared scripts:
```html
<script defer src="col-router.js"></script>
<link rel="stylesheet" href="col-ui.css">
<script defer src="col-ui.js"></script>
<script defer src="col-auth.js"></script>
```
- **DO NOT** include `col-auth.js` more than once per page (this caused the "replace child item" bug)
- **DO NOT** include `col-router.js` more than once per page
- Always include them in this order: `col-router.js` → `col-ui.css` → `col-ui.js` → `col-auth.js`

### 2. Inline Scripts Pattern
Each page has its own inline `<script>` block at the bottom of `<body>` for page-specific logic. The pattern is:
1. Shared scripts in `<head>` (deferred)
2. Page-specific inline CSS in `<style>` within `<head>`
3. HTML content in `<body>`
4. Page-specific inline `<script>` at end of `<body>`

### 3. Auth System
- **col-auth.js** provides the global auth modal (`colAuthModal`) and handles Google OAuth via Supabase
- Pages like `qr.html` and `qr-editor.html` have their **own** legacy auth system (`loginMo` modal, `openLogin()`, `gSignIn()`)
- Do NOT merge these systems without understanding both
- The QR pages use Google OAuth directly (access token in URL hash), while col-auth.js uses Supabase auth

### 4. Theme System
- Dark mode is default. Light mode uses `body.lm` class
- Theme state is stored in `localStorage` under key `'theme'`
- Both `col-ui.js` and inline scripts handle theme initialization
- QR pages use a separate system with `body.light` class and `body.dark-mode` class

### 5. Navigation
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

1. **Duplicate script loading**: Several pages historically loaded `col-auth.js` twice, causing "replace child item" errors. Always verify each page loads each shared script exactly once.

2. **Two auth systems**: The site has TWO separate auth implementations — `col-auth.js` (Supabase-based, used by most pages) and inline Google OAuth (used by QR pages). Don't confuse them.

3. **QR pages have their own design system**: `qr.html` and `qr-editor.html` use a different CSS variable system (`--pri`, `--bg`, etc.) and don't fully share the CoL design tokens.

4. **No build system**: All CSS and JS is inline or loaded as single files. No minification, bundling, or transpilation.

5. **config.json is fetched at runtime**: Both `col-router.js` and `col-auth.js` fetch `config.json` with a cache-busting timestamp. The Supabase keys are in this file — protect it.

6. **3D backgrounds are heavy**: Each page with Three.js (home, about, school) renders full WebGL scenes. These are GPU-intensive and should use `powerPreference: 'high-performance'` and limit pixel ratio to 2.

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

*Last updated: June 19, 2026*
*Project maintained by: Class Of Learners Studio*

---

## Complete Project Description

**Class Of Learners (CoL)** is a full-scale, interactive educational platform and application suite built from scratch by Neel Badri, Ansh Patil, and Aarush Vangari from Mumbai, India. The project features custom-built engines and interactive modules designed to make computer science and physics concepts accessible, engaging, and technologically advanced. It bypasses conventional frameworks, relying heavily on native HTML, CSS, JavaScript, WebGL (Three.js), and Python to deliver high-performance tools such as:
1. **Solar System Engine**: A 64-bit level interactive physics engine allowing users to explore real-time orbital mechanics.
2. **Advanced Typing Instructor (ATI)**: A sophisticated learning environment for mastering syntax in Python, C++, and JS with dynamic heatmaps.
3. **Gesture Control**: An integration of machine vision for hands-free computer interaction.
4. **QR Editor**: A customizable generator bridging digital routing with physical scannables.
5. **RPG Engine**: A foundational role-playing environment demonstrating canvas game logic.

The entire ecosystem is globally authenticated via Supabase, beautifully stylized with modern UI/UX principles, and strictly maintained to ensure rapid performance and seamless cross-device compatibility.
