import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, RefreshControl, Dimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useDashboard, type TimePeriod, type StatusCount, type PeriodRevenue, type TopProduct } from '@/hooks/use-dashboard';
import { STATUS_STYLES } from '@/constants/order-status';
import type { Order, OrderStatus } from '@/services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Helpers ---

function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('es-UY')}`;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// --- KPI Card ---

type KpiCardProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  subtitle: string;
};

function KpiCard({ icon, iconBg, iconColor, label, value, subtitle }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiIconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.kpiSubtitle}>{subtitle}</Text>
    </View>
  );
}

// --- Period Selector ---

function PeriodSelector({ period, onChange }: { period: TimePeriod; onChange: (p: TimePeriod) => void }) {
  const options: { value: TimePeriod; label: string }[] = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];
  return (
    <View style={styles.periodContainer}>
      {options.map(o => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[
            styles.periodButton,
            period === o.value && styles.periodButtonActive,
          ]}
        >
          <Text style={[
            styles.periodText,
            period === o.value && styles.periodTextActive,
          ]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// --- Status Card ---

const STATUS_ICONS: Record<OrderStatus, React.ComponentProps<typeof MaterialIcons>['name']> = {
  pending: 'hourglass-top',
  ready: 'inventory-2',
  shipped: 'local-shipping',
  delivered: 'check-circle',
  cancelled: 'cancel',
};

function StatusCard({ status, label, count, color }: StatusCount) {
  const style = STATUS_STYLES[status];
  return (
    <View style={[styles.statusCard, { backgroundColor: style.backgroundColor + '80' }]}>
      <View style={styles.statusHeader}>
        <View style={[styles.statusIconBox, { backgroundColor: style.backgroundColor }]}>
          <MaterialIcons name={STATUS_ICONS[status]} size={16} color={style.color} />
        </View>
        <Text style={styles.statusLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[styles.statusCount, { color }]}>{count}</Text>
    </View>
  );
}

// --- Revenue Bars (native) ---

function RevenueBars({ data, period }: { data: PeriodRevenue[]; period: TimePeriod }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const barWidth = Math.max(20, (SCREEN_WIDTH - 80) / data.length - 8);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>
        Ingresos por {period === 'week' ? 'día' : period === 'month' ? 'semana' : 'mes'}
      </Text>
      <View style={styles.barsContainer}>
        {data.map((d, i) => {
          const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 150 : 0;
          return (
            <View key={i} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {d.revenue > 0 ? `$${Math.round(d.revenue / 1000)}k` : ''}
              </Text>
              <View style={[styles.bar, { height: Math.max(heightPct, 2), width: barWidth }]} />
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- Top Products Bars (horizontal) ---

function TopProductsBars({ data }: { data: TopProduct[] }) {
  const maxQty = Math.max(...data.map(d => d.quantitySold), 1);

  if (data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>
        <Text style={styles.emptyText}>Sin datos de ventas</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>
      {data.map((p, i) => {
        const widthPct = (p.quantitySold / maxQty) * 100;
        return (
          <View key={i} style={styles.hBarRow}>
            <Text style={styles.hBarLabel} numberOfLines={1}>{p.title}</Text>
            <View style={styles.hBarTrack}>
              <View style={[styles.hBar, { width: `${widthPct}%` }]} />
            </View>
            <Text style={styles.hBarValue}>{p.quantitySold}</Text>
          </View>
        );
      })}
    </View>
  );
}

// --- Recent Orders ---

function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
        <Text style={styles.emptyText}>Sin órdenes recientes</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
      {orders.map(o => {
        const status = o.status || 'pending';
        const style = STATUS_STYLES[status];
        return (
          <View key={o._id} style={styles.orderRow}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderNumber}>#{o.orderId || o.orderNumber}</Text>
              <Text style={styles.orderCustomer} numberOfLines={1}>
                {o.customerName || '-'}
              </Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderTotal}>{formatCurrency(o.totals?.total ?? 0)}</Text>
              <View style={[styles.orderBadge, { backgroundColor: style.backgroundColor }]}>
                <Text style={[styles.orderBadgeText, { color: style.color }]}>
                  {style.label}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>{formatDate(o.createdAt)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ============ MAIN COMPONENT ============

export function Dashboard() {
  const { data, isLoading, error, period, setPeriod, refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (error && !data) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <MaterialIcons name="error-outline" size={48} color="#FCA5A5" />
        <Text style={styles.errorTitle}>Error al cargar datos</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2b8cee" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  if (!data) return null;

  const { kpis, ordersByStatus, revenueByPeriod, topProducts, recentOrders } = data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <PeriodSelector period={period} onChange={setPeriod} />
      </View>

      {/* KPI Cards - 2x2 grid */}
      <View style={styles.kpiGrid}>
        <KpiCard
          icon="payments"
          iconBg="#ECFDF5"
          iconColor="#059669"
          label="Ingresos"
          value={formatCurrency(kpis.totalRevenue)}
          subtitle="Pedidos entregados"
        />
        <KpiCard
          icon="receipt-long"
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          label="Total Pedidos"
          value={String(kpis.totalOrders)}
          subtitle="Todas las órdenes"
        />
        <KpiCard
          icon="speed"
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          label="Ticket Promedio"
          value={formatCurrency(kpis.averageOrderValue)}
          subtitle="Por pedido entregado"
        />
        <KpiCard
          icon="visibility"
          iconBg="#ECFEFF"
          iconColor="#0891B2"
          label="Visitas"
          value="—"
          subtitle="Próximamente"
        />
      </View>

      {/* Status Cards - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusRow}
        style={styles.statusScroll}
      >
        {ordersByStatus.map(s => (
          <StatusCard key={s.status} {...s} />
        ))}
      </ScrollView>

      {/* Revenue Chart */}
      <RevenueBars data={revenueByPeriod} period={period} />

      {/* Top Products */}
      <TopProductsBars data={topProducts} />

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} />

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },

  // Period Selector
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#2b8cee',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    width: (SCREEN_WIDTH - 42) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 2,
  },
  kpiSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
  },

  // Status Cards
  statusScroll: {
    marginBottom: 12,
  },
  statusRow: {
    gap: 8,
    paddingRight: 4,
  },
  statusCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    width: 120,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
  statusCount: {
    fontSize: 22,
    fontWeight: '900',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },

  // Revenue Bars
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 190,
    paddingTop: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: '#2b8cee',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minWidth: 14,
  },
  barValue: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },

  // Horizontal Bars (Top Products)
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  hBarLabel: {
    fontSize: 11,
    color: '#64748B',
    width: 100,
  },
  hBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  hBar: {
    height: '100%',
    backgroundColor: '#2b8cee',
    borderRadius: 6,
  },
  hBarValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 30,
    textAlign: 'right',
  },

  // Recent Orders
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  orderCustomer: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  orderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  orderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    width: 40,
    textAlign: 'right',
  },

  // Empty state
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 30,
  },

  // Error state
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2b8cee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
});
