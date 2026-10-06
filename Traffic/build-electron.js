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
      if (!fs.existsSync(destDir)) {fs.mkdirSync(destDir, { recursive: true });}
      fs.copyFileSync(src, dest);
    }
  } catch (e) {
    console.warn(`[electron-build] Warning copying ${src} -> ${dest}:`, e.message);
  }
}

// ===== Dead-asset exclusion (Phase 4) =====
// Traffic/Models is ~1 GB, but a full 57-level sweep of observed browser
// requests plus a scan of every filename mentioned in first-party source shows
// a large majority is never loaded. tools/dead-model-files.json lists the
// remainder, and the web build (Vercel build.js) has always skipped it -- the
// Electron packaging did not, which is why this installer was 1.44 GB.
//
// The files stay in the repository; they are simply not copied into dist/.
//
// SAFETY: the manifest is only trustworthy while it stays a strict subset of
// what the browser actually requested. If someone hand-edits it and drops a
// live asset, that file silently vanishes and the level breaks at runtime with
// no build error. So the checked-in request capture is verified against it and
// any disagreement stops the build. build.js has the same guard on the web.
const DEAD_MANIFEST = path.join(__dirname, 'tools', 'dead-model-files.json');
const REQUEST_CAPTURE = path.join(__dirname, 'tools', 'model-requests.json');

const deadModelFiles = new Set(
  (() => {
    if (!fs.existsSync(DEAD_MANIFEST)) {
      console.warn('[electron-build] dead-model-files.json not found - packaging ALL Models (~1 GB).');
      return [];
    }
    return JSON.parse(fs.readFileSync(DEAD_MANIFEST, 'utf8')).files || [];
  })()
);

function assertDeadListIsSafe() {
  if (!deadModelFiles.size) {return 0;}
  if (!fs.existsSync(REQUEST_CAPTURE)) {
    console.warn('[electron-build] model-requests.json missing - cannot verify the dead-asset list.');
    return 0;
  }
  const observed = JSON.parse(fs.readFileSync(REQUEST_CAPTURE, 'utf8'))
    .map((p) => decodeURIComponent(p).replace(/\\/g, '/'));
  const wronglyExcluded = observed.filter((p) => deadModelFiles.has(p));
  if (wronglyExcluded.length > 0) {
    throw new Error(
      `dead-model-files.json excludes ${wronglyExcluded.length} asset(s) the browser actually loads, ` +
      `starting with: ${wronglyExcluded.slice(0, 5).join(', ')}. ` +
      'Regenerate the manifest with Traffic/tools/find-dead-models.js.'
    );
  }
  return observed.length;
}

function isDeadAsset(absPath) {
  if (!deadModelFiles.size) {return false;}
  // Manifest entries are repo-relative and forward-slashed, e.g.
  // "Traffic/Models/kenney_city-pack/Adventurer.glb", while __dirname is
  // .../Vercel/Traffic -- so rebuild exactly that shape.
  const rel = path.relative(path.join(__dirname, '..'), absPath).replace(/\\/g, '/');
  return deadModelFiles.has(rel);
}

/** copyDirSafe, but skipping assets the manifest says are never loaded. */
function copyDirSafeFiltered(src, dest) {
  if (!fs.existsSync(src)) {return 0;}
  if (!fs.existsSync(dest)) {fs.mkdirSync(dest, { recursive: true });}
  let copied = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copied += copyDirSafeFiltered(srcPath, destPath);
    } else {
      if (isDeadAsset(srcPath)) {continue;}
      copyFileSafe(srcPath, destPath);
      copied++;
    }
  }
  return copied;
}

function copyDirSafe(src, dest) {
  try {
    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {fs.mkdirSync(dest, { recursive: true });}
      if (typeof fs.cpSync === 'function') {
        fs.cpSync(src, dest, { recursive: true, force: true });
      } else {
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
    }
  } catch (e) {
    console.warn(`[electron-build] Warning copying dir ${src}:`, e.message);
  }
}

async function copyAssets() {
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {fs.mkdirSync(distDir, { recursive: true });}

  // 1. Copy All Screens: Driving, Dashboard, Academy, Setup, index
  const screens = ['Driving.html', 'TrafficDashboard.html', 'Academy.html', 'TrafficSetup.html', 'index.html'];
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

  // 3. Copy Levels, Models, Textures, Skins & Cyberpunk
  const observed = assertDeadListIsSafe();
  if (deadModelFiles.size) {
    console.log(`[electron-build] dead-asset list verified against ${observed} observed request(s); ` +
      `excluding ${deadModelFiles.size} never-loaded asset(s) from the package.`);
  }
  console.log('[electron-build] Syncing 3D Models and asset packs to dist/ ...');
  copyDirSafe(path.join(__dirname, 'levels'), path.join(distDir, 'levels'));
  copyDirSafe(path.join(__dirname, 'textures'), path.join(distDir, 'textures'));
  copyDirSafe(path.join(__dirname, 'skins'), path.join(distDir, 'skins'));

  // Clear dist/Models first. copyAssets only ever copies, never deletes, so
  // without this the dead models copied by an earlier build would linger in
  // dist/ and still ship inside the asar, silently defeating the exclusion.
  const distModels = path.join(distDir, 'Models');
  if (fs.existsSync(distModels)) {
    fs.rmSync(distModels, { recursive: true, force: true });
    console.log('[electron-build] cleared stale dist/Models');
  }
  const modelCount = copyDirSafeFiltered(path.join(__dirname, 'Models'), distModels);
  console.log(`[electron-build] Models: ${modelCount} live file(s) copied.`);
  copyDirSafe(path.join(__dirname, '..', 'Cyberpunk'), path.join(distDir, 'Cyberpunk'));

  // 3b. Copy vendored third-party libs (three.js loaders, Draco decoder, chart.js...).
  // Required for offline operation: pages reference libs/ relatively and would 404 otherwise.
  copyDirSafe(path.join(__dirname, 'libs'), path.join(distDir, 'libs'));

  // 3c. Certificate logo PNGs, referenced by path from cert_assets.js.
  copyDirSafe(path.join(__dirname, 'cert-assets'), path.join(distDir, 'cert-assets'));

  // 4. Copy Parent Shared Web Modules so ../ references work
  const parentFiles = ['col-router.js', 'col-ui.js', 'col-auth.js', 'col-ui.css', 'Icon.png', 'config.json'];
  parentFiles.forEach(pf => {
    copyFileSafe(path.join(__dirname, '..', pf), path.join(distDir, pf));
    // Also place in dist/.. (Traffic folder level)
    copyFileSafe(path.join(__dirname, '..', pf), path.join(__dirname, pf));
  });

  console.log('[electron-build] Screens (Driving, Dashboard, Academy, Setup) and all 3D models synced to dist/');
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