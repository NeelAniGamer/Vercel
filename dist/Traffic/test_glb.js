const fs = require('fs'); 
['env.js', 'auto.js', 'bus.js', 'lambo.js', 'cert_assets.js'].forEach(f => { 
  try {
    let s = fs.readFileSync(f, 'utf8'); 
    let regex = /base64,([^"']+)/g;
    let match;
    let count = 0;
    while ((match = regex.exec(s)) !== null) {
      count++;
      let b64 = match[1];
      let firstEq = b64.indexOf('=');
      let lastNonEq = b64.replace(/=+$/, '').length;
      if (firstEq !== -1 && firstEq < lastNonEq) {
        console.log(f, 'match', count, 'HAS = IN MIDDLE at', firstEq, 'len', b64.length);
      } else {
        console.log(f, 'match', count, 'No = in middle');
      }
    }
  } catch(e) {
    console.log(f, 'Error:', e.message);
  }
});
