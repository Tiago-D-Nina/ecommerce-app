import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { useAuth } from '../../../store/authStore';
import { Button } from '../../ui/Button';
import { AddressForm } from './AddressForm';
import type { Address } from '../../../types';

export const AddressList: React.FC = () => {
  const { user, addresses, loadAddresses, deleteAddress, setDefaultAddress, isLoading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user, loadAddresses]);

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      await deleteAddress(addressId);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    await setDefaultAddress(addressId);
  };

  const formatAddress = (address: Address): string => {
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      `${address.city} - ${address.state}`,
      address.postal_code
    ].filter(Boolean);

    return parts.join(', ');
  };

  const getAddressTypeLabel = (type: string): string => {
    const labels = {
      billing: 'Cobrança',
      shipping: 'Entrega',
      both: 'Cobrança e Entrega'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAddressTypeColor = (type: string): string => {
    const colors = {
      billing: 'bg-blue-100 text-blue-800',
      shipping: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Você precisa estar logado para ver seus endereços.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Meus Endereços</h2>
            <p className="text-gray-600">Gerencie seus endereços de entrega e cobrança</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Endereço</span>
          </Button>
        </div>
      </div>

      {(showAddForm || editingAddress) && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <AddressForm
            address={editingAddress}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingAddress(null);
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingAddress(null);
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando endereços...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
          <p className="text-gray-500 mb-4">Adicione um endereço para facilitar suas compras</p>
          <Button onClick={() => setShowAddForm(true)}>
            Adicionar Primeiro Endereço
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-6 bg-white rounded-lg border-2 transition-colors ${
                address.is_default ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    {address.is_default && (
                      <Star className="w-4 h-4 text-primary-600 fill-current" />
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAddressTypeColor(address.type)}`}>
                      {getAddressTypeLabel(address.type)}
                    </span>
                    {address.is_default && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-900 font-medium mb-2">{formatAddress(address)}</p>
                  <p className="text-sm text-gray-500">{address.country}</p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="text-xs"
                    >
                      Definir como Padrão
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAddress(address)}
                    className="p-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressList;