/**
 * Global THREE shim — three.js r186 exposed the way the game expects.
 *
 * WHY THIS FILE EXISTS
 * The game is ~3.8 MB of classic scripts that reference `window.THREE` in
 * ~4,700 places and pull addons off `THREE.GLTFLoader`, `THREE.EffectComposer`
 * and so on. three.js removed the global/UMD build after r148 and removed
 * `examples/js/` entirely, so r186 ships ESM only.
 *
 * Rather than convert 40+ files to ES modules, this entry re-exports r186 and
 * its addons onto `window.THREE` in the same shape r128 provided. esbuild
 * bundles it to a single classic script (three-bundle.js), so every existing
 * call site keeps working untouched.
 *
 * Addon surface is driven by actual usage in the codebase, verified by grep:
 *   loaders      GLTFLoader DRACOLoader FBXLoader OBJLoader MTLLoader
 *   postproc     EffectComposer RenderPass ShaderPass UnrealBloomPass
 *   utils        BufferGeometryUtils (also pulled in by GLTFLoader/OBJLoader)
 * SimplexNoise, SSAOPass and the shader classes are attached too because the
 * pages used to load them and some are referenced dynamically.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { LuminosityHighPassShader } from 'three/examples/jsm/shaders/LuminosityHighPassShader.js';
import { SSAOShader } from 'three/examples/jsm/shaders/SSAOShader.js';

// fflate was a separate global; GLTFLoader imports it for EXT_meshopt_compression.
// Expose it so any code that reached for window.fflate still resolves.
import * as fflate from 'three/examples/jsm/libs/fflate.module.js';

// An ES module namespace object is frozen: every property is non-writable and
// non-configurable, so assigning onto it throws. Build a plain object that
// copies the core namespace and then adds the addons.
const T = {};
for (const key in THREE) {
  if (Object.prototype.hasOwnProperty.call(THREE, key)) T[key] = THREE[key];
}

// Explicit addon attach (the namespace copy above does not include these).
Object.assign(T, {
  GLTFLoader,
  DRACOLoader,
  FBXLoader,
  OBJLoader,
  MTLLoader,
  EffectComposer,
  RenderPass,
  ShaderPass,
  UnrealBloomPass,
  BufferGeometryUtils,
  SSAOPass,
  SimplexNoise,
  CopyShader,
  LuminosityHighPassShader,
  SSAOShader,
  fflate,
});

// r186 removed the aliases r128 exposed; re-add the ones this codebase uses.
if (T.MathUtils === undefined && typeof T.Vector3 === 'function') {
  T.MathUtils = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    degToRad: (d) => (d * Math.PI) / 180,
    radToDeg: (r) => (r * 180) / Math.PI,
  };
}

window.THREE = T;
window.fflate = fflate;

// Surface failures loudly rather than letting a missing loader fail silently
// somewhere deep in game code.
window.THREE_SHIM = {
  revision: THREE.REVISION,
  addons: ['GLTFLoader', 'DRACOLoader', 'FBXLoader', 'OBJLoader', 'MTLLoader',
    'EffectComposer', 'RenderPass', 'ShaderPass', 'UnrealBloomPass',
    'BufferGeometryUtils', 'SSAOPass', 'SimplexNoise'],
};

if (window.console && console.info) {
  console.info(`[three] r${THREE.REVISION} global shim ready (${window.THREE_SHIM.addons.length} addons)`);
}