import { test, expect } from '@playwright/test';

test.describe('Complete Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full checkout process from cart icon to final order', async ({ page }) => {
    // 1. Add products to cart
    await test.step('Add products to cart', async () => {
      // Wait for products to load
      await page.waitForSelector('[data-testid="product-card"]');
      
      // Add first product to cart
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await firstProduct.locator('[data-testid="add-to-cart-btn"]').click();
      
      // Add second product to cart
      const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
      await secondProduct.locator('[data-testid="add-to-cart-btn"]').click();
      
      // Verify cart badge shows correct count
      await expect(page.locator('[data-testid="cart-icon"]')).toContainText('2');
    });

    // 2. Open cart drawer by clicking cart icon
    await test.step('Open cart drawer', async () => {
      await page.locator('[data-testid="cart-icon"]').click();
      
      // Wait for drawer to appear
      await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
      
      // Verify cart items are displayed
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    });

    // 3. Verify cart functionality
    await test.step('Test cart item operations', async () => {
      // Test quantity increase
      const firstItem = page.locator('[data-testid="cart-item"]').first();
      const increaseBtn = firstItem.locator('[data-testid="increase-quantity"]');
      await increaseBtn.click();
      
      // Verify quantity updated
      await expect(firstItem.locator('[data-testid="quantity-display"]')).toContainText('2');
      await expect(page.locator('[data-testid="cart-icon"]')).toContainText('3');
      
      // Test quantity decrease
      const decreaseBtn = firstItem.locator('[data-testid="decrease-quantity"]');
      await decreaseBtn.click();
      await expect(firstItem.locator('[data-testid="quantity-display"]')).toContainText('1');
      
      // Verify total calculations are shown
      await expect(page.locator('[data-testid="cart-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-cost"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
    });

    // 4. Navigate to checkout
    await test.step('Navigate to checkout page', async () => {
      await page.locator('[data-testid="checkout-button"]').click();
      
      // Verify we're on checkout page
      await expect(page).toHaveURL('/checkout');
      await expect(page.locator('text=Finalizar Compra')).toBeVisible();
    });

    // 5. Verify checkout page elements
    await test.step('Verify checkout page structure', async () => {
      // Check step indicator
      await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
      
      // Verify current step is checkout
      await expect(page.locator('text=Checkout')).toHaveClass(/text-\[#72C7DA\]/);
      
      // Check order summary sidebar
      await expect(page.locator('text=Itens do Pedido')).toBeVisible();
      
      // Verify cart items are displayed in summary
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
      
      // Check delivery information form area
      await expect(page.locator('text=Informações de Entrega')).toBeVisible();
    });

    // 6. Proceed to payment step
    await test.step('Proceed to payment', async () => {
      await page.locator('text=Continuar para Pagamento').click();
      
      // Verify step indicator updated
      await expect(page.locator('text=Finalizar')).toHaveClass(/text-\[#72C7DA\]/);
      
      // Check payment section is visible
      await expect(page.locator('text=Finalizar Pedido')).toBeVisible();
      await expect(page.locator('text=Pronto para finalizar!')).toBeVisible();
    });

    // 7. Complete the order
    await test.step('Complete order', async () => {
      // Setup alert handler
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Pedido finalizado com sucesso!');
        await dialog.accept();
      });
      
      await page.locator('text=🎉 Finalizar Compra').click();
      
      // Should redirect back to home
      await expect(page).toHaveURL('/');
    });

    // 8. Verify cart is cleared after order
    await test.step('Verify cart cleared', async () => {
      // Cart badge should not be visible (no items)
      await expect(page.locator('[data-testid="cart-icon"] span')).not.toBeVisible();
    });
  });

  test('should handle empty cart redirect', async ({ page }) => {
    // Try to access checkout directly with empty cart
    await page.goto('/checkout');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
  });

  test('should allow back navigation during checkout', async ({ page }) => {
    // Add product to cart first
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="add-to-cart-btn"]').click();
    
    // Go to checkout
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('[data-testid="checkout-button"]').click();
    
    // Proceed to payment step
    await page.locator('text=Continuar para Pagamento').click();
    
    // Use back button
    await page.locator('text=Voltar').click();
    
    // Should be back to checkout step
    await expect(page.locator('text=Informações de Entrega')).toBeVisible();
    
    // Use header back button
    await page.locator('text=Voltar às compras').click();
    
    // Should be back to home
    await expect(page).toHaveURL('/');
  });

  test('should persist cart state across page refreshes', async ({ page }) => {
    // Add products to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="add-to-cart-btn"]').click();
    
    // Refresh the page
    await page.reload();
    
    // Cart should still show items
    await expect(page.locator('[data-testid="cart-icon"]')).toContainText('1');
    
    // Open drawer and verify item is still there
    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('should handle cart drawer close operations', async ({ page }) => {
    // Add product and open drawer
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="add-to-cart-btn"]').click();
    await page.locator('[data-testid="cart-icon"]').click();
    
    // Verify drawer is open
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    
    // Close with close button
    await page.locator('[data-testid="close-drawer"]').click();
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible();
    
    // Reopen and close with overlay click
    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    
    // Click overlay area (outside drawer)
    await page.locator('[data-testid="drawer-overlay"]').click({ position: { x: 50, y: 50 } });
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible();
    
    // Test escape key
    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible();
  });
});