import { supabase } from '../utils/supabase';

export interface OrderData {
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  subtotal: number;
  total_amount: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  payment_method: 'pix' | 'credit' | 'boleto' | 'delivery';
  payment_status: 'pending' | 'completed';
  payment_data: any;
  billing_address: any;
  shipping_address: any;
  shipping_method?: string;
  notes?: string;
  items: OrderItem[];
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

class OrderService {
  /**
   * Registra um novo pedido no banco de dados
   */
  async createOrder(orderData: OrderData): Promise<{ success: boolean; order_id?: string; order_number?: string; error?: string }> {
    try {
      // Gerar número do pedido único
      const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Determinar status de pagamento baseado na forma de pagamento
      let payment_status = orderData.payment_status;
      
      // Regras de negócio para status inicial
      switch (orderData.payment_method) {
        case 'credit':
          // Cartão só é registrado se aprovado
          payment_status = 'completed';
          break;
        case 'pix':
        case 'boleto':
        case 'delivery':
          payment_status = 'pending';
          break;
      }

      // Criar pedido principal
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.user_id,
          user_name: orderData.user_name,
          user_email: orderData.user_email,
          user_phone: orderData.user_phone,
          order_number,
          subtotal: orderData.subtotal,
          total_amount: orderData.total_amount,
          tax_amount: orderData.tax_amount || 0,
          shipping_amount: orderData.shipping_amount || 0,
          discount_amount: orderData.discount_amount || 0,
          payment_method: orderData.payment_method,
          payment_status,
          payment_data: orderData.payment_data || {},
          billing_address: orderData.billing_address,
          shipping_address: orderData.shipping_address,
          shipping_method: orderData.shipping_method,
          notes: orderData.notes,
          status: 'pending',
          currency: 'BRL'
        })
        .select('id, order_number')
        .single();

      if (orderError) {
        throw new Error(`Erro ao criar pedido: ${orderError.message}`);
      }

      // Criar itens do pedido
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_image: item.product_image,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // Se falhar ao criar itens, desfazer criação do pedido
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Erro ao criar itens do pedido: ${itemsError.message}`);
      }

      return {
        success: true,
        order_id: order.id,
        order_number: order.order_number
      };

    } catch (error) {
      console.error('Erro no OrderService.createOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Atualiza status de pagamento de um pedido
   */
  async updatePaymentStatus(orderId: string, status: 'pending' | 'completed'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no OrderService.updatePaymentStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Busca pedido por ID
   */
  async getOrderById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      return { success: true, order: data };
    } catch (error) {
      console.error('Erro no OrderService.getOrderById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Busca pedidos de um usuário
   */
  async getUserOrders(userId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { success: true, orders: data };
    } catch (error) {
      console.error('Erro no OrderService.getUserOrders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const orderService = new OrderService();