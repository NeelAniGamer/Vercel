/**
 * Class Of Learners — Centralized Reusable Navigation System (v1.5)
 * Master navigation component shared across all site pages with declarative tweaks.
 *
 * Declarative Usage:
 *   <div id="colNav" data-page="about"></div>
 *   OR
 *   <nav class="top-nav" id="topNav" data-page="about"></nav>
 *
 * Supported Attributes:
 *   - data-page: "home" | "about" | "school" | "sneh-asha" | "making" | "projects" | "download"
 *   - data-root: "./" | "../" (relative path to site root)
 *   - data-cta: Custom CTA button label (default: "Downloads Hub")
 *   - data-cta-url: Custom CTA button link (default: "${root}download")
 *   - data-hide-cta: "true" to omit CTA button
 *   - data-hide-search: "true" to omit search trigger
 *   - data-hide-auth: "true" to omit sign in button
 *   - data-brand-text: Custom brand title (default: "Class Of Learners")
 *   - data-brand-url: Custom brand link (default: "${root}")
 */

;(function () {
  'use strict';

  function getModKey() {
    if (window.__colOS && window.__colOS.modKey) return window.__colOS.modKey;
    var p = (navigator.platform || '').toLowerCase();
    var ua = (navigator.userAgent || '').toLowerCase();
    return /mac|iphone|ipad|ipod/.test(p) || /macintosh/.test(ua) ? '⌘' : 'Ctrl';
  }

  function resolveRoot(el) {
    if (el && el.getAttribute('data-root')) {
      return el.getAttribute('data-root');
    }
    var path = window.location.pathname.replace(/\\/g, '/');
    if (path.indexOf('/Traffic/') !== -1 || path.indexOf('/Terra3D/') !== -1) {
      return '../';
    }
    return './';
  }

  function resolveActivePage(el) {
    if (el && el.getAttribute('data-page')) {
      return el.getAttribute('data-page').toLowerCase().trim();
    }
    var path = (window.location.pathname.split('/').pop() || 'home').toLowerCase();
    path = path.replace('.html', '');
    if (path === '' || path === 'index') return 'home';
    if (path.indexOf('about') !== -1) return 'about';
    if (path.indexOf('school') !== -1) return 'school';
    if (path.indexOf('sneh-asha') !== -1) return 'sneh-asha';
    if (path.indexOf('making') !== -1) return 'making';
    if (path.indexOf('download') !== -1) return 'download';
    if (
      path.indexOf('ati') !== -1 ||
      path.indexOf('solar') !== -1 ||
      path.indexOf('gesture') !== -1 ||
      path.indexOf('rpg') !== -1 ||
      path.indexOf('qr') !== -1 ||
      path.indexOf('terra3d') !== -1 ||
      path.indexOf('career') !== -1 ||
      path.indexOf('database_logic') !== -1 ||
      path.indexOf('castflow') !== -1 ||
      path.indexOf('cereal') !== -1 ||
      path.indexOf('traffic') !== -1
    ) {
      return 'projects';
    }
    return 'home';
  }

  var PROJECT_ITEMS = [
    {
      name: 'Typing Instructor',
      url: 'ati',
      icon: '<polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />'
    },
    {
      name: 'Solar Engine',
      url: 'solar',
      icon: '<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />'
    },
    {
      name: 'Perceptus Flow',
      url: 'gesture',
      icon: '<path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />'
    },
    {
      name: 'RPG Game',
      url: 'rpg',
      icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />'
    },
    {
      name: 'QR Studio Matrix',
      url: 'qr',
      icon: '<rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" /><rect x="20" y="14" width="2" height="2" /><rect x="14" y="20" width="2" height="2" /><rect x="20" y="20" width="2" height="2" />'
    },
    {
      name: 'Terra3D Atlas',
      url: 'Terra3D/',
      icon: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />'
    },
    {
      name: 'Career Compass',
      url: 'Career',
      icon: '<circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />'
    },
    {
      name: 'Database Logic DB',
      url: 'Database_Logic',
      icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11" />'
    },
    {
      name: 'CastFlow Studio',
      url: 'CastFlow',
      icon: '<rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />'
    },
    {
      name: 'Cereal AI App',
      url: 'cereal',
      icon: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />'
    }
  ];

  function renderNavbarHTML(options) {
    var root = options.root || './';
    var activePage = options.activePage || 'home';
    var brandName = options.brandName || 'Class Of Learners';
    var brandUrl = options.brandUrl || root;
    var defaultCtaText = (activePage === 'download') ? 'All Projects' : 'Downloads Hub';
    var defaultCtaUrl = (activePage === 'download') ? (root + '#projects') : (root + 'download');
    var ctaText = options.ctaText || defaultCtaText;
    var ctaUrl = options.ctaUrl || defaultCtaUrl;
    var hideCta = options.hideCta === true;
    var hideSearch = options.hideSearch === true;
    var hideAuth = options.hideAuth === true;
    var modKey = getModKey();

    function act(key) {
      return activePage === key ? ' act' : '';
    }

    function ariaCurrent(key) {
      return activePage === key ? ' aria-current="page"' : '';
    }

    var projectsListHtml = PROJECT_ITEMS.map(function (item) {
      var itemHref = item.url.startsWith('http') ? item.url : root + item.url;
      return (
        '<a href="' + itemHref + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            item.icon +
          '</svg>' +
          '<span>' + item.name + '</span>' +
        '</a>'
      );
    }).join('');

    var searchBtnHtml = hideSearch ? '' : (
      '<button type="button" class="nav-cmd-trigger no-cap" onclick="window.openColCmdPalette ? window.openColCmdPalette() : null" title="Press ' + modKey + '+K or / to search all 16 applications">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="11" cy="11" r="8"></circle>' +
          '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
        '</svg>' +
        '<span>Search</span>' +
        '<kbd class="col-os-key">' + modKey + ' K</kbd>' +
      '</button>'
    );

    var authHtml = hideAuth ? '' : (
      '<button class="nav-login-btn" id="navLoginBtn" type="button" onclick="if(window.openGlobalLogin) window.openGlobalLogin(); else if(window.openLogin) window.openLogin(); else location.href=\'' + root + 'dashboard\';">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />' +
          '<circle cx="12" cy="7" r="4" />' +
        '</svg>' +
        '<span>Sign In</span>' +
      '</button>' +
      '<div class="nav-user-profile" id="navUserProfile" style="display:none;" onclick="if(window.openGlobalLogin) window.openGlobalLogin(); else if(window.openLogin) window.openLogin();">' +
        '<div class="nav-user-avatar" id="navUserAv">?</div>' +
        '<span class="nun" id="navUserName">User</span>' +
      '</div>'
    );

    var ctaHtml = hideCta ? '' : (
      '<a href="' + ctaUrl + '" class="nav-dl-btn desktop-dl" id="navCtaBtn">' + ctaText + '</a>'
    );

    return (
      '<a href="' + brandUrl + '" class="nav-brand">' +
        '<img src="' + root + 'Class.png" alt="Class Of Learners" class="brand-logo" width="56" height="56" fetchpriority="high" decoding="async" />' +
        '<span class="brand-name">' + brandName + '</span>' +
      '</a>' +

      '<div class="nav-links" id="navLinks">' +
        '<a href="' + root + '" class="nav-link' + act('home') + '"' + ariaCurrent('home') + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />' +
            '<polyline points="9 22 9 12 15 12 15 22" />' +
          '</svg>' +
          '<span>Home</span>' +
        '</a>' +

        '<a href="' + root + 'about" class="nav-link' + act('about') + '"' + ariaCurrent('about') + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10" />' +
            '<path d="M12 16v-4" />' +
            '<path d="M12 8h.01" />' +
          '</svg>' +
          '<span>About</span>' +
        '</a>' +

        '<a href="' + root + 'school" class="nav-link' + act('school') + '"' + ariaCurrent('school') + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />' +
            '<path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />' +
          '</svg>' +
          '<span>School</span>' +
        '</a>' +

        '<a href="' + root + 'sneh-asha" class="nav-link' + act('sneh-asha') + '"' + ariaCurrent('sneh-asha') + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />' +
          '</svg>' +
          '<span>Sneh Asha</span>' +
        '</a>' +

        '<a href="' + root + 'making" class="nav-link' + act('making') + '"' + ariaCurrent('making') + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />' +
          '</svg>' +
          '<span>Making</span>' +
        '</a>' +

        '<div class="dropdown' + (activePage === 'projects' ? ' active-page' : '') + '" id="projDD">' +
          '<button class="dropdown-btn' + (activePage === 'projects' ? ' act' : '') + '" type="button" aria-haspopup="true" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />' +
              '<line x1="8" y1="21" x2="16" y2="21" />' +
              '<line x1="12" y1="17" x2="12" y2="21" />' +
            '</svg>' +
            '<span>Projects</span> <span class="darr">&#9660;</span>' +
          '</button>' +
          '<div class="dropdown-content">' +
            '<div class="dropdown-content-inner">' +
              projectsListHtml +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="nav-actions">' +
        searchBtnHtml +
        '<div class="hz-toggle" onclick="typeof window.hzToggle === \'function\' ? window.hzToggle() : (document.body.classList.toggle(\'lm\'), document.documentElement.classList.toggle(\'lm\'))" title="Toggle Light / Dark Appearance">' +
          '<div class="hz-clouds"></div>' +
          '<div class="hz-stars"></div>' +
          '<div class="hz-orb"></div>' +
        '</div>' +
        authHtml +
        ctaHtml +
        '<button class="mmb" id="mmb" aria-label="Toggle menu" type="button">' +
          '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6H21M3 12H21M3 18H21" stroke-width="1.5" stroke-linecap="round" /></svg>' +
        '</button>' +
      '</div>'
    );
  }

  function wireNavbarInteractivity(navEl) {
    if (!navEl) return;

    // Dropdown click & hover logic with accessibility
    var dd = navEl.querySelector('#projDD');
    if (dd) {
      var btn = dd.querySelector('.dropdown-btn');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var isOpen = dd.classList.toggle('active');
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      }
    }

    // Close dropdown on outside click or escape
    document.addEventListener('click', function (e) {
      if (dd && dd.classList.contains('active') && !dd.contains(e.target)) {
        dd.classList.remove('active');
        var btn = dd.querySelector('.dropdown-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dd && dd.classList.contains('active')) {
        dd.classList.remove('active');
        var btn = dd.querySelector('.dropdown-btn');
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      }
    });

    // Mobile Hamburger trigger
    var mmb = navEl.querySelector('#mmb');
    if (mmb) {
      mmb.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.openMobileDrawer === 'function') {
          window.openMobileDrawer();
        }
      });
    }

    // Auth profile check
    try {
      var rawUser = localStorage.getItem('col_user');
      if (rawUser) {
        var user = JSON.parse(rawUser);
        var loginBtn = navEl.querySelector('#navLoginBtn');
        var profileCard = navEl.querySelector('#navUserProfile');
        var av = navEl.querySelector('#navUserAv');
        var nameSpan = navEl.querySelector('#navUserName');
        if (loginBtn && profileCard) {
          loginBtn.style.display = 'none';
          profileCard.style.display = 'inline-flex';
          var displayName = user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : (user.email ? user.email.split('@')[0] : 'User');
          if (nameSpan) nameSpan.textContent = displayName;
          if (av) {
            if (user.user_metadata && user.user_metadata.avatar_url) {
              av.innerHTML = '<img src="' + user.user_metadata.avatar_url + '" alt="' + displayName + '" />';
            } else {
              av.textContent = displayName.charAt(0).toUpperCase();
            }
          }
        }
      }
    } catch (e) {}
  }

  function initColNavbar(customOptions) {
    var placeholder = document.getElementById('colNav');
    var existingNav = document.getElementById('topNav') || document.querySelector('.top-nav');
    var target = placeholder || existingNav;

    if (!target) {
      target = document.createElement('nav');
      target.className = 'top-nav';
      target.id = 'topNav';
      document.body.insertBefore(target, document.body.firstChild);
    }

    var options = customOptions || {};
    var root = options.root || target.getAttribute('data-root') || resolveRoot(target);
    var activePage = options.page || target.getAttribute('data-page') || resolveActivePage(target);
    var defaultCtaText = (activePage === 'download') ? 'All Projects' : 'Downloads Hub';
    var defaultCtaUrl = (activePage === 'download') ? (root + '#projects') : (root + 'download');
    var ctaText = options.cta || target.getAttribute('data-cta') || defaultCtaText;
    var ctaUrl = options.ctaUrl || target.getAttribute('data-cta-url') || defaultCtaUrl;
    var hideCta = options.hideCta !== undefined ? options.hideCta : target.getAttribute('data-hide-cta') === 'true';
    var hideSearch = options.hideSearch !== undefined ? options.hideSearch : target.getAttribute('data-hide-search') === 'true';
    var hideAuth = options.hideAuth !== undefined ? options.hideAuth : target.getAttribute('data-hide-auth') === 'true';
    var brandName = options.brandName || target.getAttribute('data-brand-name') || 'Class Of Learners';
    var brandUrl = options.brandUrl || target.getAttribute('data-brand-url') || root;

    var config = {
      root: root,
      activePage: activePage,
      ctaText: ctaText,
      ctaUrl: ctaUrl,
      hideCta: hideCta,
      hideSearch: hideSearch,
      hideAuth: hideAuth,
      brandName: brandName,
      brandUrl: brandUrl
    };

    var navElement = target;
    if (placeholder) {
      navElement = document.createElement('nav');
      navElement.className = 'top-nav';
      navElement.id = 'topNav';
      placeholder.parentNode.replaceChild(navElement, placeholder);
    }

    navElement.setAttribute('role', 'navigation');
    navElement.setAttribute('aria-label', 'Main Navigation');
    navElement.setAttribute('data-page', activePage);
    navElement.setAttribute('data-root', root);
    navElement.innerHTML = renderNavbarHTML(config);

    wireNavbarInteractivity(navElement);

    return navElement;
  }

  window.initColNavbar = initColNavbar;
  window.renderColNavbar = renderNavbarHTML;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initColNavbar();
    });
  } else {
    initColNavbar();
  }
})();
