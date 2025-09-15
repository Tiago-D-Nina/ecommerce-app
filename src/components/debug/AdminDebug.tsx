import { useEffect, useState } from 'react';
import productsService from '../../services/products';
import { useAdminProductsStore } from '../../store/admin/adminProductsStore';
import { useAuthStore } from '../../store/authStore';

export const AdminDebug = () => {
  const [debugInfo, setDebugInfo] = useState<string>('Testando...');
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { loading, products } = useAdminProductsStore();
  const { logout, user } = useAuthStore();

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔍 Testing admin products connection...');
      setDebugInfo('Testing connection...');
      
      const startTime = Date.now();
      const products = await productsService.getAllProducts({ limit: 5 });
      const endTime = Date.now();
      
      console.log(`✅ Products loaded in ${endTime - startTime}ms:`, products);
      setDebugInfo(`✅ ${products.length} products loaded in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('❌ Admin products error:', error);
      setDebugInfo(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-600 text-white p-3 rounded-lg max-w-sm text-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">🔍 Admin Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-2 hover:bg-red-700 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
          title="Fechar debug"
        >
          ×
        </button>
      </div>
      <p className="mb-1">Status: {debugInfo}</p>
      <p className="mb-1">User: {user?.email || 'None'}</p>
      <p className="mb-1">Store Loading: {JSON.stringify(loading)}</p>
      <p className="mb-1">Store Products: {products.length}</p>
      <div className="flex gap-1 mt-2">
        <button 
          onClick={testConnection}
          className="bg-red-800 px-2 py-1 rounded text-xs"
        >
          Retest
        </button>
        <button 
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            logout();
            window.location.reload();
          }}
          className="bg-yellow-600 px-2 py-1 rounded text-xs"
          title="Clear cache and logout"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
};