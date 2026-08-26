const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 750 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  // 1. Capture Academy Hub
  console.log('Capturing 1. Hub...');
  await page.goto('http://localhost:3000/Traffic/Academy.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('traffic_academy_tutorial_seen', 'true');
    const tut = document.getElementById('academy-tutorial-overlay');
    if (tut) tut.classList.remove('on');
    if (window.ui && typeof window.ui.show === 'function') window.ui.show('ss', { instant: true });
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'Traffic/tut_1_hub.png' });

  // 2. Capture Curriculum Screen
  console.log('Capturing 2. Curriculum...');
  await page.evaluate(() => {
    if (window.ui && typeof window.ui.showLevels === 'function') window.ui.showLevels();
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'Traffic/tut_2_curriculum.png' });

  // 3. Capture Briefing Screen
  console.log('Capturing 3. Briefing...');
  await page.evaluate(() => {
    const firstLv = (window.LVS && window.LVS.length > 0) ? window.LVS[0] : { id: 1, title: 'Signal Basics', v: 'Car', modes: ['car', 'bike'] };
    if (!window.LVS || window.LVS.length === 0) window.LVS = [firstLv];
    if (window.ui && typeof window.ui.showBriefing === 'function') {
      window.ui.showBriefing(firstLv.id);
    }
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'Traffic/tut_3_briefing.png' });

  // 4. Capture Quiz Screen
  console.log('Capturing 4. Quiz...');
  await page.evaluate(() => {
    const firstLv = (window.LVS && window.LVS.length > 0) ? window.LVS[0] : { id: 1, title: 'Signal Basics' };
    if (window.ui && typeof window.ui.showQuiz === 'function') {
      window.ui.showQuiz(firstLv.id);
    } else if (window.ui && typeof window.ui.show === 'function') {
      window.ui.show('screen-quiz', { instant: true });
    }
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'Traffic/tut_5_quiz.png' });

  // 5. Capture Badges & Profile Screen
  console.log('Capturing 5. Badges & Profile...');
  await page.evaluate(() => {
    if (window.ui && typeof window.ui.showBadges === 'function') {
      window.ui.showBadges();
    } else if (window.ui && typeof window.ui.show === 'function') {
      window.ui.show('screen-badges', { instant: true });
    }
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'Traffic/tut_6_profile.png' });

  // 6. Capture Certificate Screen
  console.log('Capturing 6. Certificate...');
  await page.evaluate(() => {
    if (window.ui && typeof window.ui.showCertificate === 'function') {
      window.ui.showCertificate();
    } else if (window.ui && typeof window.ui.show === 'function') {
      window.ui.show('screen-certificate', { instant: true });
    }
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'Traffic/tut_7_certificate.png' });

  // 7. Capture 3D Simulator (Driving.html)
  console.log('Capturing 7. 3D Driving Simulator...');
  await page.goto('http://localhost:3000/Traffic/Driving.html?lv=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'Traffic/tut_4_simulator.png' });

  // 8. Capture Mobile / Pull to Refresh View
  console.log('Capturing 8. Mobile & Pull to Refresh...');
  await page.goto('http://localhost:3000/Traffic/Academy.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const ptr = document.getElementById('pull-to-refresh-indicator');
    if (ptr) {
      ptr.classList.add('ptr-visible');
      ptr.style.top = '25px';
    }
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'Traffic/tut_8_mobile.png' });

  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  await browser.close();
}

capture().catch(err => console.error('Capture script error:', err));
