/**
 * lambo model — binary source, loaded on demand by GLTFLoader.
 *
 * Previously this was a 14.5 MB base64 data URI inlined in JS,
 * which the browser had to download, parse and base64-decode before the first
 * frame. It is now a 10.84 MB .glb fetched only when a level
 * actually asks for it.
 *
 * start.js reads window.MODELS[key] and passes it straight to loader.load(),
 * which accepts a URL exactly as it accepted the data URI — so the contract
 * is unchanged and no consumer needed editing.
 *
 * sha256: 4448583a7a0858d97e624166adc1a1005b7f2532013c21688a73ba9e08e06b20
 */
window.MODELS = window.MODELS || {};
window.MODELS['lambo'] = 'Models/embedded/lambo.glb';
