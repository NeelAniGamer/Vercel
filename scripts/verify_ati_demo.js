const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

async function main() {
  console.log('--- Starting ATI Demo Playwright Verification ---');

  // Create lightweight local server to serve dist/
  const distDir = path.join(__dirname, '..', 'dist');
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/ati-demo') reqPath = '/ati-demo.html';
    const filePath = path.join(distDir, reqPath.replace(/^\/+/, ''));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.json': 'application/json'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(8765, resolve));
  console.log('Test server running at http://localhost:8765');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('Browser Page Error:', err.message);
    errors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore external analytics/ads, GSI identity services on localhost, or favicon missing on test server
      if (text.includes('google') || text.includes('adsbygoogle') || text.includes('404') || text.includes('GSI') || text.includes("Provider's accounts list")) {
        return;
      }
      console.error('Browser Console Error:', text);
      errors.push(text);
    }
  });

  try {
    await page.goto('http://localhost:8765/ati-demo.html', { waitUntil: 'domcontentloaded' });
    console.log('✓ Page loaded successfully');

    // 1. Verify basic elements
    await page.waitForSelector('#terminal');
    await page.waitForSelector('#wordsWrapper .word');
    const wordCount = await page.locator('#wordsWrapper .word').count();
    console.log(`✓ Words rendered: ${wordCount} words`);
    if (wordCount === 0) throw new Error('No words rendered in DOM');

    // 2. Check virtual keyboard
    const keyCount = await page.locator('#virtualKeyboard .key').count();
    console.log(`✓ Keyboard rendered: ${keyCount} keys`);
    if (keyCount < 40) throw new Error('Virtual keyboard missing keys');

    // Verify finger annotations
    const pinkyKeys = await page.locator('.key[data-finger="lp"]').count();
    if (pinkyKeys === 0) throw new Error('Missing finger data annotations');
    console.log(`✓ Finger data annotations present (e.g. left pinky: ${pinkyKeys} keys)`);

    // 3. Test typing characters
    console.log('Testing manual keystroke input...');
    // Focus typing area
    await page.click('#typingStage');

    // Get the first word characters
    const firstWordChars = await page.locator('#w_0 .char').allTextContents();
    console.log('Target first word:', firstWordChars.join(''));

    // Type first character correctly
    const firstChar = firstWordChars[0];
    await page.keyboard.press(firstChar);
    await page.waitForTimeout(50);

    const typedAfterPress = await page.evaluate(() => window.debugGetTyped());
    console.log('Typed word after 1 press:', typedAfterPress);

    const firstSpanCls = await page.locator('#c_0_0').getAttribute('class');
    if (!firstSpanCls.includes('correct')) throw new Error(`Expected first char to be correct, got: ${firstSpanCls}`);
    console.log('✓ First keystroke registered as correct');

    // Test backspace
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(50);
    const typedAfterBs = await page.evaluate(() => window.debugGetTyped());
    console.log('Typed word after backspace:', typedAfterBs);
    const revertedCls = await page.locator('#c_0_0').getAttribute('class');
    if (revertedCls.includes('correct')) throw new Error(`Backspace did not revert char state, class is: ${revertedCls}`);
    console.log('✓ Backspace successfully reverted char state');

    // Retype correctly
    await page.keyboard.press(firstChar);

    // Type a deliberate typo for the second character
    const wrongChar = (firstWordChars[1] === 'x') ? 'z' : 'x';
    await page.keyboard.press(wrongChar);
    await page.waitForTimeout(50);

    const secondSpanCls = await page.locator('#c_0_1').getAttribute('class');
    if (!secondSpanCls.includes('incorrect')) throw new Error(`Expected typo to be incorrect, got: ${secondSpanCls}`);
    console.log('✓ Typo correctly flagged as incorrect');

    // 4. Test mode switching (JavaScript mode with syntax tokens)
    console.log('Testing mode switch to JavaScript...');
    await page.click('button[data-mode="js"]');
    await page.waitForTimeout(100);

    const jsTokens = await page.locator('#wordsWrapper .tok-keyword').count();
    console.log(`✓ JavaScript mode syntax tokens generated: ${jsTokens} keyword tokens`);
    if (jsTokens === 0) throw new Error('Syntax highlighting failed to generate keyword tokens in JS mode');

    // 5. Test Quotes mode
    console.log('Testing mode switch to Quotes...');
    await page.click('button[data-mode="quotes"]');
    await page.waitForTimeout(100);
    const quoteWords = await page.locator('#wordsWrapper .word').count();
    console.log(`✓ Quotes mode loaded with ${quoteWords} words`);

    // 6. Test Auto-Simulation
    console.log('Testing AI Auto-Simulation...');
    await page.click('#btnAutoSim');
    await page.waitForTimeout(1500); // Let it type for 1.5s

    const typedCount = await page.locator('#wordsWrapper .char.correct').count();
    console.log(`✓ AI Simulation actively typed ${typedCount} correct characters`);
    if (typedCount < 3) throw new Error('Auto-simulation failed to advance typing');

    const liveWpm = await page.locator('#telNetWPM').innerText();
    console.log(`✓ Live Net WPM reading: ${liveWpm} WPM`);

    // Stop simulation
    await page.click('#btnAutoSim');
    await page.waitForTimeout(200);

    // 7. Test Reset (Esc)
    console.log('Testing Reset functionality...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const resetWpm = await page.locator('#telNetWPM').innerText();
    if (resetWpm !== '0') throw new Error(`Expected reset WPM to be 0, got ${resetWpm}`);
    console.log('✓ Reset (Esc) restored state cleanly');

    // 8. Test Doubt Solver
    console.log('Testing Doubt Solver...');
    await page.click('#atiDoubtChips button:first-child');
    await page.waitForTimeout(100);
    const answer = await page.locator('#atiDoubtAnswer').innerHTML();
    if (!answer || answer.length < 20) throw new Error('Doubt solver failed to render answer');
    console.log('✓ Doubt solver chip answered successfully');

    // 9. Test Theme Toggle
    console.log('Testing light mode / dark mode...');
    await page.evaluate(() => window.applyTheme(true));
    const isLight = await page.evaluate(() => document.documentElement.classList.contains('lm'));
    if (!isLight) throw new Error('Light mode toggle failed');
    await page.evaluate(() => window.applyTheme(false));
    console.log('✓ Theme toggle switches seamlessly');

    // 10. Check if any uncaught errors occurred
    if (errors.length > 0) {
      throw new Error(`Encountered ${errors.length} browser errors during test run`);
    }

    console.log('=== ALL 10 VERIFICATION CHECKS PASSED PERFECTLY ===');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('Verification FAILED:', err);
  process.exit(1);
});
