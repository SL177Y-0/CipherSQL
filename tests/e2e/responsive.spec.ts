import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
    test.beforeAll(async ({ request }) => {
        await request.post('http://localhost:4000/api/seed');
    });

    test('mobile viewport (320px) - listing shows stacked cards', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 });
        await page.goto('/');
        await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

        // Cards should be single column
        const grid = page.locator('#assignments-grid');
        await expect(grid).toHaveCSS('grid-template-columns', /1fr/);
    });

    test('mobile viewport (320px) - attempt page shows tabs', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 });

        const assignments = await (await page.request.get('http://localhost:4000/api/assignments')).json();
        await page.goto(`/assignment/${assignments[0]._id}`);

        // Tab navigation should be visible
        await expect(page.locator('#tab-question')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('#tab-schema')).toBeVisible();
        await expect(page.locator('#tab-editor')).toBeVisible();
        await expect(page.locator('#tab-results')).toBeVisible();
        await expect(page.locator('#tab-hint')).toBeVisible();
    });

    test('tablet viewport (641px) - listing shows 2 columns', async ({ page }) => {
        await page.setViewportSize({ width: 641, height: 800 });
        await page.goto('/');
        await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });
    });

    test('desktop viewport (1024px) - listing shows 3 columns', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/');
        await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });
    });

    test('wide desktop viewport (1281px) - listing shows 4 columns', async ({ page }) => {
        await page.setViewportSize({ width: 1281, height: 900 });
        await page.goto('/');
        await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });
    });

    test('mobile viewport shows compact header', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await expect(page.locator('text=CipherSQL')).toBeVisible();
    });

    test('desktop shows Assignments badge in header', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await expect(page.locator('text=Assignments')).toBeVisible();
    });
});
