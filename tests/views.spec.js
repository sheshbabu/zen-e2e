import { test, expect } from '@playwright/test';
import path from 'path';
import { unique, createNote, getNote } from '../helpers/api.js';
import { gotoPage, openNote, startEditing, saveNote, contentField, iconButton, noteLink, button, modalButton } from '../helpers/ui.js';

const imagePath = path.join(import.meta.dirname, '../fixtures/square.png');

test.describe('List, card and gallery views', () => {
  test('card view opens a note in a modal and is remembered', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Card note'), content: 'shown on a card' });
    await gotoPage(page, '/notes/');

    await iconButton(page, 'Card View').click();
    // Card view collapses the editor panel without display: none, so the card is the first of two matches.
    await button(page, note.title).first().click();
    await expect(modalButton(page, 'Edit')).toBeVisible();

    await page.reload();
    await expect(button(page, note.title).first()).toBeVisible();
    await expect(noteLink(page, note.title)).toHaveCount(0);

    await iconButton(page, 'List View').click();
    await expect(noteLink(page, note.title)).toBeVisible();
  });

  test('an uploaded image is embedded in the note and shown in the gallery', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('With image'), content: 'Photo below' });
    await openNote(page, note.id);

    await startEditing(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Click to upload or drag and drop images').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(imagePath);
    await expect(contentField(page)).toHaveValue(/!\[\]\(\/images\/\d+\.png\)/);
    await saveNote(page);

    const content = (await getNote(request, note.id)).content;
    const imageUrl = content.match(/\/images\/\d+\.png/)[0];
    await expect(page.locator(`img[src="${imageUrl}"]`)).toBeVisible();

    await iconButton(page, 'Gallery View').click();
    const visibleImages = page.locator(`img[src$="${imageUrl}"]`).filter({ visible: true });
    await expect(visibleImages).toHaveCount(1);
    // The lightbox shows the same image on top of the gallery.
    await visibleImages.click();
    await expect(visibleImages).toHaveCount(2);
  });
});
