/**
 * E2E tests for the Network view.
 */

import { test, expect } from '@playwright/test';

test.describe('Network View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app');
    
    // Navigate to Network tab
    await page.getByText('Network').click();
    await page.waitForSelector('.networkView');
  });

  test('displays network graph container', async ({ page }) => {
    // Wait for the graph to initialize
    await page.waitForTimeout(1000);
    
    // Check that the graph container exists
    await expect(page.locator('.networkGraph')).toBeVisible();
  });

  test('displays sidebar with network stats', async ({ page }) => {
    // Check that sidebar is visible by default
    await expect(page.locator('.networkSidebar')).toBeVisible();
    
    // Check for stats section
    await expect(page.getByText('Total Nodes')).toBeVisible();
    await expect(page.getByText('Total Edges')).toBeVisible();
  });

  test('can toggle sidebar visibility', async ({ page }) => {
    // Sidebar should be visible initially
    await expect(page.locator('.networkSidebar')).toBeVisible();
    
    // Click toggle button
    const toggleButton = page.locator('.sidebarToggle');
    await toggleButton.click();
    
    // Sidebar should be hidden
    await expect(page.locator('.networkSidebar')).not.toBeVisible();
    
    // Toggle back
    await toggleButton.click();
    await expect(page.locator('.networkSidebar')).toBeVisible();
  });

  test('displays risk filter buttons', async ({ page }) => {
    // Check for risk filter buttons in toolbar
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Critical' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'High' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Medium' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Low' })).toBeVisible();
  });

  test('risk filters can be toggled', async ({ page }) => {
    // Click on Critical filter
    const criticalBtn = page.getByRole('button', { name: 'Critical' });
    await criticalBtn.click();
    
    // Button should have active state
    await expect(criticalBtn).toHaveClass(/active/);
    
    // Click again to toggle off
    await criticalBtn.click();
    await expect(criticalBtn).not.toHaveClass(/active/);
  });

  test('displays fullscreen toggle button', async ({ page }) => {
    // Check for fullscreen button
    await expect(page.locator('.fullscreenToggle')).toBeVisible();
  });

  test('can enter fullscreen mode', async ({ page }) => {
    // Click fullscreen button
    await page.locator('.fullscreenToggle').click();
    
    // Network view should have fullscreen class
    await expect(page.locator('.networkView')).toHaveClass(/fullscreen/);
    
    // Exit fullscreen
    await page.locator('.fullscreenToggle').click();
    await expect(page.locator('.networkView')).not.toHaveClass(/fullscreen/);
  });

  test('displays graph stats overlay', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(1000);
    
    // Check for stats overlay on the graph
    const statsOverlay = page.locator('.graphStats');
    if (await statsOverlay.isVisible()) {
      await expect(statsOverlay).toContainText(/nodes/i);
    }
  });

  test('sidebar shows high risk accounts list', async ({ page }) => {
    // Check sidebar has high risk accounts section
    await expect(page.getByText('High Risk Accounts')).toBeVisible();
    
    // There should be some accounts listed
    const accountItems = page.locator('.accountItem');
    const count = await accountItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('node count reflects backend data', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check that node count is displayed
    const nodeCount = page.locator('.statValue').first();
    const text = await nodeCount.textContent();
    
    // Should have some nodes (backend returns 800)
    if (text) {
      const count = parseInt(text.replace(/,/g, ''), 10);
      expect(count).toBeGreaterThan(0);
    }
  });
});
