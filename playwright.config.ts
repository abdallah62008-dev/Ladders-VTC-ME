import { defineConfig, devices } from '@playwright/test';

// Playwright config per D-INFRA-008 + D-INFRA-009 (locked 2026-05-09).
// E2E tests + visual regression snapshots in-repo (no Chromatic/Percy in Phase 1).

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  expect: {
    // Visual regression snapshots stored adjacent to test files
    // per D-INFRA-009 locked rules.
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.visual\.spec\.ts/,
    },
  ],
  // Playwright owns the app-server lifecycle in BOTH local and CI runs.
  // Local: `pnpm dev`, reuseable. CI: `pnpm start` against the `pnpm build`
  // output (step 13), fresh process every run.
  //
  // Previously the webServer block was `undefined` in CI and the workflow was
  // expected to "use pre-built start" — but `ci.yml` step 14b never actually
  // launched a server, so Playwright tried to navigate to localhost:3000 with
  // nothing listening → every E2E test failed with ECONNREFUSED. Letting
  // Playwright manage the lifecycle (this block) is the canonical fix.
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
