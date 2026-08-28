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

const fullSuite = [
  // ==================== DESKTOP SHOWCASE ====================
  {
    name: '01_desktop_home_hero_orrery.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(4000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '02_desktop_home_projects.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const p = document.getElementById('projects');
        if (p) p.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(1500);
    }
  },
  {
    name: '03_desktop_about_team_members.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const teamSec = document.querySelector('.team-grid');
        if (teamSec) teamSec.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(1500);
    }
  },
  {
    name: '04_desktop_about_story_mission.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
    }
  },
  {
    name: '05_desktop_project_solar_engine.png',
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
    name: '06_desktop_project_ati_typing.png',
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
    name: '07_desktop_project_traffic_gameplay.png',
    url: 'http://localhost:3045/Traffic/Driving.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(4500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const gtaBtn = document.getElementById('gta-btn-start');
        if (gtaBtn) gtaBtn.click();
        const enterBtn = document.querySelector('.btn-p');
        if (enterBtn && enterBtn.textContent.includes('Enter')) enterBtn.click();
      });
      await page.mouse.click(960, 540);
      await page.waitForTimeout(4000);
    }
  },
  {
    name: '08_desktop_project_traffic_academy_hub.png',
    url: 'http://localhost:3045/Traffic/Academy.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(3500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '09_desktop_project_gesture_control.png',
    url: 'http://localhost:3045/gesture.html',
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
    name: '10_desktop_project_rpg_engine.png',
    url: 'http://localhost:3045/rpg.html',
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
    name: '11_desktop_project_qr_editor.png',
    url: 'http://localhost:3045/qr.html',
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
    name: '12_desktop_school_foundation.png',
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
    name: '13_desktop_sneh_asha_initiative.png',
    url: 'http://localhost:3045/sneh-asha.html',
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
    name: '14_desktop_downloads_hub.png',
    url: 'http://localhost:3045/download.html',
    viewport: { width: 1920, height: 1080 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },

  // ==================== MOBILE AD CREATIVES (390x844) ====================
  {
    name: '15_mobile_home_hero.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '16_mobile_home_projects_grid.png',
    url: 'http://localhost:3045/home.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const p = document.getElementById('projects');
        if (p) p.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(1200);
    }
  },
  {
    name: '17_mobile_about_team_members.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const teamSec = document.querySelector('.team-grid');
        if (teamSec) teamSec.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await page.waitForTimeout(1200);
    }
  },
  {
    name: '18_mobile_about_story.png',
    url: 'http://localhost:3045/about.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '19_mobile_traffic_academy_hub.png',
    url: 'http://localhost:3045/Traffic/Academy.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '20_mobile_solar_engine.png',
    url: 'http://localhost:3045/solar.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '21_mobile_ati_typing.png',
    url: 'http://localhost:3045/ati.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },
  {
    name: '22_mobile_downloads_app.png',
    url: 'http://localhost:3045/download.html',
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  }
];

(async () => {
  console.log(`Starting capture of full ${fullSuite.length}-asset ad creative suite...`);
  const browser = await chromium.launch();
  
  for (const item of fullSuite) {
    console.log(`📸 Capturing ${item.name} (${item.viewport.width}x${item.viewport.height})...`);
    const context = await browser.newContext({
      viewport: item.viewport,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      if (item.action) await item.action(page);
      
      const targetPath = path.join(outDir, item.name);
      await page.screenshot({ path: targetPath });
      console.log(`✓ Saved -> ${targetPath}`);

      if (fs.existsSync(brainDir)) {
        fs.copyFileSync(targetPath, path.join(brainDir, item.name));
      }
    } catch (err) {
      console.error(`✗ Failed on ${item.name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('✅ Full Ad & Project Suite Captured Successfully!');
})();
