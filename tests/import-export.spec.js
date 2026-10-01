import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { unique, createNote } from '../helpers/api.js';
import { gotoPage, openSettings, noteLink, sidebarTag, modalButton, toast } from '../helpers/ui.js';

test.describe('Import and export', () => {
  test('import a folder of markdown and text files', async ({ page }) => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'zen-import-'));
    const title = unique('Imported with frontmatter');
    const tag = unique('imported');
    const plainName = unique('plain-import').replaceAll(' ', '-');
    fs.writeFileSync(path.join(folder, 'with-frontmatter.md'), `---\ntitle: ${title}\ntags: ${tag}\n---\n\nBody from frontmatter file`);
    fs.writeFileSync(path.join(folder, `${plainName}.txt`), 'Body from a text file');
    fs.copyFileSync(path.join(import.meta.dirname, '../fixtures/square.png'), path.join(folder, 'skipped.png'));

    await gotoPage(page, '/notes/');
    await openSettings(page, 'Import');
    await page.getByLabel('Choose folder').setInputFiles(folder);

    await expect(page.getByText('2 files imported. 1 skipped.')).toBeVisible();
    await expect(page.getByText('Imported (2)')).toBeVisible();
    await expect(page.getByText('Skipped (1)')).toBeVisible();

    await gotoPage(page, '/notes/');
    await expect(noteLink(page, title)).toBeVisible();
    await expect(sidebarTag(page, tag)).toBeVisible();
    // Without frontmatter the file name becomes the title.
    await expect(noteLink(page, plainName)).toBeVisible();

    fs.rmSync(folder, { recursive: true });
  });

  test('export downloads a zip with every note as markdown', async ({ page, request }) => {
    const note = await createNote(request, { title: unique('Exported note'), content: 'exported body' });
    await gotoPage(page, '/notes/');

    await openSettings(page, 'Export');
    const downloadPromise = page.waitForEvent('download');
    await modalButton(page, 'Export').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^zen-export-.*\.zip$/);
    await expect(toast(page, 'Notes exported successfully!')).toBeVisible();

    // Zip entry names are stored uncompressed, so they can be found in the raw bytes without unzipping.
    const archive = fs.readFileSync(await download.path()).toString('latin1');
    for (const entry of [`${note.title.replaceAll(' ', '-')}.md`, 'notes.json', 'tags.json']) {
      expect(archive.includes(entry), `zip contains ${entry}`).toBe(true);
    }
  });
});
