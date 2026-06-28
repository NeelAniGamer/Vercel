const fs = require('fs');
let html = fs.readFileSync('Academy.html', 'utf8');
html = html.replace(/onclick="ui\.showProfile\(\)"/g, 'onclick="window.location.href=\'TrafficSetup.html\'" class="dynamic-auth-btn"');
html = html.replace(/👤 Profile/g, 'Sign In');
html = html.replace('id="nav-sign-in-btn"', 'id="academy-sign-in-btn"');
html = html.replace('class="nav-login-btn cloud-login-btn"', 'class=""');
fs.writeFileSync('Academy.html', html, 'utf8');
