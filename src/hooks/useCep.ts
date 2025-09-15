import { useCepStore } from '../store/cepStore';

export const useCep = () => {
  const {
    cep,
    data,
    isLoading,
    error,
    lastUpdated,
    fetchCep,
    clearCep,
    clearError,
    validateCep,
    formatCep,
  } = useCepStore();

  const handleCepSubmit = async (inputCep: string) => {
    await fetchCep(inputCep);
  };

  const getCepInfo = () => {
    if (cep && data) {
      return {
        ...data,
        fullAddress: `${data.city}, ${data.stateCode}`,
        detailedAddress: data.street ? 
          `${data.street}, ${data.neighborhood}, ${data.city} - ${data.stateCode}` :
          `${data.neighborhood}, ${data.city} - ${data.stateCode}`
      };
    }
    return null;
  };

  const hasValidCep = () => {
    return cep && data && data.isValid;
  };

  const canChangeCep = () => {
    return !isLoading;
  };

  return {
    // Estado
    cep,
    data,
    isLoading,
    error,
    lastUpdated,
    
    // Ações
    fetchCep,
    clearCep,
    clearError,
    validateCep,
    formatCep,
    handleCepSubmit,
    
    // Utilitários
    getCepInfo,
    hasValidCep,
    canChangeCep,
  };
};