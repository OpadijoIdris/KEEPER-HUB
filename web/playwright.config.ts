import { defineConfig, devices } from '@playwright/test';

/**
 * Uses the system-installed Edge (channel: 'msedge') rather than a
 * downloaded Chromium — avoids an extra ~300MB browser download on a
 * machine that's already hit disk-space limits once during this project.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  // The real Oxlo LLM call inside the flow has observed latency anywhere from ~5s to ~23s —
  // the default 30s per-test budget leaves too little margin, causing real (not flaky) timeouts.
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
});
