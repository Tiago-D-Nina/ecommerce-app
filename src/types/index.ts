export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  currency: string;
  sku?: string;
  stock_quantity: number;
  manage_stock: boolean;
  in_stock: boolean;
  image_url: string;
  gallery?: string[];
  category_id: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  weight?: number;
  dimensions?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Computed fields
  originalPrice?: number;
  image?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  description?: string;
}

export interface CepData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  stateCode: string;
  region: string;
  ddd: string;
  isValid: boolean;
}

export interface CepState {
  cep: string;
  data: CepData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export interface StaticBanner {
  id?: string;
  imageUrl: string;
  alt: string;
  link?: string;
  title?: string;
  priority?: boolean; // Para loading prioritário
}

export interface ShippingInfo {
  method: 'standard' | 'express' | 'same-day';
  cost: number;
  estimatedDays: number;
  description: string;
}

export interface CheckoutStep {
  id: string;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface OrderSummary {
  subtotal: number;
  shipping: ShippingInfo;
  tax: number;
  total: number;
  itemCount: number;
}

export interface CartState extends Cart {
  isDrawerOpen: boolean;
  shippingInfo: ShippingInfo | null;
  orderSummary: OrderSummary | null;
}

export type CheckoutStepId = 'cart' | 'checkout' | 'payment';

// Database permissions structure (JSONB from Supabase)
export interface DatabasePermissions {
  [resource: string]: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  cpf?: string;
  date_of_birth?: string;
  stripe_customer_id?: string;
  role?: 'customer' | 'admin';
  permissions?: DatabasePermissions;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for backward compatibility
  firstName?: string;
  lastName?: string;
  avatar?: string;
  dateOfBirth?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping' | 'both';
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields for backward compatibility
  userId?: string;
  zipCode?: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'pix';
  cardNumber?: string; // Last 4 digits only
  cardHolder?: string;
  expiryDate?: string;
  brand?: 'visa' | 'mastercard' | 'amex' | 'elo';
  isDefault: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  billing_address: Record<string, any>;
  shipping_address: Record<string, any>;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  shipping_method?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for backward compatibility
  userId?: string;
  items?: CartItem[];
  total?: number;
  shippingCost?: number;
  tax?: number;
  paymentMethod?: PaymentMethod;
  shippingAddress?: Address;
  billingAddress?: Address;
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  deliveredAt?: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  amount: number;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | import('../services/errorHandler').ErrorMessage | null;
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      addresses: {
        Row: Address;
        Insert: Omit<Address, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Address, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Review, 'id' | 'created_at'>>;
      };
    };
  };
}