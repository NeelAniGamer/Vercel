# Getting Started

## Prerequisites

- **Node.js**: Version 20.x or higher
- **npm**: Included with Node.js
- **Git**

---

## Installation

```bash
# 1. Clone repository
git clone https://github.com/NeelAniGamer/Vercel.git
cd Vercel

# 2. Install root dependencies
npm ci
```

---

## Production Build & Verification

To run the complete production build pipeline:

```bash
npm run build
```

This automatically executes:
1. **Level Validator**: Verifies maintained level configs (`level1`, `level5`, `level_custom`).
2. **Career Data Validator**: Confirms `careers-data.js` holds 441 unique career records.
3. **Static Assembly**: Clears and recreates `dist/` using the deny-list filter.
4. **React Compilation**: Uses esbuild to bundle `react-src/GamePage.tsx` into `dist/Traffic/simulator-bundle.js`.
5. **Postbuild Gates**:
   - `node scripts/production-check.js` &mdash; Checks required outputs, forbidden paths, and local references.
   - `node scripts/seo-check.js` &mdash; Audits sitemap parity, canonicals, Open Graph, Twitter cards, and JSON-LD.
   - `node scripts/security-check.js` &mdash; Guards live-session credentials, QR verifiers, and Electron flags.

---

## Serving Locally

```bash
node local_server.js
```

Open [http://localhost:3000/home](http://localhost:3000/home). The server is
clean-URL aware, so `/Traffic/Driving` and `/Terra3D/` resolve the same way they
do in production. It is excluded from the deploy artifact.

---

## Content And Reference Checks

These scripts keep published copy and internal references honest. All of them
are dev-only and excluded from the deploy artifact.

| Command | Purpose |
|---|---|
| `node scripts/audit-pages.js` | Resolves every internal `src`/`href` against the built tree and reports incomplete head metadata |
| `node scripts/refresh-page-meta.js` | Inserts any missing head tags using the table inside the script (idempotent) |
| `node scripts/refresh-page-meta.js --check` | Reports missing metadata without writing anything |
| `node scripts/fact-check.js` | Prints the career, country, level, and module counts behind the published copy |
| `node scripts/fact-terra3d.js` | Resolves Terra3D's country aliases and prints the canonical count |
| `node scripts/fact-codepaths.js` | Counts hand-written source lines |

Published counts are generated, not hand-written. Change the data, re-run the
fact scripts, then update the copy.

---

## Running Traffic Simulator Locally

```bash
# Navigate to Traffic module
cd Traffic

# Install Traffic dependencies
npm ci

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Terra3D Locally

```bash
cd Terra3D
npm install    # Note: Terra3D uses npm install, not npm ci
npm run dev
```

---

## Non-Negotiable Coding Rules

1. **Title Case Strings**: Every user-facing UI string must use Title Case.
2. **Never Edit `dist/`**: Build artifacts in `dist/` are generated automatically. Always edit source files in root or `Traffic/`.
3. **Mobile First**: Target 360px viewport widths with responsive touch layouts.
4. **Live-Session Identity**: `window.colUser` represents live sessions only; never treat offline LocalStorage profiles as authenticated identities.
