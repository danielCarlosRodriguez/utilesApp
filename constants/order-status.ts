import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { OrderStatus } from '@/services/api';

export type StatusStyle = {
  label: string;
  color: string;
  backgroundColor: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
};

// Colores consistentes con utilesAdmin (Tailwind equivalents)
// pending: blue-100/blue-700
// ready: amber-100/amber-600
// shipped: purple-100/purple-700
// delivered: emerald-100/emerald-700
// cancelled: red-100/red-700

export const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  pending: {
    label: 'Pedido Recibido',
    color: '#1D4ED8',       // blue-700
    backgroundColor: '#DBEAFE', // blue-100
    icon: 'schedule',
  },
  ready: {
    label: 'Preparado',
    color: '#D97706',       // amber-600
    backgroundColor: '#FEF3C7', // amber-100
    icon: 'inventory-2',
  },
  shipped: {
    label: 'En Camino',
    color: '#7C3AED',       // purple-700
    backgroundColor: '#EDE9FE', // purple-100
    icon: 'local-shipping',
  },
  delivered: {
    label: 'Entregado',
    color: '#047857',       // emerald-700
    backgroundColor: '#D1FAE5', // emerald-100
    icon: 'check-circle',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#B91C1C',       // red-700
    backgroundColor: '#FEE2E2', // red-100
    icon: 'cancel',
  },
};

export function getStatusStyle(status?: OrderStatus): StatusStyle {
  if (!status || !STATUS_STYLES[status]) {
    return STATUS_STYLES.pending;
  }
  return STATUS_STYLES[status];
}
