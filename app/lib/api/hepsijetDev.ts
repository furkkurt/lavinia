import { API_BASE_URL, getAuthToken } from "./config";

export type HepsijetDevStatus = {
  ok?: boolean;
  devApiEnabled: boolean;
  configured: boolean;
  baseUrl?: string;
  username?: string;
  companyName?: string;
  abbreviationCode?: string;
};

export type HepsijetDevResponse = {
  ok?: boolean;
  error?: string;
  httpStatus?: number;
  hepsijet?: unknown;
  tokenPreview?: string | null;
  tokenMetaPreview?: string | null;
};

export async function fetchHepsijetDevStatus(): Promise<HepsijetDevStatus | { ok: false; error: string }> {
  const res = await fetch("/api/hepsijet/test", { method: "GET", cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as HepsijetDevStatus;
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error || `HTTP ${res.status}` };
  }
  return data;
}

export async function hepsijetDevPost(
  body: { action: string; barcodes?: string[]; productGtin?: string }
): Promise<(HepsijetDevResponse & { fetchOk: boolean; fetchError?: string }) | { fetchOk: false; fetchError: string }> {
  const res = await fetch("/api/hepsijet/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as HepsijetDevResponse;
  if (!res.ok) {
    return { fetchOk: false, fetchError: data.error || `HTTP ${res.status}` };
  }
  return { ...data, fetchOk: true };
}

/** Kestrel `HepsiJet__*` + admin JWT — `/api/admin/hepsijet/pod-test` */
export type KestrelHepsiJetPodTestBody = {
  recipientCompanyAddressId?: string;
  receiverFirstName?: string;
  receiverLastName?: string;
  receiverPhone?: string;
  receiverEmail?: string;
  recipientCity?: string;
  recipientTown?: string;
  recipientDistrict?: string;
  recipientAddressLine1?: string;
  customerDeliveryNo?: string;
  deliveryDateOriginal?: string;
};

export type KestrelHepsiJetPodTestResult = {
  fetchOk: boolean;
  httpStatus: number;
  json: unknown;
  fetchError?: string;
};

/**
 * SimplCommerce API POD testi (docker/api .env içindeki HepsiJet__*).
 * Yönetim panelinde giriş yapılmış olmalı (localStorage authToken / access_token).
 */
export async function postKestrelHepsiJetPodTest(
  body: KestrelHepsiJetPodTestBody = {}
): Promise<KestrelHepsiJetPodTestResult> {
  const token = getAuthToken();
  if (!token) {
    return {
      fetchOk: false,
      httpStatus: 401,
      json: null,
      fetchError: "Admin oturumu yok. Önce yönetim girişi yapın (authToken).",
    };
  }

  const url = `${API_BASE_URL}/api/admin/hepsijet/pod-test`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = { raw: text };
      }
    }

    return {
      fetchOk: res.ok,
      httpStatus: res.status,
      json,
      fetchError: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      fetchOk: false,
      httpStatus: 0,
      json: null,
      fetchError: e instanceof Error ? e.message : "Ağ hatası",
    };
  }
}
