// Class Of Learners Global Router & Banner System
(async function() {
    try {
        // Fetch global config from GitHub/Vercel
        const res = await fetch('config.json?t=' + new Date().getTime());
        if(!res.ok) return;
        const config = await res.json();
        
        // Determine current page basename
        let page = window.location.pathname.split('/').pop();
        if(!page) page = 'index.html'; // Default

        // 1. Check Routing Overrides
        if (config.pages && config.pages[page]) {
            const status = config.pages[page];
            if (status !== '200') {
                renderErrorScreen(status);
                return; // Stop execution, don't render banner if page is dead
            }
        }

        // 2. Render Global Banner
        if (config.banner && config.banner.active && config.banner.text) {
            renderBanner(config.banner.text);
        }

    } catch (e) {
        console.warn("COL Router: Could not load configuration. Assuming LIVE status.");
    }

    function renderErrorScreen(code) {
        document.head.innerHTML = `
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>System Error ${code}</title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { margin: 0; padding: 0; background-color: #0f172a; color: #38bdf8; font-family: 'Space Mono', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                h1 { font-size: 6rem; margin: 0; filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.5)); }
                p { font-size: 1.2rem; color: #94a3b8; max-width: 500px; margin-top: 10px;}
                .glow { color: #f8fafc; font-weight: bold; }
                .btn { margin-top: 30px; display: inline-block; padding: 12px 24px; border: 2px solid #38bdf8; color: #38bdf8; text-decoration: none; font-weight: bold; border-radius: 8px; transition: 0.3s; }
                .btn:hover { background: rgba(56, 189, 248, 0.1); box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); }
            </style>
        `;
        
        let msgs = {
            '404': { title: '404 NOT FOUND', desc: 'The sector you are trying to access does not exist or has been relocated by central command.' },
            '503': { title: '503 MAINTENANCE', desc: 'This page is currently offline for critical system upgrades. Please check back later.' },
            '401': { title: '401 UNAUTHORIZED', desc: 'Authentication required. You lack the necessary security clearance to view this module.' },
            '403': { title: '403 FORBIDDEN', desc: 'Access denied by the administrator. This zone is heavily restricted.' }
        };

        let info = msgs[code] || { title: 'SYSTEM HALTED', desc: 'An unknown anomaly has occurred.' };

        document.body.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px; text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);">⚠️</div>
            <h1>${code}</h1>
            <div class="glow" style="font-size: 1.5rem; margin-bottom: 20px;">${info.title}</div>
            <p>${info.desc}</p>
            <a href="index.html" class="btn">Return to Base</a>
        `;
    }

    function renderBanner(text) {
        if(document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => injectBanner(text));
        } else {
            injectBanner(text);
        }
    }

    function injectBanner(text) {
        const b = document.createElement('div');
        b.style.cssText = "background: linear-gradient(90deg, #38bdf8, #818cf8); color: #fff; text-align: center; padding: 12px 20px; font-weight: bold; font-family: 'Inter', sans-serif; font-size: 14px; position: relative; z-index: 999999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); line-height: 1.5;";
        b.innerHTML = `<span style="display:inline-block; margin-right: 25px;">🚀 ${text}</span> <span style="position:absolute; right:15px; top: 50%; transform: translateY(-50%); cursor:pointer; opacity:0.8; font-size: 20px; font-family: sans-serif;" onclick="this.parentElement.style.display='none'">&times;</span>`;
        document.body.insertBefore(b, document.body.firstChild);
    }
})();
