// Simplified admin auth store that uses the main auth store
import { useAuth } from '../authStore';

interface AdminCredentials {
  email: string;
  password: string;
}

interface AdminAuthStore {
  admin: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (credentials: AdminCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  canAccess: (route: string) => boolean;
}

// Use the main auth store with admin-specific wrapper
export const useAdminAuthStore = (): AdminAuthStore => {
  const auth = useAuth();

  const isAuthenticatedAdmin = auth.isAuthenticated && auth.isAdmin();
  // Consider loading if auth is loading OR if sync hasn't completed yet and we have a session
  const isLoadingAdmin = auth.isLoading || (auth.session && !auth._syncCompleted);
  
  console.log('🔧 AdminAuthStore state:', {
    userEmail: auth.user?.email,
    userRole: auth.user?.role,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin(),
    isAuthenticatedAdmin,
    isLoadingAdmin,
    syncCompleted: auth._syncCompleted
  });

  return {
    admin: auth.user,
    isAuthenticated: isAuthenticatedAdmin,
    isLoading: isLoadingAdmin,

    login: async (credentials: AdminCredentials) => {
      const success = await auth.signIn(credentials.email, credentials.password);
      if (!success) {
        throw new Error('Login failed');
      }
      
      // Verify admin role after login
      if (!auth.isAdmin()) {
        await auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      // Update last login timestamp
      await auth.refreshUserData();
    },

    logout: async () => {
      await auth.signOut();
    },

    hasPermission: auth.hasPermission,
    canAccess: auth.canAccess,
  };
};