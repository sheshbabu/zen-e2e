# Zen feature topology

The source of truth for what the suite covers.

Each action is marked with the test that covers it, **gap** when nothing does yet, or **out of scope**. Canvas, templates and MCP are out of scope.

## Pages

| Route | Page |
|---|---|
| `/`, `/notes/`, `/notes/:id`, `/notes/new` | Notes page: sidebar, list, editor. Query params `tagId`, `focusId`, `isArchived`, `isDeleted` filter the list |
| `/templates/`, `/templates/:id` | Templates (out of scope) |
| `/canvases/`, `/canvases/:id` | Canvas (out of scope) |
| before login | Onboarding (no user yet) or Login |

## Onboarding and auth

| Action | Coverage |
|---|---|
| First visit shows onboarding, create admin account, land on empty notes | `onboarding.setup.js` |
| Login with wrong email / wrong password shows the field error | `settings.spec.js` › wrong email and wrong password |
| Login, then Settings › Security › Log out; the session is invalid server-side | `settings.spec.js` › log in, then log out |
| Onboarding with an invalid email or empty password | gap |
| Password change: mismatch, wrong current password, success | `settings.spec.js` › password change |
| Password change where new = old | `settings.spec.js` › password change validates |

## Notes

Entry points: sidebar New, mobile navbar New, `Ctrl+N`, `/notes/new`.

| Action | Coverage |
|---|---|
| Create with title, markdown content; rendered as markdown; appears in list | `notes.spec.js` › create a note from the sidebar |
| `Ctrl+N` opens a new note, `Ctrl/Cmd+Enter` saves | `notes.spec.js` › Ctrl+N … |
| Cancel on a new note discards it | `notes.spec.js` › cancel on a new note |
| Edit and save | `notes.spec.js` › edit and save |
| Cancel on an existing note reverts | `notes.spec.js` › cancel on an existing note |
| Typing survives a re-render before blur | `notes.spec.js` › typing survives a re-render |
| Tick a task checkbox in the rendered note; saved | `notes.spec.js` › ticking a task |
| Pin from the editor menu; pinned note sorts first | `notes.spec.js` › pin |
| Archive / unarchive with toasts; Archives page | `notes.spec.js` › archive |
| Delete (confirm modal) to Trash; restore from Trash | `notes.spec.js` › delete |
| Clear Trash (confirm modal) permanently deletes | `notes.spec.js` › clear trash |
| Untitled note shows its first words in the list | `notes.spec.js` › untitled note |
| Copy / Share from the editor menu | gap (needs clipboard permission; Share needs `navigator.share`) |
| Editor menu Created / Modified dates | `notes.spec.js` › the editor menu shows |
| Auto save (Settings › Editor) saves without pressing Save | `settings.spec.js` › auto save |
| Toolbar Bold and `Cmd+I` wrap the selection | `editor.spec.js` › bold from the toolbar |
| Other toolbar formats (strikethrough, highlight, code, headings, lists, quote, link, rule) | `editor.spec.js` › … from the toolbar formats the selection |
| Enter continues a list, Tab/Shift+Tab indent, Enter on an empty item ends it | `editor.spec.js` › Enter continues a list |
| Insert a table from the toolbar | `editor.spec.js` › insert a table; editing an existing table is a gap |
| Fold a heading; the fold survives a reload | `editor.spec.js` › a folded heading |
| Expand editor (`Cmd+\`) hides sidebar and list; table of contents jumps to a heading | `editor.spec.js` › expanded view |
| Note link navigates; Shift+click opens it in the side panel | `editor.spec.js` › a note link |
| Code block copy button | gap (needs clipboard permission) |
| Load more (100 notes per page) | `notes.spec.js` › Load more |

## Images

| Action | Coverage |
|---|---|
| Upload via the dropzone file chooser; markdown inserted; image renders after save | `views.spec.js` › uploaded image |
| Gallery view shows the image; click opens the lightbox | `views.spec.js` › uploaded image |
| Paste and drag-and-drop upload | `views.spec.js` › pasting an image, dropping an image |
| Similar images in the lightbox | gap (needs zen-intelligence) |

## Views

| Action | Coverage |
|---|---|
| Switch list / card / gallery; the choice is remembered per page | `views.spec.js` › card view |
| Card click opens the note in a modal | `views.spec.js` › card view |
| Empty states ("No notes", "No images") | `onboarding.setup.js` covers "No notes"; "No images" is a gap |

## Tags

| Action | Coverage |
|---|---|
| Add a new tag in the editor; appears in the sidebar; sidebar tag filters the list | `tags.spec.js` › a tag added in the editor |
| Suggestion for an existing tag | `tags.spec.js` › typing part of an existing tag |
| Remove a tag in the editor | `tags.spec.js` › removing a tag |
| Rename and recolour from the sidebar pencil (Manage Tag) | `tags.spec.js` › rename a tag |
| Delete a tag; removed from every note | `tags.spec.js` › delete a tag |
| Tag keyboard navigation (arrows, Enter, Escape) | `tags.spec.js` › arrow keys move through suggestions |

## Focus modes

| Action | Coverage |
|---|---|
| Create from the switcher with a tag; list and sidebar tags filtered | `focus.spec.js` › create a focus |
| Rename | `focus.spec.js` › rename a focus |
| Delete; returns to all notes | `focus.spec.js` › delete a focus |
| Delete a focus whose tags were deleted | `focus.spec.js` › delete a focus whose tags were deleted |
| Renaming or deleting a tag from the sidebar updates the focus's tags without a reload | `focus.spec.js` › renaming a tag from the sidebar, deleting a tag from the sidebar |

## Search

Entry points: sidebar Search, mobile navbar Search, `Cmd/Ctrl+K`.

| Action | Coverage |
|---|---|
| Lexical match in content; click opens the note and closes search | `search.spec.js` › finds a note |
| No results message | `search.spec.js` › shows a message |
| Tags tab; tag result filters the list | `search.spec.js` › a tag result |
| `Cmd+K` opens, Enter opens the selected result, Escape closes | `search.spec.js` › Cmd+K … |
| Recent searches when the query is empty | `search.spec.js` › an opened result shows under Recent |
| Sort dropdown | `search.spec.js` › sorting by Created |
| Preview pane toggle; stays off when reopened | `search.spec.js` › the preview pane toggles off |
| Arrow-key selection, Tab cycles tabs | `search.spec.js` › arrow keys move the selection |
| Similar Notes / Similar Images sections | gap (needs zen-intelligence) |

## Bulk actions

| Action | Coverage |
|---|---|
| Cmd/Ctrl+click starts selection; click toggles | `bulk-actions.spec.js` (all tests) |
| Bulk archive with toast | `bulk-actions.spec.js` › archive |
| Bulk delete with confirm modal and toast | `bulk-actions.spec.js` › delete |
| Cancel leaves selection mode | `bulk-actions.spec.js` › cancel |
| Select everything; long press on mobile | gap |

## Version history

| Action | Coverage |
|---|---|
| Versions from the editor menu; select an older version; Restore | `versions.spec.js` › restore |
| Restore disabled on the current version | `versions.spec.js` › restore |
| Empty state for a never-edited note | `versions.spec.js` › no versions |
| Pruning tiers (hourly, daily, weekly) | gap (needs clock control; better as a Go unit test) |

## Settings

| Pane | Coverage |
|---|---|
| Appearance: theme applies and persists | `settings.spec.js` › dark theme |
| Editor: auto save | `settings.spec.js` › auto save |
| Editor: spellcheck | gap |
| Security | see Onboarding and auth |
| Import folder (.md with frontmatter, .txt, skipped files, summary) | `import-export.spec.js` › import |
| Export zip (markdown per note, notes.json, tags.json) | `import-export.spec.js` › export |
| Export → wipe → import round-trip | gap |
| API Tokens: a read token scoped to a tag sees only that tag and can't write | `tokens.spec.js` › a read token scoped to a tag |
| API Tokens: revoke stops the token working | `tokens.spec.js` › a revoked token |
| API Tokens: several scopes, read and write access | gap |

## Mobile (below 948px)

| Action | Coverage |
|---|---|
| Opening a note replaces the list; back returns | `mobile.spec.js` › opening a note |
| New from the bottom navbar | `mobile.spec.js` › create a note |
| Back after creating a note returns to the list | `mobile.spec.js` › back after creating a note |
| Hamburger opens the sidebar | `mobile.spec.js` › the hamburger |

## Offline and service worker

The suite blocks the service worker so a cached bundle never hides the build under test. Offline indicator, cached assets and SW updates are a gap; they need their own project with the worker enabled.

## Routes with no UI

- `GET /api/v1/notes/{id}/related/`: no caller in the frontend.
- `GET /api/v1/intelligence/availability/`, `POST /api/v1/intelligence/index/`, `GET /api/v1/intelligence/queue/`: no caller in the frontend.

## Findings from building the suite

A pinned finding has a `test.fail` test, so it shows as an expected failure until fixed, then fails loudly so the annotation gets removed. Fixed findings are dropped.

- A render still pending from one keystroke undoes the next Tab or list Enter, and a `fill` right after a toolbar format is wiped. Not pinned; `waitForRender` in `editor.spec.js` covers it.
- zen's `Input` commits on `change`, which fires on blur. While you type a token name, Generate Token stays disabled until the field loses focus. Minor, not pinned.
- Pressing `Ctrl+N` before the first load settles can leave the first note selected at `/notes/new`. Minor, not pinned.
- Escape in the card-view note modal is ignored for a moment after it opens, until the editor's document listener attaches. Minor, not pinned.
