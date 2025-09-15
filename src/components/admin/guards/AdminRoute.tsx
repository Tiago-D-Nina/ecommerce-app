import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../../store/admin/adminAuthStore';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredResource?: string;
  requiredAction?: string;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredResource,
  requiredAction,
  fallback,
}) => {
  const location = useLocation();
  const { isAuthenticated, hasPermission, canAccess, isLoading } = useAdminAuthStore();

  console.log('🔒 AdminRoute check:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    requiredResource,
    requiredAction
  });

  // Show loading state while auth is initializing
  if (isLoading) {
    console.log('⏳ Auth still loading, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated as admin
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check specific resource/action permission if provided
  if (requiredResource && requiredAction) {
    if (!hasPermission(requiredResource, requiredAction)) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check route-based permissions
  if (!canAccess(location.pathname)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};