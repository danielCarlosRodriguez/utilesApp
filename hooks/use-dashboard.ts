import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOrders, fetchProducts } from '@/services/api';
import type { Order, OrderStatus, Product } from '@/services/api';

// --- Types ---

export type TimePeriod = 'week' | 'month' | 'year';

export type KpiData = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
};

export type StatusCount = {
  status: OrderStatus;
  label: string;
  count: number;
  color: string;
};

export type PeriodRevenue = {
  label: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  title: string;
  refid: string;
  quantitySold: number;
  revenue: number;
};

export type DashboardData = {
  kpis: KpiData;
  ordersByStatus: StatusCount[];
  revenueByPeriod: PeriodRevenue[];
  topProducts: TopProduct[];
  recentOrders: Order[];
};

type UseDashboardReturn = {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  refetch: () => Promise<void>;
};

// --- Constants ---

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pedido Recibido',
  ready: 'Preparado',
  shipped: 'En Camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  pending: '#1D4ED8',
  ready: '#D97706',
  shipped: '#7C3AED',
  delivered: '#047857',
  cancelled: '#B91C1C',
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'ready', 'shipped', 'delivered', 'cancelled'];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// --- Aggregation helpers ---

function computeKpis(orders: Order[]): KpiData {
  const delivered = orders.filter(o => o.status === 'delivered');
  const totalRevenue = delivered.reduce((sum, o) => sum + (o.totals?.total ?? 0), 0);
  const deliveredCount = delivered.length;

  return {
    totalRevenue,
    totalOrders: orders.length,
    averageOrderValue: deliveredCount > 0 ? Math.round(totalRevenue / deliveredCount) : 0,
  };
}

function computeOrdersByStatus(orders: Order[]): StatusCount[] {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    const s = o.status || 'pending';
    counts[s] = (counts[s] || 0) + 1;
  }
  return ALL_STATUSES.map(status => ({
    status,
    label: STATUS_LABELS[status],
    count: counts[status] || 0,
    color: STATUS_CHART_COLORS[status],
  }));
}

function computeRevenueByPeriod(orders: Order[], period: TimePeriod): PeriodRevenue[] {
  const now = new Date();
  const validOrders = orders.filter(o => o.status !== 'cancelled');

  if (period === 'week') {
    const days: PeriodRevenue[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.push({ label: DAY_NAMES[d.getDay()], revenue: 0, orders: 0 });

      for (const o of validOrders) {
        if (!o.createdAt) continue;
        const od = new Date(o.createdAt);
        const odStr = `${od.getFullYear()}-${od.getMonth()}-${od.getDate()}`;
        if (odStr === dayStr) {
          days[days.length - 1].revenue += o.totals?.total ?? 0;
          days[days.length - 1].orders += 1;
        }
      }
    }
    return days;
  }

  if (period === 'month') {
    const weeks: PeriodRevenue[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      const bucket: PeriodRevenue = { label: `Sem ${4 - w}`, revenue: 0, orders: 0 };

      for (const o of validOrders) {
        if (!o.createdAt) continue;
        const od = new Date(o.createdAt);
        if (od >= weekStart && od <= weekEnd) {
          bucket.revenue += o.totals?.total ?? 0;
          bucket.orders += 1;
        }
      }
      weeks.push(bucket);
    }
    return weeks;
  }

  // year: last 12 months
  const months: PeriodRevenue[] = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const bucket: PeriodRevenue = { label: MONTH_NAMES[d.getMonth()], revenue: 0, orders: 0 };

    for (const o of validOrders) {
      if (!o.createdAt) continue;
      const od = new Date(o.createdAt);
      if (od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth()) {
        bucket.revenue += o.totals?.total ?? 0;
        bucket.orders += 1;
      }
    }
    months.push(bucket);
  }
  return months;
}

function computeTopProducts(orders: Order[], products: Product[]): TopProduct[] {
  const nonCancelled = orders.filter(o => o.status !== 'cancelled');
  const agg: Record<string, { quantity: number; revenue: number }> = {};

  for (const o of nonCancelled) {
    for (const item of o.items || []) {
      const refid = item.refid || '';
      if (!agg[refid]) agg[refid] = { quantity: 0, revenue: 0 };
      agg[refid].quantity += item.quantity;
      agg[refid].revenue += item.subtotal;
    }
  }

  const productMap = new Map(products.map(p => [String(p.refid), p]));

  return Object.entries(agg)
    .map(([refid, data]) => ({
      title: productMap.get(refid)?.descripción || refid,
      refid,
      quantitySold: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);
}

// --- Hook ---

export function useDashboard(): UseDashboardReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('month');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersData, productsData] = await Promise.all([
        fetchOrders(),
        fetchProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const data = useMemo<DashboardData | null>(() => {
    if (orders.length === 0 && products.length === 0 && isLoading) return null;

    const sorted = [...orders].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return {
      kpis: computeKpis(orders),
      ordersByStatus: computeOrdersByStatus(orders),
      revenueByPeriod: computeRevenueByPeriod(orders, period),
      topProducts: computeTopProducts(orders, products),
      recentOrders: sorted.slice(0, 5),
    };
  }, [orders, products, period, isLoading]);

  return { data, isLoading, error, period, setPeriod, refetch: fetchData };
}
