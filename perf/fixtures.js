import { test as base } from '@playwright/test';
import { addProbe } from './probe.js';

// A fast laptop hides slow rendering, so the CPU runs four times slower, roughly a mid-range phone.
const CPU_SLOWDOWN = 4;

export const test = base.extend({
  page: async ({ page }, use) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
    await addProbe(page);
    await use(page);
  },
});
