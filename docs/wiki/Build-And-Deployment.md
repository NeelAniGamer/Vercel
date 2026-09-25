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
2. **Directory Recreation**: Completely clears and recreates `dist/`.
3. **Deny-List Static Copy**: Copies files from root into `dist/`, excluding development files, agent configurations, and source models.
4. **Traffic Public Overlay**: Copies assets from `Traffic/public/` to `dist/Traffic/`.
5. **Output Safety Assertion**: Scans `dist/` to ensure no sensitive files (`.env`, `*.sqlite`, `node_modules`) were copied.
6. **React Bundling**: Uses `esbuild` to bundle `react-src/GamePage.tsx` into an ESM module at `dist/Traffic/simulator-bundle.js`.
7. **Postbuild Validation**: Runs production, SEO, and security regression checks.

---

## Vercel Configuration (`vercel.json`)

- **`outputDirectory: "dist"`**: Serves the pre-built distribution directory.
- **`cleanUrls: true`**: Strips `.html` extensions from all routes.
- **Caching Headers**:
  - Assets (`*.js`, `*.css`, `*.glb`): Cached for 7 days with stale-while-revalidate.
  - HTML & Config (`*.html`, `config.json`): Cached with `must-revalidate`.
- **Security Headers**: Injects strict CSP, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
