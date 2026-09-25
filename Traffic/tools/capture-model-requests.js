// Record every Traffic/Models request the browser makes, across every level.
//
// Writes a JSON array of site-relative paths, ready for
// find-dead-models.js. Capturing this by hand is how a live asset ends up on
// the dead list, so generate it instead of transcribing it.
//
// This script drives Playwright over a local static server serving dist/.
// Start the server first, then run it from the repo root:
//
//   python -m http.server 3001 --directory dist
//   node Traffic/tools/capture-model-requests.js http://localhost:3001 out.json
const fs = require('fs');
const path = require('path');

const base = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '');
const outFile = process.argv[3] || path.join(__dirname, 'model-requests.json');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('Playwright is not available in this project. Install it, or capture the list another way.');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const requested = new Set();
  page.on('response', res => {
    const u = res.url();
    if (!/\/Traffic\/Models\//.test(u)) {return;}
    // A 404 is not proof the asset is wanted; it is proof something asked for
    // a path that does not exist. Recording those would let a genuinely
    // missing file be classified as live and hide a real bug.
    if (res.status() >= 400) {
      console.error(`  ${res.status()} (not recorded): ${decodeURIComponent(u)}`);
      return;
    }
    requested.add(decodeURIComponent(u.replace(base, '')));
  });

  await page.goto(`${base}/Traffic/Driving.html`, { waitUntil: 'load' });
  await page.waitForTimeout(8000);

  const keys = await page.evaluate(() => Object.keys(window.LVS || {}));
  console.log(`sweeping ${keys.length} levels`);

  for (const key of keys) {
    await page.evaluate(async (k) => {
      const g = window.game;
      try { window.ui.cur = window.LVS[k]; await g._actualStart(window.LVS[k]); } catch (e) {}
    }, key);
    await page.waitForTimeout(900);
  }

  await browser.close();

  const list = [...requested].sort();
  fs.writeFileSync(outFile, JSON.stringify(list, null, 2));
  console.log(`\nrecorded ${list.length} model request(s) -> ${outFile}`);
  console.log('Next: node Traffic/tools/find-dead-models.js ' + outFile);
})().catch(e => { console.error(e); process.exit(1); });
