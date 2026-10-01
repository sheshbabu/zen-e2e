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
make report        # open the last HTML report
```

## How a run works

- `start.sh` builds the bundle and a binary from `../zen` (override with `ZEN_DIR`) into `.zen/` (override with `ZEN_RUN_DIR`), then starts it on port 8091 (override with `ZEN_E2E_PORT`) against an empty `.zen/data/`. Server logs go to `.zen/zen.log`.
- The `setup` project onboards the admin account through the UI and saves the session to `.auth/user.json`. The `desktop` and `mobile` projects reuse it.
- All specs share one database, so tests run one at a time and name everything with `unique()`. Setup data goes through the API (`helpers/api.js`); the UI is driven only for the feature under test.
- The service worker is blocked so a cached bundle never hides the build under test.
