// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

const PASSWORD =
  process.env.ACCESS_PASSWORD ?? 'correct-horse-battery-staple';

test.describe('auth smoke', () => {
  test('redirects unauthenticated lounge access to login', async ({
    page,
  }) => {
    await page.goto('/lounge');
    await expect(page).toHaveURL(/\/login\?next=%2Flounge/);
    await expect(page.getByLabel('Passwort')).toBeVisible();
  });

  test('rejects wrong password with error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Passwort').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Falsches Passwort' })
    ).toBeVisible();
  });

  test('correct password lands on lounge', async ({ page }) => {
    await page.goto('/login?next=%2Flounge');
    await page.getByLabel('Passwort').fill(PASSWORD);
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expect(page).toHaveURL(/\/lounge$/);
    await expect(
      page.getByRole('heading', { name: 'Lounge' })
    ).toBeVisible();
  });

  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Talk to me.' })
    ).toBeVisible();
  });
});
