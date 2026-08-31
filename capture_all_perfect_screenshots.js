const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

function startServer(port = 3048) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/home.html';
    
    let safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqUrl);
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

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`✓ Local server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

const targets = [
  // 1. Home Hero with 3D Cosmos Background
  {
    name: '01_home_hero.png',
    aliases: ['01_desktop_home_hero_orrery.png'],
    url: 'http://localhost:3048/home.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3500);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
  },

  // 2. Home Projects Showcase Section
  {
    name: '02_projects_showcase.png',
    aliases: ['02_desktop_home_projects.png'],
    url: 'http://localhost:3048/home.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const el = document.querySelector('.projects-grid, #projects, .grid-container, main');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(1200);
    }
  },

  // 3. About Team Members
  {
    name: '03_desktop_about_team_members.png',
    aliases: ['06_about_creators.png'],
    url: 'http://localhost:3048/about.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        const team = document.querySelector('.team-grid, .creators, #team');
        if (team) team.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(1200);
    }
  },

  // 4. About Story & Mission
  {
    name: '04_desktop_about_story_mission.png',
    aliases: ['02_about_classroom.png', '07_about_story.png'],
    url: 'http://localhost:3048/about.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
    }
  },

  // 5. 3D MUMBAI TRAFFIC GAMEPLAY (Level 5 School Zone, full WebGL 3D render, clean HUD)
  {
    name: '05_traffic_driving_gameplay.png',
    aliases: ['07_desktop_project_traffic_gameplay.png', '05_mumbai_traffic_simulator.png', 'tut_4_simulator.png'],
    url: 'http://localhost:3048/Traffic/Driving.html?lv=5&mode=car',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      console.log('  -> Waiting for 3D model assets and WebGL compiler...');
      await page.waitForFunction(() => typeof window.game !== 'undefined', { timeout: 20000 });

      await page.evaluate(() => {
        const play = document.getElementById('play-overlay');
        if (play) play.click();
        if (typeof window.dismissGtaMissionIntro === 'function') window.dismissGtaMissionIntro();
        document.querySelectorAll('#gta-mission-intro, #play-overlay, #loading-screen, .modal, .dialog, #daily-bonus-modal, #welcome-back, #academy-tutorial-overlay').forEach(el => el.remove());
      });

      await page.waitForTimeout(2000);
    }
  },

  // 6. TRAFFIC ACADEMY HUB (52 Curriculum Levels, Clean Glassmorphism Grid)
  {
    name: '06_traffic_academy_hub.png',
    aliases: ['08_desktop_project_traffic_academy_hub.png', '06_traffic_academy_dashboard.png', '07_mobile_dashboard_view.png'],
    url: 'http://localhost:3048/Traffic/Academy.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        localStorage.setItem('traffic_academy_tutorial_seen', 'true');
        document.querySelectorAll('#daily-bonus-modal, #welcome-back, .modal-backdrop, .overlay, #academy-tutorial-overlay, #loading-screen').forEach(e => e.remove());
        if (window.ui && typeof window.ui.showLevels === 'function') {
          window.ui.showLevels();
        }
      });
      await page.waitForTimeout(1500);
    }
  },

  // 7. OFFICIAL POLICE & SNEH ASHA DRIVING CERTIFICATE (Crisp, No Toolbar, High DPI)
  {
    name: 'official_traffic_certificate.png',
    aliases: ['tut_7_certificate.png', 'official_certificate.png'],
    url: 'http://localhost:3048/Traffic/Academy.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2.5,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        // Remove popups and toolbar completely
        document.querySelectorAll('.tb, #daily-bonus-modal, #welcome-back, .modal-backdrop, .overlay, #academy-tutorial-overlay, #loading-screen').forEach(e => e.remove());

        // Show Certificate Screen
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const certScreen = document.getElementById('screen-certificate');
        if (certScreen) {
          certScreen.classList.add('active');
          certScreen.style.display = 'block';
        }

        // Fill official certificate metadata
        const cname = document.getElementById('cname');
        if (cname) cname.textContent = 'NEEL ANIGAMER';

        const cdate = document.getElementById('cdate');
        if (cdate) cdate.textContent = 'August 29, 2026';

        const cscore = document.getElementById('cscore');
        if (cscore) cscore.textContent = '100% (Grade A+)';

        const certNum = document.getElementById('cert-num');
        if (certNum) certNum.textContent = 'MTP-2026-HERO-0941';

        const certWrapper = document.getElementById('cert-wrapper');
        if (certWrapper) {
          certWrapper.style.filter = 'none';
          certWrapper.style.backdropFilter = 'none';
          certWrapper.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      });
      await page.waitForTimeout(1500);
    },
    elementSelector: '#cert'
  },

  // 8. OFFICIAL VERIFICATION CERTIFICATE (verify.html)
  {
    name: 'official_verify_certificate.png',
    url: 'http://localhost:3048/verify.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2.5,
    action: async (page) => {
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        const loading = document.getElementById('loading');
        if (loading) loading.remove();

        const notFound = document.getElementById('notFound');
        if (notFound) notFound.style.display = 'none';

        const wrap = document.getElementById('certWrapper');
        if (wrap) {
          wrap.classList.add('loaded');
          wrap.style.display = 'block';
          wrap.style.opacity = '1';
          wrap.style.transform = 'none';
        }

        const userName = document.getElementById('userName');
        if (userName) userName.textContent = 'NEEL ANIGAMER';

        const achName = document.getElementById('achName');
        if (achName) achName.textContent = 'Traffic Hero Certified';

        const achDesc = document.getElementById('achDesc');
        if (achDesc) achDesc.textContent = 'Completed all 52 Mumbai traffic safety scenarios with 100% compliance mastery.';

        const issueDate = document.getElementById('issueDate');
        if (issueDate) issueDate.textContent = 'August 2026';

        const certId = document.getElementById('certId');
        if (certId) certId.textContent = 'MTP-2026-9481-AUTH';
      });
      await page.waitForTimeout(1000);
    },
    elementSelector: '#certWrapper'
  },

  // 9. SOLAR ENGINE 3D (Full 3D Planetary Orrery with Sun, Orbits, Telemetry & 8 Planets)
  {
    name: '03_solar_system.png',
    aliases: ['05_desktop_project_solar_engine.png'],
    url: 'http://localhost:3048/engine.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      console.log('  -> Initializing Keplerian 3D Solar Engine...');
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        if (typeof window.enterApp === 'function') window.enterApp();
        const splash = document.getElementById('splash-screen');
        if (splash) splash.remove();
      });
      await page.waitForTimeout(4000);
    }
  },

  // 10. ATI TYPING INSTRUCTOR (Active Syntax Velocity Studio with Code Typing Simulation)
  {
    name: '04_ati_typing_instructor.png',
    aliases: ['06_desktop_project_ati_typing.png'],
    url: 'http://localhost:3048/ati-demo.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      console.log('  -> Initializing Velocity Typing Cockpit...');
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        const btn = document.querySelector('button');
        if (btn && btn.textContent.includes('Run Auto-Test')) btn.click();
      });
      await page.waitForTimeout(3000);
    }
  },

  // 11. GESTURE CONTROLLER AI (Webcam Vision & 3D Spatial Nodes)
  {
    name: '09_desktop_project_gesture_control.png',
    url: 'http://localhost:3048/gesture.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      console.log('  -> Waiting for Gesture Controller canvas...');
      await page.waitForTimeout(4000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1500);
    }
  },

  // 12. DYNAMIC QR CODE STUDIO (Full Dynamic Studio with Real-time Preview & Vectors)
  {
    name: '11_desktop_project_qr_editor.png',
    url: 'http://localhost:3048/qr-editor.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      console.log('  -> Loading QR Design Studio workspace...');
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1500);
    }
  },

  // 13. TERRA3D & RPG ENGINE
  {
    name: '10_desktop_project_rpg_engine.png',
    url: 'http://localhost:3048/rpg.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      console.log('  -> Waiting for RPG engine tile map & character sprites...');
      await page.waitForTimeout(4000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1500);
    }
  },

  // 14. DOWNLOAD HUB
  {
    name: '14_desktop_downloads_hub.png',
    aliases: ['07_download_hub.png', '08_download_hub.png'],
    url: 'http://localhost:3048/download.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },

  // 15. BHAVANI SCHOOL FOUNDATION
  {
    name: '12_desktop_school_foundation.png',
    aliases: ['08_bhavani_school.png', '09_school_foundation.png'],
    url: 'http://localhost:3048/school.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  },

  // 16. SNEH ASHA INITIATIVE
  {
    name: '13_desktop_sneh_asha_initiative.png',
    url: 'http://localhost:3048/sneh-asha.html',
    viewport: { width: 1920, height: 1080 },
    scale: 2,
    action: async (page) => {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        document.getElementById('loader')?.remove();
      });
      await page.waitForTimeout(1000);
    }
  }
];

async function main() {
  const server = await startServer(3048);
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--enable-unsafe-webgpu']
  });

  const myVideoPublic = path.join(__dirname, 'my-video', 'public');
  const adsScreenshots = path.join(__dirname, 'ads-screenshots');
  const trafficDir = path.join(__dirname, 'Traffic');

  if (!fs.existsSync(myVideoPublic)) fs.mkdirSync(myVideoPublic, { recursive: true });
  if (!fs.existsSync(adsScreenshots)) fs.mkdirSync(adsScreenshots, { recursive: true });

  console.log('\n======================================================');
  console.log('🚀 STARTING HIGH-FIDELITY AUTOMATED SCREENSHOT ENGINE');
  console.log('======================================================\n');

  for (const item of targets) {
    console.log(`📸 Capturing: ${item.name} (${item.url})...`);
    const page = await browser.newPage({
      viewport: item.viewport,
      deviceScaleFactor: item.scale || 2
    });

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      if (item.action) await item.action(page);

      const targetPath = path.join(myVideoPublic, item.name);

      if (item.elementSelector) {
        const el = await page.$(item.elementSelector);
        if (el) {
          await el.screenshot({ path: targetPath });
        } else {
          await page.screenshot({ path: targetPath });
        }
      } else {
        await page.screenshot({ path: targetPath });
      }

      const sizeKB = (fs.statSync(targetPath).size / 1024).toFixed(1);
      console.log(`  ✓ Saved -> ${item.name} (${sizeKB} KB)`);

      // Copy to aliases
      if (item.aliases && item.aliases.length > 0) {
        for (const alias of item.aliases) {
          const aliasPath = path.join(myVideoPublic, alias);
          fs.copyFileSync(targetPath, aliasPath);
          console.log(`    ↳ Copied to alias: ${alias}`);
          if (alias.startsWith('tut_')) {
            fs.copyFileSync(targetPath, path.join(trafficDir, alias));
          }
        }
      }

      // Also copy to adsScreenshots
      fs.copyFileSync(targetPath, path.join(adsScreenshots, item.name));

    } catch (err) {
      console.error(`  ✗ Error capturing ${item.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log('\n======================================================');
  console.log('🎉 ALL SCREENSHOTS CAPTURED WITH CRYSTAL-CLEAR QUALITY!');
  console.log('======================================================\n');
}

main().catch(console.error);
