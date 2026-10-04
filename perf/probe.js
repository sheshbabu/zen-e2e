// Timings are taken inside the page, so they cover zen's work and not Playwright's round trips.

// Runs before zen's scripts on every navigation, so input and paint timings are captured from the first frame.
function installProbe() {
  let inputAt = null;

  // The latest real input marks the start of a measure.
  for (const type of ['pointerdown', 'keydown']) {
    addEventListener(type, event => { inputAt = event.timeStamp; }, true);
  }

  // Resolves with the time from the start to the frame after the target appears.
  window.__arm = (selector, text, isFromNavigation) => {
    inputAt = null;
    window.__measure = new Promise(resolve => {
      const isDone = () => [...document.querySelectorAll(selector)].some(element => text === null || element.textContent.trim() === text);
      const observer = new MutationObserver(() => {
        if (!isDone()) {
          return;
        }
        observer.disconnect();
        const start = isFromNavigation ? 0 : inputAt;
        // A task queued from the next frame runs once that frame is painted.
        requestAnimationFrame(() => setTimeout(() => resolve(performance.now() - start)));
      });
      observer.observe(document, { childList: true, subtree: true, characterData: true });
    });
  };

  window.__lcp = 0;
  new PerformanceObserver(list => {
    window.__lcp = list.getEntries().at(-1).startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // Event Timing only reports interactions of 16ms or more, so a quick one counts as 0.
  let worstInteraction = 0;
  const eventObserver = new PerformanceObserver(list => recordEvents(list.getEntries()));
  eventObserver.observe({ type: 'event', durationThreshold: 16 });
  function recordEvents(entries) {
    for (const entry of entries) {
      if (entry.interactionId > 0) {
        worstInteraction = Math.max(worstInteraction, entry.duration);
      }
    }
  }
  window.__resetInteractions = () => {
    eventObserver.takeRecords();
    worstInteraction = 0;
  };
  window.__worstInteraction = () => {
    recordEvents(eventObserver.takeRecords());
    return worstInteraction;
  };
}

export async function addProbe(page) {
  await page.addInitScript(installProbe);
}

// Times from navigation start until the target appears, on every load of the page.
export async function measureEachLoad(page, { selector, text = null }) {
  await page.addInitScript(([selector, text]) => window.__arm(selector, text, true), [selector, text]);
}

export async function loadTime(page) {
  return page.evaluate(() => window.__measure);
}

// Times from the last click or key press in the action until the target appears.
export async function measure(page, { selector, text = null }, action) {
  await page.evaluate(([selector, text]) => window.__arm(selector, text, false), [selector, text]);
  await action();
  return page.evaluate(() => window.__measure);
}

export async function largestContentfulPaint(page) {
  return page.evaluate(() => window.__lcp);
}

export async function resetInteractions(page) {
  await page.evaluate(() => window.__resetInteractions());
}

export async function worstInteraction(page) {
  return page.evaluate(() => window.__worstInteraction());
}
