// Sanity check for the asset-filename pattern used by find-dead-models.js.
//
// The pattern is imported from that file rather than restated here, so the two
// cannot drift apart: change the character class there and this test changes
// with it. It matters because the pattern decides which 3D assets are treated
// as live, and a silently broken character class would start marking real
// assets as dead.
const { ASSET_FILENAME_SOURCE } = require('./find-dead-models.js');

const RE = new RegExp(ASSET_FILENAME_SOURCE, 'gi');

const cases = [
  ['taxi.glb', true],
  ['low_poly_house-2.glb', true],
  ['upload (1).FBX', true],
  ['GLB format/sedan.glb', true],
  ['Polygon_1_normal.png', true],
  ['building-type-a.glb', true],
  ['Set_B_Tiles_01.glb', true],
  ['no-extension', false],
];

let failed = 0;
for (const [input, shouldMatch] of cases) {
  RE.lastIndex = 0;
  const got = RE.test(input);
  if (got !== shouldMatch) {
    failed++;
    console.log(`FAIL: ${JSON.stringify(input)} expected ${shouldMatch}, got ${got}`);
  }
}

console.log(failed === 0
  ? `asset-filename pattern: all ${cases.length} cases pass`
  : `asset-filename pattern: ${failed} of ${cases.length} cases failed`);
process.exit(failed === 0 ? 0 : 1);
