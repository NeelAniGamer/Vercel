const path = require('path');
const fs = require('fs');

let chromium;
try {
  chromium = require('./Traffic/node_modules/playwright').chromium;
} catch (e) {
  try {
    chromium = require('playwright').chromium;
  } catch (e2) {
    console.error('Playwright not found');
    process.exit(1);
  }
}

const outDir = path.join(__dirname, 'ads-screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const brainDir = 'C:\\Users\\neelg\\.gemini\\antigravity\\brain\\66e69ca8-8e1c-454d-a0e3-3daabe7ed664';

const squareTasks = [
  {
    name: '23_square_ad_studio_hero.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1080, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
    }
  },
  {
    name: '24_square_ad_team_members.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 1080, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const team = document.querySelector('.team-grid');
        if (team) team.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(1200);
    }
  },
  {
    name: '25_square_ad_traffic_gameplay.png',
    url: 'http://localhost:3045/Traffic/Driving.html',
    viewport: { width: 1080, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(4500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const gtaBtn = document.getElementById('gta-btn-start');
        if (gtaBtn) gtaBtn.click();
        const enterBtn = document.querySelector('.btn-p');
        if (enterBtn && enterBtn.textContent.includes('Enter')) enterBtn.click();
      });
      await page.mouse.click(540, 540);
      await page.waitForTimeout(4000);
    }
  },
  {
    name: '26_square_ad_solar_engine.png',
    url: 'http://localhost:3045/solar.html',
    viewport: { width: 1080, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1200);
    }
  }
];

(async () => {
  console.log('Capturing 1:1 square photo ads (1080x1080 @ 2x Retina)...');
  const browser = await chromium.launch();

  for (const item of squareTasks) {
    console.log(`📸 Capturing ${item.name}...`);
    const context = await browser.newContext({
      viewport: item.viewport,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (item.action) await item.action(page);

      const targetPath = path.join(outDir, item.name);
      await page.screenshot({ path: targetPath });
      console.log(`✓ Saved square photo -> ${targetPath}`);

      if (fs.existsSync(brainDir)) {
        fs.copyFileSync(targetPath, path.join(brainDir, item.name));
      }
    } catch (err) {
      console.error(`✗ Error on ${item.name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('✅ All 1:1 Square Photo Ads Captured Successfully!');
})();
