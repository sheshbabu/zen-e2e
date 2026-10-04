// Generates a large, fixed dataset for the perf suite, so every run measures the same notes.
// The same seed always yields the same SQL, which keeps runs comparable with the baseline.

export const NOTE_COUNT = 10000;
export const TAG_COUNT = 200;

export const LARGE_NOTE_ID = 1;
export const LARGE_NOTE_TITLE = 'Large note';
const LARGE_NOTE_SECTIONS = 40;
export const LARGE_NOTE_LAST_HEADING = `Section ${LARGE_NOTE_SECTIONS}`;

// Note 2 always carries this tag and is the newest note that does, so it heads the filtered list.
export const FILTER_TAG = 'tag-001';
export const FILTER_TAG_NEWEST_ID = 2;
export const FILTER_TAG_NEWEST_TITLE = noteTitle(FILTER_TAG_NEWEST_ID);

// Every note draws from this vocabulary, so the term matches thousands of notes and search has real work to do.
export const SEARCH_TERM = 'lantern';

const WORDS = ['lantern', 'river', 'garden', 'copper', 'meadow', 'signal', 'harbor', 'pencil', 'orbit', 'velvet', 'canyon', 'ember', 'falcon', 'glacier', 'hollow', 'island', 'jasmine', 'kettle', 'ladder', 'marble', 'needle', 'oyster', 'pepper', 'quartz', 'ribbon', 'saddle', 'thistle', 'umbrella', 'violet', 'walnut', 'yarrow', 'zephyr', 'anchor', 'bramble', 'cobalt', 'dune', 'engine', 'fern', 'granite', 'harvest', 'ivory', 'juniper', 'kite', 'lemon', 'maple', 'nectar', 'olive', 'pebble', 'quill', 'raven'];
const COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];
const NEWEST = Date.parse('2026-06-15T10:00:00Z');

export function generateSeedSql() {
  const random = mulberry32(42);
  const lines = [
    '-- zen\'s triggers keep the notes_search table in sync, and the sqlite3 CLI blocks triggers on virtual tables unless the schema is trusted.',
    'PRAGMA trusted_schema = ON;',
    'BEGIN;',
  ];

  for (let id = 1; id <= TAG_COUNT; id++) {
    const name = `tag-${String(id).padStart(3, '0')}`;
    lines.push(`INSERT INTO tags (tag_id, name, color, created_at, updated_at) VALUES (${id}, '${name}', '${COLORS[id % COLORS.length]}', '${sqlDate(NEWEST)}', '${sqlDate(NEWEST)}');`);
  }

  lines.push(noteInsert(LARGE_NOTE_ID, LARGE_NOTE_TITLE, largeNoteContent(random), NEWEST));

  for (let id = 2; id <= NOTE_COUNT + 1; id++) {
    // Each older note is a minute older, so list order follows the id.
    lines.push(noteInsert(id, noteTitle(id), noteContent(random), NEWEST - id * 60_000));

    const tagIds = new Set();
    if (id === FILTER_TAG_NEWEST_ID) {
      tagIds.add(1);
    }
    const tagCount = Math.floor(random() * 4);
    while (tagIds.size < tagCount) {
      // Tag 1 stays off the other notes, so note 2 is the newest in its filter.
      tagIds.add(2 + Math.floor(random() * (TAG_COUNT - 1)));
    }
    for (const tagId of tagIds) {
      lines.push(`INSERT INTO note_tags (note_id, tag_id) VALUES (${id}, ${tagId});`);
    }
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

function noteTitle(id) {
  return `Note ${String(id).padStart(4, '0')}`;
}

function noteInsert(id, title, content, time) {
  const date = sqlDate(time);
  return `INSERT INTO notes (note_id, title, content, created_at, updated_at) VALUES (${id}, '${title}', '${content.replaceAll("'", "''")}', '${date}', '${date}');`;
}

function noteContent(random) {
  const paragraphs = [];
  const count = 1 + Math.floor(random() * 3);
  for (let i = 0; i < count; i++) {
    paragraphs.push(sentence(random, 40 + Math.floor(random() * 40)));
  }
  return paragraphs.join('\n\n');
}

// About 50 KB of the markdown zen renders: headings, tasks, tables and code.
function largeNoteContent(random) {
  const sections = [];
  for (let i = 1; i <= LARGE_NOTE_SECTIONS; i++) {
    sections.push(`## Section ${i}

${sentence(random, 120)}

- [ ] ${sentence(random, 8)}
- [x] ${sentence(random, 8)}
- [ ] ${sentence(random, 8)}

| Name | Value |
|---|---|
| ${word(random)} | ${word(random)} |
| ${word(random)} | ${word(random)} |
| ${word(random)} | ${word(random)} |

\`\`\`js
const ${word(random)} = '${sentence(random, 6)}';
\`\`\``);
  }
  return sections.join('\n\n');
}

function sentence(random, length) {
  const words = [];
  for (let i = 0; i < length; i++) {
    words.push(word(random));
  }
  return words.join(' ');
}

function word(random) {
  return WORDS[Math.floor(random() * WORDS.length)];
}

function sqlDate(time) {
  return new Date(time).toISOString().slice(0, 19).replace('T', ' ');
}

// A small seeded generator, since Math.random can't be seeded.
function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
