import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '../../../store/admin/adminAuthStore';
import { useAdminUIStore } from '../../../store/admin/adminUIStore';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';

export const AdminHeader: React.FC = () => {
  const { admin, logout } = useAdminAuthStore();
  const { notifications, openModal } = useAdminUIStore();

  const unreadNotifications = notifications.filter(n => !n.id.includes('read')).length;

  const handleProfileClick = () => {
    openModal('profile');
  };

  const handleNotificationsClick = () => {
    openModal('notifications');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6">
      <div className="flex items-center justify-between h-full">
        {/* Left section - Breadcrumbs */}
        <div className="flex items-center flex-1">
          <AdminBreadcrumbs />
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notifications */}
          <button
            onClick={handleNotificationsClick}
            className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <div
                onClick={handleProfileClick}
                className="flex items-center space-x-3"
              >
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  {admin?.avatar ? (
                    <img
                      src={admin.avatar}
                      alt={admin.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {admin?.name || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {admin?.role?.replace('_', ' ') || 'Administrator'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};