import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useOrderContext } from '@/context/order-context';
import { useDeviceName } from '@/hooks/use-device-name';
import { updateOrderStatus, type OrderStatus } from '@/services/api';
import { STATUS_STYLES, getStatusStyle } from '@/constants/order-status';

type StatusButtonProps = {
  status: OrderStatus;
  onPress: () => void;
  disabled?: boolean;
  isCurrentStatus?: boolean;
};

function StatusButton({ status, onPress, disabled, isCurrentStatus }: StatusButtonProps) {
  const style = STATUS_STYLES[status];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statusButton,
        { backgroundColor: style.backgroundColor },
        pressed && styles.statusButtonPressed,
        isCurrentStatus && styles.statusButtonCurrent,
        disabled && styles.statusButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.statusIconCircle, { backgroundColor: style.color }]}>
        <MaterialIcons name={style.icon} size={24} color="#FFFFFF" />
      </View>
      <ThemedText style={[styles.statusLabel, { color: style.color }]}>
        {style.label.toUpperCase()}
      </ThemedText>
      {isCurrentStatus && (
        <ThemedText style={styles.currentLabel}>ACTUAL</ThemedText>
      )}
    </Pressable>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (isToday) return `Hoy ${time}`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${time}`;
}

export function OrderDetail() {
  const { selectedOrder, setSelectedOrder, isLoading: contextLoading } = useOrderContext();
  const { deviceName } = useDeviceName();
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null);
  const [showItems, setShowItems] = useState(false);

  const formatPrice = useCallback((value: number) => {
    return `$${Math.round(value).toLocaleString('es-UY')}`;
  }, []);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!selectedOrder || updatingStatus) return;

    setUpdatingStatus(newStatus);
    try {
      const updated = await updateOrderStatus(
        selectedOrder._id,
        newStatus,
        newStatus === 'delivered' ? deviceName : undefined
      );

      if (updated) {
        setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (contextLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <ThemedText style={styles.loadingText}>Cargando pedido...</ThemedText>
      </View>
    );
  }

  if (!selectedOrder) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="qr-code-scanner" size={64} color="#94A3B8" />
        <ThemedText style={styles.emptyTitle}>Sin pedido seleccionado</ThemedText>
        <ThemedText style={styles.emptyText}>
          Escanea un código QR o selecciona un pedido de la lista
        </ThemedText>
      </View>
    );
  }

  const currentStatus = selectedOrder.status || 'pending';
  const statusStyle = getStatusStyle(currentStatus);
  const orderId = selectedOrder.orderId !== undefined
    ? `#${selectedOrder.orderId}`
    : (selectedOrder.orderNumber ? `#${selectedOrder.orderNumber}` : selectedOrder._id.slice(-6));

  // Main statuses (4 buttons in grid)
  const mainStatuses: OrderStatus[] = ['pending', 'ready', 'shipped', 'delivered'];

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar Pedido',
      `¿Está seguro que quiere cancelar la Orden ${orderId}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => handleStatusUpdate('cancelled'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo-delivery.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Detalle de Pedido
        </ThemedText>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.label}>ORDEN DE COMPRA</ThemedText>
          <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusStyle.color }]} />
            <ThemedText style={[styles.badgeText, { color: statusStyle.color }]}>
              {statusStyle.label.toUpperCase()}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.orderNumber}>{orderId}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Información del Cliente</ThemedText>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialIcons name="person" size={18} color="#2563EB" />
          </View>
          <View style={styles.infoText}>
            <ThemedText type="defaultSemiBold">
              {selectedOrder.customerName || 'Sin nombre'}
            </ThemedText>
            <ThemedText style={styles.mutedText}>
              {selectedOrder.customerAddress || 'Sin dirección'}
            </ThemedText>
            {selectedOrder.customerNote && (
              <ThemedText style={styles.noteText}>
                {selectedOrder.customerNote}
              </ThemedText>
            )}
            {selectedOrder.customerPhone && (
              <ThemedText style={styles.mutedText}>
                Tel: {selectedOrder.customerPhone}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Detalle de productos */}
      {selectedOrder.items && selectedOrder.items.length > 0 && (
        <View style={styles.section}>
          <Pressable
            style={styles.itemsToggle}
            onPress={() => setShowItems(!showItems)}
          >
            <View style={styles.itemsToggleLeft}>
              <MaterialIcons name="shopping-cart" size={18} color="#2563EB" />
              <ThemedText style={styles.sectionTitle}>
                Productos ({selectedOrder.items.length})
              </ThemedText>
            </View>
            <MaterialIcons
              name={showItems ? 'expand-less' : 'expand-more'}
              size={24}
              color="#64748B"
            />
          </Pressable>
          {showItems && (
            <View style={styles.itemsContainer}>
              {selectedOrder.items.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.itemRow,
                    index < selectedOrder.items!.length - 1 && styles.itemRowBorder,
                  ]}
                >
                  <View style={styles.itemQty}>
                    <ThemedText style={styles.itemQtyText}>{item.quantity}</ThemedText>
                  </View>
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                    {item.brand && (
                      <ThemedText style={styles.itemBrand}>{item.brand}</ThemedText>
                    )}
                  </View>
                  <ThemedText style={styles.itemPrice}>
                    {formatPrice(item.subtotal)}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.itemsTotal}>
                <ThemedText style={styles.itemsTotalLabel}>Total</ThemedText>
                <ThemedText style={styles.itemsTotalValue}>
                  {formatPrice(selectedOrder.totals?.total ?? selectedOrder.total ?? 0)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Actualizar Estado</ThemedText>
        <View style={styles.grid}>
          {mainStatuses.map((status) => (
            <StatusButton
              key={status}
              status={status}
              onPress={() => handleStatusUpdate(status)}
              disabled={updatingStatus !== null}
              isCurrentStatus={status === currentStatus}
            />
          ))}
        </View>
        {updatingStatus && (
          <View style={styles.updatingRow}>
            <ActivityIndicator size="small" color="#1D4ED8" />
            <ThemedText style={styles.updatingText}>Actualizando estado...</ThemedText>
          </View>
        )}
        <ThemedText style={styles.footerText}>
          Última actualización: {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}
        </ThemedText>
        {selectedOrder.deliveredBy && (
          <ThemedText style={styles.footerText}>
            Entregado por: {selectedOrder.deliveredBy}
          </ThemedText>
        )}
      </View>

      {/* Cancel button - small and discrete */}
      {currentStatus !== 'cancelled' ? (
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
            updatingStatus !== null && styles.statusButtonDisabled,
          ]}
          onPress={handleCancelOrder}
          disabled={updatingStatus !== null}
        >
          <MaterialIcons name="cancel" size={16} color="#B91C1C" />
          <ThemedText style={styles.cancelButtonText}>Cancelar Pedido</ThemedText>
        </Pressable>
      ) : (
        <View style={styles.cancelledBadge}>
          <MaterialIcons name="cancel" size={16} color="#B91C1C" />
          <ThemedText style={styles.cancelledBadgeText}>Pedido Cancelado</ThemedText>
        </View>
      )}
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
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#94A3B8',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderNumber: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  mutedText: {
    color: '#64748B',
    fontSize: 13,
  },
  noteText: {
    color: '#0F172A',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemQty: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemQtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemBrand: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemsTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  itemsTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemsTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statusButton: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  statusButtonPressed: {
    opacity: 0.7,
  },
  statusButtonCurrent: {
    borderWidth: 2,
    borderColor: '#1D4ED8',
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusIconCircle: {
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  currentLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  updatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  updatingText: {
    color: '#1D4ED8',
    fontSize: 13,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 32,
  },
  cancelButtonPressed: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 40,
    marginBottom: 32,
  },
  cancelledBadgeText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
  },
});
