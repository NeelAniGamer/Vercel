const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERR] ${err.message}`));

  console.log('Navigating to Driving.html?level=1...');
  await page.goto('http://localhost:3000/Traffic/Driving.html?level=1', { waitUntil: 'load' });

  console.log('Waiting for game and startLevel...');
  // Wait up to 30s for Cutscene to become active OR startLevel to run
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const g = window.game;
      const cs = window.Cutscene;
      return {
        hasGame: !!g,
        hasScene: !!(g && g.scene),
        csActive: !!(cs && cs.isActive && cs.isActive()),
        csState: cs && cs.state ? cs.state() : null,
        loadingOn: !!document.getElementById('loading')?.classList?.contains('on'),
        gcOn: !!document.getElementById('gc')?.classList?.contains('on')
      };
    });
    console.log(`Poll ${i}: csActive=${state.csActive}, loading=${state.loadingOn}, gc=${state.gcOn}`);
    if (state.csActive) {
      break;
    }
  }

  // Capture screenshot during cutscene
  await page.screenshot({ path: path.join(__dirname, 'cutscene_now.png') });
  console.log('Saved cutscene_now.png');

  // Inspect the entire scene
  const dump = await page.evaluate(() => {
    const g = window.game;
    if (!g || !g.scene) return { error: 'No game or scene' };

    const cam = g.camera;
    const res = {
      cam: { pos: [cam.position.x, cam.position.y, cam.position.z], fov: cam.fov, near: cam.near, far: cam.far },
      fog: g.scene.fog ? { color: '#' + g.scene.fog.color.getHexString(), near: g.scene.fog.near, far: g.scene.fog.far } : null,
      bg: g.scene.background ? '#' + g.scene.background.getHexString() : null,
      childCount: g.scene.children.length,
      children: []
    };

    g.scene.children.forEach(c => {
      const item = {
        name: c.name || c.type,
        type: c.type,
        visible: c.visible,
        pos: [c.position.x, c.position.y, c.position.z],
        subChildren: c.children.length
      };

      if (c.isMesh) {
        item.geom = c.geometry ? c.geometry.type : null;
        item.mat = c.material ? (Array.isArray(c.material) ? c.material.map(m => m.type) : c.material.type) : null;
        if (c.material && c.material.color) item.color = '#' + c.material.color.getHexString();
      }

      // If it's a group, inspect its main parts
      if (c.children.length > 0 && c.children.length < 20) {
        item.subNames = c.children.map(sc => `${sc.name || sc.type}(vis=${sc.visible})`);
      }

      res.children.push(item);
    });

    return res;
  });

  console.log('--- SCENE DUMP ---');
  console.log(JSON.stringify(dump, null, 2));

  console.log('--- LOGS ---');
  console.log(logs.slice(-30).join('\n'));

  await browser.close();
})();
