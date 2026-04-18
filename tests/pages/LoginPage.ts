import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('name@example.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.loginBtn = page.getByRole('button', { name: /Log In/i });
  }

  async goto() {
    await this.page.goto('http://localhost:5173/login');
  }

  async login(email: string, pass: string) {
    if (email) {
      await this.emailInput.click();
      await this.emailInput.fill(email);
    }
    if (pass) {
      await this.passwordInput.click();
      await this.passwordInput.fill(pass);
    }
    await this.loginBtn.click();
  }
}
