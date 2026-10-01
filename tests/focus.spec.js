import { test, expect } from '@playwright/test';
import { unique, createNote } from '../helpers/api.js';
import { noteLink, sidebarTag, listItem, tagInput, gotoPage, modalButton, clickEditIcon, focusSwitcher } from '../helpers/ui.js';

function focusOption(page, name) {
  return listItem(page, name);
}

async function openSwitcher(page, activeName = 'Everything') {
  // After a rename the button takes the new name one render after the options do.
  await expect(focusSwitcher(page)).toHaveText(activeName);
  await focusSwitcher(page).click();
}

async function editFocus(page, name) {
  await openSwitcher(page, name);
  await clickEditIcon(focusOption(page, name));
  await expect(page.getByText('Edit Focus')).toBeVisible();
}

async function createFocus(page, name, tag) {
  await openSwitcher(page);
  await page.getByText('Add new...', { exact: true }).click();
  await expect(page.getByText('Create Focus')).toBeVisible();
  await page.getByLabel('Focus Name').fill(name);
  await tagInput(page).fill(tag);
  await listItem(page, tag).click();
  await modalButton(page, 'Create').click();
}

test.describe('Focus modes', () => {
  test('create a focus that shows only notes with its tags', async ({ page, request }) => {
    const tag = unique('project');
    const otherTag = unique('personal');
    const focusName = unique('Project focus');
    const inFocus = await createNote(request, { title: unique('In focus'), tags: [tag] });
    const outOfFocus = await createNote(request, { title: unique('Out of focus'), tags: [otherTag] });
    await gotoPage(page, '/notes/');

    await createFocus(page, focusName, tag);

    await expect(page).toHaveURL(/focusId=\d+/);
    await expect(noteLink(page, inFocus.title)).toBeVisible();
    await expect(noteLink(page, outOfFocus.title)).toHaveCount(0);
    await expect(sidebarTag(page, tag)).toBeVisible();
    await expect(sidebarTag(page, otherTag)).toHaveCount(0);
  });

  test('rename a focus', async ({ page, request }) => {
    const tag = unique('reading');
    const focusName = unique('Reading');
    const renamed = unique('Books');
    await createNote(request, { title: unique('Book notes'), tags: [tag] });
    await gotoPage(page, '/notes/');
    await createFocus(page, focusName, tag);

    await editFocus(page, focusName);
    await page.getByLabel('Focus Name').fill(renamed);
    await modalButton(page, 'Update').click();

    await openSwitcher(page, renamed);
    await expect(focusOption(page, renamed)).toBeVisible();
    await expect(focusOption(page, focusName)).toHaveCount(0);
  });

  test('delete a focus returns to all notes', async ({ page, request }) => {
    const tag = unique('errands');
    const focusName = unique('Errands');
    await createNote(request, { title: unique('Errand'), tags: [tag] });
    await gotoPage(page, '/notes/');
    await createFocus(page, focusName, tag);

    await editFocus(page, focusName);
    await modalButton(page, 'Delete').click();

    await expect(page).toHaveURL(/\/notes\/$/);
    await openSwitcher(page);
    await expect(focusOption(page, focusName)).toHaveCount(0);
  });
});
