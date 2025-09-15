import { CartItem } from '../cart/CartItem';
import { CartSummary } from '../cart/CartSummary';
import { useCartStore } from '../../../store/cartStore';

export const CheckoutSummary = () => {
  const { items } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Seu carrinho está vazio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Items List */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Itens do Pedido
        </h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.product.id}>
              <CartItem item={item} />
              {index < items.length - 1 && (
                <hr className="border-gray-200 mt-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <CartSummary />
      </div>
    </div>
  );
};