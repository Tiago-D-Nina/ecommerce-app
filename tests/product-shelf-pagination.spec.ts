import { test, expect } from '@playwright/test';

test.describe('ProductShelf Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should not display "Ver mais produtos" button', async ({ page }) => {
    const verMaisButton = page.locator('button').filter({ hasText: 'Ver mais produtos' });
    await expect(verMaisButton).not.toBeVisible();
  });

  test('should display pagination dots when there are multiple pages', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Check if dots are visible
    const dots = page.locator('button[aria-label*="Ir para página"]');
    const dotCount = await dots.count();
    
    if (dotCount > 0) {
      await expect(dots.first()).toBeVisible();
      
      // Verify dots have correct styling
      const firstDot = dots.first();
      await expect(firstDot).toHaveClass(/w-3 h-3 rounded-full/);
    }
  });

  test('should change page when clicking pagination dots', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    const dots = page.locator('button[aria-label*="Ir para página"]');
    const dotCount = await dots.count();
    
    if (dotCount > 1) {
      // Get products from first page
      const firstPageProducts = page.locator('[data-testid="product-card"] h3');
      const firstPageProductNames = await firstPageProducts.allTextContents();
      
      // Click second page dot
      await dots.nth(1).click();
      
      // Wait for page change
      await page.waitForTimeout(500);
      
      // Get products from second page
      const secondPageProducts = page.locator('[data-testid="product-card"] h3');
      const secondPageProductNames = await secondPageProducts.allTextContents();
      
      // Products should be different
      expect(firstPageProductNames).not.toEqual(secondPageProductNames);
      
      // Second dot should be active
      await expect(dots.nth(1)).toHaveClass(/bg-\[#333\]/);
    }
  });

  test('should reset pagination when category changes', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    const dots = page.locator('button[aria-label*="Ir para página"]');
    const dotCount = await dots.count();
    
    if (dotCount > 1) {
      // Go to second page
      await dots.nth(1).click();
      await expect(dots.nth(1)).toHaveClass(/bg-\[#333\]/);
      
      // Change category
      const laticíniosButton = page.locator('button').filter({ hasText: /^LATICÍNIOS$/ });
      await laticíniosButton.click();
      
      // First dot should be active again
      const newDots = page.locator('button[aria-label*="Ir para página"]');
      if (await newDots.count() > 0) {
        await expect(newDots.first()).toHaveClass(/bg-\[#333\]/);
      }
    }
  });

  test('should show correct number of products per page', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    const products = page.locator('[data-testid="product-card"]');
    const productCount = await products.count();
    
    // Should show maximum 4 products per page
    expect(productCount).toBeLessThanOrEqual(4);
    expect(productCount).toBeGreaterThan(0);
  });

  test('should maintain dot styling consistency with carousel', async ({ page }) => {
    // Check carousel dots styling
    const carouselDots = page.locator('.absolute.bottom-4 button');
    const shelfDots = page.locator('button[aria-label*="Ir para página"]');
    
    if (await carouselDots.count() > 0 && await shelfDots.count() > 0) {
      const carouselDot = carouselDots.first();
      const shelfDot = shelfDots.first();
      
      // Both should have similar base classes
      await expect(carouselDot).toHaveClass(/w-3 h-3 rounded-full/);
      await expect(shelfDot).toHaveClass(/w-3 h-3 rounded-full/);
      
      // Both should have similar border styling
      await expect(carouselDot).toHaveClass(/border-2 border-\[#BCBCBC\]/);
      await expect(shelfDot).toHaveClass(/border-2 border-\[#BCBCBC\]/);
    }
  });
});