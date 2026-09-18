const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/Traffic/Driving.html';
  const filePath = path.join(rootDir, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
});

async function runTests() {
  await new Promise(resolve => server.listen(8999, resolve));
  console.log('Static server listening on http://localhost:8999');

  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--disable-web-security']
  });
  const context = await browser.newContext();

  const testLevels = [
    { lv: '1', mode: 'car', veh: 'car', desc: 'Level 1: Marine Drive' },
    { lv: '2', mode: 'car', veh: 'car', desc: 'Level 2: Pedestrian Crossing' },
    { lv: '14', mode: 'car', veh: 'car', desc: 'Level 14: Night Crossing' },
    { lv: '21', mode: 'car', veh: 'car', desc: 'Level 21: Silence Zone' },
    { lv: 'custom', mode: 'car', veh: 'car', desc: 'Custom Level: Suburban Free Roam' },
    { lv: 'custom_downtown', mode: 'car', veh: 'car', desc: 'Custom Level: Downtown Hub' },
    { lv: 'freeroam', mode: 'car', veh: 'car', desc: 'Open World Free Roam' }
  ];

  let allPassed = true;

  for (const t of testLevels) {
    console.log(`\n--- Testing ${t.desc} (lv=${t.lv}) ---`);
    const page = await context.newPage();

    const errors = [];
    const logs = [];
    page.on('pageerror', err => {
      errors.push(err.stack || err.toString());
      console.log('  PAGE ERROR STACK:\n', err.stack || err.message);
    });
    page.on('console', msg => {
      const txt = msg.text();
      logs.push(txt);
      if (txt.includes('CRASH ON OBJECT:') || txt.includes('_actualStart() failed') || txt.includes('Level failed to load')) {
        errors.push(txt);
        console.log('  CRITICAL LOG:', txt);
      }
    });

    await page.addInitScript(() => {
      const iv = setInterval(() => {
        if (window.THREE && window.THREE.WebGLRenderer) {
          clearInterval(iv);
          const orig = window.THREE.WebGLRenderer.prototype.renderBufferDirect;
          window.THREE.WebGLRenderer.prototype.renderBufferDirect = function(camera, fog, geometry, material, object, group) {
            try {
              return orig.apply(this, arguments);
            } catch(e) {
              console.log('CRASH ON OBJECT: name=' + (object && object.name) + ' type=' + (object && object.type) + ' matType=' + (material && material.type) + ' matName=' + (material && material.name) + ' fog=' + (fog ? fog.constructor.name : 'null'));
              throw e;
            }
          };
        }
      }, 5);
    });

    const url = `http://localhost:8999/Traffic/Driving.html?lv=${t.lv}&mode=${t.mode}&veh=${t.veh}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Wait for game to initialize and canvas to turn on
      await page.waitForFunction(() => {
        const gc = document.getElementById('gc');
        const isLoaded = gc && gc.classList.contains('on');
        const toast = document.querySelector('.toast');
        const failed = toast && toast.textContent && toast.textContent.includes('failed');
        return isLoaded || failed;
      }, { timeout: 12000 });

      // Extra check: inspect game object state
      const state = await page.evaluate(() => {
        return {
          playing: window.game?.playing,
          hasScene: !!window.game?.scene,
          hasGraph: !!window.game?.roadGraph,
          obstaclesCount: window.game?.obstacles?.length || 0,
          canvasOn: document.getElementById('gc')?.classList.contains('on')
        };
      });

      if (errors.length > 0) {
        console.log(`❌ ${t.desc} FAILED with errors:`, errors);
        allPassed = false;
      } else if (!state.canvasOn) {
        console.log(`❌ ${t.desc} FAILED: Canvas did not activate. State:`, state);
        allPassed = false;
      } else {
        console.log(`✅ ${t.desc} PASSED: Canvas ON, Obstacles: ${state.obstaclesCount}, Playing: ${state.playing}`);
      }
    } catch (e) {
      console.log(`❌ ${t.desc} TIMEOUT / EXCEPTION:`, e.message);
      allPassed = false;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (allPassed) {
    console.log('\n🎉 ALL LEVEL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME LEVEL TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite runner failed:', err);
  if (server) server.close();
  process.exit(1);
});
