import { apiFetch, API_BASE_URL, getAuthToken } from './config';

export interface OrderListItem {
  id: number;
  createdOn: string;
  orderStatus: number;
  orderStatusString: string;
  orderStatusDisplay: string;
  subTotal: number;
  subTotalString: string;
  orderTotal: number;
  orderTotalString: string;
  paymentMethod: string;
  shippingMethod: string;
  itemCount: number;
}

export interface OrderDetail {
  id: number;
  createdOn: string;
  orderStatus: number;
  orderStatusString: string;
  orderStatusDisplay: string;
  customerName: string;
  customerEmail: string;
  subTotal: number;
  subTotalString: string;
  discountAmount: number;
  discountAmountString: string;
  taxAmount: number;
  taxAmountString: string;
  shippingAmount: number;
  shippingAmountString: string;
  orderTotal: number;
  orderTotalString: string;
  paymentMethod: string;
  shippingMethod: string;
  orderNote?: string;
  shippingAddress: {
    contactName: string;
    phone: string;
    addressLine1: string;
    city?: string;
    districtName?: string;
    stateOrProvinceName?: string;
    countryName?: string;
    zipCode?: string;
  };
  orderItems: OrderItemDetail[];
  /** Müşteri iptali: dakika cinsinden pencere (API) */
  customerCancellationMinutes?: number;
  /** Sadece rakamlar, wa.me için */
  supportWhatsAppDigits?: string;
  /** ISO-8601 son iptal anı */
  cancellationDeadline?: string;
  canCancelByCustomer?: boolean;
}

export interface OrderItemDetail {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  productPrice: number;
  productPriceString: string;
  quantity: number;
  total: number;
  totalString: string;
  discountAmount: number;
  taxAmount: number;
}

// User-facing order APIs (backend [Authorize] + Bearer; 401 = giriş yok / süresi dolmuş token / issuer uyumsuz)
export async function getUserOrders(): Promise<OrderListItem[]> {
  const response = await apiFetch<OrderListItem[]>('/api/user/orders');
  return response.data || [];
}

export async function getUserOrder(id: number): Promise<OrderDetail | null> {
  const response = await apiFetch<OrderDetail>(`/api/user/orders/${id}`);
  if (response.error) return null;
  return response.data || null;
}

export async function cancelUserOrder(id: number): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch<{ message?: string }>(`/api/user/orders/${id}/cancel`, {
    method: "POST",
    body: "{}",
  });
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true };
}

// Admin order APIs
export interface AdminOrderListItem {
  id: number;
  customerName: string;
  orderTotal: number;
  orderTotalString: string;
  orderStatus: string;
  createdOn: string;
}

export async function getAdminOrders(params?: {
  pageIndex?: number;
  pageSize?: number;
}): Promise<{ items: AdminOrderListItem[]; totalRecord: number } | null> {
  const pageIndex = params?.pageIndex || 0;
  const pageSize = params?.pageSize || 20;

  const response = await apiFetch<{ items: AdminOrderListItem[]; totalRecord: number }>('/api/orders/grid', {
    method: 'POST',
    body: JSON.stringify({
      pagination: { start: pageIndex * pageSize, number: pageSize },
      sort: { predicate: 'Id', reverse: true },
      search: { predicateObject: {} },
    }),
  });

  if (response.error) return null;
  return response.data || null;
}

export async function getAdminOrder(id: number): Promise<OrderDetail | null> {
  const response = await apiFetch<OrderDetail>(`/api/orders/${id}`);
  if (response.error) return null;
  return response.data || null;
}

export async function changeOrderStatus(orderId: number, statusId: number, note?: string): Promise<boolean> {
  const response = await apiFetch(`/api/orders/change-order-status/${orderId}`, {
    method: 'POST',
    body: JSON.stringify({ statusId, note: note || '' }),
  });
  return !response.error;
}

export interface OrderStatusOption {
  id: number;
  name: string;
}

export async function getOrderStatuses(): Promise<OrderStatusOption[]> {
  const response = await apiFetch<OrderStatusOption[]>('/api/orders/order-status');
  return response.data || [];
}

export interface OrderStatistics {
  totalRevenue: number;
  totalOrders: number;
  thisMonthRevenue: number;
  thisWeekRevenue: number;
  avgOrderValue: number;
  statusCounts: { status: string; count: number }[];
  topProducts: { productId: number; name: string; totalQuantity: number; totalRevenue: number }[];
  monthlyRevenue: { year: number; month: number; revenue: number; orderCount: number }[];
}

export async function getOrderStatistics(months?: number | null): Promise<OrderStatistics | null> {
  const q =
    months != null && months > 0 ? `?months=${encodeURIComponent(String(months))}` : "";
  const response = await apiFetch<OrderStatistics>(`/api/orders/statistics${q}`);
  if (response.error) return null;
  return response.data || null;
}

export function getInvoiceUrl(orderId: number): string {
  const token = getAuthToken();
  return `${API_BASE_URL}/api/invoices/print/${orderId}?access_token=${token}`;
}

/** Fetch invoice with Bearer token and open in new tab */
export async function downloadInvoicePdf(orderId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    alert('Fatura indirmek için giriş yapmanız gerekiyor.');
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/invoices/print/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) {
        alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        alert(`Fatura indirilemedi: ${response.status}`);
      }
      return;
    }
    const contentType = response.headers.get('content-type') || '';
    const blob = await response.blob();
    const blobType = contentType.includes('text/html') ? 'text/html' : 'application/pdf';
    const url = URL.createObjectURL(new Blob([blob], { type: blobType }));
    const w = window.open(url, '_blank');
    if (w) w.focus();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    console.error('Invoice download error:', err);
    alert('Fatura indirilemedi.');
  }
}
