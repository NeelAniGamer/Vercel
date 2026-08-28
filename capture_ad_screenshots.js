const path = require('path');
const fs = require('fs');

// Use playwright from Traffic/node_modules
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
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Ensure brain directory also has a copy for artifact viewing
const brainDir = 'C:\\Users\\neelg\\.gemini\\antigravity\\brain\\66e69ca8-8e1c-454d-a0e3-3daabe7ed664';

const pagesToCapture = [
  {
    name: '01_home_hero.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '02_projects_showcase.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const proj = document.getElementById('projects');
        if (proj) proj.scrollIntoView();
      });
    }
  },
  {
    name: '03_solar_system.png',
    url: 'http://localhost:3045/solar.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 2000,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '04_ati_typing_instructor.png',
    url: 'http://localhost:3045/ati.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '05_mumbai_traffic_simulator.png',
    url: 'http://localhost:3045/Traffic/Driving.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 3000,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '06_about_creators.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '07_download_hub.png',
    url: 'http://localhost:3045/download.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '08_bhavani_school.png',
    url: 'http://localhost:3045/school.html',
    viewport: { width: 1920, height: 1080 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  },
  {
    name: '09_mobile_ad_home.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 390, height: 844 },
    waitFor: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
    }
  }
];

(async () => {
  console.log('Launching browser for ad screenshots...');
  const browser = await chromium.launch();
  
  for (const item of pagesToCapture) {
    console.log(`Capturing ${item.name} (${item.viewport.width}x${item.viewport.height})...`);
    const context = await browser.newContext({
      viewport: item.viewport,
      deviceScaleFactor: 2 // Crisp retina quality for advertisements
    });
    const page = await context.newPage();
    
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(item.waitFor || 1000);
      if (item.beforeShot) {
        await item.beforeShot(page);
        await page.waitForTimeout(600);
      }
      
      const targetPath = path.join(outDir, item.name);
      await page.screenshot({ path: targetPath });
      console.log(`Saved -> ${targetPath}`);

      if (fs.existsSync(brainDir)) {
        const brainCopy = path.join(brainDir, item.name);
        fs.copyFileSync(targetPath, brainCopy);
      }
    } catch (err) {
      console.error(`Failed to capture ${item.name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('All advertisement screenshots captured successfully!');
})();
