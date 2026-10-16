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

  // Take screenshot immediately (Shot 1, around 0.5s in)
  await page.screenshot({ path: path.join(__dirname, 'shot1_view.png') });
  console.log('Saved shot1_view.png');

  // Also query what is in the frustum of camera in Shot 1!
  const data = await page.evaluate(() => {
    const cam = window.game.camera;
    cam.updateMatrixWorld(true);
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    const visibleInFrustum = [];
    window.game.scene.traverse(c => {
      if (c.isMesh && c.visible) {
        c.updateMatrixWorld(true);
        if (frustum.intersectsObject(c)) {
          const wp = new THREE.Vector3();
          c.getWorldPosition(wp);
          const sp = wp.clone().project(cam);
          visibleInFrustum.push({
            name: c.name,
            pos: [+wp.x.toFixed(1), +wp.y.toFixed(1), +wp.z.toFixed(1)],
            screen: [+sp.x.toFixed(2), +sp.y.toFixed(2)],
            parent: c.parent ? c.parent.name : null,
            root: (() => {
              let p = c;
              while (p.parent && p.parent !== window.game.scene) p = p.parent;
              return p.name || p.type;
            })(),
            color: c.material && c.material.color ? c.material.color.getHexString() : null,
            matType: c.material ? c.material.type : null
          });
        }
      }
    });

    return {
      camPos: [+cam.position.x.toFixed(1), +cam.position.y.toFixed(1), +cam.position.z.toFixed(1)],
      camFov: cam.fov,
      shotIdx: window.Cutscene.state ? window.Cutscene.state().shot : null,
      visibleCount: visibleInFrustum.length,
      sample: visibleInFrustum
    };
  });

  console.log('SHOT 1 DATA:', JSON.stringify(data, null, 2));

  await browser.close();
})();
