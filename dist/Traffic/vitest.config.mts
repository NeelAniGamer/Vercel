import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    // The physics engine is deliberately independent of the game runtime, so
    // its tests are too. Keeping them in-tree means they ship with the repo
    // and run in CI without a separate package.
    include: ['src/physics/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    reporters: 'verbose',
    coverage: {
      provider: 'v8',
      include: ['src/physics/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@physics': resolve(rootDir, 'src/physics'),
    },
  },
});