// Dumps window.STORY from story/campaign.js as JSON so scripts/analyze_film.py
// can measure the film.
//
// campaign.js is a browser IIFE that writes to `window`, and it cannot be passed
// to `node -e` inline: at ~35KB the command line exceeds the Windows limit. Hence
// this file, which lives on disk and simply requires the real module after
// providing the one global it needs.
//
// It requires the REAL file rather than re-parsing the source with a regex,
// so a measurement can never disagree with what the browser actually registers.

global.window = {};
try {
  require('../story/campaign.js');
} catch (err) {
  process.stderr.write('campaign.js threw on load: ' + (err && err.message) + '\n');
  process.exit(1);
}
const out = global.window.STORY || {};
process.stdout.write(JSON.stringify(out));