# Build And Deployment

## Deployment Architecture

The production website is hosted on **Vercel** and served from the committed `dist/` directory.

---

## The Build Pipeline (`build.js`)

`build.js` is the single source of truth for deployments:

```bash
npm run build
```

### Execution Flow:
1. **Level Validation**: Executes `node Traffic/tools/validate-levels.js --scope=level1,level5,level_custom` to guarantee core simulator stability.
2. **Career Data Validation**: Executes `node scripts/validate_career_data.js` to confirm 441 unique career records.
3. **Directory Recreation**: Completely clears and recreates `dist/`.
4. **Deny-List Static Copy**: Copies files from root into `dist/`, excluding development files, agent configurations, and source models.
5. **Traffic Public Overlay**: Copies assets from `Traffic/public/` to `dist/Traffic/`.
6. **Output Safety Assertion**: Scans `dist/` to ensure no sensitive files (`.env`, `*.sqlite`, `node_modules`) were copied.
7. **React Bundling**: Uses `esbuild` to bundle `react-src/GamePage.tsx` into an ESM module at `dist/Traffic/simulator-bundle.js`.
8. **Postbuild Validation**: Runs production, SEO, and security regression checks.

The current artifact is **~279 MB across 586 files and 41 HTML pages**. The size
comes from retained runtime 3D model packs, not from duplication.

---

## Vercel Configuration (`vercel.json`)

- **`outputDirectory: "dist"`**: Serves the pre-built distribution directory.
- **`cleanUrls: true`**: Strips `.html` extensions from all routes.
- **Caching Headers**:
  - Media and model assets (`*.png|jpg|webp|gif|svg|ico|woff|glb|mp3|mp4`): `max-age=2592000` (30 days) with `stale-while-revalidate=604800`.
  - Stylesheets and scripts (`*.css|js|mjs`): `max-age=86400`.
  - HTML, `sw.js`, `config.json`, and `version.json`: `max-age=0, must-revalidate`.
- **Security Headers**: Injects a report-only CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- **`X-Robots-Tag`**: `noindex, nofollow, noarchive` on internal routes only.

---

## Source Upload (`.vercelignore`)

`.vercelignore` controls what is uploaded to the Vercel build, independently of
what `build.js` emits. It excludes version control state, local agent tooling,
dependency trees, generated output, credentials, archives, and the Traffic
non-runtime files. Keep both exclusion lists aligned when adding a new
sensitive or non-runtime path.
