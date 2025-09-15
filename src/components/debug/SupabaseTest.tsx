import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

export const SupabaseTest = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Test categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug, is_active')
        .eq('is_active', true)
        .limit(5);

      if (categoriesError) {
        console.error('❌ Categories error:', categoriesError);
        setStatus(`Categories Error: ${categoriesError.message}`);
        return;
      }

      console.log('✅ Categories loaded:', categoriesData);
      setCategories(categoriesData || []);

      // Test products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, slug, status')
        .eq('status', 'published')
        .limit(5);

      if (productsError) {
        console.error('❌ Products error:', productsError);
        setStatus(`Products Error: ${productsError.message}`);
        return;
      }

      console.log('✅ Products loaded:', productsData);
      setProducts(productsData || []);

      setStatus('✅ Connection successful!');
    } catch (error) {
      console.error('❌ General error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-sm text-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">🧪 Supabase Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-2 hover:bg-gray-700 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
          title="Fechar debug"
        >
          ×
        </button>
      </div>
      <p className="mb-2">{status}</p>
      
      {categories.length > 0 && (
        <div className="mb-2">
          <strong>Categories ({categories.length}):</strong>
          <ul className="ml-2">
            {categories.map(cat => (
              <li key={cat.id}>{cat.name}</li>
            ))}
          </ul>
        </div>
      )}

      {products.length > 0 && (
        <div>
          <strong>Products ({products.length}):</strong>
          <ul className="ml-2">
            {products.map(prod => (
              <li key={prod.id}>{prod.name}</li>
            ))}
          </ul>
        </div>
      )}

      <button 
        onClick={testConnection}
        className="mt-2 bg-blue-600 px-2 py-1 rounded text-xs"
      >
        Retest
      </button>
    </div>
  );
};