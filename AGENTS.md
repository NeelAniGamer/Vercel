# AGENTS.md — Class Of Learners (Vercel workspace)

## What this repository is

A static, multi-app site for a student studio in Mumbai. Runtime is hand-written
HTML/CSS/JS plus two Vite/Three.js apps (`Traffic/`, `Terra3D/`). There is no
server runtime: Vercel serves the committed `dist/` tree.

Deeper docs: `README.md` (how it works), `SECURITY.md` (support policy),
`docs/wiki/` (architecture, routes, auth, deployment).

## Commands

| Task | Command |
|------|---------|
| Serve source locally (port 3000) | `node local_server.js` |
| Build the deploy tree | `npm run build` |
| Typecheck `react-src/` | `npm run typecheck` |
| Lint / format | `npm run lint` / `npm run format` |
| Root smoke tests | `npm test` |
| Audit pages and references | `node scripts/audit-pages.js` |
| Refresh missing page metadata | `node scripts/refresh-page-meta.js` (`--check` to preview) |
| Re-derive published numbers | `node scripts/fact-check.js`, `scripts/fact-terra3d.js`, `scripts/fact-codepaths.js` |
| Traffic app (separate deps) | `cd Traffic && npm ci && npm run dev` |
| Terra3D app (separate deps) | `cd Terra3D && npm install && npm run dev` |

`npm run build` runs `build.js`: validate Traffic levels → validate career data →
recreate `dist/` → copy the filtered tree → esbuild the React bundle. Its `postbuild`
then runs `production-check`, `seo-check`, and `security-check`. **All three must pass.**

## Layout

| Path | Role |
|------|------|
| `*.html` (31 pages) | Public + internal pages; `home.html` is the studio landing page |
| `col-ui.js` / `col-ui.css` | Shared core: nav, theme, design tokens, primitives |
| `col-auth.js` | Supabase auth, session state |
| `col-router.js` + `config.json` | Routing and publishable runtime config |
| `col-3d.js`, `col-3d/` | Procedural 3D background and modular scenes |
| `Traffic/` | Driving simulator + Academy (own package, 57 levels in `window.LVS`) |
| `Terra3D/` | Standalone WebGL globe app (own package) |
| `react-src/` | React/TS simulator components → `dist/Traffic/simulator-bundle.js` |
| `dist/` | **Committed** deploy artifact. Regenerate; never hand-edit |
| `scripts/` | Dev-only checks and generators; excluded from the deploy |
| `docs/wiki/` | Architecture, route, auth, and deploy documentation |
| `supabase/` | DB migrations and email templates; excluded from the deploy |

## Rules that break the build or the site

- **`build.js` is deny-list based.** Anything not excluded ships to production. Review new
  files before building; the checker is not a substitute for review.
- **Published numbers are generated, never hand-written.** Career pathways (441), Terra3D
  countries (178 unique of 194 records), Traffic levels (57), app counts, and line counts
  all come from the data. Change the data, run the `scripts/fact-*.js` scripts, then
  update the copy in the pages, `README.md`, `SECURITY.md`, `llms.txt`, and `docs/wiki/`.
- **SEO contract.** `seo-check.js` ties `sitemap.xml` to the pages it lists: exactly one
  title, one description, one canonical matching the route, complete Open Graph + Twitter
  card tags, a document `lang`, one viewport tag, JSON-LD, and a non-placeholder `<h1>`.
  A new public page must be added to `sitemap.xml` **and** carry those head tags.
  Pages that must stay out of the sitemap belong in `nonIndexableRoutes` in `scripts/seo-check.js`.
- **Missing references are warnings, not errors.** `production-check.js` only warns when an
  HTML page points at a file that no longer exists — the build still passes and the page
  404s in production. Run `node scripts/audit-pages.js` after deleting or moving any
  asset; it resolves every internal `src`/`href` against the built tree.
- **`security-check.js` asserts specific invariants.** `SECURITY.md` must exist;
  `col-auth.js` must not persist a live session to `localStorage`; QR passwords must use
  PBKDF2; the Traffic objective list must match the engine
  (`Traffic/tools/gen-unhandled-task-targets.js` and `validate-levels.js` must stay).
  Do not add a second CodeQL workflow — it conflicts with the repo's existing one.
- **`Traffic/Driving.html` loads `story/*.js` by relative path.** The live copy is
  `Traffic/story/`. Do not delete it.
- **`59e58c74f1445d6cf2346bcda53ade9c.html` is the Twilio domain-verification file.**
  It looks like junk; it is not. Never delete it.
- **`Traffic/Models/` and `Traffic/audio/` are live game assets.** Their raw source dump
  was removed; regenerate assets with `Traffic/scripts/stage_assets.py` if needed.
- `Traffic/dist`, `Traffic/dist-electron`, `Terra3D/build`, `Terra3D/dist` are generated
  and not committed. Rebuild the Traffic web build with `cd Traffic && npm run build:web`.
- Only `react-src/GamePage.tsx` is bundled today, into `dist/Traffic/simulator-bundle.js`
  and mounted by `Traffic/GamePage.html`. A new React page needs both a `build.js` entry
  and an HTML entry point.
- `config.json` is publishable — never put secrets in it. `.env.local` is local-only.

## Conventions

- Prettier: no semicolons, single quotes, 2-space indent, print width 200.
- Theme lives in `localStorage.theme` (`'light'`/`'dark'`); it toggles the `lm` class on
  **both** `<html>` and `<body>`, because the CSS keys off both.
- `Traffic/` is a separate npm package with its own `package.json` and lockfile. The root
  is not a workspace — install dependencies where the command lives.
- `docs/wiki/` is the place for architectural detail; keep it current instead of
  scattering new markdown at the repository root.
