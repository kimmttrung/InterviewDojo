import { Page, Locator, expect } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly editProfileBtn: Locator;
  readonly fullNameInput: Locator;
  readonly bioInput: Locator;
  readonly targetRoleSelect: Locator;
  readonly experienceInput: Locator;
  readonly saveChangesBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.editProfileBtn = page.getByRole('button', { name: 'Edit Profile' });

    this.fullNameInput = page.getByRole('textbox').first();
    this.bioInput = page.locator('textarea');
    this.targetRoleSelect = page.getByRole('combobox');
    this.experienceInput = page.getByRole('spinbutton');

    this.saveChangesBtn = page.getByRole('button', { name: 'Save Changes' });
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async openEditModal() {
    await this.editProfileBtn.click();
    await expect(this.saveChangesBtn).toBeVisible();
  }

  async fillProfileForm(name: string, bio: string, targetRole: string, experience: string) {
    await this.fullNameInput.fill(name);

    await this.bioInput.fill(bio);

    await this.targetRoleSelect.click();
    await this.page.getByRole('option', { name: targetRole }).click();

    await this.experienceInput.fill(experience);
  }

  async saveChanges() {
    await this.saveChangesBtn.click();
    await expect(this.saveChangesBtn).toBeHidden();
  }
}
