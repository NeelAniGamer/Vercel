const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'Career.html'), { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  await p.fill('#search-input', 'Sommelier');
  await p.waitForTimeout(400);
  console.log('search:', await p.locator('#results-count').innerText());
  await p.locator('.career-card').first().click();
  await p.waitForTimeout(600);
  console.log('title:', await p.locator('#modal-card .modal-title').innerText());
  const boxes = await p.locator('#modal-card .detail-box-title').allInnerTexts();
  console.log('boxes:', boxes.length);
  const overview = await p.locator('#modal-card .detail-box p').first().innerText();
  console.log('overview:', overview.slice(0, 160));
  await b.close();
})();
