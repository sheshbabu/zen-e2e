import { test, expect } from './fixtures.js';
import { gotoPage, openNote, startEditing, openSearch, openSettings, openTagSettings, iconButton, button, focusSwitcher, listItem, clickEditIcon, searchResult, sidebarTag, waitForAnimations } from '../helpers/ui.js';

// Note ids match visual/seed.sql.
const WEEKLY_PLANNING = 1;
const SOURDOUGH = 3;
const KYOTO = 4;
const GO_ERRORS = 5;

test.describe('Desktop', () => {
  test('a note with tasks and highlights', async ({ page }) => {
    await openNote(page, WEEKLY_PLANNING);
    await expect(page).toHaveScreenshot('note.png');
  });

  test('a note with a table', async ({ page }) => {
    await openNote(page, SOURDOUGH);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page).toHaveScreenshot('note-table.png');
  });

  test('a note with an image', async ({ page }) => {
    await openNote(page, KYOTO);
    await expect(page.locator('img[src="/images/kyoto.png"]')).toBeVisible();
    await expect(page).toHaveScreenshot('note-image.png');
  });

  test('a note with a code block', async ({ page }) => {
    await openNote(page, GO_ERRORS);
    await expect(page).toHaveScreenshot('note-code.png');
  });

  test('editing a note', async ({ page }) => {
    await openNote(page, WEEKLY_PLANNING);
    await startEditing(page);
    await expect(page).toHaveScreenshot('note-editing.png');
  });

  test('card view', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await iconButton(page, 'Card View').click();
    await expect(page).toHaveScreenshot('card-view.png');
  });

  test('gallery view', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await iconButton(page, 'Gallery View').click();
    await expect(page.locator('img[src$="kyoto.png"]').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveScreenshot('gallery-view.png');
  });

  test('archives', async ({ page }) => {
    await gotoPage(page, '/notes/?isArchived=true');
    await expect(page).toHaveScreenshot('archives.png');
  });

  test('trash', async ({ page }) => {
    await gotoPage(page, '/notes/?isDeleted=true');
    await expect(page).toHaveScreenshot('trash.png');
  });

  test('a focus mode', async ({ page }) => {
    // Loading /notes/?focusId=1 directly races zen's unscoped tag fetch against the focus one, so switch from the list instead.
    await gotoPage(page, '/notes/');
    await focusSwitcher(page).click();
    await listItem(page, 'Work').click();
    await expect(focusSwitcher(page)).toHaveText('Work');
    await expect(sidebarTag(page, 'reading')).toHaveCount(0);
    await expect(page).toHaveScreenshot('focus.png');
  });

  test('search with results', async ({ page }) => {
    await gotoPage(page, '/notes/');
    const input = await openSearch(page);
    // zen centres the first match using positions measured while the modal is still sliding in.
    await waitForAnimations(page);
    await input.fill('flour');
    await expect(searchResult(page, 'Sourdough recipe')).toBeVisible();
    await expect(page).toHaveScreenshot('search.png');
  });

  test('settings', async ({ page }) => {
    await gotoPage(page, '/notes/');
    for (const pane of ['Appearance', 'Editor', 'API Tokens', 'Security']) {
      await openSettings(page, pane);
      await expect(page).toHaveScreenshot(`settings-${pane.toLowerCase().replace(' ', '-')}.png`);
      await page.keyboard.press('Escape');
    }
  });

  test('edit focus', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await focusSwitcher(page).click();
    await clickEditIcon(listItem(page, 'Work'));
    await expect(page.getByText('Edit Focus')).toBeVisible();
    await expect(page).toHaveScreenshot('edit-focus.png');
  });

  test('manage tag', async ({ page }) => {
    await gotoPage(page, '/notes/');
    await openTagSettings(page, 'work');
    await expect(page).toHaveScreenshot('manage-tag.png');
  });

  test('new note', async ({ page }) => {
    await gotoPage(page, '/notes/new');
    await expect(button(page, 'Save')).toBeVisible();
    await expect(page).toHaveScreenshot('new-note.png');
  });
});
