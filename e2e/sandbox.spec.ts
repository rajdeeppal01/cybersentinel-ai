import { test, expect } from '@playwright/test';

test.describe('Attack Sandbox E2E', () => {
  test('should load the Sandbox UI and switch to interactive mode', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.click('text=Attack Sandbox');
    await expect(page.locator('text=PRESET VECTORS')).toBeVisible();
    await page.click('text=Live PTY');
    await expect(page.locator('text=Sandbox Status: Active')).toBeVisible();
  });
});
