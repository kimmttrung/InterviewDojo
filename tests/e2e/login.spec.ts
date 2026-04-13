import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PrismaClient } from '../../backend/node_modules/@prisma/client/index.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';

const backendEnvPath = path.resolve(process.cwd(), 'backend/.env');

dotenv.config({ path: backendEnvPath });

if (!process.env.DATABASE_URL) {
    console.error("LOG: FILE ENV TAI PATH:", backendEnvPath);
    throw new Error("DATABASE_URL NOT FOUND IN BACKEND/.ENV");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Kịch bản kiểm thử Đăng nhập', () => {
  let loginPage: LoginPage;
  const testUser = {
    email: 'thanhtest@gmail.com',
    password: '123456',
    name: 'test'
  };

  test.beforeAll(async () => {
    try {
      await prisma.user.upsert({
        where: { email: testUser.email },
        update: { name: testUser.name },
        create: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name
        }
      });
      console.log("SEED DATA SUCCESS");
    } catch (err) {
      console.error("PRISMA CONNECTION ERROR");
      throw err;
    }
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.afterAll(async () => {
    try {
      await prisma.$disconnect();
      await pool.end();
      console.log("DATABASE CONNECTION CLOSED SUCCESSFULLY");
    } catch (err) {
      console.error("ERROR CLOSING CONNECTION");
    }
  });

  test('1. Đăng nhập thành công với tài khoản vừa tạo', async ({ page }) => {
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/v1/auth/login') && response.status() === 201
    );

    await loginPage.login(testUser.email, testUser.password);
    await responsePromise;

    await page.waitForURL(/(candidate\/setup|localhost:5173\/?$)/, { timeout: 10000 });
    console.log("TEST CASE 1 PASSED");
  });

  test('2. Đăng nhập thất bại khi sai mật khẩu', async ({ page }) => {
    await loginPage.login(testUser.email, 'WrongPass123');

    const errorMsg = page.locator('text=Something went wrong');
    await expect(errorMsg).toBeVisible();
    console.log("TEST CASE 2 PASSED");
  });

  test('3. Đăng nhập thất bại khi email không tồn tại', async ({ page }) => {
    await loginPage.login('notfound@example.com', 'AnyPassword123');

    const errorMsg = page.locator('text=Something went wrong');
    await expect(errorMsg).toBeVisible();
    console.log("TEST CASE 3 PASSED");
  });

  test('4. Kiểm tra validate khi để trống email', async ({ page }) => {
    await loginPage.login('', testUser.password);

    const isEmailMissing = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(isEmailMissing).toBeTruthy();
    console.log("TEST CASE 4 PASSED");
  });

  test('5. Kiểm tra validate khi để trống mật khẩu', async ({ page }) => {
    await loginPage.login(testUser.email, '');

    const isPasswordMissing = await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(isPasswordMissing).toBeTruthy();
    console.log("TEST CASE 5 PASSED");
  });

  test('6. Kiểm tra validate khi email sai định dạng', async ({ page }) => {
    await loginPage.login('invalid-email-type', 'Password123');

    const isEmailInvalid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
    expect(isEmailInvalid).toBeTruthy();
    console.log("TEST CASE 6 PASSED");
  });
});