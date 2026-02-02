import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type StatusButtonProps = {
  label: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  backgroundColor: string;
};

function StatusButton({ label, icon, color, backgroundColor }: StatusButtonProps) {
  return (
    <Pressable style={[styles.statusButton, { backgroundColor }]}>
      <View style={[styles.statusIconCircle, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={20} color="#FFFFFF" />
      </View>
      <ThemedText style={[styles.statusLabel, { color }]}>{label}</ThemedText>
    </Pressable>
  );
}

export function OrderDetail() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="chevron-left" size={24} color="#111827" />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Detalle de Pedido
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.label}>ORDEN DE COMPRA</ThemedText>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <ThemedText style={styles.badgeText}>PENDIENTE</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.orderNumber}>#123456789</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Información del Cliente</ThemedText>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialIcons name="person" size={18} color="#2563EB" />
          </View>
          <View style={styles.infoText}>
            <ThemedText type="defaultSemiBold">Daniel Rodríguez</ThemedText>
            <ThemedText style={styles.mutedText}>
              Francisco Romero 3733, CABA, Argentina
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Actualizar Estado</ThemedText>
        <View style={styles.grid}>
          <StatusButton
            label="PREPARADO"
            icon="inventory-2"
            color="#F59E0B"
            backgroundColor="#FFF7E6"
          />
          <StatusButton
            label="ENVIADO"
            icon="local-shipping"
            color="#3B82F6"
            backgroundColor="#EAF2FF"
          />
          <StatusButton
            label="ENTREGADO"
            icon="check-circle"
            color="#22C55E"
            backgroundColor="#EAF9F0"
          />
          <StatusButton
            label="CANCELADO"
            icon="cancel"
            color="#EF4444"
            backgroundColor="#FDECEC"
          />
        </View>
        <ThemedText style={styles.footerText}>Última actualización: Hoy 10:45 AM</ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
  },
  headerSpacer: {
    width: 36,
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
    backgroundColor: '#FFF3D1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statusButton: {
    width: '48%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
  },
  statusIconCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
