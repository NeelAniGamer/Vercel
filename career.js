      // State Management
      let allCareers = [];
      let favoriteList = JSON.parse(localStorage.getItem('fs_favorites') || '[]');
      let compareList = JSON.parse(localStorage.getItem('fs_compare') || '[]');
      let activeSource = 'all'; // 'all', 'flagship', 'growth', 'ai', 'high_earning'
      let currentCat = 'all';
      let currentStream = 'all';
      let currentEdu = 'all';
      let currentDegree = 'all';
      let currentInterest = 'all';
      let currentSort = 'match';
      let searchQuery = '';
      let renderLimit = 36;
      let compassScores = {};
      let activeDetailCareer = null;
      // Why each career scored what it did, for the results panel. Populated by
      // runCompassMatch alongside compassScores, and cleared with it.
      let compassReasons = {};
      // A sensible default for the single-answer questions so nothing starts
      // blank, but both multi-selects start empty: a default there would be an
      // answer the student never gave.
      let compassAnswers = { stream: 'pcm', degrees: [], interests: [], edu: 'bachelor', field: '', diversify: true };

      // Toasts
      function ensureToastContainer() {
        let c = document.querySelector('.col-toast-container');
        if (!c) {
          c = document.createElement('div');
          c.className = 'col-toast-container';
          document.body.appendChild(c);
        }
        return c;
      }
      function showToast(msg, ms = 1600) {
        try {
          const cont = ensureToastContainer();
          const t = document.createElement('div');
          t.className = 'col-toast';
          t.textContent = msg;
          cont.appendChild(t);
          requestAnimationFrame(() => t.classList.add('show'));
          setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => { if (t.parentElement) t.parentElement.removeChild(t); }, 250);
          }, ms);
        } catch (e) {}
      }

      // Initialize Career Data
      function initData() {
        if (window.CAREERS_ALL && window.CAREERS_ALL.length) {
          allCareers = window.CAREERS_ALL;
        } else if (window.CAREERS_FLAGSHIP && window.CAREERS_FLAGSHIP.length) {
          allCareers = window.CAREERS_FLAGSHIP;
        }
        const sc = document.getElementById('stat-careers');
        if (sc) sc.textContent = allCareers.length || 416;
      }

      // Theme Management
      function initTheme() {
        var isLight = false;
        try {
          isLight = localStorage.getItem('theme') === 'light' || localStorage.getItem('fs_theme') === 'light';
        } catch (e) {}
        document.documentElement.classList.toggle('lm', isLight);
        document.body.classList.toggle('lm', isLight);
        var tm = document.getElementById('themeMeta');
        if (tm) tm.setAttribute('content', isLight ? '#f4f3ee' : '#070A14');
      }
      function toggleSiteTheme() {
        var isLight = !document.documentElement.classList.contains('lm');
        document.documentElement.classList.toggle('lm', isLight);
        document.body.classList.toggle('lm', isLight);
        var tm = document.getElementById('themeMeta');
        if (tm) tm.setAttribute('content', isLight ? '#f4f3ee' : '#070A14');
        try {
          localStorage.setItem('theme', isLight ? 'light' : 'dark');
          localStorage.setItem('fs_theme', isLight ? 'light' : 'dark');
        } catch (e) {}
      }

      // Shortlist / Bookmarks
      function toggleFavorite(id, e) {
        if (e) e.stopPropagation();
        const idx = favoriteList.indexOf(id);
        if (idx === -1) {
          favoriteList.push(id);
        } else {
          favoriteList.splice(idx, 1);
        }
        localStorage.setItem('fs_favorites', JSON.stringify(favoriteList));
        updateNavCounts();
        renderCards();
      }

      function updateNavCounts() {
        const fc = document.getElementById('favCount');
        if (fc) fc.textContent = favoriteList.length;
        updateCompareDrawer();
      }

      function openShortlist() {
        if (favoriteList.length === 0) {
          showToast('You have no shortlisted careers yet. Click the star icon on any career card to add it to your shortlist.');
          return;
        }
        searchQuery = '';
        document.getElementById('search-input').value = '';
        currentCat = 'all';
        currentStream = 'all';
        currentEdu = 'all';
        activeSource = 'shortlist';
        updateFilterUI();
        renderCards(true);
        document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
      }

      // Comparison Management
      function toggleCompare(id, e) {
        if (e) e.stopPropagation();
        const idx = compareList.indexOf(id);
        if (idx === -1) {
          if (compareList.length >= 4) {
            showToast('You can compare a maximum of 4 careers side-by-side. Please remove one first.');
            return;
          }
          compareList.push(id);
        } else {
          compareList.splice(idx, 1);
        }
        localStorage.setItem('fs_compare', JSON.stringify(compareList));
        updateCompareDrawer();
        renderCards();
      }

      function updateCompareDrawer() {
        const drawer = document.getElementById('compare-drawer');
        const list = document.getElementById('compare-items-list');
        list.innerHTML = '<span style="color:var(--text-secondary); font-size:14px; font-weight:600;">Compare (' + compareList.length + '/4):</span>';

        if (compareList.length === 0) {
          drawer.classList.remove('show');
          return;
        }

        compareList.forEach(id => {
          const c = findCareer(id);
          if (!c) return;
          const tag = document.createElement('div');
          tag.className = 'cmp-tag';
          tag.innerHTML = '<span>' + c.title + '</span><span class="cmp-tag-remove" onclick="toggleCompare(\'' + c.id + '\')">✕</span>';
          list.appendChild(tag);
        });

        drawer.classList.add('show');
      }

      function clearComparison() {
        compareList = [];
        localStorage.setItem('fs_compare', JSON.stringify(compareList));
        updateCompareDrawer();
        renderCards();
      }

      function openComparisonModal() {
        if (compareList.length === 0) {
          showToast('Please select at least 1 career to view the comparison table.');
          return;
        }
        const modal = document.getElementById('compare-modal');
        const body = document.getElementById('compare-modal-body');
        const items = compareList.map(id => findCareer(id)).filter(Boolean);

        let html = '<div style="overflow-x:auto;"><table class="cmp-table"><thead><tr><th>Attribute</th>';
        items.forEach(c => {
          html += '<th><div style="font-size:16px; margin-bottom:4px; display:inline-flex; align-items:center; gap:8px;">' + getModernIcon(c, 20) + ' ' + c.title + '</div><div style="font-size:11px; font-weight:600; color:var(--primary); text-transform:uppercase;">' + c.catName + '</div></th>';
        });
        html += '</tr></thead><tbody>';

        // Attributes
        html += '<tr><td><strong>School Stream</strong></td>' + items.map(c => '<td>' + c.stream + '</td>').join('') + '</tr>';
        html += '<tr><td><strong>Entry Education</strong></td>' + items.map(c => '<td>' + (EDU_LABELS[c.edu] || c.edu || 'Not listed') + '</td>').join('') + '</tr>';
        html += '<tr><td><strong>Salary Range</strong></td>' + items.map(c => '<td style="color:var(--accent-green); font-weight:700;">' + c.salary + '</td>').join('') + '</tr>';
        html += '<tr><td><strong>10-Year Outlook</strong></td>' + items.map(c => '<td style="color:var(--accent); font-weight:700;">' + c.growth + ' (' + c.demand + ' Demand)</td>').join('') + '</tr>';
        html += '<tr><td><strong>AI &amp; Automation</strong></td>' + items.map(c => '<td>' + c.aiImpact.split('—')[0].trim() + '</td>').join('') + '</tr>';
        html += '<tr><td><strong>Key Entrance Exams</strong></td>' + items.map(c => '<td>' + c.education.entranceExams + '</td>').join('') + '</tr>';
        html += '<tr><td><strong>Recommended Degrees</strong></td>' + items.map(c => '<td><ul style="padding-left:16px;">' + c.education.undergradDegrees.map(d => '<li>' + d + '</li>').join('') + '</ul></td>').join('') + '</tr>';
        html += '<tr><td><strong>Top Industry Certifications</strong></td>' + items.map(c => '<td><ul style="padding-left:16px;">' + c.education.certifications.map(crt => '<li>' + crt + '</li>').join('') + '</ul></td>').join('') + '</tr>';
        html += '<tr><td><strong>Core Hard Skills</strong></td>' + items.map(c => '<td>' + c.skills.hardSkills.slice(0, 5).join(', ') + '</td>').join('') + '</tr>';
        html += '<tr><td><strong>Work Environment</strong></td>' + items.map(c => '<td>' + c.decisionFit.workStyle + '</td>').join('') + '</tr>';

        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
      }

      function closeComparisonModal() {
        document.getElementById('compare-modal').classList.remove('open');
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      }

      // Career Lookup
      function findCareer(id) {
        return allCareers.find(c => c.id === id);
      }

      // Modern SVG Vector Icon Generator
      function getModernIcon(c, size = 24) {
        if (!c) return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';

        const id = (c.id || '').toLowerCase();
        const cat = (c.cat || '').toLowerCase();
        const title = (c.title || '').toLowerCase();

        // 1. Cybersecurity & Ethical Hacking / Defense
        if (id.includes('cyber') || title.includes('cyber') || title.includes('security') || title.includes('ethical hack')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="2.5"/><path d="M12 13.5v2.5"/></svg>';
        }

        // 2. AI, Machine Learning, Cognitive Systems
        if (id.includes('ai-') || title.includes('artificial intelligence') || title.includes('machine learning') || title.includes('neural')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2.5"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>';
        }

        // 3. Airline Pilots, Flight Ops, Aviation
        if (id.includes('pilot') || title.includes('pilot') || title.includes('aviation') || title.includes('flight')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>';
        }

        // 4. Software, Fullstack, Systems, Programming
        if (id.includes('fullstack') || title.includes('software') || title.includes('full-stack') || title.includes('developer') || title.includes('computer system') || title.includes('programmer')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/></svg>';
        }

        // 5. Cloud Architecture, DevOps, SRE
        if (id.includes('cloud') || title.includes('cloud') || title.includes('devops') || title.includes('sre')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><polyline points="12 12 12 16"/><polyline points="9 14 12 11 15 14"/></svg>';
        }

        // 6. Data Science, Big Data, Analytics
        if (id.includes('data-science') || title.includes('data') || title.includes('statistic') || title.includes('analyst')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>';
        }

        // 7. Gaming, VR, XR, Spatial
        if (id.includes('game') || title.includes('game') || title.includes('xr') || title.includes('spatial') || title.includes('virtual reality')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="6"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/></svg>';
        }

        // 8. Blockchain, Web3, Distributed
        if (id.includes('blockchain') || title.includes('blockchain') || title.includes('web3') || title.includes('crypto')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="8" height="8" rx="1"/><rect x="14" y="7" width="8" height="8" rx="1"/><path d="M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3M6 15v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5M10 11h4"/></svg>';
        }

        // 9. Robotics, Mechatronics, Hardware
        if (title.includes('robot') || title.includes('mechatronic') || title.includes('automation') || id.includes('semiconductor')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01M9 19h6"/></svg>';
        }

        // 10. Medicine, Surgery, Doctors
        if (title.includes('doctor') || title.includes('medicine') || title.includes('surgery') || title.includes('physician') || title.includes('surgeon')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"/><path d="M9 17v2a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4v-3"/><circle cx="18" cy="11" r="2"/></svg>';
        }

        // 11. Nursing, Critical Care
        if (title.includes('nurse') || title.includes('nursing')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 7v4M10 9h4"/></svg>';
        }

        // 12. Genetics, Biotech, Molecular
        if (title.includes('dna') || title.includes('genetic') || title.includes('biotech') || title.includes('perfusion')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6M2 9c6.667 6 13.333 0 20 6"/><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>';
        }

        // 13. Pharmacy & Pharmacology
        if (title.includes('pharm') || title.includes('drug')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>';
        }

        // 14. Space, Aerospace, Astronomy
        if (title.includes('space') || title.includes('astro') || title.includes('rocket') || title.includes('satellite')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>';
        }

        // 15. Finance, Banking, Quant, Investment
        if (title.includes('finance') || title.includes('bank') || title.includes('quant') || title.includes('trader') || title.includes('invest') || title.includes('actuar')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/><circle cx="19" cy="9" r="1.5"/></svg>';
        }

        // 16. Law, Justice, Judiciary
        if (title.includes('law') || title.includes('attorney') || title.includes('legal') || title.includes('court') || title.includes('judge') || title.includes('judic')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>';
        }

        // 17. UI/UX, Design, Creative Arts
        if (title.includes('design') || title.includes('ui/ux') || title.includes('creative') || title.includes('graphic') || title.includes('artist') || title.includes('film') || title.includes('animation')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z"/></svg>';
        }

        // 18. Architecture & Urban Planning
        if (title.includes('architect') || title.includes('urban plan') || title.includes('building') || title.includes('civil')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>';
        }

        // 19. Firefighting & Emergency Rescue
        if (title.includes('fire') || title.includes('emergency')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
        }

        // 20. Culinary, Chef, Baker
        if (title.includes('chef') || title.includes('cook') || title.includes('baker') || title.includes('culinary') || title.includes('food')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v4a3 3 0 0 0 3 3v13"/><path d="M8 2v4"/></svg>';
        }

        // 21. Sustainability, Clean Energy, Climate
        if (title.includes('clean') || title.includes('solar') || title.includes('wind') || title.includes('renew') || title.includes('eco') || title.includes('climate')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';
        }

        // 22. Electrical, Nuclear, Power, Energy
        if (title.includes('electric') || title.includes('nuclear') || title.includes('energy') || title.includes('power')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        }

        // 23. Marine, Oceanography, Maritime
        if (title.includes('marine') || title.includes('ocean') || title.includes('ship') || title.includes('nautical')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><line x1="9" y1="11" x2="15" y2="11"/></svg>';
        }

        // 24. Education, Teaching, Professorship
        if (title.includes('teacher') || title.includes('prof') || title.includes('educat') || title.includes('academic') || title.includes('school')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
        }

        // 25. Trades, Welding, Machining, Tools
        if (title.includes('welder') || title.includes('machin') || title.includes('mechanic') || title.includes('tool') || title.includes('carpenter') || title.includes('plumber') || title.includes('craft')) {
          return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
        }

        // Domain-level Fallbacks
        const DOMAIN_SVGS = {
          tech: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
          health: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
          eng: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
          space: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
          biz: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
          law: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>',
          creative: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
          science: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.17 19.34A2 2 0 0 0 5.89 22h12.22a2 2 0 0 0 1.72-2.66L14 9.31V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>',
          eco: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
          trades: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
          edu: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
          safety: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
          service: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
          hosp: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v4a3 3 0 0 0 3 3v13"/><path d="M8 2v4"/></svg>',
          marine: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>',
          agri: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>'
        };

        return DOMAIN_SVGS[cat] || '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
      }

      // Human-readable labels for the degree and interest tags, used by the
      // filter tray, the pill counts, and search.
      const DEGREE_LABELS = {
        engineering: 'Engineering (B.Tech / B.E.)', computing: 'Computing & IT (BCA / CS)',
        health: 'Medicine & Health (MBBS / BDS / Nursing)', science: 'Science (B.Sc / B.Stat)',
        commerce: 'Commerce & Finance (B.Com / BBA)', arts: 'Arts & Humanities (B.A.)',
        law: 'Law (LL.B.)', education: 'Education (B.Ed.)',
        design: 'Design & Architecture (B.Des / B.Arch)', management: 'Management (MBA)',
        vocational: 'Diploma / ITI / Vocational', any: 'Any degree works'
      };
      const INTEREST_LABELS = {
        tech: 'Computers & Technology', health: 'Medicine & Health', numbers: 'Numbers & Finance',
        business: 'Business & Selling', machines: 'Machines & Making', build: 'Building & Construction',
        outdoors: 'Outdoors & Nature', science: 'Science & Research', design: 'Art & Design',
        words: 'Writing & Media', law: 'Law & Public Service', people: 'People & Care',
        teaching: 'Teaching & Training', transport: 'Transport & Travel', food: 'Food & Hospitality',
        sport: 'Sport, Music & Performance'
      };
      const EDU_LABELS = {
        nodegree: 'No degree needed', diploma: 'Diploma / Associate', bachelor: "Bachelor's degree",
        master: "Master's degree", doctorate: 'Doctorate / MD / PhD'
      };

      // Search & Filters
      function clearSearch() {
        searchQuery = '';
        const input = document.getElementById('search-input');
        if (input) input.value = '';
        const clearBtn = document.getElementById('search-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        renderActiveFiltersTray();
        renderCards();
        updateUrlState();
      }

      function updateFilterUI() {
        document.querySelectorAll('#view-mode-bar .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === activeSource));
        
        const catSelect = document.getElementById('domain-select');
        if (catSelect) catSelect.value = currentCat;
        const streamSelect = document.getElementById('stream-select');
        if (streamSelect) streamSelect.value = currentStream;
        const eduSelect = document.getElementById('edu-select');
        if (eduSelect) eduSelect.value = currentEdu;
        const degreeSelect = document.getElementById('degree-select');
        if (degreeSelect) degreeSelect.value = currentDegree;
        const interestSelect = document.getElementById('interest-select');
        if (interestSelect) interestSelect.value = currentInterest;
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = currentSort;

        renderActiveFiltersTray();
      }

      function updateSelectCounts() {
        const count = (key, val) => allCareers.filter(c => {
          const v = c[key];
          return Array.isArray(v) ? v.includes(val) : v === val;
        }).length;

        // Degree select options
        const degSelect = document.getElementById('degree-select');
        if (degSelect) {
          Array.from(degSelect.options).forEach(opt => {
            const base = opt.textContent.replace(/\s*\(\d+\)$/, '');
            const total = opt.value === 'all' ? allCareers.length : count('degrees', opt.value);
            opt.textContent = base + ' (' + total + ')';
          });
        }

        // Interest select options
        const intSelect = document.getElementById('interest-select');
        if (intSelect) {
          Array.from(intSelect.options).forEach(opt => {
            const base = opt.textContent.replace(/\s*\(\d+\)$/, '');
            const total = opt.value === 'all' ? allCareers.length : count('interests', opt.value);
            opt.textContent = base + ' (' + total + ')';
          });
        }

        // Domain select options
        const domSelect = document.getElementById('domain-select');
        if (domSelect) {
          Array.from(domSelect.options).forEach(opt => {
            const base = opt.textContent.replace(/\s*\(\d+\)$/, '');
            const total = opt.value === 'all' ? allCareers.length : count('cat', opt.value);
            opt.textContent = base + ' (' + total + ')';
          });
        }
      }

      const DOMAIN_LABELS = {
        tech: 'Technology & AI', health: 'Healthcare & Medicine', eng: 'Engineering & Robotics',
        space: 'Aviation & Aerospace', biz: 'Business & Finance', law: 'Law & Public Safety',
        creative: 'Creative Arts & Design', eco: 'Sustainability & Energy', trades: 'Skilled Trades & Craft',
        edu: 'Education & Academia', service: 'Human Care & Services'
      };

      const DOMAIN_FALLBACKS = {
        tech: '💻', health: '🩺', eng: '⚙️', space: '🚀', biz: '📈',
        law: '⚖️', creative: '🎨', eco: '🌱', trades: '🔧', edu: '🎓',
        service: '🤝', safety: '🛡️', marine: '⚓', agri: '🌾', hosp: '🍽️'
      };

      const STREAM_LABELS = {
        pcm: 'Science (PCM / Math)', pcb: 'Science (PCB / Bio)', commerce: 'Commerce & Math',
        arts: 'Arts & Humanities', any: 'No Stream Preference'
      };

      // Chips are assembled with DOM nodes and textContent rather than string-concatenated
      // innerHTML: every label below originates from a <select>.value or the search box, so
      // building markup by hand would let that text be re-parsed as HTML (CodeQL js/xss-through-dom).
      function makeFilterChip(label, onClear) {
        const chip = document.createElement('div');
        chip.className = 'active-tag';
        chip.appendChild(document.createTextNode(label));
        const remove = document.createElement('span');
        remove.className = 'active-tag-remove';
        remove.textContent = '✕';
        chip.appendChild(remove);
        chip.addEventListener('click', onClear);
        return chip;
      }

      function renderActiveFiltersTray() {
        const tray = document.getElementById('active-chips');
        if (!tray) return;
        tray.textContent = '';
        let hasActive = false;

        if (activeSource !== 'all') {
          hasActive = true;
          const modeLabels = {
            flagship: 'Deep Master Guides',
            growth: 'Fast Growing 10%+',
            ai: 'Harder To Automate',
            high_earning: 'High Earning $150K+',
            shortlist: 'Saved Shortlist'
          };
          tray.appendChild(makeFilterChip('View: ' + (modeLabels[activeSource] || activeSource), function () { setActiveSource('all'); }));
        }
        if (currentCat !== 'all') {
          hasActive = true;
          tray.appendChild(makeFilterChip('Domain: ' + (DOMAIN_LABELS[currentCat] || currentCat), function () { setCategory('all'); }));
        }
        if (currentStream !== 'all') {
          hasActive = true;
          tray.appendChild(makeFilterChip('Stream: ' + (STREAM_LABELS[currentStream] || currentStream.toUpperCase()), function () { setStream('all'); }));
        }
        if (currentEdu !== 'all') {
          hasActive = true;
          tray.appendChild(makeFilterChip('Education: ' + (EDU_LABELS[currentEdu] || currentEdu), function () { setEdu('all'); }));
        }
        if (currentDegree !== 'all') {
          hasActive = true;
          tray.appendChild(makeFilterChip('Degree: ' + (DEGREE_LABELS[currentDegree] || currentDegree), function () { setDegree('all'); }));
        }
        if (currentInterest !== 'all') {
          hasActive = true;
          tray.appendChild(makeFilterChip('Interest: ' + (INTEREST_LABELS[currentInterest] || currentInterest), function () { setInterest('all'); }));
        }
        if (searchQuery) {
          hasActive = true;
          tray.appendChild(makeFilterChip('Search: "' + searchQuery + '"', clearSearch));
        }

        if (hasActive) {
          const reset = document.createElement('button');
          reset.className = 'reset-filters-btn';
          reset.textContent = 'Clear All Filters';
          reset.addEventListener('click', resetAllFilters);
          tray.appendChild(reset);
        }
      }

      function resetAllFilters() {
        activeSource = 'all';
        currentCat = 'all';
        currentStream = 'all';
        currentEdu = 'all';
        currentDegree = 'all';
        currentInterest = 'all';
        currentSort = 'match';
        searchQuery = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('search-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        compassScores = {};
        compassReasons = {};
        updateFilterUI();
        renderCards();
        updateUrlState();
      }

      function setActiveSource(mode) {
        activeSource = mode;
        updateFilterUI();
        renderCards();
        updateUrlState();
      }
      function setCategory(cat) {
        currentCat = cat;
        updateFilterUI();
        renderCards();
        updateUrlState();
      }
      function setStream(stream) {
        currentStream = stream;
        updateFilterUI();
        renderCards();
        updateUrlState();
      }
      function setEdu(edu) {
        currentEdu = edu;
        updateFilterUI();
        renderCards();
        updateUrlState();
      }
      function setDegree(degree) {
        currentDegree = degree;
        updateFilterUI();
        renderCards();
        updateUrlState();
      }
      function setInterest(interest) {
        currentInterest = interest;
        updateFilterUI();
        renderCards();
        updateUrlState();
      }
      function changeSort(val) {
        currentSort = val;
        renderCards();
        updateUrlState();
      }

      // Render Cards Engine
      function renderCards(onlyFavorites = false) {
        const grid = document.getElementById('career-grid');
        const countLabel = document.getElementById('results-count');
        if (countLabel && !countLabel.hasAttribute('aria-live')) {
          countLabel.setAttribute('aria-live', 'polite');
          countLabel.setAttribute('aria-atomic', 'true');
        }
        grid.innerHTML = '';

        const isShortlistMode = (activeSource === 'shortlist' || onlyFavorites);

        // Filter Pool
        let pool = allCareers;
        if (activeSource === 'flagship') {
          pool = allCareers.filter(c => !c.id.startsWith('ooh-') && !c.compact);
        } else if (activeSource === 'growth') {
          pool = allCareers.filter(c => {
            const m = c.growth.match(/(\d+)%/);
            return m && parseInt(m[1], 10) >= 10;
          });
        } else if (activeSource === 'ai') {
          pool = allCareers.filter(c => c.aiTag === 'protected' || c.aiTag === 'people');
        } else if (activeSource === 'high_earning') {
          pool = allCareers.filter(c => {
            const nums = (c.salary.match(/\$(\d+)K/g) || []).map(s => parseInt(s.replace(/\D/g, ''), 10));
            return nums.some(n => n >= 150);
          });
        }

        const filtered = [];

        pool.forEach(c => {
          if (isShortlistMode && !favoriteList.includes(c.id)) return;
          if (currentCat !== 'all' && c.cat !== currentCat) return;

          // Stream Eligibility
          if (currentStream !== 'all') {
            const sLower = c.stream.toLowerCase();
            if (currentStream === 'pcm' && !sLower.includes('pcm') && !sLower.includes('math')) return;
            if (currentStream === 'pcb' && !sLower.includes('pcb') && !sLower.includes('bio')) return;
            if (currentStream === 'commerce' && !sLower.includes('commerce') && !sLower.includes('math') && !sLower.includes('any')) return;
            if (currentStream === 'arts' && !sLower.includes('arts') && !sLower.includes('humanities') && !sLower.includes('any')) return;
            if (currentStream === 'any' && !sLower.includes('any')) return;
          }          // Education Level (BLS entry requirement)
          if (currentEdu !== 'all' && c.edu !== currentEdu) return;

          // Degree background
          if (currentDegree !== 'all' && !(c.degrees || []).includes(currentDegree)) return;

          // Interest
          if (currentInterest !== 'all' && !(c.interests || []).includes(currentInterest)) return;

          // Search Query with Alias Matching
          let matchedAlias = null;
          if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            const titleMatch = c.title.toLowerCase().includes(q);
            const descMatch = c.desc.toLowerCase().includes(q) || c.overview.toLowerCase().includes(q);
            const skillMatch = c.skills.hardSkills.some(s => s.toLowerCase().includes(q));
            const examMatch = c.education.entranceExams.toLowerCase().includes(q);

            if (!titleMatch && !descMatch && !skillMatch && !examMatch) {
              // Check aliases
              const found = (c.aka || []).find(a => a.toLowerCase().includes(q));
              if (found) {
                matchedAlias = found;
              } else {
                // Degree names and interest labels are searchable too, so that
                // "MBBS" or "wildlife" still lands on the right pathway.
                const tagsText = (c.degrees || []).map(d => DEGREE_LABELS[d] || d)
                  .concat((c.interests || []).map(i => INTEREST_LABELS[i] || i))
                  .concat([EDU_LABELS[c.edu] || '']).join(' ').toLowerCase();
                if (!tagsText.includes(q)) return;
              }
            }
          }

          filtered.push({ career: c, matchedAlias: matchedAlias });
        });

        // Sorting
        filtered.sort((a, b) => {
          if (compassScores[a.career.id] || compassScores[b.career.id]) {
            return (compassScores[b.career.id] || 0) - (compassScores[a.career.id] || 0);
          }
          if (currentSort === 'alpha') {
            return a.career.title.localeCompare(b.career.title);
          }
          if (currentSort === 'salary') {
            const numA = parseInt((a.career.salary.match(/\$(\d+)/) || [0,0])[1], 10);
            const numB = parseInt((b.career.salary.match(/\$(\d+)/) || [0,0])[1], 10);
            return numB - numA;
          }
          if (currentSort === 'growth') {
            const numA = parseInt((a.career.growth.match(/(\d+)%/) || [0,0])[1], 10);
            const numB = parseInt((b.career.growth.match(/(\d+)%/) || [0,0])[1], 10);
            return numB - numA;
          }
          return 0;
        });

        // Visible Slice
        const visible = filtered.slice(0, renderLimit);

        countLabel.textContent = isShortlistMode
          ? 'Shortlist: ' + filtered.length + ' saved careers'
          : 'Showing ' + Math.min(visible.length, filtered.length) + ' of ' + filtered.length + ' careers';

        if (filtered.length === 0) {
          grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--text-dim);"><div style="margin-bottom:16px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><h3 style="color:var(--text); font-size:18px; margin-bottom:8px;">Nothing Matches Those Filters</h3><p>Try a wider search, or put the filters back to All.</p><button class="nav-btn primary" style="margin-top:16px;" onclick="resetAllFilters()">Reset All Filters</button></div>';
          return;
        }

        visible.forEach(item => {
          const c = item.career;
          const card = document.createElement('div');
          card.className = 'career-card';
          card.onclick = () => openDetail(c.id);

          const isFav = favoriteList.includes(c.id);
          const isCmp = compareList.includes(c.id);
          const matchScore = compassScores[c.id];

          let inner = '<div>';
          inner += '<div class="card-top">';
          inner += '<div class="card-icon cat-' + c.cat + '">' + getModernIcon(c, 26) + '</div>';
          inner += '<div class="card-badges">';
          inner += '<span class="cat-tag cat-' + c.cat + '">' + c.catName + '</span>';
          inner += '<button class="btn-fav ' + (isFav ? 'active' : '') + '" title="' + (isFav ? 'Remove from shortlist' : 'Save to shortlist') + '">' + (isFav ? '★' : '☆') + '</button>';
          inner += '</div></div>';

          if (matchScore) {
            // The old badge read "NN% Fit Match" and was the only visible output
            // of the quiz. It now says what the number is relative to, because
            // "92% fit" read as a claim about the career rather than about this
            // ranking, and a tooltip carries the answers that produced it.
            const why = (compassReasons[c.id] || []).filter(x => x.pts > 0).map(x => x.text);
            const tip = why.length ? ' title="' + escHtml(why.join(' · ')) + '"' : '';
            inner += '<div class="match-score-badge"' + tip + '>' + matchScore + '% fit for you</div>';
          }

          if (item.matchedAlias) {
            inner += '<div class="matched-alias-pill"><span>Matches Title:</span> <strong>' + item.matchedAlias + '</strong></div>';
          }

          inner += '<h3 class="card-title">' + c.title + '</h3>';
          inner += '<div class="card-tagline">' + c.tagline + '</div>';
          inner += '<p class="card-desc">' + c.desc + '</p>';

          inner += '<div class="card-meta-chips">';
          inner += '<span class="meta-chip blue">' + c.stream + '</span>';
          inner += '<span class="meta-chip green">' + c.salary.split('·')[0].trim() + '</span>';
          inner += '<span class="meta-chip">' + c.growth.split('(')[0].trim() + '</span>';
          inner += '</div></div>';

          inner += '<div class="card-actions">';
          inner += '<button class="btn-explore">Explore Full Guide →</button>';
          inner += '<button class="btn-cmp ' + (isCmp ? 'active' : '') + '" title="Compare side-by-side">' + (isCmp ? 'Added' : 'Compare') + '</button>';
          inner += '</div>';

          card.innerHTML = inner;
          card.querySelector('.btn-fav').addEventListener('click', (e) => toggleFavorite(c.id, e));
          card.querySelector('.btn-cmp').addEventListener('click', (e) => toggleCompare(c.id, e));
          card.querySelector('.btn-explore').addEventListener('click', (e) => { e.stopPropagation(); openDetail(c.id); });

          grid.appendChild(card);
        });

        if (filtered.length > visible.length) {
          const moreWrap = document.createElement('div');
          moreWrap.className = 'show-more-wrap';
          moreWrap.innerHTML = '<button class="show-more-btn" onclick="showMoreCards()">Show More (' + (filtered.length - visible.length) + ' Remaining)</button>';
          grid.appendChild(moreWrap);
        }
      }

      function showMoreCards() {
        renderLimit += 36;
        renderCards();
      }

      // Detail Dossier View & Tabbed Architecture
      let activeDetailTab = 'overview';

      // Note: switchDetailTab is defined once, further down, next to the rest of
      // the modal plumbing. Only the later definition is live.

      // Comprehensive Data Enrichment Helper for all 436 careers
      function getCareerEnrichment(c) {
        const cat = (c.cat || '').toLowerCase();
        const id = (c.id || '').toLowerCase();
        const title = (c.title || '').toLowerCase();

        // 1. Day in the Life (Hour-by-Hour Timeline)
        let dayInLife = c.dayInLife;
        if (!dayInLife || !dayInLife.length) {
          if (cat === 'tech') {
            dayInLife = [
              { time: '09:00', desc: 'Asynchronous sprint sync, checking GitHub pull requests, CI/CD telemetry, and triage logs.' },
              { time: '10:30', desc: 'Deep focus coding block — designing database schemas, writing unit tests, and core system logic.' },
              { time: '13:30', desc: 'Architecture review with product managers and security specialists to review system edge cases.' },
              { time: '15:00', desc: 'Pair programming, reviewing complex code diffs, and profiling latency bottlenecks.' },
              { time: '17:30', desc: 'Staging deployment verification, technical documentation updates, and planning next day priorities.' }
            ];
          } else if (cat === 'health') {
            dayInLife = [
              { time: '07:30', desc: 'Morning clinical rounds, reviewing patient vitals, overnight diagnostic labs, and shift handover notes.' },
              { time: '09:30', desc: 'Procedural focus block — specialized clinical interventions, surgery blocks, or scheduled diagnostics.' },
              { time: '12:30', desc: 'Multidisciplinary case conference discussing complex treatment pathways and patient recovery telemetry.' },
              { time: '14:00', desc: 'Outpatient clinic consultations, evaluating progress, and counseling families on therapy protocols.' },
              { time: '17:00', desc: 'Electronic Health Record (EHR) chart finalization, prescription audits, and on-call handover.' }
            ];
          } else if (cat === 'biz') {
            dayInLife = [
              { time: '08:30', desc: 'Market open scan, economic indicator briefing, and executive dashboard metrics review.' },
              { time: '10:00', desc: 'Financial modeling, investment scenario analysis, or strategic contract negotiations.' },
              { time: '13:30', desc: 'Stakeholder meeting presenting capital allocation proposals and operational risk assessments.' },
              { time: '15:30', desc: 'Diligence review of corporate filings, customer acquisition unit economics, and pipeline telemetry.' },
              { time: '17:30', desc: 'Executive summary distribution to senior leadership and setting transaction priorities for tomorrow.' }
            ];
          } else if (cat === 'law') {
            dayInLife = [
              { time: '08:30', desc: 'Statutory case law research, tracking recent judicial precedents, and analyzing evidentiary documents.' },
              { time: '10:30', desc: 'Drafting legal briefs, discovery motions, or transactional covenants with strict statutory precision.' },
              { time: '13:30', desc: 'Client strategic consultation, regulatory audit preparation, or settlement negotiations with opposing counsel.' },
              { time: '15:30', desc: 'Courtroom proceedings, deposition hearings, or contract mark-up sessions with partners.' },
              { time: '17:30', desc: 'Finalizing court docket filings, timekeeping logging, and case strategy memos.' }
            ];
          } else if (cat === 'creative') {
            dayInLife = [
              { time: '09:00', desc: 'Creative inspiration scan, reviewing customer behavior recordings, and internal design critique.' },
              { time: '10:30', desc: 'High-focus creative block — typography layout, UI component states, 3D asset modeling, or animation.' },
              { time: '13:30', desc: 'Cross-functional alignment with engineering leads to review implementation fidelity and asset specs.' },
              { time: '15:00', desc: 'Usability testing observation, synthesizing user feedback, and refining interactive states.' },
              { time: '17:00', desc: 'Design system token updates, asset exports, and handoff documentation for developers.' }
            ];
          } else if (cat === 'science' || cat === 'eco') {
            dayInLife = [
              { time: '08:30', desc: 'Laboratory sensor calibration, experimental sample prep, and baseline telemetry logging.' },
              { time: '10:00', desc: 'Conducting controlled experiments, running computational simulations, or field data collection.' },
              { time: '13:00', desc: 'Data reduction and statistical analysis using scientific computing libraries and modeling software.' },
              { time: '15:00', desc: 'Peer research collaboration, protocol refinement, and peer-reviewed journal manuscript drafting.' },
              { time: '17:00', desc: 'Biohazard / chemical safety sign-off, equipment maintenance protocols, and experiment queue setup.' }
            ];
          } else {
            dayInLife = [
              { time: '08:00', desc: 'Job site / operational readiness briefing, equipment calibration, and safety compliance walkthrough.' },
              { time: '09:30', desc: 'Core hands-on diagnostic, technical maintenance, precision fabrication, or field operations.' },
              { time: '12:30', desc: 'Quality assurance inspection, verifying dimensional tolerances and material integrity.' },
              { time: '14:00', desc: 'Advanced troubleshooting on mechanical/electrical anomalies and component replacements.' },
              { time: '16:30', desc: 'Daily work logs, inventory replenishment requests, equipment shutdown protocols, and shift handover.' }
            ];
          }
        }

        // 2. Workplace Flexibility & Environment Metrics
        let workMetrics = c.workMetrics;
        if (workMetrics && typeof workMetrics === 'object') {
          workMetrics = {
            remoteRatio: workMetrics.remoteRatio || workMetrics.remote || '50% Hybrid',
            balance: workMetrics.balance || '7.5 / 10',
            stress: workMetrics.stress || 'Moderate',
            travel: workMetrics.travel || 'Low (< 10%)'
          };
        } else {
          let remoteRatio = '10% Onsite / Field';
          let balance = '7.5 / 10 (Moderate)';
          let stress = 'Moderate (Task pacing)';
          let travel = 'Low (0–10%)';

          if (cat === 'tech') {
            remoteRatio = '85% Remote / Hybrid';
            balance = '8.0 / 10 (High autonomy)';
            stress = 'Moderate to High (Sprint deadlines)';
            travel = 'Minimal (< 5%)';
          } else if (cat === 'health') {
            remoteRatio = '0–10% (Hospital / Clinic onsite)';
            balance = '6.0 / 10 (Shift-dependent)';
            stress = 'High to Critical (Patient outcomes)';
            travel = 'Minimal (Local)';
          } else if (cat === 'biz') {
            remoteRatio = '60% Hybrid';
            balance = '6.8 / 10 (Deal-driven)';
            stress = 'High (Revenue & targets)';
            travel = 'Moderate (15–25%)';
          } else if (cat === 'law') {
            remoteRatio = '40% Hybrid (Court & client onsite)';
            balance = '6.2 / 10 (Docket-driven)';
            stress = 'High (Statutory deadlines)';
            travel = 'Occasional (10–20%)';
          } else if (cat === 'creative') {
            remoteRatio = '75% Remote / Hybrid';
            balance = '8.2 / 10 (Creative autonomy)';
            stress = 'Moderate (Revision cycles)';
            travel = 'Minimal (< 10%)';
          } else if (cat === 'space') {
            remoteRatio = '15% (Hangars, launchpads & labs)';
            balance = '6.8 / 10 (Mission critical)';
            stress = 'Very High (Zero failure tolerance)';
            travel = 'Moderate (20–40%)';
          } else if (cat === 'trades') {
            remoteRatio = '0% (Job sites & industrial plants)';
            balance = '7.8 / 10 (Structured shifts)';
            stress = 'Moderate to High (Physical safety)';
            travel = 'Local to Regional (20–50%)';
          }

          workMetrics = { remoteRatio, balance, stress, travel };
        }

        // 3. Multi-currency Global Salary Table
        let globalPay = [];
        if (Array.isArray(c.globalPay)) {
          globalPay = c.globalPay;
        } else if (c.globalPay && typeof c.globalPay === 'object') {
          const parseObjStr = (str) => {
            const entryM = (str || '').match(/Entry\s+([^\s·]+)/i);
            const midM = (str || '').match(/Mid\s+([^\s·]+)/i);
            const leadM = (str || '').match(/Lead\s+([^\s·]+)/i);
            return {
              entry: entryM ? entryM[1] : (str ? str.split('·')[0].trim() : 'Competitive'),
              median: midM ? midM[1] : (str ? (str.split('·')[1] || str).trim() : 'Competitive'),
              top10: leadM ? leadM[1] : (str ? (str.split('·')[2] || str).trim() : 'Executive tier')
            };
          };
          const usP = parseObjStr(c.globalPay.us);
          const inP = parseObjStr(c.globalPay.in);
          const ukP = parseObjStr(c.globalPay.uk);
          const uaeP = parseObjStr(c.globalPay.uae);
          globalPay = [
            { country: 'United States', code: 'USD', entry: usP.entry, median: usP.median, top10: usP.top10 },
            { country: 'India', code: 'INR', entry: inP.entry, median: inP.median, top10: inP.top10 },
            { country: 'United Kingdom', code: 'GBP', entry: ukP.entry, median: ukP.median, top10: ukP.top10 },
            { country: 'United Arab Emirates', code: 'AED', entry: uaeP.entry, median: uaeP.median, top10: uaeP.top10 }
          ];
        } else if (c.bls) {
          // Real Bureau of Labor Statistics figures, converted for display.
          const bls = c.bls;
          const usd = k => '$' + Math.round(k) + 'K';
          const baseUsd = (bls.medianPay || 60000) / 1000;
          globalPay = [
            { country: 'United States', code: 'USD', entry: usd((bls.payP10 || bls.medianPay) / 1000), median: usd(baseUsd), top10: usd((bls.payP90 || bls.medianPay) / 1000) },
            { country: 'India', code: 'INR', entry: 'Not published', median: 'Not published', top10: 'Not published' },
            { country: 'United Kingdom', code: 'GBP', entry: 'Not published', median: 'Not published', top10: 'Not published' },
            { country: 'United Arab Emirates', code: 'AED', entry: 'Not published', median: 'Not published', top10: 'Not published' }
          ];
        }
        // No globalPay and no BLS profile: globalPay stays empty and the table
        // is not rendered at all. Sizing four countries off a free-text salary
        // string used to happen here, which meant every unsourced career
        // silently showed an invented number. A blank is better than a guess.

        // 4. Who Should Avoid
        let whoAvoids = c.whoAvoids;
        if (!whoAvoids || !whoAvoids.length) {
          if (cat === 'tech') {
            whoAvoids = [
              'People who dislike sitting for long uninterrupted blocks solving opaque logical puzzles.',
              'Anyone expecting static job security without continuous self-directed learning of new frameworks every 2–3 years.',
              'Those who struggle when product requirements change unexpectedly mid-sprint.'
            ];
          } else if (cat === 'health') {
            whoAvoids = [
              'Anyone with low tolerance for biological fluids, physical distress, or urgent high-stakes emergencies.',
              'Those unwilling to work irregular night shifts, weekend calls, or emergency rotations.',
              'People who carry clinical anxiety home and cannot emotionally compartmentalize difficult outcomes.'
            ];
          } else if (cat === 'biz') {
            whoAvoids = [
              'People who want guaranteed predictability without personal accountability for financial quotas.',
              'Anyone uncomfortable with corporate political dynamics, client negotiations, or public presentations.',
              'Those seeking strict 9-to-5 boundaries during peak fiscal quarters or live deal closing sprints.'
            ];
          } else if (cat === 'law') {
            whoAvoids = [
              'Anyone who hates meticulous document review, grammatical rigor, and cross-referencing dense statutory text.',
              'People conflict-averse who feel drained by adversarial negotiations and contentious hearings.',
              'Those uncomfortable with billable-hour tracking or uncompromising court filing deadlines.'
            ];
          } else if (cat === 'creative') {
            whoAvoids = [
              'People who take design critique personally or cannot detach their ego from discarded work.',
              'Anyone seeking rigid, formulaic instructions rather than ambiguous creative briefs.',
              'Those who struggle to balance artistic expression with commercial business conversion metrics.'
            ];
          } else {
            whoAvoids = [
              'Anyone with physical mobility limitations averse to industrial sites, field work, or changing weather.',
              'People who prefer pure screen-based work over hands-on mechanical diagnostic accountability.',
              'Those who struggle to strictly observe rigorous industrial health and safety standards.'
            ];
          }
        }

        // 5. Tools Stack
        let tools = c.tools;
        if (!tools || !tools.length) {
          if (cat === 'tech') {
            tools = ['Git & GitHub', 'Linux Shell', 'Docker & Kubernetes', 'PostgreSQL', 'VS Code', 'Postman / Curl', 'Datadog / Prometheus'];
          } else if (cat === 'health') {
            tools = ['Epic Systems EHR', 'Cerner Health', 'PACS Diagnostic Imaging', 'Digital Stethoscope', 'Point-of-Care Ultrasound', 'Vital Monitors'];
          } else if (cat === 'biz') {
            tools = ['Bloomberg Terminal', 'Microsoft Excel (Advanced / VBA)', 'FactSet', 'Capital IQ', 'Power BI / Tableau', 'Salesforce CRM'];
          } else if (cat === 'law') {
            tools = ['Westlaw', 'LexisNexis', 'Clio Practice Management', 'iManage Document Management', 'Adobe Acrobat Pro', 'Relativity e-Discovery'];
          } else if (cat === 'creative') {
            tools = ['Figma', 'Adobe Creative Cloud', 'Cinema 4D / Blender', 'Linear / Notion', 'Midjourney / Stable Diffusion', 'Miro'];
          } else if (cat === 'science' || cat === 'eco') {
            tools = ['Python (NumPy / SciPy)', 'RStudio', 'MATLAB', 'Spectrophotometer', 'QGIS / ArcGIS', 'OriginPro'];
          } else {
            tools = ['SolidWorks / AutoCAD', 'Fluke Digital Multimeter', 'Calipers & Micrometers', 'OSHA Safety Gear', 'Diagnostic OBD-II Scanners'];
          }
        }

        // 6. Portfolio Projects (What Gets You Hired)
        let portfolioProjects = c.portfolioProjects;
        if (!portfolioProjects || !portfolioProjects.length) {
          if (cat === 'tech') {
            portfolioProjects = [
              'Full-Stack Production System: Deploy a public, monitored microservice with unit/integration test coverage, database indexing, and GitHub Actions CI/CD.',
              'Open-Source Contribution: Submit a merged pull request addressing an issue in a recognized industry open-source repository, including regression tests.',
              'End-to-End System Architecture Spec: Write a comprehensive RFC document analyzing tradeoffs for high-availability scaling under simulated 10k RPS.'
            ];
          } else if (cat === 'health') {
            portfolioProjects = [
              'Documented Clinical Case Study: Publish an evidence-based clinical case review analyzing differential diagnosis, treatment milestones, and recovery telemetry.',
              'Quality Improvement Protocol: Design a departmental clinical workflow audit reducing patient wait times or diagnostic turnaround times by 15%.',
              'Community Health Screening Initiative: Coordinate an outpatient diagnostic camp, tracking vitals and health risk scores across 200+ local participants.'
            ];
          } else if (cat === 'biz') {
            portfolioProjects = [
              'Public Financial Model: Build a 3-statement integrated valuation and scenario sensitivity model for a publicly listed enterprise with clear DCF assumptions.',
              'Market Entry Strategic Memo: Author an executive advisory deck evaluating a $50M capital expansion into an emerging regional market with full risk matrices.',
              'Growth Funnel Optimization: Audit customer acquisition economics (LTV/CAC) for a live product, pinpointing drop-off points with actionable fixes.'
            ];
          } else if (cat === 'law') {
            portfolioProjects = [
              'Published Moot Court Brief: Draft an appellant brief analyzing statutory interpretation of constitutional or commercial law with formal citations.',
              'Regulatory Compliance Audit: Formulate a GDPR/HIPAA gap analysis audit framework for a cross-border digital enterprise.',
              'Contract Playbook: Construct a negotiated contract playbook highlighting standard risk allocations, indemnification clauses, and escalation ladders.'
            ];
          } else if (cat === 'creative') {
            portfolioProjects = [
              'Comprehensive Product Case Study: Document user research, interactive wireframes, iterative usability test notes, and final design tokens for a complex workflow.',
              'Design System from Scratch: Build an accessible component library with tokens, variable color modes, and interactive component states in Figma.',
              'Motion & Brand Identity Package: Create a responsive brand identity system featuring interactive UI animations, vector iconography, and typography guidelines.'
            ];
          } else {
            portfolioProjects = [
              'Complete Technical Teardown & Rebuild: Document the step-by-step diagnostic, teardown, component replacement, and calibration of an industrial or mechanical unit.',
              'Safety & Compliance Audit Report: Perform a rigorous site safety hazard assessment following OSHA/ISO guidelines, identifying and mitigating structural risks.',
              'Field Prototype or Custom Fabrication: Design, machine, and assemble a precision mechanical fixture or electrical wiring harness matching tight specs.'
            ];
          }
        }

        // 7. Exit Opportunities
        let exitOpportunities = c.exitOpportunities;
        if (!exitOpportunities || !exitOpportunities.length) {
          if (cat === 'tech') {
            exitOpportunities = ['Principal / Staff Architect', 'VP of Engineering / CTO', 'Technical Product Management (TPM)', 'Cloud Solutions Architecture', 'Independent Tech Founder'];
          } else if (cat === 'health') {
            exitOpportunities = ['Department Chief / Medical Director', 'Healthcare Systems Executive', 'Biotech Clinical Trials Director', 'Medical Device Consultant', 'Academic Clinical Professor'];
          } else if (cat === 'biz') {
            exitOpportunities = ['Chief Financial Officer (CFO)', 'Private Equity / Venture Capital Partner', 'Management Consulting Practice Lead', 'Corporate Board Director', 'Chief Operating Officer (COO)'];
          } else if (cat === 'law') {
            exitOpportunities = ['General Counsel / Chief Legal Officer', 'Senior Equity Partner', 'Federal or State Judge', 'Corporate Compliance Director', 'Government Policy Advisor'];
          } else if (cat === 'creative') {
            exitOpportunities = ['Chief Design Officer (CDO)', 'Executive Creative Director', 'Product Design Director', 'Brand Strategy Consultant', 'Creative Agency Founder'];
          } else {
            exitOpportunities = ['Plant Operations Manager', 'Senior Quality Assurance Director', 'Industrial Technical Consultant', 'Safety & Regulatory Inspector', 'Specialized Contracting Business Owner'];
          }
        }

        // 8. Top Employers & Hiring Sectors
        let topEmployers = c.topEmployers;
        if (!topEmployers || !topEmployers.length) {
          if (cat === 'tech') {
            topEmployers = ['Enterprise Cloud Providers (AWS, Google, Microsoft)', 'High-Growth Tech Startups', 'Fintech & Quantitative Trading Firms', 'Defense & Aerospace Tech', 'Digital Health Platforms'];
          } else if (cat === 'health') {
            topEmployers = ['Academic Medical Centers & University Hospitals', 'Private Multispecialty Hospital Networks', 'Government Health Agencies (NHS, CDC, AIIMS)', 'Biopharmaceutical Research Labs', 'Specialized Outpatient Clinics'];
          } else if (cat === 'biz') {
            topEmployers = ['Tier-1 Investment Banks (Goldman Sachs, Morgan Stanley)', 'Top Strategy Consultancies (McKinsey, BCG, Bain)', 'Fortune 500 Corporate Finance', 'Private Equity & Sovereign Wealth Funds', 'Fintech Disruptors'];
          } else if (cat === 'law') {
            topEmployers = ['International Law Firms (AmLaw 100 / Magic Circle)', 'In-House Corporate Legal Departments', 'Public Defense & Prosecution Agencies', 'Nonprofit Human Rights & Environmental Advocacy', 'Judicial Clerkships'];
          } else if (cat === 'creative') {
            topEmployers = ['Global Design Consultancies (Pentagram, IDEO)', 'Consumer Tech Product Companies (Apple, Airbnb, Stripe)', 'AAA Game Development Studios', 'Brand & Advertising Agencies', 'Entertainment & Film Studios'];
          } else {
            topEmployers = ['Industrial Manufacturing Plants', 'Commercial Infrastructure Contractors', 'Public Utilities & Energy Grids', 'Aerospace Assembly Facilities', 'State & Federal Department of Transportation'];
          }
        }

        return {
          dayInLife,
          workMetrics,
          globalPay,
          whoAvoids,
          tools,
          portfolioProjects,
          exitOpportunities,
          topEmployers
        };
      }

      function openDetail(id) {
        const c = findCareer(id);
        if (!c) return;
        _lastFocusEl = document.activeElement;
        activeDetailCareer = c;
        activeDetailTab = 'overview';

        const modal = document.getElementById('detail-modal');
        const card = document.getElementById('modal-card');
        card.setAttribute('tabindex', '-1');
        setTimeout(() => { try { card.focus({ preventScroll: true }); } catch (e) { try { card.focus(); } catch (e2) {} } }, 0);
        const isFav = favoriteList.includes(c.id);
        const isCmp = compareList.includes(c.id);

        const aiParts = c.aiImpact.split('—');
        const aiTag = aiParts[0].trim();
        const aiDesc = aiParts.length > 1 ? aiParts[1].trim() : c.aiImpact;

        const data = getCareerEnrichment(c);
        const growthNum = (c.growth || '').split('(')[0].trim();
        const demandText = c.demand ? c.demand + ' Demand' : 'Steady Growth';
        const eduText = EDU_LABELS[c.edu] || c.edu || "Bachelor's Degree";

        let html = '';

        // 1. Sticky Minimal Dossier Nav
        html += '<div class="dossier-top-nav">';
        html += '<div class="dossier-nav-left">';
        html += '<button class="btn-back-careers" title="Return to directory [Esc]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> Back to Careers <kbd>Esc</kbd></button>';
        html += '<div class="dossier-breadcrumb"><span>Careers</span><span class="sep">/</span><span>' + c.catName + '</span><span class="sep">/</span><strong>' + c.title + '</strong></div>';
        html += '</div>';
        html += '<div class="dossier-nav-actions">';
        html += '<button class="nav-btn btn-print" title="Print full career blueprint"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print Blueprint</button>';
        html += '<button class="nav-btn btn-modal-fav ' + (isFav ? 'primary' : '') + '">' + (isFav ? '★ Saved' : '☆ Save') + '</button>';
        html += '<button class="nav-btn btn-modal-cmp ' + (isCmp ? 'active' : '') + '">' + (isCmp ? 'Added to Compare' : 'Add to Compare') + '</button>';
        html += '<button class="modal-close" title="Close [Esc]" aria-label="Close modal">✕</button>';
        html += '</div></div>';

        // 2. Main Document Container
        html += '<div class="dossier-doc-container">';

        // 2A. Hero Header
        html += '<div class="dossier-hero">';
        html += '<div class="dossier-hero-badge-row">';
        html += '<span class="cat-tag cat-' + c.cat + '">' + c.catName + '</span>';
        html += '<span style="font-size:12px; font-weight:600; color:#8891aa; padding:4px 10px; border-radius:9999px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">' + c.stream + '</span>';
        if (c.id.startsWith('ooh-')) {
          html += '<span style="font-size:11px; font-weight:700; color:#f2b84b; padding:4px 10px; border-radius:9999px; background:rgba(242,184,75,0.1); border:1px solid rgba(242,184,75,0.25);">US BLS Standard</span>';
        }
        html += '</div>';

        html += '<div class="dossier-hero-title-wrap">';
        html += '<div class="dossier-hero-icon cat-' + c.cat + '">' + getModernIcon(c, 32) + '</div>';
        html += '<div>';
        html += '<h1 class="dossier-hero-title">' + c.title + '</h1>';
        html += '<div class="dossier-hero-tagline">' + c.tagline + '</div>';
        html += '</div></div>';

        // 4-Card Responsive Hero Metrics Ribbon
        html += '<div class="dossier-hero-metrics-grid">';
        // Say where a number came from, or say plainly that there isn't one.
        // "Benchmarked across US & Global markets" used to be printed under
        // every salary on the page, including careers where no survey exists.
        const hasBLS = !!(c.bls && c.bls.medianPay);
        const noPay = c.salary === 'Not published';
        html += '<div class="dossier-hero-metric-card">';
        html += '<div class="label">Median Compensation</div>';
        html += '<div class="value" style="color:' + (noPay ? '#8891aa' : '#34d399') + ';">' + c.salary + '</div>';
        html += '<div class="sub">' + (noPay
          ? 'No published pay survey covers this role'
          : (hasBLS
            ? 'US median, Bureau of Labor Statistics'
            : 'Indicative range, not from a published survey')) + '</div>';
        html += '</div>';

        html += '<div class="dossier-hero-metric-card">';
        html += '<div class="label">10-Year Outlook</div>';
        html += '<div class="value" style="color:' + (noPay ? '#8891aa' : '#f2b84b') + ';">' + growthNum + '</div>';
        // The projection window is the one BLS publishes for this occupation,
        // not a fixed string: the current handbook edition runs 2025-2035.
        html += '<div class="sub">' + (noPay
          ? 'No published projection for this role'
          : demandText + (c.bls && c.bls.growthYears ? ' (BLS ' + c.bls.growthYears + ')' : '')) + '</div>';
        html += '</div>';

        html += '<div class="dossier-hero-metric-card">';
        html += '<div class="label">Entry Education</div>';
        html += '<div class="value" style="color:#5ed4f5;">' + eduText + '</div>';
        html += '<div class="sub">Standard formal entry threshold</div>';
        html += '</div>';

        html += '<div class="dossier-hero-metric-card">';
        html += '<div class="label">AI Resilience Tier</div>';
        html += '<div class="value" style="color:#818cf8;">' + aiTag + '</div>';
        html += '<div class="sub">Exposure to automated systems</div>';
        html += '</div>';
        html += '</div>'; // End dossier-hero-metrics-grid

        // 2B. Segmented Dossier Tab Bar
        html += '<div class="dossier-tab-bar">';
        html += '<button class="dossier-tab-btn ' + (activeDetailTab === 'overview' ? 'active' : '') + '" data-tab="overview" onclick="switchDetailTab(\'overview\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Overview &amp; Daily Rhythm</button>';
        html += '<button class="dossier-tab-btn ' + (activeDetailTab === 'tradeoffs' ? 'active' : '') + '" data-tab="tradeoffs" onclick="switchDetailTab(\'tradeoffs\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Honest Trade-Offs</button>';
        html += '<button class="dossier-tab-btn ' + (activeDetailTab === 'education' ? 'active' : '') + '" data-tab="education" onclick="switchDetailTab(\'education\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> Education &amp; Exams</button>';
        html += '<button class="dossier-tab-btn ' + (activeDetailTab === 'compensation' ? 'active' : '') + '" data-tab="compensation" onclick="switchDetailTab(\'compensation\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Compensation &amp; Roadmap</button>';
        html += '<button class="dossier-tab-btn ' + (activeDetailTab === 'skills' ? 'active' : '') + '" data-tab="skills" onclick="switchDetailTab(\'skills\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Skills, Tools &amp; Titles</button>';
        html += '<button class="dossier-tab-btn ' + (activeDetailTab === 'full' ? 'active' : '') + '" data-tab="full" onclick="switchDetailTab(\'full\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Full Blueprint</button>';
        html += '</div>';

        html += '</div>'; // End dossier-hero

        // 2C. Tab Content Panes Container
        html += '<div class="dossier-panes-wrap" style="width:100%;">';

        // ==========================================
        // TAB 1: OVERVIEW & DAILY RHYTHM
        // ==========================================
        html += '<div class="dossier-tab-pane ' + (activeDetailTab === 'overview' ? 'active' : '') + '" data-pane="overview" style="display:' + (activeDetailTab === 'overview' || activeDetailTab === 'full' ? 'block' : 'none') + ';">';
        
        // Section: Core Work & Mission
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>The Core Work &amp; Mission</div>';
        html += '<p class="dossier-prose">' + c.overview + '</p>';
        if (c.decisionFit && c.decisionFit.workStyle) {
          html += '<div class="dossier-callout">';
          html += '<div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; color:#5ed4f5; margin-bottom:4px;">Workplace Environment &amp; Rhythm</div>';
          html += c.decisionFit.workStyle;
          html += '</div>';
        }
        html += '</div>';

        // Section: Pay & Job Outlook (sourced)
        // Every figure here comes from the BLS profile for this occupation. It
        // is shown only when the scrape actually returned the value, so an empty
        // cell means BLS does not publish one, not that the number is zero.
        if (c.bls && (c.bls.medianPay || c.bls.numberOfJobs || c.bls.growthPct != null)) {
          const money = n => (n == null ? null : '$' + n.toLocaleString('en-US'));
          const row = (label, value) => (value == null || value === '' ? '' :
            '<div class="dossier-fact"><div class="fact-label">' + label + '</div><div class="fact-value">' + value + '</div></div>');
          let facts = '';
          facts += row('Median Annual Pay', money(c.bls.medianPay) +
            (c.bls.medianPayHourly ? ' <span style="color:var(--text-dim); font-weight:500;">($' + c.bls.medianPayHourly.toFixed(2) + '/hr)</span>' : ''));
          facts += row('10th – 90th Percentile', (c.bls.payP10 && c.bls.payP90)
            ? money(c.bls.payP10) + ' – ' + money(c.bls.payP90) : null);
          facts += row('Jobs In The Economy', c.bls.numberOfJobs != null
            ? c.bls.numberOfJobs.toLocaleString('en-US') + (c.bls.baseYear ? ' <span style="color:var(--text-dim); font-weight:500;">(' + c.bls.baseYear + ')</span>' : '') : null);
          facts += row('Projected Growth', c.bls.growthPct != null
            ? c.bls.growthPct + '% <span style="color:var(--text-dim); font-weight:500;">' + (c.bls.growthLabel || '') + (c.bls.growthYears ? ', ' + c.bls.growthYears : '') + '</span>' : null);
          facts += row('Openings Per Year', c.bls.annualOpenings != null ? c.bls.annualOpenings.toLocaleString('en-US') : null);
          facts += row('Employment Change', c.bls.employmentChange != null ? c.bls.employmentChange.toLocaleString('en-US') + (c.bls.growthYears ? ' by ' + c.bls.growthYears.split('\u2013')[1] : '') : null);
          facts += row('SOC Code', c.bls.socCode);

          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><line x1="17" y1="5" x2="17" y2="19"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Pay &amp; Job Outlook</div>';
          html += '<div class="dossier-facts">' + facts + '</div>';
          if (c.bls.workEnvironment) {
            html += '<div class="dossier-callout" style="margin-top:14px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; color:#5ed4f5; margin-bottom:4px;">Where The Work Actually Happens</div>' + c.bls.workEnvironment + '</div>';
          }
          html += '<p style="font-size:12px; color:var(--text-dim); margin-top:12px; line-height:1.6;">Figures are U.S. figures from the Bureau of Labor Statistics Occupational Outlook Handbook' + (c.bls.socCode ? ' (SOC ' + c.bls.socCode + ')' : '') + '. Indian pay is shown on the card and is not covered by this source.' +
            (c.url ? ' <a href="' + c.url + '" target="_blank" rel="noopener" style="color:var(--ion);">Read the BLS profile \u2197</a>' : '') + '</p>';
          html += '</div>';
        }

        // Section: Workplace Flexibility & Environment
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Workplace Flexibility &amp; Operational Reality</div>';
        html += '<div class="dossier-env-grid">';
        html += '<div class="dossier-env-card"><div class="env-label">Remote / Hybrid Ratio</div><div class="env-value">' + data.workMetrics.remoteRatio + '</div></div>';
        html += '<div class="dossier-env-card"><div class="env-label">Work-Life Balance Index</div><div class="env-value">' + data.workMetrics.balance + '</div></div>';
        html += '<div class="dossier-env-card"><div class="env-label">Stress &amp; Stakes Profile</div><div class="env-value">' + data.workMetrics.stress + '</div></div>';
        html += '<div class="dossier-env-card"><div class="env-label">Travel Frequency</div><div class="env-value">' + data.workMetrics.travel + '</div></div>';
        html += '</div>';
        html += '</div>';

        // Section: A Day in the Life
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>A Day in the Life (Hour-by-Hour Rhythm)</div>';
        html += '<div class="dossier-timeline">';
        data.dayInLife.forEach(step => {
          const desc = step.desc || step.activity || '';
          html += '<div class="dossier-timeline-item"><span class="dossier-timeline-time">' + step.time + '</span><div class="dossier-timeline-desc">' + desc + '</div></div>';
        });
        html += '</div>';
        html += '</div>';

        // Section: Top Employers
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-3"/></svg>Primary Hiring Sectors &amp; Top Employers</div>';
        html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
        data.topEmployers.forEach(emp => {
          html += '<span class="skill-pill" style="color:#e8e3d8; background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08);">' + emp + '</span>';
        });
        html += '</div>';
        html += '</div>';

        html += '</div>'; // End Tab 1

        // ==========================================
        // TAB 2: HONEST TRADE-OFFS & FIT
        // ==========================================
        html += '<div class="dossier-tab-pane ' + (activeDetailTab === 'tradeoffs' ? 'active' : '') + '" data-pane="tradeoffs" style="display:' + (activeDetailTab === 'tradeoffs' || activeDetailTab === 'full' ? 'block' : 'none') + ';">';

        // Section: Pros & Cons
        if (c.decisionFit && (c.decisionFit.pros || c.decisionFit.cons)) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Honest Trade-offs: The Upside vs The Hard Reality</div>';
          html += '<div class="dossier-tradeoffs">';
          html += '<div class="dossier-tradeoff-col pro"><h5>The Upside</h5><ul>' + (c.decisionFit.pros || []).map(p => '<li>' + p + '</li>').join('') + '</ul></div>';
          html += '<div class="dossier-tradeoff-col con"><h5>The Hard Reality</h5><ul>' + (c.decisionFit.cons || []).map(cn => '<li>' + cn + '</li>').join('') + '</ul></div>';
          html += '</div>';
          html += '</div>';
        }

        // Section: Red Flags / Who Should Avoid
        html += '<div class="dossier-section">';
        html += '<div class="dossier-avoid-box">';
        html += '<div class="dossier-avoid-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Honest Red Flags: Who Should Avoid This Career</div>';
        html += '<ul class="dossier-avoid-list">';
        data.whoAvoids.forEach(wa => {
          html += '<li>' + wa + '</li>';
        });
        html += '</ul>';
        html += '</div>';
        html += '</div>';

        // Section: Who Truly Thrives Here
        if (c.decisionFit && c.decisionFit.traits && c.decisionFit.traits.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>Who Truly Thrives Here (Key Temperaments)</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + c.decisionFit.traits.map(t => '<span class="skill-pill soft">' + t + '</span>').join('') + '</div>';
          html += '</div>';
        }

        // Section: Self-Reflection Questions
        if (c.reflectionQuestions && c.reflectionQuestions.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Self-Reflection Questions Worth Asking Yourself</div>';
          html += '<ul style="padding-left:18px; color:#8891aa; font-size:14px; line-height:1.75; display:flex; flex-direction:column; gap:8px;">' + c.reflectionQuestions.map(q => '<li>' + q + '</li>').join('') + '</ul>';
          html += '</div>';
        }

        html += '</div>'; // End Tab 2

        // ==========================================
        // TAB 3: EDUCATION & ENTRANCE EXAMS
        // ==========================================
        html += '<div class="dossier-tab-pane ' + (activeDetailTab === 'education' ? 'active' : '') + '" data-pane="education" style="display:' + (activeDetailTab === 'education' || activeDetailTab === 'full' ? 'block' : 'none') + ';">';

        // Section: Foundations & Stream
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>Educational Foundations &amp; School Stream</div>';
        html += '<p class="dossier-prose dim" style="margin-bottom:14px;"><strong>School Prerequisites:</strong> ' + (c.education.highSchoolPrereqs || 'Standard higher secondary graduation with strong fundamentals.') + '</p>';
        html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px;">';
        html += '<div style="padding:14px 18px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px;"><div style="font-size:11px; color:#5ed4f5; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Recommended High School Stream</div><div style="font-size:14px; font-weight:700; color:#e8e3d8; margin-top:4px;">' + c.stream + '</div></div>';
        html += '<div style="padding:14px 18px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px;"><div style="font-size:11px; color:#f2b84b; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Minimum BLS Degree Requirement</div><div style="font-size:14px; font-weight:700; color:#e8e3d8; margin-top:4px;">' + eduText + '</div></div>';
        html += '</div>';
        html += '</div>';

        // Section: Target Entrance Exams
        if (c.education && c.education.entranceExams) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Target Entrance Exams &amp; Standardized Tests</div>';
          html += '<div style="padding:16px 20px; background:rgba(242,184,75,0.04); border-left:3px solid #f2b84b; border-radius:0 10px 10px 0;">';
          html += '<div style="font-size:15px; font-weight:700; color:#e8e3d8; margin-bottom:4px;">' + c.education.entranceExams + '</div>';
          html += '<div style="font-size:13px; color:#8891aa; line-height:1.5;">Evaluated for university admissions, state board licensing, and professional accreditation.</div>';
          html += '</div>';
          html += '</div>';
        }

        // Section: What The Bureau Actually Reports About Getting In
        // BLS states entry education, prior experience and on-the-job training
        // in its own words. Where it publishes them they beat a generic summary.
        if (c.bls && (c.bls.entryEducation || c.bls.relatedExperience || c.bls.onTheJobTraining)) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>What Employers Report About Entry</div>';
          html += '<div class="dossier-facts">';
          const fact = (label, value) => {
            if (value == null || value === '' || /^none$/i.test(value)) return '';
            return '<div class="dossier-fact"><div class="fact-label">' + label + '</div><div class="fact-value" style="font-size:13.5px; font-weight:600;">' + value + '</div></div>';
          };
          html += fact('Typical Entry Education', c.bls.entryEducation);
          html += fact('Related Experience Asked For', c.bls.relatedExperience);
          html += fact('On-The-Job Training', c.bls.onTheJobTraining);
          html += '</div>';
          html += '<p style="font-size:12px; color:var(--text-dim); margin-top:12px;">Sourced from the Bureau of Labor Statistics profile for this occupation. A blank field means the Bureau does not publish one for this role, which is common for occupations with no formal credential.</p>';
          html += '</div>';
        }

        // Section: Recommended Degree Programs
        if (c.education && c.education.undergradDegrees && c.education.undergradDegrees.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>Qualifying Degree Programs &amp; Majors</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + c.education.undergradDegrees.map(d => '<span class="skill-pill" style="font-size:13px;">' + d + '</span>').join('') + '</div>';
          html += '</div>';
        }

        // Section: Top Institutes
        if (c.education && c.education.topInstitutes && c.education.topInstitutes.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-3"/></svg>Benchmark Institutes &amp; Global Academies</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + c.education.topInstitutes.map(inst => '<span style="font-size:13px; padding:6px 12px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); color:#e8e3d8;">' + inst + '</span>').join('') + '</div>';
          html += '</div>';
        }

        // Section: Valued Certifications
        if (c.education && c.education.certifications && c.education.certifications.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>Valued Professional Certifications &amp; Licenses</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + c.education.certifications.map(cert => '<span class="skill-pill soft" style="font-size:13px;">' + cert + '</span>').join('') + '</div>';
          html += '</div>';
        }

        // Section: Getting Your First Break
        // Keyed off the career's real entry level. It used to tell every one of
        // the 436 careers to apply in "penultimate college year", which is
        // actively wrong for the 156 that need no degree at all.
        const BREAK = {
          nodegree: {
            window: 'Any time — there is no degree to wait for',
            signal: 'A certification, a licence, or work you can point at',
            lead: 'Nobody is going to hand you a college offer here, so the entry ticket is proof you can already do the work.',
            steps: [
              'Get the specific licence or ticket the trade actually requires.',
              'Take work that is paid even if it is not the job you want yet.',
              'Build a small portfolio — a repaired engine, a finished set, a season of footage.',
            ],
          },
          diploma: {
            window: 'While you finish the diploma, and the semester after',
            signal: 'Practical work experience, plus the tools you already know how to use',
            lead: 'The diploma opens the door, but the practical hours are what get you through it.',
            steps: [
              'Do your industrial training or internship while the diploma is still running.',
              'Learn the tooling properly rather than just enough to get by.',
              'Apply where the qualification is formally required, then where it is merely useful.',
            ],
          },
          bachelor: {
            window: 'Penultimate year through the final summer',
            signal: 'Completed projects you can walk someone through',
            lead: 'By this point nobody is selecting on your potential. They are selecting on work you have already finished.',
            steps: [
              'Ship something real, even small, and be able to explain your decisions in it.',
              'Write short weekly updates to whoever is supervising you.',
              'Ask mid-term how you are being judged against the full-time bar.',
            ],
          },
          master: {
            window: 'Between the bachelor degree and the thesis, or during it',
            signal: 'Research or analysis you produced, not coursework you sat through',
            lead: 'A masters is treated as a year of work, so treat it like one.',
            steps: [
              'Take on research assistant or analyst work early in the degree.',
              'Get a co-authored paper, working paper, or a real dataset study.',
              'Present the work at a conference or seminar rather than only submitting it.',
            ],
          },
          doctorate: {
            window: 'The first one to three years of the doctorate',
            signal: 'Original research, a named supervisor, and teaching experience',
            lead: 'Doctoral hiring runs on research output and who trained you, not on a transcript.',
            steps: [
              'Publish or get accepted somewhere reputable, even early.',
              'Build a relationship with your supervisor that outlasts the enrolment.',
              'Take a teaching assistantship — it is the cheapest way to prove you can explain research.',
            ],
          },
        };
        // The dataset spells the top level two ways; treat them the same.
        BREAK.phd = BREAK.doctorate;
        const brk = BREAK[c.edu] || BREAK.bachelor;
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Getting Your First Break (Apprenticeships &amp; Internships)</div>';
        html += '<p class="dossier-prose dim" style="margin-bottom:14px;">' + brk.lead + '</p>';
        html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">';
        html += '<div style="padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px;"><div style="font-size:10.5px; color:#f2b84b; font-weight:800; text-transform:uppercase;">When To Start Applying</div><div style="font-size:13.5px; color:#e8e3d8; font-weight:600; margin-top:3px;">' + brk.window + '</div></div>';
        html += '<div style="padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px;"><div style="font-size:10.5px; color:#34d399; font-weight:800; text-transform:uppercase;">What Actually Decides It</div><div style="font-size:13.5px; color:#e8e3d8; font-weight:600; margin-top:3px;">' + brk.signal + '</div></div>';
        html += '</div>';
        html += '<ul style="padding-left:18px; color:#8891aa; font-size:13.5px; line-height:1.7; display:flex; flex-direction:column; gap:6px;">' + brk.steps.map(s => '<li>' + s + '</li>').join('') + '</ul>';
        html += '</div>';

        html += '</div>'; // End Tab 3

        // ==========================================
        // TAB 4: COMPENSATION & ROADMAP
        // ==========================================
        html += '<div class="dossier-tab-pane ' + (activeDetailTab === 'compensation' ? 'active' : '') + '" data-pane="compensation" style="display:' + (activeDetailTab === 'compensation' || activeDetailTab === 'full' ? 'block' : 'none') + ';">';

        // Section: Seniority & Experience Curve
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Seniority &amp; Experience Compensation Curve</div>';
        html += '<p class="dossier-prose dim" style="margin-bottom:12px;">Drag the tenure slider to project compensation and organizational responsibilities across your career:</p>';
        html += '<div class="slider-track-wrap">';
        html += '<input type="range" min="0" max="15" value="3" class="slider-input" id="exp-slider" oninput="updateExpCalculator(this.value)" />';
        html += '</div>';
        html += '<div id="slider-readout-grid"></div>';
        html += '</div>';

        // Section: Global Salary Table
        // Only rendered when there is real data behind it. Careers with no BLS
        // profile and no hand-supplied globalPay get an honest note instead of
        // a table of numbers derived from nothing.
        if (data.globalPay && data.globalPay.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Pay Benchmarks (BLS Occupational Outlook Handbook)</div>';
          html += '<div style="overflow-x:auto;">';
          html += '<table class="dossier-salary-table">';
          html += '<thead><tr><th>Geography</th><th>Currency</th><th>Entry-Level (0–2 Yrs)</th><th>Median Professional</th><th>Top 10% / Principal</th></tr></thead>';
          html += '<tbody>';
          data.globalPay.forEach(gp => {
            html += '<tr>';
            html += '<td><strong>' + gp.country + '</strong></td>';
            html += '<td><span style="font-family:\'Space Mono\', monospace; font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.05); color:#8891aa;">' + gp.code + '</span></td>';
            html += '<td style="color:#8891aa;">' + gp.entry + '</td>';
            html += '<td style="color:#34d399; font-weight:700;">' + gp.median + '</td>';
            html += '<td style="color:#f2b84b; font-weight:700;">' + gp.top10 + '</td>';
            html += '</tr>';
          });
          html += '</tbody></table></div>';
          html += '<div class="dossier-source-note">Figures are for the nearest BLS occupation, in the United States only. BLS does not publish Indian pay for this occupation.</div>';
          html += '</div>';
        } else {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Pay Benchmarks</div>';
          html += '<div class="dossier-empty-note">No published pay survey covers this role yet, so there is no number here to show you. Ask a working professional in the field, or check a platform that publishes per-city rates for this job.</div>';
          html += '</div>';
        }

        // Section: 3-Phase Roadmap
        if (c.roadmap) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>3-Phase Career Progression Roadmap</div>';
          html += '<div class="dossier-roadmap">';
          html += '<div class="dossier-roadmap-step"><div class="dossier-roadmap-dot">1</div><div><div class="dossier-roadmap-phase">Years 0–2: Getting In (Foundational Execution)</div><div class="dossier-roadmap-desc">' + c.roadmap.phase1 + '</div></div></div>';
          html += '<div class="dossier-roadmap-step"><div class="dossier-roadmap-dot">2</div><div><div class="dossier-roadmap-phase">Years 2–5: Getting Good (Autonomous Ownership)</div><div class="dossier-roadmap-desc">' + c.roadmap.phase2 + '</div></div></div>';
          html += '<div class="dossier-roadmap-step"><div class="dossier-roadmap-dot">3</div><div><div class="dossier-roadmap-phase">Years 5–10+: Mastery &amp; Leadership (Strategic Impact)</div><div class="dossier-roadmap-desc">' + c.roadmap.phase3 + '</div></div></div>';
          html += '</div>';
          html += '</div>';
        }

        // Section: Exit Opportunities
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>Proven Exit Opportunities &amp; Lateral Pivots</div>';
        html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
        data.exitOpportunities.forEach(opp => {
          html += '<span class="skill-pill" style="color:#5ed4f5; background:rgba(94,212,245,0.06); border-color:rgba(94,212,245,0.2);">' + opp + '</span>';
        });
        html += '</div>';
        html += '</div>';

        html += '</div>'; // End Tab 4

        // ==========================================
        // TAB 5: SKILLS, TOOLS & TITLES
        // ==========================================
        html += '<div class="dossier-tab-pane ' + (activeDetailTab === 'skills' ? 'active' : '') + '" data-pane="skills" style="display:' + (activeDetailTab === 'skills' || activeDetailTab === 'full' ? 'block' : 'none') + ';">';

        // Section: Tools Stack
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>Daily Technology Stack &amp; Core Tools</div>';
        html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
        data.tools.forEach(tool => {
          html += '<span style="font-size:13px; font-weight:600; padding:6px 14px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:#e8e3d8; display:inline-flex; align-items:center; gap:6px;">⚡ ' + tool + '</span>';
        });
        html += '</div>';
        html += '</div>';

        // Section: Hard Skills vs Soft Skills
        if (c.skills) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Core Technical vs Human Decision Skills</div>';
          html += '<div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#8891aa; letter-spacing:0.6px; margin-bottom:8px;">Hard Technical Competencies:</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px;">' + (c.skills.hardSkills || []).map(s => '<span class="skill-pill">' + s + '</span>').join('') + '</div>';
          html += '<div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#8891aa; letter-spacing:0.6px; margin-bottom:8px;">Human Judgment &amp; Decision Skills:</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + (c.skills.softSkills || []).map(s => '<span class="skill-pill soft">' + s + '</span>').join('') + '</div>';
          html += '</div>';
        }

        // Section: Proof of Work: Portfolio Projects
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Proof of Work: 3 Portfolio Projects That Get You Hired</div>';
        html += '<div class="dossier-projects-list">';
        data.portfolioProjects.forEach((proj, idx) => {
          const pText = typeof proj === 'string' ? proj : (proj.title ? '<strong>' + proj.title + ':</strong> ' + (proj.description || '') : JSON.stringify(proj));
          html += '<div class="dossier-project-item"><span class="dossier-project-num">0' + (idx + 1) + '</span><div class="dossier-project-text">' + pText + '</div></div>';
        });
        html += '</div>';
        html += '</div>';

        // Section: AI Exposure Analysis
        html += '<div class="dossier-section">';
        html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>AI &amp; Automation Exposure Analysis</div>';
        html += '<div style="margin-bottom:10px;"><span class="stat-micro-pill blue" style="font-size:13px; padding:6px 12px; font-weight:700;">' + aiTag + '</span></div>';
        html += '<p class="dossier-prose dim">' + aiDesc + '</p>';
        html += '</div>';

        // Section: Official BLS & Industry Titles
        if (c.roles && c.roles.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>Official BLS &amp; Searchable Industry Titles</div>';
          html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + c.roles.map(r => '<span style="font-size:12.5px; padding:5px 11px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); color:#e8e3d8;">' + r + '</span>').join('') + '</div>';
          html += '</div>';
        }

        // Section: Books & Resources
        if (c.resources && c.resources.length) {
          html += '<div class="dossier-section">';
          html += '<div class="dossier-section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Foundational Books &amp; Deep-Dive Resources</div>';
          html += '<ul style="padding-left:18px; color:#8891aa; font-size:14px; line-height:1.75; display:flex; flex-direction:column; gap:6px;">' + c.resources.map(r => '<li>' + r + '</li>').join('') + '</ul>';
          html += '</div>';
        }

        html += '</div>'; // End Tab 5

        html += '</div>'; // End dossier-panes-wrap

        // 2D. End of Document Action Bar
        html += '<div class="dossier-end-actions">';
        html += '<button class="btn-back-careers" title="Return to directory [Esc]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> Back to Career Directory</button>';
        html += '<div style="display:flex; align-items:center; gap:10px;">';
        if (c.url) html += '<a class="nav-btn" href="' + c.url + '" target="_blank" rel="noopener">Official BLS Profile ↗</a>';
        html += '<button class="nav-btn btn-modal-share">Share Pathway</button>';
        html += '</div></div>';

        html += '</div>'; // End dossier-doc-container

        card.innerHTML = html;

        // Wire Event Listeners
        card.querySelectorAll('.btn-back-careers').forEach(b => b.addEventListener('click', closeDetail));
        card.querySelector('.btn-print').addEventListener('click', () => window.print());
        card.querySelector('.modal-close').addEventListener('click', closeDetail);
        card.querySelector('.btn-modal-fav').addEventListener('click', () => { toggleFavorite(c.id); openDetail(c.id); });
        card.querySelector('.btn-modal-cmp').addEventListener('click', () => { toggleCompare(c.id); openDetail(c.id); });
        card.querySelectorAll('.btn-modal-share').forEach(b => b.addEventListener('click', () => {
          try {
            navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#' + c.id);
          } catch (e) {}
          showToast('Career pathway link copied to clipboard!');
        }));

        // Initialize Calculator
        updateExpCalculator(3);

        modal.classList.add('open');
        modal.scrollTop = 0;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
      }

      function updateExpCalculator(years) {
        const grid = document.getElementById('slider-readout-grid');
        if (!grid || !activeDetailCareer) return;

        const y = parseInt(years, 10);
        let tier = 'Entry-Level Associate';
        let factor = 1.0;
        let role = activeDetailCareer.roles[0] || activeDetailCareer.title;
        let resp = 'Foundational execution, core tool mastery, team sprint collaboration, and baseline quality compliance.';

        if (y >= 10) {
          tier = 'Principal Director / Senior Partner';
          factor = 2.8;
          role = 'Principal ' + activeDetailCareer.title + ' / Director';
          resp = 'Strategic departmental leadership, high-stakes organizational decisions, executive fiduciary governance, and enterprise innovation.';
        } else if (y >= 5) {
          tier = 'Senior Specialist / Project Lead';
          factor = 1.9;
          role = 'Senior ' + activeDetailCareer.title;
          resp = 'Independent ownership of major projects, complex technical problem-solving, team mentorship, and client relationship management.';
        } else if (y >= 2) {
          tier = 'Mid-Level Specialist';
          factor = 1.4;
          role = activeDetailCareer.roles[1] || ('Associate ' + activeDetailCareer.title);
          resp = 'Autonomous task execution, specialized domain workflows, and cross-functional team deliverables.';
        }

        // Parse base numbers
        const baseMatch = activeDetailCareer.salary.match(/\$(\d+)K.*?₹(\d+)/);
        let baseUsd = baseMatch ? parseInt(baseMatch[1], 10) : 60;
        let baseInr = baseMatch ? parseInt(baseMatch[2], 10) : 8;

        const projectedUsd = Math.round(baseUsd * factor);
        const projectedInr = Math.round(baseInr * factor);

        grid.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:baseline; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:12px; color:#8891aa; font-weight:600;">Tenure &amp; Stage:</div>
            <div style="font-size:13.5px; font-weight:800; color:#f2b84b;">${y} Years · ${tier}</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div>
              <div style="font-size:11px; color:#8891aa; font-weight:600; text-transform:uppercase;">US / Global</div>
              <div style="font-size:17px; font-weight:800; color:#34d399; margin-top:2px;">$${projectedUsd}K <span style="font-size:12px; color:#8891aa; font-weight:400;">/ yr</span></div>
            </div>
            <div>
              <div style="font-size:11px; color:#8891aa; font-weight:600; text-transform:uppercase;">India</div>
              <div style="font-size:17px; font-weight:800; color:#5ed4f5; margin-top:2px;">₹${projectedInr}–${projectedInr + Math.round(projectedInr * 0.4)} <span style="font-size:12px; color:#8891aa; font-weight:400;">LPA</span></div>
            </div>
          </div>
          <div style="padding-top:10px;">
            <div style="font-size:13px; font-weight:700; color:#e8e3d8; margin-bottom:3px;">${role}</div>
            <div style="font-size:12.5px; color:#8891aa; line-height:1.5;">${resp}</div>
          </div>
        `;
      }

      let _lastFocusEl = null;
      function closeDetail() {
        document.getElementById('detail-modal').classList.remove('open');
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        try { if (_lastFocusEl) _lastFocusEl.focus(); } catch (e) {}
      }

      function switchDetailTab(tabKey) {
        activeDetailTab = tabKey;
        const card = document.getElementById('modal-card');
        if (!card) return;
        card.querySelectorAll('.dossier-tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tab === tabKey);
        });
        card.querySelectorAll('.dossier-tab-pane').forEach(pane => {
          if (tabKey === 'full') {
            pane.style.display = 'block';
            pane.classList.add('active');
          } else {
            const match = pane.dataset.pane === tabKey;
            pane.style.display = match ? 'block' : 'none';
            pane.classList.toggle('active', match);
          }
        });
      }
      window.switchDetailTab = switchDetailTab;

      // Close modals on backdrop click or Escape
      document.getElementById('detail-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('detail-modal')) closeDetail();
      });
      document.getElementById('compare-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('compare-modal')) closeComparisonModal();
      });
      document.getElementById('compass-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('compass-modal')) closeCompassModal();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closeDetail();
          closeComparisonModal();
          closeCompassModal();
          closeInternshipHub();
          return;
        }
        if (e.key === 'Tab') {
          const openModal = document.querySelector('.modal-overlay.open');
          if (!openModal) return;
          const focusable = openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first || !openModal.contains(document.activeElement)) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last || !openModal.contains(document.activeElement)) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      });

      // Career Compass Quiz Engine
      //
      // The scoring itself lives in compass-scoring.js so it can be calibrated
      // against the dataset without a browser. scripts/compass_scoring.js is the
      // harness and asserts that the top results for ten different answer
      // profiles are plausible for that profile.
      const COMPASS_MAX_CHOICES = 3;

      function openCompassModal() {
        document.getElementById('compass-modal').classList.add('open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
        paintCompassProgress();
      }
      function closeCompassModal() {
        document.getElementById('compass-modal').classList.remove('open');
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      }
      function goToCompassStep(step) {
        document.querySelectorAll('.compass-step').forEach((s, i) => s.classList.toggle('active', i + 1 === step));
        document.querySelector('.compass-step.active').scrollIntoView({ block: 'nearest' });
        paintCompassProgress();
      }
      function paintCompassProgress() {
        // Step 6 is the results view, so it fills the bar like a finished form.
        const active = [...document.querySelectorAll('.compass-step')].findIndex(s => s.classList.contains('active')) + 1;
        document.querySelectorAll('.quiz-progress-seg').forEach((seg, i) => {
          seg.classList.toggle('done', i < active);
        });
      }

      // Questions 2 and 3 take several answers. A cap is not decoration: without
      // it a student can tick everything and the scoring has nothing to
      // discriminate with, which is how the old quiz ended up ranking noise.
      function toggleCompassMulti(key, val, el) {
        const list = compassAnswers[key];
        const at = list.indexOf(val);
        if (at >= 0) {
          list.splice(at, 1);
        } else {
          if (list.length >= COMPASS_MAX_CHOICES) {
            const note = document.getElementById('count-' + key);
            if (note) {
              note.textContent = 'Maximum of ' + COMPASS_MAX_CHOICES + ' - deselect one first';
              clearTimeout(toggleCompassMulti._t);
              toggleCompassMulti._t = setTimeout(() => paintCompassCount(key), 1800);
            }
            return;
          }
          list.push(val);
        }
        el.classList.toggle('selected', at < 0);
        paintCompassCount(key);
      }
      function paintCompassCount(key) {
        const el = document.getElementById('count-' + key);
        if (el) el.textContent = compassAnswers[key].length + ' of ' + COMPASS_MAX_CHOICES + ' chosen';
      }

      function selectCompassOption(step, val, el) {
        if (step === 2) return toggleCompassMulti('degrees', val, el);
        if (step === 3) return toggleCompassMulti('interests', val, el);
        el.parentElement.querySelectorAll('.quiz-card').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        if (step === 1) compassAnswers.stream = val;
        if (step === 4) compassAnswers.edu = val;
        if (step === 5) {
          compassAnswers.field = val;
          // Answering "not sure" is a real answer, not an empty one, so it gets
          // its own handling rather than falling through as no field chosen.
          compassAnswers.diversify = (val === '');
        }
      }

      function runCompassMatch() {
        const results = COMPASS.runCompass(allCareers, compassAnswers);

        compassScores = {};
        results.forEach(r => { compassScores[r.id] = r.fit; });
        compassReasons = {};
        results.slice(0, 24).forEach(r => { compassReasons[r.id] = r.reasons; });

        // Put the ranking into effect behind the results panel.
        activeSource = 'all';
        currentSort = 'match';
        const sortSel = document.getElementById('sort-select');
        if (sortSel) sortSel.value = 'match';
        updateFilterUI();
        renderCards();

        renderCompassResults(results);
        goToCompassStep(6);
      }

      function renderCompassResults(results) {
        const wrap = document.getElementById('compass-results');
        const top = results.slice(0, 12);
        wrap.innerHTML = top.map((r, i) => {
          const c = allCareers.find(x => x.id === r.id);
          if (!c) return '';
          const band = r.fit >= 80 ? '' : (r.fit >= 55 ? 'mid' : 'low');
          // Positive reasons first, then the honest negatives. Showing only the
          // positives would make a weak match look as good as a strong one.
          const pos = r.reasons.filter(x => x.pts > 0);
          const neg = r.reasons.filter(x => x.pts < 0);
          const chips = pos.concat(neg).map(x =>
            '<span class="' + (x.pts < 0 ? 'negative' : '') + '">' + x.text + '</span>'
          ).join('');
          return '<div class="compass-result">' +
            '<div class="compass-result-rank">' + (i + 1) + '</div>' +
            '<div class="compass-result-body">' +
              '<div class="compass-result-top">' +
                '<span class="compass-result-title" onclick="closeCompassModal(); openDetail(\'' + c.id + '\')">' + c.title + '</span>' +
                '<span class="compass-fit ' + band + '">' + r.fit + '% fit</span>' +
                '<span style="font-size:11px; color:var(--text-dim);">' + escHtml(c.catName) + '</span>' +
              '</div>' +
              '<div class="compass-why">' + chips + '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        const note = document.getElementById('compass-note');
        const answered = [];
        if (compassAnswers.stream) answered.push('you study ' + COMPASS.STREAMS[compassAnswers.stream].label);
        if (compassAnswers.degrees.length) answered.push('you want ' + compassAnswers.degrees.length + ' of these fields');
        if (compassAnswers.interests.length) answered.push('you picked ' + compassAnswers.interests.length + ' interest ' + (compassAnswers.interests.length === 1 ? 'group' : 'groups'));
        if (compassAnswers.edu) answered.push('you are willing to study to ' + COMPASS.EDU_LEVELS.find(e => e.id === compassAnswers.edu).label.toLowerCase());

        if (compassAnswers.diversify) {
          // Count what actually happened rather than claiming all twelve areas.
          // With a narrow set of answers only a few areas have anything that
          // matches, and promising twelve would be a promise the data cannot keep.
          const spread = new Set(top.map(r => r.catName)).size;
          note.textContent = 'You told us you are not sure about the field, so the list leads with the strongest single option from each area your answers actually reach - ' +
            spread + ' of the ' + COMPASS.FIELDS.length + ' here, because the degrees and interests you picked rule the rest out. ' +
            'Widen question 2 or 3 to see more areas. All ' + allCareers.length + ' careers stay in the list below, ranked by fit.';
        } else {
          note.textContent = 'This ranking comes from ' + answered.join(', ') + '. Your field choice is the strongest filter, so careers outside it sit lower even when the degree and interests match. ' +
            'The percentages are relative to your own best option, not a measure of how good a career is. All ' + allCareers.length + ' careers stay in the list below - change your answers if the field feels wrong.';
        }
      }
      function escHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      // Internships Modal
      function openInternshipHub() {
        document.getElementById('internship-modal').classList.add('open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
      }
      function closeInternshipHub() {
        document.getElementById('internship-modal').classList.remove('open');
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      }
      document.getElementById('internship-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('internship-modal')) closeInternshipHub();
      });

      // Filtering is driven by the <select> elements in .filters-toolbar, which
      // each call their setter inline (setCategory, setDegree, setInterest,
      // setStream, setEdu, changeSort). The segmented view bar calls
      // setActiveSource. There are no pill buttons to bind, so nothing to
      // listen for here.

      // Search input listener
      const searchInput = document.getElementById('search-input');
      const searchClearBtn = document.getElementById('search-clear-btn');
      let _searchTimer = null;
      searchInput.addEventListener('input', e => {
        const val = e.target.value;
        searchClearBtn.style.display = val ? 'block' : 'none';
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(() => {
          searchQuery = val;
          renderActiveFiltersTray();
          renderCards();
          updateUrlState();
        }, 120);
      });

      function scrollToExplore(e) {
        if (e) e.preventDefault();
        document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
      }


      // Navbar scroll effect: a hairline once you leave the top, plus a reading
      // progress line. Both are driven from one passive listener and one rAF
      // write, so scrolling does not thrash layout.
      const navbarEl = document.getElementById('navbar');
      const progressEl = document.getElementById('navbarProgress');
      let scrollTicking = false;
      function onScrollFrame() {
        scrollTicking = false;
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        if (navbarEl) navbarEl.classList.toggle('scrolled', y > 12);
        if (progressEl) {
          const doc = document.documentElement;
          const max = (doc.scrollHeight - window.innerHeight) || 1;
          progressEl.style.width = Math.min(100, (y / max) * 100) + '%';
        }
      }
      window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(onScrollFrame);
      }, { passive: true });
      window.addEventListener('resize', () => {
        if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScrollFrame); }
      }, { passive: true });
      onScrollFrame();

      // URL State Sync
      function updateUrlState() {
        try {
          const params = new URLSearchParams();
          if (searchQuery) params.set('q', searchQuery);
          if (currentCat && currentCat !== 'all') params.set('domain', currentCat);
          if (currentDegree && currentDegree !== 'all') params.set('degree', currentDegree);
          if (currentInterest && currentInterest !== 'all') params.set('interest', currentInterest);
          if (currentStream && currentStream !== 'all') params.set('stream', currentStream);
          if (currentEdu && currentEdu !== 'all') params.set('edu', currentEdu);
          if (currentSort && currentSort !== 'match') params.set('sort', currentSort);
          if (activeSource && activeSource !== 'all') params.set('view', activeSource);
          const qs = params.toString();
          const newUrl = qs ? (window.location.pathname + '?' + qs + window.location.hash) : (window.location.pathname + window.location.hash);
          history.replaceState(null, '', newUrl);
        } catch (e) {}
      }
      function restoreUrlState() {
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get('q')) { searchQuery = params.get('q'); const si = document.getElementById('search-input'); if (si) si.value = searchQuery; const scb = document.getElementById('search-clear-btn'); if (scb) scb.style.display = searchQuery ? 'block' : 'none'; }
          if (params.get('domain')) currentCat = params.get('domain');
          if (params.get('degree')) currentDegree = params.get('degree');
          if (params.get('interest')) currentInterest = params.get('interest');
          if (params.get('stream')) currentStream = params.get('stream');
          if (params.get('edu')) currentEdu = params.get('edu');
          if (params.get('sort')) currentSort = params.get('sort');
          if (params.get('view')) activeSource = params.get('view');
        } catch (e) {}
      }

      // Deep Linking via URL Hash
      function checkHashLink() {
        const hash = window.location.hash.replace('#', '');
        if (hash && hash.length > 0) {
          try { openDetail(hash); } catch (e) {}
        }
      }

      // Label the quick-view buttons with live counts.
      function updateModeCounts() {
        const pctOf = c => { const m = c.growth.match(/(\d+)%/); return m ? parseInt(m[1], 10) : 0; };
        const maxPay = c => Math.max(...(c.salary.match(/\$(\d+)K/g) || ['$0K']).map(s => parseInt(s.replace(/\D/g, ''), 10)));
        const counts = {
          all: allCareers.length,
          flagship: allCareers.filter(c => !c.id.startsWith('ooh-') && !c.compact).length,
          growth: allCareers.filter(c => pctOf(c) >= 10).length,
          ai: allCareers.filter(c => c.aiTag === 'protected' || c.aiTag === 'people').length,
          high_earning: allCareers.filter(c => maxPay(c) >= 150).length
        };
        const labels = {
          all: 'All Pathways',
          flagship: 'Deep Master Guides',
          growth: 'Fast Growing (10%+)',
          ai: 'Harder To Automate',
          high_earning: 'High Earning ($150K+)'
        };
        // The segmented bar renders .seg-btn (not the old .pill-btn/.mode-btn).
        document.querySelectorAll('#view-mode-bar .seg-btn').forEach(btn => {
          const key = btn.dataset.mode;
          if (labels[key]) btn.textContent = labels[key] + ' (' + counts[key] + ')';
        });
      }

      // Initialize App
      initData();
      initTheme();
      restoreUrlState();
      updateNavCounts();
      updateSelectCounts();
      updateModeCounts();
      updateFilterUI();
      renderCards();
      updateUrlState();
      checkHashLink();
