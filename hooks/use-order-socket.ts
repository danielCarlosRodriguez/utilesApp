import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Order, OrderStatus } from '@/services/api';

const API_BASE_URL = 'https://utilesya-f43ef34adf2b.herokuapp.com';

export interface OrderUpdatedEvent {
  orderId: string;
  status: OrderStatus;
  order: Order;
}

interface UseOrderSocketOptions {
  onOrderUpdated?: (event: OrderUpdatedEvent) => void;
}

export function useOrderSocket(options: UseOrderSocketOptions = {}) {
  const { onOrderUpdated } = options;
  const socketRef = useRef<Socket | null>(null);
  const onOrderUpdatedRef = useRef(onOrderUpdated);

  useEffect(() => {
    onOrderUpdatedRef.current = onOrderUpdated;
  }, [onOrderUpdated]);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join:admin');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('order:updated', (event: OrderUpdatedEvent) => {
      console.log('Order updated via socket:', event.orderId, event.status);
      if (onOrderUpdatedRef.current) {
        onOrderUpdatedRef.current(event);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current };
}
