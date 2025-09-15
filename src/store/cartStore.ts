import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, Product, ShippingInfo, OrderSummary } from '../types';

interface CartStore extends Cart {
  // Cart management
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  
  // UI state
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  
  // Shipping & checkout
  shippingInfo: ShippingInfo | null;
  setShippingInfo: (shipping: ShippingInfo) => void;
  calculateOrderSummary: () => OrderSummary;
}

const TAX_RATE = 0.08; // 8% tax rate

const SHIPPING_OPTIONS: ShippingInfo[] = [
  {
    method: 'standard',
    cost: 9.99,
    estimatedDays: 5,
    description: 'Entrega padrão (5-7 dias úteis)'
  },
  {
    method: 'express',
    cost: 19.99,
    estimatedDays: 2,
    description: 'Entrega expressa (2-3 dias úteis)'
  },
  {
    method: 'same-day',
    cost: 29.99,
    estimatedDays: 0,
    description: 'Entrega no mesmo dia'
  }
];

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      isDrawerOpen: false,
      shippingInfo: SHIPPING_OPTIONS[0], // Default to standard shipping

      addItem: (product: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.product.id === product.id);

        if (existingItem) {
          const updatedItems = currentItems.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

          set({ items: updatedItems, total, itemCount });
        } else {
          const updatedItems = [...currentItems, { product, quantity: 1 }];
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

          set({ items: updatedItems, total, itemCount });
        }
      },

      removeItem: (productId: string) => {
        const currentItems = get().items;
        const updatedItems = currentItems.filter(item => item.product.id !== productId);
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        set({ items: updatedItems, total, itemCount });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const currentItems = get().items;
        const updatedItems = currentItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        set({ items: updatedItems, total, itemCount });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.product.id === productId);
        return item?.quantity || 0;
      },

      // UI state management
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),

      // Shipping & checkout
      setShippingInfo: (shippingInfo: ShippingInfo) => set({ shippingInfo }),
      
      calculateOrderSummary: (): OrderSummary => {
        const { items, shippingInfo } = get();
        const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        const shipping = shippingInfo || SHIPPING_OPTIONS[0];
        const total = subtotal + tax + shipping.cost;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        return {
          subtotal,
          shipping,
          tax,
          total,
          itemCount
        };
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
        shippingInfo: state.shippingInfo,
      }),
    }
  )
);