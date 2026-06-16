const fs = require('fs');

function fixAti() {
    let content = fs.readFileSync('c:/Users/neelg/OneDrive/Desktop/Vercel/ati.html', 'utf8');

    // 1. Remove Light/Dark mode UI and logic
    content = content.replace(/<div class="tw">[\s\S]*?<\/div>/, '');
    content = content.replace(/\.theme-switch-wrapper[\s\S]*?\{[\s\S]*?\}/, '');
    content = content.replace(/function toggleTheme[\s\S]*?\{[\s\S]*?\n\}/, '');
    content = content.replace(/function initializeTheme[\s\S]*?\{[\s\S]*?\n\}/, '');
    content = content.replace(/initializeTheme\(\);/g, '');

    // 2. Fix garbled emojis
    content = content.replace(/>[^<]*?Play Web Demo</g, '>&#128187; Play Web Demo<'); // Laptop emoji
    // Third feature card - "Active Feedback"
    content = content.replace(/<h3>[^<]*?Active Feedback<\/h3>/g, '<h3>\uD83D\uDCA1 Active Feedback</h3>'); // light bulb
    content = content.replace(/<h3>[^<]*?Progress Tracking<\/h3>/g, '<h3>\uD83D\uDCC8 Progress Tracking</h3>'); // chart
    content = content.replace(/<h3>[^<]*?Adaptive Learning<\/h3>/g, '<h3>\uD83E\uDDE0 Adaptive Learning</h3>'); // brain

    // Let's replace Mojibake  or \u0013 with nothing or space where necessary.
    content = content.replace(//g, '');

    fs.writeFileSync('c:/Users/neelg/OneDrive/Desktop/Vercel/ati.html', content);
    console.log("ati.html updated");
}
fixAti();
