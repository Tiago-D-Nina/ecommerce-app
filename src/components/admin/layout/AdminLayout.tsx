import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAdminUIStore } from '../../../store/admin/adminUIStore';

export const AdminLayout: React.FC = () => {
  const { sidebarCollapsed } = useAdminUIStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <AdminHeader />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};