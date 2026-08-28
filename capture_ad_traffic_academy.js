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

const tasks = [
  {
    name: '01_home_hero.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '02_projects_showcase.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const el = document.getElementById('projects');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(1500);
    }
  },
  {
    name: '03_solar_system.png',
    url: 'http://localhost:3045/solar.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(4000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '04_ati_typing_instructor.png',
    url: 'http://localhost:3045/ati.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '05_traffic_driving_gameplay.png',
    url: 'http://localhost:3045/Traffic/Driving.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      console.log('Waiting for Driving.html to initialize...');
      await page.waitForTimeout(5000);
      
      // Dismiss any intro / modal / click on screen to start
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const gtaBtn = document.getElementById('gta-btn-start');
        if (gtaBtn) gtaBtn.click();
        const startBtn = document.querySelector('.btn-p');
        if (startBtn && startBtn.textContent.includes('Enter')) startBtn.click();
      });
      
      // Click center of canvas/screen
      await page.mouse.click(960, 540);
      await page.waitForTimeout(4000);
    }
  },
  {
    name: '06_traffic_academy_hub.png',
    url: 'http://localhost:3045/Traffic/Academy.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '07_about_story.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '08_download_hub.png',
    url: 'http://localhost:3045/download.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '09_school_foundation.png',
    url: 'http://localhost:3045/school.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '10_mobile_home.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  }
];

(async () => {
  console.log('Starting Playwright screenshot run...');
  const browser = await chromium.launch();
  
  for (const t of tasks) {
    console.log(`Processing: ${t.name}...`);
    const context = await browser.newContext({
      viewport: t.viewport,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    
    try {
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (t.action) {
        await t.action(page);
      }
      const targetPath = path.join(outDir, t.name);
      await page.screenshot({ path: targetPath });
      console.log(`✓ Captured ${t.name} -> ${targetPath}`);

      if (fs.existsSync(brainDir)) {
        fs.copyFileSync(targetPath, path.join(brainDir, t.name));
      }
    } catch (err) {
      console.error(`✗ Error capturing ${t.name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('All screenshots complete!');
})();
