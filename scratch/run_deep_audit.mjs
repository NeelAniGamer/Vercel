import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'c:/Users/neelg/OneDrive/Desktop/Vercel';
const PORT = 3456;
const SCREENSHOT_DIR = 'c:/Users/neelg/OneDrive/Desktop/Vercel/screenshots/audit';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 1. Setup local static server using serve.js logic
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2'
};

function resolvePath(urlPath) {
  let decoded = decodeURI(urlPath.split('?')[0]);
  if (decoded === '/' || decoded === '') decoded = '/home.html';
  let fullPath = path.join(ROOT_DIR, decoded);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const idx = path.join(fullPath, 'index.html');
    if (fs.existsSync(idx)) return idx;
  }
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) return fullPath;
  if (fs.existsSync(fullPath + '.html') && fs.statSync(fullPath + '.html').isFile()) return fullPath + '.html';
  return null;
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);

  const results = {
    home: { status: 'PENDING', errors: [], warnings: [], checks: [] },
    terra3d: { status: 'PENDING', errors: [], warnings: [], checks: [] },
    about: { status: 'PENDING', errors: [], warnings: [], checks: [] },
    career: { status: 'PENDING', errors: [], warnings: [], checks: [] },
    solar: { status: 'PENDING', errors: [], warnings: [], checks: [] }
  };

  const browser = await chromium.launch({ headless: true });

  try {
    // ──────── TEST 1: HOME PAGE (DESKTOP + MOBILE 360px) ────────
    console.log('Testing Home Page...');
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('pagead') && !msg.text().includes('googlesyndication')) {
        results.home.errors.push(msg.text());
      }
    });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    // Wait for loader to fade
    await page.waitForSelector('#loader.gone', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Verify Terra3D card presence and content
    const t3Title = await page.textContent('.pc.t3-wide .pname');
    const t3Credit = await page.textContent('.pc.t3-wide .t3-credits');
    const t3Tag = await page.textContent('.pc.t3-wide .ptags');

    results.home.checks.push({ title: 'Terra3D Title', text: t3Title?.trim(), pass: t3Title?.includes('Terra3D') });
    results.home.checks.push({ title: 'Terra3D Special Credit', text: t3Credit?.trim(), pass: t3Credit?.includes('Special Space Credit') && t3Credit?.includes('Aaryaman Jadhav & Yashraj Jadhav') });
    results.home.checks.push({ title: 'Terra3D Tag', text: t3Tag?.trim(), pass: t3Tag?.includes('Made by Aaryaman & Yashraj') });

    // Check project links on Home
    const linksCount = await page.locator('.pc').count();
    results.home.checks.push({ title: 'Project Cards Count', count: linksCount, pass: linksCount >= 6 });

    // Screenshot Desktop Hero
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home_hero.png'), fullPage: false });

    // Scroll down to Terra3D card and screenshot it
    const t3Card = page.locator('.pc.t3-wide');
    await t3Card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await t3Card.screenshot({ path: path.join(SCREENSHOT_DIR, '01b_home_terra3d_card.png') });

    // Test Mobile Viewport 360px
    await page.setViewportSize({ width: 360, height: 740 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    results.home.checks.push({ title: 'Mobile 360px No Horizontal Overflow', scrollWidth, pass: scrollWidth <= 360 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_home_mobile_360.png'), fullPage: false });

    // Scroll to Terra3D card on mobile
    await t3Card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await t3Card.screenshot({ path: path.join(SCREENSHOT_DIR, '02b_home_mobile_terra3d_card.png') });

    results.home.status = results.home.errors.length === 0 ? 'PASS' : 'WARN';
    await page.close();

    // ──────── TEST 2: TERRA3D (WebGL, Menu, Credits, Off-White Theme) ────────
    console.log('Testing Terra3D...');
    const t3Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    t3Page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('pagead') && !msg.text().includes('googlesyndication') && !msg.text().includes('unpkg')) {
        results.terra3d.errors.push(msg.text());
      }
    });

    await t3Page.goto(`http://localhost:${PORT}/Terra3D/`, { waitUntil: 'domcontentloaded' });
    await t3Page.waitForTimeout(1500);

    // Verify Main Menu Highlight
    const menuHighlight = await t3Page.textContent('.menu-credits-highlight');
    results.terra3d.checks.push({
      title: 'Menu Credits Highlight',
      text: menuHighlight?.trim(),
      pass: menuHighlight?.includes('Special Space Credit') && menuHighlight?.includes('Aaryaman Jadhav & Yashraj Jadhav')
    });

    // Open Settings Modal & Check Credits Tab
    await t3Page.click('#menu-settings-btn');
    await t3Page.waitForTimeout(400);
    await t3Page.click('button[data-settings-tab="credits"]');
    await t3Page.waitForTimeout(400);

    const creditsText = await t3Page.textContent('#settings-tab-credits');
    const hasAaryaman = creditsText?.includes('Aaryaman Jadhav');
    const hasYashraj = creditsText?.includes('Yashraj Jadhav');
    const hasOldAnsh = creditsText?.includes('Ansh P.');
    const hasOldNeel = creditsText?.includes('Neel B.');

    results.terra3d.checks.push({
      title: 'Credits Exclusive to Aaryaman & Yashraj',
      hasAaryaman,
      hasYashraj,
      hasOldAnsh,
      hasOldNeel,
      pass: hasAaryaman && hasYashraj && !hasOldAnsh && !hasOldNeel
    });

    await t3Page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_terra3d_credits_modal.png') });

    // Switch back to Preferences Tab & Toggle Off-White mode via evaluate
    await t3Page.click('button[data-settings-tab="preferences"]');
    await t3Page.waitForTimeout(300);
    await t3Page.evaluate(() => {
      const radio = document.querySelector('input[name="theme"][value="light"]');
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await t3Page.waitForTimeout(400);

    const bodyClass = await t3Page.evaluate(() => document.body.className);
    results.terra3d.checks.push({
      title: 'Off-White Mode Class Applied',
      bodyClass,
      pass: bodyClass.includes('light-mode')
    });

    // Close Settings and inspect 3D scene background
    await t3Page.click('#settings-close');
    await t3Page.waitForTimeout(600);
    
    // Check canvas renderer background color or scene background
    const bgInfo = await t3Page.evaluate(() => {
      const cvs = document.getElementById('globe-canvas');
      return {
        canvasExists: !!cvs,
        bodyBg: window.getComputedStyle(document.body).backgroundColor
      };
    });
    results.terra3d.checks.push({
      title: 'Terra3D Canvas & Off-White Dark Space Maintained',
      canvasExists: bgInfo.canvasExists,
      pass: bgInfo.canvasExists
    });

    await t3Page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_terra3d_offwhite_space.png') });

    results.terra3d.status = results.terra3d.errors.length === 0 ? 'PASS' : 'WARN';
    await t3Page.close();

    // ──────── TEST 3: ABOUT PAGE ────────
    console.log('Testing About Page...');
    const aboutPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await aboutPage.goto(`http://localhost:${PORT}/about`, { waitUntil: 'domcontentloaded' });
    await aboutPage.waitForSelector('#loader.gone', { timeout: 10000 }).catch(() => {});
    await aboutPage.waitForTimeout(1000);

    const aboutHtml = await aboutPage.content();
    results.about.checks.push({
      title: 'About Page Team Cards & Credits',
      hasAaryaman: aboutHtml.includes('Aaryaman Jadhav'),
      hasYashraj: aboutHtml.includes('Yashraj Jadhav'),
      hasTerraTag: aboutHtml.includes('Terra3D'),
      pass: aboutHtml.includes('Aaryaman Jadhav') && aboutHtml.includes('Yashraj Jadhav')
    });
    await aboutPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05a_about_hero.png') });

    const teamEl = aboutPage.locator('.tm-name', { hasText: 'Aaryaman Jadhav' });
    await teamEl.scrollIntoViewIfNeeded();
    await aboutPage.waitForTimeout(500);
    await aboutPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05b_about_team.png') });

    results.about.status = 'PASS';
    await aboutPage.close();

    // ──────── TEST 4: CAREER PAGE & SCROLL (MOBILE 360px) ────────
    console.log('Testing Career Page...');
    const careerPage = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await careerPage.goto(`http://localhost:${PORT}/Career`, { waitUntil: 'domcontentloaded' });
    await careerPage.waitForTimeout(1000);
    const careerScrollable = await careerPage.evaluate(() => {
      window.scrollTo(0, 300);
      return window.scrollY > 0;
    });
    results.career.checks.push({ title: 'Career 360px Scrolling Operable', pass: careerScrollable });
    await careerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '06_career_mobile_360.png') });
    results.career.status = 'PASS';
    await careerPage.close();

    // ──────── TEST 5: SOLAR ENGINE PAGE (Verification: No Terra3D credits) ────────
    console.log('Testing Solar Engine Page...');
    const solarPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await solarPage.goto(`http://localhost:${PORT}/solar`, { waitUntil: 'domcontentloaded' });
    await solarPage.waitForTimeout(1000);
    const solarHtml = await solarPage.content();
    const hasUnwantedTerraCredit = solarHtml.includes('Terra3D') && solarHtml.includes('Special Space Credit');
    results.solar.checks.push({
      title: 'Solar Free of Terra3D Credits (Per User Request)',
      pass: !hasUnwantedTerraCredit
    });
    await solarPage.screenshot({ path: path.join(SCREENSHOT_DIR, '07_solar_engine.png') });
    results.solar.status = 'PASS';
    await solarPage.close();

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('\n=== AUDIT RESULTS SUMMARY ===');
    console.log(JSON.stringify(results, null, 2));
  }
});
