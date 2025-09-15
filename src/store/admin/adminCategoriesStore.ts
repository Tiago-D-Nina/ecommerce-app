import { create } from 'zustand';
import { CategoriesService } from '../../services/categories';
import type { Category, CategoryFilters, CreateCategoryData, UpdateCategoryData } from '../../types/admin/category';
import type { LoadingState } from '../../types/admin/common';

interface AdminCategoriesStore {
  categories: Category[];
  selectedCategories: string[];
  filters: CategoryFilters;
  loading: LoadingState;
  
  // Actions
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (reorderedCategories: Category[]) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<CategoryFilters>) => void;
  resetFilters: () => void;
  
  // Selection
  selectCategory: (id: string) => void;
  deselectCategory: (id: string) => void;
  clearSelection: () => void;
  
  // Helpers
  getCategoryTree: () => Category[];
  getFlatCategories: () => Category[];
  getCategoryPath: (id: string) => string;
}

const initialFilters: CategoryFilters = {
  status: 'all',
  search: '',
  parentId: undefined,
  level: undefined,
  featured: undefined,
};

// Real service instance
const categoriesService = new CategoriesService();

export const useAdminCategoriesStore = create<AdminCategoriesStore>((set, get) => ({
  categories: [],
  selectedCategories: [],
  filters: initialFilters,
  loading: {},

  fetchCategories: async () => {
    set((state) => ({ loading: { ...state.loading, fetch: true } }));
    
    try {
      const categories = await categoriesService.getAllCategories(true);
      // Transform categories to match admin format
      const adminCategories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        parentId: cat.parent_id,
        children: cat.subcategories || [],
        level: 0, // Will be calculated
        path: cat.slug,
        metadata: {
          icon: '',
          color: '#3B82F6',
          featured: false,
          sortOrder: cat.sort_order,
        },
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: [],
        },
        status: cat.is_active ? 'active' as const : 'inactive' as const,
        productCount: 0, // Will be calculated
        createdAt: new Date(cat.created_at),
        updatedAt: new Date(cat.updated_at),
      }));
      
      set({
        categories: adminCategories,
        loading: { fetch: false },
      });
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, fetch: false } }));
      throw error;
    }
  },

  createCategory: async (data) => {
    set((state) => ({ loading: { ...state.loading, create: true } }));
    
    try {
      const categoryData = {
        name: data.name,
        description: data.description,
        parent_id: data.parentId,
        is_active: true,
        sort_order: data.metadata?.sortOrder || 0
      };
      
      const createdCategory = await categoriesService.createCategory(categoryData);
      
      // Transform to admin format
      const adminCategory: Category = {
        id: createdCategory.id,
        name: createdCategory.name,
        slug: createdCategory.slug,
        description: createdCategory.description || '',
        parentId: createdCategory.parent_id,
        children: [],
        level: 0,
        path: createdCategory.slug,
        metadata: {
          icon: data.metadata?.icon || '',
          color: data.metadata?.color || '#3B82F6',
          featured: data.metadata?.featured || false,
          sortOrder: createdCategory.sort_order,
        },
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: [],
        },
        status: 'active',
        productCount: 0,
        createdAt: new Date(createdCategory.created_at),
        updatedAt: new Date(createdCategory.updated_at),
      };
      
      set((state) => ({
        categories: [adminCategory, ...state.categories],
        loading: { ...state.loading, create: false },
      }));
      
      return adminCategory;
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, create: false } }));
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    set((state) => ({ loading: { ...state.loading, update: true } }));
    
    try {
      const updateData = {
        name: data.name,
        description: data.description,
        parent_id: data.parentId,
      };
      
      await categoriesService.updateCategory(id, updateData);
      
      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, ...data, updatedAt: new Date() } : category
        ),
        loading: { ...state.loading, update: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, update: false } }));
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set((state) => ({ loading: { ...state.loading, delete: true } }));
    
    try {
      await categoriesService.deleteCategory(id);
      
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        selectedCategories: state.selectedCategories.filter((selectedId) => selectedId !== id),
        loading: { ...state.loading, delete: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, delete: false } }));
      throw error;
    }
  },

  reorderCategories: async (reorderedCategories) => {
    set((state) => ({ loading: { ...state.loading, reorder: true } }));
    
    try {
      const categoryIds = reorderedCategories.map(cat => cat.id);
      await categoriesService.reorderCategories(categoryIds);
      
      set({
        categories: reorderedCategories,
        loading: { reorder: false },
      });
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, reorder: false } }));
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  selectCategory: (id) => {
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(id)
        ? state.selectedCategories
        : [...state.selectedCategories, id],
    }));
  },

  deselectCategory: (id) => {
    set((state) => ({
      selectedCategories: state.selectedCategories.filter((selectedId) => selectedId !== id),
    }));
  },

  clearSelection: () => {
    set({ selectedCategories: [] });
  },

  getCategoryTree: () => {
    const { categories } = get();
    
    // Build tree structure
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];
    
    // First pass: create map and identify root categories
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
      if (!category.parentId) {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });
    
    // Second pass: build parent-child relationships
    categories.forEach((category) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        const child = categoryMap.get(category.id);
        if (parent && child) {
          parent.children!.push(child);
        }
      }
    });
    
    return rootCategories;
  },

  getFlatCategories: () => {
    const { categories } = get();
    return categories;
  },

  getCategoryPath: (id) => {
    const { categories } = get();
    const category = categories.find((cat) => cat.id === id);
    return category?.path || '';
  },
}));