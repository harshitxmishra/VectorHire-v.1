import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..'),
      '@src': path.resolve(__dirname, 'src'),
    },
  },
});
