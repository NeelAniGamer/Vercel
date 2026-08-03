import { test, expect } from '@playwright/test';
const path = require('path');

test('Driving page should not throw errors', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console error: ${msg.text()}`);
    }
  });

  const fileUrl = 'file://' + path.resolve('Driving.html');
  await page.goto(fileUrl);
  
  await page.waitForTimeout(3000);
  
  expect(pageErrors.length).toBe(0);
});
