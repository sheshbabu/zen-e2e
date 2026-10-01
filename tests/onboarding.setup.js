import { test as setup, expect } from '@playwright/test';
import { user } from '../helpers/user.js';

// The server starts on an empty database, so the first visit is onboarding. Every other spec reuses this session.
setup('onboard the admin account', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText("Let's get started!")).toBeVisible();
  await expect(page.getByText('Create your admin account')).toBeVisible();

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('No notes', { exact: true })).toBeVisible();
  await expect(page.getByText('Tags', { exact: true })).toHaveCount(0);

  await page.context().storageState({ path: '.auth/user.json' });
});
