import supabaseService from './supabase';
import type { Product } from '../types';

export class ProductsService {
  // Public product queries (no auth required)
  async getAllProducts(filters?: {
    category_id?: string;
    status?: 'published' | 'draft' | 'archived';
    featured?: boolean;
    search?: string;
    priceMin?: number;
    priceMax?: number;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let query = supabaseService.supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'published'); // Default to published only
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.priceMin) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters?.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    // Default ordering
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Transform data for backward compatibility
    return (data || []).map(this.transformProduct);
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabaseService.supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return this.transformProduct(data);
  }

  // Admin version - gets product regardless of status
  async getProductByIdForAdmin(id: string): Promise<Product | null> {
    const { data, error } = await supabaseService.supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return this.transformProduct(data);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabaseService.supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return this.transformProduct(data);
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return this.getAllProducts({ 
      featured: true, 
      status: 'published',
      limit 
    });
  }

  async getProductsByCategory(categoryId: string, limit?: number): Promise<Product[]> {
    return this.getAllProducts({ 
      category_id: categoryId, 
      status: 'published',
      limit 
    });
  }

  async searchProducts(query: string, limit = 20): Promise<Product[]> {
    return this.getAllProducts({ 
      search: query, 
      status: 'published',
      limit 
    });
  }

  // Admin methods (require authentication)
  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    // Generate slug if not provided
    if (!productData.slug && productData.name) {
      productData.slug = supabaseService.generateSlug(productData.name);
    }

    const data = await supabaseService.insert<Product>('products', {
      ...productData,
      status: productData.status || 'draft'
    });

    return this.transformProduct(data);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    // Update slug if name changed
    if (updates.name && !updates.slug) {
      updates.slug = supabaseService.generateSlug(updates.name);
    }

    const data = await supabaseService.update<Product>('products', id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return this.transformProduct(data);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return await supabaseService.delete('products', id);
  }

  async updateStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Product not found');

    const newQuantity = Math.max(0, product.stock_quantity + quantity);
    
    return await this.updateProduct(productId, {
      stock_quantity: newQuantity,
      in_stock: newQuantity > 0
    });
  }

  async checkStock(productId: string, requestedQuantity: number): Promise<boolean> {
    const product = await this.getProductById(productId);
    if (!product) return false;

    return product.in_stock && product.stock_quantity >= requestedQuantity;
  }

  // File upload for product images
  async uploadProductImage(file: File, productId?: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${productId || timestamp}_${timestamp}.${extension}`;
    const filePath = `products/${fileName}`;

    await supabaseService.uploadFile('products', filePath, file);
    return supabaseService.getPublicUrl('products', filePath);
  }

  // Private helper methods
  private transformProduct(data: any): Product {
    const product = data as Product;
    
    // Add computed fields for backward compatibility
    return {
      ...product,
      originalPrice: product.sale_price && product.sale_price < product.price ? product.price : undefined,
      image: product.image_url,
      category: data.categories?.name || '',
      rating: 4.5, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count from reviews
      inStock: product.in_stock
    };
  }

  // Real-time subscriptions
  subscribeToProducts(callback: (payload: any) => void) {
    return supabaseService.subscribeToTable('products', callback);
  }
}

export default new ProductsService();