// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

const PASSWORD =
  process.env.ACCESS_PASSWORD ?? 'correct-horse-battery-staple';

test.describe('auth smoke', () => {
  test('redirects unauthenticated lounge access to login', async ({ page }) => {
    await page.goto('/lounge');
    await expect(page).toHaveURL(/\/login\?next=%2Flounge/);
    await expect(page.getByPlaceholder(/Passwort|Password/)).toBeVisible();
  });

  test('rejects wrong password with error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Passwort|Password/).fill('definitely-wrong');
    await page.getByRole('button', { name: /Weiter|Continue/ }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('correct password lands on lounge', async ({ page }) => {
    await page.goto('/login?next=%2Flounge');
    await page.getByPlaceholder(/Passwort|Password/).fill(PASSWORD);
    await page.getByRole('button', { name: /Weiter|Continue/ }).click();
    await expect(page).toHaveURL(/\/lounge$/);
    // Lounge idle CTA visible (visual spec §4.4)
    await expect(
      page.getByRole('button', { name: /Konversation starten|Start conversation/ })
    ).toBeVisible();
  });

  test('landing page renders headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Login/ })).toBeVisible();
  });
});
