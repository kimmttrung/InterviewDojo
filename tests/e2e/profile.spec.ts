import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/ProfilePage';
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

test.describe('Tính năng Cập nhật thông tin (Edit Profile)', () => {
    let profilePage: ProfilePage;
    const userEmail = 'thanhtest@gmail.com'; 

    test.beforeEach(async ({ page }) => {
        profilePage = new ProfilePage(page);
        await profilePage.goto();
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

    test('1. Kiểm tra giao diện trang Profile hiển thị đầy đủ các thành phần', async ({ page }) => {
        console.log('Đang kiểm tra các thành phần UI trên trang Profile...');
        await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible();
        await expect(page.getByText('CANDIDATE')).toBeVisible();
        
        const careerJourneyCard = page.locator('text=Career Journey');
        await expect(careerJourneyCard).toBeVisible();
        
        const technicalMasteryCard = page.locator('text=Technical Mastery');
        await expect(technicalMasteryCard).toBeVisible();
        console.log('Giao diện hiển thị đầy đủ và chính xác!');
    });

    test('2. Cập nhật toàn bộ form thông tin Profile và kiểm tra trong Database', async ({ page }) => {
        const testData = {
            name: `thanh ${Math.floor(Math.random() * 100)}`, 
            bio: 'a person who study AI Engineer',
            role: 'AI Engineer',
            exp: '1'
        };

        console.log('Bước 1: Click nút Edit Profile để mở Modal...');
        await profilePage.openEditModal();

        console.log(`Bước 2: Điền đầy đủ thông tin vào Form...`);
        await profilePage.fillProfileForm(testData.name, testData.bio, testData.role, testData.exp);

        console.log('Bước 3: Click Save Changes và đợi Modal đóng...');
        await profilePage.saveChanges();
        
        await page.waitForTimeout(1000); 
        
        console.log('Bước 4: Kiểm tra UI bên ngoài hiển thị đúng dữ liệu mới...');
        await expect(page.getByText(testData.name).first()).toBeVisible();
        await expect(page.getByText(testData.bio)).toBeVisible();
        await expect(page.getByText(testData.role, { exact: true })).toBeVisible();
        
        console.log(`Bước 5: Đang kiểm tra Database cho email: ${userEmail}...`);
        const userInDb = await prisma.user.findUnique({
            where: { email: userEmail }
        });
        
        expect(userInDb).not.toBeNull();
        expect(userInDb?.name).toBe(testData.name);

        console.log("Hoàn tất! Giao diện và Database đều được cập nhật chính xác.");
    });
});