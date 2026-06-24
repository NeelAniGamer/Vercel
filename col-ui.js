// Shared UI Logic: Cursor, Theme Toggle, Mobile Menu
(function() {
    // 1. Cursor
    var dot = document.getElementById('cDot'), ring = document.getElementById('cRing');
    if (dot && ring) {
        var mx = 0, my = 0, rx = 0, ry = 0;
        document.addEventListener('mousemove', function(e) {
            mx = e.clientX; my = e.clientY;
            dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
        });
        (function draw() {
            rx += (mx - rx) * 0.13;
            ry += (my - ry) * 0.13;
            ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
            requestAnimationFrame(draw);
        })();
        document.querySelectorAll('a,button,select,input,.typing-area').forEach(function(el) {
            el.addEventListener('mouseenter', function() { document.body.classList.add('ch'); });
            el.addEventListener('mouseleave', function() { document.body.classList.remove('ch'); });
        });
    }

    // 2. Mobile Menu
    var mmb = document.getElementById('mmb'), nl = document.getElementById('navLinks');
    if (mmb && nl) {
        mmb.addEventListener('click', function() {
            nl.classList.toggle('active');
        });
    }

    // 3. Setup initial theme based on Storage if Storage exists (from col-auth.js or inline)
    // Actually, col-router.js or home.html defines Storage, but if it doesn't, we fallback to localStorage directly.
    try {
        var savedTheme = localStorage.getItem('theme');
        var tl = document.getElementById('tLabel');
        var tsck = document.getElementById('tsck');
        if (savedTheme === 'light') {
            document.body.classList.add('lm');
            if(tl) tl.textContent = 'Dark';
            if(tsck) tsck.checked = true;
        }
    } catch(e) {}

    // 4. Inject Mobile Bottom Navigation
    if (!document.getElementById('mobileBottomNav')) {
        var mbn = document.createElement('div');
        mbn.id = 'mobileBottomNav';
        mbn.className = 'mobile-bottom-nav';
        mbn.innerHTML = '<a href="home.html" class="mbn-item"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>Home</a>' +
                        '<a href="about.html" class="mbn-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>About</a>' +
                        '<a href="school.html" class="mbn-item"><svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>Academy</a>' +
                        '<a href="#" class="mbn-item" onclick="var ck=document.getElementById(\\'tsck\\');if(ck){ck.checked=!ck.checked;window.toggleTheme(ck);}else{var isLm=document.body.classList.toggle(\\'lm\\');try{localStorage.setItem(\\'theme\\', isLm?\\'light\\':\\'dark\\');}catch(e){}}return false;"><svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>Theme</a>';
        document.body.appendChild(mbn);
    }
})();

// Theme Toggle Function (Global)
window.toggleTheme = function(el) {
    var tl = document.getElementById('tLabel');
    if (el.checked) {
        document.body.classList.add('lm');
        try { localStorage.setItem('theme', 'light'); } catch(e) {}
        if (tl) tl.textContent = 'Dark';
    } else {
        document.body.classList.remove('lm');
        try { localStorage.setItem('theme', 'dark'); } catch(e) {}
        if (tl) tl.textContent = 'Light';
    }
};
