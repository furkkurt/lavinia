import { apiFetch } from "./config";

export interface AppSettingItem {
  key: string;
  value: string;
}

/** Admin: tüm görünür Core_AppSetting kayıtları (Orders.* dahil) */
export async function getAppSettings(): Promise<{ success: boolean; data?: AppSettingItem[]; error?: string }> {
  const res = await apiFetch<Array<{ key: string; value: string }>>("/api/appsettings");
  if (res.error || !res.data) {
    return { success: false, error: res.error || "Ayarlar yüklenemedi" };
  }
  const data = res.data.map((x) => ({ key: x.key, value: x.value ?? "" }));
  return { success: true, data };
}

/** Admin: PUT tüm listeyi gönderir (API mevcut davranışı) */
export async function putAppSettings(items: AppSettingItem[]): Promise<{ success: boolean; error?: string }> {
  const body = items.map((x) => ({ key: x.key, value: x.value }));
  const res = await apiFetch<unknown>("/api/appsettings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true };
}
