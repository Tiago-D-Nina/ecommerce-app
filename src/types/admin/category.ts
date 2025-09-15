export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  level: number;
  path: string;
  metadata: {
    icon?: string;
    color?: string;
    featured: boolean;
    sortOrder: number;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  status: 'active' | 'inactive';
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  metadata?: {
    icon?: string;
    color?: string;
    featured?: boolean;
    sortOrder?: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  status?: 'active' | 'inactive';
}

export interface CategoryFilters {
  status?: 'active' | 'inactive' | 'all';
  parentId?: string;
  level?: number;
  search?: string;
  featured?: boolean;
}

export interface CategorySelectOption {
  value: string;
  label: string;
  level: number;
  children?: CategorySelectOption[];
}