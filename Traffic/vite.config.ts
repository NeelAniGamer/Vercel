import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron';

  return {
    base: isElectron ? './' : '/',
    build: {
      outDir: isElectron ? 'dist' : 'dist-web',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    server: {
      port: 5173,
      open: false
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@engine': resolve(__dirname, 'src/engine'),
        '@systems': resolve(__dirname, 'src/systems'),
        '@game': resolve(__dirname, 'src/game'),
        '@ui': resolve(__dirname, 'src/ui'),
        '@state': resolve(__dirname, 'src/state'),
        '@shaders': resolve(__dirname, 'src/shaders'),
        '@materials': resolve(__dirname, 'src/materials')
      }
    },
    optimizeDeps: {
      exclude: ['@dimforge/rapier3d-compat']
    }
  };
});
