import { useState, useEffect } from 'react';
import { Package, Eye, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { formatPrice } from '../../../utils';
import type { Order } from '../../../types';

export function OrdersSection() {
  const { orders, getOrders, isLoading } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState<'all' | Order['status']>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Aguardando Pagamento';
      case 'confirmed':
        return 'Confirmado';
      case 'processing':
        return 'Em Processamento';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );


  if (selectedOrder) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => setSelectedOrder(null)}
            variant="outline"
            size="sm"
          >
            ← Voltar
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">
            Pedido #{selectedOrder.id}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Pedido</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data do Pedido</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {selectedOrder.trackingNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código de Rastreamento</label>
                    <p className="mt-1 text-gray-900 font-mono">{selectedOrder.trackingNumber}</p>
                  </div>
                )}

                {selectedOrder.estimatedDelivery && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entrega Prevista</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Itens do Pedido</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatPrice(item.product.price)}</p>
                      <p className="text-sm text-gray-500">
                        Total: {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary and Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-900">{formatPrice(selectedOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impostos</span>
                  <span className="text-gray-900">{formatPrice(selectedOrder.tax)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endereços</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Entrega</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number}
                    {selectedOrder.shippingAddress.complement && `, ${selectedOrder.shippingAddress.complement}`}
                    <br />
                    {selectedOrder.shippingAddress.neighborhood}, {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.state}
                    <br />
                    CEP: {selectedOrder.shippingAddress.zipCode}
                  </p>
                </div>
                
                {selectedOrder.billingAddress && (
                  <div>
                    <h4 className="font-medium text-gray-700">Cobrança</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedOrder.billingAddress.street}, {selectedOrder.billingAddress.number}
                      {selectedOrder.billingAddress.complement && `, ${selectedOrder.billingAddress.complement}`}
                      <br />
                      {selectedOrder.billingAddress.neighborhood}, {selectedOrder.billingAddress.city} - {selectedOrder.billingAddress.state}
                      <br />
                      CEP: {selectedOrder.billingAddress.zipCode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pagamento</h3>
              <div className="flex items-center gap-3">
                <div className="text-2xl">💳</div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedOrder.paymentMethod.type === 'credit' ? 'Cartão de Crédito' : 
                     selectedOrder.paymentMethod.type === 'debit' ? 'Cartão de Débito' : 'PIX'}
                  </p>
                  {selectedOrder.paymentMethod.cardNumber && (
                    <p className="text-sm text-gray-600">
                      **** **** **** {selectedOrder.paymentMethod.cardNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Meus Pedidos</h2>
        <Button
          onClick={() => getOrders()}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => setSelectedStatus('all')}
          variant={selectedStatus === 'all' ? 'primary' : 'outline'}
          size="sm"
        >
          Todos
        </Button>
        <Button
          onClick={() => setSelectedStatus('pending')}
          variant={selectedStatus === 'pending' ? 'primary' : 'outline'}
          size="sm"
        >
          Pendentes
        </Button>
        <Button
          onClick={() => setSelectedStatus('confirmed')}
          variant={selectedStatus === 'confirmed' ? 'primary' : 'outline'}
          size="sm"
        >
          Confirmados
        </Button>
        <Button
          onClick={() => setSelectedStatus('shipped')}
          variant={selectedStatus === 'shipped' ? 'primary' : 'outline'}
          size="sm"
        >
          Enviados
        </Button>
        <Button
          onClick={() => setSelectedStatus('delivered')}
          variant={selectedStatus === 'delivered' ? 'primary' : 'outline'}
          size="sm"
        >
          Entregues
        </Button>
        <Button
          onClick={() => setSelectedStatus('cancelled')}
          variant={selectedStatus === 'cancelled' ? 'primary' : 'outline'}
          size="sm"
        >
          Cancelados
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedStatus === 'all' ? 'Nenhum pedido encontrado' : `Nenhum pedido ${getStatusLabel(selectedStatus as Order['status']).toLowerCase()}`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Seus pedidos aparecerão aqui após a compra
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Pedido #{order.id}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pedido em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-gray-900">{formatPrice(order.total)}</p>
                  <p className="text-sm text-gray-600">
                    {order.items.reduce((total, item) => total + item.quantity, 0)} {
                      order.items.reduce((total, item) => total + item.quantity, 0) === 1 ? 'item' : 'itens'
                    }
                  </p>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {order.items.slice(0, 3).map((item, index) => (
                  <img
                    key={index}
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                  />
                ))}
                {order.items.length > 3 && (
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedOrder(order)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>

                {order.trackingNumber && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // In a real app, this would open tracking page
                      alert(`Código de rastreamento: ${order.trackingNumber}`);
                    }}
                  >
                    <Truck className="h-4 w-4" />
                    Rastrear
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}