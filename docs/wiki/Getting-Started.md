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
2. **Static Assembly**: Clears and recreates `dist/` using the deny-list filter.
3. **React Compilation**: Uses esbuild to bundle `react-src/GamePage.tsx` into `dist/Traffic/simulator-bundle.js`.
4. **Postbuild Gates**:
   - `node scripts/production-check.js` &mdash; Checks file counts and output size.
   - `node scripts/seo-check.js` &mdash; Audits OpenGraph, canonicals, and metadata.
   - `node scripts/security-check.js` &mdash; Guards live-session credentials and Electron flags.

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
