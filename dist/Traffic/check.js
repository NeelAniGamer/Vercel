const fs = require('fs');
const orig = fs.readFileSync('orig_lambo.js', 'utf8');
const old = fs.readFileSync('lambo_105ba.js', 'utf8');
const p3Orig = /(window\.MODELS\['([^']+)'\]\s*=\s*'data:application\/octet-stream;base64,)([^']+)'/g.exec(orig)[3];
const p3Old = /(window\.MODELS\['([^']+)'\]\s*=\s*['"]data:application\/octet-stream;base64,)([^'"]+)['"]/g.exec(old)[3];
for (let i = 0; i < p3Old.length; i++) {
    if (p3Orig[i] !== p3Old[i]) {
        console.log('Diff at index', i, 'orig=', p3Orig[i].charCodeAt(0), 'old=', p3Old[i].charCodeAt(0));
        console.log(p3Orig.slice(Math.max(0, i-10), i+10));
        break;
    }
}
