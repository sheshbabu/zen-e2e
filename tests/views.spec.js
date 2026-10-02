import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { unique, createNote, getNote } from '../helpers/api.js';
import { gotoPage, openNote, startEditing, saveNote, contentField, iconButton, noteLink, button, modalButton } from '../helpers/ui.js';

const imagePath = path.join(import.meta.dirname, '../fixtures/square.png');

// Builds a DataTransfer holding the fixture image, as a paste or a drop from the desktop would carry it.
async function imageDataTransfer(page) {
  const base64 = fs.readFileSync(imagePath).toString('base64');
  return page.evaluateHandle(async (data) => {
    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], 'square.png', { type: 'image/png' }));
    return dataTransfer;
  }, base64);
}

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

  test('pasting an image uploads it and inserts its markdown', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Pasted image'), content: '' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).click();
    const dataTransfer = await imageDataTransfer(page);
    await contentField(page).evaluate((field, clipboardData) => {
      field.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboardData, bubbles: true, cancelable: true }));
    }, dataTransfer);

    await expect(contentField(page)).toHaveValue(/^!\[\]\(\/images\/\d+\.png\)$/);
  });

  test('dropping an image on the dropzone uploads it and inserts its markdown', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Dropped image'), content: '' });
    await openNote(page, note.id);

    await startEditing(page);
    const dataTransfer = await imageDataTransfer(page);
    await page.getByText('Click to upload or drag and drop images').dispatchEvent('drop', { dataTransfer: dataTransfer });

    await expect(contentField(page)).toHaveValue(/^!\[\]\(\/images\/\d+\.png\)$/);
  });
});
