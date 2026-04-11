import { test, expect } from '@playwright/test';

test.describe('Kiểm thử trang Đăng nhập', () => {
  
  test.beforeEach(async ({ page }) => {
    // Đi tới trang login dựa trên URL trong ảnh của bạn
    await page.goto('http://localhost:5173/login');
  });

  test('Hiển thị đầy đủ các thành phần giao diện', async ({ page }) => {
    // 1. Kiểm tra tiêu đề chính
    await expect(page.getByText('InterviewDojo', { exact: true })).toBeVisible();
    await expect(page.getByText('Chào mừng bạn trở lại!')).toBeVisible();

    // 2. Kiểm tra ô nhập Email và Mật khẩu
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('........')).toBeVisible();

    // 3. Kiểm tra nút Đăng nhập
    const loginButton = page.getByRole('button', { name: /Đăng nhập ngay/i });
    await expect(loginButton).toBeVisible();
  });

  test('Thông báo lỗi khi để trống thông tin', async ({ page }) => {
    // Nhấn đăng nhập ngay mà không điền gì
    await page.click('button[type="submit"]');
    
    // Kiểm tra xem có hiển thị thông báo lỗi nào không (tùy vào code của bạn)
    // Ví dụ: await expect(page.getByText('Vui lòng nhập email')).toBeVisible();
  });
});