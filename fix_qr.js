const fs = require('fs');

let qr = fs.readFileSync('qr.html', 'utf8');
qr = qr.replace(/\.nav-dl-btn \{ background: var\(--google-blue\);/g, '.nav-dl-btn { background: var(--qr-primary);');
qr = qr.replace(/<div class="sb-top-title">⚡ QR STUDIO<\/div>/g, '<div class="sb-top-title">⚡ QR GENERATOR</div>');
fs.writeFileSync('qr.html', qr);

let qre = fs.readFileSync('qr-editor.html', 'utf8');
qre = qre.replace(/\.nav-dl-btn \{ background: var\(--google-blue\);/g, '.nav-dl-btn { background: var(--qr-primary);');

const goodFooter = `<footer class="site-footer">
    <div class="footer-links">
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="feedback.html">Feedback</a>
        <a href="download.html">Downloads</a>
    </div>
    <div class="footer-copy">&copy; 2026 Neel, Ansh &amp; Aarush.</div>
</footer>`;

// Replace footer in qr-editor.html (might have multiple classes)
qre = qre.replace(/<footer class="sf">.*?<\/footer>/s, goodFooter);
fs.writeFileSync('qr-editor.html', qre);
console.log('Fixed qr and qr-editor.');
