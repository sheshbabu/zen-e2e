import { test as base } from '@playwright/test';

// The seed data is dated relative to this moment, so "2h" and "3d" in the list never drift.
export const NOW = new Date('2026-06-15T10:00:00Z');

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(NOW);
    await use(page);
  },
});

export { expect } from '@playwright/test';
