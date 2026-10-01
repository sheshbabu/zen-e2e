import { test, expect } from '@playwright/test';
import { unique, createNote } from '../helpers/api.js';
import { gotoPage, noteLink, writeNote, saveNote, iconButton, sidebarLink } from '../helpers/ui.js';

// Runs in the mobile project, where the viewport is below zen's 948px breakpoint.
test.describe('Mobile', () => {
  test('opening a note replaces the list, and back returns to it', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Mobile note'), content: 'read on a phone' });
    await gotoPage(page, '/notes/');

    await noteLink(page, note.title).click();
    await expect(page.getByText('read on a phone')).toBeVisible();
    await expect(noteLink(page, note.title)).toBeHidden();

    await page.goBack();
    await expect(noteLink(page, note.title)).toBeVisible();
    await expect(page.getByText('read on a phone')).toBeHidden();
  });

  test('create a note from the bottom navbar', async ({ page }) => {
    const title = unique('Written on mobile');
    await gotoPage(page, '/notes/');

    // The closed sidebar is moved off-screen, not hidden, so its New link still matches; the navbar's comes last.
    await sidebarLink(page, 'New').last().click();
    await writeNote(page, { title: title, content: 'typed on a phone' });
    await saveNote(page);

    await expect(page.getByText('typed on a phone')).toBeVisible();
    await sidebarLink(page, 'Notes').last().click();
    await expect(noteLink(page, title)).toBeVisible();
  });

  // Saving a new note pushes /notes/{id} on top of /notes/new instead of replacing it.
  // Back then reopens an empty new-note editor. Remove test.fail once zen fixes it.
  test('back after creating a note returns to the list', async ({ page }) => {
    test.fail();
    const title = unique('Back after create');
    await gotoPage(page, '/notes/');

    await sidebarLink(page, 'New').last().click();
    await writeNote(page, { title: title, content: 'then go back' });
    await saveNote(page);
    await page.goBack();

    await expect(noteLink(page, title)).toBeVisible({ timeout: 2000 });
  });

  test('the hamburger opens the sidebar', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await expect(sidebarLink(page, 'Archives')).not.toBeInViewport();

    await iconButton(page, 'Toggle Sidebar').click();
    await expect(sidebarLink(page, 'Archives')).toBeInViewport();
    await sidebarLink(page, 'Archives').click();

    await expect(page).toHaveURL(/isArchived=true/);
    await expect(page.getByText('Archived', { exact: true })).toBeVisible();
  });
});
