import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_STATE = path.join(__dirname, '.auth/user.json');

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
    // PROJECT SETUP: Chạy trước để lấy Token ---
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/, 
    },

    // PROJECT TESTING CHÍNH: Dùng Token đã lấy ---
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      testIgnore: ['**/login.spec.ts', '**/register.spec.ts'],
      dependencies: ['setup'],
    },

    // PROJECT TESTING AUTH UI: Không dùng Token, để test flow login/register ---
    {
      name: 'auth-ui',
      testMatch: /.*(login|register)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
});