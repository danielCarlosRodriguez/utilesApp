import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type OrderStatus = 'Pendiente' | 'Preparado' | 'Enviado' | 'Entregado' | 'Cancelado';

type OrderItem = {
  id: string;
  customer: string;
  address: string;
  total: string;
  time: string;
  status: OrderStatus;
};

type StatusStyle = {
  color: string;
  backgroundColor: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
};

const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  Pendiente: { color: '#F59E0B', backgroundColor: '#FFF3D1', icon: 'schedule' },
  Preparado: { color: '#F59E0B', backgroundColor: '#FFF7E6', icon: 'inventory-2' },
  Enviado: { color: '#3B82F6', backgroundColor: '#EAF2FF', icon: 'local-shipping' },
  Entregado: { color: '#22C55E', backgroundColor: '#EAF9F0', icon: 'check-circle' },
  Cancelado: { color: '#EF4444', backgroundColor: '#FDECEC', icon: 'cancel' },
};

const ORDERS: OrderItem[] = [
  {
    id: '#123456789',
    customer: 'Daniel Rodríguez',
    address: 'Francisco Romero 3733, CABA',
    total: '$ 12.450',
    time: 'Hoy 10:45 AM',
    status: 'Pendiente',
  },
  {
    id: '#987654321',
    customer: 'María Gómez',
    address: 'Av. Santa Fe 2450, CABA',
    total: '$ 8.900',
    time: 'Hoy 09:20 AM',
    status: 'Preparado',
  },
  {
    id: '#554433221',
    customer: 'Luis Pérez',
    address: 'Cabildo 1201, CABA',
    total: '$ 15.300',
    time: 'Ayer 18:10',
    status: 'Enviado',
  },
];

function StatusChip({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <View style={[styles.statusChip, { backgroundColor: style.backgroundColor }]}>
      <MaterialIcons name={style.icon} size={14} color={style.color} />
      <ThemedText style={[styles.statusText, { color: style.color }]}>{status}</ThemedText>
    </View>
  );
}

export function OrderList() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Pedidos
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Listado de órdenes recientes
        </ThemedText>
      </View>

      <View style={styles.list}>
        {ORDERS.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <ThemedText type="defaultSemiBold" style={styles.orderId}>
                  {order.id}
                </ThemedText>
                <ThemedText style={styles.customer}>{order.customer}</ThemedText>
              </View>
              <StatusChip status={order.status} />
            </View>

            <View style={styles.row}>
              <MaterialIcons name="location-on" size={16} color="#94A3B8" />
              <ThemedText style={styles.muted}>{order.address}</ThemedText>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.row}>
                <MaterialIcons name="schedule" size={16} color="#94A3B8" />
                <ThemedText style={styles.muted}>{order.time}</ThemedText>
              </View>
              <ThemedText type="defaultSemiBold" style={styles.total}>
                {order.total}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerSubtitle: {
    color: '#64748B',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
