import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3035;
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  timeout: 30000,
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: BASE,
    reuseExistingServer: true,
    timeout: 30000,
    cwd: '.',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(PORT),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});