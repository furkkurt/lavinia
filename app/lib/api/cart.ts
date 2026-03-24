import { apiFetch, getAuthToken } from './config';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  productPrice: number;
  productPriceString: string;
  quantity: number;
  total: number;
  totalString: string;
}

export interface Cart {
  items: CartItem[];
  subTotal: number;
  subTotalString: string;
  discount: number;
  discountString: string;
  subTotalWithDiscount: number;
  subTotalWithDiscountString: string;
  itemCount: number;
}

export interface CartResult {
  cart: Cart | null;
  requiresAuth: boolean;
  error?: string;
}

export function isLoggedIn(): boolean {
  return !!getAuthToken();
}

export function dispatchCartUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export async function getCart(): Promise<CartResult> {
  const response = await apiFetch<Cart>('/api/cart');
  if (response.status === 401) {
    return { cart: null, requiresAuth: true };
  }
  if (response.error) {
    return { cart: null, requiresAuth: false, error: response.error };
  }
  return { cart: response.data || null, requiresAuth: false };
}

export async function getCartCount(): Promise<number> {
  const response = await apiFetch<{ count: number }>('/api/cart/count');
  return response.data?.count || 0;
}

export async function addToCart(productId: number, quantity: number = 1): Promise<{ success: boolean; cartItemCount?: number; error?: string; requiresAuth?: boolean }> {
  const response = await apiFetch<{ success: boolean; cartItemCount: number }>('/api/cart/add-item', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });

  if (response.status === 401) {
    return { success: false, requiresAuth: true, error: 'Sepete ürün eklemek için giriş yapmalısınız.' };
  }

  if (response.error) {
    return { success: false, error: response.error };
  }

  dispatchCartUpdate();
  return { success: true, cartItemCount: response.data?.cartItemCount };
}

export async function updateCartQuantity(productId: number, quantity: number): Promise<boolean> {
  const response = await apiFetch('/api/cart/update-quantity', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity }),
  });
  if (!response.error) {
    dispatchCartUpdate();
    return true;
  }
  return false;
}

export async function removeFromCart(productId: number): Promise<boolean> {
  const response = await apiFetch(`/api/cart/remove-item/${productId}`, {
    method: 'DELETE',
  });
  if (!response.error) {
    dispatchCartUpdate();
    return true;
  }
  return false;
}
