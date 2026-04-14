import { API_BASE_URL } from "./config";

/** Genel mağaza bayrakları (auth gerekmez). */
export async function getPublicShop(): Promise<{ salesEnabled: boolean; error?: string }> {
  try {
    const url = `${API_BASE_URL}/api/public/shop`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { salesEnabled: true };
    }
    const data = (await res.json()) as { salesEnabled?: boolean };
    return { salesEnabled: data.salesEnabled !== false };
  } catch {
    return { salesEnabled: true };
  }
}
