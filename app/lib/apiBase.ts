import { API_BASE_URL, PUBLIC_ASSET_BASE_URL } from "@/app/lib/api/config";

/** Sunucu `fetch` / koleksiyon API’si için (iç ağ adresi olabilir). */
export function getApiBase(): string {
  return API_BASE_URL;
}

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const u = new URL(path);
      if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
        return `${u.pathname}${u.search}${u.hash}` || "";
      }
    } catch {
      /* ignore */
    }
    return path;
  }
  const base = PUBLIC_ASSET_BASE_URL;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function adminAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const t = localStorage.getItem("authToken") || localStorage.getItem("access_token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}
