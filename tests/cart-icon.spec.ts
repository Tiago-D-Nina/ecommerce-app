import { test, expect } from '@playwright/test';

test.describe('Cart Icon Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should display cart icon without badge when cart is empty', async ({ page }) => {
    const cartIcon = page.locator('button').filter({ has: page.locator('[data-testid="cart-icon"]') }).first();
    await expect(cartIcon).toBeVisible();
    
    const badge = page.locator('span').filter({ hasText: /^\d+$/ });
    await expect(badge).not.toBeVisible();
  });

  test('should display badge with correct item count when items are added', async ({ page }) => {
    const addButtons = page.locator('button').filter({ hasText: 'Adicionar ao Carrinho' });
    await addButtons.first().click();
    
    const badge = page.locator('span').filter({ hasText: '1' });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('background-color', 'rgb(114, 199, 218)');
  });

  test('should update badge count when multiple items are added', async ({ page }) => {
    const addButtons = page.locator('button').filter({ hasText: 'Adicionar ao Carrinho' });
    
    await addButtons.first().click();
    await addButtons.nth(1).click();
    await addButtons.nth(2).click();
    
    const badge = page.locator('span').filter({ hasText: '3' });
    await expect(badge).toBeVisible();
  });

  test('should show "99+" when item count exceeds 99', async ({ page }) => {
    for (let i = 0; i < 25; i++) {
      const addButtons = page.locator('button').filter({ hasText: 'Adicionar ao Carrinho' });
      await addButtons.first().click();
      await addButtons.nth(1).click();
      await addButtons.nth(2).click();
      await addButtons.nth(3).click();
    }
    
    const badge = page.locator('span').filter({ hasText: '99+' });
    await expect(badge).toBeVisible();
  });

  test('should have correct styling and positioning', async ({ page }) => {
    const addButton = page.locator('button').filter({ hasText: 'Adicionar ao Carrinho' }).first();
    await addButton.click();
    
    const cartIcon = page.locator('[data-lucide="shopping-cart"]');
    await expect(cartIcon).toBeVisible();
    await expect(cartIcon).toHaveClass(/h-6 w-6/);
    
    const badge = page.locator('span').filter({ hasText: '1' });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('position', 'absolute');
    await expect(badge).toHaveCSS('border-radius', '9999px');
  });
});