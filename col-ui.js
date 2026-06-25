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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('SW registered: ', registration.scope);
    }, function(err) {
      console.log('SW registration failed: ', err);
    });
  });
}

// 4. Mobile App Download Popup
try {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var isWebView = /wv/i.test(navigator.userAgent) || /Build\//i.test(navigator.userAgent);
    var hasPrompted = sessionStorage.getItem('col_app_prompted');
    
    if (isMobile && !isWebView && !hasPrompted) {
        sessionStorage.setItem('col_app_prompted', 'true');
        
        var popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.bottom = '20px';
        popup.style.left = '20px';
        popup.style.right = '20px';
        popup.style.backgroundColor = 'var(--panel, #111827)';
        popup.style.color = 'var(--ink, #E8E3D8)';
        popup.style.padding = '15px 20px';
        popup.style.borderRadius = '12px';
        popup.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        popup.style.zIndex = '9999';
        popup.style.display = 'flex';
        popup.style.flexDirection = 'column';
        popup.style.gap = '10px';
        popup.style.border = '1px solid var(--line, rgba(255,255,255,0.08))';
        popup.style.fontFamily = 'var(--sans, sans-serif)';
        
        popup.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<div style="font-weight:bold; font-size:1.1rem; color:var(--signal, #F2B84B);">Get the App</div>' +
            '<button id="closeAppPopup" style="background:none; border:none; color:var(--dim, #8891AA); font-size:1.4rem; cursor:pointer; padding:0; line-height:1;">&times;</button>' +
            '</div>' +
            '<div style="font-size:0.9rem; color:var(--dim, #8891AA); line-height:1.4;">Experience Class Of Learners natively on your mobile device for better performance.</div>' +
            '<a href="/COL.apk" download style="display:block; text-align:center; background:var(--signal, #F2B84B); color:#070A14; text-decoration:none; padding:12px; border-radius:8px; font-weight:bold; font-size:0.95rem; margin-top:5px; transition: opacity 0.2s;">Download Android APK</a>';
        
        document.body.appendChild(popup);
        
        document.getElementById('closeAppPopup').addEventListener('click', function() {
            popup.remove();
        });
    }
} catch(e) {}
