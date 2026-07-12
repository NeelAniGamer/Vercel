# Traffic Driving Simulator — Agent Rules

> Read this file before making any changes to the `Traffic/` folder.

---

## Project Overview

**Traffic** is a 3D browser-based driving/pedestrian simulator built with Three.js. Players navigate Indian city environments (Mumbai-themed), complete driving courses, earn certificates, and explore open-world maps with traffic, NPCs, and pedestrians.

### Tech Stack

- **3D Engine:** Three.js (r128, CDN-loaded)
- **Models:** Kenney asset packs (GLB/GLTF) — cars, buildings, roads, characters
- **Auth:** Supabase — root `col-auth.js` loaded via `../` prefix, plus Traffic-specific handlers in `course.js` and `ui.js`
- **Levels:** 20 procedural levels defined in `levels/level*.js`
- **Hosting:** Vercel (static site, served from `Traffic/` subdirectory)

---

## Architecture

### File Structure

```
Traffic/
├── Driving.html          # Main game entry point
├── Academy.html          # Course/lesson system
├── TrafficSetup.html     # Vehicle selection & setup
├── TrafficDashboard.html # User dashboard & stats
├── config.json           # Supabase auth credentials (DO NOT TOUCH)
├── game_core.js          # Core game engine (renderer, physics, AI, HUD)
├── ui.js                 # UI overlay, menus, HUD, traffic lights
├── start.js              # Asset loader, model preloading, scene init
├── env.js                # Environment textures & scene setup
├── vehicles.js           # Vehicle building system
├── auto.js / bus.js / lambo.js  # Specific vehicle models
├── course.js             # Course/lesson logic
├── cert_assets.js        # Certificate rendering
├── levels/               # 20 level data files (level1.js - level20.js)
├── Models/               # Kenney GLB model packs
│   ├── kenney_car-kit/
│   ├── kenney_city-kit-industrial_1.0/
│   ├── kenney_city-kit-roads/
│   ├── kenney_city-kit-suburban_20/
│   ├── kenney_mini-characters/
│   └── ... (10 packs total)
└── Cyberpunk/            # Historical archive — DO NOT MODIFY
```

### Script Loading Order

`Driving.html` loads scripts in this order:

1. Three.js (CDN)
2. `start.js` — preloads all GLB models, builds loading screen
3. `env.js` — environment textures
4. `vehicles.js` — vehicle factory functions
5. `auto.js`, `bus.js`, `lambo.js` — specific vehicle builders
6. `game_core.js` — main game class (`Game` at `game_core.js:9`)
7. `ui.js` — UI/HUD overlay class (`TrafficUI`)
8. Level data (`levels/level1.js` through `levels/level20.js`)

---

## Core Systems

### Game Engine (`game_core.js`)

- **Renderer:** WebGL with ACES filmic tone mapping, PCF soft shadows
- **Post-processing:** UnrealBloomPass (subtle glow)
- **Physics:** Simple AABB collision detection against `this.world[]` and `this.obstacles[]`
- **AI:** NPC vehicles follow waypoints, pedestrians walk sidewalks, obey traffic lights
- **Camera:** First-person (pointer lock) or third-person chase cam

### Key Classes

- `TrafficGame` — main game loop, physics, rendering, input
- `TrafficUI` — HUD, menus, auth, traffic light display
- `_buildHuman(isPlayer)` — builds character model from preloaded GLB or procedural fallback
- `_buildVehicle(type, color)` — builds vehicle from preloaded GLB or procedural geometry

### Model System (`start.js`)

- All Kenney GLB models are preloaded at startup into `window.PRELOADED_MODELS`
- Models stored at **4.5x scale** (base game-world proportion)
- Instanced buildings clone models from `PRELOADED_MODELS` and set their own scale
- Character models (`char_m_a`, `char_f_a`, etc.) are cloned and scaled to 1.5x for players

---

## Known Gotchas

1. **Two config.json files** — Root `config.json` and `Traffic/config.json` both contain Supabase credentials. They are separate. Do not mix them up.
2. **Academy.html patches fetch()** — It redirects `config.json` requests to `../config.json` because it lives one directory deeper.
3. **Cyberpunk/ is an archive** — Old build files. Never modify anything inside.
4. **Model scale chain** — GLB loaded → stored at 4.5x → instanced buildings reset to 1x then apply their own `s` value. Character models replace scale directly.
5. **Road tiles are GLTF** — Road geometry comes from `road_straight` model, not procedural. Tiles are positioned at y=0.08 to sit above ground.
6. **Pedestrian mode** — When `vehMode === 'pedestrian'`, `isPedestrian = true` and the player controls a human character. In vehicle mode, the player starts as a pedestrian who can enter/exit a vehicle with F key.
7. **Building rotation** — Buildings rotate to face the road. Vertical road: ±PI/2. Horizontal road: PI or 0. Do NOT add extra rotation offsets.
8. **Shared scripts loaded with `../` prefix** — Traffic pages load `../col-router.js`, `../col-ui.js`, and `../col-auth.js` (root shared scripts). They also have their own Traffic-specific auth/UI handlers in `course.js` and `ui.js`.

---

## ⛔ DO NOT TOUCH

| File                  | Reason                                           |
| --------------------- | ------------------------------------------------ |
| `Traffic/config.json` | Supabase auth credentials — changes break login  |
| `Cyberpunk/*`         | Historical archive — no modifications            |
| `Models/*.glb`        | Binary assets — only replace via proper workflow |

---

## Files You CAN Modify Freely

| File                                         | What it controls                    |
| -------------------------------------------- | ----------------------------------- |
| `game_core.js`                               | Game engine, physics, AI, rendering |
| `ui.js`                                      | HUD, menus, traffic lights, auth UI |
| `start.js`                                   | Asset loading, model preload list   |
| `env.js`                                     | Environment textures                |
| `vehicles.js`                                | Vehicle building                    |
| `auto.js`, `bus.js`, `lambo.js`              | Specific vehicle models             |
| `course.js`, `cert_assets.js`                | Course/certificate system           |
| `levels/level*.js`                           | Level data and configuration        |
| `Academy.html`, `Driving.html`               | Page HTML                           |
| `TrafficSetup.html`, `TrafficDashboard.html` | Setup/dashboard pages               |

---

## Level Data Format

Each `levels/level*.js` exports a config object:

```js
const LEVEL_CONFIG = {
  name: "Level Name",
  type: "driving" | "pedestrian",
  roads: [{ type: 'v'|'h', x, z, x1, x2, z1, z2 }],
  route: [[x, z], ...],       // waypoints for NPC traffic
  spawn: { x, z, rot },       // player start position
  npcs: [{ type, color, route }],
  trafficLights: [{ pos, dir }],
  timeLimit: 120,
  isNight: false,
  hasRain: false,
  fog: 150,
  ground: 0x3a3a3a
};
```

---

## Design Tokens (Traffic-specific)

| Token         | Value      | Usage                          |
| ------------- | ---------- | ------------------------------ |
| Road color    | `0x3d3f45` | Asphalt road surface           |
| Sidewalk      | `0x8a8a8a` | Pavement/sidewalk              |
| Ground        | `0x4a4a4f` | Default urban ground           |
| Night fog     | `0x0a0a12` | Night mode background          |
| Player accent | `0x00ff00` | Player character emissive glow |
| NPC accent    | `0x0088ff` | NPC character emissive glow    |

---

## 🔴 Skill-First Rule (MANDATORY)

**Before making ANY code change to this project, ALWAYS:**

1. **Find a relevant skill** from the available skill library (loaded skills list)
2. **If no skill exists** → search the internet for best practices/patterns for the task, download or reference the knowledge, then proceed
3. **Apply the skill's guidance** when planning and implementing changes
4. **Plan before coding** — never jump into edits without understanding the domain

This prevents reinventing wheels, ensures industry-standard patterns, and avoids known pitfalls.

---

## Available Skills Reference

~580+ skills installed at `Traffic/.agents/skills/`. Load via the `skill` tool. Below are the most relevant categories for this project. Full inventory: `ls .agents/skills/`.

### 🎮 3D Game Development (HIGHEST RELEVANCE)

| Skill | When to use |
|-------|-------------|
| `3d-game-builder` | Generate and iteratively develop polished 3D browser games from natural language. Supports any genre, custom characters, creatures, environments, and complex game systems. |
| `3d-game-dev` | Rendering pipeline optimization, shader development, physics implementation, camera systems, and lighting strategies for 3D games. |
| `3d-games` | General 3D game development principles — rendering, shaders, physics, cameras. |
| `threejs-fundamentals` | Scene setup, cameras, renderer, Object3D hierarchy, coordinate systems. |
| `threejs-animation` | Keyframe animation, skeletal animation, morph targets, animation mixing. |
| `threejs-geometry` | Built-in shapes, BufferGeometry, custom geometry, instancing. |
| `threejs-interaction` | Raycasting, controls, mouse/touch input, object selection. |
| `threejs-lighting` | Light types, shadows, environment lighting. |
| `threejs-loaders` | GLTF, textures, images, models, async loading patterns. |
| `threejs-materials` | PBR, basic, phong, shader materials, material properties. |
| `threejs-postprocessing` | EffectComposer, bloom, DOF, screen effects. |
| `threejs-shaders` | GLSL, ShaderMaterial, uniforms, custom effects. |
| `threejs-textures` | Texture types, UV mapping, environment maps, texture settings. |
| `threejs-3d-generator` | Procedural 3D asset generation. |
| `threejs-aaa-graphics-builder` | AAA-quality graphics setup and polish. |
| `threejs-game-director` | Game direction, scene choreography, cutscenes. |
| `threejs-game-ui-designer` | Game-specific UI design (HUD, menus, overlays). |
| `threejs-gameplay-systems` | Gameplay mechanics, scoring, progression systems. |
| `threejs-debug-profiler` | Performance profiling and debugging Three.js scenes. |
| `threejs-image-generator` | Generate images from Three.js scenes. |
| `threejs-audio-generator` | Audio integration and spatial sound in Three.js. |
| `threejs-qa-release` | QA testing and release processes for Three.js games. |
| `game-development` | Game development orchestrator — routes to platform-specific skills. |
| `game-audio` | Sound design, music integration, adaptive audio systems. |
| `game-design` | GDD structure, balancing, player psychology, progression. |
| `game-art` | Visual style selection, asset pipeline, animation workflow. |
| `mobile-games` | Touch input, battery, performance, app store requirements. |
| `pc-games` | Engine selection, platform features, optimization. |
| `multiplayer` | Architecture, networking, synchronization. |
| `vr-ar` | VR/AR comfort, interaction, performance. |
| `web-games` | Web browser game development, WebGPU, PWA. |

### 🌐 Web & Frontend

| Skill | When to use |
|-------|-------------|
| `frontend-developer` | Build React components, responsive layouts, client-side state. |
| `frontend-expert` | Modern React patterns — Suspense, lazy loading, MUI, performance. |
| `frontend-design` | Frontend designer-engineer, not just a layout generator. |
| `frontend-dev-guidelines` | Senior frontend engineering under strict architectural standards. |
| `frontend-slides` | Create stunning HTML presentations with animations. |
| `react-best-practices` | Performance optimization for React and Next.js apps. |
| `react-patterns` | Modern React patterns — hooks, composition, TypeScript. |
| `react-state-management` | Redux Toolkit, Zustand, Jotai, React Query. |
| `react-modernization` | Version upgrades, class-to-hooks migration, concurrent features. |
| `react-flow-architect` | Production-ready ReactFlow applications. |
| `nextjs-app-router-patterns` | Next.js 14+ App Router, Server Components, full-stack. |
| `nextjs-best-practices` | Next.js App Router principles and data fetching. |
| `javascript-pro` | Modern JavaScript with ES6+, async patterns, Node.js APIs. |
| `javascript-mastery` | 33+ essential JavaScript concepts every developer should know. |
| `typescript-pro` | Advanced types, generics, strict type safety, enterprise patterns. |
| `typescript-expert` | Type-level programming, performance, monorepo management. |
| `html-injection-testing` | Identify and exploit HTML injection vulnerabilities. |
| `xss-html-injection` | XSS and HTML injection vulnerability assessment. |
| `fixing-accessibility` | Audit and fix ARIA labels, keyboard nav, color contrast, forms. |
| `ui-a11y` | Audit components for WCAG 2.2 AA issues. |
| `screen-reader-testing` | Testing with screen readers for accessibility validation. |
| `web-performance-optimization` | Core Web Vitals, bundle size, caching, runtime performance. |
| `fixing-motion-performance` | Audit and fix animation performance issues. |
| `css` / `tailwind-patterns` | CSS patterns, Tailwind v4, container queries, design tokens. |
| `tailwind-design-system` | Production-ready design systems with Tailwind. |

### 🔧 Backend & API

| Skill | When to use |
|-------|-------------|
| `backend-architect` | Scalable API design, microservices, distributed systems. |
| `api-design-principles` | REST/GraphQL API design principles and best practices. |
| `api-endpoint-builder` | Production-ready REST endpoints with validation and auth. |
| `api-security-best-practices` | Secure API design — auth, validation, rate limiting. |
| `api-security-testing` | API security testing workflow for REST and GraphQL. |
| `nodejs-backend-patterns` | Scalable Node.js backend with modern frameworks. |
| `nodejs-best-practices` | Node.js development principles and decision-making. |
| `fastapi-pro` | High-performance async APIs with FastAPI. |
| `graphql` / `graphql-architect` | GraphQL implementation, federation, performance optimization. |
| `supabase` | Supabase patterns — auth, database, storage, edge functions. |
| `supabase-automation` | Automate Supabase operations via MCP tools. |

### 🔒 Security

| Skill | When to use |
|-------|-------------|
| `security-audit` | Comprehensive security auditing — web apps, API, penetration testing. |
| `security-auditor` | DevSecOps, cybersecurity, compliance frameworks. |
| `007` | Security audit, hardening, threat modeling (STRIDE/PASTA). |
| `bug-hunter` | Systematically find and fix bugs using proven techniques. |
| `web-security-testing` | OWASP Top 10 vulnerabilities — injection, XSS, auth flaws. |
| `penetration-testing` / `ethical-hacking-methodology` | Full penetration testing lifecycle. |
| `threat-modeling-expert` | STRIDE, PASTA, attack trees, security architecture review. |
| `top-web-vulnerabilities` | 100 most critical web vulnerabilities by category. |
| `vulnerability-scanner` | OWASP 2025, supply chain security, attack surface mapping. |
| `frontend-security-coder` | XSS prevention, output sanitization, client-side security. |
| `backend-security-coder` | Input validation, authentication, API security. |
| `container-security-hardening` | Docker/container image hardening, CVE scanning. |
| `privacy-by-design` | Privacy protections built into apps from the start. |
| `gdpr-data-handling` | GDPR-compliant data processing and consent management. |
| `pci-compliance` | PCI DSS compliance for secure payment processing. |
| `security-compliance-compliance-check` | GDPR, HIPAA, SOC2, PCI-DSS compliance audits. |

### ☁️ DevOps & Cloud

| Skill | When to use |
|-------|-------------|
| `vercel-deployment` | Deploy to Vercel with Next.js. |
| `vercel-automation` | Automate Vercel tasks — deployments, domains, env vars. |
| `vercel-cli-with-tokens` | Deploy/manage Vercel with token-based auth. |
| `vercel-optimize` | Audit Vercel apps for cost and performance issues. |
| `deploy-to-vercel` | Deploy applications and websites to Vercel. |
| `cloud-architect` | AWS/Azure/GCP multi-cloud infrastructure design. |
| `cloud-devops` | Cloud infrastructure, Kubernetes, Terraform, CI/CD. |
| `docker-expert` | Container optimization, security, multi-stage builds. |
| `kubernetes-deployment` | Container orchestration, Helm charts, service mesh. |
| `github-actions-advanced` | Design, debug, harden GitHub Actions CI/CD workflows. |
| `github-actions-templates` | Production-ready GitHub Actions patterns. |
| `terraform-specialist` | Advanced IaC, state management, enterprise patterns. |
| `terraform-skill` | Terraform infrastructure as code best practices. |
| `aws-skills` | AWS development with infrastructure automation. |
| `aws-serverless` | Production-ready serverless apps on AWS Lambda. |
| `progressive-web-app` | PWAs with offline support, installability, caching. |
| `firebase` | Firebase auth, database, storage, functions, hosting. |
| `pwa` | Progressive Web App setup and configuration. |

### 🤖 AI & Machine Learning

| Skill | When to use |
|-------|-------------|
| `ai-engineer` | Production-ready LLM apps, RAG systems, intelligent agents. |
| `ai-agent-development` | Build autonomous agents, multi-agent systems, orchestration. |
| `ai-agents-architect` | Design autonomous AI agents with tool use and memory. |
| `ai-ml` | LLM application development, RAG, agent architecture, ML pipelines. |
| `langchain-architecture` | Build sophisticated LLM applications with agents and chains. |
| `langgraph` | Stateful multi-actor AI applications with LangGraph. |
| `crewai` | Role-based multi-agent framework. |
| `llm-app-patterns` | Production-ready patterns for building LLM applications. |
| `rag-engineer` | Build RAG systems — embeddings, vector DBs, retrieval optimization. |
| `rag-implementation` | RAG implementation workflow — embedding, vector DB, chunking. |
| `prompt-engineering` | Prompt engineering patterns, best practices, optimization. |
| `prompt-engineer` | Transform user prompts using proven frameworks. |
| `llm-prompt-optimizer` | Improve prompts for any LLM — boost quality, reduce hallucinations. |
| `llm-structured-output` | Get reliable JSON, enums, typed objects from LLMs. |
| `computer-vision-expert` | YOLO, SAM3, Vision Language Models, spatial analysis. |
| `voice-ai-development` | Build voice AI applications — real-time voice agents. |

### 📊 Data & Analytics

| Skill | When to use |
|-------|-------------|
| `database` | SQL/NoSQL development, design, migrations, optimization. |
| `database-architect` | Data layer design, technology selection, schema modeling. |
| `database-admin` | Cloud databases, automation, reliability engineering. |
| `database-optimizer` | Performance tuning, query optimization, scalable architectures. |
| `postgresql` / `postgres-best-practices` | PostgreSQL schema, indexing, performance patterns. |
| `sql-pro` | Modern SQL with cloud-native databases, OLTP/OLAP. |
| `sql-optimization-patterns` | Transform slow queries into lightning-fast operations. |
| `data-engineer` | Scalable data pipelines, Spark, dbt, Airflow. |
| `data-scientist` | Advanced analytics, ML, statistical modeling. |
| `data-storytelling` | Transform raw data into compelling narratives. |
| `supabase-postgres-best-practices` | Postgres performance optimization from Supabase. |

### 📱 Mobile Development

| Skill | When to use |
|-------|-------------|
| `mobile-developer` | React Native, Flutter, or native mobile apps. |
| `mobile-design` | Mobile-first, touch-first, platform-respectful design. |
| `flutter-expert` | Flutter with Dart 3, advanced widgets, multi-platform. |
| `ios-developer` | Native iOS with Swift/SwiftUI. |
| `android-jetpack-compose-expert` | Modern Android UI with Jetpack Compose. |
| `expo-api-routes` | API routes in Expo Router with EAS Hosting. |
| `expo-deployment` | Deploy Expo apps to production. |
| `react-native-architecture` | Production-ready React Native patterns with Expo. |

### ✍️ Writing & Content

| Skill | When to use |
|-------|-------------|
| `humanizer` | Remove AI-generated traces and make text sound natural. |
| `beautiful-prose` | Timeless, forceful English prose without AI cadence. |
| `avoid-ai-writing` | Detect and rewrite 21 categories of AI writing patterns. |
| `unslop` | Post-process AI text to strip writing patterns before publishing. |
| `copywriting` | Rigorous, conversion-focused marketing copy. |
| `blog-writing-guide` | Write blog posts following Sentry's writing standards. |
| `content-creator` | Brand voice analysis, SEO optimization, content frameworks. |
| `scientific-writing` | Deep research with well-formatted written outputs. |
| `documentation` | API docs, architecture docs, README, technical writing. |
| `code-documentation-code-explain` | Explain complex code through clear narratives. |
| `code-documentation-doc-generate` | Generate comprehensive documentation from code. |

### 🔍 SEO

| Skill | When to use |
|-------|-------------|
| `seo` | Broad SEO audit — technical, on-page, schema, sitemaps, GEO. |
| `seo-technical` | Technical SEO — crawlability, indexability, Core Web Vitals. |
| `seo-content` | Content quality and E-E-A-T analysis. |
| `seo-aeo-blog-writer` | Write SEO-optimized blog posts with AEO citation. |
| `seo-aeo-content-cluster` | Build topical authority with pillar pages and cluster articles. |
| `seo-schema` | Detect, validate, generate Schema.org structured data. |
| `geo-fundamentals` | Generative Engine Optimization for AI search engines. |
| `ai-seo` | Optimize content for AI search and LLM citations. |

### 🧪 Testing & QA

| Skill | When to use |
|-------|-------------|
| `testing-qa` | Unit, integration, E2E testing, browser automation, QA. |
| `e2e-testing` | Playwright for browser automation, visual regression. |
| `e2e-testing-patterns` | Build reliable, fast E2E test suites. |
| `test-automator` | AI-powered test automation with modern frameworks. |
| `test-driven-development` | TDD workflow — RED-GREEN-REFACTOR cycle. |
| `test-fixing` | Systematically fix failing tests. |
| `javascript-testing-patterns` | Jest patterns, factories, mocking, TDD workflow. |
| `python-testing-patterns` | Pytest, fixtures, mocking, test-driven development. |
| `k6-load-testing` | API, browser, and scalability load testing. |
| `playwright-skill` | Browser automation with Playwright. |

### 🔨 Code Quality & Refactoring

| Skill | When to use |
|-------|-------------|
| `clean-code` | Transform "code that works" into "code that is clean." |
| `code-simplifier` | Simplify code for clarity, consistency, maintainability. |
| `code-reviewer` | Elite code review with modern AI-powered analysis. |
| `code-review-checklist` | Comprehensive checklist for thorough code reviews. |
| `code-review-excellence` | Transform code reviews into knowledge sharing. |
| `code-refactoring-refactor-clean` | Refactor to SOLID patterns and clean code. |
| `code-refactoring-tech-debt` | Identify, quantify, prioritize technical debt. |
| `codebase-audit-pre-push` | Deep audit before push — junk files, dead code, security holes. |
| `bug-hunter` | Systematically find and fix bugs using proven techniques. |
| `systematic-debugging` | Debugging specialist for errors, test failures, unexpected behavior. |
| `debugging-strategies` | Transform debugging into systematic problem-solving. |
| `debugger` | Debugging specialist for errors and test failures. |
| `find-bugs` | Find bugs, security vulnerabilities, code quality issues. |
| `lint-and-validate` | MANDATORY: Run validation tools after every code change. |
| `phase-gated-debugging` | Enforce 5-phase debugging protocol before fixing. |
| `lemmaly` | Algorithm-first discipline — state Big-O before coding. |
| `complexity-cuts` | Lower Big-O on existing code via one-transformation-at-a-time. |
| `mathguard` | Math-heavy optimization for n >= 10^6. |

### 🔁 Git & Collaboration

| Skill | When to use |
|-------|-------------|
| `commit` | Create commits following Sentry conventions. Always use before committing. |
| `git-pushing` | Stage, commit, push following conventions. |
| `create-branch` | Create git branch following Sentry naming. |
| `pr-writer` | Create PRs following Sentry engineering practices. |
| `git-pr-review` | Generate concise PR description from commit history. |
| `git-advanced-workflows` | Advanced Git — clean history, collaboration, recovery. |
| `git-hooks-automation` | Husky, lint-staged, pre-commit framework, commitlint. |
| `github` | Use `gh` CLI for issues, PRs, Actions, queries. |
| `github-automation` | Automate repos, issues, PRs, CI/CD, permissions. |
| `github-issue-creator` | Turn bug reports into crisp GitHub issues. |
| `address-github-comments` | Address review or issue comments on open PRs. |
| `iterate-pr` | Iterate on PR until CI passes. |
| `requesting-code-review` | Request review after completing features. |
| `receiving-code-review` | Handle code review feedback constructively. |
| `finishing-a-development-branch` | Decide merge, PR, or cleanup after implementation. |

### 📋 Project & Product

| Skill | When to use |
|-------|-------------|
| `plan-writing` | Structured task planning with breakdowns and dependencies. |
| `writing-plans` | Write implementation plans before touching code. |
| `concise-planning` | Generate clear, actionable, atomic checklists. |
| `blueprint` | Turn one-line objective into step-by-step construction plan. |
| `idea-os` | Five-phase pipeline from raw idea to execution plan. |
| `brainstorming` | Transform vague ideas into validated designs. |
| `product-manager` | Senior PM with 30+ frameworks and 32 SaaS metrics. |
| `product-manager-toolkit` | Essential tools for modern product management. |
| `architecture` | Architectural decision-making framework. |
| `architecture-patterns` | Clean Architecture, Hexagonal, Domain-Driven Design. |
| `software-architecture` | Quality-focused software architecture guidance. |
| `microservices-patterns` | Service boundaries, communication, data management, resilience. |

### 🎨 Design & UX

| Skill | When to use |
|-------|-------------|
| `ui-ux-designer` | Create interface designs, wireframes, design systems. |
| `ui-ux-pro-max` | Comprehensive design guide for web and mobile. |
| `design-taste-frontend` | High-agency frontend with strict design taste. |
| `high-end-visual-design` | Premium fonts, spatial rhythm, soft depth, fluid microinteractions. |
| `minimalist-ui` | Clean editorial interfaces with warm monochrome palettes. |
| `baseline-ui` | Validates animation durations, typography, accessibility. |
| `ux-audit` | Audit screens against Nielsen's heuristics and mobile UX. |
| `uxui-principles` | 168 research-backed UX/UI principles. |
| `fixing-accessibility` | Fix ARIA labels, keyboard nav, focus management. |
| `fixing-metadata` | Audit/fix page titles, meta descriptions, OG tags, JSON-LD. |

### 🤖 Agent & Skill Management

| Skill | When to use |
|-------|-------------|
| `agents-md` | Create/update/maintain AGENTS.md and CLAUDE.md files. |
| `skill-creator` | Create new CLI skills following Anthropic's best practices. |
| `skill-developer` | Comprehensive guide for creating Claude Code skills. |
| `skill-writer` | Create and improve agent skills. |
| `skill-optimizer` | Diagnose and optimize skills with real session data. |
| `skill-improver` | Iteratively improve skills until quality standards met. |
| `skill-router` | Find the best skill for the user's goal. |
| `skill-check` | Validate skills against specification. |
| `skill-scanner` | Scan skills for security issues before adoption. |
| `manage-skills` | Discover, list, create, edit skills across 11 tools. |
| `permission-manager` | Manage opencode permissions and safety rules. |
| `customize-opencode` | Edit opencode configuration, agents, skills, plugins. |

### 💰 Business & Finance

| Skill | When to use |
|-------|-------------|
| `startup-analyst` | Market sizing, financial modeling, competitive analysis. |
| `startup-metrics-framework` | Track and optimize key startup metrics. |
| `pricing-strategy` | Design pricing, packaging, monetization strategies. |
| `monetization` | Stripe, subscriptions, freemium, revenue optimization. |
| `quant-analyst` | Financial models, backtesting, risk metrics. |
| `yield-intelligence` | Passive income portfolio analysis and optimization. |

### 🔌 Automation & Integration

| Skill | When to use |
|-------|-------------|
| `zapier-make-patterns` | No-code automation with Zapier and Make. |
| `n8n-workflow-patterns` | Proven patterns for building n8n workflows. |
| `workflow-automation` | Durable execution, event-driven workflows. |
| `browser-automation` | Web testing, scraping, AI agent interactions. |
| `browser-use` | Direct browser control via CDP. |
| `firecrawl-scraper` | Deep web scraping, screenshots, PDF parsing. |
| `web-scraper` | Intelligent multi-strategy web scraping. |
| `slack-automation` | Automate Slack workspace operations. |
| `github-automation` | Automate GitHub repos, issues, PRs, CI/CD. |
| `notion-automation` | Automate Notion pages, databases, blocks. |

### 🗄️ Database

| Skill | When to use |
|-------|-------------|
| `database` | SQL/NoSQL development, design, migrations. |
| `database-architect` | Data layer design from scratch. |
| `database-migration` | Schema and data migrations across ORMs. |
| `database-migrations-sql-migrations` | SQL migrations with zero-downtime. |
| `database-optimizer` | Performance tuning and query optimization. |
| `prisma-expert` | Prisma ORM — schema, migrations, optimization. |
| `drizzle-orm-expert` | Drizzle ORM for TypeScript. |
| `nosql-expert` | Cassandra, DynamoDB — query-first modeling. |
| `redis` / `vector-database-engineer` | Vector databases for RAG and semantic search. |

### 📊 Monitoring & Observability

| Skill | When to use |
|-------|-------------|
| `observability-engineer` | Monitoring, logging, tracing, SLI/SLO management. |
| `sentry-automation` | Automate Sentry — issues, alerts, releases, monitoring. |
| `grafana-dashboards` | Production-ready Grafana dashboards. |
| `prometheus-configuration` | Prometheus setup, metrics, scrape config. |
| `incident-responder` | Rapid incident response and modern observability. |
| `incident-runbook-templates` | Production-ready incident response runbooks. |
| `postmortem-writing` | Write effective, blameless postmortems. |
| `claude-monitor` | Monitor Claude Code and system local performance. |

### 🌍 SEO & Marketing

| Skill | When to use |
|-------|-------------|
| `seo` | Broad SEO audit — technical, on-page, schema, GEO. |
| `seo-aeo-content-quality-auditor` | Audit content for SEO/AEO with scored reports. |
| `seo-aeo-internal-linking` | Map internal link opportunities. |
| `seo-aeo-keyword-research` | Research and prioritise SEO keywords. |
| `seo-aeo-landing-page-writer` | Write landing pages optimized for ranking and conversion. |
| `seo-aeo-meta-description-generator` | Generate title tags and meta descriptions. |
| `seo-aeo-schema-generator` | Generate JSON-LD structured data. |
| `seo-audit` | Diagnose SEO issues affecting crawlability and rankings. |
| `seo-authority-builder` | Analyze E-E-A-T signals and build authority. |
| `seo-cannibalization-detector` | Identify keyword overlap and cannibalization. |
| `seo-competitor-pages` | Generate competitor comparison pages. |
| `seo-content-planner` | Create content outlines and topic clusters. |
| `seo-content-writer` | Write SEO-optimized content from keyword briefs. |
| `seo-image-gen` | Generate SEO-focused images — OG cards, hero images. |
| `seo-images` | Image optimization for SEO and performance. |
| `seo-keyword-strategist` | Analyze keyword usage and suggest variations. |
| `seo-meta-optimizer` | Create optimized meta titles and descriptions. |
| `seo-page` | Deep single-page SEO analysis. |
| `seo-plan` | Strategic SEO planning for new or existing sites. |
| `seo-programmatic` | Plan programmatic SEO pages at scale. |
| `seo-sitemap` | Analyze or generate XML sitemaps. |
| `seo-snippet-hunter` | Format content for featured snippets. |
| `seo-structure-architect` | Optimize content structure and header hierarchy. |
| `social-content` | Social media content strategy. |
| `socialclaw` | Agent-first social media publishing across 13 platforms. |
| `landing-page-generator` | High-converting Next.js/React landing pages with Tailwind. |

### 🗣️ Voice & Communication

| Skill | When to use |
|-------|-------------|
| `cold-email` | Write B2B cold emails that earn replies. |
| `email-sequence` | Create email sequences that nurture and convert. |
| `email-systems` | Email infrastructure with highest ROI. |
| `customer-support` | Elite AI-powered customer support specialist. |
| `internal-comms` | Write status reports, updates, newsletters. |
| `brand-guidelines` | Write copy following Sentry brand guidelines. |

### 🎭 Persona Agents (for brainstorming/review)

| Skill | When to use |
|-------|-------------|
| `andrej-karpathy` | Reduce coding mistakes, surgical changes, verifiable success. |
| `steve-jobs` | Product vision, design simplicity, user experience critique. |
| `elon-musk` | First principles thinking, radical optimization. |
| `warren-buffett` | Risk assessment, long-term value analysis. |
| `bill-gates` | Technology strategy, scalability analysis. |
| `sam-altman` | AI product strategy, scaling, safety. |
| `geoffrey-hinton` | Deep learning expertise, neural network insights. |
| `yann-lecun` | CNN architecture, self-supervised learning. |

### 🛠️ Specialized Tools

| Skill | When to use |
|-------|-------------|
| `mermaid-expert` | Create Mermaid diagrams for flowcharts, ERDs, architectures. |
| `json-canvas` | Create/edit JSON Canvas files for visual canvases. |
| `pptx-official` | Create, edit, analyze PowerPoint (.pptx) files. |
| `docx-official` | Create, edit, analyze Word (.docx) files. |
| `xlsx-official` | Create, edit, analyze Excel (.xlsx) files. |
| `pdf-official` | PDF processing with Python and CLI tools. |
| `pdf-conversion-router` | Convert PDFs to Markdown, HTML, JSON, etc. |
| `favicon` | Generate favicons from source images. |
| `screenshots` | Generate marketing screenshots using Playwright. |
| `remotion` | Generate walkthrough videos from code projects. |
| `ingest-youtube` | Pull YouTube transcripts into queryable markdown vault. |
| `youtube-summarizer` | Extract transcripts and generate comprehensive summaries. |
| `fal-generate` | Generate images and videos using fal.ai. |
| `stability-ai` | Image generation via Stability AI (SD3.5, Ultra, Core). |
| `imagen` | AI image generation with Google Gemini. |
| `image-studio` | Smart image generation — auto-routes between models. |
| `algorithmic-art` | Algorithmic philosophies expressed through code. |
| `canvas-design` | Design philosophies expressed visually. |

### 📚 Documentation & Knowledge

| Skill | When to use |
|-------|-------------|
| `readme` | Write comprehensive, thorough README documentation. |
| `docs-architect` | Create technical documentation from existing codebases. |
| `wiki-architect` | Generate wiki catalogues and onboarding guides. |
| `wiki-onboarding` | Generate onboarding documents for codebases. |
| `wiki-qa` | Answer questions grounded in source code evidence. |
| `wiki-researcher` | Deep architectural analysis of codebases. |
| `wiki-page-writer` | Generate comprehensive technical documentation pages. |
| `wiki-vitepress` | Transform wiki Markdown into VitePress static site. |
| `reference-builder` | Create exhaustive technical references and API docs. |
| `api-documentation` | Generate OpenAPI specs, developer guides. |
| `api-documentation-generator` | Generate API docs from code with AI analysis. |
| `api-documenter` | OpenAPI 3.1, interactive docs, developer portals. |
| `data-structure-protocol` | Give agents persistent structural memory of a codebase. |
| `vexor-cli` | Semantic file discovery via vector search. |
| `defuddle` | Extract clean markdown from web pages. |

### 🧩 Context & Memory

| Skill | When to use |
|-------|-------------|
| `context-manager` | Elite AI context engineering — dynamic context management. |
| `context-compression` | Compress millions of tokens of conversation history. |
| `context-window-management` | Summarization, trimming, routing for context windows. |
| `context-optimization` | Optimize limited context windows through compression. |
| `conversation-memory` | Persistent memory systems for LLM conversations. |
| `memory-systems` | Design short-term, long-term, graph-based memory. |
| `recallmax` | Long-context memory — 500K-1M clean tokens, auto-summarize. |
| `hierarchical-agent-memory` | Scoped CLAUDE.md memory reducing context token spend. |
| `mesh-memory` | Self-hosted semantic memory via MCP for AI agents. |
| `filesystem-context` | File-based context management, reduce context bloat. |
| `context-driven-development` | Maintain context as managed artifact alongside code. |
| `context-fundamentals` | Complete state available to LLM at inference time. |
| `context-degradation` | LLM degradation patterns as context length increases. |

### 🏥 Domain-Specific

| Skill | When to use |
|-------|-------------|
| `hr-pro` | HR partner — hiring, onboarding, policies, compliance. |
| `legal-advisor` | Privacy policies, terms of service, GDPR compliance. |
| `fda-food-safety-auditor` | FDA Food Safety (FSMA), HACCP compliance. |
| `fda-medtech-compliance-auditor` | Medical Device (SaMD), IEC 62304 compliance. |
| `customs-trade-compliance` | Customs documentation, tariff classification. |
| `inventory-demand-planning` | Demand forecasting, safety stock optimization. |
| `production-scheduling` | Production scheduling, job sequencing, line balancing. |
| `quality-nonconformance` | Quality control, root cause analysis, corrective action. |
| `logistics-exception-management` | Freight exceptions, shipment delays, carrier disputes. |
| `carrier-relationship-management` | Carrier portfolios, freight rates, performance. |
| `returns-reverse-logistics` | Returns authorization, inspection, refund processing. |
| `energy-procurement` | Electricity/gas procurement, tariff optimization. |
| `erp` | Enterprise resource planning patterns. |
| `it-manager-pro` | IT management — data-driven strategy, leadership. |
| `it-manager-hospital` | Hospital IT management — clinical safety, digital maturity. |

---

## Execution Progress

### Completed — verified 2026-07-01 (code audit on game_core.js / start.js / Driving.html)
- [x] **Phase 0 bug fixes** — `currentRoad` declared at `game_core.js:2359`; `this.mapCfg` only (no `this.levelCfg`); barricade offset `±10` at `game_core.js:1987-2007`; obstacle cleanup skips buildings at `game_core.js:2014`; `this.puddles` declared before rain-puddle creation at `game_core.js:1583`; procedural buildings have `userData.isBuilding: true` at `game_core.js:1209, 1371, 1975`.
- [x] **Phase 0.6 — non-issue:** `_buildHuman` is defined as a global `const` at `ui.js:1471` and called from `game_core.js` as a bare global. Works because both scripts share global scope. No context fix needed.
- [x] **Phase 1 — building collision:** AABB test with `halfW`/`halfD` + axis-of-least-penetration push-out at `game_core.js:2935-2960`. The OVERHAUL_PLAN claim that collision is "point-distance < 1.6" is stale.
- [x] **Phase 2 — UI simplification:** z-index vars, task bar redesign, emoji progress stars, progressive HUD (done in earlier sessions).
- [x] **Phase 3 — Tutorial system:** `kid-tutorial` overlay in `Driving.html`, gated on `localStorage('kid_tutorial_done')`, first-play level 1 only. The OVERHAUL_PLAN reference to `localStorage('tutorial_complete')` is stale — actual key is `kid_tutorial_done`.
- [x] **Phase 4 — NPC AI:** 3s stuck timer + teleport at `game_core.js:2501-2521`; lane clamp at the same site; traffic-light detection range tightened to 15m at `game_core.js:2567-2592`.
- [x] **Phase 5 — partial:** night mode is implemented and used at 10+ sites in `game_core.js` (line 609, 962, 1027-1031, 1190, 1319, 1521, 1537, 1572). **`MeshToonMaterial` IS the dominant material** (92 usages across game_core.js) — this is NOT a remaining gap.
- [x] **Phase 6 — Level Route Completeness:** Multi-point routes in `_unpcs` NPCs follow `cfg.route` waypoints with `laneOffset` and automatic wrapping. Rain system: 2000 particles, speed cap at 80%, fog halved, puddle shimmer + splash particles + thunder SFX via Web Audio oscillator. Night: headlight SpotLights + visible ConeGeometry cones (`this._headlightCones`), toggle sync, taillight brake glow. Level-specific layouts complete in `_getMapConfig()` M table (L1-L20 each unique with `roads[]`, `route[]`, `trafficLight[]`, `pedSpawn[]`, `speedBreakers[]`, `buildings[]`). `_getThemeRoads()` (lines 24–577): all 33 templates now have manually-defined `npcs[]` arrays (2–4 NPCs each) with correct `[[x,z]]` route format, consumed at `game_core.js:2676` via `cfg.npcs.forEach`.

- [x] **Phase 7 — Performance & polish:** NPC template cache (`_getNpcTemplate()`) with `_npcFree[]`/`_pedFree[]` reuse, smooth camera transition on pointer-lock toggle (0.4s lerp), audio category system (`sfx.vol: {sfx, ui, env}`) with `sfx.setVol()`. Frustum culling, shadow autoUpdate, and InstancedMesh already present for GLB buildings. Phase 7.2 (task bar redesign), 7.3 (InstancedMesh), 7.5 (audio UI) deprioritized — code-level infrastructure in place, UI polish deferred.
- [x] **Phase 1A — camera shake first-person:** Added `shakeX`/`shakeY` offsets to `_ucam` first-person block (`game_core.js:6356-6358`). Shake computation moved before the if/else so both modes share it. Removed duplicate computation in third-person block. Decay rate: `Math.pow(0.04, dt)`.
- [x] **Phase 1A — camera tilt re-enabled:** Uncommented tilt block in `_ucam` third-person mode. Added `* 0.5` scale factor for subtlety. Removed debug logging that was only for tilt debugging.
- [x] **Phase 1B — confetti fallback:** Added `_confettiThree()` method (`game_core.js:3978-4006`). 80 colored plane meshes with velocity/gravity/spin, 3.5s duration, fade-out. Called in `completeLevel` when `window.confetti` is unavailable.
- [x] **Phase 1C — particle effects:** Enhanced `_spawnSplash` (20 particles, 5-color blue palette with vertex colors, core+ring spread pattern, size grow, 0.8s lifespan) and `_spawnDust` (14 particles, 4-color brown/tan palette with vertex colors, horizontal drag, size grow, 0.65s lifespan). Both use `vertexColors: true` for variety. Orphaned old dust animation code removed.

### Architecture ground truth (verified)
- **Class is `Game`, not `TrafficGame`.** `AGENTS.md` previously said "TrafficGame" — that was a doc error. Defined at `game_core.js:9`.
- **Levels are lesson data only.** All 20 `levels/levelN.js` files push to `window.LVS[]` with `{id, icon, name, modes, theory, tasks, law, ...}`. There is no separate per-level `LEVEL_CONFIG` — the 3D world for every level comes from the hard-coded `M` table inside `_getMapConfig(lvId)` at `game_core.js:875`. L15 is a special 50km open-world override built procedurally inside the same function. L16+ falls back to `_getThemeRoads(themeType)` which now returns `{ roads, route, npcs }` (all 33 templates have manually-defined `npcs[]` arrays).
- **Preloader is monolithic.** `start.js:25-77+` preloads ~100+ GLBs at startup. No per-level loading. Many models in `Models/` are unreferenced (`kenney_animated-characters-*`, `kenney_cube-pets`, `kenney_platformer-pack-remastered`, `road__avenue__street`, the `uploads_files_*` archive).
- **uploads_files_* archive format gap.** The "new model packs" in `New Ideas.txt` are `.rar` / `.zip` / `.fbx` / `.3ds` / `.obj` / `.mtl`. The current loader is GLB-only. Plan: use JSZip in-browser for `.zip` (already loaded), add `FBXLoader` / `OBJLoader` for the other formats, and park `.rar` as future work (JSZip cannot read RAR — needs `node-unrar-js` or a pre-extracted vendor copy).

### Remaining work (per OVERHAUL_PLAN §2026-07-01 plan, ordered)
1. **Per-level asset loading** (Step 1) — split `start.js` into `CORE_ASSETS` + `LEVEL_ASSETS`, extend `_getMapConfig`'s `M[lvId]` with `assets: [...]`.
2. ~~**MeshToonMaterial pass**~~ — DONE. Already dominant material (92 usages).
3. ~~**GTA-style open world foundation** (Step 3)~~ — DONE. Pedestrian-first start implemented (`_pmesh()` L2038, `_enterState` machine L1449, `_tickEnterExit()` L6271, F-key handler L4284). `road_avenue` already preferred over `road_straight` (game_core.js:2238). Kenney suburban/industrial buildings verified across all levels. Loading screen callback path correct (start.js:144-150).
4. **Ethical-driving mechanics** (Step 4) — 13 sub-systems: scenario scripts per theme, seatbelts/animals/littering, indicators, phone temptation, zebra crossings, signage, wrong-side/overtaking, road-rage NPCs, police checkpoints + e-challan log.
5. **Tier 1-2 level authoring** (Step 5) — extend existing 1-20 with `assets:` and `scenario:`; defer 21-50.
6. **New Ideas #1, #3, #4, #6** (Step 6) — footpath arrow, smart ring path, driving-instructor level, age-adaptive visuals.
7. **2D scenario demo** (Step 7) — Phaser 4 on `Academy.html`.
8. **Performance & polish** (Step 8) — object pooling, frustum-cull-aware shadow autoUpdate, InstancedMesh, camera lerp, mobile 30fps target.

### Post-audit fixes — verified 2026-07-04
- [x] **Fix 1 — confetti z-index:** `start.js:223` changed from `9998` → `20` (sits between canvas and HUD layers).
- [x] **Fix 2 — task-tracker overflow:** `#task-tracker` in `Driving.html` now has `max-width: min(280px, 85vw)`.
- [x] **Fix 3 — 400–768px breakpoint:** New CSS media query in `Driving.html` scales `#task-tracker`, `#objective-overlay`, `#phone-gps`, kid elements, steering wheel, and gauge SVGs.
- [x] **Fix 4 — pause menu:** Escape key handler in `game_core.js:540`; `togglePause()` method; HTML overlay `#pause-overlay` with Resume/Restart/Quit buttons; CSS `#pause-overlay.on { display: flex }`.
- [x] **Fix 5 — steering wheel narrow screens:** `#steer-wheel-container` sized down in 400–768px breakpoint (80px vs 100px).
- [x] **Fix 6 — frustum culling on NPC/ped meshes:** Added `nv.frustumCulled = true` at NPC spawn (lines ~2105, 2145) and `ped.frustumCulled = true` at ped spawn (line ~3655).
- [x] **Fix 7 — dynamic shadow quality:** `_usun()` now monitors FPS every 60 frames; downgrades shadow map to 512 when FPS < 25, upgrades back to 2048 when FPS > 50.
- [x] **Fix 8 — ui.js clone z-index:** `dismissChallan()` clone z-index changed from hardcoded `'999999'` → reads `--z-modal` CSS variable (fallback `'100001'`).
- [x] **Fix 9 — CSP meta tag:** Added `Content-Security-Policy` meta tag to `Driving.html` `<head>`.

### Out of scope (deferred)
- **Seerle Traffic Academy Android app** (was OVERHAUL_PLAN Phase 10) — separate product, separate plan.
- **RAR archive extraction** — JSZip cannot read RAR. Pre-extract on disk or accept a build-time `node-unrar-js` step.
- **Audio system overhaul** — blocked on asset sourcing.

---

_Last updated: 2026-07-12_
