import { useState, useRef, useEffect } from 'react';
import type { StaticBanner as StaticBannerType } from '../../types';
import { cn } from '../../utils';

interface StaticBannerProps {
  banner: StaticBannerType;
  className?: string;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}

export const StaticBanner = ({ 
  banner, 
  className, 
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1600px) 1570px, 1570px'
}: StaticBannerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading otimizado
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Começa a carregar 50px antes de aparecer
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const BannerContent = () => (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden bg-gray-100',
        'aspect-[1570/261]', // Mantém proporção 1570x261
        className
      )}
      style={{
        maxWidth: '1570px',
        maxHeight: '261px'
      }}
      data-testid="static-banner"
    >
      {/* Placeholder durante carregamento */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Estado de erro */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-sm font-medium">Erro ao carregar imagem</div>
            <div className="text-xs mt-1">{banner.title || 'Banner'}</div>
          </div>
        </div>
      )}

      {/* Imagem */}
      {isInView && (
        <img
          ref={imgRef}
          src={banner.imageUrl}
          alt={banner.alt}
          title={banner.title}
          loading={loading}
          sizes={sizes}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          // Preload hint para imagens prioritárias
          {...(banner.priority && { fetchPriority: 'high' as const })}
        />
      )}

      {/* Overlay para melhor contraste se houver título */}
      {banner.title && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      )}

      {/* Título opcional */}
      {banner.title && (
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-semibold drop-shadow-lg">
            {banner.title}
          </h3>
        </div>
      )}
    </div>
  );

  // Se tiver link, envolver em <a>
  if (banner.link) {
    return (
      <a
        href={banner.link}
        className="block w-full transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label={banner.title ? `${banner.title} - ${banner.alt}` : banner.alt}
      >
        <BannerContent />
      </a>
    );
  }

  return <BannerContent />;
};