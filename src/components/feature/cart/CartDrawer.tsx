import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../../ui/Button';
import { Drawer } from '../../ui/Drawer';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useCartStore } from '../../../store/cartStore';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export const CartDrawer = ({ onCheckout }: CartDrawerProps) => {
  const navigate = useNavigate();
  const { isDrawerOpen, closeDrawer, items, itemCount } = useCartStore();

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
    closeDrawer();
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      title="Carrinho de Compras"
      size="lg"
      data-testid="cart-drawer"
    >
      <div className="flex flex-col h-full">
        {items.length === 0 ? (
          // Empty Cart
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-gray-500 mb-6">
              Adicione alguns produtos e eles aparecerão aqui
            </p>
            <Button onClick={closeDrawer} variant="outline">
              Continuar Comprando
            </Button>
          </div>
        ) : (
          // Cart with Items
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} data-testid="cart-item">
                    <CartItem item={item} />
                    <hr className="border-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary & Checkout */}
            <div className="border-t border-gray-200 p-4 space-y-4">
              <CartSummary data-testid="cart-summary" />
              
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={itemCount === 0}
                  data-testid="checkout-button"
                >
                  Finalizar Compra
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={closeDrawer}
                >
                  Continuar Comprando
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};