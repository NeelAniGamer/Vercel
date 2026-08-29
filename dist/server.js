const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.apk': 'application/vnd.android.package-archive',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json'
};

function serveFile(res, filePath, ext) {
  const contentType = MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Rewrites & Redirects per vercel.json
  if (pathname === '/' || pathname === '/index' || pathname === '/index.html') {
    pathname = '/home';
  }

  let filePath = path.join(ROOT_DIR, pathname);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Direct file check
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    serveFile(res, filePath, ext);
    return;
  }

  // cleanUrls support (e.g. /home -> home.html, /verify -> verify.html)
  if (fs.existsSync(filePath + '.html') && fs.statSync(filePath + '.html').isFile()) {
    serveFile(res, filePath + '.html', '.html');
    return;
  }

  // Directory index
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    const homePath = path.join(filePath, 'home.html');
    if (fs.existsSync(indexPath)) {
      serveFile(res, indexPath, '.html');
      return;
    }
    if (fs.existsSync(homePath)) {
      serveFile(res, homePath, '.html');
      return;
    }
  }

  // 404 handler
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="background:#070a14;color:#e8e3d8;font-family:sans-serif;text-align:center;padding:50px;"><h1>404 Not Found</h1><p>The requested URL ' + pathname + ' was not found.</p><a href="/" style="color:#F2B84B;">Return to Home</a></body></html>');
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Localhost Server is Running!`);
    console.log(`📡 URL: http://localhost:${port}`);
    console.log(`📁 Root: ${ROOT_DIR}`);
    console.log(`🔄 cleanUrls: Enabled (Vercel emulation)`);
    console.log(`========================================\n`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying http://localhost:${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', e);
    }
  });
}

startServer(PORT);
