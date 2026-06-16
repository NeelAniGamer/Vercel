const fs = require('fs');
const path = require('path');

const files = [
    'ati.html', 'solar.html', 'gesture.html', 'rpg.html', 
    'qr.html', 'engine.html', 'qr-editor.html', 'feedback.html', 'terms.html', 'ati-demo.html'
];

for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix literal "\n</body>"
    content = content.replace(/\\n<\/body>/gi, '\n</body>');
    
    // Fix literal "\n</style>"
    content = content.replace(/\\n<\/style>/gi, '\n</style>');
    
    // Fix literal "\n<div class=\"cd\"" after body
    content = content.replace(/>\\n<div class="cd" id="cDot">/g, '>\n<div class="cd" id="cDot">');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
}
