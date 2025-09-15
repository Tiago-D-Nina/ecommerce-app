import supabaseService from './supabase';
import type { Category } from '../types';

export class CategoriesService {
  // Public category queries
  async getAllCategories(includeSubcategories = true): Promise<Category[]> {
    let query = supabaseService.supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const categories = data || [];

    if (includeSubcategories) {
      // Group subcategories under their parents
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create all categories
      categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, subcategories: [] });
      });

      // Second pass: organize hierarchy
      categories.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          // This is a subcategory
          const parent = categoryMap.get(cat.parent_id)!;
          parent.subcategories = parent.subcategories || [];
          parent.subcategories.push(category);
        } else {
          // This is a root category
          rootCategories.push(category);
        }
      });

      return rootCategories;
    }

    return categories;
  }

  async getRootCategories(): Promise<Category[]> {
    const { data, error } = await supabaseService.supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    const { data, error } = await supabaseService.supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabaseService.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Category | null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabaseService.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Category | null;
  }

  async getCategoryWithProducts(categoryId: string, includeSubcategories = true): Promise<{
    category: Category;
    productCount: number;
    subcategoryProductCounts?: Record<string, number>;
  } | null> {
    const category = await this.getCategoryById(categoryId);
    if (!category) return null;

    // Count products in this category
    const { count: productCount } = await supabaseService.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('status', 'published');

    const result: any = {
      category,
      productCount: productCount || 0
    };

    if (includeSubcategories) {
      // Get subcategories and their product counts
      const subcategories = await this.getSubcategories(categoryId);
      const subcategoryProductCounts: Record<string, number> = {};

      for (const subcat of subcategories) {
        const { count } = await supabaseService.supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', subcat.id)
          .eq('status', 'published');

        subcategoryProductCounts[subcat.id] = count || 0;
      }

      result.subcategoryProductCounts = subcategoryProductCounts;
    }

    return result;
  }

  // Admin methods
  async createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    // Generate slug if not provided
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = supabaseService.generateSlug(categoryData.name);
    }

    return await supabaseService.insert<Category>('categories', {
      ...categoryData,
      is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
      sort_order: categoryData.sort_order || 0
    });
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    // Update slug if name changed
    if (updates.name && !updates.slug) {
      updates.slug = supabaseService.generateSlug(updates.name);
    }

    return await supabaseService.update<Category>('categories', id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  async deleteCategory(id: string, moveProductsTo?: string): Promise<boolean> {
    // If moveProductsTo is specified, move all products to that category
    if (moveProductsTo) {
      await supabaseService.supabase
        .from('products')
        .update({ category_id: moveProductsTo })
        .eq('category_id', id);
    }

    // Move subcategories to parent or root level
    await supabaseService.supabase
      .from('categories')
      .update({ parent_id: null })
      .eq('parent_id', id);

    return await supabaseService.delete('categories', id);
  }

  async reorderCategories(categoryIds: string[]): Promise<boolean> {
    for (let i = 0; i < categoryIds.length; i++) {
      await supabaseService.update('categories', categoryIds[i], {
        sort_order: i + 1,
        updated_at: new Date().toISOString()
      });
    }
    return true;
  }

  // File upload for category images
  async uploadCategoryImage(file: File, categoryId?: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${categoryId || timestamp}_${timestamp}.${extension}`;
    const filePath = `categories/${fileName}`;

    await supabaseService.uploadFile('categories', filePath, file);
    return supabaseService.getPublicUrl('categories', filePath);
  }

  // Utility methods
  async validateCategoryHierarchy(categoryId: string, parentId: string): Promise<boolean> {
    // Prevent circular references
    if (categoryId === parentId) return false;

    // Check if parentId is already a descendant of categoryId
    let currentParentId = parentId;
    while (currentParentId) {
      const parent = await this.getCategoryById(currentParentId);
      if (!parent) break;
      
      if (parent.parent_id === categoryId) return false; // Circular reference detected
      currentParentId = parent.parent_id;
    }

    return true;
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await this.getCategoryById(currentId);
      if (!category) break;

      path.unshift(category);
      currentId = category.parent_id;
    }

    return path;
  }

  // Real-time subscriptions
  subscribeToCategories(callback: (payload: any) => void) {
    return supabaseService.subscribeToTable('categories', callback);
  }
}

export default new CategoriesService();