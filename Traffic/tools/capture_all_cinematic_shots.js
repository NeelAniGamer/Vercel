const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/neelg/.gemini/antigravity/brain/2d431989-10a8-40c2-bbc8-1f3d48a2fa79';

(async () => {
  console.log('Launching Chromium with SwiftShader...');
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('net::ERR')) {
      console.error('PAGE ERROR:', text);
    }
  });

  console.log('Navigating to Driving.html?level=1 on port 3000...');
  await page.goto('http://127.0.0.1:3000/Traffic/Driving.html?level=1', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });

  console.log('Waiting for Cutscene to activate...');
  await page.waitForFunction(() => {
    return window.Cutscene && window.Cutscene.isActive();
  }, null, { timeout: 60000 });

  console.log('Cutscene is active! Pausing auto-advance for controlled capture...');
  
  // Wait 1.5s for initial assets to settle
  await page.waitForTimeout(1500);

  const shotNames = [
    'shot0_approach',
    'shot1_the_line',
    'shot2_signal_head',
    'shot3_cctv_feed',
    'shot4_driver_window',
    'shot5_standoff_vikram',
    'shot6_vip_passenger',
    'shot7_gunshot_escape',
    'shot8_aftermath_crimescene',
    'shot9_dawn_shanti_galli'
  ];

  for (let idx = 0; idx < shotNames.length; idx++) {
    console.log(`\n--- Seeking to Shot ${idx}: ${shotNames[idx]} ---`);
    
    await page.evaluate((targetIdx) => {
      // Freeze frame at stable fraction (0.22, or 0.16 for gunshot shot 7)
      const p = (targetIdx === 7) ? 0.16 : 0.22;
      window.Cutscene.seek(targetIdx, p);
    }, idx);

    // Give the renderer 1200ms to settle positions, window animations, and lighting
    await page.waitForTimeout(1200);

    const info = await page.evaluate(() => {
      const state = window.Cutscene.state();
      return {
        idx: state ? state.idx : -1,
        scriptLen: state && state.script ? state.script.length : 0,
        sub: state && state.script && state.script[state.idx] ? state.script[state.idx].sub : null,
        title: state && state.script && state.script[state.idx] ? state.script[state.idx].title : null
      };
    });

    console.log('Shot info:', JSON.stringify(info));

    const outPath = path.join(ARTIFACT_DIR, `cinematic_${shotNames[idx]}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot to: ${outPath}`);
  }

  console.log('\nAll shots captured successfully!');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
