import { test, expect } from '@playwright/test';
import { unique, createNote, updateNote } from '../helpers/api.js';
import { openNote, startEditing, contentField, titleField, editorTitle, editorTags, editorScroller, returnToTab, waitForRender } from '../helpers/ui.js';

function isNoteFetch(request, id) {
  return request.method() === 'GET' && request.url().endsWith(`/api/v1/notes/${id}/`);
}

function waitForNoteFetch(page, id) {
  return page.waitForResponse(response => isNoteFetch(response.request(), id));
}

// Counts the refetches a return to the tab makes, so a skipped check can be told apart from a fetch that found nothing new.
function countNoteFetches(page, id) {
  const counter = { count: 0 };
  page.on('request', request => {
    if (isNoteFetch(request, id)) {
      counter.count++;
    }
  });
  return counter;
}

// zen stores updatedAt to the second, and a spec writes faster than a person, so an update in the same second as the copy on screen would look unchanged.
// The test server runs on this machine, so waiting for the next local second puts the next write in a later one.
async function waitForNextSecond() {
  await new Promise(resolve => setTimeout(resolve, 1050 - Date.now() % 1000));
}

test.describe('Refresh on tab focus', () => {
  test('a note in read mode shows changes made elsewhere', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Before'), content: 'old content', tags: [unique('old-tag')] });
    await openNote(page, note.id);

    const title = unique('After');
    await waitForNextSecond();
    const tag = unique('new-tag');
    await updateNote(request, note.id, { title: title, content: 'new content', tags: [tag] });
    const fetched = waitForNoteFetch(page, note.id);
    await returnToTab(page);
    await fetched;

    await expect(editorTitle(page)).toHaveText(title);
    await expect(page.getByText('new content')).toBeVisible();
    await expect(page.getByText('old content')).toHaveCount(0);
    await expect(editorTags(page)).toHaveText([tag]);
    await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
  });

  test('checks at most once every 30 seconds', async ({ page, request }) => {
    await page.clock.install();
    const note = await createNote(request, { title: unique('Throttled'), content: 'version one' });
    await openNote(page, note.id);
    // zen loads the note again once the list arrives, and that late fetch must not count as a check.
    await page.waitForLoadState('networkidle');
    const fetches = countNoteFetches(page, note.id);

    await waitForNextSecond();
    await updateNote(request, note.id, { title: note.title, content: 'version two' });
    const firstFetch = waitForNoteFetch(page, note.id);
    await returnToTab(page);
    await firstFetch;
    await expect(page.getByText('version two')).toBeVisible();

    await waitForNextSecond();
    await updateNote(request, note.id, { title: note.title, content: 'version three' });
    await returnToTab(page);
    await waitForRender(page);
    expect(fetches.count).toBe(1);
    await expect(page.getByText('version two')).toBeVisible();

    await page.clock.fastForward('00:31');
    const secondFetch = waitForNoteFetch(page, note.id);
    await returnToTab(page);
    await secondFetch;
    await expect(page.getByText('version three')).toBeVisible();
  });

  test('edit mode keeps unsaved typing', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Editing'), content: 'saved content' });
    await openNote(page, note.id);
    // zen loads the note again once the list arrives, and that late fetch must not count as a check.
    await page.waitForLoadState('networkidle');
    const fetches = countNoteFetches(page, note.id);
    await startEditing(page);
    await contentField(page).fill('unsaved typing');

    await updateNote(request, note.id, { title: unique('Changed elsewhere'), content: 'changed elsewhere' });
    await returnToTab(page);
    await waitForRender(page);

    expect(fetches.count).toBe(0);
    await expect(titleField(page)).toHaveText(note.title);
    await expect(contentField(page)).toHaveValue('unsaved typing');
  });

  test('edit mode started during the check keeps the note on screen', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('In flight'), content: 'saved content' });
    await openNote(page, note.id);
    await updateNote(request, note.id, { title: unique('Changed elsewhere'), content: 'changed elsewhere' });

    // Holding the response lets the click on Edit land while the check is in flight.
    let releaseFetch;
    const fetchHeld = new Promise(resolve => {
      page.route(`**/api/v1/notes/${note.id}/`, async route => {
        resolve();
        await new Promise(release => { releaseFetch = release; });
        await route.continue();
      });
    });
    await returnToTab(page);
    await fetchHeld;
    await startEditing(page);
    const fetched = waitForNoteFetch(page, note.id);
    releaseFetch();
    await fetched;
    await waitForRender(page);

    await expect(titleField(page)).toHaveText(note.title);
    await expect(contentField(page)).toHaveValue('saved content');
  });

  test('an unchanged note keeps its scroll position', async ({ page, request }) => {
    const lines = Array.from({ length: 200 }, (_, i) => `Line ${i + 1}`).join('\n\n');
    const note = await createNote(request, { title: unique('Long note'), content: lines });
    await openNote(page, note.id);
    await page.getByText('Line 150', { exact: true }).scrollIntoViewIfNeeded();
    const scrollTop = await editorScroller(page).evaluate(scroller => scroller.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);

    const fetched = waitForNoteFetch(page, note.id);
    await returnToTab(page);
    await fetched;
    await waitForRender(page);

    expect(await editorScroller(page).evaluate(scroller => scroller.scrollTop)).toBe(scrollTop);
    await expect(page.getByText('Line 150', { exact: true })).toBeInViewport();
  });
});
