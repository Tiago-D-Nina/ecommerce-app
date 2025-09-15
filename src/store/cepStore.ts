import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViaCepService } from '../services/viacep';
import type { CepData } from '../types';

interface CepStoreState {
  cep: string;
  data: CepData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // Actions
  fetchCep: (cep: string) => Promise<void>;
  clearCep: () => void;
  clearError: () => void;
  validateCep: (cep: string) => boolean;
  formatCep: (cep: string) => string;
}

export const useCepStore = create<CepStoreState>()(
  persist(
    (set, get) => ({
      cep: '',
      data: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      fetchCep: async (inputCep: string) => {
        const formatted = get().formatCep(inputCep);
        
        // Validar formato básico antes de fazer a requisição
        if (!get().validateCep(formatted)) {
          set({ 
            error: 'CEP deve conter exatamente 8 dígitos',
            isLoading: false 
          });
          return;
        }

        // Iniciar loading
        set({ 
          isLoading: true, 
          error: null,
          cep: formatted
        });

        try {
          const addressData = await ViaCepService.fetchCepData(formatted);
          
          if (addressData) {
            set({
              cep: formatted,
              data: addressData,
              isLoading: false,
              error: null,
              lastUpdated: Date.now()
            });
          } else {
            throw new Error('CEP não encontrado');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar CEP';
          set({
            data: null,
            isLoading: false,
            error: errorMessage,
            lastUpdated: null
          });
        }
      },

      clearCep: () => {
        set({ 
          cep: '', 
          data: null, 
          isLoading: false, 
          error: null, 
          lastUpdated: null 
        });
      },

      clearError: () => {
        set({ error: null });
      },

      validateCep: (cep: string) => {
        return ViaCepService.validateCep(cep);
      },

      formatCep: (cep: string) => {
        return ViaCepService.formatCep(cep);
      },
    }),
    {
      name: 'cep-storage',
      // Usar sessionStorage ao invés de localStorage para persistir apenas na sessão
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);