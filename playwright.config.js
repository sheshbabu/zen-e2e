import { defineConfig, devices } from '@playwright/test';

const port = process.env.ZEN_E2E_PORT || '8091';

// The server starts on an empty database every run, so the functional and visual suites run separately.
// The visual screenshots need a database holding only the seed, which the functional tests would fill with their own data.
const isVisual = process.env.VISUAL === '1';
const isPerf = process.env.PERF === '1';

const onboarding = {
  name: 'setup',
  testMatch: /tests\/onboarding\.setup\.js/,
  use: { ...devices['Desktop Chrome'] },
};

const functionalProjects = [
  {
    name: 'desktop',
    testMatch: /tests\/.*\.spec\.js/,
    testIgnore: /mobile\.spec\.js/,
    dependencies: ['setup'],
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: '.auth/user.json' },
  },
  {
    name: 'mobile',
    testMatch: /tests\/mobile\.spec\.js/,
    dependencies: ['setup'],
    use: { ...devices['Pixel 7'], storageState: '.auth/user.json' },
  },
];

// The seed's dates are fixed, so the timezone and locale are too, or relative dates and formats would vary by machine.
const visualUse = { timezoneId: 'UTC', locale: 'en-US', storageState: '.auth/user.json' };

const visualProjects = [
  {
    name: 'seed',
    testMatch: /visual\/seed\.setup\.js/,
    dependencies: ['setup'],
  },
  ...['light', 'dark'].flatMap(colorScheme => [
    {
      name: `desktop-${colorScheme}`,
      testMatch: /visual\/desktop\.spec\.js/,
      dependencies: ['seed'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, colorScheme: colorScheme, ...visualUse },
    },
    {
      name: `mobile-${colorScheme}`,
      testMatch: /visual\/mobile\.spec\.js/,
      dependencies: ['seed'],
      use: { ...devices['Pixel 7'], colorScheme: colorScheme, ...visualUse },
    },
  ]),
];

// The perf suite needs a database holding only its large seed, and Chromium for CPU throttling and Event Timing.
const perfProjects = [
  {
    name: 'perf-seed',
    testMatch: /perf\/seed\.setup\.js/,
    dependencies: ['setup'],
  },
  {
    name: 'perf',
    testMatch: /perf\/.*\.spec\.js/,
    dependencies: ['perf-seed'],
    // Each test repeats its scenario on a throttled CPU, which takes longer than the default timeout.
    timeout: 180_000,
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: '.auth/user.json' },
  },
];

export default defineConfig({
  testDir: '.',
  // All specs share one server and one user, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Baselines are only ever recorded on macOS, so the platform suffix is left out.
  snapshotPathTemplate: 'visual/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${port}`,
    // A cached bundle from the service worker would hide the build under test.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'sh start.sh',
    // Playwright counts the 401 this returns before onboarding as ready.
    url: `http://localhost:${port}/api/v1/users/me`,
    // A server left running would carry an old database.
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [onboarding, ...(isVisual ? visualProjects : isPerf ? perfProjects : functionalProjects)],
});
