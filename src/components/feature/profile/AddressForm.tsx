import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Save } from 'lucide-react';
import { useAuth } from '../../../store/authStore';
import { useCepStore } from '../../../store/cepStore';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { Address } from '../../../types';

const addressSchema = z.object({
  street: z.string().min(3, 'Rua deve ter pelo menos 3 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  country: z.string().default('BR'),
  type: z.enum(['billing', 'shipping', 'both']),
  is_default: z.boolean().default(false)
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  address?: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onSuccess,
  onCancel
}) => {
  const { addAddress, updateAddress, isLoading, error, clearError } = useAuth();
  const { fetchCep, data: cepData, isLoading: cepLoading } = useCepStore();
  const [cepInput, setCepInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: address?.street || '',
      number: address?.number || '',
      complement: address?.complement || '',
      neighborhood: address?.neighborhood || '',
      city: address?.city || '',
      state: address?.state || '',
      postal_code: address?.postal_code || '',
      country: address?.country || 'BR',
      type: address?.type || 'both',
      is_default: address?.is_default || false
    }
  });

  useEffect(() => {
    if (address) {
      reset({
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        type: address.type,
        is_default: address.is_default
      });
      setCepInput(address.postal_code);
    }
  }, [address, reset]);

  useEffect(() => {
    if (cepData && cepData.isValid) {
      setValue('street', cepData.street);
      setValue('neighborhood', cepData.neighborhood);
      setValue('city', cepData.city);
      setValue('state', cepData.stateCode);
    }
  }, [cepData, setValue]);

  const handleCepSearch = async () => {
    if (cepInput.length >= 8) {
      const cleanCep = cepInput.replace(/\D/g, '');
      await fetchCep(cleanCep);
    }
  };

  const handleCepInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      if (value.length > 5) {
        value = `${value.slice(0, 5)}-${value.slice(5)}`;
      }
      setCepInput(value);
      setValue('postal_code', value);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    clearError();
    
    try {
      let success;
      if (address?.id) {
        success = await updateAddress(address.id, data);
      } else {
        const addressData = {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        success = await addAddress(addressData);
      }
      
      if (success) {
        onSuccess();
      }
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {address ? 'Editar Endereço' : 'Novo Endereço'}
        </h3>
        <p className="text-sm text-gray-600">
          {address ? 'Atualize as informações do endereço' : 'Preencha os dados do novo endereço'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {typeof error === 'string' ? error : error.message}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">CEP</label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="text"
                value={cepInput}
                onChange={handleCepInputChange}
                placeholder="00000-000"
                className={errors.postal_code ? 'border-red-300' : ''}
              />
              {errors.postal_code && (
                <p className="text-sm text-red-600 mt-1">{errors.postal_code.message}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCepSearch}
              disabled={cepLoading || cepInput.length < 8}
              className="flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </Button>
          </div>
          {cepData && !cepData.isValid && (
            <p className="text-sm text-red-600">CEP não encontrado</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
              Rua/Avenida
            </label>
            <Input
              {...register('street')}
              id="street"
              type="text"
              className={errors.street ? 'border-red-300' : ''}
              placeholder="Nome da rua"
            />
            {errors.street && (
              <p className="text-sm text-red-600">{errors.street.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">
              Número
            </label>
            <Input
              {...register('number')}
              id="number"
              type="text"
              className={errors.number ? 'border-red-300' : ''}
              placeholder="123"
            />
            {errors.number && (
              <p className="text-sm text-red-600">{errors.number.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="complement" className="block text-sm font-medium text-gray-700">
              Complemento
            </label>
            <Input
              {...register('complement')}
              id="complement"
              type="text"
              placeholder="Apt 456, Bloco B (opcional)"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
              Bairro
            </label>
            <Input
              {...register('neighborhood')}
              id="neighborhood"
              type="text"
              className={errors.neighborhood ? 'border-red-300' : ''}
              placeholder="Centro"
            />
            {errors.neighborhood && (
              <p className="text-sm text-red-600">{errors.neighborhood.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <Input
              {...register('city')}
              id="city"
              type="text"
              className={errors.city ? 'border-red-300' : ''}
              placeholder="São Paulo"
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <Input
              {...register('state')}
              id="state"
              type="text"
              className={errors.state ? 'border-red-300' : ''}
              placeholder="SP"
            />
            {errors.state && (
              <p className="text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Endereço
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  {...register('type')}
                  type="radio"
                  value="both"
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">Cobrança e Entrega</span>
              </label>
              <label className="flex items-center">
                <input
                  {...register('type')}
                  type="radio"
                  value="shipping"
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">Apenas Entrega</span>
              </label>
              <label className="flex items-center">
                <input
                  {...register('type')}
                  type="radio"
                  value="billing"
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">Apenas Cobrança</span>
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...register('is_default')}
              id="is_default"
              type="checkbox"
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
              Definir como endereço padrão
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Salvando...' : 'Salvar Endereço'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;