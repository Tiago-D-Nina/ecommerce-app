import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Eye,
  MoreVertical,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAdminCategoriesStore } from '../../store/admin/adminCategoriesStore';
import { useAdminUIStore } from '../../store/admin/adminUIStore';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/admin/ui/ConfirmationDialog';
import { FormModal } from '../../components/admin/ui/FormModal';
import { Input } from '../../components/ui/Input';
import type { Category, CreateCategoryData } from '../../types/admin/category';

interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
  icon: string;
  color: string;
  featured: boolean;
}

const CategoryForm: React.FC<{
  category?: Category;
  onSubmit: (data: CreateCategoryData) => void;
  categories: Category[];
  isLoading: boolean;
}> = ({ category, onSubmit, categories, isLoading }) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    parentId: category?.parentId || '',
    icon: category?.metadata.icon || '',
    color: category?.metadata.color || '#3B82F6',
    featured: category?.metadata.featured || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description,
      parentId: formData.parentId || undefined,
      metadata: {
        icon: formData.icon,
        color: formData.color,
        featured: formData.featured,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Categoria*
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Eletrônicos"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria Pai
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Categoria raiz</option>
            {categories
              .filter((cat) => cat.id !== category?.id) // Don't allow self as parent
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Descrição da categoria..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ícone (Lucide)
          </label>
          <Input
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Ex: smartphone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cor
          </label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Categoria em destaque</span>
        </label>
      </div>
    </form>
  );
};

const CategoryTreeItem: React.FC<{
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}> = ({ category, level, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const getStatusBadge = (status: Category['status']) => {
    return status === 'active' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Ativo
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Inativo
      </span>
    );
  };

  return (
    <div className="border rounded-lg bg-white">
      <div
        className="flex items-center justify-between p-4 hover:bg-gray-50"
        style={{ paddingLeft: `${16 + level * 24}px` }}
      >
        <div className="flex items-center flex-1">
          {category.children && category.children.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          <FolderTree className="h-5 w-5 text-gray-400 mr-3" />
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              {getStatusBadge(category.status)}
              {category.metadata.featured && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Destaque
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {category.description || 'Sem descrição'}
            </p>
            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
              <span>{category.productCount} produtos</span>
              <span>Nível {category.level}</span>
              <span>{category.path}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1 rounded hover:bg-gray-100"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1 rounded hover:bg-gray-100 text-red-600"
            title="Deletar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && category.children && category.children.length > 0 && (
        <div className="border-t border-gray-100">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Categories: React.FC = () => {
  const {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryTree,
  } = useAdminCategoriesStore();

  const { addNotification } = useAdminUIStore();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    category?: Category;
  }>({ isOpen: false });

  useEffect(() => {
    fetchCategories().catch((error) => {
      addNotification({
        type: 'error',
        title: 'Erro ao carregar categorias',
        message: error.message,
      });
    });
  }, [fetchCategories, addNotification]);

  const handleSubmit = async (data: CreateCategoryData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        addNotification({
          type: 'success',
          title: 'Categoria atualizada',
          message: 'A categoria foi atualizada com sucesso.',
        });
      } else {
        await createCategory(data);
        addNotification({
          type: 'success',
          title: 'Categoria criada',
          message: 'A categoria foi criada com sucesso.',
        });
      }
      setShowModal(false);
      setEditingCategory(null);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao salvar categoria',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.category) return;

    try {
      await deleteCategory(deleteConfirm.category.id);
      addNotification({
        type: 'success',
        title: 'Categoria deletada',
        message: 'A categoria foi removida com sucesso.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao deletar categoria',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setDeleteConfirm({ isOpen: false });
    }
  };

  const categoryTree = getCategoryTree();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600">Organize seus produtos em categorias</p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Category Tree */}
      <div className="space-y-2">
        {loading.fetch ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : categoryTree.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-gray-500 mb-4">
              Comece criando sua primeira categoria
            </p>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setShowModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Categoria
            </Button>
          </div>
        ) : (
          categoryTree.map((category) => (
            <CategoryTreeItem
              key={category.id}
              category={category}
              level={0}
              onEdit={handleEdit}
              onDelete={(category) =>
                setDeleteConfirm({ isOpen: true, category })
              }
            />
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        onSubmit={() => {}} // Handled by form
        showFooter={false}
        size="lg"
      >
        <CategoryForm
          category={editingCategory || undefined}
          onSubmit={handleSubmit}
          categories={categories}
          isLoading={loading.create || loading.update}
        />
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleDelete}
        title="Deletar Categoria"
        message={`Tem certeza que deseja deletar a categoria "${deleteConfirm.category?.name}"? Esta ação não pode ser desfeita.`}
        type="danger"
        confirmLabel="Deletar"
        isLoading={loading.delete}
      />
    </div>
  );
};