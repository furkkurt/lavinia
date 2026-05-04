import { apiFetch } from "./config";
import { quickSearchUsers, getUser, type User } from "./users";

export type AdminSearchResource = "products" | "users" | "orders";

export type AdminSearchProductHit = { id: number; name: string; sku?: string | null };
export type AdminSearchOrderHit = {
  id: number;
  customerName: string;
  orderStatus: string;
  createdOn: string;
};

export async function adminSearchProducts(
  q: string,
  by: "name" | "sku" | "id"
): Promise<AdminSearchProductHit[]> {
  const response = await apiFetch<AdminSearchProductHit[]>(
    `/api/products/admin-quick-search?${new URLSearchParams({ q, by }).toString()}`
  );
  if (response.error) return [];
  const d = response.data;
  return Array.isArray(d) ? d : [];
}

export async function adminSearchOrders(
  q: string,
  by: "id" | "customerName"
): Promise<AdminSearchOrderHit[]> {
  const response = await apiFetch<AdminSearchOrderHit[]>(
    `/api/orders/admin-quick-search?${new URLSearchParams({ q, by }).toString()}`
  );
  if (response.error) return [];
  const d = response.data;
  return Array.isArray(d) ? d : [];
}

export async function adminSearchUsers(
  q: string,
  by: "fullName" | "email" | "id"
): Promise<User[]> {
  const t = q.trim();
  if (!t) return [];

  if (by === "id") {
    const id = parseInt(t, 10);
    if (Number.isNaN(id) || id < 1) return [];
    const u = await getUser(id);
    return u ? [u] : [];
  }

  if (by === "fullName") {
    const list = await quickSearchUsers(t, undefined);
    return list ?? [];
  }

  const list = await quickSearchUsers(undefined, t);
  return list ?? [];
}
