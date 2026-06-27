const fs = require('fs');
let st = fs.readFileSync('start.js', 'utf8');

// Ensure PRELOADED_MODELS_DONE is set when models finish loading
if (!st.includes('window.PRELOADED_MODELS_DONE = true;')) {
    st = st.replace('callback();\n            return;', 'window.PRELOADED_MODELS_DONE = true;\n            callback();\n            return;');
}

// Modify the autoStart condition to also wait for models
st = st.replace('if (ui.cfg && ui.cfg.levels) {', 'if (ui.cfg && ui.cfg.levels && window.PRELOADED_MODELS_DONE) {');

fs.writeFileSync('start.js', st);
console.log('start.js autoStart patched');
