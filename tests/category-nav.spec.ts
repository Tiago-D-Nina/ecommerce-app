import { test, expect } from '@playwright/test';

test.describe('CategoryNav Component in ProductShelf', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should display "CORREDORES" title', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: 'CORREDORES' });
    await expect(title).toBeVisible();
    await expect(title).toHaveClass(/font-bold uppercase/);
  });

  test('should display all category buttons', async ({ page }) => {
    const categories = [
      'PET', 'NOVIDADES', 'LATICÍNIOS', 'MASSAS', 'ENLATADOS', 
      'DOCES', 'BEBIDAS', 'SABÃO', 'HIGIENE', 'CABELO', 
      'LIMPEZA', 'PELE', 'MAMÃE E BEBÊ'
    ];

    for (const category of categories) {
      const button = page.locator('button').filter({ hasText: new RegExp(`^${category}$`) });
      await expect(button).toBeVisible();
    }
  });

  test('should have PET category active by default', async ({ page }) => {
    const petButton = page.locator('button').filter({ hasText: /^PET$/ });
    await expect(petButton).toHaveClass(/text-\[#72C7DA\]/);
    
    const indicator = petButton.locator('span.bg-\\[\\#72C7DA\\]');
    await expect(indicator).toBeVisible();
  });

  test('should change active category when clicked and update products', async ({ page }) => {
    const laticíniosButton = page.locator('button').filter({ hasText: /^LATICÍNIOS$/ });
    await laticíniosButton.click();
    
    await expect(laticíniosButton).toHaveClass(/text-\[#72C7DA\]/);
    
    const indicator = laticíniosButton.locator('span.bg-\\[\\#72C7DA\\]');
    await expect(indicator).toBeVisible();
    
    // Verificar se produtos de laticínios aparecem
    await expect(page.locator('text=Leite Integral 1L')).toBeVisible();
    await expect(page.locator('text=Queijo Mussarela 500g')).toBeVisible();
  });

  test('should remove active state from previous category', async ({ page }) => {
    const petButton = page.locator('button').filter({ hasText: /^PET$/ });
    const laticíniosButton = page.locator('button').filter({ hasText: /^LATICÍNIOS$/ });
    
    await laticíniosButton.click();
    
    await expect(petButton).toHaveClass(/text-black/);
    await expect(laticíniosButton).toHaveClass(/text-\[#72C7DA\]/);
  });

  test('should have proper styling and layout', async ({ page }) => {
    const container = page.locator('div').filter({ has: page.locator('h2:text("CORREDORES")') }).first();
    await expect(container).toHaveClass(/flex items-center gap-8/);
    
    const categoryContainer = page.locator('div').filter({ has: page.locator('button').filter({ hasText: 'PET' }) }).first();
    await expect(categoryContainer).toHaveClass(/flex items-center gap-6/);
  });

  test('should show blue indicator line under active category', async ({ page }) => {
    const massasButton = page.locator('button').filter({ hasText: /^MASSAS$/ });
    await massasButton.click();
    
    const indicator = massasButton.locator('span');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveClass(/absolute -bottom-2 left-0 right-0 h-0\.5 bg-\[#72C7DA\]/);
  });

  test('should have uppercase text formatting', async ({ page }) => {
    const buttons = page.locator('button').filter({ hasText: /^[A-Z\s&]+$/ });
    const count = await buttons.count();
    expect(count).toBeGreaterThan(10);
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      await expect(button).toHaveClass(/uppercase/);
    }
  });
});