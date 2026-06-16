const fs = require('fs');

const files = ['about.html', 'school.html'];

for (const file of files) {
    // 1. Restore from original
    const orig = file.replace('.html', '_original.html');
    fs.copyFileSync(orig, file);
    let content = fs.readFileSync(file, 'utf8');

    // 2. Strip legacy logic
    // In about.html it might be `// ============= CURSOR =============`
    // In school.html it might be `// Cursor`
    const legacyRegex = /\/\/[-=\s]*Cursor[-=\s]*[\s\S]*?(?=<\/script>)/i;
    
    if (legacyRegex.test(content)) {
        content = content.replace(legacyRegex, '');
        console.log(`Successfully stripped legacy inline JS from ${file}`);
    } else {
        console.log(`Could not find legacy inline JS in ${file} to strip.`);
    }

    // 3. Strip old Nav
    const navRegex = /<nav class="top-nav" id="topNav">[\s\S]*?<\/nav>/i;
    content = content.replace(navRegex, '');
    
    // 4. Strip old footer
    const footerRegex = /<footer class="sf">[\s\S]*?<\/footer>/i;
    content = content.replace(footerRegex, '');

    // 5. Strip old login modal
    const modalRegex = /<div class="mo" id="loginMo">[\s\S]*?<\/div>\s*<\/div>/i;
    content = content.replace(modalRegex, '');
    
    // 6. Strip old toast
    const toastRegex = /<div class="toast" id="toast"><\/div>/i;
    content = content.replace(toastRegex, '');

    // 7. Inject styles and scripts into HEAD
    const headInsert = `\n  <link rel="stylesheet" href="col-ui.css">\n  <script defer src="col-ui.js"><\\/script>\n  <script defer src="col-auth.js"><\\/script>\n`;
    content = content.replace(/(<\/head>)/i, headInsert + '$1');

    // 8. Make sure we fix the document.documentElement.innerHTML string literals!
    content = content.replace(/document\.documentElement\.innerHTML\s*=\s*'([\s\S]*?)';/g, (match, inner) => {
        const escapedInner = inner.replace(/`/g, '\\`').replace(/<\/script>/gi, '<\\/script>');
        return `document.documentElement.innerHTML = \`${escapedInner}\`;`;
    });

    fs.writeFileSync(file, content, 'utf8');
}
