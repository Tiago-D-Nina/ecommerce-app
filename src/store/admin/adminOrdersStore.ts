import { create } from 'zustand';
import type { StripeOrder, OrderFilters, OrderMetrics, UpdateOrderStatusData, ProcessRefundData } from '../../types/admin/order';
import type { PaginationConfig, SortConfig, LoadingState, DateRange } from '../../types/admin/common';
import { adminOrderService } from '../../services/adminOrderService';

interface AdminOrdersStore {
  orders: StripeOrder[];
  orderDetails: Record<string, StripeOrder>;
  metrics: OrderMetrics | null;
  filters: OrderFilters;
  pagination: PaginationConfig;
  sort: SortConfig | null;
  loading: LoadingState;
  
  // Actions
  fetchOrders: (params?: { page?: number; limit?: number }) => Promise<void>;
  fetchOrderDetails: (id: string) => Promise<StripeOrder>;
  updateOrderStatus: (id: string, data: UpdateOrderStatusData) => Promise<void>;
  processRefund: (id: string, data: ProcessRefundData) => Promise<void>;
  addOrderNote: (id: string, note: string) => Promise<void>;
  
  // Metrics
  fetchMetrics: (dateRange?: DateRange) => Promise<void>;
  
  // Filters & Search
  setFilters: (filters: Partial<OrderFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: SortConfig) => void;
  
  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

const initialFilters: OrderFilters = {
  status: 'all',
  paymentStatus: 'all',
  search: '',
  dateRange: undefined,
  customerId: undefined,
  minAmount: undefined,
  maxAmount: undefined,
};

const initialPagination: PaginationConfig = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};


export const useAdminOrdersStore = create<AdminOrdersStore>((set, get) => ({
  orders: [],
  orderDetails: {},
  metrics: null,
  filters: initialFilters,
  pagination: initialPagination,
  sort: null,
  loading: {},

  fetchOrders: async (params) => {
    set((state) => ({ loading: { ...state.loading, fetch: true } }));
    
    try {
      const { filters, sort } = get();
      const result = await adminOrderService.fetchOrders({
        ...params,
        filters,
        sort,
      });
      
      set({
        orders: result.data,
        pagination: result.pagination,
        loading: { fetch: false },
      });
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, fetch: false } }));
      throw error;
    }
  },

  fetchOrderDetails: async (id) => {
    set((state) => ({ loading: { ...state.loading, fetchDetails: true } }));
    
    try {
      const order = await adminOrderService.fetchOrderDetails(id);
      
      set((state) => ({
        orderDetails: { ...state.orderDetails, [id]: order },
        loading: { ...state.loading, fetchDetails: false },
      }));
      
      return order;
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, fetchDetails: false } }));
      throw error;
    }
  },

  updateOrderStatus: async (id, data) => {
    set((state) => ({ loading: { ...state.loading, updateStatus: true } }));
    
    try {
      await adminOrderService.updateOrderStatus(id, data.status);
      
      // Update local state
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, status: data.status, updatedAt: new Date() } : order
        ),
        orderDetails: {
          ...state.orderDetails,
          [id]: state.orderDetails[id] ? { ...state.orderDetails[id], status: data.status, updatedAt: new Date() } : state.orderDetails[id],
        },
        loading: { ...state.loading, updateStatus: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, updateStatus: false } }));
      throw error;
    }
  },

  processRefund: async (id, data) => {
    set((state) => ({ loading: { ...state.loading, refund: true } }));
    
    try {
      // Para processamento de reembolso, seria necessário implementar lógica específica
      console.log('Processing refund:', id, data);
      
      // Update local state
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, paymentStatus: 'refunded', updatedAt: new Date() } : order
        ),
        loading: { ...state.loading, refund: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, refund: false } }));
      throw error;
    }
  },

  addOrderNote: async (id, note) => {
    set((state) => ({ loading: { ...state.loading, addNote: true } }));
    
    try {
      await adminOrderService.addOrderNote(id, note);
      
      // Update local state
      set((state) => ({
        orderDetails: {
          ...state.orderDetails,
          [id]: state.orderDetails[id] ? { ...state.orderDetails[id], notes: note } : state.orderDetails[id],
        },
        loading: { ...state.loading, addNote: false },
      }));
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, addNote: false } }));
      throw error;
    }
  },

  fetchMetrics: async (dateRange) => {
    set((state) => ({ loading: { ...state.loading, metrics: true } }));
    
    try {
      const metrics = await adminOrderService.fetchMetrics(dateRange);
      
      set({
        metrics,
        loading: { metrics: false },
      });
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, metrics: false } }));
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
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