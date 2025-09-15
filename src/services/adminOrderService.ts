import { supabase } from '../utils/supabase';
import type { StripeOrder, OrderFilters, OrderMetrics } from '../types/admin/order';
import type { PaginationConfig, SortConfig, DateRange } from '../types/admin/common';

export interface AdminOrderServiceParams {
  page?: number;
  limit?: number;
  filters?: OrderFilters;
  sort?: SortConfig;
}

export interface AdminOrdersResponse {
  data: StripeOrder[];
  pagination: PaginationConfig;
}

class AdminOrderService {
  /**
   * Busca pedidos com filtros e paginação
   */
  async fetchOrders(params: AdminOrderServiceParams): Promise<AdminOrdersResponse> {
    try {
      const { page = 1, limit = 10, filters = {}, sort } = params;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            unit_price,
            quantity,
            total_price
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%`);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      if (filters.minAmount) {
        query = query.gte('total_amount', filters.minAmount * 100); // Convert to cents
      }

      if (filters.maxAmount) {
        query = query.lte('total_amount', filters.maxAmount * 100); // Convert to cents
      }

      // Aplicar ordenação
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginação
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar pedidos: ${error.message}`);
      }

      // Transformar dados para o formato StripeOrder
      const orders: StripeOrder[] = (data || []).map(order => this.transformDatabaseOrderToStripeOrder(order));

      return {
        data: orders,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      console.error('Erro no AdminOrderService.fetchOrders:', error);
      throw error;
    }
  }

  /**
   * Busca detalhes de um pedido específico
   */
  async fetchOrderDetails(id: string): Promise<StripeOrder> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            unit_price,
            quantity,
            total_price
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar detalhes do pedido: ${error.message}`);
      }

      if (!data) {
        throw new Error('Pedido não encontrado');
      }

      return this.transformDatabaseOrderToStripeOrder(data);
    } catch (error) {
      console.error('Erro no AdminOrderService.fetchOrderDetails:', error);
      throw error;
    }
  }

  /**
   * Atualiza status do pedido
   */
  async updateOrderStatus(id: string, status: StripeOrder['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no AdminOrderService.updateOrderStatus:', error);
      throw error;
    }
  }

  /**
   * Adiciona nota ao pedido
   */
  async addOrderNote(id: string, note: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          notes: note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao adicionar nota: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no AdminOrderService.addOrderNote:', error);
      throw error;
    }
  }

  /**
   * Busca métricas dos pedidos
   */
  async fetchMetrics(dateRange?: DateRange): Promise<OrderMetrics> {
    try {
      let query = supabase.from('orders').select('*');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar métricas: ${error.message}`);
      }

      const orders = data || [];

      // Calcular métricas
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount / 100), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Contar pedidos por status
      const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Métricas de receita por dia (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const revenueByDay = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at).toISOString().split('T')[0];
          return orderDate === dateStr;
        });

        return {
          date: dateStr,
          revenue: dayOrders.reduce((sum, order) => sum + (order.total_amount / 100), 0),
          orders: dayOrders.length,
        };
      });

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        pendingOrders: statusCounts.pending || 0,
        processingOrders: statusCounts.processing || 0,
        shippedOrders: statusCounts.shipped || 0,
        deliveredOrders: statusCounts.delivered || 0,
        cancelledOrders: statusCounts.cancelled || 0,
        refundedOrders: statusCounts.refunded || 0,
        conversionRate: 3.2, // Mock - seria calculado com base em dados de tráfego
        topProducts: [], // Mock - seria calculado agregando order_items
        revenueByDay,
      };
    } catch (error) {
      console.error('Erro no AdminOrderService.fetchMetrics:', error);
      throw error;
    }
  }

  /**
   * Transforma dados do banco para o formato StripeOrder
   */
  private transformDatabaseOrderToStripeOrder(dbOrder: any): StripeOrder {
    // Cria um objeto customizado para incluir payment_method
    const stripeOrder: StripeOrder & { payment_method?: string } = {
      id: dbOrder.id,
      stripePaymentIntentId: dbOrder.payment_data?.payment_intent_id || '',
      stripeCustomerId: dbOrder.payment_data?.customer_id || '',
      orderNumber: dbOrder.order_number,
      customer: {
        id: dbOrder.user_id,
        email: dbOrder.user_email || '',
        name: dbOrder.user_name || '',
        phone: dbOrder.user_phone || '',
      },
      items: (dbOrder.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        image: item.product_image,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        stripeProductId: item.stripe_product_id || '',
        stripePriceId: item.stripe_price_id || '',
      })),
      pricing: {
        subtotal: dbOrder.subtotal,
        tax: dbOrder.tax_amount,
        shipping: dbOrder.shipping_amount,
        discount: dbOrder.discount_amount,
        total: dbOrder.total_amount,
        currency: dbOrder.currency || 'brl',
      },
      status: dbOrder.status,
      paymentStatus: this.mapPaymentStatus(dbOrder.payment_status),
      payment_method: dbOrder.payment_method, // Adiciona método de pagamento
      shippingAddress: dbOrder.shipping_address || {},
      billingAddress: dbOrder.billing_address || {},
      trackingInfo: dbOrder.tracking_info,
      notes: dbOrder.notes,
      refunds: [],
      timeline: [
        {
          id: '1',
          type: 'status_change',
          description: 'Pedido criado',
          createdAt: new Date(dbOrder.created_at),
        },
      ],
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at),
    };

    return stripeOrder as StripeOrder;
  }

  /**
   * Mapeia status de pagamento do banco para o formato admin
   */
  private mapPaymentStatus(dbPaymentStatus: string): StripeOrder['paymentStatus'] {
    const statusMap: Record<string, StripeOrder['paymentStatus']> = {
      'pending': 'pending',
      'completed': 'paid',
      'failed': 'failed',
      'refunded': 'refunded',
      'partially_refunded': 'partially_refunded',
    };
    
    return statusMap[dbPaymentStatus] || 'pending';
  }
}

export const adminOrderService = new AdminOrderService();