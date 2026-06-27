const fs = require('fs');
let ac = fs.readFileSync('Academy.html', 'utf8');

// The scripts to remove:
const scriptsToRemove = [
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/math/SimplexNoise.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/SSAOShader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/SSAOPass.js"></script>',
    '<script src="vehicles.js"></script>',
    '<script src="game_core.js"></script>',
    '<script src="start.js"></script>'
];

scriptsToRemove.forEach(s => {
    ac = ac.replace(s, '');
});

// Also remove any `document.body.appendChild` logic in the head error handler just to be safe.
ac = ac.replace(/document\.body\.appendChild\(errDiv\);/g, "if(document.body) document.body.appendChild(errDiv);");

fs.writeFileSync('Academy.html', ac);
console.log('Academy.html thoroughly cleaned');
