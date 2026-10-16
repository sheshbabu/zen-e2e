import { test, expect, request as playwrightRequest } from '@playwright/test';
import { unique, createNote, listNoteIds, createToken, updateToken, getToken, ALL_TAGS } from '../helpers/api.js';
import { gotoPage, openSettings, listItem, button, revokeButton, tokenRow, tokenEditButton, tokenEditor, tokenCopyButton, copyIcon, checkIcon, waitForRender } from '../helpers/ui.js';

// New request contexts inherit the project's logged-in storage state, and zen prefers the session over a bearer token.
async function tokenRequest(baseURL, token) {
  return playwrightRequest.newContext({ baseURL: baseURL, storageState: { cookies: [], origins: [] }, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
}

async function generateToken(page, name, tag) {
  // The pane loads tokens and tags on open, and the re-render when they land wipes a name typed before blur.
  const tokensLoaded = page.waitForResponse(response => response.url().includes('/api/v1/tokens/'));
  const tagsLoaded = page.waitForResponse(response => response.url().includes('/api/v1/tags/'));
  await openSettings(page, 'API Tokens');
  await tokensLoaded;
  await tagsLoaded;
  await waitForRender(page);
  await page.getByLabel('Token Name').fill(name);
  // zen's Input commits on change, which fires on blur, so Generate stays disabled until the field loses focus.
  await page.getByLabel('Token Name').blur();
  if (tag !== undefined) {
    await button(page, 'All tags').click();
    await listItem(page, tag).click();
  }
  await button(page, 'Generate Token').click();
  await expect(page.getByText('Your New Token')).toBeVisible();
  return (await page.locator('code').filter({ visible: true }).last().innerText()).trim();
}

test.describe('API tokens', () => {
  test('a read token scoped to a tag sees only that tag and cannot write', async ({ page, request, baseURL }) => {
    const tag = unique('shared');
    const inScope = await createNote(request, { title: unique('Shared note'), tags: [tag] });
    const outOfScope = await createNote(request, { title: unique('Private note'), tags: [unique('private')] });
    await gotoPage(page, '/notes/');

    const token = await generateToken(page, unique('Reader'), tag);
    const api = await tokenRequest(baseURL, token);

    const ids = await listNoteIds(api);
    expect(ids).toContain(inScope.id);
    expect(ids).not.toContain(outOfScope.id);

    const write = await api.post('/api/v1/notes/', { data: { title: 'nope', content: '', tags: [] } });
    expect(write.ok()).toBe(false);
    await api.dispose();
  });

  test('a revoked token stops working', async ({ page, baseURL }) => {
    const name = unique('Revocable');
    await gotoPage(page, '/notes/');

    const token = await generateToken(page, name);
    const api = await tokenRequest(baseURL, token);
    expect((await api.get('/api/v1/notes/')).ok()).toBe(true);

    await revokeButton(page, name).click();
    await expect(page.getByText(name)).toHaveCount(0);

    expect((await api.get('/api/v1/notes/')).status()).toBe(401);
    await api.dispose();
  });

  test('the copy button copies the new token and briefly shows a check', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoPage(page, '/notes/');

    const token = await generateToken(page, unique('Copied'));
    const copyButton = tokenCopyButton(page);
    await copyButton.click();

    await expect(checkIcon(copyButton)).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(token);
    await expect(copyIcon(copyButton)).toBeVisible();
  });

  test('editing a token changes its name and access, and the token follows', async ({ page, request, baseURL }) => {
    const tag = unique('editable');
    const inScope = await createNote(request, { title: unique('Granted note'), tags: [tag] });
    const outOfScope = await createNote(request, { title: unique('Ungranted note'), tags: [unique('elsewhere')] });
    const name = unique('Editable');
    const newName = unique('Renamed');
    await gotoPage(page, '/notes/');

    const token = await generateToken(page, name, tag);
    const api = await tokenRequest(baseURL, token);
    expect(await listNoteIds(api)).not.toContain(outOfScope.id);

    await tokenEditButton(page, name).click();
    const editor = tokenEditor(page);
    await editor.getByLabel('Token Name').fill(newName);
    await editor.getByLabel('Token Name').blur();
    // The closed tag menu stays in the DOM after the dropdown button, so the button is the first match.
    await editor.getByText(tag, { exact: true }).first().click();
    await listItem(editor, 'All tags').click();
    await editor.getByText('Read and write', { exact: true }).click();
    await editor.getByText('Save', { exact: true }).click();

    await expect(tokenRow(page, newName).getByText('Read and write: All tags')).toBeVisible();
    await expect(tokenRow(page, name)).toHaveCount(0);

    const ids = await listNoteIds(api);
    expect(ids).toContain(inScope.id);
    expect(ids).toContain(outOfScope.id);
    const write = await api.post('/api/v1/notes/', { data: { title: unique('Written by token'), content: '', tags: [] } });
    expect(write.ok()).toBe(true);
    await api.dispose();
  });

  test('cancel discards edits, and granting a tag twice blocks Save', async ({ page }) => {
    const name = unique('Unchanged');
    await gotoPage(page, '/notes/');
    await generateToken(page, name);

    await tokenEditButton(page, name).click();
    const editor = tokenEditor(page);
    await editor.getByLabel('Token Name').fill(unique('Discarded'));
    await editor.getByLabel('Token Name').blur();
    await editor.getByText('Add tag', { exact: true }).click();
    await expect(editor.getByText('Each tag can only be granted once.')).toBeVisible();
    await expect(editor.getByText('Save', { exact: true })).toHaveAttribute('disabled', 'true');

    await editor.getByText('Cancel', { exact: true }).click();
    await expect(tokenEditor(page)).toHaveCount(0);
    await expect(tokenRow(page, name).getByText('Read: All tags')).toBeVisible();
  });

  test('an invalid update is rejected and leaves the token unchanged', async ({ request }) => {
    const name = unique('Validated');
    const readAll = { tagId: ALL_TAGS, canRead: true, canWrite: false };
    const { id } = await createToken(request, { name: name, scopes: [readAll] });

    const invalidUpdates = [
      { name: ' ', scopes: [readAll] },
      { name: name, scopes: [] },
      { name: name, scopes: [readAll, readAll] },
      { name: name, scopes: [{ tagId: ALL_TAGS, canRead: false, canWrite: true }] },
      { name: name, scopes: [{ tagId: 999999999, canRead: true, canWrite: false }] },
    ];
    for (const update of invalidUpdates) {
      expect((await updateToken(request, id, update)).status()).toBe(400);
    }

    expect(await getToken(request, id)).toEqual({ name: name, scopes: [readAll] });
    expect((await updateToken(request, 999999999, { name: name, scopes: [readAll] })).status()).toBe(404);
  });
});
