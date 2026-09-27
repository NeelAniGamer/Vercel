const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const mediaDir = path.join(__dirname, '..', 'career_media');
  const videoDir = path.join(mediaDir, 'raw_videos');
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  console.log('Launching Chromium for automated walkthrough and recording...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:8088/Career.html...');
  await page.goto('http://localhost:8088/Career.html', { waitUntil: 'networkidle' });
  await sleep(1000);

  // 1. Hero Section
  console.log('Capturing Scene 1: Hero Section...');
  await page.screenshot({ path: path.join(mediaDir, '01_hero_showcase.png') });
  await sleep(1500);

  // Smooth scroll down to Controls & Filters
  console.log('Capturing Scene 2: Search & Filter Toolbar...');
  await page.evaluate(() => {
    document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
  });
  await sleep(1200);
  await page.screenshot({ path: path.join(mediaDir, '02_controls_and_filters.png') });
  await sleep(1000);

  // Switch to "Harder To Automate"
  console.log('Filtering: Harder To Automate...');
  await page.click('button.seg-btn[data-mode="ai"]');
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '03_harder_to_automate.png') });

  // Switch back to "All Pathways"
  await page.click('button.seg-btn[data-mode="all"]');
  await sleep(800);

  // Search for "Cybersecurity"
  console.log('Testing interactive search...');
  await page.fill('#search-input', 'Cybersecurity');
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '04_instant_search_filter.png') });
  await page.fill('#search-input', '');
  await sleep(800);

  // Open Cybersecurity Detail Modal
  console.log('Opening Cybersecurity Detail Modal...');
  await page.evaluate(() => openDetail('cybersecurity'));
  await sleep(1500);

  // 4. Modal Header & Two Bento Boxes
  console.log('Capturing Scene 4: Two Bento Boxes (Financial Outlook & AI Resilience)...');
  await page.screenshot({ path: path.join(mediaDir, '05_modal_two_bento_boxes.png') });
  await sleep(1500);

  // 5. Seniority & Salary Calculator
  console.log('Interacting with Experience & Salary Slider...');
  await page.evaluate(() => {
    const slider = document.getElementById('exp-slider');
    if (slider) {
      slider.value = 7;
      updateExpCalculator(7);
    }
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '06_salary_experience_calculator.png') });
  await sleep(1200);

  // 6. Tab 1: Degrees & Exams
  console.log('Capturing Tab 1: Degrees & Entrance Exams...');
  await page.click('button.modal-tab-btn[data-tab="1"]');
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '07_modal_degrees_and_exams.png') });
  await sleep(1200);

  // 7. Tab 2: Career Roadmap (Phases 1, 2, 3)
  console.log('Capturing Tab 2: 3-Phase Career Roadmap...');
  await page.click('button.modal-tab-btn[data-tab="2"]');
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '08_modal_career_roadmap.png') });
  await sleep(1200);

  // 8. Tab 3: Skills & Job Titles
  console.log('Capturing Tab 3: Hard/Soft Skills & Official Titles...');
  await page.click('button.modal-tab-btn[data-tab="3"]');
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '09_modal_skills_and_titles.png') });
  await sleep(1200);

  // 9. Tab 5: Is It For You? (Pros & Cons)
  console.log('Capturing Tab 5: Pros, Cons & Decision Fit...');
  await page.click('button.modal-tab-btn[data-tab="5"]');
  await sleep(1000);
  await page.screenshot({ path: path.join(mediaDir, '10_modal_decision_fit.png') });
  await sleep(1200);

  // Close Modal
  console.log('Closing Detail Modal...');
  await page.evaluate(() => closeDetail());
  await sleep(1000);

  // Add 2 Careers to Compare and Open Comparison Table
  console.log('Capturing Side-by-Side Comparison Matrix...');
  await page.evaluate(() => {
    compareList = ['cybersecurity', 'ai-ml', 'pilot'];
    openComparisonModal();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(mediaDir, '11_side_by_side_comparison.png') });
  await sleep(1200);

  // Close Comparison
  await page.evaluate(() => closeComparisonModal());
  await sleep(800);

  // Open Career Compass Quiz
  console.log('Capturing Career Compass 60-Second Quiz...');
  await page.evaluate(() => openCompassModal());
  await sleep(1200);
  await page.screenshot({ path: path.join(mediaDir, '12_career_compass_quiz.png') });
  await sleep(1000);

  // Answer first question
  await page.evaluate(() => answerCompass(0, 'tech'));
  await sleep(1000);

  // Close Compass
  await page.evaluate(() => closeCompassModal());
  await sleep(800);

  // Open 50,000+ Job Titles Map
  console.log('Capturing 50,000+ Job Titles Explorer...');
  await page.evaluate(() => openInternshipHub());
  await sleep(1200);
  await page.screenshot({ path: path.join(mediaDir, '13_job_titles_50k_explorer.png') });
  await sleep(1500);

  await page.evaluate(() => closeInternshipHub());
  await sleep(1000);

  // Return to top smoothly
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1500);

  console.log('Closing browser and finalizing video stream...');
  await page.close();
  await context.close();
  await browser.close();

  console.log('Recording and screenshots completed successfully!');
})();
