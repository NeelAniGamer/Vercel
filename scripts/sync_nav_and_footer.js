const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Helper to generate the canonical navbar for a page
function getCanonicalNav(pageConfig) {
  const { page, activeItem } = pageConfig;

  const isHomeAct = activeItem === 'home' ? ' act' : '';
  const isAboutAct = activeItem === 'about' ? ' act' : '';
  const isSchoolAct = activeItem === 'school' ? ' act' : '';
  const isSnehAshaAct = activeItem === 'sneh-asha' ? ' act' : '';
  const isMakingAct = activeItem === 'making' ? ' act' : '';
  const isDownloadAct = activeItem === 'download' ? ' act' : '';

  const isProjectsAct = activeItem === 'projects' || [
    'ati', 'solar', 'gesture', 'rpg', 'qr', 'Terra3D', 'Career', 'Database_Logic', 'CastFlow', 'cereal'
  ].includes(activeItem) ? ' act' : '';

  const isAtiAct = activeItem === 'ati' ? ' class="act"' : '';
  const isSolarAct = activeItem === 'solar' ? ' class="act"' : '';
  const isGestureAct = activeItem === 'gesture' ? ' class="act"' : '';
  const isRpgAct = activeItem === 'rpg' ? ' class="act"' : '';
  const isQrAct = activeItem === 'qr' ? ' class="act"' : '';
  const isTerraAct = activeItem === 'Terra3D' ? ' class="act"' : '';
  const isCareerAct = activeItem === 'Career' ? ' class="act"' : '';
  const isDbAct = activeItem === 'Database_Logic' ? ' class="act"' : '';
  const isCastFlowAct = activeItem === 'CastFlow' ? ' class="act"' : '';
  const isCerealAct = activeItem === 'cereal' ? ' class="act"' : '';

  return `    <div class="top-nav-shield" aria-hidden="true"></div>
    <nav class="top-nav" id="topNav" data-page="${page}">
      <a href="/" class="nav-brand"><img src="Class.png" alt="Class Of Learners" class="brand-logo" width="56" height="56" fetchpriority="high" decoding="async" /><span class="brand-name">Class Of Learners</span></a>
      <div class="nav-links" id="navLinks">
        <a href="/" class="nav-link${isHomeAct}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>Home</a>
        <a href="about" class="nav-link${isAboutAct}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>About</a>
        <a href="school" class="nav-link${isSchoolAct}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>School</a>
        <a href="sneh-asha" class="nav-link${isSnehAshaAct}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>Sneh Asha</a>
        <a href="making" class="nav-link${isMakingAct}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>Making</a>
        <div class="dropdown" id="projDD">
          <button class="dropdown-btn${isProjectsAct}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>Projects <span class="darr">&#9660;</span>
          </button>
          <div class="dropdown-content">
            <div class="dropdown-content-inner">
              <a href="ati"${isAtiAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>Typing Instructor</a>
              <a href="solar"${isSolarAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="12" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>Solar Engine</a>
              <a href="gesture"${isGestureAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>Perceptus Flow</a>
              <a href="rpg"${isRpgAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>RPG Game</a>
              <a href="qr"${isQrAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" /><rect x="20" y="14" width="2" height="2" /><rect x="14" y="20" width="2" height="2" /><rect x="20" y="20" width="2" height="2" /></svg>QR Studio Matrix</a>
              <a href="Terra3D/"${isTerraAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>Terra3D Atlas</a>
              <a href="Career"${isCareerAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>Career Compass</a>
              <a href="Database_Logic"${isDbAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" y1="7" x2="16" y2="7" /><line x1="9" y1="11" x2="14" y2="11" /></svg>Database Logic DB</a>
              <a href="CastFlow"${isCastFlowAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>CastFlow Studio</a>
              <a href="cereal"${isCerealAct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>Cereal AI App</a>
            </div>
          </div>
        </div>
      </div>
      <div class="nav-actions">
        <button type="button" class="nav-cmd-trigger no-cap" onclick="if(window.openColCmdPalette)window.openColCmdPalette();else window.location.href='/?search=true'" title="Press Ctrl+K or / to search all 16 applications" aria-label="Search site (Ctrl K)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Search</span>
          <kbd class="col-os-key">Ctrl K</kbd>
        </button>
        <div class="hz-toggle" onclick="hzToggle()" title="Toggle Appearance"><div class="hz-clouds"></div><div class="hz-stars"></div><div class="hz-orb"></div></div>
        <button class="nav-login-btn" id="navLoginBtn" onclick="if(window.openGlobalLogin)window.openGlobalLogin();else if(window.openLogin)window.openLogin();" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" /></svg
          >Sign In
        </button>
        <div class="nav-user-profile" id="navUserProfile" onclick="if(window.openGlobalLogin)window.openGlobalLogin();else if(window.openLogin)window.openLogin();">
          <div class="nav-user-avatar" id="navUserAv">?</div>
          <span class="nun" id="navUserName">User</span>
        </div>
        <a href="download" class="nav-dl-btn desktop-dl${isDownloadAct}">Downloads Hub</a>
        <button class="mmb" id="mmb" aria-label="Toggle menu" type="button">
          <svg viewBox="0 0 24 24" fill="none"><path d="M3 6H21M3 12H21M3 18H21" stroke-width="1.5" stroke-linecap="round" /></svg>
        </button>
      </div>
    </nav>`;
}

// Canonical footer markup
const CANONICAL_FOOTER = `    <footer class="sf site-footer" style="content-visibility:auto; contain-intrinsic-size: auto 200px">
      <div class="fi">
        <div class="sf-primary-row">
          <div class="fb sf-brand-wrap">
            <span class="sf-brand-name">Class Of Learners <span class="sf-brand-dot">&bull;</span> CoL</span>
            <span class="sf-status-pill"><span class="m-dot m-emerald"></span> All Systems Operational</span>
          </div>
          <div class="sf-btn-wrap">
            <button type="button" class="sf-cmd-btn no-cap" onclick="if(window.openColCmdPalette)window.openColCmdPalette();else window.location.href='/?search=true'" title="Press Ctrl+K or / to search all 16 applications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Quick Launcher</span>
              <kbd class="col-os-key">Ctrl K</kbd>
            </button>
          </div>
        </div>

        <nav class="sf-nav-links" aria-label="Footer Navigation">
          <a href="about">About</a>
          <a href="making">Making</a>
          <a href="download">Downloads</a>
          <a href="mailto:neelgbadri@col.dpdns.org">Contact Us</a>
          <a href="feedback">Feedback</a>
          <a href="privacy">Privacy</a>
          <a href="terms">Terms</a>
        </nav>

        <div class="sf-secondary-row">
          <div class="sf-founders-text">&copy; 2026 Class Of Learners. Built with pride by Neel, Ansh, &amp; Aarush in Mumbai, India.</div>
          <div class="sf-meta">Independent Native Software Engineering &bull; Pure First Principles</div>
        </div>
      </div>
    </footer>`;

// Target page mapping
const PAGES = {
  'home.html': { page: 'home', activeItem: 'home' },
  'about.html': { page: 'about', activeItem: 'about' },
  'school.html': { page: 'school', activeItem: 'school' },
  'sneh-asha.html': { page: 'sneh-asha', activeItem: 'sneh-asha' },
  'making.html': { page: 'making', activeItem: 'making' },
  'download.html': { page: 'download', activeItem: 'download' },
  'feedback.html': { page: 'feedback', activeItem: '' },
  'privacy.html': { page: 'privacy', activeItem: '' },
  'terms.html': { page: 'terms', activeItem: '' },
  'sitemap.html': { page: 'sitemap', activeItem: '' },
  'dashboard.html': { page: 'dashboard', activeItem: '' },
  '404.html': { page: '404', activeItem: '' },
  'ati.html': { page: 'projects', activeItem: 'ati' },
  'ati-demo.html': { page: 'projects', activeItem: 'ati' },
  'ati-lite.html': { page: 'projects', activeItem: 'ati' },
  'solar.html': { page: 'projects', activeItem: 'solar' },
  'gesture.html': { page: 'projects', activeItem: 'gesture' },
  'rpg.html': { page: 'projects', activeItem: 'rpg' },
  'qr.html': { page: 'projects', activeItem: 'qr' },
  'qr-editor.html': { page: 'projects', activeItem: 'qr' },
  'CastFlow.html': { page: 'projects', activeItem: 'CastFlow' },
  'cereal.html': { page: 'projects', activeItem: 'cereal' },
  'civiclogic.html': { page: 'projects', activeItem: 'projects' },
  'Database_Logic.html': { page: 'projects', activeItem: 'Database_Logic' }
};

for (const [file, cfg] of Object.entries(PAGES)) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${file}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace Top Navigation (including shield if present, or just top-nav)
  const navStartIdx = content.indexOf('<nav class="top-nav"');
  if (navStartIdx !== -1) {
    const navEndIdx = content.indexOf('</nav>', navStartIdx) + 6;
    
    // Check if top-nav-shield precedes it
    const beforeNav = content.substring(Math.max(0, navStartIdx - 150), navStartIdx);
    const shieldMatch = beforeNav.match(/<div class=["']top-nav-shield["'][^>]*><\/div>\s*/);
    
    let replaceStart = navStartIdx;
    if (shieldMatch) {
      replaceStart = navStartIdx - shieldMatch[0].length;
    }

    const newNav = getCanonicalNav(cfg);
    content = content.substring(0, replaceStart) + newNav + content.substring(navEndIdx);
  } else {
    console.warn(`No top-nav found in ${file}`);
  }

  // 2. Replace Footer
  // Search for footer tag: <footer class="sf... or <footer class="site-footer... or <footer class="footer...
  const footerRegex = /<footer\b[^>]*class=["'][^"']*\b(?:sf|footer|site-footer)\b[^>]*>[\s\S]*?<\/footer>/i;
  const footerMatch = content.match(footerRegex);
  if (footerMatch) {
    content = content.replace(footerRegex, CANONICAL_FOOTER);
  } else {
    // Check for footer without class (e.g. civiclogic.html)
    const genericFooterRegex = /<footer\b[^>]*>[\s\S]*?<\/footer>/i;
    if (genericFooterRegex.test(content)) {
      content = content.replace(genericFooterRegex, CANONICAL_FOOTER);
    } else {
      console.warn(`No footer found in ${file}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file} successfully.`);
}

console.log('All pages synchronized!');
