import { useState, useEffect } from 'react';
import { CategoriesService } from '../../services/categories';
import type { Category } from '../../types';

interface CategoryNavProps {
  className?: string;
  onCategoryChange?: (categoryId: string) => void;
}

export const CategoryNav = ({ className = '', onCategoryChange }: CategoryNavProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesService = new CategoriesService();
      const rootCategories = await categoriesService.getRootCategories();
      setCategories(rootCategories);
      
      // Set first category as active by default
      if (rootCategories.length > 0) {
        const defaultCategory = rootCategories.find(cat => cat.slug === 'pet') || rootCategories[0];
        setActiveCategory(defaultCategory.id);
        onCategoryChange?.(defaultCategory.id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-8 py-4 ${className}`}>
        <h2 className="text-black font-bold uppercase text-lg">
          CORREDORES
        </h2>
        <div className="flex items-center gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-8 py-4 ${className}`}>
      <h2 className="text-black font-bold uppercase text-lg">
        CORREDORES
      </h2>
      
      <div className="flex items-center gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`relative font-sans uppercase text-sm font-medium transition-colors ${
              activeCategory === category.id 
                ? 'text-[#72C7DA]' 
                : 'text-black hover:text-gray-600'
            }`}
          >
            {category.name.toUpperCase()}
            {activeCategory === category.id && (
              <span 
                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#72C7DA]"
                style={{ 
                  width: '100%',
                  borderRadius: '1px'
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};