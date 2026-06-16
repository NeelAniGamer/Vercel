const fs = require('fs');
const path = require('path');

const files = ['ati.html'];

const newNav = `<nav class="top-nav" id="topNav">
  <a href="index.html" class="nav-brand"><img src="class.webp" alt="Class Of Learners" class="brand-logo" width="56" height="56" fetchpriority="high" decoding="async"><span class="brand-name">Class Of Learners</span></a>
  <button class="mmb" id="mmb" aria-label="Toggle menu"><svg viewBox="0 0 24 24" fill="none"><path d="M3 6H21M3 12H21M3 18H21" stroke-width="1.5" stroke-linecap="round"/></svg></button>
  <div class="nav-links" id="navLinks">
    <a href="index.html" class="nav-link act">Home</a><a href="about.html" class="nav-link">About</a><a href="school.html" class="nav-link">School</a><a href="sneh-asha.html" class="nav-link">Sneh Asha</a>
    <div class="dropdown" id="projDD" onclick="this.classList.toggle('active')"><button class="dropdown-btn">Projects <span class="darr">&#9660;</span></button><div class="dropdown-content"><div class="dropdown-content-inner"><a href="ati.html">Typing Instructor <span>&#9109;&#65039;</span></a><a href="solar.html">Solar Engine <span>&#127680;</span></a><a href="gesture.html">Gesture Control <span>&#128400;&#65039;</span></a><a href="rpg.html">RPG Game <span>&#9876;&#65039;</span></a><a href="qr.html">QR Generator <span>&#11035;</span></a></div></div></div>
    <div class="tw"><span class="tl" id="tLabel">Light</span><label class="tsb" for="tsck"><input type="checkbox" id="tsck" aria-label="Toggle light mode" onchange="toggleTheme(this)"><div class="tst"><div class="tsth">&#9728;&#65039;</div></div></label></div>
    <button class="nav-login-btn" id="navLoginBtn" onclick="openLogin()"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.34 0-10 1.67-10 5v2h20v-2c0-3.33-6.66-5-10-5z"/></svg>Sign In</button>
    <div class="nav-user-profile" id="navUserProfile" onclick="openLogin()"><div class="nav-user-avatar" id="navUserAv">?</div><span class="nun" id="navUserName">User</span></div>
    <a href="download.html" class="nav-dl-btn mobile-dl">Downloads</a>
  </div>
  <a href="download.html" class="nav-dl-btn desktop-dl">Downloads Hub</a>
</nav>`;

const newFooter = `<footer class="sf"><div class="fi"><div class="fb"><span>CoL</span> &middot; Class Of Learners</div><div class="fl"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="feedback.html">Feedback</a><a href="download.html">Downloads</a></div><div class="fc">&copy; 2026 Neel, Ansh &amp; Aarush.</div></div></footer>`;

const cursorHTML = `<div class="cd" id="cDot"></div><div class="cr" id="cRing"></div>`;

for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    const headInsert = [];
    if (!content.includes('col-ui.css')) headInsert.push('<link rel="stylesheet" href="col-ui.css">');
    if (!content.includes('col-ui.js')) headInsert.push('<script defer src="col-ui.js"></script>');
    if (!content.includes('col-auth.js')) headInsert.push('<script defer src="col-auth.js"></script>');
    if (!content.includes('accounts.google.com/gsi/client')) headInsert.push('<script src="https://accounts.google.com/gsi/client" async defer></script>');
    
    if (headInsert.length > 0) {
        content = content.replace(/(<\/head>)/i, headInsert.join('\n  ') + '\n$1');
    }

    content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/i, newNav);

    const footRegex = /<footer[^>]*>[\s\S]*?<\/footer>/ig;
    let match;
    let count = 0;
    let newContent = '';
    let lastIndex = 0;
    
    while ((match = footRegex.exec(content)) !== null) {
        count++;
        newContent += content.substring(lastIndex, match.index);
        if (count === 1) {
            newContent += newFooter;
        }
        lastIndex = footRegex.lastIndex;
    }
    if (count > 0) {
        content = newContent + content.substring(lastIndex);
    } else {
        content = content.replace(/(<\/body>)/i, newFooter + "\n$1");
    }

    if (!content.includes('id="cDot"')) {
        content = content.replace(/(<body[^>]*>)/i, "$1\n" + cursorHTML);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Injected UI into: " + file);
}
