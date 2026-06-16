const fs = require('fs');

// 1. Restore the files from the original copies
fs.copyFileSync('about_original.html', 'about.html');
fs.copyFileSync('school_original.html', 'school.html');

console.log("Restored about.html and school.html from originals.");

const files = ['about.html', 'school.html'];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // 2. Strip out the legacy inline Cursor, Theme, Auth, and Nav logic, BUT preserve the 3D stuff.
    // The legacy code starts with "// Cursor" and ends right before the closing </script> tag
    
    // We will do a regex replacement from `// Cursor` up to `</script>`
    const legacyRegex = /\/\/\s*Cursor[\s\S]*?(?=<\/script>)/i;
    
    if (legacyRegex.test(content)) {
        content = content.replace(legacyRegex, '');
        console.log(`Successfully stripped legacy inline JS from ${file}`);
    } else {
        console.log(`Could not find legacy inline JS in ${file} to strip.`);
    }

    // 3. Inject the new UI components! (col-ui.css, col-ui.js, col-auth.js, etc.)
    // We need to remove the old <nav id="topNav">...</nav>
    const navRegex = /<nav class="top-nav" id="topNav">[\s\S]*?<\/nav>/i;
    content = content.replace(navRegex, '');
    
    // Remove old footer
    const footerRegex = /<footer class="sf">[\s\S]*?<\/footer>/i;
    content = content.replace(footerRegex, '');

    // Remove old login modal
    const modalRegex = /<div class="mo" id="loginMo">[\s\S]*?<\/div>\s*<\/div>/i;
    content = content.replace(modalRegex, '');
    
    // Remove old toast
    const toastRegex = /<div class="toast" id="toast"><\/div>/i;
    content = content.replace(toastRegex, '');

    // Inject styles and scripts into HEAD
    const headInsert = `
<link rel="stylesheet" href="col-ui.css">
  <script defer src="col-ui.js"></script>
  <script defer src="col-auth.js"></script>
`;
    content = content.replace(/(<\/head>)/i, headInsert + '$1');

    // Make sure we fix the document.documentElement.innerHTML string literals!
    content = content.replace(/document\.documentElement\.innerHTML\s*=\s*'([\s\S]*?)';/g, (match, inner) => {
        const escapedInner = inner.replace(/`/g, '\\`').replace(/<\/script>/gi, '<\\/script>');
        return `document.documentElement.innerHTML = \`${escapedInner}\`;`;
    });

    fs.writeFileSync(file, content, 'utf8');
}
