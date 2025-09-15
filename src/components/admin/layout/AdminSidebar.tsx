import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  BarChart3,
  Settings,
  Menu,
  Store,
} from 'lucide-react';
import { useAdminUIStore } from '../../../store/admin/adminUIStore';
import { useAdminAuthStore } from '../../../store/admin/adminAuthStore';

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  children?: NavigationItem[];
  permissions?: { resource: string; action: string };
}

const navigationItems: NavigationItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    key: 'products',
    label: 'Produtos',
    icon: Package,
    href: '/admin/products',
    permissions: { resource: 'products', action: 'read' },
  },
  {
    key: 'categories',
    label: 'Categorias',
    icon: FolderTree,
    href: '/admin/categories',
    permissions: { resource: 'categories', action: 'read' },
  },
  {
    key: 'orders',
    label: 'Pedidos',
    icon: ShoppingCart,
    href: '/admin/orders',
    permissions: { resource: 'orders', action: 'read' },
  },
  {
    key: 'customers',
    label: 'Clientes',
    icon: Users,
    href: '/admin/customers',
    permissions: { resource: 'customers', action: 'read' },
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    permissions: { resource: 'analytics', action: 'read' },
  },
  {
    key: 'settings',
    label: 'Configurações',
    icon: Settings,
    href: '/admin/settings',
    permissions: { resource: 'settings', action: 'read' },
  },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAdminUIStore();
  const { hasPermission } = useAdminAuthStore();

  const filteredItems = navigationItems.filter((item) => {
    if (!item.permissions) return true;
    return hasPermission(item.permissions.resource, item.permissions.action);
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <Store className="h-8 w-8 text-blue-600" />
          {!sidebarCollapsed && (
            <span className="text-xl font-bold text-gray-900">Admin</span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));

            return (
              <li key={item.key}>
                <NavLink
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};