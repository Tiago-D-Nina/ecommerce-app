import { test, expect } from '@playwright/test';

test.describe('CEP Popup Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display CEP component in navbar', async ({ page }) => {
    // Verificar se o componente CEP está visível
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    await expect(cepComponent).toBeVisible();

    // Verificar se o ícone MapPin está presente
    const mapIcon = cepComponent.locator('svg');
    await expect(mapIcon).toBeVisible();

    // Verificar se o texto inicial está correto
    await expect(cepComponent.locator('text=Informe seu')).toBeVisible();
    await expect(cepComponent.locator('text=CEP')).toBeVisible();
  });

  test('should open popup on hover', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Fazer hover no componente
    await cepComponent.hover();

    // Verificar se o popup abriu
    const popup = page.locator('[data-testid="cep-popup"]');
    await expect(popup).toBeVisible();

    // Verificar se o input está presente no popup
    const input = popup.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('should stay open when mouse moves to popup', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Abrir popup
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    await expect(popup).toBeVisible();

    // Mover mouse para dentro do popup
    await popup.hover();
    
    // Aguardar um pouco para garantir que o popup não feche
    await page.waitForTimeout(300);
    
    // Popup deve ainda estar visível
    await expect(popup).toBeVisible();
  });

  test('should close popup when mouse leaves with delay', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Abrir popup
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    await expect(popup).toBeVisible();

    // Mover mouse para fora do componente
    await page.mouse.move(0, 0);
    
    // Popup deve ainda estar visível por um curto período (delay)
    await expect(popup).toBeVisible();
    
    // Aguardar o delay (500ms + margem de segurança)
    await page.waitForTimeout(600);
    
    // Agora o popup deve ter fechado
    await expect(popup).not.toBeVisible();
  });

  test('should validate CEP input format', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Abrir popup
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    const input = popup.locator('input[type="text"]');

    // Digitar um CEP inválido
    await input.fill('123');
    
    // Verificar se mensagem de erro aparece
    const errorMessage = popup.locator('text=CEP deve ter 8 dígitos');
    await expect(errorMessage).toBeVisible();

    // Verificar se o botão Confirmar está desabilitado
    const confirmButton = popup.locator('button:has-text("Confirmar")');
    await expect(confirmButton).toBeDisabled();
  });

  test('should format CEP input correctly', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Abrir popup
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    const input = popup.locator('input[type="text"]');

    // Digitar um CEP válido
    await input.fill('01234567');
    
    // Verificar se foi formatado corretamente
    await expect(input).toHaveValue('01234-567');

    // Verificar se o botão Confirmar está habilitado
    const confirmButton = popup.locator('button:has-text("Confirmar")');
    await expect(confirmButton).toBeEnabled();
  });

  test('should attempt to save CEP to session storage', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Abrir popup
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    const input = popup.locator('input[type="text"]');

    // Digitar um CEP válido em formato
    await input.fill('01310100');
    const confirmButton = popup.locator('button:has-text("Confirmar")');
    await confirmButton.click();

    // Aguardar tentativa de busca (pode haver loading)
    await expect(popup.locator('button:has-text("Buscando...")')).toBeVisible();

    // Verificar se o CEP foi formatado e armazenado
    const sessionData = await page.evaluate(() => {
      const data = sessionStorage.getItem('cep-storage');
      return data ? JSON.parse(data) : null;
    });

    expect(sessionData).toBeTruthy();
    expect(sessionData.state.cep).toBe('01310-100');
  });

  test('should display saved CEP info', async ({ page }) => {
    // Configurar CEP no sessionStorage antes de carregar a página
    await page.addInitScript(() => {
      const cepData = {
        state: {
          cep: '01310-100',
          data: {
            cep: '01310-100',
            street: 'Avenida Paulista',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'São Paulo',
            stateCode: 'SP',
            region: 'Sudeste',
            ddd: '11',
            isValid: true
          },
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        },
        version: 0
      };
      sessionStorage.setItem('cep-storage', JSON.stringify(cepData));
    });

    await page.goto('/');

    // Verificar se o componente mostra a informação do CEP salvo
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    await expect(cepComponent.locator('text=São Paulo, SP')).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Configurar viewport móvel
    await page.setViewportSize({ width: 375, height: 667 });

    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Em mobile, usar click ao invés de hover
    await cepComponent.click();
    
    const popup = page.locator('[data-testid="cep-popup"]');
    await expect(popup).toBeVisible();

    // Testar funcionalidade no mobile
    const input = popup.locator('input[type="text"]');
    await input.fill('01310100');
    
    const confirmButton = popup.locator('button:has-text("Confirmar")');
    await confirmButton.click();

    // Aguardar loading
    await expect(popup.locator('button:has-text("Buscando...")')).toBeVisible();
  });
});