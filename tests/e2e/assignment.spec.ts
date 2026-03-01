import { test, expect } from '@playwright/test';

test.describe('Assignment Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Seed the database
    await page.request.post('http://localhost:4000/api/seed');
    await page.goto('/');
  });

  test('should load and display assignments', async ({ page }) => {
    // Wait for assignments to load
    await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

    // Verify assignment cards are displayed
    const cards = page.locator('[id^="assignment-card-"]');
    await expect(cards).toHaveCount(6, { timeout: 10000 });

    // Verify first card content
    await expect(page.locator('#assignment-card-001')).toContainText('Basic SELECT Query');
  });

  test('should display header with logo', async ({ page }) => {
    await expect(page.locator('text=CipherSQL')).toBeVisible();
    await expect(page.locator('text=Studio')).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.locator('text=Master SQL with')).toBeVisible();
    await expect(page.locator('#start-practicing')).toBeVisible();
  });

  test('should filter assignments by difficulty', async ({ page }) => {
    await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

    // Click Beginner filter
    await page.click('#filter-beginner');

    // Should show only Beginner cards
    const cards = page.locator('[id^="assignment-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThan(6);
  });

  test('should search assignments', async ({ page }) => {
    await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

    await page.fill('#search-input', 'salary');

    // Should filter results
    await expect(page.locator('#assignment-card-002')).toBeVisible();
  });

  test('should show empty state when no results match', async ({ page }) => {
    await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

    await page.fill('#search-input', 'zzzznonexistent');

    await expect(page.locator('text=No assignments found')).toBeVisible();
    await expect(page.locator('#clear-filters')).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

    // Set filters
    await page.fill('#search-input', 'zzzznonexistent');
    await expect(page.locator('text=No assignments found')).toBeVisible();

    // Clear
    await page.click('#clear-filters');
    await expect(page.locator('#assignments-grid')).toBeVisible();
  });

  test('should navigate to assignment on card click', async ({ page }) => {
    await expect(page.locator('#assignments-grid')).toBeVisible({ timeout: 15000 });

    // Click first assignment
    await page.click('#assignment-card-001');

    // Should navigate to assignment page
    await expect(page).toHaveURL(/\/assignment\//);
    await expect(page.locator('#back-button')).toBeVisible();
  });
});
