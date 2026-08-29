/**
 * Compiles electron/main.ts + preload.ts → CommonJS JS for Electron runtime.
 * Uses esbuild (bundled with Vite) — no extra dependency needed.
 */
const { build } = require('esbuild');
const path = require('path');

async function main() {
  const common = {
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: ['electron', 'electron-updater'],
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

  console.log('[electron-build] main.js + preload.js compiled');
}

main().catch((e) => { console.error(e); process.exit(1); });