import { test, expect } from '@playwright/test';

test.describe('Attack Sandbox E2E', () => {
  test('should load the Sandbox UI and switch to interactive mode', async ({ page }) => {
    // Note: Assuming dev server is running on localhost:5173 or localhost:3000
    // We will navigate to the root and click the Sandbox tab
    await page.goto('http://localhost:3000/');

    // Bypass the landing page
    await page.click('text=Quick Start');

    // Click on the Sandbox tab
    await page.click('text=Attack Sandbox');

    // Verify the preset vectors are visible
    await expect(page.locator('text=PRESET VECTORS')).toBeVisible();

    // Switch to Interactive PTY mode
    await page.click('text=Live PTY');

    // Verify Sandbox Status is active
    await expect(page.locator('text=Sandbox Status: Active')).toBeVisible();
  });
});
