import { test as setup } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';

setup('Thực hiện đăng nhập để lấy session', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('name@example.com').fill('thanhtest@gmail.com');
  await page.getByPlaceholder('••••••••').fill('123456');
  await page.getByRole('button', { name: /Log In/i }).click();

  await page.waitForURL(/(candidate\/setup|localhost:5173\/?$)/, { timeout: 10000 });

  await page.context().storageState({ path: STORAGE_STATE });
});
