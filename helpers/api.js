import { expect } from '@playwright/test';

// Specs share one database, so every name a spec creates carries a suffix to keep specs from seeing each other's data.
export function unique(prefix) {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${prefix} ${suffix}`;
}

// Setup goes through the API so a spec only drives the UI for the feature it tests.
// This file is the only place that knows the API's JSON field names, so renaming them is a change here alone.

// Like the editor, reuse an existing tag and only send tagId -1 for a new one, since zen creates a duplicate otherwise.
async function toTagPayload(request, names) {
  const tags = [];
  for (const name of names) {
    const tagId = await findTagId(request, name);
    tags.push({ tagId: tagId === null ? -1 : tagId, name: name });
  }
  return tags;
}

export async function createNote(request, { title = '', content = '', tags = [] } = {}) {
  const payload = {
    title: title,
    content: content,
    tags: await toTagPayload(request, tags)
  };
  const response = await request.post('/api/v1/notes/', { data: payload });
  expect(response.ok()).toBeTruthy();
  const note = await response.json();
  return { id: note.noteId, title: note.title, tags: note.tags };
}

export async function updateNote(request, id, { title, content, tags = [] }) {
  const payload = {
    title: title,
    content: content,
    tags: await toTagPayload(request, tags)
  };
  const response = await request.put(`/api/v1/notes/${id}/`, { data: payload });
  expect(response.ok()).toBeTruthy();
}

export async function getNote(request, id) {
  const response = await request.get(`/api/v1/notes/${id}/`);
  expect(response.ok()).toBeTruthy();
  const note = await response.json();
  return { id: note.noteId, title: note.title, content: note.content, tags: note.tags.map(tag => tag.name), isArchived: note.isArchived, isDeleted: note.isDeleted, isPinned: note.isPinned };
}

export async function deleteNote(request, id) {
  const response = await request.delete(`/api/v1/notes/${id}/`);
  expect(response.ok()).toBeTruthy();
}

export async function archiveNote(request, id) {
  const response = await request.put(`/api/v1/notes/${id}/archive/`);
  expect(response.ok()).toBeTruthy();
}

export async function findTagId(request, name) {
  const response = await request.get(`/api/v1/tags/?query=${encodeURIComponent(name)}`);
  expect(response.ok()).toBeTruthy();
  const tags = await response.json();
  const tag = tags.find(t => t.name === name);
  return tag === undefined ? null : tag.tagId;
}

export async function deleteTag(request, id) {
  const response = await request.delete(`/api/v1/tags/${id}/`);
  expect(response.ok()).toBeTruthy();
}

export async function listNoteIds(request) {
  const response = await request.get('/api/v1/notes/');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.notes.map(note => note.noteId);
}
