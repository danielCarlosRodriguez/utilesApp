const API_BASE_URL = 'https://utilesya-f43ef34adf2b.herokuapp.com';

export type OrderStatus = 'pending' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

export type Order = {
  _id: string;
  orderNumber?: string;
  orderId?: number;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerNote?: string;
  status?: OrderStatus;
  total?: number;
  items?: Array<{
    refid?: string;
    title: string;
    brand?: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  totals?: {
    itemsCount: number;
    subtotal: number;
    total: number;
  };
  createdAt?: string;
  updatedAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/utiles/orders`);
    const json: ApiResponse<Order[]> = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function fetchOrder(id: string): Promise<Order | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/utiles/orders/${id}`);
    const json: ApiResponse<Order> = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function registerPushToken(
  token: string,
  deviceName: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, deviceName })
    });
    const json: ApiResponse<null> = await response.json();
    return json.success === true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

export type Product = {
  _id?: string;
  refid: string;
  descripción: string;
  categoría?: string;
  categoryId?: string | { $oid?: string };
  precio: number;
  stock: number;
  activo: boolean;
  marca: string;
  imagen: string[];
  imagenCloudinary?: string[];
  sku: string;
  destacado: boolean;
  descuento: number | null;
  tags: string[];
  detalle?: string;
};

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/utiles/products`);
    const json: ApiResponse<Product[]> = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  deviceName?: string
): Promise<Order | null> {
  try {
    const url = deviceName
      ? `${API_BASE_URL}/api/order/${id}/${status}?device=${encodeURIComponent(deviceName)}`
      : `${API_BASE_URL}/api/order/${id}/${status}`;

    const response = await fetch(url);
    const json: ApiResponse<Order> = await response.json();

    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
}
