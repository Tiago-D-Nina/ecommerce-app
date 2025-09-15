import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Edit2 } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { useCep } from '../../hooks/useCep';
import { cn } from '../../utils';

interface CepPopupProps {
  className?: string;
}

export const CepPopup = ({ className }: CepPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const { 
    cep, 
    isLoading, 
    error, 
    handleCepSubmit, 
    clearError, 
    validateCep, 
    formatCep, 
    getCepInfo, 
    hasValidCep 
  } = useCep();

  useEffect(() => {
    setInputValue(cep);
  }, [cep]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Adicionar delay para permitir navegação até o popup
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 500);
  };

  // Limpar timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCep(value);
    setInputValue(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateCep(inputValue)) {
      return;
    }
    
    await handleCepSubmit(inputValue);
    
    // Fechar popup apenas se não houver erro
    if (!error && hasValidCep()) {
      setIsOpen(false);
    }
  };

  const cepInfo = getCepInfo();
  const displayText = hasValidCep() && cepInfo ? cepInfo.fullAddress : 'CEP';

  return (
    <div 
      ref={containerRef}
      className={cn('absolute', className)} 
      data-testid="cep-component"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Component */}
      <div className="flex items-center space-x-3 py-2 px-3 cursor-pointer">
        <MapPin className="h-6 w-6 text-white" />
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">Informe seu</span>
          <span className="text-xs text-white font-medium">{displayText}</span>
        </div>
        {hasValidCep() && (
          <Edit2 className="h-3 w-3 text-gray-300 ml-2" />
        )}
      </div>

      {/* Popup */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg p-4 z-50 min-w-64"
          data-testid="cep-popup"
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="cep-input" className="block text-sm font-medium text-gray-700 mb-1">
                {hasValidCep() ? 'Alterar CEP' : 'Informe seu CEP'}
              </label>
              <Input
                id="cep-input"
                type="text"
                placeholder="00000-000"
                value={inputValue}
                onChange={handleInputChange}
                maxLength={9}
                className="w-full"
                autoFocus
                disabled={isLoading}
              />
              {inputValue && !validateCep(inputValue) && (
                <p className="text-xs text-red-500 mt-1">CEP deve ter 8 dígitos</p>
              )}
              {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={!validateCep(inputValue) || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Buscando...
                  </>
                ) : (
                  hasValidCep() ? 'Alterar' : 'Confirmar'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Fechar
              </Button>
            </div>
          </form>

          {hasValidCep() && cepInfo && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                CEP: <span className="font-medium">{cepInfo.cep}</span>
              </p>
              <p className="text-xs text-gray-600">
                Localização: <span className="font-medium">{cepInfo.fullAddress}</span>
              </p>
              {cepInfo.street && (
                <p className="text-xs text-gray-600">
                  Endereço: <span className="font-medium">{cepInfo.detailedAddress}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};