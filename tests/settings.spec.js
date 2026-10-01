import { test, expect } from '@playwright/test';
import { unique, createNote, getNote } from '../helpers/api.js';
import { user } from '../helpers/user.js';
import { gotoPage, openSettings, openNote, startEditing, contentField, modalButton, toast, button, settingsToggle } from '../helpers/ui.js';

async function login(page, email, password) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function changePassword(page, current, next, confirm = next) {
  await page.getByLabel('Current Password').fill(current);
  await page.getByLabel('New Password', { exact: true }).fill(next);
  await page.getByLabel('Confirm New Password').fill(confirm);
  await page.getByRole('button', { name: 'Update Password' }).click();
}

test.describe('Login and logout', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('wrong email and wrong password show errors', async ({ page }) => {
    await login(page, 'nobody@example.com', user.password);
    await expect(page.getByText('Incorrect email address')).toBeVisible();

    await login(page, user.email, 'not-the-password');
    await expect(page.getByText('Incorrect password')).toBeVisible();
  });

  test('log in, then log out from settings', async ({ page }) => {
    await login(page, user.email, user.password);
    await expect(button(page, 'Settings')).toBeVisible();

    await openSettings(page, 'Security');
    await page.getByText('Log out', { exact: true }).click();

    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    const response = await page.request.get('/api/v1/users/me');
    expect(response.status()).toBe(401);
  });
});

test.describe('Settings', () => {
  test('password change validates, then updates and reverts', async ({ page }) => {
    const newPassword = 'another-pass-456';
    await gotoPage(page, '/notes/');
    await openSettings(page, 'Security');

    await changePassword(page, user.password, newPassword, 'does-not-match');
    await expect(page.getByText('Passwords do not match')).toBeVisible();

    await changePassword(page, 'wrong-current', newPassword);
    await expect(page.getByText('Incorrect password')).toBeVisible();

    await changePassword(page, user.password, newPassword);
    await expect(toast(page, 'Password updated successfully')).toBeVisible();

    // Put the original back so the login tests keep working on the next run order.
    await changePassword(page, newPassword, user.password);
    await expect(toast(page, 'Password updated successfully')).toBeVisible();
  });

  test('dark theme applies and survives a reload', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await openSettings(page, 'Appearance');
    await page.getByText('Dark', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('auto save stores edits without pressing Save', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Auto saved'), content: 'before auto save' });
    await gotoPage(page, '/notes/');
    await openSettings(page, 'Editor');
    const autoSaveToggle = settingsToggle(page, 'Auto Save');
    await expect(autoSaveToggle).toHaveAttribute('aria-checked', 'false');
    await autoSaveToggle.click();
    await expect(autoSaveToggle).toHaveAttribute('aria-checked', 'true');

    await openNote(page, note.id);
    await startEditing(page);
    await contentField(page).fill('after auto save');

    await expect.poll(async () => (await getNote(request, note.id)).content, { timeout: 5000 }).toBe('after auto save');
  });
});
