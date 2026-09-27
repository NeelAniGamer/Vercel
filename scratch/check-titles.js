const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'Career.html'), { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  await p.locator('.career-card').first().click();
  await p.waitForTimeout(600);
  const t = await p.locator('#modal-card .detail-box-title').allInnerTexts();
  console.log(JSON.stringify(t.slice(0, 12), null, 1));
  await b.close();
})();
