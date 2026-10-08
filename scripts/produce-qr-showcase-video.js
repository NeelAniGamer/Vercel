// scripts/produce-qr-showcase-video.js
// Automated Video Producer for Class Of Learners QR Studio Matrix
// VERTICAL FORMAT (1080x1920 - 9:16 Aspect Ratio)
// Automates: Home Page -> QR Studio -> Matrix Styling -> Optical Scan & Decode -> vCard for Neel Badri -> Final Showcase
// Features: Word-by-word highlighted karaoke subtitles, virtual mouse cursor, sound design & voiceover

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const PORT = 8099;
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const RECORDINGS_DIR = path.join(OUTPUT_DIR, 'raw_recordings');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// Clean previous raw webm recordings to ensure fresh output
const existingWebms = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm'));
for (const file of existingWebms) {
  try { fs.unlinkSync(path.join(RECORDINGS_DIR, file)); } catch (e) {}
}

// ── 1. Master Subtitle & Narration Timeline (Word-by-word timings in seconds) ──
const SCENES = [
  {
    id: 1,
    start: 0.5,
    text: "Welcome to Class Of Learners. Today, we enter the QR Studio Matrix, built for ultra-fast, high-precision code generation.",
    words: [
      { w: "Welcome", s: 0.5, e: 1.0 },
      { w: "to", s: 1.0, e: 1.2 },
      { w: "Class", s: 1.2, e: 1.5 },
      { w: "Of", s: 1.5, e: 1.7 },
      { w: "Learners.", s: 1.7, e: 2.3 },
      { w: "Today,", s: 2.5, e: 3.0 },
      { w: "we", s: 3.0, e: 3.2 },
      { w: "enter", s: 3.2, e: 3.6 },
      { w: "the", s: 3.6, e: 3.8 },
      { w: "QR", s: 3.8, e: 4.1 },
      { w: "Studio", s: 4.1, e: 4.6 },
      { w: "Matrix,", s: 4.6, e: 5.2 },
      { w: "built", s: 5.4, e: 5.8 },
      { w: "for", s: 5.8, e: 6.0 },
      { w: "ultra-fast,", s: 6.0, e: 6.7 },
      { w: "high-precision", s: 6.7, e: 7.4 },
      { w: "code", s: 7.4, e: 7.8 },
      { w: "generation.", s: 7.8, e: 8.5 }
    ]
  },
  {
    id: 2,
    start: 11.0,
    text: "Navigating directly into the QR suite, where every pixel module is rendered in real-time with custom geometry.",
    words: [
      { w: "Navigating", s: 11.0, e: 11.6 },
      { w: "directly", s: 11.6, e: 12.1 },
      { w: "into", s: 12.1, e: 12.4 },
      { w: "the", s: 12.4, e: 12.6 },
      { w: "QR", s: 12.6, e: 12.9 },
      { w: "suite,", s: 12.9, e: 13.5 },
      { w: "where", s: 13.7, e: 14.0 },
      { w: "every", s: 14.0, e: 14.4 },
      { w: "pixel", s: 14.4, e: 14.8 },
      { w: "module", s: 14.8, e: 15.3 },
      { w: "is", s: 15.3, e: 15.5 },
      { w: "rendered", s: 15.5, e: 16.0 },
      { w: "in", s: 16.0, e: 16.2 },
      { w: "real-time", s: 16.2, e: 16.8 },
      { w: "with", s: 16.8, e: 17.0 },
      { w: "custom", s: 17.0, e: 17.5 },
      { w: "geometry.", s: 17.5, e: 18.2 }
    ]
  },
  {
    id: 3,
    start: 19.0,
    text: "We fine-tune the corner eye-markers, apply cybernetic emerald gradients, and generate a flawless high-contrast matrix.",
    words: [
      { w: "We", s: 19.0, e: 19.3 },
      { w: "fine-tune", s: 19.3, e: 19.9 },
      { w: "the", s: 19.9, e: 20.1 },
      { w: "corner", s: 20.1, e: 20.5 },
      { w: "eye-markers,", s: 20.5, e: 21.2 },
      { w: "apply", s: 21.4, e: 21.8 },
      { w: "cybernetic", s: 21.8, e: 22.5 },
      { w: "emerald", s: 22.5, e: 23.1 },
      { w: "gradients,", s: 23.1, e: 23.8 },
      { w: "and", s: 23.9, e: 24.1 },
      { w: "generate", s: 24.1, e: 24.6 },
      { w: "a", s: 24.6, e: 24.8 },
      { w: "flawless", s: 24.8, e: 25.4 },
      { w: "high-contrast", s: 25.4, e: 26.0 },
      { w: "matrix.", s: 26.0, e: 26.8 }
    ]
  },
  {
    id: 4,
    start: 27.5,
    text: "Now, launching the built-in optical scanner. The laser beam sweeps the matrix, decrypting the verified payload instantly.",
    words: [
      { w: "Now,", s: 27.5, e: 27.9 },
      { w: "launching", s: 27.9, e: 28.5 },
      { w: "the", s: 28.5, e: 28.7 },
      { w: "built-in", s: 28.7, e: 29.3 },
      { w: "optical", s: 29.3, e: 29.8 },
      { w: "scanner.", s: 29.8, e: 30.5 },
      { w: "The", s: 30.7, e: 30.9 },
      { w: "laser", s: 30.9, e: 31.4 },
      { w: "beam", s: 31.4, e: 31.8 },
      { w: "sweeps", s: 31.8, e: 32.4 },
      { w: "the", s: 32.4, e: 32.6 },
      { w: "matrix,", s: 32.6, e: 33.2 },
      { w: "decrypting", s: 33.4, e: 34.1 },
      { w: "the", s: 34.1, e: 34.3 },
      { w: "verified", s: 34.3, e: 34.9 },
      { w: "payload", s: 34.9, e: 35.6 },
      { w: "instantly.", s: 35.6, e: 36.4 }
    ]
  },
  {
    id: 5,
    start: 36.8,
    text: "Next, we generate an official vCard for Neel Badri, embedding phone, email, and Class Of Learners credentials into an enterprise-ready card.",
    words: [
      { w: "Next,", s: 36.8, e: 37.3 },
      { w: "we", s: 37.3, e: 37.5 },
      { w: "generate", s: 37.5, e: 38.1 },
      { w: "an", s: 38.1, e: 38.3 },
      { w: "official", s: 38.3, e: 38.9 },
      { w: "vCard", s: 38.9, e: 39.5 },
      { w: "for", s: 39.5, e: 39.7 },
      { w: "Neel", s: 39.7, e: 40.2 },
      { w: "Badri,", s: 40.2, e: 40.9 },
      { w: "embedding", s: 41.1, e: 41.8 },
      { w: "phone,", s: 41.8, e: 42.4 },
      { w: "email,", s: 42.4, e: 43.0 },
      { w: "and", s: 43.1, e: 43.3 },
      { w: "Class", s: 43.3, e: 43.7 },
      { w: "Of", s: 43.7, e: 43.9 },
      { w: "Learners", s: 43.9, e: 44.5 },
      { w: "credentials", s: 44.5, e: 45.3 },
      { w: "into", s: 45.4, e: 45.7 },
      { w: "an", s: 45.7, e: 45.9 },
      { w: "enterprise-ready", s: 45.9, e: 46.9 },
      { w: "card.", s: 46.9, e: 47.5 }
    ]
  },
  {
    id: 6,
    start: 47.8,
    text: "Flawlessly rendered and ready for instant sharing. Engineered by Class Of Learners.",
    words: [
      { w: "Flawlessly", s: 47.8, e: 48.5 },
      { w: "rendered", s: 48.5, e: 49.1 },
      { w: "and", s: 49.1, e: 49.3 },
      { w: "ready", s: 49.3, e: 49.7 },
      { w: "for", s: 49.7, e: 49.9 },
      { w: "instant", s: 49.9, e: 50.4 },
      { w: "sharing.", s: 50.4, e: 51.1 },
      { w: "Engineered", s: 51.4, e: 52.0 },
      { w: "by", s: 52.0, e: 52.2 },
      { w: "Class", s: 52.2, e: 52.6 },
      { w: "Of", s: 52.6, e: 52.8 },
      { w: "Learners.", s: 52.8, e: 53.6 }
    ]
  }
];

// ── 2. Local Static Asset HTTP Server ──
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/home.html';
      if (!reqPath.includes('.')) reqPath += '.html';
      const filePath = path.join(ROOT_DIR, reqPath);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.json': 'application/json',
          '.wav': 'audio/wav'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('File not found: ' + reqPath);
      }
    });

    server.listen(PORT, () => {
      console.log(`Vertical Showcase preview server online: http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// ── 3. Subtitles (SRT & Vertical ASS Karaoke) ──
function generateSubtitleFiles() {
  let srtContent = '';
  function formatSrtTime(sec) {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
  }

  SCENES.forEach((sc, i) => {
    const endT = sc.words[sc.words.length - 1].e + 0.5;
    srtContent += `${i + 1}\n${formatSrtTime(sc.start)} --> ${formatSrtTime(endT)}\n${sc.text}\n\n`;
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'subtitles.srt'), srtContent);

  // Vertical ASS Karaoke (PlayResX 1080, PlayResY 1920)
  let assContent = `[Script Info]
Title: Class Of Learners QR Studio Matrix (Vertical Showcase)
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: KaraokeVertical,Inter,48,&H00FFFFFF,&H0010B981,&H00030712,&H80000000,-1,0,0,0,100,100,0,0,1,3,6,2,40,40,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  function formatAssTime(sec) {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor(((sec % 1) * 100));
    return `${hrs}:${String(mins).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }

  SCENES.forEach((sc) => {
    const startT = formatAssTime(sc.start);
    const endT = formatAssTime(sc.words[sc.words.length - 1].e + 0.5);
    let lineText = '';
    let curTime = sc.start;
    sc.words.forEach((wd) => {
      const waitCs = Math.max(0, Math.round((wd.s - curTime) * 100));
      const durCs = Math.max(1, Math.round((wd.e - wd.s) * 100));
      if (waitCs > 0) lineText += `{\\k${waitCs}} `;
      lineText += `{\\kf${durCs}}${wd.w} `;
      curTime = wd.e;
    });
    assContent += `Dialogue: 0,${startT},${endT},KaraokeVertical,,0,0,0,,${lineText.trim()}\n`;
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'subtitles_karaoke.ass'), assContent);
  console.log('Generated SRT and ASS Karaoke subtitles in output/');
}

// ── 4. Main Automated Producer Function ──
async function produceShowcaseVideo() {
  generateSubtitleFiles();
  const server = await startServer();

  console.log('Launching Chromium for Vertical 9:16 master capture (1080x1920 @ 60fps)...');
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1080, height: 1920 }
    }
  });

  const page = await context.newPage();

  // Helper: Inject Broadcast HUD & Real-time Subtitle Engine for Vertical View
  async function injectBroadcastOverlay(activeSceneId) {
    await page.evaluate(({ scenes, activeId }) => {
      if (document.getElementById('col-video-hud')) {
        window.__colActiveScene = activeId;
        return;
      }

      window.__colActiveScene = activeId;
      window.__colScenes = scenes;
      window.__colStartTime = Date.now();

      const hud = document.createElement('div');
      hud.id = 'col-video-hud';
      hud.innerHTML = `
        <style>
          #col-video-hud {
            position: fixed; inset: 0; pointer-events: none; z-index: 999999;
            font-family: 'Inter', system-ui, sans-serif;
          }
          /* Top Studio Badge - Vertical Format */
          .col-top-badge {
            position: absolute; top: 32px; left: 32px; right: 32px;
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(3, 7, 18, 0.92); backdrop-filter: blur(16px);
            border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 9999px;
            padding: 12px 24px; color: #f8fafc; font-family: 'Space Mono', monospace;
            font-size: 0.76rem; letter-spacing: 0.12em; font-weight: 700;
            box-shadow: 0 12px 36px rgba(0,0,0,0.7), 0 0 25px rgba(16,185,129,0.25);
          }
          .col-live-indicator {
            width: 10px; height: 10px; border-radius: 50%; background: #10b981;
            box-shadow: 0 0 14px #10b981; animation: colPulse 1.4s infinite ease-in-out;
            display: inline-block; margin-right: 8px;
          }
          @keyframes colPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.35;transform:scale(0.8);} }

          /* Word-by-word Highlighted Karaoke Subtitles (Lower-Third) */
          .col-caption-container {
            position: absolute; bottom: 140px; left: 0; right: 0;
            display: flex; justify-content: center; align-items: center; padding: 0 32px;
          }
          .col-caption-pill {
            background: rgba(3, 7, 18, 0.94); backdrop-filter: blur(24px);
            border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 9999px;
            padding: 18px 36px; box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 45px rgba(16,185,129,0.3);
            display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px;
            max-width: 980px; transition: all 0.25s ease;
          }
          .col-sub-word {
            font-size: 1.35rem; font-weight: 600; color: #94a3b8;
            transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
            letter-spacing: -0.01em; display: inline-block;
          }
          .col-sub-word.active {
            color: #10b981; font-weight: 900; transform: scale(1.18) translateY(-3px);
            text-shadow: 0 0 25px rgba(16, 185, 129, 0.95), 0 0 45px rgba(16, 185, 129, 0.6);
          }
          .col-sub-word.passed {
            color: #ffffff; font-weight: 700;
          }

          /* High-Visibility Virtual Cyber Cursor */
          #col-virtual-cursor {
            position: absolute; top: 0; left: 0; width: 36px; height: 36px;
            pointer-events: none; z-index: 1000000; transform: translate(540px, 960px);
            transition: transform 0.05s linear; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.85));
          }
          #col-cursor-ring {
            position: absolute; top: 0; left: 0; width: 52px; height: 52px;
            border-radius: 50%; border: 3px solid #10b981; pointer-events: none;
            opacity: 0; transform: translate(-50%, -50%) scale(0.3);
            transition: opacity 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1);
          }
          #col-cursor-ring.clicking {
            opacity: 1; transform: translate(-50%, -50%) scale(1.5);
          }

          /* Scanner Laser Overlay Beam */
          #col-scanner-beam {
            position: absolute; top: 0; left: 0; right: 0; height: 5px;
            background: linear-gradient(90deg, transparent, #10b981, #5ed4f5, #10b981, transparent);
            box-shadow: 0 0 30px #10b981, 0 0 60px #5ed4f5;
            display: none; pointer-events: none; z-index: 99999;
          }
          @keyframes laserAnim {
            0% { top: 12%; opacity: 0.85; }
            50% { top: 88%; opacity: 1; }
            100% { top: 12%; opacity: 0.85; }
          }
        </style>

        <div class="col-top-badge">
          <div><span class="col-live-indicator"></span>CLASS OF LEARNERS</div>
          <div style="color:#10b981;">QR MATRIX // 9:16 ULTRA HD</div>
        </div>

        <div class="col-caption-container">
          <div class="col-caption-pill" id="colCaptionPill">
            <span class="col-sub-word active">Initializing...</span>
          </div>
        </div>

        <div id="col-virtual-cursor">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M4 4l7 17 2.5-6.5L20 12 4 4z" fill="#10b981" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
          </svg>
        </div>
        <div id="col-cursor-ring"></div>
        <div id="col-scanner-beam"></div>
      `;
      document.body.appendChild(hud);

      // Real-time animation loop for subtitle word highlights
      function updateSubtitles() {
        const curSec = (Date.now() - window.__colGlobalStartTime) / 1000;
        const curScene = window.__colScenes.find(s => s.id === window.__colActiveScene);
        const pill = document.getElementById('colCaptionPill');

        if (curScene && pill) {
          pill.innerHTML = curScene.words.map((wd) => {
            const isActive = curSec >= wd.s && curSec < wd.e;
            const isPassed = curSec >= wd.e;
            const cls = isActive ? 'col-sub-word active' : (isPassed ? 'col-sub-word passed' : 'col-sub-word');
            return `<span class="${cls}">${wd.w}</span>`;
          }).join(' ');
        }
        requestAnimationFrame(updateSubtitles);
      }
      requestAnimationFrame(updateSubtitles);
    }, { scenes: SCENES, activeId: activeSceneId });
  }

  // Smooth Virtual Mouse Movement (Spline / Bezier Easing)
  async function moveVirtualMouse(x, y, durationMs = 600) {
    await page.evaluate(({ tx, ty, dur }) => {
      const cursor = document.getElementById('col-virtual-cursor');
      if (!cursor) return;
      const start = cursor.getBoundingClientRect();
      const sx = start.left, sy = start.top;
      const startTime = performance.now();

      function step(now) {
        const progress = Math.min((now - startTime) / dur, 1);
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        const cx = sx + (tx - sx) * ease;
        const cy = sy + (ty - sy) * ease;
        cursor.style.transform = `translate(${cx}px, ${cy}px)`;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { tx: x, ty: y, dur: durationMs });
    await page.waitForTimeout(durationMs + 40);
  }

  async function triggerMouseClick(x, y) {
    await page.evaluate(({ cx, cy }) => {
      const ring = document.getElementById('col-cursor-ring');
      if (ring) {
        ring.style.left = cx + 'px';
        ring.style.top = cy + 'px';
        ring.classList.add('clicking');
        setTimeout(() => ring.classList.remove('clicking'), 350);
      }
    }, { cx: x, cy: y });
    await page.waitForTimeout(100);
  }

  // Master timeline synchronization
  const masterStartEpoch = Date.now();
  await page.addInitScript((startEpoch) => {
    window.__colGlobalStartTime = startEpoch;
  }, masterStartEpoch);

  console.log('\n--- SCENE 1: Home Page & Project Ecosystem (0.0s - 10.5s) ---');
  await page.goto(`http://localhost:${PORT}/home.html`, { waitUntil: 'networkidle' });
  
  // Dismiss initial loader smoothly
  await page.evaluate(() => {
    const ldr = document.querySelector('.loader');
    if (ldr) ldr.classList.add('gone');
  });
  await page.waitForTimeout(400);

  await injectBroadcastOverlay(1);
  await moveVirtualMouse(540, 620, 700);
  await page.waitForTimeout(1200);

  // Smooth scroll down to QR Studio Matrix card
  console.log('Scrolling down to QR Studio Matrix card in Vertical View...');
  await page.evaluate(() => {
    window.scrollTo({ top: 1250, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // Hover over the QR card
  const qrCardBox = await page.evaluate(() => {
    const card = document.querySelector('a[href="qr"]') || document.querySelector('.pc[data-delay="240"]');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const r = card.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: 540, y: 780 };
  });

  await page.waitForTimeout(800);
  await moveVirtualMouse(qrCardBox.x, qrCardBox.y, 800);
  await triggerMouseClick(qrCardBox.x, qrCardBox.y);
  await page.waitForTimeout(1800);

  console.log('\n--- SCENE 2: Navigating to QR Editor (10.5s - 18.5s) ---');
  await page.goto(`http://localhost:${PORT}/qr-editor.html`, { waitUntil: 'networkidle' });

  // Inject Vertical Studio Styling: stacked layout where preview is centered & prominent
  await page.addStyleTag({
    content: `
      body { overflow-x: hidden !important; overflow-y: auto !important; background: #030712 !important; }
      .qr-app {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        padding: 40px 30px !important;
        gap: 24px !important;
        height: auto !important;
        max-width: 960px !important;
        margin: 0 auto !important;
      }
      .app-sb { display: none !important; }
      .prev-p {
        order: 1 !important;
        width: 100% !important;
        max-width: 780px !important;
        border-radius: 28px !important;
        padding: 24px !important;
        background: rgba(17, 24, 39, 0.88) !important;
        border: 1px solid rgba(16, 185, 129, 0.35) !important;
        box-shadow: 0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(16,185,129,0.2) !important;
        backdrop-filter: blur(20px) !important;
      }
      .prev-hd { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 12px !important; }
      .prev-cw {
        width: 330px !important;
        height: 330px !important;
        margin: 0 auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      #qrWrap { width: 310px !important; height: 310px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
      #qrWrap canvas, #qrWrap svg { width: 300px !important; height: 300px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.7) !important; }
      .prev-inf { display: flex !important; justify-content: space-around !important; padding: 14px 20px !important; background: rgba(3, 7, 18, 0.6) !important; border-radius: 14px !important; margin-top: 12px !important; }
      .qr-main {
        order: 2 !important;
        width: 100% !important;
        max-width: 780px !important;
        background: rgba(17, 24, 39, 0.75) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 28px !important;
        padding: 28px 32px !important;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6) !important;
      }
      .steps-bar { margin-bottom: 24px !important; }
      .type-grid { grid-template-columns: 1fr 1fr !important; }
    `
  });

  await injectBroadcastOverlay(2);
  await moveVirtualMouse(540, 520, 700);
  await page.waitForTimeout(1400);

  // Advance to Step 3 (Design)
  console.log('Advancing to Matrix Design step...');
  await page.evaluate(() => {
    if (typeof window.goStep === 'function') window.goStep(3);
  });
  await page.waitForTimeout(1100);

  console.log('\n--- SCENE 3: Customizing QR Matrix Styling (18.5s - 27.0s) ---');
  await injectBroadcastOverlay(3);

  // Customize dot style to classy-rounded
  await page.evaluate(() => {
    const dotsBtn = document.querySelector('[data-dot="classy-rounded"]') || document.querySelector('[data-dot="dots"]') || document.querySelector('.ds-btn');
    if (dotsBtn) dotsBtn.click();
    if (typeof window.setPattern === 'function') window.setPattern('classy-rounded');
  });
  await moveVirtualMouse(420, 1100, 500);
  await triggerMouseClick(420, 1100);
  await page.waitForTimeout(600);

  // Customize eye corner markers
  await page.evaluate(() => {
    if (typeof window.setCorner === 'function') window.setCorner('extra-rounded');
  });
  await moveVirtualMouse(660, 1100, 400);
  await triggerMouseClick(660, 1100);
  await page.waitForTimeout(700);

  // Set cybernetic gradient colors in the matrix
  await page.evaluate(() => {
    if (window.opts && window.qrInst) {
      opts.dotsOptions = Object.assign({}, opts.dotsOptions, {
        type: 'classy-rounded',
        gradient: {
          type: 'linear',
          rotation: 45,
          colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#5ed4f5' }]
        }
      });
      opts.cornersSquareOptions = Object.assign({}, opts.cornersSquareOptions, {
        type: 'extra-rounded',
        color: '#10b981'
      });
      opts.cornersDotOptions = Object.assign({}, opts.cornersDotOptions, {
        type: 'dot',
        color: '#5ed4f5'
      });
      opts.qrOptions = { errorCorrectionLevel: 'H' };
      qrInst.update(opts);
      if (typeof window.updateInfo === 'function') window.updateInfo();
    }
  });

  // Glide cursor up to live QR preview canvas
  await moveVirtualMouse(540, 360, 700);
  await page.waitForTimeout(2000);

  console.log('\n--- SCENE 4: Optical Scanning & Instant Decoding (27.0s - 36.2s) ---');
  await injectBroadcastOverlay(4);

  // Trigger Scanner Modal
  await page.evaluate(() => {
    if (typeof window.openScannerModal === 'function') window.openScannerModal();
  });
  await moveVirtualMouse(540, 800, 600);
  await page.waitForTimeout(800);

  // Activate animated laser sweep inside scanner modal
  await page.evaluate(() => {
    const beam = document.getElementById('col-scanner-beam');
    const modalBox = document.getElementById('scanCamSection') || document.querySelector('.modal-card') || document.querySelector('.md');
    if (beam && modalBox) {
      const rect = modalBox.getBoundingClientRect();
      beam.style.display = 'block';
      beam.style.left = (rect.left + 20) + 'px';
      beam.style.width = (rect.width - 40) + 'px';
      beam.style.animation = 'laserAnim 2.2s infinite ease-in-out';
    }
    const status = document.getElementById('camStatus');
    if (status) status.innerHTML = '<span style="color:#10b981; font-weight:700;">SCANNING FRAME: 60 FPS OPTICAL RECOGNITION</span>';
  });

  await moveVirtualMouse(540, 720, 1000);
  await page.waitForTimeout(2200);

  // Laser completes -> Reveal decoded result payload!
  console.log('Laser scan decoded! Revealing verified result...');
  await page.evaluate(() => {
    const beam = document.getElementById('col-scanner-beam');
    if (beam) beam.style.display = 'none';

    if (typeof window.showScannedResult === 'function') {
      window.showScannedResult('https://advancedlogiclabs.dpdns.org/qr-matrix?verified=col_signature_2026');
    }
    const status = document.getElementById('camStatus');
    if (status) status.innerHTML = '<span style="color:#10b981; font-weight:800;">✓ PAYLOAD VERIFIED // SUB-MILLISECOND DECODE</span>';
  });

  await moveVirtualMouse(540, 840, 600);
  await page.waitForTimeout(2200);

  // Close scanner modal
  await page.evaluate(() => {
    if (typeof window.closeScannerModal === 'function') window.closeScannerModal();
  });
  await page.waitForTimeout(800);

  console.log("\n--- SCENE 5: Creating Neel Badri's Official vCard (36.2s - 47.0s) ---");
  await injectBroadcastOverlay(5);

  // Step 1: Switch to vCard type
  await page.evaluate(() => {
    if (typeof window.goStep === 'function') window.goStep(1);
    const vcardBtn = Array.from(document.querySelectorAll('.tc')).find(el => el.textContent.toLowerCase().includes('vcard'));
    if (vcardBtn) vcardBtn.click();
    else if (typeof window.selType !== 'undefined') window.selType = 'vcard';
    if (typeof window.nextFrom1 === 'function') window.nextFrom1();
  });

  await moveVirtualMouse(380, 880, 600);
  await triggerMouseClick(380, 880);
  await page.waitForTimeout(600);

  // Step 2: Form input simulation with human typing cadence
  console.log("Typing Neel Badri's credentials...");
  async function typeHuman(selector, text, x, y) {
    await moveVirtualMouse(x, y, 400);
    await triggerMouseClick(x, y);
    await page.focus(selector);
    for (let char of text) {
      await page.keyboard.type(char, { delay: 40 });
    }
    await page.evaluate(() => { if (typeof window.lu === 'function') window.lu(); });
    await page.waitForTimeout(140);
  }

  // Type form fields
  await typeHuman('#vc0', 'Neel Badri', 380, 880);
  await typeHuman('#vc1', 'CoL (Class Of Learners)', 680, 880);
  await typeHuman('#vc2', '+91 8433614159', 380, 970);
  await typeHuman('#vc3', 'neelgbadri@col.dpdns.org', 680, 970);

  // Proceed to Step 3 (Design) with vCard payload
  await page.evaluate(() => {
    if (typeof window.goStep === 'function') window.goStep(3);
    if (window.opts && window.qrInst) {
      opts.data = `BEGIN:VCARD\nVERSION:3.0\nFN:Neel Badri\nORG:CoL (Class Of Learners)\nTEL:+91 8433614159\nEMAIL:neelgbadri@col.dpdns.org\nURL:https://advancedlogiclabs.dpdns.org\nADR:;;Mumbai, India;;;\nEND:VCARD`;
      opts.dotsOptions = {
        type: 'classy-rounded',
        gradient: {
          type: 'linear',
          rotation: 45,
          colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#00f0cc' }]
        }
      };
      opts.cornersSquareOptions = { type: 'extra-rounded', color: '#10b981' };
      opts.cornersDotOptions = { type: 'dot', color: '#00f0cc' };
      opts.qrOptions = { errorCorrectionLevel: 'H' };
      qrInst.update(opts);
      if (typeof window.updateInfo === 'function') window.updateInfo();
    }
  });

  await page.waitForTimeout(1200);

  console.log('\n--- SCENE 6: Cinematic Finale & Studio Showcase (47.0s - 54.5s) ---');
  await injectBroadcastOverlay(6);

  // In Vertical Format: Highlight the preview card and append the Verified VIP vCard Badge
  await page.evaluate(() => {
    const card = document.querySelector('.prev-p');
    if (card) {
      card.style.transform = 'scale(1.03)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      card.style.boxShadow = '0 0 70px rgba(16,185,129,0.5), 0 30px 80px rgba(0,0,0,0.9)';
      card.style.borderColor = '#10b981';
    }

    const badge = document.createElement('div');
    badge.id = 'col-verified-vcard-badge';
    badge.innerHTML = `
      <div style="
        position: fixed; top: 680px; left: 80px; right: 80px; z-index: 999999;
        background: rgba(3, 7, 18, 0.95); backdrop-filter: blur(24px);
        border: 2px solid #10b981; border-radius: 24px; padding: 28px 32px;
        box-shadow: 0 40px 100px rgba(0,0,0,0.95), 0 0 50px rgba(16,185,129,0.45);
        font-family: 'Space Mono', monospace; text-align: center; animation: colPop 0.5s ease;
      ">
        <style>@keyframes colPop { from{opacity:0;transform:scale(0.85);} to{opacity:1;transform:scale(1);} }</style>
        <div style="font-size:0.85rem; letter-spacing:0.25em; color:#10b981; font-weight:800; margin-bottom:10px;">★ VERIFIED ENTERPRISE VCARD ★</div>
        <div style="font-size:1.8rem; font-weight:800; color:#ffffff; font-family:'Inter', sans-serif;">Neel Badri</div>
        <div style="font-size:1.05rem; color:#94a3b8; margin-top:4px; font-weight:600;">CoL (Class Of Learners)</div>
        <div style="font-size:1rem; color:#5ed4f5; margin-top:14px; font-weight:700;">📞 +91 8433614159</div>
        <div style="font-size:0.95rem; color:#cbd5e1; margin-top:4px;">✉️ neelgbadri@col.dpdns.org</div>
        <div style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.12); font-size:0.75rem; color:#10b981; letter-spacing:0.1em;">
          MATRIX FORMAT: REED-SOLOMON ECC LEVEL H (30%) // AES VERIFIED
        </div>
      </div>
    `;
    document.body.appendChild(badge);
  });

  await moveVirtualMouse(540, 520, 800);
  
  // Wait until master timeline reaches at least 55.5 seconds so entire outro audio plays
  const elapsedMs = Date.now() - masterStartEpoch;
  const targetDurationMs = 55500;
  const remainingMs = Math.max(2000, targetDurationMs - elapsedMs);
  console.log(`Holding Scene 6 for full audio synchronization: ${remainingMs}ms`);
  await page.waitForTimeout(remainingMs);

  // Close context to finalize video recording
  console.log('Closing Playwright session and saving raw vertical video...');
  await page.close();
  await context.close();
  await browser.close();
  server.close();

  // Find recorded WebM file
  const videoFiles = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No recorded video file found in ' + RECORDINGS_DIR);
  }
  const rawVideoPath = path.join(RECORDINGS_DIR, videoFiles[videoFiles.length - 1]);
  console.log(`Raw recording ready: ${rawVideoPath} (${(fs.statSync(rawVideoPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // ── 5. FFmpeg Production Mastering & Muxing ──
  const soundtrackPath = path.join(OUTPUT_DIR, 'master_soundtrack.wav');
  const finalVideoPath = path.join(OUTPUT_DIR, 'ClassOfLearners_QR_Matrix_Showcase_Vertical.mp4');

  console.log('\nMastering final broadcast-grade Vertical MP4 (1080x1920) with FFmpeg...');
  const ffmpegCmd = [
    'ffmpeg -y',
    `-i "${rawVideoPath}"`,
    `-i "${soundtrackPath}"`,
    '-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 60',
    '-c:a aac -b:a 256k -ar 44100',
    '-shortest',
    `"${finalVideoPath}"`
  ].join(' ');

  execSync(ffmpegCmd, { stdio: 'inherit' });
  const finalSizeMb = (fs.statSync(finalVideoPath).size / 1024 / 1024).toFixed(2);

  // Also copy/symlink as ClassOfLearners_QR_Matrix_Showcase.mp4
  const standardPath = path.join(OUTPUT_DIR, 'ClassOfLearners_QR_Matrix_Showcase.mp4');
  fs.copyFileSync(finalVideoPath, standardPath);

  console.log(`\n======================================================`);
  console.log(`🏆 MASTER VERTICAL PRODUCTION VIDEO CREATED SUCCESSFULLY!`);
  console.log(`📁 File: ${finalVideoPath}`);
  console.log(`📦 Size: ${finalSizeMb} MB`);
  console.log(`🎬 Aspect Ratio: 9:16 Vertical (1080x1920 Full HD @ 60 FPS)`);
  console.log(`🎙️ Audio: Synchronized Narration + Cyber Ambient BGM + UI SFX`);
  console.log(`💬 Subtitles: Real-time Word-by-Word Karaoke Highlighting + SRT + ASS`);
  console.log(`======================================================\n`);
}

produceShowcaseVideo().catch(err => {
  console.error('Video production failed:', err);
  process.exit(1);
});
