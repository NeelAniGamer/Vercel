const fs = require('fs');

const files = [
    'ati.html', 'solar.html', 'gesture.html', 'rpg.html', 
    'qr.html', 'engine.html', 'qr-editor.html', 'feedback.html', 'terms.html', 'privacy.html',
    'about.html', 'school.html', 'sneh-asha.html'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Better strategy: Extract all script blocks, check their contents, and remove bad ones.
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    content = content.replace(scriptRegex, (match, inner) => {
        if (inner.includes("document.getElementById('cDot')") || 
            inner.includes("document.getElementById('cRing')") || 
            inner.includes("document.addEventListener('mousemove'") ||
            inner.includes("var pd=document.getElementById('projDropdown')") ||
            inner.includes("document.getElementById('mmb').addEventListener('click'") ||
            inner.includes("window.addEventListener('scroll',function(){navEl.classList.toggle") ||
            (inner.includes("setTimeout(function(){var l=document.getElementById('loader')") && !inner.includes("// Pre-fill user data"))) { // Need to be careful with loader + pre-fill in feedback.html
            
            // For the loader in feedback.html which has `// Pre-fill user data`, we want to keep the pre-fill part!
            if (inner.includes("// Pre-fill user data")) {
                return match.replace(/setTimeout\(function\(\)\{var l=document\.getElementById\('loader'\);if\(l\)l\.classList\.add\('gone'\);\},800\);/g, '');
            }
            return ""; // Remove entirely
        }
        return match;
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log("Super cleaned: " + file);
}
