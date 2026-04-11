import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', 
  fullyParallel: true,
  reporter: [
    ['line'], 
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  use: {
    baseURL: 'http://localhost:5173', 
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});