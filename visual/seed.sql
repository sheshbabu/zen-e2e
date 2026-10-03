-- Fixed data for the visual suite, loaded after zen has migrated the schema and onboarding has created the user.
-- Dates sit before NOW in visual/fixtures.js, so relative dates in the list render the same on every run.

-- zen's triggers keep the notes_search table in sync, and the sqlite3 CLI blocks triggers on virtual tables unless the schema is trusted.
PRAGMA trusted_schema = ON;

INSERT INTO tags (tag_id, name, color, created_at, updated_at) VALUES
  (1, 'work', 'blue', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (2, 'reading', 'green', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (3, 'cooking', 'orange', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (4, 'travel', 'teal', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (5, 'dev', 'purple', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (6, 'personal', 'gray', '2026-05-01 09:00:00', '2026-05-01 09:00:00');

INSERT INTO notes (note_id, title, content, created_at, updated_at, pinned_at, archived_at, deleted_at) VALUES
  (1, 'Weekly planning', '## Goals

- [x] Ship the import fix
- [ ] Review the design doc
- [ ] Plan the offsite

## Notes

Keep Friday afternoon free for **deep work**. Follow up with the team on ==open questions==.', '2026-06-01 08:00:00', '2026-06-15 09:00:00', '2026-06-10 08:00:00', NULL, NULL),
  (2, 'Reading list', 'Books to pick up this summer:

1. The Pragmatic Programmer
2. A Philosophy of Software Design
3. Designing Data-Intensive Applications

> Read less, but read better.', '2026-05-20 08:00:00', '2026-06-15 07:00:00', NULL, NULL, NULL),
  (3, 'Sourdough recipe', '## Ingredients

| Ingredient | Amount |
|---|---|
| Flour | 500 g |
| Water | 375 g |
| Starter | 100 g |
| Salt | 10 g |

## Method

1. Mix flour and water, rest for an hour.
2. Add starter and salt, then fold every 30 minutes.
3. Shape, proof overnight, and bake at 250°C.', '2026-05-10 08:00:00', '2026-06-14 10:00:00', NULL, NULL, NULL),
  (4, 'Trip to Kyoto', 'Day one around Higashiyama.

![](/images/kyoto.png)

- Kiyomizu-dera at sunrise
- Lunch near Nishiki market
- ~~Fushimi Inari~~ moved to day two', '2026-05-05 08:00:00', '2026-06-13 10:00:00', NULL, NULL, NULL),
  (5, 'Go error handling', 'Wrap errors with context and handle them once.

```go
if err != nil {
	return fmt.Errorf("error loading note: %w", err)
}
```

Use `errors.Is` to check for sentinel errors.', '2026-05-02 08:00:00', '2026-06-10 10:00:00', NULL, NULL, NULL),
  (6, 'Standup 12 June', 'Yesterday: finished the tag colours. Today: focus modes. Blocked on nothing.', '2026-06-12 09:30:00', '2026-06-12 09:45:00', NULL, NULL, NULL),
  (7, '', 'A quick thought without a title, captured on the go before it slipped away.', '2026-06-08 18:00:00', '2026-06-08 18:00:00', NULL, NULL, NULL),
  (8, 'Gift ideas', '- Ceramic mug
- Film camera
- Plant for the office', '2026-04-20 08:00:00', '2026-05-20 08:00:00', NULL, NULL, NULL),
  (9, 'Old project brief', 'The original scope, kept for reference.', '2026-01-10 08:00:00', '2026-02-01 08:00:00', NULL, '2026-03-01 08:00:00', NULL),
  (10, 'Scratchpad', 'Temporary notes that are no longer needed.', '2026-06-01 08:00:00', '2026-06-02 08:00:00', NULL, NULL, '2026-06-03 08:00:00');

INSERT INTO note_tags (note_id, tag_id) VALUES
  (1, 1), (2, 2), (3, 3), (4, 4), (5, 1), (5, 5), (6, 1), (8, 6), (9, 1);

INSERT INTO images (filename, width, height, format, aspect_ratio, file_size, created_at) VALUES
  ('kyoto.png', 480, 320, 'png', 1.5, 19583, '2026-05-05 08:00:00');

INSERT INTO note_images (note_id, filename) VALUES (4, 'kyoto.png');

INSERT INTO focus_modes (focus_mode_id, name, created_at, updated_at, last_used_at) VALUES
  (1, 'Work', '2026-05-01 09:00:00', '2026-05-01 09:00:00', '2026-06-14 09:00:00');

INSERT INTO focus_mode_tags (focus_mode_id, tag_id) VALUES (1, 1), (1, 5);

INSERT INTO api_tokens (token_id, name, token_hash, created_at) VALUES
  (1, 'Quick capture', 'visual-seed-token-hash', '2026-06-01 08:00:00');

INSERT INTO api_token_scopes (token_id, tag_id, can_read, can_write) VALUES (1, 0, 1, 1);
