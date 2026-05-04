import { apiFetch } from './config';

export interface CheckoutSummary {
  id: string;
  items: {
    productId: number;
    productName: string;
    productImage: string;
    productPrice: number;
    productPriceString: string;
    compareAtPrice?: number | null;
    compareAtPriceString?: string | null;
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

export interface GuestShippingAddress {
  contactName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  zipCode?: string;
  stateOrProvinceId?: number;
  countryId?: string;
}

export async function completeCheckout(
  checkoutId: string,
  shippingAddressId: number,
  orderNote?: string,
  guestShippingAddress?: GuestShippingAddress
): Promise<{ success: boolean; data?: CheckoutResult; error?: string }> {
  const body: { shippingAddressId: number; orderNote?: string; guestShippingAddress?: GuestShippingAddress } = {
    shippingAddressId,
    orderNote,
  };
  if (guestShippingAddress) {
    body.guestShippingAddress = guestShippingAddress;
  }

  const response = await apiFetch<CheckoutResult>(`/api/checkout/${checkoutId}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (response.error) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data! };
}

/**
 * Geliştirme: stok azaltılmaz, PayTR yok. API’de `Checkout:TestCheckoutEnabled` gerekir.
 */
export async function completeTestCheckout(
  checkoutId: string,
  shippingAddressId: number,
  orderNote: string | undefined,
  guestShippingAddress: GuestShippingAddress | undefined
): Promise<{ success: boolean; data?: CheckoutResult; error?: string }> {
  const body: {
    shippingAddressId: number;
    orderNote?: string;
    guestShippingAddress?: GuestShippingAddress;
  } = { shippingAddressId, orderNote };
  if (guestShippingAddress) {
    body.guestShippingAddress = guestShippingAddress;
  }
  const response = await apiFetch<CheckoutResult & { testCheckout?: boolean }>(
    `/api/checkout/${checkoutId}/complete-test`,
    { method: "POST", body: JSON.stringify(body) }
  );
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data! };
}

export interface PayTrPrepareBody {
  email: string;
  shippingAddressId: number;
  orderNote?: string;
  guestShippingAddress?: GuestShippingAddress;
}

/** PayTR öncesi: teslimat + e-posta checkout ShippingData’ya yazılır. */
export async function preparePayTrCheckout(
  checkoutId: string,
  body: PayTrPrepareBody
): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch<{ ok: boolean }>(`/api/checkout/${checkoutId}/prepare-paytr`, {
    method: "POST",
    body: JSON.stringify({
      email: body.email.trim(),
      shippingAddressId: body.shippingAddressId,
      orderNote: body.orderNote,
      ...(body.guestShippingAddress ? { guestShippingAddress: body.guestShippingAddress } : {}),
    }),
  });

  if (response.error) {
    return { success: false, error: response.error };
  }

  return { success: true };
}
