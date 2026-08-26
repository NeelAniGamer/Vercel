const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
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
  '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
  '.apk': 'application/vnd.android.package-archive',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const ROOT_DIR = __dirname;

function resolveFilePath(reqPath) {
  let decoded = decodeURIComponent(reqPath);
  if (decoded === '/' || decoded === '') decoded = '/home.html';

  let filePath = path.join(ROOT_DIR, decoded);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexHtml = path.join(filePath, 'index.html');
    const academyHtml = path.join(filePath, 'Academy.html');
    if (fs.existsSync(indexHtml)) return indexHtml;
    if (fs.existsSync(academyHtml)) return academyHtml;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  if (fs.existsSync(filePath + '.html') && fs.statSync(filePath + '.html').isFile()) {
    return filePath + '.html';
  }

  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const targetFile = resolveFilePath(parsedUrl.pathname);

  if (!targetFile) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>404 Not Found</h1><p>Cannot find path: ${parsedUrl.pathname}</p>`);
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(targetFile);
  const totalSize = stat.size;

  const rangeHeader = req.headers['range'];
  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType
    });

    const stream = fs.createReadStream(targetFile, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(targetFile);
    stream.pipe(res);
  }
});

function startServer(port = 3000) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 Class Of Learners & Traffic Simulator Server`);
    console.log(`======================================================`);
    console.log(`  Local URL:        http://localhost:${port}`);
    console.log(`  Traffic Academy:  http://localhost:${port}/Traffic/Academy.html`);
    console.log(`  Traffic Driving:  http://localhost:${port}/Traffic/Driving.html`);
    console.log(`  Traffic Setup:    http://localhost:${port}/Traffic/TrafficSetup.html`);
    console.log(`  Main Home:        http://localhost:${port}/home.html`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(3000);
