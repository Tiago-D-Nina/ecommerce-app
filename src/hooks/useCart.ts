import { useCartStore } from '../store/cartStore';
import type { Product } from '../types';

export const useCart = () => {
  const {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  } = useCartStore();

  const addToCartOptimistic = async (product: Product) => {
    addItem(product);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
    }
  };

  const updateQuantityOptimistic = async (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  };

  const removeFromCartOptimistic = async (productId: string) => {
    removeItem(productId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
    }
  };

  return {
    items,
    total,
    itemCount,
    addToCart: addToCartOptimistic,
    removeFromCart: removeFromCartOptimistic,
    updateQuantity: updateQuantityOptimistic,
    clearCart,
    getItemQuantity,
  };
};