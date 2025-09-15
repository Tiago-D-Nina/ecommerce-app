import { useState } from 'react';
import { Plus, Edit3, Trash2, MapPin, Home, Building, Star } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useAuthStore } from '../../../store/authStore';
import type { Address } from '../../../types';

interface AddressFormData {
  type: 'home' | 'work' | 'other';
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export function AddressSection() {
  const { 
    addresses, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress, 
    isLoading 
  } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    type: 'home',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    isDefault: addresses.length === 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      type: 'home',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil',
      isDefault: addresses.length === 0,
    });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória';
    if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
    if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'CEP inválido (formato: 12345-678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value.slice(0, -1);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, zipCode: formatted }));
  };

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    let success = false;

    if (editingId) {
      success = await updateAddress(editingId, formData);
    } else {
      success = await addAddress(formData);
    }

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      type: address.type,
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (window.confirm('Tem certeza que deseja remover este endereço?')) {
      await deleteAddress(addressId);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    await setDefaultAddress(addressId);
  };

  const getAddressTypeIcon = (type: Address['type']) => {
    switch (type) {
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'work':
        return <Building className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getAddressTypeLabel = (type: Address['type']) => {
    switch (type) {
      case 'home':
        return 'Casa';
      case 'work':
        return 'Trabalho';
      default:
        return 'Outro';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Endereços</h2>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Endereço
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Editar Endereço' : 'Adicionar Novo Endereço'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Endereço
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as 'home' | 'work' | 'other')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              >
                <option value="home">Casa</option>
                <option value="work">Trabalho</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua *
                </label>
                <Input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className={errors.street ? 'border-red-500' : ''}
                  placeholder="Ex: Rua das Flores"
                  disabled={isLoading}
                />
                {errors.street && (
                  <p className="text-sm text-red-500 mt-1">{errors.street}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <Input
                  type="text"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className={errors.number ? 'border-red-500' : ''}
                  placeholder="123"
                  disabled={isLoading}
                />
                {errors.number && (
                  <p className="text-sm text-red-500 mt-1">{errors.number}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <Input
                type="text"
                value={formData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                placeholder="Apto 456, Bloco B"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <Input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className={errors.neighborhood ? 'border-red-500' : ''}
                  placeholder="Centro"
                  disabled={isLoading}
                />
                {errors.neighborhood && (
                  <p className="text-sm text-red-500 mt-1">{errors.neighborhood}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP *
                </label>
                <Input
                  type="text"
                  value={formData.zipCode}
                  onChange={handleZipCodeChange}
                  className={errors.zipCode ? 'border-red-500' : ''}
                  placeholder="12345-678"
                  disabled={isLoading}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={errors.city ? 'border-red-500' : ''}
                  placeholder="São Paulo"
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <Input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={errors.state ? 'border-red-500' : ''}
                  placeholder="São Paulo"
                  disabled={isLoading}
                />
                {errors.state && (
                  <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Definir como endereço padrão
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum endereço cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Adicione um endereço para facilitar suas compras
            </p>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getAddressTypeIcon(address.type)}
                    <span className="font-medium text-gray-900">
                      {getAddressTypeLabel(address.type)}
                    </span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        <Star className="h-3 w-3 fill-current" />
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">
                    {address.street}, {address.number}
                    {address.complement && `, ${address.complement}`}
                  </p>
                  <p className="text-gray-700">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                  <p className="text-gray-700">
                    CEP: {address.zipCode} - {address.country}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!address.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(address.id)}
                      variant="ghost"
                      size="sm"
                      className="text-primary-600 hover:text-primary-700"
                      disabled={isLoading}
                    >
                      Tornar Padrão
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEdit(address)}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(address.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}