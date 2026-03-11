import { apiFetch } from './config';

export interface CheckoutSummary {
  id: string;
  items: {
    productId: number;
    productName: string;
    productImage: string;
    productPrice: number;
    productPriceString: string;
    quantity: number;
    total: number;
    totalString: string;
  }[];
  subTotal: number;
  subTotalString: string;
  discount: number;
  discountString: string;
  taxAmount: number;
  shippingAmount: number;
  orderTotal: number;
  orderTotalString: string;
}

export interface CheckoutResult {
  orderId: number;
  orderTotal: number;
  orderTotalString: string;
}

export async function createCheckout(): Promise<{ checkoutId: string } | null> {
  const response = await apiFetch<{ checkoutId: string }>('/api/checkout/create', {
    method: 'POST',
  });
  if (response.error) return null;
  return response.data || null;
}

export async function getCheckoutSummary(checkoutId: string): Promise<CheckoutSummary | null> {
  const response = await apiFetch<CheckoutSummary>(`/api/checkout/${checkoutId}/summary`);
  if (response.error) return null;
  return response.data || null;
}

export async function completeCheckout(
  checkoutId: string,
  shippingAddressId: number,
  orderNote?: string
): Promise<{ success: boolean; data?: CheckoutResult; error?: string }> {
  const response = await apiFetch<CheckoutResult>(`/api/checkout/${checkoutId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ shippingAddressId, orderNote }),
  });

  if (response.error) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data! };
}
