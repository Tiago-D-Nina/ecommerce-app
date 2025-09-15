import { supabase } from '../utils/supabase';
import type { User } from '../types';

export class SupabaseService {
  public supabase = supabase;

  // Generic query methods
  async select<T>(table: string, query?: string) {
    let request = this.supabase.from(table).select(query || '*');
    
    const { data, error } = await request;
    if (error) throw error;
    return data as T[];
  }

  async selectSingle<T>(table: string, column: string, value: any) {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq(column, value)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as T | null;
  }

  async insert<T>(table: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result as T;
  }

  async update<T>(table: string, id: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result as T;
  }

  async delete(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // User-specific methods
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get additional user data from public.users
    const userData = await this.selectSingle<User>('users', 'id', user.id);
    
    if (!userData) {
      // Create user profile if it doesn't exist
      return await this.insert<User>('users', {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url,
        phone: user.phone,
        cpf: user.user_metadata?.cpf
      });
    }

    return userData;
  }

  async createUserProfile(authUser: any): Promise<User> {
    return await this.insert<User>('users', {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
      phone: authUser.phone,
      cpf: authUser.user_metadata?.cpf
    });
  }

  // File upload
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  }

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Real-time subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  // Utility methods
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
}

export default new SupabaseService();