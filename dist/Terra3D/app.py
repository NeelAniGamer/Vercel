import os
import sys
import threading
import http.server
import socketserver
import webview

PORT = 8080

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def start_server(base_dir):
    class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=base_dir, **kwargs)
        
        def log_message(self, format, *args):
            pass # Suppress server console logs

    handler = QuietHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        httpd.serve_forever()

if __name__ == '__main__':
    base_dir = get_base_dir()
    
    server_thread = threading.Thread(target=start_server, args=(base_dir,), daemon=True)
    server_thread.start()
    
    webview.create_window(
        title='Terra3D - Interactive World Atlas',
        url=f'http://127.0.0.1:{PORT}',
        width=1280,
        height=800,
        resizable=True,
        min_size=(800, 600),
        background_color='#050811'
    )
    
    webview.start()
