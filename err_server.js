const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        fs.writeFileSync('error_log.txt', body);
        res.end('ok');
        process.exit(0);
    });
}).listen(8081);
