import fs from 'fs';

const BASELINE_PATH = 'perf/baseline.json';

// Timings vary between runs, so only a slowdown that is both relative and large in absolute terms is reported.
const REGRESSION_RATIO = 1.25;
const NOISE_FLOOR_MS = 10;

// The first run warms caches and the JIT, so it is dropped.
export async function sample(runs, measureOnce) {
  await measureOnce();
  const samples = [];
  for (let i = 0; i < runs; i++) {
    samples.push(await measureOnce());
  }
  return samples;
}

// Regressions are reported, never failed, since timings depend on the machine and its load.
export function report(testInfo, name, samples) {
  const median = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  const baseline = readBaseline();
  const previous = baseline[name];

  let line = `${name}: median ${format(median)}, p95 ${format(p95)}`;
  if (previous === undefined) {
    line += ', no baseline';
  } else {
    line += `, baseline ${format(previous)}`;
    if (median > previous * REGRESSION_RATIO && median - previous > NOISE_FLOOR_MS) {
      line += ' REGRESSION';
      testInfo.annotations.push({ type: 'perf regression', description: `${name}: ${format(previous)} to ${format(median)}` });
    }
  }
  console.log(line);

  if (process.env.PERF_UPDATE === '1') {
    baseline[name] = Math.round(median * 10) / 10;
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  }
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function percentile(samples, rank) {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((rank / 100) * sorted.length) - 1;
  return sorted[Math.max(index, 0)];
}

function format(ms) {
  return `${ms.toFixed(1)}ms`;
}
