const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

// `.vercelignore` strips CI-only and desktop-only paths from the source upload,
// so those inputs are optional during a Vercel build and required locally.
const deployUploaded = process.argv.includes('--allow-missing-sources');
const optional = new Set(deployUploaded ? ['Traffic/electron/main.ts', 'Traffic/electron/main.js', '.github/codeql/codeql-config.yml', 'SECURITY.md'] : []);

const checked = [];
const skipped = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    if (optional.has(relativePath)) {
      if (!skipped.includes(relativePath)) {skipped.push(relativePath);}
      return '';
    }
    failures.push(`Missing required security file: ${relativePath}`);
    return '';
  }
  if (!checked.includes(relativePath)) {checked.push(relativePath);}
  return fs.readFileSync(fullPath, 'utf8');
}

function requireMatch(relativePath, pattern, message) {
  const source = read(relativePath);
  if (source && !pattern.test(source)) {failures.push(`${relativePath}: ${message}`);}
}

function rejectMatch(relativePath, pattern, message) {
  const source = read(relativePath);
  if (source && pattern.test(source)) {failures.push(`${relativePath}: ${message}`);}
}

const electronFiles = ['Traffic/electron/main.ts', 'Traffic/electron/main.js'];
for (const file of electronFiles) {
  rejectMatch(file, /allowRunningInsecureContent\s*:\s*true/i, 'insecure Electron content execution is enabled');
  rejectMatch(file, /webSecurity\s*:\s*false/i, 'Electron web security is disabled');
  rejectMatch(file, /disable-web-security/i, 'Electron web security is disabled by command-line switch');
  rejectMatch(file, /allow-file-access-from-files/i, 'Electron file access is broadened by command-line switch');
  requireMatch(file, /contextIsolation\s*:\s*true/i, 'Electron context isolation must remain enabled');
  requireMatch(file, /nodeIntegration\s*:\s*false/i, 'Electron Node integration must remain disabled');
  requireMatch(file, /sandbox\s*:\s*true/i, 'Electron renderer sandbox must remain enabled');
}

const auth = read('col-auth.js');
if (/localStorage\.setItem\(\s*['"]col_user['"]/.test(auth)) {
  failures.push('col-auth.js: live session identity is still written to localStorage');
}
if (/localStorage\.setItem\(\s*['"](?:col_active_local_user|traffic_local_user)['"]\s*,\s*JSON\.stringify\((?:fullAcc|storedUser|profileWithCredentials)\)/i.test(auth)) {
  failures.push('col-auth.js: a local profile write uses an unsanitized credential-bearing object');
}
rejectMatch('Traffic/TrafficDashboard.html', /localStorage\.getItem\(\s*['"]col_user['"]/, 'TrafficDashboard must not use a cached session identity');

const qr = read('qr-dynamic.js');
requireMatch('qr-dynamic.js', /withoutPlaintextPassword/, 'QR storage must strip plaintext password fields');
rejectMatch('qr-dynamic.js', /hashPassword\s*:\s*function/, 'weak legacy QR password hashing is still present');
requireMatch('qr-dynamic.js', /PBKDF2/, 'QR password verifiers must use PBKDF2');
requireMatch('q.html', /checkPassword\(code, val\)/, 'QR password verification must use the secure verifier');
rejectMatch('q.html', /entry\.password\b/, 'QR pages must not read a plaintext password field');

// The repository's CodeQL analysis is configured in the GitHub code-scanning
// settings, which consume `.github/codeql/codeql-config.yml`. Do not add a
// second CodeQL workflow: two analyses uploading the same language category for
// one ref make the analyze step fail.
if (fs.existsSync(path.join(root, '.github/workflows/codeql.yml'))) {
  failures.push('.github/workflows/codeql.yml: a duplicate CodeQL workflow conflicts with the repository code-scanning setup');
}

const codeqlConfig = read('.github/codeql/codeql-config.yml');
if (codeqlConfig) {
  for (const pattern of ['.agents/**', 'Traffic/.agents/**', 'dist/**', 'Traffic/Models/**']) {
    if (!codeqlConfig.includes(pattern)) {failures.push(`.github/codeql/codeql-config.yml: missing exclusion ${pattern}`);}
  }
}

if (!fs.existsSync(path.join(root, 'SECURITY.md'))) {
  if (optional.has('SECURITY.md')) {
    if (!skipped.includes('SECURITY.md')) {skipped.push('SECURITY.md');}
  } else {
    failures.push('SECURITY.md is missing');
  }
}

if (failures.length) {
  console.error('Security regression check failed:');
  for (const failure of failures) {console.error(` - ${failure}`);}
  process.exit(1);
}

console.log(`Security regression check passed (${checked.length} source files).`);
if (skipped.length) {console.log(`Skipped ${skipped.length} file(s) excluded from the deploy source upload: ${skipped.join(', ')}`);}
