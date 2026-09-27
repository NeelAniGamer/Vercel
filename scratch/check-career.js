// Pull every plain inline <script> out of Career.html and syntax-check it.
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || 'Career.html', 'utf8');

const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m;
let n = 0;
let bad = 0;
while ((m = re.exec(html))) {
  const attrs = m[1] || '';
  if (/\bsrc\s*=/.test(attrs)) continue;
  if (/application\/ld\+json/.test(attrs)) continue;
  n++;
  try {
    new Function(m[2]);
    console.log('OK   inline script #' + n + ' (' + m[2].length + ' chars)');
  } catch (e) {
    bad++;
    console.log('FAIL inline script #' + n + ': ' + e.message);
    const lines = m[2].split('\n');
    const lineNo = /<anonymous>:(\d+)/.exec(e.stack || '');
    if (lineNo) {
      const i = parseInt(lineNo[1], 10) - 3;
      console.log('  context:', lines.slice(Math.max(0, i - 2), i + 3).join('\n  '));
    }
  }
}
console.log('checked ' + n + ' inline scripts, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
