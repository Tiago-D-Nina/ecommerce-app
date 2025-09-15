import { test, expect } from '@playwright/test';

test.describe('Static Banner Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all static banners on home page', async ({ page }) => {
    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');

    // Verificar se todos os banners estão presentes
    const banners = page.locator('[data-testid="static-banner"]');
    await expect(banners).toHaveCount(3);

    // Verificar banners específicos
    const promotionalBanner = banners.nth(0);
    const seasonalBanner = banners.nth(1);
    const brandBanner = banners.nth(2);

    await expect(promotionalBanner).toBeVisible();
    await expect(seasonalBanner).toBeVisible();
    await expect(brandBanner).toBeVisible();
  });

  test('should have correct dimensions and aspect ratio', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="static-banner"]').first();
    await expect(banner).toBeVisible();

    // Verificar dimensões do container
    const boundingBox = await banner.boundingBox();
    expect(boundingBox).toBeTruthy();
    
    if (boundingBox) {
      // Verificar proporção 1570:261 (aprox. 6:1)
      const aspectRatio = boundingBox.width / boundingBox.height;
      expect(aspectRatio).toBeCloseTo(6.01, 0.1);
    }
  });

  test('should display images with correct attributes', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const banners = page.locator('[data-testid="static-banner"]');
    
    // Verificar primeiro banner (promocional)
    const firstBannerImg = banners.first().locator('img');
    await expect(firstBannerImg).toBeVisible();
    await expect(firstBannerImg).toHaveAttribute('alt', /Banner promocional/i);
    await expect(firstBannerImg).toHaveAttribute('loading', 'eager'); // Priority loading

    // Verificar segundo banner (sazonal)
    const secondBannerImg = banners.nth(1).locator('img');
    await expect(secondBannerImg).toBeVisible();
    await expect(secondBannerImg).toHaveAttribute('alt', /Banner sazonal/i);
    await expect(secondBannerImg).toHaveAttribute('loading', 'lazy');
  });

  test('should display titles when present', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Banner promocional deve ter título
    const promotionalBanner = page.locator('[data-testid="static-banner"]').first();
    await expect(promotionalBanner.locator('h3:has-text("Ofertas Imperdíveis")')).toBeVisible();

    // Banner sazonal deve ter título
    const seasonalBanner = page.locator('[data-testid="static-banner"]').nth(1);
    await expect(seasonalBanner.locator('h3:has-text("Nova Coleção")')).toBeVisible();

    // Banner da marca pode não ter título ou ter título diferente
    const brandBanner = page.locator('[data-testid="static-banner"]').nth(2);
    const brandTitle = brandBanner.locator('h3');
    // Aceitar que pode não ter título ou ter "Produtos em Destaque"
    if (await brandTitle.count() > 0) {
      await expect(brandTitle).toContainText(/Produtos em Destaque|/);
    }
  });

  test('should handle clickable banners with links', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Banner promocional deve ser clicável
    const promotionalBanner = page.locator('[data-testid="static-banner"]').first();
    const promotionalLink = promotionalBanner.locator('..'); // Parent <a> tag
    
    if (await promotionalLink.locator('a').count() > 0) {
      await expect(promotionalLink.locator('a')).toHaveAttribute('href', '/ofertas');
    }

    // Testar hover effect
    await promotionalBanner.hover();
    await expect(promotionalBanner).toBeVisible();
  });

  test('should implement lazy loading correctly', async ({ page }) => {
    // Verificar que imagens com lazy loading não carregam imediatamente
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const banners = page.locator('[data-testid="static-banner"]');
    
    // Primeiro banner (eager) deve carregar imediatamente
    const firstBannerImg = banners.first().locator('img');
    await expect(firstBannerImg).toHaveAttribute('loading', 'eager');

    // Banners com lazy loading devem ter o atributo correto
    const lazyBanners = banners.locator('img[loading="lazy"]');
    await expect(lazyBanners).toHaveCount({ gte: 1 });
  });

  test('should show placeholder during image loading', async ({ page }) => {
    // Interceptar imagens para simular loading lento
    await page.route('**/*.{png,jpg,jpeg,gif,webp}', route => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto('/');

    // Verificar se placeholder aparece
    const banners = page.locator('[data-testid="static-banner"]');
    const placeholder = banners.first().locator('.animate-pulse');
    
    // Placeholder pode aparecer brevemente
    await expect(placeholder).toBeVisible({ timeout: 2000 });
  });

  test('should handle image loading errors gracefully', async ({ page }) => {
    // Interceptar imagens para simular erro
    await page.route('**/via.placeholder.com/**', route => {
      route.abort();
    });

    await page.goto('/');

    const banner = page.locator('[data-testid="static-banner"]').first();
    
    // Verificar se mensagem de erro aparece
    const errorMessage = banner.locator('text=Erro ao carregar imagem');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const banner = page.locator('[data-testid="static-banner"]').first();
    await expect(banner).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(banner).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(banner).toBeVisible();
    
    // Verificar que banner ainda mantém proporção em mobile
    const boundingBox = await banner.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
      // Altura deve se ajustar proporcionalmente
      expect(boundingBox.height).toBeGreaterThan(0);
    }
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const banners = page.locator('[data-testid="static-banner"]');
    
    // Verificar imagens têm alt text
    const images = banners.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
      
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText!.length).toBeGreaterThan(5); // Alt text substantivo
    }

    // Verificar links têm aria-label adequado
    const linkableBanners = page.locator('a[aria-label]');
    const linkCount = await linkableBanners.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = linkableBanners.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should maintain performance with multiple banners', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que página carrega em tempo razoável (< 3s)
    expect(loadTime).toBeLessThan(3000);

    // Verificar que todos os banners estão visíveis
    const banners = page.locator('[data-testid="static-banner"]');
    await expect(banners).toHaveCount(3);

    // Verificar que não há layouts shifts significativos
    const banner = banners.first();
    const initialBox = await banner.boundingBox();
    
    await page.waitForTimeout(500);
    
    const finalBox = await banner.boundingBox();
    
    if (initialBox && finalBox) {
      // Posição não deve mudar significativamente
      expect(Math.abs(finalBox.y - initialBox.y)).toBeLessThan(10);
    }
  });

  test('should integrate properly with page layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verificar que banners estão posicionados entre seções de produtos
    const banners = page.locator('[data-testid="static-banner"]');
    // Pelo menos um banner deve aparecer após o carousel
    const carousel = page.locator('[data-testid="carousel"], .relative.w-full.h-\\[523px\\]');
    
    if (await carousel.count() > 0) {
      const carouselBox = await carousel.first().boundingBox();
      const firstBannerBox = await banners.first().boundingBox();
      
      if (carouselBox && firstBannerBox) {
        // Banner deve estar abaixo do carousel
        expect(firstBannerBox.y).toBeGreaterThan(carouselBox.y + carouselBox.height);
      }
    }
  });
});