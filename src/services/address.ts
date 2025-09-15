import supabaseService from './supabase';
import type { Address } from '../types';

export class AddressService {
  async getUserAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await supabaseService.supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformAddress);
  }

  async getAddressById(id: string): Promise<Address | null> {
    const { data, error } = await supabaseService.supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.transformAddress(data) : null;
  }

  async getDefaultAddress(userId: string, type?: 'billing' | 'shipping'): Promise<Address | null> {
    let query = supabaseService.supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true);

    if (type) {
      query = query.or(`type.eq.${type},type.eq.both`);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.transformAddress(data) : null;
  }

  async createAddress(addressData: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    // If this is being set as default, unset other defaults first
    if (addressData.is_default) {
      await this.unsetDefaultAddresses(addressData.user_id);
    }

    const data = await supabaseService.insert<Address>('addresses', addressData);
    return this.transformAddress(data);
  }

  async updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    // If setting as default, unset other defaults first
    if (updates.is_default) {
      const address = await this.getAddressById(id);
      if (address) {
        await this.unsetDefaultAddresses(address.user_id);
      }
    }

    const data = await supabaseService.update<Address>('addresses', id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return this.transformAddress(data);
  }

  async deleteAddress(id: string): Promise<boolean> {
    return await supabaseService.delete('addresses', id);
  }

  async setDefaultAddress(id: string): Promise<Address> {
    const address = await this.getAddressById(id);
    if (!address) throw new Error('Address not found');

    // Unset other defaults
    await this.unsetDefaultAddresses(address.user_id);

    // Set this address as default
    return await this.updateAddress(id, { is_default: true });
  }

  private async unsetDefaultAddresses(userId: string): Promise<void> {
    await supabaseService.supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  // CEP/Postal Code utilities
  async validateBrazilianCEP(cep: string): Promise<{
    isValid: boolean;
    address?: {
      street: string;
      neighborhood: string;
      city: string;
      state: string;
      stateCode: string;
    };
  }> {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return { isValid: false };
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (data.erro) {
        return { isValid: false };
      }

      return {
        isValid: true,
        address: {
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade,
          state: data.localidade,
          stateCode: data.uf
        }
      };
    } catch {
      return { isValid: false };
    }
  }

  // Address formatting utilities
  formatAddressForDisplay(address: Address): string {
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      `${address.city} - ${address.state}`,
      address.postal_code
    ].filter(Boolean);

    return parts.join(', ');
  }

  formatAddressForShipping(address: Address): {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } {
    const line1 = `${address.street}, ${address.number}`;
    const line2 = address.complement ? `${address.complement}, ${address.neighborhood}` : address.neighborhood;

    return {
      line1,
      line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country
    };
  }

  // Private helper methods
  private transformAddress(data: any): Address {
    const address = data as Address;
    
    // Add computed fields for backward compatibility
    return {
      ...address,
      userId: address.user_id,
      zipCode: address.postal_code,
      isDefault: address.is_default
    };
  }
}

export default new AddressService();