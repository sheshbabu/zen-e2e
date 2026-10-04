# zen-e2e

End-to-end tests for [zen](../zen) using Playwright. `topology.md` lists every feature and which test covers it.

## Setup

Needs Go, esbuild and Node, the same as zen itself.

```bash
npm install
npx playwright install chromium
```

## Running

```bash
make test          # headless
make test-headed   # watch the browser
make stress        # run each test 10 times to catch flaky ones
make debug         # step through with the inspector
make perf          # measure API and rendering speed against perf/baseline.json
make perf-update   # record a new perf baseline
make report        # open the last HTML report
```

## How a run works

- `start.sh` builds the bundle and a binary from `../zen` (override with `ZEN_DIR`) into `.zen/` (override with `ZEN_RUN_DIR`), then starts it on port 8091 (override with `ZEN_E2E_PORT`) against an empty `.zen/data/`. Server logs go to `.zen/zen.log`.
- The `setup` project onboards the admin account through the UI and saves the session to `.auth/user.json`. The `desktop` and `mobile` projects reuse it.
- All specs share one database, so tests run one at a time and name everything with `unique()`. Setup data goes through the API (`helpers/api.js`); the UI is driven only for the feature under test.
- The service worker is blocked so a cached bundle never hides the build under test.

## Perf suite

- `PERF=1` swaps the functional projects for the perf ones. `perf/seed.setup.js` loads 10,000 notes, 200 tags and a 50 KB note, generated from a fixed seed in `perf/seed.js`.
- `perf/api.spec.js` times each hot endpoint 30 times. `perf/ui.spec.js` repeats each scenario 5 times on a CPU slowed 4x, and times it inside the page, from the click or key press to the frame after the result appears.
- Each metric prints its median and p95. A median more than 25% and 10ms slower than `perf/baseline.json` is printed as REGRESSION and added as an annotation in the HTML report. The run never fails on it, since timings depend on the machine.
- Record the baseline with `make perf-update` on the machine you compare on.

### Results

Medians from an Apple M3 Pro with 36 GB of RAM, zen on localhost, measured on 2026-10-04. The UI numbers are on the 4x slowed CPU.

| Metric | 5,000 notes | 10,000 notes |
|---|---|---|
| api: list notes, first page | 19.7ms | 36.0ms |
| api: list notes, page 40 | 39.9ms | 53.1ms |
| api: list notes by tag | 2.8ms | 5.2ms |
| api: get a large note | 0.8ms | 0.8ms |
| api: search | 9.3ms | 16.1ms |
| api: list tags | 3.3ms | 5.7ms |
| api: save a large note | 3.5ms | 3.5ms |
| ui: load the notes page, list shown | 322.5ms | 338.6ms |
| ui: load the notes page, LCP | 316.0ms | 332.0ms |
| ui: open a large note | 224.7ms | 227.9ms |
| ui: type in a large note, worst keystroke | 24.0ms | 24.0ms |
| ui: search (includes zen's 200ms debounce) | 241.6ms | 248.8ms |
| ui: load more notes | 306.1ms | 309.4ms |
| ui: filter by tag | 184.5ms | 184.2ms |

Listing notes grows with the total number of notes, because SQLite reads and sorts every note to find the newest 100.
