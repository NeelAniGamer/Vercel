const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const errors = [];
    const consoleMsgs = [];
    const networkFailures = [];

    await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', e => {
            console.log(`[GLOBAL_ERROR] ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
        });
    });

    page.on('console', msg => {
        consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
    });

    try {
        console.log('Navigating to https://advancedlogiclabs.dpdns.org/Traffic/Academy ...');
        await page.goto('https://advancedlogiclabs.dpdns.org/Traffic/Academy', { waitUntil: 'networkidle0', timeout: 30000 });
        
        console.log('\n--- Console Messages ---');
        consoleMsgs.forEach(m => console.log(m));
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
})();
