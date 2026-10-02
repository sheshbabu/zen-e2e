import { test, expect, request as playwrightRequest } from '@playwright/test';
import { unique, createNote, listNoteIds } from '../helpers/api.js';
import { gotoPage, openSettings, listItem, button, revokeButton, waitForRender } from '../helpers/ui.js';

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
});
