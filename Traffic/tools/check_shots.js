const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto('http://localhost:3000/Traffic/Driving.html?level=1', { waitUntil: 'load' });

  // Wait until Cutscene is active
  await page.waitForFunction(() => window.Cutscene && window.Cutscene.isActive && window.Cutscene.isActive(), null, { timeout: 60000 });

  // 1. Capture Shot 1
  await page.evaluate(() => window.Cutscene.seek(0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'shot1_view.png') });
  console.log('Saved shot1_view.png');

  // 2. Capture Shot 2 (Vikram and Fortuner on the white line)
  await page.evaluate(() => window.Cutscene.seek(1));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'shot2_view.png') });
  console.log('Saved shot2_view.png');

  // 3. Capture Shot 9 (Transition to Sharma Niwas at dawn)
  await page.evaluate(() => window.Cutscene.seek(8));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'shot9_view.png') });
  console.log('Saved shot9_view.png');

  // 4. Skip cutscene and capture gameplay spawn at Sharma Niwas
  await page.evaluate(() => window.Cutscene.skip());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'gameplay_spawn.png') });
  console.log('Saved gameplay_spawn.png');

  const info = await page.evaluate(() => {
    return {
      cutsceneActive: window.Cutscene ? window.Cutscene.isActive() : false,
      playing: window.game ? window.game.playing : false,
      playerPos: window.game && window.game.player ? [
        +window.game.player.pos.x.toFixed(2),
        +window.game.player.pos.y.toFixed(2),
        +window.game.player.pos.z.toFixed(2)
      ] : null,
      isOutsideVehicle: window.game && window.game.player ? window.game.player.isOutsideVehicle : null,
      carPos: window.game && window.game.car ? [
        +window.game.car.pos.x.toFixed(2),
        +window.game.car.pos.y.toFixed(2),
        +window.game.car.pos.z.toFixed(2)
      ] : null,
      cameraPos: window.game && window.game.camera ? [
        +window.game.camera.position.x.toFixed(2),
        +window.game.camera.position.y.toFixed(2),
        +window.game.camera.position.z.toFixed(2)
      ] : null
    };
  });
  console.log('GAMEPLAY SPAWN INFO:', JSON.stringify(info, null, 2));

  await browser.close();
})();
