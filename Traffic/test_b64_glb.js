const fs = require('fs');
const js = fs.readFileSync('lambo.js', 'utf8');
const match = /(window\.MODELS\['[^']+'\]\s*=\s*['""]data:application\/octet-stream;base64,)([^'""]+)['""]/.exec(js);
if (!match) { console.log('No match'); process.exit(1); }
const buf = Buffer.from(match[2], 'base64');
const glb = buf;
const jsonLen = glb.readUInt32LE(12);
const jsonStr = glb.toString('utf8', 20, 20 + jsonLen);
const json = JSON.parse(jsonStr);
let bad = 0;
if (json.images) {
    json.images.forEach((img, i) => {
        const bv = json.bufferViews[img.bufferView];
        const binStart = 20 + jsonLen + 8;
        const imgStart = binStart + (bv.byteOffset || 0);
        const header = glb.toString('hex', imgStart, imgStart + 8);
        if (header !== '89504e470d0a1a0a' && header !== 'ffd8ffe000104a46' && header.substring(0,6) !== 'ffd8ff') {
            console.log('Image', i, 'BAD Header:', header);
            bad++;
        }
    });
}
console.log('bad images:', bad);
