import sys
import os
import threading
import http.server
import socketserver
import urllib.request
import json
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QSplashScreen
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings
from PyQt6.QtWebChannel import QWebChannel
from PyQt6.QtCore import QUrl, QObject, pyqtSlot, Qt, QTimer
from PyQt6.QtGui import QKeySequence, QShortcut, QColor, QPixmap, QPainter, QFont, QLinearGradient, QPen

PORT    = 8585
if getattr(sys, 'frozen', False):
    # Running As A Compiled Exe
    WEB_DIR = sys._MEIPASS
else:
    # Running As A Normal Python Script
    WEB_DIR = os.path.dirname(os.path.abspath(__file__))
JS_DIR  = os.path.join(WEB_DIR, 'assets', 'js')

# ── Offline Three.js asset downloader ────────────────────────────────────────
THREE_VERSION  = "0.160.0"
ASSETS_TO_CACHE = {
    "three.module.min.js": f"https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/build/three.module.min.js",
    "OrbitControls.js":    f"https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/examples/jsm/controls/OrbitControls.js",
    "CSS2DRenderer.js":    f"https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/examples/jsm/renderers/CSS2DRenderer.js",
}

def ensure_js_assets() -> bool:
    os.makedirs(JS_DIR, exist_ok=True)
    all_ok = True
    for filename, url in ASSETS_TO_CACHE.items():
        dest = os.path.join(JS_DIR, filename)
        if os.path.exists(dest) and os.path.getsize(dest) > 1024:
            continue
        print(f"[SETUP] Downloading {filename} …")
        try:
            urllib.request.urlretrieve(url, dest)
            print(f"[SETUP] ✓ {filename} ({os.path.getsize(dest)//1024} KB)")
        except Exception as e:
            print(f"[SETUP] ✗ {filename}: {e}")
            all_ok = False
    return all_ok

# ── HTTP server ───────────────────────────────────────────────────────────────
class SilentServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()
    def guess_type(self, path):
        if path.endswith('.js'):  return 'application/javascript'
        if path.endswith('.mjs'): return 'application/javascript'
        return super().guess_type(path)

def run_local_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SilentServerHandler) as httpd:
        httpd.serve_forever()

# ── Python ↔ JS bridge ────────────────────────────────────────────────────────
class PlanetDataInterface(QObject):
    def __init__(self, parent=None):
        super().__init__(parent)

    @pyqtSlot(str, str, str)
    def receive_planet_click(self, name, radius, desc):
        print(f"[DATABANK] Accessed: {name}")

    @pyqtSlot(str)
    def log(self, message):
        print(f"[JS] {message}")

    @pyqtSlot(result=str)
    def get_system_info(self):
        import platform
        return json.dumps({
            "os": platform.system(),
            "cpu": platform.processor(),
            "python": platform.python_version(),
        })

# ── Splash screen ─────────────────────────────────────────────────────────────
def make_splash():
    W, H = 680, 340
    pix  = QPixmap(W, H)
    pix.fill(QColor("#020408"))
    p = QPainter(pix)
    p.setRenderHint(QPainter.RenderHint.TextAntialiasing)
    p.setRenderHint(QPainter.RenderHint.Antialiasing)

    # Gradient background band
    grad = QLinearGradient(0, 0, W, 0)
    grad.setColorAt(0, QColor(0, 0, 0, 0))
    grad.setColorAt(0.5, QColor(255, 120, 40, 18))
    grad.setColorAt(1, QColor(0, 0, 0, 0))
    from PyQt6.QtGui import QBrush
    p.fillRect(0, H//2 - 60, W, 120, QBrush(grad))

    # Star dots
    import random; rng = random.Random(42)
    p.setPen(QColor(200, 215, 255, 80))
    for _ in range(220):
        x = rng.randint(0, W); y = rng.randint(0, H)
        p.drawPoint(x, y)

    # Title
    tf = QFont("Segoe UI", 30, QFont.Weight.Bold)
    p.setFont(tf)
    p.setPen(QColor("#ff9955"))
    p.drawText(0, 60, W, 60, Qt.AlignmentFlag.AlignHCenter | Qt.AlignmentFlag.AlignVCenter,
               "✦  SOLAR ENGINE  v3.3")

    # Subtitle
    sf = QFont("Segoe UI", 11)
    p.setFont(sf)
    p.setPen(QColor("#8899aa"))
    p.drawText(0, 120, W, 36, Qt.AlignmentFlag.AlignHCenter | Qt.AlignmentFlag.AlignVCenter,
               "Initializing visualization engine…")

    # Steps
    p.setFont(QFont("Consolas", 9))
    p.setPen(QColor("#445566"))
    steps = [
        "  ✓ 3D render pipeline",
        "  ✓ Planet databank",
        "  ◌ Loading Three.js assets…",
    ]
    y_off = 176
    for step in steps:
        p.drawText(W//2 - 140, y_off, 280, 22, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, step)
        y_off += 22

    # Separator line
    p.setPen(QPen(QColor(255, 153, 85, 40), 1))
    p.drawLine(60, H - 50, W - 60, H - 50)

    # Credits
    p.setFont(QFont("Consolas", 9))
    p.setPen(QColor("#334455"))
    p.drawText(0, H - 44, W, 36, Qt.AlignmentFlag.AlignHCenter | Qt.AlignmentFlag.AlignVCenter,
               "Engine Architecture  ·  Ansh & Neel")

    p.end()
    splash = QSplashScreen(pix)
    splash.setWindowFlag(Qt.WindowType.WindowStaysOnTopHint)
    return splash

# ── Main window ───────────────────────────────────────────────────────────────
class SolarSystemApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Solar System Visualization Engine  v3.3")
        self.setGeometry(50, 50, 1700, 960)
        self.setStyleSheet("background-color: #020408;")
        self._is_fullscreen = False

        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        self.browser = QWebEngineView()
        s = self.browser.settings()
        s.setAttribute(QWebEngineSettings.WebAttribute.WebGLEnabled, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True)
        # Performance hints
        s.setAttribute(QWebEngineSettings.WebAttribute.Accelerated2dCanvasEnabled, True)

        self.channel = QWebChannel()
        self.bridge  = PlanetDataInterface(self)
        self.channel.registerObject('planetBridge', self.bridge)
        self.browser.page().setWebChannel(self.channel)

        self.browser.setUrl(QUrl(f"http://localhost:{PORT}/engine.html"))
        self.browser.page().fullScreenRequested.connect(self._on_fullscreen_request)
        layout.addWidget(self.browser)

        self._setup_shortcuts()

    def _setup_shortcuts(self):
        QShortcut(QKeySequence("F11"),    self, self._toggle_fullscreen)
        QShortcut(QKeySequence("Escape"), self, self._exit_fullscreen)
        QShortcut(QKeySequence("R"),      self, self._reload)
        QShortcut(QKeySequence("Ctrl+R"), self, self._reload)
        QShortcut(QKeySequence("Space"),  self, lambda: self._js("if(window.togglePause)window.togglePause()"))
        QShortcut(QKeySequence("+"),      self, lambda: self._js("if(window.speedUp)window.speedUp()"))
        QShortcut(QKeySequence("-"),      self, lambda: self._js("if(window.speedDown)window.speedDown()"))
        QShortcut(QKeySequence("H"),      self, lambda: self._js("if(window._resetCamera)window._resetCamera()"))

    def _js(self, code: str):
        self.browser.page().runJavaScript(code)

    def _toggle_fullscreen(self):
        if self._is_fullscreen: self.showNormal()
        else:                   self.showFullScreen()
        self._is_fullscreen = not self._is_fullscreen

    def _exit_fullscreen(self):
        if self._is_fullscreen:
            self.showNormal()
            self._is_fullscreen = False

    def _on_fullscreen_request(self, request):
        """Let Qt own fullscreen so the web API doesn't throw."""
        request.accept()
        if request.toggleOn():
            self.showFullScreen()
            self._is_fullscreen = True
        else:
            self.showNormal()
            self._is_fullscreen = False

    def _reload(self):
        self.browser.reload()

if __name__ == "__main__":
    splash_app = QApplication.instance() or QApplication(sys.argv)
    splash = make_splash()
    splash.show()
    splash_app.processEvents()

    offline_ok = ensure_js_assets()
    if not offline_ok:
        print("[WARN] Some JS assets could not be downloaded. App may require internet on first run.")

    server_thread = threading.Thread(target=run_local_server, daemon=True)
    server_thread.start()
    print(f"[SERVER] Serving on http://localhost:{PORT}")

    # Pass WebGL / performance flags
    sys.argv += [
        "--disable-web-security",
        "--ignore-gpu-blocklist",
        "--enable-gpu-rasterization",
        "--enable-zero-copy",
        "--disable-gpu-sandbox",
        "--disable-software-rasterizer",
    ]

    app = QApplication.instance() or QApplication(sys.argv)
    window = SolarSystemApp()

    def _show():
        splash.finish(window)
        window.show()
        print("[APP] Window ready.")

    QTimer.singleShot(1400, _show)
    sys.exit(app.exec())