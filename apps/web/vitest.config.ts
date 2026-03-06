import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/__tests__/**/*.test.ts'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      watchExclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    },
  }),
);
