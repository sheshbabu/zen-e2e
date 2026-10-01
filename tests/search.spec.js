import { test, expect } from '@playwright/test';
import { unique, createNote } from '../helpers/api.js';
import { gotoPage, openSearch, searchResult } from '../helpers/ui.js';

// FTS tokenises on spaces, so the random suffix from unique() is a word only one note contains.
function uniqueWord() {
  return unique('x').split(' ')[1];
}

test.describe('Search', () => {
  test('finds a note by a word in its content and opens it', async ({ page, request }) => {
    const word = uniqueWord();
    const note = await createNote(request, { title: unique('Carbonara'), content: `Whisk the eggs with ${word} pecorino.` });
    await gotoPage(page, '/notes/');

    const input = await openSearch(page);
    await input.fill(word);
    await searchResult(page, note.title).click();

    await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
    await expect(input).toHaveCount(0);
  });

  test('shows a message when nothing matches', async ({ page }) => {
    const word = uniqueWord();
    await gotoPage(page, '/notes/');

    const input = await openSearch(page);
    await input.fill(word);

    await expect(page.getByText(`No results for "${word}"`)).toBeVisible();
  });

  test('a tag result filters the list by that tag', async ({ page, request }) => {
    const tag = uniqueWord();
    await createNote(request, { title: unique('Tagged for search'), tags: [tag] });
    await gotoPage(page, '/notes/');

    const input = await openSearch(page);
    await input.fill(tag);
    await page.getByRole('button', { name: 'Tags', exact: true }).click();
    await searchResult(page, tag).click();

    await expect(page).toHaveURL(/tagId=\d+/);
  });

  test('Cmd+K opens search, Enter opens the first result, Escape closes', async ({ page, request }) => {
    const word = uniqueWord();
    const note = await createNote(request, { title: unique('Keyboard search'), content: word });
    await gotoPage(page, '/notes/');

    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByPlaceholder('Search...');
    await expect(input).toBeFocused();
    await input.press('Escape');
    await expect(input).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+k');
    await input.fill(word);
    await expect(searchResult(page, note.title)).toBeVisible();
    await input.press('Enter');

    await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
  });

  test('an opened result shows under Recent', async ({ page, request }) => {
    const word = uniqueWord();
    const note = await createNote(request, { title: unique('Recent result'), content: word });
    await gotoPage(page, '/notes/');

    let input = await openSearch(page);
    await input.fill(word);
    await searchResult(page, note.title).click();

    input = await openSearch(page);
    await input.fill('');
    await expect(page.getByText('Recent', { exact: true })).toBeVisible();
    await expect(searchResult(page, note.title)).toBeVisible();
  });
});
