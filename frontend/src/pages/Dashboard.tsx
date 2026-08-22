import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '@/services/api';
import type { DashboardStats } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

const weeklyData = [
  { day: 'Mon', revenue: 4200 }, { day: 'Tue', revenue: 6800 },
  { day: 'Wed', revenue: 5100 }, { day: 'Thu', revenue: 7900 },
  { day: 'Fri', revenue: 9200 }, { day: 'Sat', revenue: 11500 }, { day: 'Sun', revenue: 8700 },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await dashboardService.getStats()).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Today's Sales" value={isLoading ? null : formatCurrency(stats?.todaySales || 0)} icon={DollarSign} color="blue" loading={isLoading} />
        <KpiCard title="Today's Orders" value={isLoading ? null : String(stats?.todayOrders || 0)} icon={ShoppingCart} color="violet" loading={isLoading} />
        <KpiCard title="Total Revenue" value={isLoading ? null : formatCurrency(stats?.totalRevenue || 0)} icon={TrendingUp} color="green" loading={isLoading} />
        <KpiCard title="Total Products" value={isLoading ? null : String(stats?.totalProducts || 0)} icon={Package} color="orange" loading={isLoading} />
        <KpiCard title="Low Stock" value={isLoading ? null : String(stats?.lowStockProducts || 0)} icon={AlertTriangle} color="red" loading={isLoading} />
        <KpiCard title="Customers" value={isLoading ? null : String(stats?.totalCustomers || 0)} icon={Users} color="teal" loading={isLoading} />
      </div>

      {/* Charts + Recent Sales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue Overview</h2>
              <p className="text-sm text-slate-500">This week's performance</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }} formatter={(v: unknown) => [formatCurrency(Number(v)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Sales</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {(stats?.recentSales || []).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{sale.customer?.name || 'Walk-in'}</p>
                    <p className="text-xs text-slate-400">{sale.invoiceNumber} · {formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(sale.totalAmount)}</p>
                    <Badge variant={sale.paymentMethod === 'CASH' ? 'success' : sale.paymentMethod === 'CARD' ? 'info' : 'default'} className="text-[10px]">
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, loading }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
      </div>
      {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>}
    </div>
  );
}
