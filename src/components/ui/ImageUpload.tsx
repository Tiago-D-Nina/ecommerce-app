import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { ImageUploadService, type ImageUploadResult } from '../../utils/imageUpload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  productId?: string;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  productId,
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (disabled || uploading) return;

    setUploading(true);
    
    try {
      const result: ImageUploadResult = await ImageUploadService.uploadImage(file, productId);
      
      if (result.success && result.url) {
        onChange(result.url);
      } else {
        console.error('Upload failed:', result.error);
        // You could add a notification system here
        alert(result.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro interno ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = async () => {
    if (value) {
      // Try to delete from storage, but don't block UI if it fails
      try {
        await ImageUploadService.deleteImage(value);
      } catch (error) {
        console.warn('Failed to delete image from storage:', error);
      }
      onChange(null);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        // Show uploaded image
        <div className="relative group">
          <div className="aspect-video w-full overflow-hidden rounded-lg border-2 border-gray-200">
            <img
              src={value}
              alt="Product image"
              className="h-full w-full object-cover"
            />
          </div>
          
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openFileDialog}
                  disabled={uploading}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Alterar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-white text-sm">Enviando...</div>
            </div>
          )}
        </div>
      ) : (
        // Show upload area
        <div
          className={`
            aspect-video w-full border-2 border-dashed rounded-lg transition-colors
            ${dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-600">Enviando imagem...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Clique para selecionar ou arraste uma imagem
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP ou GIF até 50MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};