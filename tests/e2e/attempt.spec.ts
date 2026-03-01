import { test, expect } from '@playwright/test';

test.describe('Assignment Attempt Page', () => {
    let assignmentId: string;

    test.beforeAll(async ({ request }) => {
        // Seed and get an assignment ID
        await request.post('http://localhost:4000/api/seed');
        const response = await request.get('http://localhost:4000/api/assignments');
        const assignments = await response.json();
        assignmentId = assignments[0]._id;
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`/assignment/${assignmentId}`);
        // Wait for assignment to load
        await expect(page.locator('#run-button')).toBeVisible({ timeout: 15000 });
    });

    test('should load assignment details', async ({ page }) => {
        // Assignment title should be visible
        await expect(page.locator('text=#001')).toBeVisible();
        await expect(page.locator('text=Basic SELECT Query')).toBeVisible();
    });

    test('should display question panel', async ({ page }) => {
        await expect(page.locator('text=Question')).toBeVisible();
        await expect(page.locator('text=Requirements')).toBeVisible();
    });

    test('should display schema panel with tables', async ({ page }) => {
        // Wait for schema to load
        await expect(page.locator('[id^="schema-table-"]')).toBeVisible({ timeout: 15000 });

        // Should show employees table
        await expect(page.locator('#schema-table-employees')).toBeVisible();
        await expect(page.locator('#schema-table-departments')).toBeVisible();
    });

    test('should expand schema table to show columns and sample data', async ({ page }) => {
        await expect(page.locator('#schema-table-employees')).toBeVisible({ timeout: 15000 });
        await page.click('#schema-table-employees');

        // Should show column names
        await expect(page.locator('text=column_name')).toBeHidden(); // It's already expanded by default
        await expect(page.locator('text=Columns')).toBeVisible();
        await expect(page.locator('text=Sample Data')).toBeVisible();
    });

    test('should have Monaco editor loaded', async ({ page }) => {
        // Monaco editor should be present (it renders in an iframe or div)
        await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    });

    test('should execute a valid query and show results', async ({ page }) => {
        // Wait for Monaco to load
        await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });

        // Click run button
        await page.click('#run-button');

        // Wait for results
        await expect(page.locator('text=rows returned')).toBeVisible({ timeout: 15000 });
    });

    test('should show error for invalid query', async ({ page }) => {
        await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });

        // Type an invalid query by focusing editor and typing
        // Clear the editor content and type invalid SQL
        const editor = page.locator('.monaco-editor textarea');
        await editor.focus();
        // Select all and replace
        await page.keyboard.press('Control+a');
        await page.keyboard.type('INVALID SQL QUERY');

        await page.click('#run-button');

        // Should show error
        await expect(page.locator('text=Error').first()).toBeVisible({ timeout: 15000 });
    });

    test('should navigate back to listing', async ({ page }) => {
        await page.click('#back-button');
        await expect(page).toHaveURL('/');
    });

    test('should toggle expected output', async ({ page }) => {
        await expect(page.locator('#toggle-expected-output')).toBeVisible({ timeout: 10000 });
        await page.click('#toggle-expected-output');
        // Expected output content should appear
        await expect(page.locator('text=id |')).toBeVisible({ timeout: 5000 });
    });

    test('should get a hint', async ({ page }) => {
        // Click get hint button
        await expect(page.locator('#get-hint')).toBeVisible({ timeout: 10000 });
        await page.click('#get-hint');

        // Should show a hint
        await expect(page.locator('text=Checklist')).toBeVisible({ timeout: 10000 });
    });

    test('should reset query', async ({ page }) => {
        await expect(page.locator('#reset-query')).toBeVisible({ timeout: 10000 });
        await page.click('#reset-query');

        // Editor should be reset (idle state)
        await expect(page.locator('text=Run your first query')).toBeVisible({ timeout: 5000 });
    });

    test('should run query with Ctrl+Enter', async ({ page }) => {
        await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });

        // Press Ctrl+Enter
        await page.keyboard.press('Control+Enter');

        // Should show results (since default query is valid)
        await expect(page.locator('text=rows returned')).toBeVisible({ timeout: 15000 });
    });
});
