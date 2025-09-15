export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary';
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FetchParams {
  page?: number;
  limit?: number;
  sort?: SortConfig;
  filters?: Record<string, any>;
}

export interface APIResponse<T> {
  data: T;
  pagination?: PaginationConfig;
  success: boolean;
  message?: string;
}

export interface BulkOperation {
  ids: string[];
  operation: string;
  data?: Record<string, any>;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface ThumbnailUrls {
  small: string;
  medium: string;
  large: string;
}