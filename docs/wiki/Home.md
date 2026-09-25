# Class Of Learners Wiki

> **Interactive Simulation & Learning** &mdash; A student-built platform for immersive education through 3D simulations, typing games, touchless gesture control, and career guidance.

---

## 🏗️ What Is This Project?

**Class Of Learners** is an interactive web and desktop education platform hosted on Vercel. Built by students, its flagship feature is a **3D Traffic Driving Simulator** (Three.js) that teaches Indian road safety and traffic laws through interactive gameplay &mdash; featuring 56 levels, NPC traffic AI, pedestrian mode, certificate generation, and an academy curriculum.

### Additional Platform Modules:
- **Advanced Typing Instructor (ATI)** &mdash; Desktop typing tutor & competitive typing tournament game.
- **Terra3D** &mdash; Interactive 3D World Atlas & Country Knowledge Engine.
- **Perceptus / GestureUI** &mdash; Webcam-based touchless hand gesture desktop control.
- **CastFlow** &mdash; Phone-to-screen mirroring PWA utility.
- **Solar System Engine** &mdash; Interactive 3D planetary physics visualization.
- **FutureScape Career Guide** &mdash; Comprehensive student career and education discovery engine.

---

## 📚 Wiki Catalog

| Section | Page | Description |
|---|---|---|
| **Overview** | [[Home]] | Landing overview, tech stack, and module directory |
| **System** | [[Architecture]] | System architecture, component relationships, and data flow |
| **Setup** | [[Getting Started|Getting-Started]] | Local setup, installation, commands, and dev workflow |
| **Simulations** | [[Traffic Simulator|Traffic-Simulator]] | 3D Three.js game engine, 56 levels, AI traffic, and vehicles |
| **Simulations** | [[Terra3D]] | 3D interactive globe with country data and demographics |
| **Routing** | [[Pages And Routes|Pages-And-Routes]] | Complete inventory of 28+ HTML pages and Vercel routing rules |
| **Client Core** | [[Shared Infrastructure|Shared-Infrastructure]] | Global authentication, shared navigation UI, and runtime routing |
| **Security** | [[Authentication]] | Supabase auth flows, custom email templates, and session security |
| **DevOps** | [[Build And Deployment|Build-And-Deployment]] | `build.js` pipeline, deny-list filters, and Vercel production deployment |
| **Security** | [[Security]] | Content Security Policy, security audit scripts, and sensitive paths |
| **Guidelines** | [[Contributing]] | Development rules, Title Case enforcement, and attribution standards |

---

## 🔗 Quick Links

| Resource | Link |
|---|---|
| **Live Production Site** | [classoflearners.vercel.app](https://classoflearners.vercel.app) |
| **GitHub Repository** | [github.com/NeelAniGamer/Vercel](https://github.com/NeelAniGamer/Vercel) |
| **Traffic Free Roam** | [Driving.html](https://classoflearners.vercel.app/Traffic/Driving) |
| **Traffic Academy** | [Academy.html](https://classoflearners.vercel.app/Traffic/Academy) |

---

## ⚙️ Tech Stack

| Domain | Technology |
|---|---|
| **3D Rendering** | Three.js (r128 via CDN) |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3, React 19 (bundled via esbuild) |
| **Backend & Auth** | Supabase (Google OAuth2, Magic Link, OTP tokens) |
| **Hosting & Edge** | Vercel (static distribution from committed `dist/`) |
| **Asset Pipeline** | Kenney 3D GLB/GLTF models |
| **Desktop Packaging** | Electron (Traffic), PyInstaller (ATI, Terra3D) |
| **CI/CD & Security** | GitHub Actions, Microsoft Defender, DevSkim, CodeQL, Dependabot |
