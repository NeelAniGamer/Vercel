/**
 * bus model — binary source, loaded on demand by GLTFLoader.
 *
 * Previously this was a 2.7 MB base64 data URI inlined in JS,
 * which the browser had to download, parse and base64-decode before the first
 * frame. It is now a 2.04 MB .glb fetched only when a level
 * actually asks for it.
 *
 * start.js reads window.MODELS[key] and passes it straight to loader.load(),
 * which accepts a URL exactly as it accepted the data URI — so the contract
 * is unchanged and no consumer needed editing.
 *
 * sha256: d3cb8a483f985d2e8a1cf7b80b05f2255415aaac8f4b0c28a14b2143186195da
 */
window.MODELS = window.MODELS || {};
window.MODELS['bus'] = 'Models/embedded/bus.glb';
