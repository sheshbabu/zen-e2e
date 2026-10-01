import { test, expect } from '@playwright/test';
import { unique, createNote, getNote } from '../helpers/api.js';
import { openNote, startEditing, saveNote, contentField, formatButton, modalButton, noteLink, tocRail, tocItem, waitForRender } from '../helpers/ui.js';

function sections(count) {
  return Array.from({ length: count }, (_, i) => `## Section ${i + 1}\n\nText ${i + 1}`).join('\n\n');
}

test.describe('Editor', () => {
  test('bold from the toolbar and Ctrl+I wrap the selection', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Formatting'), content: 'plain' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).selectText();
    await formatButton(page, 'Bold').click();
    await expect(contentField(page)).toHaveValue('**plain**');

    await waitForRender(page);
    await contentField(page).selectText();
    await page.keyboard.press('ControlOrMeta+i');
    await expect(contentField(page)).toHaveValue('***plain***');
  });

  test('Enter continues a list, and Enter on an empty item ends it', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Lists'), content: '' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).click();
    await contentField(page).pressSequentially('- first');
    // Tab and Enter write the textarea directly, and until zen syncs content on every keystroke a render still pending from the previous key undoes them.
    await page.keyboard.press('Enter');
    await expect(contentField(page)).toHaveValue('- first\n- ');
    await waitForRender(page);
    await page.keyboard.press('Tab');
    await expect(contentField(page)).toHaveValue('- first\n  - ');
    await page.keyboard.press('Shift+Tab');
    await waitForRender(page);
    await page.keyboard.press('Enter');
    await expect(contentField(page)).toHaveValue('- first\n\n');
  });

  test('insert a table from the toolbar', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Table'), content: '' });
    await openNote(page, note.id);

    await startEditing(page);
    await contentField(page).click();
    await formatButton(page, 'Insert Table').click();
    await expect(page.getByRole('heading', { name: 'Insert Table' })).toBeVisible();
    await modalButton(page, 'Insert').click();
    await saveNote(page);

    await expect(page.getByRole('table')).toBeVisible();
    expect((await getNote(request, note.id)).content).toContain('|');
  });

  test('a folded heading stays folded after a reload', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Foldable'), content: sections(3) });
    await openNote(page, note.id);

    await page.getByRole('heading', { name: 'Section 2' }).click();
    await expect(page.getByText('Text 2', { exact: true })).toBeHidden();
    await expect(page.getByText('Text 3', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText('Text 2', { exact: true })).toBeHidden();

    await page.getByRole('heading', { name: 'Section 2' }).click();
    await expect(page.getByText('Text 2', { exact: true })).toBeVisible();
  });

  test('expanded view hides the list and its table of contents jumps to a heading', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Expandable'), content: sections(12) });
    await openNote(page, note.id);
    await expect(tocRail(page)).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+Backslash');
    const listWidth = () => noteLink(page, note.title).evaluate(link => link.closest('[class*="notes-list-container"]').getBoundingClientRect().width);
    await expect.poll(listWidth).toBe(0);

    await tocRail(page).hover();
    await tocItem(page, 'Section 12').click();
    await expect(page.getByRole('heading', { name: 'Section 12' })).toBeInViewport();

    await page.keyboard.press('ControlOrMeta+Backslash');
    await expect.poll(listWidth).toBeGreaterThan(0);
  });

  test('a note link opens the note, and Shift+click opens it in the side panel', async ({ page, request }) => {
    const target = await createNote(request, { title: unique('Link target'), content: 'target body' });
    const source = await createNote(request, { title: unique('Link source'), content: `See [the target](/notes/${target.id})` });
    await openNote(page, source.id);

    await page.getByRole('link', { name: 'the target' }).click({ modifiers: ['Shift'] });
    await expect(page.getByText('target body')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/notes/${source.id}$`));

    await page.getByRole('link', { name: 'the target' }).click();
    await expect(page).toHaveURL(new RegExp(`/notes/${target.id}$`));
  });
});
