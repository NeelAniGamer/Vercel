const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const pagesToTest = [
  { name: 'Home', relPath: '../home.html' },
  { name: 'Dashboard', relPath: '../dashboard.html' },
  { name: 'TrafficSetup', relPath: './TrafficSetup.html' },
  { name: 'TrafficDashboard', relPath: './TrafficDashboard.html' },
  { name: 'Academy', relPath: './Academy.html' },
  { name: 'About', relPath: '../about.html' },
  { name: 'School', relPath: '../school.html' },
  { name: 'Download', relPath: '../download.html' },
  { name: 'Verify', relPath: '../verify.html' }
];

const viewports = [
  { name: 'Compact (360x800)', width: 360, height: 800 },
  { name: 'iPhone (390x844)', width: 390, height: 844 }
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });

    for (const p of pagesToTest) {
      const fullPath = path.resolve(__dirname, p.relPath);
      if (!fs.existsSync(fullPath)) continue;

      const fileUrl = 'file:///' + fullPath.replace(/\\/g, '/');
      const page = await context.newPage();

      // Suppress unhandled alerts/confirms
      page.on('dialog', d => d.dismiss());

      try {
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1500);

        const audit = await page.evaluate((vpWidth) => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const clientW = docEl.clientWidth;
          const hasMetaViewport = !!document.querySelector('meta[name="viewport"]');
          
          // Find overflowing elements
          const overflowing = [];
          const allEls = document.querySelectorAll('body *');
          for (const el of allEls) {
            // Ignore hidden elements
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.right > clientW + 2) {
              overflowing.push({
                tag: el.tagName.toLowerCase(),
                id: el.id ? '#' + el.id : '',
                className: el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '',
                rectRight: Math.round(rect.right),
                width: Math.round(rect.width),
                overflowPx: Math.round(rect.right - clientW)
              });
            }
          }

          // Check mobile menu button visibility
          const mmb = document.querySelector('.mmb');
          let mmbStatus = 'not_present';
          if (mmb) {
            const mmbStyle = window.getComputedStyle(mmb);
            const mmbRect = mmb.getBoundingClientRect();
            mmbStatus = (mmbStyle.display !== 'none' && mmbRect.width > 0) ? 'visible' : 'hidden';
          }

          // Check small tap targets (< 40px)
          const smallTargets = [];
          const tapCandidates = document.querySelectorAll('button, a, input, select, [role="button"]');
          for (const t of tapCandidates) {
            const s = window.getComputedStyle(t);
            if (s.display === 'none' || s.visibility === 'hidden') continue;
            const r = t.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && (r.width < 38 || r.height < 38)) {
              // Ignore small text links inside paragraphs or close buttons
              const text = (t.textContent || '').trim().slice(0, 20);
              smallTargets.push({
                tag: t.tagName.toLowerCase(),
                id: t.id,
                class: typeof t.className === 'string' ? t.className : '',
                text,
                w: Math.round(r.width),
                h: Math.round(r.height)
              });
            }
          }

          return {
            hasMetaViewport,
            scrollW,
            clientW,
            hasHorizontalScroll: scrollW > clientW + 2,
            overflowDifference: Math.max(0, scrollW - clientW),
            overflowCount: overflowing.length,
            topOverflowing: overflowing.slice(0, 5),
            mmbStatus,
            smallTargetCount: smallTargets.length,
            smallTargetSamples: smallTargets.slice(0, 3)
          };
        }, vp.width);

        results.push({
          page: p.name,
          viewport: vp.name,
          ...audit
        });

      } catch (err) {
        results.push({
          page: p.name,
          viewport: vp.name,
          error: err.message
        });
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
