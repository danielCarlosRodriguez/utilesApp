import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { fetchOrder, type Order } from '@/services/api';

type QRData = {
  id: string;
  orderNumber: string;
  status: string;
};

type OrderContextType = {
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  isLoading: boolean;
  loadOrderFromQR: (qrData: QRData) => Promise<void>;
  loadOrderById: (id: string) => Promise<void>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

function decodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;

  const input = str.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < input.length) {
    const enc1 = chars.indexOf(input.charAt(i++));
    const enc2 = chars.indexOf(input.charAt(i++));
    const enc3 = chars.indexOf(input.charAt(i++));
    const enc4 = chars.indexOf(input.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }

  return output;
}

function parseQRUrl(url: string): QRData | null {
  try {
    const match = url.match(/\/order\/(.+)/);
    if (!match) return null;

    const base64 = match[1];
    const json = decodeBase64(base64);
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing QR URL:', error);
    return null;
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrderById = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const order = await fetchOrder(id);
      if (order) {
        setSelectedOrder(order);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOrderFromQR = useCallback(async (qrData: QRData) => {
    await loadOrderById(qrData.id);
  }, [loadOrderById]);

  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const qrData = parseQRUrl(event.url);
    if (qrData) {
      await loadOrderFromQR(qrData);
    }
  }, [loadOrderFromQR]);

  useEffect(() => {
    // Handle deep link when app is opened from QR
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Handle deep link when app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return (
    <OrderContext.Provider
      value={{
        selectedOrder,
        setSelectedOrder,
        isLoading,
        loadOrderFromQR,
        loadOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
}
