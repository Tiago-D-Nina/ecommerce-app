import supabaseService from './supabase';
import type { Order, OrderItem, CartItem, Address } from '../types';

export class OrderService {
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabaseService.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            image_url,
            slug
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformOrder);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabaseService.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            image_url,
            slug
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.transformOrder(data) : null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await supabaseService.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            image_url,
            slug
          )
        )
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.transformOrder(data) : null;
  }

  async createOrder(orderData: {
    user_id: string;
    items: CartItem[];
    billing_address: Address;
    shipping_address: Address;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount?: number;
    shipping_method?: string;
    notes?: string;
  }): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    const total = orderData.subtotal + orderData.tax_amount + orderData.shipping_amount - (orderData.discount_amount || 0);

    // Create the order
    const order = await supabaseService.insert<Order>('orders', {
      user_id: orderData.user_id,
      order_number: orderNumber,
      status: 'pending',
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      shipping_amount: orderData.shipping_amount,
      discount_amount: orderData.discount_amount || 0,
      total_amount: total,
      currency: 'BRL',
      billing_address: orderData.billing_address,
      shipping_address: orderData.shipping_address,
      shipping_method: orderData.shipping_method,
      notes: orderData.notes
    });

    // Create order items
    const orderItems: Omit<OrderItem, 'id' | 'created_at'>[] = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_sku: item.product.sku,
      product_image: item.product.image_url,
      unit_price: item.product.price,
      quantity: item.quantity,
      total_price: item.product.price * item.quantity
    }));

    // Insert order items
    const { error: itemsError } = await supabaseService.supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Return the complete order
    return await this.getOrderById(order.id) as Order;
  }

  async updateOrderStatus(
    orderId: string, 
    status: Order['status'],
    metadata?: {
      tracking_number?: string;
      shipped_at?: string;
      delivered_at?: string;
      notes?: string;
    }
  ): Promise<Order> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (metadata) {
      Object.assign(updates, metadata);
    }

    // Auto-set timestamps based on status
    if (status === 'shipped' && !updates.shipped_at) {
      updates.shipped_at = new Date().toISOString();
    }

    if (status === 'delivered' && !updates.delivered_at) {
      updates.delivered_at = new Date().toISOString();
    }

    const data = await supabaseService.update<Order>('orders', orderId, updates);
    return this.transformOrder(data);
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const updates: any = {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updates.notes = `Cancelled: ${reason}`;
    }

    const data = await supabaseService.update<Order>('orders', orderId, updates);
    return this.transformOrder(data);
  }

  // Payment integration methods
  async updateOrderPayment(orderId: string, paymentData: {
    stripe_payment_intent_id?: string;
    stripe_session_id?: string;
    status?: Order['status'];
  }): Promise<Order> {
    const data = await supabaseService.update<Order>('orders', orderId, {
      ...paymentData,
      updated_at: new Date().toISOString()
    });

    return this.transformOrder(data);
  }

  // Statistics and analytics
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  }> {
    const { data: orders } = await supabaseService.supabase
      .from('orders')
      .select('status, total_amount')
      .eq('user_id', userId);

    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        ordersByStatus: {}
      };
    }

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const averageOrderValue = totalSpent / totalOrders;

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      ordersByStatus
    };
  }

  // Utility methods
  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  calculateOrderTotals(items: CartItem[], shippingCost = 0, taxRate = 0.1, discountAmount = 0): {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const shipping = shippingCost;
    const discount = discountAmount;
    const total = subtotal + tax + shipping - discount;

    return { subtotal, tax, shipping, discount, total };
  }

  // Private helper methods
  private transformOrder(data: any): Order {
    const order = data as Order & { order_items?: any[] };
    
    // Transform order items if present
    const items = order.order_items?.map(item => ({
      product: {
        id: item.product_id,
        name: item.product_name,
        image_url: item.product_image,
        price: item.unit_price,
        // Mock other required Product fields for backward compatibility
        slug: item.products?.slug || '',
        description: '',
        short_description: '',
        currency: 'BRL',
        sku: item.product_sku || '',
        stock_quantity: 0,
        manage_stock: true,
        in_stock: true,
        gallery: [],
        category_id: '',
        tags: [],
        status: 'published' as const,
        featured: false,
        created_at: '',
        updated_at: '',
        image: item.product_image,
        category: '',
        rating: 0,
        reviewCount: 0,
        inStock: true
      },
      quantity: item.quantity
    })) || [];

    // Add computed fields for backward compatibility
    return {
      ...order,
      userId: order.user_id,
      items,
      total: order.total_amount,
      shippingCost: order.shipping_amount,
      tax: order.tax_amount,
      shippingAddress: order.shipping_address as Address,
      billingAddress: order.billing_address as Address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      deliveredAt: order.delivered_at,
      estimatedDelivery: order.delivered_at
    };
  }

  // Real-time subscriptions
  subscribeToUserOrders(userId: string, callback: (payload: any) => void) {
    return supabaseService.supabase
      .channel(`user-orders-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }
}

export default new OrderService();