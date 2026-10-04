import { test } from './fixtures.js';
import { measure, measureEachLoad, loadTime, largestContentfulPaint, resetInteractions, worstInteraction } from './probe.js';
import { sample, report } from './report.js';
import { LARGE_NOTE_ID, LARGE_NOTE_TITLE, LARGE_NOTE_LAST_HEADING, FILTER_TAG, FILTER_TAG_NEWEST_ID, FILTER_TAG_NEWEST_TITLE, SEARCH_TERM } from './seed.js';
import { PERF_TARGETS, listRowSelector, gotoPage, openNote, startEditing, openSearch, button, noteLink, sidebarTag, contentField, waitForRender } from '../helpers/ui.js';

const RUNS = 5;
const NOTES_PER_PAGE = 100;

test('load the notes page', async ({ page }, testInfo) => {
  await measureEachLoad(page, { selector: PERF_TARGETS.listItem });
  const samples = await sample(RUNS, async () => {
    await gotoPage(page, '/notes/');
    return { list: await loadTime(page), lcp: await largestContentfulPaint(page) };
  });
  report(testInfo, 'ui: load the notes page, list shown', samples.map(s => s.list));
  report(testInfo, 'ui: load the notes page, LCP', samples.map(s => s.lcp));
});

// The notes page opens the newest note, which is the large one, so the run starts from another note.
test('open a large note from the list', async ({ page }, testInfo) => {
  const samples = await sample(RUNS, async () => {
    await gotoPage(page, `/notes/${FILTER_TAG_NEWEST_ID}`);
    const target = { selector: PERF_TARGETS.renderedHeading, text: LARGE_NOTE_LAST_HEADING };
    return measure(page, target, () => noteLink(page, LARGE_NOTE_TITLE).click());
  });
  report(testInfo, 'ui: open a large note', samples);
});

// Typing latency is the worst interaction while typing, the same way INP is.
test('type in a large note', async ({ page }, testInfo) => {
  const samples = await sample(RUNS, async () => {
    await openNote(page, LARGE_NOTE_ID);
    await startEditing(page);
    await contentField(page).focus();
    await page.keyboard.press('ControlOrMeta+End');
    await resetInteractions(page);
    await page.keyboard.type('the quick brown fox jumps over the lazy dog');
    await waitForRender(page);
    return worstInteraction(page);
  });
  report(testInfo, 'ui: type in a large note, worst keystroke', samples);
});

// The time includes zen's 200ms debounce on the search box.
test('search', async ({ page }, testInfo) => {
  const samples = await sample(RUNS, async () => {
    await gotoPage(page, '/notes/');
    await openSearch(page);
    const target = { selector: PERF_TARGETS.searchSectionTitle, text: 'Notes' };
    return measure(page, target, () => page.keyboard.type(SEARCH_TERM));
  });
  report(testInfo, 'ui: search', samples);
});

test('load more notes', async ({ page }, testInfo) => {
  const samples = await sample(RUNS, async () => {
    await gotoPage(page, '/notes/');
    const target = { selector: listRowSelector(NOTES_PER_PAGE + 1) };
    return measure(page, target, () => button(page, 'Load more').click());
  });
  report(testInfo, 'ui: load more notes', samples);
});

test('filter by tag', async ({ page }, testInfo) => {
  const samples = await sample(RUNS, async () => {
    await gotoPage(page, '/notes/');
    const target = { selector: PERF_TARGETS.firstListTitle, text: FILTER_TAG_NEWEST_TITLE };
    return measure(page, target, () => sidebarTag(page, FILTER_TAG).click());
  });
  report(testInfo, 'ui: filter by tag', samples);
});
