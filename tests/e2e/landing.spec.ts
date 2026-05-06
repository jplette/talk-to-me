// tests/e2e/landing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('landing', () => {
  test('renders headline + login + footer (DE default)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Sprich/);
    await expect(page.getByRole('link', { name: /Login/ })).toBeVisible();
    await expect(page.getByText(/Hinweis zur Audio-Verarbeitung/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'DE', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();
  });

  test('lang toggle: DE → EN swaps headline copy', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Talk to/);
    await expect(page.getByText(/How we handle audio/)).toBeVisible();
  });
});
