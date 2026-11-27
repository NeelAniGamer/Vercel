(() => {
  'use strict';

  const STORAGE_KEYS = {
    LAST_PAGE: 'traffic_last_page',
    LAST_GAME_STATE: 'traffic_last_game_state',
    LAST_LEVEL: 'traffic_last_level',
    LAST_MODULE: 'traffic_last_module',
    LAST_SCREEN: 'traffic_last_screen',
    USER_PROFILE: 'traffic_local_user',
    GAME_PROGRESS: 'mth4',
    SESSION_TIMESTAMP: 'traffic_session_timestamp',
    WELCOME_DISMISSED: 'traffic_welcome_dismissed',
    DAILY_BONUS: 'traffic_daily_bonus',
  };


  const DAILY_BONUS_TIERS = [
    { days: 1, amount: 500, label: 'Day 1', emoji: 'trophy' },
    { days: 2, amount: 750, label: 'Day 2', emoji: 'flame' },
    { days: 3, amount: 1000, label: 'Day 3', emoji: 'zap' },
    { days: 4, amount: 1250, label: 'Day 4', emoji: 'sparkles' },
    { days: 5, amount: 1500, label: 'Day 5', emoji: 'trophy' },
    { days: 6, amount: 2000, label: 'Day 6', emoji: 'trophy' },
    { days: 7, amount: 5000, label: 'Day 7 Bonus!', emoji: 'star' },
  ];
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  function getDailyBonusData() {
    try {
      const fromCookie = window.ColCookie ? window.ColCookie.get(STORAGE_KEYS.DAILY_BONUS) : null;
      if (fromCookie && typeof fromCookie === 'object') {return fromCookie;}
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_BONUS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (window.ColCookie) { try { window.ColCookie.set(STORAGE_KEYS.DAILY_BONUS, parsed, 365); } catch (_ck) {} }
        return parsed;
      }
    } catch (e) {}
    return { lastClaim: 0, streak: 0 };
  }

  function saveDailyBonusData(data) {
    try {
      if (window.ColCookie) { try { window.ColCookie.set(STORAGE_KEYS.DAILY_BONUS, data, 365); } catch (_ck) {} }
      localStorage.setItem(STORAGE_KEYS.DAILY_BONUS, JSON.stringify(data));
    } catch (e) {}
  }


  function _computeNextStreak(bonus) {
    const now = Date.now();
    const elapsed = now - bonus.lastClaim;
    if (bonus.lastClaim === 0 || elapsed > 72 * 60 * 60 * 1000) {return { streak: 1, forgiven: false };}
    if (elapsed > 48 * 60 * 60 * 1000) {
      // One miss forgiven per streak: keep the streak alive once, then it resets next miss
      if (!bonus.forgiven) {return { streak: bonus.streak, forgiven: true };}
      return { streak: 1, forgiven: false };
    }
    const next = bonus.streak + 1 > 7 ? 1 : bonus.streak + 1;
    return { streak: next, forgiven: false };
  }

  function checkDailyBonus() {
    const bonus = getDailyBonusData();
    const hasProfile = !!localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const hasProgress = !!localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
    if (!hasProfile && !hasProgress) {return null;}

    const elapsed = Date.now() - bonus.lastClaim;
    if (bonus.lastClaim === 0) {

      const tier = DAILY_BONUS_TIERS[0];
      return { streak: 1, amount: tier.amount, tier, isNew: true };
    }
    if (elapsed < TWENTY_FOUR_HOURS) {return null;}
    const next = _computeNextStreak(bonus);
    const tier = DAILY_BONUS_TIERS[Math.min(next.streak - 1, DAILY_BONUS_TIERS.length - 1)];
    return { streak: next.streak, forgiven: next.forgiven, amount: tier.amount, tier, isNew: false };
  }

  function claimDailyBonus() {
    const info = checkDailyBonus();
    if (!info) {return null;}
    const now = Date.now();


    saveDailyBonusData({ lastClaim: now, streak: info.streak, forgiven: !!info.forgiven });

    try {
      if (window.S) {
        window.S.wallet = (window.S.wallet || 50000) + info.amount;
        if (window.WalletHistory) {WalletHistory.earn('daily_bonus', info.amount, { streak: info.streak || 1, day: info.day || 1 });}
        if (typeof window.save === 'function') {window.save();}
      } else {
        const raw = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
        const S = raw ? JSON.parse(raw) : { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000 };
        S.wallet = (S.wallet || 50000) + info.amount;
        if (window.WalletHistory) {WalletHistory.earn('daily_bonus', info.amount, { streak: info.streak || 1, day: info.day || 1 });}
        localStorage.setItem(STORAGE_KEYS.GAME_PROGRESS, JSON.stringify(S));
      }
      if (typeof toast === 'function') {toast(` ₹${info.amount.toLocaleString('en-IN')} daily bonus added!`, '#f2b84b');}
    } catch (e) {}

    return info;
  }

  function createDailyBonusPopup(bonusInfo, isNew) {
    const existing = document.getElementById('traffic-daily-bonus');
    if (existing) {existing.remove();}

    const popup = document.createElement('div');
    popup.id = 'traffic-daily-bonus';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-labelledby', 'db-title');
    popup.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);opacity:0;transition:opacity 0.3s ease;';


    let streakDots = '';
    for (let i = 0; i < 7; i++) {
      const filled = i < bonusInfo.streak;
      const isCurrent = i === bonusInfo.streak - 1;
      streakDots += `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;border:2px solid ${filled ? '#f2b84b' : 'rgba(255,255,255,0.15)'};background:${filled ? 'rgba(242,184,75,0.2)' : 'transparent'};color:${filled ? '#f2b84b' : 'rgba(255,255,255,0.3)'};${isCurrent ? 'box-shadow:0 0 12px rgba(242,184,75,0.4);transform:scale(1.1);' : ''}">${filled ? '' : (i + 1)}</div>`;
    }

    popup.innerHTML = `
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border:1px solid rgba(242,184,75,0.3);border-radius:20px;padding:32px;max-width:360px;width:90%;text-align:center;position:relative;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);">
        <div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(242,184,75,0.15) 0%,transparent 70%);border-radius:50%;pointer-events:none;"></div>
        <div style="font-size:3.5rem;margin-bottom:8px;animation:dbBounce 0.6s ease;">${window.TrafficIcons ? window.TrafficIcons.resolve(bonusInfo.tier.emoji, 42) : ""}</div>
        <div id="db-title" style="font-family:'Lora',serif;font-size:1.6rem;font-weight:700;color:#f2b84b;margin-bottom:4px;">Daily Bonus!</div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.6);margin-bottom:20px;">${bonusInfo.tier.label} — ${bonusInfo.streak}/7 day streak${bonusInfo.forgiven ? ' ·  Miss Forgiven!' : ''}</div>
        <div style="font-size:2.5rem;font-weight:800;color:#34d399;font-family:'Lora',serif;margin-bottom:4px;">+₹${bonusInfo.amount.toLocaleString('en-IN')}</div>
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;">Added to wallet</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;">${streakDots}</div>
        <div style="font-size:0.7rem;color:rgba(255,255,255,0.35);margin-bottom:20px;">Come back tomorrow for more! 7-day streak = ₹5,000 bonus </div>
        <button id="db-claim" style="font-family:'Inter',sans-serif;font-size:1rem;font-weight:700;padding:14px 40px;border:none;border-radius:30px;background:linear-gradient(135deg,#f2b84b,#d97706);color:#1e293b;cursor:pointer;transition:all 0.2s;min-height:48px;">Claim Bonus</button>
      </div>
      <style>@keyframes dbBounce{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}</style>
    `;

    document.body.appendChild(popup);
    requestAnimationFrame(() => {
      popup.style.opacity = '1';
      popup.querySelector('div').style.transform = 'scale(1)';
    });

    const claimBtn = document.getElementById('db-claim');
    const hide = () => {
      popup.style.opacity = '0';
      popup.querySelector('div').style.transform = 'scale(0.9)';
      setTimeout(() => popup.remove(), 300);
    };
    claimBtn?.addEventListener('click', () => { claimDailyBonus(); hide(); });
    popup.addEventListener('click', (e) => { if (e.target === popup) {hide();} });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { hide(); document.removeEventListener('keydown', onKey); }
    });
  }

  const PAGE_ROUTES = {
    setup: 'Academy.html?settings=1',
    academy: 'Academy.html',
    driving: 'Driving.html',
    dashboard: 'TrafficDashboard.html',
    game: 'GamePage.html',
    student: 'student.html',
    teacher: 'teacher.html',
    parent: 'parent.html',
  };

  const SCREEN_LABELS = {
    setup: 'Setup Profile',
    academy: 'Academy Hub',
    driving: 'Driving Simulation',
    dashboard: 'Dashboard',
    game: '3D Driving Game',
    student: 'Student Portal',
    teacher: 'Teacher Portal',
    parent: 'Parent Portal',
    briefing: 'Level Briefing',
    level_select: 'Level Selection',
    quiz: 'Quiz',
    results: 'Results',
    badges: 'Badges',
    certificate: 'Certificate',
  };

  function getCurrentPageKey() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().toLowerCase().replace('.html', '');

    if (filename.includes('setup') || filename === 'trafficsetup') {return 'setup';}
    if (filename.includes('academy')) {return 'academy';}
    if (filename.includes('driving')) {return 'driving';}
    if (filename.includes('dashboard')) {return 'dashboard';}
    if (filename.includes('gamepage') || filename === 'game') {return 'game';}
    if (filename === 'student') {return 'student';}
    if (filename === 'teacher') {return 'teacher';}
    if (filename === 'parent') {return 'parent';}
    return 'unknown';
  }

  function saveSessionState(pageKey, extraState = {}) {
    const timestamp = Date.now();
    const state = {
      page: pageKey,
      timestamp,
      screen: extraState.screen || null,
      level: extraState.level || null,
      module: extraState.module || null,
      gameState: extraState.gameState || null,
      scrollPosition: extraState.scrollPosition || window.scrollY,
    };

    try {
      if (window.ColCookie) {
        try {
          window.ColCookie.set(STORAGE_KEYS.LAST_PAGE, state, 30);
          window.ColCookie.set(STORAGE_KEYS.SESSION_TIMESTAMP, timestamp.toString(), 30);
        } catch (_ck) {}
      }
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, timestamp.toString());
    } catch (e) {
      console.warn('Failed to save session state:', e);
    }
  }

  function loadSessionState() {
    try {
      let state = window.ColCookie ? window.ColCookie.get(STORAGE_KEYS.LAST_PAGE) : null;
      if (!state) {
        const raw = localStorage.getItem(STORAGE_KEYS.LAST_PAGE);
        if (raw) state = JSON.parse(raw);
      }
      if (!state) {return null;}

      const sessionTime = parseInt((window.ColCookie ? window.ColCookie.get(STORAGE_KEYS.SESSION_TIMESTAMP) : null) || localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP) || '0', 10);
      const now = Date.now();
      const MAX_SESSION_AGE = 7 * 24 * 60 * 60 * 1000;

      if (now - sessionTime > MAX_SESSION_AGE) {
        clearSessionState();
        return null;
      }

      return state;
    } catch (e) {
      console.warn('Failed to load session state:', e);
      return null;
    }
  }

  function clearSessionState() {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.USER_PROFILE && key !== STORAGE_KEYS.GAME_PROGRESS) {
        if (window.ColCookie) { try { window.ColCookie.remove(key); } catch (_ck) {} }
        localStorage.removeItem(key);
      }
    });
  }

  function formatTimeAgo(timestamp) {
    const timeAgo = Date.now() - timestamp;
    const seconds = Math.floor(timeAgo / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 30) {return 'just now';}
    if (minutes < 1) {return `${seconds}s ago`;}
    if (minutes < 60) {return `${minutes}m ${seconds % 60}s ago`;}
    if (hours < 24) {return `${hours}h ${minutes % 60}m ago`;}
    if (days === 1) {return 'yesterday';}
    if (days < 7) {return `${days}d ago`;}
    return `${weeks}w ago`;
  }

  function getWelcomeBackData() {
    const session = loadSessionState();
    if (!session) {return null;}

    // Just clicked Continue on another page — don't bounce the prompt straight back
    try {
      if (sessionStorage.getItem('wb_just_continued') === '1') {
        sessionStorage.removeItem('wb_just_continued');
        return null;
      }
    } catch (e) {}

    const hasProfile = !!localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const hasProgress = !!localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
    if (!hasProfile && !hasProgress) {return null;}

    // Dismiss = 24h snooze (not forever): a week-old dismissal may prompt again
    const dismissedAt = parseInt(localStorage.getItem(STORAGE_KEYS.WELCOME_DISMISSED) || '0', 10);
    if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) {return null;}

    const currentPage = getCurrentPageKey();
    if (currentPage === session.page) {return null;}

    // Fresh navigation (came straight from the other page seconds ago) is NOT
    // "welcome back" — only prompt when the last session is 10+ minutes old.
    const SESSION_MIN_AGE = 10 * 60 * 1000;
    if (Date.now() - (session.timestamp || 0) < SESSION_MIN_AGE) {return null;}

    const timeLabel = formatTimeAgo(session.timestamp);
    const screenLabel = session.screen ? SCREEN_LABELS[session.screen] : SCREEN_LABELS[session.page] || 'the app';

    return {
      page: session.page,
      pageLabel: SCREEN_LABELS[session.page] || 'the app',
      screenLabel,
      timeLabel,
      canContinue: !!PAGE_ROUTES[session.page],
      route: PAGE_ROUTES[session.page],
      session,
    };
  }

  function getResumeContext(session) {
    let saved = null
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS)
      if (raw) saved = JSON.parse(raw)
    } catch (_e) {}

    const compCount = saved && saved.comp ? Object.keys(saved.comp).length : 0
    const lastLv = (session && session.level) || (saved && saved.lastLevelId) || null
    let lvTitle = ''
    if (lastLv && Array.isArray(window.LVS)) {
      const found = window.LVS.find(function (l) { return String(l.id) === String(lastLv) })
      if (found && found.name) lvTitle = found.name
    }

    let route = PAGE_ROUTES[session.page] || 'Academy.html'
    let headline = 'Pick up where you left off'
    let detail = (SCREEN_LABELS[session.page] || 'Traffic Academy') + ' · Visited ' + formatTimeAgo(session.timestamp)
    let actionLabel = 'Resume'

    if (session.page === 'academy' && lastLv) {
      route = 'Academy.html?screen=briefing&lv=' + encodeURIComponent(lastLv)
      headline = lvTitle ? ('Continue ' + lvTitle) : ('Continue Lesson ' + lastLv)
      detail = 'Visited ' + formatTimeAgo(session.timestamp) + ' · ' + compCount + ' lessons completed'
      actionLabel = 'Open Lesson'
    } else if (session.page === 'driving' || session.page === 'game') {
      route = lastLv ? ('Driving.html?level=' + encodeURIComponent(lastLv)) : 'Driving.html'
      headline = lvTitle ? ('Resume drive: ' + lvTitle) : 'Resume your 3D driving run'
      detail = 'Last active ' + formatTimeAgo(session.timestamp)
      actionLabel = 'Resume Drive'
    } else if (session.page === 'dashboard') {
      headline = compCount > 0 ? ('Continue your ' + compCount + '-lesson streak') : 'Return to your Driver Dashboard'
      detail = 'Driver Dashboard · Last active ' + formatTimeAgo(session.timestamp)
      actionLabel = 'Open Dashboard'
    } else if (lastLv) {
      headline = lvTitle ? ('Next up: ' + lvTitle) : ('Resume Lesson ' + lastLv)
      detail = (SCREEN_LABELS[session.page] || 'Academy') + ' · ' + formatTimeAgo(session.timestamp)
    }

    return { route, headline, detail, actionLabel }
  }

  function createWelcomeBackPopup(data) {
    const existing = document.getElementById('traffic-welcome-back');
    if (existing) {existing.remove();}

    const ctx = getResumeContext(data.session || data);
    data.route = ctx.route;

    const popup = document.createElement('div');
    popup.id = 'traffic-welcome-back';
    popup.className = 'welcome-back-popup';
    popup.setAttribute('role', 'region');
    popup.setAttribute('aria-labelledby', 'wb-title');

    popup.innerHTML = `
      <div class="wb-panel" role="document">
        <div class="wb-header">
          <div class="wb-title-wrap">
            <div class="wb-eyebrow">Welcome back, ${getUserName()}</div>
            <h3 id="wb-title" class="wb-title">${ctx.headline}</h3>
            <p class="wb-subtitle">${ctx.detail}</p>
          </div>
          <button class="wb-close" aria-label="Dismiss" type="button">&times;</button>
        </div>
        <div class="wb-actions">
          <button class="wb-btn wb-btn-secondary" type="button" data-action="dismiss">Dismiss</button>
          <button class="wb-btn wb-btn-primary" type="button" data-action="continue">${ctx.actionLabel} &rarr;</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('show'));
    bindPopupEvents(popup, data);
    return popup;
  }

  function animateProgressBar(fillEl, duration) {
    if (!fillEl) {return;}
    fillEl.style.transition = `width ${duration}ms linear`;
    fillEl.style.width = '100%';
    setTimeout(() => {
      fillEl.style.transition = 'none';
      fillEl.style.width = '0%';
    }, duration);
  }

  function bindPopupEvents(popup, data) {
    const closeBtn = popup.querySelector('.wb-close');
    const dismissBtn = popup.querySelector('[data-action="dismiss"]');
    const continueBtn = popup.querySelector('[data-action="continue"]');
    const backdrop = popup.querySelector('.wb-backdrop');

    const hide = () => {
      if (popup._timerInterval) {clearInterval(popup._timerInterval);}
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    };

    const dismiss = () => {
      try { localStorage.setItem(STORAGE_KEYS.WELCOME_DISMISSED, Date.now().toString()); } catch (e) {}
      hide();
    };

    const doContinue = () => {
      hide();
      if (data.canContinue && data.route) {
        try { sessionStorage.setItem('wb_just_continued', '1'); } catch (e) {}
        window.location.href = data.route;
      }
    };

    closeBtn?.addEventListener('click', dismiss);
    dismissBtn?.addEventListener('click', dismiss);
    continueBtn?.addEventListener('click', doContinue);
    backdrop?.addEventListener('click', dismiss);

    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {dismiss();}
      if (e.key === 'Enter' && e.target === continueBtn) {doContinue();}
    });
  }

  function getUserName() {
    // The live session first. `window.colUser` is the SIGNED-IN identity;
    // the localStorage blob is the OFFLINE profile, and it may belong to a
    // different person (or to nobody). Greeting a signed-in student with the
    // offline profile's name is the identity split col-auth.js exists to
    // prevent.
    try {
      if (window.colUser && window.colUser.name) {return window.colUser.name;}
      if (window.colLocalUser && window.colLocalUser.name) {return window.colLocalUser.name;}
    } catch {}
    try {
      const profile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (profile) {
        const p = JSON.parse(profile);
        return p.name || 'Driver';
      }
      const progress = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
      if (progress) {
        const p = JSON.parse(progress);
        return p.name || 'Driver';
      }
    } catch (e) {}
    return 'Driver';
  }

  function initWelcomeBack() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWelcomeBack);
      return;
    }

    const currentPage = getCurrentPageKey();
    if (currentPage === 'setup') {
      return;
    }

    const data = getWelcomeBackData();
    if (data) {
      setTimeout(() => createWelcomeBackPopup(data), 800);
    }


    const bonusInfo = checkDailyBonus();
    if (bonusInfo) {
      const delay = data ? 1600 : 600;
      setTimeout(() => createDailyBonusPopup(bonusInfo, bonusInfo.isNew), delay);
    }

    if (currentPage !== 'unknown') {
      saveSessionState(currentPage);
    }
  }

  function trackScreen(screenName, extra = {}) {
    const currentPage = getCurrentPageKey();
    saveSessionState(currentPage, { screen: screenName, ...extra });
  }

  function trackGameState(gameState) {
    const currentPage = getCurrentPageKey();
    saveSessionState(currentPage, { gameState, screen: 'gameplay' });
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_GAME_STATE, JSON.stringify(gameState));
    } catch (e) {}
  }

  function trackLevel(levelId, moduleId) {
    const currentPage = getCurrentPageKey();
    saveSessionState(currentPage, { level: levelId, module: moduleId, screen: 'level_select' });
  }

  function trackModule(moduleId) {
    const currentPage = getCurrentPageKey();
    saveSessionState(currentPage, { module: moduleId, screen: 'module' });
  }

  window.TrafficWelcomeBack = {
    init: initWelcomeBack,
    trackScreen,
    trackGameState,
    trackLevel,
    trackModule,
    saveSessionState,
    loadSessionState,
    clearSessionState,
    getWelcomeBackData,
    STORAGE_KEYS,
    PAGE_ROUTES,
  };

  if (document.readyState !== 'loading') {
    initWelcomeBack();
  } else {
    document.addEventListener('DOMContentLoaded', initWelcomeBack);
  }
})();