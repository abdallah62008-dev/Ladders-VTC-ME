import { test, expect } from '@playwright/test';

test.describe('Admin shell — Phase 1 sprint 1 scaffold', () => {
  test('admin dashboard renders with Country Context Switcher', async ({ page }) => {
    await page.goto('/ar-sa/admin');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    // Country Context Switcher should render. Single-country stub user (KSA) → fixed label.
    await expect(page.getByText(/Country: Saudi Arabia/i)).toBeVisible();
  });

  test('products page declares country_scope_mode aware', async ({ page }) => {
    await page.goto('/en-sa/admin/products');
    await expect(page.getByText(/country_scope_mode: aware/i)).toBeVisible();
  });

  test('countries page declares country_scope_mode global', async ({ page }) => {
    await page.goto('/en-sa/admin/countries');
    await expect(page.getByText(/country_scope_mode: global/i)).toBeVisible();
  });

  test('warehouses page declares country_scope_mode scoped', async ({ page }) => {
    await page.goto('/en-sa/admin/warehouses');
    await expect(page.getByText(/country_scope_mode: scoped/i)).toBeVisible();
    // Inventory authority callout should be visible per D-COUNTRY-013
    await expect(page.getByText(/Inventory authority \(D-COUNTRY-013\)/i)).toBeVisible();
  });

  test('all admin routes have noindex header', async ({ request }) => {
    const res = await request.get('/en-sa/admin');
    expect(res.headers()['x-robots-tag']).toContain('noindex');
    expect(res.headers()['cache-control']).toContain('no-store');
  });
});
