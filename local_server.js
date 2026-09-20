const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT && Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.apk': 'application/vnd.android.package-archive',
  '.exe': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm'
};

function resolvePath(urlPath) {
  let clean = decodeURIComponent(urlPath.split('?')[0]);
  if (clean === '/' || clean === '') clean = '/home.html';

  let directPath = path.join(ROOT_DIR, clean);

  // If file exists directly
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  // Clean URL: try adding .html
  let htmlPath = directPath + '.html';
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  // Check if directory with index.html
  if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    let indexPath = path.join(directPath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
    let drivingPath = path.join(directPath, 'Driving.html');
    if (fs.existsSync(drivingPath)) return drivingPath;
  }

  // Check shortcuts for hub and Traffic subfolder
  if (clean === '/hub' || clean === '/hub.html') {
    let hubPath = path.join(ROOT_DIR, 'Traffic', 'hub.html');
    if (fs.existsSync(hubPath)) return hubPath;
  }

  let trafficSubPath = path.join(ROOT_DIR, 'Traffic', clean.replace(/^\//, ''));
  if (fs.existsSync(trafficSubPath) && fs.statSync(trafficSubPath).isFile()) return trafficSubPath;
  if (fs.existsSync(trafficSubPath + '.html') && fs.statSync(trafficSubPath + '.html').isFile()) return trafficSubPath + '.html';

  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const filePath = resolvePath(req.url);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>404 Not Found</title><style>body{background:#070a14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;}</style></head>
        <body>
          <h1 style="color:#f2b84b;">404 Not Found</h1>
          <p>The requested file does not exist.</p>
          <a href="/hub" style="color:#5ed4f5;margin-top:16px;">🚗 Open Tuning Hub</a>
          <a href="/home" style="color:#8891aa;margin-top:8px;">Open Home</a>
        </body>
      </html>
    `);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache'
  });

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`Class Of Learners Local Server Active!`);
  console.log(`🏛️ 3D HQ & Tuning Hub: http://localhost:${PORT}/hub`);
  console.log(`🚗 3D Driving Simulator: http://localhost:${PORT}/Traffic/Driving.html`);
  console.log(`🚀 3D Zoom Experience:   http://localhost:${PORT}/home-zoom`);
  console.log(`🏠 Classic Home:         http://localhost:${PORT}/home`);
  console.log(`====================================================`);
});
