import { test, expect } from '@playwright/test';
import { unique, createNote, getNote, findTagId } from '../helpers/api.js';
import { noteLink, sidebarTag, openTagSettings, listItem, openNote, startEditing, saveNote, addTagInEditor, tagInput, tagRemoveButton, tagColorSwatch, tagSuggestions, selectedTagSuggestion, gotoPage, modalButton } from '../helpers/ui.js';

test.describe('Tags', () => {
  test('a tag added in the editor appears in the sidebar and filters the list', async ({ page, request }) => {
    const tag = unique('work');
    const tagged = await createNote(request, { title: unique('Tagged') });
    const untagged = await createNote(request, { title: unique('Untagged') });
    await openNote(page, tagged.id);

    await startEditing(page);
    await addTagInEditor(page, tag);
    await saveNote(page);

    await sidebarTag(page, tag).click();
    await expect(page).toHaveURL(/tagId=\d+/);
    await expect(noteLink(page, tagged.title)).toBeVisible();
    await expect(noteLink(page, untagged.title)).toHaveCount(0);
  });

  test('typing part of an existing tag suggests it', async ({ page, request }) => {
    const tag = unique('recipes');
    await createNote(request, { title: unique('Has tag'), tags: [tag] });
    const note = await createNote(request, { title: unique('Needs tag') });
    await openNote(page, note.id);

    await startEditing(page);
    await tagInput(page).fill(tag.slice(0, -2));
    await listItem(page, tag).click();
    await saveNote(page);

    expect((await getNote(request, note.id)).tags).toEqual([tag]);
  });

  test('arrow keys move through suggestions, Enter adds the selected one, Escape closes them', async ({ page, request }) => {
    const prefix = unique('keyboard');
    await createNote(request, { title: unique('Has tags'), tags: [`${prefix} one`, `${prefix} two`] });
    const note = await createNote(request, { title: unique('Needs tag') });
    await openNote(page, note.id);

    await startEditing(page);
    await tagInput(page).fill(prefix);
    // Both tags and the "Add" option, in the order zen lists them.
    await expect(tagSuggestions(page)).toHaveCount(3);
    const options = await tagSuggestions(page).allTextContents();
    await expect(selectedTagSuggestion(page)).toHaveText(options[0]);

    await tagInput(page).press('ArrowDown');
    await expect(selectedTagSuggestion(page)).toHaveText(options[1]);
    await tagInput(page).press('ArrowUp');
    await tagInput(page).press('ArrowUp');
    await expect(selectedTagSuggestion(page)).toHaveText(options[2]);
    await tagInput(page).press('ArrowDown');
    await expect(selectedTagSuggestion(page)).toHaveText(options[0]);

    await tagInput(page).press('ArrowDown');
    await tagInput(page).press('Enter');
    await expect(tagSuggestions(page)).toHaveCount(0);
    await expect(tagInput(page)).toHaveValue('');

    await tagInput(page).fill(prefix);
    await expect(tagSuggestions(page)).not.toHaveCount(0);
    await tagInput(page).press('Escape');
    await expect(tagSuggestions(page)).toHaveCount(0);

    await saveNote(page);
    expect((await getNote(request, note.id)).tags).toEqual([options[1]]);
  });

  test('removing a tag in the editor', async ({ page, request }) => {
    const tag = unique('temporary');
    const note = await createNote(request, { title: unique('Loses tag'), tags: [tag] });
    await openNote(page, note.id);

    await startEditing(page);
    await tagRemoveButton(page, tag).click();
    await saveNote(page);

    expect((await getNote(request, note.id)).tags).toEqual([]);
  });

  test('rename a tag and change its colour', async ({ page, request }) => {
    const tag = unique('draft');
    const renamed = unique('final');
    const note = await createNote(request, { title: unique('Renamed tag'), tags: [tag] });
    await gotoPage(page, '/notes/');

    await openTagSettings(page, tag);
    await page.getByLabel('Tag Name').fill(renamed);
    await tagColorSwatch(page, 'red').click();
    await modalButton(page, 'Update').click();

    await expect(sidebarTag(page, renamed)).toBeVisible();
    await expect(sidebarTag(page, tag)).toHaveCount(0);
    expect((await getNote(request, note.id)).tags).toEqual([renamed]);

    const response = await request.get(`/api/v1/tags/?query=${encodeURIComponent(renamed)}`);
    const tags = await response.json();
    expect(tags.find(t => t.name === renamed).color).toBe('red');
  });

  test('delete a tag removes it from every note', async ({ page, request }) => {
    const tag = unique('obsolete');
    const first = await createNote(request, { title: unique('First'), tags: [tag] });
    const second = await createNote(request, { title: unique('Second'), tags: [tag] });
    await gotoPage(page, '/notes/');

    await openTagSettings(page, tag);
    await modalButton(page, 'Delete').click();

    await expect(sidebarTag(page, tag)).toHaveCount(0);
    expect(await findTagId(request, tag)).toBeNull();
    expect((await getNote(request, first.id)).tags).toEqual([]);
    expect((await getNote(request, second.id)).tags).toEqual([]);
  });
});
