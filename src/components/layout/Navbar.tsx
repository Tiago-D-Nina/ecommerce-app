import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CepPopup } from '../ui/CepPopup';
import { cn } from '../../utils';
import { CategoriesService } from '../../services/categories';
import type { Category } from '../../types';

export const Navbar = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesService = new CategoriesService();
      // Carregar apenas categorias principais que têm subcategorias (para o navbar)
      const allCategories = await categoriesService.getAllCategories(true);
      
      // Filtrar apenas categorias que têm subcategorias para mostrar no navbar
      const categoriesWithSubs = allCategories.filter(cat => 
        cat.subcategories && cat.subcategories.length > 0
      );
      
      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Em caso de erro, usar categorias vazias 
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1B272C] text-white">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center h-12">
            <CepPopup />
            <div className="flex justify-center w-full">
              <div className="animate-pulse h-4 bg-gray-600 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1B272C] text-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center h-12 relative">
          <CepPopup />

          <nav className="w-full justify-center flex items-center gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(category.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 text-sm font-medium hover:bg-primary-700 rounded transition-colors duration-200 uppercase',
                    activeDropdown === category.id && 'bg-primary-700'
                  )}
                >
                  <span>{category.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {activeDropdown === category.id && category.subcategories && (
                  <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                    {category.subcategories.map((subcategory) => (
                      <a
                        key={subcategory.id}
                        href={`/categoria/${subcategory.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        {subcategory.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};