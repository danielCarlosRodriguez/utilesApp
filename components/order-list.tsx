import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { fetchOrders, type Order, type OrderStatus } from '@/services/api';
import { getStatusStyle } from '@/constants/order-status';
import { useOrderContext } from '@/context/order-context';
import { useOrderSocket, type OrderUpdatedEvent } from '@/hooks/use-order-socket';

function StatusChip({ status }: { status?: OrderStatus }) {
  const style = getStatusStyle(status);
  return (
    <View style={[styles.statusChip, { backgroundColor: style.backgroundColor }]}>
      <MaterialIcons name={style.icon} size={14} color={style.color} />
      <ThemedText style={[styles.statusText, { color: style.color }]}>{style.label}</ThemedText>
    </View>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (isToday) return `Hoy ${time}`;
  if (isYesterday) return `Ayer ${time}`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${time}`;
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '-';
  return `$ ${value.toLocaleString('es-UY')}`;
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setSelectedOrder } = useOrderContext();
  const router = useRouter();

  const handleOrderUpdated = useCallback((event: OrderUpdatedEvent) => {
    setOrders((prev) => {
      const index = prev.findIndex((o) => o._id === event.orderId);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], status: event.status };
      return updated;
    });
  }, []);

  useOrderSocket({ onOrderUpdated: handleOrderUpdated });

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      // Sort by createdAt descending (most recent first)
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setOrders(sorted);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    router.push('/orders');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <ThemedText style={styles.loadingText}>Cargando pedidos...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1D4ED8']} />
      }
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo-delivery.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Pedidos
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}
        </ThemedText>
      </View>

      <View style={styles.list}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color="#94A3B8" />
            <ThemedText style={styles.emptyText}>No hay pedidos</ThemedText>
          </View>
        ) : (
          orders.map((order) => {
            const orderId = order.orderId !== undefined
              ? `#${order.orderId}`
              : (order.orderNumber ? `#${order.orderNumber}` : order._id.slice(-6));

            return (
              <Pressable
                key={order._id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => handleOrderPress(order)}
              >
                <View style={styles.cardTop}>
                  <View>
                    <ThemedText type="defaultSemiBold" style={styles.orderId}>
                      {orderId}
                    </ThemedText>
                    <ThemedText style={styles.customer}>
                      {order.customerName || 'Sin nombre'}
                    </ThemedText>
                  </View>
                  <StatusChip status={order.status} />
                </View>

                <View style={styles.row}>
                  <MaterialIcons name="location-on" size={16} color="#94A3B8" />
                  <ThemedText style={styles.muted} numberOfLines={1}>
                    {order.customerAddress || 'Sin dirección'}
                  </ThemedText>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.row}>
                    <MaterialIcons name="schedule" size={16} color="#94A3B8" />
                    <ThemedText style={styles.muted}>{formatDate(order.createdAt)}</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.total}>
                    {formatCurrency(order.total)}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  logo: {
    height: 40,
    width: 150,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
  },
  headerSubtitle: {
    color: '#64748B',
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
  },
  customer: {
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  muted: {
    color: '#64748B',
    fontSize: 13,
    flex: 1,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  total: {
    fontSize: 16,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
