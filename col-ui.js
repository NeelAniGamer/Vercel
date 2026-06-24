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
