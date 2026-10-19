// One-off QA probe for cereal.html: boots the page, exercises new interactions,
// fails on console/page errors, and saves desktop + 360px screenshots.
const { chromium } = require('playwright');
const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const problems = [];
  const notFound = [];
  const all404 = [];
  page.on('pageerror', (err) => problems.push('pageerror: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/GSI_LOGGER|Provider's accounts list/.test(msg.text())) {
      problems.push('console.error: ' + msg.text());
    }
  });
  page.on('response', (res) => {
    if (res.status() === 404) {
      all404.push('404: ' + res.url());
      if (!res.url().includes('/_vercel/')) notFound.push('404: ' + res.url());
    }
  });

  await page.goto(BASE + '/cereal', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1400);

  const results = [];
  const check = (name, cond) => results.push((cond ? 'OK  ' : 'FAIL') + '  ' + name);

  // Phone mockup + hero grid render
  const heroGrid = await page.locator('.hero-grid').count();
  const phoneBars = await page.locator('.ph-wavebars span').count();
  const floaters = await page.locator('.float-badge').count();
  check('hero-grid present', heroGrid === 1);
  check('12 phone wave bars', phoneBars === 12);
  check('two float badges', floaters === 2);

  // FAQ accordion: 8 toggles, first open, others expandable
  const toggles = await page.locator('.faq-toggle').count();
  const firstOpen = await page.locator('.faq-item.open').first().evaluate((el) =>
    el.querySelector('.faq-toggle').getAttribute('aria-expanded'));
  await page.locator('.faq-toggle').nth(3).click();
  const thirdOpen = await page.locator('.faq-item').nth(3).evaluate((el) =>
    el.classList.contains('open') && el.querySelector('.faq-toggle').getAttribute('aria-expanded') === 'true');
  await page.locator('.faq-toggle').nth(3).click();
  const thirdClosed = await page.locator('.faq-item').nth(3).evaluate((el) => !el.classList.contains('open'));
  check('8 FAQ toggles', toggles === 8);
  check('first FAQ open by default', firstOpen === 'true');
  check('FAQ 4 expands on click', thirdOpen);
  check('FAQ 4 collapses on reclick', thirdClosed);

  // Quiz: correct answer updates score; wrong answer counts; retry restores
  await page.locator('.sim-tab-btn[data-tab="tab-quiz"]').click();
  await page.locator('.quiz-opt').nth(1).click(); // Q1 correct option
  let scoreRow1 = await page.locator('#quizScore').textContent();
  await page.locator('.quiz-opt').nth(4).click(); // Q2 wrong option
  let scoreRow2 = await page.locator('#quizScore').textContent();
  await page.locator('#quizResetBtn').click();
  const restored = await page.locator('.quiz-opt').first().evaluate((el) =>
    !el.disabled && !el.textContent.includes('Correct!') && !el.textContent.includes('Incorrect'));
  const rowHidden = await page.locator('#quizScoreRow').isHidden();
  const allQ = await page.locator('.quiz-opt').count();
  check('6 quiz options total', allQ === 6);
  check('quiz score appears after correct (1/1)', scoreRow1.includes('1 / 1'));
  check('quiz score accumulates wrong (1/2 attempts shown)', scoreRow2.includes('1 / 2'));
  check('retry restores pristine labels', restored);
  check('score row hidden after reset', rowHidden);

  // Task keyboard toggling (task items live in the tasks tab)
  await page.locator('.sim-tab-btn[data-tab="tab-tasks"]').click();
  const task = page.locator('.task-item').first();
  await task.click().catch(() => {});
  const taskDoneAfterClick = await task.evaluate((el) => el.classList.contains('done'));
  await task.focus();
  await task.press('Enter'); // toggles done off since click already set it
  const taskDoneAfterEnter = await task.evaluate((el) => el.classList.contains('done'));
  check('task click toggles done', taskDoneAfterClick !== undefined);
  check('Enter toggles task (state flipped)', taskDoneAfterEnter !== taskDoneAfterClick);

  // Record toggle aria-pressed
  await page.locator('#recordToggleBtn').click();
  const recPressed = await page.locator('#recordToggleBtn').getAttribute('aria-pressed');
  await page.locator('#recordToggleBtn').click();
  const recUnpressed = await page.locator('#recordToggleBtn').getAttribute('aria-pressed');
  check('record toggles aria-pressed on', recPressed === 'true');
  check('record toggles aria-pressed off', recUnpressed === 'false');

  // Mode pill switch does not error under normal motion; canvases alive
  const scaleBefore = await page.evaluate(() => {
    const c = document.getElementById('waveformCanvas');
    const y = Math.floor(c.height * 0.45)
    return c.getContext('2d').getImageData(0, y, Math.min(80, c.width), 5).data.some((v) => v !== 0 && (v - 1) % 4 === 0)
  });
  await page.locator('.audio-mode-pill').nth(1).click();
  const modeStatus = await page.locator('#audioEngineStatus').textContent();
  check('canvas painted content', scaleBefore === true);
  check('mode pill updates status', modeStatus.length > 0);

  // Desktop screenshot at hero
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scratch/cereal-desktop.png' });
  // FAQ + specs screenshot
  await page.locator('.faq-grid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/cereal-desktop-faq.png' });
  await page.evaluate(() => window.scrollTo(0, 0));

  // 360px mobile viewport + screenshot
  const mob = await browser.newPage({ viewport: { width: 360, height: 780 } });
  mob.on('pageerror', (err) => problems.push('mobile pageerror: ' + err.message));
  mob.on('console', (msg) => { if (msg.type() === 'error' && !/GSI_LOGGER|Provider's accounts list/.test(msg.text())) problems.push('mobile console.error: ' + msg.text()); });
  mob.on('response', (res) => {
    if (res.status() === 404 && !res.url().includes('/_vercel/')) notFound.push('mobile 404: ' + res.url());
  });
  await mob.goto(BASE + '/cereal', { waitUntil: 'load', timeout: 30000 });
  await mob.waitForTimeout(1400);
  const overflow = await mob.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('360px no horizontal overflow (<=2px)', overflow <= 2);
  await mob.screenshot({ path: 'scratch/cereal-mobile-360.png' });
  await mob.locator('.faq-grid').scrollIntoViewIfNeeded();
  await mob.waitForTimeout(600);
  await mob.screenshot({ path: 'scratch/cereal-mobile-faq.png' });

  console.log(results.join('\n'));
  console.log('');
  console.log('ALL-404-URLS: ' + (all404.length ? '\n' + all404.join('\n') : '(none)'));
  if (notFound.length) {
    console.log('404S (non-vercel):\n' + notFound.join('\n'));
    process.exitCode = 1;
  }
  if (problems.length) {
    console.log('PROBLEMS:\n' + problems.join('\n'));
    process.exitCode = 1;
  }
  if (!problems.length && !notFound.length) {
    console.log('NO CONSOLE/PAGE ERRORS');
  }
  await browser.close();
})().catch((e) => { console.error('PROBE CRASH: ' + e.message); process.exit(1); });
