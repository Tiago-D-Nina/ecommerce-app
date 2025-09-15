import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {trend === 'up' ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span
          className={`ml-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
        <span className="ml-1 text-sm text-gray-500">vs último mês</span>
      </div>
    </div>
  );
};

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  customersChange: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  created_at: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas principais
      const [statsResult, ordersResult, productsResult] = await Promise.all([
        loadStats(),
        loadRecentOrders(),
        loadTopProducts()
      ]);

      setStats(statsResult);
      setRecentOrders(ordersResult);
      setTopProducts(productsResult);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (): Promise<DashboardStats> => {
    // Receita total dos últimos 30 dias
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .neq('status', 'cancelled');

    // Receita dos 30 dias anteriores para comparação
    const { data: prevRevenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .neq('status', 'cancelled');

    // Total de produtos, clientes e pedidos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: totalCustomers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const prevRevenue = prevRevenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders: revenueData?.length || 0,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      revenueChange,
      ordersChange: 12.5, // Mock - seria calculado similar à receita
      productsChange: 3.2, // Mock
      customersChange: -2.1, // Mock
    };
  };

  const loadRecentOrders = async (): Promise<RecentOrder[]> => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        users!inner(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(4);

    return data?.map(order => ({
      id: order.order_number,
      customer: order.users?.full_name || 'Cliente',
      amount: order.total_amount,
      status: getStatusLabel(order.status),
      created_at: order.created_at
    })) || [];
  };

  const loadTopProducts = async (): Promise<TopProduct[]> => {
    const { data } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        total_price,
        product_id
      `);

    // Agrupar por produto
    const productStats = data?.reduce((acc, item) => {
      const name = item.product_name;
      if (!acc[name]) {
        acc[name] = { sales: 0, revenue: 0 };
      }
      acc[name].sales += item.quantity;
      acc[name].revenue += item.total_price;
      return acc;
    }, {} as Record<string, { sales: number; revenue: number }>) || {};

    // Converter para array e ordenar por receita
    return Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        sales: stats.sales,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalRevenue),
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`,
      trend: stats.revenueChange >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
    },
    {
      title: 'Pedidos',
      value: stats.totalOrders.toString(),
      change: `+${stats.ordersChange}%`,
      trend: 'up' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Produtos',
      value: stats.totalProducts.toString(),
      change: `+${stats.productsChange}%`,
      trend: 'up' as const,
      icon: Package,
    },
    {
      title: 'Clientes',
      value: stats.totalCustomers.toString(),
      change: `${stats.customersChange}%`,
      trend: stats.customersChange >= 0 ? 'up' as const : 'down' as const,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu e-commerce</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pedidos Recentes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Entregue' || order.status === 'Confirmado'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Pendente' || order.status === 'Processando'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Produtos</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} vendas</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Vendas dos Últimos 30 Dias</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Gráfico será implementado com Chart.js ou Recharts</p>
        </div>
      </div>
    </div>
  );
};