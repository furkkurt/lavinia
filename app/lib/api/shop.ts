import { API_BASE_URL } from "./config";

/** Admin /dev: test siparişi butonunu /odeme’de göstermek için localStorage anahtarı. */
export const LAVINIA_CHECKOUT_TEST_UI_KEY = "lavinia_checkoutTestUi";

/** Genel mağaza bayrakları (auth gerekmez). */
export async function getPublicShop(): Promise<{
  salesEnabled: boolean;
  /** API’de `Checkout:TestCheckoutEnabled` açıksa; test siparişi endpoint’i kullanılabilir. */
  testCheckoutEnabled: boolean;
  error?: string;
}> {
  try {
    const url = `${API_BASE_URL}/api/public/shop`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { salesEnabled: true, testCheckoutEnabled: false };
    }
    const data = (await res.json()) as { salesEnabled?: boolean; testCheckoutEnabled?: boolean };
    return {
      salesEnabled: data.salesEnabled !== false,
      testCheckoutEnabled: data.testCheckoutEnabled === true,
    };
  } catch {
    return { salesEnabled: true, testCheckoutEnabled: false };
  }
}
