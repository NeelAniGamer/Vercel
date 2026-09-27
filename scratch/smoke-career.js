// Browser smoke test for Career.html: load it, exercise the new filters, and
// report console errors plus any filter option that returns zero careers.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const url = 'file://' + path.resolve(__dirname, '..', 'Career.html');
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);

  const cards = await page.locator('.career-card').count();
  console.log('initial cards rendered:', cards);
  console.log('results label:', await page.locator('#results-count').innerText());
  console.log('mode buttons:', await page.locator('#view-mode-bar .mode-btn').allInnerTexts());

  // Open the extra filter panel
  await page.click('#more-filters-btn');
  await page.waitForTimeout(300);
  console.log('panel open:', await page.locator('#more-filters.open').count() === 1);

  // Every pill in the new groups must lead to at least one career.
  const zeros = [];
  for (const group of ['edu-filters', 'degree-filters', 'interest-filters', 'domain-filters', 'stream-filters']) {
    const btns = await page.locator('#' + group + ' .pill-btn').count();
    for (let i = 0; i < btns; i++) {
      const btn = page.locator('#' + group + ' .pill-btn').nth(i);
      const label = (await btn.innerText()).trim();
      if (label.startsWith('All ') || label.startsWith('Any ')) continue;
      await btn.click();
      await page.waitForTimeout(120);
      const countText = await page.locator('#results-count').innerText();
      const shown = parseInt((countText.match(/of (\d+) careers/) || [0, 0])[1], 10);
      if (!shown) zeros.push(group + ' -> ' + label);
      const cardsNow = await page.locator('.career-card').count();
      if (!cardsNow) zeros.push(group + ' -> ' + label + ' (no cards)');
    }
    // back to "all" for this group
    await page.locator('#' + group + ' .pill-btn').first().click();
    await page.waitForTimeout(80);
  }
  console.log('filters with zero results:', zeros.length ? zeros : 'none');

  // Quick-view modes
  for (const mode of ['flagship', 'growth', 'ai', 'high_earning', 'all']) {
    await page.click('.mode-btn[data-mode="' + mode + '"]');
    await page.waitForTimeout(150);
    const t = await page.locator('#results-count').innerText();
    console.log('  mode ' + mode + ': ' + t);
  }

  // Search a small BLS alias title to make sure niche jobs resolve.
  await page.fill('#search-input', 'Algebra Tutor');
  await page.waitForTimeout(400);
  console.log('search "Algebra Tutor":', await page.locator('#results-count').innerText());
  await page.fill('#search-input', 'MBBS');
  await page.waitForTimeout(400);
  console.log('search "MBBS":', await page.locator('#results-count').innerText());
  await page.fill('#search-input', '');
  await page.waitForTimeout(300);

  // Open a career detail modal and check the tabs render.
  await page.locator('.career-card').first().click();
  await page.waitForTimeout(600);
  const modalOpen = await page.locator('#detail-modal.open').count();
  const tabs = await page.locator('.modal-tab-btn').count();
  console.log('detail modal open:', modalOpen === 1, '| tabs:', tabs);
  console.log('modal title:', await page.locator('#modal-card .modal-title').innerText());
  console.log('modal tab labels:', await page.locator('#modal-card .modal-tab-btn').allInnerTexts());
  console.log('modal section titles:', (await page.locator('#modal-card .detail-box-title').allInnerTexts()).slice(0, 4));
  await page.click('#detail-modal .modal-close');
  await page.waitForTimeout(200);

  console.log('console/page errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(errors.length || zeros.length ? 1 : 0);
})();
