/**
 * auto model — binary source, loaded on demand by GLTFLoader.
 *
 * Previously this was a 1.1 MB base64 data URI inlined in JS,
 * which the browser had to download, parse and base64-decode before the first
 * frame. It is now a 0.79 MB .glb fetched only when a level
 * actually asks for it.
 *
 * start.js reads window.MODELS[key] and passes it straight to loader.load(),
 * which accepts a URL exactly as it accepted the data URI — so the contract
 * is unchanged and no consumer needed editing.
 *
 * sha256: 1508ff5cb11a8f94e9319819089ecf6585ef1e4486192bfb8642d46c45c66a05
 */
window.MODELS = window.MODELS || {};
window.MODELS['auto'] = 'Models/embedded/auto.glb';
