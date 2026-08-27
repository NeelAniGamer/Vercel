const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.bin': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/Traffic/Driving.html';

  let filePath = path.join(ROOT, reqPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Try appending .html
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (err2, stats2) => {
        if (!err2 && stats2.isFile()) {
          serveFile(htmlPath, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found: ' + reqPath);
        }
      });
      return;
    }

    if (stats.isDirectory()) {
      const indexHtml = path.join(filePath, 'index.html');
      const drivingHtml = path.join(filePath, 'Driving.html');
      if (fs.existsSync(indexHtml)) serveFile(indexHtml, res);
      else if (fs.existsSync(drivingHtml)) serveFile(drivingHtml, res);
      else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Directory listing disabled');
      }
    } else {
      serveFile(filePath, res);
    }
  });
});

function serveFile(file, res) {
  const ext = path.extname(file).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  
  fs.createReadStream(file).pipe(res);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Localhost server running at: http://localhost:${PORT}/Traffic/Driving.html`);
});
