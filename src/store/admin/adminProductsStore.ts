import { create } from 'zustand';
import productsService from '../../services/products';
import { supabase } from '../../utils/supabase';
import type { StripeProduct, ProductFilters, CreateProductData, UpdateProductData } from '../../types/admin/product';
import type { PaginationConfig, SortConfig, LoadingState } from '../../types/admin/common';

interface AdminProductsStore {
  products: StripeProduct[];
  selectedProducts: string[];
  filters: ProductFilters;
  pagination: PaginationConfig;
  sort: SortConfig | null;
  loading: LoadingState;
  
  // Actions
  fetchProducts: (params?: { page?: number; limit?: number }) => Promise<void>;
  createProduct: (data: CreateProductData) => Promise<StripeProduct>;
  updateProduct: (id: string, data: UpdateProductData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: StripeProduct['status']) => Promise<void>;
  
  // Filters & Search
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: SortConfig) => void;
  
  // Selection
  selectProduct: (id: string) => void;
  selectAllProducts: () => void;
  deselectProduct: (id: string) => void;
  clearSelection: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

const initialFilters: ProductFilters = {
  status: 'all',
  search: '',
  category: undefined,
  priceRange: undefined,
  tags: [],
  dateRange: undefined,
};

const initialPagination: PaginationConfig = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

// Transform Product to StripeProduct format for admin
const transformToStripeProduct = (product: any): StripeProduct => ({
  id: product.id,
  stripeProductId: product.stripe_product_id || '',
  stripePriceId: product.stripe_price_id || '',
  name: product.name,
  description: product.description || '',
  images: product.image_url ? [product.image_url] : [],
  metadata: {
    category: product.category || '',
    tags: product.tags || [],
    weight: product.weight,
    dimensions: product.dimensions,
  },
  pricing: {
    unitAmount: Math.round(product.price * 100), // Convert to cents
    currency: product.currency || 'brl',
    type: 'one_time',
  },
  inventory: {
    type: product.manage_stock ? 'finite' : 'infinite',
    quantity: product.stock_quantity,
    tracking: product.manage_stock,
  },
  status: product.status === 'published' ? 'active' : 
          product.status === 'archived' ? 'archived' : 'draft',
  createdAt: new Date(product.created_at),
  updatedAt: new Date(product.updated_at),
});

export const useAdminProductsStore = create<AdminProductsStore>((set, get) => ({
  products: [],
  selectedProducts: [],
  filters: initialFilters,
  pagination: initialPagination,
  sort: null,
  loading: {},
  
  fetchProducts: async (params) => {
    set((state) => ({ loading: { ...state.loading, fetch: true } }));
    
    try {
      const { filters } = get();
      const page = params?.page || 1;
      const limit = params?.limit || 50; // Increase limit to show more products
      
      // Build filters for ProductsService
      const serviceFilters: any = {
        limit,
        offset: (page - 1) * limit,
      };
      
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'active') serviceFilters.status = 'published';
        else if (filters.status === 'draft') serviceFilters.status = 'draft';
        else if (filters.status === 'archived') serviceFilters.status = 'archived';
      }
      
      if (filters.search) {
        serviceFilters.search = filters.search;
      }
      
      if (filters.category) {
        serviceFilters.category_id = filters.category;
      }
      
      // Get products from real service - use direct supabase query to avoid JOIN issues
      console.log('🔍 Fetching products with filters:', serviceFilters);
      const startTime = Date.now();
      
      let query = supabase
        .from('products')
        .select('*');
      
      // Apply status filter based on admin filters, not hardcoded
      if (serviceFilters.status) {
        query = query.eq('status', serviceFilters.status);
      }
      // If no status filter, show all products (this is admin panel)
      
      query = query
        .order('created_at', { ascending: false })
        .limit(serviceFilters.limit || 50);
        
      const { data: products, error } = await query;
      
      const endTime = Date.now();
      console.log(`⏱️ Products query took ${endTime - startTime}ms`);
        
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      if (!products) {
        throw new Error('No products returned from query');
      }
      
      // Transform to StripeProduct format
      const transformedProducts = products.map(transformToStripeProduct);
      
      // Calculate pagination (simplified - in real app you'd get total count from API)
      const total = transformedProducts.length;
      const totalPages = Math.ceil(total / limit);
      
      set({
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        loading: { fetch: false },
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      set((state) => ({ loading: { ...state.loading, fetch: false } }));
      throw error;
    }
  },

  createProduct: async (data) => {
    set((state) => ({ loading: { ...state.loading, create: true } }));
    
    try {
      // This would typically be called from ProductNew page directly
      // For now, just refresh the products list
      const products = await productsService.getAllProducts({ limit: 50 });
      const transformedProducts = products.map(transformToStripeProduct);
      
      set((state) => ({
        products: transformedProducts,
        loading: { ...state.loading, create: false },
      }));
      
      return transformedProducts[0]; // Return first product as placeholder
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, create: false } }));
      throw error;
    }
  },

  updateProduct: async (id, data) => {
    set((state) => ({ loading: { ...state.loading, update: true } }));
    
    try {
      // This would typically be called from ProductEdit page directly
      // For now, just refresh the products list
      const products = await productsService.getAllProducts({ limit: 50 });
      const transformedProducts = products.map(transformToStripeProduct);
      
      set((state) => ({
        products: transformedProducts,
        loading: { ...state.loading, update: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, update: false } }));
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set((state) => ({ loading: { ...state.loading, delete: true } }));
    
    try {
      await productsService.deleteProduct(id);
      
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        selectedProducts: state.selectedProducts.filter((selectedId) => selectedId !== id),
        loading: { ...state.loading, delete: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, delete: false } }));
      throw error;
    }
  },

  bulkUpdateStatus: async (ids, status) => {
    set((state) => ({ loading: { ...state.loading, bulk: true } }));
    
    try {
      // Update each product individually (since we don't have bulk update in ProductsService)
      for (const id of ids) {
        const statusMap = {
          'active': 'published',
          'draft': 'draft', 
          'archived': 'archived'
        };
        await productsService.updateProduct(id, { status: statusMap[status] });
      }
      
      set((state) => ({
        products: state.products.map((product) =>
          ids.includes(product.id) ? { ...product, status, updatedAt: new Date() } : product
        ),
        loading: { ...state.loading, bulk: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, bulk: false } }));
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
  },

  resetFilters: () => {
    set({
      filters: initialFilters,
      pagination: { ...initialPagination },
    });
  },

  setSort: (sort) => {
    set({ sort });
  },

  selectProduct: (id) => {
    set((state) => ({
      selectedProducts: state.selectedProducts.includes(id)
        ? state.selectedProducts
        : [...state.selectedProducts, id],
    }));
  },

  selectAllProducts: () => {
    set((state) => ({
      selectedProducts: state.products.map((product) => product.id),
    }));
  },

  deselectProduct: (id) => {
    set((state) => ({
      selectedProducts: state.selectedProducts.filter((selectedId) => selectedId !== id),
    }));
  },

  clearSelection: () => {
    set({ selectedProducts: [] });
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },

  setLimit: (limit) => {
    set((state) => ({
      pagination: { ...state.pagination, limit, page: 1 },
    }));
  },
}));