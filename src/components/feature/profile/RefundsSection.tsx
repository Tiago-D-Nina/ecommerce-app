import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { formatPrice } from '../../../utils';
import type { RefundRequest } from '../../../types';

export function RefundsSection() {
  const { 
    refundRequests, 
    orders, 
    getRefundRequests, 
    requestRefund, 
    isLoading 
  } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getRefundRequests();
  }, [getRefundRequests]);

  const eligibleOrders = orders.filter(order => 
    order.status === 'delivered' && 
    !refundRequests.some(refund => refund.orderId === order.id)
  );

  const resetForm = () => {
    setSelectedOrderId('');
    setReason('');
    setDescription('');
    setErrors({});
    setShowForm(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedOrderId) {
      newErrors.selectedOrderId = 'Selecione um pedido';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (description.length < 20) {
      newErrors.description = 'Descrição deve ter pelo menos 20 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await requestRefund(selectedOrderId, reason, description);
    if (success) {
      resetForm();
    }
  };

  const getStatusIcon = (status: RefundRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: RefundRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Em Análise';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'processed':
        return 'Processado';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: RefundRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const refundReasons = [
    'Produto defeituoso',
    'Produto não conforme descrição',
    'Produto danificado na entrega',
    'Não gostei do produto',
    'Chegou fora do prazo',
    'Outro motivo'
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Solicitações de Reembolso</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => getRefundRequests()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {eligibleOrders.length > 0 && !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Solicitar Reembolso
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Nova Solicitação de Reembolso
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Pedido *
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className={`block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.selectedOrderId ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              >
                <option value="">Selecione um pedido entregue</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Pedido #{order.id} - {formatPrice(order.total)} - {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>
              {errors.selectedOrderId && (
                <p className="text-sm text-red-500 mt-1">{errors.selectedOrderId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reason ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              >
                <option value="">Selecione o motivo</option>
                {refundReasons.map((reasonOption) => (
                  <option key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="text-sm text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição Detalhada *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none ${
                  errors.description ? 'border-red-500' : ''
                }`}
                rows={4}
                placeholder="Descreva detalhadamente o problema com o produto ou pedido..."
                disabled={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-sm text-gray-500">Mínimo 20 caracteres</p>
                )}
                <p className="text-sm text-gray-500">{description.length}/500</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                <strong>Informações importantes:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• O reembolso será processado na forma de pagamento original</li>
                <li>• O prazo para análise é de até 5 dias úteis</li>
                <li>• Após aprovação, o valor será creditado em até 7 dias úteis</li>
                <li>• Você receberá atualizações por email</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Solicitar Reembolso'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Refund Requests */}
      <div className="space-y-4">
        {refundRequests.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma solicitação de reembolso</p>
            <p className="text-sm text-gray-400 mt-1">
              {eligibleOrders.length > 0 
                ? 'Você pode solicitar reembolso para pedidos entregues'
                : 'Solicitações de reembolso aparecerão aqui'
              }
            </p>
          </div>
        ) : (
          refundRequests.map((refund) => {
            return (
              <div
                key={refund.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Reembolso #{refund.id}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(refund.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(refund.status)}`}>
                        {getStatusLabel(refund.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Solicitado em {new Date(refund.requestedAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Pedido: #{refund.orderId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-900">{formatPrice(refund.amount)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700">Motivo</h4>
                    <p className="text-sm text-gray-600">{refund.reason}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Descrição</h4>
                    <p className="text-sm text-gray-600">{refund.description}</p>
                  </div>

                  {refund.status === 'rejected' && refund.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <h4 className="font-medium text-red-700">Motivo da Rejeição</h4>
                      <p className="text-sm text-red-600 mt-1">{refund.rejectionReason}</p>
                    </div>
                  )}

                  {refund.status === 'processed' && refund.processedAt && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-700">
                        Reembolso processado em {new Date(refund.processedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {eligibleOrders.length === 0 && refundRequests.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-700">
            Você só pode solicitar reembolso para pedidos que já foram entregues.
            Após a entrega, você terá 30 dias para solicitar o reembolso.
          </p>
        </div>
      )}
    </div>
  );
}