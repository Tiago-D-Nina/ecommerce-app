import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'product-images';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo selecionado' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF' 
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: 'Arquivo muito grande. Máximo 50MB' 
      };
    }

    return { valid: true };
  }

  static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `product_${timestamp}_${random}.${extension}`;
  }

  static async uploadImage(file: File, productId?: string): Promise<ImageUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileName = this.generateFileName(file.name);
      const filePath = productId ? `products/${productId}/${fileName}` : `temp/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { 
          success: false, 
          error: 'Erro ao fazer upload da imagem: ' + error.message 
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { 
        success: true, 
        url: publicUrl 
      };

    } catch (error) {
      console.error('Upload service error:', error);
      return { 
        success: false, 
        error: 'Erro interno no upload da imagem' 
      };
    }
  }

  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      if (bucketIndex === -1) return false;

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  static async moveImageToProduct(tempUrl: string, productId: string): Promise<string | null> {
    try {
      // Extract temp file path from URL
      const urlParts = tempUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      if (bucketIndex === -1) return null;

      const tempPath = urlParts.slice(bucketIndex + 1).join('/');
      const fileName = tempPath.split('/').pop();
      if (!fileName) return null;

      const newPath = `products/${productId}/${fileName}`;

      // Copy file to new location
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .copy(tempPath, newPath);

      if (error) {
        console.error('Move error:', error);
        return null;
      }

      // Delete temp file
      await this.deleteImage(tempUrl);

      // Return new URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(newPath);

      return publicUrl;
    } catch (error) {
      console.error('Move service error:', error);
      return null;
    }
  }
}