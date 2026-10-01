import { test, expect } from '@playwright/test';
import { unique, createNote, getNote } from '../helpers/api.js';
import { gotoPage, noteLink, toast, button, modalButton } from '../helpers/ui.js';

async function selectNotes(page, notes) {
  await noteLink(page, notes[0].title).click({ modifiers: ['ControlOrMeta'] });
  for (const note of notes.slice(1)) {
    await page.getByText(note.title, { exact: true }).click();
  }
  await expect(page.getByText(`${notes.length} notes selected`).first()).toBeVisible();
}

test.describe('Bulk actions', () => {
  test('archive several notes at once', async ({ page, request }) => {
    const notes = [await createNote(request, { title: unique('Bulk archive A') }), await createNote(request, { title: unique('Bulk archive B') })];
    await gotoPage(page, '/notes/');

    await selectNotes(page, notes);
    await button(page, 'Archive').click();

    await expect(toast(page, '2 notes archived')).toBeVisible();
    for (const note of notes) {
      await expect(noteLink(page, note.title)).toHaveCount(0);
      expect((await getNote(request, note.id)).isArchived).toBe(true);
    }
  });

  test('delete several notes at once', async ({ page, request }) => {
    const notes = [await createNote(request, { title: unique('Bulk delete A') }), await createNote(request, { title: unique('Bulk delete B') })];
    await gotoPage(page, '/notes/');

    await selectNotes(page, notes);
    await button(page, 'Delete').click();
    await expect(page.getByText('Delete 2 notes')).toBeVisible();
    await modalButton(page, 'Delete').click();

    await expect(toast(page, '2 notes moved to trash')).toBeVisible();
    for (const note of notes) {
      await expect(noteLink(page, note.title)).toHaveCount(0);
      expect((await getNote(request, note.id)).isDeleted).toBe(true);
    }
  });

  test('cancel leaves selection mode without changes', async ({ page, request }) => {
    const notes = [await createNote(request, { title: unique('Bulk cancel A') }), await createNote(request, { title: unique('Bulk cancel B') })];
    await gotoPage(page, '/notes/');

    await selectNotes(page, notes);
    await button(page, 'Cancel').click();

    await expect(page.getByText('2 notes selected')).toHaveCount(0);
    for (const note of notes) {
      await expect(noteLink(page, note.title)).toBeVisible();
    }
  });
});
