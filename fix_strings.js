const fs = require('fs');

const files = [
    'ati.html', 'solar.html', 'gesture.html', 'rpg.html', 
    'qr.html', 'engine.html', 'qr-editor.html', 'feedback.html', 'terms.html', 'privacy.html',
    'about.html', 'school.html', 'sneh-asha.html'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Change single quotes to backticks for document.documentElement.innerHTML
    // We match the pattern from document.documentElement.innerHTML = '<head> to </body>';
    content = content.replace(/document\.documentElement\.innerHTML\s*=\s*'([\s\S]*?)';/g, (match, inner) => {
        // Escape any backticks that might already be inside
        const escapedInner = inner.replace(/`/g, '\\`');
        return `document.documentElement.innerHTML = \`${escapedInner}\`;`;
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed multi-line strings in: " + file);
}
