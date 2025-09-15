import { Star, Plus, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../utils';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);

  const handleBuyClick = () => {
    addItem(product);
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4" data-testid="product-card">
      <div className="aspect-square mb-4 overflow-hidden rounded-lg">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        <div className="space-y-1">
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <div className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </div>
        </div>

        <div className="pt-2">
          {quantity === 0 ? (
            <Button
              onClick={handleBuyClick}
              className="w-full"
              disabled={!product.inStock}
              data-testid="add-to-cart-btn"
            >
              {product.inStock ? 'Comprar' : 'Indisponível'}
            </Button>
          ) : (
            <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecrement}
                className="h-8 w-8 p-0"
                data-testid="decrease-quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span className="font-medium text-lg px-4" data-testid="quantity-display">
                {quantity}
              </span>
              
              <Button
                size="sm"
                onClick={handleIncrement}
                className="h-8 w-8 p-0"
                data-testid="increase-quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};