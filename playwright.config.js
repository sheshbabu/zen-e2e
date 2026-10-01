import { defineConfig, devices } from '@playwright/test';

const port = process.env.ZEN_E2E_PORT || '8091';

export default defineConfig({
  testDir: './tests',
  // All specs share one server and one user, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
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
  projects: [
    {
      name: 'setup',
      testMatch: /onboarding\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop',
      testMatch: /.*\.spec\.js/,
      testIgnore: /mobile\.spec\.js/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: '.auth/user.json' },
    },
    {
      name: 'mobile',
      testMatch: /mobile\.spec\.js/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: '.auth/user.json' },
    },
  ],
});
