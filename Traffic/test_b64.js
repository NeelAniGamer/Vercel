const fs = require('fs');
const js = fs.readFileSync('lambo.js', 'utf8');
const match = /(window\.MODELS\['[^']+'\]\s*=\s*['""]data:application\/octet-stream;base64,)([^'""]+)['""]/.exec(js);
if (!match) { console.log('No match'); process.exit(1); }
const b64 = match[2];
console.log('Base64 Length:', b64.length);
console.log('Modulo 4:', b64.length % 4);
const invalidChars = b64.match(/[^A-Za-z0-9+/=]/g);
if (invalidChars) {
    console.log('Invalid Chars:', invalidChars.length, [...new Set(invalidChars)]);
} else {
    console.log('No invalid chars');
}
