import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [['list']],
  globalSetup: './tests/browser/setup.js',
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'msedge',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
