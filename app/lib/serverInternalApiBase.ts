import type { NextRequest } from "next/server";

/**
 * Route Handler’lar için SimplCommerce kökü. İstemci paketine girmemeli.
 * Önce çalışma anı `API_INTERNAL_URL` (PM2 / Docker), sonra build’de gömülü `NEXT_PUBLIC_*`.
 */
export function serverInternalApiBase(): string {
  const raw =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:5000";
  return raw.replace(/\/$/, "");
}

/** İstemciden gelen Bearer’ı Kestrel’e ilet (özel `app/api/users/*` proxy’leri bunu unutmuştu → 401). */
export function bearerFromRequest(request: NextRequest): Record<string, string> {
  const auth = request.headers.get("authorization");
  if (!auth?.trim()) return {};
  return { Authorization: auth.trim() };
}
