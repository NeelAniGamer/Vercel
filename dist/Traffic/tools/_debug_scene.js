const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERR] ${err.message}`));

  await page.goto('http://localhost:3000/Traffic/Driving.html?level=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.Cutscene && window.Cutscene.isActive && window.Cutscene.isActive(), { timeout: 40000 });

  // Wait 1.5s into Shot 1
  await page.waitForTimeout(1500);

  const sceneInfo = await page.evaluate(() => {
    const g = window.game;
    const csState = window.Cutscene.state ? window.Cutscene.state() : null;

    // Check camera position and target
    const camInfo = {
      pos: [+g.camera.position.x.toFixed(2), +g.camera.position.y.toFixed(2), +g.camera.position.z.toFixed(2)],
      fov: g.camera.fov,
      near: g.camera.near,
      far: g.camera.far
    };

    // Find all meshes in the scene and categorize them
    const summary = {
      totalChildren: g.scene.children.length,
      roads: [],
      buildings: [],
      terrain: [],
      cast: [],
      lights: [],
      other: []
    };

    g.scene.traverse(c => {
      const name = c.name || '';
      const type = c.type;
      const isMesh = c.isMesh;

      if (type.includes('Light')) {
        summary.lights.push({
          type: type,
          color: c.color ? c.color.getHexString() : null,
          intensity: c.intensity,
          pos: [c.position.x, c.position.y, c.position.z]
        });
      }

      if (isMesh) {
        const wp = new THREE.Vector3();
        c.getWorldPosition(wp);
        const item = {
          name: name,
          parent: c.parent ? (c.parent.name || c.parent.type) : null,
          pos: [+wp.x.toFixed(1), +wp.y.toFixed(1), +wp.z.toFixed(1)],
          visible: c.visible,
          geom: c.geometry ? c.geometry.type : null,
          color: c.material && c.material.color ? c.material.color.getHexString() : null,
          opacity: c.material ? c.material.opacity : 1
        };

        if (name.includes('road') || name.includes('asphalt') || (c.parent && c.parent.name && c.parent.name.includes('road'))) {
          summary.roads.push(item);
        } else if (name.includes('build') || name.includes('house') || name.includes('apart') || name.includes('shop') || (c.parent && c.parent.name && (c.parent.name.includes('build') || c.parent.name.includes('plot')))) {
          summary.buildings.push(item);
        } else if (name.includes('ground') || (c.userData && c.userData.isGround)) {
          summary.terrain.push(item);
        } else if (c.userData && c.userData.isCast) {
          summary.cast.push(item);
        } else {
          summary.other.push(item);
        }
      }
    });

    return {
      csState,
      camInfo,
      sceneFog: g.scene.fog ? {
        color: g.scene.fog.color.getHexString(),
        near: g.scene.fog.near,
        far: g.scene.fog.far
      } : null,
      background: g.scene.background ? g.scene.background.getHexString() : null,
      roadCount: summary.roads.length,
      buildingCount: summary.buildings.length,
      terrainCount: summary.terrain.length,
      castCount: summary.cast.length,
      lightCount: summary.lights.length,
      totalMeshes: summary.roads.length + summary.buildings.length + summary.terrain.length + summary.cast.length + summary.other.length,
      lights: summary.lights,
      terrain: summary.terrain,
      castSample: summary.cast.slice(0, 10),
      otherSample: summary.other.slice(0, 20),
      buildingSample: summary.buildings.slice(0, 10),
      roadSample: summary.roads.slice(0, 10)
    };
  });

  console.log('--- DETAILED SCENE AUDIT ---');
  console.log(JSON.stringify(sceneInfo, null, 2));

  console.log('--- CONSOLE LOGS ---');
  console.log(consoleLogs.join('\n'));

  await page.screenshot({ path: 'Traffic/tools/_shot1_debug.png' });
  console.log('Saved _shot1_debug.png');

  await browser.close();
})();
