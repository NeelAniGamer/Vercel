const fs = require('fs');
const path = require('path');

const uiPath = path.join(__dirname, 'ui.js');
let uiContent = fs.readFileSync(uiPath, 'utf8');

const isCRLF = uiContent.includes('\r\n');
uiContent = uiContent.replace(/\r\n/g, '\n');

const modelPatch = fs.readFileSync(path.join(__dirname, 'character_model_patch.js'), 'utf8');
const studioPatch = fs.readFileSync(path.join(__dirname, 'character_studio_patch.js'), 'utf8');

// 1. Locate _buildHuman boundaries
const bhStart = uiContent.indexOf('const _buildHuman = (isPlayer = false, appearance) => {');
const bhEnd = uiContent.indexOf('function updateTrafficAuthUI() {');

if (bhStart === -1 || bhEnd === -1) {
  console.error('Failed to find _buildHuman boundaries', { bhStart, bhEnd });
  process.exit(1);
}

// 2. Locate Customizer boundaries
const custStartMatch = uiContent.match(/\(function\(\)\s*\{\s*const SKINS = \[/);
const custEndMatch = uiContent.match(/\/\/\s*───\s*TOKEN SHOP SYSTEM\s*───/);

if (!custStartMatch || !custEndMatch) {
  console.error('Failed to find Customizer boundaries', { custStartMatch, custEndMatch });
  process.exit(1);
}

const custStart = custStartMatch.index;
const custEnd = custEndMatch.index;

// Replace Customizer first (since it appears after _buildHuman)
uiContent = uiContent.slice(0, custStart) + studioPatch + '\n\n  ' + uiContent.slice(custEnd);

// Recalculate _buildHuman boundaries after first patch
const bhStart2 = uiContent.indexOf('const _buildHuman = (isPlayer = false, appearance) => {');
const bhEnd2 = uiContent.indexOf('function updateTrafficAuthUI() {');

uiContent = uiContent.slice(0, bhStart2) + modelPatch + '\n\n' + uiContent.slice(bhEnd2);

if (isCRLF) {
  uiContent = uiContent.replace(/\n/g, '\r\n');
}

fs.writeFileSync(uiPath, uiContent, 'utf8');
console.log('Patch successfully applied to ui.js!');
