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
  // Local dev server boot (CI uses pre-built start)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
