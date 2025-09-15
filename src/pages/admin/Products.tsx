import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Archive, CheckSquare } from 'lucide-react';
import { useAdminProductsStore } from '../../store/admin/adminProductsStore';
import { useAdminUIStore } from '../../store/admin/adminUIStore';
import { DataTable } from '../../components/admin/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/admin/ui/ConfirmationDialog';
import { AdminDebug } from '../../components/debug/AdminDebug';
import type { StripeProduct } from '../../types/admin/product';

export const Products: React.FC = () => {
  const {
    products,
    selectedProducts,
    pagination,
    loading,
    filters,
    fetchProducts,
    deleteProduct,
    bulkUpdateStatus,
    selectProduct,
    deselectProduct,
    clearSelection,
    setFilters,
    setPage,
  } = useAdminProductsStore();

  const { addNotification, openModal, closeModal, activeModal } = useAdminUIStore();
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId?: string;
    productName?: string;
  }>({ isOpen: false });

  const [bulkAction, setBulkAction] = useState<{
    isOpen: boolean;
    action?: 'activate' | 'archive' | 'delete';
  }>({ isOpen: false });

  useEffect(() => {
    fetchProducts().catch((error) => {
      addNotification({
        type: 'error',
        title: 'Erro ao carregar produtos',
        message: error.message,
      });
    });
  }, [fetchProducts, addNotification]);

  const handleSearch = (query: string) => {
    setFilters({ search: query });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.productId) return;

    try {
      await deleteProduct(deleteConfirm.productId);
      addNotification({
        type: 'success',
        title: 'Produto deletado',
        message: 'O produto foi removido com sucesso.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao deletar produto',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setDeleteConfirm({ isOpen: false });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction.action || selectedProducts.length === 0) return;

    try {
      switch (bulkAction.action) {
        case 'activate':
          await bulkUpdateStatus(selectedProducts, 'active');
          addNotification({
            type: 'success',
            title: 'Produtos ativados',
            message: `${selectedProducts.length} produto(s) foram ativados.`,
          });
          break;
        case 'archive':
          await bulkUpdateStatus(selectedProducts, 'archived');
          addNotification({
            type: 'success',
            title: 'Produtos arquivados',
            message: `${selectedProducts.length} produto(s) foram arquivados.`,
          });
          break;
        case 'delete':
          // Implement bulk delete
          addNotification({
            type: 'success',
            title: 'Produtos deletados',
            message: `${selectedProducts.length} produto(s) foram deletados.`,
          });
          break;
      }
      clearSelection();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na ação em lote',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setBulkAction({ isOpen: false });
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: StripeProduct['status']) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      active: 'Ativo',
      draft: 'Rascunho',
      archived: 'Arquivado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const columns = [
    {
      key: 'select',
      label: '',
      width: 'w-12',
      render: (product: StripeProduct) => (
        <input
          type="checkbox"
          checked={selectedProducts.includes(product.id)}
          onChange={(e) => {
            if (e.target.checked) {
              selectProduct(product.id);
            } else {
              deselectProduct(product.id);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'name',
      label: 'Produto',
      sortable: true,
      render: (product: StripeProduct) => (
        <div className="flex items-center">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">ID: {product.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'pricing.unitAmount',
      label: 'Preço',
      sortable: true,
      render: (product: StripeProduct) => (
        <span className="text-sm font-medium">
          {formatPrice(product.pricing.unitAmount, product.pricing.currency)}
        </span>
      ),
    },
    {
      key: 'inventory.quantity',
      label: 'Estoque',
      render: (product: StripeProduct) => (
        <span className="text-sm">
          {product.inventory.type === 'infinite' 
            ? '∞' 
            : product.inventory.quantity || 0
          }
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: StripeProduct) => getStatusBadge(product.status),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (product: StripeProduct) => (
        <div className="flex items-center space-x-1">
          <button
            className="p-1 rounded hover:bg-gray-100"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="p-1 rounded hover:bg-gray-100"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={() =>
              setDeleteConfirm({
                isOpen: true,
                productId: product.id,
                productName: product.name,
              })
            }
            className="p-1 rounded hover:bg-gray-100 text-red-600"
            title="Deletar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const bulkActions = selectedProducts.length > 0 && (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        {selectedProducts.length} selecionado(s)
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setBulkAction({ isOpen: true, action: 'activate' })}
      >
        <CheckSquare className="h-4 w-4 mr-1" />
        Ativar
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setBulkAction({ isOpen: true, action: 'archive' })}
      >
        <Archive className="h-4 w-4 mr-1" />
        Arquivar
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setBulkAction({ isOpen: true, action: 'delete' })}
        className="text-red-600 border-red-300 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Deletar
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seus produtos e estoque</p>
        </div>
        <Link to="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Data Table */}
      <DataTable
        data={products}
        columns={columns}
        pagination={pagination}
        onSearch={handleSearch}
        onPageChange={setPage}
        loading={loading.fetch}
        searchPlaceholder="Buscar produtos..."
        emptyMessage="Nenhum produto encontrado"
        actions={bulkActions}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleDelete}
        title="Deletar Produto"
        message={`Tem certeza que deseja deletar o produto "${deleteConfirm.productName}"? Esta ação não pode ser desfeita.`}
        type="danger"
        confirmLabel="Deletar"
        isLoading={loading.delete}
      />

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={bulkAction.isOpen}
        onClose={() => setBulkAction({ isOpen: false })}
        onConfirm={handleBulkAction}
        title={`${bulkAction.action === 'activate' ? 'Ativar' : bulkAction.action === 'archive' ? 'Arquivar' : 'Deletar'} Produtos`}
        message={`Tem certeza que deseja ${bulkAction.action === 'activate' ? 'ativar' : bulkAction.action === 'archive' ? 'arquivar' : 'deletar'} ${selectedProducts.length} produto(s)?`}
        type={bulkAction.action === 'delete' ? 'danger' : 'warning'}
        confirmLabel={bulkAction.action === 'activate' ? 'Ativar' : bulkAction.action === 'archive' ? 'Arquivar' : 'Deletar'}
        isLoading={loading.bulk}
      />
      
      <AdminDebug />
    </div>
  );
};