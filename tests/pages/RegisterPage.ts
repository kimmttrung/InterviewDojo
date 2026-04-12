import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly candidateRoleBtn: Locator;
  readonly mentorRoleBtn: Locator;
  readonly submitBtn: Locator;
  readonly backBtn: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // CẬP NHẬT THEO CODEGEN: Sử dụng getByRole chuẩn xác 100% với Frontend
    this.nameInput = page.getByRole('textbox', { name: 'Name' });
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm Password' });
    
    this.candidateRoleBtn = page.getByRole('button', { name: 'CANDIDATE' });
    this.mentorRoleBtn = page.getByRole('button', { name: 'MENTOR' });
    
    // Các nút bấm mặc định
    this.submitBtn = page.getByRole('button', { name: 'Register Now' });
    this.backBtn = page.locator('text=Back'); 
    this.loginLink = page.locator('text=Login here');
  }

  async goto() {
    await this.page.goto('/register');
  }

  // Hàm điền form đã được tối ưu, mô phỏng giống người dùng thật (click rồi mới fill)
  async fillForm(name: string, email: string, pass: string, confirmPass: string) {
    if (name) {
      await this.nameInput.click();
      await this.nameInput.fill(name);
    }
    if (email) {
      await this.emailInput.click();
      await this.emailInput.fill(email);
    }
    if (pass) {
      await this.passwordInput.click();
      await this.passwordInput.fill(pass);
    }
    if (confirmPass) {
      await this.confirmPasswordInput.click();
      await this.confirmPasswordInput.fill(confirmPass);
    }
  }
}