import { test, expect } from '@playwright/test';
import { unique, createNote } from '../helpers/api.js';
import { gotoPage, openSearch, searchResult, searchResults, selectedSearchResult, searchPreview, searchPreviewToggle, button, listItem } from '../helpers/ui.js';

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

  test('sorting by Created lists the newest match first', async ({ page, request }) => {
    const word = uniqueWord();
    const older = await createNote(request, { title: unique(`Older ${word}`), content: `${word} ${word} ${word}` });
    // zen stores timestamps to the second, so the two notes need different seconds to sort apart.
    await page.waitForTimeout(1100);
    const newer = await createNote(request, { title: unique('Newer'), content: `One mention of ${word} among many other words in a longer note.` });
    await gotoPage(page, '/notes/');

    const input = await openSearch(page);
    await input.fill(word);
    await expect(searchResults(page)).toHaveCount(2);
    await expect(searchResults(page).first()).toContainText(older.title);

    await button(page, 'Best matches').click();
    await listItem(page, 'Created').click();
    await expect(searchResults(page).first()).toContainText(newer.title);
  });

  test('the preview pane toggles off and stays off', async ({ page, request }) => {
    const word = uniqueWord();
    await createNote(request, { title: unique('Previewed'), content: word });
    await gotoPage(page, '/notes/');

    let input = await openSearch(page);
    await input.fill(word);
    await expect(searchPreview(page)).toContainText(word);

    await searchPreviewToggle(page).click();
    await expect(searchPreview(page)).toHaveCount(0);
    await expect(input).toBeFocused();

    await input.press('Escape');
    input = await openSearch(page);
    await expect(searchPreview(page)).toHaveCount(0);
  });

  test('arrow keys move the selection and Tab cycles the tabs', async ({ page, request }) => {
    const word = uniqueWord();
    const first = await createNote(request, { title: unique('First match'), content: word, tags: [word] });
    const second = await createNote(request, { title: unique('Second match'), content: word });
    await gotoPage(page, '/notes/');

    const input = await openSearch(page);
    await input.fill(word);
    // Two notes, then the tag.
    await expect(searchResults(page)).toHaveCount(3);
    await expect(selectedSearchResult(page)).toHaveText(await searchResults(page).nth(0).textContent());

    await input.press('ArrowDown');
    await expect(selectedSearchResult(page)).toHaveText(await searchResults(page).nth(1).textContent());
    await input.press('ArrowUp');
    await input.press('ArrowUp');
    await expect(selectedSearchResult(page)).toHaveText(await searchResults(page).nth(2).textContent());

    await input.press('Tab');
    await expect(searchResults(page)).toHaveCount(2);
    await input.press('Tab');
    await expect(searchResults(page)).toHaveCount(1);
    await expect(searchResult(page, first.title)).toHaveCount(0);
    await expect(searchResult(page, second.title)).toHaveCount(0);
    await input.press('Tab');
    await expect(searchResults(page)).toHaveCount(3);
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
