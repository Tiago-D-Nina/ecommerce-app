import { useState, useEffect } from 'react';
import productsService from '../services/products';
import type { Product } from '../types';

export const useProducts = (categoryId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading products for category:', categoryId);
      const startTime = Date.now();
      
      let data: Product[];
      if (!categoryId || categoryId === 'all') {
        data = await productsService.getAllProducts({ status: 'published' });
      } else {
        data = await productsService.getProductsByCategory(categoryId);
      }
      
      const endTime = Date.now();
      console.log(`⏱️ Products loaded in ${endTime - startTime}ms:`, data.length);
      
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (productId: string): Promise<Product | null> => {
    try {
      return await productsService.getProductById(productId);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  };

  const getProductsByCategory = async (category: string): Promise<Product[]> => {
    try {
      if (category === 'all') {
        return await productsService.getAllProducts({ status: 'published' });
      }
      return await productsService.getProductsByCategory(category);
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      return [];
    }
  };

  const searchProducts = async (query: string): Promise<Product[]> => {
    try {
      if (!query.trim()) {
        return await productsService.getAllProducts({ status: 'published' });
      }
      return await productsService.searchProducts(query);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  };

  const getFeaturedProducts = async (limit = 8): Promise<Product[]> => {
    try {
      return await productsService.getFeaturedProducts(limit);
    } catch (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      return [];
    }
  };

  return {
    products,
    loading,
    error,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getFeaturedProducts,
    refetch: loadProducts
  };
};