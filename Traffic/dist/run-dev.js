/**
 * Dev runner: starts Vite dev server, waits until it responds,
 * then launches Electron. Ctrl+C kills both.
 */
const { spawn } = require('child_process');
const http = require('http');

const PORT = 5173;
const URL = `http://localhost:${PORT}`;

function waitForServer(url, retries = 60) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = http.get(url, () => resolve());
      req.on('error', () => {
        if (n <= 0) return reject(new Error('Vite did not start'));
        setTimeout(() => attempt(n - 1), 500);
      });
    };
    attempt(retries);
  });
}

async function main() {
  console.log('[dev] Starting Vite...');
  const vite = spawn('npx', ['vite', '--mode', 'electron'], {
    shell: true,
    stdio: 'inherit'
  });

  try {
    await waitForServer(URL);
  } catch (e) {
    console.error('[dev]', e.message);
    vite.kill();
    process.exit(1);
  }

  console.log('[dev] Vite ready — launching Electron...');
  const electron = spawn('npx', ['electron', '.'], {
    shell: true,
    stdio: 'inherit'
  });

  electron.on('exit', () => {
    vite.kill();
    process.exit(0);
  });

  const cleanup = () => {
    vite.kill();
    electron.kill();
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main();