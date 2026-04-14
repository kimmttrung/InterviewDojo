import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
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

test.describe('Tính năng Đăng ký tài khoản (Register)', () => {
    let registerPage: RegisterPage;

    test.beforeAll(async () => {
        try {
            await prisma.user.upsert({
                where: { email: 'datontai@example.com' },
                update: { name: 'User Đã Tồn Tại' },
                create: {
                    email: 'datontai@example.com',
                    password: 'hashed_password_123',
                    name: 'User Đã Tồn Tại'
                }
            });
            console.log("Seed dữ liệu thành công!");
        } catch (err) {
            console.error("=== LỖI PRISMA CHI TIẾT ===");
            console.error(err);
            throw err;
        }
    });

    test.beforeEach(async ({ page }) => {
        registerPage = new RegisterPage(page);
        await registerPage.goto();
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

    test('1. Đăng ký thành công với thông tin đầy đủ', async ({ page }) => {
        const newEmail = `candidate_${Date.now()}@test.com`;
        await registerPage.fillForm('Bùi Trung Thanh', newEmail, 'Password123!', 'Password123!');
        await registerPage.mentorRoleBtn.click();
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/api/v1/auth/register') && [200, 201].includes(response.status())
        );
        await registerPage.submitBtn.click();
        await responsePromise;

        console.log("Đang đợi hệ thống xử lý và chuyển hướng (khoảng 15s)...");
        await page.waitForURL(/.*login/, { timeout: 10000 });

        expect(page.url()).toContain('login');
        console.log("Đã chuyển hướng sang trang Login thành công!");
        const userInDb = await prisma.user.findUnique({
            where: { email: newEmail }
        });

        expect(userInDb).not.toBeNull();
        expect(userInDb?.name).toBe('Bùi Trung Thanh');
        console.log("Dữ liệu đã được ghi nhận chính xác trong Database.");
    });

    test('2. Báo lỗi khi email đã tồn tại trong hệ thống', async ({ page }) => {
        await registerPage.fillForm('Nguyễn Văn A', 'datontai@example.com', '12345678', '12345678');
        await registerPage.submitBtn.click();

        const errorMessage = page.locator('text=Register failed');
        await expect(errorMessage).toBeVisible();
    });

    test('3. Không cho phép submit khi thiếu các trường bắt buộc', async ({ page }) => {
        await registerPage.fillForm('Thanh', '', '', '');
        await registerPage.submitBtn.click();

        const emailValidity = await registerPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
        expect(emailValidity).toBeTruthy();
    });

    // test('4. Nút Quay lại hoạt động đúng', async ({ page }) => {
    //     await registerPage.backBtn.click();
    //     await expect(page).toHaveURL('http://localhost:5173/login');
    // });

    test('4. Cảnh báo khi mật khẩu quá ngắn (< 6 ký tự)', async ({ page }) => {
        await registerPage.fillForm('Thanh', 'test@test.com', '123', '123');
        await registerPage.submitBtn.click();

        const lengthError = page.locator('text=Register failed');
        await expect(lengthError).toBeVisible();
    });
});