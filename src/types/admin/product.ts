export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'in';
}

export interface StripeProduct {
  id: string;
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  description: string;
  images: string[];
  metadata: {
    category: string;
    tags: string[];
    weight?: number;
    dimensions?: ProductDimensions;
    sku?: string;
  };
  pricing: {
    unitAmount: number;
    currency: string;
    type: 'one_time' | 'recurring';
    interval?: 'day' | 'week' | 'month' | 'year';
  };
  inventory: {
    type: 'finite' | 'infinite';
    quantity?: number;
    tracking: boolean;
  };
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  description?: string;
  images?: string[];
  price: number;
  currency?: string;
  categoryIds: string[];
  tags?: string[];
  weight?: number;
  dimensions?: ProductDimensions;
  inventory?: {
    type: 'finite' | 'infinite';
    quantity?: number;
    tracking?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: 'draft' | 'active' | 'archived';
}

export interface ProductFilters {
  status?: 'draft' | 'active' | 'archived' | 'all';
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProductFormData {
  name: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  categoryIds: string[];
  tags: string[];
  weight?: number;
  dimensions?: ProductDimensions;
  inventory: {
    type: 'finite' | 'infinite';
    quantity?: number;
    tracking: boolean;
  };
  status: 'draft' | 'active';
  metadata?: Record<string, any>;
}