import { expect } from '@playwright/test';

// Most zen controls are icon-only divs with no accessible name, so these use zen's CSS classes.
// Keeping every class here means a rename in zen is fixed in one place.
const EDITOR_MENU_BUTTON = '.notes-editor-menu > .ghost-button';
const EDIT_ICON = '.lucide-pencil-line';
const NOTE_TITLE = '.notes-editor-title[contenteditable="true"]';
const TAG_PILL = '.tag';
const TAG_REMOVE_BUTTON = '.tag-remove';
const TAG_COLOR_SWATCH = '.tag-color-swatch.color-';
const TASK_CHECKBOX = '.task-list-item-checkbox';
const VERSION_ROW = '.note-versions-row';
const SEARCH_RESULT = '.search-result-item';
const TOC_RAIL = '.toc-sidebar';
const TOC_ITEM = '.toc-item';
const API_TOKEN_ROW = '.api-token-item';
const SETTINGS_TOGGLE_OPTION = '.settings-toggle-option';
const FOCUS_SWITCHER_BUTTON = '.sidebar-focus-switcher .dropdown-button';

// The button shows the active focus name; matching that name as text can hit an option in the fading dropdown instead.
export function focusSwitcher(page) {
  return page.locator(FOCUS_SWITCHER_BUTTON);
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

export function contentField(page) {
  return page.getByPlaceholder('Write here...');
}

export function tagInput(page) {
  return page.getByPlaceholder('Add Tags...');
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

// Waits for the initial fetches, so a keypress or click doesn't land before the router and list are ready.
export async function gotoPage(page, path) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function openNote(page, id) {
  await page.goto(`/notes/${id}`);
  await expect(page.getByText('Edit', { exact: true })).toBeVisible();
  // The page fetches the note again once the list loads, and any re-render wipes typed text before blur.
  await page.waitForLoadState('networkidle');
}

// Entering edit mode sets state again a frame after the textarea mounts, which wipes text typed in between.
async function waitForEditorToSettle(page) {
  await contentField(page).waitFor();
  await waitForRender(page);
}

export async function startEditing(page) {
  await page.getByText('Edit', { exact: true }).click();
  await waitForEditorToSettle(page);
}

export async function clickEditorMenuItem(page, name) {
  await page.locator(EDITOR_MENU_BUTTON).click();
  await listItem(page, name).click();
}

export async function addTagInEditor(page, name) {
  await tagInput(page).fill(name);
  await listItem(page, `Add "${name}"`).click();
}

export async function writeNote(page, { title, content, tags = [] }) {
  await waitForEditorToSettle(page);
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
