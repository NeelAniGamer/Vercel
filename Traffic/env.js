/**
 * env model — binary source, loaded on demand by GLTFLoader.
 *
 * Previously this was a 4.6 MB base64 data URI inlined in JS,
 * which the browser had to download, parse and base64-decode before the first
 * frame. It is now a 3.43 MB .glb fetched only when a level
 * actually asks for it.
 *
 * start.js reads window.MODELS[key] and passes it straight to loader.load(),
 * which accepts a URL exactly as it accepted the data URI — so the contract
 * is unchanged and no consumer needed editing.
 *
 * sha256: ecdecf51165b585129801fdd3949d81f15863e089417d24287159731cedcbae9
 */
window.MODELS = window.MODELS || {};
window.MODELS['env'] = 'Models/embedded/env.glb';
