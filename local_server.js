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

// decodeURIComponent throws a URIError on malformed input such as "/%zz", which would take the
// whole server down, so decode defensively and refuse anything unusable.
function decodeUrlPath(urlPath) {
  const raw = String(urlPath == null ? '' : urlPath).split('?')[0];
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch (e) {
    return null;
  }
  return decoded.indexOf('\0') === -1 ? decoded : null;
}

// Rebuild the request as a relative path from its real segments, rejecting ".." instead of
// trying to strip it. Refusing traversal outright means the value handed to path.resolve()
// only ever contains literal child segments, so it stays normalized and relative and the
// containment check below is the single authority on whether a request may leave the root.
function toSafeRelative(decoded) {
  const segments = [];
  for (const segment of decoded.split(/[\\/]+/)) {
    if (segment === '' || segment === '.') {continue;}
    if (segment === '..') {return null;}
    segments.push(segment);
  }
  return segments.join(path.sep);
}

function resolvePath(urlPath) {
  let clean = decodeUrlPath(urlPath);
  if (clean === null) {return null;}
  if (clean === '/' || clean === '') {clean = '/home.html';}

  const safeRel = toSafeRelative(clean);
  if (safeRel === null) {return null;}

  const rootDirResolved = path.resolve(ROOT_DIR);
  const directPath = path.resolve(rootDirResolved, safeRel);
  if (!directPath.startsWith(rootDirResolved + path.sep) && directPath !== rootDirResolved) {
    return null;
  }

  // If file exists directly
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  // Clean URL: try adding .html
  const htmlPath = directPath + '.html';
  if (htmlPath.startsWith(rootDirResolved + path.sep) && fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  // Check if directory with index.html
  if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    const indexPath = path.join(directPath, 'index.html');
    if (fs.existsSync(indexPath)) {return indexPath;}
    const drivingPath = path.join(directPath, 'Driving.html');
    if (fs.existsSync(drivingPath)) {return drivingPath;}
  }

  // Check shortcuts for hub and Traffic subfolder
  if (clean === '/hub' || clean === '/hub.html') {
    const hubPath = path.join(rootDirResolved, 'Traffic', 'hub.html');
    if (fs.existsSync(hubPath)) {return hubPath;}
  }

  const trafficBase = path.resolve(rootDirResolved, 'Traffic');
  const trafficSubPath = path.resolve(trafficBase, safeRel);
  if (trafficSubPath.startsWith(trafficBase + path.sep) || trafficSubPath === trafficBase) {
    if (fs.existsSync(trafficSubPath) && fs.statSync(trafficSubPath).isFile()) {
      return trafficSubPath;
    }
    const trafficHtml = trafficSubPath + '.html';
    if (trafficHtml.startsWith(trafficBase + path.sep) && fs.existsSync(trafficHtml) && fs.statSync(trafficHtml).isFile()) {
      return trafficHtml;
    }
  }

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
