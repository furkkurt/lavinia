import { apiFetch } from './config';

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

export async function getCart(): Promise<Cart | null> {
  const response = await apiFetch<Cart>('/api/cart');
  if (response.error) return null;
  return response.data || null;
}

export async function getCartCount(): Promise<number> {
  const response = await apiFetch<{ count: number }>('/api/cart/count');
  return response.data?.count || 0;
}

export async function addToCart(productId: number, quantity: number = 1): Promise<{ success: boolean; cartItemCount?: number; error?: string }> {
  const response = await apiFetch<{ success: boolean; cartItemCount: number }>('/api/cart/add-item', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });

  if (response.error) {
    return { success: false, error: response.error };
  }

  return { success: true, cartItemCount: response.data?.cartItemCount };
}

export async function updateCartQuantity(productId: number, quantity: number): Promise<boolean> {
  const response = await apiFetch('/api/cart/update-quantity', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity }),
  });
  return !response.error;
}

export async function removeFromCart(productId: number): Promise<boolean> {
  const response = await apiFetch(`/api/cart/remove-item/${productId}`, {
    method: 'DELETE',
  });
  return !response.error;
}
