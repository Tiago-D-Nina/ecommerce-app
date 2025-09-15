import { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { CategoryNav } from '../ui/CategoryNav';
import { useProducts } from '../../hooks/useProducts';
import { cn } from '../../utils';

export const ProductShelf = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  
  const { products, loading, error } = useProducts(selectedCategory);

  const { paginatedProducts, totalPages } = useMemo(() => {
    const ITEMS_PER_PAGE = 4;
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return {
      paginatedProducts: products.slice(startIndex, endIndex),
      totalPages: Math.ceil(products.length / ITEMS_PER_PAGE)
    };
  }, [products, currentPage]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(0); // Reset to first page when category changes
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <section className="py-8">
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="mb-6 bg-white border-b border-gray-200 -mx-4 px-4">
          <CategoryNav onCategoryChange={handleCategoryChange} />
        </div>

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">
              Erro ao carregar produtos: {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum produto encontrado nesta categoria.
            </p>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-200 cursor-pointer border-2 border-[#BCBCBC]',
                  currentPage === index
                    ? 'bg-[#333] !border-[#333]'
                    : 'hover:bg-gray-300'
                )}
                aria-label={`Ir para página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};