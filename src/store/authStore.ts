import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabase';
import type { AuthState, User, Address, PaymentMethod, Order, RefundRequest } from '../types';
import type { Session } from '@supabase/supabase-js';
import { ErrorHandler, type ErrorMessage } from '../services/errorHandler';

interface AuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (userData: { 
    email: string; 
    password: string; 
    fullName?: string;
    phone?: string;
    cpf?: string; 
  }) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  loadAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'user_id'>) => Promise<boolean>;
  updateAddress: (addressId: string, address: Partial<Address>) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id' | 'userId'>) => Promise<boolean>;
  updatePaymentMethod: (paymentMethodId: string, paymentMethod: Partial<PaymentMethod>) => Promise<boolean>;
  deletePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  getOrders: () => Promise<Order[]>;
  getRefundRequests: () => Promise<RefundRequest[]>;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  requestRefund: (orderId: string, reason: string, description: string) => Promise<boolean>;
  clearError: () => void;
  // New helper methods
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | ErrorMessage | null) => void;
  syncUserData: (authUser: any) => Promise<void>;
  updateUserFromDatabase: (dbUser: any) => Promise<void>;
  refreshUserData: () => Promise<void>;
  // Admin functions
  isAdmin: () => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  canAccess: (route: string) => boolean;
}

interface AuthStore extends AuthState, AuthActions {
  session: Session | null;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  refundRequests: RefundRequest[];
  _initialized: boolean;
  _syncCompleted: boolean;
}

const transformUser = (session: Session | null): User | null => {
  if (!session?.user) return null;
  
  return {
    id: session.user.id,
    email: session.user.email || '',
    full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
    avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
    phone: session.user.phone,
    date_of_birth: session.user.user_metadata?.date_of_birth,
    stripe_customer_id: session.user.user_metadata?.stripe_customer_id,
    created_at: session.user.created_at,
    updated_at: session.user.updated_at || session.user.created_at,
    // Computed fields for backward compatibility
    firstName: session.user.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
    dateOfBirth: session.user.user_metadata?.date_of_birth,
    createdAt: session.user.created_at,
    isActive: true
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      addresses: [],
      paymentMethods: [],
      orders: [],
      refundRequests: [],
      _initialized: false, // Internal flag to prevent double initialization
      _syncCompleted: false, // Flag to indicate if user data sync is completed

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),

      setSession: (session) => {
        set({ 
          session,
          isAuthenticated: !!session,
          error: null 
        });
        // Don't immediately transform user - let syncUserData handle the complete user data
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      initialize: async () => {
        try {
          const currentState = get();
          if (currentState._initialized) {
            console.log('🔄 Auth already initialized, skipping...');
            return;
          }
          
          set({ isLoading: true, error: null, _initialized: true, _syncCompleted: false });
          
          // Get initial session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            throw sessionError;
          }

          if (session) {
            get().setSession(session);
            
            // Check if we already have complete user data (from storage)
            const currentUser = get().user;
            const hasCompleteUserData = currentUser && currentUser.role && currentUser.email === session.user.email;
            
            if (!hasCompleteUserData) {
              // Only set initial user if we don't have complete data yet
              const initialUser = transformUser(session);
              if (initialUser) {
                get().setUser(initialUser);
              }
            }
            
            // Always sync with database to get complete data including role
            await get().syncUserData(session.user);
          }
        

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            get().setSession(session);
            
            if (session?.user) {
              // Don't overwrite user data immediately on auth changes if we already have complete user data
              const currentUser = get().user;
              const hasCompleteUserData = currentUser && currentUser.role;
              
              if (!hasCompleteUserData) {
                // Only set initial user if we don't have complete data yet
                const initialUser = transformUser(session);
                if (initialUser) {
                  get().setUser(initialUser);
                }
              }
              
              // Sync with database to get complete data including role
              await get().syncUserData(session.user);
            } else {
              // User signed out
              get().setUser(null);
            }
          });
          
        } catch (error) {
          console.error('❌ Auth initialization error:', error);
          get().setError(error instanceof Error ? error.message : 'Failed to initialize auth');
        } finally {
          set({ isLoading: false });
          console.log('✅ Auth initialization complete');
        }
      },

      syncUserData: async (authUser: any) => {
        try {
          // Check if sync already completed for this user to prevent duplicate calls
          const currentState = get();
          if (currentState._syncCompleted && currentState.user?.id === authUser.id) {
            return;
          }

          // Check if user exists in public.users table
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (fetchError) {
            console.error('❌ Failed to check existing user:', fetchError);
            return;
          }

          if (!existingUser) {
            // Create user in public.users table
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
                avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
                phone: authUser.phone
              })
              .select()
              .single();

            if (insertError) {
              console.error('❌ Failed to create user profile:', insertError);
            } else {
              // Update local state with new user data
              if (newUser) {
                await get().updateUserFromDatabase(newUser);
              }
            }
          } else {
            // Update local state with existing user data from database
            await get().updateUserFromDatabase(existingUser);
          }
          set({ _syncCompleted: true });
        } catch (error) {
          console.error('❌ Failed to sync user data:', error);
          set({ _syncCompleted: true }); // Mark as completed even on error
        }
      },

      updateUserFromDatabase: async (dbUser: any) => {
        try {
          console.log('📝 Updating user state from database:', dbUser.email, 'role:', dbUser.role);
          const { session } = get();
          
          if (session?.user) {
            // Create complete user object combining auth data with database data
            const updatedUser: User = {
              id: session.user.id,
              email: session.user.email || dbUser.email || '',
              // Database values (these are the ones that were missing)
              full_name: dbUser.full_name,
              phone: dbUser.phone,
              date_of_birth: dbUser.date_of_birth,
              avatar_url: dbUser.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
              stripe_customer_id: dbUser.stripe_customer_id || session.user.user_metadata?.stripe_customer_id,
              created_at: session.user.created_at,
              updated_at: dbUser.updated_at || session.user.updated_at || session.user.created_at,
              // Admin fields from database
              role: dbUser.role,
              permissions: dbUser.permissions,
              // Computed fields for backward compatibility
              firstName: dbUser.full_name?.split(' ')[0] || '',
              lastName: dbUser.full_name?.split(' ').slice(1).join(' ') || '',
              avatar: dbUser.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
              dateOfBirth: dbUser.date_of_birth,
              createdAt: session.user.created_at,
              isActive: true
            };
            
            console.log('✅ Setting complete user with database data:', updatedUser.email, 'role:', updatedUser.role);
            get().setUser(updatedUser);
          }
        } catch (error) {
          console.error('❌ Failed to update user from database:', error);
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data: _data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error, email);
          get().setError(errorMessage);
          return false;
        }
      },

      signUp: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                full_name: userData.fullName,
                phone: userData.phone,
                cpf: userData.cpf
              }
            }
          });

          if (error) throw error;

          if (!data.user?.email_confirmed_at) {
            // Armazena o email para reenvio posterior se necessário
            localStorage.setItem('pendingConfirmationEmail', userData.email);
            const confirmationMessage = ErrorHandler.getConfirmationMessage(userData.email);
            set({ 
              error: confirmationMessage.message,
              isLoading: false 
            });
            return false;
          }

          return true;
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error, userData.email);
          get().setError(errorMessage);
          return false;
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });

          if (error) throw error;
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            addresses: [],
            paymentMethods: [],
            orders: [],
            refundRequests: [],
          });
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          throw error;
        }
      },

      updateProfile: async (userData) => {
        try {
          const { session } = get();
          if (!session?.user) return false;

          set({ isLoading: true, error: null });

          // Update auth metadata if needed
          const authUpdates: any = {};
          if (userData.full_name) {
            authUpdates.data = { full_name: userData.full_name };
          }

          if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.updateUser(authUpdates);
            if (authError) throw authError;
          }

          // Update public.users table and return the updated data
          const { data: updatedUserData, error: updateError } = await supabase
            .from('users')
            .update({
              full_name: userData.full_name,
              phone: userData.phone,
              date_of_birth: userData.date_of_birth,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id)
            .select()
            .single();

          if (updateError) throw updateError;

          // Update local state with fresh data from database
          const currentUser = get().user;
          if (currentUser && updatedUserData) {
            console.log('Updating local user state with:', updatedUserData);
            get().setUser({
              ...currentUser,
              ...updatedUserData,
              // Computed fields for backward compatibility
              firstName: updatedUserData.full_name?.split(' ')[0] || '',
              lastName: updatedUserData.full_name?.split(' ').slice(1).join(' ') || '',
            });
          }

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          return false;
        }
      },

      addAddress: async (addressData) => {
        try {
          const { user } = get();
          if (!user) return false;

          set({ isLoading: true, error: null });

          // If this is set as default, unset others first
          if (addressData.is_default) {
            await supabase
              .from('addresses')
              .update({ is_default: false })
              .eq('user_id', user.id);
          }

          // Insert new address
          const { error } = await supabase
            .from('addresses')
            .insert({
              ...addressData,
              user_id: user.id,
              is_default: addressData.is_default ?? false
            })
            .select()
            .single();

          if (error) throw error;

          // Refresh addresses
          const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          set({ 
            addresses: addresses || [],
            isLoading: false 
          });

          return true;
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          return false;
        }
      },

      updateAddress: async (addressId, addressData) => {
        try {
          const { user } = get();
          if (!user) return false;

          set({ isLoading: true, error: null });

          // If setting as default, unset others first
          if (addressData.is_default) {
            await supabase
              .from('addresses')
              .update({ is_default: false })
              .eq('user_id', user.id);
          }

          // Update the address
          const { error } = await supabase
            .from('addresses')
            .update(addressData)
            .eq('id', addressId);

          if (error) throw error;

          // Refresh addresses
          const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          set({ 
            addresses: addresses || [],
            isLoading: false 
          });

          return true;
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          return false;
        }
      },

      deleteAddress: async (addressId) => {
        try {
          const { user } = get();
          if (!user) return false;

          set({ isLoading: true, error: null });

          const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', addressId);

          if (error) throw error;

          // Refresh addresses
          const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          set({ 
            addresses: addresses || [],
            isLoading: false 
          });

          return true;
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          return false;
        }
      },

      setDefaultAddress: async (addressId) => {
        try {
          const { user } = get();
          if (!user) return false;

          set({ isLoading: true, error: null });

          // First unset all defaults
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);

          // Set the selected address as default
          const { error } = await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('id', addressId);

          if (error) throw error;

          // Refresh addresses
          const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          set({ 
            addresses: addresses || [],
            isLoading: false 
          });

          return true;
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error);
          get().setError(errorMessage.message);
          return false;
        }
      },

      loadAddresses: async () => {
        try {
          const { user } = get();
          if (!user) return;

          const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          set({ addresses: addresses || [] });
        } catch (error) {
          console.error('Failed to load addresses:', error);
        }
      },

      addPaymentMethod: async (_paymentMethodData) => {
        const { user } = get();
        if (!user) return false;

        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase payment methods integration when Stripe is implemented
          console.log('Payment method functionality will be implemented with Stripe integration');
          set({ isLoading: false });
          return true;
        } catch {
          set({ error: 'Falha ao adicionar método de pagamento.', isLoading: false });
          return false;
        }
      },

      updatePaymentMethod: async (_paymentMethodId, _paymentMethodData) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase payment methods integration when Stripe is implemented
          console.log('Payment method update functionality will be implemented with Stripe integration');
          set({ isLoading: false });
          return true;
        } catch {
          set({ error: 'Falha ao atualizar método de pagamento.', isLoading: false });
          return false;
        }
      },

      deletePaymentMethod: async (_paymentMethodId) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase payment methods integration when Stripe is implemented
          console.log('Payment method deletion functionality will be implemented with Stripe integration');
          set({ isLoading: false });
          return true;
        } catch {
          set({ error: 'Falha ao remover método de pagamento.', isLoading: false });
          return false;
        }
      },

      setDefaultPaymentMethod: async (paymentMethodId) => {
        const { paymentMethods } = get();
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase payment method default setting when Stripe is implemented
          console.log('Set default payment method functionality will be implemented with Stripe integration');
          
          set({ isLoading: false });
          return true;
        } catch {
          set({ error: 'Falha ao definir método de pagamento padrão.', isLoading: false });
          return false;
        }
      },

      getOrders: async () => {
        const { user } = get();
        if (!user) return [];

        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase orders loading
          // Mock orders data would be loaded here
          const mockOrders: Order[] = [
            {
              id: 'order_1',
              userId: user.id,
              items: [],
              status: 'delivered',
              total: 299.90,
              subtotal: 259.90,
              shippingCost: 15.00,
              tax: 25.00,
              paymentMethod: {
                id: 'pm_1',
                userId: user.id,
                type: 'credit',
                cardNumber: '1234',
                cardHolder: 'JOAO SILVA',
                brand: 'visa',
                isDefault: true,
                createdAt: new Date().toISOString(),
              },
              shippingAddress: {
                id: 'addr_1',
                user_id: user.id,
                type: 'shipping',
                street: 'Rua das Flores',
                number: '123',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                postal_code: '01234-567',
                country: 'BR',
                is_default: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              tracking_number: 'BR123456789',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ];

          set({ 
            orders: mockOrders,
            isLoading: false,
          });

          return mockOrders;
        } catch {
          set({ error: 'Falha ao carregar pedidos.', isLoading: false });
          return [];
        }
      },

      getRefundRequests: async () => {
        const { user } = get();
        if (!user) return [];

        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase refund requests integration when needed
          const mockRefundRequests: RefundRequest[] = [];

          set({ 
            refundRequests: mockRefundRequests,
            isLoading: false,
          });

          return mockRefundRequests;
        } catch {
          set({ error: 'Falha ao carregar solicitações de reembolso.', isLoading: false });
          return [];
        }
      },

      cancelOrder: async (orderId) => {
        const { orders } = get();
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase order cancellation integration
          const updatedOrders = orders.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  status: 'cancelled' as const, 
                  cancelledAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : order
          );

          set({ 
            orders: updatedOrders,
            isLoading: false,
          });

          return true;
        } catch {
          set({ error: 'Falha ao cancelar pedido.', isLoading: false });
          return false;
        }
      },

      requestRefund: async (orderId, reason, description) => {
        const { refundRequests } = get();
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Supabase refund request integration
          const order = get().orders.find(o => o.id === orderId);
          if (!order) throw new Error('Pedido não encontrado');

          const newRefundRequest: RefundRequest = {
            id: `refund_${Date.now()}`,
            orderId,
            userId: order.userId,
            reason,
            description,
            status: 'pending',
            amount: order.total,
            requestedAt: new Date().toISOString(),
          };

          set({ 
            refundRequests: [...refundRequests, newRefundRequest],
            isLoading: false,
          });

          return true;
        } catch {
          set({ error: 'Falha ao solicitar reembolso.', isLoading: false });
          return false;
        }
      },

      refreshUserData: async () => {
        const { session } = get();
        if (session?.user) {
          await get().syncUserData(session.user);
        }
      },

      // Admin functions
      isAdmin: () => {
        const { user } = get();
        const isUserAdmin = user?.role === 'admin';
        console.log('🔐 isAdmin check:', user?.email, 'role:', user?.role, 'isAdmin:', isUserAdmin);
        return isUserAdmin;
      },

      hasPermission: (resource: string, action: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') return false;

        // Super admin has all permissions
        if (!user.permissions) return true;

        const resourcePermissions = user.permissions[resource];
        if (!resourcePermissions) return false;

        return resourcePermissions[action as keyof typeof resourcePermissions] === true;
      },

      canAccess: (route: string) => {
        const { isAdmin, hasPermission } = get();
        if (!isAdmin()) return false;

        // Define route permissions
        const routePermissions: Record<string, { resource: string; action: string }> = {
          '/admin/products': { resource: 'products', action: 'read' },
          '/admin/products/new': { resource: 'products', action: 'create' },
          '/admin/products/edit': { resource: 'products', action: 'update' },
          '/admin/orders': { resource: 'orders', action: 'read' },
          '/admin/orders/edit': { resource: 'orders', action: 'update' },
          '/admin/categories': { resource: 'categories', action: 'read' },
          '/admin/categories/new': { resource: 'categories', action: 'create' },
          '/admin/analytics': { resource: 'analytics', action: 'read' },
          '/admin/settings': { resource: 'settings', action: 'read' },
        };

        const permission = routePermissions[route];
        if (!permission) return true; // Route not restricted

        return hasPermission(permission.resource, permission.action);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        session: state.session
      }),
      // Ensure session data is properly hydrated
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Rehydrating storage, state:', state ? 'exists' : 'null');
        if (state?.session && !state.user) {
          // If we have a session but no user, re-initialize
          console.log('🔄 Session found but no user, re-initializing...');
          state.initialize?.();
        } else if (state?.session && state.user) {
          console.log('🔄 Session and user found, triggering init to sync with DB...');
          // Always re-initialize to sync with database on app start
          state.initialize?.();
        }
      },
    }
  )
);

// Helper hook for easier usage
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    session: store.session,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    addresses: store.addresses,
    _syncCompleted: store._syncCompleted,
    signIn: store.signIn,
    signUp: store.signUp,
    signInWithGoogle: store.signInWithGoogle,
    signOut: store.signOut,
    updateProfile: store.updateProfile,
    initialize: store.initialize,
    loadAddresses: store.loadAddresses,
    addAddress: store.addAddress,
    updateAddress: store.updateAddress,
    deleteAddress: store.deleteAddress,
    setDefaultAddress: store.setDefaultAddress,
    refreshUserData: store.refreshUserData,
    isAdmin: store.isAdmin,
    hasPermission: store.hasPermission,
    canAccess: store.canAccess,
    clearError: store.clearError
  };
};

export default useAuthStore;