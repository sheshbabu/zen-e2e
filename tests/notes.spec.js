import { test, expect } from '@playwright/test';
import { unique, createNote, getNote } from '../helpers/api.js';
import { contentField, noteLink, toast, openNote, clickEditorMenuItem, writeNote, saveNote, sidebarLink, iconButton, gotoPage, startEditing, button, modalButton, taskCheckbox } from '../helpers/ui.js';

test.describe('Notes', () => {
  test('create a note from the sidebar', async ({ page }) => {
    const title = unique('Weekly Standup');
    await page.goto('/notes/');
    await sidebarLink(page, 'New').click();

    await writeNote(page, { title: title, content: '## Agenda\n\n- Sprint review\n- **Blockers**' });
    await saveNote(page);

    await expect(page).toHaveURL(/\/notes\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
    await expect(page.locator('strong', { hasText: 'Blockers' })).toBeVisible();
    await expect(noteLink(page, title)).toBeVisible();
  });

  test('Ctrl+N opens a new note and Ctrl+Enter saves it', async ({ page }) => {
    const title = unique('Shortcut note');
    await gotoPage(page, '/notes/');
    await page.keyboard.press('Control+n');
    await expect(page).toHaveURL(/\/notes\/new$/);

    await writeNote(page, { title: title, content: 'Saved from the keyboard' });
    await contentField(page).press('Control+Enter');

    await expect(page.getByText('Saved from the keyboard')).toBeVisible();
    await expect(noteLink(page, title)).toBeVisible();
  });

  test('cancel on a new note discards it', async ({ page }) => {
    const title = unique('Discarded');
    await page.goto('/notes/new');
    await writeNote(page, { title: title, content: 'never saved' });
    await button(page, 'Cancel').click();

    await expect(page).not.toHaveURL(/\/notes\/new$/);
    await expect(noteLink(page, title)).toHaveCount(0);
  });

  test('edit and save an existing note', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Editable'), content: 'first draft' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).fill('second draft');
    await saveNote(page);

    await expect(page.getByText('second draft')).toBeVisible();
    expect((await getNote(request, note.id)).content).toBe('second draft');
  });

  // Content state must sync on input, so a re-render mid-typing keeps the typed text.
  test('typing survives a re-render before blur', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Rerender'), content: 'before' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).fill('after');
    // Dragging over the dropzone sets state in the editor and re-renders it.
    await page.getByText('Click to upload or drag and drop images').dispatchEvent('dragover');

    await expect(contentField(page)).toHaveValue('after', { timeout: 2000 });
  });

  test('cancel on an existing note reverts the edits', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Revertable'), content: 'original text' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).fill('unsaved change');
    await button(page, 'Cancel').click();

    await expect(page.getByText('original text')).toBeVisible();
    expect((await getNote(request, note.id)).content).toBe('original text');
  });

  test('ticking a task in the rendered note saves it', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Tasks'), content: '- [ ] Book flights\n- [ ] Pack bags' });
    await openNote(page, note.id);

    await taskCheckbox(page, 'Book flights').click();

    await expect.poll(async () => (await getNote(request, note.id)).content).toBe('- [x] Book flights\n- [ ] Pack bags');
  });

  test('pin moves a note to the top of the list', async ({ page, request }) => {
    const older = await createNote(request, { title: unique('Pinned later') });
    const newer = await createNote(request, { title: unique('Newer note') });
    await openNote(page, older.id);

    await clickEditorMenuItem(page, 'Pin');
    await expect.poll(async () => (await getNote(request, older.id)).isPinned).toBe(true);

    await page.goto('/notes/');
    const olderBox = await noteLink(page, older.title).boundingBox();
    const newerBox = await noteLink(page, newer.title).boundingBox();
    expect(olderBox.y).toBeLessThan(newerBox.y);
  });

  test('archive moves a note to Archives and unarchive brings it back', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Archivable') });
    await openNote(page, note.id);

    await clickEditorMenuItem(page, 'Archive');
    await expect(toast(page, 'Note archived.')).toBeVisible();

    await page.goto('/notes/');
    await expect(noteLink(page, note.title)).toHaveCount(0);

    await sidebarLink(page, 'Archives').click();
    await noteLink(page, note.title).click();
    await clickEditorMenuItem(page, 'Unarchive');
    await expect(toast(page, 'Note unarchived.')).toBeVisible();

    await page.goto('/notes/');
    await expect(noteLink(page, note.title)).toBeVisible();
  });

  test('delete moves a note to Trash and restore brings it back', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Deletable') });
    await openNote(page, note.id);

    await clickEditorMenuItem(page, 'Delete');
    await expect(page.getByText('Delete Note')).toBeVisible();
    await modalButton(page, 'Delete').click();

    await expect(noteLink(page, note.title)).toHaveCount(0);
    expect((await getNote(request, note.id)).isDeleted).toBe(true);

    await sidebarLink(page, 'Trash').click();
    await noteLink(page, note.title).click();
    await clickEditorMenuItem(page, 'Restore');

    await expect.poll(async () => (await getNote(request, note.id)).isDeleted).toBe(false);
    await page.goto('/notes/');
    await expect(noteLink(page, note.title)).toBeVisible();
  });

  test('clear trash permanently deletes trashed notes', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Trashed for good') });
    await request.delete(`/api/v1/notes/${note.id}/`);

    await page.goto('/notes/?isDeleted=true');
    await expect(noteLink(page, note.title)).toBeVisible();

    await iconButton(page, 'Clear Trash').click();
    await modalButton(page, 'Clear Trash').click();

    await expect(noteLink(page, note.title)).toHaveCount(0);
    const response = await request.get(`/api/v1/notes/${note.id}/`);
    expect(response.ok()).toBe(false);
  });

  test('an untitled note shows its first words in the list', async ({ page, request }) => {
    const words = unique('untitled body text');
    await createNote(request, { content: words });
    await page.goto('/notes/');
    await expect(noteLink(page, words)).toBeVisible();
  });
});
