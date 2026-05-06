// tests/e2e/lounge-skeleton.spec.ts
import { test, expect } from '@playwright/test';

const PASSWORD = process.env.ACCESS_PASSWORD ?? 'correct-horse-battery-staple';

test.describe('lounge skeleton', () => {
  test.beforeEach(async ({ context, page }) => {
    // Deny mic globally so we don't hang on permission prompt
    await context.grantPermissions([], { origin: 'http://localhost:3000' });
    await page.goto('/login?next=%2Flounge');
    await page.getByPlaceholder(/Passwort|Password/).fill(PASSWORD);
    await page.getByRole('button', { name: /Weiter|Continue/ }).click();
    await expect(page).toHaveURL(/\/lounge$/);
  });

  test('idle CTA visible + click transitions away from idle', async ({ page }) => {
    const cta = page.getByRole('button', { name: /Konversation starten|Start conversation/ });
    await expect(cta).toBeVisible();
    await cta.click();
    // Expect either: connecting, error-mic (no mic perm), or error-connect.
    await expect(
      page.getByText(/Verbinde|Connecting|Mikrofon|microphone|fehlgeschlagen|failed/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
