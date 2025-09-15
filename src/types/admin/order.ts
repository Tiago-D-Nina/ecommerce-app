import type { Address } from '../index';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stripeProductId: string;
  stripePriceId: string;
}

export interface StripeOrder {
  id: string;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  orderNumber: string;
  customer: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
  items: OrderItem[];
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  shippingAddress: Address;
  billingAddress: Address;
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    url?: string;
    estimatedDelivery?: Date;
  };
  notes?: string;
  refunds?: OrderRefund[];
  timeline: OrderEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderRefund {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'succeeded' | 'failed';
  stripeRefundId: string;
  createdAt: Date;
}

export interface OrderEvent {
  id: string;
  type: 'status_change' | 'payment' | 'shipping' | 'refund' | 'note';
  description: string;
  details?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

export interface OrderFilters {
  status?: StripeOrder['status'] | 'all';
  paymentStatus?: StripeOrder['paymentStatus'] | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  conversionRate: number;
  topProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface UpdateOrderStatusData {
  status: StripeOrder['status'];
  notes?: string;
  trackingInfo?: StripeOrder['trackingInfo'];
}

export interface ProcessRefundData {
  amount?: number;
  reason: string;
  refundShipping?: boolean;
}