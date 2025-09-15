import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useCartStore } from '../../../store/cartStore';
import { formatPrice } from '../../../utils';
import type { CartItem as CartItemType } from '../../../types';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCartStore();
  const { product, quantity } = item;

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeItem(product.id);
    }
  };

  const handleRemove = () => {
    removeItem(product.id);
  };

  const itemTotal = product.price * quantity;

  return (
    <div className="flex items-start space-x-4 py-4" data-testid="cart-item">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {product.description}
        </p>
        
        {/* Price */}
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Right side - Quantity and Total */}
      <div className="flex flex-col items-end space-y-2">
        {/* Item Total */}
        <div className="text-right">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(itemTotal)}
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecrement}
            className="h-8 w-8 p-0"
            aria-label="Diminuir quantidade"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <span className="min-w-[2rem] text-center font-medium">
            {quantity}
          </span>
          
          <Button
            size="sm"
            onClick={handleIncrement}
            className="h-8 w-8 p-0"
            aria-label="Aumentar quantidade"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-800 p-1"
          aria-label="Remover item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};