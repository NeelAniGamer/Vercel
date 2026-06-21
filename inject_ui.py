import os
import re

NAV_HTML = """
<nav class="top-nav">
    <a href="index.html" class="nav-brand">
        <img src="class.webp" alt="Class Of Learners Logo" class="brand-logo" width="56" height="56" fetchpriority="high" decoding="async">
        <span class="brand-name">Class Of Learners</span>
    </a>
    <button class="mmb" id="mmb">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
    <div class="nav-links" id="navLinks">
        <a href="index.html" class="nav-link">Home Hub</a>
        <a href="about.html" class="nav-link">About Us</a>
        <a href="school.html" class="nav-link">Our School</a>
        <a href="sneh-asha.html" class="nav-link">Sneh Asha</a>
        <div class="dropdown" onclick="this.classList.toggle('active')">
            <button class="dropdown-btn">Projects <span class="darr">▼</span></button>
            <div class="dropdown-content">
                <div class="dropdown-content-inner">
                    <a href="ati.html">Typing Instructor <span>⌨️</span></a>
                    <a href="solar.html">Solar Engine <span>🌍</span></a>
                    <a href="gesture.html">Gesture Control <span>🖐️</span></a>
                    <a href="rpg.html">RPG Game <span>⚔️</span></a>
                    <a href="qr.html">QR Generator <span>⬛</span></a>
                </div>
            </div>
        </div>
        <div class="tw">
            <span class="tl" id="tLabel">Light</span>
            <label class="tsb">
                <input type="checkbox" id="tsck" onchange="window.toggleTheme(this)">
                <div class="tst"><div class="tsth"></div></div>
            </label>
        </div>
        <button class="nav-login-btn" id="navLoginBtn" onclick="window.openGlobalLogin()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Sign In
        </button>
        <div class="nav-user-profile" id="navUserProfile" onclick="window.openGlobalLogin()">
            <div class="nav-user-avatar" id="navUserAv">?</div>
            <span class="nun" id="navUserName">User</span>
        </div>
        <a href="download.html" class="nav-dl-btn mobile-dl">Download Hub</a>
    </div>
    <a href="download.html" class="nav-dl-btn desktop-dl">Download Hub</a>
</nav>
"""

FOOTER_HTML = """
<footer class="sf">
    <div class="fi">
        <div class="fb"><span>CoL</span> &middot; Class Of Learners</div>
        <div class="fl">
            <a href="privacy.html">Privacy</a>
            <a href="terms.html">Terms</a>
            <a href="feedback.html">Feedback</a>
            <a href="download.html">Downloads</a>
        </div>
        <div class="fc">&copy; 2026 Neel, Ansh &amp; Aarush.</div>
    </div>
</footer>
"""

html_files = [f for f in os.listdir('.') if f.endswith('.html') and not f.startswith('Mumbai')]

for file in html_files:
    if "Traffic" in file:
        continue
        
    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. REMOVE DUPLICATE SHARED SCRIPTS
    content = re.sub(r'<script[^>]*src=["\']col-router\.js["\'][^>]*>[\s\S]*?</script>', '', content)
    content = re.sub(r'<script[^>]*src=["\']col-ui\.js["\'][^>]*>[\s\S]*?</script>', '', content)
    content = re.sub(r'<script[^>]*src=["\']col-auth\.js["\'][^>]*>[\s\S]*?</script>', '', content)
    content = re.sub(r'<link[^>]*href=["\']col-ui\.css["\'][^>]*>', '', content)
    
    shared_scripts = """
<script defer src="col-router.js"></script>
<link rel="stylesheet" href="col-ui.css">
<script defer src="col-ui.js"></script>
<script defer src="col-auth.js"></script>
"""
    content = content.replace('</head>', shared_scripts + '</head>')
    
    # 2. ADD SEO TAGS
    seo_tags = """
<meta name="description" content="Class of Learners - Interactive projects built by students from Mumbai.">
<link rel="canonical" href="https://advancedlogiclabs.dpdns.org/{filename}">
<meta name="google-site-verification" content="bWaer2b60VA1y3RMV48HYGPv8vlMUcvlFGxY3e6SAqU"/>
""".format(filename=file.replace('home.html', ''))

    if '<meta name="description"' not in content:
        content = content.replace('<head>', '<head>\n' + seo_tags)
    
    if '<meta name="google-site-verification"' not in content:
        content = content.replace('</head>', '<meta name="google-site-verification" content="bWaer2b60VA1y3RMV48HYGPv8vlMUcvlFGxY3e6SAqU"/>\n</head>')

    # 3. ADD LAZY LOADING TO IMAGES
    content = re.sub(r'<img(?![^>]*loading=["\'](?:lazy|eager)["\'])', r'<img loading="lazy"', content)
    
    # 4. INJECT TOP-NAV (if missing)
    if 'class="top-nav"' not in content:
        body_match = re.search(r'<body[^>]*>', content)
        if body_match:
            end_idx = body_match.end()
            content = content[:end_idx] + '\n' + NAV_HTML + content[end_idx:]
            
    # 5. INJECT FOOTER (if missing)
    if 'class="sf"' not in content:
        if '</body>' in content:
            content = content.replace('</body>', FOOTER_HTML + '\n</body>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("UI Injection and Bug Fixes Complete!")
