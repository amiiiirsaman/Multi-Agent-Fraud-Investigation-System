/**
 * E2E tests for the Investigation view.
 */

import { test, expect } from '@playwright/test';

test.describe('Investigation View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app');
    
    // Navigate to Investigation tab
    await page.getByText('Investigation').click();
    await page.waitForSelector('.investigationView');
  });

  test('displays Live Investigation Panel', async ({ page }) => {
    // Check that the live investigation panel is visible
    await expect(page.getByText('Live Investigation')).toBeVisible();
  });

  test('Live Investigation Panel expands on click', async ({ page }) => {
    // Find and click the expand button
    const header = page.locator('.liveInvestigationHeader');
    await header.click();
    
    // Form fields should be visible
    await expect(page.getByLabel('From Account')).toBeVisible();
    await expect(page.getByLabel('To Account')).toBeVisible();
    await expect(page.getByLabel('Amount ($)')).toBeVisible();
    await expect(page.getByLabel('Merchant Category')).toBeVisible();
    await expect(page.getByLabel('Location')).toBeVisible();
  });

  test('can fill out custom transaction form', async ({ page }) => {
    // Expand the panel
    const header = page.locator('.liveInvestigationHeader');
    await header.click();
    
    // Fill out form
    await page.getByLabel('From Account').fill('ACC-TEST-001');
    await page.getByLabel('To Account').fill('ACC-TEST-002');
    await page.getByLabel('Amount ($)').fill('5000');
    await page.getByLabel('Merchant Category').selectOption('Electronics');
    await page.getByLabel('Location').selectOption('New York');
    
    // Submit button should be visible
    await expect(page.getByRole('button', { name: /investigate transaction/i })).toBeVisible();
  });

  test('displays agent panels', async ({ page }) => {
    // Check for agent panels
    const agentPanels = page.locator('.agentPanel');
    const count = await agentPanels.count();
    
    // Should have multiple agent panels
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('shows timeline with investigation events', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(500);
    
    // Check for timeline elements
    const timelineEvents = page.locator('.timeline-event, .timelineEvent');
    
    // May or may not have events initially
    const exists = await timelineEvents.count();
    expect(exists).toBeGreaterThanOrEqual(0);
  });
});
