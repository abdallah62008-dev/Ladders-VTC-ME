import { test, expect } from '@playwright/test';

// Sprint 1 acceptance: all 6 locales reachable; placeholder copy OK for non-KSA.
const ALL_LOCALES = ['ar-sa', 'en-sa', 'ar-eg', 'en-eg', 'ar-iq', 'en-iq'] as const;

test.describe('Storefront homepage — locale routing', () => {
  for (const locale of ALL_LOCALES) {
    test(`/${locale} loads with correct dir attribute`, async ({ page }) => {
      await page.goto(`/${locale}`);

      const html = page.locator('html');
      const expectedDir = locale.startsWith('ar') ? 'rtl' : 'ltr';
      await expect(html).toHaveAttribute('dir', expectedDir);
      await expect(html).toHaveAttribute('lang', locale);
    });
  }

  test('homepage shows Phase 1 sprint 1 scaffold notice', async ({ page }) => {
    await page.goto('/ar-sa');
    await expect(page.getByText(/Phase 1 sprint 1 scaffold/i)).toBeVisible();
  });

  test('CTA is disabled on placeholder homepage', async ({ page }) => {
    await page.goto('/en-sa');
    const cta = page.getByRole('button', { name: /Browse Products/i });
    await expect(cta).toBeDisabled();
  });
});
