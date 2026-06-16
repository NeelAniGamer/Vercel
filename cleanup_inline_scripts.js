const fs = require('fs');

const files = [
    'ati.html', 'solar.html', 'gesture.html', 'rpg.html', 
    'qr.html', 'engine.html', 'qr-editor.html', 'feedback.html', 'terms.html', 'privacy.html'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    if (file === 'solar.html') {
        content = content.replace('solar 2.webp', 'solar 2.png');
    }
    
    if (file === 'ati.html') {
        const startMarker = "// --- UNIVERSAL ACCOUNT LOGIC ---";
        const endMarker = "});\r\n    </script>"; // This might vary, better to use regex
        // We will just replace everything from UNIVERSAL ACCOUNT LOGIC down to the end of the script block
        const regex = /\/\/ --- UNIVERSAL ACCOUNT LOGIC ---[\s\S]*?(<\/script>\s*<\/body>)/;
        content = content.replace(regex, `window.addEventListener('load', () => { 
        resizeCanvas();
        initParticles();
        animateParticles();
        initTiltEffect();
        setTimeout(typeWriter, 400); 
        setTimeout(triggerAnimations, 100);
    });
    </script>
</body>`);
    } else {
        // Remove redundant scripts at the bottom of the body
        // specifically the ones containing projDropdown or cRing logic
        const regex1 = /<script>\s*document\.addEventListener\('mousemove'[\s\S]*?<\/script>/g;
        content = content.replace(regex1, '');
        
        const regex2 = /<script>\s*window\.addEventListener\('load',function\(\)\{\s*setTimeout\(function\(\)\{\s*var l=document\.getElementById\('loader'\);[\s\S]*?<\/script>/g;
        content = content.replace(regex2, '');
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log("Cleaned up: " + file);
}
