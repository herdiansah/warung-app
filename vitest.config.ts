import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    setupFiles: ['./tests/api/setup.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**']
  }
});
