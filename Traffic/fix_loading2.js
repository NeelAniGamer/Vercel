const fs = require('fs');
let ac = fs.readFileSync('Academy.html', 'utf8');

// Use regex to remove the loading screen div completely
ac = ac.replace(/<div id="loading-screen">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, ''); // Wait, might be risky.
// Let's just set display:none !important in the CSS or remove the specific element cleanly.
ac = ac.replace(/<div id="loading-screen">/, '<div id="loading-screen" style="display: none !important;">');

// Also hide the Game Canvas #gc just in case
ac = ac.replace(/<div id="gc">/, '<div id="gc" style="display: none !important;">');

fs.writeFileSync('Academy.html', ac);
console.log('Academy.html loading screen hidden via inline style');
