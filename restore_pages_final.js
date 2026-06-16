const fs = require('fs');

const files = ['about.html', 'school.html'];

for (const file of files) {
    // 1. Restore from original
    const orig = file.replace('.html', '_original.html');
    fs.copyFileSync(orig, file);
    let content = fs.readFileSync(file, 'utf8');

    // 2. Strip legacy logic starting from `// Theme` to the end of the script block
    const themeRegex = /\/\/ Theme[\s\S]*?(?=<\/script>)/i;
    if (themeRegex.test(content)) {
        content = content.replace(themeRegex, '');
    }

    // Also strip legacy navbar scroll logic and mmb click logic if present
    // Match the entire lines
    content = content.replace(/.*var navEl=document\.getElementById\('topNav'\).*/gi, '');
    content = content.replace(/.*document\.getElementById\('mmb'\)\.addEventListener.*/gi, '');

    // 3. Strip old Nav
    const navRegex = /<nav class="top-nav" id="topNav">[\s\S]*?<\/nav>/i;
    content = content.replace(navRegex, '');
    
    // 4. Strip old footer
    const footerRegex = /<footer class="sf">[\s\S]*?<\/footer>/i;
    content = content.replace(footerRegex, '');

    // 5. Strip old login modal (it has 3 closing divs, so we match more carefully)
    const modalRegex = /<div class="mo" id="loginMo".*?>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i;
    content = content.replace(modalRegex, '');
    
    // 6. Strip old toast
    const toastRegex = /<div class="toast" id="toast"><\/div>/i;
    content = content.replace(toastRegex, '');

    // 7. Inject styles and scripts into HEAD
    // Use normal </script> here!
    const headInsert = `\n  <link rel="stylesheet" href="col-ui.css">\n  <script defer src="col-ui.js"></script>\n  <script defer src="col-auth.js"></script>\n`;
    content = content.replace(/(<\/head>)/i, headInsert + '$1');

    // 8. Make sure we fix the document.documentElement.innerHTML string literals if any!
    content = content.replace(/document\.documentElement\.innerHTML\s*=\s*'([\s\S]*?)';/g, (match, inner) => {
        const escapedInner = inner.replace(/`/g, '\\`').replace(/<\/script>/gi, '<\\/script>');
        return `document.documentElement.innerHTML = \`${escapedInner}\`;`;
    });

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Restored pages perfectly.');
