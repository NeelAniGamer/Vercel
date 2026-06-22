/**
 * Vercel Speed Insights Integration
 * This file imports and initializes Vercel Speed Insights for the site
 */

// Import the injectSpeedInsights function from the npm package
import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2.0.0/dist/index.mjs';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false, // Set to true for development debugging
  sampleRate: 1, // Send 100% of events (set to 0.5 for 50%, etc.)
});
