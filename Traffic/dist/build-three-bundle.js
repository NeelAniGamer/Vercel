/**
 * Bundles three-shim.js into libs/three-bundle.js (classic script, IIFE).
 * Run:  node build-three-bundle.js
 */
const path = require('path');
const fs = require('fs');
const { build } = require('esbuild');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'libs', 'three-bundle.js');

(async () => {
  // Confirm the shim actually resolves before emitting it.
  const threePkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', 'three', 'package.json'), 'utf8'));
  console.log(`bundling three r${threePkg.version} -> libs/three-bundle.js`);

  await build({
    entryPoints: [path.join(ROOT, 'three-shim.js')],
    outfile: OUT,
    bundle: true,
    format: 'iife',
    target: ['chrome120'],
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'info',
    metafile: true,
    // three r186's DRACOLoader resolves its decoder with
    //   new URL('../libs/draco/draco_decoder.wasm', import.meta.url)
    // at MODULE EVALUATION time. In an IIFE bundle esbuild substitutes an empty
    // import.meta, so that constructor throws "Invalid URL" and the whole
    // bundle dies before window.THREE is ever assigned.
    // Point import.meta.url at this script's own src so the relative path
    // resolves correctly. (start.js still calls setDecoderPath('libs/draco/'),
    // which overrides this default, but it must not throw to get there.)
    define: { 'import.meta.url': '__threeBundleSelfUrl' },
    banner: {
      js: 'var __threeBundleSelfUrl = (typeof document!=="undefined" && document.currentScript && document.currentScript.src) || (typeof location!=="undefined" ? location.href : "file:///");',
    },
  });

  const bytes = fs.statSync(OUT).size;
  console.log(`\nwrote libs/three-bundle.js  ${(bytes / 1048576).toFixed(2)} MB`);
})().catch((e) => { console.error(e); process.exit(1); });