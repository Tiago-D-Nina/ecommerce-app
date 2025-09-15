import React, { useEffect, useState } from 'react';
import { Eye, Package, Truck, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAdminOrdersStore } from '../../store/admin/adminOrdersStore';
import { useAdminUIStore } from '../../store/admin/adminUIStore';
import { DataTable } from '../../components/admin/ui/DataTable';
import { StatCard } from '../../components/admin/ui/StatCard';
import { FormModal } from '../../components/admin/ui/FormModal';
import { Button } from '../../components/ui/Button';
import type { StripeOrder } from '../../types/admin/order';

interface OrderStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StripeOrder | null;
  onUpdate: (status: StripeOrder['status']) => Promise<void>;
  isLoading: boolean;
}

const OrderStatusUpdateModal: React.FC<OrderStatusUpdateModalProps> = ({
  isOpen,
  onClose,
  order,
  onUpdate,
  isLoading,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<StripeOrder['status']>('pending');

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  const handleSubmit = async () => {
    if (selectedStatus !== order?.status) {
      await onUpdate(selectedStatus);
      onClose();
    }
  };

  const statusOptions: { value: StripeOrder['status']; label: string; description: string }[] = [
    {
      value: 'pending',
      label: 'Pendente',
      description: 'Aguardando confirmação de pagamento',
    },
    {
      value: 'processing',
      label: 'Processando',
      description: 'Pedido sendo preparado',
    },
    {
      value: 'shipped',
      label: 'Enviado',
      description: 'Pedido a caminho do cliente',
    },
    {
      value: 'delivered',
      label: 'Entregue',
      description: 'Pedido entregue ao cliente',
    },
    {
      value: 'cancelled',
      label: 'Cancelado',
      description: 'Pedido cancelado',
    },
    {
      value: 'refunded',
      label: 'Reembolsado',
      description: 'Pedido reembolsado',
    },
  ];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Atualizar Status - Pedido ${order?.orderNumber}`}
      onSubmit={handleSubmit}
      submitLabel="Atualizar"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status do Pedido
          </label>
          <div className="space-y-3">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value as StripeOrder['status'])}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {order && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Detalhes do Pedido</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Cliente:</strong> {order.customer.name}</p>
              <p><strong>Email:</strong> {order.customer.email}</p>
              <p><strong>Total:</strong> {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(order.pricing.total / 100)}</p>
              <p><strong>Status Atual:</strong> {statusOptions.find(s => s.value === order.status)?.label}</p>
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
};

export const Orders: React.FC = () => {
  const {
    orders,
    metrics,
    pagination,
    loading,
    fetchOrders,
    fetchMetrics,
    updateOrderStatus,
    setFilters,
    setPage,
  } = useAdminOrdersStore();

  const { addNotification } = useAdminUIStore();

  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    order: StripeOrder | null;
  }>({ isOpen: false, order: null });

  useEffect(() => {
    Promise.all([fetchOrders(), fetchMetrics()]).catch((error) => {
      addNotification({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: error.message,
      });
    });
  }, [fetchOrders, fetchMetrics, addNotification]);

  const handleSearch = (query: string) => {
    setFilters({ search: query });
  };

  const handleStatusUpdate = async (status: StripeOrder['status']) => {
    if (!statusUpdateModal.order) return;

    try {
      await updateOrderStatus(statusUpdateModal.order.id, { status });
      addNotification({
        type: 'success',
        title: 'Status atualizado',
        message: 'O status do pedido foi atualizado com sucesso.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar status',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusBadge = (status: StripeOrder['status']) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      pending: 'Pendente',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: StripeOrder['paymentStatus']) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      partially_refunded: 'bg-orange-100 text-orange-800',
    };

    const statusLabels = {
      pending: 'Pendente',
      paid: 'Pago',
      failed: 'Falhou',
      refunded: 'Reembolsado',
      partially_refunded: 'Parcialmente Reembolsado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[paymentStatus]}`}>
        {statusLabels[paymentStatus]}
      </span>
    );
  };

  const getPaymentMethodBadge = (order: StripeOrder & { payment_method?: string }) => {
    const paymentMethodLabels = {
      'credit': 'Cartão',
      'pix': 'PIX',
      'boleto': 'Boleto',
      'delivery': 'Entrega',
    };
    
    const method = order.payment_method || 'credit';
    const label = paymentMethodLabels[method as keyof typeof paymentMethodLabels] || 'Não informado';
    
    const colorMap = {
      'credit': 'bg-blue-100 text-blue-800',
      'pix': 'bg-green-100 text-green-800',
      'boleto': 'bg-orange-100 text-orange-800',
      'delivery': 'bg-purple-100 text-purple-800',
    };
    
    const colorClass = colorMap[method as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {label}
      </span>
    );
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Pedido',
      sortable: true,
      render: (order: StripeOrder) => (
        <div>
          <div className="font-medium text-gray-900">{order.orderNumber}</div>
          <div className="text-sm text-gray-500">
            {order.createdAt.toLocaleDateString('pt-BR')}
          </div>
        </div>
      ),
    },
    {
      key: 'customer.name',
      label: 'Cliente',
      render: (order: StripeOrder) => (
        <div>
          <div className="font-medium text-gray-900">{order.customer.name}</div>
          <div className="text-sm text-gray-500">{order.customer.email}</div>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Itens',
      render: (order: StripeOrder) => (
        <div className="text-sm">
          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
        </div>
      ),
    },
    {
      key: 'pricing.total',
      label: 'Total',
      sortable: true,
      render: (order: StripeOrder) => (
        <span className="font-medium">
          {formatPrice(order.pricing.total, order.pricing.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (order: StripeOrder) => getStatusBadge(order.status),
    },
    {
      key: 'paymentStatus',
      label: 'Pagamento',
      render: (order: StripeOrder & { payment_method?: string }) => (
        <div className="space-y-1">
          {getPaymentStatusBadge(order.paymentStatus)}
          {getPaymentMethodBadge(order)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (order: StripeOrder) => (
        <div className="flex items-center space-x-1">
          <button
            className="p-1 rounded hover:bg-gray-100"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setStatusUpdateModal({ isOpen: true, order })}
            className="p-1 rounded hover:bg-gray-100"
            title="Atualizar Status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Gerencie pedidos e acompanhe vendas</p>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Pedidos"
            value={metrics.totalOrders}
            icon={Package}
            change={{
              value: '+12.5%',
              trend: 'up',
              period: 'vs mês anterior',
            }}
          />
          <StatCard
            title="Receita Total"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(metrics.totalRevenue)}
            icon={CheckCircle}
            change={{
              value: '+8.2%',
              trend: 'up',
              period: 'vs mês anterior',
            }}
          />
          <StatCard
            title="Ticket Médio"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(metrics.averageOrderValue)}
            icon={Truck}
            change={{
              value: '-2.1%',
              trend: 'down',
              period: 'vs mês anterior',
            }}
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${metrics.conversionRate}%`}
            icon={XCircle}
            change={{
              value: '+0.5%',
              trend: 'up',
              period: 'vs mês anterior',
            }}
          />
        </div>
      )}

      {/* Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        pagination={pagination}
        onSearch={handleSearch}
        onPageChange={setPage}
        loading={loading.fetch}
        searchPlaceholder="Buscar pedidos..."
        emptyMessage="Nenhum pedido encontrado"
      />

      {/* Status Update Modal */}
      <OrderStatusUpdateModal
        isOpen={statusUpdateModal.isOpen}
        onClose={() => setStatusUpdateModal({ isOpen: false, order: null })}
        order={statusUpdateModal.order}
        onUpdate={handleStatusUpdate}
        isLoading={loading.updateStatus}
      />
    </div>
  );
};