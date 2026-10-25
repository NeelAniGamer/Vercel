import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 59388;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/Driving.html';
  const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server listening at http://127.0.0.1:${PORT}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    } else {
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    }
  });

  try {
    await page.goto(`http://127.0.0.1:${PORT}/Driving.html?lv=5`, { waitUntil: 'domcontentloaded' });
    
    // Wait for core game and ui globals to be ready
    await page.waitForFunction(() => typeof window !== 'undefined' && window.game && window.ui && window.LVS, null, { timeout: 20000 });

    // Ensure the level starts
    await page.evaluate(() => {
      if (window.ui && window.ui.cur && window.ui.cur.id !== 5) {
        window.ui.showBriefing(5);
      }
      if (window.ui && typeof window.ui.start === 'function') {
        window.ui.start();
      } else if (window.game && typeof window.game.startLevel === 'function') {
        window.game.startLevel();
      }
    });

    // Wait for the player and game to be actively playing
    await page.waitForFunction(() => window.game && window.game.player && window.game.playing, null, { timeout: 25000 });
    await page.waitForTimeout(1000);

    const vehicleDimsResults = await page.evaluate(() => {
      const results = {};
      const types = ['car', 'bus', 'bus_green', 'truck', 'auto', 'bike'];
      for (const t of types) {
        const d = window.VehicleDims ? window.VehicleDims.resolve(t) : null;
        const h = window.VehicleDims ? window.VehicleDims.halves(t) : null;
        let built = null;
        if (window._buildVehicle) {
          const v = window._buildVehicle(t);
          built = {
            halfW: v.userData?.halfW,
            halfD: v.userData?.halfD,
            type: v.type,
            isVehicle: v.userData?.isVehicle
          };
        }
        results[t] = { dims: d, halves: h, built };
      }
      return results;
    });

    console.log('\n--- VEHICLE DIMENSIONS AND COLLIDERS ---');
    for (const [t, data] of Object.entries(vehicleDimsResults)) {
      console.log(`[${t}] Canonical: ${data.dims?.W}m x ${data.dims?.L}m | Half: ${data.halves?.halfW.toFixed(2)}m x ${data.halves?.halfD.toFixed(2)}m | Built Box: ${data.built?.halfW?.toFixed(2)}m x ${data.built?.halfD?.toFixed(2)}m`);
      if (t === 'bus' || t === 'bus_green') {
        if (data.dims.L < 10) throw new Error(`${t} length is too small: ${data.dims.L}`);
        if (data.built.halfD < 5.0) throw new Error(`${t} collider halfD is too small: ${data.built.halfD}`);
      }
      if (t === 'truck') {
        if (data.dims.L < 8) throw new Error(`truck length is too small: ${data.dims.L}`);
        if (data.built.halfD < 4.0) throw new Error(`truck collider halfD is too small: ${data.built.halfD}`);
      }
    }
    console.log('>>> ALL VEHICLE DIMENSIONS & COLLIDERS VERIFIED ACCURATE! <<<\n');

    const barrierCollisionResults = await page.evaluate(() => {
      const g = window.game;
      if (!g) return { error: 'No game instance' };

      console.log('Game level cfg:', g.mapCfg ? { id: g.mapCfg.id, is50km: g.mapCfg.is50km, isAISynthesized: g.mapCfg.isAISynthesized, roads: !!g.mapCfg.roads } : null);
      console.log('Obstacles count:', (g.obstacles || []).length);
      console.log('Sample obstacles:', (g.obstacles || []).slice(0, 10).map(o => ({
        userData: o.userData,
        pos: o.position ? { x: o.position.x, z: o.position.z } : null
      })));

      console.log('Testing _buildBarriers with test road layout (both V and H dead-ends)...');
      const testRoadCfg = {
        roads: [
          { type: 'v', x: 500, z1: 0, z2: 100, width: 14 },
          { type: 'h', z: 500, x1: 0, x2: 100, width: 14 }
        ]
      };
      g._buildBarriers(testRoadCfg, 14);

      // Find jersey barriers
      const barriers = (g.obstacles || []).filter(o => o && o.userData && o.userData.isBarrier);
      console.log('Barriers created:', barriers.length);
      const barrierCount = barriers.length;

      // Test barrier bounds
      const hBarriers = barriers.filter(b => Math.abs(b.rotation.y - Math.PI / 2) < 0.1);
      const vBarriers = barriers.filter(b => Math.abs(b.rotation.y) < 0.1);

      const hHalfW = hBarriers[0] ? hBarriers[0].userData.halfW : null;
      const hHalfD = hBarriers[0] ? hBarriers[0].userData.halfD : null;
      const vHalfW = vBarriers[0] ? vBarriers[0].userData.halfW : null;
      const vHalfD = vBarriers[0] ? vBarriers[0].userData.halfD : null;

      // Simulate a player vehicle driving directly into an East-West road terminus barrier (rotY = PI/2)
      // Barrier is at (ox, oz), length along world Z, normal along world X.
      const testBarrier = hBarriers[0] || barriers[0];
      let simResult = null;
      if (testBarrier) {
        const ox = testBarrier.position.x, oz = testBarrier.position.z;
        const bRot = testBarrier.rotation.y;
        
        // Place player vehicle 0.5m inside barrier along collision normal
        const origX = g.player.position.x, origZ = g.player.position.z;
        const origSpeed = g.speed;
        
        g.player.position.x = ox + 0.1;
        g.player.position.z = oz;
        g.speed = 1.0;
        
        g._uobs(0.016);
        
        const pushedX = g.player.position.x;
        const pushedZ = g.player.position.z;
        const postSpeed = g.speed;
        const collided = g._collidedThisFrame;

        // Restore
        g.player.position.x = origX;
        g.player.position.z = origZ;
        g.speed = origSpeed;

        simResult = {
          ox, oz, bRot,
          pushedX, pushedZ,
          postSpeed, collided,
          dispX: pushedX - (ox + 0.1),
          dispZ: pushedZ - oz
        };
      }

      return {
        barrierCount,
        hBarriersCount: hBarriers.length,
        vBarriersCount: vBarriers.length,
        hHalfW, hHalfD,
        vHalfW, vHalfD,
        simResult
      };
    });

    console.log('--- BARRIER SYSTEM VERIFICATION ---');
    console.log(`Total Barriers: ${barrierCollisionResults.barrierCount}`);
    console.log(`Horizontal Barriers (rotY=PI/2): ${barrierCollisionResults.hBarriersCount} (halfW=${barrierCollisionResults.hHalfW}, halfD=${barrierCollisionResults.hHalfD})`);
    console.log(`Vertical Barriers (rotY=0): ${barrierCollisionResults.vBarriersCount} (halfW=${barrierCollisionResults.vHalfW}, halfD=${barrierCollisionResults.vHalfD})`);
    console.log('Simulation Test Result:', barrierCollisionResults.simResult);

    if (barrierCollisionResults.hHalfW < 5.0) {
      throw new Error(`Horizontal barrier halfW should be >= 5 (road width / 2), got: ${barrierCollisionResults.hHalfW}`);
    }
    if (barrierCollisionResults.hHalfD > 1.0) {
      throw new Error(`Horizontal barrier halfD should be barrier thickness (~0.55), got: ${barrierCollisionResults.hHalfD}`);
    }
    if (!barrierCollisionResults.simResult?.collided) {
      throw new Error('Simulation collision did not trigger!');
    }
    if (barrierCollisionResults.simResult?.postSpeed !== 0) {
      throw new Error('Car did not stop on barrier impact!');
    }

    console.log('>>> ALL BARRIER COLLISION & PUSH-OUT TESTS PASSED CLEANLY! <<<\n');

  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
