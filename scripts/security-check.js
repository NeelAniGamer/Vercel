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

// No objective may be able to hang forever. Two separate guarantees:
//   1. Every objective a level declares has a real engine branch. A target
//      with no branch used to be auto-completed after 3 seconds, which handed
//      the player credit for something they never did.
//   2. If a future level introduces a target with no branch, the bounded
//      guard still fires so the level cannot softlock, and it logs loudly.
requireMatch('Traffic/game_core.js', /_isUnhandledTaskTarget\(t\)/, 'task completion must guard against targets the engine cannot resolve');
requireMatch('Traffic/game_core.js', /UNHANDLED_TASK_DWELL_FRAMES/, 'the unhandled-objective guard must have a bounded dwell');
requireMatch('Traffic/Driving.html', /unhandled-task-targets\.js/, 'Driving.html must load the generated unhandled-objective list');
requireMatch('Traffic/Driving.html', /task-evaluators\.js/, 'Driving.html must load the objective evaluators');
requireMatch('Traffic/game_core.js', /COL_TASK_EVALUATORS/, 'the task loop must dispatch to the objective evaluators');

// The generated backlog must be empty. Regenerating it is cheap and is the
// only way to know the list matches the current engine, so do it here rather
// than trusting a committed file.
try {
  const { execFileSync } = require('child_process');
  const out = execFileSync(process.execPath, [path.join(root, 'Traffic/tools/gen-unhandled-task-targets.js')], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const m = out.match(/unhandled:\s*(\d+)/);
  const count = m ? parseInt(m[1], 10) : -1;
  if (count !== 0) {
    failures.push(`Traffic: ${count} declared objective(s) still have no engine branch. Run node Traffic/tools/gen-unhandled-task-targets.js and implement them in Traffic/task-evaluators.js.`);
  }
} catch (e) {
  failures.push(`Traffic: could not regenerate the unhandled-objective list: ${e.message}`);
}

// The level linter must agree. It is the check that catches a new level
// declaring a target nobody implemented.
try {
  const { execFileSync } = require('child_process');
  execFileSync(process.execPath, [path.join(root, 'Traffic/tools/validate-levels.js')], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  const out = (e.stdout || '') + (e.stderr || '');
  const summary = (out.match(/(\d+) levels checked: (\d+) error\(s\)/) || []).slice(1).join(' errors, ');
  failures.push(`Traffic: level linter reports errors (${summary || 'see node Traffic/tools/validate-levels.js'}). A level task with no engine branch never completes.`);
}

if (failures.length) {
  console.error('Security regression check failed:');
  for (const failure of failures) {console.error(` - ${failure}`);}
  process.exit(1);
}

console.log(`Security regression check passed (${checked.length} source files).`);
if (skipped.length) {console.log(`Skipped ${skipped.length} file(s) excluded from the deploy source upload: ${skipped.join(', ')}`);}
