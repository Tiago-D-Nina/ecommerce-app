import { test, expect } from '@playwright/test';

test.describe('ViaCEP API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should fetch and display real CEP data from ViaCEP API', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Abrir popup
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    await expect(popup).toBeVisible();

    const input = popup.locator('input[type="text"]');
    const confirmButton = popup.locator('button:has-text("Confirmar")');

    // Usar um CEP real do centro de São Paulo
    await input.fill('01310100');
    await confirmButton.click();

    // Verificar se mostra loading
    const loadingButton = popup.locator('button:has-text("Buscando...")');
    await expect(loadingButton).toBeVisible();

    // Aguardar resposta da API (máximo 10 segundos)
    await expect(popup).not.toBeVisible({ timeout: 10000 });

    // Verificar se o CEP foi salvo e é exibido corretamente
    await expect(cepComponent.locator('text=São Paulo, SP')).toBeVisible();

    // Verificar se foi salvo no sessionStorage
    const sessionData = await page.evaluate(() => {
      const data = sessionStorage.getItem('cep-storage');
      return data ? JSON.parse(data) : null;
    });

    expect(sessionData).toBeTruthy();
    expect(sessionData.state.cep).toBe('01310-100');
    expect(sessionData.state.data).toBeTruthy();
    expect(sessionData.state.data.city).toBe('São Paulo');
    expect(sessionData.state.data.stateCode).toBe('SP');
  });

  test('should handle invalid CEP with error message', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    
    const input = popup.locator('input[type="text"]');
    const confirmButton = popup.locator('button:has-text("Confirmar")');

    // Usar um CEP inválido
    await input.fill('99999999');
    await confirmButton.click();

    // Verificar loading
    await expect(popup.locator('button:has-text("Buscando...")')).toBeVisible();

    // Aguardar mensagem de erro
    const errorMessage = popup.locator('text=CEP não encontrado');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Verificar que o popup continua aberto para correção
    await expect(popup).toBeVisible();
  });

  test('should allow changing CEP when one is already saved', async ({ page }) => {
    // Configurar CEP existente no sessionStorage
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

    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Verificar se mostra o CEP salvo
    await expect(cepComponent.locator('text=São Paulo, SP')).toBeVisible();
    
    // Verificar se mostra o ícone de editar
    await expect(cepComponent.locator('svg').nth(1)).toBeVisible(); // Edit icon

    // Abrir popup para alterar
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    
    // Verificar se mostra "Alterar CEP" ao invés de "Informe seu CEP"
    await expect(popup.locator('text=Alterar CEP')).toBeVisible();
    
    // Verificar se mostra informações do CEP atual
    await expect(popup.locator('text=CEP: 01310-100')).toBeVisible();
    await expect(popup.locator('text=Localização: São Paulo, SP')).toBeVisible();

    const input = popup.locator('input[type="text"]');
    const alterButton = popup.locator('button:has-text("Alterar")');

    // Alterar para outro CEP (Centro do Rio de Janeiro)
    await input.clear();
    await input.fill('20040020');
    await alterButton.click();

    // Aguardar nova busca
    await expect(popup.locator('button:has-text("Buscando...")')).toBeVisible();
    await expect(popup).not.toBeVisible({ timeout: 10000 });

    // Verificar se atualizou para o novo CEP
    await expect(cepComponent.locator('text=Rio de Janeiro, RJ')).toBeVisible();
  });

  test('should show loading state during API request', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    
    const input = popup.locator('input[type="text"]');
    const confirmButton = popup.locator('button:has-text("Confirmar")');

    await input.fill('01310100');
    await confirmButton.click();

    // Verificar elementos de loading
    const loadingButton = popup.locator('button:has-text("Buscando...")');
    const spinner = popup.locator('svg.animate-spin');
    
    await expect(loadingButton).toBeVisible();
    await expect(spinner).toBeVisible();
    
    // Verificar que input e botão ficam desabilitados
    await expect(input).toBeDisabled();
    await expect(popup.locator('button:has-text("Fechar")')).toBeDisabled();
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Interceptar requisições para simular timeout
    await page.route('https://viacep.com.br/ws/**', async () => {
      // Simular timeout não respondendo
      await new Promise(resolve => setTimeout(resolve, 15000));
    });

    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    
    const input = popup.locator('input[type="text"]');
    const confirmButton = popup.locator('button:has-text("Confirmar")');

    await input.fill('01310100');
    await confirmButton.click();

    // Aguardar mensagem de timeout
    const timeoutMessage = popup.locator('text=Tempo limite da requisição excedido');
    await expect(timeoutMessage).toBeVisible({ timeout: 15000 });
  });

  test('should persist CEP data across page refreshes', async ({ page }) => {
    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Fazer busca de CEP
    await cepComponent.hover();
    const popup = page.locator('[data-testid="cep-popup"]');
    const input = popup.locator('input[type="text"]');
    
    await input.fill('01310100');
    await popup.locator('button:has-text("Confirmar")').click();
    
    // Aguardar conclusão
    await expect(popup).not.toBeVisible({ timeout: 10000 });
    await expect(cepComponent.locator('text=São Paulo, SP')).toBeVisible();

    // Recarregar página
    await page.reload();
    
    // Verificar se CEP persistiu
    const reloadedCepComponent = page.locator('[data-testid="cep-component"]').first();
    await expect(reloadedCepComponent.locator('text=São Paulo, SP')).toBeVisible();
  });

  test('should work properly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const cepComponent = page.locator('[data-testid="cep-component"]').first();
    
    // Em mobile, usar click
    await cepComponent.click();
    
    const popup = page.locator('[data-testid="cep-popup"]');
    await expect(popup).toBeVisible();

    const input = popup.locator('input[type="text"]');
    await input.fill('01310100');
    
    const confirmButton = popup.locator('button:has-text("Confirmar")');
    await confirmButton.click();

    await expect(popup).not.toBeVisible({ timeout: 10000 });
    await expect(cepComponent.locator('text=São Paulo, SP')).toBeVisible();
  });
});