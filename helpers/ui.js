import { expect } from '@playwright/test';

// Most zen controls are icon-only divs with no accessible name, so these use zen's CSS classes.
// Keeping every class here means a rename in zen is fixed in one place.
const EDITOR_MENU_BUTTON = '.notes-editor-menu > .ghost-button';
const EDITOR_MENU_DATE = '.notes-editor-menu-footer > div';
const EDIT_ICON = '.lucide-pencil-line';
const NOTE_TITLE = '.notes-editor-title[contenteditable="true"]';
const READ_MODE_TITLE = '.notes-editor-title';
const EDITOR_TAG = '.notes-editor-tags .tag';
const EDITOR_SCROLLER = '.notes-editor-container';
const TAG_PILL = '.tag';
const TAG_REMOVE_BUTTON = '.tag-remove';
const TAG_COLOR_SWATCH = '.tag-color-swatch.color-';
const TAG_SUGGESTION = '.notes-editor-tags .dropdown-option';
const SELECTED = '.is-selected';
const TASK_CHECKBOX = '.task-list-item-checkbox';
const VERSION_ROW = '.note-versions-row';
const SEARCH_RESULT = '.search-result-item';
const SEARCH_PREVIEW = '.search-preview';
const SEARCH_PREVIEW_TOGGLE = '.search-preview-toggle';
const TOC_RAIL = '.toc-sidebar';
const TOC_ITEM = '.toc-item';
const API_TOKEN_ROW = '.api-token-item';
const SETTINGS_TOGGLE_OPTION = '.settings-toggle-option';
const FOCUS_SWITCHER_BUTTON = '.sidebar-focus-switcher .dropdown-button';
const FOCUS_DIALOG_TAG = '.focus-dialog .tag';

// The perf probe watches the DOM from inside the page, so it takes plain selectors rather than locators.
export const PERF_TARGETS = {
  listItem: '.notes-list-item',
  firstListTitle: '.notes-list > div:first-child .notes-list-item-title',
  renderedHeading: '.notes-editor-rendered h2',
  searchSectionTitle: '.search-section-title',
};

// List rows are numbered from 1, and each sits in its own wrapper ahead of the Load more button.
export function listRowSelector(position) {
  return `.notes-list > div:nth-child(${position}) .notes-list-item`;
}

// The button shows the active focus name; matching that name as text can hit an option in the fading dropdown instead.
export function focusSwitcher(page) {
  return page.locator(FOCUS_SWITCHER_BUTTON);
}

export function focusDialogTags(page) {
  return page.locator(FOCUS_DIALOG_TAG);
}

// Most zen buttons are divs, and closed menus keep their items in the DOM, so match visible text instead of role.
export function button(page, name) {
  return page.getByText(name, { exact: true }).filter({ visible: true });
}

// Modals mount at the end of the page, and their titles and still-closing menus can repeat a button's text.
export function modalButton(page, name) {
  return button(page, name).last();
}

// On desktop zen's Tooltip moves every title attribute to data-tooltip; on mobile the title stays.
export function iconButton(page, tooltip) {
  return page.locator(`[data-tooltip="${tooltip}"], [title="${tooltip}"]`);
}

// Formatting button titles also hold shortcut markup, like "Bold <div>Ctrl+B</div>", so match the start.
export function formatButton(page, name) {
  return page.locator(`[data-tooltip^="${name}"], [title^="${name}"]`).first();
}

export function titleField(page) {
  return page.locator(NOTE_TITLE);
}

// The list row keeps the old title, so the editor's own title element is the one to check.
export function editorTitle(page) {
  return page.locator(READ_MODE_TITLE);
}

export function editorTags(page) {
  return page.locator(EDITOR_TAG);
}

export function editorScroller(page) {
  return page.locator(EDITOR_SCROLLER);
}

export function contentField(page) {
  return page.getByPlaceholder('Write here...');
}

export function tagInput(page) {
  return page.getByPlaceholder('Add Tags...');
}

export function tagSuggestions(page) {
  return page.locator(TAG_SUGGESTION);
}

export function selectedTagSuggestion(page) {
  return page.locator(TAG_SUGGESTION + SELECTED);
}

export function tagRemoveButton(page, name) {
  return page.locator(TAG_PILL, { hasText: name }).locator(TAG_REMOVE_BUTTON);
}

export function tagColorSwatch(page, color) {
  return page.locator(TAG_COLOR_SWATCH + color);
}

export function taskCheckbox(page, taskText) {
  return page.getByRole('listitem').filter({ hasText: taskText }).locator(TASK_CHECKBOX);
}

export function versionRows(page) {
  return page.locator(VERSION_ROW);
}

// Result titles also appear in the list and preview behind the search modal.
export function searchResult(page, text) {
  return page.locator(SEARCH_RESULT, { hasText: text });
}

export function searchResults(page) {
  return page.locator(SEARCH_RESULT);
}

export function selectedSearchResult(page) {
  return page.locator(SEARCH_RESULT + SELECTED);
}

export function searchPreview(page) {
  return page.locator(SEARCH_PREVIEW);
}

export function searchPreviewToggle(page) {
  return page.locator(SEARCH_PREVIEW_TOGGLE);
}

// The table of contents is a rail of bars that opens a popover of heading names on hover.
export function tocRail(page) {
  return page.locator(TOC_RAIL);
}

export function tocItem(page, heading) {
  return page.locator(TOC_ITEM, { hasText: heading });
}

export function revokeButton(page, tokenName) {
  return page.locator(API_TOKEN_ROW, { hasText: tokenName }).getByText('Revoke', { exact: true });
}

export function settingsToggle(page, label) {
  return page.locator(SETTINGS_TOGGLE_OPTION, { hasText: label }).getByRole('switch');
}

export function sidebarLink(page, name) {
  return page.getByRole('link', { name: name, exact: true });
}

// Tag pills in the editor are also links named after the tag; only the sidebar entry carries the edit icon.
export function sidebarTag(page, name) {
  return page.getByRole('link', { name: name, exact: true }).filter({ has: page.locator(EDIT_ICON) });
}

// The edit icon shows on hover, in sidebar tags and focus options alike.
export async function clickEditIcon(container) {
  await container.hover();
  await container.locator(EDIT_ICON).click();
}

export async function openTagSettings(page, name) {
  await clickEditIcon(sidebarTag(page, name));
  await expect(page.getByText('Manage Tag')).toBeVisible();
}

// Tag suggestions, focus options and editor menu items are list items; their text also appears on pills and list rows.
export function listItem(page, name) {
  return page.getByRole('listitem').filter({ hasText: new RegExp(`^${escapeRegExp(name)}$`) });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function noteLink(page, title) {
  return page.getByRole('link', { name: title });
}

export function toast(page, message) {
  return page.getByText(message, { exact: true });
}

// A frame for Preact to flush a pending render, so the next key isn't undone by it.
export async function waitForRender(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

// Headless pages never change visibility on their own, so a return to the tab is the event zen listens for.
export async function returnToTab(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Waits for running animations, such as a modal sliding in, so layout measured afterwards is final.
export async function waitForAnimations(page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)));
}

// Waits for the initial fetches, so a keypress or click doesn't land before the router and list are ready.
export async function gotoPage(page, path) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function openNote(page, id) {
  await page.goto(`/notes/${id}`);
  await expect(page.getByText('Edit', { exact: true })).toBeVisible();
}

export async function startEditing(page) {
  await page.getByText('Edit', { exact: true }).click();
}

export async function openEditorMenu(page) {
  await page.locator(EDITOR_MENU_BUTTON).click();
}

export async function clickEditorMenuItem(page, name) {
  await openEditorMenu(page);
  await listItem(page, name).click();
}

// The menu footer holds a "Created" and a "Modified" row, each a label followed by a date.
export function editorMenuDate(page, label) {
  return page.locator(EDITOR_MENU_DATE, { hasText: label });
}

export async function addTagInEditor(page, name) {
  await tagInput(page).fill(name);
  await listItem(page, `Add "${name}"`).click();
}

export async function writeNote(page, { title, content, tags = [] }) {
  await titleField(page).fill(title);
  await contentField(page).fill(content);
  for (const tag of tags) {
    await addTagInEditor(page, tag);
  }
}

export async function saveNote(page) {
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('Edit', { exact: true })).toBeVisible();
}

export async function openSearch(page) {
  await button(page, 'Search').click();
  return page.getByPlaceholder('Search...');
}

export async function openSettings(page, tab) {
  await button(page, 'Settings').click();
  // The open pane's heading can repeat the tab name, and the tab list comes first.
  await page.getByText(tab, { exact: true }).first().click();
}
