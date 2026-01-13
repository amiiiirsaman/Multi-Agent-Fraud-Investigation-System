/**
 * E2E tests for the Dashboard view.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('.app');
  });

  test('displays summary cards with transaction stats', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('.summaryCards');
    
    // Check that summary cards are rendered
    const cards = await page.locator('.summaryCard').count();
    expect(cards).toBeGreaterThanOrEqual(4);
  });

  test('displays transaction table with data', async ({ page }) => {
    // Wait for transaction table to render
    await page.waitForSelector('.transactionTable');
    
    // Check that the toolbar is visible
    await expect(page.getByPlaceholder('Search transactions...')).toBeVisible();
    
    // Check that transactions are loaded
    const transactionCount = page.locator('.tableToolbar').getByText(/transactions/);
    await expect(transactionCount).toBeVisible();
  });

  test('search filters transactions', async ({ page }) => {
    await page.waitForSelector('.transactionTable');
    
    // Type in search box
    const searchInput = page.getByPlaceholder('Search transactions...');
    await searchInput.fill('TX-');
    
    // Wait for filtering to apply
    await page.waitForTimeout(300);
    
    // Table should still show results
    await expect(page.locator('.tableBody')).toBeVisible();
  });

  test('filter panel toggles on click', async ({ page }) => {
    await page.waitForSelector('.transactionTable');
    
    // Click filters button
    await page.getByText('Filters').click();
    
    // Filter panel should appear
    await expect(page.locator('.tableFilters')).toBeVisible();
    await expect(page.getByText('From Account')).toBeVisible();
    await expect(page.getByText('Merchant Category')).toBeVisible();
  });

  test('clicking transaction row opens drawer', async ({ page }) => {
    await page.waitForSelector('.transactionTable');
    
    // Click on a transaction row
    const firstRow = page.locator('.tableRow').first();
    await firstRow.click();
    
    // Drawer should open
    await expect(page.locator('.drawer')).toBeVisible();
    await expect(page.getByText('Account Information')).toBeVisible();
    await expect(page.getByText('Transaction Details')).toBeVisible();
  });

  test('drawer closes when close button is clicked', async ({ page }) => {
    await page.waitForSelector('.transactionTable');
    
    // Open drawer
    const firstRow = page.locator('.tableRow').first();
    await firstRow.click();
    await expect(page.locator('.drawer')).toBeVisible();
    
    // Close drawer
    await page.getByLabel('Close drawer').click();
    
    // Drawer should be hidden
    await expect(page.locator('.drawer')).not.toBeVisible();
  });

  test('CSV export button is functional', async ({ page }) => {
    await page.waitForSelector('.transactionTable');
    
    // Check export button exists
    const exportButton = page.getByText('Export CSV');
    await expect(exportButton).toBeVisible();
    
    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click(),
    ]);
    
    // Check that download was triggered
    expect(download.suggestedFilename()).toContain('transactions');
  });
});
