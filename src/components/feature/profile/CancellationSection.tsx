import { useState } from 'react';
import { XCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { formatPrice } from '../../../utils';
import type { Order } from '../../../types';

export function CancellationSection() {
  const { orders, cancelOrder, isLoading } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Orders that can be cancelled
  const cancellableOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'confirmed'
  );

  // Already cancelled orders
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  const resetForm = () => {
    setSelectedOrder(null);
    setReason('');
    setShowConfirmModal(false);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !reason.trim()) return;

    const success = await cancelOrder(selectedOrder.id, reason);
    if (success) {
      resetForm();
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Aguardando Pagamento';
      case 'confirmed':
        return 'Confirmado';
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const cancellationReasons = [
    'Mudei de ideia',
    'Encontrei melhor preço',
    'Produto não é mais necessário',
    'Erro no pedido',
    'Demora na entrega',
    'Problemas financeiros',
    'Outro motivo'
  ];

  const ConfirmationModal = () => {
    if (!showConfirmModal || !selectedOrder) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowConfirmModal(false)} />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl sm:align-middle">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Cancelamento
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Tem certeza que deseja cancelar este pedido?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">Pedido #{selectedOrder.id}</p>
                <p className="text-sm text-gray-600">Valor: {formatPrice(selectedOrder.total)}</p>
                <p className="text-sm text-gray-600">Status: {getStatusLabel(selectedOrder.status)}</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo do cancelamento
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Selecione o motivo</option>
                  {cancellationReasons.map((reasonOption) => (
                    <option key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
              <p className="text-sm text-yellow-700">
                <strong>Atenção:</strong> O cancelamento não poderá ser desfeito. 
                Se o pagamento já foi processado, o reembolso será feito automaticamente.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCancelOrder}
                disabled={isLoading || !reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                Manter Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Cancelamento de Pedidos</h2>
        </div>

        {/* Cancellable Orders */}
        {cancellableOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos que Podem ser Cancelados</h3>
            <div className="space-y-4">
              {cancellableOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Pedido #{order.id}
                      </h4>
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

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-yellow-700">
                      <strong>Política de cancelamento:</strong> Você pode cancelar este pedido gratuitamente.
                      {order.status === 'confirmed' && ' O reembolso será processado automaticamente.'}
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowConfirmModal(true);
                    }}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar Pedido
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancelled Orders */}
        {cancelledOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos Cancelados</h3>
            <div className="space-y-4">
              {cancelledOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Pedido #{order.id}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                          Cancelado
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Cancelado em {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pedido original: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
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
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0 opacity-60"
                      />
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0 opacity-60">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">
                      Pedido cancelado com sucesso. 
                      {order.status === 'cancelled' && ' Se o pagamento foi processado, o reembolso será creditado em até 7 dias úteis.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Orders */}
        {cancellableOrders.length === 0 && cancelledOrders.length === 0 && (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum pedido para cancelar</p>
            <p className="text-sm text-gray-400 mt-1">
              Apenas pedidos pendentes ou confirmados podem ser cancelados
            </p>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Política de Cancelamento</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Pedidos podem ser cancelados gratuitamente até serem enviados</p>
            <p>• O reembolso é processado automaticamente na forma de pagamento original</p>
            <p>• Cartões de crédito: até 7 dias úteis para aparecer na fatura</p>
            <p>• PIX e débito: até 2 dias úteis</p>
            <p>• Em caso de dúvidas, entre em contato com nosso suporte</p>
          </div>
        </div>
      </div>

      <ConfirmationModal />
    </>
  );
}