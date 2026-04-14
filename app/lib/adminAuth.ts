export function adminHeaders(json = true): HeadersInit {
  if (typeof window === "undefined") {
    return json ? { "Content-Type": "application/json" } : {};
  }
  const token = localStorage.getItem("access_token");
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export function fileNameFromUploadUrl(url: string): string {
  try {
    const u = new URL(url, "http://local");
    const seg = u.pathname.split("/").filter(Boolean);
    return decodeURIComponent(seg[seg.length - 1] ?? "");
  } catch {
    const parts = url.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? "");
  }
}
