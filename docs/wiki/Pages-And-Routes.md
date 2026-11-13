# Pages And Routes

## Vercel URL Routing (`vercel.json`)

- **`cleanUrls: true`**: All `.html` extensions are stripped from public URLs.
- **Rewrites**:
  - `/` &rarr; `/home`
  - `/cast` &rarr; `/CastFlow`
  - `/perceptus` &rarr; `/gesture`
  - `/friday` &rarr; `/download`
  - `/col-game` &rarr; `/download`
  - `/castflow` &rarr; `/CastFlow`
  - `/civiclogic` &rarr; `/Database_Logic`
  - `/database_logic` &rarr; `/Database_Logic`
- **Permanent Redirects**:
  - `/index.html` &rarr; `/home`
  - `/index` &rarr; `/home`
  - `/how-it-was-made` &rarr; `/making`
  - `/engine` &rarr; `/solar`

> `/civiclogic` is a **real page** — the rewrite above only applies when the
> request does not resolve to a static file, so `/civiclogic` serves
> `civiclogic.html` and stays indexable.

---

## Complete Page Catalog (31 root pages)

### Indexable — listed in `sitemap.xml` (19 routes)

| URL Route | Source File | Purpose |
|---|---|---|
| `/` | `home.html` | Main portal and showcase hub |
| `/about` | `about.html` | Student studio history and mission |
| `/making` | `making.html` | Technical devlog and architectural evolution |
| `/school` | `school.html` | Bhavani Shankar School institutional showcase |
| `/sneh-asha` | `sneh-asha.html` | Technology For Good educational charity initiative |
| `/Career` | `Career.html` | FutureScape career planning and student roadmap |
| `/cereal` | `cereal.html` | AI lecture and meeting assistant |
| `/civiclogic` | `civiclogic.html` | 50-module civic statutory knowledge base |
| `/ati` | `ati.html` | Advanced Typing Instructor landing page |
| `/solar` | `solar.html` | Interactive 3D planetary physics engine |
| `/gesture` | `gesture.html` | Touchless hand tracking and gesture controller |
| `/qr-editor` | `qr-editor.html` | Interactive in-browser QR code designer |
| `/Terra3D/` | `Terra3D/index.html` | Interactive 3D world atlas (178 countries) |
| `/CastFlow` | `CastFlow.html` | Wireless screen mirroring studio |
| `/download` | `download.html` | App installer hub (Windows, Linux, Android) |
| `/Traffic/Driving` | `Traffic/Driving.html` | Mumbai 3D free-roam simulator (57 levels) |
| `/Traffic/Academy` | `Traffic/Academy.html` | 57-level driving academy syllabus |
| `/privacy` | `privacy.html` | Privacy policy and data handling practices |
| `/terms` | `terms.html` | Terms of service |

### Internal — served with `X-Robots-Tag: noindex`

| URL Route | Source File | Purpose |
|---|---|---|
| `/dashboard` | `dashboard.html` | User profile, achievement badges, and activity |
| `/admin` | `admin.html` | Administrative management console |
| `/qr` | `qr.html` | Dynamic QR dashboard and scanning engine |
| `/rpg` | `rpg.html` | Quest Master 2D action RPG (coming soon) |
| `/ati-demo` | `ati-demo.html` | ATI Velocity Studio typing demo |
| `/ati-lite` | `ati-lite.html` | Lightweight ATI Engine v3.2 typing drill |
| `/Database_Logic` | `Database_Logic.html` | Relational query modelling of statutory rules |
| `/verify` | `verify.html` | Certificate and achievement verifier |
| `/feedback` | `feedback.html` | Community feedback and bug submission form |
| `/sitemap` | `sitemap.html` | Visual HTML site index |
| `/404` | `404.html` | Terminal-styled 404 error page |
| `/q` | `q.html` | Short-link resolver (redirects) |
| `/Traffic/TrafficDashboard` | `Traffic/TrafficDashboard.html` | Traffic stats, challans, and leaderboards |
| `/Traffic/TrafficSetup` | `Traffic/TrafficSetup.html` | Vehicle customizer and graphics presets |
| `/Traffic/GamePage` | `Traffic/GamePage.html` | React-mode build of the driving simulator |
| `/Traffic/traffic-messenger` | `Traffic/traffic-messenger.html` | Academy messenger for learners and mentors |
| `/Traffic/lod_test` | `Traffic/lod_test.html` | Internal level-of-detail renderer diagnostic |

### Sub-apps and support files

| Path | Purpose |
|---|---|
| `cast/CastFlow.html`, `cast/viewer-standalone.html` | Standalone CastFlow receiver app |
| `glass-demo.html` | Liquid Glass component demo |
| `59e58c74f1445d6cf2346bcda53ade9c.html` | Twilio domain-verification file — required, do not delete |
| `ads.txt`, `manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml`, `llms.txt` | Distribution, PWA, and crawler metadata |
| `config.json`, `version.json`, `ati-version.json`, `cast-version.json`, `perceptus-version.json` | Publishable runtime configuration and release metadata |

---

## Adding A Page

1. Create the HTML at the repository root (or inside `Traffic/` / `Terra3D/`).
2. Give it exactly one `<title>` (15–60 characters), one meta description
   (70–165 characters), one canonical matching its route, a complete Open Graph
   and Twitter card set, a document `lang`, one viewport tag, and one `<h1>`.
3. Add it to `sitemap.xml` with a `<lastmod>` that is not in the future.
4. Run `node scripts/audit-pages.js` — it resolves every internal reference
   against the built tree.
5. Run `npm run build` — `scripts/seo-check.js` fails on any metadata drift.

Pages that must stay out of the sitemap belong in `nonIndexableRoutes` in
`scripts/seo-check.js`.
