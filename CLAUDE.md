# zen-e2e

## Writing tests

- Select by role, label, placeholder or visible text where zen offers one. Most zen controls are icon-only divs, so fall back to a CSS class, and keep it in `helpers/ui.js`, not the spec, so a rename in zen is fixed in one place. Icons carry their name as a `lucide-*` class.
- A known zen bug gets a test that asserts the correct behaviour, marked `test.fail()` with a comment describing the bug. Remove the annotation when zen fixes it.
- All specs share one database, so name everything with `unique()`.
- Create setup data through the API (`helpers/api.js`) and drive the UI only for the feature under test.
- Canvas, templates and MCP are out of scope.

## Selector notes

Most zen buttons are `div`s with an icon and no accessible name, and closed menus stay in the DOM. The suite matches visible text where it can and falls back to CSS classes, all kept at the top of `helpers/ui.js`. Icons are found by their `lucide-*` class. Closed menus and the collapsed card-view editor count as visible, which is why `button()` sometimes needs `.first()` or `.last()`.

## Updating topology.md

Derive features from the zen code: `main.go` routes, `index.js` client routes, `ApiClient.js`, `useEditorKeyboardShortcuts.js` and the modals. Then check them by exploring a seeded instance with `browser-skill` and by running the suite.
