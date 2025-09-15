import { test, expect } from '@playwright/test';

test.describe('Email Confirmation Error Handling', () => {
  test('should show email confirmation alert with resend button for unconfirmed email', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login');
    
    // Verificar se chegou na página de login
    await expect(page.locator('h1')).toContainText('Fazer Login');
    
    // Simular um login com email não confirmado
    // (Esta seria uma simulação - em produção seria necessário mockar o Supabase)
    await page.fill('[placeholder="seu@email.com"]', 'teste@email.com');
    await page.fill('[placeholder="Sua senha"]', 'senha123');
    
    // Interceptar a requisição do Supabase para simular erro de email não confirmado
    await page.route('**/auth/v1/**', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      
      // Simular resposta de email não confirmado
      if (route.request().url().includes('token')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email not confirmed',
            error_description: 'Email not confirmed'
          })
        });
      } else {
        await route.continue();
      }
    });
    
    // Submeter o formulário
    await page.click('button[type="submit"]');
    
    // Aguardar o componente de erro aparecer
    await expect(page.locator('[data-testid="email-confirmation-alert"]')).toBeVisible({ timeout: 10000 });
    
    // Verificar se a mensagem de erro está correta
    await expect(page.locator('text=E-mail não confirmado')).toBeVisible();
    await expect(page.locator('text=Você precisa confirmar seu e-mail')).toBeVisible();
    
    // Verificar se o botão de reenvio está presente
    const resendButton = page.locator('button:has-text("Reenviar confirmação")');
    await expect(resendButton).toBeVisible();
    
    // Clicar no botão de reenvio
    await resendButton.click();
    
    // Verificar se o botão mostra estado de carregamento
    await expect(page.locator('button:has-text("Enviando...")')).toBeVisible({ timeout: 3000 });
    
    // Aguardar a mensagem de sucesso aparecer
    await expect(page.locator('text=Novo link de confirmação enviado')).toBeVisible({ timeout: 10000 });
  });
  
  test('should enforce rate limiting on resend button', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login');
    
    // Simular cenário onde o rate limiting já foi acionado
    // Adicionar um timestamp recente no localStorage
    const recentTimestamp = Date.now() - 30000; // 30 segundos atrás
    await page.addInitScript(`
      localStorage.setItem('email_confirmation_sent_teste@email.com', '${recentTimestamp}');
    `);
    
    // Recarregar para aplicar o localStorage
    await page.reload();
    
    // Preencher o formulário e tentar fazer login (simulando email não confirmado)
    await page.fill('[placeholder="seu@email.com"]', 'teste@email.com');
    await page.fill('[placeholder="Sua senha"]', 'senha123');
    
    // Interceptar requisições para simular email não confirmado
    await page.route('**/auth/v1/**', async (route) => {
      if (route.request().url().includes('token')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email not confirmed'
          })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.click('button[type="submit"]');
    
    // Aguardar o alerta aparecer
    await expect(page.locator('[data-testid="email-confirmation-alert"]')).toBeVisible();
    
    // Verificar se o botão de reenvio está desabilitado com contador
    const resendButton = page.locator('button:has-text("Aguarde")');
    await expect(resendButton).toBeVisible();
    await expect(resendButton).toBeDisabled();
    
    // Verificar se há texto explicativo sobre rate limiting
    await expect(page.locator('text=Para evitar spam, você pode reenviar')).toBeVisible();
  });
  
  test('should allow dismissing the email confirmation alert', async ({ page }) => {
    await page.goto('/login');
    
    // Simular login com email não confirmado
    await page.fill('[placeholder="seu@email.com"]', 'teste@email.com');
    await page.fill('[placeholder="Sua senha"]', 'senha123');
    
    await page.route('**/auth/v1/**', async (route) => {
      if (route.request().url().includes('token')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email not confirmed'
          })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.click('button[type="submit"]');
    
    // Aguardar o alerta aparecer
    await expect(page.locator('[data-testid="email-confirmation-alert"]')).toBeVisible();
    
    // Clicar no botão de dispensar
    const dismissButton = page.locator('button:has-text("Dispensar")');
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();
    
    // Verificar se o alerta foi removido
    await expect(page.locator('[data-testid="email-confirmation-alert"]')).not.toBeVisible();
  });
  
  test('should work correctly on register page as well', async ({ page }) => {
    await page.goto('/register');
    
    // Verificar se chegou na página de registro
    await expect(page.locator('h1')).toContainText('Criar Conta');
    
    // Preencher o formulário de registro
    await page.fill('input[placeholder="João"]', 'João');
    await page.fill('input[placeholder="Silva"]', 'Silva');
    await page.fill('input[placeholder="seu@email.com"]', 'teste@email.com');
    await page.fill('input[placeholder="Mínimo 6 caracteres"]', 'senha123');
    await page.fill('input[placeholder="Confirme sua senha"]', 'senha123');
    
    // Interceptar requisição do Supabase para simular necessidade de confirmação
    await page.route('**/auth/v1/**', async (route) => {
      if (route.request().url().includes('signup')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: 'teste@email.com',
              email_confirmed_at: null // Email não confirmado
            }
          })
        });
      } else {
        await route.continue();
      }
    });
    
    // Submeter o formulário
    await page.click('button[type="submit"]');
    
    // Aguardar a mensagem de confirmação aparecer
    await expect(page.locator('text=Um link de confirmação foi enviado')).toBeVisible();
  });
});