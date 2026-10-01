import { test, expect } from '@playwright/test';
import { unique, createNote, updateNote, getNote } from '../helpers/api.js';
import { openNote, clickEditorMenuItem, versionRows, toast, button } from '../helpers/ui.js';

test.describe('Version history', () => {
  test('restore an earlier version of a note', async ({ page, request }) => {
    const title = unique('Versioned');
    const note = await createNote(request, { title: title, content: 'first version' });
    // The first update snapshots the text it replaces.
    await updateNote(request, note.id, { title: title, content: 'second version' });
    await openNote(page, note.id);

    await clickEditorMenuItem(page, 'Versions');
    await expect(page.getByText('Version history')).toBeVisible();
    await expect(page.getByText('Current version')).toBeVisible();
    await expect(button(page, 'Restore')).toHaveAttribute('disabled');

    await versionRows(page).nth(1).click();
    await expect(page.getByText('first version')).toBeVisible();
    await button(page, 'Restore').click();

    await expect(toast(page, 'Note restored.')).toBeVisible();
    await expect(page.getByText('first version')).toBeVisible();
    expect((await getNote(request, note.id)).content).toBe('first version');
  });

  test('a note that was never edited has no versions', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Unedited'), content: 'only version' });
    await openNote(page, note.id);

    await clickEditorMenuItem(page, 'Versions');
    await expect(page.getByText('No versions')).toBeVisible();
  });
});
