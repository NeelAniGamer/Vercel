const fs = require('fs');
const path = require('path');
const vm = require('vm');

const files = [
  'col-3d/core/DisposalRegistry.js',
  'col-3d/core/ThemeSync.js',
  'col-3d/core/SceneManager.js',
  'col-3d/loaders/LazyLoader.js',
  'col-3d/scenes/StudioOrrery.js',
  'col-3d/scenes/ConstellationMinds.js',
  'col-3d/scenes/KnowledgeArchitecture.js',
  'col-3d/scenes/CosmicNavigator.js',
  'col-3d/scenes/ModularCore.js',
  'col-3d/scenes/GenericScene.js',
  'col-3d/scenes/SnehAshaScene.js',
  'col-3d.js'
];

for (const file of files) {
  try {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    new vm.Script(code);
    console.log(`✓ Syntax valid: ${file}`);
  } catch (err) {
    console.error(`✗ Syntax error in ${file}:`, err.message);
  }
}
