import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron';

  return {
    base: isElectron ? './' : '/',
    build: {
      outDir: isElectron ? 'dist' : 'dist-web',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: resolve(rootDir, 'index.html')
        }
      }
    },
    server: {
      port: 5173,
      open: false
    },
    resolve: {
      alias: {
        '@': resolve(rootDir, 'src'),
        '@engine': resolve(rootDir, 'src/engine'),
        '@systems': resolve(rootDir, 'src/systems'),
        '@game': resolve(rootDir, 'src/game'),
        '@ui': resolve(rootDir, 'src/ui'),
        '@state': resolve(rootDir, 'src/state'),
        '@shaders': resolve(rootDir, 'src/shaders'),
        '@materials': resolve(rootDir, 'src/materials')
      }
    },
    optimizeDeps: {
      exclude: ['@dimforge/rapier3d-compat']
    }
  };
});
