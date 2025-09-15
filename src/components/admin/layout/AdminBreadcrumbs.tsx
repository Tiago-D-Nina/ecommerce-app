import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

const routeLabels: Record<string, string> = {
  '/admin': 'Admin',
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Produtos',
  '/admin/products/new': 'Novo Produto',
  '/admin/products/edit': 'Editar Produto',
  '/admin/categories': 'Categorias',
  '/admin/categories/new': 'Nova Categoria',
  '/admin/categories/edit': 'Editar Categoria',
  '/admin/orders': 'Pedidos',
  '/admin/orders/view': 'Detalhes do Pedido',
  '/admin/customers': 'Clientes',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Configurações',
};

export const AdminBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Build breadcrumb path
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath];
    
    if (label) {
      breadcrumbs.push({
        label,
        href: index === pathSegments.length - 1 ? undefined : currentPath,
        isCurrentPage: index === pathSegments.length - 1,
      });
    }
  });

  // Don't show breadcrumbs if we're at the root admin page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm">
      <Link
        to="/admin/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {crumb.isCurrentPage ? (
            <span className="font-medium text-gray-900">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.href!}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};