import { test } from '@playwright/test';
import { performance } from 'perf_hooks';
import { sample, report } from './report.js';
import { LARGE_NOTE_ID, SEARCH_TERM } from './seed.js';

const RUNS = 30;

async function timeRequest(send) {
  const start = performance.now();
  const response = await send();
  // Reading the body waits for all of it, not just the headers.
  await response.body();
  if (!response.ok()) {
    throw new Error(`${response.url()} returned ${response.status()}`);
  }
  return performance.now() - start;
}

async function measureGet(request, testInfo, name, path) {
  const samples = await sample(RUNS, () => timeRequest(() => request.get(path)));
  report(testInfo, name, samples);
}

test('list notes', async ({ request }, testInfo) => {
  await measureGet(request, testInfo, 'api: list notes, first page', '/api/v1/notes/?page=1');
  await measureGet(request, testInfo, 'api: list notes, page 40', '/api/v1/notes/?page=40');
  await measureGet(request, testInfo, 'api: list notes by tag', '/api/v1/notes/?tagId=2');
});

test('get a large note', async ({ request }, testInfo) => {
  await measureGet(request, testInfo, 'api: get a large note', `/api/v1/notes/${LARGE_NOTE_ID}/`);
});

test('search', async ({ request }, testInfo) => {
  await measureGet(request, testInfo, 'api: search', `/api/v1/search/?query=${SEARCH_TERM}`);
});

test('list tags', async ({ request }, testInfo) => {
  await measureGet(request, testInfo, 'api: list tags', '/api/v1/tags/');
});

test('save a large note', async ({ request }, testInfo) => {
  const note = await (await request.get(`/api/v1/notes/${LARGE_NOTE_ID}/`)).json();
  const payload = { title: note.title, content: note.content, tags: [] };
  const samples = await sample(RUNS, () => timeRequest(() => request.put(`/api/v1/notes/${LARGE_NOTE_ID}/`, { data: payload })));
  report(testInfo, 'api: save a large note', samples);
});
