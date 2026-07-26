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
  };

  const PAGE_ROUTES = {
    setup: 'TrafficSetup.html',
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
    
    if (filename.includes('setup') || filename === 'trafficsetup') return 'setup';
    if (filename.includes('academy')) return 'academy';
    if (filename.includes('driving')) return 'driving';
    if (filename.includes('dashboard')) return 'dashboard';
    if (filename.includes('gamepage') || filename === 'game') return 'game';
    if (filename === 'student') return 'student';
    if (filename === 'teacher') return 'teacher';
    if (filename === 'parent') return 'parent';
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
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, timestamp.toString());
    } catch (e) {
      console.warn('Failed to save session state:', e);
    }
  }

  function loadSessionState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_PAGE);
      if (!raw) return null;
      const state = JSON.parse(raw);
      
      const sessionTime = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP) || '0', 10);
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

    if (seconds < 30) return 'just now';
    if (minutes < 1) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ${seconds % 60}s ago`;
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return `${weeks}w ago`;
  }

  function getWelcomeBackData() {
    const session = loadSessionState();
    if (!session) return null;

    const hasProfile = !!localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const hasProgress = !!localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
    const dismissed = localStorage.getItem(STORAGE_KEYS.WELCOME_DISMISSED);

    if (!hasProfile && !hasProgress) return null;
    if (dismissed === 'true') return null;

    const currentPage = getCurrentPageKey();
    if (currentPage === session.page) return null;

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

  function createWelcomeBackPopup(data) {
    const existing = document.getElementById('traffic-welcome-back');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'traffic-welcome-back';
    popup.className = 'welcome-back-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-labelledby', 'wb-title');

    const isGame = data.page === 'game' || data.page === 'driving';
    const isSetup = data.page === 'setup';
    const isAcademy = data.page === 'academy';

    let actionText = 'Continue';
    let actionAriaLabel = `Continue ${data.screenLabel} from ${data.timeLabel}`;
    
    if (isGame) {
      actionText = 'Resume Game';
      actionAriaLabel = `Resume driving simulation from ${data.timeLabel}`;
    } else if (isAcademy) {
      actionText = 'Continue Learning';
      actionAriaLabel = `Continue academy from ${data.timeLabel}`;
    } else if (isSetup) {
      actionText = 'Finish Setup';
      actionAriaLabel = 'Complete your profile setup';
    }

    popup.innerHTML = `
      <div class="wb-backdrop" aria-hidden="true"></div>
      <div class="wb-panel" role="document">
        <div class="wb-header">
          <div class="wb-avatar" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="wb-title-wrap">
            <h3 id="wb-title" class="wb-title">Welcome Back, ${getUserName()}!</h3>
            <p class="wb-subtitle">Ready to pick up where you left off?</p>
          </div>
          <button class="wb-close" aria-label="Dismiss welcome back" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="wb-context">
          <span class="wb-context-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            ${data.screenLabel}
          </span>
          <span class="wb-context-chip wb-time-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="wb-time-text">${data.timeLabel}</span>
          </span>
        </div>
        <div class="wb-actions">
          <button class="wb-btn wb-btn-secondary" type="button" data-action="dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Not Now</span>
          </button>
          <button class="wb-btn wb-btn-primary" type="button" data-action="continue" aria-label="${actionAriaLabel}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span>${actionText}</span>
          </button>
        </div>
        <div class="wb-progress-bar" aria-hidden="true">
          <div class="wb-progress-fill"></div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
      popup.classList.add('show');
      animateProgressBar(popup.querySelector('.wb-progress-fill'), 5000);
    });

    bindPopupEvents(popup, data);

    // Real-time countdown timer — updates the time chip every second
    const timeChip = popup.querySelector('.wb-time-chip');
    if (timeChip && data.session && data.session.timestamp) {
      const timerInterval = setInterval(() => {
        if (!document.getElementById('traffic-welcome-back')) {
          clearInterval(timerInterval);
          return;
        }
        const timeText = popup.querySelector('.wb-time-text');
        if (timeText) timeText.textContent = formatTimeAgo(data.session.timestamp);
      }, 1000);
      popup._timerInterval = timerInterval;
    }

    return popup;
  }

  function animateProgressBar(fillEl, duration) {
    if (!fillEl) return;
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
      if (popup._timerInterval) clearInterval(popup._timerInterval);
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    };

    const dismiss = () => {
      localStorage.setItem(STORAGE_KEYS.WELCOME_DISMISSED, 'true');
      hide();
    };

    const doContinue = () => {
      hide();
      if (data.canContinue && data.route) {
        window.location.href = data.route;
      }
    };

    closeBtn?.addEventListener('click', dismiss);
    dismissBtn?.addEventListener('click', dismiss);
    continueBtn?.addEventListener('click', doContinue);
    backdrop?.addEventListener('click', dismiss);

    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'Enter' && e.target === continueBtn) doContinue();
    });
  }

  function getUserName() {
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

    const data = getWelcomeBackData();
    if (data) {
      setTimeout(() => createWelcomeBackPopup(data), 800);
    }

    const currentPage = getCurrentPageKey();
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