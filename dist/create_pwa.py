import os

PWA_DIR = r"c:\Users\neelg\OneDrive\Desktop\Vercel\cast"

manifest = """{
  "name": "Cast Desktop",
  "short_name": "Cast Desktop",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0F1118",
  "theme_color": "#00BFA5",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}"""

sw = """
const CACHE_NAME = "cast-desktop-v1";
const ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
"""

html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cast Desktop UI</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="styles.css">
    <script src="app.js" defer></script>
</head>
<body>
    <div id="desktop">
        <div id="top-bar">
            <div class="logo">Cast Desktop</div>
            <div id="connection-status" class="status-disconnected">Disconnected</div>
            <div class="controls">
                <select id="connection-type">
                    <option value="local">Local Network</option>
                    <option value="azure">Cloud (Azure PubSub)</option>
                </select>
                <input type="text" id="target-ip" placeholder="Target IP / ID">
                <button id="connect-btn" class="focusable">Connect</button>
            </div>
        </div>
        <div id="main-content">
            <div id="screen-container">
                <img id="stream-img" src="" style="display:none;" />
                <div id="placeholder">
                    <h2>Ready to Connect</h2>
                    <p>Enter the Cast app IP or Cloud ID above.</p>
                </div>
            </div>
            <div id="remote-control">
                <h3>TV Remote Control</h3>
                <div class="d-pad">
                    <button class="d-btn up focusable" data-key="up">?</button>
                    <div class="d-row">
                        <button class="d-btn left focusable" data-key="left">?</button>
                        <button class="d-btn ok focusable" data-key="ok">OK</button>
                        <button class="d-btn right focusable" data-key="right">?</button>
                    </div>
                    <button class="d-btn down focusable" data-key="down">?</button>
                </div>
                <div class="d-actions">
                    <button class="action-btn focusable" data-key="home">Home</button>
                    <button class="action-btn focusable" data-key="back">Back</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

css = """
:root {
    --bg-dark: #0F1118;
    --surface: rgba(255,255,255,0.05);
    --primary: #00BFA5;
    --accent: #FFB300;
    --text: #FFFFFF;
}
body {
    margin: 0; padding: 0;
    font-family: "Inter", sans-serif;
    background: var(--bg-dark);
    color: var(--text);
    overflow: hidden;
}
#desktop {
    display: flex; flex-direction: column; height: 100vh;
}
#top-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 15px 20px;
    background: var(--surface);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo { font-size: 1.2rem; font-weight: bold; color: var(--primary); }
#connection-status { padding: 5px 10px; border-radius: 15px; font-size: 0.9rem; }
.status-disconnected { background: #b71c1c; }
.status-connected { background: #1b5e20; }
.controls { display: flex; gap: 10px; }
input, select, button {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    color: white; padding: 8px 12px; border-radius: 5px; outline: none;
}
button { cursor: pointer; transition: 0.2s; }
button:hover, button:focus { background: var(--primary); border-color: var(--primary); }
.focusable:focus { box-shadow: 0 0 0 3px var(--accent); }

#main-content {
    display: flex; flex: 1; overflow: hidden;
}
#screen-container {
    flex: 1; display: flex; justify-content: center; align-items: center;
    background: #000; position: relative; padding: 20px;
}
#stream-img {
    max-width: 100%; max-height: 100%; object-fit: contain;
    border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
#placeholder { text-align: center; color: rgba(255,255,255,0.5); }

#remote-control {
    width: 300px; background: var(--surface);
    border-left: 1px solid rgba(255,255,255,0.1);
    padding: 20px; display: flex; flex-direction: column; align-items: center;
}
.d-pad { display: flex; flex-direction: column; align-items: center; margin-top: 30px; gap: 10px; }
.d-row { display: flex; gap: 10px; }
.d-btn { width: 60px; height: 60px; border-radius: 30px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
.d-btn.ok { background: var(--primary); color: var(--bg-dark); font-weight: bold; }
.d-btn.ok:focus { box-shadow: 0 0 0 4px var(--accent); }
.d-actions { display: flex; gap: 20px; margin-top: 40px; }
.action-btn { width: 100px; height: 40px; border-radius: 20px; }
"""

js = """
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

let ws = null;
let connectionType = "local";

document.getElementById("connect-btn").addEventListener("click", () => {
    connectionType = document.getElementById("connection-type").value;
    const target = document.getElementById("target-ip").value;
    if (!target) return;
    
    if (connectionType === "local") {
        connectLocal(target);
    } else {
        connectAzure(target);
    }
});

function connectLocal(ip) {
    if (ws) ws.close();
    ws = new WebSocket(`ws://${ip}:8080/ws`);
    setupWebSocket();
    document.getElementById("stream-img").src = `http://${ip}:8080/stream`;
    document.getElementById("stream-img").style.display = "block";
    document.getElementById("placeholder").style.display = "none";
}

function connectAzure(id) {
    // In a real implementation, this would negotiate with an Azure Function
    // to get a Web PubSub Client Access URI.
    alert("Azure Web PubSub requires backend provisioning. For demo, switching to local connection flow.");
}

function setupWebSocket() {
    ws.onopen = () => {
        document.getElementById("connection-status").className = "status-connected";
        document.getElementById("connection-status").innerText = "Connected";
    };
    ws.onclose = () => {
        document.getElementById("connection-status").className = "status-disconnected";
        document.getElementById("connection-status").innerText = "Disconnected";
    };
}

// TV Remote Navigation
const focusables = Array.from(document.querySelectorAll(".focusable"));
let focusIndex = 0;

document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        
        // Remote logic sending to app
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "remote_key", key: e.key.replace("Arrow", "").toLowerCase() }));
        }

        // Local UI Navigation for TV browsers
        if (e.key === "ArrowRight") focusIndex = (focusIndex + 1) % focusables.length;
        if (e.key === "ArrowLeft") focusIndex = (focusIndex - 1 + focusables.length) % focusables.length;
        focusables[focusIndex].focus();
    }
    
    if (e.key === "Enter") {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "remote_key", key: "ok" }));
        }
    }
});

// Click handlers for the remote UI buttons
document.querySelectorAll(".d-btn, .action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "remote_key", key }));
        }
    });
});
"""

with open(os.path.join(PWA_DIR, "manifest.json"), "w", encoding="utf-8") as f: f.write(manifest)
with open(os.path.join(PWA_DIR, "sw.js"), "w", encoding="utf-8") as f: f.write(sw)
with open(os.path.join(PWA_DIR, "index.html"), "w", encoding="utf-8") as f: f.write(html)
with open(os.path.join(PWA_DIR, "styles.css"), "w", encoding="utf-8") as f: f.write(css)
with open(os.path.join(PWA_DIR, "app.js"), "w", encoding="utf-8") as f: f.write(js)

