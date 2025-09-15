import { test, expect } from '@playwright/test';

test.describe('Header Checkout Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open cart drawer when "Finalizar sua compra" button is clicked', async ({ page }) => {
    // Click the header checkout button
    const checkoutButton = page.getByText('Finalizar sua compra');
    await expect(checkoutButton).toBeVisible();
    
    // Click the button
    await checkoutButton.click();
    
    // Should open the cart drawer
    const cartDrawer = page.locator('[data-testid="cart-drawer"]');
    await expect(cartDrawer).toBeVisible();
    
    // Should show "Seu carrinho está vazio" since no items were added
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
  });
});