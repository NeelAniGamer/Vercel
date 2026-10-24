'use strict';

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:/Users/neelg/.gemini/antigravity/brain/cd2cfba3-bf2c-4d71-8445-5609e97df8de';

async function main() {
  console.log('[Capture] Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });
  page.setDefaultTimeout(90000);

  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
  });

  page.on('console', msg => console.log(`[Browser ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.log('[PageError]', err.message));

  console.log('[Capture] Navigating to Driving.html?level=1&mode=story...');
  await page.goto('http://localhost:3000/Traffic/Driving.html?level=1&mode=story', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });

  console.log('[Capture] Waiting for Cutscene to activate...');
  await page.waitForFunction(() => {
    return window.Cutscene && typeof window.Cutscene.isActive === 'function' && window.Cutscene.isActive();
  }, { timeout: 90000 });

  console.log('[Capture] Cutscene is ACTIVE!');

  const captureShot = async (targetIdx, filename, waitMs = 1200) => {
    console.log(`[Capture] Seeking to shot ${targetIdx}...`);
    await page.evaluate((idx) => {
      if (window.Cutscene && typeof window.Cutscene.seek === 'function') {
        window.Cutscene.seek(idx);
      }
    }, targetIdx);

    await page.waitForTimeout(waitMs);
    const shotInfo = await page.evaluate(() => {
      return window.Cutscene ? window.Cutscene.state() : null;
    });
    console.log(`[Capture] State: idx=${shotInfo ? shotInfo.idx : '?'}`);

    const outPath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: outPath });
    console.log(`[Capture] Saved screenshot to ${outPath}`);
  };

  // Shot 0 (idx 0): Approach & slowing down
  await captureShot(0, 'verified_shot0_approach.png', 1500);

  // Shot 1 (idx 1): The white line & Vikram
  await captureShot(1, 'verified_shot1_the_line.png', 1200);

  // Shot 2 (idx 2): Physical CCTV camera on pole
  await captureShot(2, 'verified_shot2_cctv_camera_pole.png', 1200);

  // Shot 3 (idx 3): CCTV surveillance monitor feed
  await captureShot(3, 'verified_shot3_cctv_feed_view.png', 1200);

  // Shot 4 (idx 4): Driver window lowered
  await captureShot(4, 'verified_shot4_driver_window.png', 1500);

  // Shot 5 (idx 5): Reverse angle on Vikram holding the white line
  await captureShot(5, 'verified_shot5_standoff_vikram.png', 1500);

  // Shot 6 (idx 6): VIP rear window lowered & passenger
  await captureShot(6, 'verified_shot6_vip_passenger_window.png', 1800);

  // Staged props: BEST Bus Stop Shelter & Chai Tapri
  console.log('[Capture] Capturing BEST Bus Stop and street dressing...');
  await page.evaluate(() => {
    if (window.Cutscene && typeof window.Cutscene.seek === 'function') {
      window.Cutscene.seek(1);
    }
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    if (window.game && window.game.camera) {
      window.game.camera.position.set(7.5, 2.8, -27.5);
      window.game.camera.lookAt(13.5, 1.4, -20.0);
    }
  });
  await page.waitForTimeout(800);
  const busStopOut = path.join(OUT_DIR, 'verified_bus_stop.png');
  await page.screenshot({ path: busStopOut });
  console.log(`[Capture] Saved bus stop screenshot to ${busStopOut}`);

  // Now test gameplay map
  console.log('[Capture] Skipping cutscene to inspect gameplay map...');
  await page.evaluate(() => {
    if (window.Cutscene && typeof window.Cutscene.skip === 'function') {
      window.Cutscene.skip();
    }
  });

  await page.waitForTimeout(3000);
  const gameplayOut = path.join(OUT_DIR, 'verified_gameplay_level1_city_map.png');
  await page.screenshot({ path: gameplayOut });
  console.log(`[Capture] Saved gameplay screenshot to ${gameplayOut}`);

  await browser.close();
  console.log('[Capture] All screenshots saved successfully!');
}

main().catch(err => {
  console.error('[Capture Error]', err);
  process.exit(1);
});
