import { useCartStore } from '../../../store/cartStore';
import { formatPrice } from '../../../utils';

export const CartSummary = () => {
  const { calculateOrderSummary } = useCartStore();
  const summary = calculateOrderSummary();

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-3" data-testid="cart-summary">
      <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
      
      <div className="space-y-2 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-gray-600">
            Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'itens'})
          </span>
          <span className="font-medium" data-testid="subtotal">
            {formatPrice(summary.subtotal)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="text-gray-600">Frete</span>
            <span className="text-xs text-gray-500">
              {summary.shipping.description}
            </span>
          </div>
          <span className="font-medium" data-testid="shipping-cost">
            {formatPrice(summary.shipping.cost)}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between">
          <span className="text-gray-600">Impostos</span>
          <span className="font-medium">
            {formatPrice(summary.tax)}
          </span>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Total */}
        <div className="flex justify-between text-base font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900" data-testid="total-amount">
            {formatPrice(summary.total)}
          </span>
        </div>
      </div>

      {/* Shipping Info */}
      {summary.shipping.estimatedDays > 0 && (
        <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
          <span className="font-medium">Entrega estimada:</span>{' '}
          {summary.shipping.estimatedDays === 1 
            ? 'Amanhã' 
            : `${summary.shipping.estimatedDays} dias úteis`
          }
        </div>
      )}
      
      {summary.shipping.estimatedDays === 0 && (
        <div className="text-sm text-green-600 pt-2 border-t border-gray-200">
          <span className="font-medium">🚀 Entrega no mesmo dia!</span>
        </div>
      )}
    </div>
  );
};