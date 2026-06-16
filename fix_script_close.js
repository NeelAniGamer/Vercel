const fs = require('fs');

const files = [
    'ati.html', 'solar.html', 'gesture.html', 'rpg.html', 
    'qr.html', 'engine.html', 'qr-editor.html', 'feedback.html', 'terms.html', 'privacy.html',
    'about.html', 'school.html', 'sneh-asha.html'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Find backtick blocks and replace </script> with <\/script>
    content = content.replace(/document\.documentElement\.innerHTML\s*=\s*`([\s\S]*?)`;/g, (match, inner) => {
        return `document.documentElement.innerHTML = \`${inner.replace(/<\/script>/gi, '<\\/script>')}\`;`;
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed premature script termination in: " + file);
}
