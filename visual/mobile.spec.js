import { test, expect } from './fixtures.js';
import { gotoPage, openNote, iconButton, sidebarLink } from '../helpers/ui.js';

// Note ids match visual/seed.sql.
const WEEKLY_PLANNING = 1;

test.describe('Mobile', () => {
  test('notes list', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await expect(page).toHaveScreenshot('list.png');
  });

  test('a note', async ({ page }) => {
    await openNote(page, WEEKLY_PLANNING);
    await expect(page).toHaveScreenshot('note.png');
  });

  test('the sidebar', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await iconButton(page, 'Toggle Sidebar').click();
    await expect(sidebarLink(page, 'Archives')).toBeInViewport();
    await expect(page).toHaveScreenshot('sidebar.png');
  });
});
