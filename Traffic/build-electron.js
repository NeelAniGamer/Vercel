/**
 * Compiles electron/main.ts + preload.ts → CommonJS JS for Electron runtime.
 * Uses esbuild (bundled with Vite) — no extra dependency needed.
 */
const { build } = require('esbuild');
const path = require('path');
const fs = require('fs');

function copyFileSafe(src, dest) {
  try {
    if (fs.existsSync(src)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
    }
  } catch (e) {
    console.warn(`[electron-build] Warning copying ${src} -> ${dest}:`, e.message);
  }
}

function copyDirSafe(src, dest) {
  try {
    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDirSafe(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  } catch (e) {
    console.warn(`[electron-build] Warning copying dir ${src}:`, e.message);
  }
}

async function copyAssets() {
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  // 1. Copy All Screens: Driving, Dashboard, Academy, Setup
  const screens = ['Driving.html', 'TrafficDashboard.html', 'Academy.html', 'TrafficSetup.html'];
  screens.forEach(s => copyFileSafe(path.join(__dirname, s), path.join(distDir, s)));

  // 2. Copy Game Engine Scripts & Assets
  const files = fs.readdirSync(__dirname);
  files.forEach(f => {
    if (f.endsWith('.js') && !f.startsWith('test_') && f !== 'build-electron.js' && f !== 'pw_test.js') {
      copyFileSafe(path.join(__dirname, f), path.join(distDir, f));
    }
    if (f.endsWith('.css') || f.endsWith('.png') || f.endsWith('.ico') || f.endsWith('.json')) {
      if (f !== 'package.json' && f !== 'package-lock.json' && f !== 'tsconfig.json') {
        copyFileSafe(path.join(__dirname, f), path.join(distDir, f));
      }
    }
  });

  // 3. Copy Levels, Models, Textures
  copyDirSafe(path.join(__dirname, 'levels'), path.join(distDir, 'levels'));
  copyDirSafe(path.join(__dirname, 'textures'), path.join(distDir, 'textures'));

  // 4. Copy Parent Shared Web Modules so ../ references work
  const parentFiles = ['col-router.js', 'col-ui.js', 'col-auth.js', 'col-ui.css', 'Icon.png', 'config.json'];
  parentFiles.forEach(pf => {
    copyFileSafe(path.join(__dirname, '..', pf), path.join(distDir, pf));
    // Also place in dist/.. (Traffic folder level)
    copyFileSafe(path.join(__dirname, '..', pf), path.join(__dirname, pf));
  });

  console.log('[electron-build] Screens (Driving, Dashboard, Academy, Setup) and assets synced to dist/');
}

async function main() {
  const common = {
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: ['electron'],
    sourcemap: false,
    minify: false
  };

  await build({
    ...common,
    entryPoints: [path.join(__dirname, 'electron', 'main.ts')],
    outfile: path.join(__dirname, 'electron', 'main.js')
  });

  await build({
    ...common,
    entryPoints: [path.join(__dirname, 'electron', 'preload.ts')],
    outfile: path.join(__dirname, 'electron', 'preload.js')
  });

  await copyAssets();

  console.log('[electron-build] main.js + preload.js compiled and assets ready');
}

main().catch((e) => { console.error(e); process.exit(1); });