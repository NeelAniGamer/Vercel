const fs = require('fs');
const path = require('path');

const files = ['solar.html', 'gesture.html', 'rpg.html', 'qr.html', 'qr-editor.html'];
const dir = 'c:/Users/neelg/OneDrive/Desktop/Vercel';

for (const file of files) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove theme toggles
    content = content.replace(/<div class="tw">.*?<\/div>/gs, '');
    content = content.replace(/\.theme-switch-wrapper[^}]+\}/gs, '');
    content = content.replace(/function toggleTheme.*?\n\s*\}/gs, '');
    content = content.replace(/initializeTheme\(\);/g, '');
    
    // Fix garbled emojis
    // Feature Cards
    content = content.replace(/<h3>[^\w]*?Real-Time Data<\/h3>/g, '<h3>\uD83D\uDCCA Real-Time Data</h3>');
    content = content.replace(/<h3>[^\w]*?N-Body Simulation<\/h3>/g, '<h3>\uD83C\uDF0C N-Body Simulation</h3>');
    content = content.replace(/<h3>[^\w]*?Dedicated GPU<\/h3>/g, '<h3>\uD83D\uDDA5\uFE0F Dedicated GPU</h3>');
    content = content.replace(/<h3>[^\w]*?Active Feedback<\/h3>/g, '<h3>\uD83D\uDCA1 Active Feedback</h3>');
    content = content.replace(/<h3>[^\w]*?Progress Tracking<\/h3>/g, '<h3>\uD83D\uDCC8 Progress Tracking</h3>');
    content = content.replace(/<h3>[^\w]*?Adaptive Learning<\/h3>/g, '<h3>\uD83E\uDDE0 Adaptive Learning</h3>');
    content = content.replace(/<h3>[^\w]*?Live Telemetry<\/h3>/g, '<h3>\uD83D\uDCE1 Live Telemetry</h3>');
    content = content.replace(/<h3>[^\w]*?Open Source Models<\/h3>/g, '<h3>\uD83E\uDD16 Open Source Models</h3>');
    content = content.replace(/<h3>[^\w]*?No Webcam Required<\/h3>/g, '<h3>\uD83D\uDCF7 No Webcam Required</h3>');
    content = content.replace(/<h3>[^\w]*?Global Scope<\/h3>/g, '<h3>\uD83C\uDF0E Global Scope</h3>');
    content = content.replace(/<h3>[^\w]*?Turn-Based Battles<\/h3>/g, '<h3>\u2694\uFE0F Turn-Based Battles</h3>');
    content = content.replace(/<h3>[^\w]*?Resource Management<\/h3>/g, '<h3>\uD83D\uDCB0 Resource Management</h3>');
    content = content.replace(/<h3>[^\w]*?Strategic Depth<\/h3>/g, '<h3>\uD83C\uDFAF Strategic Depth</h3>');
    
    // Link / Button mojibake fixes
    content = content.replace(/>[^<\w]*?Live Telemetry</g, '>\uD83D\uDCE1 Live Telemetry<');
    content = content.replace(/>[^<\w]*?Live Global Scope</g, '>\uD83C\uDF0E Live Global Scope<');
    content = content.replace(/>[^<\w]*?Offline</g, '>\uD83D\uDCF4 Offline<');
    content = content.replace(/>[^<\w]*?Check Back</g, '>\uD83D\uDD14 Check Back<');
    content = content.replace(/>[^<\w]*?Continue</g, '>\u27A1\uFE0F Continue<');
    content = content.replace(/>[^<\w]*?Download PNG</g, '>\uD83D\uDCE5 Download PNG<');
    content = content.replace(/>[^<\w]*?Hand Tracking</g, '>\uD83E\uDD1A Hand Tracking<');
    content = content.replace(/>[^<\w]*?Last Saved</g, '>\uD83D\uDCBE Last Saved<');
    content = content.replace(/>[^<\w]*?Action Bar</g, '>\u26A1 Action Bar<');
    content = content.replace(/>[^<\w]*?Workspace</g, '>\uD83D\uDDA5\uFE0F Workspace<');

    // Random Line Bug
    content = content.replace(/ \| /g, ' &middot; ');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${file}`);
}
