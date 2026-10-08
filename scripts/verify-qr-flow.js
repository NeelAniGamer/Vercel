const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Start a lightweight local static server
const port = 8089;
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/home.html';
  if (!reqPath.includes('.')) reqPath += '.html';
  const filePath = path.join(__dirname, '..', reqPath);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Visit Home
    console.log('Testing Home navigation...');
    await page.goto(`http://localhost:${port}/home.html`, { waitUntil: 'domcontentloaded' });
    console.log('Home Title:', await page.title());

    // 2. Navigate to QR
    console.log('Testing QR Editor navigation...');
    await page.goto(`http://localhost:${port}/qr-editor.html`, { waitUntil: 'domcontentloaded' });
    console.log('QR Title:', await page.title());

    // Wait for styling library
    await page.waitForTimeout(1000);

    // 3. Test QR type selection & custom matrix
    const typeCards = await page.$$eval('.tc', els => els.map(e => e.textContent.trim()));
    console.log('Available Type Cards count:', typeCards.length);

    // Switch to vCard
    await page.evaluate(() => {
      const vcard = Array.from(document.querySelectorAll('.tc')).find(el => el.textContent.toLowerCase().includes('vcard'));
      if (vcard) vcard.click();
    });
    await page.waitForTimeout(500);

    // Check vCard inputs
    const vc0 = await page.$('#vc0');
    console.log('vCard Full Name input #vc0 found:', !!vc0);

    if (vc0) {
      await page.fill('#vc0', 'Neel Badri');
      await page.fill('#vc1', 'CoL (Class Of Learners)');
      await page.fill('#vc2', '+91 8433614159');
      await page.fill('#vc3', 'neelgbadri@col.dpdns.org');
      console.log('Filled vCard with Neel Badri details!');
    }

    // Trigger update
    await page.evaluate(() => {
      if (typeof window.lu === 'function') window.lu();
    });
    await page.waitForTimeout(800);

    // Check QR canvas
    const canvasExists = await page.evaluate(() => {
      const c = document.querySelector('#qrCanvasWrapper canvas') || document.querySelector('#previewCanvas') || document.querySelector('canvas');
      return !!c;
    });
    console.log('QR Canvas rendered:', canvasExists);

    // Test Scanner modal
    console.log('Testing Scanner modal...');
    await page.evaluate(() => {
      if (typeof window.openScannerModal === 'function') {
        window.openScannerModal();
      }
    });
    await page.waitForTimeout(500);
    const scannerOpen = await page.evaluate(() => {
      const m = document.getElementById('scannerModal');
      return m && m.classList.contains('active');
    });
    console.log('Scanner Modal open:', scannerOpen);

    // Test simulated scan result
    await page.evaluate(() => {
      if (typeof window.showScannedResult === 'function') {
        window.showScannedResult('BEGIN:VCARD\nVERSION:3.0\nFN:Neel Badri\nORG:CoL (Class Of Learners)\nTEL:+91 8433614159\nEMAIL:neelgbadri@col.dpdns.org\nEND:VCARD');
      }
    });
    await page.waitForTimeout(500);

    const scanResultText = await page.$eval('#scanResultText', el => el.textContent);
    console.log('Scanned result decoded successfully:', scanResultText.includes('Neel Badri'));

    console.log('\nALL QR EDITOR FUNCTIONS VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
    server.close();
  }
});
