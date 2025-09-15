import { test, expect } from '@playwright/test';

test.describe('Basic Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
  });

  test('should add product to cart and show badge', async ({ page }) => {
    // Add first product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click();
    
    // Verify cart badge shows correct count
    await expect(page.locator('[data-testid="cart-icon"]')).toContainText('1');
  });

  test('should open cart drawer when cart icon is clicked', async ({ page }) => {
    // Add a product first
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click();
    
    // Click cart icon to open drawer
    await page.locator('[data-testid="cart-icon"]').click();
    
    // Wait for drawer to appear
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to checkout from cart drawer', async ({ page }) => {
    // Add a product first
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click();
    
    // Open cart drawer
    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    
    // Click checkout button
    await page.locator('[data-testid="checkout-button"]').click();
    
    // Should navigate to checkout page
    await expect(page).toHaveURL('/checkout');
  });
});